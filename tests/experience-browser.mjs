import { learningContext } from './support/browser.mjs';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { mkdir } from 'node:fs/promises';
import { resolve } from 'node:path';
import { chromium } from 'playwright';
import { withBrowser, waitForFiniteAnimations } from './support/browser.mjs';
import { browserExecutable } from './support/runtime.mjs';

const read = (path) => JSON.parse(readFileSync(path, 'utf8'));
const routes = read('content/curriculum/index.json').routes.map((id) =>
  read(`content/curriculum/${id}.json`),
);
const output = resolve('coverage/ui-review/verified');
await mkdir(output, { recursive: true });
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
await withBrowser(4321, async (browser, origin) => {
  for (const width of [1440, 1024, 768, 390, 320]) {
    const touch = width < 700,
      reduced = width === 1024;
    const context = await learningContext(browser, {
      viewport: { width, height: 1000 },
      hasTouch: touch,
      reducedMotion: reduced ? 'reduce' : 'no-preference',
    });
    const page = await context.newPage(),
      errors = [],
      animationRequests = [];
    await page.addInitScript(() => {
      window.portraitDraws = 0;
      window.portraitContexts = 0;
      const get = HTMLCanvasElement.prototype.getContext;
      HTMLCanvasElement.prototype.getContext = function (...args) {
        if (this.matches('[data-world-surface]') && args[0] === 'webgl') window.portraitContexts++;
        return get.apply(this, args);
      };
      const draw = WebGLRenderingContext.prototype.drawArrays;
      WebGLRenderingContext.prototype.drawArrays = function (...args) {
        window.portraitDraws++;
        return draw.apply(this, args);
      };
    });
    page.on('request', (request) => {
      if (request.url().includes('teslacode-spin.webp')) animationRequests.push(request.url());
    });
    page.on('pageerror', (error) => errors.push(error.message));
    await page.goto(origin);
    await page.locator('.hero').waitFor();
    const logo = page.locator(width > 1000 ? '.brand img' : '.mobile-brand img');
    assert.ok(
      (await logo.evaluate((image) => image.getBoundingClientRect().width)) >=
        (width > 1000 ? 96 : 48),
    );
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
    assert.equal(await page.locator('[data-tesla-hologram]').count(), 0);
    await page.locator('.tesla-world-image').evaluate((image) => image.decode());
    assert.equal(await page.locator('.core-cube').count(), 0);
    await waitForFiniteAnimations(page);
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
    if (touch || reduced) {
      await page.mouse.move(width - 10, 150);
      assert.equal(await page.locator('[data-world-surface]').evaluate((el) => el.hidden), true);
      assert.equal(await page.evaluate(() => window.portraitContexts), 0);
    }
    if (width === 1440) {
      const settle = () =>
        page.evaluate(
          () =>
            new Promise((resolve) => {
              let previous = -1,
                quiet = 0;
              const check = () => {
                quiet = previous === window.portraitDraws ? quiet + 1 : 0;
                previous = window.portraitDraws;
                if (quiet >= 4) resolve();
                else requestAnimationFrame(check);
              };
              requestAnimationFrame(check);
            }),
        );
      await page.mouse.move(30, 180);
      await page.locator('[data-atmosphere][data-renderer="webgl"]').waitFor();
      await settle();
      const isolate = await page.addStyleTag({
        content:
          'body > :not([data-atmosphere]) { visibility: hidden !important; } .tesla-world::after, .syntax-field { display: none !important; }',
      });
      const left = await page.locator('[data-world-surface]').screenshot();
      await page.mouse.move(1420, 600);
      await settle();
      const right = await page.locator('[data-world-surface]').screenshot();
      await isolate.evaluate((node) => node.remove());
      assert.equal(left.equals(right), false, 'The actual wallpaper follows the pointer');
      const pixels = await page.evaluate(
        async (frames) => {
          const images = await Promise.all(
            frames.map(
              (src) =>
                new Promise((resolve) => {
                  const img = new Image();
                  img.onload = () => resolve(img);
                  img.src = 'data:image/png;base64,' + src;
                }),
            ),
          );
          const data = images.map((img) => {
            const surface = document.createElement('canvas');
            surface.width = img.width;
            surface.height = img.height;
            const ctx = surface.getContext('2d');
            ctx.drawImage(img, 0, 0);
            return ctx.getImageData(0, 0, img.width, img.height).data;
          });
          let laboratory = 0,
            changed = 0;
          for (let y = 0; y < images[0].height; y++)
            for (let x = 0; x < images[0].width; x++) {
              const i = (y * images[0].width + x) * 4;
              if (
                data[0][i] !== data[1][i] ||
                data[0][i + 1] !== data[1][i + 1] ||
                data[0][i + 2] !== data[1][i + 2]
              ) {
                changed++;
                if (x < images[0].width * 0.4) laboratory++;
              }
            }
          return { laboratory, changed };
        },
        [left.toString('base64'), right.toString('base64')],
      );
      assert.ok(pixels.changed > 100, 'The photographed face actually moves');
      assert.equal(pixels.laboratory, 0, 'The laboratory stays still without seams');
      assert.ok(await page.evaluate(() => window.portraitDraws > 0));
      const draws = await page.evaluate(() => window.portraitDraws);
      await page.evaluate(
        () => new Promise((done) => requestAnimationFrame(() => requestAnimationFrame(done))),
      );
      assert.equal(
        await page.evaluate(() => window.portraitDraws),
        draws,
        'No render loop at rest',
      );
      const positions = await page.locator('.orbit-chip').evaluateAll((buttons) =>
        buttons.map((button) => {
          const { x, y } = button.getBoundingClientRect();
          return { x, y };
        }),
      );
      positions.forEach((p, i) =>
        assert.deepEqual(
          p,
          { x: geometry[i].x, y: geometry[i].y },
          'Gaze never moves route buttons',
        ),
      );
      await page.evaluate(() => {
        window.restoreWorld = document
          .querySelector('[data-world-surface]')
          .getContext('webgl')
          .getExtension('WEBGL_lose_context');
        window.restoreWorld.loseContext();
      });
      await page.waitForFunction(
        () => !document.querySelector('[data-atmosphere]').dataset.renderer,
      );
      assert.equal(await page.locator('.tesla-world-image').isVisible(), true);
      await page.evaluate(() => window.restoreWorld.restoreContext());
      await page.locator('[data-atmosphere][data-renderer="webgl"]').waitFor();
      await settle();
      await page.locator('#motion-toggle').click();
      await page.waitForFunction(() => document.querySelector('[data-world-surface]').hidden);
      const paused = await page.evaluate(() => window.portraitDraws);
      await page.mouse.move(200, 500);
      await settle();
      assert.equal(await page.evaluate(() => window.portraitDraws), paused);
      await page.locator('#motion-toggle').click();
      await page.locator('[data-atmosphere][data-renderer="webgl"]').waitFor();
      await settle();
      await page.screenshot({ path: 'coverage/ui-review/verified/tesla-wallpaper-desktop.png' });
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
      ['#/practica', '.practice-list'],
      ['#/progreso', '#progress-file'],
    ]) {
      await page.goto(origin + '/' + hash);
      await page.locator(selector).waitFor();
      await page.waitForFunction(
        ({ selector, reduced }) =>
          document
            .querySelector(selector)
            .src.includes(reduced ? 'teslacode-still.webp' : 'teslacode-spin.webp'),
        { selector: width > 1000 ? '.brand img' : '.mobile-brand img', reduced },
      );
      assert.equal(
        await page.evaluate(() => document.documentElement.scrollWidth > innerWidth),
        false,
        `${width}: ${hash}`,
      );
      await audit(page, `${width}: ${hash}`);
      if (hash === '#/progreso' && !reduced) {
        await page.locator('#brand-motion-toggle').click();
        await page.waitForFunction(
          (selector) => document.querySelector(selector).src.includes('teslacode-still.webp'),
          width > 1000 ? '.brand img' : '.mobile-brand img',
        );
        await page.locator('#brand-motion-toggle').click();
      }
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
    const context = await learningContext(browser);
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
    await page.waitForFunction(
      (saveData) =>
        document
          .querySelector('.brand img')
          .src.includes(saveData ? 'teslacode-still.webp' : 'teslacode-spin.webp'),
      saveData,
    );
    assert.equal(requests.length, saveData ? 0 : 1);
    await context.close();
  }
  console.log(
    'PASS: logo ampliado y animado en todas las secciones visibles; sin descarga de animación con movimiento reducido o ahorro de datos.',
  );
  const hiddenContext = await learningContext(browser);
  await hiddenContext.addInitScript(() =>
    document.addEventListener('DOMContentLoaded', () => {
      document.querySelectorAll('[data-brand-motion]').forEach((image) => (image.hidden = true));
    }),
  );
  const hiddenPage = await hiddenContext.newPage(),
    hiddenRequests = [];
  hiddenPage.on('request', (request) => {
    if (request.url().includes('teslacode-spin.webp')) hiddenRequests.push(request.url());
  });
  await hiddenPage.goto(origin + '/#/rutas');
  await hiddenPage.locator('.routes-grid').waitFor();
  await hiddenPage.evaluate(
    () => new Promise((done) => requestAnimationFrame(() => requestAnimationFrame(done))),
  );
  assert.deepEqual(hiddenRequests, [], 'A hidden logo never requests its animation');
  await hiddenContext.close();
  // A fast runner can reach axe while the page is still fading in. Keep this
  // deterministic by slowing the real entrance, then verify real defects fail.
  const animationContext = await learningContext(browser, { reducedMotion: 'no-preference' });
  const animationPage = await animationContext.newPage();
  await animationPage.addInitScript(() => localStorage.setItem('teslacode:theme', 'light'));
  await animationPage.goto(origin + '/#/rutas');
  await animationPage.locator('.routes-grid').waitFor();
  await animationPage.addStyleTag({ content: '.page { animation-duration: 5s !important; }' });
  await animationPage.evaluate(() => {
    const entrance = document
      .querySelector('.page')
      .getAnimations()
      .find((animation) => animation.animationName === 'enter');
    entrance.currentTime = 100;
  });
  assert.ok(
    (await animationPage
      .locator('.page')
      .evaluate((element) => Number(getComputedStyle(element).opacity))) < 1,
  );
  await audit(animationPage, 'Catalog contrast after the slow page entrance');
  assert.equal(
    await animationPage.locator('.page').evaluate((element) => getComputedStyle(element).opacity),
    '1',
  );
  await animationPage.addStyleTag({ content: '.page-intro > p { color: #fff !important; }' });
  await assert.rejects(
    () => audit(animationPage, 'An actual contrast defect must still fail'),
    (error) =>
      error.code === 'ERR_ASSERTION' &&
      error.actual.some((violation) => violation.id === 'color-contrast'),
  );
  await animationContext.close();
  console.log(
    'PASS: auditoría tras terminar la entrada; un contraste realmente insuficiente sigue haciendo fallar la prueba.',
  );
  const fallback = await chromium.launch({
    executablePath: browserExecutable(),
    args: ['--no-sandbox', '--disable-webgl'],
  });
  try {
    const fallbackContext = await learningContext(fallback);
    const page = await fallbackContext.newPage();
    await page.goto(origin);
    await page.locator('.hero').waitFor();
    await page.mouse.move(300, 200);
    assert.equal(await page.locator('.tesla-world-image').isVisible(), true);
    await page.locator('.tesla-world-image').evaluate((image) => image.decode());
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
