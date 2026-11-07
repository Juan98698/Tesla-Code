import { escapeHtml as e } from '../core/html.js';
import { createPythonRunner } from '../repositories/python-runner.js';
import { PYTHON_LIMITS } from '../domain/python-exercise.js';

export function codeActivityMarkup(activity) {
  return `<p>Escribe tu solución. Python se descarga al ejecutar por primera vez; necesitas conexión.</p>
    <form><label for="answer-${activity.id}">Tu código Python</label>
    <textarea id="answer-${activity.id}" class="code-editor" rows="10" spellcheck="false" wrap="off"
      autocapitalize="off" autocomplete="off" maxlength="${PYTHON_LIMITS.source}">${e(activity.starter)}</textarea>
    <div class="btns"><button class="btn small" type="submit">Ejecutar pruebas</button>
    <button class="btn ghost small" type="button" data-stop disabled>Detener</button>
    <button class="btn ghost small" type="button" data-hint>Necesito una pista</button>
    <button class="btn ghost small" type="button" data-reset>Restaurar código inicial</button></div></form>
    <p class="code-save-note" role="status"></p>
    <details><summary>Casos que comprobará el ejercicio</summary><ul>${activity.cases
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
      )}</ul><p>Los casos comprueban este contrato; no demuestran por sí solos la corrección para todas las entradas.</p></details>`;
}

export function mountCodeActivity(
  section,
  activity,
  onSolve,
  {
    context = 'practice',
    runnerFactory = createPythonRunner,
    storage = {
      getItem: (key) => globalThis.localStorage.getItem(key),
      setItem: (key, value) => globalThis.localStorage.setItem(key, value),
    },
  } = {},
) {
  const editor = section.querySelector('textarea');
  const feedback = section.querySelector('.practice-feedback');
  const run = section.querySelector('button[type=submit]');
  const stop = section.querySelector('[data-stop]');
  const saved = section.querySelector('.code-save-note');
  const key = 'teslacode:draft:v1:' + context + '/' + activity.id;
  const runner = runnerFactory();
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
  section.querySelector('form').onsubmit = async (event) => {
    event.preventDefault();
    if (run.disabled) return;
    run.disabled = true;
    stop.disabled = false;
    feedback.hidden = false;
    feedback.className = 'practice-feedback';
    try {
      const result = await runner.run(
        {
          code: editor.value,
          cases: activity.cases,
          entrypoint: activity.entrypoint,
        },
        (status) => {
          if (alive)
            feedback.textContent =
              status === 'loading'
                ? 'Preparando Python… Puedes detener la descarga.'
                : 'Ejecutando los casos de prueba…';
        },
      );
      if (!alive) return;
      const correct = result.results.every((item) => item.passed === true);
      feedback.className = 'practice-feedback ' + (correct ? 'ok' : 'bad');
      feedback.innerHTML = `<p>${
        correct
          ? '¡Lo resolviste! ' + e(activity.explanation)
          : 'Todavía hay casos que revisar. Compara el resultado con el esperado.'
      }</p>
        <p>Python ${e(result.version)}</p><ul>${result.results
          .map(
            (item) =>
              `<li>${item.passed ? '✓' : '✗'} ${e(item.name)}${
                item.passed
                  ? ''
                  : `<pre>${e(item.error ?? 'Esperado: ' + item.expected + '\nObtenido: ' + item.actual)}</pre>`
              }</li>`,
          )
          .join('')}</ul>`;
      if (correct) {
        section.querySelector('.badge').textContent = '✓ Resuelta';
        section.querySelector('.badge').classList.add('live');
        onSolve(activity.id);
      }
    } catch (error) {
      if (alive) {
        feedback.className = 'practice-feedback bad';
        feedback.textContent = error.message;
      }
    } finally {
      if (alive) {
        run.disabled = false;
        stop.disabled = true;
      }
    }
  };
  return () => {
    alive = false;
    runner.dispose();
  };
}
