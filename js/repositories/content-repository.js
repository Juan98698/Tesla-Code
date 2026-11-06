// Repository de contenido: carga JSON bajo demanda y lo guarda en caché.
const cache = new Map();

export function getJson(path) {
  if (!cache.has(path)) {
    cache.set(
      path,
      fetch(path).then((response) => {
        if (!response.ok) throw new Error(`No se pudo cargar ${path}`);
        return response.json();
      }),
    );
  }
  return cache.get(path);
}

export async function loadCurricula() {
  const { routes } = await getJson('content/curriculum/index.json');
  return Promise.all(routes.map((id) => getJson(`content/curriculum/${id}.json`)));
}

export const loadLesson = (routeId, lessonId) => getJson(`content/lessons/${routeId}/${lessonId}.json`);
