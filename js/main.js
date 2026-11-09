import { mountStudio } from './features/studio.js';
import { $ } from './core/dom.js';
import { escapeHtml as e } from './core/html.js';
import { progressRepository, PROGRESS_KEY, withProgressLock } from './core/storage.js';
import { loadCurricula, loadLesson, loadConcepts } from './repositories/content-repository.js';
import { indexRoute, isUnlocked, nextLesson, lessonKey, isPublished } from './domain/curriculum.js';
import { recordAttempt, completeIfReady } from './domain/progress.js';
import { updateStreak } from './domain/gamification.js';
import {
  homePage,
  routesPage,
  routePage,
  inspector,
  practicePage,
  progressPage,
  lessonHref,
} from './features/catalog.js';
import { lessonPage, mountActivities } from './features/lesson.js';
import { mountQuiz } from './features/quiz.js';
import { widgets } from './widgets/index.js';
import { mountSupport, mountOrientation } from './features/learning-support.js';
import { mountProgressImport } from './features/progress-import.js';
import { mountCodeExamples } from './features/code-activity.js';

let routes = [],
  concepts = new Map(),
  renderVersion = 0,
  filter = 'all',
  toastTimer;
let disposeView = () => {};
let pendingSaves = 0;
const state = progressRepository.load();
function toast(message) {
  clearTimeout(toastTimer);
  $('toast').textContent = message;
  $('toast').hidden = false;
  toastTimer = setTimeout(() => ($('toast').hidden = true), 4200);
}
function refreshProgress() {
  $('xp').textContent = `${state.xp} XP`;
  $('racha').textContent = `♨ ${state.streak.count} ${state.streak.count === 1 ? 'día' : 'días'}`;
}
function save() {
  pendingSaves++;
  const persist = () => {
    const persisted = progressRepository.save(state);
    refreshProgress();
    if (!persisted)
      toast('No pudimos guardar en este navegador. Conserva una copia desde Mi progreso.');
    return persisted;
  };
  const done = () => {
    pendingSaves--;
  };
  refreshProgress();
  try {
    const task = withProgressLock(persist);
    if (task?.then) return task.catch(() => toast('No pudimos guardar el progreso.')).finally(done);
    done();
    return task;
  } catch {
    done();
    toast('No pudimos guardar el progreso.');
  }
}
function selectNode(route, id) {
  const lesson =
    route.lessons.find((l) => l.id === id) ??
    nextLesson(route, new Set(state.completed)) ??
    route.lessons[0];
  $('node-inspector').innerHTML = inspector(route, lesson, state, routes);
  document.querySelectorAll('[data-node]').forEach((button) => {
    const selected = button.dataset.node === lesson.id;
    button.setAttribute('aria-pressed', String(selected));
    if (selected) button.closest('details.level').open = true;
  });
}
function updateCompletion(route, meta, data) {
  const key = lessonKey(route.id, meta.id),
    wasComplete = state.completed.includes(key);
  const complete = completeIfReady(state, key, data);
  if (complete && !wasComplete) toast('¡Una nueva habilidad! Lección completada · +50 XP');
  if ($('lesson-status')) {
    $('lesson-status').textContent = complete ? '✓ Completada' : 'Aprende · Practica · Comprueba';
    $('lesson-status').classList.toggle('live', complete);
  }
  const saved = save();
  return { complete, saved };
}
const labContext = {
  isSolved: (id) => state.practices.includes(`lab/${id}`),
  solve(id) {
    const key = `lab/${id}`;
    if (state.practices.includes(key)) return;
    state.practices.push(key);
    state.streak = updateStreak(state.streak);
    save();
  },
};
async function mountLabs(root, version) {
  for (const el of root.querySelectorAll('[data-lab]')) {
    const widget = await widgets[el.dataset.lab]();
    if (version !== renderVersion) return;
    widget.mount(el, labContext);
  }
}
async function render() {
  disposeView();
  disposeView = () => {};
  const version = ++renderVersion;
  const raw = location.hash.replace(/^#\/?/, '').split('/');
  const [view = 'inicio', rid, lid, requestedTab] = raw;
  const route = routes.find((r) => r.id === rid);
  const nav = { ruta: 'rutas', leccion: 'rutas' }[view] ?? view;
  document.body.dataset.view = view;
  document.querySelectorAll('[data-nav]').forEach((link) => {
    if (link.dataset.nav === nav) link.setAttribute('aria-current', 'page');
    else link.removeAttribute('aria-current');
  });
  $('search-results').hidden = true;
  $('breadcrumb').textContent =
    {
      inicio: 'Mi aprendizaje',
      rutas: 'Explorar rutas',
      ruta: route?.name,
      leccion: route?.name,
      practica: 'Laboratorio',
      progreso: 'Mi progreso',
    }[view] ?? 'TeslaCode';
  document
    .querySelectorAll('[data-route]')
    .forEach((link) =>
      link.classList.toggle('active-route', link.dataset.route === (rid ?? state.goal)),
    );
  const root = $('content');
  try {
    if (view === 'inicio') {
      root.innerHTML = homePage(routes, state);
      disposeView = mountStudio(root, routes, (id) => {
        state.goal = id;
        state.recent = null;
        save();
        render();
      });
      const control = $('motion-toggle');
      const refreshMotion = () => {
        const paused = document.documentElement.dataset.motion === 'off';
        control.setAttribute('aria-pressed', String(paused));
        control.setAttribute(
          'aria-label',
          paused ? 'Activar efecto holográfico' : 'Pausar efecto holográfico',
        );
        control.textContent = paused ? 'Activar efecto' : 'Pausar efecto';
      };
      refreshMotion();
      control.onclick = () => {
        const value = document.documentElement.dataset.motion === 'off' ? 'on' : 'off';
        document.documentElement.dataset.motion = value;
        try {
          localStorage.setItem('teslacode:motion', value);
        } catch {}
        refreshMotion();
      };
    } else if (view === 'rutas') {
      root.innerHTML = routesPage(routes, state, filter);
      root.querySelectorAll('[data-filter]').forEach(
        (button) =>
          (button.onclick = () => {
            filter = button.dataset.filter;
            render();
          }),
      );
      $('goal-select').onchange = (event) => {
        state.goal = event.target.value;
        state.recent = null;
        save();
        render();
      };
      $('learning-mode').onchange = (event) => {
        state.learningMode = event.target.value;
        save();
        render();
      };
    } else if (view === 'ruta' && route) {
      root.innerHTML = routePage(route, state);
      selectNode(route, lid);
      root
        .querySelectorAll('[data-node]')
        .forEach((button) => (button.onclick = () => selectNode(route, button.dataset.node)));
      const orientation = $('route-orientation');
      let loaded = false;
      orientation.ontoggle = async () => {
        if (!orientation.open || loaded) return;
        loaded = true;
        const entry = route.lessons.find(isPublished);
        try {
          const data = await loadLesson(route.id, entry.id);
          if (version !== renderVersion) return;
          mountOrientation($('orientation-body'), data.quiz, concepts, (mode) => {
            state.learningMode = mode;
            save();
            const next = nextLesson(route, new Set(state.completed)) ?? entry;
            location.hash = lessonHref(
              route.id,
              next.id,
              mode === 'experienced' ? 'practicar' : 'aprender',
            ).slice(1);
          });
        } catch {
          if (version !== renderVersion) return;
          loaded = false;
          $('orientation-body').textContent =
            'No pudimos cargar la orientación. Puedes comenzar la ruta o cerrar y volver a abrir este panel para reintentar.';
        }
      };
    } else if (view === 'practica') {
      root.innerHTML = practicePage(routes, state);
      await mountLabs(root, version);
    } else if (view === 'progreso') {
      root.innerHTML = progressPage(routes, state, concepts);
      disposeView = mountProgressImport(root, state, (next, notice) => {
        const expected = structuredClone(state);
        return withProgressLock(() => {
          if (!progressRepository.save(next, { expected }))
            throw Error('El progreso cambió o no se pudo guardar.');
          Object.assign(state, next);
          refreshProgress();
          render();
          toast(notice);
        });
      });
      $('export-progress').onclick = () => {
        const blob = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' }),
          url = URL.createObjectURL(blob),
          link = document.createElement('a');
        link.href = url;
        link.download = 'teslacode-progreso.json';
        link.click();
        setTimeout(() => URL.revokeObjectURL(url), 1000);
      };
    } else if (view === 'leccion' && route) {
      const meta = route.lessons.find((l) => l.id === lid),
        key = lessonKey(rid, lid);
      if (!meta) throw new Error('Esta lección no existe en el mapa.');
      if (!isUnlocked(route, lid, new Set(state.completed))) {
        root.innerHTML = `<div class="page"><a class="text-link" href="#/ruta/${rid}/${lid}">← Volver al mapa</a><div class="card" style="margin-top:20px">${inspector(route, meta, state, routes)}</div></div>`;
      } else {
        const tab = ['aprender', 'practicar', 'comprobar'].includes(requestedTab)
          ? requestedTab
          : 'aprender';
        root.innerHTML =
          '<div class="loading-state"><span class="loader"></span><p>Preparando tu laboratorio…</p></div>';
        const data = await loadLesson(rid, lid);
        if (version !== renderVersion) return;
        state.recent = key;
        save();
        root.innerHTML = lessonPage(route, meta, data, state, tab, concepts);
        mountSupport(root, concepts);
        document.title = `${meta.title} · TeslaCode`;
        $('bookmark').onclick = () => {
          state.bookmarks = state.bookmarks.includes(key)
            ? state.bookmarks.filter((k) => k !== key)
            : [...state.bookmarks, key];
          save();
          $('bookmark').textContent = state.bookmarks.includes(key) ? '★' : '☆';
          $('bookmark').setAttribute('aria-pressed', String(state.bookmarks.includes(key)));
        };
        const tabs = [...root.querySelectorAll('[data-tab]')];
        tabs.forEach((button, i) => {
          button.onclick = () => {
            location.hash = lessonHref(rid, lid, button.dataset.tab).slice(1);
          };
          button.onkeydown = (event) => {
            let next;
            if (event.key === 'ArrowRight') next = (i + 1) % tabs.length;
            if (event.key === 'ArrowLeft') next = (i + tabs.length - 1) % tabs.length;
            if (event.key === 'Home') next = 0;
            if (event.key === 'End') next = tabs.length - 1;
            if (next !== undefined) {
              event.preventDefault();
              tabs[next].focus();
            }
          };
        });
        if (tab === 'aprender')
          disposeView = mountCodeExamples($('lesson'), data, { context: key });
        if (tab === 'aprender' && data.widget) {
          const widget = await widgets[data.widget]();
          if (version !== renderVersion) return;
          widget.mount($('lesson-widget') ?? $('lesson'));
        }
        if (tab === 'practicar') {
          const refresh = () => {
            $('practice-summary').textContent =
              `${data.activities.filter((a) => state.practices.includes(`${key}/${a.id}`)).length} de ${data.activities.length} actividades resueltas.`;
          };
          disposeView = mountActivities(
            $('activities'),
            data.activities,
            (id) => state.practices.includes(`${key}/${id}`),
            (id) => {
              const practiceKey = `${key}/${id}`;
              if (!state.practices.includes(practiceKey)) state.practices.push(practiceKey);
              state.streak = updateStreak(state.streak);
              updateCompletion(route, meta, data);
              refresh();
            },
            { context: key },
          );
          refresh();
          await mountLabs(root, version);
        }
        if (tab === 'comprobar')
          mountQuiz({
            box: $('qbox'),
            questions: data.quiz,
            onFinish: (summary) => {
              recordAttempt(state, key, summary.results);
              const { complete, saved } = updateCompletion(route, meta, data),
                next = nextLesson(route, new Set(state.completed));
              const result = {
                text: complete
                  ? next
                    ? 'Práctica y comprobación completas. Puedes avanzar o volver a explorar.'
                    : route.lessons.every(isPublished)
                      ? `¡Completaste la ruta ${route.name}! Revisa tus logros y elige un nuevo camino.`
                      : 'Completaste las lecciones disponibles de esta ruta. Los demás temas siguen en preparación.'
                  : summary.passed
                    ? 'Superaste la comprobación. Resuelve también las actividades de práctica para completar la lección.'
                    : 'Revisa las explicaciones y vuelve a intentarlo. Tus dificultades aparecerán en Mi progreso.',
                actions:
                  complete && next
                    ? [
                        {
                          label: 'Mi siguiente paso →',
                          onClick: () => (location.hash = lessonHref(route.id, next.id).slice(1)),
                        },
                      ]
                    : complete
                      ? [
                          {
                            label: 'Ver mi progreso →',
                            onClick: () => (location.hash = '/progreso'),
                          },
                          {
                            label: 'Explorar otra ruta →',
                            onClick: () => (location.hash = '/rutas'),
                          },
                        ]
                      : [
                          {
                            label: 'Ir a la práctica →',
                            onClick: () =>
                              (location.hash = lessonHref(rid, lid, 'practicar').slice(1)),
                          },
                        ],
              };
              return saved?.then ? saved.then(() => result) : result;
            },
          });
      }
    } else
      root.innerHTML =
        '<div class="empty-state"><h1>Este camino todavía no existe.</h1><p>Vuelve a tus rutas para encontrar el siguiente paso.</p><a class="btn" href="#/rutas">Explorar rutas →</a></div>';
    if (version !== renderVersion) return;
    if (view !== 'leccion') document.title = 'TeslaCode · Aprende, experimenta, construye';
    root.focus({ preventScroll: true });
    window.scrollTo({ top: 0, behavior: 'instant' });
  } catch (error) {
    if (version !== renderVersion) return;
    root.innerHTML = `<div class="empty-state" role="alert"><h1>No pudimos abrir este paso.</h1><p>${e(error.message)}</p><button class="btn" id="retry">Volver a intentar</button> <a class="btn ghost" href="#/rutas">Ir a las rutas</a></div>`;
    $('retry').onclick = render;
  }
}
function bindShell() {
  document.querySelector('.skip-link').onclick = (event) => {
    event.preventDefault();
    $('content').focus();
  };
  let theme;
  try {
    theme = localStorage.getItem('teslacode:theme');
  } catch {}
  if (!['light', 'dark'].includes(theme)) theme = 'dark';
  let motion;
  try {
    motion = localStorage.getItem('teslacode:motion');
  } catch {}
  document.documentElement.dataset.motion = ['on', 'off'].includes(motion)
    ? motion
    : matchMedia('(prefers-reduced-motion: reduce)').matches
      ? 'off'
      : 'on';
  function setTheme(value) {
    document.documentElement.dataset.theme = value;
    $('theme-toggle').setAttribute(
      'aria-label',
      value === 'dark' ? 'Activar tema claro' : 'Activar tema oscuro',
    );
    $('theme-toggle').innerHTML =
      `<svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" aria-hidden="true">${value === 'dark' ? '<circle cx="12" cy="12" r="4"/><path d="M12 2v2m0 16v2M2 12h2m16 0h2M5 5l1 1m12 12 1 1M5 19l1-1M18 6l1-1"/>' : '<path d="M20 15a8 8 0 0 1-11-11A8 8 0 1 0 20 15Z"/>'}</svg>`;
  }
  setTheme(theme);
  $('theme-toggle').onclick = () => {
    theme = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark';
    setTheme(theme);
    try {
      localStorage.setItem('teslacode:theme', theme);
    } catch {}
  };
  $('search').closest('form').onsubmit = (event) => event.preventDefault();
  $('search').oninput = () => {
    const fold = (value) =>
      value
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLocaleLowerCase('es');
    const query = fold($('search').value.trim());
    const hits =
      query.length < 2
        ? []
        : routes
            .flatMap((r) =>
              r.lessons
                .filter((l) => fold(`${l.title} ${l.concepts.join(' ')}`).includes(query))
                .map((l) => ({ route: r, lesson: l })),
            )
            .slice(0, 20);
    $('search-results').hidden = query.length < 2;
    $('search-results').innerHTML = hits.length
      ? hits
          .map(
            ({ route: r, lesson: l }) =>
              `<a href="${isUnlocked(r, l.id, new Set(state.completed)) ? lessonHref(r.id, l.id) : `#/ruta/${r.id}/${l.id}`}">${e(l.title)}<small>${e(r.name)} · ${l.status === 'published' ? 'Lección publicada' : 'Tema en preparación'}</small></a>`,
          )
          .join('')
      : '<p class="muted" style="padding:12px">No encontramos ese tema. Prueba con otro concepto.</p>';
  };
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') {
      $('search-results').hidden = true;
    }
    if (
      (event.key === 'k' && (event.ctrlKey || event.metaKey)) ||
      (event.key === '/' &&
        !['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement.tagName) &&
        !event.ctrlKey &&
        !event.metaKey)
    ) {
      event.preventDefault();
      $('search').focus();
    }
    if (
      event.key === 'ArrowDown' &&
      document.activeElement === $('search') &&
      !$('search-results').hidden
    ) {
      const first = $('search-results').querySelector('a');
      if (first) {
        event.preventDefault();
        first.focus();
      }
    }
  });
  document.addEventListener('click', (event) => {
    if (!event.target.closest('.search,.search-results')) {
      $('search-results').hidden = true;
    }
  });
  window.addEventListener('hashchange', render);
  window.addEventListener('storage', (event) => {
    if (event.key !== PROGRESS_KEY || pendingSaves) return;
    Object.assign(state, progressRepository.load());
    refreshProgress();
    // Keep an active editor, quiz or console intact while synchronizing achievements.
    if (document.body.dataset.view !== 'leccion') render();
    toast('Progreso actualizado desde otra pestaña.');
  });
}
export const ready = (async () => {
  const [curricula, registry] = await Promise.all([loadCurricula(), loadConcepts()]);
  routes = curricula.map(indexRoute);
  concepts = new Map(registry.concepts.map((c) => [c.id, c]));
  $('sidebar-routes').innerHTML = routes
    .map(
      (r) =>
        `<a href="#/ruta/${r.id}" data-route="${r.id}"><span class="route-dot ${r.color}" aria-hidden="true"></span>${e(r.name)}</a>`,
    )
    .join('');
  bindShell();
  save();
  if (!location.hash || location.hash === '#') location.replace('#/inicio');
  else await render();
})().catch((error) => {
  $('content').innerHTML =
    `<div class="empty-state" role="alert"><h1>No se pudo iniciar TeslaCode.</h1><p>${e(error.message)}</p><button class="btn" onclick="location.reload()">Recargar</button></div>`;
});
