// The native speech engine is the test boundary; content, controller and DOM
// remain real. No fixture is included in the public site.
export function installSpeechMock(options = {}) {
  const view = window;
  const state = {
    voices: [
      { voiceURI: 'local-es', name: 'Voz local', lang: 'es-CO', localService: true, default: true },
      { voiceURI: 'online-es', name: 'Voz en línea', lang: 'es-ES', localService: false },
      { voiceURI: 'en', name: 'English', lang: 'en-US', localService: true },
    ],
    utterances: [],
    cancels: 0,
    failVoices: false,
    failSpeak: false,
    failCancel: false,
  };
  if (options.empty) state.voices = [];
  const synth = new view.EventTarget();
  synth.getVoices = () => {
    if (state.failVoices) throw Error('Blocked voices');
    return state.voices;
  };
  synth.speak = (utterance) => {
    if (state.failSpeak) throw Error('Blocked audio');
    state.utterances.push(utterance);
    state.current = utterance;
  };
  synth.cancel = () => {
    state.cancels++;
    state.current = undefined;
    if (state.failCancel) throw Error('Blocked cancel');
  };
  state.start = () => state.current?.onstart?.();
  state.finish = () => {
    const current = state.current;
    state.current = undefined;
    current?.onend?.();
  };
  state.error = (error) => state.current?.onerror?.({ error });
  state.changed = () => synth.dispatchEvent(new view.Event('voiceschanged'));
  state.synth = synth;
  Object.defineProperty(view, 'speechSynthesis', { configurable: true, value: synth });
  Object.defineProperty(view, 'SpeechSynthesisUtterance', {
    configurable: true,
    value: class {
      constructor(text) {
        this.text = text;
      }
    },
  });
  view.__speech = state;
  return state;
}
