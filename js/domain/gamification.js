export const XP = { correct: 10, lessonPassed: 50 };
export const PASS_RATIO = 0.8;

const dayKey = (date) => date.toISOString().slice(0, 10);

// La racha cuenta días consecutivos con actividad.
export function updateStreak(streak, today = new Date()) {
  const day = dayKey(today);
  if (streak.lastDay === day) return streak;
  const yesterday = new Date(today);
  yesterday.setUTCDate(yesterday.getUTCDate() - 1);
  return { count: streak.lastDay === dayKey(yesterday) ? streak.count + 1 : 1, lastDay: day };
}
