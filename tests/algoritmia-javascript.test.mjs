import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { indexRoute, isPublished } from '../js/domain/curriculum.js';

const read = (p) => JSON.parse(readFileSync(p, 'utf8'));
const source = read('content/curriculum/algoritmia.json');
const route = indexRoute(source);
const PUBLISHED = ['tm-contrato', 'tm-datos', 'tm-pruebas', 'tm-medir', 'an-escala'];

test('Algoritmia publica la edición de JavaScript y conserva la anterior como archivo', () => {
  assert.equal(source.currentEdition, 'javascript-1');
  assert.ok(route.levels.every((level) => level.edition === 'javascript-1'));
  assert.equal(route.levels.length, 9);
  assert.equal(route.lessons.length, 87);
  assert.equal(route.archive.lessons.length, 45);
  assert.equal(route.archive.lessons.filter(isPublished).length, 12);
  assert.ok(route.lessons.every((lesson) => lesson.language === 'javascript'));
});

test('la entrada es independiente y el proyecto Tesla Metro empieza en la primera lección', () => {
  const [entry] = route.lessons;
  assert.equal(entry.id, 'tm-contrato');
  assert.equal(isPublished(entry), true);
  assert.deepEqual(entry.dependsOn, []);
  assert.deepEqual(entry.requiresConcepts, []);
  const lesson = read('content/lessons/algoritmia/tm-contrato.json');
  assert.equal(lesson.learningProject.id, 'tesla-metro');
  assert.equal(lesson.learningProject.previous, null);
  assert.equal(lesson.activities.length, 4);
});

test('el tronco principal nunca depende de una práctica opcional y cada lección sigue a la anterior', () => {
  const optional = new Set(route.lessons.filter((l) => l.kind === 'optional').map((l) => l.id));
  assert.equal(optional.size, 4);
  let previousCore = null;
  for (const lesson of route.lessons) {
    const deps = lesson.dependsOn.map((key) => key.split('/')[1]);
    for (const dep of deps)
      assert.ok(route.pos[dep] < route.pos[lesson.id], `${lesson.id} -> ${dep}`);
    if (lesson.kind === 'core') {
      assert.ok(!deps.some((dep) => optional.has(dep)), lesson.id);
      assert.deepEqual(
        lesson.progressionRequires,
        previousCore ? [`algoritmia/${previousCore}`] : [],
      );
      previousCore = lesson.id;
    }
  }
});

test('cada concepto de la edición nueva tiene su registro y están publicadas las cinco primeras lecciones', () => {
  const registry = new Map(read('content/concepts.json').concepts.map((c) => [c.id, c]));
  for (const lesson of route.lessons) {
    assert.equal(lesson.teaches.length, lesson.concepts.length, lesson.id);
    for (const id of lesson.teaches) {
      assert.equal(registry.get(id)?.introducedBy, `algoritmia/${lesson.id}`, id);
      assert.equal(registry.get(id)?.status, lesson.status, id);
    }
  }
  assert.deepEqual(
    route.lessons.filter(isPublished).map((l) => l.id),
    PUBLISHED,
  );
});

test('el proyecto Tesla Metro se encadena y cada solución supera sus casos mientras el código inicial no', () => {
  let previous = null;
  for (const id of PUBLISHED) {
    const lesson = read(`content/lessons/algoritmia/${id}.json`);
    assert.equal(lesson.learningProject.id, 'tesla-metro', id);
    assert.equal(lesson.learningProject.previous, previous, id);
    assert.equal(lesson.activities.length, 4, id);
    previous = `algoritmia/${id}/${lesson.activities.at(-1).id}`;
    const load = (code, name) => new Function(`${code}\nreturn ${name};`)();
    for (const activity of lesson.activities.filter((a) => a.type === 'javascript')) {
      const passes = (code) =>
        activity.cases.every((c) => {
          const result = load(code, activity.entrypoint)(...structuredClone(c.args));
          return JSON.stringify(result) === JSON.stringify(c.expected);
        });
      assert.equal(passes(activity.solution), true, `${id}/${activity.id}: la solución debe pasar`);
      assert.equal(
        passes(activity.starter),
        false,
        `${id}/${activity.id}: el inicio no debe pasar`,
      );
    }
  }
});
