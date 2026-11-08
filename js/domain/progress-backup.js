import { normalizeProgress } from '../core/storage.js';
import { XP } from './gamification.js';

export const MAX_BACKUP_BYTES = 2 * 1024 * 1024;
const object = (value) => value && typeof value === 'object' && !Array.isArray(value);
const unique = (a, b) => [...new Set([...a, ...b])];
const ledgerXP = (state) =>
  state.rewards.length * XP.correct + state.completed.length * XP.lessonPassed;

export function parseBackup(text) {
  if (typeof text !== 'string' || new TextEncoder().encode(text).length > MAX_BACKUP_BYTES)
    throw Error('La copia debe ser un archivo JSON de hasta 2 MB.');
  let raw;
  try {
    raw = JSON.parse(text);
  } catch {
    throw Error('El archivo no contiene JSON válido.');
  }
  if (!object(raw) || ![1, 2].includes(raw.version))
    throw Error('La versión de esta copia no es compatible.');
  if (!Number.isSafeInteger(raw.xp) || raw.xp < 0)
    throw Error('La copia contiene un valor de XP inválido.');
  if (
    raw.streak !== undefined &&
    (!object(raw.streak) ||
      !Number.isSafeInteger(raw.streak.count) ||
      raw.streak.count < 0 ||
      !(
        raw.streak.lastDay === null ||
        (typeof raw.streak.lastDay === 'string' &&
          /^\d{4}-\d{2}-\d{2}$/.test(raw.streak.lastDay) &&
          Number.isFinite(Date.parse(raw.streak.lastDay)) &&
          new Date(raw.streak.lastDay).toISOString().slice(0, 10) === raw.streak.lastDay)
      ))
  )
    throw Error('La racha guardada no es válida.');
  if (
    raw.recent !== undefined &&
    raw.recent !== null &&
    (typeof raw.recent !== 'string' || !/^[a-z0-9-]+\/[a-z0-9-]+$/.test(raw.recent))
  )
    throw Error('La lección reciente no es válida.');
  if (raw.goal !== undefined && (typeof raw.goal !== 'string' || !/^[a-z0-9-]+$/.test(raw.goal)))
    throw Error('La ruta elegida no es válida.');
  if (raw.learningMode !== undefined && !['guided', 'experienced'].includes(raw.learningMode))
    throw Error('El modo de aprendizaje no es válido.');
  if (raw.version === 2 && !object(raw.lessons))
    throw Error('Falta el registro de lecciones de la copia.');
  for (const name of ['completed', 'practices', 'rewards', 'bookmarks']) {
    const values = raw[name];
    if (values === undefined && raw.version === 1) continue;
    if (
      !Array.isArray(values) ||
      values.length > 10000 ||
      values.some(
        (value) =>
          typeof value !== 'string' ||
          value.length > 250 ||
          !/^[a-z0-9-]+\/[a-z0-9-]+(?:\/[a-z0-9-]+)?$/.test(value),
      )
    )
      throw Error('La lista ' + name + ' no es válida.');
  }
  if (raw.lessons !== undefined) {
    if (!object(raw.lessons) || Object.keys(raw.lessons).length > 5000)
      throw Error('Los intentos guardados no son válidos.');
    for (const [key, record] of Object.entries(raw.lessons)) {
      if (
        !/^[a-z0-9-]+\/[a-z0-9-]+$/.test(key) ||
        !object(record) ||
        !Number.isFinite(record.best) ||
        record.best < 0 ||
        record.best > 100 ||
        !Array.isArray(record.attempts) ||
        record.attempts.length > 20
      )
        throw Error('Hay una lección con intentos inválidos.');
      for (const attempt of record.attempts) {
        if (
          !object(attempt) ||
          !Number.isFinite(attempt.score) ||
          attempt.score < 0 ||
          attempt.score > 100 ||
          !Array.isArray(attempt.results) ||
          attempt.results.length > 500 ||
          !(
            attempt.at === null ||
            (typeof attempt.at === 'string' && Number.isFinite(Date.parse(attempt.at)))
          ) ||
          attempt.results.some(
            (result) =>
              !object(result) ||
              typeof result.id !== 'string' ||
              typeof result.concept !== 'string' ||
              typeof result.correct !== 'boolean',
          )
        )
          throw Error('Hay una comprobación inválida en la copia.');
      }
    }
  }
  return normalizeProgress(raw);
}

export function mergeProgress(current, imported) {
  const a = normalizeProgress(current),
    b = normalizeProgress(imported);
  const result = structuredClone(a);
  for (const key of ['completed', 'practices', 'rewards', 'bookmarks'])
    result[key] = unique(a[key], b[key]);
  // Conserva XP antiguo sin desglose, sin sumarlo dos veces al importar otra copia.
  result.xp = ledgerXP(result) + Math.max(0, a.xp - ledgerXP(a), b.xp - ledgerXP(b));
  for (const [key, incoming] of Object.entries(b.lessons)) {
    const previous = a.lessons[key] ?? { best: 0, attempts: [] };
    const attempts = new Map(
      [...previous.attempts, ...incoming.attempts].map((attempt) => [
        JSON.stringify(attempt),
        attempt,
      ]),
    );
    result.lessons[key] = {
      best: Math.max(previous.best, incoming.best),
      attempts: [...attempts.values()]
        .sort((x, y) => (x.at ?? '').localeCompare(y.at ?? ''))
        .slice(-20),
    };
  }
  if ((b.streak.lastDay ?? '') > (a.streak.lastDay ?? '')) result.streak = b.streak;
  else if (a.streak.lastDay === b.streak.lastDay)
    result.streak.count = Math.max(a.streak.count, b.streak.count);
  return result;
}
