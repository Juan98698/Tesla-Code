import { readFile } from 'node:fs/promises';
import { PYODIDE_INDEX } from '../../js/repositories/python-runner.js';

// Runtime real, fijado en package-lock; evita depender de la red durante CI.
export async function installPythonRuntime(context) {
  const allowed = new Set([
    'pyodide.mjs',
    'pyodide-lock.json',
    'python_stdlib.zip',
    'pyodide.asm.wasm',
    'pyodide.asm.mjs',
  ]);
  await context.route(PYODIDE_INDEX + '**', async (route) => {
    const file = new URL(route.request().url()).pathname.split('/').at(-1);
    if (!allowed.has(file)) {
      await route.abort();
      return;
    }
    const types = {
      mjs: 'text/javascript',
      json: 'application/json',
      wasm: 'application/wasm',
      zip: 'application/zip',
    };
    await route.fulfill({
      body: await readFile('node_modules/pyodide/' + file),
      contentType: types[file.split('.').at(-1)],
      headers: { 'Access-Control-Allow-Origin': '*' },
    });
  });
}
export async function solveActivity(page, activity) {
  const section = page.locator('#activities [data-activity="' + activity.id + '"]');
  if (activity.type === 'python') await section.locator('textarea').fill(activity.solution);
  else await section.locator('input').fill(activity.answers[0]);
  await section.locator('button[type=submit]').click();
  try {
    await section.locator('.badge.live').waitFor({ timeout: 60000 });
  } catch (error) {
    const feedback = await section.locator('.practice-feedback').textContent();
    throw new Error(activity.id + ': ' + feedback, { cause: error });
  }
}
