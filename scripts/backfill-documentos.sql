-- Reindexa personas + insumos existentes en `documentos` (búsqueda de texto).
-- Uso: ./scripts/db.sh psql dev  (o prod) y pega esto; o psql <url> -f este.sql
-- Idempotente: upsert por (source_table, source_id).

insert into documentos (source_table, source_id, contenido, metadata)
select 'personas', p.id,
  concat_ws(' · ', p.nombre, nullif(p.cedula,''),
    case when p.edad is not null then p.edad||' años' end, p.sexo, p.estado_salud,
    p.ubicacion, p.descripcion_fisica,
    case when p.telefono_contacto is not null then 'tel '||p.telefono_contacto end, p.notas),
  jsonb_build_object('hospital', h.nombre)
from personas p left join hospitales h on h.id = p.hospital_id
on conflict (source_table, source_id) do update set contenido = excluded.contenido, metadata = excluded.metadata;

insert into documentos (source_table, source_id, contenido, metadata)
select 'insumos', i.id,
  concat_ws(' · ', i.nombre,
    case when i.cantidad is not null then i.cantidad||' '||coalesce(i.unidad,'') end,
    i.presentacion, i.area, 'prioridad '||i.prioridad, i.estado, i.para_que_sirve, i.alternativas,
    case when h.nombre is not null then 'hospital '||h.nombre end),
  jsonb_build_object('hospital', h.nombre, 'area', i.area, 'estado', i.estado)
from insumos i left join hospitales h on h.id = i.hospital_id
on conflict (source_table, source_id) do update set contenido = excluded.contenido, metadata = excluded.metadata;
