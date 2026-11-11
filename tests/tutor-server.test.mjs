import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, mkdtempSync, mkdirSync, writeFileSync, existsSync, rmSync } from 'node:fs';
import { join, basename } from 'node:path';
import { tmpdir } from 'node:os';
import {
  LIMITS,
  TutorError,
  validateInput,
  readInput,
  readSSE,
  publicError,
} from '../server/tutor/protocol.mjs';
import { createQuota, quotaConfig, QUOTA_SCRIPT } from '../server/tutor/quota.mjs';
import { selectKnowledge, tutorPrompt } from '../server/tutor/knowledge.mjs';
import { openGemini, geminiEvents, modelConfig } from '../server/tutor/gemini.mjs';
import { createTutorHandler, tutorReady } from '../server/tutor/handler.mjs';
import api from '../api/tutor.mjs';
import { tutorKnowledge, buildTutorKnowledge } from '../tools/build-tutor-knowledge.mjs';
import { buildSite, PUBLIC_FILES } from '../tools/build-site.mjs';

const secret = 'TEST-GEMINI-KEY-MUST-NEVER-REACH-THE-CLIENT';
const env = () => ({ GEMINI_API_KEY: secret, TUTOR_ALLOWED_ORIGINS: 'https://academy.example' });
const input = (changes = {}) => ({
  message: '¿Qué es una instrucción?',
  mode: 'explain',
  history: [],
  context: { route: 'fundamentos', lesson: 'js-tu-primer-programa' },
  ...changes,
});
function request(
  body = input(),
  method = 'POST',
  origin = 'https://academy.example',
  headers = {},
) {
  return new Request('https://service.example/api/tutor', {
    method,
    headers: {
      ...(origin ? { Origin: origin } : {}),
      'Content-Type': 'application/json',
      'x-forwarded-for': '203.0.113.7',
      ...headers,
    },
    ...(['GET', 'OPTIONS', 'PUT'].includes(method) ? {} : { body: JSON.stringify(body) }),
  });
}
const frame = (value) => `data: ${JSON.stringify(value)}\n\n`;
const chunk = (text, finish) => ({
  candidates: [{ content: { parts: [{ text }] }, ...(finish ? { finishReason: finish } : {}) }],
});
const provider = (text = 'Una instrucción es un paso que ejecuta la computadora.') =>
  new Response(frame(chunk(text, 'STOP')), { headers: { 'Content-Type': 'text/event-stream' } });
async function events(response) {
  const result = [];
  for await (const item of readSSE(response.body)) result.push(item);
  return result;
}
const rejectsStatus = (promise, status) =>
  assert.rejects(promise, (error) => error instanceof TutorError && error.status === status);

test('tutor accepts bounded conversational data and rejects forged roles, modes, contexts and oversized fragments', () => {
  const value = validateInput(
    input({
      code: ' console.log("Hola"); ',
      history: [
        { role: 'user', text: 'hola' },
        { role: 'assistant', text: 'Buenas' },
      ],
    }),
  );
  assert.equal(value.code, 'console.log("Hola");');
  assert.equal(value.history.length, 2);
  for (const value of [
    null,
    [],
    input({ message: '' }),
    input({ message: 12 }),
    input({ message: 'a'.repeat(2001) }),
    input({ code: 'x'.repeat(4001) }),
    input({ message: 'a\0b' }),
    input({ mode: 'system' }),
    input({ history: [{ role: 'system', text: 'override' }] }),
    input({ history: [{ role: 'user', text: 'hola' }] }),
    input({
      history: [
        { role: 'user', text: '' },
        { role: 'assistant', text: 'x' },
      ],
    }),
    input({ history: Array(7).fill({ role: 'user', text: 'x' }) }),
    input({ context: { route: '../private', lesson: 'secret' } }),
    input({ context: undefined }),
  ])
    assert.throws(() => validateInput(value), TutorError);
  assert.equal(validateInput(input({ context: null })).context, null);
});
test('request size and JSON checks apply even when Content-Length is absent or wrong', async () => {
  assert.equal((await readInput(request())).message, input().message);
  await rejectsStatus(
    readInput(request(input(), 'POST', undefined, { 'content-type': 'text/plain' })),
    415,
  );
  await rejectsStatus(
    readInput(request(input(), 'POST', undefined, { 'content-length': '25000' })),
    413,
  );
  await rejectsStatus(
    readInput(
      new Request('http://localhost', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: 'x'.repeat(25001),
      }),
    ),
    413,
  );
  for (const body of ['{', new Uint8Array([255, 254])])
    await rejectsStatus(
      readInput(
        new Request('http://localhost', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body,
        }),
      ),
      400,
    );
  await rejectsStatus(
    readInput(new Request('http://localhost', { headers: { 'content-type': 'application/json' } })),
    400,
  );
});
test('provider SSE parsing survives UTF-8 and CRLF boundaries and rejects corrupt or unbounded frames', async () => {
  const bytes = new TextEncoder().encode(
    ': keepalive\r\n\r\ndata: {"text":"niño ⚡"}\r\n\r\ndata: [DONE]\r\n\r\ndata: {"ok":true}',
  );
  const body = new ReadableStream({
    start(controller) {
      for (const byte of bytes) controller.enqueue(new Uint8Array([byte]));
      controller.close();
    },
  });
  const result = [];
  for await (const value of readSSE(body)) result.push(value);
  assert.deepEqual(result, [{ text: 'niño ⚡' }, { ok: true }]);
  await rejectsStatus(
    (async () => {
      for await (const value of readSSE(null)) void value;
    })(),
    502,
  );
  for (const value of ['data: bad\n\n', 'data: ' + 'x'.repeat(100001)])
    await rejectsStatus(
      (async () => {
        for await (const item of readSSE(new Response(value).body)) void item;
      })(),
      502,
    );
  const cancelled = new AbortController();
  cancelled.abort();
  await assert.rejects(
    async () => {
      for await (const item of readSSE(new Response('{}').body, cancelled.signal)) void item;
    },
    { name: 'AbortError' },
  );
  assert.equal(publicError(Error(secret)).message.includes(secret), false);
  const known = new TutorError(429, 'quota', 'Espera', 4);
  assert.equal(publicError(known), known);
});
test('local quota reserves requests atomically, enforces minute/IP/day/global caps and expires counters', async () => {
  let now = Date.UTC(2026, 10, 10, 12);
  const reserve = createQuota(
    { TUTOR_PER_MINUTE: '2', TUTOR_PER_IP_DAY: '3', TUTOR_GLOBAL_DAY: '4' },
    undefined,
    () => now,
  );
  await Promise.all([reserve('a'), reserve('a')]);
  await rejectsStatus(reserve('a'), 429);
  now += 62000;
  await reserve('a');
  await rejectsStatus(reserve('a'), 429);
  await reserve('b');
  await rejectsStatus(reserve('c'), 429);
  now += 86400000;
  await reserve('a');
  assert.equal(quotaConfig({}).remote, false);
  for (const value of [
    { VERCEL: '1' },
    { NODE_ENV: 'production' },
    { TUTOR_GLOBAL_DAY: '0' },
    { TUTOR_GLOBAL_DAY: '1.5' },
    { TUTOR_PER_MINUTE: '999999' },
  ])
    assert.throws(() => quotaConfig(value));
});
test('shared quota uses one atomic Redis command, daily HMAC identity and closed failure behavior', async () => {
  const remote = {
    VERCEL: '1',
    UPSTASH_REDIS_REST_URL: 'https://quota.upstash.io',
    UPSTASH_REDIS_REST_TOKEN: 'PRIVATE-REDIS-TOKEN',
    TUTOR_IP_HASH_SECRET: 'x'.repeat(40),
  };
  let recorded;
  await createQuota(remote, async (url, options) => {
    recorded = { url, options };
    return Response.json({ result: [0, 0] });
  })('203.0.113.7');
  const command = JSON.parse(recorded.options.body);
  assert.equal(command[0], 'EVAL');
  assert.equal(command[1], QUOTA_SCRIPT);
  assert.equal(command[2], '3');
  assert.equal(command.length, 12);
  assert.ok(!recorded.options.body.includes('203.0.113.7'));
  assert.equal(recorded.options.headers.Authorization, 'Bearer PRIVATE-REDIS-TOKEN');
  for (const result of [
    [1, 20],
    [2, 3600],
    [3, 86400],
  ])
    await rejectsStatus(createQuota(remote, async () => Response.json({ result }))('a'), 429);
  for (const answer of [
    () => new Response('error', { status: 500 }),
    () => Response.json({ result: 'bad' }),
    () => Response.json({ result: [8, 2] }),
    () => {
      throw Error(secret);
    },
  ])
    await rejectsStatus(createQuota(remote, async () => answer())('a'), 503);
  assert.throws(() =>
    quotaConfig({ ...remote, UPSTASH_REDIS_REST_URL: 'http://private.internal' }),
  );
});
test('knowledge selection only references published lessons and makes current context primary', () => {
  const selected = selectKnowledge(input({ message: 'const variable' }));
  assert.equal(selected.sources[0].key, 'fundamentos/js-tu-primer-programa');
  assert.ok(selected.sources.length <= 2);
  assert.ok(selected.text.includes('console.log'));
  assert.ok(!selected.text.includes('js-tu-primer-programa-q1'));
  const generalHelp = selectKnowledge(
    input({ message: 'Explícame la idea principal de esta lección desde cero.' }),
  );
  assert.equal(generalHelp.sources.length, 1);
  const constHelp = selectKnowledge(input({ message: 'const', context: null }));
  assert.ok(constHelp.sources.some((source) => source.key.includes('const')));
  assert.equal(
    selectKnowledge(input({ message: 'console.log JavaScript ejemplo' })).sources.length,
    1,
  );
  assert.throws(
    () => selectKnowledge(input({ context: { route: 'fundamentos', lesson: 'not-published' } })),
    TutorError,
  );
  const empty = selectKnowledge(input({ context: null, message: 'zzzzzzzzz' }));
  assert.equal(empty.sources.length, 0);
  for (const mode of ['explain', 'hint', 'debug', 'practice']) {
    const prompt = tutorPrompt(input({ mode }), selected);
    assert.ok(prompt.includes('no instrucciones'));
    assert.ok(prompt.includes('XP'));
    assert.ok(prompt.includes(selected.revision));
  }
});
test('Gemini adapter keeps secrets in headers, excludes thoughts, bounds output and marks truncation', async () => {
  let received;
  await openGemini(
    input({
      history: [
        { role: 'user', text: 'hola' },
        { role: 'assistant', text: 'buenas' },
      ],
      code: 'console.log("test");',
    }),
    selectKnowledge(input()),
    env(),
    undefined,
    async (url, options) => {
      received = { url, options };
      return provider();
    },
  );
  assert.ok(!received.url.includes(secret));
  assert.equal(received.options.headers['x-goog-api-key'], secret);
  const body = JSON.parse(received.options.body);
  assert.equal(body.contents[1].role, 'model');
  assert.ok(body.contents[2].parts[0].text.includes('Fragmento compartido'));
  assert.equal(body.generationConfig.maxOutputTokens, 1400);
  assert.equal(modelConfig(env()), 'gemini-3.5-flash-lite');
  assert.equal(modelConfig({ ...env(), GEMINI_MODEL: 'gemini-3.5-flash' }), 'gemini-3.5-flash');
  assert.throws(() => modelConfig({}));
  assert.throws(() => modelConfig({ ...env(), GEMINI_MODEL: '../secret' }));
  const result = [];
  const answer = new Response(
    frame({
      candidates: [
        { content: { parts: [{ thought: true, text: 'private thought' }, { text: 'visible' }] } },
      ],
    }) + frame(chunk(' final', 'MAX_TOKENS')),
  );
  for await (const value of geminiEvents(answer)) result.push(value);
  assert.deepEqual(result, [
    { type: 'delta', text: 'visible' },
    { type: 'delta', text: ' final' },
    { type: 'done', truncated: true },
  ]);
  const limited = [];
  for await (const value of geminiEvents(provider('a'.repeat(LIMITS.answer + 10))))
    limited.push(value);
  assert.equal(limited[0].text.length, LIMITS.answer);
  assert.equal(limited.at(-1).truncated, true);
});
test('provider failures and interrupted streams never disclose upstream bodies or partial answers as complete', async () => {
  for (const status of [400, 401, 403, 429, 500])
    await rejectsStatus(
      openGemini(
        input(),
        selectKnowledge(input()),
        env(),
        undefined,
        async () => new Response(secret, { status }),
      ),
      status === 429 ? 429 : 503,
    );
  for (const value of [
    { error: { message: secret } },
    { promptFeedback: { blockReason: 'SAFETY' } },
    { candidates: [{ finishReason: 'SAFETY' }] },
    chunk('partial'),
    chunk('   ', 'STOP'),
    {},
  ]) {
    await assert.rejects(async () => {
      for await (const item of geminiEvents(new Response(frame(value)))) void item;
    }, TutorError);
  }
});
test('HTTP tutor handles preflight, public readiness, origin allowlist and unsupported methods without provider calls', async () => {
  const handle = createTutorHandler({
    env: env(),
    fetcher: async () => {
      throw Error('must not call');
    },
  });
  assert.equal((await handle(request(undefined, 'OPTIONS'))).status, 204);
  assert.equal((await handle(request(undefined, 'PUT'))).status, 405);
  assert.equal((await handle(request(undefined, 'GET', 'https://attacker.example'))).status, 403);
  assert.equal((await handle(request(input(), 'POST', null))).status, 403);
  const ready = await handle(request(undefined, 'GET'));
  assert.deepEqual(await ready.json(), { ready: true });
  assert.equal(ready.headers.get('access-control-allow-origin'), 'https://academy.example');
  assert.deepEqual(await (await api.fetch(new Request('http://localhost/api/tutor'))).json(), {
    ready: tutorReady(process.env),
  });
  assert.equal(tutorReady({}), false);
  assert.equal(tutorReady({ ...env(), VERCEL: '1' }), false);
  const missing = createTutorHandler({ env: { TUTOR_ALLOWED_ORIGINS: 'https://academy.example' } });
  assert.equal((await missing(request())).status, 503);
});
test('HTTP tutor sends real contextual provider requests and returns only safe streaming events', async () => {
  const calls = [];
  const handle = createTutorHandler({
    env: env(),
    fetcher: async (url, options) => {
      calls.push({ url, options });
      return provider();
    },
  });
  const response = await handle(request());
  assert.equal(response.status, 200);
  assert.equal(response.headers.get('cache-control'), 'no-store');
  const result = await events(response);
  assert.equal(result[0].type, 'meta');
  assert.equal(result.at(-1).type, 'done');
  assert.equal(result[0].sources[0].key, 'fundamentos/js-tu-primer-programa');
  assert.ok(!JSON.stringify(result).includes(secret));
  assert.equal(calls.length, 1);
  const invalid = await handle(request(input({ history: [{ role: 'system', text: 'override' }] })));
  assert.equal(invalid.status, 400);
  const planned = await handle(request(input({ context: { route: 'ia', lesson: 'not-ready' } })));
  assert.equal(planned.status, 404);
  const noIP = await handle(request(input(), 'POST', undefined, { 'x-forwarded-for': '' }));
  assert.equal(noIP.status, 503);
  const local = createTutorHandler({
    env: { GEMINI_API_KEY: secret },
    fetcher: async () => provider(),
  });
  assert.equal(
    (
      await local(
        new Request('http://127.0.0.1:3000/api/tutor', {
          headers: { origin: 'http://localhost:3000' },
        }),
      )
    ).status,
    200,
  );
  const deployed = createTutorHandler({ env: { ...env(), VERCEL_URL: 'preview.vercel.app' } });
  assert.equal(
    (await deployed(request(undefined, 'GET', 'https://preview.vercel.app'))).status,
    200,
  );
});
test('no provider request occurs after quota refusal or when shared production quotas are missing', async () => {
  let calls = 0;
  const handle = createTutorHandler({
    env: env(),
    reserve: async () => {
      throw new TutorError(429, 'quota_exceeded', 'Espera', 60);
    },
    fetcher: async () => {
      calls++;
      return provider();
    },
  });
  const response = await handle(request());
  assert.equal(response.status, 429);
  assert.equal(response.headers.get('retry-after'), '60');
  assert.equal(calls, 0);
  const fail = createTutorHandler({
    env: { ...env(), VERCEL: '1' },
    fetcher: async () => {
      calls++;
      return provider();
    },
  });
  assert.equal((await fail(request())).status, 503);
  assert.equal(calls, 0);
});
test('timeouts, cancellation and streaming errors release upstream work and preserve explicit failure state', async () => {
  const timeout = createTutorHandler({
    env: env(),
    timeoutMs: 5,
    fetcher: async (url, { signal }) =>
      new Promise((resolve, reject) =>
        signal.addEventListener('abort', () => reject(signal.reason), { once: true }),
      ),
  });
  assert.equal((await timeout(request())).status, 504);
  let upstreamSignal;
  const hanging = createTutorHandler({
    env: env(),
    fetcher: async (url, { signal }) => {
      upstreamSignal = signal;
      return new Response(
        new ReadableStream({
          start(controller) {
            signal.addEventListener('abort', () => controller.error(signal.reason), { once: true });
          },
        }),
      );
    },
  });
  const response = await hanging(request());
  await response.body.cancel();
  assert.equal(upstreamSignal.aborted, true);
  const interrupted = createTutorHandler({
    env: env(),
    fetcher: async () => new Response(frame(chunk('partial'))),
  });
  const result = await events(await interrupted(request()));
  assert.equal(result.at(-1).type, 'error');
  assert.ok(!result.some((value) => value.type === 'done'));
  const boom = createTutorHandler({
    env: env(),
    fetcher: async () => {
      throw Error(secret);
    },
  });
  const error = await boom(request());
  assert.equal(error.status, 503);
  assert.ok(!(await error.text()).includes(secret));
});
test('public build and generated knowledge exclude private files, evaluation answers and exercise solutions', (t) => {
  const root = mkdtempSync(join(tmpdir(), 'tesla-tutor-build-'));
  t.after(() => {
    assert.ok(basename(root).startsWith('tesla-tutor-build-'));
    rmSync(root, { recursive: true, force: true });
  });
  for (const directory of [
    'js',
    'css',
    'content/curriculum',
    'content/lessons/demo',
    'assets',
    'server/tutor',
    'api',
  ])
    mkdirSync(join(root, directory), { recursive: true });
  writeFileSync(join(root, 'index.html'), '<h1>Tesla</h1>');
  writeFileSync(join(root, '.env.local'), secret);
  writeFileSync(join(root, 'api/private.mjs'), secret);
  writeFileSync(join(root, 'content/curriculum/index.json'), JSON.stringify({ routes: ['demo'] }));
  writeFileSync(
    join(root, 'content/curriculum/demo.json'),
    JSON.stringify({
      id: 'demo',
      name: 'Demo',
      levels: [
        {
          id: 'first',
          name: 'Primero',
          lessons: [{ id: 'hello', status: 'published', title: 'Hola', concepts: ['hello'] }],
        },
      ],
    }),
  );
  writeFileSync(
    join(root, 'content/lessons/demo/hello.json'),
    JSON.stringify({
      html: '<h3>Hola</h3><p>Explicación de cero.</p><script>PRIVATE-SCRIPT</script>',
      outcome: 'Comprender',
      quiz: [{ answer: 'PRIVATE-ANSWER' }],
      activities: [{ solution: 'PRIVATE-SOLUTION' }],
    }),
  );
  const knowledge = tutorKnowledge(root);
  assert.equal(knowledge.lessons.length, 1);
  assert.ok(!JSON.stringify(knowledge).includes('PRIVATE-'));
  buildTutorKnowledge(root);
  buildTutorKnowledge(root, true);
  writeFileSync(join(root, 'server/tutor/knowledge-data.json'), '{}');
  assert.throws(() => buildTutorKnowledge(root, true));
  const output = buildSite(root);
  assert.ok(existsSync(join(output, 'index.html')));
  assert.ok(!existsSync(join(output, '.env.local')));
  assert.ok(!existsSync(join(output, 'api')));
  assert.ok(!existsSync(join(output, 'server')));
  writeFileSync(join(output, 'obsolete.txt'), 'old');
  buildSite(root);
  assert.ok(!existsSync(join(output, 'obsolete.txt')));
  assert.ok(PUBLIC_FILES.includes('content'));
});
