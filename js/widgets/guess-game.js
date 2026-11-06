const MAX = 100,
  LIMIT = 7;
export function mount(root) {
  const q = (id) => root.querySelector(`#${id}`);
  let secret, tries;
  function newGame() {
    secret = 1 + Math.floor(Math.random() * MAX);
    tries = 0;
    q('jf').textContent = `Pensé un número del 1 al ${MAX}. Tienes ${LIMIT} intentos.`;
    q('jn').value = '';
    q('jn').disabled = false;
    q('jb').disabled = false;
  }
  function guess() {
    const value = Number(q('jn').value);
    if (!q('jn').value.trim() || !Number.isInteger(value) || value < 1 || value > MAX) {
      q('jf').textContent = `Escribe un entero entre 1 y ${MAX}. No se ha contado el intento.`;
      return;
    }
    tries++;
    const won = value === secret,
      over = tries >= LIMIT;
    if (won || over) {
      q('jf').textContent = won
        ? `¡Acertaste en ${tries} intentos!`
        : `Se acabaron los ${LIMIT} intentos. Era ${secret}.`;
      q('jn').disabled = true;
      q('jb').disabled = true;
    } else {
      q('jf').textContent =
        `${value < secret ? 'Más alto' : 'Más bajo'}. Quedan ${LIMIT - tries} intentos.`;
      q('jn').value = '';
      q('jn').focus();
    }
  }
  q('jb').addEventListener('click', guess);
  q('jn').addEventListener('keydown', (event) => {
    if (event.key === 'Enter') guess();
  });
  q('jr').addEventListener('click', newGame);
  newGame();
}
