export const WEEK_MS = 7 * 24 * 60 * 60 * 1000;

export function publicationState(publication, now = Date.now(), hasResponses = false) {
  if (publication.estado !== 'pendiente' || publication.primera_respuesta_en || hasResponses) return publication.estado;
  const expires = Date.parse(publication.vence_en);
  return Number.isFinite(expires) && expires <= now ? 'vencida' : publication.estado;
}

export function isActive(publication) {
  return ['pendiente', 'en_coordinacion'].includes(publication.estado);
}

// Only for old browser demo data; real deadlines are supplied by Supabase.
export function initializeDemoDates(data, now = Date.now()) {
  return { ...data, publicaciones: data.publicaciones.map(publication => {
    const created = publication.creado_en || new Date(now).toISOString();
    return { ...publication, creado_en: created,
      vence_en: publication.vence_en || new Date(Date.parse(created) + WEEK_MS).toISOString(),
      primera_respuesta_en: publication.primera_respuesta_en || (data.ofrecimientos.some(response => response.publicacion_id === publication.id) ? created : null),
    };
  }) };
}

export function changeDemoLifecycle(data, id, userId, action, reason = '', now = Date.now()) {
  const post = data.publicaciones.find(publication => publication.id === id);
  if (!post || post.autor_id !== userId) throw new Error('Solo quien publicó puede cambiar su estado.');
  const state = publicationState(post, now, data.ofrecimientos.some(response => response.publicacion_id === id));
  let changes;
  if (action === 'renovar' && state === 'vencida' && !post.primera_respuesta_en && !data.ofrecimientos.some(response => response.publicacion_id === id)) {
    changes = { estado: 'pendiente', vence_en: new Date(now + WEEK_MS).toISOString(), cerrado_en: null, motivo_cancelacion: null };
  } else if (action === 'resolver' && ['pendiente', 'en_coordinacion'].includes(state)) {
    changes = { estado: 'resuelta', cerrado_en: new Date(now).toISOString() };
  } else if (action === 'cancelar' && !['resuelta', 'cancelada'].includes(state)) {
    const text = reason.trim();
    if (text.length < 5 || text.length > 300) throw new Error('Indica un motivo de 5 a 300 caracteres.');
    changes = { estado: 'cancelada', motivo_cancelacion: text, cerrado_en: new Date(now).toISOString() };
  } else throw new Error('La publicación ya cambió de estado. Actualiza la lista.');
  return { ...data, publicaciones: data.publicaciones.map(publication => publication.id === id ? { ...publication, ...changes } : publication) };
}
