import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { runJavaScript } from './support/javascript.mjs';
import { javascriptExerciseErrors } from '../js/domain/javascript-exercise.js';
import { mountActivities } from '../js/features/activities.js';
import { installDOM } from './support/dom.mjs';
import { emptyProgress } from '../js/core/storage.js';
import { recordAttempt, completeIfReady } from '../js/domain/progress.js';
const read = (id) => JSON.parse(readFileSync(`content/lessons/fundamentos/${id}.json`));
const evaluate = (code, item = { name: 'doble', args: [3], expected: 6 }, name = 'doble') =>
  runJavaScript(code, item, false, name).result;

test('function assessment calls real functions, checks types and rejects output-only shortcuts', () => {
  for (const code of [
    'function doble(x){return x*2;}',
    'const doble = (dato) => dato + dato;',
    'let doble = function(dato){return 2*dato;};',
  ])
    assert.equal(evaluate(code).passed, true, code);
  for (const code of [
    'console.log(6);',
    'function doble(x){console.log(x*2);}',
    'function doble(x){return "6";}',
    'function doble(x){return 6;}console.log(6);',
  ])
    assert.equal(evaluate(code).passed, false, code);
  assert.equal(evaluate('function doble(){return undefined;}').passed, false);
  assert.match(evaluate('function doble(){throw Error("problema");}').error, /problema/);
  assert.match(evaluate('function doble(){return "x".repeat(6001);}').error, /6000/);
});

test('array contracts check value, order, type and non-mutation and isolate original test arguments', () => {
  const item = { name: 'list', args: [[1, 2]], expected: [1, 2], preserveArgs: true };
  assert.equal(evaluate('function doble(datos){return datos;}', item).passed, true);
  assert.equal(evaluate('function doble(datos){return "[1,2]";}', item).passed, false);
  const mutated = evaluate('function doble(datos){datos[0]=9;return [1,2];}', item);
  assert.equal(mutated.passed, false);
  assert.match(mutated.error, /modificó/);
  assert.deepEqual(item.args, [[1, 2]]);
  assert.equal(evaluate('function doble(){return [2,1];}', item).passed, false);
  assert.equal(
    evaluate('function doble(){return {};}', { name: 'array', args: [], expected: [] }).passed,
    false,
  );
  assert.equal(
    evaluate('async function doble(){return {};}', { name: 'async', args: [], expected: {} })
      .passed,
    false,
  );
  assert.equal(
    evaluate('function doble(){return {b:2,a:1};}', {
      name: 'object',
      args: [],
      expected: { a: 1, b: 2 },
    }).passed,
    true,
  );
});

test('function contracts reject incomplete or unsafe names, non-finite expectations and missing arguments', () => {
  const activity = {
    starter: '',
    solution: 'function f(){return 1;}',
    entrypoint: 'f',
    cases: [{ name: 'uno', args: [], expected: 1 }],
  };
  assert.deepEqual(javascriptExerciseErrors(activity), []);
  for (const invalid of [
    { ...activity, entrypoint: 'x.y' },
    { ...activity, entrypoint: 'f);console.log(1);//' },
    { ...activity, cases: [{ name: 'missing', expected: 1 }] },
    { ...activity, cases: [{ name: 'missing', args: [] }] },
    { ...activity, cases: [{ name: 'finite', args: [], expected: NaN }] },
    { ...activity, cases: [{ name: 'preserve', args: [], expected: 1, preserveArgs: 'yes' }] },
    { ...activity, cases: [{ name: 'output', args: [], expected: 1, stdout: 3 }] },
  ])
    assert.ok(javascriptExerciseErrors(invalid).length > 0);
});

test('retrospective questions and cumulative tasks appear later and are required for a new completion', () => {
  for (const id of ['js-decisiones', 'js-funciones-y-retorno', 'js-proyecto-mediciones']) {
    const data = read(id),
      activity = data.activities.find((a) => a.id.startsWith('repaso-'));
    assert.ok(activity);
    assert.equal(data.quiz.filter((q) => q.id.startsWith('repaso-')).length, 3);
    assert.ok(data.quiz.filter((q) => q.id.startsWith('repaso-')).every((q) => q.type === 'text'));
    assert.ok(activity.hints.length >= 1);
    const state = emptyProgress(),
      key = `fundamentos/${id}`;
    recordAttempt(
      state,
      key,
      data.quiz.map((q) => ({ id: q.id, concept: q.concept, correct: true })),
    );
    state.practices = data.activities
      .filter((a) => a.id !== activity.id)
      .map((a) => `${key}/${a.id}`);
    assert.equal(completeIfReady(state, key, data), false);
    state.practices.push(`${key}/${activity.id}`);
    assert.equal(completeIfReady(state, key, data), true);
  }
});

test('hints reveal progressively, stay optional and grant no completion', (t) => {
  installDOM(t);
  const root = document.getElementById('root'),
    solved = [];
  mountActivities(
    root,
    [
      {
        id: 'hints',
        type: 'text',
        prompt: 'Pregunta',
        answers: ['2'],
        hint: 'Primera <pista>',
        hints: ['Segunda', 'Tercera'],
        explanation: 'Bien',
      },
    ],
    () => false,
    (id) => solved.push(id),
  );
  const button = root.querySelector('[data-hint]'),
    hint = root.querySelector('.hint');
  assert.equal(hint.hidden, true);
  button.click();
  assert.match(hint.textContent, /Primera <pista>/);
  assert.doesNotMatch(hint.textContent, /Segunda/);
  assert.equal(hint.querySelector('pista'), null);
  button.click();
  assert.match(hint.textContent, /Segunda/);
  assert.doesNotMatch(hint.textContent, /Tercera/);
  button.click();
  assert.match(hint.textContent, /Tercera/);
  assert.equal(button.disabled, true);
  assert.deepEqual(solved, []);
});
