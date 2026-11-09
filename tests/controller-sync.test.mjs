import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { installDOM, until, change } from './support/dom.mjs';
import { PROGRESS_KEY } from '../js/core/storage.js';

test('cross-tab updates preserve active lessons and queued writes retain external achievements', async (t) => {
  const dom = installDOM(t, readFileSync('index.html', 'utf8'));
  t.mock.method(globalThis, 'fetch', async (url) => ({
    ok: true,
    json: async () => JSON.parse(readFileSync(url.split('?')[0], 'utf8')),
  }));
  const timers = new Set(),
    timeout = globalThis.setTimeout;
  t.mock.method(globalThis, 'setTimeout', (fn, delay, ...args) => {
    const timer = timeout(fn, delay, ...args);
    timers.add(timer);
    return timer;
  });
  t.after(() => timers.forEach(clearTimeout));
  await (
    await import('../js/main.js')
  ).ready;
  const external = JSON.parse(localStorage.getItem(PROGRESS_KEY));
  external.completed = ['fundamentos/tu-primer-paso'];
  external.xp = 50;
  const notify = (key = PROGRESS_KEY) =>
    window.dispatchEvent(new dom.window.StorageEvent('storage', { key }));
  localStorage.setItem(PROGRESS_KEY, JSON.stringify(external));
  notify('unrelated');
  assert.equal(document.getElementById('xp').textContent, '0 XP');
  notify();
  assert.equal(document.getElementById('xp').textContent, '50 XP');
  location.hash = '#/leccion/fundamentos/editor-y-ejecucion/aprender';
  await until(() => document.getElementById('lesson'));
  const lesson = document.getElementById('lesson');
  external.xp = 100;
  localStorage.setItem(PROGRESS_KEY, JSON.stringify(external));
  notify();
  assert.equal(document.getElementById('lesson'), lesson);
  assert.equal(document.getElementById('xp').textContent, '100 XP');
  const locks = {
    request: (key, operation) => {
      assert.equal(key, PROGRESS_KEY);
      return Promise.resolve().then(operation);
    },
  };
  Object.defineProperty(navigator, 'locks', { configurable: true, value: locks });
  location.hash = '#/inicio';
  await until(() => document.getElementById('studio-route-select'));
  change(document.getElementById('studio-route-select'), 'python', 'change');
  external.completed.push('python/python-y-programas');
  external.xp = 150;
  localStorage.setItem(PROGRESS_KEY, JSON.stringify(external));
  notify();
  await until(() => JSON.parse(localStorage.getItem(PROGRESS_KEY)).goal === 'python');
  assert.equal(JSON.parse(localStorage.getItem(PROGRESS_KEY)).completed.length, 2);
  locks.request = () => Promise.reject(Error('unavailable'));
  change(document.getElementById('studio-route-select'), 'frontend', 'change');
  await until(
    () => document.getElementById('toast').textContent === 'No pudimos guardar el progreso.',
  );
  await Promise.resolve();
  locks.request = () => {
    throw Error('unavailable');
  };
  change(document.getElementById('studio-route-select'), 'backend', 'change');
  assert.equal(document.getElementById('toast').textContent, 'No pudimos guardar el progreso.');
});
