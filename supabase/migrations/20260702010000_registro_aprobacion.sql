-- Registro público con aprobación por admin.
-- Un usuario nuevo (voluntario / médico / ONG) se registra y queda ATADO a una
-- institución existente mediante una membresía PENDIENTE. Hasta que un admin la
-- aprueba, NO obtiene acceso ampliado: lo ve todo como público (lectura restringida).
--
-- Diseño relacional: la aprobación vive en membresias.estado (aprobar = dar acceso).
-- Aditivo + idempotente.

-- 1) Estado de la membresía. El DEFAULT es 'aprobado' para NO romper los flujos que ya
--    crean membresías (admin asigna instituciones, responsables): una membresía creada
--    por personal de confianza nace aprobada. SOLO el auto-registro inserta 'pendiente'
--    explícitamente. Las filas EXISTENTES quedan 'aprobado' (las creó un admin).
alter table membresias add column if not exists estado text not null default 'aprobado';
alter table membresias alter column estado set default 'aprobado';
alter table membresias drop constraint if exists membresias_estado_chk;
alter table membresias add constraint membresias_estado_chk
  check (estado in ('pendiente', 'aprobado', 'rechazado'));

create index if not exists idx_membresias_estado on membresias (estado) where estado = 'pendiente';

-- 2) Los usuarios auto-registrados no deben nacer con poderes de 'voluntario'.
--    El perfil por defecto pasa a 'publico'; el rol real lo otorga el admin al aprobar
--    (o crearUsuario, que fija el rol explícitamente tras el trigger).
create or replace function handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into profiles (id, email, rol)
  values (new.id, new.email, 'publico')
  on conflict (id) do nothing;
  return new;
end; $$;
