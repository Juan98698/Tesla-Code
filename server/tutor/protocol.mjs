export const LIMITS = Object.freeze({
  requestBytes: 24000,
  message: 2000,
  code: 4000,
  historyTurns: 6,
  historyText: 1800,
  answer: 12000,
});
export const MODES = ['explain', 'hint', 'debug', 'practice'];
export class TutorError extends Error {
  constructor(status, code, message, retryAfter) {
    super(message);
    Object.assign(this, { status, code, retryAfter });
  }
}
const invalid = () => {
  throw new TutorError(400, 'invalid_request', 'Revisa tu pregunta y vuelve a intentarlo.');
};
const plain = (value) => value && typeof value === 'object' && !Array.isArray(value);
const text = (value, max) => {
  if (typeof value !== 'string' || value.length > max || value.includes('\0')) invalid();
  return value.trim();
};
export function validateInput(body) {
  if (!plain(body) || !MODES.includes(body.mode)) invalid();
  const message = text(body.message, LIMITS.message);
  if (!message) invalid();
  const code = body.code === undefined ? '' : text(body.code, LIMITS.code);
  if (!Array.isArray(body.history) || body.history.length > LIMITS.historyTurns) invalid();
  const history = body.history.map((turn, index) => {
    if (!plain(turn) || turn.role !== (index % 2 ? 'assistant' : 'user')) invalid();
    const value = text(turn.text, LIMITS.historyText);
    if (!value) invalid();
    return { role: turn.role, text: value };
  });
  if (history.length % 2) invalid();
  let context = null;
  if (body.context !== null) {
    if (
      !plain(body.context) ||
      ![body.context.route, body.context.lesson].every(
        (value) => typeof value === 'string' && /^[a-z0-9-]{1,100}$/.test(value),
      )
    )
      invalid();
    context = { route: body.context.route, lesson: body.context.lesson };
  }
  return { message, code, history, context, mode: body.mode };
}
export async function readInput(request) {
  if (
    request.headers.get('content-type')?.split(';')[0].trim().toLowerCase() !== 'application/json'
  )
    throw new TutorError(415, 'json_required', 'Envía la pregunta en formato JSON.');
  const declared = Number(request.headers.get('content-length'));
  if (declared > LIMITS.requestBytes)
    throw new TutorError(413, 'too_large', 'Reduce la pregunta o el fragmento de código.');
  const reader = request.body?.getReader();
  if (!reader) invalid();
  const chunks = [];
  let size = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > LIMITS.requestBytes) {
        await reader.cancel();
        throw new TutorError(413, 'too_large', 'Reduce la pregunta o el fragmento de código.');
      }
      chunks.push(value);
    }
  } finally {
    reader.releaseLock();
  }
  const bytes = new Uint8Array(size);
  let offset = 0;
  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.byteLength;
  }
  let value;
  try {
    value = JSON.parse(new TextDecoder('utf-8', { fatal: true }).decode(bytes));
  } catch {
    invalid();
  }
  return validateInput(value);
}
export async function* readSSE(body, signal) {
  if (!body)
    throw new TutorError(
      502,
      'provider_empty',
      'No llegó una respuesta del tutor. Intenta nuevamente.',
    );
  const reader = body.getReader(),
    decoder = new TextDecoder();
  let buffer = '';
  function parse(block) {
    const data = block
      .split('\n')
      .filter((line) => line.startsWith('data:'))
      .map((line) => line.slice(5).trimStart())
      .join('\n');
    if (!data || data === '[DONE]') return null;
    try {
      return JSON.parse(data);
    } catch {
      throw new TutorError(
        502,
        'provider_invalid',
        'La respuesta se interrumpió. Intenta nuevamente.',
      );
    }
  }
  try {
    while (true) {
      signal?.throwIfAborted();
      const { done, value } = await reader.read();
      if (done) break;
      buffer = (buffer + decoder.decode(value, { stream: true })).replaceAll('\r\n', '\n');
      if (buffer.length > 100000)
        throw new TutorError(502, 'provider_invalid', 'La respuesta excedió el límite permitido.');
      let end;
      while ((end = buffer.indexOf('\n\n')) !== -1) {
        const event = parse(buffer.slice(0, end));
        buffer = buffer.slice(end + 2);
        if (event) yield event;
      }
    }
    buffer += decoder.decode();
    if (buffer.trim()) {
      const event = parse(buffer);
      if (event) yield event;
    }
  } finally {
    await reader.cancel().catch(() => {});
    reader.releaseLock();
  }
}
export function publicError(error) {
  return error instanceof TutorError
    ? error
    : new TutorError(
        503,
        'temporarily_unavailable',
        'El tutor no está disponible en este momento. Puedes continuar con la lección.',
      );
}
