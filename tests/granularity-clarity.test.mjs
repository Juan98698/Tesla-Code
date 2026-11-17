import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { parse } from '../assets/vendor/acorn/acorn.mjs';
import { indexRoute } from '../js/domain/curriculum.js';
import { runJavaScript } from './support/javascript.mjs';
import { verifiedWork } from './support/project-proof.mjs';
import { projectAssessmentReady } from '../js/domain/project-assessment.js';
import { mountActivities } from '../js/features/activities.js';
import { codeActivityMarkup, mountCodeActivity } from '../js/features/code-activity.js';
import { caseStudyErrors } from '../js/domain/case-study.js';
import { javascriptExerciseErrors } from '../js/domain/javascript-exercise.js';
import { installDOM, submit, until } from './support/dom.mjs';
const raw = JSON.parse(readFileSync('content/curriculum/fundamentos.json'));
const route = indexRoute(raw),
  read = (id) => JSON.parse(readFileSync(`content/lessons/fundamentos/${id}.json`));
const nodes = (code) => {
  const all = [];
  function walk(n) {
    if (!n || typeof n !== 'object') return;
    if (n.type) all.push(n);
    for (const v of Object.values(n))
      if (v && typeof v === 'object') Array.isArray(v) ? v.forEach(walk) : walk(v);
  }
  walk(parse(code, { ecmaVersion: 2024 }));
  return all;
};
const source = (id) => read(id).activities[3].solution;
const names = (code) =>
  nodes(code)
    .filter((n) => n.type === 'FunctionDeclaration')
    .map((n) => n.id.name);
const inserted = [
  'js-clasificar-planes',
  'js-condiciones-logicas',
  'js-calendario-con-for',
  'js-contar-dias',
  'js-componer-funciones',
  'js-reglas-con-parametros',
  'js-crear-listas',
  'js-resumir-sesiones',
];

test('later blocks split distinct learning steps while preserving existing identities and transfers', () => {
  for (const id of ['js-bloque-03', 'js-bloque-04', 'js-bloque-05'])
    assert.equal(route.levels.find((l) => l.id === id).lessons.length, 4);
  for (const id of inserted) assert.ok(route.pos[id] >= 12);
  for (const id of [
    'js-decisiones',
    'js-validacion',
    'js-ciclo-while',
    'js-acumular-con-for',
    'js-funciones-y-retorno',
    'js-descomponer-y-probar',
    'js-listas-y-recorridos',
    'js-proyecto-mediciones',
  ])
    assert.deepEqual(
      read(id)
        .activities.slice(1, 4)
        .map((a) => a.id),
      [1, 2, 3].map((n) => id + '-a' + n),
    );
  for (const [id, repaso] of [
    ['js-decisiones', 'repaso-saldo'],
    ['js-funciones-y-retorno', 'repaso-inscripciones'],
    ['js-proyecto-mediciones', 'repaso-rango'],
  ])
    assert.ok(read(id).activities.some((a) => a.id === repaso && a.followUp));
  assert.equal(
    route.levels.find((l) => l.id === 'js-bloque-06').name,
    'Listas y análisis de sesiones',
  );
});

test('narrower lessons do not use the new structure or API before its introduction', () => {
  assert.ok(
    nodes(source('js-decisiones'))
      .filter((n) => n.type === 'IfStatement')
      .every((n) => n.alternate?.type !== 'IfStatement'),
  );
  assert.ok(!source('js-condiciones-logicas').includes('.trim('));
  assert.ok(!source('js-condiciones-logicas').includes('Number.isInteger'));
  assert.ok(source('js-validacion').includes('&& dentroDelRango'));
  assert.ok(
    !nodes(source('js-calendario-con-for')).some(
      (n) => n.type === 'Identifier' && ['programados', 'pares'].includes(n.name),
    ),
  );
  assert.ok(
    !nodes(source('js-acumular-con-for')).some(
      (n) => n.type === 'Identifier' && n.name === 'pares',
    ),
  );
  assert.ok(
    nodes(source('js-contar-dias')).some((n) => n.type === 'Identifier' && n.name === 'pares'),
  );
  assert.deepEqual(names(source('js-funciones-y-retorno')), ['calcularTotal']);
  for (const e of read('js-funciones-y-retorno').examples)
    assert.ok(
      !nodes(e.code).some(
        (n) => n.type === 'CallExpression' && n.arguments.some((a) => a.type === 'CallExpression'),
      ),
    );
  assert.ok(names(source('js-componer-funciones')).includes('ampliarCinco'));
  assert.ok(!names(source('js-crear-listas')).includes('sumarSesiones'));
  assert.ok(names(source('js-listas-y-recorridos')).includes('sumarSesiones'));
  assert.ok(!names(source('js-resumir-sesiones')).includes('maximo'));
  assert.ok(names(source('js-proyecto-mediciones')).includes('maximo'));
});

test('every inserted increment has equivalent submitted work and an incident that really fails', () => {
  for (const id of inserted) {
    const d = read(id);
    for (const a of d.activities.slice(0, 4)) {
      const proof = verifiedWork(a, d.activities[1].solution);
      assert.equal(projectAssessmentReady(a, proof), true, a.id);
      if (a.assessment.rewrite) {
        assert.deepEqual(proof.assessment.rewrite.before, proof.assessment.rewrite.after);
        assert.notEqual(a.solution, d.activities[1].solution);
      }
    }
  }
});

test('configured logical rules expose true, false and missing values even when report output is unchanged', () => {
  const a = read('js-condiciones-logicas').activities[3],
    c = a.cases.find((c) => c.overrides?.minimo === 31);
  const right = runJavaScript(a.solution, c, false, undefined, a.bindings).result;
  assert.equal(right.passed, true);
  assert.match(right.bindingValues, /dentroDelRango: false \[boolean\]/);
  const wrong = a.solution.replace(
    'const dentroDelRango = !(minutos < minimo || minutos > maximo);',
    'const dentroDelRango = undefined;',
  );
  const observed = runJavaScript(wrong, c, false, undefined, a.bindings).result;
  assert.equal(observed.stdout, c.stdout);
  assert.equal(observed.passed, false);
  assert.match(observed.bindingValues, /undefined \[undefined\]/);
  const beforeThirty = a.cases.find((c) => c.stdin?.[2] === '29');
  assert.equal(beforeThirty.expectedBindings.noAlcanza, true);
  const offByOne = a.solution.replace(
    'const noAlcanza = !(minutos >= 30);',
    'const noAlcanza = !(minutos >= 29);',
  );
  const boundary = runJavaScript(offByOne, beforeThirty, false, undefined, a.bindings).result;
  assert.equal(boundary.stdout, beforeThirty.stdout);
  assert.equal(
    boundary.passed,
    false,
    'A correct report does not hide an incorrect negated boundary',
  );
  const b = read('js-condiciones-logicas').activities[1];
  assert.ok(codeActivityMarkup(b).includes('valores iniciales'));
  assert.ok(codeActivityMarkup(b).includes('Valores que debe conservar'));
});

test('branch refinement, empty collections, counters and maximum ties follow their separate contracts', () => {
  const d = read('js-decisiones').activities[3],
    cl = read('js-clasificar-planes').activities[3];
  assert.match(d.cases.find((c) => c.stdin[2] === '60').stdout, /Recomendación: Constante/);
  assert.match(cl.cases.find((c) => c.stdin[2] === '60').stdout, /Recomendación: Intensivo/);
  const sum = read('js-acumular-con-for').activities[3];
  assert.ok(sum.cases.every((c) => !c.stdout.includes('Días pares:')));
  const create = read('js-crear-listas').activities[3];
  assert.ok(create.cases.every((c) => !c.stdout.includes('Minutos realizados:')));
  const max = read('js-proyecto-mediciones').activities[3];
  assert.ok(
    max.cases.some((c) => c.entrypoint === 'maximo' && JSON.stringify(c.args) === '[[-4,-4]]'),
  );
  for (const c of max.cases)
    assert.equal(runJavaScript(max.solution, c, false, max.entrypoint).result.passed, true);
});

test('wrong decisions show authored guidance without awarding progress', (t) => {
  installDOM(t);
  const d = read('js-ciclo-while'),
    root = document.getElementById('root'),
    solved = [];
  const dispose = mountActivities(
    root,
    [d.activities[0]],
    () => false,
    (id) => solved.push(id),
    { context: 'fundamentos/' + d.id },
  );
  t.after(dispose);
  submit(root.querySelector('form'));
  assert.deepEqual(solved, []);
  assert.equal(
    root.querySelector('[data-decision-feedback]').textContent,
    d.activities[0].decisions[0].errorHint,
  );
  assert.ok(!root.querySelector('.badge').classList.contains('live'));
});

test('failed code points to the lesson skill and shows actual checked data instead of claiming understanding', async (t) => {
  installDOM(t);
  const a = read('js-condiciones-logicas').activities[1],
    root = document.getElementById('root');
  root.innerHTML =
    '<span class="badge"></span>' + codeActivityMarkup(a) + '<div class="practice-feedback"></div>';
  let pass = false;
  const solved = [];
  const dispose = mountCodeActivity(root, a, (id) => solved.push(id), {
    runnerFactory: () => ({
      async run(job) {
        return {
          version: 'test',
          results: job.cases.map((c) => ({
            name: c.name,
            passed: pass,
            stdout: c.stdout,
            expected: c.stdout,
            actual: c.stdout,
            bindingExpected: 'dentroDelRango: false [boolean]',
            bindingValues: 'dentroDelRango: true [boolean]',
          })),
        };
      },
      cancel() {},
      dispose() {},
    }),
  });
  t.after(dispose);
  submit(root.querySelector('form'));
  await until(() => !root.querySelector('[data-run]').disabled);
  assert.match(root.querySelector('.practice-feedback').textContent, /Escribe por separado/);
  assert.match(root.querySelector('.practice-feedback').textContent, /Datos observados/);
  assert.deepEqual(solved, []);
  pass = true;
  submit(root.querySelector('form'));
  await until(() => solved.length);
  assert.match(
    root.querySelector('.practice-feedback').textContent,
    /casos de esta versión coinciden/,
  );
  assert.doesNotMatch(
    root.querySelector('.practice-feedback').textContent,
    /comprendiste|dominaste/,
  );
});

test('guidance fields reject malformed authoring and core hints are scoped to their lesson', () => {
  const sample = structuredClone(read('js-ciclo-while').activities[0]);
  sample.decisions[0].errorHint = {};
  assert.ok(caseStudyErrors(sample).some((e) => e.includes('pista')));
  const code = structuredClone(read('js-ciclo-while').activities[1]);
  code.retryFeedback = '';
  assert.ok(javascriptExerciseErrors(code).some((e) => e.includes('orientación')));
  for (const meta of route.lessons.filter((m) => m.status === 'published')) {
    const d = read(meta.id);
    for (const a of d.activities.slice(0, 4)) {
      assert.ok(a.hints.length >= 2);
      assert.ok(a.retryFeedback.trim());
      assert.notEqual(
        a.hint,
        'Consulta los casos visibles y escribe primero qué dato cambia y qué capacidades deben permanecer.',
      );
    }
  }
});
