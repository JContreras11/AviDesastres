-- Unifica el último dato de entrega: el centro de acopio real pasa a ser institución
-- (hospitales tipo='refugio') con sus coords, y se relaciona con hospitales por ciudad.
-- Así TODOS los puntos de entrega viven en una sola tabla (hospitales). centros_acopio
-- queda legacy (sus FKs se migran en una tarea aparte).
insert into hospitales (nombre, ubicacion, gps_lat, gps_lng, tipo)
select c.nombre, c.ubicacion, c.gps_lat, c.gps_lng, 'refugio'
from centros_acopio c
where not exists (select 1 from hospitales h where h.nombre = c.nombre);

insert into hospital_refugio (hospital_id, refugio_id)
select h.id, r.id
from hospitales h
join hospitales r on r.tipo = 'refugio' and r.id <> h.id
where h.tipo in ('hospital', 'clinica')
  and (h.ubicacion ilike '%caracas%') = (r.ubicacion ilike '%caracas%')
on conflict do nothing;
