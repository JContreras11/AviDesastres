"use server";

import { createAdminClient, createClient } from "@/lib/supabase/server";
import { registrarLog } from "@/app/actions/audit";

// CRUD de usuarios — SOLO admin. service_role salta RLS, así que cada acción
// reverifica que quien llama es admin (frontera de seguridad, no confiar en la UI).
async function exigirAdmin() {
  const sb = await createClient();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) throw new Error("No autenticado");
  const a = createAdminClient();
  const { data: perfil } = await a.from("profiles").select("rol").eq("id", user.id).maybeSingle();
  if (perfil?.rol !== "admin") throw new Error("No autorizado");
  return { uid: user.id, a };
}

const ROLES = ["admin", "medico", "voluntario", "ong", "publico"];

export async function listarUsuarios() {
  const { a } = await exigirAdmin();
  // Todos los usuarios de auth, aunque les falte perfil (creados por SQL antes del trigger).
  const [{ data: authList }, { data: perfiles }] = await Promise.all([
    a.auth.admin.listUsers({ perPage: 1000 }),
    a.from("profiles").select("id,email,nombre,telefono,rol,hospital_id,activo,hospitales(nombre)"),
  ]);
  const byId = new Map((perfiles ?? []).map((p: any) => [p.id, p]));
  return (authList?.users ?? []).map((u: any) => {
    const p: any = byId.get(u.id) ?? {};
    return {
      id: u.id,
      email: p.email ?? u.email ?? null,
      nombre: p.nombre ?? null,
      telefono: p.telefono ?? null,
      rol: p.rol ?? "publico",
      hospital_id: p.hospital_id ?? null,
      activo: p.activo ?? true,
      hospitales: p.hospitales ?? null,
      created_at: u.created_at,
    };
  }).sort((x: any, y: any) => (y.created_at ?? "").localeCompare(x.created_at ?? ""));
}

// ── Instituciones + membresías (M:M usuario ↔ hospital/centro) ──
export async function listarInstituciones() {
  const { a } = await exigirAdmin();
  const [{ data: hospitales }, { data: centros }] = await Promise.all([
    a.from("hospitales").select("id,nombre,tipo").order("nombre"),
    a.from("centros_acopio").select("id,nombre").order("nombre"),
  ]);
  return { hospitales: hospitales ?? [], centros: centros ?? [] };
}

export async function getMembresias(userId: string) {
  const { a } = await exigirAdmin();
  const { data } = await a.from("membresias").select("hospital_id,centro_id,rol_local").eq("user_id", userId);
  const roles: Record<string, string> = {};
  for (const m of data ?? []) { const id = m.hospital_id ?? m.centro_id; if (id) roles[id] = m.rol_local ?? "responsable"; }
  return {
    hospitalIds: (data ?? []).map((m: any) => m.hospital_id).filter(Boolean) as string[],
    centroIds: (data ?? []).map((m: any) => m.centro_id).filter(Boolean) as string[],
    roles,
  };
}

type Memb = { id: string; rol_local?: string };
export async function setMembresias(userId: string, hospitales: Memb[], centros: Memb[]) {
  const { a } = await exigirAdmin();
  // Reemplazo total: borra y reinserta (pocas filas por usuario).
  await a.from("membresias").delete().eq("user_id", userId);
  const rl = (r?: string) => (r === "admin" ? "admin" : "responsable");
  const filas = [
    ...hospitales.map((h) => ({ user_id: userId, hospital_id: h.id, rol_local: rl(h.rol_local) })),
    ...centros.map((c) => ({ user_id: userId, centro_id: c.id, rol_local: rl(c.rol_local) })),
  ];
  if (filas.length === 0) { await registrarLog("editar", "usuario", userId, { membresias: 0 }); return { ok: true }; }
  const { error } = await a.from("membresias").insert(filas);
  if (error) return { ok: false, error: error.message };
  await registrarLog("editar", "usuario", userId, { membresias: filas.length });
  return { ok: true };
}

export async function crearUsuario(campos: { email: string; password: string; nombre?: string; telefono?: string; rol?: string; hospital_id?: string | null }) {
  const { a } = await exigirAdmin();
  const email = campos.email?.trim().toLowerCase();
  if (!email) return { ok: false, error: "El correo es obligatorio." };
  if (!campos.password || campos.password.length < 6) return { ok: false, error: "La contraseña debe tener al menos 6 caracteres." };
  const rol = ROLES.includes(campos.rol ?? "") ? campos.rol : "voluntario";
  const { data, error } = await a.auth.admin.createUser({ email, password: campos.password, email_confirm: true });
  if (error) return { ok: false, error: error.message };
  // El trigger crea el perfil; le ponemos nombre/teléfono/rol/hospital.
  const { error: e2 } = await a.from("profiles")
    .update({ nombre: campos.nombre ?? null, telefono: campos.telefono ?? null, rol, hospital_id: campos.hospital_id || null, activo: true })
    .eq("id", data.user.id);
  if (e2) return { ok: false, error: e2.message };
  await registrarLog("crear", "usuario", data.user.id, { email, rol });
  return { ok: true };
}

export async function actualizarUsuario(id: string, campos: { nombre?: string; telefono?: string; rol?: string; hospital_id?: string | null; activo?: boolean }) {
  const { uid, a } = await exigirAdmin();
  if (id === uid && (campos.rol && campos.rol !== "admin" || campos.activo === false))
    return { ok: false, error: "No puedes quitarte a ti mismo el acceso de admin." };
  const limpio: Record<string, any> = {};
  if ("nombre" in campos) limpio.nombre = campos.nombre ?? null;
  if ("telefono" in campos) limpio.telefono = campos.telefono ?? null;
  if (campos.rol && ROLES.includes(campos.rol)) limpio.rol = campos.rol;
  if ("hospital_id" in campos) limpio.hospital_id = campos.hospital_id || null;
  if ("activo" in campos) limpio.activo = campos.activo;
  const { error } = await a.from("profiles").update(limpio).eq("id", id);
  if (error) return { ok: false, error: error.message };
  await registrarLog("editar", "usuario", id, limpio);
  return { ok: true };
}

export async function cambiarPasswordUsuario(id: string, password: string) {
  const { a } = await exigirAdmin();
  if (!password || password.length < 6) return { ok: false, error: "La contraseña debe tener al menos 6 caracteres." };
  const { error } = await a.auth.admin.updateUserById(id, { password });
  if (error) return { ok: false, error: error.message };
  await registrarLog("password", "usuario", id);
  return { ok: true };
}

export async function eliminarUsuario(id: string) {
  const { uid, a } = await exigirAdmin();
  if (id === uid) return { ok: false, error: "No puedes eliminar tu propia cuenta." };
  const { error } = await a.auth.admin.deleteUser(id); // FK on delete cascade borra el perfil
  if (error) return { ok: false, error: error.message };
  await registrarLog("eliminar", "usuario", id);
  return { ok: true };
}
