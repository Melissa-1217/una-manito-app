import { getSupabaseClient } from './supabase.js';

const fields = 'id,autor_id,tipo,titulo,descripcion,categoria,barrio,latitud,longitud,es_emergencia,estado,creado_en,perfiles(nombre)';

export async function listPublications() {
  const { data, error } = await getSupabaseClient().from('publicaciones').select(fields).order('creado_en', { ascending: false });
  if (error) throw error;
  return data;
}

export async function createPublication(draft, authorId) {
  const { data, error } = await getSupabaseClient().from('publicaciones').insert({
    autor_id: authorId,
    tipo: draft.tipo,
    titulo: draft.titulo.trim(),
    descripcion: draft.descripcion.trim(),
    categoria: draft.categoria,
    barrio: draft.barrio.trim(),
    es_emergencia: draft.es_emergencia,
  }).select(fields).single();
  if (error) throw error;
  return data;
}

export async function closePublication(id, authorId) {
  const { data, error } = await getSupabaseClient().from('publicaciones').update({ estado: 'resuelta' }).eq('id', id).eq('autor_id', authorId).select(fields).single();
  if (error) throw error;
  return data;
}
