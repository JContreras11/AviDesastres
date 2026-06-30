"use client";

import Link from "next/link";
import { ChatPanel } from "@/components/ChatPanel";
import { useChat } from "@/lib/chat-store";
import { Logo } from "@/components/Brand";

// Hero del chat de Avi (reutilizable): saludo + opciones rápidas + el panel.
// Para staff logueado, el ChatPanel incluye adjuntar/arrastrar archivos (una sola UI).
const CHIPS = [
  { txt: "🩹 ¿Qué insumos faltan?", msg: "¿Qué insumos faltan en los hospitales ahora?" },
  { txt: "🔎 Buscar a una persona", msg: "Quiero buscar a una persona. ¿Cómo lo hago?" },
  { txt: "📄 Cargar una lista", msg: "¿Cómo cargo una lista de pacientes o insumos?" },
  { txt: "❓ ¿Cómo funciona?", msg: "¿Cómo funciona AviHelp?" },
];

export function ChatHero({ subtitulo }: { subtitulo?: string }) {
  const { enviar } = useChat();
  return (
    <div className="max-w-2xl mx-auto w-full">
      <div className="flex flex-col items-center text-center mb-5">
        <Logo size={72} />
        <h1 className="mt-3 text-3xl font-bold tracking-tight bg-gradient-to-r from-primary to-[#5eead4] bg-clip-text text-transparent">Soy Avi</h1>
        <p className="text-muted-foreground mt-1 max-w-md">{subtitulo ?? "Pregúntame, busca, o arrastra una lista/foto y la entiendo. Estoy para ayudarte."}</p>
        <Link href="/ayuda" className="mt-2 text-sm font-medium text-primary hover:underline">¿Cómo funciona? Ver guía completa →</Link>
      </div>
      <div className="flex flex-wrap gap-2 justify-center mb-3">
        {CHIPS.map((c) => (
          <button key={c.txt} onClick={() => enviar(c.msg)}
            className="rounded-full border bg-card px-3 py-1.5 text-sm hover:bg-muted active:scale-95 transition">{c.txt}</button>
        ))}
      </div>
      <div className="h-[min(58vh,440px)] rounded-2xl border bg-card overflow-hidden shadow-sm">
        <ChatPanel className="h-full" />
      </div>
    </div>
  );
}
