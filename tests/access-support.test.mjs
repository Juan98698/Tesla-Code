import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { accessState, indexRoute, isUnlocked, nextLesson } from '../js/domain/curriculum.js';
import { emptyProgress, normalizeProgress } from '../js/core/storage.js';
import {
  recommendedConcepts,
  supportPanel,
  mountSupport,
  mountOrientation,
} from '../js/features/learning-support.js';
import { homePage } from '../js/features/catalog.js';
import { installDOM, submit } from './support/dom.mjs';

const read = (p) => JSON.parse(readFileSync(p, 'utf8'));
const routes = read('content/curriculum/index.json').routes.map((id) =>
  indexRoute(read(`content/curriculum/${id}.json`)),
);
const concepts = new Map(read('content/concepts.json').concepts.map((c) => [c.id, c]));

test('all six real routes start without prior progress and later published steps stay gated', () => {
  for (const route of routes) {
    const state = emptyProgress(),
      published = route.lessons.filter((l) => l.status === 'published');
    assert.equal(nextLesson(route, new Set()).id, published[0].id, route.id);
    assert.equal(isUnlocked(route, published[0].id, new Set()), true, route.id);
    for (const later of published.slice(1))
      assert.equal(isUnlocked(route, later.id, new Set()), false, `${route.id}/${later.id}`);
    assert.deepEqual(state.completed, []);
    assert.equal(state.xp, 0);
  }
});
test('access separates local steps from external recommendations and retains legacy completion', () => {
  const route = indexRoute({
    id: 'web',
    levels: [
      {
        lessons: [
          { id: 'first', status: 'published', dependsOn: ['base/end'] },
          { id: 'next', status: 'published', dependsOn: ['web/first', 'data/end'] },
          { id: 'optional', kind: 'optional', status: 'published', dependsOn: ['web/first'] },
          { id: 'planned', status: 'planned', dependsOn: [] },
        ],
      },
    ],
  });
  assert.deepEqual(accessState(route, 'first', new Set()), {
    status: 'ready',
    required: [],
    recommended: ['base/end'],
  });
  assert.deepEqual(accessState(route, 'next', new Set()), {
    status: 'locked',
    required: ['web/first'],
    recommended: ['data/end'],
  });
  assert.equal(isUnlocked(route, 'next', new Set(['web/first'])), true);
  assert.equal(isUnlocked(route, 'optional', new Set(['web/first'])), true);
  assert.equal(accessState(route, 'next', new Set(['web/next'])).status, 'done');
  assert.equal(isUnlocked(route, 'planned', new Set(['web/planned'])), false);
  assert.equal(isUnlocked(route, 'missing', new Set()), false);
});
test('learning preference survives normalization without manufacturing progress or rewards', (t) => {
  installDOM(t);
  const state = normalizeProgress({
    version: 1,
    learningMode: 'experienced',
    xp: 200,
    completed: ['backend/cliente-y-servidor'],
  });
  assert.equal(state.learningMode, 'experienced');
  assert.equal(state.xp, 200);
  assert.deepEqual(state.completed, ['backend/cliente-y-servidor']);
  assert.deepEqual(state.rewards, []);
  assert.equal(normalizeProgress({ learningMode: 'expert-auto-pass' }).learningMode, 'guided');
  const before = structuredClone(state);
  document.getElementById('root').innerHTML = homePage(routes, state);
  assert.match(document.querySelector('.studio-lab-footer .btn').href, /practicar$/);
  assert.deepEqual(state, before);
});
test('contextual refreshers teach actual prerequisites and give feedback without awarding route credit', (t) => {
  installDOM(t);
  const route = routes.find((r) => r.id === 'algoritmia'),
    meta = route.lessons[0],
    state = emptyProgress();
  const root = document.getElementById('root'),
    before = structuredClone(state);
  root.innerHTML = supportPanel(route, meta, concepts);
  const items = recommendedConcepts(route, meta, concepts);
  assert.equal(items.length, 7);
  assert.ok(items.every((c) => c.refresher?.explanation));
  assert.match(root.textContent, /no son requisitos/);
  mountSupport(root, concepts);
  for (const c of items) {
    const el = root.querySelector(`[data-refresher="${c.id}"]`);
    el.querySelector('input').value = 'incorrecta';
    submit(el.querySelector('form'));
    assert.match(el.querySelector('[role=status]').textContent, /Todavía/);
    el.querySelector('[data-hint]').click();
    assert.equal(el.querySelector('.hint').hidden, false);
    el.querySelector('input').value = c.refresher.activity.answers[0];
    submit(el.querySelector('form'));
    assert.match(el.querySelector('[role=status]').textContent, /resolviste/);
  }
  assert.deepEqual(state, before);
  assert.equal(supportPanel(route, {}, concepts), '');
  assert.equal(
    supportPanel(route, { requiresConcepts: ['unknown', 'algoritmia.correccion'] }, concepts),
    '',
  );
  const fallback = supportPanel(
    route,
    { requiresConcepts: ['external'] },
    new Map([['external', { id: 'external', label: '<script>', introducedBy: 'other/intro' }]]),
  );
  assert.match(fallback, /Consultar el concepto/);
  assert.ok(!fallback.includes('<script>'));
});

test('optional orientation suggests support without completing courses and rejects unanswered inputs', (t) => {
  installDOM(t);
  const root = document.getElementById('root'),
    state = emptyProgress(),
    before = structuredClone(state),
    modes = [];
  const questions = [0, 1, 2].map((n) => ({
    id: `q${n}`,
    concept: 'fundamentos.variable',
    type: 'choice',
    prompt: 'Choose a value',
    code: n === 0 ? 'x = 1' : undefined,
    options: ['1', '2'],
    answer: 0,
  }));
  mountOrientation(root, questions, concepts, (mode) => modes.push(mode));
  submit(root.querySelector('form'));
  assert.match(root.querySelector('[role=status]').textContent, /Responde cada pregunta/);
  assert.deepEqual(modes, []);
  for (const value of ['1', '0']) {
    root.querySelectorAll(`input[value="${value}"]`).forEach((input) => {
      input.checked = true;
    });
    submit(root.querySelector('form'));
    root.querySelector('.orientation-result button').click();
  }
  assert.deepEqual(modes, ['guided', 'experienced']);
  assert.deepEqual(state, before);
  mountOrientation(
    root,
    questions.map((q) => ({ ...q, concept: 'unknown' })),
    concepts,
    () => {},
  );
  root.querySelectorAll('input[value="1"]').forEach((input) => {
    input.checked = true;
  });
  submit(root.querySelector('form'));
  assert.match(root.textContent, /conceptos de entrada/);
  mountOrientation(root, [], concepts, () => assert.fail('No recommendation without evidence'));
  assert.equal(root.querySelector('form'), null);
});
