import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import {
  indexRoute,
  accessState,
  nextLesson,
  progressionRequirements,
} from '../js/domain/curriculum.js';
import { curriculumSequenceErrors, publicationDepthErrors } from '../tools/pedagogy.mjs';
const read = (p) => JSON.parse(readFileSync(p));
test('Python introduces classes before unittest, while every route retains a free conceptual entry', () => {
  const python = indexRoute(read('content/curriculum/python.json'));
  assert.ok(python.pos['clases-e-instancias'] < python.pos['pruebas-unitarias']);
  assert.ok(
    python.lessons[python.pos['pruebas-unitarias']].requiresConcepts.includes(
      'python.clases-e-instancias.4',
    ),
  );
  for (const id of read('content/curriculum/index.json').routes) {
    const route = indexRoute(read('content/curriculum/' + id + '.json'));
    assert.equal(accessState(route, route.lessons[0].id, new Set()).status, 'ready');
  }
});
test('new publications require sources and more than one repeated activity', () => {
  const source = { title: 'Python', url: 'https://docs.python.org/3/' };
  assert.equal(publicationDepthErrors({}).length, 2);
  assert.equal(
    publicationDepthErrors({
      sources: [source],
      activities: [{ id: 'a' }, { id: 'a' }, { id: 'b' }],
    }).length,
    1,
  );
  for (const invalid of [
    { title: '', url: source.url },
    { title: 'Invalid', url: 'broken' },
    { title: 'Insecure', url: 'http://example.com' },
  ])
    assert.ok(publicationDepthErrors({ sources: [invalid], activities: [] }).length);
  assert.deepEqual(
    publicationDepthErrors({
      sources: [source],
      activities: [{ id: 'a' }, { id: 'b' }, { id: 'c' }],
    }),
    [],
  );
});
test('academic edges do not replace mandatory steps or make a lab block the core', () => {
  const route = indexRoute({
    id: 'r',
    schemaVersion: 2,
    entryApproach: 'conceptual',
    levels: [
      {
        lessons: [
          {
            id: 'a',
            kind: 'core',
            status: 'published',
            dependsOn: [],
            requiresConcepts: [],
            progressionRequires: [],
          },
          {
            id: 'lab',
            kind: 'optional',
            status: 'published',
            dependsOn: ['r/a', 'python/first'],
            progressionRequires: ['r/a'],
          },
          {
            id: 'b',
            kind: 'core',
            status: 'published',
            dependsOn: [],
            progressionRequires: ['r/a'],
          },
          {
            id: 'c',
            kind: 'core',
            status: 'published',
            dependsOn: ['r/a'],
            progressionRequires: ['r/b'],
          },
        ],
      },
    ],
  });
  assert.equal(accessState(route, 'b', new Set()).status, 'locked');
  const done = new Set(['r/a']);
  assert.equal(nextLesson(route, done).id, 'b');
  assert.equal(accessState(route, 'lab', done).status, 'ready');
  assert.deepEqual(accessState(route, 'lab', done).recommended, ['python/first']);
  assert.equal(accessState(route, 'c', done).status, 'locked');
  done.add('r/b');
  assert.equal(accessState(route, 'c', done).status, 'ready');
  assert.deepEqual(progressionRequirements(route, route.lessons[2]), ['r/a']);
  assert.deepEqual(curriculumSequenceErrors(route), []);
});
test('publication rejects skipped, external, future, unavailable or optional progression steps', () => {
  const sample = () => ({
    id: 'r',
    schemaVersion: 2,
    entryApproach: 'conceptual',
    levels: [
      {
        lessons: [
          {
            id: 'a',
            kind: 'core',
            status: 'published',
            dependsOn: [],
            requiresConcepts: [],
            progressionRequires: [],
          },
          {
            id: 'b',
            kind: 'core',
            status: 'published',
            dependsOn: [],
            progressionRequires: ['r/a'],
          },
          {
            id: 'c',
            kind: 'core',
            status: 'published',
            dependsOn: [],
            progressionRequires: ['r/b'],
          },
        ],
      },
    ],
  });
  for (const steps of [undefined, [], ['other/a'], ['r/c'], ['r/a', 'r/a']]) {
    const r = sample();
    r.levels[0].lessons[1].progressionRequires = steps;
    assert.ok(curriculumSequenceErrors(r).length);
  }
  const optional = sample();
  optional.levels[0].lessons[1].kind = 'optional';
  assert.ok(curriculumSequenceErrors(optional).some((e) => e.includes('opcional')));
  const planned = sample();
  planned.levels[0].lessons[1].status = 'planned';
  assert.ok(curriculumSequenceErrors(planned).some((e) => e.includes('preparación')));
  const gated = sample();
  gated.levels[0].lessons[0].progressionRequires = ['r/b'];
  assert.ok(curriculumSequenceErrors(gated).some((e) => e.includes('entrada')));
});
test('algorithm prerequisites explicitly connect queues, stacks and heaps to the techniques that use them', () => {
  const route = indexRoute(read('content/curriculum/algoritmia.json'));
  const lesson = (id) => route.lessons[route.pos[id]];
  assert.ok(lesson('recorridos-de-grafos').requiresConcepts.includes('algoritmia.fifo'));
  assert.ok(lesson('recorridos-de-grafos').requiresConcepts.includes('algoritmia.lifo'));
  assert.ok(lesson('caminos-minimos').requiresConcepts.includes('algoritmia.cola-de-prioridad'));
  assert.ok(!lesson('tablas-hash').dependsOn.includes('algoritmia/colas-y-colas-dobles'));
  assert.ok(
    !lesson('grafos-y-representaciones').dependsOn.includes(
      'algoritmia/tries-y-arboles-de-segmentos',
    ),
  );
  const core = route.lessons.filter((l) => l.kind === 'core' && l.status === 'published');
  const done = new Set();
  for (const meta of core) {
    assert.equal(accessState(route, meta.id, done).status, 'ready', meta.id);
    const content = read('content/lessons/algoritmia/' + meta.id + '.json');
    assert.ok(!/data-language="python"/.test(content.html), meta.id);
    done.add('algoritmia/' + meta.id);
  }
  assert.equal(done.has('algoritmia/implementar-algoritmos-en-python'), false);
});
