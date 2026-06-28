"use server";

import { createAdminClient, getScope } from "@/lib/supabase/server";

// Bitácora a nivel app: registra una acción atribuida al usuario autenticado.
// Best-effort: nunca debe romper la operación principal si el log falla.
// ponytail: resuelve el actor con getScope/perfil en cada llamada; barato a este volumen.
export async function registrarLog(accion: string, entidad: string, entidadId?: string | null, detalle?: any) {
  try {
    const sc = await getScope();
    const a = createAdminClient();
    let nombre: string | null = null;
    if (sc.uid) {
      const { data } = await a.from("profiles").select("nombre,email").eq("id", sc.uid).maybeSingle();
      nombre = data?.nombre ?? data?.email ?? null;
    }
    await a.from("audit_log").insert({
      actor_id: sc.uid, actor_nombre: nombre, accion, entidad,
      entidad_id: entidadId ?? null, detalle: detalle ?? null,
    });
  } catch { /* el log nunca tumba la acción real */ }
}

// Listado para admins (paginado simple).
export async function listarLog(page = 0, pageSize = 50) {
  const sc = await getScope();
  if (!sc.admin) return { rows: [], total: 0 };
  const a = createAdminClient();
  const { data, count } = await a.from("audit_log")
    .select("*", { count: "exact" })
    .order("created_at", { ascending: false })
    .range(page * pageSize, page * pageSize + pageSize - 1);
  return { rows: data ?? [], total: count ?? 0 };
}
