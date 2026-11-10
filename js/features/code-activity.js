import { escapeHtml as e } from '../core/html.js';
import { createPythonRunner } from '../repositories/python-runner.js';
import { PYTHON_LIMITS } from '../domain/python-exercise.js';
import { createJavaScriptRunner } from '../repositories/javascript-runner.js';

export function codeActivityMarkup(activity, { practice = true } = {}) {
  const js = activity.type === 'javascript';
  const language = js ? 'JavaScript' : 'Python';
  const input =
    !js ||
    activity.usesInput ||
    activity.stdin?.length ||
    activity.cases?.some((item) => item.stdin?.length);
  return `<p>${js ? 'Escribe, ejecuta y observa la salida. No necesitas instalar herramientas.' : 'Ejecuta y observa la salida. Python se descarga la primera vez; necesitas conexión.'}</p>
    <form><label for="answer-${activity.id}">Tu código ${language}</label>
    <textarea id="answer-${activity.id}" class="code-editor" rows="10" spellcheck="false" wrap="off"
      autocapitalize="off" autocomplete="off" maxlength="${PYTHON_LIMITS.source}">${e(activity.starter)}</textarea>
    <details class="console-inputs" ${input ? '' : 'hidden'}><summary>Entradas para ${js ? 'prompt()' : 'input()'} · una por línea</summary>
      <label for="stdin-${activity.id}">Entradas de tu ejecución</label>
      <textarea id="stdin-${activity.id}" data-stdin rows="3" maxlength="12000" aria-describedby="stdin-help-${activity.id}">${e((activity.stdin ?? []).join('\n'))}</textarea>
      <p id="stdin-help-${activity.id}">Escribe los datos antes de ejecutar. Cada llamada a ${js ? 'prompt()' : 'input()'} lee una línea. Vacío significa ninguna entrada; un salto final permite añadir una entrada vacía. No se abrirá una ventana para escribir durante la ejecución.${js ? ' Aquí prompt() es una adaptación con entradas precargadas; no abre el diálogo del navegador. Al faltar una entrada se informa un error.' : ''}${practice ? ' Comprobar ejercicio utiliza sus propios casos, no estas entradas.' : ''}</p></details>
    ${activity.cases?.[0]?.globals ? `<p>Datos iniciales de tu ejecución: <code>${e(JSON.stringify(activity.cases[0].globals))}</code>. Puedes cambiarlos asignando otros valores en tu código.</p>` : ''}
    <div class="btns"><button class="btn small" type="${practice ? 'button' : 'submit'}" data-run>Ejecutar código</button>
    ${practice ? '<button class="btn ghost small" type="submit" data-check>Comprobar ejercicio</button>' : ''}
    <button class="btn ghost small" type="button" data-stop disabled>Detener</button>
    ${practice ? '<button class="btn ghost small" type="button" data-hint>Necesito una pista</button>' : ''}
    <button class="btn ghost small" type="button" data-reset>Restaurar código inicial</button></div></form>
    <p class="code-save-note" role="status"></p>
    <section class="python-console" aria-labelledby="console-title-${activity.id}">
      <div class="console-heading"><h4 id="console-title-${activity.id}">Consola ${language}</h4>
      <button type="button" class="btn ghost small" data-clear>Limpiar consola</button></div>
      <p class="console-status" role="status">Lista para ejecutar.</p>
      <pre class="console-output" tabindex="0" aria-label="Salida del programa">La salida de ${js ? 'console.log()' : 'print()'} aparecerá aquí.</pre>
      <pre class="console-error" tabindex="0" aria-label="Error de ejecución" hidden></pre>
    </section>
    ${
      practice
        ? `<details><summary>Casos que comprobará el ejercicio</summary><ul>${activity.cases
            .map(
              (c) =>
                `<li><strong>${e(c.name)}</strong>: ${
                  activity.entrypoint
                    ? `argumentos ${e(JSON.stringify(c.args))}; resultado ${e(JSON.stringify(c.expected))}`
                    : `entradas ${e(JSON.stringify(c.globals ?? c.stdin ?? []))}; salida ${e(JSON.stringify(c.stdout))}`
                }</li>`,
            )
            .join(
              '',
            )}</ul><p>Ejecutar permite experimentar sin completar la actividad. Comprobar evalúa estos casos; no demuestra por sí solo la corrección para todas las entradas.</p></details>`
        : '<p>Experimentar con este ejemplo no concede XP. Cada ejecución comienza de nuevo' +
          (js ? '.' : '; los archivos creados en el navegador son temporales.') +
          '</p>'
    }`;
}

export function mountCodeActivity(
  section,
  activity,
  onSolve,
  {
    context = 'practice',
    runnerFactory,
    storage = {
      getItem: (key) => globalThis.localStorage.getItem(key),
      setItem: (key, value) => globalThis.localStorage.setItem(key, value),
    },
  } = {},
) {
  const editor = section.querySelector('textarea');
  const feedback = section.querySelector('.practice-feedback');
  const run = section.querySelector('[data-run]');
  const check = section.querySelector('[data-check]');
  const stdin = section.querySelector('[data-stdin]');
  const output = section.querySelector('.console-output');
  const consoleError = section.querySelector('.console-error');
  const status = section.querySelector('.console-status');
  const clear = section.querySelector('[data-clear]');
  const stop = section.querySelector('[data-stop]');
  const saved = section.querySelector('.code-save-note');
  const key = 'teslacode:draft:v1:' + context + '/' + activity.id;
  const js = activity.type === 'javascript';
  const runner = (runnerFactory ?? (js ? createJavaScriptRunner : createPythonRunner))();
  let alive = true;
  try {
    const draft = storage?.getItem(key);
    if (draft !== null && draft !== undefined && draft.length <= PYTHON_LIMITS.source)
      editor.value = draft;
  } catch {}
  editor.oninput = () => {
    try {
      storage.setItem(key, editor.value);
      saved.textContent = 'Borrador guardado en este navegador.';
    } catch {
      saved.textContent = 'No se pudo guardar el borrador. Copia tu código antes de salir.';
    }
  };
  stop.onclick = () => runner.cancel();
  section.querySelector('[data-reset]').onclick = () => {
    runner.cancel();
    editor.value = activity.starter;
    editor.oninput();
    editor.focus();
  };
  clear.onclick = () => {
    output.textContent = '';
    consoleError.textContent = '';
    consoleError.hidden = true;
    status.textContent = 'Consola limpia.';
  };
  const execute = async (mode) => {
    if (run.disabled) return;
    run.disabled = true;
    if (check) check.disabled = true;
    clear.disabled = true;
    stop.disabled = false;
    output.textContent = '';
    consoleError.hidden = true;
    consoleError.textContent = '';
    if (mode === 'check') {
      feedback.hidden = false;
      feedback.className = 'practice-feedback';
    } else if (feedback) feedback.hidden = true;
    try {
      const job =
        mode === 'run'
          ? {
              mode: 'run',
              code: editor.value,
              cases: [
                {
                  name: 'Tu ejecución',
                  stdin: stdin.value === '' ? [] : stdin.value.replaceAll('\r\n', '\n').split('\n'),
                  globals: activity.cases?.[0]?.globals,
                },
              ],
            }
          : { code: editor.value, cases: activity.cases, entrypoint: activity.entrypoint };
      const result = await runner.run(
        job,
        (phase) => {
          if (!alive) return;
          status.textContent =
            phase === 'loading'
              ? js
                ? 'Preparando JavaScript… Puedes detener la ejecución.'
                : 'Preparando Python… Puedes detener la descarga.'
              : mode === 'run'
                ? 'Ejecutando tu código…'
                : 'Ejecutando los casos de prueba…';
          if (mode === 'check') feedback.textContent = status.textContent;
        },
        (text) => {
          if (alive) output.textContent = text;
        },
      );
      if (!alive) return;
      output.textContent = result.results
        .map((item) => {
          const printed = item.stdout ?? item.actual ?? '';
          return (
            (mode === 'check' ? '── ' + item.name + ' ──\n' : '') +
            (printed || '(El programa terminó sin imprimir salida.)') +
            (mode === 'check' && activity.entrypoint && !item.error
              ? '\nResultado devuelto: ' + item.actual
              : '')
          );
        })
        .join('\n');
      const errors = result.results.filter((item) => item.error);
      if (errors.length) {
        consoleError.hidden = false;
        consoleError.textContent = errors
          .map((item) => item.name + '\n' + (item.traceback ?? item.error))
          .join('\n');
      }
      status.textContent =
        (errors.length ? 'Ejecución con errores' : 'Ejecución finalizada') +
        (js ? ' · JavaScript · ' : ' · Python ') +
        result.version;
      if (mode === 'run') return;
      const correct = result.results.every((item) => item.passed === true);
      feedback.className = 'practice-feedback ' + (correct ? 'ok' : 'bad');
      feedback.innerHTML = `<p>${
        correct
          ? '¡Lo resolviste! ' + e(activity.explanation)
          : 'Todavía hay casos que revisar. Compara el resultado con el esperado.'
      }</p><ul>${result.results
        .map(
          (item) =>
            `<li>${item.passed ? '✓' : '✗'} ${e(item.name)}<pre>${e(
              item.error ?? 'Esperado: ' + item.expected + '\nObtenido: ' + item.actual,
            )}</pre></li>`,
        )
        .join('')}</ul>`;
      if (correct) {
        section.querySelector('.badge').textContent = '✓ Resuelta';
        section.querySelector('.badge').classList.add('live');
        onSolve(activity.id);
      }
    } catch (error) {
      if (alive) {
        status.textContent = 'Ejecución interrumpida.';
        consoleError.hidden = false;
        consoleError.textContent = error.message;
        if (mode === 'check') {
          feedback.className = 'practice-feedback bad';
          feedback.textContent = error.message;
        }
      }
    } finally {
      if (alive) {
        run.disabled = false;
        if (check) check.disabled = false;
        clear.disabled = false;
        stop.disabled = true;
      }
    }
  };
  run.onclick = (event) => {
    event.preventDefault();
    execute('run');
  };
  section.querySelector('form').onsubmit = (event) => {
    event.preventDefault();
    execute(check ? 'check' : 'run');
  };
  return () => {
    alive = false;
    runner.dispose();
  };
}

export function mountCodeExamples(root, data, options = {}) {
  const cleanups = [];
  const blocks = [...root.querySelectorAll('pre[data-language]')];
  for (const example of data.examples ?? []) {
    const block = blocks.find(
      (node) =>
        node.dataset.language === (example.language ?? 'python') &&
        node.textContent.trim() === example.code.trim(),
    );
    if (!block) continue;
    const panel = document.createElement('details');
    panel.className = 'code-example';
    if (example.environment === 'local') {
      panel.innerHTML =
        '<summary>Ejecutar en tu equipo</summary><p>' + e(example.environmentNote) + '</p>';
    } else {
      const activity = {
        id: 'example-' + example.id,
        type: example.language,
        starter: example.code,
        stdin: example.stdin,
      };
      panel.innerHTML =
        '<summary>Probar este ejemplo en la consola</summary>' +
        codeActivityMarkup(activity, { practice: false });
      cleanups.push(mountCodeActivity(panel, activity, () => {}, options));
    }
    block.after(panel);
  }
  return () => cleanups.forEach((cleanup) => cleanup());
}
