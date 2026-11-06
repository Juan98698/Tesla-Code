export const $ = (id) => document.getElementById(id);

export function button(text, className, onClick) {
  const node = document.createElement('button');
  Object.assign(node, { type: 'button', className, textContent: text });
  node.addEventListener('click', onClick);
  return node;
}

export function span(text, className = '') {
  const node = document.createElement('span');
  node.className = className;
  node.textContent = text;
  return node;
}
