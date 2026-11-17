import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { parse } from '../assets/vendor/acorn/acorn.mjs';
import { indexRoute, accessState, nextLesson } from '../js/domain/curriculum.js';
import { completeIfReady } from '../js/domain/progress.js';
import { emptyProgress } from '../js/domain/progress-state.js';
import { runJavaScript } from './support/javascript.mjs';
import { verifiedWork } from './support/project-proof.mjs';
import { projectAssessmentReady } from '../js/domain/project-assessment.js';
const read = (p) => JSON.parse(readFileSync(p));
const raw = read('content/curriculum/fundamentos.json'),
  route = indexRoute(raw);
const ids = [
  'js-tipos-y-calculos',
  'js-operaciones-y-unidades',
  'js-comparaciones',
  'js-integrar-valores',
];
const lessons = ids.map((id) => read(`content/lessons/fundamentos/${id}.json`));
const nodes = (code) => {
  const list = [];
  const visit = (n) => {
    if (!n || typeof n !== 'object') return;
    if (n.type) list.push(n);
    for (const value of Object.values(n))
      if (value && typeof value === 'object')
        Array.isArray(value) ? value.forEach(visit) : visit(value);
  };
  visit(parse(code, { ecmaVersion: 2024 }));
  return list;
};

test('the block has four dependent lessons and decisions starts from the integrated artifact', () => {
  assert.deepEqual(
    route.levels.find((l) => l.id === 'js-bloque-02').lessons.map((m) => m.id),
    ids,
  );
  let previous = 'js-proyecto-tarjeta';
  for (const d of lessons) {
    const m = route.lessons.find((m) => m.id === d.id);
    assert.deepEqual(m.progressionRequires, ['fundamentos/' + previous]);
    assert.equal(d.learningProject.previous, `fundamentos/${previous}/${previous}-a3`);
    previous = d.id;
  }
  const decisions = read('content/lessons/fundamentos/js-decisiones.json');
  assert.equal(
    decisions.learningProject.previous,
    'fundamentos/js-integrar-valores/js-integrar-valores-a3',
  );
  assert.deepEqual(route.lessons.find((m) => m.id === 'js-decisiones').progressionRequires, [
    'fundamentos/js-integrar-valores',
  ]);
});

test('type activities do not demand arithmetic introduced by the following lesson or later control flow', () => {
  const d = lessons[0];
  for (const item of [...d.examples, ...d.activities.filter((a) => a.solution)]) {
    const tree = nodes(item.code ?? item.solution);
    assert.ok(
      !tree.some((n) =>
        ['IfStatement', 'WhileStatement', 'ForStatement', 'FunctionDeclaration'].includes(n.type),
      ),
    );
    assert.ok(
      !tree.some(
        (n) =>
          n.type === 'BinaryExpression' &&
          ['/', '%', '-', '===', '!==', '>=', '<='].includes(n.operator),
      ),
      item.id,
    );
  }
  assert.deepEqual(d.learningProject.capabilities.slice(-1), ['Tipo de minutos:']);
  for (const a of d.activities.slice(1))
    for (const c of a.cases) {
      assert.doesNotMatch(c.stdout, /Horas previstas:|Resto de 10:|Disponible hasta 120:/);
      assert.ok(
        runJavaScript(a.solution, c, false, a.entrypoint, a.bindings, a.syntax).result.passed,
      );
    }
  assert.ok(
    d.html.includes('undefined') && d.html.includes('null') && d.html.includes('histórica'),
  );
});

test('operations introduce their own concept before comparisons and later calculations reuse it', () => {
  const registry = read('content/concepts.json').concepts;
  const op = registry.find((c) => c.id === 'js-operaciones-y-unidades-concepto');
  assert.equal(op.introducedBy, 'fundamentos/js-operaciones-y-unidades');
  assert.ok(lessons[2].requiresConcepts.includes(op.id));
  for (const id of ['js-decisiones', 'js-validacion', 'js-ciclo-while', 'js-funciones-y-retorno'])
    assert.ok(read(`content/lessons/fundamentos/${id}.json`).requiresConcepts.includes(op.id));
  const expected = lessons[1].activities[3].cases.find((c) => c.stdin[2] === '25').stdout;
  assert.match(expected, /Horas previstas: 2\.0833333333333335/);
  assert.match(expected, /Resto de 10: 5/);
  assert.match(expected, /Disponible hasta 120: 95/);
  const rewrite = lessons[1].activities[2];
  const inline = rewrite.solution
    .replace('const horas = total / 60;\n', '')
    .replace('"Horas previstas:", horas', '"Horas previstas:", total / 60');
  assert.throws(
    () => runJavaScript(inline, rewrite.cases[0], false, undefined, rewrite.bindings),
    /Declara horas/,
  );

  for (const d of lessons.slice(0, 3))
    for (const a of d.activities.slice(1))
      assert.ok(!nodes(a.solution).some((n) => n.type === 'IfStatement'));
});

test('each lesson delivers real evidence and a rewrite that preserves its approved report', () => {
  let caps = read('content/lessons/fundamentos/js-proyecto-tarjeta.json').learningProject
    .capabilities;
  for (const d of lessons) {
    for (const c of caps)
      assert.ok(d.learningProject.capabilities.includes(c), d.id + ' lost ' + c);
    caps = d.learningProject.capabilities;
    for (const a of d.activities) {
      const work = verifiedWork(a, d.activities[1].solution);
      assert.equal(projectAssessmentReady(a, work), true, a.id);
      if (a.assessment.rewrite) {
        assert.deepEqual(work.assessment.rewrite.before, work.assessment.rewrite.after);
        assert.notEqual(a.solution, d.activities[1].solution);
      }
    }
  }
});

test('integration checks new data, zero and both sides of comparison frontiers; its daily-increase defect really fails', () => {
  const d = lessons[3],
    a = d.activities[3];
  for (const value of [0, 19, 20, 21, 25, 29, 30, 31, 120])
    assert.ok(a.cases.some((c) => Number(c.stdin[2]) === value));
  assert.ok(a.cases.every((c) => c.stdin[0] !== 'Ana'));
  for (const c of a.cases) assert.equal(runJavaScript(a.solution, c).result.passed, true);
  const zero = a.cases.find((c) => c.stdin[2] === '0');
  assert.match(zero.stdout, /Plan con 5 más: 25/);
  const defect = a.assessment.debug,
    actual = runJavaScript(defect.code, defect.cases[0]).result;
  assert.equal(actual.passed, false);
  assert.match(actual.stdout, /Plan con 5 más: 130/);
  assert.match(defect.cases[0].stdout, /Plan con 5 más: 150/);
});

test('history retains previous lesson and quiz identities while new learners must complete the inserted steps', () => {
  const state = emptyProgress();
  state.completed = route.lessons.slice(0, 8).map((m) => 'fundamentos/' + m.id);
  state.completed.push('fundamentos/js-tipos-y-calculos');
  assert.equal(accessState(route, 'js-comparaciones', new Set(state.completed)).status, 'locked');
  assert.equal(nextLesson(route, new Set(state.completed)).id, 'js-operaciones-y-unidades');
  const historical = {
    ...emptyProgress(),
    completed: ['fundamentos/js-tipos-y-calculos', 'fundamentos/js-comparaciones'],
    xp: 180,
  };
  for (const d of [lessons[0], lessons[2]]) {
    assert.equal(completeIfReady(historical, 'fundamentos/' + d.id, d), true);
    assert.equal(accessState(route, d.id, new Set(historical.completed)).status, 'done');
    assert.deepEqual(
      d.quiz.map((q) => q.id),
      [1, 2, 3, 4].map((n) => d.id + '-q' + n),
    );
    assert.deepEqual(
      d.activities.slice(1).map((a) => a.id),
      [1, 2, 3].map((n) => d.id + '-a' + n),
    );
  }
  assert.equal(historical.xp, 180);
  assert.ok(!historical.completed.includes('fundamentos/js-operaciones-y-unidades'));
});

test('comparison checks distinguish boolean results from identical-looking text', () => {
  const a = lessons[2].activities[1];
  const wrong = a.solution.replace(
    '"Alcanza 30:", minutos >= 30',
    '"Alcanza 30:", "" + (minutos >= 30)',
  );
  assert.notEqual(wrong, a.solution);
  const c = a.cases[0],
    observed = runJavaScript(wrong, c).result;
  assert.equal(observed.stdout, c.stdout);
  assert.equal(observed.passed, false);
  const { consoleArguments, ...outputOnly } = c;
  assert.equal(
    runJavaScript(wrong, outputOnly).result.passed,
    true,
    'Printing alone would have hidden the wrong type',
  );
  assert.equal(runJavaScript(a.solution, c).result.passed, true);
});
