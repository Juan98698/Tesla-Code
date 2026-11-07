export const isPublished = (lesson) => lesson?.status === 'published';
export const lessonKey = (routeId, lessonId) => `${routeId}/${lessonId}`;
export function indexRoute(route) {
  const lessons = route.levels.flatMap((level) =>
    level.lessons.map((lesson) => ({ ...lesson, level: level.name, levelId: level.id })),
  );
  return { ...route, lessons, pos: Object.fromEntries(lessons.map((lesson, i) => [lesson.id, i])) };
}
export function missingPrerequisites(lesson, completed) {
  return (lesson.dependsOn ?? []).filter((key) => !completed.has(key));
}
// El itinerario controla el avance. El grafo académico documenta conocimientos.
// La alternativa conserva compatibilidad con catálogos anteriores y fixtures.
export function progressionRequirements(route, lesson) {
  return (
    lesson.progressionRequires ??
    (lesson.dependsOn ?? []).filter((key) => key.startsWith(`${route.id}/`))
  );
}
export function accessState(route, id, completed) {
  const lesson = route.lessons[route.pos[id]];
  if (!isPublished(lesson)) return { status: 'planned', required: [], recommended: [] };
  const missing = missingPrerequisites(lesson, completed);
  const required = progressionRequirements(route, lesson).filter((key) => !completed.has(key));
  const recommended = missing.filter((key) => !key.startsWith(`${route.id}/`));
  return {
    status: completed.has(lessonKey(route.id, id)) ? 'done' : required.length ? 'locked' : 'ready',
    required,
    recommended,
  };
}
export function isUnlocked(route, id, completed) {
  return ['ready', 'done'].includes(accessState(route, id, completed).status);
}
export function nextLesson(route, completed) {
  const available = route.lessons.filter(
    (lesson) =>
      !completed.has(lessonKey(route.id, lesson.id)) && isUnlocked(route, lesson.id, completed),
  );
  return available.find((lesson) => lesson.kind !== 'optional') ?? available[0];
}
