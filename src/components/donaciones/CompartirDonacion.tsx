"use client";

import { useState } from "react";
import { toast } from "sonner";

// Botón de compartir el enlace de estado de una donación (Web Share API + fallback copiar).
export function CompartirDonacion({ codigo, className = "" }: { codigo: string; className?: string }) {
  const [copiado, setCopiado] = useState(false);

  async function compartir() {
    const url = typeof window !== "undefined" ? `${window.location.origin}/donaciones/${codigo}` : `/donaciones/${codigo}`;
    const data = { title: `Donación ${codigo} — AviHelp`, text: "Sigue el estado de esta donación en AviHelp", url };
    try {
      if (navigator.share) { await navigator.share(data); return; }
    } catch { /* el usuario canceló: caemos a copiar */ }
    try {
      await navigator.clipboard.writeText(url);
      setCopiado(true);
      toast.success("Enlace copiado");
      setTimeout(() => setCopiado(false), 2000);
    } catch {
      toast.error("No se pudo copiar el enlace.");
    }
  }

  return (
    <button type="button" onClick={compartir}
      className={`text-center rounded-lg border px-3 py-2.5 text-sm font-medium hover:bg-muted ${className}`}>
      {copiado ? "✓ Enlace copiado" : "🔗 Compartir esta donación"}
    </button>
  );
}
