-- FASE 4: Notificaciones logísticas en tiempo real.
-- Al registrarse una Donación (estado en_camino), se avisa al/los responsable(s)
-- del Centro de Salud que su ayuda va en camino.

create table if not exists notificaciones (
  id                 uuid primary key default uuid_generate_v4(),
  usuario_destino_id uuid not null references auth.users(id) on delete cascade,
  necesidad_id       uuid references insumos(id) on delete cascade,     -- la Necesidad (insumo)
  donacion_id        uuid references donaciones(id) on delete cascade,
  mensaje            text not null,
  leida              boolean not null default false,
  fecha_creacion     timestamptz not null default now()
);
create index if not exists idx_notif_destino on notificaciones (usuario_destino_id, leida, fecha_creacion desc);

-- Disparador: una donación "en_camino" genera una notificación por cada miembro del hospital de esa necesidad.
create or replace function notificar_donacion()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  v_hospital uuid;
  v_item     text;
  v_msg      text;
begin
  if new.estado <> 'en_camino' then return new; end if;
  select hospital_id, nombre into v_hospital, v_item from insumos where id = new.insumo_id;
  if v_hospital is null then return new; end if;
  v_msg := '¡Ayuda en camino! Una ONG ha enviado ' || new.cantidad || ' ' || coalesce(v_item, 'insumo')
        || ' para tu solicitud. Prepárate para la recepción.';
  insert into notificaciones (usuario_destino_id, necesidad_id, donacion_id, mensaje)
  select m.user_id, new.insumo_id, new.id, v_msg
  from membresias m
  where m.hospital_id = v_hospital;
  return new;
end; $$;

drop trigger if exists on_donacion_notifica on donaciones;
create trigger on_donacion_notifica after insert on donaciones
  for each row execute function notificar_donacion();

-- RLS: cada usuario ve/marca SOLO sus notificaciones (el cliente browser usa la anon key).
alter table notificaciones enable row level security;
alter table notificaciones replica identity full;
drop policy if exists notif_select_own on notificaciones;
create policy notif_select_own on notificaciones for select to authenticated using (auth.uid() = usuario_destino_id);
drop policy if exists notif_update_own on notificaciones;
create policy notif_update_own on notificaciones for update to authenticated using (auth.uid() = usuario_destino_id);

-- Habilita Realtime para esta tabla.
do $$ begin
  if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and tablename = 'notificaciones') then
    alter publication supabase_realtime add table notificaciones;
  end if;
end $$;
