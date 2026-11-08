import { escapeHtml as e } from '../core/html.js';
import { PRACTICE_TYPES, filterPractice } from '../domain/practice.js';
import { loadPractice } from '../repositories/content-repository.js';
import { mountPractice } from './practice.js';

export async function mount(el, ctx, load = loadPractice) {
  const items = await load();
  let type = 'all';
  const solved = (id) => ctx?.isSolved(id) ?? false;
  const chip = (key, label) =>
    `<button type="button" class="practice-chip" data-filter="${key}" aria-pressed="${type === key}">${e(label)} <span>${filterPractice(items, key).length}</span></button>`;
  const badge = '<span class="badge live">Resuelta</span>';
  const card = (item) =>
    `<article class="card practice-card" data-id="${e(item.id)}"><div class="eyebrow">${e(PRACTICE_TYPES[item.type])} · ${e(item.level)}</div><h3>${e(item.title)}</h3><p>${e(item.goal)}</p><div class="practice-meta"><span>${item.minutes} min</span><span>${e(item.concept)}</span>${solved(item.id) ? badge : ''}</div><button type="button" class="btn small" data-open aria-expanded="false">Practicar</button><div class="practice-body" hidden></div></article>`;
  const count = () => {
    const shown = filterPractice(items, type);
    return `${shown.filter((item) => solved(item.id)).length} de ${shown.length} resueltas`;
  };
  function draw() {
    el.innerHTML = `<div class="practice-filters" role="group" aria-label="Filtrar por tipo">${chip('all', 'Todo')}${Object.entries(
      PRACTICE_TYPES,
    )
      .map(([key, label]) => chip(key, label))
      .join(
        '',
      )}</div><p class="practice-count" role="status">${count()}</p><div class="practice-list">${filterPractice(items, type).map(card).join('')}</div>`;
  }
  el.addEventListener('click', (event) => {
    const filter = event.target.closest('[data-filter]');
    if (filter) {
      type = filter.dataset.filter;
      draw();
      return;
    }
    const open = event.target.closest('[data-open]');
    if (!open) return;
    const cardEl = open.closest('.practice-card');
    const body = cardEl.querySelector('.practice-body');
    const expanded = open.getAttribute('aria-expanded') === 'true';
    open.setAttribute('aria-expanded', String(!expanded));
    open.textContent = expanded ? 'Practicar' : 'Cerrar';
    body.hidden = expanded;
    if (expanded || body.childElementCount) return;
    const item = items.find((candidate) => candidate.id === cardEl.dataset.id);
    mountPractice(body, item, {
      onSolved: () => {
        ctx?.solve(item.id);
        if (!cardEl.querySelector('.badge'))
          cardEl.querySelector('.practice-meta').insertAdjacentHTML('beforeend', badge);
        el.querySelector('.practice-count').textContent = count();
      },
    });
  });
  draw();
}
