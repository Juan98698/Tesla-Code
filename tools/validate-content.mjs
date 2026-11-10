// Valida estructura y dependencias explícitas. La coherencia pedagógica requiere revisión editorial.
import { readFileSync, existsSync, readdirSync } from 'node:fs';
import { indexRoute, includeArchives } from '../js/domain/curriculum.js';
import { checkTechnologyPolicy, checkLessonTechnology } from './technology-policy.mjs';
import { pythonExerciseErrors } from '../js/domain/python-exercise.js';
import { javascriptExerciseErrors } from '../js/domain/javascript-exercise.js';
import {
  digest,
  lessonDigest,
  reviewErrors,
  coverageErrors,
  explanationText,
  curriculumSequenceErrors,
  learningDesignErrors,
  publicationDepthErrors,
} from './pedagogy.mjs';
const errors = [];
const read = (path) => JSON.parse(readFileSync(path, 'utf8'));
const fail = (message) => errors.push(message);
const routes = read('content/curriculum/index.json').routes;
const registry = read('content/concepts.json').concepts;
const technologyPolicy = read('content/technology-policy.json');
const today = new Date().toISOString().slice(0, 10);
for (const error of checkTechnologyPolicy(
  technologyPolicy,
  read('package.json'),
  today,
  process.versions.node,
))
  fail(error);
const reviews = existsSync('content/pedagogy-reviews.json')
  ? read('content/pedagogy-reviews.json')
  : { routes: {}, lessons: {} };
const depthBacklog = new Set(read('content/editorial-backlog.json').lessons);
const concepts = new Map(),
  lessons = new Map(),
  files = new Set(),
  entryKeys = new Set();
let published = 0;
for (const c of registry) {
  if (concepts.has(c.id)) fail(`Concepto duplicado: ${c.id}`);
  concepts.set(c.id, c);
}
for (const rid of routes) {
  const source = read(`content/curriculum/${rid}.json`);
  for (const error of reviewErrors(reviews.routes[rid], digest(source)))
    fail(`Ruta ${rid}: ${error}`);
  const route = indexRoute(source);
  entryKeys.add(`${rid}/${route.lessons[0]?.id}`);
  for (const error of curriculumSequenceErrors(source)) fail('Ruta ' + rid + ': ' + error);
  if (route.id !== rid) fail(`Ruta inconsistente: ${rid}`);
  for (const meta of includeArchives([route]).flatMap((edition) => edition.lessons)) {
    const key = `${rid}/${meta.id}`;
    if (lessons.has(key)) fail(`Lección duplicada: ${key}`);
    if (!['published', 'planned'].includes(meta.status)) fail(`${key}: estado inválido`);
    if (!['core', 'optional'].includes(meta.kind)) fail(`${key}: recorrido inválido`);
    if (!Array.isArray(meta.dependsOn) || !Array.isArray(meta.teaches))
      fail(`${key}: faltan dependencias o conceptos`);
    lessons.set(key, meta);
    for (const error of checkLessonTechnology(meta, null, technologyPolicy, today))
      fail(`${key}: ${error}`);
    for (const cid of meta.teaches ?? []) {
      if (concepts.get(cid)?.introducedBy !== key)
        fail(`${key}: introducción inconsistente de ${cid}`);
    }
  }
}
const visiting = new Set(),
  visited = new Set();
function visit(key) {
  if (visiting.has(key)) {
    fail(`Dependencia circular en ${key}`);
    return;
  }
  if (visited.has(key)) return;
  visiting.add(key);
  const lesson = lessons.get(key);
  for (const dep of lesson?.dependsOn ?? []) {
    if (!lessons.has(dep)) fail(`${key}: requisito inexistente ${dep}`);
    else {
      if (lesson.status === 'published' && lessons.get(dep).status !== 'published')
        fail(`${key}: requisito no publicado ${dep}`);
      visit(dep);
    }
  }
  visiting.delete(key);
  visited.add(key);
}
for (const key of lessons.keys()) visit(key);
function ancestors(key, seen = new Set()) {
  for (const dep of lessons.get(key)?.dependsOn ?? []) {
    if (!seen.has(dep)) {
      seen.add(dep);
      ancestors(dep, seen);
    }
  }
  return seen;
}
for (const c of registry) {
  if (!lessons.has(c.introducedBy)) fail(`${c.id}: punto de introducción inexistente`);
  else if (
    !lessons.get(c.introducedBy).teaches.includes(c.id) ||
    lessons.get(c.introducedBy).status !== c.status
  )
    fail(`${c.id}: registro y punto de introducción no coinciden`);
}
for (const [key, meta] of lessons) {
  if (!Array.isArray(meta.requiresConcepts))
    fail(`${key}: faltan requisitos conceptuales del temario`);
  for (const cid of meta.requiresConcepts ?? [])
    if (!ancestors(key).has(concepts.get(cid)?.introducedBy))
      fail(`${key}: concepto requerido ${cid} sin antecedente en el mapa`);
}
function checkQuestion(q, where, allowed) {
  if (!q.id || !q.prompt || !q.explanation || !concepts.has(q.concept))
    fail(`${where}: faltan datos o concepto válido`);
  if (q.concept && !allowed.has(concepts.get(q.concept)?.introducedBy))
    fail(`${where}: concepto ${q.concept} sin introducción previa o actual`);
  if (q.type === 'choice') {
    if (
      !Array.isArray(q.options) ||
      q.options.length < 2 ||
      new Set(q.options).size !== q.options.length
    )
      fail(`${where}: opciones insuficientes o duplicadas`);
    if (!Number.isInteger(q.answer) || q.answer < 0 || q.answer >= q.options?.length)
      fail(`${where}: respuesta fuera de rango`);
  } else if (q.type === 'order') {
    if (!Array.isArray(q.steps) || q.steps.length < 2 || new Set(q.steps).size !== q.steps.length)
      fail(`${where}: pasos insuficientes o duplicados`);
  } else if (q.type === 'text') {
    if (
      !Array.isArray(q.answers) ||
      !q.answers.length ||
      q.answers.some((a) => typeof a !== 'string' || !a.trim())
    )
      fail(`${where}: respuestas vacías`);
  } else if (q.type === 'python') {
    for (const error of pythonExerciseErrors(q)) fail(`${where}: ${error}`);
  } else if (q.type === 'javascript') {
    for (const error of javascriptExerciseErrors(q)) fail(`${where}: ${error}`);
  } else fail(`${where}: tipo desconocido ${q.type}`);
}
for (const [key, meta] of lessons) {
  if (meta.status !== 'published') continue;
  published++;
  const path = `content/lessons/${key}.json`;
  files.add(path);
  if (!existsSync(path)) {
    fail(`Falta ${path}`);
    continue;
  }
  const data = read(path),
    allowed = ancestors(key);
  if (!depthBacklog.has(key))
    for (const error of publicationDepthErrors(data)) fail(path + ': ' + error);
  for (const cid of meta.requiresConcepts ?? []) {
    const c = concepts.get(cid);
    if (c && !c.introducedBy.startsWith(key.split('/')[0] + '/') && !c.refresher)
      fail(`${path}: falta repaso opcional para el concepto transversal ${cid}`);
  }
  for (const error of checkLessonTechnology(meta, data, technologyPolicy, today))
    fail(`${path}: ${error}`);
  for (const error of coverageErrors(meta, data)) fail(`${path}: ${error}`);
  for (const error of reviewErrors(reviews.lessons[key], lessonDigest(meta, data, registry)))
    fail(`${path}: ${error}`);
  for (const error of learningDesignErrors(meta, data, {
    entry: entryKeys.has(key),
    entryLanguage: meta.language,
  }))
    fail(path + ': ' + error);
  allowed.add(key);
  if (data.id !== key.split('/')[1]) fail(`${path}: id inconsistente`);
  if (!data.html || !data.outcome) fail(`${path}: falta explicación u objetivo`);
  if (data.examples !== undefined) {
    if (!Array.isArray(data.examples)) fail(`${path}: examples debe ser una lista`);
    else {
      if (new Set(data.examples.map((example) => example.id)).size !== data.examples.length)
        fail(`${path}: IDs de ejemplo duplicados`);
      for (const example of data.examples) {
        if (
          example.environment !== undefined &&
          !['browser', 'local'].includes(example.environment)
        )
          fail(path + ': entorno de ejemplo desconocido');
        if (example.environment === 'local' && !example.environmentNote?.trim())
          fail(path + ': explica cómo ejecutar el ejemplo local');
        if (
          example.stdin !== undefined &&
          (!Array.isArray(example.stdin) ||
            example.stdin.some((value) => typeof value !== 'string'))
        )
          fail(path + ': entradas de ejemplo inválidas');
        if (
          !example.id ||
          !['python', 'javascript'].includes(example.language) ||
          typeof example.code !== 'string' ||
          typeof example.stdout !== 'string'
        )
          fail(`${path}: ejemplo ejecutable incompleto o lenguaje sin runner`);
        else if (!explanationText(data.html).includes(explanationText(example.code)))
          fail(`${path}: el ejemplo ejecutable no coincide con el contenido mostrado`);
      }
    }
  }
  if (/<script\b|\son\w+=/i.test(data.html)) fail(`${path}: HTML ejecutable no permitido`);
  if (!Array.isArray(data.requiresConcepts)) fail(`${path}: faltan requisitos de conceptos`);
  for (const cid of data.requiresConcepts ?? [])
    if (!concepts.has(cid) || !ancestors(key).has(concepts.get(cid).introducedBy))
      fail(`${path}: requisito ${cid} sin antecedente`);
  if (!Array.isArray(data.quiz) || data.quiz.length < 4) fail(`${path}: mínimo cuatro preguntas`);
  if (new Set((data.quiz ?? []).map((q) => q.id)).size !== data.quiz?.length)
    fail(`${path}: ids de pregunta duplicados`);
  for (const q of data.quiz ?? []) {
    if (['python', 'javascript'].includes(q.type))
      fail(`${path}/${q.id}: el código pertenece a la práctica, no al quiz.`);
    checkQuestion(q, `${path}/${q.id}`, allowed);
  }
  if (!Array.isArray(data.activities) || !data.activities.length) fail(`${path}: falta práctica`);
  if (new Set((data.activities ?? []).map((a) => a.id)).size !== data.activities?.length)
    fail(`${path}: ids de actividad duplicados`);
  for (const a of data.activities ?? []) {
    checkQuestion(a, `${path}/${a.id}`, allowed);
    if (!a.hint) fail(`${path}/${a.id}: falta pista`);
  }
  const knownWidgets = [
    'variables-sim',
    'guess-game',
    'tip-calculator',
    'cycle-lab',
    'condition-lab',
    'token-lab',
    'diffusion-lab',
    'runner',
  ];
  if (data.widget && !knownWidgets.includes(data.widget)) fail(`${path}: widget no registrado`);
  for (const source of data.sources ?? [])
    if (!/^https:\/\//.test(source.url)) fail(`${path}: fuente no HTTPS`);
}
for (const c of registry.filter((c) => c.refresher)) {
  const r = c.refresher;
  if (!r.explanation?.trim() || !r.example?.trim() || !r.activity?.hint)
    fail(`${c.id}: repaso conceptual incompleto`);
  checkQuestion({ ...r.activity, concept: c.id }, `${c.id}/repaso`, new Set([c.introducedBy]));
}
for (const rid of routes) {
  const dir = `content/lessons/${rid}`;
  if (existsSync(dir))
    for (const file of readdirSync(dir))
      if (file.endsWith('.json') && !files.has(`${dir}/${file}`))
        fail(`Archivo huérfano o no publicado: ${dir}/${file}`);
}
console.log(
  `Rutas: ${routes.length} · Temas: ${lessons.size} · Publicadas: ${published} · Conceptos: ${concepts.size}`,
);
if (errors.length) {
  console.error(errors.map((message) => `✗ ${message}`).join('\n'));
  process.exit(1);
}
console.log(
  '✓ Dependencias, cobertura explicativa/evaluativa y revisiones vigentes verificadas. La suficiencia pedagógica sigue requiriendo juicio editorial.',
);
