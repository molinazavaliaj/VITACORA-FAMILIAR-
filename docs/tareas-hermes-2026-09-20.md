# Tareas para hermes — 20/09/2026

Contexto mínimo: repo `VITACORA-FAMILIAR-` (main). Tres piezas: `web/` (Next.js, panel
y landing), `fabrica/` (Node/TS, escribe el libro y arma el audiolibro; tests `cd
fabrica && npx vitest run`, hoy 242 en verde, `npx tsc --noEmit -p .` limpio), `voz/`
(worker Python en otra PC; NO tocar). Contrato de datos: `supabase/CONTRATO.md`.
Estilo: código y comentarios en castellano rioplatense, como el que ya existe; test
primero. Cada tarea en su rama, commits en castellano, sin push a main: dejá la rama
subida (`git push -u origin <rama>`) y anotá acá abajo, en "Entregas", rama + commits
+ resultado de tests. La central revisa y mergea.

**No tocar** (lo está cambiando otro agente en `fabrica-narracion-v2`):
`fabrica/src/libro/generar-paquete.ts`, `fabrica/src/voz/narracion-json.ts`,
`fabrica/src/voz/conectores.ts`, sus tests, ni `voz/`.

---

## T1 · fábrica · medir el costo real por libro (`costos.json`)
Hoy el costo por libro se estima en `GASTOS.md`. Que se mida. Cada llamada a
Anthropic en la fábrica devuelve `usage` (`input_tokens`, `output_tokens`,
`cache_creation_input_tokens`, `cache_read_input_tokens`). Hacé un módulo
`fabrica/src/costos.ts` con:
- `registrarUso(db, narradorId, { modelo, paso, usage })` → agrega una fila a
  `{narradorId}/paquete/costos.json` en el bucket `audios` (bajar si existe con
  `descargarTextoOpcional`, agregar, subir con `subirTexto` — están en
  `src/libro/comun.ts`). Cada fila: `{ fecha, modelo, paso, input, output,
  cache_write, cache_read, usd }`. Precios en una tabla en el mismo módulo
  (`claude-fable-5`: 10/50 USD por millón in/out, cache write 12,5, cache read 1;
  `claude-opus-5`: 5/25; `claude-haiku-4-5`: 1/5). Un fallo al registrar se loguea
  con `console.warn` y NO frena nada.
- `resumen(costos)` → total USD y por paso.
Enganchalo (sin cambiar comportamiento) en: `escribir-capitulo.ts` (paso
`capitulo`), `comun.ts` `editarLibro` (paso `editor`), `estructura.ts` (paso
`estructura`), `parrafo-anticipo.ts` (paso `anticipo`), `previsualizar.ts` si llama
al modelo (paso `preview`). Cada uno recibe hoy el `mensajeFinal` del stream: ahí
está `usage`. Necesitás `narradorId` y `db` en esos puntos: mirá qué reciben y
agregá el mínimo; donde no haya `db` a mano usá `obtenerClienteDb()` de `src/db.ts`.
Tests: `costos.test.ts` (cálculo de USD por modelo, acumulación, `resumen`, fallo de
Storage no tira). Los tests existentes tienen que seguir verdes (mockeá Storage
como hacen `fotos.test.ts` / `ensamblar.test.ts`).
Al final, un script `fabrica/scripts/costos.ts` (`npx tsx scripts/costos.ts
<narradorId>`) que imprime el resumen de un libro.

## T2 · fábrica · la previsualización usa la foto de tapa elegida
`fabrica/src/libro/previsualizar.ts` pone `narrador.foto_url` como retrato; el libro
final (`generar-paquete.ts`) usa `edicion.portadaFotoId` con `fotos.porId` y su
`foco` (ver `cargarFotos` en `src/libro/fotos.ts` y `leerEdicion` en `edicion.ts`).
Que la previsualización haga lo mismo: si la dueña eligió foto de tapa, esa (data
URI) con `object-position` desde `foco`; si no, el retrato como hoy. Test en
`previsualizar.test.ts` con el patrón de mocks que ya tiene.

## T3 · web · `AudiolibroPaths.completo` opcional
Desde el 19/09 la fábrica NO sube `audiolibro_completo.mp3` cuando pasa los 50 MB
(`pedidos.audiolibro_paths` viene sin `completo`). La UI ya lo tolera
(`web/src/app/tablero/[narradorId]/leer/page.tsx` usa `?.completo`), pero el tipo
dice `completo: string` en `web/src/lib/pedido-a-mostrar.ts` y en `leer/page.tsx`.
Pasalo a `completo?: string` en los dos, y revisá con `npx tsc --noEmit` en `web/`
que nada más lo asuma. Si `web/` tiene tests, que sigan verdes.

## T4 · docs · `ESTADO.md` al día
Actualizá `ESTADO.md` (raíz) con lo que cambió del 18 al 20/09, leyendo
`docs/piloto-bitacora-errores.md` (hallazgos 32–37), `GASTOS.md`, `supabase/CONTRATO.md`
(secciones "Audiolibro con voz clonada — regla de voz única" y "Dónde va y cómo se
encuadra la foto") y `voz/README.md` (secciones "Buzón" y masterizar). Puntos que
tienen que quedar: un solo proyecto de Railway (`fearless-kindness`, cuenta de
Joaquín; el viejo se borró el 18/09); la fábrica lee logs por API con
`fabrica/scripts/railway-logs.py` (token de proyecto en `fabrica/.env`, el CLI está
bloqueado por Windows en la PC de Naza); el audiolibro de Joaquín entregado el 19/09
con voz clonada (referencia día 02) y sin intro TTS; regla "en el clonado no suena
otra voz"; mp3 completo opcional (tope 50 MB); el buzón `central/` ↔ `pruebas/` con la
PC de música; masterizado/restauración/ritmo en el worker; decisión del 20/09: el
audiolibro clonado pasa a ser híbrido (voz real restaurada + conectores clonados),
en implementación. No inventes fechas ni números: si algo no está en esos archivos,
no lo escribas.

---

## Entregas (las completa hermes)
- T1:
- T2:
- T3:
- T4:

### Pase de manos 20/09 (`docs/handoff-2026-09-20.md`) — puntos 2 y 3

- **Punto 2 · script de la prueba híbrida.** Rama `fabrica-script-narracion-v2` (subida, sin
  mergear): `827054c`. Archivos: `fabrica/scripts/narracion-v2.ts` y
  `fabrica/test/narracion-v2.test.ts` (los dos nuevos; mocks como `generar-paquete.test.ts`).
  Tests: `cd fabrica && npx vitest run` → **307 pasan** (18 nuevos) y `npx tsc --noEmit -p
  tsconfig.json` limpio (el script, que el tsconfig no incluye, también typechea solo con las
  mismas opciones). Uso: `npx tsx scripts/narracion-v2.ts <narradorId> <pedidoId> [--solo-json
  [--salida <ruta>]] [--cachear-conectores]`. No se tocó `voz/` ni los archivos de
  `fabrica-narracion-v2`, y no se corrió contra ninguna base.
  Ojo, bloqueo real para la prueba de Joaquín: su pedido (`3284c93c-…`) ya tiene la narración
  de la entrega del 19/09 en estado `lista`, y el worker solo toma `pendiente` (además
  `crearNarracion` es idempotente). El script se planta y **no** deja el pedido en
  `esperando_voz` — si lo dejara, la fábrica ensamblaría esa voz vieja como si fuera la nueva.
  Antes de correrlo en serio hay que decidir desde la central cómo se pide la fila nueva.
- **Punto 3 · bitácora del piloto, hallazgos 38 y 39.** Rama
  `docs-bitacora-hallazgos-38-39` (subida, sin mergear): `51e70cc`,
  `docs/piloto-bitacora-errores.md` (+33 líneas, nada más). No hay tests para docs: el control
  fue que cada fecha, número y commit salga de `GASTOS.md`, `ESTADO.md` y los commits
  (`ee3d255`/`dc7fe8d`, `854cb93`, `c80e5ce`, `3d29d66`), sin inventar nada.
