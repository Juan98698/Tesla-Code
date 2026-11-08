import { escapeHtml as e } from '../core/html.js';
import { runProgram } from '../domain/runner.js';
function frame(root, title, description, html) {
  root.innerHTML = `<section class="lab-widget"><div class="eyebrow">EXPERIMENTA</div><h3>${title}</h3><p>${description}</p>${html}</section>`;
}
export function mountTokens(root) {
  frame(
    root,
    'Mira el texto por partes',
    'Segmentación ilustrativa por palabras y signos. Un tokenizador real puede dividir palabras y producir otro conteo.',
    '<label>Tu texto <input maxlength="160" value="Hola, estoy aprendiendo IA." data-text></label><div class="tokens" data-tokens></div><p data-total role="status"></p>',
  );
  const input = root.querySelector('[data-text]');
  function draw() {
    const parts = input.value.match(/[\p{L}\p{N}]+|[^\s\p{L}\p{N}]/gu) ?? [];
    root.querySelector('[data-tokens]').innerHTML = parts
      .map((p) => `<span class="token">${e(p)}</span>`)
      .join('');
    root.querySelector('[data-total]').textContent =
      `${parts.length} segmentos ilustrativos. No son un cálculo de tokens ni de costo de una API.`;
  }
  input.oninput = draw;
  draw();
}
export function mountDiffusion(root) {
  frame(
    root,
    'Del ruido a una forma',
    'Interpolación didáctica con ruido fijo. Mueve el control para descubrir una forma; no se ejecuta un modelo de IA.',
    '<canvas class="noise-canvas" width="80" height="56" role="img" aria-label="Simulación de señal mezclada con ruido"></canvas><label>Porcentaje de señal <input type="range" min="0" max="100" value="15" data-signal></label><p data-caption role="status"></p>',
  );
  const canvas = root.querySelector('canvas'),
    ctx = canvas.getContext('2d'),
    input = root.querySelector('[data-signal]');
  const noise = Array.from(
    { length: 80 * 56 },
    (_, i) => (((Math.sin(i * 12.9898 + 78.233) * 43758.5453) % 1) + 1) % 1,
  );
  function draw() {
    const amount = Number(input.value) / 100,
      image = ctx.createImageData(80, 56);
    for (let y = 0; y < 56; y++)
      for (let x = 0; x < 80; x++) {
        const i = y * 80 + x,
          shape = (x > 20 && x < 60 && y > 12 && y < 19) || (x > 36 && x < 44 && y >= 19 && y < 45);
        const target = shape ? [204, 238, 139] : [28, 42, 67];
        for (let c = 0; c < 3; c++)
          image.data[i * 4 + c] = noise[i] * 255 * (1 - amount) + target[c] * amount;
        image.data[i * 4 + 3] = 255;
      }
    ctx.putImageData(image, 0, 0);
    root.querySelector('[data-caption]').textContent =
      `Señal: ${input.value}% · Ruido: ${100 - Number(input.value)}%. En un modelo real, una red estima los pasos de eliminación.`;
  }
  input.oninput = draw;
  draw();
}
export function mountRunner(root) {
  frame(
    root,
    'Tu pequeño programa, en acción',
    'Pseudocódigo acotado: números, asignación, aritmética y mostrar. No es un intérprete completo de Python o JavaScript.',
    '<form class="runner"><label>Programa <textarea spellcheck="false" maxlength="4000">edad = 20\nedad = edad + 1\nmostrar(edad)</textarea></label><button class="btn small" type="submit">Ejecutar programa ▷</button><pre data-output role="status">La salida aparecerá aquí.</pre></form>',
  );
  root.querySelector('form').onsubmit = (event) => {
    event.preventDefault();
    const out = root.querySelector('[data-output]');
    try {
      const result = runProgram(root.querySelector('textarea').value);
      out.textContent = `Salida:\n${result.output.join('\n') || '(sin salida)'}\n\nTraza:\n${result.trace
        .map(
          (s) =>
            `Línea ${s.line}: ${Object.entries(s.memory)
              .map(([k, v]) => `${k}=${v}`)
              .join(', ')}`,
        )
        .join('\n')}`;
    } catch (error) {
      out.textContent = error.message;
    }
  };
}
