import { TutorError, readInput, publicError } from './protocol.mjs';
import { selectKnowledge } from './knowledge.mjs';
import { createQuota, quotaConfig, production } from './quota.mjs';
import { modelConfig, openGemini, geminiEvents } from './gemini.mjs';

function allowedOrigin(request, env) {
  const origin = request.headers.get('origin');
  const allowed = (env.TUTOR_ALLOWED_ORIGINS || '')
    .split(',')
    .map((value) => value.trim())
    .filter(Boolean);
  for (const domain of [env.VERCEL_URL, env.VERCEL_PROJECT_PRODUCTION_URL])
    if (domain) allowed.push(`https://${domain}`);
  if (!production(env)) {
    const url = new URL(request.url);
    if (['localhost', '127.0.0.1', '[::1]'].includes(url.hostname))
      for (const host of ['localhost', '127.0.0.1', '[::1]'])
        allowed.push(`${url.protocol}//${host}${url.port ? ':' + url.port : ''}`);
  }
  if (!origin || !allowed.includes(origin))
    throw new TutorError(403, 'origin_denied', 'Esta conexión no está autorizada para el tutor.');
  return origin;
}
export function tutorReady(env) {
  try {
    modelConfig(env);
    quotaConfig(env);
    return true;
  } catch {
    return false;
  }
}
export function createTutorHandler({
  env = process.env,
  fetcher = fetch,
  catalog,
  reserve = createQuota(env, fetcher),
  timeoutMs = 28000,
} = {}) {
  return async function handle(request) {
    const headers = {
      'Cache-Control': 'no-store',
      'X-Content-Type-Options': 'nosniff',
      Vary: 'Origin',
    };
    const json = (data, status) => Response.json(data, { status, headers });
    let timer, controller;
    try {
      // Same-origin GET fetches need not carry Origin. Readiness is public and contains no secrets.
      if (request.method === 'GET' && !request.headers.has('origin'))
        return json({ ready: tutorReady(env) }, 200);
      const origin = allowedOrigin(request, env);
      headers['Access-Control-Allow-Origin'] = origin;
      headers['Access-Control-Allow-Methods'] = 'GET, POST, OPTIONS';
      headers['Access-Control-Allow-Headers'] = 'Content-Type';
      if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers });
      if (!['GET', 'POST'].includes(request.method)) {
        headers.Allow = 'GET, POST, OPTIONS';
        throw new TutorError(405, 'method_not_allowed', 'Esta operación no está disponible.');
      }
      if (request.method === 'GET') return json({ ready: tutorReady(env) }, 200);
      if (!tutorReady(env))
        throw new TutorError(
          503,
          'not_configured',
          'El tutor de IA todavía no está conectado. Puedes continuar con las lecciones.',
        );
      const input = await readInput(request),
        context = selectKnowledge(input, catalog);
      // Vercel overwrites x-forwarded-for. The local adapter sets it from the socket.
      const ip = request.headers.get('x-forwarded-for')?.split(',')[0].trim();
      if (!ip || !/^[a-f0-9.:]{3,64}$/i.test(ip))
        throw new TutorError(
          503,
          'identity_unavailable',
          'No se pudo preparar esta consulta. Intenta nuevamente.',
        );
      await reserve(ip);
      controller = new AbortController();
      const signal = AbortSignal.any([request.signal, controller.signal]);
      timer = setTimeout(
        () => controller.abort(new DOMException('Tutor timeout', 'TimeoutError')),
        timeoutMs,
      );
      const upstream = await openGemini(input, context, env, signal, fetcher);
      const encoder = new TextEncoder();
      let cancelled = false;
      const body = new ReadableStream({
        async start(stream) {
          const send = (value) => {
            if (!cancelled) stream.enqueue(encoder.encode(`data: ${JSON.stringify(value)}\n\n`));
          };
          try {
            send({ type: 'meta', sources: context.sources });
            for await (const event of geminiEvents(upstream, signal)) send(event);
          } catch (error) {
            if (!cancelled) {
              const safe =
                controller.signal.reason?.name === 'TimeoutError'
                  ? new TutorError(504, 'timeout', 'El tutor tardó demasiado. Intenta nuevamente.')
                  : publicError(error);
              send({ type: 'error', code: safe.code, message: safe.message });
            }
          } finally {
            clearTimeout(timer);
            if (!cancelled) stream.close();
          }
        },
        cancel() {
          cancelled = true;
          clearTimeout(timer);
          controller.abort();
        },
      });
      return new Response(body, {
        headers: {
          ...headers,
          'Content-Type': 'text/event-stream; charset=utf-8',
          'X-Accel-Buffering': 'no',
        },
      });
    } catch (error) {
      clearTimeout(timer);
      const safe =
        controller?.signal.reason?.name === 'TimeoutError'
          ? new TutorError(504, 'timeout', 'El tutor tardó demasiado. Intenta nuevamente.')
          : publicError(error);
      if (safe.retryAfter) headers['Retry-After'] = String(safe.retryAfter);
      return json({ error: { code: safe.code, message: safe.message } }, safe.status);
    }
  };
}
