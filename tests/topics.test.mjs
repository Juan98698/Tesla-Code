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
} from '../js/features/topic-learning.js';
import { javascriptExerciseErrors } from '../js/domain/javascript-exercise.js';
import { prepareBindingCases } from '../js/domain/javascript-contract.js';
import { runJavaScriptAsync } from './support/javascript.mjs';
import { installDOM, until, change, submit } from './support/dom.mjs';
import { installSpeechMock } from './support/speech.mjs';

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

test('topic index reuses the complete current edition, orders extensions and leaves progression untouched', () => {
  const before = JSON.stringify(route);
  const entries = topicIndex(route, catalog.guides);
  assert.equal(entries.length, 98);
  assert.equal(entries.filter((entry) => entry.kind === 'lesson').length, 78);
  assert.equal(new Set(entries.map((entry) => entry.id)).size, 98);
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
  assert.equal(filterTopics(entries, 'Condicionál if').length, 0);
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

test('all new explanations have working examples, guided solutions, faults and independent cases', async () => {
  for (const guide of catalog.guides) {
    const example = guide.example;
    const exampleResult = (
      await runJavaScriptAsync(
        example.code,
        example.sample ?? { name: guide.id, stdout: example.stdout },
        false,
        example.sample?.entrypoint,
      )
    ).result;
    assert.equal(exampleResult.passed, true, guide.id + ': ' + JSON.stringify(exampleResult));
  }
  let cases = 0;
  for (const [id, workshop] of [
    ...catalog.guides.map((guide) => [guide.id, guide]),
    ...Object.entries(catalog.workshops),
  ]) {
    for (const key of ['guided', 'bug', 'challenge']) {
      const exercise = workshop[key];
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

test('every one of the 98 topics provides readable theory when mounted in the laboratory', async (t) => {
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
