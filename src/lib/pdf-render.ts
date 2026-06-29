// Renderiza un PDF a PNG por página EN EL NAVEGADOR (pdfjs tiene canvas/DOM nativos).
// Así el PDF se lee con el mismo flujo de imagen/visión (que ya funciona), sin parseo
// server-side ni problemas de texto colapsado/truncado en Vercel.
let workerListo = false;

export async function pdfAPaginasPNG(
  file: File,
  opts: { scale?: number; maxPaginas?: number } = {},
): Promise<File[]> {
  const pdfjs = await import("pdfjs-dist");
  if (!workerListo) {
    // Worker desde CDN por versión exacta (evita configurar el bundler).
    pdfjs.GlobalWorkerOptions.workerSrc = `https://cdn.jsdelivr.net/npm/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;
    workerListo = true;
  }
  const scale = opts.scale ?? 2;
  const maxPaginas = opts.maxPaginas ?? 15;

  const data = new Uint8Array(await file.arrayBuffer());
  const doc = await pdfjs.getDocument({ data }).promise;
  const base = file.name.replace(/\.pdf$/i, "");
  const total = Math.min(doc.numPages, maxPaginas);
  const out: File[] = [];

  for (let n = 1; n <= total; n++) {
    const page = await doc.getPage(n);
    const viewport = page.getViewport({ scale });
    const canvas = document.createElement("canvas");
    canvas.width = Math.ceil(viewport.width);
    canvas.height = Math.ceil(viewport.height);
    const ctx = canvas.getContext("2d");
    if (!ctx) continue;
    await page.render({ canvas, canvasContext: ctx, viewport } as any).promise;
    const blob: Blob | null = await new Promise((r) => canvas.toBlob((b) => r(b), "image/png"));
    if (blob) out.push(new File([blob], `${base}-p${n}.png`, { type: "image/png" }));
  }
  doc.cleanup();
  return out;
}
