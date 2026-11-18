import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { learningContext, withBrowser } from './support/browser.mjs';

await withBrowser(4338, async (browser, origin) => {
  const context = await learningContext(browser, { viewport: { width: 320, height: 780 } });
  const page = await context.newPage();
  const errors = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto(origin + '/assets/labs/plan/laboratorio.html');
  const name = page.getByLabel('Nombre');
  await page.getByRole('button', { name: 'Calcular plan' }).click();
  await page.getByText('Revisa estos campos: Nombre.').waitFor();
  assert.equal(await name.evaluate((field) => document.activeElement === field), true);
  await name.fill('<b>Ana</b>');
  await name.press('Enter');
  await page.getByText('150 min', { exact: true }).waitFor();
  assert.equal(await page.locator('#resultado b').count(), 0);
  assert.match(await page.locator('#resultado').innerText(), /<b>Ana<\/b>/);

  const duration = page.getByLabel('Minutos de la sesión');
  await duration.fill('0');
  await duration.press('Enter');
  await page.getByText('Sesión registrada.').waitFor();
  await duration.fill('36');
  await page.getByRole('button', { name: 'Registrar sesión' }).click();
  await page.locator('#registros').getByText('36 min', { exact: true }).waitFor();
  await page.reload();
  assert.deepEqual(await page.locator('#registros li').allTextContents(), ['0 min', '36 min']);
  const pending = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Descargar copia' }).click();
  const downloaded = await pending;
  assert.deepEqual(JSON.parse(await readFile(await downloaded.path(), 'utf8')), {
    version: 1,
    sesiones: [0, 36],
  });
  await page.getByRole('button', { name: 'Deshacer última' }).click();
  const file = page.getByLabel('Restaurar copia JSON');
  await file.setInputFiles({
    name: 'valida.json',
    mimeType: 'application/json',
    buffer: Buffer.from('{"version":1,"sesiones":[16,30,40]}'),
  });
  await page.getByText('Copia restaurada.').waitFor();
  assert.deepEqual(await page.locator('#registros li').allTextContents(), [
    '16 min',
    '30 min',
    '40 min',
  ]);
  await file.setInputFiles({
    name: 'invalida.json',
    mimeType: 'application/json',
    buffer: Buffer.from('{"version":1,"sesiones":["30"]}'),
  });
  await page.getByText('La copia no es válida.', { exact: false }).waitFor();
  assert.equal(await page.locator('#registros li').count(), 3);

  await page.evaluate(() => {
    const original = File.prototype.text;
    File.prototype.text = function () {
      if (this.name === 'lenta.json')
        return new Promise((resolve) => {
          window.releaseOldCopy = () => resolve('{"version":1,"sesiones":[1]}');
        });
      return original.call(this);
    };
  });
  await file.setInputFiles({
    name: 'lenta.json',
    mimeType: 'application/json',
    buffer: Buffer.from('{}'),
  });
  await page.waitForFunction(() => typeof window.releaseOldCopy === 'function');
  await file.setInputFiles({
    name: 'vigente.json',
    mimeType: 'application/json',
    buffer: Buffer.from('{"version":1,"sesiones":[16,30,41]}'),
  });
  await page.locator('#registros li').getByText('41 min', { exact: true }).waitFor();
  await page.evaluate(() => window.releaseOldCopy());
  assert.deepEqual(await page.locator('#registros li').allTextContents(), [
    '16 min',
    '30 min',
    '41 min',
  ]);

  const search = page.getByRole('button', { name: 'Buscar sugerencia' });
  await search.click();
  await page.locator('#estado-red').getByText('Prueba cero vueltas', { exact: false }).waitFor();
  await page.route('**/sugerencias.json?*', (route) => route.fulfill({ status: 404 }));
  await search.click();
  await page.getByText('No se pudo cargar la sugerencia.', { exact: false }).waitFor();
  assert.equal(await page.locator('#registros li').count(), 3);
  await page.unroute('**/sugerencias.json?*');
  let releaseOld;
  let arrive;
  const arrived = new Promise((resolve) => {
    arrive = resolve;
  });
  await page.route('**/sugerencias.json?*', async (route) => {
    if (route.request().url().endsWith('tema=funciones')) {
      await new Promise((resolve) => {
        releaseOld = resolve;
        arrive();
      });
      await route.fulfill({ json: { funciones: 'Consejo antiguo' } }).catch(() => {});
    } else await route.fulfill({ json: { listas: 'Consejo actual' } });
  });
  await page.getByLabel('Tema de práctica').selectOption('funciones');
  await search.click();
  await arrived;
  await page.getByLabel('Tema de práctica').selectOption('listas');
  await search.click();
  await page.getByText('Consejo actual').waitFor();
  releaseOld();
  await page.waitForLoadState('networkidle');
  assert.equal(await page.locator('#estado-red').textContent(), 'Consejo actual');
  await page.addScriptTag({ path: 'node_modules/axe-core/axe.min.js' });
  for (const width of [320, 1440]) {
    await page.setViewportSize({ width, height: 780 });
    assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
    assert.deepEqual(
      await page.evaluate(async () =>
        (
          await axe.run({
            runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21aa'] },
          })
        ).violations.map((v) => v.id),
      ),
      [],
    );
  }
  assert.deepEqual(errors, []);
  await context.close();
  console.log(
    'PASS laboratorio web: módulos, teclado, render seguro, estado, recarga, copia, HTTP, cancelación y accesibilidad.',
  );
});
