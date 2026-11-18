import test from 'node:test';
import assert from 'node:assert/strict';
import { change, installDOM, until } from './support/dom.mjs';
import { catalog, labContext } from './support/laboratory.mjs';
import {
  PRACTICE_TYPES,
  filterPractice,
  gradeBugLine,
  gradeChoice,
  gradeOrder,
  traceState,
  validatePractice,
} from '../js/domain/practice.js';
import { mountPractice } from '../js/widgets/practice.js';
import { mount as mountHub } from '../js/widgets/practice-hub.js';
import { widgets } from '../js/widgets/index.js';

const { items } = catalog;
const byId = (id) => items.find((item) => item.id === id);
const root = () => document.getElementById('root');
const click = (el) => el.click();
const select = (el, value) => change(el, value, 'change');

test('todas las prácticas del contenido son válidas, únicas y cubren todos los tipos', () => {
  assert.deepEqual(items.flatMap(validatePractice), []);
  assert.equal(new Set(items.map((item) => item.id)).size, items.length);
  for (const topic of ['operadores', 'condicionales', 'ciclos', 'funciones'])
    assert.ok(
      items.filter((item) => item.topic === topic).length >= 3,
      `pocas prácticas de ${topic}`,
    );
  for (const type of Object.keys(PRACTICE_TYPES))
    assert.ok(
      items.some((item) => item.type === type),
      `falta el tipo ${type}`,
    );
});

test('el validador detecta errores por tipo', () => {
  assert.deepEqual(validatePractice(null), ['práctica sin id']);
  const bad = (patch, base) =>
    validatePractice({ ...structuredClone(byId(base)), ...patch }).join('|');
  assert.match(
    validatePractice({ id: 'X Y', type: 'otro' }).join('|'),
    /id debe usar|tipo desconocido|falta title/,
  );
  assert.match(bad({ minutes: 0 }, 'predice-modulo'), /minutes/);
  assert.match(bad({ steps: [{ line: 99, vars: {}, note: 'x' }] }, 'acumulador-suma'), /paso 1/);
  assert.match(bad({ steps: [] }, 'acumulador-suma'), /necesita pasos/);
  assert.match(bad({ predict: {} }, 'acumulador-suma'), /predict inválido/);
  assert.match(bad({ lines: [] }, 'acumulador-suma'), /al menos 2 líneas/);
  assert.match(
    bad({ check: { ...byId('predice-modulo').check, answer: 9 } }, 'predice-modulo'),
    /check inválido/,
  );
  assert.match(bad({ lines: [] }, 'predice-modulo'), /necesita código/);
  assert.match(bad({ bugLine: 99 }, 'arregla-promedio'), /bugLine/);
  assert.match(bad({ fixes: ['solo una'] }, 'arregla-promedio'), /2 correcciones/);
  assert.match(bad({ fix: 9 }, 'arregla-promedio'), /fix fuera/);
  assert.match(bad({ symptom: '' }, 'arregla-promedio'), /symptom/);
  assert.match(bad({ lines: ['a'] }, 'arregla-promedio'), /al menos 2 líneas/);
  assert.match(bad({ lines: ['a'] }, 'ordena-suma'), /al menos 3 líneas/);
  assert.match(bad({ explanation: '' }, 'ordena-suma'), /explanation/);
});

test('las funciones de dominio califican, filtran y trazan', () => {
  const trace = byId('acumulador-suma');
  assert.deepEqual(traceState(trace, 0), { vars: {}, note: null, next: 0, finished: false });
  const last = traceState(trace, trace.steps.length);
  assert.equal(last.vars.suma, 10);
  assert.equal(last.finished, true);
  assert.equal(last.next, null);
  assert.equal(gradeChoice(trace.predict, 1), true);
  assert.equal(gradeChoice(trace.predict, 0), false);
  assert.equal(gradeBugLine(byId('arregla-promedio'), 2), true);
  assert.equal(gradeBugLine(byId('arregla-promedio'), 1), false);
  const order = byId('ordena-suma');
  assert.equal(gradeOrder(order, order.lines), true);
  assert.equal(gradeOrder(order, [...order.lines].reverse()), false);
  assert.equal(gradeOrder(order, order.lines.slice(1)), false);
  const exactCases = byId('ordena-segun');
  assert.equal(gradeOrder(exactCases, exactCases.alternatives[0]), true);
  assert.match(
    validatePractice({ ...exactCases, alternatives: [['línea distinta', ...order.lines]] }).join(
      '|',
    ),
    /las mismas líneas/,
  );
  assert.equal(filterPractice(items, 'all').length, items.length);
  assert.ok(filterPractice(items, 'bug').every((item) => item.type === 'bug'));
});

test('traza: predice, ejecuta cada paso, muestra el acumulador y habilita el reto', (t) => {
  installDOM(t);
  const r = root();
  const solved = [];
  mountPractice(r, byId('acumulador-suma'), { onSolved: (item) => solved.push(item.id) });
  assert.match(r.textContent, /Objetivo/);
  assert.match(r.querySelector('[data-vars]').textContent, /Memoria vacía/);
  assert.equal(r.querySelector('[data-challenge]').hidden, true);
  const predict = r.querySelectorAll('[data-predict] .opt');
  click(predict[0]);
  assert.match(r.querySelector('[data-predict] [data-feedback]').textContent, /Todavía no/);
  click(predict[1]);
  assert.match(r.querySelector('[data-predict] [data-feedback]').textContent, /Correcto/);
  assert.equal(r.querySelector('.is-next .ln').textContent, '1');
  const steps = byId('acumulador-suma').steps.length;
  for (let i = 0; i < steps; i += 1) click(r.querySelector('[data-step]'));
  assert.match(r.querySelector('[data-vars]').textContent, /suma10/);
  assert.equal(r.querySelector('[data-step]').disabled, true);
  assert.equal(r.querySelector('[data-challenge]').hidden, false);
  click(r.querySelectorAll('[data-challenge] .opt')[0]);
  assert.deepEqual(solved, []);
  click(r.querySelectorAll('[data-challenge] .opt')[1]);
  assert.deepEqual(solved, ['acumulador-suma']);
  click(r.querySelector('[data-reset]'));
  assert.equal(r.querySelector('[data-step]').disabled, false);
  assert.match(r.querySelector('[data-note]').textContent, /Pulsa/);
  assert.equal(r.querySelector('[data-predict] .opt').disabled, false);
  click(r.querySelectorAll('[data-predict] .opt')[1]);
  assert.match(r.querySelector('[data-predict] [data-feedback]').textContent, /Correcto/);
  assert.equal(r.querySelector('[data-code]').getAttribute('tabindex'), '0');
});

test('predecir: una opción incorrecta no resuelve y la correcta sí', (t) => {
  installDOM(t);
  const r = root();
  const solved = [];
  mountPractice(r, byId('predice-modulo'), { onSolved: (item) => solved.push(item.id) });
  const options = r.querySelectorAll('.opt');
  click(options[0]);
  assert.deepEqual(solved, []);
  click(options[0]);
  assert.equal(options[0].disabled, true);
  click(options[1]);
  assert.deepEqual(solved, ['predice-modulo']);
  assert.ok([...options].every((option) => option.disabled));
  mountPractice(r, byId('predice-modulo'));
  click(r.querySelectorAll('.opt')[1]);
});

test('arreglar: primero se localiza la línea y luego se elige la corrección', (t) => {
  installDOM(t);
  const r = root();
  const solved = [];
  const item = byId('arregla-promedio');
  mountPractice(r, item, { onSolved: () => solved.push(true) });
  assert.equal(r.querySelector('[data-fix]').hidden, true);
  click(r.querySelector('[data-line="0"]'));
  assert.match(r.querySelector('[data-note]').textContent, /está bien/);
  click(r.querySelector('.lab-code'));
  click(r.querySelector(`[data-line="${item.bugLine}"]`));
  assert.equal(r.querySelector(`[data-line="${item.bugLine}"]`).classList.contains('is-bug'), true);
  assert.equal(r.querySelector('[data-fix]').hidden, false);
  click(r.querySelector('[data-line="0"]'));
  click(r.querySelectorAll('[data-fix] .opt')[1]);
  assert.deepEqual(solved, []);
  click(r.querySelectorAll('[data-fix] .opt')[item.fix]);
  assert.deepEqual(solved, [true]);
});

test('ordenar: valida solo con todas las líneas, permite borrar y resuelve al acertar', (t) => {
  installDOM(t);
  const r = root();
  const solved = [];
  const item = byId('ordena-suma');
  mountPractice(r, item, { random: () => 0, onSolved: () => solved.push(true) });
  assert.equal(r.querySelector('[data-check]').disabled, true);
  click(r.querySelector('[data-pool]'));
  const pick = (text) =>
    click(
      [...r.querySelectorAll('[data-pool] .opt')].find(
        (b) => b.textContent === text && !b.disabled,
      ),
    );
  for (const line of [...item.lines].reverse()) pick(line);
  assert.equal(r.querySelector('[data-check]').disabled, false);
  click(r.querySelector('[data-check]'));
  assert.match(r.querySelector('[data-note]').textContent, /Todavía no/);
  assert.deepEqual(solved, []);
  click(r.querySelector('[data-clear]'));
  assert.match(r.querySelector('[data-answer]').textContent, /Toca las líneas/);
  for (const line of item.lines) pick(line);
  click(r.querySelector('[data-check]'));
  assert.match(r.querySelector('[data-note]').textContent, /Correcto/);
  assert.deepEqual(solved, [true]);
  assert.equal(r.querySelector('[data-check]').disabled, true);
  assert.ok([...r.querySelectorAll('[data-pool] .opt')].every((b) => b.disabled));
});

test('el laboratorio identifica ruta, tipo y tema y conserva el intento al filtrar', async (t) => {
  installDOM(t);
  const r = root();
  const solvedIds = [];
  const ctx = labContext({
    isSolved: (id) => solvedIds.includes(id),
    solve: (id) => solvedIds.push(id),
  });
  await mountHub(r, ctx, async () => catalog);
  const filterRoute = r.querySelector('[data-filter-route]');
  const filterType = r.querySelector('[data-filter-type]');
  const filterTopic = r.querySelector('[data-filter-topic]');
  assert.equal(r.querySelectorAll('.practice-card').length, 0);
  click(r.querySelector('[data-route-group="algoritmia"] summary'));
  await until(() => r.querySelector('[data-id="ordena-suma"]'));
  select(filterRoute, 'algoritmia');
  select(filterType, 'bug');
  const bugs = items.filter((item) => item.type === 'bug' && item.route === 'algoritmia');
  assert.equal(r.querySelectorAll('.practice-card').length, bugs.length);
  const card = r.querySelector('[data-id="arregla-promedio"]');
  assert.match(card.textContent, /Algoritmia · Operadores/);
  const open = card.querySelector('[data-open]');
  click(open);
  assert.equal(open.getAttribute('aria-expanded'), 'true');
  click(card.querySelector('[data-line="2"]'));
  click(card.querySelectorAll('[data-fix] .opt')[1]);
  select(filterTopic, 'algoritmia/ciclos');
  assert.equal(card.isConnected, false);
  select(filterTopic, 'all');
  assert.equal(card.isConnected, true);
  assert.equal(card.querySelectorAll('[data-fix] .opt')[1].disabled, true);
  click(card.querySelectorAll('[data-fix] .opt')[0]);
  assert.deepEqual(solvedIds, ['arregla-promedio']);
  assert.equal(card.querySelector('[data-solved]').hidden, false);
  assert.match(r.querySelector('.practice-count').textContent, new RegExp(`1 de ${bugs.length}`));
  click(open);
  assert.equal(card.querySelector('.practice-body').hidden, true);
  click(open);
  assert.equal(card.querySelector('.practice-body').hidden, false);
  select(filterType, 'all');
  assert.equal(r.querySelectorAll('[data-solved]:not([hidden])').length, 1);
});

test('las lecciones y las guardadas conservan ruta y tema y ofrecen una salida cuando no hay retos', async (t) => {
  const dom = installDOM(t);
  const r = root();
  const ctx = labContext();
  ctx.state.bookmarks = ['bad/missing', 'fundamentos/variables', 'frontend/como-funciona-internet'];
  await mountHub(r, ctx, async () => catalog);
  const route = r.querySelector('[data-filter-route]');
  select(route, 'frontend');
  assert.match(r.querySelector('.practice-list').textContent, /Sin resultados/);
  click(r.querySelector('[data-lesson-option]'));
  assert.equal(r.querySelector('[data-mode="lessons"]').getAttribute('aria-pressed'), 'true');
  assert.ok(r.querySelector('a[href="#/leccion/frontend/como-funciona-internet/practicar"]'));
  assert.equal(r.querySelector('[data-filter-format]').hidden, true);
  click(r.querySelector('[data-mode="saved"]'));
  select(route, 'all');
  click(r.querySelector('[data-route-group="fundamentos"] summary'));
  await until(() => r.querySelector('[data-route-group="fundamentos"] .lab-lesson-link'));
  assert.ok(r.querySelector('a[href="#/leccion/fundamentos/variables/aprender"]'));
  assert.match(r.querySelector('[data-route-group="fundamentos"]').textContent, /Edición anterior/);
  assert.equal(r.querySelector('a[href*="bad/missing"]'), null);
  click(r.querySelector('[data-mode="catalog"]'));
  const query = r.querySelector('[data-filter-query]');
  query.value = 'DIFUSION';
  query.dispatchEvent(new dom.window.Event('input'));
  assert.ok(r.querySelector('[data-id="difusion-lab"]'));
  assert.equal(r.querySelector('[data-id="acumulador-suma"]'), null);
  click(r.querySelector('[data-reset-filters]'));
  assert.equal(query.value, '');
  assert.equal(document.activeElement, route);
});

test('la ronda ofrece variantes por tema, cuenta el primer intento y conserva el avance general', async (t) => {
  installDOM(t);
  const r = root();
  const saved = [];
  await mountHub(
    r,
    labContext({ route: 'fundamentos', solve: (id) => saved.push(id) }),
    async () => catalog,
  );
  click(r.querySelector('[data-start-round]'));
  const round = r.querySelector('[data-round]');
  assert.equal(round.hidden, false);
  assert.match(round.textContent, /1 de 2/);
  assert.match(round.textContent, /admite cero plazas/);
  click(round.querySelectorAll('.opt')[0]);
  assert.match(round.querySelector('[data-feedback]').textContent, /Ambas entradas/);
  assert.equal(round.querySelector('[data-next-round]').hidden, true);
  click(round.querySelectorAll('.opt')[2]);
  click(round.querySelector('[data-next-round]'));
  assert.match(round.textContent, /2 de 2/);
  click(round.querySelectorAll('.opt')[0]);
  click(round.querySelector('[data-next-round]'));
  assert.match(round.textContent, /1 de 2 al primer intento/);
  assert.ok(round.querySelector('a[href="#/leccion/fundamentos/js-validacion/aprender"]'));
  assert.deepEqual(saved, []);
  click(round.querySelector('[data-close-round]'));
  assert.equal(round.hidden, true);
  assert.equal(document.activeElement, r.querySelector('[data-start-round]'));
});

test('un proyecto enlaza a la versión pública y los simuladores se cargan una sola vez al abrirlos', async (t) => {
  installDOM(t);
  const r = root();
  const loaded = [];
  await mountHub(
    r,
    labContext({
      route: 'ia',
      mountWidget: (el, name) => {
        loaded.push(name);
        el.innerHTML = '<p>Simulación cargada</p>';
      },
    }),
    async () => catalog,
  );
  const open = r.querySelector('[data-id="token-lab"] [data-open]');
  assert.deepEqual(loaded, []);
  click(open);
  click(open);
  click(open);
  assert.deepEqual(loaded, ['token-lab']);
  select(r.querySelector('[data-filter-route]'), 'fundamentos');
  assert.ok(
    r.querySelector('[data-id="laboratorio-plan"] [href^="assets/labs/plan/laboratorio.html"]'),
  );
});

test('los laboratorios de las lecciones cargan su práctica desde el contenido', async (t) => {
  installDOM(t);
  const original = globalThis.fetch;
  globalThis.fetch = async () => ({ ok: true, json: async () => ({ items }) });
  t.after(() => {
    globalThis.fetch = original;
  });
  const solved = [];
  for (const [name, id] of [
    ['cycle-lab', 'acumulador-suma'],
    ['condition-lab', 'condicion-limite'],
  ]) {
    const host = document.createElement('div');
    const widget = await widgets[name]();
    await widget.mount(host, { solve: (practiceId) => solved.push(practiceId) });
    assert.ok(host.querySelector('.practice-lab'), name);
    const options = host.querySelectorAll('[data-challenge] .opt');
    click(host.querySelector('[data-step]'));
    for (let i = 1; i < byId(id).steps.length; i += 1) click(host.querySelector('[data-step]'));
    click(options[byId(id).challenge.answer]);
  }
  assert.deepEqual(solved, ['acumulador-suma', 'condicion-limite']);
  const missing = document.createElement('div');
  await assert.rejects(
    (await widgets['cycle-lab']()).mount(missing, undefined, async () => []),
    /desconocida/,
  );
  const hub = await widgets['practice-hub']();
  assert.equal(typeof hub.mount, 'function');
});

test('el validador revisa tema, idioma, ejemplos y situaciones', () => {
  const bad = (patch, base) =>
    validatePractice({ ...structuredClone(byId(base)), ...patch }).join('|');
  assert.match(bad({ topic: 'otro' }, 'ejemplo-mientras'), /tema desconocido/);
  assert.match(bad({ language: ' ' }, 'predice-none'), /language inválido/);
  assert.match(bad({ lines: [] }, 'ejemplo-mientras'), /necesita código/);
  assert.match(bad({ python: [] }, 'ejemplo-mientras'), /python inválido/);
  assert.match(bad({ parts: [{ title: 'solo', text: 'una' }] }, 'ejemplo-mientras'), /2 partes/);
  assert.match(bad({ check: {} }, 'ejemplo-mientras'), /check inválido/);
  assert.match(
    bad({ scenarios: [byId('decide-ciclos').scenarios[0]] }, 'decide-ciclos'),
    /2 situaciones/,
  );
});

test('filtrar combina tipo y tema', () => {
  const both = filterPractice(items, 'decide', 'ciclos');
  assert.ok(
    both.length >= 1 && both.every((item) => item.type === 'decide' && item.topic === 'ciclos'),
  );
  assert.ok(filterPractice(items, 'all', 'funciones').every((item) => item.topic === 'funciones'));
});

test('aprende: muestra pseudocódigo, Python y partes, y se resuelve con la comprobación', (t) => {
  installDOM(t);
  const r = root();
  const solved = [];
  const item = byId('ejemplo-hacer-mientras');
  mountPractice(r, item, { onSolved: () => solved.push(true) });
  assert.equal(r.querySelectorAll('.lab-part').length, item.parts.length);
  assert.deepEqual(
    [...r.querySelectorAll('.lab-lang')].map((n) => n.textContent),
    ['Pseudocódigo', 'Python'],
  );
  click(r.querySelectorAll('[data-check] .opt')[1]);
  assert.deepEqual(solved, []);
  click(r.querySelectorAll('[data-check] .opt')[item.check.answer]);
  assert.deepEqual(solved, [true]);
  mountPractice(r, { ...structuredClone(item), python: undefined });
  assert.equal(r.querySelectorAll('.lab-lang').length, 1);
});

test('decide: avanza situación por situación y resuelve al terminar', (t) => {
  installDOM(t);
  const r = root();
  const solved = [];
  const item = byId('decide-funciones');
  mountPractice(r, item, { onSolved: () => solved.push(true) });
  item.scenarios.forEach((scenario, i) => {
    assert.match(
      r.querySelector('[data-progress]').textContent,
      new RegExp(`${i + 1} de ${item.scenarios.length}`),
    );
    assert.equal(r.querySelector('[data-next]').hidden, true);
    click(
      r.querySelectorAll('[data-scenario] .opt')[(scenario.answer + 1) % scenario.options.length],
    );
    assert.equal(r.querySelector('[data-next]').hidden, true);
    click(r.querySelectorAll('[data-scenario] .opt')[scenario.answer]);
    if (i < item.scenarios.length - 1) {
      assert.deepEqual(solved, []);
      click(r.querySelector('[data-next]'));
    }
  });
  assert.deepEqual(solved, [true]);
});

test('el idioma de la práctica se indica cuando no es pseudocódigo', (t) => {
  installDOM(t);
  const r = root();
  mountPractice(r, byId('predice-none'));
  assert.match(r.querySelector('.lab-lang').textContent, /Python/);
  mountPractice(r, byId('predice-modulo'));
  assert.equal(r.querySelector('.lab-lang'), null);
});

test('el centro de práctica filtra también por tema', async (t) => {
  installDOM(t);
  const r = root();
  await mountHub(r, labContext({ route: 'algoritmia' }), async () => catalog);
  const topic = r.querySelector('[data-filter-topic]');
  select(topic, 'algoritmia/funciones');
  const funciones = items.filter(
    (item) => item.route === 'algoritmia' && item.topic === 'funciones',
  );
  assert.equal(r.querySelectorAll('.practice-card').length, funciones.length);
  select(r.querySelector('[data-filter-type]'), 'example');
  assert.ok(r.querySelectorAll('.practice-card').length < funciones.length);
  assert.equal(topic.value, 'algoritmia/funciones');
});
