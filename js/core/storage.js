import { emptyProgress, normalizeProgress } from '../domain/progress-state.js';
import { rebaseProgress } from '../domain/progress-sync.js';
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
  const read = () => {
    const stored = JSON.parse(storage.getItem(PROGRESS_KEY) || storage.getItem(LEGACY));
    if (stored?.compactProjects === true)
      for (const artifact of Object.values(stored.projectArtifacts ?? {}))
        if (artifact?.assessment?.testedCode === null)
          artifact.assessment.testedCode = artifact.code;
    return normalizeProgress(stored);
  };
  return {
    load() {
      try {
        baseline = read();
      } catch {
        baseline = emptyProgress();
      }
      return structuredClone(baseline);
    },
    synchronize(state) {
      try {
        const current = read();
        const next = rebaseProgress(state, baseline, current);
        baseline = structuredClone(current);
        Object.assign(state, next);
        return true;
      } catch {
        return false;
      }
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
          next = rebaseProgress(next, baseline, current);
        }
        // Verified code is usually identical to the saved delivery. Store one copy locally.
        const projectArtifacts = Object.fromEntries(
          Object.entries(next.projectArtifacts).map(([key, artifact]) => [
            key,
            artifact.assessment?.testedCode === artifact.code
              ? { ...artifact, assessment: { ...artifact.assessment, testedCode: null } }
              : artifact,
          ]),
        );
        storage.setItem(
          PROGRESS_KEY,
          JSON.stringify({ ...next, projectArtifacts, compactProjects: true }),
        );
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
