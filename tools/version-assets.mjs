import { createHash } from 'node:crypto';
import { readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { join, relative } from 'node:path';
import { pathToFileURL } from 'node:url';

function files(dir) {
  return readdirSync(dir, { withFileTypes: true })
    .flatMap((entry) =>
      entry.isDirectory() ? files(join(dir, entry.name)) : [join(dir, entry.name)],
    )
    .sort();
}
const mapPattern = /\s*<script\b(?=[^>]*\bid="release-imports")[^>]*>[\s\S]*?<\/script>/;
export function releasePlan(root = '.') {
  const index = readFileSync(join(root, 'index.html'), 'utf8');
  const normalized = index
    .replace(mapPattern, ' ')
    .replace(/\sdata-release="[^"]*"/, '')
    .replace(/\?v=[a-zA-Z0-9_-]+/g, '')
    .replace(/\s+/g, ' ')
    .replace(/\s+(\/?>)/g, '$1')
    .replace(/>\s+</g, '><')
    .trim();
  const resources = ['js', 'css', 'content', 'assets'].flatMap((dir) => files(join(root, dir)));
  const hash = createHash('sha256').update(normalized);
  for (const file of resources) {
    const bytes = readFileSync(file);
    const content = /\.(js|css|json|svg|md|html|txt)$/.test(file)
      ? bytes.toString('utf8').replace(/\r\n/g, '\n')
      : bytes;
    hash
      .update(relative(root, file).replaceAll('\\', '/'))
      .update('\0')
      .update(content)
      .update('\0');
  }
  const release = hash.digest('hex').slice(0, 16);
  const imports = Object.fromEntries(
    files(join(root, 'js'))
      .filter((p) => p.endsWith('.js'))
      .map((path) => {
        const resource = relative(root, path).replaceAll('\\', '/');
        return [`./${resource}`, `./${resource}?v=${release}`];
      }),
  );
  return { release, imports, index };
}
export function applyRelease(plan) {
  let html = plan.index.replace(mapPattern, '\n');
  html = html
    .replace(/\sdata-release="[^"]*"/, '')
    .replace(/<html\b/, `<html data-release="${plan.release}"`);
  html = html.replace(
    /((?:src|href)="(?:js|css|assets)\/[^"?]+)(?:\?v=[a-zA-Z0-9_-]+)?"/g,
    `$1?v=${plan.release}"`,
  );
  const importMap = `<script type="importmap" id="release-imports">${JSON.stringify({ imports: plan.imports }, null, 2)}</script>\n`;
  return html.replace(/(?=<script\b[^>]*type="module")/, importMap);
}
export function releaseErrors(plan) {
  const errors = [];
  if (!plan.index.includes(`data-release="${plan.release}"`))
    errors.push('La edición de los recursos está desactualizada.');
  try {
    const raw = plan.index
      .match(mapPattern)?.[0]
      .replace(/^[\s\S]*?>/, '')
      .replace(/<\/script>$/, '');
    if (JSON.stringify(JSON.parse(raw).imports) !== JSON.stringify(plan.imports))
      errors.push('El import map no versiona el grafo completo de módulos.');
  } catch {
    errors.push('Falta un import map válido.');
  }
  const urls = [...plan.index.matchAll(/(?:src|href)="((?:js|css|assets)\/[^" ]+)"/g)].map(
    (m) => m[1],
  );
  if (urls.some((url) => !url.endsWith(`?v=${plan.release}`)))
    errors.push('Hay estilos, módulos o imágenes de una edición diferente.');
  return errors;
}
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const plan = releasePlan();
  if (process.argv.includes('--check')) {
    const errors = releaseErrors(plan);
    if (errors.length) {
      console.error(errors.join('\n') + '\nEjecuta npm run assets:version.');
      process.exit(1);
    }
    console.log(
      `✓ Edición ${plan.release}: estilos y ${Object.keys(plan.imports).length} módulos coherentes.`,
    );
  } else {
    writeFileSync('index.html', applyRelease(plan));
    console.log(`✓ Recursos versionados: ${plan.release}.`);
  }
}
