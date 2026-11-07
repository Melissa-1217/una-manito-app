begin;
-- Las recomendaciones anteriores conservan su comentario y no reciben una
-- puntuación inventada. Las nuevas valoraciones deben incluir estrellas.
alter table public.recomendaciones add column estrellas smallint check (estrellas between 1 and 5);
grant insert (estrellas) on public.recomendaciones to authenticated;
alter policy "Recomendar una ayuda recibida y completada" on public.recomendaciones
  with check (
    estrellas is not null and estrellas between 1 and 5
    and autor_id = (select auth.uid()) and exists (
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
