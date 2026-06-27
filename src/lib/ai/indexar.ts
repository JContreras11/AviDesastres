import OpenAI from "openai";

// Vuelca cualquier entidad/texto a `documentos` como texto buscable (tokenizado
// por Postgres FTS). Si hay OPENAI_API_KEY también guarda el embedding (vector)
// para búsqueda semántica; si no, igual queda buscable por texto completo.

const EMB_MODEL = "text-embedding-3-small"; // 1536 dims (coincide con el esquema)

async function embed(texto: string): Promise<number[] | null> {
  if (!process.env.OPENAI_API_KEY) return null; // sin key: solo texto completo
  try {
    const oa = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    const r = await oa.embeddings.create({ model: EMB_MODEL, input: texto.slice(0, 8000) });
    return r.data[0]?.embedding ?? null;
  } catch {
    return null;
  }
}

// Upsert por (source_table, source_id): re-indexar una entidad la actualiza.
export async function indexar(
  supabase: any,
  source_table: string,
  source_id: string,
  contenido: string,
  metadata: Record<string, any> = {},
) {
  const texto = contenido.trim();
  if (!texto) return;
  const embedding = await embed(texto);
  await supabase.from("documentos").upsert(
    { source_table, source_id, contenido: texto, metadata, embedding },
    { onConflict: "source_table,source_id" },
  );
}

// Texto legible de una persona para búsqueda.
export function textoPersona(p: any, extra?: string): string {
  return [
    p.nombre, p.cedula && `cédula ${p.cedula}`, p.edad && `${p.edad} años`, p.sexo,
    p.estado_salud, p.ubicacion, p.descripcion_fisica,
    p.telefono_contacto && `tel ${p.telefono_contacto}`, p.contacto_nombre, p.notas, extra,
  ].filter(Boolean).join(" · ");
}

export function textoInsumo(i: any, hospital?: string, extra?: string): string {
  return [
    i.nombre, i.cantidad && `${i.cantidad} ${i.unidad ?? ""}`.trim(), i.presentacion, i.area,
    i.prioridad && `prioridad ${i.prioridad}`, i.estado, i.para_que_sirve, i.alternativas,
    hospital && `hospital ${hospital}`, extra,
  ].filter(Boolean).join(" · ");
}
