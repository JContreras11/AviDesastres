"use client";

import { createContext, useContext, useEffect, useRef, useState } from "react";
import { preguntar, transcribirVoz } from "@/app/actions/chat";

export type Msg = { rol: "user" | "bot"; texto: string };
const SALUDO: Msg = { rol: "bot", texto: "¡Hola! Soy Avi 💜 Pregúntame por una persona o un insumo. Ej: «¿Tienen info de Juan Pérez visto en Petare?»" };
const KEY = "avihelp-chat";

type ChatCtx = {
  msgs: Msg[];
  cargando: boolean;
  grabando: boolean;
  enviar: (q: string) => Promise<void>;
  toggleMic: (onTexto: (t: string) => void) => Promise<void>;
  limpiar: () => void;
};
const Ctx = createContext<ChatCtx>({
  msgs: [SALUDO], cargando: false, grabando: false,
  enviar: async () => {}, toggleMic: async () => {}, limpiar: () => {},
});

// Una sola conversación compartida por la página /chat y el widget flotante.
// Vive en el layout (persiste al navegar) + localStorage (persiste al recargar).
export function ChatProvider({ children }: { children: React.ReactNode }) {
  const [msgs, setMsgs] = useState<Msg[]>([SALUDO]);
  const [cargando, setCargando] = useState(false);
  const [grabando, setGrabando] = useState(false);
  const rec = useRef<MediaRecorder | null>(null);
  const chunks = useRef<Blob[]>([]);

  useEffect(() => {
    try { const s = localStorage.getItem(KEY); if (s) { const m = JSON.parse(s); if (Array.isArray(m) && m.length) setMsgs(m); } } catch {}
  }, []);
  useEffect(() => {
    try { localStorage.setItem(KEY, JSON.stringify(msgs.slice(-50))); } catch {}
  }, [msgs]);

  async function enviar(qRaw: string) {
    const q = qRaw.trim();
    if (!q || cargando) return;
    setMsgs((m) => [...m, { rol: "user", texto: q }]);
    setCargando(true);
    try {
      const { respuesta } = await preguntar(q);
      setMsgs((m) => [...m, { rol: "bot", texto: respuesta }]);
    } catch {
      setMsgs((m) => [...m, { rol: "bot", texto: "Error consultando. Intenta de nuevo." }]);
    } finally {
      setCargando(false);
    }
  }

  async function toggleMic(onTexto: (t: string) => void) {
    if (grabando) { rec.current?.stop(); return; }
    if (!navigator.mediaDevices?.getUserMedia) return;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mime = MediaRecorder.isTypeSupported("audio/webm") ? "audio/webm"
        : MediaRecorder.isTypeSupported("audio/mp4") ? "audio/mp4" : "";
      const mr = new MediaRecorder(stream, mime ? { mimeType: mime } : undefined);
      chunks.current = [];
      mr.ondataavailable = (e) => { if (e.data.size) chunks.current.push(e.data); };
      mr.onstop = async () => {
        setGrabando(false);
        stream.getTracks().forEach((t) => t.stop());
        const blob = new Blob(chunks.current, { type: mr.mimeType });
        if (blob.size < 800) return;
        const fd = new FormData();
        fd.append("audio", blob, `audio.${(mr.mimeType.split("/")[1] ?? "webm").split(";")[0]}`);
        setCargando(true);
        try { const t = await transcribirVoz(fd); if (t.trim()) onTexto(t.trim()); } finally { setCargando(false); }
      };
      rec.current = mr;
      mr.start();
      setGrabando(true);
    } catch { /* permiso denegado */ }
  }

  const limpiar = () => setMsgs([SALUDO]);

  return <Ctx.Provider value={{ msgs, cargando, grabando, enviar, toggleMic, limpiar }}>{children}</Ctx.Provider>;
}

export const useChat = () => useContext(Ctx);
