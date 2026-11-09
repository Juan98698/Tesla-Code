import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { mkdir } from 'node:fs/promises';
import { resolve } from 'node:path';
import { chromium } from 'playwright';
import { withBrowser } from './support/browser.mjs';
import { browserExecutable } from './support/runtime.mjs';

const read = (path) => JSON.parse(readFileSync(path, 'utf8'));
const routes = read('content/curriculum/index.json').routes.map((id) =>
  read(`content/curriculum/${id}.json`),
);
const output = resolve('coverage/ui-review/verified');
await mkdir(output, { recursive: true });
async function audit(page, label) {
  await page.addScriptTag({ path: 'node_modules/axe-core/axe.min.js' });
  const violations = await page.evaluate(async () =>
    (
      await axe.run(document, {
        runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21aa'] },
      })
    ).violations.map((v) => ({ id: v.id, targets: v.nodes.map((n) => n.target) })),
  );
  assert.deepEqual(violations, [], label);
}
await withBrowser(4321, async (browser, origin) => {
  for (const width of [1440, 1024, 768, 390, 320]) {
    const touch = width < 700,
      reduced = width === 1024;
    const context = await browser.newContext({
      viewport: { width, height: 1000 },
      hasTouch: touch,
      reducedMotion: reduced ? 'reduce' : 'no-preference',
    });
    const page = await context.newPage(),
      errors = [],
      animationRequests = [];
    page.on('request', (request) => {
      if (request.url().includes('teslacode-spin.webp')) animationRequests.push(request.url());
    });
    page.on('pageerror', (error) => errors.push(error.message));
    await page.goto(origin);
    await page.locator('.hero').waitFor();
    const logo = page.locator(width > 1000 ? '.brand img' : '.mobile-brand img');
    await page.waitForFunction(
      ({ selector, reduced }) => {
        const image = document.querySelector(selector);
        return (
          image.complete &&
          image.naturalWidth === 128 &&
          image.src.includes(reduced ? 'teslacode-still.webp' : 'teslacode-spin.webp')
        );
      },
      { selector: width > 1000 ? '.brand img' : '.mobile-brand img', reduced },
    );
    assert.equal(animationRequests.length, reduced ? 0 : 1);
    if (width === 1440) {
      const frame = await logo.screenshot();
      let changed = false;
      for (let attempt = 0; attempt < 12 && !changed; attempt++)
        changed = !frame.equals(await logo.screenshot());
      assert.ok(changed, 'The displayed logo advances through its animated frames');
    }
    await page.waitForFunction(
      (active) =>
        document.querySelector('[data-depth-scene]').dataset.sceneActive === String(active),
      !touch && !reduced,
    );
    const geometry = await page.locator('.orbit-chip').evaluateAll((buttons) =>
      buttons.map((button) => {
        const box = button.getBoundingClientRect();
        return {
          label: button.textContent,
          x: box.x,
          y: box.y,
          right: box.right,
          bottom: box.bottom,
        };
      }),
    );
    for (let i = 0; i < geometry.length; i++) {
      const a = geometry[i];
      assert.ok(a.x >= 0 && a.right <= width, `${width}: ${a.label} remains in the viewport`);
      for (const b of geometry.slice(i + 1))
        assert.ok(
          !(a.x < b.right && a.right > b.x && a.y < b.bottom && a.bottom > b.y),
          `${width}: route buttons overlap: ${a.label}/${b.label}`,
        );
    }
    assert.equal(
      await page.evaluate(() => document.documentElement.scrollWidth > innerWidth),
      false,
      `${width}: no horizontal overflow`,
    );
    if (width === 1440) {
      await page.mouse.move(1100, 350);
      await page.waitForFunction(
        () =>
          document.querySelector('[data-depth-scene]').style.getPropertyValue('--pointer-x') !== '',
      );
      await page.locator('.studio-discover').scrollIntoViewIfNeeded();
      await page.waitForFunction(
        () => document.querySelector('[data-depth-scene]').dataset.sceneActive === 'false',
      );
      await page.evaluate(() => scrollTo(0, 0));
      await page.waitForFunction(
        () => document.querySelector('[data-depth-scene]').dataset.sceneActive === 'true',
      );
      await page.locator('#motion-toggle').click();
      await page.waitForFunction(
        () => document.querySelector('[data-depth-scene]').dataset.sceneActive === 'false',
      );
      await page.waitForFunction(() =>
        document.querySelector('.brand img').src.includes('teslacode-still.webp'),
      );
      await page.locator('#motion-toggle').click();
    }
    for (const route of routes) {
      await page.getByRole('button', { name: `Elegir ruta ${route.name}`, exact: true }).click();
      await page.locator(`[data-studio-route="${route.id}"]`).waitFor();
      assert.equal(await page.evaluate(() => document.activeElement.dataset.orbitRoute), route.id);
    }
    const keyboardRoute = routes.at(-1);
    await page
      .getByRole('button', { name: `Elegir ruta ${keyboardRoute.name}`, exact: true })
      .focus();
    await page.keyboard.press('Enter');
    await page.locator(`[data-studio-route="${keyboardRoute.id}"]`).waitFor();
    assert.equal(
      await page.evaluate(() => document.activeElement.dataset.orbitRoute),
      keyboardRoute.id,
    );
    await page.getByRole('button', { name: `Elegir ruta ${routes[0].name}`, exact: true }).focus();
    await page.keyboard.press('Space');
    await page.locator(`[data-studio-route="${routes[0].id}"]`).waitFor();
    assert.equal(
      await page.evaluate(() => document.activeElement.dataset.orbitRoute),
      routes[0].id,
    );
    const state = await page.evaluate(() =>
      JSON.parse(localStorage.getItem('teslacode:progress:v2')),
    );
    assert.equal(state.xp, 0);
    assert.deepEqual(state.completed, []);
    for (const theme of ['dark', 'light']) {
      await page.evaluate((theme) => {
        document.documentElement.dataset.theme = theme;
      }, theme);
      await audit(page, `${width}: ${theme}`);
      await page.evaluate(() => scrollTo(0, 0));
      if ([1440, 390].includes(width)) {
        await page.screenshot({
          path: resolve(output, `home-${theme}-${width}.png`),
          fullPage: true,
        });
        await page.screenshot({ path: resolve(output, `viewport-${theme}-${width}.png`) });
      }
    }
    await page
      .locator('#studio-route-select')
      .evaluate((el) => el.scrollIntoView({ block: 'start' }));
    const top = await page
      .locator('#studio-route-select')
      .evaluate((el) => el.getBoundingClientRect().top);
    await page.locator('#studio-route-select').selectOption('backend');
    assert.ok(
      Math.abs(
        (await page
          .locator('#studio-route-select')
          .evaluate((el) => el.getBoundingClientRect().top)) - top,
      ) < 2,
      'Changing the workbench route keeps the control in the same viewport position',
    );
    assert.equal(await page.evaluate(() => document.activeElement.id), 'studio-route-select');
    for (const [hash, selector] of [
      ['#/rutas', '.routes-grid'],
      ['#/ruta/fundamentos', '.map-layout'],
      ['#/leccion/fundamentos/tu-primer-paso/aprender', '#lesson'],
      ['#/progreso', '#progress-file'],
    ]) {
      await page.goto(origin + '/' + hash);
      await page.locator(selector).waitFor();
      assert.match(await logo.getAttribute('src'), /teslacode-still\.webp/);
      assert.equal(
        await page.evaluate(() => document.documentElement.scrollWidth > innerWidth),
        false,
        `${width}: ${hash}`,
      );
      await audit(page, `${width}: ${hash}`);
    }
    assert.deepEqual(errors, []);
    await context.close();
    console.log(
      `PASS experiencia ${width}px: selección por la escena, foco, movimiento, teclado/táctil, scroll, temas y accesibilidad.`,
    );
  }
  for (const [saveData, hash] of [
    [true, '#/inicio'],
    [false, '#/leccion/fundamentos/tu-primer-paso/aprender'],
  ]) {
    const context = await browser.newContext();
    await context.addInitScript((saveData) => {
      Object.defineProperty(navigator, 'connection', { value: { saveData } });
    }, saveData);
    const page = await context.newPage(),
      requests = [];
    page.on('request', (request) => {
      if (request.url().includes('teslacode-spin.webp')) requests.push(request.url());
    });
    await page.goto(origin + '/' + hash);
    await page.locator(saveData ? '.hero' : '#lesson').waitFor();
    await page.evaluate(
      () => new Promise((done) => requestAnimationFrame(() => requestAnimationFrame(done))),
    );
    assert.match(await page.locator('.brand img').getAttribute('src'), /teslacode-still\.webp/);
    assert.deepEqual(requests, []);
    await context.close();
  }
  console.log(
    'PASS: giro real del logo; sin descarga de animación con movimiento reducido, ahorro de datos o entrada directa a una lección.',
  );
  const fallback = await chromium.launch({
    executablePath: browserExecutable(),
    args: ['--no-sandbox', '--disable-webgl'],
  });
  try {
    const page = await fallback.newPage();
    await page.goto(origin);
    await page.locator('.hero').waitFor();
    assert.equal(
      await page.evaluate(() => Boolean(document.createElement('canvas').getContext('webgl'))),
      false,
    );
    await page.getByRole('button', { name: 'Elegir ruta Python', exact: true }).click();
    await page.locator('[data-studio-route="python"]').waitFor();
    await page.getByRole('link', { name: /Empieza tu primera lección/ }).click();
    await page.locator('#lesson').waitFor();
    console.log('PASS: escena y navegación funcionales con WebGL deshabilitado.');
  } finally {
    await fallback.close();
  }
});
