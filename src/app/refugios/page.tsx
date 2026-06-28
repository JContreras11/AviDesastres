import Link from "next/link";

export const metadata = { title: "Refugios — La Guaira | AviHelp" };

// Refugios oficiales en La Guaira (Vargas). Datos estáticos del comunicado.
// ponytail: lista hardcodeada; si crece o cambia seguido, mover a tabla `refugios` + CRUD.
type Refugio = { nombre: string; dir: string; parroquia: string; nota?: string };

const ESPECIALES: Refugio[] = [
  { nombre: "Refugio para abuelos y abuelas", nota: "Sin amparo familiar", dir: "UENB Santa Eduvigis, Bloque Unidos 1 y 2, Sector Aeropuerto", parroquia: "Urimare" },
  { nombre: "Refugio para niños y niñas", nota: "Sin amparo familiar", dir: "Urb. Armando Reverón, sector Guaracarumbo, edif. PDVAL", parroquia: "—" },
];

const REFUGIOS: Refugio[] = [
  { nombre: "Centro de Adiestramiento Naval Escuela de Grumetes", dir: "Av. La Páez", parroquia: "Catia La Mar" },
  { nombre: "UEN Juan Germán Roscio", dir: "Navarrete a Buena Vista", parroquia: "Maiquetía" },
  { nombre: "Liceo Armando Reverón", dir: "Urb. Guaracarumbo", parroquia: "Raúl Leoni" },
  { nombre: "Complejo Educativo República de Panamá", dir: "Avenida Soublette", parroquia: "La Guaira" },
  { nombre: "Liceo Nacional Lorenzo González", dir: "Distribuidor El Trébol, sector Simetaca", parroquia: "Carlos Soublette" },
  { nombre: "UEE La Guaira", dir: "Pachano a San Juan de Dios", parroquia: "La Guaira" },
  { nombre: "UENB 10 de Marzo", dir: "Prolongación 10 de Marzo, bloque 1", parroquia: "Carlos Soublette" },
  { nombre: "CEIS Manuelita Sáenz", dir: "Sector Marapa Marina", parroquia: "Catia La Mar" },
  { nombre: "Universidad Marítima del Caribe", dir: "Av. El Ejército", parroquia: "Catia La Mar" },
];

const q = (r: Refugio) => encodeURIComponent(`${r.nombre}, ${r.dir}, ${r.parroquia}, La Guaira, Venezuela`);
const verMapa = (r: Refugio) => `https://www.google.com/maps/search/?api=1&query=${q(r)}`;
const comoLlegar = (r: Refugio) => `https://www.google.com/maps/dir/?api=1&destination=${q(r)}`;

function Tarjeta({ r, destacado }: { r: Refugio; destacado?: boolean }) {
  return (
    <div className={`rounded-2xl border p-4 flex flex-col gap-2 ${destacado ? "border-primary/40 bg-primary/5" : "bg-card"}`}>
      <div>
        <p className="font-semibold leading-tight">{r.nombre}</p>
        {r.nota && <p className="text-xs text-amber-700 dark:text-amber-400 font-medium">{r.nota}</p>}
      </div>
      <p className="text-sm text-muted-foreground">📍 {r.dir}{r.parroquia !== "—" ? ` · Parroquia ${r.parroquia}` : ""}</p>
      <div className="flex gap-2 mt-1">
        <a href={verMapa(r)} target="_blank" rel="noreferrer"
          className="flex-1 text-center rounded-lg border px-3 py-2 text-sm font-medium hover:bg-muted active:scale-[0.98] transition">🗺️ Ver en mapa</a>
        <a href={comoLlegar(r)} target="_blank" rel="noreferrer"
          className="flex-1 text-center rounded-lg bg-primary text-primary-foreground px-3 py-2 text-sm font-medium hover:opacity-90 active:scale-[0.98] transition">🧭 Cómo llegar</a>
      </div>
    </div>
  );
}

export default function RefugiosPage() {
  return (
    <main className="flex-1 px-4 py-8 max-w-3xl mx-auto w-full">
      <Link href="/" className="text-sm text-muted-foreground hover:underline">← Inicio</Link>
      <h1 className="text-2xl font-bold mt-2 mb-1">Refugios en La Guaira</h1>
      <p className="text-sm text-muted-foreground mb-5">
        Ubicaciones donde se resguardan personas durante la emergencia. Usa “Cómo llegar” para coordinar la entrega de insumos.
      </p>

      {/* Mapa embebido de la zona (referencia geográfica). */}
      <div className="rounded-2xl overflow-hidden border mb-6 aspect-[16/10]">
        <iframe
          title="Mapa de La Guaira"
          src="https://www.google.com/maps?q=La+Guaira,+Vargas,+Venezuela&z=12&output=embed"
          className="w-full h-full" loading="lazy" referrerPolicy="no-referrer-when-downgrade"
        />
      </div>

      <section className="mb-6">
        <h2 className="text-sm font-semibold uppercase text-primary mb-2">Atención especial</h2>
        <div className="grid sm:grid-cols-2 gap-3">
          {ESPECIALES.map((r) => <Tarjeta key={r.nombre} r={r} destacado />)}
        </div>
      </section>

      <section>
        <h2 className="text-sm font-semibold uppercase text-muted-foreground mb-2">Refugios ({REFUGIOS.length})</h2>
        <div className="grid sm:grid-cols-2 gap-3">
          {REFUGIOS.map((r) => <Tarjeta key={r.nombre} r={r} />)}
        </div>
      </section>

      <p className="text-xs text-muted-foreground mt-6 border-t pt-3">
        Información de referencia para coordinar ayuda. Verifica disponibilidad y cupos con las autoridades del refugio antes de trasladar personas o insumos.
      </p>
    </main>
  );
}
