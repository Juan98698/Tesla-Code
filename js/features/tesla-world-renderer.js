// A photographed relief with rigid yaw/pitch, composited over a clean plate.
// The source photo supplies every facial feature; UVs never stretch the head.
const ASPECT = 1672 / 941;
const vertexSource = `
attribute vec3 aPoint;
attribute vec2 aUv;
uniform vec2 uLook;
uniform mediump int uPass;
varying vec2 vUv;
void main() {
  vec3 position = aPoint;
  if (uPass == 1) {
    vec2 pivot = vec2((0.765 - 0.5) * 2.0 * (1672.0/941.0), (0.5 - 0.465) * 2.0);
    float camera = 4.0;
    vec3 p = vec3((aPoint.xy - pivot) * (camera - aPoint.z) / camera, aPoint.z);
    float yaw = uLook.x * 0.17;
    float pitch = uLook.y * 0.13;
    vec3 turned = vec3(p.x*cos(yaw) + p.z*sin(yaw), p.y, -p.x*sin(yaw) + p.z*cos(yaw));
    turned = vec3(turned.x, turned.y*cos(pitch) - turned.z*sin(pitch), turned.y*sin(pitch) + turned.z*cos(pitch));
    vec2 projected = pivot + turned.xy * camera / (camera - turned.z);
    // Only the small neck attachment blends into the stationary collar.
    float neck = 1.0 - smoothstep(0.46, 0.51, aUv.y);
    position.xy = mix(aPoint.xy, projected, neck);
  }
  gl_Position = vec4(position.x / (1672.0/941.0), position.y, 0.0, 1.0);
  vUv = aUv;
}`;
const fragmentSource = `
precision highp float;
uniform sampler2D uWorld;
uniform sampler2D uBackground;
uniform sampler2D uMask;
uniform vec2 uLook;
uniform vec4 uEyes;
uniform mediump int uPass;
varying vec2 vUv;
float oval(vec2 p, vec2 center, vec2 radius) {
  return 1.0 - smoothstep(0.65, 1.0, length((p-center)/radius));
}
vec3 eye(vec3 color, vec2 uv, vec2 center, vec2 gaze) {
  vec2 openingCenter = center + vec2(0.0,0.003);
  float opening = oval(uv, openingCenter, vec2(0.023,0.014));
  vec2 displacement = vec2(gaze.x * 0.009, 0.003 + gaze.y * 0.011);
  float oldIris = oval(uv, center, vec2(0.0085,0.012));
  vec3 leftWhite = texture2D(uWorld,vec2(center.x-0.011,uv.y)).rgb;
  vec3 rightWhite = texture2D(uWorld,vec2(center.x+0.011,uv.y)).rgb;
  vec3 sclera = mix(leftWhite,rightWhite,clamp((uv.x-center.x)/0.022+0.5,0.0,1.0));
  color = mix(color,sclera,oldIris * opening);
  float iris = oval(uv,center+displacement,vec2(0.0062,0.009));
  vec3 movedIris = texture2D(uWorld,uv-displacement).rgb;
  return mix(color,movedIris,iris * opening);
}
void main() {
  float mask = texture2D(uMask,vUv).a;
  vec4 source = texture2D(uWorld,vUv);
  if (uPass == 0) {
    gl_FragColor = vec4(mix(source.rgb,texture2D(uBackground,vUv).rgb,smoothstep(0.02,0.85,mask)),1.0);
  } else {
    if(mask<0.003) discard;
    vec4 gaze = clamp(uEyes - vec4(uLook,uLook) * 0.06,-1.0,1.0);
    vec3 color = eye(source.rgb,vUv,vec2(0.740,0.249),gaze.xy);
    color = eye(color,vUv,vec2(0.803,0.233),gaze.zw);
    gl_FragColor = vec4(color,mask);
  }
}`;

export function headMesh() {
  const columns = 36,
    rows = 48,
    vertices = [],
    indices = [];
  const bump = (u, v, x, y, rx, ry) => Math.exp(-(((u - x) / rx) ** 2) - ((v - y) / ry) ** 2);
  for (let row = 0; row <= rows; row++)
    for (let col = 0; col <= columns; col++) {
      const u = 0.63 + (col / columns) * 0.24,
        v = (row / rows) * 0.51;
      const dome = Math.sqrt(
        Math.max(0, 1 - ((u - 0.761) / 0.115) ** 2 - ((v - 0.245) / 0.25) ** 2),
      );
      const depth =
        0.105 * dome +
        0.08 * bump(u, v, 0.772, 0.31, 0.025, 0.065) -
        0.015 * (bump(u, v, 0.738, 0.248, 0.022, 0.018) + bump(u, v, 0.803, 0.232, 0.022, 0.018));
      vertices.push((u - 0.5) * 2 * ASPECT, (0.5 - v) * 2, Math.max(0, depth), u, v);
      if (row < rows && col < columns) {
        const a = row * (columns + 1) + col,
          b = a + columns + 1;
        indices.push(a, b, a + 1, a + 1, b, b + 1);
      }
    }
  return { vertices: new Float32Array(vertices), indices: new Uint16Array(indices) };
}
export function createWorldRenderer(canvas, image, resources) {
  if (!resources?.background || !resources?.mask) return null;
  let gl,
    program,
    disposed = false;
  const shaders = [],
    buffers = [],
    textures = [];
  const dispose = (lose = true) => {
    if (disposed) return;
    disposed = true;
    if (!gl) return;
    buffers.forEach((buffer) => gl.deleteBuffer(buffer));
    shaders.forEach((shader) => gl.deleteShader(shader));
    textures.forEach((texture) => gl.deleteTexture(texture));
    if (program) gl.deleteProgram(program);
    if (lose) gl.getExtension('WEBGL_lose_context')?.loseContext();
  };
  try {
    gl = canvas.getContext('webgl', {
      alpha: false,
      antialias: true,
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
    const mesh = headMesh();
    const baseData = new Float32Array([
      -ASPECT,
      -1,
      0,
      0,
      1,
      ASPECT,
      -1,
      0,
      1,
      1,
      -ASPECT,
      1,
      0,
      0,
      0,
      -ASPECT,
      1,
      0,
      0,
      0,
      ASPECT,
      -1,
      0,
      1,
      1,
      ASPECT,
      1,
      0,
      1,
      0,
    ]);
    const buffer = (target, data) => {
      const result = gl.createBuffer();
      if (!result) throw Error('No world buffer');
      buffers.push(result);
      gl.bindBuffer(target, result);
      gl.bufferData(target, data, gl.STATIC_DRAW);
      return result;
    };
    const base = buffer(gl.ARRAY_BUFFER, baseData),
      head = buffer(gl.ARRAY_BUFFER, mesh.vertices),
      indices = buffer(gl.ELEMENT_ARRAY_BUFFER, mesh.indices);
    const point = gl.getAttribLocation(program, 'aPoint'),
      uv = gl.getAttribLocation(program, 'aUv');
    gl.enableVertexAttribArray(point);
    gl.enableVertexAttribArray(uv);
    const bind = (target) => {
      gl.bindBuffer(gl.ARRAY_BUFFER, target);
      gl.vertexAttribPointer(point, 3, gl.FLOAT, false, 20, 0);
      gl.vertexAttribPointer(uv, 2, gl.FLOAT, false, 20, 12);
    };
    for (const [index, [name, source]] of [
      ['uWorld', image],
      ['uBackground', resources.background],
      ['uMask', resources.mask],
    ].entries()) {
      const texture = gl.createTexture();
      if (!texture) throw Error('No world texture');
      textures.push(texture);
      gl.activeTexture(gl.TEXTURE0 + index);
      gl.bindTexture(gl.TEXTURE_2D, texture);
      for (const parameter of [gl.TEXTURE_WRAP_S, gl.TEXTURE_WRAP_T])
        gl.texParameteri(gl.TEXTURE_2D, parameter, gl.CLAMP_TO_EDGE);
      for (const parameter of [gl.TEXTURE_MIN_FILTER, gl.TEXTURE_MAG_FILTER])
        gl.texParameteri(gl.TEXTURE_2D, parameter, gl.LINEAR);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, source);
      gl.uniform1i(gl.getUniformLocation(program, name), index);
    }
    const look = gl.getUniformLocation(program, 'uLook'),
      eyes = gl.getUniformLocation(program, 'uEyes'),
      pass = gl.getUniformLocation(program, 'uPass');
    return {
      resize(width, height, pixelRatio) {
        const dpr = Math.min(2, Math.max(1, pixelRatio || 1), 2560 / Math.max(1, width, height));
        canvas.width = Math.max(1, Math.round(width * dpr));
        canvas.height = Math.max(1, Math.round(height * dpr));
        gl.viewport(0, 0, canvas.width, canvas.height);
      },
      draw(x, y, lx = x, ly = y, rx = x, ry = y) {
        if (disposed) return;
        const clamp = (value) => Math.max(-1, Math.min(1, value));
        gl.uniform2f(look, clamp(x), clamp(y));
        gl.uniform4f(eyes, clamp(lx), clamp(ly), clamp(rx), clamp(ry));
        gl.disable(gl.BLEND);
        gl.uniform1i(pass, 0);
        bind(base);
        gl.drawArrays(gl.TRIANGLES, 0, 6);
        gl.enable(gl.BLEND);
        gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
        gl.uniform1i(pass, 1);
        bind(head);
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indices);
        gl.drawElements(gl.TRIANGLES, mesh.indices.length, gl.UNSIGNED_SHORT, 0);
      },
      dispose,
    };
  } catch {
    dispose();
    return null;
  }
}
