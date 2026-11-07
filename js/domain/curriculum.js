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
// El grafo conserva los requisitos académicos. Solo los pasos de la propia
// ruta condicionan el acceso; conocer otra especialidad no exige cursarla aquí.
export function accessState(route, id, completed) {
  const lesson = route.lessons[route.pos[id]];
  if (!isPublished(lesson)) return { status: 'planned', required: [], recommended: [] };
  const missing = missingPrerequisites(lesson, completed);
  const required = missing.filter((key) => key.startsWith(`${route.id}/`));
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
  return route.lessons.find(
    (lesson) =>
      !completed.has(lessonKey(route.id, lesson.id)) && isUnlocked(route, lesson.id, completed),
  );
}
