import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { indexRoute, isPublished } from '../js/domain/curriculum.js';
import { runJavaScriptAsync } from './support/javascript.mjs';

const read = (p) => JSON.parse(readFileSync(p, 'utf8'));
const source = read('content/curriculum/algoritmia.json');
const route = indexRoute(source);
const PUBLISHED = [
  'tm-contrato',
  'tm-datos',
  'tm-pruebas',
  'tm-medir',
  'an-escala',
  'an-funciones',
  'an-bigo',
  'an-ciclos',
  'an-recursion',
  'an-casos',
  'an-amortizado',
  'an-espacio',
  'an-invariantes',
  'an-informe',
];
const analysis = PUBLISHED.slice(9);
const loadLesson = (id) => read(`content/lessons/algoritmia/${id}.json`);

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

test('cada concepto tiene su registro y Taller y Análisis están publicados en orden', () => {
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

test('las entregas se encadenan y cada ejemplo, solución e incidencia se contrasta con el evaluador', async () => {
  let previous = null;
  for (const id of PUBLISHED) {
    const lesson = loadLesson(id);
    assert.equal(lesson.learningProject.id, 'tesla-metro', id);
    assert.equal(lesson.learningProject.previous, previous, id);
    previous = `algoritmia/${id}/${lesson.activities[3].id}`;
    const expanded = analysis.includes(id);
    assert.equal(lesson.activities.length, expanded ? 5 : 4, id);
    if (expanded) {
      assert.ok(lesson.traceGame.rounds.length >= 2, id);
      assert.equal(lesson.activities[4].starter, '');
      assert.deepEqual(lesson.activities[4].followUp.requires, [lesson.activities[3].id]);
    }
    for (const example of lesson.examples) {
      const { result } = await runJavaScriptAsync(
        example.code,
        example.sample ?? {
          name: example.id,
          stdout: example.stdout,
        },
        false,
        example.sample?.entrypoint,
      );
      assert.equal(result.passed, true, JSON.stringify({ id, example: example.id, result }));
    }
    for (const activity of lesson.activities.filter((a) => a.type === 'javascript')) {
      const run = async (code, item) =>
        (
          await runJavaScriptAsync(
            code,
            item,
            false,
            activity.entrypoint,
            activity.bindings,
            activity.syntax,
          )
        ).result;
      for (const item of activity.cases) {
        const result = await run(activity.solution, item);
        assert.equal(result.passed, true, JSON.stringify({ id, activity: activity.id, result }));
      }
      let exposesFailure = false;
      for (const item of activity.cases) {
        if (!(await run(activity.starter, item)).passed) {
          exposesFailure = true;
          break;
        }
      }
      assert.ok(
        exposesFailure,
        `${id}/${activity.id}: el borrador debe revelar trabajo pendiente o una incidencia`,
      );
    }
  }
});

const solutionFor = (lesson, activity, fn) =>
  new Function(
    loadLesson(lesson).activities.find((item) => item.id === activity).solution + '\nreturn ' + fn,
  )();

test('el coste agregado concuerda con las copias de un buffer real y respeta la cota al duplicar', () => {
  const resumir = solutionFor('an-amortizado', 'implementar-crecimiento', 'resumirAltas');
  const agregar = solutionFor('an-amortizado', 'aplicar-avisos', 'agregarAvisos');
  for (let length = 0; length <= 128; length++) {
    const avisos = Array.from({ length }, (_, index) => String(index % 4));
    const [resultados, capacidad, copias] = agregar(avisos);
    assert.deepEqual(resultados, avisos);
    const informe = resumir(length, true);
    assert.deepEqual(informe.slice(0, 3), [capacidad, copias, length + copias]);
    assert.equal(resumir(length, false)[1], (length * (length - 1)) / 2 || 0);
    if (length) assert.ok(informe[2] < 3 * length);
  }
});

test('directa, prefijos y decisión concuerdan con un oráculo de tramos, incluso en fronteras y rechazos', () => {
  const decide = solutionFor('an-informe', 'integrar-decision', 'decidirEstrategia');
  for (let n = 0; n <= 9; n++) {
    const tramos = Array.from({ length: n }, (_, i) => (i * n + 3) % 5);
    const validas = tramos.flatMap((_, inicio) =>
      Array.from({ length: n - inicio + 1 }, (_, i) => [inicio, inicio + i]),
    );
    validas.push([n, n]);
    const consultas = [[-1, 0], ...validas, [n + 1, n], ['0', n], [0, n + 1], [0, 0.5]];
    const expected = [
      null,
      ...validas.map(([inicio, fin]) => tramos.slice(inicio, fin).reduce((a, b) => a + b, 0)),
      null,
      null,
      null,
      null,
    ];
    const visitas = validas.reduce((suma, [inicio, fin]) => suma + fin - inicio, 0);
    for (const presupuesto of [n, n + 1]) {
      assert.deepEqual(decide(tramos, consultas, presupuesto), {
        resultados: expected,
        coinciden: true,
        operacionesDirectas: visitas,
        operacionesIndice: n + validas.length,
        celdasIndice: n + 1,
        estrategia: presupuesto >= n + 1 && n + validas.length < visitas ? 'prefijos' : 'directa',
      });
    }
  }
});

test('el comprobador rechaza un recorrido completo que imita el conteo de un acierto temprano', async () => {
  const activity = loadLesson('an-casos').activities[1];
  const impostor = activity.solution.replace(
    /function buscarParada[\s\S]*$/,
    'function buscarParada(estaciones) { for (const parada of estaciones) {} return [0, 1]; }\n',
  );
  const { result } = await runJavaScriptAsync(
    impostor,
    activity.cases[0],
    false,
    activity.entrypoint,
  );
  assert.equal(result.passed, false);
  assert.equal(result.arrayReads, 4);
});

test('el informe conserva la versión directa si el índice añade un resultado ajeno al lote', () => {
  const activity = loadLesson('an-informe').activities[3];
  const damaged = activity.solution.replace(
    'return { resultados, operaciones, celdasExtra: prefijos.length };',
    'resultados.push(42);\n  return { resultados, operaciones, celdasExtra: prefijos.length };',
  );
  const decide = new Function(damaged + '\nreturn decidirEstrategia;')();
  const report = decide(
    [1, 2, 3, 4],
    [
      [0, 4],
      [0, 4],
      [0, 4],
    ],
    5,
  );
  assert.equal(report.coinciden, false);
  assert.equal(report.estrategia, 'directa');
  assert.deepEqual(report.resultados, [10, 10, 10]);
});
