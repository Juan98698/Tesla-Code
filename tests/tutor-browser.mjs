import assert from 'node:assert/strict';
import { mkdir } from 'node:fs/promises';
import { learningContext, waitForFiniteAnimations } from './support/browser.mjs';
import { withTutorBrowser } from './support/tutor-browser.mjs';

await mkdir('coverage/tutor', { recursive: true });
async function audit(page, label) {
  // Public hosting intentionally excludes node_modules: inject the installed test tool by content.
  await page.addScriptTag({ path: 'node_modules/axe-core/axe.min.js' });
  await waitForFiniteAnimations(page);
  const violations = await page.evaluate(async () =>
    (
      await axe.run(document, {
        runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21aa'] },
      })
    ).violations.map((v) => ({ id: v.id, targets: v.nodes.map((n) => n.target) })),
  );
  assert.deepEqual(violations, [], label);
}
const progress = (page) =>
  page.evaluate(() => {
    const state = JSON.parse(localStorage.getItem('teslacode:progress:v2'));
    return {
      xp: state.xp,
      completed: state.completed,
      practices: state.practices,
      rewards: state.rewards,
    };
  });
await withTutorBrowser(async ({ browser, origin, calls, env, stats }) => {
  for (const viewport of [
    { width: 1440, height: 1000 },
    { width: 390, height: 844 },
  ]) {
    const context = await learningContext(browser, { viewport, reducedMotion: 'reduce' }),
      page = await context.newPage(),
      requests = [],
      errors = [];
    page.on('request', (request) =>
      requests.push({ url: request.url(), headers: request.headers(), body: request.postData() }),
    );
    page.on('pageerror', (error) => errors.push(error.message));
    await page.goto(origin + '/#/leccion/fundamentos/js-tu-primer-programa/aprender');
    await page.locator('#lesson').waitFor();
    const before = await progress(page),
      providerStart = calls.length;
    assert.equal(
      requests.some((r) => r.url.includes('/api/tutor')),
      false,
    );
    assert.equal(
      requests.some((r) => /tutor-chat\.js|tutor-client\.js|\/css\/tutor\.css/.test(r.url)),
      false,
    );
    await page.getByRole('button', { name: /Pregúntale a Tesla/ }).click();
    const dialog = page.getByRole('dialog', { name: /Tesla Tutor/ });
    await dialog.waitFor();
    const avatar = dialog.locator('.tutor-symbol img');
    await avatar.evaluate((image) => image.decode());
    assert.equal(await avatar.evaluate((image) => image.naturalWidth), 512);
    await page.waitForFunction(() => !document.querySelector('.tutor-send').disabled);
    assert.equal(
      await page.locator('#tutor-question').evaluate((node) => node === document.activeElement),
      true,
    );
    assert.equal(calls.length, providerStart);
    await page.screenshot({ path: `coverage/tutor/welcome-${viewport.width}.png` });
    for (const theme of ['dark', 'light']) {
      await page.evaluate((theme) => (document.documentElement.dataset.theme = theme), theme);
      await audit(page, `welcome/${viewport.width}/${theme}`);
    }
    await page.getByRole('button', { name: 'Desde cero', exact: true }).click();
    await page.getByRole('button', { name: /Enviar/ }).click();
    await page.waitForFunction(() =>
      document.querySelector('.tutor-status').textContent.startsWith('Respuesta lista'),
    );
    assert.equal(calls.length, providerStart + 1);
    const first = calls.at(-1).payload;
    assert.ok(first.systemInstruction.parts[0].text.includes('js-tu-primer-programa'));
    assert.ok(!JSON.stringify(first).includes('js-tu-primer-programa-q1'));
    assert.equal(await dialog.locator('.tutor-messages img,script').count(), 0);
    assert.equal(await page.evaluate(() => window.tutorXss), undefined);
    assert.ok(await dialog.locator('pre code').first().isVisible());
    assert.equal(await dialog.locator('.tutor-prompts').getAttribute('open'), null);
    const reading = await dialog.locator('.tutor-scroll').boundingBox();
    const frame = await dialog.boundingBox();
    assert.ok(
      reading.height / frame.height >= 0.65,
      'La conversación ocupa al menos el 65 % del tutor',
    );
    await dialog.locator('.tutor-info summary').click();
    assert.equal(await dialog.locator('#tutor-disclaimer').isVisible(), true);
    await audit(page, `privacy/${viewport.width}`);
    await dialog.locator('.tutor-info summary').click();
    for (const theme of ['dark', 'light']) {
      await page.evaluate((theme) => (document.documentElement.dataset.theme = theme), theme);
      await audit(page, `conversation/${viewport.width}/${theme}`);
      await page.screenshot({ path: `coverage/tutor/conversation-${viewport.width}-${theme}.png` });
    }
    assert.deepEqual(await progress(page), before);
    await dialog.getByRole('button', { name: 'Borrar conversación', exact: true }).click();
    await dialog.getByRole('button', { name: 'Entender un error', exact: true }).click();
    await dialog
      .getByLabel('Fragmento que quieres compartir')
      .fill('console.log("fragmento compartido");');
    await dialog.getByRole('button', { name: /Enviar/ }).click();
    await page.waitForFunction(() =>
      document.querySelector('.tutor-status').textContent.startsWith('Respuesta lista'),
    );
    assert.ok(calls.at(-1).payload.contents.at(-1).parts[0].text.includes('fragmento compartido'));
    await dialog.getByRole('button', { name: 'Borrar conversación', exact: true }).click();
    await dialog
      .getByLabel('Tu pregunta', { exact: true })
      .fill(`Quiero reintentar ${viewport.width}`);
    await dialog.getByRole('button', { name: /Enviar/ }).click();
    await dialog.getByRole('button', { name: 'Volver a intentar', exact: true }).waitFor();
    const notice = await dialog.locator('.tutor-status').boundingBox();
    assert.ok(
      notice.height >= 20 && notice.width >= 200,
      'El error sigue visible junto al reintento',
    );
    await dialog.getByRole('button', { name: 'Volver a intentar', exact: true }).click();
    await page.waitForFunction(() =>
      document.querySelector('.tutor-status').textContent.startsWith('Respuesta lista'),
    );
    assert.equal(await dialog.locator('.tutor-user').count(), 1);
    await dialog.getByLabel('Tu pregunta', { exact: true }).fill('Necesito una respuesta lenta');
    await dialog.getByRole('button', { name: /Enviar/ }).click();
    await page.waitForFunction(() =>
      document.querySelector('.tutor-assistant:last-child').textContent.includes('Un paso más.'),
    );
    await dialog.getByRole('button', { name: 'Detener respuesta', exact: true }).click();
    await page.waitForFunction(() =>
      document.querySelector('.tutor-status').textContent.includes('detenida'),
    );
    await page.keyboard.press('Escape');
    await page.waitForFunction(() => !document.querySelector('#tutor-dialog').open);
    assert.equal(
      await page.locator('#tutor-open').evaluate((node) => node === document.activeElement),
      true,
    );
    await page.goto(origin + '/#/leccion/frontend/como-funciona-internet/aprender');
    await page.locator('#lesson').waitFor();
    await page.getByRole('button', { name: /Pregúntale a Tesla/ }).click();
    await dialog.waitFor();
    assert.equal(await dialog.locator('.tutor-messages article').count(), 0);
    await page.waitForFunction(() => !document.querySelector('.tutor-send').disabled);
    await dialog.getByLabel('Tu pregunta', { exact: true }).fill('¿Qué es DNS?');
    await dialog.getByRole('button', { name: /Enviar/ }).click();
    await page.waitForFunction(() =>
      document.querySelector('.tutor-status').textContent.startsWith('Respuesta lista'),
    );
    assert.equal(calls.at(-1).payload.contents.length, 1);
    const related = dialog.getByRole('link', { name: /internet/i }).first();
    await related.click();
    await page.waitForFunction(() => !document.querySelector('#tutor-dialog').open);
    assert.deepEqual(await progress(page), before);
    assert.ok(
      !requests.some((r) => r.headers['x-goog-api-key'] || r.body?.includes(env.GEMINI_API_KEY)),
    );
    assert.equal(
      await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth),
      true,
    );
    assert.deepEqual(errors, []);
    await context.close();
    console.log(
      `PASS tutor ${viewport.width}px: HTTP real con proveedor simulado, contexto, streaming, código explícito, reintento, detener, foco, progreso intacto y WCAG en ambos temas.`,
    );
  }
  assert.ok(stats.cancelled > 0, 'Se canceló el trabajo del proveedor al detener la respuesta');
  const original = env.GEMINI_API_KEY;
  env.GEMINI_API_KEY = '';
  const context = await learningContext(browser, {
      viewport: { width: 320, height: 640 },
      reducedMotion: 'reduce',
    }),
    page = await context.newPage();
  await page.goto(origin);
  await page.locator('.hero').waitFor();
  await page.getByRole('button', { name: /Pregúntale a Tesla/ }).click();
  await page.getByText('El tutor de IA todavía no está conectado.', { exact: false }).waitFor();
  assert.equal(await page.locator('.tutor-send').isDisabled(), true);
  await audit(page, 'not-configured/320');
  assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true);
  env.GEMINI_API_KEY = original;
  await page.getByRole('button', { name: 'Volver a conectar', exact: true }).click();
  await page.waitForFunction(() => !document.querySelector('.tutor-send').disabled);
  await context.close();
  for (const path of [
    '/.env.local',
    '/.env.example',
    '/server/tutor/knowledge-data.json',
    '/api/private.mjs',
    '/node_modules/serve-handler/package.json',
  ]) {
    const response = await fetch(origin + path);
    assert.equal(response.status, 404, path);
    assert.ok(!(await response.text()).includes(original));
  }
  const media = await fetch(origin + '/assets/atmosphere/tesla-intro-hq-1080-e44d912c49.mp4', {
    headers: { Range: 'bytes=0-1023' },
  });
  assert.equal(media.status, 206);
  assert.equal((await media.arrayBuffer()).byteLength, 1024);
  console.log(
    'PASS publicación: configuración ausente honesta, recuperación, 320px, archivos privados inaccesibles y reproducción parcial HTTP del video intacta.',
  );
});
