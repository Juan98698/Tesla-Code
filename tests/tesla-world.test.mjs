import test from 'node:test';
import assert from 'node:assert/strict';
import { installDOM, until } from './support/dom.mjs';
import { createWorldRenderer, headMesh } from '../js/features/tesla-world-renderer.js';
import { mountTeslaWorld, worldFrame, worldGaze } from '../js/features/tesla-world.js';
import { context } from './support/world-gl.mjs';
const resources = { background: {}, mask: {} };

test('photo framing keeps the complete head under the toolbar and inside the route stage', () => {
  for (const [w, h] of [
    [1440, 1000],
    [390, 844],
    [2560, 720],
    [320, 568],
  ]) {
    const frame = worldFrame(w, h, null, 72);
    const scale = frame.width / 1672;
    assert.ok(frame.top + 20 * scale >= 72);
    assert.ok(frame.top + 460 * scale <= h);
    assert.ok(Math.abs(frame.width / frame.height - 1672 / 941) < 0.0001);
    const hero = { left: 20, top: 500, width: Math.min(w - 40, 680), height: w <= 600 ? 630 : 540 };
    const portrait = worldFrame(w, h, hero),
      size = portrait.width / 1672;
    assert.equal(portrait.absolute, true);
    assert.ok(portrait.top + 20 * size > hero.top);
    assert.ok(portrait.top + 460 * size < hero.top + (w <= 600 ? 330 : 370));
    assert.ok(portrait.left + 1070 * size > hero.left);
    assert.ok(portrait.left + 1470 * size < hero.left + hero.width);
  }
});
test('head and independent eyes point toward the cursor and converge between the eyes', () => {
  const frame = worldFrame(1440, 1000, { left: 800, top: 120, width: 560, height: 540 });
  const left = worldGaze(frame, 10, 500),
    right = worldGaze(frame, 3000, 500);
  for (const gaze of [left, right])
    assert.ok(gaze.every((value) => Number.isFinite(value) && Math.abs(value) <= 1));
  assert.ok(left[0] < 0 && left[2] < 0 && left[4] < 0);
  assert.ok(right[0] > 0 && right[2] > 0 && right[4] > 0);
  const center = worldGaze(frame, frame.left + frame.width * 0.77, frame.top + frame.height * 0.24);
  assert.ok(center[2] > 0 && center[4] < 0);
  assert.ok(worldGaze(frame, 1000, 0)[3] < 0);
  assert.ok(worldGaze(frame, 1000, 1000)[3] > 0);
  assert.deepEqual(worldGaze(frame, 1000, 300, 200), worldGaze(frame, 1000, 500));
});

test('world renderer bounds DPR and input, draws only on demand and releases owned GPU resources once', () => {
  const { gl, calls } = context(),
    canvas = { getContext: () => gl };
  const renderer = createWorldRenderer(
    canvas,
    { naturalWidth: 1672, naturalHeight: 941 },
    resources,
  );
  assert.equal(calls.filter((c) => c[0] === 'drawArrays').length, 0);
  renderer.resize(1440, 1000, 4);
  assert.equal(canvas.width, 2560);
  assert.ok(canvas.height <= 2560);
  renderer.resize(200, 100);
  assert.equal(canvas.width, 200);
  renderer.resize(0, 0);
  assert.equal(canvas.width, 1);
  renderer.draw(10, -10);
  assert.deepEqual(
    calls.find((c) => c[0] === 'uniform2f'),
    ['uniform2f', 'uLook', 1, -1],
  );
  renderer.dispose();
  renderer.dispose();
  renderer.draw(0, 0);
  for (const [name, count] of [
    ['deleteBuffer', 3],
    ['deleteShader', 2],
    ['deleteTexture', 3],
    ['deleteProgram', 1],
    ['loseContext', 1],
    ['drawArrays', 1],
  ])
    assert.equal(calls.filter((c) => c[0] === name).length, count, name);
});

test('unavailable WebGL, partial allocations, rejected textures and failed shaders preserve static rendering', () => {
  assert.equal(createWorldRenderer({ getContext: () => null }, {}, resources), null);
  assert.equal(
    createWorldRenderer(
      {
        getContext: () => {
          throw Error('Blocked');
        },
      },
      {},
      resources,
    ),
    null,
  );
  for (const failure of [
    'createProgram',
    'createShader',
    'compile',
    'link',
    'createBuffer',
    'createTexture',
    'upload',
  ]) {
    const { gl, calls } = context(failure);
    assert.equal(createWorldRenderer({ getContext: () => gl }, {}, resources), null, failure);
    assert.equal(calls.filter((c) => c[0] === 'loseContext').length, 1);
  }
  const { gl } = context('extension');
  createWorldRenderer({ getContext: () => gl }, {}, resources).dispose();
});

test('head relief preserves source UVs and has a bounded anatomical depth without animated rescaling', () => {
  const { vertices, indices } = headMesh();
  assert.ok(vertices.every(Number.isFinite));
  assert.ok(indices.every((index) => index < vertices.length / 5));
  assert.equal(vertices.length, 37 * 49 * 5);
  assert.equal(indices.length, 36 * 48 * 6);
  for (let i = 0; i < vertices.length; i += 5) {
    assert.ok(vertices[i + 3] >= 0.629 && vertices[i + 3] <= 0.871);
    assert.ok(vertices[i + 4] >= 0 && vertices[i + 4] <= 0.511);
    assert.ok(vertices[i + 2] >= 0 && vertices[i + 2] < 0.2);
  }
});

function fixture(t) {
  const dom = installDOM(
    t,
    '<div data-atmosphere><img class="tesla-world-image"><canvas data-world-surface hidden></canvas></div>',
  );
  const view = dom.window,
    doc = view.document,
    world = doc.querySelector('[data-atmosphere]'),
    image = doc.querySelector('img'),
    canvas = doc.querySelector('canvas');
  view.Image = class {
    set src(value) {
      this.url = value;
      queueMicrotask(() => this.onload?.());
    }
  };
  const pointer = new view.EventTarget(),
    reduced = new view.EventTarget(),
    connection = new view.EventTarget();
  pointer.matches = true;
  reduced.matches = false;
  connection.saveData = false;
  view.matchMedia = (q) => (q.includes('reduced') ? reduced : pointer);
  Object.defineProperty(view.navigator, 'connection', { configurable: true, value: connection });
  doc.documentElement.dataset.worldMotion = 'on';
  Object.defineProperty(image, 'complete', { configurable: true, value: true });
  Object.defineProperty(image, 'naturalWidth', { configurable: true, value: 1672 });
  Object.defineProperty(image, 'naturalHeight', { configurable: true, value: 941 });
  const { gl, calls } = context();
  canvas.getContext = () => gl;
  const frames = new Map();
  let serial = 0,
    time = 0;
  t.mock.method(view, 'requestAnimationFrame', (fn) => {
    frames.set(++serial, fn);
    return serial;
  });
  t.mock.method(view, 'cancelAnimationFrame', (id) => frames.delete(id));
  const advance = () => {
    const work = [...frames.values()];
    frames.clear();
    time += 16;
    work.forEach((fn) => fn(time));
  };
  const flush = () => {
    for (let i = 0; i < 150 && frames.size; i++) advance();
    assert.equal(frames.size, 0, 'animation settles');
  };
  const move = (x = 10, y = 400) =>
    doc.dispatchEvent(new view.MouseEvent('pointermove', { clientX: x, clientY: y }));
  return {
    view,
    doc,
    world,
    image,
    canvas,
    pointer,
    reduced,
    connection,
    calls,
    frames,
    advance,
    flush,
    move,
  };
}

test('wallpaper lazily follows the mouse, settles at rest, pauses for the tutor and recovers context loss', async (t) => {
  const f = fixture(t),
    dispose = mountTeslaWorld(f.doc);
  assert.equal(f.calls.length, 0);
  f.move();
  f.move();
  await until(() => f.world.dataset.renderer === 'webgl');
  f.advance();
  const firstHead = f.calls.filter((call) => call[0] === 'uniform2f').at(-1),
    firstEyes = f.calls.filter((call) => call[0] === 'uniform4f').at(-1);
  assert.ok(
    Math.abs(firstEyes[2]) > Math.abs(firstHead[2]) * 2,
    'Eyes acquire the target before the head',
  );
  f.flush();
  assert.ok(f.world.dataset.look.startsWith('-'));
  assert.equal(f.canvas.hidden, false);
  const before = f.calls.length;
  f.flush();
  assert.equal(f.calls.length, before);
  f.view.dispatchEvent(new f.view.Event('resize'));
  f.flush();
  f.doc.documentElement.dataset.tutorOpen = 'true';
  await until(() => f.canvas.hidden);
  assert.equal(f.frames.size, 0);
  delete f.doc.documentElement.dataset.tutorOpen;
  await until(() => !f.canvas.hidden);
  f.flush();
  f.canvas.dispatchEvent(new f.view.Event('webglcontextlost', { cancelable: true }));
  assert.equal(f.canvas.hidden, true);
  f.move();
  await Promise.resolve();
  assert.equal(f.canvas.hidden, true);
  f.canvas.dispatchEvent(new f.view.Event('webglcontextrestored'));
  await until(() => !f.canvas.hidden);
  f.flush();
  f.doc.dispatchEvent(new f.view.Event('pointerleave'));
  f.flush();
  assert.equal(f.world.dataset.look, '0.000,0.000');
  dispose();
  dispose();
  f.move();
  f.view.dispatchEvent(new f.view.Event('resize'));
  f.flush();
  assert.equal(f.canvas.hidden, true);
});

test('motion, coarse pointers, data saver, hidden tabs and failed images never start GPU work', async (t) => {
  const f = fixture(t);
  const dispose = mountTeslaWorld(f.doc);
  for (const [object, key] of [
    [f.pointer, 'matches'],
    [f.reduced, 'matches'],
    [f.connection, 'saveData'],
  ]) {
    const value = object[key];
    object[key] = !value;
    f.move();
    await Promise.resolve();
    assert.equal(f.calls.length, 0);
    object[key] = value;
  }
  f.doc.documentElement.dataset.motion = 'off';
  f.move();
  await Promise.resolve();
  assert.equal(f.calls.length, 0);
  f.doc.documentElement.dataset.motion = 'on';
  Object.defineProperty(f.doc, 'hidden', { configurable: true, value: true });
  f.move();
  Object.defineProperty(f.doc, 'hidden', { configurable: true, value: false });
  Object.defineProperty(f.image, 'naturalWidth', { value: 0 });
  f.move();
  assert.equal(f.calls.length, 0);
  dispose();
  const noRoot = mountTeslaWorld(f.view.document.implementation.createHTMLDocument());
  noRoot();
});

test('pending imports cannot resurrect a disposed scene; failed imports or WebGL stay static', async (t) => {
  const f = fixture(t);
  let resolve;
  const pending = new Promise((done) => (resolve = done));
  const dispose = mountTeslaWorld(f.doc, { load: () => pending });
  f.move();
  dispose();
  resolve({ createWorldRenderer });
  await Promise.resolve();
  await Promise.resolve();
  assert.equal(f.calls.length, 0);
  assert.equal(f.canvas.hidden, true);
  const failed = mountTeslaWorld(f.doc, { load: () => Promise.reject(Error('Offline')) });
  f.move();
  await Promise.resolve();
  await Promise.resolve();
  f.move();
  failed();
  assert.equal(f.calls.length, 0);
  const unavailable = mountTeslaWorld(f.doc, {
    load: async () => ({ createWorldRenderer: () => null }),
  });
  f.move();
  await Promise.resolve();
  await Promise.resolve();
  f.move();
  unavailable();
  assert.equal(f.canvas.hidden, true);
});

test('pausing cancels interpolation and releases GPU resources after a sustained pause', async (t) => {
  const f = fixture(t),
    dispose = mountTeslaWorld(f.doc);
  f.move();
  await until(() => !f.canvas.hidden);
  f.flush();
  t.mock.timers.enable({ apis: ['setTimeout'] });
  f.reduced.matches = true;
  f.reduced.dispatchEvent(new f.view.Event('change'));
  assert.equal(f.canvas.hidden, true);
  t.mock.timers.tick(30000);
  assert.ok(f.calls.some((c) => c[0] === 'deleteTexture'));
  assert.equal(f.calls.filter((c) => c[0] === 'loseContext').length, 0);
  f.reduced.matches = false;
  f.reduced.dispatchEvent(new f.view.Event('change'));
  await Promise.resolve();
  await Promise.resolve();
  f.flush();
  assert.equal(f.canvas.hidden, false);
  f.connection.saveData = true;
  f.connection.dispatchEvent(new f.view.Event('change'));
  assert.equal(f.canvas.hidden, true);
  dispose();
});

test('the photo follows stage layout and releases motion when the stage leaves the viewport', async (t) => {
  const f = fixture(t);
  const hero = f.doc.createElement('div');
  hero.className = 'knowledge-scene';
  f.doc.body.append(hero);
  let box = { left: 400, top: 100, width: 560, height: 540 },
    resized,
    intersected,
    released = 0;
  hero.getBoundingClientRect = () => box;
  f.view.ResizeObserver = class {
    constructor(callback) {
      resized = callback;
    }
    observe() {}
    disconnect() {
      released++;
    }
  };
  f.view.IntersectionObserver = class {
    constructor(callback) {
      intersected = callback;
    }
    observe() {}
    disconnect() {
      released++;
    }
  };
  const dispose = mountTeslaWorld(f.doc);
  assert.equal(f.world.dataset.layout, 'hero');
  f.move();
  await until(() => !f.canvas.hidden);
  f.flush();
  intersected([{ isIntersecting: false }]);
  assert.equal(f.canvas.hidden, true);
  intersected([{ isIntersecting: true }]);
  await until(() => !f.canvas.hidden);
  f.flush();
  const before = f.image.style.transform;
  box = { ...box, left: 450 };
  resized();
  f.flush();
  assert.notEqual(f.image.style.transform, before);
  hero.remove();
  await until(() => f.world.dataset.layout === 'wallpaper');
  f.flush();
  dispose();
  assert.ok(released >= 4);
});
