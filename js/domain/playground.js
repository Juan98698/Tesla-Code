const settings = {
  fundamentos: {
    label: 'Valor inicial',
    value: '10',
    type: 'number',
    title: 'Una variable que cambia',
    from: 'Valor',
    to: 'Memoria',
    action: '+ 1',
  },
  python: {
    label: 'Personas (entero no negativo)',
    value: '3',
    type: 'number',
    title: 'Un presupuesto: entrada de 8 y transporte total de 5',
    from: 'Personas',
    to: 'Total',
    action: '× 8 + 5',
  },
  algoritmia: {
    label: 'Lista de números',
    value: '-8, -3, -6',
    title: 'Encuentra el mayor',
    from: 'Lista',
    to: 'Resultado',
    action: 'Comparar',
  },
  frontend: {
    label: 'Título de tu interfaz',
    value: 'Mi próxima idea',
    title: 'Una interfaz que responde',
    from: 'Texto',
    to: 'Interfaz',
    action: 'Renderizar',
  },
  backend: {
    label: 'Recurso',
    value: '/saludo',
    options: ['/saludo', '/proyectos', '/no-existe'],
    title: 'Un cliente y una respuesta',
    from: 'Cliente',
    to: 'Servidor',
    action: 'GET',
  },
  'bases-de-datos': {
    label: 'Filtrar proyectos',
    value: 'todos',
    options: ['todos', 'backend', 'frontend', 'ia'],
    title: 'Encuentra tus datos',
    from: 'Consulta',
    to: 'Datos',
    action: 'SELECT',
  },
  ia: {
    label: 'Pregunta al documento',
    value: '¿Cuántos días dura un préstamo?',
    title: 'Busca evidencia antes de responder',
    from: 'Pregunta',
    to: 'Evidencia',
    action: 'Buscar',
  },
};
export const playgroundSettings = (id) => settings[id] ?? settings.fundamentos;
const projects = [
  { nombre: 'Mi primera API', tipo: 'backend' },
  { nombre: 'Portfolio', tipo: 'frontend' },
  { nombre: 'Asistente documental', tipo: 'ia' },
];
export function runPlayground(id, raw) {
  const input = String(raw).trim();
  if (!input || input.length > 160) throw Error('Escribe entre 1 y 160 caracteres.');
  if (id === 'backend') {
    const body =
      input === '/saludo'
        ? { mensaje: '¡Hola, mundo!', estado: 'ok' }
        : input === '/proyectos'
          ? { proyectos: projects.map((p) => p.nombre) }
          : { error: 'Recurso no encontrado' };
    return {
      request: `GET ${encodeURI(input)} HTTP/1.1\nHost: ejemplo.local`,
      body,
      status: input === '/saludo' || input === '/proyectos' ? '200 OK' : '404 Not Found',
    };
  }
  if (id === 'frontend')
    return {
      request: `const titulo = document.createElement('h2');\ntitulo.textContent = ${JSON.stringify(input)};`,
      body: { titulo: input },
      status: 'Interfaz actualizada',
      preview: input,
    };
  if (id === 'bases-de-datos') {
    if (!['todos', 'backend', 'frontend', 'ia'].includes(input))
      throw Error('Elige uno de los filtros disponibles.');
    return {
      request: `SELECT nombre, tipo\nFROM proyectos${input === 'todos' ? ';' : `\nWHERE tipo = '${input}';`}`,
      body: projects.filter((p) => input === 'todos' || p.tipo === input),
      status: 'Consulta local completada',
    };
  }
  if (id === 'ia') {
    const fold = (s) =>
      s
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase();
    const docs = [
      {
        words: ['prestamo', 'dias', 'devolver'],
        texto: 'El préstamo dura siete días.',
        fuente: 'Manual de biblioteca',
      },
      {
        words: ['horario', 'abre', 'abierta'],
        texto: 'La biblioteca abre de 9:00 a 18:00.',
        fuente: 'Horario publicado',
      },
    ];
    const evidence = docs
      .filter((d) => d.words.some((w) => fold(input).includes(w)))
      .map(({ texto, fuente }) => ({ texto, fuente }));
    return {
      request: `buscar_evidencia(${JSON.stringify(input)})`,
      body: { evidencia: evidence },
      status: evidence.length ? 'Evidencia encontrada' : 'No hay respaldo en estos documentos',
    };
  }
  if (id === 'algoritmia') {
    const parts = input.split(',').map((n) => n.trim());
    if (
      parts.length > 40 ||
      parts.some((n) => !/^[+-]?(?:\d+\.?\d*|\.\d+)$/.test(n) || !Number.isFinite(Number(n)))
    )
      throw Error('Usa hasta 40 números separados por comas.');
    const numbers = parts.map(Number);
    return {
      request: `datos ← [${numbers.join(', ')}]\nmayor ← primer elemento\nPARA CADA valor restante\n    SI valor > mayor: mayor ← valor\nDEVOLVER mayor`,
      body: { mayor: Math.max(...numbers), elementos: numbers.length },
      status: 'Comparación completada',
    };
  }
  const value = Number(input);
  if (!Number.isFinite(value) || Math.abs(value) > 1000000)
    throw Error('Usa un número entre -1000000 y 1000000.');
  if (id === 'python') {
    if (!Number.isInteger(value) || value < 0)
      throw Error('La cantidad de personas debe ser un entero no negativo.');
    return {
      request: `personas = ${value}\nentrada = 8\ntransporte = 5\ntotal = personas * entrada + transporte\nprint("Total:", total)`,
      body: { total: value * 8 + 5 },
      status: 'Presupuesto simulado · Practica con Python real dentro de la ruta',
    };
  }
  return {
    request: `let contador = ${value};\ncontador = contador + 1;\nconsole.log(contador);`,
    body: { antes: value, despues: value + 1 },
    status: 'Simulación JavaScript · Ejecuta código real dentro de Fundamentos',
  };
}
