"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { ChatPanel } from "@/components/ChatPanel";
import { useChat } from "@/lib/chat-store";
import { Logo } from "@/components/Brand";
import { DonarBoton } from "@/components/DonarInsumo";

type Insumo = { id: string; nombre: string; cantidad: number | null; unidad: string | null; presentacion: string | null; prioridad: string; hospital_id: string | null; hospitales: { nombre: string } | null };

// Presentación legible para el badge (pastilla, ml, ampolla…). "otro" -> usa la unidad.
const presentacionDe = (i: { presentacion: string | null; unidad: string | null }) =>
  (i.presentacion && i.presentacion !== "otro" ? i.presentacion : i.unidad) || null;

const CHIPS = [
  { txt: "🩹 ¿Qué insumos faltan?", msg: "¿Qué insumos faltan en los hospitales ahora?" },
  { txt: "💜 ¿Cómo puedo donar?", msg: "¿Cómo puedo donar o ofrecer ayuda?" },
  { txt: "🔎 Buscar a una persona", msg: "Quiero buscar a una persona. ¿Cómo lo hago?" },
  { txt: "❓ ¿Cómo funciona?", msg: "¿Cómo funciona AviHelp?" },
];

const PRIO = ["critica", "alta", "media", "baja"];
const PRIO_LABEL: Record<string, string> = { critica: "Prioridad crítica", alta: "Prioridad alta", media: "Prioridad media", baja: "Prioridad baja" };
const PRIO_PILL: Record<string, string> = {
  critica: "bg-red-100 text-red-700 dark:bg-red-950/40 dark:text-red-300",
  alta: "bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300",
  media: "bg-sky-100 text-sky-700 dark:bg-sky-950/40 dark:text-sky-300",
  baja: "bg-muted text-muted-foreground",
};
const selCls = "h-11 px-3 rounded-xl border bg-background text-base";

export function LandingPublico({ insumos }: { insumos: Insumo[] }) {
  const { enviar } = useChat();
  const [prio, setPrio] = useState("todas");
  const [hosp, setHosp] = useState("todos");

  const hospitales = useMemo(
    () => [...new Set(insumos.map((i) => i.hospitales?.nombre).filter(Boolean) as string[])].sort(),
    [insumos],
  );
  const filtrados = insumos.filter((i) =>
    (prio === "todas" || i.prioridad === prio) && (hosp === "todos" || i.hospitales?.nombre === hosp));

  return (
    <main className="flex-1 px-4 py-8 bg-gradient-to-b from-primary/5 via-background to-background">
      <div className="max-w-2xl mx-auto flex flex-col items-center text-center mb-6">
        <Logo size={72} />
        <h1 className="mt-3 text-3xl font-bold tracking-tight bg-gradient-to-r from-primary to-[#5eead4] bg-clip-text text-transparent">Soy Avi</h1>
        <p className="text-muted-foreground mt-1 max-w-md">Pregúntame qué falta, a quién buscas o cómo donar. Estoy para ayudarte en la emergencia.</p>
        <Link href="/ayuda" className="mt-2 text-sm font-medium text-primary hover:underline">¿Cómo funciona? Ver guía completa →</Link>
      </div>

      <div className="max-w-2xl mx-auto">
        <div className="flex flex-wrap gap-2 justify-center mb-3">
          {CHIPS.map((c) => (
            <button key={c.txt} onClick={() => enviar(c.msg)}
              className="rounded-full border bg-card px-3 py-1.5 text-sm hover:bg-muted active:scale-95 transition">{c.txt}</button>
          ))}
        </div>
        <div className="h-[min(60vh,460px)] rounded-2xl border bg-card overflow-hidden shadow-sm">
          <ChatPanel className="h-full" />
        </div>
      </div>

      {/* Necesidades: grande, detallado, con filtros y donar directo. */}
      <section className="max-w-2xl mx-auto mt-10">
        <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
          <h2 className="text-2xl font-bold">Necesidades ahora</h2>
          <Link href="/donaciones/crear" className="rounded-xl bg-primary text-primary-foreground px-4 py-2.5 text-base font-semibold">💜 Donar / Ofrecer ayuda</Link>
        </div>

        <div className="flex flex-wrap gap-2 mb-4">
          <select value={prio} onChange={(e) => setPrio(e.target.value)} className={selCls} aria-label="Filtrar por prioridad">
            <option value="todas">Toda prioridad</option>
            {PRIO.map((p) => <option key={p} value={p}>{PRIO_LABEL[p]}</option>)}
          </select>
          <select value={hosp} onChange={(e) => setHosp(e.target.value)} className={`${selCls} max-w-[60%]`} aria-label="Filtrar por hospital">
            <option value="todos">Todos los hospitales</option>
            {hospitales.map((h) => <option key={h} value={h}>{h}</option>)}
          </select>
        </div>

        <div className="flex flex-col gap-3">
          {filtrados.map((i) => (
            <div key={i.id} className="rounded-2xl border bg-card p-4 flex gap-3 min-h-[150px]">
              {/* Izquierda: nombre, prioridad (subtítulo), hospital (abajo). */}
              <div className="flex-1 min-w-0 flex flex-col gap-1">
                <p className="text-xl font-bold leading-tight capitalize">{i.nombre}</p>
                <span className={`self-start rounded-full px-3 py-1 text-sm font-semibold ${PRIO_PILL[i.prioridad] ?? "bg-muted"}`}>
                  {PRIO_LABEL[i.prioridad] ?? i.prioridad}
                </span>
                {i.hospitales?.nombre && (
                  <p className="mt-auto text-base"><span className="text-muted-foreground">Hospital: </span><span className="font-medium">🏥 {i.hospitales.nombre}</span></p>
                )}
              </div>
              {/* Derecha: cantidad + presentación (badge) arriba, donar abajo. */}
              <div className="flex flex-col items-end justify-between shrink-0">
                <div className="text-right">
                  <p className="text-base whitespace-nowrap">
                    <span className="text-muted-foreground">Cantidad: </span>
                    <span className="font-semibold">{i.cantidad ?? "—"}</span>
                  </p>
                  {presentacionDe(i) && (
                    <span className="inline-block mt-1 rounded-full bg-primary/10 text-primary px-2.5 py-1 text-sm font-semibold capitalize">💊 {presentacionDe(i)}</span>
                  )}
                </div>
                <DonarBoton insumo={i} />
              </div>
            </div>
          ))}
          {filtrados.length === 0 && <p className="p-4 text-base text-muted-foreground">No hay solicitudes con esos filtros.</p>}
        </div>
      </section>

      <p className="max-w-2xl mx-auto mt-8 text-center text-base text-muted-foreground">
        ¿Eres personal de salud, ONG o voluntario?{" "}
        <Link href="/login" className="text-primary underline font-medium">Inicia sesión</Link>{" "}para registrar personas, gestionar insumos y ver más.
      </p>
    </main>
  );
}
