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
    ['id', 'title', 'concepts', 'teaches', 'requiresConcepts', 'dependsOn', 'status', 'kind'].map(
      (key) => [key, meta[key]],
    ),
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
