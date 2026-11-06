import { readdirSync, mkdirSync, readFileSync } from 'node:fs';
import { resolve, join } from 'node:path';
import { spawnSync } from 'node:child_process';
import { checkCoverage } from './coverage-policy.mjs';
if (Number(process.versions.node.split('.')[0]) < 22)
  throw Error('La cobertura requiere Node.js 22 o superior. npm test funciona sin este informe.');
const root = process.cwd();
mkdirSync('coverage', { recursive: true });
const tests = readdirSync('tests')
  .filter((file) => file.endsWith('.test.mjs'))
  .map((file) => join('tests', file));
const result = spawnSync(
  process.execPath,
  [
    '--experimental-test-coverage',
    '--test-coverage-include=js/**/*.js',
    '--test-coverage-lines=90',
    '--test-coverage-branches=85',
    '--test-coverage-functions=90',
    '--test-reporter=spec',
    '--test-reporter=lcov',
    '--test-reporter-destination=stdout',
    `--test-reporter-destination=${resolve('coverage/lcov.info')}`,
    '--test',
    ...tests,
  ],
  { stdio: 'inherit' },
);
if (result.error) throw result.error;
if (result.status !== 0) process.exit(result.status ?? 1);
function modules(directory) {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) =>
    entry.isDirectory()
      ? modules(join(directory, entry.name))
      : entry.name.endsWith('.js')
        ? [join(directory, entry.name)]
        : [],
  );
}
const expected = modules('js'),
  errors = checkCoverage(readFileSync('coverage/lcov.info', 'utf8'), expected, root);
if (errors.length) {
  console.error(errors.join('\n'));
  process.exit(1);
}
console.log(
  `✓ Los ${expected.length} módulos de aplicación tienen pruebas y cumplen cobertura por archivo.`,
);
