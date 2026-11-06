import { button, span } from '../core/dom.js';
import { shuffle, codeBlock, escapeHtml } from '../core/html.js';
import { grade, isPassing } from '../domain/grading.js';
export function mountQuiz({ box, questions, onFinish }) {
  let index, results, deck;
  function start() {
    index = 0;
    results = [];
    deck = shuffle(questions);
    show();
  }
  function show() {
    const q = deck[index];
    box.dataset.questionId = q.id;
    box.innerHTML = `<div class="qmeta"><span>Pregunta ${index + 1} de ${deck.length}</span><span>${results.filter((r) => r.correct).length} correctas</span></div><div class="meter"><i style="width:${(index / deck.length) * 100}%"></i></div><h3 class="q">${escapeHtml(q.prompt)}</h3>${q.code ? codeBlock(q.code) : ''}`;
    const controls = document.createElement('div');
    controls.className = 'opts';
    box.append(controls);
    let answered = false;
    function answer(response) {
      if (answered) return;
      answered = true;
      controls.querySelectorAll('button,input').forEach((el) => (el.disabled = true));
      const correct = grade(q, response);
      results.push({ id: q.id, concept: q.concept, correct });
      const panel = document.createElement('div');
      panel.className = `fb ${correct ? 'ok' : 'bad'}`;
      panel.setAttribute('role', 'status');
      const solution =
        q.type === 'choice'
          ? q.options[q.answer]
          : q.type === 'order'
            ? q.steps.join(' → ')
            : q.answers[0];
      panel.textContent = `${correct ? '¡Bien resuelto!' : `Revisemos. Respuesta: ${solution}.`} ${q.explanation}`;
      const next = button(
        index === deck.length - 1 ? 'Ver mi resultado →' : 'Siguiente pregunta →',
        'btn',
        () => {
          index++;
          index < deck.length ? show() : finish();
        },
      );
      panel.append(next);
      box.append(panel);
      next.focus({ preventScroll: true });
    }
    if (q.type === 'choice')
      shuffle(q.options.map((text, original) => ({ text, original }))).forEach((option) =>
        controls.append(button(option.text, 'opt', () => answer(option.original))),
      );
    if (q.type === 'text') {
      const form = document.createElement('form');
      const label = document.createElement('label');
      label.textContent = 'Tu respuesta';
      const input = document.createElement('input');
      input.required = true;
      input.autocomplete = 'off';
      label.append(input);
      const submit = button('Comprobar', 'btn', () => {});
      submit.type = 'submit';
      form.append(label, submit);
      controls.append(form);
      form.onsubmit = (event) => {
        event.preventDefault();
        answer(input.value);
      };
    }
    if (q.type === 'order') {
      const picked = [];
      const chosen = document.createElement('div');
      chosen.className = 'resp';
      chosen.setAttribute('aria-live', 'polite');
      const pool = document.createElement('div');
      pool.className = 'opts';
      const check = button('Comprobar orden', 'btn', () => answer(picked));
      check.disabled = true;
      const reset = button('Empezar de nuevo', 'btn ghost', () => {
        picked.length = 0;
        chosen.replaceChildren();
        pool.querySelectorAll('button').forEach((b) => (b.disabled = false));
        check.disabled = true;
      });
      shuffle(q.steps).forEach((text) =>
        pool.append(
          button(text, 'opt', (event) => {
            picked.push(text);
            event.currentTarget.disabled = true;
            chosen.append(span(`${picked.length}. ${text}`, 'tag'));
            check.disabled = picked.length !== q.steps.length;
          }),
        ),
      );
      controls.append(pool, chosen, check, reset);
    }
  }
  function finish() {
    delete box.dataset.questionId;
    const correct = results.filter((r) => r.correct).length;
    const pct = Math.round((correct / deck.length) * 100);
    const summary = onFinish({
      correct,
      total: deck.length,
      passed: isPassing(correct, deck.length),
      results,
    });
    box.innerHTML = `<div class="result-orbit ${pct >= 80 ? 'passed' : ''}">${pct}<small>%</small></div><h3>${pct >= 80 ? 'Buen trabajo. Sigue construyendo.' : 'Cada intento te enseña algo.'}</h3><p>${escapeHtml(summary.text)}</p>`;
    box.append(button('Volver a practicar', 'btn ghost', start));
    for (const action of summary.actions ?? [])
      box.append(button(action.label, 'btn', action.onClick));
  }
  start();
}
