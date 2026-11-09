import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { installDOM } from './support/dom.mjs';
import {
  PRACTICE_TYPES,
  TOPICS,
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

const items = JSON.parse(readFileSync('content/practice/items.json', 'utf8')).items;
const byId = (id) => items.find((item) => item.id === id);
const root = () => document.getElementById('root');
const click = (el) => el.click();

test('todas las prácticas del contenido son válidas, únicas y cubren todos los tipos', () => {
  assert.deepEqual(items.flatMap(validatePractice), []);
  assert.equal(new Set(items.map((item) => item.id)).size, items.length);
  for (const topic of Object.keys(TOPICS))
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

test('el centro de práctica filtra por tipo, abre retos y registra lo resuelto', async (t) => {
  installDOM(t);
  const r = root();
  const solvedIds = [];
  const ctx = { isSolved: (id) => solvedIds.includes(id), solve: (id) => solvedIds.push(id) };
  await mountHub(r, ctx, async () => items);
  assert.equal(r.querySelectorAll('.practice-chip').length, 12);
  assert.equal(r.querySelectorAll('.practice-card').length, items.length);
  assert.match(r.querySelector('.practice-count').textContent, new RegExp(`0 de ${items.length}`));
  click(r.querySelector('[data-group="type"][data-value="bug"]'));
  const bugs = items.filter((item) => item.type === 'bug');
  assert.equal(r.querySelectorAll('.practice-card').length, bugs.length);
  click(r.querySelector('.practice-list'));
  const card = r.querySelector('.practice-card');
  const open = card.querySelector('[data-open]');
  click(open);
  assert.equal(open.getAttribute('aria-expanded'), 'true');
  assert.equal(card.querySelector('.practice-body').hidden, false);
  const item = byId(card.dataset.id);
  click(card.querySelector(`[data-line="${item.bugLine}"]`));
  click(card.querySelectorAll('[data-fix] .opt')[item.fix]);
  assert.deepEqual(solvedIds, [item.id]);
  assert.equal(card.querySelectorAll('.badge').length, 1);
  assert.match(r.querySelector('.practice-count').textContent, new RegExp(`1 de ${bugs.length}`));
  click(open);
  assert.equal(card.querySelector('.practice-body').hidden, true);
  click(open);
  assert.equal(card.querySelector('.practice-body').hidden, false);
  const [firstOptionHost] = card.querySelectorAll('[data-fix] .opt');
  assert.ok(firstOptionHost);
  click(r.querySelector('[data-group="type"][data-value="all"]'));
  assert.equal(r.querySelectorAll('.badge').length, 1);
  const sinContexto = document.createElement('div');
  await mountHub(sinContexto, undefined, async () => items);
  click(sinContexto.querySelector('[data-open]'));
  click(sinContexto.querySelector('[data-group="type"][data-value="predict"]'));
  click(sinContexto.querySelector('[data-open]'));
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
  globalThis.fetch = async () => ({ ok: true, json: async () => ({ items: [] }) });
  await (await widgets['cycle-lab']()).mount(missing);
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
  await mountHub(r, undefined, async () => items);
  click(r.querySelector('[data-group="topic"][data-value="funciones"]'));
  const funciones = items.filter((item) => item.topic === 'funciones');
  assert.equal(r.querySelectorAll('.practice-card').length, funciones.length);
  click(r.querySelector('[data-group="type"][data-value="example"]'));
  assert.ok(r.querySelectorAll('.practice-card').length < funciones.length);
  assert.equal(
    r.querySelector('[data-group="topic"][aria-pressed="true"]').dataset.value,
    'funciones',
  );
});
