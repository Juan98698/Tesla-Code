import assert from 'node:assert/strict';
import test from 'node:test';
import { procesarReservas } from './reservas.mjs';

test('una reserva exacta deja cero disponible y la siguiente se rechaza', () => {
  const salas = [{ id: 'A', cupos: 2 }];
  const pedidos = [
    { sala: 'A', plazas: 2 },
    { sala: 'A', plazas: 1 },
  ];
  assert.deepEqual(procesarReservas(salas, pedidos), {
    cupos: [['A', 0]],
    resultados: ['aceptada', 'agotada'],
  });
  assert.deepEqual(salas, [{ id: 'A', cupos: 2 }]);
  assert.deepEqual(pedidos, [
    { sala: 'A', plazas: 2 },
    { sala: 'A', plazas: 1 },
  ]);
});

test('un rechazo preserva el cupo para los pedidos que llegan después', () => {
  const salas = [
    { id: 'B', cupos: 0 },
    { id: 'A', cupos: 3 },
  ];
  const pedidos = [
    { sala: 'A', plazas: 4 },
    { sala: 'B', plazas: 0 },
    { sala: 'X', plazas: 1 },
    { sala: 'A', plazas: 2 },
  ];
  assert.deepEqual(procesarReservas(salas, pedidos), {
    cupos: [
      ['B', 0],
      ['A', 1],
    ],
    resultados: ['agotada', 'invalida', 'desconocida', 'aceptada'],
  });
});

test('un pedido con cantidad textual se rechaza aunque pueda convertirse', () => {
  assert.deepEqual(
    procesarReservas([{ id: 'constructor', cupos: 1 }], [{ sala: 'constructor', plazas: '1' }]),
    { cupos: [['constructor', 1]], resultados: ['invalida'] },
  );
});
