import { escapeHtml as e } from '../core/html.js';
import {
  lessonKey,
  isPublished,
  isUnlocked,
  nextLesson,
  accessState,
} from '../domain/curriculum.js';
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
const terminalExamples = {
  fundamentos: [
    'primer_programa.py',
    'nombre = "mundo"',
    'print("Hola, " + nombre)',
    'Hola, mundo',
  ],
  algoritmia: ['encontrar_mayor.py', 'datos = [-8, -3, -6]', 'print(max(datos))', '-3'],
  frontend: [
    'tu_interfaz.html',
    '<button>Crear algo nuevo</button>',
    '<style>button { color: cyan; }</style>',
    'Una idea toma forma',
  ],
  backend: ['peticion.http', 'GET /saludo HTTP/1.1', 'Host: ejemplo.local', '200 OK · Hola, mundo'],
  'bases-de-datos': ['consulta.sql', 'SELECT nombre', 'FROM proyectos;', 'Tu próxima idea'],
  ia: [
    'contexto.txt',
    'pregunta + evidencia',
    '→ modelo → verificar respuesta',
    'Generar · Comprobar',
  ],
};
function holographicComputer(route) {
  const [file, line1, line2, output] = terminalExamples[route.id];
  return `<div class="hologram" aria-hidden="true"><div class="holo-halo"></div><div class="holo-computer"><div class="holo-screen"><div class="holo-top"><span>● ● ●</span><span>${e(file)}</span><span>_</span></div><div class="digital-rain">${Array.from({ length: 14 }, (_, i) => `<span style="--i:${i}">${['0101 0011 10', '1010 1100 01', '0010 1011 00'][i % 3]}</span>`).join('')}</div><div class="holo-code"><small>TESLACODE / ${e(route.id.toUpperCase())}</small><p><b>›</b> ${e(line1)}</p><p><b>›</b> ${e(line2)}</p><div class="holo-output">${e(output)} <span>▌</span></div></div></div><div class="holo-stand"></div><div class="holo-keyboard">${'<i></i>'.repeat(36)}</div></div><div class="projection-plane"></div></div>`;
}
export function homePage(routes, state) {
  const next = continuation(routes, state),
    goal = routes.find((r) => r.id === state.goal) ?? routes[0];
  return `<div class="page home-page"><section class="hero" aria-label="Comienza tu aprendizaje"><div class="hero-copy"><div class="eyebrow"><span class="dot"></span> APRENDE. CONSTRUYE. EVOLUCIONA.</div><h1>Tu próxima idea<br>empieza <em>aquí.</em></h1><p>Aprende a programar y conecta cada habilidad con algo que puedes crear.</p><a class="btn" href="#/rutas">Explorar rutas <span>→</span></a><div class="hero-caption">Tu curiosidad marca el comienzo.</div></div><div class="hero-art">${holographicComputer(next?.route ?? goal)}<button class="motion-control" id="motion-toggle" aria-label="Pausar efecto holográfico" aria-pressed="false">Ⅱ <span>Pausar efecto</span></button></div></section>
  ${next ? `<section class="continue-card card" aria-label="Tu siguiente paso"><div class="continue-label"><span class="eyebrow">TU SIGUIENTE PASO</span><h2>${e(next.lesson.title)}</h2><p>${e(next.route.name)} <span>·</span> ${next.lesson.minutes} min</p></div><div class="learning-steps" aria-label="Aprende, practica y comprueba"><span>Aprender</span><i></i><span>Practicar</span><i></i><span>Comprobar</span></div><div class="continue-actions"><a class="btn" href="${lessonHref(next.route.id, next.lesson.id, state.learningMode === 'experienced' ? 'practicar' : 'aprender')}">${state.recent ? 'Continuar aprendiendo' : 'Empieza tu primera lección'} →</a><a class="text-link" href="#/ruta/${next.route.id}">Ver mapa</a></div></section>` : '<section class="card"><h2>Completaste las lecciones disponibles</h2><p>Vuelve a tus proyectos o explora los temas del mapa.</p><a class="text-link" href="#/rutas">Explorar rutas →</a></section>'}
  <section class="paths-section"><div class="section-heading"><div><h2>Elige tu camino</h2><p>Todas las rutas tienen un punto de entrada.</p></div><a class="text-link" href="#/rutas">Ver todas →</a></div><div class="route-shortcuts">${routes.map((r) => `<a class="route-card route-shortcut ${r.color}" href="#/ruta/${r.id}"><span class="shortcut-icon" aria-hidden="true">${e(glyphs[r.id])}</span><span>${e(r.name)}</span><span class="shortcut-arrow" aria-hidden="true">→</span></a>`).join('')}</div></section><div class="home-help"><p>¿Tu primera línea de código? <a class="text-link" href="#/ruta/fundamentos">Empieza por Fundamentos →</a></p><small>Aprende a tu ritmo. El progreso se guarda en este navegador.</small></div></div>`;
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
  return `<div class="page"><a class="text-link" href="#/rutas">← Todas las rutas</a><div class="route-header ${route.color}" style="margin-top:18px"><div><div class="eyebrow">RUTA ${route.number} · ${e(route.eyebrow)}</div><h1>${e(route.name)}</h1><p>${e(route.description)}</p><div class="tags"><span class="badge live">${count} disponibles</span><span class="badge">${route.lessons.length - count} en preparación</span><span class="badge">${route.technologies.slice(0, 3).map(e).join(' · ')}</span></div></div><div class="route-summary"><strong>${done}/${count}</strong><small>lecciones disponibles completadas</small><div class="meter"><i style="width:${count ? Math.min((done / count) * 100, 100) : 0}%"></i></div></div></div><div class="legend"><span>▷ Disponible</span><span>✓ Completada</span><span>⌑ Requiere pasos previos</span><span>○ En preparación</span></div><details class="learning-support" id="route-orientation"><summary>¿Quieres orientarte antes de empezar? <span>Opcional · 3 preguntas</span></summary><p>Explora los conceptos iniciales para elegir cómo acompañarte. Puedes comenzar la ruta directamente cuando quieras.</p><div id="orientation-body"><p class="muted">Preparando preguntas…</p></div></details><div class="map-layout"><div>${route.levels
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
      return routes.find((r) => r.id === rid)?.lessons.find((l) => l.id === lid);
    };
  const { required: missing, recommended } = accessState(
    route,
    lesson.id,
    new Set(state.completed),
  );
  return `<span class="badge ${status === 'ready' || status === 'done' ? 'live' : ''}">${{ done: 'Completada', ready: 'Lista para aprender', locked: 'Completa el paso anterior', planned: 'Contenido en preparación' }[status]}</span><h3>${e(lesson.title)}</h3><p>En esta etapa trabajarás estos conceptos:</p><div class="tags">${lesson.concepts.map((c) => `<span class="tag">${e(c)}</span>`).join('')}</div><p><strong>${lesson.kind === 'optional' ? 'Profundización opcional' : 'Parte del recorrido principal'}</strong></p>${missing.length ? `<p>Pasos previos:</p><ul>${missing.map((key) => `<li><a class="text-link" href="#/ruta/${key.split('/')[0]}/${key.split('/')[1]}">${e(byKey(key)?.title ?? key)}</a></li>`).join('')}</ul>` : status === 'planned' ? '<p>Este tema forma parte del recorrido previsto.</p>' : '<p>Puedes empezar aquí y consultar los repasos que necesites.</p>'}${recommended.length ? `<details class="route-recommendations"><summary>Referencias de otras rutas · opcionales</summary><ul>${recommended.map((key) => `<li><a class="text-link" href="#/ruta/${e(key)}">${e(byKey(key)?.title ?? key)}</a></li>`).join('')}</ul><p>Puedes consultar estas referencias sin completarlas para entrar aquí.</p></details>` : ''}${status === 'ready' || status === 'done' ? `<a class="btn" href="${lessonHref(route.id, lesson.id, state.learningMode === 'experienced' ? 'practicar' : 'aprender')}">${status === 'done' ? 'Repasar la lección' : 'Empezar la lección'} →</a>` : status === 'planned' ? '<p>El tema forma parte del mapa, pero todavía no incluye una lección. No cuenta como contenido disponible.</p>' : '<p>Completa la práctica y la comprobación de los pasos previos para desbloquear esta lección.</p>'}`;
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
