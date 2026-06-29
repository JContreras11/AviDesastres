"use client";

import Link from "next/link";
import { ChatPanel } from "@/components/ChatPanel";
import { useChat } from "@/lib/chat-store";
import { Logo } from "@/components/Brand";

type Insumo = { id: string; nombre: string; cantidad: number | null; unidad: string | null; prioridad: string; hospitales: { nombre: string } | null };

const CHIPS = [
  { txt: "🩹 ¿Qué insumos faltan?", msg: "¿Qué insumos faltan en los hospitales ahora?" },
  { txt: "💜 ¿Cómo puedo donar?", msg: "¿Cómo puedo donar o ofrecer ayuda?" },
  { txt: "🔎 Buscar a una persona", msg: "Quiero buscar a una persona. ¿Cómo lo hago?" },
  { txt: "❓ ¿Cómo funciona?", msg: "¿Cómo funciona AviHelp?" },
];

const PRIO_CLS: Record<string, string> = { critica: "text-red-600 font-semibold", alta: "text-amber-600 font-semibold", media: "text-muted-foreground", baja: "text-muted-foreground" };

export function LandingPublico({ insumos }: { insumos: Insumo[] }) {
  const { enviar } = useChat();

  return (
    <main className="flex-1 px-4 py-8 bg-gradient-to-b from-primary/5 via-background to-background">
      <div className="max-w-2xl mx-auto flex flex-col items-center text-center mb-6">
        <Logo size={72} />
        <h1 className="mt-3 text-3xl font-bold tracking-tight bg-gradient-to-r from-primary to-[#5eead4] bg-clip-text text-transparent">Soy Avi</h1>
        <p className="text-muted-foreground mt-1 max-w-md">Pregúntame qué falta, a quién buscas o cómo donar. Estoy para ayudarte en la emergencia.</p>
      </div>

      {/* Chat de Avi: lo primero y principal para el visitante. */}
      <div className="max-w-2xl mx-auto">
        <div className="flex flex-wrap gap-2 justify-center mb-3">
          {CHIPS.map((c) => (
            <button key={c.txt} onClick={() => enviar(c.msg)}
              className="rounded-full border bg-card px-3 py-1.5 text-sm hover:bg-muted active:scale-95 transition">
              {c.txt}
            </button>
          ))}
        </div>
        <div className="h-[min(60vh,460px)] rounded-2xl border bg-card overflow-hidden shadow-sm">
          <ChatPanel className="h-full" />
        </div>
      </div>

      {/* Qué falta + donar (lo único más, además del chat, sin login). */}
      <section className="max-w-2xl mx-auto mt-8">
        <div className="flex items-center justify-between mb-2">
          <h2 className="font-semibold">Necesidades ahora</h2>
          <Link href="/ofrecer" className="rounded-lg bg-primary text-primary-foreground px-3 py-1.5 text-sm font-medium">💜 Donar / Ofrecer ayuda</Link>
        </div>
        <div className="rounded-2xl border divide-y bg-card">
          {insumos.map((i) => (
            <div key={i.id} className="flex items-center justify-between gap-3 p-3 text-sm">
              <div className="min-w-0">
                <p className="font-medium truncate">{i.nombre}{i.cantidad ? ` · ${i.cantidad}${i.unidad ? " " + i.unidad : ""}` : ""}</p>
                {i.hospitales?.nombre && <p className="text-xs text-muted-foreground truncate">🏥 {i.hospitales.nombre}</p>}
              </div>
              <span className={`text-xs capitalize shrink-0 ${PRIO_CLS[i.prioridad] ?? ""}`}>{i.prioridad}</span>
            </div>
          ))}
          {insumos.length === 0 && <p className="p-4 text-sm text-muted-foreground">No hay solicitudes activas por ahora.</p>}
        </div>
      </section>

      <p className="max-w-2xl mx-auto mt-6 text-center text-sm text-muted-foreground">
        ¿Eres personal de salud, ONG o voluntario?{" "}
        <Link href="/login" className="text-primary underline font-medium">Inicia sesión</Link>{" "}para registrar personas, gestionar insumos y ver más.
      </p>
    </main>
  );
}
