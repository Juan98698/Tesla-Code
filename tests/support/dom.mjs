import { JSDOM } from 'jsdom';
export function installDOM(t, html = '<main id="root"></main>', url = 'http://localhost/#/inicio') {
  const dom = new JSDOM(html, { url, pretendToBeVisual: true });
  const keys = ['window', 'document', 'localStorage', 'location', 'navigator', 'matchMedia'];
  const saved = new Map(keys.map((key) => [key, Object.getOwnPropertyDescriptor(globalThis, key)]));
  for (const key of keys)
    Object.defineProperty(globalThis, key, {
      configurable: true,
      writable: true,
      value: key === 'matchMedia' ? () => ({ matches: false }) : dom.window[key],
    });
  dom.window.scrollTo = () => {};
  t.after(() => {
    dom.window.close();
    for (const [key, descriptor] of saved) {
      if (descriptor) Object.defineProperty(globalThis, key, descriptor);
      else delete globalThis[key];
    }
  });
  return dom;
}
export const submit = (form) =>
  form.dispatchEvent(new window.Event('submit', { bubbles: true, cancelable: true }));
export const change = (input, value, type = 'input') => {
  input.value = value;
  input.dispatchEvent(new window.Event(type, { bubbles: true }));
};
export async function until(predicate) {
  for (let i = 0; i < 100; i++) {
    if (predicate()) return;
    await new Promise((resolve) => setTimeout(resolve, 2));
  }
  throw Error('La condición de prueba no se cumplió.');
}
export function answerQuizDOM(data) {
  for (let i = 0; i < data.quiz.length; i++) {
    const box = document.getElementById('qbox'),
      q = data.quiz.find((q) => q.id === box.dataset.questionId);
    const click = (text) => {
      const button = [...box.querySelectorAll('button')].find((b) => b.textContent === text);
      if (!button) throw Error(`Falta la opción ${text}`);
      button.click();
    };
    if (q.type === 'choice') click(q.options[q.answer]);
    if (q.type === 'text') {
      box.querySelector('input').value = q.answers[0];
      submit(box.querySelector('form'));
    }
    if (q.type === 'order') {
      q.steps.forEach(click);
      click('Comprobar orden');
    }
    box.querySelector('.fb button').click();
  }
}
