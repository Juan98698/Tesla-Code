import { XP, updateStreak } from './gamification.js';
export function recordAttempt(state, key, results, now = new Date()) {
  const score = Math.round((results.filter((r) => r.correct).length / results.length) * 100);
  const record = state.lessons[key] ?? { attempts: [], best: 0 };
  record.attempts.push({ at: now.toISOString(), score, results });
  record.attempts = record.attempts.slice(-20);
  record.best = Math.max(record.best, score);
  state.lessons[key] = record;
  for (const result of results.filter((r) => r.correct)) {
    const reward = `${key}/${result.id}`;
    if (!state.rewards.includes(reward)) {
      state.rewards.push(reward);
      state.xp += XP.correct;
    }
  }
  state.streak = updateStreak(state.streak, now);
  return score;
}
export function completeIfReady(state, key, data) {
  if (state.completed.includes(key)) return true;
  if (
    (state.lessons[key]?.best ?? 0) < 80 ||
    !data.activities.every((a) => state.practices.includes(`${key}/${a.id}`))
  )
    return false;
  state.completed.push(key);
  state.xp += XP.lessonPassed;
  return true;
}
export function conceptEvidence(state) {
  const evidence = new Map();
  for (const record of Object.values(state.lessons)) {
    const latest = record.attempts?.at(-1);
    for (const result of latest?.results ?? []) {
      const item = evidence.get(result.concept) ?? { correct: 0, total: 0 };
      item.total += 1;
      item.correct += Number(result.correct);
      evidence.set(result.concept, item);
    }
  }
  return evidence;
}
