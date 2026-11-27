import test from 'node:test';
import assert from 'node:assert/strict';
import { createProgressRepository, emptyProgress } from '../js/core/storage.js';
import { recordAttempt, completeIfReady } from '../js/domain/progress.js';

function tabs() {
  const memory = new Map();
  const storage = {
    getItem: (key) => memory.get(key),
    setItem: (key, value) => memory.set(key, value),
  };
  return [createProgressRepository(storage), createProgressRepository(storage)];
}
function complete(state, key) {
  recordAttempt(state, key, [{ id: 'q1', concept: 'demo.value', correct: true }]);
  state.practices.push(`${key}/apply`);
  completeIfReady(state, key, { activities: [{ id: 'apply' }] });
}

test('a stale tab preserves achievements, attempts and preferences saved by another tab', () => {
  const [a, b] = tabs();
  const first = a.load(),
    second = b.load();
  complete(first, 'python/first');
  first.learningMode = 'experienced';
  assert.equal(a.save(first), true);
  complete(second, 'python/second');
  second.goal = 'python';
  assert.equal(b.save(second), true);
  assert.equal(second.xp, 120);
  assert.deepEqual(second.completed.sort(), ['python/first', 'python/second']);
  assert.equal(second.learningMode, 'experienced');
  assert.equal(second.goal, 'python');
  assert.equal(Object.keys(second.lessons).length, 2);
  a.save(first);
  assert.equal(first.xp, 120);
  assert.equal(first.goal, 'python');
  assert.equal(first.lessons['python/first'].attempts.length, 1);
});

test('bookmark removals survive merging while unrelated additions from another tab remain', () => {
  const [a, b] = tabs();
  const first = a.load();
  first.bookmarks.push('python/first');
  a.save(first);
  const second = b.load();
  first.bookmarks = [];
  second.bookmarks.push('python/second');
  b.save(second);
  a.save(first);
  assert.deepEqual(first.bookmarks, ['python/second']);
});

test('explicit restoration checks for concurrent changes and can remove imported achievements', () => {
  const [a, b] = tabs();
  const first = a.load();
  complete(first, 'python/first');
  a.save(first);
  const expected = structuredClone(first);
  const second = b.load();
  complete(second, 'python/second');
  b.save(second);
  assert.equal(a.save(emptyProgress(), { expected }), false);
  assert.equal(a.load().completed.length, 2);
  const latest = a.load();
  const restored = emptyProgress();
  assert.equal(a.save(restored, { expected: latest }), true);
  assert.deepEqual(a.load(), restored);
});

test('a stale writer cannot resurrect restored achievements, attempts, XP or bookmarks', () => {
  const [a, b] = tabs();
  const seed = a.load();
  complete(seed, 'python/imported');
  seed.xp += 180; // Legacy XP without a reward ledger must also stay undone.
  seed.bookmarks = ['python/imported'];
  a.save(seed);
  const stale = b.load();
  a.save(emptyProgress(), { expected: seed });
  complete(stale, 'python/new');
  stale.goal = 'python';
  assert.equal(b.save(stale), true);
  assert.deepEqual(stale.completed, ['python/new']);
  assert.deepEqual(stale.practices, ['python/new/apply']);
  assert.deepEqual(stale.rewards, ['python/new/q1']);
  assert.deepEqual(Object.keys(stale.lessons), ['python/new']);
  assert.deepEqual(stale.bookmarks, []);
  assert.equal(stale.xp, 60);
  assert.equal(stale.goal, 'python');
});

test('storage synchronization applies removals while retaining unsaved local changes', () => {
  const [a, b] = tabs();
  const first = a.load();
  first.recent = 'python/first';
  first.bookmarks = ['python/first'];
  a.save(first);
  const second = b.load();
  first.bookmarks.push('python/local');
  complete(first, 'python/local');
  second.bookmarks = [];
  second.recent = null;
  b.save(second);
  assert.equal(a.synchronize(first), true);
  assert.deepEqual(first.bookmarks, ['python/local']);
  assert.equal(first.recent, null);
  assert.deepEqual(first.completed, ['python/local']);
  assert.equal(a.save(first), true);
  assert.deepEqual(b.load(), first);
});

test('failed writes preserve the in-memory state and a later save can recover', () => {
  let stored = JSON.stringify({ ...emptyProgress(), completed: ['python/first'], xp: 50 });
  let blocked = true;
  const repository = createProgressRepository({
    getItem: () => stored,
    setItem: (_, value) => {
      if (blocked) throw Error('quota');
      stored = value;
    },
  });
  const local = emptyProgress();
  const before = structuredClone(local);
  assert.equal(repository.save(local), false);
  assert.deepEqual(local, before);
  blocked = false;
  assert.equal(repository.save(local), true);
  assert.deepEqual(local.completed, ['python/first']);
});

test('local storage shares exact copies of verified code and restores legacy project records', () => {
  const state = emptyProgress();
  const project = 'fundamentos/proyecto/';
  const code = 'console.log("ámbito");\n'.repeat(700);
  const at = '2026-11-16T16:00:00.000Z';
  const artifact = {
    project: 'plan-practica',
    code,
    report: '',
    notes: 'Explicación guardada',
    updatedAt: at,
    verifiedAt: at,
    assessment: {
      version: 2,
      responses: {},
      reflection: 'Traza completa',
      testedCode: code,
      reviewStatus: 'pending',
      technical: { passed: true, cases: 4 },
    },
  };
  state.projectArtifacts[project + 'uno'] = artifact;
  state.projectArtifacts[project + 'dos'] = {
    ...artifact,
    assessment: { ...artifact.assessment, testedCode: 'Otro código' },
  };
  let raw = JSON.stringify(state);
  const repository = createProgressRepository({
    getItem: () => raw,
    setItem: (_, value) => (raw = value),
  });
  assert.deepEqual(repository.load(), state);
  assert.equal(repository.save(state), true);
  assert.equal(JSON.parse(raw).projectArtifacts[project + 'uno'].assessment.testedCode, null);
  assert.equal(
    JSON.parse(raw).projectArtifacts[project + 'dos'].assessment.testedCode,
    'Otro código',
  );
  assert.deepEqual(repository.load(), state);
});

test('malformed storage can be replaced and empty bookmark changes preserve remote removals', () => {
  let raw = 'broken';
  const repo = createProgressRepository({
    getItem: () => raw,
    setItem: (_, value) => {
      raw = value;
    },
  });
  const state = repo.load();
  assert.equal(repo.save(state), true);
  state.bookmarks = ['python/first'];
  repo.save(state);
  raw = JSON.stringify({ ...state, bookmarks: [] });
  state.goal = 'python';
  repo.save(state);
  assert.deepEqual(state.bookmarks, []);
});

test('failed synchronization leaves local edits and the previous baseline intact', () => {
  let raw = JSON.stringify(emptyProgress());
  const repository = createProgressRepository({
    getItem: () => raw,
    setItem: (_, value) => {
      raw = value;
    },
  });
  const state = repository.load();
  state.bookmarks = ['python/new'];
  const before = structuredClone(state);
  raw = 'invalid JSON';
  assert.equal(repository.synchronize(state), false);
  assert.deepEqual(state, before);
  raw = JSON.stringify(emptyProgress());
  assert.equal(repository.synchronize(state), true);
  assert.equal(repository.synchronize(state), true);
  assert.equal(repository.save(state), true);
  assert.deepEqual(repository.load().bookmarks, ['python/new']);
});
