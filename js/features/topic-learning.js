import { escapeHtml as e } from '../core/html.js';
import { topicIndex, filterTopics, topicHref, TOPIC_COLLECTIONS } from '../domain/topics.js';
import { isUnlocked, nextLesson } from '../domain/curriculum.js';
import { loadLesson, getJson } from '../repositories/content-repository.js';
import {
  codeActivityMarkup,
  mountCodeActivity,
  mountCodeExamples,
  arrangeCodeWorkbench,
} from './code-activity.js';
import { mountTraceGame } from './trace-game.js';
import { mountLessonAudio } from './lesson-audio.js';

const glossary = [
  [
    'Declaración',
    'Presenta un nombre en el programa. const mantiene su asignación; let permite reasignarlo.',
  ],
  ['Expresión', 'Una escritura que produce un valor, como 2 + 3 o minutos >= 20.'],
  [
    'Condición',
    'Expresión cuya interpretación booleana decide si se entra en una alternativa o se repite.',
  ],
  [
    'Parámetro',
    'Nombre que una función usa para recibir un dato. El argumento es el valor enviado en la llamada.',
  ],
  [
    'Retorno',
    'Valor que return entrega a quien llamó a una función. Mostrarlo con console.log es una acción distinta.',
  ],
  [
    'Callback',
    'Función entregada a otra operación para que esta la llame cuando corresponda. No significa necesariamente asincronía.',
  ],
  [
    'Mutación',
    'Cambio en el contenido de un objeto o arreglo existente. Reasignar cambia el valor asociado a un nombre.',
  ],
  [
    'Promesa',
    'Objeto que representa el resultado futuro de una operación: puede cumplirse o rechazarse.',
  ],
];

function teachingMarkup(teaching) {
  if (!teaching) return '';
  return `<section class="topic-usage"><h3>El problema que vas a resolver</h3><p>${e(teaching.problem)}</p>
    <dl><dt>Qué recibe</dt><dd>${e(teaching.input)}</dd><dt>Qué produce</dt><dd>${e(teaching.output)}</dd><dt>Qué cambia</dt><dd>${e(teaching.effect)}</dd></dl>
    <h3>Usos prácticos y elección de herramienta</h3><ul>${teaching.uses.map((use) => `<li>${e(use)}</li>`).join('')}</ul><p>${e(teaching.choice)}</p></section>`;
}

export function mountTopicReasoning(
  root,
  topic,
  storage = {
    getItem: (key) => globalThis.localStorage.getItem(key),
    setItem: (key, value) => globalThis.localStorage.setItem(key, value),
  },
) {
  const key = 'teslacode:topic-reasoning:v1:' + topic.id;
  root.innerHTML = `<section class="topic-reasoning"><h3>Elige y explica antes de programar</h3><label for="topic-reasoning">${e(topic.teaching.question)}</label>
    <textarea id="topic-reasoning" rows="3" maxlength="4000"></textarea><p data-reasoning-status role="status">Tu explicación se guarda aparte del progreso. No recibe una calificación automática.</p>
    <details><summary>Criterios para revisar tu decisión</summary><p>${e(topic.teaching.criteria)}</p></details></section>`;
  const input = root.querySelector('textarea');
  const status = root.querySelector('[data-reasoning-status]');
  try {
    input.value = storage.getItem(key)?.slice(0, 4000) ?? '';
  } catch {
    status.textContent =
      'No se pudo recuperar tu explicación. Puedes escribir y copiarla antes de salir.';
  }
  input.oninput = () => {
    try {
      storage.setItem(key, input.value);
      status.textContent =
        'Explicación guardada en este navegador. Revisa tus razones con los criterios; no se califican automáticamente.';
    } catch {
      status.textContent = 'No se pudo guardar. Copia tu explicación antes de salir.';
    }
  };
  return () => {
    input.oninput = null;
  };
}

// Keep all the original teaching. Fold project administration rather than copying
// a second curriculum or inviting consultation to complete a protected delivery.
export function consultationTheory(doc, html) {
  const source = doc.createElement('div');
  source.innerHTML = html;
  const project = doc.createElement('details');
  project.className = 'topic-project-details';
  project.innerHTML = '<summary>Conexión con el proyecto de la ruta</summary>';
  let inProject = false;
  for (const node of [...source.children]) {
    if (
      /^H[23]$/u.test(node.tagName) &&
      /contrato acumulativo|cómo entregar evidencia|entrega y reescritura|cómo registrar|reescritura con comprobación/iu.test(
        node.textContent,
      )
    )
      inProject = true;
    if (inProject) project.append(node);
  }
  if (inProject) source.append(project);
  return source.innerHTML;
}

export function mountWalkthrough(root, code, steps) {
  let position = 0;
  root.innerHTML = `<section class="topic-walkthrough" aria-label="Recorrido del ejemplo original">
    <h3>Recorrido del ejemplo original</h3><p>Esta traza preparada explica el código de partida. Tus cambios se comprueban en la consola.</p>
    <pre tabindex="0" data-trace-code></pre><p role="status" data-trace-state></p><p data-trace-explanation></p>
    <div class="btns"><button class="btn ghost small" data-trace-back>Anterior</button><button class="btn small" data-trace-forward>Siguiente momento</button></div></section>`;
  const back = root.querySelector('[data-trace-back]');
  const forward = root.querySelector('[data-trace-forward]');
  function show() {
    const step = steps[position];
    root.querySelector('pre').innerHTML = code
      .split('\n')
      .map(
        (line, i) =>
          `<span class="${i + 1 === step.line ? 'trace-current' : ''}">${i + 1}. ${e(line)}</span>`,
      )
      .join('\n');
    root.querySelector('[data-trace-state]').textContent =
      `${position + 1} de ${steps.length} · ${step.state}`;
    root.querySelector('[data-trace-explanation]').textContent = step.explanation;
    back.disabled = position === 0;
    forward.disabled = position === steps.length - 1;
  }
  back.onclick = () => {
    position--;
    show();
  };
  forward.onclick = () => {
    position++;
    show();
  };
  show();
}

export function mountTopicExercise(root, activity, title, context, options = {}) {
  root.innerHTML = `<section class="card practice-card" data-topic-exercise="${e(activity.id)}"><span class="badge">Práctica de consulta</span>
    <h3>${e(title)}</h3><p>${e(activity.prompt)}</p>${codeActivityMarkup(activity)}
    <p class="practice-hint" role="status" hidden></p><div class="practice-feedback" role="status" hidden></div>
    <details class="topic-solution"><summary>Consultar una posible solución</summary><p>Compárala con tu intento y explica la diferencia. Verla no acredita aprendizaje.</p><pre tabindex="0">${e(activity.solution)}</pre></details></section>`;
  const section = root.firstElementChild;
  arrangeCodeWorkbench(section);
  section.addEventListener('input', (event) => {
    if (!event.target.matches('.code-editor')) return;
    section.querySelector('.badge').textContent = 'Práctica de consulta';
    section.querySelector('.practice-feedback').hidden = true;
  });
  let hint = 0;
  section.querySelector('[data-hint]').onclick = () => {
    const messages = activity.hints?.length
      ? activity.hints
      : [activity.hint ?? activity.explanation];
    const panel = section.querySelector('.practice-hint');
    panel.hidden = false;
    panel.textContent = messages[Math.min(hint++, messages.length - 1)];
  };
  return mountCodeActivity(
    section,
    activity,
    () => {
      section.querySelector('.badge').textContent = 'Casos comprobados · sin XP';
    },
    { context, ...options },
  );
}

export async function mountTopicLearning(root, ctx, dependencies = {}) {
  const loadGuides =
    dependencies.loadGuides ?? (() => getJson('content/learning/javascript-guides.json'));
  const getLesson = dependencies.loadLesson ?? loadLesson;
  const exerciseOptions = dependencies.exerciseOptions ?? {};
  const route = ctx.routes.find((item) => item.id === 'fundamentos');
  const { guides, workshops = {}, walkthroughs = {}, searchTerms = {} } = await loadGuides();
  const topics = topicIndex(route, guides, searchTerms);
  let selected = ctx.topic ?? topics[0].id;
  let alive = true;
  let revision = 0;
  let cleanups = [];
  root.ownerDocument.defaultView.history.replaceState(null, '', topicHref(selected));
  const disposeContent = () => {
    cleanups.forEach((dispose) => dispose());
    cleanups = [];
  };
  root.innerHTML = `<section class="topic-learning" aria-label="Aprender JavaScript por temas">
    <header class="topic-intro"><p class="eyebrow">JavaScript · Desde cero hasta aplicaciones</p><h2>Aprender por temas</h2>
    <p>Comienza por Recorrido desde cero. Consulta y usos prácticos amplía habilidades con sus bases enlazadas. Matemáticas especializadas es una referencia opcional. El proyecto y sus entregas continúan en tu ruta.</p>
    <p class="topic-consultation-note">Consulta libre · No completa lecciones ni concede XP. Tus borradores se guardan aparte en este navegador.</p></header>
    <div class="topic-layout"><details class="topic-index" open><summary>Índice de JavaScript <span>${topics.length} temas</span></summary>
    <label for="topic-search">Buscar un tema de JavaScript</label><input type="search" id="topic-search" placeholder="Ej. .map(), .includes, colas…" maxlength="100">
    <p data-topic-count role="status"></p><nav aria-label="Temas de JavaScript" data-topic-nav></nav></details>
    <article class="topic-content" aria-live="off"></article></div></section>`;
  const search = root.querySelector('input');
  const nav = root.querySelector('nav');
  const article = root.querySelector('article');
  const count = root.querySelector('[data-topic-count]');
  function drawIndex() {
    const shown = filterTopics(topics, search.value);
    count.textContent = `${shown.length} de ${topics.length} temas`;
    nav.replaceChildren();
    for (const collection of TOPIC_COLLECTIONS) {
      const members = shown.filter((topic) => topic.collection === collection.id);
      if (!members.length) continue;
      const shelf = root.ownerDocument.createElement('details');
      shelf.className = 'topic-collection';
      shelf.dataset.topicCollection = collection.id;
      shelf.open = Boolean(search.value) || members.some((entry) => entry.id === selected);
      shelf.innerHTML = `<summary>${e(collection.title)} <span>${members.length}</span></summary><p>${e(collection.description)}</p>`;
      const groups = new Map();
      for (const topic of members) {
        if (!groups.has(topic.group)) groups.set(topic.group, []);
        groups.get(topic.group).push(topic);
      }
      for (const entries of groups.values()) {
        const details = root.ownerDocument.createElement('details');
        details.open = Boolean(search.value) || entries.some((entry) => entry.id === selected);
        details.innerHTML = `<summary>${e(entries[0].groupName)}</summary>${entries
          .map(
            (entry) =>
              `<a href="${topicHref(entry.id)}" data-topic="${e(entry.id)}" ${entry.id === selected ? 'aria-current="page"' : ''}>${e(entry.title)}${entry.searchTerms.length ? `<small class="topic-search-terms">${entry.searchTerms.slice(0, 3).map(e).join(' · ')}</small>` : ''}</a>`,
          )
          .join('')}`;
        shelf.append(details);
      }
      nav.append(shelf);
    }
    if (!shown.length)
      nav.innerHTML = '<p>No hay coincidencias. Prueba otro término o borra la búsqueda.</p>';
  }
  function select(id, push = true) {
    selected = id;
    ctx.topic = id;
    if (push) root.ownerDocument.defaultView.history.pushState(null, '', topicHref(id));
    drawIndex();
    return showTopic(push);
  }
  root.onclick = (event) => {
    const link = event.target.closest('[data-topic]');
    if (!link || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
    event.preventDefault();
    select(link.dataset.topic);
  };
  search.oninput = drawIndex;
  async function showTopic(scroll = false) {
    const version = ++revision;
    disposeContent();
    const topic = topics.find((entry) => entry.id === selected);
    if (!topic) {
      article.innerHTML = `<h3>Tema no encontrado</h3><p>Elige uno del índice para continuar.</p><a href="${topicHref(topics[0].id)}" data-topic="${topics[0].id}">Empezar desde cero</a>`;
      return;
    }
    article.innerHTML = '<p role="status">Preparando explicación y ejemplos…</p>';
    try {
      const data = topic.kind === 'guide' ? topic : await getLesson('fundamentos', topic.id);
      if (!alive || version !== revision) return;
      const next = nextLesson(route, new Set(ctx.state.completed));
      const unlocked = isUnlocked(route, topic.reference, new Set(ctx.state.completed));
      const prerequisites = topic.requires
        .map((id) => topics.find((entry) => entry.id === id))
        .filter(Boolean);
      article.innerHTML = `<p class="eyebrow">${e(topic.groupName)} · ${topic.kind === 'guide' ? 'Ficha complementaria' : 'Contenido de la ruta'}</p>
        <h2 tabindex="-1">${e(topic.title)}</h2><p class="outcome">${e(data.outcome)}</p>
        ${prerequisites.length ? `<details class="topic-bases"><summary>Antes de este tema: bases que puedes repasar</summary><ul>${prerequisites.map((entry) => `<li><a class="text-link" href="${topicHref(entry.id)}" data-topic="${entry.id}">${e(entry.title)}</a></li>`).join('')}</ul></details>` : '<p>Puedes comenzar aquí: no necesitas experiencia previa.</p>'}
        <div id="lesson-audio" class="lesson-audio" aria-label="Lectura del tema"></div>
        <section id="lesson" class="lesson-content topic-theory" aria-label="Explicación del tema">${topic.kind === 'guide' ? teachingMarkup(data.teaching) + data.sections.map((section) => `<h3>${e(section.title)}</h3><p>${e(section.text)}</p>`).join('') + `<h3>Predice y experimenta</h3><pre data-language="javascript">${e(data.example.code)}</pre>` : consultationTheory(root.ownerDocument, data.html)}</section>
        <div data-topic-trace></div><details class="topic-glossary"><summary>Consultar términos de programación</summary><dl>${glossary.map(([term, definition]) => `<dt>${e(term)}</dt><dd>${e(definition)}</dd>`).join('')}</dl></details>
        <section data-topic-practice aria-label="Práctica del tema"></section>
        <footer class="topic-footer"><h3>Continúa con tu proyecto</h3><p>${unlocked ? 'La lección de referencia está disponible en tu recorrido.' : 'Puedes consultar este tema. Para entregar el proyecto, completa primero los pasos previos de la ruta.'}</p>
        <a class="btn small" href="#/leccion/fundamentos/${topic.reference}/aprender">Ver lección de referencia →</a>
        ${next ? `<a class="text-link" href="#/leccion/fundamentos/${next.id}/aprender">Mi siguiente paso en la ruta →</a>` : ''}</footer>
        ${data.sources?.length ? `<details class="topic-sources"><summary>Fuentes y documentación</summary>${data.sources.map((source) => `<p><a class="text-link" href="${e(source.url)}" target="_blank" rel="noopener noreferrer">${e(source.title)}</a></p>`).join('')}</details>` : ''}`;
      const unavailable =
        topic.kind === 'guide' && data.capability && typeof Math[data.capability] !== 'function';
      if (unavailable) {
        const notice = root.ownerDocument.createElement('p');
        notice.className = 'callout';
        notice.textContent = `Este navegador no ofrece Math.${data.capability}(). Puedes leer la explicación; los ejemplos y retos requieren un navegador que implemente esta operación.`;
        article.querySelector('#lesson').before(notice);
      }
      const examples =
        topic.kind === 'guide'
          ? [data.example, ...(data.examples ?? [])].map((example, index) => ({
              ...example,
              id: example.id ?? topic.id + '-example' + (index ? '-' + index : ''),
              language: 'javascript',
              ...(unavailable
                ? {
                    environment: 'local',
                    environmentNote: `Requiere Math.${data.capability}() en un navegador compatible. Consulta las fuentes de esta ficha.`,
                  }
                : {}),
            }))
          : data.examples;
      if (topic.kind === 'guide') {
        for (const example of examples.slice(1)) {
          const section = root.ownerDocument.createElement('section');
          section.innerHTML = `<h3>${e(example.title)}</h3><p>${e(example.explanation)}</p><pre data-language="javascript">${e(example.code)}</pre><details class="example-expected"><summary>Comparar con el resultado de referencia</summary><pre tabindex="0">${e(example.observation ?? (example.sample ? JSON.stringify(example.sample.expected) : example.stdout))}</pre></details>`;
          article.querySelector('#lesson').append(section);
        }
      }
      cleanups.push(
        mountCodeExamples(
          article.querySelector('#lesson'),
          { examples },
          { context: 'topics/' + topic.id, ...exerciseOptions },
        ),
      );
      if (topic.kind === 'guide') {
        const reference = root.ownerDocument.createElement('details');
        reference.className = 'example-expected';
        reference.innerHTML = `<summary>Comparar y entender el resultado de referencia</summary>${data.example.explanation ? `<p>${e(data.example.explanation)}</p>` : ''}<pre tabindex="0">${e(data.example.observation ?? (data.example.sample ? JSON.stringify(data.example.sample.expected) : data.example.stdout))}</pre>`;
        article.querySelector('#lesson .code-example').after(reference);
      }
      cleanups.push(mountLessonAudio(article));
      const steps = data.walkthrough ?? walkthroughs[topic.id];
      if (steps)
        mountWalkthrough(
          article.querySelector('[data-topic-trace]'),
          topic.kind === 'guide' ? data.example.code : data.examples[0].code,
          steps,
        );
      else if (data.traceGame)
        mountTraceGame(article.querySelector('[data-topic-trace]'), data.traceGame);
      const practice = article.querySelector('[data-topic-practice]');
      if (topic.kind === 'guide' && data.teaching) {
        const reasoning = root.ownerDocument.createElement('div');
        practice.append(reasoning);
        cleanups.push(mountTopicReasoning(reasoning, topic));
      }
      if (topic.kind === 'guide' && !unavailable) {
        const activities = [
          ['guided', 'Implementa con apoyo'],
          ['bug', 'Reescribe, comprueba y corrige'],
          ['challenge', 'Integra en una situación nueva'],
        ].map(([key, title]) => ({ ...data[key], id: topic.id + '-' + key, title }));
        activities.push(...(data.practices ?? []));
        for (const activity of activities) {
          const body = root.ownerDocument.createElement('div');
          practice.append(body);
          cleanups.push(
            mountTopicExercise(
              body,
              { ...activity, type: 'javascript' },
              activity.title,
              'topics/' + topic.id,
              exerciseOptions,
            ),
          );
        }
      } else if (topic.kind === 'lesson') {
        for (const [key, title] of [
          ['guided', 'Implementa con apoyo'],
          ['bug', 'Reescribe, comprueba y corrige'],
        ]) {
          const activity = workshops[topic.id]?.[key];
          if (!activity) continue;
          const body = root.ownerDocument.createElement('div');
          practice.append(body);
          cleanups.push(
            mountTopicExercise(
              body,
              { ...activity, id: topic.id + '-topic-' + key, type: 'javascript' },
              title,
              'topics/' + topic.id,
              exerciseOptions,
            ),
          );
        }
        const transfers = data.activities.filter(
          (activity) => activity.type === 'javascript' && !activity.learningStep,
        );
        for (const activity of transfers) {
          const body = root.ownerDocument.createElement('div');
          practice.append(body);
          cleanups.push(
            mountTopicExercise(
              body,
              activity,
              'Aplica el concepto en otra situación',
              'topics/' + topic.id,
              exerciseOptions,
            ),
          );
        }
        const design = data.learningDesign?.workedExample;
        if (design) {
          const guide = root.ownerDocument.createElement('section');
          guide.className = 'callout topic-guided';
          guide.innerHTML = `<h3>Practica con apoyo</h3><p>${e(design.problem)}</p><ol><li>${e(design.reasoning)}</li><li>Predice, ejecuta el ejemplo y compara el resultado. Cambia una entrada; vuelve a predecir antes de ejecutar.</li><li>${e(design.result)}</li></ol><p>La implementación, reescritura e incidencia del proyecto se realizan sobre tu entrega anterior en la ruta.</p>`;
          practice.prepend(guide);
        }
      }
      article.querySelector('h2').focus({ preventScroll: true });
      if (scroll) article.querySelector('h2').scrollIntoView?.({ block: 'start' });
    } catch {
      if (!alive || version !== revision) return;
      disposeContent();
      article.innerHTML =
        '<p role="alert">No pudimos cargar este tema. Tus borradores se conservan.</p><button class="btn small" data-topic-retry>Reintentar tema</button>';
      article.querySelector('button').onclick = () => showTopic();
    }
  }
  drawIndex();
  // Return cleanup immediately: a slow lesson response must not resurrect an abandoned view.
  void showTopic();
  return () => {
    alive = false;
    revision++;
    disposeContent();
  };
}
