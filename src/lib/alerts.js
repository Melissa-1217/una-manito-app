import { getSupabaseClient } from './supabase.js';
export const alertCategories={incendio:'Incendio',inundacion:'Inundación',corte_servicios:'Corte de servicios',riesgo_vial:'Riesgo en la vía',otro:'Otro incidente'};
export const alertStates={borrador:'Borrador privado',pendiente:'En revisión',publicado:'Publicado',rechazado:'No aprobado',finalizado:'Finalizado',retirado:'Retirado'};
export function alertError(error) {
 const text=error?.message||'';
 if(/REPORT_LIMIT/.test(text)) return 'Puedes enviar hasta 5 reportes por hora. Intenta más tarde.';
 if(/INVALID_DATE/.test(text)) return 'Indica una fecha de los últimos 7 días, sin horas futuras.';
 if(/REPORT_CONFLICT/.test(text)) return 'Este intento ya cambió. Vuelve al formulario y envíalo nuevamente.';
 if(/NOT_AUTHORIZED|BARRIO_CHANGED|AUTH_REQUIRED/.test(text)) return 'No tienes permiso o cambió tu sesión o barrio. Vuelve a ingresar.';
 if(/REASON_REQUIRED/.test(text)) return 'Escribe una explicación de al menos 5 caracteres.';
 if(/INVALID_STATE/.test(text)) return 'El reporte ya fue actualizado. Actualiza la lista.';
 if(/42P01|PGRST20[245]|does not exist|schema cache/i.test(`${error?.code} ${text}`)) return 'Falta activar Avisos del barrio en Supabase. El resto de la app sigue disponible.';
 return 'No pudimos completar la operación. Comprueba tu conexión e inténtalo nuevamente.';
}
export async function alertRpc(name,args) { const {data,error}=await getSupabaseClient().rpc(name,args); if(error) throw error; return data; }
export async function loadAlertCenter(userId) {
 const client=getSupabaseClient();
 const [publicResult,privateResult,role]=await Promise.all([
  client.from('avisos_publicos').select('*').order('actualizado_en',{ascending:false}).limit(100),
  client.from('avisos_barrio').select('*').order('creado_en',{ascending:false}).limit(100),
  client.rpc('soy_revisor_avisos')]);
 for(const result of [publicResult,privateResult,role]) if(result.error) throw result.error;
 return {notices:publicResult.data||[],mine:(privateResult.data||[]).filter(a=>a.autor_id===userId),queue:(privateResult.data||[]).filter(a=>a.autor_id!==userId&&['pendiente','publicado','finalizado'].includes(a.estado)),reviewer:Boolean(role.data)};
}
export async function loadPublicNotices() {
 const {data,error}=await getSupabaseClient().from('avisos_publicos').select('id,version').order('actualizado_en',{ascending:false}).limit(100);
 if(error) throw error; return data||[];
}
const readKey=account=>`una-manito-avisos-leidos:${account.id}:${account.barrio}`;
export function countUnread(account,notices) { let seen={}; try{seen=JSON.parse(localStorage.getItem(readKey(account)))||{};}catch{/* No guardar contenido ni fotos. */} return notices.filter(n=>seen[n.id]!==n.version).length; }
export function markNoticesRead(account,notices) { try { localStorage.setItem(readKey(account),JSON.stringify(Object.fromEntries(notices.map(n=>[n.id,n.version])))); }catch{/* Sigue funcionando sin almacenamiento. */} }

export async function normalizeAlertPhoto(file) {
 if(!['image/jpeg','image/png','image/webp'].includes(file.type)||file.size>5242880) throw new Error('Usa una foto JPG, PNG o WebP de hasta 5 MB.');
 const bitmap=await createImageBitmap(file);
 try {
  const scale=Math.min(1,1600/Math.max(bitmap.width,bitmap.height));
  const canvas=document.createElement('canvas'); canvas.width=Math.max(1,Math.round(bitmap.width*scale)); canvas.height=Math.max(1,Math.round(bitmap.height*scale));
  const ctx=canvas.getContext('2d'); ctx.fillStyle='#fff'; ctx.fillRect(0,0,canvas.width,canvas.height); ctx.drawImage(bitmap,0,0,canvas.width,canvas.height);
  const blob=await new Promise(resolve=>canvas.toBlob(resolve,'image/jpeg',0.85));
  if(!blob||blob.size>5242880) throw new Error('No pudimos preparar la foto. Prueba con otra más pequeña.');
  // La nueva codificación no conserva los metadatos EXIF/GPS del archivo original.
  return blob;
 } finally { bitmap.close(); }
}
export async function submitAlert(report,photo,id) {
 await alertRpc('guardar_borrador_aviso',{p_id:id,p_titulo:report.titulo,p_descripcion:report.descripcion,p_zona:report.zona,p_categoria:report.categoria,p_observado_en:new Date(report.observado_en).toISOString()});
 const saved=await getSupabaseClient().from('avisos_barrio').select('estado').eq('id',id).single();
 if(saved.error) throw saved.error;
 if(saved.data.estado==='pendiente') {
  // Puede haberse enviado aunque se perdiera la respuesta de red. No reabrir la foto.
  await alertRpc('enviar_aviso',{p_id:id,p_con_foto:Boolean(photo)});
  return;
 }
 if(photo) {
  const {error}=await getSupabaseClient().storage.from('avisos-fotos').upload(`${id}/foto.jpg`,photo,{contentType:'image/jpeg',cacheControl:'0',upsert:false});
  if(error&&Number(error.statusCode)!==409) throw error;
 }
 await alertRpc('enviar_aviso',{p_id:id,p_con_foto:Boolean(photo)});
}
export async function analyzeAlert(id) {
 const {data,error}=await getSupabaseClient().auth.getSession();
 if(error||!data.session) throw new Error('Inicia sesión para consultar la IA.');
 const response=await fetch('/api/classify-alert',{method:'POST',headers:{'Content-Type':'application/json',Authorization:`Bearer ${data.session.access_token}`},body:JSON.stringify({id}),signal:AbortSignal.timeout(30000)});
 const result=await response.json(); if(!response.ok) throw new Error(result.error||'La IA no está disponible.'); return result.orientacion;
}
// Descarga autenticada, sin enlaces públicos persistentes o compartibles.
export async function downloadAlertPhoto(path) {
 const {data,error}=await getSupabaseClient().storage.from('avisos-fotos').download(path,{}, {cache:'no-store'});
 if(error) throw error; return data;
}
