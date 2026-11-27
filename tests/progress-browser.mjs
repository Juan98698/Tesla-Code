import { learningContext } from './support/browser.mjs';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { withBrowser, answerQuiz } from './support/browser.mjs';
import { emptyProgress } from '../js/core/storage.js';

const key = 'teslacode:progress:v2';
const read = (path) => JSON.parse(readFileSync(path, 'utf8'));
async function solve(page, origin, route, id) {
  const data = read(`content/lessons/${route}/${id}.json`);
  await page.goto(`${origin}/#/leccion/${route}/${id}/aprender`);
  await page.getByRole('tab', { name: /Practicar/ }).click();
  for (const activity of data.activities) {
    const section = page.locator(`[data-activity="${activity.id}"]`);
    await section.locator('input').fill(activity.answers[0]);
    await section.locator('button[type=submit]').click();
    await section.locator('.practice-feedback').waitFor({ state: 'visible' });
    assert.equal(
      await section.locator('.practice-feedback').getAttribute('class'),
      'practice-feedback ok',
      `${route}/${id}/${activity.id}: respuesta ${await section.locator('input').inputValue()}`,
    );
    await page.waitForFunction(
      ({ key, practice }) =>
        JSON.parse(localStorage.getItem(key) || '{}').practices?.includes(practice),
      { key, practice: `${route}/${id}/${activity.id}` },
    );
  }
  await answerQuiz(page, data);
  try {
    await page.waitForFunction(
      ({ key, lesson }) => JSON.parse(localStorage.getItem(key)).completed.includes(lesson),
      { key, lesson: `${route}/${id}` },
    );
  } catch (error) {
    console.error(
      `${route}/${id}`,
      await page.evaluate(
        (key) => ({
          state: JSON.parse(localStorage.getItem(key)),
          result: document.querySelector('#qbox')?.textContent,
          feedback: [...document.querySelectorAll('.practice-feedback')].map(
            (el) => el.textContent,
          ),
        }),
        key,
      ),
    );
    throw error;
  }
  return data.quiz.length * 10 + 50;
}

await withBrowser(4324, async (browser, origin) => {
  const context = await learningContext(browser);
  const [a, b, stale] = await Promise.all([
    context.newPage(),
    context.newPage(),
    context.newPage(),
  ]);
  for (const page of [a, b, stale]) {
    await page.goto(origin);
    await page.locator('.hero').waitFor();
  }
  const xp = await Promise.all([
    solve(a, origin, 'fundamentos', 'tu-primer-paso'),
    solve(b, origin, 'frontend', 'como-funciona-internet'),
  ]);
  await stale.locator('#studio-route-select').selectOption('python');
  await stale.waitForFunction(
    (key) => JSON.parse(localStorage.getItem(key)).goal === 'python',
    key,
  );
  const saved = await stale.evaluate((key) => JSON.parse(localStorage.getItem(key)), key);
  assert.deepEqual(saved.completed.toSorted(), [
    'frontend/como-funciona-internet',
    'fundamentos/tu-primer-paso',
  ]);
  assert.equal(saved.xp, xp[0] + xp[1]);
  assert.equal(new Set(saved.rewards).size, saved.rewards.length);
  await a.reload();
  await a.locator('#qbox').waitFor();
  await answerQuiz(a, read('content/lessons/fundamentos/tu-primer-paso.json'));
  assert.equal(
    (await a.evaluate((key) => JSON.parse(localStorage.getItem(key)), key)).xp,
    saved.xp,
  );
  await context.close();
  console.log(
    'PASS: dos pestañas aprenden en paralelo, una tercera conserva ambos avances y repetir la comprobación no duplica XP.',
  );
  for (const width of [1440, 390]) {
    const tabs = await learningContext(browser, {
      viewport: { width, height: 900 },
      reducedMotion: 'reduce',
    });
    const first = await tabs.newPage();
    await first.goto(origin);
    await first.locator('.hero').waitFor();
    const second = await tabs.newPage();
    await second.goto(origin + '/#/leccion/fundamentos/tu-primer-paso/aprender');
    await second.locator('#lesson').waitFor();
    const article = second.locator('#lesson');
    const handle = await article.elementHandle();
    const active = await tabs.newPage();
    await active.goto(origin + '/#/leccion/fundamentos/tu-primer-paso/aprender');
    await active.locator('#lesson').waitFor();
    await first.evaluate((key) => {
      window.progressEvents = 0;
      addEventListener('storage', (event) => {
        if (event.key === key) window.progressEvents++;
      });
    }, key);
    await second.locator('#bookmark').click();
    await second.waitForFunction(
      (key) => JSON.parse(localStorage.getItem(key)).bookmarks.length === 1,
      key,
    );
    await first.waitForFunction(() => window.progressEvents >= 1);
    await active.locator('#bookmark[aria-pressed="true"]').waitFor();
    await second.locator('#bookmark').click();
    await second.waitForFunction(
      (key) => JSON.parse(localStorage.getItem(key)).bookmarks.length === 0,
      key,
    );
    await first.waitForFunction(() => window.progressEvents >= 2);
    await active.locator('#bookmark[aria-pressed="false"]').waitFor();
    await first.locator('#studio-route-select').selectOption('python');
    await first.waitForFunction(
      (key) => JSON.parse(localStorage.getItem(key)).goal === 'python',
      key,
    );
    assert.deepEqual(
      await first.evaluate((key) => JSON.parse(localStorage.getItem(key)).bookmarks, key),
      [],
    );
    assert.equal(
      await handle.evaluate((el) => el === document.querySelector('#lesson')),
      true,
      'No se desmonta la lección activa',
    );
    await second.goto(origin + '/#/progreso');
    const incoming = emptyProgress();
    incoming.completed = ['frontend/como-funciona-internet'];
    incoming.xp = 50;
    await second.locator('#progress-file').setInputFiles({
      name: 'copia.json',
      mimeType: 'application/json',
      buffer: Buffer.from(JSON.stringify(incoming)),
    });
    await second.waitForFunction(() => !document.querySelector('#confirm-import').disabled);
    await second.locator('#confirm-import').click();
    await second.locator('#undo-import').waitFor();
    await first.waitForFunction(() => document.querySelector('#xp').textContent === '50 XP');
    await second.locator('#undo-import').click();
    await second.waitForFunction(
      (key) => JSON.parse(localStorage.getItem(key)).completed.length === 0,
      key,
    );
    await first.waitForFunction(() => document.querySelector('#xp').textContent === '0 XP');
    await first.locator('#studio-route-select').selectOption('backend');
    await first.waitForFunction(
      (key) => JSON.parse(localStorage.getItem(key)).goal === 'backend',
      key,
    );
    const restored = await first.evaluate((key) => JSON.parse(localStorage.getItem(key)), key);
    assert.equal(restored.xp, 0);
    assert.deepEqual(restored.completed, []);
    assert.deepEqual(restored.bookmarks, []);
    assert.equal(restored.recent, null);
    await first.reload();
    await first.locator('.hero').waitFor();
    assert.equal(await first.locator('#xp').innerText(), '0 XP');
    await tabs.close();
    console.log(
      `PASS sincronización ${width}px: favoritos retirados, importación/deshacer, XP y preferencias; lección activa y recarga conservadas.`,
    );
  }
});
