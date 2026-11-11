import { assetUrl } from '../core/assets.js';

async function loadView(doc) {
  let link = doc.getElementById('tutor-css');
  if (!link) {
    link = doc.createElement('link');
    link.id = 'tutor-css';
    link.rel = 'stylesheet';
    link.href = assetUrl('css/tutor.css');
    doc.head.append(link);
  }
  const styles = link.sheet
    ? Promise.resolve()
    : new Promise((resolve, reject) => {
        const timer = setTimeout(() => {
          link.remove();
          reject(Error('Styles timeout'));
        }, 8000);
        link.onload = () => {
          clearTimeout(timer);
          resolve();
        };
        link.onerror = () => {
          clearTimeout(timer);
          link.remove();
          reject(Error('Styles unavailable'));
        };
      });
  const [module] = await Promise.all([import('./tutor-chat.js'), styles]);
  return module;
}
export function mountTutorLauncher(doc, { load = loadView } = {}) {
  const button = doc.getElementById('tutor-open'),
    status = doc.getElementById('tutor-launcher-status');
  if (!button || !status) return () => {};
  let disposed = false,
    loading = false,
    chat,
    lastEditor;
  const focus = (event) => {
    if (event.target.matches?.('.code-editor')) lastEditor = event.target;
  };
  doc.addEventListener('focusin', focus);
  button.onclick = async () => {
    if (loading || disposed) return;
    if (chat) {
      chat.open();
      return;
    }
    loading = true;
    button.setAttribute('aria-busy', 'true');
    status.textContent = 'Preparando el tutor…';
    try {
      const module = await load(doc);
      if (disposed) return;
      chat = module.mountTutorChat(doc, {
        getEditor: () => (lastEditor?.isConnected ? lastEditor : doc.querySelector('.code-editor')),
      });
      status.textContent = '';
      chat.open();
    } catch {
      if (!disposed)
        status.textContent = 'No se pudo abrir el tutor. Pulsa el botón para intentarlo de nuevo.';
    } finally {
      loading = false;
      button.removeAttribute('aria-busy');
    }
  };
  return () => {
    disposed = true;
    button.onclick = null;
    doc.removeEventListener('focusin', focus);
    chat?.dispose();
  };
}
