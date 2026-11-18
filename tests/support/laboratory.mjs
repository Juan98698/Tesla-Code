import { readFileSync } from 'node:fs';
import { indexRoute } from '../../js/domain/curriculum.js';
import { emptyProgress } from '../../js/domain/progress-state.js';

const read = (path) => JSON.parse(readFileSync(path, 'utf8'));
export const catalog = read('content/practice/items.json');
const routes = read('content/curriculum/index.json').routes.map((id) =>
  indexRoute(read(`content/curriculum/${id}.json`)),
);
export function labContext(overrides = {}) {
  return {
    state: emptyProgress(),
    routes,
    isSolved: () => false,
    solve() {},
    mountWidget() {},
    ...overrides,
  };
}
