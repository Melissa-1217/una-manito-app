import test from 'node:test';
import assert from 'node:assert/strict';
import { initialData, offerHelp, acceptOffer, resolvePublication } from '../src/lib/demo.js';

test('Ana publica, Luis ofrece ayuda, Ana acepta y resuelve', () => {
  const offered = offerHelp(initialData, 'escalera', 'luis', 'Te presto mi escalera.', 'respuesta-1');
  const accepted = acceptOffer(offered, 'respuesta-1', 'ana');
  assert.equal(accepted.ofrecimientos[0].estado, 'aceptado');
  assert.equal(accepted.publicaciones[0].estado, 'en_coordinacion');
  assert.equal(resolvePublication(accepted, 'escalera', 'ana').publicaciones[0].estado, 'resuelta');
  assert.equal(initialData.publicaciones[0].estado, 'pendiente');
});
test('no permite responder a una publicación propia', () => {
  assert.throws(() => offerHelp(initialData, 'escalera', 'ana', 'Mi respuesta', '1'), /propia/);
});
test('no permite respuestas duplicadas', () => {
  const data = offerHelp(initialData, 'escalera', 'luis', 'Tengo una escalera', '1');
  assert.throws(() => offerHelp(data, 'escalera', 'luis', 'Otra respuesta', '2'), /Ya respondiste/);
});
test('solo el autor puede aceptar y resolver en la demo', () => {
  const data = offerHelp(initialData, 'escalera', 'luis', 'Tengo una escalera', '1');
  assert.throws(() => acceptOffer(data, '1', 'luis'), /Solo quien/);
  assert.throws(() => resolvePublication(data, 'escalera', 'luis'), /Solo quien/);
});
test('una publicación resuelta no recibe nuevas respuestas', () => {
  const data = resolvePublication(initialData, 'escalera', 'ana');
  assert.throws(() => offerHelp(data, 'escalera', 'luis', 'Tengo una escalera', '1'), /ya no recibe/);
});
