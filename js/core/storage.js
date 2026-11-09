import { emptyProgress, normalizeProgress } from '../domain/progress-state.js';
import { mergeProgress } from '../domain/progress-backup.js';
export { emptyProgress, normalizeProgress } from '../domain/progress-state.js';
export const PROGRESS_KEY = 'teslacode:progress:v2';
const LEGACY = 'teslacode:progress:v1';
const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);

// Web Locks serializes read/merge/write across tabs; older hosts keep the synchronous fallback.
export function withProgressLock(operation, locks = globalThis.navigator?.locks) {
  return locks ? locks.request(PROGRESS_KEY, operation) : operation();
}

export function createProgressRepository(storage) {
  let baseline = emptyProgress();
  const read = () =>
    normalizeProgress(JSON.parse(storage.getItem(PROGRESS_KEY) || storage.getItem(LEGACY)));
  return {
    load() {
      try {
        baseline = read();
      } catch {
        baseline = emptyProgress();
      }
      return structuredClone(baseline);
    },
    save(state, { expected } = {}) {
      try {
        let current;
        try {
          current = read();
        } catch (error) {
          if (!(error instanceof SyntaxError)) throw error;
          current = emptyProgress();
        }
        if (expected && !same(current, normalizeProgress(expected))) return false;
        let next = normalizeProgress(state);
        if (!expected && !same(current, baseline)) {
          next = mergeProgress(next, current);
          // Preferences follow the local edit, or the remote value when unchanged locally.
          for (const key of ['goal', 'recent', 'learningMode'])
            if (state[key] === baseline[key]) next[key] = current[key];
          const removed = new Set(
            baseline.bookmarks.filter((key) => !state.bookmarks.includes(key)),
          );
          const added = state.bookmarks.filter((key) => !baseline.bookmarks.includes(key));
          next.bookmarks = [...new Set([...current.bookmarks, ...added])].filter(
            (key) => !removed.has(key),
          );
        }
        storage.setItem(PROGRESS_KEY, JSON.stringify(next));
        baseline = structuredClone(next);
        Object.assign(state, next);
        return true;
      } catch {
        return false;
      }
    },
  };
}
export const progressRepository = createProgressRepository({
  getItem: (key) => localStorage.getItem(key),
  setItem: (key, value) => localStorage.setItem(key, value),
});
