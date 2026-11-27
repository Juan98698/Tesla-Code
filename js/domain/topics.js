import { isPublished } from './curriculum.js';

export const topicHref = (id) => `#/practica/javascript/temas/${id}`;
export const foldTopic = (text) =>
  text.normalize('NFD').replace(/\p{M}/gu, '').toLocaleLowerCase('es').trim();

// The route owns its lessons and prerequisites. Consultation adds no completion rules.
export function topicIndex(route, guides) {
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
  }));
  for (const guide of guides) {
    const position = entries.findIndex((entry) => entry.id === guide.after);
    if (position < 0) throw Error(`Referencia de tema desconocida: ${guide.id}`);
    const previous = entries[position];
    entries.splice(position + 1, 0, {
      ...guide,
      group: previous.group,
      groupName: previous.groupName,
      reference: guide.reference ?? previous.reference,
      keywords: guide.keywords ?? '',
      kind: 'guide',
    });
  }
  return entries;
}

export function filterTopics(topics, query) {
  const words = foldTopic(query).split(/\s+/u).filter(Boolean);
  return topics.filter((topic) => {
    const text = foldTopic([topic.title, topic.groupName, topic.keywords].join(' '));
    return words.every((word) => text.includes(word));
  });
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
