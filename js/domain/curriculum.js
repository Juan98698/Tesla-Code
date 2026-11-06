export const isPublished = (lesson) => lesson.status === 'published';

export function indexRoute(route) {
  const lessons = route.levels.flatMap((level) => level.lessons.map((lesson) => ({ ...lesson, level: level.name })));
  const pos = Object.fromEntries(lessons.map((lesson, i) => [lesson.id, i]));
  return { ...route, lessons, pos };
}

// Una lección se abre al aprobar la lección publicada anterior de la ruta.
export function isUnlocked(route, id, completed) {
  const i = route.pos[id];
  if (!isPublished(route.lessons[i])) return false;
  for (let k = i - 1; k >= 0; k -= 1) {
    if (isPublished(route.lessons[k])) return completed.has(route.lessons[k].id);
  }
  return true;
}

export const nextPublished = (route, id) => route.lessons.slice(route.pos[id] + 1).find(isPublished);

export function nextMessage(route, id) {
  const current = route.lessons[route.pos[id]];
  const next = route.lessons[route.pos[id] + 1];
  if (!next) return `Completaste la ruta ${route.name}.`;
  const levelDone = next.level !== current.level ? `Completaste el nivel ${current.level}. ` : '';
  const n = route.pos[next.id] + 1;
  return levelDone + (isPublished(next)
    ? `Se desbloquea la lección ${n}: ${next.title}.`
    : `La siguiente lección, ${n}: ${next.title}, llega pronto.`);
}
