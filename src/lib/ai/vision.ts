import OpenAI from "openai";

// Cliente OpenRouter (API compatible OpenAI).
const client = new OpenAI({
  apiKey: process.env.OPENROUTER_API_KEY,
  baseURL: "https://openrouter.ai/api/v1",
  defaultHeaders: {
    "HTTP-Referer": "https://avihelp.app",
    "X-Title": "AviHelp",
  },
});

// Modelo barato por defecto; escala a uno más preciso si la confianza es baja.
const MODEL = process.env.OPENROUTER_VISION_MODEL ?? "google/gemini-2.5-flash-lite";
const MODEL_ESCALADO = process.env.OPENROUTER_VISION_MODEL_HQ ?? "google/gemini-2.5-flash";
const UMBRAL_CONFIANZA = 0.5; // por debajo => pedir mejor foto

export type ResultadoExtraccion<T> =
  | { ok: true; data: T; confianza: number; modelo: string }
  | { ok: false; motivo: string }; // imagen ilegible / borrosa

const PROMPT_PERSONAS =
  "Eres un asistente de emergencias. Extrae TODAS las personas de la imagen (cédula de identidad, " +
  "lista de pacientes escrita a mano, o cartel de desaparecidos). NO inventes datos: si un campo no " +
  "es legible, devuélvelo null. Si la imagen está borrosa o no se puede leer con seguridad, marca " +
  "legible=false y explica en motivo_ilegible. confianza (0..1) = qué tan seguro estás de lo leído.\n" +
  'Responde SOLO JSON: {"legible":bool,"confianza":number,"motivo_ilegible":string|null,' +
  '"personas":[{"nombre":string|null,"cedula":string|null,"edad":int|null,' +
  '"sexo":"M"|"F"|"O"|"desconocido"|null,"ubicacion":string|null,' +
  '"estado_salud":"vivo"|"herido"|"desaparecido"|"detenido"|"fallecido"|"desconocido"|null,' +
  '"descripcion_fisica":string|null}]}';

const PROMPT_INSUMOS =
  "Eres un asistente de logística médica. Digitaliza EXACTAMENTE la lista de insumos médicos de la " +
  "imagen (suele estar escrita a mano y pegada en una pared de hospital). NO inventes ni completes " +
  "items que no estén. Si no es legible, legible=false con motivo_ilegible.\n" +
  'Responde SOLO JSON: {"legible":bool,"confianza":number,"motivo_ilegible":string|null,' +
  '"insumos":[{"nombre":string,"cantidad":number|null,"unidad":string|null,' +
  '"prioridad":"baja"|"media"|"alta"|"critica"|null}]}';

async function llamar(
  imagenDataUrl: string,
  prompt: string,
  modelo: string,
): Promise<{ raw: any; legible: boolean; confianza: number; motivo?: string }> {
  const res = await client.chat.completions.create({
    model: modelo,
    messages: [
      { role: "system", content: prompt },
      {
        role: "user",
        content: [
          { type: "text", text: "Procesa esta imagen." },
          { type: "image_url", image_url: { url: imagenDataUrl } },
        ],
      },
    ],
    response_format: { type: "json_object" },
    temperature: 0,
  });
  let parsed: any = {};
  try {
    parsed = JSON.parse(res.choices[0]?.message?.content ?? "{}");
  } catch {
    return { raw: {}, legible: false, confianza: 0, motivo: "Respuesta IA no parseable." };
  }
  return {
    raw: parsed,
    legible: parsed.legible !== false,
    confianza: typeof parsed.confianza === "number" ? parsed.confianza : 0,
    motivo: parsed.motivo_ilegible ?? undefined,
  };
}

// Extrae con modelo barato; si confianza < umbral y aún legible, reintenta una vez con modelo HQ.
async function extraer<T>(
  imagenDataUrl: string,
  prompt: string,
  pick: (raw: any) => T,
): Promise<ResultadoExtraccion<T>> {
  let modelo = MODEL;
  let r = await llamar(imagenDataUrl, prompt, modelo);

  if (r.legible && r.confianza < UMBRAL_CONFIANZA) {
    modelo = MODEL_ESCALADO; // segunda opinión más precisa
    r = await llamar(imagenDataUrl, prompt, modelo);
  }
  if (!r.legible || r.confianza < UMBRAL_CONFIANZA) {
    return {
      ok: false,
      motivo: r.motivo ?? "Por favor, sube una imagen más clara.",
    };
  }
  return { ok: true, data: pick(r.raw), confianza: r.confianza, modelo };
}

export type PersonaExtraida = {
  nombre: string | null;
  cedula: string | null;
  edad: number | null;
  sexo: string | null;
  ubicacion: string | null;
  estado_salud: string | null;
  descripcion_fisica: string | null;
};
export type InsumoExtraido = {
  nombre: string;
  cantidad: number | null;
  unidad: string | null;
  prioridad: string | null;
};

export function extraerPersonas(imagenDataUrl: string) {
  return extraer<PersonaExtraida[]>(imagenDataUrl, PROMPT_PERSONAS, (raw) => raw.personas ?? []);
}

export function extraerInsumos(imagenDataUrl: string) {
  return extraer<InsumoExtraido[]>(imagenDataUrl, PROMPT_INSUMOS, (raw) => raw.insumos ?? []);
}
