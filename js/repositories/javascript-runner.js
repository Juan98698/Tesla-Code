import { JAVASCRIPT_LIMITS } from '../domain/javascript-exercise.js';

// Serialized into an opaque-origin Worker. importScripts executes a real classic
// script: top-level return/import stay syntax errors and source lines aren't shifted.
export function javascriptWorker() {
  self.onmessage = ({ data }) => {
    const { code, item, exploratory } = data;
    const entrypoint = item.entrypoint ?? data.entrypoint;
    let stdout = '',
      position = 0,
      emitted = -Infinity;
    const consoleArguments = [];
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
      if (item.consoleArguments) consoleArguments.push(values);
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
    const same = (actual, expected) => {
      if (actual === expected) return true;
      if (!actual || !expected || typeof actual !== 'object' || typeof expected !== 'object')
        return false;
      if (Array.isArray(actual) !== Array.isArray(expected)) return false;
      if (Object.prototype.toString.call(actual) !== Object.prototype.toString.call(expected))
        return false;
      const keys = Object.keys(expected);
      return (
        Object.keys(actual).length === keys.length &&
        (!Array.isArray(expected) || actual.length === expected.length) &&
        keys.every((key) => Object.hasOwn(actual, key) && same(actual[key], expected[key]))
      );
    };
    let boundMatch = true;
    let returned,
      unchanged = true;
    const probe = '__teslacode_call_' + Math.random().toString(36).slice(2);
    const callable = entrypoint !== undefined && !exploratory;
    let suffix = '';
    if (callable) {
      if (!/^[a-zA-Z_$][\w$]*$/.test(entrypoint)) throw Error('Nombre de función inválido.');
      self[probe] = (fn) => {
        if (typeof fn !== 'function') throw Error('Define la función ' + entrypoint + '.');
        const args = JSON.parse(JSON.stringify(item.args));
        returned = fn(...args);
        if (display(returned).length > 6000) {
          returned = undefined;
          throw Error('El resultado supera 6000 caracteres.');
        }
        unchanged = !item.preserveArgs || same(args, item.args);
      };
      // A separate statement in the same classic script also supports lexical
      // declarations (const/let), without eval or accepting source text matches.
      suffix =
        '\n;self[' +
        JSON.stringify(probe) +
        '](typeof ' +
        entrypoint +
        ' === "function" ? ' +
        entrypoint +
        ' : undefined);';
    }
    if (!callable && !exploratory && item.expectedBindings) {
      const names = Object.keys(item.expectedBindings);
      if (names.some((name) => !/^[a-zA-Z_$][\w$]*$/.test(name))) throw Error('Dato inválido.');
      self[probe] = (values) => {
        boundMatch = same(values, item.expectedBindings);
      };
      suffix =
        '\n;self[' +
        JSON.stringify(probe) +
        ']({' +
        names
          .map(
            (name) =>
              JSON.stringify(name) +
              ': (typeof ' +
              name +
              ' === "undefined" ? undefined : ' +
              name +
              ')',
          )
          .join(',') +
        '});';
    }
    const url = URL.createObjectURL(
      new Blob([code + suffix + '\n//# sourceURL=teslacode-ejercicio.js'], {
        type: 'text/javascript',
      }),
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
      delete self[probe];
    }
    stdout = stdout.replaceAll('\r\n', '\n');
    const format = (value) => (typeof value === 'string' ? JSON.stringify(value) : display(value));
    const expected = callable
      ? format(item.expected)
      : (item.stdout ?? '').replaceAll('\r\n', '\n');
    const actual = callable ? format(returned) : stdout;
    const argumentsMatch =
      !item.consoleArguments ||
      Object.entries(item.consoleArguments).every(([label, value]) =>
        consoleArguments.some(
          (args) => args.length === 2 && args[0] === label && same(args[1], value),
        ),
      );
    const passed =
      !failure &&
      (callable
        ? same(returned, item.expected) && unchanged && stdout === (item.stdout ?? '')
        : stdout === expected && boundMatch && argumentsMatch);
    send({
      type: 'result',
      result: {
        name: item.name,
        stdout,
        actual,
        expected,
        passed: exploratory ? null : passed,
        ...(!boundMatch
          ? { error: 'Los datos declarados no tienen los valores o tipos del contrato.' }
          : {}),
        ...(!argumentsMatch
          ? {
              error: 'Presenta los rótulos y sus valores con los tipos del contrato.',
            }
          : {}),
        ...(callable && !unchanged
          ? { error: 'La función modificó los argumentos; debe conservarlos.' }
          : callable && stdout !== (item.stdout ?? '')
            ? {
                error: item.stdout
                  ? 'El reporte impreso no coincide con la salida completa esperada. Comprueba también los valores devueltos.'
                  : 'La salida impresa no cumple el contrato. Devuelve el resultado de la función.',
              }
            : {}),
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
    const { code, cases, mode, entrypoint } = event.data.job;
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
      worker.postMessage({
        code: item.source ?? code,
        item,
        entrypoint,
        exploratory: mode === 'run',
      });
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
  let revision = 0;
  const cancel = () => {
    revision++;
    active?.(Error('Ejecución detenida.'));
  };
  return {
    cancel,
    dispose: cancel,
    async run(job, onStatus = () => {}, onOutput = () => {}) {
      cancel();
      const runRevision = revision;
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
      if ((job.bindings || job.syntax) && job.mode !== 'run') {
        const { prepareBindingCases } = await import('../domain/javascript-contract.js');
        if (revision !== runRevision) throw Error('Ejecución detenida.');
        job = { ...job, cases: prepareBindingCases(job.code, job.cases, job.bindings, job.syntax) };
      }
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
