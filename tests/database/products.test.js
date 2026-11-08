import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { PGlite } from '@electric-sql/pglite';

test('SQL productos: modalidad persistente, solo ofrecimientos y mismos controles de identidad',async()=>{
  const db=new PGlite();
  try {
    await db.exec(await readFile(new URL('../fixtures/conversation-schema.sql',import.meta.url),'utf8'));
    for(const name of ['20261107_cupos_participantes.sql','20261108_ciclo_publicaciones.sql','20261109_mensajes_privados.sql']) await db.exec(await readFile(new URL(`../../supabase/migrations/${name}`,import.meta.url),'utf8'));
    const migration=await readFile(new URL('../../supabase/migrations/20261111_productos_vecinales.sql',import.meta.url),'utf8');
    await db.exec(migration);await db.exec(migration);
    await db.exec("grant insert(id,autor_id,tipo,barrio) on publicaciones to authenticated; create policy productos_fixture_insert on publicaciones for insert to authenticated with check(autor_id=auth.uid());");
    await db.query("select set_config('request.jwt.claim.sub',$1,false)",['00000000-0000-0000-0000-000000000001']);
    await db.exec('set role authenticated');
    for(const [i,mode] of ['prestamo','donacion','intercambio'].entries()) {
      const id=`50000000-0000-0000-0000-00000000000${i+1}`;
      await db.query("insert into publicaciones(id,autor_id,tipo,barrio,producto_modalidad) values($1,auth.uid(),'ofrecimiento','Barrio Demo',$2)",[id,mode]);
      assert.equal((await db.query('select producto_modalidad from publicaciones where id=$1',[id])).rows[0].producto_modalidad,mode);
    }
    await assert.rejects(db.exec("insert into publicaciones(id,autor_id,tipo,producto_modalidad) values(gen_random_uuid(),auth.uid(),'servicio','prestamo')"),/check constraint/);
    await assert.rejects(db.exec("insert into publicaciones(id,autor_id,tipo,producto_modalidad) values(gen_random_uuid(),auth.uid(),'ofrecimiento','venta')"),/check constraint/);
    await assert.rejects(db.exec("insert into publicaciones(id,autor_id,tipo,producto_modalidad) values(gen_random_uuid(),'00000000-0000-0000-0000-000000000002','ofrecimiento','donacion')"),/row-level security/);
    assert.equal((await db.query("select count(*)::int as total from publicaciones where producto_modalidad is null")).rows[0].total,2);
    await db.query("select set_config('request.jwt.claim.sub',$1,false)",['00000000-0000-0000-0000-000000000002']);
    await db.exec("insert into ofrecimientos(id,publicacion_id,vecino_id,mensaje) values('60000000-0000-0000-0000-000000000001','50000000-0000-0000-0000-000000000001',auth.uid(),'Quisiera pedir este producto prestado.');");
    await db.query("select set_config('request.jwt.claim.sub',$1,false)",['00000000-0000-0000-0000-000000000001']);
    await db.exec("select public.aceptar_ofrecimiento('60000000-0000-0000-0000-000000000001');");
    assert.equal((await db.query("select estado from publicaciones where id='50000000-0000-0000-0000-000000000001'")).rows[0].estado,'en_coordinacion');
    await db.exec("select public.gestionar_publicacion('50000000-0000-0000-0000-000000000001','resolver','');");
    const closed=(await db.query("select estado,producto_modalidad from publicaciones where id='50000000-0000-0000-0000-000000000001'")).rows[0];
    assert.equal(closed.estado,'resuelta');assert.equal(closed.producto_modalidad,'prestamo');
    await db.exec('reset role;set role anon');
    await assert.rejects(db.exec('select * from publicaciones'),/permission denied/);
  } finally { await db.close(); }
});
