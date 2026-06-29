-- Sexo: la IA lo infiere (M/F) desde el nombre al cargar; se elimina la opción "otro" (O).
-- Los registros existentes con 'O' pasan a null (sin dato).
update personas set sexo = null where sexo = 'O';

alter table personas drop constraint if exists personas_sexo_check;
alter table personas add constraint personas_sexo_check
  check (sexo is null or sexo in ('M', 'F', 'desconocido'));
