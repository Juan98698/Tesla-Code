import { learningContext } from './support/browser.mjs';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { withBrowser, answerQuiz } from './support/browser.mjs';
import { screenshotPath } from './support/runtime.mjs';
import { installPythonRuntime, solveActivity } from './support/python.mjs';

const read = (p) => JSON.parse(readFileSync(p));
const route = read('content/curriculum/python.json');
const published = route.levels.flatMap((l) => l.lessons).filter((l) => l.status === 'published');
await withBrowser(4322, async (browser, origin) => {
  let earned;
  for (const width of [1440, 390]) {
    const context = await learningContext(browser, {
      viewport: { width, height: 950 },
      reducedMotion: 'reduce',
    });
    await installPythonRuntime(context, origin);
    const page = await context.newPage(),
      errors = [];
    page.on('pageerror', (error) => errors.push(error.message));
    await page.goto(origin + '/#/leccion/python/' + published[1].id + '/practicar');
    await page.getByText('Completa el paso anterior', { exact: true }).waitFor();
    for (const meta of published) {
      const data = read('content/lessons/python/' + meta.id + '.json');
      await page.goto(origin + '/#/leccion/python/' + meta.id + '/aprender');
      await page.locator('#lesson').waitFor();
      await page.getByRole('tab', { name: /Practicar/ }).click();
      await page.locator('#activities').waitFor();
      for (const activity of data.activities) await solveActivity(page, activity);
      await answerQuiz(page, data);
      const state = await page.evaluate(() =>
        JSON.parse(localStorage.getItem('teslacode:progress:v2')),
      );
      assert.ok(state.completed.includes('python/' + meta.id));
    }
    earned = await page.evaluate(() => JSON.parse(localStorage.getItem('teslacode:progress:v2')));
    assert.equal(earned.completed.length, published.length);
    await page.goto(origin + '/#/leccion/python/ejecutar-y-leer-codigo/practicar');
    const editor = page.locator('[data-activity="reparar"] .code-editor');
    await editor.waitFor();
    await editor.fill('print("mi borrador")');
    await page.reload();
    await editor.waitFor();
    assert.equal(await editor.inputValue(), 'print("mi borrador")');
    await editor.fill('while True:\n    pass');
    const section = page.locator('[data-activity="reparar"]');
    await section.locator('button[type=submit]').click();
    await section
      .locator('.console-status')
      .filter({ hasText: 'Ejecutando los casos de prueba…' })
      .waitFor();
    await page.goto(origin + '/#/ruta/python');
    await page.locator('#node-inspector').waitFor();
    assert.equal(await page.locator('iframe').count(), 0);
    assert.equal(
      (await page.evaluate(() => JSON.parse(localStorage.getItem('teslacode:progress:v2')))).xp,
      earned.xp,
    );
    await page.goto(origin + '/#/leccion/python/proyecto-presupuesto/practicar');
    await page.locator('textarea').first().waitFor();
    await page.addScriptTag({ path: 'node_modules/axe-core/axe.min.js' });
    for (const theme of ['dark', 'light']) {
      await page.evaluate((t) => (document.documentElement.dataset.theme = t), theme);
      assert.deepEqual(
        await page.evaluate(async () =>
          (
            await axe.run(document, {
              runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21aa'] },
            })
          ).violations.map((v) => ({ id: v.id, nodes: v.nodes.map((n) => n.target) })),
        ),
        [],
      );
    }
    assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
    await page.screenshot({
      path: screenshotPath('teslacode-python-' + width + '.png'),
      fullPage: true,
    });
    assert.deepEqual(errors, []);
    console.log(
      'PASS Python',
      width + 'px:',
      published.length,
      'lecciones cursadas, código real, borradores, navegación y accesibilidad.',
    );
    await context.close();
  }
  const context = await learningContext(browser);
  await installPythonRuntime(context, origin);
  const page = await context.newPage();
  await page.goto(origin);
  const boundaries = await page.evaluate(async () => {
    const { createPythonRunner } = await import('./js/repositories/python-runner.js');
    const runner = createPythonRunner({ timeout: 500 });
    let timeout;
    try {
      await runner.run({ code: 'while True:\n    pass', cases: [{ name: 'stop', stdout: '' }] });
    } catch (error) {
      timeout = error.message;
    }
    const result = await runner.run({
      code: 'import js\nprint(hasattr(js, "document"))\nprint(hasattr(js, "localStorage"))',
      cases: [{ name: 'isolation', stdout: 'False\nFalse\n' }],
    });
    return { timeout, result, frames: document.querySelectorAll('iframe').length };
  });
  assert.match(boundaries.timeout, /agotó el tiempo/);
  assert.ok(boundaries.result.results[0].passed);
  assert.equal(boundaries.frames, 0);
  await page.goto(origin + '/#/progreso');
  await page.locator('#progress-file').waitFor();
  const upload = () =>
    page.locator('#progress-file').setInputFiles({
      name: 'progreso.json',
      mimeType: 'application/json',
      buffer: Buffer.from(JSON.stringify(earned)),
    });
  await upload();
  await page.locator('#confirm-import:not([disabled])').waitFor();
  assert.equal(
    await page.evaluate(() => JSON.parse(localStorage.getItem('teslacode:progress:v2')).xp),
    0,
  );
  await page.locator('#cancel-import').click();
  await upload();
  await page.locator('#confirm-import:not([disabled])').waitFor();
  await page.locator('#confirm-import').click();
  await page.locator('#undo-import:visible').waitFor();
  assert.equal(
    await page.evaluate(() => JSON.parse(localStorage.getItem('teslacode:progress:v2')).xp),
    earned.xp,
  );
  await page.locator('#undo-import').click();
  await page.locator('#undo-import[hidden]').waitFor({ state: 'attached' });
  assert.equal(
    await page.evaluate(() => JSON.parse(localStorage.getItem('teslacode:progress:v2')).xp),
    0,
  );
  await upload();
  await page.locator('#confirm-import:not([disabled])').waitFor();
  await page.locator('#confirm-import').click();
  await page.locator('#undo-import:visible').waitFor();
  await upload();
  await page.locator('#confirm-import:not([disabled])').waitFor();
  await page.locator('#confirm-import').click();
  assert.equal(
    await page.evaluate(() => JSON.parse(localStorage.getItem('teslacode:progress:v2')).xp),
    earned.xp,
  );
  await context.close();
  console.log(
    'PASS ejecución acotada y restauración real, cancelación, deshacer e importación idempotente.',
  );
});
