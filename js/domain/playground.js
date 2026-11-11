const settings = {
  fundamentos: {
    label: 'Valor inicial',
    value: '10',
    type: 'number',
    title: 'Una variable que cambia',
    from: 'Valor',
    to: 'Memoria',
    action: '+ 1',
    goal: 'Descubre cómo cambia un dato guardado: empezamos con un número y le sumamos uno.',
    try: 'Escribe 10, predice el número siguiente y pulsa Probar. Después repite con 0.',
    observe: 'Compara «antes» y «después»: la diferencia siempre debe ser uno.',
  },
  python: {
    label: 'Personas (entero no negativo)',
    value: '3',
    type: 'number',
    title: 'Un presupuesto: entrada de 8 y transporte total de 5',
    from: 'Personas',
    to: 'Total',
    action: '× 8 + 5',
    goal: 'Calcula un presupuesto separando un costo por persona de un costo fijo.',
    try: 'Prueba con 3 personas y luego con 0. Cada entrada cuesta 8 y el transporte total cuesta 5.',
    observe: 'Observa que el transporte se suma una sola vez, incluso cuando el grupo cambia.',
  },
  algoritmia: {
    label: 'Lista de números',
    value: '-8, -3, -6',
    title: 'Encuentra el mayor',
    from: 'Lista',
    to: 'Resultado',
    action: 'Comparar',
    goal: 'Encuentra el número mayor revisando una lista, también cuando todos son negativos.',
    try: 'Prueba -8, -3, -6. Luego añade 2 al final y compara los resultados.',
    observe:
      'El mayor es el número situado más a la derecha en la recta numérica; no el que tiene más cifras.',
  },
  frontend: {
    label: 'Título de tu interfaz',
    value: 'Mi próxima idea',
    title: 'Una interfaz que responde',
    from: 'Texto',
    to: 'Interfaz',
    action: 'Renderizar',
    goal: 'Relaciona un texto de entrada con el título que ve una persona en una página.',
    try: 'Escribe tu nombre y pulsa Probar. Cambia el texto y observa el título nuevo.',
    observe: 'La vista cambia porque la entrada se utiliza como contenido del título.',
  },
  backend: {
    label: 'Recurso',
    value: '/saludo',
    options: ['/saludo', '/proyectos', '/no-existe'],
    title: 'Un cliente y una respuesta',
    from: 'Cliente',
    to: 'Servidor',
    action: 'GET',
    goal: 'Distingue una petición del cliente y la respuesta que devuelve un servidor.',
    try: 'Prueba /saludo y después /no-existe. Mira el contenido y el estado de cada respuesta.',
    observe:
      '200 indica que se encontró el recurso; 404 indica que no está disponible en este ejemplo.',
  },
  'bases-de-datos': {
    label: 'Filtrar proyectos',
    value: 'todos',
    options: ['todos', 'backend', 'frontend', 'ia'],
    title: 'Encuentra tus datos',
    from: 'Consulta',
    to: 'Datos',
    action: 'SELECT',
    goal: 'Descubre cómo un filtro selecciona registros de una colección de datos.',
    try: 'Elige «todos» y pulsa Probar. Después selecciona «frontend» y compara las filas.',
    observe: 'El filtro cambia qué registros se muestran; no borra los datos originales.',
  },
  ia: {
    label: 'Pregunta al documento',
    value: '¿Cuántos días dura un préstamo?',
    title: 'Busca evidencia antes de responder',
    from: 'Pregunta',
    to: 'Evidencia',
    action: 'Buscar',
    goal: 'Aprende a buscar respaldo en un documento antes de responder una pregunta.',
    try: 'Pregunta por el préstamo, luego por el horario y finalmente por el precio de una entrada.',
    observe:
      'Comprueba la fuente de cada coincidencia. Una pregunta sin respaldo debe quedarse sin evidencia.',
    reference:
      'Manual de biblioteca: «El préstamo dura siete días». Horario publicado: «La biblioteca abre de 9:00 a 18:00».',
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
      explanation:
        input === '/saludo' || input === '/proyectos'
          ? 'El servidor simulado reconoce la dirección y devuelve datos. El número 200 indica que la petición tuvo éxito.'
          : 'La dirección no está en este servidor simulado. La respuesta 404 informa del recurso ausente; no es un fallo de tu computadora.',
    };
  }
  if (id === 'frontend')
    return {
      request: `const titulo = document.createElement('h2');\ntitulo.textContent = ${JSON.stringify(input)};`,
      body: { titulo: input },
      status: 'Interfaz actualizada',
      preview: input,
      explanation:
        'El texto que escribiste se convirtió en el título visible. Se trata como texto, por lo que las etiquetas que escribas no se ejecutan.',
    };
  if (id === 'bases-de-datos') {
    if (!['todos', 'backend', 'frontend', 'ia'].includes(input))
      throw Error('Elige uno de los filtros disponibles.');
    return {
      request: `SELECT nombre, tipo\nFROM proyectos${input === 'todos' ? ';' : `\nWHERE tipo = '${input}';`}`,
      body: projects.filter((p) => input === 'todos' || p.tipo === input),
      status: 'Consulta local completada',
      explanation:
        input === 'todos'
          ? 'Se muestran los tres proyectos de la colección de ejemplo.'
          : 'Se muestran solo los proyectos cuyo tipo coincide con tu selección. Los demás siguen en la colección.',
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
      explanation: evidence.length
        ? 'La búsqueda encontró palabras relacionadas en los documentos mostrados. Lee la cita y su fuente: una coincidencia de palabras no garantiza que responda toda tu pregunta.'
        : 'Ninguno de los dos documentos contiene una coincidencia para esa pregunta. Este ejemplo no inventa una respuesta: necesitaríamos otra fuente.',
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
      explanation:
        'Se compararon ' +
        numbers.length +
        ' números. El mayor es ' +
        Math.max(...numbers) +
        '. Por ejemplo, -3 es mayor que -8 porque está más cerca de cero.',
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
      explanation:
        value +
        ' personas × 8 por entrada + 5 de transporte = ' +
        (value * 8 + 5) +
        '. El transporte es un costo fijo del grupo.',
    };
  }
  return {
    request: `let contador = ${value};\ncontador = contador + 1;\nconsole.log(contador);`,
    body: { antes: value, despues: value + 1 },
    status: 'Simulación JavaScript · Ejecuta código real dentro de Fundamentos',
    explanation:
      'El dato empieza en ' +
      value +
      '. Al sumarle 1, el mismo contador pasa a guardar ' +
      (value + 1) +
      '.',
  };
}
