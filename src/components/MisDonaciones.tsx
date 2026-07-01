"use client";

import { useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { cancelarOferta } from "@/app/actions/ofertas";
import { Button } from "@/components/ui/button";
import { CopyableText } from "@/components/donaciones/CopyableText";
import { rubricaDonacion, emojiRubrica, nombreDonacion } from "@/app/donaciones/rubrica";
import { DonarModal } from "@/components/DonarInsumo";

type Entrega = { codigo: string; estado: string; recibido_at: string | null };
type Oferta = {
  id: string; codigo?: string | null; tipo: string; descripcion: string; cantidad: number | null;
  area?: string | null; contacto_nombre?: string | null;
  estatus: "disponible" | "reservado" | "entregado" | "cancelado"; created_at: string;
  hospitales?: { nombre: string | null; ubicacion: string | null } | null;
  entregas?: Entrega[] | null;
  tipoOrigen: "oferta" | "donacion";
  contacto_telefono?: string | null;
  contacto_email?: string | null;
  refugio_id?: string | null;
  insumo: any;
};

const ESTADO: Record<string, { label: string; cls: string }> = {
  disponible: { label: "Disponible", cls: "bg-sky-100 text-sky-700" },
  reservado:  { label: "Reservado", cls: "bg-amber-100 text-amber-700" },
  entregado:  { label: "Entregado", cls: "bg-emerald-100 text-emerald-700" },
  cancelado:  { label: "Cancelado", cls: "bg-muted text-muted-foreground" },
};

export function MisDonaciones({ inicial }: { inicial: Oferta[] }) {
  const [ofertas, setOfertas] = useState<Oferta[]>(inicial);
  const [cancelando, setCancelando] = useState<string | null>(null);
  const [edicionOpen, setEdicionOpen] = useState<Oferta | null>(null);

  async function cancelar(id: string) {
    setCancelando(id);
    const r = await cancelarOferta(id);
    setCancelando(null);
    if (!r.ok) { toast.error(r.error); return; }
    // Actualiza el estado local (sin router.refresh): la lista refleja el cambio al instante.
    setOfertas((prev) => prev.map((o) => (o.id === id ? { ...o, estatus: "cancelado" } : o)));
    toast.success("Donación cancelada.");
  }

  if (!ofertas.length) {
    return (
      <div className="rounded-xl border p-6 text-center text-sm text-muted-foreground">
        Aún no has registrado donaciones.{" "}
        <Link href="/donaciones/crear" className="text-primary underline">Donar 💜</Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {ofertas.map((o) => {
        const e = ESTADO[o.estatus] ?? ESTADO.disponible;
        const cancelable = o.estatus !== "entregado" && o.estatus !== "cancelado";
        // FIX 10: identifica por NOMBRE (donante o "Anónimo") + rúbrica; id como subtexto copiable.
        const rubrica = rubricaDonacion(o.tipo, `${o.descripcion} ${o.area ?? ""}`);
        const esVol = o.tipo === "personal_humano";
        const codigo = o.entregas?.[0]?.codigo ?? o.codigo ?? null;
        return (
          <div
            key={o.id}
            onClick={() => setEdicionOpen(o)}
            className="rounded-xl border p-4 flex flex-col gap-2 cursor-pointer hover:border-primary/50 transition bg-card text-card-foreground hover:bg-muted/10"
          >
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0" onClick={(e) => e.stopPropagation()}>
                <p className="font-medium min-w-0 flex items-center gap-1.5">
                  <span>{emojiRubrica(rubrica)}</span>
                  <CopyableText value={nombreDonacion(o.contacto_nombre)} className="max-w-[12rem]" />
                </p>
                <p className="text-xs text-muted-foreground">{rubrica}
                  {codigo && <> · <CopyableText value={codigo} mono className="text-[11px]" /></>}
                </p>
              </div>
              <span className={`shrink-0 px-2 py-0.5 rounded text-xs font-semibold ${e.cls}`}>{e.label}</span>
            </div>
            <p className="text-sm text-muted-foreground">
              <span className="capitalize">{o.descripcion}</span>
              {o.cantidad ? <span> · {o.cantidad} und.</span> : null}
            </p>
            {o.hospitales?.nombre && (
              <p className="text-sm text-muted-foreground">{esVol ? "🩺 Ayudarás en:" : "📦 Entrega en:"} {o.hospitales.nombre}
                {o.hospitales.ubicacion ? ` — ${o.hospitales.ubicacion}` : ""}</p>
            )}
            {(() => {
              const ent = o.entregas?.[0];
              const codigo = ent?.codigo ?? o.codigo;
              if (!codigo) return null;
              return (
                <div className="flex items-center justify-between gap-2 text-xs" onClick={(e) => e.stopPropagation()}>
                  <Link href={`/donaciones/${codigo}`} className="text-primary underline font-medium">
                    🔗 {esVol ? "Ver voluntariado" : "Ver donación"} →
                  </Link>
                  {ent?.estado === "recibido" && <span className="text-emerald-600 font-medium">✅ recibida</span>}
                </div>
              );
            })()}
            <p className="text-xs text-muted-foreground">{new Date(o.created_at).toLocaleDateString("es-VE")}</p>
            {cancelable && (
              <div onClick={(e) => e.stopPropagation()}>
                <Button variant="outline" size="sm" disabled={cancelando === o.id} onClick={() => cancelar(o.id)}>
                  {cancelando === o.id ? "Cancelando…" : "Cancelar"}
                </Button>
              </div>
            )}
          </div>
        );
      })}

      {edicionOpen && (
        <DonarModal
          insumo={edicionOpen.insumo}
          edicion={{
            id: edicionOpen.id,
            tipoOrigen: edicionOpen.tipoOrigen,
            cantidad: edicionOpen.cantidad ?? 1,
            nombre: edicionOpen.contacto_nombre ?? "",
            telefono: edicionOpen.contacto_telefono ?? "",
            email: edicionOpen.contacto_email ?? "",
            lugarEntregaId: edicionOpen.refugio_id ?? null,
          }}
          onClose={() => setEdicionOpen(null)}
          onChanged={() => {
            window.location.reload();
          }}
        />
      )}
    </div>
  );
}
