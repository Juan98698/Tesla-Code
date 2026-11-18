import assert from 'node:assert/strict';
import { learningContext, withBrowser } from './support/browser.mjs';
import { catalog, labContext } from './support/laboratory.mjs';
import { progressionRequirements } from '../js/domain/curriculum.js';

const qs = (id) => catalog.items.find((item) => item.id === id);
const storage = (page) =>
  page.evaluate(() => JSON.parse(localStorage.getItem('teslacode:progress:v2')));
const audit = (page) =>
  page.evaluate(async () =>
    (
      await axe.run(document.querySelector('#content'), {
        runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21aa'] },
      })
    ).violations.map(({ id, nodes }) => ({ id, targets: nodes.map((node) => node.target) })),
  );

await withBrowser(4353, async (browser, origin) => {
  for (const width of [1280, 320]) {
    const context = await learningContext(browser, {
      viewport: { width, height: 860 },
      reducedMotion: 'reduce',
      colorScheme: 'dark',
    });
    const page = await context.newPage();
    const errors = [];
    const simulatorRequests = [];
    page.on('pageerror', (error) => errors.push(error.message));
    page.on('request', (request) => {
      if (new URL(request.url()).pathname.endsWith('/js/widgets/labs.js'))
        simulatorRequests.push(request.url());
    });
    if (width === 1280)
      await page.route('**/content/practice/items.json?*', (route) => route.abort(), { times: 1 });
    await page.goto(origin + '/#/practica');
    await page.getByRole('heading', { name: 'Laboratorio', exact: true }).waitFor();
    if (width === 1280) {
      await page.getByText('No se pudo cargar esta actividad.').waitFor();
      await page.getByRole('button', { name: 'Reintentar' }).click();
    }
    const select = page.getByLabel('Ruta', { exact: true });
    await select.waitFor();
    assert.equal(await page.locator('.practice-card').count(), 0);
    await page.locator('[data-route-group="algoritmia"] summary').press('Enter');
    await page.locator('[data-id="acumulador-suma"] [data-open]').waitFor();
    await select.selectOption('algoritmia');
    await page.getByLabel('Tema', { exact: true }).selectOption('algoritmia/ciclos');
    const accumulator = page.locator('[data-id="acumulador-suma"]');
    await accumulator.getByRole('button', { name: 'Abrir reto' }).click();
    await accumulator.locator('[data-step]').press('Enter');
    await accumulator.locator('[data-step]').press('Enter');
    await page.getByLabel('Tema', { exact: true }).selectOption('algoritmia/funciones');
    assert.equal(await accumulator.count(), 0);
    await page.getByLabel('Tema', { exact: true }).selectOption('algoritmia/ciclos');
    await accumulator.getByText('Paso 2 de 10').waitFor();
    await accumulator.getByRole('button', { name: 'Retroceder' }).press('Enter');
    await accumulator.getByText('Paso 1 de 10').waitFor();

    await select.selectOption('fundamentos');
    const before = await storage(page);
    await page.getByRole('button', { name: 'Ronda de repaso' }).press('Enter');
    const round = page.locator('[data-round]');
    await round.getByText(/formulario admite cero plazas/).waitFor();
    await round.locator('.opt').nth(0).press('Enter');
    await round.getByText(/Ambas entradas/).waitFor();
    await round.locator('.opt').nth(2).press('Enter');
    await round.getByRole('button', { name: 'Siguiente reto' }).press('Enter');
    await round.locator('.opt').nth(0).press('Enter');
    await round.getByRole('button', { name: 'Ver resultado' }).press('Enter');
    await round.getByText('1 de 2 al primer intento.').waitFor();
    assert.deepEqual(await storage(page), before);
    await round.getByRole('button', { name: 'Cerrar ronda' }).press('Enter');
    assert.equal(
      await page.evaluate(() => document.activeElement.hasAttribute('data-start-round')),
      true,
    );

    await select.selectOption('frontend');
    await page.getByRole('button', { name: 'Ver prácticas de esta ruta' }).click();
    await page.getByRole('link', { name: /Cómo funciona internet.*Practicar/ }).waitFor();
    assert.equal(await page.locator('[data-route-group]').count(), 1);
    await page.getByRole('button', { name: 'Guardadas' }).click();
    await page.getByText(/Guarda una lección|Prueba con otro tema/).waitFor();

    await page.getByRole('button', { name: 'Retos y simuladores' }).click();
    assert.deepEqual(simulatorRequests, []);
    await page.getByRole('button', { name: 'Limpiar filtros' }).click();
    await page.getByLabel('Buscar', { exact: true }).fill('DIFUSION');
    await page.locator('[data-id="difusion-lab"] [data-open]').click();
    await page.getByRole('button', { name: 'Solo señal' }).press('Enter');
    await page.getByText(/Señal: 100%/).waitFor();
    assert.equal(simulatorRequests.length, 1);
    await page.getByLabel('Buscar', { exact: true }).fill('');
    await select.selectOption('ia');
    await page.locator('[data-id="token-lab"] [data-open]').click();
    await page.getByLabel('Tu texto').fill('cafe\u0301');
    assert.equal(await page.locator('[data-tokens] .token').count(), 1);
    const tokens = page.locator('[data-id="token-lab"]');
    await tokens.getByRole('button', { name: 'Con signos' }).click();
    assert.equal(await page.locator('[data-tokens] .token').count(), 6);
    assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
    await page.addScriptTag({ path: 'node_modules/axe-core/axe.min.js' });
    for (const theme of ['dark', 'light']) {
      await page.evaluate((theme) => (document.documentElement.dataset.theme = theme), theme);
      assert.deepEqual(await audit(page), [], `Laboratorio ${width}px, ${theme}`);
    }

    const archive = labContext().routes.find((route) => route.id === 'fundamentos').archive;
    const condition = archive.lessons.find((lesson) => lesson.id === 'condicionales');
    const requirements = progressionRequirements(archive, condition);
    await page.evaluate((requirements) => {
      const key = 'teslacode:progress:v2';
      const state = JSON.parse(localStorage.getItem(key));
      state.completed = requirements;
      localStorage.setItem(key, JSON.stringify(state));
    }, requirements);
    await page.reload();
    await page.goto(origin + '/#/leccion/fundamentos/condicionales/aprender');
    const item = qs('condicion-limite');
    const widget = page.locator('#lesson-widget');
    for (let i = 0; i < item.steps.length; i++) await widget.locator('[data-step]').click();
    await widget.locator('[data-challenge] .opt').nth(item.challenge.answer).click();
    await page.waitForFunction(() =>
      JSON.parse(localStorage.getItem('teslacode:progress:v2')).practices.includes(
        'lab/condicion-limite',
      ),
    );
    await page.goto(origin + '/#/practica/algoritmia');
    await page.locator('[data-id="condicion-limite"] [data-solved]:visible').waitFor();
    assert.deepEqual(errors, []);
    await context.close();
    console.log(
      `PASS Laboratorio ${width}px: catálogo, conservación del intento, rondas, simuladores, teclado, progreso compartido y WCAG.`,
    );
  }
});
