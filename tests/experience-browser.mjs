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
    assert.equal(await page.locator('.tesla-head').count(), 1);
    assert.equal(await page.locator('[data-tesla-eye]').count(), 2);
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
    if (width === 1440) {
      const look = async (x, y, sign) => {
        await page.mouse.move(x, y);
        await page.waitForFunction(
          (sign) =>
            Math.sign(
              parseFloat(
                document.querySelector('[data-depth-scene]').style.getPropertyValue('--gaze-x'),
              ),
            ) === sign,
          sign,
        );
        await waitForFiniteAnimations(page);
        return page.evaluate(() => ({
          head: getComputedStyle(document.querySelector('.tesla-head')).transform,
          eyes: [...document.querySelectorAll('[data-tesla-eye]')].map(
            (eye) => getComputedStyle(eye).transform,
          ),
        }));
      };
      const left = await look(260, 180, -1),
        right = await look(1380, 450, 1);
      assert.notEqual(left.head, right.head, 'The head turns toward the document cursor');
      left.eyes.forEach((eye, i) =>
        assert.notEqual(eye, right.eyes[i], 'Each pupil follows independently of the head'),
      );
      const positions = await page.locator('.orbit-chip').evaluateAll((buttons) =>
        buttons.map((button) => {
          const { x, y } = button.getBoundingClientRect();
          return { x, y };
        }),
      );
      positions.forEach((position, i) =>
        assert.deepEqual(
          position,
          { x: geometry[i].x, y: geometry[i].y },
          'Looking around never moves route controls',
        ),
      );
      await page.evaluate(() => document.dispatchEvent(new Event('pointerleave')));
      await page.waitForFunction(
        () =>
          document.querySelector('[data-depth-scene]').style.getPropertyValue('--gaze-x') === '',
      );
      await page.locator('.studio-discover').scrollIntoViewIfNeeded();
      await page.waitForFunction(
        () => document.querySelector('[data-depth-scene]').dataset.sceneActive === 'false',
      );
      assert.equal(
        await page
          .locator('[data-depth-scene]')
          .evaluate((scene) => scene.style.getPropertyValue('--gaze-x')),
        '',
      );
      await page.evaluate(() => scrollTo(0, 0));
      await page.waitForFunction(
        () => document.querySelector('[data-depth-scene]').dataset.sceneActive === 'true',
      );
      await page.locator('#motion-toggle').click();
      assert.equal(
        await page
          .locator('[data-depth-scene]')
          .evaluate((scene) => scene.style.getPropertyValue('--gaze-x')),
        '',
      );
      await page.waitForFunction(
        () => document.querySelector('[data-depth-scene]').dataset.sceneActive === 'false',
      );
      await page.waitForFunction(() =>
        document.querySelector('.brand img').src.includes('teslacode-still.webp'),
      );
      await page.locator('#motion-toggle').click();
    }
    if (touch || reduced) {
      await page.mouse.move(width - 10, 150);
      await page.evaluate(() => new Promise((done) => requestAnimationFrame(done)));
      assert.equal(
        await page
          .locator('[data-depth-scene]')
          .evaluate((scene) => scene.style.getPropertyValue('--gaze-x')),
        '',
      );
      assert.equal(
        await page
          .locator('.tesla-hologram')
          .evaluate((element) => getComputedStyle(element).animationName),
        'none',
      );
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
  const hiddenContext = await browser.newContext();
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
  const animationContext = await browser.newContext({ reducedMotion: 'no-preference' });
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
    const page = await fallback.newPage();
    await page.goto(origin);
    await page.locator('.hero').waitFor();
    assert.equal(await page.locator('.tesla-head svg').isVisible(), true);
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
