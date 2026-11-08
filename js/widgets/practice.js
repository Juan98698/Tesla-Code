import { escapeHtml as e, shuffle } from '../core/html.js';
import {
  PRACTICE_TYPES,
  gradeBugLine,
  gradeChoice,
  gradeOrder,
  traceState,
} from '../domain/practice.js';

const HOW = {
  trace:
    'Primero predice el resultado. Después ejecuta el programa paso a paso y observa cómo cambian las variables.',
  predict: 'Lee el programa con calma, elige lo que mostrará y comprueba tu respuesta.',
  bug: 'Hay una línea con un error. Tócala y después elige la corrección.',
  order: 'Toca las líneas en el orden en que deben escribirse para que el programa funcione.',
};

function codeLines(list, next = -1, pick = false) {
  return list
    .map((line, i) => {
      const cls = `code-line${i === next ? ' is-next' : ''}${pick ? ' pick' : ''}`;
      const body = `<span class="ln">${i + 1}</span>${e(line)}`;
      return pick
        ? `<button type="button" class="${cls}" data-line="${i}">${body}</button>`
        : `<div class="${cls}">${body}</div>`;
    })
    .join('');
}

function frame(root, item, body) {
  root.innerHTML = `<section class="lab-widget practice-lab" data-type="${item.type}"><div class="eyebrow">${e(PRACTICE_TYPES[item.type])} · ${e(item.concept)}</div><h3>${e(item.title)}</h3><p class="lab-goal"><strong>Objetivo.</strong> ${e(item.goal)}</p><p class="lab-how">${HOW[item.type]}</p>${body}</section>`;
}

export function mountChoice(el, choice, onResult = () => {}) {
  el.innerHTML = `<p class="lab-question">${e(choice.prompt)}</p><div class="opts">${choice.options
    .map((option, i) => `<button type="button" class="opt" data-i="${i}">${e(option)}</button>`)
    .join('')}</div><p class="practice-feedback" role="status" data-feedback></p>`;
  const feedback = el.querySelector('[data-feedback]');
  el.querySelector('.opts').addEventListener('click', (event) => {
    const button = event.target.closest('[data-i]');
    if (!button || button.disabled) return;
    const ok = gradeChoice(choice, Number(button.dataset.i));
    button.classList.add(ok ? 'ok' : 'bad');
    button.disabled = true;
    if (ok)
      el.querySelectorAll('.opt').forEach((option) => {
        option.disabled = true;
      });
    feedback.className = `practice-feedback ${ok ? 'ok' : 'bad'}`;
    feedback.textContent = ok
      ? `Correcto. ${choice.explanation}`
      : 'Todavía no. Revisa el programa paso a paso e inténtalo con otra opción.';
    onResult(ok);
  });
}

function mountTrace(root, item, hooks) {
  frame(
    root,
    item,
    '<div data-predict></div><div class="lab-code" data-code tabindex="0" role="region" aria-label="Código del programa"></div><div class="memory-cells" data-vars aria-live="polite"></div><p class="practice-feedback" role="status" data-note></p><div class="btns"><button type="button" class="btn small" data-step>Ejecutar siguiente paso</button><button type="button" class="btn ghost small" data-reset>Reiniciar</button></div><div class="lab-challenge" data-challenge hidden></div>',
  );
  const q = (selector) => root.querySelector(selector);
  let done = 0;
  function resetChoices() {
    mountChoice(q('[data-predict]'), item.predict);
    mountChoice(q('[data-challenge]'), item.challenge, (ok) => ok && hooks.onSolved?.(item));
  }
  function draw() {
    const state = traceState(item, done);
    const names = Object.keys(state.vars);
    q('[data-code]').innerHTML = codeLines(item.lines, state.next ?? -1);
    q('[data-vars]').innerHTML = names.length
      ? names
          .map(
            (n) =>
              `<div class="memory-cell"><small>${e(n)}</small>${e(String(state.vars[n]))}</div>`,
          )
          .join('')
      : '<span class="lab-empty">Memoria vacía: todavía no existe ninguna variable.</span>';
    q('[data-note]').textContent =
      state.note ?? 'Pulsa «Ejecutar siguiente paso». La línea resaltada es la que se ejecutará.';
    q('[data-step]').disabled = state.finished;
    q('[data-challenge]').hidden = !state.finished;
  }
  resetChoices();
  q('[data-step]').addEventListener('click', () => {
    done += 1;
    draw();
  });
  q('[data-reset]').addEventListener('click', () => {
    done = 0;
    resetChoices();
    draw();
  });
  draw();
}

function mountPredict(root, item, hooks) {
  frame(
    root,
    item,
    `<div class="lab-code" tabindex="0" role="region" aria-label="Código del programa">${codeLines(item.lines)}</div><div data-check></div>`,
  );
  mountChoice(root.querySelector('[data-check]'), item.check, (ok) => ok && hooks.onSolved?.(item));
}

function mountBug(root, item, hooks) {
  frame(
    root,
    item,
    `<p class="lab-symptom"><strong>Síntoma.</strong> ${e(item.symptom)}</p><div class="lab-code" data-code tabindex="0" role="region" aria-label="Código del programa">${codeLines(item.lines, -1, true)}</div><p class="practice-feedback" role="status" data-note></p><div data-fix hidden></div>`,
  );
  const note = root.querySelector('[data-note]');
  const fix = root.querySelector('[data-fix]');
  root.querySelector('[data-code]').addEventListener('click', (event) => {
    const line = event.target.closest('[data-line]');
    if (!line || !fix.hidden) return;
    const ok = gradeBugLine(item, Number(line.dataset.line));
    note.className = `practice-feedback ${ok ? 'ok' : 'bad'}`;
    if (!ok) {
      note.textContent =
        'Esa línea está bien. Compara lo que debería ocurrir con lo que realmente ocurre.';
      return;
    }
    line.classList.add('is-bug');
    note.textContent = 'Encontraste la línea con el error. Ahora elige cómo corregirla.';
    fix.hidden = false;
    mountChoice(
      fix,
      {
        prompt: '¿Cuál es la corrección?',
        options: item.fixes,
        answer: item.fix,
        explanation: item.explanation,
      },
      (ok2) => ok2 && hooks.onSolved?.(item),
    );
  });
}

function mountOrder(root, item, hooks) {
  frame(
    root,
    item,
    '<div class="opts" data-pool></div><div class="lab-code" data-answer tabindex="0" role="region" aria-label="Tu programa"></div><p class="practice-feedback" role="status" data-note></p><div class="btns"><button type="button" class="btn small" data-check>Comprobar</button><button type="button" class="btn ghost small" data-clear>Borrar</button></div>',
  );
  const q = (selector) => root.querySelector(selector);
  const pool = shuffle(
    item.lines.map((text, id) => ({ text, id })),
    hooks.random,
  );
  let picked = [];
  let solved = false;
  function draw() {
    const used = new Set(picked.map((line) => line.id));
    q('[data-pool]').innerHTML = pool
      .map(
        (line) =>
          `<button type="button" class="opt code-opt" data-id="${line.id}"${used.has(line.id) || solved ? ' disabled' : ''}>${e(line.text)}</button>`,
      )
      .join('');
    q('[data-answer]').innerHTML = picked.length
      ? codeLines(picked.map((line) => line.text))
      : '<span class="lab-empty">Toca las líneas en orden.</span>';
    q('[data-check]').disabled = picked.length !== pool.length || solved;
    q('[data-clear]').disabled = solved;
  }
  q('[data-pool]').addEventListener('click', (event) => {
    const button = event.target.closest('[data-id]');
    if (!button || button.disabled) return;
    picked.push(pool.find((line) => line.id === Number(button.dataset.id)));
    draw();
  });
  q('[data-clear]').addEventListener('click', () => {
    picked = [];
    q('[data-note]').textContent = '';
    draw();
  });
  q('[data-check]').addEventListener('click', () => {
    const ok = gradeOrder(
      item,
      picked.map((line) => line.text),
    );
    const note = q('[data-note]');
    note.className = `practice-feedback ${ok ? 'ok' : 'bad'}`;
    note.textContent = ok
      ? `Correcto. ${item.explanation}`
      : 'Todavía no. Piensa qué debe existir antes de usarse y pulsa Borrar para reordenar.';
    if (ok) {
      solved = true;
      hooks.onSolved?.(item);
    }
    draw();
  });
  draw();
}

const mounters = { trace: mountTrace, predict: mountPredict, bug: mountBug, order: mountOrder };

export function mountPractice(root, item, hooks = {}) {
  mounters[item.type](root, item, hooks);
}
