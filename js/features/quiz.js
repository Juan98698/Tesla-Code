import { button, span } from '../core/dom.js';
import { emit } from '../core/events.js';
import { grade, isPassing } from '../domain/grading.js';

const escapeHtml = (text) => text.replaceAll('&', '&amp;').replaceAll('<', '&lt;');
const codeBlock = (code) => `<pre>${code.split('\n').map((line) => `<div>${escapeHtml(line)}</div>`).join('')}</pre>`;

export function mountQuiz({ box, questions, onFinish }) {
  let index = 0;
  let correct = 0;
  let weak = new Set();

  function start() {
    index = 0;
    correct = 0;
    weak = new Set();
    show();
  }

  function show() {
    const q = questions[index];
    box.innerHTML = `<div class="qmeta"><span>Pregunta ${index + 1} de ${questions.length}</span><span>${correct} correctas</span></div><div class="meter"><i style="width:${(index / questions.length) * 100}%"></i></div><p class="q"></p>${q.code ? codeBlock(q.code) : ''}`;
    box.querySelector('.q').textContent = q.prompt;
    (q.type === 'order' ? showOrder : showChoice)(q);
  }

  function feedback(q, good, extra = '') {
    emit('quiz:answered', { correct: good });
    if (good) correct += 1;
    else weak.add(q.concept);
    const panel = document.createElement('div');
    panel.className = `fb ${good ? 'ok' : 'bad'}`;
    panel.setAttribute('aria-live', 'polite');
    const lead = document.createElement('b');
    lead.textContent = good ? 'Correcto. ' : 'Todavía no. ';
    panel.append(lead, `${extra}${q.explanation ?? ''}`);
    const last = index === questions.length - 1;
    const next = button(last ? 'Ver resultado' : 'Siguiente pregunta', 'btn', () => {
      index += 1;
      if (index < questions.length) show();
      else finish();
    });
    next.style.cssText = 'display:block;margin-top:10px';
    panel.append(next);
    box.append(panel);
    next.focus();
  }

  function showChoice(q) {
    const wrap = document.createElement('div');
    wrap.className = 'opts';
    q.options.forEach((text, i) => wrap.append(button(text, 'opt', () => {
      [...wrap.children].forEach((b) => { b.disabled = true; });
      const good = grade(q, i);
      wrap.children[q.answer].classList.add('ok');
      if (!good) wrap.children[i].classList.add('bad');
      feedback(q, good);
    })));
    box.append(wrap);
  }

  function showOrder(q) {
    const picked = [];
    const pool = document.createElement('div');
    pool.className = 'opts';
    const chosen = document.createElement('div');
    chosen.className = 'resp';
    chosen.setAttribute('aria-label', 'Tu orden');
    const actions = document.createElement('div');
    actions.className = 'btns';
    const paint = () => chosen.replaceChildren(
      ...(picked.length ? picked.map((t, i) => span(`${i + 1}. ${t}`, 'tag')) : [span('Toca los pasos en orden.')]),
    );
    const check = button('Comprobar orden', 'btn', () => {
      check.disabled = true;
      clear.disabled = true;
      [...pool.children].forEach((b) => { b.disabled = true; });
      const good = grade(q, picked);
      feedback(q, good, good ? '' : `El orden correcto era: ${q.steps.join(' → ')}. `);
    });
    const clear = button('Borrar', 'btn sec', () => {
      picked.length = 0;
      [...pool.children].forEach((b) => { b.disabled = false; });
      check.disabled = true;
      paint();
    });
    check.disabled = true;
    [...q.steps].sort(() => Math.random() - 0.5).forEach((text) => pool.append(button(text, 'opt', (event) => {
      picked.push(text);
      event.currentTarget.disabled = true;
      check.disabled = picked.length < q.steps.length;
      paint();
    })));
    actions.append(check, clear);
    box.append(pool, chosen, actions);
    paint();
  }

  function finish() {
    const total = questions.length;
    const passed = isPassing(correct, total);
    const pct = Math.round((correct / total) * 100);
    const { text, actions = [] } = onFinish({ correct, total, passed, weak: [...weak] });
    box.innerHTML = `<div class="res"><div class="meter"><i style="width:${pct}%"></i></div><h3>${pct}% de dominio</h3><p></p></div>`;
    const result = box.querySelector('.res');
    result.querySelector('p').textContent = text;
    result.append(button(passed ? 'Repetir el quiz' : 'Reintentar', 'btn', start));
    actions.forEach((a) => {
      const b = button(a.label, 'btn sec', a.onClick);
      b.style.marginLeft = '10px';
      result.append(b);
    });
  }

  start();
}
