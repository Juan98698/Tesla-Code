import { createHash } from 'node:crypto';

// Hash semántico: el formato del JSON no obliga a repetir una revisión.
function canonical(value) {
  if (Array.isArray(value)) return value.map(canonical);
  if (value && typeof value === 'object')
    return Object.fromEntries(
      Object.keys(value)
        .sort()
        .map((key) => [key, canonical(value[key])]),
    );
  return value;
}
export const digest = (value) =>
  createHash('sha256')
    .update(JSON.stringify(canonical(value)))
    .digest('hex');
export function lessonDigest(meta, data, registry) {
  const used = new Set([
    ...(meta.teaches ?? []),
    ...(data.requiresConcepts ?? []),
    ...data.quiz.map((q) => q.concept),
    ...data.activities.map((a) => a.concept),
  ]);
  const curriculum = Object.fromEntries(
    [
      'id',
      'title',
      'concepts',
      'teaches',
      'requiresConcepts',
      'dependsOn',
      'status',
      'kind',
      'technologyRefs',
      'learningGoals',
    ].map((key) => [key, meta[key]]),
  );
  return digest({ curriculum, data, concepts: registry.filter((c) => used.has(c.id)) });
}
export function explanationText(html) {
  return html
    .replace(/<\/?[a-zA-Z][^>]*>/g, ' ')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#x27;|&#39;/g, "'")
    .replace(/&amp;/g, '&')
    .replace(/\s+/g, ' ')
    .trim();
}
export const REVIEW_CHECKS = [
  'prerequisites',
  'definitions',
  'examples',
  'assessment',
  'practice',
  'language-rules',
];
export function coverageErrors(meta, data) {
  const errors = [],
    text = explanationText(data.html ?? '');
  for (const cid of meta.teaches ?? []) {
    const coverage = data.coverage?.[cid];
    if (!coverage) {
      errors.push(`${cid}: falta evidencia de explicación y evaluación.`);
      continue;
    }
    if (
      typeof coverage.explanationExcerpt !== 'string' ||
      coverage.explanationExcerpt.length < 25 ||
      !text.includes(coverage.explanationExcerpt)
    )
      errors.push(`${cid}: el fragmento de explicación no existe en el contenido actual.`);
    if (!Array.isArray(coverage.assessmentIds) || !coverage.assessmentIds.length)
      errors.push(`${cid}: falta una evaluación identificada.`);
    for (const id of coverage.assessmentIds ?? []) {
      if (!(data.quiz ?? []).some((q) => q.id === id && q.concept === cid))
        errors.push(`${cid}: la pregunta ${id} no evalúa ese concepto.`);
    }
  }
  for (const cid of Object.keys(data.coverage ?? {}))
    if (!(meta.teaches ?? []).includes(cid))
      errors.push(`${cid}: cobertura de un concepto no introducido aquí.`);
  return errors;
}
export function reviewErrors(review, currentDigest) {
  const errors = [];
  if (!review || review.status !== 'reviewed') return ['Falta una revisión pedagógica explícita.'];
  if (review.digest !== currentDigest)
    errors.push('La revisión pedagógica está desactualizada: vuelve a revisar esta versión.');
  if (!review.reviewer || !review.notes?.trim())
    errors.push('La revisión necesita autor y notas concretas.');
  for (const check of REVIEW_CHECKS)
    if (review.checks?.[check] !== true) errors.push(`Falta revisar ${check}.`);
  return errors;
}

// Detecta omisiones concretas; no sustituye la lectura editorial.
export function curriculumSequenceErrors(route) {
  const errors = [];
  const lessons = route.levels.flatMap((level) => level.lessons);
  const positions = new Map(lessons.map((lesson, index) => [lesson.id, index]));
  if (route.entryApproach !== 'conceptual')
    errors.push('La ruta debe declarar una entrada conceptual independiente.');
  const first = lessons[0];
  if (!first || first.status !== 'published')
    errors.push('La primera lección debe estar publicada.');
  if (first?.dependsOn?.length || first?.requiresConcepts?.length)
    errors.push('La entrada conceptual no puede presuponer lecciones o conceptos previos.');
  for (const lesson of lessons)
    for (const dependency of lesson.dependsOn ?? []) {
      if (!dependency.startsWith(route.id + '/')) continue;
      const id = dependency.slice(route.id.length + 1);
      if (positions.has(id) && positions.get(id) >= positions.get(lesson.id))
        errors.push(lesson.id + ': requisito interno posterior en el orden visible: ' + id + '.');
      const prerequisite = lessons[positions.get(id)];
      if (lesson.kind === 'core' && prerequisite?.kind === 'optional')
        errors.push(lesson.id + ': el tronco principal depende de una especialización opcional.');
    }
  return errors;
}

export function learningDesignErrors(meta, data, { entry = false } = {}) {
  const errors = [];
  const text = explanationText(data.html ?? '');
  const design = data.learningDesign;
  const list = (value) => (Array.isArray(value) ? value : []);
  if (!Array.isArray(design?.assumptions) || !design.assumptions.length)
    errors.push('Faltan condiciones explícitas del ejemplo.');
  for (const assumption of list(design?.assumptions))
    if (typeof assumption !== 'string' || !text.includes(assumption))
      errors.push('Una condición del ejemplo no aparece en la explicación visible.');
  for (const part of ['problem', 'reasoning', 'result']) {
    const excerpt = design?.workedExample?.[part];
    if (typeof excerpt !== 'string' || excerpt.length < 20 || !text.includes(excerpt))
      errors.push('Ejemplo razonado incompleto: falta ' + part + ' en la explicación.');
  }
  const transfer = design?.transferActivityIds;
  if (!Array.isArray(transfer) || !transfer.length)
    errors.push('Falta una práctica identificada para aplicar el ejemplo.');
  for (const id of list(transfer))
    if (!(data.activities ?? []).some((activity) => activity.id === id))
      errors.push('La práctica de transferencia ' + id + ' no existe.');
  const normalized = (items) => JSON.stringify([...list(items)].sort());
  if (normalized(meta.requiresConcepts) !== normalized(data.requiresConcepts))
    errors.push('Los requisitos del contenido y del temario no coinciden.');
  const declared = new Set([...(meta.teaches ?? []), ...(meta.requiresConcepts ?? [])]);
  for (const question of [...(data.quiz ?? []), ...(data.activities ?? [])])
    if (!declared.has(question.concept))
      errors.push(question.id + ': concepto evaluado sin requisito o enseñanza explícitos.');
  const languages = new Set([
    'text',
    'pseudocode',
    'python',
    'shell',
    'http',
    'sql',
    'javascript',
    'json',
  ]);
  for (const block of (data.html ?? '').matchAll(/<pre\b([^>]*)>([\s\S]*?)<\/pre>/g)) {
    const language = block[1].match(/\bdata-language="([^"]+)"/)?.[1];
    if (!languages.has(language))
      errors.push('Un bloque de ejemplo no declara su lenguaje o representación.');
    if (entry && !['text', 'pseudocode'].includes(language))
      errors.push('La entrada conceptual introduce código ejecutable antes del diseño.');
    if (language === 'python') {
      const program = explanationText(block[2]);
      if (!(data.examples ?? []).some((example) => explanationText(example.code) === program))
        errors.push(
          'Un bloque Python no tiene un ejemplo ejecutable que compruebe sus resultados.',
        );
    }
  }
  return errors;
}
