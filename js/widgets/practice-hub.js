import { assetUrl } from '../core/assets.js';
import { escapeHtml as e } from '../core/html.js';
import { isPublished, isUnlocked, lessonKey, routeEdition } from '../domain/curriculum.js';
import { LAB_FORMATS, PRACTICE_TYPES, TOPICS } from '../domain/practice.js';
import { loadLaboratory } from '../repositories/content-repository.js';
import { mountChoice, mountPractice } from './practice.js';

const modes = {
  catalog: 'Retos y simuladores',
  lessons: 'Prácticas de lección',
  saved: 'Guardadas',
};
const fold = (text) => text.normalize('NFD').replace(/\p{M}/gu, '').toLocaleLowerCase('es').trim();
const option = (value, label) => `<option value="${e(value)}">${e(label)}</option>`;
const lessonHref = (route, id, stage = 'aprender') => `#/leccion/${route}/${id}/${stage}`;
const searchable = (item) =>
  fold(
    [
      item.title,
      item.goal,
      item.concept,
      item.topicLabel,
      item.routeName,
      item.language,
      item.python ? 'Python' : '',
    ].join(' '),
  );

function groupBy(items, key) {
  const groups = new Map();
  for (const item of items) {
    const group = item[key];
    if (!groups.has(group)) groups.set(group, []);
    groups.get(group).push(item);
  }
  return groups;
}

function lessonEntries(routes, state, mode) {
  const completed = new Set(state.completed);
  function describe(route, lesson, key) {
    return {
      id: lesson.id,
      route: route.id,
      routeName: route.name,
      topicKey: key,
      topicLabel: lesson.level,
      title: lesson.title,
      completed: completed.has(lessonKey(route.id, lesson.id)),
      archived: route.archivedEdition,
      href: lessonHref(route.id, lesson.id, mode === 'saved' ? 'aprender' : 'practicar'),
    };
  }
  if (mode === 'saved')
    return state.bookmarks.flatMap((key) => {
      const [rid, id] = key.split('/');
      const route = routeEdition(routes.get(rid), id);
      const lesson = route?.lessons.find((item) => item.id === id && isPublished(item));
      return lesson ? [describe(route, lesson, rid + '/' + lesson.levelId)] : [];
    });
  return [...routes.values()].flatMap((route) =>
    route.lessons
      .filter((lesson) => isUnlocked(route, lesson.id, completed))
      .map((lesson) => describe(route, lesson, route.id + '/' + lesson.levelId)),
  );
}

export async function mount(root, ctx, load = loadLaboratory) {
  const { items, experiments } = await load();
  const routes = new Map(ctx.routes.map((route) => [route.id, route]));
  const initialRoute = routes.has(ctx.route) ? ctx.route : 'all';
  const catalog = [...items, ...experiments].map((item) => {
    const reference = item.lessonRoute ?? item.route;
    const edition = routeEdition(routes.get(reference), item.lesson);
    return {
      ...item,
      routeName: routes.get(item.route).name,
      topicKey: item.route + '/' + item.topic,
      topicLabel: TOPICS[item.topic],
      reference,
      archived: edition?.archivedEdition,
    };
  });
  const filters = { mode: 'catalog', route: initialRoute, topic: 'all', type: 'all', query: '' };
  const cards = new Map();
  const openRoutes = new Map();
  let itemsInRound = [];
  let roundIndex = 0;
  let roundOffset = 0;
  const solved = (id) => ctx.isSolved(id);
  root.innerHTML = `<div class="lab-filter-panel">
    <div class="practice-filters lab-modes" role="group" aria-label="Secciones del laboratorio">${Object.entries(
      modes,
    )
      .map(
        ([mode, label]) =>
          `<button type="button" class="practice-chip" data-mode="${mode}" aria-pressed="${mode === 'catalog'}">${label}</button>`,
      )
      .join('')}</div>
    <form class="lab-filters" role="search" aria-label="Buscar y filtrar prácticas">
      <div class="lab-filter-field"><label for="lab-route">Ruta</label><select id="lab-route" data-filter-route>${option('all', 'Todas las rutas')}${ctx.routes.map((r) => option(r.id, r.name)).join('')}</select></div>
      <div class="lab-filter-field"><label for="lab-topic">Tema</label><select id="lab-topic" data-filter-topic></select></div>
      <div class="lab-filter-field" data-filter-format><label for="lab-format">Formato</label><select id="lab-format" data-filter-type>${option('all', 'Todos los formatos')}${Object.entries(
        LAB_FORMATS,
      )
        .map(([value, label]) => option(value, label))
        .join('')}</select></div>
      <div class="lab-filter-field"><label for="lab-query">Buscar</label><input id="lab-query" type="search" maxlength="100" data-filter-query placeholder="Ej. ciclos, Python o difusión"></div>
    </form>
    <button type="button" class="btn ghost small" data-reset-filters hidden>Limpiar filtros</button>
  </div>
  <div class="lab-session">
    <p class="practice-count" role="status"></p>
    <button type="button" class="btn small" data-start-round>Ronda de repaso</button>
  </div>
  <section class="card lab-round" data-round hidden aria-labelledby="lab-round-title"></section>
  <div class="practice-list"></div>`;

  const q = (selector) => root.querySelector(selector);
  const result = q('.practice-list');
  const routeSelect = q('[data-filter-route]');
  const topicSelect = q('[data-filter-topic]');
  const typeSelect = q('[data-filter-type]');
  const queryInput = q('[data-filter-query]');
  const reset = q('[data-reset-filters]');
  const round = q('[data-round]');
  const roundButton = q('[data-start-round]');
  const count = q('.practice-count');
  let shown = [];

  function updateCount() {
    const challenges = shown.filter((item) => Object.hasOwn(PRACTICE_TYPES, item.type));
    const solvedCount = challenges.filter((item) => solved(item.id)).length;
    count.textContent =
      (shown.length === 1 ? '1 recurso' : `${shown.length} recursos`) +
      (challenges.length ? ` · ${solvedCount} de ${challenges.length} retos resueltos` : '');
  }

  function card(item) {
    if (cards.has(item.id)) return cards.get(item.id);
    const node = root.ownerDocument.createElement('article');
    node.className = 'card practice-card';
    node.dataset.id = item.id;
    const challenge = Object.hasOwn(PRACTICE_TYPES, item.type);
    const language = item.language ?? (challenge && item.lines ? 'Pseudocódigo' : '');
    const reference = lessonHref(item.reference, item.lesson);
    const href = item.asset ? assetUrl(item.asset) : reference;
    const interactive = challenge || item.widget;
    node.innerHTML = `<p class="lab-card-path">${e(item.routeName)} · ${e(item.topicLabel)}</p>
      <h4>${e(item.title)}</h4><p>${e(item.goal)}</p>
      <div class="practice-meta"><span>${e(LAB_FORMATS[item.type])}</span>
        ${language ? `<span>${e(language)}${item.python ? ' / Python' : ''}</span>` : ''}
        ${item.level ? `<span>${e(item.level)}</span>` : ''}
        ${item.minutes ? `<span>${item.minutes} min</span>` : ''}
        ${item.archived ? `<span>${challenge ? 'Referencia de la edición anterior' : 'Edición anterior'}</span>` : ''}
        ${challenge ? `<span class="badge live" data-solved ${solved(item.id) ? '' : 'hidden'}>Resuelto</span>` : ''}
      </div>
      <div class="lab-card-actions">${
        interactive
          ? `<button type="button" class="btn small" data-open aria-expanded="false" aria-controls="lab-body-${e(item.id)}">Abrir ${challenge ? 'reto' : 'simulador'}</button>`
          : `<a class="btn small" href="${e(href)}"${item.asset ? ' target="_blank" rel="noopener"' : ''}>Abrir ${item.type === 'project' ? 'proyecto' : 'simulador'}</a>`
      }
        ${interactive || item.asset ? `<a class="text-link" href="${e(reference)}">Lección de referencia${item.reference !== item.route ? ` · ${e(routes.get(item.reference).name)}` : ''}</a>` : ''}
      </div>${interactive ? `<div class="practice-body" id="lab-body-${e(item.id)}" hidden></div>` : ''}`;
    if (interactive) {
      const button = node.querySelector('[data-open]');
      const body = node.querySelector('.practice-body');
      button.onclick = () => {
        body.hidden = !body.hidden;
        button.setAttribute('aria-expanded', String(!body.hidden));
        button.textContent = body.hidden ? `Abrir ${challenge ? 'reto' : 'simulador'}` : 'Cerrar';
        if (body.hidden || body.childElementCount) return;
        if (challenge)
          mountPractice(body, item, {
            onSolved: () => {
              ctx.solve(item.id);
              node.querySelector('[data-solved]').hidden = false;
              updateCount();
            },
          });
        else ctx.mountWidget(body, item.widget);
      };
    }
    cards.set(item.id, node);
    return node;
  }

  function lessonCard(item) {
    const node = root.ownerDocument.createElement('a');
    node.className = 'card lab-lesson-link';
    node.href = item.href;
    node.innerHTML = `<span><strong>${e(item.title)}</strong>${item.archived ? '<small>Edición anterior</small>' : ''}</span><span>${filters.mode === 'saved' ? 'Abrir' : item.completed ? 'Repasar' : 'Practicar'}</span>`;
    return node;
  }

  function draw() {
    for (const details of result.querySelectorAll('[data-route-group]'))
      openRoutes.set(filters.mode + '/' + details.dataset.routeGroup, details.open);
    const browse = filters.mode === 'catalog';
    const entries = browse ? catalog : lessonEntries(routes, ctx.state, filters.mode);
    const fromRoute = entries.filter(
      (item) => filters.route === 'all' || item.route === filters.route,
    );
    const topics = new Map(
      fromRoute.map((item) => [
        item.topicKey,
        filters.route === 'all' ? `${item.routeName} · ${item.topicLabel}` : item.topicLabel,
      ]),
    );
    if (!topics.has(filters.topic)) filters.topic = 'all';
    topicSelect.innerHTML =
      option('all', 'Todos los temas') +
      [...topics]
        .sort((a, b) => a[1].localeCompare(b[1], 'es'))
        .map(([key, label]) => option(key, label))
        .join('');
    routeSelect.value = filters.route;
    topicSelect.value = filters.topic;
    typeSelect.value = filters.type;
    q('[data-filter-format]').hidden = !browse;
    const query = fold(filters.query);
    shown = fromRoute.filter(
      (item) =>
        (filters.topic === 'all' || item.topicKey === filters.topic) &&
        (!browse || filters.type === 'all' || item.type === filters.type) &&
        (!query || searchable(item).includes(query)),
    );
    const filtered =
      filters.route !== 'all' || filters.topic !== 'all' || filters.type !== 'all' || !!query;
    reset.hidden = !filtered;
    roundButton.hidden = !browse;
    roundButton.disabled = !shown.some((item) => item.review);
    updateCount();
    result.replaceChildren();
    if (!shown.length) {
      const hasLessonOption = browse && filters.route !== 'all';
      const message = filtered
        ? 'Prueba con otro tema o limpia los filtros.'
        : filters.mode === 'saved'
          ? 'Guarda una lección con la estrella para encontrarla aquí.'
          : 'Abre una ruta para encontrar una lección disponible.';
      result.innerHTML = `<div class="empty-state"><h3>${filtered ? 'Sin resultados' : 'Aún no hay recursos aquí'}</h3><p>${message}</p>${
        hasLessonOption
          ? '<button type="button" class="btn small" data-lesson-option>Ver prácticas de esta ruta</button>'
          : ''
      }</div>`;
      if (hasLessonOption)
        result.querySelector('[data-lesson-option]').onclick = () => {
          filters.query = queryInput.value = '';
          const lessonMode = q('[data-mode="lessons"]');
          lessonMode.click();
          lessonMode.focus();
        };
      return;
    }
    const byRoute = groupBy(shown, 'route');
    for (const [id, route] of routes) {
      const entries = byRoute.get(id);
      if (!entries) continue;
      const group = root.ownerDocument.createElement('details');
      group.className = 'lab-route-group';
      group.dataset.routeGroup = id;
      group.open = filtered || openRoutes.get(filters.mode + '/' + id) === true;
      group.innerHTML = `<summary><strong>${e(route.name)}</strong><span>${entries.length} ${entries.length === 1 ? 'recurso' : 'recursos'}</span></summary>`;
      function populateTopics() {
        for (const topic of groupBy(entries, 'topicKey').values()) {
          const section = root.ownerDocument.createElement('section');
          section.className = 'lab-topic';
          section.innerHTML = `<h3>${e(topic[0].topicLabel)}</h3><div class="${browse ? 'lab-topic-grid' : 'lab-lesson-list'}"></div>`;
          section.lastChild.append(...topic.map(browse ? card : lessonCard));
          group.append(section);
        }
      }
      if (group.open) populateTopics();
      else
        group.ontoggle = () => {
          if (!group.open || !result.contains(group)) return;
          group.ontoggle = null;
          populateTopics();
        };
      result.append(group);
    }
  }

  function drawRound() {
    const item = itemsInRound[roundIndex];
    const score = itemsInRound.filter((entry) => entry.correctFirst).length;
    round.innerHTML = `<div class="lab-round-heading"><h3 id="lab-round-title" tabindex="-1">Ronda de repaso</h3>
      <button type="button" class="btn ghost small" data-close-round>Cerrar ronda</button></div>${
        item
          ? `<p>${roundIndex + 1} de ${itemsInRound.length} · ${e(item.entry.routeName)} · ${e(item.entry.topicLabel)}</p><div data-review-question></div><button type="button" class="btn small" data-next-round hidden>${roundIndex + 1 === itemsInRound.length ? 'Ver resultado' : 'Siguiente reto'}</button>`
          : `<p>${score} de ${itemsInRound.length} al primer intento.</p>${
              score < itemsInRound.length
                ? `<p>Para volver a practicar, consulta ${[
                    ...new Map(
                      itemsInRound
                        .filter((entry) => !entry.correctFirst)
                        .map(({ entry }) => [
                          entry.reference + '/' + entry.lesson,
                          `<a class="text-link" href="${e(lessonHref(entry.reference, entry.lesson))}">${e(entry.topicLabel)}</a>`,
                        ]),
                    ).values(),
                  ].join(', ')}.</p>`
                : ''
            }`
      }`;
    round.querySelector('[data-close-round]').onclick = () => {
      round.hidden = true;
      (roundButton.hidden || roundButton.disabled ? routeSelect : roundButton).focus();
    };
    round.querySelector('h3').focus();
    if (!item) return;
    const next = round.querySelector('[data-next-round]');
    let attempts = 0;
    mountChoice(round.querySelector('[data-review-question]'), item.entry.review, (correct) => {
      attempts++;
      if (correct) {
        item.correctFirst = attempts === 1;
        next.hidden = false;
      }
    });
    next.onclick = () => {
      roundIndex++;
      drawRound();
    };
  }

  root.querySelectorAll('[data-mode]').forEach((button) => {
    button.onclick = () => {
      if (filters.mode === button.dataset.mode) return;
      for (const details of result.querySelectorAll('[data-route-group]'))
        openRoutes.set(filters.mode + '/' + details.dataset.routeGroup, details.open);
      result.replaceChildren();
      for (const sibling of root.querySelectorAll('[data-mode]'))
        sibling.setAttribute('aria-pressed', String(sibling === button));
      filters.mode = button.dataset.mode;
      filters.topic = filters.type = 'all';
      draw();
    };
  });
  root.querySelector('form').onsubmit = (event) => event.preventDefault();
  routeSelect.onchange = () => {
    filters.route = routeSelect.value;
    filters.topic = 'all';
    draw();
  };
  topicSelect.onchange = () => {
    filters.topic = topicSelect.value;
    draw();
  };
  typeSelect.onchange = () => {
    filters.type = typeSelect.value;
    draw();
  };
  queryInput.oninput = () => {
    filters.query = queryInput.value;
    draw();
  };
  reset.onclick = () => {
    filters.route = filters.topic = filters.type = 'all';
    filters.query = queryInput.value = '';
    draw();
    routeSelect.focus();
  };
  roundButton.onclick = () => {
    if (!round.hidden) {
      round.querySelector('h3').focus();
      return;
    }
    const eligible = shown.filter((item) => item.review);
    if (!eligible.length) return;
    const start = roundOffset % eligible.length;
    const ordered = [...eligible.slice(start), ...eligible.slice(0, start)];
    itemsInRound = ordered.slice(0, 3).map((entry) => ({ entry, correctFirst: false }));
    roundOffset += itemsInRound.length;
    roundIndex = 0;
    round.hidden = false;
    drawRound();
  };
  draw();
}
