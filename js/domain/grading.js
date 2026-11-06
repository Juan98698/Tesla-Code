import { PASS_RATIO } from './gamification.js';

// Strategy: un corrector por tipo de pregunta. Para añadir un tipo, añade una entrada.
const graders = {
  choice: (question, response) => response === question.answer,
  order: (question, response) => response.join('|') === question.steps.join('|'),
};

export const grade = (question, response) => graders[question.type](question, response);
export const isPassing = (correct, total) => correct / total >= PASS_RATIO;
