import test from 'node:test';
import assert from 'node:assert/strict';
import { mountActivities } from '../js/features/activities.js';
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
