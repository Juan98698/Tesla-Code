import { loadPractice } from '../repositories/content-repository.js';
import { mountPractice } from './practice.js';

const practiceWidget = (id) => async () => ({
  mount: async (el, ctx) => {
    const item = (await loadPractice()).find((candidate) => candidate.id === id);
    if (item) mountPractice(el, item, { onSolved: () => ctx?.solve(id) });
  },
});

export const widgets = {
  'variables-sim': () => import('./variables-sim.js'),
  'guess-game': () => import('./guess-game.js'),
  'tip-calculator': () => import('./tip-calculator.js'),
  'cycle-lab': practiceWidget('acumulador-suma'),
  'condition-lab': practiceWidget('condicion-limite'),
  'practice-hub': () => import('./practice-hub.js'),
  'token-lab': async () => ({ mount: (await import('./labs.js')).mountTokens }),
  'diffusion-lab': async () => ({ mount: (await import('./labs.js')).mountDiffusion }),
  runner: async () => ({ mount: (await import('./labs.js')).mountRunner }),
};
