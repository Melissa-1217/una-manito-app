-- Fixture aislado: no ejecutar en el proyecto de producción.
create role anon;
create role authenticated;
create schema auth;
create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid $$;
grant usage on schema public,auth to anon,authenticated;
grant execute on function auth.uid() to anon,authenticated;
create table public.perfiles(id uuid primary key,nombre text,barrio text);
create table public.publicaciones(id uuid primary key,autor_id uuid references perfiles(id),tipo text not null,estado text not null default 'pendiente',barrio text,creado_en timestamptz not null default now());
create table public.ofrecimientos(id uuid primary key,publicacion_id uuid references publicaciones(id),vecino_id uuid references perfiles(id),mensaje text,estado text not null default 'pendiente',creado_en timestamptz default now(),unique(publicacion_id,vecino_id));
alter table publicaciones enable row level security;
create policy publicaciones_read on publicaciones for select to authenticated using(true);
create policy publicaciones_update on publicaciones for update to authenticated using(autor_id=auth.uid());
alter table ofrecimientos enable row level security;
create policy respuestas_read on ofrecimientos for select to authenticated using(true);
create policy respuestas_insert on ofrecimientos for insert to authenticated with check(vecino_id=auth.uid());
create policy respuestas_update on ofrecimientos for update to authenticated using(true);
grant select on perfiles,publicaciones,ofrecimientos to authenticated;
grant insert(id,publicacion_id,vecino_id,mensaje) on ofrecimientos to authenticated;
grant update(estado) on publicaciones,ofrecimientos to authenticated;
insert into perfiles values
  ('00000000-0000-0000-0000-000000000001','Ana','Barrio Demo'),
  ('00000000-0000-0000-0000-000000000002','Luis','Barrio Demo'),
  ('00000000-0000-0000-0000-000000000003','María','Barrio Demo'),
  ('00000000-0000-0000-0000-000000000004','Pedro','Barrio Demo'),
  ('00000000-0000-0000-0000-000000000005','Otro','Otra zona');
insert into publicaciones(id,autor_id,tipo,barrio) values
  ('10000000-0000-0000-0000-000000000001','00000000-0000-0000-0000-000000000001','solicitud','Barrio Demo'),
  ('10000000-0000-0000-0000-000000000002','00000000-0000-0000-0000-000000000003','servicio','Barrio Demo');
insert into ofrecimientos(id,publicacion_id,vecino_id,mensaje) values
  ('20000000-0000-0000-0000-000000000001','10000000-0000-0000-0000-000000000001','00000000-0000-0000-0000-000000000002','Puedo ayudar.'),
  ('20000000-0000-0000-0000-000000000002','10000000-0000-0000-0000-000000000001','00000000-0000-0000-0000-000000000004','Otra ayuda.'),
  ('20000000-0000-0000-0000-000000000003','10000000-0000-0000-0000-000000000002','00000000-0000-0000-0000-000000000002','Consulta al servicio.');
