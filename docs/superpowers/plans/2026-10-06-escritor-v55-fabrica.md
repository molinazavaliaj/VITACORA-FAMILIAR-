# Escritor v5.5 en la fábrica — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Que un pedido escriba el libro con el escritor v5.5 aprobado (solo entrevistas V3), de punta a punta por API y sin una sesión de Claude Code, en tres etapas (A registro+plan+dudas, B corrección del registro, C libro) que se pueden cortar y retomar sin repagar.

**Architecture:** Todo vive en `fabrica/src/escritor/`. Los `.mjs` de `fabrica/scripts/escritor-v55/` se portan a TypeScript **letra por letra** sobre una `Carpeta` en memoria (las mismas rutas que la carpeta del v5.5: `entradas/`, `salidas/`, `controles/`, `arreglos/`, `estilo/`, `pendientes/`), así cada control da exactamente lo mismo que el original (tests de equivalencia que corren el `.mjs` sobre el mismo material). Las llamadas al modelo pasan por un `Ejecutor` que memoriza cada respuesta en un `Almacen` (memoria / disco / Supabase Storage): retomar es volver a correr la etapa, y cada llamada ya pagada sale de la memoria. Los prompts no se tocan: se compilan desde los md a un JSON versionado.

**Tech Stack:** TypeScript 5 (ESM, `module: nodenext`), Node 22, vitest 4, `@anthropic-ai/sdk` 0.71.2 (Messages con streaming, Message Batches, prompt caching), `@supabase/supabase-js` (Storage, bucket `audios`).

## Global Constraints

- Rama `escritor-fabrica`, worktree `C:\Users\Naza\Desktop\VITACORA FAMILIAR-escritor-fabrica`. Nunca hacer checkout en la carpeta principal `VITACORA FAMILIAR`.
- Solo V3: el material sale de la entrevista V3 (`aMaterial`). La entrevista vieja no entra.
- Todo lo nuevo en `fabrica/src/escritor/` (archivos chicos, una responsabilidad). `fabrica/src/libro/` no se toca, salvo `plantilla-html.ts` (idioma `lang` y «Les seves frases», Task 23). `fabrica/src/costos.ts` solo suma precios (Task 12). El worker (`fabrica/src/worker.ts`) **no se toca**.
- Los prompts **no se reescriben**: se compilan desde `docs/v5/escritor-v55/receta.md` y `docs/v5/escritor/guia.md` (y los nuevos de `docs/v5/escritor-v55/fabrica.md`) a `fabrica/src/escritor/prompts/prompts-v55.json`; un test falla si el JSON no está al día.
- **Portar = copiar.** El cuerpo de cada función portada se copia letra por letra del `.mjs` (líneas indicadas en cada task); solo se agregan tipos y se aplica esta tabla de reemplazos. Nunca reescribir de memoria, nunca "mejorar" una regex, un tope o un orden:

  | En el `.mjs` | En el `.ts` |
  |---|---|
  | `dir` (carpeta en disco) | `c: Carpeta` |
  | `leer(p)` / `existe(p)` / `escribir(p, s)` / `leerJSON(p)` | `c.leer(ruta)` / `c.existe(ruta)` (si es una carpeta: `c.existeCarpeta(ruta)`) / `c.escribir(ruta, s)` / `leerJSON(c, ruta)` |
  | `path.join(dir, 'a', 'b')` | `'a/b'` (rutas con `/`) |
  | `salida(dir, f)` | `salida(f)` (= `` `salidas/${f}` ``) |
  | `readdirSync(d)` / `fsList(d)` | `c.listar(ruta)` |
  | `console.log(x)` | `lineas.push(x)` (y se devuelve `resumen: lineas.join('\n')`) |
  | `process.exit(n)` | `return { codigo: n, … }` |
  | `process.env.ERROR` (ruta de un archivo) | `env.error` (el texto de ese archivo) |
  | `process.env.PURO` / `RONDA` / `ARMADOR` / `SOLO_HECHOS` | siempre puro / `ronda` / `env.armador` / `soloHechos` |

  Si `tsc` se queja de un tipo, se agrega la anotación mínima (`as Record<string, number>`, `: string[]`, `as Json`), nunca se cambia la expresión.
- Modo del v5.5 aprobado: `puro: true, soloHechos: true` (así corrió el libro de Joaquín, `docs/v5/escritor-v54/handoff-2026-10-05.md`). Lo que solo usaba el modo no-puro (pasos 3a/3b/3c/3d/6 no-puro, 5 lectura, 5b cotejo) no se porta como llamada. Sin lectura final (decisión 5 del spec).
- Modelo: `claude-opus-5-5` en todo lo que escribe; el barato (`claude-sonnet-5-5`) solo en la corrección del registro (Etapa B). Esfuerzo por defecto `xhigh` en Opus (lo que usaban los agentes de la sesión) y `low` en el barato; queda en `ROLES` para ajustarlo después de la prueba paga.
- Precios (USD por millón, de la skill claude-api, 25/09): `claude-opus-5-5` 4 in / 20 out / 0,20 lectura de caché; `claude-sonnet-5-5` 2 / 10 / 0,20. Escritura de caché 1,25× la entrada (5 min) o 2× (1 h). Batch: mitad de todo.
- Tope de gasto por libro: **USD 15** por defecto; si se pasa, corta con `TopeDeGasto`.
- Registro y plan sin pasar sus controles después de **2 reintentos** → la etapa corta y avisa. Capítulo con más de un tercio afuera (C30) → **1** reescritura. Primera página que repite (C7) → **1** reescritura. Arreglo: **1** ronda. JSON que no parsea: **1** reintento.
- Tests sin modelo y sin red. Ningún paso de este plan llama a la API, salvo la Task 24, que **requiere el OK de Naza antes de correr**.
- Comandos: `cd fabrica && npx vitest run test/escritor/<archivo>.test.ts` y `cd fabrica && npx tsc --noEmit -p .`.
- Commits en castellano rioplatense, `git add` por nombre (nunca `-A`), y al final de cada mensaje la línea `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`.
- Datos de prueba inventados (Nélida, la mercera de la guía). La entrevista de Joaquín no está en el repo (`fabrica/.gitignore`: `prueba-v3-*/`) y **no se sube**: el test contra su corrida se salta si no está la variable `ESCRITOR_V55_CORRIDA`.
- No imprimir secretos (`ANTHROPIC_API_KEY`, claves de Supabase) en logs ni en tests.

---

## File Structure

```
fabrica/src/escritor/
  tipos.ts                  Json, Respuesta, PiezaTexto, PiezaEscrita, Problema, IdiomaLibro
  carpeta.ts                Carpeta en memoria (rutas del v5.5), parseJSONTolerante, leerJSON
  texto.ts                  funciones puras de lib.mjs (norm, marcas, planConR, piezaDeR, armarCambios…)
  prompts/compilar.ts       lee receta/guía/fabrica.md y arma PromptsCompilados (sin disco)
  prompts/prompts-v55.json  generado por scripts/escritor-prompts-json.ts
  prompts/index.ts          promptsDe, esquemaDe, guia, guiaDe, promptFabrica
  lectura.ts                lo que lib.mjs leía de la carpeta (respuestas, ficha, piezas…)
  controles/texto.ts        C1–C8, C10, C15, C17, C28, C29, C31, C32, repite, presentes, pasados, referencias
  controles/estructura.ts   C9, C12–C14, C18–C24, C26, C33, cotejoValido, decisionesAnteriores
  controles/correr.ts       el main de controles.mjs: controlar(c, que, arg)
  controles/afuera.ts       afuera.mjs (C30)
  controles/arreglos.ts     arreglos.mjs: juntar, armar, aplicar
  controles/estilo.ts       estilo.mjs: baranda y aplicar
  controles/estado.ts       estado.mjs
  controles/informe.ts      informe.mjs
  llamadas/armar.ts         llamada.mjs (pasos con modelo, modo puro)
  llamadas/codigo.ts        llamada.mjs (sus_frases y libro: los pasos de código)
  llamadas/fabrica.ts       disputa, dudas para la familia, corrección del registro
  costos.ts                 usdDeLlamada (caché, TTL, Batch)
  almacen/tipos.ts | memoria.ts | disco.ts | supabase.ts
  modelo/tipos.ts           Modelo, Lote, PedidoModelo, RespuestaModelo, ErrorDelModelo
  modelo/pedido.ts          armarParams, puntosDeCache, bloquesDeLlamada
  modelo/anthropic.ts       ModeloAnthropic (streaming)
  modelo/lote-anthropic.ts  LoteAnthropic (Message Batches, con checkpoint del id)
  modelo/falso.ts           ModeloFalso, LoteFalso, claveBase (para tests y la corrida guardada)
  ejecutor.ts               memoria por paso, reintentos, JSON, tope, uso por llamada, paralelo, Batch
  material/de-entrevista.ts aMaterial (movido desde scripts/v3-entrevista-a-material.ts)
  material/ficha-xml.ts     FichaEntrevista → ficha.xml
  material/a-carpeta.ts     materialACarpeta, agregarConfirmados
  dudas.ts                  dudas de datos del registro → estructura
  correccion.ts             aplicarCorreccion (Etapa B)
  orquestador/contexto.ts   Contexto, conReintentos, snapshots
  orquestador/etapa-a.ts | etapa-b.ts | etapa-c.ts
  salida/plantilla.ts       libro.md → construirHtmlLibro; sus_frases.json → FrasesJson («Su voz»)
  estimar.ts                costo estimado antes de correr
  cli.ts                    argumentos y carga/guardado de carpeta para el script
fabrica/scripts/escritor-prompts-json.ts   genera prompts-v55.json
fabrica/scripts/escritor-correr.ts         CLI local (la prueba paga)
docs/v5/escritor-v55/fabrica.md            prompts nuevos (disputa adaptada, dudas, corrección) — borrador para Naza
fabrica/test/escritor/*.test.ts, fabrica/test/escritor/ayuda.ts
fabrica/test/fijos/escritor-v55/nelida/ (material) y nelida-modelo/ (respuestas del modelo falso)
Modifica: fabrica/src/costos.ts, fabrica/src/libro/plantilla-html.ts, fabrica/scripts/v3-entrevista-a-material.ts (re-exporta)
```

---

### Task 1: Carpeta en memoria y funciones puras de texto

**Files:**
- Create: `fabrica/src/escritor/tipos.ts`
- Create: `fabrica/src/escritor/carpeta.ts`
- Create: `fabrica/src/escritor/texto.ts`
- Test: `fabrica/test/escritor/texto.test.ts`

**Interfaces:**
- Consumes: nada (primera task). Lee como referencia `fabrica/scripts/escritor-v55/lib.mjs`.
- Produces:
  - `type Json = any`; `type Respuesta = { id: string; pregunta: string; texto: string }`; `type PiezaTexto = { pieza: string; texto: string }`; `type PiezaEscrita = PiezaTexto & { archivo: string }`; `type Problema = { pieza?: string; control: string; tipo: string; frase: string; que: string; [extra: string]: unknown }`; `type IdiomaLibro = 'es' | 'ca'`.
  - `class Carpeta { constructor(inicial?: Record<string,string>); existe(ruta): boolean; existeCarpeta(ruta): boolean; leer(ruta): string; escribir(ruta, texto): void; borrar(ruta): void; copiar(de, a): void; listar(dir): string[]; aObjeto(): Record<string,string>; clonar(): Carpeta }`
  - `parseJSONTolerante(s: string): Json`, `leerJSON(c: Carpeta, ruta: string): Json`
  - de `texto.ts`: `norm(s: string): string`, `palabras(s: string): string[]`, `idiomaDeFicha(t: string): IdiomaLibro`, `titulosFijos(id: IdiomaLibro): { antes: string; frases: string; carta: string }`, `tituloValido(titulo: string, texto: string): boolean`, `tituloImpreso(cap: Json): string`, `respuestasXML(rs: Respuesta[]): string`, `sinMarcas(t: string): string`, `marcas(t: string): string[]`, `planConR(plan: Json, reg: Json): Json`, `archivoDe(p: string): string`, `piezaDeR(plan: Json, reg: Json, rid: string, ps?: PiezaTexto[]): string`, `armarCambios(texto: string, cambios: Json[]): { texto: string; cambios: Json[] }`, `separarAfuera(t: string): { texto: string; afuera: Json[] }`, `destinosAfuera(afuera: Json[], n: number): { pendientes: Record<string, string[]>; alArreglo: string[]; noEntra: string[] }`

- [ ] **Step 1: Instalar dependencias del worktree y comprobar la base**

El worktree no tiene `node_modules`.

Run: `cd fabrica && npm ci && npx vitest run test/costos.test.ts`
Expected: PASS (la base anda).

- [ ] **Step 2: Escribir el test que falla**

```ts
// fabrica/test/escritor/texto.test.ts
// La Carpeta en memoria y las funciones puras de lib.mjs, portadas: dan lo mismo que el original.
import { describe, expect, it } from 'vitest';
import { Carpeta, leerJSON } from '../../src/escritor/carpeta.js';
import * as T from '../../src/escritor/texto.js';
import * as L from '../../scripts/escritor-v55/lib.mjs';

describe('Carpeta', () => {
  it('lee, escribe, lista solo lo directo y ordenado, y normaliza \\r\\n al leer', () => {
    const c = new Carpeta({ 'salidas/b.md': 'b\r\nx', 'salidas/a.md': 'a', 'salidas/sub/c.md': 'c' });
    expect(c.leer('salidas/b.md')).toBe('b\nx');
    expect(c.listar('salidas')).toEqual(['a.md', 'b.md']);
    expect(c.existe('salidas/sub/c.md')).toBe(true);
    expect(c.existeCarpeta('salidas/sub')).toBe(true);
    expect(c.existeCarpeta('arreglos')).toBe(false);
    expect(() => c.leer('nada.md')).toThrow(/no existe nada.md/);
    c.copiar('salidas/a.md', 'sin-revision/a.md');
    expect(c.clonar().aObjeto()['sin-revision/a.md']).toBe('a');
    c.borrar('salidas/a.md');
    expect(c.existe('salidas/a.md')).toBe(false);
  });

  it('leerJSON tolera BOM y ```json, como lib.mjs', () => {
    const c = new Carpeta({ 'x.json': '\uFEFF```json\n{"a": 1}\n```' });
    expect(leerJSON(c, 'x.json')).toEqual({ a: 1 });
  });
});

describe('texto.ts da lo mismo que lib.mjs', () => {
  const frases = ['Col·legi de l’Avià', 'Sumá VOS… ¡ya!', 'Nélida, la mercera [[R01, R02]]', 'Texto [[FICHA]] y [[R7]] fin'];
  it('norm, palabras, sinMarcas, marcas', () => {
    for (const s of frases) {
      expect(T.norm(s)).toBe(L.norm(s));
      expect(T.palabras(s)).toEqual(L.palabras(s));
      expect(T.sinMarcas(s)).toBe(L.sinMarcas(s));
      expect(T.marcas(s)).toEqual(L.marcas(s));
    }
  });

  it('idioma, títulos fijos y título del Paso 3t', () => {
    for (const f of ['Idioma del libro: catalán', 'Idioma: ca', 'Nombre: Nélida']) expect(T.idiomaDeFicha(f)).toBe(L.idiomaDeFicha(f));
    expect(T.titulosFijos('ca')).toEqual(L.titulosFijos('ca'));
    expect(T.titulosFijos('es')).toEqual(L.titulosFijos('es'));
    const cap = 'En el 78 abrimos la mercería en la calle Mendoza, y su persiana de madera se trababa.';
    for (const t of ['La persiana de madera', 'Años de lucha', '', 'La mercería de la calle Mendoza']) expect(T.tituloValido(t, cap)).toBe(L.tituloValido(t, cap));
    const capPlan = { n: 2, etapa: 'Sola', anios: { desde: '2014', hasta: '', seguros: true } };
    expect(T.tituloImpreso(capPlan)).toBe(L.tituloImpreso(capPlan));
    expect(T.archivoDe('cap_3')).toBe(L.archivoDe('cap_3'));
    expect(T.archivoDe('carta')).toBe(L.archivoDe('carta'));
  });

  it('armarCambios, separarAfuera y destinosAfuera', () => {
    const texto = 'Raúl tenía la mercería. [[R02]]\n\nLa Negra venía a la tarde. [[R10]]';
    const cambios = [
      { problema: 1, resultado: 'cambiado', antes: 'Raúl tenía la mercería.', despues: 'Raúl y yo teníamos la mercería.' },
      { problema: [2, 3], resultado: 'cambiado', antes: 'no está', despues: 'x' },
      { problema: 4, resultado: 'disputa', antes: '', despues: '' },
    ];
    expect(T.armarCambios(texto, cambios)).toEqual(L.armarCambios(texto, cambios));
    const crudo = 'Capítulo. [[R01]]\n---\n{"afuera": [{"id": "R03", "a_donde": "cap_2"}, {"id": "R04", "a_donde": "no_entra"}, {"id": "R05", "a_donde": "linea"}]}';
    expect(T.separarAfuera(crudo)).toEqual(L.separarAfuera(crudo));
    const af = T.separarAfuera(crudo).afuera;
    expect(T.destinosAfuera(af, 1)).toEqual(L.destinosAfuera(af, 1));
  });

  it('planConR y piezaDeR', () => {
    const reg = { episodios: [{ id: 'E01', ids: ['R01'] }, { id: 'E02', ids: ['R02', 'R03'] }, { id: 'E09', ids: ['R09'] }] };
    const plan = { capitulos: [{ n: 1, piezas: [{ episodio: 'E01' }] }, { n: 2, piezas: [{ episodio: 'E02' }] }], carta: { ids: ['E09'] }, antes_de_cerrar: { ids: [] }, sus_frases: [{ id: 'E02', texto: 'x' }], primera_pagina: { que_dice_de_si_ids: ['R01'] } };
    expect(T.planConR(plan, reg)).toEqual(L.planConR(plan, reg));
    const ps = [{ pieza: 'cap_2', texto: 'algo [[R01]]' }];
    for (const r of ['R01', 'R02', 'R09', 'R77']) {
      expect(T.piezaDeR(T.planConR(plan, reg), reg, r)).toBe(L.piezaDeR(L.planConR(plan, reg), reg, r));
      expect(T.piezaDeR(T.planConR(plan, reg), reg, r, ps)).toBe(L.piezaDeR(L.planConR(plan, reg), reg, r, ps));
    }
  });
});
```

Al final del archivo se pegan, copiados sin cambiar datos ni aserciones, los bloques `test(...)` de `scripts/escritor-v55/v54.test.mjs` que usan `idiomaDeFicha`, `titulosFijos` y `palabras`, y el de `v55.test.mjs` que usa `tituloValido` (con `import { test } from 'vitest'`, `import assert from 'node:assert/strict'` y cada función como `T.…`).

- [ ] **Step 3: Correr el test y ver que falla**

Run: `cd fabrica && npx vitest run test/escritor/texto.test.ts`
Expected: FAIL con "Failed to load url ../../src/escritor/carpeta.js".

- [ ] **Step 4: Escribir `tipos.ts` y `carpeta.ts`**

```ts
// fabrica/src/escritor/tipos.ts
// Tipos del escritor v5.5 en la fábrica. El registro y el plan son el JSON que devuelve el
// modelo (esquemas en docs/v5/escritor-v55/receta.md): se tipan como Json porque el código
// portado de los .mjs los lee campo por campo, con `|| []`, igual que el original.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type Json = any;
export type Respuesta = { id: string; pregunta: string; texto: string };
export type PiezaTexto = { pieza: string; texto: string };
export type PiezaEscrita = PiezaTexto & { archivo: string };
export type Problema = { pieza?: string; control: string; tipo: string; frase: string; que: string; [extra: string]: unknown };
export type IdiomaLibro = 'es' | 'ca';
```

```ts
// fabrica/src/escritor/carpeta.ts
// La carpeta del escritor v5.5 (entradas/, salidas/, controles/, arreglos/, estilo/, pendientes/),
// en memoria. Los .mjs leían y escribían archivos; acá lo mismo, sin disco, con las mismas rutas,
// para que el código portado sea el original letra por letra.
import type { Json } from './tipos.js';

const normal = (r: string): string => r.replace(/\\/g, '/').replace(/^\.\//, '').replace(/\/$/, '');

export class Carpeta {
  private readonly archivos = new Map<string, string>();

  constructor(inicial: Record<string, string> = {}) {
    for (const [ruta, texto] of Object.entries(inicial)) this.escribir(ruta, texto);
  }

  existe(ruta: string): boolean {
    return this.archivos.has(normal(ruta));
  }

  /** ¿Hay algún archivo adentro de esta carpeta? (fs.existsSync de un directorio). */
  existeCarpeta(ruta: string): boolean {
    const pre = `${normal(ruta)}/`;
    return [...this.archivos.keys()].some((k) => k.startsWith(pre));
  }

  /** Como lib.mjs `leer`: el texto con \r\n pasado a \n. */
  leer(ruta: string): string {
    const t = this.archivos.get(normal(ruta));
    if (t === undefined) throw new Error(`no existe ${ruta}`);
    return t.replace(/\r\n/g, '\n');
  }

  escribir(ruta: string, texto: string): void {
    this.archivos.set(normal(ruta), texto);
  }

  borrar(ruta: string): void {
    this.archivos.delete(normal(ruta));
  }

  copiar(de: string, a: string): void {
    this.escribir(a, this.leer(de));
  }

  /** Los nombres de los archivos que están directo en `dir` (no en subcarpetas), ordenados con sort(). */
  listar(dir: string): string[] {
    const pre = `${normal(dir)}/`;
    return [...this.archivos.keys()]
      .filter((k) => k.startsWith(pre) && !k.slice(pre.length).includes('/'))
      .map((k) => k.slice(pre.length))
      .sort();
  }

  aObjeto(): Record<string, string> {
    return Object.fromEntries([...this.archivos.entries()].sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0)));
  }

  clonar(): Carpeta {
    return new Carpeta(this.aObjeto());
  }
}

/** lib.mjs `leerJSON`: sin BOM y sin ```json alrededor. */
export function parseJSONTolerante(s: string): Json {
  return JSON.parse(s.replace(/\r\n/g, '\n').replace(/^\uFEFF/, '').replace(/^```(json)?\s*/, '').replace(/```\s*$/, ''));
}

export const leerJSON = (c: Carpeta, ruta: string): Json => parseJSONTolerante(c.leer(ruta));
```

- [ ] **Step 5: Escribir `texto.ts` copiando lib.mjs**

Cabecera del archivo y firmas (los cuerpos se copian letra por letra de `fabrica/scripts/escritor-v55/lib.mjs`, con la tabla de reemplazos de Global Constraints; ninguna de estas funciones toca disco):

```ts
// fabrica/src/escritor/texto.ts
// Funciones puras de fabrica/scripts/escritor-v55/lib.mjs, portadas letra por letra.
// Si cambia el .mjs, cambia esto: test/escritor/texto.test.ts compara las dos.
import type { IdiomaLibro, Json, PiezaTexto, Respuesta } from './tipos.js';

export function norm(s: string): string { /* lib.mjs:37-40 */ }
export const palabras = (s: string): string[] => norm(s).split(' ').filter(Boolean); // lib.mjs:41
export const idiomaDeFicha = (t: string): IdiomaLibro => /* lib.mjs:57 */;
export const titulosFijos = (id: IdiomaLibro): { antes: string; frases: string; carta: string } => /* lib.mjs:59-61 */;
const VACIAS_T = /* lib.mjs:64 */;
export function tituloValido(titulo: string, texto: string): boolean { /* lib.mjs:65-70 */ }
export function tituloImpreso(cap: Json): string { /* lib.mjs:100-104 */ }
export function respuestasXML(rs: Respuesta[]): string { /* lib.mjs:106-108 */ }
export const sinMarcas = (t: string): string => /* lib.mjs:124 */;
export const marcas = (t: string): string[] => /* lib.mjs:125 */;
export function planConR(plan: Json, reg: Json): Json { /* lib.mjs:128-136 */ }
export const archivoDe = (p: string): string => /* lib.mjs:167 */;
export function piezaDeR(plan: Json, reg: Json, rid: string, ps: PiezaTexto[] = []): string { /* lib.mjs:173-182 */ }
export function armarCambios(texto: string, cambios: Json[]): { texto: string; cambios: Json[] } { /* lib.mjs:189-204 */ }
export function separarAfuera(t: string): { texto: string; afuera: Json[] } { /* lib.mjs:221-228 */ }
export function destinosAfuera(afuera: Json[], n: number): { pendientes: Record<string, string[]>; alArreglo: string[]; noEntra: string[] } { /* lib.mjs:231-241 */ }
```

Los comentarios `/* lib.mjs:a-b */` se reemplazan por el cuerpo de esas líneas, copiado. Los comentarios del original (`// v5.4: …`) se copian también: son la historia de cada regla.

- [ ] **Step 6: Correr el test y el tipado**

Run: `cd fabrica && npx vitest run test/escritor/texto.test.ts && npx tsc --noEmit -p .`
Expected: PASS y tsc sin errores.

- [ ] **Step 7: Commit**

```bash
git add fabrica/package-lock.json fabrica/src/escritor/tipos.ts fabrica/src/escritor/carpeta.ts fabrica/src/escritor/texto.ts fabrica/test/escritor/texto.test.ts
git commit -m "escritor: carpeta en memoria y funciones de texto de lib.mjs, portadas" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

(Si `npm ci` no cambió `package-lock.json`, sacarlo del `git add`.)

---

### Task 2: Prompts compilados desde los md (y los tres prompts nuevos de la fábrica)

**Files:**
- Create: `docs/v5/escritor-v55/fabrica.md`
- Create: `fabrica/src/escritor/prompts/compilar.ts`
- Create: `fabrica/src/escritor/prompts/index.ts`
- Create: `fabrica/scripts/escritor-prompts-json.ts`
- Create (generado): `fabrica/src/escritor/prompts/prompts-v55.json`
- Test: `fabrica/test/escritor/prompts.test.ts`

**Interfaces:**
- Consumes: nada de tasks anteriores.
- Produces:
  - `CLAVES_RECETA: readonly string[]`, `CLAVES_FABRICA: readonly string[]`
  - `type PromptsCompilados = { version: 'v5.5'; prompts: Record<string, string[]>; esquemas: Record<string, string>; guia: string }`
  - `bloquesDe(md: string, encabezado: string): string[]`, `esquemaDeMd(md: string, encabezado: string): string`, `compilarPrompts(md: { receta: string; guia: string; fabrica: string }): PromptsCompilados`
  - de `prompts/index.ts`: `promptsDe(encabezado: string): string[]`, `esquemaDe(encabezado: string): string`, `guia(): string`, `SECCIONES: Record<string, string[] | null>`, `guiaDe(paso: string): string`, `promptFabrica(encabezado: string, huecos?: Record<string, string>): string`

- [ ] **Step 1: Escribir `docs/v5/escritor-v55/fabrica.md`**

````markdown
# Escritor v5.5 en la fábrica: los prompts que la receta no tiene (06/10/2026)

La receta v5.5 ([`receta.md`](receta.md)) y la guía no cambian. Estos tres prompts existen porque en la sesión los hacía otra cosa (el workflow) o porque son pasos nuevos del diseño del 06/10 ([spec](../../superpowers/specs/2026-10-06-escritor-v55-fabrica-design.md)). Los compila `fabrica/scripts/escritor-prompts-json.ts` junto con la receta.

- **Disputa**: el texto que `fabrica/scripts/escritor-v55/workflow-libro.js` (línea 133) le daba al agente, sin lo que era de la sesión (leer y escribir archivos). Recibe los mismos documentos que la llamada `4-hechos`.
- **Dudas para la familia** y **Corrección del registro**: nuevos. **Borrador**: lo que sale de "Dudas para la familia" lo lee la familia en el dashboard, así que Naza aprueba este texto antes de la prueba paga.

Huecos que llena el código: `{{FRASE}}`, `{{ID}}`, `{{CITA}}` (disputa), `{{NOMBRE}}` y `{{IDIOMA}}` (dudas).

### Disputa

```
Sos el verificador de hechos de una biografía. Usá solo los documentos de arriba (guía, ficha, respuestas, registro); IGNORÁ el libro y las listas que vienen después de él.
Tu única tarea:
El escritor dice que esta frase del libro está respaldada por una respuesta. Frase del libro: "{{FRASE}}". Respuesta {{ID}}, frase que cita: "{{CITA}}". ¿La respuesta respalda la frase tal como está en el libro, incluido el tiempo verbal? Contestá solo {"respalda": true} o {"respalda": false, "por_que": ""}.
```

### Dudas para la familia

```
Preparás las preguntas que la familia de {{NOMBRE}} contesta antes de que se escriba su libro. Te paso la ficha y unas dudas de datos que encontró quien leyó la entrevista: nombres que pueden estar mal escritos, fechas que no cierran, dos personas que pueden ser la misma, respuestas que se contradicen. Cada duda trae lo que dijo {{NOMBRE}}, textual.

Para cada duda escribí una pregunta para la familia, en {{IDIOMA}}, que se pueda contestar sin haber escuchado la entrevista.
1. Una sola cosa por pregunta. Contá de qué se habla con lo que dijo, entre comillas, y preguntá el dato.
2. Frases simples y cortas. Nada de palabras de oficio (registro, transcripción, episodio, id, respuesta R..).
3. Si se contesta eligiendo, dos o tres opciones cortas con las palabras de lo que dijo. Si no, la lista de opciones va vacía.
4. No agregues nada que no esté en la duda o en lo que dijo.

Devolvé solo el JSON del esquema, una entrada por duda y con los mismos ids.
```

```json
{"dudas": [{"id": "D01", "pregunta": "", "opciones": []}]}
```

### Corrección del registro

```
Pasás al registro de hechos las correcciones que hizo la familia. Es una tarea mecánica: no escribís nada nuevo.
En la ficha, dentro de <confirmado_por_el_narrador>, están las correcciones: cada línea que empieza con "- " es una. Mandan sobre las respuestas y sobre el registro.
1. Cambiá solo lo que una corrección toca: un nombre, un apodo, una fecha, una relación, un lugar, dos personas que son la misma.
2. Devolvé ENTERA cada entrada que cambiaste, con su id y todos sus campos, tal como está en el registro pero con el cambio hecho. Las entradas de linea_de_tiempo se reconocen por "orden".
3. Si dos personas son la misma, devolvé la que queda, con todo junto, y poné el id de la otra en "borrar".
4. "confirmados" va completo: una entrada por cada línea de <confirmado_por_el_narrador>, con "usado_en" (los ids de las entradas del registro donde se usa ese dato).
5. No toques los ids de las respuestas (R01…) ni nada que ninguna corrección nombre.

Devolvé solo el JSON del esquema.
```

```json
{"personas": [], "lugares": [], "episodios": [], "linea_de_tiempo": [], "borrar": [], "confirmados": [{"texto": "", "usado_en": []}]}
```
````

- [ ] **Step 2: Escribir el test que falla**

```ts
// fabrica/test/escritor/prompts.test.ts
// Los prompts del escritor se leen de los md y no se reescriben: el JSON compilado tiene que
// estar al día con los md, y lo que devuelve tiene que ser lo mismo que leía lib.mjs.
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { CLAVES_FABRICA, CLAVES_RECETA, compilarPrompts } from '../../src/escritor/prompts/compilar.js';
import { esquemaDe, guiaDe, promptFabrica, promptsDe, SECCIONES } from '../../src/escritor/prompts/index.js';
import * as L from '../../scripts/escritor-v55/lib.mjs';

const RAIZ = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..', '..');
const md = (r: string) => readFileSync(path.join(RAIZ, r), 'utf8');
const JSON_COMMITEADO = JSON.parse(md('fabrica/src/escritor/prompts/prompts-v55.json'));

describe('prompts compilados', () => {
  it('el prompts-v55.json commiteado está al día con los md (si falla: npx tsx scripts/escritor-prompts-json.ts)', () => {
    const fresco = compilarPrompts({ receta: md('docs/v5/escritor-v55/receta.md'), guia: md('docs/v5/escritor/guia.md'), fabrica: md('docs/v5/escritor-v55/fabrica.md') });
    expect(JSON_COMMITEADO).toEqual(fresco);
  });

  it('cada prompt de la receta es el mismo que leía lib.mjs', () => {
    for (const k of CLAVES_RECETA) {
      expect(promptsDe(k), k).toEqual(L.promptsDe(k));
      expect(esquemaDe(k), k).toBe(L.esquemaDe(k));
    }
  });

  it('la guía por paso es la misma que armaba lib.mjs', () => {
    for (const paso of [...Object.keys(SECCIONES), 'otro']) expect(guiaDe(paso), paso).toBe(L.guiaDe(paso));
  });

  it('los prompts de la fábrica están y llenan sus huecos', () => {
    for (const k of CLAVES_FABRICA) expect(promptsDe(k).length, k).toBeGreaterThan(0);
    const d = promptFabrica('### Disputa', { FRASE: 'Raúl tenía la mercería', ID: 'R02', CITA: 'abrimos la mercería con Raúl' });
    expect(d).toContain('Frase del libro: "Raúl tenía la mercería". Respuesta R02, frase que cita: "abrimos la mercería con Raúl".');
    expect(d).not.toContain('{{');
    expect(esquemaDe('### Corrección del registro')).toContain('"borrar"');
  });
});
```

- [ ] **Step 3: Correr el test y ver que falla**

Run: `cd fabrica && npx vitest run test/escritor/prompts.test.ts`
Expected: FAIL ("Failed to load url ../../src/escritor/prompts/compilar.js").

- [ ] **Step 4: Escribir `compilar.ts`**

```ts
// fabrica/src/escritor/prompts/compilar.ts
// Arma el JSON de prompts del escritor v5.5 desde los md (receta, guía y fabrica.md).
// Puro: recibe el texto de los md. Lo usan el script que genera el JSON y el test que
// verifica que está al día. Los prompts se leen como los leía lib.mjs (promptsDe/esquemaDe).

/** Los encabezados que usa el escritor v5.5 en modo puro (los mismos que llama llamada.mjs). */
export const CLAVES_RECETA = [
  '### Paso 1', '### Paso 2 ·', '### Paso 2h', '### Paso 3a puro', '### Paso 3b puro', '### Paso 3c puro', '### Paso 3d puro',
  '### Paso 3e puro', '### Paso 3r', '### Paso 3t', '### Paso 4', '### Paso 5c', '### Paso 6 puro', '### Paso 7', '### Idioma · catalán',
] as const;
export const CLAVES_FABRICA = ['### Disputa', '### Dudas para la familia', '### Corrección del registro'] as const;

export type PromptsCompilados = { version: 'v5.5'; prompts: Record<string, string[]>; esquemas: Record<string, string>; guia: string };

const sinCR = (s: string): string => s.replace(/\r\n/g, '\n');

/** lib.mjs promptsDe (líneas 18-33) con el texto de la receta como parámetro. */
export function bloquesDe(md: string, encabezado: string): string[] {
  const receta = sinCR(md);
  // cuerpo: copiar lib.mjs:20-32 tal cual (desde `const i = receta.indexOf(encabezado);` hasta `return bloques;`)
}

/** lib.mjs esquemaDe (líneas 111-120) con el texto como parámetro. */
export function esquemaDeMd(md: string, encabezado: string): string {
  const receta = sinCR(md);
  // cuerpo: copiar lib.mjs:113-119 tal cual
}

export function compilarPrompts(md: { receta: string; guia: string; fabrica: string }): PromptsCompilados {
  const prompts: Record<string, string[]> = {};
  const esquemas: Record<string, string> = {};
  for (const k of CLAVES_RECETA) {
    prompts[k] = bloquesDe(md.receta, k);
    esquemas[k] = esquemaDeMd(md.receta, k);
  }
  for (const k of CLAVES_FABRICA) {
    prompts[k] = bloquesDe(md.fabrica, k);
    esquemas[k] = esquemaDeMd(md.fabrica, k);
  }
  return { version: 'v5.5', prompts, esquemas, guia: sinCR(md.guia) };
}
```

(Los dos comentarios `// cuerpo: copiar …` se reemplazan por esas líneas del `.mjs`; `leer(RECETA)` ya no está: la variable `receta` es el parámetro.)

- [ ] **Step 5: Escribir el script y generar el JSON**

```ts
// fabrica/scripts/escritor-prompts-json.ts
// Genera fabrica/src/escritor/prompts/prompts-v55.json desde la receta v5.5, la guía y fabrica.md:
//
//   npx tsx scripts/escritor-prompts-json.ts
//
// Correrlo cada vez que cambia uno de los md (test/escritor/prompts.test.ts avisa si quedó viejo).
import { readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { compilarPrompts } from '../src/escritor/prompts/compilar.js';

const RAIZ = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const md = (r: string) => readFileSync(path.join(RAIZ, r), 'utf8');
const SALIDA = path.join(RAIZ, 'fabrica', 'src', 'escritor', 'prompts', 'prompts-v55.json');

const p = compilarPrompts({ receta: md('docs/v5/escritor-v55/receta.md'), guia: md('docs/v5/escritor/guia.md'), fabrica: md('docs/v5/escritor-v55/fabrica.md') });
writeFileSync(SALIDA, JSON.stringify(p, null, 2) + '\n', 'utf8');
const vacios = Object.entries(p.prompts).filter(([, b]) => !b.length).map(([k]) => k);
console.log(`prompts-v55.json: ${Object.keys(p.prompts).length} encabezados${vacios.length ? `; SIN bloques: ${vacios.join(', ')}` : ''}`);
```

Run: `cd fabrica && npx tsx scripts/escritor-prompts-json.ts`
Expected: `prompts-v55.json: 18 encabezados` (sin la parte "SIN bloques").

- [ ] **Step 6: Escribir `prompts/index.ts`**

```ts
// fabrica/src/escritor/prompts/index.ts
// Los prompts del escritor v5.5, compilados (scripts/escritor-prompts-json.ts). Nunca se escriben acá.
import compilados from './prompts-v55.json' with { type: 'json' };
import type { PromptsCompilados } from './compilar.js';

// El JSON importado tiene un tipo literal por clave: se pasa por unknown al tipo general.
const P = compilados as unknown as PromptsCompilados;

export function promptsDe(encabezado: string): string[] {
  const b = P.prompts[encabezado];
  if (!b) throw new Error(`No está "${encabezado}" en los prompts compilados`);
  return b;
}

export const esquemaDe = (encabezado: string): string => P.esquemas[encabezado] ?? '';
export const guia = (): string => P.guia;

/** lib.mjs SECCIONES (líneas 142-152), copiado. */
export const SECCIONES: Record<string, string[] | null> = { /* lib.mjs:143-151 */ };

/** lib.mjs guiaDe (líneas 153-164), copiado; `guia()` es la compilada. */
export function guiaDe(paso: string): string { /* lib.mjs:154-163 */ }

/** Un prompt de docs/v5/escritor-v55/fabrica.md con sus huecos {{X}} llenos. */
export function promptFabrica(encabezado: string, huecos: Record<string, string> = {}): string {
  let t = promptsDe(encabezado)[0];
  for (const [k, v] of Object.entries(huecos)) t = t.replaceAll(`{{${k}}}`, v);
  return t;
}
```

- [ ] **Step 7: Correr el test y el tipado**

Run: `cd fabrica && npx vitest run test/escritor/prompts.test.ts && npx tsc --noEmit -p .`
Expected: PASS y tsc sin errores.

- [ ] **Step 8: Commit**

```bash
git add docs/v5/escritor-v55/fabrica.md fabrica/src/escritor/prompts/compilar.ts fabrica/src/escritor/prompts/index.ts fabrica/src/escritor/prompts/prompts-v55.json fabrica/scripts/escritor-prompts-json.ts fabrica/test/escritor/prompts.test.ts
git commit -m "escritor: prompts del v5.5 compilados desde los md (y los tres de la fábrica, en borrador)" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 3: Material de prueba (Nélida) y ayudas de test

**Files:**
- Create: `fabrica/test/fijos/escritor-v55/nelida/entradas/ficha.xml`
- Create: `fabrica/test/fijos/escritor-v55/nelida/entradas/respuestas.xml`
- Create: `fabrica/test/fijos/escritor-v55/nelida/salidas/registro.json`
- Create: `fabrica/test/fijos/escritor-v55/nelida/salidas/plan.json`
- Create: `fabrica/test/fijos/escritor-v55/nelida/salidas/{primera_pagina,capitulo_01,capitulo_02,antes_de_cerrar,carta,sus_frases}.md` y `salidas/sus_frases.json`
- Create: `fabrica/test/escritor/ayuda.ts`
- Test: `fabrica/test/escritor/fijos.test.ts`

**Interfaces:**
- Consumes: `Carpeta` (Task 1).
- Produces (en `test/escritor/ayuda.ts`): `FABRICA: string`, `ESC_V55: string`, `NELIDA: string`, `deDisco(dir: string, prefijos?: string[]): Carpeta`, `aDisco(c: Carpeta): string` (carpeta temporal nueva), `carpetaNelida(prefijos?: string[]): Carpeta` (por defecto `['entradas', 'salidas']`), `correrMjs(script: string, args: string[], env?: Record<string, string>): { codigo: number; salida: string }`.

- [ ] **Step 1: Escribir el material inventado**

`entradas/ficha.xml`:

```xml
<ficha>
Nombre: Nélida (le dicen Nelly)
Género: mujer
Año de nacimiento: 1948
Trato: vos
Para quién es el libro: sus hijos, Marcela y Gustavo
Hijos: Marcela y Gustavo
</ficha>
```

`entradas/respuestas.xml`:

```xml
<respuesta id="R01" origen="pregunta OR1" segundos="">
<pregunta>¿Dónde naciste y cómo era tu casa?</pregunta>
<texto>Nací en Echesortu, en Rosario, en 1948. Mi papá era tornero y mi mamá cosía para afuera. Éramos cuatro en una pieza con patio de baldosas.</texto>
</respuesta>

<respuesta id="R02" origen="pregunta TR1" segundos="">
<pregunta>¿Cómo empezó la mercería?</pregunta>
<texto>En el 78 abrimos la mercería con Raúl en la calle Mendoza. La persiana de madera se trababa siempre en el mismo lugar. Raúl hacía las cuentas y yo atendía el mostrador.</texto>
</respuesta>

<respuesta id="R03" origen="pregunta TR2" segundos="">
<pregunta>¿Hubo una noche difícil en el negocio?</pregunta>
<texto>Una noche la cuenta no daba. Raúl me puso la calculadora en la mesa de la cocina y me dijo sumá vos. Sumé tres veces y no daba. Tito ladraba por el camión de la basura.</texto>
</respuesta>

<respuesta id="R04" origen="pregunta HI1" segundos="">
<pregunta>Contame de tu hija.</pregunta>
<texto>Marcela nació en el 80. La nena dormía en un cajón de botones atrás del mostrador.</texto>
</respuesta>

<respuesta id="R05" origen="pregunta PA3" segundos="">
<pregunta>¿Qué pasó con Raúl?</pregunta>
<texto>Raúl murió en 2014. Lo más difícil fue quedarme sola con el negocio.</texto>
</respuesta>

<respuesta id="R06" origen="pregunta HO1" segundos="">
<pregunta>¿Qué hacés hoy a la tarde?</pregunta>
<texto>Hoy bordo a la tarde en el patio. Tengo el bastidor en la falda y la radio prendida.</texto>
</respuesta>

<respuesta id="R07" origen="pregunta HO2" segundos="">
<pregunta>¿Qué te gusta?</pregunta>
<texto>Me gusta el mate amargo, bien caliente, a cualquier hora.</texto>
</respuesta>

<respuesta id="R08" origen="pregunta LE1" segundos="">
<pregunta>¿Qué les dirías a los tuyos?</pregunta>
<texto>A Marcela y a Gustavo les digo que no se peleen por la casa. La casa es de todos.</texto>
</respuesta>

<respuesta id="R09" origen="pregunta LE2" segundos="">
<pregunta>Mirando para atrás, ¿qué ves?</pregunta>
<texto>Mirando para atrás, la vida me dio más de lo que le pedí.</texto>
</respuesta>

<respuesta id="R10" origen="pregunta AM1" segundos="">
<pregunta>¿Quién era tu amiga del barrio?</pregunta>
<texto>La Negra era mi amiga del barrio. Nos sentábamos en la vereda a tomar mate.</texto>
</respuesta>
```

`salidas/registro.json`:

```json
{
 "narrador": {
  "como_se_presenta": [{ "texto": "Nací en Echesortu, en Rosario", "ids": ["R01"] }],
  "cosas_concretas_suyas": [{ "que": "la mercería de la calle Mendoza", "ids": ["R02"] }],
  "repite_sin_que_se_lo_pregunten": [],
  "conclusiones_propias": [{ "texto": "la vida me dio más de lo que le pedí", "ids": ["R09"] }]
 },
 "personas": [
  { "id": "P01", "nombre": "Raúl", "apodos": [], "relacion": "marido", "estado": "termino", "estado_ids": ["R05"], "hechos": [{ "hecho": "hacía las cuentas de la mercería", "cuando": "desde el 78", "ids": ["R02"] }], "rasgos_hoy": [] },
  { "id": "P02", "nombre": "Marcela", "apodos": ["la nena"], "relacion": "hija", "estado": "sigue_hoy", "estado_ids": ["R08"], "hechos": [{ "hecho": "nació en el 80", "cuando": "el 80", "ids": ["R04"] }], "rasgos_hoy": [] },
  { "id": "P03", "nombre": "Gustavo", "apodos": [], "relacion": "hijo", "estado": "sigue_hoy", "estado_ids": ["R08"], "hechos": [], "rasgos_hoy": [] },
  { "id": "P04", "nombre": "la Negra", "apodos": [], "relacion": "amiga", "estado": "no_se_sabe", "estado_ids": [], "hechos": [{ "hecho": "se sentaban en la vereda a tomar mate", "cuando": "", "ids": ["R10"] }], "rasgos_hoy": [] }
 ],
 "lugares": [
  { "id": "L01", "nombre": "Echesortu", "que_es": "el barrio de Rosario donde nació", "estado": "termino", "ids": ["R01"] },
  { "id": "L02", "nombre": "la mercería de la calle Mendoza", "que_es": "el negocio", "estado": "termino", "ids": ["R02"] }
 ],
 "linea_de_tiempo": [
  { "orden": 1, "cuando": "1948", "segura": true, "evento": "nace en Echesortu", "ids": ["R01"] },
  { "orden": 2, "cuando": "el 78", "segura": true, "evento": "abren la mercería", "ids": ["R02"] },
  { "orden": 3, "cuando": "el 80", "segura": true, "evento": "nace Marcela", "ids": ["R04"] },
  { "orden": 4, "cuando": "2014", "segura": true, "evento": "muere Raúl", "ids": ["R05"] }
 ],
 "episodios": [
  { "id": "E01", "que": "la casa de la infancia en Echesortu", "cuando": "infancia", "segura": false, "donde": "Echesortu", "personas": [], "tipo": "episodio", "es_escena": false, "estado": "termino", "momento_clave": "", "ids": ["R01"], "variantes": [], "no_poner": false, "a_quien": "nadie", "a_quien_nombres": [], "detalles": [] },
  { "id": "E02", "que": "abren la mercería con Raúl", "cuando": "el 78", "segura": true, "donde": "calle Mendoza", "personas": ["P01"], "tipo": "episodio", "es_escena": false, "estado": "termino", "momento_clave": "", "ids": ["R02"], "variantes": [], "no_poner": false, "a_quien": "nadie", "a_quien_nombres": [], "detalles": [] },
  { "id": "E03", "que": "la noche de la calculadora", "cuando": "", "segura": false, "donde": "la cocina", "personas": ["P01"], "tipo": "episodio", "es_escena": true, "estado": "termino", "momento_clave": "giro", "ids": ["R03"], "variantes": [], "no_poner": false, "a_quien": "nadie", "a_quien_nombres": [], "detalles": ["la calculadora en la mesa de la cocina", "sumá vos", "sumé tres veces", "Tito ladraba por el camión de la basura"] },
  { "id": "E04", "que": "la nena en el cajón de botones", "cuando": "el 80", "segura": false, "donde": "la mercería", "personas": ["P02"], "tipo": "episodio", "es_escena": true, "estado": "termino", "momento_clave": "", "ids": ["R04"], "variantes": [], "no_poner": false, "a_quien": "nadie", "a_quien_nombres": [], "detalles": ["el cajón de botones atrás del mostrador"] },
  { "id": "E05", "que": "muere Raúl y queda sola con el negocio", "cuando": "2014", "segura": false, "donde": "", "personas": ["P01"], "tipo": "episodio", "es_escena": false, "estado": "termino", "momento_clave": "bajo", "ids": ["R05"], "variantes": [], "no_poner": false, "a_quien": "nadie", "a_quien_nombres": [], "detalles": [] },
  { "id": "E06", "que": "la tarde del bastidor", "cuando": "hoy", "segura": false, "donde": "el patio", "personas": [], "tipo": "episodio", "es_escena": true, "estado": "sigue_hoy", "momento_clave": "", "ids": ["R06"], "variantes": [], "no_poner": false, "a_quien": "nadie", "a_quien_nombres": [], "detalles": ["el bastidor en la falda", "la radio prendida", "el patio"] },
  { "id": "E07", "que": "el mate amargo", "cuando": "hoy", "segura": false, "donde": "", "personas": [], "tipo": "gusto", "es_escena": false, "estado": "sigue_hoy", "momento_clave": "", "ids": ["R07"], "variantes": [], "no_poner": false, "a_quien": "nadie", "a_quien_nombres": [], "detalles": [] },
  { "id": "E08", "que": "que no se peleen por la casa", "cuando": "hoy", "segura": false, "donde": "", "personas": ["P02", "P03"], "tipo": "mensaje", "es_escena": false, "estado": "sigue_hoy", "momento_clave": "", "ids": ["R08"], "variantes": [], "no_poner": false, "a_quien": "familia", "a_quien_nombres": ["Marcela", "Gustavo"], "detalles": [] },
  { "id": "E09", "que": "la vida me dio más de lo que le pedí", "cuando": "hoy", "segura": false, "donde": "", "personas": [], "tipo": "balance", "es_escena": false, "estado": "sigue_hoy", "momento_clave": "", "ids": ["R09"], "variantes": [], "no_poner": false, "a_quien": "nadie", "a_quien_nombres": [], "detalles": [] },
  { "id": "E10", "que": "la Negra en la vereda", "cuando": "", "segura": false, "donde": "la vereda", "personas": ["P04"], "tipo": "episodio", "es_escena": false, "estado": "termino", "momento_clave": "", "ids": ["R10"], "variantes": [], "no_poner": false, "a_quien": "nadie", "a_quien_nombres": [], "detalles": [] }
 ],
 "hoy": [{ "que": "borda a la tarde en el patio", "ids": ["R06"] }],
 "dudas": [{ "tipo": "nombre", "que": "No dice el nombre de la Negra", "ids": ["R10"], "resuelta_por_ficha": false }],
 "confirmados": [],
 "no_poner": [],
 "frases_cortadas": [],
 "voz": {
  "frases": [
   { "id": "R01", "texto": "Nací en Echesortu, en Rosario" },
   { "id": "R01", "texto": "Mi papá era tornero" },
   { "id": "R01", "texto": "mi mamá cosía para afuera" },
   { "id": "R02", "texto": "abrimos la mercería con Raúl" },
   { "id": "R02", "texto": "La persiana de madera se trababa siempre" },
   { "id": "R02", "texto": "Raúl hacía las cuentas y yo atendía el mostrador" },
   { "id": "R03", "texto": "Una noche la cuenta no daba" },
   { "id": "R03", "texto": "me dijo sumá vos" },
   { "id": "R03", "texto": "Sumé tres veces y no daba" },
   { "id": "R04", "texto": "La nena dormía en un cajón de botones" },
   { "id": "R05", "texto": "Lo más difícil fue quedarme sola con el negocio" },
   { "id": "R06", "texto": "Hoy bordo a la tarde en el patio" },
   { "id": "R07", "texto": "Me gusta el mate amargo, bien caliente" },
   { "id": "R08", "texto": "La casa es de todos" },
   { "id": "R09", "texto": "la vida me dio más de lo que le pedí" }
  ],
  "palabras_propias": ["la nena", "sumá vos"],
  "dichos": [],
  "trato": "vos",
  "genero": "f"
 },
 "sin_lugar": []
}
```

`salidas/plan.json`:

```json
{
 "titulo_libro": { "texto": "sumá vos", "id": "R03" },
 "primera_pagina": { "que_dice_de_si_ids": ["R01"], "cosa_concreta": { "que": "la mercería", "ids": ["R02"] } },
 "capitulos": [
  { "n": 1, "titulo": { "texto": "La persiana de madera", "id": "R02" }, "etapa": "Echesortu y la mercería", "anios": { "desde": "1948", "hasta": "1980", "seguros": true },
    "hilo_ids": ["R02", "R03"], "apertura": { "tipo": "escena", "episodio": "E03" }, "cierre": { "tipo": "gesto", "episodio": "E04" },
    "piezas": [
     { "episodio": "E01", "forma": "resumen", "peso": "normal" },
     { "episodio": "E10", "forma": "resumen", "peso": "linea" },
     { "episodio": "E02", "forma": "resumen", "peso": "normal" },
     { "episodio": "E03", "forma": "escena", "peso": "clave" },
     { "episodio": "E04", "forma": "escena", "peso": "normal" }
    ], "presenta": ["P01", "P02", "P04"] },
  { "n": 2, "titulo": { "texto": "El bastidor en la falda", "id": "R06" }, "etapa": "Sola", "anios": { "desde": "2014", "hasta": "", "seguros": true },
    "hilo_ids": ["R05", "R06"], "hilo_de_hoy_ids": ["R06"], "columna": { "texto": "cómo la tarde volvió a ser suya", "ids": ["R06"] },
    "imagen_final": { "episodio": "E06", "frase_id": "R06", "que": "el bastidor en la falda" },
    "apertura": { "tipo": "dia_comun", "episodio": "E05" }, "cierre": { "tipo": "imagen", "episodio": "E06" },
    "piezas": [
     { "episodio": "E05", "forma": "resumen", "peso": "clave" },
     { "episodio": "E07", "forma": "media_linea", "peso": "linea" },
     { "episodio": "E06", "forma": "escena", "peso": "clave" }
    ], "presenta": [] }
 ],
 "antes_de_cerrar": { "ids": ["R09"] },
 "sus_frases": [],
 "carta": { "titulo": "Para los míos", "titulo_id": "", "para": "Marcela y Gustavo", "para_personas": ["P02", "P03"], "ids": ["R08"] },
 "faltantes": []
}
```

Piezas (`salidas/`), cada una termina con `\n`:

`primera_pagina.md`
```
Soy de Echesortu y mi vida pasó detrás de un mostrador, entre botones y cuentas que a veces no daban. [[R01,R02]]
```

`capitulo_01.md`
```
Nací en Echesortu, en Rosario, en una pieza con patio de baldosas donde éramos cuatro. Mi papá era tornero y mi mamá cosía para afuera. [[R01]]

A la tarde me sentaba en la vereda con la Negra, mi amiga del barrio, a tomar mate. [[R10]]

En el 78 abrimos la mercería con Raúl en la calle Mendoza. La persiana de madera se trababa siempre en el mismo lugar, y Raúl hacía las cuentas mientras yo atendía el mostrador. [[R02]]

Una noche la cuenta no daba. Raúl puso la calculadora en la mesa de la cocina y me dijo «sumá vos». Sumé tres veces y no daba, y Tito ladraba por el camión de la basura. [[R03]]

Marcela nació en el 80, y la nena dormía en un cajón de botones atrás del mostrador. [[R04]]
```

`capitulo_02.md`
```
Raúl murió en 2014, y lo más difícil fue quedarme sola con el negocio. [[R05]]

Me gusta el mate amargo, bien caliente, a cualquier hora. [[R07]]

Hoy bordo a la tarde en el patio, con el bastidor en la falda y la radio prendida. [[R06]]
```

`antes_de_cerrar.md`
```
Mirando para atrás, la vida me dio más de lo que le pedí. [[R09]]
```

`carta.md`
```
A Marcela y a Gustavo les pido una sola cosa, que no se peleen por la casa. La casa es de todos. [[R08]]
```

`sus_frases.json`
```json
{"frases": [{"id": "R07", "texto": "Me gusta el mate amargo, bien caliente"}, {"id": "R08", "texto": "La casa es de todos"}]}
```

`sus_frases.md`
```
> Me gusta el mate amargo, bien caliente

> La casa es de todos
```

- [ ] **Step 2: Escribir las ayudas de test**

```ts
// fabrica/test/escritor/ayuda.ts
// Ayudas de los tests del escritor: la carpeta de Nélida (inventada), pasar una Carpeta a disco
// y correr los .mjs originales sobre ella (para comparar el port con el original).
import { spawnSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { Carpeta } from '../../src/escritor/carpeta.js';

export const FABRICA = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
export const ESC_V55 = path.join(FABRICA, 'scripts', 'escritor-v55');
export const NELIDA = path.join(FABRICA, 'test', 'fijos', 'escritor-v55', 'nelida');

/** Lee una carpeta de disco a una Carpeta (rutas con /). Con `prefijos`, solo esas subcarpetas. */
export function deDisco(dir: string, prefijos?: string[]): Carpeta {
  const c = new Carpeta();
  const recorrer = (sub: string) => {
    for (const n of readdirSync(path.join(dir, sub))) {
      const rel = sub ? `${sub}/${n}` : n;
      if (statSync(path.join(dir, rel)).isDirectory()) recorrer(rel);
      else if (!prefijos || prefijos.some((p) => rel.startsWith(`${p}/`))) c.escribir(rel, readFileSync(path.join(dir, rel), 'utf8'));
    }
  };
  recorrer('');
  return c;
}

/** Escribe la Carpeta en una carpeta temporal nueva y devuelve su ruta. */
export function aDisco(c: Carpeta): string {
  const dir = mkdtempSync(path.join(tmpdir(), 'escritor-'));
  for (const [rel, texto] of Object.entries(c.aObjeto())) {
    mkdirSync(path.dirname(path.join(dir, rel)), { recursive: true });
    writeFileSync(path.join(dir, rel), texto, 'utf8');
  }
  return dir;
}

export const carpetaNelida = (prefijos: string[] = ['entradas', 'salidas']): Carpeta => deDisco(NELIDA, prefijos);

/** Corre un .mjs de scripts/escritor-v55 y devuelve su código de salida y su stdout. */
export function correrMjs(script: string, args: string[], env: Record<string, string> = {}): { codigo: number; salida: string } {
  const r = spawnSync(process.execPath, [path.join(ESC_V55, script), ...args], { encoding: 'utf8', env: { ...process.env, ...env } });
  if (r.error) throw r.error;
  if (r.status !== 0 && r.status !== 2 && r.status !== 3) throw new Error(`${script} ${args.join(' ')} salió con ${r.status}: ${r.stderr}`);
  return { codigo: r.status ?? 0, salida: r.stdout };
}
```

- [ ] **Step 3: Escribir el test del material (contra los controles originales)**

```ts
// fabrica/test/escritor/fijos.test.ts
// El material inventado de Nélida tiene que pasar los controles originales del registro (C14)
// y del plan (C12, C13, C19, C20, C33): es la base de los tests del orquestador.
import { describe, expect, it } from 'vitest';
import { aDisco, carpetaNelida, correrMjs } from './ayuda.js';

describe('material de Nélida', () => {
  const dir = aDisco(carpetaNelida());
  it('el registro pasa C14 con controles.mjs', () => {
    const r = correrMjs('controles.mjs', [dir, 'registro']);
    expect(r.salida).toBe('registro: ok\n');
    expect(r.codigo).toBe(0);
  });
  it('el plan pasa sus controles con controles.mjs', () => {
    const r = correrMjs('controles.mjs', [dir, 'plan']);
    expect(r.salida).toBe('plan: ok\n');
    expect(r.codigo).toBe(0);
  });
});
```

- [ ] **Step 4: Correr el test**

Run: `cd fabrica && npx vitest run test/escritor/fijos.test.ts`
Expected: PASS. Si algún control marca algo, el mensaje dice qué (por ejemplo `C13 cap_2: …`): se corrige **el material** (los JSON de Nélida), nunca el `.mjs`, hasta que los dos den `ok`.

- [ ] **Step 5: Commit**

```bash
git add fabrica/test/fijos/escritor-v55/nelida fabrica/test/escritor/ayuda.ts fabrica/test/escritor/fijos.test.ts
git commit -m "escritor: material inventado de Nélida que pasa los controles del v5.5, y ayudas de test" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 4: Lo que lib.mjs leía de la carpeta

**Files:**
- Create: `fabrica/src/escritor/lectura.ts`
- Test: `fabrica/test/escritor/lectura.test.ts`

**Interfaces:**
- Consumes: `Carpeta`, `leerJSON` (Task 1); `idiomaDeFicha`, `archivoDe` (Task 1); `carpetaNelida`, `aDisco` (Task 3).
- Produces: `salida(f: string): string`, `respuestas(c: Carpeta): Respuesta[]`, `idioma(c: Carpeta): IdiomaLibro`, `ficha(c: Carpeta): string`, `nombreDePila(c: Carpeta): string`, `piezas(c: Carpeta): PiezaEscrita[]` (con `archivo` = ruta en la carpeta, p. ej. `salidas/capitulo_01.md`), `idsDeCapitulo(c: Carpeta, n: number): Set<string>`, `noEntran(c: Carpeta): Set<string>`.

- [ ] **Step 1: Escribir el test que falla**

```ts
// fabrica/test/escritor/lectura.test.ts
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import * as Lc from '../../src/escritor/lectura.js';
import * as L from '../../scripts/escritor-v55/lib.mjs';
import { aDisco, carpetaNelida } from './ayuda.js';

describe('lectura.ts lee lo mismo que lib.mjs', () => {
  const c = carpetaNelida();
  c.escribir('entradas/confirmado.xml', '- La Negra se llamaba Ofelia.');
  c.escribir('pendientes/cap_2.json', '["R09"]');
  c.escribir('controles/afuera-cap_1.json', JSON.stringify({ noEntra: ['R07'] }));
  const dir = aDisco(c);

  it('respuestas, ficha (con confirmado), nombre e idioma', () => {
    expect(Lc.respuestas(c)).toEqual(L.respuestas(dir));
    expect(Lc.ficha(c)).toBe(L.ficha(dir));
    expect(Lc.nombreDePila(c)).toBe(L.nombreDePila(dir));
    expect(Lc.idioma(c)).toBe(L.idioma(dir));
  });

  it('piezas en el orden del libro, con su archivo', () => {
    const ts = Lc.piezas(c);
    const mjs = L.piezas(dir);
    expect(ts.map((p) => [p.pieza, p.texto])).toEqual(mjs.map((p: { pieza: string; texto: string }) => [p.pieza, p.texto]));
    expect(ts.map((p) => p.archivo)).toEqual(mjs.map((p: { archivo: string }) => path.relative(dir, p.archivo).replace(/\\/g, '/')));
  });

  it('idsDeCapitulo (con pendientes) y noEntran', () => {
    expect([...Lc.idsDeCapitulo(c, 2)].sort()).toEqual([...L.idsDeCapitulo(dir, 2)].sort());
    expect([...Lc.noEntran(c)]).toEqual([...L.noEntran(dir)]);
  });
});
```

- [ ] **Step 2: Correr el test y ver que falla**

Run: `cd fabrica && npx vitest run test/escritor/lectura.test.ts`
Expected: FAIL ("Failed to load url ../../src/escritor/lectura.js").

- [ ] **Step 3: Escribir `lectura.ts` copiando lib.mjs**

```ts
// fabrica/src/escritor/lectura.ts
// Lo que lib.mjs leía de la carpeta del escritor, sobre la Carpeta en memoria (copiado letra por letra).
import { Carpeta, leerJSON } from './carpeta.js';
import { archivoDe, idiomaDeFicha } from './texto.js';
import type { IdiomaLibro, PiezaEscrita, Respuesta } from './tipos.js';

export const salida = (f: string): string => `salidas/${f}`;

/** lib.mjs:44-54. `leer(path.join(dir, 'entradas', 'respuestas.xml'))` → `c.leer('entradas/respuestas.xml')`. */
export function respuestas(c: Carpeta): Respuesta[] { /* lib.mjs:45-53 */ }

/** lib.mjs:58. */
export const idioma = (c: Carpeta): IdiomaLibro => idiomaDeFicha(c.leer('entradas/ficha.xml'));

/** lib.mjs:72-77 (con `<confirmado_por_el_narrador>` si hay entradas/confirmado.xml). */
export function ficha(c: Carpeta): string { /* lib.mjs:73-76 */ }

/** lib.mjs:79-83. */
export function nombreDePila(c: Carpeta): string { /* lib.mjs:80-82 */ }

/** lib.mjs:88-98; `archivo` queda como ruta de la Carpeta (`salidas/capitulo_01.md`). */
export function piezas(c: Carpeta): PiezaEscrita[] { /* lib.mjs:89-97, con `s(f)` = salida(f) y `fs.readdirSync(path.join(dir, 'salidas'))` = `c.listar('salidas')` */ }

/** lib.mjs:210-218. */
export function idsDeCapitulo(c: Carpeta, n: number): Set<string> { /* lib.mjs:211-217 */ }

/** lib.mjs:244-248 (`existe(d)` de una carpeta → `c.existeCarpeta('controles')`). */
export function noEntran(c: Carpeta): Set<string> { /* lib.mjs:245-247 */ }
```

`archivoDe` se usa en Task 8 (no acá); si `tsc` marca el import sin usar, sacarlo.

- [ ] **Step 4: Correr el test y el tipado**

Run: `cd fabrica && npx vitest run test/escritor/lectura.test.ts && npx tsc --noEmit -p .`
Expected: PASS y tsc sin errores.

- [ ] **Step 5: Commit**

```bash
git add fabrica/src/escritor/lectura.ts fabrica/test/escritor/lectura.test.ts
git commit -m "escritor: lectura de la carpeta (respuestas, ficha, piezas) portada de lib.mjs" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 5: Controles de texto (C1–C8, C10, C15, C17, C28, C29, C31, C32 y compañía)

**Files:**
- Create: `fabrica/src/escritor/controles/texto.ts`
- Test: `fabrica/test/escritor/controles-texto.test.ts`

**Interfaces:**
- Consumes: `norm`, `palabras`, `marcas` (Task 1); tipos `PiezaTexto`, `Respuesta`, `Json`, `Problema`.
- Produces (todas exportadas): `esSubsecuencia(frase: string, texto: string, salto?: number): boolean`, `oraciones(t: string): string[]`, `parrafos(t: string): string[]`, `sinCitas(t: string): string`, `enAlgunaRespuesta(frase: string, rs: Respuesta[]): boolean`, `c1(p: PiezaTexto, rs: Respuesta[]): Problema[]`, `c2(p): Problema[]`, `c3(p): Problema[]`, `c4(p, rs, fichaTxt: string, registroTxt: string): Problema[]`, `c5(p, rs, fichaTxt: string): Problema[]`, `c6(p, rs): Problema[]`, `c7(ps: PiezaTexto[], estribillos?: string[]): Problema[]`, `c8(p, rs): Problema[]`, `c10(p, rs, trato: string | undefined): Problema[]`, `c15(p): Problema[]`, `presentes(ps: PiezaTexto[]): Json[]`, `pasados(ps: PiezaTexto[], reg: Json): Json[]`, `c28(p): Problema[]`, `c29(p, reg: Json): Problema[]`, `c31(p): Problema[]`, `c32(p): Problema[]`, `repite(ps: PiezaTexto[], pieza: string): Problema[]`, `c17(ps: PiezaTexto[]): Problema[]`, `referencias(ps: PiezaTexto[]): Json[]`.

- [ ] **Step 1: Escribir el test que falla**

Los casos de los tests originales (`controles.test.mjs`, `v52`–`v55.test.mjs`) se portan acá **copiando** sus bloques `test(...)`: `import test from 'node:test'` pasa a `import { test } from 'vitest'`, `assert` sigue siendo `node:assert/strict`, y los imports apuntan a los módulos TS. Además, un test de equivalencia directa con el `.mjs` sobre las piezas de Nélida (con fallas sembradas):

```ts
// fabrica/test/escritor/controles-texto.test.ts
// Los controles de texto portados: los tests originales copiados, y la misma salida que controles.mjs
// sobre las piezas de Nélida con fallas sembradas.
import assert from 'node:assert/strict';
import { describe, expect, it, test } from 'vitest';
import * as T from '../../src/escritor/controles/texto.js';
import * as M from '../../scripts/escritor-v55/controles.mjs';

const rs = [
  { id: 'R01', pregunta: '¿Dónde naciste?', texto: 'Nací en Echesortu, en Rosario, en 1948. Mi papá era tornero.' },
  { id: 'R03', pregunta: '¿Hubo una noche difícil en el negocio?', texto: 'Una noche la cuenta no daba. Raúl me dijo sumá vos.' },
];
const conFallas = {
  pieza: 'cap_1',
  texto: [
    'Sin duda fue un antes y un después en el tapiz de mi vida… [[R01]]',
    'Y entonces vino Ramiro. Corto. Más corto. Cortísimo. [[R01]]',
    '«Una noche la cuenta no daba nunca jamás», me dijo. Caminando por la calle, fue vendida por Raúl en 1950. Tenés razón, tienes razón. [[R03]]',
    'Hoy con Raúl no hablo. Hoy tampoco. [[R03]]',
    'De la salud, paso. No me acuerdo de nada. ¿Hubo una noche difícil en el negocio? [[R03]]',
  ].join('\n\n'),
};
const reg = { personas: [{ id: 'P01', nombre: 'Raúl', apodos: [], relacion: 'marido', estado: 'sigue_hoy' }] };

describe('controles de texto: lo mismo que controles.mjs', () => {
  it('cada control da lo mismo sobre una pieza con fallas', () => {
    expect(T.c1(conFallas, rs)).toEqual(M.c1(conFallas, rs));
    expect(T.c7([conFallas, { pieza: 'cap_2', texto: 'Y entonces vino Ramiro. Corto. Más corto.' }])).toEqual(M.c7([conFallas, { pieza: 'cap_2', texto: 'Y entonces vino Ramiro. Corto. Más corto.' }]));
    expect(T.c10(conFallas, rs, 'vos')).toEqual(M.c10(conFallas, rs, 'vos'));
    expect(T.c28(conFallas)).toEqual(M.c28(conFallas));
    expect(T.c29(conFallas, reg)).toEqual(M.c29(conFallas, reg));
    expect(T.c31(conFallas)).toEqual(M.c31(conFallas));
    expect(T.c32(conFallas)).toEqual(M.c32(conFallas));
    expect(T.c17([conFallas])).toEqual(M.c17([conFallas]));
    expect(T.presentes([conFallas])).toEqual(M.presentes([conFallas]));
    expect(T.pasados([conFallas], reg)).toEqual(M.pasados([conFallas], reg));
    expect(T.referencias([conFallas])).toEqual(M.referencias([conFallas]));
    expect(T.repite([conFallas, { pieza: 'primera_pagina', texto: 'Sin duda fue un antes y un después en el tapiz.' }], 'primera_pagina')).toEqual(M.repite([conFallas, { pieza: 'primera_pagina', texto: 'Sin duda fue un antes y un después en el tapiz.' }], 'primera_pagina'));
    expect(T.esSubsecuencia('la cuenta no daba', rs[1].texto)).toBe(M.esSubsecuencia('la cuenta no daba', rs[1].texto));
  });
  // C2, C3, C4, C5, C6, C8 y C15 no están exportados en controles.mjs: los compara
  // test/escritor/controles-correr.test.ts a través de `controles.mjs <carpeta> piezas`.
});

// ---- tests originales, copiados ----
```

Debajo de esa última línea se pegan, en este orden y sin cambiar datos ni aserciones, los bloques `test(...)` de:
- `scripts/escritor-v55/controles.test.mjs` que usan `c1`, `c7`, `c10`, `c28`, `c29`, `c31`, `referencias`, `pasados` (con las constantes que esos bloques usan del principio del archivo);
- `scripts/escritor-v55/v52.test.mjs` que usan `c31` y `c32`;
- `scripts/escritor-v55/v53.test.mjs` que usan `repite`;
- `scripts/escritor-v55/v54.test.mjs` que usan `c31` y `c32`;
- `scripts/escritor-v55/v55.test.mjs` que usa `c17`.

Cambios al copiar: el `test` de `node:test` pasa a ser el de vitest (ya importado), `assert` queda de `node:assert/strict` (ya importado), y cada `c1(…)`, `repite(…)`, etc. pasa a `T.c1(…)`, `T.repite(…)`. Los bloques de esos archivos que usan funciones de otras tasks (`c12`, `c13`, `c18`, `c20`, `c23`, `c24`, `c26`, `c33`, `barandaEstilo`, `tituloValido`, `idiomaDeFicha`…) se copian en la task de esa función (6, 9 y 1).

- [ ] **Step 2: Correr el test y ver que falla**

Run: `cd fabrica && npx vitest run test/escritor/controles-texto.test.ts`
Expected: FAIL ("Failed to load url ../../src/escritor/controles/texto.js").

- [ ] **Step 3: Escribir `controles/texto.ts` copiando controles.mjs**

```ts
// fabrica/src/escritor/controles/texto.ts
// Controles por código sobre el texto de las piezas (receta v5.5, sección 4), copiados letra por
// letra de fabrica/scripts/escritor-v55/controles.mjs. Mismos topes, mismas regex, mismo orden.
import { norm, palabras, marcas } from '../texto.js';
import type { Json, PiezaTexto, Problema, Respuesta } from '../tipos.js';

export const oraciones = (t: string): string[] => /* controles.mjs:11 */;
export const parrafos = (t: string): string[] => /* controles.mjs:12 */;
// controles.mjs:13 (MULETILLAS) no lo usa nadie: no se copia.
export function esSubsecuencia(frase: string, texto: string, salto = 4): boolean { /* controles.mjs:17-28 */ }
export const enAlgunaRespuesta = (frase: string, rs: Respuesta[]): boolean => /* controles.mjs:30 */;
const A2_PALABRAS = /* controles.mjs:33-34 */;
const A2_MOLDES = /* controles.mjs:35 */;
export function c1(p: PiezaTexto, rs: Respuesta[]): Problema[] { /* controles.mjs:38-68 */ }
export const sinCitas = (t: string): string => /* controles.mjs:72 */;
export const c2 = (p: PiezaTexto): Problema[] => /* controles.mjs:75 */;
export function c3(p: PiezaTexto): Problema[] { /* controles.mjs:79-89 */ }
export function c4(p: PiezaTexto, rs: Respuesta[], fichaTxt: string, registroTxt: string): Problema[] { /* controles.mjs:94-111 */ }
export function c5(p: PiezaTexto, rs: Respuesta[], fichaTxt: string): Problema[] { /* controles.mjs:116-125 */ }
export function c6(p: PiezaTexto, rs: Respuesta[]): Problema[] { /* controles.mjs:130-139 */ }
export function c7(ps: PiezaTexto[], estribillos: string[] = []): Problema[] { /* controles.mjs:144-163 */ }
export function c8(p: PiezaTexto, rs: Respuesta[]): Problema[] { /* controles.mjs:168-178 */ }
export function c10(p: PiezaTexto, rs: Respuesta[], trato: string | undefined): Problema[] { /* controles.mjs:183-199 */ }
export function c15(p: PiezaTexto): Problema[] { /* controles.mjs:204-212 */ }
const PRES = /* controles.mjs:216 */;
export function presentes(ps: PiezaTexto[]): Json[] { /* controles.mjs:218-222 */ }
const PASADO = /* controles.mjs:226 */;
const SINONIMOS: Record<string, string[]> = /* controles.mjs:227 */;
export function pasados(ps: PiezaTexto[], reg: Json): Json[] { /* controles.mjs:229-245 */ }
const HOY = /* controles.mjs:249 */;
export function c28(p: PiezaTexto): Problema[] { /* controles.mjs:251-259 */ }
export function c29(p: PiezaTexto, reg: Json): Problema[] { /* controles.mjs:264-274 */ }
export function c31(p: PiezaTexto): Problema[] { /* controles.mjs:279-294 */ }
const NOES: [RegExp, string][] = /* controles.mjs:298-314 */;
export function c32(p: PiezaTexto): Problema[] { /* controles.mjs:316-322 */ }
export function repite(ps: PiezaTexto[], pieza: string): Problema[] { /* controles.mjs:361-362 */ }
const REL = /* controles.mjs:366 */;
export function c17(ps: PiezaTexto[]): Problema[] { /* controles.mjs:368-389 */ }
const REFERENCIA = /* controles.mjs:695 */;
export function referencias(ps: PiezaTexto[]): Json[] { /* controles.mjs:697-701 */ }
```

Como en Task 1, cada `/* controles.mjs:a-b */` se reemplaza por esas líneas copiadas. Los objetos que devuelven los controles no llevan `pieza` (la agrega `controlar`, Task 7), salvo `c7`, `c17` y `repite`, que ya la traen en el original.

- [ ] **Step 4: Correr el test y el tipado**

Run: `cd fabrica && npx vitest run test/escritor/controles-texto.test.ts && npx tsc --noEmit -p .`
Expected: PASS y tsc sin errores.

- [ ] **Step 5: Commit**

```bash
git add fabrica/src/escritor/controles/texto.ts fabrica/test/escritor/controles-texto.test.ts
git commit -m "escritor: controles de texto del v5.5 portados (mismos topes, tests originales copiados)" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 6: Controles de estructura (registro, plan, todo entra, arreglo, repaso)

**Files:**
- Create: `fabrica/src/escritor/controles/estructura.ts`
- Test: `fabrica/test/escritor/controles-estructura.test.ts`

**Interfaces:**
- Consumes: `Carpeta`, `leerJSON` (Task 1); `norm`, `palabras`, `marcas`, `sinMarcas`, `piezaDeR` (Task 1); `esSubsecuencia`, `parrafos`, `oraciones` (Task 5); `carpetaNelida` (Task 3).
- Produces: `HECHOS: string[]`, `c12(plan: Json, rs: Respuesta[], reg: Json): string[]`, `c13(plan: Json, reg: Json): string[]`, `c14(reg: Json, rs: Respuesta[], fichaTxt: string): string[]`, `c9(probs: Json[], nueva: string, vieja: string): { abiertos: Json[]; identicos: number }`, `c18(psCrudas: PiezaTexto[], rs: Respuesta[], reg: Json, plan: Json, noEntran?: Set<string>): Problema[]`, `c19(psCrudas: PiezaTexto[], reg: Json): Problema[]`, `c20(plan: Json, reg: Json): string[]`, `c21(ps: PiezaTexto[], reg: Json, plan: Json): Problema[]`, `c22(ps: PiezaTexto[], reg: Json, plan: Json): Problema[]`, `c20Texto(psCrudas: PiezaTexto[], reg: Json, plan: Json): Problema[]`, `c23(psCrudas: PiezaTexto[], reg: Json): Problema[]`, `c24(ps: PiezaTexto[], cotejo: Json, plan: Json, reg: Json, psCrudas?: PiezaTexto[], rs?: Respuesta[] | null): Problema[]`, `cotejoValido(cotejo: Json, rs: Respuesta[] | null | undefined): { validas: Json[]; descartadas: Json[] }`, `c26(repaso: Json, anteriores: Record<string, Json[]>): { oscila: Json[]; contradice: Json[]; nuevos: Json[] }`, `c33(plan: Json, reg: Json): string[]`, `c33Texto(psCrudas: PiezaTexto[], plan: Json, reg: Json): Problema[]`, `decisionesAnteriores(c: Carpeta): Record<string, Json[]>`.

- [ ] **Step 1: Escribir el test que falla**

```ts
// fabrica/test/escritor/controles-estructura.test.ts
// Controles de registro, plan, "todo entra", arreglo y repaso: lo mismo que controles.mjs.
import assert from 'node:assert/strict';
import { describe, expect, it, test } from 'vitest';
import { leerJSON } from '../../src/escritor/carpeta.js';
import * as E from '../../src/escritor/controles/estructura.js';
import { respuestas } from '../../src/escritor/lectura.js';
import { planConR } from '../../src/escritor/texto.js';
import * as M from '../../scripts/escritor-v55/controles.mjs';
import { aDisco, carpetaNelida } from './ayuda.js';

describe('controles de estructura: lo mismo que controles.mjs sobre Nélida', () => {
  const c = carpetaNelida();
  const reg = leerJSON(c, 'salidas/registro.json');
  const plan = planConR(leerJSON(c, 'salidas/plan.json'), reg);
  const rs = respuestas(c);
  const ps = ['primera_pagina.md', 'capitulo_01.md', 'capitulo_02.md', 'antes_de_cerrar.md', 'carta.md'].map((f) => ({ pieza: f.replace('.md', '').replace(/^capitulo_0?/, 'cap_'), texto: c.leer(`salidas/${f}`) }));

  it('plan: C12, C13, C20, C33 sin problemas y con un plan roto, iguales', () => {
    expect(E.c12(plan, rs, reg)).toEqual(M.c12(plan, rs, reg));
    expect(E.c13(plan, reg)).toEqual(M.c13(plan, reg));
    expect(E.c20(plan, reg)).toEqual(M.c20(plan, reg));
    expect(E.c33(plan, reg)).toEqual(M.c33(plan, reg));
    const roto = structuredClone(plan);
    roto.capitulos[1].apertura.tipo = 'escena';
    roto.capitulos[0].titulo.texto = 'Una etapa linda';
    roto.capitulos[0].golpe = { episodio: 'E03', preparacion: ['E06'], frase_id: 'R06' };
    expect(E.c12(roto, rs, reg)).toEqual(M.c12(roto, rs, reg));
    expect(E.c13(roto, reg)).toEqual(M.c13(roto, reg));
    expect(E.c33(roto, reg)).toEqual(M.c33(roto, reg));
    expect(E.c13(roto, reg).length).toBeGreaterThan(0);
  });

  it('todo entra: C18, C19, C20Texto, C23, C33Texto, iguales', () => {
    const sinR06 = ps.map((p) => (p.pieza === 'cap_2' ? { ...p, texto: p.texto.replace('[[R06]]', '') } : p));
    expect(E.c18(sinR06, rs, reg, plan)).toEqual(M.c18(sinR06, rs, reg, plan));
    expect(E.c19(sinR06, reg)).toEqual(M.c19(sinR06, reg));
    expect(E.c20Texto(sinR06, reg, plan)).toEqual(M.c20Texto(sinR06, reg, plan));
    expect(E.c23(sinR06, reg)).toEqual(M.c23(sinR06, reg));
    expect(E.c33Texto(sinR06, plan, reg)).toEqual(M.c33Texto(sinR06, plan, reg));
  });

  it('cotejo y repaso: cotejoValido, C24, C26, iguales', () => {
    const cotejo = { faltan: [{ id: 'R03', frase: 'Tito ladraba por el camión' }, { id: 'R99', frase: 'no existe' }, { id: 'R01', frase: 'frase inventada' }] };
    expect(E.cotejoValido(cotejo, rs)).toEqual(M.cotejoValido(cotejo, rs));
    expect(E.c24(ps, cotejo, plan, reg, ps, rs)).toEqual(M.c24(ps, cotejo, plan, reg, ps, rs));
    const repaso = { problemas: [{ pieza: 'cap_1', tipo: 'pasado', frase: 'Raúl tiene la mercería', ids: ['R02'] }, { pieza: 'cap_1', tipo: 'contradice_decision', frase: 'x' }, { pieza: 'cap_2', tipo: 'nombre', frase: 'y' }] };
    const anteriores = { cap_1: [{ n: 1, tipo: 'presente', frase: 'Raúl tenía la mercería', correccion: '', resultado: 'cambiado', despues: 'Raúl tiene la mercería' }] };
    expect(E.c26(repaso, anteriores)).toEqual(M.c26(repaso, anteriores));
  });

  it('decisionesAnteriores lee lo mismo que el original', () => {
    const d = carpetaNelida();
    d.escribir('arreglos/problemas-cap_1.json', JSON.stringify([{ n: 1, origen: 'verificador', tipo: 'presente', frase: 'Raúl tiene la mercería', correccion: 'tenía' }, { n: 2, origen: 'código C31', tipo: 'puntos', frase: 'x' }]));
    d.escribir('arreglos/respuesta-cap_1.txt', 'texto\n---\n{"cambios": [{"problema": 1, "resultado": "cambiado", "despues": "Raúl tenía la mercería"}]}');
    expect(E.decisionesAnteriores(d)).toEqual(M.decisionesAnteriores(aDisco(d)));
  });
});
// C9 y C14 no están exportados en controles.mjs: los compara test/escritor/controles-correr.test.ts.

// ---- tests originales, copiados ----
// Copiar acá, sin cambiar datos ni aserciones, los `test(...)` de scripts/escritor-v55/controles.test.mjs
// que usan c12, c13, c18, c20, c20Texto, c23, c24, c26, cotejoValido, piezaDeR, planConR y armarCambios
// (incluidos `reg()` y `plan()` del principio del archivo), y los de v52.test.mjs que usan c18, c33 y c33Texto.
// `import test from 'node:test'` → el `test` de vitest; los imports, a E (este módulo) y a ../../src/escritor/texto.js.
```

Al copiar, el comentario de las últimas líneas se reemplaza por los tests copiados; `assert` y `test` quedan importados para ellos.

- [ ] **Step 2: Correr el test y ver que falla**

Run: `cd fabrica && npx vitest run test/escritor/controles-estructura.test.ts`
Expected: FAIL ("Failed to load url ../../src/escritor/controles/estructura.js").

- [ ] **Step 3: Escribir `controles/estructura.ts` copiando controles.mjs**

```ts
// fabrica/src/escritor/controles/estructura.ts
// Controles de registro (C14), plan (C12, C13, C19/C20, C33), "todo entra" (C18–C24, C33 en el texto),
// arreglo (C9) y repaso (C26), copiados letra por letra de fabrica/scripts/escritor-v55/controles.mjs.
import { Carpeta, leerJSON } from '../carpeta.js';
import { marcas, norm, palabras, piezaDeR, sinMarcas } from '../texto.js';
import type { Json, PiezaTexto, Problema, Respuesta } from '../tipos.js';
import { esSubsecuencia, oraciones, parrafos } from './texto.js';

const epsDe = (reg: Json): Record<string, string[]> => /* controles.mjs:326 */;
export function c33(plan: Json, reg: Json): string[] { /* controles.mjs:328-344 */ }
export function c33Texto(psCrudas: PiezaTexto[], plan: Json, reg: Json): Problema[] { /* controles.mjs:348-356 */ }
const VALORACION = /* controles.mjs:393 */;
const VACIAS = /* controles.mjs:394 */;
export function c12(plan: Json, rs: Respuesta[], reg: Json): string[] { /* controles.mjs:396-414 */ }
export function c13(plan: Json, reg: Json): string[] { /* controles.mjs:417-481 */ }
export function c14(reg: Json, rs: Respuesta[], fichaTxt: string): string[] { /* controles.mjs:486-524 */ }
export function c9(probs: Json[], nueva: string, vieja: string): { abiertos: Json[]; identicos: number } { /* controles.mjs:529-545 */ }
const safeJSON = (s: string): Json => /* controles.mjs:547 */;
const capituloDe = (plan: Json, reg: Json, rid: string): string => piezaDeR(plan, reg, rid); // controles.mjs:550
export function c18(psCrudas: PiezaTexto[], rs: Respuesta[], reg: Json, plan: Json, noEntran: Set<string> = new Set()): Problema[] { /* controles.mjs:553-569 */ }
export function c19(psCrudas: PiezaTexto[], reg: Json): Problema[] { /* controles.mjs:573-580 */ }
export function c20(plan: Json, reg: Json): string[] { /* controles.mjs:584-604 */ }
export function c21(ps: PiezaTexto[], reg: Json, plan: Json): Problema[] { /* controles.mjs:608-617 */ }
export function c22(ps: PiezaTexto[], reg: Json, plan: Json): Problema[] { /* controles.mjs:621-634 */ }
const idsDeTipo = (reg: Json, tipos: string[]): Set<string> => /* controles.mjs:638 */;
export function c20Texto(psCrudas: PiezaTexto[], reg: Json, plan: Json): Problema[] { /* controles.mjs:641-653 */ }
export function c23(psCrudas: PiezaTexto[], reg: Json): Problema[] { /* controles.mjs:658-665 */ }
export function c24(ps: PiezaTexto[], cotejo: Json, plan: Json, reg: Json, psCrudas: PiezaTexto[] = [], rs: Respuesta[] | null = null): Problema[] { /* controles.mjs:670-680 */ }
export function cotejoValido(cotejo: Json, rs: Respuesta[] | null | undefined): { validas: Json[]; descartadas: Json[] } { /* controles.mjs:685-691 */ }
const OPUESTO: Record<string, string> = /* controles.mjs:705 */;
const seTocan = (a: string, b: string): boolean => { /* controles.mjs:707-708 */ };
export function c26(repaso: Json, anteriores: Record<string, Json[]>): { oscila: Json[]; contradice: Json[]; nuevos: Json[] } { /* controles.mjs:711-720 */ }
export const HECHOS = /* controles.mjs:723 */;
export function decisionesAnteriores(c: Carpeta): Record<string, Json[]> { /* controles.mjs:726-739, con la tabla de reemplazos */ }
```

`c9` usa `HECHOS`, que en el original está declarado más abajo (línea 723): en TS, `HECHOS` se declara **antes** de `c9` (es lo único que cambia de lugar; en JS funcionaba por hoisting de la llamada en tiempo de ejecución). `c22` se copia aunque la receta lo sacó como control: `controlar` no lo llama, igual que el original.

- [ ] **Step 4: Correr el test y el tipado**

Run: `cd fabrica && npx vitest run test/escritor/controles-estructura.test.ts && npx tsc --noEmit -p .`
Expected: PASS y tsc sin errores.

- [ ] **Step 5: Commit**

```bash
git add fabrica/src/escritor/controles/estructura.ts fabrica/test/escritor/controles-estructura.test.ts
git commit -m "escritor: controles de registro, plan, todo entra, arreglo y repaso portados" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---
### Task 7: `controlar`, el main de controles.mjs (barreras 2 como valores)

**Files:**
- Create: `fabrica/src/escritor/controles/correr.ts`
- Modify: `fabrica/test/escritor/ayuda.ts` (agrega `mismoArchivo`)
- Test: `fabrica/test/escritor/controles-correr.test.ts`

**Interfaces:**
- Consumes: Tasks 1, 4, 5, 6 (`Carpeta`, `leerJSON`, `planConR`, `sinMarcas`, `palabras`, `respuestas`, `ficha`, `piezas`, `noEntran`, `salida`, todos los `cN`, `repite`, `esSubsecuencia`, `enAlgunaRespuesta`, `decisionesAnteriores`).
- Produces:
  - `type QueControl = 'registro' | 'plan' | 'piezas' | 'arreglo' | 'repite' | 'repaso'`
  - `type ResultadoControl = { codigo: 0 | 2; problemas: Json[]; resumen: string }` (`resumen` = lo que imprimía el `.mjs`, sin el `\n` final)
  - `controlar(c: Carpeta, que: QueControl, arg?: string): ResultadoControl` — escribe `controles/<que>.json` (o `controles/c9-<pieza>.json`, `controles/repite-<pieza>.json`, `controles/repaso.json`) igual que el original.
  - en `ayuda.ts`: `mismoArchivo(c: Carpeta, dir: string, ruta: string): void` (expect de igualdad entre la Carpeta y el disco).

- [ ] **Step 1: Agregar `mismoArchivo` a las ayudas**

```ts
// al final de fabrica/test/escritor/ayuda.ts
import { expect } from 'vitest';

/** El archivo `ruta` es igual en la Carpeta y en el disco (donde lo dejó el .mjs). */
export function mismoArchivo(c: Carpeta, dir: string, ruta: string): void {
  expect(c.leer(ruta), ruta).toBe(readFileSync(path.join(dir, ruta), 'utf8').replace(/\r\n/g, '\n'));
}
```

(El `import { expect } from 'vitest'` va arriba, con los demás imports.)

- [ ] **Step 2: Escribir el test que falla**

```ts
// fabrica/test/escritor/controles-correr.test.ts
// controlar() da el mismo código de salida, el mismo resumen y el mismo archivo que `node controles.mjs`.
import { describe, expect, it } from 'vitest';
import type { Carpeta } from '../../src/escritor/carpeta.js';
import { controlar, type QueControl } from '../../src/escritor/controles/correr.js';
import { aDisco, carpetaNelida, correrMjs, mismoArchivo } from './ayuda.js';

function comparar(c: Carpeta, que: QueControl, arg?: string): { dir: string; codigo: number } {
  const dir = aDisco(c);
  const mjs = correrMjs('controles.mjs', [dir, que, ...(arg ? [arg] : [])]);
  const ts = controlar(c, que, arg);
  expect(ts.codigo).toBe(mjs.codigo);
  expect(`${ts.resumen}\n`).toBe(mjs.salida);
  return { dir, codigo: ts.codigo };
}

/** Nélida con fallas sembradas en las piezas (para que los controles de texto marquen). */
function sembrada(): Carpeta {
  const c = carpetaNelida();
  c.escribir('salidas/capitulo_01.md', `${c.leer('salidas/capitulo_01.md')}\nSin duda Ramiro llegó en 1950 y todo fue un tapiz… Y después. Corto. Más corto. Cortísimo. «La cuenta no daba nunca más en la vida», me dijo. ¿Hubo una noche difícil en el negocio? [[R03]]\n`);
  c.escribir('salidas/primera_pagina.md', 'Me llamo Nélida y nací en 1948 en Rosario, tengo dos hijos. En el 78 abrimos la mercería con Raúl en la calle Mendoza. [[R01,R02]]\n');
  c.escribir('salidas/capitulo_02.md', c.leer('salidas/capitulo_02.md').replace(' [[R06]]', ''));
  return c;
}

describe('controlar: lo mismo que controles.mjs', () => {
  it('registro bien y roto', () => {
    const c = carpetaNelida();
    mismoArchivo(c, comparar(c, 'registro').dir, 'controles/registro.json');
    const reg = JSON.parse(c.leer('salidas/registro.json'));
    reg.voz.frases = reg.voz.frases.slice(0, 10);
    reg.episodios[0].a_quien = 'todos';
    reg.episodios[2].detalles = [];
    c.escribir('salidas/registro.json', JSON.stringify(reg));
    c.escribir('entradas/confirmado.xml', '- La Negra se llamaba Ofelia.');
    const r = comparar(c, 'registro');
    expect(r.codigo).toBe(2);
    mismoArchivo(c, r.dir, 'controles/registro.json');
  });

  it('plan bien y roto', () => {
    const c = carpetaNelida();
    mismoArchivo(c, comparar(c, 'plan').dir, 'controles/plan.json');
    const plan = JSON.parse(c.leer('salidas/plan.json'));
    plan.capitulos[1].apertura.tipo = 'escena';
    plan.capitulos[0].titulo = { texto: 'Una etapa linda', id: '' };
    c.escribir('salidas/plan.json', JSON.stringify(plan));
    const r = comparar(c, 'plan');
    expect(r.codigo).toBe(2);
    mismoArchivo(c, r.dir, 'controles/plan.json');
  });

  it('piezas bien, con fallas y con cotejo después del arreglo', () => {
    const limpia = carpetaNelida();
    mismoArchivo(limpia, comparar(limpia, 'piezas').dir, 'controles/piezas.json');
    const c = sembrada();
    const r = comparar(c, 'piezas');
    expect(r.codigo).toBe(2);
    mismoArchivo(c, r.dir, 'controles/piezas.json');
    c.escribir('arreglos/respuesta-cap_1.txt', 'x\n---\n{"cambios": []}');
    c.escribir('salidas/cotejo.json', JSON.stringify({ faltan: [{ id: 'R03', frase: 'Tito ladraba por el camión de la basura' }, { id: 'R99', frase: 'nada' }] }));
    mismoArchivo(c, comparar(c, 'piezas').dir, 'controles/piezas.json');
  });

  it('repite (C7 de la primera página contra el resto)', () => {
    const c = sembrada();
    const r = comparar(c, 'repite', 'primera_pagina');
    expect(r.codigo).toBe(2);
    mismoArchivo(c, r.dir, 'controles/repite-primera_pagina.json');
  });

  it('arreglo (C9) y repaso (C26)', () => {
    const c = carpetaNelida();
    c.escribir('arreglos/problemas-cap_1.json', JSON.stringify([
      { n: 1, origen: 'verificador', tipo: 'presente', frase: 'Raúl puso la calculadora en la mesa', correccion: 'puso' },
      { n: 2, origen: 'código C31', tipo: 'puntos', frase: 'Una noche la cuenta no daba.' },
      { n: 3, origen: 'verificador', tipo: 'fecha', frase: 'Marcela nació en el 80' },
    ], null, 1));
    c.escribir('arreglos/respuesta-cap_1.txt', `${c.leer('salidas/capitulo_01.md').trim().replace('Una noche la cuenta no daba.', 'Una noche, la cuenta no daba.')}\n---\n${JSON.stringify({ cambios: [{ problema: 1, resultado: 'disputa', disputa_id: 'R03', disputa_frase: 'Raúl me puso la calculadora en la mesa', antes: '', despues: '' }, { problema: 2, resultado: 'cambiado', antes: 'Una noche la cuenta no daba.', despues: 'Una noche, la cuenta no daba.' }, { problema: 3, resultado: 'cambiado', antes: 'x', despues: 'y' }] }, null, 1)}\n`);
    const a = comparar(c, 'arreglo', 'cap_1');
    mismoArchivo(c, a.dir, 'controles/c9-cap_1.json');
    c.escribir('salidas/hechos-repaso.json', JSON.stringify({ problemas: [{ pieza: 'cap_1', tipo: 'pasado', frase: 'Raúl puso la calculadora en la mesa', ids: ['R03'] }, { pieza: 'cap_1', tipo: 'contradice_decision', frase: 'x' }] }));
    mismoArchivo(c, comparar(c, 'repaso').dir, 'controles/repaso.json');
  });
});
```

- [ ] **Step 3: Correr el test y ver que falla**

Run: `cd fabrica && npx vitest run test/escritor/controles-correr.test.ts`
Expected: FAIL ("Failed to load url ../../src/escritor/controles/correr.js").

- [ ] **Step 4: Escribir `controles/correr.ts`**

```ts
// fabrica/src/escritor/controles/correr.ts
// El main de fabrica/scripts/escritor-v55/controles.mjs (líneas 743-795), sobre la Carpeta:
// en vez de imprimir y salir con 0 o 2, devuelve el código y el resumen. Mismo orden de controles.
import { Carpeta, leerJSON } from '../carpeta.js';
import { ficha, noEntran, piezas, respuestas, salida } from '../lectura.js';
import { palabras, planConR, sinMarcas } from '../texto.js';
import type { Json } from '../tipos.js';
import { c12, c13, c14, c18, c19, c20, c20Texto, c21, c23, c24, c26, c33, c33Texto, c9, decisionesAnteriores } from './estructura.js';
import { c1, c10, c15, c17, c2, c28, c29, c3, c31, c32, c4, c5, c6, c7, c8, enAlgunaRespuesta, esSubsecuencia, repite } from './texto.js';

export type QueControl = 'registro' | 'plan' | 'piezas' | 'arreglo' | 'repite' | 'repaso';
export type ResultadoControl = { codigo: 0 | 2; problemas: Json[]; resumen: string };

export function controlar(c: Carpeta, que: QueControl, arg?: string): ResultadoControl {
  const lineas: string[] = [];
  const fin = (codigo: 0 | 2, problemas: Json[]): ResultadoControl => ({ codigo, problemas, resumen: lineas.join('\n') });
  const rs = respuestas(c);
  const fichaTxt = ficha(c);
  const reg = c.existe(salida('registro.json')) ? leerJSON(c, salida('registro.json')) : null;
  let problemas: Json[] = [];
  if (que === 'registro') problemas = c14(reg, rs, fichaTxt);
  else if (que === 'plan') {
    const plan = planConR(leerJSON(c, salida('plan.json')), reg);
    problemas = [...c12(plan, rs, reg), ...c13(plan, reg), ...c20(plan, reg), ...c33(plan, reg)];
  } else if (que === 'piezas') {
    // controles.mjs:753-768 copiado letra por letra, con la tabla de reemplazos:
    //   `existe(path.join(dir, 'arreglos')) && fsList(path.join(dir, 'arreglos')).some(…)` → `c.existeCarpeta('arreglos') && c.listar('arreglos').some(…)`
    //   `existe(salida(dir, 'cotejo.json'))` → `c.existe(salida('cotejo.json'))`; `leerJSON(salida(dir, …))` → `leerJSON(c, salida(…))`
    //   `piezas(dir)` → `piezas(c)`; `noEntran(dir)` → `noEntran(c)`
  } else if (que === 'arreglo') {
    const pieza = String(arg);
    const probs = leerJSON(c, `arreglos/problemas-${pieza}.json`);
    const nueva = c.leer(`arreglos/respuesta-${pieza}.txt`);
    const vieja = piezas(c).find((p) => p.pieza === pieza)?.texto || '';
    const r = c9(probs, nueva, vieja);
    c.escribir(`controles/c9-${pieza}.json`, JSON.stringify(r, null, 1));
    lineas.push(/* el template string de controles.mjs:775, con `arg` → `pieza` */);
    return fin(r.abiertos.length ? 2 : 0, r.abiertos);
  } else if (que === 'repite') {
    const pieza = String(arg);
    const ps = piezas(c).map((p) => ({ ...p, texto: sinMarcas(p.texto) }));
    const r = repite(ps, pieza);
    c.escribir(`controles/repite-${pieza}.json`, JSON.stringify(r, null, 1));
    lineas.push(/* el template string de controles.mjs:782, con `arg` → `pieza` */);
    return fin(r.length ? 2 : 0, r);
  } else if (que === 'repaso') {
    const r = c26(leerJSON(c, salida('hechos-repaso.json')), decisionesAnteriores(c));
    c.escribir('controles/repaso.json', JSON.stringify(r, null, 1));
    lineas.push(/* el template string de controles.mjs:787 */);
    return fin(r.nuevos.length || r.contradice.length ? 2 : 0, [...r.nuevos, ...r.contradice]);
  }
  c.escribir(`controles/${que}.json`, JSON.stringify(problemas, null, 1));
  if (!problemas.length) {
    lineas.push(`${que}: ok`);
    return fin(0, problemas);
  }
  lineas.push(`${que}: ${problemas.length} problemas`);
  for (const p of problemas.slice(0, 60)) lineas.push(typeof p === 'string' ? `- ${p}` : `- [${p.control}] ${p.pieza}: ${p.que} — ${String(p.frase).slice(0, 100)}`);
  return fin(2, problemas);
}
```

Los cuatro comentarios `/* … controles.mjs:N */` se reemplazan por el código de esas líneas (los template strings van tal cual). Los imports que no se usen después de copiar (`palabras`, `esSubsecuencia`, `enAlgunaRespuesta`, `c22`…) se sacan; los que se usen se dejan.

- [ ] **Step 5: Correr el test y el tipado**

Run: `cd fabrica && npx vitest run test/escritor/controles-correr.test.ts && npx tsc --noEmit -p .`
Expected: PASS y tsc sin errores.

- [ ] **Step 6: Commit**

```bash
git add fabrica/src/escritor/controles/correr.ts fabrica/test/escritor/ayuda.ts fabrica/test/escritor/controles-correr.test.ts
git commit -m "escritor: controlar() da el mismo código, resumen y archivo que controles.mjs" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 8: Afuera (C30), arreglos y estado

**Files:**
- Create: `fabrica/src/escritor/controles/afuera.ts`
- Create: `fabrica/src/escritor/controles/arreglos.ts`
- Create: `fabrica/src/escritor/controles/estado.ts`
- Test: `fabrica/test/escritor/arreglos.test.ts`

**Interfaces:**
- Consumes: Tasks 1, 4, 6, 7 (`separarAfuera`, `destinosAfuera`, `archivoDe`, `armarCambios`, `piezaDeR`, `planConR`, `idsDeCapitulo`, `piezas`, `respuestas`, `salida`, `cotejoValido`, `controlar`; ayudas `aDisco`, `carpetaNelida`, `correrMjs`, `mismoArchivo`).
- Produces:
  - `controlarAfuera(c: Carpeta, n: number): { codigo: 0 | 3; resumen: string }` (C30: escribe `salidas/capitulo_NN.md` sin el JSON, `controles/afuera-cap_N.json` y `pendientes/cap_M.json`)
  - `juntar(c: Carpeta, o: { soloHechos: boolean }): string`, `armar(c: Carpeta, pieza: string): string`, `aplicar(c: Carpeta, pieza: string): string` (devuelven lo que imprimía `arreglos.mjs`)
  - `type Disputa = { clave: string; pieza: string; n: number; frase: string; id: string; cita: string; origen?: string }`
  - `estado(c: Carpeta, que: 'capitulos' | 'capitulo-de' | 'arreglos' | 'disputas' | 'repaso', rid?: string): Json` — `capitulos` → `{ n: number[]; antes: boolean }`, `arreglos` → `{ piezas: string[]; sus_frases: number }`, `disputas`/`repaso` → `{ disputas: Disputa[] }`

- [ ] **Step 1: Escribir el test que falla**

```ts
// fabrica/test/escritor/arreglos.test.ts
// afuera.mjs, arreglos.mjs y estado.mjs, portados: mismos archivos y misma salida.
import assert from 'node:assert/strict';
import { describe, expect, it, test } from 'vitest';
import { Carpeta } from '../../src/escritor/carpeta.js';
import { controlarAfuera } from '../../src/escritor/controles/afuera.js';
import { aplicar, armar, juntar } from '../../src/escritor/controles/arreglos.js';
import { controlar } from '../../src/escritor/controles/correr.js';
import { estado } from '../../src/escritor/controles/estado.js';
import { aDisco, carpetaNelida, correrMjs, mismoArchivo } from './ayuda.js';

describe('afuera (C30)', () => {
  it('separa el JSON, manda a pendientes y avisa si dejó más de un tercio afuera', () => {
    const c = carpetaNelida();
    c.escribir('salidas/capitulo_01.md', `${c.leer('salidas/capitulo_01.md').trim()}\n---\n${JSON.stringify({ afuera: [{ id: 'R10', a_donde: 'cap_2', por_que: 'es de después' }, { id: 'R04', a_donde: 'linea' }, { id: 'R01', a_donde: 'no_entra' }] })}`);
    const dir = aDisco(c);
    const mjs = correrMjs('afuera.mjs', [dir, '1']);
    const ts = controlarAfuera(c, 1);
    expect(ts.codigo).toBe(mjs.codigo);
    expect(ts.codigo).toBe(3);
    expect(`${ts.resumen}\n`).toBe(mjs.salida);
    for (const r of ['salidas/capitulo_01.md', 'controles/afuera-cap_1.json', 'pendientes/cap_2.json']) mismoArchivo(c, dir, r);
  });
});

describe('arreglos: juntar (solo hechos), armar y aplicar', () => {
  function preparada(): Carpeta {
    const c = carpetaNelida();
    c.escribir('salidas/capitulo_02.md', c.leer('salidas/capitulo_02.md').replace(' [[R06]]', ''));
    controlar(c, 'piezas');
    c.escribir('salidas/hechos.json', JSON.stringify({ problemas: [{ pieza: 'cap_1', tipo: 'fecha', frase: 'Marcela nació en el 80', material: 'R04', ids: ['R04'], correccion: 'Marcela nació en el 80' }] }));
    c.escribir('salidas/veedor.json', JSON.stringify({ problemas: [{ pieza: 'carta', tipo: 'repetido', frase: 'La casa es de todos.', que: 'se repite' }] }));
    return c;
  }

  it('juntar con SOLO_HECHOS da los mismos problemas por pieza', () => {
    const c = preparada();
    const dir = aDisco(c);
    const mjs = correrMjs('arreglos.mjs', [dir, 'juntar'], { SOLO_HECHOS: '1' });
    expect(`${juntar(c, { soloHechos: true })}\n`).toBe(mjs.salida);
    for (const f of c.listar('arreglos')) mismoArchivo(c, dir, `arreglos/${f}`);
  });

  it('armar y aplicar dejan la misma respuesta y la misma pieza', () => {
    const c = preparada();
    juntar(c, { soloHechos: true });
    c.escribir('arreglos/cambios-cap_1.json', JSON.stringify({ cambios: [{ problema: 1, resultado: 'cambiado', antes: 'Marcela nació en el 80, y la nena', despues: 'Marcela nació en el 80. La nena' }, { problema: 2, resultado: 'cambiado', antes: 'no está tal cual', despues: 'x' }] }));
    const dir = aDisco(c);
    expect(`${armar(c, 'cap_1')}\n`).toBe(correrMjs('arreglos.mjs', [dir, 'armar', 'cap_1']).salida);
    mismoArchivo(c, dir, 'arreglos/respuesta-cap_1.txt');
    expect(`${aplicar(c, 'cap_1')}\n`).toBe(correrMjs('arreglos.mjs', [dir, 'aplicar', 'cap_1']).salida);
    mismoArchivo(c, dir, 'salidas/capitulo_01.md');
    expect(c.leer('salidas/capitulo_01.md')).toContain('Marcela nació en el 80. La nena');
  });
});

describe('estado', () => {
  it('da lo mismo que estado.mjs', () => {
    const c = carpetaNelida();
    c.escribir('arreglos/problemas-cap_1.json', '[{"n": 1}]');
    c.escribir('arreglos/problemas-sus_frases.json', '[{"n": 1}, {"n": 2}]');
    c.escribir('controles/c9-cap_1.json', JSON.stringify({ abiertos: [{ n: 1, estado: 'disputa', id: 'R03', cita: 'me dijo sumá vos', frase: 'Raúl dijo sumá vos' }, { n: 2, estado: 'sigue' }], identicos: 80 }));
    c.escribir('controles/repaso.json', JSON.stringify({ nuevos: [], oscila: [{ pieza: 'cap_1', n: 1, frase: 'f', ids: ['R02'], material: 'm' }], contradice: [] }));
    const dir = aDisco(c);
    for (const que of ['capitulos', 'arreglos', 'disputas', 'repaso'] as const) expect(estado(c, que), que).toEqual(JSON.parse(correrMjs('estado.mjs', [dir, que]).salida));
    expect(estado(c, 'capitulo-de', 'R06')).toEqual(JSON.parse(correrMjs('estado.mjs', [dir, 'capitulo-de', 'R06']).salida));
  });
});

// ---- test original de estado.test.mjs (el de `estado`), copiado ----
// Se copia el bloque `test('estado: …')` y la función `carpeta()` del principio de
// scripts/escritor-v55/estado.test.mjs, con un cambio: `carpeta()` arma una `new Carpeta()` y
// escribe con `c.escribir(f, typeof o === 'string' ? o : JSON.stringify(o))` en vez de usar un
// directorio temporal; `estado(dir, …)` pasa a `estado(c, …)`. El test de `informe` va en la Task 9.
```

Al copiar, el comentario final se reemplaza por esos bloques (`assert`, `test` y `Carpeta` ya están importados para ellos).

- [ ] **Step 2: Correr el test y ver que falla**

Run: `cd fabrica && npx vitest run test/escritor/arreglos.test.ts`
Expected: FAIL ("Failed to load url ../../src/escritor/controles/afuera.js").

- [ ] **Step 3: Escribir los tres módulos**

```ts
// fabrica/src/escritor/controles/afuera.ts
// C30 (v5, novelista con red): fabrica/scripts/escritor-v55/afuera.mjs sobre la Carpeta. En vez de
// salir con 3 devuelve `codigo: 3`: el orquestador reescribe el capítulo una vez.
import type { Carpeta } from '../carpeta.js';
import { leerJSON } from '../carpeta.js';
import { idsDeCapitulo, salida } from '../lectura.js';
import { archivoDe, destinosAfuera, separarAfuera } from '../texto.js';

export function controlarAfuera(c: Carpeta, n: number): { codigo: 0 | 3; resumen: string } {
  // afuera.mjs:10-23 copiado con la tabla de reemplazos (`archivo` = salida(archivoDe(`cap_${n}`)),
  // `path.join(dir, 'pendientes', `${cap}.json`)` → `pendientes/${cap}.json`, etc.).
  // El console.log de la línea 23 pasa a `const resumen = <ese template string>`.
  return { codigo: demasiado ? 3 : 0, resumen };
}
```

```ts
// fabrica/src/escritor/controles/arreglos.ts
// Paso 6: fabrica/scripts/escritor-v55/arreglos.mjs sobre la Carpeta (juntar, armar, aplicar).
// `SOLO_HECHOS=1` pasa a ser `o.soloHechos`; cada console.log se junta en el resumen que se devuelve.
import { Carpeta, leerJSON } from '../carpeta.js';
import { piezas, respuestas, salida } from '../lectura.js';
import { archivoDe, armarCambios, piezaDeR, planConR } from '../texto.js';
import { cotejoValido } from './estructura.js';

export function juntar(c: Carpeta, o: { soloHechos: boolean }): string {
  const lineas: string[] = [];
  // arreglos.mjs:13-39 copiado (`const SOLO = !!process.env.SOLO_HECHOS` → `const SOLO = o.soloHechos`)
  return lineas.join('\n');
}

export function armar(c: Carpeta, pieza: string): string {
  // arreglos.mjs:41-48 copiado; el console.log final es el valor que se devuelve
}

export function aplicar(c: Carpeta, pieza: string): string {
  // arreglos.mjs:51-55 copiado; el console.log final es el valor que se devuelve
}
```

```ts
// fabrica/src/escritor/controles/estado.ts
// Lo que el orquestador necesita saber entre pasos: fabrica/scripts/escritor-v55/estado.mjs sobre la Carpeta.
import { Carpeta, leerJSON } from '../carpeta.js';
import { salida } from '../lectura.js';
import type { Json } from '../tipos.js';

export type Disputa = { clave: string; pieza: string; n: number; frase: string; id: string; cita: string; origen?: string };

export function estado(c: Carpeta, que: 'capitulos' | 'capitulo-de' | 'arreglos' | 'disputas' | 'repaso', rid?: string): Json {
  // estado.mjs:12-43 copiado: `lista(d, re)` → `(c.existeCarpeta(d) ? c.listar(d).filter((f) => re.test(f)) : [])`
  // con `arr` = 'arreglos', `ctl` = 'controles', y `path.join(arr, f)` → `${arr}/${f}`.
}
```

- [ ] **Step 4: Correr el test y el tipado**

Run: `cd fabrica && npx vitest run test/escritor/arreglos.test.ts && npx tsc --noEmit -p .`
Expected: PASS y tsc sin errores.

- [ ] **Step 5: Commit**

```bash
git add fabrica/src/escritor/controles/afuera.ts fabrica/src/escritor/controles/arreglos.ts fabrica/src/escritor/controles/estado.ts fabrica/test/escritor/arreglos.test.ts
git commit -m "escritor: afuera (C30), arreglos y estado portados sobre la carpeta en memoria" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 9: Corrector de estilo (baranda) e informe

**Files:**
- Create: `fabrica/src/escritor/controles/estilo.ts`
- Create: `fabrica/src/escritor/controles/informe.ts`
- Test: `fabrica/test/escritor/estilo-informe.test.ts`

**Interfaces:**
- Consumes: Tasks 1, 4, 8 (`marcas`, `palabras`, `archivoDe`, `salida`, `leerJSON`, `estado`).
- Produces: `barandaEstilo(c: Json, texto: string, conocidos?: string[]): string`, `aplicarEstilo(texto: string, cambios: Json[], conocidos?: string[]): { texto: string; aplicados: Json[]; frenados: Json[] }`, `aplicarEstiloPieza(c: Carpeta, pieza: string, ronda: 1 | 2): string` (lo que imprimía `estilo.mjs`), `informe(c: Carpeta): string`.

- [ ] **Step 1: Escribir el test que falla**

```ts
// fabrica/test/escritor/estilo-informe.test.ts
import assert from 'node:assert/strict';
import { describe, expect, it, test } from 'vitest';
import { Carpeta } from '../../src/escritor/carpeta.js';
import { aplicarEstilo, aplicarEstiloPieza, barandaEstilo } from '../../src/escritor/controles/estilo.js';
import { informe } from '../../src/escritor/controles/informe.js';
import * as M from '../../scripts/escritor-v55/estilo.mjs';
import * as I from '../../scripts/escritor-v55/informe.mjs';
import { aDisco, carpetaNelida, correrMjs, mismoArchivo } from './ayuda.js';

const cambios = [
  { antes: 'Raúl puso la calculadora en la mesa de la cocina', despues: 'Raúl puso la calculadora sobre la mesa de la cocina', por_que: 'sintaxis' },
  { antes: 'Marcela nació en el 80', despues: 'Marcela nació en el 81', por_que: 'sintaxis' },
  { antes: 'con Raúl en la calle Mendoza', despues: 'en la calle Mendoza', por_que: 'sintaxis' },
  { antes: 'no está en la pieza', despues: 'x', por_que: 'sintaxis' },
];

describe('estilo (Paso 7): misma baranda que estilo.mjs', () => {
  it('barandaEstilo y aplicarEstilo', () => {
    const t = carpetaNelida().leer('salidas/capitulo_01.md');
    for (const x of cambios) expect(barandaEstilo(x, t, ['Raúl', 'Marcela'])).toBe(M.barandaEstilo(x, t, ['Raúl', 'Marcela']));
    expect(aplicarEstilo(t, cambios, ['Raúl'])).toEqual(M.aplicarEstilo(t, cambios, ['Raúl']));
  });

  it('aplicarEstiloPieza, ronda 1 y 2, y una pieza sin cambios', () => {
    const c = carpetaNelida();
    c.escribir('estilo/cambios-cap_1.json', JSON.stringify({ cambios }));
    c.escribir('estilo/cambios-cap_1-2.json', JSON.stringify({ cambios: [{ antes: 'Una noche la cuenta no daba.', despues: 'Una noche, la cuenta no daba.', por_que: 'puntuacion' }] }));
    const dir = aDisco(c);
    expect(`${aplicarEstiloPieza(c, 'cap_1', 1)}\n`).toBe(correrMjs('estilo.mjs', [dir, 'cap_1']).salida);
    expect(`${aplicarEstiloPieza(c, 'cap_1', 2)}\n`).toBe(correrMjs('estilo.mjs', [dir, 'cap_1', '2']).salida);
    expect(`${aplicarEstiloPieza(c, 'carta', 1)}\n`).toBe(correrMjs('estilo.mjs', [dir, 'carta']).salida);
    for (const r of ['salidas/capitulo_01.md', 'estilo/antes-cap_1.md', 'estilo/aplicado-cap_1.json', 'estilo/antes-cap_1-2.md', 'estilo/aplicado-cap_1-2.json']) mismoArchivo(c, dir, r);
  });
});

describe('informe', () => {
  it('da el mismo informe.md que informe.mjs', () => {
    const c = carpetaNelida();
    c.escribir('controles/piezas-1.json', JSON.stringify([{ pieza: 'cap_1', control: 'C2', que: 'cortada', frase: 'y entonces…' }]));
    c.escribir('controles/piezas.json', JSON.stringify([{ pieza: 'cap_1', control: 'C24', que: 'falta frase de R03', frase: '' }, { pieza: 'cap_2', control: 'C31', que: 'puntos', frase: 'Corto.' }]));
    c.escribir('controles/c9-cap_1.json', JSON.stringify({ abiertos: [{ n: 1, estado: 'disputa', id: 'R03', cita: 'sumá vos', frase: 'f' }, { n: 2, estado: 'sigue', tipo: 'fecha', frase: 'Marcela nació en el 80' }], identicos: 60 }));
    c.escribir('arreglos/respuesta-cap_1.txt', 'texto\n---\n{"cambios": [{"problema": 3, "resultado": "no_aplicado"}]}');
    c.escribir('arreglos/disputa-cap_1-1.json', '{"respalda": false, "por_que": "R03 no dice eso"}');
    c.escribir('controles/repaso.json', JSON.stringify({ nuevos: [{ pieza: 'cap_1', tipo: 'pasado', frase: 'x', correccion: 'y' }], oscila: [], contradice: [] }));
    c.escribir('arreglos/problemas-sus_frases.json', JSON.stringify([{ n: 1, origen: 'código C6', tipo: 'cita', frase: 'f', que: 'no textual' }]));
    c.escribir('libro.md', '# sumá vos\n\nuna dos tres\n');
    expect(informe(c)).toBe(I.informe(aDisco(c)));
  });
});

// ---- tests originales, copiados ----
// Se pegan acá, sin cambiar datos ni aserciones: los `test(...)` de scripts/escritor-v55/v53.test.mjs,
// v54.test.mjs y v55.test.mjs que usan `barandaEstilo` / `aplicarEstilo`, y el `test('informe: …')` de
// estado.test.mjs (con su `carpeta()` armando una `new Carpeta()` como en la Task 8).
```

Al copiar, el comentario final se reemplaza por esos bloques.

- [ ] **Step 2: Correr el test y ver que falla**

Run: `cd fabrica && npx vitest run test/escritor/estilo-informe.test.ts`
Expected: FAIL ("Failed to load url ../../src/escritor/controles/estilo.js").

- [ ] **Step 3: Escribir los dos módulos**

```ts
// fabrica/src/escritor/controles/estilo.ts
// v5.3, Paso 7 (corrector de estilo): fabrica/scripts/escritor-v55/estilo.mjs sobre la Carpeta.
import { Carpeta, leerJSON } from '../carpeta.js';
import { salida } from '../lectura.js';
import { archivoDe, marcas, palabras } from '../texto.js';
import type { Json } from '../tipos.js';

const EN_LETRAS: Record<string, number> = /* estilo.mjs:10-12 */;
const numeros = (t: string): string => /* estilo.mjs:14 */;
const nombres = (t: string): string[] => /* estilo.mjs:16 */;
export function barandaEstilo(c: Json, texto: string, conocidos: string[] = []): string { /* estilo.mjs:20-38 */ }
export function aplicarEstilo(texto: string, cambios: Json[], conocidos: string[] = []): { texto: string; aplicados: Json[]; frenados: Json[] } { /* estilo.mjs:42-50 */ }

/** El main de estilo.mjs (líneas 53-68): aplica estilo/cambios-<pieza>[-2].json a la pieza. Devuelve lo que imprimía. */
export function aplicarEstiloPieza(c: Carpeta, pieza: string, ronda: 1 | 2): string {
  const r = ronda === 2 ? '-2' : '';
  // estilo.mjs:57-67 copiado con la tabla de reemplazos (`rondaArg === "2"` ya está en `r`);
  // el `console.log` de "sin cambios" y el del final son los valores que se devuelven.
}
```

`barandaEstilo(c, …)` conserva el nombre `c` del original para el cambio (no es la Carpeta: es un parámetro distinto en otra función).

```ts
// fabrica/src/escritor/controles/informe.ts
// Paso 7 de la receta: el informe interno (para Naza), fabrica/scripts/escritor-v55/informe.mjs sobre la Carpeta.
// Sin lectura final (decisión del 06/10): si no está salidas/lectura-final.json, esa sección no sale (igual que el original).
import { Carpeta, leerJSON } from '../carpeta.js';
import { salida } from '../lectura.js';
import { estado } from './estado.js';

const recorte = (s: unknown, n = 140): string => { /* informe.mjs:10 */ };
const celda = (s: unknown): string => /* informe.mjs:11 */;

export function informe(c: Carpeta): string {
  // informe.mjs:14-80 copiado con la tabla de reemplazos (`ctl(f)` → `controles/${f}`, `arr(f)` → `arreglos/${f}`,
  // `readdirSync(path.join(dir, 'controles'))` → `c.listar('controles')`, `estado(dir, …)` → `estado(c, …)`).
}
```

- [ ] **Step 4: Correr el test y el tipado**

Run: `cd fabrica && npx vitest run test/escritor/estilo-informe.test.ts && npx tsc --noEmit -p .`
Expected: PASS y tsc sin errores.

- [ ] **Step 5: Commit**

```bash
git add fabrica/src/escritor/controles/estilo.ts fabrica/src/escritor/controles/informe.ts fabrica/test/escritor/estilo-informe.test.ts
git commit -m "escritor: baranda del corrector de estilo e informe portados" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 10: Las llamadas al modelo (llamada.mjs, modo puro)

**Files:**
- Create: `fabrica/src/escritor/llamadas/armar.ts`
- Test: `fabrica/test/escritor/llamadas.test.ts`

**Interfaces:**
- Consumes: Tasks 1, 2, 4, 5, 6 (`Carpeta`, `leerJSON`, `ficha`, `idioma`, `idsDeCapitulo`, `nombreDePila`, `piezas`, `respuestas`, `salida`, `promptsDe`, `esquemaDe`, `guiaDe`, `guia`, `marcas`, `respuestasXML`, `sinMarcas`, `presentes`, `pasados`, `referencias`, `decisionesAnteriores`).
- Produces:
  - `type Llamada = { nombre: string; docs: string[]; instr: string }` (`nombre` = el archivo de `llamadas/` del v5.5: `1-registro`, `3b-capitulo-01`, `7-estilo-cap_1-2`…)
  - `tag(t: string, s: string): string`, `libroComo(ps: PiezaTexto[]): string`
  - `llamadaRegistro(c, o?: { error?: string })`, `llamadaPlan(c, o?: { error?: string })`, `llamadaArmador(c, n: number)`, `llamadaCapitulo(c, n: number, o?: { error?: string })`, `llamadaResumen(c, pieza: string)`, `llamadaAntes(c): Llamada | null`, `llamadaCarta(c)`, `llamadaPrimera(c, o?: { error?: string })`, `llamadaSusFrases(c)`, `llamadaHechos(c, o: { repaso: boolean })`, `llamadaVeedor(c)`, `llamadaArreglo(c, pieza: string)`, `llamadaEstilo(c, pieza: string, ronda: 1 | 2)`, `llamadaTitulo(c, n: number)` — todas `(c: Carpeta, …) => Llamada` salvo `llamadaAntes`.
  - `textoDeLlamada(l: Llamada): string` (lo que `guardar` dejaba en `llamadas/<nombre>.txt`, con las líneas largas partidas) y `textoParaElModelo(l: Llamada): string` (el mismo texto, sin partir líneas ni `\n` final).

- [ ] **Step 1: Escribir el test que falla**

```ts
// fabrica/test/escritor/llamadas.test.ts
// Cada llamada es el mismo texto que dejaba `node llamada.mjs <carpeta> <paso>` en llamadas/<nombre>.txt.
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import type { Carpeta } from '../../src/escritor/carpeta.js';
import * as A from '../../src/escritor/llamadas/armar.js';
import { aDisco, carpetaNelida, correrMjs } from './ayuda.js';

function preparada(idiomaFicha: string): Carpeta {
  const c = carpetaNelida();
  if (idiomaFicha) c.escribir('entradas/ficha.xml', c.leer('entradas/ficha.xml').replace('</ficha>', `${idiomaFicha}\n</ficha>`));
  c.escribir('salidas/historias/cap_1.md', 'La casa, la mercería y la noche de la calculadora.');
  c.escribir('salidas/resumenes/cap_1.md', 'Echesortu, la mercería con Raúl, la noche de la calculadora.\nFrases suyas usadas: "sumá vos".');
  c.escribir('pendientes/cap_2.json', '["R10"]');
  c.escribir('controles/registro.json', JSON.stringify(['C14 voz: 12 frases (van de 15 a 20)'], null, 1));
  c.escribir('controles/afuera-cap_2.json', JSON.stringify({ afuera: [{ id: 'R07', a_donde: 'linea' }], fuera: 1, propias: 3, demasiado: false }, null, 1));
  c.escribir('controles/repite-primera_pagina.json', JSON.stringify([{ pieza: 'primera_pagina', control: 'C7', frase: 'la mercería con raúl en la' }], null, 1));
  c.escribir('arreglos/problemas-cap_1.json', JSON.stringify([{ n: 1, origen: 'verificador', tipo: 'fecha', frase: 'Marcela nació en el 80', que: 'R04', ids: ['R04'], correccion: 'Marcela nació en el 80' }], null, 1));
  c.escribir('arreglos/respuesta-cap_1.txt', `${c.leer('salidas/capitulo_01.md').trim()}\n---\n{"cambios": [{"problema": 1, "resultado": "sin_cambio"}]}\n`);
  return c;
}

/** Corre llamada.mjs y devuelve el texto que dejó en llamadas/<nombre>.txt. */
function delMjs(dir: string, args: string[], nombre: string, env: Record<string, string> = {}): string {
  correrMjs('llamada.mjs', [dir, ...args], env);
  return readFileSync(path.join(dir, 'llamadas', `${nombre}.txt`), 'utf8');
}

for (const idiomaFicha of ['', 'Idioma del libro: catalán']) {
  describe(`llamadas: el mismo texto que llamada.mjs${idiomaFicha ? ' (catalán)' : ''}`, () => {
    const c = preparada(idiomaFicha);
    const dir = aDisco(c);
    const err = (r: string) => path.join(dir, r);
    const casos: [string, () => A.Llamada | null, string[], string, Record<string, string>?][] = [
      ['registro', () => A.llamadaRegistro(c), ['registro'], '1-registro'],
      ['registro con error', () => A.llamadaRegistro(c, { error: c.leer('controles/registro.json') }), ['registro'], '1-registro', { ERROR: err('controles/registro.json') }],
      ['plan', () => A.llamadaPlan(c), ['plan'], '2-plan'],
      ['armador 1', () => A.llamadaArmador(c, 1), ['armador', '1'], '2h-armador-01'],
      ['armador 2', () => A.llamadaArmador(c, 2), ['armador', '2'], '2h-armador-02'],
      ['capítulo 1', () => A.llamadaCapitulo(c, 1), ['capitulo', '1'], '3b-capitulo-01', { PURO: '1' }],
      ['capítulo 2 de nuevo', () => A.llamadaCapitulo(c, 2, { error: c.leer('controles/afuera-cap_2.json') }), ['capitulo', '2'], '3b-capitulo-02', { PURO: '1', ERROR: err('controles/afuera-cap_2.json') }],
      ['resumen cap_1', () => A.llamadaResumen(c, 'cap_1'), ['resumen', 'cap_1'], '3r-resumen-cap_1'],
      ['antes de cerrar', () => A.llamadaAntes(c), ['antes'], '3d-antes-de-cerrar', { PURO: '1' }],
      ['carta', () => A.llamadaCarta(c), ['carta'], '3c-carta', { PURO: '1' }],
      ['primera', () => A.llamadaPrimera(c), ['primera'], '3a-primera', { PURO: '1' }],
      ['primera de nuevo', () => A.llamadaPrimera(c, { error: c.leer('controles/repite-primera_pagina.json') }), ['primera'], '3a-primera', { PURO: '1', ERROR: err('controles/repite-primera_pagina.json') }],
      ['sus frases', () => A.llamadaSusFrases(c), ['sus_frases_llamada'], '3e-sus-frases'],
      ['hechos', () => A.llamadaHechos(c, { repaso: false }), ['hechos'], '4-hechos'],
      ['hechos repaso', () => A.llamadaHechos(c, { repaso: true }), ['hechos', 'repaso'], '4-hechos-repaso'],
      ['veedor', () => A.llamadaVeedor(c), ['veedor'], '5c-veedor'],
      ['arreglo cap_1', () => A.llamadaArreglo(c, 'cap_1'), ['arreglo', 'cap_1'], '6-arreglo-cap_1', { PURO: '1' }],
      ['estilo cap_1', () => A.llamadaEstilo(c, 'cap_1', 1), ['estilo', 'cap_1'], '7-estilo-cap_1'],
      ['estilo cap_1, segunda pasada', () => A.llamadaEstilo(c, 'cap_1', 2), ['estilo', 'cap_1'], '7-estilo-cap_1-2', { RONDA: '2' }],
      ['título 2', () => A.llamadaTitulo(c, 2), ['titulo', '2'], '3t-titulo-02'],
    ];
    for (const [nombre, ts, args, archivo, env] of casos) {
      it(nombre, () => {
        const l = ts();
        if (!l) throw new Error(`${nombre}: no hubo llamada`);
        expect(l.nombre).toBe(archivo);
        expect(A.textoDeLlamada(l)).toBe(delMjs(dir, args, archivo, env));
      });
    }
  });
}

describe('lo que va al modelo', () => {
  it('es el mismo texto, sin partir las líneas largas', () => {
    const l = A.llamadaRegistro(carpetaNelida());
    expect(A.textoParaElModelo(l)).toBe(`${l.docs.join('\n\n')}\n\n${l.instr}`);
  });
  it('sin antes_de_cerrar en el plan no hay llamada', () => {
    const c = carpetaNelida();
    const plan = JSON.parse(c.leer('salidas/plan.json'));
    plan.antes_de_cerrar = { ids: [] };
    c.escribir('salidas/plan.json', JSON.stringify(plan));
    expect(A.llamadaAntes(c)).toBeNull();
  });
});
```

- [ ] **Step 2: Correr el test y ver que falla**

Run: `cd fabrica && npx vitest run test/escritor/llamadas.test.ts`
Expected: FAIL ("Failed to load url ../../src/escritor/llamadas/armar.js").

- [ ] **Step 3: Escribir `llamadas/armar.ts`**

```ts
// fabrica/src/escritor/llamadas/armar.ts
// Arma las llamadas de la receta v5.5 (fabrica/scripts/escritor-v55/llamada.mjs) en modo puro, sobre
// la Carpeta. No escribe archivos: devuelve documentos e instrucciones. Los textos salen de los prompts
// compilados (nunca se escriben acá). Copiado letra por letra; ver la tabla de reemplazos del plan.
import { Carpeta, leerJSON } from '../carpeta.js';
import { decisionesAnteriores } from '../controles/estructura.js';
import { pasados, presentes } from '../controles/texto.js';
import { ficha, idioma, idsDeCapitulo, nombreDePila, piezas, respuestas, salida } from '../lectura.js';
import { esquemaDe, guiaDe, promptsDe } from '../prompts/index.js';
import { marcas, respuestasXML, sinMarcas } from '../texto.js';
import type { Json, PiezaTexto } from '../tipos.js';

export type Llamada = { nombre: string; docs: string[]; instr: string };
type ConError = { error?: string };

const LINEA = /* llamada.mjs:13 */;
export const tag = (t: string, s: string): string => `<${t}>\n${s.trim()}\n</${t}>`;
export const libroComo = (ps: PiezaTexto[]): string => ps.map((p) => `=== ${p.pieza} ===\n${p.texto.trim()}`).join('\n\n');

const registro = (c: Carpeta): Json => leerJSON(c, salida('registro.json'));
const plan = (c: Carpeta): Json => leerJSON(c, salida('plan.json'));
const voz = (c: Carpeta): string => JSON.stringify(registro(c).voz, null, 1);
const base = (c: Carpeta, paso: string): string[] => [LINEA, tag('guia', guiaDe(paso)), tag('ficha', ficha(c)), tag('respuestas', respuestasXML(respuestas(c)))];
const conError = (instr: string, error?: string): string => (error ? `${instr}\n\nTu respuesta anterior no pasó estos controles. Devolvé el JSON completo corregido:\n${error}` : instr);

// ---------- llamada.mjs:53-131, modo puro ----------
// Se copian aR, respuestasEnElTiempo, resumenHastaAca, idsDePieza, golpeTexto y llamadaPura, cada una
// con `c: Carpeta` como primer parámetro (llamadaPura además con `env: { error?: string; armador?: boolean }`):
//   registro() → registro(c) · plan() → plan(c) · voz() → voz(c) · respuestas(dir) → respuestas(c)
//   piezas(dir) → piezas(c) · idsDeCapitulo(dir, n) → idsDeCapitulo(c, n) · nombreDePila(dir) → nombreDePila(c)
//   ficha(dir) → ficha(c) · existe(f) / leer(f) → c.existe(f) / c.leer(f)
//   salida(dir, path.join('resumenes', `${x.pieza}.md`)) → salida(`resumenes/${x.pieza}.md`) (lo mismo con historias/)
//   process.env.ERROR ? … leer(process.env.ERROR) → env.error ? … env.error
//   process.env.ARMADOR → env.armador
function llamadaPura(c: Carpeta, pieza: string, env: { error?: string; armador?: boolean }): { docs: string[]; instr: string } { /* llamada.mjs:93-130 */ }

// ---------- llamada.mjs:133-149: idioma y guardar ----------
const ESCRIBEN = /^(3a-|3b-|3c-|3d-|3t-|6-arreglo-)/;
const CORRIGE = /^7-estilo-/;
function conIdioma(c: Carpeta, nombre: string, instr: string): string { /* llamada.mjs:135-139, con idioma(dir) → idioma(c) */ }
/** Lo que hacía `guardar` antes de escribir: el bloque de idioma al final de las instrucciones. */
const cerrar = (c: Carpeta, nombre: string, docs: string[], instr: string): Llamada => ({ nombre, docs, instr: conIdioma(c, nombre, instr) });
/** llamada.mjs:146: las líneas de más de 400 caracteres se parten en un espacio (era para el lector de archivos de la sesión). */
const partir = (t: string): string => /* llamada.mjs:146, la arrow `partir` */;
export const textoDeLlamada = (l: Llamada): string => partir(`${l.docs.join('\n\n')}\n\n${l.instr}\n`);
export const textoParaElModelo = (l: Llamada): string => `${l.docs.join('\n\n')}\n\n${l.instr}`;

// ---------- los pasos (llamada.mjs:151-281, solo los del modo puro) ----------
export const llamadaRegistro = (c: Carpeta, o: ConError = {}): Llamada =>
  cerrar(c, '1-registro', base(c, 'registro'), conError(promptsDe('### Paso 1')[0] + esquemaDe('### Paso 1'), o.error));

export const llamadaPlan = (c: Carpeta, o: ConError = {}): Llamada =>
  cerrar(c, '2-plan', [...base(c, 'plan'), tag('registro', JSON.stringify(registro(c), null, 1))], conError(promptsDe('### Paso 2 ·')[0] + esquemaDe('### Paso 2 ·'), o.error));

export function llamadaPrimera(c: Carpeta, o: ConError = {}): Llamada {
  const { docs, instr } = llamadaPura(c, 'primera_pagina', { error: o.error });
  return cerrar(c, '3a-primera', docs, instr);
}

export function llamadaCapitulo(c: Carpeta, n: number, o: ConError = {}): Llamada {
  const { docs, instr } = llamadaPura(c, `cap_${n}`, {});
  const aviso = o.error ? /* el template string `aviso` de llamada.mjs:169, con leer(process.env.ERROR) → o.error */ : '';
  return cerrar(c, `3b-capitulo-${String(n).padStart(2, '0')}`, docs, instr + aviso);
}

export function llamadaAntes(c: Carpeta): Llamada | null {
  if (!(plan(c).antes_de_cerrar?.ids || []).length) return null;
  const { docs, instr } = llamadaPura(c, 'antes_de_cerrar', {});
  return cerrar(c, '3d-antes-de-cerrar', docs, instr);
}

export function llamadaCarta(c: Carpeta): Llamada {
  const { docs, instr } = llamadaPura(c, 'carta', {});
  return cerrar(c, '3c-carta', docs, instr);
}

export const llamadaSusFrases = (c: Carpeta): Llamada =>
  cerrar(c, '3e-sus-frases', [tag('voz', voz(c)), tag('respuestas', respuestasXML(respuestas(c)))], promptsDe('### Paso 3e puro')[0]);

export function llamadaEstilo(c: Carpeta, pieza: string, ronda: 1 | 2): Llamada {
  // llamada.mjs:204-208 copiado, con `arg` → `pieza` y `dos` = (ronda === 2); termina en `return cerrar(c, <nombre>, <docs>, <instr>)`
}

export function llamadaTitulo(c: Carpeta, n: number): Llamada {
  // llamada.mjs:213-215 copiado, con `Number(arg)` → `n`
}

export function llamadaArmador(c: Carpeta, n: number): Llamada {
  const { docs, instr } = llamadaPura(c, `cap_${n}`, { armador: true });
  return cerrar(c, `2h-armador-${String(n).padStart(2, '0')}`, docs, instr);
}

export function llamadaResumen(c: Carpeta, pieza: string): Llamada {
  // llamada.mjs:227-229 copiado, con `arg` → `pieza`
}

export function llamadaVeedor(c: Carpeta): Llamada {
  // llamada.mjs:234-235 copiado
}

export function llamadaHechos(c: Carpeta, o: { repaso: boolean }): Llamada {
  // llamada.mjs:240-251 copiado: `arg === 'repaso'` → `o.repaso`;
  // `existe(path.join(dir, 'arreglos', `respuesta-${p.pieza}.txt`))` → `c.existe(`arreglos/respuesta-${p.pieza}.txt`)`;
  // `decisionesAnteriores(dir)` → `decisionesAnteriores(c)`
}

export function llamadaArreglo(c: Carpeta, pieza: string): Llamada {
  // llamada.mjs:268-271 copiado (la rama `if (process.env.PURO)`), con `arg` → `pieza`
}
```

Cada `guardar(nombre, docs, instr)` del original pasa a `return cerrar(c, nombre, docs, instr)`; cada `throw new Error(…)` se copia igual. No se portan `llamadaEscritura`, `lectura`, `cotejo` ni la rama no-pura de `arreglo` (Global Constraints).

- [ ] **Step 4: Correr el test y el tipado**

Run: `cd fabrica && npx vitest run test/escritor/llamadas.test.ts && npx tsc --noEmit -p .`
Expected: PASS (40 casos de llamadas + 2) y tsc sin errores.

- [ ] **Step 5: Commit**

```bash
git add fabrica/src/escritor/llamadas/armar.ts fabrica/test/escritor/llamadas.test.ts
git commit -m "escritor: las llamadas del v5.5 (modo puro) armadas igual que llamada.mjs, también en catalán" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 11: Los pasos de código: «Sus frases» y el libro

**Files:**
- Create: `fabrica/src/escritor/llamadas/codigo.ts`
- Test: `fabrica/test/escritor/libro-md.test.ts`

**Interfaces:**
- Consumes: Tasks 1, 4 (`leerJSON`, `idioma`, `piezas`, `salida`, `sinMarcas`, `titulosFijos`, `tituloValido`, `tituloImpreso`).
- Produces: `susFrasesMd(c: Carpeta): string` (escribe `salidas/sus_frases.md`; devuelve la línea que imprimía), `armarLibro(c: Carpeta): string` (escribe `libro.md` en la raíz de la Carpeta; devuelve la línea que imprimía).

- [ ] **Step 1: Escribir el test que falla**

```ts
// fabrica/test/escritor/libro-md.test.ts
// sus_frases.md y libro.md, igual que `node llamada.mjs <carpeta> sus_frases | libro`.
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { armarLibro, susFrasesMd } from '../../src/escritor/llamadas/codigo.js';
import { aDisco, carpetaNelida, correrMjs } from './ayuda.js';

for (const idiomaFicha of ['', 'Idioma del libro: catalán']) {
  describe(`pasos de código${idiomaFicha ? ' (catalán)' : ''}`, () => {
    it('Sus frases desde sus_frases.json y el libro con títulos del Paso 3t', () => {
      const c = carpetaNelida();
      if (idiomaFicha) c.escribir('entradas/ficha.xml', c.leer('entradas/ficha.xml').replace('</ficha>', `${idiomaFicha}\n</ficha>`));
      c.borrar('salidas/sus_frases.md');
      c.escribir('salidas/titulos/cap_1.json', '{"titulo": "La persiana de madera", "por_que": "x"}');
      c.escribir('salidas/titulos/cap_2.json', '{"titulo": "Años de lucha y sueños", "por_que": "no está en el capítulo: queda el número"}');
      const dir = aDisco(c);
      expect(`${susFrasesMd(c)}\n`).toBe(correrMjs('llamada.mjs', [dir, 'sus_frases']).salida);
      expect(c.leer('salidas/sus_frases.md')).toBe(readFileSync(path.join(dir, 'salidas', 'sus_frases.md'), 'utf8'));
      expect(`${armarLibro(c)}\n`).toBe(correrMjs('llamada.mjs', [dir, 'libro']).salida);
      expect(c.leer('libro.md')).toBe(readFileSync(path.join(dir, 'libro.md'), 'utf8'));
      const titulos = c.leer('libro.md').split('\n').filter((l) => l.startsWith('# '));
      expect(titulos).toEqual(idiomaFicha
        ? ['# sumá vos', '# I · La persiana de madera', '# II', '# Abans de tancar', '# Les seves frases', '# Per als meus']
        : ['# sumá vos', '# I · La persiana de madera', '# II', '# Antes de cerrar', '# Sus frases', '# Para los míos']);
      expect(c.leer('libro.md')).not.toContain('[[R');
    });
  });
}
```

- [ ] **Step 2: Correr el test y ver que falla**

Run: `cd fabrica && npx vitest run test/escritor/libro-md.test.ts`
Expected: FAIL ("Failed to load url ../../src/escritor/llamadas/codigo.js").

- [ ] **Step 3: Escribir `llamadas/codigo.ts`**

```ts
// fabrica/src/escritor/llamadas/codigo.ts
// Los dos pasos de llamada.mjs que no llaman al modelo: Sus frases (líneas 189-200) y el libro (283-311).
import { Carpeta, leerJSON } from '../carpeta.js';
import { idioma, piezas, salida } from '../lectura.js';
import { sinMarcas, tituloImpreso, titulosFijos, tituloValido } from '../texto.js';
import type { Json } from '../tipos.js';

export function susFrasesMd(c: Carpeta): string {
  // llamada.mjs:191-199 copiado con la tabla de reemplazos; cada console.log es el valor que se devuelve
  // (el `break` después de cada uno pasa a `return`).
}

export function armarLibro(c: Carpeta): string {
  // llamada.mjs:284-310 copiado con la tabla de reemplazos; `escribir(path.join(dir, 'libro.md'), …)` →
  // `c.escribir('libro.md', …)`; `process.env.TITULOS` → `false` (no se usa en la fábrica:
  // queda `romano(cap.n) + tit`); el console.log final es el valor que se devuelve.
}
```

(`tituloImpreso` y `Json` quedan importados porque el código copiado los nombra; si al reemplazar `process.env.TITULOS` por `false` `tsc` avisa de código inalcanzable, se deja la expresión `false ? tituloImpreso(cap) : …` tal cual: es el original.)

- [ ] **Step 4: Correr el test y el tipado**

Run: `cd fabrica && npx vitest run test/escritor/libro-md.test.ts && npx tsc --noEmit -p .`
Expected: PASS y tsc sin errores.

- [ ] **Step 5: Commit**

```bash
git add fabrica/src/escritor/llamadas/codigo.ts fabrica/test/escritor/libro-md.test.ts
git commit -m "escritor: Sus frases y libro.md armados por código, igual que llamada.mjs" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 12: Costos (Opus 5.5, el barato, caché y Batch)

**Files:**
- Create: `fabrica/src/escritor/costos.ts`
- Modify: `fabrica/src/costos.ts:49-53` (tabla `PRECIOS_USD_POR_MILLON`)
- Test: `fabrica/test/escritor/costos.test.ts`
- Modify: `fabrica/test/costos.test.ts` (un caso nuevo en `describe('calcularUsd')`)

**Interfaces:**
- Consumes: nada.
- Produces: `type UsoApi = { input_tokens?: number | null; output_tokens?: number | null; cache_creation_input_tokens?: number | null; cache_read_input_tokens?: number | null; cache_creation?: { ephemeral_5m_input_tokens?: number | null; ephemeral_1h_input_tokens?: number | null } | null }`, `PRECIOS_ESCRITOR: Record<string, { input: number; output: number; cacheRead: number }>`, `usdDeLlamada(modelo: string, uso: UsoApi, o: { lote: boolean }): number`.

- [ ] **Step 1: Escribir los tests que fallan**

```ts
// fabrica/test/escritor/costos.test.ts
import { describe, expect, it } from 'vitest';
import { usdDeLlamada } from '../../src/escritor/costos.js';

const M = 1_000_000;
describe('usdDeLlamada', () => {
  it('claude-opus-5-5: 4 entrada, 20 salida, 0,20 caché leída, 5 escritura 5 min, 8 escritura 1 h', () => {
    expect(usdDeLlamada('claude-opus-5-5', { input_tokens: M }, { lote: false })).toBe(4);
    expect(usdDeLlamada('claude-opus-5-5', { output_tokens: M }, { lote: false })).toBe(20);
    expect(usdDeLlamada('claude-opus-5-5', { cache_read_input_tokens: M }, { lote: false })).toBe(0.2);
    expect(usdDeLlamada('claude-opus-5-5', { cache_creation_input_tokens: M }, { lote: false })).toBe(5);
    expect(usdDeLlamada('claude-opus-5-5', { cache_creation_input_tokens: 2 * M, cache_creation: { ephemeral_5m_input_tokens: M, ephemeral_1h_input_tokens: M } }, { lote: false })).toBe(13);
  });
  it('claude-sonnet-5-5 (el barato): 2 y 10', () => {
    expect(usdDeLlamada('claude-sonnet-5-5', { input_tokens: M, output_tokens: M }, { lote: false })).toBe(12);
  });
  it('Batch cobra la mitad de todo', () => {
    expect(usdDeLlamada('claude-opus-5-5', { input_tokens: M, output_tokens: M, cache_read_input_tokens: M }, { lote: true })).toBe(12.1);
  });
  it('un modelo sin precio no vale 0: corta (el tope de gasto depende de esto)', () => {
    expect(() => usdDeLlamada('claude-desconocido', { input_tokens: 1 }, { lote: false })).toThrow(/no hay precio/);
  });
});
```

En `fabrica/test/costos.test.ts`, dentro de `describe('calcularUsd', …)`, agregar:

```ts
  it('claude-opus-5-5: 4/20 (cache write 5, cache read 0,2); antes cobraba como opus-5 por prefijo', () => {
    expect(calcularUsd('claude-opus-5-5', { input_tokens: 1_000_000, output_tokens: 1_000_000, cache_creation_input_tokens: 1_000_000, cache_read_input_tokens: 1_000_000 })).toBe(29.2);
  });
  it('claude-sonnet-5-5: 2/10 (cache write 2,5, cache read 0,2)', () => {
    expect(calcularUsd('claude-sonnet-5-5', { input_tokens: 1_000_000, output_tokens: 1_000_000, cache_creation_input_tokens: 1_000_000, cache_read_input_tokens: 1_000_000 })).toBe(14.7);
  });
```

- [ ] **Step 2: Correr los tests y ver que fallan**

Run: `cd fabrica && npx vitest run test/escritor/costos.test.ts test/costos.test.ts`
Expected: FAIL (el módulo nuevo no existe; `claude-opus-5-5` da 31,25 porque cobra como `claude-opus-5`).

- [ ] **Step 3: Escribir `escritor/costos.ts` y sumar los precios a `src/costos.ts`**

```ts
// fabrica/src/escritor/costos.ts
// Cuánto cuesta cada llamada del escritor (decisión 7 del spec: "un dólar es un dólar").
// USD por millón de tokens (skill claude-api, 25/09/2026). Escritura de caché: 1,25× la entrada
// (5 minutos) o 2× (1 hora). Lectura de caché: el precio de la tabla. Batch: la mitad de todo.
// Un modelo sin precio tira: con 0 el tope de gasto no frenaría nada.

export type UsoApi = {
  input_tokens?: number | null;
  output_tokens?: number | null;
  cache_creation_input_tokens?: number | null;
  cache_read_input_tokens?: number | null;
  cache_creation?: { ephemeral_5m_input_tokens?: number | null; ephemeral_1h_input_tokens?: number | null } | null;
};

export const PRECIOS_ESCRITOR: Record<string, { input: number; output: number; cacheRead: number }> = {
  'claude-opus-5-5': { input: 4, output: 20, cacheRead: 0.2 },
  'claude-sonnet-5-5': { input: 2, output: 10, cacheRead: 0.2 },
};

const t = (v: number | null | undefined): number => (typeof v === 'number' && Number.isFinite(v) ? v : 0);

export function usdDeLlamada(modelo: string, uso: UsoApi, o: { lote: boolean }): number {
  const p = PRECIOS_ESCRITOR[modelo];
  if (!p) throw new Error(`costos del escritor: no hay precio para ${modelo}`);
  const unaHora = t(uso.cache_creation?.ephemeral_1h_input_tokens);
  const cincoMin = uso.cache_creation ? t(uso.cache_creation.ephemeral_5m_input_tokens) : t(uso.cache_creation_input_tokens);
  const porMillon = t(uso.input_tokens) * p.input + t(uso.output_tokens) * p.output + cincoMin * p.input * 1.25 + unaHora * p.input * 2 + t(uso.cache_read_input_tokens) * p.cacheRead;
  return Math.round((porMillon / 1_000_000) * (o.lote ? 0.5 : 1) * 1e6) / 1e6;
}
```

En `fabrica/src/costos.ts`, en `PRECIOS_USD_POR_MILLON`, agregar después de `'claude-opus-5'`:

```ts
  'claude-opus-5-5': { input: 4, output: 20, cache_write: 5, cache_read: 0.2 },
  'claude-sonnet-5-5': { input: 2, output: 10, cache_write: 2.5, cache_read: 0.2 },
```

(La búsqueda por nombre exacto va primero, así `claude-opus-5-5` deja de caer en el prefijo de `claude-opus-5`.)

- [ ] **Step 4: Correr los tests y el tipado**

Run: `cd fabrica && npx vitest run test/escritor/costos.test.ts test/costos.test.ts && npx tsc --noEmit -p .`
Expected: PASS y tsc sin errores.

- [ ] **Step 5: Commit**

```bash
git add fabrica/src/escritor/costos.ts fabrica/src/costos.ts fabrica/test/escritor/costos.test.ts fabrica/test/costos.test.ts
git commit -m "costos: precio de Opus 5.5 y Sonnet 5.5 (Opus 5.5 se cobraba como Opus 5), y el costo del escritor con caché y Batch" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 13: El almacén de checkpoints (memoria, disco, Supabase Storage)

**Files:**
- Create: `fabrica/src/escritor/almacen/tipos.ts`
- Create: `fabrica/src/escritor/almacen/memoria.ts`
- Create: `fabrica/src/escritor/almacen/disco.ts`
- Create: `fabrica/src/escritor/almacen/supabase.ts`
- Test: `fabrica/test/escritor/almacen.test.ts`

**Interfaces:**
- Consumes: `descargarTextoOpcional`, `subirTexto` de `fabrica/src/libro/comun.ts`; `obtenerClienteDb` (tipo) de `fabrica/src/db.ts`.
- Produces: `interface Almacen { leer(ruta: string): Promise<string | null>; escribir(ruta: string, texto: string): Promise<void> }`, `class AlmacenMemoria implements Almacen { readonly archivos: Map<string, string> }`, `class AlmacenDisco implements Almacen { constructor(raiz: string) }`, `class AlmacenSupabase implements Almacen { constructor(db: ReturnType<typeof obtenerClienteDb>, prefijo: string) }` (bucket `audios`, rutas `<prefijo>/<ruta>`).

- [ ] **Step 1: Escribir el test que falla**

```ts
// fabrica/test/escritor/almacen.test.ts
import { mkdtempSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { AlmacenDisco } from '../../src/escritor/almacen/disco.js';
import { AlmacenMemoria } from '../../src/escritor/almacen/memoria.js';
import { AlmacenSupabase } from '../../src/escritor/almacen/supabase.js';
import type { Almacen } from '../../src/escritor/almacen/tipos.js';

async function contrato(a: Almacen): Promise<void> {
  expect(await a.leer('pasos/C/3b-capitulo-01.json')).toBeNull();
  await a.escribir('pasos/C/3b-capitulo-01.json', '{"texto": "hola"}');
  expect(await a.leer('pasos/C/3b-capitulo-01.json')).toBe('{"texto": "hola"}');
  await a.escribir('pasos/C/3b-capitulo-01.json', '{"texto": "chau"}');
  expect(await a.leer('pasos/C/3b-capitulo-01.json')).toBe('{"texto": "chau"}');
}

describe('almacén', () => {
  it('en memoria', async () => contrato(new AlmacenMemoria()));

  it('en disco, con subcarpetas', async () => {
    const raiz = mkdtempSync(path.join(tmpdir(), 'almacen-'));
    await contrato(new AlmacenDisco(raiz));
    expect(readFileSync(path.join(raiz, 'pasos', 'C', '3b-capitulo-01.json'), 'utf8')).toBe('{"texto": "chau"}');
  });

  it('en Supabase Storage (bucket audios, con prefijo del narrador; "no existe" es null)', async () => {
    const archivos = new Map<string, string>();
    const subidas: { ruta: string; contentType?: string }[] = [];
    const db = {
      storage: {
        from: (bucket: string) => {
          expect(bucket).toBe('audios');
          return {
            download: async (ruta: string) => (archivos.has(ruta) ? { data: new Blob([archivos.get(ruta) as string]), error: null } : { data: null, error: { message: 'Object not found' } }),
            upload: async (ruta: string, contenido: string, o: { contentType?: string }) => { archivos.set(ruta, contenido); subidas.push({ ruta, contentType: o.contentType }); return { error: null }; },
          };
        },
      },
    };
    await contrato(new AlmacenSupabase(db as never, 'nar-1/escritor'));
    expect(subidas[0]).toEqual({ ruta: 'nar-1/escritor/pasos/C/3b-capitulo-01.json', contentType: 'application/json' });
  });
});
```

- [ ] **Step 2: Correr el test y ver que falla**

Run: `cd fabrica && npx vitest run test/escritor/almacen.test.ts`
Expected: FAIL ("Failed to load url ../../src/escritor/almacen/disco.js").

- [ ] **Step 3: Escribir los cuatro archivos**

```ts
// fabrica/src/escritor/almacen/tipos.ts
// Dónde quedan los checkpoints del escritor (cada respuesta del modelo, los lotes, las carpetas por etapa,
// el libro, el informe y los costos). `leer` devuelve null si no existe; cualquier otro fallo tira.
export interface Almacen {
  leer(ruta: string): Promise<string | null>;
  escribir(ruta: string, texto: string): Promise<void>;
}
```

```ts
// fabrica/src/escritor/almacen/memoria.ts
import type { Almacen } from './tipos.js';

/** Para los tests: los archivos quedan a la vista en `archivos`. */
export class AlmacenMemoria implements Almacen {
  readonly archivos = new Map<string, string>();
  async leer(ruta: string): Promise<string | null> {
    return this.archivos.get(ruta) ?? null;
  }
  async escribir(ruta: string, texto: string): Promise<void> {
    this.archivos.set(ruta, texto);
  }
}
```

```ts
// fabrica/src/escritor/almacen/disco.ts
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import type { Almacen } from './tipos.js';

/** Para correr local (scripts/escritor-correr.ts): una carpeta del disco. */
export class AlmacenDisco implements Almacen {
  constructor(private readonly raiz: string) {}
  async leer(ruta: string): Promise<string | null> {
    const p = path.join(this.raiz, ruta);
    return existsSync(p) ? readFileSync(p, 'utf8') : null;
  }
  async escribir(ruta: string, texto: string): Promise<void> {
    const p = path.join(this.raiz, ruta);
    mkdirSync(path.dirname(p), { recursive: true });
    writeFileSync(p, texto, 'utf8');
  }
}
```

```ts
// fabrica/src/escritor/almacen/supabase.ts
// Producción: Supabase Storage, bucket `audios`, bajo un prefijo por narrador (p. ej. `<narradorId>/escritor`).
// Usa los mismos ayudantes que los checkpoints de borrador del libro (sin caché del bucket).
import type { obtenerClienteDb } from '../../db.js';
import { descargarTextoOpcional, subirTexto } from '../../libro/comun.js';
import type { Almacen } from './tipos.js';

export class AlmacenSupabase implements Almacen {
  constructor(private readonly db: ReturnType<typeof obtenerClienteDb>, private readonly prefijo: string) {}
  leer(ruta: string): Promise<string | null> {
    return descargarTextoOpcional(this.db, `${this.prefijo}/${ruta}`);
  }
  escribir(ruta: string, texto: string): Promise<void> {
    return subirTexto(this.db, `${this.prefijo}/${ruta}`, texto, ruta.endsWith('.json') ? 'application/json' : 'text/markdown');
  }
}
```

- [ ] **Step 4: Correr el test y el tipado**

Run: `cd fabrica && npx vitest run test/escritor/almacen.test.ts && npx tsc --noEmit -p .`
Expected: PASS y tsc sin errores.

- [ ] **Step 5: Commit**

```bash
git add fabrica/src/escritor/almacen fabrica/test/escritor/almacen.test.ts
git commit -m "escritor: almacén de checkpoints en memoria, disco y Supabase Storage" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 14: El modelo: pedido con caché, cliente Anthropic y modelo falso

**Files:**
- Create: `fabrica/src/escritor/modelo/tipos.ts`
- Create: `fabrica/src/escritor/modelo/pedido.ts`
- Create: `fabrica/src/escritor/modelo/anthropic.ts`
- Create: `fabrica/src/escritor/modelo/falso.ts`
- Test: `fabrica/test/escritor/modelo.test.ts`

**Interfaces:**
- Consumes: `Llamada` (Task 10), `UsoApi` (Task 12), `extraerTexto` de `fabrica/src/libro/comun.ts`.
- Produces:
  - `type Esfuerzo = 'low' | 'medium' | 'high' | 'xhigh' | 'max'`
  - `type PedidoModelo = { clave: string; modelo: string; bloques: string[]; cacheEn: number[]; maxTokens: number; esfuerzo: Esfuerzo }`
  - `type RespuestaModelo = { texto: string; uso: UsoApi; motivoFin: string }`
  - `class ErrorDelModelo extends Error { readonly reintentable: boolean }`
  - `interface Modelo { llamar(p: PedidoModelo): Promise<RespuestaModelo> }`
  - `type ResultadoLote = { clave: string; ok: true; respuesta: RespuestaModelo } | { clave: string; ok: false; error: string }`, `interface Lote { enviar(grupo: string, pedidos: PedidoModelo[]): Promise<ResultadoLote[]> }`
  - `bloquesDeLlamada(l: Llamada): string[]`, `puntosDeCache(nombre: string, docs: string[]): number[]`, `armarParams(p: PedidoModelo): Record<string, unknown>`
  - `type MensajeApi = { content: Array<{ type: string; text?: string }>; usage: UsoApi; stop_reason: string | null }`, `type ClienteMensajes = { messages: { stream(params: Record<string, unknown>): { finalMessage(): Promise<MensajeApi> } } }`, `aRespuesta(m: MensajeApi): RespuestaModelo`, `esReintentable(err: unknown): boolean`, `class ModeloAnthropic implements Modelo { constructor(cliente: ClienteMensajes) }`
  - `claveBase(clave: string): string`, `class ModeloFalso implements Modelo { constructor(salidas: Record<string, string>, defectos?: [string, string][], uso?: UsoApi); readonly llamadas: PedidoModelo[] }`, `class LoteFalso implements Lote { constructor(modelo: Modelo, falla?: Set<string>); readonly grupos: string[] }`

Parámetros de la API que se usan (de la skill claude-api; **verificar en la Task 25**, primera llamada real, que no vuelvan 400): `model`, `max_tokens`, `thinking: { type: 'adaptive' }`, `output_config: { effort }` (el SDK 0.71.2 no lo tiene en sus tipos: va en el cuerpo igual, por eso `armarParams` devuelve `Record<string, unknown>`), `messages[].content[]` con bloques `{ type: 'text', text, cache_control: { type: 'ephemeral' } }` (máximo 4 marcas; prefijo mínimo cacheable de Opus 5.5: 512 tokens), `stop_reason` (`'refusal'`, `'max_tokens'`, `'end_turn'`), `usage.cache_creation_input_tokens`, `usage.cache_read_input_tokens`, `usage.cache_creation.ephemeral_1h_input_tokens`.

- [ ] **Step 1: Escribir el test que falla**

```ts
// fabrica/test/escritor/modelo.test.ts
import { describe, expect, it } from 'vitest';
import { aRespuesta, esReintentable, ModeloAnthropic, type MensajeApi } from '../../src/escritor/modelo/anthropic.js';
import { claveBase, LoteFalso, ModeloFalso } from '../../src/escritor/modelo/falso.js';
import { armarParams, puntosDeCache } from '../../src/escritor/modelo/pedido.js';
import { ErrorDelModelo, type PedidoModelo } from '../../src/escritor/modelo/tipos.js';

const pedido = (clave = 'C/3b-capitulo-01'): PedidoModelo => ({ clave, modelo: 'claude-opus-5-5', bloques: ['<ficha>\nf\n</ficha>', '<voz>\nv\n</voz>', 'Escribí.'], cacheEn: [1], maxTokens: 64000, esfuerzo: 'xhigh' });

describe('pedido', () => {
  it('cada documento es un bloque de texto; la caché va donde se marca; pensamiento adaptativo y esfuerzo', () => {
    expect(armarParams(pedido())).toEqual({
      model: 'claude-opus-5-5',
      max_tokens: 64000,
      thinking: { type: 'adaptive' },
      output_config: { effort: 'xhigh' },
      messages: [{ role: 'user', content: [
        { type: 'text', text: '<ficha>\nf\n</ficha>\n\n' },
        { type: 'text', text: '<voz>\nv\n</voz>\n\n', cache_control: { type: 'ephemeral' } },
        { type: 'text', text: 'Escribí.' },
      ] }],
    });
  });

  it('la caché se marca en lo que se repite entre llamadas', () => {
    const puro = ['<ficha>\nf\n</ficha>', '<voz>\nv\n</voz>', '<respuestas>\nr\n</respuestas>'];
    expect(puntosDeCache('3b-capitulo-01', puro)).toEqual([1]);
    expect(puntosDeCache('7-estilo-cap_1-2', [...puro.slice(0, 2), '<pieza>\np\n</pieza>'])).toEqual([1]);
    expect(puntosDeCache('6-arreglo-cap_1', puro)).toEqual([1]);
    expect(puntosDeCache('2h-armador-01', ['<respuestas>\nr\n</respuestas>'])).toEqual([]);
    expect(puntosDeCache('1-registro', ['l', 'g', 'f', 'r'])).toEqual([3]);
    expect(puntosDeCache('2-plan', ['l', 'g', 'f', 'r', 'reg'])).toEqual([4]);
    expect(puntosDeCache('4-hechos', ['l', 'g', 'f', 'r', 'reg', 'lib', 'pres', 'pas'])).toEqual([4, 7]);
    expect(puntosDeCache('4-hechos-repaso', ['l', 'g', 'f', 'r', 'reg', 'lib', 'pres', 'pas', 'dec'])).toEqual([4]);
    expect(puntosDeCache('disputa-cap_1-1', ['l', 'g', 'f', 'r', 'reg', 'lib', 'pres', 'pas'])).toEqual([4, 7]);
    expect(puntosDeCache('3t-titulo-01', ['<capitulo>\nc\n</capitulo>'])).toEqual([]);
  });
});

describe('ModeloAnthropic', () => {
  const mensaje = (m: Partial<MensajeApi>): MensajeApi => ({ content: [{ type: 'thinking' }, { type: 'text', text: 'el capítulo' }], usage: { input_tokens: 10, output_tokens: 5 }, stop_reason: 'end_turn', ...m });

  it('manda los params armados por streaming y devuelve el texto (sin el pensamiento) y el uso', async () => {
    let enviado: Record<string, unknown> | null = null;
    const m = new ModeloAnthropic({ messages: { stream: (p) => { enviado = p; return { finalMessage: async () => mensaje({}) }; } } });
    const r = await m.llamar(pedido());
    expect(enviado).toEqual(armarParams(pedido()));
    expect(r).toEqual({ texto: 'el capítulo', uso: { input_tokens: 10, output_tokens: 5 }, motivoFin: 'end_turn' });
  });

  it('un rechazo no se reintenta; un corte por max_tokens sí', () => {
    expect(() => aRespuesta(mensaje({ stop_reason: 'refusal' }))).toThrow(ErrorDelModelo);
    try { aRespuesta(mensaje({ stop_reason: 'refusal' })); } catch (e) { expect((e as ErrorDelModelo).reintentable).toBe(false); }
    try { aRespuesta(mensaje({ stop_reason: 'max_tokens' })); } catch (e) { expect((e as ErrorDelModelo).reintentable).toBe(true); }
  });

  it('red, 429, 529 y 5xx se reintentan; 400 no', async () => {
    expect(esReintentable(Object.assign(new Error('x'), { status: 529 }))).toBe(true);
    expect(esReintentable(Object.assign(new Error('x'), { status: 429 }))).toBe(true);
    expect(esReintentable(Object.assign(new Error('x'), { status: 500 }))).toBe(true);
    expect(esReintentable(Object.assign(new Error('x'), { name: 'APIConnectionError' }))).toBe(true);
    expect(esReintentable(Object.assign(new Error('x'), { status: 400 }))).toBe(false);
    const m = new ModeloAnthropic({ messages: { stream: () => ({ finalMessage: async () => { throw Object.assign(new Error('overloaded'), { status: 529 }); } }) } });
    await expect(m.llamar(pedido())).rejects.toMatchObject({ reintentable: true });
  });
});

describe('modelo falso', () => {
  it('busca por clave sin etapa, después por clave base, después por prefijo; anota cada pedido', async () => {
    expect(claveBase('B/1-registro#2')).toBe('1-registro');
    const f = new ModeloFalso({ '1-registro': 'malo', '1-registro#2': 'bueno' }, [['7-estilo-', '{"cambios": []}']]);
    expect((await f.llamar(pedido('A/1-registro'))).texto).toBe('malo');
    expect((await f.llamar(pedido('A/1-registro#2'))).texto).toBe('bueno');
    expect((await f.llamar(pedido('A/1-registro#3'))).texto).toBe('malo');
    expect((await f.llamar(pedido('C/7-estilo-cap_1-2'))).texto).toBe('{"cambios": []}');
    await expect(f.llamar(pedido('C/nada'))).rejects.toThrow(/no tiene respuesta para C\/nada/);
    expect(f.llamadas.map((p) => p.clave)).toEqual(['A/1-registro', 'A/1-registro#2', 'A/1-registro#3', 'C/7-estilo-cap_1-2', 'C/nada']);
  });

  it('el lote falso responde con su modelo y hace fallar lo que se le pide', async () => {
    const lote = new LoteFalso(new ModeloFalso({ '7-estilo-cap_1': 'a', '7-estilo-cap_2': 'b' }), new Set(['7-estilo-cap_2']));
    const r = await lote.enviar('C-estilo-1', [pedido('C/7-estilo-cap_1'), pedido('C/7-estilo-cap_2')]);
    expect(r).toEqual([
      { clave: 'C/7-estilo-cap_1', ok: true, respuesta: { texto: 'a', uso: { input_tokens: 1000, output_tokens: 100 }, motivoFin: 'end_turn' } },
      { clave: 'C/7-estilo-cap_2', ok: false, error: 'errored' },
    ]);
    expect(lote.grupos).toEqual(['C-estilo-1']);
  });
});
```

- [ ] **Step 2: Correr el test y ver que falla**

Run: `cd fabrica && npx vitest run test/escritor/modelo.test.ts`
Expected: FAIL ("Failed to load url ../../src/escritor/modelo/anthropic.js").

- [ ] **Step 3: Escribir los cuatro archivos**

```ts
// fabrica/src/escritor/modelo/tipos.ts
import type { UsoApi } from '../costos.js';

export type Esfuerzo = 'low' | 'medium' | 'high' | 'xhigh' | 'max';
/** Un pedido al modelo: `bloques` = los documentos de la llamada y, al final, las instrucciones. */
export type PedidoModelo = { clave: string; modelo: string; bloques: string[]; cacheEn: number[]; maxTokens: number; esfuerzo: Esfuerzo };
export type RespuestaModelo = { texto: string; uso: UsoApi; motivoFin: string };

export class ErrorDelModelo extends Error {
  constructor(mensaje: string, readonly reintentable: boolean) {
    super(mensaje);
    this.name = 'ErrorDelModelo';
  }
}

export interface Modelo {
  llamar(p: PedidoModelo): Promise<RespuestaModelo>;
}

export type ResultadoLote = { clave: string; ok: true; respuesta: RespuestaModelo } | { clave: string; ok: false; error: string };
export interface Lote {
  enviar(grupo: string, pedidos: PedidoModelo[]): Promise<ResultadoLote[]>;
}
```

```ts
// fabrica/src/escritor/modelo/pedido.ts
// Cómo se le manda una llamada a la API. Los documentos van en el orden de la receta (sección 2:
// "lo que se repite queda en caché") y la caché se marca al final de lo que comparten varias llamadas.
// El texto que lee el modelo es el de textoParaElModelo(llamada): cada documento seguido de "\n\n".
import type { Llamada } from '../llamadas/armar.js';
import type { PedidoModelo } from './tipos.js';

export const bloquesDeLlamada = (l: Llamada): string[] => [...l.docs, l.instr];

/**
 * Índices de `docs` donde termina un prefijo que otra llamada repite:
 * - las piezas del novelista, el arreglo y el corrector arrancan con <ficha> y <voz> (iguales en ~40 llamadas por libro);
 * - el registro y el plan: entero (lo reusan sus reintentos, que solo cambian las instrucciones);
 * - los hechos: hasta <registro> (lo reusa el repaso) y entero (lo reusan las disputas, que llevan los mismos documentos).
 */
export function puntosDeCache(nombre: string, docs: string[]): number[] {
  if (/^(3a-|3b-|3c-|3d-|6-arreglo-|7-estilo-)/.test(nombre)) return docs[0]?.startsWith('<ficha>') && docs[1]?.startsWith('<voz>') ? [1] : [];
  if (nombre === '1-registro' || nombre === '2-plan') return [docs.length - 1];
  if (nombre === '4-hechos' || nombre.startsWith('disputa-')) return [4, docs.length - 1];
  if (nombre === '4-hechos-repaso') return [4];
  return [];
}

export function armarParams(p: PedidoModelo): Record<string, unknown> {
  const content = p.bloques.map((texto, i) => ({
    type: 'text',
    text: i < p.bloques.length - 1 ? `${texto}\n\n` : texto,
    ...(p.cacheEn.includes(i) ? { cache_control: { type: 'ephemeral' } } : {}),
  }));
  return { model: p.modelo, max_tokens: p.maxTokens, thinking: { type: 'adaptive' }, output_config: { effort: p.esfuerzo }, messages: [{ role: 'user', content }] };
}
```

```ts
// fabrica/src/escritor/modelo/anthropic.ts
// Una llamada a la API de Anthropic, con streaming (las respuestas largas no cortan por tiempo).
// En producción: new ModeloAnthropic(new Anthropic() as unknown as ClienteMensajes). Los tipos propios
// existen porque el SDK 0.71.2 no tipa `output_config`; el cuerpo se manda igual.
import type { UsoApi } from '../costos.js';
import { extraerTexto } from '../../libro/comun.js';
import { ErrorDelModelo, type Modelo, type PedidoModelo, type RespuestaModelo } from './tipos.js';
import { armarParams } from './pedido.js';

export type MensajeApi = { content: Array<{ type: string; text?: string }>; usage: UsoApi; stop_reason: string | null };
export type ClienteMensajes = { messages: { stream(params: Record<string, unknown>): { finalMessage(): Promise<MensajeApi> } } };

export function aRespuesta(m: MensajeApi): RespuestaModelo {
  if (m.stop_reason === 'refusal') throw new ErrorDelModelo('el modelo rechazó el pedido (refusal)', false);
  if (m.stop_reason === 'max_tokens') throw new ErrorDelModelo('la respuesta se cortó por max_tokens', true);
  return { texto: extraerTexto(m.content), uso: m.usage, motivoFin: m.stop_reason ?? '' };
}

export function esReintentable(err: unknown): boolean {
  const e = err as { status?: unknown; name?: unknown } | null;
  if (e && (e.name === 'APIConnectionError' || e.name === 'APIConnectionTimeoutError')) return true;
  const s = e?.status;
  return typeof s === 'number' && (s === 408 || s === 409 || s === 429 || s >= 500);
}

export class ModeloAnthropic implements Modelo {
  constructor(private readonly cliente: ClienteMensajes) {}
  async llamar(p: PedidoModelo): Promise<RespuestaModelo> {
    let m: MensajeApi;
    try {
      m = await this.cliente.messages.stream(armarParams(p)).finalMessage();
    } catch (err) {
      throw new ErrorDelModelo(`API (${p.clave}): ${(err as Error).message}`, esReintentable(err));
    }
    return aRespuesta(m);
  }
}
```

```ts
// fabrica/src/escritor/modelo/falso.ts
// El modelo falso de los tests: devuelve respuestas guardadas (las de Nélida, o las de la corrida real
// del libro de Joaquín). Busca por la clave sin etapa ("1-registro#2"), después por la base
// ("1-registro") y después por prefijo ("7-estilo-").
import type { UsoApi } from '../costos.js';
import { ErrorDelModelo, type Lote, type Modelo, type PedidoModelo, type RespuestaModelo, type ResultadoLote } from './tipos.js';

export const claveBase = (clave: string): string => clave.replace(/^[ABC]\//, '').replace(/#.*$/, '');

export class ModeloFalso implements Modelo {
  readonly llamadas: PedidoModelo[] = [];
  constructor(
    private readonly salidas: Record<string, string>,
    private readonly defectos: [string, string][] = [],
    private readonly uso: UsoApi = { input_tokens: 1000, output_tokens: 100 },
  ) {}
  async llamar(p: PedidoModelo): Promise<RespuestaModelo> {
    this.llamadas.push(p);
    const sinEtapa = p.clave.replace(/^[ABC]\//, '');
    const base = claveBase(p.clave);
    const texto = this.salidas[sinEtapa] ?? this.salidas[base] ?? this.defectos.find(([pre]) => base.startsWith(pre))?.[1];
    if (texto === undefined) throw new ErrorDelModelo(`el modelo falso no tiene respuesta para ${p.clave}`, false);
    return { texto, uso: this.uso, motivoFin: 'end_turn' };
  }
}

export class LoteFalso implements Lote {
  readonly grupos: string[] = [];
  constructor(private readonly modelo: Modelo, private readonly falla: Set<string> = new Set()) {}
  async enviar(grupo: string, pedidos: PedidoModelo[]): Promise<ResultadoLote[]> {
    this.grupos.push(grupo);
    const out: ResultadoLote[] = [];
    for (const p of pedidos) {
      if (this.falla.has(claveBase(p.clave))) out.push({ clave: p.clave, ok: false, error: 'errored' });
      else out.push({ clave: p.clave, ok: true, respuesta: await this.modelo.llamar(p) });
    }
    return out;
  }
}
```

- [ ] **Step 4: Correr el test y el tipado**

Run: `cd fabrica && npx vitest run test/escritor/modelo.test.ts && npx tsc --noEmit -p .`
Expected: PASS y tsc sin errores.

- [ ] **Step 5: Commit**

```bash
git add fabrica/src/escritor/modelo/tipos.ts fabrica/src/escritor/modelo/pedido.ts fabrica/src/escritor/modelo/anthropic.ts fabrica/src/escritor/modelo/falso.ts fabrica/test/escritor/modelo.test.ts
git commit -m "escritor: pedido con caché de prompts, cliente Anthropic por streaming y modelo falso" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---
### Task 15: Batch (Message Batches) con checkpoint del lote

**Files:**
- Create: `fabrica/src/escritor/modelo/lote-anthropic.ts`
- Test: `fabrica/test/escritor/lote.test.ts`

**Interfaces:**
- Consumes: `Almacen`, `AlmacenMemoria` (Task 13); `armarParams` (Task 14); `aRespuesta`, `MensajeApi` (Task 14); `Lote`, `PedidoModelo`, `ResultadoLote` (Task 14).
- Produces: `type ResultadoApi = { custom_id: string; result: { type: string; message?: MensajeApi; error?: { error?: { message?: string } } } }`, `type ClienteLotes = { messages: { batches: { create(b: { requests: { custom_id: string; params: Record<string, unknown> }[] }): Promise<{ id: string }>; retrieve(id: string): Promise<{ processing_status: string }>; results(id: string): Promise<AsyncIterable<ResultadoApi>> } } }`, `class LoteAnthropic implements Lote { constructor(cliente: ClienteLotes, almacen: Almacen, o?: { esperar?: (ms: number) => Promise<void>; cadaMs?: number }) }`. Guarda `lotes/<grupo>.json` = `{ id, claves }`.

API usada (skill claude-api, `typescript/claude-api/batches.md`; **verificar en la Task 25**): `client.messages.batches.create({ requests: [{ custom_id, params }] })`, `client.messages.batches.retrieve(id).processing_status === 'ended'`, `for await (const r of await client.messages.batches.results(id))` con `r.custom_id` y `r.result.type` ∈ `succeeded | errored | canceled | expired`. Los resultados llegan en cualquier orden: se ubican por `custom_id` (`p0`, `p1`…; formato permitido `^[a-zA-Z0-9_-]{1,64}$`, por eso no se usa la clave, que tiene `/` y `#`). Batch cobra la mitad; el parámetro `fallbacks` no se acepta en Batch (no se usa en ningún lado).

- [ ] **Step 1: Escribir el test que falla**

```ts
// fabrica/test/escritor/lote.test.ts
import { describe, expect, it } from 'vitest';
import { AlmacenMemoria } from '../../src/escritor/almacen/memoria.js';
import { LoteAnthropic, type ClienteLotes, type ResultadoApi } from '../../src/escritor/modelo/lote-anthropic.js';
import { armarParams } from '../../src/escritor/modelo/pedido.js';
import type { PedidoModelo } from '../../src/escritor/modelo/tipos.js';

const pedido = (clave: string): PedidoModelo => ({ clave, modelo: 'claude-opus-5-5', bloques: ['<ficha>\nf\n</ficha>', 'Corregí.'], cacheEn: [], maxTokens: 64000, esfuerzo: 'xhigh' });
const ok = (custom_id: string, text: string): ResultadoApi => ({ custom_id, result: { type: 'succeeded', message: { content: [{ type: 'text', text }], usage: { input_tokens: 10, output_tokens: 2 }, stop_reason: 'end_turn' } } });

function clienteFalso(estados: string[], resultados: ResultadoApi[]) {
  const vistos = { creados: [] as { custom_id: string; params: Record<string, unknown> }[][], consultas: 0 };
  const cliente: ClienteLotes = {
    messages: {
      batches: {
        create: async (b) => { vistos.creados.push(b.requests); return { id: 'msgbatch_1' }; },
        retrieve: async () => ({ processing_status: estados[Math.min(vistos.consultas++, estados.length - 1)] }),
        results: async () => (async function* () { for (const r of resultados) yield r; })(),
      },
    },
  };
  return { cliente, vistos };
}

describe('LoteAnthropic', () => {
  it('manda un pedido por clave, espera a que termine y ubica cada resultado por custom_id', async () => {
    const almacen = new AlmacenMemoria();
    const esperas: number[] = [];
    const { cliente, vistos } = clienteFalso(['in_progress', 'ended'], [
      { custom_id: 'p1', result: { type: 'errored', error: { error: { message: 'overloaded' } } } },
      ok('p0', '{"cambios": []}'),
    ]);
    const lote = new LoteAnthropic(cliente, almacen, { esperar: async (ms) => { esperas.push(ms); }, cadaMs: 7 });
    const r = await lote.enviar('C-estilo-1', [pedido('C/7-estilo-cap_1'), pedido('C/7-estilo-cap_2')]);
    expect(vistos.creados[0]).toEqual([{ custom_id: 'p0', params: armarParams(pedido('C/7-estilo-cap_1')) }, { custom_id: 'p1', params: armarParams(pedido('C/7-estilo-cap_2')) }]);
    expect(esperas).toEqual([7]);
    expect(r).toEqual([
      { clave: 'C/7-estilo-cap_1', ok: true, respuesta: { texto: '{"cambios": []}', uso: { input_tokens: 10, output_tokens: 2 }, motivoFin: 'end_turn' } },
      { clave: 'C/7-estilo-cap_2', ok: false, error: 'overloaded' },
    ]);
    expect(JSON.parse((await almacen.leer('lotes/C-estilo-1.json')) as string)).toEqual({ id: 'msgbatch_1', claves: ['C/7-estilo-cap_1', 'C/7-estilo-cap_2'] });
  });

  it('si se cortó con el lote ya mandado, no lo manda de nuevo: retoma el mismo', async () => {
    const almacen = new AlmacenMemoria();
    await almacen.escribir('lotes/C-titulos.json', JSON.stringify({ id: 'msgbatch_viejo', claves: ['C/3t-titulo-01'] }));
    const { cliente, vistos } = clienteFalso(['ended'], [ok('p0', '{"titulo": "x"}')]);
    const r = await new LoteAnthropic(cliente, almacen).enviar('C-titulos', [pedido('C/3t-titulo-01')]);
    expect(vistos.creados).toHaveLength(0);
    expect(r[0]).toMatchObject({ clave: 'C/3t-titulo-01', ok: true });
  });

  it('un resultado que falta o un rechazo cuentan como error (van sin lote)', async () => {
    const { cliente } = clienteFalso(['ended'], [{ custom_id: 'p0', result: { type: 'succeeded', message: { content: [], usage: {}, stop_reason: 'refusal' } } }]);
    const r = await new LoteAnthropic(cliente, new AlmacenMemoria()).enviar('G', [pedido('a'), pedido('b')]);
    expect(r).toEqual([{ clave: 'a', ok: false, error: 'el modelo rechazó el pedido (refusal)' }, { clave: 'b', ok: false, error: 'sin resultado en el lote' }]);
  });
});
```

- [ ] **Step 2: Correr el test y ver que falla**

Run: `cd fabrica && npx vitest run test/escritor/lote.test.ts`
Expected: FAIL ("Failed to load url ../../src/escritor/modelo/lote-anthropic.js").

- [ ] **Step 3: Escribir `modelo/lote-anthropic.ts`**

```ts
// fabrica/src/escritor/modelo/lote-anthropic.ts
// Ahorro (3) del spec: las fases paralelas van por Message Batches (mitad de precio). El id del lote
// queda en el almacén apenas se crea: si el proceso se corta, al retomar se esperan los resultados de
// ese mismo lote en vez de pagar otro. Lo que vuelve con error lo repite el ejecutor sin lote.
import type { Almacen } from '../almacen/tipos.js';
import { aRespuesta, type MensajeApi } from './anthropic.js';
import { armarParams } from './pedido.js';
import type { Lote, PedidoModelo, ResultadoLote } from './tipos.js';

export type ResultadoApi = { custom_id: string; result: { type: string; message?: MensajeApi; error?: { error?: { message?: string } } } };
export type ClienteLotes = {
  messages: {
    batches: {
      create(b: { requests: { custom_id: string; params: Record<string, unknown> }[] }): Promise<{ id: string }>;
      retrieve(id: string): Promise<{ processing_status: string }>;
      results(id: string): Promise<AsyncIterable<ResultadoApi>>;
    };
  };
};
type EstadoLote = { id: string; claves: string[] };

export class LoteAnthropic implements Lote {
  constructor(
    private readonly cliente: ClienteLotes,
    private readonly almacen: Almacen,
    private readonly o: { esperar?: (ms: number) => Promise<void>; cadaMs?: number } = {},
  ) {}

  async enviar(grupo: string, pedidos: PedidoModelo[]): Promise<ResultadoLote[]> {
    const ruta = `lotes/${grupo}.json`;
    const claves = pedidos.map((p) => p.clave);
    const previo = await this.almacen.leer(ruta);
    let estado = previo ? (JSON.parse(previo) as EstadoLote) : null;
    if (!estado || estado.claves.join('\n') !== claves.join('\n')) {
      const b = await this.cliente.messages.batches.create({ requests: pedidos.map((p, i) => ({ custom_id: `p${i}`, params: armarParams(p) })) });
      estado = { id: b.id, claves };
      await this.almacen.escribir(ruta, JSON.stringify(estado));
    }
    const esperar = this.o.esperar ?? ((ms: number) => new Promise<void>((r) => setTimeout(r, ms)));
    while ((await this.cliente.messages.batches.retrieve(estado.id)).processing_status !== 'ended') await esperar(this.o.cadaMs ?? 30_000);
    const porClave = new Map<string, ResultadoLote>();
    for await (const r of await this.cliente.messages.batches.results(estado.id)) {
      const clave = estado.claves[Number(r.custom_id.slice(1))];
      if (clave === undefined) continue;
      if (r.result.type === 'succeeded' && r.result.message) {
        try {
          porClave.set(clave, { clave, ok: true, respuesta: aRespuesta(r.result.message) });
        } catch (err) {
          porClave.set(clave, { clave, ok: false, error: (err as Error).message });
        }
      } else porClave.set(clave, { clave, ok: false, error: r.result.error?.error?.message ?? r.result.type });
    }
    return claves.map((clave) => porClave.get(clave) ?? { clave, ok: false, error: 'sin resultado en el lote' });
  }
}
```

- [ ] **Step 4: Correr el test y el tipado**

Run: `cd fabrica && npx vitest run test/escritor/lote.test.ts && npx tsc --noEmit -p .`
Expected: PASS y tsc sin errores.

- [ ] **Step 5: Commit**

```bash
git add fabrica/src/escritor/modelo/lote-anthropic.ts fabrica/test/escritor/lote.test.ts
git commit -m "escritor: Batch con el id del lote guardado (se retoma sin pagar otro lote)" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 16: El ejecutor (checkpoint por llamada, reintentos, JSON, tope, uso, paralelo, Batch)

**Files:**
- Create: `fabrica/src/escritor/ejecutor.ts`
- Test: `fabrica/test/escritor/ejecutor.test.ts`

**Interfaces:**
- Consumes: `Almacen`, `AlmacenMemoria` (Task 13); `parseJSONTolerante` (Task 1); `usdDeLlamada` (Task 12); `Llamada` (Task 10); `armarParams`, `bloquesDeLlamada`, `puntosDeCache` (Task 14); `ErrorDelModelo`, `Esfuerzo`, `Lote`, `Modelo`, `PedidoModelo`, `RespuestaModelo` (Task 14); `ModeloFalso`, `LoteFalso` (Task 14).
- Produces:
  - `type Rol = { modelo: string; maxTokens: number; esfuerzo: Esfuerzo }`, `ROLES: Record<'opus' | 'barato', Rol>`
  - `type Encargo = { clave: string; llamada: Llamada; json: boolean; rol?: 'opus' | 'barato'; maxTokens?: number }`
  - `type FilaUso = { clave: string; modelo: string; lote: boolean; de_memoria: boolean; input: number; output: number; cache_write: number; cache_read: number; usd: number }`
  - `type OpcionesEjecutor = { modelo: Modelo; lote?: Lote; almacen: Almacen; topeUsd?: number; esperar?: (ms: number) => Promise<void>; esperasMs?: number[]; limite?: number; log?: (s: string) => void }`
  - `type ResultadoVarios = { textos: Map<string, string>; fallas: Map<string, string> }`
  - `class TopeDeGasto extends Error`, `class ErrorJSON extends Error`
  - `class Ejecutor { constructor(o: OpcionesEjecutor); readonly filas: FilaUso[]; get gastado(): number; pedido(e: Encargo): PedidoModelo; uno(e: Encargo): Promise<string>; varios(es: Encargo[], o: { lote: boolean; grupo: string }): Promise<ResultadoVarios>; guardarCostos(): Promise<void> }`
  - Rutas en el almacén: `pasos/<clave con # → ~>.json` = `{ hash, texto, fila }`; `costos.json` = `{ total_usd, tope_usd, filas }`.

- [ ] **Step 1: Escribir el test que falla**

```ts
// fabrica/test/escritor/ejecutor.test.ts
import { describe, expect, it } from 'vitest';
import { AlmacenMemoria } from '../../src/escritor/almacen/memoria.js';
import { Ejecutor, ErrorJSON, TopeDeGasto, type Encargo } from '../../src/escritor/ejecutor.js';
import type { Llamada } from '../../src/escritor/llamadas/armar.js';
import { LoteFalso, ModeloFalso, claveBase } from '../../src/escritor/modelo/falso.js';
import { ErrorDelModelo, type Modelo, type PedidoModelo, type RespuestaModelo } from '../../src/escritor/modelo/tipos.js';

const llamada = (nombre: string, instr = 'Hacé esto.'): Llamada => ({ nombre, docs: ['<ficha>\nf\n</ficha>', '<voz>\nv\n</voz>'], instr });
const enc = (clave: string, json = false, instr?: string): Encargo => ({ clave, llamada: llamada(claveBase(clave), instr), json });

describe('Ejecutor.uno', () => {
  it('memoriza: otro ejecutor con el mismo almacén no vuelve a llamar y cuenta lo ya pagado', async () => {
    const almacen = new AlmacenMemoria();
    const e1 = new Ejecutor({ modelo: new ModeloFalso({ '3b-capitulo-01': 'cap' }), almacen });
    expect(await e1.uno(enc('C/3b-capitulo-01'))).toBe('cap');
    expect(e1.filas).toEqual([{ clave: 'C/3b-capitulo-01', modelo: 'claude-opus-5-5', lote: false, de_memoria: false, input: 1000, output: 100, cache_write: 0, cache_read: 0, usd: 0.006 }]);
    const m2 = new ModeloFalso({});
    const e2 = new Ejecutor({ modelo: m2, almacen });
    expect(await e2.uno(enc('C/3b-capitulo-01'))).toBe('cap');
    expect(m2.llamadas).toHaveLength(0);
    expect(e2.filas).toEqual([{ ...e1.filas[0], de_memoria: true }]);
    expect(e2.gastado).toBe(0.006);
  });

  it('si el pedido cambió (otro material), la memoria no sirve: se llama de nuevo', async () => {
    const almacen = new AlmacenMemoria();
    await new Ejecutor({ modelo: new ModeloFalso({ '3b-capitulo-01': 'viejo' }), almacen }).uno(enc('C/3b-capitulo-01', false, 'versión 1'));
    const m = new ModeloFalso({ '3b-capitulo-01': 'nuevo' });
    expect(await new Ejecutor({ modelo: m, almacen }).uno(enc('C/3b-capitulo-01', false, 'versión 2'))).toBe('nuevo');
    expect(m.llamadas).toHaveLength(1);
  });

  it('un JSON que no parsea se pide una vez más con otra clave; dos veces, ErrorJSON', async () => {
    const m = new ModeloFalso({ '4-hechos': 'no es json', '4-hechos#json': '```json\n{"problemas": []}\n```' });
    expect(await new Ejecutor({ modelo: m, almacen: new AlmacenMemoria() }).uno(enc('C/4-hechos', true))).toContain('"problemas"');
    expect(m.llamadas.map((p) => p.clave)).toEqual(['C/4-hechos', 'C/4-hechos#json']);
    await expect(new Ejecutor({ modelo: new ModeloFalso({ '4-hechos': 'x' }), almacen: new AlmacenMemoria() }).uno(enc('C/4-hechos', true))).rejects.toBeInstanceOf(ErrorJSON);
  });

  it('un error reintentable (red, 529) espera y reintenta; uno que no lo es corta enseguida', async () => {
    let fallas = 2;
    const inestable: Modelo = { llamar: async (): Promise<RespuestaModelo> => { if (fallas-- > 0) throw new ErrorDelModelo('529 overloaded', true); return { texto: 'ok', uso: { input_tokens: 1 }, motivoFin: 'end_turn' }; } };
    const esperas: number[] = [];
    const e = new Ejecutor({ modelo: inestable, almacen: new AlmacenMemoria(), esperar: async (ms) => { esperas.push(ms); }, esperasMs: [10, 20, 30] });
    expect(await e.uno(enc('C/3r-resumen-cap_1'))).toBe('ok');
    expect(esperas).toEqual([10, 20]);
    const rechazo: Modelo = { llamar: async () => { throw new ErrorDelModelo('refusal', false); } };
    await expect(new Ejecutor({ modelo: rechazo, almacen: new AlmacenMemoria(), esperar: async () => {} }).uno(enc('C/x'))).rejects.toThrow('refusal');
  });

  it('tope de gasto: con el tope alcanzado no se hace ninguna llamada nueva', async () => {
    const m = new ModeloFalso({}, [['', '{}']]);
    const e = new Ejecutor({ modelo: m, almacen: new AlmacenMemoria(), topeUsd: 0.01 });
    await e.uno(enc('C/a'));
    await e.uno(enc('C/b'));
    await expect(e.uno(enc('C/c'))).rejects.toBeInstanceOf(TopeDeGasto);
    expect(m.llamadas).toHaveLength(2);
  });

  it('el pedido usa Opus 5.5 en xhigh, salvo el rol barato (Sonnet 5.5, low)', () => {
    const e = new Ejecutor({ modelo: new ModeloFalso({}), almacen: new AlmacenMemoria() });
    expect(e.pedido(enc('C/3b-capitulo-01'))).toMatchObject({ modelo: 'claude-opus-5-5', esfuerzo: 'xhigh', maxTokens: 64000, cacheEn: [1] });
    expect(e.pedido({ ...enc('B/correccion-registro'), rol: 'barato' })).toMatchObject({ modelo: 'claude-sonnet-5-5', esfuerzo: 'low' });
    expect(e.pedido({ ...enc('A/1-registro'), maxTokens: 128000 }).maxTokens).toBe(128000);
  });
});

describe('Ejecutor.varios', () => {
  it('sin lote: en paralelo con límite; las fallas de JSON quedan a un costado', async () => {
    let activos = 0;
    let maximo = 0;
    const lento: Modelo = {
      llamar: async (p: PedidoModelo): Promise<RespuestaModelo> => {
        activos++; maximo = Math.max(maximo, activos);
        await new Promise((r) => setTimeout(r, 5));
        activos--;
        return { texto: p.clave.endsWith('3') ? 'roto' : '{"ok": true}', uso: { input_tokens: 1 }, motivoFin: 'end_turn' };
      },
    };
    const e = new Ejecutor({ modelo: lento, almacen: new AlmacenMemoria(), limite: 2 });
    const r = await e.varios(['C/7-estilo-p1', 'C/7-estilo-p2', 'C/7-estilo-p3', 'C/7-estilo-p4'].map((k) => enc(k, true)), { lote: false, grupo: 'C-estilo-1' });
    expect(maximo).toBe(2);
    expect([...r.textos.keys()].sort()).toEqual(['C/7-estilo-p1', 'C/7-estilo-p2', 'C/7-estilo-p4']);
    expect([...r.fallas.keys()]).toEqual(['C/7-estilo-p3']);
  });

  it('con lote: lo que vuelve bien se cobra a mitad de precio; lo que falla va sin lote; nada se cuenta dos veces', async () => {
    const salidas = { '7-estilo-cap_1': '{"cambios": []}', '7-estilo-cap_2': '{"cambios": []}' };
    const enLote = new ModeloFalso(salidas);
    const directo = new ModeloFalso(salidas);
    const almacen = new AlmacenMemoria();
    const e = new Ejecutor({ modelo: directo, lote: new LoteFalso(enLote, new Set(['7-estilo-cap_2'])), almacen });
    const r = await e.varios([enc('C/7-estilo-cap_1', true), enc('C/7-estilo-cap_2', true)], { lote: true, grupo: 'C-estilo-1' });
    expect(r.textos.size).toBe(2);
    expect(enLote.llamadas.map((p) => p.clave)).toEqual(['C/7-estilo-cap_1', 'C/7-estilo-cap_2']);
    expect(directo.llamadas.map((p) => p.clave)).toEqual(['C/7-estilo-cap_2']);
    expect(e.filas.map((f) => [f.clave, f.lote, f.de_memoria, f.usd])).toEqual([['C/7-estilo-cap_1', true, false, 0.003], ['C/7-estilo-cap_2', false, false, 0.006]]);
    await e.guardarCostos();
    expect(JSON.parse((await almacen.leer('costos.json')) as string)).toMatchObject({ total_usd: 0.009, tope_usd: 15 });
  });
});
```

- [ ] **Step 2: Correr el test y ver que falla**

Run: `cd fabrica && npx vitest run test/escritor/ejecutor.test.ts`
Expected: FAIL ("Failed to load url ../../src/escritor/ejecutor.js").

- [ ] **Step 3: Escribir `ejecutor.ts`**

```ts
// fabrica/src/escritor/ejecutor.ts
// Todas las llamadas al modelo del escritor pasan por acá:
// - checkpoint por llamada: cada respuesta queda en el almacén con el hash del pedido; si se corta,
//   volver a correr la etapa saca de ahí lo ya pagado (y lo suma al gasto del libro);
// - reintentos con espera para errores de API (red, 429, 529, 5xx);
// - un reintento si el JSON no parsea (receta, sección 5);
// - tope de gasto por libro (USD 15 por defecto): con el tope alcanzado no sale ninguna llamada nueva;
// - una fila de uso por llamada (costos.json);
// - fases paralelas: con lote (Batch, mitad de precio) o en paralelo con límite; lo que el lote
//   devuelve con error se repite sin lote.
import { createHash } from 'node:crypto';
import type { Almacen } from './almacen/tipos.js';
import { parseJSONTolerante } from './carpeta.js';
import { usdDeLlamada } from './costos.js';
import type { Llamada } from './llamadas/armar.js';
import { armarParams, bloquesDeLlamada, puntosDeCache } from './modelo/pedido.js';
import { ErrorDelModelo, type Esfuerzo, type Lote, type Modelo, type PedidoModelo, type RespuestaModelo } from './modelo/tipos.js';

export type Rol = { modelo: string; maxTokens: number; esfuerzo: Esfuerzo };
/** Opus en todo lo que escribe (Naza, 02/10); el barato solo corrige el registro (spec, decisión 4). Se ajusta después de la prueba paga. */
export const ROLES: Record<'opus' | 'barato', Rol> = {
  opus: { modelo: 'claude-opus-5-5', maxTokens: 64000, esfuerzo: 'xhigh' },
  barato: { modelo: 'claude-sonnet-5-5', maxTokens: 64000, esfuerzo: 'low' },
};

export type Encargo = { clave: string; llamada: Llamada; json: boolean; rol?: 'opus' | 'barato'; maxTokens?: number };
export type FilaUso = { clave: string; modelo: string; lote: boolean; de_memoria: boolean; input: number; output: number; cache_write: number; cache_read: number; usd: number };
export type OpcionesEjecutor = { modelo: Modelo; lote?: Lote; almacen: Almacen; topeUsd?: number; esperar?: (ms: number) => Promise<void>; esperasMs?: number[]; limite?: number; log?: (s: string) => void };
export type ResultadoVarios = { textos: Map<string, string>; fallas: Map<string, string> };

export class TopeDeGasto extends Error {
  constructor(mensaje: string) { super(mensaje); this.name = 'TopeDeGasto'; }
}
export class ErrorJSON extends Error {
  constructor(mensaje: string) { super(mensaje); this.name = 'ErrorJSON'; }
}

type Memoria = { hash: string; texto: string; fila: FilaUso };
const rutaPaso = (clave: string): string => `pasos/${clave.replace(/#/g, '~')}.json`;
const n = (v: number | null | undefined): number => (typeof v === 'number' ? v : 0);
const esJSON = (t: string): boolean => { try { parseJSONTolerante(t); return true; } catch { return false; } };

async function enParalelo<T>(xs: T[], limite: number, f: (x: T) => Promise<void>): Promise<void> {
  let i = 0;
  const trabajar = async (): Promise<void> => { while (i < xs.length) await f(xs[i++]); };
  await Promise.all(Array.from({ length: Math.min(limite, xs.length) }, trabajar));
}

export class Ejecutor {
  readonly filas: FilaUso[] = [];
  private readonly anotadas = new Set<string>();
  private readonly tope: number;

  constructor(private readonly o: OpcionesEjecutor) {
    this.tope = o.topeUsd ?? 15;
  }

  get gastado(): number {
    return Math.round(this.filas.reduce((s, f) => s + f.usd, 0) * 1e6) / 1e6;
  }

  pedido(e: Encargo): PedidoModelo {
    const rol = ROLES[e.rol ?? 'opus'];
    return { clave: e.clave, modelo: rol.modelo, bloques: bloquesDeLlamada(e.llamada), cacheEn: puntosDeCache(e.llamada.nombre, e.llamada.docs), maxTokens: e.maxTokens ?? rol.maxTokens, esfuerzo: rol.esfuerzo };
  }

  private hash(p: PedidoModelo): string {
    return createHash('sha256').update(JSON.stringify(armarParams(p))).digest('hex');
  }

  private async memoria(p: PedidoModelo): Promise<Memoria | null> {
    const t = await this.o.almacen.leer(rutaPaso(p.clave));
    if (t === null) return null;
    const m = JSON.parse(t) as Memoria;
    return m.hash === this.hash(p) ? m : null;
  }

  private async anotar(p: PedidoModelo, r: RespuestaModelo, lote: boolean): Promise<void> {
    const u = r.uso;
    const fila: FilaUso = { clave: p.clave, modelo: p.modelo, lote, de_memoria: false, input: n(u.input_tokens), output: n(u.output_tokens), cache_write: n(u.cache_creation_input_tokens), cache_read: n(u.cache_read_input_tokens), usd: usdDeLlamada(p.modelo, u, { lote }) };
    this.filas.push(fila);
    this.anotadas.add(p.clave);
    // Se guarda aunque el JSON no sirva: el gasto queda anotado y el reintento usa otra clave.
    await this.o.almacen.escribir(rutaPaso(p.clave), JSON.stringify({ hash: this.hash(p), texto: r.texto, fila } satisfies Memoria));
  }

  private verificarTope(): void {
    if (this.gastado >= this.tope) throw new TopeDeGasto(`se gastaron USD ${this.gastado.toFixed(4)} y el tope del libro es USD ${this.tope}`);
  }

  private async llamarConReintentos(p: PedidoModelo): Promise<RespuestaModelo> {
    const esperas = this.o.esperasMs ?? [30_000, 120_000, 300_000];
    const esperar = this.o.esperar ?? ((ms: number) => new Promise<void>((r) => setTimeout(r, ms)));
    for (let i = 0; ; i++) {
      this.verificarTope();
      try {
        return await this.o.modelo.llamar(p);
      } catch (err) {
        if (!(err instanceof ErrorDelModelo) || !err.reintentable || i >= esperas.length) throw err;
        this.o.log?.(`${p.clave}: ${err.message}; reintento en ${Math.round(esperas[i] / 1000)} s`);
        await esperar(esperas[i]);
      }
    }
  }

  private async crudo(e: Encargo): Promise<string> {
    const p = this.pedido(e);
    const m = await this.memoria(p);
    if (m) {
      if (!this.anotadas.has(p.clave)) {
        this.filas.push({ ...m.fila, de_memoria: true });
        this.anotadas.add(p.clave);
      }
      return m.texto;
    }
    const r = await this.llamarConReintentos(p);
    await this.anotar(p, r, false);
    return r.texto;
  }

  /** Una llamada: de la memoria si ya se pagó; si no, a la API. Con json, un pedido más si no parsea. */
  async uno(e: Encargo): Promise<string> {
    const texto = await this.crudo(e);
    if (!e.json || esJSON(texto)) return texto;
    this.o.log?.(`${e.clave}: el JSON no parsea; se pide otra vez`);
    const otra = await this.crudo({ ...e, clave: `${e.clave}#json` });
    if (esJSON(otra)) return otra;
    throw new ErrorJSON(`${e.clave}: el JSON no parsea dos veces`);
  }

  /** Una fase paralela. Con lote, lo que no está en memoria va por Batch; después todo se resuelve con `uno`. */
  async varios(es: Encargo[], o: { lote: boolean; grupo: string }): Promise<ResultadoVarios> {
    const textos = new Map<string, string>();
    const fallas = new Map<string, string>();
    if (o.lote && this.o.lote) {
      const pendientes: PedidoModelo[] = [];
      for (const e of es) { const p = this.pedido(e); if (!(await this.memoria(p))) pendientes.push(p); }
      if (pendientes.length) {
        this.verificarTope();
        for (const r of await this.o.lote.enviar(o.grupo, pendientes)) {
          if (r.ok) await this.anotar(pendientes.find((p) => p.clave === r.clave) as PedidoModelo, r.respuesta, true);
          else this.o.log?.(`${r.clave}: el lote volvió con error (${r.error}); va sin lote`);
        }
      }
    }
    await enParalelo(es, this.o.limite ?? 4, async (e) => {
      try {
        textos.set(e.clave, await this.uno(e));
      } catch (err) {
        if (err instanceof ErrorJSON || (err instanceof ErrorDelModelo && !err.reintentable)) fallas.set(e.clave, err.message);
        else throw err;
      }
    });
    return { textos, fallas };
  }

  async guardarCostos(): Promise<void> {
    await this.o.almacen.escribir('costos.json', JSON.stringify({ total_usd: this.gastado, tope_usd: this.tope, filas: this.filas }, null, 1));
  }
}
```

- [ ] **Step 4: Correr el test y el tipado**

Run: `cd fabrica && npx vitest run test/escritor/ejecutor.test.ts && npx tsc --noEmit -p .`
Expected: PASS y tsc sin errores.

- [ ] **Step 5: Commit**

```bash
git add fabrica/src/escritor/ejecutor.ts fabrica/test/escritor/ejecutor.test.ts
git commit -m "escritor: ejecutor con checkpoint por llamada, reintentos, tope de gasto, uso por llamada y Batch" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 17: El material desde la entrevista V3 (respuestas, ficha, confirmado)

**Files:**
- Create: `fabrica/src/escritor/material/de-entrevista.ts` (el código de `aMaterial`, movido)
- Modify: `fabrica/scripts/v3-entrevista-a-material.ts` (importa y re-exporta; el `main` queda igual)
- Create: `fabrica/src/escritor/material/ficha-xml.ts`
- Create: `fabrica/src/escritor/material/a-carpeta.ts`
- Test: `fabrica/test/escritor/material.test.ts` (y sigue pasando `fabrica/test/v3-entrevista-a-material.test.ts`)

**Interfaces:**
- Consumes: `Carpeta` (Task 1); `respuestas`, `idioma`, `nombreDePila`, `ficha` (Task 4); `controlar` (Task 7); de `fabrica/src/v3`: `FichaEntrevista` (`entrevista/texto.ts`), `idiomaDe`, `Idioma` (`entrevista/idioma.ts`), `estado`, `Opcional` (`ficha.ts`).
- Produces:
  - de `de-entrevista.ts` (movidos sin cambios de lógica): `type EstadoEntrevista`, `type Fila`, `aMaterial(e: EstadoEntrevista): Fila[]`, `respuestasXml(filas: Fila[]): string`, `etiquetas(filas: Fila[]): Json[]`
  - `fichaXml(f: FichaEntrevista): string`
  - `type CorreccionFamilia = { texto: string; dudaId?: string }`
  - `materialACarpeta(c: Carpeta, m: { estado: EstadoEntrevista & { ficha: FichaEntrevista }; confirmadoNarrador?: string[] }): { filas: Fila[]; descartadas: string[] }` (escribe `entradas/respuestas.xml` sin las "paso", `entradas/etiquetas.json`, `entradas/ficha.xml` y, si hay, `entradas/confirmado.xml`)
  - `agregarConfirmados(c: Carpeta, correcciones: CorreccionFamilia[]): boolean` (suma un bloque a `entradas/confirmado.xml`; no lo repite)

Nota de diseño: el spec habla de `<confirmado_por_la_familia>`. La receta v5.5 (que no se reescribe) y C14 leen `<confirmado_por_el_narrador>`; por eso las correcciones de la familia entran **en ese mismo bloque**, con un encabezado propio, como ya se hizo a mano con las correcciones de Joaquín del 06/10. Así llegan a todos los pasos y C14 exige que el registro las tenga. (Ver "Lo distinto al spec" al final.)

- [ ] **Step 1: Escribir el test que falla**

```ts
// fabrica/test/escritor/material.test.ts
import { describe, expect, it } from 'vitest';
import { Carpeta } from '../../src/escritor/carpeta.js';
import { controlar } from '../../src/escritor/controles/correr.js';
import { ficha, idioma, nombreDePila, respuestas } from '../../src/escritor/lectura.js';
import { agregarConfirmados, materialACarpeta } from '../../src/escritor/material/a-carpeta.js';
import { fichaXml } from '../../src/escritor/material/ficha-xml.js';
import type { FichaEntrevista } from '../../src/v3/entrevista/texto.js';
import { carpetaNelida } from './ayuda.js';

const elvira: FichaEntrevista = { nombre: 'Elvira', apodo: 'Vira', genero: 'mujer', anioNacimiento: 1950, paisNacimiento: 'Argentina', paisResidencia: 'Argentina', destinatarios: 'sus nietos', hijos: [{ nombre: 'Laura' }, { nombre: 'Pablo' }], hermanos: 'no-tiene' };

describe('ficha.xml desde la ficha V3', () => {
  it('castellano rioplatense: vos, y los datos que hay', () => {
    expect(fichaXml(elvira)).toBe([
      '<ficha>',
      'Nombre: Elvira (le dicen Vira)',
      'Género: mujer',
      'Año de nacimiento: 1950',
      'Trato: vos',
      'Idioma del libro: castellano',
      'Para quién es el libro: sus nietos',
      'País donde nació: Argentina',
      'País donde vive: Argentina',
      'Hijos: Laura, Pablo',
      'Hermanos: no tiene',
      'Parejas: (no se cargó)',
      '(El resto de la ficha no se cargó: sale de sus respuestas.)',
      '</ficha>',
    ].join('\n'));
  });

  it('catalán y castellano de España: el escritor lee el idioma y el nombre de la ficha', () => {
    const c = new Carpeta({ 'entradas/ficha.xml': fichaXml({ ...elvira, idioma: 'ca' }) });
    expect(idioma(c)).toBe('ca');
    expect(nombreDePila(c)).toBe('Elvira');
    expect(fichaXml({ ...elvira, idioma: 'ca' })).toContain('Trato: tu\nIdioma del libro: catalán');
    const e = new Carpeta({ 'entradas/ficha.xml': fichaXml({ ...elvira, idioma: 'es-ES' }) });
    expect(idioma(e)).toBe('es');
    expect(fichaXml({ ...elvira, idioma: 'es-ES' })).toContain('Trato: tú\nIdioma del libro: castellano de España');
  });
});

describe('materialACarpeta', () => {
  it('escribe respuestas (sin las "paso"), etiquetas y ficha', () => {
    const c = new Carpeta();
    const r = materialACarpeta(c, { estado: { ficha: elvira, respuestas: [['CA2', 'Mi mamá cosía para afuera y cantaba tangos.'], ['CA17', 'Paso.']] } });
    expect(r.descartadas).toEqual(['R02']);
    expect(respuestas(c).map((x) => x.id)).toEqual(['R01']);
    expect(respuestas(c)[0].texto).toBe('Mi mamá cosía para afuera y cantaba tangos.');
    expect(JSON.parse(c.leer('entradas/etiquetas.json')).map((x: { id: string; paso: boolean }) => [x.id, x.paso])).toEqual([['R01', false], ['R02', true]]);
    expect(c.leer('entradas/ficha.xml')).toBe(fichaXml(elvira));
    expect(c.existe('entradas/confirmado.xml')).toBe(false);
  });
});

describe('agregarConfirmados (las correcciones de la familia)', () => {
  it('suman un bloque a confirmado.xml, una vez, y C14 pide que el registro las tenga', () => {
    const c = carpetaNelida();
    expect(agregarConfirmados(c, [{ texto: 'La Negra se llamaba Ofelia Sánchez.', dudaId: 'D01' }, { texto: '  ' }])).toBe(true);
    expect(agregarConfirmados(c, [{ texto: 'La Negra se llamaba Ofelia Sánchez.', dudaId: 'D01' }])).toBe(false);
    expect(c.leer('entradas/confirmado.xml')).toBe('(Correcciones de la familia antes de escribir el libro. Mandan sobre las respuestas.)\n- La Negra se llamaba Ofelia Sánchez.\n');
    expect(ficha(c)).toContain('<confirmado_por_el_narrador>\n(Correcciones de la familia');
    expect(controlar(c, 'registro').resumen).toContain('C14: hay 1 confirmados en la ficha y el registro tiene 0');
  });
});
```

- [ ] **Step 2: Correr los tests y ver que fallan**

Run: `cd fabrica && npx vitest run test/escritor/material.test.ts test/v3-entrevista-a-material.test.ts`
Expected: FAIL en `material.test.ts` ("Failed to load url ../../src/escritor/material/a-carpeta.js"); `v3-entrevista-a-material.test.ts` PASS.

- [ ] **Step 3: Mover `aMaterial` y escribir los módulos**

`fabrica/src/escritor/material/de-entrevista.ts`: se **mueve** (cortar y pegar) de `fabrica/scripts/v3-entrevista-a-material.ts` el comentario de cabecera (líneas 1-31, cambiando la línea de uso por "Lo usa scripts/v3-entrevista-a-material.ts y el escritor de la fábrica."), los tipos `Parte`, `Globo`, `Estado` (renombrado `export type EstadoEntrevista`), `Fila`, las constantes `LEGADO`, `PASO`, `contar`, y las funciones `mandado`, `aMaterial`, `pegarA`, `esc`, `respuestasXml`, `etiquetas` (líneas 39-144 del script). Los imports cambian de `'../src/v3/…'` a `'../../v3/…'`. Nada de la lógica cambia.

`fabrica/scripts/v3-entrevista-a-material.ts` queda con su cabecera, sus imports de `node:fs`/`node:path`/`node:url`, y:

```ts
import { aMaterial, etiquetas, respuestasXml, type EstadoEntrevista, type Fila } from '../src/escritor/material/de-entrevista.js';

// La lógica vive en src/escritor/material/de-entrevista.ts (la usa el escritor de la fábrica); acá queda el comando.
export { aMaterial, etiquetas, respuestasXml };
export type { Fila };
```

y su `main` y el bloque `if (process.argv[1] && …)` sin cambios (con `as Estado` → `as EstadoEntrevista`).

```ts
// fabrica/src/escritor/material/ficha-xml.ts
// La ficha V3 en el formato que lee el escritor (entradas/ficha.xml): una línea por dato, como la ficha
// de Joaquín. El escritor saca de acá el nombre de pila ("Nombre: X"), el idioma del libro
// ("Idioma del libro: catalán") y el trato. Lo que no se cargó lo dice: el escritor no inventa.
import { estado, type Opcional } from '../../v3/ficha.js';
import { idiomaDe, type Idioma } from '../../v3/entrevista/idioma.js';
import type { FichaEntrevista } from '../../v3/entrevista/texto.js';

const GENERO: Record<FichaEntrevista['genero'], string> = { varon: 'varón', mujer: 'mujer', otro: 'otro' };
const TRATO: Record<Idioma, string> = { 'es-AR': 'vos', 'es-ES': 'tú', ca: 'tu' };
const IDIOMA_LIBRO: Record<Idioma, string> = { 'es-AR': 'castellano', 'es-ES': 'castellano de España', ca: 'catalán' };

function lista<T>(v: Opcional<T[]>, fmt: (x: T) => string): string {
  const e = estado(v);
  if (e === 'no-tiene') return 'no tiene';
  if (e === 'no-sabe') return '(no se cargó)';
  return (v as T[]).map(fmt).join(', ');
}

export function fichaXml(f: FichaEntrevista): string {
  const idi = idiomaDe(f);
  const lineas = [
    `Nombre: ${f.nombre}${f.apodo ? ` (le dicen ${f.apodo})` : ''}`,
    `Género: ${GENERO[f.genero]}${f.genero === 'otro' && f.formaTrato ? ` (prefiere trato ${f.formaTrato})` : ''}`,
    `Año de nacimiento: ${f.anioNacimiento}`,
    `Trato: ${TRATO[idi]}`,
    `Idioma del libro: ${IDIOMA_LIBRO[idi]}`,
    `Para quién es el libro: ${f.destinatarios?.trim() || '(no se cargó)'}`,
    `País donde nació: ${f.paisNacimiento}`,
    `País donde vive: ${f.paisResidencia}`,
    ...(f.ciudadInfancia ? [`Ciudad de la infancia: ${f.ciudadInfancia}`] : []),
    `Hijos: ${lista(f.hijos, (h) => h.nombre)}`,
    `Hermanos: ${lista(f.hermanos, (h) => h)}`,
    `Parejas: ${lista(f.parejas, (p) => `${p.nombre}${p.actual ? ' (hoy)' : ''}`)}`,
    '(El resto de la ficha no se cargó: sale de sus respuestas.)',
  ];
  return `<ficha>\n${lineas.join('\n')}\n</ficha>`;
}
```

```ts
// fabrica/src/escritor/material/a-carpeta.ts
// Arma entradas/ de la Carpeta desde la entrevista V3 (spec: pieza escritor/material).
// Las respuestas "paso" no llegan al escritor (receta, paso 0); quedan en etiquetas.json.
// Las correcciones de la familia se suman a confirmado.xml (van a todos los pasos dentro de
// <confirmado_por_el_narrador>, que es lo que leen la receta y C14).
import type { Carpeta } from '../carpeta.js';
import type { FichaEntrevista } from '../../v3/entrevista/texto.js';
import { aMaterial, etiquetas, respuestasXml, type EstadoEntrevista, type Fila } from './de-entrevista.js';
import { fichaXml } from './ficha-xml.js';

export type CorreccionFamilia = { texto: string; dudaId?: string };

export function materialACarpeta(c: Carpeta, m: { estado: EstadoEntrevista & { ficha: FichaEntrevista }; confirmadoNarrador?: string[] }): { filas: Fila[]; descartadas: string[] } {
  const filas = aMaterial(m.estado);
  c.escribir('entradas/respuestas.xml', respuestasXml(filas.filter((f) => !f.paso)));
  c.escribir('entradas/etiquetas.json', JSON.stringify(etiquetas(filas), null, 2));
  c.escribir('entradas/ficha.xml', fichaXml(m.estado.ficha));
  if (m.confirmadoNarrador?.length) c.escribir('entradas/confirmado.xml', `(Lo pidió quien narra. Vale como ficha.)\n${m.confirmadoNarrador.map((l) => `- ${l}`).join('\n')}\n`);
  return { filas, descartadas: filas.filter((f) => f.paso).map((f) => f.id) };
}

const ENCABEZADO_FAMILIA = '(Correcciones de la familia antes de escribir el libro. Mandan sobre las respuestas.)';

export function agregarConfirmados(c: Carpeta, correcciones: CorreccionFamilia[]): boolean {
  const lineas = correcciones.map((x) => x.texto.trim().replace(/\s*\n\s*/g, ' ')).filter(Boolean).map((t) => `- ${t}`);
  if (!lineas.length) return false;
  const bloque = `${ENCABEZADO_FAMILIA}\n${lineas.join('\n')}`;
  const antes = c.existe('entradas/confirmado.xml') ? c.leer('entradas/confirmado.xml').trim() : '';
  if (antes.includes(bloque)) return false;
  c.escribir('entradas/confirmado.xml', `${antes ? `${antes}\n\n` : ''}${bloque}\n`);
  return true;
}
```

- [ ] **Step 4: Correr los tests y el tipado**

Run: `cd fabrica && npx vitest run test/escritor/material.test.ts test/v3-entrevista-a-material.test.ts test/v3-entrevista-amh-desde-am0.test.ts test/v3-catala-revision.test.ts test/v3-es-ES.test.ts && npx tsc --noEmit -p .`
Expected: PASS (los cuatro tests viejos que importan el script siguen verdes) y tsc sin errores.

- [ ] **Step 5: Commit**

```bash
git add fabrica/src/escritor/material fabrica/scripts/v3-entrevista-a-material.ts fabrica/test/escritor/material.test.ts
git commit -m "escritor: material desde la entrevista V3 (aMaterial movido a src), ficha.xml y correcciones de la familia" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 18: Las llamadas de la fábrica: disputa, dudas para la familia y corrección del registro

**Files:**
- Create: `fabrica/src/escritor/llamadas/fabrica.ts`
- Create: `fabrica/src/escritor/dudas.ts`
- Create: `fabrica/src/escritor/correccion.ts`
- Test: `fabrica/test/escritor/fabrica.test.ts`

**Interfaces:**
- Consumes: `Carpeta`, `leerJSON` (Task 1); `ficha`, `nombreDePila`, `salida` (Task 4); `promptFabrica`, `promptsDe`, `esquemaDe` (Task 2); `tag`, `Llamada` (Task 10); `Disputa` (Task 8).
- Produces:
  - `type TipoDuda = 'nombre' | 'fecha' | 'identidad' | 'contradiccion' | 'transcripcion'`, `type DudaDeDatos = { id: string; tipo: TipoDuda; que: string; ids: string[]; citas: { id: string; texto: string }[] }`, `type DudaParaLaFamilia = DudaDeDatos & { pregunta: string; opciones: string[] }`
  - `dudasDelRegistro(reg: Json, rs: Respuesta[]): DudaDeDatos[]` (las `dudas` del registro que la ficha no resolvió, numeradas D01…, con lo que dijo textual), `validarDudas(dudas: DudaDeDatos[], respuesta: Json): DudaParaLaFamilia[]` (tira si falta una)
  - `idiomaDeLaFamilia(c: Carpeta): string`, `llamadaDisputa(docsHechos: string[], d: Disputa): Llamada` (nombre `disputa-<clave>`), `llamadaDudas(c: Carpeta, dudas: DudaDeDatos[]): Llamada` (nombre `dudas`), `llamadaCorreccion(c: Carpeta): Llamada` (nombre `correccion-registro`)
  - `aplicarCorreccion(reg: Json, cambios: Json): Json`

- [ ] **Step 1: Escribir el test que falla**

```ts
// fabrica/test/escritor/fabrica.test.ts
import { describe, expect, it } from 'vitest';
import { leerJSON } from '../../src/escritor/carpeta.js';
import { aplicarCorreccion } from '../../src/escritor/correccion.js';
import { dudasDelRegistro, validarDudas } from '../../src/escritor/dudas.js';
import { respuestas } from '../../src/escritor/lectura.js';
import { llamadaCorreccion, llamadaDisputa, llamadaDudas } from '../../src/escritor/llamadas/fabrica.js';
import { carpetaNelida } from './ayuda.js';

describe('dudas de datos para la familia', () => {
  const c = carpetaNelida();
  const reg = leerJSON(c, 'salidas/registro.json');

  it('salen del registro, sin las que resolvió la ficha, con lo que dijo textual', () => {
    const conResuelta = { ...reg, dudas: [...reg.dudas, { tipo: 'fecha', que: 'el año del casamiento', ids: ['R02'], resuelta_por_ficha: true }] };
    expect(dudasDelRegistro(conResuelta, respuestas(c))).toEqual([
      { id: 'D01', tipo: 'nombre', que: 'No dice el nombre de la Negra', ids: ['R10'], citas: [{ id: 'R10', texto: 'La Negra era mi amiga del barrio. Nos sentábamos en la vereda a tomar mate.' }] },
    ]);
  });

  it('la llamada lleva la ficha, las dudas, el nombre, el idioma de la familia y el esquema', () => {
    const l = llamadaDudas(c, dudasDelRegistro(reg, respuestas(c)));
    expect(l.nombre).toBe('dudas');
    expect(l.docs[0].startsWith('<ficha>')).toBe(true);
    expect(l.docs[1]).toContain('"D01"');
    expect(l.instr).toContain('la familia de Nélida');
    expect(l.instr).toContain('en castellano rioplatense');
    expect(l.instr).toContain('Esquema de salida');
    const ca = carpetaNelida();
    ca.escribir('entradas/ficha.xml', ca.leer('entradas/ficha.xml').replace('</ficha>', 'Idioma del libro: catalán\n</ficha>'));
    expect(llamadaDudas(ca, []).instr).toContain('en catalán');
  });

  it('validarDudas exige una pregunta por duda', () => {
    const dudas = dudasDelRegistro(reg, respuestas(c));
    expect(validarDudas(dudas, { dudas: [{ id: 'D01', pregunta: ' ¿Cómo se llamaba la Negra? ', opciones: ['', 'Ofelia'] }] })[0]).toMatchObject({ pregunta: '¿Cómo se llamaba la Negra?', opciones: ['Ofelia'] });
    expect(() => validarDudas(dudas, { dudas: [] })).toThrow(/D01/);
  });
});

describe('disputa y corrección del registro', () => {
  it('la disputa lleva los documentos de los hechos tal cual y la pregunta con sus huecos llenos', () => {
    const docs = ['<guia>\ng\n</guia>', '<registro>\nr\n</registro>'];
    const l = llamadaDisputa(docs, { clave: 'cap_1-2', pieza: 'cap_1', n: 2, frase: 'Raúl tenía la mercería', id: 'R02', cita: 'abrimos la mercería con Raúl' });
    expect(l.nombre).toBe('disputa-cap_1-2');
    expect(l.docs).toBe(docs);
    expect(l.instr).toContain('Frase del libro: "Raúl tenía la mercería". Respuesta R02');
  });

  it('la corrección lleva ficha y registro; aplicarCorreccion reemplaza por id, borra y deja lo demás igual', () => {
    const c = carpetaNelida();
    const l = llamadaCorreccion(c);
    expect(l.nombre).toBe('correccion-registro');
    expect(l.docs.map((d) => d.split('\n')[0])).toEqual(['<ficha>', '<registro>']);
    expect(l.instr).toContain('"borrar"');
    const reg = leerJSON(c, 'salidas/registro.json');
    const negra = { ...reg.personas[3], nombre: 'Ofelia Sánchez', apodos: ['la Negra'] };
    const nuevo = aplicarCorreccion(reg, { personas: [negra], linea_de_tiempo: [{ ...reg.linea_de_tiempo[0], cuando: '1949' }], borrar: ['P03'], confirmados: [{ texto: 'La Negra se llamaba Ofelia Sánchez.', usado_en: ['P04'] }] });
    expect(nuevo.personas.map((p: { id: string; nombre: string }) => [p.id, p.nombre])).toEqual([['P01', 'Raúl'], ['P02', 'Marcela'], ['P04', 'Ofelia Sánchez']]);
    expect(nuevo.linea_de_tiempo[0].cuando).toBe('1949');
    expect(nuevo.confirmados).toEqual([{ texto: 'La Negra se llamaba Ofelia Sánchez.', usado_en: ['P04'] }]);
    expect(nuevo.episodios).toEqual(reg.episodios);
    expect(reg.personas[3].nombre).toBe('la Negra');
  });
});
```

- [ ] **Step 2: Correr el test y ver que falla**

Run: `cd fabrica && npx vitest run test/escritor/fabrica.test.ts`
Expected: FAIL ("Failed to load url ../../src/escritor/correccion.js").

- [ ] **Step 3: Escribir los tres módulos**

```ts
// fabrica/src/escritor/dudas.ts
// Etapa A (spec, decisión 2): las dudas de datos que encontró el lector del material (registro.dudas:
// nombres, fechas, identidad, contradicciones, transcripción) pasan a la familia, en el dashboard.
// Las dudas narrativas no: van al informe interno.
import type { Json, Respuesta } from './tipos.js';

export type TipoDuda = 'nombre' | 'fecha' | 'identidad' | 'contradiccion' | 'transcripcion';
export type DudaDeDatos = { id: string; tipo: TipoDuda; que: string; ids: string[]; citas: { id: string; texto: string }[] };
export type DudaParaLaFamilia = DudaDeDatos & { pregunta: string; opciones: string[] };

export function dudasDelRegistro(reg: Json, rs: Respuesta[]): DudaDeDatos[] {
  const porId = new Map(rs.map((r) => [r.id, r.texto]));
  return ((reg?.dudas || []) as Json[])
    .filter((d) => !d.resuelta_por_ficha)
    .map((d, i) => {
      const ids = ((d.ids || []) as string[]).filter((x) => porId.has(x));
      return { id: `D${String(i + 1).padStart(2, '0')}`, tipo: d.tipo as TipoDuda, que: String(d.que || ''), ids, citas: ids.map((x) => ({ id: x, texto: porId.get(x) as string })) };
    });
}

export function validarDudas(dudas: DudaDeDatos[], respuesta: Json): DudaParaLaFamilia[] {
  const lista: Json[] = Array.isArray(respuesta?.dudas) ? respuesta.dudas : [];
  return dudas.map((d) => {
    const r = lista.find((x) => x?.id === d.id);
    if (!r || typeof r.pregunta !== 'string' || !r.pregunta.trim()) throw new Error(`la duda ${d.id} vino sin pregunta para la familia`);
    const opciones = Array.isArray(r.opciones) ? (r.opciones as unknown[]).filter((o): o is string => typeof o === 'string' && o.trim() !== '').map((o) => o.trim()) : [];
    return { ...d, pregunta: r.pregunta.trim(), opciones };
  });
}
```

```ts
// fabrica/src/escritor/llamadas/fabrica.ts
// Las tres llamadas que no están en la receta (docs/v5/escritor-v55/fabrica.md).
import { Carpeta, leerJSON } from '../carpeta.js';
import type { Disputa } from '../controles/estado.js';
import type { DudaDeDatos } from '../dudas.js';
import { ficha, nombreDePila, salida } from '../lectura.js';
import { esquemaDe, promptFabrica, promptsDe } from '../prompts/index.js';
import { tag, type Llamada } from './armar.js';

/** En qué idioma se le habla a la familia: el de la ficha ("Idioma del libro: …"). */
export function idiomaDeLaFamilia(c: Carpeta): string {
  const m = c.leer('entradas/ficha.xml').match(/^\s*idioma del libro:\s*(.+)$/im);
  const v = (m?.[1] ?? '').toLowerCase();
  if (v.startsWith('catal')) return 'catalán';
  if (v.includes('españa')) return 'castellano de España (de tú)';
  return 'castellano rioplatense';
}

/** Los mismos documentos que la llamada 4-hechos (así la caché los reusa) y la pregunta de la disputa. */
export const llamadaDisputa = (docsHechos: string[], d: Disputa): Llamada => ({
  nombre: `disputa-${d.clave}`,
  docs: docsHechos,
  instr: promptFabrica('### Disputa', { FRASE: d.frase, ID: d.id, CITA: d.cita }),
});

export const llamadaDudas = (c: Carpeta, dudas: DudaDeDatos[]): Llamada => ({
  nombre: 'dudas',
  docs: [tag('ficha', ficha(c)), tag('dudas', JSON.stringify(dudas, null, 1))],
  instr: promptFabrica('### Dudas para la familia', { NOMBRE: nombreDePila(c), IDIOMA: idiomaDeLaFamilia(c) }) + esquemaDe('### Dudas para la familia'),
});

export const llamadaCorreccion = (c: Carpeta): Llamada => ({
  nombre: 'correccion-registro',
  docs: [tag('ficha', ficha(c)), tag('registro', JSON.stringify(leerJSON(c, salida('registro.json')), null, 1))],
  instr: promptsDe('### Corrección del registro')[0] + esquemaDe('### Corrección del registro'),
});
```

```ts
// fabrica/src/escritor/correccion.ts
// Etapa B: aplica lo que devolvió el modelo barato (entradas enteras que cambian) al registro.
// No decide nada: reemplaza por id (linea_de_tiempo por "orden"), borra lo que dice "borrar" y
// pone los confirmados. C14 controla después; si falla, rehace Opus.
import type { Json } from './tipos.js';

function reemplazar(lista: Json[] | undefined, nuevos: Json[] | undefined, clave: string): Json[] {
  const out = [...(lista || [])];
  for (const x of nuevos || []) {
    const i = out.findIndex((y) => y?.[clave] === x?.[clave]);
    if (i >= 0) out[i] = x;
    else out.push(x);
  }
  return out;
}

export function aplicarCorreccion(reg: Json, cambios: Json): Json {
  const r = structuredClone(reg);
  for (const k of ['personas', 'lugares', 'episodios']) r[k] = reemplazar(r[k], cambios?.[k], 'id');
  r.linea_de_tiempo = reemplazar(r.linea_de_tiempo, cambios?.linea_de_tiempo, 'orden');
  const borrar = new Set<string>(cambios?.borrar || []);
  for (const k of ['personas', 'lugares', 'episodios']) r[k] = (r[k] || []).filter((x: Json) => !borrar.has(x.id));
  if (Array.isArray(cambios?.confirmados)) r.confirmados = cambios.confirmados;
  return r;
}
```

- [ ] **Step 4: Correr el test y el tipado**

Run: `cd fabrica && npx vitest run test/escritor/fabrica.test.ts && npx tsc --noEmit -p .`
Expected: PASS y tsc sin errores.

- [ ] **Step 5: Commit**

```bash
git add fabrica/src/escritor/llamadas/fabrica.ts fabrica/src/escritor/dudas.ts fabrica/src/escritor/correccion.ts fabrica/test/escritor/fabrica.test.ts
git commit -m "escritor: disputa, dudas de datos para la familia y corrección del registro" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 19: Etapa A (registro, plan y dudas) y el contexto del orquestador

**Files:**
- Create: `fabrica/src/escritor/orquestador/contexto.ts`
- Create: `fabrica/src/escritor/orquestador/etapa-a.ts`
- Modify: `fabrica/test/escritor/ayuda.ts` (agrega `salidasModeloNelida`, `DEFECTOS_NELIDA`)
- Test: `fabrica/test/escritor/etapa-a.test.ts`

**Interfaces:**
- Consumes: Tasks 1, 4, 7, 10, 13, 14, 16, 18.
- Produces:
  - `type Contexto = { c: Carpeta; ej: Ejecutor; almacen: Almacen; log: (s: string) => void; usarLote: boolean }`, `type Etapa = 'A' | 'B' | 'C'`
  - `guardarSnapshot(x: Contexto, etapa: Etapa): Promise<void>` (`carpeta-<etapa>.json`), `cargarSnapshot(almacen: Almacen, etapa: Etapa): Promise<Carpeta | null>`
  - `conReintentos(x: Contexto, paso: 'registro' | 'plan', prefijo: 'A/' | 'B/'): Promise<boolean>`
  - `type ResultadoEtapaA = { ok: true; capitulos: number; dudas: DudaParaLaFamilia[] } | { ok: false; motivo: string }`, `etapaA(x: Contexto): Promise<ResultadoEtapaA>` (deja `salidas/dudas-familia.json` y `dudas-familia.json` en el almacén)
  - en `ayuda.ts`: `salidasModeloNelida(): Record<string, string>`, `DEFECTOS_NELIDA: [string, string][]`

- [ ] **Step 1: Agregar las respuestas del modelo falso de Nélida a las ayudas**

```ts
// al final de fabrica/test/escritor/ayuda.ts
/** Lo que "contesta el modelo" en cada paso para Nélida: su propio material (los capítulos, con el JSON de afuera vacío). */
export function salidasModeloNelida(): Record<string, string> {
  const c = carpetaNelida();
  const capitulo = (n: number) => `${c.leer(`salidas/capitulo_0${n}.md`).trim()}\n---\n{"afuera": []}`;
  return {
    '1-registro': c.leer('salidas/registro.json'),
    '2-plan': c.leer('salidas/plan.json'),
    dudas: '{"dudas": [{"id": "D01", "pregunta": "¿Cómo se llamaba la Negra, la amiga del barrio de Nélida?", "opciones": []}]}',
    '2h-armador-01': 'Las historias: la casa de Echesortu, la mercería con Raúl y la noche de la calculadora.',
    '2h-armador-02': 'Las historias: quedarse sola y la tarde del bastidor.',
    '3b-capitulo-01': capitulo(1),
    '3b-capitulo-02': capitulo(2),
    '3r-resumen-cap_1': 'Echesortu, la mercería con Raúl, la noche de la calculadora, la nena en el cajón.',
    '3r-resumen-cap_2': 'Muere Raúl, el mate amargo, el bastidor en el patio.',
    '3d-antes-de-cerrar': c.leer('salidas/antes_de_cerrar.md'),
    '3c-carta': c.leer('salidas/carta.md'),
    '3a-primera': c.leer('salidas/primera_pagina.md'),
    '3e-sus-frases': c.leer('salidas/sus_frases.json'),
    '4-hechos': '{"problemas": []}',
    '5c-veedor': '{"problemas": []}',
    '4-hechos-repaso': '{"problemas": []}',
    '3t-titulo-01': '{"titulo": "La persiana de madera", "por_que": "palabras del capítulo"}',
    '3t-titulo-02': '{"titulo": "El bastidor en la falda", "por_que": "palabras del capítulo"}',
  };
}
export const DEFECTOS_NELIDA: [string, string][] = [['6-arreglo-', '{"cambios": []}'], ['7-estilo-', '{"cambios": []}'], ['disputa-', '{"respalda": true}']];
```

- [ ] **Step 2: Escribir el test que falla**

```ts
// fabrica/test/escritor/etapa-a.test.ts
import { describe, expect, it } from 'vitest';
import { AlmacenMemoria } from '../../src/escritor/almacen/memoria.js';
import type { Carpeta } from '../../src/escritor/carpeta.js';
import { Ejecutor } from '../../src/escritor/ejecutor.js';
import { ModeloFalso } from '../../src/escritor/modelo/falso.js';
import { cargarSnapshot, type Contexto } from '../../src/escritor/orquestador/contexto.js';
import { etapaA } from '../../src/escritor/orquestador/etapa-a.js';
import { carpetaNelida, salidasModeloNelida } from './ayuda.js';

function armar(salidas: Record<string, string>, c: Carpeta = carpetaNelida(['entradas'])) {
  const modelo = new ModeloFalso(salidas);
  const almacen = new AlmacenMemoria();
  const lineas: string[] = [];
  const x: Contexto = { c, ej: new Ejecutor({ modelo, almacen }), almacen, log: (s) => lineas.push(s), usarLote: false };
  return { x, modelo, almacen, lineas };
}
const registroRoto = (): string => { const r = JSON.parse(salidasModeloNelida()['1-registro']); r.voz.frases = r.voz.frases.slice(0, 10); return JSON.stringify(r); };

describe('Etapa A', () => {
  it('registro, plan y dudas para la familia; deja la carpeta y los costos en el almacén', async () => {
    const { x, modelo, almacen } = armar(salidasModeloNelida());
    const r = await etapaA(x);
    expect(r).toMatchObject({ ok: true, capitulos: 2, dudas: [{ id: 'D01', tipo: 'nombre', pregunta: '¿Cómo se llamaba la Negra, la amiga del barrio de Nélida?' }] });
    expect(modelo.llamadas.map((p) => p.clave)).toEqual(['A/1-registro', 'A/2-plan', 'A/dudas']);
    expect(modelo.llamadas[0].maxTokens).toBe(128000);
    expect(JSON.parse(x.c.leer('salidas/dudas-familia.json')).dudas[0].id).toBe('D01');
    expect(await almacen.leer('dudas-familia.json')).toBe(x.c.leer('salidas/dudas-familia.json'));
    expect((await cargarSnapshot(almacen, 'A'))?.aObjeto()).toEqual(x.c.aObjeto());
    expect(JSON.parse((await almacen.leer('costos.json')) as string).filas).toHaveLength(3);
  });

  it('si el registro no pasa C14, reintenta con el error pegado al final', async () => {
    const { x, modelo } = armar({ ...salidasModeloNelida(), '1-registro': registroRoto(), '1-registro#2': salidasModeloNelida()['1-registro'] });
    expect((await etapaA(x)).ok).toBe(true);
    expect(modelo.llamadas.map((p) => p.clave)).toEqual(['A/1-registro', 'A/1-registro#2', 'A/2-plan', 'A/dudas']);
    const instr = modelo.llamadas[1].bloques[modelo.llamadas[1].bloques.length - 1];
    expect(instr).toContain('Tu respuesta anterior no pasó estos controles');
    expect(instr).toContain('C14 voz: 10 frases (van de 15 a 20)');
  });

  it('después de 2 reintentos sin pasar, corta y avisa', async () => {
    const { x, modelo } = armar({ ...salidasModeloNelida(), '1-registro': registroRoto() });
    expect(await etapaA(x)).toEqual({ ok: false, motivo: 'el registro no pasa C14 después de 2 reintentos' });
    expect(modelo.llamadas.map((p) => p.clave)).toEqual(['A/1-registro', 'A/1-registro#2', 'A/1-registro#3']);
  });

  it('si el registro y el plan ya estaban y pasan, no se llaman', async () => {
    const { x, modelo } = armar(salidasModeloNelida(), carpetaNelida());
    expect((await etapaA(x)).ok).toBe(true);
    expect(modelo.llamadas.map((p) => p.clave)).toEqual(['A/dudas']);
  });
});
```

- [ ] **Step 3: Correr el test y ver que falla**

Run: `cd fabrica && npx vitest run test/escritor/etapa-a.test.ts`
Expected: FAIL ("Failed to load url ../../src/escritor/orquestador/contexto.js").

- [ ] **Step 4: Escribir `contexto.ts` y `etapa-a.ts`**

```ts
// fabrica/src/escritor/orquestador/contexto.ts
// Lo que comparten las tres etapas: la carpeta, el ejecutor, el almacén y los reintentos de registro y plan
// (workflow-libro.js, `conReintentos`: si ya está y pasa, no se rehace; si no, hasta 2 reintentos con el error).
import { Carpeta } from '../carpeta.js';
import type { Almacen } from '../almacen/tipos.js';
import { controlar } from '../controles/correr.js';
import type { Ejecutor } from '../ejecutor.js';
import { salida } from '../lectura.js';
import { llamadaPlan, llamadaRegistro } from '../llamadas/armar.js';

export type Contexto = { c: Carpeta; ej: Ejecutor; almacen: Almacen; log: (s: string) => void; usarLote: boolean };
export type Etapa = 'A' | 'B' | 'C';

/** La carpeta entera al terminar una etapa: la siguiente arranca de acá (y un retomo también). */
export async function guardarSnapshot(x: Contexto, etapa: Etapa): Promise<void> {
  await x.almacen.escribir(`carpeta-${etapa}.json`, JSON.stringify(x.c.aObjeto()));
}

export async function cargarSnapshot(almacen: Almacen, etapa: Etapa): Promise<Carpeta | null> {
  const t = await almacen.leer(`carpeta-${etapa}.json`);
  return t === null ? null : new Carpeta(JSON.parse(t) as Record<string, string>);
}

export async function conReintentos(x: Contexto, paso: 'registro' | 'plan', prefijo: 'A/' | 'B/'): Promise<boolean> {
  const archivo = salida(paso === 'registro' ? 'registro.json' : 'plan.json');
  if (x.c.existe(archivo) && controlar(x.c, paso).codigo === 0) {
    x.log(`${paso}: ya estaba y pasa`);
    return true;
  }
  for (let i = 0; i <= 2; i++) {
    const error = i ? x.c.leer(`controles/${paso}.json`) : undefined;
    const llamada = paso === 'registro' ? llamadaRegistro(x.c, { error }) : llamadaPlan(x.c, { error });
    const texto = await x.ej.uno({ clave: `${prefijo}${llamada.nombre}${i ? `#${i + 1}` : ''}`, llamada, json: true, maxTokens: 128000 });
    x.c.escribir(archivo, texto);
    const r = controlar(x.c, paso);
    x.log(`${paso}: ${r.resumen.split('\n')[0]}`);
    if (r.codigo === 0) return true;
  }
  return false;
}
```

```ts
// fabrica/src/escritor/orquestador/etapa-a.ts
// Etapa A (spec): registro y plan (Opus, con sus controles y reintentos) y las dudas de datos para la
// familia. Después la familia revisa en el dashboard (eso es de Joaquín) y sigue la Etapa B.
import { leerJSON, parseJSONTolerante } from '../carpeta.js';
import { dudasDelRegistro, validarDudas, type DudaParaLaFamilia } from '../dudas.js';
import { TopeDeGasto } from '../ejecutor.js';
import { respuestas, salida } from '../lectura.js';
import { llamadaDudas } from '../llamadas/fabrica.js';
import { conReintentos, guardarSnapshot, type Contexto } from './contexto.js';

export type ResultadoEtapaA = { ok: true; capitulos: number; dudas: DudaParaLaFamilia[] } | { ok: false; motivo: string };

export async function etapaA(x: Contexto): Promise<ResultadoEtapaA> {
  if (!(await conReintentos(x, 'registro', 'A/'))) return { ok: false, motivo: 'el registro no pasa C14 después de 2 reintentos' };
  if (!(await conReintentos(x, 'plan', 'A/'))) return { ok: false, motivo: 'el plan no pasa C12/C13/C19/C20/C33 después de 2 reintentos' };
  const dudas = dudasDelRegistro(leerJSON(x.c, salida('registro.json')), respuestas(x.c));
  let paraFamilia: DudaParaLaFamilia[] = [];
  if (dudas.length) {
    const llamada = llamadaDudas(x.c, dudas);
    try {
      paraFamilia = validarDudas(dudas, parseJSONTolerante(await x.ej.uno({ clave: 'A/dudas', llamada, json: true })));
    } catch (err) {
      if (err instanceof TopeDeGasto) throw err;
      x.log(`dudas: ${(err as Error).message}; se piden otra vez`);
      try {
        paraFamilia = validarDudas(dudas, parseJSONTolerante(await x.ej.uno({ clave: 'A/dudas#2', llamada, json: true })));
      } catch (err2) {
        if (err2 instanceof TopeDeGasto) throw err2;
        return { ok: false, motivo: `las dudas para la familia no salieron: ${(err2 as Error).message}` };
      }
    }
  }
  const json = JSON.stringify({ dudas: paraFamilia }, null, 1);
  x.c.escribir(salida('dudas-familia.json'), json);
  await x.almacen.escribir('dudas-familia.json', json);
  await guardarSnapshot(x, 'A');
  await x.ej.guardarCostos();
  return { ok: true, capitulos: leerJSON(x.c, salida('plan.json')).capitulos.length, dudas: paraFamilia };
}
```

- [ ] **Step 5: Correr el test y el tipado**

Run: `cd fabrica && npx vitest run test/escritor/etapa-a.test.ts && npx tsc --noEmit -p .`
Expected: PASS y tsc sin errores.

- [ ] **Step 6: Commit**

```bash
git add fabrica/src/escritor/orquestador/contexto.ts fabrica/src/escritor/orquestador/etapa-a.ts fabrica/test/escritor/ayuda.ts fabrica/test/escritor/etapa-a.test.ts
git commit -m "escritor: Etapa A (registro y plan con reintentos, dudas de datos para la familia)" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 20: Etapa B (correcciones de la familia al registro)

**Files:**
- Create: `fabrica/src/escritor/orquestador/etapa-b.ts`
- Test: `fabrica/test/escritor/etapa-b.test.ts`

**Interfaces:**
- Consumes: Tasks 7, 16, 17 (`agregarConfirmados`, `CorreccionFamilia`), 18 (`llamadaCorreccion`, `aplicarCorreccion`), 19 (`Contexto`, `conReintentos`, `guardarSnapshot`).
- Produces: `type ResultadoEtapaB = { ok: true; corregido: 'nada' | 'barato' | 'opus' } | { ok: false; motivo: string }`, `etapaB(x: Contexto, correcciones: CorreccionFamilia[]): Promise<ResultadoEtapaB>`.

- [ ] **Step 1: Escribir el test que falla**

```ts
// fabrica/test/escritor/etapa-b.test.ts
import { describe, expect, it } from 'vitest';
import { AlmacenMemoria } from '../../src/escritor/almacen/memoria.js';
import { leerJSON } from '../../src/escritor/carpeta.js';
import { Ejecutor } from '../../src/escritor/ejecutor.js';
import { ModeloFalso } from '../../src/escritor/modelo/falso.js';
import type { Contexto } from '../../src/escritor/orquestador/contexto.js';
import { etapaB } from '../../src/escritor/orquestador/etapa-b.js';
import { carpetaNelida, salidasModeloNelida } from './ayuda.js';

const CORRECCION = { texto: 'La Negra se llamaba Ofelia Sánchez.', dudaId: 'D01' };
const CONFIRMADO = { texto: 'La Negra se llamaba Ofelia Sánchez.', usado_en: ['P04'] };

function armar(salidas: Record<string, string>) {
  const modelo = new ModeloFalso(salidas);
  const almacen = new AlmacenMemoria();
  const x: Contexto = { c: carpetaNelida(), ej: new Ejecutor({ modelo, almacen }), almacen, log: () => {}, usarLote: false };
  return { x, modelo, almacen };
}

describe('Etapa B', () => {
  it('sin correcciones no se llama a ningún modelo', async () => {
    const { x, modelo } = armar({});
    expect(await etapaB(x, [])).toEqual({ ok: true, corregido: 'nada' });
    expect(modelo.llamadas).toHaveLength(0);
  });

  it('con correcciones: el modelo barato las pasa al registro, C14 controla y el plan sigue', async () => {
    const reg = JSON.parse(salidasModeloNelida()['1-registro']);
    const negra = { ...reg.personas[3], nombre: 'Ofelia Sánchez', apodos: ['la Negra'] };
    const { x, modelo, almacen } = armar({ 'correccion-registro': JSON.stringify({ personas: [negra], confirmados: [CONFIRMADO] }) });
    expect(await etapaB(x, [CORRECCION])).toEqual({ ok: true, corregido: 'barato' });
    expect(modelo.llamadas.map((p) => [p.clave, p.modelo, p.esfuerzo])).toEqual([['B/correccion-registro', 'claude-sonnet-5-5', 'low']]);
    expect(leerJSON(x.c, 'salidas/registro.json').personas[3].nombre).toBe('Ofelia Sánchez');
    expect(x.c.leer('entradas/confirmado.xml')).toContain('- La Negra se llamaba Ofelia Sánchez.');
    expect(await almacen.leer('carpeta-B.json')).not.toBeNull();
  });

  it('si lo del barato no pasa C14, Opus rehace el registro y el plan', async () => {
    const reg = JSON.parse(salidasModeloNelida()['1-registro']);
    const { x, modelo } = armar({
      'correccion-registro': JSON.stringify({ confirmados: [] }),
      '1-registro': JSON.stringify({ ...reg, confirmados: [CONFIRMADO] }),
      '2-plan': salidasModeloNelida()['2-plan'],
    });
    expect(await etapaB(x, [CORRECCION])).toEqual({ ok: true, corregido: 'opus' });
    expect(modelo.llamadas.map((p) => [p.clave, p.modelo])).toEqual([['B/correccion-registro', 'claude-sonnet-5-5'], ['B/1-registro', 'claude-opus-5-5'], ['B/2-plan', 'claude-opus-5-5']]);
    expect(modelo.llamadas[1].bloques.join('\n')).toContain('<confirmado_por_el_narrador>');
  });
});
```

- [ ] **Step 2: Correr el test y ver que falla**

Run: `cd fabrica && npx vitest run test/escritor/etapa-b.test.ts`
Expected: FAIL ("Failed to load url ../../src/escritor/orquestador/etapa-b.js").

- [ ] **Step 3: Escribir `etapa-b.ts`**

```ts
// fabrica/src/escritor/orquestador/etapa-b.ts
// Etapa B (spec, decisión 4): las correcciones de la familia van a confirmado.xml (llegan a todos los
// pasos) y al registro con el modelo barato (tarea mecánica). C14 lo verifica; si falla, Opus rehace
// registro y plan. Sin correcciones, no se llama a ningún modelo.
import { leerJSON, parseJSONTolerante } from '../carpeta.js';
import { controlar } from '../controles/correr.js';
import { aplicarCorreccion } from '../correccion.js';
import { TopeDeGasto } from '../ejecutor.js';
import { salida } from '../lectura.js';
import { llamadaCorreccion } from '../llamadas/fabrica.js';
import { agregarConfirmados, type CorreccionFamilia } from '../material/a-carpeta.js';
import { conReintentos, guardarSnapshot, type Contexto } from './contexto.js';

export type ResultadoEtapaB = { ok: true; corregido: 'nada' | 'barato' | 'opus' } | { ok: false; motivo: string };

async function terminar(x: Contexto, r: ResultadoEtapaB): Promise<ResultadoEtapaB> {
  await guardarSnapshot(x, 'B');
  await x.ej.guardarCostos();
  return r;
}

export async function etapaB(x: Contexto, correcciones: CorreccionFamilia[]): Promise<ResultadoEtapaB> {
  if (!agregarConfirmados(x.c, correcciones) && !correcciones.some((k) => k.texto.trim())) return terminar(x, { ok: true, corregido: 'nada' });
  try {
    const texto = await x.ej.uno({ clave: 'B/correccion-registro', llamada: llamadaCorreccion(x.c), json: true, rol: 'barato' });
    x.c.escribir(salida('registro.json'), JSON.stringify(aplicarCorreccion(leerJSON(x.c, salida('registro.json')), parseJSONTolerante(texto)), null, 1));
    const r = controlar(x.c, 'registro');
    x.log(`registro corregido (barato): ${r.resumen.split('\n')[0]}`);
    if (r.codigo === 0) {
      if (await conReintentos(x, 'plan', 'B/')) return terminar(x, { ok: true, corregido: 'barato' });
      return terminar(x, { ok: false, motivo: 'el plan no pasa sus controles con el registro corregido después de 2 reintentos' });
    }
  } catch (err) {
    if (err instanceof TopeDeGasto) throw err;
    x.log(`la corrección barata no sirvió (${(err as Error).message}); rehace Opus`);
  }
  x.c.borrar(salida('registro.json'));
  x.c.borrar(salida('plan.json'));
  if (!(await conReintentos(x, 'registro', 'B/'))) return terminar(x, { ok: false, motivo: 'el registro no pasa C14 después de 2 reintentos (Etapa B)' });
  if (!(await conReintentos(x, 'plan', 'B/'))) return terminar(x, { ok: false, motivo: 'el plan no pasa sus controles después de 2 reintentos (Etapa B)' });
  return terminar(x, { ok: true, corregido: 'opus' });
}
```

Nota: la condición de arriba devuelve `nada` solo si no hay ninguna corrección con texto; si las correcciones ya estaban en `confirmado.xml` (un retomo), igual se sigue: la llamada barata sale de la memoria.

- [ ] **Step 4: Correr el test y el tipado**

Run: `cd fabrica && npx vitest run test/escritor/etapa-b.test.ts && npx tsc --noEmit -p .`
Expected: PASS y tsc sin errores.

- [ ] **Step 5: Commit**

```bash
git add fabrica/src/escritor/orquestador/etapa-b.ts fabrica/test/escritor/etapa-b.test.ts
git commit -m "escritor: Etapa B (correcciones de la familia con el modelo barato, C14 y Opus si falla)" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 21: Etapa C (el libro, sin lectura final; también un solo capítulo)

**Files:**
- Create: `fabrica/src/escritor/orquestador/etapa-c.ts`
- Modify: `fabrica/test/escritor/ayuda.ts` (agrega `carpetaParaC`)
- Test: `fabrica/test/escritor/etapa-c.test.ts`

**Interfaces:**
- Consumes: Tasks 1, 4, 7–11, 16, 18, 19 (`controlar`, `controlarAfuera`, `juntar`, `armar`, `aplicar`, `aplicarEstiloPieza`, `estado`, `Disputa`, `informe`, todas las `llamadaX`, `susFrasesMd`, `armarLibro`, `llamadaDisputa`, `Encargo`, `ErrorJSON`, `TopeDeGasto`, `Contexto`, `guardarSnapshot`).
- Produces: `type OpcionesEtapaC = { soloCapitulo?: number }`, `type ResultadoEtapaC = { libro: string; informe: string; capitulos: number; arreglados: string[]; disputas: number; controlesFinal: string; usd: number }`, `etapaC(x: Contexto, o?: OpcionesEtapaC): Promise<ResultadoEtapaC>`. Grupos de lote: `C-revision`, `C-arreglos`, `C-disputas`, `C-disputas-repaso`, `C-estilo-1`, `C-estilo-2`, `C-titulos`. Deja en el almacén `libro.md`, `informe.md`, `carpeta-C.json`, `costos.json`. En `ayuda.ts`: `carpetaParaC(): Carpeta`.

El recorrido es el de `workflow-libro.js` con `{ puro: true, soloHechos: true }`, desde la línea 63, en el mismo orden, sin la lectura final (línea 165).

- [ ] **Step 1: Agregar `carpetaParaC` a las ayudas**

```ts
// al final de fabrica/test/escritor/ayuda.ts
/** Lo que deja la Etapa B para la C: entradas, registro y plan de Nélida. */
export function carpetaParaC(): Carpeta {
  const c = carpetaNelida(['entradas']);
  const s = carpetaNelida();
  c.escribir('salidas/registro.json', s.leer('salidas/registro.json'));
  c.escribir('salidas/plan.json', s.leer('salidas/plan.json'));
  return c;
}
```

- [ ] **Step 2: Escribir el test que falla**

```ts
// fabrica/test/escritor/etapa-c.test.ts
import { describe, expect, it } from 'vitest';
import { AlmacenMemoria } from '../../src/escritor/almacen/memoria.js';
import type { Carpeta } from '../../src/escritor/carpeta.js';
import { Ejecutor } from '../../src/escritor/ejecutor.js';
import { ModeloFalso } from '../../src/escritor/modelo/falso.js';
import type { Contexto } from '../../src/escritor/orquestador/contexto.js';
import { etapaC } from '../../src/escritor/orquestador/etapa-c.js';
import { carpetaNelida, carpetaParaC, DEFECTOS_NELIDA, salidasModeloNelida } from './ayuda.js';

function armarC(o: { carpeta?: Carpeta; salidas?: Record<string, string> } = {}) {
  const modelo = new ModeloFalso(o.salidas ?? salidasModeloNelida(), DEFECTOS_NELIDA);
  const almacen = new AlmacenMemoria();
  const lineas: string[] = [];
  const x: Contexto = { c: o.carpeta ?? carpetaParaC(), ej: new Ejecutor({ modelo, almacen }), almacen, log: (s) => lineas.push(s), usarLote: false };
  return { x, modelo, almacen, lineas };
}

const ESCRITURA = ['C/2h-armador-01', 'C/3b-capitulo-01', 'C/3r-resumen-cap_1', 'C/2h-armador-02', 'C/3b-capitulo-02', 'C/3r-resumen-cap_2', 'C/3d-antes-de-cerrar', 'C/3c-carta', 'C/3a-primera', 'C/3e-sus-frases'];
const PIEZAS = ['primera_pagina', 'cap_1', 'cap_2', 'antes_de_cerrar', 'carta'];

describe('Etapa C', () => {
  it('escribe el libro entero en el orden del v5.5 (sin lectura final) y lo deja en el almacén', async () => {
    const { x, modelo, almacen } = armarC();
    const r = await etapaC(x);
    const claves = modelo.llamadas.map((p) => p.clave);
    expect(claves.slice(0, 10)).toEqual(ESCRITURA);
    expect(new Set(claves.slice(10))).toEqual(new Set([
      'C/4-hechos', 'C/5c-veedor',
      ...PIEZAS.map((p) => `C/7-estilo-${p}`), ...PIEZAS.map((p) => `C/7-estilo-${p}-2`),
      'C/3t-titulo-01', 'C/3t-titulo-02',
    ]));
    expect(claves.some((k) => k.includes('lectura'))).toBe(false);
    expect(r.libro.split('\n').filter((l) => l.startsWith('# '))).toEqual(['# sumá vos', '# I · La persiana de madera', '# II · El bastidor en la falda', '# Antes de cerrar', '# Sus frases', '# Para los míos']);
    expect(r.libro).toContain('Una noche la cuenta no daba.');
    expect(r.libro).not.toContain('[[R');
    expect(r).toMatchObject({ capitulos: 2, arreglados: [], disputas: 0 });
    expect(r.usd).toBe(Math.round(claves.length * 0.006 * 1e6) / 1e6);
    for (const k of ['libro.md', 'informe.md', 'carpeta-C.json', 'costos.json']) expect(await almacen.leer(k), k).not.toBeNull();
    expect(x.c.existe('sin-revision/capitulo_01.md') && x.c.existe('sin-estilo/carta.md')).toBe(true);
  });

  it('un problema de hechos va al arreglo (una ronda), se aplica y se repasa', async () => {
    const salidas = {
      ...salidasModeloNelida(),
      '4-hechos': JSON.stringify({ problemas: [{ pieza: 'cap_1', tipo: 'fecha', frase: 'Marcela nació en el 80', material: 'R04', ids: ['R04'], correccion: 'Marcela nació en el 80' }] }),
      '6-arreglo-cap_1': JSON.stringify({ cambios: [{ problema: 1, resultado: 'cambiado', antes: 'Marcela nació en el 80, y la nena', despues: 'Marcela nació en el 80. La nena' }] }),
    };
    const { x, modelo } = armarC({ salidas });
    const r = await etapaC(x);
    expect(modelo.llamadas.map((p) => p.clave)).toEqual(expect.arrayContaining(['C/6-arreglo-cap_1', 'C/4-hechos-repaso']));
    expect(r.arreglados).toEqual(['cap_1']);
    expect(r.libro).toContain('Marcela nació en el 80. La nena dormía');
    expect(x.c.existe('controles/c9-cap_1.json') && x.c.existe('controles/piezas-1.json')).toBe(true);
  });

  it('un solo capítulo (la prueba paga): solo sus llamadas, más hechos y veedor sobre el libro', async () => {
    const { x, modelo } = armarC({ carpeta: carpetaNelida() });
    await etapaC(x, { soloCapitulo: 2 });
    expect(new Set(modelo.llamadas.map((p) => p.clave))).toEqual(new Set([
      'C/2h-armador-02', 'C/3b-capitulo-02', 'C/3r-resumen-cap_2', 'C/4-hechos', 'C/5c-veedor', 'C/7-estilo-cap_2', 'C/7-estilo-cap_2-2', 'C/3t-titulo-02',
    ]));
    expect(x.c.leer('libro.md')).toContain('# II · El bastidor en la falda');
  });
});
```

- [ ] **Step 3: Correr el test y ver que falla**

Run: `cd fabrica && npx vitest run test/escritor/etapa-c.test.ts`
Expected: FAIL ("Failed to load url ../../src/escritor/orquestador/etapa-c.js").

- [ ] **Step 4: Escribir `etapa-c.ts`**

```ts
// fabrica/src/escritor/orquestador/etapa-c.ts
// Etapa C: el libro con el escritor v5.5, el recorrido de fabrica/scripts/escritor-v55/workflow-libro.js
// con { puro: true, soloHechos: true } (así corrió el libro aprobado), paso por paso y en el mismo orden.
// Sin la lectura final (spec, ahorro 4). Las fases paralelas van por lote (Batch) si `x.usarLote`.
// Con `soloCapitulo`: lo que workflow-tres.js hacía para la prueba corta, para un capítulo.
import { controlarAfuera } from '../controles/afuera.js';
import { aplicar, armar, juntar } from '../controles/arreglos.js';
import { controlar } from '../controles/correr.js';
import { estado, type Disputa } from '../controles/estado.js';
import { aplicarEstiloPieza } from '../controles/estilo.js';
import { informe } from '../controles/informe.js';
import { ErrorJSON, TopeDeGasto, type Encargo } from '../ejecutor.js';
import { salida } from '../lectura.js';
import { llamadaAntes, llamadaArmador, llamadaArreglo, llamadaCapitulo, llamadaCarta, llamadaEstilo, llamadaHechos, llamadaPrimera, llamadaResumen, llamadaSusFrases, llamadaTitulo, llamadaVeedor, type Llamada } from '../llamadas/armar.js';
import { armarLibro, susFrasesMd } from '../llamadas/codigo.js';
import { llamadaDisputa } from '../llamadas/fabrica.js';
import { archivoDe } from '../texto.js';
import { guardarSnapshot, type Contexto } from './contexto.js';

export type OpcionesEtapaC = { soloCapitulo?: number };
export type ResultadoEtapaC = { libro: string; informe: string; capitulos: number; arreglados: string[]; disputas: number; controlesFinal: string; usd: number };

const nn = (n: number): string => String(n).padStart(2, '0');
const encargo = (l: Llamada, json: boolean, sufijo = ''): Encargo => ({ clave: `C/${l.nombre}${sufijo}`, llamada: l, json });
const copiarMd = (x: Contexto, a: string): void => { for (const f of x.c.listar('salidas').filter((f) => f.endsWith('.md'))) x.c.copiar(salida(f), `${a}/${f}`); };

async function disputas(x: Contexto, ds: Disputa[], grupo: string): Promise<void> {
  if (!ds.length) return;
  const docs = JSON.parse(x.c.leer('llamadas/4-hechos.docs.json')) as string[];
  const r = await x.ej.varios(ds.map((d) => encargo(llamadaDisputa(docs, d), true)), { lote: x.usarLote, grupo });
  for (const d of ds) {
    const t = r.textos.get(`C/disputa-${d.clave}`);
    if (t !== undefined) x.c.escribir(`arreglos/disputa-${d.clave}.json`, t);
    else x.log(`disputa ${d.clave}: sin respuesta válida; queda "sin decidir" en el informe`);
  }
}

export async function etapaC(x: Contexto, o: OpcionesEtapaC = {}): Promise<ResultadoEtapaC> {
  const { c, ej, log } = x;
  const caps = estado(c, 'capitulos') as { n: number[]; antes: boolean };
  const solo = o.soloCapitulo;
  if (solo !== undefined && !caps.n.includes(solo)) throw new Error(`el plan no tiene el capítulo ${solo}`);
  const aEscribir = solo !== undefined ? [solo] : caps.n;
  log(`plan: ${caps.n.length} capítulos${caps.antes ? ' + Antes de cerrar' : ''}${solo !== undefined ? ` (se escribe solo el ${solo})` : ''}`);

  // ---------- 3: escritura, en orden (workflow-libro.js:71-101) ----------
  for (const n of aEscribir) {
    c.escribir(salida(`historias/cap_${n}.md`), await ej.uno(encargo(llamadaArmador(c, n), false)));
    c.escribir(salida(archivoDe(`cap_${n}`)), await ej.uno(encargo(llamadaCapitulo(c, n), false)));
    let af = controlarAfuera(c, n);
    log(af.resumen);
    if (af.codigo === 3) {
      c.escribir(salida(archivoDe(`cap_${n}`)), await ej.uno(encargo(llamadaCapitulo(c, n, { error: c.leer(`controles/afuera-cap_${n}.json`) }), false, '#2')));
      af = controlarAfuera(c, n);
      log(af.resumen);
    }
    c.escribir(salida(`resumenes/cap_${n}.md`), await ej.uno(encargo(llamadaResumen(c, `cap_${n}`), false)));
  }
  if (solo === undefined) {
    const antes = caps.antes ? llamadaAntes(c) : null;
    if (antes) c.escribir(salida('antes_de_cerrar.md'), await ej.uno(encargo(antes, false)));
    c.escribir(salida('carta.md'), await ej.uno(encargo(llamadaCarta(c), false)));
    c.escribir(salida('primera_pagina.md'), await ej.uno(encargo(llamadaPrimera(c), false)));
    const rp = controlar(c, 'repite', 'primera_pagina');
    log(rp.resumen);
    if (rp.codigo === 2) {
      c.escribir(salida('primera_pagina.md'), await ej.uno(encargo(llamadaPrimera(c, { error: c.leer('controles/repite-primera_pagina.json') }), false, '#2')));
      log(controlar(c, 'repite', 'primera_pagina').resumen);
    }
    c.escribir(salida('sus_frases.json'), await ej.uno(encargo(llamadaSusFrases(c), true)));
    log(susFrasesMd(c));
  }
  log(`controles de piezas: ${controlar(c, 'piezas').resumen.split('\n')[0]}`);

  // ---------- 4 y 5c: revisión, solo hechos, en paralelo (workflow-libro.js:104-116) ----------
  copiarMd(x, 'sin-revision');
  const hechos = llamadaHechos(c, { repaso: false });
  c.escribir('llamadas/4-hechos.docs.json', JSON.stringify(hechos.docs));
  const rev = await ej.varios([encargo(hechos, true), encargo(llamadaVeedor(c), true)], { lote: x.usarLote, grupo: 'C-revision' });
  for (const [clave, archivo] of [['C/4-hechos', 'hechos.json'], ['C/5c-veedor', 'veedor.json']] as const) {
    const t = rev.textos.get(clave);
    if (t !== undefined) c.escribir(salida(archivo), t);
    else log(`${clave}: sin respuesta válida (${rev.fallas.get(clave) ?? 'sin detalle'}); se sigue sin esa lista`);
  }

  // ---------- 6: juntar y UNA ronda de arreglos (workflow-libro.js:119-138) ----------
  log(`juntar:\n${juntar(c, { soloHechos: true })}`);
  let aArreglar = (estado(c, 'arreglos') as { piezas: string[] }).piezas;
  if (solo !== undefined) aArreglar = aArreglar.filter((p) => p === `cap_${solo}`);
  const arr = await ej.varios(aArreglar.map((p) => encargo(llamadaArreglo(c, p), true)), { lote: x.usarLote, grupo: 'C-arreglos' });
  const arreglados: string[] = [];
  for (const p of aArreglar) {
    const t = arr.textos.get(`C/6-arreglo-${p}`);
    if (t === undefined) { log(`arreglo ${p}: sin respuesta válida (${arr.fallas.get(`C/6-arreglo-${p}`) ?? 'sin detalle'}); sus problemas quedan abiertos`); continue; }
    c.escribir(`arreglos/cambios-${p}.json`, t);
    arreglados.push(p);
  }
  c.copiar('controles/piezas.json', 'controles/piezas-1.json');
  const c9: string[] = [];
  for (const p of arreglados) {
    log(armar(c, p));
    c9.push(controlar(c, 'arreglo', p).resumen);
    log(aplicar(c, p));
  }
  if (c9.length) log(c9.join('\n'));
  const disp1 = (estado(c, 'disputas') as { disputas: Disputa[] }).disputas;
  await disputas(x, disp1, 'C-disputas');

  // ---------- repaso de hechos, C26 (workflow-libro.js:142-147) ----------
  if (arreglados.length) {
    try {
      c.escribir(salida('hechos-repaso.json'), await ej.uno(encargo(llamadaHechos(c, { repaso: true }), true)));
      log(controlar(c, 'repaso').resumen);
      await disputas(x, (estado(c, 'repaso') as { disputas: Disputa[] }).disputas, 'C-disputas-repaso');
    } catch (err) {
      if (!(err instanceof ErrorJSON)) throw err;
      log(`repaso de hechos: ${err.message}; se sigue sin repaso`);
    }
  }

  // ---------- 7: corrector de estilo, dos pasadas (workflow-libro.js:149-158) ----------
  const PIEZAS = solo !== undefined ? [`cap_${solo}`] : ['primera_pagina', ...caps.n.map((n) => `cap_${n}`), ...(caps.antes ? ['antes_de_cerrar'] : []), 'carta'];
  copiarMd(x, 'sin-estilo');
  for (const ronda of [1, 2] as const) {
    const sufijo = ronda === 2 ? '-2' : '';
    const r = await ej.varios(PIEZAS.map((p) => encargo(llamadaEstilo(c, p, ronda), true)), { lote: x.usarLote, grupo: `C-estilo-${ronda}` });
    for (const p of PIEZAS) {
      const t = r.textos.get(`C/7-estilo-${p}${sufijo}`);
      if (t !== undefined) c.escribir(`estilo/cambios-${p}${sufijo}.json`, t);
    }
    log(PIEZAS.map((p) => aplicarEstiloPieza(c, p, ronda)).join('\n'));
  }

  // ---------- 3t: títulos (workflow-libro.js:160) ----------
  const conTitulo = solo !== undefined ? [solo] : caps.n;
  const tit = await ej.varios(conTitulo.map((n) => encargo(llamadaTitulo(c, n), true)), { lote: x.usarLote, grupo: 'C-titulos' });
  for (const n of conTitulo) {
    const t = tit.textos.get(`C/3t-titulo-${nn(n)}`);
    if (t !== undefined) c.escribir(salida(`titulos/cap_${n}.json`), t);
  }

  // ---------- cierre: controles, libro e informe; sin lectura final (workflow-libro.js:166-170) ----------
  const fin = controlar(c, 'piezas');
  log(armarLibro(c));
  const inf = informe(c);
  c.escribir('informe.md', inf);
  await x.almacen.escribir('libro.md', c.leer('libro.md'));
  await x.almacen.escribir('informe.md', inf);
  await guardarSnapshot(x, 'C');
  await ej.guardarCostos();
  return { libro: c.leer('libro.md'), informe: inf, capitulos: caps.n.length, arreglados, disputas: disp1.length, controlesFinal: fin.resumen.split('\n')[0], usd: ej.gastado };
}
```

(`TopeDeGasto` queda importado para dejar explícito que no se ataja en ningún lado de la etapa: corta el libro. Si `tsc` lo marca como no usado, se saca el import y se deja el comentario de cabecera.)

- [ ] **Step 5: Correr el test y el tipado**

Run: `cd fabrica && npx vitest run test/escritor/etapa-c.test.ts && npx tsc --noEmit -p .`
Expected: PASS y tsc sin errores.

- [ ] **Step 6: Commit**

```bash
git add fabrica/src/escritor/orquestador/etapa-c.ts fabrica/test/escritor/ayuda.ts fabrica/test/escritor/etapa-c.test.ts
git commit -m "escritor: Etapa C, el libro con el recorrido del v5.5 (sin lectura final) y la prueba de un capítulo" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 22: Cortar y retomar sin repagar, Batch en la Etapa C, y la corrida real de Joaquín

**Files:**
- Modify: `fabrica/test/escritor/ayuda.ts` (agrega `salidasDeCorrida`)
- Test: `fabrica/test/escritor/retomar.test.ts`
- Test: `fabrica/test/escritor/corrida-joaquin.test.ts`

**Interfaces:**
- Consumes: Tasks 13, 14, 16, 21 (`etapaC`; de `ayuda.ts`: `carpetaParaC`, `deDisco`, `salidasModeloNelida`, `DEFECTOS_NELIDA`).
- Produces: en `ayuda.ts`: `salidasDeCorrida(dir: string): Record<string, string>`.

- [ ] **Step 1: Agregar `salidasDeCorrida` a las ayudas**

En `ayuda.ts` (con `existsSync` sumado al import de `node:fs`):

```ts
/**
 * Las respuestas del modelo en la corrida real del v5.5 (la carpeta escritor-v5-5 del libro de Joaquín),
 * por clave. Los capítulos: el texto que dejó afuera.mjs (sin-revision/) más el JSON "afuera" que guardó
 * controles/afuera-cap_N.json, que es lo que había devuelto el novelista.
 */
export function salidasDeCorrida(dir: string): Record<string, string> {
  const leer = (r: string) => readFileSync(path.join(dir, r), 'utf8');
  const hay = (r: string) => existsSync(path.join(dir, r));
  const out: Record<string, string> = { '1-registro': leer('salidas/registro.json'), '2-plan': leer('salidas/plan.json') };
  for (const { n } of JSON.parse(out['2-plan']).capitulos as { n: number }[]) {
    const nn = String(n).padStart(2, '0');
    out[`2h-armador-${nn}`] = leer(`salidas/historias/cap_${n}.md`);
    out[`3b-capitulo-${nn}`] = `${leer(`sin-revision/capitulo_${nn}.md`).trimEnd()}\n---\n${JSON.stringify({ afuera: JSON.parse(leer(`controles/afuera-cap_${n}.json`)).afuera })}`;
    out[`3r-resumen-cap_${n}`] = leer(`salidas/resumenes/cap_${n}.md`);
    out[`3t-titulo-${nn}`] = leer(`salidas/titulos/cap_${n}.json`);
  }
  const sueltas: [string, string][] = [['3d-antes-de-cerrar', 'sin-revision/antes_de_cerrar.md'], ['3c-carta', 'sin-revision/carta.md'], ['3a-primera', 'sin-revision/primera_pagina.md'], ['3e-sus-frases', 'salidas/sus_frases.json'], ['4-hechos', 'salidas/hechos.json'], ['5c-veedor', 'salidas/veedor.json'], ['4-hechos-repaso', 'salidas/hechos-repaso.json']];
  for (const [clave, r] of sueltas) if (hay(r)) out[clave] = leer(r);
  for (const f of readdirSync(path.join(dir, 'arreglos'))) {
    const cambio = f.match(/^cambios-(.+)\.json$/);
    if (cambio) out[`6-arreglo-${cambio[1]}`] = leer(`arreglos/${f}`);
    const disputa = f.match(/^disputa-(.+)\.json$/);
    if (disputa) out[`disputa-${disputa[1]}`] = leer(`arreglos/${f}`);
  }
  for (const f of readdirSync(path.join(dir, 'estilo'))) {
    const m = f.match(/^cambios-(.+)\.json$/);
    if (m) out[`7-estilo-${m[1]}`] = leer(`estilo/${f}`);
  }
  return out;
}
```

- [ ] **Step 2: Escribir los tests que fallan**

```ts
// fabrica/test/escritor/retomar.test.ts
// Si el proceso se corta a mitad del libro, volver a correr la etapa no paga de nuevo lo que ya se pagó
// y llega al mismo libro. Y con lote (Batch), el libro es el mismo y lo que el lote devuelve mal va sin lote.
import { describe, expect, it } from 'vitest';
import { AlmacenMemoria } from '../../src/escritor/almacen/memoria.js';
import { Ejecutor } from '../../src/escritor/ejecutor.js';
import { LoteFalso, ModeloFalso } from '../../src/escritor/modelo/falso.js';
import { ErrorDelModelo, type Modelo, type PedidoModelo } from '../../src/escritor/modelo/tipos.js';
import type { Contexto } from '../../src/escritor/orquestador/contexto.js';
import { etapaC } from '../../src/escritor/orquestador/etapa-c.js';
import { carpetaParaC, DEFECTOS_NELIDA, salidasModeloNelida } from './ayuda.js';

const falso = () => new ModeloFalso(salidasModeloNelida(), DEFECTOS_NELIDA);

describe('cortar y retomar', () => {
  it('el retomo no vuelve a llamar lo que ya estaba pagado y llega al mismo libro', async () => {
    const referencia = falso();
    const almacenRef = new AlmacenMemoria();
    const libro = (await etapaC({ c: carpetaParaC(), ej: new Ejecutor({ modelo: referencia, almacen: almacenRef }), almacen: almacenRef, log: () => {}, usarLote: false })).libro;

    const almacen = new AlmacenMemoria();
    const base = falso();
    let quedan = 7;
    const seCorta: Modelo = { llamar: async (p: PedidoModelo) => { if (quedan-- <= 0) throw new ErrorDelModelo('se cortó la luz', false); return base.llamar(p); } };
    await expect(etapaC({ c: carpetaParaC(), ej: new Ejecutor({ modelo: seCorta, almacen }), almacen, log: () => {}, usarLote: false })).rejects.toThrow('se cortó la luz');
    const pagadas = base.llamadas.map((p) => p.clave);
    expect(pagadas).toHaveLength(7);

    const segundo = falso();
    const ej = new Ejecutor({ modelo: segundo, almacen });
    const r = await etapaC({ c: carpetaParaC(), ej, almacen, log: () => {}, usarLote: false });
    expect(r.libro).toBe(libro);
    expect(segundo.llamadas.map((p) => p.clave).filter((k) => pagadas.includes(k))).toEqual([]);
    expect(segundo.llamadas).toHaveLength(referencia.llamadas.length - 7);
    expect(ej.filas.filter((f) => f.de_memoria)).toHaveLength(7);
  });
});

describe('Etapa C con lote', () => {
  it('mismo libro; las fases paralelas van por lote y lo que vuelve mal se repite sin lote', async () => {
    const sinLote = new AlmacenMemoria();
    const libro = (await etapaC({ c: carpetaParaC(), ej: new Ejecutor({ modelo: falso(), almacen: sinLote }), almacen: sinLote, log: () => {}, usarLote: false })).libro;

    const enLote = falso();
    const directo = falso();
    const lote = new LoteFalso(enLote, new Set(['7-estilo-carta']));
    const almacen = new AlmacenMemoria();
    const ej = new Ejecutor({ modelo: directo, lote, almacen });
    const x: Contexto = { c: carpetaParaC(), ej, almacen, log: () => {}, usarLote: true };
    expect((await etapaC(x)).libro).toBe(libro);
    expect(lote.grupos).toEqual(['C-revision', 'C-estilo-1', 'C-estilo-2', 'C-titulos']);
    expect(directo.llamadas.map((p) => p.clave)).toContain('C/7-estilo-carta');
    expect(directo.llamadas.map((p) => p.clave)).not.toContain('C/4-hechos');
    expect(ej.filas.filter((f) => f.lote).length).toBe(enLote.llamadas.length);
    expect(enLote.llamadas.map((p) => p.clave)).not.toContain('C/7-estilo-carta');
  });
});
```

```ts
// fabrica/test/escritor/corrida-joaquin.test.ts
// La corrida real del v5.5 (libro de Joaquín, 06/10), otra vez, con un modelo falso que devuelve sus
// respuestas guardadas: la fábrica tiene que llegar al mismo libro.md y a los mismos archivos de control,
// paso por paso. La carpeta tiene la vida de un narrador real y no está en el repo: el test corre solo con
//   ESCRITOR_V55_CORRIDA="C:/Users/Naza/Desktop/VITACORA FAMILIAR-v3/fabrica/prueba-v3-joaquin/escritor-v5-5"
import { readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { AlmacenMemoria } from '../../src/escritor/almacen/memoria.js';
import { Ejecutor } from '../../src/escritor/ejecutor.js';
import { ModeloFalso } from '../../src/escritor/modelo/falso.js';
import { etapaC } from '../../src/escritor/orquestador/etapa-c.js';
import { deDisco, salidasDeCorrida } from './ayuda.js';

const CORRIDA = process.env.ESCRITOR_V55_CORRIDA;

describe.skipIf(!CORRIDA)('la corrida v5.5 de Joaquín, con el modelo falso', () => {
  it('llega al mismo libro.md y a los mismos controles, arreglos y estilo', async () => {
    const dir = CORRIDA as string;
    const leer = (r: string) => readFileSync(path.join(dir, r), 'utf8').replace(/\r\n/g, '\n');
    const c = deDisco(dir, ['entradas']);
    c.escribir('salidas/registro.json', leer('salidas/registro.json'));
    c.escribir('salidas/plan.json', leer('salidas/plan.json'));
    const almacen = new AlmacenMemoria();
    const modelo = new ModeloFalso(salidasDeCorrida(dir));
    await etapaC({ c, ej: new Ejecutor({ modelo, almacen, topeUsd: 1e9 }), almacen, log: () => {}, usarLote: false });

    const de = (sub: string, re: RegExp) => readdirSync(path.join(dir, sub)).filter((f) => re.test(f)).map((f) => `${sub}/${f}`);
    const rutas = [
      ...de('pendientes', /\.json$/),
      ...de('controles', /^(afuera-cap_|c9-|repite-|piezas|repaso)/),
      ...de('arreglos', /^(problemas-|respuesta-)/),
      ...de('estilo', /^(aplicado-|antes-)/),
      ...de('salidas', /\.md$/),
      'libro.md',
    ];
    for (const r of rutas) expect(c.leer(r), r).toBe(leer(r));
  });
});
```

- [ ] **Step 3: Correr los tests (sin la corrida, y con la corrida)**

Run: `cd fabrica && npx vitest run test/escritor/retomar.test.ts test/escritor/corrida-joaquin.test.ts test/escritor/etapa-c.test.ts`
Expected: PASS (`corrida-joaquin` aparece como "skipped").

Run (PowerShell): `cd fabrica; $env:ESCRITOR_V55_CORRIDA = "C:/Users/Naza/Desktop/VITACORA FAMILIAR-v3/fabrica/prueba-v3-joaquin/escritor-v5-5"; npx vitest run test/escritor/corrida-joaquin.test.ts; Remove-Item Env:ESCRITOR_V55_CORRIDA`
Expected: PASS (1 test). Si un archivo difiere, el mensaje del `expect` dice cuál (`r`). Se busca la causa en el port (comparar con el `.mjs` de esa línea); **no** se cambia el test ni se excluye un archivo sin el OK de Naza. Si la diferencia viene de la corrida misma (un archivo tocado a mano después de correr), se anota en el informe de la task.

- [ ] **Step 4: Commit**

```bash
git add fabrica/test/escritor/ayuda.ts fabrica/test/escritor/retomar.test.ts fabrica/test/escritor/corrida-joaquin.test.ts
git commit -m "escritor: cortar y retomar sin repagar, Batch en la Etapa C, y la corrida real del v5.5 reproducida paso por paso" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 23: La salida hacia la plantilla de producción (libro, idioma y «Su voz»)

**Files:**
- Create: `fabrica/src/escritor/salida/plantilla.ts`
- Modify: `fabrica/src/libro/plantilla-html.ts:192-194` (`extraerFraseHeroe`), `:1079-1107` (parámetro `idioma`), `:1121` (sección Sus frases), `:1148` (`<html lang>`)
- Test: `fabrica/test/escritor/salida.test.ts`

**Interfaces:**
- Consumes: Tasks 1, 4, 11 (`leerJSON`, `marcas`, `piezaDeR`, `planConR`, `idioma`, `nombreDePila`, `piezas`, `salida`, `armarLibro`); `FrasesJson`, `FraseCandidata`, `FRASES_POR_CAPITULO` de `fabrica/src/libro/frases.ts`; `construirHtmlLibro` de `fabrica/src/libro/plantilla-html.ts`.
- Produces:
  - `type ParaPlantilla = { titulo: string; indice: string[]; libroMarkdown: string }`, `libroParaPlantilla(libroMd: string): ParaPlantilla` (el título del libro sale aparte; la primera página queda sin encabezado; el índice son los `# I · Título`)
  - `paraPlantilla(c: Carpeta): ParaPlantilla & { nombreNarrador: string; idioma: IdiomaLibro }`
  - `type FuenteDeFrase = { respuestaId: string | null; preguntaOrden: number }`, `frasesParaSuVoz(c: Carpeta, a: { narradorId: string; pedidoId: string; fuentes: Record<string, FuenteDeFrase> }): FrasesJson`
  - `construirHtmlLibro` acepta `idioma?: 'es' | 'ca'` (default `'es'`) y reconoce «Les seves frases» como la página de frases.

- [ ] **Step 1: Escribir el test que falla**

```ts
// fabrica/test/escritor/salida.test.ts
import { describe, expect, it } from 'vitest';
import { frasesParaSuVoz, libroParaPlantilla, paraPlantilla } from '../../src/escritor/salida/plantilla.js';
import { armarLibro } from '../../src/escritor/llamadas/codigo.js';
import { construirHtmlLibro } from '../../src/libro/plantilla-html.js';
import { carpetaNelida } from './ayuda.js';

function conLibro(idiomaFicha = '') {
  const c = carpetaNelida();
  if (idiomaFicha) c.escribir('entradas/ficha.xml', c.leer('entradas/ficha.xml').replace('</ficha>', `${idiomaFicha}\n</ficha>`));
  c.escribir('salidas/titulos/cap_1.json', '{"titulo": "La persiana de madera"}');
  c.escribir('salidas/titulos/cap_2.json', '{"titulo": "El bastidor en la falda"}');
  armarLibro(c);
  return c;
}

describe('libro.md → plantilla de producción', () => {
  it('el título va aparte, la primera página sin encabezado y el índice son los capítulos', () => {
    const p = libroParaPlantilla(conLibro().leer('libro.md'));
    expect(p.titulo).toBe('sumá vos');
    expect(p.indice).toEqual(['I · La persiana de madera', 'II · El bastidor en la falda']);
    expect(p.libroMarkdown.startsWith('Soy de Echesortu')).toBe(true);
    expect(() => libroParaPlantilla('sin título')).toThrow(/sin título/);
  });

  it('arma el HTML con el nombre de quien narra y lang="es"', async () => {
    const p = paraPlantilla(conLibro());
    expect(p).toMatchObject({ nombreNarrador: 'Nélida', idioma: 'es' });
    const html = await construirHtmlLibro({ titulo: p.titulo, nombreNarrador: p.nombreNarrador, indice: p.indice, libroMarkdown: p.libroMarkdown, idioma: p.idioma });
    expect(html).toContain('<html lang="es">');
    expect(html).toContain('<div class="sus-frases-titulo">Sus frases</div>');
    expect(html).toContain('El bastidor en la falda');
  });

  it('en catalán: lang="ca" y «Les seves frases» es la página de frases', async () => {
    const p = paraPlantilla(conLibro('Idioma del libro: catalán'));
    const html = await construirHtmlLibro({ titulo: p.titulo, nombreNarrador: p.nombreNarrador, indice: p.indice, libroMarkdown: p.libroMarkdown, idioma: p.idioma });
    expect(html).toContain('<html lang="ca">');
    expect(html).toContain('<div class="sus-frases-titulo">Les seves frases</div>');
    expect(html).toContain('<div class="sus-frases-hero">«Me gusta el mate amargo, bien caliente»</div>');
  });
});

describe('«Su voz» desde sus_frases.json', () => {
  it('cada frase va al capítulo que la marca (o al último), hasta 3 elegidas, con su respuesta', () => {
    const f = frasesParaSuVoz(conLibro(), { narradorId: 'nar-1', pedidoId: 'ped-1', fuentes: { R07: { respuestaId: 'resp-77', preguntaOrden: 7 } } });
    expect(f).toMatchObject({ version: 1, narrador_id: 'nar-1', pedido_id: 'ped-1', confirmado_at: null });
    expect(f.capitulos.map((x) => [x.numero, x.capitulo, x.candidatas.map((k) => [k.id, k.elegida, k.respuesta_id, k.pregunta_orden])])).toEqual([
      [2, 'II · El bastidor en la falda', [['R07', true, 'resp-77', 7], ['R08', true, null, 0]]],
    ]);
    expect(f.capitulos[0].candidatas[0]).toMatchObject({ texto: 'Me gusta el mate amargo, bien caliente', origen: 'sus-frases', grupo: 'suyas', estado: 'pendiente', audio_path: null, elegida_por: 'modelo' });
  });
});
```

- [ ] **Step 2: Correr el test y ver que falla**

Run: `cd fabrica && npx vitest run test/escritor/salida.test.ts`
Expected: FAIL ("Failed to load url ../../src/escritor/salida/plantilla.js").

- [ ] **Step 3: Escribir `salida/plantilla.ts`**

```ts
// fabrica/src/escritor/salida/plantilla.ts
// Del libro del escritor v5.5 a lo que pide la plantilla de producción (construirHtmlLibro): el título del
// libro aparte (portada), la primera página sin encabezado, los capítulos "I · Título" como índice, y
// «Su voz» (frases.json) desde salidas/sus_frases.json: cada frase con su respuesta (R..), para que el
// worker de audio la corte. El llamador pone `fuentes` (R.. → respuesta de la base): eso es de Joaquín.
import { Carpeta, leerJSON } from '../carpeta.js';
import { idioma, nombreDePila, piezas, salida } from '../lectura.js';
import { marcas, piezaDeR, planConR } from '../texto.js';
import type { IdiomaLibro, Json } from '../tipos.js';
import { FRASES_POR_CAPITULO, type FraseCandidata, type FrasesJson } from '../../libro/frases.js';

export type ParaPlantilla = { titulo: string; indice: string[]; libroMarkdown: string };
export type FuenteDeFrase = { respuestaId: string | null; preguntaOrden: number };

export function libroParaPlantilla(libroMd: string): ParaPlantilla {
  const lineas = libroMd.replace(/\r\n/g, '\n').split('\n');
  const i = lineas.findIndex((l) => l.startsWith('# '));
  if (i < 0) throw new Error('libro.md sin título (# …)');
  const libroMarkdown = lineas.slice(i + 1).join('\n').replace(/^\n+/, '');
  const indice = libroMarkdown.split('\n').map((l) => l.trim()).filter((l) => /^# [IVXLCDM]+( · .+)?$/.test(l)).map((l) => l.slice(2));
  return { titulo: lineas[i].slice(2).trim(), indice, libroMarkdown };
}

export const paraPlantilla = (c: Carpeta): ParaPlantilla & { nombreNarrador: string; idioma: IdiomaLibro } => ({
  ...libroParaPlantilla(c.leer('libro.md')),
  nombreNarrador: nombreDePila(c),
  idioma: idioma(c),
});

export function frasesParaSuVoz(c: Carpeta, a: { narradorId: string; pedidoId: string; fuentes: Record<string, FuenteDeFrase> }): FrasesJson {
  const frases: { id: string; texto: string }[] = leerJSON(c, salida('sus_frases.json')).frases || [];
  const reg = leerJSON(c, salida('registro.json'));
  const plan = planConR(leerJSON(c, salida('plan.json')), reg);
  const capitulos = plan.capitulos as Json[];
  const caps = piezas(c).filter((p) => p.pieza.startsWith('cap_'));
  const { indice } = libroParaPlantilla(c.leer('libro.md'));
  const ultimo = capitulos[capitulos.length - 1].n as number;
  const capDe = (rid: string): number => {
    const marcada = caps.find((p) => marcas(p.texto).includes(rid));
    if (marcada) return Number(marcada.pieza.slice(4));
    const p = piezaDeR(plan, reg, rid);
    return p.startsWith('cap_') ? Number(p.slice(4)) : ultimo;
  };
  const porCap = new Map<number, FraseCandidata[]>();
  for (const f of frases) {
    const n = capDe(f.id);
    const lista = porCap.get(n) ?? [];
    const fuente = a.fuentes[f.id];
    lista.push({
      id: f.id, texto: String(f.texto).trim(), origen: 'sus-frases', grupo: 'suyas',
      respuesta_id: fuente?.respuestaId ?? null, pregunta_orden: fuente?.preguntaOrden ?? 0, por_que: '',
      elegida: lista.filter((x) => x.elegida).length < FRASES_POR_CAPITULO, elegida_por: 'modelo',
      estado: 'pendiente', audio_path: null, segundos: null, inicio: null, fin: null,
    });
    porCap.set(n, lista);
  }
  return {
    version: 1, narrador_id: a.narradorId, pedido_id: a.pedidoId, confirmado_at: null,
    capitulos: capitulos.filter((x) => porCap.has(x.n)).map((x) => ({ numero: x.n as number, capitulo: indice[capitulos.indexOf(x)] ?? `Capítulo ${x.n}`, candidatas: porCap.get(x.n) as FraseCandidata[] })),
  };
}
```

- [ ] **Step 4: Tocar lo mínimo de `plantilla-html.ts`**

Antes de `extraerFraseHeroe` (línea 192):

```ts
/** El título de la página de frases, en castellano o en catalán (escritor v5.4: "Les seves frases"). */
const TITULOS_SUS_FRASES = new Set(['sus frases', 'les seves frases']);
const esSusFrases = (titulo: string | null): boolean => TITULOS_SUS_FRASES.has((titulo ?? '').trim().toLowerCase());
```

En `extraerFraseHeroe`: `secciones.find((s) => (s.titulo ?? '').trim().toLowerCase() === 'sus frases')` → `secciones.find((s) => esSusFrases(s.titulo))`.

En `construirHtmlLibro`: agregar al tipo de `datos`, después de `urlCliente`:

```ts
  /** El idioma del libro (escritor v5.4: catalán). Va en `<html lang>`. Sin esto, castellano. */
  idioma?: 'es' | 'ca';
```

y en el cuerpo: `if (tituloTrim.toLowerCase() === 'sus frases')` → `if (esSusFrases(tituloTrim))`; `<html lang="es">` → `<html lang="${datos.idioma ?? 'es'}">`.

- [ ] **Step 5: Correr los tests (los nuevos y los de la plantilla) y el tipado**

Run: `cd fabrica && npx vitest run test/escritor/salida.test.ts test/plantilla.test.ts test/plantilla-su-voz.test.ts && npx tsc --noEmit -p .`
Expected: PASS y tsc sin errores.

- [ ] **Step 6: Commit**

```bash
git add fabrica/src/escritor/salida/plantilla.ts fabrica/src/libro/plantilla-html.ts fabrica/test/escritor/salida.test.ts
git commit -m "escritor: libro.md y Su voz hacia la plantilla de producción; la plantilla toma lang y «Les seves frases»" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 24: Correr local contra una carpeta (estimación antes, costo después)

**Files:**
- Create: `fabrica/src/escritor/estimar.ts`
- Create: `fabrica/src/escritor/cli.ts`
- Create: `fabrica/scripts/escritor-correr.ts`
- Test: `fabrica/test/escritor/cli.test.ts`

**Interfaces:**
- Consumes: Tasks 1, 4, 10, 12, 13–16, 19–21 (todo lo de arriba); `Anthropic` de `@anthropic-ai/sdk`.
- Produces:
  - `type FilaEstimada = { paso: string; entradaTokens: number; salidaTokens: number; usd: number }`, `SALIDA_ESTIMADA: Record<string, number>`, `estimarUsd(c: Carpeta, o: { soloCapitulo: number }): { filas: FilaEstimada[]; total: number }` (cota alta: sin caché ni Batch, salida con lo que piensa en `xhigh`)
  - `type ArgsCli = { carpeta: string; etapa: 'A' | 'B' | 'C'; soloCapitulo?: number; topeUsd: number; lote: boolean; si: boolean; correcciones?: string }`, `leerArgs(argv: string[]): ArgsCli`, `SALIDAS_DE_REVISION: Set<string>`, `cargarCarpeta(dir: string): Carpeta` (entradas/, salidas/ y pendientes/, sin las salidas de una revisión vieja), `guardarCarpeta(c: Carpeta, dir: string): void`
  - Script: `npx tsx scripts/escritor-correr.ts --carpeta <dir> [--etapa A|B|C] [--solo-capitulo N] [--tope USD] [--sin-lote] [--correcciones <archivo>] [--si]`. Sin `--si` **no llama a la API**: muestra la estimación y sale.

- [ ] **Step 1: Escribir el test que falla**

```ts
// fabrica/test/escritor/cli.test.ts
import { mkdtempSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { cargarCarpeta, guardarCarpeta, leerArgs } from '../../src/escritor/cli.js';
import { estimarUsd } from '../../src/escritor/estimar.js';
import { aDisco, carpetaNelida } from './ayuda.js';

describe('argumentos', () => {
  it('por defecto: etapa C, lote, tope 15 y sin llamar (falta --si)', () => {
    expect(leerArgs(['--carpeta', 'x'])).toEqual({ carpeta: 'x', etapa: 'C', topeUsd: 15, lote: true, si: false });
    expect(leerArgs(['--carpeta', 'x', '--solo-capitulo', '6', '--tope', '4', '--sin-lote', '--si'])).toEqual({ carpeta: 'x', etapa: 'C', soloCapitulo: 6, topeUsd: 4, lote: false, si: true });
  });
  it('rechaza lo que no entiende', () => {
    expect(() => leerArgs([])).toThrow(/--carpeta/);
    expect(() => leerArgs(['--carpeta', 'x', '--tope', 'mucho'])).toThrow(/--tope/);
    expect(() => leerArgs(['--carpeta', 'x', '--etapa', 'A', '--solo-capitulo', '2'])).toThrow(/etapa C/);
    expect(() => leerArgs(['--carpeta', 'x', '--etapa', 'B'])).toThrow(/--correcciones/);
    expect(() => leerArgs(['--carpeta', 'x', '--loquesea'])).toThrow(/desconocido/);
  });
});

describe('carpeta en disco', () => {
  it('carga entradas, salidas y pendientes, sin la revisión vieja; y guarda', () => {
    const c = carpetaNelida();
    c.escribir('salidas/hechos.json', '{}');
    c.escribir('salidas/lectura-final.json', '{}');
    c.escribir('controles/piezas.json', '[]');
    c.escribir('pendientes/cap_2.json', '["R10"]');
    const leida = cargarCarpeta(aDisco(c));
    expect(leida.existe('salidas/plan.json') && leida.existe('pendientes/cap_2.json')).toBe(true);
    expect(leida.existe('salidas/hechos.json') || leida.existe('salidas/lectura-final.json') || leida.existe('controles/piezas.json')).toBe(false);
    const dir = mkdtempSync(path.join(tmpdir(), 'guardar-'));
    guardarCarpeta(leida, dir);
    expect(readFileSync(path.join(dir, 'salidas', 'plan.json'), 'utf8')).toBe(c.leer('salidas/plan.json'));
  });
});

describe('estimación', () => {
  it('un capítulo: una fila por paso y un total positivo', () => {
    const e = estimarUsd(carpetaNelida(), { soloCapitulo: 1 });
    expect(e.filas.map((f) => f.paso)).toEqual(['2h-armador', '3b-capitulo', '3r-resumen', '4-hechos', '5c-veedor', '6-arreglo', '4-hechos-repaso', '7-estilo', '7-estilo', '3t-titulo']);
    expect(e.total).toBe(Math.round(e.filas.reduce((s, f) => s + f.usd, 0) * 1e4) / 1e4);
    expect(e.total).toBeGreaterThan(0);
  });
});
```

- [ ] **Step 2: Correr el test y ver que falla**

Run: `cd fabrica && npx vitest run test/escritor/cli.test.ts`
Expected: FAIL ("Failed to load url ../../src/escritor/cli.js").

- [ ] **Step 3: Escribir `estimar.ts`, `cli.ts` y el script**

```ts
// fabrica/src/escritor/estimar.ts
// Cuánto puede costar escribir un capítulo, ANTES de llamar (decisión 7 del spec: la prueba paga se avisa).
// Cota alta: entrada a precio lleno (sin caché ni Batch); la salida incluye lo que piensa en xhigh.
// Lo que todavía no existe (el capítulo nuevo) se estima con lo que hay en la carpeta.
import type { Carpeta } from './carpeta.js';
import { PRECIOS_ESCRITOR } from './costos.js';
import { salida } from './lectura.js';
import { llamadaArmador, llamadaCapitulo, llamadaEstilo, llamadaHechos, llamadaResumen, llamadaTitulo, llamadaVeedor, textoParaElModelo, type Llamada } from './llamadas/armar.js';
import { archivoDe } from './texto.js';

export type FilaEstimada = { paso: string; entradaTokens: number; salidaTokens: number; usd: number };
export const SALIDA_ESTIMADA: Record<string, number> = {
  '2h-armador': 8000, '3b-capitulo': 24000, '3r-resumen': 3000, '4-hechos': 16000, '5c-veedor': 10000,
  '6-arreglo': 10000, '4-hechos-repaso': 12000, '7-estilo': 8000, '3t-titulo': 3000,
};
const tokens = (t: string): number => Math.ceil(t.length / 3.5);

export function estimarUsd(c: Carpeta, o: { soloCapitulo: number }): { filas: FilaEstimada[]; total: number } {
  const n = o.soloCapitulo;
  const p = PRECIOS_ESCRITOR['claude-opus-5-5'];
  const fila = (paso: string, l: Llamada | string): FilaEstimada => {
    const entradaTokens = tokens(typeof l === 'string' ? l : textoParaElModelo(l));
    const salidaTokens = SALIDA_ESTIMADA[paso];
    return { paso, entradaTokens, salidaTokens, usd: Math.round(((entradaTokens * p.input + salidaTokens * p.output) / 1e6) * 1e4) / 1e4 };
  };
  const capitulo = llamadaCapitulo(c, n);
  const hayCap = c.existe(salida(archivoDe(`cap_${n}`)));
  const hechos = llamadaHechos(c, { repaso: false });
  const filas = [
    fila('2h-armador', llamadaArmador(c, n)),
    fila('3b-capitulo', capitulo),
    fila('3r-resumen', hayCap ? llamadaResumen(c, `cap_${n}`) : ''),
    fila('4-hechos', hechos),
    fila('5c-veedor', llamadaVeedor(c)),
    fila('6-arreglo', capitulo),
    fila('4-hechos-repaso', hechos),
    fila('7-estilo', hayCap ? llamadaEstilo(c, `cap_${n}`, 1) : ''),
    fila('7-estilo', hayCap ? llamadaEstilo(c, `cap_${n}`, 1) : ''),
    fila('3t-titulo', hayCap ? llamadaTitulo(c, n) : ''),
  ];
  return { filas, total: Math.round(filas.reduce((s, f) => s + f.usd, 0) * 1e4) / 1e4 };
}
```

```ts
// fabrica/src/escritor/cli.ts
// Lo testeable del comando local (scripts/escritor-correr.ts): argumentos y carpeta de disco.
import { mkdirSync, readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { Carpeta } from './carpeta.js';

export type ArgsCli = { carpeta: string; etapa: 'A' | 'B' | 'C'; soloCapitulo?: number; topeUsd: number; lote: boolean; si: boolean; correcciones?: string };

export function leerArgs(argv: string[]): ArgsCli {
  const a: { carpeta?: string; etapa: ArgsCli['etapa']; soloCapitulo?: number; topeUsd: number; lote: boolean; si: boolean; correcciones?: string } = { etapa: 'C', topeUsd: 15, lote: true, si: false };
  for (let i = 0; i < argv.length; i++) {
    const k = argv[i];
    const valor = (): string => { const v = argv[++i]; if (v === undefined) throw new Error(`falta el valor de ${k}`); return v; };
    if (k === '--carpeta') a.carpeta = valor();
    else if (k === '--etapa') { const e = valor(); if (e !== 'A' && e !== 'B' && e !== 'C') throw new Error(`--etapa es A, B o C (no ${e})`); a.etapa = e; }
    else if (k === '--solo-capitulo') { const n = Number(valor()); if (!Number.isInteger(n) || n < 1) throw new Error('--solo-capitulo es un número de capítulo'); a.soloCapitulo = n; }
    else if (k === '--tope') { const n = Number(valor()); if (!(n > 0)) throw new Error('--tope es un monto en USD mayor que 0'); a.topeUsd = n; }
    else if (k === '--correcciones') a.correcciones = valor();
    else if (k === '--sin-lote') a.lote = false;
    else if (k === '--si') a.si = true;
    else throw new Error(`argumento desconocido: ${k}`);
  }
  if (!a.carpeta) throw new Error('falta --carpeta <dir> (la carpeta con entradas/)');
  if (a.soloCapitulo !== undefined && a.etapa !== 'C') throw new Error('--solo-capitulo es de la etapa C');
  if (a.etapa === 'B' && !a.correcciones) throw new Error('la etapa B necesita --correcciones <archivo> (una corrección por línea)');
  const { carpeta, ...resto } = a;
  return { carpeta, ...resto };
}

/** Lo que dejó una revisión anterior no se carga: si no, el informe y los arreglos mezclarían dos corridas. */
export const SALIDAS_DE_REVISION = new Set(['salidas/hechos.json', 'salidas/veedor.json', 'salidas/hechos-repaso.json', 'salidas/lectura.json', 'salidas/lectura-final.json', 'salidas/cotejo.json']);

export function cargarCarpeta(dir: string): Carpeta {
  const c = new Carpeta();
  const recorrer = (sub: string): void => {
    const abs = path.join(dir, sub);
    let nombres: string[];
    try { nombres = readdirSync(abs); } catch { return; }
    for (const n of nombres) {
      const rel = `${sub}/${n}`;
      if (statSync(path.join(dir, rel)).isDirectory()) recorrer(rel);
      else if (!SALIDAS_DE_REVISION.has(rel)) c.escribir(rel, readFileSync(path.join(dir, rel), 'utf8'));
    }
  };
  for (const sub of ['entradas', 'salidas', 'pendientes']) recorrer(sub);
  return c;
}

export function guardarCarpeta(c: Carpeta, dir: string): void {
  for (const [rel, texto] of Object.entries(c.aObjeto())) {
    mkdirSync(path.dirname(path.join(dir, rel)), { recursive: true });
    writeFileSync(path.join(dir, rel), texto, 'utf8');
  }
}
```

(El `const { carpeta, ...resto }` deja `carpeta` con tipo `string` después del `throw`; si `tsc` no lo estrecha, se escribe `return { carpeta: a.carpeta as string, …resto }` sin cambiar nada más.)

```ts
// fabrica/scripts/escritor-correr.ts
// Corre el escritor v5.5 de la fábrica contra una carpeta del disco (con entradas/ y, para la etapa C,
// salidas/registro.json y plan.json). Sin --si NO llama a la API: muestra la estimación y sale.
//
//   npx tsx scripts/escritor-correr.ts --carpeta <dir> [--etapa A|B|C] [--solo-capitulo N] [--tope USD] [--sin-lote] [--correcciones <archivo>] [--si]
//
// Deja todo en <dir>/fabrica-escritor/: pasos/ (cada respuesta, para retomar sin pagar), lotes/,
// carpeta-<etapa>.json, carpeta/ (la carpeta final), libro.md, informe.md y costos.json.
// La clave sale de ANTHROPIC_API_KEY (nunca se imprime).
import { readFileSync } from 'node:fs';
import path from 'node:path';
import Anthropic from '@anthropic-ai/sdk';
import { AlmacenDisco } from '../src/escritor/almacen/disco.js';
import { cargarCarpeta, guardarCarpeta, leerArgs } from '../src/escritor/cli.js';
import { Ejecutor } from '../src/escritor/ejecutor.js';
import { estimarUsd } from '../src/escritor/estimar.js';
import { ModeloAnthropic, type ClienteMensajes } from '../src/escritor/modelo/anthropic.js';
import { LoteAnthropic, type ClienteLotes } from '../src/escritor/modelo/lote-anthropic.js';
import type { Contexto } from '../src/escritor/orquestador/contexto.js';
import { etapaA } from '../src/escritor/orquestador/etapa-a.js';
import { etapaB } from '../src/escritor/orquestador/etapa-b.js';
import { etapaC } from '../src/escritor/orquestador/etapa-c.js';

async function main(): Promise<void> {
  const a = leerArgs(process.argv.slice(2));
  const c = cargarCarpeta(a.carpeta);
  const destino = path.join(a.carpeta, 'fabrica-escritor');
  if (a.soloCapitulo !== undefined) {
    const e = estimarUsd(c, { soloCapitulo: a.soloCapitulo });
    console.log(`Estimación (cota alta, sin caché ni Batch) del capítulo ${a.soloCapitulo}:`);
    for (const f of e.filas) console.log(`  ${f.paso.padEnd(16)} entrada ~${f.entradaTokens} tok, salida ~${f.salidaTokens} tok  USD ${f.usd.toFixed(4)}`);
    console.log(`  TOTAL estimado: USD ${e.total.toFixed(2)} (tope: USD ${a.topeUsd})`);
  }
  if (!a.si) {
    console.log('No se llamó a la API. Para correr de verdad, agregar --si.');
    return;
  }
  const cliente = new Anthropic();
  const almacen = new AlmacenDisco(destino);
  const ej = new Ejecutor({
    modelo: new ModeloAnthropic(cliente as unknown as ClienteMensajes),
    lote: a.lote ? new LoteAnthropic(cliente as unknown as ClienteLotes, almacen) : undefined,
    almacen,
    topeUsd: a.topeUsd,
    log: (s) => console.log(s),
  });
  const x: Contexto = { c, ej, almacen, log: (s) => console.log(s), usarLote: a.lote };
  try {
    if (a.etapa === 'A') console.log(JSON.stringify(await etapaA(x), null, 1));
    else if (a.etapa === 'B') {
      const correcciones = readFileSync(a.correcciones as string, 'utf8').split('\n').map((t) => ({ texto: t })).filter((k) => k.texto.trim());
      console.log(JSON.stringify(await etapaB(x, correcciones), null, 1));
    } else {
      const r = await etapaC(x, { soloCapitulo: a.soloCapitulo });
      console.log(`libro: ${destino}/libro.md · ${r.controlesFinal} · arreglados: ${r.arreglados.join(', ') || 'ninguno'}`);
    }
  } finally {
    guardarCarpeta(c, path.join(destino, 'carpeta'));
    await ej.guardarCostos();
    const nuevas = ej.filas.filter((f) => !f.de_memoria);
    const leidas = ej.filas.reduce((s, f) => s + f.cache_read, 0);
    console.log(`Gasto real: USD ${ej.gastado.toFixed(4)} · ${nuevas.length} llamadas nuevas (${nuevas.filter((f) => f.lote).length} por lote) · caché leída: ${leidas} tokens · detalle en ${destino}/costos.json`);
  }
}

main().catch((err) => {
  console.error(`ERROR: ${(err as Error).message}`);
  process.exit(1);
});
```

- [ ] **Step 4: Correr el test, el tipado y el script sin `--si` (no llama a la API)**

Run: `cd fabrica && npx vitest run test/escritor/cli.test.ts && npx tsc --noEmit -p . && npx tsx scripts/escritor-correr.ts --carpeta test/fijos/escritor-v55/nelida --solo-capitulo 1`
Expected: PASS, tsc sin errores, y el script imprime la tabla de estimación y `No se llamó a la API. Para correr de verdad, agregar --si.` (no crea `fabrica-escritor/`).

- [ ] **Step 5: Correr todos los tests del escritor y de la fábrica**

Run: `cd fabrica && npx vitest run test/`
Expected: PASS (los del escritor, más todos los que ya estaban).

- [ ] **Step 6: Commit**

```bash
git add fabrica/src/escritor/estimar.ts fabrica/src/escritor/cli.ts fabrica/scripts/escritor-correr.ts fabrica/test/escritor/cli.test.ts
git commit -m "escritor: comando local con estimación antes (sin llamar) y costo real después" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 25: Prueba paga de un capítulo — **REQUIERE EL OK DE NAZA ANTES DE CORRER**

**Files:**
- Modify: `docs/v5/escritor-v55/pruebas.md` (sección nueva: "Prueba paga de un capítulo en la fábrica")
- (Fuera del repo: la copia de la corrida en `fabrica/prueba-v3-joaquin-fabrica/`, ignorada por `fabrica/.gitignore`: `prueba-v3-*/`.)

**Interfaces:**
- Consumes: el script de la Task 24 y todo lo anterior.
- Produces: el costo real de un capítulo por API (con caché y Batch) y el capítulo para que Naza lo compare con el de la sesión.

- [ ] **Step 1: Preparar la copia (sin API)**

Run (Bash): `cp -r "/c/Users/Naza/Desktop/VITACORA FAMILIAR-v3/fabrica/prueba-v3-joaquin/escritor-v5-5" "/c/Users/Naza/Desktop/VITACORA FAMILIAR-escritor-fabrica/fabrica/prueba-v3-joaquin-fabrica" && cd "/c/Users/Naza/Desktop/VITACORA FAMILIAR-escritor-fabrica" && git status --short fabrica/`
Expected: `git status` no muestra la carpeta copiada (está ignorada).

- [ ] **Step 2: Estimar (sin API) y pedir el OK**

Run: `cd fabrica && npx tsx scripts/escritor-correr.ts --carpeta prueba-v3-joaquin-fabrica --solo-capitulo 6`
Expected: la tabla de estimación y "No se llamó a la API".

Mandarle a Naza: el capítulo que se va a reescribir (VI, el que se comparó en la prueba de 3 piezas), la estimación (cota alta) y el tope que se propone (el total estimado redondeado para arriba). **No seguir sin su OK escrito en el chat.** Antes, Naza también aprueba el borrador de `docs/v5/escritor-v55/fabrica.md` (no se usa en esta prueba, pero es texto para la familia).

- [ ] **Step 3: Correr (solo con el OK)**

Run: `cd fabrica && npx tsx scripts/escritor-correr.ts --carpeta prueba-v3-joaquin-fabrica --solo-capitulo 6 --tope <el que aprobó Naza> --si`
Expected: termina con `Gasto real: USD …`. Verificar en la salida y en `fabrica-escritor/costos.json`:
- la primera llamada no volvió 400 (confirma `thinking: adaptive` y `output_config.effort` con el SDK 0.71.2; si volvió 400 por `output_config`, parar y avisar: hace falta actualizar `@anthropic-ai/sdk`, con OK, en una task aparte);
- `cache_read` > 0 en las llamadas de estilo (la caché de `<ficha>`+`<voz>` funciona);
- hay filas con `lote: true` (Batch funcionó; si el lote tardó más de lo razonable, anotarlo);
- el gasto real contra la estimación.

Si se corta (red, tope), se vuelve a correr el mismo comando: lo pagado sale de `fabrica-escritor/pasos/`.

- [ ] **Step 4: Anotar el resultado y llevárselo a Naza**

En `docs/v5/escritor-v55/pruebas.md`, sección nueva "Prueba paga de un capítulo en la fábrica (fecha)": capítulo, costo real y por paso (de `costos.json`), cuánto ahorró la caché y el Batch, tiempo, y lo que haya que ajustar (esfuerzo, `max_tokens`). El capítulo (`fabrica/prueba-v3-joaquin-fabrica/fabrica-escritor/libro.md`, sección VI) se le pasa a Naza para que lo compare con el de la sesión: **decide Naza leyendo**, no un juez. El libro entero viene después, con su costo avisado.

```bash
git add docs/v5/escritor-v55/pruebas.md
git commit -m "docs: prueba paga de un capítulo con el escritor en la fábrica (costo real, caché y Batch)" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
git push origin escritor-fabrica
```

---

## Lo distinto al spec (y lo que este plan no cubre)

1. **`<confirmado_por_la_familia>`**: el spec lo nombra, pero la receta v5.5 (que no se reescribe) y C14 leen `<confirmado_por_el_narrador>`. Las correcciones de la familia entran en ese bloque con un encabezado propio (Task 17), como se hizo a mano con Joaquín el 06/10. Si Naza quiere la etiqueta nueva, hay que tocar la receta y C14.
2. **Modo del v5.5**: el libro aprobado corrió con `puro: true, soloHechos: true` (sin lectura (5) ni cotejo (5b)). La fábrica corre solo ese modo.
3. **Disputa**: su texto estaba en `workflow-libro.js`, no en la receta. Pasa a `docs/v5/escritor-v55/fabrica.md` sin lo que era de la sesión (leer/escribir archivos). Los prompts de "Dudas para la familia" y "Corrección del registro" son nuevos y quedan en borrador para que Naza los apruebe.
4. **Caché**: con el orden de la receta, lo que más se repite en modo puro es `<ficha>`+`<voz>` (~40 llamadas por libro, prefijo chico) y los documentos de hechos (repaso y disputas). Lo grande (guía + respuestas) cambia por paso y no se comparte entre pasos. No se reordena nada (cambiaría lo que recibe el modelo): el ahorro real se mide en la Task 25.
5. **Batch**: las fichas (3r) no pueden ir por lote: cada una la necesita el capítulo siguiente. Van por lote: hechos+veedor, arreglos, disputas, estilo (dos pasadas) y títulos.
6. **Costo de un capítulo**: el spec dice ~USD 1; la estimación de la Task 24 (cota alta, con hechos y veedor sobre el libro entero y el repaso) puede dar más. Se avisa antes de correr.
7. **Castellano de España**: la ficha dice "Trato: tú" e "Idioma del libro: castellano de España", pero la receta no tiene un bloque de idioma para es-ES (solo catalán). No se agrega texto nuevo a la receta.
8. **Plantilla en catalán**: la plantilla toma `lang` y reconoce «Les seves frases», pero sus textos fijos siguen en castellano («Su voz», "TAL CUAL LAS DICE…", "Escuchala", "Cap.", "LA HISTORIA DE UNA VIDA"). Traducirlos necesita textos aprobados por Naza.
9. **Producción**: `AlmacenSupabase`, `frasesParaSuVoz` (con `fuentes` R.. → respuesta) y `paraPlantilla` quedan listos para que Joaquín los enchufe; el worker no se toca. El registro en `consumo_ia` (el panel) también queda para ese enchufe: el escritor anota su gasto en `costos.json` del almacén, con el descuento de Batch, que `registrarUso` no conoce.
10. **SDK**: `@anthropic-ai/sdk` 0.71.2 no tipa `output_config`; va en el cuerpo igual (tipos propios). Se confirma con la primera llamada real (Task 25).
