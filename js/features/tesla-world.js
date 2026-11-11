import { assetUrl } from '../core/assets.js';

async function loadWorldResources(view) {
  const loadImage = (path) =>
    new Promise((resolve, reject) => {
      const image = new view.Image();
      image.onload = () => resolve(image);
      image.onerror = () => reject(Error('No se pudo cargar una capa de Tesla.'));
      image.src = assetUrl(path);
    });
  const [module, background, mask] = await Promise.all([
    import('./tesla-world-renderer.js'),
    loadImage('assets/atmosphere/tesla-cleanplate-8946b68e5b.webp'),
    loadImage('assets/atmosphere/tesla-head-mask.svg'),
  ]);
  return { ...module, resources: { background, mask } };
}

// One photographic plane, shared by the static image and the GPU surface.
// On home it follows the route stage in document coordinates; elsewhere it
// stays under the toolbar without hiding Tesla's hair.
export function worldFrame(width, height, hero = null, toolbar = 0) {
  const w = Math.max(1, width),
    h = Math.max(1, height);
  if (hero) {
    const mobile = w <= 600;
    const headTop = hero.height * (mobile ? 0.075 : 0.12);
    const headSpace = Math.max(1, Math.min(mobile ? 310 : 345, hero.height * 0.68) - headTop);
    const scale = Math.min((hero.width * (mobile ? 0.7 : 0.42)) / 410, headSpace / 440);
    return {
      left: hero.left + hero.width * 0.5 - 1265 * scale,
      top: hero.top + hero.height * (mobile ? 0.075 : 0.12) - 20 * scale,
      width: 1672 * scale,
      height: 941 * scale,
      absolute: true,
    };
  }
  const available = Math.max(1, h - toolbar);
  const scale = Math.min(Math.max(w / 1672, available / 941), Math.max(1, available - 24) / 460);
  return {
    left: (w - 1672 * scale) * 0.76,
    top: toolbar,
    width: 1672 * scale,
    height: 941 * scale,
    absolute: false,
  };
}
export function worldGaze(frame, x, y, scroll = 0) {
  const localX = x - frame.left,
    localY = y + (frame.absolute ? scroll : 0) - frame.top;
  const clamp = (value) => Math.max(-1, Math.min(1, value));
  const gaze = [
    clamp((localX - frame.width * 0.757) / (frame.width * 0.25)),
    clamp((localY - frame.height * 0.246) / (frame.height * 0.32)),
  ];
  for (const [u, v] of [
    [0.74, 0.249],
    [0.803, 0.233],
  ]) {
    const dx = localX - u * frame.width,
      dy = localY - v * frame.height;
    const distance = Math.hypot(dx, dy, frame.width * 0.075);
    gaze.push(dx / distance, dy / distance);
  }
  return gaze;
}
const neutral = () => [0, 0, 0, 0, 0, 0];
// Import the renderer on the first eligible mouse movement. No GPU work on
// touch, reduced motion, data saver, hidden tabs or while a dialog covers Tesla.
export function mountTeslaWorld(doc, { load = () => loadWorldResources(doc.defaultView) } = {}) {
  const world = doc.querySelector('[data-atmosphere]'),
    image = world?.querySelector('.tesla-world-image'),
    canvas = world?.querySelector('[data-world-surface]');
  if (!image || !canvas) return () => {};
  const view = doc.defaultView,
    root = doc.documentElement;
  const pointer = view.matchMedia?.('(hover: hover) and (pointer: fine)');
  const reduced = view.matchMedia?.('(prefers-reduced-motion: reduce)');
  const connection = view.navigator.connection;
  let renderer,
    pending,
    failed = false,
    disposed = false,
    frame = 0,
    timer = 0;
  let position,
    current = neutral(),
    target = neutral(),
    lastTime = 0;
  let placement,
    observedHero,
    heroVisible = true;
  const allowed = () =>
    !disposed &&
    !doc.hidden &&
    pointer?.matches &&
    !reduced?.matches &&
    !connection?.saveData &&
    (!observedHero || heroVisible) &&
    root.dataset.motion !== 'off' &&
    root.dataset.worldMotion === 'on' &&
    root.dataset.tutorOpen !== 'true';
  const stop = () => {
    if (frame) view.cancelAnimationFrame(frame);
    frame = 0;
    current = neutral();
    target = neutral();
    canvas.hidden = true;
    delete world.dataset.renderer;
    delete world.dataset.look;
    view.clearTimeout(timer);
    if (renderer && !disposed) timer = view.setTimeout(release, 30000);
  };
  function release() {
    renderer?.dispose(false);
    renderer = undefined;
    canvas.width = canvas.height = 1;
  }
  const tick = (time) => {
    frame = 0;
    if (!allowed() || !renderer) return;
    const elapsed = Math.min(50, time - lastTime || 16);
    lastTime = time;
    // Eyes acquire the target first; the slower head follows without hiding
    // their independent movement behind an identical interpolation.
    current = current.map((value, i) => {
      const step = 1 - Math.exp(-elapsed / (i < 2 ? 120 : 40));
      return value + (target[i] - value) * step;
    });
    const settled = current.every((value, i) => Math.abs(value - target[i]) < 0.002);
    if (settled) current = [...target];
    renderer.draw(...current);
    world.dataset.look = current
      .slice(0, 2)
      .map((v) => v.toFixed(3))
      .join(',');
    if (!settled) frame = view.requestAnimationFrame(tick);
  };
  const schedule = () => {
    if (!frame && allowed() && renderer) frame = view.requestAnimationFrame(tick);
  };
  const resize = () => {
    if (!allowed() || !renderer) return;
    renderer.resize(placement.width, placement.height, view.devicePixelRatio);
    renderer.draw(...current);
    schedule();
  };
  function layout() {
    if (disposed) return;
    const hero = doc.querySelector('.knowledge-scene');
    if (hero !== observedHero) {
      resizeObserver?.disconnect();
      intersection?.disconnect();
      heroVisible = true;
      if (hero) resizeObserver?.observe(hero);
      if (hero) intersection?.observe(hero);
      observedHero = hero;
    }
    const box = hero?.getBoundingClientRect();
    const stage =
      box?.width && box.height
        ? { left: box.left, top: box.top + view.scrollY, width: box.width, height: box.height }
        : null;
    const toolbar = doc.querySelector('.topbar')?.getBoundingClientRect().height || 0;
    placement = worldFrame(view.innerWidth, view.innerHeight, stage, toolbar);
    world.dataset.layout = stage ? 'hero' : 'wallpaper';
    for (const node of [image, canvas]) {
      // Keep a stable photographic box. Reframing is a compositor transform,
      // so loading the home scene cannot shift the already painted backdrop.
      Object.assign(node.style, {
        left: '0px',
        top: '0px',
        width: '1672px',
        height: '941px',
        transformOrigin: '0 0',
        transform: `translate3d(${placement.left}px, ${placement.top}px, 0) scale(${placement.width / 1672})`,
      });
    }
    if (position) target = worldGaze(placement, ...position, view.scrollY);
    resize();
    if (position && allowed() && !renderer) void start();
  }
  async function start() {
    if (!allowed() || failed || !image.complete || !image.naturalWidth) return;
    view.clearTimeout(timer);
    if (!renderer) {
      if (!pending) pending = load();
      try {
        const { createWorldRenderer, resources } = await pending;
        if (!allowed()) return;
        renderer ||= createWorldRenderer(canvas, image, resources);
        if (!renderer) {
          failed = true;
          return;
        }
      } catch {
        failed = true;
        return;
      }
    }
    canvas.hidden = false;
    world.dataset.renderer = 'webgl';
    resize();
  }
  const move = (event) => {
    if (!allowed() || event.pointerType === 'touch') return;
    position = [event.clientX, event.clientY];
    target = worldGaze(placement, ...position, view.scrollY);
    if (renderer) schedule();
    else void start();
  };
  const reset = () => {
    target = neutral();
    schedule();
  };
  const sync = () => {
    if (!allowed()) stop();
    else if (position) {
      if (renderer) {
        canvas.hidden = false;
        world.dataset.renderer = 'webgl';
        resize();
      } else void start();
    }
  };
  const lost = (event) => {
    event.preventDefault();
    failed = true;
    renderer?.dispose(false);
    renderer = undefined;
    stop();
  };
  const restored = () => {
    failed = false;
    if (position) void start();
  };
  const observer = new view.MutationObserver(sync);
  const resizeObserver = view.ResizeObserver ? new view.ResizeObserver(layout) : null;
  const intersection = view.IntersectionObserver
    ? new view.IntersectionObserver(([entry]) => {
        heroVisible = entry.isIntersecting;
        sync();
      })
    : null;
  const layoutObserver = new view.MutationObserver(layout);
  layoutObserver.observe(doc.body, { attributes: true, attributeFilter: ['data-view'] });
  layoutObserver.observe(doc.getElementById('content') || doc.body, { childList: true });
  observer.observe(root, {
    attributes: true,
    attributeFilter: ['data-world-motion', 'data-motion', 'data-tutor-open'],
  });
  doc.addEventListener('pointermove', move, { passive: true });
  doc.addEventListener('pointerleave', reset);
  doc.addEventListener('visibilitychange', sync);
  view.addEventListener('resize', layout, { passive: true });
  pointer?.addEventListener?.('change', sync);
  reduced?.addEventListener?.('change', sync);
  connection?.addEventListener?.('change', sync);
  image.addEventListener('load', layout);
  canvas.addEventListener('webglcontextlost', lost);
  canvas.addEventListener('webglcontextrestored', restored);
  layout();
  return () => {
    disposed = true;
    stop();
    release();
    observer.disconnect();
    layoutObserver.disconnect();
    resizeObserver?.disconnect();
    intersection?.disconnect();
    doc.removeEventListener('pointermove', move);
    doc.removeEventListener('pointerleave', reset);
    doc.removeEventListener('visibilitychange', sync);
    view.removeEventListener('resize', layout);
    pointer?.removeEventListener?.('change', sync);
    reduced?.removeEventListener?.('change', sync);
    connection?.removeEventListener?.('change', sync);
    image.removeEventListener('load', layout);
    canvas.removeEventListener('webglcontextlost', lost);
    canvas.removeEventListener('webglcontextrestored', restored);
  };
}
