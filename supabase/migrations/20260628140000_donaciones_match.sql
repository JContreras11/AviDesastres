-- FASE 3: rol operativo por membresía + ledger de "Donación" + match con remanente.
-- "Necesidad" = tabla insumos (item + cantidad solicitada + estado por hospital). No se duplica.

-- Los 4 roles operativos = rol_local (admin|responsable) × tipo de institución (hospital|centro).
--   hospital + admin       = Admin de Centro de Salud
--   hospital + responsable = Responsable de Centro de Salud
--   centro   + admin       = Admin de Donante Institucional
--   centro   + responsable = Responsable Institucional
alter table membresias add column if not exists rol_local text not null default 'responsable'
  check (rol_local in ('admin', 'responsable'));

-- Cache de conciliación sobre la Necesidad. pendiente = cantidad - en_camino - recibida.
alter table insumos
  add column if not exists cantidad_en_camino integer not null default 0,
  add column if not exists cantidad_recibida  integer not null default 0;

-- "Donación": lo que un donante institucional envía en respuesta a una Necesidad concreta.
create table if not exists donaciones (
  id             uuid primary key default uuid_generate_v4(),
  insumo_id      uuid not null references insumos(id) on delete cascade,   -- la Necesidad
  centro_id      uuid references centros_acopio(id) on delete set null,    -- centro/ONG donante
  donante_user   uuid references auth.users(id) on delete set null,
  donante_nombre text,
  cantidad       integer not null check (cantidad > 0),
  estado         text not null default 'en_camino' check (estado in ('en_camino', 'recibido', 'cancelado')),
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);
create index if not exists idx_donaciones_insumo on donaciones (insumo_id);

drop trigger if exists trg_donaciones_updated on donaciones;
create trigger trg_donaciones_updated before update on donaciones
  for each row execute function set_updated_at();

-- MATCH: recomputa cache + estatus de la Necesidad cuando cambian sus donaciones.
create or replace function recomputar_necesidad(p_insumo uuid)
returns void language plpgsql as $$
declare
  v_solicitada int;
  v_camino     int;
  v_recibida   int;
begin
  select coalesce(cantidad, 0) into v_solicitada from insumos where id = p_insumo;
  select coalesce(sum(cantidad), 0) into v_camino   from donaciones where insumo_id = p_insumo and estado = 'en_camino';
  select coalesce(sum(cantidad), 0) into v_recibida from donaciones where insumo_id = p_insumo and estado = 'recibido';
  update insumos set
    cantidad_en_camino = v_camino,
    cantidad_recibida  = v_recibida,
    -- Estatus derivado: todo recibido -> cubierto; algo donado -> en_transito (En Camino); si no -> solicitado (Pendiente).
    estado = case
      when v_solicitada > 0 and v_recibida >= v_solicitada then 'cubierto'
      when v_camino > 0 or v_recibida > 0                  then 'en_transito'
      else 'solicitado'
    end,
    cubierto_at = case when v_solicitada > 0 and v_recibida >= v_solicitada then now() else cubierto_at end
  where id = p_insumo and estado <> 'cancelado';
end; $$;

create or replace function trg_donacion_match()
returns trigger language plpgsql as $$
begin
  perform recomputar_necesidad(coalesce(new.insumo_id, old.insumo_id));
  return coalesce(new, old);
end; $$;

drop trigger if exists on_donacion_change on donaciones;
create trigger on_donacion_change after insert or update or delete on donaciones
  for each row execute function trg_donacion_match();
