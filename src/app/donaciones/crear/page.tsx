import { getSesion, createAdminClient } from "@/lib/supabase/server";
import { listarCentrosEntrega } from "@/app/actions/ofertas";
import DonacionWizard from "./DonacionWizard";

export const dynamic = "force-dynamic";

// Flujo de donación paso a paso (una decisión por vista). Migra el antiguo /ofrecer.
// Logueado -> no pide nombre/teléfono (servidor los toma del perfil).
// ?hospital=ID (desde /compartir) -> muestra a quién se ayuda y prioriza sus necesidades.
export default async function CrearDonacion({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const sp = await searchParams;
  const hospitalId = typeof sp.hospital === "string" ? sp.hospital : null;
  const [sesion, centros] = await Promise.all([getSesion(), listarCentrosEntrega()]);

  let hospitalCtx: { id: string; nombre: string } | null = null;
  if (hospitalId) {
    const { data } = await createAdminClient().from("hospitales").select("id, nombre").eq("id", hospitalId).maybeSingle();
    if (data) hospitalCtx = { id: data.id, nombre: data.nombre };
  }

  return <DonacionWizard autenticado={!!sesion} nombre={sesion?.nombre ?? null} centros={centros} hospitalCtx={hospitalCtx} />;
}
