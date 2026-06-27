import { procesarDocumento } from "@/app/actions/procesar";

// POST multipart { imagen, gps_lat?, gps_lng? } -> procesa y registra.
// Útil para la cola de sincronización offline (Fase 5) y para pruebas.
export async function POST(req: Request) {
  const fd = await req.formData();
  const res = await procesarDocumento(fd);
  return Response.json(res, { status: res.ok ? 200 : 422 });
}
