-- Coordenadas aproximadas (por sector/parroquia) para mostrar los refugios en el mapa.
-- Aproximadas: La Guaira no tiene geocoder configurado; afinar si se consigue la ubicación exacta.
update hospitales h set gps_lat = v.lat, gps_lng = v.lng
from (values
  ('Refugio para abuelos y abuelas (sin amparo familiar)', 10.6020, -66.9910),
  ('Refugio para niños y niñas (sin amparo familiar)',     10.5930, -66.9980),
  ('Centro de Adiestramiento Naval Escuela de Grumetes',   10.6000, -67.0200),
  ('UEN Juan Germán Roscio',                               10.6010, -66.9780),
  ('Liceo Armando Reverón',                                10.5940, -66.9960),
  ('Complejo Educativo República de Panamá',               10.6030, -66.9320),
  ('Liceo Nacional Lorenzo González',                      10.6010, -66.9500),
  ('UEE La Guaira',                                        10.6060, -66.9340),
  ('UENB 10 de Marzo',                                     10.5990, -66.9550),
  ('CEIS Manuelita Sáenz',                                 10.5980, -67.0100),
  ('Universidad Marítima del Caribe',                      10.5960, -67.0250)
) as v(nombre, lat, lng)
where h.nombre = v.nombre and h.tipo = 'refugio';
