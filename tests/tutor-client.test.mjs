import test from 'node:test';
import assert from 'node:assert/strict';
import {
  TutorClientError,
  tutorEndpoint,
  resolveTutorEndpoint,
  tutorHealth,
  sendTutor,
} from '../js/repositories/tutor-client.js';

const frame = (value) => `data: ${JSON.stringify(value)}\n\n`;
const answer = () =>
  frame({
    type: 'meta',
    sources: [
      { title: 'Primera lección', href: '#/leccion/fundamentos/js-tu-primer-programa/aprender' },
    ],
  }) +
  frame({ type: 'delta', text: 'Hola, niño ⚡' }) +
  frame({ type: 'done', truncated: false });
const response = (body) =>
  new Response(body, { headers: { 'Content-Type': 'text/event-stream; charset=utf-8' } });
async function collect(iterator) {
  const result = [];
  for await (const value of iterator) result.push(value);
  return result;
}

test('public tutor configuration permits HTTPS and loopback development, never credentials or unsafe schemes', async (t) => {
  for (const endpoint of [
    'https://api.example/api/tutor',
    'http://localhost:3000/api/tutor',
    'http://127.0.0.1:3000/api/tutor',
    'http://[::1]:3000/api/tutor',
    '/api/tutor',
  ])
    assert.match(
      resolveTutorEndpoint({ endpoint }, 'https://school.example/Tesla-Code/'),
      /^https?:/,
    );
  for (const endpoint of [
    '',
    12,
    'javascript:alert(1)',
    'http://remote.example/api/tutor',
    'https://user:secret@example.com/api/tutor',
    'https://api.example/api/tutor#secret',
    'a'.repeat(301),
  ])
    assert.throws(
      () => resolveTutorEndpoint({ endpoint }, 'https://school.example'),
      TutorClientError,
    );
  t.mock.method(globalThis, 'fetch', async () => Response.json({ endpoint: '/api/tutor' }));
  assert.equal(
    await tutorEndpoint('https://school.example/project/'),
    'https://school.example/api/tutor',
  );
});
test('readiness makes a cache-free request without cookies and handles unavailable configuration', async () => {
  let options;
  assert.equal(
    await tutorHealth('https://api.example', {
      fetcher: async (url, opts) => {
        options = opts;
        return Response.json({ ready: true });
      },
    }),
    true,
  );
  assert.equal(options.credentials, 'omit');
  assert.equal(options.cache, 'no-store');
  assert.equal(options.referrerPolicy, 'no-referrer');
  assert.equal(
    await tutorHealth('x', { fetcher: async () => new Response('Not found', { status: 404 }) }),
    false,
  );
  assert.equal(await tutorHealth('x', { fetcher: async () => Response.json({}) }), false);
});
test('streaming tutor responses survive split Unicode and validate trusted lesson references', async () => {
  const bytes = new TextEncoder().encode(answer().replaceAll('\n', '\r\n'));
  const body = new ReadableStream({
    start(controller) {
      for (const byte of bytes) controller.enqueue(Uint8Array.of(byte));
      controller.close();
    },
  });
  let sent;
  const events = await collect(
    sendTutor(
      'https://api.example',
      { message: 'Hola' },
      {
        fetcher: async (url, options) => {
          sent = options;
          return response(body);
        },
      },
    ),
  );
  assert.equal(events[1].text, 'Hola, niño ⚡');
  assert.equal(events.at(-1).type, 'done');
  assert.equal(sent.credentials, 'omit');
  assert.equal(JSON.parse(sent.body).message, 'Hola');
  const comments = ':keepalive\n\n' + answer();
  assert.equal(
    (await collect(sendTutor('x', {}, { fetcher: async () => response(comments) }))).length,
    3,
  );
});
test('the client refuses malformed, oversized, forged-source and prematurely interrupted answers', async () => {
  const invalid = [
    'data: bad\n\n',
    frame({ type: 'meta', sources: [{ title: 'X', href: 'javascript:alert(1)' }] }),
    frame({ type: 'unknown' }),
    frame({ type: 'delta', text: 12 }),
    frame({ type: 'done', truncated: 'no' }),
    frame({ type: 'done', truncated: false }),
    frame({ type: 'delta', text: '   ' }) + frame({ type: 'done', truncated: false }),
    frame({ type: 'error', message: 'El proveedor está ocupado.' }),
    frame({ type: 'delta', text: 'partial' }),
    frame({ type: 'delta', text: 'a'.repeat(12001) }),
    'x'.repeat(20001),
    frame({ type: 'delta', text: 'x'.repeat(7000) }) +
      frame({ type: 'delta', text: 'y'.repeat(6000) }),
  ];
  for (const body of invalid)
    await assert.rejects(
      collect(sendTutor('x', {}, { fetcher: async () => response(body) })),
      TutorClientError,
    );
  await assert.rejects(
    collect(sendTutor('x', {}, { fetcher: async () => new Response('not a stream') })),
    TutorClientError,
  );
  for (const body of [null])
    await assert.rejects(
      collect(sendTutor('x', {}, { fetcher: async () => response(body) })),
      TutorClientError,
    );
  const aborted = new AbortController();
  aborted.abort();
  await assert.rejects(
    collect(
      sendTutor('x', {}, { signal: aborted.signal, fetcher: async () => response(answer()) }),
    ),
    { name: 'AbortError' },
  );
});
test('quota errors carry retry guidance and unsafe or non-JSON error bodies are replaced', async () => {
  await assert.rejects(
    collect(
      sendTutor(
        'x',
        {},
        {
          fetcher: async () => {
            throw new TypeError('Failed to fetch');
          },
        },
      ),
    ),
    (error) =>
      error instanceof TutorClientError &&
      error.code === 'connection' &&
      error.message.includes('Revisa tu conexión'),
  );
  await assert.rejects(
    collect(
      sendTutor(
        'x',
        {},
        {
          fetcher: async () =>
            response(
              new ReadableStream({
                start(controller) {
                  controller.error(Error('terminated'));
                },
              }),
            ),
        },
      ),
    ),
    (error) => error instanceof TutorClientError && error.code === 'interrupted',
  );
  const cancel = new AbortController();
  cancel.abort();
  await assert.rejects(
    collect(
      sendTutor(
        'x',
        {},
        {
          signal: cancel.signal,
          fetcher: async () => {
            throw cancel.signal.reason;
          },
        },
      ),
    ),
    { name: 'AbortError' },
  );
  await assert.rejects(
    collect(
      sendTutor(
        'x',
        {},
        {
          fetcher: async () =>
            Response.json(
              { error: { message: 'Espera un momento.' } },
              { status: 429, headers: { 'Retry-After': '60' } },
            ),
        },
      ),
    ),
    (error) =>
      error.code === 'quota' && error.retryAfter === 60 && error.message === 'Espera un momento.',
  );
  for (const body of [
    '<html>server error</html>',
    JSON.stringify({ error: { message: 'a'.repeat(501) } }),
  ])
    await assert.rejects(
      collect(sendTutor('x', {}, { fetcher: async () => new Response(body, { status: 503 }) })),
      (error) => error instanceof TutorClientError && error.message.includes('conectar'),
    );
});
