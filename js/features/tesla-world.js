// Import the renderer on the first eligible mouse movement. No GPU work on
// touch, reduced motion, data saver, hidden tabs or while a dialog covers Tesla.
export function mountTeslaWorld(doc, { load = () => import('./tesla-world-renderer.js') } = {}) {
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
    current = [0, 0],
    target = [0, 0],
    lastTime = 0;
  const allowed = () =>
    !disposed &&
    !doc.hidden &&
    pointer?.matches &&
    !reduced?.matches &&
    !connection?.saveData &&
    root.dataset.motion !== 'off' &&
    root.dataset.worldMotion === 'on' &&
    root.dataset.tutorOpen !== 'true';
  const stop = () => {
    if (frame) view.cancelAnimationFrame(frame);
    frame = 0;
    current = target = [0, 0];
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
    const step = Math.min(0.42, 1 - Math.exp(-Math.min(50, time - lastTime || 16) / 75));
    lastTime = time;
    current = current.map((value, i) => value + (target[i] - value) * step);
    const settled = current.every((value, i) => Math.abs(value - target[i]) < 0.002);
    if (settled) current = [...target];
    renderer.draw(...current);
    world.dataset.look = current.map((v) => v.toFixed(3)).join(',');
    if (!settled) frame = view.requestAnimationFrame(tick);
  };
  const schedule = () => {
    if (!frame && allowed() && renderer) frame = view.requestAnimationFrame(tick);
  };
  const resize = () => {
    if (!allowed() || !renderer) return;
    renderer.resize(view.innerWidth, view.innerHeight, view.devicePixelRatio);
    renderer.draw(...current);
    schedule();
  };
  async function start() {
    if (!allowed() || failed || !image.complete || !image.naturalWidth) return;
    view.clearTimeout(timer);
    if (!renderer) {
      if (!pending) pending = load();
      try {
        const { createWorldRenderer } = await pending;
        if (!allowed()) return;
        renderer ||= createWorldRenderer(canvas, image);
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
    const width = view.innerWidth,
      height = view.innerHeight,
      source = 1672 / 941;
    const sx = Math.min(1, width / height / source),
      sy = Math.min(1, (source * height) / width);
    const faceX = ((0.765 - (1 - sx) * 0.76) / sx) * width;
    const faceY = ((0.25 - (1 - sy) * 0.5) / sy) * height;
    const clamp = (value) => Math.max(-1, Math.min(1, value));
    target = [
      clamp((position[0] - faceX) / (width * 0.55)),
      clamp((position[1] - faceY) / (height * 0.65)),
    ];
    if (renderer) schedule();
    else void start();
  };
  const reset = () => {
    target = [0, 0];
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
  observer.observe(root, {
    attributes: true,
    attributeFilter: ['data-world-motion', 'data-motion', 'data-tutor-open'],
  });
  doc.addEventListener('pointermove', move, { passive: true });
  doc.addEventListener('pointerleave', reset);
  doc.addEventListener('visibilitychange', sync);
  view.addEventListener('resize', resize, { passive: true });
  pointer?.addEventListener?.('change', sync);
  reduced?.addEventListener?.('change', sync);
  connection?.addEventListener?.('change', sync);
  image.addEventListener('load', sync);
  canvas.addEventListener('webglcontextlost', lost);
  canvas.addEventListener('webglcontextrestored', restored);
  return () => {
    disposed = true;
    stop();
    release();
    observer.disconnect();
    doc.removeEventListener('pointermove', move);
    doc.removeEventListener('pointerleave', reset);
    doc.removeEventListener('visibilitychange', sync);
    view.removeEventListener('resize', resize);
    pointer?.removeEventListener?.('change', sync);
    reduced?.removeEventListener?.('change', sync);
    connection?.removeEventListener?.('change', sync);
    image.removeEventListener('load', sync);
    canvas.removeEventListener('webglcontextlost', lost);
    canvas.removeEventListener('webglcontextrestored', restored);
  };
}
