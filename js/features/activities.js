import { escapeHtml as e } from '../core/html.js';
import { grade } from '../domain/grading.js';
import { codeActivityMarkup, mountCodeActivity } from './code-activity.js';
export function mountActivities(root, activities, isSolved, onSolve, options = {}) {
  const cleanups = [];
  root.innerHTML = activities
    .map(
      (a) =>
        `<section class="card practice-card" data-activity="${a.id}"><span class="badge ${isSolved(a.id) ? 'live' : ''}">${isSolved(a.id) ? '✓ Resuelta' : 'TU TURNO'}</span><h3 style="margin-top:16px">${e(a.prompt)}</h3>${['python', 'javascript'].includes(a.type) ? codeActivityMarkup(a) : `<form><label for="answer-${a.id}">Tu respuesta</label><input id="answer-${a.id}" autocomplete="off" required maxlength="200"><div class="btns" style="margin-top:12px"><button class="btn small" type="submit">Comprobar respuesta</button><button class="btn ghost small" type="button" data-hint>Necesito una pista</button></div></form>`}<p class="hint" hidden>${e(a.hint)}</p><div class="practice-feedback" role="status" hidden></div></section>`,
    )
    .join('');
  activities.forEach((a) => {
    const section = root.querySelector(`[data-activity="${a.id}"]`),
      feedback = section.querySelector('.practice-feedback');
    section.querySelector('[data-hint]').onclick = () => {
      section.querySelector('.hint').hidden = false;
    };
    if (['python', 'javascript'].includes(a.type)) {
      cleanups.push(mountCodeActivity(section, a, onSolve, options));
      return;
    }
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
        onSolve(a.id);
      }
    };
  });
  return () => cleanups.forEach((cleanup) => cleanup());
}
