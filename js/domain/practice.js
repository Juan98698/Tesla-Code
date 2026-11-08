export const PRACTICE_TYPES = Object.freeze({
  trace: 'Traza',
  predict: 'Predice',
  bug: 'Arregla',
  order: 'Ordena',
});

const text = (value) => typeof value === 'string' && value.trim() !== '';
const lines = (value, min) =>
  Array.isArray(value) && value.length >= min && value.every((line) => typeof line === 'string');
const inRange = (value, size) => Number.isInteger(value) && value >= 0 && value < size;
const choice = (c) =>
  Boolean(c) &&
  text(c.prompt) &&
  text(c.explanation) &&
  Array.isArray(c.options) &&
  c.options.length >= 2 &&
  c.options.every(text) &&
  inRange(c.answer, c.options.length);

export function validatePractice(item) {
  if (!item || !text(item.id)) return ['práctica sin id'];
  const errors = [];
  const fail = (message) => errors.push(`${item.id}: ${message}`);
  if (!/^[a-z0-9-]+$/.test(item.id)) fail('el id debe usar solo minúsculas, dígitos y guiones');
  if (!Object.hasOwn(PRACTICE_TYPES, item.type)) fail(`tipo desconocido "${item.type}"`);
  for (const key of ['title', 'concept', 'level', 'goal'])
    if (!text(item[key])) fail(`falta ${key}`);
  if (!Number.isInteger(item.minutes) || item.minutes < 1)
    fail('minutes debe ser un entero positivo');
  if (item.type === 'trace') {
    if (!lines(item.lines, 2)) fail('trace necesita al menos 2 líneas');
    if (!Array.isArray(item.steps) || item.steps.length < 1) fail('trace necesita pasos');
    else
      item.steps.forEach((step, i) => {
        const ok =
          inRange(step.line, item.lines?.length ?? 0) &&
          step.vars &&
          typeof step.vars === 'object' &&
          text(step.note);
        if (!ok) fail(`el paso ${i + 1} es inválido`);
      });
    if (!choice(item.predict)) fail('predict inválido');
    if (!choice(item.challenge)) fail('challenge inválido');
  } else if (item.type === 'predict') {
    if (!lines(item.lines, 1)) fail('predict necesita código');
    if (!choice(item.check)) fail('check inválido');
  } else if (item.type === 'bug') {
    if (!lines(item.lines, 2)) fail('bug necesita al menos 2 líneas');
    if (!inRange(item.bugLine, item.lines?.length ?? 0)) fail('bugLine fuera de rango');
    if (!Array.isArray(item.fixes) || item.fixes.length < 2 || !item.fixes.every(text))
      fail('bug necesita al menos 2 correcciones');
    else if (!inRange(item.fix, item.fixes.length)) fail('fix fuera de rango');
    if (!text(item.symptom) || !text(item.explanation)) fail('faltan symptom o explanation');
  } else if (item.type === 'order') {
    if (!lines(item.lines, 3)) fail('order necesita al menos 3 líneas');
    if (!text(item.explanation)) fail('falta explanation');
  }
  return errors;
}

export function traceState(item, done) {
  const last = done > 0 ? item.steps[done - 1] : null;
  return {
    vars: last ? last.vars : {},
    note: last ? last.note : null,
    next: item.steps[done] ? item.steps[done].line : null,
    finished: done >= item.steps.length,
  };
}

export const gradeChoice = (c, index) => index === c.answer;
export const gradeBugLine = (item, index) => index === item.bugLine;
export const gradeOrder = (item, picked) =>
  picked.length === item.lines.length && picked.every((line, i) => line === item.lines[i]);
export const filterPractice = (items, type) =>
  type === 'all' ? items : items.filter((item) => item.type === type);
