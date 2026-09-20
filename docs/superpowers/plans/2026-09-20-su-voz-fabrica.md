# Su voz — fábrica — plan de implementación

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development
> (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use
> checkbox (`- [ ]`) syntax for tracking.

**Goal:** que la fábrica elija las tres mejores frases de cada capítulo, arme
`{narrador}/paquete/frases.json`, deje pedido el corte en el paquete y les devuelva el audio real
cortado y restaurado — sin narrar nada, sin migración de base.

**Architecture:** se reemplaza la rama del audiolibro de `generar-paquete.ts` por una rama de
frases. El **mismo modelo que escribe el libro** hace dos pasadas (proponer 5 candidatas por
capítulo; elegir 3 y explicar por qué) y la fábrica escribe `frases.json` en el paquete. El
**worker de la PC de música** se lleva el corte (alinear la cita contra las marcas de palabra de
Whisper, cortar, restaurar, masterizar) y completa el mismo archivo. La fábrica publica el
paquete y el PDF con la sección impresa (frase + QR) y no espera a la voz para entregar el libro.

**Tech Stack:** Node 20 + TypeScript ESM, `@anthropic-ai/sdk`, `@supabase/supabase-js`, vitest.
El módulo nuevo es puro salvo las dos llamadas al modelo y las de Storage.

**Spec:** `docs/superpowers/specs/2026-09-20-su-voz-design.md` (leerlo entero antes de empezar).

## Global Constraints

- Comentarios y nombres en **castellano rioplatense**; cada función explica **por qué existe**.
- **Sin migración y sin tablas nuevas**: todo vive en el paquete (`frases.json` + mp3). No se
  toca `supabase/migrations/` ni `CONTRATO.md` (§"Contrato" del spec).
- **El audio es tal cual lo dijo**: el corte no aplica ritmo, ni pausas, ni cambio de velocidad.
  Este plan deja el pedido en `frases.json`; el corte lo hace el worker (directiva aparte).
- **Nunca entra una respuesta reservada** (`esPublicable(r)` de `src/libro/comun.ts`): filtro
  obligatorio antes de proponer y antes de imprimir.
- **Tres frases por capítulo** (decisión del 20/09), de las 5 candidatas.
- **Un escritor por campo de `frases.json`**: la fábrica crea el archivo y marca las elegidas; el
  worker completa `audio_path`, `segundos`, `inicio`, `fin`, `estado`; la web marca `elegida`,
  `elegida_por` y `confirmado_at`.
- Tests con `cd fabrica && npx vitest run`; typecheck con `npx tsc --noEmit -p .`. **No
  commitear con tests rojos.** Cada commit, en castellano y corto, con el porqué.
- Los textos de los prompts que hablan del narrador los aprueba Naza antes de mergear: la
  verificación de este plan incluye mostrárselos.

## Review Focus

Las cinco entradas que el spec implica y que ningún test de tarea cubre solo:

1. **El mismo tema repetido entre capítulos** (dos frases que cuentan lo mismo, en capítulos
   distintos): un lector razonable espera no leer la misma anécdota dos veces.
2. **Una cita que el modelo devuelve retocada** (cambió una palabra o unió dos frases del
   narrador): con eso el corte contra el audio no alinea y la frase impresa no coincide con lo
   que se escucha.
3. **Un libro sin audios en un capítulo** (narrador que escribió): ese capítulo no tiene frases
   que cortar; el capítulo no puede quedar como "fallido".
4. **El worker sin contestar** (PC apagada, buzón con candado): el libro tiene que salir igual,
   con el panel diciendo que "Su voz" se está preparando.
5. **Una respuesta reservada a mitad del libro** (`reservada` o `reservado_tramo`): no puede
   aparecer ni impresa ni en el audio.

Cada una tiene su test en la tarea que le da el código (se indica en cada `Review Focus` local).

---

### Task 1: `frases.ts` — las dos pasadas y el armado de `frases.json`

**Files:**
- Create: `fabrica/src/libro/frases.ts`
- Modify: `fabrica/src/voz/conectores.ts` (exportar `parsearJsonTolerante`, hoy privada en la línea 124)
- Test: `fabrica/test/frases.test.ts`

**Interfaces:**
- Consumes: `parsearJsonTolerante(texto: string): unknown` (exportada de `src/voz/conectores.ts`),
  `esPublicable(r)` y `textoRespuesta(r)` de `src/libro/comun.ts`, `Respuesta` de `src/db.ts`.
- Produces:
  - `type FraseCandidata = { id: string; texto: string; respuesta_id: string | null; pregunta_orden: number; por_que: string; elegida: boolean; elegida_por: 'modelo'; estado: 'pendiente'; audio_path: null; segundos: null; inicio: null; fin: null }`
  - `type CapituloConFrases = { numero: number; capitulo: string; candidatas: FraseCandidata[] }`
  - `type FrasesJson = { version: 1; narrador_id: string; pedido_id: string; confirmado_at: string | null; capitulos: CapituloConFrases[] }`
  - `proponerCandidatas(cliente: Anthropic, args: { narrador: string; capitulo: string; material: { orden: number; respuestaId: string | null; texto: string }[] }): Promise<{ texto: string; por_que: string }[]>` (5 o menos)
  - `elegirFinales(cliente: Anthropic, args: { narrador: string; capitulo: string; candidatas: { texto: string; por_que: string }[] }): Promise<{ indices: number[]; porQue: string[] }>` (3 o menos)
  - `armarFrasesJson(args: { narradorId: string; pedidoId: string; capitulos: { nombre: string; numero: number; material: { orden: number; respuestaId: string | null; texto: string }[] }[] }, deps: { proponer: typeof proponerCandidatas; elegir: typeof elegirFinales; cliente: Anthropic }): Promise<FrasesJson>`

**Review Focus local:** entrada 5 (reservada) y entrada 3 (capítulo sin audios). El capítulo cuyo
`material` queda vacío después del filtro **no aparece** en el JSON (no es un error).

- [ ] **Step 1: escribir el test que falla (armado y filtros del módulo puro)**

```ts
// fabrica/test/frases.test.ts
import { describe, expect, it, vi } from 'vitest';
import { armarFrasesJson } from '../src/libro/frases.js';

const cliente = {} as never;

describe('armarFrasesJson', () => {
  it('deja tres frases elegidas por capítulo y saltea el capítulo sin audios', async () => {
    const deps = {
      cliente,
      proponer: vi.fn(async ({ material }) => material.slice(0, 5).map((m) => ({ texto: `dijo algo de ${m.orden}`, por_que: 'se repite en la mesa' }))),
      elegir: vi.fn(async ({ candidatas }) => ({ indices: candidatas.slice(0, 3).map((_, i) => i), porQue: candidatas.slice(0, 3).map(() => 'la más suya') })),
    };
    const frases = await armarFrasesJson(
      {
        narradorId: 'n1',
        pedidoId: 'p1',
        capitulos: [
          { nombre: 'La infancia', numero: 1, material: [1, 2, 3, 4, 5].map((o) => ({ orden: o, respuestaId: `r${o}`, texto: `texto ${o}` })) },
          { nombre: 'La familia', numero: 6, material: [] },
        ],
      },
      deps as never
    );
    expect(frases.capitulos).toHaveLength(1);
    expect(frases.capitulos[0].candidatas.filter((c) => c.elegida)).toHaveLength(3);
    expect(frases.confirmado_at).toBeNull();
    expect(deps.proponer).toHaveBeenCalledTimes(1); // el capítulo sin audios ni se le pide al modelo
  });

  it('no propone nada de una respuesta reservada', async () => {
    const reservadas = new Map([['r2', { reservada: true }], ['r3', { reservado_tramo: 'no lo pongas' }]]);
    const deps = {
      cliente,
      proponer: vi.fn(async ({ material }) => material.map((m) => ({ texto: m.texto, por_que: 'x' }))),
      elegir: vi.fn(async ({ candidatas }) => ({ indices: [0], porQue: ['x'] })),
    };
    const frases = await armarFrasesJson(
      {
        narradorId: 'n1',
        pedidoId: 'p1',
        capitulos: [{
          nombre: 'La infancia', numero: 1,
          material: [
            { orden: 1, respuestaId: 'r1', texto: 'uno' },
            { orden: 2, respuestaId: 'r2', texto: 'dos', reserva: reservadas.get('r2') },
            { orden: 3, respuestaId: 'r3', texto: 'tres', reserva: reservadas.get('r3') },
          ],
        }],
      },
      deps as never
    );
    const enviados = (deps.proponer as unknown as { mock: { calls: unknown[][] } }).mock.calls[0][0] as { material: { orden: number }[] };
    expect(enviados.material.map((m) => m.orden)).toEqual([1]);
  });
});
```

- [ ] **Step 2: correr el test y ver que falla**

Run: `cd fabrica && npx vitest run test/frases.test.ts`
Expected: FAIL — no existe `src/libro/frases.js`.

- [ ] **Step 3: implementar el módulo**

```ts
// fabrica/src/libro/frases.ts
// Por qué existe: el producto dejó de ser un audiolibro y pasó a ser las mejores frases del
// narrador en su voz (spec 2026-09-20). Este módulo las elige con el mismo modelo que escribe
// el libro —dos pasadas, una para proponer y otra para decidir— y arma el frases.json que el
// worker corta y que la web muestra. No toca la base: vive en el paquete del narrador.
import type Anthropic from '@anthropic-ai/sdk';
import { esPublicable } from './comun.js';
import { extraerTexto } from './comun.js';
import { parsearJsonTolerante } from '../voz/conectores.js';

export const FRASES_POR_CAPITULO = 3;
export const CANDIDATAS_POR_CAPITULO = 5;

export type MaterialDeFrase = { orden: number; respuestaId: string | null; texto: string; reserva?: { reservada?: boolean; reservado_tramo?: string | null } };

export type FraseCandidata = {
  id: string; texto: string; respuesta_id: string | null; pregunta_orden: number;
  por_que: string; elegida: boolean; elegida_por: 'modelo';
  estado: 'pendiente'; audio_path: null; segundos: null; inicio: null; fin: null;
};
export type CapituloConFrases = { numero: number; capitulo: string; candidatas: FraseCandidata[] };
export type FrasesJson = { version: 1; narrador_id: string; pedido_id: string; confirmado_at: string | null; capitulos: CapituloConFrases[] };

const CRITERIOS = `Los criterios, en orden:
1. Es la que se repetiría en una mesa, años después.
2. Está en SU voz (un dato no es una frase: "nació en 1943" no sirve).
3. Se entiende sola, sin el resto de la historia.
4. No hiere a alguien que está vivo (nombres, peleas, plata).
5. Una por tema.`;

export const PROMPT_CANDIDATAS = (narrador: string, capitulo: string) => `Sos el biógrafo de ${narrador}. De las historias de «${capitulo}» que te paso, elegí hasta ${CANDIDATAS_POR_CAPITULO} FRASES para que su familia las escuche en su voz, para siempre.
${CRITERIOS}
Devolvé SOLO un JSON: {"candidatas":[{"texto":"...","por_que":"una línea"}]}. El texto tiene que estar EXACTAMENTE como él lo dijo (no lo retoques, no lo completes, no lo una con otra frase): si la cita no está tal cual en la transcripción, no la propongas.`;

export const PROMPT_ELEGIR = (narrador: string, capitulo: string) => `Sos el editor del libro de ${narrador}. Te paso las candidatas de «${capitulo}». Elegí las ${FRASES_POR_CAPITULO} que de verdad quedarían en la familia y explicá en una línea por qué cada una.
${CRITERIOS}
Devolvé SOLO un JSON: {"indices":[3,0,5],"por_que":["...","...","..."]} — los índices de las elegidas (0 = la primera candidata), en el orden en que las pondrías en el libro.`;

async function llamar(cliente: Anthropic, prompt: string, material: string): Promise<unknown> {
  const respuesta = await cliente.messages.create({
    model: 'claude-fable-5',
    max_tokens: 2000, // 300 corta la lista: en el piloto se midió que un tope corto pierde la repregunta
    messages: [{ role: 'user', content: `${prompt}\n\n--- MATERIAL ---\n${material}` }],
  });
  return parsearJsonTolerante(extraerTexto(respuesta.content as Array<{ type: string; text?: string }>));
}

export async function proponerCandidatas(cliente: Anthropic, args: { narrador: string; capitulo: string; material: MaterialDeFrase[] }) {
  const crudo = (await llamar(
    cliente,
    PROMPT_CANDIDATAS(args.narrador, args.capitulo),
    args.material.map((m) => `[${m.orden}] ${m.texto}`).join('\n\n')
  )) as { candidatas?: { texto?: unknown; por_que?: unknown }[] };
  const dichos = args.material.map((m) => m.texto);
  return (crudo.candidatas ?? [])
    .filter((c) => typeof c.texto === 'string' && c.texto.trim() !== '')
    .map((c) => ({ texto: (c.texto as string).trim(), por_que: typeof c.por_que === 'string' ? c.por_que.trim() : '' }))
    // La cita tiene que estar TAL CUAL: si el modelo la retocó, el corte no alinea y lo impreso
    // no coincide con lo que suena (Review Focus 2).
    .filter((c) => dichos.some((d) => d.includes(c.texto)))
    .slice(0, CANDIDATAS_POR_CAPITULO);
}

export async function elegirFinales(cliente: Anthropic, args: { narrador: string; capitulo: string; candidatas: { texto: string; por_que: string }[] }) {
  if (args.candidatas.length <= FRASES_POR_CAPITULO) {
    // Menos candidatas que lugares: no se le paga al modelo por ordenar dos cosas.
    return { indices: args.candidatas.map((_, i) => i), porQue: args.candidatas.map((c) => c.por_que) };
  }
  const crudo = (await llamar(
    cliente,
    PROMPT_ELEGIR(args.narrador, args.capitulo),
    args.candidatas.map((c, i) => `[${i}] ${c.texto}`).join('\n')
  )) as { indices?: unknown; por_que?: unknown };
  const indices = (Array.isArray(crudo.indices) ? crudo.indices : []).filter(
    (i): i is number => typeof i === 'number' && i >= 0 && i < args.candidatas.length
  );
  const porQue = Array.isArray(crudo.por_que) ? crudo.por_que.filter((p): p is string => typeof p === 'string') : [];
  return { indices: indices.slice(0, FRASES_POR_CAPITULO), porQue };
}

export async function armarFrasesJson(
  args: {
    narradorId: string; pedidoId: string;
    capitulos: { nombre: string; numero: number; material: MaterialDeFrase[] }[];
  },
  deps: { cliente: Anthropic; proponer: typeof proponerCandidatas; elegir: typeof elegirFinales }
): Promise<FrasesJson> {
  const capitulos: CapituloConFrases[] = [];
  for (const capitulo of args.capitulos) {
    // Solo lo publicable: una respuesta reservada no se propone ni se imprime (Review Focus 5).
    const material = capitulo.material.filter((m) => esPublicable(m.reserva ?? {}) && m.texto.trim() !== '');
    if (material.length === 0) continue; // sin audios utilizables: el capítulo no aparece (Review Focus 3)
    const candidatas = await deps.proponer(deps.cliente, { narrador: '', capitulo: capitulo.nombre, material });
    if (candidatas.length === 0) continue;
    const { indices, porQue } = await deps.elegir(deps.cliente, { narrador: '', capitulo: capitulo.nombre, candidatas });
    const elegidas = new Set(indices);
    capitulos.push({
      numero: capitulo.numero,
      capitulo: capitulo.nombre,
      candidatas: candidatas.map((c, i) => ({
        id: `c${String(capitulo.numero).padStart(2, '0')}-${String(i + 1).padStart(2, '0')}`,
        texto: c.texto,
        respuesta_id: material.find((m) => m.texto.includes(c.texto))?.respuestaId ?? null,
        pregunta_orden: material.find((m) => m.texto.includes(c.texto))?.orden ?? 0,
        por_que: porQue[indices.indexOf(i)] ?? c.por_que,
        elegida: elegidas.has(i),
        elegida_por: 'modelo' as const,
        estado: 'pendiente' as const,
        audio_path: null, segundos: null, inicio: null, fin: null,
      })),
    });
  }
  return { version: 1, narrador_id: args.narradorId, pedido_id: args.pedidoId, confirmado_at: null, capitulos };
}
```

- [ ] **Step 4: exportar `parsearJsonTolerante` y correr los tests**

En `fabrica/src/voz/conectores.ts`, cambiar `function parsearJsonTolerante` por
`export function parsearJsonTolerante` (y su comentario: "la comparten los conectores y las
frases; el modelo devuelve el JSON dentro de un bloque de código").

Run: `cd fabrica && npx vitest run test/frases.test.ts test/conectores.test.ts`
Expected: PASS los dos archivos (el de conectores sigue verde: el cambio es solo de visibilidad).

- [ ] **Step 5: typecheck y commit**

Run: `cd fabrica && npx tsc --noEmit -p .`
Expected: sin salida (limpio).

```bash
git add fabrica/src/libro/frases.ts fabrica/src/voz/conectores.ts fabrica/test/frases.test.ts
git commit -m "fabrica: las frases del narrador se eligen con dos pasadas del modelo

La cita tiene que estar textual en la transcripcion: si el modelo la retoca el
corte no alinea y lo impreso no coincide con el audio."
```

---

### Task 2: `frases.json` en el paquete y el pedido de corte para el worker

**Files:**
- Create: `fabrica/src/libro/publicar-frases.ts`
- Modify: `fabrica/src/voz/narracion-json.ts` (nada) — **no**; el pedido de corte va en el módulo nuevo
- Test: `fabrica/test/publicar-frases.test.ts`

**Interfaces:**
- Consumes: `FrasesJson` de `src/libro/frases.ts`; `subirTexto`, `descargarTextoOpcional` de
  `src/libro/comun.ts`; `Db` (`ReturnType<typeof obtenerClienteDb>`) de `src/db.ts`.
- Produces:
  - `export const RUTA_FRASES_JSON = (narradorId: string) => \`${narradorId}/paquete/frases.json\`;`
  - `export const RUTA_FRASES_PEDIDO = (narradorId: string) => \`${narradorId}/paquete/frases_pedido.txt\`;`
  - `publicarFrases(db: Db, frases: FrasesJson): Promise<void>` — sube el JSON y, si hay al menos
    una candidata elegida, escribe `frases_pedido.txt` (lo que el worker sondea).
  - `leerFrases(db: Db, narradorId: string): Promise<FrasesJson | null>`

**Interfaces para el worker (las tiene que respetar la directiva del buzón):** el worker lee
`{narrador}/paquete/frases_pedido.txt`, toma `frases.json`, corta las candidatas de cada
capítulo, sube `{narrador}/voz/frases/cNN_MM.mp3` y completa `audio_path`, `segundos`, `inicio`,
`fin` y `estado: 'cortada'`; al terminar borra `frases_pedido.txt`.

- [ ] **Step 1: escribir los tests que fallan**

```ts
// fabrica/test/publicar-frases.test.ts
import { describe, expect, it, vi } from 'vitest';
import { publicarFrases, RUTA_FRASES_JSON, RUTA_FRASES_PEDIDO, FRASES_CON_AUDIO } from '../src/libro/publicar-frases.js';

const frasesBase = { version: 1 as const, narrador_id: 'n1', pedido_id: 'p1', confirmado_at: null, capitulos: [] };

function dbFalso(subidas: { ruta: string; cuerpo: string }[]) {
  return {
    storage: {
      from: () => ({
        upload: async (ruta: string, cuerpo: unknown) => {
          subidas.push({ ruta, cuerpo: String(cuerpo) });
          return { error: null };
        },
      }),
    },
  } as never;
}

describe('publicarFrases', () => {
  it('sube el JSON y deja el pedido de corte cuando hay elegidas', async () => {
    const subidas: { ruta: string; cuerpo: string }[] = [];
    await publicarFrases(dbFalso(subidas), {
      ...frasesBase,
      capitulos: [{ numero: 1, capitulo: 'La infancia', candidatas: [{ id: 'c01-01', texto: 'x', respuesta_id: null, pregunta_orden: 1, por_que: '', elegida: true, elegida_por: 'modelo', estado: 'pendiente', audio_path: null, segundos: null, inicio: null, fin: null }] }],
    });
    expect(subidas.map((s) => s.ruta)).toEqual([RUTA_FRASES_JSON('n1'), RUTA_FRASES_PEDIDO('n1')]);
  });

  it('sin ninguna elegida no deja pedido (no se le pide a la PC un trabajo vacío)', async () => {
    const subidas: { ruta: string; cuerpo: string }[] = [];
    await publicarFrases(dbFalso(subidas), frasesBase);
    expect(subidas.map((s) => s.ruta)).toEqual([RUTA_FRASES_JSON('n1')]);
    expect(FRASES_CON_AUDIO(frasesBase)).toBe(0);
  });
});
```

- [ ] **Step 2: correr y ver que falla**

Run: `cd fabrica && npx vitest run test/publicar-frases.test.ts`
Expected: FAIL — no existe `src/libro/publicar-frases.js`.

- [ ] **Step 3: implementar**

```ts
// fabrica/src/libro/publicar-frases.ts
// Por qué existe: frases.json es el contrato entre los tres (fábrica, worker de voz y web) y el
// pedido de corte es la forma de encolarlo sin abrir un puerto ni esperar a nadie: el worker
// sondea el paquete, igual que sondeaba `narraciones`.
import type { Db } from '../db.js';
import { descargarTextoOpcional, subirTexto } from './comun.js';
import type { FrasesJson } from './frases.js';

export const RUTA_FRASES_JSON = (narradorId: string) => `${narradorId}/paquete/frases.json`;
export const RUTA_FRASES_PEDIDO = (narradorId: string) => `${narradorId}/paquete/frases_pedido.txt`;
export const FRASES_CON_AUDIO = (frases: FrasesJson) =>
  frases.capitulos.reduce((total, c) => total + c.candidatas.length, 0);

/** Deja el archivo y, si hay algo que cortar, el pedido. Idempotente: se puede volver a correr. */
export async function publicarFrases(db: Db, frases: FrasesJson): Promise<void> {
  await subirTexto(db, RUTA_FRASES_JSON(frases.narrador_id), JSON.stringify(frases, null, 2), 'application/json');
  if (FRASES_CON_AUDIO(frases) > 0) {
    await subirTexto(db, RUTA_FRASES_PEDIDO(frases.narrador_id), new Date().toISOString(), 'text/plain');
  }
}

export async function leerFrases(db: Db, narradorId: string): Promise<FrasesJson | null> {
  const texto = await descargarTextoOpcional(db, RUTA_FRASES_JSON(narradorId));
  if (texto === null) return null;
  try {
    return JSON.parse(texto) as FrasesJson;
  } catch {
    return null; // un archivo roto no puede tumbar la entrega del libro
  }
}
```

- [ ] **Step 4: correr los tests y el typecheck**

Run: `cd fabrica && npx vitest run test/publicar-frases.test.ts && npx tsc --noEmit -p .`
Expected: PASS y typecheck limpio.

- [ ] **Step 5: commit**

```bash
git add fabrica/src/libro/publicar-frases.ts fabrica/test/publicar-frases.test.ts
git commit -m "fabrica: frases.json en el paquete y el pedido de corte para el worker

El pedido es un archivo que el worker sondea: no hay puertos ni llamadas entre
procesos, como el resto del repo."
```

---

### Task 3: el enganche en `generar-paquete.ts` — sale el audiolibro, entra Su voz

**Files:**
- Modify: `fabrica/src/libro/generar-paquete.ts:232-262` (la rama `audiolibro === 'clonada'`)
- Modify: `fabrica/src/libro/generar-paquete.ts:35` (`INSTRUCCION_EDITOR`: sacar «Sus frases» de la
  instrucción al modelo: ahora la escribe la fábrica desde los datos, y no queremos dos)
- Test: `fabrica/test/generar-paquete.test.ts` (agregar al final, no tocar los existentes)

**Interfaces:**
- Consumes: `armarFrasesJson` (Task 1), `publicarFrases` (Task 2), `productosDelPedido(pedido.extras)`,
  `armarMaterial(ordenes, preguntasPorOrden, respuestasPorOrden)` y `esPublicable` de `./comun.js`.
- Produces: el pedido se entrega (nunca queda `esperando_voz`) y el paquete queda con
  `frases.json` + `frases_pedido.txt`. Nada más lo consume: el corte lo completa el worker.

**Review Focus local:** entrada 4 (worker sin contestar). El libro **no espera** a la voz: se
entrega, y la web dirá "Su voz se está preparando" mientras falte algún `audio_path`.

- [ ] **Step 1: escribir los tests que fallan**

```ts
// fabrica/test/generar-paquete.test.ts (agregar al final)
// El arnés ya existe en este archivo: `construirDbFake({...})` (línea 88), `construirBuilder`
// (línea 75) y `blobFake` (línea 68). Se monta igual que el test de entrega que ya está arriba,
// con el pedido en `extras: { pdf: true }` (sin audiolibro).
it('deja frases.json en el paquete y NO pasa el pedido a esperando_voz', async () => {
  const { db, subidas, estadosPedido } = construirDbFake({ /* mismas opciones que el test de entrega */ });
  await generarPaquete(db, narradorId, pedidoId);
  expect(subidas.map((s) => s.ruta)).toContain(`${narradorId}/paquete/frases.json`);
  expect(subidas.map((s) => s.ruta)).toContain(`${narradorId}/paquete/frases_pedido.txt`);
  expect(estadosPedido).not.toContain('esperando_voz');
  expect(estadosPedido.at(-1)).toBe('entregado');
});

it('sin respuestas con audio el paquete igual sale: frases.json vacío y sin pedido de corte', async () => {
  const { db, subidas, estadosPedido } = construirDbFake({ /* narrador sin audios */ });
  await generarPaquete(db, narradorId, pedidoId);
  expect(subidas.map((s) => s.ruta)).toContain(`${narradorId}/paquete/frases.json`);
  expect(subidas.map((s) => s.ruta)).not.toContain(`${narradorId}/paquete/frases_pedido.txt`);
  expect(estadosPedido.at(-1)).toBe('entregado');
});
```

> Si `construirDbFake` no expone hoy `subidas` y `estadosPedido`, el primer paso de esta tarea es
> agregarlos a su valor de retorno (es un cambio de test, no de producción) y correr la suite
> entera para confirmar que los tests existentes siguen verdes.

- [ ] **Step 2: correr y ver que fallan**

Run: `cd fabrica && npx vitest run test/generar-paquete.test.ts -t "frases.json"`
Expected: FAIL — el paquete no tiene `frases.json`.

- [ ] **Step 3: implementar la rama nueva**

```ts
// Reemplaza el bloque `if (productosDelPedido(pedido.extras).audiolibro === 'clonada') { ... }`.
// Por qué: el audiolibro se descartó como producto (ESTADO 20/09). Ahora la fábrica elige las
// mejores frases del narrador —tres por capítulo— y deja el pedido de corte; el audio lo corta
// el worker sobre los audios reales, sin narrar nada.
const frases = await armarFrasesJson(
  {
    narradorId,
    pedidoId: pedido.id,
    capitulos: estructuraFinal.capitulos.map((capitulo, i) => ({
      nombre: capitulo.nombre,
      numero: i + 1,
      material: capitulo.ordenes.flatMap((orden) =>
        (respuestasPorOrden.get(orden) ?? []).map((r) => ({
          orden,
          respuestaId: r.id ?? null,
          audioPath: r.audio_path ?? null,
          texto: textoRespuesta(r) ?? '',
          reserva: { reservada: r.reservada, reservado_tramo: r.reservado_tramo },
        }))
      ),
    })),
  },
  { cliente, proponer: proponerCandidatas, elegir: elegirFinales }
);
await publicarFrases(db, frases);
```

**Ojo con la firma (verificada):** `armarMaterial(ordenes, preguntasPorOrden, respuestasPorOrden)`
**devuelve un `string`** (`fabrica/src/libro/comun.ts:116`), así que para las frases no sirve:
el material se arma recorriendo `capitulo.ordenes` + `respuestasPorOrden` como arriba. Y
`RespuestaPublicable` hoy no trae `audio_path` (solo `id`, `transcripcion`, `texto_directo` y la
reserva): hay que sumarlo (`Partial<Pick<Respuesta, 'id' | 'audio_path'>>`) para que el worker
sepa de qué archivo cortar, con su test en `fabrica/test/comun.test.ts`.

- [ ] **Step 4: correr toda la suite de la fábrica**

Run: `cd fabrica && npx vitest run`
Expected: PASS (los tests de `narracion-json`/`conectores` siguen verdes: ese código queda, sin
uso, hasta que se decida borrarlo).

- [ ] **Step 5: typecheck y commit**

Run: `cd fabrica && npx tsc --noEmit -p .`

```bash
git add fabrica/src/libro/generar-paquete.ts fabrica/src/libro/comun.ts fabrica/test/generar-paquete.test.ts fabrica/test/comun.test.ts
git commit -m "fabrica: el paquete lleva Su voz en vez del audiolibro

El libro no espera a la voz: se entrega, y las frases se completan cuando la PC
las corta. Sale la instruccion de 'Sus frases' al modelo porque ahora la seccion
se escribe desde los datos."
```

---

### Task 4: la sección impresa (frase + QR) y el código de la contratapa

**Files:**
- Modify: `fabrica/src/libro/plantilla-html.ts:943` (`construirHtmlLibro` — la sección va antes de
  las páginas de cierre; el diseño de referencia es `docs/arte-libro/SusFrases.dc.html`)
- Create: `fabrica/src/libro/qr.ts` (QR a data URI, sin dependencias de red)
- Modify: `fabrica/package.json` (agregar `qrcode` + `@types/qrcode`)
- Test: `fabrica/test/qr.test.ts`, `fabrica/test/plantilla-html-frases.test.ts`

**Interfaces:**
- Consumes: `FrasesJson` (Task 1), `RUTA_FRASES_JSON` (Task 2).
- Produces:
  - `qrDataUri(texto: string): Promise<string>` (PNG en base64; sin red)
  - `seccionFrasesHtml(args: { frases: FrasesJson; urlCliente: string }): string` — una sección por
    capítulo con la frase, el botón/QR y el enlace corto; en el PDF el QR es una imagen y el
    texto del enlace va al lado (para quien lo lea impreso sin celular).

**Review Focus local:** entrada 1 (tema repetido entre capítulos) — la sección muestra lo que
dice `frases.json`; el filtro de temas repetidos es del modelo (criterio 5) y se revisa en la
medición de la Task 5.

- [ ] **Step 1: escribir el test que falla (QR y sección)**

```ts
// fabrica/test/qr.test.ts
import { describe, expect, it } from 'vitest';
import { qrDataUri } from '../src/libro/qr.js';

describe('qrDataUri', () => {
  it('devuelve un PNG en data URI para un link', async () => {
    const uri = await qrDataUri('https://www.vitacorafamiliar.com/libro/abc');
    expect(uri.startsWith('data:image/png;base64,')).toBe(true);
    expect(uri.length).toBeGreaterThan(500);
  });
});
```

```ts
// fabrica/test/plantilla-html-frases.test.ts
import { describe, expect, it } from 'vitest';
import { construirHtmlLibro } from '../src/libro/plantilla-html.js';

it('la seccion imprime cada elegida con su capitulo y su QR', async () => {
  const html = await construirHtmlLibro({ /* mismos datos minimos que usa el test de la plantilla */, frases: frasesDePrueba, urlCliente: 'https://x/libro/abc' });
  expect(html).toContain('La infancia');
  expect(html).toContain('Yo nunca quise ser como mi viejo.');
  expect(html.match(/data:image\/png;base64,/g)).toHaveLength(2); // dos elegidas en la prueba
  expect(html).not.toContain('no lo pongas'); // la respuesta reservada no se imprime
});
```

- [ ] **Step 2: correr y ver que falla** — `cd fabrica && npx vitest run test/qr.test.ts`

- [ ] **Step 3: implementar e instalar la dependencia**

```bash
cd fabrica && npm install qrcode && npm install -D @types/qrcode
```

```ts
// fabrica/src/libro/qr.ts
// Por qué existe: el libro impreso lleva un QR por sección y la fábrica no puede depender de un
// servicio web para dibujarlo (el PDF se arma en Railway, sin navegador). `qrcode` es JS puro.
import QRCode from 'qrcode';

export async function qrDataUri(texto: string): Promise<string> {
  return QRCode.toDataURL(texto, { errorCorrectionLevel: 'M', margin: 1, width: 320 });
}
```

- [ ] **Step 4: correr los tests y el typecheck**

Run: `cd fabrica && npx vitest run test/qr.test.ts test/html-frases.test.ts && npx tsc --noEmit -p .`
Expected: PASS y limpio.

- [ ] **Step 5: commit**

```bash
git add fabrica/src/libro/qr.ts fabrica/src/libro/html.ts fabrica/test/qr.test.ts fabrica/test/html-frases.test.ts fabrica/package.json fabrica/package-lock.json
git commit -m "fabrica: la seccion impresa de las mejores frases, con su QR

El QR se dibuja en la fabrica, sin navegador: el PDF se arma en Railway."
```

---

### Task 5: medir con el libro de Joaquín (tokens, costo y calidad) antes de dar por buena la selección

**Files:**
- Create: `fabrica/scripts/prueba-frases.ts`
- Test: no lleva (es un script de medición; se typechea aparte, ver la nota de `voz/README`)

**Interfaces:**
- Consumes: `armarFrasesJson`, `proponerCandidatas`, `elegirFinales` (Task 1); el narrador de
  Joaquín (`3691baf4-ee78-4c6b-9238-4cbed1872be7`) y sus respuestas reales.
- Produces: un `prueba-frases-<narradorId>.json` local con las frases elegidas, los tokens y el
  costo estimado de las dos pasadas.

- [ ] **Step 1: escribir el script**

```ts
// fabrica/scripts/prueba-frases.ts
// Por qué existe: la selección automática se aprueba con datos, no con opinión. Corre el prompt
// REAL contra el libro de Joaquín, imprime tokens y costo, y deja el JSON para leer las frases.
//   npx tsx scripts/prueba-frases.ts <narradorId>
import { writeFile } from 'node:fs/promises';
import Anthropic from '@anthropic-ai/sdk';
import { cargarConfig } from '../src/config.js';
import { obtenerClienteDb } from '../src/db.js';
import { armarFrasesJson, proponerCandidatas, elegirFinales } from '../src/libro/frases.js';
// …leer estructura.json y las respuestas del narrador igual que `generar-paquete.ts`, sumar
// usage.input_tokens/output_tokens de cada llamada e imprimir el costo con la tabla de GASTOS.md.
```

- [ ] **Step 2: correrlo contra el libro de Joaquín**

Run: `cd fabrica && npx tsx scripts/prueba-frases.ts 3691baf4-ee78-4c6b-9238-4cbed1872be7`
Expected: 8 capítulos con 3 elegidas cada uno (o menos, si el capítulo no tiene audios), tokens y
costo por libro impresos en pantalla.

- [ ] **Step 3: leer las frases con Naza y ajustar los criterios**

Las 24 frases y el `por_que` de cada una se le muestran a Naza (regla de la casa: los textos que
ve una persona los aprueba ella). Si hay temas repetidos entre capítulos o alguna frase que
lastima, se ajusta el prompt y se vuelve a medir.

- [ ] **Step 4: typecheck del script (el tsconfig de `fabrica/` no incluye `scripts/`)**

Run: `cd fabrica && npx tsc --noEmit --target es2022 --module nodenext --moduleResolution nodenext --strict --esModuleInterop --skipLibCheck scripts/prueba-frases.ts`
Expected: limpio.

- [ ] **Step 5: commit**

```bash
git add fabrica/scripts/prueba-frases.ts
git commit -m "fabrica: script para medir la seleccion de frases con el libro de Joaquin

Mide tokens y costo de las dos pasadas y deja las frases para leerlas: la
seleccion automatica se aprueba con datos."
```

---

### Task 6: el recordatorio a los 15 días (con su candado)

**Files:**
- Create: `fabrica/src/mail/frases.ts`
- Modify: `fabrica/src/worker.ts` (el tick que ya cierra pedidos a los 30 días, ~318-337)
- Test: `fabrica/test/mail-frases.test.ts`, `fabrica/test/worker.test.ts` (agregar al final)

**Interfaces:**
- Consumes: `leerFrases(db, narradorId)` (Task 2), `RUTA_FRASES_JSON` (Task 2), el cliente de Resend
  y el patrón de candados que ya usa el cierre automático (bitácora 33).
- Produces:
  - `export const RUTA_RECORDATORIO_FRASES = (narradorId: string) => \`${narradorId}/paquete/recordatorio_frases_enviado.txt\`;`
  - `mailRecordatorioFrases(args: { nombre: string; urlPanel: string }): { asunto: string; html: string }`
  - `recordarFrasesPendientes(db: Db, ahora: Date): Promise<number>` — devuelve cuántos mandó.

**Review Focus local:** entrada 4 (worker sin contestar) en su versión de aviso: el recordatorio
se manda una vez y nunca frena ni cambia el estado del pedido.

- [ ] **Step 1: escribir el test que falla (el candado manda)**

```ts
// fabrica/test/worker.test.ts (agregar al final)
it('recuerda las frases una sola vez: si el candado ya está, no manda', async () => {
  const { db, mails, candados } = construirDbFake({ /* pedido entregado hace 20 días, frases.json con confirmado_at: null */ });
  expect(await recordarFrasesPendientes(db, ahora)).toBe(1);
  candados.add(RUTA_RECORDATORIO_FRASES(narradorId));
  expect(await recordarFrasesPendientes(db, ahora)).toBe(0);
  expect(mails).toHaveLength(1);
});

it('no recuerda antes de los 15 días ni después de confirmar', async () => {
  // entregado hace 3 días → 0; confirmado_at con fecha → 0
  expect(await recordarFrasesPendientes(db, ahora)).toBe(0);
});
```

- [ ] **Step 2: correr y ver que falla** — `cd fabrica && npx vitest run test/worker.test.ts -t recordar`

- [ ] **Step 3: implementar el mail y el tick**

```ts
// fabrica/src/mail/frases.ts
// Por qué existe: la familia decide qué frases se imprimen, y ese pedido no puede quedar en el
// olvido. Un solo recordatorio, a los 15 días, y nada más: no frena la entrega ni cambia estados.
export const RUTA_RECORDATORIO_FRASES = (narradorId: string) =>
  `${narradorId}/paquete/recordatorio_frases_enviado.txt`;

export function mailRecordatorioFrases(args: { nombre: string; urlPanel: string }) {
  return {
    asunto: `Las mejores frases de ${args.nombre}: ¿querés elegir vos las que se imprimen?`,
    html: `<p>El libro ya está en tus manos y las frases también están para escuchar.</p>
<p>Si querés cambiar alguna de las que eligió el biógrafo antes de que se imprima la tapa dura,
podés hacerlo desde tu panel: <a href="${args.urlPanel}">${args.urlPanel}</a></p>
<p>Si no querés tocar nada, dejamos las que eligió él.</p>`,
  };
}
```

```ts
// fabrica/src/worker.ts — en el mismo tick del cierre automático (30 días)
// Los textos que ve una persona los aprueba Naza antes de mergear: este mail se le muestra.
const dias = (Date.now() - new Date(pedido.entregado_at as string).getTime()) / 86_400_000;
if (dias >= 15 && frases && frases.confirmado_at === null && !(await existeCandado(db, RUTA_RECORDATORIO_FRASES(narradorId)))) {
  await mandarMail(db, mailRecordatorioFrases({ nombre: narrador.nombre, urlPanel: `${config.urlBase}/tablero` }));
  await subirTexto(db, RUTA_RECORDATORIO_FRASES(narradorId), new Date().toISOString(), 'text/plain');
  enviados++;
}
```

- [ ] **Step 4: correr la suite entera de la fábrica**

Run: `cd fabrica && npx vitest run && npx tsc --noEmit -p .`
Expected: PASS y limpio.

- [ ] **Step 5: commit**

```bash
git add fabrica/src/mail/frases.ts fabrica/src/worker.ts fabrica/test/mail-frases.test.ts fabrica/test/worker.test.ts
git commit -m "fabrica: recordatorio de las frases a los 15 dias, una sola vez

La familia decide que se imprime; el aviso no puede repetirse ni frenar nada,
asi que va con candado como el cierre automatico."
```

### Task 7: el paso de deduplicación entre capítulos (lo que evita el tema repetido)

**Por qué existe:** la Task 1 compara materiales *dentro* de un capítulo. Dos capítulos pueden
elegir la misma anécdota (el campo, el hermano, la fábrica) y la familia la escucha dos veces —
el Review Focus 1 del plan. Mandar el libro entero como contexto en cada capítulo lo evitaría,
pero cuesta ~USD 1,5 por libro (medido: el material de Joaquín son 17,9 k tokens y el escritor
manda el libro completo en cada capítulo): **cinco veces más** que lo que sale todo lo demás.

**Files:**
- Modify: `fabrica/src/libro/frases.ts` (una función más) y su test
- Modify: `fabrica/src/libro/generar-paquete.ts` (llamarla después de `armarFrasesJson`)

**Interfaces:**
- Consumes: `FrasesJson` (Task 1), el mismo cliente del modelo.
- Produces: `deduplicarEntreCapitulos(cliente, frases): Promise<FrasesJson>` — una sola llamada
  con las 24 elegidas (texto corto, ~1 k tokens de entrada) que devuelve qué reemplazar por la
  siguiente candidata del mismo capítulo.

- [ ] **Step 1: escribir el test que falla** (dos capítulos con la misma frase → el segundo cambia
  por su siguiente candidata; si no hay candidata libre, se saca y el capítulo queda con menos)
- [ ] **Step 2: correr y ver que falla** — `cd fabrica && npx vitest run test/frases.test.ts -t dedup`
- [ ] **Step 3: implementar** (una llamada, `max_tokens: 1000`, con el JSON de textos e índices)
- [ ] **Step 4: correr la suite y el typecheck** — `npx vitest run && npx tsc --noEmit -p .`
- [ ] **Step 5: commit** — `fabrica: las frases no se repiten entre capitulos (una llamada barata)`

**Costo:** ~USD 0,05 por libro (1 k de entrada, 200 de salida). Total del archivo: **~USD 0,40**.

---

## Entregables que salen de este plan (no son código)

**A. Directiva a la PC de música (`central/2026-09-21-08-cortar-frases.md`, la sube Naza o el
agente a cargo):** leer `{narrador}/paquete/frases_pedido.txt`; bajar `frases.json`; por cada
candidata, alinear el `texto` contra las marcas de palabra de Whisper (caché por hash del audio
que ya existe), cortar, **restaurar (`RESTAURACION_NIVEL`) y masterizar a −19 LUFS**, **sin
ritmo, sin pausas, sin cambiar velocidad** (es tal cual lo dijo); subir
`{narrador}/voz/frases/cNN_MM.mp3` y completar `audio_path`, `segundos`, `inicio`, `fin`,
`estado: 'cortada'`; borrar el pedido al terminar. Sin audios utilizables: no se hace nada.

**B. Mensaje para Joaquín (web):** sacar "El audiolibro" del checkout y su copy (incluida la de
`/libro/[token]`, que dice "con el audiolibro en su propia voz"); agregar
`/tablero/[narradorId]/frases` (escuchar y cambiar, hermana de `nombres`); la página del cliente
con token propio `tipo: 'voz'` (libro online + pestaña de frases, sin login; el QR y el chip caen
en la pestaña); la descarga del base; leer `frases.json` del paquete.

**C. Lo que queda sin uso (no se borra en este plan):** `narracion.json` v2 y su armado,
`conectores.ts`, la tabla `narraciones` y el estado `esperando_voz` quedan como están; se
documentan como sin uso en `CONTRATO.md` cuando Joaquín dé el OK. La corrida híbrida del 20/09
queda como veredicto de oído.
