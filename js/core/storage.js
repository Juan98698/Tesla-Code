// Repository: único punto que sabe dónde se guarda el progreso.
const KEY = 'teslacode:progress:v1';
const empty = () => ({ xp: 0, streak: { count: 0, lastDay: null }, completed: [] });

export const progressRepository = {
  load() {
    try {
      return { ...empty(), ...JSON.parse(localStorage.getItem(KEY)) };
    } catch {
      return empty();
    }
  },
  save(state) {
    try {
      localStorage.setItem(KEY, JSON.stringify(state));
    } catch {
      /* Almacenamiento no disponible: el progreso vive solo en memoria. */
    }
  },
};
