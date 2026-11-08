-- EJECUCIÓN MANUAL COMO ADMINISTRADOR. No es una migración automática.
-- Publicaciones FICTICIAS de prueba, identificadas con [DEMO], bajo cuentas existentes.
-- No crea usuarios, no cambia perfiles y no genera calificaciones ni conversaciones falsas.
-- Requiere las migraciones de productos y avisos. Puede repetirse sin duplicar ejemplos.
begin;

-- Evitar insertar en un proyecto que todavía no tenga la estructura esperada.
do $$
begin
 if to_regclass('public.avisos_barrio') is null or not exists(
  select 1 from information_schema.columns where table_schema='public' and table_name='publicaciones' and column_name='producto_modalidad'
 ) then raise exception 'Primero aplica las migraciones de productos y avisos del barrio.'; end if;
 if not exists(select 1 from public.perfiles p join auth.users u on u.id=p.id where nullif(btrim(p.barrio),'') is not null) then
  raise exception 'No hay cuentas con perfil y barrio. Completa el registro desde la app.';
 end if;
end $$;

with ejemplos(clave,tipo,titulo,descripcion,categoria,cupos,emergencia,modalidad) as (
 values
 ('pedido','solicitud','[DEMO] Necesito una escalera prestada',
  'Ejemplo de demostración. Necesito una escalera para alcanzar una repisa. Sirve para probar responder, aceptar ayuda y marcar como resuelta. No es una solicitud real.','Herramientas',1,false,null::text),
 ('ayuda','ofrecimiento','[DEMO] Apoyo con compras del barrio',
  'Ejemplo de demostración. Ofrezco apoyo para recoger compras pequeñas del barrio. Prueba enviar una consulta y coordinar por privado. No representa disponibilidad real.','Compras y traslados',2,false,null),
 ('servicio','servicio','[DEMO] Servicio de gasfitería',
  'Ejemplo de demostración de un anuncio de gasfitería: revisión de caños y fugas. No acredita que el titular de esta cuenta sea gasfitero. No contratar: usar solo para probar el directorio y las consultas.','Gasfitería',1,false,null),
 ('prestamo','ofrecimiento','[DEMO] Préstamo de taladro',
  'Ejemplo de demostración. Taladro disponible como préstamo para probar la solicitud, aceptación y coordinación de devolución. No se ofrece un objeto real.','Herramientas',1,false,'prestamo'),
 ('donacion','ofrecimiento','[DEMO] Donación de libros',
  'Ejemplo de demostración. Un lote de libros para probar las donaciones entre vecinos. No hay una donación real disponible. Coordina únicamente como ejercicio.','Otros',1,false,'donacion'),
 ('intercambio','ofrecimiento','[DEMO] Intercambio de materiales',
  'Ejemplo de demostración. Intercambio de macetas por materiales de jardinería para probar la modalidad de trueque. No representa una oferta real.','Otros',1,false,'intercambio'),
 ('apoyo','solicitud','[DEMO] Ejercicio: pedido de agua',
  'SIMULACIÓN, NO ES UNA EMERGENCIA REAL. Pedido de agua para practicar la coordinación de apoyo y la gestión de participantes. No movilizar recursos ni llamar a servicios de emergencia por este ejemplo.','Agua y alimentos',2,true,null),
 ('recurso','ofrecimiento','[DEMO] Ejercicio: recurso de apoyo',
  'SIMULACIÓN, NO ES UNA EMERGENCIA REAL. Recurso de ejemplo para practicar cómo compartir agua durante un ejercicio. No representa existencias, disponibilidad ni una entrega real.','Agua y alimentos',2,true,null)
), cuentas as (
 select p.id,p.barrio from public.perfiles p join auth.users u on u.id=p.id
 where nullif(btrim(p.barrio),'') is not null
)
insert into public.publicaciones(id,autor_id,tipo,titulo,descripcion,categoria,barrio,cupos,es_emergencia,producto_modalidad)
select md5('una-manito-demo-v1|'||c.id::text||'|'||e.clave)::uuid,
 c.id,e.tipo,e.titulo,e.descripcion,e.categoria,c.barrio,e.cupos,e.emergencia,e.modalidad
from cuentas c cross join ejemplos e
on conflict(id) do nothing;

-- Un reporte BORRADOR privado por cuenta para explorar «Mis reportes».
-- No se envía a revisión, no se aprueba y no genera avisos ni notificaciones.
insert into public.avisos_barrio(id,autor_id,barrio,titulo,descripcion,zona,categoria,observado_en,estado)
select md5('una-manito-demo-v1|'||p.id::text||'|reporte')::uuid,p.id,p.barrio,
 '[DEMO] Borrador de ejercicio vecinal',
 'SIMULACIÓN, NO ES UN INCIDENTE REAL. Borrador privado para explorar el recorrido de reportes. No enviarlo a revisión como si fuera una emergencia real.',
 'Zona ficticia de demostración','otro',now(),'borrador'
from public.perfiles p join auth.users u on u.id=p.id where nullif(btrim(p.barrio),'') is not null
on conflict(id) do nothing;

-- Resultado: se esperan 8 publicaciones de ejemplo y 1 borrador privado por perfil.
select p.id,p.nombre,p.barrio,
 (select count(*) from public.publicaciones pub where pub.autor_id=p.id and pub.id in (
  select md5('una-manito-demo-v1|'||p.id::text||'|'||clave)::uuid
  from unnest(array['pedido','ayuda','servicio','prestamo','donacion','intercambio','apoyo','recurso']) clave
 )) as publicaciones_demo,
 (select count(*) from public.avisos_barrio a where a.id=md5('una-manito-demo-v1|'||p.id::text||'|reporte')::uuid) as borradores_demo
from public.perfiles p join auth.users u on u.id=p.id order by p.nombre,p.id;
commit;
