import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { installDOM, change, submit, until } from './support/dom.mjs';
import { progressRepository } from '../js/core/storage.js';
const shell = readFileSync('index.html', 'utf8');
const read = (path) => JSON.parse(readFileSync(path, 'utf8'));
const start = () => import('../js/main.js').then((m) => m.ready);
async function navigate(hash, predicate) {
  location.hash = '#/' + hash;
  await until(predicate);
}
function clickText(selector, text) {
  const b = [...document.querySelectorAll(selector)].find((b) => b.textContent === text);
  assert.ok(b, text);
  b.click();
}
async function quiz(data, correct) {
  for (let i = 0; i < data.quiz.length; i++) {
    const box = document.getElementById('qbox'),
      q = data.quiz.find((q) => q.id === box.dataset.questionId);
    assert.ok(q);
    if (q.type === 'choice')
      clickText(
        '#qbox .opts button',
        q.options[correct ? q.answer : (q.answer + 1) % q.options.length],
      );
    if (q.type === 'text') {
      document.querySelector('#qbox input').value = correct ? q.answers[0] : 'wrong';
      submit(document.querySelector('#qbox form'));
    }
    if (q.type === 'order') {
      for (const step of correct ? q.steps : [...q.steps].reverse())
        clickText('#qbox .opts button', step);
      clickText('#qbox button', 'Comprobar orden');
    }
    document.querySelector('#qbox .fb button').click();
  }
}
test('controller coordinates navigation, learning, search, preferences, export and retry', async (t) => {
  const dom = installDOM(t, shell);
  let failSecond = false;
  const timers = new Set(),
    realTimeout = globalThis.setTimeout;
  t.mock.method(globalThis, 'setTimeout', (callback, delay, ...args) => {
    const timer = realTimeout(callback, delay, ...args);
    timers.add(timer);
    return timer;
  });
  t.after(() => timers.forEach((timer) => clearTimeout(timer)));
  t.mock.method(globalThis, 'fetch', async (path) => {
    if (failSecond && path.endsWith('/editor-y-ejecucion.json')) {
      return { ok: false };
    }
    return { ok: true, json: async () => read(path) };
  });
  t.mock.method(dom.window.HTMLCanvasElement.prototype, 'getContext', () => ({
    createImageData: (w, h) => ({ data: new Uint8ClampedArray(w * h * 4) }),
    putImageData: () => {},
  }));
  await start();
  assert.ok(document.querySelector('.hero'));
  document.getElementById('theme-toggle').click();
  assert.equal(localStorage.getItem('teslacode:theme'), 'dark');
  document.getElementById('theme-toggle').click();
  document.body.focus();
  document.dispatchEvent(new dom.window.KeyboardEvent('keydown', { key: '/', bubbles: true }));
  assert.equal(document.activeElement.id, 'search');
  change(document.getElementById('search'), 'difusion');
  assert.ok(document.querySelector('#search-results a'));
  document.dispatchEvent(
    new dom.window.KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }),
  );
  assert.equal(document.activeElement.closest('#search-results').id, 'search-results');
  document.dispatchEvent(new dom.window.KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
  assert.equal(document.getElementById('search-results').hidden, true);
  change(document.getElementById('search'), 'zzzzzz');
  assert.match(document.getElementById('search-results').textContent, /No encontramos/);
  document.body.click();
  assert.equal(document.getElementById('search-results').hidden, true);
  await navigate('rutas', () => document.getElementById('goal-select'));
  change(document.getElementById('goal-select'), 'ia', 'change');
  assert.equal(JSON.parse(localStorage.getItem('teslacode:progress:v2')).goal, 'ia');
  document.querySelector('[data-filter=goal]').click();
  assert.equal(document.querySelectorAll('.route-card').length, 1);
  await navigate('ruta/frontend', () => document.querySelector('[data-node="html-semantico"]'));
  document.querySelector('[data-node="html-semantico"]').click();
  assert.match(document.getElementById('node-inspector').textContent, /preparación/);
  await navigate('leccion/frontend/como-funciona-internet/aprender', () =>
    document.querySelector('#content .card'),
  );
  assert.equal(document.getElementById('lesson'), null);
  await navigate('leccion/fundamentos/tu-primer-paso/aprender', () =>
    document.getElementById('lesson'),
  );
  const bookmark = document.getElementById('bookmark');
  bookmark.click();
  assert.equal(bookmark.getAttribute('aria-pressed'), 'true');
  bookmark.click();
  assert.equal(bookmark.getAttribute('aria-pressed'), 'false');
  const tabs = [...document.querySelectorAll('[data-tab]')];
  tabs[0].dispatchEvent(
    new dom.window.KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }),
  );
  assert.equal(document.activeElement, tabs[1]);
  tabs[1].dispatchEvent(new dom.window.KeyboardEvent('keydown', { key: 'End', bubbles: true }));
  assert.equal(document.activeElement, tabs[2]);
  tabs[2].dispatchEvent(new dom.window.KeyboardEvent('keydown', { key: 'Home', bubbles: true }));
  assert.equal(document.activeElement, tabs[0]);
  tabs[0].dispatchEvent(
    new dom.window.KeyboardEvent('keydown', { key: 'ArrowLeft', bubbles: true }),
  );
  assert.equal(document.activeElement, tabs[2]);
  const data = read('content/lessons/fundamentos/tu-primer-paso.json');
  document.querySelector('[data-tab=comprobar]').click();
  await until(() => document.getElementById('qbox'));
  await quiz(data, false);
  assert.match(document.getElementById('qbox').textContent, /Revisa las explicaciones/);
  clickText('#qbox button', 'Volver a practicar');
  await quiz(data, true);
  assert.match(document.getElementById('qbox').textContent, /Resuelve también/);
  clickText('#qbox button', 'Ir a la práctica →');
  await until(() => document.getElementById('activities'));
  document.querySelector('[data-activity] input').value = data.activities[0].answers[0];
  submit(document.querySelector('[data-activity] form'));
  assert.match(document.getElementById('lesson-status').textContent, /Completada/);
  document.querySelector('[data-tab=comprobar]').click();
  await until(() => document.getElementById('qbox'));
  await quiz(data, true);
  assert.match(document.getElementById('qbox').textContent, /Puedes avanzar/);
  failSecond = true;
  clickText('#qbox button', 'Mi siguiente paso →');
  await until(() => document.getElementById('retry'));
  assert.match(document.getElementById('content').textContent, /No pudimos abrir/);
  failSecond = false;
  document.getElementById('retry').click();
  await until(() => document.getElementById('lesson'));
  assert.equal(document.querySelector('h1').textContent, 'Del editor a la ejecución');
  await navigate('practica', () => document.querySelector('[data-signal]'));
  await navigate('progreso', () => document.getElementById('export-progress'));
  let downloaded = false,
    revoked = false;
  t.mock.method(URL, 'createObjectURL', () => 'blob:demo');
  t.mock.method(URL, 'revokeObjectURL', () => {
    revoked = true;
  });
  t.mock.method(dom.window.HTMLAnchorElement.prototype, 'click', function () {
    if (this.download === 'teslacode-progreso.json') downloaded = true;
  });
  document.getElementById('export-progress').click();
  assert.equal(downloaded, true);
  await navigate('leccion/fundamentos/missing/aprender', () => document.getElementById('retry'));
  assert.match(document.getElementById('content').textContent, /no existe/);
  await navigate('no-existe', () =>
    document.getElementById('content').textContent.includes('todavía no existe'),
  );
  await navigate('leccion/fundamentos/tu-primer-paso/aprender', () =>
    document.getElementById('bookmark'),
  );
  t.mock.method(progressRepository, 'save', () => false);
  document.getElementById('bookmark').click();
  assert.match(document.getElementById('toast').textContent, /No pudimos guardar/);
  // El callback de revocación es parte de la operación de descarga real.
  await new Promise((resolve) => setTimeout(resolve, 1050));
  assert.equal(revoked, true);
});
