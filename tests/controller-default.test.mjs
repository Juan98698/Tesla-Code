import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { installDOM, until, answerQuizDOM } from './support/dom.mjs';
const shell = readFileSync('index.html', 'utf8');
const read = (path) => JSON.parse(readFileSync(path, 'utf8'));
const start = () => import('../js/main.js').then((m) => m.ready);
test('default URL, completed state and saved theme initialize without losing prior progress', async (t) => {
  installDOM(t, shell, 'http://localhost/');
  const ids = read('content/curriculum/index.json').routes;
  const completed = ids.flatMap((id) =>
    read(`content/curriculum/${id}.json`).levels.flatMap((l) =>
      l.lessons.filter((m) => m.status === 'published').map((m) => `${id}/${m.id}`),
    ),
  );
  localStorage.setItem('teslacode:theme', 'dark');
  localStorage.setItem('teslacode:progress:v2', JSON.stringify({ completed, xp: 250 }));
  t.mock.method(globalThis, 'fetch', async (path) => ({ ok: true, json: async () => read(path) }));
  await start();
  await until(() => document.querySelector('.hero'));
  assert.equal(document.documentElement.dataset.theme, 'dark');
  assert.match(
    document.getElementById('content').textContent,
    /Completaste las lecciones disponibles/,
  );
  assert.equal(document.getElementById('xp').textContent, '250 XP');
  location.hash = '#/leccion/fundamentos/proyecto-final-integrador/comprobar';
  await until(() => document.getElementById('qbox'));
  answerQuizDOM(read('content/lessons/fundamentos/proyecto-final-integrador.json'));
  assert.match(document.getElementById('qbox').textContent, /Completaste la ruta Fundamentos/);
  [...document.querySelectorAll('#qbox button')]
    .find((b) => b.textContent === 'Ver mi progreso →')
    .click();
  await until(() => document.getElementById('export-progress'));
  location.hash = '#/leccion/ia/elegir-proyecto-ia/comprobar';
  await until(() => document.getElementById('qbox'));
  answerQuizDOM(read('content/lessons/ia/elegir-proyecto-ia.json'));
  assert.match(
    document.getElementById('qbox').textContent,
    /Los demás temas siguen en preparación/,
  );
  [...document.querySelectorAll('#qbox button')]
    .find((b) => b.textContent === 'Explorar otra ruta →')
    .click();
  await until(() => document.getElementById('goal-select'));
});
