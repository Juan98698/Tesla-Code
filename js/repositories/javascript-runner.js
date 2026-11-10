import { JAVASCRIPT_LIMITS } from '../domain/javascript-exercise.js';

// Serialized into an opaque-origin Worker. importScripts executes a real classic
// script: top-level return/import stay syntax errors and source lines aren't shifted.
export function javascriptWorker() {
  self.onmessage = ({ data }) => {
    const { code, item, exploratory } = data;
    let stdout = '',
      position = 0,
      emitted = -Infinity;
    const send = self.postMessage.bind(self);
    const display = (value) => {
      if (typeof value !== 'object' || value === null) return String(value);
      try {
        return JSON.stringify(value);
      } catch {
        return '[Objeto circular]';
      }
    };
    const print = (...values) => {
      const line = values.map(display).join(' ') + '\n';
      if (stdout.length + line.length > 6000) throw Error('La salida supera 6000 caracteres.');
      stdout += line;
      const now = performance.now();
      if (exploratory && now - emitted >= 50) {
        emitted = now;
        send({ type: 'output', output: stdout });
      }
    };
    self.console = Object.freeze({
      log: print,
      info: print,
      warn: print,
      error: print,
      debug: print,
    });
    // Browser prompt() is supplied here as a queued-input adapter, not a modal.
    self.prompt = () => {
      if (position >= (item.stdin ?? []).length)
        throw Error('Faltan entradas para prompt(). Escríbelas antes de ejecutar, una por línea.');
      return item.stdin[position++];
    };
    const url = URL.createObjectURL(
      new Blob([code + '\n//# sourceURL=teslacode-ejercicio.js'], { type: 'text/javascript' }),
    );
    let failure;
    try {
      importScripts(url);
    } catch (error) {
      const location = String(error?.stack ?? '').match(/teslacode-ejercicio\.js:(\d+)(?::(\d+))?/);
      const message = String(error?.message ?? error).replace(
        /^Failed to execute 'importScripts' on 'WorkerGlobalScope': /,
        '',
      );
      failure = {
        error: String(error?.name ?? 'Error') + ': ' + message,
        traceback:
          String(error?.name ?? 'Error') +
          ': ' +
          message +
          (location
            ? '\nLínea ' + location[1] + (location[2] ? ', columna ' + location[2] : '')
            : '\nRevisa las comillas, los paréntesis y los nombres del programa.'),
      };
    } finally {
      URL.revokeObjectURL(url);
    }
    stdout = stdout.replaceAll('\r\n', '\n');
    const expected = (item.stdout ?? '').replaceAll('\r\n', '\n');
    send({
      type: 'result',
      result: {
        name: item.name,
        stdout,
        actual: stdout,
        expected,
        passed: exploratory ? null : !failure && stdout === expected,
        ...failure,
      },
    });
  };
}

export function javascriptFrameBootstrap(channel, source) {
  let worker,
    started = false;
  window.addEventListener('message', (event) => {
    if (event.source !== parent || event.data?.channel !== channel || started) return;
    started = true;
    const { code, cases, mode } = event.data.job;
    const results = [];
    const send = (message) => parent.postMessage({ channel, ...message }, '*');
    const next = () => {
      worker?.terminate();
      worker = undefined;
      if (results.length === cases.length) {
        send({ type: 'result', result: { version: 'motor del navegador', results } });
        return;
      }
      const item = cases[results.length];
      const url = URL.createObjectURL(new Blob([source], { type: 'text/javascript' }));
      worker = new Worker(url);
      const current = worker;
      URL.revokeObjectURL(url);
      worker.onmessage = ({ data }) => {
        if (current !== worker) return;
        if (data.type === 'output') send(data);
        else if (data.type === 'result') {
          results.push(data.result);
          next();
        }
      };
      worker.onerror = (event) => {
        if (current === worker)
          send({ type: 'error', message: event.message || 'No se pudo ejecutar JavaScript.' });
      };
      worker.postMessage({ code, item, exploratory: mode === 'run' });
    };
    send({ type: 'running' });
    next();
  });
  parent.postMessage({ channel, type: 'frame-ready' }, '*');
}

export function javascriptFrame(channel) {
  const nonce = channel.replace(/[^a-zA-Z0-9]/g, '');
  const source = '(' + javascriptWorker.toString() + ')();';
  const script =
    '(' +
    javascriptFrameBootstrap.toString() +
    ')(' +
    JSON.stringify(channel) +
    ',' +
    JSON.stringify(source) +
    ');';
  return (
    '<!doctype html><meta charset="utf-8"><meta http-equiv="Content-Security-Policy" content="default-src \'none\'; script-src \'nonce-' +
    nonce +
    "' blob:; worker-src blob:; connect-src 'none';\"><script nonce=\"" +
    nonce +
    '">' +
    script.replaceAll('</script', '<\\/script') +
    '</script>'
  );
}

export function createJavaScriptRunner({
  host = document.body,
  timeout = 3000,
  loadTimeout = 10000,
} = {}) {
  let active;
  const cancel = () => active?.(Error('Ejecución detenida.'));
  return {
    cancel,
    dispose: cancel,
    run(job, onStatus = () => {}, onOutput = () => {}) {
      cancel();
      if (
        typeof job.code !== 'string' ||
        !job.code.trim() ||
        job.code.length > JAVASCRIPT_LIMITS.source
      )
        return Promise.reject(Error('Escribe un programa de hasta 12000 caracteres.'));
      if (
        !Array.isArray(job.cases) ||
        !job.cases.length ||
        job.cases.length > JAVASCRIPT_LIMITS.cases
      )
        return Promise.reject(Error('El ejercicio no tiene casos válidos.'));
      return new Promise((resolve, reject) => {
        const channel = 'teslacode-js-' + crypto.randomUUID(),
          frame = document.createElement('iframe');
        frame.hidden = true;
        frame.title = 'Ejecución aislada de JavaScript';
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
          if (message.type === 'frame-ready')
            frame.contentWindow.postMessage({ channel, job }, '*');
          else if (message.type === 'running') {
            clearTimeout(timer);
            timer = setTimeout(
              () => finish(Error('Se agotó el tiempo. Revisa la condición de parada.')),
              timeout,
            );
            onStatus('running');
          } else if (message.type === 'output')
            onOutput(String(message.output).slice(0, JAVASCRIPT_LIMITS.output));
          else if (message.type === 'result') finish(null, message.result);
          else if (message.type === 'error') finish(Error(message.message));
        };
        active = finish;
        window.addEventListener('message', receive);
        frame.srcdoc = javascriptFrame(channel);
        host.append(frame);
        timer = setTimeout(
          () => finish(Error('No se pudo preparar JavaScript. Intenta de nuevo.')),
          loadTimeout,
        );
        onStatus('loading');
      });
    },
  };
}
