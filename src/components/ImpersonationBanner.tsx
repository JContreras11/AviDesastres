"use client";

import { useState } from "react";
import { dejarDeImpersonar } from "@/app/actions/impersonar";

// Barra de impersonación. Se renderiza desde el servidor (getSesion ya sabe si hay
// impersonación y de quién) -> aparece al instante, sin fetch en el cliente.
// No es sticky: va sobre el header en flujo normal, así no tapa el menú.
export function ImpersonationBanner({ nombre, rol }: { nombre: string | null; rol: string }) {
  const [saliendo, setSaliendo] = useState(false);

  async function salir() {
    setSaliendo(true);
    await dejarDeImpersonar();
    // Recarga dura: limpia toda la sesión efectiva (cookie) de una vez.
    window.location.href = "/";
  }

  return (
    <div className="print:hidden flex flex-wrap items-center justify-center gap-x-3 gap-y-1 bg-amber-500 px-3 py-2 text-center text-sm font-medium text-black">
      <span>👁️ Viendo como <strong>{nombre ?? "usuario"}</strong> ({rol})</span>
      <button onClick={salir} disabled={saliendo}
        className="rounded-md bg-black/15 px-2.5 py-1 text-xs font-semibold hover:bg-black/25 disabled:opacity-60">
        {saliendo ? "Volviendo…" : "Volver a mi cuenta"}
      </button>
    </div>
  );
}
