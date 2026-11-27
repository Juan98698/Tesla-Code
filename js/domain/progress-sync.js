import { emptyProgress, normalizeProgress } from './progress-state.js';
import { mergeProgress } from './progress-backup.js';
import { XP, updateStreak } from './gamification.js';

const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);
const ledgerXP = (state) =>
  state.completed.length * XP.lessonPassed + state.rewards.length * XP.correct;

// Unlike importing a backup, synchronization carries only edits since this tab's
// last persisted snapshot. Unchanged records must not undo a remote restoration.
export function rebaseProgress(localValue, baselineValue, remoteValue) {
  const local = normalizeProgress(localValue),
    baseline = normalizeProgress(baselineValue),
    remote = normalizeProgress(remoteValue),
    delta = emptyProgress();
  for (const key of ['completed', 'practices', 'rewards', 'bookmarks']) {
    const previous = new Set(baseline[key]);
    delta[key] = local[key].filter((value) => !previous.has(value));
  }
  for (const [key, record] of Object.entries(local.lessons)) {
    const previous = baseline.lessons[key];
    const known = new Set(previous?.attempts.map((attempt) => JSON.stringify(attempt)));
    const attempts = record.attempts.filter((attempt) => !known.has(JSON.stringify(attempt)));
    const improved = record.best > (previous?.best ?? 0);
    if (attempts.length || improved)
      delta.lessons[key] = {
        attempts,
        best: Math.max(improved ? record.best : 0, ...attempts.map((attempt) => attempt.score)),
      };
  }
  for (const [key, artifact] of Object.entries(local.projectArtifacts)) {
    const previous = baseline.projectArtifacts[key];
    if (same(artifact, previous)) continue;
    const changedDelivery = ['code', 'report', 'verifiedAt', 'assessment'].some(
      (field) => !same(artifact[field], previous?.[field]),
    );
    const incoming = remote.projectArtifacts[key];
    // Editing a note must not bring back code/evidence removed by Undo.
    const delivery = changedDelivery ? artifact : incoming;
    delta.projectArtifacts[key] = {
      project: artifact.project,
      code: delivery?.code ?? '',
      report: delivery?.report ?? '',
      verifiedAt: delivery?.verifiedAt ?? null,
      ...(delivery?.assessment ? { assessment: delivery.assessment } : {}),
      notes: artifact.notes !== previous?.notes ? artifact.notes : (incoming?.notes ?? ''),
      updatedAt: artifact.updatedAt,
    };
  }
  const learning =
    delta.completed.length || delta.practices.length || Object.keys(delta.lessons).length;
  if (learning && local.streak.lastDay && local.streak.lastDay >= (remote.streak.lastDay ?? ''))
    delta.streak = updateStreak(remote.streak, new Date(local.streak.lastDay + 'T12:00:00'));
  const next = mergeProgress(remote, delta);
  const removed = new Set(baseline.bookmarks.filter((key) => !local.bookmarks.includes(key)));
  next.bookmarks = next.bookmarks.filter((key) => !removed.has(key));
  next.xp =
    remote.xp +
    ledgerXP(next) -
    ledgerXP(remote) +
    Math.max(0, local.xp - baseline.xp - ledgerXP(local) + ledgerXP(baseline));
  for (const key of ['goal', 'recent', 'learningMode'])
    next[key] = local[key] !== baseline[key] ? local[key] : remote[key];
  return next;
}
