export const PYTHON_LIMITS = Object.freeze({ source: 12000, cases: 20, output: 6000 });

export function pythonExerciseErrors(exercise) {
  const errors = [];
  if (typeof exercise.starter !== 'string' || exercise.starter.length > PYTHON_LIMITS.source)
    errors.push('El código inicial debe ser texto de hasta 12000 caracteres.');
  if (
    typeof exercise.solution !== 'string' ||
    !exercise.solution.trim() ||
    exercise.solution.length > PYTHON_LIMITS.source
  )
    errors.push('Falta una solución de referencia comprobable.');
  if (exercise.entrypoint !== undefined && !/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(exercise.entrypoint))
    errors.push('El nombre de función no es válido.');
  if (
    !Array.isArray(exercise.cases) ||
    !exercise.cases.length ||
    exercise.cases.length > PYTHON_LIMITS.cases
  ) {
    errors.push('El ejercicio requiere entre 1 y 20 casos.');
  } else
    for (const item of exercise.cases) {
      if (!item || typeof item.name !== 'string' || !item.name.trim())
        errors.push('Cada caso necesita un nombre.');
      if (exercise.entrypoint) {
        if (!Array.isArray(item?.args) || !Object.hasOwn(item ?? {}, 'expected'))
          errors.push('Cada caso de función necesita argumentos y resultado esperado.');
      } else if (typeof item?.stdout !== 'string')
        errors.push('Cada caso de programa necesita una salida esperada.');
      if (
        item?.stdin !== undefined &&
        (!Array.isArray(item.stdin) || item.stdin.some((value) => typeof value !== 'string'))
      )
        errors.push('Las entradas deben ser una lista de textos.');
      if (
        item?.globals !== undefined &&
        (!item.globals ||
          typeof item.globals !== 'object' ||
          Array.isArray(item.globals) ||
          Object.keys(item.globals).some((name) => !/^[a-zA-Z][a-zA-Z0-9_]*$/.test(name)))
      )
        errors.push('Los datos iniciales deben usar nombres simples de variables.');
    }
  return errors;
}

// El contrato es compartido por Pyodide bajo Node (CI) y en el navegador.
// Los casos son material didáctico visible, no un sistema de certificación.
export const PYTHON_HARNESS = `
import builtins as _builtins
import contextlib as _contextlib
import io as _io
import json as _json
import sys as _sys

class _OutputLimit(Exception):
    pass

class _BoundedOutput(_io.StringIO):
    def write(self, text):
        if self.tell() + len(text) > 6000:
            raise _OutputLimit("La salida supera 6000 caracteres.")
        return super().write(text)

def _evaluate_exercise(payload):
    results = []
    for case in payload["cases"]:
        stream = _BoundedOutput()
        values = iter(case.get("stdin", []))
        previous_input = _builtins.input
        def read_input(prompt=""):
            print(prompt, end="")
            try:
                return next(values)
            except StopIteration:
                raise EOFError("El programa solicita más entradas que las disponibles.")
        namespace = {"__name__": "__main__"}
        namespace.update(case.get("globals", {}))
        try:
            _builtins.input = read_input
            with _contextlib.redirect_stdout(stream), _contextlib.redirect_stderr(stream):
                exec(compile(payload["code"], "ejercicio.py", "exec"), namespace)
                if payload.get("entrypoint"):
                    fn = namespace.get(payload["entrypoint"])
                    if not callable(fn):
                        raise NameError("Define la función " + payload["entrypoint"] + ".")
                    value = fn(*case["args"])
                    actual = _json.dumps(value, ensure_ascii=False, sort_keys=True)
                    expected = _json.dumps(case["expected"], ensure_ascii=False, sort_keys=True)
                else:
                    actual = stream.getvalue().replace("\\r\\n", "\\n")
                    expected = case["stdout"].replace("\\r\\n", "\\n")
            results.append({"name": case["name"], "passed": actual == expected,
                            "actual": actual[:6000], "expected": expected[:6000]})
        except BaseException as error:
            results.append({"name": case["name"], "passed": False,
                            "error": type(error).__name__ + ": " + str(error)[:1500],
                            "actual": stream.getvalue()[:6000]})
        finally:
            _builtins.input = previous_input
    return _json.dumps({"results": results, "version": _sys.version.split()[0]}, ensure_ascii=False)
`;
