import { digest } from './pedagogy.mjs';
const DAY = 86400000;
export function isDate(value) {
  return (
    typeof value === 'string' &&
    /^\d{4}-\d{2}-\d{2}$/.test(value) &&
    Number.isFinite(Date.parse(value)) &&
    new Date(value).toISOString().slice(0, 10) === value
  );
}
const https = (value) => {
  try {
    const url = new URL(value);
    return url.protocol === 'https:' && !url.username && !url.password;
  } catch {
    return false;
  }
};
export function technologyFingerprint(refs, policy) {
  const ids = new Set(refs);
  const runtimes = {};
  if (ids.has('node') || ids.has('git-ci')) runtimes.node = policy.runtimes.node;
  if (ids.has('python')) runtimes.python = policy.runtimes.python;
  return digest({ technologies: policy.technologies.filter((item) => ids.has(item.id)), runtimes });
}
export function checkTechnologyPolicy(policy, project, today, runtimeVersion) {
  const errors = [];
  if (!isDate(today)) return ['Fecha de comprobación inválida.'];
  if (
    policy?.version !== 1 ||
    !Array.isArray(policy.technologies) ||
    !policy.runtimes?.node ||
    !policy.runtimes?.python
  )
    return ['Política tecnológica ausente o no compatible.'];
  const ids = new Set();
  for (const item of policy.technologies) {
    if (!item.id || ids.has(item.id)) errors.push(`Tecnología ausente o duplicada: ${item.id}`);
    ids.add(item.id);
    if (
      !Array.isArray(item.officialSources) ||
      !item.officialSources.length ||
      !item.officialSources.every(https)
    )
      errors.push(`${item.id}: faltan fuentes oficiales HTTPS válidas.`);
    if (
      !isDate(item.verifiedOn) ||
      !isDate(item.reviewDue) ||
      item.verifiedOn > today ||
      item.reviewDue <= item.verifiedOn
    )
      errors.push(`${item.id}: fechas de revisión inválidas.`);
    else {
      if (
        !Number.isInteger(item.maxReviewIntervalDays) ||
        item.maxReviewIntervalDays < 1 ||
        item.maxReviewIntervalDays > 180 ||
        Date.parse(item.reviewDue) - Date.parse(item.verifiedOn) > item.maxReviewIntervalDays * DAY
      )
        errors.push(`${item.id}: intervalo de revisión excesivo.`);
      if (today >= item.reviewDue)
        errors.push(
          `${item.id}: revisión técnica vencida el ${item.reviewDue}; revisa fuentes y ejemplos antes de renovar fechas.`,
        );
    }
    if (
      item.referenceRelease &&
      (!item.referenceRelease.version ||
        !['npm', 'pypi'].includes(item.referenceRelease.registry) ||
        !https(item.referenceRelease.url) ||
        item.referenceRelease.scope !== 'reference-only')
    )
      errors.push(
        `${item.id}: versión de referencia incompleta o presentada como ejecución verificada.`,
      );
  }
  for (const [name, runtime] of Object.entries(policy.runtimes)) {
    if (!Array.isArray(runtime.supported) || !runtime.supported.length)
      errors.push(`${name}: faltan líneas soportadas.`);
    for (const line of runtime.supported ?? [])
      if (!isDate(line.supportUntil) || today >= line.supportUntil)
        errors.push(`${name} ${line.line}: línea sin soporte vigente.`);
    if (!Array.isArray(runtime.testedVersions) || !runtime.testedVersions.length)
      errors.push(`${name}: faltan versiones probadas.`);
    const matches = (version) =>
      runtime.supported?.some((item) =>
        name === 'node'
          ? String(version).split('.')[0] === item.line
          : String(version).split('.').slice(0, 2).join('.') === item.line,
      );
    if (!matches(runtime.preferred) || !runtime.testedVersions?.includes(runtime.preferred))
      errors.push(`${name}: la versión preferida no está soportada y probada.`);
    for (const version of runtime.testedVersions ?? [])
      if (!matches(version))
        errors.push(`${name}: versión probada fuera de las líneas soportadas.`);
  }
  const node = policy.runtimes.node;
  const expected = node.supported.map((item) => `^${item.line}.0.0`).join(' || ');
  if (node.engineRange !== expected || project.engines?.node !== expected)
    errors.push(
      'package.json debe limitar Node a las líneas LTS verificadas, sin admitir versiones EOL o futuras no probadas.',
    );
  if (
    runtimeVersion &&
    !node.supported.some((item) => item.line === String(runtimeVersion).split('.')[0])
  )
    errors.push(
      `Node ${runtimeVersion} no pertenece a las líneas admitidas. Usa ${node.preferred}.`,
    );
  return errors;
}
export function checkLessonTechnology(meta, data, policy, today) {
  const errors = [],
    refs = meta.technologyRefs;
  if (!Array.isArray(refs) || !refs.length || new Set(refs).size !== refs.length)
    return ['Faltan referencias tecnológicas únicas.'];
  const technologies = refs.map((id) => policy.technologies.find((item) => item.id === id));
  if (technologies.some((item) => !item))
    return ['Una referencia tecnológica no existe en la política.'];
  if (!data) return errors; // Un mapa pendiente no se presenta como ejemplo ejecutado.
  const review = data.technicalReview;
  if (
    !review ||
    !isDate(review.verifiedOn) ||
    !isDate(review.reviewDue) ||
    review.verifiedOn > today ||
    review.reviewDue <= review.verifiedOn ||
    today >= review.reviewDue
  )
    return ['La revisión técnica de la lección falta o venció.'];
  if (review.technologyRefs?.join('|') !== refs.join('|'))
    errors.push('Las referencias de la lección y su revisión técnica no coinciden.');
  if (review.policyDigest !== technologyFingerprint(refs, policy))
    errors.push('Cambió la política técnica: revisa el impacto en esta lección.');
  if (technologies.some((item) => review.reviewDue > item.reviewDue))
    errors.push('La lección no puede revisarse después del plazo de su tecnología.');
  if (!Array.isArray(review.testedVersions))
    errors.push(
      'La revisión debe declarar qué ejemplos se ejecutaron, incluso si la lista está vacía.',
    );
  for (const test of review.testedVersions ?? []) {
    const runtime = policy.runtimes[test.runtime];
    if (
      !runtime ||
      !Array.isArray(test.versions) ||
      !test.versions.length ||
      test.versions.some((version) => !runtime.testedVersions.includes(version)) ||
      test.scope !== 'standard-library-example'
    )
      errors.push('La revisión atribuye pruebas a una versión o alcance no verificados.');
  }
  return errors;
}
export function checkUpstream(policy, responses, today) {
  const errors = [];
  for (const line of policy.runtimes.node.supported) {
    const source = responses.nodeSchedule?.[`v${line.line}`];
    if (
      !source?.lts ||
      source.lts > today ||
      !source.end ||
      source.end !== line.supportUntil ||
      source.end <= today
    )
      errors.push(`Node ${line.line}: el calendario oficial requiere revisión.`);
  }
  for (const line of policy.runtimes.node.supported) {
    const latest = responses.nodeReleases?.find(
      (release) => release.version?.startsWith(`v${line.line}.`) && release.date <= today,
    );
    if (!latest) errors.push(`Node ${line.line}: no se pudo confirmar el último parche oficial.`);
    else if (!policy.runtimes.node.testedVersions.includes(latest.version.slice(1)))
      errors.push(
        `Node ${line.line}: el parche ${latest.version} requiere verificación y actualización de la referencia.`,
      );
  }
  for (const item of policy.technologies.filter((item) => item.referenceRelease)) {
    const response = responses[item.id],
      release = item.referenceRelease;
    const current = release.registry === 'npm' ? response?.version : response?.info?.version;
    if (!current) errors.push(`${item.id}: no se pudo confirmar la versión oficial.`);
    else if (current !== release.version)
      errors.push(
        `${item.id}: la referencia ${release.version} cambió a ${current}; verifica compatibilidad, APIs y contenido.`,
      );
  }
  return errors;
}
