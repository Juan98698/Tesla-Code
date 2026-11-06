import { $ } from '../core/dom.js';
import { emit, on } from '../core/events.js';
import { progressRepository } from '../core/storage.js';
import { XP, updateStreak } from '../domain/gamification.js';

const state = progressRepository.load();
const key = (routeId, lessonId) => `${routeId}/${lessonId}`;

export const completedFor = (routeId) =>
  new Set(state.completed.filter((k) => k.startsWith(`${routeId}/`)).map((k) => k.split('/')[1]));

function render() {
  $('xp').textContent = `${state.xp} XP`;
  const days = state.streak.count;
  $('racha').textContent = `Racha: ${days} ${days === 1 ? 'día' : 'días'}`;
}

function commit() {
  progressRepository.save(state);
  render();
  emit('progress:changed');
}

export function initGamification() {
  on('quiz:answered', ({ correct }) => {
    state.streak = updateStreak(state.streak);
    if (correct) state.xp += XP.correct;
    commit();
  });
  on('quiz:passed', ({ routeId, lessonId }) => {
    if (state.completed.includes(key(routeId, lessonId))) return;
    state.completed.push(key(routeId, lessonId));
    state.xp += XP.lessonPassed;
    commit();
  });
  render();
}
