import { isPublished } from './curriculum.js';

export const topicHref = (id) => `#/practica/javascript/temas/${id}`;
export const foldTopic = (text) =>
  text.normalize('NFD').replace(/\p{M}/gu, '').toLocaleLowerCase('es').trim();
export const TOPIC_COLLECTIONS = [
  {
    id: 'route',
    title: 'Recorrido desde cero',
    description:
      'Las lecciones de Fundamentos en su secuencia original. Continúa las entregas en la ruta.',
  },
  {
    id: 'companion',
    title: 'Consulta y usos prácticos',
    description: 'Amplía una habilidad después de repasar las bases enlazadas en cada ficha.',
  },
  {
    id: 'mathematics',
    title: 'Matemáticas especializadas',
    description:
      'Referencia opcional para modelos numéricos. No es un paso previo a los ciclos ni a las funciones de JavaScript.',
  },
];

// The route owns its lessons and prerequisites. Consultation adds no completion rules.
export function topicIndex(route, guides, searchTerms = {}) {
  const published = route.lessons.filter(isPublished);
  const entries = published.map((lesson) => ({
    id: lesson.id,
    title: lesson.title,
    group: lesson.levelId,
    groupName: lesson.level,
    reference: lesson.id,
    requires: (lesson.progressionRequires ?? []).map((key) => key.split('/')[1]),
    keywords: lesson.concepts.join(' '),
    kind: 'lesson',
    collection: 'route',
  }));
  for (const guide of guides) {
    if (!['companion', 'mathematics'].includes(guide.collection ?? 'companion'))
      throw Error(`Colección de consulta inválida: ${guide.id}`);
    const position = entries.findIndex((entry) => entry.id === guide.after);
    if (position < 0) throw Error(`Referencia de tema desconocida: ${guide.id}`);
    const previous = entries[position];
    entries.splice(position + 1, 0, {
      ...guide,
      group: guide.collection === 'mathematics' ? 'math-reference' : previous.group,
      groupName:
        guide.collection === 'mathematics'
          ? 'Modelos y representación numérica'
          : previous.groupName,
      reference: guide.reference ?? previous.reference,
      keywords: guide.keywords ?? '',
      kind: 'guide',
      collection: guide.collection ?? 'companion',
    });
  }
  const ids = new Set(entries.map((entry) => entry.id));
  for (const [id, terms] of Object.entries(searchTerms)) {
    if (
      !ids.has(id) ||
      !Array.isArray(terms) ||
      terms.some((term) => typeof term !== 'string' || !term.trim())
    )
      throw Error(`Referencias de búsqueda inválidas: ${id}`);
  }
  return entries
    .map((entry) => ({ ...entry, searchTerms: searchTerms[entry.id] ?? [] }))
    .toSorted(
      (a, b) =>
        TOPIC_COLLECTIONS.findIndex((item) => item.id === a.collection) -
        TOPIC_COLLECTIONS.findIndex((item) => item.id === b.collection),
    );
}

export function filterTopics(topics, query) {
  const normalize = (value) =>
    (foldTopic(value).match(/[\p{L}\p{N}_$]+/gu) ?? [])
      .filter(
        (word) =>
          !['metodo', 'metodos', 'method', 'javascript', 'de', 'del', 'el', 'la'].includes(word),
      )
      .join(' ');
  const normalized = normalize(query);
  const words = normalized.split(' ').filter(Boolean);
  const matching = topics.filter((topic) => {
    const text = normalize(
      [topic.title, topic.groupName, topic.keywords, ...(topic.searchTerms ?? [])].join(' '),
    );
    return words.every((word) => text.includes(word));
  });
  if (!words.length) return matching;
  const precise = (topic) =>
    (topic.searchTerms ?? []).some((term) => normalize(term) === normalized);
  // A method query should prefer its API, rather than a similarly named type
  // (for example array.map() versus the Map collection). Empty search keeps order.
  const api = matching.filter((topic) =>
    (topic.searchTerms ?? []).some((term) => /[.(]/u.test(term) && normalize(term) === normalized),
  );
  const methodQuery = /\.|\(/u.test(query);
  return (methodQuery && api.length ? api : matching).toSorted(
    (a, b) => Number(precise(b)) - Number(precise(a)),
  );
}

export function guideErrors(guides, route) {
  const errors = [];
  const known = new Set(route.lessons.filter(isPublished).map((lesson) => lesson.id));
  for (const guide of guides) {
    if (known.has(guide.id)) errors.push(`ID repetido: ${guide.id}`);
    if (!known.has(guide.after)) errors.push(`Orden inválido: ${guide.id}`);
    if (!guide.requires?.length || guide.requires.some((id) => !known.has(id)))
      errors.push(`Bases inválidas: ${guide.id}`);
    if (
      !guide.title ||
      !guide.outcome ||
      !Array.isArray(guide.sections) ||
      guide.sections.length < 3
    )
      errors.push(`Explicación incompleta: ${guide.id}`);
    if (!guide.example?.code || typeof guide.example.stdout !== 'string')
      errors.push(`Ejemplo ausente: ${guide.id}`);
    for (const field of ['guided', 'bug', 'challenge'])
      if (!guide[field]?.prompt || !guide[field]?.solution || !guide[field]?.cases?.length)
        errors.push(`Falta ${field}: ${guide.id}`);
    if (
      !guide.sources?.length ||
      !guide.sources.every((source) => source.url.startsWith('https://developer.mozilla.org/'))
    )
      errors.push(`Fuente inválida: ${guide.id}`);
    known.add(guide.id);
  }
  return errors;
}

export function javascriptErrorHelp(message) {
  if (/TypeError.*constant|Assignment to constant/isu.test(message))
    return 'Intentaste reasignar un nombre declarado con const. Si el problema exige cambiar su valor, revisa la declaración con let.';
  if (/ReferenceError/iu.test(message))
    return 'Hay un nombre que JavaScript no encuentra. Comprueba su declaración, las mayúsculas y el lugar donde está disponible.';
  if (/SyntaxError/iu.test(message))
    return 'JavaScript no puede interpretar una instrucción. Revisa comillas, paréntesis y llaves cerca de la línea indicada; el problema también puede estar en la anterior.';
  if (/TypeError/iu.test(message))
    return 'Una operación recibió un valor incompatible. Revisa qué dato llega, su tipo y si la propiedad o función existe.';
  return 'Compara lo esperado con lo observado y cambia una sola cosa para contrastar tu hipótesis. Consulta también el mensaje técnico.';
}
