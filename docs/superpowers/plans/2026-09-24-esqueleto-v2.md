# Esqueleto v2 — plan de implementación

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Reemplazar el biógrafo libre del v2 (variables por peso de bisagras, puerta abierta) por un guion fijo de temas con condición (`docs/esqueleto-v2-guion-para-aprobar.md`), con la ficha acotada, la repregunta que junta lo que faltó, modelos por paso y el prompt que no crece; todo probado con la puerta manual v2.

**Architecture:** El guion (`guion-v2.ts`) es una lista de filas con `aplica` que se evalúa en código contra la ficha (`arbolDe`); `armarGuion(perfil)` devuelve los objetivos en orden, expandidos por persona y recortados al techo. `secuencia.ts` deja de planificar: guarda pendientes/hechas/cubiertos/caídas/objetos y agrega una pregunta libre al cerrar cada etapa desde `noSabemos`. El perfil (`perfil.ts`) gana topes y `noTuvo`; la evaluación (`evaluar-v2.ts`) devuelve qué faltó y la repregunta la escribe `escribirPregunta` (Opus) con un objetivo `repregunta`. La forma de `contexto.v2` que lee la fábrica (`secuencia.hechas[].objetivo.{tipo,tramo,bloque}`, `objetos`) no cambia.

**Tech Stack:** TypeScript (ESM, Node 24), vitest, `@anthropic-ai/sdk`, Supabase (PostgREST). Se corre desde `entrevistador/`.

## Global Constraints

- Trabajar SOLO en el worktree `C:\Users\Naza\Desktop\VITACORA FAMILIAR-biografo`. Nunca checkout en la carpeta principal. Rama nueva `esqueleto-v2` desde `biografo-v2-fabrica`; push a `origin esqueleto-v2`; nunca a `main`.
- Leer `HERMES.md` antes de empezar. Commits en castellano rioplatense con `Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>` (el agente que ejecuta).
- **No correr nada pago**: ni la puerta manual contra el modelo, ni el libro. Todos los tests usan cliente falso. El piloto lo dispara Naza al final, avisando el costo (~USD 4-5).
- **Nunca imprimir keys** (el `.env` de `entrevistador/` tiene `SUPABASE_SERVICE_ROLE_KEY` y `ANTHROPIC_API_KEY`).
- Tests: `cd entrevistador && npx vitest run <archivo>`; tipos: `cd entrevistador && npm run tipos`. La suite entera (`npm test`) tiene que quedar verde al final de cada tarea. La fábrica no se toca; al final se corre `cd fabrica && npx vitest run` para confirmar que sigue verde.
- Modelos por paso (decidido por Naza el 24/09): pregunta y repregunta `claude-opus-5`; ficha y evaluación `claude-sonnet-5`; evaluación reducida de repreguntas/objetos `claude-haiku-4-5`. Precios (USD por millón): Sonnet 5 entrada 2, salida 10, caché escritura 2,5, lectura 0,2.
- Techo de preguntas: 40; 44 si la persona tiene 56 o más. Libres: hasta 4, sin pasar el techo.
- Ficha con topes: etapa (cada campo) ≤ 300 caracteres, bisagra ≤ 150 y máximo 12, nota de persona ≤ 80 y máximo 30 personas, `noSabemos` ≤ 12, `tono` ≤ 300. `perfilEnTexto` de la ficha real del piloto de Naza ≤ 5.750 caracteres (≈ 2.500 tokens a 2,3 caracteres por token, medido en el piloto).
- Los textos que ve la persona y los prompts los aprueba Naza antes del piloto (Tarea 12 los renderiza en un doc).
- Ids de filas y textos de tema: **copiar del guion aprobado** (`docs/esqueleto-v2-guion-para-aprobar.md`, §3). Si algo del guion no cabe en el código, se anota en el reporte de la tarea, no se inventa.

## Mapa de archivos

| Archivo | Responsabilidad | Tarea |
|---|---|---|
| `entrevistador/src/ia/modelos-v2.ts` (nuevo) | los cuatro modelos por paso, en un solo lugar | 1 |
| `entrevistador/src/costos.ts` | precio de Sonnet 5 | 1 |
| `entrevistador/src/ia/perfil.ts` | topes, `noTuvo`, `corregirBisagras`, prompt de la ficha (Sonnet), sin `puertaAbierta` | 2 |
| `entrevistador/scripts/exportar-perfil-v2.ts` (nuevo) + `entrevistador/test/fixtures/perfil-naza-piloto.json` | la ficha real del piloto como fixture | 3 |
| `entrevistador/src/ia/guion-v2.ts` (nuevo) | `GUION`, `arbolDe`, `armarGuion`, techo, historia grande | 4 |
| `entrevistador/src/ia/pregunta-v2.ts` | `NUCLEO` desde el guion, `Objetivo` con `repregunta`, `objetivoEnTexto`, prompt con temas hechos (no textos), `max_tokens` | 5 |
| `entrevistador/src/ia/plan-preguntas.ts` | queda solo la tabla de tramos y las edades; se va el plan por peso | 6 |
| `entrevistador/src/ia/secuencia.ts` | secuencia fija: armar, rearmar, cubiertos, caídas, libres, objetos | 7 |
| `entrevistador/src/ia/evaluar-v2.ts` + `control-pregunta.ts` | evaluación con `falto` (Sonnet), `evaluarPedidos` (Haiku), control de lugar para repreguntas | 8 |
| `entrevistador/src/ia/encargo-entrevista.ts` | regla 7 reescrita, regla 2 con los temas hechos | 9 |
| `entrevistador/src/manual/estado-v2.ts` | estado sin plan: `firmaGuion`, `rearmarSiHaceFalta`, `yaHechasDe` por tema, conversación de 3, decisión de repregunta por etapa | 10 |
| `entrevistador/scripts/manual-v2.ts` | cableado: ficha → rearmar → cubiertos → evaluar/pedidos → repregunta con Opus; libres al cerrar etapa; `estado` muestra caídas | 11 |
| `supabase/CONTRATO.md`, `HERMES.md`, `docs/esqueleto-v2-textos-para-aprobar.md` (nuevo), `entrevistador/scripts/render-textos-v2.ts` (nuevo) | contrato, modelos, y los prompts renderizados para que Naza los apruebe | 12 |

---

### Task 0: La rama

**Files:** ninguno.

- [ ] **Step 1: Crear la rama desde la de trabajo, en el worktree**

```bash
cd "/c/Users/Naza/Desktop/VITACORA FAMILIAR-biografo"
git pull
git checkout -b esqueleto-v2 biografo-v2-fabrica
cd entrevistador && npm test
```

Expected: la suite del entrevistador en verde (553 tests al 24/09) y tipos limpios. Si algo falla antes de tocar nada, anotarlo y seguir: no es de esta tarea.

---

### Task 1: Los modelos por paso y el precio de Sonnet 5

**Files:**
- Create: `entrevistador/src/ia/modelos-v2.ts`
- Modify: `entrevistador/src/costos.ts:26-30`
- Test: `entrevistador/test/costos.test.ts`, `entrevistador/test/modelos-v2.test.ts` (nuevo)

**Interfaces:**
- Produces: `MODELO_PREGUNTA`, `MODELO_FICHA`, `MODELO_EVALUACION`, `MODELO_PEDIDOS` (strings) y `type PasoV2 = 'v2-presentacion' | 'v2-pregunta' | 'v2-repregunta' | 'v2-objeto' | 'v2-perfil' | 'v2-evaluar' | 'v2-pedidos'` con `modeloDePaso(paso: PasoV2): string`. Todas las tareas que llaman al modelo importan de acá.

- [ ] **Step 1: Test del precio y de los modelos por paso**

Agregar en `entrevistador/test/costos.test.ts`, dentro de `describe('calcularUsd')`:

```ts
  it('cobra sonnet-5 (la ficha y la evaluación del esqueleto v2): 2 de entrada, 10 de salida, caché 2,5 / 0,2', () => {
    expect(calcularUsd('claude-sonnet-5', { input_tokens: 1_000_000, output_tokens: 1_000_000 })).toBe(12);
    expect(calcularUsd('claude-sonnet-5', { cache_creation_input_tokens: 1_000_000, cache_read_input_tokens: 1_000_000 })).toBe(2.7);
  });
```

Crear `entrevistador/test/modelos-v2.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { MODELO_PREGUNTA, MODELO_FICHA, MODELO_EVALUACION, MODELO_PEDIDOS, modeloDePaso } from '../src/ia/modelos-v2.js';
import { PRECIOS_USD_POR_MILLON } from '../src/costos.js';

describe('modelos del esqueleto v2 (decisión de Naza, 24/09)', () => {
  it('Opus escribe; Sonnet lee la ficha y evalúa; Haiku solo mira pedidos', () => {
    expect(MODELO_PREGUNTA).toBe('claude-opus-5');
    expect(MODELO_FICHA).toBe('claude-sonnet-5');
    expect(MODELO_EVALUACION).toBe('claude-sonnet-5');
    expect(MODELO_PEDIDOS).toBe('claude-haiku-4-5');
  });
  it('cada paso tiene su modelo y todos tienen precio cargado', () => {
    expect(modeloDePaso('v2-pregunta')).toBe(MODELO_PREGUNTA);
    expect(modeloDePaso('v2-repregunta')).toBe(MODELO_PREGUNTA);
    expect(modeloDePaso('v2-presentacion')).toBe(MODELO_PREGUNTA);
    expect(modeloDePaso('v2-objeto')).toBe(MODELO_PREGUNTA);
    expect(modeloDePaso('v2-perfil')).toBe(MODELO_FICHA);
    expect(modeloDePaso('v2-evaluar')).toBe(MODELO_EVALUACION);
    expect(modeloDePaso('v2-pedidos')).toBe(MODELO_PEDIDOS);
    for (const m of [MODELO_PREGUNTA, MODELO_FICHA, MODELO_EVALUACION, MODELO_PEDIDOS]) expect(PRECIOS_USD_POR_MILLON[m]).toBeDefined();
  });
});
```

- [ ] **Step 2: Correr y ver que falla**

Run: `cd entrevistador && npx vitest run test/costos.test.ts test/modelos-v2.test.ts`
Expected: FAIL (`Cannot find module '../src/ia/modelos-v2.js'`; y `calcularUsd('claude-sonnet-5', …)` da 0 con un warning).

- [ ] **Step 3: Implementar**

En `entrevistador/src/costos.ts`, dentro de `PRECIOS_USD_POR_MILLON`, agregar después de `'claude-opus-5'`:

```ts
  'claude-sonnet-5': { input: 2, output: 10, cache_write: 2.5, cache_read: 0.2 },
```

Crear `entrevistador/src/ia/modelos-v2.ts`:

```ts
// Los modelos del esqueleto v2, por paso (decisión de Naza, 24/09, `docs/esqueleto-v2-guion-para-aprobar.md` §6).
// Opus donde se nota (lo que lee la persona); Sonnet donde es extracción o juicio con la ficha; Haiku
// donde solo se buscan pedidos (reserva, dejar, hoy no, parar). Un solo lugar: el gasto se anota con
// el modelo que de verdad se usó (`anotarUsos` en manual-v2.ts).

export const MODELO_PREGUNTA = 'claude-opus-5';
export const MODELO_FICHA = 'claude-sonnet-5';
export const MODELO_EVALUACION = 'claude-sonnet-5';
export const MODELO_PEDIDOS = 'claude-haiku-4-5';

export type PasoV2 = 'v2-presentacion' | 'v2-pregunta' | 'v2-repregunta' | 'v2-objeto' | 'v2-perfil' | 'v2-evaluar' | 'v2-pedidos';

export function modeloDePaso(paso: PasoV2): string {
  switch (paso) {
    case 'v2-perfil': return MODELO_FICHA;
    case 'v2-evaluar': return MODELO_EVALUACION;
    case 'v2-pedidos': return MODELO_PEDIDOS;
    default: return MODELO_PREGUNTA;
  }
}
```

- [ ] **Step 4: Correr y ver que pasa**

Run: `cd entrevistador && npx vitest run test/costos.test.ts test/modelos-v2.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add entrevistador/src/ia/modelos-v2.ts entrevistador/src/costos.ts entrevistador/test/costos.test.ts entrevistador/test/modelos-v2.test.ts
git commit -m "esqueleto v2: los modelos por paso en un solo lugar y el precio de Sonnet 5"
```

---

### Task 2: La ficha con topes, `noTuvo` y corregir que pisa

**Files:**
- Modify: `entrevistador/src/ia/perfil.ts` (tipo `Perfil`, `perfilVacio`, `perfilDesdeFicha`, `CambiosDePerfil`, `aplicarCambios`, `PROMPT_PERFIL`, `actualizarPerfil`)
- Test: `entrevistador/test/perfil.test.ts`

**Interfaces:**
- Produces: `Perfil.noTuvo: string[]` (vínculos que dijo no tener: `'hijos' | 'pareja' | 'hermanos' | 'nietos'`); `TOPES`; `recortarPerfil(p: Perfil): Perfil` (puro, idempotente); `CambiosDePerfil.corregirBisagras?: { i: number; texto: string }[]`, `CambiosDePerfil.noTuvo?: string[]`; `actualizarPerfil` usa `MODELO_FICHA`. `puertaAbierta` queda en el tipo (siempre `null`) para no romper `contexto.v2` guardado; el prompt ya no lo pide.
- Consumes: `MODELO_FICHA` (Tarea 1).

- [ ] **Step 1: Tests de topes, `noTuvo` y corregir bisagras**

Agregar al final de `entrevistador/test/perfil.test.ts` (los `import` de arriba ya traen `aplicarCambios`, `perfilVacio`, `perfilDesdeFicha`, `armarPromptPerfil`; sumar `recortarPerfil, TOPES` al import de `'../src/ia/perfil.js'`):

```ts
describe('la ficha con topes (esqueleto v2: el perfil del piloto llegó a 12.700 tokens)', () => {
  const largo = (n: number, sep = '. ') => Array.from({ length: n }, (_, i) => `Oración número ${i} de la etapa`).join(sep) + '.';
  it('recorta cada campo de una etapa a 300 caracteres cortando en una oración entera', () => {
    const p = perfilVacio();
    p.etapas.push({ edades: '0 a 12', lugar: 'Martínez', conQuien: 'sus padres', queHacia: largo(40), fuente: 'dicho' });
    const r = recortarPerfil(p);
    expect(r.etapas[0].queHacia.length).toBeLessThanOrEqual(TOPES.etapaCampo);
    expect(r.etapas[0].queHacia.endsWith('.')).toBe(true);
    expect(recortarPerfil(r)).toEqual(r);
  });
  it('bisagras: ≤ 150 caracteres cada una y ≤ 12 en total (se quedan las que tienen edad, después las más nuevas)', () => {
    const p = perfilVacio();
    p.bisagras = [...Array.from({ length: 10 }, (_, i) => `A los ${i + 5} pasó la cosa ${i}`), 'Se fue a España sin decir cuándo', 'Dejó la facultad', 'Volvió al Fátima ' + largo(6, ', ')];
    const r = recortarPerfil(p);
    expect(r.bisagras).toHaveLength(TOPES.bisagras);
    expect(r.bisagras.filter((b) => /^A los/.test(b))).toHaveLength(10);
    expect(r.bisagras.every((b) => b.length <= TOPES.bisagra)).toBe(true);
  });
  it('personas: la nota a 80 caracteres, y de más de 30 se quedan primero los familiares', () => {
    const p = perfilVacio();
    p.personas.push({ nombre: 'Ariel', vinculo: 'hermano mayor', vive: 'si', fuente: 'dicho', nota: largo(5) });
    for (let i = 0; i < 32; i++) p.personas.push({ nombre: `Amigo ${i}`, vinculo: 'amigo del colegio', vive: 'no se sabe', fuente: 'dicho' });
    p.personas.push({ nombre: 'Meri', vinculo: 'madre', vive: 'si', fuente: 'dicho' });
    const r = recortarPerfil(p);
    expect(r.personas).toHaveLength(TOPES.personas);
    expect(r.personas[0].nota!.length).toBeLessThanOrEqual(TOPES.notaPersona);
    expect(r.personas.map((x) => x.nombre)).toEqual(expect.arrayContaining(['Ariel', 'Meri']));
  });
  it('noSabemos: se quedan los 12 más nuevos; el tono a 300', () => {
    const p = perfilVacio();
    p.noSabemos = Array.from({ length: 20 }, (_, i) => `[infancia] cosa ${i}`);
    p.tono = largo(12);
    const r = recortarPerfil(p);
    expect(r.noSabemos).toHaveLength(TOPES.noSabemos);
    expect(r.noSabemos[0]).toBe('[infancia] cosa 8');
    expect(r.tono.length).toBeLessThanOrEqual(TOPES.tono);
  });
  it('aplicarCambios recorta siempre: una etapa gigante no entra entera', () => {
    const p = aplicarCambios(perfilVacio(), { agregarEtapas: [{ edades: '0 a 12', lugar: largo(30), conQuien: '', queHacia: '', fuente: 'dicho' }] });
    expect(p.etapas[0].lugar.length).toBeLessThanOrEqual(TOPES.etapaCampo);
  });
});

describe('noTuvo y corregir bisagras (esqueleto v2)', () => {
  it('la ficha "no tuvo hijos" queda en noTuvo (y ya no como texto en noSabemos)', () => {
    const p = perfilDesdeFicha({ arbol: { hijos: 'no tuvo', conyuge: 'Rubén' } }, 'America/Argentina/Buenos_Aires');
    expect(p.noTuvo).toEqual(['hijos']);
    expect(p.noSabemos.some((n) => /no tuvo/.test(n))).toBe(false);
    expect(p.personas[0]).toMatchObject({ nombre: 'Rubén', vinculo: 'conyuge' });
  });
  it('el modelo suma noTuvo sin repetir y solo con vínculos conocidos', () => {
    const p = aplicarCambios(perfilVacio(), { noTuvo: ['pareja', 'pareja', 'mascotas' as never, 'nietos'] });
    expect(p.noTuvo).toEqual(['pareja', 'nietos']);
  });
  it('corregirBisagras pisa la fila por su número (N34, N40: antes quedaban las dos)', () => {
    const base = aplicarCambios(perfilVacio(), { agregarBisagras: ['A los 18 se fue a vivir solo', 'A los 22 se fue a España'] });
    const p = aplicarCambios(base, { corregirBisagras: [{ i: 0, texto: 'A los 22 se mudó por primera vez, con Ciano, a Nordelta' }, { i: 9, texto: 'no existe' }] });
    expect(p.bisagras).toEqual(['A los 22 se mudó por primera vez, con Ciano, a Nordelta', 'A los 22 se fue a España']);
  });
  it('una bisagra nueva con la misma edad y las mismas palabras clave reemplaza a la vieja en vez de sumarse', () => {
    const base = aplicarCambios(perfilVacio(), { agregarBisagras: ['A los 8 pasó del Saint John\'s al Fátima porque la familia se vino a menos'] });
    const p = aplicarCambios(base, { agregarBisagras: ['A los 8 pasó del Saint John\'s al Fátima: le dijeron que era por las materias'] });
    expect(p.bisagras).toHaveLength(1);
    expect(p.bisagras[0]).toMatch(/materias/);
  });
  it('el prompt pide etapas cortas, una bisagra por vuelta de vida, corregirBisagras, noTuvo, noSabemos con la etapa entre corchetes, y ya no pide puertaAbierta', () => {
    const prompt = armarPromptPerfil(perfilVacio(), 'P', 'R', [{ id: 'padres-como-eran', tema: 'Cómo eran' }]);
    expect(prompt).toMatch(/dos oraciones/i);
    expect(prompt).toMatch(/vuelta de vida/i);
    expect(prompt).toContain('"corregirBisagras"');
    expect(prompt).toContain('"noTuvo"');
    expect(prompt).toMatch(/\[infancia\]/);
    expect(prompt).not.toContain('puertaAbierta');
  });
});
```

Y en el test existente `'cubiertos se acumulan sin repetir; puertaAbierta y hoyFueFuerte son de hoy, no se arrastran'` (línea ~126) y en `'una puerta abierta que no es un tema conocido se ignora'` (~137): borrar las aserciones sobre `puertaAbierta` (queda siempre `null`); en `'pide la edad en cifras, corregir por número, y devuelve cubiertos / puerta abierta / hoy fue fuerte…'` (~185) sacar `expect(prompt).toContain('"puertaAbierta"')`.

- [ ] **Step 2: Correr y ver que falla**

Run: `cd entrevistador && npx vitest run test/perfil.test.ts`
Expected: FAIL (`recortarPerfil` no existe; `noTuvo` undefined; corregirBisagras ignorado).

- [ ] **Step 3: Implementar en `perfil.ts`**

En el tipo `Perfil`, después de `noSabemos: string[];`:

```ts
  /** Vínculos que dijo NO tener ("no tuve hijos", "nunca me casé"): el guion no pregunta por ellos ni los supone. */
  noTuvo: string[];
```

En `perfilVacio`, agregar `noTuvo: [],` después de `noSabemos`. En `perfilDesdeFicha`, reemplazar el bloque `if (nombre.trim().toLowerCase() === 'no tuvo') { … continue; }` por:

```ts
    if (nombre.trim().toLowerCase() === 'no tuvo') {
      const v = vinculoNoTuvo(vinculo);
      if (v && !p.noTuvo.includes(v)) p.noTuvo.push(v);
      continue;
    }
```

Arriba de `perfilDesdeFicha` (después de `ESTADO_CIVIL_A_PREGUNTAR`):

```ts
export const VINCULOS_NO_TUVO = ['hijos', 'pareja', 'hermanos', 'nietos'] as const;
/** "hijos", "conyuge", "esposo" → el vínculo del guion; otra cosa → null. */
export function vinculoNoTuvo(vinculo: string): (typeof VINCULOS_NO_TUVO)[number] | null {
  const v = vinculo.toLowerCase();
  if (/hij/.test(v)) return 'hijos';
  if (/conyug|espos|marido|mujer|pareja|novi/.test(v)) return 'pareja';
  if (/herman/.test(v)) return 'hermanos';
  if (/niet/.test(v)) return 'nietos';
  return null;
}

/** Los topes de la ficha (esqueleto v2, guion §2): la ficha es una ficha, no una transcripción. */
export const TOPES = { etapaCampo: 300, bisagra: 150, bisagras: 12, notaPersona: 80, personas: 30, noSabemos: 12, tono: 300 } as const;

/** Corta en la última oración entera que entra; si no hay ninguna, corta seco. Idempotente. */
export function recortar(texto: string, max: number): string {
  const t = texto.trim();
  if (t.length <= max) return t;
  const corte = t.slice(0, max);
  const fin = Math.max(corte.lastIndexOf('. '), corte.lastIndexOf('; '));
  return fin > max * 0.4 ? corte.slice(0, fin + 1) : corte.trimEnd();
}

const ES_FAMILIAR = /padre|madre|papá|mamá|papa|mama|herman|hij|niet|sobrin|abuel|conyug|espos|marido|mujer|pareja|novi|tío|tía|prim/;

/** Aplica los TOPES. Puro e idempotente: se llama después de cada cambio y sobre lo guardado. */
export function recortarPerfil(p: Perfil): Perfil {
  const r: Perfil = structuredClone(p);
  r.etapas = r.etapas.map((e) => ({ ...e, lugar: recortar(e.lugar, TOPES.etapaCampo), conQuien: recortar(e.conQuien, TOPES.etapaCampo), queHacia: recortar(e.queHacia, TOPES.etapaCampo) }));
  const conEdad = r.bisagras.filter((b) => /^a los \d/i.test(b));
  const sinEdad = r.bisagras.filter((b) => !/^a los \d/i.test(b));
  r.bisagras = [...conEdad, ...sinEdad.slice(-Math.max(0, TOPES.bisagras - conEdad.length))].slice(-TOPES.bisagras).map((b) => recortar(b, TOPES.bisagra));
  r.personas = r.personas.map((x) => (x.nota ? { ...x, nota: recortar(x.nota, TOPES.notaPersona) } : x));
  if (r.personas.length > TOPES.personas) {
    const familia = r.personas.filter((x) => ES_FAMILIAR.test(x.vinculo.toLowerCase()));
    const resto = r.personas.filter((x) => !ES_FAMILIAR.test(x.vinculo.toLowerCase()));
    r.personas = [...familia, ...resto].slice(0, TOPES.personas);
  }
  r.noSabemos = r.noSabemos.slice(-TOPES.noSabemos);
  r.tono = recortar(r.tono, TOPES.tono);
  r.noTuvo = [...new Set((r.noTuvo ?? []).filter((v): v is (typeof VINCULOS_NO_TUVO)[number] => (VINCULOS_NO_TUVO as readonly string[]).includes(v)))];
  return r;
}
```

En `CambiosDePerfil`, después de `agregarBisagras?: string[];`:

```ts
  /** Corrige una bisagra por su número (el texto entero nuevo). Corregir pisa, no agrega (N34, N40). */
  corregirBisagras?: { i: number; texto: string }[];
  /** Vínculos que hoy dijo no tener: "hijos" | "pareja" | "hermanos" | "nietos". */
  noTuvo?: string[];
```

En `aplicarCambios`, reemplazar la línea `p.bisagras = sinRepetir([...p.bisagras, ...lista<string>(cambios.agregarBisagras)]);` por:

```ts
  for (const c of lista<{ i: number; texto: string }>(cambios.corregirBisagras)) {
    if (esObjeto(c) && typeof c.texto === 'string' && c.texto.trim() && p.bisagras[c.i] !== undefined) p.bisagras[c.i] = c.texto.trim();
  }
  for (const nueva of lista<string>(cambios.agregarBisagras)) {
    if (typeof nueva !== 'string' || !nueva.trim()) continue;
    const gemela = p.bisagras.findIndex((vieja) => mismaVuelta(vieja, nueva));
    if (gemela >= 0) p.bisagras[gemela] = nueva.trim();
    else p.bisagras.push(nueva.trim());
  }
  p.bisagras = sinRepetir(p.bisagras);
  p.noTuvo = sinRepetir([...(p.noTuvo ?? []), ...lista<string>(cambios.noTuvo)]);
```

y cambiar el `return p;` final por `return recortarPerfil(p);`. Arriba de `aplicarCambios`:

```ts
const palabrasClave = (t: string) => new Set(t.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').match(/[a-z]{5,}/g) ?? []);
/** Dos bisagras son la misma vuelta de vida si tienen la misma edad ("A los N") y comparten la mitad de sus palabras largas. */
export function mismaVuelta(a: string, b: string): boolean {
  const ea = /^a los (\d+)/i.exec(a)?.[1], eb = /^a los (\d+)/i.exec(b)?.[1];
  if (!ea || ea !== eb) return false;
  const pa = palabrasClave(a), pb = palabrasClave(b);
  if (!pa.size || !pb.size) return false;
  const comunes = [...pa].filter((w) => pb.has(w)).length;
  return comunes >= Math.min(pa.size, pb.size) / 2;
}
```

En `PROMPT_PERFIL`: reemplazar las reglas 6, 9, 11, 12 y 13 y el JSON de salida por:

```
6. La línea de tiempo: etapas con edades (o años), lugar, con quién vivía y qué hacía, en DOS
   ORACIONES como mucho por campo. No reescribas una etapa que ya está: corregí por su número
   solo lo que cambió. Si algo pasó en otra ciudad, que quede claro dónde.
9. Las bisagras son las VUELTAS DE VIDA (una mudanza, una pérdida, un cambio de país, dejar un
   trabajo), no cada anécdota: como mucho una por respuesta, de hasta 25 palabras, y empiezan con
   la edad ("A los 12 se fue a Buenos Aires"). Una anécdota va en "queHacia" de su etapa, corta.
11. Si hoy corrigió algo ("está viva", "no fue en Concordia", "se llamaba Homero", "no me fui a
    vivir solo a los 18"), corregilo en la fila que ya existe, por su número, con "corregirEtapas",
    "corregirPersonas" o "corregirBisagras": no agregues otra al lado.
12. "cubiertos": los ids de los temas pendientes que HOY contó con detalle sin que se los
    preguntaran (una escena, nombres). Si solo los nombró al pasar, no.
13. "noTuvo": si hoy dijo que NO tuvo hijos, pareja, hermanos o nietos, el vínculo ("hijos",
    "pareja", "hermanos", "nietos"). Nunca por deducción: solo si lo dijo.
```

(la 14 y la 15 quedan como están) y agregar:

```
16. "agregarNoSabemos": solo lo que conviene preguntar después, como mucho 3 por respuesta, y
    cada uno empieza con la etapa entre corchetes: [infancia], [juventud], [adulto joven],
    [adultez media], [segunda mitad] o [hoy]. Lo que hoy se contestó va en "resueltos".
```

JSON de salida (reemplaza el bloque entero):

```
{"persona":{"edad":D,"genero":D,"comoHabla":D,"anioNacimiento":D,"dondeViveHoy":D,"comoLeDicen":D},
 "agregarEtapas":[{"edades":"","anios":"","lugar":"","conQuien":"","queHacia":"","fuente":""}],
 "corregirEtapas":[{"i":0,"lugar":"..."}],
 "agregarPersonas":[{"nombre":"","vinculo":"","vive":"si|no|no se sabe","fuente":"","nota":""}],
 "corregirPersonas":[{"i":0,"vive":"si","nota":"..."}],
 "agregarBisagras":["A los 12 se fue a vivir con el padre a Buenos Aires"],
 "corregirBisagras":[{"i":0,"texto":"A los 22 se mudó por primera vez"}],"tono":"(solo si cambió)",
 "resueltos":["(el texto de noSabemos que hoy se resolvió, tal cual)"],"agregarNoSabemos":["[juventud] ..."],
 "cubiertos":["id"],"noTuvo":["hijos"],"hoyFueFuerte":false}
```

En `actualizarPerfil`: `import { MODELO_FICHA } from './modelos-v2.js';`, usar `model: MODELO_FICHA` y borrar `MODELO_PERFIL` (grep: nadie más lo importa; si alguien lo importa, dejar `export const MODELO_PERFIL = MODELO_FICHA;`). `max_tokens: 4000` (Sonnet piensa por defecto y la salida ya no trae etapas enteras).

- [ ] **Step 4: Correr y ver que pasa; tipos**

Run: `cd entrevistador && npx vitest run test/perfil.test.ts && npm run tipos`
Expected: PASS y tipos limpios. Si `tipos` se queja de `noTuvo` faltante en fixtures de otros tests que arman un `Perfil` a mano (`grep -rn "noSabemos: \[" test/`), agregarles `noTuvo: []`.

- [ ] **Step 5: Commit**

```bash
git add entrevistador/src/ia/perfil.ts entrevistador/test/perfil.test.ts
git commit -m "esqueleto v2: la ficha con topes, noTuvo y corregir que pisa (la bisagra repetida y la etapa de 1.700 caracteres)"
```

---

### Task 3: La ficha real del piloto como fixture, y el test del tamaño

**Files:**
- Create: `entrevistador/scripts/exportar-perfil-v2.ts`, `entrevistador/test/fixtures/perfil-naza-piloto.json`
- Test: `entrevistador/test/perfil-tamano.test.ts` (nuevo)

**Interfaces:**
- Produces: el fixture (un `Perfil` tal como quedó en `narradores.contexto.v2.perfil` del narrador `ea17b848-760a-416a-935c-51f186c7b0ef`). Lo usan las Tareas 4, 5 y 12.

- [ ] **Step 1: El script que exporta (lee la base, no llama al modelo, no imprime keys)**

Crear `entrevistador/scripts/exportar-perfil-v2.ts`:

```ts
/**
 * Exporta la ficha (contexto.v2.perfil) de un narrador v2 a un JSON, para usarla de fixture.
 * Uso (desde entrevistador/, con .env): npx tsx scripts/exportar-perfil-v2.ts <narrador_id> <salida.json>
 * No llama al modelo. No imprime nada de .env.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const AQUI = dirname(fileURLToPath(import.meta.url));
for (const linea of readFileSync(resolve(AQUI, '..', '.env'), 'utf8').split('\n')) {
  const m = linea.match(/^\s*([A-Z_][A-Z0-9_]*)\s*=\s*(.*)$/);
  if (m && !process.env[m[1]]) process.env[m[1]] = m[2].trim().replace(/^["']|["']$/g, '');
}
const [id, salida] = process.argv.slice(2);
if (!id || !salida) throw new Error('Uso: exportar-perfil-v2.ts <narrador_id> <salida.json>');
const url = process.env.SUPABASE_URL!, key = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const r = await fetch(`${url}/rest/v1/narradores?id=eq.${id}&select=contexto`, { headers: { apikey: key, Authorization: `Bearer ${key}` } });
const filas = (await r.json()) as { contexto?: { v2?: { perfil?: unknown } } }[];
const perfil = filas[0]?.contexto?.v2?.perfil;
if (!perfil) throw new Error(`El narrador ${id} no tiene contexto.v2.perfil`);
writeFileSync(resolve(salida), JSON.stringify(perfil, null, 2));
console.log(`Ficha exportada a ${salida} (${JSON.stringify(perfil).length} caracteres).`);
```

- [ ] **Step 2: Correrlo una vez (lee la base; no es pago)**

```bash
cd entrevistador && mkdir -p test/fixtures && npx tsx scripts/exportar-perfil-v2.ts ea17b848-760a-416a-935c-51f186c7b0ef test/fixtures/perfil-naza-piloto.json
```

Expected: `Ficha exportada … (~48.800 caracteres)`. Es la vida de Naza en un JSON dentro del repo privado; Naza lo pidió como fixture (24/09). Si no hay `.env` o falla la red, avisar en el reporte y saltear esta tarea: las Tareas 4 y 5 tienen tests que no dependen del fixture y este test usa `it.skipIf`.

- [ ] **Step 3: El test del tamaño**

Crear `entrevistador/test/perfil-tamano.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { existsSync, readFileSync } from 'node:fs';
import { recortarPerfil, type Perfil } from '../src/ia/perfil.js';
import { perfilEnTexto } from '../src/ia/encargo-entrevista.js';

const RUTA = new URL('./fixtures/perfil-naza-piloto.json', import.meta.url);
/** Medido en el piloto: 64.116 caracteres → 27.654 tokens. */
const CARACTERES_POR_TOKEN = 2.3;

describe('el tamaño de la ficha (la de Naza al cortar el piloto: 45.572 caracteres en texto)', () => {
  it.skipIf(!existsSync(RUTA))('recortada, entra en 2.500 tokens y no pierde a las personas de la familia', () => {
    const cruda = JSON.parse(readFileSync(RUTA, 'utf8')) as Perfil;
    const ficha = recortarPerfil({ ...cruda, noTuvo: cruda.noTuvo ?? [] });
    const texto = perfilEnTexto(ficha);
    expect(texto.length).toBeLessThanOrEqual(2500 * CARACTERES_POR_TOKEN);
    expect(ficha.personas.map((p) => p.nombre)).toEqual(expect.arrayContaining(['Ariel', 'Juan Manuel', 'Ima']));
    expect(ficha.persona.edad?.valor).toBe('27');
  });
});
```

- [ ] **Step 4: Correr**

Run: `cd entrevistador && npx vitest run test/perfil-tamano.test.ts`
Expected: PASS (si el texto recortado supera 5.750, bajar `TOPES.etapaCampo` a 220 en la Tarea 2 y volver a correr `test/perfil.test.ts`; anotar el valor final en el reporte).

- [ ] **Step 5: Commit**

```bash
git add entrevistador/scripts/exportar-perfil-v2.ts entrevistador/test/fixtures/perfil-naza-piloto.json entrevistador/test/perfil-tamano.test.ts
git commit -m "esqueleto v2: la ficha real del piloto como fixture y el test de que entra en 2.500 tokens"
```

---

### Task 4: El guion en código: filas, árbol, condiciones, expansión, techo e historia grande

**Files:**
- Create: `entrevistador/src/ia/guion-v2.ts`
- Test: `entrevistador/test/guion-v2.test.ts` (nuevo)

**Interfaces:**
- Consumes: `Perfil` con `noTuvo` (Tarea 2); `Tramo`, `RANGO_TRAMO`, `edadDe`, `rangoDeEtapa` de `plan-preguntas.ts` (siguen existiendo después de la Tarea 6); `slug` de `../manual/puro.js`.
- Produces (todo puro, sin modelo):

```ts
export type Etapa = 'inicio' | Tramo | 'futuro' | 'reflexion';            // Tramo incluye 'hoy'
export type Bloque = 'presentacion' | Etapa;                                 // lo que la fábrica lee en objetivo.bloque
export type Condicion = 'siempre' | { edadMin: number } | { arbol: 'hermanos' | 'hijos' | 'pareja' | 'nietos' | 'padresGrandes' | 'perdidas' } | { evento: true };
export type Fila = { id: string; etapa: Etapa; tramo: Tramo | null; tema: string; pormenores: string[]; aplica: Condicion;
  siNoSeSabe?: { modo: 'puerta'; tema: string } | { modo: 'variante'; id: string; tema: string; pormenores?: string[] } | { modo: 'cae' };
  expandePor?: 'hermanos' | 'hijos'; inamovible?: boolean; pideEscena?: boolean };
export type FilaObjetivo = { id: string; tramo: Tramo | null; bloque: Bloque; tema: string; pormenores: string[]; pideEscena?: boolean; fila: string };
export type Arbol = { hermanos: string[]; hijos: string[]; pareja: string[]; nietos: string[]; sobrinos: string[]; padres: { nombre: string; vive: 'si' | 'no' | 'no se sabe' }[]; perdidas: string[]; noTuvo: string[] };
export type Caida = { id: string; motivo: string };
export const GUION: readonly Fila[];
export const MAX_LIBRES = 4;
export function tope(edad: number | null): number;                          // 44 si edad ≥ 56, si no 40
export function arbolDe(p: Perfil): Arbol;
export function paisDe(lugar: string): 'AR' | 'ES' | null;
export function eventosDe(p: Perfil, anioActual?: number): { id: string; nombre: string; tramo: Tramo; edad: number }[];  // hasta 2
export function armarGuion(p: Perfil, anioActual?: number): { filas: FilaObjetivo[]; caidas: Caida[] };
export function firmaGuion(p: Perfil, anioActual?: number): string;         // cambia cuando cambia lo que decide el guion
```

- [ ] **Step 1: Tests**

Crear `entrevistador/test/guion-v2.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { GUION, tope, arbolDe, paisDe, eventosDe, armarGuion, firmaGuion } from '../src/ia/guion-v2.js';
import { perfilVacio, aplicarCambios, type Perfil } from '../src/ia/perfil.js';
import { slug } from '../src/manual/puro.js';

const ANIO = 2026;
const dicho = (valor: string) => ({ valor, fuente: 'dicho' as const });
const persona = (nombre: string, vinculo: string, vive: 'si' | 'no' | 'no se sabe' = 'si') => ({ nombre, vinculo, vive, fuente: 'dicho' as const });

/** Naza: 27, hombre, dos hermanos, de novio, sin hijos, Martínez → Berga. */
function naza(): Perfil {
  const p = perfilVacio();
  p.persona.edad = dicho('27'); p.persona.genero = dicho('hombre');
  p.personas.push(persona('Ariel', 'hermano mayor'), persona('Juan Manuel', 'hermano del medio'), persona('Ima', 'pareja actual'), persona('Meri', 'madre'), persona('Juan Domingo', 'padre'));
  p.etapas.push({ edades: '0 a 22', lugar: 'Martínez, provincia de Buenos Aires', conQuien: 'sus padres', queHacia: 'colegio', fuente: 'dicho' }, { edades: 'desde los 23', lugar: 'Berga, Barcelona, España', conQuien: 'Fran y Ñaco', queHacia: 'música', fuente: 'dicho' });
  return p;
}
/** Élida: 76, mujer, viuda, dos hijos, tres nietos, una hermana, Tucumán → Lanús. */
function elida(): Perfil {
  const p = perfilVacio();
  p.persona.edad = dicho('76'); p.persona.genero = dicho('mujer');
  p.personas.push(persona('Rubén', 'marido', 'no'), persona('Marta', 'hija'), persona('Jorge', 'hijo'), persona('Sofía', 'nieta'), persona('Tomás', 'nieto'), persona('Lucas', 'nieto'), persona('Nélida', 'hermana'), persona('Rosa', 'madre', 'no'), persona('Juan', 'padre', 'no'));
  p.etapas.push({ edades: '0 a 18', lugar: 'Tucumán', conQuien: 'los abuelos', queHacia: 'campo', fuente: 'dicho' }, { edades: 'desde los 19', lugar: 'Lanús, Buenos Aires', conQuien: 'Rubén', queHacia: 'costurera', fuente: 'dicho' });
  return p;
}
const ids = (p: Perfil) => armarGuion(p, ANIO).filas.map((f) => f.id);
const preguntas = (p: Perfil) => armarGuion(p, ANIO).filas.filter((f) => f.id !== 'presentacion').length;

describe('GUION (las filas del guion aprobado, §3)', () => {
  it('tiene los ids del guion, en orden de etapa, con inicio y reflexión inamovibles', () => {
    const l = GUION.map((f) => f.id);
    expect(l.slice(0, 5)).toEqual(['presentacion', 'casa-infancia', 'los-tuyos-hoy', 'mapa-casas', 'mapa-capitulos']);
    expect(l.slice(-6)).toEqual(['pruebas', 'fuerza', 'alegrias', 'lo-que-falta', 'mensaje', 'cinco-minutos']);
    for (const id of ['padres-como-eran', 'hermano', 'abuelos-y-raices', 'la-cuadra-y-los-juegos', 'la-escuela', 'a-los-quince', 'estudios', 'primer-trabajo', 'primer-amor', 'oficio', 'pareja-como-llego', 'hijos-llegada', 'hijo', 'un-lugar-que-cambio-algo', 'amigos-de-siempre', 'el-trabajo-y-la-plata', 'los-hijos-creciendo', 'la-pareja-con-los-anos', 'los-padres-de-grande', 'por-gusto', 'dejar-el-trabajo', 'nietos', 'perdidas', 'un-dia-de-hoy', 'los-tuyos-hoy-como-estan', 'lo-que-te-queda-por-hacer', 'lo-que-esperas-para-los-tuyos']) expect(l).toContain(id);
    expect(GUION.filter((f) => f.inamovible).map((f) => f.etapa)).toEqual(expect.arrayContaining(['inicio', 'reflexion']));
  });
  it('ningún tema supone pareja, hijos ni nietos como hecho, ni habla en masculino', () => {
    for (const f of GUION) {
      expect(f.tema).not.toMatch(/\bsu (esposa|marido)\b/i);
      expect(f.tema).not.toMatch(/\b(él|ella)\b/);
    }
  });
});

describe('tope', () => {
  it('40, y 44 desde los 56', () => { expect(tope(27)).toBe(40); expect(tope(55)).toBe(40); expect(tope(56)).toBe(44); expect(tope(null)).toBe(40); });
});

describe('arbolDe', () => {
  it('lee hermanos, hijos, pareja, nietos, padres y pérdidas de los vínculos; y noTuvo', () => {
    const a = arbolDe(aplicarCambios(elida(), { noTuvo: ['hermanos'] }));
    expect(a.hijos).toEqual(['Marta', 'Jorge']);
    expect(a.nietos).toHaveLength(3);
    expect(a.pareja).toEqual(['Rubén']);
    expect(a.hermanos).toEqual(['Nélida']);
    expect(a.padres.map((x) => x.vive)).toEqual(['no', 'no']);
    expect(a.perdidas).toEqual(expect.arrayContaining(['Rubén']));
    expect(a.noTuvo).toEqual(['hermanos']);
  });
  it('"hijo de un amigo" no es un hijo', () => {
    const p = perfilVacio(); p.personas.push(persona('Tomi', 'hijo de un amigo'));
    expect(arbolDe(p).hijos).toEqual([]);
  });
});

describe('paisDe y eventosDe (la historia grande, §4)', () => {
  it('reconoce Argentina y España por la ciudad o el país', () => {
    expect(paisDe('Martínez, provincia de Buenos Aires')).toBe('AR');
    expect(paisDe('Berga, Barcelona, España')).toBe('ES');
    expect(paisDe('Montevideo')).toBeNull();
  });
  it('Naza (1999, Argentina hasta los 22): la pandemia a los 21, en juventud; el 2001 no (tenía 2)', () => {
    const e = eventosDe(naza(), ANIO);
    expect(e.map((x) => x.id)).toEqual(['pandemia']);
    expect(e[0]).toMatchObject({ tramo: 'juventud', edad: 21 });
  });
  it('Élida (1950, Argentina): la dictadura (26) y el 2001 (51); la pandemia queda afuera por el máximo de dos', () => {
    const e = eventosDe(elida(), ANIO);
    expect(e.map((x) => x.id)).toEqual(['dictadura', 'crisis-2001']);
    expect(e[0].tramo).toBe('adulto joven');
    expect(e[1].tramo).toBe('adultez media');
  });
  it('sin edad no hay eventos', () => { expect(eventosDe(perfilVacio(), ANIO)).toEqual([]); });
});

describe('armarGuion', () => {
  it('Naza: 30 preguntas (el guion §5 dice 29 porque no contó la pandemia), un hermano por hermano, la pareja resuelta, sin hijos, sin adultez media', () => {
    const { filas, caidas } = armarGuion(naza(), ANIO);
    expect(preguntas(naza())).toBe(30);
    const l = filas.map((f) => f.id);
    expect(l).toContain(`hermano-${slug('Ariel')}`); expect(l).toContain(`hermano-${slug('Juan Manuel')}`);
    expect(l).toContain('pareja-como-llego'); expect(l).not.toContain('hijos-llegada'); expect(l).not.toContain('el-trabajo-y-la-plata');
    expect(l).toContain('historia-grande-pandemia');
    expect(l.indexOf('por-gusto')).toBeLessThan(l.indexOf('un-dia-de-hoy'));
    expect(l.slice(-6)).toEqual(['pruebas', 'fuerza', 'alegrias', 'lo-que-falta', 'mensaje', 'cinco-minutos']);
    expect(caidas.map((c) => c.id)).toEqual(expect.arrayContaining(['hijos-llegada', 'nietos', 'dejar-el-trabajo']));
  });
  it('Élida: 40 preguntas justas, con dos hijos, la pérdida de Rubén, los padres de grande y los nietos', () => {
    expect(preguntas(elida())).toBe(40);
    const l = ids(elida());
    expect(l).toEqual(expect.arrayContaining([`hijo-${slug('Marta')}`, `hijo-${slug('Jorge')}`, 'perdidas', 'los-padres-de-grande', 'nietos', 'la-pareja-con-los-anos', 'dejar-el-trabajo', 'historia-grande-dictadura', 'historia-grande-crisis-2001']));
    expect(l).not.toContain('hermanos-todos');
  });
  it('si no se sabe si hubo hermanos, la fila se vuelve puerta; si dijo que no tuvo, se cae con motivo y los hijos tienen su variante', () => {
    const sin = perfilVacio(); sin.persona.edad = dicho('40');
    const puerta = armarGuion(sin, ANIO).filas.find((f) => f.id === 'hermanos-puerta');
    expect(puerta?.tema).toMatch(/únic/i);
    const no = aplicarCambios(sin, { noTuvo: ['hermanos', 'hijos'] });
    const g = armarGuion(no, ANIO);
    expect(g.filas.some((f) => f.id.startsWith('hermano'))).toBe(false);
    expect(g.caidas).toEqual(expect.arrayContaining([{ id: 'hermano', motivo: 'dijo que no tuvo hermanos' }]));
    expect(g.filas.find((f) => f.id === 'quienes-fueron-tu-familia')).toBeDefined();
  });
  it('cuatro hermanos: uno "de todos" y uno por el primero', () => {
    const p = naza(); p.personas.push(persona('Pedro', 'hermano'), persona('Pablo', 'hermano'));
    const l = ids(p);
    expect(l).toContain('hermanos-todos'); expect(l).toContain(`hermano-${slug('Ariel')}`); expect(l).not.toContain(`hermano-${slug('Pablo')}`);
  });
  it('la vida más llena posible (82, tres hermanos, tres hijos, pareja, nietos, pérdidas, dos eventos) llega justo al techo de 44 y no lo pasa', () => {
    // Con este guion el máximo alcanzable es exactamente el techo (44 para 56+, 40 para el resto):
    // recortarAlTope es una red por si el guion crece, no algo que pase hoy.
    const p = elida(); p.persona.edad = dicho('82');
    p.personas.push(persona('Ana', 'hija'), persona('Pedro', 'hermano'), persona('Elsa', 'hermana'));
    const { filas, caidas } = armarGuion(p, ANIO);
    expect(filas.filter((f) => f.id !== 'presentacion').length).toBe(44);
    expect(caidas.some((c) => /techo/.test(c.motivo))).toBe(false);
    expect(filas.map((f) => f.id)).toEqual(expect.arrayContaining(['cinco-minutos', 'lo-que-te-queda-por-hacer', 'un-dia-de-hoy', `hijo-${slug('Ana')}`, `hermano-${slug('Elsa')}`]));
  });
  it('cada fila lleva tramo y bloque para la fábrica: futuro y reflexión sin tramo, oficio en adulto joven', () => {
    const f = armarGuion(naza(), ANIO).filas;
    expect(f.find((x) => x.id === 'oficio')).toMatchObject({ tramo: 'adulto joven', bloque: 'adulto joven' });
    expect(f.find((x) => x.id === 'lo-que-te-queda-por-hacer')).toMatchObject({ tramo: null, bloque: 'futuro' });
    expect(f.find((x) => x.id === 'mensaje')).toMatchObject({ tramo: null, bloque: 'reflexion' });
    expect(f.find((x) => x.id === 'presentacion')).toMatchObject({ bloque: 'presentacion' });
  });
  it('la firma cambia cuando cambia la edad o el árbol, no cuando cambia una bisagra', () => {
    const p = naza();
    const a = firmaGuion(p, ANIO);
    expect(firmaGuion(aplicarCambios(p, { agregarBisagras: ['A los 20 dejó la facultad'] }), ANIO)).toBe(a);
    expect(firmaGuion(aplicarCambios(p, { agregarPersonas: [persona('Lola', 'hija')] }), ANIO)).not.toBe(a);
  });
});
```

- [ ] **Step 2: Correr y ver que falla**

Run: `cd entrevistador && npx vitest run test/guion-v2.test.ts`
Expected: FAIL (`Cannot find module '../src/ia/guion-v2.js'`).

- [ ] **Step 3: Implementar `guion-v2.ts`**

Los temas se copian del guion aprobado (`docs/esqueleto-v2-guion-para-aprobar.md` §3); acá van completos para que la tarea sea autónoma.

```ts
import type { Perfil } from './perfil.js';
import { RANGO_TRAMO, edadDe, rangoDeEtapa, type Tramo } from './plan-preguntas.js';
import { slug } from '../manual/puro.js';

// El guion del esqueleto v2 (`docs/esqueleto-v2-guion-para-aprobar.md`, aprobado por Naza el 24/09).
// Cada fila es un TEMA con condición. Quién decide si entra: el código, con la ficha (`arbolDe`,
// la edad, los países de las etapas). Cuando la ficha no sabe, la fila se vuelve PUERTA (pregunta si
// hubo) en vez de suponer o saltearse. El modelo no elige qué preguntar: elige cómo (pregunta-v2.ts).

export type Etapa = 'inicio' | Tramo | 'futuro' | 'reflexion';
export type Bloque = 'presentacion' | Etapa;
export type Condicion =
  | 'siempre'
  | { edadMin: number }
  | { arbol: 'hermanos' | 'hijos' | 'pareja' | 'nietos' | 'padresGrandes' | 'perdidas' }
  | { evento: true };
export type Fila = {
  id: string;
  etapa: Etapa;
  /** Para la fábrica (época de la respuesta) y los objetos. null = cruza la vida o no es una época. */
  tramo: Tramo | null;
  tema: string;
  pormenores: string[];
  aplica: Condicion;
  siNoSeSabe?: { modo: 'puerta'; tema: string } | { modo: 'variante'; id: string; tema: string; pormenores?: string[] } | { modo: 'cae' };
  expandePor?: 'hermanos' | 'hijos';
  inamovible?: boolean;
  pideEscena?: boolean;
};
export type FilaObjetivo = { id: string; tramo: Tramo | null; bloque: Bloque; tema: string; pormenores: string[]; pideEscena?: boolean; fila: string };
export type Caida = { id: string; motivo: string };

export const MAX_LIBRES = 4;
export const TOPE = 40;
export const TOPE_MAYORES = 44;
/** Más expansiones que esto por vínculo: una "de todos" y una por el primero. */
const MAX_POR_VINCULO = 3;

export function tope(edad: number | null): number {
  return edad !== null && edad >= 56 ? TOPE_MAYORES : TOPE;
}

const S = 'siempre' as const;
const puerta = (tema: string) => ({ modo: 'puerta' as const, tema });
const cae = { modo: 'cae' as const };
const HISTORIA = 'Lo grande que le tocó al país en esa época ({EVENTO}): cómo se vivió en su casa, qué cambió, quién estaba. Sin dar por hecho de qué lado estuvo.';
const HISTORIA_PORMENORES = ['cómo se vivió en su casa', 'qué cambió', 'quién estaba'];

export const GUION: readonly Fila[] = [
  // Inicio
  { id: 'presentacion', etapa: 'inicio', tramo: null, inamovible: true, aplica: S, pormenores: [], tema: 'Es el PRIMER mensaje: la bienvenida. Saludá por su nombre, decí quién sos (el biógrafo que va a escribir el libro de su vida) y quién le regala este libro (si la ficha lo dice), cómo va a ser esto (una pregunta por día, se contesta con un audio cuando pueda, sin apuro), y lo que necesitás saber para escribirle bien: cómo prefiere que le hablen ({TRATOS}), {EDAD}cómo le dicen en casa. Entre 70 y 90 palabras, cálido, sin barras ("la/lo"): escribí de manera que sirva para los dos. No es una pregunta del día: no preguntes todavía por su vida.' },
  { id: 'casa-infancia', etapa: 'inicio', tramo: 'infancia', inamovible: true, aplica: S, pideEscena: true, tema: 'La casa donde pasó su infancia, como una escena: si cierra los ojos y entra por la puerta, qué ve, qué huele, quién está. Usá lo que la presentación ya sacó (el trato, cómo le dicen).', pormenores: ['qué ve al entrar', 'quién está', 'olores', 'la calle'] },
  { id: 'los-tuyos-hoy', etapa: 'inicio', tramo: null, inamovible: true, aplica: S, tema: 'Quiénes son los suyos hoy: la gente de su vida. Es para saber con quién habla el libro: pareja, hijos, hermanos, nietos, sobrinos, si sus padres viven. Escrita cálida, no como formulario, y sin dar por hecho que tiene ninguno de ellos ("contame quiénes son los tuyos hoy").', pormenores: ['pareja', 'hijos', 'hermanos', 'nietos', 'sobrinos', 'si los padres viven', 'nombres y edades como salgan'] },
  { id: 'mapa-casas', etapa: 'inicio', tramo: null, inamovible: true, aplica: S, tema: 'El mapa de su vida por las casas: después de aquella casa, para dónde fue la vida. Las casas en que vivió, una tras otra: en qué ciudad, con quién, hasta qué edad más o menos. Que se sienta como un recorrido, no como un formulario. Si todavía no sabés su edad, este es el lugar para que salga sola ("hasta qué edad, más o menos, en cada una").', pormenores: ['ciudad', 'con quién', 'hasta qué edad'] },
  { id: 'mapa-capitulos', etapa: 'inicio', tramo: null, inamovible: true, aplica: S, tema: 'Si su vida fuera un libro, cuáles serían sus capítulos: los grandes pedazos, y qué hizo que uno terminara y empezara otro.', pormenores: ['qué abrió y cerró cada uno'] },
  // Infancia
  { id: 'padres-como-eran', etapa: 'infancia', tramo: 'infancia', aplica: S, tema: 'Cómo ERA su mamá y cómo ERA su papá (o quienes le criaron): el carácter de cada uno, no la cronología. Qué decía cada uno, cómo lo trataba, en qué se parece. Una escena de cada uno, de yapa.', pormenores: ['qué decía cada uno', 'cómo lo trataba', 'en qué se parece', 'una escena de cada uno'] },
  { id: 'hermano', etapa: 'infancia', tramo: 'infancia', aplica: { arbol: 'hermanos' }, expandePor: 'hermanos', tema: 'Su hermano/a {NOMBRE}, uno por uno: cómo es, cómo era de chico/a, la relación entre los dos.', pormenores: ['qué hacían juntos', 'peleas', 'con quién se llevaba mejor', 'cómo es hoy'], siNoSeSabe: puerta('Si tuvo hermanos, o fue hijo/a único/a, y cómo era eso en la casa. Preguntá si hubo, sin dar por hecho nada.') },
  { id: 'abuelos-y-raices', etapa: 'infancia', tramo: 'infancia', aplica: S, tema: 'Los abuelos y de dónde viene la familia: de qué pueblo o país, cómo llegaron, los apellidos, lo que le contaban de antes de que naciera. Si no conoció abuelos, qué sabe de ellos.', pormenores: ['de qué pueblo o país', 'cómo llegaron', 'apellidos', 'lo que le contaban'] },
  { id: 'la-cuadra-y-los-juegos', etapa: 'infancia', tramo: 'infancia', aplica: S, pideEscena: true, tema: 'La cuadra, los juegos y los amigos del barrio, en UNA sola pregunta: a qué jugaba, con quién, los animales de la casa, los fines de semana, hasta qué hora lo dejaban. Elegí dos o tres pormenores según lo que ya contó y pedilos juntos.', pormenores: ['a qué jugaba', 'con quién', 'los animales de la casa', 'los fines de semana y las vacaciones', 'hasta qué hora lo dejaban'] },
  { id: 'la-escuela', etapa: 'infancia', tramo: 'infancia', aplica: S, tema: 'La escuela primaria: un maestro, un compañero, cómo le iba; si cambió de colegio y por qué.', pormenores: ['un maestro', 'un compañero', 'cómo le iba', 'si cambió de colegio y por qué'] },
  // Juventud
  { id: 'a-los-quince', etapa: 'juventud', tramo: 'juventud', aplica: S, tema: 'Qué hacía a los quince, dieciséis años cuando no estaba en la escuela ni trabajando, y con quién (la banda de esa época va acá): dónde paraban, qué sonaba, cómo se vestían, un sábado a la noche. En la ciudad donde vivía ENTONCES. Sin dar por hecho que salía.', pormenores: ['dónde paraban', 'con quién', 'qué sonaba', 'cómo se vestían', 'un sábado a la noche'] },
  { id: 'estudios', etapa: 'juventud', tramo: 'juventud', aplica: S, tema: 'Hasta dónde llegó con los estudios y cómo fue esa decisión: secundaria, facultad u oficio; si lo eligió o lo eligió la vida; quién lo apoyó.', pormenores: ['hasta dónde llegó', 'si lo eligió o lo eligió la vida', 'quién lo apoyó'] },
  { id: 'primer-trabajo', etapa: 'juventud', tramo: 'juventud', aplica: S, tema: 'Su primer trabajo y su primera plata: cómo lo consiguió, qué hizo con esa plata. Si ya contó que no trabajó de joven, preguntá de qué vivía y cuál fue la primera plata propia.', pormenores: ['cómo lo consiguió', 'qué hizo con esa plata'] },
  { id: 'primer-amor', etapa: 'juventud', tramo: 'juventud', aplica: S, tema: 'Si se enamoró en esos años, de quién, cómo fue: cómo se conocieron, cómo se dio cuenta, cómo terminó o siguió. Sin dar por hecho que hubo pareja ni de qué género: si no sabés, preguntá si hubo.', pormenores: ['cómo se conocieron', 'cómo se dio cuenta', 'cómo terminó o siguió'] },
  { id: 'historia-grande', etapa: 'juventud', tramo: 'juventud', aplica: { evento: true }, tema: HISTORIA, pormenores: HISTORIA_PORMENORES },
  // Adulto joven
  { id: 'oficio', etapa: 'adulto joven', tramo: 'adulto joven', aplica: S, tema: 'A qué le dedicó la vida y cómo llegó ahí: si lo eligió, lo heredó o se dio; un día de trabajo; qué le gustaba.', pormenores: ['si lo eligió, lo heredó o se dio', 'un día de trabajo', 'qué le gustaba'] },
  { id: 'pareja-como-llego', etapa: 'adulto joven', tramo: 'adulto joven', aplica: { arbol: 'pareja' }, tema: 'Con quién hizo su vida y cómo llegó esa persona ({NOMBRE}): el día que se conocieron, quién dio el primer paso, cómo era, cómo lo recibieron las familias. NO la boda.', pormenores: ['el día que se conocieron', 'quién dio el primer paso', 'cómo era esa persona', 'cómo lo recibieron las familias'], siNoSeSabe: puerta('Si hubo alguien con quien hizo su vida, y quién fue. Preguntá si hubo, sin dar por hecho pareja ni género.') },
  { id: 'hijos-llegada', etapa: 'adulto joven', tramo: 'adulto joven', aplica: { arbol: 'hijos' }, tema: 'El día que nació su primer hijo/a y cómo fueron llegando los demás: dónde estaba, qué sintió, cómo eligieron el nombre.', pormenores: ['dónde estaba', 'qué sintió', 'cómo eligieron el nombre', 'cómo fueron llegando los demás'], siNoSeSabe: cae },
  { id: 'hijo', etapa: 'adulto joven', tramo: 'adulto joven', aplica: { arbol: 'hijos' }, expandePor: 'hijos', tema: 'Su hijo/a {NOMBRE}, uno por uno: cómo es, a quién salió, qué admira; cómo era de chico/a, una escena, cómo es hoy.', pormenores: ['cómo era de chico/a', 'a quién salió', 'qué admira', 'cómo es hoy'], siNoSeSabe: cae },
  { id: 'un-lugar-que-cambio-algo', etapa: 'adulto joven', tramo: null, aplica: S, tema: 'Un lugar que le cambió la vida: una mudanza, un viaje, otro país, otra ciudad. El primer día ahí, quién lo esperaba (sin suponerlo), qué dejó atrás, por qué se fue. Si no se mudó nunca: la esquina de siempre, qué la hace suya.', pormenores: ['el primer día ahí', 'qué dejó atrás', 'por qué se fue'] },
  { id: 'amigos-de-siempre', etapa: 'adulto joven', tramo: null, aplica: S, tema: 'Los amigos de la vida adulta: del trabajo, del club, los que quedaron de antes. Una escena con ellos y cómo se mantienen.', pormenores: ['quiénes quedaron', 'una escena con ellos', 'cómo se mantienen'] },
  // Adultez media (por-gusto cruza la vida: si no vivió esta etapa, armarGuion la baja al adulto joven)
  { id: 'el-trabajo-y-la-plata', etapa: 'adultez media', tramo: 'adultez media', aplica: { edadMin: 36 }, tema: 'Los años fuertes del trabajo, y la plata con confianza: la mejor anécdota, un jefe o un socio, épocas flacas, un riesgo (un negocio, una casa), qué relación ve entre la plata y la felicidad.', pormenores: ['la mejor anécdota', 'un jefe o un socio', 'épocas flacas', 'un riesgo'] },
  { id: 'los-hijos-creciendo', etapa: 'adultez media', tramo: 'adultez media', aplica: { arbol: 'hijos' }, tema: 'Cómo fue como madre/padre mientras crecían: qué quiso darles que no tuvo, qué le costó, una escena de la mesa o de un viaje.', pormenores: ['qué quiso darles', 'qué le costó', 'una escena de la mesa o de un viaje'], siNoSeSabe: { modo: 'variante', id: 'quienes-fueron-tu-familia', tema: 'De quién se ocupó y quién fue su familia en esos años: las personas que fueron su casa aunque no fueran hijos.', pormenores: ['de quién se ocupó', 'quién fue su familia', 'una escena'] } },
  { id: 'la-pareja-con-los-anos', etapa: 'adultez media', tramo: 'adultez media', aplica: { arbol: 'pareja' }, tema: 'La pareja con los años ({NOMBRE}): las tormentas, cómo siguieron o cómo terminó; una crisis, una reconciliación, qué aprendió. Si enviudó o se separó, cómo fue y quién estuvo.', pormenores: ['una crisis', 'una reconciliación', 'qué aprendió'], siNoSeSabe: cae },
  { id: 'los-padres-de-grande', etapa: 'adultez media', tramo: 'adultez media', aplica: { arbol: 'padresGrandes' }, tema: 'Sus padres cuando ya era grande: cómo envejecieron, cómo los acompañó, cómo fue perderlos si los perdió; quién se ocupó, una charla que recuerde, qué le dejaron dicho. Si viven, cómo es la relación hoy: no supongas la muerte.', pormenores: ['quién se ocupó', 'una charla que recuerde', 'qué le dejaron dicho'], siNoSeSabe: cae },
  { id: 'por-gusto', etapa: 'adultez media', tramo: null, aplica: S, tema: 'Lo que hacía por gusto, cuando nadie se lo pedía: el club, la huerta, la música, el baile, la pesca, lo que ya nombró; con quién. Si no nombró nada, preguntá abierto.', pormenores: ['qué hacía por gusto', 'con quién', 'desde cuándo'] },
  { id: 'historia-grande', etapa: 'adultez media', tramo: 'adultez media', aplica: { evento: true }, tema: HISTORIA, pormenores: HISTORIA_PORMENORES },
  // Segunda mitad
  { id: 'dejar-el-trabajo', etapa: 'segunda mitad', tramo: 'segunda mitad', aplica: { edadMin: 60 }, tema: 'La jubilación o dejar el trabajo: cómo fue ese día, qué hizo con el tiempo, qué extraña, qué no. Si sigue trabajando, por qué sigue y hasta cuándo.', pormenores: ['cómo fue ese día', 'qué hizo con el tiempo', 'qué extraña'] },
  { id: 'nietos', etapa: 'segunda mitad', tramo: 'segunda mitad', aplica: { arbol: 'nietos' }, tema: 'Los nietos ({NOMBRES}): quiénes son, cómo es ser abuela/o, una escena con ellos, qué les quiere enseñar.', pormenores: ['quiénes son', 'una escena con ellos', 'qué les quiere enseñar'], siNoSeSabe: cae },
  { id: 'perdidas', etapa: 'segunda mitad', tramo: 'segunda mitad', aplica: { arbol: 'perdidas' }, tema: 'Las personas que perdió en estos años ({NOMBRES}), con tacto: cómo fue, quién estuvo, cómo las lleva consigo. Solo las que la ficha dice que murieron.', pormenores: ['cómo fue', 'quién estuvo', 'cómo las lleva consigo'], siNoSeSabe: cae },
  { id: 'historia-grande', etapa: 'segunda mitad', tramo: 'segunda mitad', aplica: { evento: true }, tema: HISTORIA, pormenores: HISTORIA_PORMENORES },
  // Hoy
  { id: 'un-dia-de-hoy', etapa: 'hoy', tramo: 'hoy', inamovible: true, aplica: S, tema: 'Cómo es un día suyo hoy: dónde vive, con quién, qué hace, qué le alegra, qué le duele.', pormenores: ['dónde vive', 'con quién', 'qué hace', 'qué le alegra'] },
  { id: 'los-tuyos-hoy-como-estan', etapa: 'hoy', tramo: 'hoy', inamovible: true, aplica: S, tema: 'La familia hoy: cómo está cada uno y cómo es la relación (hermanos, hijos, sobrinos, nietos, la pareja: los que la ficha tiene). Quién vive cerca, a quién ve, a quién extraña. Sin dar por hecho nada que la ficha no diga.', pormenores: ['quién vive cerca', 'a quién ve', 'a quién extraña'] },
  // Futuro
  { id: 'lo-que-te-queda-por-hacer', etapa: 'futuro', tramo: null, inamovible: true, aplica: S, tema: 'Lo que quiere para su vida de acá en adelante: sueños, planes, lo que le queda por ver o por hacer (un viaje, un proyecto, una mudanza). A los veinte es la mitad del libro; a los ochenta es "qué le queda por hacer y qué ya no".', pormenores: ['un sueño', 'un plan concreto', 'lo que ya no'] },
  { id: 'lo-que-esperas-para-los-tuyos', etapa: 'futuro', tramo: null, inamovible: true, aplica: S, tema: 'Lo que espera para los suyos: hijos, nietos, hermanos, la pareja, los que la ficha tiene. Sin dar por hecho hijos ni nietos.', pormenores: ['para quién', 'qué espera', 'qué le gustaría ver'] },
  // Reflexión
  { id: 'pruebas', etapa: 'reflexion', tramo: null, inamovible: true, aplica: S, tema: 'Las pruebas que le puso la vida: una pérdida, un fracaso, una época que dolió. Lo que quiera contar, como quiera.', pormenores: [] },
  { id: 'fuerza', etapa: 'reflexion', tramo: null, inamovible: true, aplica: S, tema: 'De dónde sacó fuerza en esas épocas y qué aprendió que le quiera dejar dicho a los suyos.', pormenores: [] },
  { id: 'alegrias', etapa: 'reflexion', tramo: null, inamovible: true, aplica: S, tema: 'Sus alegrías más grandes y lo que más orgullo le da; los dichos que repite desde siempre.', pormenores: [] },
  { id: 'lo-que-falta', etapa: 'reflexion', tramo: null, inamovible: true, aplica: S, tema: 'Qué no le preguntaste que tiene que estar en el libro: una persona, una época, una historia que se quedó con ganas de contar. Es su turno de traer lo que vos no viste.', pormenores: [] },
  { id: 'mensaje', etapa: 'reflexion', tramo: null, inamovible: true, aplica: S, tema: 'Qué les quiere decir a los que escuchen esto dentro de cincuenta años (sin dar por hecho que tiene hijos o nietos).', pormenores: [] },
  { id: 'cinco-minutos', etapa: 'reflexion', tramo: null, inamovible: true, aplica: S, tema: 'Su vida en cinco minutos, para alguien que no le conoce: lo que no puede faltar.', pormenores: [] },
];

// ── El árbol ────────────────────────────────────────────────────────────────
export type Arbol = {
  hermanos: string[]; hijos: string[]; pareja: string[]; nietos: string[]; sobrinos: string[];
  padres: { nombre: string; vive: 'si' | 'no' | 'no se sabe' }[];
  perdidas: string[];
  noTuvo: string[];
};

const norm = (t: string) => t.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').trim();
/** El vínculo tiene que EMPEZAR por la palabra ("hijo mayor" sí; "hijo de un amigo" no). */
const empieza = (vinculo: string, re: RegExp) => re.test(norm(vinculo));

export function arbolDe(p: Perfil): Arbol {
  const a: Arbol = { hermanos: [], hijos: [], pareja: [], nietos: [], sobrinos: [], padres: [], perdidas: [], noTuvo: [...(p.noTuvo ?? [])] };
  for (const x of p.personas) {
    const v = x.vinculo;
    if (empieza(v, /^herman[oa]s?\b(?! de)/)) a.hermanos.push(x.nombre);
    else if (empieza(v, /^hij[oa]s?\b(?! de)/)) a.hijos.push(x.nombre);
    else if (empieza(v, /^(pareja|novi[oa]|espos[oa]|marido|mujer|conyuge|companer[oa])/)) a.pareja.push(x.nombre);
    else if (empieza(v, /^niet[oa]s?\b(?! de)/)) a.nietos.push(x.nombre);
    else if (empieza(v, /^sobrin[oa]s?\b(?! de)/)) a.sobrinos.push(x.nombre);
    else if (empieza(v, /^(padre|madre|papa|mama|padrastro|madrastra)\b(?! de)/)) a.padres.push({ nombre: x.nombre, vive: x.vive });
    if (x.vive === 'no' && empieza(v, /^(herman|hij|pareja|novi|espos|marido|mujer|conyuge|companer|amig)/)) a.perdidas.push(x.nombre);
  }
  return a;
}

// ── La historia grande (guion §4) ───────────────────────────────────────────
type Pais = 'AR' | 'ES';
const EVENTOS: { id: string; nombre: string; desde: number; hasta: number; pais: Pais | '*'; edadMin: number; peso: number }[] = [
  { id: 'dictadura', nombre: 'la dictadura', desde: 1976, hasta: 1983, pais: 'AR', edadMin: 8, peso: 10 },
  { id: 'malvinas', nombre: 'la guerra de Malvinas', desde: 1982, hasta: 1982, pais: 'AR', edadMin: 8, peso: 7 },
  { id: 'hiperinflacion', nombre: 'la hiperinflación', desde: 1989, hasta: 1990, pais: 'AR', edadMin: 10, peso: 6 },
  { id: 'crisis-2001', nombre: 'el 2001 (el corralito, diciembre)', desde: 2001, hasta: 2002, pais: 'AR', edadMin: 10, peso: 9 },
  { id: 'pandemia', nombre: 'la pandemia', desde: 2020, hasta: 2021, pais: '*', edadMin: 6, peso: 8 },
  { id: 'transicion', nombre: 'la muerte de Franco y la transición', desde: 1975, hasta: 1978, pais: 'ES', edadMin: 8, peso: 10 },
  { id: '23f', nombre: 'el 23-F', desde: 1981, hasta: 1981, pais: 'ES', edadMin: 10, peso: 5 },
  { id: 'barcelona-92', nombre: 'los Juegos de Barcelona y la Expo', desde: 1992, hasta: 1992, pais: 'ES', edadMin: 6, peso: 4 },
  { id: '11m', nombre: 'el 11-M', desde: 2004, hasta: 2004, pais: 'ES', edadMin: 10, peso: 6 },
  { id: 'crisis-2008', nombre: 'la crisis de 2008', desde: 2008, hasta: 2013, pais: '*', edadMin: 15, peso: 6 },
  { id: 'mundial', nombre: 'un Mundial ganado', desde: 1978, hasta: 2022, pais: 'AR', edadMin: 6, peso: 1 },
];
const EDAD_MAX_EVENTO = 60;
const MUNDIALES = [1978, 1986, 2022];

export function paisDe(lugar: string): Pais | null {
  const l = norm(lugar);
  if (/espan|barcelona|madrid|catal|berga|valencia|sevilla|andaluc|bilbao|zaragoza|malaga|galicia/.test(l)) return 'ES';
  if (/argentin|buenos aires|rosario|tucum|cordoba|mendoza|martinez|lanus|provincia|conurbano|santa fe|salta|neuquen/.test(l)) return 'AR';
  return null;
}

function tramoDeEdad(e: number): Tramo {
  for (const t of ['infancia', 'juventud', 'adulto joven', 'adultez media'] as const) if (e >= RANGO_TRAMO[t][0] && e <= RANGO_TRAMO[t][1]) return t;
  return 'segunda mitad';
}

/** En qué país vivía a tal edad, según las etapas de la ficha con lugar. null si no se sabe. */
function paisA(p: Perfil, edadActual: number, edad: number): Pais | null {
  for (const e of p.etapas) {
    const r = rangoDeEtapa(e.edades, edadActual);
    if (r && edad >= r[0] && edad <= r[1]) { const pais = paisDe(e.lugar); if (pais) return pais; }
  }
  return null;
}

export function eventosDe(p: Perfil, anioActual = new Date().getFullYear()): { id: string; nombre: string; tramo: Tramo; edad: number }[] {
  const edad = edadDe(p, anioActual);
  if (edad === null) return [];
  const nacio = anioActual - edad;
  const candidatos = EVENTOS.flatMap((ev) => {
    let anio = Math.max(ev.desde, nacio + ev.edadMin);
    if (ev.id === 'mundial') { const m = MUNDIALES.find((x) => x - nacio >= ev.edadMin && x - nacio <= EDAD_MAX_EVENTO); if (!m) return []; anio = m; }
    if (anio > ev.hasta) return [];
    const e = anio - nacio;
    if (e < ev.edadMin || e > EDAD_MAX_EVENTO) return [];
    if (ev.pais !== '*' && paisA(p, edad, e) !== ev.pais) return [];
    return [{ id: ev.id, nombre: ev.nombre, tramo: tramoDeEdad(e), edad: e, peso: ev.peso, anio }];
  });
  const grandes = candidatos.filter((c) => c.id !== 'mundial').sort((a, b) => b.peso - a.peso).slice(0, 2);
  const elegidos = grandes.length < 2 ? [...grandes, ...candidatos.filter((c) => c.id === 'mundial')].slice(0, 2) : grandes;
  return elegidos.sort((a, b) => a.anio - b.anio).map(({ id, nombre, tramo, edad: e }) => ({ id, nombre, tramo, edad: e }));
}

// ── Armar el guion de ESTA persona ──────────────────────────────────────────
const TRAMOS_ORDEN: Tramo[] = ['infancia', 'juventud', 'adulto joven', 'adultez media', 'segunda mitad'];
const ETAPAS_ORDEN: Etapa[] = ['inicio', ...TRAMOS_ORDEN, 'hoy', 'futuro', 'reflexion'];
const bloqueDe = (f: Fila): Bloque => (f.id === 'presentacion' ? 'presentacion' : f.etapa);

function objetivoDe(f: Fila, id = f.id, tema = f.tema, pormenores = f.pormenores): FilaObjetivo {
  return { id, tramo: f.tramo, bloque: bloqueDe(f), tema, pormenores, pideEscena: f.pideEscena, fila: f.id };
}
const conNombre = (f: Fila, nombre: string) => f.tema.replace('{NOMBRE}', nombre).replace('{NOMBRES}', nombre);

function expandir(f: Fila, nombres: string[]): FilaObjetivo[] {
  if (nombres.length <= MAX_POR_VINCULO) return nombres.map((n) => objetivoDe(f, `${f.id}-${slug(n)}`, conNombre(f, n)));
  const plural = f.expandePor === 'hijos' ? 'Sus hijos' : 'Sus hermanos';
  return [
    objetivoDe(f, `${f.id}s-todos`, `${plural} (${nombres.join(', ')}), todos juntos: cómo es cada uno en una frase, con quién se lleva mejor.`),
    objetivoDe(f, `${f.id}-${slug(nombres[0])}`, conNombre(f, nombres[0])),
  ];
}

type Resuelto = { entra: FilaObjetivo[] } | { cae: string };

/** Qué pasa con una fila para esta persona: entra (con qué objetivos), se cae (por qué), o se vuelve puerta/variante. */
function resolver(f: Fila, arbol: Arbol, edad: number | null, eventos: ReturnType<typeof eventosDe>): Resuelto {
  const variante = (): FilaObjetivo[] | null => (f.siNoSeSabe?.modo === 'variante' ? [objetivoDe(f, f.siNoSeSabe.id, f.siNoSeSabe.tema, f.siNoSeSabe.pormenores ?? f.pormenores)] : null);
  const noSabe = (vinculo: string): Resuelto => {
    const s = f.siNoSeSabe;
    if (!s || s.modo === 'cae') return { cae: `no se sabe si tiene ${vinculo}` };
    if (s.modo === 'puerta') return { entra: [objetivoDe(f, `${f.id}s-puerta`, s.tema)] };
    return { entra: variante()! };
  };
  const noTuvo = (vinculo: string): Resuelto => { const v = variante(); return v ? { entra: v } : { cae: `dijo que no tuvo ${vinculo}` }; };
  const porArbol = (vinculo: 'hermanos' | 'hijos' | 'pareja', nombres: string[], entra: () => FilaObjetivo[]): Resuelto =>
    nombres.length ? { entra: entra() } : arbol.noTuvo.includes(vinculo) ? noTuvo(vinculo) : noSabe(vinculo);
  const c = f.aplica;
  if (c === 'siempre') return { entra: [objetivoDe(f)] };
  if ('edadMin' in c) return edad !== null && edad >= c.edadMin ? { entra: [objetivoDe(f)] } : { cae: `tiene menos de ${c.edadMin}` };
  if ('evento' in c) {
    const ev = eventos.filter((e) => e.tramo === f.etapa);
    return ev.length ? { entra: ev.map((e) => objetivoDe(f, `historia-grande-${e.id}`, f.tema.replace('{EVENTO}', `${e.nombre}, cuando tenía ${e.edad} años`))) } : { cae: 'no le tocó nada grande en esa etapa' };
  }
  switch (c.arbol) {
    case 'hermanos': return porArbol('hermanos', arbol.hermanos, () => expandir(f, arbol.hermanos));
    case 'hijos': return porArbol('hijos', arbol.hijos, () => (f.expandePor ? expandir(f, arbol.hijos) : [objetivoDe(f)]));
    case 'pareja': return porArbol('pareja', arbol.pareja, () => [objetivoDe(f, f.id, conNombre(f, arbol.pareja.join(' y ')))]);
    case 'nietos': return arbol.nietos.length ? { entra: [objetivoDe(f, f.id, conNombre(f, arbol.nietos.join(', ')))] } : { cae: arbol.noTuvo.includes('nietos') ? 'dijo que no tuvo nietos' : 'la ficha no tiene nietos' };
    case 'padresGrandes': return (edad !== null && edad >= 45) || arbol.padres.some((x) => x.vive === 'no') ? { entra: [objetivoDe(f)] } : { cae: 'tiene menos de 45 y sus padres no figuran muertos' };
    case 'perdidas': return arbol.perdidas.length ? { entra: [objetivoDe(f, f.id, conNombre(f, arbol.perdidas.join(', ')))] } : { cae: 'la ficha no tiene pérdidas' };
  }
}

/** Recorta al techo sacando, en este orden: el segundo evento, las terceras expansiones, amigos-de-siempre. Nunca inamovibles. */
function recortarAlTope(filas: FilaObjetivo[], max: number, caidas: Caida[]): FilaObjetivo[] {
  const r = [...filas];
  const cuenta = () => r.filter((f) => f.id !== 'presentacion').length;
  const sacar = (pred: (f: FilaObjetivo) => boolean): boolean => {
    const i = r.map((f, idx) => ({ f, idx })).filter(({ f }) => pred(f)).at(-1)?.idx;
    if (i === undefined) return false;
    caidas.push({ id: r[i].id, motivo: `no entra en el techo de ${max}` });
    r.splice(i, 1);
    return true;
  };
  const pasos: ((f: FilaObjetivo) => boolean)[] = [
    (f) => f.fila === 'historia-grande' && r.filter((x) => x.fila === 'historia-grande').length > 1,
    (f) => (f.fila === 'hijo' || f.fila === 'hermano') && r.filter((x) => x.fila === f.fila).length > 2,
    (f) => f.id === 'amigos-de-siempre',
  ];
  for (const paso of pasos) while (cuenta() > max && sacar(paso));
  return r;
}

export function armarGuion(p: Perfil, anioActual = new Date().getFullYear()): { filas: FilaObjetivo[]; caidas: Caida[] } {
  const edad = edadDe(p, anioActual);
  const arbol = arbolDe(p);
  const eventos = eventosDe(p, anioActual);
  // Sin edad todavía (día 0 y 1): se arma con infancia, juventud y adulto joven; se rearma cuando la edad llega.
  const vividos = new Set<Etapa>(['inicio', 'hoy', 'futuro', 'reflexion', ...TRAMOS_ORDEN.filter((t) => (edad === null ? RANGO_TRAMO[t][0] <= 23 : RANGO_TRAMO[t][0] <= edad))]);
  const caidas: Caida[] = [];
  const filas: FilaObjetivo[] = [];
  for (const f of GUION) {
    if (!vividos.has(f.etapa)) {
      if (f.id === 'por-gusto') { filas.push({ ...objetivoDe(f), bloque: 'adulto joven' }); continue; }
      caidas.push({ id: f.id, motivo: `no vivió ${f.etapa}` });
      continue;
    }
    const r = resolver(f, arbol, edad, eventos);
    if ('cae' in r) caidas.push({ id: f.id, motivo: r.cae }); else filas.push(...r.entra);
  }
  const orden = (f: FilaObjetivo) => ETAPAS_ORDEN.indexOf(f.bloque === 'presentacion' ? 'inicio' : (f.bloque as Etapa));
  const ordenadas = filas.map((f, i) => ({ f, i })).sort((a, b) => orden(a.f) - orden(b.f) || a.i - b.i).map((x) => x.f);
  return { filas: recortarAlTope(ordenadas, tope(edad), caidas), caidas };
}

/** Lo que decide el guion: edad, árbol, noTuvo, eventos. Si esto no cambia, el guion no se rearma. */
export function firmaGuion(p: Perfil, anioActual = new Date().getFullYear()): string {
  return JSON.stringify({ edad: edadDe(p, anioActual), a: arbolDe(p), ev: eventosDe(p, anioActual).map((e) => e.id) });
}
```

- [ ] **Step 4: Correr y ver que pasa; tipos**

Run: `cd entrevistador && npx vitest run test/guion-v2.test.ts && npm run tipos`
Expected: PASS. Si "Élida: 40 justas" da otro número, contar a mano contra §5 del guion (inicio 4, infancia 5, juventud 5, adulto joven 7, adultez media 6, segunda mitad 3, hoy 2, futuro 2, reflexión 6) y corregir la fila que sobra o falta; si la cuenta del guion estaba mal, anotarlo en el reporte y ajustar el test.

- [ ] **Step 5: Commit**

```bash
git add entrevistador/src/ia/guion-v2.ts entrevistador/test/guion-v2.test.ts
git commit -m "esqueleto v2: el guion en código, con el árbol, las condiciones, la expansión por persona, el techo y la historia grande"
```

---

### Task 5: `pregunta-v2.ts`: el objetivo desde el guion, la repregunta como objetivo, el prompt que no crece

**Files:**
- Modify: `entrevistador/src/ia/pregunta-v2.ts` (entero salvo `escribirPregunta`, que cambia `MODELO` y `max_tokens`)
- Test: `entrevistador/test/pregunta-v2.test.ts` (se reescribe)

**Interfaces:**
- Consumes: `FilaObjetivo`, `Bloque`, `GUION` (Tarea 4); `MODELO_PREGUNTA` (Tarea 1); `encargoDelBiografo`, `perfilEnTexto` (Tarea 9 lo retoca; la firma no cambia).
- Produces:

```ts
export type Objetivo =
  | ({ tipo: 'nucleo' } & FilaObjetivo)                                                   // una fila del guion, instanciada
  | { tipo: 'variable'; id: string; tramo: Tramo; desde: number; hasta: number; anclas: string[] }   // una libre (nace de noSabemos)
  | { tipo: 'objeto'; id: string; tramo: Tramo }
  | { tipo: 'repregunta'; id: string; tramo: Tramo | null; pregunta: string; falto: string[] };
export const NUCLEO: readonly { id: string; tramo: Tramo | null; bloque: Bloque; tema: string }[]; // = GUION mapeado (compat con tests y fábrica)
export const BLOQUES: readonly Bloque[];   // suma 'futuro' antes de 'reflexion'
export type YaHecha = { id: string; tema: string };
export function objetivoEnTexto(o: Objetivo, perfil: Perfil): string;
export function armarPromptPregunta(perfil: Perfil, objetivo: Objetivo, conversacion: { pregunta: string; respuesta: string }[], yaHechas: YaHecha[], evitar?: string[]): string;
export async function escribirPregunta(cliente, perfil, objetivo, conversacion, yaHechas: YaHecha[], evitar?): Promise<{ texto; ok; marca?; usos }>;   // misma forma que hoy
```

`esPresentacion` queda igual. `HISTORIA_GRANDE` (la frase opcional) se borra: ahora es fila.

- [ ] **Step 1: Reescribir `test/pregunta-v2.test.ts`**

Reemplazar el archivo entero por:

```ts
import { describe, it, expect, vi } from 'vitest';
import type Anthropic from '@anthropic-ai/sdk';
import { NUCLEO, BLOQUES, armarPromptPregunta, escribirPregunta, objetivoEnTexto, type Objetivo } from '../src/ia/pregunta-v2.js';
import { GUION } from '../src/ia/guion-v2.js';
import { perfilVacio } from '../src/ia/perfil.js';

const fila = (id: string): Objetivo => {
  const f = GUION.find((x) => x.id === id)!;
  return { tipo: 'nucleo', id: f.id, tramo: f.tramo, bloque: f.id === 'presentacion' ? 'presentacion' : f.etapa, tema: f.tema, pormenores: f.pormenores, pideEscena: f.pideEscena, fila: f.id };
};
const perfilDeVos = () => { const p = perfilVacio(); p.persona.comoHabla = { valor: 'vos', fuente: 'dicho' }; p.persona.edad = { valor: '27', fuente: 'dicho' }; return p; };

describe('NUCLEO y BLOQUES (el guion, para quien lee contexto.v2)', () => {
  it('NUCLEO son las filas del guion con id, tramo, bloque y tema; futuro entra antes de la reflexión', () => {
    expect(NUCLEO.map((n) => n.id)).toEqual(GUION.map((f) => f.id));
    expect(NUCLEO.find((n) => n.id === 'presentacion')?.bloque).toBe('presentacion');
    expect(NUCLEO.find((n) => n.id === 'oficio')?.bloque).toBe('adulto joven');
    expect(BLOQUES.indexOf('futuro')).toBe(BLOQUES.indexOf('reflexion') - 1);
  });
});

describe('objetivoEnTexto', () => {
  it('la presentación rellena los huecos: de vos o de usted (o tú/usted en España) y la edad solo si falta', () => {
    const p = perfilVacio();
    expect(objetivoEnTexto(fila('presentacion'), p)).toContain('de vos o de usted');
    expect(objetivoEnTexto(fila('presentacion'), p)).toContain('cuántos años tiene');
    const conEdad = perfilDeVos();
    expect(objetivoEnTexto(fila('presentacion'), conEdad)).not.toContain('cuántos años tiene');
    const es = perfilVacio('españa');
    expect(objetivoEnTexto(fila('presentacion'), es)).toContain('de tú o de usted');
  });
  it('una fila lleva el tema y los pormenores que puede juntar, con la consigna de elegir dos o tres y pedirlos juntos', () => {
    const t = objetivoEnTexto(fila('la-cuadra-y-los-juegos'), perfilDeVos());
    expect(t).toContain('a qué jugaba');
    expect(t).toMatch(/dos o tres/i);
    expect(t).toMatch(/una sola pregunta|juntos/i);
  });
  it('una fila que pide escena lo dice; una que pide "cómo era" no pide escena como resumen', () => {
    expect(objetivoEnTexto(fila('casa-infancia'), perfilDeVos())).toMatch(/escena/i);
    expect(objetivoEnTexto(fila('padres-como-eran'), perfilDeVos())).toMatch(/carácter/i);
  });
  it('una libre lleva lo que nombró y no contó, con su etapa', () => {
    const v: Objetivo = { tipo: 'variable', id: 'libre-juventud-1', tramo: 'juventud', desde: 13, hasta: 22, anclas: ['Cómo se arreglaron después con Ciano tras el problema por Vicky'] };
    const t = objetivoEnTexto(v, perfilDeVos());
    expect(t).toContain('Ciano');
    expect(t).toMatch(/13 y los 22/);
    expect(t).toMatch(/nombró y no contó/i);
  });
  it('el objeto pide UNA cosa con foto de esa época y no insiste', () => {
    const t = objetivoEnTexto({ tipo: 'objeto', id: 'objeto-juventud', tramo: 'juventud' }, perfilDeVos());
    expect(t).toMatch(/UNA cosa/); expect(t).toMatch(/foto/); expect(t).toMatch(/no se insiste/i);
  });
  it('la repregunta pide junto lo que faltó de la pregunta de hoy, sin decir que es una repregunta ni pedir resumen', () => {
    const r: Objetivo = { tipo: 'repregunta', id: 'la-escuela-repregunta', tramo: 'infancia', pregunta: '¿Cómo era tu escuela?', falto: ['un maestro', 'si cambió de colegio y por qué'] };
    const t = objetivoEnTexto(r, perfilDeVos());
    expect(t).toContain('un maestro'); expect(t).toContain('¿Cómo era tu escuela?');
    expect(t).toMatch(/junt/i); expect(t).toMatch(/no digas que es una repregunta/i); expect(t).toMatch(/resum/i);
  });
});

describe('armarPromptPregunta', () => {
  it('lleva el encargo, la conversación, los TEMAS ya preguntados (no los textos) y el objetivo; no lleva textos enteros de preguntas viejas', () => {
    const p = perfilDeVos();
    const prompt = armarPromptPregunta(p, fila('la-escuela'), [{ pregunta: '¿Qué ves al entrar a esa casa?', respuesta: 'Una casa de tres pisos en Martínez.' }], [{ id: 'casa-infancia', tema: 'La casa de la infancia' }, { id: 'los-tuyos-hoy', tema: 'Quiénes son los suyos hoy' }]);
    expect(prompt).toContain('Sos el biógrafo');
    expect(prompt).toContain('P: ¿Qué ves al entrar a esa casa?');
    expect(prompt).toContain('- casa-infancia: La casa de la infancia');
    expect(prompt).toContain('TEMAS QUE YA LE PREGUNTASTE');
    expect(prompt).toContain('un maestro');
    expect(prompt).toContain('el guion\nte da el tema, no el texto');
  });
  it('con 40 temas hechos y 3 respuestas, el prompt sigue corto (el texto fijo + ficha vacía + 40 líneas)', () => {
    const ya = Array.from({ length: 40 }, (_, i) => ({ id: `fila-${i}`, tema: 'Un tema de una línea para el biógrafo, de unas quince palabras más o menos' }));
    const conv = Array.from({ length: 3 }, () => ({ pregunta: 'P '.repeat(20), respuesta: 'R '.repeat(400) }));
    const prompt = armarPromptPregunta(perfilDeVos(), fila('mensaje'), conv, ya);
    expect(prompt.length).toBeLessThan(12_000);
  });
});

describe('escribirPregunta (cliente falso)', () => {
  const clienteQueDevuelve = (textos: string[]) => {
    let i = 0;
    return { messages: { create: vi.fn(async () => ({ content: [{ type: 'text', text: textos[Math.min(i++, textos.length - 1)] }], usage: { input_tokens: 10, output_tokens: 5 } })) } } as unknown as Anthropic;
  };
  it('usa Opus, da lugar al pensamiento (max_tokens 1500) y devuelve la pregunta limpia de comillas', async () => {
    const c = clienteQueDevuelve(['«¿Cómo era tu escuela, Naza?»']);
    const r = await escribirPregunta(c, perfilDeVos(), fila('la-escuela'), [], []);
    expect(r.ok).toBe(true); expect(r.texto).toBe('¿Cómo era tu escuela, Naza?');
    const args = (c.messages.create as ReturnType<typeof vi.fn>).mock.calls[0][0] as { model: string; max_tokens: number };
    expect(args.model).toBe('claude-opus-5'); expect(args.max_tokens).toBe(1500);
  });
  it('tres intentos con el motivo y marcada si el tercero también falla; un texto vacío queda marcado como "pregunta"', async () => {
    const c = clienteQueDevuelve(['Contame de tu escuela.', '', '']);
    const r = await escribirPregunta(c, perfilDeVos(), fila('la-escuela'), [], []);
    expect(r.ok).toBe(false); expect(r.usos).toHaveLength(3); expect(r.marca?.control).toBe('pregunta');
    const segunda = (c.messages.create as ReturnType<typeof vi.fn>).mock.calls[1][0] as { messages: { content: string }[] };
    expect(segunda.messages[0].content).toMatch(/no sirvió porque/);
  });
});
```

- [ ] **Step 2: Correr y ver que falla**

Run: `cd entrevistador && npx vitest run test/pregunta-v2.test.ts`
Expected: FAIL (NUCLEO tiene los ids viejos; `objetivoEnTexto` no conoce `pormenores` ni `repregunta`; `max_tokens` 400).

- [ ] **Step 3: Reescribir `pregunta-v2.ts`**

```ts
import type Anthropic from '@anthropic-ai/sdk';
import type { Perfil } from './perfil.js';
import type { Tramo } from './plan-preguntas.js';
import { GUION, type FilaObjetivo, type Bloque } from './guion-v2.js';
import { encargoDelBiografo, perfilEnTexto } from './encargo-entrevista.js';
import { controlarPregunta as controlarSalida, INTENTOS, type Marca } from './control-pregunta.js';
import { MODELO_PREGUNTA } from './modelos-v2.js';

export { perfilEnTexto };
export type { Bloque };

// La pregunta del día (esqueleto v2, 24/09). El guion (`guion-v2.ts`) decide QUÉ se pregunta y si
// entra para esta persona; acá el modelo decide CÓMO preguntárselo: con la ficha corta, las últimas
// respuestas, los temas ya hechos (no sus textos: el prompt no crece) y el tema con sus pormenores.
// Lo que devuelve pasa por los controles (trato, largo, que pregunte, lugar, supuestos), tres
// intentos, marcada si falla el último. La repregunta es un objetivo más: "lo que faltó, junto".

/** Las filas del guion tal como las leen los tests y la fábrica (`contexto-v2.ts`): id, tramo, bloque, tema. */
export const NUCLEO: readonly { id: string; tramo: Tramo | null; bloque: Bloque; tema: string }[] = GUION.map((f) => ({
  id: f.id, tramo: f.tramo, bloque: f.id === 'presentacion' ? 'presentacion' : f.etapa, tema: f.tema,
}));

export type Objetivo =
  | ({ tipo: 'nucleo' } & FilaObjetivo)
  | { tipo: 'variable'; id: string; tramo: Tramo; desde: number; hasta: number; anclas: string[] }
  | { tipo: 'objeto'; id: string; tramo: Tramo }
  | { tipo: 'repregunta'; id: string; tramo: Tramo | null; pregunta: string; falto: string[] };

export const BLOQUES = ['presentacion', 'inicio', 'infancia', 'juventud', 'adulto joven', 'adultez media', 'segunda mitad', 'hoy', 'futuro', 'reflexion'] as const;

export type YaHecha = { id: string; tema: string };

export const esPresentacion = (o: Objetivo): boolean => o.tipo === 'nucleo' && o.id === 'presentacion';

/** Cuánto entra de cada ancla de una libre: una línea, no un párrafo. */
const MAX_ANCLA = 160;

export function objetivoEnTexto(o: Objetivo, perfil: Perfil): string {
  if (o.tipo === 'objeto') {
    return `Pedile UNA cosa que tenga en casa de esa época (${o.tramo}): un objeto, un papel, una foto vieja, lo que haya guardado. Con una foto, y que cuente de dónde salió. Si no tiene, no pasa nada: no se insiste nunca.`;
  }
  if (o.tipo === 'repregunta') {
    return [
      `Es una repregunta a lo de hoy. Le preguntaste: "${o.pregunta}". De eso faltó: ${o.falto.map((f) => `"${f}"`).join(', ')}.`,
      'Pedilo junto, en UNA sola pregunta corta, como quien sigue la charla. No digas que es una repregunta, no le pidas que resuma ni que repita lo que ya dijo, no abras un tema nuevo.',
    ].join('\n');
  }
  if (o.tipo === 'variable') {
    const cuando = o.tramo === 'hoy' ? 'su vida de hoy' : `su vida entre los ${o.desde} y los ${o.hasta} años`;
    const anclas = o.anclas.map((a) => a.slice(0, MAX_ANCLA));
    return `Algo de ${cuando} que nombró y no contó: ${anclas.map((a) => `"${a}"`).join('; ')}. Preguntale por eso, como una escena o una persona concreta.`;
  }
  if (o.id === 'presentacion') {
    const tratos = perfil.castellano === 'españa' ? 'de tú o de usted' : 'de vos o de usted';
    const edad = perfil.persona.edad || perfil.persona.anioNacimiento ? '' : 'cuántos años tiene, ';
    return o.tema.replace('{TRATOS}', tratos).replace('{EDAD}', edad);
  }
  const pormenores = o.pormenores.length
    ? `\nPormenores que podés juntar en la misma pregunta (elegí dos o tres según lo que ya contó y pedilos juntos, en una sola pregunta): ${o.pormenores.join('; ')}.`
    : '';
  const escena = o.pideEscena ? '\nPedila como una escena: un día, un lugar, quién estaba.' : '';
  return `${o.tema}${pormenores}${escena}`;
}

export const PROMPT_PREGUNTA_V2 = (encargo: string, conversacion: string, yaHechas: string, objetivo: string) => `
${encargo}

LO ÚLTIMO QUE HABLARON (cada respuesta con la pregunta que la originó):
${conversacion || '(todavía no hablaron)'}

TEMAS QUE YA LE PREGUNTASTE (no vuelvas sobre ninguno; si algo de ahí sirve de puente, una frase):
${yaHechas || '(ninguno)'}

LO QUE TE TOCA PREGUNTAR HOY:
${objetivo}

Tu trabajo hoy es decidir cómo preguntarle esto a ESTA persona, con lo que ya sabés: el guion
te da el tema, no el texto. Si algo que contó sirve de puente, usalo; la pregunta va a lo que
todavía no contó.

Respondé SOLO con la pregunta, sin comillas ni saludo.`;

export function armarPromptPregunta(
  perfil: Perfil,
  objetivo: Objetivo,
  conversacion: { pregunta: string; respuesta: string }[],
  yaHechas: YaHecha[],
  evitar: string[] = [],
): string {
  return PROMPT_PREGUNTA_V2(
    encargoDelBiografo(perfil, evitar),
    conversacion.map((c) => `P: ${c.pregunta}\nR: ${c.respuesta}`).join('\n\n'),
    yaHechas.map((q) => `- ${q.id}: ${q.tema}`).join('\n'),
    objetivoEnTexto(objetivo, perfil),
  );
}

/**
 * Escribe la pregunta (o la repregunta, o el objeto). Hasta `INTENTOS` veces: si el control la
 * rechaza, se lo pide de nuevo diciendo por qué. Si el último también falla, se manda igual, marcada.
 * `max_tokens` 1500: Opus 5 piensa por defecto y eso cuenta como salida; con 400 la pregunta salía
 * cortada o vacía (N12, N41).
 */
export async function escribirPregunta(
  cliente: Anthropic,
  perfil: Perfil,
  objetivo: Objetivo,
  conversacion: { pregunta: string; respuesta: string }[],
  yaHechas: YaHecha[],
  evitar: string[] = [],
): Promise<{ texto: string; ok: boolean; marca?: Marca; usos: Anthropic.Usage[] }> {
  const prompt = armarPromptPregunta(perfil, objetivo, conversacion, yaHechas, evitar);
  const usos: Anthropic.Usage[] = [];
  let texto = '';
  let ultimo: { control: string; motivo: string } | null = null;
  for (let intento = 1; intento <= INTENTOS; intento++) {
    const contenido = intento === 1 ? prompt : `${prompt}\n\nTu versión anterior no sirvió porque ${ultimo!.motivo}. Escribila de nuevo, cuidando eso.`;
    const r = await cliente.messages.create({ model: MODELO_PREGUNTA, max_tokens: 1500, messages: [{ role: 'user', content: contenido }] });
    usos.push(r.usage);
    const bloque = r.content.find((b) => b.type === 'text');
    texto = (bloque && bloque.type === 'text' ? bloque.text : '').trim().replace(/^["«]|["»]$/g, '');
    const control = controlarSalida(texto, perfil, objetivo);
    if (control.ok) return { texto, ok: true, usos };
    ultimo = control;
  }
  return { texto, ok: false, marca: { control: ultimo!.control, motivo: ultimo!.motivo, intentos: INTENTOS }, usos };
}
```

`control-pregunta.ts` importa `type Objetivo` de acá: el tipo nuevo tiene `repregunta` sin `bloque`; la Tarea 8 arregla `controlarLugar`. Hasta entonces `npm run tipos` puede fallar en `controlarLugar` (`objetivo.tipo === 'nucleo' && !objetivo.tramo` sigue compilando; `RANGO_TRAMO[objetivo.tramo!]` también). Si falla, hacer el cambio mínimo de la Tarea 8 Step 3 ahora y anotarlo.

- [ ] **Step 4: Correr y ver que pasa; tipos**

Run: `cd entrevistador && npx vitest run test/pregunta-v2.test.ts && npm run tipos`
Expected: PASS. Los tests de `secuencia`, `estado-v2` y `manual-v2` van a fallar hasta las Tareas 7, 10 y 11: no correr la suite entera todavía.

- [ ] **Step 5: Commit**

```bash
git add entrevistador/src/ia/pregunta-v2.ts entrevistador/test/pregunta-v2.test.ts
git commit -m "esqueleto v2: la pregunta sale del guion, la repregunta es un objetivo, y el prompt lleva temas hechos en vez de textos"
```

---

### Task 6: `plan-preguntas.ts` queda solo con los tramos y las edades

**Files:**
- Modify: `entrevistador/src/ia/plan-preguntas.ts` (borrar `TRAMOS`, `PESO_HOY`, `PESO_BISAGRA`, `Plan`, `PISO_VARIABLES`, `TECHO_VARIABLES`, `TOPE_PREGUNTAS`, `ANIOS_POR_VARIABLE`, `cuantasVariables`, `edadDeBisagra`, `planificar`, `replanificar`)
- Test: `entrevistador/test/plan-preguntas.test.ts` (quedan solo los tests de `edadDe` y `rangoDeEtapa`)

**Interfaces:**
- Produces (lo que queda): `type Tramo`, `RANGO_TRAMO`, `type Variable`, `edadDe`, `rangoDeEtapa`. Nada más importa `planificar` después de las Tareas 7 y 10.

- [ ] **Step 1: Dejar en el test solo lo que queda**

Abrir `entrevistador/test/plan-preguntas.test.ts`, borrar los `describe` de `cuantasVariables`, `planificar` y `replanificar`; dejar los de `edadDe` y `rangoDeEtapa` (si no existen, escribirlos):

```ts
import { describe, it, expect } from 'vitest';
import { edadDe, rangoDeEtapa, RANGO_TRAMO } from '../src/ia/plan-preguntas.js';
import { perfilVacio } from '../src/ia/perfil.js';

describe('edadDe', () => {
  it('la edad dicha, el medio de un rango, o la que sale del año de nacimiento', () => {
    const p = perfilVacio();
    expect(edadDe(p, 2026)).toBeNull();
    p.persona.edad = { valor: 'entre 65 y 75', fuente: 'deducido' };
    expect(edadDe(p, 2026)).toBe(70);
    p.persona.edad = null; p.persona.anioNacimiento = { valor: '1950', fuente: 'ficha' };
    expect(edadDe(p, 2026)).toBe(76);
  });
});
describe('rangoDeEtapa', () => {
  it('"7 a 17", "desde los 12", "hasta los 10"', () => {
    expect(rangoDeEtapa('7 a 17', 70)).toEqual([7, 17]);
    expect(rangoDeEtapa('desde los 12', 70)).toEqual([12, 70]);
    expect(rangoDeEtapa('hasta los 10', 70)).toEqual([0, 10]);
    expect(rangoDeEtapa('de chica', 70)).toBeNull();
  });
  it('los tramos cubren de 0 a 200 sin huecos', () => {
    expect(RANGO_TRAMO.infancia[0]).toBe(0);
    expect(RANGO_TRAMO['segunda mitad'][1]).toBe(200);
  });
});
```

- [ ] **Step 2: Borrar el plan por peso de `plan-preguntas.ts`**

Dejar el archivo así (el comentario de cabecera se reescribe):

```ts
import type { Perfil } from './perfil.js';

// Los tramos de una vida y las edades (esqueleto v2, 24/09). Antes acá vivía el reparto de
// preguntas variables por peso de bisagras: cada bisagra valía cinco años de vida y el período del
// que más hablaba la persona se llevaba más preguntas (análisis del piloto, A.2). Ahora el guion
// decide qué se pregunta (`guion-v2.ts`); acá queda la tabla que comparten el guion, la secuencia,
// el control de lugar y la fábrica (que la copia a mano en `fabrica/scripts/contexto-v2.ts`).

export type Tramo = 'infancia' | 'juventud' | 'adulto joven' | 'adultez media' | 'segunda mitad' | 'hoy';

/** El rango de edad de cada tramo (0-200 para "hoy": no es una edad, es el presente). */
export const RANGO_TRAMO: Record<Tramo, [number, number]> = {
  infancia: [0, 12],
  juventud: [13, 22],
  'adulto joven': [23, 35],
  'adultez media': [36, 55],
  'segunda mitad': [56, 200],
  hoy: [0, 200],
};

/** Una pregunta libre: algo que nombró y no contó, de un tramo. `anclas` es lo que nombró (de `noSabemos`). */
export type Variable = { tramo: Tramo; desde: number; hasta: number; anclas: string[] };

/** La edad del perfil: la dicha, el medio de un rango, o la que sale del año de nacimiento. */
export function edadDe(perfil: Perfil, anioActual: number): number | null {
  const numeros = (texto: string) => (texto.match(/\d+/g) ?? []).map(Number);
  const edad = perfil.persona.edad?.valor;
  if (edad) {
    const n = numeros(String(edad)).filter((x) => x < 130);
    if (n.length >= 2) return Math.round((n[0] + n[1]) / 2);
    if (n.length === 1) return n[0];
  }
  const anio = perfil.persona.anioNacimiento?.valor;
  if (anio) {
    const n = numeros(String(anio)).find((x) => x > 1900 && x <= anioActual);
    if (n) return anioActual - n;
  }
  return null;
}

/** "7 a 17", "desde los 12", "68-hoy", "hasta los 10" → [desde, hasta]; si no dice edades, null. */
export function rangoDeEtapa(edades: string, edadActual: number): [number, number] | null {
  const texto = edades.toLowerCase();
  const n = (texto.match(/\d+/g) ?? []).map(Number);
  if (n.length === 0) return null;
  if (n.length >= 2) return [n[0], n[1]];
  if (/hasta/.test(texto)) return [0, n[0]];
  return [n[0], edadActual];
}
```

- [ ] **Step 3: Correr**

Run: `cd entrevistador && npx vitest run test/plan-preguntas.test.ts`
Expected: PASS. `npm run tipos` va a fallar en `secuencia.ts` y `estado-v2.ts` (importan `planificar`/`TECHO_VARIABLES`): es esperado hasta las Tareas 7 y 10. Anotar y seguir.

- [ ] **Step 4: Commit**

```bash
git add entrevistador/src/ia/plan-preguntas.ts entrevistador/test/plan-preguntas.test.ts
git commit -m "esqueleto v2: se va el reparto de variables por peso de bisagras; quedan los tramos y las edades"
```

---

### Task 7: La secuencia fija: armar, rearmar, cubiertos, caídas, libres, objetos

**Files:**
- Modify: `entrevistador/src/ia/secuencia.ts` (se reescribe entero)
- Test: `entrevistador/test/secuencia.test.ts` (se reescribe entero)

**Interfaces:**
- Consumes: `armarGuion`, `MAX_LIBRES`, `tope`, `Caida`, `FilaObjetivo` (Tarea 4); `Objetivo`, `NUCLEO` (Tarea 5); `RANGO_TRAMO`, `edadDe`, `Tramo` (Tarea 6); `Perfil`.
- Produces:

```ts
export type Hecha = { id: string; orden: number; tramo: Tramo | null; objetivo: Objetivo };          // igual que hoy (la fábrica la lee)
export type Secuencia = { pendientes: Objetivo[]; hechas: Hecha[]; cubiertos: string[]; caidas: Caida[]; objetos: { orden: number; tramo: Tramo; final?: boolean }[]; ultimoTramo: Tramo | null; libres: number };
export function armarSecuencia(perfil: Perfil, anioActual?: number): Secuencia;
export function rearmar(s: Secuencia, perfil: Perfil, anioActual?: number): Secuencia;   // el guion nuevo, respetando hechas, cubiertos y libres ya agregadas
export function proxima(s: Secuencia): Objetivo | null;
export function avanzar(s: Secuencia, o: Objetivo, orden: number): Secuencia;
export function aplicarCubiertos(s: Secuencia, perfil: Perfil): Secuencia;
export function etapaCerrada(s: Secuencia, hecha: Objetivo): Tramo | null;                  // el tramo que se acaba de cerrar con esta hecha, o null
export function agregarLibre(s: Secuencia, perfil: Perfil, tramo: Tramo, anioActual?: number): { secuencia: Secuencia; libre: Objetivo | null };
export function tramoDe(o: Objetivo): Tramo | null;
export function tocaObjeto(s: Secuencia, siguiente: Objetivo | null, sinFotos: boolean): Tramo | null;   // igual que hoy
export function registrarObjeto(s: Secuencia, tramo: Tramo, orden: number, final?: boolean): Secuencia; // igual que hoy
export const MAX_OBJETOS = 8;
```

- [ ] **Step 1: Reescribir `test/secuencia.test.ts`**

```ts
import { describe, it, expect } from 'vitest';
import { armarSecuencia, rearmar, proxima, avanzar, aplicarCubiertos, etapaCerrada, agregarLibre, tocaObjeto, registrarObjeto, tramoDe, MAX_OBJETOS } from '../src/ia/secuencia.js';
import { perfilVacio, aplicarCambios, type Perfil } from '../src/ia/perfil.js';
import type { Objetivo } from '../src/ia/pregunta-v2.js';

const ANIO = 2026;
const dicho = (valor: string) => ({ valor, fuente: 'dicho' as const });
const persona = (nombre: string, vinculo: string) => ({ nombre, vinculo, vive: 'si' as const, fuente: 'dicho' as const });
function naza(): Perfil {
  const p = perfilVacio(); p.persona.edad = dicho('27');
  p.personas.push(persona('Ariel', 'hermano mayor'), persona('Juan Manuel', 'hermano del medio'), persona('Ima', 'pareja actual'));
  p.etapas.push({ edades: '0 a 22', lugar: 'Martínez, provincia de Buenos Aires', conQuien: '', queHacia: '', fuente: 'dicho' });
  return p;
}
const ids = (s: ReturnType<typeof armarSecuencia>) => s.pendientes.map((o) => o.id);
/** Avanza hasta que la próxima sea `id` (sin incluirla). */
function hastaAntesDe(s: ReturnType<typeof armarSecuencia>, id: string) {
  let orden = 0;
  while (proxima(s) && proxima(s)!.id !== id) s = avanzar(s, proxima(s)!, orden++);
  return { s, orden };
}

describe('armarSecuencia y rearmar', () => {
  it('con la ficha vacía arma el guion sin edad (infancia, juventud, adulto joven, hoy, futuro, reflexión) y la presentación primero', () => {
    const s = armarSecuencia(perfilVacio(), ANIO);
    expect(proxima(s)?.id).toBe('presentacion');
    expect(ids(s)).toContain('oficio'); expect(ids(s)).not.toContain('el-trabajo-y-la-plata');
    expect(s.libres).toBe(0); expect(s.caidas.length).toBeGreaterThan(0);
  });
  it('rearmar con la ficha nueva respeta lo hecho y agrega lo que ahora aplica (los hermanos después del censo)', () => {
    let s = armarSecuencia(perfilVacio(), ANIO);
    for (let i = 0; i < 3; i++) s = avanzar(s, proxima(s)!, i); // presentación, casa, los-tuyos-hoy
    expect(ids(s).some((id) => id.startsWith('hermano-'))).toBe(false);
    const r = rearmar(s, naza(), ANIO);
    expect(r.hechas).toHaveLength(3);
    expect(ids(r)).toContain('hermano-ariel'); expect(ids(r)).toContain('pareja-como-llego');
    expect(ids(r)).not.toContain('casa-infancia');
    expect(proxima(r)?.id).toBe('mapa-casas');
  });
  it('rearmar no resucita una fila cubierta ni borra una libre ya agregada', () => {
    let s = armarSecuencia(naza(), ANIO);
    s = aplicarCubiertos(s, aplicarCambios(naza(), { cubiertos: ['la-escuela'] }));
    const libre: Objetivo = { tipo: 'variable', id: 'libre-infancia-1', tramo: 'infancia', desde: 0, hasta: 12, anclas: ['x'] };
    s = { ...s, pendientes: [...s.pendientes, libre], libres: 1 };
    const r = rearmar(s, aplicarCambios(naza(), { agregarPersonas: [persona('Lola', 'hija')] }), ANIO);
    expect(ids(r)).not.toContain('la-escuela'); expect(ids(r)).toContain('libre-infancia-1'); expect(ids(r)).toContain('hijo-lola');
    expect(r.cubiertos).toEqual(['la-escuela']);
  });
});

describe('proxima y avanzar', () => {
  it('avanzar pasa a hechas con orden y tramo, y al final null; el objetivo va entero (la fábrica lo lee)', () => {
    let s = armarSecuencia(naza(), ANIO);
    s = avanzar(s, proxima(s)!, 0);
    expect(s.hechas[0]).toMatchObject({ id: 'presentacion', orden: 0, tramo: null });
    expect((s.hechas[0].objetivo as { bloque: string }).bloque).toBe('presentacion');
    for (let i = 1; proxima(s); i++) s = avanzar(s, proxima(s)!, i);
    expect(proxima(s)).toBeNull();
    expect(s.hechas.at(-1)?.id).toBe('cinco-minutos');
  });
});

describe('aplicarCubiertos', () => {
  it('una fila que la ficha da por contada se cae, con registro; el inicio, hoy, futuro y la reflexión nunca', () => {
    const s = aplicarCubiertos(armarSecuencia(naza(), ANIO), aplicarCambios(naza(), { cubiertos: ['abuelos-y-raices', 'mapa-casas', 'cinco-minutos', 'un-dia-de-hoy', 'lo-que-te-queda-por-hacer', 'no-existe'] }));
    expect(ids(s)).not.toContain('abuelos-y-raices');
    expect(ids(s)).toEqual(expect.arrayContaining(['mapa-casas', 'cinco-minutos', 'un-dia-de-hoy', 'lo-que-te-queda-por-hacer']));
    expect(s.cubiertos).toEqual(['abuelos-y-raices']);
  });
  it('una fila expandida se cubre por su id instanciado', () => {
    const s = aplicarCubiertos(armarSecuencia(naza(), ANIO), aplicarCambios(naza(), { cubiertos: ['hermano-ariel'] }));
    expect(ids(s)).not.toContain('hermano-ariel'); expect(ids(s)).toContain('hermano-juan-manuel');
  });
});

describe('etapaCerrada y agregarLibre', () => {
  it('cerrar la infancia (última fila del tramo hecha) devuelve infancia; si quedan pendientes del tramo, null', () => {
    const { s } = hastaAntesDe(armarSecuencia(naza(), ANIO), 'la-escuela');
    const laEscuela = proxima(s)!;
    const antes = etapaCerrada(s, laEscuela);
    expect(antes).toBeNull();
    const despues = etapaCerrada(avanzar(s, laEscuela, 99), laEscuela);
    expect(despues).toBe('infancia');
  });
  it('la libre nace del primer noSabemos de esa etapa ([infancia] …), va primera, y no se repite; sin noSabemos de la etapa, nada', () => {
    const p = aplicarCambios(naza(), { agregarNoSabemos: ['[juventud] Cómo se arreglaron con Ciano', '[infancia] Por qué no conoció a sus abuelos', '[infancia] Qué pasó con los perros'] });
    const s0 = armarSecuencia(p, ANIO);
    const a = agregarLibre(s0, p, 'infancia', ANIO);
    expect(a.libre).toMatchObject({ tipo: 'variable', id: 'libre-infancia-1', tramo: 'infancia', desde: 0, hasta: 12, anclas: ['Por qué no conoció a sus abuelos'] });
    expect(proxima(a.secuencia)?.id).toBe('libre-infancia-1');
    expect(a.secuencia.libres).toBe(1);
    const b = agregarLibre(a.secuencia, p, 'infancia', ANIO);
    expect(b.libre?.anclas).toEqual(['Qué pasó con los perros']);
    expect(agregarLibre(b.secuencia, p, 'adulto joven', ANIO).libre).toBeNull();
  });
  it('no pasa de MAX_LIBRES ni del techo', () => {
    const p = aplicarCambios(naza(), { agregarNoSabemos: Array.from({ length: 6 }, (_, i) => `[infancia] cosa ${i}`) });
    let s = armarSecuencia(p, ANIO);
    for (let i = 0; i < 6; i++) s = agregarLibre(s, p, 'infancia', ANIO).secuencia;
    expect(s.libres).toBe(4);
    const grande = perfilVacio(); grande.persona.edad = dicho('82');
    grande.personas.push(persona('Rubén', 'marido'), persona('A', 'hija'), persona('B', 'hijo'), persona('C', 'hijo'), persona('D', 'hermana'), persona('E', 'hermano'), persona('F', 'nieto'));
    const g = aplicarCambios(grande, { agregarNoSabemos: ['[infancia] algo'] });
    const sg = armarSecuencia(g, ANIO);
    const total = (x: typeof sg) => x.pendientes.length + x.hechas.length - 1;
    if (total(sg) >= 44) expect(agregarLibre(sg, g, 'infancia', ANIO).libre).toBeNull();
    else expect(total(agregarLibre(sg, g, 'infancia', ANIO).secuencia)).toBeLessThanOrEqual(44);
  });
});

describe('tramoDe', () => {
  it('la fila trae su tramo; inicio, futuro y reflexión dan null; ya no hay default a adulto joven', () => {
    const s = armarSecuencia(naza(), ANIO);
    const de = (id: string) => tramoDe(s.pendientes.find((o) => o.id === id)!);
    expect(de('oficio')).toBe('adulto joven'); expect(de('un-lugar-que-cambio-algo')).toBeNull(); expect(de('mensaje')).toBeNull(); expect(de('mapa-casas')).toBeNull();
  });
});

describe('tocaObjeto y registrarObjeto', () => {
  it('nunca en el inicio; toca cuando un tramo se cerró y no tiene objeto; uno por tramo; sinFotos apaga; hasta 8; y el final una sola vez', () => {
    let s = armarSecuencia(naza(), ANIO);
    for (let i = 0; i < 5; i++) s = avanzar(s, proxima(s)!, i);
    expect(tocaObjeto(s, proxima(s), false)).toBeNull();
    const { s: s2, orden } = hastaAntesDe(s, 'a-los-quince');
    expect(tocaObjeto(s2, proxima(s2), false)).toBe('infancia');
    expect(tocaObjeto(s2, proxima(s2), true)).toBeNull();
    const s3 = registrarObjeto(s2, 'infancia', 101);
    expect(tocaObjeto(s3, proxima(s3), false)).toBeNull();
    let s4 = s3;
    for (let i = orden; proxima(s4); i++) s4 = avanzar(s4, proxima(s4)!, i);
    expect(tocaObjeto(s4, null, false)).not.toBeNull();
    const s5 = registrarObjeto(s4, tocaObjeto(s4, null, false)!, 102, true);
    expect(tocaObjeto(s5, null, false)).toBeNull();
    let lleno = s5;
    for (let i = 103; lleno.objetos.length < MAX_OBJETOS; i++) lleno = registrarObjeto(lleno, 'hoy', i);
    expect(tocaObjeto(lleno, null, false)).toBeNull();
  });
});
```

- [ ] **Step 2: Correr y ver que falla**

Run: `cd entrevistador && npx vitest run test/secuencia.test.ts`
Expected: FAIL (`armarSecuencia` espera variables; `rearmar`, `aplicarCubiertos`, `etapaCerrada`, `agregarLibre` no existen).

- [ ] **Step 3: Reescribir `secuencia.ts`**

```ts
import { armarGuion, MAX_LIBRES, tope, type Caida } from './guion-v2.js';
import type { Objetivo } from './pregunta-v2.js';
import { RANGO_TRAMO, edadDe, type Tramo } from './plan-preguntas.js';
import type { Perfil } from './perfil.js';

// La secuencia del esqueleto v2 (24/09): fija, por etapas, sin puerta abierta ni variables por peso.
// El guion (`guion-v2.ts`) dice qué filas entran para esta persona; acá se guarda dónde está la
// entrevista: pendientes, hechas (la fábrica las lee para ubicar cada respuesta en su época),
// cubiertos (filas que la ficha dio por contadas), caídas (filas que no aplican, con motivo), las
// libres agregadas al cerrar cada etapa y los objetos. Todo puro: se guarda tal cual en
// `contexto.v2.secuencia`.

export type Hecha = { id: string; orden: number; tramo: Tramo | null; objetivo: Objetivo };
export type Secuencia = {
  pendientes: Objetivo[];
  hechas: Hecha[];
  cubiertos: string[];
  caidas: Caida[];
  /** `final` marca el objeto de cierre: pasa una sola vez. */
  objetos: { orden: number; tramo: Tramo; final?: boolean }[];
  ultimoTramo: Tramo | null;
  /** Cuántas libres se agregaron (hasta MAX_LIBRES). */
  libres: number;
};

export const MAX_OBJETOS = 8;
/** Las etapas cuyas filas nunca se caen por "cubierto". */
const NO_SE_CUBRE = new Set(['presentacion', 'inicio', 'hoy', 'futuro', 'reflexion']);

export function tramoDe(o: Objetivo): Tramo | null {
  if (o.tipo === 'variable' || o.tipo === 'objeto') return o.tramo;
  return o.tramo ?? null;
}
const bloqueDe = (o: Objetivo): string => (o.tipo === 'nucleo' ? o.bloque : o.tipo === 'variable' ? o.tramo : o.tipo === 'objeto' ? o.tramo : (o.tramo ?? 'inicio'));

export function armarSecuencia(perfil: Perfil, anioActual = new Date().getFullYear()): Secuencia {
  const { filas, caidas } = armarGuion(perfil, anioActual);
  return { pendientes: filas.map((f) => ({ tipo: 'nucleo' as const, ...f })), hechas: [], cubiertos: [], caidas, objetos: [], ultimoTramo: null, libres: 0 };
}

/**
 * El guion de nuevo con la ficha de hoy (cambió la edad o el árbol): las filas que ya se hicieron o
 * se cubrieron no vuelven; las libres ya agregadas se conservan en su lugar; lo que ahora aplica
 * entra en su etapa.
 */
export function rearmar(s: Secuencia, perfil: Perfil, anioActual = new Date().getFullYear()): Secuencia {
  const { filas, caidas } = armarGuion(perfil, anioActual);
  const yaNo = new Set([...s.hechas.map((h) => h.id), ...s.cubiertos]);
  const nuevas: Objetivo[] = filas.filter((f) => !yaNo.has(f.id)).map((f) => ({ tipo: 'nucleo' as const, ...f }));
  // Las libres se quedan delante de la primera fila de su tramo o después.
  const libres = s.pendientes.filter((o) => o.tipo === 'variable');
  const pendientes: Objetivo[] = [];
  for (const o of nuevas) {
    for (const l of libres) if (l.tipo === 'variable' && !pendientes.includes(l) && (tramoDe(o) === l.tramo || ordenBloque(bloqueDe(o)) > ordenBloque(l.tramo))) pendientes.push(l);
    pendientes.push(o);
  }
  for (const l of libres) if (!pendientes.includes(l)) pendientes.push(l);
  return { ...s, pendientes, caidas };
}

const BLOQUES_ORDEN = ['presentacion', 'inicio', 'infancia', 'juventud', 'adulto joven', 'adultez media', 'segunda mitad', 'hoy', 'futuro', 'reflexion'];
const ordenBloque = (b: string) => BLOQUES_ORDEN.indexOf(b);

export function proxima(s: Secuencia): Objetivo | null {
  return s.pendientes[0] ?? null;
}

export function avanzar(s: Secuencia, o: Objetivo, orden: number): Secuencia {
  const tramo = tramoDe(o);
  return {
    ...s,
    pendientes: s.pendientes.filter((p) => p.id !== o.id),
    hechas: [...s.hechas, { id: o.id, orden, tramo, objetivo: o }],
    ultimoTramo: tramo ?? s.ultimoTramo,
  };
}

/** Las filas que la ficha de hoy dio por contadas se caen (menos inicio, hoy, futuro y reflexión), con registro. */
export function aplicarCubiertos(s: Secuencia, perfil: Perfil): Secuencia {
  let pendientes = [...s.pendientes];
  const cubiertos = [...s.cubiertos];
  for (const id of perfil.cubiertos) {
    const o = pendientes.find((p) => p.id === id);
    if (!o || o.tipo !== 'nucleo' || NO_SE_CUBRE.has(o.bloque)) continue;
    pendientes = pendientes.filter((p) => p.id !== id);
    if (!cubiertos.includes(id)) cubiertos.push(id);
  }
  return { ...s, pendientes, cubiertos };
}

/** Si con `hecha` ya no queda ninguna pendiente de su tramo, ese tramo se cerró. */
export function etapaCerrada(s: Secuencia, hecha: Objetivo): Tramo | null {
  const tramo = tramoDe(hecha);
  if (!tramo || tramo === 'hoy') return null;
  if (s.pendientes.some((p) => p.id === hecha.id)) return null;
  return s.pendientes.some((p) => tramoDe(p) === tramo) ? null : tramo;
}

const totalPreguntas = (s: Secuencia) => s.pendientes.length + s.hechas.filter((h) => h.id !== 'presentacion').length;

/**
 * Una pregunta libre al cerrar una etapa: el primer "[etapa] …" de `noSabemos` que todavía no se
 * usó, hasta MAX_LIBRES y sin pasar el techo. Va primera: es lo que la persona nombró y no contó.
 */
export function agregarLibre(s: Secuencia, perfil: Perfil, tramo: Tramo, anioActual = new Date().getFullYear()): { secuencia: Secuencia; libre: Objetivo | null } {
  if (s.libres >= MAX_LIBRES || totalPreguntas(s) >= tope(edadDe(perfil, anioActual))) return { secuencia: s, libre: null };
  const usadas = new Set([...s.pendientes, ...s.hechas.map((h) => h.objetivo)].flatMap((o) => (o.tipo === 'variable' ? o.anclas : [])));
  const prefijo = `[${tramo}]`;
  const ancla = perfil.noSabemos.map((n) => n.trim()).filter((n) => n.toLowerCase().startsWith(prefijo)).map((n) => n.slice(prefijo.length).trim()).find((n) => n && !usadas.has(n));
  if (!ancla) return { secuencia: s, libre: null };
  const n = [...s.pendientes, ...s.hechas.map((h) => h.objetivo)].filter((o) => o.tipo === 'variable' && o.tramo === tramo).length + 1;
  const edad = edadDe(perfil, anioActual);
  const [desde, hasta] = tramo === 'segunda mitad' && edad !== null ? [RANGO_TRAMO[tramo][0], edad] : RANGO_TRAMO[tramo];
  const libre: Objetivo = { tipo: 'variable', id: `libre-${tramo}-${n}`, tramo, desde, hasta, anclas: [ancla] };
  return { secuencia: { ...s, pendientes: [libre, ...s.pendientes], libres: s.libres + 1 }, libre };
}

const enElInicio = (s: Secuencia) => s.pendientes.some((o) => o.tipo === 'nucleo' && o.bloque === 'inicio');

/**
 * El objeto de un tramo toca cuando el tramo se CERRÓ (hay una hecha con ese tramo y no queda ningún
 * pendiente que apunte ahí); nunca en el inicio; `sinFotos` los apaga; MAX_OBJETOS los corta. Al
 * terminar (`siguiente === null`) toca un objeto final, una sola vez (`final: true`).
 */
export function tocaObjeto(s: Secuencia, siguiente: Objetivo | null, sinFotos: boolean): Tramo | null {
  if (sinFotos || s.objetos.length >= MAX_OBJETOS) return null;
  if (siguiente === null) {
    if (s.objetos.some((o) => o.final)) return null;
    return s.ultimoTramo ?? 'hoy';
  }
  if (enElInicio(s) || s.ultimoTramo === null) return null;
  const tramo = s.ultimoTramo;
  if (s.pendientes.some((p) => tramoDe(p) === tramo)) return null;
  if (s.objetos.some((o) => o.tramo === tramo && !o.final)) return null;
  return tramo;
}

export function registrarObjeto(s: Secuencia, tramo: Tramo, orden: number, final = false): Secuencia {
  return { ...s, objetos: [...s.objetos, final ? { orden, tramo, final } : { orden, tramo }] };
}
```

Nota: `bloqueDe` para una `repregunta` nunca se usa en pendientes (la repregunta no entra a la secuencia); queda por completitud del tipo.

- [ ] **Step 4: Correr y ver que pasa; tipos**

Run: `cd entrevistador && npx vitest run test/secuencia.test.ts test/guion-v2.test.ts`
Expected: PASS. Si el test de `tocaObjeto` no encuentra `'a-los-quince'` porque la infancia cerró antes, revisar `hastaAntesDe`: el objetivo es llegar justo después de la última fila de infancia. `npm run tipos` sigue fallando en `estado-v2.ts` (Tarea 10).

- [ ] **Step 5: Commit**

```bash
git add entrevistador/src/ia/secuencia.ts entrevistador/test/secuencia.test.ts
git commit -m "esqueleto v2: la secuencia fija por etapas, con cubiertos, caídas, las libres al cerrar cada etapa y los objetos"
```

---

### Task 8: La evaluación con "qué faltó" (Sonnet), la evaluación reducida (Haiku) y el control de lugar para repreguntas

**Files:**
- Modify: `entrevistador/src/ia/evaluar-v2.ts` (se reescribe), `entrevistador/src/ia/control-pregunta.ts:48-53` (`controlarLugar`)
- Test: `entrevistador/test/evaluar-v2.test.ts` (se reescribe), `entrevistador/test/control-pregunta.test.ts` (un test más)

**Interfaces:**
- Consumes: `Objetivo` (Tarea 5), `MODELO_EVALUACION`, `MODELO_PEDIDOS` (Tarea 1), `encargoDelBiografo`.
- Produces:

```ts
export type EvaluacionV2 = { suficiente: boolean; falto: string[]; reservado?: boolean; reservadoTramo?: string; dejarTema?: string; hoyNo?: boolean; quiereParar?: boolean };
export type Pedidos = Pick<EvaluacionV2, 'reservado' | 'reservadoTramo' | 'dejarTema' | 'hoyNo' | 'quiereParar'>;
export function armarPromptEvaluar(perfil, objetivo: Objetivo, pregunta, respuesta, segundos, conversacion, evitar): string;
export function parsearEvaluacion(salida: string): EvaluacionV2;            // JSON roto → { suficiente: true, falto: [] }
export async function evaluarV2(cliente, perfil, objetivo, pregunta, respuesta, segundos, conversacion, evitar): Promise<{ evaluacion: EvaluacionV2; usos: Anthropic.Usage[] }>;  // UNA llamada, sin reintentos, sin escribir la repregunta
export function armarPromptPedidos(respuesta: string): string;
export async function evaluarPedidos(cliente, respuesta): Promise<{ pedidos: Pedidos; usos: Anthropic.Usage[] }>;
export const DIAS_SIN_REPREGUNTAR = 3; export function hayCansancio(...)  // igual que hoy
```

La repregunta ya no se escribe acá: la escribe `escribirPregunta` (Opus) con el objetivo `{ tipo: 'repregunta', falto }` (Tarea 11). Por eso desaparecen `marca` e `INTENTOS` de este módulo.

- [ ] **Step 1: Reescribir `test/evaluar-v2.test.ts`**

```ts
import { describe, it, expect, vi } from 'vitest';
import type Anthropic from '@anthropic-ai/sdk';
import { armarPromptEvaluar, parsearEvaluacion, evaluarV2, armarPromptPedidos, evaluarPedidos, hayCansancio } from '../src/ia/evaluar-v2.js';
import { perfilVacio } from '../src/ia/perfil.js';
import type { Objetivo } from '../src/ia/pregunta-v2.js';

const laEscuela: Objetivo = { tipo: 'nucleo', id: 'la-escuela', tramo: 'infancia', bloque: 'infancia', tema: 'La escuela primaria', pormenores: ['un maestro', 'un compañero', 'cómo le iba', 'si cambió de colegio y por qué'], fila: 'la-escuela' };
const cliente = (texto: string) => ({ messages: { create: vi.fn(async () => ({ content: [{ type: 'text', text: texto }], usage: { input_tokens: 10, output_tokens: 5 } })) } } as unknown as Anthropic);

describe('armarPromptEvaluar', () => {
  it('lleva el encargo, la conversación, la fila con sus pormenores, la pregunta y la respuesta con su duración; pide "falto" y no una repregunta', () => {
    const p = armarPromptEvaluar(perfilVacio(), laEscuela, '¿Cómo era tu escuela?', 'Tuve una maestra, la señorita Ana.', 20, [{ pregunta: 'P1', respuesta: 'R1' }], ['la enfermedad']);
    expect(p).toContain('Sos el biógrafo');
    expect(p).toContain('P: P1'); expect(p).toContain('un maestro'); expect(p).toContain('¿Cómo era tu escuela?'); expect(p).toContain('duró 20 segundos');
    expect(p).toContain('"falto"'); expect(p).not.toMatch(/"repregunta"/);
    expect(p).toContain('la enfermedad');
  });
});

describe('parsearEvaluacion', () => {
  it('lee suficiente y falto; lo que viene mal tipado se ignora; roto → alcanza sin falto', () => {
    expect(parsearEvaluacion('{"suficiente": false, "falto": ["un maestro", 3, "cómo le iba"], "dejarTema": "x", "hoyNo": "sí"}')).toEqual({ suficiente: false, falto: ['un maestro', 'cómo le iba'], dejarTema: 'x' });
    expect(parsearEvaluacion('bla')).toEqual({ suficiente: true, falto: [] });
    expect(parsearEvaluacion('{"suficiente": true}')).toEqual({ suficiente: true, falto: [] });
  });
  it('falto se corta en 4 y se limpia', () => {
    const e = parsearEvaluacion('{"suficiente": false, "falto": ["a","b","c","d","e"," "]}');
    expect(e.falto).toEqual(['a', 'b', 'c', 'd']);
  });
});

describe('evaluarV2', () => {
  it('una sola llamada con Sonnet y max_tokens 1000; devuelve la evaluación y el uso', async () => {
    const c = cliente('{"suficiente": false, "falto": ["un maestro"]}');
    const r = await evaluarV2(c, perfilVacio(), laEscuela, 'P', 'R', 30, [], []);
    expect(r.evaluacion).toEqual({ suficiente: false, falto: ['un maestro'] });
    expect(r.usos).toHaveLength(1);
    const args = (c.messages.create as ReturnType<typeof vi.fn>).mock.calls[0][0] as { model: string; max_tokens: number };
    expect(args.model).toBe('claude-sonnet-5'); expect(args.max_tokens).toBe(1000);
  });
});

describe('evaluarPedidos (repreguntas y objetos: solo lo que la persona pide)', () => {
  it('el prompt es corto (sin ficha ni conversación) y pide solo reservado, dejarTema, hoyNo, quiereParar', () => {
    const p = armarPromptPedidos('esto no lo pongas en el libro');
    expect(p.length).toBeLessThan(2500);
    expect(p).toContain('"reservado"'); expect(p).toContain('"quiereParar"'); expect(p).not.toContain('"suficiente"');
  });
  it('usa Haiku, lee los pedidos y nunca devuelve suficiente', async () => {
    const c = cliente('{"reservado": true, "reservadoTramo": "esto no lo pongas", "dejarTema": "la enfermedad"}');
    const r = await evaluarPedidos(c, 'esto no lo pongas en el libro');
    expect(r.pedidos).toEqual({ reservado: true, reservadoTramo: 'esto no lo pongas', dejarTema: 'la enfermedad' });
    const args = (c.messages.create as ReturnType<typeof vi.fn>).mock.calls[0][0] as { model: string };
    expect(args.model).toBe('claude-haiku-4-5');
    expect((await evaluarPedidos(cliente('roto'), 'x')).pedidos).toEqual({});
  });
});

describe('hayCansancio', () => {
  it('dos repreguntas seguidas sin contestar', () => {
    expect(hayCansancio([{ contestada: true }, { contestada: false }, { contestada: false }])).toBe(true);
    expect(hayCansancio([{ contestada: false }])).toBe(false);
  });
});
```

Agregar en `test/control-pregunta.test.ts`, al final:

```ts
describe('controlarLugar con una repregunta (esqueleto v2)', () => {
  it('una repregunta de la infancia que nombra la ciudad de la juventud se rechaza; sin tramo, no controla', () => {
    const p = perfilVacio();
    p.persona.edad = { valor: '27', fuente: 'dicho' };
    p.etapas.push({ edades: '0 a 12', lugar: 'Concordia', conQuien: '', queHacia: '', fuente: 'dicho' }, { edades: '13 a 22', lugar: 'Buenos Aires', conQuien: '', queHacia: '', fuente: 'dicho' });
    const rep = (tramo: 'infancia' | null): Objetivo => ({ tipo: 'repregunta', id: 'x', tramo, pregunta: 'P', falto: ['a'] });
    expect(controlarPregunta('¿Y en Buenos Aires, qué jugabas de chico?', p, rep('infancia')).ok).toBe(false);
    expect(controlarPregunta('¿Y en Buenos Aires, qué jugabas de chico?', p, rep(null)).ok).toBe(true);
  });
});
```

(con `import { perfilVacio } from '../src/ia/perfil.js'` y `import type { Objetivo } from '../src/ia/pregunta-v2.js'` si el archivo no los tiene; `controlarPregunta` ya está importado).

- [ ] **Step 2: Correr y ver que falla**

Run: `cd entrevistador && npx vitest run test/evaluar-v2.test.ts test/control-pregunta.test.ts`
Expected: FAIL.

- [ ] **Step 3: `controlarLugar` para cualquier objetivo con tramo**

En `control-pregunta.ts`, reemplazar las líneas 49 y 53:

```ts
  const tramoObjetivo = objetivo.tipo === 'variable' || objetivo.tipo === 'objeto' ? objetivo.tramo : objetivo.tramo ?? null;
  if (!tramoObjetivo) return { ok: true };
```

y

```ts
  const [desde, hasta] = objetivo.tipo === 'variable' ? [objetivo.desde, objetivo.hasta] : (RANGO_TRAMO[tramoObjetivo] ?? [0, 200]);
```

- [ ] **Step 4: Reescribir `evaluar-v2.ts`**

```ts
import type Anthropic from '@anthropic-ai/sdk';
import type { Perfil } from './perfil.js';
import { encargoDelBiografo } from './encargo-entrevista.js';
import type { Objetivo } from './pregunta-v2.js';
import { MODELO_EVALUACION, MODELO_PEDIDOS } from './modelos-v2.js';

// La evaluación del esqueleto v2 (24/09). Decide si con la respuesta hay con qué escribir la página
// del día y, si no, QUÉ FALTÓ de la fila (sus pormenores): la repregunta la escribe Opus después
// (`escribirPregunta` con un objetivo `repregunta`), junta y en una sola pregunta. Ya no "ahonda en
// el pormenor" (N37). Sonnet: es un juicio con la ficha, no un texto para la persona.
//
// Para las respuestas a repreguntas y a objetos no se evalúa si alcanza (no se vuelve a repreguntar):
// `evaluarPedidos` (Haiku, prompt corto) solo busca reserva, tema a dejar, "hoy no" y "no quiero seguir" (N29).

export type EvaluacionV2 = {
  suficiente: boolean;
  /** Los pormenores de la fila que quedaron afuera, en pocas palabras (hasta 4). */
  falto: string[];
  reservado?: boolean;
  reservadoTramo?: string;
  dejarTema?: string;
  hoyNo?: boolean;
  quiereParar?: boolean;
};
export type Pedidos = Pick<EvaluacionV2, 'reservado' | 'reservadoTramo' | 'dejarTema' | 'hoyNo' | 'quiereParar'>;

const PEDIDOS = `- Si pidió cambiar de tema ("vamos por otro lado", "prefiero no hablar de eso"): "dejarTema" con el
  tema en pocas palabras. Esquivar no es pedir.
- Si dice que HOY no puede ("hoy no", "mañana te contesto", "estoy cansado hoy"): "hoyNo": true.
- Si dice que no quiere seguir con la entrevista ("no quiero seguir", "dejemos esto", "no me
  manden más"): "quiereParar": true. No lo convenzas.
- Si pidió que algo no vaya al libro ("esto no lo pongas", "que quede para mí"): "reservado": true,
  y si es una parte, "reservadoTramo" con ese tramo COPIADO TEXTUAL. Ante la duda, reservá.`;

const objetivoEnLinea = (o: Objetivo): string =>
  o.tipo === 'nucleo' ? `${o.tema}${o.pormenores.length ? `\nPormenores de la fila: ${o.pormenores.join('; ')}.` : ''}`
    : o.tipo === 'variable' ? `Algo que nombró y no contó: ${o.anclas.join('; ')}.`
      : o.tipo === 'objeto' ? 'Un objeto de esa época, con foto.'
        : `Repregunta: ${o.falto.join('; ')}.`;

export const PROMPT_EVALUAR_V2 = (encargo: string, fila: string, pregunta: string, respuesta: string, segundos: number, conversacion: string) => `
${encargo}

LO ÚLTIMO QUE HABLARON (cada respuesta con la pregunta que la originó):
${conversacion || '(es la primera respuesta)'}

EL TEMA DE HOY (lo que el guion quería que saliera):
${fila}

LA PREGUNTA DE HOY:
${pregunta}

LO QUE CONTESTÓ (duró ${segundos} segundos):
${respuesta}

Tu trabajo: decidir si con esta respuesta hay con qué escribir la página de hoy del libro y, si no,
decir QUÉ FALTÓ del tema.

- ALCANZA si hay con qué escribir: dos o tres detalles concretos, con al menos una escena o un
  nombre. El largo no decide: diez segundos pueden valer un capítulo. Si alcanza, no pidas más por
  costumbre, y "falto" queda vacío.
- NO ALCANZA solo si hay poco material (generalidades sin una escena, sin un nombre, sin un hecho),
  o si contó algo fuerte y lo dejó en una frase. Entonces "falto": los pormenores del tema que
  quedaron afuera, tal como están en la fila, hasta 4. Nunca un tema nuevo. Nunca un detalle de un
  detalle: lo que faltó del TEMA, no más precisión sobre lo que ya contó.
- Si dijo "esto ya te lo conté" o parecido: alcanza, "falto" vacío.
- Si se fue a otro tema, está bien: no se lo reencuadra.
${PEDIDOS}

Respondé SOLO con JSON: {"suficiente": true, "falto": []} o {"suficiente": false, "falto": ["..."]},
y sumá "dejarTema", "reservado", "reservadoTramo", "hoyNo" y "quiereParar" cuando corresponda.`;

export function armarPromptEvaluar(
  perfil: Perfil,
  objetivo: Objetivo,
  pregunta: string,
  respuesta: string,
  segundos: number,
  conversacion: { pregunta: string; respuesta: string }[],
  evitar: string[],
): string {
  return PROMPT_EVALUAR_V2(
    encargoDelBiografo(perfil, evitar),
    objetivoEnLinea(objetivo),
    pregunta,
    respuesta,
    segundos,
    conversacion.map((c) => `P: ${c.pregunta}\nR: ${c.respuesta}`).join('\n\n'),
  );
}

const MAX_FALTO = 4;

function leerJson(salida: string): Record<string, unknown> | null {
  try {
    const limpio = salida.trim();
    const c = JSON.parse(limpio.slice(limpio.indexOf('{'), limpio.lastIndexOf('}') + 1));
    return typeof c === 'object' && c !== null ? (c as Record<string, unknown>) : null;
  } catch {
    return null;
  }
}

function leerPedidos(c: Record<string, unknown>): Pedidos {
  const p: Pedidos = {};
  if (c.reservado === true) p.reservado = true;
  if (typeof c.reservadoTramo === 'string' && c.reservadoTramo.trim()) p.reservadoTramo = c.reservadoTramo.trim();
  if (typeof c.dejarTema === 'string' && c.dejarTema.trim()) p.dejarTema = c.dejarTema.trim();
  if (c.hoyNo === true) p.hoyNo = true;
  if (c.quiereParar === true) p.quiereParar = true;
  return p;
}

/** Campo por campo. Si viene roto, alcanza (el día no se corta) y no hay nada que pedir. */
export function parsearEvaluacion(salida: string): EvaluacionV2 {
  const c = leerJson(salida);
  if (!c || typeof c.suficiente !== 'boolean') return { suficiente: true, falto: [] };
  const falto = Array.isArray(c.falto) ? c.falto.filter((x): x is string => typeof x === 'string' && x.trim() !== '').map((x) => x.trim()).slice(0, MAX_FALTO) : [];
  return { suficiente: c.suficiente, falto: c.suficiente ? [] : falto, ...leerPedidos(c) };
}

export const DIAS_SIN_REPREGUNTAR = 3;

/** Cansancio: si las dos últimas repreguntas quedaron sin contestar, no se repregunta por unos días. */
export function hayCansancio(ultimasRepreguntas: { contestada: boolean }[]): boolean {
  const dos = ultimasRepreguntas.slice(-2);
  return dos.length === 2 && dos.every((r) => !r.contestada);
}

/** Una llamada. Sin reintentos: no hay texto para la persona que controlar. */
export async function evaluarV2(
  cliente: Anthropic,
  perfil: Perfil,
  objetivo: Objetivo,
  pregunta: string,
  respuesta: string,
  segundos: number,
  conversacion: { pregunta: string; respuesta: string }[],
  evitar: string[],
): Promise<{ evaluacion: EvaluacionV2; usos: Anthropic.Usage[] }> {
  const r = await cliente.messages.create({ model: MODELO_EVALUACION, max_tokens: 1000, messages: [{ role: 'user', content: armarPromptEvaluar(perfil, objetivo, pregunta, respuesta, segundos, conversacion, evitar) }] });
  const bloque = r.content.find((b) => b.type === 'text');
  return { evaluacion: parsearEvaluacion(bloque && bloque.type === 'text' ? bloque.text : ''), usos: [r.usage] };
}

export const PROMPT_PEDIDOS = (respuesta: string) => `
Sos el biógrafo que entrevista a una persona por WhatsApp para el libro de su vida. Esta es su
respuesta a una repregunta o a un pedido de foto. No tenés que juzgar si alcanza: solo fijate si
PIDE algo.

LO QUE CONTESTÓ:
${respuesta}

${PEDIDOS}

Respondé SOLO con JSON con las claves que correspondan ({} si no pide nada): {"reservado": true,
"reservadoTramo": "...", "dejarTema": "...", "hoyNo": true, "quiereParar": true}.`;

export function armarPromptPedidos(respuesta: string): string {
  return PROMPT_PEDIDOS(respuesta);
}

export async function evaluarPedidos(cliente: Anthropic, respuesta: string): Promise<{ pedidos: Pedidos; usos: Anthropic.Usage[] }> {
  const r = await cliente.messages.create({ model: MODELO_PEDIDOS, max_tokens: 300, messages: [{ role: 'user', content: armarPromptPedidos(respuesta) }] });
  const bloque = r.content.find((b) => b.type === 'text');
  const c = leerJson(bloque && bloque.type === 'text' ? bloque.text : '');
  return { pedidos: c ? leerPedidos(c) : {}, usos: [r.usage] };
}
```

- [ ] **Step 5: Correr y ver que pasa; tipos**

Run: `cd entrevistador && npx vitest run test/evaluar-v2.test.ts test/control-pregunta.test.ts test/pregunta-v2.test.ts`
Expected: PASS. `cerebro.ts` (`reservaDe`) sigue leyendo `reservado`/`reservadoTramo`: `Pedidos` y `EvaluacionV2` tienen los mismos nombres, no cambia.

- [ ] **Step 6: Commit**

```bash
git add entrevistador/src/ia/evaluar-v2.ts entrevistador/src/ia/control-pregunta.ts entrevistador/test/evaluar-v2.test.ts entrevistador/test/control-pregunta.test.ts
git commit -m "esqueleto v2: la evaluación dice qué faltó (Sonnet), los pedidos de repreguntas y objetos van por Haiku, y el control de lugar cubre la repregunta"
```

---

### Task 9: El encargo: la regla 7 pide lo concreto sin forzar escena, y la regla 2 mira los temas hechos

**Files:**
- Modify: `entrevistador/src/ia/encargo-entrevista.ts:83-97` (`encargoDelBiografo`, reglas 2 y 7)
- Test: `entrevistador/test/encargo-entrevista.test.ts` (nuevo; si ya existe un test del encargo con otro nombre, agregar ahí)

**Interfaces:** la firma `encargoDelBiografo(p, evitar)` no cambia; `perfilEnTexto` no cambia (los topes de la Tarea 2 la achican solos).

- [ ] **Step 1: Test**

```ts
import { describe, it, expect } from 'vitest';
import { encargoDelBiografo, perfilEnTexto } from '../src/ia/encargo-entrevista.js';
import { perfilVacio } from '../src/ia/perfil.js';

describe('el encargo (esqueleto v2)', () => {
  it('la regla 7 pide lo concreto pero deja pedir "cómo era" alguien sin escena obligatoria (N42: se supo qué hicieron, no cómo son)', () => {
    const e = encargoDelBiografo(perfilVacio());
    expect(e).toMatch(/7\. Pedí lo concreto/);
    expect(e).toMatch(/cómo ES alguien/);
    expect(e).not.toMatch(/Pedí una escena, no un resumen/);
  });
  it('la regla 2 remite a los temas ya preguntados y a juntar pormenores en una sola pregunta', () => {
    const e = encargoDelBiografo(perfilVacio());
    expect(e).toMatch(/2\. Nunca le pidas lo que ya contó/);
    expect(e).toMatch(/varios pormenores/);
  });
  it('perfilEnTexto muestra noTuvo como "no tuvo" para que el modelo no pregunte por eso', () => {
    const p = perfilVacio(); p.noTuvo = ['hijos'];
    expect(perfilEnTexto(p)).toMatch(/No tuvo: hijos/);
  });
});
```

- [ ] **Step 2: Correr y ver que falla**

Run: `cd entrevistador && npx vitest run test/encargo-entrevista.test.ts`
Expected: FAIL.

- [ ] **Step 3: Implementar**

En `perfilEnTexto`, después de la línea de `NO SABÉS`, agregar:

```ts
    ...(p.noTuvo?.length ? ['', `No tuvo: ${p.noTuvo.join(', ')} (lo dijo: no se pregunta por eso ni se supone).`] : []),
```

En `encargoDelBiografo`, reemplazar la regla 2 y la regla 7:

```
2. Nunca le pidas lo que ya contó: mirá los temas que ya le preguntaste. Si algo que contó sirve
   de puente, usalo en una frase; la pregunta va a lo que todavía no contó. Si el tema trae
   varios pormenores, pedilos juntos en una sola pregunta, no uno por día.
```

```
7. Pedí lo concreto: un día, un lugar, una persona, y en la ciudad que tu ficha tiene para esos
   años, no otra. Si el tema es cómo ES alguien (un padre, un hermano), pedí el carácter con una
   escena de yapa, no la escena en lugar del carácter.
```

- [ ] **Step 4: Correr**

Run: `cd entrevistador && npx vitest run test/encargo-entrevista.test.ts test/pregunta-v2.test.ts test/evaluar-v2.test.ts`
Expected: PASS. Si algún test viejo (`pregunta-v2`, `evaluar-v2`) buscaba el texto viejo de la regla 7, actualizarlo.

- [ ] **Step 5: Commit**

```bash
git add entrevistador/src/ia/encargo-entrevista.ts entrevistador/test/encargo-entrevista.test.ts
git commit -m "esqueleto v2: el encargo pide lo concreto sin forzar escena, junta pormenores y muestra lo que no tuvo"
```

---

### Task 10: `estado-v2.ts`: sin plan, con firma del guion, temas hechos, conversación de 3 y la decisión de repregunta por etapa

**Files:**
- Modify: `entrevistador/src/manual/estado-v2.ts`
- Test: `entrevistador/test/estado-v2.test.ts` (se reescriben los `describe` de `estadoNuevo`, `planSiHaceFalta`, `pendientesParaPerfil`, `yaHechasDe`, `conversacionDe` y `decidirTrasEvaluar`; el resto queda)

**Interfaces:**
- Consumes: `armarSecuencia`, `rearmar`, `aplicarCubiertos`, `type Secuencia` (Tarea 7); `firmaGuion` (Tarea 4); `YaHecha` (Tarea 5); `EvaluacionV2` (Tarea 8).
- Produces:

```ts
export type EstadoV2 = { …igual que hoy…; firmaGuion: string; /* se va bisagrasPlanificadas */ };
export function estadoNuevo(contexto, zonaHoraria, anioActual?): EstadoV2;                 // arma la secuencia desde la ficha
export function rearmarSiHaceFalta(estado: EstadoV2, anioActual?): EstadoV2;                 // reemplaza planSiHaceFalta
export function pendientesParaPerfil(s: Secuencia): TemaPendiente[];                          // filas pendientes (id: tema); las libres no
export function conversacionDe(estado, filas, max = 3);
export function yaHechasDe(estado: EstadoV2): YaHecha[];                                      // id + tema de cada hecha (sin presentación) + las repreguntas como "id-repregunta: (repregunta) texto"
export type Decision = { accion: 'parar' } | { accion: 'hoyNo' } | { accion: 'repreguntar'; falto: string[] } | { accion: 'nada'; motivo; sinRepreguntarHasta?; cansancioDesdeOrden? };
export function decidirTrasEvaluar(ev: EvaluacionV2, c: { esRepregunta; yaHayRepregunta; hoy; orden; cansancio; sinRepreguntarHasta?; repreguntasEnEtapa: number; segundos: number }): Decision;
export function repreguntasEnEtapa(estado: EstadoV2, tramo: Tramo | null): number;          // cuántas repreguntas se mandaron en hechas de ese tramo
```

`variablesAsignadas` y `planSiHaceFalta` se borran (y su import de `replanificar`).

- [ ] **Step 1: Tests (reemplazar los `describe` afectados de `test/estado-v2.test.ts`)**

Cambiar el import: sacar `planSiHaceFalta, variablesAsignadas` y `planificar, TECHO_VARIABLES`; sumar `rearmarSiHaceFalta, repreguntasEnEtapa`. Borrar el helper `vars` y el `describe('planSiHaceFalta…')` entero. Reemplazar el primer `describe('estado-v2 …')` y agregar los nuevos:

```ts
describe('estado-v2 (lo que la puerta manual v2 guarda en contexto)', () => {
  it('nace con el perfil de la ficha y el guion armado; la primera es la presentación', () => {
    const e = estadoNuevo({ anioNacimiento: 1999, trato: 'vos' }, BA, 2026);
    expect(e.perfil.persona.anioNacimiento?.valor).toBe('1999');
    expect(proxima(e.secuencia)?.id).toBe('presentacion');
    expect(e.secuencia.pendientes.some((o) => o.id === 'oficio')).toBe(true);
    expect(e.firmaGuion).toBeTypeOf('string');
    expect(e.gastoUsd).toBe(0);
  });
  it('rearma solo cuando cambia lo que decide el guion (edad, árbol), y respeta lo hecho', () => {
    let e = estadoNuevo({}, BA, 2026);
    e = { ...e, secuencia: avanzar(e.secuencia, proxima(e.secuencia)!, 0) };
    const igual = rearmarSiHaceFalta(e, 2026);
    expect(igual.secuencia).toBe(e.secuencia);
    const conEdad = rearmarSiHaceFalta({ ...e, perfil: aplicarCambios(e.perfil, { persona: { edad: { valor: '70', fuente: 'dicho' } } }) }, 2026);
    expect(conEdad.secuencia).not.toBe(e.secuencia);
    expect(conEdad.secuencia.hechas).toHaveLength(1);
    expect(conEdad.secuencia.pendientes.some((o) => o.id === 'dejar-el-trabajo')).toBe(true);
    expect(conEdad.firmaGuion).not.toBe(e.firmaGuion);
  });
  it('va y vuelve del contexto sin pisar otras claves', () => {
    const e = estadoNuevo({}, 'Europe/Madrid');
    const c = contextoConEstado({ modoRapido: true, evitar: 'x' }, e);
    expect(c.modoRapido).toBe(true);
    expect(c.evitar).toBe('x');
    expect(leerEstado(c, 'Europe/Madrid')?.perfil.castellano).toBe('españa');
    expect(leerEstado({}, 'Europe/Madrid')).toBeNull();
  });
  it('sobrevive a JSON', () => {
    const e = estadoNuevo({ anioNacimiento: 1999 }, BA, 2026);
    const vuelta = leerEstado(JSON.parse(JSON.stringify(contextoConEstado({}, e))), BA)!;
    expect(vuelta.secuencia).toEqual(e.secuencia);
    expect(vuelta.perfil).toEqual(e.perfil);
  });
});

describe('pendientesParaPerfil y yaHechasDe', () => {
  it('los pendientes para la ficha son las filas (id: tema), sin la presentación ni las libres', () => {
    const e = estadoNuevo({ anioNacimiento: 1999 }, BA, 2026);
    const p = pendientesParaPerfil(e.secuencia);
    expect(p.find((x) => x.id === 'la-escuela')?.tema).toMatch(/escuela primaria/i);
    expect(p.some((x) => x.id === 'presentacion')).toBe(false);
    expect(p.some((x) => x.id.startsWith('libre-'))).toBe(false);
  });
  it('yaHechas trae id y tema de cada hecha (no el texto), sin la presentación, y las repreguntas marcadas', () => {
    let e = estadoNuevo({ anioNacimiento: 1999 }, BA, 2026);
    for (let i = 0; i < 3; i++) e = { ...e, secuencia: avanzar(e.secuencia, proxima(e.secuencia)!, i), preguntasEnviadas: { ...e.preguntasEnviadas, [i]: `texto ${i}` } };
    e = { ...e, repreguntasEnviadas: { '1': '¿Y el olor de esa casa?' } };
    const ya = yaHechasDe(e);
    expect(ya.map((y) => y.id)).toEqual(['casa-infancia', 'los-tuyos-hoy', 'casa-infancia-repregunta']);
    expect(ya[0].tema).toMatch(/casa donde pasó su infancia/i);
    expect(ya[2].tema).toContain('¿Y el olor de esa casa?');
    expect(JSON.stringify(ya)).not.toContain('texto 1');
  });
});

describe('conversacionDe: las últimas 3', () => {
  it('por defecto trae 3, por llegada', () => {
    const e = estadoNuevo({}, BA, 2026);
    const filas = Array.from({ length: 5 }, (_, i) => ({ id: String(i), pregunta_orden: i, es_repregunta: false, transcripcion: `r${i}`, texto_directo: null, recibido_at: `2026-09-24T0${i}:00:00Z` }));
    const c = conversacionDe({ ...e, preguntasEnviadas: Object.fromEntries(filas.map((f) => [f.pregunta_orden, `p${f.pregunta_orden}`])) }, filas);
    expect(c.map((x) => x.respuesta)).toEqual(['r2', 'r3', 'r4']);
  });
});

describe('decidirTrasEvaluar (una repregunta por etapa, más una si la respuesta fue corta y saltó pormenores)', () => {
  const base = { esRepregunta: false, yaHayRepregunta: false, hoy: '2026-09-24', orden: 5, cansancio: false, repreguntasEnEtapa: 0, segundos: 90 };
  const noAlcanza = { suficiente: false, falto: ['un maestro', 'cómo le iba'] };
  it('parar manda sobre todo; una respuesta a repregunta u objeto no se repregunta', () => {
    expect(decidirTrasEvaluar({ ...noAlcanza, quiereParar: true }, base)).toEqual({ accion: 'parar' });
    expect(decidirTrasEvaluar(noAlcanza, { ...base, esRepregunta: true }).accion).toBe('nada');
  });
  it('hoy no → hoyNo; alcanza o sin falto → nada', () => {
    expect(decidirTrasEvaluar({ suficiente: true, falto: [], hoyNo: true }, base)).toEqual({ accion: 'hoyNo' });
    expect(decidirTrasEvaluar({ suficiente: true, falto: [] }, base).accion).toBe('nada');
    expect(decidirTrasEvaluar({ suficiente: false, falto: [] }, base).accion).toBe('nada');
  });
  it('primera de la etapa: repregunta con lo que faltó', () => {
    expect(decidirTrasEvaluar(noAlcanza, base)).toEqual({ accion: 'repreguntar', falto: ['un maestro', 'cómo le iba'] });
  });
  it('ya hubo una en la etapa: solo si la respuesta duró menos de 40 s y faltaron dos o más pormenores', () => {
    expect(decidirTrasEvaluar(noAlcanza, { ...base, repreguntasEnEtapa: 1, segundos: 90 }).accion).toBe('nada');
    expect(decidirTrasEvaluar(noAlcanza, { ...base, repreguntasEnEtapa: 1, segundos: 30 }).accion).toBe('repreguntar');
    expect(decidirTrasEvaluar({ suficiente: false, falto: ['uno'] }, { ...base, repreguntasEnEtapa: 1, segundos: 30 }).accion).toBe('nada');
  });
  it('ya hubo repregunta en esta orden, pausa por cansancio o cansancio nuevo: nada (y la pausa se anota)', () => {
    expect(decidirTrasEvaluar(noAlcanza, { ...base, yaHayRepregunta: true }).accion).toBe('nada');
    expect(decidirTrasEvaluar(noAlcanza, { ...base, sinRepreguntarHasta: '2026-09-30' }).accion).toBe('nada');
    const d = decidirTrasEvaluar(noAlcanza, { ...base, cansancio: true });
    expect(d).toMatchObject({ accion: 'nada', sinRepreguntarHasta: '2026-09-27', cansancioDesdeOrden: 5 });
  });
});

describe('repreguntasEnEtapa', () => {
  it('cuenta las repreguntas enviadas en hechas de ese tramo', () => {
    let e = estadoNuevo({ anioNacimiento: 1999 }, BA, 2026);
    let orden = 0;
    while (proxima(e.secuencia) && proxima(e.secuencia)!.id !== 'a-los-quince') e = { ...e, secuencia: avanzar(e.secuencia, proxima(e.secuencia)!, orden++) };
    const deInfancia = e.secuencia.hechas.filter((h) => h.tramo === 'infancia').map((h) => String(h.orden));
    e = { ...e, repreguntasEnviadas: { [deInfancia[0]]: 'r1', [deInfancia[1]]: 'r2' } };
    expect(repreguntasEnEtapa(e, 'infancia')).toBe(2);
    expect(repreguntasEnEtapa(e, 'juventud')).toBe(0);
  });
});
```

(`aplicarCambios` se importa de `'../src/ia/perfil.js'`; `avanzar`, `proxima` ya están.)

- [ ] **Step 2: Correr y ver que falla**

Run: `cd entrevistador && npx vitest run test/estado-v2.test.ts`
Expected: FAIL.

- [ ] **Step 3: Implementar en `estado-v2.ts`**

Imports: reemplazar `import { armarSecuencia, aplicarPerfil, type Secuencia } from '../ia/secuencia.js';` por `import { armarSecuencia, rearmar, type Secuencia } from '../ia/secuencia.js';`; reemplazar `import { replanificar, edadDe, type Variable } from '../ia/plan-preguntas.js';` por `import type { Tramo } from '../ia/plan-preguntas.js';`; reemplazar `import { NUCLEO, type Objetivo } from '../ia/pregunta-v2.js';` por `import type { YaHecha } from '../ia/pregunta-v2.js';`; agregar `import { firmaGuion } from '../ia/guion-v2.js';`.

En `EstadoV2`: borrar `bisagrasPlanificadas` y agregar:

```ts
  /** La firma del guion (edad, árbol, eventos) con la que se armó la secuencia: si la ficha la cambia, se rearma. */
  firmaGuion: string;
```

`estadoNuevo`:

```ts
export function estadoNuevo(contexto: Record<string, any>, zonaHoraria: string, anioActual = new Date().getFullYear()): EstadoV2 {
  const perfil = perfilDesdeFicha(contexto, zonaHoraria);
  return {
    perfil,
    secuencia: armarSecuencia(perfil, anioActual),
    firmaGuion: firmaGuion(perfil, anioActual),
    marcas: {},
    preguntasEnviadas: {},
    repreguntasEnviadas: {},
    gastoUsd: 0,
    procesadas: [],
    bloqueadas: [],
  };
}
```

`leerEstado`: además de `v2.perfil && v2.secuencia`, si el guardado no tiene `firmaGuion` (un estado viejo del piloto), devolverlo igual con `firmaGuion: ''` (así `rearmarSiHaceFalta` rearma la primera vez); y si `secuencia` no tiene `caidas`/`libres`, completar con `[]`/`0`:

```ts
  const estado = { ...estadoNuevo(contexto, zonaHoraria), ...v2 } as EstadoV2;
  estado.secuencia = { caidas: [], libres: 0, ...estado.secuencia };
  return estado;
```

Borrar `variablesAsignadas` y `planSiHaceFalta`; agregar:

```ts
/** Rearma la secuencia cuando la ficha cambió lo que decide el guion (edad, árbol, noTuvo, eventos). */
export function rearmarSiHaceFalta(estado: EstadoV2, anioActual = new Date().getFullYear()): EstadoV2 {
  const firma = firmaGuion(estado.perfil, anioActual);
  if (firma === estado.firmaGuion) return estado;
  return { ...estado, secuencia: rearmar(estado.secuencia, estado.perfil, anioActual), firmaGuion: firma };
}
```

`pendientesParaPerfil`:

```ts
export function pendientesParaPerfil(s: Secuencia): TemaPendiente[] {
  return s.pendientes.flatMap((o): TemaPendiente[] => (o.tipo === 'nucleo' && o.id !== 'presentacion' ? [{ id: o.id, tema: o.tema }] : []));
}
```

`conversacionDe`: cambiar `max = 6` por `max = 3`.

`yaHechasDe`:

```ts
/** Los temas ya preguntados (id y tema, no el texto: el prompt no crece) y las repreguntas mandadas. */
export function yaHechasDe(estado: EstadoV2): YaHecha[] {
  const temas: YaHecha[] = estado.secuencia.hechas
    .filter((h) => h.id !== 'presentacion')
    .map((h) => ({ id: h.id, tema: h.objetivo.tipo === 'nucleo' ? h.objetivo.tema : h.objetivo.tipo === 'variable' ? `Algo que nombró y no contó: ${h.objetivo.anclas.join('; ')}` : h.objetivo.id }));
  const repreguntas: YaHecha[] = Object.entries(estado.repreguntasEnviadas).map(([orden, texto]) => {
    const h = estado.secuencia.hechas.find((x) => String(x.orden) === orden);
    return { id: `${h?.id ?? orden}-repregunta`, tema: `(repregunta) ${texto}` };
  });
  return [...temas, ...repreguntas];
}
```

`Decision` y `decidirTrasEvaluar`:

```ts
export type Decision =
  | { accion: 'parar' }
  | { accion: 'hoyNo' }
  | { accion: 'repreguntar'; falto: string[] }
  | { accion: 'nada'; motivo: string; sinRepreguntarHasta?: string; cansancioDesdeOrden?: number };

/** Una respuesta más corta que esto, que saltó dos o más pormenores, merece la segunda repregunta de la etapa. */
export const SEGUNDOS_RESPUESTA_CORTA = 40;

/**
 * Qué se hace con la evaluación (guion §2, decidido 24/09): parar manda; una respuesta a repregunta u
 * objeto no se repregunta; "hoy no" deja la misma pregunta; si alcanza, nada. Si no alcanza: la
 * primera repregunta de la etapa sale siempre; la segunda solo si la respuesta duró menos de
 * SEGUNDOS_RESPUESTA_CORTA y faltaron dos o más pormenores. Y nunca si ya hubo una en esa orden, hay
 * pausa por cansancio o el cansancio aparece hoy.
 */
export function decidirTrasEvaluar(
  ev: EvaluacionV2,
  c: { esRepregunta: boolean; yaHayRepregunta: boolean; hoy: string; orden: number; cansancio: boolean; sinRepreguntarHasta?: string; repreguntasEnEtapa: number; segundos: number },
): Decision {
  if (ev.quiereParar) return { accion: 'parar' };
  if (c.esRepregunta) return { accion: 'nada', motivo: 'es la respuesta a una repregunta o a un objeto: no se repregunta' };
  if (ev.hoyNo) return { accion: 'hoyNo' };
  if (ev.suficiente || !ev.falto.length) return { accion: 'nada', motivo: 'la respuesta alcanza' };
  if (c.yaHayRepregunta) return { accion: 'nada', motivo: 'ya hubo una repregunta en esta orden' };
  if (c.sinRepreguntarHasta && c.sinRepreguntarHasta > c.hoy) return { accion: 'nada', motivo: `pausa por cansancio hasta el ${c.sinRepreguntarHasta}` };
  if (c.cansancio) {
    return { accion: 'nada', motivo: `cansancio: las dos últimas repreguntas quedaron sin contestar; no se repregunta por ${DIAS_SIN_REPREGUNTAR} días`, sinRepreguntarHasta: sumarDias(c.hoy, DIAS_SIN_REPREGUNTAR), cansancioDesdeOrden: c.orden };
  }
  if (c.repreguntasEnEtapa >= 1 && !(c.segundos < SEGUNDOS_RESPUESTA_CORTA && ev.falto.length >= 2)) {
    return { accion: 'nada', motivo: 'ya hubo una repregunta en esta etapa y la respuesta no fue corta' };
  }
  return { accion: 'repreguntar', falto: ev.falto };
}

/** Cuántas repreguntas se mandaron en preguntas de ese tramo. */
export function repreguntasEnEtapa(estado: EstadoV2, tramo: Tramo | null): number {
  if (!tramo) return 0;
  const ordenes = new Set(estado.secuencia.hechas.filter((h) => h.tramo === tramo).map((h) => String(h.orden)));
  return Object.keys(estado.repreguntasEnviadas).filter((o) => ordenes.has(o)).length;
}
```

Buscar en el archivo cualquier otro uso de `NUCLEO`, `Objetivo`, `Variable`, `edadDe`: `preguntaParaCargar` usa `Objetivo` en su tipo de retorno: cambiar el import a `import type { YaHecha, Objetivo } from '../ia/pregunta-v2.js';`.

- [ ] **Step 4: Correr; tipos**

Run: `cd entrevistador && npx vitest run test/estado-v2.test.ts && npm run tipos`
Expected: PASS en el test; `tipos` puede fallar solo en `scripts/manual-v2.ts` (Tarea 11).

- [ ] **Step 5: Commit**

```bash
git add entrevistador/src/manual/estado-v2.ts entrevistador/test/estado-v2.test.ts
git commit -m "esqueleto v2: el estado sin plan por peso: firma del guion, temas hechos, conversación de 3 y la repregunta por etapa"
```

---

### Task 11: La puerta manual v2 cableada al esqueleto

**Files:**
- Modify: `entrevistador/scripts/manual-v2.ts` (`anotarUsos`, `empezar`, `procesar`, `imprimirCambiosDePerfil`, `siguiente`, `verEstado`)
- Test: `entrevistador/test/manual-v2.test.ts` (el modelo falso y las colas; las expectativas que nombran `repregunta` y la cuenta de preguntas)

**Interfaces:**
- Consumes: `rearmarSiHaceFalta`, `repreguntasEnEtapa`, `yaHechasDe`, `conversacionDe`, `decidirTrasEvaluar` (Tarea 10); `aplicarCubiertos`, `etapaCerrada`, `agregarLibre`, `tramoDe` (Tarea 7); `evaluarV2`, `evaluarPedidos` (Tarea 8); `escribirPregunta` con objetivo `repregunta` (Tarea 5); `modeloDePaso`, `PasoV2` (Tarea 1).
- Produces: los cuatro comandos con la misma interfaz de línea de comandos (`empezar`, `cargar`, `siguiente`, `estado`) y los mismos flags.

- [ ] **Step 1: Actualizar el modelo falso del test**

En `test/manual-v2.test.ts`, dentro de `vi.hoisted`, agregar `const colaPedidos: string[] = [];` junto a las otras colas y devolverla en el `return`. Reemplazar `responder` por:

```ts
  function responder(prompt: string): string {
    if (prompt.includes('LO QUE TE TOCA PREGUNTAR HOY')) {
      if (prompt.includes('Es una repregunta a lo de hoy')) { llamadas.push('repregunta'); return `¿Y de eso que faltó, qué me contás? (${++n})`; }
      llamadas.push('pregunta');
      if (prompt.includes('Es el PRIMER mensaje')) return 'Hola, soy el biógrafo que va a escribir el libro de tu vida. Una pregunta por día, la contestás con un audio cuando puedas. Para empezar: cómo preferís que te hable, cuántos años tenés y cómo te dicen en casa.';
      if (prompt.includes('El mapa de su vida por las casas')) return 'Contame de las casas donde viviste.'; // sin "?": la marca
      if (prompt.includes('Pedile UNA cosa')) return `¿Tenés alguna foto o cosa de esa época para mostrarme? (${++n})`;
      return `¿Qué te acordás de aquellos años, lo número ${++n}?`;
    }
    if (prompt.includes('LO QUE YA SABÉS (tu ficha de trabajo')) { llamadas.push('perfil'); return colaPerfil.shift() ?? '{}'; }
    if (prompt.includes('No tenés que juzgar si alcanza')) { llamadas.push('pedidos'); return colaPedidos.shift() ?? '{}'; }
    if (prompt.includes('LA PREGUNTA DE HOY')) {
      llamadas.push('evaluar');
      if (fallar.evaluar > 0) { fallar.evaluar--; throw new Error('529 overloaded (falso)'); }
      return colaEvaluar.shift() ?? '{"suficiente": true, "falto": []}';
    }
    throw new Error(`prompt que el modelo falso no conoce: ${prompt.slice(0, 80)}`);
  }
```

En el mock de `@anthropic-ai/sdk`, hacer que `create` reciba también `model` y lo anote: `create: async ({ model, messages }: { model: string; messages: { content: string }[] }) => { modelos.push(model); return { … }; }` con `const modelos: string[] = [];` en el hoisted (devuelto en el `return`).

Después, en los tests existentes:
- Donde `colaEvaluar.push('{"suficiente": false, "repregunta": "…"}')`: cambiar por `'{"suficiente": false, "falto": ["el olor", "quién estaba"]}'`; la repregunta que sale al final ahora es la del modelo falso (`¿Y de eso que faltó, qué me contás? (N)`): actualizar las aserciones de texto. En el test `'cargar la casa: evalúa y la repregunta sale entera al final; la respuesta a la repregunta no se repregunta'`, agregar `expect(h.llamadas).toContain('repregunta')` y, para la respuesta a la repregunta, `expect(h.llamadas.at(-1)).toBe('pedidos')` (ya no se evalúa).
- En el test de cansancio (dos repreguntas sin contestar): las dos primeras repreguntas tienen que ser de etapas distintas o la segunda tiene que venir de una respuesta corta; lo más simple es que la transcripción falsa dure 42 s (ya lo hace) y que `colaEvaluar` devuelva `falto` con dos ítems: la segunda repregunta de la misma etapa sale porque 42 < 40 no se cumple… **entonces no sale**. Ajustar el mock de `transcribirYActualizar` para que la duración salga de `h.duracion` (default 42) y poner `h.duracion = 20` en ese test antes de la segunda carga; o cargar las dos respuestas en filas de etapas distintas. Elegir lo primero.
- Donde se cuenta cuántas preguntas tiene la entrevista entera (`'hasta el final…'`): no fijar un número; usar `expect(v2().secuencia.hechas.length - 1).toBeGreaterThanOrEqual(25)` y comprobar que `hechas.at(-1).id === 'cinco-minutos'`, que hubo objetos y que quedó `terminada`.
- El test `'la respuesta a la presentación … con la edad, planifica'`: cambiar la aserción a que después de cargar la edad la `firmaGuion` cambió (`expect(v2().firmaGuion).not.toBe('')`) y que `v2().secuencia.pendientes.some((o) => o.id === 'oficio')` sigue siendo cierto.
- Agregar un test nuevo:

```ts
  it('cada paso anota su modelo: la ficha con Sonnet, la evaluación con Sonnet, la pregunta con Opus, los pedidos con Haiku', async () => {
    const consumo = h.tablas.consumo_ia;
    const de = (paso: string) => consumo.filter((c) => c.paso === paso).map((c) => c.modelo);
    expect(new Set(de('v2-perfil'))).toEqual(new Set(['claude-sonnet-5']));
    expect(new Set(de('v2-evaluar'))).toEqual(new Set(['claude-sonnet-5']));
    expect(new Set(de('v2-pregunta'))).toEqual(new Set(['claude-opus-5']));
    expect(new Set(de('v2-pedidos'))).toEqual(new Set(['claude-haiku-4-5']));
  });
```

(va después del test de la repregunta, cuando ya hubo llamadas de los cuatro tipos.)

- Agregar otro:

```ts
  it('al cerrar una etapa, si la ficha dejó un "[infancia] …" en noSabemos, la próxima es una libre; estado muestra caídas y libres', async () => {
    h.colaPerfil.push('{"agregarNoSabemos": ["[infancia] Qué pasó con los perros"]}');
    // cargar la última pregunta de infancia que esté abierta (la que imprimió el último siguiente)
    await correr('cargar', 'pruebav2', audio('inf.ogg'));
    const s = await correr('siguiente', 'pruebav2');
    if (v2().secuencia.hechas.at(-1).id.startsWith('libre-')) expect(s.texto).toMatch(/pregunta libre/i);
    const e = await correr('estado', 'pruebav2');
    expect(e.texto).toMatch(/Se cayeron|caídas/i);
    expect(e.texto).toMatch(/libres/i);
  });
```

Ubicarlo en el flujo donde la próxima sea la última fila de infancia (`la-escuela`); si el orden del test no lo permite, avanzar con `siguiente`/`cargar` hasta ahí dentro del mismo test.

- [ ] **Step 2: Correr y ver que falla**

Run: `cd entrevistador && npx vitest run test/manual-v2.test.ts`
Expected: FAIL (el script importa `planSiHaceFalta`, que ya no existe).

- [ ] **Step 3: Cablear `manual-v2.ts`**

Imports (reemplazar los de `estado-v2`, `secuencia`, `evaluar-v2`, y sumar `modelos-v2`):

```ts
import {
  estadoNuevo, leerEstado, contextoConEstado, rearmarSiHaceFalta, pendientesParaPerfil, preguntaParaCargar,
  queHaceSiguiente, conversacionDe, yaHechasDe, evitarDe, hoyEn, repreguntasParaCansancio, repreguntasEnEtapa, decidirTrasEvaluar,
  sumarGasto, mensajeHoyNo, cierreQuiereParar, mailQuiereParar, despedidaV2, type EstadoV2, type FilaParaSiguiente,
} from '../src/manual/estado-v2.js';
import { actualizarPerfil } from '../src/ia/perfil.js';
import { proxima, avanzar, aplicarCubiertos, etapaCerrada, agregarLibre, tocaObjeto, registrarObjeto, tramoDe } from '../src/ia/secuencia.js';
import { escribirPregunta, perfilEnTexto, type Objetivo } from '../src/ia/pregunta-v2.js';
import { evaluarV2, evaluarPedidos, hayCansancio, type EvaluacionV2 } from '../src/ia/evaluar-v2.js';
import { modeloDePaso, type PasoV2 } from '../src/ia/modelos-v2.js';
```

`anotarUsos`:

```ts
async function anotarUsos(paso: PasoV2, narradorId: string, usos: Anthropic.Usage[]): Promise<void> {
  const { db, registrarUso, cuentaDeEsteServicio } = await modulos();
  for (const uso of usos) {
    await registrarUso(db, { servicio: 'entrevistador', paso, modelo: modeloDePaso(paso), proveedor: 'anthropic', cuenta: cuentaDeEsteServicio(), narradorId, uso });
  }
}
```

`sumarGasto` en `estado-v2.ts` cobra todo como Opus (`MODELO_V2`): cambiarlo para recibir el modelo: `sumarGasto(estado, usos, segundosTranscriptos = 0, modelo = MODELO_PREGUNTA)` (import `MODELO_PREGUNTA` de `../ia/modelos-v2.js` y borrar `MODELO_V2`), y en el script pasar `modeloDePaso(paso)` en cada `sumarGasto`. Para no sumar mal cuando `usos` mezcla pasos, sumar el gasto **por paso** en el momento de anotarlo: en `anotarUsos` devolver el USD y acumularlo con `sumarGasto(estado, usos, 0, modeloDePaso(paso))` justo ahí. Concretamente, en `procesar` y `siguiente`, reemplazar cada par `usos.push(x); await anotarUsos(paso, id, x)` por `estado = sumarGasto(estado, x, 0, modeloDePaso(paso)); await anotarUsos(paso, n.id, x);` y al final `estado = procesada(sumarGasto(estado, [], segundosTranscriptos))` (solo la transcripción). Borrar el array `usos` acumulador.

`empezar`: reemplazar `let estado = planSiHaceFalta(estadoNuevo(n.contexto ?? {}, n.zona_horaria));` por `let estado = estadoNuevo(n.contexto ?? {}, n.zona_horaria);`.

`procesar`, pasos 1 y 3-5 (reemplazan el código actual desde `// 1. El perfil…` hasta el `switch` inclusive):

```ts
  // 1. La ficha aprende de la respuesta; si cambió lo que decide el guion (edad, árbol), la secuencia se rearma;
  //    lo que la ficha dio por contado se cae.
  const antes = estado.perfil;
  const p = await actualizarPerfil(cliente(), estado.perfil, abierta.texto, respuesta, pendientesParaPerfil(estado.secuencia));
  estado = sumarGasto(estado, [p.usage], 0, modeloDePaso('v2-perfil'));
  await anotarUsos('v2-perfil', n.id, [p.usage]);
  if (!p.ok) linea('⚠ La ficha no se entendió (salida ilegible): queda como estaba.');
  const pendientesAntes = estado.secuencia.pendientes.map((o) => o.id);
  estado = rearmarSiHaceFalta({ ...estado, perfil: p.perfil });
  estado = { ...estado, secuencia: aplicarCubiertos(estado.secuencia, estado.perfil) };
  imprimirCambiosDePerfil(antes, estado, pendientesAntes);
  const procesada = (e: EstadoV2): EstadoV2 => ({ ...e, procesadas: [...new Set([...e.procesadas, respuestaId])] });

  // 2. La presentación solo alimenta la ficha: no se evalúa ni se repregunta.
  if (objetivo.tipo === 'nucleo' && objetivo.id === 'presentacion' && !esRepregunta) {
    estado = procesada(sumarGasto(estado, [], segundosTranscriptos));
    await guardar(n, estado);
    linea(`Gasto acumulado: USD ${estado.gastoUsd.toFixed(3)}`);
    linea(`Ahora: npm run manual-v2 -- siguiente ${s}`);
    return;
  }

  // 3. La evaluación. A una repregunta o a un objeto solo se le miran los pedidos (reserva, dejar,
  //    hoy no, parar): no se vuelve a repreguntar, así que no se paga una evaluación entera (N29).
  const previas = filas.filter((f) => f.id !== respuestaId);
  let e: EvaluacionV2;
  if (esRepregunta || esObjeto) {
    const r = await evaluarPedidos(cliente(), respuesta);
    estado = sumarGasto(estado, r.usos, 0, modeloDePaso('v2-pedidos'));
    await anotarUsos('v2-pedidos', n.id, r.usos);
    e = { suficiente: true, falto: [], ...r.pedidos };
    linea(`Pedidos: ${JSON.stringify(r.pedidos)}`);
  } else {
    const r = await evaluarV2(cliente(), estado.perfil, objetivo, abierta.texto, respuesta, segundos, conversacionDe(estado, previas), evitarDe(n.contexto ?? {}));
    estado = sumarGasto(estado, r.usos, 0, modeloDePaso('v2-evaluar'));
    await anotarUsos('v2-evaluar', n.id, r.usos);
    e = r.evaluacion;
    linea(`Evaluación: ${JSON.stringify(e)}`);
  }

  // 4. Lo que se anota siempre, venga lo que venga después.
  const reserva = mods.reservaDe(e, respuesta);
  if (reserva.reservada) {
    linea(`🔒 Pidió reservar ${reserva.tramo ? `una parte: «${reserva.tramo}»` : 'la respuesta entera'}: no va al libro.`);
    await mods.guardarReserva(respuestaId, reserva);
  }
  let evitarNuevo: string | undefined;
  if (e.dejarTema) {
    const nuevo = mods.sumarTemaEvitado(n.contexto ?? {}, e.dejarTema);
    linea(`🚫 Pidió dejar un tema: «${e.dejarTema}»${nuevo ? ' → queda en contexto.evitar.' : ' (ya estaba anotado o no entra).'}`);
    if (nuevo) evitarNuevo = nuevo.evitar;
  }

  // 5. ¿Repregunta? Una por etapa (más una si la respuesta fue corta y saltó pormenores), cansancio, "hoy no", "no quiero seguir".
  const contestadas = filas.filter((f) => f.es_repregunta).map((f) => f.pregunta_orden).concat(esRepregunta ? [orden] : []);
  const decision = decidirTrasEvaluar(e, {
    esRepregunta: esRepregunta || esObjeto,
    yaHayRepregunta: Boolean(estado.repreguntasEnviadas[String(orden)]),
    hoy: hoyEn(n.zona_horaria),
    orden,
    cansancio: hayCansancio(repreguntasParaCansancio(estado, orden, contestadas)),
    sinRepreguntarHasta: estado.sinRepreguntarHasta,
    repreguntasEnEtapa: repreguntasEnEtapa(estado, tramoDe(objetivo)),
    segundos,
  });
  if (estado.retomar === orden && !esRepregunta && decision.accion !== 'hoyNo') estado = { ...estado, retomar: undefined };

  const nombre = nombreDe(n, estado);
  const mensajes: { titulo: string; texto: string }[] = [];

  switch (decision.accion) {
    case 'parar': { /* igual que hoy */ break; }
    case 'hoyNo': { /* igual que hoy */ break; }
    case 'repreguntar': {
      // La escribe Opus con el encargo: lo que faltó, junto, en una sola pregunta; pasa por los controles.
      const obj: Objetivo = { tipo: 'repregunta', id: `${objetivo.id}-repregunta`, tramo: tramoDe(objetivo), pregunta: abierta.texto, falto: decision.falto };
      const r = await escribirPregunta(cliente(), estado.perfil, obj, conversacionDe(estado, filas), yaHechasDe(estado), evitarDe(n.contexto ?? {}));
      estado = sumarGasto(estado, r.usos, 0, modeloDePaso('v2-repregunta'));
      await anotarUsos('v2-repregunta', n.id, r.usos);
      estado = {
        ...estado,
        repreguntasEnviadas: { ...estado.repreguntasEnviadas, [orden]: r.texto },
        marcas: r.marca ? { ...estado.marcas, [`${orden}-repregunta`]: r.marca } : estado.marcas,
      };
      linea(`Repregunta (faltó: ${decision.falto.join('; ')}): ${r.usos.length} intento${r.usos.length === 1 ? '' : 's'} · ${marcaEnTexto(r.marca)}`);
      linea(`Cuando conteste: npm run manual-v2 -- cargar ${s} <audio.ogg> --repregunta${orden !== estado.secuencia.hechas.at(-1)?.orden ? ` --orden ${orden}` : ''}`);
      mensajes.push({ titulo: `Repregunta de la orden ${orden}`, texto: r.texto });
      break;
    }
    case 'nada': { /* igual que hoy */ break; }
  }

  estado = procesada(sumarGasto(estado, [], segundosTranscriptos));
  await guardar(n, estado, {}, evitarNuevo);
  linea(`Gasto acumulado: USD ${estado.gastoUsd.toFixed(3)}`);
  imprimirParaPegar(mensajes);
```

(`/* igual que hoy */` significa: copiar el cuerpo actual de ese `case` tal cual; el `case 'parar'` y el `case 'hoyNo'` no cambian.)

`imprimirCambiosDePerfil(antes, estado, pendientesAntes: string[])`: reemplazar las líneas de `puertaAbierta` y `variables pendientes` por:

```ts
  if (p.noTuvo.length !== antes.noTuvo.length) cambios.push(`no tuvo: ${p.noTuvo.join(', ')}`);
  const ahora = estado.secuencia.pendientes.map((o) => o.id);
  const entraron = ahora.filter((id) => !pendientesAntes.includes(id));
  const salieron = pendientesAntes.filter((id) => !ahora.includes(id));
  if (entraron.length) cambios.push(`filas que entraron al guion: ${entraron.join(', ')}`);
  if (salieron.length) cambios.push(`filas que salieron del guion: ${salieron.join(', ')}`);
```

`siguiente`: `pedirObjeto` recibe `hechasHasta: YaHecha[]` (import `type YaHecha` de pregunta-v2) y las llamadas pasan `[...yaHechas, { id: sig.id, tema: sig.tipo === 'nucleo' ? sig.tema : sig.id }]`. Después de `avanzar` y antes de `tocaObjeto`/objeto, agregar la libre al cerrar la etapa:

```ts
  const cerrado = etapaCerrada(estado.secuencia, sig);
  if (cerrado) {
    const { secuencia, libre } = agregarLibre(estado.secuencia, estado.perfil, cerrado);
    estado = { ...estado, secuencia };
    linea(libre ? `Se cerró ${cerrado}: la próxima es una pregunta libre (${libre.id}: ${(libre as { anclas: string[] }).anclas[0]}).` : `Se cerró ${cerrado}: sin pregunta libre (nada nombrado sin contar, o ya hay ${MAX_LIBRES}).`);
  }
```

(`MAX_LIBRES` se importa de `../src/ia/guion-v2.js`.) Ojo con el orden: `tramoObjeto` se calcula ANTES de avanzar (como hoy); la libre se agrega DESPUÉS de avanzar. La cuenta `Quedan N pendientes` sigue igual. El objeto se anota con `anotarUsos('v2-objeto', …)` y `sumarGasto(…, modeloDePaso('v2-objeto'))`; la pregunta con `'v2-pregunta'`; la presentación en `empezar` con `'v2-presentacion'`.

`verEstado`: después de `Pendientes`, agregar:

```ts
  titulo(`Se cayeron (${sec.caidas.length})`);
  for (const c of sec.caidas) linea(`  ${c.id} — ${c.motivo}`);
  linea(`  libres agregadas: ${sec.libres} de ${MAX_LIBRES}`);
```

y en `Lo demás` dejar `cubiertos`, `objetos`, `marcas` como están.

- [ ] **Step 4: Correr; tipos; la suite entera**

Run: `cd entrevistador && npx vitest run test/manual-v2.test.ts && npm test`
Expected: PASS y la suite entera verde. Si `manual-v2.test.ts` se cuelga en un `siguiente` porque la próxima es una libre inesperada, es que un `colaPerfil` de un test anterior dejó un `[etapa] …`: limpiar `h.colaPerfil` al empezar cada test que lo use.

- [ ] **Step 5: Commit**

```bash
git add entrevistador/scripts/manual-v2.ts entrevistador/src/manual/estado-v2.ts entrevistador/test/manual-v2.test.ts
git commit -m "esqueleto v2: la puerta manual cableada: ficha → rearmar → cubiertos; pedidos por Haiku; la repregunta con Opus; las libres al cerrar cada etapa"
```

---

### Task 12: El contrato, los modelos en HERMES y los textos renderizados para que Naza los apruebe

**Files:**
- Modify: `supabase/CONTRATO.md` (sección "El biógrafo v2 en `narradores.contexto.v2`", fila `secuencia` y `bisagrasPlanificadas`), `HERMES.md` (línea "Modelos:")
- Create: `entrevistador/scripts/render-textos-v2.ts`, `docs/esqueleto-v2-textos-para-aprobar.md`

**Interfaces:** ninguna nueva; el script importa `armarPromptPregunta`, `armarPromptEvaluar`, `armarPromptPerfil`, `armarPromptPedidos`, `armarGuion`, `objetivoEnTexto`, `perfilEnTexto` y las fichas de prueba.

- [ ] **Step 1: CONTRATO**

En la tabla de claves de `EstadoV2` (`supabase/CONTRATO.md`, ~línea 675-690):
- Fila `secuencia`: reemplazar la descripción por: «La secuencia fija del esqueleto v2: `pendientes` (las filas del guion que faltan, ya instanciadas por persona: `hermano-ariel`, `hijo-marta`, `historia-grande-pandemia`, y las libres `libre-<tramo>-N`), `hechas` (`{id, orden, tramo, objetivo}`, una por pregunta ya mandada; **la fábrica las lee igual que antes**: `objetivo.tipo` `nucleo` con `tramo` y `bloque`, `variable` con `desde/hasta`, `objeto`), `cubiertos` (filas que la ficha dio por contadas), `caidas` (`{id, motivo}`: filas que no aplican a esta persona, con el motivo), `objetos` (como antes), `ultimoTramo`, `libres` (cuántas libres se agregaron, hasta 4). El bloque `futuro` es nuevo: la fábrica lo trata como "sin época" (el modelo lo ubica), igual que `inicio`.»
- Fila `bisagrasPlanificadas`: reemplazar por `firmaGuion` | `string` | «La firma (edad, árbol, eventos) con la que se armó la secuencia; si la ficha la cambia, la secuencia se rearma respetando lo hecho. Un `contexto.v2` guardado sin esta clave (el piloto del 24/09) se rearma la primera vez que se carga.»
- Fila `perfil`: agregar al final «Desde el esqueleto v2 tiene topes (etapas ≤ 300 caracteres por campo, ≤ 12 bisagras, ≤ 30 personas, ≤ 12 `noSabemos` con la etapa entre corchetes) y `noTuvo` (vínculos que dijo no tener). `puertaAbierta` queda siempre `null`.»

- [ ] **Step 2: HERMES**

Reemplazar la línea `- Modelos: la fábrica escribe con \`claude-fable-5\`; el entrevistador con \`claude-opus-5\` y \`claude-haiku-4-5\`; transcripción/TTS con OpenAI. No cambies modelos sin pedido.` por:

```
- Modelos: la fábrica escribe con `claude-fable-5`; el entrevistador v1 con `claude-opus-5` y
  `claude-haiku-4-5`; el esqueleto v2 por paso (`entrevistador/src/ia/modelos-v2.ts`, decidido por
  Naza el 24/09): la pregunta y la repregunta con `claude-opus-5`, la ficha y la evaluación con
  `claude-sonnet-5`, los pedidos de repreguntas y objetos con `claude-haiku-4-5`;
  transcripción/TTS con OpenAI. No cambies modelos sin pedido.
```

- [ ] **Step 3: El script que renderiza los prompts (sin modelo)**

Crear `entrevistador/scripts/render-textos-v2.ts`:

```ts
/**
 * Renderiza los prompts del esqueleto v2 para dos fichas (Naza, 27; Élida, 76) en un doc que Naza
 * aprueba antes del piloto. No llama al modelo ni a la base.
 * Uso: cd entrevistador && npx tsx scripts/render-textos-v2.ts > ../docs/esqueleto-v2-textos-para-aprobar.md
 */
import { armarGuion, GUION } from '../src/ia/guion-v2.js';
import { armarPromptPregunta, objetivoEnTexto, type Objetivo } from '../src/ia/pregunta-v2.js';
import { armarPromptEvaluar, armarPromptPedidos } from '../src/ia/evaluar-v2.js';
import { armarPromptPerfil, perfilVacio, type Perfil } from '../src/ia/perfil.js';
import { perfilEnTexto } from '../src/ia/encargo-entrevista.js';
import { pendientesParaPerfil } from '../src/manual/estado-v2.js';
import { armarSecuencia } from '../src/ia/secuencia.js';

const ANIO = 2026;
const dicho = (valor: string) => ({ valor, fuente: 'dicho' as const });
const persona = (nombre: string, vinculo: string, vive: 'si' | 'no' | 'no se sabe' = 'si') => ({ nombre, vinculo, vive, fuente: 'dicho' as const });
function naza(): Perfil {
  const p = perfilVacio();
  p.persona.edad = dicho('27'); p.persona.genero = dicho('hombre'); p.persona.comoHabla = dicho('vos'); p.persona.comoLeDicen = dicho('Naza'); p.persona.dondeViveHoy = dicho('Berga, Barcelona');
  p.personas.push(persona('Ariel', 'hermano mayor'), persona('Juan Manuel', 'hermano del medio'), persona('Ima', 'pareja actual'), persona('Meri', 'madre'), persona('Juan Domingo', 'padre'));
  p.etapas.push({ edades: '0 a 22', lugar: 'Martínez, provincia de Buenos Aires', conQuien: 'sus padres y sus dos hermanos', queHacia: 'el colegio, los graffitis, la música', fuente: 'dicho' }, { edades: 'desde los 23', lugar: 'Berga, Barcelona, España', conQuien: 'Fran y Ñaco', queHacia: 'música; hoy programa', fuente: 'dicho' });
  p.bisagras.push('A los 8 pasó del Saint John\'s al Fátima', 'A los 22 se fue a vivir a España');
  p.noSabemos.push('[juventud] Cómo se arreglaron con Ciano después del problema por Vicky', '[adulto joven] Qué es la libertad financiera para él');
  return p;
}
function elida(): Perfil {
  const p = perfilVacio();
  p.persona.edad = dicho('76'); p.persona.genero = dicho('mujer'); p.persona.comoHabla = dicho('vos'); p.persona.comoLeDicen = dicho('Élida'); p.persona.dondeViveHoy = dicho('Lanús');
  p.personas.push(persona('Rubén', 'marido', 'no'), persona('Marta', 'hija'), persona('Jorge', 'hijo'), persona('Sofía', 'nieta'), persona('Tomás', 'nieto'), persona('Lucas', 'nieto'), persona('Nélida', 'hermana'), persona('Rosa', 'madre', 'no'), persona('Juan', 'padre', 'no'));
  p.etapas.push({ edades: '0 a 18', lugar: 'Tucumán', conQuien: 'los abuelos', queHacia: 'la escuela y el campo', fuente: 'dicho' }, { edades: 'desde los 19', lugar: 'Lanús, Buenos Aires', conQuien: 'Rubén', queHacia: 'costurera', fuente: 'dicho' });
  p.bisagras.push('A los 19 se vino a Buenos Aires', 'A los 60 murió Rubén');
  p.tono = 'Infancia en el campo, dura pero con los abuelos cerca.';
  return p;
}
const bloque = (t: string) => `\n\`\`\`\n${t.trim()}\n\`\`\`\n`;
const out: string[] = [];
out.push('# Esqueleto v2 — los textos que aprueba Naza (generado con `scripts/render-textos-v2.ts`)\n');
out.push('> Nada de esto se manda solo: son los prompts (lo que lee el modelo). El texto que ve la persona lo escribe el modelo con esto. Lo que cambie acá se cambia en el código con su test.\n');
out.push('## 1. Las filas del guion, como las lee el biógrafo\n');
for (const f of GUION) out.push(`**${f.id}** (${f.etapa})\n> ${f.tema}${f.pormenores.length ? `\n> Pormenores: ${f.pormenores.join('; ')}` : ''}\n`);
for (const [nombre, p] of [['Naza (27)', naza()], ['Élida (76)', elida()]] as const) {
  const { filas, caidas } = armarGuion(p, ANIO);
  out.push(`## El guion de ${nombre}: ${filas.length - 1} preguntas\n`);
  out.push(filas.map((f) => `- ${f.id} (${f.bloque})`).join('\n') + '\n');
  out.push(`Se cayeron: ${caidas.map((c) => `${c.id} (${c.motivo})`).join(', ') || 'ninguna'}\n`);
  out.push(`### La ficha de ${nombre}, en texto (${perfilEnTexto(p).length} caracteres)\n${bloque(perfilEnTexto(p))}`);
  const fila = filas.find((f) => f.id === 'padres-como-eran')!;
  const o: Objetivo = { tipo: 'nucleo', ...fila };
  out.push(`### El prompt de la pregunta (${fila.id}) para ${nombre}\n${bloque(armarPromptPregunta(p, o, [{ pregunta: '¿Qué ves al entrar a esa casa?', respuesta: 'Una casa de tres pisos, mi mamá en la cocina.' }], [{ id: 'casa-infancia', tema: 'La casa de la infancia' }, { id: 'los-tuyos-hoy', tema: 'Quiénes son los suyos hoy' }]))}`);
  out.push(`### El prompt de la evaluación para ${nombre}\n${bloque(armarPromptEvaluar(p, o, '¿Cómo eran tu mamá y tu papá?', 'Mi mamá era brava. Mi papá cocinaba.', 25, [], []))}`);
  const rep: Objetivo = { tipo: 'repregunta', id: 'padres-como-eran-repregunta', tramo: 'infancia', pregunta: '¿Cómo eran tu mamá y tu papá?', falto: ['en qué se parece', 'una escena de cada uno'] };
  out.push(`### El objetivo de la repregunta para ${nombre}\n${bloque(objetivoEnTexto(rep, p))}`);
  out.push(`### El prompt de la ficha para ${nombre}\n${bloque(armarPromptPerfil(p, '¿Cómo eran tu mamá y tu papá?', 'Mi mamá era brava. Mi papá cocinaba.', pendientesParaPerfil(armarSecuencia(p, ANIO))))}`);
}
out.push(`## El prompt de los pedidos (repreguntas y objetos, Haiku)\n${bloque(armarPromptPedidos('De esa época no tengo nada, che.'))}`);
process.stdout.write(out.join('\n'));
```

- [ ] **Step 4: Generar el doc y leerlo con ojos de Naza**

```bash
cd entrevistador && npx tsx scripts/render-textos-v2.ts > ../docs/esqueleto-v2-textos-para-aprobar.md && npm run tipos
```

Expected: el doc existe, con las dos fichas, los cuatro prompts por ficha y el de pedidos. Leerlo entero: si un prompt dice algo que el guion aprobado no dice, es un bug de código, no del doc. Agregar arriba del doc la línea «**Pendiente de aprobación de Naza** (los prompts cambiaron: la Tarea 12 del plan los rinde acá).»

- [ ] **Step 5: Commit**

```bash
git add supabase/CONTRATO.md HERMES.md entrevistador/scripts/render-textos-v2.ts docs/esqueleto-v2-textos-para-aprobar.md
git commit -m "esqueleto v2: el contrato de contexto.v2, los modelos en HERMES y los prompts renderizados para que apruebe Naza"
```

---

### Task 13: La suite entera, la fábrica, el push y el reporte

**Files:** ninguno nuevo. Reporte: `docs/superpowers/plans/2026-09-24-esqueleto-v2-reporte.md`.

- [ ] **Step 1: Todo verde en el entrevistador**

```bash
cd entrevistador && npm test
```

Expected: tipos limpios y la suite entera en verde (incluida `manual-v2.test.ts`). Si queda un test rojo de un módulo v1 (`cerebro`, `personalizar`, `adaptativas`), es porque el esqueleto no debe tocar producción: revisar el diff y sacar el cambio que lo rompió.

- [ ] **Step 2: La fábrica sigue verde sin tocarla**

```bash
cd ../fabrica && npx vitest run && npx tsc --noEmit -p .
```

Expected: verde. La fábrica lee `hechas[].objetivo.{tipo,tramo,bloque}` y `objetos`, que no cambiaron de forma. Si algún test de `contexto-v2` enumera bloques y falla por `futuro`, es de la fábrica: **no se arregla acá**, se anota en el reporte para Joaquín.

- [ ] **Step 3: Medir el tamaño del prompt de la pregunta 40 con la ficha real (sin modelo)**

Escribir en el reporte el resultado de:

```bash
cd entrevistador && npx tsx -e "
import { readFileSync } from 'node:fs';
import { recortarPerfil } from './src/ia/perfil.ts';
import { armarSecuencia } from './src/ia/secuencia.ts';
import { armarPromptPregunta } from './src/ia/pregunta-v2.ts';
const p = recortarPerfil({ noTuvo: [], ...JSON.parse(readFileSync('test/fixtures/perfil-naza-piloto.json', 'utf8')) });
const s = armarSecuencia(p, 2026);
const ya = s.pendientes.slice(0, 40).map((o) => ({ id: o.id, tema: o.tipo === 'nucleo' ? o.tema : o.id }));
const conv = Array.from({ length: 3 }, () => ({ pregunta: 'P '.repeat(25), respuesta: 'R '.repeat(500) }));
const prompt = armarPromptPregunta(p, s.pendientes.at(-1)!, conv, ya);
console.log('caracteres', prompt.length, '~tokens', Math.round(prompt.length / 2.3));
"
```

Expected: ≤ 13.800 caracteres (≈ 6.000 tokens). Si se pasa, el sobrante está en `perfilEnTexto` (bajar `TOPES.etapaCampo`) o en los temas (acortar los más largos del `GUION`, sin cambiarles el sentido).

- [ ] **Step 4: Push y reporte**

```bash
git push -u origin esqueleto-v2
```

Escribir `docs/superpowers/plans/2026-09-24-esqueleto-v2-reporte.md` con: tests antes/después (números reales), el tamaño medido del prompt de la 40, lo que quedó anotado en cada tarea (decisiones, desvíos del guion), lo que NO se hizo, y el comando exacto para el piloto (`cd entrevistador && npm run manual-v2 -- empezar naza-esqueleto --nombre "Naza"`, avisando que cuesta ~USD 4-5 y que Naza lo dispara). Commitear el reporte y pushear.

---

## Qué NO hacer (para quien ejecuta)

- No correr la puerta manual v2 contra el modelo ni armar el libro: todo lo pago lo dispara Naza.
- No tocar `fabrica/`, `web/`, `voz/` ni el flujo v1 del entrevistador (`cerebro.ts`, `personalizar.ts`, `adaptativas.ts`, `resumenes.ts`, `trato.ts`, `flujo/`): el esqueleto vive en la puerta manual v2 hasta que Naza decida conectarlo.
- No cambiar los temas del guion "porque suenan mejor": son los aprobados. Si uno no cabe en el código, se anota.
- No pushear a `main` ni hacer checkout en la carpeta principal.
- No imprimir nada del `.env`.

## Self-review (hecho al escribir el plan)

- **Cobertura del guion aprobado**: filas §3 → Tarea 4; condiciones y puertas → Tarea 4 (`resolver`); expansión por persona hasta 3 → Tarea 4 (`expandir`); techo 40/44 → Tarea 4 (`tope`, `recortarAlTope`); libres desde `noSabemos` con etapa → Tareas 2 (regla 16) y 7 (`agregarLibre`); repregunta "lo que faltó, junto", una por etapa más la de respuesta corta → Tareas 5, 8, 10; no evaluar repreguntas/objetos → Tareas 8 y 11; objetos → Tarea 7 (sin cambio); historia grande por año y país → Tarea 4; ficha con topes ≤ 2.500 tokens → Tareas 2 y 3; temas hechos en vez de textos y conversación de 3 → Tareas 5 y 10; modelos por paso → Tareas 1, 2, 5, 8, 11; presentación con nombre y quien regala, sin barras → Tarea 4 (fila `presentacion`); textos aprobables → Tarea 12.
- **Nombres cruzados**: `FilaObjetivo.fila` (Tarea 4) lo usa `recortarAlTope`; `Objetivo` con `repregunta` (Tarea 5) lo usan `controlarLugar` (Tarea 8), `objetivoEnLinea` (Tarea 8) y `procesar` (Tarea 11); `YaHecha` (Tarea 5) lo produce `yaHechasDe` (Tarea 10) y lo consume `armarPromptPregunta`; `Decision.repreguntar.falto` (Tarea 10) lo consume `procesar` (Tarea 11); `Secuencia.caidas`/`libres` (Tarea 7) los lee `verEstado` (Tarea 11) y el CONTRATO (Tarea 12); `noTuvo` (Tarea 2) lo lee `arbolDe` (Tarea 4) y `perfilEnTexto` (Tarea 9).
- **Sin placeholders**: cada paso con código trae el código; los tests traen aserciones concretas.
