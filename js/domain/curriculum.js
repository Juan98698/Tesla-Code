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
export function isUnlocked(route, id, completed) {
  const lesson = route.lessons[route.pos[id]];
  return (
    isPublished(lesson) &&
    (completed.has(lessonKey(route.id, id)) || missingPrerequisites(lesson, completed).length === 0)
  );
}
export function nextLesson(route, completed) {
  return route.lessons.find(
    (lesson) =>
      !completed.has(lessonKey(route.id, lesson.id)) && isUnlocked(route, lesson.id, completed),
  );
}
