import assert from 'node:assert/strict';
import { once } from 'node:events';
import { readFileSync } from 'node:fs';
import { chromium } from 'playwright';
import { indexRoute, isPublished } from '../js/domain/curriculum.js';
import { createDevServer } from '../tools/dev-server.mjs';
import { answerQuiz, learningContext } from './support/browser.mjs';
import { solveActivity } from './support/python.mjs';
import { browserExecutable } from './support/runtime.mjs';

const read = (path) => JSON.parse(readFileSync(path, 'utf8'));
const route = indexRoute(read('content/curriculum/algoritmia.json'));
const lessons = route.lessons.filter(isPublished);
const urlFor = (id) => '/#/leccion/algoritmia/' + id + '/aprender';
const progress = (page) =>
  page.evaluate(() => JSON.parse(localStorage.getItem('teslacode:progress:v2')) ?? {});
const server = createDevServer({
  root: process.cwd(),
  handle: async () => Response.json({ ready: false }),
});
server.listen(0, '127.0.0.1');
await once(server, 'listening');
const origin = `http://127.0.0.1:${server.address().port}`;
let browser;
try {
  browser = await chromium.launch({ executablePath: browserExecutable(), args: ['--no-sandbox'] });
  for (const width of [1440, 390]) {
    const context = await learningContext(browser, {
      viewport: { width, height: 960 },
      reducedMotion: 'reduce',
    });
    const page = await context.newPage();
    const errors = [];
    page.on('pageerror', (error) => errors.push(error.message));
    await page.goto(origin + urlFor('an-casos'));
    await page.getByText('Completa el paso anterior', { exact: true }).waitFor();
    assert.deepEqual((await progress(page)).completed ?? [], []);
    let lastSubmission;
    for (const meta of lessons) {
      const data = read(`content/lessons/algoritmia/${meta.id}.json`);
      await page.goto(origin + urlFor(meta.id));
      await page.locator('#lesson').waitFor();
      assert.equal(await page.locator('h1').innerText(), meta.title);
      if (data.traceGame && data.learningProject.followUpIds) {
        const trace = page.getByRole('region', { name: data.traceGame.title });
        for (const [index, round] of data.traceGame.rounds.entries()) {
          await trace
            .getByRole('button', { name: round.options[round.answer], exact: true })
            .press('Enter');
          await trace
            .getByRole('button', {
              name: index === data.traceGame.rounds.length - 1 ? 'Ver resultado' : 'Siguiente paso',
              exact: true,
            })
            .press('Enter');
        }
        await trace.getByRole('heading', { name: 'Traza completada' }).waitFor();
        assert.ok(!(await progress(page)).completed.includes('algoritmia/' + meta.id));
      }
      if (meta.id === 'an-informe') {
        const example = page.locator('#lesson .code-example').last();
        await example.locator(':scope > summary').click();
        await example.getByRole('button', { name: 'Ejecutar código', exact: true }).click();
        await example.locator('.console-output').getByText('5 5', { exact: true }).waitFor();
      }
      await page.getByRole('tab', { name: /Practicar/ }).click();
      const scope = page.locator('#activities');
      await scope.locator('[data-activity]').first().waitFor();
      for (const [index, activity] of data.activities.entries()) {
        const card = scope.locator(`[data-activity="${activity.id}"]`);
        if (data.learningProject.followUpIds && index === 1) {
          const restore = card.getByRole('button', { name: 'Recuperar entrega anterior' });
          await restore.click();
          assert.equal(await card.locator('.code-editor').inputValue(), lastSubmission);
        }
        if (meta.id === 'an-informe' && index === 3) {
          const followUp = scope.locator(`[data-activity="${data.activities[4].id}"] .code-editor`);
          assert.equal(await followUp.isDisabled(), true);
          await card.locator('.code-editor').fill(activity.starter);
          await card.getByRole('button', { name: 'Comprobar ejercicio' }).click();
          await card.locator('.practice-feedback.bad').waitFor();
          assert.equal(await followUp.isDisabled(), true);
          await card
            .locator('[data-project-journal]')
            .fill(
              'Con cinco celdas cabe el índice. Si el presupuesto baja a cuatro, conservo la consulta directa.',
            );
        }
        await solveActivity(page, activity);
        if (index === 3) {
          lastSubmission = await card.locator('.code-editor').inputValue();
          const artifact = (await progress(page)).projectArtifacts[
            `algoritmia/${meta.id}/${activity.id}`
          ];
          assert.equal(artifact.code, lastSubmission);
        }
      }
      await answerQuiz(page, data);
      assert.ok((await progress(page)).completed.includes('algoritmia/' + meta.id));
    }
    const saved = await progress(page);
    await page.reload();
    await page.locator('#qbox').waitFor();
    const restored = await progress(page);
    assert.deepEqual(
      restored.completed,
      lessons.map((lesson) => 'algoritmia/' + lesson.id),
    );
    assert.equal(restored.xp, saved.xp);
    assert.match(
      restored.projectArtifacts['algoritmia/an-informe/integrar-decision'].notes,
      /presupuesto baja a cuatro/,
    );
    await page.goto(origin + urlFor('ls-arreglo-dinamico'));
    await page.getByText('Contenido en preparación', { exact: true }).waitFor();
    await page.goto(origin + urlFor('an-informe'));
    await page.locator('#lesson').waitFor();
    await page.addScriptTag({ path: 'node_modules/axe-core/axe.min.js' });
    for (const theme of ['dark', 'light']) {
      await page.evaluate((theme) => (document.documentElement.dataset.theme = theme), theme);
      const violations = await page.evaluate(async () =>
        (
          await axe.run(document.querySelector('#lesson'), {
            runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21aa'] },
          })
        ).violations.map((item) => ({
          id: item.id,
          nodes: item.nodes.map((node) => ({
            target: node.target,
            detail: node.failureSummary,
          })),
        })),
      );
      assert.deepEqual(violations, [], `${width}px ${theme}`);
    }
    assert.equal(
      await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1),
      true,
    );
    assert.deepEqual(errors, []);
    await context.close();
    console.log(
      `✓ Tesla Metro a ${width}px. ${lessons.length} lecciones, secuencia, consola, entregas y bitácora.`,
    );
  }
} finally {
  await browser?.close();
  server.closeAllConnections();
  await new Promise((resolve) => server.close(resolve));
}
