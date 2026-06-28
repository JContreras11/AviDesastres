// Algoritmo de "Match" Necesidad ↔ Donación (FASE 3).
// Reparte cada Necesidad entre lo que ya viene "En Camino" (donado) y el remanente "Pendiente".
// Remanente = cantidad_solicitada − cantidad_donada (sin bajar de 0, sin eliminar lo que falta).

export type ItemCant = { item: string; cantidad: number };

export function match(necesidad: ItemCant[], donacion: ItemCant[]): { enCamino: ItemCant[]; pendiente: ItemCant[] } {
  // Suma donaciones por item (puede haber varias por el mismo medicamento).
  const donado = new Map<string, number>();
  for (const d of donacion) donado.set(d.item, (donado.get(d.item) ?? 0) + d.cantidad);

  const enCamino: ItemCant[] = [];
  const pendiente: ItemCant[] = [];
  for (const n of necesidad) {
    const cubre = Math.min(donado.get(n.item) ?? 0, n.cantidad); // no se dona más de lo que se necesita
    if (cubre > 0) enCamino.push({ item: n.item, cantidad: cubre });
    const remanente = n.cantidad - cubre;
    if (remanente > 0) pendiente.push({ item: n.item, cantidad: remanente }); // sigue visible para otros donantes
  }
  return { enCamino, pendiente };
}
