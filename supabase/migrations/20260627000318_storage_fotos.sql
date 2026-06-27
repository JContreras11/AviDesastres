-- Bucket público para fotos (cédulas, listas, carteles). Lectura pública, escritura vía service_role.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('fotos', 'fotos', true, 10485760, array['image/jpeg','image/png','image/webp','image/heic'])
on conflict (id) do nothing;
