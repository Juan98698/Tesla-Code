import { escapeHtml as e } from '../core/html.js';
import { isPublished, isUnlocked, lessonKey } from '../domain/curriculum.js';
import { lessonHref, editionNotice } from './catalog.js';
import { supportPanel } from './learning-support.js';
export { mountActivities } from './activities.js';
export function lessonPage(route, meta, data, state, tab, concepts = new Map()) {
  const key = lessonKey(route.id, meta.id),
    done = state.completed.includes(key);
  return `<div class="page lesson-layout"><details class="lesson-outline"><summary>Contenido de la ruta <span>→</span></summary><div class="outline-content"><a class="text-link" href="#/ruta/${route.id}${route.archivedEdition ? '/archivo' : ''}">← Mapa de la ruta</a><h2>${e(route.name)}</h2>${route.levels
    .map(
      (lv) =>
        `<details ${lv.id === meta.levelId ? 'open' : ''}><summary>${e(lv.name)}</summary>${lv.lessons
          .map((l) => {
            const available = isUnlocked(route, l.id, new Set(state.completed));
            return `<a href="${available ? lessonHref(route.id, l.id) : `#/ruta/${route.id}/${l.id}`}" ${l.id === meta.id ? 'aria-current="step"' : ''}><span aria-hidden="true">${state.completed.includes(lessonKey(route.id, l.id)) ? '✓' : available ? '▷' : isPublished(l) ? '⌑' : '○'}</span>${e(l.title)}</a>`;
          })
          .join('')}</details>`,
    )
    .join(
      '',
    )}</div></details><article class="lesson-main">${route.archivedEdition ? editionNotice(route) : ''}<div class="lesson-heading"><div><div class="eyebrow">${e(route.name)} / ${e(meta.level)}</div><h1>${e(meta.title)}</h1><span class="badge">◷ ${meta.minutes} min orientativos</span> <span class="badge ${done ? 'live' : ''}" id="lesson-status">${done ? '✓ Completada' : 'Aprende · Practica · Comprueba'}</span></div><button class="icon-button" id="bookmark" aria-label="Guardar lección" aria-pressed="${state.bookmarks.includes(key)}">${state.bookmarks.includes(key) ? '★' : '☆'}</button></div><div class="lesson-tabs" role="tablist" aria-label="Etapas de aprendizaje">${[
    ['aprender', '01', 'Aprender'],
    ['practicar', '02', 'Practicar'],
    ['comprobar', '03', 'Comprobar'],
  ]
    .map(
      ([id, n, name]) =>
        `<button role="tab" class="lesson-tab" id="tab-${id}" aria-controls="lesson-panel" aria-selected="${tab === id}" tabindex="${tab === id ? 0 : -1}" data-tab="${id}">${n} ${name}</button>`,
    )
    .join(
      '',
    )}</div>${supportPanel(route, meta, concepts)}<div id="lesson-panel" role="tabpanel" aria-labelledby="tab-${tab}">${tab === 'aprender' ? `<div class="outcome"><strong>Tu objetivo</strong><br>${e(data.outcome)}</div><div class="tags" style="margin-bottom:22px">${meta.concepts.map((c) => `<span class="tag">${e(c)}</span>`).join('')}</div><a class="experience-shortcut text-link" href="${lessonHref(route.id, meta.id, 'practicar')}">¿Ya conoces el tema? Ve a la práctica →</a><section id="lesson-audio" class="lesson-audio" aria-label="Lectura de la teoría"><p class="muted" role="status">Preparando lectura en voz alta…</p></section><div id="lesson" class="lesson-content">${data.html}</div>${data.widget && data.widget.endsWith('-lab') ? `<div id="lesson-widget"></div>` : ''}${data.sources?.length ? `<div class="callout">Para profundizar: ${data.sources.map((s) => `<a class="text-link" href="${e(s.url)}" target="_blank" rel="noopener noreferrer">${e(s.title)} →</a>`).join(' · ')}</div>` : ''}<div class="lesson-footer"><p>Ahora prueba la idea con tus propias respuestas.</p><a class="btn" href="${lessonHref(route.id, meta.id, 'practicar')}">Llévalo a la práctica →</a></div>` : tab === 'practicar' ? `<div class="outcome">Resuelve las actividades antes de completar la lección. Puedes pedir una pista y volver a intentarlo; aquí se aprende haciendo.</div><div id="activities"></div>${route.id === 'fundamentos' && route.pos[meta.id] >= route.pos.variables ? '<div data-lab="runner"></div>' : ''}<div class="lesson-footer"><p id="practice-summary"></p><a class="btn" href="${lessonHref(route.id, meta.id, 'comprobar')}">Comprobar lo aprendido →</a></div>` : `<div class="outcome">Necesitas al menos 80 % y la práctica resuelta para completar esta lección. Las opciones y preguntas cambian de orden; razona cada respuesta.</div><div class="card quiz-card" id="qbox"></div><div id="completion-info" role="status"></div>`}</div></article></div>`;
}
