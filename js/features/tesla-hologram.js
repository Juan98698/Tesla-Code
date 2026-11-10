import { assetUrl } from '../core/assets.js';
import { createPortraitRenderer } from './tesla-renderer.js';

export function teslaHologram() {
  return `<div class="tesla-hologram" data-tesla-hologram>
    <div class="tesla-beam"></div>
    <div class="tesla-head" data-tesla-head>
      <img class="tesla-reference" src="${assetUrl('assets/hologram/nikola-reference.webp')}" width="512" height="560" alt="" decoding="async" loading="lazy" data-tesla-image>
      <canvas class="tesla-surface" data-tesla-surface hidden></canvas>
    </div>
    <div class="tesla-projector"><i></i><i></i><span></span></div>
  </div>`;
}

// The supplied portrait remains the fallback. Allocate the relief renderer only
// when the visible scene accepts mouse interaction; no animation runs at rest.
export function mountTeslaHologram(root) {
  const portrait = root.querySelector('[data-tesla-hologram]');
  if (!portrait) return null;
  const image = portrait.querySelector('[data-tesla-image]');
  const canvas = portrait.querySelector('[data-tesla-surface]');
  const view = root.ownerDocument.defaultView;
  let renderer,
    active = false,
    disposed = false,
    failed = false,
    look = [0, 0];
  const showStatic = () => {
    canvas.hidden = true;
    delete portrait.dataset.renderer;
  };
  const resize = () => {
    if (!active || !renderer) return;
    renderer.resize(canvas.clientWidth, canvas.clientHeight, view.devicePixelRatio);
    renderer.draw(...look);
  };
  const start = () => {
    if (disposed || !active || failed || !image.complete || !image.naturalWidth) return;
    renderer ||= createPortraitRenderer(canvas, image);
    if (!renderer) {
      failed = true;
      return;
    }
    canvas.hidden = false;
    portrait.dataset.renderer = 'webgl';
    resize();
  };
  const lost = (event) => {
    event.preventDefault();
    failed = true;
    renderer?.dispose(false);
    renderer = null;
    showStatic();
  };
  const restored = () => {
    failed = false;
    start();
  };
  const resizeObserver = view.ResizeObserver ? new view.ResizeObserver(resize) : null;
  resizeObserver?.observe(portrait);
  if (!resizeObserver) view.addEventListener('resize', resize);
  image.addEventListener('load', start);
  canvas.addEventListener('webglcontextlost', lost);
  canvas.addEventListener('webglcontextrestored', restored);
  return {
    onActive(value) {
      active = value;
      if (active) start();
      else {
        look = [0, 0];
        showStatic();
      }
    },
    onPointer(x, y) {
      look = [x, y];
      if (active) renderer?.draw(x, y);
    },
    dispose() {
      disposed = true;
      active = false;
      renderer?.dispose();
      renderer = null;
      resizeObserver?.disconnect();
      view.removeEventListener('resize', resize);
      image.removeEventListener('load', start);
      canvas.removeEventListener('webglcontextlost', lost);
      canvas.removeEventListener('webglcontextrestored', restored);
      showStatic();
    },
  };
}
