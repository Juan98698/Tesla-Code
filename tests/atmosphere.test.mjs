import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { installDOM } from './support/dom.mjs';
import { mountAtmosphere } from '../js/features/atmosphere.js';

function fixture(t, options = {}) {
  const dom = installDOM(
    t,
    readFileSync('index.html', 'utf8'),
    'http://localhost/' + (options.hash ?? '#/inicio'),
  );
  const { document: doc } = dom.window;
  const view = dom.window,
    video = doc.querySelector('#cinematic-intro video'),
    dialog = doc.getElementById('cinematic-intro');
  const media = new view.EventTarget();
  media.matches = options.reduced ?? false;
  if (!options.noMedia) view.matchMedia = () => media;
  else globalThis.matchMedia = undefined;
  const connection = new view.EventTarget();
  connection.saveData = options.saveData ?? false;
  if (!options.noConnection)
    Object.defineProperty(view.navigator, 'connection', { configurable: true, value: connection });
  let hidden = options.hidden ?? false,
    paused = true;
  Object.defineProperty(doc, 'hidden', { configurable: true, get: () => hidden });
  Object.defineProperty(video, 'paused', { configurable: true, get: () => paused });
  Object.defineProperty(video, 'duration', { configurable: true, value: 10 });
  t.mock.method(video, 'canPlayType', (type) =>
    options.unsupported ? '' : options.mp4Only && type.includes('webm') ? '' : 'probably',
  );
  const emit = (name) => video.dispatchEvent(new view.Event(name));
  t.mock.method(video, 'play', () => {
    if (options.reject) return Promise.reject(Error('Playback blocked'));
    paused = false;
    if (!options.waiting) emit('playing');
    return Promise.resolve();
  });
  t.mock.method(video, 'pause', () => {
    paused = true;
    emit('pause');
  });
  t.mock.method(video, 'load', () => {});
  if (options.fallback) {
    dialog.showModal = undefined;
    dialog.close = undefined;
  } else {
    dialog.showModal = () => dialog.setAttribute('open', '');
    dialog.close = () => dialog.removeAttribute('open');
  }
  if (options.seen) view.sessionStorage.setItem('teslacode:intro:v1', '1');
  if (options.noStorage)
    Object.defineProperty(view, 'sessionStorage', {
      get: () => {
        throw Error('Storage unavailable');
      },
      configurable: true,
    });
  doc.documentElement.dataset.motion = options.motion ?? 'on';
  t.mock.timers.enable({ apis: ['setTimeout'] });
  return {
    doc,
    view,
    video,
    dialog,
    media,
    connection,
    emit,
    hidden(value) {
      hidden = value;
      doc.dispatchEvent(new view.Event('visibilitychange'));
    },
    mount: () => mountAtmosphere(doc),
    tick: (ms) => t.mock.timers.tick(ms),
  };
}

test('cinematic first visit plays muted once and releases media after a smooth exit without progress changes', (t) => {
  const f = fixture(t),
    initial = '{"version":2,"xp":180,"completed":["ia/que-es-la-inteligencia-artificial"]}';
  f.view.localStorage.setItem('teslacode:progress:v2', initial);
  const dispose = f.mount();
  assert.equal(f.dialog.open, true);
  assert.equal(f.video.muted, true);
  assert.match(f.video.getAttribute('src'), /\.mp4\?v=/);
  assert.equal(f.doc.querySelectorAll('.syntax-sigil').length, 11);
  assert.equal(f.doc.querySelector('.sigil-code small').textContent, '</>');
  assert.equal(f.view.sessionStorage.getItem('teslacode:intro:v1'), '1');
  assert.equal(f.doc.documentElement.dataset.worldMotion, 'off');
  f.emit('ended');
  f.emit('playing');
  assert.equal(f.dialog.dataset.phase, 'leaving');
  f.tick(999);
  assert.equal(f.dialog.open, true);
  f.tick(1);
  assert.equal(f.dialog.open, false);
  assert.equal(f.video.hasAttribute('src'), false);
  assert.equal(f.video.hasAttribute('poster'), false);
  assert.equal(f.video.load.mock.callCount(), 1);
  assert.equal(f.doc.activeElement.id, 'content');
  assert.equal(f.view.localStorage.getItem('teslacode:progress:v2'), initial);
  assert.equal(f.doc.documentElement.dataset.worldMotion, 'on');
  dispose();
});

test('replay provides sound, pause and bounded progress; duplicate starts do not reset the clip', (t) => {
  const f = fixture(t, { seen: true });
  const dispose = f.mount();
  assert.equal(f.dialog.open, false);
  const replay = f.doc.getElementById('intro-replay');
  replay.focus();
  replay.click();
  replay.click();
  assert.equal(f.video.play.mock.callCount(), 1);
  const sound = f.dialog.querySelector('[data-intro-sound]');
  sound.click();
  assert.equal(f.video.muted, false);
  assert.equal(sound.getAttribute('aria-pressed'), 'true');
  sound.click();
  assert.equal(f.video.muted, true);
  const pause = f.dialog.querySelector('[data-intro-pause]');
  pause.click();
  assert.equal(f.video.paused, true);
  assert.equal(pause.textContent, 'Continuar');
  f.tick(6000);
  assert.equal(f.dialog.open, true);
  pause.click();
  assert.equal(f.video.paused, false);
  const progress = f.dialog.querySelector('progress');
  f.video.currentTime = 5;
  f.emit('timeupdate');
  assert.equal(progress.value, 50);
  assert.equal(f.video.style.getPropertyValue('--intro-focus-x'), '67.5%');
  Object.defineProperty(f.video, 'duration', { value: Infinity });
  f.video.currentTime = 100;
  f.emit('timeupdate');
  assert.equal(progress.value, 100);
  assert.equal(f.video.style.getPropertyValue('--intro-focus-x'), '85%');
  f.video.currentTime = -1;
  f.emit('timeupdate');
  assert.equal(progress.value, 0);
  assert.equal(f.video.style.getPropertyValue('--intro-focus-x'), '50%');
  Object.defineProperty(f.video, 'duration', { value: 0 });
  f.video.currentTime = 0;
  f.emit('timeupdate');
  assert.equal(progress.value, 0);
  f.dialog.querySelector('[data-intro-skip]').click();
  const unrelated = new f.view.Event('transitionend', { bubbles: true });
  Object.defineProperty(unrelated, 'propertyName', { value: 'opacity' });
  progress.dispatchEvent(unrelated);
  assert.equal(f.dialog.open, true);
  const transition = new f.view.Event('transitionend');
  Object.defineProperty(transition, 'propertyName', { value: 'opacity' });
  f.dialog.dispatchEvent(transition);
  assert.equal(f.dialog.open, false);
  assert.equal(f.doc.activeElement, replay);
  dispose();
});

for (const [name, options] of [
  ['reduced motion', { reduced: true }],
  ['data saving', { saveData: true }],
  ['paused motion', { motion: 'off' }],
  ['lesson deep link', { hash: '#/leccion/ia/que-es-la-inteligencia-artificial/aprender' }],
  ['unsupported video', { unsupported: true }],
])
  test(`cinematic auto playback is absent for ${name}`, (t) => {
    const f = fixture(t, options),
      dispose = f.mount();
    assert.equal(f.dialog.open, false);
    assert.equal(f.video.hasAttribute('src'), false);
    assert.equal(f.video.play.mock.callCount(), 0);
    dispose();
  });

test('hidden tabs defer the first playback, pause active video and resume only automatic visibility pauses', (t) => {
  const f = fixture(t, { hidden: true }),
    dispose = f.mount();
  assert.equal(f.dialog.open, false);
  f.hidden(false);
  assert.equal(f.dialog.open, true);
  assert.equal(f.video.paused, false);
  f.hidden(true);
  assert.equal(f.video.paused, true);
  f.hidden(false);
  assert.equal(f.video.paused, false);
  f.dialog.querySelector('[data-intro-pause]').click();
  f.hidden(true);
  f.hidden(false);
  assert.equal(f.video.paused, true);
  dispose();
  assert.equal(f.video.hasAttribute('src'), false);
  f.hidden(true);
  f.hidden(false);
  assert.equal(f.doc.documentElement.dataset.worldMotion, 'off');
});

test('manual playback can be requested with reduced motion and exits without an animation', (t) => {
  const f = fixture(t, { reduced: true }),
    dispose = f.mount();
  f.doc.getElementById('intro-replay').click();
  assert.equal(f.dialog.open, true);
  const cancel = new f.view.Event('cancel', { cancelable: true });
  f.dialog.dispatchEvent(cancel);
  assert.equal(cancel.defaultPrevented, true);
  f.tick(1);
  assert.equal(f.dialog.open, false);
  dispose();
});

test('changed preferences stop playback and animation; cleanup removes observers and events', async (t) => {
  const f = fixture(t),
    dispose = f.mount();
  f.doc.documentElement.dataset.motion = 'off';
  await Promise.resolve();
  f.tick(1);
  assert.equal(f.dialog.open, false);
  f.doc.documentElement.dataset.motion = 'on';
  await Promise.resolve();
  f.doc.getElementById('intro-replay').click();
  f.connection.saveData = true;
  f.connection.dispatchEvent(new f.view.Event('change'));
  f.tick(1);
  assert.equal(f.dialog.open, false);
  f.connection.saveData = false;
  f.doc.getElementById('intro-replay').click();
  f.media.matches = true;
  f.media.dispatchEvent(new f.view.Event('change'));
  f.tick(1);
  assert.equal(f.dialog.open, false);
  dispose();
  f.media.matches = false;
  f.media.dispatchEvent(new f.view.Event('change'));
  assert.equal(f.doc.documentElement.dataset.worldMotion, 'off');
  assert.equal(f.video.onwaiting, null);
  assert.equal(f.dialog.oncancel, null);
});

test('MP4 and non-modal fallbacks work; route changes and detached replay controls exit safely', (t) => {
  const f = fixture(t, { mp4Only: true, fallback: true, seen: true }),
    dispose = f.mount();
  const button = f.doc.getElementById('intro-replay');
  button.focus();
  button.click();
  assert.match(f.video.getAttribute('src'), /\.mp4\?v=/);
  button.remove();
  f.view.location.hash = '#/rutas';
  f.view.dispatchEvent(new f.view.Event('hashchange'));
  f.tick(1);
  assert.equal(f.dialog.open, false);
  assert.equal(f.doc.activeElement.id, 'content');
  dispose();
});

test('a missing storage service still permits playback and remembers it across remounts in memory', (t) => {
  const f = fixture(t, { noStorage: true, noMedia: true, noConnection: true }),
    dispose = f.mount();
  assert.equal(f.dialog.open, true);
  dispose();
  const cleanup = f.mount();
  assert.equal(f.dialog.open, false);
  cleanup();
});

test('rejected autoplay, a load timeout and a stalled stream reveal the usable page', async (t) => {
  const f = fixture(t, { reject: true }),
    dispose = f.mount();
  await Promise.resolve();
  f.tick(1);
  assert.equal(f.dialog.open, false);
  dispose();
});
test('loading and buffering deadlines clear on pause, completion or disposal', (t) => {
  const f = fixture(t, { waiting: true }),
    dispose = f.mount();
  f.tick(5001);
  f.tick(1);
  assert.equal(f.dialog.open, false);
  f.doc.getElementById('intro-replay').click();
  f.emit('playing');
  f.emit('waiting');
  f.tick(5001);
  f.tick(1);
  assert.equal(f.dialog.open, true);
  assert.match(f.doc.getElementById('intro-description').textContent, /Puedes esperar/);
  f.emit('playing');
  f.emit('ended');
  f.tick(1001);
  assert.equal(f.dialog.open, false);
  f.doc.getElementById('intro-replay').click();
  f.emit('error');
  f.tick(1);
  assert.equal(f.dialog.open, false);
  f.doc.getElementById('intro-replay').click();
  f.emit('playing');
  f.emit('stalled');
  f.dialog.querySelector('[data-intro-skip]').click();
  f.emit('waiting');
  dispose();
  f.tick(10000);
  assert.equal(f.video.hasAttribute('src'), false);
});
test('optional ambience tolerates missing or incomplete markup', (t) => {
  const f = fixture(t);
  f.doc.getElementById('intro-replay').remove();
  mountAtmosphere(f.doc)();
  f.doc.querySelector('[data-atmosphere]').remove();
  mountAtmosphere(f.doc)();
});
