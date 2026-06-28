"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";

export function BotonImprimir() {
  // Lanza el diálogo de impresión automáticamente al abrir (un paso menos).
  useEffect(() => {
    const t = setTimeout(() => window.print(), 500);
    return () => clearTimeout(t);
  }, []);
  return <Button onClick={() => window.print()}>🖨️ Imprimir / Guardar PDF</Button>;
}
