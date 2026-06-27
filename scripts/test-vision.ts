// Prueba la extracción de visión contra una imagen real.
// Uso: pnpm dlx tsx --env-file=.env.local scripts/test-vision.ts personas|insumos <ruta_imagen>
import { readFileSync } from "node:fs";
import { extraerPersonas, extraerInsumos } from "../src/lib/ai/vision";
import { leerExif } from "../src/lib/exif";

const [, , modo, ruta] = process.argv;
if (!modo || !ruta) {
  console.error("Uso: tsx scripts/test-vision.ts personas|insumos <ruta_imagen>");
  process.exit(1);
}

const buf = readFileSync(ruta);
const mime = ruta.endsWith(".png") ? "image/png" : "image/jpeg";
const dataUrl = `data:${mime};base64,${buf.toString("base64")}`;

const exif = await leerExif(buf);
console.log("EXIF:", exif);

const res = modo === "insumos" ? await extraerInsumos(dataUrl) : await extraerPersonas(dataUrl);
console.log("RESULTADO:", JSON.stringify(res, null, 2));

if (!res.ok) {
  console.log("\n⚠️  Rechazado (pedir mejor foto):", res.motivo);
} else {
  console.log(`\n✅ confianza=${res.confianza} modelo=${res.modelo} items=${(res.data as any[]).length}`);
}
