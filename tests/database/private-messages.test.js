import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { PGlite } from '@electric-sql/pglite';

test('SQL real: conversación privada, identidad, reintentos, cierre e historial', async () => {
  const db = new PGlite();
  const user = n => `00000000-0000-0000-0000-${String(n).padStart(12,'0')}`;
  const response = n => `20000000-0000-0000-0000-${String(n).padStart(12,'0')}`;
  const message = n => `30000000-0000-0000-0000-${String(n).padStart(12,'0')}`;
  async function as(n) {
    await db.exec('reset role');
    await db.query("select set_config('request.jwt.claim.sub',$1,false)", [n ? user(n) : '']);
    await db.exec('set role authenticated');
  }
  const send = (offer, text, id) => db.query('select * from public.enviar_mensaje_privado($1,$2,$3)', [response(offer), text, message(id)]);
  const history = offer => db.query('select * from public.mensajes_privados where ofrecimiento_id=$1 order by orden', [response(offer)]);
  try {
    await db.exec(await readFile(new URL('../fixtures/conversation-schema.sql', import.meta.url), 'utf8'));
    for (const name of ['20261107_cupos_participantes.sql','20261108_ciclo_publicaciones.sql','20261109_mensajes_privados.sql','20261109_mensajes_privados.sql']) {
      await db.exec(await readFile(new URL(`../../supabase/migrations/${name}`, import.meta.url), 'utf8'));
    }
    await db.exec('set role anon');
    await assert.rejects(history(1), /permission denied/);
    await assert.rejects(send(1, 'Hola', 1), /permission denied/);
    await as(null);
    await assert.rejects(send(1, 'Hola', 1), /AUTH_REQUIRED/);
    await as(2);
    const first = (await send(1, 'Puedo llevarla a las cinco.', 1)).rows[0];
    assert.equal(first.autor_id, user(2));
    assert.equal((await send(1, 'Puedo llevarla a las cinco.', 1)).rows[0].id, first.id);
    await assert.rejects(send(1, 'Otro texto con la misma clave.', 1), /MESSAGE_CONFLICT/);
    await assert.rejects(send(1, ' \n\t ', 9), /INVALID_MESSAGE/);
    await assert.rejects(send(1, 'a'.repeat(1001), 9), /INVALID_MESSAGE/);
    await as(1);
    await send(1, 'Gracias. Te espero a las cinco.', 2);
    assert.equal((await history(1)).rows.length, 2);
    await send(2, 'Mensaje solo para Pedro.', 3);
    await as(2);
    assert.equal((await history(1)).rows.length, 2);
    assert.equal((await history(2)).rows.length, 0);
    await assert.rejects(send(2, 'No soy participante.', 4), /NOT_AUTHORIZED/);
    await assert.rejects(db.query("insert into mensajes_privados(ofrecimiento_id,autor_id,contenido) values($1,$2,'Suplantación')", [response(1),user(1)]), /permission denied/);
    await assert.rejects(db.query("update mensajes_privados set contenido='Editado'"), /permission denied/);
    await assert.rejects(db.query('delete from mensajes_privados'), /permission denied/);
    await as(4);
    assert.equal((await history(1)).rows.length, 0);
    assert.equal((await history(2)).rows.length, 1);
    await assert.rejects(send(1, 'Otro participante del mismo pedido.', 4), /NOT_AUTHORIZED/);
    await as(5);
    assert.equal((await db.query('select * from mensajes_privados')).rows.length, 0);
    await assert.rejects(send(1, 'Soy un tercero.', 4), /NOT_AUTHORIZED/);
    await as(1);
    await db.query('select aceptar_ofrecimiento($1)', [response(1)]);
    await db.query("select * from gestionar_publicacion('10000000-0000-0000-0000-000000000001','resolver')");
    await as(2);
    await assert.rejects(send(1, 'Un mensaje nuevo después del cierre.', 5), /CONVERSATION_CLOSED/);
    assert.equal((await send(1, 'Puedo llevarla a las cinco.', 1)).rows[0].id, first.id);
    assert.equal((await history(1)).rows.length, 2);
    await send(3, 'Consulta pendiente sobre el servicio.', 6);
    await db.exec("reset role; update ofrecimientos set estado='rechazado' where id='20000000-0000-0000-0000-000000000003'");
    await as(2);
    await assert.rejects(send(3, 'Nueva consulta rechazada.', 7), /CONVERSATION_CLOSED/);
    assert.equal((await history(3)).rows.length, 1);
  } finally { await db.close(); }
});
