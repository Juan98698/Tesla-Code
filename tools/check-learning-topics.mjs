import { readFileSync } from 'node:fs';
import { indexRoute } from '../js/domain/curriculum.js';
import { guideErrors, topicIndex } from '../js/domain/topics.js';
import { javascriptExerciseErrors } from '../js/domain/javascript-exercise.js';
import { mathCoverageErrors, editorialCoverageErrors } from './learning-content-audit.mjs';

const read = (path) => JSON.parse(readFileSync(path, 'utf8'));
const route = indexRoute(read('content/curriculum/fundamentos.json'));
const catalog = read('content/learning/javascript-guides.json');
const { guides, workshops, walkthroughs, searchTerms } = catalog;
const errors = guideErrors(guides, route);
errors.push(...mathCoverageErrors(catalog));
errors.push(...editorialCoverageErrors(catalog));
const topics = topicIndex(route, guides, searchTerms);
if (new Set(topics.map((topic) => topic.id)).size !== topics.length)
  errors.push('Hay temas repetidos.');
for (const [id, item] of [
  ...guides.map((guide) => [guide.id, guide]),
  ...Object.entries(workshops),
]) {
  for (const key of ['guided', 'bug', 'challenge']) {
    if (!item[key]) continue;
    errors.push(...javascriptExerciseErrors(item[key]).map((error) => `${id}/${key}: ${error}`));
  }
  for (const activity of item.practices ?? [])
    errors.push(
      ...javascriptExerciseErrors(activity).map((error) => `${id}/${activity.id}: ${error}`),
    );
}
for (const [id, steps] of Object.entries(walkthroughs)) {
  const lesson = read(`content/lessons/fundamentos/${id}.json`);
  const lines = lesson.examples[0].code.split('\n').length;
  if (
    steps.some(
      (step) =>
        !Number.isInteger(step.line) ||
        step.line < 1 ||
        step.line > lines ||
        !step.state ||
        !step.explanation,
    )
  )
    errors.push(`Traza inválida: ${id}`);
}
if (errors.length) throw Error(errors.join('\n'));
console.log(
  `✓ ${topics.length} temas consultables: ${guides.length} fichas complementarias y ${topics.length - guides.length} lecciones reutilizadas.`,
);
