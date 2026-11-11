import { createTutorHandler } from '../server/tutor/handler.mjs';
import { readSSE } from '../server/tutor/protocol.mjs';

// One real provider request, only when the owner has configured a key locally.
// Never print process.env, headers, the key or an upstream error body.
if (!process.env.GEMINI_API_KEY) {
  console.log('Pendiente: guarda GEMINI_API_KEY en .env.local. No compartas la clave en el chat.');
  process.exitCode = 2;
} else {
  const diagnosticFetch = async (...args) => {
    try {
      const response = await fetch(...args);
      if (!response.ok) console.log(`Proveedor: HTTP ${response.status}.`);
      return response;
    } catch (error) {
      const code = error.cause?.code;
      console.log(
        `No se pudo establecer la conexión de red${typeof code === 'string' && /^[A-Z0-9_]+$/.test(code) ? ` (${code})` : ''}.`,
      );
      throw Error('Provider connection failed');
    }
  };
  const response = await createTutorHandler({ fetcher: diagnosticFetch })(
    new Request('http://127.0.0.1:3000/api/tutor', {
      method: 'POST',
      headers: {
        Origin: 'http://127.0.0.1:3000',
        'Content-Type': 'application/json',
        'x-forwarded-for': '127.0.0.1',
      },
      body: JSON.stringify({
        message: 'Explica en dos frases qué hace console.log y termina con una pregunta sencilla.',
        mode: 'explain',
        history: [],
        context: { route: 'fundamentos', lesson: 'js-tu-primer-programa' },
      }),
    }),
  );
  if (!response.ok) {
    const failure = await response.json();
    console.log(
      `No se completó la conexión (${response.status} / ${failure.error.code}): ${failure.error.message}`,
    );
    process.exitCode = 1;
  } else {
    let text = '',
      complete = false;
    for await (const event of readSSE(response.body)) {
      if (event.type === 'delta') text += event.text;
      if (event.type === 'done') complete = true;
      if (event.type === 'error') console.log('Consulta interrumpida: ' + event.message);
    }
    if (complete && text.trim()) console.log('✓ Respuesta real de Gemini recibida:\n' + text);
    else {
      console.log('No llegó una respuesta completa del proveedor.');
      process.exitCode = 1;
    }
  }
}
