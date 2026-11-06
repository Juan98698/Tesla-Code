export const XP = { correct: 10, lessonPassed: 50 };
export const PASS_RATIO = 0.8;
export const dayKey = (date) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
export function updateStreak(streak, today = new Date()) {
  const day = dayKey(today);
  if (streak.lastDay === day) return streak;
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  return { count: streak.lastDay === dayKey(yesterday) ? streak.count + 1 : 1, lastDay: day };
}
