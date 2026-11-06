// Registro de widgets interactivos. Cada lección declara el suyo en su JSON ("widget").
export const widgets = {
  'variables-sim': () => import('./variables-sim.js'),
  'guess-game': () => import('./guess-game.js'),
  'tip-calculator': () => import('./tip-calculator.js'),
};
