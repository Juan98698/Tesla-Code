import { tutorEndpoint, tutorHealth, sendTutor } from '../repositories/tutor-client.js';
import { assetUrl } from '../core/assets.js';

const modes = {
  explain: [
    'Desde cero',
    'Explícame la idea principal de esta lección desde cero, con un ejemplo sencillo.',
  ],
  hint: [
    'Una pista',
    'Necesito una pista para practicar este tema. Ayúdame a empezar sin darme la solución.',
  ],
  debug: ['Entender un error', 'Ayúdame a entender este error y a decidir qué revisar primero.'],
  practice: [
    'Practicar',
    'Ponme un ejercicio pequeño de este tema y espera mi intento antes de mostrar la solución.',
  ],
};
export function tutorContext(doc) {
  const match = doc.defaultView.location.hash.match(
    /^#\/leccion\/([a-z0-9-]+)\/([a-z0-9-]+)(?:\/|$)/,
  );
  return match
    ? {
        key: `${match[1]}/${match[2]}`,
        route: match[1],
        lesson: match[2],
        title: doc.querySelector('.lesson-heading h1')?.textContent || 'Tu lección',
      }
    : { key: 'general', title: 'Exploración de TeslaCode' };
}
export function renderTutorText(root, text) {
  const doc = root.ownerDocument,
    parts = text.replaceAll('\r\n', '\n').split(/```[^\S\n]*([a-z0-9+-]*)\n([\s\S]*?)(?:```|$)/gi);
  const inlineText = (parent, value) => {
    let position = 0;
    for (const match of value.matchAll(/`([^`\n]+)`|\*\*([^*\n]+)\*\*|\*([^*\n]+)\*/g)) {
      parent.append(doc.createTextNode(value.slice(position, match.index)));
      const inline = doc.createElement(
        match[1] !== undefined ? 'code' : match[2] !== undefined ? 'strong' : 'em',
      );
      inline.textContent = match[1] ?? match[2] ?? match[3];
      parent.append(inline);
      position = match.index + match[0].length;
    }
    parent.append(doc.createTextNode(value.slice(position)));
  };
  root.replaceChildren();
  for (let i = 0; i < parts.length; i += 3) {
    if (parts[i]) {
      let paragraph = [],
        list;
      const flush = () => {
        const value = paragraph.join('\n').trim();
        paragraph = [];
        if (value) {
          const p = doc.createElement('p');
          inlineText(p, value);
          root.append(p);
        }
      };
      for (const line of parts[i].split('\n')) {
        const heading = line.match(/^\s{0,3}#{1,6}\s+(.+)$/);
        const bullet = line.match(/^\s*(?:([-*])|\d+[.)])\s+(.+)$/);
        if (!line.trim()) {
          flush();
          list = null;
        } else if (heading) {
          flush();
          list = null;
          const h = doc.createElement('h4');
          inlineText(h, heading[1]);
          root.append(h);
        } else if (bullet) {
          flush();
          const tag = bullet[1] ? 'UL' : 'OL';
          if (list?.tagName !== tag) {
            list = doc.createElement(tag.toLowerCase());
            root.append(list);
          }
          const li = doc.createElement('li');
          inlineText(li, bullet[2]);
          list.append(li);
        } else {
          list = null;
          paragraph.push(line);
        }
      }
      flush();
    }
    if (parts[i + 2] !== undefined) {
      const block = doc.createElement('pre'),
        code = doc.createElement('code');
      if (parts[i + 1]) block.setAttribute('aria-label', `Código ${parts[i + 1]}`);
      code.textContent = parts[i + 2];
      block.append(code);
      root.append(block);
    }
  }
}
export function mountTutorChat(
  doc,
  { getEditor = () => null, endpoint = tutorEndpoint, health = tutorHealth, ask = sendTutor } = {},
) {
  const view = doc.defaultView,
    launcher = doc.getElementById('tutor-open');
  const dialog = doc.createElement('dialog');
  dialog.className = 'tutor-dialog';
  dialog.id = 'tutor-dialog';
  dialog.setAttribute('aria-labelledby', 'tutor-title');
  dialog.setAttribute('aria-describedby', 'tutor-disclaimer');
  dialog.innerHTML = `<header class="tutor-heading"><div class="tutor-symbol" aria-hidden="true"><img src="${assetUrl('assets/hologram/nikola-reference.webp')}" width="512" height="560" alt="" decoding="async"></div><div><h2 id="tutor-title">Tesla Tutor <span>IA</span></h2><p class="tutor-context" data-tutor-context></p></div><button class="tutor-close" type="button" aria-label="Cerrar tutor">×</button></header>
    <div class="tutor-scroll"><section class="tutor-welcome"><h3>¿Qué quieres entender?</h3></section>
    <details class="tutor-prompts" open><summary>Ayudas para preguntar</summary><div class="tutor-modes" role="group" aria-label="Cómo quieres aprender">${Object.entries(
      modes,
    )
      .map(
        ([id, [label]]) =>
          `<button type="button" data-tutor-mode="${id}" aria-pressed="${id === 'explain'}">${label}</button>`,
      )
      .join('')}</div></details>
    <div class="tutor-messages" role="log" aria-label="Conversación con Tesla Tutor" aria-live="off"></div></div>
    <p class="tutor-status sr-only" role="status" aria-live="polite"></p><button class="tutor-retry" type="button" hidden>Volver a intentar</button>
    <form class="tutor-form"><details class="tutor-code"><summary>Compartir código o un error</summary><p>Revisa el fragmento antes de enviarlo. Comparte solo lo necesario, sin claves ni datos personales.</p><button type="button" data-tutor-editor hidden>Tomar código del editor</button><label for="tutor-code">Fragmento que quieres compartir</label><textarea id="tutor-code" rows="4" maxlength="4000" spellcheck="false" placeholder="Pega aquí tu código o el mensaje de error"></textarea></details>
    <label class="sr-only" for="tutor-question">Tu pregunta</label><div class="tutor-compose"><textarea id="tutor-question" rows="1" maxlength="2000" required placeholder="¿Qué te gustaría entender?"></textarea><div class="tutor-submit"><button type="button" class="tutor-stop" hidden>Detener respuesta</button><button type="submit" class="tutor-send" disabled>Enviar <span aria-hidden="true">↗</span></button></div></div></form>
    <footer class="tutor-footer"><button type="button" class="tutor-clear">Borrar conversación</button><details class="tutor-info"><summary>Privacidad y ayuda</summary><p id="tutor-disclaimer">Asistente de IA: puede equivocarse. Contrasta con los ejemplos de la lección.</p><p>Se envían a Gemini tu pregunta, el fragmento que compartas y el contexto docente. El historial de esta página se borra al recargar.</p><p>Enter para enviar · Mayús + Enter para una nueva línea.</p></details></footer>`;
  doc.body.append(dialog);
  launcher?.setAttribute('aria-controls', 'tutor-dialog');
  const $ = (selector) => dialog.querySelector(selector),
    question = $('#tutor-question'),
    code = $('#tutor-code'),
    status = $('.tutor-status'),
    send = $('.tutor-send'),
    stop = $('.tutor-stop'),
    retry = $('.tutor-retry'),
    messages = $('.tutor-messages'),
    scroll = $('.tutor-scroll');
  const setStatus = (message, visible = false) => {
    status.textContent = message;
    status.classList.toggle('sr-only', !visible);
  };
  const conversations = new Map();
  let current,
    mode = 'explain',
    address,
    ready = false,
    disposed = false,
    active,
    checking = false,
    checkController;
  function conversation() {
    const context = tutorContext(doc);
    if (!conversations.has(context.key)) {
      if (conversations.size >= 8) conversations.delete(conversations.keys().next().value);
      conversations.set(context.key, {
        context,
        messages: [],
        pairs: [],
        draft: '',
        code: '',
        last: null,
      });
    }
    current = conversations.get(context.key);
    current.context = context;
  }
  function busy(value) {
    send.disabled = value || !ready;
    send.hidden = value;
    stop.hidden = !value;
    $('.tutor-clear').disabled = value;
    retry.hidden = true;
  }
  function refs(root, sources) {
    if (!sources?.length) return;
    const nav = doc.createElement('nav');
    nav.className = 'tutor-sources';
    nav.setAttribute('aria-label', 'Lecturas relacionadas con esta respuesta');
    const label = doc.createElement('span');
    label.textContent = 'Lecturas relacionadas';
    nav.append(label);
    for (const source of sources) {
      const link = doc.createElement('a');
      link.href = source.href;
      link.textContent = source.title;
      link.onclick = close;
      nav.append(link);
    }
    root.append(nav);
  }
  function bubble(item) {
    const article = doc.createElement('article');
    article.className = `tutor-message tutor-${item.role}`;
    const heading = doc.createElement('h3');
    heading.textContent = item.role === 'user' ? 'Tú' : 'Tesla Tutor';
    const body = doc.createElement('div');
    body.className = 'tutor-message-body';
    renderTutorText(body, item.text);
    article.append(heading, body);
    if (item.shared) {
      const tag = doc.createElement('small');
      tag.textContent = 'Fragmento compartido con esta pregunta';
      article.append(tag);
    }
    if (item.incomplete) {
      const tag = doc.createElement('small');
      tag.textContent = 'Respuesta incompleta';
      article.append(tag);
    }
    if (item.truncated) {
      const tag = doc.createElement('small');
      tag.textContent = 'Respuesta acotada. Puedes pedir que continúe.';
      article.append(tag);
    }
    refs(article, item.sources);
    messages.append(article);
    return body;
  }
  function render() {
    messages.replaceChildren();
    current.messages.forEach(bubble);
    $('.tutor-welcome').hidden = current.messages.length > 0;
    $('.tutor-prompts').open = current.messages.length === 0;
    $('[data-tutor-context]').textContent = current.context.title;
    $('[data-tutor-context]').title = current.context.title;
    question.value = current.draft;
    code.value = current.code;
    $('[data-tutor-editor]').hidden = !getEditor();
    retry.hidden = !current.last || Boolean(active);
    scroll.scrollTop = scroll.scrollHeight;
  }
  async function check() {
    if (checking || disposed) return;
    checking = true;
    ready = false;
    busy(false);
    setStatus('Comprobando la conexión del tutor…', true);
    checkController = new AbortController();
    const controller = checkController,
      timer = setTimeout(() => controller.abort(), 6000);
    try {
      address = await endpoint(doc.baseURI);
      const available = await health(address, { signal: controller.signal });
      if (disposed || controller.signal.aborted) return;
      ready = available;
      setStatus(
        ready
          ? 'Listo para explorar tu pregunta.'
          : 'El tutor de IA todavía no está conectado. Puedes continuar con las lecciones.',
        !ready,
      );
    } catch {
      if (!disposed)
        setStatus(
          'No se pudo conectar con el tutor. Puedes reintentar o continuar con la lección.',
          true,
        );
    } finally {
      clearTimeout(timer);
      checking = false;
      if (!disposed) {
        busy(false);
        retry.hidden = ready;
        retry.textContent = 'Volver a conectar';
      }
    }
  }
  async function request(payload, isRetry = false) {
    if (active || !ready || disposed) return;
    const state = current,
      controller = new AbortController();
    active = controller;
    busy(true);
    const timer = setTimeout(
      () => controller.abort(new DOMException('Tutor timeout', 'TimeoutError')),
      35000,
    );
    if (isRetry) state.messages = state.messages.filter((item) => item !== state.last?.answer);
    else
      state.messages.push({ role: 'user', text: payload.message, shared: Boolean(payload.code) });
    const answer = { role: 'assistant', text: '', sources: [] };
    state.messages.push(answer);
    state.messages = state.messages.slice(-20);
    state.last = { payload, answer };
    state.draft = '';
    question.value = '';
    $('.tutor-code').open = false;
    render();
    const node = messages.lastElementChild.querySelector('.tutor-message-body');
    node.textContent = 'Preparando una explicación…';
    setStatus('Tesla Tutor está preparando una respuesta…');
    let complete = false;
    try {
      for await (const event of ask(address, payload, { signal: controller.signal })) {
        if (controller.signal.aborted || disposed) break;
        if (event.type === 'meta') answer.sources = event.sources;
        if (event.type === 'delta') {
          answer.text += event.text;
          node.textContent = answer.text;
          // Follow new text only while the reader remains close to the bottom.
          if (scroll.scrollHeight - scroll.scrollTop - scroll.clientHeight < 160)
            scroll.scrollTop = scroll.scrollHeight;
        }
        if (event.type === 'done') {
          complete = true;
          answer.truncated = event.truncated;
        }
      }
      if (complete && !controller.signal.aborted) {
        state.pairs.push([
          { role: 'user', text: payload.message },
          { role: 'assistant', text: answer.text },
        ]);
        state.pairs = state.pairs.slice(-3);
        state.last = null;
        setStatus('Respuesta lista. Puedes leerla o seguir preguntando.');
      } else {
        answer.incomplete = true;
        setStatus('Consulta detenida. Puedes volver a intentarlo.', true);
      }
    } catch (error) {
      answer.incomplete = true;
      setStatus(
        controller.signal.aborted
          ? controller.signal.reason?.name === 'TimeoutError'
            ? 'El tutor tardó demasiado. Puedes volver a intentarlo.'
            : 'Consulta detenida. Puedes volver a intentarlo.'
          : error.message || 'No se pudo completar la respuesta. Intenta nuevamente.',
        true,
      );
    } finally {
      clearTimeout(timer);
      if (active === controller) active = null;
      if (!answer.text) answer.text = 'Esta consulta no produjo una respuesta completa.';
      if (!disposed) {
        busy(false);
        render();
        retry.textContent = 'Volver a intentar';
      }
    }
  }
  function close() {
    active?.abort();
    checkController?.abort();
    if (current) {
      current.draft = question.value;
      current.code = code.value;
    }
    if (dialog.open) {
      if (typeof dialog.close === 'function') dialog.close();
      else dialog.removeAttribute('open');
    }
    delete doc.documentElement.dataset.tutorOpen;
    launcher?.setAttribute('aria-expanded', 'false');
    launcher?.focus({ preventScroll: true });
  }
  function open() {
    if (disposed || dialog.open) return;
    conversation();
    render();
    doc.documentElement.dataset.tutorOpen = 'true';
    launcher?.setAttribute('aria-expanded', 'true');
    if (typeof dialog.showModal === 'function') dialog.showModal();
    else dialog.setAttribute('open', '');
    question.focus({ preventScroll: true });
    if (!ready) check();
    else setStatus('Listo para explorar tu pregunta.');
  }
  $('.tutor-close').onclick = close;
  dialog.oncancel = (event) => {
    event.preventDefault();
    close();
  };
  dialog.querySelectorAll('[data-tutor-mode]').forEach(
    (button) =>
      (button.onclick = () => {
        mode = button.dataset.tutorMode;
        dialog
          .querySelectorAll('[data-tutor-mode]')
          .forEach((item) => item.setAttribute('aria-pressed', String(item === button)));
        question.value = modes[mode][1];
        current.draft = question.value;
        question.focus();
        if (mode === 'debug') $('.tutor-code').open = true;
      }),
  );
  $('[data-tutor-editor]').onclick = () => {
    const editor = getEditor();
    if (!editor) return;
    code.value = editor.value.slice(0, 4000);
    current.code = code.value;
    setStatus('Fragmento preparado. Revísalo antes de enviarlo junto a tu pregunta.', true);
  };
  question.oninput = () => {
    current.draft = question.value;
  };
  code.oninput = () => {
    current.code = code.value;
  };
  question.onkeydown = (event) => {
    if (event.key === 'Enter' && !event.shiftKey && !event.isComposing) {
      event.preventDefault();
      if (!send.disabled) $('.tutor-form').requestSubmit();
    }
  };
  $('.tutor-form').onsubmit = (event) => {
    event.preventDefault();
    const value = question.value.trim();
    if (!value || active || !ready) return;
    const context = current.context;
    request({
      message: value,
      mode,
      context: context.key === 'general' ? null : { route: context.route, lesson: context.lesson },
      history: current.pairs.flat().map((turn) => ({ ...turn, text: turn.text.slice(0, 1800) })),
      ...(code.value.trim() ? { code: code.value.trim() } : {}),
    });
  };
  stop.onclick = () => active?.abort();
  retry.onclick = () => {
    if (!ready) check();
    else if (current.last) request(current.last.payload, true);
  };
  $('.tutor-clear').onclick = () => {
    if (active) return;
    current.messages = [];
    current.pairs = [];
    current.last = null;
    current.draft = '';
    current.code = '';
    render();
    setStatus('Conversación borrada de esta página.');
    question.focus();
  };
  const navigate = () => {
    if (dialog.open) close();
  };
  view.addEventListener('hashchange', navigate);
  return {
    open,
    dispose() {
      disposed = true;
      active?.abort();
      checkController?.abort();
      close();
      launcher?.removeAttribute('aria-controls');
      view.removeEventListener('hashchange', navigate);
      conversations.clear();
      dialog.remove();
    },
  };
}
