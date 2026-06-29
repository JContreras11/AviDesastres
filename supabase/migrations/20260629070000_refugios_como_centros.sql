-- Refugios SON centros de acopio (puntos de recepción/entrega). Se copian los refugios
-- a centros_acopio (idempotente por nombre) y se relacionan con hospitales/clínicas por
-- ciudad, para que las donaciones tengan a dónde ir (antes había 0 centros).
insert into centros_acopio (nombre, ubicacion, gps_lat, gps_lng, activo)
select r.nombre, r.ubicacion, r.gps_lat, r.gps_lng, true
from hospitales r
where r.tipo = 'refugio'
  and not exists (select 1 from centros_acopio c where c.nombre = r.nombre);

-- Relación N:N centro_acopio <-> hospital/clínica por cercanía (misma ciudad).
insert into centro_hospital (centro_id, hospital_id)
select c.id, h.id
from centros_acopio c
join hospitales h on h.tipo in ('hospital', 'clinica')
where (c.ubicacion ilike '%caracas%') = (h.ubicacion ilike '%caracas%')
on conflict do nothing;
