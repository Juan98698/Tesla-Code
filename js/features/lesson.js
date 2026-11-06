import { $ } from '../core/dom.js';
import { loadLesson } from '../repositories/content-repository.js';
import { widgets } from '../widgets/index.js';

const tag = (text, isNew = false) => `<span class="tag${isNew ? ' new' : ''}">${text}</span>`;

export async function renderLesson(route, meta) {
  const root = $('lesson');
  root.innerHTML = '<p class="lead">Cargando lección…</p>';
  const data = await loadLesson(route.id, meta.id);
  const seen = data.requires.length ? `<span>Ya viste:</span>${data.requires.map((t) => tag(t)).join('')}` : '';
  root.innerHTML = `<h2>${meta.title}</h2><p class="lead">${route.name} · ${meta.level} · Lección ${route.pos[meta.id] + 1}</p><div class="tags">${seen}<span>Aprenderás:</span>${meta.concepts.map((t) => tag(t, true)).join('')}</div>${data.html}`;
  if (data.widget) (await widgets[data.widget]()).mount(root);
  return data;
}
