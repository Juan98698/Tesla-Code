import { assetUrl } from '../core/assets.js';
const cache = new Map();
export function getJson(path) {
  if (!cache.has(path))
    cache.set(
      path,
      fetch(assetUrl(path), { cache: 'no-store' })
        .then((response) => {
          if (!response.ok) throw new Error(`No se pudo cargar ${path}. Intenta nuevamente.`);
          return response.json();
        })
        .catch((error) => {
          cache.delete(path);
          throw error;
        }),
    );
  return cache.get(path);
}
export async function loadCurricula() {
  const { routes } = await getJson('content/curriculum/index.json');
  return Promise.all(routes.map((id) => getJson(`content/curriculum/${id}.json`)));
}
export const loadLesson = (route, lesson) => getJson(`content/lessons/${route}/${lesson}.json`);
export const loadConcepts = () => getJson('content/concepts.json');
