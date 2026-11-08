-- Reportes privados -> revisión humana -> aviso público del mismo barrio.
begin;
create table if not exists public.revisores_avisos (
 vecino_id uuid references public.perfiles(id) on delete cascade,
 barrio text not null, primary key(vecino_id,barrio)
);
create or replace function public.soy_revisor_avisos(p_barrio text default null)
returns boolean language sql stable security definer set search_path=public,pg_temp as $$
 select exists(select 1 from revisores_avisos r join perfiles p on p.id=r.vecino_id
 where r.vecino_id=auth.uid() and r.barrio=p.barrio and (p_barrio is null or r.barrio=p_barrio));
$$;
create table if not exists public.avisos_barrio (
 id uuid primary key, autor_id uuid not null references public.perfiles(id), barrio text not null,
 titulo text not null check(char_length(titulo) between 5 and 120),
 descripcion text not null check(char_length(descripcion) between 10 and 2000),
 zona text not null check(char_length(zona) between 3 and 160),
 categoria text not null check(categoria in ('incendio','inundacion','corte_servicios','riesgo_vial','otro')),
 observado_en timestamptz not null, foto_path text,
 estado text not null default 'borrador' check(estado in ('borrador','pendiente','publicado','rechazado','finalizado','retirado')),
 motivo text, creado_en timestamptz not null default now(), actualizado_en timestamptz not null default now()
);
create table if not exists public.avisos_publicos (
 id uuid primary key references public.avisos_barrio(id), barrio text not null,
 titulo text not null, descripcion text not null, zona text not null, categoria text not null,
 prioridad text not null check(prioridad in ('informativo','importante','urgente')),
 observado_en timestamptz not null, foto_path text,
 estado text not null check(estado in ('publicado','finalizado','retirado')),
 version bigint not null default 1, publicado_en timestamptz not null default now(), actualizado_en timestamptz not null default now()
);
create table if not exists public.historial_avisos (
 id bigint generated always as identity primary key, aviso_id uuid references public.avisos_barrio(id),
 actor_id uuid not null, accion text not null, motivo text, creado_en timestamptz not null default now()
);
create table if not exists public.usos_ia_avisos (
 id bigint generated always as identity primary key, vecino_id uuid not null,
 aviso_id uuid not null references public.avisos_barrio(id), creado_en timestamptz not null default now()
);
create index if not exists avisos_barrio_cola on public.avisos_barrio(barrio,estado,creado_en desc);
create index if not exists avisos_barrio_autor on public.avisos_barrio(autor_id,creado_en desc);
create index if not exists avisos_publicos_barrio on public.avisos_publicos(barrio,actualizado_en desc);
create index if not exists avisos_ia_cuota on public.usos_ia_avisos(vecino_id,creado_en);
alter table public.revisores_avisos enable row level security;
alter table public.avisos_barrio enable row level security;
alter table public.avisos_publicos enable row level security;
alter table public.historial_avisos enable row level security;
alter table public.usos_ia_avisos enable row level security;
drop policy if exists avisos_privados_read on public.avisos_barrio;
create policy avisos_privados_read on public.avisos_barrio for select to authenticated
 using(autor_id=auth.uid() or public.soy_revisor_avisos(barrio));
drop policy if exists avisos_publicos_read on public.avisos_publicos;
create policy avisos_publicos_read on public.avisos_publicos for select to authenticated
 using(barrio=(select p.barrio from public.perfiles p where p.id=auth.uid()));
drop policy if exists avisos_historial_read on public.historial_avisos;
create policy avisos_historial_read on public.historial_avisos for select to authenticated
 using(exists(select 1 from public.avisos_barrio a where a.id=aviso_id));
revoke all on public.revisores_avisos,public.avisos_barrio,public.avisos_publicos,public.historial_avisos,public.usos_ia_avisos from anon,authenticated;
grant select on public.avisos_barrio,public.avisos_publicos,public.historial_avisos to authenticated;

create or replace function public.guardar_borrador_aviso(p_id uuid,p_titulo text,p_descripcion text,p_zona text,p_categoria text,p_observado_en timestamptz)
returns uuid language plpgsql security definer set search_path=public,pg_temp as $$
declare v_barrio text; a avisos_barrio;
begin
 if auth.uid() is null then raise exception 'AUTH_REQUIRED'; end if;
 select barrio into v_barrio from perfiles where id=auth.uid();
 if v_barrio is null or btrim(v_barrio)='' then raise exception 'BARRIO_REQUIRED'; end if;
 perform pg_advisory_xact_lock(hashtextextended(auth.uid()::text,12));
 select * into a from avisos_barrio where id=p_id;
 if found then
  if a.autor_id=auth.uid() and a.barrio=v_barrio and a.titulo=btrim(p_titulo) and a.descripcion=btrim(p_descripcion)
   and a.zona=btrim(p_zona) and a.categoria=p_categoria and a.observado_en=p_observado_en and a.estado in ('borrador','pendiente') then return a.id; end if;
  raise exception 'REPORT_CONFLICT';
 end if;
 if (select count(*) from avisos_barrio where autor_id=auth.uid() and creado_en>now()-interval '1 hour')>=5 then raise exception 'REPORT_LIMIT'; end if;
 if p_observado_en is null or p_observado_en>now()+interval '5 minutes' or p_observado_en<now()-interval '7 days' then raise exception 'INVALID_DATE'; end if;
 insert into avisos_barrio(id,autor_id,barrio,titulo,descripcion,zona,categoria,observado_en)
 values(p_id,auth.uid(),v_barrio,btrim(p_titulo),btrim(p_descripcion),btrim(p_zona),p_categoria,p_observado_en);
 return p_id;
end; $$;

create or replace function public.enviar_aviso(p_id uuid,p_con_foto boolean default false)
returns void language plpgsql security definer set search_path=public,pg_temp as $$
declare a avisos_barrio; v_foto text;
begin
 select * into a from avisos_barrio where id=p_id for update;
 if not found or a.autor_id is distinct from auth.uid() or auth.uid() is null then raise exception 'NOT_AUTHORIZED'; end if;
 if a.barrio is distinct from (select barrio from perfiles where id=auth.uid()) then raise exception 'BARRIO_CHANGED'; end if;
 v_foto:=case when p_con_foto then p_id::text||'/foto.jpg' else null end;
 if a.estado='pendiente' and a.foto_path is not distinct from v_foto then return; end if;
 if a.estado<>'borrador' then raise exception 'INVALID_STATE'; end if;
 if p_con_foto and not exists(select 1 from storage.objects where bucket_id='avisos-fotos' and name=v_foto) then raise exception 'PHOTO_REQUIRED'; end if;
 update avisos_barrio set estado='pendiente',foto_path=v_foto,actualizado_en=now() where id=p_id;
 insert into historial_avisos(aviso_id,actor_id,accion) values(p_id,auth.uid(),'enviado');
end; $$;

create or replace function public.revisar_aviso(p_id uuid,p_accion text,p_titulo text default '',p_descripcion text default '',p_zona text default '',p_prioridad text default 'informativo',p_incluir_foto boolean default false,p_motivo text default '')
returns void language plpgsql security definer set search_path=public,pg_temp as $$
declare a avisos_barrio; v_estado text;
begin
 select * into a from avisos_barrio where id=p_id for update;
 if not found or auth.uid() is null or not soy_revisor_avisos(a.barrio) or a.autor_id=auth.uid() then raise exception 'NOT_AUTHORIZED'; end if;
 if p_accion='aprobar' and a.estado='pendiente' then
  if char_length(btrim(coalesce(p_titulo,''))) not between 5 and 120 or char_length(btrim(coalesce(p_descripcion,''))) not between 10 and 2000 or char_length(btrim(coalesce(p_zona,''))) not between 3 and 160 or coalesce(p_prioridad,'') not in ('informativo','importante','urgente') then raise exception 'INVALID_CONTENT'; end if;
  insert into avisos_publicos(id,barrio,titulo,descripcion,zona,categoria,prioridad,observado_en,foto_path,estado)
  values(a.id,a.barrio,btrim(p_titulo),btrim(p_descripcion),btrim(p_zona),a.categoria,p_prioridad,a.observado_en,case when p_incluir_foto then a.foto_path else null end,'publicado');
  v_estado:='publicado';
 elsif p_accion='rechazar' and a.estado='pendiente' then v_estado:='rechazado';
 elsif p_accion='finalizar' and a.estado='publicado' then v_estado:='finalizado';
 elsif p_accion='retirar' and a.estado in ('publicado','finalizado') then v_estado:='retirado';
 else raise exception 'INVALID_STATE'; end if;
 if char_length(p_motivo)>500 or (p_accion<>'aprobar' and char_length(btrim(coalesce(p_motivo,'')))<5) then raise exception 'REASON_REQUIRED'; end if;
 update avisos_barrio set estado=v_estado,motivo=nullif(btrim(p_motivo),''),actualizado_en=now() where id=p_id;
 if p_accion in ('finalizar','retirar') then
  update avisos_publicos set estado=v_estado,version=version+1,actualizado_en=now(),
   titulo=case when p_accion='retirar' then 'Aviso retirado' else titulo end,
   descripcion=case when p_accion='retirar' then btrim(p_motivo) else descripcion||E'\nActualización: '||btrim(p_motivo) end,
   foto_path=case when p_accion='retirar' then null else foto_path end where id=p_id;
 end if;
 insert into historial_avisos(aviso_id,actor_id,accion,motivo) values(p_id,auth.uid(),p_accion,nullif(btrim(p_motivo),''));
end; $$;

create or replace function public.retirar_mi_aviso(p_id uuid,p_motivo text)
returns void language plpgsql security definer set search_path=public,pg_temp as $$
declare a avisos_barrio;
begin
 select * into a from avisos_barrio where id=p_id for update;
 if not found or auth.uid() is null or a.autor_id<>auth.uid() then raise exception 'NOT_AUTHORIZED'; end if;
 if a.estado not in ('borrador','pendiente','publicado','finalizado') then raise exception 'INVALID_STATE'; end if;
 if char_length(btrim(coalesce(p_motivo,''))) not between 5 and 500 then raise exception 'REASON_REQUIRED'; end if;
 update avisos_barrio set estado='retirado',motivo=btrim(p_motivo),actualizado_en=now() where id=p_id;
 update avisos_publicos set estado='retirado',titulo='Aviso retirado',descripcion=btrim(p_motivo),foto_path=null,version=version+1,actualizado_en=now() where id=p_id;
 insert into historial_avisos(aviso_id,actor_id,accion,motivo) values(p_id,auth.uid(),'retirado_por_autor',btrim(p_motivo));
end; $$;

create or replace function public.tomar_turno_ia_aviso(p_id uuid)
returns void language plpgsql security definer set search_path=public,pg_temp as $$
begin
 if auth.uid() is null or not exists(select 1 from avisos_barrio a where a.id=p_id and (a.autor_id=auth.uid() or soy_revisor_avisos(a.barrio))) then raise exception 'NOT_AUTHORIZED'; end if;
 perform pg_advisory_xact_lock(hashtextextended(auth.uid()::text,13));
 if (select count(*) from usos_ia_avisos where vecino_id=auth.uid() and creado_en>now()-interval '1 hour')>=10 then raise exception 'AI_LIMIT'; end if;
 insert into usos_ia_avisos(vecino_id,aviso_id) values(auth.uid(),p_id);
end; $$;

-- Un objeto inmutable por reporte; el nombre no revela la identidad del reportante.
insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
 values('avisos-fotos','avisos-fotos',false,5242880,array['image/jpeg'])
 on conflict(id) do update set public=false,file_size_limit=5242880,allowed_mime_types=array['image/jpeg'];
create or replace function public.acceso_foto_aviso(p_name text,p_escritura boolean default false)
returns boolean language sql stable security definer set search_path=public,pg_temp as $$
 select auth.uid() is not null and exists(select 1 from avisos_barrio a where p_name=a.id::text||'/foto.jpg' and (
  (p_escritura and a.autor_id=auth.uid() and a.estado='borrador' and a.barrio=(select barrio from perfiles where id=auth.uid())) or
  (not p_escritura and (a.autor_id=auth.uid() or soy_revisor_avisos(a.barrio) or exists(
   select 1 from avisos_publicos p where p.id=a.id and p.foto_path=p_name and p.estado<>'retirado' and p.barrio=(select barrio from perfiles where id=auth.uid()))))));
$$;
drop policy if exists avisos_foto_insert on storage.objects;
create policy avisos_foto_insert on storage.objects for insert to authenticated with check(bucket_id='avisos-fotos' and public.acceso_foto_aviso(name,true));
drop policy if exists avisos_foto_read on storage.objects;
create policy avisos_foto_read on storage.objects for select to authenticated using(bucket_id='avisos-fotos' and public.acceso_foto_aviso(name,false));
drop policy if exists avisos_foto_delete on storage.objects;
create policy avisos_foto_delete on storage.objects for delete to authenticated using(bucket_id='avisos-fotos' and public.acceso_foto_aviso(name,true));

revoke all on function public.soy_revisor_avisos(text),public.guardar_borrador_aviso(uuid,text,text,text,text,timestamptz),public.enviar_aviso(uuid,boolean),public.revisar_aviso(uuid,text,text,text,text,text,boolean,text),public.retirar_mi_aviso(uuid,text),public.tomar_turno_ia_aviso(uuid),public.acceso_foto_aviso(text,boolean) from public,anon,authenticated;
grant execute on function public.soy_revisor_avisos(text),public.guardar_borrador_aviso(uuid,text,text,text,text,timestamptz),public.enviar_aviso(uuid,boolean),public.revisar_aviso(uuid,text,text,text,text,text,boolean,text),public.retirar_mi_aviso(uuid,text),public.tomar_turno_ia_aviso(uuid),public.acceso_foto_aviso(text,boolean) to authenticated;
notify pgrst,'reload schema';
commit;
