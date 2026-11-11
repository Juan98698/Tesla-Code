import { escapeHtml as e } from '../core/html.js';
import { mountDepthScene } from './depth-scene.js';
import { teslaHologram, mountTeslaHologram } from './tesla-hologram.js';
import { accessState, isPublished, lessonKey } from '../domain/curriculum.js';
import { playgroundSettings, runPlayground } from '../domain/playground.js';
const symbols = {
  fundamentos: '{ }',
  algoritmia: '⌘',
  frontend: '</>',
  backend: '>_',
  'bases-de-datos': '▤',
  ia: '✳',
  python: 'Py',
};
const points = {
  backend: [
    'cliente-y-servidor',
    'http-en-profundidad',
    'node-js-runtime-y-modulos',
    'conectar-con-una-base-de-datos',
    'autenticacion-y-sesiones',
    'proyecto-final-api-de-produccion',
  ],
  frontend: [
    'como-funciona-internet',
    'html-semantico',
    'css-moderno',
    'react-componentes-y-jsx',
    'next-js-y-renderizado-en-el-servidor',
    'proyecto-final-aplicacion-web-completa',
  ],
  'bases-de-datos': [
    'datos-informacion-y-sistemas',
    'modelo-relacional',
    'select-filtros-y-orden',
    'indices',
    'documentos-con-mongodb',
    'proyecto-final-plataforma-de-datos',
  ],
  ia: [
    'que-es-la-inteligencia-artificial',
    'llm-tokens-y-contexto',
    'apis-de-modelos',
    'rag',
    'redes-neuronales',
    'proyecto-final-producto-con-ia',
  ],
};
export function studioMilestones(route, next) {
  const candidates =
    points[route.id]?.map((id) => route.lessons.find((l) => l.id === id)).filter(Boolean) ??
    route.lessons.filter((l) => l.kind !== 'optional').slice(0, 6);
  return [
    ...new Map(
      [
        next,
        ...candidates.filter((l) => !next || route.pos[l.id] >= route.pos[next.id]),
        ...route.lessons.filter((l) => !next || route.pos[l.id] >= route.pos[next.id]),
      ]
        .filter(Boolean)
        .map((l) => [l.id, l]),
    ).values(),
  ].slice(0, 6);
}
function illustration(id) {
  if (id === 'bases-de-datos')
    return '<div class="mini-tables"><div><b>proyectos</b><span>id</span><span>nombre</span></div><i></i><div><b>rutas</b><span>id</span><span>ruta_id</span></div></div>';
  if (id === 'ia')
    return '<svg viewBox="0 0 180 100" fill="none" stroke="currentColor" stroke-width="1.2"><path d="M30 50 80 20 135 50 80 80ZM30 50h105M80 20v60"/><g fill="currentColor"><circle cx="30" cy="50" r="5"/><circle cx="80" cy="20" r="5"/><circle cx="80" cy="50" r="5"/><circle cx="80" cy="80" r="5"/><circle cx="135" cy="50" r="5"/></g></svg>';
  return '<div class="mini-browser"><div>● ● ●</div><i></i><span></span><span></span></div>';
}
export function studioHome(routes, state, next, href) {
  const route = next?.route ?? routes.find((r) => r.id === state.goal) ?? routes[0];
  const entry = next?.lesson ?? route.lessons.find(isPublished);
  const settings = playgroundSettings(route.id),
    completed = new Set(state.completed);
  const milestones = studioMilestones(route, entry);
  const featured = [
    'python',
    'frontend',
    'bases-de-datos',
    'ia',
    'backend',
    'algoritmia',
    'fundamentos',
  ]
    .map((id) => routes.find((r) => r.id === id))
    .filter((r) => r && r.id !== route.id)
    .slice(0, 3);
  const startHref = entry
    ? href(route.id, entry.id, state.learningMode === 'experienced' ? 'practicar' : 'aprender')
    : '#/rutas';
  const totalLessons = routes.reduce((sum, r) => sum + r.lessons.filter(isPublished).length, 0);
  const shortNames = {
    fundamentos: 'Fundamentos',
    algoritmia: 'Algoritmia',
    frontend: 'Frontend',
    backend: 'Backend',
    'bases-de-datos': 'Datos',
    ia: 'IA',
    python: 'Python',
  };
  return `<div class="page studio-home" data-studio-route="${e(route.id)}">
  <header class="hero studio-intro">
    <div class="launch-copy">
      <div class="eyebrow"><span class="launch-signal" aria-hidden="true"></span> UNA IDEA. INFINITAS POSIBILIDADES.</div>
      <h1>Construye lo que <em>imaginas.</em></h1>
      <p>De tu primera línea a tu próximo gran proyecto. Aprende, experimenta y conecta lo que sabes.</p>
      <div class="launch-actions"><a class="btn launch-primary" href="${startHref}">${state.recent ? 'Continuar aprendiendo' : 'Empieza tu primera lección'} <span aria-hidden="true">↗</span></a><a class="studio-explore" href="#/rutas">Explorar las ${routes.length} rutas <span aria-hidden="true">→</span></a></div>
      <div class="launch-proof"><div><strong>${String(routes.length).padStart(2, '0')}</strong><span>rutas para explorar</span></div><div><strong>${totalLessons}</strong><span>lecciones disponibles</span></div><div><strong>Tu ritmo.</strong><span>Tu siguiente versión.</span></div></div>
    </div>
    <div class="hero-art knowledge-scene" data-depth-scene data-gaze-tracking role="group" aria-label="Elige tu ruta junto a Nikola Tesla">
      <div class="scene-coordinate" aria-hidden="true">IDEAS → HABILIDADES → PROYECTOS</div>
      <div class="depth-decoration" aria-hidden="true"><div class="orbit-floor"></div><div class="orbit-ring ring-one"></div><div class="orbit-ring ring-two"></div><div class="orbit-ring ring-three"></div>${teslaHologram()}<span class="scene-spark spark-one"></span><span class="scene-spark spark-two"></span><span class="scene-spark spark-three"></span></div>
      <div class="orbit-routes">${routes.map((r, i) => `<button class="orbit-chip ${r.id === route.id ? 'selected' : ''}" type="button" data-orbit-route="${r.id}" style="--orbit:${i}" aria-label="Elegir ruta ${e(r.name)}" aria-pressed="${r.id === route.id}"><span aria-hidden="true">${e(symbols[r.id])}</span><strong>${e(shortNames[r.id] ?? r.name)}</strong><i aria-hidden="true"></i></button>`).join('')}</div>
      <div class="scene-caption"><span class="scene-caption-mark" aria-hidden="true">↗</span><div><strong>Nikola Tesla · Todo empieza con curiosidad.</strong><span>Elige una habilidad. Conecta tu futuro.</span></div></div>
      <button class="motion-control" id="motion-toggle" type="button" aria-label="Pausar animaciones" aria-pressed="false">Pausar animaciones</button>
    </div>
  </header>
  <div class="workspace-heading"><div><span class="section-index">01 / TU SIGUIENTE NIVEL</span><h2>Una idea se convierte en habilidad.</h2></div><span class="workspace-caption">Un paso claro. Una prueba real.</span></div><div class="studio-workspace"><section class="studio-panel pathway-panel" aria-labelledby="studio-route-heading"><div class="studio-panel-heading"><div><span class="studio-heading-icon" aria-hidden="true">${e(symbols[route.id])}</span><h2 id="studio-route-heading">Tu ruta: ${e(route.name)}</h2></div><span class="entry-badge">Entrada libre</span></div><div class="studio-route-controls"><label for="studio-route-select">¿Qué quieres aprender?</label><select id="studio-route-select">${routes.map((r) => `<option value="${r.id}" ${r.id === route.id ? 'selected' : ''}>${e(r.name)}</option>`).join('')}</select><a class="text-link" href="#/ruta/${route.id}">Ver mapa completo →</a></div><div class="studio-map-caption"><span>HITOS DE TU RECORRIDO</span><span>${route.lessons.filter((l) => completed.has(lessonKey(route.id, l.id))).length} / ${route.lessons.filter(isPublished).length} completadas</span></div><div class="studio-map"><svg class="studio-connections" viewBox="0 0 600 220" preserveAspectRatio="none" aria-hidden="true"><path d="M100 48H500V100Q500 112 486 112H114Q100 112 100 126V172H500"/></svg>${milestones
    .map((m, i) => {
      const status = accessState(route, m.id, completed).status;
      const destination =
        status === 'ready' || status === 'done'
          ? href(route.id, m.id)
          : `#/ruta/${route.id}/${m.id}`;
      return `<a class="studio-node ${status} ${m.id === entry?.id ? 'current' : ''}" href="${destination}"><span class="studio-node-icon" aria-hidden="true">${i === 5 ? '⚑' : i === 0 ? symbols[route.id] : String(i + 1).padStart(2, '0')}</span><strong>${e(m.title.replace(/^Proyecto final: /, 'Proyecto: '))}</strong><small>${status === 'planned' ? 'En preparación' : status === 'done' ? '✓ Completada' : status === 'ready' ? `${m.minutes} min · Empezar` : 'Paso previo'}</small></a>`;
    })
    .join(
      '',
    )}</div><p class="studio-map-note">Una vista de los hitos. El mapa completo muestra todos los pasos y las especializaciones.</p><div class="studio-support-strip"><span aria-hidden="true">▱</span><div><strong>Avanza a tu manera</strong><p>Explicaciones, práctica y repasos cuando los necesites.</p></div><a class="text-link" href="#/ruta/${route.id}">Ver apoyos →</a></div>${!next ? '<p class="studio-complete">Completaste las lecciones disponibles. Puedes repasar o elegir otra ruta.</p>' : ''}</section>
  <section class="studio-panel lab-preview continue-card" aria-labelledby="studio-lab-heading"><div class="studio-lab-heading"><div class="eyebrow">LAB INTERACTIVO</div><h2 id="studio-lab-heading">${e(settings.title)}</h2><p>${e(settings.goal)}</p><span class="studio-local-note" id="studio-sim-note">${route.id === 'ia' ? 'Búsqueda local de evidencia · Sin modelo remoto' : 'Simulación local del concepto'}</span></div><div class="studio-flow" aria-label="Flujo del ejemplo"><div><span aria-hidden="true">${e(symbols[route.id])}</span><strong>${e(settings.from)}</strong></div><span class="studio-flow-arrow"><small>${e(settings.action)}</small><i aria-hidden="true">→</i></span><div><span aria-hidden="true">▤</span><strong>${e(settings.to)}</strong></div></div>
  <div class="studio-lab-guide"><strong>Haz esta prueba</strong><p>${e(settings.try)}</p>${settings.reference ? `<details class="studio-reference"><summary>Leer los documentos de este ejemplo</summary><p>${e(settings.reference)}</p></details>` : ''}</div><div class="studio-computer"><div class="holo-computer"><div class="console-chrome" aria-hidden="true"><span></span><span></span><span></span><small>Vista del ejemplo</small><i>LOCAL</i></div><div class="studio-screen"><div class="studio-screen-tabs" role="tablist" aria-label="Vista del ejemplo"><button id="studio-tab-code" type="button" role="tab" aria-selected="false" aria-controls="studio-terminal" tabindex="-1" data-preview-tab="request">${route.id === 'backend' ? 'Petición' : 'Cómo funciona'}</button><button id="studio-tab-result" type="button" role="tab" aria-selected="true" aria-controls="studio-terminal" data-preview-tab="result">${route.id === 'backend' ? 'Respuesta' : 'Resultado'}</button></div><div id="studio-terminal" role="tabpanel" tabindex="0" aria-labelledby="studio-tab-result"><pre id="studio-output"></pre><div id="studio-dom-preview" hidden></div></div></div><div class="console-bottom" aria-hidden="true"><span>● Listo para explorar</span><span>↵</span></div></div></div>
  <form id="studio-form" class="studio-form"><label for="studio-value">${e(settings.label)}</label><div>${settings.options ? `<select id="studio-value">${settings.options.map((s) => `<option ${s === settings.value ? 'selected' : ''}>${e(s)}</option>`).join('')}</select>` : `<input id="studio-value" type="${settings.type ?? 'text'}" value="${e(settings.value)}" required maxlength="160" ${settings.type === 'number' ? 'min="-1000000" max="1000000" step="any"' : ''}/>`}<button class="studio-run" type="submit">Probar →</button></div></form><p class="studio-status" id="studio-status" role="status">Ejemplo inicial · Cambia la entrada y pulsa Probar</p><div class="studio-explanation"><strong>Qué está pasando</strong><p id="studio-explanation"></p><p class="studio-observe">${e(settings.observe)}</p></div><p id="studio-error" class="studio-error" role="alert" hidden></p><div class="studio-lab-footer"><a class="btn" href="${startHref}">Aplicarlo en mi lección →</a><small>${entry?.minutes ?? 0} min · Aprende, practica y comprueba</small></div></section></div>
  <section class="studio-discover"><div class="section-heading"><div><span class="section-index">02 / SIGUE TU CURIOSIDAD</span><h2>¿Qué vas a crear después?</h2><p>Un mundo de posibilidades. Tu punto de partida.</p></div><a class="text-link" href="#/rutas">Ver todas →</a></div><div class="studio-featured">${featured
    .map((r) => {
      const first = r.lessons.find(isPublished);
      return `<article class="route-card studio-feature ${r.color}"><div class="feature-copy"><span class="feature-symbol" aria-hidden="true">${e(symbols[r.id])}</span><h3>${e(r.name)}</h3><p>${e(r.tagline)}</p><a class="text-link" href="${first ? href(r.id, first.id) : `#/ruta/${r.id}`}">Empezar ruta →</a></div><div class="feature-illustration" aria-hidden="true">${illustration(r.id)}</div></article>`;
    })
    .join('')}</div></section></div>`;
}
export function mountStudio(root, routes, onRoute) {
  const portrait = mountTeslaHologram(root);
  const disposeDepth = mountDepthScene(root, portrait);
  const chooseRoute = (id, selector) => {
    const view = root.ownerDocument.defaultView;
    const top = view.scrollY;
    const offset = root.ownerDocument.querySelector(selector)?.getBoundingClientRect().top;
    onRoute(id);
    const control = root.ownerDocument.querySelector(selector);
    const destination =
      control && offset !== undefined
        ? view.scrollY + control.getBoundingClientRect().top - offset
        : top;
    view.scrollTo({ top: destination, behavior: 'instant' });
    control?.focus({ preventScroll: true });
  };
  root.querySelectorAll('[data-orbit-route]').forEach((button) => {
    button.onclick = () => {
      const id = button.dataset.orbitRoute;
      chooseRoute(id, `[data-orbit-route="${id}"]`);
    };
  });
  const id = root.querySelector('[data-studio-route]').dataset.studioRoute;
  const control = root.querySelector('#studio-value');
  let result = runPlayground(id, control.value),
    tab = 'result';
  const draw = () => {
    const preview = root.querySelector('#studio-dom-preview'),
      output = root.querySelector('#studio-output');
    output.textContent = tab === 'request' ? result.request : JSON.stringify(result.body, null, 2);
    root.querySelector('#studio-explanation').textContent = result.explanation;
    preview.hidden = !(tab === 'result' && result.preview);
    preview.textContent = result.preview ?? '';
    output.hidden = !preview.hidden;
    root.querySelectorAll('[data-preview-tab]').forEach((button) => {
      const selected = button.dataset.previewTab === tab;
      button.setAttribute('aria-selected', String(selected));
      button.tabIndex = selected ? 0 : -1;
    });
    root
      .querySelector('#studio-terminal')
      .setAttribute('aria-labelledby', tab === 'request' ? 'studio-tab-code' : 'studio-tab-result');
  };
  const tabs = [...root.querySelectorAll('[data-preview-tab]')];
  tabs.forEach((button, i) => {
    button.onclick = () => {
      tab = button.dataset.previewTab;
      draw();
    };
    button.onkeydown = (event) => {
      if (['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) {
        event.preventDefault();
        tabs[event.key === 'Home' ? 0 : event.key === 'End' ? 1 : 1 - i].focus();
      }
    };
  });
  root.querySelector('#studio-form').onsubmit = (event) => {
    event.preventDefault();
    const error = root.querySelector('#studio-error');
    try {
      result = runPlayground(id, control.value);
      tab = 'result';
      error.hidden = true;
      root.querySelector('#studio-status').textContent = result.status;
      root
        .querySelector('#studio-status')
        .classList.toggle('is-error', result.status.startsWith('404'));
      draw();
    } catch (e) {
      error.textContent = e.message;
      error.hidden = false;
    }
  };
  root.querySelector('#studio-route-select').onchange = (event) => {
    if (routes.some((r) => r.id === event.target.value))
      chooseRoute(event.target.value, '#studio-route-select');
  };
  draw();
  return () => {
    disposeDepth();
    portrait?.dispose();
  };
}
