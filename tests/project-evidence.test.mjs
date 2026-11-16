import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { runJavaScript } from './support/javascript.mjs';
import { installDOM, submit, change, until } from './support/dom.mjs';
import { mountActivities } from '../js/features/activities.js';
import { projectAssessmentReady } from '../js/domain/project-assessment.js';
import {
  recordProjectArtifact,
  mergeProjectArtifacts,
  validProjectArtifact,
} from '../js/domain/learning-project.js';
import { prepareBindingCases } from '../js/domain/javascript-contract.js';
import { emptyProgress } from '../js/domain/progress-state.js';
import { recordAttempt, completeIfReady } from '../js/domain/progress.js';
import { parseBackup } from '../js/domain/progress-backup.js';
import { javascriptExerciseErrors } from '../js/domain/javascript-exercise.js';
const ids = [
  'js-tu-primer-programa',
  'js-valores-y-secuencia',
  'js-errores-y-comentarios',
  'js-datos-con-const',
  'js-cambios-con-let',
  'js-operaciones-iniciales',
  'js-entradas-y-conversion',
  'js-proyecto-tarjeta',
];
const lessons = ids.map((id) => JSON.parse(readFileSync(`content/lessons/fundamentos/${id}.json`)));
const evaluate = (a, code = a.solution) =>
  a.cases.map((c) => runJavaScript(code, c, false, a.entrypoint, a.bindings, a.syntax).result);
const passes = (a, code) => {
  try {
    return evaluate(a, code).every((r) => r.passed);
  } catch {
    return false;
  }
};
function evidence(a, previous) {
  const responses = Object.fromEntries(
    a.assessment.questions.map((q) => [q.id, q.type === 'choice' ? q.answer : q.answers[0]]),
  );
  const code = a.solution ?? '';
  const assessment = {
    version: 2,
    responses,
    testedCode: code,
    reflection: 'Explicación de prueba pendiente de revisión.',
    reviewStatus: 'pending',
    technical: { passed: true, cases: a.cases?.length ?? a.decisions.length },
  };
  if (a.assessment.debug) {
    const results = a.assessment.debug.cases.map(
      (c) => runJavaScript(a.assessment.debug.code, c).result,
    );
    assessment.debug = {
      fixture: a.assessment.debug.id,
      failed: results.some((r) => !r.passed),
      stdout: results.map((r) => r.stdout).join('\n'),
      error: results.map((r) => r.error ?? '').join('\n'),
    };
  }
  if (a.assessment.rewrite) {
    const cases = a.cases.filter((c) => !c.overrides);
    assessment.rewrite = {
      passed: true,
      source: a.learningStep.from,
      before: cases.map((c) => runJavaScript(previous, c).result.stdout),
      after: cases.map((c) => runJavaScript(code, c).result.stdout),
    };
  }
  return {
    code,
    report: '',
    notes: assessment.reflection,
    verifiedAt: '2026-11-16T16:00:00.000Z',
    assessment,
  };
}

test('eight increments preserve capabilities, the confirmed duration and actual equivalent rewrites', () => {
  let prior = [];
  for (const d of lessons) {
    assert.equal(d.learningProject.version, 2);
    assert.ok(d.learningProject.changeReason.trim());
    for (const label of prior)
      assert.ok(d.learningProject.capabilities.includes(label), `${d.id} lost ${label}`);
    prior = d.learningProject.capabilities;
    for (const a of d.activities.slice(1)) assert.ok(passes(a, a.solution), a.id);
    const [understand, implementation, rewrite, integrate] = d.activities;
    assert.notEqual(
      implementation.solution,
      rewrite.solution,
      'Rewriting changes the representation',
    );
    for (const c of rewrite.cases.filter((c) => !c.overrides))
      assert.equal(
        runJavaScript(implementation.solution, c).result.stdout,
        runJavaScript(rewrite.solution, c).result.stdout,
        d.id,
      );
    for (const a of d.activities)
      assert.equal(projectAssessmentReady(a, evidence(a, implementation.solution)), true, a.id);
    assert.ok(
      integrate.assessment.debug.cases.some(
        (c) => !runJavaScript(integrate.assessment.debug.code, c).result.passed,
      ),
      'Every incident really fails',
    );
    assert.ok(understand.learningStep.reflection.includes('justifica'));
  }
  assert.match(
    lessons[4].activities[3].cases[0].stdout,
    /Meta: aprender lógica\nRecordatorio: aprender lógica/,
  );
  assert.match(lessons[5].activities[3].cases[0].stdout, /Minutos diarios: 30/);
  assert.match(lessons[5].activities[3].cases[0].stdout, /Referencia diaria: 20\nTotal: 150/);
});

test('contracts reject unused declarations, fixed calculations, type shortcuts and lost fields', () => {
  const c = lessons[3].activities[2],
    l = lessons[4].activities[2],
    m = lessons[5].activities[2],
    i = lessons[6].activities[2];
  for (const [a, bad] of [
    [c, c.solution.replaceAll('"Recordatorio:", meta', '"Recordatorio:", "aprender lógica"')],
    [c, c.solution.replace('const meta', 'let meta')],
    [l, l.solution.replace('const referencia = minutos;', 'const referencia = 20;')],
    [l, l.solution.replace('minutos = 30;', '')],
    [l, l.solution.replace('let minutos', 'const minutos')],
    [m, m.solution.replace('minutos * dias', '150')],
    [m, m.solution.replace('console.log("Meta:", meta);', '')],
    [i, i.solution.replace('Number(textoMinutos)', 'textoMinutos')],
  ])
    assert.equal(passes(a, bad), false, a.id + ': ' + bad);
  assert.ok(
    passes(m, m.solution.replace('minutos * dias', 'dias * minutos')),
    'Equivalent calculations remain valid',
  );
  assert.ok(passes(c, c.solution.replace('const meta', 'const /* dato central */ meta')));
  assert.equal(
    passes(
      lessons[1].activities[2],
      lessons[1].activities[2].solution.replace(
        '"Minutos diarios:", 20',
        '"Minutos diarios:", "20"',
      ),
    ),
    false,
    'Visible strings cannot hide the wrong type',
  );
  const comment = lessons[2].activities[2];
  assert.equal(
    passes(
      comment,
      comment.solution.replace('// Conservar el orden del reporte que ya comprobamos.', ''),
    ),
    false,
  );
  assert.throws(
    () => prepareBindingCases('const texto="const meta = 1";', [], { meta: 'const' }),
    /Declara meta/,
  );
  assert.throws(
    () => prepareBindingCases('const meta=1;', [{ overrides: { otro: 2 } }], { meta: 'const' }),
    /variante/,
  );
});

test('new completion requires predictions, delivered reflection, reproduction and equivalent behavior; historic awards persist', () => {
  const d = lessons[0],
    key = 'fundamentos/' + d.id,
    state = emptyProgress();
  recordAttempt(
    state,
    key,
    d.quiz.map((q) => ({ id: q.id, concept: q.concept, correct: true })),
  );
  state.practices = d.activities.map((a) => key + '/' + a.id);
  assert.equal(completeIfReady(state, key, d), false);
  for (const a of d.activities)
    recordProjectArtifact(
      state,
      key + '/' + a.id,
      'plan-practica',
      evidence(a, d.activities[1].solution),
    );
  const a = d.activities[3],
    artifact = state.projectArtifacts[key + '/' + a.id],
    good = structuredClone(artifact);
  for (const mutate of [
    (p) => (p.notes = ''),
    (p) => (p.assessment.responses.prediccion = 'otra'),
    (p) => (p.assessment.debug.failed = false),
    (p) => (p.assessment.testedCode += ' '),
    (p) => (p.assessment.technical.cases = 0),
    (p) => (p.assessment.reflection = 'Distinta'),
  ]) {
    Object.assign(artifact, structuredClone(good));
    mutate(artifact);
    assert.equal(completeIfReady(state, key, d), false);
  }
  Object.assign(artifact, good);
  const comparison = state.projectArtifacts[key + '/' + d.activities[2].id].assessment.rewrite;
  const before = comparison.before;
  comparison.before = ['Salida distinta'];
  assert.equal(completeIfReady(state, key, d), false);
  comparison.before = before;
  assert.equal(completeIfReady(state, key, d), true);
  const xp = state.xp;
  delete state.projectArtifacts[key + '/' + a.id];
  assert.equal(completeIfReady(state, key, d), true);
  assert.equal(state.xp, xp, 'No withdrawal or duplicate XP for historic completions');
});

test('proof survives journals and backup, stays attached to its tested code and malformed proof is rejected', () => {
  const state = emptyProgress(),
    a = lessons[0].activities[2],
    key = 'fundamentos/js-tu-primer-programa/' + a.id;
  recordProjectArtifact(
    state,
    key,
    'plan-practica',
    evidence(a, lessons[0].activities[1].solution),
    new Date('2026-11-16T16:00:00Z'),
  );
  const previous = structuredClone(state.projectArtifacts);
  recordProjectArtifact(
    state,
    key,
    'plan-practica',
    { notes: 'Una nota revisada' },
    new Date('2026-11-16T17:00:00Z'),
  );
  assert.ok(state.projectArtifacts[key].assessment);
  assert.equal(
    projectAssessmentReady(a, state.projectArtifacts[key]),
    false,
    'A changed explanation must be submitted again',
  );
  const merged = mergeProjectArtifacts(previous, state.projectArtifacts);
  assert.deepEqual(merged[key].assessment, previous[key].assessment);
  assert.deepEqual(parseBackup(JSON.stringify(state)).projectArtifacts, state.projectArtifacts);
  for (const proof of [
    { version: 2 },
    { ...previous[key].assessment, rewrite: { before: 'string', after: [] } },
    { ...previous[key].assessment, testedCode: 'x'.repeat(12001) },
  ])
    assert.equal(validProjectArtifact(key, { ...previous[key], assessment: proof }), false);
});

test('activity UI requires real evidence, compares student snapshots and keeps approved code through diagnosis', async (t) => {
  installDOM(t);
  const d = lessons[0],
    state = emptyProgress(),
    root = document.getElementById('root'),
    context = 'fundamentos/' + d.id,
    solved = [],
    jobs = [];
  let delayBaseline,
    hold = false;
  const dispose = mountActivities(
    root,
    d.activities,
    () => false,
    (id) => solved.push(id),
    {
      context,
      artifactFor: (key) => state.projectArtifacts[key],
      onEvidence: (id, work) =>
        recordProjectArtifact(state, context + '/' + id, 'plan-practica', work),
      onJournal: (id, notes) =>
        recordProjectArtifact(state, context + '/' + id, 'plan-practica', { notes }),
      runnerFactory: () => ({
        async run(job) {
          jobs.push(job);
          if (hold) {
            hold = false;
            await new Promise((resolve) => (delayBaseline = resolve));
          }
          return {
            version: 'test',
            results: job.cases.map(
              (c) =>
                runJavaScript(job.code, c, false, job.entrypoint, job.bindings, job.syntax).result,
            ),
          };
        },
        dispose() {},
        cancel() {},
      }),
    },
  );
  t.after(dispose);
  const section = (a) => root.querySelector(`[data-activity="${a.id}"]`);
  const register = (a) => {
    const s = section(a);
    change(
      s.querySelector('[data-project-journal]'),
      'Traza y explicación entregadas para revisión.',
    );
    for (const q of a.assessment.questions) {
      const input = s.querySelector(
        `[data-response="${q.id}"]${q.type === 'choice' ? `[value="${q.answer}"]` : ''}`,
      );
      if (q.type === 'choice') input.checked = true;
      else input.value = q.answers[0];
    }
    submit(s.querySelector('[data-reasoning-form]'));
  };
  const [u, first, rewrite, debug] = d.activities;
  for (const decision of u.decisions)
    section(u).querySelector(
      `[data-decision="${decision.id}"] input[value="${decision.answer}"]`,
    ).checked = true;
  submit(section(u).querySelector('form'));
  assert.equal(
    section(first).querySelector('[data-step-controls]').disabled,
    true,
    'Correct decisions alone omit delivered explanation',
  );
  register(u);
  assert.equal(section(first).querySelector('[data-step-controls]').disabled, false);
  change(section(first).querySelector('.code-editor'), first.solution + '\n');
  submit(section(first).querySelector('form'));
  assert.equal(jobs.length, 0, 'No code award before predictions and explanation');
  register(first);
  submit(section(first).querySelector('form'));
  await until(() => solved.includes(first.id));
  const prior = state.projectArtifacts[context + '/' + first.id].code;
  assert.equal(section(rewrite).querySelector('.code-editor').value, prior);
  change(section(rewrite).querySelector('.code-editor'), rewrite.solution);
  register(rewrite);
  // Hold the new-code execution and edit it before it finishes: an untested draft cannot be approved.
  hold = true;
  submit(section(rewrite).querySelector('form'));
  await until(() => delayBaseline);
  change(section(rewrite).querySelector('.code-editor'), rewrite.solution + '\n');
  delayBaseline();
  await until(() => !section(rewrite).querySelector('[data-run]').disabled);
  assert.equal(solved.includes(rewrite.id), false);
  submit(section(rewrite).querySelector('form'));
  await until(() => solved.includes(rewrite.id));
  assert.ok(
    jobs.some((j) => j.code === prior),
    'The comparison executes the learner snapshot rather than author solution',
  );
  const proof = state.projectArtifacts[context + '/' + rewrite.id].assessment;
  assert.deepEqual(proof.rewrite.before, proof.rewrite.after);
  change(section(debug).querySelector('.code-editor'), debug.solution);
  register(debug);
  assert.match(section(debug).querySelector('[data-assessment-status]').textContent, /reproduce/);
  section(debug).querySelector('[data-reproduce]').click();
  await until(() =>
    section(debug)
      .querySelector('[data-assessment-status]')
      .textContent.startsWith('Incidencia ejecutada'),
  );
  assert.equal(
    section(debug).querySelector('.code-editor').value,
    debug.solution,
    'The faulty fixture never overwrites the learner draft',
  );
  register(debug);
  submit(section(debug).querySelector('form'));
  await until(() => solved.includes(debug.id));
  const approved = state.projectArtifacts[context + '/' + debug.id];
  assert.equal(approved.assessment.debug.failed, true);
  assert.equal(approved.assessment.reviewStatus, 'pending');
  change(section(debug).querySelector('.code-editor'), 'console.log("incorrecto");');
  assert.ok(!section(debug).querySelector('.badge').classList.contains('live'));
  assert.equal(
    state.projectArtifacts[context + '/' + debug.id].code,
    approved.code,
    'Editing leaves the approved snapshot intact',
  );
});

test('author contracts validate declaration variants and reject malformed typed checks', () => {
  const a = lessons[5].activities[2];
  assert.deepEqual(javascriptExerciseErrors(a), []);
  for (const mutation of [
    (v) => (v.bindings = { minutos: 'var' }),
    (v) => (v.cases[0].overrides = { desconocido: 1 }),
    (v) => (v.cases[0].expectedBindings = { minutos: Infinity }),
    (v) => (v.cases[0].consoleArguments = ['wrong']),
    (v) => (v.syntax = { other: true }),
  ]) {
    const copy = structuredClone(a);
    mutation(copy);
    assert.ok(javascriptExerciseErrors(copy).length);
  }
});

test('public parser and license exactly match the pinned dependency', () => {
  const pkg = JSON.parse(readFileSync('package.json'));
  const installed = JSON.parse(readFileSync('node_modules/acorn/package.json'));
  assert.equal(pkg.devDependencies.acorn, installed.version);
  for (const [file, original] of [
    ['acorn.mjs', 'dist/acorn.mjs'],
    ['LICENSE', 'LICENSE'],
  ])
    assert.deepEqual(
      readFileSync('assets/vendor/acorn/' + file),
      readFileSync('node_modules/acorn/' + original),
    );
});

test('matching output from a crashing baseline cannot approve a rewrite on later reflection submission', async (t) => {
  installDOM(t);
  const { assessmentMarkup, mountProjectAssessment } =
    await import('../js/features/project-assessment.js');
  const a = lessons[0].activities[2],
    root = document.getElementById('root');
  root.innerHTML =
    '<textarea class="code-editor"></textarea><textarea data-project-journal></textarea>' +
    assessmentMarkup(a);
  const editor = root.querySelector('.code-editor'),
    journal = root.querySelector('[data-project-journal]'),
    answer = root.querySelector('[data-response]'),
    form = root.querySelector('form'),
    submitted = [];
  editor.value = a.solution;
  journal.value = 'Explicación entregada.';
  answer.value = a.assessment.questions[0].answers[0];
  let previous = {
    verifiedAt: '2026-11-16T12:00:00.000Z',
    code: lessons[0].activities[1].solution + '\nthrow Error("Fallo después de imprimir");',
  };
  const controller = mountProjectAssessment(root, a, {
    artifactFor: () => previous,
    onComplete: (work) => submitted.push(work),
    onPending: () => {},
    runnerFactory: () => ({
      async run(job) {
        return { results: job.cases.map((c) => runJavaScript(job.code, c).result) };
      },
      dispose() {},
    }),
  });
  t.after(() => controller.dispose());
  submit(form);
  assert.equal(controller.beforeCheck(), true);
  await controller.checked(a.solution, { results: evaluate(a) });
  assert.match(root.querySelector('[data-assessment-status]').textContent, /anterior ya no cumple/);
  submit(form);
  assert.equal(submitted.length, 0, 'Identical stdout is insufficient when the baseline crashed');
  previous = { ...previous, code: lessons[0].activities[1].solution };
  await controller.checked(a.solution, { results: evaluate(a) });
  assert.equal(submitted.length, 1);
  change(journal, '');
  submit(form);
  assert.match(root.querySelector('[data-assessment-status]').textContent, /Escribe/);
  journal.value = 'Nueva explicación';
  change(answer, 'incorrecta');
  submit(form);
  assert.equal(controller.beforeCheck(), false);
  assert.equal(submitted.length, 1);
  const simple = lessons[0].activities[1];
  assert.equal(passes({ ...simple, syntax: { singleQuotes: true } }, simple.solution), false);
});
