import test from 'node:test';
import assert from 'node:assert/strict';
import { setImmediate as nextTurn } from 'node:timers/promises';
import { installDOM, until, submit } from './support/dom.mjs';
import { mountTutorChat, tutorContext, renderTutorText } from '../js/features/tutor-chat.js';
import { mountTutorLauncher } from '../js/features/tutor-launcher.js';
import { mountDepthScene } from '../js/features/depth-scene.js';

function fixture(t, options = {}) {
  const dom = installDOM(
    t,
    '<button id="tutor-open">Pregúntale a Tesla</button><span id="tutor-launcher-status"></span><div class="lesson-heading"><h1>Tu primer programa</h1></div><textarea class="code-editor">console.log("editor privado");</textarea>',
    options.url || 'http://localhost/#/leccion/fundamentos/js-tu-primer-programa/aprender',
  );
  const doc = dom.window.document;
  dom.window.HTMLDialogElement.prototype.showModal = function () {
    this.setAttribute('open', '');
  };
  dom.window.HTMLDialogElement.prototype.close = function () {
    this.removeAttribute('open');
  };
  const calls = [];
  const chat = mountTutorChat(doc, {
    endpoint: async () => '/api/tutor',
    health: async () => true,
    getEditor: () => doc.querySelector('.code-editor'),
    ask: async function* (address, payload) {
      calls.push(payload);
      yield {
        type: 'meta',
        sources: [
          {
            title: 'Primera lección',
            href: '#/leccion/fundamentos/js-tu-primer-programa/aprender',
          },
        ],
      };
      yield {
        type: 'delta',
        text: 'Una instrucción es un paso.\n```javascript\nconsole.log("Hola");\n```',
      };
      yield { type: 'done', truncated: false };
    },
    ...options,
  });
  t.after(() => chat.dispose());
  const $ = (selector) => doc.querySelector(selector);
  const open = async () => {
    chat.open();
    await until(() => !$('.tutor-send').disabled);
  };
  const send = async (text = '¿Qué es una instrucción?') => {
    $('#tutor-question').value = text;
    submit($('.tutor-form'));
    await until(() => $('.tutor-status').textContent.startsWith('Respuesta lista'));
  };
  return { dom, doc, chat, $, calls, open, send };
}
test('context comes from the current lesson URL and unsafe generated text remains inert', (t) => {
  const f = fixture(t);
  assert.equal(tutorContext(f.doc).key, 'fundamentos/js-tu-primer-programa');
  f.dom.window.location.hash = '#/inicio';
  assert.equal(tutorContext(f.doc).key, 'general');
  const root = f.doc.createElement('div');
  renderTutorText(
    root,
    '<img src=x onerror="alert(1)">\n```html\n<script>unsafe()</script>\n```\nFinal',
  );
  assert.equal(root.querySelector('img'), null);
  assert.equal(root.querySelector('script'), null);
  assert.ok(root.querySelector('code').textContent.includes('<script>'));
  renderTutorText(
    root,
    '### Una explicación\nTexto claro.\n\n- Primer paso\n- Otro `paso`\n1. Predice\n2. Comprueba\n\n*Una nota*\n# <img onerror="bad()">',
  );
  assert.equal(root.querySelector('h4').textContent, 'Una explicación');
  assert.equal(root.querySelectorAll('ul li').length, 2);
  assert.equal(root.querySelectorAll('ol li').length, 2);
  assert.equal(root.querySelector('em').textContent, 'Una nota');
  assert.equal(root.querySelector('img'), null);
  renderTutorText(root, '```js\nconst a = 1;');
  assert.ok(root.textContent.includes('const a'));
  renderTutorText(
    root,
    'Explica **con claridad** la palabra `const`, sin ejecutar <script>nada()</script>.',
  );
  assert.equal(root.querySelector('strong').textContent, 'con claridad');
  assert.equal(root.querySelector('code').textContent, 'const');
  assert.equal(root.querySelector('script'), null);
});
test('chat opens accessibly, sends contextual questions without private editor code and never changes progress', async (t) => {
  const f = fixture(t),
    initial = '{"xp":180,"completed":["demo"]}';
  f.dom.window.localStorage.setItem('teslacode:progress:v2', initial);
  await f.open();
  assert.equal(f.$('dialog').open, true);
  assert.equal(f.doc.activeElement.id, 'tutor-question');
  assert.equal(f.doc.documentElement.dataset.tutorOpen, 'true');
  assert.equal(f.$('#tutor-open').getAttribute('aria-expanded'), 'true');
  await f.send();
  assert.equal(f.calls.length, 1);
  assert.equal(f.calls[0].code, undefined);
  assert.deepEqual(f.calls[0].context, { route: 'fundamentos', lesson: 'js-tu-primer-programa' });
  assert.ok(f.$('.tutor-message-body pre code'));
  assert.equal(f.$('.tutor-sources a').textContent, 'Primera lección');
  assert.equal(f.dom.window.localStorage.getItem('teslacode:progress:v2'), initial);
  f.$('.tutor-close').click();
  assert.equal(f.$('dialog').open, false);
  assert.equal(f.doc.activeElement.id, 'tutor-open');
});
test('learning modes, explicit code sharing and three-turn memory use bounded request context', async (t) => {
  const f = fixture(t);
  await f.open();
  for (const mode of ['explain', 'hint', 'debug', 'practice']) {
    f.$(`[data-tutor-mode="${mode}"]`).click();
    assert.equal(f.$(`[data-tutor-mode="${mode}"]`).getAttribute('aria-pressed'), 'true');
  }
  assert.equal(f.$('.tutor-code').open, true);
  f.$('[data-tutor-editor]').click();
  assert.ok(f.$('#tutor-code').value.includes('editor privado'));
  for (let i = 0; i < 4; i++) await f.send('Pregunta ' + i);
  assert.equal(f.calls[0].mode, 'practice');
  assert.equal(f.calls[3].history.length, 6);
  assert.ok(f.calls[0].code.includes('editor privado'));
  for (let i = 4; i < 12; i++) await f.send('Pregunta ' + i);
  assert.equal(f.$('.tutor-messages').children.length, 20);
  assert.equal(f.$('.tutor-messages').textContent.includes('Pregunta 0'), false);
  assert.ok(f.$('.tutor-messages').textContent.includes('Pregunta 11'));
  assert.equal(f.calls.at(-1).history.length, 6);
  f.$('.tutor-clear').click();
  assert.equal(f.$('.tutor-messages').children.length, 0);
  assert.equal(f.$('#tutor-code').value, '');
  await f.send('Nueva conversación');
  assert.deepEqual(f.calls.at(-1).history, []);
});
test('Enter sends once while Shift+Enter and composition preserve multiline typing', async (t) => {
  const f = fixture(t);
  await f.open();
  const input = f.$('#tutor-question');
  input.value = 'Una duda';
  for (const options of [{ shiftKey: true }, { isComposing: true }])
    input.dispatchEvent(
      new f.dom.window.KeyboardEvent('keydown', {
        key: 'Enter',
        bubbles: true,
        cancelable: true,
        ...options,
      }),
    );
  assert.equal(f.calls.length, 0);
  input.dispatchEvent(
    new f.dom.window.KeyboardEvent('keydown', { key: 'Enter', bubbles: true, cancelable: true }),
  );
  await until(() => f.calls.length === 1);
  await until(() => !f.$('.tutor-send').disabled);
  input.value = ' ';
  submit(f.$('.tutor-form'));
  assert.equal(f.calls.length, 1);
});
test('provider failure offers retry without duplicating the question or granting a completion', async (t) => {
  let count = 0;
  const f = fixture(t, {
    ask: async function* () {
      if (!count++) throw Error('El proveedor está ocupado.');
      yield { type: 'delta', text: 'Ahora sí, una explicación.' };
      yield { type: 'done', truncated: true };
    },
  });
  await f.open();
  f.$('#tutor-question').value = 'Explícame';
  submit(f.$('.tutor-form'));
  await until(() => !f.$('.tutor-retry').hidden);
  assert.ok(f.$('.tutor-status').textContent.includes('ocupado'));
  assert.equal(f.$('.tutor-user').textContent.includes('Explícame'), true);
  f.$('.tutor-retry').click();
  await until(() => f.$('.tutor-status').textContent.startsWith('Respuesta lista'));
  assert.equal(f.doc.querySelectorAll('.tutor-user').length, 1);
  assert.equal(f.doc.querySelectorAll('.tutor-assistant').length, 1);
  assert.ok(f.$('.tutor-assistant').textContent.includes('acotada'));
});
test('stop, closing and navigation abort in-flight generation and keep partial responses explicitly incomplete', async (t) => {
  let signal;
  const f = fixture(t, {
    ask: async function* (address, payload, options) {
      signal = options.signal;
      yield { type: 'delta', text: 'Primer paso.' };
      await new Promise((resolve, reject) =>
        signal.addEventListener('abort', () => reject(signal.reason), { once: true }),
      );
    },
  });
  await f.open();
  f.$('#tutor-question').value = 'Ayuda';
  submit(f.$('.tutor-form'));
  await until(() => f.$('.tutor-assistant')?.textContent.includes('Primer paso.'));
  f.$('.tutor-stop').click();
  await until(() => !f.$('.tutor-send').disabled);
  assert.equal(signal.aborted, true);
  assert.ok(f.$('.tutor-assistant').textContent.includes('incompleta'));
  f.$('.tutor-retry').click();
  await until(() => !f.$('.tutor-stop').hidden);
  f.$('.tutor-close').click();
  await until(() => signal.aborted);
  await until(() => !f.$('.tutor-send').disabled);
  f.chat.open();
  f.dom.window.location.hash = '#/leccion/frontend/como-funciona-internet/aprender';
  await until(() => !f.$('dialog').open);
  f.chat.open();
  assert.equal(f.$('.tutor-messages').children.length, 0);
  f.$('#tutor-question').value = 'Borrador de otra lección';
  f.$('#tutor-question').dispatchEvent(new f.dom.window.Event('input'));
  f.$('#tutor-code').value = 'fragmento';
  f.$('#tutor-code').dispatchEvent(new f.dom.window.Event('input'));
  f.$('.tutor-close').click();
  f.chat.open();
  assert.equal(f.$('#tutor-question').value, 'Borrador de otra lección');
  assert.equal(f.$('#tutor-code').value, 'fragmento');
});
test('missing connectivity remains honest and retry can activate the real connection later', async (t) => {
  let available = false;
  const f = fixture(t, { health: async () => available });
  f.chat.open();
  await until(() => !f.$('.tutor-retry').hidden);
  assert.equal(f.$('.tutor-send').disabled, true);
  assert.ok(f.$('.tutor-status').textContent.includes('no está conectado'));
  available = true;
  f.$('.tutor-retry').click();
  await until(() => !f.$('.tutor-send').disabled);
  await f.send();
  f.$('.tutor-sources a').click();
  assert.equal(f.$('dialog').open, false);
});
test('health errors, a closed connection and disposal clear pending work and native dialog fallbacks', async (t) => {
  const f = fixture(t, {
    endpoint: async () => {
      throw Error('offline');
    },
  });
  f.chat.open();
  await until(() => f.$('.tutor-status').textContent.includes('No se pudo conectar'));
  f.$('dialog').dispatchEvent(new f.dom.window.Event('cancel', { cancelable: true }));
  assert.equal(f.$('dialog').open, false);
  f.$('dialog').showModal = undefined;
  f.$('dialog').close = undefined;
  f.chat.open();
  assert.equal(f.$('dialog').open, true);
  f.$('.tutor-close').click();
  assert.equal(f.$('dialog').open, false);
  f.chat.dispose();
  assert.equal(f.doc.getElementById('tutor-dialog'), null);
  f.chat.open();
  assert.equal(f.doc.getElementById('tutor-dialog'), null);
});
test('pending health work cannot resurrect a disposed tutor and general questions omit lesson identifiers', async (t) => {
  let finish;
  const f = fixture(t, {
    url: 'http://localhost/#/inicio',
    getEditor: () => null,
    health: async () =>
      new Promise((resolve) => {
        finish = resolve;
      }),
  });
  f.chat.open();
  await until(() => Boolean(finish));
  f.chat.dispose();
  finish(true);
  await nextTurn();
  assert.equal(f.doc.getElementById('tutor-dialog'), null);
});
test('the lazy launcher imports only on demand, tracks an explicitly focused editor and cleans up after page exit', async (t) => {
  const f = fixture(t);
  f.chat.dispose();
  let loads = 0,
    opens = 0,
    disposed = 0,
    editor;
  const dispose = mountTutorLauncher(f.doc, {
    load: async () => {
      loads++;
      return {
        mountTutorChat(doc, options) {
          editor = options.getEditor();
          return {
            open() {
              opens++;
            },
            dispose() {
              disposed++;
            },
          };
        },
      };
    },
  });
  assert.equal(loads, 0);
  f.$('.code-editor').focus();
  f.$('#tutor-open').click();
  await until(() => opens === 1);
  assert.equal(editor, f.$('.code-editor'));
  f.$('#tutor-open').click();
  assert.equal(opens, 2);
  assert.equal(loads, 1);
  dispose();
  assert.equal(disposed, 1);
  assert.equal(f.$('#tutor-open').onclick, null);
  assert.doesNotThrow(() => mountTutorLauncher(f.doc.implementation.createHTMLDocument())());
});
test('lazy launcher failures are retryable and a late import never opens after disposal', async (t) => {
  const f = fixture(t);
  f.chat.dispose();
  let finish;
  const dispose = mountTutorLauncher(f.doc, {
    load: async () => {
      throw Error('offline');
    },
  });
  f.$('#tutor-open').click();
  await until(() => f.$('#tutor-launcher-status').textContent.includes('No se pudo'));
  dispose();
  const later = mountTutorLauncher(f.doc, {
    load: async () =>
      new Promise((resolve) => {
        finish = resolve;
      }),
  });
  f.$('#tutor-open').click();
  later();
  finish({
    mountTutorChat() {
      throw Error('must not mount');
    },
  });
  await nextTurn();
  assert.equal(f.doc.getElementById('tutor-dialog'), null);
});
test('default lazy loading waits for styles, handles a failed stylesheet and reuses a ready stylesheet', async (t) => {
  const f = fixture(t);
  f.chat.dispose();
  t.mock.method(globalThis, 'fetch', async (url) =>
    Response.json(
      String(url).includes('tutor-config') ? { endpoint: '/api/tutor' } : { ready: false },
    ),
  );
  const dispose = mountTutorLauncher(f.doc);
  f.$('#tutor-open').click();
  f.$('#tutor-css').dispatchEvent(new f.dom.window.Event('error'));
  await until(() => f.$('#tutor-launcher-status').textContent.includes('No se pudo'));
  f.$('#tutor-open').click();
  f.$('#tutor-css').dispatchEvent(new f.dom.window.Event('load'));
  await until(() => f.doc.getElementById('tutor-dialog')?.open);
  dispose();
  Object.defineProperty(f.$('#tutor-css'), 'sheet', { value: {}, configurable: true });
  const again = mountTutorLauncher(f.doc);
  f.$('#tutor-open').click();
  await until(() => f.doc.getElementById('tutor-dialog')?.open);
  again();
});
test('opening the tutor pauses background depth effects and closing resumes the existing scene preference', async (t) => {
  const f = fixture(t);
  f.doc.body.insertAdjacentHTML(
    'beforeend',
    '<div id="scene-root"><div data-depth-scene></div></div>',
  );
  globalThis.matchMedia = () => ({ matches: true });
  const root = f.doc.getElementById('scene-root');
  const dispose = mountDepthScene(root);
  t.after(dispose);
  assert.equal(root.firstElementChild.dataset.sceneActive, 'false'); // reduced motion query is true
  globalThis.matchMedia = (query) => ({ matches: query.includes('hover') });
  dispose();
  const mounted = mountDepthScene(root);
  t.after(mounted);
  assert.equal(root.firstElementChild.dataset.sceneActive, 'true');
  await f.open();
  await until(() => root.firstElementChild.dataset.sceneActive === 'false');
  f.$('.tutor-close').click();
  await until(() => root.firstElementChild.dataset.sceneActive === 'true');
});
