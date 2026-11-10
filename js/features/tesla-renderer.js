// A shallow relief of the supplied portrait, not a reconstructed 360° model.
// UVs preserve the original features. Feathered eye masks move the photographed
// irises independently, keeping the eyebrows and eyelids in place.
const vertexSource = `
attribute vec3 aPoint;
attribute vec2 aUv;
uniform mediump vec2 uLook;
varying vec2 vUv;
void main() {
  vec3 p = aPoint - vec3(0.0, -0.43, 0.0);
  float yaw = uLook.x * 0.20;
  float pitch = uLook.y * 0.14;
  vec3 turned = vec3(p.x*cos(yaw) + p.z*sin(yaw), p.y, -p.x*sin(yaw) + p.z*cos(yaw));
  turned = vec3(turned.x, turned.y*cos(pitch) - turned.z*sin(pitch), turned.y*sin(pitch) + turned.z*cos(pitch));
  turned += vec3(0.0, -0.43, 0.0);
  float head = 1.0 - smoothstep(0.70, 0.88, aUv.y);
  vec3 position = mix(aPoint, turned, head);
  gl_Position = vec4(position.x / (1199.0/1312.0), position.y, 0.0, 1.0);
  vUv = aUv;
}`;
const fragmentSource = `
precision mediump float;
uniform sampler2D uPortrait;
uniform mediump vec2 uLook;
varying vec2 vUv;
float eye(vec2 center) {
  float distance = length((vUv - center) / vec2(0.044, 0.016));
  return 1.0 - smoothstep(0.55, 1.0, distance);
}
void main() {
  float eyes = max(eye(vec2(0.416, 0.421)), eye(vec2(0.621, 0.420)));
  vec2 uv = vUv - uLook * vec2(0.009, 0.004) * eyes;
  gl_FragColor = texture2D(uPortrait, uv);
}`;

export function portraitMesh() {
  const columns = 40,
    rows = 48,
    vertices = [],
    indices = [];
  const bump = (x, y, cx, cy, rx, ry) => Math.exp(-(((x - cx) / rx) ** 2) - ((y - cy) / ry) ** 2);
  for (let row = 0; row <= rows; row++) {
    for (let column = 0; column <= columns; column++) {
      const u = column / columns,
        v = row / rows;
      const dome = Math.sqrt(Math.max(0, 1 - ((u - 0.52) / 0.34) ** 2 - ((v - 0.4) / 0.4) ** 2));
      const depth =
        0.14 * dome +
        0.13 * bump(u, v, 0.52, 0.53, 0.032, 0.085) -
        0.025 * (bump(u, v, 0.416, 0.42, 0.055, 0.025) + bump(u, v, 0.621, 0.42, 0.055, 0.025));
      vertices.push((u - 0.5) * 2 * (1199 / 1312), (0.5 - v) * 2, depth, u, v);
      if (row < rows && column < columns) {
        const a = row * (columns + 1) + column,
          b = a + columns + 1;
        indices.push(a, b, a + 1, a + 1, b, b + 1);
      }
    }
  }
  return { vertices: new Float32Array(vertices), indices: new Uint16Array(indices) };
}

export function createPortraitRenderer(canvas, image) {
  let gl,
    program,
    texture,
    disposed = false;
  const shaders = [],
    buffers = [];
  const dispose = (lose = true) => {
    if (disposed) return;
    disposed = true;
    if (!gl) return;
    buffers.forEach((buffer) => gl.deleteBuffer(buffer));
    shaders.forEach((shader) => gl.deleteShader(shader));
    if (texture) gl.deleteTexture(texture);
    if (program) gl.deleteProgram(program);
    if (lose) gl.getExtension('WEBGL_lose_context')?.loseContext();
  };
  try {
    gl = canvas.getContext('webgl', {
      alpha: true,
      antialias: true,
      depth: false,
      stencil: false,
      premultipliedAlpha: false,
      preserveDrawingBuffer: false,
      powerPreference: 'low-power',
    });
    if (!gl) return null;
    program = gl.createProgram();
    if (!program) throw Error('No portrait program');
    for (const [type, source] of [
      [gl.VERTEX_SHADER, vertexSource],
      [gl.FRAGMENT_SHADER, fragmentSource],
    ]) {
      const shader = gl.createShader(type);
      if (!shader) throw Error('No portrait shader');
      shaders.push(shader);
      gl.shaderSource(shader, source);
      gl.compileShader(shader);
      if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS))
        throw Error('Portrait shader compilation');
      gl.attachShader(program, shader);
    }
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) throw Error('Portrait shader link');
    gl.useProgram(program);
    const mesh = portraitMesh();
    for (const [target, data] of [
      [gl.ARRAY_BUFFER, mesh.vertices],
      [gl.ELEMENT_ARRAY_BUFFER, mesh.indices],
    ]) {
      const buffer = gl.createBuffer();
      if (!buffer) throw Error('No portrait buffer');
      buffers.push(buffer);
      gl.bindBuffer(target, buffer);
      gl.bufferData(target, data, gl.STATIC_DRAW);
    }
    for (const [name, size, offset] of [
      ['aPoint', 3, 0],
      ['aUv', 2, 12],
    ]) {
      const location = gl.getAttribLocation(program, name);
      gl.enableVertexAttribArray(location);
      gl.vertexAttribPointer(location, size, gl.FLOAT, false, 20, offset);
    }
    texture = gl.createTexture();
    if (!texture) throw Error('No portrait texture');
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, texture);
    for (const parameter of [gl.TEXTURE_WRAP_S, gl.TEXTURE_WRAP_T])
      gl.texParameteri(gl.TEXTURE_2D, parameter, gl.CLAMP_TO_EDGE);
    for (const parameter of [gl.TEXTURE_MIN_FILTER, gl.TEXTURE_MAG_FILTER])
      gl.texParameteri(gl.TEXTURE_2D, parameter, gl.LINEAR);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
    gl.uniform1i(gl.getUniformLocation(program, 'uPortrait'), 0);
    const look = gl.getUniformLocation(program, 'uLook');
    gl.clearColor(0, 0, 0, 0);
    return {
      resize(width, height, pixelRatio) {
        const dpr = Math.min(2, Math.max(1, pixelRatio || 1));
        canvas.width = Math.max(1, Math.round(width * dpr));
        canvas.height = Math.max(1, Math.round(height * dpr));
        gl.viewport(0, 0, canvas.width, canvas.height);
      },
      draw(x, y) {
        if (disposed) return;
        gl.uniform2f(look, Math.max(-1, Math.min(1, x)), Math.max(-1, Math.min(1, y)));
        gl.clear(gl.COLOR_BUFFER_BIT);
        gl.drawElements(gl.TRIANGLES, mesh.indices.length, gl.UNSIGNED_SHORT, 0);
      },
      dispose,
    };
  } catch {
    dispose();
    return null;
  }
}
