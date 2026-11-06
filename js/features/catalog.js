import { isPublished, isUnlocked } from '../domain/curriculum.js';

const writtenCount = (route) => route.lessons.filter(isPublished).length;

export function renderRouteMap(routes) {
  return routes.map((route) => {
    const written = writtenCount(route);
    const nodes = route.levels
      .map((level) => `<li${level.lessons.some(isPublished) ? ' class="act"' : ''}>${level.name}</li>`)
      .join('');
    return `<article class="ruta${written ? ' on' : ''}"><h3>${route.name}<small>${route.lessons.length} lecciones · ${written ? `${written} escritas` : 'Temario disponible'}</small></h3><p>${route.description}</p><ol class="nodos">${nodes}</ol><button class="btn sec btn-sm" type="button" data-route="${route.id}">Ver temario</button></article>`;
  }).join('');
}

export const renderTabs = (routes, activeId) => routes
  .map((r) => `<button class="tab" type="button" role="tab" data-route="${r.id}" aria-selected="${r.id === activeId}">${r.name}</button>`)
  .join('');

export const renderRouteInfo = (route) =>
  `<p class="lead"><b>${route.description}</b><br>Requisitos: ${route.prerequisites}<br>Tecnologías: ${route.technologies.join(', ')}<br>Revisión del temario: ${route.reviewed}.</p>`;

function lessonAction(route, lesson, completed) {
  if (!isPublished(lesson)) return '<span class="soon">Próximamente</span>';
  const open = isUnlocked(route, lesson.id, completed);
  const label = completed.has(lesson.id) ? 'Repasar' : open ? 'Empezar' : 'Bloqueada';
  return `<button class="btn sec btn-sm" type="button" data-lesson="${lesson.id}"${open ? '' : ' disabled'}>${label}</button>`;
}

export function renderSyllabus(route, completed) {
  return route.levels.map((level, li) => {
    const done = level.lessons.filter((l) => completed.has(l.id)).length;
    const rows = level.lessons.map((lesson) => `<li class="lec"><div><b>${route.pos[lesson.id] + 1}. ${lesson.title}</b><small>${lesson.concepts.join(', ')}</small></div>${lessonAction(route, lesson, completed)}</li>`).join('');
    return `<details${li === 0 ? ' open' : ''}><summary><b>${level.name}</b><small>${done} de ${level.lessons.length} completadas</small></summary><p class="obj">${level.objective}</p><ul class="tl">${rows}</ul></details>`;
  }).join('');
}
