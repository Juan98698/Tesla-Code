import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { runJavaScript } from './support/javascript.mjs';
import { verifiedWork } from './support/project-proof.mjs';
import { projectAssessmentReady } from '../js/domain/project-assessment.js';
import { codeActivityMarkup } from '../js/features/code-activity.js';
import { installDOM } from './support/dom.mjs';
const read = (id) => JSON.parse(readFileSync(`content/lessons/fundamentos/${id}.json`));
const checks = (a, code = a.solution) =>
  a.cases.map((c) => runJavaScript(code, c, false, a.entrypoint, a.bindings, a.syntax).result);

test('array construction, input validation, sum, count, summary and maximum have separate cumulative purposes', () => {
  const route = JSON.parse(readFileSync('content/curriculum/fundamentos.json'));
  const blocks = route.levels.filter(
    (l) => l.edition === route.currentEdition && l.lessons[0].status === 'published',
  );

  test('function cases expose the full report input separately from independent call arguments', (t) => {
    installDOM(t);
    const a = read('js-leer-registros').activities[1];
    const root = document.getElementById('root');
    root.innerHTML = codeActivityMarkup(a);
    const text = root.textContent;
    assert.match(text, /Entradas del reporte/);
    for (const c of a.cases)
      for (const [i, line] of c.stdin.entries())
        assert.ok(text.includes(i + 1 + ': ' + JSON.stringify(line)), c.name);
    assert.ok([...root.querySelectorAll('pre')].every((pre) => pre.tabIndex === 0));
  });
  assert.deepEqual(blocks.map((b) => b.lessons.length).slice(0, 6), [8, 4, 4, 5, 4, 6]);
  const ids = blocks.find((block) => block.id === 'js-bloque-06').lessons.map((l) => l.id);
  assert.deepEqual(ids, [
    'js-crear-listas',
    'js-leer-registros',
    'js-listas-y-recorridos',
    'js-contar-sesiones',
    'js-resumir-sesiones',
    'js-proyecto-mediciones',
  ]);
  const construct = read(ids[0]).activities[3],
    input = read(ids[1]).activities[3],
    count = read(ids[3]).activities[3];
  assert.ok(!construct.solution.includes('prompt("Cantidad de sesiones'));
  assert.ok(!input.solution.includes('function sumarSesiones'));
  assert.ok(!count.solution.includes('function resumir'));
  assert.ok(
    read(ids[4]).activities[3].solution.includes(
      'crearPar(sumarSesiones(datos), contarSesiones(datos, objetivo))',
    ),
  );
  assert.ok(construct.cases.some((c) => c.stdout.includes('Registros: []')));
  assert.ok(input.cases.some((c) => c.stdout.includes('Registros: [10,30,0]')));
});

test('new input and count stages compare actual earlier versions and reproduce observable failures', () => {
  for (const id of [
    'js-crear-listas',
    'js-leer-registros',
    'js-contar-sesiones',
    'js-resumir-sesiones',
  ]) {
    const d = read(id);
    for (const a of d.activities.slice(0, 4)) {
      const work = verifiedWork(a, d.activities[1].solution);
      assert.equal(projectAssessmentReady(a, work), true, a.id);
      if (a.assessment.rewrite)
        assert.deepEqual(work.assessment.rewrite.before, work.assessment.rewrite.after);
    }
  }
  const input = read('js-leer-registros').activities[3];
  assert.ok(
    checks(
      input,
      input.solution.replace(
        'registros.push(Number(textoRegistro));',
        'registros.push(textoRegistro);',
      ),
    ).some((r) => !r.passed),
  );
  const count = read('js-contar-sesiones').activities[3];
  assert.ok(
    checks(count, count.solution.replace('datos[i] >= objetivo', 'datos[i] > objetivo')).some(
      (r) => !r.passed,
    ),
  );
  const pair = read('js-crear-listas').activities[3];
  assert.ok(
    checks(
      pair,
      pair.solution.replace(
        'return [primero, segundo];',
        'return [Number(primero), Number(segundo)];',
      ),
    ).some((r) => !r.passed),
  );
});

test('new transfer problems reject different boundary, conversion, accumulation and return errors', () => {
  const mutations = [
    ['js-integrar-valores', 'ocupados <= capacidad', 'ocupados < capacidad'],
    ['js-validacion', 'texto.trim() === "" || ', ''],
    ['js-contar-dias', 'unidades = unidades + pedido;', 'unidades = pedido;'],
    ['js-descomponer-y-probar', 'return base - descuento;', 'return String(base - descuento);'],
  ];
  for (const [id, before, after] of mutations) {
    const d = read(id),
      a = d.activities.find(
        (item) =>
          item.id ===
          {
            'js-integrar-valores': 'transferir-cupos',
            'js-validacion': 'transferir-reservas',
            'js-contar-dias': 'transferir-pedidos',
            'js-descomponer-y-probar': 'transferir-cobro',
          }[id],
      );
    assert.deepEqual(a.followUp.requires, [d.activities[3].id]);
    assert.ok(
      checks(a).every((r) => r.passed),
      id,
    );
    assert.ok(a.solution.includes(before));
    assert.ok(
      checks(a, a.solution.replace(before, after)).some((r) => !r.passed),
      id,
    );
    assert.equal(a.starter, '', 'Transfer does not provide the algorithm to fill in');
  }
});
