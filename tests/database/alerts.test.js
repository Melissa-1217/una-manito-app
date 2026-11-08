import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {PGlite} from '@electric-sql/pglite';

test('avisos: pendientes privados, revisión humana por barrio, fotos, cuotas, retiro y trazabilidad',async()=>{
 const db=new PGlite();const uid=n=>`00000000-0000-0000-0000-${String(n).padStart(12,'0')}`;const id=n=>`a0000000-0000-0000-0000-${String(n).padStart(12,'0')}`;
 async function as(n){await db.exec('reset role');await db.query("select set_config('request.jwt.claim.sub',$1,false)",[n?uid(n):'']);await db.exec('set role authenticated');}
 const draft=n=>db.query("select guardar_borrador_aviso($1,'Árbol caído en el parque','Un árbol bloquea el paso por la zona norte.','Parque, lado norte','riesgo_vial',date_trunc('minute',now()))",[id(n)]);
 const review=(n,action,photo=false)=>db.query("select revisar_aviso($1,$2,'Paso bloqueado en el parque','Un árbol bloquea el paso. Evitar esa zona.','Parque central','importante',$3,'Revisión vecinal y actualización del estado.')",[id(n),action,photo]);
 const rows=table=>db.query(`select * from ${table}`);
 try{
  await db.exec(await readFile(new URL('../fixtures/conversation-schema.sql',import.meta.url),'utf8'));
  await db.exec("create schema storage;create table storage.buckets(id text primary key,name text,public boolean,file_size_limit bigint,allowed_mime_types text[]);create table storage.objects(bucket_id text,name text,primary key(bucket_id,name));alter table storage.objects enable row level security;grant usage on schema storage to authenticated;grant select,insert,delete on storage.objects to authenticated;");
  const migration=await readFile(new URL('../../supabase/migrations/20261112_avisos_barrio.sql',import.meta.url),'utf8');await db.exec(migration);await db.exec(migration);
  await db.query('insert into revisores_avisos values($1,$2)',[uid(2),'Barrio Demo']);
  await as(1);await draft(1);await draft(1);
  assert.equal((await rows('avisos_barrio')).rows.length,1,'reintento idempotente');
  await assert.rejects(db.query("select guardar_borrador_aviso($1,'Título modificado','Descripción modificada del incidente','Otra zona','otro',now())",[id(1)]),/REPORT_CONFLICT/);
  await db.query("insert into storage.objects values('avisos-fotos',$1)",[`${id(1)}/foto.jpg`]);
  await db.query('select enviar_aviso($1,true)',[id(1)]);await db.query('select enviar_aviso($1,true)',[id(1)]);
  await assert.rejects(db.query("insert into storage.objects values('avisos-fotos',$1)",[`${id(2)}/foto.jpg`]),/row-level security/);
  await assert.rejects(db.query("update avisos_barrio set estado='publicado'"),/permission denied/);
  await assert.rejects(db.query('insert into revisores_avisos values($1,$2)',[uid(1),'Barrio Demo']),/permission denied/);
  await as(3);assert.equal((await rows('avisos_barrio')).rows.length,0);assert.equal((await rows('avisos_publicos')).rows.length,0);assert.equal((await rows('storage.objects')).rows.length,0);await assert.rejects(review(1,'aprobar'),/NOT_AUTHORIZED/);
  await as(5);await assert.rejects(review(1,'aprobar'),/NOT_AUTHORIZED/);
  await as(2);assert.equal((await rows('avisos_barrio')).rows.length,1);assert.equal((await rows('storage.objects')).rows.length,1);
  await draft(2);await db.query('select enviar_aviso($1,false)',[id(2)]);await assert.rejects(review(2,'aprobar'),/NOT_AUTHORIZED/);
  await review(1,'aprobar',false);
  await as(3);const notice=(await rows('avisos_publicos')).rows[0];assert.equal(notice.titulo,'Paso bloqueado en el parque');assert.equal(notice.foto_path,null);assert.equal((await rows('storage.objects')).rows.length,0,'foto excluida no es accesible');assert.equal((await rows('historial_avisos')).rows.length,0);
  await as(5);assert.equal((await rows('avisos_publicos')).rows.length,0,'otro barrio no recibe avisos');
  await as(1);await draft(3);await db.query('select enviar_aviso($1,false)',[id(3)]);
  await as(2);await review(3,'rechazar');
  await assert.rejects(db.query("select revisar_aviso($1,'retirar','','','','informativo',false,null)",[id(1)]),/REASON_REQUIRED/);
  await as(3);assert.equal((await rows('avisos_publicos')).rows.length,1,'rechazo nunca aparece públicamente');
  await as(2);await review(1,'finalizar');assert.equal((await rows('avisos_publicos')).rows[0].version,2);
  await as(1);await db.query("select retirar_mi_aviso($1,'El paso ya fue despejado por los vecinos.')",[id(1)]);
  await as(3);const correction=(await rows('avisos_publicos')).rows[0];assert.equal(correction.estado,'retirado');assert.equal(correction.titulo,'Aviso retirado');assert.equal(correction.version,3);
  await as(1);await draft(4);await db.query("insert into storage.objects values('avisos-fotos',$1)",[`${id(4)}/foto.jpg`]);await db.query('select enviar_aviso($1,true)',[id(4)]);
  await as(2);await review(4,'aprobar',true);
  await as(3);assert.equal((await rows('storage.objects')).rows.length,1,'solo la foto aprobada es visible en el mismo barrio');
  await as(5);assert.equal((await rows('storage.objects')).rows.length,0);
  await as(1);await assert.rejects(db.query('select retirar_mi_aviso($1,null)',[id(4)]),/REASON_REQUIRED/);
  await db.query("select retirar_mi_aviso($1,'Foto y reporte retirados por corrección.')",[id(4)]);
  await as(3);assert.equal((await rows('storage.objects')).rows.length,0,'retirar revoca nuevas descargas');
  await as(1);for(let n=0;n<10;n++)await db.query('select tomar_turno_ia_aviso($1)',[id(1)]);await assert.rejects(db.query('select tomar_turno_ia_aviso($1)',[id(1)]),/AI_LIMIT/);
  for(const n of [5,6])await draft(n);await assert.rejects(draft(7),/REPORT_LIMIT/);
  await as(3);await assert.rejects(db.query('select tomar_turno_ia_aviso($1)',[id(1)]),/NOT_AUTHORIZED/);
  await db.exec('reset role');await db.query("update perfiles set barrio='Otra zona' where id=$1",[uid(2)]);await as(2);assert.equal((await db.query('select soy_revisor_avisos() as allowed')).rows[0].allowed,false,'rol no sigue al usuario hacia otro barrio');
  await db.exec('set role anon');await assert.rejects(rows('avisos_publicos'),/permission denied/);
 }finally{await db.close();}
});
