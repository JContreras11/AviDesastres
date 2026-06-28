// Resolución de identidad de personas: decidir si dos registros (de listas distintas,
// con datos incompletos) son la MISMA persona. "Juan Perez" puede ser "Juan Alexander
// Perez Oropeza". Si hay cédula manda la cédula; si falta, nombre compatible + al menos
// otro atributo que corrobore (hospital/sexo/edad/ubicación). Puro: sin DB, testeable.

export type PersonaLike = {
  nombre?: string | null;
  cedula?: string | null;
  edad?: number | null;
  sexo?: string | null;
  ubicacion?: string | null;
  hospital_id?: string | null;
};

export function normCedula(c?: string | null): string | null {
  if (!c) return null;
  const n = c.replace(/[^0-9a-zA-Z]/g, "").toUpperCase();
  return n || null;
}

// Tokens del nombre sin acentos ni puntuación (descarta partículas de 1 letra).
export function tokensNombre(nombre?: string | null): string[] {
  return (nombre ?? "")
    .normalize("NFD").replace(/[̀-ͯ]/g, "")
    .toLowerCase().replace(/[^a-z\s]/g, " ")
    .split(/\s+/).filter((t) => t.length > 1);
}

// El nombre más corto está contenido en el más largo y comparten >=2 tokens
// (típicamente nombre + apellido). Evita unir a cualquier "Juan".
export function nombresCompatibles(a?: string | null, b?: string | null): boolean {
  const ta = tokensNombre(a), tb = tokensNombre(b);
  if (!ta.length || !tb.length) return false;
  const [corto, largo] = ta.length <= tb.length ? [ta, tb] : [tb, ta];
  const setL = new Set(largo);
  const comunes = corto.filter((t) => setL.has(t)).length;
  return comunes === corto.length && comunes >= 2;
}

function sexoReal(s?: string | null) {
  return s && s !== "desconocido" ? s : null;
}

// ¿Misma persona? Cédula en ambas => decide la cédula. Si falta en alguna,
// exige nombre compatible + corroboración por otro atributo (no une por nombre solo).
export function mismaPersona(a: PersonaLike, b: PersonaLike): boolean {
  const ca = normCedula(a.cedula), cb = normCedula(b.cedula);
  if (ca && cb) return ca === cb;
  if (!nombresCompatibles(a.nombre, b.nombre)) return false;
  const sa = sexoReal(a.sexo), sb = sexoReal(b.sexo);
  const ua = tokensNombre(a.ubicacion), ub = tokensNombre(b.ubicacion);
  return Boolean(
    (a.hospital_id && a.hospital_id === b.hospital_id) ||
    (sa && sb && sa === sb) ||
    (a.edad != null && b.edad != null && Math.abs(a.edad - b.edad) <= 1) ||
    (ua.length && ub.length && ua.some((t) => ub.includes(t))),
  );
}

// Rellena SOLO los campos vacíos del existente con los del nuevo. No pisa datos buenos:
// si una lista nueva trae menos info, no borra lo que ya teníamos.
export function camposFaltantes<T extends Record<string, any>>(existente: T, nuevo: Partial<T>): Partial<T> {
  const parche: Record<string, any> = {};
  for (const k in nuevo) {
    const viejo = existente[k], val = nuevo[k];
    const vacio = viejo == null || viejo === "" || (Array.isArray(viejo) && viejo.length === 0);
    if (vacio && val != null && val !== "") parche[k] = val;
  }
  return parche as Partial<T>;
}
