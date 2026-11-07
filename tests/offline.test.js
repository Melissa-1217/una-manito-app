import test from 'node:test';
import assert from 'node:assert/strict';
import { saveSnapshot, readSnapshot, saveOfflineProfile, readOfflineProfile, clearOfflineAccount, saveDraft, readDraft } from '../src/lib/offline.js';

test('la copia offline separa cuentas y barrios y no guarda mensajes privados', () => {
  const store = new Map();
  globalThis.localStorage = { getItem: k => store.get(k) || null, setItem: (k,v) => store.set(k,v), removeItem: k => store.delete(k), key: i => [...store.keys()][i], get length() { return store.size; } };
  const ana = { id: 'ana', nombre: 'Ana', barrio: 'Demo' };
  const post = { id: 'p', autor_id: 'ana', titulo: 'Necesito una escalera', descripcion: 'Una ayuda para hoy.', barrio: 'Demo', estado: 'pendiente', ofrecimientos: [{ mensaje: 'MENSAJE PRIVADO' }], email: 'privado@example.com', perfiles: { nombre: 'Ana', telefono: '123' }, participantes: [{ vecino_id: 'luis', nombre: 'Luis', mensaje: 'OTRO PRIVADO' }] };
  saveOfflineProfile(ana); saveSnapshot(ana, [post]);
  assert.deepEqual(readOfflineProfile(), ana);
  const snapshot = readSnapshot(ana);
  assert.equal(snapshot.publicaciones[0].titulo, post.titulo);
  assert.equal(JSON.stringify(snapshot).includes('PRIVADO'), false);
  assert.equal(JSON.stringify(snapshot).includes('telefono'), false);
  assert.equal(JSON.stringify(snapshot).includes('email'), false);
  assert.equal(readSnapshot({ ...ana, id: 'luis' }), null);
  assert.equal(readSnapshot({ ...ana, barrio: 'Otra zona' }), null);
  const draft = { tipo: 'solicitud', titulo: 'Borrador', descripcion: 'Sin publicar.', barrio: 'Demo' };
  saveDraft(ana, draft);
  assert.deepEqual(readDraft(ana), draft);
  clearOfflineAccount(ana);
  assert.equal(readOfflineProfile(), null);
  assert.equal(readSnapshot(ana), null);
  assert.equal(readDraft(ana), null);
  delete globalThis.localStorage;
});
