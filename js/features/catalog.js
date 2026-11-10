import { studioHome } from './studio.js';
import { escapeHtml as e } from '../core/html.js';
import {
  lessonKey,
  isPublished,
  isUnlocked,
  nextLesson,
  accessState,
  includeArchives,
  routeEdition,
} from '../domain/curriculum.js';
import { conceptEvidence } from '../domain/progress.js';
import { importMarkup } from './progress-import.js';
const glyphs = {
  fundamentos: '{ }',
  algoritmia: '⌘',
  frontend: '</>',
  backend: '>_',
  'bases-de-datos': '▤',
  ia: '✳',
  python: 'Py',
};
export const publishedCount = (route) => route.lessons.filter(isPublished).length;
export const completedCount = (route, state) =>
  route.lessons.filter((l) => isPublished(l) && state.completed.includes(lessonKey(route.id, l.id)))
    .length;
export const lessonHref = (route, lesson, tab = 'aprender') =>
  `#/leccion/${route}/${lesson}/${tab}`;
export function editionNotice(route, state = { completed: [] }) {
  if (route.archivedEdition)
    return '<div class="callout"><strong>Edición anterior · pseudocódigo y ejemplos Python</strong><p>Tus enlaces, prácticas y logros anteriores se conservan aquí. La nueva edición JavaScript tiene su propio recorrido y actividades.</p><a class="text-link" href="#/ruta/fundamentos">Ir a Fundamentos con JavaScript →</a></div>';
  if (route.archive)
    return `<div class="callout"><strong>JavaScript desde cero · primera entrega</strong><p>El primer módulo está completo. Los siguientes bloques aparecen en preparación. Tus ${completedCount(route.archive, state)} lecciones completadas de la edición anterior conservan su historial y XP; no completan las nuevas prácticas JavaScript.</p><a class="text-link" href="#/ruta/${route.id}/archivo">Consultar la edición anterior →</a></div>`;
  return '';
}
export function routeCard(route, state) {
  const count = publishedCount(route),
    done = completedCount(route, state);
  const first = nextLesson(route, new Set(state.completed)) ?? route.lessons.find(isPublished);
  return `<article class="route-card ${route.color}"><div class="route-art" aria-hidden="true"><span class="art-number">${route.number}</span><span class="route-art-caption">${e(route.technologies?.[0] ?? 'Explora y practica')}</span><div class="route-depth-art"><span class="route-tile-front"><span class="route-glyph">${e(glyphs[route.id])}</span></span><span class="route-tile-side"></span><span class="route-tile-top"></span></div></div><div class="route-card-body"><span class="badge live">${count} lecciones disponibles · Entrada libre</span><h3>${e(route.name)}</h3><p>${e(route.tagline)}</p><div class="route-meta"><span>${route.lessons.length} temas en el mapa</span>${done ? `<span>· ${done} completadas</span>` : ''}</div><div class="route-card-footer">${first ? `<a class="btn small" href="${lessonHref(route.id, first.id, state.learningMode === 'experienced' ? 'practicar' : 'aprender')}">${done ? 'Continuar' : 'Empezar ruta'} →</a>` : ''}<a class="text-link" href="#/ruta/${route.id}">Ver temario →</a></div></div></article>`;
}
export function continuation(routes, state) {
  const completed = new Set(state.completed);
  if (state.recent) {
    const [rid, lid] = state.recent.split('/');
    const route = routes.find((r) => r.id === rid);
    const lesson = route?.lessons.find((l) => l.id === lid);
    if (
      lesson &&
      isPublished(lesson) &&
      isUnlocked(route, lesson.id, completed) &&
      !completed.has(state.recent)
    )
      return { route, lesson };
  }
  const goal = routes.find((r) => r.id === state.goal) ?? routes[0];
  const next = nextLesson(goal, completed);
  if (next) return { route: goal, lesson: next };
  for (const route of routes) {
    const lesson = nextLesson(route, completed);
    if (lesson) return { route, lesson };
  }
  return null;
}
export function homePage(routes, state) {
  return studioHome(routes, state, continuation(routes, state), lessonHref);
}
export function routesPage(routes, state, filter = 'all') {
  const filtered =
    filter === 'all'
      ? routes
      : filter === 'open'
        ? routes.filter((r) => nextLesson(r, new Set(state.completed)))
        : routes.filter((r) => r.id === state.goal);
  return `<div class="page"><div class="page-intro"><div class="eyebrow"><span class="dot"></span> TU MAPA DE POSIBILIDADES</div><h1>Elige qué quieres construir.</h1><p>Empieza por la especialidad que te interesa. Los repasos te acompañan cuando los necesitas; el avance se demuestra dentro de cada ruta.</p></div><div class="section-heading"><div class="filters"><button class="filter" data-filter="all" aria-pressed="${filter === 'all'}">Todas las rutas</button><button class="filter" data-filter="open" aria-pressed="${filter === 'open'}">Listas para empezar</button><button class="filter" data-filter="goal" aria-pressed="${filter === 'goal'}">Mi objetivo</button></div><label class="sr-only" for="goal-select">Mi objetivo</label><select id="goal-select" class="goal-select">${routes.map((r) => `<option value="${r.id}" ${state.goal === r.id ? 'selected' : ''}>${e(r.name)}</option>`).join('')}</select></div><div class="learning-preferences"><label for="learning-mode">¿Cómo prefieres aprender?</label><select id="learning-mode"><option value="guided" ${state.learningMode !== 'experienced' ? 'selected' : ''}>Paso a paso, con explicaciones</option><option value="experienced" ${state.learningMode === 'experienced' ? 'selected' : ''}>Tengo experiencia: empezar por la práctica</option></select><p>Puedes cambiarlo cuando quieras. La práctica y la comprobación completan cada paso.</p></div><div class="routes-grid">${filtered.map((r) => routeCard(r, state)).join('')}</div></div>`;
}
export function nodeState(route, lesson, state) {
  return accessState(route, lesson.id, new Set(state.completed)).status;
}
export function routePage(route, state) {
  const count = publishedCount(route),
    done = completedCount(route, state);
  return `<div class="page"><a class="text-link" href="#/rutas">← Todas las rutas</a>${editionNotice(route, state)}<div class="route-header ${route.color}" style="margin-top:18px"><div><div class="eyebrow">RUTA ${route.number} · ${e(route.eyebrow)}</div><h1>${e(route.name)}</h1><p>${e(route.description)}</p><div class="tags"><span class="badge live">${count} disponibles</span><span class="badge">${route.lessons.length - count} en preparación</span><span class="badge">${route.technologies.slice(0, 3).map(e).join(' · ')}</span></div></div><div class="route-summary"><strong>${done}/${count}</strong><small>lecciones disponibles completadas</small><div class="meter"><i style="width:${count ? Math.min((done / count) * 100, 100) : 0}%"></i></div></div></div><p class="muted">El mapa muestra el orden de estudio. Al seleccionar un tema puedes consultar sus conocimientos relacionados.</p><div class="legend"><span>▷ Disponible</span><span>✓ Completada</span><span>⌑ Requiere pasos previos</span><span>○ En preparación</span></div><details class="learning-support" id="route-orientation"><summary>¿Quieres orientarte antes de empezar? <span>Opcional · 3 preguntas</span></summary><p>Explora los conceptos iniciales para elegir cómo acompañarte. Puedes comenzar la ruta directamente cuando quieras.</p><div id="orientation-body"><p class="muted">Preparando preguntas…</p></div></details><div class="map-layout"><div>${route.levels
    .map(
      (lv, i) =>
        `<details class="level" ${lv.id === (nextLesson(route, new Set(state.completed)) ?? route.lessons[0]).levelId ? 'open' : ''} data-step="${String(i + 1).padStart(2, '0')}"><summary><h2>${e(lv.name)}</h2><span>${lv.lessons.filter(isPublished).length} disponibles / ${lv.lessons.length} temas</span></summary><p>${e(lv.objective)}</p><div class="nodes">${lv.lessons
          .map((m) => {
            const s = nodeState(route, m, state);
            return `<button class="map-node ${s} ${m.kind === 'optional' ? 'optional-node' : ''}" data-node="${m.id}" aria-pressed="false"><span class="node-status" aria-hidden="true">${{ done: '✓', ready: '▷', locked: '⌑', planned: '○' }[s]}</span><span class="node-name">${e(m.title)}</span><small>${s === 'done' ? 'Completada' : s === 'ready' ? m.minutes + ' min' : s === 'planned' ? 'En preparación' : 'Paso previo'}</small></button>`;
          })
          .join('')}</div></details>`,
    )
    .join(
      '',
    )}</div><aside class="card node-inspector" id="node-inspector" aria-live="polite"></aside></div></div>`;
}
export function inspector(route, lesson, state, routes) {
  const status = nodeState(route, lesson, state),
    byKey = (key) => {
      const [rid, lid] = key.split('/');
      return routeEdition(
        routes.find((r) => r.id === rid),
        lid,
      )?.lessons.find((l) => l.id === lid);
    };
  const { required: missing, recommended } = accessState(
    route,
    lesson.id,
    new Set(state.completed),
  );
  return `<span class="badge ${status === 'ready' || status === 'done' ? 'live' : ''}">${{ done: 'Completada', ready: 'Lista para aprender', locked: 'Completa el paso anterior', planned: 'Contenido en preparación' }[status]}</span><h3>${e(lesson.title)}</h3><p>En esta etapa trabajarás estos conceptos:</p><div class="tags">${lesson.concepts.map((c) => `<span class="tag">${e(c)}</span>`).join('')}</div><p><strong>${lesson.kind === 'optional' ? 'Profundización opcional' : 'Parte del recorrido principal'}</strong></p>${missing.length ? `<p>Pasos previos:</p><ul>${missing.map((key) => `<li><a class="text-link" href="#/ruta/${key.split('/')[0]}/${key.split('/')[1]}">${e(byKey(key)?.title ?? key)}</a></li>`).join('')}</ul>` : status === 'planned' ? '<p>Este tema forma parte del recorrido previsto.</p>' : '<p>Puedes empezar aquí y consultar los repasos que necesites.</p>'}${lesson.dependsOn.length ? `<details class="academic-dependencies"><summary>Conocimientos que utiliza este tema</summary><p>${e(lesson.dependencyRationale ?? 'Estas referencias describen conocimientos; los pasos de avance se muestran por separado.')}</p><ul>${lesson.dependsOn.map((key) => `<li><a class="text-link" href="#/ruta/${e(key)}">${e(byKey(key)?.title ?? key)}</a></li>`).join('')}</ul></details>` : ''}${recommended.length ? `<details class="route-recommendations"><summary>Referencias de otras rutas · opcionales</summary><ul>${recommended.map((key) => `<li><a class="text-link" href="#/ruta/${e(key)}">${e(byKey(key)?.title ?? key)}</a></li>`).join('')}</ul><p>Puedes consultar estas referencias sin completarlas para entrar aquí.</p></details>` : ''}${status === 'ready' || status === 'done' ? `<a class="btn" href="${lessonHref(route.id, lesson.id, state.learningMode === 'experienced' ? 'practicar' : 'aprender')}">${status === 'done' ? 'Repasar la lección' : 'Empezar la lección'} →</a>` : status === 'planned' ? '<p>El tema forma parte del mapa, pero todavía no incluye una lección. No cuenta como contenido disponible.</p>' : '<p>Completa la práctica y la comprobación de los pasos previos para desbloquear esta lección.</p>'}`;
}
export function progressPage(routes, state, concepts) {
  const evidence = conceptEvidence(state),
    items = [...evidence].map(([id, result]) => ({
      id,
      ...result,
      label: concepts.get(id)?.label ?? id,
    }));
  const weak = items.filter((i) => i.correct < i.total);
  const doneTotal = routes.reduce((sum, route) => sum + completedCount(route, state), 0);
  const total = routes.reduce((sum, route) => sum + publishedCount(route), 0);
  const percent = total ? Math.min(100, Math.round((doneTotal / total) * 100)) : 0;
  const next = continuation(routes, state);
  return `<div class="page progress-dashboard"><header class="workspace-hero progress-hero"><div class="workspace-hero-copy"><div class="eyebrow">TU ESFUERZO DEJA HUELLA</div><h1>Tu siguiente versión,<br><em>en construcción.</em></h1><p>Cada idea que comprendes y cada reto que resuelves construyen lo que sabes hacer. Aquí puedes ver tu recorrido real.</p><a class="btn launch-primary" href="${next ? lessonHref(next.route.id, next.lesson.id, state.learningMode === 'experienced' ? 'practicar' : 'aprender') : '#/rutas'}">${next ? 'Dar mi siguiente paso' : 'Explorar las rutas'} <span aria-hidden="true">↗</span></a></div><div class="progress-observatory" data-depth-scene><div class="progress-orbit" aria-hidden="true"></div><div class="progress-pedestal" aria-hidden="true"></div><div class="progress-dial" style="--progress:${percent}%"><div><span class="section-index">TU RECORRIDO</span><strong>${percent}<small>%</small></strong><span>${doneTotal} de ${total} lecciones</span></div></div><p>Habilidades que crecen contigo.</p></div></header>
  ${routes
    .filter((r) => r.archive)
    .map(
      (r) =>
        `<section class="callout" aria-label="Historial de la edición anterior"><strong>Tu historial anterior se conserva</strong><p>${completedCount(r.archive, state)} de ${publishedCount(r.archive)} lecciones de ${e(r.archive.name)}. Los XP acumulados se mantienen; el porcentaje de JavaScript se calcula con sus nuevas lecciones.</p><a class="text-link" href="#/ruta/${r.id}/archivo">Consultar historial y materiales anteriores →</a></section>`,
    )
    .join('')}<div class="progress-metrics">${[
    ['01', doneTotal, 'Lecciones completadas', 'Comprende, practica y comprueba'],
    ['02', state.xp, 'XP acumulados', 'Cada logro suma una sola vez'],
    ['03', state.practices.length, 'Prácticas resueltas', 'Tu experiencia al experimentar'],
    ['04', state.streak.count, 'Días de racha', 'Un paso constante cuenta'],
  ]
    .map(
      ([number, value, label, note]) =>
        `<div class="progress-metric"><span class="metric-coordinate" aria-hidden="true">${number} /</span><strong>${value}</strong><span>${label}</span><small>${note}</small></div>`,
    )
    .join('')}</div>
  <section aria-labelledby="progress-routes-heading"><div class="section-heading"><div><span class="section-index">01 / TU MAPA DE HABILIDADES</span><h2 id="progress-routes-heading">Cada ruta, una posibilidad.</h2><p>El avance se calcula sobre las lecciones publicadas.</p></div></div><div class="progress-routes">${routes
    .map((r) => {
      const done = completedCount(r, state),
        n = publishedCount(r);
      const progress = n ? Math.min((done / n) * 100, 100) : 0;
      return `<a class="card progress-route ${r.color}" href="#/ruta/${r.id}"><div class="progress-route-heading"><span class="progress-route-emblem" aria-hidden="true">${e(glyphs[r.id])}</span><div><strong>${e(r.name)}</strong><small>${done} de ${n} lecciones completadas</small></div><span class="route-percentage">${Math.round(progress)}<small>%</small></span></div><div class="meter" role="progressbar" aria-label="Avance en ${e(r.name)}" aria-valuenow="${done}" aria-valuemin="0" aria-valuemax="${n || 1}"><i style="width:${progress}%"></i></div><p>${r.lessons.length - n} temas adicionales en preparación. <span>Ver mi ruta ↗</span></p></a>`;
    })
    .join(
      '',
    )}</div></section><section class="progress-evidence" aria-labelledby="progress-evidence-heading"><div class="section-heading"><div><span class="section-index">02 / APRENDER TAMBIÉN ES VOLVER</span><h2 id="progress-evidence-heading">Conceptos para reforzar</h2><p>Se toma el último intento de cada lección. Una comprobación no garantiza dominio permanente.</p></div></div>${weak.length ? `<div class="evidence-grid">${weak.map((i) => `<a class="evidence-row" href="#/ruta/${concepts.get(i.id)?.introducedBy.split('/')[0]}/${concepts.get(i.id)?.introducedBy.split('/')[1]}"><div><strong>${e(i.label)}</strong><small>${i.correct} de ${i.total} respuestas correctas en los últimos intentos</small></div><span>Repasar →</span></a>`).join('')}</div>` : '<div class="empty-state"><span class="evidence-symbol" aria-hidden="true">✦</span><h3>' + (items.length ? 'Sin dificultades registradas en tus últimos intentos' : 'Tu evidencia de aprendizaje empieza con una práctica') + '</h3><p>Las comprobaciones te ayudarán a identificar qué conviene repasar.</p><a class="btn" href="#/practica">Ir al laboratorio →</a></div>'}</section><section class="progress-vault" aria-label="Copias de tu progreso"><div class="vault-copy"><span class="section-index">03 / LLEVA CONTIGO LO APRENDIDO</span><h2>Tu progreso merece<br>un lugar seguro.</h2><p>Se guarda en este navegador. Exporta una copia antes de borrar sus datos o cambiar de dispositivo.</p><button class="btn" id="export-progress">Exportar progreso ↓</button><small>Archivo JSON · Copia local, sin cuenta sincronizada</small></div>${importMarkup()}</section></div>`;
}
export function practicePage(routes, state) {
  const bookmarks = state.bookmarks.filter((key) => {
    const [rid, lid] = key.split('/');
    return routeEdition(
      routes.find((r) => r.id === rid),
      lid,
    )?.lessons.some((l) => l.id === lid);
  });
  const available = routes.flatMap((r) =>
    r.lessons
      .filter((l) => isUnlocked(r, l.id, new Set(state.completed)))
      .map((l) => ({ route: r, lesson: l })),
  );
  return `<div class="page laboratory-dashboard"><header class="workspace-hero laboratory-hero"><div class="workspace-hero-copy"><div class="eyebrow">MENOS MEMORIZAR. MÁS EXPERIMENTAR.</div><h1>Tu laboratorio<br>de <em>ideas.</em></h1><p>Predice, prueba y descubre qué cambia. Aquí los errores son información para tu siguiente intento.</p><div class="laboratory-notes"><span>01 / Elige un reto</span><span>02 / Ponlo a prueba</span><span>03 / Descubre por qué</span></div></div><div class="lab-assembly" data-depth-scene aria-hidden="true"><div class="assembly-grid"></div><div class="assembly-platform platform-back"><span>COMPRENDER</span></div><div class="assembly-platform platform-middle"><span>EXPERIMENTAR</span></div><div class="assembly-platform platform-front"><span>CONSTRUIR</span><strong>{ }</strong><div class="assembly-cells"><i></i><i></i><i></i><i></i></div></div><div class="assembly-label"><span class="launch-signal"></span> IDEAS EN MOVIMIENTO</div></div></header><section class="challenge-workbench" aria-labelledby="challenge-heading"><div class="section-heading"><div><span class="section-index">01 / TU MESA DE EXPERIMENTOS</span><h2 id="challenge-heading">Entrena con retos</h2><p>Seis formas de pensar. Una idea nueva en cada intento.</p></div><span class="badge">Pseudocódigo · 2 a 5 min</span></div><div data-lab="practice-hub"></div></section><section aria-labelledby="simulation-heading"><div class="section-heading"><div><span class="section-index">02 / EXPLORA LO INVISIBLE</span><h2 id="simulation-heading">Simulaciones de IA</h2><p>Manipula el concepto y observa qué sucede.</p></div><span class="badge">Locales · Sin API</span></div><div class="lab-grid"><div data-lab="diffusion-lab"></div><div data-lab="token-lab"></div></div></section><section aria-labelledby="journey-practice-heading"><div class="section-heading"><div><span class="section-index">03 / CONECTA CON TU RECORRIDO</span><h2 id="journey-practice-heading">Prácticas de tu recorrido</h2></div></div><div class="review-list">${available.map(({ route: r, lesson: l }) => `<a class="card" href="${lessonHref(r.id, l.id, 'practicar')}"><div><div class="eyebrow">${e(r.name)}</div><h3>${e(l.title)}</h3><p>${state.completed.includes(lessonKey(r.id, l.id)) ? 'Vuelve con un nuevo intento' : 'Un ejercicio para aplicar lo aprendido'}</p></div><span class="btn ghost small">Practicar →</span></a>`).join('')}</div></section>${
    bookmarks.length
      ? `<div class="section-heading" style="margin-top:32px"><h2>Guardado para volver</h2></div><div class="review-list">${bookmarks
          .map((key) => {
            const [rid, lid] = key.split('/'),
              r = routeEdition(
                routes.find((r) => r.id === rid),
                lid,
              ),
              l = r.lessons.find((l) => l.id === lid);
            return `<a class="card" href="${lessonHref(rid, lid)}">${e(l.title)} <span>→</span></a>`;
          })
          .join('')}</div>`
      : ''
  }</div>`;
}
