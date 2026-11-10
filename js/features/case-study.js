import { escapeHtml as e, shuffle } from '../core/html.js';
import { evaluateCaseStudy, caseStudyReport } from '../domain/case-study.js';

export function caseStudyMarkup(activity) {
  return `<div class="case-brief"><p>${e(activity.brief)}</p><p class="muted">Caso didáctico con respuestas preparadas. Analiza la evidencia; no se consulta un modelo externo.</p></div>
    <div class="case-evidence">${activity.evidence.map((item) => `<section><h4>${e(item.label)}</h4><p>${e(item.text)}</p></section>`).join('')}</div>
    <form class="case-form">${activity.decisions
      .map((decision) => {
        const id = `case-${activity.id}-${decision.id}`;
        return `<fieldset class="case-decision" data-decision="${e(decision.id)}" aria-describedby="${e(id)}-feedback"><legend>${e(decision.prompt)}</legend>${shuffle(
          decision.options.map((text, value) => ({ text, value })),
        )
          .map(
            (option) =>
              `<label class="case-option"><input type="radio" name="${e(id)}" value="${option.value}" required><span>${e(option.text)}</span></label>`,
          )
          .join(
            '',
          )}<p id="${e(id)}-feedback" class="case-note" data-decision-feedback="${e(decision.id)}"></p></fieldset>`;
      })
      .join(
        '',
      )}<div class="btns"><button class="btn small" type="submit">Comprobar mi análisis</button><button class="btn ghost small" type="button" data-hint>Necesito una pista</button></div></form>
    <details class="case-report" hidden><summary>Ver mi informe razonado</summary><pre data-case-report></pre></details>`;
}

export function mountCaseStudy(section, activity, isSolved, onSolve) {
  let recorded = isSolved(activity.id);
  section.querySelector('form').onsubmit = (event) => {
    event.preventDefault();
    const responses = Object.fromEntries(
      [...section.querySelectorAll('[data-decision]')].map((group) => {
        const selected = group.querySelector('input:checked');
        return [group.dataset.decision, selected ? Number(selected.value) : null];
      }),
    );
    const result = evaluateCaseStudy(activity, responses);
    for (const [index, decision] of result.decisions.entries()) {
      const note = section.querySelector(`[data-decision-feedback="${decision.id}"]`);
      const group = section.querySelector(`[data-decision="${decision.id}"]`);
      group.setAttribute('aria-invalid', String(!decision.correct));
      note.textContent = decision.correct
        ? `Correcto. ${activity.decisions[index].explanation}`
        : 'Revisa esta decisión con el material de referencia y vuelve a comprobar.';
    }
    const feedback = section.querySelector('.practice-feedback');
    feedback.hidden = false;
    feedback.className = `practice-feedback ${result.passed ? 'ok' : 'bad'}`;
    feedback.textContent = result.passed
      ? `¡Lo resolviste! ${activity.explanation}`
      : `Has resuelto ${result.decisions.filter((decision) => decision.correct).length} de ${result.decisions.length} decisiones. Revisa las señaladas.`;
    const report = section.querySelector('.case-report');
    report.hidden = !result.passed;
    section.querySelector('[data-case-report]').textContent = caseStudyReport(activity, responses);
    if (result.passed) {
      section.querySelector('.badge').textContent = '✓ Resuelta';
      section.querySelector('.badge').classList.add('live');
      if (!recorded) {
        recorded = true;
        onSolve(activity.id);
      }
    }
  };
}
