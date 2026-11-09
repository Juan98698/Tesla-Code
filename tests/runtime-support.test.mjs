import test from 'node:test';
import assert from 'node:assert/strict';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { browserExecutable, screenshotPath } from './support/runtime.mjs';

test('browser selection honors explicit paths and finds installed Windows browsers without downloading', () => {
  assert.equal(
    browserExecutable({ override: '/custom/browser', exists: () => true }),
    '/custom/browser',
  );
  assert.throws(
    () => browserExecutable({ override: '/missing', exists: () => false }),
    /CHROMIUM_PATH/,
  );
  const chrome = join('applications', 'Google/Chrome/Application/chrome.exe');
  assert.equal(
    browserExecutable({
      override: '',
      platform: 'win32',
      env: { ProgramFiles: 'applications' },
      bundled: '/missing',
      exists: (path) => path === chrome,
    }),
    chrome,
  );
  assert.equal(
    browserExecutable({ override: '', bundled: '/bundled', exists: (path) => path === '/bundled' }),
    '/bundled',
  );
  assert.throws(
    () => browserExecutable({ override: '', platform: 'linux', exists: () => false }),
    /playwright install/,
  );
  assert.equal(screenshotPath('teslacode-test.png'), join(tmpdir(), 'teslacode-test.png'));
});
