const MAX = 100;

export function mount(root) {
  const q = (id) => root.querySelector(`#${id}`);
  let secret = 0;
  let tries = 0;

  function newGame() {
    secret = 1 + Math.floor(Math.random() * MAX);
    tries = 0;
    q('jf').textContent = `Pensé un número del 1 al ${MAX}. ¿Cuál es?`;
    q('jn').value = '';
    q('jn').disabled = false;
    q('jb').disabled = false;
  }

  function guess() {
    const value = Number.parseInt(q('jn').value, 10);
    if (Number.isNaN(value) || value < 1 || value > MAX) {
      q('jf').textContent = `Escribe un número entero entre 1 y ${MAX}.`;
      return;
    }
    tries += 1;
    if (value === secret) {
      q('jf').textContent = `¡Acertaste en ${tries} intentos!`;
      q('jn').disabled = true;
      q('jb').disabled = true;
    } else {
      q('jf').textContent = `${value < secret ? 'Más alto' : 'Más bajo'}. Intentos: ${tries}`;
      q('jn').value = '';
      q('jn').focus();
    }
  }

  q('jb').addEventListener('click', guess);
  q('jn').addEventListener('keydown', (event) => { if (event.key === 'Enter') guess(); });
  q('jr').addEventListener('click', newGame);
  newGame();
}
