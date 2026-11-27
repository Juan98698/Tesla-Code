import test from 'node:test';
import assert from 'node:assert/strict';
import { emptyProgress } from '../js/domain/progress-state.js';
import { rebaseProgress } from '../js/domain/progress-sync.js';
import { recordAttempt, completeIfReady } from '../js/domain/progress.js';
import { recordProjectArtifact } from '../js/domain/learning-project.js';
const now = new Date('2026-11-26T12:00:00');
const key = 'fundamentos/proyecto/entrega';
function earn(state, id = 'python/new') {
  recordAttempt(state, id, [{ id: 'q1', concept: 'demo.value', correct: true }], now);
  state.practices.push(`${id}/apply`);
  completeIfReady(state, id, { activities: [{ id: 'apply' }] });
}
function delivery(state) {
  const code = 'console.log("Hola");';
  recordProjectArtifact(
    state,
    key,
    'plan-practica',
    {
      code,
      report: 'Hola',
      notes: 'Nota anterior',
      verifiedAt: now.toISOString(),
      assessment: {
        version: 2,
        responses: {},
        reflection: 'Mi explicación',
        testedCode: code,
        reviewStatus: 'pending',
        technical: { passed: true, cases: 1 },
      },
    },
    now,
  );
}

test('unchanged snapshots accept remote removals, null preferences and historical XP exactly', () => {
  const baseline = emptyProgress();
  earn(baseline);
  delivery(baseline);
  baseline.xp += 180;
  baseline.bookmarks = ['python/new'];
  baseline.recent = 'python/new';
  assert.deepEqual(rebaseProgress(baseline, baseline, emptyProgress()), emptyProgress());
  const remote = { ...emptyProgress(), completed: ['python/legacy'], xp: 0 };
  assert.deepEqual(rebaseProgress(baseline, baseline, remote), remote);
});

test('concurrent earned rewards and attempts merge without duplicating XP or mutating inputs', () => {
  const baseline = emptyProgress(),
    local = emptyProgress(),
    remote = emptyProgress();
  earn(local);
  earn(remote);
  const before = structuredClone([baseline, local, remote]);
  const next = rebaseProgress(local, baseline, remote);
  assert.equal(next.xp, 60);
  assert.equal(next.lessons['python/new'].attempts.length, 1);
  assert.deepEqual([baseline, local, remote], before);
  assert.equal(rebaseProgress({ ...baseline, xp: 10 }, baseline, remote).xp, 70);
});

test('a new failed attempt does not resurrect the old best score or its rewards after undo', () => {
  const baseline = emptyProgress();
  earn(baseline);
  const local = structuredClone(baseline);
  recordAttempt(local, 'python/new', [{ id: 'q1', concept: 'demo.value', correct: false }], now);
  const next = rebaseProgress(local, baseline, emptyProgress());
  assert.equal(next.lessons['python/new'].best, 0);
  assert.equal(next.lessons['python/new'].attempts.length, 1);
  assert.equal(next.lessons['python/new'].attempts[0].score, 0);
  assert.deepEqual(next.completed, []);
  assert.deepEqual(next.rewards, []);
  assert.equal(next.xp, 0);
  assert.equal(next.streak.count, 1);
});

test('a genuinely new attempt survives remote undo and an older date cannot replace the remote streak', () => {
  const baseline = emptyProgress();
  earn(baseline, 'python/old');
  baseline.streak = { count: 9, lastDay: '2026-11-25' };
  const local = structuredClone(baseline);
  earn(local);
  const next = rebaseProgress(local, baseline, emptyProgress());
  assert.equal(next.xp, 60);
  assert.equal(next.streak.count, 1);
  const remote = { ...emptyProgress(), streak: { count: 2, lastDay: '2026-11-27' } };
  assert.deepEqual(rebaseProgress(local, baseline, remote).streak, remote.streak);
});

test('editing a journal after undo keeps the new note without restoring an old verified delivery', () => {
  const baseline = emptyProgress();
  delivery(baseline);
  const local = structuredClone(baseline);
  recordProjectArtifact(
    local,
    key,
    'plan-practica',
    { notes: 'Una nota nueva' },
    new Date(now.getTime() + 1000),
  );
  const next = rebaseProgress(local, baseline, emptyProgress());
  assert.equal(next.projectArtifacts[key].notes, 'Una nota nueva');
  assert.equal(next.projectArtifacts[key].code, '');
  assert.equal(next.projectArtifacts[key].report, '');
  assert.equal(next.projectArtifacts[key].verifiedAt, null);
  assert.equal(next.projectArtifacts[key].assessment, undefined);
  const remote = structuredClone(baseline);
  assert.deepEqual(
    rebaseProgress(local, baseline, remote).projectArtifacts[key].assessment,
    remote.projectArtifacts[key].assessment,
  );
});

test('new submitted code preserves remote notes and unchanged deliveries are not replayed', () => {
  const baseline = emptyProgress();
  delivery(baseline);
  const local = structuredClone(baseline),
    remote = structuredClone(baseline);
  recordProjectArtifact(
    remote,
    key,
    'plan-practica',
    { notes: 'Nota de otra pestaña' },
    new Date(now.getTime() + 1000),
  );
  recordProjectArtifact(
    local,
    key,
    'plan-practica',
    { code: 'console.log("Nuevo");', verifiedAt: new Date(now.getTime() + 2000).toISOString() },
    new Date(now.getTime() + 2000),
  );
  const next = rebaseProgress(local, baseline, remote);
  assert.equal(next.projectArtifacts[key].code, 'console.log("Nuevo");');
  assert.equal(next.projectArtifacts[key].notes, 'Nota de otra pestaña');
  const fresh = emptyProgress();
  delivery(fresh);
  assert.deepEqual(
    rebaseProgress(fresh, emptyProgress(), emptyProgress()).projectArtifacts,
    fresh.projectArtifacts,
  );
});
