import { getJson } from './content-repository.js';

export class TutorClientError extends Error {
  constructor(code, message, retryAfter = 0) {
    super(message);
    Object.assign(this, { code, retryAfter });
  }
}
export async function tutorEndpoint(base = document.baseURI) {
  const config = await getJson('content/tutor-config.json');
  return resolveTutorEndpoint(config, base);
}
export function resolveTutorEndpoint(config, base) {
  if (typeof config?.endpoint !== 'string' || !config.endpoint || config.endpoint.length > 300)
    throw new TutorClientError('configuration', 'El tutor todavía no está conectado.');
  const url = new URL(config.endpoint, base);
  if (
    url.username ||
    url.password ||
    url.hash ||
    (url.protocol !== 'https:' &&
      !(url.protocol === 'http:' && ['localhost', '127.0.0.1', '[::1]'].includes(url.hostname)))
  )
    throw new TutorClientError('configuration', 'La dirección del tutor no es válida.');
  return url.href;
}
async function fetchTutor(endpoint, options, fetcher) {
  try {
    return await fetcher(endpoint, options);
  } catch {
    if (options.signal?.aborted) throw options.signal.reason;
    throw new TutorClientError(
      'connection',
      'No se pudo conectar con el tutor. Revisa tu conexión e intenta nuevamente.',
    );
  }
}
export async function tutorHealth(endpoint, { signal, fetcher = fetch } = {}) {
  const response = await fetchTutor(
    endpoint,
    { signal, credentials: 'omit', cache: 'no-store', referrerPolicy: 'no-referrer' },
    fetcher,
  );
  if (!response.ok) return false;
  return (await response.json()).ready === true;
}
function eventValue(data) {
  let value;
  try {
    value = JSON.parse(data);
  } catch {
    throw new TutorClientError(
      'interrupted',
      'La respuesta se interrumpió. Puedes volver a intentarlo.',
    );
  }
  if (value?.type === 'delta' && typeof value.text === 'string' && value.text.length <= 12000)
    return value;
  if (value?.type === 'done' && typeof value.truncated === 'boolean') return value;
  if (value?.type === 'error' && typeof value.message === 'string' && value.message.length <= 500)
    throw new TutorClientError('server', value.message);
  if (
    value?.type === 'meta' &&
    Array.isArray(value.sources) &&
    value.sources.length <= 2 &&
    value.sources.every(
      (source) =>
        typeof source.title === 'string' &&
        source.title.length <= 300 &&
        typeof source.href === 'string' &&
        /^#\/leccion\/[a-z0-9-]+\/[a-z0-9-]+\/aprender$/.test(source.href),
    )
  )
    return value;
  throw new TutorClientError(
    'interrupted',
    'La respuesta no llegó en el formato esperado. Intenta nuevamente.',
  );
}
export async function* sendTutor(endpoint, payload, { signal, fetcher = fetch } = {}) {
  const response = await fetchTutor(
    endpoint,
    {
      method: 'POST',
      signal,
      credentials: 'omit',
      cache: 'no-store',
      referrerPolicy: 'no-referrer',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    },
    fetcher,
  );
  if (!response.ok) {
    let message;
    try {
      message = (await response.json()).error?.message;
    } catch {}
    throw new TutorClientError(
      response.status === 429 ? 'quota' : 'connection',
      typeof message === 'string' && message.length <= 500
        ? message
        : 'No se pudo conectar con el tutor. Intenta nuevamente.',
      Math.max(0, Number(response.headers.get('retry-after')) || 0),
    );
  }
  if (!response.headers.get('content-type')?.startsWith('text/event-stream') || !response.body)
    throw new TutorClientError(
      'interrupted',
      'No llegó una respuesta del tutor. Intenta nuevamente.',
    );
  const reader = response.body.getReader(),
    decoder = new TextDecoder();
  let buffer = '',
    size = 0,
    finished = false,
    visible = false;
  try {
    while (true) {
      signal?.throwIfAborted();
      const { value, done } = await reader.read();
      if (done) break;
      buffer = (buffer + decoder.decode(value, { stream: true })).replaceAll('\r\n', '\n');
      if (buffer.length > 20000)
        throw new TutorClientError(
          'interrupted',
          'La respuesta excedió su límite. Intenta nuevamente.',
        );
      let end;
      while ((end = buffer.indexOf('\n\n')) !== -1) {
        const block = buffer.slice(0, end);
        buffer = buffer.slice(end + 2);
        const data = block
          .split('\n')
          .filter((line) => line.startsWith('data:'))
          .map((line) => line.slice(5).trimStart())
          .join('\n');
        if (!data) continue;
        const event = eventValue(data);
        if (event.type === 'delta') {
          size += event.text.length;
          visible ||= Boolean(event.text.trim());
          if (size > 12000)
            throw new TutorClientError('interrupted', 'La respuesta excedió su límite.');
        }
        if (event.type === 'done' && !visible)
          throw new TutorClientError(
            'interrupted',
            'No llegó una respuesta del tutor. Intenta nuevamente.',
          );
        yield event;
        if (event.type === 'done') {
          finished = true;
          return;
        }
      }
    }
    if (!finished)
      throw new TutorClientError(
        'interrupted',
        'La respuesta se interrumpió. Puedes volver a intentarlo.',
      );
  } catch (error) {
    if (signal?.aborted) throw signal.reason;
    if (error instanceof TutorClientError) throw error;
    throw new TutorClientError(
      'interrupted',
      'La conexión se interrumpió. Puedes volver a intentarlo.',
    );
  } finally {
    await reader.cancel().catch(() => {});
    reader.releaseLock();
  }
}
