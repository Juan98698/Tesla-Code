export function mount(root) {
  const q = (id) => root.querySelector(`#${id}`);

  q('pb').addEventListener('click', () => {
    const bill = Number.parseFloat(q('pc').value);
    const percent = Number.parseFloat(q('pp').value);
    const people = Number(q('pn').value);
    const out = q('po');
    if (
      [bill, percent, people].some(Number.isNaN) ||
      !Number.isFinite(bill) ||
      !Number.isFinite(percent) ||
      bill < 0 ||
      percent < 0
    ) {
      out.textContent = 'Completa los tres datos con números válidos.';
      return;
    }
    if (!Number.isInteger(people) || people < 1) {
      out.textContent = 'Las personas deben ser un número entero de al menos 1.';
      return;
    }
    const tip = (bill * percent) / 100;
    const total = bill + tip;
    if (!Number.isFinite(tip) || !Number.isFinite(total)) {
      out.textContent = 'Los valores exceden el rango numérico. Usa cantidades menores.';
      return;
    }
    out.textContent = `Propina: ${tip.toFixed(2)} · Total: ${total.toFixed(2)} · Cada persona: ${(total / people).toFixed(2)}`;
  });
}
