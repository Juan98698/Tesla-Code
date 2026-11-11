// The wallpaper itself is animated: a feathered deformation keeps the neck
// anchored and the laboratory still. This is a 2.5D photograph, not a 360° model.
const vertexSource = `
attribute vec2 aPoint;
varying vec2 vUv;
void main() {
  vUv = vec2((aPoint.x + 1.0) * 0.5, (1.0 - aPoint.y) * 0.5);
  gl_Position = vec4(aPoint, 0.0, 1.0);
}`;
const fragmentSource = `
precision highp float;
uniform sampler2D uWorld;
uniform vec2 uLook;
uniform vec4 uCrop;
varying vec2 vUv;
float ellipse(vec2 p, vec2 center, vec2 radius) {
  return 1.0 - smoothstep(0.45, 1.0, length((p - center) / radius));
}
void main() {
  vec2 uv = uCrop.xy + vUv * uCrop.zw;
  vec2 center = vec2(0.757, 0.246);
  vec2 p = uv - center;
  float head = 1.0 - smoothstep(0.78, 1.18, length(p / vec2(0.103, 0.225)));
  float neck = 1.0 - smoothstep(0.36, 0.48, uv.y);
  float dome = sqrt(max(0.0, 1.0 - dot(p / vec2(0.10, 0.22), p / vec2(0.10, 0.22))));
  float nose = exp(-dot((uv - vec2(0.775, 0.307)) / vec2(0.025, 0.055),
                       (uv - vec2(0.775, 0.307)) / vec2(0.025, 0.055)));
  vec2 turn = vec2(uLook.x * (0.010 * dome + 0.006 * nose),
                   uLook.y * (0.008 * dome + 0.003 * nose));
  // Inverse projection: a small yaw/pitch, blended out before the neck.
  uv -= (turn + vec2(-p.y * uLook.x * 0.028, p.x * uLook.y * 0.028)) * head * neck;
  float eyes = max(ellipse(uv, vec2(0.738, 0.248), vec2(0.014, 0.009)),
                   ellipse(uv, vec2(0.803, 0.232), vec2(0.014, 0.009)));
  uv -= uLook * vec2(0.0024, 0.0017) * eyes;
  gl_FragColor = texture2D(uWorld, uv);
}`;

// Match CSS object-fit: cover, object-position: 76% center exactly.
export function worldCrop(width, height, imageWidth = 1672, imageHeight = 941) {
  const aspect = Math.max(1, width) / Math.max(1, height);
  const source = imageWidth / imageHeight;
  const x = Math.min(1, aspect / source),
    y = Math.min(1, source / aspect);
  return [(1 - x) * 0.76, (1 - y) * 0.5, x, y];
}
export function createWorldRenderer(canvas, image) {
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
      alpha: false,
      antialias: false,
      depth: false,
      stencil: false,
      preserveDrawingBuffer: false,
      powerPreference: 'low-power',
    });
    if (!gl) return null;
    program = gl.createProgram();
    if (!program) throw Error('No world program');
    for (const [type, source] of [
      [gl.VERTEX_SHADER, vertexSource],
      [gl.FRAGMENT_SHADER, fragmentSource],
    ]) {
      const shader = gl.createShader(type);
      if (!shader) throw Error('No world shader');
      shaders.push(shader);
      gl.shaderSource(shader, source);
      gl.compileShader(shader);
      if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS))
        throw Error('World shader compilation');
      gl.attachShader(program, shader);
    }
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) throw Error('World shader link');
    gl.useProgram(program);
    const buffer = gl.createBuffer();
    if (!buffer) throw Error('No world buffer');
    buffers.push(buffer);
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]),
      gl.STATIC_DRAW,
    );
    const point = gl.getAttribLocation(program, 'aPoint');
    gl.enableVertexAttribArray(point);
    gl.vertexAttribPointer(point, 2, gl.FLOAT, false, 0, 0);
    texture = gl.createTexture();
    if (!texture) throw Error('No world texture');
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, texture);
    for (const parameter of [gl.TEXTURE_WRAP_S, gl.TEXTURE_WRAP_T])
      gl.texParameteri(gl.TEXTURE_2D, parameter, gl.CLAMP_TO_EDGE);
    for (const parameter of [gl.TEXTURE_MIN_FILTER, gl.TEXTURE_MAG_FILTER])
      gl.texParameteri(gl.TEXTURE_2D, parameter, gl.LINEAR);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
    gl.uniform1i(gl.getUniformLocation(program, 'uWorld'), 0);
    const look = gl.getUniformLocation(program, 'uLook'),
      crop = gl.getUniformLocation(program, 'uCrop');
    return {
      resize(width, height, pixelRatio) {
        const dpr = Math.min(2, Math.max(1, pixelRatio || 1), 2560 / Math.max(1, width, height));
        canvas.width = Math.max(1, Math.round(width * dpr));
        canvas.height = Math.max(1, Math.round(height * dpr));
        gl.viewport(0, 0, canvas.width, canvas.height);
        gl.uniform4f(crop, ...worldCrop(width, height, image.naturalWidth, image.naturalHeight));
      },
      draw(x, y) {
        if (disposed) return;
        gl.uniform2f(look, Math.max(-1, Math.min(1, x)), Math.max(-1, Math.min(1, y)));
        gl.drawArrays(gl.TRIANGLES, 0, 6);
      },
      dispose,
    };
  } catch {
    dispose();
    return null;
  }
}
