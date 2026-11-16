import assert from 'node:assert/strict';
import { runJavaScript } from './javascript.mjs';
import { executionObservation } from '../../js/domain/project-assessment.js';
import { caseStudyReport } from '../../js/domain/case-study.js';
export function verifiedWork(a, previous) {
  const code = a.solution ?? '';
  const results = a.cases?.map(
    (c) => runJavaScript(code, c, false, a.entrypoint, a.bindings, a.syntax).result,
  );
  if (results)
    assert.ok(
      results.every((r) => r.passed),
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
  if (a.assessment.debug) {
    const f = a.assessment.debug,
      observed = f.cases.map((c) => runJavaScript(f.code, c, false, f.entrypoint).result);
    proof.debug = {
      fixture: f.id,
      failed: observed.some((r) => !r.passed),
      stdout: observed.map((r) => r.stdout).join('\n'),
      error: observed.map((r) => r.error ?? '').join('\n'),
    };
    assert.equal(proof.debug.failed, true, a.id + ' incident');
  }
  if (a.assessment.rewrite) {
    const common = a.cases
      .filter((c) => !c.overrides)
      .map(({ expectedBindings, consoleArguments, ...c }) => c);
    const before = common.map((c) => runJavaScript(previous, c, false, a.entrypoint).result);
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
