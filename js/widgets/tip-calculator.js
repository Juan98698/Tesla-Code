export function mount(root) {
  const q = (id) => root.querySelector(`#${id}`);

  q('pb').addEventListener('click', () => {
    const bill = Number.parseFloat(q('pc').value);
    const percent = Number.parseFloat(q('pp').value);
    const people = Number.parseInt(q('pn').value, 10);
    const out = q('po');
    if ([bill, percent, people].some(Number.isNaN) || bill < 0 || percent < 0) {
      out.textContent = 'Completa los tres datos con números válidos.';
      return;
    }
    if (people < 1) {
      out.textContent = 'Las personas deben ser al menos 1: dividir entre cero es un error de ejecución.';
      return;
    }
    const tip = (bill * percent) / 100;
    const total = bill + tip;
    out.textContent = `Propina: ${tip.toFixed(2)} · Total: ${total.toFixed(2)} · Cada persona: ${(total / people).toFixed(2)}`;
  });
}
