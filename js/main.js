import { $ } from './core/dom.js';
import { emit } from './core/events.js';
import { indexRoute, nextMessage, nextPublished, isPublished } from './domain/curriculum.js';
import { XP } from './domain/gamification.js';
import { renderRouteInfo, renderRouteMap, renderSyllabus, renderTabs } from './features/catalog.js';
import { completedFor, initGamification } from './features/gamification.js';
import { renderLesson } from './features/lesson.js';
import { mountQuiz } from './features/quiz.js';
import { on } from './core/events.js';
import { loadCurricula } from './repositories/content-repository.js';

let routes = [];
let activeId = 'fundamentos';
let renderedId = null;

const routeById = (id) => routes.find((route) => route.id === id);

function refreshCatalog() {
  const route = routeById(activeId);
  const open = renderedId === activeId ? [...$('tem').querySelectorAll('details')].map((d) => d.open) : null;
  $('tabs').innerHTML = renderTabs(routes, activeId);
  $('rinfo').innerHTML = renderRouteInfo(route);
  $('tem').innerHTML = renderSyllabus(route, completedFor(route.id));
  if (open) $('tem').querySelectorAll('details').forEach((d, i) => { d.open = open[i]; });
  renderedId = activeId;
}

function describeResult(route, meta, { passed, weak }) {
  if (!passed) {
    return { text: `Aún no llegas al 80%. Repasa estos conceptos y vuelve a intentarlo: ${weak.join(', ')}.` };
  }
  const first = !completedFor(route.id).has(meta.id);
  emit('quiz:passed', { routeId: route.id, lessonId: meta.id });
  const next = nextPublished(route, meta.id);
  const bonus = first ? ` Ganaste ${XP.lessonPassed} XP extra.` : '';
  return {
    text: `Superaste el 80%. ${nextMessage(route, meta.id)}${bonus}`,
    actions: next ? [{ label: `Ir a la lección ${route.pos[next.id] + 1}`, onClick: () => openLesson(route.id, next.id) }] : [],
  };
}

async function openLesson(routeId, lessonId, { scroll = true } = {}) {
  const route = routeById(routeId);
  const meta = route.lessons[route.pos[lessonId]];
  try {
    const data = await renderLesson(route, meta);
    $('ql').textContent = `${data.quiz.length} preguntas. Necesitas al menos 80% para desbloquear la siguiente lección.`;
    mountQuiz({ box: $('qbox'), questions: data.quiz, onFinish: (summary) => describeResult(route, meta, summary) });
    if (scroll) $('leccion').scrollIntoView({ behavior: 'smooth' });
  } catch (error) {
    $('lesson').textContent = `No se pudo cargar la lección. ${error.message}`;
  }
}

function selectRoute(id) {
  activeId = id;
  refreshCatalog();
}

function bindEvents() {
  $('mapa').addEventListener('click', (event) => {
    const target = event.target.closest('button[data-route]');
    if (!target) return;
    selectRoute(target.dataset.route);
    $('temario').scrollIntoView({ behavior: 'smooth' });
  });
  $('tabs').addEventListener('click', (event) => {
    const target = event.target.closest('button[data-route]');
    if (target) selectRoute(target.dataset.route);
  });
  $('tem').addEventListener('click', (event) => {
    const target = event.target.closest('button[data-lesson]');
    if (target && !target.disabled) openLesson(activeId, target.dataset.lesson);
  });
  on('progress:changed', refreshCatalog);
}

async function boot() {
  routes = (await loadCurricula()).map(indexRoute);
  initGamification();
  $('mapa').innerHTML = renderRouteMap(routes);
  bindEvents();
  refreshCatalog();
  const first = routeById(activeId).lessons.find(isPublished);
  await openLesson(activeId, first.id, { scroll: false });
}

export const ready = boot().catch((error) => {
  $('lesson').textContent = `No se pudo iniciar TeslaCode. ${error.message}`;
});
