import test from 'node:test';
import assert from 'node:assert/strict';
import { installDOM, change } from './support/dom.mjs';
import { installSpeechMock } from './support/speech.mjs';
import { speechChunks, speechBlocks, mountLessonAudio } from '../js/features/lesson-audio.js';
const markup = (text) => `<section id="lesson-audio"></section><div id="lesson">${text}</div>`;
function fixture(t, text = '<h3>Primer paso</h3><p>Una variable guarda un dato.</p>') {
  const dom = installDOM(t, `<main id="root">${markup(text)}</main>`),
    root = dom.window.document.getElementById('root');
  const speech = installSpeechMock(),
    timers = new Map();
  let serial = 0;
  t.mock.method(dom.window, 'setTimeout', (fn, delay) => {
    timers.set(++serial, { fn, delay });
    return serial;
  });
  t.mock.method(dom.window, 'clearTimeout', (id) => timers.delete(id));
  const run = (delay) => {
    for (const [id, timer] of [...timers])
      if (timer.delay === delay) {
        timers.delete(id);
        timer.fn();
      }
  };
  const $ = (selector) => root.querySelector(selector);
  return {
    dom,
    root,
    speech,
    timers,
    run,
    $,
    mount: () => mountLessonAudio(root),
    play: () => $('[data-audio-play]').click(),
  };
}

test('speech chunks preserve prose, punctuation and Unicode while bounding long utterances', () => {
  assert.deepEqual(speechChunks(null), []);
  assert.deepEqual(speechChunks(' \n\t '), []);
  const text = 'Esta oración explica un dato y termina aquí. '.repeat(25);
  const chunks = speechChunks(text);
  assert.ok(chunks.length > 5 && chunks.every((text) => text.length <= 180));
  assert.equal(chunks.join(' '), text.trim());
  for (const word of ['x'.repeat(700), 'a'.repeat(179) + '😀'.repeat(100)]) {
    const split = speechChunks(word);
    assert.equal(split.join(''), word);
    assert.ok(split.every((text) => text.length <= 180 && !/[\uD800-\uDBFF]$/.test(text)));
  }
});

test('theory extraction preserves inline code, lists and outputs without reading consoles or hidden controls', (t) => {
  const f = fixture(
    t,
    'Texto directo<h3>Un dato</h3><p>Usa <code>let</code> para nombrarlo.</p><ul><li>Antes<ul><li>Dentro</li></ul>Después</li></ul><pre data-language="javascript">NO_CODIGO</pre><pre data-language="text">Hola TeslaCode</pre><form><p>NO_EDITOR</p></form><div class="code-example"><p>NO_CONSOLA</p></div><span hidden>NO_OCULTO</span><span aria-hidden="true">NO_DECORACION</span><details><summary>NO_CERRADO</summary><p>NO_RESPUESTA</p></details><details open><summary>Ejemplo abierto</summary><p>Explicación visible</p></details><div role="status">NO_ESTADO</div>',
  );
  const blocks = speechBlocks(f.$('#lesson')),
    text = blocks.map((b) => b.text).join(' ');
  assert.match(text, /Texto directo Un dato Usa let para nombrarlo/);
  assert.match(text, /Antes Dentro Después Hola TeslaCode/);
  assert.match(text, /Explicación visible/);
  assert.doesNotMatch(text, /NO_/);
  assert.equal(blocks.filter((b) => b.text === 'Dentro').length, 1);
});

test('unsupported engines and absent panels leave the lesson readable', (t) => {
  const f = fixture(t);
  Object.defineProperty(f.dom.window, 'speechSynthesis', {
    get: () => {
      throw Error('Unavailable');
    },
    configurable: true,
  });
  f.mount()();
  assert.equal(f.$('[data-audio-play]').disabled, true);
  assert.match(f.$('[data-audio-status]').textContent, /navegador no ofrece/);
  f.root.innerHTML = '<p>Solo lectura</p>';
  mountLessonAudio(f.root)();
});

test('voices can arrive asynchronously, are filtered to Spanish and never become HTML', (t) => {
  const f = fixture(t);
  f.speech.voices = [];
  const dispose = f.mount();
  assert.equal(f.$('[data-audio-play]').disabled, true);
  f.run(2500);
  assert.match(f.$('[data-audio-status]').textContent, /No hay una voz/);
  f.speech.voices = [
    { voiceURI: 'safe', name: '<img src=x onerror=alert(1)>', lang: 'es_MX' },
    { name: 'English', lang: 'en-US' },
  ];
  f.speech.changed();
  assert.equal(f.$('[data-audio-play]').disabled, false);
  assert.equal(f.$('#lesson-audio-voice').options.length, 1);
  assert.equal(f.root.querySelector('img'), null);
  assert.match(f.$('#lesson-audio-voice').textContent, /<img/);
  dispose();
});

test('only a user gesture starts speech, each fragment follows its end and completed playback can restart', (t) => {
  const f = fixture(t);
  const dispose = f.mount();
  assert.equal(f.speech.utterances.length, 0);
  f.play();
  assert.equal(f.speech.current.text, 'Primer paso');
  assert.equal(f.speech.current.lang, 'es-CO');
  assert.equal(f.speech.utterances.length, 1);
  f.speech.start();
  assert.equal(f.$('h3').classList.contains('narration-current'), true);
  const stale = f.speech.current.onend;
  f.speech.finish();
  f.speech.start();
  stale();
  assert.equal(f.speech.utterances.length, 2);
  assert.equal(f.speech.current.text, 'Una variable guarda un dato.');
  f.speech.finish();
  assert.match(f.$('[data-audio-status]').textContent, /terminada/);
  assert.equal(f.$('.narration-current'), null);
  f.play();
  assert.equal(f.speech.current.text, 'Primer paso');
  assert.equal(f.dom.window.localStorage.getItem('teslacode:progress:v2'), null);
  dispose();
});

test('pause repeats the current short fragment, stop restarts and late callbacks cannot resurrect speech', (t) => {
  const f = fixture(t);
  const dispose = f.mount();
  f.play();
  f.speech.start();
  const old = f.speech.current.onend;
  f.play();
  assert.equal(f.speech.cancels, 1);
  assert.match(f.$('[data-audio-label]').textContent, /Continuar/);
  old();
  assert.equal(f.speech.utterances.length, 1);
  f.play();
  assert.equal(f.speech.current.text, 'Primer paso');
  f.$('[data-audio-stop]').click();
  assert.equal(f.speech.current, undefined);
  assert.equal(f.$('[data-audio-stop]').disabled, true);
  f.play();
  assert.equal(f.speech.current.text, 'Primer paso');
  dispose();
  old();
  assert.equal(f.speech.utterances.length, 3);
  assert.equal(f.timers.size, 0);
});

test('voice and speed changes restart only the current fragment and store preferences without lesson text', (t) => {
  const f = fixture(t);
  let dispose = f.mount();
  f.play();
  f.speech.finish();
  change(f.$('#lesson-audio-rate'), '1.5', 'change');
  assert.equal(f.speech.current.rate, 1.5);
  assert.equal(f.speech.current.text, 'Una variable guarda un dato.');
  change(f.$('#lesson-audio-voice'), 'online-es', 'change');
  assert.equal(f.speech.current.voice.voiceURI, 'online-es');
  assert.deepEqual(JSON.parse(f.dom.window.localStorage.getItem('teslacode:lesson-audio:v1')), {
    rate: 1.5,
    voice: 'online-es',
  });
  dispose();
  dispose = f.mount();
  assert.equal(f.$('#lesson-audio-rate').value, '1.5');
  assert.equal(f.$('#lesson-audio-voice').value, 'online-es');
  f.$('#lesson-audio-rate').append(new f.dom.window.Option('inválida', '99'));
  change(f.$('#lesson-audio-rate'), '99', 'change');
  assert.equal(f.$('#lesson-audio-rate').value, '1');
  dispose();
});

test('engine errors preserve the fragment and offer recovery, including exceptions and silent starts', (t) => {
  const f = fixture(t);
  const dispose = f.mount();
  for (const [code, message] of [
    ['network', /conectarse/],
    ['not-allowed', /no permitió/],
    ['voice-unavailable', /no está disponible/],
    ['synthesis-failed', /interrumpió/],
  ]) {
    f.play();
    f.speech.error(code);
    assert.match(f.$('[data-audio-status]').textContent, message);
    assert.equal(f.speech.current, undefined);
    assert.match(f.$('[data-audio-label]').textContent, /Continuar/);
  }
  f.speech.failSpeak = true;
  f.play();
  assert.match(f.$('[data-audio-status]').textContent, /interrumpió/);
  f.speech.failSpeak = false;
  f.speech.failCancel = true;
  f.play();
  f.run(12000);
  assert.match(f.$('[data-audio-status]').textContent, /interrumpió/);
  dispose();
});

test('changing voice availability during playback pauses honestly and can recover from enumeration errors', (t) => {
  const f = fixture(t);
  const dispose = f.mount();
  f.play();
  const alternate = f.speech.voices[1];
  f.speech.voices = [alternate];
  f.speech.changed();
  assert.match(f.$('[data-audio-status]').textContent, /voz cambió/);
  f.play();
  f.speech.failVoices = true;
  f.$('[data-audio-refresh]').click();
  assert.equal(f.$('[data-audio-play]').disabled, true);
  f.speech.failVoices = false;
  f.speech.voices = [{ name: 'Voz nueva', lang: 'es-AR', localService: true }];
  f.speech.changed();
  assert.match(f.$('[data-audio-status]').textContent, /Voz disponible/);
  f.play();
  assert.equal(f.speech.current.lang, 'es-AR');
  f.speech.changed();
  assert.ok(f.speech.current);
  dispose();
});

test('backgrounding and pagehide pause without automatic resumption, disposal cleans events and highlights', (t) => {
  const f = fixture(t);
  const dispose = f.mount();
  f.play();
  f.speech.start();
  Object.defineProperty(f.dom.window.document, 'hidden', { value: true, configurable: true });
  f.dom.window.document.dispatchEvent(new f.dom.window.Event('visibilitychange'));
  assert.equal(f.speech.current, undefined);
  assert.equal(f.$('.narration-current'), null);
  Object.defineProperty(f.dom.window.document, 'hidden', { value: false, configurable: true });
  f.dom.window.document.dispatchEvent(new f.dom.window.Event('visibilitychange'));
  assert.equal(f.speech.utterances.length, 1);
  f.play();
  f.dom.window.dispatchEvent(new f.dom.window.Event('pagehide'));
  assert.equal(f.speech.current, undefined);
  f.play();
  f.speech.start();
  dispose();
  const before = f.speech.utterances.length;
  f.speech.changed();
  f.play();
  assert.equal(f.speech.utterances.length, before);
  assert.equal(f.$('.narration-current'), null);
});

test('empty theory, corrupt settings and blocked storage do not prevent normal reading', (t) => {
  const f = fixture(t, '<pre>Solo código</pre>');
  f.dom.window.localStorage.setItem('teslacode:lesson-audio:v1', 'bad json');
  let dispose = f.mount();
  assert.match(f.$('[data-audio-status]').textContent, /no tiene texto/);
  assert.equal(f.$('[data-audio-play]').disabled, true);
  dispose();
  f.$('#lesson').innerHTML = '<p>La teoría sigue visible.</p>';
  Object.defineProperty(f.dom.window, 'localStorage', {
    get: () => {
      throw Error('Blocked storage');
    },
    configurable: true,
  });
  dispose = f.mount();
  change(f.$('#lesson-audio-rate'), '1.25', 'change');
  f.play();
  assert.equal(f.speech.current.rate, 1.25);
  dispose();
});
