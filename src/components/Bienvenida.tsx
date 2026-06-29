"use client";

import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

// Aviso de bienvenida al entrar: qué es AviHelp, qué puedes hacer y descargo de responsabilidad.
// Se muestra una vez (localStorage). Subir VERSION para volver a mostrarlo a todos.
const VERSION = "v1";
const KEY = `avi_bienvenida_${VERSION}`;

const PASOS = [
  { n: 1, t: "Buscar a una persona", d: "Usa el chat (Avi) y escribe un nombre o sube una foto. Te dice si está registrada en un hospital o refugio, sin exponer datos sensibles." },
  { n: 2, t: "Ver necesidades y refugios", d: "Consulta qué insumos piden hospitales y refugios, y dónde están los centros de acopio y refugios en el mapa." },
  { n: 3, t: "Registrar / solicitar", d: "El personal verificado de un centro registra personas e insumos, y actualiza el estatus cuando llega la ayuda." },
];

export function Bienvenida() {
  const [open, setOpen] = useState(false);
  useEffect(() => {
    try { if (!localStorage.getItem(KEY)) setOpen(true); } catch {}
  }, []);
  function cerrar() {
    try { localStorage.setItem(KEY, "1"); } catch {}
    setOpen(false);
  }

  if (!open) return null;
  return (
    <Dialog open onOpenChange={(o) => !o && cerrar()}>
      <DialogContent className="max-h-[88vh] overflow-auto sm:max-w-lg">
        <DialogHeader><DialogTitle className="text-2xl pr-8">¿Cómo funciona AviHelp?</DialogTitle></DialogHeader>
        <div className="flex flex-col gap-4">
          <p className="text-muted-foreground">
            Plataforma gratuita para <strong className="text-foreground">coordinar ayuda</strong> durante la emergencia en Venezuela:
            encontrar personas, ver necesidades de insumos y ubicar hospitales, refugios y centros de acopio.
          </p>

          <div className="flex flex-col gap-3">
            {PASOS.map((p) => (
              <div key={p.n} className="flex gap-3">
                <span className="grid place-items-center size-7 shrink-0 rounded-lg bg-primary/15 text-primary font-bold text-sm">{p.n}</span>
                <div>
                  <p className="font-semibold leading-tight">{p.t}</p>
                  <p className="text-sm text-muted-foreground">{p.d}</p>
                </div>
              </div>
            ))}
          </div>

          <p className="text-xs text-muted-foreground border-t pt-3 leading-snug">
            <strong className="text-foreground">Descargo de responsabilidad:</strong> gran parte de los datos los ingresan
            voluntarios y la comunidad. AviHelp no garantiza su exactitud — confirma siempre llamando al centro antes de trasladar
            a una persona o insumos. Emergencias: <strong className="text-foreground">171</strong>.
          </p>
        </div>
        <DialogFooter>
          <Button size="lg" onClick={cerrar} className="w-full">Entendido</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
