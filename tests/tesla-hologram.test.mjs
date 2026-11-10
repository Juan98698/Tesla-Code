import test from 'node:test';
import assert from 'node:assert/strict';
import { installDOM } from './support/dom.mjs';
import { portraitMesh, createPortraitRenderer } from '../js/features/tesla-renderer.js';
import { teslaHologram, mountTeslaHologram } from '../js/features/tesla-hologram.js';

function context(failure) {
  const calls = [];
  const gl = {};
  for (const name of [
    'VERTEX_SHADER',
    'FRAGMENT_SHADER',
    'COMPILE_STATUS',
    'LINK_STATUS',
    'ARRAY_BUFFER',
    'ELEMENT_ARRAY_BUFFER',
    'STATIC_DRAW',
    'FLOAT',
    'TEXTURE0',
    'TEXTURE_2D',
    'TEXTURE_WRAP_S',
    'TEXTURE_WRAP_T',
    'CLAMP_TO_EDGE',
    'TEXTURE_MIN_FILTER',
    'TEXTURE_MAG_FILTER',
    'LINEAR',
    'RGBA',
    'UNSIGNED_BYTE',
    'COLOR_BUFFER_BIT',
    'TRIANGLES',
    'UNSIGNED_SHORT',
  ])
    gl[name] = name;
  for (const name of [
    'shaderSource',
    'compileShader',
    'attachShader',
    'linkProgram',
    'useProgram',
    'bindBuffer',
    'bufferData',
    'enableVertexAttribArray',
    'vertexAttribPointer',
    'activeTexture',
    'bindTexture',
    'texParameteri',
    'uniform1i',
    'uniform2f',
    'clearColor',
    'viewport',
    'clear',
    'drawElements',
    'deleteBuffer',
    'deleteShader',
    'deleteTexture',
    'deleteProgram',
  ])
    gl[name] = (...args) => calls.push([name, ...args]);
  for (const name of ['createProgram', 'createShader', 'createBuffer', 'createTexture'])
    gl[name] = () => (name === failure ? null : {});
  gl.getShaderParameter = () => failure !== 'compile';
  gl.getProgramParameter = () => failure !== 'link';
  gl.getAttribLocation = () => 0;
  gl.getUniformLocation = (program, name) => name;
  gl.getExtension = () =>
    failure === 'extension' ? null : { loseContext: () => calls.push(['loseContext']) };
  gl.texImage2D = () => {
    if (failure === 'upload') throw Error('Texture rejected');
  };
  return { gl, calls };
}

test('portrait relief has bounded topology, preserved UVs and more depth at the nose than the edge', () => {
  const { vertices, indices } = portraitMesh();
  assert.equal(vertices.length, 41 * 49 * 5);
  assert.equal(indices.length, 40 * 48 * 6);
  assert.ok(vertices.every(Number.isFinite));
  assert.ok(indices.every((index) => index < vertices.length / 5));
  for (let i = 0; i < vertices.length; i += 5) {
    assert.ok(vertices[i + 3] >= 0 && vertices[i + 3] <= 1);
    assert.ok(vertices[i + 4] >= 0 && vertices[i + 4] <= 1);
  }
  const at = (column, row) => vertices[(row * 41 + column) * 5 + 2];
  assert.ok(at(21, 25) > at(14, 25));
  assert.ok(at(21, 25) > at(21, 0));
});

test('renderer clamps input and DPR, draws on demand and releases every owned GPU object once', () => {
  const { gl, calls } = context();
  const canvas = { getContext: () => gl };
  const renderer = createPortraitRenderer(canvas, {});
  assert.ok(renderer);
  assert.equal(calls.filter((call) => call[0] === 'drawElements').length, 0);
  renderer.resize(216, 236, 4);
  assert.equal(canvas.width, 432);
  assert.equal(canvas.height, 472);
  renderer.resize(0, 0);
  assert.equal(canvas.width, 1);
  assert.equal(canvas.height, 1);
  renderer.draw(10, -10);
  assert.deepEqual(
    calls.find((call) => call[0] === 'uniform2f'),
    ['uniform2f', 'uLook', 1, -1],
  );
  assert.equal(calls.filter((call) => call[0] === 'drawElements').length, 1);
  renderer.dispose();
  renderer.dispose();
  renderer.draw(0, 0);
  for (const [name, count] of [
    ['deleteBuffer', 2],
    ['deleteShader', 2],
    ['deleteTexture', 1],
    ['deleteProgram', 1],
    ['loseContext', 1],
  ])
    assert.equal(calls.filter((call) => call[0] === name).length, count, name);
  assert.equal(calls.filter((call) => call[0] === 'drawElements').length, 1);
});

test('unavailable graphics, partial allocation, shader failure and rejected texture leave a static fallback', () => {
  assert.equal(createPortraitRenderer({ getContext: () => null }, {}), null);
  assert.equal(
    createPortraitRenderer(
      {
        getContext: () => {
          throw Error('Blocked');
        },
      },
      {},
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
    assert.equal(createPortraitRenderer({ getContext: () => gl }, {}), null, failure);
    assert.equal(calls.filter((call) => call[0] === 'loseContext').length, 1);
  }
  const { gl } = context('extension');
  createPortraitRenderer({ getContext: () => gl }, {}).dispose();
});

test('portrait waits for an active visible scene and loaded image, pauses, restores and disposes listeners', (t) => {
  const dom = installDOM(t),
    root = document.getElementById('root');
  assert.equal(mountTeslaHologram(root), null);
  root.innerHTML = teslaHologram();
  const image = root.querySelector('img'),
    canvas = root.querySelector('canvas'),
    portrait = root.firstElementChild;
  let loaded = false,
    allocations = 0;
  Object.defineProperty(image, 'complete', { get: () => loaded });
  Object.defineProperty(image, 'naturalWidth', { get: () => (loaded ? 512 : 0) });
  const { gl, calls } = context();
  canvas.getContext = () => {
    allocations++;
    return gl;
  };
  const effect = mountTeslaHologram(root);
  effect.onActive(false);
  effect.onPointer(1, 1);
  image.dispatchEvent(new dom.window.Event('load'));
  assert.equal(allocations, 0);
  effect.onActive(true);
  assert.equal(allocations, 0);
  loaded = true;
  image.dispatchEvent(new dom.window.Event('load'));
  assert.equal(portrait.dataset.renderer, 'webgl');
  assert.equal(canvas.hidden, false);
  effect.onPointer(0.5, -0.5);
  assert.deepEqual(calls.filter((c) => c[0] === 'uniform2f').at(-1), [
    'uniform2f',
    'uLook',
    0.5,
    -0.5,
  ]);
  const count = () => calls.filter((c) => c[0] === 'drawElements').length;
  const before = count();
  dom.window.dispatchEvent(new dom.window.Event('resize'));
  assert.equal(count(), before + 1);
  effect.onActive(false);
  assert.equal(canvas.hidden, true);
  assert.equal(portrait.dataset.renderer, undefined);
  const paused = count();
  effect.onPointer(1, 1);
  dom.window.dispatchEvent(new dom.window.Event('resize'));
  assert.equal(count(), paused);
  effect.onActive(true);
  assert.equal(allocations, 1);
  canvas.dispatchEvent(new dom.window.Event('webglcontextlost', { cancelable: true }));
  assert.equal(canvas.hidden, true);
  effect.onActive(true);
  assert.equal(allocations, 1);
  canvas.dispatchEvent(new dom.window.Event('webglcontextrestored'));
  assert.equal(allocations, 2);
  effect.dispose();
  const released = count();
  image.dispatchEvent(new dom.window.Event('load'));
  dom.window.dispatchEvent(new dom.window.Event('resize'));
  canvas.dispatchEvent(new dom.window.Event('webglcontextrestored'));
  effect.onActive(true);
  assert.equal(count(), released);
  assert.equal(canvas.hidden, true);
});

test('portrait uses ResizeObserver when available and tolerates missing WebGL and failed images', (t) => {
  const dom = installDOM(t),
    root = document.getElementById('root');
  root.innerHTML = teslaHologram();
  let resize,
    disconnected = false,
    allocations = 0;
  dom.window.ResizeObserver = class {
    constructor(callback) {
      resize = callback;
    }
    observe() {}
    disconnect() {
      disconnected = true;
    }
  };
  const image = root.querySelector('img'),
    canvas = root.querySelector('canvas');
  Object.defineProperty(image, 'complete', { value: true });
  let width = 0;
  Object.defineProperty(image, 'naturalWidth', { get: () => width });
  canvas.getContext = () => {
    allocations++;
    return null;
  };
  const effect = mountTeslaHologram(root);
  effect.onActive(true);
  assert.equal(allocations, 0);
  width = 512;
  image.dispatchEvent(new dom.window.Event('load'));
  effect.onActive(true);
  resize();
  effect.onPointer(1, 1);
  assert.equal(allocations, 1);
  assert.equal(canvas.hidden, true);
  effect.dispose();
  assert.equal(disconnected, true);
});
