import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { releasePlan, applyRelease, releaseErrors } from '../tools/version-assets.mjs';
function fixture(t) {
  const root = mkdtempSync(join(tmpdir(), 'tesla-release-'));
  t.after(() => rmSync(root, { recursive: true, force: true }));
  for (const dir of ['js', 'css', 'content', 'assets']) mkdirSync(join(root, dir));
  writeFileSync(
    join(root, 'index.html'),
    '<html lang="es"><head><link rel="stylesheet" href="css/app.css"></head><body><img src="assets/brand.png"><script type="module" src="js/main.js"></script></body></html>',
  );
  writeFileSync(join(root, 'js/main.js'), 'import "./dep.js";\n');
  writeFileSync(join(root, 'js/dep.js'), 'export const value = 1;\n');
  writeFileSync(join(root, 'css/app.css'), 'body {color:blue;}\n');
  writeFileSync(join(root, 'content/index.json'), '{"routes":[]}\n');
  writeFileSync(join(root, 'assets/brand.png'), Buffer.from([1, 2, 3, 4]));
  return root;
}
test('release covers the whole module graph and is stable when generated again', (t) => {
  const root = fixture(t),
    plan = releasePlan(root);
  assert.ok(releaseErrors(plan).length);
  writeFileSync(join(root, 'index.html'), applyRelease(plan));
  const current = releasePlan(root);
  assert.equal(current.release, plan.release);
  assert.deepEqual(releaseErrors(current), []);
  assert.ok(current.imports['./js/dep.js'].endsWith('?v=' + plan.release));
  writeFileSync(join(root, 'js/dep.js'), 'export const value = 2;');
  assert.notEqual(releasePlan(root).release, plan.release);
  assert.ok(releaseErrors(releasePlan(root)).length);
});
test('release hashes survive checkout paths, line endings and HTML formatting', (t) => {
  const a = fixture(t),
    b = fixture(t);
  for (const file of ['js/main.js', 'js/dep.js', 'css/app.css', 'content/index.json'])
    writeFileSync(join(b, file), readFileSync(join(b, file), 'utf8').replaceAll('\n', '\r\n'));
  assert.equal(releasePlan(a).release, releasePlan(b).release);
  const plan = releasePlan(a);
  writeFileSync(
    join(a, 'index.html'),
    applyRelease(plan)
      .replaceAll('><', '>\n  <')
      .replace('src="js/main.js?', '\n src="js/main.js?'),
  );
  assert.equal(releasePlan(a).release, plan.release);
  assert.deepEqual(releaseErrors(releasePlan(a)), []);
});
test('missing module editions and stale image, CSS or JSON bytes invalidate publication', (t) => {
  const root = fixture(t);
  const plan = releasePlan(root);
  writeFileSync(join(root, 'index.html'), applyRelease(plan));
  const valid = releasePlan(root);
  const missing = {
    ...valid,
    index: valid.index.replace(`./js/dep.js?v=${plan.release}`, './js/dep.js'),
  };
  assert.ok(releaseErrors(missing).some((e) => e.includes('grafo completo')));
  for (const file of ['assets/brand.png', 'css/app.css', 'content/index.json']) {
    const bytes = readFileSync(join(root, file));
    writeFileSync(join(root, file), Buffer.concat([bytes, Buffer.from(' ')]));
    assert.notEqual(releasePlan(root).release, plan.release);
    writeFileSync(join(root, file), bytes);
  }
});
