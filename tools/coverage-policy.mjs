import { resolve } from 'node:path';
export function checkCoverage(lcov, expectedFiles, root) {
  const files = new Map();
  for (const block of lcov.split('end_of_record')) {
    const source = block.match(/^SF:(.+)$/m)?.[1];
    if (!source) continue;
    const count = (field) => Number(block.match(new RegExp(`^${field}:(\\d+)$`, 'm'))?.[1] ?? 0);
    const percentage = (hits, total) => (total === 0 ? 100 : (hits / total) * 100);
    files.set(resolve(root, source), {
      lines: percentage(count('LH'), count('LF')),
      branches: percentage(count('BRH'), count('BRF')),
      functions: percentage(count('FNH'), count('FNF')),
    });
  }
  const errors = [];
  for (const file of expectedFiles) {
    const stats = files.get(resolve(root, file));
    if (!stats) {
      errors.push(`${file}: el módulo no aparece en la cobertura; agrega pruebas que lo ejerzan.`);
      continue;
    }
    for (const [kind, minimum] of Object.entries({ lines: 80, branches: 60, functions: 80 }))
      if (stats[kind] < minimum)
        errors.push(`${file}: ${kind} ${stats[kind].toFixed(2)}%, mínimo ${minimum}%.`);
  }
  return errors;
}
