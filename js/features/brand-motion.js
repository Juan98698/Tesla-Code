import { assetUrl } from '../core/assets.js';

// A small animated WebP is requested only for a visible navigation logo.
// Swapping back to the still image also stops decoding the animation.
export function mountBrandMotion(doc) {
  const images = [...doc.querySelectorAll('[data-brand-motion]')];
  if (!images.length) return () => {};
  const view = doc.defaultView;
  const reduced = globalThis.matchMedia?.('(prefers-reduced-motion: reduce)');
  const connection = view.navigator.connection;
  const entries = images.map((image) => ({
    image,
    still: image.getAttribute('src'),
    animated: assetUrl(image.dataset.brandMotion),
    visible: !view.IntersectionObserver,
    failed: false,
  }));
  let disposed = false;
  const sync = () => {
    const enabled =
      !disposed &&
      !doc.hidden &&
      !reduced?.matches &&
      !connection?.saveData &&
      doc.documentElement.dataset.motion !== 'off';
    for (const entry of entries) {
      const source = enabled && entry.visible && !entry.failed ? entry.animated : entry.still;
      if (entry.image.getAttribute('src') !== source) entry.image.setAttribute('src', source);
    }
  };
  const intersection = view.IntersectionObserver
    ? new view.IntersectionObserver((changes) => {
        for (const change of changes)
          entries.find((entry) => entry.image === change.target).visible = change.isIntersecting;
        sync();
      })
    : null;
  const fail = (event) => {
    entries.find((entry) => entry.image === event.target).failed = true;
    sync();
  };
  for (const { image } of entries) {
    intersection?.observe(image);
    image.addEventListener('error', fail);
  }
  const motion = new view.MutationObserver(sync);
  motion.observe(doc.documentElement, { attributes: true, attributeFilter: ['data-motion'] });
  doc.addEventListener('visibilitychange', sync);
  reduced?.addEventListener?.('change', sync);
  connection?.addEventListener?.('change', sync);
  sync();
  return () => {
    disposed = true;
    sync();
    intersection?.disconnect();
    motion.disconnect();
    doc.removeEventListener('visibilitychange', sync);
    reduced?.removeEventListener?.('change', sync);
    connection?.removeEventListener?.('change', sync);
    for (const { image } of entries) image.removeEventListener('error', fail);
  };
}
