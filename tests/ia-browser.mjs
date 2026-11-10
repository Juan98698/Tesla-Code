import { learningContext } from './support/browser.mjs';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { mkdir } from 'node:fs/promises';
import { withBrowser, answerQuiz, waitForFiniteAnimations } from './support/browser.mjs';
import { solveActivity } from './support/python.mjs';
const read = (p) => JSON.parse(readFileSync(p, 'utf8'));
const route = read('content/curriculum/ia.json');
const lessons = route.levels
  .flatMap((level) => level.lessons)
  .filter((meta) => meta.status === 'published');
await mkdir('coverage/ia', { recursive: true });
await withBrowser(4331, async (browser, origin) => {
  for (const width of [1440, 390]) {
    const context = await learningContext(browser, {
      viewport: { width, height: 1000 },
      reducedMotion: 'reduce',
    });
    const page = await context.newPage(),
      errors = [],
      requests = [];
    page.on('pageerror', (error) => errors.push(error.message));
    page.on('request', (request) => requests.push(request.url()));
    await page.goto(`${origin}/#/leccion/ia/${lessons[1].id}/aprender`);
    await page.getByText('Completa el paso anterior', { exact: true }).waitFor();
    for (const [index, meta] of lessons.entries()) {
      const data = read(`content/lessons/ia/${meta.id}.json`);
      await page.goto(`${origin}/#/leccion/ia/${meta.id}/aprender`);
      await page.locator('#lesson').waitFor();
      assert.equal(await page.locator('h1').innerText(), meta.title);
      await page.getByRole('tab', { name: /Practicar/ }).click();
      await page.locator('#activities [data-activity]').first().waitFor();
      if (index === 0) {
        const activity = data.activities[1];
        const section = page.locator(`[data-activity="${activity.id}"]`);
        await section.locator('[data-hint]').click();
        assert.equal(await section.locator('.hint').isVisible(), true);
        for (const d of activity.decisions)
          await section
            .locator(
              `[data-decision="${d.id}"] input[value="${(d.answer + 1) % d.options.length}"]`,
            )
            .check();
        await section.locator('button[type=submit]').click();
        await section.locator('.practice-feedback.bad').waitFor();
        const before = await page.evaluate(() =>
          JSON.parse(localStorage.getItem('teslacode:progress:v2')),
        );
        assert.equal(before.completed.length, 0);
        assert.ok(!before.practices.includes('ia/' + meta.id + '/' + activity.id));
        for (const theme of ['dark', 'light']) {
          await page.evaluate((theme) => (document.documentElement.dataset.theme = theme), theme);
          await page.addScriptTag({ path: 'node_modules/axe-core/axe.min.js' });
          const violations = await page.evaluate(async () =>
            (
              await axe.run(document, {
                runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21aa'] },
              })
            ).violations.map((v) => v.id),
          );
          assert.deepEqual(violations, [], `${width}/${theme}`);
        }
        await page.evaluate(() => (document.documentElement.dataset.theme = 'dark'));
      }
      for (const activity of data.activities) await solveActivity(page, activity);
      if (
        [
          'que-es-la-inteligencia-artificial',
          'proyecto-asistente-documental',
          'conceptos-siguientes-y-lcm',
        ].includes(meta.id)
      ) {
        const activity = data.activities.at(-1);
        const section = page.locator(`[data-activity="${activity.id}"]`);
        await section.getByText('Ver mi informe razonado', { exact: true }).click();
        assert.match(await section.locator('[data-case-report]').innerText(), /Justificación/);
        await waitForFiniteAnimations(page);
        await section.screenshot({ path: `coverage/ia/${meta.id}-${width}.png` });
        assert.equal(
          await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth),
          true,
          meta.id + ' sin desbordamiento',
        );
      }
      await answerQuiz(page, data);
      const state = await page.evaluate(() =>
        JSON.parse(localStorage.getItem('teslacode:progress:v2')),
      );
      assert.equal(state.completed.length, index + 1);
      assert.ok(state.completed.includes('ia/' + meta.id));
      await page.reload();
      await page.locator('#qbox').waitFor();
      assert.equal(
        (await page.evaluate(() => JSON.parse(localStorage.getItem('teslacode:progress:v2')))).xp,
        state.xp,
      );
    }
    if (width === 390) {
      await page.setViewportSize({ width: 320, height: 900 });
      await page.goto(`${origin}/#/leccion/ia/proyecto-asistente-documental/practicar`);
      const section = page.locator('[data-activity="proyecto-asistente-documental-transfer"]');
      await section.waitFor();
      const radio = section.getByRole('radio').first();
      await radio.focus();
      await radio.press('Space');
      assert.equal(await radio.isChecked(), true);
      assert.equal(await page.evaluate(() => document.activeElement.type), 'radio');
      await section.locator('h3').evaluate((element) => element.scrollIntoView({ block: 'start' }));
      assert.equal(
        await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth),
        true,
      );
      await page.screenshot({ path: 'coverage/ia/project-viewport-320.png' });
    }
    assert.deepEqual(errors, []);
    assert.ok(
      !requests.some((url) => /api\.(openai|anthropic)|inference\.|pyodide|\.wasm/.test(url)),
      'IA no descarga modelos ni invoca APIs',
    );
    await context.close();
  }
  console.log(
    'PASS: IA desde cero en 1440 y 390 px; 13 lecciones, 52 prácticas, cuestionarios, errores, informes, progreso, dos temas y WCAG automático; lectura y teclado en 320 px.',
  );
});
