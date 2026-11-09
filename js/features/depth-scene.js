// Only decorative layers move. Route buttons keep their screen position and native semantics.
export function mountDepthScene(root) {
  const scene = root.querySelector('[data-depth-scene]');
  if (!scene) return () => {};
  const doc = root.ownerDocument;
  const view = doc.defaultView;
  const reduced = globalThis.matchMedia?.('(prefers-reduced-motion: reduce)');
  const pointer = globalThis.matchMedia?.('(hover: hover) and (pointer: fine)');
  let visible = true,
    active = false,
    disposed = false,
    frame = 0,
    position;
  const reset = () => {
    if (frame) view.cancelAnimationFrame(frame);
    frame = 0;
    scene.style.removeProperty('--pointer-x');
    scene.style.removeProperty('--pointer-y');
  };
  const sync = () => {
    active =
      !disposed &&
      visible &&
      !doc.hidden &&
      !reduced?.matches &&
      Boolean(pointer?.matches) &&
      doc.documentElement.dataset.motion !== 'off';
    scene.dataset.sceneActive = String(active);
    if (!active) reset();
  };
  const move = (event) => {
    if (!active) return;
    position = { x: event.clientX, y: event.clientY };
    if (frame) return;
    frame = view.requestAnimationFrame(() => {
      frame = 0;
      const box = scene.getBoundingClientRect();
      const clamp = (value) => Math.max(-1, Math.min(1, value));
      scene.style.setProperty(
        '--pointer-x',
        `${clamp(((position.x - box.left) / (box.width || 1)) * 2 - 1) * 7}deg`,
      );
      scene.style.setProperty(
        '--pointer-y',
        `${clamp(((position.y - box.top) / (box.height || 1)) * 2 - 1) * -7}deg`,
      );
    });
  };
  const intersection = view.IntersectionObserver
    ? new view.IntersectionObserver(([entry]) => {
        visible = entry.isIntersecting;
        sync();
      })
    : null;
  intersection?.observe(scene);
  const motion = new view.MutationObserver(sync);
  motion.observe(doc.documentElement, { attributes: true, attributeFilter: ['data-motion'] });
  scene.addEventListener('pointermove', move, { passive: true });
  scene.addEventListener('pointerleave', reset);
  doc.addEventListener('visibilitychange', sync);
  reduced?.addEventListener?.('change', sync);
  pointer?.addEventListener?.('change', sync);
  sync();
  return () => {
    disposed = true;
    sync();
    intersection?.disconnect();
    motion.disconnect();
    scene.removeEventListener('pointermove', move);
    scene.removeEventListener('pointerleave', reset);
    doc.removeEventListener('visibilitychange', sync);
    reduced?.removeEventListener?.('change', sync);
    pointer?.removeEventListener?.('change', sync);
  };
}
