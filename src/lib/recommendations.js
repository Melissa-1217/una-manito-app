import { getSupabaseClient } from './supabase.js';

export async function loadNeighbor(id) {
  const client = getSupabaseClient();
  const [profile, recommendations] = await Promise.all([
    client.from('perfiles').select('id,nombre,barrio').eq('id', id).single(),
    client.from('recomendaciones').select('id,autor_id,estrellas,comentario,creado_en,autor:perfiles!autor_id(nombre)').eq('vecino_id', id).order('creado_en', { ascending: false }),
  ]);
  if (profile.error) throw profile.error;
  if (recommendations.error) throw recommendations.error;
  return { profile: profile.data, recommendations: recommendations.data };
}

export async function recommendNeighbor(responseId, authorId, neighborId, comment, stars) {
  if (!Number.isInteger(stars) || stars < 1 || stars > 5) throw new Error('Elige entre una y cinco estrellas.');
  const { error } = await getSupabaseClient().from('recomendaciones').insert({
    ofrecimiento_id: responseId, autor_id: authorId, vecino_id: neighborId, comentario: comment.trim(), estrellas: stars,
  });
  if (error && error.code !== '23505') throw error;
  return error?.code === '23505' ? 'existing' : 'saved';
}

export function summarizeRatings(reviews) {
  const rated = reviews.filter(item => Number.isInteger(item.estrellas) && item.estrellas >= 1 && item.estrellas <= 5);
  const latest = new Map();
  [...reviews].sort((a,b) => new Date(b.creado_en) - new Date(a.creado_en)).forEach(item => {
    if (!latest.has(item.autor_id)) latest.set(item.autor_id, item);
  });
  return {
    average: rated.length ? rated.reduce((sum, item) => sum + item.estrellas, 0) / rated.length : null,
    count: rated.length,
    endorsements: [...latest.values()].filter(item => item.estrellas == null || item.estrellas >= 4).length,
  };
}
