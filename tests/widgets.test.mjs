import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { installDOM, change, submit } from './support/dom.mjs';
import { mount as mountGame } from '../js/widgets/guess-game.js';
import { mount as mountTip } from '../js/widgets/tip-calculator.js';
import { mount as mountVariables } from '../js/widgets/variables-sim.js';
import {
  mountCycle,
  mountCondition,
  mountTokens,
  mountDiffusion,
  mountRunner,
} from '../js/widgets/labs.js';
import { widgets } from '../js/widgets/index.js';
const lesson = (id) =>
  JSON.parse(readFileSync(`content/lessons/fundamentos/${id}.json`, 'utf8')).html;
function root() {
  return document.getElementById('root');
}
test('variables simulator updates memory, emits output and resets all stages', (t) => {
  installDOM(t);
  const r = root();
  r.innerHTML = lesson('variables');
  mountVariables(r);
  assert.equal(r.querySelector('#mem').children.length, 0);
  r.querySelector('#step').click();
  assert.match(r.querySelector('#mem').textContent, /20/);
  r.querySelector('#step').click();
  assert.match(r.querySelector('#mem').textContent, /21/);
  r.querySelector('#step').click();
  assert.equal(r.querySelector('#out').textContent, 'Salida: 21');
  assert.equal(r.querySelector('#step').disabled, true);
  r.querySelector('#reset').click();
  assert.equal(r.querySelector('#step').disabled, false);
  assert.equal(r.querySelector('#out').textContent, '');
});
test('guess game rejects invalid inputs, gives both hints and ends on win or seventh miss', (t) => {
  installDOM(t);
  t.mock.method(Math, 'random', () => 0.49);
  const r = root();
  r.innerHTML = lesson('proyecto-adivina-el-numero');
  mountGame(r);
  const input = r.querySelector('#jn'),
    guess = () => r.querySelector('#jb').click();
  for (const value of ['', '0', '101', '1.5']) {
    input.value = value;
    guess();
    assert.match(r.querySelector('#jf').textContent, /No se ha contado/);
  }
  input.value = '1';
  guess();
  assert.match(r.querySelector('#jf').textContent, /Más alto.*6 intentos/);
  input.value = '100';
  guess();
  assert.match(r.querySelector('#jf').textContent, /Más bajo.*5 intentos/);
  input.value = '50';
  input.dispatchEvent(new window.KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
  assert.match(r.querySelector('#jf').textContent, /Acertaste en 3/);
  assert.equal(input.disabled, true);
  r.querySelector('#jr').click();
  for (let i = 0; i < 7; i++) {
    input.value = '1';
    guess();
  }
  assert.match(r.querySelector('#jf').textContent, /Era 50/);
  assert.equal(r.querySelector('#jb').disabled, true);
});
test('tip calculator handles valid decimals, invalid values, fractional people and overflow', (t) => {
  installDOM(t);
  const r = root();
  r.innerHTML = lesson('mini-proyecto-calculadora-de-propinas');
  mountTip(r);
  const run = (bill, percent, people) => {
    r.querySelector('#pc').value = bill;
    r.querySelector('#pp').value = percent;
    r.querySelector('#pn').value = people;
    r.querySelector('#pb').click();
    return r.querySelector('#po').textContent;
  };
  assert.match(run('80', '10', '4'), /Cada persona: 22.00/);
  assert.match(run('0', '0', '1'), /Total: 0.00/);
  assert.match(run('', '10', '1'), /válidos/);
  assert.match(run('-1', '10', '1'), /válidos/);
  assert.match(run('10', '-1', '1'), /válidos/);
  assert.match(run('10', '10', '0'), /entero/);
  assert.match(run('10', '10', '1.5'), /entero/);
  assert.match(run('1e308', '1e308', '1'), /exceden/);
});
test('cycle simulator respects bounds, terminal state and reset after configuration change', (t) => {
  installDOM(t);
  const r = root();
  mountCycle(r);
  for (let i = 0; i < 4; i++) r.querySelector('[data-step]').click();
  assert.match(r.querySelector('[data-output]').textContent, /suma = 10.*terminado/);
  assert.equal(r.querySelector('[data-step]').disabled, true);
  r.querySelector('[data-reset]').click();
  assert.match(r.querySelector('[data-output]').textContent, /Vueltas: 0/);
  change(r.querySelector('[data-count]'), '20', 'change');
  assert.equal(r.querySelectorAll('.memory-cell').length, 8);
  assert.equal(r.querySelector('[data-count]').value, '8');
  change(r.querySelector('[data-count]'), '', 'change');
  assert.equal(r.querySelectorAll('.memory-cell').length, 1);
});
test('condition simulator distinguishes boundary, empty and invalid ages', (t) => {
  installDOM(t);
  const r = root();
  mountCondition(r);
  assert.match(r.querySelector('[data-result]').textContent, /Espera/);
  change(r.querySelector('[data-age]'), '18');
  assert.match(r.querySelector('[data-result]').textContent, /Acceso/);
  change(r.querySelector('[data-age]'), '');
  assert.match(r.querySelector('[data-result]').textContent, /Escribe/);
  change(r.querySelector('[data-age]'), '18.5');
  assert.match(r.querySelector('[data-result]').textContent, /entera/);
});
test('illustrative segmentation is Unicode aware, empty-safe and never interprets HTML', (t) => {
  installDOM(t);
  const r = root();
  mountTokens(r);
  change(r.querySelector('[data-text]'), '¡Hola, IA!');
  assert.equal(r.querySelectorAll('.token').length, 5);
  change(r.querySelector('[data-text]'), '<img src=x>');
  assert.equal(r.querySelector('img'), null);
  change(r.querySelector('[data-text]'), '');
  assert.equal(r.querySelectorAll('.token').length, 0);
  assert.match(r.querySelector('[data-total]').textContent, /0 segmentos/);
});
test('diffusion demonstration draws deterministic pixels and describes simulation limits', (t) => {
  const dom = installDOM(t);
  let last;
  t.mock.method(dom.window.HTMLCanvasElement.prototype, 'getContext', () => ({
    createImageData: (w, h) => ({ data: new Uint8ClampedArray(w * h * 4) }),
    putImageData: (image) => {
      last = image;
    },
  }));
  const r = root();
  mountDiffusion(r);
  assert.equal(last.data.length, 80 * 56 * 4);
  change(r.querySelector('[data-signal]'), '100');
  const index = (15 * 80 + 30) * 4;
  assert.deepEqual([...last.data.slice(index, index + 4)], [204, 238, 139, 255]);
  assert.match(r.querySelector('[data-caption]').textContent, /Señal: 100%/);
  assert.match(r.textContent, /no se ejecuta un modelo/);
});
test('runner widget shows trace, absence of output and errors without executing script', (t) => {
  installDOM(t);
  const r = root();
  mountRunner(r);
  submit(r.querySelector('form'));
  assert.match(r.querySelector('[data-output]').textContent, /Salida:\n21/);
  r.querySelector('textarea').value = 'a = 3';
  submit(r.querySelector('form'));
  assert.match(r.querySelector('[data-output]').textContent, /sin salida/);
  r.querySelector('textarea').value = 'mostrar(fetch(1))';
  submit(r.querySelector('form'));
  assert.match(r.querySelector('[data-output]').textContent, /Línea 1/);
});
test('every registered widget resolves to a mount operation', async () => {
  for (const [name, load] of Object.entries(widgets))
    assert.equal(typeof (await load()).mount, 'function', name);
});
