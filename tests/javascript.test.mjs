import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { runJavaScript } from './support/javascript.mjs';
import { javascriptExerciseErrors } from '../js/domain/javascript-exercise.js';
import {
  createJavaScriptRunner,
  javascriptFrame,
  javascriptFrameBootstrap,
} from '../js/repositories/javascript-runner.js';
import {
  indexRoute,
  routeEdition,
  includeArchives,
  nextLesson,
  accessState,
} from '../js/domain/curriculum.js';
import { mountActivities } from '../js/features/activities.js';
import { codeActivityMarkup } from '../js/features/code-activity.js';
import { installDOM, until } from './support/dom.mjs';

const source = JSON.parse(readFileSync('content/curriculum/fundamentos.json', 'utf8'));
const route = indexRoute(source);

test('new edition has an independent entry while preserving every old lesson and its progress', () => {
  assert.equal(route.lessons.filter((l) => l.status === 'published').length, 8);
  assert.equal(route.archive.lessons.length, 68);
  const completed = new Set(route.archive.lessons.map((l) => 'fundamentos/' + l.id));
  assert.equal(nextLesson(route, completed).id, 'js-tu-primer-programa');
  assert.equal(accessState(route, route.lessons[1].id, completed).status, 'locked');
  assert.equal(routeEdition(route, 'tu-primer-paso'), route.archive);
  assert.equal(routeEdition(route, 'archivo'), route.archive);
  assert.equal(routeEdition(route, route.lessons[0].id), route);
  assert.equal(routeEdition(undefined, 'missing'), undefined);
  assert.equal(routeEdition(route, 'missing'), route);
  assert.equal(includeArchives([route]).length, 2);
  assert.equal(includeArchives([{ id: 'other' }]).length, 1);
  assert.equal(accessState(route.archive, 'tu-primer-paso', completed).status, 'done');
});

test('all JavaScript lessons have executable examples, correct solutions and effective counterexamples', () => {
  let examples = 0,
    activities = 0,
    cases = 0;
  for (const meta of route.lessons.filter((l) => l.status === 'published')) {
    const data = JSON.parse(readFileSync(`content/lessons/fundamentos/${meta.id}.json`, 'utf8'));
    for (const example of data.examples) {
      const { result } = runJavaScript(example.code, {
        name: example.id,
        stdin: example.stdin,
        stdout: example.stdout,
      });
      assert.equal(result.passed, true, example.id + ': ' + JSON.stringify(result));
      examples++;
    }
    for (const activity of data.activities) {
      assert.deepEqual(javascriptExerciseErrors(activity), [], activity.id);
      for (const item of activity.cases) {
        assert.equal(
          runJavaScript(activity.solution, item).result.passed,
          true,
          activity.id + '/' + item.name,
        );
        assert.equal(runJavaScript('console.log("incorrecto");', item).result.passed, false);
        assert.equal(
          runJavaScript('// Otra escritura correcta\n' + activity.solution, item).result.passed,
          true,
        );
        cases++;
      }
      activities++;
    }
  }
  assert.equal(examples, 15);
  assert.equal(activities, 24);
  assert.ok(cases > 24);
});

test('real script semantics preserve output on errors, reject top-level return and bound output', () => {
  assert.equal(runJavaScript('console.log("antes");\nnoExiste();').result.stdout, 'antes\n');
  assert.match(runJavaScript('console.log("antes");\nnoExiste();').result.traceback, /Línea 2/);
  assert.match(runJavaScript('return 1;').result.error, /SyntaxError/);
  assert.match(runJavaScript('throw null;').result.error, /null/);
  assert.match(runJavaScript('throw undefined;').result.error, /undefined/);
  assert.equal(
    runJavaScript('console.log("a\\r\\nb");', { name: 'CRLF', stdout: 'a\nb\n' }).result.passed,
    true,
  );
  assert.match(runJavaScript('console.log("sin cierre);').result.error, /SyntaxError/);
  assert.match(runJavaScript('prompt("dato");').result.error, /Faltan entradas/);
  assert.match(runJavaScript('console.log("a".repeat(6001));').result.error, /6000/);
  assert.match(runJavaScript('while(true){}').result.error, /timed out/);
  const program =
    'console.info(null,undefined,true,5n);const x={};x.x=x;console.warn(x);console.error({a:1});console.debug("fin");';
  assert.equal(
    runJavaScript(program).result.stdout,
    'null undefined true 5\n[Objeto circular]\n{"a":1}\nfin\n',
  );
  const { result, messages, blobs } = runJavaScript(
    'console.log("Hola");',
    { name: 'libre' },
    true,
  );
  assert.equal(result.passed, null);
  assert.ok(messages.some((m) => m.type === 'output'));
  assert.equal(blobs.size, 0);
  assert.deepEqual(
    javascriptExerciseErrors({ starter: 5, solution: '', entrypoint: 'f', cases: [] }).length,
    4,
  );
  assert.ok(
    javascriptExerciseErrors({
      starter: '',
      solution: '1',
      cases: [{ name: '', stdout: 3, stdin: [1] }],
    }).length >= 3,
  );
});

test('runner accepts only its own frame/channel and releases on success, stop, timeout and replacement', async (t) => {
  installDOM(t);
  const status = [],
    output = [];
  const runner = createJavaScriptRunner({ timeout: 10, loadTimeout: 10 });
  await assert.rejects(runner.run({ code: '', cases: [{}] }), /programa/);
  await assert.rejects(runner.run({ code: '1', cases: [] }), /casos/);
  const job = { code: 'console.log(1);', cases: [{ name: 'uno', stdout: '1\n' }] };
  const send = (type, extra = {}) => {
    const frame = document.querySelector('iframe'),
      channel = frame.srcdoc.match(/teslacode-js-[a-z0-9-]+/)[0];
    window.dispatchEvent(
      new window.MessageEvent('message', {
        source: frame.contentWindow,
        data: { channel, type, ...extra },
      }),
    );
  };
  let pending = runner.run(
    job,
    (s) => status.push(s),
    (s) => output.push(s),
  );
  window.dispatchEvent(new window.MessageEvent('message', { data: { type: 'result' } }));
  send('frame-ready');
  send('running');
  send('output', { output: 'salida' });
  send('result', { result: { version: 'browser', results: [] } });
  assert.equal((await pending).version, 'browser');
  assert.deepEqual(status, ['loading', 'running']);
  assert.deepEqual(output, ['salida']);
  assert.equal(document.querySelectorAll('iframe').length, 0);
  pending = runner.run(job);
  const cancelled = assert.rejects(pending, /detenida/);
  runner.cancel();
  await cancelled;
  pending = runner.run(job);
  const replaced = assert.rejects(pending, /detenida/);
  const replacement = runner.run(job);
  await replaced;
  send('error', { message: 'fallo de worker' });
  await assert.rejects(replacement, /fallo de worker/);
  await assert.rejects(runner.run(job), /preparar/);
  pending = runner.run(job);
  send('running');
  await assert.rejects(pending, /agotó el tiempo/);
  pending = runner.run(job);
  const disposed = assert.rejects(pending, /detenida/);
  runner.dispose();
  await disposed;
  runner.cancel();
  assert.equal(document.querySelectorAll('iframe').length, 0);
  assert.match(javascriptFrame('test-channel'), /connect-src 'none'/);
  assert.ok(!javascriptFrame('test-channel').includes('allow-same-origin'));
});

test('frame supervisor creates a fresh Worker per case and forwards only matching jobs', (t) => {
  const listeners = [],
    messages = [],
    workers = [];
  const original = Object.getOwnPropertyDescriptors(globalThis);
  const fakeParent = { postMessage: (message) => messages.push(message) };
  t.after(() => {
    for (const key of ['window', 'parent', 'Worker']) {
      if (original[key]) Object.defineProperty(globalThis, key, original[key]);
      else delete globalThis[key];
    }
  });
  globalThis.window = { addEventListener: (type, listener) => listeners.push(listener) };
  globalThis.parent = fakeParent;
  globalThis.Worker = class {
    constructor() {
      workers.push(this);
    }
    terminate() {
      this.terminated = true;
    }
    postMessage(data) {
      this.data = data;
    }
  };
  javascriptFrameBootstrap('channel', 'worker source');
  listeners[0]({ source: {}, data: { channel: 'channel' } });
  listeners[0]({ source: fakeParent, data: { channel: 'wrong' } });
  listeners[0]({
    source: fakeParent,
    data: { channel: 'channel', job: { code: 'x', cases: [{ name: 'a' }, { name: 'b' }] } },
  });
  assert.equal(workers.length, 1);
  workers[0].onmessage({ data: { type: 'output', output: 'a' } });
  workers[0].onmessage({ data: { type: 'result', result: { name: 'a' } } });
  assert.equal(workers[0].terminated, true);
  assert.equal(workers.length, 2);
  workers[0].onmessage({ data: { type: 'result', result: { name: 'stale' } } });
  workers[0].onerror({ message: 'stale error' });
  workers[1].onmessage({ data: { type: 'other' } });
  workers[1].onerror({ message: 'error' });
  workers[1].onerror({});
  workers[1].onmessage({ data: { type: 'result', result: { name: 'b' } } });
  assert.equal(messages.at(-1).result.results.length, 2);
  listeners[0]({ source: fakeParent, data: { channel: 'channel' } });
  assert.equal(workers.length, 2);
});

test('JavaScript editor hides untaught input controls and exploring never grants progress', async (t) => {
  installDOM(t);
  const root = document.getElementById('root'),
    solved = [];
  const activity = {
    id: 'js-test',
    type: 'javascript',
    starter: 'console.log(1);',
    cases: [{ name: 'one', stdout: '1\n' }],
    hint: 'hint',
    explanation: 'ok',
  };
  const dispose = mountActivities(
    root,
    [activity],
    () => false,
    (id) => solved.push(id),
    {
      runnerFactory: () => ({
        async run(job, status) {
          status('loading');
          return {
            version: 'browser',
            results: [{ name: 'one', stdout: '1\n', passed: job.mode === 'run' ? null : true }],
          };
        },
        cancel() {},
        dispose() {},
      }),
    },
  );
  assert.equal(root.querySelector('.console-inputs').hidden, true);
  assert.match(root.querySelector('h4').textContent, /JavaScript/);
  root.querySelector('[data-run]').click();
  await until(() => !root.querySelector('[data-run]').disabled);
  assert.deepEqual(solved, []);
  root.querySelector('[data-check]').click();
  await until(() => !root.querySelector('[data-run]').disabled);
  assert.deepEqual(solved, ['js-test']);
  dispose();
  assert.doesNotMatch(codeActivityMarkup(activity, { practice: false }), /archivos creados/);
});
