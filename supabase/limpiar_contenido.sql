-- EJECUCIÓN MANUAL, SOLO EN SQL EDITOR COMO ADMINISTRADOR.
-- BORRA TODO el contenido vecinal, incluidos mensajes privados y reputación.
-- Conserva auth.users, perfiles, revisores, configuración y directorio de apoyo.
-- Antes de ejecutar, guarda una copia de lo que necesites conservar.
-- Las fotos de Storage se eliminan por separado, desde Storage > avisos-fotos.
-- No ejecutar esta limpieza después de que el equipo empiece a publicar datos reales.
begin;
set local lock_timeout = '10s';

create temporary table limpieza_resumen(tabla text primary key,registros_antes bigint,registros_despues bigint) on commit drop;
do $$
declare v_tabla text; v_lista text; v_cantidad bigint;
begin
 -- Lista explícita: no incluye cuentas, perfiles ni tablas de autorización.
 foreach v_tabla in array array[
  'mensajes_privados','recomendaciones','ofrecimientos','publicaciones',
  'historial_avisos','usos_ia_avisos','avisos_publicos','avisos_barrio'
 ] loop
  if to_regclass(format('public.%I',v_tabla)) is not null then
   execute format('select count(*) from public.%I',v_tabla) into v_cantidad;
   insert into limpieza_resumen values(v_tabla,v_cantidad,null);
  end if;
 end loop;
 select string_agg(format('public.%I',tabla),', ' order by tabla) into v_lista from limpieza_resumen;
 if v_lista is null then raise exception 'No se encontraron las tablas de contenido. Revisa el proyecto seleccionado.'; end if;
 -- SIN CASCADE: una dependencia no prevista cancela la operación completa.
 execute 'truncate table '||v_lista;
 for v_tabla in select tabla from limpieza_resumen loop
  execute format('select count(*) from public.%I',v_tabla) into v_cantidad;
  update limpieza_resumen set registros_despues=v_cantidad where tabla=v_tabla;
 end loop;
end $$;
select * from limpieza_resumen order by tabla;
commit;
