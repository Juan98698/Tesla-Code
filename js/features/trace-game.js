import { escapeHtml as escape } from '../core/html.js';

export function mountTraceGame(root, game) {
  root.innerHTML = `<section class="callout trace-game" aria-label="${escape(game.title)}">
    <h3>${escape(game.title)}</h3><p>${escape(game.brief)}</p>
    <p data-trace-count></p><h4 data-trace-question tabindex="-1"></h4>
    <div class="btns" data-trace-options></div>
    <p class="trace-feedback" role="status"></p>
    <button class="btn ghost small" type="button" data-trace-next hidden>Siguiente paso</button>
    <button class="btn ghost small" type="button" data-trace-reset>Reiniciar juego</button>
  </section>`;
  const question = root.querySelector('[data-trace-question]');
  const options = root.querySelector('[data-trace-options]');
  const status = root.querySelector('[role="status"]');
  const next = root.querySelector('[data-trace-next]');
  let index = 0;
  let attempts = 0;
  function show(focus = false) {
    const round = game.rounds[index];
    status.textContent = '';
    next.hidden = true;
    options.replaceChildren();
    root.querySelector('[data-trace-count]').textContent = round
      ? 'Paso ' + (index + 1) + ' de ' + game.rounds.length
      : game.rounds.length + ' pasos resueltos en ' + attempts + ' intentos.';
    question.textContent = round ? round.prompt : 'Traza completada';
    if (focus) question.focus();
    if (!round) return;
    for (const [i, value] of round.options.entries()) {
      const button = document.createElement('button');
      button.className = 'btn ghost small';
      button.type = 'button';
      button.textContent = value;
      button.onclick = () => {
        attempts++;
        const correct = i === round.answer;
        status.textContent = (correct ? 'Correcto. ' : 'Intenta otra vez. ') + round.explanation;
        if (correct) {
          for (const choice of options.children) choice.disabled = true;
          next.textContent = index + 1 === game.rounds.length ? 'Ver resultado' : 'Siguiente paso';
          next.hidden = false;
          next.focus();
        }
      };
      options.append(button);
    }
  }
  next.onclick = () => {
    index++;
    show(true);
  };
  root.querySelector('[data-trace-reset]').onclick = () => {
    index = 0;
    attempts = 0;
    show(true);
  };
  show();
}
