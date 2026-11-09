export const emptyProgress = () => ({
  version: 2,
  xp: 0,
  streak: { count: 0, lastDay: null },
  completed: [],
  lessons: {},
  practices: [],
  rewards: [],
  bookmarks: [],
  recent: null,
  goal: 'fundamentos',
  learningMode: 'guided',
});
export function normalizeProgress(raw) {
  const base = emptyProgress();
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return base;
  for (const key of ['completed', 'practices', 'rewards', 'bookmarks'])
    base[key] = Array.isArray(raw[key])
      ? [...new Set(raw[key].filter((x) => typeof x === 'string'))]
      : [];
  base.xp = Number.isFinite(raw.xp) && raw.xp >= 0 ? raw.xp : 0;
  base.lessons = Object.fromEntries(
    Object.entries(raw.lessons && typeof raw.lessons === 'object' ? raw.lessons : {})
      .filter(
        ([key, value]) =>
          key.includes('/') && value && typeof value === 'object' && Array.isArray(value.attempts),
      )
      .map(([key, value]) => [
        key,
        {
          best: Number.isFinite(value.best) ? Math.max(0, Math.min(100, value.best)) : 0,
          attempts: value.attempts
            .filter((a) => a && Number.isFinite(a.score) && Array.isArray(a.results))
            .slice(-20)
            .map((a) => ({
              score: Math.max(0, Math.min(100, a.score)),
              at: typeof a.at === 'string' ? a.at : null,
              results: a.results.filter(
                (r) =>
                  r &&
                  typeof r.id === 'string' &&
                  typeof r.concept === 'string' &&
                  typeof r.correct === 'boolean',
              ),
            })),
        },
      ]),
  );
  if (
    raw.streak &&
    Number.isInteger(raw.streak.count) &&
    raw.streak.count >= 0 &&
    /^\d{4}-\d{2}-\d{2}$/.test(raw.streak.lastDay)
  )
    base.streak = raw.streak;
  if (typeof raw.recent === 'string') base.recent = raw.recent;
  if (typeof raw.goal === 'string') base.goal = raw.goal;
  if (['guided', 'experienced'].includes(raw.learningMode)) base.learningMode = raw.learningMode;
  return base;
}
