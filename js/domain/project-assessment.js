import { grade } from './grading.js';

export function executionObservation(result, callable = false) {
  return callable ? JSON.stringify([result.stdout, result.actual]) : result.stdout;
}

export function projectAssessmentReady(activity, record) {
  if (!activity.assessment) return true;
  const proof = record?.assessment,
    rule = activity.assessment;
  if (
    !record?.verifiedAt ||
    proof?.version !== 2 ||
    proof.testedCode !== record.code ||
    !record.notes?.trim() ||
    proof.reflection !== record.notes ||
    proof.reviewStatus !== 'pending' ||
    proof.technical?.passed !== true ||
    proof.technical.cases !== (activity.cases?.length ?? activity.decisions.length)
  )
    return false;
  if (!(rule.questions ?? []).every((q) => grade(q, proof.responses?.[q.id]))) return false;
  if (
    rule.debug &&
    (!proof.debug?.failed ||
      proof.debug.fixture !== rule.debug.id ||
      typeof proof.debug.stdout !== 'string' ||
      typeof proof.debug.error !== 'string')
  )
    return false;
  if (rule.rewrite) {
    const comparison = proof.rewrite;
    const count = activity.cases.filter((c) => !c.overrides).length;
    if (
      comparison?.passed !== true ||
      (activity.entrypoint !== undefined && comparison.kind !== 'return-and-stdout') ||
      !Array.isArray(comparison?.before) ||
      !Array.isArray(comparison?.after) ||
      comparison?.source !== activity.learningStep.from ||
      comparison.before?.length !== count ||
      comparison.after?.length !== count ||
      !comparison.before.every((value, i) => value === comparison.after[i])
    )
      return false;
  }
  return true;
}
