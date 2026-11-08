import { getSupabaseClient } from './supabase.js';

const fields = 'id,orden,ofrecimiento_id,autor_id,contenido,creado_en';
export const MESSAGE_PAGE_SIZE = 50;

export async function listMessages(responseId, { before, after } = {}) {
  let query = getSupabaseClient().from('mensajes_privados').select(fields).eq('ofrecimiento_id', responseId);
  if (before !== undefined) query = query.lt('orden', before);
  if (after !== undefined) query = query.gt('orden', after);
  const { data, error } = await query.order('orden', { ascending: after !== undefined }).limit(MESSAGE_PAGE_SIZE).abortSignal(AbortSignal.timeout(15000));
  if (error) throw error;
  return after !== undefined ? data : data.reverse();
}
export async function sendPrivateMessage(responseId, content, id) {
  const text = content.trim();
  if (!text || text.length > 1000) throw new Error('Escribe entre 1 y 1000 caracteres.');
  const { data, error } = await getSupabaseClient().rpc('enviar_mensaje_privado', { p_ofrecimiento_id: responseId, p_contenido: text, p_mensaje_id: id }).abortSignal(AbortSignal.timeout(15000)).single();
  if (error) throw error;
  return data;
}
