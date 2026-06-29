-- Fuente única: la INSTITUCIÓN (tabla hospitales, incl. refugios por tipo) es la
-- definitiva — tiene todo el peso (insumos, membresías, coords, mapa, scope, relaciones).
-- centros_acopio queda deprecada como punto de entrega. Se quitan los duplicados que
-- se habían copiado desde refugios (su relación en centro_hospital cae en cascada).
delete from centros_acopio c
using hospitales r
where r.tipo = 'refugio' and r.nombre = c.nombre;
