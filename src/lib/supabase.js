import { createClient } from '@supabase/supabase-js';

// VITE_* es visible en el navegador. Usar únicamente la clave publicable.
let client;

export function getSupabaseClient() {
  if (client) return client;
  const url = import.meta.env.VITE_SUPABASE_URL;
  const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) throw new Error('Configura la URL y la clave publicable de Supabase en .env.local.');
  if (!key.startsWith('sb_publishable_')) throw new Error('Usa la clave sb_publishable_; nunca una clave secret o service_role.');
  client = createClient(url, key);
  return client;
}
