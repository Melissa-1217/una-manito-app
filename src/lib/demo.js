import { availableSlots } from './participation.js';

export const people = { ana: 'Ana', luis: 'Luis' };
export const initialData = {
  publicaciones: [
    { id: 'escalera', autor_id: 'ana', tipo: 'solicitud', titulo: '¿Me prestas una escalera?', descripcion: 'Necesito una escalera para esta tarde. La devuelvo hoy mismo y paso a recogerla. ¡Gracias, vecis!', categoria: 'Herramientas', barrio: 'Barrio Demo', estado: 'pendiente', es_emergencia: false },
    { id: 'gasfitero', autor_id: 'luis', tipo: 'servicio', titulo: 'Una mano con tus caños', descripcion: 'Servicio de gasfitería: reparaciones de caños y revisión de fugas. Publicación de ejemplo; todavía no hay contacto ni recomendaciones reales.', categoria: 'Gasfitería', barrio: 'Barrio Demo', estado: 'pendiente', es_emergencia: false },
    { id: 'agua', autor_id: 'ana', tipo: 'ofrecimiento', titulo: 'Agua para compartir', descripcion: 'Tengo agua embotellada para compartir. Podemos coordinar el apoyo desde esta publicación de ejemplo.', categoria: 'Agua y alimentos', barrio: 'Barrio Demo', estado: 'pendiente', es_emergencia: true },
  ],
  ofrecimientos: [],
};

export function offerHelp(data, publicationId, userId, message, id) {
  const publication = data.publicaciones.find((p) => p.id === publicationId);
  if (!publication || publication.estado === 'resuelta') throw new Error('Esta publicación ya no recibe respuestas.');
  if (publication.autor_id === userId) throw new Error('No puedes responder a tu propia publicación.');
  if (availableSlots(publication, data.ofrecimientos) === 0) throw new Error('Los cupos ya están completos.');
  if (data.ofrecimientos.some((o) => o.publicacion_id === publicationId && o.vecino_id === userId)) throw new Error('Ya respondiste a esta publicación.');
  if (message.trim().length < 2 || message.trim().length > 1000) throw new Error('Escribe un mensaje de 2 a 1000 caracteres.');
  return { ...data, ofrecimientos: [...data.ofrecimientos, { id, publicacion_id: publicationId, vecino_id: userId, mensaje: message.trim(), estado: 'pendiente' }] };
}

export function acceptOffer(data, offerId, userId) {
  const offer = data.ofrecimientos.find((o) => o.id === offerId);
  const publication = data.publicaciones.find((p) => p.id === offer?.publicacion_id);
  if (!offer || publication?.autor_id !== userId) throw new Error('Solo quien publicó puede aceptar la ayuda.');
  if (offer.estado === 'aceptado') return data;
  if (publication.estado === 'resuelta' || offer.estado !== 'pendiente') throw new Error('El ofrecimiento ya no está pendiente.');
  if (availableSlots(publication, data.ofrecimientos) === 0) throw new Error('Los cupos ya están completos.');
  return {
    publicaciones: data.publicaciones.map((p) => p.id === publication.id ? { ...p, estado: 'en_coordinacion' } : p),
    ofrecimientos: data.ofrecimientos.map((o) => o.id === offerId ? { ...o, estado: 'aceptado' } : o),
  };
}

export function resolvePublication(data, publicationId, userId) {
  const publication = data.publicaciones.find((p) => p.id === publicationId);
  if (!publication || publication.autor_id !== userId) throw new Error('Solo quien publicó puede cerrar la solicitud.');
  return { ...data, publicaciones: data.publicaciones.map((p) => p.id === publicationId ? { ...p, estado: 'resuelta' } : p) };
}

export function recommendHelper(data, offerId, userId) {
  const offer = data.ofrecimientos.find((item) => item.id === offerId);
  const publication = data.publicaciones.find((item) => item.id === offer?.publicacion_id);
  if (publication?.autor_id !== userId || publication.estado !== 'resuelta' || offer.estado !== 'aceptado') {
    throw new Error('Solo puedes recomendar después de cerrar una ayuda que aceptaste.');
  }
  return { ...data, ofrecimientos: data.ofrecimientos.map((item) => item.id === offerId ? { ...item, recomendado: true } : item) };
}

export function helperHistory(data, helperId) {
  const accepted = data.ofrecimientos.filter((offer) => offer.vecino_id === helperId && offer.estado === 'aceptado');
  const closed = data.publicaciones.filter((post) => post.estado === 'resuelta' && accepted.some((offer) => offer.publicacion_id === post.id));
  const recommendations = closed.filter((post) => accepted.some((offer) => offer.publicacion_id === post.id && offer.recomendado));
  return { total: closed.length, neighbors: new Set(recommendations.map((post) => post.autor_id)).size };
}
