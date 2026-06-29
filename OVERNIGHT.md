# Overnight — orquestación de mejoras (rama `auto/overnight`)

Claude orquesta mejoras + pruebas mientras Jesús duerme. Cada cambio = 1 commit
(checkpoint reversible). **No toca `main` ni prod.** Jesús revisa y mergea en la mañana.

## Reglas duras (no romper)
- Trabajar SOLO en `auto/overnight`. Nunca push a `main`/prod, nunca deploy prod, nunca migración en Supabase PROD.
- Gate antes de cada commit: `pnpm build` OK + (si toca UI/runtime) smoke local OK. Si falla → `git checkout -- <archivos>` y registrar el intento fallido aquí.
- 1 commit por mejora atómica. Mensaje claro + Co-Authored-By. Tag `ckpt-N` cada 5 commits.
- **Prohibido** (trampas de freeze ya pagadas, ver memoria estado-mvp): reintroducir `@base-ui/react`, `@tanstack/react-table`, o service worker. No `router.refresh()` para datos (usar invalidateQueries).
- Mobile-first siempre. No añadir dependencias por algo que resuelven pocas líneas.
- Si un cambio es dudoso/grande → NO hacerlo autónomo; anotarlo en "Para revisar con Jesús".

## Gate
```
pnpm build && pnpm lint    # types/imports/lint — atrapa lo que rompe la app
```
Smoke de runtime: corre contra deploys reales (watcher prod). La rama no se
despliega, así que el gate local es build+lint + las reglas duras (que evitan
los freezes ya conocidos). Cambio dudoso de runtime → "Para revisar con Jesús".

## Procedimiento por ciclo
1. `git fetch origin main` — ver qué pushearon los otros 3 agentes (no mergear; solo contexto). Si hubo deploy prod nuevo, correr smoke prod (watcher).
2. Tomar la siguiente tarea del Backlog (orden de prioridad).
3. Implementar (subagente si es grande). Respetar reglas duras.
4. Gate. Pasa → commit (checkpoint) + log abajo. Falla → revertir + log.
5. Repetir hasta agotar tokens. Al reset de Claude, retomar desde el Backlog.

## Backlog (prioridad ↓)
Seguro/alto valor primero; lo invasivo al final y solo si el gate lo cubre.

- [ ] **Tests CRUD×rol** (instrumento en `e2e/`, no app): cubrir cada módulo (personas, insumos, hospitales, refugios/centros, ofertas, donaciones, notificaciones, usuarios) × CRUD × rol (admin/medico/voluntario/ong/publico) contra DEV, con fixtures que auto-siembran y limpian. Cada bug que cacen → fix gated.
- [ ] **Bugs/hardening**: errores de consola en todas las páginas, validaciones de formularios, estados de error que no pierdan datos.
- [ ] **UX/polish mobile-first**: empty states, loading states, a11y (aria-label en botones de icono, foco en diálogos), copy claro orientado a la emergencia.
- [ ] **Gaps MVP/spec**: completar ofertas→match→notificación; donaciones e2e; RLS en DB (SOLO dev, nunca prod auto).
- [ ] **Microtareas curiosas**: detalles que sumen al propósito (hospitales/refugios gestionan donaciones tras catástrofe).

## Bitácora de checkpoints
| commit | qué | gate |
|--------|-----|------|
| ee85247 | fix React #418 (saludo Avi determinista en SSR) | build ✅ |

## Para revisar con Jesús (no autónomo)
- (vacío)

## Hallazgos de pruebas
- #418 hydration en chat-home (entrada pública) — ARREGLADO (ee85247). Causa: `Math.random` en render (`chat-store.tsx`).

## FEATURES MUST-HAVE (Jesús, prioridad máxima — implementar en este worktree)
Orden: F2 (core) → F3 → F1. Cada una: rama propia o commits chicos en auto/overnight, gate `pnpm build`, checkpoint, sin romper smoke.

### F2 — Donación inteligente con Avi (CORE, lo más importante)
- Crear donación por **audio / foto / texto** reusando IA existente (`src/lib/ai/vision.ts`: analizarDocumento/analizarTexto/transcribirAudio) para extraer **productos + cantidades**.
- Soporta donación **MIXTA**: varios productos de distinta índole (comida vs insumos médicos), cantidad separada por producto.
- Avi **chatea mientras se crea**: recomienda dónde llevar, cómo organizar, y **MATCH** (lo más importante): si un producto coincide con una solicitud, recomienda el **centro/hospital** que lo necesita + el **ÁREA** (pediatría/traumatología/…) derivada de las solicitudes existentes. Ver `src/lib/ai/match.ts`, `actions/ofertas.ts`, `actions/donaciones.ts`.
- **Zona** desde geolocalización del navegador (ya se pide para Avi). Mostrar refugios/centros de acopio cercanos + necesidades de hospitales.
- **Usuario logueado: NO pedir nombre/teléfono** (ya se sabe quién es) → crear y relacionar directo. Fix `/ofrecer` (`src/app/ofrecer/page.tsx`): ocultar identidad si autenticado.
- **CRUD "mis donaciones"** del usuario.
- Cada donación **SIEMPRE ligada a centro de acopio o refugio** → genera **notificación encolada** a usuarios autorizados/admin (`actions/notificaciones`).

### F3 — Dashboard drill-down a personas del hospital
- En tabla "Hospitales — prioridad de atención" (`src/components/dashboard/Charts.tsx`), click en fila/críticos → ver **las personas de ese hospital**, con búsqueda y **edición de estado** (alta/fallecido/etc.) para administrar pacientes rápido.
- Reusar `listarPersonas` filtrado por hospital_id + `PersonaDialog`. Modal o lista filtrada. (Coordinar: claude-6 hace dashboard hardening EXCEPTO esta tabla.)

### F1 — "Mis Cargas" (galería de lo que subí)
- Ruta `/mis-cargas` (login). **Grid** de imágenes subidas por el usuario, **zoom al tocar** (`Img` + react-medium-image-zoom ya instalado).
- Al lado: info extraída de esa carga (insumos → insumos+hospital+info; lista personas → personas **editables**, poder añadir).
- Data: ligar cada carga (storage `fotos`) con el usuario + entidades extraídas. Revisar `documentos`/`raw_extraccion`; quizá columna `user_id`/tabla `cargas`. Migración SOLO dev.
