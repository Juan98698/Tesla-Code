import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { chromium } from 'playwright';

export function browserExecutable({
  override = process.env.CHROMIUM_PATH,
  platform = process.platform,
  env = process.env,
  exists = existsSync,
  bundled = chromium.executablePath(),
} = {}) {
  if (override) {
    if (!exists(override))
      throw Error('CHROMIUM_PATH no apunta a un navegador existente: ' + override);
    return override;
  }
  const candidates = [bundled, '/usr/bin/chromium'];
  if (platform === 'win32') {
    for (const root of [env.ProgramFiles, env['ProgramFiles(x86)'], env.LOCALAPPDATA].filter(
      Boolean,
    ))
      candidates.push(
        join(root, 'Google/Chrome/Application/chrome.exe'),
        join(root, 'Microsoft/Edge/Application/msedge.exe'),
      );
  }
  const executable = candidates.find(exists);
  if (!executable)
    throw Error(
      'No hay un navegador disponible. Instala Chromium con npx playwright install chromium o configura CHROMIUM_PATH.',
    );
  return executable;
}

export const screenshotPath = (name) => join(tmpdir(), name);
