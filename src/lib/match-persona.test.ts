// Run: npx tsx src/lib/match-persona.test.ts
import assert from "node:assert";
import { mismaPersona, nombresCompatibles, camposFaltantes, tokensNombre } from "./match-persona";

// El caso que pidió el usuario: "Juan Perez" == "Juan Alexander Perez Oropeza".
assert.ok(nombresCompatibles("Juan Perez", "Juan Alexander Perez Oropeza"), "subconjunto nombre");
assert.ok(!nombresCompatibles("Juan Perez", "Juan Gomez"), "distinto apellido");
assert.ok(!nombresCompatibles("Juan", "Juan Perez"), "1 token no basta");
assert.deepEqual(tokensNombre("José  Ramírez-Díaz"), ["jose", "ramirez", "diaz"], "acentos/puntuación");

// Misma persona corroborada por hospital (sin cédula en una).
assert.ok(mismaPersona(
  { nombre: "Juan Perez", hospital_id: "h1" },
  { nombre: "Juan Alexander Perez Oropeza", cedula: "V123", hospital_id: "h1" },
), "nombre compatible + mismo hospital");

// Mismo nombre pero NADA corrobora => no se asume misma persona.
assert.ok(!mismaPersona(
  { nombre: "Juan Perez", hospital_id: "h1" },
  { nombre: "Juan Alberto Perez Lara", hospital_id: "h2", sexo: "F" },
), "sin corroboración no une");

// Cédulas presentes y distintas => personas distintas aunque el nombre calce.
assert.ok(!mismaPersona(
  { nombre: "Juan Perez", cedula: "V1" },
  { nombre: "Juan Perez", cedula: "V2" },
), "cédulas distintas mandan");

// Corrobora por edad ±1 y por sexo real (no 'desconocido').
assert.ok(mismaPersona({ nombre: "Ana Lopez", edad: 30 }, { nombre: "Ana Maria Lopez Diaz", edad: 31 }), "edad ±1");
assert.ok(!mismaPersona({ nombre: "Ana Lopez", sexo: "desconocido" }, { nombre: "Ana Maria Lopez Diaz", sexo: "desconocido" }), "sexo desconocido no corrobora");

// camposFaltantes: rellena solo lo vacío, no pisa lo existente.
assert.deepEqual(
  camposFaltantes<Record<string, any>>({ nombre: "Ana", cedula: null, telefono: "0414" }, { nombre: "Ana Maria", cedula: "V9", telefono: "0212" }),
  { cedula: "V9" },
  "solo rellena cédula vacía; no pisa nombre ni teléfono",
);

console.log("ok");
