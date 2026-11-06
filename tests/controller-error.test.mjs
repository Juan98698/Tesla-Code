import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { installDOM, until } from './support/dom.mjs';
const shell = readFileSync('index.html', 'utf8');
const read = (path) => JSON.parse(readFileSync(path, 'utf8'));
const start = () => import('../js/main.js').then((m) => m.ready);
test('bootstrap displays network errors and allows reload without a false readiness claim', async (t) => {
  installDOM(t, shell);
  t.mock.method(globalThis, 'fetch', async () => {
    throw Error('network unavailable');
  });
  await start();
  assert.match(document.getElementById('content').textContent, /No se pudo iniciar/);
  assert.equal(document.querySelector('.hero'), null);
});
