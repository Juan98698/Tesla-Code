// Observer: bus de eventos de dominio. Los módulos se comunican sin conocerse.
const bus = new EventTarget();

export const emit = (type, detail) => bus.dispatchEvent(new CustomEvent(type, { detail }));
export const on = (type, handler) => bus.addEventListener(type, (event) => handler(event.detail));
