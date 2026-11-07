import { escapeHtml as e } from '../core/html.js';
import { assetUrl } from '../core/assets.js';
import { accessState, isPublished, lessonKey } from '../domain/curriculum.js';
import { playgroundSettings, runPlayground } from '../domain/playground.js';
const symbols = {
  fundamentos: '{ }',
  algoritmia: '⌘',
  frontend: '</>',
  backend: '>_',
  'bases-de-datos': '▤',
  ia: '✳',
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
  const featured = ['frontend', 'bases-de-datos', 'ia', 'backend', 'algoritmia', 'fundamentos']
    .map((id) => routes.find((r) => r.id === id))
    .filter((r) => r && r.id !== route.id)
    .slice(0, 3);
  const startHref = entry
    ? href(route.id, entry.id, state.learningMode === 'experienced' ? 'practicar' : 'aprender')
    : '#/rutas';
  return `<div class="page studio-home" data-studio-route="${e(route.id)}"><header class="hero studio-intro"><div><div class="eyebrow">TU PRÓXIMO PASO</div><h1>Construye lo que imaginas.</h1><p>Elige tu ruta. Aprende haciendo. Conecta cada habilidad.</p></div><a class="studio-explore" href="#/rutas">Explorar las ${routes.length} rutas <span>→</span></a></header><div class="studio-workspace"><section class="studio-panel pathway-panel" aria-labelledby="studio-route-heading"><div class="studio-panel-heading"><div><span class="studio-heading-icon" aria-hidden="true">${e(symbols[route.id])}</span><h2 id="studio-route-heading">Tu ruta: ${e(route.name)}</h2></div><span class="entry-badge">Entrada libre</span></div><div class="studio-route-controls"><label for="studio-route-select">¿Qué quieres aprender?</label><select id="studio-route-select">${routes.map((r) => `<option value="${r.id}" ${r.id === route.id ? 'selected' : ''}>${e(r.name)}</option>`).join('')}</select><a class="text-link" href="#/ruta/${route.id}">Ver mapa completo →</a></div><div class="studio-map-caption"><span>HITOS DE TU RECORRIDO</span><span>${route.lessons.filter((l) => completed.has(lessonKey(route.id, l.id))).length} / ${route.lessons.filter(isPublished).length} completadas</span></div><div class="studio-map"><svg class="studio-connections" viewBox="0 0 600 220" preserveAspectRatio="none" aria-hidden="true"><path d="M100 48H500V100Q500 112 486 112H114Q100 112 100 126V172H500"/></svg>${milestones
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
  <section class="studio-panel lab-preview continue-card" aria-labelledby="studio-lab-heading"><div class="studio-lab-heading"><div class="eyebrow">LAB INTERACTIVO</div><h2 id="studio-lab-heading">Prueba la idea</h2><p>${e(settings.title)}</p><span class="studio-local-note" id="studio-sim-note">${route.id === 'ia' ? 'Búsqueda local de evidencia · Sin modelo remoto' : 'Simulación local del concepto'}</span></div><div class="studio-flow" aria-label="Flujo del ejemplo"><div><span aria-hidden="true">${e(symbols[route.id])}</span><strong>${e(settings.from)}</strong></div><span class="studio-flow-arrow"><small>${e(settings.action)}</small><i aria-hidden="true">→</i></span><div><span aria-hidden="true">▤</span><strong>${e(settings.to)}</strong></div></div>
  <div class="hero-art studio-computer"><div class="holo-computer"><img class="computer-art" src="${assetUrl('assets/studio/holographic-computer.webp')}" width="1448" height="1086" alt=""/><div class="studio-rain" aria-hidden="true">${Array.from({ length: 12 }, (_, i) => `<span style="--i:${i}">01サ010ラ01タ10コ1</span>`).join('')}</div><div class="studio-screen"><div class="studio-screen-tabs" role="tablist" aria-label="Vista del ejemplo"><button id="studio-tab-code" type="button" role="tab" aria-selected="false" aria-controls="studio-terminal" tabindex="-1" data-preview-tab="request">${route.id === 'backend' ? 'Petición' : 'Código'}</button><button id="studio-tab-result" type="button" role="tab" aria-selected="true" aria-controls="studio-terminal" data-preview-tab="result">${route.id === 'backend' ? 'Respuesta' : 'Resultado'}</button></div><div id="studio-terminal" role="tabpanel" tabindex="0" aria-labelledby="studio-tab-result"><pre id="studio-output"></pre><div id="studio-dom-preview" hidden></div></div></div></div><button class="motion-control" id="motion-toggle" aria-label="Pausar efecto holográfico" aria-pressed="false">Pausar efecto</button></div>
  <form id="studio-form" class="studio-form"><label for="studio-value">${e(settings.label)}</label><div>${settings.options ? `<select id="studio-value">${settings.options.map((s) => `<option ${s === settings.value ? 'selected' : ''}>${e(s)}</option>`).join('')}</select>` : `<input id="studio-value" type="${settings.type ?? 'text'}" value="${e(settings.value)}" required maxlength="160" ${settings.type === 'number' ? 'min="-1000000" max="1000000" step="any"' : ''}/>`}<button class="studio-run" type="submit">Probar →</button></div></form><p class="studio-status" id="studio-status" role="status">Listo para probar</p><p id="studio-error" class="studio-error" role="alert" hidden></p><div class="studio-lab-footer"><a class="btn" href="${startHref}">${state.recent ? 'Continuar aprendiendo' : 'Empieza tu primera lección'} →</a><small>${entry?.minutes ?? 0} min · Aprende, practica y comprueba</small></div></section></div>
  <section class="studio-discover"><div class="section-heading"><div><h2>Explora sin límites</h2><p>Todas las rutas tienen un punto de entrada.</p></div><a class="text-link" href="#/rutas">Ver todas →</a></div><div class="studio-featured">${featured
    .map((r) => {
      const first = r.lessons.find(isPublished);
      return `<article class="route-card studio-feature ${r.color}"><div class="feature-copy"><span class="feature-symbol" aria-hidden="true">${e(symbols[r.id])}</span><h3>${e(r.name)}</h3><p>${e(r.tagline)}</p><a class="text-link" href="${first ? href(r.id, first.id) : `#/ruta/${r.id}`}">Empezar ruta →</a></div><div class="feature-illustration" aria-hidden="true">${illustration(r.id)}</div></article>`;
    })
    .join('')}</div></section></div>`;
}
export function mountStudio(root, routes, onRoute) {
  const id = root.querySelector('[data-studio-route]').dataset.studioRoute;
  const control = root.querySelector('#studio-value');
  let result = runPlayground(id, control.value),
    tab = 'result';
  const draw = () => {
    const preview = root.querySelector('#studio-dom-preview'),
      output = root.querySelector('#studio-output');
    output.textContent = tab === 'request' ? result.request : JSON.stringify(result.body, null, 2);
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
    if (routes.some((r) => r.id === event.target.value)) onRoute(event.target.value);
  };
  draw();
}
