export const JAVASCRIPT_LIMITS = Object.freeze({ source: 12000, cases: 20, output: 6000 });

const jsonValue = (value, depth = 0) =>
  depth <= 20 &&
  (value === null ||
    typeof value === 'string' ||
    typeof value === 'boolean' ||
    (typeof value === 'number' && Number.isFinite(value)) ||
    (typeof value === 'object' &&
      Object.values(value).every((item) => jsonValue(item, depth + 1))));

export function javascriptExerciseErrors(exercise) {
  const errors = [];
  if (typeof exercise.starter !== 'string' || exercise.starter.length > JAVASCRIPT_LIMITS.source)
    errors.push('El código inicial debe ser texto de hasta 12000 caracteres.');
  if (
    typeof exercise.solution !== 'string' ||
    !exercise.solution.trim() ||
    exercise.solution.length > JAVASCRIPT_LIMITS.source
  )
    errors.push('Falta una solución JavaScript comprobable.');
  const callable = exercise.entrypoint !== undefined;
  if (
    callable &&
    (typeof exercise.entrypoint !== 'string' || !/^[a-zA-Z_$][\w$]*$/.test(exercise.entrypoint))
  )
    errors.push('La función necesita un nombre simple válido.');
  if (
    !Array.isArray(exercise.cases) ||
    !exercise.cases.length ||
    exercise.cases.length > JAVASCRIPT_LIMITS.cases
  )
    errors.push('El ejercicio requiere entre 1 y 20 casos.');
  else
    for (const item of exercise.cases) {
      if (!item || typeof item.name !== 'string' || !item.name.trim())
        errors.push('Cada caso necesita un nombre.');
      if (
        (!callable || item?.stdout !== undefined) &&
        (typeof item?.stdout !== 'string' || item.stdout.length > JAVASCRIPT_LIMITS.output)
      )
        errors.push('Cada caso necesita una salida de hasta 6000 caracteres.');
      if (
        callable &&
        (!Array.isArray(item?.args) ||
          !jsonValue(item.args) ||
          !Object.hasOwn(item ?? {}, 'expected') ||
          !jsonValue(item.expected))
      )
        errors.push('Cada caso de función necesita argumentos y un resultado JSON finito.');
      if (item?.preserveArgs !== undefined && (!callable || typeof item.preserveArgs !== 'boolean'))
        errors.push('Conservar argumentos es una opción booleana de los casos de función.');
      if (
        item?.stdin !== undefined &&
        (!Array.isArray(item.stdin) || item.stdin.some((value) => typeof value !== 'string'))
      )
        errors.push('Las entradas deben ser una lista de textos.');
    }
  return errors;
}
