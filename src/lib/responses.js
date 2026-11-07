import { getSupabaseClient } from './supabase.js';

export async function sendResponse(publicationId, userId, message) {
  const text = message.trim();
  if (text.length < 2 || text.length > 1000) throw new Error('Mensaje inválido');
  const { data, error } = await getSupabaseClient().from('ofrecimientos')
    .insert({ publicacion_id: publicationId, vecino_id: userId, mensaje: text })
    .select('id,publicacion_id,vecino_id,mensaje,estado,perfiles(nombre)').single();
  if (error) throw error;
  return data;
}

export async function acceptResponse(id) {
  const { error } = await getSupabaseClient().rpc('aceptar_ofrecimiento', { respuesta_id: id });
  if (error) throw error;
}
