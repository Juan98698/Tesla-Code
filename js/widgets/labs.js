import { escapeHtml as e } from '../core/html.js';
import { runProgram } from '../domain/runner.js';
function frame(root, title, description, html) {
  root.innerHTML = `<section class="lab-widget"><div class="eyebrow">EXPERIMENTA</div><h3>${title}</h3><p>${description}</p>${html}</section>`;
}
export function mountCycle(root) {
  frame(
    root,
    'Un ciclo, una vuelta a la vez',
    'Predice la suma. Después ejecuta cada vuelta y observa el acumulador.',
    '<label>Vueltas <input type="number" min="1" max="8" value="4" data-count></label><div class="memory-cells" data-cells></div><div class="btns"><button class="btn small" data-step>Ejecutar una vuelta</button><button class="btn ghost small" data-reset>Reiniciar</button></div><p class="practice-feedback" role="status" data-output></p>',
  );
  const q = (s) => root.querySelector(s);
  let step = 0,
    sum = 0;
  const count = () => Math.max(1, Math.min(8, Number.parseInt(q('[data-count]').value, 10) || 1));
  function draw() {
    q('[data-cells]').innerHTML = Array.from(
      { length: count() },
      (_, i) =>
        `<div class="memory-cell ${i < step ? 'active' : ''}"><small>Vuelta</small>${i + 1}</div>`,
    ).join('');
    q('[data-output]').textContent =
      `Vueltas: ${step} · suma = ${sum}${step === count() ? ' · Ciclo terminado.' : ''}`;
    q('[data-step]').disabled = step === count();
  }
  function reset() {
    q('[data-count]').value = String(count());
    step = 0;
    sum = 0;
    draw();
  }
  q('[data-count]').onchange = reset;
  q('[data-reset]').onclick = reset;
  q('[data-step]').onclick = () => {
    step++;
    sum += step;
    draw();
  };
  reset();
}
export function mountCondition(root) {
  frame(
    root,
    'Una condición, dos caminos',
    'Cambia la edad. Comprueba qué ocurre justo en el límite de 18 años.',
    '<label>Edad <input type="number" min="0" max="120" value="17" data-age></label><pre>si edad &gt;= 18 entonces\n    mostrar("Acceso")\nsino\n    mostrar("Espera")\nfin si</pre><p class="practice-feedback" role="status" data-result></p>',
  );
  const input = root.querySelector('[data-age]'),
    out = root.querySelector('[data-result]');
  function draw() {
    const age = Number(input.value);
    out.textContent =
      input.value === ''
        ? 'Escribe una edad.'
        : !Number.isInteger(age) || age < 0 || age > 120
          ? 'Escribe una edad entera entre 0 y 120.'
          : `${age} >= 18 → ${age >= 18 ? 'verdadero · Salida: Acceso' : 'falso · Salida: Espera'}`;
  }
  input.oninput = draw;
  draw();
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
