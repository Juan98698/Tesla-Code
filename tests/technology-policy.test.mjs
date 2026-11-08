import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, writeFileSync, mkdtempSync, cpSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { spawnSync } from 'node:child_process';
import {
  checkTechnologyPolicy,
  checkLessonTechnology,
  technologyFingerprint,
  checkUpstream,
  isDate,
} from '../tools/technology-policy.mjs';
const read = (p) => JSON.parse(readFileSync(p, 'utf8'));
const policy = read('content/technology-policy.json'),
  project = read('package.json'),
  today = '2026-11-07';
const clone = (value) => structuredClone(value);
test('technology policy accepts only verified LTS ranges and valid review dates', () => {
  assert.deepEqual(checkTechnologyPolicy(policy, project, today, '26.13.0'), []);
  assert.deepEqual(checkTechnologyPolicy(policy, project, today, '24.22.2'), []);
  assert.ok(
    checkTechnologyPolicy(policy, project, today, '20.20.0').some((error) =>
      error.includes('no pertenece'),
    ),
  );
  assert.ok(
    checkTechnologyPolicy(policy, { engines: { node: '>=20' } }, today).some((error) =>
      error.includes('EOL'),
    ),
  );
  assert.equal(isDate('2026-02-30'), false);
  assert.equal(isDate('2026-11-06'), true);
  assert.equal(isDate('invalid'), false);
});
test('review expiry, future stamps and source errors cannot be hidden by an empty result', () => {
  const expired = clone(policy);
  expired.technologies[0].reviewDue = today;
  assert.ok(checkTechnologyPolicy(expired, project, today).length);
  assert.ok(
    checkTechnologyPolicy(policy, project, '2027-04-30').some((error) => error.includes('vencida')),
  );
  const future = clone(policy);
  future.technologies[0].verifiedOn = '2026-12-01';
  assert.ok(
    checkTechnologyPolicy(future, project, today).some((error) => error.includes('inválidas')),
  );
  const source = clone(policy);
  source.technologies[0].officialSources = ['http://example.com'];
  assert.ok(checkTechnologyPolicy(source, project, today).some((error) => error.includes('HTTPS')));
  const duplicate = clone(policy);
  duplicate.technologies.push(duplicate.technologies[0]);
  assert.ok(
    checkTechnologyPolicy(duplicate, project, today).some((error) => error.includes('duplicada')),
  );
  assert.ok(checkTechnologyPolicy({}, project, today).length);
  assert.ok(checkTechnologyPolicy(policy, project, 'bad').length);
});
test('unreviewed support lines and claims of library execution are rejected', () => {
  const ended = clone(policy);
  ended.runtimes.node.supported[0].supportUntil = '2026-01-01';
  assert.ok(
    checkTechnologyPolicy(ended, project, today).some((error) => error.includes('sin soporte')),
  );
  const interval = clone(policy);
  interval.technologies[0].maxReviewIntervalDays = 5;
  assert.ok(
    checkTechnologyPolicy(interval, project, today).some((error) => error.includes('intervalo')),
  );
  const claim = clone(policy);
  claim.technologies.find((item) => item.referenceRelease).referenceRelease.scope = 'tested';
  assert.ok(
    checkTechnologyPolicy(claim, project, today).some((error) => error.includes('ejecución')),
  );
  const future = clone(policy);
  future.runtimes.node.testedVersions.push('28.0.0');
  assert.ok(checkTechnologyPolicy(future, project, today).some((error) => error.includes('fuera')));
});
test('lesson technical review is bound to its sources, releases and actual example runtimes', () => {
  const meta = read('content/curriculum/fundamentos.json')
    .levels.flatMap((level) => level.lessons)
    .find((meta) => meta.id === 'modulos-y-bibliotecas');
  const data = read('content/lessons/fundamentos/modulos-y-bibliotecas.json');
  assert.deepEqual(checkLessonTechnology(meta, data, policy, today), []);
  assert.deepEqual(checkLessonTechnology(meta, null, policy, today), []);
  assert.ok(checkLessonTechnology({ ...meta, technologyRefs: [] }, data, policy, today).length);
  assert.ok(
    checkLessonTechnology({ ...meta, technologyRefs: ['unknown'] }, data, policy, today).length,
  );
  const stale = clone(data);
  stale.technicalReview.policyDigest = 'old';
  assert.ok(
    checkLessonTechnology(meta, stale, policy, today).some((error) => error.includes('Cambió')),
  );
  const missing = clone(data);
  delete missing.technicalReview;
  assert.ok(checkLessonTechnology(meta, missing, policy, today).length);
  const invalid = clone(data);
  invalid.technicalReview.testedVersions = [
    { runtime: 'python', versions: ['2.7.0'], scope: 'all-packages' },
  ];
  assert.ok(
    checkLessonTechnology(meta, invalid, policy, today).some((error) =>
      error.includes('no verificados'),
    ),
  );
  const unrelated = clone(policy);
  unrelated.technologies.find((item) => item.id === 'react').verifiedOn = '2026-11-05';
  assert.equal(
    technologyFingerprint(meta.technologyRefs, unrelated),
    technologyFingerprint(meta.technologyRefs, policy),
  );
});
test('upstream checks report new releases and missing evidence without upgrading anything', () => {
  const responses = {
    nodeReleases: policy.runtimes.node.testedVersions.map((version) => ({
      version: 'v' + version,
      date: '2026-11-01',
    })),
    nodeSchedule: Object.fromEntries(
      policy.runtimes.node.supported.map((item) => [
        'v' + item.line,
        { lts: '2025-01-01', end: item.supportUntil },
      ]),
    ),
  };
  for (const item of policy.technologies.filter((item) => item.referenceRelease))
    responses[item.id] =
      item.referenceRelease.registry === 'npm'
        ? { version: item.referenceRelease.version }
        : { info: { version: item.referenceRelease.version } };
  assert.deepEqual(checkUpstream(policy, responses, today), []);
  const untestedPatch = clone(responses);
  untestedPatch.nodeReleases.unshift({ version: 'v26.99.0', date: today });
  assert.ok(checkUpstream(policy, untestedPatch, today).some((error) => error.includes('parche')));
  responses.react.version = '999.0.0';
  assert.ok(checkUpstream(policy, responses, today).some((error) => error.includes('cambió')));
  delete responses.pytorch;
  assert.ok(
    checkUpstream(policy, responses, today).some((error) => error.includes('no se pudo confirmar')),
  );
  assert.ok(checkUpstream(policy, {}, today).some((error) => error.includes('calendario')));
});
test('publication validator rejects an expired technology contract in a copied checkout', (t) => {
  const dir = mkdtempSync(join(tmpdir(), 'tesla-tech-'));
  t.after(() => rmSync(dir, { recursive: true, force: true }));
  cpSync('content', join(dir, 'content'), { recursive: true });
  cpSync('package.json', join(dir, 'package.json'));
  const p = join(dir, 'content/technology-policy.json'),
    data = read(p);
  data.technologies[0].reviewDue = '2026-01-01';
  writeFileSync(p, JSON.stringify(data));
  const result = spawnSync(process.execPath, [resolve('tools/validate-content.mjs')], {
    cwd: dir,
    encoding: 'utf8',
  });
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /fechas de revisión inválidas|revisión técnica vencida/);
});
