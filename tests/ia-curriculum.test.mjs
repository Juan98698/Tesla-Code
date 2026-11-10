import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { indexRoute, accessState, nextLesson } from '../js/domain/curriculum.js';
import { normalizeProgress } from '../js/core/storage.js';
import { completeIfReady, recordAttempt } from '../js/domain/progress.js';
import { caseStudyErrors } from '../js/domain/case-study.js';
const read = (p) => JSON.parse(readFileSync(p, 'utf8'));
const route = indexRoute(read('content/curriculum/ia.json'));
const published = route.lessons.filter((m) => m.status === 'published');

test('concept labels preserve their meaning when a lesson reuses earlier concepts', () => {
  const concepts = new Map(
    read('content/concepts.json').concepts.map((concept) => [concept.id, concept]),
  );
  for (const [id, label] of [
    ['ia.minimo-privilegio', 'mínimo privilegio'],
    ['ia.exfiltracion-de-datos', 'exfiltración de datos'],
    ['ia.licencia-de-datos', 'licencia de datos'],
    ['ia.similitud', 'similitud'],
    ['ia.prueba', 'prueba'],
  ])
    assert.equal(concepts.get(id).label, label, id);
});

test('AI entry is independent and bridges precede language, image and concept models', () => {
  assert.equal(published.length, 13);
  assert.equal(accessState(route, published[0].id, new Set()).status, 'ready');
  for (const [before, after] of [
    ['probabilidad-para-generacion', 'llm-tokens-y-contexto'],
    ['imagenes-pixeles-y-semillas', 'difusion-de-ruido-a-imagen'],
    ['frases-vectores-y-significado', 'conceptos-siguientes-y-lcm'],
    ['evaluar-sistemas-generativos', 'proyecto-asistente-documental'],
    ['javascript-asincronia-para-ia', 'apis-de-modelos'],
    ['python-funciones-y-archivos-ia', 'http-y-python-para-ia'],
    ['probabilidad', 'procesos-directo-e-inverso'],
    ['transformers-y-atencion', 'arquitecturas-difusion'],
    ['difusion-en-conceptos', 'evaluar-lcm'],
  ])
    assert.ok(route.pos[before] < route.pos[after], `${before} antes de ${after}`);
  for (const level of route.levels.filter((l) =>
    ['difusion-tecnica', 'conceptos-avanzados'].includes(l.id),
  ))
    assert.ok(level.lessons.every((m) => m.kind === 'core'));
  assert.ok(route.lessons.every((m) => m.dependsOn.every((key) => key.startsWith('ia/'))));
  assert.equal(accessState(route, 'apis-de-modelos', new Set()).status, 'planned');
});

test('every published AI lesson has guided practice, a repair and independent transfer with evidence', () => {
  const backlog = read('content/editorial-backlog.json').lessons;
  for (const meta of published) {
    const data = read(`content/lessons/ia/${meta.id}.json`);
    assert.deepEqual(
      data.activities.map((a) => a.stage),
      ['comprehension', 'guided', 'repair', 'transfer'],
    );
    assert.ok(data.sources.length > 0);
    assert.ok(!backlog.includes('ia/' + meta.id));
    for (const activity of data.activities.slice(1))
      assert.deepEqual(caseStudyErrors(activity), [], meta.id);
    assert.equal(data.learningDesign.transferActivityIds[0], data.activities.at(-1).id);
    assert.equal(data.assessmentMode, 'prepared-cases');
  }
});

test('historical completions and XP do not grant the inserted AI bridges or projects', () => {
  const state = normalizeProgress({
    version: 2,
    xp: 270,
    completed: [
      'ia/que-es-la-inteligencia-artificial',
      'ia/datos-entrenamiento-e-inferencia',
      'ia/llm-tokens-y-contexto',
    ],
  });
  assert.equal(state.xp, 270);
  assert.equal(state.completed.length, 3);
  assert.equal(nextLesson(route, new Set(state.completed)).id, 'probabilidad-para-generacion');
  assert.ok(!state.completed.includes('ia/proyecto-asistente-documental'));
  assert.equal(
    accessState(route, 'prompts-y-verificacion', new Set(state.completed)).status,
    'ready',
  );
});

test('a quiz and the former short answer alone do not complete the revised AI practice', () => {
  const meta = published[0],
    key = 'ia/' + meta.id,
    data = read(`content/lessons/ia/${meta.id}.json`);
  const state = normalizeProgress({ version: 2 });
  recordAttempt(
    state,
    key,
    data.quiz.map((question) => ({ id: question.id, concept: question.concept, correct: true })),
  );
  state.practices.push(key + '/aplicar');
  assert.equal(completeIfReady(state, key, data), false);
  for (const activity of data.activities.slice(1)) state.practices.push(key + '/' + activity.id);
  assert.equal(completeIfReady(state, key, data), true);
  const xp = state.xp;
  assert.equal(completeIfReady(state, key, data), true);
  assert.equal(state.xp, xp);
});
