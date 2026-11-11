import assert from 'node:assert/strict';
import { readFileSync, statSync } from 'node:fs';
import { mkdir } from 'node:fs/promises';
import { withBrowser, waitForFiniteAnimations } from './support/browser.mjs';

await mkdir('coverage/atmosphere', { recursive: true });
async function audit(page, label) {
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
await withBrowser(4337, async (browser, origin) => {
  for (const width of [1440, 390]) {
    const context = await browser.newContext({ viewport: { width, height: 1000 } }),
      page = await context.newPage(),
      requests = [],
      errors = [];
    page.on('request', (r) => requests.push(r.url()));
    page.on('pageerror', (e) => errors.push(e.message));
    await page.goto(origin);
    const dialog = page.getByRole('dialog', { name: /Piensa/ });
    await dialog.waitFor();
    assert.equal(await page.locator('video').evaluate((v) => v.muted), true);
    await page.waitForFunction(() => document.querySelector('video').currentTime > 1);
    const source = await page.locator('video').getAttribute('src');
    assert.match(source, /\.mp4\?v=/);
    const path = source.split('?')[0];
    // A ten-second Full HD clip at 8 Mb/s, including its original audio and container.
    assert.ok(statSync(path).size < 12000000);
    assert.equal(readFileSync(path).subarray(4, 8).toString(), 'ftyp');
    assert.deepEqual(
      await page.locator('video').evaluate((v) => ({
        width: v.videoWidth,
        height: v.videoHeight,
        framing: getComputedStyle(v).objectFit,
      })),
      { width: 1920, height: 1080, framing: 'cover' },
    );
    const duration = await page.locator('video').evaluate((v) => v.duration);
    assert.ok(duration >= 10 && duration < 10.1);
    await page.getByRole('button', { name: 'Pausar', exact: true }).click();
    assert.equal(await page.locator('video').evaluate((v) => v.paused), true);
    if (width === 1440) {
      for (const viewport of [
        { width: 1917, height: 870 },
        { width: 2560, height: 1080 },
        { width: 390, height: 844 },
      ]) {
        await page.setViewportSize(viewport);
        assert.equal(
          await page.locator('video').evaluate((v) => {
            const rect = v.getBoundingClientRect();
            const style = getComputedStyle(v);
            return (
              rect.x === 0 &&
              rect.y === 0 &&
              rect.width >= innerWidth &&
              rect.height >= innerHeight &&
              style.objectFit === 'cover' &&
              style.maxWidth === 'none' &&
              style.maxHeight === 'none'
            );
          }),
          true,
          'El video cubre el viewport sin límites que produzcan franjas',
        );
        await page.screenshot({ path: `coverage/atmosphere/intro-fill-${viewport.width}.png` });
      }
      await page.setViewportSize({ width, height: 1000 });
    }
    await page.getByRole('button', { name: 'Activar sonido', exact: true }).click();
    assert.equal(await page.locator('video').evaluate((v) => v.muted), false);
    await page.getByRole('button', { name: 'Silenciar', exact: true }).click();
    await page.getByRole('button', { name: 'Continuar', exact: true }).click();
    await page.waitForFunction(() => document.querySelector('video').currentTime > 2);
    await page.screenshot({ path: `coverage/atmosphere/intro-${width}.png` });
    // Audit a paused frame so the portrait's framing transition can settle and
    // the audit cannot miss the short exit phase while the clip keeps playing.
    await page.getByRole('button', { name: 'Pausar', exact: true }).click();
    await audit(page, 'intro ' + width);
    await page.getByRole('button', { name: 'Continuar', exact: true }).click();
    await page.waitForFunction(
      () => document.documentElement.dataset.cinematic === 'leaving',
      {},
      { timeout: 15000 },
    );
    assert.ok(
      await page.locator('video').evaluate((v) => v.ended && v.currentTime >= 9.99),
      'La transición espera el final del clip, sin recortar su duración',
    );
    await page.waitForFunction(() => !document.querySelector('#cinematic-intro').open);
    assert.equal(await page.locator('video').getAttribute('src'), null);
    assert.equal(
      await page.evaluate(() => JSON.parse(localStorage.getItem('teslacode:progress:v2')).xp),
      0,
    );
    assert.equal(await page.locator('[data-tesla-hologram]').count(), 0);
    assert.ok(
      !requests.some((url) => url.includes('nikola-reference')),
      'El retrato 3D no se descarga hasta solicitarlo',
    );
    await page.locator('.tesla-world-image').evaluate((img) => img.decode());
    assert.equal(await page.locator('.syntax-sigil').count(), 11);
    await page.screenshot({ path: `coverage/atmosphere/home-${width}.png` });
    for (const [name, hash] of [
      ['home', '#/inicio'],
      ['routes', '#/rutas'],
      ['lab', '#/practica'],
      ['progress', '#/progreso'],
      ['lesson', '#/leccion/fundamentos/js-tu-primer-programa/aprender'],
    ]) {
      await page.goto(origin + '/' + hash);
      await page.waitForFunction(() => !document.querySelector('.loading-state'));
      assert.equal(
        await page.locator('.tesla-world-image').evaluate((img) => img.naturalWidth),
        1672,
      );
      for (const theme of ['dark', 'light']) {
        await page.evaluate((theme) => (document.documentElement.dataset.theme = theme), theme);
        await audit(page, `${name}/${width}/${theme}`);
        assert.equal(
          await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth),
          true,
        );
        await page.screenshot({ path: `coverage/atmosphere/${name}-${theme}-${width}.png` });
      }
    }
    await page.evaluate(() => (document.documentElement.dataset.theme = 'dark'));
    await page.goto(origin + '/#/inicio');
    await page.locator('.hero').waitFor();
    assert.equal(await page.locator('.hologram-toggle').count(), 0);
    assert.equal(await page.locator('[data-world-surface]').count(), 1);
    await page.getByRole('button', { name: 'Ver introducción de TeslaCode', exact: true }).click();
    await dialog.waitFor();
    await page.keyboard.press('Escape');
    await page.waitForFunction(() => !document.querySelector('#cinematic-intro').open);
    await page.reload();
    await page.locator('.hero').waitFor();
    assert.equal(await page.locator('#cinematic-intro').evaluate((el) => el.open), false);
    assert.deepEqual(errors, []);
    await context.close();
    console.log(
      `PASS atmósfera ${width}px: video real, transición natural, pausa/sonido/omitir, sesión, Tesla integrado en el fondo, cinco vistas, ambos temas y WCAG.`,
    );
  }
  for (const setting of ['reduced', 'saveData', 'deepLink']) {
    const context = await browser.newContext({
      viewport: { width: 390, height: 900 },
      reducedMotion: setting === 'reduced' ? 'reduce' : 'no-preference',
    });
    if (setting === 'saveData')
      await context.addInitScript(() =>
        Object.defineProperty(navigator, 'connection', {
          configurable: true,
          value: { saveData: true },
        }),
      );
    const page = await context.newPage(),
      videoRequests = [];
    page.on('request', (r) => {
      if (/\.webm|\.mp4/.test(r.url())) videoRequests.push(r.url());
    });
    await page.goto(
      origin +
        (setting === 'deepLink' ? '/#/leccion/fundamentos/js-tu-primer-programa/aprender' : ''),
    );
    await page.locator(setting === 'deepLink' ? '#lesson' : '.hero').waitFor();
    assert.equal(await page.locator('#cinematic-intro').evaluate((el) => el.open), false);
    assert.deepEqual(videoRequests, []);
    if (setting === 'reduced')
      assert.equal(
        await page
          .locator('.syntax-sigil')
          .first()
          .evaluate((el) => getComputedStyle(el).animationName),
        'none',
      );
    await context.close();
  }
  console.log(
    'PASS carga: sin video automático con movimiento reducido, ahorro de datos o entrada a una lección.',
  );
});
