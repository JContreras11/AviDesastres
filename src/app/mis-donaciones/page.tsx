import Link from "next/link";
import { redirect } from "next/navigation";
import { getSesion } from "@/lib/supabase/server";
import { misOfertas } from "@/app/actions/ofertas";
import { MisDonaciones } from "@/components/MisDonaciones";

export const dynamic = "force-dynamic";

export default async function MisDonacionesPage() {
  const s = await getSesion();
  if (!s) redirect("/login");
  const ofertas = await misOfertas();

  return (
    <main className="flex-1 px-4 py-8 max-w-2xl mx-auto w-full">
      <Link href="/" className="text-sm text-muted-foreground hover:underline">← Inicio</Link>
      <h1 className="text-2xl font-bold mt-2 mb-1">Mis donaciones</h1>
      <p className="text-sm text-muted-foreground mb-5">
        Lo que has ofrecido y en qué estado va. Puedes cancelar lo que aún no se entregó.
      </p>
      <MisDonaciones inicial={ofertas as any} />
    </main>
  );
}
