import { PYTHON_HARNESS, PYTHON_LIMITS } from '../domain/python-exercise.js';

export const PYODIDE_INDEX = 'https://cdn.jsdelivr.net/pyodide/v314.0.7/full/';

// Se serializa dentro de un Worker; no cierra sobre el estado de la aplicación.
export async function workerBootstrap(importRuntime = (url) => import(url)) {
  self.onmessage = async ({ data }) => {
    try {
      const { loadPyodide } = await importRuntime(data.indexURL + 'pyodide.mjs');
      const python = await loadPyodide({ indexURL: data.indexURL, stdout() {}, stderr() {} });
      self.postMessage({ type: 'running' });
      python.runPython(data.harness);
      let emittedAt = -Infinity;
      python.globals.set('_console_emit', (output) => {
        const now = performance.now();
        if (now - emittedAt >= 50) {
          emittedAt = now;
          self.postMessage({ type: 'output', output: String(output).slice(0, 6000) });
        }
      });
      python.globals.set('_exercise_payload', JSON.stringify(data.job));
      const result = python.runPython('_evaluate_exercise(_json.loads(_exercise_payload))');
      self.postMessage({ type: 'result', result: JSON.parse(result) });
    } catch (error) {
      self.postMessage({ type: 'error', message: String(error.message ?? error).slice(0, 1500) });
    }
  };
}

export function frameBootstrap(channel, workerSource) {
  let worker;
  window.addEventListener('message', (event) => {
    if (event.source !== parent || event.data?.channel !== channel || worker) return;
    const url = URL.createObjectURL(new Blob([workerSource], { type: 'text/javascript' }));
    worker = new Worker(url);
    URL.revokeObjectURL(url);
    worker.onmessage = (message) => parent.postMessage({ channel, ...message.data }, '*');
    worker.onerror = (error) =>
      parent.postMessage(
        {
          channel,
          type: 'error',
          message: 'No se pudo iniciar Python: ' + (error.message || 'falló la carga del motor.'),
        },
        '*',
      );
    worker.postMessage(event.data.payload);
  });
  parent.postMessage({ channel, type: 'frame-ready' }, '*');
}

export function runnerFrame(channel, indexURL = PYODIDE_INDEX) {
  const base = new URL(indexURL);
  if (
    !['https:', 'http:'].includes(base.protocol) ||
    base.username ||
    base.password ||
    base.search ||
    base.hash ||
    !indexURL.endsWith('/')
  )
    throw Error('La dirección del motor no es válida.');
  const nonce = channel.replace(/[^a-zA-Z0-9]/g, '');
  const worker = '(' + workerBootstrap.toString() + ')();';
  const script =
    '(' +
    frameBootstrap.toString() +
    ')(' +
    JSON.stringify(channel) +
    ',' +
    JSON.stringify(worker) +
    ');';
  // Origen opaco: el código del estudiante no puede acceder al DOM,
  // localStorage o cookies de TeslaCode. La red queda limitada al runtime.
  const policy =
    "default-src 'none'; script-src 'nonce-" +
    nonce +
    "' 'unsafe-eval' 'wasm-unsafe-eval' blob: " +
    base.href +
    '; worker-src blob:; connect-src ' +
    base.href +
    ';';
  return (
    '<!doctype html><meta charset="utf-8"><meta http-equiv="Content-Security-Policy" content="' +
    policy +
    '"><script nonce="' +
    nonce +
    '">' +
    script.replaceAll('</script', '<\\/script') +
    '</script>'
  );
}

export function createPythonRunner({
  indexURL = PYODIDE_INDEX,
  timeout = 3000,
  loadTimeout = 45000,
  host = document.body,
} = {}) {
  let active;
  const cancel = () => active?.finish(Error('Ejecución detenida.'));
  return {
    cancel,
    dispose: cancel,
    run(job, onStatus = () => {}, onOutput = () => {}) {
      cancel();
      if (
        typeof job.code !== 'string' ||
        !job.code.trim() ||
        job.code.length > PYTHON_LIMITS.source
      )
        return Promise.reject(Error('Escribe un programa de hasta 12000 caracteres.'));
      if (!Array.isArray(job.cases) || !job.cases.length || job.cases.length > PYTHON_LIMITS.cases)
        return Promise.reject(Error('El ejercicio no tiene casos válidos.'));
      return new Promise((resolve, reject) => {
        const channel = 'teslacode-' + crypto.randomUUID();
        const frame = document.createElement('iframe');
        frame.hidden = true;
        frame.title = 'Ejecución aislada de Python';
        frame.setAttribute('sandbox', 'allow-scripts');
        let timer,
          finished = false;
        const finish = (error, result) => {
          if (finished) return;
          finished = true;
          clearTimeout(timer);
          window.removeEventListener('message', receive);
          frame.remove();
          active = undefined;
          if (error) reject(error);
          else resolve(result);
        };
        const receive = (event) => {
          if (event.source !== frame.contentWindow || event.data?.channel !== channel) return;
          const message = event.data;
          if (message.type === 'frame-ready') {
            frame.contentWindow.postMessage(
              {
                channel,
                payload: {
                  indexURL,
                  harness: PYTHON_HARNESS,
                  job,
                },
              },
              '*',
            );
          } else if (message.type === 'running') {
            clearTimeout(timer);
            timer = setTimeout(
              () => finish(Error('Se agotó el tiempo. Revisa la condición de parada.')),
              timeout,
            );
            onStatus('running');
          } else if (message.type === 'output') {
            if (job.mode === 'run' && typeof message.output === 'string')
              onOutput(message.output.slice(0, PYTHON_LIMITS.output));
          } else if (message.type === 'result') {
            if (
              !Array.isArray(message.result?.results) ||
              message.result.results.length !== job.cases.length
            )
              finish(Error('Python devolvió una respuesta incompleta.'));
            else finish(null, message.result);
          } else if (message.type === 'error') {
            finish(Error(message.message || 'No se pudo cargar Python. Reintenta la ejecución.'));
          }
        };
        active = { finish };
        try {
          frame.srcdoc = runnerFrame(channel, indexURL);
          window.addEventListener('message', receive);
          timer = setTimeout(
            () => finish(Error('No pudimos descargar Python. Comprueba tu conexión y reintenta.')),
            loadTimeout,
          );
          host.append(frame);
          onStatus('loading');
        } catch (error) {
          finish(error);
        }
      });
    },
  };
}
