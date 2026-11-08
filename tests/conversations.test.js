import test from 'node:test';
import assert from 'node:assert/strict';
import { initialData, offerHelp, acceptOffer, resolvePublication } from '../src/lib/demo.js';
import { canConverse, mergeMessages, sendDemoMessage } from '../src/lib/conversations.js';

test('la demo conserva conversación, aceptación e historial y bloquea a terceros', () => {
  let data = offerHelp(initialData, 'escalera', 'luis', 'Te la presto.', 'o');
  data = sendDemoMessage(data, 'o', 'luis', 'Puedo a las cinco.', 'm1').data;
  const repeat = sendDemoMessage(data, 'o', 'luis', 'Puedo a las cinco.', 'm1');
  assert.equal(repeat.data.mensajes.length, 1);
  assert.throws(() => sendDemoMessage(data, 'o', 'maria', 'Hola', 'm2'), /Solo los participantes/);
  data = sendDemoMessage(data, 'o', 'ana', 'Gracias, nos vemos.', 'm2').data;
  data = acceptOffer(data, 'o', 'ana');
  assert.equal(data.mensajes.length, 2);
  data = resolvePublication(data, 'escalera', 'ana');
  assert.equal(data.mensajes.length, 2);
  assert.throws(() => sendDemoMessage(data, 'o', 'luis', 'Después del cierre.', 'm3'), /cerrada/);
  assert.equal(canConverse(data.publicaciones[0], data.ofrecimientos[0], 'luis'), true);
});

test('combina páginas sin duplicar mensajes y ordena bigint sin perder precisión', () => {
  const newer = { id: 'b', orden: '9007199254740993' };
  const older = { id: 'a', orden: '9007199254740992' };
  assert.deepEqual(mergeMessages([newer], [older, newer]), [older, newer]);
});
