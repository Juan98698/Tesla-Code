import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { mkdir } from 'node:fs/promises';
import { withBrowser, answerQuiz, waitForFiniteAnimations } from './support/browser.mjs';
import { indexRoute } from '../js/domain/curriculum.js';
import { solveJavaScriptActivity } from './support/javascript.mjs';
const read = (p) => JSON.parse(readFileSync(p, 'utf8'));
const route = indexRoute(read('content/curriculum/fundamentos.json'));
const module = route.lessons.filter((meta) => meta.status === 'published');
const examples = module.flatMap(
  (meta) => read(`content/lessons/fundamentos/${meta.id}.json`).examples,
);
await mkdir('coverage/javascript', { recursive: true });
await withBrowser(4323, async (browser, origin) => {
  for (const width of [1440, 390]) {
    const context = await browser.newContext({
        viewport: { width, height: 1000 },
        reducedMotion: 'reduce',
      }),
      page = await context.newPage(),
      errors = [],
      requests = [];
    page.on('pageerror', (error) => errors.push(error.message));
    page.on('request', (request) => requests.push(request.url()));
    await page.goto(origin);
    await page.getByRole('link', { name: /Empieza tu primera lección/ }).click();
    for (let index = 0; index < module.length; index++) {
      const meta = module[index],
        data = read(`content/lessons/fundamentos/${meta.id}.json`);
      await page.locator('#lesson').waitFor();
      assert.equal(await page.locator('h1').innerText(), meta.title);
      if (index === 0) {
        await page.goto(`${origin}/#/leccion/fundamentos/${module[1].id}/aprender`);
        await page.getByText('Completa el paso anterior', { exact: true }).waitFor();
        await page.goto(`${origin}/#/leccion/fundamentos/${meta.id}/aprender`);
        await page.locator('#lesson').waitFor();
        const example = page.locator('.code-example').first();
        await example.locator(':scope > summary').click();
        await example.locator('[data-run]').click();
        await page.waitForFunction(
          () =>
            document.querySelector('.code-example .console-output').textContent ===
            'Hola TeslaCode\n',
        );
        assert.equal(
          await page.evaluate(
            () => JSON.parse(localStorage.getItem('teslacode:progress:v2')).completed.length,
          ),
          0,
        );
        for (const theme of ['dark', 'light']) {
          await page.evaluate((theme) => (document.documentElement.dataset.theme = theme), theme);
          await waitForFiniteAnimations(page);
          await page.addScriptTag({ path: 'node_modules/axe-core/axe.min.js' });
          const violations = await page.evaluate(async () =>
            (
              await axe.run(document, {
                runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21aa'] },
              })
            ).violations.map((v) => v.id),
          );
          assert.deepEqual(violations, []);
        }
        await page.evaluate(() => (document.documentElement.dataset.theme = 'dark'));
        await example.screenshot({ path: `coverage/javascript/console-${width}.png` });
        await page.screenshot({
          path: `coverage/javascript/first-example-${width}.png`,
          fullPage: true,
        });
      }
      await page.getByRole('tab', { name: /Practicar/ }).click();
      await page.locator('[data-activity]').first().waitFor();
      if (index === 0) {
        const first = page.locator('[data-activity]').first();
        await first.locator('.code-editor').fill('console.log("incorrecto");');
        await first.locator('[data-check]').click();
        await first.locator('.practice-feedback.bad').waitFor();
        await first.locator('.code-editor').fill('console.log("un borrador");');
        await page.reload();
        await page.locator('[data-activity]').first().waitFor();
        assert.equal(
          await page.locator('[data-activity]').first().locator('.code-editor').inputValue(),
          'console.log("un borrador");',
        );
      }
      for (const activity of data.activities) await solveJavaScriptActivity(page, activity);
      await answerQuiz(page, data);
      const state = await page.evaluate(() =>
        JSON.parse(localStorage.getItem('teslacode:progress:v2')),
      );
      assert.equal(state.completed.length, index + 1);
      assert.ok(state.completed.includes('fundamentos/' + meta.id));
      await page.reload();
      await page.locator('#qbox').waitFor();
      assert.equal(
        (await page.evaluate(() => JSON.parse(localStorage.getItem('teslacode:progress:v2')))).xp,
        state.xp,
      );
      if (index < module.length - 1) {
        await page.goto(`${origin}/#/leccion/fundamentos/${meta.id}/aprender`);
        await page.locator('#lesson').waitFor();
        await answerQuiz(page, data);
        await page.getByRole('button', { name: 'Mi siguiente paso →', exact: true }).click();
      }
      assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
    }
    await page.goto(origin + '/#/ruta/fundamentos');
    await page.getByText('Consultar la edición anterior →').click();
    await page.getByRole('heading', { name: /edición anterior/ }).waitFor();
    await page.goto(origin + '/#/leccion/fundamentos/tu-primer-paso/aprender');
    await page.locator('#lesson').waitFor();
    assert.match(await page.locator('.lesson-main').innerText(), /Edición anterior/);
    assert.equal(requests.filter((url) => /pyodide.*(?:wasm|mjs|zip)/.test(url)).length, 0);
    assert.deepEqual(errors, []);
    await context.close();
    console.log(
      `PASS JavaScript ${width}px: ocho lecciones desde cero, 24 ejercicios, borradores, consola, accesibilidad, progreso y archivo anterior.`,
    );
  }
  const page = await browser.newPage({ reducedMotion: 'reduce' });
  await page.goto(origin);
  await page.locator('.hero').waitFor();
  const engine = await page.evaluate(
    async ({ origin, examples }) => {
      const { createJavaScriptRunner } = await import('./js/repositories/javascript-runner.js');
      const runner = createJavaScriptRunner({ timeout: 1500 });
      const run = async (code, cases = [{ name: 'prueba', stdout: '' }], mode) =>
        runner.run({ code, cases, mode });
      const checkedExamples = [];
      for (const example of examples) {
        const result = await run(example.code, [
          { name: example.id, stdin: example.stdin, stdout: example.stdout },
        ]);
        checkedExamples.push(result.results[0]);
      }
      const isolated = await run(
        'globalThis.contador=(globalThis.contador??0)+1;console.log(contador);',
        [
          { name: 'uno', stdout: '1\n' },
          { name: 'dos', stdout: '1\n' },
        ],
      );
      const error = await run('console.log("antes");\nnoExiste();');
      const syntax = await run('return 1;');
      const blocked = await run(
        'console.log(typeof document,typeof localStorage);try { importScripts(' +
          JSON.stringify(origin + '/js/main.js') +
          '); console.log("inseguro"); } catch {console.log("bloqueado");}',
        [{ name: 'aislamiento', stdout: 'undefined undefined\nbloqueado\n' }],
      );
      let partial = '',
        timeout,
        stopped;
      try {
        await runner.run(
          {
            code: 'console.log("antes del ciclo");while(true){}',
            mode: 'run',
            cases: [{ name: 'libre' }],
          },
          () => {},
          (text) => (partial = text),
        );
      } catch (e) {
        timeout = e.message;
      }
      const pending = run('while(true){}');
      setTimeout(() => runner.cancel(), 30);
      try {
        await pending;
      } catch (e) {
        stopped = e.message;
      }
      runner.dispose();
      return {
        checkedExamples,
        isolated,
        error,
        syntax,
        blocked,
        partial,
        timeout,
        stopped,
        frames: document.querySelectorAll('iframe').length,
      };
    },
    { origin, examples },
  );
  assert.equal(engine.checkedExamples.length, 15);
  assert.ok(
    engine.checkedExamples.every((item) => item.passed),
    JSON.stringify(engine.checkedExamples.filter((item) => !item.passed)),
  );
  assert.ok(engine.isolated.results.every((r) => r.passed));
  assert.match(engine.error.results[0].stdout, /antes/);
  assert.match(engine.error.results[0].traceback, /Línea 2/);
  assert.match(engine.syntax.results[0].error, /SyntaxError/);
  assert.ok(engine.blocked.results[0].passed);
  assert.match(engine.partial, /antes del ciclo/);
  assert.match(engine.timeout, /agotó el tiempo/);
  assert.match(engine.stopped, /detenida/);
  assert.equal(engine.frames, 0);
  console.log(
    'PASS motor real: casos aislados, sintaxis de script, red/almacenamiento, línea de error, salida parcial, ciclo infinito, detener y limpieza.',
  );
  await page.close();
});
