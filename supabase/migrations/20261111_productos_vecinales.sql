-- Productos solidarios: conserva los tipos y flujos de ofrecimientos existentes.
begin;
alter table public.publicaciones add column if not exists producto_modalidad text;
alter table public.publicaciones drop constraint if exists publicaciones_producto_modalidad_check;
alter table public.publicaciones add constraint publicaciones_producto_modalidad_check
  check (producto_modalidad is null or (tipo='ofrecimiento' and producto_modalidad in ('prestamo','donacion','intercambio')));
grant insert(producto_modalidad) on public.publicaciones to authenticated;
comment on column public.publicaciones.producto_modalidad is 'Objeto compartido como préstamo, donación o intercambio. NULL para publicaciones anteriores o ayuda sin producto.';
notify pgrst, 'reload schema';
commit;
