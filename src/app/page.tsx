import { contarTodo } from "@/app/actions/listas";
import { Captura } from "@/components/Captura";
import { Datos } from "@/components/datos/Datos";
import { HomeCards } from "@/components/HomeCards";
import { LandingPublico } from "@/components/LandingPublico";
import { ChatHero } from "@/components/ChatHero";
import { getSesion, createAdminClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function Home() {
  // Solo conteos (rápido). Las listas las pide cada tab con TanStack Query.
  const counts = await contarTodo();

  // Visitante anónimo: SOLO Avi (chat) + ver qué insumos faltan + donar. Nada más.
  const s = await getSesion();
  if (!s) {
    const { data: insumos } = await createAdminClient()
      .from("insumos")
      .select("id,nombre,cantidad,unidad,presentacion,prioridad,hospital_id,hospitales(nombre)")
      .in("estado", ["solicitado", "en_transito"])
      .order("prioridad")
      .limit(40);
    return <LandingPublico insumos={insumos ?? []} />;
  }

  return (
    <main className="flex-1 px-4 py-10 sm:py-14 bg-gradient-to-b from-primary/5 via-background to-background">
      {/* Una sola UI: el chat de Avi (con adjuntar/arrastrar archivos y voz para staff). */}
      <ChatHero />

      {/* Previews de lo que se cargó por el chat (solo aparecen al subir algo). */}
      <div className="mt-6"><Captura soloCola /></div>

      <HomeCards counts={counts} />

      <div id="datos" className="mt-12 scroll-mt-20">
        <Datos counts={counts} />
      </div>
    </main>
  );
}
