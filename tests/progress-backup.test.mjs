import test from 'node:test';
import assert from 'node:assert/strict';
import { emptyProgress } from '../js/core/storage.js';
import { recordAttempt, completeIfReady } from '../js/domain/progress.js';
import { MAX_BACKUP_BYTES, mergeProgress, parseBackup } from '../js/domain/progress-backup.js';
import { mountProgressImport, importMarkup } from '../js/features/progress-import.js';
import { installDOM, until } from './support/dom.mjs';

function earned(key, now = new Date('2026-11-07T12:00:00.000Z')) {
  const state = emptyProgress();
  recordAttempt(state, key, [{ id: 'q1', concept: 'demo.value', correct: true }], now);
  state.practices.push(key + '/apply');
  completeIfReady(state, key, { activities: [{ id: 'apply' }] });
  return state;
}
test('export/import round trip preserves evidence; merging copies cannot farm XP', () => {
  const a = earned('python/first'),
    b = earned('python/second');
  const merged = mergeProgress(a, parseBackup(JSON.stringify(b)));
  assert.equal(merged.xp, 120);
  assert.equal(merged.completed.length, 2);
  assert.deepEqual(mergeProgress(merged, b), merged);
  assert.deepEqual(mergeProgress(merged, merged), merged);
  assert.deepEqual(parseBackup(JSON.stringify(a)), a);
  assert.equal(a.completed.length, 1);
  assert.equal(mergeProgress({ ...a, xp: 180 }, b).xp, 240);
  assert.equal(
    parseBackup(JSON.stringify({ version: 1, xp: 180, completed: ['fundamentos/variables'] })).xp,
    180,
  );
});
test('merging retains the strongest score and the latest bounded evidence without duplicating attempts', () => {
  const a = earned('python/first'),
    b = earned('python/first');
  a.lessons['python/first'].attempts = [
    {
      at: '2026-11-08T10:00:00.000Z',
      score: 100,
      results: [{ id: 'q1', concept: 'demo.value', correct: true }],
    },
  ];
  b.lessons['python/first'].attempts = [{ at: '2026-11-08T12:00:00.000Z', score: 0, results: [] }];
  a.streak = { count: 2, lastDay: '2026-11-07' };
  b.streak = { count: 3, lastDay: '2026-11-08' };
  const merged = mergeProgress(a, b);
  assert.equal(merged.lessons['python/first'].best, 100);
  assert.equal(merged.lessons['python/first'].attempts.at(-1).score, 0);
  assert.equal(merged.streak.lastDay, '2026-11-08');
  const sameDay = mergeProgress(merged, { ...b, streak: { count: 4, lastDay: '2026-11-08' } });
  assert.equal(sameDay.streak.count, 4);
  assert.equal(mergeProgress(sameDay, a).streak.count, 4);
});
test('malformed, oversized or unsupported backups fail before mutating state', () => {
  for (const text of [
    'broken',
    '[]',
    'null',
    JSON.stringify({ version: 3 }),
    ' '.repeat(MAX_BACKUP_BYTES + 1),
  ])
    assert.throws(() => parseBackup(text));
  const base = emptyProgress();
  for (const changes of [
    { xp: -1 },
    { xp: 1.5 },
    { completed: 'bad' },
    { rewards: ['<script>'] },
    { streak: [] },
    { streak: { count: -1, lastDay: null } },
    { streak: { count: 1, lastDay: '2026-02-30' } },
    { recent: 'bad' },
    { goal: 'not/a-route' },
    { learningMode: 'unknown' },
    { lessons: [] },
    { lessons: { bad: {} } },
    { lessons: { 'r/l': { best: 30, attempts: [{ score: 300, results: [] }] } } },
    { lessons: { 'r/l': { best: 30, attempts: [{ score: 30, at: 'bad', results: [] }] } } },
    { lessons: { 'r/l': { best: 30, attempts: [{ score: 30, at: null, results: [{ id: 1 }] }] } } },
  ])
    assert.throws(() => parseBackup(JSON.stringify({ ...base, ...changes })));
  const missing = { ...base };
  delete missing.lessons;
  assert.throws(() => parseBackup(JSON.stringify(missing)));
});
test('import preview, cancellation, confirmation, persisted undo and failed storage', async (t) => {
  installDOM(t);
  const root = document.getElementById('root');
  root.innerHTML = importMarkup();
  const state = earned('python/first'),
    memory = new Map(),
    applied = [];
  const storage = {
    getItem: (k) => memory.get(k),
    setItem: (k, v) => memory.set(k, v),
    removeItem: (k) => memory.delete(k),
  };
  const original = structuredClone(state);
  const dispose = mountProgressImport(
    root,
    state,
    (next) => {
      applied.push(next);
      Object.assign(state, next);
    },
    { storage },
  );
  const input = root.querySelector('input');
  const select = (text, size = text.length) => {
    Object.defineProperty(input, 'files', {
      configurable: true,
      value: [{ size, text: async () => text }],
    });
    input.dispatchEvent(new window.Event('change'));
  };
  select('bad');
  await until(() => root.textContent.includes('JSON válido'));
  select('', MAX_BACKUP_BYTES + 1);
  await until(() => root.textContent.includes('supera'));
  select(JSON.stringify(earned('python/second')));
  await until(() => !root.querySelector('#confirm-import').disabled);
  assert.equal(applied.length, 0);
  root.querySelector('#cancel-import').click();
  assert.equal(root.querySelector('#confirm-import').disabled, true);
  select(JSON.stringify(earned('python/second')));
  await until(() => !root.querySelector('#confirm-import').disabled);
  root.querySelector('#confirm-import').click();
  await until(() => applied.length === 1);
  assert.equal(applied[0].xp, 120);
  root.querySelector('#undo-import').click();
  await until(() => applied.length === 2);
  assert.deepEqual(applied[1], original);
  root.querySelector('#undo-import').click();
  await until(() => root.textContent.includes('No pudimos recuperar'));
  select(JSON.stringify(earned('python/second')));
  await until(() => !root.querySelector('#confirm-import').disabled);
  root.querySelector('#confirm-import').click();
  await until(() => applied.length === 3);
  state.bookmarks.push('python/new-bookmark');
  root.querySelector('#undo-import').click();
  await until(() => root.textContent.includes('progreso cambió'));
  assert.equal(applied.length, 3);
  assert.match(root.textContent, /progreso cambió/);
  assert.ok(state.bookmarks.includes('python/new-bookmark'));
  dispose();
  const blocked = mountProgressImport(
    root,
    state,
    () => assert.fail('Cannot apply without backup'),
    {
      storage: {
        getItem() {
          throw Error('blocked');
        },
        setItem() {
          throw Error('quota');
        },
      },
    },
  );
  select(JSON.stringify(earned('python/second')));
  await until(() => !root.querySelector('#confirm-import').disabled);
  root.querySelector('#confirm-import').click();
  await until(() => root.textContent.includes('Se conserva tu progreso'));
  blocked();
});

test('large course backups stay within the undo quota and preserve full project evidence', async (t) => {
  installDOM(t);
  const root = document.getElementById('root');
  root.innerHTML = importMarkup();
  const state = emptyProgress();
  const incoming = earned('fundamentos/proyecto');
  const code = 'console.log("ámbito");\n'.repeat(700);
  const at = '2026-11-16T16:00:00.000Z';
  for (let i = 0; i < 12; i++)
    incoming.projectArtifacts['fundamentos/proyecto/etapa-' + i] = {
      project: 'plan-practica',
      code,
      report: '',
      notes: 'Explicación guardada',
      updatedAt: at,
      verifiedAt: at,
    };
  let snapshot;
  mountProgressImport(root, state, (next) => Object.assign(state, next), {
    storage: {
      getItem: () => snapshot,
      setItem: (_, value) => {
        if (value.length > 50_000) throw Error('quota');
        snapshot = value;
      },
      removeItem: () => (snapshot = undefined),
    },
  });
  const text = JSON.stringify(incoming);
  const file = root.querySelector('input');
  Object.defineProperty(file, 'files', { value: [{ size: text.length, text: async () => text }] });
  file.dispatchEvent(new window.Event('change'));
  const confirm = root.querySelector('#confirm-import');
  const undo = root.querySelector('#undo-import');
  await until(() => !confirm.disabled);
  confirm.click();
  await until(() => !undo.hidden);
  assert.match(snapshot, /^gzip:/);
  assert.deepEqual(state.projectArtifacts, incoming.projectArtifacts);
  undo.click();
  await until(() => undo.hidden);
  assert.deepEqual(state, emptyProgress());
});
