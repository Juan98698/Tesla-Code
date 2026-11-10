import { learningContext } from './support/browser.mjs';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { withBrowser, answerQuiz } from './support/browser.mjs';

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
});
