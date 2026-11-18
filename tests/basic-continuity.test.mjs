import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { runJavaScript } from './support/javascript.mjs';
import { caseStudyErrors, evaluateCaseStudy } from '../js/domain/case-study.js';
import { indexRoute, accessState } from '../js/domain/curriculum.js';
import { emptyProgress } from '../js/core/storage.js';
import { recordAttempt, completeIfReady } from '../js/domain/progress.js';

const read = (p) => JSON.parse(readFileSync(p, 'utf8'));
const lesson = (id, route = 'fundamentos') => read(`content/lessons/${route}/${id}.json`);
const passes = (code, activity) => {
  try {
    return activity.cases.every(
      (c) =>
        runJavaScript(code, c, false, activity.entrypoint, activity.bindings, activity.syntax)
          .result.passed,
    );
  } catch {
    return false;
  }
};

test('numeric addition rejects the former conversion shortcut and accepts equivalent conversion', () => {
  const activity = lesson('js-entradas-y-conversion').activities.find((a) => a.id.endsWith('-a2'));
  assert.equal(
    passes(activity.solution.replace('Number(textoMinutos)', 'textoMinutos'), activity),
    false,
  );
  assert.equal(passes(activity.solution, activity), true);
  assert.equal(
    passes(activity.solution.replace('minutos * dias', 'dias * minutos'), activity),
    true,
  );
});

test('transfer cases reject plausible defects in types, boundaries, state, validation and return contracts', () => {
  const ids = [
    'js-tipos-y-calculos',
    'js-comparaciones',
    'js-decisiones',
    'js-validacion',
    'js-ciclo-while',
    'js-acumular-con-for',
    'js-funciones-y-retorno',
    'js-descomponer-y-probar',
    'js-listas-y-recorridos',
    'js-proyecto-mediciones',
  ];
  for (const id of ids) {
    const a = lesson(id).activities.find((a) => a.id === id + '-a3');
    assert.equal(passes(a.solution, a), true, id);
    assert.equal(passes(a.assessment.debug.code, a), false, id + ': plausible defect');
  }
});

test('equivalent list loops with different local names retain the complete project contract', () => {
  const a = lesson('js-listas-y-recorridos').activities.find(
    (a) => a.id === 'js-listas-y-recorridos-a2',
  );
  const start = a.solution.indexOf('function sumarSesiones('),
    end = a.solution.indexOf('\n\nconst nombre', start);
  const alternate =
    a.solution.slice(0, start) +
    'function sumarSesiones(coleccion){let suma=0;for(let indice=0;indice<coleccion.length;indice=indice+1){suma=suma+coleccion[indice];}return suma;}' +
    a.solution.slice(end);
  assert.equal(passes(alternate, a), true);
});

test('analysis cases require all decisions, including transfer of invariant and complexity reasoning', () => {
  for (const [route, id] of [
    ['fundamentos', 'js-datos-con-const'],
    ['fundamentos', 'js-cambios-con-let'],
    ['fundamentos', 'js-descomponer-y-probar'],
    ['algoritmia', 'correccion-con-invariantes'],
    ['algoritmia', 'notacion-big-o-omega-y-theta'],
  ]) {
    const activity = lesson(id, route).activities.find((a) => a.type === 'case-study');
    assert.deepEqual(caseStudyErrors(activity), []);
    const correct = Object.fromEntries(activity.decisions.map((d) => [d.id, d.answer]));
    assert.equal(evaluateCaseStudy(activity, correct).passed, true);
    for (const decision of activity.decisions) {
      const incorrect = {
        ...correct,
        [decision.id]: (decision.answer + 1) % decision.options.length,
      };
      assert.equal(evaluateCaseStudy(activity, incorrect).passed, false, id + '/' + decision.id);
    }
  }
});

test('new learners must analyze reuse while historic completions keep their access and XP', () => {
  const data = lesson('js-datos-con-const'),
    key = `fundamentos/${data.id}`,
    state = emptyProgress();
  recordAttempt(
    state,
    key,
    data.quiz.map((q) => ({ id: q.id, concept: q.concept, correct: true })),
  );
  state.practices = data.activities
    .filter((a) => a.type === 'javascript')
    .map((a) => `${key}/${a.id}`);
  assert.equal(completeIfReady(state, key, data), false);
  state.practices.push(`${key}/analizar-reutilizacion`);
  assert.equal(
    completeIfReady(state, key, data),
    false,
    'Practice flags alone cannot replace evidence',
  );
  const historical = { ...emptyProgress(), completed: [key], xp: 90 };
  assert.equal(completeIfReady(historical, key, data), true);
  assert.equal(historical.xp, 90);
});

test('the eighteen available blocks form an uninterrupted progression and do not credit future blocks', () => {
  const route = indexRoute(read('content/curriculum/fundamentos.json')),
    completed = new Set();
  const available = route.lessons.filter((l) => l.status === 'published');
  assert.equal(available.length, 78);
  for (const item of available) {
    assert.equal(accessState(route, item.id, completed).status, 'ready', item.id);
    completed.add(`fundamentos/${item.id}`);
  }
  assert.equal(available.at(-1).id, 'js-reto-de-reservas');
  assert.ok(route.lessons.every((lesson) => lesson.status === 'published'));
});
