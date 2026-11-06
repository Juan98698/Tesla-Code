import { escapeHtml as e } from '../core/html.js';
import { lessonKey, isPublished, isUnlocked, nextLesson } from '../domain/curriculum.js';
import { conceptEvidence } from '../domain/progress.js';
const glyphs = {
  fundamentos: '{ }',
  algoritmia: '⌘',
  frontend: '</>',
  backend: '>_',
  'bases-de-datos': '▤',
  ia: '✳',
};
export const publishedCount = (route) => route.lessons.filter(isPublished).length;
export const completedCount = (route, state) =>
  route.lessons.filter((l) => state.completed.includes(lessonKey(route.id, l.id))).length;
export const lessonHref = (route, lesson, tab = 'aprender') =>
  `#/leccion/${route}/${lesson}/${tab}`;
export function routeCard(route, state) {
  const count = publishedCount(route),
    done = completedCount(route, state);
  return `<a class="route-card ${route.color}" href="#/ruta/${route.id}"><div class="route-art" aria-hidden="true"><span class="art-number">${route.number}</span><span class="route-glyph">${e(glyphs[route.id])}</span></div><div class="route-card-body"><div><span class="badge ${count ? 'live' : ''}">${count ? `${count} lecciones disponibles` : 'En preparación'}</span></div><h3>${e(route.name)}</h3><p>${e(route.tagline)}</p><div class="route-meta"><span>◷ A tu ritmo</span><span>·</span><span>${route.lessons.length} temas en el mapa</span></div>${done ? `<div class="meter"><i style="width:${Math.min((done / count) * 100, 100)}%"></i></div>` : ''}<div class="route-card-footer"><span>${done ? `${done} completadas · Continuar` : 'Explorar la ruta'}</span><span class="arrow">→</span></div></div></a>`;
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
  const next = continuation(routes, state),
    total = routes.reduce((n, r) => n + publishedCount(r), 0);
  return `<div class="page"><div class="welcome-row"><div><h1>Tu próxima gran idea empieza aquí<span style="color:var(--arc)">.</span></h1><p>Un poco de curiosidad. Un nuevo descubrimiento. Un paso más lejos.</p></div><span class="date-label">APRENDE A TU RITMO →</span></div><section class="hero" aria-label="Comienza tu aprendizaje"><div class="hero-copy"><div class="eyebrow"><span></span> DE LA CURIOSIDAD A LA CREACIÓN</div><h2>Aprende desde cero.<br><em>Construye sin límites.</em></h2><p>Entiende el porqué. Experimenta con el cómo.<br>Conecta cada concepto con algo que puedes crear.</p><div class="hero-bottom"><a class="btn lime" href="${next ? lessonHref(next.route.id, next.lesson.id) : '#/rutas'}">${state.recent ? 'Continuar aprendiendo' : 'Empieza tu primera lección'} <span>→</span></a><small>Sin experiencia previa.</small></div></div><div class="hero-art" aria-hidden="true"><div class="orbital"></div><span class="art-star">✳</span><div class="code-window"><div class="window-bar"><i></i><i></i><i></i><span>mi_primera_idea.py</span></div><div class="code-lines"><span style="color:#8da2c3"># Todo empieza con una idea</span><br>curiosidad = <em>True</em><br><b>if</b> curiosidad:<br>&nbsp;&nbsp;print(<em>"¡Hola, mundo!"</em>)</div><div class="code-output">› ¡Hola, mundo! <span style="opacity:.5">▌</span></div></div><div class="floating-label">✓ Tu potencial no tiene punto final.</div></div></section><div class="quick-stats"><div class="quick-stat"><span class="stat-icon">⌘</span><div><b>06</b><small>Rutas para descubrir</small></div></div><div class="quick-stat"><span class="stat-icon">◈</span><div><b>${total}</b><small>Lecciones para aprender</small></div></div><div class="quick-stat"><span class="stat-icon">✓</span><div><b>${state.completed.length.toString().padStart(2, '0')}</b><small>Pequeñas victorias tuyas</small></div></div></div><section><div class="section-heading"><div><h2>Encuentra tu próximo camino</h2><p>Una base en común. Muchas formas de crear.</p></div><a class="text-link" href="#/rutas">Ver todas las rutas →</a></div><div class="routes-grid">${routes.map((r) => routeCard(r, state)).join('')}</div></section><div class="home-bottom">${next ? `<a class="card continue-card" href="${lessonHref(next.route.id, next.lesson.id)}"><span class="stat-icon">▷</span><div><div class="eyebrow">TU SIGUIENTE PASO · ${e(next.route.name)}</div><h3>${e(next.lesson.title)}</h3><p>${next.lesson.minutes} min · Explica, experimenta y comprueba →</p></div></a>` : '<div class="card"><h3>Completaste las lecciones disponibles</h3><p>Vuelve a tus proyectos o explora los temas del mapa.</p></div>'}<div class="start-note"><h3>¿Nunca has escrito una línea de código?</h3><p>Estás en el lugar correcto. Empezaremos por las herramientas, con ejemplos y espacio para equivocarte.</p><a class="text-link" href="#/ruta/fundamentos">Conoce Fundamentos y lógica →</a></div></div></div>`;
}
export function routesPage(routes, state, filter = 'all') {
  const filtered =
    filter === 'all'
      ? routes
      : filter === 'open'
        ? routes.filter((r) => nextLesson(r, new Set(state.completed)))
        : routes.filter((r) => r.id === state.goal);
  return `<div class="page"><div class="page-intro"><div class="eyebrow"><span class="dot"></span> TU MAPA DE POSIBILIDADES</div><h1>Elige qué quieres construir.</h1><p>Empieza por Fundamentos o explora la introducción a IA. Cada ruta muestra los conocimientos necesarios y distingue lo disponible de lo que está en preparación.</p></div><div class="section-heading"><div class="filters"><button class="filter" data-filter="all" aria-pressed="${filter === 'all'}">Todas las rutas</button><button class="filter" data-filter="open" aria-pressed="${filter === 'open'}">Listas para empezar</button><button class="filter" data-filter="goal" aria-pressed="${filter === 'goal'}">Mi objetivo</button></div><label class="sr-only" for="goal-select">Mi objetivo</label><select id="goal-select" class="goal-select">${routes.map((r) => `<option value="${r.id}" ${state.goal === r.id ? 'selected' : ''}>${e(r.name)}</option>`).join('')}</select></div><div class="routes-grid">${filtered.map((r) => routeCard(r, state)).join('')}</div></div>`;
}
export function nodeState(route, lesson, state) {
  return state.completed.includes(lessonKey(route.id, lesson.id))
    ? 'done'
    : isUnlocked(route, lesson.id, new Set(state.completed))
      ? 'ready'
      : isPublished(lesson)
        ? 'locked'
        : 'planned';
}
export function routePage(route, state) {
  const count = publishedCount(route),
    done = completedCount(route, state);
  return `<div class="page"><a class="text-link" href="#/rutas">← Todas las rutas</a><div class="route-header ${route.color}" style="margin-top:18px"><div><div class="eyebrow">RUTA ${route.number} · ${e(route.eyebrow)}</div><h1>${e(route.name)}</h1><p>${e(route.description)}</p><div class="tags"><span class="badge live">${count} disponibles</span><span class="badge">${route.lessons.length - count} en preparación</span><span class="badge">${route.technologies.slice(0, 3).map(e).join(' · ')}</span></div></div><div class="route-summary"><strong>${done}/${count}</strong><small>lecciones disponibles completadas</small><div class="meter"><i style="width:${count ? Math.min((done / count) * 100, 100) : 0}%"></i></div></div></div><div class="legend"><span>▷ Disponible</span><span>✓ Completada</span><span>⌑ Requiere pasos previos</span><span>○ En preparación</span></div><div class="map-layout"><div>${route.levels
    .map(
      (lv, i) =>
        `<section class="level" data-step="${String(i + 1).padStart(2, '0')}"><h2>${e(lv.name)}</h2><p>${e(lv.objective)}</p><div class="nodes">${lv.lessons
          .map((m) => {
            const s = nodeState(route, m, state);
            return `<button class="map-node ${s}" data-node="${m.id}" aria-pressed="false"><span class="node-status" aria-hidden="true">${{ done: '✓', ready: '▷', locked: '⌑', planned: '○' }[s]}</span><span class="node-name">${e(m.title)}</span><small>${s === 'done' ? 'Completada' : s === 'ready' ? m.minutes + ' min' : s === 'planned' ? 'En preparación' : 'Con requisitos'}</small></button>`;
          })
          .join('')}</div></section>`,
    )
    .join(
      '',
    )}</div><aside class="card node-inspector" id="node-inspector" aria-live="polite"></aside></div></div>`;
}
export function inspector(route, lesson, state, routes) {
  const status = nodeState(route, lesson, state),
    byKey = (key) => {
      const [rid, lid] = key.split('/');
      return routes.find((r) => r.id === rid)?.lessons.find((l) => l.id === lid);
    };
  const missing = (lesson.dependsOn ?? []).filter((key) => !state.completed.includes(key));
  return `<span class="badge ${status === 'ready' || status === 'done' ? 'live' : ''}">${{ done: 'Completada', ready: 'Lista para aprender', locked: 'Construye la base primero', planned: 'Contenido en preparación' }[status]}</span><h3>${e(lesson.title)}</h3><p>En esta etapa trabajarás estos conceptos:</p><div class="tags">${lesson.concepts.map((c) => `<span class="tag">${e(c)}</span>`).join('')}</div><p><strong>${lesson.kind === 'optional' ? 'Profundización opcional' : 'Parte del recorrido principal'}</strong></p>${missing.length ? `<p>Pasos previos:</p><ul>${missing.map((key) => `<li><a class="text-link" href="#/ruta/${key.split('/')[0]}/${key.split('/')[1]}">${e(byKey(key)?.title ?? key)}</a></li>`).join('')}</ul>` : '<p>Ya tienes la base necesaria para este paso.</p>'}${status === 'ready' || status === 'done' ? `<a class="btn" href="${lessonHref(route.id, lesson.id)}">${status === 'done' ? 'Repasar la lección' : 'Entrar al laboratorio'} →</a>` : status === 'planned' ? '<p>El tema forma parte del mapa, pero todavía no incluye una lección. No cuenta como contenido disponible.</p>' : '<p>Completa la práctica y la comprobación de los pasos previos para desbloquear esta lección.</p>'}`;
}
export function progressPage(routes, state, concepts) {
  const evidence = conceptEvidence(state),
    items = [...evidence].map(([id, result]) => ({
      id,
      ...result,
      label: concepts.get(id)?.label ?? id,
    }));
  const weak = items.filter((i) => i.correct < i.total);
  return `<div class="page"><div class="page-intro"><div class="eyebrow"><span class="dot"></span> CADA PASO CUENTA</div><h1>Lo que sabes hacer, crece.</h1><p>El progreso reúne práctica, comprobaciones y proyectos. Los aciertos son evidencia de aprendizaje; el XP acompaña el recorrido.</p></div><div class="quick-stats"><div class="quick-stat"><div><b>${state.completed.length}</b><small>Lecciones completadas</small></div></div><div class="quick-stat"><div><b>${state.xp}</b><small>XP ganados una sola vez por logro</small></div></div><div class="quick-stat"><div><b>${state.practices.length}</b><small>Prácticas resueltas</small></div></div></div><div class="section-heading"><h2>Tu recorrido por rutas</h2><button class="btn ghost small" id="export-progress">Exportar progreso ↓</button></div><div class="progress-routes">${routes
    .map((r) => {
      const done = completedCount(r, state),
        n = publishedCount(r);
      return `<a class="card progress-route" href="#/ruta/${r.id}"><div><strong>${e(r.name)}</strong><span>${done}/${n}</span></div><div class="meter"><i style="width:${n ? Math.min((done / n) * 100, 100) : 0}%"></i></div><p>${r.lessons.length - n} temas adicionales en preparación.</p></a>`;
    })
    .join(
      '',
    )}</div><div class="section-heading" style="margin-top:32px"><div><h2>Conceptos para reforzar</h2><p>Se toma el último intento de cada lección. Una comprobación no garantiza dominio permanente.</p></div></div>${weak.length ? `<div class="evidence-grid">${weak.map((i) => `<a class="evidence-row" href="#/ruta/${concepts.get(i.id)?.introducedBy.split('/')[0]}/${concepts.get(i.id)?.introducedBy.split('/')[1]}"><div><strong>${e(i.label)}</strong><small>${i.correct} de ${i.total} respuestas correctas en los últimos intentos</small></div><span>Repasar →</span></a>`).join('')}</div>` : '<div class="empty-state"><h3>' + (items.length ? 'Sin dificultades registradas en tus últimos intentos' : 'Tu evidencia de aprendizaje empieza con una práctica') + '</h3><p>Las comprobaciones te ayudarán a identificar qué conviene repasar.</p><a class="btn" href="#/practica">Ir al laboratorio →</a></div>'}<div class="callout">Tu progreso se guarda localmente. Exporta una copia antes de borrar los datos del navegador o cambiar de dispositivo. La exportación es una copia de lectura, no una cuenta sincronizada.</div></div>`;
}
export function practicePage(routes, state) {
  const bookmarks = state.bookmarks.filter((key) => {
    const [rid, lid] = key.split('/');
    return routes.find((r) => r.id === rid)?.lessons.some((l) => l.id === lid);
  });
  const available = routes.flatMap((r) =>
    r.lessons
      .filter((l) => isUnlocked(r, l.id, new Set(state.completed)))
      .map((l) => ({ route: r, lesson: l })),
  );
  return `<div class="page"><div class="page-intro"><div class="eyebrow"><span class="dot"></span> MENOS MEMORIZAR. MÁS EXPERIMENTAR.</div><h1>Tu laboratorio de ideas.</h1><p>Predice, prueba y descubre qué cambia. Aquí los errores son información para tu siguiente intento.</p></div><div class="section-heading"><h2>Experimenta con un concepto</h2><span class="badge">Simulaciones locales · Sin API</span></div><div class="lab-grid"><div data-lab="cycle-lab"></div><div data-lab="condition-lab"></div><div data-lab="diffusion-lab"></div><div data-lab="token-lab"></div></div><div class="section-heading" style="margin-top:32px"><h2>Prácticas de tu recorrido</h2></div><div class="review-list">${available.map(({ route: r, lesson: l }) => `<a class="card" href="${lessonHref(r.id, l.id, 'practicar')}"><div><div class="eyebrow">${e(r.name)}</div><h3>${e(l.title)}</h3><p>${state.completed.includes(lessonKey(r.id, l.id)) ? 'Vuelve con un nuevo intento' : 'Un ejercicio para aplicar lo aprendido'}</p></div><span class="btn ghost small">Practicar →</span></a>`).join('')}</div>${
    bookmarks.length
      ? `<div class="section-heading" style="margin-top:32px"><h2>Guardado para volver</h2></div><div class="review-list">${bookmarks
          .map((key) => {
            const [rid, lid] = key.split('/'),
              r = routes.find((r) => r.id === rid),
              l = r.lessons.find((l) => l.id === lid);
            return `<a class="card" href="${lessonHref(rid, lid)}">${e(l.title)} <span>→</span></a>`;
          })
          .join('')}</div>`
      : ''
  }</div>`;
}
