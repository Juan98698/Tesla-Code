import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { indexRoute, nextLesson, accessState } from '../js/domain/curriculum.js';
import { normalizeProgress } from '../js/core/storage.js';
const read = (p) => JSON.parse(readFileSync(p, 'utf8'));
const route = (id) => indexRoute(read('content/curriculum/' + id + '.json'));

test('algorithm entry builds a solution before introducing Python and recursion before analysis', () => {
  const r = route('algoritmia');
  assert.deepEqual(
    r.lessons.slice(0, 7).map((l) => l.id),
    [
      'que-hace-bueno-a-un-algoritmo',
      'metodo-para-resolver-problemas',
      'pseudocodigo-y-estructuras',
      'trazar-y-verificar-soluciones',
      'implementar-algoritmos-en-python',
      'funciones-y-recursion-algoritmica',
      'medir-tiempo-y-memoria',
    ],
  );
  for (const lesson of r.lessons.slice(0, 4)) {
    const d = read('content/lessons/algoritmia/' + lesson.id + '.json');
    assert.ok(!/data-language="(?:python|shell)"/.test(d.html));
    assert.ok(d.requiresConcepts.every((id) => id.startsWith('algoritmia.')));
  }
  assert.ok(r.pos['funciones-y-recursion-algoritmica'] < r.pos['analizar-ciclos-y-recursion']);
  assert.ok(r.pos['matematicas-para-complejidad'] < r.pos['notacion-big-o-omega-y-theta']);
});

test('new algorithm stages retain earlier completions without granting the inserted lessons', () => {
  const r = route('algoritmia');
  const state = normalizeProgress({
    version: 2,
    xp: 180,
    completed: ['algoritmia/que-hace-bueno-a-un-algoritmo', 'algoritmia/medir-tiempo-y-memoria'],
  });
  const done = new Set(state.completed);
  assert.equal(state.xp, 180);
  assert.equal(state.completed.length, 2);
  assert.equal(accessState(r, 'medir-tiempo-y-memoria', done).status, 'done');
  assert.equal(nextLesson(r, done).id, 'metodo-para-resolver-problemas');
  assert.equal(accessState(r, 'implementar-algoritmos-en-python', done).status, 'locked');
});

test('accessibility, API testing and tool security precede the features that need them', () => {
  const frontend = route('frontend'),
    backend = route('backend'),
    ai = route('ia');
  assert.ok(frontend.pos['accesibilidad-web'] < frontend.pos['css-selectores-y-cascada']);
  assert.ok(frontend.pos['accesibilidad-web'] < frontend.pos['react-componentes-y-jsx']);
  assert.ok(backend.pos['documentacion-con-openapi'] < backend.pos['pruebas-de-backend']);
  assert.ok(backend.pos['pruebas-de-backend'] < backend.pos['conectar-con-una-base-de-datos']);
  assert.ok(ai.pos['seguridad-de-aplicaciones-con-ia'] < ai.pos['agentes']);
});

test('known assessment mismatches keep their corrected conceptual targets', () => {
  const target = (key) => read('content/lessons/' + key + '.json').activities[0].concept;
  assert.equal(target('algoritmia/medir-tiempo-y-memoria'), 'algoritmia.memoria-auxiliar');
  assert.equal(target('backend/http-en-profundidad'), 'backend.cabecera');
  assert.equal(target('fundamentos/numeros-y-precision'), 'fundamentos.numeros-y-precision.2');
  assert.equal(target('ia/elegir-proyecto-ia'), 'ia.latencia');
});
