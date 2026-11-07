-- Aplicar DESPUÉS de 20261107_cupos_participantes.sql y antes de desplegar.
begin;
alter table public.publicaciones
  add column if not exists vence_en timestamptz,
  add column if not exists primera_respuesta_en timestamptz,
  add column if not exists cerrado_en timestamptz,
  add column if not exists motivo_cancelacion text;

-- Sustituir solo los CHECK de una única columna estado, conservando los demás.
do $$
declare regla record;
begin
  for regla in select c.conname from pg_catalog.pg_constraint c
    join pg_catalog.pg_attribute a on a.attrelid = c.conrelid and a.attname = 'estado'
    where c.conrelid = 'public.publicaciones'::regclass and c.contype = 'c'
      and c.conkey = array[a.attnum]::smallint[]
  loop execute format('alter table public.publicaciones drop constraint %I', regla.conname); end loop;
end $$;
alter table public.publicaciones add constraint publicaciones_estado_check
  check (estado in ('pendiente','en_coordinacion','resuelta','vencida','cancelada'));
update public.publicaciones p set
  vence_en = coalesce(p.vence_en, p.creado_en + interval '7 days'),
  primera_respuesta_en = coalesce(p.primera_respuesta_en,
    (select min(o.creado_en) from public.ofrecimientos o where o.publicacion_id = p.id)),
  cerrado_en = case when p.estado in ('resuelta','cancelada') then coalesce(p.cerrado_en, now()) else p.cerrado_en end;
alter table public.publicaciones alter column vence_en set default (now() + interval '7 days');
alter table public.publicaciones alter column vence_en set not null;
create index if not exists publicaciones_pendientes_por_vencer on public.publicaciones (vence_en)
  where estado = 'pendiente' and primera_respuesta_en is null;

-- Las fechas y las transiciones se deciden en el servidor, no por el cliente.
revoke update on public.publicaciones from public, anon, authenticated;
revoke update (estado,vence_en,primera_respuesta_en,cerrado_en,motivo_cancelacion)
  on public.publicaciones from public, anon, authenticated;

create or replace function public.iniciar_ciclo_publicacion()
returns trigger language plpgsql set search_path = '' as $$
begin
  new.estado := 'pendiente';
  new.creado_en := statement_timestamp();
  new.vence_en := statement_timestamp() + interval '7 days';
  new.primera_respuesta_en := null;
  new.cerrado_en := null;
  new.motivo_cancelacion := null;
  return new;
end;
$$;
revoke all on function public.iniciar_ciclo_publicacion() from public, anon, authenticated;
drop trigger if exists iniciar_ciclo_publicacion on public.publicaciones;
create trigger iniciar_ciclo_publicacion before insert on public.publicaciones
  for each row execute function public.iniciar_ciclo_publicacion();

create or replace function public.vencer_publicaciones()
returns void language plpgsql security definer set search_path = '' as $$
begin
  if auth.uid() is null then raise exception 'AUTH_REQUIRED'; end if;
  update public.publicaciones p set estado = 'vencida'
    where p.estado = 'pendiente' and p.primera_respuesta_en is null and p.vence_en <= statement_timestamp();
end;
$$;
revoke all on function public.vencer_publicaciones() from public, anon;
grant execute on function public.vencer_publicaciones() to authenticated;

create or replace function public.gestionar_publicacion(publicacion_id uuid, accion text, motivo text default '')
returns setof public.publicaciones language plpgsql security definer set search_path = '' as $$
declare pedido public.publicaciones%rowtype;
  vencida boolean;
begin
  if auth.uid() is null then raise exception 'AUTH_REQUIRED'; end if;
  select * into pedido from public.publicaciones p
    where p.id = publicacion_id and p.autor_id = auth.uid() for update;
  if not found then raise exception 'NOT_AUTHORIZED'; end if;
  vencida := pedido.estado = 'vencida' or (pedido.estado = 'pendiente'
    and pedido.primera_respuesta_en is null and pedido.vence_en <= statement_timestamp());
  if accion = 'renovar' then
    if not vencida or pedido.primera_respuesta_en is not null
      or exists(select 1 from public.ofrecimientos o where o.publicacion_id = pedido.id) then
      raise exception 'INVALID_TRANSITION';
    end if;
    update public.publicaciones p set estado = 'pendiente', vence_en = statement_timestamp() + interval '7 days',
      cerrado_en = null, motivo_cancelacion = null where p.id = pedido.id returning p.* into pedido;
  elsif accion = 'resolver' then
    if vencida or pedido.estado not in ('pendiente','en_coordinacion') then raise exception 'INVALID_TRANSITION'; end if;
    update public.publicaciones p set estado = 'resuelta', cerrado_en = statement_timestamp()
      where p.id = pedido.id returning p.* into pedido;
  elsif accion = 'cancelar' then
    if pedido.estado in ('resuelta','cancelada') then raise exception 'INVALID_TRANSITION'; end if;
    if motivo is null or char_length(trim(motivo)) not between 5 and 300 then raise exception 'INVALID_REASON'; end if;
    update public.publicaciones p set estado = 'cancelada', cerrado_en = statement_timestamp(), motivo_cancelacion = trim(motivo)
      where p.id = pedido.id returning p.* into pedido;
  else raise exception 'INVALID_ACTION';
  end if;
  return next pedido;
end;
$$;
revoke all on function public.gestionar_publicacion(uuid,text,text) from public, anon;
grant execute on function public.gestionar_publicacion(uuid,text,text) to authenticated;

-- El bloqueo comparte el mismo orden que aceptar, renovar, cerrar y cancelar.
create or replace function public.validar_nueva_respuesta()
returns trigger language plpgsql security definer set search_path = '' as $$
declare pedido public.publicaciones%rowtype;
begin
  if auth.uid() is null or new.vecino_id is distinct from auth.uid() then raise exception 'NOT_AUTHORIZED'; end if;
  select * into strict pedido from public.publicaciones where id = new.publicacion_id for update;
  if pedido.autor_id = auth.uid() or new.estado is distinct from 'pendiente' then raise exception 'NOT_AUTHORIZED'; end if;
  if pedido.estado not in ('pendiente','en_coordinacion') or (pedido.estado = 'pendiente'
    and pedido.primera_respuesta_en is null and pedido.vence_en <= statement_timestamp()) then
    raise exception 'PUBLICATION_CLOSED';
  end if;
  if pedido.tipo <> 'servicio' and (select count(*) from public.ofrecimientos
    where publicacion_id = pedido.id and estado = 'aceptado') >= pedido.cupos then raise exception 'CAPACITY_FULL'; end if;
  update public.publicaciones set primera_respuesta_en = coalesce(primera_respuesta_en, statement_timestamp()) where id = pedido.id;
  return new;
end;
$$;
revoke all on function public.validar_nueva_respuesta() from public, anon, authenticated;

create or replace function public.aceptar_ofrecimiento(respuesta_id uuid)
returns void language plpgsql security definer set search_path = '' as $$
declare pedido public.publicaciones%rowtype;
  respuesta public.ofrecimientos%rowtype;
begin
  if auth.uid() is null then raise exception 'AUTH_REQUIRED'; end if;
  select p.* into pedido from public.publicaciones p join public.ofrecimientos o on o.publicacion_id = p.id
    where o.id = respuesta_id and p.autor_id = auth.uid() for update of p;
  if not found then raise exception 'NOT_AUTHORIZED'; end if;
  select * into strict respuesta from public.ofrecimientos where id = respuesta_id for update;
  if respuesta.estado = 'aceptado' then return; end if;
  if pedido.estado not in ('pendiente','en_coordinacion') or respuesta.estado <> 'pendiente' then raise exception 'PUBLICATION_CLOSED'; end if;
  if pedido.tipo <> 'servicio' and (select count(*) from public.ofrecimientos
    where publicacion_id = pedido.id and estado = 'aceptado') >= pedido.cupos then raise exception 'CAPACITY_FULL'; end if;
  update public.ofrecimientos set estado = 'aceptado' where id = respuesta_id;
  update public.publicaciones set estado = 'en_coordinacion' where id = pedido.id;
end;
$$;
revoke all on function public.aceptar_ofrecimiento(uuid) from public, anon;
grant execute on function public.aceptar_ofrecimiento(uuid) to authenticated;
commit;
