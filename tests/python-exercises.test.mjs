import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { loadPyodide } from 'pyodide';
import { PYTHON_HARNESS, pythonExerciseErrors } from '../js/domain/python-exercise.js';
import { PYODIDE_INDEX } from '../js/repositories/python-runner.js';

const exercises = readdirSync('content/lessons', { withFileTypes: true })
  .filter((entry) => entry.isDirectory())
  .flatMap((route) =>
    readdirSync('content/lessons/' + route.name)
      .filter((name) => name.endsWith('.json'))
      .flatMap((name) => {
        const data = JSON.parse(readFileSync('content/lessons/' + route.name + '/' + name));
        return data.activities
          .filter((a) => a.type === 'python')
          .map((a) => ({
            key: route.name + '/' + name + '/' + a.id,
            ...a,
          }));
      }),
  );

test('published Python solutions execute in the same pinned runtime as the browser', async () => {
  assert.ok(exercises.length >= 10, 'Exercises include a complete first module, not a demo only');
  const runtime = await loadPyodide();
  const version = JSON.parse(readFileSync('node_modules/pyodide/package.json')).version;
  assert.ok(
    PYODIDE_INDEX.includes('/v' + version + '/'),
    'Browser and installed engines must use the same release',
  );
  runtime.runPython(PYTHON_HARNESS);
  const evaluate = (code, cases, entrypoint, mode) => {
    runtime.globals.set('_exercise_payload', JSON.stringify({ code, cases, entrypoint, mode }));
    return JSON.parse(runtime.runPython('_evaluate_exercise(_json.loads(_exercise_payload))'));
  };
  const emitted = [];
  runtime.globals.set('_console_emit', (text) => emitted.push(text));
  const free = evaluate(
    'print(input("Nombre: "))',
    [{ name: 'free', stdin: ['Ana'] }],
    undefined,
    'run',
  );
  assert.equal(free.results[0].stdout, 'Nombre: Ana\n');
  assert.equal(free.results[0].passed, null);
  assert.equal(emitted.at(-1), 'Nombre: Ana\n');
  const failure = evaluate('print("antes")\n1 / 0', [{ name: 'error' }], undefined, 'run');
  assert.equal(failure.results[0].stdout, 'antes\n');
  assert.match(failure.results[0].traceback, /ejercicio.py.*line 2/s);
  assert.ok(!failure.results[0].traceback.includes('_evaluate_exercise'));
  assert.equal(evaluate('x = 2', [{ name: 'silent' }], undefined, 'run').results[0].stdout, '');
  const fn = evaluate(
    'def twice(n):\n    print("debug")\n    return n * 2',
    [{ name: 'f', args: [2], expected: 4 }],
    'twice',
  );
  assert.equal(fn.results[0].actual, '4');
  assert.equal(fn.results[0].stdout, 'debug\n');
  let examples = 0;
  for (const route of readdirSync('content/lessons')) {
    for (const file of readdirSync('content/lessons/' + route).filter((name) =>
      name.endsWith('.json'),
    )) {
      const data = JSON.parse(readFileSync('content/lessons/' + route + '/' + file));
      for (const example of data.examples ?? []) {
        if (example.environment === 'local') continue;
        const path = '/console-example-' + examples++;
        runtime.FS.mkdirTree(path);
        runtime.runPython('import os\nos.chdir("' + path + '")');
        const result = evaluate(
          example.code,
          [{ name: example.id, stdin: example.stdin ?? [] }],
          undefined,
          'run',
        );
        assert.equal(result.results[0].error, undefined, route + '/' + file);
        assert.equal(result.results[0].stdout, example.stdout, route + '/' + file);
      }
    }
  }
  assert.ok(examples >= 43);
  for (const exercise of exercises) {
    assert.deepEqual(pythonExerciseErrors(exercise), [], exercise.key);
    const result = evaluate(exercise.solution, exercise.cases, exercise.entrypoint);
    assert.ok(
      result.results.every((item) => item.passed),
      exercise.key + ': ' + JSON.stringify(result),
    );
    assert.ok(
      evaluate(
        'print("respuesta fija incorrecta")',
        exercise.cases,
        exercise.entrypoint,
      ).results.some((item) => !item.passed),
      exercise.key + ' rejects an unrelated program',
    );
  }
  const cases = [
    { name: 'positive', args: [3], expected: 6 },
    { name: 'negative', args: [-2], expected: -4 },
  ];
  for (const code of ['def twice(n):\n    return n * 2', 'def twice(n):\n    return n + n'])
    assert.ok(evaluate(code, cases, 'twice').results.every((item) => item.passed));
  assert.match(
    evaluate('def broken(', [{ name: 'syntax', stdout: '' }]).results[0].error,
    /SyntaxError/,
  );
  assert.match(
    evaluate('print(1 / 0)', [{ name: 'exception', stdout: '' }]).results[0].error,
    /ZeroDivisionError/,
  );
  assert.match(
    evaluate('print(input())', [{ name: 'input', stdout: '' }]).results[0].error,
    /EOFError/,
  );
  assert.match(
    evaluate('print("x" * 7000)', [{ name: 'output', stdout: '' }]).results[0].error,
    /OutputLimit/,
  );
  assert.match(evaluate('pass', cases, 'twice').results[0].error, /NameError/);
  assert.equal(
    evaluate('print("clean")', [{ name: 'fresh state', stdout: 'clean\n' }]).results[0].passed,
    true,
  );
  assert.match(
    evaluate('print(input("Número: "))', [{ name: 'prompt', stdin: ['2'], stdout: 'Número: 2\n' }])
      .version,
    /^3\.14\./,
  );
});

test('code exercise validation rejects missing contracts and unsupported structures', () => {
  assert.ok(pythonExerciseErrors({}).length >= 3);
  assert.ok(
    pythonExerciseErrors({ starter: 'x'.repeat(12001), solution: '', cases: [], entrypoint: 'a.b' })
      .length >= 4,
  );
  const base = { starter: '', solution: 'print(1)', cases: [{ name: 'one', stdout: '1\n' }] };
  assert.deepEqual(pythonExerciseErrors(base), []);
  for (const changes of [
    { cases: [{}] },
    { cases: [{ name: 'n', stdout: 2 }] },
    { cases: [{ name: 'n', stdout: '', stdin: [3] }] },
    { entrypoint: 'f', cases: [{ name: 'n', args: [] }] },
    { cases: Array(21).fill(base.cases[0]) },
  ])
    assert.ok(pythonExerciseErrors({ ...base, ...changes }).length);
  assert.deepEqual(
    pythonExerciseErrors({
      ...base,
      entrypoint: 'f',
      cases: [{ name: 'n', args: [], expected: null }],
    }),
    [],
  );
});
