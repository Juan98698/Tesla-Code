import { learningContext } from './support/browser.mjs';
import { installPythonRuntime, solveActivity } from './support/python.mjs';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { withBrowser } from './support/browser.mjs';
const read = (path) => JSON.parse(readFileSync(path, 'utf8'));
const routes = read('content/curriculum/index.json').routes.map((id) =>
  read(`content/curriculum/${id}.json`),
);
const published = routes.flatMap((r) =>
  r.levels.flatMap((lv) =>
    lv.lessons
      .filter((l) => l.status === 'published')
      .map((l) => ({ route: r, meta: l, data: read(`content/lessons/${r.id}/${l.id}.json`) })),
  ),
);
await withBrowser(4317, async (browser, origin) => {
  const context = await learningContext(browser, { reducedMotion: 'reduce' });
  await installPythonRuntime(context, origin);
  const page = await context.newPage(),
    errors = [];
  page.on('pageerror', (error) => errors.push(error.message));
  context.on('requestfailed', (request) => {
    if (request.url().includes('/pyodide/'))
      console.error(
        'Runtime Python:',
        new URL(request.url()).pathname,
        request.failure()?.errorText,
      );
  });
  page.on('response', (response) => {
    if (response.status() >= 400) errors.push(`${response.status()} ${response.url()}`);
  });
  await page.goto(origin);
  await page.locator('.hero').waitFor();
  assert.equal(await page.locator('.route-card').count(), 3);
  assert.equal(await page.locator('#studio-route-select option').count(), routes.length);
  await page.getByRole('link', { name: /Empieza tu primera lección/ }).click();
  await page.locator('#lesson').waitFor();
  assert.match(await page.locator('h1').innerText(), /primera línea/);
  await page.goto(origin + '/#/leccion/fundamentos/tu-primer-paso/aprender');
  await page.locator('#lesson').waitFor();
  await page.getByRole('tab', { name: /Practicar/ }).click();
  const initialActivity = page.locator('[data-activity]').first();
  await initialActivity.waitFor();
  await initialActivity.locator('input').fill('.json');
  await initialActivity.locator('button[type=submit]').click();
  assert.match(await page.locator('.practice-feedback').first().innerText(), /Todavía/);
  await initialActivity.getByRole('button', { name: 'Necesito una pista' }).click();
  assert.equal(await initialActivity.locator('.hint').isVisible(), true);
  await initialActivity.locator('input').fill('.txt');
  await initialActivity.locator('button[type=submit]').click();
  assert.match(await page.locator('.practice-feedback').first().innerText(), /resolviste/);
  const first = published.find((p) => p.meta.id === 'tu-primer-paso');
  for (const activity of first.data.activities.slice(1)) await solveActivity(page, activity);
  async function solveQuiz(data) {
    await page.getByRole('tab', { name: /Comprobar/ }).click();
    await page.locator('#qbox h3.q').waitFor();
    for (let i = 0; i < data.quiz.length; i++) {
      const questionId = await page.locator('#qbox').getAttribute('data-question-id'),
        prompt = await page.locator('#qbox h3.q').innerText(),
        q = data.quiz.find((q) => q.id === questionId);
      assert.ok(q, `question exists: ${prompt}`);
      if (q.type === 'choice')
        await page
          .locator('#qbox')
          .getByRole('button', { name: q.options[q.answer], exact: true })
          .click();
      if (q.type === 'text') {
        await page.locator('#qbox input').fill(q.answers[0]);
        await page.locator('#qbox button[type=submit]').click();
      }
      if (q.type === 'order') {
        for (const step of q.steps)
          await page.locator('#qbox').getByRole('button', { name: step, exact: true }).click();
        await page.getByRole('button', { name: 'Comprobar orden', exact: true }).click();
      }
      await page.locator('#qbox .fb button').click();
    }
    assert.equal(await page.locator('.result-orbit').innerText(), '100\n%');
  }
  await solveQuiz(first.data);
  let state = await page.evaluate(() => JSON.parse(localStorage.getItem('teslacode:progress:v2')));
  assert.ok(state.completed.includes('fundamentos/tu-primer-paso'));
  const xp = state.xp;
  await page.getByRole('button', { name: 'Volver a practicar', exact: true }).click();
  // Re-entering rerenders a fresh deck and cannot award the same question twice.
  await page.goto(origin + '/#/leccion/fundamentos/tu-primer-paso/aprender');
  await page.locator('#lesson').waitFor();
  await solveQuiz(first.data);
  state = await page.evaluate(() => JSON.parse(localStorage.getItem('teslacode:progress:v2')));
  assert.equal(state.xp, xp);
  await page.reload();
  await page.locator('.lesson-tabs').waitFor();
  assert.equal(await page.locator('#xp').innerText(), `${xp} XP`);
  await page.locator('#bookmark').click();
  assert.equal(await page.locator('#bookmark').getAttribute('aria-pressed'), 'true');
  await page.goto(origin + '/#/ruta/frontend');
  await page.locator('.map-node').first().waitFor();
  assert.equal(await page.locator('#qbox').count(), 0);
  assert.equal(await page.locator('#lesson').count(), 0);
  assert.match(await page.locator('#node-inspector').innerText(), /Lista para aprender/);
  await page
    .locator('details.level')
    .filter({ has: page.locator('[data-node="css-moderno"]') })
    .locator(':scope > summary')
    .click();
  await page.locator('[data-node="css-moderno"]').click();
  assert.match(await page.locator('#node-inspector').innerText(), /preparación/);
  await page.goto(origin + '/#/leccion/frontend/como-funciona-internet/aprender');
  await page.locator('#lesson').waitFor();
  assert.match(await page.locator('h1').innerText(), /internet/);
  await page.goto(origin + '/#/leccion/frontend/http-y-https/aprender');
  await page.getByText('Completa el paso anterior', { exact: true }).waitFor();
  assert.equal(await page.locator('#lesson').count(), 0);
  await page.locator('#search').fill('difusión');
  await page.locator('#search-results a').first().waitFor();
  assert.match(await page.locator('#search-results').innerText(), /Difusión/);
  await page.keyboard.press('Escape');
  assert.equal(await page.locator('#search-results').isHidden(), true);
  await page.goto(origin + '/#/practica');
  await page.locator('[data-id="acumulador-suma"] [data-open]').click();
  await page.locator('[data-step]').waitFor();
  await page.locator('[data-step]').click();
  assert.match(await page.locator('[data-vars]').innerText(), /suma/);
  await page.locator('[data-id="condicion-limite"] [data-open]').click();
  await page.locator('[data-id="condicion-limite"] [data-step]').waitFor();
  await page.locator('[data-id="condicion-limite"] [data-step]').click();
  assert.match(await page.locator('[data-id="condicion-limite"] [data-vars]').innerText(), /edad/);
  await page.locator('[data-text]').fill('<img src=x>');
  assert.equal(await page.locator('[data-tokens] img').count(), 0);
  await page.locator('[data-signal]').fill('100');
  assert.match(await page.locator('[data-caption]').innerText(), /Señal: 100%/);
  await page.goto(origin + '/#/progreso');
  await page.locator('#export-progress').waitFor();
  const downloadPromise = page.waitForEvent('download');
  await page.locator('#export-progress').click();
  assert.equal((await downloadPromise).suggestedFilename(), 'teslacode-progreso.json');
  console.log(
    'PASS: flujo real desde cero, práctica incorrecta/correcta, quiz, persistencia, XP limitado, entrada libre y secuencia interna, búsqueda, simulaciones y exportación.',
  );
  // Fixture explícita para revisar TODOS los contenidos, sin confundirlo con completar sus cursos.
  await page.evaluate(
    (keys) => {
      localStorage.setItem(
        'teslacode:progress:v2',
        JSON.stringify({ version: 2, completed: keys }),
      );
    },
    published.map((p) => `${p.route.id}/${p.meta.id}`),
  );
  await page.reload();
  for (const { route: r, meta, data } of published) {
    await page.goto(`${origin}/#/leccion/${r.id}/${meta.id}/aprender`);
    await page.locator('#lesson').waitFor();
    assert.ok((await page.locator('#lesson').innerText()).length > 100, meta.id);
    await page.getByRole('tab', { name: /Practicar/ }).click();
    await page.locator('#activities [data-activity]').first().waitFor();
    for (const a of data.activities) {
      const section = page.locator(`[data-activity="${a.id}"]`);
      await solveActivity(page, a);
      assert.match(await section.locator('.practice-feedback').innerText(), /resolviste/);
    }
    if (meta.id === 'variables') {
      await page.locator('.runner textarea').fill('a = 4\na = a + 3\nmostrar(a)');
      await page.locator('.runner button').click();
      assert.match(await page.locator('.runner [data-output]').innerText(), /Salida:\n7/);
    }
  }
  // Respuestas abiertas y ordenación también se verifican en el quiz, con barajado real.
  for (const id of ['operadores-y-expresiones', 'conceptos-siguientes-y-lcm']) {
    const item = published.find((p) => p.meta.id === id);
    await page.goto(`${origin}/#/leccion/${item.route.id}/${id}/aprender`);
    await page.locator('#lesson').waitFor();
    await solveQuiz(item.data);
  }
  assert.deepEqual(errors, []);
  console.log(
    `PASS: ${published.length} lecciones renderizadas y sus ${published.reduce((n, p) => n + p.data.activities.length, 0)} actividades resueltas; sin errores de módulos o HTTP.`,
  );
  // Límite y validación del juego: datos inválidos no consumen intentos.
  await page.goto(origin + '/#/leccion/fundamentos/proyecto-adivina-el-numero/aprender');
  await page.locator('#jn').waitFor();
  await page.locator('#jn').fill('1.5');
  await page.locator('#jb').click();
  assert.match(await page.locator('#jf').innerText(), /No se ha contado/);
  // Cada reinicio usa una semilla controlada dentro de este contexto de prueba.
  await page.evaluate(() => {
    Math.random = () => 0.99;
  });
  await page.locator('#jr').click();
  for (let i = 0; i < 7; i++) {
    await page.locator('#jn').fill('1');
    await page.locator('#jb').click();
  }
  assert.equal(await page.locator('#jb').isDisabled(), true);
  assert.match(await page.locator('#jf').innerText(), /Era 100/);
  // Regresión de navegación asíncrona: una carga lenta no puede reemplazar otra vista.
  await page.route('**/content/lessons/ia/llm-tokens-y-contexto.json?*', async (route) => {
    await new Promise((resolve) => setTimeout(resolve, 150));
    await route.continue();
  });
  await page.goto(origin + '/#/leccion/ia/llm-tokens-y-contexto/aprender');
  await page.getByRole('link', { name: /Mi aprendizaje/ }).click();
  await page.locator('.hero').waitFor();
  await page.waitForTimeout(250);
  assert.equal(await page.locator('#lesson').count(), 0);
  for (const width of [320, 390, 768, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    for (const hash of [
      'inicio',
      'ruta/fundamentos',
      'leccion/fundamentos/variables/aprender',
      'practica',
      'progreso',
    ]) {
      await page.goto(`${origin}/#/${hash}`);
      await page.locator('.page').waitFor();
      await page.waitForTimeout(30);
      assert.ok(
        await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth),
        `no horizontal overflow at ${width}: ${hash}`,
      );
    }
  }
  await page.evaluate(() => {
    localStorage.setItem('teslacode:theme', 'light');
  });
  await page.reload();
  await page.locator('.page').waitFor();
  await page.locator('#theme-toggle').click();
  assert.equal(await page.locator('html').getAttribute('data-theme'), 'dark');
  await page.reload();
  await page.locator('.page').waitFor();
  assert.equal(await page.locator('html').getAttribute('data-theme'), 'dark');
  console.log(
    'PASS: siete intentos, navegación asíncrona, tema persistente y 20 combinaciones de vista/tamaño sin desbordamiento.',
  );
  // WCAG automatizado en vistas representativas y ambos temas, sin desactivar reglas.
  const accessibilityViews = [
    'inicio',
    'rutas',
    'ruta/fundamentos',
    'leccion/fundamentos/tu-primer-paso/aprender',
    'leccion/fundamentos/tu-primer-paso/practicar',
    'leccion/fundamentos/tu-primer-paso/comprobar',
    'practica',
    'progreso',
  ];
  for (const theme of ['light', 'dark']) {
    await page.evaluate((theme) => localStorage.setItem('teslacode:theme', theme), theme);
    for (const hash of accessibilityViews) {
      await page.goto(`${origin}/#/${hash}`);
      await page.reload();
      await page.locator('.page').waitFor();
      if (hash === 'practica') {
        await page.locator('[data-id="acumulador-suma"] [data-open]').click();
        await page.locator('[data-step]').waitFor();
      }
      await page.addScriptTag({ path: 'node_modules/axe-core/axe.min.js' });
      const violations = await page.evaluate(async () => {
        const result = await axe.run(document, {
          runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21aa'] },
        });
        return result.violations.map((v) => ({
          id: v.id,
          impact: v.impact,
          nodes: v.nodes.map((n) => n.target),
        }));
      });
      assert.deepEqual(violations, [], `WCAG ${theme}: ${hash}`);
    }
  }
  console.log(
    'PASS: 16 auditorías automatizadas WCAG A/AA sin infracciones detectadas. No sustituyen pruebas de accesibilidad con personas.',
  );
  // Una sesión sin acceso a localStorage sigue siendo utilizable.
  const blocked = await learningContext(browser);
  await blocked.addInitScript(() => {
    Storage.prototype.getItem = () => {
      throw Error('blocked');
    };
    Storage.prototype.setItem = () => {
      throw Error('blocked');
    };
  });
  const bpage = await blocked.newPage();
  await bpage.goto(origin);
  await bpage.locator('.hero').waitFor();
  await blocked.close();
  console.log('PASS: almacenamiento bloqueado conserva la aplicación operativa.');
});
