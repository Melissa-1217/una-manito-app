-- Ejecutar después de las migraciones anteriores. No concede edición desde la app.
begin;
create table if not exists public.servicios_apoyo (
  id uuid primary key default gen_random_uuid(),
  nombre text not null check (length(trim(nombre)) between 3 and 120),
  descripcion text not null check (length(trim(descripcion)) between 5 and 1000),
  ambito text not null check (ambito in ('nacional','barrio')),
  barrio text,
  telefono text check (telefono ~ '^\+?[0-9]{3,15}$'),
  url_contacto text check (url_contacto ~ '^https://[^[:space:]]+$'),
  fuente_url text check (fuente_url ~ '^https://[^[:space:]]+$'),
  revisado_en date,
  revisado boolean not null default false,
  activo boolean not null default true,
  check ((ambito='nacional' and barrio is null) or (ambito='barrio' and length(trim(barrio))>0 and barrio is not null)),
  check (telefono is not null or url_contacto is not null),
  check (not revisado or (fuente_url is not null and revisado_en is not null))
);
alter table public.servicios_apoyo enable row level security;
revoke all on public.servicios_apoyo from anon, authenticated;
grant select on public.servicios_apoyo to authenticated;
drop policy if exists directorio_lectura on public.servicios_apoyo;
create policy directorio_lectura on public.servicios_apoyo for select to authenticated using (
  auth.uid() is not null and activo and revisado and
  (ambito='nacional' or exists(select 1 from public.perfiles p where p.id=auth.uid() and p.barrio=servicios_apoyo.barrio))
);
insert into public.servicios_apoyo(id,nombre,descripcion,ambito,telefono,fuente_url,revisado_en,revisado) values
 ('40000000-0000-0000-0000-000000000001','Policía Nacional','Central policial de emergencia.','nacional','105','https://www.gob.pe/institucion/pnp/contacto-y-numeros-de-emergencias','2026-11-07',true),
 ('40000000-0000-0000-0000-000000000002','Bomberos','Central de emergencia de bomberos.','nacional','116','https://www.gob.pe/institucion/pnp/contacto-y-numeros-de-emergencias','2026-11-07',true)
on conflict(id) do nothing;
commit;
