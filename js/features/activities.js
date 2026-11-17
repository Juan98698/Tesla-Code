import { escapeHtml as e } from '../core/html.js';
import { assessmentMarkup, mountProjectAssessment } from './project-assessment.js';
import { projectAssessmentReady } from '../domain/project-assessment.js';
import { grade } from '../domain/grading.js';
import { codeActivityMarkup, mountCodeActivity } from './code-activity.js';
import { caseStudyMarkup, mountCaseStudy } from './case-study.js';
export function mountActivities(root, activities, isSolved, onSolve, options = {}) {
  const cleanups = [];
  let alive = true;
  const solved = new Set(
    activities
      .filter(
        (a) =>
          isSolved(a.id) &&
          (options.reviewCompleted ||
            projectAssessmentReady(
              a,
              options.artifactFor?.(`${options.context ?? 'practice'}/${a.id}`),
            )),
      )
      .map((a) => a.id),
  );
  const artifacts = {};
  const artifactFor = (key) => options.artifactFor?.(key) ?? artifacts[key];
  const context = options.context ?? 'practice';
  const ready = (a) =>
    options.reviewCompleted ||
    !(a.learningStep || a.followUp) ||
    ((a.learningStep ?? a.followUp).requires ?? []).every((id) => solved.has(id));
  const capture = (a, submitted = {}) => {
    if (!a.learningStep || !ready(a)) return;
    const section = root.querySelector(`[data-activity="${a.id}"]`);
    const evidence = {
      code: section.querySelector('.code-editor')?.value ?? '',
      report: section.querySelector('[data-case-report]')?.textContent ?? '',
      verifiedAt: new Date().toISOString(),
      ...submitted,
    };
    const key = `${context}/${a.id}`;
    artifacts[key] = { ...artifactFor(key), ...evidence };
    options.onEvidence?.(a.id, evidence);
    section.querySelector('[data-download-artifact]').disabled = false;
  };
  const refreshSteps = (recover = true) => {
    for (const a of activities.filter((a) => a.followUp)) {
      const section = root.querySelector(`[data-activity="${a.id}"]`);
      section.querySelector('[data-follow-up-controls]').disabled = !ready(a);
      section.querySelector('[data-follow-up-status]').textContent = ready(a)
        ? a.followUp.reason
        : 'Completa la integración del proyecto antes de resolver esta transferencia.';
    }
    for (const a of activities.filter((a) => a.learningStep)) {
      const section = root.querySelector(`[data-activity="${a.id}"]`);
      section.querySelector('[data-step-controls]').disabled = !ready(a);
      const assessmentControls = section.querySelector('[data-assessment-controls]');
      if (assessmentControls) {
        assessmentControls.disabled = !ready(a);
        assessmentControls.hidden = !ready(a);
      }
      section.querySelector('[data-step-status]').textContent = ready(a)
        ? solved.has(a.id)
          ? 'Etapa comprobada; puedes revisarla.'
          : 'Etapa disponible.'
        : 'Completa la etapa anterior para continuar.';
      const source = artifactFor(a.learningStep.from);
      const preview = section.querySelector('[data-project-source]');
      preview.hidden = !source?.verifiedAt;
      preview.querySelector('pre').textContent = source?.code || source?.report || '';
      section.querySelector('[data-download-artifact]').disabled = !artifactFor(
        `${context}/${a.id}`,
      )?.verifiedAt;
      if (recover)
        section.dispatchEvent(new root.ownerDocument.defaultView.Event('project-source-ready'));
    }
  };
  const solve = (id, submitted) => {
    const a = activities.find((item) => item.id === id);
    if (!ready(a)) return;
    if (a.assessment && !projectAssessmentReady(a, submitted)) return;
    capture(a, submitted);
    solved.add(id);
    const badge = root.querySelector(`[data-activity="${id}"] .badge`);
    badge.classList.add('live');
    badge.textContent = '✓ Resuelta';
    refreshSteps();
    const saved = onSolve(id);
    const status = root.querySelector(`[data-activity="${id}"] [data-artifact-status]`);
    if (status)
      Promise.resolve(saved).then((ok) => {
        if (alive)
          status.textContent =
            ok === false
              ? 'No se pudo guardar. Descarga tu entrega antes de salir.'
              : 'Versión comprobada; incluida en tu copia de progreso.';
      });
  };
  root.innerHTML = activities
    .map(
      (a) =>
        `<section class="card practice-card" data-activity="${a.id}">${a.followUp ? '<p data-follow-up-status role="status"></p><fieldset class="journey-controls" data-follow-up-controls><legend>Comprobación posterior · otra situación</legend>' : ''}${a.learningStep ? `<p class="eyebrow">${e(a.learningStep.label)}</p><p>${e(a.learningStep.input)}</p><p><strong>Entregas:</strong> ${e(a.learningStep.output)}</p><p data-step-status role="status"></p><details data-project-source hidden><summary>Consultar la entrega anterior</summary><pre tabindex="0"></pre></details><fieldset class="journey-controls" data-step-controls><legend>${e(a.learningStep.label)}</legend>` : ''}<span class="badge ${solved.has(a.id) ? 'live' : ''}">${solved.has(a.id) ? '✓ Resuelta' : 'TU TURNO'}</span><h3 style="margin-top:16px">${e(a.prompt)}</h3>${a.type === 'case-study' ? caseStudyMarkup(a) : ['python', 'javascript'].includes(a.type) ? codeActivityMarkup(a) : `<form><label for="answer-${a.id}">Tu respuesta</label><input id="answer-${a.id}" autocomplete="off" required maxlength="200"><div class="btns" style="margin-top:12px"><button class="btn small" type="submit">Comprobar respuesta</button><button class="btn ghost small" type="button" data-hint>Necesito una pista</button></div></form>`}<p class="hint" aria-live="polite" hidden>${e(a.hint)}</p><div class="practice-feedback" role="status" hidden></div>${a.followUp ? '</fieldset>' : ''}${a.learningStep ? `</fieldset><label for="journal-${a.id}">Bitácora del reto</label><p id="journal-help-${a.id}">${e(a.learningStep.reflection)} Tu explicación se guarda para revisión; no recibe una calificación automática.</p><textarea id="journal-${a.id}" data-project-journal rows="3" maxlength="2000" aria-describedby="journal-help-${a.id}"></textarea>${a.assessment ? `<fieldset data-assessment-controls class="journey-controls"><legend>Evidencias requeridas</legend>${assessmentMarkup(a)}</fieldset>` : ''}<p data-journal-status role="status"></p><button class="btn ghost small" type="button" data-download-artifact disabled>Descargar mi entrega</button><p data-artifact-status role="status"></p>` : ''}</section>`,
    )
    .join('');
  activities.forEach((a) => {
    const section = root.querySelector(`[data-activity="${a.id}"]`),
      feedback = section.querySelector('.practice-feedback');
    const hints = [a.hint, ...(a.hints ?? [])];
    let revealed = 0;
    section.querySelector('[data-hint]').onclick = (event) => {
      revealed = Math.min(revealed + 1, hints.length);
      const hint = section.querySelector('.hint');
      hint.hidden = false;
      hint.textContent = hints
        .slice(0, revealed)
        .map((text, i) => `Pista ${i + 1}: ${text}`)
        .join(' · ');
      event.currentTarget.textContent = revealed < hints.length ? 'Otra pista' : 'Pistas mostradas';
      event.currentTarget.disabled = revealed === hints.length;
    };
    const assessment = a.assessment
      ? mountProjectAssessment(section, a, {
          ...options,
          artifactFor,
          context,
          canProceed: () => ready(a),
          onComplete: (work) => solve(a.id, work),
          onPending: () => {
            solved.delete(a.id);
            section.querySelector('.badge').classList.remove('live');
            section.querySelector('.badge').textContent = 'Evidencia pendiente';
            refreshSteps(false);
          },
        })
      : null;
    if (assessment) cleanups.push(() => assessment.dispose());
    if (a.type === 'case-study') {
      mountCaseStudy(
        section,
        a,
        isSolved,
        assessment ? () => {} : solve,
        assessment ? () => assessment.casePassed() : () => capture(a),
      );
    } else if (['python', 'javascript'].includes(a.type)) {
      cleanups.push(mountCodeActivity(section, a, solve, { ...options, artifactFor, assessment }));
    } else
      section.querySelector('form').onsubmit = (event) => {
        event.preventDefault();
        const correct = grade(a, section.querySelector('input').value);
        feedback.hidden = false;
        feedback.className = `practice-feedback ${correct ? 'ok' : 'bad'}`;
        feedback.textContent = correct
          ? `¡Lo resolviste! ${a.explanation}`
          : 'Todavía no coincide. Revisa el ejemplo, usa la pista y prueba otra vez.';
        if (correct) {
          section.querySelector('.badge').textContent = '✓ Resuelta';
          section.querySelector('.badge').classList.add('live');
          solve(a.id);
        }
      };
    const form = section.querySelector('form'),
      handleSubmit = form.onsubmit;
    form.onsubmit = (event) => {
      if (!ready(a)) {
        event.preventDefault();
        return;
      }
      return handleSubmit(event);
    };
    if (a.learningStep) {
      const key = `${context}/${a.id}`,
        journal = section.querySelector('[data-project-journal]');
      journal.value = artifactFor(key)?.notes ?? '';
      let edit = 0;
      journal.oninput = async () => {
        const version = ++edit;
        artifacts[key] = { ...artifactFor(key), notes: journal.value };
        const status = section.querySelector('[data-journal-status]');
        status.textContent = 'Guardando bitácora…';
        try {
          const ok = await options.onJournal?.(a.id, journal.value);
          if (alive && edit === version)
            status.textContent =
              ok === false
                ? 'No se pudo guardar. Copia tu texto antes de salir.'
                : 'Bitácora guardada.';
        } catch {
          if (alive && edit === version)
            status.textContent = 'No se pudo guardar. Copia tu texto antes de salir.';
        }
      };
      section.querySelector('[data-download-artifact]').onclick = () => {
        const artifact = artifactFor(key);
        if (!artifact?.verifiedAt) return;
        const link = document.createElement('a');
        const url = URL.createObjectURL(
          new Blob([artifact.code || artifact.report], { type: 'text/plain' }),
        );
        link.href = url;
        link.download = `${a.learningStep.project}-${a.id}.${artifact.code ? 'js' : 'txt'}`;
        link.click();
        URL.revokeObjectURL(url);
      };
    }
  });
  refreshSteps();
  return () => {
    alive = false;
    cleanups.forEach((cleanup) => cleanup());
  };
}
