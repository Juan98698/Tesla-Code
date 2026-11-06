// Valida el contenido: ids únicos, lecciones publicadas con archivo, quizzes bien formados
// y, sobre todo, que ningún requisito de una lección se use antes de enseñarse.
import { existsSync, readdirSync, readFileSync } from 'node:fs';

const read = (path) => JSON.parse(readFileSync(path, 'utf8'));
const errors = [];
const fail = (message) => errors.push(message);

function checkQuiz(file, quiz) {
  if (!Array.isArray(quiz) || quiz.length < 4) fail(`${file}: el quiz necesita al menos 4 preguntas`);
  (quiz ?? []).forEach((q, i) => {
    const where = `${file} pregunta ${i + 1}`;
    if (!q.prompt || !q.explanation || !q.concept) fail(`${where}: faltan prompt, explanation o concept`);
    if (q.type === 'choice') {
      if (!Array.isArray(q.options) || q.options.length < 2) fail(`${where}: opciones insuficientes`);
      else if (!Number.isInteger(q.answer) || q.answer < 0 || q.answer >= q.options.length) fail(`${where}: answer fuera de rango`);
    } else if (q.type === 'order') {
      if (!Array.isArray(q.steps) || q.steps.length < 2) fail(`${where}: pasos insuficientes`);
    } else fail(`${where}: tipo desconocido "${q.type}"`);
  });
}

const { routes } = read('content/curriculum/index.json');
let published = 0;
let total = 0;

for (const routeId of routes) {
  const route = read(`content/curriculum/${routeId}.json`);
  const ids = new Set();
  const taught = [];
  for (const level of route.levels) {
    for (const lesson of level.lessons) {
      total += 1;
      if (ids.has(lesson.id)) fail(`${routeId}: id repetido ${lesson.id}`);
      ids.add(lesson.id);
      if (lesson.status === 'published') {
        published += 1;
        const file = `content/lessons/${routeId}/${lesson.id}.json`;
        if (!existsSync(file)) fail(`Falta el archivo ${file}`);
        else {
          const data = read(file);
          if (data.id !== lesson.id) fail(`${file}: el id no coincide con el temario`);
          checkQuiz(file, data.quiz);
          for (const req of data.requires ?? []) {
            if (!taught.some((t) => t.includes(req.toLowerCase()))) fail(`${file}: el requisito "${req}" no se enseña antes`);
          }
        }
      }
      taught.push(lesson.title.toLowerCase(), ...lesson.concepts.map((c) => c.toLowerCase()));
    }
  }
  const dir = `content/lessons/${routeId}`;
  if (existsSync(dir)) {
    for (const file of readdirSync(dir)) {
      const id = file.replace(/\.json$/, '');
      if (!ids.has(id)) fail(`${dir}/${file}: lección huérfana, no figura en el temario`);
    }
  }
}

console.log(`Rutas: ${routes.length} · Lecciones: ${total} · Publicadas: ${published}`);
if (errors.length) {
  console.error(errors.map((e) => `✗ ${e}`).join('\n'));
  process.exit(1);
}
console.log('✓ Contenido válido: sin vacíos conceptuales.');
