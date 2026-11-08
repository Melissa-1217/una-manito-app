import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {PGlite} from '@electric-sql/pglite';

test('limpieza y carga manual: conserva cuentas y roles, idempotencia, ejemplos privados y sin CASCADE',async()=>{
 const db=new PGlite();const sql=path=>readFile(new URL(`../../supabase/${path}`,import.meta.url),'utf8');
 const count=async table=>(await db.query(`select count(*)::int as n from ${table}`)).rows[0].n;
 try{
  await db.exec(await readFile(new URL('../fixtures/conversation-schema.sql',import.meta.url),'utf8'));
  await db.exec("create table auth.users(id uuid primary key);insert into auth.users select id from perfiles;alter table publicaciones add column titulo text,add column descripcion text,add column categoria text,add column es_emergencia boolean not null default false;");
  await db.exec("create schema storage;create table storage.buckets(id text primary key,name text,public boolean,file_size_limit bigint,allowed_mime_types text[]);create table storage.objects(bucket_id text,name text,primary key(bucket_id,name));alter table storage.objects enable row level security;");
  for(const name of ['20261107_cupos_participantes.sql','20261108_ciclo_publicaciones.sql','20261107_recomendaciones.sql','20261109_mensajes_privados.sql','20261110_directorio_apoyo.sql','20261111_productos_vecinales.sql','20261112_avisos_barrio.sql'])await db.exec(await sql(`migrations/${name}`));
  await db.exec("insert into revisores_avisos values('00000000-0000-0000-0000-000000000002','Barrio Demo');");
  const cleanup=await sql('limpiar_contenido.sql'),seed=await sql('cargar_demo_cuentas.sql');
  await db.exec(cleanup);
  assert.equal(await count('publicaciones'),0);assert.equal(await count('ofrecimientos'),0);
  assert.equal(await count('auth.users'),5);assert.equal(await count('perfiles'),5);assert.equal(await count('revisores_avisos'),1);assert.equal(await count('servicios_apoyo'),2);
  await db.exec(seed);await db.exec(seed);
  assert.equal(await count('publicaciones'),40);assert.equal(await count('avisos_barrio'),5);
  assert.equal(await count('avisos_publicos'),0);assert.equal(await count('recomendaciones'),0);assert.equal(await count('ofrecimientos'),0);assert.equal(await count('mensajes_privados'),0);
  assert.equal((await db.query("select count(*)::int as n from publicaciones where titulo not like '[DEMO]%' or estado<>'pendiente' or vence_en<=now()")).rows[0].n,0);
  assert.equal((await db.query("select count(*)::int as n from avisos_barrio where estado<>'borrador'")).rows[0].n,0);
  assert.equal((await db.query('select count(*)::int as n from publicaciones p join perfiles v on v.id=p.autor_id where p.barrio<>v.barrio')).rows[0].n,0);
  const groups=(await db.query('select autor_id,count(*)::int as n,count(distinct producto_modalidad)::int as products from publicaciones group by autor_id')).rows;
  assert.ok(groups.every(g=>g.n===8&&g.products===3));
  // Si apareciera una tabla dependiente no conocida, no ampliar el borrado automáticamente.
  await db.exec('create table dependencia_no_prevista(id uuid references publicaciones(id));');
  await assert.rejects(db.exec(cleanup),/foreign key|referenc/i);await db.exec('rollback');
  assert.equal(await count('publicaciones'),40);assert.equal(await count('perfiles'),5);
  await db.exec('drop table dependencia_no_prevista;');await db.exec(cleanup);
  assert.equal(await count('publicaciones'),0);assert.equal(await count('avisos_barrio'),0);assert.equal(await count('perfiles'),5);assert.equal(await count('revisores_avisos'),1);
 }finally{await db.close();}
});
