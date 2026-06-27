"use server";

import { createAdminClient } from "@/lib/supabase/server";
import { procesarImagen } from "@/lib/ai/image";
import { extraerInsumos, type InsumoExtraido } from "@/lib/ai/vision";

export type RegistroInsumosResult =
  | { ok: false; error: string }
  | { ok: true; creados: number; insumos: any[] };

// Foto de lista de insumos pegada en pared -> digitaliza y registra para un hospital.
export async function registrarInsumosDesdeImagen(
  formData: FormData,
): Promise<RegistroInsumosResult> {
  const file = formData.get("imagen");
  const hospitalId = formData.get("hospital_id");
  if (!(file instanceof File) || file.size === 0)
    return { ok: false, error: "No se recibió imagen." };
  if (typeof hospitalId !== "string" || !hospitalId)
    return { ok: false, error: "Falta el hospital." };

  const img = await procesarImagen(file, "insumos");
  const res = await extraerInsumos(img.dataUrl);
  if (!res.ok) return { ok: false, error: res.motivo };

  const supabase = createAdminClient();
  const filas = (res.data as InsumoExtraido[])
    .filter((i) => i.nombre)
    .map((i) => ({
      hospital_id: hospitalId,
      nombre: i.nombre,
      cantidad: i.cantidad,
      unidad: i.unidad,
      prioridad: i.prioridad ?? "media",
      estado: "solicitado",
      fuente: "ia_vision",
      confianza: res.confianza,
      raw_extraccion: i as any,
    }));

  if (filas.length === 0) return { ok: false, error: "No se detectaron insumos legibles." };

  const { data, error } = await supabase.from("insumos").insert(filas).select();
  if (error) return { ok: false, error: error.message };
  return { ok: true, creados: data.length, insumos: data };
}
