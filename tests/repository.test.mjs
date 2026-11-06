import test from 'node:test';
import assert from 'node:assert/strict';
const modulePath = '../js/repositories/content-repository.js';
const fresh = () => import(modulePath);
test('repository shares simultaneous requests, caches data and preserves endpoint names', async (t) => {
  const calls = [];
  let release;
  t.mock.method(globalThis, 'fetch', (path) => {
    calls.push(path);
    return new Promise(
      (resolve) => (release = () => resolve({ ok: true, json: async () => ({ id: 'lesson' }) })),
    );
  });
  const repo = await fresh(),
    a = repo.loadLesson('base', 'lesson'),
    b = repo.loadLesson('base', 'lesson');
  assert.strictEqual(a, b);
  assert.deepEqual(calls, ['content/lessons/base/lesson.json']);
  release();
  assert.deepEqual(await a, { id: 'lesson' });
  assert.strictEqual(repo.loadLesson('base', 'lesson'), a);
});
test('repository evicts failed HTTP and invalid JSON results so retry can work', async (t) => {
  let request = 0;
  t.mock.method(globalThis, 'fetch', async () => {
    request++;
    if (request === 1) return { ok: false };
    if (request === 2)
      return {
        ok: true,
        json: async () => {
          throw Error('invalid JSON');
        },
      };
    return { ok: true, json: async () => ({ ready: true }) };
  });
  const repo = await fresh();
  await assert.rejects(repo.getJson('retry'), /No se pudo cargar retry/);
  await assert.rejects(repo.getJson('retry'), /invalid JSON/);
  assert.deepEqual(await repo.getJson('retry'), { ready: true });
  assert.equal(request, 3);
});
test('repository loads configured routes in order and registry without guessing paths', async (t) => {
  const calls = [];
  t.mock.method(globalThis, 'fetch', async (path) => {
    calls.push(path);
    return {
      ok: true,
      json: async () => (path.endsWith('index.json') ? { routes: ['a', 'b'] } : { id: path }),
    };
  });
  const repo = await fresh();
  assert.deepEqual(
    (await repo.loadCurricula()).map((x) => x.id),
    ['content/curriculum/a.json', 'content/curriculum/b.json'],
  );
  await repo.loadConcepts();
  assert.equal(calls.at(-1), 'content/concepts.json');
});
