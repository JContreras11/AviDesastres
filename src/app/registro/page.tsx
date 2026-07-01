import { institucionesPublicas } from "@/app/actions/usuarios";
import { RegistroForm } from "./RegistroForm";

export const dynamic = "force-dynamic";

export default async function RegistroPage() {
  const instituciones = await institucionesPublicas();
  return (
    <main className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-b from-primary/5 to-background">
      <RegistroForm instituciones={instituciones} />
    </main>
  );
}
