-- Búsqueda de texto completo (tokenización) sobre `documentos`. Todo lo que se
-- ingresa (personas, insumos, hospitales, notas/texto libre) se vuelca aquí como
-- texto buscable. El embedding (vector) queda opcional para cuando haya API key.

alter table documentos
  add column if not exists fts tsvector
    generated always as (to_tsvector('spanish', coalesce(contenido, ''))) stored;

create index if not exists idx_documentos_fts on documentos using gin (fts);

-- Búsqueda por relevancia de texto (websearch: admite comillas, OR, -negación).
create or replace function buscar_documentos(q text, match_count int default 10)
returns table (
  id uuid, source_table text, source_id uuid, contenido text, metadata jsonb, rank real
)
language sql stable as $$
  select d.id, d.source_table, d.source_id, d.contenido, d.metadata,
         ts_rank(d.fts, websearch_to_tsquery('spanish', q)) as rank
  from documentos d
  where d.fts @@ websearch_to_tsquery('spanish', q)
  order by rank desc
  limit match_count;
$$;
