import { spawn } from 'node:child_process';
import { existsSync } from 'node:fs';
import { chromium } from 'playwright';
export async function withBrowser(port, run) {
  const origin = `http://127.0.0.1:${port}`;
  const server = spawn(
    process.execPath,
    [
      'node_modules/serve/build/main.js',
      '.',
      '--listen',
      `tcp://127.0.0.1:${port}`,
      '--no-clipboard',
      '--no-port-switching',
    ],
    { env: { ...process.env, NO_UPDATE_CHECK: '1' }, stdio: ['ignore', 'pipe', 'pipe'] },
  );
  let logs = '',
    browser;
  server.stdout.on('data', (chunk) => {
    logs += chunk;
  });
  server.stderr.on('data', (chunk) => {
    logs += chunk;
  });
  try {
    let ready = false;
    for (let i = 0; i < 80; i++) {
      if (server.exitCode !== null) throw Error(logs);
      try {
        if ((await fetch(origin)).ok) {
          ready = true;
          break;
        }
      } catch {}
      await new Promise((resolve) => setTimeout(resolve, 100));
    }
    if (!ready) throw Error(`El servidor de prueba no inició: ${logs}`);
    browser = await chromium.launch({
      executablePath:
        process.env.CHROMIUM_PATH ||
        (existsSync('/usr/bin/chromium') ? '/usr/bin/chromium' : chromium.executablePath()),
      args: ['--no-sandbox'],
    });
    return await run(browser, origin);
  } finally {
    await browser?.close();
    server.kill('SIGTERM');
  }
}
export async function answerQuiz(page, data, correct = true) {
  await page.getByRole('tab', { name: /Comprobar/ }).click();
  await page.locator('#qbox h3.q').waitFor();
  for (let i = 0; i < data.quiz.length; i++) {
    const prompt = await page.locator('#qbox h3.q').innerText();
    const id = await page.locator('#qbox').getAttribute('data-question-id');
    const q = data.quiz.find((question) => question.id === id);
    if (!q) throw Error(`Pregunta no reconocida: ${prompt}`);
    if (q.type === 'choice')
      await page
        .locator('#qbox')
        .getByRole('button', {
          name: q.options[correct ? q.answer : (q.answer + 1) % q.options.length],
          exact: true,
        })
        .click();
    if (q.type === 'text') {
      await page.locator('#qbox input').fill(correct ? q.answers[0] : 'respuesta errónea');
      await page.locator('#qbox button[type=submit]').click();
    }
    if (q.type === 'order') {
      for (const step of correct ? q.steps : [...q.steps].reverse())
        await page.locator('#qbox').getByRole('button', { name: step, exact: true }).click();
      await page.getByRole('button', { name: 'Comprobar orden', exact: true }).click();
    }
    await page.locator('#qbox .fb button').click();
  }
}
