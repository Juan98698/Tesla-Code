import { PYODIDE_INDEX } from '../../js/repositories/python-runner.js';

// Runtime real, fijado en package-lock; evita depender de la red durante CI.
export async function installPythonRuntime(context, origin) {
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
    // Keep the real pinned files in Playwright's transport instead of copying a large
    // WASM buffer through the client/driver channel for every isolated execution.
    const response = await route.fetch({
      url: new URL('node_modules/pyodide/' + file, origin).href,
    });
    try {
      if (!response.ok()) throw Error('No se pudo servir el runtime local: ' + file);
      await route.fulfill({
        response,
        headers: {
          'Content-Type': types[file.split('.').at(-1)],
          'Access-Control-Allow-Origin': '*',
        },
      });
    } finally {
      await response.dispose();
    }
  });
}
export async function solveActivity(page, activity) {
  const section = page.locator('#activities [data-activity="' + activity.id + '"]');
  if (activity.type === 'python') await section.locator('.code-editor').fill(activity.solution);
  else await section.locator('input').fill(activity.answers[0]);
  await section.locator('button[type=submit]').click();
  try {
    await section.locator('.badge.live').waitFor({ timeout: 60000 });
  } catch (error) {
    const feedback = await section.locator('.practice-feedback').textContent();
    throw new Error(activity.id + ': ' + feedback, { cause: error });
  }
}
