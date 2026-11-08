import { getSupabaseClient } from './supabase.js';

export const nationalContacts = [
  { id: 'policia', nombre: 'Policía Nacional', descripcion: 'Central policial de emergencia.', telefono: '105' },
  { id: 'bomberos', nombre: 'Bomberos', descripcion: 'Central de emergencia de bomberos.', telefono: '116' },
].map(contact => ({ ...contact, ambito: 'nacional', fuente_url: 'https://www.gob.pe/institucion/pnp/contacto-y-numeros-de-emergencias', revisado_en: '2026-11-07' }));

export async function listSupport() {
  const { data, error } = await getSupabaseClient().from('servicios_apoyo')
    .select('id,nombre,descripcion,ambito,barrio,telefono,url_contacto,fuente_url,revisado_en')
    .eq('activo', true).eq('revisado', true).order('nombre').abortSignal(AbortSignal.timeout(15000));
  if (error) throw error;
  return data;
}

export function safeSupportLink(value) {
  try { const url = new URL(value); return url.protocol === 'https:' ? url.href : null; } catch { return null; }
}
