import { escapeHtml as e } from '../core/html.js';
import { grade } from '../domain/grading.js';
import { projectAssessmentReady } from '../domain/project-assessment.js';
import { createJavaScriptRunner } from '../repositories/javascript-runner.js';

export function assessmentMarkup(a) {
  return `<section class="project-assessment" aria-label="Evidencias del reto">
    <h4>Predicción, pruebas y explicación</h4>
    ${a.assessment.debug ? `<details open><summary>Incidencia que debes investigar</summary><p>${e(a.assessment.debug.context)}</p><pre tabindex="0">${e(a.assessment.debug.code)}</pre><button class="btn ghost small" type="button" data-reproduce>Reproducir incidencia</button><pre tabindex="0" data-incident-output aria-live="polite">Aún no has reproducido la incidencia.</pre></details>` : ''}
    <form data-reasoning-form>${a.assessment.questions.map((q) => `<fieldset class="case-decision"><legend>${e(q.prompt)}</legend>${q.code ? `<pre tabindex="0">${e(q.code)}</pre>` : ''}${q.type === 'choice' ? q.options.map((text, i) => `<label class="case-option"><input type="radio" name="reason-${a.id}-${q.id}" data-response="${q.id}" value="${i}" required><span>${e(text)}</span></label>`).join('') : `<label>Tu predicción<input data-response="${q.id}" required autocomplete="off" ${q.responseFormat === 'number' ? 'inputmode="decimal"' : ''}></label>`}</fieldset>`).join('')}
    <button class="btn small" type="submit">Registrar predicción y explicación</button></form>
    <p data-assessment-status role="status">Entrega tu explicación en la bitácora y registra las predicciones. Después comprueba tu código.</p>
    <p>Se comprueban las respuestas estructuradas y las ejecuciones. Tu explicación personal se entrega para revisión; su calidad no se aprueba automáticamente.</p>
  </section>`;
}

export function mountProjectAssessment(
  section,
  a,
  { artifactFor, context, onComplete, onPending, runnerFactory, canProceed = () => true },
) {
  const rule = a.assessment,
    journal = section.querySelector('[data-project-journal]');
  const editor = section.querySelector('.code-editor');
  const status = section.querySelector('[data-assessment-status]');
  const runner = (runnerFactory ?? createJavaScriptRunner)();
  let alive = true,
    busy = false,
    responses,
    reflection,
    technical,
    testedCode,
    debug,
    rewrite;
  const notifyPending = () => {
    onPending();
    status.textContent = 'Evidencia pendiente: registra tu explicación y comprueba esta versión.';
  };
  const finish = () => {
    const work = {
      code: testedCode ?? '',
      notes: journal.value,
      verifiedAt: new Date().toISOString(),
      assessment: {
        version: 2,
        responses,
        reflection,
        technical,
        testedCode: testedCode ?? '',
        debug,
        rewrite,
        reviewStatus: 'pending',
      },
    };
    if (
      alive &&
      canProceed() &&
      (!editor || editor.value === testedCode) &&
      projectAssessmentReady(a, work)
    ) {
      status.textContent =
        'Ejecuciones y respuestas comprobadas. Explicación entregada, pendiente de revisión.';
      onComplete(work);
      return true;
    }
    return false;
  };
  const form = section.querySelector('[data-reasoning-form]');
  form.onsubmit = (event) => {
    event.preventDefault();
    if (!canProceed()) return;
    const answers = Object.fromEntries(
      rule.questions.map((q) => {
        const input = section.querySelector(
          `[data-response="${q.id}"]${q.type === 'choice' ? ':checked' : ''}`,
        );
        return [q.id, q.type === 'choice' && input ? Number(input.value) : input?.value];
      }),
    );
    if (!journal.value.trim()) {
      status.textContent =
        'Escribe tu predicción o explicación en la bitácora. Su entrega es obligatoria; su contenido requiere revisión.';
      return;
    }
    const missed = rule.questions.filter((q) => !grade(q, answers[q.id]));
    if (missed.length) {
      status.textContent = missed.map((q) => q.explanation).join(' ');
      return;
    }
    if (rule.debug && !debug?.failed) {
      status.textContent = 'Primero reproduce la incidencia y observa su resultado.';
      return;
    }
    responses = answers;
    reflection = journal.value;
    status.textContent = editor
      ? 'Predicción y explicación registradas. Comprueba ahora el programa.'
      : 'Explicación registrada. Resuelve también las decisiones del caso.';
    finish();
  };
  const responseChanged = () => {
    responses = undefined;
    notifyPending();
  };
  form.addEventListener('input', responseChanged);
  const invalidate = () => {
    technical = undefined;
    rewrite = undefined;
    notifyPending();
  };
  editor?.addEventListener('input', invalidate);
  const noteChanged = () => {
    reflection = undefined;
    notifyPending();
  };
  journal.addEventListener('input', noteChanged);
  if (rule.debug)
    section.querySelector('[data-reproduce]').onclick = async (event) => {
      if (busy || !canProceed()) return;
      busy = true;
      event.currentTarget.disabled = true;
      try {
        const result = await runner.run({ code: rule.debug.code, cases: rule.debug.cases });
        if (!alive) return;
        debug = {
          fixture: rule.debug.id,
          failed: result.results.some((r) => r.error || !r.passed),
          stdout: result.results.map((r) => r.stdout).join('\n'),
          error: result.results.map((r) => r.error ?? '').join('\n'),
        };
        section.querySelector('[data-incident-output]').textContent =
          debug.stdout + '\n' + debug.error;
        status.textContent =
          'Incidencia ejecutada. Contrasta lo observado con el resultado esperado y registra tu diagnóstico.';
      } catch (error) {
        if (alive) status.textContent = error.message;
      } finally {
        busy = false;
        if (alive) section.querySelector('[data-reproduce]').disabled = false;
      }
    };
  return {
    beforeCheck() {
      if (responses === undefined || reflection !== journal.value) {
        status.textContent = 'Registra primero tu predicción y explicación.';
        return false;
      }
      return true;
    },
    async checked(code, result) {
      technical = {
        passed: result.results.every((r) => r.passed === true),
        cases: result.results.length,
      };
      testedCode = code;
      if (rule.rewrite && technical.passed) {
        const previous = artifactFor(a.learningStep.from);
        if (!previous?.verifiedAt || !previous.code) {
          status.textContent = 'Completa el incremento anterior para comparar con tu versión real.';
          return;
        }
        const cases = a.cases
          .filter((c) => !c.overrides)
          .map(({ overrides, expectedBindings, consoleArguments, ...c }) => c);
        try {
          const baseline = await runner.run({ code: previous.code, cases });
          if (!alive) return;
          rewrite = {
            source: a.learningStep.from,
            passed: baseline.results.every((r) => r.passed === true),
            before: baseline.results.map((r) => r.stdout),
            after: result.results.filter((_, i) => !a.cases[i].overrides).map((r) => r.stdout),
          };
          if (!baseline.results.every((r) => r.passed === true)) {
            status.textContent =
              'La versión anterior ya no cumple el contrato común. Revisa ese incremento antes de comparar.';
            return;
          }
        } catch (error) {
          if (alive) status.textContent = error.message;
          return;
        }
      }
      finish();
    },
    casePassed() {
      if (!canProceed()) return false;
      technical = { passed: true, cases: a.decisions.length };
      testedCode = '';
      return finish();
    },
    dispose() {
      alive = false;
      form.removeEventListener('input', responseChanged);
      runner.dispose();
      editor?.removeEventListener('input', invalidate);
      journal.removeEventListener('input', noteChanged);
    },
  };
}
