import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import {
  recordProjectArtifact,
  normalizeProjectArtifacts,
  mergeProjectArtifacts,
  validProjectArtifact,
} from '../js/domain/learning-project.js';
import { emptyProgress, normalizeProgress } from '../js/domain/progress-state.js';
import { JAVASCRIPT_LIMITS } from '../js/domain/javascript-exercise.js';
import { mergeProgress, parseBackup } from '../js/domain/progress-backup.js';
import { mountActivities } from '../js/features/activities.js';
import { installDOM, submit, until } from './support/dom.mjs';
import { learningProjectErrors } from '../tools/pedagogy.mjs';
const read = (id) => JSON.parse(readFileSync(`content/lessons/fundamentos/${id}.json`));
const data = read('js-tu-primer-programa'),
  context = 'fundamentos/js-tu-primer-programa';
const key = context + '/js-tu-primer-programa-a1',
  now = new Date('2026-11-16T12:00:00Z');
const evidence = { code: 'console.log("Mi código");', report: '', verifiedAt: now.toISOString() };

test('project versions survive normalization and backup without granting completions or XP', () => {
  const state = emptyProgress();
  assert.equal(recordProjectArtifact(state, key, 'plan-practica', evidence, now), true);
  assert.equal(
    recordProjectArtifact(
      state,
      key,
      'plan-practica',
      { notes: 'Predije un mensaje.' },
      new Date('2026-11-16T13:00:00Z'),
    ),
    true,
  );
  const restored = parseBackup(JSON.stringify(state));
  assert.deepEqual(restored, state);
  assert.equal(restored.xp, 0);
  assert.deepEqual(restored.completed, []);
  assert.equal(restored.projectArtifacts[key].code, evidence.code);
  assert.deepEqual(normalizeProgress({}).projectArtifacts, {});
});

test('merging a newer journal never replaces a more recently verified program with an older snapshot', () => {
  const old = emptyProgress(),
    recent = emptyProgress();
  recordProjectArtifact(old, key, 'plan-practica', evidence, now);
  recordProjectArtifact(
    recent,
    key,
    'plan-practica',
    { ...evidence, code: 'console.log("Nuevo");', verifiedAt: '2026-11-16T14:00:00.000Z' },
    new Date('2026-11-16T14:00:00Z'),
  );
  recordProjectArtifact(
    old,
    key,
    'plan-practica',
    { notes: 'Nota posterior en otra pestaña' },
    new Date('2026-11-16T15:00:00Z'),
  );
  const merged = mergeProgress(old, recent);
  assert.equal(merged.projectArtifacts[key].code, 'console.log("Nuevo");');
  assert.equal(merged.projectArtifacts[key].notes, 'Nota posterior en otra pestaña');
  assert.deepEqual(mergeProgress(recent, old).projectArtifacts, merged.projectArtifacts);
  assert.deepEqual(mergeProgress(merged, recent), merged);
  assert.deepEqual(mergeProjectArtifacts({}, undefined), {});
  const tie = { ...recent.projectArtifacts[key], notes: 'Desempate' };
  assert.deepEqual(
    mergeProjectArtifacts({ [key]: tie }, recent.projectArtifacts),
    mergeProjectArtifacts(recent.projectArtifacts, { [key]: tie }),
  );
});

test('invalid or oversized artifacts cannot be imported as verified work', () => {
  const state = emptyProgress();
  recordProjectArtifact(state, key, 'plan-practica', evidence, now);
  const valid = state.projectArtifacts[key];
  assert.equal(
    validProjectArtifact(key, { ...valid, code: 'x'.repeat(JAVASCRIPT_LIMITS.source) }),
    true,
  );
  for (const item of [
    null,
    { ...valid, code: 'x'.repeat(JAVASCRIPT_LIMITS.source + 1) },
    { ...valid, report: 'x'.repeat(6001) },
    { ...valid, notes: 'x'.repeat(2001) },
    { ...valid, updatedAt: 'wrong' },
    { ...valid, verifiedAt: 'wrong' },
    { ...valid, project: undefined },
  ]) {
    assert.equal(validProjectArtifact(key, item), false);
    assert.deepEqual(normalizeProjectArtifacts({ [key]: item }), {});
    assert.throws(
      () => parseBackup(JSON.stringify({ ...state, projectArtifacts: { [key]: item } })),
      /entregas/,
    );
  }
  assert.equal(recordProjectArtifact(state, 'wrong', 'plan-practica', evidence, now), false);
  assert.equal(validProjectArtifact('bad/key', valid), false);
  assert.deepEqual(normalizeProjectArtifacts([]), {});
});

test('four-stage validation rejects missing prerequisites and fabricated or future deliveries', () => {
  assert.deepEqual(learningProjectErrors(data, context, new Set()), []);
  assert.deepEqual(learningProjectErrors({}, context), []);
  for (const change of [
    (d) => d.activities.pop(),
    (d) => (d.activities[2].learningStep.phase = 'implementar'),
    (d) => (d.activities[1].learningStep.requires = []),
    (d) => (d.activities[2].learningStep.from = 'fundamentos/futuro/a'),
    (d) => (d.activities[3].learningStep.reflection = ''),
    (d) => (d.activities[0].type = 'javascript'),
    (d) => (d.learningProject.name = ''),
  ]) {
    const copy = structuredClone(data);
    change(copy);
    assert.ok(learningProjectErrors(copy, context, new Set()).length > 0);
  }
});

test('steps unlock in order, carry the actual approved draft and keep failed attempts out of artifacts', async (t) => {
  installDOM(t);
  const root = document.getElementById('root'),
    state = emptyProgress(),
    solved = [];
  let pass = true,
    jobs = 0;
  const dispose = mountActivities(
    root,
    data.activities.map(({ assessment, ...a }) => a),
    () => false,
    (id) => {
      solved.push(id);
      return true;
    },
    {
      context,
      artifactFor: (key) => state.projectArtifacts[key],
      onEvidence: (id, work) =>
        recordProjectArtifact(state, `${context}/${id}`, 'plan-practica', work),
      onJournal: (id, notes) =>
        recordProjectArtifact(state, `${context}/${id}`, 'plan-practica', { notes }),
      runnerFactory: () => ({
        async run(job) {
          jobs++;
          return {
            version: 'test',
            results: job.cases.map((c) => ({
              name: c.name,
              passed: pass,
              stdout: c.stdout,
              actual: c.stdout,
              expected: c.stdout,
            })),
          };
        },
        cancel() {},
        dispose() {},
      }),
    },
  );
  const section = (id) => root.querySelector(`[data-activity="${id}"]`),
    [understand, first, second] = data.activities;
  submit(section(first.id).querySelector('form'));
  assert.equal(jobs, 0);
  for (const decision of understand.decisions)
    section(understand.id).querySelector(
      `[data-decision="${decision.id}"] input[value="${decision.answer}"]`,
    ).checked = true;
  submit(section(understand.id).querySelector('form'));
  assert.equal(section(first.id).querySelector('[data-step-controls]').disabled, false);
  const editor = section(first.id).querySelector('.code-editor');
  editor.value = 'console.log("Mi versión personal");';
  editor.dispatchEvent(new window.Event('input'));
  submit(section(first.id).querySelector('form'));
  await until(() => !section(first.id).querySelector('[data-run]').disabled);
  assert.equal(state.projectArtifacts[key].code, editor.value);
  assert.equal(section(second.id).querySelector('.code-editor').value, editor.value);
  assert.equal(section(second.id).querySelector('[data-step-controls]').disabled, false);
  pass = false;
  editor.value = 'incorrecto';
  submit(section(first.id).querySelector('form'));
  await until(() => !section(first.id).querySelector('[data-run]').disabled);
  assert.equal(state.projectArtifacts[key].code, 'console.log("Mi versión personal");');
  const notes = section(first.id).querySelector('[data-project-journal]');
  notes.value = 'Mi predicción';
  notes.dispatchEvent(new window.Event('input'));
  await until(
    () =>
      section(first.id).querySelector('[data-journal-status]').textContent === 'Bitácora guardada.',
  );
  assert.equal(state.projectArtifacts[key].notes, 'Mi predicción');
  const secondEditor = section(second.id).querySelector('.code-editor');
  secondEditor.value = 'Borrador distinto';
  secondEditor.dispatchEvent(new window.Event('input'));
  section(second.id).querySelector('[data-restore-source]').click();
  assert.equal(secondEditor.value, 'console.log("Mi versión personal");');
  assert.equal(solved.includes(second.id), false);
  dispose();
});

test('reviewed defects cannot pass by preserving only the report and omitting a final element or return', async () => {
  const { runJavaScript } = await import('./support/javascript.mjs');
  for (const id of ['js-comparaciones', 'js-listas-y-recorridos', 'js-proyecto-mediciones']) {
    const a = read(id).activities.find((a) => a.id === id + '-a3');
    assert.ok(
      a.cases.some(
        (c) => !runJavaScript(a.assessment.debug.code, c, false, a.entrypoint).result.passed,
      ),
      id,
    );
  }
});

test('numeric predictions accept equivalent finite numbers without changing literal text grading', async () => {
  const { grade } = await import('../js/domain/grading.js');
  const q = read('js-proyecto-mediciones').quiz.find((q) => q.id === 'repaso-retorno-q');
  for (const answer of ['21', '21.0', ' 21 ']) assert.equal(grade(q, answer), true);
  for (const answer of ['', ' ', 'Infinity', 'veintiuno', '22'])
    assert.equal(grade(q, answer), false);
  const text = read('js-decisiones').quiz.find((q) => q.id === 'repaso-nombre-q');
  assert.equal(grade(text, 'sede'), true);
  assert.equal(grade(text, '21.0'), false);
});

test('undoing an import cannot discard a journal edited after restoring a project', async (t) => {
  installDOM(t);
  const { mountProgressImport, importMarkup } = await import('../js/features/progress-import.js');
  const root = document.getElementById('root'),
    state = emptyProgress(),
    incoming = emptyProgress(),
    saved = new Map();
  recordProjectArtifact(incoming, key, 'plan-practica', evidence, now);
  root.innerHTML = importMarkup();
  const dispose = mountProgressImport(root, state, async (next) => Object.assign(state, next), {
    storage: {
      getItem: (k) => saved.get(k) ?? null,
      setItem: (k, v) => saved.set(k, v),
      removeItem: (k) => saved.delete(k),
    },
  });
  const input = root.querySelector('#progress-file'),
    text = JSON.stringify(incoming);
  Object.defineProperty(input, 'files', {
    value: [{ size: text.length, text: async () => text }],
    configurable: true,
  });
  input.dispatchEvent(new window.Event('change'));
  await until(() => !root.querySelector('#confirm-import').disabled);
  assert.match(root.querySelector('#import-preview').textContent, /1 entregas/);
  root.querySelector('#confirm-import').click();
  await until(() => !root.querySelector('#undo-import').hidden);
  recordProjectArtifact(
    state,
    key,
    'plan-practica',
    { notes: 'Trabajo nuevo después de importar' },
    new Date('2026-11-16T16:00:00Z'),
  );
  root.querySelector('#undo-import').click();
  await until(() => root.querySelector('#import-preview').textContent.includes('cambió'));
  assert.equal(state.projectArtifacts[key].notes, 'Trabajo nuevo después de importar');
  dispose();
});
