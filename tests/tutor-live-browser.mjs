// Optional owner-run integration: one paid/quota-consuming Gemini request, never part of CI.
import assert from 'node:assert/strict';
import { mkdir } from 'node:fs/promises';
import { chromium } from 'playwright';
import { createDevServer } from '../tools/dev-server.mjs';
import { browserExecutable } from './support/runtime.mjs';
import { learningContext } from './support/browser.mjs';

if (!process.env.GEMINI_API_KEY)
  throw Error('Configura GEMINI_API_KEY en .env.local antes de ejecutar esta prueba opcional.');
await mkdir('coverage/tutor', { recursive: true });
const server = createDevServer();
await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
const origin = `http://127.0.0.1:${server.address().port}`;
let browser;
try {
  browser = await chromium.launch({ executablePath: browserExecutable(), args: ['--no-sandbox'] });
  const context = await learningContext(browser, {
      viewport: { width: 1440, height: 1000 },
      reducedMotion: 'reduce',
    }),
    page = await context.newPage(),
    requests = [];
  page.on('request', (request) =>
    requests.push({ headers: request.headers(), body: request.postData() }),
  );
  await page.goto(origin + '/#/leccion/fundamentos/js-tu-primer-programa/aprender');
  await page.locator('#lesson').waitFor();
  await page.getByRole('button', { name: /Pregúntale a Tesla/ }).click();
  await page.locator('.tutor-send').waitFor();
  await page.waitForFunction(() => !document.querySelector('.tutor-send').disabled);
  await page
    .getByLabel('Tu pregunta', { exact: true })
    .fill(
      'Explícame desde cero qué hace console.log, con un ejemplo breve y una pregunta para comprobar si entendí.',
    );
  await page.getByRole('button', { name: /Enviar/ }).click();
  await page.waitForFunction(
    () => document.querySelector('.tutor-status').textContent.startsWith('Respuesta lista'),
    {},
    { timeout: 40000 },
  );
  assert.ok((await page.locator('.tutor-assistant').innerText()).length > 40);
  assert.equal(await page.locator('.tutor-sources a').count(), 1);
  assert.ok(
    !requests.some(
      (request) =>
        request.headers['x-goog-api-key'] || request.body?.includes(process.env.GEMINI_API_KEY),
    ),
  );
  for (const width of [1440, 390]) {
    await page.setViewportSize({ width, height: width === 390 ? 844 : 1000 });
    for (const theme of ['dark', 'light']) {
      await page.evaluate((theme) => (document.documentElement.dataset.theme = theme), theme);
      await page.addScriptTag({ path: 'node_modules/axe-core/axe.min.js' });
      const violations = await page.evaluate(async () =>
        (
          await axe.run(document, {
            runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21aa'] },
          })
        ).violations.map((v) => ({ id: v.id, targets: v.nodes.map((n) => n.target) })),
      );
      assert.deepEqual(violations, [], `${width}/${theme}`);
      await page.screenshot({ path: `coverage/tutor/live-${width}-${theme}.png` });
    }
  }
  const state = await page.evaluate(() =>
    JSON.parse(localStorage.getItem('teslacode:progress:v2')),
  );
  assert.equal(state.xp, 0);
  assert.deepEqual(state.completed, []);
  console.log(
    'PASS Gemini real: navegador → servidor local → proveedor; respuesta contextual, escritorio/móvil, ambos temas, WCAG y progreso intacto. La clave no viajó al navegador.',
  );
} finally {
  await browser?.close();
  server.closeAllConnections();
  await new Promise((resolve) => server.close(resolve));
}
