import { escapeHtml as e } from '../core/html.js';
import { PRACTICE_TYPES, TOPICS, filterPractice } from '../domain/practice.js';
import { loadPractice } from '../repositories/content-repository.js';
import { mountPractice } from './practice.js';

export async function mount(el, ctx, load = loadPractice) {
  const items = await load();
  const filters = { type: 'all', topic: 'all' };
  const solved = (id) => ctx?.isSolved(id) ?? false;
  const badge = '<span class="badge live">Resuelta</span>';
  const chip = (group, key, label) => {
    const next = { ...filters, [group]: key };
    const total = filterPractice(items, next.type, next.topic).length;
    return `<button type="button" class="practice-chip" data-group="${group}" data-value="${key}" aria-pressed="${filters[group] === key}">${e(label)} <span>${total}</span></button>`;
  };
  const group = (name, label, entries) =>
    `<div class="practice-filters" role="group" aria-label="${label}">${chip(name, 'all', 'Todo')}${Object.entries(
      entries,
    )
      .map(([key, text]) => chip(name, key, text))
      .join('')}</div>`;
  const card = (item) =>
    `<article class="card practice-card" data-id="${e(item.id)}"><div class="eyebrow">${e(PRACTICE_TYPES[item.type])} · ${e(TOPICS[item.topic])}</div><h3>${e(item.title)}</h3><p>${e(item.goal)}</p><div class="practice-meta"><span>${item.minutes} min</span><span>${e(item.level)}</span><span>${e(item.concept)}</span>${solved(item.id) ? badge : ''}</div><button type="button" class="btn small" data-open aria-expanded="false">Practicar</button><div class="practice-body" hidden></div></article>`;
  const shown = () => filterPractice(items, filters.type, filters.topic);
  const count = () =>
    `${shown().filter((item) => solved(item.id)).length} de ${shown().length} resueltas`;
  function draw() {
    el.innerHTML = `${group('type', 'Filtrar por tipo', PRACTICE_TYPES)}${group('topic', 'Filtrar por tema', TOPICS)}<p class="practice-count" role="status">${count()}</p><div class="practice-list">${shown().map(card).join('')}</div>`;
  }
  el.addEventListener('click', (event) => {
    const filter = event.target.closest('[data-group]');
    if (filter) {
      filters[filter.dataset.group] = filter.dataset.value;
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
