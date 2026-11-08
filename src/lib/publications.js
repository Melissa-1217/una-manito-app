import { validateProduct } from './products.js';
import { getSupabaseClient } from './supabase.js';
import { approximateLocation, hasCoordinates } from './location.js';
import { validateCapacity } from './participation.js';

const fields = 'id,autor_id,tipo,titulo,descripcion,categoria,barrio,latitud,longitud,es_emergencia,estado,cupos,creado_en,vence_en,primera_respuesta_en,cerrado_en,motivo_cancelacion,perfiles(nombre)';

const productFields = fields + ',producto_modalidad';
const missingProductColumn = error => ['42703','PGRST204'].includes(error?.code) && /producto_modalidad/.test(error.message || '');

export async function listPublications() {
  const sweep = await getSupabaseClient().rpc('vencer_publicaciones');
  if (sweep.error) throw sweep.error;
  const nested = ',ofrecimientos(id,publicacion_id,vecino_id,mensaje,estado,perfiles(nombre))';
  let { data, error } = await getSupabaseClient().from('publicaciones').select(productFields + nested).order('creado_en', { ascending:false });
  if (missingProductColumn(error)) ({ data,error } = await getSupabaseClient().from('publicaciones').select(fields + nested).order('creado_en', { ascending:false }));
  if (error) throw error;
  const result = await getSupabaseClient().rpc('participantes_confirmados');
  if (result.error) throw result.error;
  const grouped = new Map();
  for (const participant of result.data || []) {
    const members = grouped.get(participant.publicacion_id) || [];
    members.push(participant);
    grouped.set(participant.publicacion_id, members);
  }
  return data.map(publication => ({ ...publication, participantes: grouped.get(publication.id) || [] }));
}

export async function createPublication(draft, authorId) {
  const product = validateProduct(draft);
  const { data, error } = await getSupabaseClient().from('publicaciones').insert({
    autor_id: authorId,
    tipo: draft.tipo,
    titulo: draft.titulo.trim(),
    descripcion: draft.descripcion.trim(),
    categoria: draft.categoria,
    barrio: draft.barrio.trim(),
    es_emergencia: draft.es_emergencia,
    cupos: validateCapacity(draft),
    ...(product ? { producto_modalidad:product } : {}),
    ...(hasCoordinates(draft) ? approximateLocation(draft.latitud, draft.longitud) : {}),
  }).select(product ? productFields : fields).single();
  if (product && missingProductColumn(error)) throw new Error('PRODUCTS_SETUP_REQUIRED');
  if (error) throw error;
  return data;
}

export async function changePublicationLifecycle(id, action, reason = '') {
  const { data, error } = await getSupabaseClient().rpc('gestionar_publicacion', {
    publicacion_id: id, accion: action, motivo: reason,
  }).single();
  if (error) throw error;
  return data;
}

export async function closePublication(id) {
  return changePublicationLifecycle(id, 'resolver');
}
