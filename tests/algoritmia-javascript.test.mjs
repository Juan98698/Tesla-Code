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
  'ls-arreglo-dinamico',
  'ls-lista',
  'ls-doble',
  'ls-pila',
  'ls-cola',
  'ls-deque',
  'ls-hash1',
  'ls-hash2',
  'ls-nativas',
  'ls-lru',
  'ls-arreglos',
  'ls-rabin',
  'ls-kmp',
  'tm-cp1',
  'bo-binaria',
  'bo-respuesta',
  'bo-cuadraticos',
  'bo-merge',
  'bo-quick',
  'bo-heap',
  'bo-heapsort',
  'bo-lineales',
  'bo-seleccion',
  'bo-patrones',
  'tm-cp2',
];
const withTransfer = PUBLISHED.slice(9);
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

test('cada concepto tiene su registro y los bloques publicados siguen el orden del mapa', () => {
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
    const expanded = withTransfer.includes(id);
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

test('las ventanas de deque coinciden con máximos directos para anchos, empates y salidas', () => {
  const maximos = solutionFor('ls-deque', 'reescribir-operacion', 'maximosVentana');
  const series = [[], [7], [1, 2, 3, 4], [4, 3, 2, 1], [-2, -3, -2, -5, -2]];
  for (const datos of series) {
    for (let k = 0; k <= datos.length + 1; k++) {
      const expected =
        k > 0 && k <= datos.length
          ? Array.from({ length: datos.length - k + 1 }, (_, i) =>
              Math.max(...datos.slice(i, i + k)),
            )
          : [];
      assert.deepEqual(maximos(datos, k), expected);
    }
  }
});

test('el sondeo conserva la misma pertenencia que Map durante altas, bajas y rehash', () => {
  const sondeo = solutionFor('ls-hash2', 'integrar-tesla', 'indiceEstacionesAbierto');
  const claves = Array.from({ length: 48 }, (_, i) => `A${i * 32}`);
  const acciones = claves.map((clave, i) => ['guardar', clave, `estación-${i}`]);
  for (const [i, clave] of claves.entries()) {
    if (i % 2 === 0) acciones.push(['borrar', clave], ['borrar', clave]);
    const siguiente = claves[(i + 1) % claves.length];
    acciones.push(['leer', clave], ['leer', siguiente], ['guardar', siguiente, 'nuevo']);
  }
  acciones.push(...claves.map((clave) => ['leer', clave]));
  const mapa = new Map();
  const respuestas = [];
  for (const [accion, clave, valor] of acciones) {
    if (accion === 'guardar') mapa.set(clave, valor);
    else if (accion === 'borrar') respuestas.push(mapa.delete(clave));
    else respuestas.push(mapa.get(clave) ?? null);
  }
  const final = sondeo(acciones);
  assert.deepEqual(final.respuestas, respuestas);
  assert.equal(final.activos, mapa.size);
  assert.equal(final.marcas + final.activos, final.usados);
  assert.ok(final.usados <= final.capacidad / 2);
});

test('Rabin–Karp y KMP coinciden con búsqueda directa en cadenas exhaustivas pequeñas', () => {
  const rabin = solutionFor('ls-rabin', 'reescribir-operacion', 'buscarRabin');
  const kmp = solutionFor('ls-kmp', 'reescribir-operacion', 'buscarKMP');
  const cadenas = [''];
  for (let length = 1; length <= 6; length++) {
    for (let n = 0; n < 2 ** length; n++) {
      cadenas.push(n.toString(2).padStart(length, '0').replaceAll('0', 'a').replaceAll('1', 'b'));
    }
  }
  for (const texto of cadenas) {
    for (const patron of cadenas.filter((item) => item.length <= 4)) {
      const expected = Array.from({ length: texto.length + 1 }, (_, i) => i).filter(
        (i) => texto.slice(i, i + patron.length) === patron,
      );
      assert.deepEqual(kmp(texto, patron), expected, JSON.stringify({ texto, patron }));
      assert.deepEqual(rabin(texto, patron, 2), expected, JSON.stringify({ texto, patron }));
    }
  }
});

test('los límites binarios coinciden con un recorrido directo y conservan índices de más de 31 bits', () => {
  const limite = solutionFor('bo-binaria', 'implementar-estructura', 'limiteHorario');
  const datos = [0, 0, 2, 2, 2, 5, 7];
  for (let hora = -1; hora <= 8; hora++) {
    assert.equal(limite(datos, hora), datos.filter((minuto) => minuto < hora).length);
    assert.equal(limite(datos, hora, true), datos.filter((minuto) => minuto <= hora).length);
  }
  const length = 2 ** 31 + 17;
  let lecturas = 0;
  const agendaVirtual = new Proxy(
    { length },
    {
      get: (target, key) => {
        if (key === 'length') return target.length;
        lecturas++;
        assert.ok(Number(key) >= 0 && Number(key) < length);
        return Number(key);
      },
    },
  );
  assert.equal(limite(agendaVirtual, length - 3), length - 3);
  assert.ok(lecturas <= 32);
});

test('merge, conteo y radix conservan todos los códigos empatados; heapsort y quicksort conservan las claves', () => {
  const mezclar = solutionFor('bo-merge', 'reescribir-operacion', 'ordenarMezcla');
  const contar = solutionFor('bo-lineales', 'implementar-estructura', 'contarMinutos');
  const radix = solutionFor('bo-lineales', 'reescribir-operacion', 'ordenarRadix');
  const heap = solutionFor('bo-heapsort', 'implementar-estructura', 'ordenarMonticulo');
  const quick = solutionFor('bo-quick', 'reescribir-operacion', 'ordenarRapido');
  const series = [[], [0], [7, 7, 7], [4, 0, 4, 1], [101, 2, 11, 12, 0, 101, 2]];
  for (const claves of series) {
    const registros = claves.map((clave, i) => [clave, `T${i}`]);
    const antes = structuredClone(registros);
    const esperado = registros.toSorted((a, b) => a[0] - b[0]);
    assert.deepEqual(mezclar(registros), esperado);
    assert.deepEqual(contar(registros, 101), esperado);
    assert.deepEqual(radix(registros), esperado);
    const extraido = heap(registros);
    assert.deepEqual(
      extraido.map(([clave]) => clave),
      esperado.map(([clave]) => clave),
    );
    assert.deepEqual(
      extraido.toSorted((a, b) => Number(a[1].slice(1)) - Number(b[1].slice(1))),
      antes,
    );
    for (const fraccion of [0, 0.42, 0.99]) {
      assert.deepEqual(
        quick(claves, fraccion),
        esperado.map(([clave]) => clave),
      );
    }
    assert.deepEqual(registros, antes);
  }
});

test('Quickselect y top-k coinciden con el orden completo para todos los rangos pequeños', () => {
  const seleccionar = solutionFor('bo-seleccion', 'implementar-estructura', 'seleccionarRango');
  const top = solutionFor('bo-seleccion', 'reescribir-operacion', 'mayoresDemoras');
  for (const datos of [[], [5], [3, 9, 0, 3, 6, -1, 3], [0, 0, 0, 0], [9, 8, 7, 6]]) {
    const esperado = datos.toSorted((a, b) => a - b);
    for (let k = 0; k <= datos.length + 1; k++) {
      assert.equal(seleccionar(datos, k, 0), esperado[k] ?? null);
      assert.equal(seleccionar(datos, k, 0.99), esperado[k] ?? null);
      assert.deepEqual(top(datos, k), esperado.toReversed().slice(0, k));
    }
  }
});

test('la simulación por montículo respeta el reloj y los empates de una agenda lineal', () => {
  const simular = solutionFor('tm-cp2', 'reescribir-operacion', 'simularLlegadas');
  const viajes = [
    ['B', 'N', 4, [1, 6, 2]],
    ['A', 'N', 0, [4, 1, 5]],
    ['C', 'S', 4, []],
    ['D', 'S', 2, [2, 1, 2]],
  ];
  for (const hasta of [-1, 0, 2, 4, 5, 6, 7, 15]) {
    const pendientes = viajes.map((viaje, i) => ({ minuto: viaje[2], i, parada: 0 }));
    const esperado = [];
    while (pendientes.length) {
      let anterior = 0;
      for (let i = 1; i < pendientes.length; i++) {
        if (pendientes[i].minuto < pendientes[anterior].minuto) anterior = i;
      }
      const [{ minuto, i, parada }] = pendientes.splice(anterior, 1);
      if (minuto > hasta) break;
      esperado.push([minuto, viajes[i][0], parada]);
      const duracion = viajes[i][3][parada];
      if (duracion !== undefined)
        pendientes.push({ minuto: minuto + duracion, i, parada: parada + 1 });
    }
    assert.deepEqual(simular(viajes, hasta), esperado);
  }
});
