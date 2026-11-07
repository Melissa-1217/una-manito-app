import { getSupabaseClient } from './supabase.js';

export async function loadNeighbor(id) {
  const client = getSupabaseClient();
  const [profile, recommendations] = await Promise.all([
    client.from('perfiles').select('id,nombre,barrio').eq('id', id).single(),
    client.from('recomendaciones').select('id,autor_id,comentario,creado_en,autor:perfiles!autor_id(nombre)').eq('vecino_id', id).order('creado_en', { ascending: false }),
  ]);
  if (profile.error) throw profile.error;
  if (recommendations.error) throw recommendations.error;
  return { profile: profile.data, recommendations: recommendations.data };
}

export async function recommendNeighbor(responseId, authorId, neighborId, comment) {
  const { error } = await getSupabaseClient().from('recomendaciones').insert({
    ofrecimiento_id: responseId, autor_id: authorId, vecino_id: neighborId, comentario: comment.trim(),
  });
  if (error && error.code !== '23505') throw error;
}
