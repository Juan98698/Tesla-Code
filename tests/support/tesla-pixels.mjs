// Read rendered pixels rather than inferring eye movement from uniforms.
export async function irisMotion(page) {
  return page.evaluate(async () => {
    const { createWorldRenderer } = await import('./js/features/tesla-world-renderer.js');
    const { worldGaze } = await import('./js/features/tesla-world.js');
    const image = document.querySelector('.tesla-world-image');
    await image.decode();
    const load = async (path) => {
      const image = new Image();
      image.src = path;
      await image.decode();
      return image;
    };
    const [background, mask] = await Promise.all([
      load('assets/atmosphere/tesla-cleanplate-8946b68e5b.webp'),
      load('assets/atmosphere/tesla-head-mask.svg'),
    ]);
    const canvas = document.createElement('canvas'),
      renderer = createWorldRenderer(canvas, image, { background, mask });
    if (!renderer) throw Error('No se pudo preparar la prueba de los ojos.');
    renderer.resize(1672, 941, 1);
    const gl = canvas.getContext('webgl'),
      centers = [
        [0.74 * 1672, 0.249 * 941],
        [0.803 * 1672, 0.233 * 941],
      ];
    const box = image.getBoundingClientRect(),
      stage = document.querySelector('.knowledge-scene').getBoundingClientRect();
    const frame = { left: box.left, top: box.top, width: box.width, height: box.height };
    const centerX = box.left + box.width * 0.7715,
      centerY = box.top + box.height * 0.244;
    const sample = (eyes) => {
      renderer.draw(0, 0, ...eyes);
      return centers.map(([cx, cy]) => {
        const data = new Uint8Array(96 * 61 * 4);
        gl.readPixels(
          Math.round(cx) - 48,
          941 - Math.round(cy) - 31,
          96,
          61,
          gl.RGBA,
          gl.UNSIGNED_BYTE,
          data,
        );
        return data;
      });
    };
    try {
      const neutral = sample([0, 0, 0, 0]);
      const locate = (pictures, axis) =>
        pictures.map((data, eye) => {
          let best = Infinity,
            shift = 0;
          for (let offset = -20; offset <= 20; offset++) {
            let error = 0;
            for (let y = -3; y <= 3; y++)
              for (let x = -3; x <= 3; x++)
                for (let channel = 0; channel < 3; channel++) {
                  const source = ((27 + y) * 96 + 48 + x) * 4 + channel;
                  const target =
                    ((27 + y + (axis === 'y' ? offset : 0)) * 96 +
                      48 +
                      x +
                      (axis === 'x' ? offset : 0)) *
                      4 +
                    channel;
                  error += (neutral[eye][source] - data[target]) ** 2;
                }
            if (error < best) {
              best = error;
              shift = offset;
            }
          }
          return axis === 'y' ? -shift : shift;
        });
      const at = (x, y) => sample(worldGaze(frame, x, y).slice(2));
      return {
        left: locate(at(stage.left + 8, centerY), 'x'),
        right: locate(at(stage.right - 8, centerY), 'x'),
        up: locate(at(centerX, stage.top + 8), 'y'),
        down: locate(at(centerX, stage.bottom - 8), 'y'),
        scale: box.width / 1672,
      };
    } finally {
      renderer.dispose();
    }
  });
}
