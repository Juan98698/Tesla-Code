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
