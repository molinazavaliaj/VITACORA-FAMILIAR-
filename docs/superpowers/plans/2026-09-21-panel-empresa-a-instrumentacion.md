# Panel de la empresa — Parte A: la instrumentación (Implementation Plan)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** que cada llamada a un modelo deje una fila en `consumo_ia`, que cada worker deje su latido y que exista la tabla donde Naza carga los gastos que no pasan por una API — así el panel (Parte B) tiene de dónde leer.

**Architecture:** tres tablas nuevas en Supabase (sólo agregar: nadie actualiza ni borra), un módulo `costos.ts` gemelo del de la fábrica que inserta una fila por llamada, y un `latido.ts` en el entrevistador y en la fábrica más una función `latir()` en el worker de voz. Todo el código nuevo es **tolerante a la migración no aplicada**: si la tabla no existe o el insert falla, se avisa por `console.warn` y el flujo sigue como si nada — la misma regla que ya está escrita en `fabrica/src/costos.ts`.

**Tech Stack:** TypeScript (tsx + vitest) en `entrevistador/` y `fabrica/`, Python 3 (pytest) en `voz/`, Supabase (PostgREST + SQL Editor), SDK de Anthropic, `fetch` para OpenAI.

**Spec:** `docs/superpowers/specs/2026-09-21-panel-de-la-empresa-design.md`

**Rama:** `panel-de-la-empresa` (ya creada; el spec y el mockup están commiteados ahí).

## Global Constraints

- Castellano rioplatense en comentarios y mensajes (es la voz del repo).
- **La migración la aplica Naza en el SQL Editor**, nunca desde el shell (los `.env` no traen connection string, a propósito). El código tiene que andar **sin** la migración aplicada.
- **Anotar el costo nunca frena al narrador**: si el insert falla, `console.warn` y se sigue. Nunca `throw`.
- No se cambian firmas existentes: se suman **parámetros opcionales al final** o un campo más en un objeto de opciones (así las llamadas posicionales de Joaquín siguen compilando).
- Un escritor por tabla (`supabase/CONTRATO.md`); estas tres tablas las escribe cada servicio por su cuenta y nadie más.
- Tests: `npx vitest run` dentro de `entrevistador/` y `fabrica/`; typecheck `npx tsc --noEmit -p tsconfig.json` en cada carpeta; en `voz/`, `./.venv/Scripts/python -m pytest -q` (el python del sistema no tiene pytest).
- `npm install` en `entrevistador/` reescribe `package-lock.json`: si pasa, `git checkout -- entrevistador/package-lock.json` antes de commitear.
- No se toca `main` y no se commitean `.agents/` ni `skills-lock.json`.
- Los mocks de Supabase se hacen **en el borde** (el cliente), nunca sobre una función interna del módulo que se está probando.

## Review Focus

Los cinco casos que el spec implica y que ningún test de tarea cubre solo:

1. **La migración sin aplicar** (tabla ausente): el flujo del narrador sigue igual. Cada tarea que escribe lleva su test con el insert devolviendo `42P01`.
2. **Una respuesta del modelo sin `usage`** (o un mock sin tokens): no se inserta nada, no se rompe.
3. **Un modelo sin precio cargado**: `usd = 0` con aviso, pero **los tokens igual quedan anotados** (para poder recalcular cuando aparezca el precio).
4. **Supabase lento o caído justo cuando el narrador manda el audio**: el insert del gasto no puede demorar la respuesta del día ni tumbarla.
5. **La PC de música sin red**: el worker no se cae por no poder latir (late cuando puede).

---

### Tarea 1: las tres tablas y el contrato

**Files:**
- Create: `supabase/migrations/20260921000100_panel_empresa.sql`
- Modify: `supabase/CONTRATO.md` (sección nueva al final, después de "Narraciones")
- Test: la verificación es contra la base (receta abajo), no un test unitario.

**Interfaces:**
- Consumes: nada.
- Produces: las tablas `consumo_ia`, `latidos` y `gastos_manuales`, con las columnas exactas que usan las tareas 2 a 5 y la Parte B.

- [ ] **Paso 1: escribir la migración**

```sql
-- Panel de la empresa (diseño: docs/superpowers/specs/2026-09-21-panel-de-la-empresa-design.md).
--
-- Tres tablas nuevas, todas de sólo agregar: nadie actualiza ni borra.
--   1. consumo_ia       una fila por llamada al modelo — de acá sale el gasto del día.
--   2. latidos          si cada worker está vivo (una fila por servicio, se pisa).
--   3. gastos_manuales  lo que NO pasa por una API (lo carga Naza desde /admin).
--
-- Sin políticas de RLS a propósito: con RLS prendido y sin policy, sólo la
-- service role lee y escribe. Es exactamente lo que queremos: /admin usa la
-- service role del lado del servidor y ningún navegador toca estas tablas.
--
-- ⚠️ Toca supabase/CONTRATO.md. La aplica Naza en el SQL Editor.

create table if not exists consumo_ia (
  id            uuid primary key default gen_random_uuid(),
  fecha         timestamptz not null default now(),
  servicio      text not null check (servicio in ('entrevistador', 'fabrica', 'voz')),
  paso          text not null,
  modelo        text not null,
  proveedor     text not null check (proveedor in ('anthropic', 'openai', 'local')),
  cuenta        text,                    -- quién paga la key: naza | joaquin | local
  narrador_id   uuid references narradores (id) on delete set null,
  input_tokens  int not null default 0,
  output_tokens int not null default 0,
  cache_write   int not null default 0,
  cache_read    int not null default 0,
  cantidad      numeric,                 -- lo que se cobra por unidad (segundos, caracteres)
  unidad        text check (unidad in ('segundos', 'caracteres')),
  usd           numeric(12,6) not null default 0
);
create index if not exists consumo_ia_fecha_idx on consumo_ia (fecha desc);
create index if not exists consumo_ia_narrador_idx on consumo_ia (narrador_id);
alter table consumo_ia enable row level security;

create table if not exists latidos (
  servicio     text primary key check (servicio in ('entrevistador', 'fabrica', 'voz')),
  ultimo_ping  timestamptz not null default now(),
  detalle      jsonb
);
alter table latidos enable row level security;

create table if not exists gastos_manuales (
  id         uuid primary key default gen_random_uuid(),
  fecha      date not null default current_date,
  concepto   text not null,
  monto      numeric(10,2) not null,
  moneda     text not null default 'EUR' check (moneda in ('EUR', 'USD', 'ARS')),
  categoria  text not null default 'otro' check (categoria in ('suscripcion', 'api', 'imprenta', 'otro')),
  quien      text,                       -- a quién le corresponde
  creado_at  timestamptz not null default now()
);
create index if not exists gastos_manuales_fecha_idx on gastos_manuales (fecha desc);
alter table gastos_manuales enable row level security;
```

- [ ] **Paso 2: verificar que NO está aplicada (antes)**

Las migraciones las aplica Naza, así que la prueba es pedir la tabla por PostgREST. Leé `SUPABASE_URL` y
`SUPABASE_SERVICE_ROLE_KEY` de `fabrica/.env` **sin imprimir los valores** (receta: `references/buzon-recetas.md`
de la skill `vitacora-familiar-ops`) y consultá:

```bash
curl -s -o /dev/null -w "%{http_code}\n" "$SUPABASE_URL/rest/v1/consumo_ia?select=id&limit=1" \
  -H "apikey: $KEY" -H "Authorization: Bearer $KEY"
```

Expected: `404` (tabla ausente; el cuerpo trae `"code":"42P01"`). **Esto no es un error de la consulta: es la
respuesta.** Guardá el código para repetirlo en el Paso 5.

- [ ] **Paso 3: pedirle a Naza que la aplique**

Pegale el SQL completo del Paso 1 y el pedido de que lo corra en el SQL Editor de Supabase. El archivo queda
commiteado igual (es la costumbre del repo: la migración vive en el repo y la aplica ella).

- [ ] **Paso 4: escribir la sección del contrato**

Agregá al final de `supabase/CONTRATO.md`:

```markdown
## Panel de la empresa (21/09) — tres tablas nuevas, todas de sólo agregar

| Tabla | Escribe | Lee | Nota |
|---|---|---|---|
| `consumo_ia` | entrevistador, fábrica, worker de voz (insert) | `/admin` | Una fila por llamada al modelo. Nadie hace update ni delete. |
| `latidos` | los tres workers (upsert por `servicio`) | `/admin` | Si un servicio deja de latir, `/admin` lo muestra en rojo. |
| `gastos_manuales` | `/admin` (es la ÚNICA escritura del panel) | `/admin` | Lo que no pasa por una API: suscripciones, recargas, imprenta. |

Las tres tienen RLS prendido y **sin políticas**: sólo la service role las toca (el navegador nunca). Si la
migración no está aplicada, el producto sigue andando: los servicios avisan por consola y no anotan nada.
```

- [ ] **Paso 5: verificar que quedó aplicada (después)**

Repetí el `curl` del Paso 2 con la tabla nueva y la columna nueva:

```bash
curl -s -o /dev/null -w "%{http_code}\n" "$SUPABASE_URL/rest/v1/consumo_ia?select=id,usd,cantidad,unidad&limit=1" -H "apikey: $KEY" -H "Authorization: Bearer $KEY"
curl -s -o /dev/null -w "%{http_code}\n" "$SUPABASE_URL/rest/v1/gastos_manuales?select=id,moneda,categoria&limit=1" -H "apikey: $KEY" -H "Authorization: Bearer $KEY"
```

Expected: `200` en las dos (antes era `404`). Si sigue en `404`, **no está aplicada** y se reporta como pendiente
de Naza, no como bug.

- [ ] **Paso 6: commit**

```bash
git add supabase/migrations/20260921000100_panel_empresa.sql supabase/CONTRATO.md
git commit -m "panel de la empresa: las tres tablas y el contrato"
```

---

### Tarea 2: el anotador del entrevistador

**Files:**
- Create: `entrevistador/src/costos.ts`
- Test: `entrevistador/test/costos.test.ts`

**Interfaces:**
- Consumes: la tabla `consumo_ia` (Tarea 1) y `db` de `entrevistador/src/db/cliente.ts`
  (`export const db = createClient(config.supabaseUrl, config.supabaseServiceKey)`).
- Produces (las usan las tareas 3, 4 y la Parte B):
  - `type Servicio = 'entrevistador' | 'fabrica' | 'voz'`
  - `type Proveedor = 'anthropic' | 'openai' | 'local'`
  - `type Unidad = 'segundos' | 'caracteres'`
  - `type Uso = { input_tokens?: number | null; output_tokens?: number | null; cache_creation_input_tokens?: number | null; cache_read_input_tokens?: number | null }`
  - `function calcularUsd(modelo: string, uso: Uso): number`
  - `function calcularUsdPorUnidad(modelo: string, cantidad: number): number`
  - `async function registrarUso(db: DbParaCostos, fila: FilaConsumo): Promise<void>`

- [ ] **Paso 1: escribir el test que falla**

```ts
import { describe, it, expect, vi, afterEach } from 'vitest';
import type { SupabaseClient } from '@supabase/supabase-js';
import { calcularUsd, calcularUsdPorUnidad, registrarUso } from '../src/costos.js';

/** El doble es del BORDE (el cliente de Supabase), nunca de una función de adentro. */
function dbQueCaptura(capturadas: { tabla: string; fila: Record<string, unknown> }[], error: string | null = null) {
  return {
    from: (tabla: string) => ({
      insert: async (fila: Record<string, unknown>) => {
        capturadas.push({ tabla, fila });
        return { error: error ? { message: error } : null };
      },
    }),
  } as unknown as SupabaseClient;
}

afterEach(() => vi.restoreAllMocks());

describe('calcularUsd', () => {
  it('cobra opus-5 por millón de tokens de entrada y de salida', () => {
    expect(calcularUsd('claude-opus-5', { input_tokens: 1_000_000, output_tokens: 1_000_000 })).toBe(30); // 5 + 25
  });

  it('cobra el caché a la regla de Anthropic (escritura 1,25x, lectura 0,1x)', () => {
    expect(calcularUsd('claude-fable-5', { cache_creation_input_tokens: 1_000_000, cache_read_input_tokens: 1_000_000 })).toBe(13.5); // 12,5 + 1
  });

  it('deja el usd en 0 y avisa cuando el modelo no está en la tabla', () => {
    const aviso = vi.spyOn(console, 'warn').mockImplementation(() => {});
    expect(calcularUsd('modelo-desconocido', { input_tokens: 5000 })).toBe(0);
    expect(aviso).toHaveBeenCalledOnce();
  });
});

describe('calcularUsdPorUnidad', () => {
  it('cobra la transcripción por segundo', () => {
    // Medido en GASTOS.md: USD 0,0045 por minuto.
    expect(calcularUsdPorUnidad('gpt-transcribe', 60)).toBeCloseTo(0.0045, 6);
  });
});

describe('registrarUso', () => {
  it('inserta en consumo_ia con los campos que espera el panel', async () => {
    const capturadas: { tabla: string; fila: Record<string, unknown> }[] = [];
    await registrarUso(dbQueCaptura(capturadas), {
      servicio: 'entrevistador', paso: 'evaluar', modelo: 'claude-opus-5', proveedor: 'anthropic',
      cuenta: 'joaquin', narradorId: 'n-1', uso: { input_tokens: 2000, output_tokens: 300 },
    });
    expect(capturadas).toHaveLength(1);
    expect(capturadas[0].tabla).toBe('consumo_ia');
    expect(capturadas[0].fila).toMatchObject({
      servicio: 'entrevistador', paso: 'evaluar', modelo: 'claude-opus-5',
      proveedor: 'anthropic', cuenta: 'joaquin', narrador_id: 'n-1',
      input_tokens: 2000, output_tokens: 300, cache_write: 0, cache_read: 0, usd: 0.0175,
    });
  });

  it('anota lo que se cobra por unidad (transcripción) y guarda cantidad y unidad', async () => {
    const capturadas: { tabla: string; fila: Record<string, unknown> }[] = [];
    await registrarUso(dbQueCaptura(capturadas), {
      servicio: 'entrevistador', paso: 'transcribir', modelo: 'gpt-transcribe', proveedor: 'openai',
      cantidad: 191, unidad: 'segundos',
    });
    expect(capturadas[0].fila).toMatchObject({ cantidad: 191, unidad: 'segundos' });
    expect(capturadas[0].fila.usd as number).toBeCloseTo(0.0143, 4);
  });

  it('no inserta nada cuando no hay ni tokens ni unidades (un mock, una respuesta rara)', async () => {
    const capturadas: { tabla: string; fila: Record<string, unknown> }[] = [];
    await registrarUso(dbQueCaptura(capturadas), {
      servicio: 'entrevistador', paso: 'evaluar', modelo: 'claude-opus-5', proveedor: 'anthropic',
    });
    expect(capturadas).toHaveLength(0);
  });

  it('si la tabla no existe (migración sin aplicar) avisa y NO tira', async () => {
    const aviso = vi.spyOn(console, 'warn').mockImplementation(() => {});
    await expect(
      registrarUso(dbQueCaptura([], 'relation "consumo_ia" does not exist'), {
        servicio: 'fabrica', paso: 'capitulo', modelo: 'claude-fable-5', proveedor: 'anthropic',
        uso: { input_tokens: 10 },
      })
    ).resolves.toBeUndefined();
    expect(aviso).toHaveBeenCalledOnce();
  });
});
```

- [ ] **Paso 2: correrlo y ver que falla**

Run: `cd entrevistador && npx vitest run test/costos.test.ts`
Expected: FAIL — "Failed to resolve import ../src/costos.js".

- [ ] **Paso 3: escribir el módulo**

```ts
import type { SupabaseClient } from '@supabase/supabase-js';

// Cuánto costó de verdad cada llamada del entrevistador. Es el gemelo de
// fabrica/src/costos.ts, con una diferencia: la fila va a la tabla `consumo_ia`
// de Supabase y no a un JSON en Storage, porque el panel suma el gasto del día
// y no puede recorrer la carpeta de cada narrador.
//
// La regla de oro es la misma de la fábrica: anotar el costo es secundario a
// atender al narrador. Cualquier fallo se avisa por consola y NUNCA tira.

export type Servicio = 'entrevistador' | 'fabrica' | 'voz';
export type Proveedor = 'anthropic' | 'openai' | 'local';
export type Unidad = 'segundos' | 'caracteres';

export type Uso = {
  input_tokens?: number | null;
  output_tokens?: number | null;
  cache_creation_input_tokens?: number | null;
  cache_read_input_tokens?: number | null;
};

export type Precio = { input: number; output: number; cache_write: number; cache_read: number };

/** USD por millón de tokens. Misma tabla que la fábrica (`fabrica/src/costos.ts`). */
export const PRECIOS_USD_POR_MILLON: Record<string, Precio> = {
  'claude-fable-5': { input: 10, output: 50, cache_write: 12.5, cache_read: 1 },
  'claude-opus-5': { input: 5, output: 25, cache_write: 6.25, cache_read: 0.5 },
  'claude-haiku-4-5': { input: 1, output: 5, cache_write: 1.25, cache_read: 0.1 },
};

/**
 * Los que no se cobran por token. El precio es **por unidad** (segundo o carácter).
 *
 * - `gpt-transcribe`: medido (GASTOS.md): USD 0,0045 por minuto de audio.
 * - `gpt-4o-mini-tts`: **estimado** desde lo medido (GASTOS.md: ~USD 0,15 por las 30
 *   preguntas de un narrador, de ~200 caracteres cada una). Se corrige cuando haya
 *   una factura real de OpenAI que lo confirme.
 */
export const PRECIOS_POR_UNIDAD: Record<string, { unidad: Unidad; usdPorUnidad: number }> = {
  'gpt-transcribe': { unidad: 'segundos', usdPorUnidad: 0.0045 / 60 },
  'gpt-4o-mini-tts': { unidad: 'caracteres', usdPorUnidad: 0.15 / 30 / 200 },
};

export type FilaConsumo = {
  servicio: Servicio;
  paso: string;
  modelo: string;
  proveedor: Proveedor;
  cuenta?: string | null;
  narradorId?: string | null;
  uso?: Uso | null;
  cantidad?: number | null;
  unidad?: Unidad | null;
};

/** Seis decimales: un token de haiku cuesta 0,000001 USD. */
function redondearUsd(valor: number): number {
  return Math.round(valor * 1e6) / 1e6;
}

function tokens(valor: number | null | undefined): number {
  return typeof valor === 'number' && Number.isFinite(valor) ? valor : 0;
}

function precioDe(modelo: string): Precio | null {
  if (PRECIOS_USD_POR_MILLON[modelo]) return PRECIOS_USD_POR_MILLON[modelo];
  const base = Object.keys(PRECIOS_USD_POR_MILLON).find((clave) => modelo.startsWith(`${clave}-`));
  return base ? PRECIOS_USD_POR_MILLON[base] : null;
}

/** Un modelo que no está en la tabla vale 0 y se avisa: los tokens igual quedan anotados. */
export function calcularUsd(modelo: string, uso: Uso): number {
  const precio = precioDe(modelo);
  if (!precio) {
    console.warn(`costos: no hay precio cargado para el modelo ${modelo}; se anota con usd 0.`);
    return 0;
  }
  const porMillon =
    tokens(uso.input_tokens) * precio.input +
    tokens(uso.output_tokens) * precio.output +
    tokens(uso.cache_creation_input_tokens) * precio.cache_write +
    tokens(uso.cache_read_input_tokens) * precio.cache_read;
  return redondearUsd(porMillon / 1_000_000);
}

/** Para los que se cobran por segundo (transcribir) o por carácter (TTS). */
export function calcularUsdPorUnidad(modelo: string, cantidad: number): number {
  const precio = PRECIOS_POR_UNIDAD[modelo];
  if (!precio) {
    console.warn(`costos: no hay precio por unidad cargado para ${modelo}; se anota con usd 0.`);
    return 0;
  }
  return redondearUsd(precio.usdPorUnidad * cantidad);
}

/**
 * Anota una llamada en `consumo_ia`. Sin tokens y sin unidades no hay nada que
 * anotar (los mocks de los tests no traen `usage`). Cualquier fallo —la tabla sin
 * crear, Supabase caído, la red— se avisa y no frena a quien llama.
 */
export async function registrarUso(db: SupabaseClient, fila: FilaConsumo): Promise<void> {
  const conTokens = tokens(fila.uso?.input_tokens) + tokens(fila.uso?.output_tokens) > 0;
  const porUnidad = typeof fila.cantidad === 'number' && Number.isFinite(fila.cantidad) && fila.cantidad > 0;
  if (!conTokens && !porUnidad) return;

  const usd = porUnidad ? calcularUsdPorUnidad(fila.modelo, fila.cantidad!) : calcularUsd(fila.modelo, fila.uso ?? {});

  try {
    const { error } = await db.from('consumo_ia').insert({
      servicio: fila.servicio,
      paso: fila.paso,
      modelo: fila.modelo,
      proveedor: fila.proveedor,
      cuenta: fila.cuenta ?? null,
      narrador_id: fila.narradorId ?? null,
      input_tokens: tokens(fila.uso?.input_tokens),
      output_tokens: tokens(fila.uso?.output_tokens),
      cache_write: tokens(fila.uso?.cache_creation_input_tokens),
      cache_read: tokens(fila.uso?.cache_read_input_tokens),
      cantidad: porUnidad ? fila.cantidad : null,
      unidad: porUnidad ? (fila.unidad ?? null) : null,
      usd,
    });
    if (error) {
      console.warn(`costos: no se pudo anotar el paso ${fila.paso} (${fila.modelo}): ${error.message}`);
    }
  } catch (err) {
    console.warn(`costos: no se pudo anotar el paso ${fila.paso} (${fila.modelo}): ${(err as Error).message}`);
  }
}

/** Quién paga la key de este servicio. Se cambia por variable, no por código. */
export function cuentaDeEsteServicio(): string | null {
  const cuenta = process.env.CUENTA_IA?.trim();
  return cuenta ? cuenta : null;
}
```

- [ ] **Paso 4: correr el test y verlo pasar**

Run: `cd entrevistador && npx vitest run test/costos.test.ts`
Expected: PASS (6 tests).

- [ ] **Paso 5: typecheck y suite completa**

Run: `npx tsc --noEmit -p tsconfig.json && npx vitest run`
Expected: sin errores de tipos; la suite entera en verde (el conteo real se lee de la corrida, no se cita de memoria).

- [ ] **Paso 6: commit**

```bash
git add entrevistador/src/costos.ts entrevistador/test/costos.test.ts
git commit -m "entrevistador: el anotador de llamadas al modelo"
```

---

### Tarea 3: enganchar las llamadas que cuestan plata

**Files:**
- Modify: `entrevistador/src/ia/transcribir.ts` (después del `fetch`, antes del `return`)
- Modify: `entrevistador/src/ia/cerebro.ts` (los `messages.create` de cada función)
- Modify: `entrevistador/src/ia/personalizar.ts:242` (dentro de `intento()`)
- Modify: `entrevistador/src/ia/resumenes.ts:240`
- Modify: `entrevistador/src/ia/adaptativas.ts:115`
- Modify: `entrevistador/src/ia/voz.ts` (el TTS)
- Modify: `entrevistador/src/flujo/procesar.ts:220` y `:253` (pasar el narrador)
- Modify: `entrevistador/src/flujo/preguntar.ts:129` (pasar el narrador)
- Test: `entrevistador/test/costos-enganche.test.ts`

**Interfaces:**
- Consumes: `registrarUso` (Tarea 2).
- Produces: filas reales en `consumo_ia` con estos `paso`: `transcribir`, `evaluar`, `adaptativas`,
  `personalizar`, `resumenes`, `voz_pregunta`, `reserva`, `reemplazo`, `no_tuvo`, `cierre`, `intencion`,
  `sugeridas`, `trato`.

- [ ] **Paso 1: el test de humo del enganche**

Un test por función sería repetir trece veces lo mismo. En su lugar, un test que prueba **el camino real**
con el modelo mockeado y espía el insert:

```ts
import { describe, it, expect, vi, beforeEach } from 'vitest';

const insertadas: Record<string, unknown>[] = [];
vi.mock('../src/db/cliente.js', () => ({
  db: {
    from: () => ({
      insert: async (fila: Record<string, unknown>) => { insertadas.push(fila); return { error: null }; },
    }),
  },
}));

import { evaluarRespuesta } from '../src/ia/cerebro.js';

vi.mock('@anthropic-ai/sdk', () => ({
  default: class {
    messages = {
      create: async () => ({
        content: [{ type: 'text', text: '{"suficiente": true}' }],
        usage: { input_tokens: 2000, output_tokens: 300, cache_creation_input_tokens: 0, cache_read_input_tokens: 0 },
      }),
    };
  },
}));

beforeEach(() => { insertadas.length = 0; });

describe('el enganche del costo', () => {
  it('evaluarRespuesta deja una fila con su paso y su narrador', async () => {
    await evaluarRespuesta('¿A qué jugaba?', 'Jugaba al fútbol en la calle.', 40, '', 'usted', { narradorId: 'n-1' });
    expect(insertadas).toHaveLength(1);
    expect(insertadas[0]).toMatchObject({ servicio: 'entrevistador', paso: 'evaluar', narrador_id: 'n-1', input_tokens: 2000 });
  });
});
```

- [ ] **Paso 2: correrlo y ver que falla**

Run: `cd entrevistador && npx vitest run test/costos-enganche.test.ts`
Expected: FAIL — `insertadas` queda vacío (`Expected length: 1, Received length: 0`).

- [ ] **Paso 3: enganchar cada paso**

El patrón es siempre el mismo: **después** de la llamada al modelo, `await registrarUso(db, {...})` con el
`uso` que devolvió la API. Nunca antes y nunca envolviendo la llamada. Tabla de los trece lugares:

| Archivo · función | `paso` | Modelo | `uso` / `cantidad` | De dónde sale el `narradorId` |
|---|---|---|---|---|
| `ia/transcribir.ts` · `transcribir()` | `transcribir` | `gpt-transcribe` | `cantidad: duracion`, `unidad: 'segundos'` (viene en `json.usage.seconds`) | parámetro nuevo `narradorId?` |
| `ia/cerebro.ts` · `evaluarRespuesta()` | `evaluar` | `MODELO_EVALUACION` | `respuesta.usage` | `opciones.narradorId` (nuevo, en `OpcionesDeReintento`) |
| `ia/cerebro.ts` · `detectarReservaYDejarTema()` | `reserva` | `MODELO` | `respuesta.usage` | parámetro nuevo al final |
| `ia/cerebro.ts` · `generarPreguntaReemplazo()` | `reemplazo` | `MODELO` | idem | parámetro nuevo al final |
| `ia/cerebro.ts` · `detectarQueNoTuvo()` | `no_tuvo` | `MODELO` | idem | parámetro nuevo al final |
| `ia/cerebro.ts` · `clasificarCierre()` | `cierre` | `MODELO` | idem | parámetro nuevo al final |
| `ia/cerebro.ts` · `detectarIntencion()` | `intencion` | `MODELO` | idem | parámetro nuevo al final |
| `ia/adaptativas.ts` · `generarPreguntasAdaptativas()` | `adaptativas` | `MODELO` | idem | ya lo recibe: `narradorId: string` |
| `ia/personalizar.ts` · `intento()` (adentro de `personalizarPregunta`) | `personalizar` | `MODELO` | idem | `n.id` (ya está en el parámetro) |
| `ia/resumenes.ts` · el `create` de `memoriaDeCapitulos` | `resumenes` | `MODELO` | idem | `n.id` (`NarradorConMemoria` lo tiene) |
| `ia/voz.ts` · `generarAudioVoz()` | `voz_pregunta` | `gpt-4o-mini-tts` | `cantidad: texto.length`, `unidad: 'caracteres'` | parámetro nuevo al final |
| `ia/sugeridas.ts` · la que llama al modelo | `sugeridas` | `MODELO` | idem | el que ya recibe (el narrador del que se sugieren) |
| `ia/trato.ts` · el `create` | `trato` | `MODELO` | idem | parámetro nuevo al final (el llamador tiene `n`) |

Ejemplo completo del primero, porque tiene la particularidad de que el `fetch` no es del SDK:

```ts
// entrevistador/src/ia/transcribir.ts
import { db } from '../db/cliente.js';
import { registrarUso, cuentaDeEsteServicio } from '../costos.js';

export async function transcribir(audio: Buffer, prompt?: string, narradorId?: string) {
  // ... el fetch de siempre, sin tocar nada ...
  const json = await res.json() as { text: string; usage?: { seconds?: number } };
  const duracion = json.usage?.seconds;
  if (duracion === undefined) {
    throw new Error(`La transcripción no devolvió duración (claves: ${Object.keys(json).join(', ')})`);
  }
  await registrarUso(db, {
    servicio: 'entrevistador', paso: 'transcribir', modelo: 'gpt-transcribe', proveedor: 'openai',
    cuenta: cuentaDeEsteServicio(), narradorId: narradorId ?? null,
    cantidad: duracion, unidad: 'segundos',
  });
  return { texto: json.text, duracionSegundos: Math.round(duracion) };
}

export async function transcribirYActualizar(respuestaId: string, audio: Buffer, prompt?: string, narradorId?: string) {
  const resultado = await transcribir(audio, prompt, narradorId);
  // ... el update de siempre ...
}
```

Y el caso del SDK (Anthropic), que es igual en los once lugares restantes:

```ts
// entrevistador/src/ia/cerebro.ts — adentro de pedirleAlModelo, en evaluarRespuesta
const respuesta = await cliente.messages.create({
  model: MODELO_EVALUACION, max_tokens: 500, system: estiloCerebro(trato),
  messages: [{ role: 'user', content: PROMPT_EVALUAR(pregunta, transcripcion, duracionSegundos, evitar, trato) }],
});
await registrarUso(db, {
  servicio: 'entrevistador', paso: 'evaluar', modelo: MODELO_EVALUACION, proveedor: 'anthropic',
  cuenta: cuentaDeEsteServicio(), narradorId: opciones.narradorId ?? null, uso: respuesta.usage,
});
```

Los llamadores (dos archivos, tres líneas):

```ts
// entrevistador/src/flujo/procesar.ts:220
const { texto, duracionSegundos } = await transcribirYActualizar(id, audio, undefined, narrador.id);
// entrevistador/src/flujo/procesar.ts:253
? await evaluarRespuesta(pregunta, transcripcion, duracionSegundos, textoEvitar(narrador.contexto), trato, { narradorId: narrador.id })
// entrevistador/src/flujo/preguntar.ts:129
const audio = await generarAudioVoz(contenido, n.id);
```

**`generarReconocimiento` NO se instrumenta:** no tiene llamadores (0) desde que se sacó el saludo diario
el 14/09. Es código muerto y no se le agrega nada.

- [ ] **Paso 4: correrlo y verlo pasar, más la suite completa**

Run: `cd entrevistador && npx vitest run test/costos-enganche.test.ts && npx vitest run && npx tsc --noEmit -p tsconfig.json`
Expected: PASS. **Ojo:** agregar un `await` adentro de estas funciones cambia el orden de las llamadas al
mock del modelo en los tests que ya existen; si alguno falla, se arregla el test **sólo si** el cambio de
comportamiento es el correcto (el insert no altera lo que devuelve la función).

- [ ] **Paso 5: commit**

```bash
git add entrevistador/src/ia entrevistador/src/flujo entrevistador/test/costos-enganche.test.ts
git commit -m "entrevistador: cada llamada al modelo deja su fila en consumo_ia"
```

---

### Tarea 4: el latido del entrevistador y de la fábrica

**Files:**
- Create: `entrevistador/src/latido.ts`
- Create: `fabrica/src/latido.ts`
- Modify: `entrevistador/src/flujo/scheduler.ts` (dentro de `tick`, al final)
- Modify: `fabrica/src/worker.ts` (dentro de `tick`, al final)
- Test: `entrevistador/test/latido.test.ts`, `fabrica/test/latido.test.ts`

**Interfaces:**
- Consumes: la tabla `latidos` (Tarea 1) y el cliente de Supabase de cada paquete.
- Produces: `async function anotarLatido(servicio: Servicio, detalle?: Record<string, unknown> | null): Promise<void>`
  en los dos paquetes; la Parte B lee `latidos.ultimo_ping`.

- [ ] **Paso 1: el test que falla**

```ts
// entrevistador/test/latido.test.ts
import { describe, it, expect, vi } from 'vitest';
import type { SupabaseClient } from '@supabase/supabase-js';
import { anotarLatido } from '../src/latido.js';

function dbConUpsert(capturadas: Record<string, unknown>[], error: string | null = null) {
  return {
    from: () => ({
      upsert: async (fila: Record<string, unknown>) => { capturadas.push(fila); return { error: error ? { message: error } : null }; },
    }),
  } as unknown as SupabaseClient;
}

describe('anotarLatido', () => {
  it('pisa la fila de su servicio con la hora', async () => {
    const capturadas: Record<string, unknown>[] = [];
    await anotarLatido('entrevistador', { vuelta: 12 }, dbConUpsert(capturadas));
    expect(capturadas[0]).toMatchObject({ servicio: 'entrevistador', detalle: { vuelta: 12 } });
    expect(typeof capturadas[0].ultimo_ping).toBe('string');
  });

  it('si no puede latir, avisa y NO tira (la PC de música puede estar sin red)', async () => {
    const aviso = vi.spyOn(console, 'warn').mockImplementation(() => {});
    await expect(anotarLatido('voz', null, dbConUpsert([], 'fetch failed'))).resolves.toBeUndefined();
    expect(aviso).toHaveBeenCalledOnce();
  });
});
```

(Los dos archivos de test son iguales salvo el servicio. `anotarLatido` recibe el `db` como último parámetro
opcional para que el test lo inyecte; por defecto usa el del paquete.)

- [ ] **Paso 2: correrlo y ver que falla**

Run: `cd entrevistador && npx vitest run test/latido.test.ts`
Expected: FAIL — no existe `../src/latido.js`.

- [ ] **Paso 3: escribir los dos módulos**

```ts
// entrevistador/src/latido.ts  (en fabrica/src/latido.ts es igual, con su propio import de db)
import type { SupabaseClient } from '@supabase/supabase-js';
import { db as dbReal } from './db/cliente.js';

// "Estoy vivo". Sin esto no se puede distinguir «no hay trabajo» de «el worker
// se cayó», que es justo lo que el panel tiene que mostrar. Se pisa siempre la
// misma fila: interesa la última vez, no el historial.
//
// Si no se puede latir (Supabase caído, la red de la PC de música), se avisa y
// el worker sigue: el latido no puede tumbar el trabajo.

export async function anotarLatido(
  servicio: 'entrevistador' | 'fabrica' | 'voz',
  detalle: Record<string, unknown> | null = null,
  db: SupabaseClient = dbReal
): Promise<void> {
  try {
    const { error } = await db.from('latidos').upsert({
      servicio, ultimo_ping: new Date().toISOString(), detalle,
    });
    if (error) console.warn(`latido: ${servicio} no pudo latir: ${error.message}`);
  } catch (err) {
    console.warn(`latido: ${servicio} no pudo latir: ${(err as Error).message}`);
  }
}
```

En el entrevistador va al final de `tick(ahora)` y en la fábrica al final de `tick()`, los dos con su
`try/catch` propio para que un latido no saltee el trabajo de la vuelta:

```ts
// entrevistador/src/flujo/scheduler.ts — última línea de tick()
await anotarLatido('entrevistador', { hora: ahora.toISOString() });

// fabrica/src/worker.ts — última línea del try de tick()
await anotarLatido('fabrica', { pedidos: pendientes.length });
```

- [ ] **Paso 4: correr y verlo pasar**

Run: `cd entrevistador && npx vitest run test/latido.test.ts && cd ../fabrica && npx vitest run test/latido.test.ts`
Expected: PASS (2 y 2).

- [ ] **Paso 5: typecheck y suites completas de los dos paquetes**

Run: `cd entrevistador && npx tsc --noEmit -p tsconfig.json && npx vitest run; cd ../fabrica && npx tsc --noEmit -p tsconfig.json && npx vitest run`
Expected: todo verde.

- [ ] **Paso 6: commit**

```bash
git add entrevistador/src/latido.ts entrevistador/src/flujo/scheduler.ts entrevistador/test/latido.test.ts fabrica/src/latido.ts fabrica/src/worker.ts fabrica/test/latido.test.ts
git commit -m "los workers laten: entrevistador y fabrica avisan que estan vivos"
```

---

### Tarea 5: el latido en la PC de música, y la directiva

**Files:**
- Modify: `voz/voz/buzon.py` (función nueva `latir`)
- Modify: `voz/voz/worker.py` (llamarla en el bucle)
- Test: `voz/test/test_latido.py`
- Entregable que no es código: la directiva al buzón (`central/2009-…` según la referencia).

**Interfaces:**
- Consumes: la tabla `latidos`, el cliente `sb` que ya recibe el worker.
- Produces: `latir(sb, detalle: dict | None = None) -> None`.

- [ ] **Paso 1: el test que falla**

```python
# voz/test/test_latido.py
from voz.buzon import latir


class FakeTable:
    def __init__(self, capturadas, error=None):
        self._capturadas = capturadas
        self._error = error

    def upsert(self, fila):
        self._capturadas.append(fila)
        return self

    def execute(self):
        return type("Respuesta", (), {"error": self._error})()


class FakeSupabase:
    def __init__(self, capturadas, error=None):
        self._capturadas = capturadas
        self._error = error

    def table(self, nombre):
        self._capturadas.append({"__tabla__": nombre})
        return FakeTable(self._capturadas, self._error)


def test_late_con_el_servicio_voz():
    capturadas = []
    latir(FakeSupabase(capturadas), {"capitulo": 3})
    fila = [c for c in capturadas if "__tabla__" not in c][0]
    assert fila["servicio"] == "voz"
    assert fila["detalle"] == {"capitulo": 3}
    assert "ultimo_ping" in fila


def test_si_no_puede_latir_no_tira():
    latir(FakeSupabase([], error="fetch failed"))  # no debe levantar excepción
```

- [ ] **Paso 2: correrlo y ver que falla**

Run: `cd voz && ./.venv/Scripts/python -m pytest test/test_latido.py -q`
Expected: FAIL — `ImportError: cannot import name 'latir'`.

- [ ] **Paso 3: implementarlo**

```python
# voz/voz/buzon.py — al lado de marcar()
def latir(sb, detalle: dict | None = None) -> None:
    """Avisa que el worker está vivo. Si no puede, avisa y sigue: el latido
    no puede tumbar la narración."""
    try:
        sb.table("latidos").upsert(
            {"servicio": "voz", "ultimo_ping": ahora().isoformat(), "detalle": detalle}
        ).execute()
    except Exception as err:  # noqa: BLE001 — cualquier fallo se avisa, ninguno frena
        log.warning("no pude latir: %s", err)
```

```python
# voz/voz/worker.py — adentro del while True, antes de buscar trabajo
latir(sb, {"motor": config.motor, "vueltas": vueltas})
```

- [ ] **Paso 4: correr y verlo pasar**

Run: `cd voz && ./.venv/Scripts/python -m pytest test/test_latido.py -q && ./.venv/Scripts/python -m pytest -q`
Expected: PASS en el nuevo y la suite de `voz/` sin romperse (tarda decenas de segundos: no la corras en
paralelo con otra cosa pesada de la misma máquina).

- [ ] **Paso 5: la directiva al buzón**

Escribí el archivo de directiva para la PC de música con la receta de `references/buzon-recetas.md`
(skill `vitacora-familiar-ops`): va en `central/`, con el nombre de la fecha, y **el texto tiene que decir**:

- la rama `panel-de-la-empresa` y el commit del Paso 6 de esta tarea;
- que haga `git pull` en el worktree `C:\vitacora-voz\repo-master` (**nunca** en `repo`);
- que **reinicie la tarea `VitacoraVoz`** después del pull (Python se queda con el código viejo en memoria);
- qué mirar: que aparezca la fila de `voz` en `latidos` con el `ultimo_ping` moviéndose cada ~30 s;
- que si el worker manual está corriendo, lo pare antes (un solo worker a la vez: el pedido de corte de
  frases no tiene candado).

Verificá que el acuse llegue: el archivo `<directiva>.md.leido.txt` de 0 bytes en `central/`.

- [ ] **Paso 6: commit**

```bash
git add voz/voz/buzon.py voz/voz/worker.py voz/test/test_latido.py
git commit -m "voz: el worker de la PC de musica late"
```

---

### Tarea 6: la prueba de punta a punta y el cierre

**Files:**
- Modify: `ESTADO.md` (sección fechada, firmada `(Naza)`)
- Modify: `GASTOS.md` (la línea de comisiones y la nota del TTS estimado)
- Create: `docs/handoff-panel-empresa.md` (el mensaje listo para pegar a Joaquín)

**Interfaces:**
- Consumes: todo lo anterior.
- Produces: la evidencia de que las filas se escriben, y los documentos que cierran la parte A.

- [ ] **Paso 1: una llamada real deja una fila**

Corré un paso de verdad, barato, y leé la base. El más barato de todos es una transcripción, pero el más
directo es el script de medición que ya existe:

```bash
cd entrevistador && npm run prueba-consumo   # dos llamadas reales, centavos
```

**Ojo (medido el 21/09): `prueba-evaluacion` NO sirve para esto.** Los scripts `prueba-*.ts` se arman su
propio cliente de Anthropic (`scripts/prueba-evaluacion.ts:42`), así que no pasan por las funciones de
producción y no anotan nada: esa corrida gastó USD 0,065 y dejó **cero** filas. `prueba-consumo` llama a
`detectarIntencion` y a `generarAudioVoz` —las de producción— y lee la tabla de vuelta.

Después, leé la tabla por PostgREST (receta del Paso 2 de la Tarea 1):

```bash
curl -s "$SUPABASE_URL/rest/v1/consumo_ia?select=fecha,servicio,paso,modelo,input_tokens,output_tokens,usd&order=fecha.desc&limit=5" \
  -H "apikey: $KEY" -H "Authorization: Bearer $KEY"
```

Expected: al menos una fila con `modelo: claude-opus-5`, tokens **distintos de cero** y un `usd` calculado.
**Leer de vuelta es la verificación**: el exit 0 del script no prueba que se anotó.

- [ ] **Paso 2: los tres latidos**

Si los servicios están corriendo (la fábrica en Railway, la voz en la PC de música, el entrevistador donde
esté desplegado), leé `latidos`:

```bash
curl -s "$SUPABASE_URL/rest/v1/latidos?select=servicio,ultimo_ping,detalle" -H "apikey: $KEY" -H "Authorization: Bearer $KEY"
```

Expected: las filas con `ultimo_ping` de hace menos de 3 × su intervalo. Lo que no esté desplegado todavía se
reporta como pendiente (no es un bug de esta parte).

- [ ] **Paso 3: el panel todavía no rompe nada**

Run: `cd web && npm test` (la Parte B todavía no existe; esto comprueba que la migración y las tablas nuevas
no rompieron nada de lo que ya había).
Expected: la suite de `web/` en verde, con el mismo conteo de antes (leelo de la corrida).

- [ ] **Paso 4: la sección en ESTADO.md**

Fechada el día de la corrida y firmada `(Naza)`, con: qué son las tres tablas, qué se instrumentó y qué no
(`generarReconocimiento` es código muerto: 0 llamadores), la tabla de precios usada, qué quedó **estimado**
(el TTS) contra qué quedó **medido** (la transcripción), la verificación con el código HTTP de la migración
(antes/después) y las filas leídas de vuelta.

- [ ] **Paso 5: GASTOS.md**

- Sumá la línea de **comisiones de pasarela** (Stripe ~3 %, Mercado Pago ~4 %) y el margen limpio resultante:
  88,7 % bruto → **85,7 %** con Stripe y **84,7 %** con Mercado Pago.
- Anotá el precio estimado del TTS (por carácter) marcado como **estimado**, con la cuenta de dónde sale.

- [ ] **Paso 6: el mensaje para Joaquín**

En `docs/handoff-panel-empresa.md`, listo para pegar (`shared-repo-handoff`): la rama
`panel-de-la-empresa`, archivo por archivo lo que hay que adaptar del lado suyo (el entrevistador anota
costos con **su** key y necesita la variable `CUENTA_IA=joaquin` en Railway), la migración que aplicó Naza
y su receta de verificación, qué es de cada uno (`consumo_ia` es de sólo agregar: nadie pisa nada), los
conteos de tests de esta corrida y lo que quedó sin commitear a propósito (`.agents/`,
`skills-lock.json`).

- [ ] **Paso 7: commit y push de la rama**

```bash
git add ESTADO.md GASTOS.md docs/handoff-panel-empresa.md
git commit -m "panel de la empresa: cierre de la parte A"
git push -u origin panel-de-la-empresa
git ls-remote --heads origin panel-de-la-empresa   # verificar contra el remoto, no contra la copia local
```

---

## Autorevisión del plan (hecha al escribirlo)

- **Cobertura del spec:** las tres tablas (T1), el anotador (T2), "cada llamada deja una fila" (T3, con la
  tabla de los trece lugares), el latido de los tres servicios (T4 y T5), la verificación de la migración
  leyendo de vuelta (T1 y T6), los documentos y el handoff (T6). La Parte B (el panel) es su propio plan
  porque no comparte código con éste: sólo lee estas tablas.
- **Sin placeholders:** no hay TBD; cada paso lleva el comando y lo que se espera ver.
- **Consistencia de tipos:** `FilaConsumo`, `registrarUso`, `anotarLatido` y `latir` se definen antes de
  usarse; los nombres de las columnas de la T1 son los que usan T2 a T5 y la Parte B (`narrador_id`,
  `cache_write`, `cache_read`, `cantidad`, `unidad`, `usd`).
- **Decisiones tomadas sin volver a preguntar** (porque Naza dijo "dale, empecemos" sobre el spec): las siete
  decisiones abiertas quedaron con la recomendación escrita en el spec, y una sola de ellas toca este plan —
  los porcentajes de comisión de la Tarea 6 van cargados a mano y se corrigen cuando ella confirme.
