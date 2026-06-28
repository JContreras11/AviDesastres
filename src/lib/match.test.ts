// Run: npx tsx src/lib/match.test.ts
import { match } from "./match";
import assert from "node:assert";

// Ejemplo exacto de FASE 3 (hermana):
// Necesidad: 12 Ketoprofeno, 10 Midazolam, 3 Norepinefrina (Pendiente)
// Donación: 10 Ketoprofeno, 1 Norepinefrina
const r = match(
  [{ item: "Ketoprofeno", cantidad: 12 }, { item: "Midazolam", cantidad: 10 }, { item: "Norepinefrina", cantidad: 3 }],
  [{ item: "Ketoprofeno", cantidad: 10 }, { item: "Norepinefrina", cantidad: 1 }],
);

assert.deepEqual(r.enCamino, [
  { item: "Ketoprofeno", cantidad: 10 },
  { item: "Norepinefrina", cantidad: 1 },
], "En Camino esperado");

assert.deepEqual(r.pendiente, [
  { item: "Ketoprofeno", cantidad: 2 },
  { item: "Midazolam", cantidad: 10 },
  { item: "Norepinefrina", cantidad: 2 },
], "Pendiente (remanente) esperado");

// Donación parcial no elimina lo que falta; donación de más se capa a lo solicitado.
const r2 = match([{ item: "Agua", cantidad: 5 }], [{ item: "Agua", cantidad: 99 }]);
assert.deepEqual(r2.enCamino, [{ item: "Agua", cantidad: 5 }]);
assert.deepEqual(r2.pendiente, []);

console.log("ok");
