-- Ejecutar en SQL Editor antes de desplegar esta versión del frontend.
begin;

alter table public.publicaciones add column if not exists cupos smallint not null default 1
  check (cupos between 1 and 100);

-- Conservar las aceptaciones anteriores sin invalidarlas al instalar la mejora.
-- Si hay más de 100, revisar esos datos antes de aplicar esta migración.
update public.publicaciones p set cupos = greatest(p.cupos, (
  select count(*) from public.ofrecimientos o where o.publicacion_id = p.id and o.estado = 'aceptado'
)) where p.tipo <> 'servicio';
grant insert (cupos) on public.publicaciones to authenticated;

alter table public.ofrecimientos enable row level security;
drop policy if exists "Mensajes privados de autor y remitente" on public.ofrecimientos;
create policy "Mensajes privados de autor y remitente" on public.ofrecimientos
  as restrictive for select to authenticated using (
    vecino_id = auth.uid() or exists (select 1 from public.publicaciones p
      where p.id = publicacion_id and p.autor_id = auth.uid())
  );

-- La aceptación solo puede hacerse por RPC: una actualización directa del SDK
-- no debe saltarse la transacción ni la comprobación de cupos.
revoke update on public.ofrecimientos from public, anon, authenticated;
revoke update (id, publicacion_id, vecino_id, mensaje, estado, creado_en)
  on public.ofrecimientos from public, anon, authenticated;

create or replace function public.aceptar_ofrecimiento(respuesta_id uuid)
returns void language plpgsql security definer set search_path = '' as $$
declare
  pedido public.publicaciones%rowtype;
  respuesta public.ofrecimientos%rowtype;
  ocupados bigint;
begin
  if auth.uid() is null then raise exception 'AUTH_REQUIRED'; end if;
  -- Todas las aceptaciones de una publicación toman el mismo bloqueo primero.
  select p.* into pedido from public.publicaciones p
    join public.ofrecimientos o on o.publicacion_id = p.id
    where o.id = respuesta_id and p.autor_id = auth.uid() for update of p;
  if not found then raise exception 'NOT_AUTHORIZED'; end if;
  select * into strict respuesta from public.ofrecimientos where id = respuesta_id for update;
  if respuesta.estado = 'aceptado' then return; end if;
  if pedido.estado = 'resuelta' or respuesta.estado <> 'pendiente' then
    raise exception 'PUBLICATION_CLOSED';
  end if;
  if pedido.tipo <> 'servicio' then
    select count(*) into ocupados from public.ofrecimientos
      where publicacion_id = pedido.id and estado = 'aceptado';
    if ocupados >= pedido.cupos then raise exception 'CAPACITY_FULL'; end if;
  end if;
  update public.ofrecimientos set estado = 'aceptado' where id = respuesta_id;
  update public.publicaciones set estado = 'en_coordinacion' where id = pedido.id;
end;
$$;
revoke all on function public.aceptar_ofrecimiento(uuid) from public, anon;
grant execute on function public.aceptar_ofrecimiento(uuid) to authenticated;

-- También impedir nuevas respuestas a publicaciones cerradas o llenas desde
-- clientes desactualizados. El mensaje y la identidad proceden de la sesión.
create or replace function public.validar_nueva_respuesta()
returns trigger language plpgsql security definer set search_path = '' as $$
declare
  pedido public.publicaciones%rowtype;
begin
  if auth.uid() is null or new.vecino_id is distinct from auth.uid() then raise exception 'NOT_AUTHORIZED'; end if;
  select * into strict pedido from public.publicaciones where id = new.publicacion_id for update;
  if pedido.autor_id = auth.uid() or new.estado is distinct from 'pendiente' then raise exception 'NOT_AUTHORIZED'; end if;
  if pedido.estado = 'resuelta' then raise exception 'PUBLICATION_CLOSED'; end if;
  if pedido.tipo <> 'servicio' and (select count(*) from public.ofrecimientos
    where publicacion_id = pedido.id and estado = 'aceptado') >= pedido.cupos then
    raise exception 'CAPACITY_FULL';
  end if;
  return new;
end;
$$;
revoke all on function public.validar_nueva_respuesta() from public, anon, authenticated;
drop trigger if exists validar_nueva_respuesta on public.ofrecimientos;
create trigger validar_nueva_respuesta before insert on public.ofrecimientos
  for each row execute function public.validar_nueva_respuesta();

-- Si un cliente permite editar una publicación, tampoco puede reducir sus
-- cupos o cambiar su tipo dejando más aceptaciones que plazas.
create or replace function public.validar_cupos_publicacion()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if new.tipo <> 'servicio' and (select count(*) from public.ofrecimientos
    where publicacion_id = new.id and estado = 'aceptado') > new.cupos then
    raise exception 'CAPACITY_BELOW_ACCEPTED';
  end if;
  return new;
end;
$$;
revoke all on function public.validar_cupos_publicacion() from public, anon, authenticated;
drop trigger if exists validar_cupos_publicacion on public.publicaciones;
create trigger validar_cupos_publicacion before update of tipo, cupos on public.publicaciones
  for each row execute function public.validar_cupos_publicacion();

-- Proyección pública mínima: NO devolver mensajes, correos, teléfonos ni las
-- consultas a prestadores de servicios. No cambiar las políticas de lectura
-- privadas de ofrecimientos: solo autor y remitente pueden leer esos mensajes.
create or replace function public.participantes_confirmados()
returns table (publicacion_id uuid, vecino_id uuid, nombre text)
language sql stable security definer set search_path = '' as $$
  select o.publicacion_id, o.vecino_id, v.nombre::text
  from public.ofrecimientos o
  join public.publicaciones p on p.id = o.publicacion_id
  join public.perfiles v on v.id = o.vecino_id
  where auth.uid() is not null and o.estado = 'aceptado' and p.tipo <> 'servicio'
    and (p.autor_id = auth.uid()
      or exists (select 1 from public.perfiles actual where actual.id = auth.uid()
        and lower(trim(actual.barrio)) = lower(trim(p.barrio)))
      or exists (select 1 from public.ofrecimientos propio
        where propio.publicacion_id = p.id and propio.vecino_id = auth.uid()));
$$;
revoke all on function public.participantes_confirmados() from public, anon;
grant execute on function public.participantes_confirmados() to authenticated;
commit;
