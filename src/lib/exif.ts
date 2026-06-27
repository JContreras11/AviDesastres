import exifr from "exifr";

export type ExifMeta = {
  gps_lat: number | null;
  gps_lng: number | null;
  foto_fecha: string | null; // ISO
};

// Extrae GPS y fecha de una imagen (Buffer/ArrayBuffer). Tolerante: si no hay EXIF, todo null.
export async function leerExif(buf: Buffer | ArrayBuffer): Promise<ExifMeta> {
  try {
    const data = await exifr.parse(buf as Buffer, { gps: true });
    if (!data) return { gps_lat: null, gps_lng: null, foto_fecha: null };
    const fecha = data.DateTimeOriginal ?? data.CreateDate ?? null;
    return {
      gps_lat: typeof data.latitude === "number" ? data.latitude : null,
      gps_lng: typeof data.longitude === "number" ? data.longitude : null,
      foto_fecha: fecha ? new Date(fecha).toISOString() : null,
    };
  } catch {
    return { gps_lat: null, gps_lng: null, foto_fecha: null };
  }
}
