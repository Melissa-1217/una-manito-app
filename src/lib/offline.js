export const OFFLINE_PROFILE = 'una-manito-offline-profile-v1';
const prefix = 'una-manito-offline-v1:';
const key = (kind, account) => `${prefix}${kind}:${account.id}:${encodeURIComponent(account.barrio)}`;
const parse = name => { try { return JSON.parse(localStorage.getItem(name)); } catch { return null; } };

export function readOfflineProfile() {
  const profile = parse(OFFLINE_PROFILE);
  return profile && typeof profile.id === 'string' && typeof profile.nombre === 'string' && typeof profile.barrio === 'string' ? profile : null;
}
export function saveOfflineProfile(profile) {
  localStorage.setItem(OFFLINE_PROFILE, JSON.stringify({ id: profile.id, nombre: profile.nombre, barrio: profile.barrio }));
}
export function readSnapshot(account) {
  const snapshot = parse(key('publications', account));
  return snapshot && Array.isArray(snapshot.publicaciones) && typeof snapshot.savedAt === 'string' ? snapshot : null;
}
export function saveSnapshot(account, publications) {
  const fields = ['id','autor_id','tipo','titulo','descripcion','categoria','barrio','latitud','longitud','es_emergencia','estado','cupos','creado_en','vence_en','primera_respuesta_en','cerrado_en','motivo_cancelacion'];
  const saved = publications.filter(post => post.barrio === account.barrio || post.autor_id === account.id || post.participantes?.some(p => p.vecino_id === account.id)).slice(0, 200).map(post => ({
    ...Object.fromEntries(fields.filter(field => post[field] !== undefined).map(field => [field, post[field]])),
    perfiles: { nombre: post.perfiles?.nombre || 'Vecino' },
    participantes: (post.participantes || []).map(p => ({ vecino_id: p.vecino_id, nombre: p.nombre })),
  }));
  const snapshot = { savedAt: new Date().toISOString(), publicaciones: saved };
  localStorage.setItem(key('publications', account), JSON.stringify(snapshot));
  return snapshot;
}
export function readDraft(account) {
  const draft = parse(key('draft', account));
  return draft && ['solicitud','ofrecimiento','servicio'].includes(draft.tipo) && draft.barrio === account.barrio && typeof draft.titulo === 'string' && typeof draft.descripcion === 'string' ? draft : null;
}
export function saveDraft(account, draft) {
  if (!draft.titulo.trim() && !draft.descripcion.trim()) { localStorage.removeItem(key('draft', account)); return; }
  const fields = ['tipo','titulo','descripcion','categoria','barrio','cupos','es_emergencia','latitud','longitud'];
  localStorage.setItem(key('draft', account), JSON.stringify(Object.fromEntries(fields.filter(f => draft[f] !== undefined).map(f => [f, draft[f]]))));
}
export function clearOfflineAccount(account) {
  if (readOfflineProfile()?.id === account.id) localStorage.removeItem(OFFLINE_PROFILE);
  for (let index = localStorage.length - 1; index >= 0; index--) {
    const name = localStorage.key(index);
    if (name?.startsWith(`${prefix}publications:${account.id}:`) || name?.startsWith(`${prefix}draft:${account.id}:`) || name?.startsWith(`${prefix}support:${account.id}:`)) localStorage.removeItem(name);
  }
}

export function readSupportSnapshot(account) {
  const snapshot = parse(key('support', account));
  return snapshot && Array.isArray(snapshot.contacts) && typeof snapshot.savedAt === 'string' ? snapshot : null;
}
export function saveSupportSnapshot(account, contacts) {
  const fields = ['id','nombre','descripcion','ambito','barrio','telefono','url_contacto','fuente_url','revisado_en'];
  const snapshot = { savedAt: new Date().toISOString(), contacts: contacts.filter(contact => contact.ambito === 'nacional' || contact.barrio === account.barrio).map(contact => Object.fromEntries(fields.filter(field => contact[field] !== undefined).map(field => [field, contact[field]]))) };
  localStorage.setItem(key('support', account), JSON.stringify(snapshot));
  return snapshot;
}
