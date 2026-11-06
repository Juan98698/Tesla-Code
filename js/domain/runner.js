// Intérprete acotado: secuencias, asignación, aritmética y mostrar. Nunca usa eval.
export function runProgram(source) {
  if (source.length > 4000) throw new Error('Usa un programa de hasta 4.000 caracteres.');
  const lines = source.split('\n');
  if (lines.length > 50) throw new Error('Usa hasta 50 líneas.');
  const memory = Object.create(null),
    output = [],
    trace = [];
  function expression(text) {
    const tokens = text.match(/\d+(?:\.\d+)?|[a-zA-Z_][a-zA-Z_0-9]*|[()+*/%-]/g) ?? [];
    if (tokens.join('') !== text.replace(/\s/g, ''))
      throw new Error('Usa números, variables y operadores + - * / % ( ).');
    let i = 0;
    function atom() {
      const token = tokens[i++];
      if (token === '-') return -atom();
      if (token === '(') {
        const value = sum();
        if (tokens[i++] !== ')') throw new Error('Falta un paréntesis de cierre.');
        return value;
      }
      if (/^\d/.test(token ?? '')) return Number(token);
      if (Object.hasOwn(memory, token)) return memory[token];
      throw new Error(
        token ? `La variable ${token} no tiene un valor.` : 'Falta un valor en la expresión.',
      );
    }
    function product() {
      let value = atom();
      while (['*', '/', '%'].includes(tokens[i])) {
        const op = tokens[i++],
          right = atom();
        if (right === 0 && (op === '/' || op === '%'))
          throw new Error('No se puede dividir entre cero en este laboratorio.');
        value = op === '*' ? value * right : op === '/' ? value / right : value % right;
      }
      return value;
    }
    function sum() {
      let value = product();
      while (tokens[i] === '+' || tokens[i] === '-') {
        const op = tokens[i++],
          right = product();
        value = op === '+' ? value + right : value - right;
      }
      return value;
    }
    const value = sum();
    if (i !== tokens.length || !Number.isFinite(value))
      throw new Error('Revisa la expresión: no produce un número finito.');
    return value;
  }
  lines.forEach((raw, line) => {
    const text = raw.split('//')[0].trim();
    if (!text) return;
    try {
      const assignment = text.match(/^([a-zA-Z_]\w*)\s*=\s*(.+)$/),
        show = text.match(/^mostrar\((.*)\)$/);
      if (assignment) memory[assignment[1]] = expression(assignment[2]);
      else if (show) output.push(String(expression(show[1])));
      else throw new Error('Usa nombre = expresión o mostrar(expresión).');
      trace.push({ line: line + 1, memory: { ...memory } });
    } catch (error) {
      throw new Error(`Línea ${line + 1}: ${error.message}`);
    }
  });
  return { memory: { ...memory }, output, trace };
}
