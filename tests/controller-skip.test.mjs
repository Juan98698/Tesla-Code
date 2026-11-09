import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { installDOM, until } from './support/dom.mjs';

test('skip navigation focuses content without changing the route or replacing a lesson', async (t) => {
  const dom = installDOM(t, readFileSync('index.html', 'utf8'));
  t.mock.method(globalThis, 'fetch', async (url) => ({
    ok: true,
    json: async () => JSON.parse(readFileSync(url.split('?')[0], 'utf8')),
  }));
  await (
    await import('../js/main.js')
  ).ready;
  const link = document.querySelector('.skip-link');
  const activate = () =>
    assert.equal(
      link.dispatchEvent(new dom.window.MouseEvent('click', { bubbles: true, cancelable: true })),
      false,
    );
  activate();
  assert.equal(location.hash, '#/inicio');
  assert.equal(document.activeElement.id, 'content');
  assert.ok(document.querySelector('.hero'));
  location.hash = '#/leccion/fundamentos/tu-primer-paso/aprender';
  await until(() => document.getElementById('lesson'));
  const lesson = document.getElementById('lesson');
  link.focus();
  activate();
  assert.equal(location.hash, '#/leccion/fundamentos/tu-primer-paso/aprender');
  assert.equal(document.activeElement.id, 'content');
  assert.equal(document.getElementById('lesson'), lesson);
});
