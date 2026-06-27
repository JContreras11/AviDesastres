-- Campos extra para capturar máxima info de carteles/desaparecidos.
alter table personas add column if not exists telefono_contacto text;
alter table personas add column if not exists contacto_nombre text;
alter table personas add column if not exists notas text;
