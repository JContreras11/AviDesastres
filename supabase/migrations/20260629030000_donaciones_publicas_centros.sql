-- Donaciones públicas (con datos de contacto del donante, sin cuenta) + relación
-- N:M centros de acopio <-> hospitales (a qué centros lleva la donación de cada hospital).

alter table donaciones
  add column if not exists donante_telefono text,
  add column if not exists donante_email    text;

-- Un centro de acopio atiende a varios hospitales y un hospital tiene varios centros.
create table if not exists centro_hospital (
  centro_id   uuid not null references centros_acopio(id) on delete cascade,
  hospital_id uuid not null references hospitales(id) on delete cascade,
  primary key (centro_id, hospital_id)
);
create index if not exists idx_ch_hospital on centro_hospital (hospital_id);
create index if not exists idx_ch_centro   on centro_hospital (centro_id);

-- Trigger de notificación: además del hospital, avisa a los centros de acopio
-- relacionados (allí se entrega/recibe la donación).
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

  -- Responsables del hospital de la necesidad.
  v_msg := '¡Ayuda en camino! Un donante enviará ' || new.cantidad || ' ' || coalesce(v_item, 'insumo')
        || ' para tu solicitud. Prepárate para la recepción.';
  insert into notificaciones (usuario_destino_id, necesidad_id, donacion_id, mensaje)
  select m.user_id, new.insumo_id, new.id, v_msg
  from membresias m
  where m.hospital_id = v_hospital;

  -- Centros de acopio relacionados con ese hospital (allí pueden llevar la donación).
  insert into notificaciones (usuario_destino_id, necesidad_id, donacion_id, mensaje)
  select m.user_id, new.insumo_id, new.id,
    'Posible donación en camino: ' || new.cantidad || ' ' || coalesce(v_item, 'insumo')
      || '. Un donante podría llevarla a tu centro de acopio; coordina la recepción.'
  from centro_hospital ch
  join membresias m on m.centro_id = ch.centro_id
  where ch.hospital_id = v_hospital;

  return new;
end; $$;

drop trigger if exists on_donacion_notifica on donaciones;
create trigger on_donacion_notifica after insert on donaciones
  for each row execute function notificar_donacion();
