import test from 'node:test';
import assert from 'node:assert/strict';
import { mountActivities } from '../js/features/activities.js';
import { mountCodeExamples } from '../js/features/code-activity.js';
import { installDOM, submit, until } from './support/dom.mjs';
const exercise = {
  id: 'build',
  type: 'python',
  prompt: 'Build',
  concept: 'c',
  starter: 'print(1)',
  solution: 'print(2)',
  cases: [{ name: 'two', stdout: '2\n' }],
  hint: 'Use two',
  explanation: 'Two is the expected output.',
};
test('exploring shows stdout, keeps custom inputs separate and never completes an activity', async (t) => {
  installDOM(t);
  const root = document.getElementById('root'),
    jobs = [],
    solved = [];
  let resolve, reject;
  const dispose = mountActivities(
    root,
    [{ ...exercise, cases: [{ name: 'preset', globals: { datos: [-3] }, stdout: '-3\n' }] }],
    () => false,
    (id) => solved.push(id),
    {
      runnerFactory: () => ({
        run(job, status, output) {
          jobs.push(job);
          status('running');
          output('<b>partial</b>');
          return new Promise((r, j) => {
            resolve = r;
            reject = j;
          });
        },
        cancel() {
          reject(Error('stopped'));
        },
        dispose() {},
      }),
    },
  );
  root.querySelector('[data-stdin]').value = 'Ana\n\n';
  root.querySelector('[data-run]').click();
  assert.equal(root.querySelector('.console-output').textContent, '<b>partial</b>');
  assert.equal(root.querySelector('.console-output b'), null);
  assert.deepEqual(jobs[0].cases[0].stdin, ['Ana', '', '']);
  assert.deepEqual(jobs[0].cases[0].globals, { datos: [-3] });
  assert.equal(jobs[0].mode, 'run');
  resolve({ version: '3.14.2', results: [{ stdout: 'Hola\n', passed: null }] });
  await until(() => !root.querySelector('[data-run]').disabled);
  assert.equal(root.querySelector('.console-output').textContent, 'Hola\n');
  assert.deepEqual(solved, []);
  assert.equal(root.querySelector('.badge.live'), null);
  root.querySelector('[data-clear]').click();
  assert.equal(root.querySelector('.console-output').textContent, '');
  root.querySelector('[data-run]').click();
  resolve({
    version: '3.14.2',
    results: [{ stdout: 'antes\n', error: 'ZeroDivisionError', traceback: 'ejercicio.py line 2' }],
  });
  await until(() => !root.querySelector('[data-run]').disabled);
  assert.equal(root.querySelector('.console-output').textContent, 'antes\n');
  assert.match(root.querySelector('.console-error').textContent, /line 2/);
  root.querySelector('[data-run]').click();
  reject(Error('download failed'));
  await until(() => !root.querySelector('[data-run]').disabled);
  assert.match(root.querySelector('.console-error').textContent, /download failed/);
  submit(root.querySelector('form'));
  assert.equal(jobs.at(-1).cases[0].stdin, undefined);
  resolve({
    version: '3.14.2',
    results: [{ name: 'preset', stdout: '-3\n', actual: '-3\n', expected: '-3\n', passed: true }],
  });
  await until(() => solved.length === 1);
  assert.match(root.querySelector('.console-output').textContent, /-3/);
  assert.match(root.querySelector('.practice-feedback').textContent, /Esperado: -3/);
  dispose();
});

test('every declared browser example gets an independent console; local examples explain the boundary', async (t) => {
  installDOM(t);
  const root = document.getElementById('root');
  root.innerHTML =
    '<pre data-language="python">x = 2</pre><pre data-language="python">import threading</pre>';
  const jobs = [],
    cleanups = [];
  const dispose = mountCodeExamples(
    root,
    {
      examples: [
        { id: 'silent', code: 'x = 2', stdin: ['2'] },
        {
          id: 'local',
          code: 'import threading',
          environment: 'local',
          environmentNote: 'Usa tu terminal <local>.',
        },
        { id: 'missing', code: 'not shown' },
      ],
    },
    {
      context: 'r/lesson',
      runnerFactory: () => ({
        async run(job) {
          jobs.push(job);
          return { version: '3.14.2', results: [{ stdout: '' }] };
        },
        dispose() {
          cleanups.push(true);
        },
        cancel() {},
      }),
    },
  );
  assert.equal(root.querySelectorAll('.code-example').length, 2);
  assert.equal(root.querySelectorAll('.python-console').length, 1);
  assert.equal(root.querySelector('[data-check]'), null);
  assert.equal(root.querySelector('[data-stdin]').value, '2');
  submit(root.querySelector('form'));
  await until(() => !root.querySelector('[data-run]').disabled);
  assert.equal(jobs[0].mode, 'run');
  assert.match(root.querySelector('.console-output').textContent, /sin imprimir/);
  assert.equal(root.querySelector('local'), null);
  dispose();
  assert.equal(cleanups.length, 1);
  mountCodeExamples(root, {})();
});
test('code practice saves drafts, escapes output and awards only successful executions', async (t) => {
  installDOM(t);
  const root = document.getElementById('root'),
    solved = [];
  let resolveRun,
    rejectRun,
    disposed = 0,
    cancelled = 0;
  const runner = {
    run: (_job, status) => {
      status('loading');
      status('running');
      return new Promise((resolve, reject) => {
        resolveRun = resolve;
        rejectRun = reject;
      });
    },
    dispose() {
      disposed++;
    },
    cancel() {
      cancelled++;
      rejectRun(Error('detenida'));
    },
  };
  localStorage.setItem('teslacode:draft:v1:r/l/build', 'print(2)');
  const dispose = mountActivities(
    root,
    [exercise],
    () => false,
    (id) => solved.push(id),
    { context: 'r/l', runnerFactory: () => runner },
  );
  assert.equal(root.querySelector('textarea').value, 'print(2)');
  root.querySelector('textarea').value = 'print(3)';
  root.querySelector('textarea').dispatchEvent(new window.Event('input'));
  assert.equal(localStorage.getItem('teslacode:draft:v1:r/l/build'), 'print(3)');
  root.querySelector('[data-hint]').click();
  assert.equal(root.querySelector('.hint').hidden, false);
  submit(root.querySelector('form'));
  submit(root.querySelector('form')); // The disabled state blocks duplicate submission.
  resolveRun({
    version: '3.14.2',
    results: [{ name: '<img src=x>', passed: false, actual: '<script>', expected: '2' }],
  });
  await until(() => !root.querySelector('[type=submit]').disabled);
  assert.equal(solved.length, 0);
  assert.equal(root.querySelector('img,script'), null);
  submit(root.querySelector('form'));
  resolveRun({
    version: '3.14.2',
    results: [{ name: 'two', passed: false, error: 'SyntaxError' }],
  });
  await until(() => root.textContent.includes('SyntaxError'));
  submit(root.querySelector('form'));
  root.querySelector('[data-stop]').click();
  await until(() => root.textContent.includes('detenida'));
  assert.equal(cancelled, 1);
  submit(root.querySelector('form'));
  resolveRun({ version: '3.14.2', results: [{ name: 'two', passed: true }] });
  await until(() => solved.length === 1);
  assert.deepEqual(solved, ['build']);
  root.querySelector('[data-reset]').click();
  assert.equal(root.querySelector('textarea').value, exercise.starter);
  assert.equal(localStorage.getItem('teslacode:draft:v1:r/l/build'), exercise.starter);
  submit(root.querySelector('form'));
  dispose();
  resolveRun({ version: '3.14.2', results: [{ name: 'two', passed: true }] });
  await new Promise((resolve) => setTimeout(resolve, 0));
  assert.equal(solved.length, 1);
  assert.equal(disposed, 1);
});
test('function cases and unavailable draft storage remain usable', async (t) => {
  installDOM(t);
  const root = document.getElementById('root');
  let reject;
  const dispose = mountActivities(
    root,
    [{ ...exercise, entrypoint: 'f', cases: [{ name: 'one', args: [1], expected: 2 }] }],
    () => true,
    () => {},
    {
      storage: {
        getItem() {
          throw Error('blocked');
        },
        setItem() {
          throw Error('quota');
        },
      },
      runnerFactory: () => ({
        run: () => new Promise((_r, j) => (reject = j)),
        cancel() {},
        dispose() {},
      }),
    },
  );
  root.querySelector('textarea').dispatchEvent(new window.Event('input'));
  assert.match(root.textContent, /No se pudo guardar/);
  assert.match(root.textContent, /argumentos/);
  submit(root.querySelector('form'));
  dispose();
  reject(Error('aborted'));
  await new Promise((resolve) => setTimeout(resolve, 0));
});
