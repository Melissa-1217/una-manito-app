import test from 'node:test';
import assert from 'node:assert/strict';
import { preparePublication, PreparationError } from '../api/prepare-publication.js';

const input = { texto: 'Necesito una escalera para esta tarde, la devuelvo hoy.', tipo: 'solicitud' };
const proposal = { titulo: 'Necesito una escalera', descripcion: 'Necesito una escalera para esta tarde. La devuelvo hoy.', categoria: 'Herramientas', por_confirmar: [] };
const responseFor = (value) => ({ ok: true, json: async () => ({ candidates: [{ finishReason: 'STOP', content: { parts: [{ text: JSON.stringify(value) }] } }] }) });

test('valida el mensaje antes de llamar al proveedor', async () => {
  await assert.rejects(preparePublication({ ...input, texto: 'hi' }, { apiKey: 'test', fetchImpl: () => assert.fail('No debe llamar a la API') }), (error) => error.status === 400);
});
test('acepta una palabra como contexto y conserva preguntas separadas', async () => {
  const result = await preparePublication({ texto: 'gasfitero', tipo: 'solicitud' }, { apiKey: 'test', fetchImpl: async () => responseFor({ ...proposal, por_confirmar: ['¿Qué necesitas reparar?'] }) });
  assert.deepEqual(result.por_confirmar, ['¿Qué necesitas reparar?']);
});
test('informa que falta configuración sin inventar una respuesta', async () => {
  await assert.rejects(preparePublication(input, {}), (error) => error.status === 503);
});
test('envía clave en header y devuelve únicamente campos validados', async () => {
  const actual = await preparePublication(input, { apiKey: 'test', fetchImpl: async (url, options) => {
    assert.equal(options.headers['x-goog-api-key'], 'test');
    assert.equal(url.includes('test'), false);
    const body = JSON.parse(options.body);
    assert.equal(body.generationConfig.responseMimeType, 'application/json');
    return responseFor({ ...proposal, barrio: 'Inventado' });
  } });
  assert.deepEqual(actual, proposal);
});
test('rechaza categoría ajena al formulario', async () => {
  await assert.rejects(preparePublication(input, { apiKey: 'test', fetchImpl: async () => responseFor({ ...proposal, categoria: 'Inventada' }) }), (error) => error.status === 422);
});
test('maneja el límite de uso del proveedor', async () => {
  await assert.rejects(preparePublication(input, { apiKey: 'test', fetchImpl: async () => ({ ok: false, status: 429 }) }), (error) => error instanceof PreparationError && error.status === 503);
});
