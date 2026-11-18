import { learningContext } from './support/browser.mjs';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { mkdir } from 'node:fs/promises';
import { withBrowser, answerQuiz, waitForFiniteAnimations } from './support/browser.mjs';
import { indexRoute } from '../js/domain/curriculum.js';
import { solveActivity, prepareProjectEvidence } from './support/python.mjs';
const read = (p) => JSON.parse(readFileSync(p, 'utf8'));
const route = indexRoute(read('content/curriculum/fundamentos.json'));
const module = route.lessons.filter((meta) => meta.status === 'published');
const examples = module.flatMap(
  (meta) => read(`content/lessons/fundamentos/${meta.id}.json`).examples,
);
await mkdir('coverage/javascript', { recursive: true });
const dimensions = process.argv.includes('--desktop')
  ? [1440]
  : process.argv.includes('--mobile')
    ? [390]
    : [1440, 390];
await withBrowser(dimensions[0] === 390 ? 4339 : 4323, async (browser, origin) => {
  for (const width of dimensions) {
    const context = await learningContext(browser, {
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
            ).violations.map((v) => ({ id: v.id, targets: v.nodes.map((n) => n.target) })),
          );
          assert.deepEqual(violations, [], `Ejemplo JavaScript: ${width}px / ${theme}`);
        }
        await page.evaluate(() => (document.documentElement.dataset.theme = 'dark'));
        await example.screenshot({ path: `coverage/javascript/console-${width}.png` });
        await page.screenshot({
          path: `coverage/javascript/first-example-${width}.png`,
          fullPage: true,
        });
      }
      if (meta.id === 'js-control-del-recorrido') {
        const game = page.getByRole('region', { name: 'Control de la pista' });
        await game.getByRole('button', { name: 'break', exact: true }).click();
        assert.match(await game.getByRole('status').textContent(), /Intenta otra vez/);
        await game.getByRole('button', { name: 'continue', exact: true }).click();
        await game.getByRole('button', { name: 'Siguiente paso' }).click();
        assert.match(await game.innerText(), /Paso 2 de 3/);
      }
      await page.getByRole('tab', { name: /Practicar/ }).click();
      await page.locator('[data-activity]').first().waitFor();
      if (index === 0) {
        const first = page.locator(
          `[data-activity="${data.activities.find((a) => a.type === 'javascript').id}"]`,
        );
        await solveActivity(page, data.activities[0]);
        await first.locator('.code-editor').fill('console.log("incorrecto");');
        await prepareProjectEvidence(page, data.activities[1]);
        await first.locator('[data-check]').click();
        await first.locator('.practice-feedback.bad').waitFor();
        await first.locator('.code-editor').fill('console.log("un borrador");');
        await page.reload();
        await page.locator('[data-activity]').first().waitFor();
        assert.equal(
          await page
            .locator(`[data-activity="${data.activities.find((a) => a.type === 'javascript').id}"]`)
            .locator('.code-editor')
            .inputValue(),
          'console.log("un borrador");',
        );
      }
      for (let stepIndex = 0; stepIndex < data.activities.length; stepIndex++) {
        const activity = data.activities[stepIndex];
        const section = page.locator(`[data-activity="${activity.id}"]`);
        if (activity.id === 'js-buscar-en-orden-aplicar') {
          await section.getByText('Casos que comprobará el ejercicio').click();
          assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
          await section
            .locator('.code-editor')
            .fill('function resolverCaso(datos, meta) { return datos.findIndex(n => n >= meta); }');
          await section.locator('[data-check]').click();
          const feedback = section.locator('.practice-feedback.bad');
          await feedback
            .getByText(/superó el límite de lecturas/)
            .first()
            .waitFor();
          assert.match(await feedback.innerText(), /Lecturas observadas 108 de 8 permitidas/);
          assert.equal(await section.locator('.badge.live').count(), 0);
        }
        if (activity.learningStep && stepIndex > 1) {
          const previousKey = `fundamentos/${meta.id}/${data.activities[stepIndex - 1].id}`;
          const previous = await page.evaluate(
            (key) =>
              JSON.parse(localStorage.getItem('teslacode:progress:v2')).projectArtifacts[key].code,
            previousKey,
          );
          assert.equal(
            await section.locator('.code-editor').inputValue(),
            previous,
            'The next step starts from the actual approved version',
          );
        }
        const submitted =
          data.learningProject && activity.type === 'javascript'
            ? { ...activity, solution: activity.solution + '\n' }
            : activity;
        await solveActivity(page, submitted);
        if (activity.learningStep) {
          const artifactKey = `fundamentos/${meta.id}/${activity.id}`;
          await page.waitForFunction(
            (key) =>
              JSON.parse(localStorage.getItem('teslacode:progress:v2')).projectArtifacts[key]
                ?.verifiedAt,
            artifactKey,
          );
          if (activity.type === 'javascript') {
            const artifact = await page.evaluate(
              (key) =>
                JSON.parse(localStorage.getItem('teslacode:progress:v2')).projectArtifacts[key],
              artifactKey,
            );
            assert.equal(
              artifact.code,
              submitted.solution,
              'Snapshots contain submitted code, not the reference template',
            );
          }
        }
      }
      if (index === 0) {
        const lastActivity = data.activities.find((a) => a.learningStep?.phase === 'integrar');
        const last = page.locator(`[data-activity="${lastActivity.id}"]`);
        const note = 'Predije tres líneas y comparé el orden con mi versión anterior.';
        await last.locator('[data-project-journal]').fill(note);
        const artifactKey = `fundamentos/${meta.id}/${lastActivity.id}`;
        await page.waitForFunction(
          ({ key, note }) =>
            JSON.parse(localStorage.getItem('teslacode:progress:v2')).projectArtifacts[key]
              .notes === note,
          { key: artifactKey, note },
        );
        const downloaded = page.waitForEvent('download');
        await last.locator('[data-download-artifact]').click();
        const file = await downloaded;
        assert.match(file.suggestedFilename(), /plan-practica.*\.js$/);
        assert.equal(readFileSync(await file.path(), 'utf8'), lastActivity.solution + '\n');
        await page.reload();
        await page.locator('[data-project-journal]').first().waitFor();
        assert.equal(
          await page
            .locator(`[data-activity="${lastActivity.id}"] [data-project-journal]`)
            .inputValue(),
          note,
        );
        await solveActivity(page, { ...lastActivity, solution: lastActivity.solution + '\n' });
        await page.addScriptTag({ path: 'node_modules/axe-core/axe.min.js' });
        const violations = await page.evaluate(async () =>
          (
            await axe.run(document, {
              runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21aa'] },
            })
          ).violations.map((v) => v.id),
        );
        assert.deepEqual(violations, [], `Project controls ${width}px`);
      }
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
      `PASS JavaScript ${width}px: ${module.length} lecciones desde cero, ejercicios y análisis de decisiones, borradores, consola, accesibilidad, progreso y archivo anterior.`,
    );
  }
  // Targeted inspection uses a fixture; the two complete learning flows above earn progress.
  const feedbackContext = await learningContext(browser, {
      viewport: { width: 320, height: 1000 },
      reducedMotion: 'reduce',
    }),
    feedbackPage = await feedbackContext.newPage(),
    logic = read('content/lessons/fundamentos/js-condiciones-logicas.json');
  await feedbackPage.goto(origin);
  await feedbackPage.evaluate(
    (completed) =>
      localStorage.setItem('teslacode:progress:v2', JSON.stringify({ version: 2, completed })),
    module
      .slice(
        0,
        module.findIndex((m) => m.id === logic.id),
      )
      .map((m) => 'fundamentos/' + m.id),
  );
  await feedbackPage.reload();
  await feedbackPage.goto(`${origin}/#/leccion/fundamentos/${logic.id}/practicar`);
  await feedbackPage.locator('[data-activity]').first().waitFor();
  await solveActivity(feedbackPage, logic.activities[0]);
  const rule = logic.activities[1],
    ruleSection = feedbackPage.locator(`[data-activity="${rule.id}"]`);
  await ruleSection
    .locator('.code-editor')
    .fill(rule.solution.replace('minutos >= minimo && minutos <= maximo', 'undefined'));
  await prepareProjectEvidence(feedbackPage, rule);
  await ruleSection.locator('[data-check]').click();
  await ruleSection.locator('.practice-feedback.bad').waitFor();
  assert.match(
    await ruleSection.locator('.practice-feedback').innerText(),
    /undefined \[undefined\]/,
  );
  assert.match(await ruleSection.locator('.practice-feedback').innerText(), /Datos esperados:/);
  assert.equal(await ruleSection.locator('.badge.live').count(), 0);
  await ruleSection.getByText('Casos que comprobará el ejercicio', { exact: true }).click();
  for (const theme of ['dark', 'light']) {
    await feedbackPage.evaluate((t) => (document.documentElement.dataset.theme = t), theme);
    await waitForFiniteAnimations(feedbackPage);
    await feedbackPage.addScriptTag({ path: 'node_modules/axe-core/axe.min.js' });
    const violations = await feedbackPage.evaluate(async () =>
      (
        await axe.run(document, {
          runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21aa'] },
        })
      ).violations.map((v) => ({ id: v.id, targets: v.nodes.map((n) => n.target) })),
    );
    assert.deepEqual(violations, [], `Typed feedback and locked stages 320px / ${theme}`);
    assert.ok(
      await feedbackPage.evaluate(() => document.documentElement.scrollWidth <= innerWidth),
    );
  }
  await solveActivity(feedbackPage, rule);
  await feedbackContext.close();
  console.log(
    'PASS devolución 320px: tipos observados, etapas bloqueadas accesibles y corrección posterior.',
  );
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
          example.sample ?? { name: example.id, stdin: example.stdin, stdout: example.stdout },
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
      const functionCase = { name: 'argumentos', args: [[1, 2]], expected: 3, preserveArgs: true };
      const functionResults = [];
      for (const code of [
        'const sumar = (datos) => datos[0] + datos[1];',
        'console.log(3);',
        'function sumar(datos) { console.log(3); }',
        'function sumar(datos) { datos[0] = 9; return 3; }',
      ]) {
        const result = await runner.run({ code, entrypoint: 'sumar', cases: [functionCase] });
        functionResults.push(result.results[0].passed);
      }
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
        functionResults,
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
  assert.equal(engine.checkedExamples.length, examples.length);
  assert.ok(
    engine.checkedExamples.every((item) => item.passed),
    JSON.stringify(engine.checkedExamples.filter((item) => !item.passed)),
  );
  assert.ok(engine.isolated.results.every((r) => r.passed));
  assert.deepEqual(engine.functionResults, [true, false, false, false]);
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
