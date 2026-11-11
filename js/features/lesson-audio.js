const PREFS = 'teslacode:lesson-audio:v1';
const RATES = [0.75, 1, 1.25, 1.5];
const OMIT =
  'pre:not([data-language="text"]),script,style,svg,button,form,input,textarea,select,[role="button"],[role="status"],[role="alert"],[hidden],[aria-hidden="true"],[inert],details:not([open]),.code-example,.python-console,[data-lab],[data-audio-ignore]';
const BLOCK = 'h2,h3,h4,h5,h6,p,li,dt,dd,th,td,figcaption,blockquote,pre';

// Short utterances bound recovery/repetition without relying on word-boundary
// events or device-specific support for native pause/resume.
export function speechChunks(value) {
  let text = String(value ?? '')
    .replace(/\s+/gu, ' ')
    .trim();
  const chunks = [];
  while (text) {
    let end = text.length;
    if (end > 180) {
      const window = text.slice(0, 181);
      const sentence = [...window.matchAll(/[.!?;:]\s/gu)].at(-1);
      end = sentence && sentence.index >= 70 ? sentence.index + 1 : window.lastIndexOf(' ', 180);
      if (end < 1) end = 180;
      const last = text.charCodeAt(end - 1);
      if (last >= 0xd800 && last <= 0xdbff) end--;
    }
    chunks.push(text.slice(0, end).trim());
    text = text.slice(end).trimStart();
  }
  return chunks;
}

export function speechBlocks(theory) {
  const groups = [];
  const walker = theory.ownerDocument.createTreeWalker(theory, 4);
  let node;
  while ((node = walker.nextNode())) {
    const parent = node.parentElement;
    if (!node.textContent.trim() || parent.closest(OMIT)) continue;
    const element = parent.closest(BLOCK) ?? parent.closest('div,section,article') ?? theory;
    if (groups.at(-1)?.element === element) groups.at(-1).text += ' ' + node.textContent;
    else groups.push({ element, text: node.textContent });
  }
  return groups.flatMap(({ element, text }) =>
    speechChunks(text).map((text) => ({ element, text })),
  );
}

export function mountLessonAudio(root) {
  const panel = root.querySelector('#lesson-audio'),
    theory = root.querySelector('#lesson');
  if (!panel || !theory) return () => {};
  const doc = root.ownerDocument,
    view = doc.defaultView;
  panel.innerHTML = `<div class="lesson-audio-actions"><button class="btn small" type="button" data-audio-play disabled><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" aria-hidden="true"><path d="M4 9h4l5-4v14l-5-4H4zM16 8a6 6 0 0 1 0 8M19 5a10 10 0 0 1 0 14"/></svg><span data-audio-label>Escuchar teoría</span></button><button class="btn ghost small" type="button" data-audio-stop disabled>Detener</button><span class="lesson-audio-progress" data-audio-progress aria-live="off"></span></div><p class="lesson-audio-status" data-audio-status role="status">Preparando lectura…</p><details class="lesson-audio-options"><summary>Voz y velocidad</summary><div class="lesson-audio-settings"><div class="lesson-audio-field"><label for="lesson-audio-voice">Voz en español</label><select id="lesson-audio-voice" disabled></select></div><div class="lesson-audio-field"><label for="lesson-audio-rate">Velocidad</label><select id="lesson-audio-rate">${RATES.map((rate) => `<option value="${rate}" ${rate === 1 ? 'selected' : ''}>${rate.toLocaleString('es')}×${rate === 1 ? ' · Normal' : ''}</option>`).join('')}</select></div><button class="btn ghost small" type="button" data-audio-refresh>Buscar voces</button></div><p>Lee las explicaciones; sigue los bloques de código en pantalla. Algunas voces necesitan conexión.</p></details>`;
  const $ = (selector) => panel.querySelector(selector);
  const play = $('[data-audio-play]'),
    stop = $('[data-audio-stop]'),
    status = $('[data-audio-status]');
  const voiceSelect = $('#lesson-audio-voice'),
    rateSelect = $('#lesson-audio-rate'),
    refresh = $('[data-audio-refresh]');
  const parts = speechBlocks(theory);
  let synth;
  try {
    synth = view.speechSynthesis;
  } catch {}
  if (
    !synth ||
    typeof synth.speak !== 'function' ||
    typeof synth.cancel !== 'function' ||
    typeof synth.getVoices !== 'function' ||
    typeof view.SpeechSynthesisUtterance !== 'function'
  ) {
    status.textContent =
      'Este navegador no ofrece lectura en voz alta. Puedes seguir leyendo la teoría.';
    $('.lesson-audio-options').hidden = true;
    return () => {};
  }
  let preference = {};
  try {
    const saved = JSON.parse(view.localStorage.getItem(PREFS));
    if (saved && typeof saved === 'object' && !Array.isArray(saved)) preference = saved;
  } catch {}
  let rate = RATES.includes(preference.rate) ? preference.rate : 1;
  let voiceKey = typeof preference.voice === 'string' ? preference.voice : '';
  let voices = [],
    state = 'idle',
    index = 0,
    utterance,
    generation = 0,
    marked;
  let disposed = false,
    startTimer = 0,
    voiceTimer = 0;
  const key = (voice) => voice.voiceURI || `${voice.lang}:${voice.name}`;
  const clearMark = () => {
    marked?.classList.remove('narration-current');
    marked = undefined;
  };
  const update = (message) => {
    play.disabled = !voices.length || !parts.length;
    stop.disabled = state !== 'playing' && state !== 'paused';
    $('[data-audio-label]').textContent =
      state === 'playing'
        ? 'Pausar lectura'
        : state === 'paused'
          ? 'Continuar lectura'
          : state === 'ended'
            ? 'Volver a escuchar'
            : 'Escuchar teoría';
    $('[data-audio-progress]').textContent =
      index || state !== 'idle'
        ? `Fragmento ${Math.min(index + 1, parts.length)} de ${parts.length}`
        : '';
    if (message && status.textContent !== message) status.textContent = message;
  };
  const remember = () => {
    try {
      view.localStorage.setItem(PREFS, JSON.stringify({ rate, voice: voiceKey }));
    } catch {}
  };
  const cancel = () => {
    generation++;
    view.clearTimeout(startTimer);
    if (!utterance) return;
    utterance.onstart = utterance.onend = utterance.onerror = null;
    utterance = undefined;
    try {
      synth.cancel();
    } catch {}
  };
  const pause = (message = 'Lectura en pausa. Al continuar se repetirá el fragmento actual.') => {
    cancel();
    clearMark();
    state = 'paused';
    update(message);
  };
  const fail = (code) => {
    const message =
      code === 'network'
        ? 'La voz no pudo conectarse. Comprueba tu conexión o elige una voz local.'
        : code === 'not-allowed'
          ? 'El navegador no permitió iniciar la lectura. Pulsa Continuar para reintentar.'
          : ['voice-unavailable', 'language-unavailable'].includes(code)
            ? 'La voz seleccionada no está disponible. Busca voces o elige otra.'
            : 'La lectura se interrumpió. Puedes continuar desde este fragmento o elegir otra voz.';
    pause(message);
  };
  const speak = () => {
    if (disposed || state !== 'playing') return;
    if (index >= parts.length) {
      utterance = undefined;
      clearMark();
      state = 'ended';
      update('Lectura terminada.');
      return;
    }
    const token = ++generation;
    const live = () => !disposed && token === generation && state === 'playing';
    try {
      const selected = voices.find((voice) => key(voice) === voiceKey);
      if (!selected) {
        fail('voice-unavailable');
        return;
      }
      const next = new view.SpeechSynthesisUtterance(parts[index].text);
      utterance = next;
      next.lang = selected.lang.replaceAll('_', '-');
      next.voice = selected;
      next.rate = rate;
      next.onstart = () => {
        if (!live()) return;
        view.clearTimeout(startTimer);
        clearMark();
        marked = parts[index].element;
        marked.classList.add('narration-current');
        update('Lectura en curso.');
      };
      next.onend = () => {
        if (!live()) return;
        view.clearTimeout(startTimer);
        next.onstart = next.onend = next.onerror = null;
        utterance = undefined;
        index++;
        speak();
      };
      next.onerror = (event) => {
        if (live()) fail(event.error);
      };
      startTimer = view.setTimeout(() => {
        if (live()) fail('start-timeout');
      }, 12000);
      synth.speak(next);
    } catch {
      if (live()) fail('synthesis-failed');
    }
  };
  const refreshVoices = (final = false) => {
    if (disposed) return;
    try {
      voices = synth.getVoices().filter((voice) => /^es(?:[-_]|$)/i.test(voice.lang));
    } catch {
      voices = [];
    }
    voiceSelect.replaceChildren();
    for (const voice of voices) {
      const option = doc.createElement('option');
      option.value = key(voice);
      option.textContent = `${voice.name} (${voice.lang}) · ${voice.localService ? 'Local' : 'En línea'}`;
      voiceSelect.append(option);
    }
    voiceSelect.disabled = !voices.length;
    if (voices.length) {
      view.clearTimeout(voiceTimer);
      const old = voiceKey;
      const locale = view.navigator.language.toLowerCase();
      const selected =
        voices.find((voice) => key(voice) === voiceKey) ??
        voices.find((voice) => voice.lang.toLowerCase() === locale) ??
        voices.find((voice) => voice.lang.toLowerCase() === 'es-co') ??
        voices.find((voice) => voice.default) ??
        voices[0];
      voiceKey = key(selected);
      voiceSelect.value = voiceKey;
      if (state === 'playing' && old !== voiceKey)
        pause('La voz cambió. Pulsa Continuar para retomar este fragmento.');
      else if (state === 'paused' && old !== voiceKey)
        update('Voz disponible. Pulsa Continuar para retomar este fragmento.');
      else
        update(
          state === 'idle'
            ? parts.length
              ? 'Listo para escuchar la teoría.'
              : 'Esta teoría no tiene texto disponible para lectura.'
            : undefined,
        );
    } else {
      const option = doc.createElement('option');
      option.textContent = 'Sin voces en español';
      voiceSelect.append(option);
      if (state === 'playing') pause();
      update(
        final
          ? 'No hay una voz en español disponible. Revisa las voces de tu dispositivo y pulsa Buscar voces.'
          : 'Buscando voces en español. Si no aparecen, revisa las voces de tu dispositivo.',
      );
    }
  };
  rateSelect.value = String(rate);
  play.onclick = () => {
    if (disposed || !voices.length || !parts.length) return;
    if (state === 'playing') {
      pause();
      return;
    }
    if (state !== 'paused') index = 0;
    cancel();
    state = 'playing';
    update('Iniciando lectura…');
    speak();
  };
  stop.onclick = () => {
    cancel();
    clearMark();
    index = 0;
    state = 'idle';
    update('Lectura detenida.');
  };
  const change = () => {
    voiceKey = voiceSelect.value;
    const selectedRate = Number(rateSelect.value);
    rate = RATES.includes(selectedRate) ? selectedRate : 1;
    rateSelect.value = String(rate);
    remember();
    if (state === 'playing') {
      cancel();
      clearMark();
      update('Iniciando lectura…');
      speak();
    }
  };
  voiceSelect.onchange = rateSelect.onchange = change;
  refresh.onclick = () => refreshVoices(true);
  const voicesChanged = () => refreshVoices(true);
  const hidden = () => {
    if (doc.hidden && state === 'playing')
      pause('Lectura en pausa al ocultar la página. Pulsa Continuar para seguir.');
  };
  const leaving = () => {
    if (state === 'playing') pause('Lectura en pausa. Pulsa Continuar para seguir.');
  };
  synth.addEventListener?.('voiceschanged', voicesChanged);
  doc.addEventListener('visibilitychange', hidden);
  view.addEventListener('pagehide', leaving);
  refreshVoices();
  if (!voices.length) voiceTimer = view.setTimeout(() => refreshVoices(true), 2500);
  return () => {
    disposed = true;
    cancel();
    clearMark();
    view.clearTimeout(voiceTimer);
    synth.removeEventListener?.('voiceschanged', voicesChanged);
    doc.removeEventListener('visibilitychange', hidden);
    view.removeEventListener('pagehide', leaving);
    play.onclick =
      stop.onclick =
      voiceSelect.onchange =
      rateSelect.onchange =
      refresh.onclick =
        null;
  };
}
