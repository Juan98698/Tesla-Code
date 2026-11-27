import { parse } from 'acorn';

// Reviewed Math reference: method inventory is independent of the lesson data.
export const MATH_METHODS = [
  'abs',
  'acos',
  'acosh',
  'asin',
  'asinh',
  'atan',
  'atanh',
  'atan2',
  'cbrt',
  'ceil',
  'clz32',
  'cos',
  'cosh',
  'exp',
  'expm1',
  'f16round',
  'floor',
  'fround',
  'hypot',
  'imul',
  'log',
  'log1p',
  'log2',
  'log10',
  'max',
  'min',
  'pow',
  'random',
  'round',
  'sign',
  'sin',
  'sinh',
  'sqrt',
  'sumPrecise',
  'tan',
  'tanh',
  'trunc',
];
export const MATH_CONSTANTS = ['E', 'LN2', 'LN10', 'LOG2E', 'LOG10E', 'PI', 'SQRT1_2', 'SQRT2'];

export function mathReferences(code) {
  const references = new Set();
  function visit(node) {
    if (!node || typeof node !== 'object') return;
    if (
      node.type === 'MemberExpression' &&
      node.object.type === 'Identifier' &&
      node.object.name === 'Math'
    ) {
      const name = node.computed ? node.property.value : node.property.name;
      if (typeof name === 'string') references.add(name);
    }
    for (const value of Object.values(node))
      if (value && typeof value === 'object')
        Array.isArray(value) ? value.forEach(visit) : visit(value);
  }
  visit(parse(code, { ecmaVersion: 2024, sourceType: 'script' }));
  return references;
}

export function mathCoverageErrors(catalog) {
  const errors = [];
  const guides = new Map(catalog.guides.map((guide) => [guide.id, guide]));
  for (const [kind, names] of [
    ['methods', MATH_METHODS],
    ['constants', MATH_CONSTANTS],
  ]) {
    const coverage = catalog.mathCoverage?.[kind] ?? {};
    for (const name of Object.keys(coverage))
      if (!names.includes(name)) errors.push(`Math.${name}: referencia sin revisar`);
    for (const name of names) {
      const entry = coverage[name];
      const guide = guides.get(entry?.topic);
      const section = guide?.sections.find((section) => section.title === entry.section);
      if (!section || !new RegExp('\\b' + name + '\\b').test(section.text)) {
        errors.push(`Math.${name}: falta localizar su explicación`);
        continue;
      }
      if (
        ![guide.example, ...(guide.examples ?? [])].some((example) =>
          mathReferences(example.code).has(name),
        )
      )
        errors.push(`Math.${name}: falta un ejemplo ejecutable`);
      if (kind === 'methods') {
        const activities = [
          ...['guided', 'bug', 'challenge'].map((id) => ({ id, ...guide[id] })),
          ...(guide.practices ?? []),
        ];
        const activity = activities.find((activity) => activity.id === entry.practice);
        if (!activity?.cases?.length || !mathReferences(activity.solution).has(name))
          errors.push(`Math.${name}: falta una práctica comprobable`);
      }
    }
  }
  for (const guide of catalog.guides) {
    const ids = new Set(['guided', 'bug', 'challenge'].map((key) => guide.id + '-' + key));
    for (const activity of guide.practices ?? []) {
      if (!/^[a-z0-9-]+$/.test(activity.id ?? '') || ids.has(activity.id) || !activity.title)
        errors.push(`${guide.id}: práctica adicional inválida`);
      ids.add(activity.id);
    }
    for (const example of guide.examples ?? [])
      if (
        !example.title ||
        !example.explanation ||
        !example.code ||
        typeof example.stdout !== 'string'
      )
        errors.push(`${guide.id}: ejemplo adicional incompleto`);
    for (const example of [guide.example, ...(guide.examples ?? [])])
      if (
        example.verification &&
        (example.verification.kind !== 'numeric-range' ||
          !Number.isFinite(example.verification.min) ||
          !Number.isFinite(example.verification.maxExclusive) ||
          example.verification.min >= example.verification.maxExclusive ||
          !example.observation)
      )
        errors.push(`${guide.id}: observación variable sin contrato`);
    if (guide.capability && !MATH_METHODS.includes(guide.capability))
      errors.push(`${guide.id}: compatibilidad desconocida`);
  }
  return errors;
}
