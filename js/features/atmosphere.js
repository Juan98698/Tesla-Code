import { assetUrl } from '../core/assets.js';
import { escapeHtml as e } from '../core/html.js';
import { mountTeslaWorld } from './tesla-world.js';

const sigils = [
  ['js', 'JS', '<rect x="8" y="8" width="48" height="48" rx="8"/><text x="32" y="41">JS</text>'],
  [
    'python',
    'Python',
    '<path d="M18 30V17q0-7 14-7t14 7v16H27v7H13q-5-12 0-17h22M46 34v13q0 7-14 7t-14-7v-7h19v-7h14q5-12 0-17h-5"/><circle cx="27" cy="17" r="1.5"/><circle cx="37" cy="47" r="1.5"/>',
  ],
  [
    'html',
    'HTML',
    '<path d="m11 8 4 43 17 5 17-5 4-43ZM41 19H24l1 10h15l-1 13-7 3-7-3-1-6"/><text x="32" y="62">5</text>',
  ],
  ['css', 'CSS', '<path d="m11 8 4 43 17 5 17-5 4-43ZM23 19h19L29 30h11l-1 12-7 3-7-3-1-6"/>'],
  [
    'sql',
    'SQL',
    '<ellipse cx="32" cy="15" rx="21" ry="8"/><path d="M11 15v32c0 11 42 11 42 0V15M11 30c0 11 42 11 42 0"/>',
  ],
  [
    'java',
    'Java',
    '<path d="M18 31h27v12c0 12-27 12-27 0ZM45 32h7c9 0 6 13-7 12M13 57h39M29 25c-16-12 15-10 2-23M38 25c-7-6 13-9 8-16"/>',
  ],
  ['php', 'PHP', '<ellipse cx="32" cy="32" rx="28" ry="18"/><text x="32" y="38">php</text>'],
  ['ts', 'TS', '<rect x="8" y="8" width="48" height="48" rx="8"/><text x="32" y="41">TS</text>'],
  [
    'react',
    'React',
    '<ellipse cx="32" cy="32" rx="28" ry="11"/><ellipse cx="32" cy="32" rx="28" ry="11" transform="rotate(60 32 32)"/><ellipse cx="32" cy="32" rx="28" ry="11" transform="rotate(120 32 32)"/><circle cx="32" cy="32" r="3"/>',
  ],
  ['code', '</>', '<path d="m22 18-16 14 16 14M42 18l16 14-16 14M38 9 26 55"/>'],
  [
    'braces',
    '{ }',
    '<path d="M25 8c-14 0-9 18-16 24 7 6 2 24 16 24M39 8c14 0 9 18 16 24-7 6-2 24-16 24"/>',
  ],
];

export function mountAtmosphere(doc) {
  const world = doc.querySelector('[data-atmosphere]');
  const dialog = doc.getElementById('cinematic-intro');
  if (!world || !dialog) return () => {};
  const view = doc.defaultView;
  const root = doc.documentElement;
  const video = dialog.querySelector('video');
  const replay = doc.getElementById('intro-replay');
  const skip = dialog.querySelector('[data-intro-skip]');
  const pause = dialog.querySelector('[data-intro-pause]');
  const sound = dialog.querySelector('[data-intro-sound]');
  const progress = dialog.querySelector('progress');
  const description = dialog.querySelector('#intro-description');
  if ([video, replay, skip, pause, sound, progress, description].some((element) => !element))
    return () => {};
  const disposeWorld = mountTeslaWorld(doc);
  const introDescription = description.textContent;
  const source = video.canPlayType('video/mp4') ? video.dataset.mp4 : null;
  replay.disabled = !source;
  if (!source)
    replay.title = 'Este navegador no admite la introducción. Puedes usar toda la plataforma.';
  const mediaQuery = view.matchMedia?.bind(view) ?? globalThis.matchMedia;
  const reduced = mediaQuery?.('(prefers-reduced-motion: reduce)') ?? { matches: false };
  const connection = view.navigator.connection;
  let disposed = false,
    leaving = false,
    loadTimer,
    closeTimer,
    returnFocus,
    started = false,
    resumeOnVisible = false;
  const sessionKey = 'teslacode:intro:v1';
  const home = () => ['', '#/inicio', '#/inicio/'].includes(view.location.hash);
  const motionAllowed = () =>
    !reduced.matches && !connection?.saveData && root.dataset.motion !== 'off';
  const autoEntry = home() && motionAllowed();
  const glyphs = world.querySelector('[data-sigils]');
  glyphs.innerHTML = sigils
    .map(
      ([name, label, drawing], index) =>
        `<span class="syntax-sigil sigil-${name}" style="--sigil:${index}"><svg viewBox="0 0 64 64" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" focusable="false">${drawing}</svg><small>${e(label)}</small></span>`,
    )
    .join('');
  function sync() {
    root.dataset.worldMotion =
      !disposed && !doc.hidden && motionAllowed() && !dialog.open ? 'on' : 'off';
  }
  function releaseVideo() {
    if (!video.hasAttribute('src')) return;
    video.pause();
    video.removeAttribute('src');
    video.removeAttribute('poster');
    video.style.removeProperty('--intro-focus-x');
    video.load();
  }
  function close() {
    view.clearTimeout(closeTimer);
    view.clearTimeout(loadTimer);
    releaseVideo();
    if (dialog.open) {
      if (typeof dialog.close === 'function') dialog.close();
      else dialog.removeAttribute('open');
    }
    leaving = false;
    delete dialog.dataset.phase;
    delete root.dataset.cinematic;
    sync();
    if (!disposed)
      (returnFocus?.isConnected && returnFocus !== doc.body
        ? returnFocus
        : doc.getElementById('content')
      )?.focus({ preventScroll: true });
  }
  function leave(immediate = false) {
    if (!dialog.open || leaving) return;
    leaving = true;
    view.clearTimeout(loadTimer);
    video.pause();
    dialog.dataset.phase = 'leaving';
    root.dataset.cinematic = 'leaving';
    closeTimer = view.setTimeout(close, immediate || reduced.matches ? 0 : 1000);
  }
  function play() {
    const promise = video.play();
    promise?.catch(() => leave(true));
  }
  function start() {
    if (disposed || dialog.open) return;
    if (!source) return;
    returnFocus = doc.activeElement;
    started = false;
    description.textContent = introDescription;
    resumeOnVisible = false;
    video.muted = true;
    video.poster = assetUrl(video.dataset.poster);
    video.src = assetUrl(source);
    progress.value = 0;
    video.style.setProperty('--intro-focus-x', '50%');
    sound.textContent = 'Activar sonido';
    sound.setAttribute('aria-pressed', 'false');
    pause.textContent = 'Pausar';
    dialog.dataset.phase = 'loading';
    root.dataset.cinematic = 'playing';
    if (typeof dialog.showModal === 'function') dialog.showModal();
    else dialog.setAttribute('open', '');
    skip.focus();
    seen = true;
    root.dataset.introSeen = '1';
    try {
      view.sessionStorage.setItem(sessionKey, '1');
    } catch {}
    loadTimer = view.setTimeout(() => leave(true), 5000);
    play();
    sync();
  }
  replay.onclick = start;
  skip.onclick = () => leave();
  pause.onclick = () => {
    resumeOnVisible = false;
    if (video.paused) play();
    else video.pause();
  };
  sound.onclick = () => {
    video.muted = !video.muted;
    sound.textContent = video.muted ? 'Activar sonido' : 'Silenciar';
    sound.setAttribute('aria-pressed', String(!video.muted));
  };
  video.onplaying = () => {
    if (leaving || !dialog.open || disposed) return;
    started = true;
    description.textContent = introDescription;
    view.clearTimeout(loadTimer);
    dialog.dataset.phase = 'playing';
    pause.textContent = 'Pausar';
  };
  video.onpause = () => {
    view.clearTimeout(loadTimer);
    pause.textContent = 'Continuar';
  };
  video.onwaiting = video.onstalled = () => {
    if (!video.paused && !leaving) {
      view.clearTimeout(loadTimer);
      dialog.dataset.phase = 'buffering';
      description.textContent = 'Cargando el video… Puedes esperar o entrar a TeslaCode.';
      if (!started) loadTimer = view.setTimeout(() => leave(true), 5000);
    }
  };
  video.ontimeupdate = () => {
    const duration =
      Number.isFinite(video.duration) && video.duration > 0 ? video.duration : 10.026667;
    progress.value = Math.min(100, Math.max(0, (video.currentTime / duration) * 100));
    // In portrait viewports the actor moves from the middle toward the right.
    // Reuse native progress events to keep him in frame without another render loop.
    video.style.setProperty('--intro-focus-x', `${50 + progress.value * 0.35}%`);
  };
  video.onended = () => leave();
  video.onerror = () => leave(true);
  dialog.oncancel = (event) => {
    event.preventDefault();
    leave();
  };
  const transitioned = (event) => {
    if (leaving && event.target === dialog && event.propertyName === 'opacity') close();
  };
  dialog.addEventListener('transitionend', transitioned);
  const preferences = () => {
    if (!motionAllowed()) leave(true);
    sync();
  };
  const visibility = () => {
    if (doc.hidden) {
      resumeOnVisible = dialog.open && !video.paused && !leaving;
      if (resumeOnVisible) video.pause();
    } else if (resumeOnVisible && dialog.open && !leaving) {
      resumeOnVisible = false;
      play();
    }
    if (!doc.hidden && autoEntry && home() && !seen && motionAllowed()) start();
    sync();
  };
  const navigation = () => {
    if (!home()) leave(true);
  };
  const observer = new view.MutationObserver(preferences);
  observer.observe(root, { attributes: true, attributeFilter: ['data-motion'] });
  reduced.addEventListener?.('change', preferences);
  connection?.addEventListener?.('change', preferences);
  doc.addEventListener('visibilitychange', visibility);
  view.addEventListener('hashchange', navigation);
  let seen = root.dataset.introSeen === '1';
  try {
    seen = seen || view.sessionStorage.getItem(sessionKey) === '1';
  } catch {}
  sync();
  if (autoEntry && !seen && !doc.hidden) start();
  return () => {
    disposed = true;
    disposeWorld();
    close();
    observer.disconnect();
    reduced.removeEventListener?.('change', preferences);
    connection?.removeEventListener?.('change', preferences);
    doc.removeEventListener('visibilitychange', visibility);
    view.removeEventListener('hashchange', navigation);
    for (const control of [replay, skip, pause, sound]) control.onclick = null;
    video.onplaying = video.onpause = video.ontimeupdate = video.onended = video.onerror = null;
    video.onwaiting = video.onstalled = null;
    dialog.oncancel = null;
    dialog.removeEventListener('transitionend', transitioned);
  };
}
