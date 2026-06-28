import { redirect } from "next/navigation";
import { getSesion } from "@/lib/supabase/server";
import { listarLog } from "@/app/actions/audit";
import { LogViewer } from "@/components/admin/LogViewer";

export const dynamic = "force-dynamic";

export default async function LogPage() {
  const s = await getSesion();
  if (s?.rol !== "admin") redirect("/");
  const { rows, total } = await listarLog(0);

  return (
    <main className="flex-1 px-4 py-8 max-w-4xl mx-auto w-full">
      <h1 className="text-2xl font-bold mb-1">Bitácora</h1>
      <p className="text-sm text-muted-foreground mb-6">Registro de todas las acciones de los usuarios ({total}). Solo administradores.</p>
      <LogViewer inicial={rows} total={total} />
    </main>
  );
}
