import { escapeHtml as e } from '../core/html.js';
import { mountActivities } from './activities.js';

export function recommendedConcepts(route, meta, concepts) {
  return (meta.requiresConcepts ?? [])
    .map((id) => concepts.get(id))
    .filter((concept) => concept && !concept.introducedBy.startsWith(`${route.id}/`));
}

export function supportPanel(route, meta, concepts) {
  const items = recommendedConcepts(route, meta, concepts);
  if (!items.length) return '';
  return `<details class="learning-support"><summary>Repasos opcionales <span>${items.length} conceptos</span></summary><p>Consulta solo lo que necesites y continúa en ${e(route.name)}. Estos repasos no son requisitos de acceso.</p>${items.map((c) => `<details class="concept-refresher"><summary>${e(c.label)}</summary>${c.refresher ? `<p>${e(c.refresher.explanation)}</p><div class="review-example">${e(c.refresher.example)}</div><div data-refresher="${e(c.id)}"></div>` : `<a class="text-link" href="#/ruta/${e(c.introducedBy)}">Consultar el concepto en su ruta →</a>`}</details>`).join('')}</details>`;
}

export function mountSupport(root, concepts) {
  root.querySelectorAll('[data-refresher]').forEach((element) => {
    const c = concepts.get(element.dataset.refresher);
    mountActivities(
      element,
      [{ ...c.refresher.activity, concept: c.id }],
      () => false,
      () => {},
    );
  });
}

// Orientación local: las respuestas sugieren acompañamiento, nunca créditos.
export function mountOrientation(root, questions, concepts, onStart) {
  const items = questions.filter((q) => q.type === 'choice').slice(0, 3);
  if (items.length < 3) {
    root.innerHTML =
      '<p>Puedes comenzar la ruta directamente. La orientación de esta entrada todavía está en preparación.</p>';
    return;
  }
  root.innerHTML = `<form class="orientation-form">${items.map((q, i) => `<fieldset><legend>${i + 1}. ${e(q.prompt)}</legend>${q.code ? `<pre>${e(q.code)}</pre>` : ''}${q.options.map((option, n) => `<label><input type="radio" name="orientation-${i}" value="${n}" required> <span>${e(option)}</span></label>`).join('')}</fieldset>`).join('')}<button class="btn small" type="submit">Ver mi orientación →</button></form><div class="orientation-result" role="status" hidden></div>`;
  const form = root.querySelector('form'),
    result = root.querySelector('.orientation-result');
  form.onsubmit = (event) => {
    event.preventDefault();
    const answers = items.map((_, i) =>
      root.querySelector(`input[name="orientation-${i}"]:checked`),
    );
    result.hidden = false;
    if (answers.some((answer) => !answer)) {
      result.textContent = 'Responde cada pregunta para ver tu orientación.';
      return;
    }
    const missed = items.filter((q, i) => Number(answers[i].value) !== q.answer);
    const mode = missed.length <= 1 ? 'experienced' : 'guided';
    result.innerHTML = `<h3>${mode === 'experienced' ? 'Puedes probar primero la práctica' : 'Te acompañamos paso a paso'}</h3><p>${mode === 'experienced' ? 'Reconoces varios conceptos de entrada. Resuelve la práctica y la comprobación de cada lección para avanzar.' : 'Empieza con las explicaciones de esta ruta y prueba cada idea. Consulta los repasos cuando los necesites.'}</p>${missed.length ? `<p>Conviene repasar: ${[...new Set(missed.map((q) => concepts.get(q.concept)?.label ?? 'conceptos de entrada'))].map(e).join(', ')}.</p>` : ''}<small>Estas preguntas exploran el inicio de la ruta; no determinan todo lo que sabes. Tus logros se obtienen en las lecciones.</small><button class="btn" type="button">Comenzar con esta guía →</button>`;
    result.querySelector('button').onclick = () => onStart(mode);
  };
}
