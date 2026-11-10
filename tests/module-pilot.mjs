import { learningContext } from './support/browser.mjs';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { withBrowser, answerQuiz } from './support/browser.mjs';
const read = (path) => JSON.parse(readFileSync(path, 'utf8'));
const route = read('content/curriculum/fundamentos.json');
const module = route.levels
  .filter((level) => ['primeros-pasos', 'inicio'].includes(level.id))
  .flatMap((level) => level.lessons);
await withBrowser(4318, async (browser, origin) => {
  for (const width of [1440, 390]) {
    const context = await learningContext(browser, {
      viewport: { width, height: 900 },
      reducedMotion: 'reduce',
    });
    const page = await context.newPage(),
      errors = [];
    page.on('pageerror', (error) => errors.push(error.message));
    await page.goto(origin);
    await page.getByRole('link', { name: /Empieza tu primera lección/ }).click();
    await page.locator('#lesson').waitFor();
    assert.match(await page.locator('h1').innerText(), /primera línea/);
    await page.goto(origin + '/#/leccion/fundamentos/' + module[0].id + '/aprender');
    for (let index = 0; index < module.length; index++) {
      const meta = module[index],
        data = read(`content/lessons/fundamentos/${meta.id}.json`);
      await page.locator('#lesson').waitFor();
      assert.equal(await page.locator('h1').innerText(), meta.title);
      const next = module[index + 1];
      if (index === 0) {
        await page.goto(`${origin}/#/leccion/fundamentos/${next.id}/aprender`);
        await page.getByText('Completa el paso anterior', { exact: true }).waitFor();
        assert.equal(await page.locator('#lesson').count(), 0);
        await page.goto(`${origin}/#/leccion/fundamentos/${meta.id}/aprender`);
        await page.locator('#lesson').waitFor();
      }
      if (meta.id === 'variables') {
        for (let i = 0; i < 3; i++) await page.locator('#step').click();
        assert.equal(await page.locator('#out').innerText(), 'Salida: 21');
      }
      if (meta.id === 'mini-proyecto-calculadora-de-propinas') {
        await page.locator('#pb').click();
        assert.match(await page.locator('#po').innerText(), /Cada persona: 22.00/);
      }
      await page.getByRole('tab', { name: /Practicar/ }).click();
      await page.locator('[data-activity]').first().waitFor();
      for (const activity of data.activities) {
        const section = page.locator(`[data-activity="${activity.id}"]`);
        if (index === 0) {
          await section.locator('input').fill('incorrecta');
          await section.locator('button[type=submit]').click();
          assert.match(await section.locator('[role=status]').innerText(), /Todavía/);
          await section.locator('[data-hint]').click();
          assert.equal(await section.locator('.hint').isVisible(), true);
        }
        await section.locator('input').fill(activity.answers[0]);
        await section.locator('button[type=submit]').click();
        assert.match(await section.locator('[role=status]').innerText(), /resolviste/);
      }
      if (index === 0) {
        await answerQuiz(page, data, false);
        assert.match(await page.locator('.result-orbit').innerText(), /^0/);
        const snapshot = await page.evaluate(() =>
          JSON.parse(localStorage.getItem('teslacode:progress:v2')),
        );
        assert.equal(snapshot.completed.length, 0);
        await page.goto(`${origin}/#/leccion/fundamentos/${meta.id}/aprender`);
        await page.locator('#lesson').waitFor();
      }
      await answerQuiz(page, data);
      assert.match(await page.locator('.result-orbit').innerText(), /^100/);
      await page.reload();
      await page.locator('.lesson-tabs').waitFor();
      const state = await page.evaluate(() =>
        JSON.parse(localStorage.getItem('teslacode:progress:v2')),
      );
      assert.equal(state.completed.length, index + 1);
      assert.ok(state.completed.includes(`fundamentos/${meta.id}`));
      assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
      // Se avanza desde la interfaz y sin inyectar finalizaciones en el almacenamiento.
      await page.goto(`${origin}/#/leccion/fundamentos/${meta.id}/aprender`);
      await page.locator('#lesson').waitFor();
      await answerQuiz(page, data);
      assert.equal(
        (await page.evaluate(() => JSON.parse(localStorage.getItem('teslacode:progress:v2')))).xp,
        state.xp,
      );
      await page.getByRole('button', { name: 'Mi siguiente paso →', exact: true }).click();
      if ((index + 1) % 5 === 0)
        console.log(`Piloto ${width}px: ${index + 1}/${module.length} pasos verificados.`);
    }
    await page.locator('#lesson').waitFor();
    assert.equal(await page.locator('h1').innerText(), 'Condicionales');
    assert.deepEqual(errors, []);
    console.log(
      `PASS piloto ${width}px: ${module.length} lecciones consecutivas, error/recuperación, persistencia, simuladores y recompensas sin repetición.`,
    );
    await context.close();
  }
});
