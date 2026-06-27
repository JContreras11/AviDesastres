// Prueba el analizador universal contra una imagen real.
// Uso: pnpm dlx tsx --env-file=.env.local scripts/test-vision.ts <ruta_imagen>
import { readFileSync } from "node:fs";
import { analizarDocumento } from "../src/lib/ai/vision";
import { leerExif } from "../src/lib/exif";

const ruta = process.argv[2];
if (!ruta) {
  console.error("Uso: tsx scripts/test-vision.ts <ruta_imagen>");
  process.exit(1);
}

async function main() {
  const buf = readFileSync(ruta);
  const mime = ruta.endsWith(".png") ? "image/png" : "image/jpeg";
  const dataUrl = `data:${mime};base64,${buf.toString("base64")}`;

  const exif = await leerExif(buf);
  const res = await analizarDocumento(dataUrl);

  if (!res.ok) {
    console.log(`⚠️  Rechazado: ${res.motivo}`);
    return;
  }
  const d = res.data;
  console.log(`✅ tipo=${d.tipo} confianza=${res.confianza} modelo=${res.modelo}`);
  console.log(`   contexto: ${d.contexto}`);
  if (d.hospital) console.log(`   hospital: ${JSON.stringify(d.hospital)}`);
  console.log(`   personas: ${d.personas.length}  insumos: ${d.insumos.length}`);
  console.log(`   EXIF: ${JSON.stringify(exif)}`);
  console.log(JSON.stringify(d, null, 2).slice(0, 2000));
}
main().catch((e) => { console.error(e); process.exit(1); });
