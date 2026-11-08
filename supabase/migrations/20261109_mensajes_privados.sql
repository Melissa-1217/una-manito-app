-- Aplicar después de cupos y ciclo de publicaciones, antes del frontend nuevo.
begin;
create table if not exists public.mensajes_privados (
  id uuid primary key default gen_random_uuid(),
  orden bigint generated always as identity unique,
  ofrecimiento_id uuid not null references public.ofrecimientos(id),
  autor_id uuid not null references public.perfiles(id),
  contenido text not null check (char_length(btrim(contenido, E' \n\r\t')) between 1 and 1000),
  creado_en timestamptz not null default statement_timestamp()
);
create index if not exists mensajes_privados_conversacion_idx on public.mensajes_privados (ofrecimiento_id, orden desc);
alter table public.mensajes_privados enable row level security;
revoke all on public.mensajes_privados from public, anon, authenticated;
grant select on public.mensajes_privados to authenticated;
drop policy if exists "Solo los dos participantes leen la conversacion" on public.mensajes_privados;
create policy "Solo los dos participantes leen la conversacion" on public.mensajes_privados
  for select to authenticated using (
    exists (select 1 from public.ofrecimientos o join public.publicaciones p on p.id = o.publicacion_id
      where o.id = ofrecimiento_id and (o.vecino_id = auth.uid() or p.autor_id = auth.uid()))
  );

-- Escribir únicamente por RPC: comprueba miembros y bloquea en el mismo orden
-- que aceptar/cerrar, y hace idempotente un reintento con el mismo UUID.
create or replace function public.enviar_mensaje_privado(p_ofrecimiento_id uuid, p_contenido text, p_mensaje_id uuid)
returns setof public.mensajes_privados language plpgsql security definer set search_path = '' as $$
declare
  pedido public.publicaciones%rowtype;
  respuesta public.ofrecimientos%rowtype;
  mensaje public.mensajes_privados%rowtype;
  texto text := btrim(p_contenido, E' \n\r\t');
begin
  if auth.uid() is null then raise exception 'AUTH_REQUIRED'; end if;
  if p_mensaje_id is null or texto is null or char_length(texto) not between 1 and 1000 then raise exception 'INVALID_MESSAGE'; end if;
  select p.* into pedido from public.publicaciones p join public.ofrecimientos o on o.publicacion_id = p.id
    where o.id = p_ofrecimiento_id and (p.autor_id = auth.uid() or o.vecino_id = auth.uid()) for update of p;
  if not found then raise exception 'NOT_AUTHORIZED'; end if;
  select * into strict respuesta from public.ofrecimientos where id = p_ofrecimiento_id for update;
  select * into mensaje from public.mensajes_privados where id = p_mensaje_id;
  if found then
    if mensaje.ofrecimiento_id <> p_ofrecimiento_id or mensaje.autor_id <> auth.uid() or mensaje.contenido <> texto then raise exception 'MESSAGE_CONFLICT'; end if;
    return next mensaje;
    return;
  end if;
  if pedido.estado not in ('pendiente','en_coordinacion') or respuesta.estado not in ('pendiente','aceptado')
    or (pedido.estado = 'pendiente' and pedido.primera_respuesta_en is null and pedido.vence_en <= statement_timestamp()) then
    raise exception 'CONVERSATION_CLOSED';
  end if;
  insert into public.mensajes_privados (id,ofrecimiento_id,autor_id,contenido)
    values (p_mensaje_id,p_ofrecimiento_id,auth.uid(),texto) returning * into mensaje;
  return next mensaje;
end;
$$;
revoke all on function public.enviar_mensaje_privado(uuid,text,uuid) from public, anon;
grant execute on function public.enviar_mensaje_privado(uuid,text,uuid) to authenticated;
commit;
