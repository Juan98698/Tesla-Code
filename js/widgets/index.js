export const widgets = {
  'variables-sim': () => import('./variables-sim.js'),
  'guess-game': () => import('./guess-game.js'),
  'tip-calculator': () => import('./tip-calculator.js'),
  'cycle-lab': async () => ({ mount: (await import('./labs.js')).mountCycle }),
  'condition-lab': async () => ({ mount: (await import('./labs.js')).mountCondition }),
  'token-lab': async () => ({ mount: (await import('./labs.js')).mountTokens }),
  'diffusion-lab': async () => ({ mount: (await import('./labs.js')).mountDiffusion }),
  runner: async () => ({ mount: (await import('./labs.js')).mountRunner }),
};
