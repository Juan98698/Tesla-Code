import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { emptyProgress } from '../js/core/storage.js';
import { recordAttempt, completeIfReady } from '../js/domain/progress.js';
import { indexRoute, isUnlocked } from '../js/domain/curriculum.js';

const read = (path) => JSON.parse(readFileSync(path, 'utf8'));
const route = indexRoute(read('content/curriculum/fundamentos.json'));
const module = route.levels.find((level) => level.id === 'primeros-pasos');
test('new learners need every practice while published completions retain their access and XP', () => {
  const state = emptyProgress();
  for (const meta of module.lessons) {
    const key = `fundamentos/${meta.id}`,
      data = read(`content/lessons/${key}.json`);
    assert.equal(isUnlocked(route, meta.id, new Set(state.completed)), true);
    recordAttempt(
      state,
      key,
      data.quiz.map((q) => ({ id: q.id, concept: q.concept, correct: true })),
    );
    state.practices.push(`${key}/aplicar`);
    assert.equal(completeIfReady(state, key, data), false);
    for (const activity of data.activities.slice(1)) state.practices.push(`${key}/${activity.id}`);
    assert.equal(completeIfReady(state, key, data), true);
    const previous = {
      ...emptyProgress(),
      completed: [key],
      practices: [`${key}/aplicar`],
      xp: 90,
    };
    assert.equal(completeIfReady(previous, key, data), true);
    assert.equal(previous.xp, 90);
    assert.equal(isUnlocked(route, meta.id, new Set(previous.completed)), true);
  }
});
