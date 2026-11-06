const PROGRAM = [
  ['edad = 20', 'Se crea la variable edad y se guarda en ella el valor 20.'],
  [
    'edad = edad + 1',
    'Se lee edad (20), se le suma 1 y el resultado, 21, reemplaza al valor anterior.',
  ],
  ['mostrar(edad)', 'Se lee el valor actual de edad y se muestra en pantalla.'],
];
const VALUES = [null, 20, 21, 21];
const IDLE = 'Pulsa el botón para ejecutar la línea resaltada.';

export function mount(root) {
  const q = (id) => root.querySelector(`#${id}`);
  let step = 0;

  function draw(zap) {
    q('code').innerHTML = PROGRAM.map(
      ([line], i) => `<div${i === step ? ' class="next"' : ''}>${line}</div>`,
    ).join('');
    q('mem').innerHTML =
      VALUES[step] === null
        ? ''
        : `<div class="caja${zap ? ' zap' : ''}"><b>edad</b><span>${VALUES[step]}</span></div>`;
    q('out').textContent = step === PROGRAM.length ? 'Salida: 21' : '';
    q('expl').textContent = step ? PROGRAM[step - 1][1] : IDLE;
    q('step').disabled = step >= PROGRAM.length;
  }

  q('step').addEventListener('click', () => {
    if (step < PROGRAM.length) {
      step += 1;
      draw(step < PROGRAM.length);
    }
  });
  q('reset').addEventListener('click', () => {
    step = 0;
    draw(false);
  });
  draw(false);
}
