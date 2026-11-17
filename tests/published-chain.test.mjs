import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { indexRoute } from '../js/domain/curriculum.js';
import { runJavaScript } from './support/javascript.mjs';
import { verifiedWork } from './support/project-proof.mjs';
import { projectAssessmentReady, executionObservation } from '../js/domain/project-assessment.js';
import { emptyProgress } from '../js/domain/progress-state.js';
import { recordProjectArtifact } from '../js/domain/learning-project.js';
import { recordAttempt, completeIfReady } from '../js/domain/progress.js';
import { parseBackup } from '../js/domain/progress-backup.js';
import { learningProjectErrors } from '../tools/pedagogy.mjs';
import { javascriptExerciseErrors } from '../js/domain/javascript-exercise.js';
import { prepareBindingCases } from '../js/domain/javascript-contract.js';
import { mountActivities } from '../js/features/activities.js';
import { mountProjectAssessment, assessmentMarkup } from '../js/features/project-assessment.js';
import { installDOM, submit, until } from './support/dom.mjs';
const source = JSON.parse(readFileSync('content/curriculum/fundamentos.json'));
const metadata = indexRoute(source).lessons.filter((m) => m.status === 'published');
const lessons = metadata.map((m) =>
  JSON.parse(readFileSync(`content/lessons/fundamentos/${m.id}.json`)),
);
const get = (id) => lessons.find((d) => d.id === id);
const evaluate = (a, code) =>
  a.cases.map((c) => runJavaScript(code, c, false, a.entrypoint, a.bindings, a.syntax).result);
const runner = () => ({
  async run(job) {
    return {
      version: 'test',
      results: job.cases.map(
        (c) => runJavaScript(job.code, c, false, job.entrypoint, job.bindings, job.syntax).result,
      ),
    };
  },
  cancel() {},
  dispose() {},
});

test('all twenty publications form one chain with no pending migration and preserve prior capabilities and IDs', () => {
  assert.equal(lessons.length, 20);
  assert.deepEqual(source.learningModel.pendingMigration, []);
  assert.equal(source.learningModel.implementedThrough, lessons.at(-1).id);
  let previous = null,
    capabilities = [],
    sources = new Set();
  for (const [i, d] of lessons.entries()) {
    const key = 'fundamentos/' + d.id;
    assert.deepEqual(learningProjectErrors(d, key, sources, previous), [], d.id);
    assert.equal(d.learningProject.version, 2);
    for (const label of capabilities)
      assert.ok(d.learningProject.capabilities.includes(label), d.id + ' lost ' + label);
    assert.ok(d.learningProject.changeReason.trim());
    if (i > 0)
      assert.equal(d.learningProject.previous, previous + '/' + lessons[i - 1].activities[3].id);
    if (i >= 8)
      for (const phase of [1, 2, 3])
        assert.equal(d.activities[phase].id, d.id + '-a' + phase, 'Existing activity IDs survive');
    for (const follow of d.activities.slice(4)) {
      assert.ok(d.learningProject.followUpIds.includes(follow.id));
      assert.deepEqual(follow.followUp.requires, [d.activities[3].id]);
    }
    previous = key;
    capabilities = d.learningProject.capabilities;
  }
  assert.equal(get('js-descomponer-y-probar').activities[0].id, 'analizar-contrato');
});

test('new increments produce complete evidence, equivalent actual observations and reproducibly failing incidents', () => {
  for (const d of lessons.slice(8))
    for (const a of d.activities.slice(0, 4)) {
      const proof = verifiedWork(a, d.activities[1].solution);
      assert.equal(projectAssessmentReady(a, proof), true, a.id);
      if (a.assessment.rewrite) {
        assert.deepEqual(proof.assessment.rewrite.before, proof.assessment.rewrite.after, a.id);
        assert.notEqual(a.solution, d.activities[1].solution, 'A representation really changes');
      }
      if (a.assessment.debug) assert.equal(proof.assessment.debug.failed, true);
    }
});

test('validation rejects empty, whitespace, fraction, infinity, negative and over-limit data without partial reports', () => {
  for (const id of [
    'js-validacion',
    'js-ciclo-while',
    'js-listas-y-recorridos',
    'js-proyecto-mediciones',
  ]) {
    const d = get(id),
      a = d.activities[3];
    for (const c of a.cases) {
      const result = runJavaScript(a.solution, c, false, a.entrypoint, a.bindings, a.syntax).result;
      assert.equal(result.passed, true, c.name);
      if (c.rejected) assert.equal(result.stdout, 'Entrada inválida\n');
    }
  }
  const a = get('js-validacion').activities[3];
  for (const text of ['', '   ', 'hola', '2.5', 'Infinity', '-1', '121'])
    assert.ok(a.cases.some((c) => c.stdin[2] === text && c.rejected));
  for (const text of ['0', '120', '020', '2.0'])
    assert.ok(a.cases.some((c) => c.stdin[2] === text && !c.rejected));
  const report = get('js-ciclo-while').activities[3].cases.find(
    (c) => c.stdin[3] === '0' && !c.rejected,
  ).stdout;
  assert.match(report, /Sesiones programadas: 0/);
  assert.doesNotMatch(report, /\nDía:/);
});

test('function cases reject global dependencies and preserve typed returns even when report stdout agrees', () => {
  const a = get('js-descomponer-y-probar').activities[3];
  const bad = evaluate(a, a.assessment.debug.code);
  assert.ok(
    bad.some((r, i) => r.stdout === a.cases[i].stdout && !r.passed),
    'A correct report does not conceal a wrong return',
  );
  const reportDefect = get('js-proyecto-mediciones').activities[3];
  assert.ok(
    evaluate(reportDefect, reportDefect.assessment.debug.code).some((r) =>
      r.error?.includes('El reporte impreso no coincide'),
    ),
  );
  const strings = get('js-funciones-y-retorno').activities[3];
  const wrong = strings.solution.replace('return minutosPorDia * cantidadDias;', 'return "28";');
  assert.ok(evaluate(strings, wrong).some((r) => !r.passed));
  const d = get('js-listas-y-recorridos'),
    list = d.activities[3];
  const mutation = list.solution.replace(
    'function sumarSesiones(datos) {',
    'function sumarSesiones(datos) { datos.push(0);',
  );
  assert.ok(evaluate(list, mutation).some((r) => !r.passed && r.error?.includes('modificó')));
  const entry = { name: 'override', entrypoint: 'segundo', args: [3], expected: 6 };
  assert.equal(
    runJavaScript(
      'function primero(n){return 0;} function segundo(n){return n*2;}',
      entry,
      false,
      'primero',
    ).result.passed,
    true,
  );
  assert.notEqual(
    executionObservation({ stdout: 'same', actual: '4' }, true),
    executionObservation({ stdout: 'same', actual: '"4"' }, true),
  );
});

test('list contracts include empty, one, many, repeats, both maximum endpoints and negative-only independent inputs', () => {
  const a = get('js-proyecto-mediciones').activities[3];
  for (const args of [[[]], [[5]], [[-8, -3, -10]], [[9, 1]], [[1, 9]]])
    assert.ok(
      a.cases.some(
        (c) => c.entrypoint === 'maximo' && JSON.stringify(c.args) === JSON.stringify(args),
      ),
    );
  for (const [data, goal] of [
    [[], 0],
    [[0], 0],
    [[30, 30, 0], 30],
  ]) {
    const c = a.cases.find(
      (c) => c.entrypoint === 'resumir' && JSON.stringify(c.args) === JSON.stringify([data, goal]),
    );
    assert.ok(c);
    assert.equal(runJavaScript(a.solution, c, false, a.entrypoint).result.passed, true);
  }
});

test('completion and backup preserve the new evidence while requiring follow-up transfers and matching return comparisons', () => {
  const d = get('js-proyecto-mediciones'),
    key = 'fundamentos/' + d.id,
    state = emptyProgress();
  recordAttempt(
    state,
    key,
    d.quiz.map((q) => ({ id: q.id, concept: q.concept, correct: true })),
  );
  for (const a of d.activities.slice(0, 4)) {
    state.practices.push(key + '/' + a.id);
    recordProjectArtifact(
      state,
      key + '/' + a.id,
      'plan-practica',
      verifiedWork(a, d.activities[1].solution),
    );
  }
  assert.equal(completeIfReady(state, key, d), false, 'Transfer remains mandatory');
  state.practices.push(key + '/' + d.activities[4].id);
  const comparison = state.projectArtifacts[key + '/' + d.activities[2].id].assessment.rewrite;
  comparison.kind = 'stdout';
  assert.equal(
    completeIfReady(state, key, d),
    false,
    'A script-only comparison cannot approve a function rewrite',
  );
  comparison.kind = 'return-and-stdout';
  assert.equal(completeIfReady(state, key, d), true);
  assert.deepEqual(parseBackup(JSON.stringify(state)), state);
});

test('follow-up UI locks execution until the integrated artifact is actually delivered', async (t) => {
  installDOM(t);
  const d = get('js-decisiones'),
    root = document.getElementById('root'),
    solved = [];
  const artifacts = Object.fromEntries(
    d.activities
      .slice(0, 3)
      .map((a) => [
        'fundamentos/' + d.id + '/' + a.id,
        { project: 'plan-practica', ...verifiedWork(a, d.activities[1].solution) },
      ]),
  );
  const dispose = mountActivities(
    root,
    d.activities,
    (id) => d.activities.slice(0, 3).some((a) => a.id === id),
    (id) => solved.push(id),
    { context: 'fundamentos/' + d.id, artifactFor: (key) => artifacts[key], runnerFactory: runner },
  );
  t.after(dispose);
  const follow = root.querySelector('[data-follow-up-controls]');
  assert.equal(follow.disabled, true);
  submit(follow.querySelector('form'));
  assert.deepEqual(solved, []);
  const a = d.activities[3],
    section = root.querySelector(`[data-activity="${a.id}"]`);
  section.querySelector('.code-editor').value = a.solution;
  section.querySelector('[data-project-journal]').value =
    'Síntoma, hipótesis, corrección y resultados contrastados para revisión.';
  section.querySelector('[data-reproduce]').click();
  await until(() =>
    section
      .querySelector('[data-assessment-status]')
      .textContent.startsWith('Incidencia ejecutada'),
  );
  for (const q of a.assessment.questions) {
    const input = section.querySelector(
      `[data-response="${q.id}"]${q.type === 'choice' ? `[value="${q.answer}"]` : ''}`,
    );
    if (q.type === 'choice') input.checked = true;
    else input.value = q.answers[0];
  }
  submit(section.querySelector('[data-reasoning-form]'));
  submit(section.querySelector('form'));
  await until(() => solved.includes(a.id));
  assert.equal(follow.disabled, false);
});

test('rewriting functions compares learner returns and exposes a return-only incident to the student', async (t) => {
  installDOM(t);
  const d = get('js-proyecto-mediciones'),
    a = d.activities[2],
    root = document.getElementById('root');
  root.innerHTML =
    '<textarea class="code-editor"></textarea><textarea data-project-journal></textarea>' +
    assessmentMarkup(a);
  root.querySelector('.code-editor').value = a.solution;
  root.querySelector('[data-project-journal]').value =
    'Comparé retornos y reportes con los mismos datos.';
  for (const q of a.assessment.questions)
    root.querySelector(`[data-response="${q.id}"]`).value = q.answers[0];
  const awarded = [];
  let previous = d.activities[1].solution;
  const controller = mountProjectAssessment(root, a, {
    artifactFor: () => ({ verifiedAt: '2026-11-16T16:00:00.000Z', code: previous }),
    onComplete: (p) => awarded.push(p),
    onPending: () => {},
    runnerFactory: runner,
  });
  t.after(() => controller.dispose());
  submit(root.querySelector('form'));
  await controller.checked(a.solution, { results: evaluate(a, a.solution) });
  assert.equal(awarded.length, 1);
  assert.equal(awarded[0].assessment.rewrite.kind, 'return-and-stdout');
  previous = previous.replace('return [total, cantidad];', 'return [total, 999];');
  await controller.checked(a.solution, { results: evaluate(a, a.solution) });
  submit(root.querySelector('form'));
  assert.equal(awarded.length, 1, 'Matching stdout cannot validate a changed return');
});

test('authoring rejects skipped transfers, undeclared rejection policy and unsafe per-case function names', () => {
  const d = get('js-validacion'),
    copy = structuredClone(d);
  delete copy.learningProject.rejection;
  assert.ok(
    learningProjectErrors(copy, 'fundamentos/' + d.id, new Set(), null).some((e) =>
      e.includes('rechazo'),
    ),
  );
  const full = get('js-decisiones'),
    bad = structuredClone(full);
  bad.activities[4].followUp.requires = [];
  assert.ok(
    learningProjectErrors(bad, 'fundamentos/' + bad.id, new Set(), null).some((e) =>
      e.includes('posterior'),
    ),
  );
  const a = structuredClone(get('js-funciones-y-retorno').activities[3]);
  a.cases[0].entrypoint = 'x.y';
  assert.ok(javascriptExerciseErrors(a).length);
  assert.throws(
    () =>
      prepareBindingCases('const label="while(true){}";', [], {}, { nodes: ['WhileStatement'] }),
    /estructuras/,
  );
  assert.doesNotThrow(() =>
    prepareBindingCases('let n=0;while(n<2){n=n+1;}', [], {}, { nodes: ['WhileStatement'] }),
  );
});

test('a memorized type name cannot substitute applying typeof in the announced lesson', () => {
  const a = get('js-tipos-y-calculos').activities[3];
  assert.throws(() => evaluate(a, a.solution.replace('typeof minutos', '"number"')), /typeof/);
  assert.doesNotThrow(() => prepareBindingCases('const tipo=typeof 30;', [], {}, { typeof: true }));
});
