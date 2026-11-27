import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import {
  topicIndex,
  filterTopics,
  guideErrors,
  javascriptErrorHelp,
  topicHref,
} from '../js/domain/topics.js';
import { indexRoute, accessState } from '../js/domain/curriculum.js';
import {
  mountTopicLearning,
  mountTopicExercise,
  mountWalkthrough,
  consultationTheory,
  mountTopicReasoning,
} from '../js/features/topic-learning.js';
import { javascriptExerciseErrors } from '../js/domain/javascript-exercise.js';
import { prepareBindingCases } from '../js/domain/javascript-contract.js';
import { runJavaScriptAsync } from './support/javascript.mjs';
import { installDOM, until, change, submit } from './support/dom.mjs';
import { installSpeechMock } from './support/speech.mjs';
import {
  mathCoverageErrors,
  mathReferences,
  MATH_METHODS,
  MATH_CONSTANTS,
  editorialCoverageErrors,
  codeEvidence,
} from '../tools/learning-content-audit.mjs';

const read = (path) => JSON.parse(readFileSync(path, 'utf8'));
const route = indexRoute(read('content/curriculum/fundamentos.json'));
const catalog = read('content/learning/javascript-guides.json');
const loadLesson = async (_, id) => read(`content/lessons/fundamentos/${id}.json`);
const context = (topic) => ({
  routes: [route],
  state: { completed: [], xp: 100, bookmarks: ['fundamentos/js-tu-primer-programa'] },
  topic,
});
const options = {
  runnerFactory: () => ({
    cancel() {},
    dispose() {},
    async run(job) {
      return {
        version: 'prueba de interfaz',
        results: job.cases.map((item) => ({
          name: item.name,
          stdout: 'resultado\n',
          passed: true,
          expected: 'resultado',
          actual: 'resultado',
        })),
      };
    },
  }),
};
const dependencies = { loadGuides: async () => catalog, loadLesson, exerciseOptions: options };

test('method signatures and structure names find their actual lessons without requiring title wording', () => {
  const topics = topicIndex(route, catalog.guides, catalog.searchTerms);
  for (const [query, id] of [
    ['.map', 'js-transformar-map'],
    ['.reduce()', 'js-reducir-acumulador'],
    ['método .filter', 'js-filtrar-encontrar'],
    ['Array.prototype.map()', 'js-transformar-map'],
    ['Object.entries()', 'consulta-claves-valores'],
    ['colas', 'js-pila-y-cola'],
    ['queues', 'js-pila-y-cola'],
    ['pilas', 'js-pila-de-cambios'],
    ['.includes()', 'consulta-includes'],
    ['Array.prototype.includes', 'consulta-includes'],
    ['String.prototype.includes()', 'consulta-includes'],
    ['Array.prototype.entries()', 'consulta-entries-iteradores'],
    ['Map.prototype.entries', 'consulta-entries-iteradores'],
    ['.entries', 'consulta-claves-valores'],
    ['.entries', 'consulta-entries-iteradores'],
  ])
    assert.ok(
      filterTopics(topics, query).some((topic) => topic.id === id),
      query,
    );
  assert.equal(filterTopics(topics, '.map')[0].id, 'js-transformar-map');
  assert.deepEqual(
    filterTopics(topics, '.map').map((topic) => topic.id),
    ['js-transformar-map'],
  );
  assert.deepEqual(
    filterTopics(topics, '').map((topic) => topic.id),
    topics.map((topic) => topic.id),
  );
  assert.equal(filterTopics(topics, 'función inexistente').length, 0);
  assert.throws(() => topicIndex(route, catalog.guides, { unknown: ['.map()'] }), /búsqueda/);
  assert.throws(
    () => topicIndex(route, catalog.guides, { 'js-transformar-map': [null] }),
    /búsqueda/,
  );
});

test('topic index reuses the complete current edition, orders extensions and leaves progression untouched', () => {
  const before = JSON.stringify(route);
  const entries = topicIndex(route, catalog.guides, catalog.searchTerms);
  assert.equal(entries.length, 111);
  assert.equal(entries.filter((entry) => entry.kind === 'lesson').length, 78);
  assert.equal(new Set(entries.map((entry) => entry.id)).size, 111);
  assert.deepEqual(
    entries.filter((entry) => entry.collection === 'route').map((entry) => entry.id),
    route.lessons.filter((lesson) => lesson.status === 'published').map((lesson) => lesson.id),
  );
  assert.deepEqual(
    entries
      .map((entry) => entry.collection)
      .filter((value, index, array) => array.indexOf(value) === index),
    ['route', 'companion', 'mathematics'],
  );
  assert.equal(entries.filter((entry) => entry.collection === 'mathematics').length, 6);
  assert.equal(
    entries.find((entry) => entry.id === 'consulta-math-hiperbolicas').collection,
    'mathematics',
  );
  assert.throws(
    () => topicIndex(route, [{ ...catalog.guides[0], collection: 'unknown' }]),
    /Colección/,
  );
  const positions = new Map(entries.map((entry, index) => [entry.id, index]));
  for (const guide of catalog.guides)
    for (const required of guide.requires)
      assert.ok(
        positions.get(required) < positions.get(guide.id),
        `${guide.id}: la base ${required} debe aparecer antes`,
      );
  assert.deepEqual(guideErrors(catalog.guides, route), []);
  assert.equal(filterTopics(entries, 'TERNARIO')[0].id, 'consulta-ternario');
  assert.equal(filterTopics(entries, 'forEach')[0].id, 'consulta-for-each');
  assert.ok(filterTopics(entries, 'Condicionál if').some((topic) => topic.id === 'js-decisiones'));
  assert.ok(filterTopics(entries, 'funciones retorno').length);
  assert.equal(filterTopics(entries, 'inexistente').length, 0);
  assert.equal(topicHref('consulta-switch'), '#/practica/javascript/temas/consulta-switch');
  assert.equal(accessState(route, 'js-decisiones', new Set()).status, 'locked');
  assert.equal(JSON.stringify(route), before);
  assert.throws(() => topicIndex(route, [{ id: 'bad', after: 'missing' }]), /Referencia/);
  const invalid = [
    {
      id: route.lessons[0].id,
      after: 'missing',
      requires: [],
      sections: [],
      sources: [],
      guided: {},
      bug: {},
      challenge: {},
    },
  ];
  assert.ok(guideErrors(invalid, route).length >= 8);
});

test('every guide links its practical contract, operation training and independent application', () => {
  assert.equal(Object.keys(catalog.editorialCoverage).length, 33);
  assert.deepEqual(editorialCoverageErrors(catalog), []);
  assert.equal(codeEvidence('"lista.splice(1, 2)"; // lista.pop()').has('method:splice'), false);
  const missing = structuredClone(catalog);
  delete missing.guides[0].teaching.output;
  missing.editorialCoverage['consulta-array-cambios'].skills.find(
    (skill) => skill.name === 'Reemplazar tramo',
  ).example = 0;
  missing.editorialCoverage['consulta-regexp'].application = 'missing';
  missing.guides.find((guide) => guide.id === 'consulta-math-redondeos').requires = [
    'consulta-math',
  ];
  const errors = editorialCoverageErrors(missing);
  assert.ok(errors.some((message) => /consulta-ternario.*contrato/.test(message)));
  assert.ok(errors.some((message) => /Reemplazar tramo.*operación/.test(message)));
  assert.ok(errors.some((message) => /consulta-regexp.*escritura libre/.test(message)));
  assert.ok(errors.some((message) => /consulta-math-redondeos.*funciones y retorno/.test(message)));
  const duplicate = structuredClone(catalog);
  duplicate.guides[0].examples[0].id = duplicate.guides[0].id + '-example';
  assert.ok(
    mathCoverageErrors(duplicate).some((message) => /identificador de ejemplo/.test(message)),
  );
});

test('reasoning survives topic changes separately from achievements and tolerates unavailable storage', async (t) => {
  installDOM(t);
  const root = document.querySelector('#root');
  const ctx = context('consulta-array-cambios');
  const before = JSON.stringify(ctx.state);
  const dispose = await mountTopicLearning(root, ctx, dependencies);
  await until(() => root.querySelector('.topic-reasoning textarea'));
  assert.match(root.querySelector('#lesson .topic-usage').textContent, /Qué recibe/);
  change(
    root.querySelector('.topic-reasoning textarea'),
    'Necesito copiar porque el reporte conserva la lista fuente.',
  );
  change(root.querySelector('#topic-search'), 'ternario');
  root.querySelector('a[data-topic="consulta-ternario"]').click();
  await until(() => root.querySelector('article > h2')?.textContent.includes('ternario'));
  change(root.querySelector('#topic-search'), 'splice');
  root.querySelector('a[data-topic="consulta-array-cambios"]').click();
  await until(() => root.querySelector('article > h2')?.textContent.includes('splice'));
  assert.match(root.querySelector('.topic-reasoning textarea').value, /copiar porque/);
  assert.equal(JSON.stringify(ctx.state), before);
  dispose();
  const broken = {
    getItem() {
      throw Error('blocked');
    },
    setItem() {
      throw Error('blocked');
    },
  };
  const cleanup = mountTopicReasoning(
    root,
    {
      id: 'blocked',
      teaching: { question: '<img src=x> ¿Qué elegirías?', criteria: 'Explica tu regla.' },
    },
    broken,
  );
  assert.equal(root.querySelector('img'), null);
  assert.match(root.querySelector('[data-reasoning-status]').textContent, /recuperar/);
  const input = root.querySelector('textarea');
  change(input, 'Mi decisión');
  assert.match(root.querySelector('[data-reasoning-status]').textContent, /Copia/);
  cleanup();
  assert.equal(input.oninput, null);
});

test('cross-runtime examples and practices execute; capability-specific operations are covered by the browser suite', async () => {
  for (const guide of catalog.guides) {
    if (guide.capability && typeof Math[guide.capability] !== 'function') {
      assert.ok(['sumPrecise', 'f16round'].includes(guide.capability));
      continue;
    }
    for (const example of [guide.example, ...(guide.examples ?? [])]) {
      const exampleResult = (
        await runJavaScriptAsync(
          example.code,
          example.sample ?? { name: guide.id, stdout: example.stdout },
          Boolean(example.verification),
          example.sample?.entrypoint,
        )
      ).result;
      if (example.verification) {
        assert.equal(exampleResult.error, undefined);
        assert.ok(exampleResult.stdout.trim());
        const value = Number(exampleResult.stdout.trim());
        assert.ok(
          Number.isFinite(value) &&
            value >= example.verification.min &&
            value < example.verification.maxExclusive,
          guide.id,
        );
      } else
        assert.equal(exampleResult.passed, true, guide.id + ': ' + JSON.stringify(exampleResult));
    }
  }
  let cases = 0;
  for (const [id, workshop] of [
    ...catalog.guides.map((guide) => [guide.id, guide]),
    ...Object.entries(catalog.workshops),
  ]) {
    if (workshop.capability && typeof Math[workshop.capability] !== 'function') continue;
    const activities = [
      ...['guided', 'bug', 'challenge'].map((key) => [key, workshop[key]]),
      ...(workshop.practices ?? []).map((activity) => [activity.id, activity]),
    ];
    for (const [key, exercise] of activities) {
      if (!exercise) continue;
      assert.deepEqual(javascriptExerciseErrors(exercise), [], id + '/' + key);
      let starterFails = false;
      for (const item of exercise.cases) {
        const run = async (code) => {
          try {
            return (
              await runJavaScriptAsync(
                code,
                item,
                false,
                exercise.entrypoint,
                exercise.bindings,
                exercise.syntax,
              )
            ).result;
          } catch (error) {
            return { passed: false, error: String(error) };
          }
        };
        const result = await run(exercise.solution);
        assert.equal(
          result.passed,
          true,
          id + '/' + key + '/' + item.name + ': ' + JSON.stringify(result),
        );
        assert.equal(
          (await run('console.log("respuesta incorrecta");')).passed,
          false,
          id + '/' + key,
        );
        if (key === 'bug') starterFails ||= (await run(exercise.starter)).passed !== true;
        cases++;
      }
      if (key === 'bug') assert.ok(starterFails, id + ': la incidencia debe revelar el fallo');
    }
  }
  assert.ok(cases > 120);
});

test('every reviewed Math operation has a located explanation, executable example and practice', () => {
  assert.equal(MATH_METHODS.length, 37);
  assert.equal(MATH_CONSTANTS.length, 8);
  assert.deepEqual(mathCoverageErrors(catalog), []);
  const topics = topicIndex(route, catalog.guides, catalog.searchTerms);
  for (const [kind, names] of [
    ['methods', MATH_METHODS],
    ['constants', MATH_CONSTANTS],
  ])
    for (const name of names)
      assert.ok(
        filterTopics(topics, 'Math.' + name).some(
          (topic) => topic.id === catalog.mathCoverage[kind][name].topic,
        ),
        name,
      );
  assert.ok(mathReferences('Math["floor"](2); // Math.random()').has('floor'));
  assert.equal(mathReferences('"Math.random()";').size, 0);
  const missing = structuredClone(catalog);
  missing.mathCoverage.methods.random.practice = 'absent';
  assert.ok(mathCoverageErrors(missing).some((message) => /random.*práctica/.test(message)));
  const noExample = structuredClone(catalog);
  noExample.guides.find((guide) => guide.id === 'consulta-math-random').example.code =
    'console.log("Math.random()");';
  assert.ok(mathCoverageErrors(noExample).some((message) => /random.*ejemplo/.test(message)));
  for (const [query, id] of [
    ['math. random', 'consulta-math-random'],
    ['math floor', 'consulta-math-redondeos'],
    ['Math.trunc()', 'consulta-math-redondeos'],
    ['Math.PI', 'consulta-math-angulos'],
    ['Math.sumPrecise', 'consulta-math-suma-precisa'],
  ])
    assert.ok(
      filterTopics(topicIndex(route, catalog.guides, catalog.searchTerms), query).some(
        (topic) => topic.id === id,
      ),
      query,
    );
});

test('error orientation distinguishes declaration, name, syntax and incompatible value', () => {
  assert.match(javascriptErrorHelp('TypeError: Assignment to constant variable.'), /let/);
  assert.match(javascriptErrorHelp('ReferenceError: nombre is not defined'), /mayúsculas/);
  assert.match(javascriptErrorHelp('SyntaxError: Unexpected token'), /anterior/);
  assert.match(javascriptErrorHelp('TypeError: x is not a function'), /tipo/);
  assert.match(javascriptErrorHelp('Límite de ejecución'), /hipótesis/);
});

test('announced syntax is checked as code rather than output or words in comments', () => {
  const cases = [{ name: 'control', stdout: 'Adulto\n' }];
  assert.throws(
    () =>
      prepareBindingCases(
        'console.log("Adulto"); // ? :',
        cases,
        {},
        { nodes: ['ConditionalExpression'] },
      ),
    /ternario/,
  );
  assert.equal(
    prepareBindingCases(
      'console.log(true ? "Adulto" : "Menor");',
      cases,
      {},
      { nodes: ['ConditionalExpression'] },
    ).length,
    1,
  );
  assert.throws(
    () => prepareBindingCases('console.log("forEach");', cases, {}, { methods: ['forEach'] }),
    /métodos/,
  );
  assert.equal(
    prepareBindingCases(
      '[1].forEach(function(n){ console.log(n); });',
      cases,
      {},
      { methods: ['forEach'] },
    ).length,
    1,
  );
  assert.equal(
    prepareBindingCases(
      '[1]["forEach"](function(n){ console.log(n); });',
      cases,
      {},
      { methods: ['forEach'] },
    ).length,
    1,
  );
  assert.ok(
    javascriptExerciseErrors({ ...catalog.guides[0].guided, syntax: { methods: [] } }).length,
  );
  assert.ok(
    javascriptExerciseErrors({ ...catalog.guides[0].guided, syntax: { methods: [null] } }).length,
  );
});

test('prepared traces explain steps, escape source and can move backwards', (t) => {
  installDOM(t);
  const root = document.querySelector('#root');
  mountWalkthrough(root, 'console.log("<img>");\nconsole.log(2);', [
    { line: 1, state: 'primero', explanation: 'se muestra el texto' },
    { line: 2, state: 'después', explanation: 'se muestra dos' },
  ]);
  assert.equal(root.querySelector('img'), null);
  assert.equal(root.querySelector('[data-trace-back]').disabled, true);
  root.querySelector('[data-trace-forward]').click();
  assert.match(root.querySelector('[role=status]').textContent, /después/);
  assert.equal(root.querySelector('[data-trace-forward]').disabled, true);
  root.querySelector('[data-trace-back]').click();
  assert.match(root.querySelector('[role=status]').textContent, /primero/);
  assert.match(
    consultationTheory(
      document,
      '<h3>Concepto</h3><p>Base</p><h3>Contrato acumulativo de tu proyecto</h3><p>Conservado</p>',
    ),
    /topic-project-details/,
  );
  assert.equal(consultationTheory(document, '<p>Base</p>'), '<p>Base</p>');
});

test('free consultation runs, offers progressive hints and saves drafts without changing route progress', async (t) => {
  installDOM(t);
  const root = document.querySelector('#root');
  const ctx = context('consulta-ternario');
  const before = JSON.stringify(ctx.state);
  localStorage.setItem('teslacode:progress:v2', before);
  const dispose = await mountTopicLearning(root, ctx, dependencies);
  await until(() => root.querySelector('[data-topic-exercise]'));
  const card = root.querySelector('[data-topic-exercise]');
  card.querySelector('[data-hint]').click();
  assert.match(card.querySelector('.practice-hint').textContent, /comparación/);
  card.querySelector('[data-hint]').click();
  assert.match(card.querySelector('.practice-hint').textContent, /presenta/);
  change(card.querySelector('.code-editor'), 'console.log("mi intento");');
  submit(card.querySelector('form'));
  await until(() => card.querySelector('.practice-feedback').classList.contains('ok'));
  assert.match(card.querySelector('.badge').textContent, /sin XP/);
  assert.equal(JSON.stringify(ctx.state), before);
  assert.equal(localStorage.getItem('teslacode:progress:v2'), before);
  assert.match(
    localStorage.getItem('teslacode:draft:v1:topics/consulta-ternario/consulta-ternario-guided'),
    /mi intento/,
  );
  change(root.querySelector('#topic-search'), 'no existe');
  assert.match(root.querySelector('nav').textContent, /No hay/);
  assert.equal(root.querySelector('[data-topic-exercise]'), card);
  change(root.querySelector('#topic-search'), 'switch');
  root.querySelector('a[data-topic="consulta-switch"]').click();
  await until(() => root.querySelector('article > h2')?.textContent.includes('switch'));
  assert.equal(location.hash, topicHref('consulta-switch'));
  change(root.querySelector('#topic-search'), 'ternario');
  root.querySelector('a[data-topic="consulta-ternario"]').click();
  await until(() => root.querySelector('article > h2')?.textContent.includes('ternario'));
  assert.match(root.querySelector('[data-topic-exercise] .code-editor').value, /mi intento/);
  dispose();
});

test('route teaching, prepared traces, audio and transfer use separate consultation drafts', async (t) => {
  installDOM(t);
  const root = document.querySelector('#root');
  const dispose = await mountTopicLearning(root, context('js-cambios-con-let'), dependencies);
  await until(() => root.querySelector('[data-topic-exercise]'));
  assert.ok(root.querySelector('.topic-project-details'));
  assert.ok(root.querySelector('.topic-guided'));
  assert.ok(root.querySelector('.topic-walkthrough'));
  assert.equal(root.querySelectorAll('[data-topic-exercise]').length, 3);
  const prediction = root.querySelector('.example-prediction textarea');
  change(prediction, 'pendiente y confirmada');
  assert.match(
    localStorage.getItem('teslacode:prediction:v1:topics/js-cambios-con-let/js-cambios-con-let-e1'),
    /confirmada/,
  );
  assert.ok(root.querySelector('#lesson-audio'));
  assert.match(root.querySelector('.topic-footer').textContent, /pasos previos/);
  dispose();
});

test('additional examples and practices retain distinct drafts and the original example prediction', async (t) => {
  installDOM(t);
  const root = document.querySelector('#root');
  const ctx = context('consulta-math-random');
  const before = JSON.stringify(ctx.state);
  let dispose = await mountTopicLearning(root, ctx, dependencies);
  await until(() => root.querySelector('[data-topic-exercise="math-muestra-real"]'));
  assert.equal(root.querySelectorAll('.code-example').length, 3);
  const predictions = root.querySelectorAll('.example-prediction textarea');
  change(predictions[0], 'un decimal entre cero y uno');
  change(predictions[1], 'el entero trece');
  const extra = root.querySelector('[data-topic-exercise="math-muestra-real"] .code-editor');
  change(extra, 'console.log(Math.floor(Math.random()));');
  dispose();
  assert.equal(
    localStorage.getItem(
      'teslacode:prediction:v1:topics/consulta-math-random/consulta-math-random-example',
    ),
    'un decimal entre cero y uno',
  );
  dispose = await mountTopicLearning(root, ctx, dependencies);
  await until(() => root.querySelector('[data-topic-exercise="math-muestra-real"]'));
  assert.deepEqual(
    [...root.querySelectorAll('.example-prediction textarea')]
      .slice(0, 2)
      .map((input) => input.value),
    ['un decimal entre cero y uno', 'el entero trece'],
  );
  assert.equal(
    root.querySelector('[data-topic-exercise="math-muestra-real"] .code-editor').value,
    'console.log(Math.floor(Math.random()));',
  );
  assert.equal(JSON.stringify(ctx.state), before);
  dispose();
});

test('an unavailable Math operation keeps its theory and audio without offering a misleading replacement', async (t) => {
  installDOM(t);
  const descriptor = Object.getOwnPropertyDescriptor(Math, 'sumPrecise');
  Object.defineProperty(Math, 'sumPrecise', { value: undefined, configurable: true });
  t.after(() =>
    descriptor ? Object.defineProperty(Math, 'sumPrecise', descriptor) : delete Math.sumPrecise,
  );
  const speech = installSpeechMock();
  const root = document.querySelector('#root');
  const dispose = await mountTopicLearning(
    root,
    context('consulta-math-suma-precisa'),
    dependencies,
  );
  await until(() => root.querySelector('.callout'));
  assert.match(root.querySelector('.callout').textContent, /no ofrece Math.sumPrecise/);
  assert.match(root.querySelector('#lesson').textContent, /cancelación|representación intermedia/);
  assert.equal(root.querySelectorAll('[data-topic-exercise]').length, 0);
  assert.equal(root.querySelectorAll('.code-example .code-editor').length, 0);
  root.querySelector('[data-audio-play]').click();
  assert.ok(speech.current.text.trim());
  dispose();
});

test('the published recursion topic can narrate inside the real laboratory wrapper without awarding progress', async (t) => {
  installDOM(t, '<main data-lab="practice-hub"><div id="root"></div></main>');
  const speech = installSpeechMock();
  const root = document.querySelector('#root');
  const ctx = context('js-recursion-y-arbol');
  const before = JSON.stringify(ctx.state);
  const dispose = await mountTopicLearning(root, ctx, dependencies);
  await until(() => root.querySelector('#lesson-audio [data-audio-play]'));
  const play = root.querySelector('[data-audio-play]');
  assert.equal(play.disabled, false);
  play.click();
  assert.ok(speech.current.text.length > 0);
  assert.ok(root.querySelector('#lesson').textContent.includes(speech.current.text));
  speech.start();
  assert.ok(root.querySelector('#lesson .narration-current'));
  assert.equal(JSON.stringify(ctx.state), before);
  dispose();
  assert.equal(speech.current, undefined);
});

test('every published topic provides readable theory when mounted in the laboratory', async (t) => {
  installDOM(t, '<main data-lab="practice-hub"><div id="root"></div></main>');
  const speech = installSpeechMock();
  const root = document.querySelector('#root');
  for (const topic of topicIndex(route, catalog.guides)) {
    const ctx = context(topic.id);
    const before = JSON.stringify(ctx.state);
    const dispose = await mountTopicLearning(root, ctx, dependencies);
    await until(() => root.querySelector('[data-audio-play]'));
    const play = root.querySelector('[data-audio-play]');
    assert.equal(play.disabled, false, topic.id);
    play.click();
    assert.ok(speech.current?.text.trim(), topic.id);
    assert.equal(JSON.stringify(ctx.state), before, topic.id);
    dispose();
    assert.equal(speech.current, undefined, topic.id);
  }
});

test('failed loads can retry; late responses never replace the newly selected topic', async (t) => {
  installDOM(t);
  const root = document.querySelector('#root');
  let calls = 0,
    release;
  const dispose = await mountTopicLearning(root, context('js-tu-primer-programa'), {
    ...dependencies,
    loadLesson: async (_, id) => {
      calls++;
      if (calls === 1) throw Error('red');
      if (calls === 2)
        return new Promise((resolve) => {
          release = () => resolve(read('content/lessons/fundamentos/js-tu-primer-programa.json'));
        });
      return loadLesson(_, id);
    },
  });
  await until(() => root.querySelector('[data-topic-retry]'));
  root.querySelector('[data-topic-retry]').click();
  await until(() => release);
  change(root.querySelector('#topic-search'), 'ternario');
  root.querySelector('a[data-topic="consulta-ternario"]').click();
  await until(() => root.querySelector('[data-topic-exercise]'));
  release();
  await new Promise((resolve) => setImmediate(resolve));
  assert.match(root.querySelector('article > h2').textContent, /ternario/);
  dispose();
});

test('unknown direct links remain recoverable and detached consultation ignores pending data', async (t) => {
  installDOM(t);
  const root = document.querySelector('#root');
  let release;
  const dispose = await mountTopicLearning(root, context('missing'), {
    ...dependencies,
    loadLesson: () =>
      new Promise((resolve) => {
        release = resolve;
      }),
  });
  assert.match(root.querySelector('article').textContent, /Tema no encontrado/);
  root.querySelector('article a').click();
  await until(() => release);
  dispose();
  release(read('content/lessons/fundamentos/js-tu-primer-programa.json'));
  await new Promise((resolve) => setImmediate(resolve));
  assert.equal(root.querySelector('article > h2'), null);
});

test('a standalone exercise uses its fallback hint and restores its source', (t) => {
  installDOM(t);
  const root = document.querySelector('#root');
  const exercise = {
    ...catalog.guides[0].guided,
    id: 'single',
    type: 'javascript',
    hints: [],
    hint: 'Revisa el límite.',
  };
  const dispose = mountTopicExercise(root, exercise, 'Práctica', 'topics/test', options);
  root.querySelector('[data-hint]').click();
  assert.match(root.querySelector('.practice-hint').textContent, /límite/);
  change(root.querySelector('.code-editor'), 'otro borrador');
  root.querySelector('[data-reset]').click();
  assert.equal(root.querySelector('.code-editor').value, exercise.starter);
  dispose();
});
