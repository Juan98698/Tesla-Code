// Preserve the supplied portrait on one flat plane. Only the photographed
// irises move; the face, eyelids, hair and suit keep their original geometry.
const vertexSource = `
attribute vec3 aPoint;
attribute vec2 aUv;
varying vec2 vUv;
void main() {
  gl_Position = vec4(aPoint, 1.0);
  vUv = aUv;
}`;
const fragmentSource = `
precision highp float;
uniform sampler2D uPortrait;
uniform mediump vec2 uLook;
varying vec2 vUv;
vec3 eye(vec3 color, vec2 center, float side) {
  const vec2 size = vec2(512.0,560.0);
  vec2 point = (vUv * size - center) * vec2(side,1.0);
  if(point.x <= -17.5 || point.x >= 18.5) return color;

  // Curves fitted inside the photographed lids, in source pixels. Moving the
  // iris never moves this aperture or overwrites the brow/eyelid photograph.
  float across = (point.x + 17.5) / 36.0;
  float arch = 4.0 * across * (1.0-across);
  float baseline = mix(2.5,5.4,across);
  float upper = baseline - 9.2 * arch;
  float lower = baseline + 3.4 * arch;
  float opening = smoothstep(upper+0.45,upper+1.0,point.y)
                * (1.0-smoothstep(lower-0.9,lower-0.25,point.y));
  if(opening <= 0.0) return color;

  // Fixed samples from the actual whites, not a scanline through the dark
  // eyelid. This continuous eyeball covers the old iris at every gaze angle.
  vec3 outerWhite = texture2D(uPortrait,(center+vec2(-11.5*side,3.0))/size).rgb;
  vec3 innerWhite = texture2D(uPortrait,(center+vec2(11.5*side,3.0))/size).rgb;
  vec3 lowerWhite = texture2D(uPortrait,(center+vec2(0.0,7.0))/size).rgb;
  float height = clamp((point.y-upper)/(lower-upper),0.0,1.0);
  vec3 sclera = mix(mix(outerWhite,innerWhite,across),lowerWhite,0.5*arch)
              * mix(0.50,1.05,smoothstep(0.0,0.8,height));

  vec2 gaze = uLook / max(1.0,length(uLook));
  vec2 displacement = gaze * vec2(8.0*side,3.5);
  vec2 irisPoint = (point-displacement)/7.6;
  float radius = length(irisPoint);
  // Reuse the visible lower iris texture for both hemispheres. The source's
  // upper half is occluded by a lid and cannot be dragged onto the eyeball.
  vec2 irisSample = vec2(irisPoint.x*side,abs(irisPoint.y))*6.6;
  vec3 iris = texture2D(uPortrait,(center+irisSample)/size).rgb;
  iris = mix(iris,vec3(0.015,0.08,0.17),smoothstep(0.82,1.0,radius));
  float pupil = 1.0-smoothstep(0.34,0.42,radius);
  vec3 pupilColor = texture2D(uPortrait,(center+vec2(0.0,-0.75))/size).rgb * 0.65;
  iris = mix(iris,pupilColor,pupil);
  float glint = 1.0-smoothstep(0.07,0.16,length(irisPoint-vec2(-0.09*side,-0.43)));
  iris = mix(iris,vec3(0.85,0.98,1.0),glint);
  float irisMask = 1.0-smoothstep(0.93,1.0,radius);
  vec3 eyeball = mix(sclera,iris,irisMask);
  return mix(color,eyeball,opening);
}
void main() {
  vec4 source = texture2D(uPortrait,vUv);
  vec3 color = eye(source.rgb,vec2(213.5,235.0),1.0);
  color = eye(color,vec2(318.0,235.0),-1.0);
  gl_FragColor = vec4(color,source.a);
}`;

export function portraitMesh() {
  return {
    vertices: new Float32Array([-1, -1, 0, 0, 1, 1, -1, 0, 1, 1, -1, 1, 0, 0, 0, 1, 1, 0, 1, 0]),
    indices: new Uint16Array([0, 1, 2, 2, 1, 3]),
  };
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
