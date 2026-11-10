import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { installDOM, submit, until } from './support/dom.mjs';
import { $, button, span } from '../js/core/dom.js';
import { escapeHtml, codeBlock, shuffle } from '../js/core/html.js';
import { mountQuiz } from '../js/features/quiz.js';
import { lessonPage, mountActivities } from '../js/features/lesson.js';
import * as views from '../js/features/catalog.js';
import { indexRoute } from '../js/domain/curriculum.js';
import { emptyProgress } from '../js/core/storage.js';
const read = (path) => JSON.parse(readFileSync(path, 'utf8'));

test('quiz waits for persistence before offering navigation and supports retrying a failed save', async (t) => {
  installDOM(t);
  const root = $('root');
  let resolveSave;
  const saving = new Promise((resolve) => {
    resolveSave = resolve;
  });
  const question = {
    id: 'q',
    type: 'choice',
    concept: 'c',
    prompt: 'Una pregunta',
    options: ['Sí'],
    answer: 0,
    explanation: 'Correcto.',
  };
  mountQuiz({ box: root, questions: [question], onFinish: () => saving });
  root.querySelector('.opt').click();
  root.querySelector('.fb button').click();
  assert.equal(root.querySelector('.result-orbit'), null);
  assert.match(root.textContent, /Guardando/);
  resolveSave({ text: 'Guardado' });
  await until(() => root.querySelector('.result-orbit'));
  assert.match(root.textContent, /Guardado/);
  let attempts = 0;
  mountQuiz({
    box: root,
    questions: [question],
    onFinish: () => (++attempts === 1 ? Promise.reject(Error('blocked')) : { text: 'Recuperado' }),
  });
  root.querySelector('.opt').click();
  root.querySelector('.fb button').click();
  await until(() => root.querySelector('[role=alert]'));
  root.querySelector('button').click();
  assert.match(root.textContent, /Recuperado/);
});
const routes = read('content/curriculum/index.json').routes.map((id) =>
  indexRoute(read(`content/curriculum/${id}.json`)),
);
const concepts = new Map(read('content/concepts.json').concepts.map((c) => [c.id, c]));
function option(root, text) {
  return [...root.querySelectorAll('button')].find((b) => b.textContent === text);
}
test('DOM helpers create inert text, typed buttons and accessible native controls', (t) => {
  installDOM(t);
  const root = $('root');
  let clicks = 0;
  const b = button('<img src=x>', 'sample', () => clicks++);
  root.append(b, span('hello', 'tag'));
  b.click();
  assert.equal(clicks, 1);
  assert.equal(b.type, 'button');
  assert.equal(root.querySelector('img'), null);
  assert.equal(root.querySelector('.tag').textContent, 'hello');
  assert.equal(escapeHtml('<a "x" & \'y\'>'), '&lt;a &quot;x&quot; &amp; &#39;y&#39;&gt;');
  root.innerHTML = codeBlock('<script>alert(1)</script>');
  assert.equal(root.querySelector('script'), null);
  assert.equal(root.querySelector('pre').textContent, '<script>alert(1)</script>');
  assert.deepEqual(
    shuffle([], () => 0),
    [],
  );
});
test('choice quiz keeps answer identity, blocks double answers and escapes feedback', (t) => {
  installDOM(t);
  const root = $('root'),
    summaries = [];
  mountQuiz({
    box: root,
    questions: [
      {
        id: 'same-prompt-1',
        type: 'choice',
        concept: 'c',
        prompt: '<img src=x>',
        options: ['wrong', 'right'],
        answer: 1,
        explanation: '<b>literal</b>',
      },
    ],
    onFinish: (s) => {
      summaries.push(s);
      return {
        text: '<script>unsafe</script>',
        actions: [{ label: 'Continue', onClick: () => summaries.push('continue') }],
      };
    },
  });
  assert.equal(root.dataset.questionId, 'same-prompt-1');
  option(root, 'right').click();
  option(root, 'right').click();
  assert.equal(root.querySelectorAll('.fb').length, 1);
  assert.equal(root.querySelector('.fb b'), null);
  root.querySelector('.fb button').click();
  assert.equal(summaries[0].correct, 1);
  assert.equal(root.dataset.questionId, undefined);
  assert.equal(root.querySelector('script'), null);
  option(root, 'Continue').click();
  assert.equal(summaries.at(-1), 'continue');
  option(root, 'Volver a practicar').click();
  assert.equal(root.dataset.questionId, 'same-prompt-1');
});
test('free-answer quiz normalizes input and failed quiz reports actual results', (t) => {
  installDOM(t);
  let summary;
  const root = $('root');
  mountQuiz({
    box: root,
    questions: [
      {
        id: 'text',
        type: 'text',
        concept: 'c',
        prompt: 'Answer',
        answers: ['Sí'],
        explanation: 'Try again',
      },
    ],
    onFinish: (s) => {
      summary = s;
      return { text: 'Review' };
    },
  });
  root.querySelector('input').value = 'no';
  submit(root.querySelector('form'));
  assert.match(root.querySelector('.fb').textContent, /Sí/);
  root.querySelector('.fb button').click();
  assert.equal(summary.passed, false);
  assert.deepEqual(summary.results, [{ id: 'text', concept: 'c', correct: false }]);
});
test('order quiz supports reset, full-sequence gating and stable results', (t) => {
  installDOM(t);
  const root = $('root');
  let summary;
  mountQuiz({
    box: root,
    questions: [
      {
        id: 'order',
        type: 'order',
        concept: 'c',
        prompt: 'Order',
        steps: ['first', 'second'],
        explanation: 'Sequence',
      },
    ],
    onFinish: (s) => {
      summary = s;
      return { text: 'Done' };
    },
  });
  const check = () => option(root, 'Comprobar orden');
  assert.equal(check().disabled, true);
  option(root, 'second').click();
  assert.equal(check().disabled, true);
  option(root, 'Empezar de nuevo').click();
  assert.equal(option(root, 'second').disabled, false);
  option(root, 'first').click();
  option(root, 'second').click();
  assert.equal(check().disabled, false);
  check().click();
  root.querySelector('.fb button').click();
  assert.equal(summary.passed, true);
});
test('practice exposes hints, persists only correct answers and restores solved indicators', (t) => {
  installDOM(t);
  const root = $('root'),
    solved = [];
  const activities = [
    {
      id: 'apply',
      type: 'text',
      prompt: '<b>task</b>',
      answers: ['21'],
      hint: 'Add one',
      explanation: '20+1',
    },
  ];
  mountActivities(
    root,
    activities,
    () => false,
    (id) => solved.push(id),
  );
  assert.equal(root.querySelector('h3 b'), null);
  root.querySelector('[data-hint]').click();
  assert.equal(root.querySelector('.hint').hidden, false);
  root.querySelector('input').value = '20';
  submit(root.querySelector('form'));
  assert.equal(solved.length, 0);
  root.querySelector('input').value = '21';
  submit(root.querySelector('form'));
  assert.deepEqual(solved, ['apply']);
  mountActivities(
    root,
    activities,
    () => true,
    () => {},
  );
  assert.match(root.querySelector('.badge').textContent, /Resuelta/);
});
test('catalog views reflect available, locked, planned and completed states without stale lessons', (t) => {
  installDOM(t);
  const root = $('root'),
    state = emptyProgress(),
    base = routes[0],
    first = base.lessons[0],
    next = base.lessons[1],
    planned = routes.find((r) => r.id === 'frontend').lessons.find((l) => l.status === 'planned');
  root.innerHTML = views.homePage(routes, state);
  assert.equal(root.querySelectorAll('.route-card').length, 3);
  assert.equal(root.querySelectorAll('#studio-route-select option').length, routes.length);
  assert.ok(root.querySelector('.continue-card .btn').href.endsWith('/' + first.id + '/aprender'));
  assert.equal(views.nodeState(base, first, state), 'ready');
  assert.equal(views.nodeState(base, next, state), 'locked');
  assert.equal(
    views.nodeState(
      routes.find((r) => r.id === 'frontend'),
      planned,
      state,
    ),
    'planned',
  );
  state.completed.push(`fundamentos/${first.id}`);
  assert.equal(views.nodeState(base, first, state), 'done');
  root.innerHTML = views.routePage(base, state);
  assert.equal(root.querySelectorAll('.map-node').length, base.lessons.length);
  root.innerHTML = views.inspector(
    routes.find((r) => r.id === 'frontend'),
    planned,
    state,
    routes,
  );
  assert.match(root.textContent, /preparación/);
  assert.ok(!root.textContent.includes('Puedes empezar aquí'));
  assert.equal(root.querySelector('#lesson'), null);
  root.innerHTML = views.routesPage(routes, state, 'open');
  assert.ok(root.querySelectorAll('.route-card').length >= 1);
  root.innerHTML = views.routesPage(routes, state, 'goal');
  assert.equal(root.querySelectorAll('.route-card').length, 1);
});
test('continuation respects selected goal, inaccessible recent and fully completed catalog', () => {
  const state = emptyProgress();
  state.goal = 'ia';
  assert.equal(views.continuation(routes, state).route.id, 'ia');
  state.recent = 'frontend/http-y-https';
  assert.equal(views.continuation(routes, state).route.id, 'ia');
  state.recent = 'ia/que-es-la-inteligencia-artificial';
  assert.equal(views.continuation(routes, state).lesson.id, 'que-es-la-inteligencia-artificial');
  state.completed = routes.flatMap((r) => r.lessons.map((l) => `${r.id}/${l.id}`));
  assert.equal(views.continuation(routes, state), null);
});
test('progress and practice views show real evidence and valid bookmarks', (t) => {
  installDOM(t);
  const state = emptyProgress(),
    root = $('root');
  state.lessons = {
    'fundamentos/tu-primer-paso': {
      attempts: [{ results: [{ concept: 'fundamentos.archivo', correct: false }] }],
    },
  };
  state.bookmarks = ['bad/missing', 'fundamentos/tu-primer-paso'];
  root.innerHTML = views.progressPage(routes, state, concepts);
  assert.match(root.textContent, /archivo/);
  assert.equal(root.querySelectorAll('.evidence-row').length, 1);
  root.innerHTML = views.practicePage(routes, state);
  assert.match(root.textContent, /Guardado para volver/);
  assert.equal(root.querySelectorAll('[data-lab]').length, 3);
  assert.ok(root.querySelector('[data-lab="practice-hub"]'));
  assert.equal(root.querySelector('[href*="bad/missing"]'), null);
});
test('dimensional progress uses published lessons and real achievements without changing stored state', (t) => {
  installDOM(t);
  const root = $('root'),
    state = emptyProgress();
  state.completed = ['fundamentos/tu-primer-paso', 'frontend/vite-y-empaquetado'];
  state.xp = 80;
  state.practices = ['lab/one'];
  state.streak.count = 2;
  const before = structuredClone(state);
  root.innerHTML = views.progressPage(routes, state, concepts);
  assert.match(root.querySelector('.progress-dial').textContent, /0 de 42 lecciones/);
  assert.match(
    root.querySelector('[aria-label="Historial de la edición anterior"]').textContent,
    /1 de 68 lecciones/,
  );
  assert.deepEqual(
    [...root.querySelectorAll('.progress-metric > strong')].map((el) => el.textContent),
    ['0', '80', '1', '2'],
  );
  assert.equal(root.querySelector('[role="progressbar"]').getAttribute('aria-valuenow'), '0');
  assert.deepEqual(state, before);
  state.completed = routes.flatMap((route) =>
    route.lessons
      .filter((lesson) => lesson.status === 'published')
      .map((lesson) => `${route.id}/${lesson.id}`),
  );
  root.innerHTML = views.progressPage(routes, state, concepts);
  assert.match(root.querySelector('.progress-dial').textContent, /100%/);
  assert.equal(root.querySelector('.workspace-hero-copy a').getAttribute('href'), '#/rutas');
  root.innerHTML = views.progressPage([{ ...routes[0], lessons: [] }], emptyProgress(), concepts);
  assert.match(root.querySelector('.progress-dial').textContent, /0 de 0 lecciones/);
  assert.ok(root.querySelector('#progress-file'));
});

test('lesson renders each stage, source links and completion without exposing another route', (t) => {
  installDOM(t);
  const root = $('root'),
    state = emptyProgress(),
    route = routes[0],
    meta = route.lessons[0],
    data = read(`content/lessons/fundamentos/${meta.id}.json`);
  for (const tab of ['aprender', 'practicar', 'comprobar']) {
    root.innerHTML = lessonPage(route, meta, data, state, tab);
    assert.equal(root.querySelector('h1').textContent, meta.title);
    assert.equal(root.querySelector('[aria-selected=true]').dataset.tab, tab);
  }
  state.completed.push(`fundamentos/${meta.id}`);
  root.innerHTML = lessonPage(
    route,
    meta,
    { ...data, sources: [{ title: 'Source', url: 'https://example.com/' }] },
    state,
    'aprender',
  );
  assert.match(root.querySelector('#lesson-status').textContent, /Completada/);
  assert.equal(root.querySelector('[target=_blank]').rel, 'noopener noreferrer');
});

test('questions with the same prompt keep distinct code and answer identities', (t) => {
  installDOM(t);
  const r = $('root');
  let summary;
  const questions = [
    {
      id: 'one',
      type: 'choice',
      concept: 'c',
      prompt: '¿Qué muestra este programa?',
      code: 'mostrar(1)',
      options: ['1', '2'],
      answer: 0,
      explanation: 'Uno',
    },
    {
      id: 'two',
      type: 'choice',
      concept: 'c',
      prompt: '¿Qué muestra este programa?',
      code: 'mostrar(2)',
      options: ['1', '2'],
      answer: 1,
      explanation: 'Dos',
    },
  ];
  mountQuiz({
    box: r,
    questions,
    onFinish: (s) => {
      summary = s;
      return { text: 'Done' };
    },
  });
  for (let i = 0; i < 2; i++) {
    const q = questions.find((q) => q.id === r.dataset.questionId);
    assert.equal(r.querySelector('pre').textContent, q.code);
    const answer = option(r, q.options[q.answer]);
    answer.click();
    answer.dispatchEvent(new window.MouseEvent('click', { bubbles: true }));
    assert.equal(r.querySelectorAll('.fb').length, 1);
    r.querySelector('.fb button').click();
  }
  assert.equal(summary.correct, 2);
  assert.equal(new Set(summary.results.map((result) => result.id)).size, 2);
});
