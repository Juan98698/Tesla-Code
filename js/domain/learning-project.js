const object = (value) => value && typeof value === 'object' && !Array.isArray(value);
const date = (value) =>
  typeof value === 'string' &&
  Number.isFinite(Date.parse(value)) &&
  new Date(value).toISOString() === value;
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
    (artifact.verifiedAt === null || date(artifact.verifiedAt)),
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
    ...evidence,
    updatedAt: at,
  };
  if (!validProjectArtifact(key, next)) return false;
  state.projectArtifacts[key] = next;
  return true;
}
