-- Ejecutar después de 20261112_avisos_barrio.sql como administrador (SQL Editor).
-- La autorización se fija al UUID conocido, nunca al primer usuario llamado Luis.
do $$
declare v_barrio text; v_nombre text;
begin
 select barrio,nombre into v_barrio,v_nombre from public.perfiles where id='3e9bed3f-0ee0-44ae-bba2-9746f292311d';
 if v_nombre is null or lower(btrim(v_nombre))<>'luis' or nullif(btrim(v_barrio),'') is null then
  raise exception 'Revisar el UUID, nombre y barrio de Luis antes de autorizarlo.';
 end if;
 insert into public.revisores_avisos(vecino_id,barrio) values('3e9bed3f-0ee0-44ae-bba2-9746f292311d',v_barrio) on conflict do nothing;
end $$;
select p.id,p.nombre,r.barrio from public.revisores_avisos r join public.perfiles p on p.id=r.vecino_id;
