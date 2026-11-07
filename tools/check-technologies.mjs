// Solo lectura. Este comando nunca renueva revisiones ni actualiza dependencias.
import { readFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import {
  checkTechnologyPolicy,
  checkLessonTechnology,
  checkUpstream,
} from './technology-policy.mjs';
const read = (path) => JSON.parse(readFileSync(path, 'utf8'));
const policy = read('content/technology-policy.json'),
  today = new Date().toISOString().slice(0, 10);
const errors = checkTechnologyPolicy(policy, read('package.json'), today, process.versions.node);
for (const [name, expected] of [
  ['.node-version', policy.runtimes.node.preferred],
  ['.nvmrc', policy.runtimes.node.preferred],
  ['.python-version', policy.runtimes.python.preferred],
])
  if (readFileSync(name, 'utf8').trim() !== expected)
    errors.push(`${name} no coincide con la versión preferida verificada.`);
for (const rid of read('content/curriculum/index.json').routes)
  for (const meta of read(`content/curriculum/${rid}.json`).levels.flatMap(
    (level) => level.lessons,
  )) {
    const data =
      meta.status === 'published' ? read(`content/lessons/${rid}/${meta.id}.json`) : null;
    for (const error of checkLessonTechnology(meta, data, policy, today))
      errors.push(`${rid}/${meta.id}: ${error}`);
  }
if (process.argv.includes('--online')) {
  function get(url) {
    const parsed = new URL(url);
    if (
      parsed.protocol !== 'https:' ||
      parsed.username ||
      parsed.password ||
      (parsed.port && parsed.port !== '443') ||
      !['raw.githubusercontent.com', 'registry.npmjs.org', 'pypi.org', 'nodejs.org'].includes(
        parsed.hostname,
      )
    )
      throw Error('Destino de metadatos no autorizado.');
    return JSON.parse(
      execFileSync(
        'curl',
        [
          '--fail',
          '--location',
          '--silent',
          '--show-error',
          '--max-time',
          '30',
          '--max-filesize',
          '8388608',
          url,
        ],
        { encoding: 'utf8', maxBuffer: 8 * 1024 * 1024 },
      ),
    );
  }
  const responses = {};
  for (const [id, url] of [
    ['nodeSchedule', policy.runtimes.node.scheduleSource],
    ['nodeReleases', policy.runtimes.node.releaseSource],
    ...policy.technologies
      .filter((item) => item.referenceRelease)
      .map((item) => [item.id, item.referenceRelease.url]),
  ]) {
    try {
      responses[id] = get(url);
    } catch {
      errors.push(
        `${id}: no se pudo consultar la fuente oficial. No se considera vigente por ausencia de datos.`,
      );
    }
  }
  errors.push(...checkUpstream(policy, responses, today));
}
if (errors.length) {
  console.error(errors.join('\n'));
  process.exit(1);
}
console.log(
  `✓ ${policy.technologies.length} referencias técnicas, líneas de soporte y revisiones verificadas${process.argv.includes('--online') ? ' contra metadatos oficiales' : ' con la política local'}.`,
);
