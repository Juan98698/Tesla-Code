import assert from 'node:assert/strict';
import { runJavaScript, runJavaScriptAsync } from './javascript.mjs';
import { executionObservation } from '../../js/domain/project-assessment.js';
import { caseStudyReport } from '../../js/domain/case-study.js';

const commonCases = (a) =>
  a.cases.filter((c) => !c.overrides).map(({ expectedBindings, consoleArguments, ...c }) => c);

function buildWork(a, results, observed, before) {
  const code = a.solution ?? '';
  if (results)
    assert.ok(
      results.every((result) => result.passed),
      a.id,
    );
  const responses = Object.fromEntries(
    a.assessment.questions.map((q) => [q.id, q.type === 'choice' ? q.answer : q.answers[0]]),
  );
  const proof = {
    version: 2,
    responses,
    reflection:
      'Predicción, traza y justificación entregadas en una prueba técnica. Pendiente de revisión humana.',
    testedCode: code,
    reviewStatus: 'pending',
    technical: { passed: true, cases: a.cases?.length ?? a.decisions.length },
  };
  if (observed) {
    proof.debug = {
      fixture: a.assessment.debug.id,
      failed: observed.some((r) => !r.passed),
      stdout: observed.map((r) => r.stdout).join('\n'),
      error: observed.map((r) => r.error ?? '').join('\n'),
    };
    assert.equal(proof.debug.failed, true, a.id + ' incident');
  }
  if (before) {
    proof.rewrite = {
      source: a.learningStep.from,
      kind: a.entrypoint ? 'return-and-stdout' : 'stdout',
      passed: before.every((r) => r.passed),
      before: before.map((r) => executionObservation(r, Boolean(a.entrypoint))),
      after: results
        .filter((_, i) => !a.cases[i].overrides)
        .map((r) => executionObservation(r, Boolean(a.entrypoint))),
    };
    assert.ok(proof.rewrite.passed, a.id + ' baseline');
  }
  const decisions = Object.fromEntries((a.decisions ?? []).map((q) => [q.id, q.answer]));
  return {
    code,
    report: a.type === 'case-study' ? caseStudyReport(a, decisions) : '',
    notes: proof.reflection,
    verifiedAt: '2026-11-16T16:00:00.000Z',
    assessment: proof,
  };
}

function jobs(a, previous) {
  const d = a.assessment.debug;
  return [
    a.cases?.map((c) => [a.solution, c, false, a.entrypoint, a.bindings, a.syntax]),
    d?.cases.map((c) => [d.code, c, false, d.entrypoint, d.bindings]),
    a.assessment.rewrite
      ? commonCases(a).map((c) => [previous, c, false, a.entrypoint])
      : undefined,
  ];
}

export function verifiedWork(a, previous) {
  return buildWork(
    a,
    ...jobs(a, previous).map((batch) => batch?.map((job) => runJavaScript(...job).result)),
  );
}

export async function verifiedWorkAsync(a, previous) {
  const observations = [];
  for (const batch of jobs(a, previous)) {
    const results = batch && (await Promise.all(batch.map((job) => runJavaScriptAsync(...job))));
    observations.push(results?.map((job) => job.result));
  }
  return buildWork(a, ...observations);
}
