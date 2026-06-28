"use server";

import { cookies } from "next/headers";
import { createClient, createAdminClient, IMP_COOKIE } from "@/lib/supabase/server";

// Impersonación: un admin "ve como" otro usuario para revisar su vista y hacer
// solicitudes por él. Toda la app usa getScope/getSesion -> ya respetan la cookie.
async function adminRealId(): Promise<string | null> {
  const sb = await createClient();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) return null;
  const a = createAdminClient();
  const { data } = await a.from("profiles").select("rol").eq("id", user.id).maybeSingle();
  return data?.rol === "admin" ? user.id : null;
}

export async function impersonar(userId: string) {
  const adminId = await adminRealId();
  if (!adminId) return { ok: false, error: "Solo un admin puede impersonar." };
  if (userId === adminId) return { ok: false, error: "Ya eres tú." };
  (await cookies()).set(IMP_COOKIE, userId, { httpOnly: true, sameSite: "lax", path: "/", maxAge: 60 * 60 * 8 });
  return { ok: true };
}

export async function dejarDeImpersonar() {
  (await cookies()).delete(IMP_COOKIE);
  return { ok: true };
}
