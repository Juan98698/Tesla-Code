export function caseStudyErrors(activity) {
  const errors = [];
  const text = (value) => typeof value === 'string' && Boolean(value.trim());
  if (!text(activity.brief)) errors.push('Falta la situación del caso.');
  if (
    !Array.isArray(activity.evidence) ||
    !activity.evidence.length ||
    activity.evidence.some((item) => !text(item.label) || !text(item.text))
  )
    errors.push('El caso necesita material de referencia identificado.');
  if (!Array.isArray(activity.decisions) || activity.decisions.length < 2) {
    errors.push('El caso necesita al menos dos decisiones.');
    return errors;
  }
  const ids = new Set();
  for (const decision of activity.decisions) {
    if (!text(decision.id) || ids.has(decision.id))
      errors.push('ID de decisión vacío o duplicado.');
    ids.add(decision.id);
    if (!text(decision.prompt) || !text(decision.explanation))
      errors.push('Falta pregunta o devolución de la decisión.');
    if (
      !Array.isArray(decision.options) ||
      decision.options.length < 2 ||
      decision.options.some((option) => !text(option)) ||
      new Set(decision.options).size !== decision.options.length ||
      !Number.isInteger(decision.answer) ||
      decision.answer < 0 ||
      decision.answer >= decision.options.length
    )
      errors.push('Opciones o respuesta de decisión inválidas.');
  }
  return errors;
}

export function evaluateCaseStudy(activity, responses = {}) {
  const decisions = activity.decisions.map((decision) => ({
    id: decision.id,
    correct: Number.isInteger(responses[decision.id]) && responses[decision.id] === decision.answer,
  }));
  return {
    passed: decisions.length > 0 && decisions.every((decision) => decision.correct),
    decisions,
  };
}

export function caseStudyReport(activity, responses) {
  if (!evaluateCaseStudy(activity, responses).passed) return '';
  return [
    activity.prompt,
    activity.brief,
    ...activity.decisions.map(
      (decision) =>
        `${decision.prompt}\n${decision.options[responses[decision.id]]}\nJustificación: ${decision.explanation}`,
    ),
    'Alcance: caso didáctico con material preparado; no es una inferencia ejecutada por un modelo.',
  ].join('\n\n');
}
