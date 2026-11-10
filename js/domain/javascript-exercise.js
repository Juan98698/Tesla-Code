export const JAVASCRIPT_LIMITS = Object.freeze({ source: 12000, cases: 20, output: 6000 });

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
  if (exercise.entrypoint !== undefined)
    errors.push('Esta edición comprueba programas completos mediante su salida.');
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
      if (typeof item?.stdout !== 'string' || item.stdout.length > JAVASCRIPT_LIMITS.output)
        errors.push('Cada caso necesita una salida de hasta 6000 caracteres.');
      if (
        item?.stdin !== undefined &&
        (!Array.isArray(item.stdin) || item.stdin.some((value) => typeof value !== 'string'))
      )
        errors.push('Las entradas deben ser una lista de textos.');
    }
  return errors;
}
