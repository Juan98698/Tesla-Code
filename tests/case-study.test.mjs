import test from 'node:test';
import assert from 'node:assert/strict';
import { caseStudyErrors, evaluateCaseStudy, caseStudyReport } from '../js/domain/case-study.js';
import { mountActivities } from '../js/features/activities.js';
import { installDOM, submit } from './support/dom.mjs';

const sample = () => ({
  id: 'document-case',
  type: 'case-study',
  prompt: 'Audita un aviso',
  brief: 'La biblioteca abre a las nueve.',
  evidence: [{ label: 'Manual', text: 'Abre a las nueve; no informa el precio.' }],
  hint: 'Compara dato por dato.',
  explanation: 'Revisaste hechos y ausencias.',
  decisions: [
    {
      id: 'time',
      prompt: '¿Qué hora tiene respaldo?',
      options: ['Nueve', 'Diez'],
      answer: 0,
      explanation: 'El manual indica nueve.',
    },
    {
      id: 'price',
      prompt: '¿Qué sabes del precio?',
      options: ['Gratis', 'No consta'],
      answer: 1,
      explanation: 'La ausencia no implica gratuidad.',
    },
  ],
});

test('case study requires every decision and does not coerce missing or string answers', () => {
  const activity = sample();
  assert.deepEqual(caseStudyErrors(activity), []);
  for (const responses of [
    undefined,
    {},
    { time: null, price: 1 },
    { time: '0', price: 1 },
    { time: 0, price: 0 },
  ]) {
    assert.equal(evaluateCaseStudy(activity, responses).passed, false);
    assert.equal(caseStudyReport(activity, responses), '');
  }
  const result = evaluateCaseStudy(activity, { time: 0, price: 1 });
  assert.equal(result.passed, true);
  assert.ok(result.decisions.every((d) => d.correct));
  const report = caseStudyReport(activity, { time: 0, price: 1 });
  assert.match(report, /No consta/);
  assert.match(report, /no implica gratuidad/);
  assert.match(report, /no es una inferencia/);
  assert.equal(evaluateCaseStudy({ decisions: [] }).passed, false);
});

test('case study authoring rejects incomplete, duplicate and ambiguous decisions', () => {
  const variants = [
    { brief: '' },
    { evidence: [] },
    { evidence: [{ label: '', text: 'x' }] },
    { decisions: [] },
    { decisions: [sample().decisions[0], sample().decisions[0]] },
    {
      decisions: [
        { ...sample().decisions[0], id: '', prompt: '', explanation: '' },
        sample().decisions[1],
      ],
    },
    ...[
      { options: ['same', 'same'] },
      { options: ['', 'ok'] },
      { answer: 9 },
      { answer: 0.5 },
      { options: null },
    ].map((bad) => ({ decisions: [{ ...sample().decisions[0], ...bad }, sample().decisions[1]] })),
  ];
  for (const changes of variants)
    assert.ok(caseStudyErrors({ ...sample(), ...changes }).length, JSON.stringify(changes));
});

test('case study UI preserves partial work, reports corrections and grants completion once', (t) => {
  installDOM(t);
  const root = document.getElementById('root'),
    activity = sample(),
    solved = [];
  mountActivities(
    root,
    [activity],
    () => false,
    (id) => solved.push(id),
  );
  const form = root.querySelector('form');
  submit(form);
  assert.match(root.querySelector('.practice-feedback').textContent, /0 de 2/);
  root.querySelector('[data-hint]').click();
  assert.equal(root.querySelector('.hint').hidden, false);
  root.querySelector('[data-decision="time"] input[value="0"]').checked = true;
  root.querySelector('[data-decision="price"] input[value="0"]').checked = true;
  submit(form);
  assert.equal(solved.length, 0);
  assert.match(root.querySelector('.practice-feedback').textContent, /1 de 2/);
  assert.equal(root.querySelector('[data-decision="time"]').getAttribute('aria-invalid'), 'false');
  assert.equal(root.querySelector('[data-decision="price"]').getAttribute('aria-invalid'), 'true');
  root.querySelector('[data-decision="price"] input[value="1"]').checked = true;
  submit(form);
  assert.deepEqual(solved, ['document-case']);
  assert.equal(root.querySelector('.case-report').hidden, false);
  assert.match(root.querySelector('[data-case-report]').textContent, /No consta/);
  submit(form);
  assert.equal(solved.length, 1);
  root.querySelector('[data-decision="price"] input[value="0"]').checked = true;
  submit(form);
  assert.equal(root.querySelector('.case-report').hidden, true);
  assert.equal(root.querySelector('[data-case-report]').textContent, '');
});

test('case study restores historical solved status, escapes materials and supports cleanup', (t) => {
  installDOM(t);
  const root = document.getElementById('root'),
    activity = sample();
  activity.brief = '<img src=x onerror=alert(1)>';
  activity.evidence[0] = { label: '<b>Manual</b>', text: '<script>bad()</script>' };
  activity.decisions[0].options[0] = '<b>Nueve</b>';
  const clean = mountActivities(
    root,
    [activity],
    () => true,
    () => assert.fail('No acreditar otra vez'),
  );
  assert.equal(root.querySelector('img,script,b'), null);
  assert.match(root.textContent, /<script>bad/);
  for (const decision of activity.decisions)
    root.querySelector(
      `[data-decision="${decision.id}"] input[value="${decision.answer}"]`,
    ).checked = true;
  submit(root.querySelector('form'));
  assert.equal(root.querySelector('.badge').textContent, '✓ Resuelta');
  clean();
});
