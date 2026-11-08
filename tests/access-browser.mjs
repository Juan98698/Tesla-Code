import { installPythonRuntime, solveActivity } from './support/python.mjs';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { withBrowser, answerQuiz } from './support/browser.mjs';
const read = (p) => JSON.parse(readFileSync(p, 'utf8'));
const routes = read('content/curriculum/index.json').routes.map((id) =>
  read(`content/curriculum/${id}.json`),
);
const entry = (r) =>
  r.levels.flatMap((level) => level.lessons).find((m) => m.status === 'published');
const snapshot = (page) =>
  page.evaluate(() => JSON.parse(localStorage.getItem('teslacode:progress:v2')));
async function audit(page, label) {
  await page.addScriptTag({ path: 'node_modules/axe-core/axe.min.js' });
  const violations = await page.evaluate(async () =>
    (
      await axe.run(document, {
        runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21aa'] },
      })
    ).violations.map((v) => ({ id: v.id, nodes: v.nodes.map((n) => n.target) })),
  );
  assert.deepEqual(violations, [], label);
}
await withBrowser(4320, async (browser, origin) => {
  for (const width of [1440, 390]) {
    const context = await browser.newContext({
      viewport: { width, height: 1000 },
      reducedMotion: 'reduce',
    });
    await installPythonRuntime(context);
    const page = await context.newPage(),
      errors = [];
    page.on('pageerror', (e) => errors.push(e.message));
    await page.goto(origin + '/#/inicio');
    await page.locator('.hero').waitFor();
    assert.equal(await page.locator('.hero-art').isVisible(), true);
    assert.equal(await page.locator('html').getAttribute('data-theme'), 'dark');
    assert.equal(
      await page.locator('.holo-computer').evaluate((el) => getComputedStyle(el).animationName),
      'none',
    );
    assert.ok(
      await page.locator('.brand img').evaluate((el) => el.complete && el.naturalWidth > 0),
    );
    assert.equal(await page.locator('#studio-route-select option').count(), routes.length);
    for (const route of routes) {
      await page.locator('#studio-route-select').selectOption(route.id);
      await page.locator(`[data-studio-route="${route.id}"]`).waitFor();
      await page.locator('#studio-form button').click();
      assert.ok((await page.locator('#studio-status').innerText()).length > 5);
    }
    const studioState = await snapshot(page);
    assert.deepEqual(studioState.completed, []);
    assert.equal(studioState.xp, 0);
    for (const theme of ['dark', 'light']) {
      await page.evaluate((value) => (document.documentElement.dataset.theme = value), theme);
      await audit(page, `${width}: workbench ${theme}`);
    }
    await page.evaluate(() => (document.documentElement.dataset.theme = 'dark'));
    await page.screenshot({ path: `/tmp/teslacode-final-${width}.png`, fullPage: true });
    await page.locator('#motion-toggle').click(); // Optional opt-in cannot override reduced motion.
    assert.equal(
      await page.locator('.holo-computer').evaluate((el) => getComputedStyle(el).animationName),
      'none',
    );
    await page.locator('#motion-toggle').click();
    await page.reload();
    await page.locator('#motion-toggle').waitFor();
    assert.equal(await page.locator('html').getAttribute('data-motion'), 'off');
    for (const route of routes) {
      const first = entry(route);
      await page.goto(`${origin}/#/leccion/${route.id}/${first.id}/aprender`);
      await page.locator('#lesson').waitFor();
      assert.equal(await page.locator('h1').innerText(), first.title);
      assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
    }
    let state = await snapshot(page);
    assert.deepEqual(state.completed, []);
    assert.equal(state.xp, 0);
    const algo = routes.find((r) => r.id === 'algoritmia');
    const algorithmLessons = algo.levels
      .flatMap((level) => level.lessons)
      .filter((lesson) => lesson.status === 'published');
    const completeAlgorithmLesson = async (meta) => {
      const data = read('content/lessons/algoritmia/' + meta.id + '.json');
      await page.getByRole('tab', { name: /Practicar/ }).click();
      await page.locator('#activities [data-activity]').first().waitFor();
      for (const activity of data.activities) {
        const section = page.locator('#activities [data-activity="' + activity.id + '"]');
        await solveActivity(page, activity);
      }
      await answerQuiz(page, data);
      const state = await snapshot(page);
      assert.ok(state.completed.includes('algoritmia/' + meta.id));
    };
    for (const meta of algorithmLessons.slice(0, 4)) {
      await page.goto(origin + '/#/leccion/algoritmia/' + meta.id + '/aprender');
      await page.locator('#lesson').waitFor();
      assert.equal(
        await page.locator('pre[data-language="python"], pre[data-language="shell"]').count(),
        0,
      );
      assert.equal(await page.locator('.worked-example').count(), 1);
      assert.equal(await page.locator('.learning-support').count(), 0);
      if (meta.id === entry(algo).id)
        await page.screenshot({ path: '/tmp/teslacode-algoritmia-intro-' + width + '.png' });
      await completeAlgorithmLesson(meta);
    }
    const earnedIntro = await snapshot(page);
    await page.goto(`${origin}/#/leccion/algoritmia/implementar-algoritmos-en-python/aprender`);
    await page.locator('#lesson').waitFor();
    await page.locator('.learning-support > summary').click();
    await page.locator('.concept-refresher > summary').first().click();
    const refresher = page.locator('[data-refresher]').first();
    const cid = await refresher.getAttribute('data-refresher');
    const c = read('content/concepts.json').concepts.find((c) => c.id === cid);
    await refresher.locator('input').fill(c.refresher.activity.answers[0]);
    await refresher.locator('button[type=submit]').click();
    assert.match(await refresher.locator('[role=status]').innerText(), /resolviste/);
    state = await snapshot(page);
    assert.deepEqual(state.completed, earnedIntro.completed);
    assert.equal(state.xp, earnedIntro.xp);
    assert.deepEqual(state.practices, earnedIntro.practices);
    for (const theme of ['dark', 'light']) {
      await page.evaluate((t) => (document.documentElement.dataset.theme = t), theme);
      await audit(page, `${width}: refresher ${theme}`);
    }
    await page.goto(origin + '/#/leccion/frontend/http-y-https/aprender');
    await page.getByText('Completa el paso anterior', { exact: true }).waitFor();
    assert.equal(await page.locator('#lesson').count(), 0);
    await page.goto(origin + '/#/leccion/frontend/html-semantico/aprender');
    await page.getByText('Contenido en preparación', { exact: true }).waitFor();
    assert.equal(await page.locator('#lesson').count(), 0);
    await page.goto(origin + '/#/ruta/backend');
    await page.locator('#route-orientation').waitFor();
    await page.locator('#route-orientation > summary').click();
    await page.locator('.orientation-form').waitFor();
    const backend = routes.find((r) => r.id === 'backend'),
      first = entry(backend),
      data = read(`content/lessons/backend/${first.id}.json`);
    const questions = data.quiz.filter((q) => q.type === 'choice').slice(0, 3);
    for (let i = 0; i < questions.length; i++)
      await page
        .locator('.orientation-form fieldset')
        .nth(i)
        .locator(`input[value="${questions[i].answer}"]`)
        .check();
    await page.locator('.orientation-form button').click();
    for (const theme of ['dark', 'light']) {
      await page.evaluate((t) => (document.documentElement.dataset.theme = t), theme);
      await audit(page, `${width}: orientation ${theme}`);
    }
    state = await snapshot(page);
    assert.deepEqual(state.completed, earnedIntro.completed);
    assert.equal(state.xp, earnedIntro.xp);
    await page.getByRole('button', { name: 'Comenzar con esta guía →', exact: true }).click();
    await page.locator('#activities').waitFor();
    assert.match(page.url(), /practicar$/);
    state = await snapshot(page);
    assert.equal(state.learningMode, 'experienced');
    assert.deepEqual(state.completed, earnedIntro.completed);
    assert.equal(state.xp, earnedIntro.xp);
    await page.goto(origin + '/#/leccion/backend/http-en-profundidad/aprender');
    await page.getByText('Completa el paso anterior', { exact: true }).waitFor();
    await page.goto(`${origin}/#/leccion/backend/${first.id}/practicar`);
    await page.locator('#activities').waitFor();
    for (const activity of data.activities) {
      const section = page.locator(`#activities [data-activity="${activity.id}"]`);
      await section.locator('input').fill(activity.answers[0]);
      await section.locator('button[type=submit]').click();
    }
    await answerQuiz(page, data);
    state = await snapshot(page);
    assert.deepEqual(state.completed, [...earnedIntro.completed, `backend/${first.id}`]);
    assert.ok(state.xp > earnedIntro.xp);
    await page.getByRole('button', { name: 'Mi siguiente paso →', exact: true }).click();
    await page.locator('#lesson').waitFor();
    assert.match(await page.locator('h1').innerText(), /HTTP/);
    await page.goto(origin + '/#/leccion/fundamentos/editor-y-ejecucion/aprender');
    await page.getByText('Completa el paso anterior', { exact: true }).waitFor();
    for (const meta of algorithmLessons.slice(4)) {
      await page.goto(origin + '/#/leccion/algoritmia/' + meta.id + '/aprender');
      await page.locator('#lesson').waitFor();
      await completeAlgorithmLesson(meta);
    }
    await page.reload();
    await page.locator('#qbox').waitFor();
    const finished = await snapshot(page);
    assert.equal(
      finished.completed.filter((key) => key.startsWith('algoritmia/')).length,
      algorithmLessons.length,
    );
    assert.equal(
      await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth),
      true,
    );
    assert.deepEqual(errors, []);
    console.log(
      `PASS acceso ${width}px: entradas libres, secuencia interna, diagnóstico opcional, repasos sin créditos, modo con experiencia, progreso real y movimiento reducido.`,
    );
    await context.close();
  }
  console.log(
    'PASS: 12 auditorías WCAG adicionales en laboratorio, orientación y repasos, escritorio/móvil, ambos temas.',
  );
});
