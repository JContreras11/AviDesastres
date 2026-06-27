"use server";

import { createAdminClient } from "@/lib/supabase/server";
import { procesarImagen } from "@/lib/ai/image";
import { extraerPersonas, type PersonaExtraida } from "@/lib/ai/vision";

export type RegistroPersonaResult =
  | { ok: false; error: string }
  | { ok: true; creadas: number; actualizadas: number; personas: any[] };

// Sube foto(s), extrae personas con IA, hace upsert por cédula manteniendo historial de estado.
export async function registrarPersonasDesdeImagen(
  formData: FormData,
): Promise<RegistroPersonaResult> {
  const file = formData.get("imagen");
  if (!(file instanceof File) || file.size === 0)
    return { ok: false, error: "No se recibió imagen." };

  const img = await procesarImagen(file, "personas");
  const res = await extraerPersonas(img.dataUrl);
  if (!res.ok) return { ok: false, error: res.motivo };

  const supabase = createAdminClient();
  let creadas = 0,
    actualizadas = 0;
  const guardadas: any[] = [];

  for (const p of res.data as PersonaExtraida[]) {
    if (!p.nombre) continue;
    const base = {
      nombre: p.nombre,
      cedula: p.cedula,
      edad: p.edad,
      sexo: p.sexo,
      ubicacion: p.ubicacion,
      estado_salud: p.estado_salud ?? "desconocido",
      descripcion_fisica: p.descripcion_fisica,
      gps_lat: img.exif.gps_lat,
      gps_lng: img.exif.gps_lng,
      foto_fecha: img.exif.foto_fecha,
      fuente: "ia_vision",
      confianza: res.confianza,
      raw_extraccion: p as any,
      fotos: [img.path],
    };

    // ¿Ya existe por cédula?
    const existente = p.cedula
      ? (await supabase.from("personas").select("*").eq("cedula", p.cedula).maybeSingle()).data
      : null;

    if (existente) {
      // Cambió el estado => guardar historial antes de actualizar.
      if (existente.estado_salud !== base.estado_salud) {
        await supabase.from("persona_historial").insert({
          persona_id: existente.id,
          estado_salud: existente.estado_salud,
          ubicacion: existente.ubicacion,
          hospital_id: existente.hospital_id,
          nota: "Actualización por IA",
          fuente: "ia_vision",
        });
      }
      const fotos = [...new Set([...(existente.fotos ?? []), img.path])].slice(0, 3);
      const { data } = await supabase
        .from("personas")
        .update({ ...base, fotos })
        .eq("id", existente.id)
        .select()
        .single();
      actualizadas++;
      guardadas.push(data);
    } else {
      const { data } = await supabase.from("personas").insert(base).select().single();
      creadas++;
      guardadas.push(data);
    }
  }

  return { ok: true, creadas, actualizadas, personas: guardadas };
}
