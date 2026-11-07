// La edición se genera junto al import map y las hojas de estilo del documento.
export function assetUrl(path) {
  const release = globalThis.document?.documentElement?.dataset.release ?? 'local';
  return `${path}?v=${release}`;
}
