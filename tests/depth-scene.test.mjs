import test from 'node:test';
import assert from 'node:assert/strict';
import { mountDepthScene } from '../js/features/depth-scene.js';
import { installDOM, until } from './support/dom.mjs';

test('depth coalesces pointer work and releases frames and observers when paused, hidden or disposed', async (t) => {
  const dom = installDOM(t, '<main id="root"><div data-depth-scene></div></main>');
  const root = document.getElementById('root'),
    scene = root.firstElementChild;
  const reduced = new dom.window.EventTarget(),
    pointer = new dom.window.EventTarget();
  reduced.matches = false;
  pointer.matches = true;
  t.mock.method(globalThis, 'matchMedia', (query) =>
    query.includes('reduced') ? reduced : pointer,
  );
  const frames = new Map();
  let serial = 0,
    observe,
    disconnected = false;
  t.mock.method(dom.window, 'requestAnimationFrame', (callback) => {
    frames.set(++serial, callback);
    return serial;
  });
  t.mock.method(dom.window, 'cancelAnimationFrame', (id) => frames.delete(id));
  dom.window.IntersectionObserver = class {
    constructor(callback) {
      observe = callback;
    }
    observe() {}
    disconnect() {
      disconnected = true;
    }
  };
  let box = { left: 0, top: 0, width: 200, height: 100 };
  t.mock.method(scene, 'getBoundingClientRect', () => box);
  const move = () =>
    scene.dispatchEvent(new dom.window.MouseEvent('pointermove', { clientX: 300, clientY: 20 }));
  const flush = () => {
    const callbacks = [...frames.values()];
    frames.clear();
    callbacks.forEach((callback) => callback());
  };
  document.documentElement.dataset.motion = 'on';
  const dispose = mountDepthScene(root);
  assert.equal(scene.dataset.sceneActive, 'true');
  move();
  move();
  assert.equal(frames.size, 1);
  flush();
  assert.ok(Math.abs(parseFloat(scene.style.getPropertyValue('--pointer-x'))) <= 7);
  scene.dispatchEvent(new dom.window.Event('pointerleave'));
  assert.equal(scene.style.getPropertyValue('--pointer-x'), '');
  move();
  document.documentElement.dataset.motion = 'off';
  await until(() => scene.dataset.sceneActive === 'false');
  assert.equal(frames.size, 0);
  move();
  assert.equal(frames.size, 0);
  document.documentElement.dataset.motion = 'on';
  await until(() => scene.dataset.sceneActive === 'true');
  reduced.matches = true;
  reduced.dispatchEvent(new dom.window.Event('change'));
  assert.equal(scene.dataset.sceneActive, 'false');
  reduced.matches = false;
  pointer.matches = false;
  pointer.dispatchEvent(new dom.window.Event('change'));
  assert.equal(scene.dataset.sceneActive, 'false');
  pointer.matches = true;
  pointer.dispatchEvent(new dom.window.Event('change'));
  observe([{ isIntersecting: false }]);
  assert.equal(scene.dataset.sceneActive, 'false');
  observe([{ isIntersecting: true }]);
  Object.defineProperty(document, 'hidden', { configurable: true, value: true });
  document.dispatchEvent(new dom.window.Event('visibilitychange'));
  assert.equal(scene.dataset.sceneActive, 'false');
  Object.defineProperty(document, 'hidden', { configurable: true, value: false });
  document.dispatchEvent(new dom.window.Event('visibilitychange'));
  box = { left: 0, top: 0, width: 0, height: 0 };
  move();
  flush();
  assert.ok(Number.isFinite(parseFloat(scene.style.getPropertyValue('--pointer-x'))));
  move();
  dispose();
  assert.equal(frames.size, 0);
  assert.equal(disconnected, true);
  assert.equal(scene.dataset.sceneActive, 'false');
  document.documentElement.dataset.motion = 'on';
  pointer.dispatchEvent(new dom.window.Event('change'));
  move();
  assert.equal(frames.size, 0);
});

test('static hosts and roots without a scene need no observers or animation work', (t) => {
  installDOM(t);
  const root = document.getElementById('root');
  mountDepthScene(root)();
  root.innerHTML = '<div data-depth-scene></div>';
  const dispose = mountDepthScene(root);
  assert.equal(root.firstElementChild.dataset.sceneActive, 'false');
  dispose();
});

test('Tesla follows a document pointer with bounded independent eyes and cleans up on remount', (t) => {
  const dom = installDOM(
    t,
    '<main id="root"><div data-depth-scene data-gaze-tracking></div></main>',
  );
  const root = document.getElementById('root'),
    scene = root.firstElementChild;
  t.mock.method(globalThis, 'matchMedia', (query) => ({ matches: !query.includes('reduced') }));
  const frames = new Map();
  let serial = 0;
  t.mock.method(dom.window, 'requestAnimationFrame', (callback) => {
    frames.set(++serial, callback);
    return serial;
  });
  t.mock.method(dom.window, 'cancelAnimationFrame', (id) => frames.delete(id));
  t.mock.method(scene, 'getBoundingClientRect', () => ({
    left: 500,
    top: 100,
    width: 400,
    height: 300,
  }));
  const move = (clientX, clientY) =>
    document.dispatchEvent(new dom.window.MouseEvent('pointermove', { clientX, clientY }));
  const flush = () => {
    const callbacks = [...frames.values()];
    frames.clear();
    callbacks.forEach((callback) => callback());
  };
  for (let mount = 0; mount < 3; mount++) {
    const positions = [],
      activity = [];
    const dispose = mountDepthScene(root, {
      onPointer: (...point) => positions.push(point),
      onActive: (value) => activity.push(value),
    });
    move(100, -100);
    move(0, -200);
    assert.equal(frames.size, 1, 'One frame for a burst of events outside the scene');
    flush();
    assert.equal(scene.style.getPropertyValue('--pointer-x'), '-7deg');
    assert.equal(scene.style.getPropertyValue('--pointer-y'), '7deg');
    assert.equal(scene.style.getPropertyValue('--gaze-x'), '-4px');
    assert.equal(scene.style.getPropertyValue('--gaze-y'), '-2.5px');
    assert.deepEqual(positions.at(-1), [-1, -1]);
    move(2000, 2000);
    flush();
    assert.equal(scene.style.getPropertyValue('--pointer-x'), '7deg');
    assert.equal(scene.style.getPropertyValue('--pointer-y'), '-7deg');
    assert.equal(scene.style.getPropertyValue('--gaze-x'), '4px');
    assert.equal(scene.style.getPropertyValue('--gaze-y'), '2.5px');
    document.dispatchEvent(new dom.window.Event('pointerleave'));
    assert.equal(scene.style.getPropertyValue('--gaze-x'), '');
    assert.equal(scene.style.getPropertyValue('--pointer-x'), '');
    move(700, 220);
    flush();
    assert.equal(scene.style.getPropertyValue('--gaze-x'), '0px');
    assert.equal(scene.style.getPropertyValue('--gaze-y'), '0px');
    move(800, 300);
    dispose();
    assert.equal(scene.style.getPropertyValue('--gaze-y'), '');
    assert.equal(activity.at(-1), false);
    assert.equal(frames.size, 0);
    move(800, 300);
    assert.equal(frames.size, 0, 'No retained document listener after disposal');
  }
});
