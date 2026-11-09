import { MAX_BACKUP_BYTES, mergeProgress, parseBackup } from '../domain/progress-backup.js';

const evidence = (state) =>
  JSON.stringify(
    ['xp', 'completed', 'practices', 'rewards', 'lessons', 'bookmarks'].map((key) => state[key]),
  );

export function importMarkup() {
  return (
    '<section class="card progress-import"><h2>Recuperar una copia del progreso</h2>' +
    '<p>Combina tus logros sin borrar los actuales. Se guarda una copia anterior para deshacer. ' +
    'El archivo de progreso no incluye los borradores de código.</p>' +
    '<label for="progress-file">Copia JSON · hasta 2 MB</label>' +
    '<input id="progress-file" type="file" accept=".json,application/json">' +
    '<p id="import-preview" role="status"></p><div class="btns">' +
    '<button id="confirm-import" class="btn small" disabled>Combinar progreso</button>' +
    '<button id="cancel-import" class="btn ghost small" disabled>Cancelar</button>' +
    '<button id="undo-import" class="btn ghost small" hidden>Deshacer importación</button>' +
    '</div></section>'
  );
}

export function mountProgressImport(
  root,
  state,
  onApply,
  {
    storage = {
      getItem: (key) => globalThis.localStorage.getItem(key),
      setItem: (key, value) => globalThis.localStorage.setItem(key, value),
      removeItem: (key) => globalThis.localStorage.removeItem(key),
    },
  } = {},
) {
  const input = root.querySelector('#progress-file');
  const message = root.querySelector('#import-preview');
  const confirm = root.querySelector('#confirm-import');
  const cancel = root.querySelector('#cancel-import');
  const undo = root.querySelector('#undo-import');
  const backupKey = 'teslacode:before-import:v2';
  let candidate,
    generation = 0,
    alive = true;
  const reset = () => {
    candidate = undefined;
    confirm.disabled = true;
    cancel.disabled = true;
    input.value = '';
  };
  try {
    undo.hidden = !storage?.getItem(backupKey);
  } catch {}
  input.onchange = async () => {
    const version = ++generation,
      file = input.files?.[0];
    candidate = undefined;
    confirm.disabled = true;
    if (!file) {
      reset();
      return;
    }
    cancel.disabled = false;
    try {
      if (file.size > MAX_BACKUP_BYTES) throw Error('El archivo supera el límite de 2 MB.');
      const imported = parseBackup(await file.text());
      if (!alive || version !== generation) return;
      candidate = mergeProgress(state, imported);
      message.textContent =
        'Después de combinar: ' +
        candidate.completed.length +
        ' lecciones completadas y ' +
        candidate.xp +
        ' XP. Los logros actuales se conservan.';
      confirm.disabled = false;
    } catch (error) {
      if (alive && version === generation) message.textContent = error.message;
    }
  };
  cancel.onclick = () => {
    generation++;
    reset();
    message.textContent = 'Importación cancelada.';
  };
  confirm.onclick = async () => {
    if (!candidate) return;
    try {
      const next = mergeProgress(state, candidate);
      storage.setItem(backupKey, JSON.stringify({ before: state, after: next }));
      reset();
      await onApply(next, 'Progreso combinado. Puedes deshacer esta importación.');
      undo.hidden = false;
      message.textContent = 'Progreso combinado. Puedes deshacer esta importación.';
    } catch {
      message.textContent = 'No pudimos guardar la importación. Se conserva tu progreso actual.';
    }
  };
  undo.onclick = async () => {
    try {
      const snapshot = storage.getItem(backupKey);
      const record = JSON.parse(snapshot);
      const previous = parseBackup(JSON.stringify(record.before));
      const imported = parseBackup(JSON.stringify(record.after));
      if (evidence(state) !== evidence(imported)) {
        message.textContent =
          'Tu progreso cambió después de importar. Conservamos la copia anterior y tus nuevos avances; no se ha restaurado.';
        return;
      }
      storage.removeItem(backupKey);
      try {
        await onApply(previous, 'Se recuperó el progreso anterior a la importación.');
      } catch (error) {
        storage.setItem(backupKey, snapshot);
        throw error;
      }
      undo.hidden = true;
      message.textContent = 'Se recuperó el progreso anterior a la importación.';
    } catch {
      message.textContent = 'No pudimos recuperar la copia anterior.';
    }
  };
  return () => {
    alive = false;
    generation++;
  };
}
