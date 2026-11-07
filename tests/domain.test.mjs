import test from 'node:test';
import assert from 'node:assert/strict';
import { emptyProgress, normalizeProgress, createProgressRepository } from '../js/core/storage.js';
import { recordAttempt, completeIfReady, conceptEvidence } from '../js/domain/progress.js';
import { indexRoute, isUnlocked, nextLesson } from '../js/domain/curriculum.js';
import { updateStreak, dayKey } from '../js/domain/gamification.js';
import { grade, isPassing } from '../js/domain/grading.js';
import { shuffle } from '../js/core/html.js';
import { runProgram } from '../js/domain/runner.js';

test('completion requires practice and a passing quiz; rewards cannot be farmed', () => {
  const state = emptyProgress(),
    key = 'demo/lesson',
    data = { activities: [{ id: 'apply' }] };
  const results = Array.from({ length: 5 }, (_, i) => ({
    id: 'q' + i,
    concept: 'demo.value',
    correct: i < 4,
  }));
  assert.equal(recordAttempt(state, key, results), 80);
  assert.equal(state.xp, 40);
  assert.equal(completeIfReady(state, key, data), false);
  state.practices.push(key + '/apply');
  assert.equal(completeIfReady(state, key, data), true);
  assert.equal(state.xp, 90);
  recordAttempt(state, key, results);
  completeIfReady(state, key, data);
  assert.equal(state.xp, 90);
  recordAttempt(
    state,
    key,
    results.map((r) => ({ ...r, correct: true })),
  );
  assert.equal(state.xp, 100);
  assert.equal(state.lessons[key].best, 100);
  assert.deepEqual(state.completed, [key]);
});
test('latest evidence replaces earlier mistakes, while best score persists', () => {
  const state = emptyProgress();
  recordAttempt(state, 'r/l', [{ id: 'q', concept: 'c', correct: true }]);
  recordAttempt(state, 'r/l', [{ id: 'q', concept: 'c', correct: false }]);
  assert.equal(state.lessons['r/l'].best, 100);
  assert.deepEqual(conceptEvidence(state).get('c'), { correct: 0, total: 1 });
});
test('lesson access recommends cross-route knowledge and preserves completed legacy lessons', () => {
  const route = indexRoute({
    id: 'web',
    levels: [
      {
        id: 'one',
        name: 'One',
        lessons: [
          { id: 'first', status: 'published', dependsOn: ['base/end'] },
          { id: 'later', status: 'planned', dependsOn: ['web/first'] },
        ],
      },
    ],
  });
  assert.equal(isUnlocked(route, 'first', new Set()), true);
  assert.equal(isUnlocked(route, 'first', new Set(['base/end'])), true);
  assert.equal(isUnlocked(route, 'later', new Set(['web/first'])), false);
  assert.equal(isUnlocked(route, 'first', new Set(['web/first'])), true);
  assert.equal(nextLesson(route, new Set(['base/end'])).id, 'first');
  assert.equal(isUnlocked(route, 'missing', new Set()), false);
});
test('storage migrates v1 without losing XP or completed lessons', () => {
  const memory = new Map([
    ['teslacode:progress:v1', JSON.stringify({ xp: 350, completed: ['fundamentos/variables'] })],
  ]);
  const repository = createProgressRepository({
      getItem: (k) => memory.get(k),
      setItem: (k, v) => memory.set(k, v),
    }),
    state = repository.load();
  assert.equal(state.xp, 350);
  assert.deepEqual(state.completed, ['fundamentos/variables']);
  assert.equal(repository.save(state), true);
  assert.ok(memory.has('teslacode:progress:v2'));
});
test('unavailable and malformed storage does not prevent learning', () => {
  const repo = createProgressRepository({
    getItem: () => {
      throw Error('blocked');
    },
    setItem: () => {
      throw Error('quota');
    },
  });
  assert.deepEqual(repo.load(), emptyProgress());
  assert.equal(repo.save(emptyProgress()), false);
  assert.deepEqual(normalizeProgress({ completed: 'bad', xp: -1, lessons: null }), emptyProgress());
});
test('streak follows local calendar days across DST and repeated activity', () => {
  const date = new Date(2026, 10, 6, 1);
  const yesterday = new Date(2026, 10, 5, 20);
  const streak = updateStreak({ count: 2, lastDay: dayKey(yesterday) }, date);
  assert.equal(streak.count, 3);
  assert.deepEqual(updateStreak(streak, date), streak);
  assert.equal(updateStreak(streak, new Date(2026, 10, 8, 1)).count, 1);
});
test('graders handle exact order, normalized free answers and boundaries', () => {
  assert.equal(grade({ type: 'text', answers: ['Sí'] }, '  SÍ  '), true);
  assert.equal(grade({ type: 'order', steps: ['a', 'b'] }, ['b', 'a']), false);
  assert.equal(grade({ type: 'choice', answer: 2 }, 2), true);
  assert.equal(grade({ type: 'missing' }, ''), false);
  assert.equal(isPassing(4, 5), true);
  assert.equal(isPassing(3, 4), false);
  assert.equal(isPassing(0, 0), false);
});
test('Fisher-Yates preserves original answer identities without mutating source', () => {
  const items = [{ id: 0 }, { id: 1 }, { id: 2 }, { id: 3 }],
    result = shuffle(items, () => 0);
  assert.deepEqual(
    items.map((i) => i.id),
    [0, 1, 2, 3],
  );
  assert.deepEqual(
    result.map((i) => i.id),
    [1, 2, 3, 0],
  );
});
test('bounded runner follows precedence, reassignment, unary minus and traces', () => {
  const result = runProgram('a = 2 + 3 * 4\nb = (a - 4) / 2\na = a + 1\nmostrar(a)\nmostrar(-b)');
  assert.deepEqual(result.output, ['15', '-5']);
  assert.equal(result.trace[0].memory.a, 14);
  assert.equal(result.memory.a, 15);
});
test('runner rejects script execution, missing values, infinite results and oversized programs', () => {
  for (const source of [
    'mostrar(fetch("secret"))',
    'x = desconocida',
    'x = 1 / 0',
    'x = 2 ** 3',
    'x = 1; location.reload()',
    'x = (2 + 3',
  ])
    assert.throws(() => runProgram(source));
  assert.throws(() => runProgram('a = 1\n'.repeat(51)));
  assert.throws(() => runProgram(' '.repeat(4001)));
});

test('malformed attempt data cannot crash concept evidence or poison best score', () => {
  const state = normalizeProgress({
    lessons: {
      'demo/lesson': {
        best: Infinity,
        attempts: [
          { score: 50, results: [null, { id: 'q1', concept: 'demo', correct: false }, { id: 3 }] },
        ],
      },
    },
  });
  assert.equal(state.lessons['demo/lesson'].best, 0);
  assert.deepEqual(conceptEvidence(state).get('demo'), { correct: 0, total: 1 });
});

test('normalization preserves valid streaks, recent goals and bounded attempts only', () => {
  const normalized = normalizeProgress({
    streak: { count: 3, lastDay: '2026-11-06' },
    recent: 'ia/intro',
    goal: 'ia',
    bookmarks: ['a/b', 'a/b', 2],
    lessons: {
      invalid: {},
      'r/l': {
        best: 200,
        attempts: Array.from({ length: 25 }, (_, i) => ({
          at: 'today',
          score: i,
          results: [{ id: 'q', concept: 'c', correct: true }],
        })),
      },
    },
  });
  assert.equal(normalized.streak.count, 3);
  assert.equal(normalized.recent, 'ia/intro');
  assert.equal(normalized.goal, 'ia');
  assert.deepEqual(normalized.bookmarks, ['a/b']);
  assert.equal(normalized.lessons['r/l'].attempts.length, 20);
  assert.equal(normalized.lessons['r/l'].best, 100);
  assert.equal(normalized.lessons.invalid, undefined);
  for (const value of [null, [], 3, 'invalid'])
    assert.deepEqual(normalizeProgress(value), emptyProgress());
});
test('runner supports remainder, comments and empty programs while preserving line numbers', () => {
  assert.deepEqual(runProgram('// solo un comentario\n').trace, []);
  const result = runProgram('// comentario\na = 10 % 3\nmostrar(a)');
  assert.deepEqual(result.output, ['1']);
  assert.equal(result.trace[0].line, 2);
  assert.throws(() => runProgram('x = 1 % 0'), /dividir entre cero/);
  assert.throws(() => runProgram('x = ' + '9'.repeat(310)), /número finito/);
});
test('attempt history stays bounded without losing the best score or re-awarding XP', () => {
  const state = emptyProgress();
  for (let i = 0; i < 25; i++)
    recordAttempt(state, 'r/l', [{ id: 'q', concept: 'c', correct: i === 0 }]);
  assert.equal(state.lessons['r/l'].attempts.length, 20);
  assert.equal(state.lessons['r/l'].best, 100);
  assert.equal(state.xp, 10);
  assert.deepEqual(conceptEvidence(state).get('c'), { correct: 0, total: 1 });
});
