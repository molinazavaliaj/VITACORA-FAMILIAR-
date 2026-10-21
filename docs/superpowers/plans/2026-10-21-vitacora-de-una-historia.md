# Vitácora de una historia · Plan de implementación

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Sumar el producto «Vitácora de una historia». Es un libro sobre un capítulo de la vida que ya pasó, con unas 15 preguntas por WhatsApp. Se compra en `/comprar/historia`, tiene solapa propia y lo escribe e imprime la fábrica.

**Architecture:** El núcleo de la entrevista es una **copia** del núcleo de V3 (`fabrica/src/v3/entrevista/`) en `fabrica/src/historia/entrevista/`. Su banco tiene una columna nueva «Tema», y la copia pasa byte a byte al entrevistador, como V3 y Kids. Lo de afuera del bot (`entrevistador/src/historia/`) es una copia de `entrevistador/src/v3/` sobre la tabla nueva `historias`. La web es la compra de Familiar con un paso «Tema» y `contexto.modo = 'historia'`. El libro sale de la máquina del escritor (`fabrica/src/escritor/`) con una receta propia (`fabrica/src/escritor-historia/`), siguiendo el patrón de `escritor-kids`.

**Tech Stack:** TypeScript, Next.js (web), Node worker (fabrica), entrevistador (Node, Meta WhatsApp), Supabase (Postgres + Storage), vitest, Anthropic SDK (Opus 5.5).

**Spec:** `docs/superpowers/specs/2026-10-21-vitacora-de-una-historia-design.md` (aprobado por Naza el 21/10).

## Global Constraints

- **V3 no se toca.** No se edita nada de `fabrica/src/v3/`, `entrevistador/src/v3/`, `docs/v3/` ni `fabrica/src/escritor/` salvo lo que diga una tarea con nombre y línea (solo para excluir `modo 'historia'`).
- Rama `vitacora-historia`, en el worktree `C:\Users\Naza\Desktop\VITACORA FAMILIAR-historia`. Nunca se hace checkout en `C:\Users\Naza\Desktop\VITACORA FAMILIAR`. Va un PR por fase. Los merges los decide Naza.
- Commits terminan con `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`.
- Las migraciones las aplica Naza. Cada migración avisa en su cabecera y en `supabase/CONTRATO.md`.
- Idiomas `es-AR` (vos), `es-ES` (tú) y `ca`. Nunca usted.
- Textos para personas:
  - las preguntas y los mensajes del bot los redacta Fable con voz cálida;
  - Naza los aprueba de a 10 en el chat, con una versión recomendada;
  - sin dos puntos, sin oraciones que empiecen con «Y» después de un punto, con frases simples;
  - sirven para hombre o mujer, sin «de chica» o «de chico» fijo;
  - no prometen lo que no pasa.
- **Ningún texto de persona se inventa en el código.** Mientras un texto no esté aprobado, el código lo lee del banco o de su md. Los tests usan un banco de prueba (`fixtures`), nunca el real.
- Modelos: `claude-opus-5-5` para escribir, juzgar y cazar.
- **No hay corridas pagas con narradores inventados.** La primera corrida del escritor es con el narrador real del piloto.
- Tapa dura 168×240 de Bookmundo con un **mínimo de 88 páginas**. En historia no se rellena con «Notas». Con menos de 88 páginas no se manda a Bookmundo y se avisa a socios.
- Precio igual que Familiar, con las mismas variables (`PRECIO_EUR`/`PRECIO_ARS`, impreso y marco). Se vende solo con `HISTORIA_VENTA=1`.
- Comandos de prueba: `npm test` en `fabrica/`, `entrevistador/` y `web/` (en cada uno es `tsc` + `vitest run`).

## Mapa de archivos

| Dónde | Qué | Responsabilidad |
|---|---|---|
| `docs/historia/` | `README.md`, `banco.md`, `idiomas/banco-{ca,es-ES}.md`, `temas.md`, `escritor/receta.md` | Fuente de verdad del contenido |
| `fabrica/src/historia/entrevista/` | copia de `fabrica/src/v3/entrevista/` + `temas.ts` | Núcleo puro (banco, flujo, texto, mensajes, cazador) |
| `fabrica/src/historia/ficha.ts` | `FichaHistoria` | Ficha con tema |
| `fabrica/scripts/historia-json.ts` | md → json | Genera `banco*.json` |
| `fabrica/test/historia-*.test.ts` | tests del núcleo | |
| `supabase/migrations/20261022000000_historias.sql` | tabla `historias` y `respuestas.clave_historia` | |
| `entrevistador/scripts/historia-copiar-nucleo.ts` | copia fabrica → entrevistador | |
| `entrevistador/src/historia/` | copia de `entrevistador/src/v3/` + `alta.ts` | Bot (entrante, turno, envío, reloj, alta) |
| `entrevistador/src/flujo/procesar.ts`, `flujo/scheduler.ts`, `config.ts`, `variables.ts` | enganches | Ruteo, tick, plantillas |
| `web/src/lib/historia.ts` | temas, validación, `historiaVendeEn` | |
| `web/src/lib/registro.ts` | `contexto.historia` | |
| `web/src/app/_publico/cabecera.tsx` | 4 solapas | |
| `web/src/app/historia/`, `ar/historia/`, `ca/historia/`, `comprar/historia/` (×3), `_historia-producto/` | páginas | |
| `fabrica/src/escritor-historia/` | receta, orquestador, producción | Libro |
| `fabrica/src/libro/bookmundo/` | `sinNotas`, tapa blanda | Imprenta |

> Nombre de carpeta en la web: **no usar `_historia`**, porque ya existe `web/src/app/tablero/_historia/` (piezas del panel). La de este producto es `web/src/app/_historia-producto/`.

---

## Fase 0 · Contenido (Fable + Naza, sin código)

Va en paralelo con las fases 1 a 3. El código usa un banco de prueba hasta que esta fase termine.

### Task 0.1: Lista de temas

**Files:**
- Create: `docs/historia/temas.md`
- Create: `docs/historia/README.md`

- [ ] **Step 1:** Mandar a Fable (agente Opus) el spec §2 y estas reglas: 6 temas más «Otra historia», cada uno de 2 a 6 palabras, que sirvan para hombre o mujer, en es-AR, es-ES y ca. Que proponga una versión recomendada por tema.
- [ ] **Step 2:** Pasarle a Naza la tanda en el chat, de a 10 (los 7 temas son una sola tanda), con la recomendada primero.
- [ ] **Step 3:** Escribir `docs/historia/temas.md` con la tabla aprobada, con las columnas `clave | es-AR | es-ES | ca`. Las claves son fijas: `mudanza`, `negocio`, `enfermedad`, `conocimos`, `padres`, `trabajo`, `otra`.
- [ ] **Step 4:** En `docs/historia/README.md` va qué es cada archivo de la carpeta, con el mismo formato que `docs/v3/entrevista/README.md`.
- [ ] **Step 5:** Commit `historia: lista de temas aprobada por Naza`.

### Task 0.2: Banco en castellano (es-AR)

**Files:**
- Create: `docs/historia/banco.md`

El formato es **el de `docs/v3/entrevista/banco.md`**, con las mismas columnas en el mismo orden (ID, Depende de, Parte, Clase, Sensible, texto, etc.) y una columna nueva **al final**, `Tema`. Su valor es `comun` o una de las claves de `temas.md`.

- [ ] **Step 1:** Leer `docs/v3/entrevista/como-lo-hicimos.md` y seguir ese método.
- [ ] **Step 2:** Fable redacta la parte común, unas 10 preguntas, con los tramos del spec §4.1: antes 2, comienzo 2, lo más difícil 2, giro 1, después 2, cierre 1. Van en tandas de 10 a Naza.
- [ ] **Step 3:** Fable redacta de 4 a 5 preguntas propias por tema, incluida `otra` (preguntas generales), en tandas de 10 a Naza. Las sensibles se marcan.
- [ ] **Step 4:** Fable redacta los mensajes fijos en tandas de 10:
  - `BIEN` y `BIEN-R` (texto de las plantillas);
  - `TEMA-ABIERTO` (le pregunta de qué historia quiere su libro) y `TEMA-LISTA` (la lista, si duda);
  - `COMO` (cómo funciona: unas 15 preguntas, audio, «paso»);
  - acuses, `M8` (recordatorio) y el pedido de fotos a mitad de la entrevista;
  - los mensajes del que regala (equivalentes a PR-R/ATR-PR de `docs/viajes-v2/banco.md` ~L210);
  - `FIN` (despedida).
- [ ] **Step 5:** Escribir `docs/historia/banco.md` con todo lo aprobado. La primera línea dice «vigente, aprobado por Naza el DD/MM».
- [ ] **Step 6:** Commit `historia: banco es-AR aprobado por Naza`.

### Task 0.3: Idiomas

**Files:**
- Create: `docs/historia/idiomas/banco-es-ES.md`, `docs/historia/idiomas/banco-ca.md`

- [ ] **Step 1:** La traducción usa el formato de `docs/v3/entrevista/banco-ca.md` (solo textos, por ID), con Opus.
- [ ] **Step 2:** El catalán pasa por una retro-traducción a ciegas, después por Softcatalà y por una segunda lectura a ciegas (el proceso de `docs/viajes-v2/idiomas/`).
- [ ] **Step 3:** Naza aprueba las diferencias que importan, de a 10.
- [ ] **Step 4:** Commit `historia: banco es-ES y ca revisados`.

### Task 0.4: Receta del escritor

**Files:**
- Create: `docs/historia/escritor/receta.md`

- [ ] **Step 1:** Partir de `docs/v5/escritor-v55/receta.md` (Familiar adulto). La receta de historia cambia esto:
  - un solo hilo de punta a punta, de 4 a 6 capítulos y el golpe preparado;
  - el título sale del tema y de sus palabras;
  - relato y no transcripción;
  - lo delicado va como lo dijo;
  - no se inventan hechos.
- [ ] **Step 2:** Mantener los mismos encabezados `### …` que la receta v5.5, con el prefijo `### Historia · …`, para que el compilador de la Task 5.1 los encuentre.
- [ ] **Step 3:** Naza la lee entera, porque es texto que define el libro. Commit `historia: receta del escritor aprobada`.

---

## Fase 1 · Núcleo de la entrevista (fabrica)

### Task 1.1: Copiar el núcleo de V3 y sumar los temas

**Files:**
- Create: `fabrica/src/historia/entrevista/*` (copia de `fabrica/src/v3/entrevista/*`)
- Create: `fabrica/src/historia/ficha.ts` (copia de `fabrica/src/v3/ficha.ts` + tema)
- Create: `fabrica/src/historia/entrevista/temas.ts`
- Create: `fabrica/test/fixtures/historia/banco.md` (banco de prueba)
- Test: `fabrica/test/historia-temas.test.ts`

**Interfaces:**
- Produces: `TEMAS_HISTORIA`, `type TemaHistoria`, `esTema(x): x is TemaHistoria`, `bancoDeTema(banco: BancoEntrevista, tema: TemaHistoria): BancoEntrevista`, `type FichaHistoria = FichaV3Copia & { tema: TemaHistoria; temaLibre?: string }`. `PreguntaEntrevista` (en la copia) suma `tema: 'comun' | TemaHistoria`.

- [ ] **Step 1: Copiar**

```bash
cd "C:/Users/Naza/Desktop/VITACORA FAMILIAR-historia/fabrica"
mkdir -p src/historia/entrevista test/fixtures/historia
cp src/v3/entrevista/*.ts src/historia/entrevista/
cp src/v3/ficha.ts src/historia/ficha.ts
```

No se copian los `.json`: se generan en la Task 1.2. Corregir los imports relativos que apunten a `../ficha` o a `../../` hasta que `npx tsc --noEmit -p tsconfig.check.json` compile.

- [ ] **Step 2: Banco de prueba.** En `test/fixtures/historia/banco.md` va una copia de `docs/v3/entrevista/banco.md` recortada a 6 preguntas. Se le agrega la columna `Tema`: 3 con `comun`, 2 con `mudanza` y 1 con `otra`. Los mensajes fijos quedan, con texto de prueba, por ejemplo «[prueba] BIEN». Este archivo no es contenido real.

- [ ] **Step 3: Test que falla**

```ts
// fabrica/test/historia-temas.test.ts
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { parsearEntrevistaMd } from '../src/historia/entrevista/banco-md';
import { bancoDeTema, esTema, TEMAS_HISTORIA } from '../src/historia/entrevista/temas';

const banco = parsearEntrevistaMd(readFileSync('test/fixtures/historia/banco.md', 'utf8'));

describe('temas de historia', () => {
  it('las claves son las de docs/historia/temas.md', () => {
    expect(TEMAS_HISTORIA).toEqual(['mudanza', 'negocio', 'enfermedad', 'conocimos', 'padres', 'trabajo', 'otra']);
    expect(esTema('mudanza')).toBe(true);
    expect(esTema('viaje')).toBe(false);
  });
  it('cada pregunta trae su tema', () => {
    expect(banco.preguntas.every((p) => p.tema === 'comun' || esTema(p.tema))).toBe(true);
  });
  it('bancoDeTema deja la parte común y las del tema, en el orden del md', () => {
    const b = bancoDeTema(banco, 'mudanza');
    expect(b.preguntas.map((p) => p.tema)).toEqual(['comun', 'comun', 'mudanza', 'mudanza', 'comun']);
    expect(b.mensajes).toBe(banco.mensajes);
  });
  it('otra deja la común y las generales', () => {
    expect(bancoDeTema(banco, 'otra').preguntas.filter((p) => p.tema !== 'comun')).toHaveLength(1);
  });
});
```

(El orden del `toEqual` del tercer test tiene que coincidir con cómo se ordenaron las filas del banco de prueba en el Step 2. Ajustar el banco de prueba, no el test.)

- [ ] **Step 4:** Correr `npx vitest run test/historia-temas.test.ts`. Tiene que FALLAR porque no existe `temas.ts`.

- [ ] **Step 5: Implementar**

```ts
// fabrica/src/historia/entrevista/temas.ts
import type { BancoEntrevista } from './banco-md';

/** Las claves de docs/historia/temas.md. El texto de cada tema vive en el md, no acá. */
export const TEMAS_HISTORIA = ['mudanza', 'negocio', 'enfermedad', 'conocimos', 'padres', 'trabajo', 'otra'] as const;
export type TemaHistoria = (typeof TEMAS_HISTORIA)[number];

export function esTema(x: unknown): x is TemaHistoria {
  return typeof x === 'string' && (TEMAS_HISTORIA as readonly string[]).includes(x);
}

/** El banco que recibe un narrador: la parte común y las de su tema, en el orden del md. */
export function bancoDeTema(banco: BancoEntrevista, tema: TemaHistoria): BancoEntrevista {
  return { ...banco, preguntas: banco.preguntas.filter((p) => p.tema === 'comun' || p.tema === tema) };
}
```

En `src/historia/entrevista/banco-md.ts` (la copia):
- `PreguntaEntrevista` suma `tema: 'comun' | TemaHistoria`;
- `parsearEntrevistaMd` lee la última columna `Tema` y tira `Error('historia: tema desconocido «X» en <ID>')` si no es `comun` ni `esTema`.

En `src/historia/ficha.ts` el tipo se renombra a `FichaHistoria` y suma `tema: TemaHistoria; temaLibre?: string`.

- [ ] **Step 6:** Correr el test, que tiene que PASAR. Correr también `npm test`, que tiene que quedar verde, porque V3 no cambió.

- [ ] **Step 7:** Commit `historia: núcleo copiado de V3 con temas`.

### Task 1.2: md → json y banco cargado por idioma

**Files:**
- Create: `fabrica/scripts/historia-json.ts` (copia de `fabrica/scripts/v3-entrevista-json.ts`, con rutas a `docs/historia/` y a `src/historia/entrevista/`)
- Modify: `fabrica/src/historia/entrevista/banco.ts` (importa los json de historia)
- Test: `fabrica/test/historia-banco.test.ts`

**Interfaces:**
- Consumes: `parsearEntrevistaMd`, `bancoDeTema` (1.1)
- Produces: `bancoDe(idioma?)` y `mensajesDe(idioma?)` sobre el banco de historia. `bancoHistoria(tema, idioma?) = bancoDeTema(bancoDe(idioma), tema)`.

- [ ] **Step 1:** Mientras no exista `docs/historia/banco.md`, el script acepta `--desde <md>`. Correr `npx tsx scripts/historia-json.ts --desde test/fixtures/historia/banco.md` para que genere `src/historia/entrevista/banco.json`. Sin los md de idiomas, `banco-ca.json` y `banco-es-ES.json` quedan con los textos del es-AR y el script avisa `[historia-json] sin <md>: copio es-AR` por consola.
- [ ] **Step 2: Test que falla**

```ts
// fabrica/test/historia-banco.test.ts
import { describe, expect, it } from 'vitest';
import { bancoHistoria } from '../src/historia/entrevista/banco';

describe('banco de historia', () => {
  it('cada tema arranca por la parte común', () => {
    const b = bancoHistoria('mudanza');
    expect(b.preguntas[0].tema).toBe('comun');
  });
  it('los tres idiomas tienen las mismas preguntas', () => {
    const ids = (i?: 'es-AR' | 'ca' | 'es-ES') => bancoHistoria('mudanza', i).preguntas.map((p) => p.id);
    expect(ids('ca')).toEqual(ids());
    expect(ids('es-ES')).toEqual(ids());
  });
});
```

- [ ] **Step 3:** Correr el test. Tiene que FALLAR porque `bancoHistoria` no existe.
- [ ] **Step 4:** En `banco.ts` (copia) se cambian los imports a los json de historia y se suma `export function bancoHistoria(tema: TemaHistoria, idioma?: Idioma) { return bancoDeTema(bancoDe(idioma), tema); }`.
- [ ] **Step 5:** Hay que sumar un test de frescura copiado de `fabrica/test/v3-entrevista-banco.test.ts`: el json tiene que coincidir con el md. Mientras no exista `docs/historia/banco.md`, compara contra el fixture. Correr `npm test`, que tiene que quedar verde.
- [ ] **Step 6:** Commit `historia: banco json por idioma`.

### Task 1.3: Sacar del flujo lo que es propio de V3

**Files:**
- Modify: `fabrica/src/historia/entrevista/flujo.ts`, `mensajes.ts`, `texto.ts`, `seleccion.ts`, `vidas-ejemplo.ts`
- Test: `fabrica/test/historia-flujo.test.ts`

La copia trae constantes y IDs de la vida entera que no existen en historia, como `BLOQUE_FINAL = 15`, `ROTAN`, `M1`, `FO1`, `CA1` o las preguntas «de familia».

- [ ] **Step 1:** Listarlas con `grep -nE "'[A-Z]{1,3}[0-9]+|BLOQUE_FINAL|ROTAN" src/historia/entrevista/*.ts` y anotar cada una en el commit.
- [ ] **Step 2: Test que falla.** Es un recorrido completo con el banco de prueba y tema `mudanza`, contestando todo:

```ts
// fabrica/test/historia-flujo.test.ts
import { describe, expect, it } from 'vitest';
import { simularRecorrido } from '../src/historia/entrevista/seleccion';
import { bancoHistoria } from '../src/historia/entrevista/banco';

describe('flujo de historia', () => {
  it('recorre la común y las del tema, sin preguntas de V3', () => {
    const banco = bancoHistoria('mudanza');
    const ids = simularRecorrido({ banco, ficha: { nombre: 'Ana', genero: 'mujer', tema: 'mudanza' }, contesta: 'todo' });
    expect(ids).toEqual(banco.preguntas.map((p) => p.id));
  });
  it('«paso» en todas también termina', () => {
    const banco = bancoHistoria('otra');
    const ids = simularRecorrido({ banco, ficha: { nombre: 'Ana', genero: 'varon', tema: 'otra' }, contesta: 'paso' });
    expect(ids.at(-1)).toBe(banco.preguntas.at(-1)!.id);
  });
});
```

(Si la firma de `simularRecorrido` en la copia es otra, se adapta la función, no el test. Este test define la interfaz de historia.)

- [ ] **Step 3:** Correr el test, que tiene que FALLAR.
- [ ] **Step 4:** Implementar con estos cambios:
  - las constantes salen del banco (la última pregunta de clase `final` cierra);
  - se borran ramas de V3 sin uso (familia, M1, FO1);
  - `{{historia}}` en `texto.ts` renderiza `ficha.temaLibre` si existe y, si no, el nombre del tema, que viene del banco (mensajes `TEMA-<clave>`), no del código;
  - las preguntas propias del que regala (`{tipo:'propia'}`) van antes de la última de clase `final`, en el orden de la compra.
- [ ] **Step 5:** Sumar un test de las propias: con 2 propias, salen en el anteúltimo y el antepenúltimo lugar y se renderizan tal cual, sin revisión.
- [ ] **Step 6:** `npm test` en verde. Commit `historia: flujo sin lo propio de V3`.

### Task 1.4: Cazador con su prompt

**Files:**
- Modify: `fabrica/src/historia/entrevista/cazador.ts`
- Create: `fabrica/scripts/historia-cazador-json.ts` (copia de `v3-cazador-json.ts`, lee `docs/historia/cazador/prompt*.md` y, si no existe, el de V3)
- Test: `fabrica/test/historia-cazador.test.ts`

- [ ] **Step 1: Test que falla.** Con un `ClienteModelo` falso que devuelve una elegida, `cazarBloque` pide como máximo **1** repregunta por pregunta, según el spec («una vez por pregunta»), y respeta el tope de USD 3 por entrevista.
- [ ] **Step 2:** Implementar `MAX_ELEGIDAS = 1` y que el prompt salga de `cazador-prompt*.json` de historia.
- [ ] **Step 3:** `npm test` en verde. Commit `historia: cazador de una repregunta`.

---

## Fase 2 · Base de datos

### Task 2.1: Migración `historias`

**Files:**
- Create: `supabase/migrations/20261022000000_historias.sql`
- Modify: `supabase/CONTRATO.md` (nueva sección «Vitácora de una historia»)

- [ ] **Step 1: Escribir**

```sql
-- Vitácora de una historia (spec docs/superpowers/specs/2026-10-21-vitacora-de-una-historia-design.md).
-- Una fila en `historias` prende la entrevista de una historia para ese narrador. La crea el bot
-- (entrevistador/src/historia/alta.ts) a partir de narradores.contexto.historia. Mismo esquema que
-- entrevistas_v3: el estado en jsonb y compare-and-swap sobre `version`. Idempotente, no toca datos.
-- ⚠️ Toca supabase/CONTRATO.md. La aplica Naza.

create table if not exists historias (
  narrador_id     uuid primary key references narradores (id),
  idioma          text not null default 'es-AR' check (idioma in ('es-AR', 'es-ES', 'ca')),
  ficha           jsonb not null,                 -- {nombre, genero, formaTrato?, quienRegala?, tema, temaLibre?}
  compra          jsonb not null default '{}',    -- {preguntasPropias: string[]} (hasta 3)
  estado          jsonb not null,
  version         int not null default 0,
  ultimo_audio_at timestamptz,
  tanda_dia       date,
  tanda_cuenta    int not null default 0,
  enviando_hasta  timestamptz,
  creada_at       timestamptz not null default now()
);

alter table historias enable row level security;  -- sin policies: solo la service role

alter table respuestas add column if not exists clave_historia text;
comment on column respuestas.clave_historia is
  'Vitácora de una historia: la pregunta de esta fila. ∅ = se guardó y quedó afuera a propósito.';

alter table envios drop constraint if exists envios_tipo_check;
alter table envios add constraint envios_tipo_check
  check (tipo in ('bienvenida','pregunta','repregunta','recordatorio','alerta_pausa',
                  'despedida','saludo_final','oferta_siguiente','objeto','v3','historia'));
```

- [ ] **Step 2:** Antes de escribir el check de `envios`, hay que confirmar con `grep -rn "envios_tipo_check" supabase/migrations` que la última migración que lo toca no sumó otros tipos. Si los sumó, se copian todos.
- [ ] **Step 3:** Commit `historia: migración historias (la aplica Naza)`.

---

## Fase 3 · El bot

### Task 3.1: Copia del núcleo al entrevistador

**Files:**
- Create: `entrevistador/scripts/historia-copiar-nucleo.ts` (copia de `entrevistador/scripts/v3-copiar-nucleo.ts`, con `fabrica/src/historia/entrevista/*` + `fabrica/src/historia/ficha.ts` → `entrevistador/src/historia/nucleo/`)
- Create: `entrevistador/test/historia/copia-nucleo.test.ts` (copia de `test/v3/copia-nucleo.test.ts` con las rutas de historia)
- Modify: `entrevistador/package.json` (script `"historia-copiar-nucleo"`)

- [ ] **Step 1:** Escribir el test de copia y correrlo. Tiene que FALLAR porque no hay copia.
- [ ] **Step 2:** Escribir el script y correr `npm run historia-copiar-nucleo`.
- [ ] **Step 3:** `npm test` en verde. Commit `historia: núcleo en el entrevistador`.

### Task 3.2: Lo de afuera del bot, copiado de V3

**Files:**
- Create: `entrevistador/src/historia/{estado,entrante,turno,enviar,reloj,filas,deps,deps-reales,cazador,tanda,pedidos,fuera,avisos,textos-fijos,tipos}.ts`, copiados de `entrevistador/src/v3/`
- Create: `entrevistador/test/historia/*.test.ts`, copiados de `entrevistador/test/v3/` (con `deps-prueba.ts` y `base-falsa.ts`)

**Interfaces:**
- Produces:
  - `TABLA_HISTORIA = 'historias'`, `esNarradorHistoria(db, id): Promise<boolean>`, `crearFila(db, FilaNuevaHistoria)`;
  - `procesarEntranteHistoria(deps: DepsHistoria, n, m)` y `tickHistoria(deps)`;
  - `depsHistoriaReales()`.

- [ ] **Step 1: Copiar**

```bash
cd "C:/Users/Naza/Desktop/VITACORA FAMILIAR-historia/entrevistador"
mkdir -p src/historia test/historia
for f in estado entrante turno enviar reloj filas deps deps-reales cazador tanda pedidos fuera avisos textos-fijos tipos; do cp src/v3/$f.ts src/historia/$f.ts; done
cp src/v3/textos-fijos.json src/historia/
cp test/v3/*.ts test/historia/
```

- [ ] **Step 2:** Renombrar dentro de `src/historia/` y `test/historia/`:
  - `TABLA_V3`→`TABLA_HISTORIA`, `'entrevistas_v3'`→`'historias'` y `clave_v3`→`clave_historia`;
  - `esNarradorV3`→`esNarradorHistoria`, `procesarEntranteV3`→`procesarEntranteHistoria`, `tickV3`→`tickHistoria`, `DepsV3`→`DepsHistoria` y `depsReales`→`depsHistoriaReales`;
  - `paso: 'cazador_v3'`→`'cazador_historia'`, el tipo de envío `'v3'`→`'historia'` y `V3_CAZADOR`→`HISTORIA_CAZADOR`.
  
  Los imports `./nucleo/...` apuntan a `src/historia/nucleo/`. Se borran los tests que solo prueban cosas de V3 sin uso en historia (migración de narradores viejos, familia y `turno-igual-al-script`). Cada test borrado se nombra en el mensaje del commit.
- [ ] **Step 3:** El banco que usa el turno es el del narrador. `textoDelBanco` y `avanzar` reciben `bancoHistoria(ficha.tema, idioma)` en vez del banco global.
- [ ] **Step 4:** Los tests copiados quedan en verde con el banco de prueba (copiado por la Task 3.1). `npm test` en verde. Commit `historia: bot copiado de V3 sobre la tabla historias`.

### Task 3.3: Alta desde la compra

**Files:**
- Create: `entrevistador/src/historia/alta.ts` (modelo `entrevistador/src/viaje-v2/alta.ts`)
- Test: `entrevistador/test/historia/alta.test.ts`

**Interfaces:**
- Consumes: `narradores.contexto.historia = { tema: TemaHistoria; temaLibre?: string; temaAbierto?: boolean; preguntasPropias?: string[] }` (lo escribe la web, Task 4.2), `contexto.genero`, `idiomaDe(contexto)`.
- Produces: `asegurarAltaHistoria(deps: DepsHistoria, n: Narrador): Promise<'creada' | 'ya-estaba' | 'frenada'>`.

- [ ] **Step 1: Test que falla**

```ts
// entrevistador/test/historia/alta.test.ts
import { describe, expect, it } from 'vitest';
import { asegurarAltaHistoria } from '../../src/historia/alta';
import { depsDePrueba, narradorDePrueba } from './deps-prueba';

describe('alta de historia', () => {
  it('crea la fila con tema y propias', async () => {
    const d = depsDePrueba();
    const n = narradorDePrueba({ contexto: { modo: 'historia', genero: 'mujer', historia: { tema: 'mudanza', preguntasPropias: ['¿Qué extrañabas?'] } } });
    expect(await asegurarAltaHistoria(d, n)).toBe('creada');
    const fila = d.base.historias.get(n.id)!;
    expect(fila.ficha.tema).toBe('mudanza');
    expect(fila.compra.preguntasPropias).toEqual(['¿Qué extrañabas?']);
  });
  it('dos veces no duplica', async () => {
    const d = depsDePrueba();
    const n = narradorDePrueba({ contexto: { modo: 'historia', genero: 'varon', historia: { tema: 'otra', temaLibre: 'El año en el campo' } } });
    await asegurarAltaHistoria(d, n);
    expect(await asegurarAltaHistoria(d, n)).toBe('ya-estaba');
  });
  it('sin género no arranca y avisa', async () => {
    const d = depsDePrueba();
    const n = narradorDePrueba({ contexto: { modo: 'historia', historia: { tema: 'negocio' } } });
    expect(await asegurarAltaHistoria(d, n)).toBe('frenada');
    expect(d.avisos).toHaveLength(1);
  });
  it('más de 3 propias: se guardan 3 y se avisa', async () => {
    const d = depsDePrueba();
    const n = narradorDePrueba({ contexto: { modo: 'historia', genero: 'mujer', historia: { tema: 'negocio', preguntasPropias: ['a', 'b', 'c', 'd'] } } });
    await asegurarAltaHistoria(d, n);
    expect(d.base.historias.get(n.id)!.compra.preguntasPropias).toHaveLength(3);
    expect(d.avisos).toHaveLength(1);
  });
});
```

(Si `deps-prueba.ts` copiado no tiene `narradorDePrueba` ni `base.historias`, se agregan ahí en este paso.)

- [ ] **Step 2:** Correr el test, que tiene que FALLAR.
- [ ] **Step 3:** Implementar `alta.ts`:
  - toma la ficha de `fichaDeNarrador` (de `pasar.ts`, copiar solo esa función a `alta.ts`) y le suma `tema` y `temaLibre`;
  - `temaAbierto: true` deja `ficha.tema = 'otra'` y `estado.temaAbierto = true`, para que el turno mande `TEMA-ABIERTO` antes de la primera pregunta;
  - con `contexto.historia.tema` desconocido, frena y avisa con `deps.avisar`.
- [ ] **Step 4:** Test de tema abierto en `turno`: con `estado.temaAbierto`, el primer saliente después del SÍ es `TEMA-ABIERTO`. La respuesta se guarda en `ficha.temaLibre`, con `clave_historia = 'TEMA'`, y sigue `COMO` más la primera pregunta. El tema queda `otra`, porque la respuesta libre no se clasifica con un modelo.
- [ ] **Step 5:** `npm test` en verde. Commit `historia: alta desde contexto.historia y tema abierto`.

### Task 3.4: Enganches (ruteo, tick, bienvenida, plantillas)

**Files:**
- Modify: `entrevistador/src/flujo/procesar.ts` (después del bloque de viaje-v2, ~L183-210, antes de V3, ~L215)
- Modify: `entrevistador/src/config.ts` (`entraALaV3` ~L159, `PLANTILLAS_HISTORIA` junto a `PLANTILLAS_V3` ~L48)
- Modify: `entrevistador/src/flujo/scheduler.ts` (tick junto a `tickKids` ~L479; bienvenida en `enviarBienvenidas` ~L183-240)
- Modify: `entrevistador/src/variables.ts` (validación de `WA_PLANTILLAS_HISTORIA_LISTAS`)
- Test: `entrevistador/test/historia/ruteo.test.ts`, `entrevistador/test/config.test.ts` (sumar casos)

- [ ] **Step 1: Tests que fallan**

```ts
// en entrevistador/test/config.test.ts
it('una historia nunca entra a la V3', () => {
  expect(entraALaV3({ modo: 'historia', regalo: true })).toBe(false);
});
```

```ts
// entrevistador/test/historia/ruteo.test.ts
// Con un narrador `activo` con fila en `historias`, procesarEntrante llama a procesarEntranteHistoria y no a la V3.
// Usar el mismo armado de mocks que el test de ruteo de viaje-v2 (buscar `esViajeroV2` en entrevistador/test).
```

- [ ] **Step 2:** Correrlos, que tienen que FALLAR.
- [ ] **Step 3:** Implementar:
  - `config.ts`: `if (contexto?.modo === 'historia') return false;` en `entraALaV3`, junto a la línea de `'kids'`. Es el único cambio en código de V3, y es una exclusión.
  - `config.ts`: `PLANTILLAS_HISTORIA[idioma] = { bienvenida, bienvenida_quien, pregunta, recordatorio }` con nombres `bienvenida_historia_vos` / `_tu` / `_ca`, `bienvenida_historia_quien_*`, y reusar `pregunta_diaria_*` y `m8_*` de V3. Sumar `plantillaListaHistoria(idioma, cual)`, que lee `WA_PLANTILLAS_HISTORIA_LISTAS` igual que `plantillaLista` de `v3/enviar.ts:29`. Que el `enviar.ts` copiado use esta.
  - `procesar.ts`: entre viaje-v2 y V3, `if (await esNarradorHistoria(db, narrador.id) || narrador.contexto?.modo === 'historia') { await asegurarAltaHistoria(...); return procesarEntranteHistoria(...) }` con imports dinámicos, como las otras ramas.
  - `scheduler.ts`: tick `tickHistoria(depsHistoriaReales())` en el mismo bloque `try` que `tickKids`. En `enviarBienvenidas`, un narrador `invitado` con `modo 'historia'` recibe `bienvenida_historia(_quien)`, si está lista, con el tema en la variable de la plantilla.
- [ ] **Step 4:** `npm test` en verde. Commit `historia: ruteo, tick, bienvenida y plantillas`.

### Task 3.5: Simulación y lectura corrida

**Files:**
- Create: `entrevistador/scripts/historia-simular.ts` (modelo: el simulador de viaje-v2, buscar `simular` en `entrevistador/scripts`)
- Create: `fabrica/scripts/historia-lectura.ts` (modelo `fabrica/scripts/v3-entrevista-lectura.ts`) → `docs/historia/lectura-corrida.md`

- [ ] **Step 1:** El simulador corre 300 narradores por idioma (es-AR, es-ES y ca), con los 7 temas, regalo o no, tema abierto, «paso», texto, silencio de 3 días y propias. Los controles que tienen que dar 0 son:
  - pregunta repetida;
  - pregunta de otro tema;
  - mensaje fuera de horario;
  - entrevista que no termina;
  - `{{` sin reemplazar;
  - género que no corresponde.
- [ ] **Step 2:** La lectura corrida es una historia inventada, mensaje por mensaje, para que Naza la lea. Solo se genera con el banco real (Fase 0 cerrada).
- [ ] **Step 3:** Commit `historia: simulación y lectura corrida`. Al cerrar la fase, revisión con el agente `code-reviewer` y PR «Historia · bot».

---

## Fase 4 · La web

### Task 4.1: `lib/historia.ts`

**Files:**
- Create: `web/src/lib/historia.ts`
- Test: `web/test/historia.test.ts`

**Interfaces:**
- Produces:
  - `HISTORIA_TEMAS`, `type TemaHistoria`;
  - `historiaVende(region, env?)` y `historiaVendeEn(idioma: IdiomaWeb, env?)`;
  - `MAX_PROPIAS_HISTORIA = 3` y `PROPIA_MAXIMO = 300`;
  - `type CompraHistoria = { tema: TemaHistoria; temaLibre?: string; temaAbierto?: boolean; preguntasPropias: string[] }`;
  - `validarHistoria(entrada: unknown, o: { regalo: boolean }): { ok: true; historia: CompraHistoria } | { ok: false; mensaje: string }`.

- [ ] **Step 1: Test que falla**

```ts
// web/test/historia.test.ts
import { describe, expect, it } from 'vitest';
import { historiaVende, historiaVendeEn, validarHistoria } from '@/lib/historia';

describe('historia en la web', () => {
  it('se vende solo con HISTORIA_VENTA=1', () => {
    expect(historiaVende('ES', {} as NodeJS.ProcessEnv)).toBe(false);
    expect(historiaVende('ES', { HISTORIA_VENTA: '1' } as NodeJS.ProcessEnv)).toBe(true);
    expect(historiaVendeEn('ca', { HISTORIA_VENTA: '1' } as NodeJS.ProcessEnv)).toBe(true);
  });
  it('tema de la lista', () => {
    expect(validarHistoria({ tema: 'mudanza', preguntasPropias: [] }, { regalo: false })).toMatchObject({ ok: true });
    expect(validarHistoria({ tema: 'viaje', preguntasPropias: [] }, { regalo: false }).ok).toBe(false);
  });
  it('otra pide el texto', () => {
    expect(validarHistoria({ tema: 'otra', preguntasPropias: [] }, { regalo: false }).ok).toBe(false);
    expect(validarHistoria({ tema: 'otra', temaLibre: '  El campo  ', preguntasPropias: [] }, { regalo: false }))
      .toEqual({ ok: true, historia: { tema: 'otra', temaLibre: 'El campo', preguntasPropias: [] } });
  });
  it('tema abierto y propias solo en regalo, hasta 3', () => {
    expect(validarHistoria({ temaAbierto: true, preguntasPropias: [] }, { regalo: false }).ok).toBe(false);
    expect(validarHistoria({ temaAbierto: true, preguntasPropias: [] }, { regalo: true }))
      .toEqual({ ok: true, historia: { tema: 'otra', temaAbierto: true, preguntasPropias: [] } });
    expect(validarHistoria({ tema: 'negocio', preguntasPropias: ['a'] }, { regalo: false }).ok).toBe(false);
    expect(validarHistoria({ tema: 'negocio', preguntasPropias: ['a', 'b', 'c', 'd'] }, { regalo: true }).ok).toBe(false);
  });
});
```

- [ ] **Step 2:** Correr `cd web && npx vitest run test/historia.test.ts`. Tiene que FALLAR.
- [ ] **Step 3: Implementar**

```ts
// web/src/lib/historia.ts
import type { IdiomaWeb } from "@/lib/idioma-web";
import type { Region } from "@/lib/precios";

/**
 * Vitácora de una historia (spec 2026-10-21). Las claves son las de docs/historia/temas.md; los nombres
 * que ve la persona están en _textos, no acá. El precio es el de Familiar (obtenerPrecio): no hay variable propia.
 */
export const HISTORIA_TEMAS = ["mudanza", "negocio", "enfermedad", "conocimos", "padres", "trabajo", "otra"] as const;
export type TemaHistoria = (typeof HISTORIA_TEMAS)[number];
export const MAX_PROPIAS_HISTORIA = 3;
export const PROPIA_MAXIMO = 300;
export const TEMA_LIBRE_MAXIMO = 120;

export type CompraHistoria = { tema: TemaHistoria; temaLibre?: string; temaAbierto?: boolean; preguntasPropias: string[] };

export function historiaVende(_region: Region, env: NodeJS.ProcessEnv = process.env): boolean {
  return env.HISTORIA_VENTA === "1";
}

export function historiaVendeEn(idioma: IdiomaWeb, env: NodeJS.ProcessEnv = process.env): boolean {
  return historiaVende(idioma === "ar" ? "AR" : "ES", env);
}

const esTema = (x: unknown): x is TemaHistoria => typeof x === "string" && (HISTORIA_TEMAS as readonly string[]).includes(x);

export function validarHistoria(
  entrada: unknown,
  o: { regalo: boolean },
): { ok: true; historia: CompraHistoria } | { ok: false; mensaje: string } {
  const e = (entrada ?? {}) as Record<string, unknown>;
  const propias = Array.isArray(e.preguntasPropias)
    ? e.preguntasPropias.filter((p): p is string => typeof p === "string").map((p) => p.trim()).filter(Boolean)
    : [];
  if (propias.length > 0 && !o.regalo) return { ok: false, mensaje: "historia: preguntas propias solo en regalo" };
  if (propias.length > MAX_PROPIAS_HISTORIA) return { ok: false, mensaje: "historia: más de 3 preguntas propias" };
  if (propias.some((p) => p.length > PROPIA_MAXIMO)) return { ok: false, mensaje: "historia: pregunta propia muy larga" };
  if (e.temaAbierto === true) {
    if (!o.regalo) return { ok: false, mensaje: "historia: tema abierto solo en regalo" };
    return { ok: true, historia: { tema: "otra", temaAbierto: true, preguntasPropias: propias } };
  }
  if (!esTema(e.tema)) return { ok: false, mensaje: "historia: tema desconocido" };
  if (e.tema === "otra") {
    const libre = typeof e.temaLibre === "string" ? e.temaLibre.trim() : "";
    if (!libre) return { ok: false, mensaje: "historia: falta la historia" };
    if (libre.length > TEMA_LIBRE_MAXIMO) return { ok: false, mensaje: "historia: la historia es muy larga" };
    return { ok: true, historia: { tema: "otra", temaLibre: libre, preguntasPropias: propias } };
  }
  return { ok: true, historia: { tema: e.tema, preguntasPropias: propias } };
}
```

(Si `Region` no se exporta desde `@/lib/precios`, se importa de donde la importa `web/src/lib/kids.ts`.)

- [ ] **Step 4:** El test tiene que PASAR. Commit `web: lib/historia (temas, validación, interruptor)`.

### Task 4.2: Registro y API de compra

**Files:**
- Modify: `web/src/lib/registro.ts` (junto al bloque de viaje, ~L309-321)
- Test: `web/test/historia-api.test.ts` (modelo `web/test/viaje-api.test.ts`)

- [ ] **Step 1: Test que falla.** Hace un POST a `/api/compra` con `narrador.contexto.historia = { tema: 'mudanza', preguntasPropias: [] }` y comprueba que el narrador queda con `contexto.modo === 'historia'`, `contexto.historia.tema === 'mudanza'` y el monto de Familiar (`obtenerPrecio`, más el impreso si se pidió). Con `HISTORIA_VENTA` apagado responde 400 y no crea nada.
- [ ] **Step 2:** Correrlo, que tiene que FALLAR.
- [ ] **Step 3:** Implementar en `registro.ts`, después del bloque `if (contexto.viaje !== undefined) {…}`:

```ts
  // Vitácora de una historia (21/10): la compra de Familiar con el tema. La fila de `historias` la crea el bot.
  if (contexto.historia !== undefined) {
    if (!historiaVende(region)) return { ok: false, status: 400, mensaje: 'historia: no está a la venta' };
    const h = validarHistoria(contexto.historia, { regalo: esRegaloDeLaCompra });
    if (!h.ok) return { ok: false, status: 400, mensaje: h.mensaje };
    contextoFinal.modo = 'historia';
    contextoFinal.historia = h.historia;
  }
```

`esRegaloDeLaCompra` es la variable que ya usa `registro.ts` para saber si es regalo. Hay que buscar dónde arma `contextoFinal.regalo` y reusar eso mismo. Sumar `historia` al tipo de `contexto` del body. En `confirmar-pago.ts` y en `pedidos.extras` no cambia nada, porque es un pedido de Familiar.
- [ ] **Step 4:** `npm test` en verde. Commit `web: compra de historia en el registro`.

### Task 4.3: Cuarta solapa

**Files:**
- Modify: `web/src/app/_publico/cabecera.tsx` (`Producto` L19, `comprar` L35, `conComprar` L37, `Solapas` L100-120)
- Modify: `web/src/app/_textos/publico.ts` (clave `historia`, con el texto que aprueba Naza: es/ar «Historia», ca «Història»)
- Modify: `web/src/app/globals.css` o donde esté `.m-solapas`/`.m-pill` (la animación con `translateX(100%/200%)` pasa a 4 posiciones)
- Test: `web/test/publico.test.tsx` (sumar casos)

- [ ] **Step 1: Test que falla.** La cabecera tiene 4 solapas con `data-solapa` igual a `familiar`, `kids`, `viaje` e `historia`. Con `producto="historia"`, la cuarta lleva `aria-current="page"` y «Comprar» va a `/comprar/historia`. Con `HISTORIA_VENTA` apagado no hay botón Comprar.
- [ ] **Step 2:** Correrlo, que tiene que FALLAR.
- [ ] **Step 3:** Implementar:
  - `Producto` suma `"historia"`;
  - `grid-cols-4` y pastilla `w-[calc((100%-8px)/4)]`;
  - cuarto `Link` a `ruta(idioma, "/historia")`;
  - `conComprar` suma `(producto !== "historia" || historiaVendeEn(idioma))`;
  - el CSS de `.m-pill` gana la posición `[data-activa=historia]` → `translateX(300%)` (buscar `data-activa` en el CSS y copiar el patrón).
- [ ] **Step 4: Prueba en 360 px.** Con `preview_start`, hay que abrir `/`, `/ca` y `/ar` con `resize_window` a 360×800 y, después, a 375. Que ninguna solapa corte texto ni haya scroll horizontal (`document.documentElement.scrollWidth <= 360`). Si «De viaje» no entra, se cambia el texto de la clave `viaje` a «Viaje» solo en móvil y se le avisa a Naza. Hay que sacar captura.
- [ ] **Step 5:** Hay que buscar `grep -rn "Familiar · Kids · De viaje\|tres productos\|3 productos" web/src docs/web-textos-v3` y avisar a Naza de cada texto que queda mintiendo (memoria «textos que quedan mintiendo»).
- [ ] **Step 6:** `npm test` en verde. Commit `web: cuarta solapa Historia`.

### Task 4.4: Página `/historia` y compra `/comprar/historia`

**Files:**
- Create: `web/src/app/_historia-producto/pagina.tsx` (modelo `web/src/app/_kids/pagina.tsx`)
- Create: `web/src/app/_textos/historia.ts` (`TEXTOS_HISTORIA` es/ca/ar, **solo con textos aprobados por Naza**)
- Create: `web/src/app/historia/page.tsx`, `ar/historia/page.tsx`, `ca/historia/page.tsx`, más un `opengraph-image.tsx` para cada una
- Create: `web/src/app/comprar/historia/page.tsx` (×3 idiomas) y `web/src/app/_checkout/pagina-historia.tsx`
- Modify: `web/src/app/comprar/formulario.tsx` y `comprar/compra.ts` (paso «Tema» cuando `historia`)
- Modify: `web/next.config.ts` (`PUBLICAS_POR_PAIS`, `LANDINGS_POR_PAIS`)
- Modify: `web/src/lib/pagos.ts` (`OrigenCompra.pantalla` suma `"historia"`)
- Test: `web/test/historia-pagina.test.tsx`, `web/test/compra-historia.test.ts`

**Interfaces:**
- Consumes: `HISTORIA_TEMAS`, `validarHistoria` (4.1)
- Produces: `EstadoCompra.historia?: { tema: TemaHistoria | null; temaLibre: string; temaAbierto: boolean; preguntasPropias: string[] }`, y `cuerpoDeLaCompra` manda `narrador.contexto.historia` cuando existe.

- [ ] **Step 1: Textos.** Fable redacta la página (hero, cómo funciona y preguntas frecuentes) y el paso «Tema» (título, ayuda, «Otra historia», «que lo elija quien lo cuenta» y las propias) en los 3 idiomas. Naza los aprueba de a 10. No se promete cantidad de páginas ni tiempos que no se cumplen. Se escriben en `_textos/historia.ts`.
- [ ] **Step 2: Test de compra que falla.**

```ts
// web/test/compra-historia.test.ts
import { describe, expect, it } from 'vitest';
import { estadoInicial, fallaDelPaso, cuerpoDeLaCompra } from '@/app/comprar/compra';

describe('compra de historia', () => {
  it('sin tema no avanza', () => {
    const e = { ...estadoInicial(), historia: { tema: null, temaLibre: '', temaAbierto: false, preguntasPropias: [] } };
    expect(fallaDelPaso(1, e, /* T, entrega, ahora: copiar los que usa compra.test.ts */)).not.toBeNull();
  });
  it('manda contexto.historia', () => {
    const e = { ...estadoInicial(), historia: { tema: 'mudanza' as const, temaLibre: '', temaAbierto: false, preguntasPropias: [] } };
    expect(cuerpoDeLaCompra(e, 'es').narrador.contexto.historia).toEqual({ tema: 'mudanza', preguntasPropias: [] });
  });
});
```

(Los argumentos `T, entrega, ahora` de `fallaDelPaso` se copian de `web/test/compra.test.ts`. El paso del tema es el 1, junto al formato del libro. Si en el formulario queda mejor como paso propio, se cambia el número en el test y en el código.)
- [ ] **Step 3:** Correrlo, que tiene que FALLAR.
- [ ] **Step 4:** Implementar:
  - `Checkout` recibe la prop `historia` y muestra el bloque «Tema» con 7 opciones de radio. «Otra historia» abre un campo de una línea.
  - Si es regalo aparece la casilla «que lo elija quien lo cuenta» y hasta 3 campos de preguntas propias, con el patrón de `comprar/viaje/formulario.tsx` ~L330-344.
  - `fallaDelPaso` exige un tema, o `temaLibre` si es `otra`, salvo `temaAbierto`.
  - `cuerpoDeLaCompra` agrega `contexto.historia`.
  - Si `historiaVendeEn` es falso, la página de compra muestra «Próximamente» como Kids.
- [ ] **Step 5: Test de página.** `/historia`, `/ca/historia` y `/ar/historia` renderizan, con la solapa `historia` activa, y el `<title>` sale de `TEXTOS_HISTORIA`.
- [ ] **Step 6:** `npm test` en verde. Con `preview_start` se recorre la compra entera en 375 px en modo prueba de Stripe (local, con test keys del proyecto) y se saca captura. Commit `web: /historia y /comprar/historia`.

### Task 4.5: Panel

**Files:**
- Modify: `web/src/app/tablero/[narradorId]/page.tsx` (rama junto a `<HistoriaV3>`)
- Create: `web/src/app/tablero/[narradorId]/historia-producto.tsx`
- Test: `web/test/panel-historia.test.tsx`

- [ ] **Step 1: Test que falla.** El panel de un narrador `modo 'historia'` muestra el tema (o el `temaLibre`) y las respuestas, leyendo `respuestas.clave_historia`, y no muestra los bloques de V3.
- [ ] **Step 2:** Implementar reusando `<HistoriaV3>` con un origen de datos propio. Si `HistoriaV3` lee `clave_v3` fijo, se le agrega la prop `columnaClave` con default `'clave_v3'`, que es un cambio sin efecto para V3. Los textos nuevos del panel van a Naza.
- [ ] **Step 3:** `npm test` en verde. Commit `web: panel de historia`. Revisión con `code-reviewer` y PR «Historia · web».

---

## Fase 5 · El libro (fabrica)

### Task 5.1: Receta compilada

**Files:**
- Create: `fabrica/src/escritor-historia/prompts/compilar.ts` (modelo `fabrica/src/escritor-kids/prompts/compilar.ts`, reusa `bloquesDe` y `esquemaDeMd`)
- Create: `fabrica/src/escritor-historia/prompts/index.ts`, `prompts-historia.json`
- Create: `fabrica/scripts/escritor-historia-prompts-json.ts`
- Test: `fabrica/test/escritor-historia/prompts.test.ts`

- [ ] **Step 1: Test que falla.** El json coincide con `docs/historia/escritor/receta.md` (frescura, como `test/escritor-kids/prompts.test.ts`). Además están todas las `CLAVES_HISTORIA` y `version === 'historia-v1'`.
- [ ] **Step 2:** Implementar `CLAVES_HISTORIA`, con los encabezados que defina la receta de la Task 0.4, y `instruccionesHistoria(clave, huecos)`.
- [ ] **Step 3:** `npm test` en verde. Commit `escritor-historia: receta compilada`.

### Task 5.2: Material y orquestador

**Files:**
- Create: `fabrica/src/escritor/material/de-base-historia.ts` (modelo `de-base-kids.ts`: lee `historias`, `narradores`, `respuestas` con `clave_historia` no nulo menos `respuestas_fuera`, y `fotos`)
- Create: `fabrica/src/escritor-historia/orquestador.ts` (modelo `escritor-kids/orquestador.ts`: `etapaAHistoria`, `etapaBHistoria`, `etapaCHistoria`, `correrHistoria(x: ContextoHistoria)`)
- Test: `fabrica/test/escritor-historia/orquestador.test.ts`

- [ ] **Step 1: Test que falla.** Con un `Ejecutor` falso (copiar el armado de `test/escritor-kids/`), `correrHistoria` hace las llamadas en el orden de la receta, escribe `libro.md` en el almacén y no hace ninguna llamada real. El material incluye el tema y el `temaLibre`.
- [ ] **Step 2:** Implementar. Los roles por clave de llamada salen de `escritor/modelo/configuracion.ts` `rolDe`: los capítulos con Opus y lo mecánico con Haiku, igual que hoy. Si los nombres de llamada de historia no calzan con las regex de `rolDe`, se usan los mismos prefijos (`3b-capitulo-*`, `7-estilo-*`) en vez de tocar `rolDe`.
- [ ] **Step 3:** `npm test` en verde. Commit `escritor-historia: material y orquestador`.

### Task 5.3: Producción, worker y costos

**Files:**
- Create: `fabrica/src/escritor-historia/produccion/libro-historia.ts` (modelo `escritor-kids/produccion/libro-kids.ts`: `revisarLibrosHistoria(db, o?)`, `escribirLibroHistoria`, `motorRealHistoria`, `topeHistoria()` con `ESCRITOR_HISTORIA_TOPE_USD` default 10, `escritorHistoriaPrendido(id)` con `ESCRITOR_HISTORIA` = `1` o `solo:<id>`, `PREFIJO_HISTORIA = id => \`${id}/escritor-historia\``)
- Create: `fabrica/src/historia/candado.ts` (`narradoresConHistoria(db): Promise<Set<string>>`, tabla `historias`, modelo `src/kids/candado.ts`)
- Modify: `fabrica/src/worker.ts` (sumar `revisarLibrosHistoria(db)` en `tick()` y excluir `narradoresConHistoria` en cada rama donde hoy se excluye `narradoresConKids`)
- Modify: `fabrica/src/costos.ts` (`anotarUsoEscritorHistoria`, `paso='escritor-historia-A|B|C'`)
- Modify: `web/src/app/admin/...` (la etiqueta del `paso` nuevo, buscando `escritor-kids` en `web/src/app/admin`)
- Test: `fabrica/test/escritor-historia/produccion.test.ts`, `fabrica/test/worker.test.ts` (sumar caso)

- [ ] **Step 1: Tests que fallan.**
  - Un pedido `pagado` de un narrador con fila en `historias` y `libro_aprobado_at` no lo agarra la rama V3 ni la vieja del worker, y sí `revisarLibrosHistoria`.
  - Con `ESCRITOR_HISTORIA` apagado no se escribe nada.
  - El costo se anota con `paso='escritor-historia-C'`.
- [ ] **Step 2:** Implementar.
- [ ] **Step 3:** `npm test` en verde. Commit `escritor-historia: producción en el worker`.

### Task 5.4: Imprenta, sin Notas y con tope de 88

**Files:**
- Modify: `fabrica/src/libro/bookmundo/armar.ts` (`armarLibroBookmundo` suma `o.sinNotas?: boolean` y `o.formato?: 'tapa-dura' | 'tapa-blanda'`)
- Modify: `fabrica/src/libro/bookmundo/formato.ts` (`FORMATO_TAPA_BLANDA = { nombre: 'Mediano 2 tapa blanda', anchoMm: 170, altoMm: 240 }`, `PAGINAS_MINIMAS_TAPA_BLANDA = { crema: 44, blanco: 44, semibrillante: 42 }`; sangrado 3,0 mm según `docs/bookmundo/especificaciones-bookmundo-2026-10.md` L288)
- Create: `fabrica/src/escritor-historia/produccion/imprenta.ts` (`imprentaHistoria(db, id): Promise<'bookmundo' | 'flaco'>`)
- Create: `fabrica/scripts/historia-tapa-blanda.ts` (`npx tsx scripts/historia-tapa-blanda.ts <narradorId>`)
- Test: `fabrica/test/bookmundo.test.ts` (sumar casos), `fabrica/test/escritor-historia/imprenta.test.ts`

**Interfaces:**
- Produces: `armarLibroBookmundo(libro, cubierta, { papel?, sinNotas?, formato? })`. Con `sinNotas: true`, pasa `paginasMinimas: 0` a `construirHtmlLibro`.

- [ ] **Step 1: Tests que fallan**

```ts
// en fabrica/test/bookmundo.test.ts
it('sinNotas no agrega hojas de Notas', async () => {
  const r = await armarLibroBookmundo(libroCorto, cubiertaDePrueba, { sinNotas: true });
  expect(r.informeInterior.paginas).toBeLessThan(PAGINAS_MINIMAS_TAPA_DURA.crema);
});
it('tapa blanda usa 170×240', async () => {
  const r = await armarLibroBookmundo(libroCorto, cubiertaDePrueba, { formato: 'tapa-blanda', sinNotas: true });
  expect(r.archivoInterior).toContain('170x240');
});
```

(`libroCorto` y `cubiertaDePrueba` salen de los datos de prueba que ya usa `bookmundo.test.ts`. `libroCorto` es uno con 2 capítulos breves.)

```ts
// fabrica/test/escritor-historia/imprenta.test.ts
// imprentaHistoria con un libro de < 88 páginas → devuelve 'flaco', NO sube nada a {id}/bookmundo/,
// y llama a avisarSocios una vez con el nombre del narrador y las páginas. Con ≥ 88 → 'bookmundo' y sube los archivos.
```

- [ ] **Step 2:** Correrlos, que tienen que FALLAR.
- [ ] **Step 3:** Implementar:
  - `ARCHIVOS_BOOKMUNDO.interior` recibe el formato;
  - el informe dice «tapa blanda» o «tapa dura»;
  - `imprentaHistoria` arma con `sinNotas: true`, compara `informeInterior.paginas` con `PAGINAS_MINIMAS_TAPA_DURA.crema` y, si es flaco, manda un mail a socios con el texto «El libro de {nombre} salió con {n} páginas. La tapa dura pide 88. Hay que ofrecerle tapa blanda.» Ese texto es interno, para los socios, y no va a un cliente;
  - el script de tapa blanda arma con `formato: 'tapa-blanda', sinNotas: true` y sube a `{id}/bookmundo/`.
- [ ] **Step 4:** `npm test` en verde. Commit `bookmundo: historia sin Notas, aviso de flaco y tapa blanda`. Revisión con `code-reviewer` y PR «Historia · libro».

---

## Fase 6 · Antes de vender

### Task 6.1: Piloto real

- [ ] **Step 1:** Naza aplica la migración `20261022000000_historias.sql`.
- [ ] **Step 2:** Joaquín carga en Meta las plantillas `bienvenida_historia_*` y `bienvenida_historia_quien_*` (3 idiomas, texto de la Task 0.2) y las suma a `WA_PLANTILLAS_HISTORIA_LISTAS` en Railway.
- [ ] **Step 3:** Hay que elegir con Naza un narrador real del piloto y darlo de alta con `HISTORIA_VENTA=1` solo en Preview, o con un alta a mano por script.
- [ ] **Step 4:** Al cerrar el piloto se corre el escritor con `ESCRITOR_HISTORIA=solo:<id>`, avisando el costo antes. Naza lee el libro, y su lectura manda sobre la nota del juez. Se anotan las páginas que salieron: si queda por debajo de 88, se revisa el largo con Naza (riesgo del spec §5).
- [ ] **Step 5:** Con el OK de Naza se carga `HISTORIA_VENTA=1` en Production. Comando para Naza, en PowerShell y en una sola línea, con el patrón de `web/scripts/prender-kids.mjs`.

---

## Orden y paralelismo

- La **Fase 0** (contenido) corre en paralelo con las fases 1 a 3, porque el código usa el banco de prueba.
- Las fases van **1 → 2 → 3** (el bot necesita el núcleo y la tabla). La **4** (web) puede ir en paralelo con la 3 una vez cerrado el contrato `contexto.historia` (Task 3.3). La **5** necesita la receta (0.4) y la tabla (2.1).
- Va un PR por fase: núcleo con base, bot, web y libro.
