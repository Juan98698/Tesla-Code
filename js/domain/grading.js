import { PASS_RATIO } from './gamification.js';
const normalize = (value) =>
  String(value).trim().normalize('NFC').toLocaleLowerCase('es').replace(/\s+/g, ' ');
const graders = {
  choice: (q, response) => response === q.answer,
  order: (q, response) =>
    Array.isArray(response) &&
    response.length === q.steps.length &&
    response.every((value, i) => value === q.steps[i]),
  text: (q, response) => q.answers.some((answer) => normalize(answer) === normalize(response)),
};
export const grade = (q, response) => Boolean(graders[q.type]?.(q, response));
export const isPassing = (correct, total) => total > 0 && correct / total >= PASS_RATIO;
