# Voz clonada — plan 2: buzón `narraciones`, worker en la PC y fábrica

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Que un pedido con `audiolibro: "clonada"` termine en un audiolibro narrado con la voz del narrador, sin que nadie toque nada: la fábrica deja el pedido en el buzón, la PC de Naza lo narra, la fábrica lo arma y avisa.

**Architecture:** Tres procesos que solo se hablan por Supabase (regla de la casa: un escritor por columna). La **fábrica** (Railway, TS) inserta la fila en `narraciones` y deja el pedido `esperando_voz`; el **worker de voz** (PC de Naza, Python, `voz/`) sondea `narraciones`, verifica permiso y piso de 10 min, narra capítulo por capítulo reutilizando `motores/<motor>/generar.py` por subprocess (el motor ganador va en `.env`), sube los mp3 y marca `lista`; la fábrica ensambla (intro con la voz del entrevistador + cuerpo clonado), entrega y manda el mail. Avisos a los socios si algo se atasca.

**Tech Stack:** Supabase (migración SQL + `CONTRATO.md`), Python 3.11 + `supabase` + ffmpeg (worker), Node/TS + vitest (fábrica), Next.js (un toque a la web).

Spec: `docs/superpowers/specs/2026-09-16-voz-clonada-design.md`. Plan 1 (hecho, en `main`): `docs/superpowers/plans/2026-09-16-voz-prueba-de-oido.md` — dejó `voz/voz/{muestras,texto,audio,supabase_cliente,transcribir,preparar_muestras,prueba_oido}.py` y `voz/motores/{comun.py,<motor>/generar.py}`. Este plan los reutiliza; no los reescribe.

## Global Constraints

- **Cambio de esquema → `supabase/CONTRATO.md` primero y acordado con Joaquín** antes de aplicar la migración en producción. Un solo escritor por columna (tabla de "quién escribe qué" del spec).
- **Nunca** se clona sin `narradores.consentimiento_voz_at` ni con menos de 600 s limpios: `fallida` con motivo, no excepción.
- El worker vive en `C:\vitacora-voz\` y `D:\vitacora-modelos\`, sin puertos ni túneles; todo lo que hace es ir a buscar a Supabase y subir a Storage.
- Reanudación: cada capítulo subido queda; un reinicio sigue desde el primer capítulo que falta. Reintentar nunca vuelve a pagar ni a regenerar lo que ya está.
- Identificadores sin tildes; textos de persona (logs, mails) con tildes. Repo CRLF. Los secretos en `.env`/Railway, nunca en el repo.
- La intro de cada capítulo ("Capítulo 3: El amor") sigue con la voz del entrevistador (OpenAI TTS, `fabrica/src/audio/tts.ts`); el cuerpo va con la voz clonada.
- El motor de voz es configuración (`MOTOR=` en `voz/.env`); hasta que la prueba de oído lo elija, se desarrolla y prueba con el motor falso de `voz/tests/test_prueba_oido_humo.py`.
- Nada se declara verificado sin la salida del comando pegada. Tests nuevos tienen que fallar contra el código viejo antes de pasar.

---

## Estructura de archivos

```
supabase/migrations/20260917000000_narraciones.sql     tabla + consentimiento_voz_at + estado esperando_voz
supabase/CONTRATO.md                                   sección nueva "Narraciones (voz clonada)"

voz/voz/buzon.py            tomar_pendiente(), marcar(), retomar_colgadas(), narracion_por_id()   (escrituras del worker)
voz/voz/libro.py            capitulos_de_narracion(json) -> [Capitulo(numero, nombre, texto)]     (puro)
voz/voz/narrar.py           narrar_capitulos(...) con reanudación; llama a motores/<m>/generar.py por subprocess
voz/voz/worker.py           el bucle: cada 30 s, permiso → muestras → narrar → lista | fallida; log en logs/worker.log
voz/voz/reintentar.py       CLI: pone una narración en pendiente
voz/tests/test_buzon.py, test_libro.py, test_narrar.py, test_worker.py   (con fakes de Supabase y el motor falso)
voz/README.md               sección "El worker" + tarea programada

fabrica/src/libro/productos.ts           productosDelPedido() — el mismo contrato que web/src/lib/productos.ts:193-201
fabrica/src/voz/narracion-json.ts        armarNarracionJson(estructuraFinal, borradoresPorCapitulo) -> {capitulos:[{numero,nombre,texto}]}
fabrica/src/voz/narraciones.ts           crearNarracion(), narracionesListas(), narracionesAtascadas()
fabrica/src/voz/ensamblar.ts             ensamblarAudiolibroClonado(): intro TTS + cuerpo → paquete/audiolibro_cap_NN.mp3 + completo
fabrica/src/mail/socios.ts               avisarSocios(asunto, cuerpo) a MAIL_SOCIOS (por defecto hola@vitacorafamiliar.com)
fabrica/src/libro/generar-paquete.ts     MODIFICAR: leer extras; si clonada → narracion.json + crearNarracion + esperando_voz
fabrica/src/worker.ts                    MODIFICAR: tick suma ensamblarNarracionesListas() y avisarNarracionesAtascadas()
fabrica/src/reintentar-narracion.ts      CLI `npm run narracion -- reintentar <id>`
fabrica/test/productos.test.ts, narracion-json.test.ts, narraciones.test.ts, ensamblar.test.ts, worker.test.ts (ampliar)

web/src/app/tablero/[narradorId]/libro/page.tsx:28-34   NOMBRE_ESTADO_PEDIDO suma esperando_voz
web/src/app/tablero/[narradorId]/leer/page.tsx:62       enFabricacion incluye esperando_voz
web/src/lib/pedido-a-mostrar.ts                         (sin cambios: esperando_voz no es entregado)
```

Contrato de `{narrador}/paquete/narracion.json` (lo escribe la fábrica, lo lee el worker):
```json
{"narrador_id": "...", "pedido_id": "...", "titulo": "...",
 "capitulos": [{"numero": 1, "nombre": "La infancia", "texto": "Texto plano del capítulo, párrafos separados por línea en blanco."}]}
```
Salida del worker en Storage: `{narrador}/voz/cap_NN.mp3` (cuerpo narrado, sin intro, mp3 128k mono 24 kHz), en el orden de `capitulos`.

---

### Task 1: migración + CONTRATO

**Files:** Create `supabase/migrations/20260917000000_narraciones.sql`; Modify `supabase/CONTRATO.md` (sección nueva al final, antes de "El guion por narrador" o donde encaje).

- [ ] **Step 1: la migración** (copiar tal cual; el `check` de `pedidos.estado` se reemplaza entero porque la lista vive en `20260901000000_esquema_inicial.sql:69` y no se puede "agregar" un valor a un check):

```sql
-- Voz clonada (spec 2026-09-16-voz-clonada-design.md): el buzón entre la
-- fábrica (Railway) y el worker de voz (PC de Naza). Un escritor por columna:
-- la fábrica crea la fila; el worker escribe estado/motor/muestras/paths/error.
--
-- ⚠️ Toca supabase/CONTRATO.md → lo acuerdan los dos socios antes de aplicarla.

create table if not exists narraciones (
  id uuid primary key default gen_random_uuid(),
  narrador_id uuid not null references narradores (id),
  pedido_id uuid not null references pedidos (id),
  estado text not null default 'pendiente'
    check (estado in ('pendiente', 'procesando', 'lista', 'fallida')),
  motor text,                           -- el worker anota cuál usó ('chatterbox', 'qwen3tts', 'f5tts', 'omnivoice')
  muestras jsonb,                       -- qué respuestas usó y cuántos segundos limpios juntó
  capitulos_paths jsonb,                -- ["{narrador}/voz/cap_01.mp3", ...] en el orden de narracion.json
  error text,                           -- 'sin_consentimiento_voz' | 'faltan_minutos_de_voz: NNN s' | traceback resumido
  tomada_at timestamptz,                -- cuándo pasó a procesando (para detectar cuelgues)
  created_at timestamptz not null default now(),
  actualizada_at timestamptz not null default now()
);
create index if not exists narraciones_estado on narraciones (estado, created_at);

-- El narrador dijo que sí a que su voz se clone (va en el primer SÍ de la
-- bienvenida; lo escribe el entrevistador). Sin fecha, el worker no clona.
alter table narradores add column if not exists consentimiento_voz_at timestamptz;

-- Un pedido con audiolibro clonado espera a la PC: 'esperando_voz'.
alter table pedidos drop constraint if exists pedidos_estado_check;
alter table pedidos add constraint pedidos_estado_check
  check (estado in ('pendiente', 'pagado', 'generando', 'esperando_voz', 'entregado', 'fallido'));
```

- [ ] **Step 2: CONTRATO.md** — sección "Narraciones (voz clonada)" con: la tabla de quién escribe qué (copiar la del spec), el contrato de `narracion.json`, las rutas `{narrador}/voz/cap_NN.mp3`, el estado `esperando_voz`, `consentimiento_voz_at` (lo escribe el entrevistador al pasar a `acepto`; en el piloto, `npm run manual -- ficha <narrador> --voz-si`), y la regla "sin consentimiento o sin 600 s limpios → `fallida`".
- [ ] **Step 3:** commit `supabase: buzón narraciones + consentimiento_voz_at + esperando_voz (contrato para Joaquín)`. **No aplicar en producción hasta que Joaquín lo lea** — anotarlo en el mensaje del PR/commit.

---

### Task 2: `productosDelPedido` en la fábrica + `narracion.json`

**Files:** Create `fabrica/src/libro/productos.ts`, `fabrica/src/voz/narracion-json.ts`; Test `fabrica/test/productos.test.ts`, `fabrica/test/narracion-json.test.ts`.

**Interfaces (Produces):**
```ts
// productos.ts — copiar la lógica de web/src/lib/productos.ts:193-201 (mismo contrato, misma regla para pedidos viejos)
export type Voz = 'clonada' | 'narrador' | 'real';
export type ProductosDelPedido = { pdf: boolean; audiolibro: Voz | null; impreso: 'bn' | 'color' | null; copias: number; marcos: number };
export function productosDelPedido(extras: unknown): ProductosDelPedido;

// narracion-json.ts
export type CapituloNarracion = { numero: number; nombre: string; texto: string };
export type NarracionJson = { narrador_id: string; pedido_id: string; titulo: string; capitulos: CapituloNarracion[] };
export function armarNarracionJson(args: { narradorId: string; pedidoId: string; titulo: string; capitulos: { nombre: string; markdown: string }[] }): NarracionJson;
export function markdownATextoPlano(markdown: string): string;   // saca '#', '*', '_', imágenes, epígrafes; párrafos = línea en blanco
```

- [ ] **Step 1: tests que fallan**

```ts
// productos.test.ts
import { describe, it, expect } from 'vitest';
import { productosDelPedido } from '../src/libro/productos.js';
describe('productosDelPedido', () => {
  it('pedido viejo sin clave pdf = pdf + audiolibro real', () => {
    expect(productosDelPedido({ impreso: null, marcos: 0 })).toEqual({ pdf: true, audiolibro: 'real', impreso: null, copias: 0, marcos: 0 });
  });
  it('clonada se lee tal cual', () => {
    expect(productosDelPedido({ pdf: true, audiolibro: 'clonada', impreso: 'bn', copias: 2, marcos: 1 }).audiolibro).toBe('clonada');
  });
  it('un valor raro de audiolibro es null', () => {
    expect(productosDelPedido({ pdf: false, audiolibro: 'lo que sea' }).audiolibro).toBeNull();
  });
});

// narracion-json.test.ts
import { describe, it, expect } from 'vitest';
import { armarNarracionJson, markdownATextoPlano } from '../src/voz/narracion-json.js';
describe('markdownATextoPlano', () => {
  it('saca títulos, énfasis e imágenes y conserva los párrafos', () => {
    const md = '# La infancia\n\nNací en **Rosario**, en _1950_.\n\n![foto](x.jpg)\n*La casa del patio.*\n\nMi padre era ferroviario.';
    expect(markdownATextoPlano(md)).toBe('Nací en Rosario, en 1950.\n\nMi padre era ferroviario.');
  });
});
describe('armarNarracionJson', () => {
  it('numera los capítulos en orden y deja el texto plano', () => {
    const j = armarNarracionJson({ narradorId: 'n', pedidoId: 'p', titulo: 'T', capitulos: [{ nombre: 'Uno', markdown: '# Uno\n\nHola.' }, { nombre: 'Dos', markdown: 'Chau.' }] });
    expect(j.capitulos).toEqual([{ numero: 1, nombre: 'Uno', texto: 'Hola.' }, { numero: 2, nombre: 'Dos', texto: 'Chau.' }]);
  });
});
```

- [ ] **Step 2:** `cd fabrica && npx vitest run test/productos.test.ts test/narracion-json.test.ts` → falla (módulos inexistentes).
- [ ] **Step 3: implementar.** `productos.ts` = copia fiel de la función de la web (y un comentario: "misma regla que web/src/lib/productos.ts; si cambia una, cambia la otra"). `markdownATextoPlano`: quitar líneas que empiezan con `#`, líneas `![...](...)`, líneas enteras en cursiva `*...*` o `_..._` (epígrafes), quitar `**`, `*`, `_` de énfasis, colapsar 3+ saltos en 2, `trim`.
- [ ] **Step 4:** verde. **Step 5:** commit `fábrica: productosDelPedido y narracion.json para el worker de voz`.

---

### Task 3: la fábrica deja el pedido en el buzón

**Files:** Create `fabrica/src/voz/narraciones.ts`; Modify `fabrica/src/libro/generar-paquete.ts` (después de subir HTML/PDF y **antes** de `generarAudiolibro`); Test `fabrica/test/narraciones.test.ts`, ampliar `fabrica/test/generar-paquete.test.ts`.

**Interfaces (Produces):**
```ts
// narraciones.ts
export const RUTA_NARRACION_JSON = (narradorId: string) => `${narradorId}/paquete/narracion.json`;
export async function crearNarracion(db, args: { narradorId: string; pedidoId: string }): Promise<string>;  // devuelve el id; idempotente: si ya hay una no-fallida para ese pedido, devuelve esa
export async function narracionesListas(db): Promise<{ id: string; narrador_id: string; pedido_id: string; capitulos_paths: string[] }[]>;  // estado lista cuyo pedido está esperando_voz
export async function narracionesAtascadas(db, ahora: Date): Promise<{ id: string; narrador_id: string; motivo: 'pendiente_24h' | 'procesando_6h' | 'fallida'; error: string | null }[]>;
```

- [ ] **Step 1: tests** con el fake de admin de `fabrica/test/generar-paquete.test.ts` (mismo patrón: cola de resultados por tabla, registro de inserts/updates):
  - `crearNarracion` inserta `{narrador_id, pedido_id, estado: 'pendiente'}` y devuelve el id; si ya existe una `pendiente|procesando|lista` para ese `pedido_id`, no inserta.
  - `narracionesAtascadas`: una `pendiente` creada hace 25 h → `pendiente_24h`; una `procesando` con `tomada_at` hace 7 h → `procesando_6h`; una `fallida` → `fallida`; una `pendiente` de hace 1 h → nada.
  - `generarPaquete` con `extras.audiolibro = 'clonada'`: sube `narracion.json`, llama `crearNarracion`, deja el pedido en `esperando_voz` con `libro_pdf_path` cargado y **sin** `audiolibro_paths`, **no** llama a `generarAudiolibro`, y **no** borra los borradores (los necesita `narracion.json`? no: ya está escrito; sí se pueden borrar. Decidir: se borran igual, `narracion.json` es la fuente del worker).
  - `generarPaquete` con `extras` viejo (`{}`) o `'real'`: exactamente como hoy (los tests existentes siguen verdes).
- [ ] **Step 2:** fallan. **Step 3: implementar.** En `generarPaquete`, después de `generarPdf`: leer el pedido (`extras`) → `productosDelPedido`. Si `audiolibro === 'clonada'`: `armarNarracionJson` con `estructuraFinal.capitulos` y los borradores por capítulo (ya están en memoria en ese punto: es lo que se escribió en `borrador_cap_NN.md`); `subirTexto(RUTA_NARRACION_JSON)`; `crearNarracion`; update pedido `{estado: 'esperando_voz', libro_pdf_path}`; return (sin audiolibro). Si no: flujo actual.
- [ ] **Step 4:** `npx vitest run` verde. **Step 5:** commit `fábrica: un pedido clonada deja narracion.json y queda esperando_voz`.

---

### Task 4: el worker — buzón y libro (Python, puro + fakes)

**Files:** Create `voz/voz/buzon.py`, `voz/voz/libro.py`; Test `voz/tests/test_buzon.py`, `voz/tests/test_libro.py`.

**Interfaces (Produces):**
```python
# buzon.py
@dataclass(frozen=True)
class Narracion:
    id: str; narrador_id: str; pedido_id: str; estado: str
    capitulos_paths: list[str]; tomada_at: str | None; error: str | None

def tomar_pendiente(sb) -> Narracion | None
    # update narraciones set estado='procesando', tomada_at=now() where id = (select id ... estado='pendiente' order by created_at limit 1) returning *
    # con supabase-py: select 1 pendiente → update().eq('id').eq('estado','pendiente') → si devuelve fila, es nuestra
def retomar_colgadas(sb, horas: float = 6.0) -> int          # procesando con tomada_at viejo → pendiente (las retoma el mismo bucle)
def marcar(sb, id: str, estado: str, **campos) -> None      # actualizada_at=now() siempre
def consentimiento_de(sb, narrador_id: str) -> str | None   # narradores.consentimiento_voz_at

# libro.py (puro)
@dataclass(frozen=True)
class Capitulo: numero: int; nombre: str; texto: str
def capitulos_de_narracion(texto_json: str) -> list[Capitulo]   # valida numero 1..N contiguos y texto no vacío; error claro si no
def ruta_capitulo(narrador_id: str, numero: int) -> str          # f"{narrador_id}/voz/cap_{numero:02d}.mp3"
```

- [ ] **Step 1: tests.** `test_libro.py`: parsea el json del contrato; rechaza capítulos sin texto o numeración con huecos. `test_buzon.py`: con un fake mínimo de `sb` (objeto con `.table(nombre)` que devuelve un builder encadenable que registra `update/eq/select/execute` y devuelve datos precargados): `tomar_pendiente` devuelve None sin pendientes; devuelve la Narracion y registra el update condicional; `retomar_colgadas` solo toca `tomada_at < ahora - horas`.
- [ ] **Step 2:** fallan. **Step 3:** implementar. **Step 4:** `python -m pytest -q` verde. **Step 5:** commit `voz: buzón narraciones y lectura de narracion.json`.

---

### Task 5: el worker — narrar con reanudación

**Files:** Create `voz/voz/narrar.py`; Test `voz/tests/test_narrar.py` (usa el motor falso: extraer el fixture `motor_falso` de `test_prueba_oido_humo.py` a `voz/tests/conftest.py`).

**Interfaces (Produces):**
```python
def preparar_voz(sb, narrador_id: str, carpeta: Path) -> tuple[Path, Path, dict]
    # reutiliza voz.preparar_muestras: devuelve (referencia.wav, referencia.txt, resumen_muestras)
    # levanta FaltanMinutos(segundos) si < PISO_SEGUNDOS
class FaltanMinutos(Exception): ...

def narrar_capitulos(sb, narracion: Narracion, capitulos: list[Capitulo], motor: str,
                     referencia: Path, referencia_texto: Path, carpeta: Path, modelos: Path,
                     ya_subidos: list[str], log) -> list[str]
    # para cada capítulo en orden: si ruta_capitulo ya está en ya_subidos → saltar;
    # escribir carpeta/cap_NN.txt con el texto; subprocess motores/<motor>/generar.py (mismo comando que prueba_oido.generar_con);
    # a_mp3 → subir a Storage (upsert) → marcar(sb, id, 'procesando', capitulos_paths=acumulado)  ← reanudación
    # devuelve la lista completa de rutas
```

- [ ] **Step 1: tests.** Con el motor falso y un fake de Storage (dict en memoria con `upload`/`download`): narra 3 capítulos y sube 3 mp3; si `ya_subidos` trae el 1 y el 2, solo genera el 3 (contar llamadas al subprocess: 1); `preparar_voz` con respuestas que suman 300 s → `FaltanMinutos`.
- [ ] **Step 2:** fallan. **Step 3:** implementar (factorizar `generar_con` de `prueba_oido.py` a una función común `correr_motor_subprocess(motor, referencia, referencia_texto, texto, salida, modelos)` en `voz/voz/motor_subprocess.py`, y que `prueba_oido.py` la use también). **Step 4:** verde. **Step 5:** commit `voz: narrar capítulo por capítulo con reanudación`.

---

### Task 6: el worker — el bucle

**Files:** Create `voz/voz/worker.py`, `voz/voz/reintentar.py`; Test `voz/tests/test_worker.py`; Modify `voz/README.md`, `voz/.env.ejemplo` (`MOTOR=`, `INTERVALO_SEGUNDOS=30`).

`worker.py`:
```python
def procesar_una(sb, config, log) -> bool:      # True si tomó algo
    retomar_colgadas(sb)
    n = tomar_pendiente(sb)
    if n is None: return False
    try:
        if consentimiento_de(sb, n.narrador_id) is None:
            marcar(sb, n.id, 'fallida', error='sin_consentimiento_voz', motor=config.motor); return True
        texto_json = descargar_texto(sb, RUTA_NARRACION_JSON)   # {narrador}/paquete/narracion.json
        capitulos = capitulos_de_narracion(texto_json)
        referencia, referencia_texto, resumen = preparar_voz(sb, n.narrador_id, carpeta)
        rutas = narrar_capitulos(..., ya_subidos=n.capitulos_paths, ...)
        marcar(sb, n.id, 'lista', capitulos_paths=rutas, muestras=resumen, motor=config.motor)
    except FaltanMinutos as e:
        marcar(sb, n.id, 'fallida', error=f'faltan_minutos_de_voz: {e.segundos:.0f} s', motor=config.motor)
    except Exception as e:
        marcar(sb, n.id, 'fallida', error=resumen_traceback(e), motor=config.motor)
    return True

def main():  # bucle: log a logs/worker.log (RotatingFileHandler) + consola; "esperando…" cada 10 vueltas sin trabajo; Ctrl+C limpio
```
`reintentar.py`: `python -m voz.reintentar <id>` → `marcar(sb, id, 'pendiente', error=None)`.

- [ ] **Step 1: tests** de `procesar_una` con fakes: sin pendientes → False; sin consentimiento → `fallida` con `sin_consentimiento_voz` y **no** se llama al motor; camino feliz con motor falso → `lista` con 3 rutas; excepción del motor → `fallida` con el error y el worker no muere.
- [ ] **Step 2:** fallan. **Step 3:** implementar. **Step 4:** verde. **Step 5:** README: sección "El worker" (instalar el venv del motor ganador, `MOTOR=` en `.env`, correr a mano `python -m voz.worker`, la tarea programada):

```powershell
Register-ScheduledTask -TaskName 'VitacoraVoz' -Trigger (New-ScheduledTaskTrigger -AtLogOn) `
  -Action (New-ScheduledTaskAction -Execute 'C:\vitacora-voz\repo\voz\.venv\Scripts\python.exe' -Argument '-m voz.worker' -WorkingDirectory 'C:\vitacora-voz\repo\voz') `
  -Settings (New-ScheduledTaskSettingsSet -RestartCount 3 -RestartInterval (New-TimeSpan -Minutes 1) -ExecutionTimeLimit ([TimeSpan]::Zero))
```
- [ ] Commit `voz: el worker que sondea el buzón`.

---

### Task 7: la fábrica ensambla, entrega y avisa

**Files:** Create `fabrica/src/voz/ensamblar.ts`, `fabrica/src/mail/socios.ts`, `fabrica/src/reintentar-narracion.ts`; Modify `fabrica/src/worker.ts` (tick), `fabrica/package.json` (script `narracion`); Test `fabrica/test/ensamblar.test.ts`, ampliar `fabrica/test/worker.test.ts`.

**Interfaces:**
```ts
// ensamblar.ts
export async function ensamblarAudiolibroClonado(db, args: { narradorId: string; pedidoId: string; capitulosPaths: string[]; estructura: EstructuraCapitulos }): Promise<{ capitulos: string[]; completo: string }>
  // por capítulo: intro TTS (generarAudioTts(`Capítulo N: nombre`)) + cuerpo (descargar capitulosPaths[i]) → concatenarMp3s → subir paquete/audiolibro_cap_NN.mp3; luego completo. Reutiliza normalizarAMp3/concatenarMp3s de audio/ffmpeg.ts.
// socios.ts
export async function avisarSocios(asunto: string, cuerpoHtml: string): Promise<boolean>   // Resend a MAIL_SOCIOS (env, default hola@vitacorafamiliar.com); false si falta la clave
// worker.ts
export async function ensamblarNarracionesListas(): Promise<void>   // narracionesListas → ensamblar → pedido {estado:'entregado', audiolibro_paths}; si falla, log y sigue (la narración queda lista; se reintenta el próximo tick)
export async function avisarNarracionesAtascadas(): Promise<void>   // narracionesAtascadas → un mail por (narración, motivo) con candado en Storage `{narrador}/paquete/aviso_narracion_{id}_{motivo}.txt`
```

- [ ] **Step 1: tests.** `ensamblar.test.ts` (mock de `generarAudioTts`, `descargarAudio`, ffmpeg): 2 capítulos → 2 uploads de capítulo + 1 completo, en orden. `worker.test.ts`: con una narración `lista` y pedido `esperando_voz` → llama a ensamblar y deja `entregado` con `audiolibro_paths`; luego `avisarLibrosListos` manda `libro_listo` (ya existe). Atascadas: `pendiente_24h` → un mail, y la segunda vez (candado) ninguno.
- [ ] **Step 2:** fallan. **Step 3:** implementar; en `tick()` agregar `await ensamblarNarracionesListas(); await avisarNarracionesAtascadas();` después de `procesarPedidosPagados()`. Texto del mail a los socios, llano: "La narración de {como_le_dicen} lleva más de 24 h sin tomarse: ¿está prendida la PC de voz?" / "…se colgó (6 h procesando)" / "…falló: {error}. Para reintentar: npm run narracion -- reintentar {id}".
- [ ] **Step 4:** `npx vitest run` verde. **Step 5:** commit `fábrica: ensambla el audiolibro clonado, entrega y avisa si el buzón se atasca`.

---

### Task 8: la web muestra "armando el audiolibro"

**Files:** Modify `web/src/app/tablero/[narradorId]/libro/page.tsx:28-34`, `web/src/app/tablero/[narradorId]/leer/page.tsx:62`.

- [ ] `NOMBRE_ESTADO_PEDIDO.esperando_voz = "armando el audiolibro con su voz"`; `enFabricacion` incluye `manda.estado === "esperando_voz"`. `npm test` + `npm run build` verdes. Commit `web: el pedido esperando_voz se ve como en producción`. (Este push deploya solo: el workflow corre en cambios de `web/`.)

---

### Task 9: entrevistador (Joaquín) — texto + consentimiento

**Files:** `entrevistador/src/manual/puro.ts` (bienvenida), `entrevistador/src/flujo/procesar.ts:120` (al pasar a `acepto`, también `consentimiento_voz_at: new Date().toISOString()`), comando `manual -- ficha <narrador> --voz-si`.

- [ ] Es de Joaquín (3t.15). Dejarle en el CONTRATO y en un mensaje: la frase de la bienvenida tiene que decir que el audiolibro puede llevar su propia voz hecha a partir de estos audios y que el SÍ incluye eso (texto lo aprueban los dos socios). Para el piloto, cargar la fecha a mano.

---

### Task 10: prueba completa y cierre

- [ ] Joaquín aplica la migración (o Naza por el dashboard) después de leer el CONTRATO.
- [ ] Deploy de la fábrica (Railway toma `main`) y de la web (automático).
- [ ] En la PC: `MOTOR=<ganador>` en `.env`, `python -m voz.worker` a mano primero (ver el log), después la tarea programada.
- [ ] Punta a punta con Joaquín: `consentimiento_voz_at` cargado a mano; un pedido `clonada` (o cambiar `extras` de un pedido de prueba); la fábrica deja `esperando_voz`; el worker narra; la fábrica entrega; el panel reproduce. Pegar el log del worker y el `audiolibro_paths` del pedido.
- [ ] ROADMAP 3t.14: voz clonada ✅ con fecha; memoria actualizada.
