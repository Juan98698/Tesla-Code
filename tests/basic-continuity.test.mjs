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
const passes = (code, activity) =>
  activity.cases.every((c) => runJavaScript(code, c, false, activity.entrypoint).result.passed);

test('numeric addition rejects the former conversion shortcut and accepts equivalent conversion', () => {
  const activity = lesson('js-entradas-y-conversion').activities.find((a) => a.id.endsWith('-a2'));
  assert.equal(passes(activity.solution.replace('Number(texto)', 'texto'), activity), false);
  assert.equal(passes(activity.solution, activity), true);
  assert.equal(passes(activity.solution.replace('minutos + 5', '5 + minutos'), activity), true);
});

test('transfer cases reject plausible mistakes about boundaries, state, empty data and contracts', () => {
  const wrong = {
    'js-tipos-y-calculos': 'console.log(Number(prompt()) + Number(prompt()));',
    'js-comparaciones': 'console.log(prompt() !== prompt());',
    'js-decisiones':
      'const t = Number(prompt()); if(t <= 0) console.log("Helada"); else if(t <= 30) console.log("Normal"); else console.log("Calor");',
    'js-validacion':
      'const n = Number(prompt()); if(n >= 0 && n <= 6) console.log(n*8); else console.log("Reserva inválida");',
    'js-ciclo-while':
      'const n = Number(prompt()); for(let i=0;i<=n;i=i+1) console.log("Regar"); console.log("Fin");',
    'js-acumular-con-for':
      'const n = Number(prompt()); let t=0; for(let i=1;i<=n;i=i+1) if(i%2===0)t=t+i; console.log(t);',
    'js-funciones-y-retorno': 'function area(a,b){return a+b;}',
    'js-descomponer-y-probar': 'function recargo(d){if(d>7)return d*2;return 0;}',
    'js-listas-y-recorridos':
      'function contarHeladas(datos){let c=0;for(let i=0;i<datos.length;i=i+1)if(datos[i]<=0)c=c+1;return c;}',
    'js-proyecto-mediciones':
      'function resumir(datos,m){let total=0,c=0;for(let i=0;i<datos.length;i=i+1){total=total+datos[i];if(datos[i]>m)c=c+1;}return [total,c];}',
  };
  for (const [id, code] of Object.entries(wrong)) {
    const activity = lesson(id).activities.find((a) => a.id === `${id}-a3`);
    assert.equal(passes(activity.solution, activity), true, id);
    assert.equal(passes(code, activity), false, id + ': plausible mistake must fail');
    // A memorized single output cannot solve a variable-input transfer contract.
    assert.equal(
      passes(
        `console.log(${JSON.stringify(activity.cases[0].stdout?.trimEnd() ?? activity.cases[0].expected)});`,
        activity,
      ),
      false,
      id + ': fixed output',
    );
  }
});

test('equivalent loops and different variable names still solve the new transfer contracts', () => {
  const activity = lesson('js-acumular-con-for').activities[2];
  assert.equal(
    passes(
      'let limite=Number(prompt());let visita=1;let pares=0;while(visita<=limite){if(visita%2===0){pares=pares+1;}visita=visita+1;}console.log(pares);',
      activity,
    ),
    true,
  );
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
  assert.equal(completeIfReady(state, key, data), true);
  const historical = { ...emptyProgress(), completed: [key], xp: 90 };
  assert.equal(completeIfReady(historical, key, data), true);
  assert.equal(historical.xp, 90);
});

test('the six available blocks form an uninterrupted progression and do not credit future blocks', () => {
  const route = indexRoute(read('content/curriculum/fundamentos.json')),
    completed = new Set();
  const available = route.lessons.filter((l) => l.status === 'published');
  assert.equal(available.length, 18);
  for (const item of available) {
    assert.equal(accessState(route, item.id, completed).status, 'ready', item.id);
    completed.add(`fundamentos/${item.id}`);
  }
  assert.equal(available.at(-1).id, 'js-proyecto-mediciones');
  assert.equal(accessState(route, 'js-bloque-07', completed).status, 'planned');
});
