begin;
create table public.recomendaciones (
  id uuid primary key default gen_random_uuid(),
  ofrecimiento_id uuid not null references public.ofrecimientos(id),
  autor_id uuid not null references public.perfiles(id),
  vecino_id uuid not null references public.perfiles(id),
  comentario text not null check (char_length(trim(comentario)) between 5 and 500),
  creado_en timestamptz not null default now(),
  unique (ofrecimiento_id, autor_id),
  check (autor_id <> vecino_id)
);
create index recomendaciones_vecino_idx on public.recomendaciones(vecino_id);
alter table public.recomendaciones enable row level security;
revoke all on public.recomendaciones from anon, authenticated;
grant select on public.recomendaciones to authenticated;
grant insert (ofrecimiento_id,autor_id,vecino_id,comentario) on public.recomendaciones to authenticated;
create policy "Consultar recomendaciones vecinales" on public.recomendaciones
  for select to authenticated using (true);
create policy "Recomendar una ayuda recibida y completada" on public.recomendaciones
  for insert to authenticated with check (
    autor_id = (select auth.uid()) and exists (
      select 1 from public.ofrecimientos o
      join public.publicaciones p on p.id = o.publicacion_id
      where o.id = ofrecimiento_id and o.estado = 'aceptado' and p.estado = 'resuelta'
      and (
        (p.tipo = 'solicitud' and p.autor_id = (select auth.uid()) and o.vecino_id = recomendaciones.vecino_id)
        or
        (p.tipo in ('servicio','ofrecimiento') and o.vecino_id = (select auth.uid()) and p.autor_id = recomendaciones.vecino_id)
      )
    )
  );
commit;
