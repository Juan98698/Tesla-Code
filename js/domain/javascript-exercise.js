export const JAVASCRIPT_LIMITS = Object.freeze({ source: 20000, cases: 20, output: 6000 });

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
    errors.push(
      'El código inicial debe ser texto de hasta ' + JAVASCRIPT_LIMITS.source + ' caracteres.',
    );
  if (
    typeof exercise.solution !== 'string' ||
    !exercise.solution.trim() ||
    exercise.solution.length > JAVASCRIPT_LIMITS.source
  )
    errors.push('Falta una solución JavaScript comprobable.');
  const simpleMap = (value) =>
    value &&
    typeof value === 'object' &&
    !Array.isArray(value) &&
    Object.keys(value).every((key) => /^[a-zA-Z_$][\w$]*$/.test(key));
  if (
    exercise.bindings !== undefined &&
    (!simpleMap(exercise.bindings) ||
      Object.values(exercise.bindings).some((v) => !['const', 'let'].includes(v)) ||
      exercise.entrypoint !== undefined)
  )
    errors.push(
      'Las declaraciones deben identificar nombres simples y const o let en un programa sin función de entrada.',
    );
  if (
    exercise.syntax !== undefined &&
    (!exercise.syntax ||
      typeof exercise.syntax !== 'object' ||
      Array.isArray(exercise.syntax) ||
      !Object.keys(exercise.syntax).length ||
      Object.keys(exercise.syntax).some(
        (k) => !['comment', 'singleQuotes', 'nodes', 'methods', 'typeof'].includes(k),
      ) ||
      Object.entries(exercise.syntax).some(([key, value]) =>
        key === 'methods'
          ? !Array.isArray(value) ||
            !value.length ||
            value.some((name) => typeof name !== 'string' || !/^[a-zA-Z_$][\w$]*$/.test(name))
          : key === 'nodes'
            ? !Array.isArray(value) ||
              !value.length ||
              value.some(
                (v) =>
                  ![
                    'IfStatement',
                    'WhileStatement',
                    'DoWhileStatement',
                    'ForStatement',
                    'FunctionDeclaration',
                    'BreakStatement',
                    'ContinueStatement',
                    'ConditionalExpression',
                    'SwitchStatement',
                    'ForOfStatement',
                    'ForInStatement',
                    'TemplateLiteral',
                    'ObjectPattern',
                    'ArrayPattern',
                    'SpreadElement',
                    'RestElement',
                    'TryStatement',
                    'ThrowStatement',
                  ].includes(v),
              )
            : value !== true,
      ))
  )
    errors.push(
      'Las comprobaciones de sintaxis deben declarar comentarios, comillas simples o estructuras admitidas explícitamente.',
    );
  if (
    exercise.retryFeedback !== undefined &&
    (typeof exercise.retryFeedback !== 'string' || !exercise.retryFeedback.trim())
  )
    errors.push('La orientación de un intento fallido debe ser texto legible.');
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
      for (const field of ['overrides', 'expectedBindings'])
        if (
          item?.[field] !== undefined &&
          (callable ||
            !simpleMap(item[field]) ||
            !jsonValue(item[field]) ||
            Object.keys(item[field]).some((key) => !Object.hasOwn(exercise.bindings ?? {}, key)))
        )
          errors.push('Las variantes y valores observados necesitan declaraciones identificadas.');
      if (
        item?.consoleArguments !== undefined &&
        (callable ||
          !item.consoleArguments ||
          typeof item.consoleArguments !== 'object' ||
          Array.isArray(item.consoleArguments) ||
          !jsonValue(item.consoleArguments))
      )
        errors.push('Los argumentos de presentación deben tener valores JSON.');
      if (
        item?.entrypoint !== undefined &&
        (!callable ||
          typeof item.entrypoint !== 'string' ||
          !/^[a-zA-Z_$][\w$]*$/.test(item.entrypoint))
      )
        errors.push(
          'El caso necesita un nombre simple de función dentro de un contrato de funciones.',
        );
      if (item?.awaitResult !== undefined && (!callable || typeof item.awaitResult !== 'boolean'))
        errors.push('La espera debe pertenecer a un caso de función.');
      if (item?.http !== undefined) {
        const http = item.http;
        if (
          !item.awaitResult ||
          !http ||
          typeof http.url !== 'string' ||
          !/^\/(?!\/)/.test(http.url) ||
          http.url.length > 200 ||
          !Number.isInteger(http.status) ||
          http.status < 200 ||
          http.status > 599 ||
          typeof http.body !== 'string' ||
          http.body.length > JAVASCRIPT_LIMITS.output ||
          (http.offline !== undefined && typeof http.offline !== 'boolean')
        )
          errors.push('La respuesta HTTP debe ser un caso acotado de la función asíncrona.');
      }
      if (item?.rejected !== undefined && typeof item.rejected !== 'boolean')
        errors.push('El rechazo de una entrada debe declararse como booleano.');
      if (item?.preserveArgs !== undefined && (!callable || typeof item.preserveArgs !== 'boolean'))
        errors.push('Conservar argumentos es una opción booleana de los casos de función.');
      if (
        item?.maxArrayReads !== undefined &&
        (!callable ||
          !Array.isArray(item.args?.[0]) ||
          !Number.isInteger(item.maxArrayReads) ||
          item.maxArrayReads < 0 ||
          item.maxArrayReads > 10_000)
      )
        errors.push(
          'El límite de lecturas necesita un arreglo como primer argumento y un entero de 0 a 10000.',
        );
      if (
        item?.stdin !== undefined &&
        (!Array.isArray(item.stdin) || item.stdin.some((value) => typeof value !== 'string'))
      )
        errors.push('Las entradas deben ser una lista de textos.');
    }
  return errors;
}
