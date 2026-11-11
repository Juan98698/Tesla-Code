import { modelConfig } from '../server/tutor/gemini.mjs';
import { quotaConfig } from '../server/tutor/quota.mjs';
import { tutorReady } from '../server/tutor/handler.mjs';

const env = process.env;
console.log('Tesla Tutor · diagnóstico sin mostrar secretos');
console.log('Clave Gemini: ' + (env.GEMINI_API_KEY ? 'configurada' : 'falta en .env.local'));
try {
  modelConfig(env);
  console.log('Configuración del modelo: válida');
} catch {
  console.log('Configuración del modelo: revisar GEMINI_API_KEY / GEMINI_MODEL');
}
console.log(
  'Configuración local: ' +
    (tutorReady({ ...env, VERCEL: '0', NODE_ENV: 'development' }) ? 'lista' : 'incompleta'),
);
try {
  quotaConfig({ ...env, VERCEL: '1' });
  console.log('Contadores de producción: configurados');
} catch {
  console.log(
    'Producción: faltan contadores compartidos o su configuración no es válida. Consulta docs/tutor-gemini.md.',
  );
}
const port = Number(env.PORT || 3000);
if (!Number.isInteger(port) || port < 1 || port > 65535) throw Error('PORT no es válido.');
try {
  const response = await fetch('http://127.0.0.1:' + port + '/api/tutor', {
    signal: AbortSignal.timeout(2000),
  });
  const body = await response.json();
  console.log(
    'Servidor local: ' +
      (response.ok && body.ready === true
        ? 'tutor disponible'
        : 'API sin configurar; reinicia npm start después de guardar .env.local'),
  );
} catch {
  console.log(
    'Servidor local: no responde la API. Inicia npm start; un servidor estático no ejecuta el tutor.',
  );
}
console.log('Este diagnóstico no consulta Gemini ni consume su cuota.');
