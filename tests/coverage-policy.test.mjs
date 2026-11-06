import test from 'node:test';
import assert from 'node:assert/strict';
import { checkCoverage } from '../tools/coverage-policy.mjs';
const report = 'SF:js/example.js\nLF:10\nLH:9\nFNF:5\nFNH:4\nBRF:10\nBRH:7\nend_of_record\n';
test('coverage policy checks file membership and per-module thresholds', () => {
  assert.deepEqual(checkCoverage(report, ['js/example.js'], '/project'), []);
  assert.match(checkCoverage(report, ['js/new.js'], '/project')[0], /no aparece/);
  assert.match(
    checkCoverage(report.replace('LH:9', 'LH:3'), ['js/example.js'], '/project')[0],
    /lines/,
  );
  assert.match(
    checkCoverage(report.replace('FNH:4', 'FNH:1'), ['js/example.js'], '/project')[0],
    /functions/,
  );
  assert.match(
    checkCoverage(report.replace('BRH:7', 'BRH:1'), ['js/example.js'], '/project')[0],
    /branches/,
  );
});
test('coverage policy handles modules without functions and malformed empty reports', () => {
  assert.deepEqual(
    checkCoverage(
      'SF:js/data.js\nLF:1\nLH:1\nFNF:0\nFNH:0\nBRF:0\nBRH:0\nend_of_record',
      ['js/data.js'],
      '/project',
    ),
    [],
  );
  assert.equal(checkCoverage('', ['js/missing.js'], '/project').length, 1);
});
