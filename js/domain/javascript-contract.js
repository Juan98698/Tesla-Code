import { parse } from '../../assets/vendor/acorn/acorn.mjs?v=8.15.0';

// Parse syntax; never execute student source in the host page. Variants change
// only the declared input initializers, preserving the rest of the program.
export function prepareBindingCases(code, cases, bindings = {}, syntax = {}) {
  const comments = [];
  const tree = parse(code, { ecmaVersion: 2024, sourceType: 'script', onComment: comments });
  if (syntax.comment && !comments.some((c) => c.value.trim()))
    throw Error('Agrega un comentario real fuera de los textos, como pide el reto.');
  const required = new Set(syntax.nodes ?? []);
  if (syntax.typeof) required.add('typeof');
  const findStructures = (node) => {
    if (!node || typeof node !== 'object') return;
    required.delete(node.type);
    if (node.type === 'UnaryExpression' && node.operator === 'typeof') required.delete('typeof');
    for (const value of Object.values(node))
      if (value && typeof value === 'object')
        Array.isArray(value) ? value.forEach(findStructures) : findStructures(value);
  };
  if (required.size) {
    findStructures(tree);
    if (required.size)
      throw Error(
        'Aplica las estructuras del contrato: ' +
          [...required]
            .map(
              (name) =>
                ({
                  IfStatement: 'if',
                  WhileStatement: 'while',
                  DoWhileStatement: 'do...while',
                  ForStatement: 'for',
                  FunctionDeclaration: 'function',
                  BreakStatement: 'break',
                  ContinueStatement: 'continue',
                })[name] ?? name,
            )
            .join(', ') +
          '.',
      );
  }
  if (syntax.singleQuotes) {
    const literals = [];
    const visit = (node) => {
      if (!node || typeof node !== 'object') return;
      if (node.type === 'Literal' && typeof node.value === 'string') literals.push(node);
      for (const [key, value] of Object.entries(node))
        if (key !== 'value' && value && typeof value === 'object')
          Array.isArray(value) ? value.forEach(visit) : visit(value);
    };
    visit(tree);
    if (!literals.length || literals.some((node) => !node.raw.startsWith("'")))
      throw Error('Reescribe los textos usando comillas simples rectas, conservando el reporte.');
  }
  const declarations = new Map();
  for (const statement of tree.body) {
    if (statement.type !== 'VariableDeclaration') continue;
    for (const declaration of statement.declarations)
      if (declaration.id.type === 'Identifier')
        declarations.set(declaration.id.name, { ...declaration, kind: statement.kind });
  }
  for (const [name, kind] of Object.entries(bindings)) {
    const declaration = declarations.get(name);
    if (!declaration?.init || declaration.kind !== kind)
      throw Error(`Declara ${name} con ${kind} y un valor inicial, como pide el contrato.`);
  }
  return cases.map((item) => {
    let source = code;
    const replacements = Object.entries(item.overrides ?? {})
      .map(([name, value]) => {
        const declaration = declarations.get(name);
        if (!Object.hasOwn(bindings, name) || !declaration?.init)
          throw Error('La variante intenta cambiar un dato que no pertenece al contrato.');
        return {
          start: declaration.init.start,
          end: declaration.init.end,
          value: JSON.stringify(value),
        };
      })
      .sort((a, b) => b.start - a.start);
    for (const change of replacements)
      source = source.slice(0, change.start) + change.value + source.slice(change.end);
    return { ...item, source };
  });
}
