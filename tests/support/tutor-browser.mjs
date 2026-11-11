import assert from 'node:assert/strict';
import { chromium } from 'playwright';
import { createDevServer } from '../../tools/dev-server.mjs';
import { createTutorHandler } from '../../server/tutor/handler.mjs';
import { browserExecutable } from './runtime.mjs';

export async function withTutorBrowser(run) {
  const calls = [],
    failures = new Set(),
    stats = { cancelled: 0 };
  const env = {
    GEMINI_API_KEY: 'TEST-KEY-SERVER-ONLY-NOT-A-REAL-GEMINI-KEY',
    TUTOR_PER_MINUTE: '100',
    TUTOR_PER_IP_DAY: '500',
  };
  const fetcher = async (url, options) => {
    assert.match(url, /^https:\/\/generativelanguage\.googleapis\.com\/v1beta\/models\/gemini-/);
    const payload = JSON.parse(options.body),
      question = payload.contents.at(-1).parts[0].text;
    calls.push({ url, payload });
    if (question.includes('reintentar') && !failures.has(question)) {
      failures.add(question);
      return new Response('private upstream error', { status: 503 });
    }
    if (question.includes('cuota temporal')) return new Response('private quota', { status: 429 });
    const text =
      'Una instrucción es un paso que le pides a la computadora.\n\n```javascript\nconsole.log("Hola TeslaCode");\n```\n\nPredice qué aparecerá al ejecutarla. <img src=x onerror="window.tutorXss=true">';
    const chunks = question.includes('respuesta lenta')
      ? Array(500).fill('Un paso más. ')
      : text.match(/[\s\S]{1,24}/g);
    const encoder = new TextEncoder();
    let timer,
      index = 0,
      ended = false;
    const body = new ReadableStream({
      start(controller) {
        const abort = () => {
          stats.cancelled++;
          clearTimeout(timer);
          if (!ended) {
            ended = true;
            controller.error(options.signal.reason);
          }
        };
        options.signal.addEventListener('abort', abort, { once: true });
        const next = () => {
          if (ended) return;
          if (index < chunks.length)
            controller.enqueue(
              encoder.encode(
                `data: ${JSON.stringify({ candidates: [{ content: { parts: [{ text: chunks[index++] }] } }] })}\n\n`,
              ),
            );
          else {
            controller.enqueue(
              encoder.encode(
                `data: ${JSON.stringify({ candidates: [{ finishReason: 'STOP' }] })}\n\n`,
              ),
            );
            ended = true;
            options.signal.removeEventListener('abort', abort);
            controller.close();
            return;
          }
          timer = setTimeout(next, question.includes('respuesta lenta') ? 100 : 16);
        };
        next();
      },
      cancel() {
        ended = true;
        clearTimeout(timer);
      },
    });
    return new Response(body, { headers: { 'Content-Type': 'text/event-stream' } });
  };
  const server = createDevServer({ handle: createTutorHandler({ env, fetcher }) });
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  const origin = `http://127.0.0.1:${server.address().port}`;
  let browser;
  try {
    browser = await chromium.launch({
      executablePath: browserExecutable(),
      args: ['--no-sandbox'],
    });
    await run({ browser, origin, calls, env, stats });
  } finally {
    await browser?.close();
    server.closeAllConnections();
    await new Promise((resolve) => server.close(resolve));
  }
}
