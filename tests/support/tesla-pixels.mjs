// Locate the photographed irises in GPU output, independently of any uniform.
export async function irisMotion(page) {
  return page.evaluate(async () => {
    const { createPortraitRenderer } = await import('./js/features/tesla-renderer.js');
    const image = document.querySelector('[data-tesla-image]');
    await image.decode();
    const canvas = document.createElement('canvas'),
      renderer = createPortraitRenderer(canvas, image);
    if (!renderer) throw Error('No se pudo preparar la prueba de los ojos.');
    renderer.resize(512, 560, 1);
    const gl = canvas.getContext('webgl'),
      centers = [
        [213.5, 235],
        [318, 235],
      ];
    const sample = (x, y) => {
      renderer.draw(x, y);
      return centers.map(([cx, cy]) => {
        const data = new Uint8Array(64 * 49 * 4);
        gl.readPixels(
          Math.floor(cx) - 32,
          560 - Math.floor(cy) - 25,
          64,
          49,
          gl.RGBA,
          gl.UNSIGNED_BYTE,
          data,
        );
        return data;
      });
    };
    try {
      const neutral = sample(0, 0);
      // Measured from the reference photo, independently of the shader's
      // curves: eyebrows/lids outside these two openings must never change.
      const aperture = [
        [195.5, 237.5],
        [201, 232.5],
        [208, 229.5],
        [216, 229.5],
        [222, 231.5],
        [229, 236],
        [233, 240.5],
        [224, 243],
        [216, 244],
        [208, 243],
        [201, 241],
      ];
      const inside = (x, y) => {
        let result = false;
        for (let i = 0, j = aperture.length - 1; i < aperture.length; j = i++) {
          const [xi, yi] = aperture[i],
            [xj, yj] = aperture[j];
          if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) result = !result;
        }
        return result;
      };
      let escapedPixels = 0;
      for (const x of [-1, -0.5, 0, 0.5, 1])
        for (const y of [-1, -0.5, 0, 0.5, 1]) {
          const pictures = sample(x, y);
          for (let eye = 0; eye < 2; eye++)
            for (let row = 0; row < 49; row++)
              for (let col = 0; col < 64; col++) {
                const px = Math.floor(centers[eye][0]) - 32 + col + 0.5;
                const py = Math.floor(centers[eye][1]) + 24 - row + 0.5;
                const photoX = 213.5 + (px - centers[eye][0]) * (eye === 0 ? 1 : -1);
                if (inside(photoX, py)) continue;
                const index = (row * 64 + col) * 4;
                for (let channel = 0; channel < 4; channel++)
                  if (pictures[eye][index + channel] !== neutral[eye][index + channel]) {
                    escapedPixels++;
                    break;
                  }
              }
        }
      const whiteLuminance = [];
      for (const [x, y, dx, dy] of [
        [-1, 0, 5, 2],
        [1, 0, -5, 2],
        [0, -1, 0, 5],
      ]) {
        const pictures = sample(x, y);
        centers.forEach((_, eye) => {
          const col = 32 + dx,
            row = 24 - dy,
            index = (row * 64 + col) * 4;
          whiteLuminance.push(
            (pictures[eye][index] * 0.2126 +
              pictures[eye][index + 1] * 0.7152 +
              pictures[eye][index + 2] * 0.0722) /
              255,
          );
        });
      }
      const locate = (pictures, axis) =>
        pictures.map((data, eye) => {
          let best = Infinity,
            shift = 0;
          for (let offset = -16; offset <= 16; offset++) {
            let error = 0;
            for (let y = -3; y <= 3; y++)
              for (let x = -3; x <= 3; x++)
                for (let channel = 0; channel < 3; channel++) {
                  const source = ((24 + y) * 64 + 32 + x) * 4 + channel;
                  const target =
                    ((24 + y + (axis === 'y' ? offset : 0)) * 64 +
                      32 +
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
      return {
        left: locate(sample(-1, 0), 'x'),
        right: locate(sample(1, 0), 'x'),
        up: locate(sample(0, -1), 'y'),
        down: locate(sample(0, 1), 'y'),
        scale: image.getBoundingClientRect().width / 512,
        escapedPixels,
        whiteLuminance,
      };
    } finally {
      renderer.dispose();
    }
  });
}
