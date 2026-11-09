import test from 'node:test';
import assert from 'node:assert/strict';
import { mountBrandMotion } from '../js/features/brand-motion.js';
import { installDOM, until } from './support/dom.mjs';

test('brand animation loads only when visible and respects pause, reduced motion, data saving and disposal', async (t) => {
  const dom = installDOM(
    t,
    '<img src="still.webp" data-brand-motion="spin.webp"><img src="still.webp" data-brand-motion="spin.webp">',
  );
  document.documentElement.dataset.release = 'test';
  const images = [...document.images];
  const reduced = new dom.window.EventTarget();
  reduced.matches = false;
  const connection = new dom.window.EventTarget();
  connection.saveData = false;
  Object.defineProperty(dom.window.navigator, 'connection', { value: connection });
  t.mock.method(globalThis, 'matchMedia', () => reduced);
  let intersect,
    disconnected = false;
  dom.window.IntersectionObserver = class {
    constructor(callback) {
      intersect = callback;
    }
    observe() {}
    disconnect() {
      disconnected = true;
    }
  };
  const source = () => images[0].getAttribute('src');
  const dispose = mountBrandMotion(document);
  assert.equal(source(), 'still.webp');
  intersect([{ target: images[0], isIntersecting: true }]);
  assert.equal(source(), 'spin.webp?v=test');
  assert.equal(images[1].getAttribute('src'), 'still.webp');
  document.documentElement.dataset.motion = 'off';
  await until(() => source() === 'still.webp');
  document.documentElement.dataset.motion = 'on';
  await until(() => source() === 'spin.webp?v=test');
  reduced.matches = true;
  reduced.dispatchEvent(new dom.window.Event('change'));
  assert.equal(source(), 'still.webp');
  reduced.matches = false;
  reduced.dispatchEvent(new dom.window.Event('change'));
  connection.saveData = true;
  connection.dispatchEvent(new dom.window.Event('change'));
  assert.equal(source(), 'still.webp');
  connection.saveData = false;
  connection.dispatchEvent(new dom.window.Event('change'));
  Object.defineProperty(document, 'hidden', { configurable: true, value: true });
  document.dispatchEvent(new dom.window.Event('visibilitychange'));
  assert.equal(source(), 'still.webp');
  Object.defineProperty(document, 'hidden', { configurable: true, value: false });
  document.dispatchEvent(new dom.window.Event('visibilitychange'));
  assert.equal(source(), 'spin.webp?v=test');
  intersect([{ target: images[0], isIntersecting: false }]);
  assert.equal(source(), 'still.webp');
  intersect([{ target: images[0], isIntersecting: true }]);
  dispose();
  assert.equal(disconnected, true);
  assert.equal(source(), 'still.webp');
  connection.dispatchEvent(new dom.window.Event('change'));
  reduced.dispatchEvent(new dom.window.Event('change'));
  assert.equal(source(), 'still.webp');
});

test('brand keeps a still image after an animation error and supports older browser APIs', (t) => {
  installDOM(t, '<img src="still.webp" data-brand-motion="spin.webp">');
  const image = document.images[0];
  const dispose = mountBrandMotion(document);
  assert.equal(image.getAttribute('src'), 'spin.webp?v=local');
  image.dispatchEvent(new window.Event('error'));
  assert.equal(image.getAttribute('src'), 'still.webp');
  image.dispatchEvent(new window.Event('error'));
  dispose();
  image.remove();
  mountBrandMotion(document)();
});
