begin;
create or replace function public.aceptar_ofrecimiento(respuesta_id uuid)
returns void language plpgsql security invoker set search_path = '' as $$
declare
  pedido public.publicaciones%rowtype;
  respuesta public.ofrecimientos%rowtype;
begin
  select p.* into strict pedido from public.publicaciones p
    join public.ofrecimientos o on o.publicacion_id = p.id
    where o.id = respuesta_id and p.autor_id = auth.uid() for update of p;
  select * into strict respuesta from public.ofrecimientos where id = respuesta_id for update;
  if respuesta.estado = 'aceptado' then return; end if;
  if pedido.estado = 'resuelta' or respuesta.estado <> 'pendiente' then
    raise exception 'La respuesta ya no se puede aceptar';
  end if;
  update public.ofrecimientos set estado = 'aceptado' where id = respuesta_id;
  update public.publicaciones set estado = 'en_coordinacion' where id = pedido.id;
end;
$$;
revoke all on function public.aceptar_ofrecimiento(uuid) from public, anon;
grant execute on function public.aceptar_ofrecimiento(uuid) to authenticated;
commit;
