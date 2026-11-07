import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { installDOM, submit, change } from './support/dom.mjs';
import { playgroundSettings, runPlayground } from '../js/domain/playground.js';
import { assetUrl } from '../js/core/assets.js';
import { homePage } from '../js/features/catalog.js';
import { studioMilestones, mountStudio } from '../js/features/studio.js';
import { indexRoute } from '../js/domain/curriculum.js';
import { emptyProgress } from '../js/core/storage.js';
const read = (p) => JSON.parse(readFileSync(p, 'utf8'));
const routes = read('content/curriculum/index.json').routes.map((id) =>
  indexRoute(read(`content/curriculum/${id}.json`)),
);

test('playgrounds return real local transformations for every specialty and reject invalid input', () => {
  assert.equal(playgroundSettings('unknown'), playgroundSettings('fundamentos'));
  assert.equal(runPlayground('fundamentos', '-1').body.despues, 0);
  assert.equal(runPlayground('unknown', '2').body.despues, 3);
  assert.equal(runPlayground('algoritmia', '-8, -3, -6').body.mayor, -3);
  assert.equal(runPlayground('algoritmia', '.5, -2, 0').body.mayor, 0.5);
  assert.equal(runPlayground('backend', '/saludo').status, '200 OK');
  assert.equal(runPlayground('backend', '/proyectos').body.proyectos.length, 3);
  assert.equal(runPlayground('backend', '/missing').status, '404 Not Found');
  assert.ok(!runPlayground('backend', '/bad\nHeader: x').request.includes('bad\n'));
  assert.equal(runPlayground('frontend', '<img src=x>').preview, '<img src=x>');
  assert.equal(runPlayground('bases-de-datos', 'todos').body.length, 3);
  assert.deepEqual(
    runPlayground('bases-de-datos', 'frontend').body.map((r) => r.nombre),
    ['Portfolio'],
  );
  assert.match(runPlayground('bases-de-datos', 'backend').request, /WHERE tipo = 'backend'/);
  assert.equal(runPlayground('ia', '¿Cuántos días dura el préstamo?').body.evidencia.length, 1);
  assert.equal(runPlayground('ia', 'horario de apertura').body.evidencia.length, 1);
  assert.equal(runPlayground('ia', 'sin coincidencias').body.evidencia.length, 0);
  for (const [id, value] of [
    ['fundamentos', ''],
    ['fundamentos', 'abc'],
    ['fundamentos', '1000001'],
    ['ia', 'x'.repeat(161)],
    ['algoritmia', '1,,2'],
    ['algoritmia', 'Infinity'],
    ['algoritmia', '1,'.repeat(41) + '2'],
    ['bases-de-datos', 'DROP TABLE proyectos'],
  ])
    assert.throws(() => runPlayground(id, value));
});
test('asset URLs share the document edition and remain usable in non-browser tools', (t) => {
  assert.match(assetUrl('assets/logo.png'), /\?v=local$/);
  installDOM(t);
  document.documentElement.dataset.release = 'test123';
  assert.equal(assetUrl('assets/logo.png'), 'assets/logo.png?v=test123');
});
test('milestone previews preserve real lesson identities, current progress and routes of different sizes', () => {
  for (const route of routes) {
    const selected = route.lessons.at(-1),
      items = studioMilestones(route, selected);
    assert.equal(items[0].id, selected.id);
    assert.equal(new Set(items.map((m) => m.id)).size, items.length);
    assert.ok(items.every((m) => route.lessons.includes(m)));
  }
  assert.equal(studioMilestones({ id: 'demo', lessons: [{ id: 'a', kind: 'core' }] }).length, 1);
});
test('workbench tabs, experiments and route selection never manufacture course progress', (t) => {
  const dom = installDOM(t),
    root = document.getElementById('root'),
    state = emptyProgress(),
    before = structuredClone(state),
    selected = [];
  for (const route of routes) {
    state.goal = route.id;
    root.innerHTML = homePage(routes, state);
    mountStudio(root, routes, (id) => selected.push(id));
    assert.match(root.querySelector('h1').textContent, /Construye/);
    assert.equal(root.querySelectorAll('.studio-node').length, 6);
    root.querySelector('[data-preview-tab=request]').click();
    assert.equal(
      root.querySelector('#studio-terminal').getAttribute('aria-labelledby'),
      'studio-tab-code',
    );
    const tabs = [...root.querySelectorAll('[data-preview-tab]')];
    for (const key of ['ArrowLeft', 'ArrowRight', 'Home', 'End', 'x'])
      tabs[0].dispatchEvent(new dom.window.KeyboardEvent('keydown', { key, bubbles: true }));
    root.querySelector('[data-preview-tab=result]').click();
    const control = root.querySelector('#studio-value');
    if (route.id === 'frontend') control.value = '<img src=x onerror=alert(1)>';
    submit(root.querySelector('#studio-form'));
    assert.equal(root.querySelector('#studio-error').hidden, true);
    if (route.id === 'frontend') {
      assert.equal(root.querySelector('#studio-dom-preview img'), null);
      assert.equal(root.querySelector('#studio-dom-preview').textContent, control.value);
    }
    change(root.querySelector('#studio-route-select'), 'backend', 'change');
    change(root.querySelector('#studio-route-select'), 'not-a-route', 'change');
  }
  state.goal = 'fundamentos';
  root.innerHTML = homePage(routes, state);
  mountStudio(root, routes, () => {});
  root.querySelector('#studio-value').value = '';
  submit(root.querySelector('form'));
  assert.equal(root.querySelector('#studio-error').hidden, false);
  root.querySelector('#studio-value').value = '3';
  submit(root.querySelector('form'));
  assert.equal(root.querySelector('#studio-error').hidden, true);
  assert.deepEqual(selected, Array(6).fill('backend'));
  assert.deepEqual(state, before);
});
