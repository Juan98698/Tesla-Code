import assert from 'node:assert/strict';
import { once } from 'node:events';
import { readFileSync } from 'node:fs';
import { chromium } from 'playwright';
import { createDevServer } from '../tools/dev-server.mjs';
import { browserExecutable } from './support/runtime.mjs';
import { learningContext } from './support/browser.mjs';
import { installSpeechMock } from './support/speech.mjs';
import { MATH_METHODS, MATH_CONSTANTS } from '../tools/learning-content-audit.mjs';

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
    assert.equal(await page.locator('[data-topic-collection="route"] a').count(), 78);
    assert.equal(await page.locator('[data-topic-collection="companion"] a').count(), 27);
    assert.equal(await page.locator('[data-topic-collection="mathematics"] a').count(), 6);
    for (const [query, id] of [
      ['.reduce', 'js-reducir-acumulador'],
      ['.map()', 'js-transformar-map'],
      ['.filter', 'js-filtrar-encontrar'],
      ['colas', 'js-pila-y-cola'],
      ['pilas', 'js-pila-de-cambios'],
      ['Object.entries()', 'consulta-claves-valores'],
      ['.includes', 'consulta-includes'],
      ['Map.prototype.entries()', 'consulta-entries-iteradores'],
      ['math. random', 'consulta-math-random'],
      ['math floor', 'consulta-math-redondeos'],
      ['Math.ceil()', 'consulta-math-redondeos'],
      ['Math.trunc()', 'consulta-math-redondeos'],
      ['Math.PI', 'consulta-math-angulos'],
      ['Math.sumPrecise', 'consulta-math-suma-precisa'],
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

    // Run the actual browser implementation, including operations absent in Node.
    // Never replace Math.random or Math.sumPrecise with a testing implementation.
    const supported = await page.evaluate(() =>
      Object.getOwnPropertyNames(Math).filter((name) => typeof Math[name] === 'function'),
    );
    if (width === 1440) {
      assert.deepEqual(
        supported.filter((name) => !MATH_METHODS.includes(name)),
        [],
        'unreviewed Math method',
      );
      assert.deepEqual(
        (
          await page.evaluate(() =>
            Object.getOwnPropertyNames(Math).filter((name) => typeof Math[name] === 'number'),
          )
        ).sort(),
        [...MATH_CONSTANTS].sort(),
      );
      assert.ok(
        supported.includes('sumPrecise'),
        'the browser suite must exercise real sumPrecise',
      );
    }
    const selectedGuides =
      width === 1440
        ? catalog.guides
        : catalog.guides.filter((guide) =>
            [
              'consulta-math-random',
              'consulta-array-cambios',
              'consulta-desestructuracion',
              'consulta-temporizadores',
              'consulta-regexp',
              'consulta-elegir-recorrido',
            ].includes(guide.id),
          );
    for (const guide of selectedGuides) {
      await search.fill(guide.title);
      await page.locator(`nav[data-topic-nav] a[data-topic="${guide.id}"]`).click();
      await page.getByRole('heading', { name: guide.title, exact: true }).waitFor();
      const examples = [guide.example, ...(guide.examples ?? [])];
      for (const [index, exampleData] of examples.entries()) {
        const panel = page.locator('.code-example').nth(index);
        await panel.locator(':scope > summary').click();
        const run = panel.getByRole('button', { name: 'Ejecutar código', exact: true });
        await run.click();
        await page.waitForFunction((button) => !button.disabled, await run.elementHandle());
        assert.equal(await panel.locator('.console-error').isVisible(), false, guide.id);
        const output = (await panel.locator('.console-output').innerText()).trim();
        if (exampleData.verification) {
          assert.ok(output.length, guide.id);
          const value = Number(output);
          assert.ok(value >= 0 && value < 1 && Number.isFinite(value), output);
        } else if (exampleData.sample)
          assert.ok(
            output.endsWith('Resultado devuelto: ' + JSON.stringify(exampleData.sample.expected)),
            guide.id + ': ' + output,
          );
        else assert.equal(output, exampleData.stdout.trim(), guide.id);
      }
      const activities = [
        ...['guided', 'bug', 'challenge'].map((step) => ({
          ...guide[step],
          id: `${guide.id}-${step}`,
        })),
        ...(guide.practices ?? []),
      ];
      for (const activity of activities) {
        const card = page.locator(`[data-topic-exercise="${activity.id}"]`);
        if (activity.id.endsWith('-bug')) {
          await card.locator('.code-editor').fill(activity.starter);
          await card.getByRole('button', { name: 'Comprobar ejercicio' }).click();
          await card.locator('.practice-feedback.bad').waitFor();
        }
        await card.locator('.code-editor').fill(activity.solution);
        await card.getByRole('button', { name: 'Comprobar ejercicio' }).click();
        await card.locator('.practice-feedback.ok').waitFor();
      }
      await page
        .locator('.topic-reasoning textarea')
        .fill('Elijo según el retorno y conservo las entradas cuando lo pide el contrato.');
      assert.equal(await stored(page), before);
      console.log(`✓ ${guide.id}: ejemplos y casos reales a ${width}px.`);
    }
    console.log(
      `✓ Consulta editorial: ${selectedGuides.length} fichas a ${width}px, sin créditos de la ruta.`,
    );
    await page.addScriptTag({ path: 'node_modules/axe-core/axe.min.js' });
    for (const theme of ['dark', 'light']) {
      await page.evaluate((theme) => (document.documentElement.dataset.theme = theme), theme);
      const violations = await page.evaluate(async () =>
        (
          await axe.run(document.querySelector('[data-topic-learning]'), {
            runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21aa'] },
          })
        ).violations.map((item) => item.id),
      );
      assert.deepEqual(violations, [], `${width}px ${theme}: contrato, razonamiento e índice`);
    }
    await page.evaluate(() => (document.documentElement.dataset.theme = 'dark'));
    await search.fill('ternario');
    await page.locator('nav[data-topic-nav] a').press('Enter');
    await page
      .getByRole('heading', { name: 'Operador ternario: elegir un valor con ? :', exact: true })
      .waitFor();
    assert.match(page.url(), /#\/practica\/javascript\/temas\/consulta-ternario$/);
    assert.equal(await play.isEnabled(), true);
    const exercise = page.locator('[data-topic-exercise="consulta-ternario-guided"]');
    await exercise.locator('.code-editor').fill('const edad = 18;\nconsole.log("mi borrador");');
    await page
      .locator('.topic-reasoning textarea')
      .fill('Escojo el valor según la frontera de edad.');
    await exercise.getByRole('button', { name: 'Comprobar ejercicio' }).click();
    await exercise.locator('.practice-feedback.bad').waitFor();
    await exercise.getByRole('button', { name: 'Necesito una pista' }).click();
    await exercise.locator('.practice-hint:not([hidden])').waitFor();
    await search.fill('nada coincide');
    await page
      .getByText('No hay coincidencias. Prueba otro término o borra la búsqueda.')
      .waitFor();
    assert.match(await exercise.locator('.code-editor').inputValue(), /mi borrador/);
    assert.equal(
      await page.locator('.topic-reasoning textarea').inputValue(),
      'Escojo el valor según la frontera de edad.',
    );
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
      await page.locator('.topic-reasoning textarea').inputValue(),
      'Escojo el valor según la frontera de edad.',
    );
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

  const older = await learningContext(browser, {
    viewport: { width: 390, height: 960 },
    reducedMotion: 'reduce',
  });
  await older.addInitScript(() =>
    Object.defineProperty(Math, 'sumPrecise', { value: undefined, configurable: true }),
  );
  await older.addInitScript(installSpeechMock);
  const page = await older.newPage();
  await page.goto(origin + '/#/practica/javascript/temas/consulta-math-suma-precisa');
  await page.getByText('Este navegador no ofrece Math.sumPrecise().', { exact: false }).waitFor();
  assert.equal(await page.locator('[data-topic-exercise]').count(), 0);
  await page.locator('#lesson-audio [data-audio-play]').click();
  assert.ok(await page.evaluate(() => __speech.current.text.trim()));
  await older.close();
  console.log(
    '✓ Math sin sumPrecise: aviso, teoría y audio disponibles; ninguna sustitución silenciosa.',
  );
} finally {
  await browser?.close();
  server.closeAllConnections();
  await new Promise((resolve) => server.close(resolve));
}
