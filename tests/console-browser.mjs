import { learningContext } from './support/browser.mjs';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { withBrowser } from './support/browser.mjs';
import { screenshotPath } from './support/runtime.mjs';
import { installPythonRuntime } from './support/python.mjs';
import { emptyProgress } from '../js/core/storage.js';
const read = (p) => JSON.parse(readFileSync(p));
const keys = read('content/curriculum/index.json').routes.flatMap((id) =>
  read('content/curriculum/' + id + '.json')
    .levels.flatMap((l) => l.lessons)
    .filter((l) => l.status === 'published')
    .map((l) => id + '/' + l.id),
);
await withBrowser(4325, async (browser, origin) => {
  for (const width of [1440, 390]) {
    const context = await learningContext(browser, {
      viewport: { width, height: 950 },
      reducedMotion: 'reduce',
    });
    await installPythonRuntime(context, origin);
    const page = await context.newPage(),
      errors = [];
    page.on('pageerror', (error) => errors.push(error.message));
    await page.goto(origin);
    // Fixture de acceso para probar controles, no prueba de aprendizaje.
    await page.evaluate(
      (state) => localStorage.setItem('teslacode:progress:v2', JSON.stringify(state)),
      { ...emptyProgress(), completed: keys, xp: 180 },
    );
    await page.reload();
    await page.goto(origin + '/#/leccion/python/ejecutar-y-leer-codigo/practicar');
    const section = page.locator('[data-activity="reparar"]');
    const editor = section.locator('.code-editor');
    const run = async (code) => {
      await editor.fill(code);
      await section.locator('[data-run]').click();
      await section.locator('[data-run]:not([disabled])').waitFor({ timeout: 60000 });
    };
    await editor.waitFor();
    await run('print("Hola")');
    assert.equal(await section.locator('.console-output').innerText(), 'Hola\n');
    assert.equal(await section.locator('.badge.live').count(), 0);
    assert.equal(
      await page.evaluate(() => JSON.parse(localStorage.getItem('teslacode:progress:v2')).xp),
      180,
    );
    await section.locator('[data-check]').click();
    await section.locator('.badge.live').waitFor({ timeout: 60000 });
    assert.match(await section.locator('.console-output').innerText(), /Hola/);
    assert.match(await section.locator('.practice-feedback').innerText(), /Esperado: Hola/);
    await section.locator('.console-inputs summary').click();
    await section.locator('[data-stdin]').fill('Ana\n7');
    await run('nombre = input("Nombre: ")\nnumero = int(input())\nprint(nombre, numero * 2)');
    assert.equal(await section.locator('.console-output').innerText(), 'Nombre: Ana 14\n');
    await run('print("<img src=x>")\n1 / 0');
    assert.match(await section.locator('.console-output').innerText(), /<img src=x>/);
    assert.equal(await section.locator('.console-output img').count(), 0);
    assert.match(await section.locator('.console-error').innerText(), /ejercicio.py.*line 2/s);
    await run('def broken(');
    assert.match(await section.locator('.console-error').innerText(), /SyntaxError/);
    await section.locator('[data-stdin]').fill('');
    await run('input()');
    assert.match(await section.locator('.console-error').innerText(), /EOFError/);
    await run('x = 2');
    assert.match(await section.locator('.console-output').innerText(), /sin imprimir/);
    await run('print("antes", flush=True)\nwhile True:\n    pass');
    assert.match(await section.locator('.console-output').innerText(), /antes/);
    assert.match(await section.locator('.console-error').innerText(), /agotó el tiempo/);
    await section.locator('[data-clear]').click();
    assert.equal(await section.locator('.console-output').innerText(), '');
    assert.equal(await section.locator('.console-error:visible').count(), 0);
    await editor.fill('print("detener", flush=True)\nwhile True:\n    pass');
    await section.locator('[data-run]').click();
    await section.locator('.console-output').filter({ hasText: 'detener' }).waitFor();
    await section.locator('[data-stop]').click();
    await section.locator('.console-error').filter({ hasText: 'detenida' }).waitFor();
    await run('print("Hola")');
    await section.locator('.console-inputs summary').click();
    await page.addScriptTag({ path: 'node_modules/axe-core/axe.min.js' });
    for (const theme of ['dark', 'light']) {
      await page.evaluate((theme) => (document.documentElement.dataset.theme = theme), theme);
      assert.deepEqual(
        await page.evaluate(async () =>
          (
            await axe.run(document, {
              runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21aa'] },
            })
          ).violations.map((v) => ({ id: v.id, targets: v.nodes.map((n) => n.target) })),
        ),
        [],
      );
    }
    assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
    await page.screenshot({
      path: screenshotPath('teslacode-console-' + width + '.png'),
      fullPage: true,
    });
    for (const [key, expected] of [
      ['fundamentos/ciclos-y-entradas-python', 'Inicio: 2\n3\n'],
      ['algoritmia/implementar-algoritmos-en-python', '-3\n'],
      ['python/ejecutar-y-leer-codigo', 'Hola, mundo\nEstoy aprendiendo Python\n'],
    ]) {
      await page.goto(origin + '/#/leccion/' + key + '/aprender');
      const example = page.locator('.code-example').first();
      await example.locator('summary').first().click();
      await example.locator('[data-run]').click();
      await example.locator('[data-run]:not([disabled])').waitFor({ timeout: 60000 });
      assert.equal(await example.locator('.console-output').innerText(), expected, key);
    }
    // El desmontaje también cancela ejecuciones iniciadas desde Aprender.
    const example = page.locator('.code-example').first();
    await example
      .locator('.code-editor')
      .fill('print("navegar", flush=True)\nwhile True:\n    pass');
    await example.locator('[data-run]').click();
    await example.locator('.console-output').filter({ hasText: 'navegar' }).waitFor();
    await page.goto(origin + '/#/ruta/python');
    await page.locator('#node-inspector').waitFor();
    assert.equal(await page.locator('iframe').count(), 0);
    await page.goto(origin + '/#/leccion/fundamentos/concurrencia-y-asincronia/aprender');
    await page.locator('.code-example summary').click();
    assert.match(await page.locator('.code-example').innerText(), /hilos.*terminal/s);
    assert.equal(await page.locator('.code-example [data-run]').count(), 0);
    assert.deepEqual(errors, []);
    await context.close();
    console.log(
      'PASS consola ' +
        width +
        'px: stdout, errores, entradas, pruebas, límites, cancelación, ejemplos y accesibilidad.',
    );
  }
});
