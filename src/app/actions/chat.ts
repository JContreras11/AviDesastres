"use server";

import OpenAI from "openai";
import { createAdminClient } from "@/lib/supabase/server";
import { transcribirAudio } from "@/lib/ai/vision";
import { buscarExterno } from "@/app/actions/externos";

// Transcribe audio del micrófono a texto (para hablarle al chat).
export async function transcribirVoz(formData: FormData): Promise<string> {
  const file = formData.get("audio");
  if (!(file instanceof File) || file.size === 0) return "";
  const buf = Buffer.from(await file.arrayBuffer());
  const fmt = (file.type.split("/")[1] ?? "webm").split(";")[0].replace("x-", "").replace("mpeg", "mp3");
  try { return (await transcribirAudio(buf.toString("base64"), fmt)).trim(); } catch { return ""; }
}

const client = new OpenAI({
  apiKey: process.env.OPENROUTER_API_KEY,
  baseURL: "https://openrouter.ai/api/v1",
  defaultHeaders: { "HTTP-Referer": "https://avihelp.app", "X-Title": "AviHelp" },
});
const MODEL = process.env.OPENROUTER_VISION_MODEL ?? "google/gemini-2.5-flash-lite";

// Guía de la plataforma: Avi la usa para explicar CÓMO usar AviHelp y guiar con enlaces internos.
const GUIA = `GUÍA DE AVIHELP (úsala para explicar cómo usar la plataforma; los enlaces que empiezan con "/" son páginas internas: escríbelos tal cual para que el usuario haga clic e ir ahí):
- Qué es: plataforma gratuita que conecta a la gente en la emergencia: buscar personas, ver necesidades de hospitales y refugios, y donar.
- DONAR / OFRECER AYUDA: cualquiera, con o sin cuenta, entra a /ofrecer y registra insumos físicos (ej. 50 férulas) o se ofrece como personal de salud. La IA sugiere a qué hospital enviarlo y un coordinador lo confirma.
- DONAR A UNA NECESIDAD PUNTUAL (ONG/centro con cuenta): en Inicio, pestaña "Insumos", abre el insumo y usa "Donar (en camino)"; indica la cantidad y se concilia con lo pendiente.
- VER NECESIDADES: en Inicio, pestaña "Insumos" están los insumos que piden los hospitales. Cada hospital tiene una página para difundir con QR en /compartir/hospital/ID.
- BUSCAR PERSONA: pregúntame el nombre o la cédula; también /desaparecidos lista a los reportados como desaparecidos.
- REFUGIOS: /refugios. PANEL de situación: /dashboard.
- PERSONAL DE CENTRO DE SALUD: abre un insumo y actualiza su estatus (Pendiente → En tránsito → Recibido).
- COORDINADOR / personal que gestiona donaciones: la bandeja de emparejamientos sugeridos por IA está en /admin/triage; ahí aprueba o rechaza.
Cuando expliques cómo hacer algo, da pasos cortos e incluye el enlace interno (ej. /ofrecer).`;

// Chatbot RAG sobre datos estructurados: parsea -> consulta Postgres -> redacta.
export async function preguntar(pregunta: string): Promise<{ respuesta: string; fuentes: any[]; externos?: any[]; enlaces?: { titulo: string; url: string }[] }> {
  if (!pregunta?.trim()) return { respuesta: "Hazme una pregunta.", fuentes: [] };

  // 1) Extraer filtros de búsqueda de la pregunta.
  const f = await client.chat.completions.create({
    model: MODEL,
    messages: [
      {
        role: "system",
        content:
          "Extrae filtros de búsqueda de la pregunta del usuario sobre una base de personas e insumos en una emergencia. " +
          'Responde SOLO JSON: {"entidad":"personas|insumos","nombre":string|null,"ubicacion":string|null,' +
          '"estado":"vivo|herido|desaparecido|fallecido"|null,"insumo":string|null}',
      },
      { role: "user", content: pregunta },
    ],
    response_format: { type: "json_object" },
    temperature: 0,
  });
  let filtros: any = {};
  try { filtros = JSON.parse(f.choices[0]?.message?.content ?? "{}"); } catch {}

  // 2) Consultar la base.
  const supabase = createAdminClient();
  let fuentes: any[] = [];
  if (filtros.entidad === "insumos") {
    let q = supabase.from("insumos").select("*, hospitales(nombre)").limit(15);
    if (filtros.insumo) q = q.ilike("nombre", `%${filtros.insumo}%`);
    fuentes = (await q).data ?? [];
  } else {
    let q = supabase.from("personas").select("nombre,cedula,edad,sexo,ubicacion,estado_salud,descripcion_fisica,telefono_contacto,notas").limit(15);
    if (filtros.nombre) q = q.ilike("nombre", `%${filtros.nombre}%`);
    if (filtros.ubicacion) q = q.ilike("ubicacion", `%${filtros.ubicacion}%`);
    if (filtros.estado) q = q.eq("estado_salud", filtros.estado);
    fuentes = (await q).data ?? [];
  }

  // 2b) Búsqueda de texto completo sobre TODO lo ingresado (personas, insumos,
  // hospitales, notas/texto libre) — encuentra lo que el filtro estructurado no.
  let docs: any[] = [];
  try {
    const { data } = await supabase.rpc("buscar_documentos", { q: pregunta, match_count: 10 });
    docs = data ?? [];
  } catch {}

  // 2c) Si buscan una PERSONA y no la tenemos local -> consultar fuentes externas en vivo
  // (hospitales públicos / desaparecidos) y ofrecer enlaces de referencia clicables.
  let externo: { resultados: any[]; enlaces: { titulo: string; url: string }[] } = { resultados: [], enlaces: [] };
  if (filtros.entidad !== "insumos" && fuentes.length === 0) {
    externo = await buscarExterno(filtros.nombre || pregunta);
  }

  // 3) Redactar respuesta con el contexto recuperado.
  const r = await client.chat.completions.create({
    model: MODEL,
    messages: [
      {
        role: "system",
        content:
          "Eres Avi, la asistente de AviHelp en una emergencia humanitaria. Cálida pero concisa. Responde en español. " +
          "DOS tipos de pregunta: (A) CÓMO USAR la plataforma (donar, ofrecer, reportar, compartir, dónde hacer algo) → respóndela con la GUÍA: pasos cortos e incluye el enlace interno (ej. /ofrecer) tal cual para que el usuario haga clic. " +
          "(B) DATOS de personas/insumos → usa SOLO los registros/textos/fuentes provistos; incluye estado, ubicación y teléfono si existen; NO inventes datos. " +
          "Si buscan una persona y no hay registros locales pero sí externos, preséntalos indicando la fuente e invita a confirmar; escribe los 'Enlaces' como URLs completas al final. " +
          "Si es duda de uso y no aplica buscar datos, ignora que los registros estén vacíos y guía con la GUÍA.\n\n" + GUIA,
      },
      { role: "user", content:
        `Pregunta: ${pregunta}\n\nRegistros locales (JSON):\n${JSON.stringify(fuentes)}\n\nTextos relacionados:\n${docs.map((d) => `- ${d.contenido}`).join("\n")}` +
        `\n\nResultados de fuentes externas (JSON):\n${JSON.stringify(externo.resultados)}\n\nEnlaces de referencia:\n${externo.enlaces.map((e) => `- ${e.titulo}: ${e.url}`).join("\n")}` },
    ],
    temperature: 0.2,
  });

  return { respuesta: r.choices[0]?.message?.content ?? "Sin respuesta.", fuentes, externos: externo.resultados, enlaces: externo.enlaces };
}
