import { isActive } from './lifecycle.js';

export function canConverse(publication, response, userId) {
  return Boolean(publication && response && response.publicacion_id === publication.id && (publication.autor_id === userId || response.vecino_id === userId));
}
export function conversationWritable(publication, response) {
  return isActive(publication) && ['pendiente','aceptado'].includes(response.estado);
}
export function mergeMessages(current, incoming) {
  return [...new Map([...current, ...incoming].map(message => [message.id, message])).values()].sort((a,b) => {
    const first = BigInt(a.orden); const second = BigInt(b.orden);
    return first < second ? -1 : first > second ? 1 : 0;
  });
}
export function sendDemoMessage(data, responseId, userId, content, id) {
  const response = data.ofrecimientos.find(item => item.id === responseId);
  const publication = data.publicaciones.find(post => post.id === response?.publicacion_id);
  if (!canConverse(publication, response, userId)) throw new Error('Solo los participantes pueden conversar.');
  const text = content.trim();
  if (!text || text.length > 1000) throw new Error('Escribe entre 1 y 1000 caracteres.');
  const existing = (data.mensajes || []).find(message => message.id === id);
  if (existing) {
    if (existing.autor_id !== userId || existing.ofrecimiento_id !== responseId || existing.contenido !== text) throw new Error('El identificador pertenece a otro mensaje.');
    return { data, message: existing };
  }
  if (!conversationWritable(publication, response)) throw new Error('La conversación ya está cerrada.');
  const orden = (data.mensajes || []).reduce((maximum, item) => Math.max(maximum, Number(item.orden)), 0) + 1;
  const message = { id, orden, ofrecimiento_id: responseId, autor_id: userId, contenido: text, creado_en: new Date().toISOString() };
  return { data: { ...data, mensajes: [...(data.mensajes || []), message] }, message };
}
