import test from 'node:test';
import assert from 'node:assert/strict';
import { changeDemoLifecycle, initializeDemoDates, isActive, publicationState, WEEK_MS } from '../src/lib/lifecycle.js';
import { offerHelp, acceptOffer } from '../src/lib/demo.js';

const now = Date.parse('2026-11-07T12:00:00Z');
const post = { id: 'p', autor_id: 'ana', estado: 'pendiente', tipo: 'solicitud', vence_en: new Date(now).toISOString(), primera_respuesta_en: null };
const sample = () => ({ publicaciones: [{ ...post }], ofrecimientos: [] });

test('vence exactamente en el plazo y solo cuando no recibió respuestas', () => {
  assert.equal(publicationState(post, now - 1), 'pendiente');
  assert.equal(publicationState(post, now), 'vencida');
  assert.equal(publicationState(post, now, true), 'pendiente');
  assert.equal(publicationState({ ...post, primera_respuesta_en: '2026-11-06T12:00:00Z' }, now), 'pendiente');
  for (const estado of ['en_coordinacion', 'resuelta', 'cancelada']) assert.equal(publicationState({ ...post, estado }, now), estado);
});

test('renovar conserva la identidad e historial y concede siete días desde la renovación', () => {
  const data = sample();
  const renewed = changeDemoLifecycle(data, 'p', 'ana', 'renovar', '', now);
  assert.equal(renewed.publicaciones[0].id, 'p');
  assert.equal(Date.parse(renewed.publicaciones[0].vence_en), now + WEEK_MS);
  assert.equal(renewed.ofrecimientos, data.ofrecimientos);
  assert.throws(() => changeDemoLifecycle(data, 'p', 'luis', 'renovar', '', now), /Solo quien/);
  assert.throws(() => changeDemoLifecycle(renewed, 'p', 'ana', 'renovar', '', now), /cambió de estado/);
});

test('cancelar requiere motivo, conserva participantes y no permite reabrir lo resuelto', () => {
  const data = sample();
  data.publicaciones[0].estado = 'en_coordinacion';
  data.ofrecimientos.push({ id: 'o', publicacion_id: 'p', vecino_id: 'luis', estado: 'aceptado', recomendado: true });
  assert.throws(() => changeDemoLifecycle(data, 'p', 'ana', 'cancelar', '', now), /motivo/);
  const cancelled = changeDemoLifecycle(data, 'p', 'ana', 'cancelar', 'Ya no necesito ayuda.', now);
  assert.equal(cancelled.publicaciones[0].estado, 'cancelada');
  assert.equal(cancelled.ofrecimientos[0].recomendado, true);
  const resolved = changeDemoLifecycle(data, 'p', 'ana', 'resolver', '', now);
  assert.equal(isActive(resolved.publicaciones[0]), false);
  assert.equal(resolved.ofrecimientos, data.ofrecimientos);
  assert.throws(() => changeDemoLifecycle(resolved, 'p', 'ana', 'renovar', '', now), /cambió/);
  assert.throws(() => changeDemoLifecycle(resolved, 'p', 'ana', 'cancelar', 'Otro motivo.', now), /cambió/);
});

test('una publicación cancelada o vencida no recibe ni acepta respuestas', () => {
  for (const estado of ['cancelada', 'vencida']) {
    const data = sample(); data.publicaciones[0].estado = estado;
    assert.throws(() => offerHelp(data, 'p', 'luis', 'Puedo ayudar.', 'o'), /ya no recibe/);
    data.ofrecimientos.push({ id: 'o', publicacion_id: 'p', vecino_id: 'luis', estado: 'pendiente' });
    assert.throws(() => acceptOffer(data, 'o', 'ana'), /ya no está pendiente/);
  }
});

test('los datos antiguos de demostración reciben fechas una sola vez', () => {
  const data = { publicaciones: [{ id: 'p', estado: 'pendiente' }], ofrecimientos: [] };
  const initialized = initializeDemoDates(data, now);
  assert.equal(Date.parse(initialized.publicaciones[0].vence_en), now + WEEK_MS);
  assert.deepEqual(initializeDemoDates(initialized, now + WEEK_MS), initialized);
});
