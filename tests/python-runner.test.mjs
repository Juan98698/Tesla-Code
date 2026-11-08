import test from 'node:test';
import assert from 'node:assert/strict';
import { installDOM } from './support/dom.mjs';
import {
  createPythonRunner,
  runnerFrame,
  frameBootstrap,
  workerBootstrap,
} from '../js/repositories/python-runner.js';

test('sandbox document pins script/network origins and rejects malformed runtime addresses', () => {
  const html = runnerFrame('abc-123');
  assert.match(html, /default-src 'none'/);
  assert.match(html, /connect-src https:\/\/cdn.jsdelivr.net\/pyodide\/v314.0.7\/full\//);
  assert.match(html, /worker-src blob:/);
  for (const url of [
    'file:///tmp/',
    'https://user:password@example.com/',
    'https://example.com/?q=x',
    'https://example.com/#x',
    'https://example.com',
  ])
    assert.throws(() => runnerFrame('a', url));
});
test('runner authenticates messages by frame and job; cancels, times out and recovers', async (t) => {
  installDOM(t);
  const runner = createPythonRunner({ timeout: 15, loadTimeout: 30 });
  const frame = () => document.querySelector('iframe');
  const send = (type, extra = {}, source = frame()?.contentWindow) => {
    const channel = frame().srcdoc.match(/teslacode-[a-z0-9-]+/)[0];
    window.dispatchEvent(
      new window.MessageEvent('message', { source, data: { channel, type, ...extra } }),
    );
  };
  const job = { code: 'print(1)', cases: [{ name: 'one', stdout: '1\n' }] };
  await assert.rejects(runner.run({ code: '', cases: [] }), /Escribe/);
  await assert.rejects(runner.run({ code: 'x', cases: [] }), /casos/);
  const statuses = [],
    success = runner.run(job, (s) => statuses.push(s));
  assert.equal(frame().getAttribute('sandbox'), 'allow-scripts');
  send('result', { result: { results: [] } }, window);
  assert.ok(frame());
  t.mock.method(frame().contentWindow, 'postMessage', () => {});
  send('frame-ready');
  send('running');
  send('result', { result: { version: '3.14.2', results: [{ passed: true }] } });
  assert.equal((await success).results[0].passed, true);
  assert.deepEqual(statuses, ['loading', 'running']);
  assert.equal(frame(), null);
  const outputs = [];
  const stream = runner.run(
    { ...job, mode: 'run' },
    () => {},
    (text) => outputs.push(text),
  );
  send('output', { output: 'ignored' }, window);
  send('output', { output: null });
  send('output', { output: 'x'.repeat(7000) });
  send('result', { result: { results: [{ stdout: 'ok' }] } });
  await stream;
  assert.deepEqual(
    outputs.map((text) => text.length),
    [6000],
  );
  const invalid = runner.run(job);
  send('result', { result: { results: [] } });
  await assert.rejects(invalid, /incompleta/);
  const error = runner.run(job);
  send('error');
  await assert.rejects(error, /cargar Python/);
  const custom = runner.run(job);
  send('error', { message: 'falló' });
  await assert.rejects(custom, /falló/);
  const stopped = runner.run(job);
  runner.cancel();
  await assert.rejects(stopped, /detenida/);
  const replaced = runner.run(job),
    second = runner.run(job);
  await assert.rejects(replaced, /detenida/);
  runner.dispose();
  await assert.rejects(second, /detenida/);
  const timeout = runner.run(job);
  send('running');
  await assert.rejects(timeout, /agotó el tiempo/);
  await assert.rejects(runner.run(job), /descargar Python/);
  const broken = createPythonRunner({ indexURL: 'file:///tmp/' });
  await assert.rejects(broken.run(job), /dirección/);
  runner.dispose();
});
test('isolated frame forwards one authorized job and worker results', (t) => {
  installDOM(t);
  const messages = [],
    workers = [];
  const savedParent = Object.getOwnPropertyDescriptor(globalThis, 'parent');
  const savedWorker = Object.getOwnPropertyDescriptor(globalThis, 'Worker');
  Object.defineProperty(globalThis, 'parent', { configurable: true, value: window });
  Object.defineProperty(globalThis, 'Worker', {
    configurable: true,
    value: class {
      constructor() {
        workers.push(this);
      }
      postMessage(data) {
        this.job = data;
      }
    },
  });
  t.after(() => {
    if (savedParent) Object.defineProperty(globalThis, 'parent', savedParent);
    else delete globalThis.parent;
    if (savedWorker) Object.defineProperty(globalThis, 'Worker', savedWorker);
    else delete globalThis.Worker;
  });
  t.mock.method(window, 'postMessage', (m) => messages.push(m));
  t.mock.method(URL, 'createObjectURL', () => 'blob:test');
  t.mock.method(URL, 'revokeObjectURL', () => {});
  frameBootstrap('channel', 'worker source');
  assert.equal(messages[0].type, 'frame-ready');
  window.dispatchEvent(
    new window.MessageEvent('message', { source: window, data: { channel: 'wrong' } }),
  );
  assert.equal(workers.length, 0);
  window.dispatchEvent(
    new window.MessageEvent('message', {
      source: window,
      data: { channel: 'channel', payload: { code: 'x' } },
    }),
  );
  assert.deepEqual(workers[0].job, { code: 'x' });
  workers[0].onmessage({ data: { type: 'running' } });
  workers[0].onerror({ message: 'failure' });
  workers[0].onerror({});
  assert.equal(messages[1].type, 'running');
  assert.match(messages[2].message, /failure/);
  window.dispatchEvent(
    new window.MessageEvent('message', { source: window, data: { channel: 'channel' } }),
  );
  assert.equal(workers.length, 1);
});
test('worker adapter invokes the shared grader and reports initialization failures', async (t) => {
  const messages = [],
    calls = [];
  const saved = Object.getOwnPropertyDescriptor(globalThis, 'self');
  Object.defineProperty(globalThis, 'self', {
    configurable: true,
    value: { postMessage: (m) => messages.push(m) },
  });
  t.after(() => {
    if (saved) Object.defineProperty(globalThis, 'self', saved);
    else delete globalThis.self;
  });
  await workerBootstrap(async () => ({
    loadPyodide: async (options) => {
      options.stdout();
      options.stderr();
      return {
        globals: { set: (...args) => calls.push(args) },
        runPython: (source) => {
          calls.push(source);
          return '{"results":[{"passed":true}],"version":"3.14.2"}';
        },
      };
    },
  }));
  await self.onmessage({
    data: { indexURL: 'https://example.com/', harness: 'grader', job: { code: 'pass' } },
  });
  assert.equal(messages[0].type, 'running');
  assert.equal(messages[1].result.results[0].passed, true);
  assert.equal(calls[0], 'grader');
  const emit = calls.find((call) => Array.isArray(call) && call[0] === '_console_emit')[1];
  emit('x'.repeat(7000));
  emit('throttled');
  assert.equal(messages.filter((m) => m.type === 'output').length, 1);
  assert.equal(messages.at(-1).output.length, 6000);
  await workerBootstrap(async () => {
    throw Error('network unavailable');
  });
  await self.onmessage({ data: { indexURL: 'https://example.com/' } });
  assert.match(messages.at(-1).message, /network unavailable/);
});
