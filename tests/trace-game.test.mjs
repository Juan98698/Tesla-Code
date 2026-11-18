import assert from 'node:assert/strict';
import test from 'node:test';
import { installDOM } from './support/dom.mjs';
import { mountTraceGame } from '../js/features/trace-game.js';

test('trace game allows retrying, announces explanations and moves focus between rounds', (t) => {
  installDOM(t);
  const root = document.body;
  const game = {
    title: 'Ruta del sensor',
    brief: 'Encuentra la señal.',
    rounds: [
      {
        prompt: '¿Qué dato se omite?',
        options: ['El cero', 'El inválido'],
        answer: 1,
        explanation: 'Cero es válido.',
      },
      {
        prompt: '¿Cuándo termina?',
        options: ['Cuando encuentra', 'Al principio'],
        answer: 0,
        explanation: 'Ya hay coincidencia.',
      },
    ],
  };
  mountTraceGame(root, game);
  let choices = root.querySelector('[data-trace-options]').children;
  choices[0].click();
  assert.match(root.querySelector('[role=status]').textContent, /Intenta otra vez/);
  assert.equal(root.querySelector('[data-trace-next]').hidden, true);
  choices[1].click();
  const next = root.querySelector('[data-trace-next]');
  assert.equal(document.activeElement, next);
  assert.equal(choices[0].disabled, true);
  next.click();
  assert.equal(document.activeElement.textContent, '¿Cuándo termina?');
  choices = root.querySelector('[data-trace-options]').children;
  choices[0].click();
  next.click();
  assert.match(root.textContent, /2 pasos resueltos en 3 intentos/);
  root.querySelector('[data-trace-reset]').click();
  assert.match(root.textContent, /Paso 1 de 2/);
});
