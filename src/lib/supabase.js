import { createClient } from '@supabase/supabase-js';

// Preparado para la siguiente etapa. La interfaz actual usa datos de demostración.
// VITE_* es visible en el navegador: aquí solo se admite una clave publicable.
export function getSupabaseClient() {
  const url = import.meta.env.VITE_SUPABASE_URL;
  const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) throw new Error('Configura la URL y la clave publicable de Supabase en .env.local.');
  if (!key.startsWith('sb_publishable_')) throw new Error('Usa la clave sb_publishable_; nunca una clave secret o service_role.');
  return createClient(url, key);
}
