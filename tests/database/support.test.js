import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { PGlite } from '@electric-sql/pglite';

test('SQL directorio: solo contactos revisados, barrio correcto y sin edición por vecinos', async () => {
  const db = new PGlite();
  try {
    await db.exec(await readFile(new URL('../fixtures/conversation-schema.sql', import.meta.url), 'utf8'));
    const sql = await readFile(new URL('../../supabase/migrations/20261110_directorio_apoyo.sql', import.meta.url), 'utf8');
    await db.exec(sql);
    await db.exec(sql);
    await db.exec(`insert into servicios_apoyo(nombre,descripcion,ambito,barrio,telefono,fuente_url,revisado_en,revisado,activo) values
      ('Grupo de prueba','Registro ficticio exclusivo del test.','barrio','Barrio Demo','999','https://example.org',current_date,true,true),
      ('Otro barrio','Registro ficticio exclusivo del test.','barrio','Otra zona','999','https://example.org',current_date,true,true),
      ('Sin revisar','Registro ficticio exclusivo del test.','barrio','Barrio Demo','999',null,null,false,true),
      ('Inactivo','Registro ficticio exclusivo del test.','barrio','Barrio Demo','999','https://example.org',current_date,true,false);`);
    await db.exec('set role anon');
    await assert.rejects(db.query('select * from servicios_apoyo'), /permission denied/);
    await db.exec('reset role');
    await db.query("select set_config('request.jwt.claim.sub',$1,false)", ['00000000-0000-0000-0000-000000000001']);
    await db.exec('set role authenticated');
    const { rows } = await db.query('select nombre from servicios_apoyo order by nombre');
    assert.deepEqual(rows.map(row => row.nombre), ['Bomberos','Grupo de prueba','Policía Nacional']);
    await assert.rejects(db.exec("insert into servicios_apoyo(nombre) values('Falso')"), /permission denied/);
    await assert.rejects(db.exec('update servicios_apoyo set revisado=true'), /permission denied/);
    await assert.rejects(db.exec('delete from servicios_apoyo'), /permission denied/);
    await db.exec('reset role');
    await db.query("select set_config('request.jwt.claim.sub','',false)");
    await db.exec('set role authenticated');
    assert.equal((await db.query('select * from servicios_apoyo')).rows.length, 0);
  } finally { await db.close(); }
});
