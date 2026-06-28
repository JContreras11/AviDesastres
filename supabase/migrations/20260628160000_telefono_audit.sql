-- Teléfono de contacto del usuario (visible SOLO para admins, en /admin/usuarios).
alter table profiles add column if not exists telefono text;

-- Bitácora general: TODA acción de creación/edición/borrado de cualquier usuario.
-- Se llena a nivel app (las escrituras usan service_role, donde auth.uid() es null).
create table if not exists audit_log (
  id           bigserial primary key,
  actor_id     uuid references auth.users(id) on delete set null,
  actor_nombre text,
  accion       text not null,           -- crear | editar | eliminar | tracking | donar | recibir | ...
  entidad      text not null,           -- insumo | persona | hospital | centro | usuario | donacion | membresia
  entidad_id   text,
  detalle      jsonb,
  created_at   timestamptz not null default now()
);
create index if not exists idx_audit_created on audit_log (created_at desc);
create index if not exists idx_audit_actor   on audit_log (actor_id);
