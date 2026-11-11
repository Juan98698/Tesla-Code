export function context(failure) {
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
    'uniform4f',
    'drawArrays',
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
