import assert from 'node:assert/strict';
import { once } from 'node:events';
import { readFileSync } from 'node:fs';
import { chromium } from 'playwright';
import { createDevServer } from '../tools/dev-server.mjs';
import { browserExecutable } from './support/runtime.mjs';
import { learningContext } from './support/browser.mjs';
import { installSpeechMock } from './support/speech.mjs';

// The application server avoids invoking IDE instrumentation in the serve CLI.
// The tutor is deliberately a local stub: these tests never consume an API quota.
const server = createDevServer({
  root: process.cwd(),
  handle: async () => Response.json({ ready: false }),
});
server.listen(0, '127.0.0.1');
await once(server, 'listening');
const origin = `http://127.0.0.1:${server.address().port}`;
const catalog = JSON.parse(readFileSync('content/learning/javascript-guides.json', 'utf8'));
let browser;
const stored = (page) => page.evaluate(() => localStorage.getItem('teslacode:progress:v2'));
try {
  browser = await chromium.launch({ executablePath: browserExecutable(), args: ['--no-sandbox'] });
  for (const width of [1440, 390, 320]) {
    const context = await learningContext(browser, {
      viewport: { width, height: 960 },
      reducedMotion: 'reduce',
      colorScheme: 'dark',
    });
    await context.addInitScript(installSpeechMock);
    const page = await context.newPage();
    const errors = [];
    page.on('pageerror', (error) => errors.push(error.message));
    await page.goto(origin + '/#/practica');
    await page.getByRole('button', { name: 'Aprender por temas', exact: true }).waitFor();
    const before = await stored(page);
    if (width === 1440)
      await page.route('**/content/learning/javascript-guides.json?*', (route) => route.abort(), {
        times: 1,
      });
    await page.getByRole('button', { name: 'Aprender por temas', exact: true }).press('Enter');
    if (width === 1440) {
      await page.getByRole('button', { name: 'Reintentar índice' }).click();
    }
    await page
      .getByRole('heading', { name: 'Tu primera línea: escribe, ejecuta y observa', exact: true })
      .waitFor();
    const play = page.locator('#lesson-audio [data-audio-play]');
    assert.equal(await play.isEnabled(), true);
    await play.press('Enter');
    assert.ok(await page.evaluate(() => __speech.current.text.length > 0));
    await page.locator('#lesson-audio [data-audio-stop]').click();
    const search = page.getByLabel('Buscar un tema de JavaScript');
    for (const [query, id] of [
      ['.reduce', 'js-reducir-acumulador'],
      ['.map()', 'js-transformar-map'],
      ['.filter', 'js-filtrar-encontrar'],
      ['colas', 'js-pila-y-cola'],
      ['pilas', 'js-pila-de-cambios'],
      ['Object.entries()', 'consulta-claves-valores'],
      ['.includes', 'consulta-includes'],
      ['Map.prototype.entries()', 'consulta-entries-iteradores'],
    ]) {
      await search.fill(query);
      await page.locator(`nav[data-topic-nav] a[data-topic="${id}"]`).waitFor();
    }
    for (const [query, id, step] of [
      ['.includes()', 'consulta-includes', 'guided'],
      ['Array.prototype.entries()', 'consulta-entries-iteradores', 'challenge'],
    ]) {
      await search.fill(query);
      await page.locator(`nav[data-topic-nav] a[data-topic="${id}"]`).click();
      const card = page.locator(`[data-topic-exercise="${id}-${step}"]`);
      await card
        .locator('.code-editor')
        .fill(catalog.guides.find((guide) => guide.id === id)[step].solution);
      await card.getByRole('button', { name: 'Comprobar ejercicio' }).click();
      await card.locator('.practice-feedback.ok').waitFor();
      assert.equal(await stored(page), before);
    }
    await search.fill('ternario');
    await page.locator('nav[data-topic-nav] a').press('Enter');
    await page
      .getByRole('heading', { name: 'Operador ternario: elegir un valor con ? :', exact: true })
      .waitFor();
    assert.match(page.url(), /#\/practica\/javascript\/temas\/consulta-ternario$/);
    assert.equal(await play.isEnabled(), true);
    const exercise = page.locator('[data-topic-exercise="consulta-ternario-guided"]');
    await exercise.locator('.code-editor').fill('const edad = 18;\nconsole.log("mi borrador");');
    await exercise.getByRole('button', { name: 'Comprobar ejercicio' }).click();
    await exercise.locator('.practice-feedback.bad').waitFor();
    await exercise.getByRole('button', { name: 'Necesito una pista' }).click();
    await exercise.locator('.practice-hint:not([hidden])').waitFor();
    await search.fill('nada coincide');
    await page
      .getByText('No hay coincidencias. Prueba otro término o borra la búsqueda.')
      .waitFor();
    assert.match(await exercise.locator('.code-editor').inputValue(), /mi borrador/);
    await search.fill('forEach');
    await page.locator('nav[data-topic-nav] a[data-topic="consulta-for-each"]').click();
    await page
      .getByRole('heading', { name: 'forEach: una acción por cada elemento', exact: true })
      .waitFor();
    await search.fill('ternario');
    await page.locator('nav[data-topic-nav] a').click();
    await exercise.waitFor();
    assert.match(await exercise.locator('.code-editor').inputValue(), /mi borrador/);
    await exercise.locator('.code-editor').fill(catalog.guides[0].guided.solution);
    await exercise.getByRole('button', { name: 'Comprobar ejercicio' }).click();
    await exercise.locator('.practice-feedback.ok').waitFor();
    assert.equal(await stored(page), before);

    // A prepared fault has a useful explanation; free execution does not award XP.
    const bug = page.locator('[data-topic-exercise="consulta-ternario-bug"]');
    await bug.locator('.code-editor').fill('const edad = 18;\nedad = 20;');
    await bug.getByRole('button', { name: 'Ejecutar código' }).click();
    await bug.locator('.console-error:not([hidden])').waitFor();
    assert.match(await bug.locator('.console-error').innerText(), /declaración con let/);

    // A direct URL survives reload and cannot complete the protected source lesson.
    await page.reload();
    await exercise.waitFor();
    assert.equal(
      await exercise.locator('.code-editor').inputValue(),
      catalog.guides[0].guided.solution,
    );
    await page.getByRole('link', { name: 'Ver lección de referencia →' }).click();
    await page
      .getByText(
        'Completa la práctica y la comprobación de los pasos previos para desbloquear esta lección.',
      )
      .waitFor();
    assert.equal(await stored(page), before);
    await page.goto(origin + '/#/practica/javascript/temas/js-cambios-con-let');
    await page
      .getByRole('heading', { name: 'Seguir un dato que cambia con let', exact: true })
      .waitFor();
    await page.getByRole('button', { name: 'Siguiente momento' }).click();
    await page.getByText('2 de 4 · salida: pendiente', { exact: true }).waitFor();
    const example = page.locator('.code-example').first();
    await example.locator(':scope > summary').click();
    await example.locator('.example-prediction textarea').fill('pendiente y confirmada');
    await example.getByRole('button', { name: 'Ejecutar código' }).click();
    await page.waitForFunction(
      () =>
        document.querySelector('.code-example .console-output')?.textContent ===
        'pendiente\nconfirmada\n',
    );
    await page.addScriptTag({ path: 'node_modules/axe-core/axe.min.js' });
    for (const theme of ['dark', 'light']) {
      await page.evaluate((theme) => (document.documentElement.dataset.theme = theme), theme);
      const violations = await page.evaluate(async () =>
        (
          await axe.run(document.querySelector('[data-topic-learning]'), {
            runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21aa'] },
          })
        ).violations.map((item) => ({
          id: item.id,
          targets: item.nodes.map((node) => node.target),
        })),
      );
      assert.deepEqual(violations, [], `${width}px ${theme}: ${JSON.stringify(violations)}`);
    }
    await page.evaluate(() => (document.documentElement.dataset.theme = 'dark'));
    assert.equal(
      await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1),
      true,
      `${width}px sin desbordamiento horizontal`,
    );
    await page.screenshot({ path: `coverage/topics-${width}.png`, fullPage: false });
    await page.getByRole('button', { name: 'Retos y simuladores', exact: true }).click();
    await page.getByRole('button', { name: 'Aprender por temas', exact: true }).click();
    await example.waitFor();
    await example.locator(':scope > summary').click();
    assert.equal(
      await example.locator('.example-prediction textarea').inputValue(),
      'pendiente y confirmada',
    );
    assert.equal(await stored(page), before);
    await page.goto(origin + '/#/practica/javascript/temas/js-recursion-y-arbol');
    await page
      .getByRole('heading', {
        name: 'Recorrer dependencias jerárquicas con recursión',
        exact: true,
      })
      .waitFor();
    assert.equal(await play.isEnabled(), true);
    await play.press('Enter');
    assert.ok(await page.evaluate(() => __speech.current.text.length > 0));
    const cancels = await page.evaluate(() => __speech.cancels);
    await page.getByLabel('Buscar un tema de JavaScript').fill('let');
    await page.locator('nav[data-topic-nav] a[data-topic="js-cambios-con-let"]').click();
    await page
      .getByRole('heading', { name: 'Seguir un dato que cambia con let', exact: true })
      .waitFor();
    assert.equal(await page.evaluate(() => __speech.current), undefined);
    assert.ok(await page.evaluate((before) => __speech.cancels > before, cancels));
    assert.deepEqual(errors, []);
    await context.close();
    console.log(
      `✓ Aprender por temas: navegación, consola real, borradores, límites y WCAG a ${width}px.`,
    );
  }
} finally {
  await browser?.close();
  server.closeAllConnections();
  await new Promise((resolve) => server.close(resolve));
}
