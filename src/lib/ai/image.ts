import { createAdminClient } from "@/lib/supabase/server";
import { leerExif, type ExifMeta } from "@/lib/exif";

export type ImagenProcesada = {
  dataUrl: string; // para enviar al LLM
  path: string; // ruta en Storage
  exif: ExifMeta;
};

// Lee un File, extrae EXIF, sube a Supabase Storage (bucket 'fotos') y devuelve data URL + path.
export async function procesarImagen(
  file: File,
  carpeta: string, // 'personas' | 'insumos'
): Promise<ImagenProcesada> {
  const buf = Buffer.from(await file.arrayBuffer());
  const exif = await leerExif(buf);

  const ext = (file.type.split("/")[1] ?? "jpg").replace("jpeg", "jpg");
  const path = `${carpeta}/${crypto.randomUUID()}.${ext}`;

  const supabase = createAdminClient();
  const { error } = await supabase.storage
    .from("fotos")
    .upload(path, buf, { contentType: file.type, upsert: false });
  if (error) throw new Error(`Storage: ${error.message}`);

  const dataUrl = `data:${file.type};base64,${buf.toString("base64")}`;
  return { dataUrl, path, exif };
}
