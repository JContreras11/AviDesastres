import { getSesion } from "@/lib/supabase/server";
import OfrecerForm from "./OfrecerForm";

export const dynamic = "force-dynamic";

// Server wrapper: detecta la sesión (sin parpadeo) y se la pasa al formulario.
// Logueado -> no se piden nombre/teléfono (el servidor los toma del perfil).
export default async function Ofrecer() {
  const sesion = await getSesion();
  return <OfrecerForm autenticado={!!sesion} nombre={sesion?.nombre ?? null} />;
}
