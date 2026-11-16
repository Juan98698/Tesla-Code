const object = (value) => value && typeof value === 'object' && !Array.isArray(value);
const date = (value) =>
  typeof value === 'string' &&
  Number.isFinite(Date.parse(value)) &&
  new Date(value).toISOString() === value;
function validAssessment(proof) {
  if (!object(proof)) return false;
  let text;
  try {
    text = JSON.stringify(proof);
  } catch {
    return false;
  }
  return (
    text.length <= 60000 &&
    proof.version === 2 &&
    object(proof.responses) &&
    typeof proof.reflection === 'string' &&
    proof.reflection.length <= 2000 &&
    typeof proof.testedCode === 'string' &&
    proof.testedCode.length <= 12000 &&
    object(proof.technical) &&
    typeof proof.technical.passed === 'boolean' &&
    Number.isInteger(proof.technical.cases) &&
    proof.technical.cases >= 1 &&
    proof.technical.cases <= 20 &&
    proof.reviewStatus === 'pending' &&
    (proof.debug === undefined ||
      (object(proof.debug) &&
        typeof proof.debug.fixture === 'string' &&
        typeof proof.debug.stdout === 'string' &&
        typeof proof.debug.error === 'string' &&
        typeof proof.debug.failed === 'boolean')) &&
    (proof.rewrite === undefined ||
      (object(proof.rewrite) &&
        typeof proof.rewrite.source === 'string' &&
        typeof proof.rewrite.passed === 'boolean' &&
        [proof.rewrite.before, proof.rewrite.after].every(
          (v) =>
            Array.isArray(v) &&
            v.length <= 20 &&
            v.every((x) => typeof x === 'string' && x.length <= 6000),
        )))
  );
}
export function validProjectArtifact(key, artifact) {
  return Boolean(
    /^[a-z0-9-]+\/[a-z0-9-]+\/[a-z0-9-]+$/.test(key) &&
    object(artifact) &&
    typeof artifact.project === 'string' &&
    /^[a-z0-9-]+$/.test(artifact.project) &&
    typeof artifact.code === 'string' &&
    artifact.code.length <= 12000 &&
    typeof artifact.report === 'string' &&
    artifact.report.length <= 6000 &&
    typeof artifact.notes === 'string' &&
    artifact.notes.length <= 2000 &&
    date(artifact.updatedAt) &&
    (artifact.verifiedAt === null || date(artifact.verifiedAt)) &&
    (artifact.assessment === undefined || validAssessment(artifact.assessment)),
  );
}
export function normalizeProjectArtifacts(value) {
  return Object.fromEntries(
    Object.entries(object(value) ? value : {}).filter(([key, artifact]) =>
      validProjectArtifact(key, artifact),
    ),
  );
}
export function mergeProjectArtifacts(a, b) {
  const result = normalizeProjectArtifacts(a);
  for (const [key, incoming] of Object.entries(normalizeProjectArtifacts(b))) {
    const previous = result[key];
    if (!previous) {
      result[key] = incoming;
      continue;
    }
    const latest =
      incoming.updatedAt > previous.updatedAt ||
      (incoming.updatedAt === previous.updatedAt &&
        JSON.stringify(incoming) > JSON.stringify(previous))
        ? incoming
        : previous;
    const verified =
      (incoming.verifiedAt ?? '') > (previous.verifiedAt ?? '')
        ? incoming
        : incoming.verifiedAt === previous.verifiedAt
          ? latest
          : previous;
    result[key] = {
      ...latest,
      code: verified.code,
      report: verified.report,
      verifiedAt: verified.verifiedAt,
      assessment: verified.assessment,
    };
  }
  return result;
}
export function recordProjectArtifact(state, key, project, evidence, now = new Date()) {
  state.projectArtifacts ??= {};
  const previous = state.projectArtifacts[key];
  const at = now.toISOString();
  const next = {
    project,
    code: previous?.code ?? '',
    report: previous?.report ?? '',
    notes: previous?.notes ?? '',
    verifiedAt: previous?.verifiedAt ?? null,
    ...(previous?.assessment ? { assessment: previous.assessment } : {}),
    ...evidence,
    updatedAt: at,
  };
  if (!validProjectArtifact(key, next)) return false;
  state.projectArtifacts[key] = next;
  return true;
}
