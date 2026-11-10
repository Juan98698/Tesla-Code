import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, writeFileSync, mkdtempSync, cpSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { spawnSync } from 'node:child_process';
import {
  digest,
  lessonDigest,
  coverageErrors,
  reviewErrors,
  REVIEW_CHECKS,
  curriculumSequenceErrors,
  learningDesignErrors,
} from '../tools/pedagogy.mjs';
const read = (path) => JSON.parse(readFileSync(path, 'utf8'));
const meta = {
  id: 'one',
  title: 'First',
  dependsOn: [],
  teaches: ['c'],
  requiresConcepts: [],
  status: 'published',
  kind: 'core',
  concepts: ['Value'],
};
const data = {
  html: '<p>A value is information used by a program to perform an operation.</p>',
  quiz: [{ id: 'q', concept: 'c' }],
  activities: [{ id: 'a', concept: 'c' }],
  coverage: {
    c: {
      explanationExcerpt: 'A value is information used by a program to perform an operation.',
      assessmentIds: ['q'],
    },
  },
};
test('semantic digest ignores JSON formatting and object key order', () => {
  assert.equal(digest({ a: 1, b: 2 }), digest({ b: 2, a: 1 }));
  const current = lessonDigest(meta, data, []),
    changed = lessonDigest({ ...meta, dependsOn: ['later'] }, data, []);
  assert.notEqual(current, changed);
  assert.notEqual(current, lessonDigest(meta, { ...data, html: 'A different explanation' }, []));
});
test('coverage rejects deleted definitions, unrelated questions and missing concepts', () => {
  assert.deepEqual(coverageErrors(meta, data), []);
  assert.ok(
    coverageErrors(meta, { ...data, html: 'Removed' }).some((e) => e.includes('fragmento')),
  );
  assert.ok(
    coverageErrors(meta, { ...data, quiz: [{ id: 'q', concept: 'other' }] }).some((e) =>
      e.includes('no evalúa'),
    ),
  );
  assert.ok(
    coverageErrors(meta, { ...data, coverage: {} }).some((e) => e.includes('falta evidencia')),
  );
});
test('a changed lesson cannot reuse its old editorial sign-off', () => {
  const review = {
    status: 'reviewed',
    reviewer: 'Reviewer',
    notes: 'Reviewed prerequisites and example.',
    digest: 'old',
    checks: Object.fromEntries(REVIEW_CHECKS.map((k) => [k, true])),
  };
  assert.deepEqual(reviewErrors(review, 'old'), []);
  assert.ok(reviewErrors(review, 'new').some((e) => e.includes('desactualizada')));
  assert.ok(reviewErrors({ ...review, checks: {} }, 'old').length >= REVIEW_CHECKS.length);
  assert.ok(reviewErrors(null, 'old').length > 0);
});
function invalidContent(t, relative, mutate) {
  const directory = mkdtempSync(join(tmpdir(), 'teslacode-pedagogy-'));
  t.after(() => rmSync(directory, { recursive: true, force: true }));
  cpSync(resolve('content'), join(directory, 'content'), { recursive: true });
  cpSync(resolve('package.json'), join(directory, 'package.json'));
  const file = join(directory, relative),
    json = read(file);
  mutate(json);
  writeFileSync(file, JSON.stringify(json));
  const result = spawnSync(process.execPath, [resolve('tools/validate-content.mjs')], {
    cwd: directory,
    encoding: 'utf8',
  });
  assert.notEqual(result.status, 0);
  return result.stdout + result.stderr;
}
test('real publication gate rejects content changes without re-review', (t) => {
  const output = invalidContent(
    t,
    'content/lessons/fundamentos/tu-primer-paso.json',
    (d) => (d.html += '<p>A new prerequisite was added.</p>'),
  );
  assert.match(output, /revisión pedagógica está desactualizada/);
});
test('real publication gate rejects a new course without content and review', (t) => {
  const output = invalidContent(t, 'content/curriculum/frontend.json', (r) => {
    r.levels.flatMap((l) => l.lessons).find((m) => m.id === 'html-semantico').status = 'published';
  });
  assert.match(output, /Falta content\/lessons\/frontend\/html-semantico.json/);
});
test('real curriculum gate rejects assumed concepts introduced later', (t) => {
  const output = invalidContent(t, 'content/curriculum/fundamentos.json', (r) => {
    r.levels[0].lessons[0].requiresConcepts = ['fundamentos.clase'];
  });
  assert.match(output, /concepto requerido fundamentos.clase sin antecedente/);
});
test('real coverage gate rejects removing every assessment for a concept', (t) => {
  const output = invalidContent(t, 'content/lessons/fundamentos/tipos-de-datos.json', (d) => {
    d.quiz = d.quiz.filter((q) => q.concept !== 'fundamentos.entero');
  });
  assert.match(output, /no evalúa ese concepto/);
});

test('real example gate rejects code that differs from the lesson display', (t) => {
  const output = invalidContent(t, 'content/lessons/fundamentos/clases-y-objetos.json', (d) => {
    d.examples[0].code = 'print("not the displayed example")';
  });
  assert.match(output, /ejemplo ejecutable no coincide/);
});
test('real example gate rejects unsupported executable languages', (t) => {
  const output = invalidContent(t, 'content/lessons/fundamentos/clases-y-objetos.json', (d) => {
    d.examples[0].language = 'unsupported';
  });
  assert.match(output, /lenguaje sin runner/);
});
test('publication requires reusable refreshers for external concepts', (t) => {
  const output = invalidContent(t, 'content/concepts.json', (r) => {
    delete r.concepts.find((c) => c.id === 'fundamentos.variable').refresher;
  });
  assert.match(output, /falta repaso opcional para el concepto transversal fundamentos.variable/);
});

test('visible curriculum order rejects later prerequisites and mandatory optional specialties', () => {
  const first = {
    id: 'start',
    status: 'published',
    kind: 'core',
    dependsOn: [],
    requiresConcepts: [],
  };
  const route = {
    id: 'r',
    entryApproach: 'conceptual',
    levels: [{ lessons: [first, { id: 'next', kind: 'core', dependsOn: ['r/start'] }] }],
  };
  assert.deepEqual(curriculumSequenceErrors(route), []);
  const forward = structuredClone(route);
  forward.levels[0].lessons.reverse();
  assert.ok(curriculumSequenceErrors(forward).some((error) => error.includes('posterior')));
  const optional = structuredClone(route);
  optional.levels[0].lessons[0].kind = 'optional';
  assert.ok(curriculumSequenceErrors(optional).some((error) => error.includes('especialización')));
});

test('worked examples require visible reasoning, conditions and a real transfer activity', () => {
  const d = read('content/lessons/fundamentos/tu-primer-paso.json');
  const m = read('content/curriculum/fundamentos.json').levels.find(
    (level) => level.id === 'primeros-pasos',
  ).lessons[0];
  assert.deepEqual(learningDesignErrors(m, d, { entry: true }), []);
  const missing = structuredClone(d);
  missing.html = missing.html.replace(missing.learningDesign.workedExample.reasoning, '');
  assert.ok(learningDesignErrors(m, missing).some((error) => error.includes('reasoning')));
  const condition = structuredClone(d);
  condition.learningDesign.assumptions = ['A condition not explained to the learner.'];
  assert.ok(learningDesignErrors(m, condition).some((error) => error.includes('condición')));
  const transfer = structuredClone(d);
  transfer.learningDesign.transferActivityIds = ['nonexistent'];
  assert.ok(learningDesignErrors(m, transfer).some((error) => error.includes('no existe')));
});

test('a conceptual entry rejects executable code even when an example has expected output', (t) => {
  const output = invalidContent(
    t,
    'content/lessons/algoritmia/que-hace-bueno-a-un-algoritmo.json',
    (d) => {
      d.html += '<pre data-language="python">for n in [1]:\n    print(n)</pre>';
      d.examples = [
        {
          id: 'sudden-code',
          language: 'python',
          code: 'for n in [1]:\n    print(n)',
          stdout: '1\n',
        },
      ];
    },
  );
  assert.match(output, /entrada conceptual introduce código/);
});

test('publication rejects differing prerequisite declarations and undeclared assessment concepts', (t) => {
  const mismatch = invalidContent(t, 'content/lessons/fundamentos/editor-y-ejecucion.json', (d) => {
    d.requiresConcepts = [];
  });
  assert.match(mismatch, /requisitos del contenido y del temario no coinciden/);
  const undeclared = invalidContent(t, 'content/lessons/fundamentos/variables.json', (d) => {
    d.quiz[0].concept = 'fundamentos.archivo';
  });
  assert.match(undeclared, /concepto evaluado sin requisito o enseñanza explícitos/);
});

test('publication rejects Python without an executed example declaration and unlabeled blocks', (t) => {
  const missing = invalidContent(
    t,
    'content/lessons/algoritmia/implementar-algoritmos-en-python.json',
    (d) => {
      delete d.examples;
    },
  );
  assert.match(missing, /bloque Python no tiene un ejemplo ejecutable/);
  const unlabeled = invalidContent(
    t,
    'content/lessons/algoritmia/implementar-algoritmos-en-python.json',
    (d) => {
      d.html = d.html.replace(' data-language="python"', '');
    },
  );
  assert.match(unlabeled, /no declara su lenguaje/);
});

test('publication rejects displaying a prerequisite after its dependent lesson', (t) => {
  const output = invalidContent(t, 'content/curriculum/algoritmia.json', (r) => {
    const lessons = r.levels[0].lessons;
    [lessons[1], lessons[2]] = [lessons[2], lessons[1]];
  });
  assert.match(output, /requisito interno posterior en el orden visible/);
});
