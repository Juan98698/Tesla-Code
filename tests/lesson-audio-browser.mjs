import assert from 'node:assert/strict';
import { mkdir } from 'node:fs/promises';
import { withTutorBrowser } from './support/tutor-browser.mjs';
import { learningContext, waitForFiniteAnimations } from './support/browser.mjs';
import { installSpeechMock } from './support/speech.mjs';
const lesson = '/#/leccion/fundamentos/js-tu-primer-programa/aprender';
await mkdir('coverage/lesson-audio', { recursive: true });
const progress = (page) =>
  page.evaluate(() => {
    const s = JSON.parse(localStorage.getItem('teslacode:progress:v2'));
    return { xp: s.xp, completed: s.completed, practices: s.practices };
  });
async function audit(page, label) {
  await page.addScriptTag({ path: 'node_modules/axe-core/axe.min.js' });
  await waitForFiniteAnimations(page);
  const errors = await page.evaluate(async () =>
    (
      await axe.run(document, {
        runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21aa'] },
      })
    ).violations.map((v) => ({ id: v.id, targets: v.nodes.map((n) => n.target) })),
  );
  assert.deepEqual(errors, [], label);
  assert.equal(
    await page.evaluate(() => document.documentElement.scrollWidth > innerWidth),
    false,
    label + ' overflow',
  );
}
await withTutorBrowser(async ({ browser, origin, calls }) => {
  for (const width of [1440, 390]) {
    const context = await learningContext(browser, {
      viewport: { width, height: 1000 },
      reducedMotion: 'reduce',
    });
    await context.addInitScript(installSpeechMock);
    const page = await context.newPage(),
      errors = [],
      requests = [];
    page.on('pageerror', (e) => errors.push(e.message));
    page.on('request', (r) => requests.push(r.url()));
    await page.goto(origin);
    await page.locator('.hero').waitFor();
    assert.equal(
      requests.some((url) => url.includes('lesson-audio.js')),
      false,
      'Reader module stays out of the home load',
    );
    await page.goto(origin + lesson);
    const play = page.getByRole('button', { name: 'Escuchar teoría', exact: true });
    await play.waitFor();
    assert.equal(await play.isEnabled(), true);
    const before = await progress(page);
    assert.equal(await page.evaluate(() => __speech.utterances.length), 0);
    assert.equal(await page.locator('#lesson-audio-voice option').count(), 2);
    await play.focus();
    await page.keyboard.press('Space');
    await page.evaluate(() => __speech.start());
    await page.locator('.narration-current').waitFor();
    const text = await page.evaluate(() => __speech.current.text);
    assert.match(text, /punto de partida/);
    await page.getByRole('button', { name: 'Pausar lectura', exact: true }).click();
    assert.equal(await page.evaluate(() => __speech.current), undefined);
    await page.getByRole('button', { name: 'Continuar lectura', exact: true }).click();
    assert.equal(await page.evaluate(() => __speech.current.text), text);
    await page.locator('.lesson-audio-options summary').click();
    await page.getByLabel('Velocidad', { exact: true }).selectOption('1.25');
    await page.getByLabel('Voz en español', { exact: true }).selectOption('online-es');
    assert.deepEqual(
      await page.evaluate(() => ({ rate: __speech.current.rate, lang: __speech.current.lang })),
      { rate: 1.25, lang: 'es-ES' },
    );
    await page.evaluate(() => __speech.start());
    for (const theme of ['dark', 'light']) {
      await page.evaluate((t) => (document.documentElement.dataset.theme = t), theme);
      await audit(page, `reader ${width}/${theme}`);
      await page.locator('#lesson-audio').scrollIntoViewIfNeeded();
      await page.screenshot({ path: `coverage/lesson-audio/reader-${width}-${theme}.png` });
    }
    await page.getByRole('button', { name: 'Detener', exact: true }).click();
    const example = page.locator('details.code-example').first();
    await example.evaluate((el) => (el.open = true));
    await example.locator('textarea').first().fill('NO_LEER_TEXTO_DEL_EDITOR');
    await page.getByRole('button', { name: 'Escuchar teoría', exact: true }).click();
    const narrated = await page.evaluate(() => {
      let steps = 0;
      while (__speech.current && steps++ < 1000) {
        __speech.start();
        __speech.finish();
      }
      if (__speech.current) throw Error('Reader did not finish');
      return __speech.utterances.map((u) => u.text);
    });
    assert.ok(narrated.every((text) => text.length <= 180));
    assert.equal(
      narrated.some((text) => /NO_LEER_TEXTO_DEL_EDITOR|Lista para ejecutar\./.test(text)),
      false,
      'Editor contents and console states are not narrated',
    );
    assert.match(
      narrated.join(' '),
      /El botón «Ejecutar código»/,
      'Published explanations of controls remain part of the theory',
    );
    await page.getByRole('button', { name: 'Volver a escuchar', exact: true }).click();
    await page.evaluate(() => __speech.start());
    await page.getByRole('tab', { name: /Practicar/ }).click();
    await page.locator('#activities').waitFor();
    assert.equal(await page.locator('#lesson-audio').count(), 0);
    assert.equal(await page.evaluate(() => __speech.current), undefined);
    await page.getByRole('tab', { name: /Aprender/ }).click();
    await page.getByRole('button', { name: 'Escuchar teoría', exact: true }).waitFor();
    assert.equal(await page.locator('#lesson-audio-rate').inputValue(), '1.25');
    assert.equal(await page.locator('#lesson-audio-voice').inputValue(), 'online-es');
    await page.getByRole('button', { name: 'Escuchar teoría', exact: true }).click();
    await page.evaluate(() => __speech.start());
    await page.goto(origin + '/#/rutas');
    await page.locator('.page-intro').waitFor();
    assert.equal(await page.evaluate(() => __speech.current), undefined);
    assert.deepEqual(await progress(page), before);
    assert.deepEqual(errors, []);
    await context.close();
    console.log(
      `PASS audio ${width}px: lazy loading, keyboard, pause/stop, settings, highlighted theory, editor excluded, navigation cleanup, progress intact and both themes WCAG.`,
    );
  }
  const fallback = await learningContext(browser, {
    viewport: { width: 320, height: 844 },
    reducedMotion: 'reduce',
  });
  await fallback.addInitScript(() => {
    Object.defineProperty(window, 'speechSynthesis', { value: undefined, configurable: true });
  });
  const noApi = await fallback.newPage();
  await noApi.goto(origin + lesson);
  await noApi
    .getByText('Este navegador no ofrece lectura en voz alta.', { exact: false })
    .waitFor();
  assert.equal(
    await noApi.getByRole('button', { name: 'Escuchar teoría', exact: true }).isDisabled(),
    true,
  );
  await audit(noApi, 'unsupported reader 320');
  await fallback.close();
  const late = await learningContext(browser, {
    viewport: { width: 390, height: 844 },
    reducedMotion: 'reduce',
  });
  await late.addInitScript(installSpeechMock, { empty: true });
  const waiting = await late.newPage();
  await waiting.goto(origin + lesson);
  await waiting.getByRole('button', { name: 'Escuchar teoría', exact: true }).waitFor();
  assert.equal(
    await waiting.getByRole('button', { name: 'Escuchar teoría', exact: true }).isDisabled(),
    true,
  );
  await waiting.evaluate(() => {
    __speech.voices = [
      { voiceURI: 'arrived', name: 'Voz disponible', lang: 'es-MX', localService: true },
    ];
    __speech.changed();
  });
  assert.equal(
    await waiting.getByRole('button', { name: 'Escuchar teoría', exact: true }).isEnabled(),
    true,
  );
  await late.close();
  const native = await learningContext(browser, {
      viewport: { width: 1440, height: 1000 },
      reducedMotion: 'reduce',
    }),
    real = await native.newPage();
  await real.addInitScript(() => {
    window.__nativeSpeechErrors = [];
    const synth = window.speechSynthesis;
    if (!synth) return;
    const speak = synth.speak;
    synth.speak = function (utterance) {
      utterance.addEventListener('error', (event) => window.__nativeSpeechErrors.push(event.error));
      return speak.call(this, utterance);
    };
  });
  await real.goto(origin + lesson);
  await real.getByRole('button', { name: 'Escuchar teoría', exact: true }).waitFor();
  await real.waitForFunction(
    () =>
      !document.querySelector('[data-audio-play]').disabled ||
      /No hay una voz|no ofrece/.test(document.querySelector('[data-audio-status]').textContent),
  );
  const info = await real.evaluate(() => ({
    supported: typeof window.SpeechSynthesisUtterance === 'function',
    spanishVoices:
      window.speechSynthesis?.getVoices().filter((v) => /^es[-_]?/i.test(v.lang)).length ?? 0,
  }));
  if (info.spanishVoices) {
    await real.getByRole('button', { name: 'Escuchar teoría', exact: true }).click();
    await real.waitForFunction(
      () =>
        document.querySelector('.narration-current') ||
        /interrumpió|conectarse|no permitió|no está disponible/.test(
          document.querySelector('[data-audio-status]').textContent,
        ),
    );
    info.started = (await real.locator('.narration-current').count()) > 0;
    info.errors = await real.evaluate(() => window.__nativeSpeechErrors);
    await real.getByRole('button', { name: 'Detener', exact: true }).click();
  }
  console.log(
    'NATIVE speech check: ' +
      JSON.stringify(info) +
      '; audible quality requires checking the device speakers.',
  );
  await native.close();
  assert.equal(calls.length, 0, 'Narration must not call Gemini');
  console.log(
    'PASS fallbacks: unsupported API, late Spanish voices, native voice inventory and no AI requests.',
  );
});
