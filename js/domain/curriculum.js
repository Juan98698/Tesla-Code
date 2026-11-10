export const isPublished = (lesson) => lesson?.status === 'published';
export const lessonKey = (routeId, lessonId) => `${routeId}/${lessonId}`;
export function indexRoute(route) {
  const levels = route.currentEdition
    ? route.levels.filter((level) => level.edition === route.currentEdition)
    : route.levels;
  const lessons = levels.flatMap((level) =>
    level.lessons.map((lesson) => ({ ...lesson, level: level.name, levelId: level.id })),
  );
  const indexed = {
    ...route,
    levels,
    lessons,
    pos: Object.fromEntries(lessons.map((lesson, i) => [lesson.id, i])),
  };
  if (route.currentEdition)
    indexed.archive = indexRoute({
      ...route,
      ...route.legacy,
      currentEdition: undefined,
      levels: route.levels.filter((level) => level.edition !== route.currentEdition),
      archivedEdition: true,
    });
  return indexed;
}
export const routeEdition = (route, id) =>
  route?.archive && (id === 'archivo' || Object.hasOwn(route.archive.pos, id))
    ? route.archive
    : route;
export const includeArchives = (routes) =>
  routes.flatMap((route) => (route.archive ? [route, route.archive] : [route]));
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
