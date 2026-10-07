# Entrevista V3 en WhatsApp — Plan de implementación

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Que el entrevistador de WhatsApp haga la entrevista V3 (banco nuevo, botones, tandas por día, cazador, tres idiomas) para los narradores que tengan una fila en `entrevistas_v3`, sin cambiar nada para los demás.

**Architecture:** El código de la entrevista V3 de la fábrica se copia byte a byte a `entrevistador/src/v3/nucleo/` (un test vigila que no se separe). Encima va un motor puro (`turno.ts`, portado de `fabrica/scripts/v3-entrevista-turno.ts`) que recibe el estado y lo que hizo el narrador y devuelve el estado nuevo con una cola de mensajes (`salientes`). Todo el estado vive en la fila de `entrevistas_v3` y se escribe con compare-and-swap sobre `version`; un reloj de 1 minuto cierra respuestas tras 3' de silencio, abre la tanda del día, manda M8 y vacía la cola por WhatsApp (texto libre dentro de las 24 h, plantilla del idioma fuera). La bifurcación está al principio de `procesar.ts`: sin fila V3, el flujo viejo sigue exactamente igual.

**Tech Stack:** Node 22 + TypeScript 7 (`entrevistador/`), TypeScript 5 (`fabrica/`), vitest 4, Supabase (PostgREST) con `@supabase/supabase-js`, Meta WhatsApp Cloud API, `@anthropic-ai/sdk` (cazador, `claude-opus-5-5`), OpenAI `gpt-transcribe`, `node-cron`.

## Global Constraints

- La fuente de las decisiones es `docs/superpowers/specs/2026-10-07-entrevista-v3-whatsapp-design.md`. No se re-discuten.
- **Un narrador sin fila en `entrevistas_v3` sigue exactamente como hoy.** Ningún test viejo puede cambiar de resultado (hoy: 380 tests del entrevistador en verde).
- `entrevistador/src/v3/nucleo/` es copia EXACTA de `fabrica/src/v3/entrevista/*` y `fabrica/src/v3/ficha.ts`. **Nunca se edita a mano**: se copia con `npm run v3-copiar-nucleo`.
- Ningún texto que lee un narrador se escribe en el código: sale del banco del núcleo (`banco*.json`, por `mensajePorId` / `preguntaPorId`) o de `entrevistador/src/v3/textos-fijos.json` (lugar único para lo que el banco no tiene; lo aprueba Naza). Los avisos a los socios (mail interno) no son textos de narrador.
- Idiomas: `es-AR` (vos), `es-ES` (tú), `ca` (catalán). Sin usted para nadie de la V3.
- Ritmo: tope de preguntas por tanda diaria `diario` 4, `dos_por_dia` 8, `seguido` sin tope. Silencio para cerrar una respuesta: 3 minutos desde que se **guardó la transcripción**. Toma del turno: 2 minutos. M8: 6 h después de la primera pregunta del día, una vez por día. Reloj: cada 1 minuto. Aviso a los socios: a los 3 fallos seguidos de envío.
- Cazador: `claude-opus-5-5` (la constante `MODELO_CAZADOR` del núcleo), tope USD 3 por entrevista, en segundo plano, nunca tira error. No se cambia ningún otro modelo.
- `V3_PARA_NUEVOS` apagado por defecto (solo `=1` lo prende). Sin `contexto.genero`, el alta de un nuevo se frena y se avisa.
- Migraciones: idempotentes, en `supabase/migrations/`; las escribe el plan, **las aplica Naza** en el SQL Editor. `supabase/CONTRATO.md` se actualiza en la misma tarea.
- Nunca imprimir keys ni tokens (tampoco en errores ni en scripts).
- No usar vidas reales en código, tests, docs ni commits: los tests usan "Prueba", "Prueba V3" y las vidas inventadas de `vidas-ejemplo.ts`.
- Tests: `cd entrevistador && npx vitest run <archivo>`; tipos: `cd entrevistador && npx tsc --noEmit -p tsconfig.check.json`. Fábrica: `cd fabrica && npx vitest run <archivo>` y `npx tsc --noEmit -p .`.
- Commits en castellano rioplatense, terminando con `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`. Sin push.
- Los números de línea de "Modify" son los del commit `94e0cb9`. Si una tarea anterior de este plan corrió las líneas de un archivo, se busca por el nombre de la función que se indica.
- Sin dependencias nuevas: todo lo que se usa ya está en `entrevistador/package.json` y `fabrica/package.json`.

---

## Mapa de archivos

### Entrevistador — nuevos

| Archivo | Responsabilidad |
|---|---|
| `entrevistador/src/v3/nucleo/entrevista/*`, `entrevistador/src/v3/nucleo/ficha.ts` | Copia exacta del núcleo V3 de la fábrica (banco, flujo, mensajes, texto, respuesta, cazador, transcribir, idioma, json). |
| `entrevistador/scripts/v3-copiar-nucleo.ts` | Copia el núcleo desde `../fabrica` (y borra lo que sobra). |
| `entrevistador/src/v3/tipos.ts` | Tipos de la fila (`FilaV3`), del estado (`EstadoV3`), de la cola (`Saliente`); `estadoInicial`, `fichaTexto`, `MARCA_FOTO`. |
| `entrevistador/src/v3/deps.ts` | Tipos de las dependencias inyectables (`DepsV3`, `WhatsAppV3`). |
| `entrevistador/src/v3/estado.ts` | Leer/crear/guardar la fila con compare-and-swap; toma `enviando_hasta`; `esNarradorV3`, `narradoresV3`. |
| `entrevistador/src/v3/turno.ts` | Motor puro: `avanzar`, `recibirAudio`, `tocarBoton`, `marcarFoto`, `cerrarRespuesta`, `cerrarYSeguir`, `reenviarAbierta`, `encolar`, `quitarSalientes`, `cazarAlCerrar`, `sumarCaza`. |
| `entrevistador/src/v3/tanda.ts` | Puro: tope por ritmo, cuenta de la tanda del día, hora preferida, hitos de mail. |
| `entrevistador/src/v3/avisos.ts` | `avisarSocios`: consola + mail a `MAIL_SOCIOS`, una vez por clave y día. |
| `entrevistador/src/v3/cazador.ts` | Cliente Anthropic del cazador, `cazarEnSegundoPlano`, `lanzarCazador`, `esperarCazas`; costo a `consumo_ia`. |
| `entrevistador/src/v3/enviar.ts` | `drenar`: vacía la cola por WhatsApp (botones, texto, plantilla por idioma), cuenta fallos, completa al terminar. |
| `entrevistador/src/v3/filas.ts` | Filas de `respuestas` y `fotos` de un narrador V3 (duplicados por `wa_message_id`, número de llegada). |
| `entrevistador/src/v3/textos-fijos.json`, `entrevistador/src/v3/textos-fijos.ts` | Lugar único de los textos que el banco no tiene (hoy: el acuse de la foto suelta). |
| `entrevistador/src/v3/entrante.ts` | Audio / botón / texto / imagen / reactivación de un narrador V3. |
| `entrevistador/src/v3/deps-reales.ts` | Las dependencias de verdad (base, WhatsApp, OpenAI, Resend, Anthropic). |
| `entrevistador/src/v3/reloj.ts` | El tick de 1 minuto: cierre por silencio, tanda diaria, M8, cola pendiente. |
| `entrevistador/src/v3/pasar.ts`, `entrevistador/src/v3/equivalencias.json` | Pase de narradores en curso (con la tabla de equivalencias) y alta de nuevos. |
| `entrevistador/scripts/cargar-entorno.ts` | Lee `entrevistador/.env` antes de importar la config (scripts). |
| `entrevistador/scripts/v3-pasar.ts` | `npm run v3-pasar`. |
| `entrevistador/scripts/v3-simular.ts` | Simulación de punta a punta con WhatsApp falso (contra la base real con `main`, contra la base falsa en el test). |
| `entrevistador/src/flujo/ritmo.ts`, `entrevistador/src/flujo/tiempo.ts`, `entrevistador/src/flujo/fotos-texto.ts` | Funciones puras sacadas de `preguntar.ts`, `scheduler.ts` y `fotos.ts` (que importan la base real) para que la V3 las use sin arrastrar la base. |
| `entrevistador/test/v3/*.test.ts`, `entrevistador/test/v3/base-falsa.ts`, `entrevistador/test/v3/deps-prueba.ts` | Tests y dobles (base en memoria, WhatsApp falso). |

### Entrevistador — modificados

| Archivo | Cambio |
|---|---|
| `entrevistador/tsconfig.json` | `resolveJsonModule: true`. |
| `entrevistador/package.json` | Scripts `v3-copiar-nucleo`, `v3-pasar`, `v3-simular`. |
| `entrevistador/.env.example` | `MAIL_SOCIOS`, `V3_PARA_NUEVOS`, `V3_CAZADOR`, `WA_PLANTILLAS_V3_LISTAS`. |
| `entrevistador/src/costos.ts` | Precio de `claude-opus-5-5`. |
| `entrevistador/src/config.ts` | `v3ParaNuevos()`. |
| `entrevistador/src/whatsapp/enviar.ts` | `enviarBotones`; `enviarPlantilla` con idioma. |
| `entrevistador/src/whatsapp/webhook.ts` | `MensajeEntrante.esBoton`. |
| `entrevistador/src/ia/transcribir.ts` | `transcribir(…, idioma)`. |
| `entrevistador/src/flujo/procesar.ts` | Bifurcación V3 al principio de `procesarEntrante`. |
| `entrevistador/src/flujo/scheduler.ts` | Saltea narradores V3 en las fases viejas; cron de 1 minuto para el reloj V3. |
| `entrevistador/src/flujo/preguntar.ts` | Re-exporta `ritmo.ts`; alta V3 de nuevos al mandar la pregunta 1 de un `acepto`. |
| `entrevistador/src/flujo/fotos.ts` | Re-exporta `fotos-texto.ts`. |

### Datos

| Archivo | Cambio |
|---|---|
| `supabase/migrations/20261007000000_entrevista_v3.sql` | Tabla `entrevistas_v3`, `respuestas.clave_v3`, `respuestas.wa_message_id` (único parcial), `envios.tipo` suma `'v3'`. |
| `supabase/CONTRATO.md` | Sección "Entrevista V3 por WhatsApp" y filas nuevas en "Propiedad de escritura". |

### Fábrica

| Archivo | Cambio |
|---|---|
| `fabrica/src/v3/candado.ts` (nuevo) | `narradoresConV3`, `exigirSinV3`, `avisarCandadoV3`. |
| `fabrica/src/escritor/material/de-base.ts` (nuevo) | Lee `entrevistas_v3` + `respuestas` → formato de `de-entrevista.ts`. |
| `fabrica/src/worker.ts` | Saltea narradores V3 en anticipo, estructura, previsualización y pedidos. |
| `fabrica/src/libro/generar-paquete.ts`, `anticipo.ts`, `previsualizar.ts` | `exigirSinV3` al entrar. |
| `fabrica/test/{worker,anticipo-worker,anticipo,generar-paquete,previsualizar}.test.ts` | Mock del candado (sin V3). |

---

### Task 1: El núcleo V3 copiado al entrevistador

**Files:**
- Create: `entrevistador/src/v3/nucleo/entrevista/` (los 18 archivos de `fabrica/src/v3/entrevista/`), `entrevistador/src/v3/nucleo/ficha.ts`
- Create: `entrevistador/scripts/v3-copiar-nucleo.ts`
- Modify: `entrevistador/tsconfig.json:2-11` (compilerOptions)
- Modify: `entrevistador/package.json:6-19` (scripts)
- Test: `entrevistador/test/v3/copia-nucleo.test.ts`

**Interfaces:**
- Consumes: nada.
- Produces: los módulos del núcleo en `entrevistador/src/v3/nucleo/entrevista/*.js` (mismas exportaciones que la fábrica: `banco.js` → `bancoDe`, `preguntaPorId`, `mensajePorId`, `nombresBloqueDe`; `flujo.js` → `siguientePregunta`, `mensajesDespues`, `alTocarBoton`, `anotarInferidas`, `botonesDeClave`, `preguntaDeClave`, `PreguntaFamilia`, `Repregunta`; `mensajes.js` → `acuseDeTurno`, `anotarAcuse`, `armarTurno`, `entradaSegunAcuse`, `preguntaSegunAcuse`, `vueltasEnCero`, `AcusePendiente`, `Vueltas`; `respuesta.js` → `sumarAudio`, `leerBoton`, `leerInferida`, `respuestaDeBoton`, `interpretar`; `texto.js` → `renderizar`, `FichaTexto`; `idioma.js` → `Idioma`, `idiomaDe`, `esIdioma`, `IDIOMAS`; `cazador.js` → `cazarBloque`, `fichaCorta`, `mensajeRepregunta`, `ClienteModelo`, `ResultadoCaza`, `Descartada`, `MODELO_CAZADOR`, `TOPE_GASTO_USD`; `transcribir.js` → `promptDeTranscripcion`, `IDIOMA_OPENAI`; `vidas-ejemplo.js` → `VIDAS_EJEMPLO`). Script `npm run v3-copiar-nucleo`.

- [ ] **Step 1: Escribir el test que falla**

`entrevistador/test/v3/copia-nucleo.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

// El núcleo V3 es COPIA EXACTA de la fábrica (spec 2026-10-07, "Por qué copiar
// y no compartir el código"): dos Dockerfiles separados. Si alguien cambia la
// fábrica y no copia, este test lo dice. En el Docker del entrevistador no
// está `../fabrica`: ahí se saltea.
const FABRICA = fileURLToPath(new URL('../../../fabrica/src/v3/', import.meta.url));
const NUCLEO = fileURLToPath(new URL('../../src/v3/nucleo/', import.meta.url));
const hayFabrica = existsSync(`${FABRICA}entrevista`);

describe.skipIf(!hayFabrica)('el núcleo V3 es copia exacta de la fábrica', () => {
  const originales = hayFabrica ? readdirSync(`${FABRICA}entrevista`).sort() : [];

  it('tiene exactamente los mismos archivos', () => {
    expect(readdirSync(`${NUCLEO}entrevista`).sort()).toEqual(originales);
  });

  it.each(originales)('entrevista/%s es igual byte a byte', (archivo) => {
    const copia = readFileSync(`${NUCLEO}entrevista/${archivo}`);
    const original = readFileSync(`${FABRICA}entrevista/${archivo}`);
    expect(copia.equals(original)).toBe(true);
  });

  it('ficha.ts es igual byte a byte', () => {
    expect(readFileSync(`${NUCLEO}ficha.ts`).equals(readFileSync(`${FABRICA}ficha.ts`))).toBe(true);
  });
});

describe('el núcleo V3 carga en el entrevistador', () => {
  it('el banco tiene preguntas en los tres idiomas', async () => {
    const { bancoDe } = await import('../../src/v3/nucleo/entrevista/banco.js');
    for (const idioma of ['es-AR', 'ca', 'es-ES'] as const) expect(bancoDe(idioma).length).toBeGreaterThan(100);
  });

  it('el cazador es Opus 5.5 con tope de USD 3', async () => {
    const { MODELO_CAZADOR, TOPE_GASTO_USD } = await import('../../src/v3/nucleo/entrevista/cazador.js');
    expect(MODELO_CAZADOR).toBe('claude-opus-5-5');
    expect(TOPE_GASTO_USD).toBe(3);
  });
});
```

- [ ] **Step 2: Correr y ver que falla**

Run: `cd entrevistador && npx vitest run test/v3/copia-nucleo.test.ts`
Expected: FAIL (`ENOENT … src/v3/nucleo/entrevista` y `Failed to load url ../../src/v3/nucleo/entrevista/banco.js`).

- [ ] **Step 3: El script de copia**

`entrevistador/scripts/v3-copiar-nucleo.ts`:

```ts
// Copia el núcleo V3 de la fábrica al entrevistador (spec 2026-10-07).
// Byte a byte: nunca se edita la copia a mano. Borra lo que sobra en la copia.
//
//   npm run v3-copiar-nucleo

import { copyFileSync, existsSync, mkdirSync, readdirSync, rmSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const FABRICA = fileURLToPath(new URL('../../fabrica/src/v3/', import.meta.url));
const NUCLEO = fileURLToPath(new URL('../src/v3/nucleo/', import.meta.url));

if (!existsSync(`${FABRICA}entrevista`)) {
  console.error(`No encuentro ${FABRICA}entrevista: este script se corre desde el monorepo.`);
  process.exit(1);
}
mkdirSync(`${NUCLEO}entrevista`, { recursive: true });
const originales = readdirSync(`${FABRICA}entrevista`);
for (const sobra of readdirSync(`${NUCLEO}entrevista`)) {
  if (!originales.includes(sobra)) rmSync(`${NUCLEO}entrevista/${sobra}`);
}
for (const archivo of originales) copyFileSync(`${FABRICA}entrevista/${archivo}`, `${NUCLEO}entrevista/${archivo}`);
copyFileSync(`${FABRICA}ficha.ts`, `${NUCLEO}ficha.ts`);
console.log(`Núcleo V3 copiado: ${originales.length} archivos + ficha.ts.`);
```

En `entrevistador/package.json`, dentro de `"scripts"`, agregar (después de `"tipos"`):

```json
    "tipos": "tsc --noEmit -p tsconfig.check.json",
    "v3-copiar-nucleo": "tsx scripts/v3-copiar-nucleo.ts"
```

En `entrevistador/tsconfig.json`, dentro de `compilerOptions`, agregar `"resolveJsonModule": true` (el núcleo importa sus `banco*.json` y `cazador-prompt*.json` con `with { type: 'json' }`):

```json
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true
```

- [ ] **Step 4: Copiar**

Run: `cd entrevistador && npm run v3-copiar-nucleo`
Expected: `Núcleo V3 copiado: 18 archivos + ficha.ts.` (el número es el que haya en `fabrica/src/v3/entrevista/`).

- [ ] **Step 5: Correr el test y ver que pasa**

Run: `cd entrevistador && npx vitest run test/v3/copia-nucleo.test.ts`
Expected: PASS.

- [ ] **Step 6: Tipos y build (el cazador compila con el SDK del entrevistador; los json salen a `dist`)**

Run: `cd entrevistador && npx tsc --noEmit -p tsconfig.check.json && npm run build && ls dist/v3/nucleo/entrevista/banco.json dist/v3/nucleo/entrevista/cazador-prompt-ca.json`
Expected: sin errores y los dos json listados. (Verificado al escribir el plan: el núcleo compila limpio con TypeScript 7.0.2 y `node` carga `dist/v3/nucleo/entrevista/cazador.js` con sus json.) Si `tsc` marcara un error **dentro de `nucleo/`**, no se edita la copia: se para y se reporta.

- [ ] **Step 7: Correr todos los tests del entrevistador (el flujo viejo sigue verde)**

Run: `cd entrevistador && npx vitest run`
Expected: PASS (los de antes + los nuevos).

- [ ] **Step 8: Commit**

```bash
git add entrevistador/src/v3/nucleo entrevistador/scripts/v3-copiar-nucleo.ts entrevistador/test/v3/copia-nucleo.test.ts entrevistador/tsconfig.json entrevistador/package.json
git commit -m "entrevistador: copia exacta del núcleo de la entrevista V3, con test que la vigila

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 2: Migración, contrato, tipos de la fila y base falsa de tests

**Files:**
- Create: `supabase/migrations/20261007000000_entrevista_v3.sql`
- Modify: `supabase/CONTRATO.md:8-19` (tabla "Propiedad de escritura") y nueva sección antes de `## Storage — bucket privado \`audios\`` (línea ~502)
- Create: `entrevistador/src/v3/tipos.ts`
- Create: `entrevistador/test/v3/base-falsa.ts`
- Test: `entrevistador/test/v3/tipos.test.ts`, `entrevistador/test/v3/base-falsa.test.ts`

**Interfaces:**
- Consumes: núcleo (Task 1): `Idioma`, `FichaTexto`, `AcusePendiente`, `Vueltas`, `vueltasEnCero`, `PreguntaFamilia`, `Repregunta`, `Descartada`, `ResultadoCaza`.
- Produces:
  - `type Parte = { id: string; texto: string }`
  - `type Globo = { de: 'bio'; partes: Parte[]; botones?: string[] } | { de: 'persona'; pregunta: string; texto: string; boton?: string } | { de: 'bloque'; bloque: number; nombre: string }`
  - `type RegistroCaza`, `type TipoSaliente = 'turno' | 'suelto' | 'recordatorio'`, `type Saliente = { id: number; texto: string; botones?: string[]; tipo: TipoSaliente }`
  - `type EstadoV3` (campos abajo), `type Genero`, `type FichaFila`, `type MigradaDe`, `type FilaV3`, `type NarradorV3`
  - `const MARCA_FOTO = '⟦foto⟧'`
  - `function estadoInicial(familia?: PreguntaFamilia[]): EstadoV3`
  - `function fichaTexto(fila: Pick<FilaV3, 'ficha' | 'idioma'>): FichaTexto`
  - `function esGenero(x: unknown): x is Genero`
  - Test: `crearBaseFalsa(inicial?: Record<string, Fila[]>): BaseFalsa` con `{ tablas, archivos, ausentes, fallarProxima, cliente }`.

- [ ] **Step 1: La migración (idempotente; la aplica Naza)**

`supabase/migrations/20261007000000_entrevista_v3.sql`:

```sql
-- La entrevista V3 en el WhatsApp de verdad (spec docs/superpowers/specs/2026-10-07-entrevista-v3-whatsapp-design.md).
--
-- Una fila en `entrevistas_v3` prende la V3 para ese narrador. Sin fila, el
-- entrevistador sigue exactamente como hoy. El estado de la entrevista (lo que
-- contestó, lo que se le mandó, la cola de mensajes) vive en `estado` (jsonb)
-- y cada escritura es compare-and-swap sobre `version`: dos procesos no pueden
-- pisarse. Es idempotente y no toca datos.
--
-- ⚠️ Toca supabase/CONTRATO.md ("Entrevista V3 por WhatsApp"). La aplica Naza.

create table if not exists entrevistas_v3 (
  narrador_id     uuid primary key references narradores (id),
  idioma          text not null default 'es-AR' check (idioma in ('es-AR', 'es-ES', 'ca')),
  ficha           jsonb not null,                 -- {nombre, genero, formaTrato?, quienRegala?}
  estado          jsonb not null,                 -- el motor de entrevistador/src/v3/turno.ts
  version         int not null default 0,         -- compare-and-swap: UPDATE … WHERE version = n
  ultimo_audio_at timestamptz,                    -- cuando se GUARDÓ la última transcripción de la abierta
  tanda_dia       date,                           -- el día (en la zona del narrador) de la tanda en curso
  tanda_cuenta    int not null default 0,         -- cuántas preguntas salieron en esa tanda
  enviando_hasta  timestamptz,                    -- toma corta del turno (~2 min)
  creada_at       timestamptz not null default now(),
  migrada_de      jsonb                           -- null, o {"de": "v-vieja", "dia_actual": n}
);

alter table entrevistas_v3 enable row level security;  -- sin policies: solo la service role

alter table respuestas add column if not exists clave_v3 text;
alter table respuestas add column if not exists wa_message_id text;
create unique index if not exists respuestas_wa_message_id_unico
  on respuestas (wa_message_id) where wa_message_id is not null;

comment on column respuestas.clave_v3 is
  'Entrevista V3: la pregunta de esta fila (CA1, RP~AM9, CA4~2, F:<id>). Null en las filas de la entrevista vieja.';
comment on column respuestas.wa_message_id is
  'El id del mensaje de Meta que trajo esta respuesta. Único: el reintento del webhook no la suma dos veces.';

alter table envios drop constraint if exists envios_tipo_check;
alter table envios add constraint envios_tipo_check
  check (tipo in ('bienvenida','pregunta','repregunta','recordatorio','alerta_pausa',
                  'despedida','saludo_final','oferta_siguiente','objeto','v3'));
```

- [ ] **Step 2: El contrato**

En `supabase/CONTRATO.md`, tabla "Propiedad de escritura": en la fila de `respuestas`, agregar al final de la nota: ` **07/10 (propuesta, sin aplicar):** \`clave_v3\` / \`wa_message_id\` — entrevista V3, ver la sección propia.`; en la fila de `envios`, agregar `**07/10:** \`tipo = 'v3'\` para cada mensaje de la entrevista V3.`; y agregar la fila nueva:

```md
| `entrevistas_v3` | entrevistador | fábrica | Nueva 07/10 (propuesta). Una fila por narrador: **prende la V3**. Ver "Entrevista V3 por WhatsApp". |
```

Antes de `## Storage — bucket privado \`audios\``, agregar la sección:

```md
## Entrevista V3 por WhatsApp (migración 20261007000000 — PROPUESTA del 07/10, la aplica Naza)

Spec: `docs/superpowers/specs/2026-10-07-entrevista-v3-whatsapp-design.md`. **Una fila en
`entrevistas_v3` prende la V3 para ese narrador**; sin fila, el entrevistador sigue como siempre.
La escribe el entrevistador y la lee la fábrica.

| Columna | Qué guarda |
|---|---|
| `narrador_id` | Clave primaria y referencia a `narradores`. |
| `idioma` | `es-AR`, `es-ES` o `ca`. |
| `ficha` (jsonb) | `nombre` (= `como_le_dicen`), `genero` (`varon` / `mujer` / `otro`), `formaTrato?`, `quienRegala?`. |
| `estado` (jsonb) | El motor de `entrevistador/src/v3/turno.ts`: `respuestas` (`[clave, texto][]` en orden de llegada: **es la verdad de la entrevista**), `enviados`, `vueltas`, `acuse`, `esperando`, `tocoSi`, `borrador` (los audios de la abierta, sin cerrar), `preguntaAbierta`, `bloqueActual`, `terminada`, `familia`, `repreguntas`, `cazador`, `charla` (los mensajes tal como salieron), `salientes` (la cola de WhatsApp), y contadores (`seq`, `fallosEnvio`, `ultimoEntranteAt`, `tandaInicioAt`, `m8Dia`, `m22En`). |
| `version` | Cada escritura es `UPDATE … WHERE version = n`; si cambió, se relee y se reintenta. |
| `ultimo_audio_at` | Cuando se **guardó** la última transcripción de la pregunta abierta (el reloj cierra a los 3'). |
| `tanda_dia`, `tanda_cuenta` | La tanda del día (en la zona del narrador) y cuántas preguntas salieron. |
| `enviando_hasta` | Toma corta del turno (2 minutos): un solo proceso manda la cola. |
| `creada_at`, `migrada_de` | `migrada_de`: null, o `{"de": "v-vieja", "dia_actual": n}` (el `dia_actual` que tenía). |

Columnas nuevas en `respuestas`: `clave_v3` (text, null en las filas viejas; varias filas pueden
tener la misma clave) y `wa_message_id` (text, único cuando no es null). `envios.tipo` suma `'v3'`.

Reglas de una fila de `respuestas` de un narrador V3: `pregunta_orden` = **número de llegada** (no es
un orden del guion: el libro viejo no la lee nunca, lo frena el candado de la fábrica);
`transcripcion` = el texto del audio; `texto_directo` = la marca del botón (`⟦botón:Sí⟧`), un texto
escrito (que **no** entra a la entrevista: se le contesta M22) o `⟦foto⟧` (la foto de FO1).

Lo que no cambia: las transiciones de `narradores.estado` (`activo` durante la V3, `completado`
después de FIN, `pausado` igual que hoy); `dia_actual` queda congelado en el valor que tenía.

La fila nace con `npm run v3-pasar -- <narrador> --genero … [--idioma …] --aplicar` (narradores en
curso, con la tabla de equivalencias aprobada por Naza) o al pasar `acepto → activo` con
`V3_PARA_NUEVOS=1` (necesita `contexto.genero`; sin él, el alta se frena y se avisa a los socios).

**La fábrica:** `fabrica/src/v3/candado.ts` saltea a todo narrador con fila (anticipo, estructura,
previsualización y paquete viejos) y avisa una vez a los socios (candado
`{narrador_id}/paquete/v3_candado_avisado.txt`); `fabrica/src/escritor/material/de-base.ts` lee la
fila y devuelve el formato de `escritor/material/de-entrevista.ts`.
```

- [ ] **Step 3: Escribir los tests que fallan**

`entrevistador/test/v3/tipos.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { esGenero, estadoInicial, fichaTexto, MARCA_FOTO } from '../../src/v3/tipos.js';

describe('tipos de la entrevista V3', () => {
  it('el estado inicial no tiene nada contestado ni nada en la cola', () => {
    const e = estadoInicial();
    expect(e).toMatchObject({ formato: 1, respuestas: [], enviados: [], bloqueActual: 0, terminada: false, familia: [], charla: [], salientes: [], seq: 0, fallosEnvio: 0 });
    expect(e.vueltas.M3).toBe(0);
    expect(e.esperando).toBeUndefined();
  });

  it('la ficha de texto lleva el idioma solo si no es es-AR (la de siempre)', () => {
    const ficha = { nombre: 'Prueba', genero: 'mujer' as const };
    expect(fichaTexto({ ficha, idioma: 'es-AR' })).toEqual({ nombre: 'Prueba', genero: 'mujer' });
    expect(fichaTexto({ ficha: { ...ficha, quienRegala: 'Laura' }, idioma: 'ca' })).toEqual({ nombre: 'Prueba', genero: 'mujer', quienRegala: 'Laura', idioma: 'ca' });
  });

  it('el género tiene tres valores', () => {
    expect(['varon', 'mujer', 'otro'].every(esGenero)).toBe(true);
    expect(esGenero('hombre')).toBe(false);
    expect(esGenero(undefined)).toBe(false);
  });

  it('la marca de foto es la misma que lee la fábrica', () => {
    expect(MARCA_FOTO).toBe('⟦foto⟧');
  });
});
```

`entrevistador/test/v3/base-falsa.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { crearBaseFalsa } from './base-falsa.js';

describe('la base falsa de los tests V3', () => {
  it('inserta, filtra, ordena y devuelve una sola fila', async () => {
    const base = crearBaseFalsa();
    await base.cliente.from('respuestas').insert([{ narrador_id: 'n1', pregunta_orden: 2 }, { narrador_id: 'n1', pregunta_orden: 1 }, { narrador_id: 'n2', pregunta_orden: 1 }]);
    const { data } = await base.cliente.from('respuestas').select('*').eq('narrador_id', 'n1').order('pregunta_orden');
    expect((data as any[]).map((r) => r.pregunta_orden)).toEqual([1, 2]);
    const { data: una } = await base.cliente.from('respuestas').select('*').eq('narrador_id', 'n2').maybeSingle();
    expect((una as any).pregunta_orden).toBe(1);
    const { count } = await base.cliente.from('respuestas').select('id', { count: 'exact', head: true }).eq('narrador_id', 'n1');
    expect(count).toBe(2);
  });

  it('el update con .select() devuelve las filas tocadas (para el compare-and-swap)', async () => {
    const base = crearBaseFalsa({ entrevistas_v3: [{ narrador_id: 'n1', version: 3 }] });
    const gano = await base.cliente.from('entrevistas_v3').update({ version: 4 }).eq('narrador_id', 'n1').eq('version', 3).select('*');
    expect(gano.data).toHaveLength(1);
    const perdio = await base.cliente.from('entrevistas_v3').update({ version: 5 }).eq('narrador_id', 'n1').eq('version', 3).select('*');
    expect(perdio.data).toHaveLength(0);
  });

  it('wa_message_id es único: el segundo insert da 23505', async () => {
    const base = crearBaseFalsa();
    expect((await base.cliente.from('respuestas').insert({ narrador_id: 'n1', wa_message_id: 'w1' })).error).toBeNull();
    expect((await base.cliente.from('respuestas').insert({ narrador_id: 'n1', wa_message_id: 'w1' })).error?.code).toBe('23505');
    expect((await base.cliente.from('respuestas').insert({ narrador_id: 'n1', wa_message_id: null })).error).toBeNull();
    expect((await base.cliente.from('respuestas').insert({ narrador_id: 'n1', wa_message_id: null })).error).toBeNull();
  });

  it('una tabla ausente contesta 42P01, como Postgres sin la migración', async () => {
    const base = crearBaseFalsa();
    base.ausentes.add('entrevistas_v3');
    expect((await base.cliente.from('entrevistas_v3').select('*')).error?.code).toBe('42P01');
  });

  it('el storage guarda, lista y borra', async () => {
    const base = crearBaseFalsa();
    await base.cliente.storage.from('audios').upload('n1/dia_01.ogg', Buffer.from('hola'), { contentType: 'audio/ogg' });
    const { data } = await base.cliente.storage.from('audios').list('n1');
    expect(data).toEqual([{ name: 'dia_01.ogg' }]);
    expect((await base.cliente.storage.from('audios').upload('n1/dia_01.ogg', Buffer.from('x'))).error).not.toBeNull();
    await base.cliente.storage.from('audios').remove(['n1/dia_01.ogg']);
    expect(base.archivos.size).toBe(0);
  });
});
```

- [ ] **Step 4: Correr y ver que fallan**

Run: `cd entrevistador && npx vitest run test/v3/tipos.test.ts test/v3/base-falsa.test.ts`
Expected: FAIL (`Failed to load url ../../src/v3/tipos.js` y `./base-falsa.js`).

- [ ] **Step 5: Implementar `tipos.ts`**

`entrevistador/src/v3/tipos.ts`:

```ts
// Los tipos de la entrevista V3 en WhatsApp (spec 2026-10-07, "Datos"): la
// fila de `entrevistas_v3` y su `estado` (jsonb). Puro: sin base ni red.

import type { Descartada, ResultadoCaza } from './nucleo/entrevista/cazador.js';
import type { PreguntaFamilia, Repregunta } from './nucleo/entrevista/flujo.js';
import type { Idioma } from './nucleo/entrevista/idioma.js';
import { vueltasEnCero, type AcusePendiente, type Vueltas } from './nucleo/entrevista/mensajes.js';
import type { FichaTexto } from './nucleo/entrevista/texto.js';

/** Una línea de un mensaje, con el ID del banco de donde sale. */
export type Parte = { id: string; texto: string };

/** Un globo de la charla (igual que en v3-entrevista-turno.ts: lo lee de-entrevista.ts de la fábrica). */
export type Globo =
  | { de: 'bio'; partes: Parte[]; botones?: string[] }
  | { de: 'persona'; pregunta: string; texto: string; boton?: string }
  | { de: 'bloque'; bloque: number; nombre: string };

/** Lo que se anota de cada llamada al cazador (igual que en v3-entrevista-turno.ts). */
export type RegistroCaza = {
  bloque: number;
  llamo: boolean;
  motivo?: ResultadoCaza['motivo'];
  repreguntas: string[];
  descartadas: Descartada[];
  tokens?: { entrada: number; salida: number };
  costoUsd: number;
  error?: string;
};

/**
 * Un mensaje en la cola de WhatsApp. `turno`: parte de un turno (acuse,
 * entrada, pregunta); `suelto`: M30, M22, M23, el acuse de una foto;
 * `recordatorio`: M8 (fuera de las 24 h sale con la plantilla de recordatorio).
 */
export type TipoSaliente = 'turno' | 'suelto' | 'recordatorio';
export type Saliente = { id: number; texto: string; botones?: string[]; tipo: TipoSaliente };

export type EstadoV3 = {
  formato: 1;
  /** Respuestas en el orden en que llegaron: [clave, texto]. Es la verdad de la entrevista. */
  respuestas: [string, string][];
  /** Lo que se mandó y no espera respuesta (AV11, FIN). */
  enviados: string[];
  vueltas: Vueltas;
  /** El acuse de la última respuesta, pendiente de armarse con lo que se mande después. */
  acuse?: AcusePendiente;
  /** La clave de la pregunta que espera respuesta. */
  esperando?: string;
  /** Tocó un botón de "Sí" en `esperando`: la marca ya está en `respuestas` y los audios se le suman. */
  tocoSi?: boolean;
  /** Las transcripciones de la abierta, sumadas, hasta que el reloj cierre la respuesta. */
  borrador?: string;
  /** La pregunta abierta sin acuse ni entrada, para reenviarla tal cual al día siguiente. */
  preguntaAbierta?: { partes: Parte[]; botones?: string[] };
  bloqueActual: number;
  terminada: boolean;
  familia: PreguntaFamilia[];
  repreguntas?: Repregunta[];
  cazador?: { gastoUsd: number; escenasContadas: string[]; registro: RegistroCaza[] };
  /** Los mensajes tal como salieron (y lo que contestó). */
  charla: Globo[];
  /** La cola de WhatsApp: lo que todavía no salió. Un envío que falla queda acá y se reintenta. */
  salientes: Saliente[];
  /** El último id de saliente usado. */
  seq: number;
  /** El último mensaje que mandó el narrador (ventana de 24 h de Meta). */
  ultimoEntranteAt?: string;
  /** Cuándo salió la primera pregunta de la tanda de hoy (para M8). */
  tandaInicioAt?: string;
  /** El día (en su zona) en que salió M8. */
  m8Dia?: string;
  /** La clave en la que ya se le contestó M22 (una vez por pregunta). */
  m22En?: string;
  fallosEnvio: number;
  avisoFallos?: boolean;
};

export type Genero = 'varon' | 'mujer' | 'otro';
export type FichaFila = { nombre: string; genero: Genero; formaTrato?: 'masculino' | 'femenino'; quienRegala?: string };
export type MigradaDe = { de: 'v-vieja'; dia_actual: number };

export type FilaV3 = {
  narrador_id: string;
  idioma: Idioma;
  ficha: FichaFila;
  estado: EstadoV3;
  version: number;
  ultimo_audio_at: string | null;
  tanda_dia: string | null;
  tanda_cuenta: number;
  enviando_hasta: string | null;
  creada_at: string;
  migrada_de: MigradaDe | null;
};

/** Lo que la V3 necesita de `narradores` (compatible con `Narrador` de flujo/preguntar.ts). */
export type NarradorV3 = {
  id: string;
  familia_id: string;
  como_le_dicen: string;
  telefono_whatsapp: string;
  hora_preferida: string;
  zona_horaria: string;
  contexto: Record<string, any>;
  estado: string;
  dia_actual: number;
  ultima_respuesta_at: string | null;
};

/** La respuesta de FO1 cuando llega la foto (la fábrica la saca al armar el material). */
export const MARCA_FOTO = '⟦foto⟧';

export function estadoInicial(familia: PreguntaFamilia[] = []): EstadoV3 {
  return {
    formato: 1,
    respuestas: [],
    enviados: [],
    vueltas: vueltasEnCero(),
    bloqueActual: 0,
    terminada: false,
    familia,
    charla: [],
    salientes: [],
    seq: 0,
    fallosEnvio: 0,
  };
}

/** La ficha que usan los textos del núcleo. Sin `idioma` para es-AR: así la arma también la fábrica. */
export function fichaTexto(fila: Pick<FilaV3, 'ficha' | 'idioma'>): FichaTexto {
  const f = fila.ficha;
  return {
    nombre: f.nombre,
    genero: f.genero,
    ...(f.formaTrato ? { formaTrato: f.formaTrato } : {}),
    ...(f.quienRegala ? { quienRegala: f.quienRegala } : {}),
    ...(fila.idioma !== 'es-AR' ? { idioma: fila.idioma } : {}),
  };
}

export function esGenero(x: unknown): x is Genero {
  return x === 'varon' || x === 'mujer' || x === 'otro';
}
```

- [ ] **Step 6: Implementar la base falsa**

`entrevistador/test/v3/base-falsa.ts`:

```ts
// Base en memoria para los tests de la V3: el subconjunto de supabase-js que
// usa `entrevistador/src/v3/` (select/insert/update/upsert/delete con eq, in,
// is, lt, lte, gt, gte, not-is, order, limit, single, maybeSingle, count) y el
// storage (upload, list, remove, download). Simula el único de
// `respuestas.wa_message_id` (23505) y una tabla sin migrar (42P01).

import { randomUUID } from 'node:crypto';
import type { SupabaseClient } from '@supabase/supabase-js';

export type Fila = Record<string, any>;
type ErrorBase = { code: string; message: string };
type Resultado = { data: any; error: ErrorBase | null; count?: number | null };

/** La clave primaria de las tablas que no usan `id`. */
const CLAVE: Record<string, string> = { entrevistas_v3: 'narrador_id' };
const UNICOS: Record<string, string[]> = {
  respuestas: ['wa_message_id'],
  entrevistas_v3: ['narrador_id'],
  narradores: ['telefono_whatsapp'],
};
const DEFAULTS: Record<string, () => Fila> = {
  respuestas: () => ({ recibido_at: new Date().toISOString(), es_repregunta: false, clave_v3: null, wa_message_id: null, transcripcion: null, texto_directo: null }),
  entrevistas_v3: () => ({ version: 0, tanda_cuenta: 0, ultimo_audio_at: null, tanda_dia: null, enviando_hasta: null, creada_at: new Date().toISOString(), migrada_de: null }),
  envios: () => ({ enviado_at: new Date().toISOString() }),
  narradores: () => ({ estado: 'invitado', dia_actual: 0, contexto: {}, hora_preferida: '10:00:00', zona_horaria: 'America/Argentina/Buenos_Aires', ultima_respuesta_at: null, alerta_silencio: false }),
};

export type BaseFalsa = {
  tablas: Record<string, Fila[]>;
  /** "bucket/path" → contenido (texto). */
  archivos: Map<string, string>;
  /** Tablas que "no existen" (la migración sin aplicar). */
  ausentes: Set<string>;
  /** La próxima escritura a esa tabla devuelve este error (una sola vez). */
  fallarProxima: Map<string, ErrorBase>;
  cliente: SupabaseClient;
};

const copia = <T>(x: T): T => (x === undefined ? x : (JSON.parse(JSON.stringify(x)) as T));

class Consulta implements PromiseLike<Resultado> {
  private op: 'select' | 'insert' | 'update' | 'upsert' | 'delete' = 'select';
  private filtros: ((f: Fila) => boolean)[] = [];
  private valores: Fila | Fila[] | undefined;
  private orden: { col: string; asc: boolean } | undefined;
  private limite: number | undefined;
  private unica: 'single' | 'maybe' | undefined;
  private devolver = false;
  private contar = false;
  private soloCuenta = false;

  constructor(private base: BaseFalsa, private tabla: string) {}

  select(_columnas?: string, o?: { count?: 'exact'; head?: boolean }) {
    if (this.op !== 'select') this.devolver = true;
    if (o?.count) this.contar = true;
    if (o?.head) this.soloCuenta = true;
    return this;
  }
  insert(v: Fila | Fila[]) { this.op = 'insert'; this.valores = v; return this; }
  upsert(v: Fila | Fila[]) { this.op = 'upsert'; this.valores = v; return this; }
  update(v: Fila) { this.op = 'update'; this.valores = v; return this; }
  delete() { this.op = 'delete'; return this; }
  eq(c: string, v: unknown) { this.filtros.push((f) => f[c] === v); return this; }
  neq(c: string, v: unknown) { this.filtros.push((f) => f[c] !== v); return this; }
  in(c: string, vs: unknown[]) { this.filtros.push((f) => vs.includes(f[c])); return this; }
  is(c: string, v: null | boolean) { this.filtros.push((f) => (f[c] ?? null) === v); return this; }
  lt(c: string, v: string | number) { this.filtros.push((f) => f[c] != null && f[c] < v); return this; }
  lte(c: string, v: string | number) { this.filtros.push((f) => f[c] != null && f[c] <= v); return this; }
  gt(c: string, v: string | number) { this.filtros.push((f) => f[c] != null && f[c] > v); return this; }
  gte(c: string, v: string | number) { this.filtros.push((f) => f[c] != null && f[c] >= v); return this; }
  not(c: string, op: string, v: unknown) {
    if (op !== 'is') throw new Error(`base falsa: not(${c}, ${op}) no está implementado`);
    this.filtros.push((f) => (f[c] ?? null) !== v);
    return this;
  }
  order(c: string, o: { ascending?: boolean } = {}) { this.orden = { col: c, asc: o.ascending !== false }; return this; }
  limit(n: number) { this.limite = n; return this; }
  single() { this.unica = 'single'; return this; }
  maybeSingle() { this.unica = 'maybe'; return this; }

  then<A = Resultado, B = never>(ok?: ((r: Resultado) => A | PromiseLike<A>) | null, ko?: ((e: unknown) => B | PromiseLike<B>) | null): PromiseLike<A | B> {
    return Promise.resolve().then(() => this.ejecutar()).then(ok, ko);
  }

  private ejecutar(): Resultado {
    if (this.base.ausentes.has(this.tabla)) {
      return { data: null, error: { code: '42P01', message: `relation "${this.tabla}" does not exist` } };
    }
    const filas = (this.base.tablas[this.tabla] ??= []);
    if (this.op !== 'select') {
      const falla = this.base.fallarProxima.get(this.tabla);
      if (falla) {
        this.base.fallarProxima.delete(this.tabla);
        return { data: null, error: falla };
      }
    }
    const coincide = (f: Fila) => this.filtros.every((p) => p(f));
    let afectadas: Fila[] = [];
    if (this.op === 'select') afectadas = filas.filter(coincide);
    if (this.op === 'insert' || this.op === 'upsert') {
      const clave = CLAVE[this.tabla] ?? 'id';
      for (const v of Array.isArray(this.valores) ? this.valores : [this.valores!]) {
        const existente = filas.find((f) => v[clave] !== undefined && f[clave] === v[clave]);
        if (this.op === 'upsert' && existente) {
          Object.assign(existente, copia(v));
          afectadas.push(existente);
          continue;
        }
        const nueva: Fila = { ...(clave === 'id' ? { id: randomUUID() } : {}), ...(DEFAULTS[this.tabla]?.() ?? {}), ...copia(v) };
        for (const col of UNICOS[this.tabla] ?? []) {
          if (nueva[col] != null && filas.some((f) => f[col] === nueva[col])) {
            return { data: null, error: { code: '23505', message: `duplicate key value violates unique constraint "${this.tabla}_${col}"` } };
          }
        }
        filas.push(nueva);
        afectadas.push(nueva);
      }
    }
    if (this.op === 'update') {
      afectadas = filas.filter(coincide);
      for (const f of afectadas) Object.assign(f, copia(this.valores));
    }
    if (this.op === 'delete') {
      afectadas = filas.filter(coincide);
      this.base.tablas[this.tabla] = filas.filter((f) => !coincide(f));
    }
    if (this.orden) {
      const { col, asc } = this.orden;
      afectadas = [...afectadas].sort((a, b) => (a[col] === b[col] ? 0 : (a[col] < b[col] ? -1 : 1) * (asc ? 1 : -1)));
    }
    if (this.limite !== undefined) afectadas = afectadas.slice(0, this.limite);
    const count = this.contar ? afectadas.length : null;
    if ((this.op !== 'select' && !this.devolver) || this.soloCuenta) return { data: null, error: null, count };
    const data = afectadas.map((f) => copia(f));
    if (this.unica === 'single') {
      return data.length === 1 ? { data: data[0], error: null } : { data: null, error: { code: 'PGRST116', message: `se esperaba 1 fila y hay ${data.length}` } };
    }
    if (this.unica === 'maybe') {
      return data.length <= 1 ? { data: data[0] ?? null, error: null } : { data: null, error: { code: 'PGRST116', message: `se esperaba 0 o 1 fila y hay ${data.length}` } };
    }
    return { data, error: null, count };
  }
}

function almacen(base: BaseFalsa, bucket: string) {
  const ruta = (p: string) => `${bucket}/${p}`;
  return {
    async upload(path: string, datos: Buffer | string, o?: { upsert?: boolean; contentType?: string }) {
      if (base.archivos.has(ruta(path)) && !o?.upsert) return { data: null, error: { message: 'The resource already exists' } };
      base.archivos.set(ruta(path), Buffer.isBuffer(datos) ? datos.toString('utf8') : String(datos));
      return { data: { path }, error: null };
    },
    async remove(paths: string[]) {
      for (const p of paths) base.archivos.delete(ruta(p));
      return { data: paths.map((name) => ({ name })), error: null };
    },
    async list(prefijo: string) {
      const pre = `${ruta(prefijo)}/`;
      return { data: [...base.archivos.keys()].filter((k) => k.startsWith(pre)).map((k) => ({ name: k.slice(pre.length) })), error: null };
    },
    async download(path: string) {
      const c = base.archivos.get(ruta(path));
      return c === undefined ? { data: null, error: { message: 'Object not found' } } : { data: new Blob([c]), error: null };
    },
  };
}

export function crearBaseFalsa(inicial: Record<string, Fila[]> = {}): BaseFalsa {
  const base: BaseFalsa = {
    tablas: Object.fromEntries(Object.entries(inicial).map(([t, filas]) => [t, filas.map((f) => copia(f))])),
    archivos: new Map(),
    ausentes: new Set(),
    fallarProxima: new Map(),
    cliente: undefined as unknown as SupabaseClient,
  };
  base.cliente = {
    from: (tabla: string) => new Consulta(base, tabla),
    storage: { from: (bucket: string) => almacen(base, bucket) },
  } as unknown as SupabaseClient;
  return base;
}
```

- [ ] **Step 7: Correr y ver que pasan; tipos**

Run: `cd entrevistador && npx vitest run test/v3/tipos.test.ts test/v3/base-falsa.test.ts && npx tsc --noEmit -p tsconfig.check.json`
Expected: PASS y sin errores de tipos.

- [ ] **Step 8: Commit**

```bash
git add supabase/migrations/20261007000000_entrevista_v3.sql supabase/CONTRATO.md entrevistador/src/v3/tipos.ts entrevistador/test/v3/base-falsa.ts entrevistador/test/v3/tipos.test.ts entrevistador/test/v3/base-falsa.test.ts
git commit -m "datos: entrevistas_v3 y las columnas nuevas de respuestas (migración para Naza), contrato y tipos de la fila

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 3: La fila con compare-and-swap, la toma del turno y las dependencias inyectables

**Files:**
- Create: `entrevistador/src/v3/estado.ts`
- Create: `entrevistador/src/v3/deps.ts`
- Create: `entrevistador/test/v3/deps-prueba.ts`
- Test: `entrevistador/test/v3/estado.test.ts`

**Interfaces:**
- Consumes: `FilaV3`, `estadoInicial` (Task 2); `crearBaseFalsa` (Task 2, tests); `ClienteModelo`, `Idioma` (núcleo).
- Produces (`estado.ts`):
  - `const TABLA_V3 = 'entrevistas_v3'`, `const TOMA_MS = 120_000`, `const INTENTOS_CAS = 5`
  - `function esTablaAusente(error: { code?: string; message?: string } | null): boolean`
  - `function narradoresV3(db: SupabaseClient): Promise<Set<string>>` — tabla ausente → vacío; otro error → tira.
  - `function esNarradorV3(db: SupabaseClient, narradorId: string): Promise<boolean>` — tabla ausente → false; otro error → tira.
  - `function leerFila(db, narradorId): Promise<FilaV3 | null>`
  - `function listarFilas(db): Promise<FilaV3[]>`
  - `type FilaNueva = Omit<FilaV3, 'version' | 'creada_at' | 'enviando_hasta'>`
  - `function crearFila(db, fila: FilaNueva): Promise<'creada' | 'ya-existia'>`
  - `type CambioFila = Partial<Pick<FilaV3, 'estado' | 'ultimo_audio_at' | 'tanda_dia' | 'tanda_cuenta' | 'enviando_hasta'>>`
  - `function guardarSiNoCambio(db, fila: FilaV3, cambio: CambioFila): Promise<FilaV3 | null>`
  - `type Paso<T> = { cambio: CambioFila; resultado: T } | null`
  - `function conReintento<T>(db, narradorId, paso: (fila: FilaV3) => Paso<T>): Promise<{ fila: FilaV3; resultado: T } | null>`
  - `function tomaVigente(fila: Pick<FilaV3, 'enviando_hasta'>, ahora: Date): boolean`
  - `function tomarTurno(db, narradorId, ahora: Date): Promise<FilaV3 | null>`
  - `function soltarTurno(db, narradorId): Promise<void>`
- Produces (`deps.ts`): `type WhatsAppV3`, `type Transcripcion = { texto: string; duracionSegundos: number }`, `type DepsV3` (abajo).
- Produces (tests): `depsDePrueba(base: BaseFalsa, o?)` → `{ deps, enviados, avisos, hitos, pasar(ms), fijar(fecha), fallar(n) }`; `type Enviado`.

- [ ] **Step 1: Escribir el test que falla**

`entrevistador/test/v3/estado.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { crearBaseFalsa } from './base-falsa.js';
import { conReintento, crearFila, esNarradorV3, guardarSiNoCambio, leerFila, narradoresV3, soltarTurno, tomarTurno, TOMA_MS } from '../../src/v3/estado.js';
import { estadoInicial, type FilaV3 } from '../../src/v3/tipos.js';

const nueva = (narrador_id = 'n1') => ({
  narrador_id, idioma: 'es-AR' as const, ficha: { nombre: 'Prueba', genero: 'mujer' as const },
  estado: estadoInicial(), ultimo_audio_at: null, tanda_dia: null, tanda_cuenta: 0, migrada_de: null,
});
const AHORA = new Date('2026-10-08T13:00:00Z');

describe('la fila de entrevistas_v3', () => {
  it('se crea una sola vez', async () => {
    const base = crearBaseFalsa();
    expect(await crearFila(base.cliente, nueva())).toBe('creada');
    expect(await crearFila(base.cliente, nueva())).toBe('ya-existia');
    expect((await leerFila(base.cliente, 'n1'))?.version).toBe(0);
  });

  it('sin la migración aplicada nadie es V3 (y el flujo viejo sigue)', async () => {
    const base = crearBaseFalsa();
    base.ausentes.add('entrevistas_v3');
    expect(await esNarradorV3(base.cliente, 'n1')).toBe(false);
    expect(await narradoresV3(base.cliente)).toEqual(new Set());
  });

  it('esNarradorV3 y narradoresV3 miran la tabla', async () => {
    const base = crearBaseFalsa();
    await crearFila(base.cliente, nueva('n1'));
    expect(await esNarradorV3(base.cliente, 'n1')).toBe(true);
    expect(await esNarradorV3(base.cliente, 'n2')).toBe(false);
    expect(await narradoresV3(base.cliente)).toEqual(new Set(['n1']));
  });

  it('compare-and-swap: una escritura con la versión vieja pierde', async () => {
    const base = crearBaseFalsa();
    await crearFila(base.cliente, nueva());
    const leida = (await leerFila(base.cliente, 'n1')) as FilaV3;
    expect(await guardarSiNoCambio(base.cliente, leida, { tanda_cuenta: 1 })).not.toBeNull();
    expect(await guardarSiNoCambio(base.cliente, leida, { tanda_cuenta: 9 })).toBeNull();
    expect(await leerFila(base.cliente, 'n1')).toMatchObject({ tanda_cuenta: 1, version: 1 });
  });

  it('conReintento relee y vuelve a aplicar si otro escribió en el medio', async () => {
    const base = crearBaseFalsa();
    await crearFila(base.cliente, nueva());
    let vueltas = 0;
    const r = await conReintento(base.cliente, 'n1', (f) => {
      vueltas++;
      // La primera vez, otro proceso escribe entre la lectura y el guardado.
      if (vueltas === 1) base.tablas.entrevistas_v3[0].version = 7;
      return { cambio: { tanda_cuenta: f.tanda_cuenta + 1 }, resultado: vueltas };
    });
    expect(vueltas).toBe(2);
    expect(r?.fila).toMatchObject({ tanda_cuenta: 1, version: 8 });
  });

  it('conReintento con paso null no escribe', async () => {
    const base = crearBaseFalsa();
    await crearFila(base.cliente, nueva());
    expect(await conReintento(base.cliente, 'n1', () => null)).toBeNull();
    expect((await leerFila(base.cliente, 'n1'))?.version).toBe(0);
  });

  it('la toma: uno solo manda; vence a los 2 minutos; se suelta', async () => {
    const base = crearBaseFalsa();
    await crearFila(base.cliente, nueva());
    expect(await tomarTurno(base.cliente, 'n1', AHORA)).not.toBeNull();
    expect(await tomarTurno(base.cliente, 'n1', AHORA)).toBeNull();
    expect(await tomarTurno(base.cliente, 'n1', new Date(AHORA.getTime() + TOMA_MS + 1))).not.toBeNull();
    await soltarTurno(base.cliente, 'n1');
    expect((await leerFila(base.cliente, 'n1'))?.enviando_hasta).toBeNull();
    expect(await tomarTurno(base.cliente, 'n1', AHORA)).not.toBeNull();
  });
});
```

- [ ] **Step 2: Correr y ver que falla**

Run: `cd entrevistador && npx vitest run test/v3/estado.test.ts`
Expected: FAIL (`Failed to load url ../../src/v3/estado.js`).

- [ ] **Step 3: Implementar `estado.ts`**

`entrevistador/src/v3/estado.ts`:

```ts
// La fila de `entrevistas_v3` (spec 2026-10-07, "Datos" y "Errores"). Toda
// escritura es compare-and-swap sobre `version`: si otro proceso escribió en el
// medio (un audio que llega mientras el reloj cierra), se relee y se vuelve a
// aplicar el cambio. Nada vive en memoria: si Railway se cae, el tick siguiente
// retoma desde la base. Recibe la base por parámetro: no importa db/cliente.ts.

import type { SupabaseClient } from '@supabase/supabase-js';
import type { FilaV3 } from './tipos.js';

export const TABLA_V3 = 'entrevistas_v3';
/** La toma del turno dura esto: si el proceso muere mandando, a los 2 minutos otro retoma. */
export const TOMA_MS = 2 * 60_000;
export const INTENTOS_CAS = 5;

type ErrorDeBase = { code?: string; message?: string } | null;

/** ¿La tabla no existe? (la migración sin aplicar): Postgres 42P01 o PostgREST PGRST205. */
export function esTablaAusente(error: ErrorDeBase): boolean {
  if (!error) return false;
  return error.code === '42P01' || error.code === 'PGRST205' || /does not exist|could not find the table/i.test(error.message ?? '');
}

/** Los narradores con V3 prendida. Sin la tabla, ninguno; con cualquier otro error, tira (mejor frenar que mandarle la pregunta vieja). */
export async function narradoresV3(db: SupabaseClient): Promise<Set<string>> {
  const { data, error } = await db.from(TABLA_V3).select('narrador_id');
  if (error) {
    if (esTablaAusente(error)) return new Set();
    throw new Error(`No pude leer entrevistas_v3: ${error.message}`);
  }
  return new Set(((data as { narrador_id: string }[] | null) ?? []).map((f) => f.narrador_id));
}

export async function esNarradorV3(db: SupabaseClient, narradorId: string): Promise<boolean> {
  const { data, error } = await db.from(TABLA_V3).select('narrador_id').eq('narrador_id', narradorId).maybeSingle();
  if (error) {
    if (esTablaAusente(error)) return false;
    throw new Error(`No pude saber si ${narradorId} tiene entrevista V3: ${error.message}`);
  }
  return data !== null && data !== undefined;
}

export async function leerFila(db: SupabaseClient, narradorId: string): Promise<FilaV3 | null> {
  const { data, error } = await db.from(TABLA_V3).select('*').eq('narrador_id', narradorId).maybeSingle();
  if (error) throw new Error(`No pude leer la entrevista V3 de ${narradorId}: ${error.message}`);
  return (data as FilaV3 | null) ?? null;
}

export async function listarFilas(db: SupabaseClient): Promise<FilaV3[]> {
  const { data, error } = await db.from(TABLA_V3).select('*');
  if (error) {
    if (esTablaAusente(error)) return [];
    throw new Error(`No pude listar las entrevistas V3: ${error.message}`);
  }
  return (data as FilaV3[] | null) ?? [];
}

export type FilaNueva = Omit<FilaV3, 'version' | 'creada_at' | 'enviando_hasta'>;

export async function crearFila(db: SupabaseClient, fila: FilaNueva): Promise<'creada' | 'ya-existia'> {
  const { error } = await db.from(TABLA_V3).insert({ ...fila, version: 0, enviando_hasta: null });
  if (!error) return 'creada';
  if (error.code === '23505') return 'ya-existia';
  throw new Error(`No pude crear la entrevista V3 de ${fila.narrador_id}: ${error.message}`);
}

export type CambioFila = Partial<Pick<FilaV3, 'estado' | 'ultimo_audio_at' | 'tanda_dia' | 'tanda_cuenta' | 'enviando_hasta'>>;

/** UPDATE … WHERE version = n. Devuelve la fila nueva, o null si otro escribió primero. */
export async function guardarSiNoCambio(db: SupabaseClient, fila: FilaV3, cambio: CambioFila): Promise<FilaV3 | null> {
  const { data, error } = await db.from(TABLA_V3)
    .update({ ...cambio, version: fila.version + 1 })
    .eq('narrador_id', fila.narrador_id)
    .eq('version', fila.version)
    .select('*');
  if (error) throw new Error(`No pude guardar la entrevista V3 de ${fila.narrador_id}: ${error.message}`);
  const filas = (data as FilaV3[] | null) ?? [];
  return filas.length === 1 ? filas[0] : null;
}

/** Lo que hay que escribir y lo que se devuelve; null = no hay nada que hacer. */
export type Paso<T> = { cambio: CambioFila; resultado: T } | null;

/**
 * Lee la fila, aplica `paso` y guarda con compare-and-swap; si perdió, relee
 * y vuelve a aplicar (hasta INTENTOS_CAS). `paso` tiene que ser puro: se puede
 * llamar más de una vez. Null si no hay fila o si `paso` dijo que no.
 */
export async function conReintento<T>(db: SupabaseClient, narradorId: string, paso: (fila: FilaV3) => Paso<T>): Promise<{ fila: FilaV3; resultado: T } | null> {
  for (let intento = 0; intento < INTENTOS_CAS; intento++) {
    const fila = await leerFila(db, narradorId);
    if (!fila) return null;
    const p = paso(fila);
    if (!p) return null;
    const nueva = await guardarSiNoCambio(db, fila, p.cambio);
    if (nueva) return { fila: nueva, resultado: p.resultado };
  }
  throw new Error(`Entrevista V3 de ${narradorId}: ${INTENTOS_CAS} escrituras seguidas perdieron contra otra; se reintenta en el próximo tick.`);
}

export function tomaVigente(fila: Pick<FilaV3, 'enviando_hasta'>, ahora: Date): boolean {
  return !!fila.enviando_hasta && Date.parse(fila.enviando_hasta) > ahora.getTime();
}

/** Toma el turno por TOMA_MS. Null si otro lo tiene: ese manda, este no. */
export async function tomarTurno(db: SupabaseClient, narradorId: string, ahora: Date): Promise<FilaV3 | null> {
  const r = await conReintento(db, narradorId, (f) =>
    tomaVigente(f, ahora) ? null : { cambio: { enviando_hasta: new Date(ahora.getTime() + TOMA_MS).toISOString() }, resultado: true });
  return r?.fila ?? null;
}

export async function soltarTurno(db: SupabaseClient, narradorId: string): Promise<void> {
  await conReintento(db, narradorId, () => ({ cambio: { enviando_hasta: null }, resultado: true }));
}
```

- [ ] **Step 4: Las dependencias inyectables y sus dobles de prueba**

`entrevistador/src/v3/deps.ts`:

```ts
// Todo lo que la V3 toca de afuera, en un solo objeto: así los tests y la
// simulación pasan una base en memoria y un WhatsApp falso, y el código de
// `src/v3/` no importa `db/cliente.ts` (que exige las variables de entorno al
// importarse). Las de verdad están en deps-reales.ts.

import type { SupabaseClient } from '@supabase/supabase-js';
import type { ClienteModelo } from './nucleo/entrevista/cazador.js';
import type { Idioma } from './nucleo/entrevista/idioma.js';

export type WhatsAppV3 = {
  /** Texto libre (dentro de la ventana de 24 h). Devuelve el id de Meta. */
  texto(telefono: string, texto: string): Promise<string>;
  /** Texto con botones de respuesta rápida (hasta 3, título de hasta 20 letras). */
  botones(telefono: string, texto: string, botones: string[]): Promise<string>;
  /** Plantilla aprobada en Meta (fuera de la ventana). `idiomaMeta`: 'es', 'es_ES', 'ca'. */
  plantilla(telefono: string, nombre: string, idiomaMeta: string, variables: string[]): Promise<string>;
  /** Baja un audio o una imagen de Meta. */
  descargar(mediaId: string): Promise<Buffer>;
};

export type Transcripcion = { texto: string; duracionSegundos: number };

export type DepsV3 = {
  db: SupabaseClient;
  wa: WhatsAppV3;
  transcribir(audio: Buffer, o: { nombre: string; idioma: Idioma; narradorId: string }): Promise<Transcripcion>;
  /** Aviso a los socios (consola + mail). Nunca tira. */
  avisar(clave: string, asunto: string, detalle: string): Promise<void>;
  /** Los mails de hito a la familia que ya existen (mail/hitos.ts). Nunca tira. */
  hito(narradorId: string, hito: 'primera' | 'mitad'): Promise<void>;
  /** El cliente del cazador; null = apagado. */
  cazador: ClienteModelo | null;
  ahora(): Date;
};
```

`entrevistador/test/v3/deps-prueba.ts`:

```ts
// Dependencias de prueba: la base falsa, un WhatsApp que anota lo que sale (y
// puede fallar N veces), una transcripción que devuelve el texto del "audio"
// (el mediaId ES el texto: así los tests y la simulación no gastan nada) y un
// reloj que se mueve a mano. "FALLA" tira; "VACIO" transcribe vacío.

import type { DepsV3 } from '../../src/v3/deps.js';
import type { ClienteModelo } from '../../src/v3/nucleo/entrevista/cazador.js';
import type { BaseFalsa } from './base-falsa.js';

export type Enviado = {
  a: string;
  tipo: 'texto' | 'botones' | 'plantilla';
  texto?: string;
  botones?: string[];
  plantilla?: string;
  idiomaMeta?: string;
  variables?: string[];
};

export function depsDePrueba(base: BaseFalsa, o: { ahora?: Date; fallarEnvios?: number; cazador?: ClienteModelo | null } = {}) {
  const enviados: Enviado[] = [];
  const avisos: { clave: string; asunto: string; detalle: string }[] = [];
  const hitos: string[] = [];
  let reloj = o.ahora ?? new Date('2026-10-08T13:00:00Z');
  let fallas = o.fallarEnvios ?? 0;
  let n = 0;
  const salir = (e: Enviado): Promise<string> => {
    if (fallas > 0) {
      fallas--;
      return Promise.reject(new Error('WhatsApp rechazó el envío: prueba'));
    }
    enviados.push(e);
    return Promise.resolve(`wamid.prueba.${++n}`);
  };
  const deps: DepsV3 = {
    db: base.cliente,
    wa: {
      texto: (a, texto) => salir({ a, tipo: 'texto', texto }),
      botones: (a, texto, botones) => salir({ a, tipo: 'botones', texto, botones }),
      plantilla: (a, plantilla, idiomaMeta, variables) => salir({ a, tipo: 'plantilla', plantilla, idiomaMeta, variables }),
      descargar: async (mediaId) => Buffer.from(mediaId, 'utf8'),
    },
    transcribir: async (audio) => {
      const t = audio.toString('utf8');
      if (t === 'FALLA') throw new Error('La transcripción falló: prueba');
      return { texto: t === 'VACIO' ? '' : t, duracionSegundos: 30 };
    },
    avisar: async (clave, asunto, detalle) => { avisos.push({ clave, asunto, detalle }); },
    hito: async (narradorId, hito) => { hitos.push(`${narradorId}:${hito}`); },
    cazador: o.cazador ?? null,
    ahora: () => reloj,
  };
  return {
    deps, enviados, avisos, hitos,
    pasar(ms: number) { reloj = new Date(reloj.getTime() + ms); },
    fijar(fecha: Date) { reloj = fecha; },
    fallar(veces: number) { fallas = veces; },
  };
}
```

- [ ] **Step 5: Correr y ver que pasa; tipos**

Run: `cd entrevistador && npx vitest run test/v3/estado.test.ts && npx tsc --noEmit -p tsconfig.check.json`
Expected: PASS y sin errores.

- [ ] **Step 6: Commit**

```bash
git add entrevistador/src/v3/estado.ts entrevistador/src/v3/deps.ts entrevistador/test/v3/deps-prueba.ts entrevistador/test/v3/estado.test.ts
git commit -m "entrevistador V3: la fila con compare-and-swap y la toma del turno

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 4: El motor de un turno (`turno.ts`), portado del script de la fábrica

**Files:**
- Create: `entrevistador/src/v3/turno.ts`
- Test: `entrevistador/test/v3/turno.test.ts`, `entrevistador/test/v3/turno-igual-al-script.test.ts`

**Interfaces:**
- Consumes: núcleo (Task 1); `EstadoV3`, `Parte`, `Saliente`, `MARCA_FOTO`, `estadoInicial` (Task 2).
- Produces:
  - `function textoDeGlobo(partes: Parte[]): string`
  - `function textoDelBanco(id: string, ficha: FichaTexto): string` — un mensaje del banco del idioma de la ficha, renderizado; tira si no existe.
  - `function encolar(e: EstadoV3, s: Omit<Saliente, 'id'>): EstadoV3`
  - `function quitarSalientes(e: EstadoV3, ids: readonly number[]): EstadoV3`
  - `type AudioRecibido = { estado: EstadoV3; clave: string | null; abierta: boolean }`; `function recibirAudio(e: EstadoV3, texto: string): AudioRecibido`
  - `type Toque = { estado: EstadoV3; clave: string; cerrar: boolean }`; `function tocarBoton(e: EstadoV3, ficha: FichaTexto, texto: string): Toque | null`
  - `function marcarFoto(e: EstadoV3): { estado: EstadoV3; clave: string } | null`
  - `type Cierre = { estado: EstadoV3; bloqueCerrado?: number }`; `function cerrarRespuesta(e: EstadoV3, ficha: FichaTexto): Cierre`
  - `type Avance = { estado: EstadoV3; abrio: boolean }`; `function avanzar(e: EstadoV3, ficha: FichaTexto): Avance`
  - `type Seguir = { estado: EstadoV3; abrio: boolean; bloqueCerrado?: number }`; `function cerrarYSeguir(e: EstadoV3, ficha: FichaTexto, puedeAbrir: boolean): Seguir`
  - `function reenviarAbierta(e: EstadoV3): EstadoV3`
  - `function textoMandado(e: EstadoV3, ficha: FichaTexto, id: string): string`
  - `function cazarAlCerrar(e: EstadoV3, ficha: FichaTexto, bloque: number, cliente: ClienteModelo): Promise<ResultadoCaza>`
  - `function sumarCaza(e: EstadoV3, r: ResultadoCaza): EstadoV3`

Reglas que el motor cumple (y que los tests fijan):
- No manda BIEN: el narrador nuevo ya recibió la bienvenida de la plantilla y el que pasa de la vieja ya está en curso (spec: "sale OR1 con M1").
- Los audios de la abierta se suman en `borrador` (`sumarAudio`). Recién `cerrarRespuesta` los pasa a `respuestas` y anota el acuse (`mensajesDespues` → `anotarAcuse`), igual que `cerrarRespuesta` del script.
- Botón "Sí" (que pide audio): la marca va a `respuestas`, `tocoSi`, y M30 a la cola como `suelto`; no cierra. Botón "No"/"Paso" (y el "Sí" de AMH): la marca va al `borrador` y el que llama cierra en el momento con `cerrarYSeguir`.
- `cerrarYSeguir(…, puedeAbrir = false)` (tope de la tanda): cierra, deja el acuse pendiente y no manda nada; el próximo `avanzar` lo pega arriba.
- Un audio sin pregunta abierta (después del tope) se suma a la última respuesta.
- Cada globo `bio` del turno es un `Saliente` `turno`; los botones van en el último.

- [ ] **Step 1: Escribir los tests que fallan**

`entrevistador/test/v3/turno.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { mensajePorId, preguntaPorId } from '../../src/v3/nucleo/entrevista/banco.js';
import { renderizar, type FichaTexto } from '../../src/v3/nucleo/entrevista/texto.js';
import { avanzar, cerrarRespuesta, cerrarYSeguir, encolar, marcarFoto, quitarSalientes, recibirAudio, reenviarAbierta, textoDelBanco, tocarBoton } from '../../src/v3/turno.js';
import { estadoInicial, MARCA_FOTO, type EstadoV3 } from '../../src/v3/tipos.js';

const FICHA: FichaTexto = { nombre: 'Prueba', genero: 'mujer' };
const abierta = (id: string): EstadoV3 => ({ ...estadoInicial(), esperando: id });

describe('avanzar', () => {
  it('arranca con OR1 y M1, sin la bienvenida', () => {
    const { estado, abrio } = avanzar(estadoInicial(), FICHA);
    expect(abrio).toBe(true);
    expect(estado.esperando).toBe('OR1');
    expect(estado.salientes).toEqual([{ id: 1, tipo: 'turno', texto: `${renderizar(preguntaPorId('OR1')!.texto, FICHA)}\n${mensajePorId('M1')!.texto}` }]);
    expect(estado.salientes[0].texto).not.toContain(textoDelBanco('BIEN', FICHA).slice(0, 30));
    expect(estado.preguntaAbierta?.partes.map((p) => p.id)).toEqual(['OR1', 'M1']);
    expect(estado.charla[0]).toEqual({ de: 'bloque', bloque: 1, nombre: expect.any(String) });
  });

  it('no avanza si ya hay una pregunta esperando', () => {
    expect(() => avanzar(abierta('OR1'), FICHA)).toThrow(/espera respuesta/);
  });

  it('en catalán sale la pregunta del banco catalán', () => {
    const ca: FichaTexto = { ...FICHA, idioma: 'ca' };
    const { estado } = avanzar(estadoInicial(), ca);
    expect(estado.salientes[0].texto.startsWith(renderizar(preguntaPorId('OR1', 'ca')!.texto, ca))).toBe(true);
  });
});

describe('audios, silencio y acuse', () => {
  it('los audios se suman y al cerrar sale la siguiente con el acuse pegado arriba', () => {
    let e = avanzar(estadoInicial(), FICHA).estado;
    e = recibirAudio(e, 'Nací en un pueblo chico.').estado;
    const r = recibirAudio(e, 'Mi mamá cosía para afuera.');
    expect(r).toMatchObject({ clave: 'OR1', abierta: true });
    expect(r.estado.borrador).toBe('Nací en un pueblo chico. Mi mamá cosía para afuera.');
    const s = cerrarYSeguir(r.estado, FICHA, true);
    expect(s.abrio).toBe(true);
    expect(s.estado.respuestas).toEqual([['OR1', 'Nací en un pueblo chico. Mi mamá cosía para afuera.']]);
    expect(s.estado.esperando).toBe('OR2');
    expect(s.estado.borrador).toBeUndefined();
    expect(s.estado.salientes).toHaveLength(2);
    expect(s.estado.salientes[1].texto.startsWith(`${textoDelBanco('M3.1', FICHA)}\n`)).toBe(true);
  });

  it('con el tope de la tanda cierra, guarda el acuse y no manda nada; mañana sale pegado', () => {
    let e = avanzar(estadoInicial(), FICHA).estado;
    e = recibirAudio(e, 'Nací en un pueblo chico.').estado;
    const s = cerrarYSeguir(e, FICHA, false);
    expect(s.abrio).toBe(false);
    expect(s.estado.esperando).toBeUndefined();
    expect(s.estado.acuse).toEqual({ familia: 'M3', n: 0 });
    expect(s.estado.salientes).toHaveLength(1);
    const manana = avanzar(s.estado, FICHA);
    expect(manana.estado.salientes[1].texto.startsWith(`${textoDelBanco('M3.1', FICHA)}\n`)).toBe(true);
  });

  it('un audio sin pregunta abierta (después del tope) se suma a la última respuesta', () => {
    let e = avanzar(estadoInicial(), FICHA).estado;
    e = cerrarYSeguir(recibirAudio(e, 'Nací en un pueblo chico.').estado, FICHA, false).estado;
    const r = recibirAudio(e, 'Y me olvidaba del río.');
    expect(r).toMatchObject({ clave: 'OR1', abierta: false });
    expect(r.estado.respuestas).toEqual([['OR1', 'Nací en un pueblo chico. Y me olvidaba del río.']]);
  });

  it('un audio vacío no cambia nada', () => {
    const e = avanzar(estadoInicial(), FICHA).estado;
    expect(recibirAudio(e, '   ')).toMatchObject({ clave: null, abierta: false });
  });

  it('no se puede cerrar una pregunta sin nada contado', () => {
    expect(() => cerrarRespuesta(abierta('OR1'), FICHA)).toThrow(/nada para cerrar/);
  });

  it('reenviarAbierta manda la pregunta sola, sin el acuse de ayer', () => {
    let e = avanzar(estadoInicial(), FICHA).estado;
    e = cerrarYSeguir(recibirAudio(e, 'Nací en un pueblo chico.').estado, FICHA, true).estado;
    const r = reenviarAbierta(e);
    expect(r.salientes).toHaveLength(3);
    expect(r.salientes[2].texto.startsWith(renderizar(preguntaPorId('OR2')!.texto, FICHA))).toBe(true);
    expect(r.salientes[2].texto).not.toContain(textoDelBanco('M3.1', FICHA));
  });
});

describe('botones', () => {
  it('"Sí" manda M30 solo y sigue esperando audio en la misma pregunta', () => {
    const t = tocarBoton(abierta('CA6'), FICHA, 'Sí, tuve')!;
    expect(t.cerrar).toBe(false);
    expect(t.estado.tocoSi).toBe(true);
    expect(t.estado.esperando).toBe('CA6');
    expect(t.estado.respuestas).toEqual([['CA6', '⟦botón:Sí, tuve⟧']]);
    expect(t.estado.salientes).toEqual([{ id: 1, tipo: 'suelto', texto: textoDelBanco('M30', FICHA) }]);
    const conAudio = recibirAudio(t.estado, 'Éramos cuatro.').estado;
    const s = cerrarYSeguir(conAudio, FICHA, true);
    expect(s.estado.respuestas[0]).toEqual(['CA6', '⟦botón:Sí, tuve⟧ Éramos cuatro.']);
  });

  it('"No" cierra en el momento con la marca del botón', () => {
    const t = tocarBoton(abierta('CA6'), FICHA, 'No tuve hermanos')!;
    expect(t.cerrar).toBe(true);
    const s = cerrarYSeguir(t.estado, FICHA, true);
    expect(s.estado.respuestas).toEqual([['CA6', '⟦botón:No tuve hermanos⟧']]);
    expect(s.abrio).toBe(true);
  });

  it('un texto que no es botón de la abierta no es un toque', () => {
    expect(tocarBoton(abierta('CA6'), FICHA, 'Quizás')).toBeNull();
    expect(tocarBoton(estadoInicial(), FICHA, 'Sí, tuve')).toBeNull();
    const yaToco = tocarBoton(abierta('CA6'), FICHA, 'Sí, tuve')!.estado;
    expect(tocarBoton(yaToco, FICHA, 'No tuve hermanos')).toBeNull();
  });

  it('el cierre de un bloque avisa qué bloque cerró (para el cazador)', () => {
    const t = tocarBoton(abierta('CI1'), FICHA, 'No, está todo')!;
    expect(cerrarYSeguir(t.estado, FICHA, true).bloqueCerrado).toBe(preguntaPorId('CI1')!.bloque);
  });
});

describe('foto y cola', () => {
  it('la foto contesta FO1 y nada más', () => {
    const r = marcarFoto(abierta('FO1'))!;
    expect(r).toMatchObject({ clave: 'FO1' });
    expect(r.estado.borrador).toBe(MARCA_FOTO);
    expect(marcarFoto(r.estado)!.estado.borrador).toBe(MARCA_FOTO);
    expect(marcarFoto(abierta('OR1'))).toBeNull();
    expect(marcarFoto(estadoInicial())).toBeNull();
  });

  it('encolar numera y quitarSalientes saca por id', () => {
    let e = encolar(estadoInicial(), { texto: 'a', tipo: 'suelto' });
    e = encolar(e, { texto: 'b', tipo: 'suelto' });
    expect(e.salientes.map((s) => s.id)).toEqual([1, 2]);
    expect(quitarSalientes(e, [1]).salientes.map((s) => s.texto)).toEqual(['b']);
  });
});
```

`entrevistador/test/v3/turno-igual-al-script.test.ts` (la prueba de que es el mismo motor: los mismos mensajes que `fabrica/scripts/v3-entrevista-turno.ts`, en los tres idiomas, de punta a punta):

```ts
import { describe, it, expect } from 'vitest';
import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { botonesDeClave } from '../../src/v3/nucleo/entrevista/flujo.js';
import { preguntaPorId } from '../../src/v3/nucleo/entrevista/banco.js';
import type { Idioma } from '../../src/v3/nucleo/entrevista/idioma.js';
import { leerBoton } from '../../src/v3/nucleo/entrevista/respuesta.js';
import type { FichaTexto } from '../../src/v3/nucleo/entrevista/texto.js';
import { VIDAS_EJEMPLO } from '../../src/v3/nucleo/entrevista/vidas-ejemplo.js';
import { avanzar, cerrarYSeguir, recibirAudio, tocarBoton } from '../../src/v3/turno.js';
import { estadoInicial, type EstadoV3 } from '../../src/v3/tipos.js';

const SCRIPT = new URL('../../../fabrica/scripts/v3-entrevista-turno.ts', import.meta.url);
const hayFabrica = existsSync(fileURLToPath(SCRIPT));

/** Respuestas genéricas inventadas, por idioma (las de vidas-ejemplo.ts son en castellano). */
const GENERICA: Record<Idioma, string> = {
  'es-AR': 'Sí, fue una historia larga que te cuento con todos los detalles que me acuerdo.',
  'es-ES': 'Sí, fue una historia larga que te cuento con todos los detalles que recuerdo.',
  ca: 'Sí, va ser una història llarga que t’explico amb tots els detalls que recordo.',
};

function respuestaPara(id: string, idioma: Idioma, tocoSi: boolean): { boton: string } | { texto: string } {
  if (tocoSi) return { texto: GENERICA[idioma] };
  const botones = botonesDeClave(id, idioma) ?? [];
  const deLaVida = idioma === 'es-AR' ? VIDAS_EJEMPLO[0].respuestas[id] : undefined;
  if (deLaVida !== undefined) {
    const { boton, resto } = leerBoton(deLaVida);
    if (boton !== undefined && !resto && botones.some((b) => b.texto === boton)) return { boton };
    return { texto: deLaVida };
  }
  const no = botones.find((b) => b.vale === 'no');
  if (preguntaPorId(id, idioma)?.clase === 'foto' && no) return { boton: no.texto };
  return { texto: GENERICA[idioma] };
}

const comoScript = (e: EstadoV3, desde: number) =>
  e.salientes.slice(desde).map((s) => s.texto + (s.botones ? `\n[botones: ${s.botones.map((b) => `(${b})`).join(' ')}]` : ''));

describe.skipIf(!hayFabrica)('turno.ts manda lo mismo que v3-entrevista-turno.ts de la fábrica', () => {
  it.each(['es-AR', 'es-ES', 'ca'] as const)('una entrevista entera en %s', async (idioma) => {
    const motor = (await import(/* @vite-ignore */ SCRIPT.href)) as any;
    const ficha: FichaTexto = idioma === 'es-AR' ? { nombre: 'Prueba', genero: 'varon' } : { nombre: 'Prueba', genero: 'varon', idioma };
    let script = motor.nuevaEntrevista(ficha);
    let nuestro = avanzar(estadoInicial(), ficha).estado;
    expect(comoScript(nuestro, 0)).toEqual(script.mensajes.slice(1)); // el script arranca con BIEN; nosotros no

    for (let paso = 0; paso < 400 && !script.estado.terminada; paso++) {
      const id = nuestro.esperando!;
      expect(id).toBe(script.estado.esperando);
      const desde = nuestro.salientes.length;
      const r = respuestaPara(id, idioma, nuestro.tocoSi === true);
      if ('boton' in r) {
        script = motor.tocarBoton(script.estado, r.boton);
        const t = tocarBoton(nuestro, ficha, r.boton)!;
        nuestro = t.cerrar ? cerrarYSeguir(t.estado, ficha, true).estado : t.estado;
      } else {
        script = motor.responder(script.estado, r.texto);
        nuestro = cerrarYSeguir(recibirAudio(nuestro, r.texto).estado, ficha, true).estado;
      }
      expect(comoScript(nuestro, desde)).toEqual(script.mensajes);
    }
    expect(script.estado.terminada).toBe(true);
    expect(nuestro.terminada).toBe(true);
    expect(nuestro.respuestas).toEqual(script.estado.respuestas);
  });
});
```

- [ ] **Step 2: Correr y ver que fallan**

Run: `cd entrevistador && npx vitest run test/v3/turno.test.ts test/v3/turno-igual-al-script.test.ts`
Expected: FAIL (`Failed to load url ../../src/v3/turno.js`).

- [ ] **Step 3: Implementar `turno.ts`**

`entrevistador/src/v3/turno.ts`:

```ts
// El motor de un turno de la entrevista V3 en WhatsApp (spec 2026-10-07),
// portado de fabrica/scripts/v3-entrevista-turno.ts. PURO: entra el estado y
// lo que hizo el narrador, sale el estado nuevo con los mensajes a mandar en
// `salientes`. No toca la base ni WhatsApp.
//
// Diferencias con el script, todas por WhatsApp:
//   - no manda la bienvenida (BIEN): el narrador ya está en la conversación;
//   - los audios se juntan en `borrador` hasta que el reloj cierra la
//     respuesta (3' de silencio): `recibirAudio` no avanza;
//   - `cerrarRespuesta` y `avanzar` van separados, para respetar el tope de
//     la tanda del día (el acuse queda pendiente y sale pegado mañana);
//   - guarda la pregunta abierta sin acuse, para reenviarla al día siguiente.
// Lo demás es el script línea por línea (un test lo compara mensaje por mensaje).

import { mensajePorId, nombresBloqueDe, preguntaPorId } from './nucleo/entrevista/banco.js';
import { cazarBloque, fichaCorta, mensajeRepregunta, type ClienteModelo, type ResultadoCaza } from './nucleo/entrevista/cazador.js';
import { alTocarBoton, anotarInferidas, botonesDeClave, mensajesDespues, preguntaDeClave, siguientePregunta } from './nucleo/entrevista/flujo.js';
import { idiomaDe } from './nucleo/entrevista/idioma.js';
import { acuseDeTurno, anotarAcuse, armarTurno, entradaSegunAcuse, preguntaSegunAcuse } from './nucleo/entrevista/mensajes.js';
import { leerBoton, sumarAudio } from './nucleo/entrevista/respuesta.js';
import { renderizar, type FichaTexto } from './nucleo/entrevista/texto.js';
import { MARCA_FOTO, type EstadoV3, type Parte, type Saliente } from './tipos.js';

function clonar(e: EstadoV3): EstadoV3 {
  return JSON.parse(JSON.stringify(e)) as EstadoV3;
}

/** El texto de un globo como llega por WhatsApp (igual que en el script). */
export function textoDeGlobo(partes: Parte[]): string {
  return partes.map((p, i) => (i === 0 ? '' : partes[i - 1].id === p.id ? '\n\n' : '\n') + p.texto).join('');
}

/** Un mensaje del banco (M22, M23, M30, M8…) en el idioma de la ficha, renderizado. */
export function textoDelBanco(id: string, ficha: FichaTexto): string {
  const m = mensajePorId(id, idiomaDe(ficha));
  if (!m) throw new Error(`El banco (${idiomaDe(ficha)}) no tiene el mensaje ${id}.`);
  return renderizar(m.texto, ficha);
}

function encolarEn(e: EstadoV3, s: Omit<Saliente, 'id'>): void {
  e.seq += 1;
  e.salientes.push({ ...s, id: e.seq });
}

export function encolar(anterior: EstadoV3, s: Omit<Saliente, 'id'>): EstadoV3 {
  const e = clonar(anterior);
  encolarEn(e, s);
  return e;
}

export function quitarSalientes(anterior: EstadoV3, ids: readonly number[]): EstadoV3 {
  const e = clonar(anterior);
  e.salientes = e.salientes.filter((s) => !ids.includes(s.id));
  return e;
}

export type AudioRecibido = { estado: EstadoV3; clave: string | null; abierta: boolean };

/**
 * Un audio (su transcripción). Con una pregunta abierta, se suma al borrador
 * (`abierta: true`: corre el reloj de silencio). Sin abierta (después del tope
 * de la tanda), se suma a la última respuesta.
 */
export function recibirAudio(anterior: EstadoV3, texto: string): AudioRecibido {
  const t = texto.replace(/\r\n?/g, '\n').trim();
  const e = clonar(anterior);
  if (t === '' || e.terminada) return { estado: e, clave: null, abierta: false };
  if (e.esperando) {
    e.borrador = sumarAudio(e.borrador ?? '', t);
    return { estado: e, clave: e.esperando, abierta: true };
  }
  const ultima = e.respuestas.at(-1);
  if (!ultima) return { estado: e, clave: null, abierta: false };
  ultima[1] = sumarAudio(ultima[1], t);
  return { estado: e, clave: ultima[0], abierta: false };
}

export type Toque = { estado: EstadoV3; clave: string; cerrar: boolean };

/**
 * Tocó un botón de la pregunta abierta. Null si ese texto no es un botón de la
 * abierta (o si ya tocó "Sí"): el que llama lo trata como texto suelto.
 * "Sí" que pide audio: la marca a `respuestas`, `tocoSi` y M30 a la cola.
 * "No" / "Paso" (y el "Sí" de AMH): la marca al borrador y `cerrar: true`.
 */
export function tocarBoton(anterior: EstadoV3, ficha: FichaTexto, texto: string): Toque | null {
  const id = anterior.esperando;
  if (!id || anterior.tocoSi) return null;
  const botones = botonesDeClave(id, idiomaDe(ficha)) ?? [];
  if (!botones.some((b) => b.texto === texto)) return null;
  const e = clonar(anterior);
  const toque = alTocarBoton({ id, botones }, texto);
  const respuesta = sumarAudio(toque.respuesta, e.borrador ?? '');
  e.charla.push({ de: 'persona', pregunta: id, texto: `[toca: ${texto}]`, boton: texto });
  if (toque.esperaAudio) {
    e.respuestas.push([id, respuesta]);
    e.tocoSi = true;
    e.borrador = undefined;
    const m30 = textoDelBanco(toque.mandar, ficha);
    e.charla.push({ de: 'bio', partes: [{ id: toque.mandar, texto: m30 }] });
    encolarEn(e, { texto: m30, tipo: 'suelto' });
    return { estado: e, clave: id, cerrar: false };
  }
  e.borrador = respuesta;
  return { estado: e, clave: id, cerrar: true };
}

/** Llegó una foto: si la abierta es la de la foto (FO1), queda marcada en el borrador. */
export function marcarFoto(anterior: EstadoV3): { estado: EstadoV3; clave: string } | null {
  const id = anterior.esperando;
  if (!id || preguntaPorId(id)?.clase !== 'foto') return null;
  const e = clonar(anterior);
  if (!(e.borrador ?? '').includes(MARCA_FOTO)) e.borrador = sumarAudio(MARCA_FOTO, e.borrador ?? '');
  return { estado: e, clave: id };
}

export type Cierre = { estado: EstadoV3; bloqueCerrado?: number };

/** La respuesta de `esperando` está completa: pasa a `respuestas` y se anota su acuse (como en el script). */
export function cerrarRespuesta(anterior: EstadoV3, ficha: FichaTexto): Cierre {
  const id = anterior.esperando;
  if (!id) throw new Error('cerrarRespuesta: no hay ninguna pregunta esperando respuesta.');
  const borrador = (anterior.borrador ?? '').trim();
  if (!anterior.tocoSi && borrador === '') throw new Error(`cerrarRespuesta: ${id} no tiene nada para cerrar.`);
  const e = clonar(anterior);
  if (e.tocoSi) {
    const ultima = e.respuestas.at(-1)!;
    ultima[1] = sumarAudio(ultima[1], borrador);
  } else {
    e.respuestas.push([id, borrador]);
  }
  const dicho = leerBoton(borrador).resto.trim();
  if (dicho) e.charla.push({ de: 'persona', pregunta: id, texto: dicho });
  e.esperando = undefined;
  e.tocoSi = undefined;
  e.borrador = undefined;
  e.preguntaAbierta = undefined;
  e.acuse = undefined;
  const idioma = idiomaDe(ficha);
  const [, r] = e.respuestas.at(-1)!;
  const anteriores = new Map(e.respuestas.slice(0, -1)); // para M29 (tercer olvido seguido)
  const p = preguntaDeClave(id, idioma);
  if (!p) e.acuse = anotarAcuse('M3', e.vueltas); // pregunta de la familia: acuse común
  else for (const fam of mensajesDespues(p, r, anteriores, idioma)) e.acuse = anotarAcuse(fam, e.vueltas);
  const delBanco = preguntaPorId(id, idioma);
  return delBanco?.clase === 'cierre' ? { estado: e, bloqueCerrado: delBanco.bloque } : { estado: e };
}

export type Avance = { estado: EstadoV3; abrio: boolean };

/** Manda todo lo que va hasta la próxima pregunta que espera respuesta (o hasta el final). Igual que `avanzar` del script. */
export function avanzar(anterior: EstadoV3, ficha: FichaTexto): Avance {
  if (anterior.esperando) throw new Error(`avanzar: ${anterior.esperando} todavía espera respuesta.`);
  const e = clonar(anterior);
  if (e.terminada) return { estado: e, abrio: false };
  const idioma = idiomaDe(ficha);
  const respuestas = new Map(e.respuestas);
  const enviados = new Set(e.enviados);
  // Lo que no se manda porque otra respuesta ya lo dijo queda guardado (AMH desde AM0).
  for (const id of anotarInferidas(respuestas, idioma)) e.respuestas.push([id, respuestas.get(id)!]);
  const texto = (id: string) => textoDelBanco(id, ficha);

  type Mandar = { entrada?: string; pregunta: string; conM1?: boolean; ayuda?: boolean; botones?: string[] };
  const mandar = (t: Mandar, textos: Record<string, string>, espera: boolean): void => {
    const siguiente = t.entrada ? texto(t.entrada) : (textos[t.pregunta] ?? texto(t.pregunta));
    const quePregunta = preguntaPorId(t.pregunta, idioma) ?? { id: t.pregunta, clase: 'historia' as const };
    const a = e.acuse;
    const idAcuse = a && acuseDeTurno(a.familia, a.n, siguiente, quePregunta);
    const textoAcuse = idAcuse ? mensajePorId(idAcuse, idioma)?.texto : undefined;
    if (t.entrada) textos[t.entrada] = renderizar(entradaSegunAcuse(mensajePorId(t.entrada, idioma)!.texto, textoAcuse), ficha);
    const delBanco = preguntaPorId(t.pregunta, idioma);
    // La pregunta sin acuse delante: la que se reenvía al día siguiente.
    const sola = delBanco ? renderizar(delBanco.texto, ficha, respuestas) : (textos[t.pregunta] ?? texto(t.pregunta));
    // FO1 va sin el nombre si el acuse pegado ya lo dice.
    if (!t.entrada && delBanco) textos[t.pregunta] = renderizar(preguntaSegunAcuse(t.pregunta, delBanco.texto, textoAcuse), ficha, respuestas);
    const m1 = t.conM1 ? 'M1' : undefined;
    const ayuda = t.ayuda ? 'M31' : undefined;
    const porId = armarTurno({ acuse: idAcuse, familia: a?.familia, entrada: t.entrada, pregunta: t.pregunta, m1, ayuda });
    // Los botones van debajo del mensaje de la pregunta (el último del turno).
    const botones = t.botones ?? delBanco?.botones?.map((b) => b.texto);
    porId.forEach((m, i) => {
      const partes = m.split('\n').map((id) => ({ id, texto: textos[id] ?? texto(id) }));
      const conBotones = botones !== undefined && i === porId.length - 1;
      e.charla.push({ de: 'bio', partes, ...(conBotones ? { botones } : {}) });
      encolarEn(e, { texto: textoDeGlobo(partes), tipo: 'turno', ...(conBotones ? { botones } : {}) });
    });
    if (espera) {
      const partes = armarTurno({ pregunta: t.pregunta, m1, ayuda })[0]
        .split('\n')
        .map((id) => ({ id, texto: id === t.pregunta ? sola : (textos[id] ?? texto(id)) }));
      e.preguntaAbierta = { partes, ...(botones ? { botones } : {}) };
    }
    e.acuse = undefined;
  };

  for (let vuelta = 0; vuelta < 50; vuelta++) {
    const s = siguientePregunta({ respuestas, enviados, rondaExtra: 'rechazada', familia: e.familia, repreguntas: e.repreguntas, idioma });
    if (s.tipo === 'terminada' || s.tipo === 'ofrecer-extra') {
      e.terminada = true; // la ronda extra no se ofrece: 'ofrecer-extra' no puede llegar
      return { estado: e, abrio: false };
    }
    if (s.tipo === 'familia') {
      mandar({ entrada: 'M15', pregunta: s.pregunta.id }, { [s.pregunta.id]: s.pregunta.texto }, true);
      e.esperando = s.pregunta.id;
      return { estado: e, abrio: true };
    }
    if (s.tipo === 'segunda-oportunidad') {
      mandar({ pregunta: s.mensaje }, {}, true); // M33.n va solo; lo que conteste se guarda como X~2
      e.esperando = s.clave;
      return { estado: e, abrio: true };
    }
    if (s.tipo === 'repregunta') {
      const rp = s.repregunta;
      mandar({ pregunta: rp.clave, botones: s.botones.map((b) => b.texto) }, { [rp.clave]: mensajeRepregunta(rp, idioma) }, true);
      e.esperando = rp.clave;
      return { estado: e, abrio: true };
    }
    const p = s.pregunta;
    if (p.bloque !== e.bloqueActual) {
      e.bloqueActual = p.bloque;
      e.charla.push({ de: 'bloque', bloque: p.bloque, nombre: nombresBloqueDe(idioma)[p.bloque] });
    }
    mandar({ entrada: s.entrada, pregunta: p.id, conM1: s.conM1, ayuda: s.ayudaBotones }, { [p.id]: renderizar(p.texto, ficha, respuestas) }, s.esperaRespuesta);
    if (s.esperaRespuesta) {
      e.esperando = p.id;
      return { estado: e, abrio: true };
    }
    // Aviso (AV11) y final (FIN): no esperan respuesta, sigue lo que venga.
    enviados.add(p.id);
    e.enviados.push(p.id);
  }
  throw new Error('avanzar: más de 50 mensajes sin una pregunta que espere respuesta.');
}

export type Seguir = { estado: EstadoV3; abrio: boolean; bloqueCerrado?: number };

/** Cierra la abierta y, si la tanda no llegó al tope (`puedeAbrir`), manda lo que sigue. */
export function cerrarYSeguir(anterior: EstadoV3, ficha: FichaTexto, puedeAbrir: boolean): Seguir {
  const c = cerrarRespuesta(anterior, ficha);
  const bloque = c.bloqueCerrado !== undefined ? { bloqueCerrado: c.bloqueCerrado } : {};
  if (!puedeAbrir) return { estado: c.estado, abrio: false, ...bloque };
  const a = avanzar(c.estado, ficha);
  return { estado: a.estado, abrio: a.abrio, ...bloque };
}

/** La pregunta abierta otra vez, sola (sin el acuse ni la entrada de ayer). */
export function reenviarAbierta(anterior: EstadoV3): EstadoV3 {
  const e = clonar(anterior);
  const p = e.preguntaAbierta;
  if (!e.esperando || !p) return e;
  e.charla.push({ de: 'bio', partes: p.partes, ...(p.botones ? { botones: p.botones } : {}) });
  encolarEn(e, { texto: textoDeGlobo(p.partes), tipo: 'turno', ...(p.botones ? { botones: p.botones } : {}) });
  return e;
}

// ---------------------------------------------------------------- cazador

/** La pregunta como se le mandó (igual que en el script). */
export function textoMandado(e: EstadoV3, ficha: FichaTexto, id: string): string {
  let texto: string | undefined;
  for (const g of e.charla) {
    if (g.de !== 'bio') continue;
    const partes = g.partes.filter((p) => p.id === id).map((p) => p.texto);
    if (partes.length > 0) texto = partes.join('\n\n'); // si se mandó dos veces, vale la última
  }
  const delBanco = preguntaPorId(id, idiomaDe(ficha));
  return texto ?? (delBanco ? renderizar(delBanco.texto, ficha) : '');
}

export function cazarAlCerrar(e: EstadoV3, ficha: FichaTexto, bloque: number, cliente: ClienteModelo): Promise<ResultadoCaza> {
  return cazarBloque({
    cliente,
    ficha: fichaCorta(ficha),
    bloque,
    respuestas: new Map(e.respuestas),
    textoPregunta: (id) => textoMandado(e, ficha, id),
    yaRepreguntado: e.repreguntas ?? [],
    escenasContadas: e.cazador?.escenasContadas ?? [],
    gastoUsd: e.cazador?.gastoUsd ?? 0,
    idioma: idiomaDe(ficha),
  });
}

/** Suma lo que devolvió el cazador (igual que en el script): la cola sin repetir clave, el gasto, las escenas y la llamada. */
export function sumarCaza(anterior: EstadoV3, r: ResultadoCaza): EstadoV3 {
  const e = clonar(anterior);
  if (!r.llamo) return e;
  const cola = e.repreguntas ?? [];
  for (const rp of r.repreguntas) if (!cola.some((x) => x.clave === rp.clave)) cola.push(rp);
  e.repreguntas = cola;
  const c = (e.cazador ??= { gastoUsd: 0, escenasContadas: [], registro: [] });
  c.gastoUsd += r.costoUsd;
  c.escenasContadas.push(...r.escenasContadas);
  c.registro.push({
    bloque: r.bloque,
    llamo: r.llamo,
    ...(r.motivo ? { motivo: r.motivo } : {}),
    repreguntas: r.repreguntas.map((x) => x.clave),
    descartadas: r.descartadas,
    ...(r.tokens ? { tokens: r.tokens } : {}),
    costoUsd: r.costoUsd,
    ...(r.error ? { error: r.error } : {}),
  });
  return e;
}
```

- [ ] **Step 4: Correr y ver que pasan; tipos**

Run: `cd entrevistador && npx vitest run test/v3/turno.test.ts test/v3/turno-igual-al-script.test.ts && npx tsc --noEmit -p tsconfig.check.json`
Expected: PASS. Si `turno-igual-al-script` difiere en un mensaje, el `toEqual` muestra cuál: se corrige `turno.ts` (nunca el núcleo ni el script de la fábrica).

- [ ] **Step 5: Commit**

```bash
git add entrevistador/src/v3/turno.ts entrevistador/test/v3/turno.test.ts entrevistador/test/v3/turno-igual-al-script.test.ts
git commit -m "entrevistador V3: el motor de un turno, portado del script de la fábrica y comparado mensaje por mensaje

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 5: La tanda del día y los avisos a los socios

**Files:**
- Create: `entrevistador/src/flujo/ritmo.ts` (sale de `entrevistador/src/flujo/preguntar.ts:68-83`)
- Create: `entrevistador/src/flujo/tiempo.ts` (sale de `entrevistador/src/flujo/scheduler.ts:17-29`)
- Modify: `entrevistador/src/flujo/preguntar.ts:68-83`, `entrevistador/src/flujo/scheduler.ts:17-29`
- Create: `entrevistador/src/v3/tanda.ts`
- Create: `entrevistador/src/v3/avisos.ts`
- Modify: `entrevistador/.env.example` (al final)
- Test: `entrevistador/test/v3/tanda.test.ts`, `entrevistador/test/v3/avisos.test.ts`

**Interfaces:**
- Consumes: `EstadoV3`, `FilaV3` (Task 2); núcleo `preguntaPorId`, `leerInferida`.
- Produces:
  - `flujo/ritmo.ts`: `type Ritmo = 'diario' | 'dos_por_dia' | 'seguido'`, `function ritmoDe(contexto: Record<string, any>): Ritmo`, `function esModoRapido(contexto: Record<string, any>): boolean` (re-exportados desde `preguntar.ts`, que los sigue exportando igual).
  - `flujo/tiempo.ts`: `function fechaLocal(fecha: Date, zona: string): string`, `function minutosLocales(fecha: Date, zona: string): number` (re-exportados desde `scheduler.ts`).
  - `tanda.ts`: `const TOPE_POR_RITMO: Readonly<Record<Ritmo, number>>`, `const BLOQUE_DE_LA_MITAD = 8`, `function cuentaDeHoy(fila: Pick<FilaV3, 'tanda_dia' | 'tanda_cuenta'>, hoy: string): number`, `function puedeAbrirHoy(fila: Pick<FilaV3, 'tanda_dia' | 'tanda_cuenta'>, ritmo: Ritmo, hoy: string): boolean`, `type Tanda = { estado: EstadoV3; tanda_dia: string; tanda_cuenta: number }`, `function aplicarTanda(fila: Pick<FilaV3, 'tanda_dia' | 'tanda_cuenta'>, estado: EstadoV3, hoy: string, abrio: boolean, ahora: Date): Tanda`, `function minutosDeHora(hora: string): number`, `function yaEsLaHora(horaPreferida: string, zona: string, ahora: Date): boolean`, `function hitosDe(estado: EstadoV3): ('primera' | 'mitad')[]`.
  - `avisos.ts`: `function avisarSocios(clave: string, asunto: string, detalle: string, o?: { ahora?: Date; fetch?: typeof fetch }): Promise<boolean>` (true si avisó; false si ya había avisado esa clave ese día), `function olvidarAvisos(): void` (para los tests).

- [ ] **Step 1: Escribir los tests que fallan**

`entrevistador/test/v3/tanda.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { aplicarTanda, cuentaDeHoy, hitosDe, puedeAbrirHoy, TOPE_POR_RITMO, yaEsLaHora } from '../../src/v3/tanda.js';
import { estadoInicial } from '../../src/v3/tipos.js';
import { ritmoDe } from '../../src/flujo/ritmo.js';
import { fechaLocal } from '../../src/flujo/tiempo.js';

const ZONA = 'America/Argentina/Buenos_Aires';
const HOY = '2026-10-08';

describe('la tanda del día', () => {
  it('el tope por ritmo es el del spec: 4, 8 y sin tope', () => {
    expect(TOPE_POR_RITMO).toEqual({ diario: 4, dos_por_dia: 8, seguido: Number.POSITIVE_INFINITY });
  });

  it('la cuenta de una tanda de otro día es cero', () => {
    expect(cuentaDeHoy({ tanda_dia: HOY, tanda_cuenta: 3 }, HOY)).toBe(3);
    expect(cuentaDeHoy({ tanda_dia: '2026-10-07', tanda_cuenta: 3 }, HOY)).toBe(0);
  });

  it('con 4 en el día y ritmo diario no abre otra; con dos_por_dia sí; seguido nunca frena', () => {
    const fila = { tanda_dia: HOY, tanda_cuenta: 4 };
    expect(puedeAbrirHoy(fila, 'diario', HOY)).toBe(false);
    expect(puedeAbrirHoy(fila, 'dos_por_dia', HOY)).toBe(true);
    expect(puedeAbrirHoy({ tanda_dia: HOY, tanda_cuenta: 500 }, 'seguido', HOY)).toBe(true);
  });

  it('aplicarTanda cuenta la pregunta que se abrió y marca el inicio si la tanda es nueva', () => {
    const ahora = new Date('2026-10-08T13:00:00Z');
    const nueva = aplicarTanda({ tanda_dia: '2026-10-07', tanda_cuenta: 4 }, estadoInicial(), HOY, true, ahora);
    expect(nueva).toMatchObject({ tanda_dia: HOY, tanda_cuenta: 1 });
    expect(nueva.estado.tandaInicioAt).toBe(ahora.toISOString());
    const sigue = aplicarTanda({ tanda_dia: HOY, tanda_cuenta: 2 }, estadoInicial(), HOY, true, ahora);
    expect(sigue).toMatchObject({ tanda_cuenta: 3 });
    expect(sigue.estado.tandaInicioAt).toBeUndefined();
    expect(aplicarTanda({ tanda_dia: HOY, tanda_cuenta: 4 }, estadoInicial(), HOY, false, ahora).tanda_cuenta).toBe(4);
  });

  it('la hora preferida en su zona', () => {
    expect(yaEsLaHora('10:00:00', ZONA, new Date('2026-10-08T12:59:00Z'))).toBe(false); // 09:59
    expect(yaEsLaHora('10:00:00', ZONA, new Date('2026-10-08T13:00:00Z'))).toBe(true); // 10:00
    expect(yaEsLaHora('10:00:00', ZONA, new Date('2026-10-08T20:00:00Z'))).toBe(true); // 17:00
    expect(fechaLocal(new Date('2026-10-09T01:00:00Z'), ZONA)).toBe(HOY);
  });

  it('los hitos de la familia: la primera respuesta y la mitad', () => {
    expect(hitosDe(estadoInicial())).toEqual([]);
    expect(hitosDe({ ...estadoInicial(), respuestas: [['OR1', 'Algo.']] })).toEqual(['primera']);
    expect(hitosDe({ ...estadoInicial(), respuestas: [['OR1', 'Algo.']], bloqueActual: 8 })).toEqual(['primera', 'mitad']);
  });

  it('ritmoDe sigue siendo el de siempre (movido a flujo/ritmo.ts)', () => {
    expect(ritmoDe({ ritmo: 'dos_por_dia' })).toBe('dos_por_dia');
    expect(ritmoDe({ modoRapido: true })).toBe('seguido');
    expect(ritmoDe({})).toBe('diario');
  });
});
```

`entrevistador/test/v3/avisos.test.ts`:

```ts
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { avisarSocios, olvidarAvisos } from '../../src/v3/avisos.js';

const AHORA = new Date('2026-10-08T13:00:00Z');

beforeEach(() => {
  olvidarAvisos();
  vi.spyOn(console, 'error').mockImplementation(() => {});
  vi.spyOn(console, 'warn').mockImplementation(() => {});
});
afterEach(() => {
  vi.unstubAllEnvs();
  vi.restoreAllMocks();
});

describe('avisar a los socios', () => {
  it('manda un mail a MAIL_SOCIOS por Resend', async () => {
    vi.stubEnv('RESEND_API_KEY', 'clave-prueba');
    vi.stubEnv('MAIL_SOCIOS', 'uno@ejemplo.com, dos@ejemplo.com');
    const fetch = vi.fn(async () => new Response('{}', { status: 200 }));
    expect(await avisarSocios('plantilla-ca-pregunta', 'Falta la plantilla', 'detalle', { ahora: AHORA, fetch })).toBe(true);
    const [url, init] = fetch.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toBe('https://api.resend.com/emails');
    expect(JSON.parse(String(init.body))).toMatchObject({ to: ['uno@ejemplo.com', 'dos@ejemplo.com'], subject: '[Vitácora V3] Falta la plantilla', text: 'detalle' });
  });

  it('una sola vez por clave y por día', async () => {
    vi.stubEnv('RESEND_API_KEY', 'clave-prueba');
    vi.stubEnv('MAIL_SOCIOS', 'uno@ejemplo.com');
    const fetch = vi.fn(async () => new Response('{}', { status: 200 }));
    await avisarSocios('x', 'a', 'b', { ahora: AHORA, fetch });
    expect(await avisarSocios('x', 'a', 'b', { ahora: AHORA, fetch })).toBe(false);
    expect(await avisarSocios('x', 'a', 'b', { ahora: new Date('2026-10-09T13:00:00Z'), fetch })).toBe(true);
    expect(fetch).toHaveBeenCalledTimes(2);
  });

  it('sin clave o sin destinatarios queda en la consola y no tira', async () => {
    vi.stubEnv('RESEND_API_KEY', '');
    const fetch = vi.fn();
    expect(await avisarSocios('y', 'a', 'b', { ahora: AHORA, fetch })).toBe(true);
    expect(fetch).not.toHaveBeenCalled();
    expect(console.error).toHaveBeenCalled();
  });

  it('si Resend falla, no tira', async () => {
    vi.stubEnv('RESEND_API_KEY', 'clave-prueba');
    vi.stubEnv('MAIL_SOCIOS', 'uno@ejemplo.com');
    const fetch = vi.fn(async () => { throw new Error('sin red'); });
    await expect(avisarSocios('z', 'a', 'b', { ahora: AHORA, fetch })).resolves.toBe(true);
  });
});
```

- [ ] **Step 2: Correr y ver que fallan**

Run: `cd entrevistador && npx vitest run test/v3/tanda.test.ts test/v3/avisos.test.ts`
Expected: FAIL (`Failed to load url ../../src/v3/tanda.js`, `../../src/v3/avisos.js`, `../../src/flujo/ritmo.js`).

- [ ] **Step 3: Sacar `ritmo` y `tiempo` a módulos puros**

`entrevistador/src/flujo/ritmo.ts` (las líneas 68-83 de `preguntar.ts`, movidas tal cual):

```ts
// El ritmo de la entrevista (docs/panel-usuario.md §6.4). Vive aparte de
// preguntar.ts (que importa la base) para que la V3 lo use sin arrastrarla.

export type Ritmo = 'diario' | 'dos_por_dia' | 'seguido';

/**
 * El ritmo de la entrevista (docs/panel-usuario.md §6.4): lo elige la familia
 * en el panel. `modoRapido` es el nombre viejo de 'seguido' (los pilotos).
 */
export function ritmoDe(contexto: Record<string, any>): Ritmo {
  const r = contexto?.ritmo;
  if (r === 'diario' || r === 'dos_por_dia' || r === 'seguido') return r;
  return contexto?.modoRapido === true ? 'seguido' : 'diario';
}

/** ¿Este narrador está en modo rápido (la siguiente pregunta sale al instante)? */
export function esModoRapido(contexto: Record<string, any>): boolean {
  return ritmoDe(contexto) === 'seguido';
}
```

En `entrevistador/src/flujo/preguntar.ts`, reemplazar las líneas 68-83 (desde `export type Ritmo` hasta el cierre de `esModoRapido`) por:

```ts
export { ritmoDe, esModoRapido, type Ritmo } from './ritmo.js';
```

`entrevistador/src/flujo/tiempo.ts` (las líneas 17-29 de `scheduler.ts`, movidas tal cual):

```ts
// Helpers de tiempo puros (en la zona del narrador). Viven aparte de
// scheduler.ts (que importa la base) para que la V3 los use sin arrastrarla.

/** 'YYYY-MM-DD' en la zona del narrador. */
export function fechaLocal(fecha: Date, zona: string): string {
  return new Intl.DateTimeFormat('sv-SE', { timeZone: zona }).format(fecha);
}

/** Minutos transcurridos del día en la zona del narrador. */
export function minutosLocales(fecha: Date, zona: string): number {
  const hhmm = new Intl.DateTimeFormat('es', {
    timeZone: zona, hour: '2-digit', minute: '2-digit', hour12: false,
  }).format(fecha);
  const [h, m] = hhmm.split(':').map(Number);
  return h * 60 + m;
}
```

En `entrevistador/src/flujo/scheduler.ts`, reemplazar las líneas 17-29 (las dos funciones) por:

```ts
import { fechaLocal, minutosLocales } from './tiempo.js';
export { fechaLocal, minutosLocales };
```

(y mover ese `import` arriba, con los demás imports del archivo).

- [ ] **Step 4: Implementar `tanda.ts`**

`entrevistador/src/v3/tanda.ts`:

```ts
// La tanda del día (spec 2026-10-07, "Ritmo"): a su hora sale la primera
// pregunta; mientras contesta, las siguientes salen de corrido; el tope por
// día depende del ritmo. Puro: lo usan entrante.ts, reloj.ts y pasar.ts.

import type { Ritmo } from '../flujo/ritmo.js';
import { minutosLocales } from '../flujo/tiempo.js';
import { preguntaPorId } from './nucleo/entrevista/banco.js';
import { leerInferida } from './nucleo/entrevista/respuesta.js';
import type { EstadoV3, FilaV3 } from './tipos.js';

export const TOPE_POR_RITMO: Readonly<Record<Ritmo, number>> = { diario: 4, dos_por_dia: 8, seguido: Number.POSITIVE_INFINITY };

/** De 15 bloques, cuando entra al 8 va por la mitad (el mail de hito 'mitad'). */
export const BLOQUE_DE_LA_MITAD = 8;

export function cuentaDeHoy(fila: Pick<FilaV3, 'tanda_dia' | 'tanda_cuenta'>, hoy: string): number {
  return fila.tanda_dia === hoy ? fila.tanda_cuenta : 0;
}

export function puedeAbrirHoy(fila: Pick<FilaV3, 'tanda_dia' | 'tanda_cuenta'>, ritmo: Ritmo, hoy: string): boolean {
  return cuentaDeHoy(fila, hoy) < TOPE_POR_RITMO[ritmo];
}

export type Tanda = { estado: EstadoV3; tanda_dia: string; tanda_cuenta: number };

/** Después de cerrar (y quizá abrir otra): la cuenta del día; si es la primera de una tanda nueva, cuándo arrancó (para M8). */
export function aplicarTanda(fila: Pick<FilaV3, 'tanda_dia' | 'tanda_cuenta'>, estado: EstadoV3, hoy: string, abrio: boolean, ahora: Date): Tanda {
  const tandaNueva = fila.tanda_dia !== hoy;
  return {
    estado: tandaNueva && abrio ? { ...estado, tandaInicioAt: ahora.toISOString() } : estado,
    tanda_dia: hoy,
    tanda_cuenta: cuentaDeHoy(fila, hoy) + (abrio ? 1 : 0),
  };
}

/** "10:00:00" → 600. */
export function minutosDeHora(hora: string): number {
  const [h, m] = hora.split(':').map(Number);
  return h * 60 + m;
}

/** ¿Ya pasó su hora preferida hoy, en su zona? */
export function yaEsLaHora(horaPreferida: string, zona: string, ahora: Date): boolean {
  return minutosLocales(ahora, zona) >= minutosDeHora(horaPreferida);
}

/** Los mails de hito que ya existen (mail/hitos.ts) y que tocan: mandarHito no repite. */
export function hitosDe(estado: EstadoV3): ('primera' | 'mitad')[] {
  const contadas = estado.respuestas.filter(([id, r]) => preguntaPorId(id)?.clase === 'historia' && leerInferida(r) === undefined);
  const hitos: ('primera' | 'mitad')[] = [];
  if (contadas.length >= 1) hitos.push('primera');
  if (estado.bloqueActual >= BLOQUE_DE_LA_MITAD) hitos.push('mitad');
  return hitos;
}
```

- [ ] **Step 5: Implementar `avisos.ts`**

`entrevistador/src/v3/avisos.ts`:

```ts
// Aviso a los socios (spec 2026-10-07: plantilla que falta, 3 fallos de envío,
// alta frenada sin género). No existía un canal: va a la consola de Railway y,
// si están RESEND_API_KEY y MAIL_SOCIOS (separados por coma), por mail. Una vez
// por clave y por día (en memoria: tras un reinicio puede repetirse una vez).
// Nunca tira: un aviso no puede frenar la entrevista. Es un mail interno, no un
// texto para el narrador.

const REMITENTE = process.env.MAIL_FROM ?? 'Vitácora Familiar <hola@vitacorafamiliar.com>';
const YA_AVISADO = new Set<string>();

export function olvidarAvisos(): void {
  YA_AVISADO.clear();
}

export async function avisarSocios(
  clave: string, asunto: string, detalle: string,
  o: { ahora?: Date; fetch?: typeof fetch } = {},
): Promise<boolean> {
  const dia = (o.ahora ?? new Date()).toISOString().slice(0, 10);
  const llave = `${clave}|${dia}`;
  if (YA_AVISADO.has(llave)) return false;
  YA_AVISADO.add(llave);
  console.error(`AVISO A LOS SOCIOS [${clave}]: ${asunto} — ${detalle}`);
  const claveResend = process.env.RESEND_API_KEY;
  const para = (process.env.MAIL_SOCIOS ?? '').split(',').map((s) => s.trim()).filter(Boolean);
  if (!claveResend || para.length === 0) {
    console.warn('avisos: falta RESEND_API_KEY o MAIL_SOCIOS; el aviso quedó solo en la consola.');
    return true;
  }
  try {
    const r = await (o.fetch ?? fetch)('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${claveResend}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ from: REMITENTE, to: para, subject: `[Vitácora V3] ${asunto}`, text: detalle }),
    });
    if (!r.ok) console.error(`avisos: Resend rechazó el aviso «${asunto}» (${r.status}).`);
  } catch (err) {
    console.error(`avisos: no pude mandar el aviso «${asunto}» por mail:`, err instanceof Error ? err.message : err);
  }
  return true;
}
```

Al final de `entrevistador/.env.example`, agregar:

```
# Entrevista V3 (spec 2026-10-07)
# Mails de aviso a los socios (separados por coma). Sin esto, los avisos quedan en la consola.
MAIL_SOCIOS=
# 1 = los narradores nuevos entran a la V3 al pasar a activo. APAGADO hasta que Naza diga.
V3_PARA_NUEVOS=
# 0 = apaga el cazador de escenas (Opus 5.5, tope USD 3 por entrevista). Vacío = prendido.
V3_CAZADOR=
# Plantillas de Meta aprobadas para la V3, como idioma:tipo separados por coma
# (ej. "es-AR:recordatorio,ca:pregunta,ca:recordatorio"). es-AR:pregunta (pregunta_diaria_vos) va siempre.
WA_PLANTILLAS_V3_LISTAS=
```

- [ ] **Step 6: Correr y ver que pasan; el flujo viejo sigue verde; tipos**

Run: `cd entrevistador && npx vitest run test/v3/tanda.test.ts test/v3/avisos.test.ts test/scheduler.test.ts test/procesar.test.ts && npx tsc --noEmit -p tsconfig.check.json`
Expected: PASS y sin errores.

- [ ] **Step 7: Commit**

```bash
git add entrevistador/src/flujo/ritmo.ts entrevistador/src/flujo/tiempo.ts entrevistador/src/flujo/preguntar.ts entrevistador/src/flujo/scheduler.ts entrevistador/src/v3/tanda.ts entrevistador/src/v3/avisos.ts entrevistador/.env.example entrevistador/test/v3/tanda.test.ts entrevistador/test/v3/avisos.test.ts
git commit -m "entrevistador V3: la tanda del día y el aviso a los socios

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 6: El cazador en segundo plano

**Files:**
- Create: `entrevistador/src/v3/cazador.ts`
- Modify: `entrevistador/src/costos.ts:20-24` (`PRECIOS_USD_POR_MILLON`)
- Test: `entrevistador/test/v3/cazador.test.ts`

**Interfaces:**
- Consumes: `leerFila`, `conReintento` (Task 3); `cazarAlCerrar`, `sumarCaza` (Task 4); `fichaTexto`, `RegistroCaza` (Task 2); `DepsV3` (Task 3); `registrarUso`, `cuentaDeEsteServicio` (`costos.ts`); núcleo `MODELO_CAZADOR`, `ClienteModelo`, `ResultadoCaza`.
- Produces:
  - `function cazadorPrendido(): boolean` — `process.env.V3_CAZADOR !== '0'`.
  - `function clienteCazador(apiKey: string): ClienteModelo`
  - `function cazarEnSegundoPlano(deps: DepsV3, narradorId: string, bloque: number): Promise<ResultadoCaza | null>` — nunca tira.
  - `function lanzarCazador(deps: DepsV3, narradorId: string, bloque: number): void`
  - `function esperarCazas(): Promise<void>`

- [ ] **Step 1: Escribir el test que falla**

`entrevistador/test/v3/cazador.test.ts`:

```ts
import { describe, it, expect, vi } from 'vitest';
import { crearBaseFalsa } from './base-falsa.js';
import { depsDePrueba } from './deps-prueba.js';
import { crearFila, leerFila } from '../../src/v3/estado.js';
import { cazarEnSegundoPlano, esperarCazas, lanzarCazador } from '../../src/v3/cazador.js';
import { calcularUsd } from '../../src/costos.js';
import { estadoInicial, type EstadoV3 } from '../../src/v3/tipos.js';
import type { ClienteModelo } from '../../src/v3/nucleo/entrevista/cazador.js';

const conBloque1 = (): EstadoV3 => ({
  ...estadoInicial(),
  respuestas: [['OR1', 'Nací en un pueblo chico y mi mamá cosía para afuera toda la tarde.'], ['CI1', '⟦botón:No, está todo⟧']],
});

async function preparar(cliente: ClienteModelo | null) {
  const base = crearBaseFalsa();
  await crearFila(base.cliente, {
    narrador_id: 'n1', idioma: 'es-AR', ficha: { nombre: 'Prueba', genero: 'mujer' }, estado: conBloque1(),
    ultimo_audio_at: null, tanda_dia: null, tanda_cuenta: 0, migrada_de: null,
  });
  return { base, ...depsDePrueba(base, { cazador: cliente }) };
}

const clienteQueContesta = (): ClienteModelo => ({
  messages: { create: vi.fn(async () => ({ content: [{ type: 'text', text: '{"elegidas": [], "escenas_contadas": []}' }], usage: { input_tokens: 1000, output_tokens: 200 } })) },
});

describe('el cazador en segundo plano', () => {
  it('apagado (sin cliente) no hace nada', async () => {
    const { deps, base } = await preparar(null);
    expect(await cazarEnSegundoPlano(deps, 'n1', 1)).toBeNull();
    expect(base.tablas.consumo_ia ?? []).toHaveLength(0);
  });

  it('llama con Opus 5.5, anota el costo en consumo_ia y suma el registro a la fila', async () => {
    const cliente = clienteQueContesta();
    const { deps, base } = await preparar(cliente);
    const r = await cazarEnSegundoPlano(deps, 'n1', 1);
    expect(r?.llamo).toBe(true);
    expect((cliente.messages.create as any).mock.calls[0][0].model).toBe('claude-opus-5-5');
    expect(base.tablas.consumo_ia).toHaveLength(1);
    expect(base.tablas.consumo_ia[0]).toMatchObject({ servicio: 'entrevistador', paso: 'cazador_v3', modelo: 'claude-opus-5-5', narrador_id: 'n1', input_tokens: 1000, output_tokens: 200 });
    const fila = await leerFila(base.cliente, 'n1');
    expect(fila?.estado.cazador?.registro.map((x) => x.bloque)).toEqual([1]);
    expect(fila?.estado.cazador?.gastoUsd).toBeCloseTo(1000 * 4e-6 + 200 * 20e-6);
  });

  it('el mismo bloque no se caza dos veces', async () => {
    const cliente = clienteQueContesta();
    const { deps } = await preparar(cliente);
    await cazarEnSegundoPlano(deps, 'n1', 1);
    expect(await cazarEnSegundoPlano(deps, 'n1', 1)).toBeNull();
    expect(cliente.messages.create).toHaveBeenCalledTimes(1);
  });

  it('si el modelo falla, no tira: el bloque queda sin repreguntas y la entrevista sigue', async () => {
    const cliente: ClienteModelo = { messages: { create: vi.fn(async () => { throw new Error('529 sobrecargado'); }) } };
    const { deps, base } = await preparar(cliente);
    const r = await cazarEnSegundoPlano(deps, 'n1', 1);
    expect(r).toMatchObject({ llamo: true, motivo: 'error' });
    expect((await leerFila(base.cliente, 'n1'))?.estado.repreguntas ?? []).toEqual([]);
  });

  it('lanzarCazador no espera; esperarCazas sí', async () => {
    const cliente = clienteQueContesta();
    const { deps, base } = await preparar(cliente);
    lanzarCazador(deps, 'n1', 1);
    await esperarCazas();
    expect((await leerFila(base.cliente, 'n1'))?.estado.cazador?.registro).toHaveLength(1);
  });

  it('el precio de Opus 5.5 es el de la fábrica (no el de Opus 5 por prefijo)', () => {
    expect(calcularUsd('claude-opus-5-5', { input_tokens: 1_000_000 })).toBe(4);
    expect(calcularUsd('claude-opus-5-5', { output_tokens: 1_000_000 })).toBe(20);
  });
});
```

- [ ] **Step 2: Correr y ver que falla**

Run: `cd entrevistador && npx vitest run test/v3/cazador.test.ts`
Expected: FAIL (`Failed to load url ../../src/v3/cazador.js`).

- [ ] **Step 3: El precio de Opus 5.5**

En `entrevistador/src/costos.ts`, dentro de `PRECIOS_USD_POR_MILLON` (líneas 20-24), agregar después de `'claude-opus-5'` (mismo valor que `fabrica/src/costos.ts:53`; sin esto, `precioDe` lo cobra como `claude-opus-5` por prefijo, 5/25 en vez de 4/20):

```ts
  'claude-opus-5-5': { input: 4, output: 20, cache_write: 5, cache_read: 0.2 },
```

- [ ] **Step 4: Implementar `cazador.ts`**

`entrevistador/src/v3/cazador.ts`:

```ts
// El cazador de escenas en WhatsApp (spec 2026-10-07, "El cazador"): cuando
// se cierra un cierre de bloque (CIn), `cazarBloque` del núcleo corre en
// segundo plano con Opus 5.5 y tope de USD 3 por entrevista. Nunca tira: si
// falla, ese bloque queda sin repreguntas y la entrevista sigue. Lo que trae se
// suma a la fila con compare-and-swap; si llega tarde, la repregunta sale en el
// turno siguiente. El costo va a `consumo_ia` (registrarUso).

import Anthropic from '@anthropic-ai/sdk';
import { cuentaDeEsteServicio, registrarUso } from '../costos.js';
import type { DepsV3 } from './deps.js';
import { conReintento, leerFila } from './estado.js';
import { MODELO_CAZADOR, type ClienteModelo, type ResultadoCaza } from './nucleo/entrevista/cazador.js';
import { fichaTexto } from './tipos.js';
import { cazarAlCerrar, sumarCaza } from './turno.js';

export function cazadorPrendido(): boolean {
  return process.env.V3_CAZADOR !== '0';
}

/** El SDK de Anthropic cumple la forma de ClienteModelo (la que usa el núcleo). */
export function clienteCazador(apiKey: string): ClienteModelo {
  return new Anthropic({ apiKey }) as unknown as ClienteModelo;
}

export async function cazarEnSegundoPlano(deps: DepsV3, narradorId: string, bloque: number): Promise<ResultadoCaza | null> {
  try {
    if (!deps.cazador) return null;
    const fila = await leerFila(deps.db, narradorId);
    if (!fila || fila.estado.cazador?.registro.some((x) => x.bloque === bloque)) return null;
    const r = await cazarAlCerrar(fila.estado, fichaTexto(fila), bloque, deps.cazador);
    if (r.tokens) {
      await registrarUso(deps.db, {
        servicio: 'entrevistador', paso: 'cazador_v3', modelo: MODELO_CAZADOR, proveedor: 'anthropic',
        cuenta: cuentaDeEsteServicio(), narradorId,
        uso: { input_tokens: r.tokens.entrada, output_tokens: r.tokens.salida },
      });
    }
    await conReintento(deps.db, narradorId, (f) =>
      f.estado.cazador?.registro.some((x) => x.bloque === bloque) ? null : { cambio: { estado: sumarCaza(f.estado, r) }, resultado: true });
    console.log(`cazador V3: ${narradorId}, bloque ${bloque}: ${r.repreguntas.length} repregunta(s) · USD ${r.costoUsd.toFixed(2)} · acumulado USD ${r.gastoUsd.toFixed(2)}${r.motivo ? ` (${r.motivo})` : ''}`);
    return r;
  } catch (err) {
    console.error(`cazador V3: falló el bloque ${bloque} de ${narradorId}:`, err instanceof Error ? err.message : err);
    return null;
  }
}

const EN_CURSO = new Set<Promise<unknown>>();

/** Lo lanza sin esperarlo (el narrador no espera al cazador). */
export function lanzarCazador(deps: DepsV3, narradorId: string, bloque: number): void {
  const promesa: Promise<unknown> = cazarEnSegundoPlano(deps, narradorId, bloque).finally(() => EN_CURSO.delete(promesa));
  EN_CURSO.add(promesa);
}

/** Para la simulación y los tests: espera a los cazadores que estén corriendo. */
export async function esperarCazas(): Promise<void> {
  await Promise.allSettled([...EN_CURSO]);
}
```

- [ ] **Step 5: Correr y ver que pasa; costos viejos; tipos**

Run: `cd entrevistador && npx vitest run test/v3/cazador.test.ts test/costos.test.ts && npx tsc --noEmit -p tsconfig.check.json`
Expected: PASS y sin errores.

- [ ] **Step 6: Commit**

```bash
git add entrevistador/src/v3/cazador.ts entrevistador/src/costos.ts entrevistador/test/v3/cazador.test.ts
git commit -m "entrevistador V3: el cazador en segundo plano, con su costo en consumo_ia y el precio de Opus 5.5

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 7: Botones de WhatsApp y la cola de salida (`drenar`)

**Files:**
- Modify: `entrevistador/src/whatsapp/enviar.ts:24-33` (`enviarPlantilla`) y agregar `enviarBotones` después
- Create: `entrevistador/src/v3/enviar.ts`
- Test: `entrevistador/test/enviar.test.ts` (agregar dos casos), `entrevistador/test/v3/enviar.test.ts`

**Interfaces:**
- Consumes: `tomarTurno`, `soltarTurno`, `conReintento` (Task 3); `quitarSalientes` (Task 4); `FilaV3`, `EstadoV3` (Task 2); `DepsV3` (Task 3); núcleo `Idioma`.
- Produces:
  - `whatsapp/enviar.ts`: `function enviarPlantilla(telefono: string, nombre: string, variables: string[], idioma?: string): Promise<string>` (default `'es'`: lo viejo no cambia); `function enviarBotones(telefono: string, texto: string, botones: string[]): Promise<string>`.
  - `v3/enviar.ts`:
    - `const VENTANA_MS = 24 * 3600_000 - 30 * 60_000`, `const LARGO_MAXIMO_BOTONES = 1024`, `const FALLOS_PARA_AVISAR = 3`
    - `type PlantillaV3 = { nombre: string; idiomaMeta: string }`; `const PLANTILLAS_V3: Readonly<Record<Idioma, { pregunta: PlantillaV3; recordatorio: PlantillaV3 }>>`
    - `function plantillaLista(idioma: Idioma, cual: 'pregunta' | 'recordatorio', env?: NodeJS.ProcessEnv): boolean`
    - `function ventanaAbierta(e: Pick<EstadoV3, 'ultimoEntranteAt'>, ahora: Date): boolean`
    - `function enLineaParaPlantilla(textos: string[]): string`
    - `type Envio = …` y `function elegirEnvio(fila: FilaV3, ahora: Date): Envio`
    - `type ResultadoDrenar = 'vacio' | 'enviado' | 'ocupado' | 'fallo' | 'sin-plantilla'`
    - `function drenar(deps: DepsV3, narradorId: string): Promise<ResultadoDrenar>`

Reglas:
- Dentro de la ventana de 24 h (desde `estado.ultimoEntranteAt`, con media hora de margen): sale el primer mensaje de la cola, con botones si tiene y si el texto entra en 1024 caracteres (límite del cuerpo de un mensaje interactivo de Meta; con el banco de hoy el más largo es de 863: si alguna vez se pasa, sale como texto sin botones y se puede contestar en audio); se saca de la cola y se sigue con el próximo.
- Fuera de la ventana: **un solo** mensaje de plantilla del idioma: `pregunta` con todo lo pendiente en una línea (Meta no acepta saltos de línea en una variable; los botones no van), o `recordatorio` si lo único pendiente es M8. Si la plantilla del idioma no está aprobada (`WA_PLANTILLAS_V3_LISTAS`), se avisa a los socios y **no se manda en otro idioma**: la cola queda hasta que el narrador escriba.
- Un envío que falla queda en la cola; a los 3 fallos seguidos, aviso a los socios (una vez hasta que vuelva a salir algo).
- Cada mensaje que sale queda en `envios` (`tipo = 'v3'`), para cruzarlo con los avisos de entrega.
- Si la entrevista terminó (`terminada`) y la cola quedó vacía: `narradores.estado = 'completado'` (solo si estaba `activo`). El mail "terminado" a la familia lo manda la fábrica al ver el estado (`fabrica/src/worker.ts:319`, `avisarHitosDeCierre`).

- [ ] **Step 1: Escribir los tests que fallan**

Agregar al final del `describe('enviar', …)` de `entrevistador/test/enviar.test.ts`:

```ts
  it('manda botones de respuesta rápida (interactive/button)', async () => {
    const { enviarBotones } = await import('../src/whatsapp/enviar.js');
    await enviarBotones('+5491155551234', '¿Tuviste hermanos?', ['Sí, tuve', 'No tuve hermanos']);
    const body = JSON.parse((fetch as any).mock.calls[0][1].body);
    expect(body.type).toBe('interactive');
    expect(body.interactive.type).toBe('button');
    expect(body.interactive.body.text).toBe('¿Tuviste hermanos?');
    expect(body.interactive.action.buttons).toEqual([
      { type: 'reply', reply: { id: 'b1', title: 'Sí, tuve' } },
      { type: 'reply', reply: { id: 'b2', title: 'No tuve hermanos' } },
    ]);
  });

  it('la plantilla va en el idioma que se le pide (por defecto, es)', async () => {
    const { enviarPlantilla } = await import('../src/whatsapp/enviar.js');
    await enviarPlantilla('+34600000000', 'pregunta_diaria_ca', ['Com era casa teva?'], 'ca');
    await enviarPlantilla('+5491155551234', 'recordatorio', ['Prueba']);
    expect(JSON.parse((fetch as any).mock.calls[0][1].body).template.language.code).toBe('ca');
    expect(JSON.parse((fetch as any).mock.calls[1][1].body).template.language.code).toBe('es');
  });
```

`entrevistador/test/v3/enviar.test.ts`:

```ts
import { describe, it, expect, afterEach } from 'vitest';
import { crearBaseFalsa } from './base-falsa.js';
import { depsDePrueba } from './deps-prueba.js';
import { crearFila, leerFila } from '../../src/v3/estado.js';
import { drenar, enLineaParaPlantilla, plantillaLista } from '../../src/v3/enviar.js';
import { encolar } from '../../src/v3/turno.js';
import { estadoInicial, type EstadoV3 } from '../../src/v3/tipos.js';
import type { Idioma } from '../../src/v3/nucleo/entrevista/idioma.js';

const AHORA = new Date('2026-10-08T13:00:00Z');
const HACE_1H = new Date(AHORA.getTime() - 3600_000).toISOString();
const HACE_25H = new Date(AHORA.getTime() - 25 * 3600_000).toISOString();

async function preparar(estado: EstadoV3, o: { idioma?: Idioma; enviando_hasta?: string } = {}) {
  const base = crearBaseFalsa({
    narradores: [{ id: 'n1', telefono_whatsapp: '+5491100000000', como_le_dicen: 'Prueba', estado: 'activo' }],
  });
  await crearFila(base.cliente, {
    narrador_id: 'n1', idioma: o.idioma ?? 'es-AR', ficha: { nombre: 'Prueba', genero: 'mujer' }, estado,
    ultimo_audio_at: null, tanda_dia: null, tanda_cuenta: 0, migrada_de: null,
  });
  if (o.enviando_hasta) base.tablas.entrevistas_v3[0].enviando_hasta = o.enviando_hasta;
  return { base, ...depsDePrueba(base, { ahora: AHORA }) };
}

const conCola = (ultimoEntranteAt: string, ...textos: { texto: string; botones?: string[]; tipo?: 'turno' | 'suelto' | 'recordatorio' }[]): EstadoV3 =>
  textos.reduce((e, t) => encolar(e, { tipo: t.tipo ?? 'turno', texto: t.texto, ...(t.botones ? { botones: t.botones } : {}) }), { ...estadoInicial(), ultimoEntranteAt });

afterEach(() => { delete process.env.WA_PLANTILLAS_V3_LISTAS; });

describe('drenar la cola de WhatsApp', () => {
  it('dentro de las 24 h: en orden, los botones en el que los tiene; anota en envios', async () => {
    const { deps, base, enviados } = await preparar(conCola(HACE_1H, { texto: 'Gracias, Prueba.\nEntrada' }, { texto: '¿Tuviste hermanos?', botones: ['Sí, tuve', 'No tuve hermanos'] }));
    expect(await drenar(deps, 'n1')).toBe('enviado');
    expect(enviados).toEqual([
      { a: '+5491100000000', tipo: 'texto', texto: 'Gracias, Prueba.\nEntrada' },
      { a: '+5491100000000', tipo: 'botones', texto: '¿Tuviste hermanos?', botones: ['Sí, tuve', 'No tuve hermanos'] },
    ]);
    const fila = await leerFila(base.cliente, 'n1');
    expect(fila?.estado.salientes).toEqual([]);
    expect(fila?.enviando_hasta).toBeNull();
    expect(base.tablas.envios.map((e) => e.tipo)).toEqual(['v3', 'v3']);
  });

  it('un texto de más de 1024 letras sale sin botones', async () => {
    const largo = 'x'.repeat(1100);
    const { deps, enviados } = await preparar(conCola(HACE_1H, { texto: largo, botones: ['Sí, tuve'] }));
    await drenar(deps, 'n1');
    expect(enviados[0]).toMatchObject({ tipo: 'texto', texto: largo });
  });

  it('fuera de las 24 h: una sola plantilla con todo en una línea', async () => {
    const { deps, enviados, base } = await preparar(conCola(HACE_25H, { texto: 'Gracias, Prueba.\nEntrada' }, { texto: '¿Tuviste\nhermanos?', botones: ['Sí, tuve'] }));
    expect(await drenar(deps, 'n1')).toBe('enviado');
    expect(enviados).toEqual([{ a: '+5491100000000', tipo: 'plantilla', plantilla: 'pregunta_diaria_vos', idiomaMeta: 'es', variables: ['Gracias, Prueba. Entrada ¿Tuviste hermanos?'] }]);
    expect((await leerFila(base.cliente, 'n1'))?.estado.salientes).toEqual([]);
  });

  it('fuera de las 24 h y sin la plantilla del idioma: avisa y no manda en otro idioma', async () => {
    const { deps, enviados, avisos, base } = await preparar(conCola(HACE_25H, { texto: 'Com era casa teva?' }), { idioma: 'ca' });
    expect(await drenar(deps, 'n1')).toBe('sin-plantilla');
    expect(enviados).toEqual([]);
    expect(avisos[0].clave).toBe('plantilla-ca-pregunta');
    expect((await leerFila(base.cliente, 'n1'))?.estado.salientes).toHaveLength(1);
  });

  it('con la plantilla catalana aprobada, sale en catalán', async () => {
    process.env.WA_PLANTILLAS_V3_LISTAS = 'ca:pregunta';
    const { deps, enviados } = await preparar(conCola(HACE_25H, { texto: 'Com era casa teva?' }), { idioma: 'ca' });
    await drenar(deps, 'n1');
    expect(enviados[0]).toMatchObject({ tipo: 'plantilla', plantilla: 'pregunta_diaria_ca', idiomaMeta: 'ca' });
  });

  it('M8 solo, fuera de las 24 h: la plantilla de recordatorio del idioma, si está aprobada', async () => {
    const m8 = conCola(HACE_25H, { texto: 'Hola, Prueba. Pasaron unos días…', tipo: 'recordatorio' });
    const sinAprobar = await preparar(m8);
    expect(await drenar(sinAprobar.deps, 'n1')).toBe('sin-plantilla');
    expect(sinAprobar.avisos[0].clave).toBe('plantilla-es-AR-recordatorio');
    process.env.WA_PLANTILLAS_V3_LISTAS = 'es-AR:recordatorio';
    const aprobada = await preparar(m8);
    await drenar(aprobada.deps, 'n1');
    expect(aprobada.enviados[0]).toMatchObject({ tipo: 'plantilla', plantilla: 'recordatorio_vos', idiomaMeta: 'es', variables: ['Prueba'] });
  });

  it('un envío que falla queda en la cola; a los 3 seguidos, aviso a los socios (una vez)', async () => {
    const { deps, base, avisos, fallar, enviados } = await preparar(conCola(HACE_1H, { texto: 'Hola' }));
    fallar(4);
    for (let i = 0; i < 4; i++) expect(await drenar(deps, 'n1')).toBe('fallo');
    expect(avisos.filter((a) => a.clave === 'envios-n1')).toHaveLength(1);
    expect((await leerFila(base.cliente, 'n1'))?.estado).toMatchObject({ fallosEnvio: 4, avisoFallos: true });
    expect(await drenar(deps, 'n1')).toBe('enviado');
    expect(enviados).toHaveLength(1);
    expect((await leerFila(base.cliente, 'n1'))?.estado).toMatchObject({ fallosEnvio: 0, avisoFallos: false, salientes: [] });
  });

  it('con la toma de otro proceso no manda nada', async () => {
    const { deps, enviados } = await preparar(conCola(HACE_1H, { texto: 'Hola' }), { enviando_hasta: new Date(AHORA.getTime() + 60_000).toISOString() });
    expect(await drenar(deps, 'n1')).toBe('ocupado');
    expect(enviados).toEqual([]);
  });

  it('terminada y con la cola vacía: el narrador queda completado', async () => {
    const { deps, base } = await preparar({ ...conCola(HACE_1H, { texto: 'FIN' }), terminada: true });
    await drenar(deps, 'n1');
    expect(base.tablas.narradores[0].estado).toBe('completado');
  });

  it('la línea de la plantilla no tiene saltos ni espacios de más', () => {
    expect(enLineaParaPlantilla(['a\n\nb', '  c   d '])).toBe('a b c d');
  });

  it('es-AR:pregunta está siempre; lo demás, solo si se aprobó', () => {
    expect(plantillaLista('es-AR', 'pregunta', {})).toBe(true);
    expect(plantillaLista('es-AR', 'recordatorio', {})).toBe(false);
    expect(plantillaLista('es-ES', 'pregunta', { WA_PLANTILLAS_V3_LISTAS: 'ca:pregunta, es-ES:pregunta' })).toBe(true);
  });
});
```

- [ ] **Step 2: Correr y ver que fallan**

Run: `cd entrevistador && npx vitest run test/enviar.test.ts test/v3/enviar.test.ts`
Expected: FAIL (`enviarBotones is not a function`; `Failed to load url ../../src/v3/enviar.js`).

- [ ] **Step 3: Botones y plantilla con idioma en `whatsapp/enviar.ts`**

Reemplazar `enviarPlantilla` (líneas 24-33) por:

```ts
/** `idioma`: el código de Meta de la plantilla aprobada ('es', 'es_ES', 'ca'). Lo viejo sigue en 'es'. */
export function enviarPlantilla(telefono: string, nombre: string, variables: string[], idioma = 'es') {
  return postMensaje({
    to: telefono,
    type: 'template',
    template: {
      name: nombre,
      language: { code: idioma },
      components: [{ type: 'body', parameters: variables.map((v) => ({ type: 'text', text: v })) }],
    },
  });
}

/**
 * Texto con botones de respuesta rápida (entrevista V3). Meta: hasta 3
 * botones, título de hasta 20 letras, cuerpo de hasta 1024. Lo que la persona
 * toca vuelve por el webhook como `interactive.button_reply` con el título.
 */
export function enviarBotones(telefono: string, texto: string, botones: string[]) {
  return postMensaje({
    to: telefono,
    type: 'interactive',
    interactive: {
      type: 'button',
      body: { text: texto },
      action: { buttons: botones.map((title, i) => ({ type: 'reply', reply: { id: `b${i + 1}`, title } })) },
    },
  });
}
```

- [ ] **Step 4: Implementar `v3/enviar.ts`**

`entrevistador/src/v3/enviar.ts`:

```ts
// Vacía la cola de WhatsApp de un narrador V3 (spec 2026-10-07, "Ventana de
// 24 h y plantillas" y "Errores"). Un solo proceso por vez (la toma); cada
// mensaje que sale se saca de la cola con compare-and-swap; uno que falla
// queda y el tick siguiente reintenta. Ningún texto se arma acá: salen de la
// cola, que llenó turno.ts con textos del banco.

import type { DepsV3 } from './deps.js';
import { conReintento, soltarTurno, tomarTurno } from './estado.js';
import type { Idioma } from './nucleo/entrevista/idioma.js';
import type { EstadoV3, FilaV3 } from './tipos.js';
import { quitarSalientes } from './turno.js';

/** La ventana de Meta es de 24 h desde el último mensaje del narrador; se deja media hora de margen. */
export const VENTANA_MS = 24 * 3600_000 - 30 * 60_000;
/** El cuerpo de un mensaje interactivo de Meta admite hasta 1024 caracteres. */
export const LARGO_MAXIMO_BOTONES = 1024;
export const FALLOS_PARA_AVISAR = 3;

export type PlantillaV3 = { nombre: string; idiomaMeta: string };

/**
 * Las plantillas de la V3 por idioma. `pregunta_diaria_vos` ya está aprobada
 * (PLANTILLAS.md). Las demás las carga Joaquín en Meta y se marcan como
 * aprobadas en WA_PLANTILLAS_V3_LISTAS. `recordatorio_vos`: la `recordatorio`
 * de hoy está en usted ("Cuando tenga un ratito, me la manda") y la V3 no usa
 * usted con nadie.
 */
export const PLANTILLAS_V3: Readonly<Record<Idioma, { pregunta: PlantillaV3; recordatorio: PlantillaV3 }>> = {
  'es-AR': { pregunta: { nombre: 'pregunta_diaria_vos', idiomaMeta: 'es' }, recordatorio: { nombre: 'recordatorio_vos', idiomaMeta: 'es' } },
  'es-ES': { pregunta: { nombre: 'pregunta_diaria_es_es', idiomaMeta: 'es_ES' }, recordatorio: { nombre: 'recordatorio_es_es', idiomaMeta: 'es_ES' } },
  ca: { pregunta: { nombre: 'pregunta_diaria_ca', idiomaMeta: 'ca' }, recordatorio: { nombre: 'recordatorio_ca', idiomaMeta: 'ca' } },
};

export function plantillaLista(idioma: Idioma, cual: 'pregunta' | 'recordatorio', env: NodeJS.ProcessEnv = process.env): boolean {
  if (idioma === 'es-AR' && cual === 'pregunta') return true;
  return (env.WA_PLANTILLAS_V3_LISTAS ?? '').split(',').map((s) => s.trim()).includes(`${idioma}:${cual}`);
}

export function ventanaAbierta(e: Pick<EstadoV3, 'ultimoEntranteAt'>, ahora: Date): boolean {
  return !!e.ultimoEntranteAt && ahora.getTime() - Date.parse(e.ultimoEntranteAt) < VENTANA_MS;
}

/** Meta no acepta saltos de línea ni más de 4 espacios seguidos en una variable. */
export function enLineaParaPlantilla(textos: string[]): string {
  return textos.join(' ').replace(/\s+/g, ' ').trim();
}

export type Envio =
  | { tipo: 'texto'; texto: string; ids: number[] }
  | { tipo: 'botones'; texto: string; botones: string[]; ids: number[] }
  | { tipo: 'plantilla'; nombre: string; idiomaMeta: string; variables: string[]; ids: number[] }
  | { tipo: 'sin-plantilla'; cual: 'pregunta' | 'recordatorio'; nombre: string };

/** Qué sale ahora de la cola (no vacía). Puro. */
export function elegirEnvio(fila: FilaV3, ahora: Date): Envio {
  const pendientes = fila.estado.salientes;
  if (ventanaAbierta(fila.estado, ahora)) {
    const s = pendientes[0];
    if (s.botones && s.botones.length > 0 && s.texto.length <= LARGO_MAXIMO_BOTONES) return { tipo: 'botones', texto: s.texto, botones: s.botones, ids: [s.id] };
    return { tipo: 'texto', texto: s.texto, ids: [s.id] };
  }
  const soloRecordatorio = pendientes.every((s) => s.tipo === 'recordatorio');
  const cual = soloRecordatorio ? 'recordatorio' : 'pregunta';
  const p = PLANTILLAS_V3[fila.idioma][cual];
  if (!plantillaLista(fila.idioma, cual)) return { tipo: 'sin-plantilla', cual, nombre: p.nombre };
  const variables = soloRecordatorio
    ? [fila.ficha.nombre]
    : [enLineaParaPlantilla(pendientes.filter((s) => s.tipo !== 'recordatorio').map((s) => s.texto))];
  return { tipo: 'plantilla', nombre: p.nombre, idiomaMeta: p.idiomaMeta, variables, ids: pendientes.map((s) => s.id) };
}

export type ResultadoDrenar = 'vacio' | 'enviado' | 'ocupado' | 'fallo' | 'sin-plantilla';

export async function drenar(deps: DepsV3, narradorId: string): Promise<ResultadoDrenar> {
  const tomada = await tomarTurno(deps.db, narradorId, deps.ahora());
  if (!tomada) return 'ocupado';
  try {
    const { data, error } = await deps.db.from('narradores').select('id,telefono_whatsapp').eq('id', narradorId).maybeSingle();
    if (error || !data) throw new Error(`drenar: no pude leer el narrador ${narradorId}: ${error?.message ?? 'no existe'}`);
    const telefono = (data as { telefono_whatsapp: string }).telefono_whatsapp;
    let fila = tomada;
    let resultado: ResultadoDrenar = 'vacio';
    while (fila.estado.salientes.length > 0) {
      const envio = elegirEnvio(fila, deps.ahora());
      if (envio.tipo === 'sin-plantilla') {
        await deps.avisar(
          `plantilla-${fila.idioma}-${envio.cual}`,
          `Falta la plantilla «${envio.nombre}» (${fila.idioma})`,
          `La entrevista V3 de ${narradorId} está fuera de la ventana de 24 h y la plantilla «${envio.nombre}» no figura como aprobada en WA_PLANTILLAS_V3_LISTAS. No se manda en otro idioma: el mensaje queda en la cola hasta que el narrador escriba o se apruebe la plantilla.`,
        );
        return 'sin-plantilla';
      }
      let waId: string;
      try {
        waId = envio.tipo === 'botones' ? await deps.wa.botones(telefono, envio.texto, envio.botones)
          : envio.tipo === 'texto' ? await deps.wa.texto(telefono, envio.texto)
          : await deps.wa.plantilla(telefono, envio.nombre, envio.idiomaMeta, envio.variables);
      } catch (err) {
        await anotarFallo(deps, narradorId, err);
        return 'fallo';
      }
      const { error: errorEnvio } = await deps.db.from('envios').insert({ narrador_id: narradorId, tipo: 'v3', pregunta_orden: null, wa_message_id: waId });
      if (errorEnvio) console.warn(`V3: no pude anotar el envío ${waId} de ${narradorId} en envios: ${errorEnvio.message}`);
      const r = await conReintento(deps.db, narradorId, (f) => ({
        cambio: { estado: { ...quitarSalientes(f.estado, envio.ids), fallosEnvio: 0, avisoFallos: false } },
        resultado: true,
      }));
      if (!r) return resultado;
      fila = r.fila;
      resultado = 'enviado';
    }
    if (fila.estado.terminada) await completar(deps, narradorId);
    return resultado;
  } finally {
    await soltarTurno(deps.db, narradorId);
  }
}

async function anotarFallo(deps: DepsV3, narradorId: string, err: unknown): Promise<void> {
  const detalle = err instanceof Error ? err.message : String(err);
  console.error(`V3: no salió un mensaje a ${narradorId}: ${detalle}`);
  const r = await conReintento(deps.db, narradorId, (f) => {
    const fallos = f.estado.fallosEnvio + 1;
    const avisar = fallos >= FALLOS_PARA_AVISAR && !f.estado.avisoFallos;
    return { cambio: { estado: { ...f.estado, fallosEnvio: fallos, avisoFallos: f.estado.avisoFallos === true || avisar } }, resultado: { fallos, avisar } };
  });
  if (r?.resultado.avisar) {
    await deps.avisar(`envios-${narradorId}`, 'WhatsApp no le llega a un narrador V3',
      `${r.resultado.fallos} envíos seguidos fallaron para ${narradorId}. Último error: ${detalle}. Se sigue reintentando cada minuto.`);
  }
}

/** FIN salió: `activo → completado` (la misma transición de siempre). */
async function completar(deps: DepsV3, narradorId: string): Promise<void> {
  const { error } = await deps.db.from('narradores').update({ estado: 'completado' }).eq('id', narradorId).eq('estado', 'activo');
  if (error) console.error(`V3: no pude dejar completado a ${narradorId}: ${error.message}`);
}
```

- [ ] **Step 5: Correr y ver que pasan; tipos**

Run: `cd entrevistador && npx vitest run test/enviar.test.ts test/v3/enviar.test.ts && npx tsc --noEmit -p tsconfig.check.json`
Expected: PASS y sin errores.

- [ ] **Step 6: Commit**

```bash
git add entrevistador/src/whatsapp/enviar.ts entrevistador/src/v3/enviar.ts entrevistador/test/enviar.test.ts entrevistador/test/v3/enviar.test.ts
git commit -m "entrevistador V3: botones de WhatsApp y la cola de salida, con plantilla por idioma y aviso a los 3 fallos

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 8: Las filas de `respuestas` y `fotos` de un narrador V3, el botón en el webhook y la transcripción por idioma

**Files:**
- Modify: `entrevistador/src/whatsapp/webhook.ts:5-12` (tipo) y `:48-49` (botón)
- Modify: `entrevistador/src/ia/transcribir.ts:28-35` (firma e idioma)
- Create: `entrevistador/src/flujo/fotos-texto.ts` (sale de `entrevistador/src/flujo/fotos.ts:21-30`)
- Modify: `entrevistador/src/flujo/fotos.ts:21-30`
- Create: `entrevistador/src/v3/filas.ts`
- Create: `entrevistador/src/v3/textos-fijos.json`, `entrevistador/src/v3/textos-fijos.ts`
- Test: `entrevistador/test/webhook.test.ts` (agregar un caso), `entrevistador/test/transcribir.test.ts` (agregar un caso), `entrevistador/test/v3/filas.test.ts`

**Interfaces:**
- Consumes: `DepsV3`, `Transcripcion` (Task 3); `pathDeAudio` (`whatsapp/media.ts`); núcleo `Idioma`.
- Produces:
  - `MensajeEntrante.esBoton?: true` (un botón de plantilla o interactivo; sigue llegando como `tipo: 'texto'`).
  - `function transcribir(audio: Buffer, prompt?: string, narradorId?: string, idioma?: string): Promise<{ texto: string; duracionSegundos: number }>` (default `'es'`).
  - `flujo/fotos-texto.ts`: `function extensionDe(mimeType: string | undefined): string`, `function epigrafeDe(caption: string | undefined): string | null` (re-exportados desde `fotos.ts`).
  - `filas.ts`: `function yaLlego(db: SupabaseClient, waMessageId: string): Promise<boolean>`, `function numeroDeLlegada(db, narradorId: string): Promise<number>`, `function guardarAudioV3(db, narradorId: string, llegada: number, audio: Buffer, waMessageId: string): Promise<{ id: string } | null>` (null = duplicado), `function guardarTextoV3(db, narradorId: string, llegada: number, texto: string, o: { waMessageId: string; clave: string | null; esBoton: boolean }): Promise<{ id: string } | null>`, `function anotarTranscripcion(db, respuestaId: string, t: Transcripcion): Promise<void>`, `function ponerClave(db, respuestaId: string, clave: string | null): Promise<void>`, `function marcarRespondido(db, narradorId: string, ahora: Date): Promise<void>`, `function guardarFotoV3(deps: DepsV3, narradorId: string, mediaId: string, mimeType: string | undefined, caption: string | undefined, llegada: number): Promise<string>`.
  - `textos-fijos.ts`: `type ClaveTextoFijo = 'fotoSuelta'`, `function textoFijo(clave: ClaveTextoFijo, idioma: Idioma): string | null`.

- [ ] **Step 1: Escribir los tests que fallan**

Agregar al final de `entrevistador/test/webhook.test.ts`, dentro de `describe('el botón de la plantilla', …)`:

```ts
  it('marca que fue un botón (la V3 distingue un toque de un texto escrito)', () => {
    expect(parsearEntrante(entrante({ type: 'interactive', interactive: { type: 'button_reply', button_reply: { id: 'b1', title: 'Sí, tuve' } } })))
      .toMatchObject({ tipo: 'texto', texto: 'Sí, tuve', esBoton: true });
    expect(parsearEntrante(entrante({ type: 'text', text: { body: 'Sí, tuve' } }))?.esBoton).toBeUndefined();
  });
```

Agregar al final del `describe('transcribir', …)` de `entrevistador/test/transcribir.test.ts`:

```ts
  it('transcribe en el idioma que se le pide (V3: catalán); sin idioma, castellano como siempre', async () => {
    const fetchFalso = vi.fn(async () => respuestaGptTranscribe('Bon dia', 3));
    vi.stubGlobal('fetch', fetchFalso);
    const { transcribir } = await import('../src/ia/transcribir.js');
    await transcribir(Buffer.from('audio-falso'), 'vocabulari', 'n1', 'ca');
    await transcribir(Buffer.from('audio-falso'));
    const idiomas = (fetchFalso as any).mock.calls
      .filter((c: any[]) => String(c[0]).includes('/audio/transcriptions'))
      .map((c: any[]) => (c[1].body as FormData).get('language'));
    expect(idiomas).toEqual(['ca', 'es']);
  });
```

`entrevistador/test/v3/filas.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { crearBaseFalsa } from './base-falsa.js';
import { depsDePrueba } from './deps-prueba.js';
import { anotarTranscripcion, guardarAudioV3, guardarFotoV3, guardarTextoV3, marcarRespondido, numeroDeLlegada, ponerClave, yaLlego } from '../../src/v3/filas.js';
import { textoFijo } from '../../src/v3/textos-fijos.js';

describe('las filas de un narrador V3', () => {
  it('el audio se guarda con su número de llegada y su wa_message_id; el reintento de Meta no suma otro', async () => {
    const base = crearBaseFalsa();
    expect(await numeroDeLlegada(base.cliente, 'n1')).toBe(1);
    const fila = await guardarAudioV3(base.cliente, 'n1', 1, Buffer.from('audio'), 'wamid.A');
    expect(fila).not.toBeNull();
    expect(base.tablas.respuestas[0]).toMatchObject({ narrador_id: 'n1', pregunta_orden: 1, audio_path: 'n1/dia_01.ogg', wa_message_id: 'wamid.A' });
    expect(await yaLlego(base.cliente, 'wamid.A')).toBe(true);
    expect(await guardarAudioV3(base.cliente, 'n1', 2, Buffer.from('audio'), 'wamid.A')).toBeNull();
    expect(base.tablas.respuestas).toHaveLength(1);
    expect([...base.archivos.keys()]).toEqual(['audios/n1/dia_01.ogg']); // el archivo del duplicado se borró
    expect(await numeroDeLlegada(base.cliente, 'n1')).toBe(2);
  });

  it('transcripción y clave V3 se anotan en la fila', async () => {
    const base = crearBaseFalsa();
    const { id } = (await guardarAudioV3(base.cliente, 'n1', 1, Buffer.from('audio'), 'wamid.B'))!;
    await anotarTranscripcion(base.cliente, id, { texto: 'Nací en un pueblo.', duracionSegundos: 12 });
    await ponerClave(base.cliente, id, 'OR1');
    expect(base.tablas.respuestas[0]).toMatchObject({ transcripcion: 'Nací en un pueblo.', duracion_segundos: 12, clave_v3: 'OR1' });
  });

  it('un botón se guarda como marca en texto_directo, sin transcripción', async () => {
    const base = crearBaseFalsa();
    await guardarTextoV3(base.cliente, 'n1', 3, '⟦botón:No tuve hermanos⟧', { waMessageId: 'wamid.C', clave: 'CA6', esBoton: true });
    expect(base.tablas.respuestas[0]).toMatchObject({ pregunta_orden: 3, texto_directo: '⟦botón:No tuve hermanos⟧', transcripcion: null, clave_v3: 'CA6' });
    expect(await guardarTextoV3(base.cliente, 'n1', 4, 'otro', { waMessageId: 'wamid.C', clave: 'CA6', esBoton: true })).toBeNull();
  });

  it('marcarRespondido apaga la alerta de silencio', async () => {
    const base = crearBaseFalsa({ narradores: [{ id: 'n1', alerta_silencio: true }] });
    await marcarRespondido(base.cliente, 'n1', new Date('2026-10-08T13:00:00Z'));
    expect(base.tablas.narradores[0]).toMatchObject({ alerta_silencio: false, ultima_respuesta_at: '2026-10-08T13:00:00.000Z' });
  });

  it('la foto va al storage y a fotos, sin capítulo y con su número de llegada', async () => {
    const base = crearBaseFalsa();
    const { deps } = depsDePrueba(base);
    const fotoId = await guardarFotoV3(deps, 'n1', 'media-foto', 'image/png', '  En la playa  ', 7);
    expect(base.tablas.fotos[0]).toMatchObject({ id: fotoId, narrador_id: 'n1', capitulo: null, pregunta_orden: 7, epigrafe: 'En la playa', principal: false, storage_path: `n1/fotos/${fotoId}.png` });
    expect(base.archivos.has(`audios/n1/fotos/${fotoId}.png`)).toBe(true);
  });

  it('los textos fijos salen de un solo lugar; lo que no está aprobado no existe', () => {
    expect(textoFijo('fotoSuelta', 'es-AR')).toBe('📷 Guardada. Si querés, contame qué pasaba ahí.');
    expect(textoFijo('fotoSuelta', 'ca')).toBeNull();
    expect(textoFijo('fotoSuelta', 'es-ES')).toBeNull();
  });
});
```

- [ ] **Step 2: Correr y ver que fallan**

Run: `cd entrevistador && npx vitest run test/webhook.test.ts test/transcribir.test.ts test/v3/filas.test.ts`
Expected: FAIL (`esBoton` undefined; `language` es `'es'`; `Failed to load url ../../src/v3/filas.js`).

- [ ] **Step 3: El botón en el webhook y el idioma en la transcripción**

En `entrevistador/src/whatsapp/webhook.ts`, en el tipo `MensajeEntrante` (líneas 5-12) agregar el campo:

```ts
  waMessageId: string;
  /** Vino de un botón (plantilla o interactivo). La V3 lo distingue de un texto escrito. */
  esBoton?: true;
```

y reemplazar la línea 49 (`if (apretado) return { ...base, tipo: 'texto', texto: apretado };`) por:

```ts
  if (apretado) return { ...base, tipo: 'texto', texto: apretado, esBoton: true };
```

En `entrevistador/src/ia/transcribir.ts`, cambiar la firma (línea 28-30) y la línea 35:

```ts
export async function transcribir(
  audio: Buffer, prompt?: string, narradorId?: string, idioma = 'es',
): Promise<{ texto: string; duracionSegundos: number }> {
```

```ts
  form.append('language', idioma);
```

(Agregar al comentario de arriba: `idioma`: el código de OpenAI; la V3 pasa `IDIOMA_OPENAI` del núcleo — `ca` para catalán. Sin él, castellano, como siempre.)

- [ ] **Step 4: `fotos-texto.ts`, `filas.ts` y los textos fijos**

`entrevistador/src/flujo/fotos-texto.ts` (las líneas 21-30 de `fotos.ts`, movidas tal cual):

```ts
// Lo puro de las fotos que llegan por WhatsApp. Vive aparte de fotos.ts (que
// importa la base) para que la V3 lo use sin arrastrarla.

/** La extensión según lo que dijo Meta. Todo lo que no reconocemos se guarda como jpg. */
export function extensionDe(mimeType: string | undefined): string {
  return mimeType === 'image/png' ? 'png' : mimeType === 'image/webp' ? 'webp' : 'jpg';
}

/** El epígrafe: lo que escribió abajo de la foto, recortado. Vacío = null. */
export function epigrafeDe(caption: string | undefined): string | null {
  return caption?.trim().slice(0, 300) || null;
}
```

En `entrevistador/src/flujo/fotos.ts`, reemplazar las líneas 21-30 (las dos funciones) por:

```ts
import { epigrafeDe, extensionDe } from './fotos-texto.js';
export { epigrafeDe, extensionDe };
```

(y mover ese `import` arriba con los demás).

`entrevistador/src/v3/filas.ts`:

```ts
// Las filas de `respuestas` y `fotos` de un narrador V3 (spec 2026-10-07,
// "Reglas para la fila de respuestas"): `pregunta_orden` = número de llegada,
// `wa_message_id` único (el reintento de Meta no suma dos veces), `clave_v3`
// la pregunta V3. La verdad de la entrevista está en entrevistas_v3.estado:
// estas filas son el registro (audio, transcripción) para el panel y la fábrica.

import { randomUUID } from 'node:crypto';
import type { SupabaseClient } from '@supabase/supabase-js';
import { epigrafeDe, extensionDe } from '../flujo/fotos-texto.js';
import { pathDeAudio } from '../whatsapp/media.js';
import type { DepsV3, Transcripcion } from './deps.js';

export async function yaLlego(db: SupabaseClient, waMessageId: string): Promise<boolean> {
  const { data, error } = await db.from('respuestas').select('id').eq('wa_message_id', waMessageId).limit(1);
  if (error) throw new Error(`No pude buscar el mensaje ${waMessageId}: ${error.message}`);
  return ((data as unknown[] | null) ?? []).length > 0;
}

export async function numeroDeLlegada(db: SupabaseClient, narradorId: string): Promise<number> {
  const { count, error } = await db.from('respuestas').select('id', { count: 'exact', head: true }).eq('narrador_id', narradorId);
  if (error) throw new Error(`No pude contar las respuestas de ${narradorId}: ${error.message}`);
  return (count ?? 0) + 1;
}

/** Sube el audio y anota la fila. Null si ese wa_message_id ya estaba (y se borra el archivo recién subido). */
export async function guardarAudioV3(db: SupabaseClient, narradorId: string, llegada: number, audio: Buffer, waMessageId: string): Promise<{ id: string } | null> {
  const { data: archivos } = await db.storage.from('audios').list(narradorId);
  const existentes = ((archivos as { name: string }[] | null) ?? []).map((a) => `${narradorId}/${a.name}`);
  const audioPath = pathDeAudio(narradorId, llegada, existentes);
  const subida = await db.storage.from('audios').upload(audioPath, audio, { contentType: 'audio/ogg' });
  if (subida.error) throw new Error(`Storage rechazó ${audioPath}: ${subida.error.message}`);
  const { data, error } = await db.from('respuestas')
    .insert({ narrador_id: narradorId, pregunta_orden: llegada, audio_path: audioPath, es_repregunta: false, wa_message_id: waMessageId })
    .select('id').single();
  if (error?.code === '23505') {
    await db.storage.from('audios').remove([audioPath]);
    return null;
  }
  if (error) throw new Error(`No pude anotar el audio de ${narradorId}: ${error.message}`);
  return { id: (data as { id: string }).id };
}

/** Un botón (la marca), un texto escrito o la foto de FO1. Null si ese wa_message_id ya estaba. */
export async function guardarTextoV3(
  db: SupabaseClient, narradorId: string, llegada: number, texto: string,
  o: { waMessageId: string; clave: string | null; esBoton: boolean },
): Promise<{ id: string } | null> {
  const { data, error } = await db.from('respuestas')
    .insert({
      narrador_id: narradorId, pregunta_orden: llegada, texto_directo: texto,
      transcripcion: o.esBoton ? null : texto, es_repregunta: false, wa_message_id: o.waMessageId, clave_v3: o.clave,
    })
    .select('id').single();
  if (error?.code === '23505') return null;
  if (error) throw new Error(`No pude anotar el mensaje de ${narradorId}: ${error.message}`);
  return { id: (data as { id: string }).id };
}

export async function anotarTranscripcion(db: SupabaseClient, respuestaId: string, t: Transcripcion): Promise<void> {
  const { error } = await db.from('respuestas').update({ transcripcion: t.texto, duracion_segundos: t.duracionSegundos }).eq('id', respuestaId);
  if (error) throw new Error(`No pude guardar la transcripción de ${respuestaId}: ${error.message}`);
}

export async function ponerClave(db: SupabaseClient, respuestaId: string, clave: string | null): Promise<void> {
  const { error } = await db.from('respuestas').update({ clave_v3: clave }).eq('id', respuestaId);
  if (error) console.warn(`V3: no pude anotar la clave ${clave} en la respuesta ${respuestaId}: ${error.message}`);
}

/** Lo mismo que hace el flujo viejo al recibir algo: la alerta de silencio se apaga. */
export async function marcarRespondido(db: SupabaseClient, narradorId: string, ahora: Date): Promise<void> {
  await db.from('narradores').update({ ultima_respuesta_at: ahora.toISOString(), alerta_silencio: false }).eq('id', narradorId);
}

/** Como guardarFoto de flujo/fotos.ts, con las dependencias de la V3: capítulo null (la acomoda la familia). */
export async function guardarFotoV3(
  deps: DepsV3, narradorId: string, mediaId: string, mimeType: string | undefined, caption: string | undefined, llegada: number,
): Promise<string> {
  const bytes = await deps.wa.descargar(mediaId);
  const id = randomUUID();
  const path = `${narradorId}/fotos/${id}.${extensionDe(mimeType)}`;
  const { error: errorSubida } = await deps.db.storage.from('audios').upload(path, bytes, { contentType: mimeType ?? 'image/jpeg', upsert: false });
  if (errorSubida) throw new Error(`No pude subir la foto de ${narradorId}: ${errorSubida.message}`);
  const { error } = await deps.db.from('fotos').insert({
    id, narrador_id: narradorId, capitulo: null, storage_path: path, pregunta_orden: llegada,
    epigrafe: epigrafeDe(caption), principal: false, subida_por: null,
  });
  if (error) {
    await deps.db.storage.from('audios').remove([path]);
    throw new Error(`No pude anotar la foto de ${narradorId}: ${error.message}`);
  }
  return id;
}
```

`entrevistador/src/v3/textos-fijos.json` (el único texto de narrador que no está en el banco; el de es-AR es el que ya manda hoy `textoFotoGuardada` en `flujo/fotos.ts`, "a revisar por Naza"; `ca` y `es-ES` faltan: ver "Textos para aprobar por Naza" al final):

```json
{
  "fotoSuelta": {
    "es-AR": "📷 Guardada. Si querés, contame qué pasaba ahí."
  }
}
```

`entrevistador/src/v3/textos-fijos.ts`:

```ts
// Los textos que el narrador V3 puede leer y que el banco no tiene. Lugar
// único: los aprueba Naza (spec 2026-10-07, "Textos fijos del entrevistador").
// Sin texto aprobado para un idioma, no se manda nada (nunca otro idioma).

import textos from './textos-fijos.json' with { type: 'json' };
import type { Idioma } from './nucleo/entrevista/idioma.js';

export type ClaveTextoFijo = 'fotoSuelta';

const TEXTOS = textos as unknown as Record<ClaveTextoFijo, Partial<Record<Idioma, string>>>;

export function textoFijo(clave: ClaveTextoFijo, idioma: Idioma): string | null {
  const t = TEXTOS[clave]?.[idioma];
  return typeof t === 'string' && t.trim() ? t : null;
}
```

- [ ] **Step 5: Correr y ver que pasan; fotos viejas; tipos**

Run: `cd entrevistador && npx vitest run test/webhook.test.ts test/transcribir.test.ts test/fotos.test.ts test/v3/filas.test.ts && npx tsc --noEmit -p tsconfig.check.json`
Expected: PASS y sin errores.

- [ ] **Step 6: Commit**

```bash
git add entrevistador/src/whatsapp/webhook.ts entrevistador/src/ia/transcribir.ts entrevistador/src/flujo/fotos-texto.ts entrevistador/src/flujo/fotos.ts entrevistador/src/v3/filas.ts entrevistador/src/v3/textos-fijos.json entrevistador/src/v3/textos-fijos.ts entrevistador/test/webhook.test.ts entrevistador/test/transcribir.test.ts entrevistador/test/v3/filas.test.ts
git commit -m "entrevistador V3: filas con número de llegada y sin duplicados, el botón en el webhook y la transcripción por idioma

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 9: Lo que llega de un narrador V3 (`entrante.ts`) y la bifurcación en `procesar.ts`

**Files:**
- Create: `entrevistador/src/v3/entrante.ts`
- Create: `entrevistador/src/v3/deps-reales.ts`
- Modify: `entrevistador/src/flujo/procesar.ts:1-25` (imports) y `:116-121` (después de buscar al narrador)
- Test: `entrevistador/test/v3/entrante.test.ts`, `entrevistador/test/v3/bifurcacion.test.ts`

**Interfaces:**
- Consumes: `leerFila`, `conReintento`, `esNarradorV3` (Task 3); `recibirAudio`, `tocarBoton`, `marcarFoto`, `cerrarYSeguir`, `reenviarAbierta`, `encolar`, `textoDelBanco` (Task 4); `puedeAbrirHoy`, `aplicarTanda`, `hitosDe` (Task 5); `ritmoDe` (`flujo/ritmo.ts`), `fechaLocal` (`flujo/tiempo.ts`); `lanzarCazador`, `clienteCazador`, `cazadorPrendido` (Task 6); `drenar` (Task 7); `yaLlego`, `numeroDeLlegada`, `guardarAudioV3`, `guardarTextoV3`, `anotarTranscripcion`, `ponerClave`, `marcarRespondido`, `guardarFotoV3`, `textoFijo` (Task 8); `MensajeEntrante` (webhook); `avisarSocios` (Task 5); `enviarTexto`, `enviarBotones`, `enviarPlantilla` (Task 7); `descargarAudio`; `transcribir` (Task 8); `mandarHito`; núcleo `respuestaDeBoton`, `promptDeTranscripcion`, `IDIOMA_OPENAI`.
- Produces:
  - `function procesarEntranteV3(deps: DepsV3, n: NarradorV3, m: MensajeEntrante): Promise<void>`
  - `function depsReales(): DepsV3`

Reglas (spec, "Al llegar un mensaje de un narrador V3"):
- Solo `activo` y `pausado`; lo demás se ignora (como hoy). Un `wa_message_id` que ya llegó se ignora.
- `pausado` + texto escrito: `pausado → activo` y se reenvía la pregunta abierta (sin M22). Con audio, botón o imagen: `pausado → activo` y se procesa como siempre.
- Audio: fila en `respuestas` (llegada, `wa_message_id`) → transcribir en su idioma (un reintento) → si falla o sale vacío, M23 → si no, se suma a la abierta (`ultimo_audio_at` = cuando se guardó la transcripción). No se contesta nada.
- Botón: se valida contra los de la abierta; "Sí" → M30; "No"/"Paso" → cierra y avanza en el momento, respetando el tope de la tanda; si cerró un CIn, cazador. Un botón que no es de la abierta se trata como texto.
- Texto escrito: M22, una vez por pregunta; no avanza ni entra a la respuesta (queda en `respuestas.texto_directo` como registro).
- Imagen: si la abierta es FO1 (clase `foto`), queda contestada con la marca `⟦foto⟧` y corre el reloj de silencio (para sumar el audio que la describe); si no, foto suelta: se guarda y, si hay texto aprobado para el idioma (`textos-fijos.json`), se le acusa.

- [ ] **Step 1: Escribir los tests que fallan**

`entrevistador/test/v3/entrante.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { crearBaseFalsa } from './base-falsa.js';
import { depsDePrueba } from './deps-prueba.js';
import { crearFila, leerFila } from '../../src/v3/estado.js';
import { procesarEntranteV3 } from '../../src/v3/entrante.js';
import { avanzar, textoDelBanco } from '../../src/v3/turno.js';
import { estadoInicial, MARCA_FOTO, type EstadoV3, type NarradorV3 } from '../../src/v3/tipos.js';
import type { MensajeEntrante } from '../../src/whatsapp/webhook.js';
import type { Idioma } from '../../src/v3/nucleo/entrevista/idioma.js';

const AHORA = new Date('2026-10-08T13:00:00Z');
const FICHA = { nombre: 'Prueba', genero: 'mujer' as const };
const narrador = (extra: Partial<NarradorV3> = {}): NarradorV3 => ({
  id: 'n1', familia_id: 'f1', como_le_dicen: 'Prueba', telefono_whatsapp: '+5491100000000', hora_preferida: '10:00:00',
  zona_horaria: 'America/Argentina/Buenos_Aires', contexto: { ritmo: 'diario' }, estado: 'activo', dia_actual: 0, ultima_respuesta_at: null, ...extra,
});
/** La entrevista con OR1 ya mandada (cola vacía) y la ventana abierta. */
const enOR1 = (): EstadoV3 => ({ ...avanzar(estadoInicial(), FICHA).estado, salientes: [], ultimoEntranteAt: AHORA.toISOString() });
let n = 0;
const audio = (texto: string, waMessageId = `wamid.${++n}`): MensajeEntrante => ({ telefono: '+5491100000000', tipo: 'audio', mediaId: texto, waMessageId });
const texto = (t: string, esBoton = false): MensajeEntrante => ({ telefono: '+5491100000000', tipo: 'texto', texto: t, waMessageId: `wamid.${++n}`, ...(esBoton ? { esBoton: true as const } : {}) });

async function preparar(estado: EstadoV3, o: { narrador?: Partial<NarradorV3>; idioma?: Idioma; tanda?: { dia: string; cuenta: number } } = {}) {
  const n1 = narrador(o.narrador);
  const base = crearBaseFalsa({ narradores: [{ ...n1 }] });
  await crearFila(base.cliente, {
    narrador_id: 'n1', idioma: o.idioma ?? 'es-AR', ficha: FICHA, estado, ultimo_audio_at: null,
    tanda_dia: o.tanda?.dia ?? '2026-10-08', tanda_cuenta: o.tanda?.cuenta ?? 1, migrada_de: null,
  });
  const p = depsDePrueba(base, { ahora: AHORA });
  return { base, n1, ...p, fila: () => leerFila(base.cliente, 'n1') };
}

describe('un audio de un narrador V3', () => {
  it('se transcribe y se suma a la abierta, sin contestar nada', async () => {
    const { deps, n1, base, enviados, fila } = await preparar(enOR1());
    await procesarEntranteV3(deps, n1, audio('Nací en un pueblo chico.'));
    await procesarEntranteV3(deps, n1, audio('Mi mamá cosía.'));
    const f = await fila();
    expect(f?.estado.borrador).toBe('Nací en un pueblo chico. Mi mamá cosía.');
    expect(f?.ultimo_audio_at).toBe(AHORA.toISOString());
    expect(enviados).toEqual([]);
    expect(base.tablas.respuestas.map((r) => [r.pregunta_orden, r.clave_v3, r.transcripcion])).toEqual([[1, 'OR1', 'Nací en un pueblo chico.'], [2, 'OR1', 'Mi mamá cosía.']]);
    expect(base.tablas.narradores[0].alerta_silencio).toBe(false);
  });

  it('el reintento de Meta (mismo wa_message_id) no se suma dos veces', async () => {
    const { deps, n1, fila, base } = await preparar(enOR1());
    await procesarEntranteV3(deps, n1, audio('Nací en un pueblo chico.', 'wamid.igual'));
    await procesarEntranteV3(deps, n1, audio('Nací en un pueblo chico.', 'wamid.igual'));
    expect((await fila())?.estado.borrador).toBe('Nací en un pueblo chico.');
    expect(base.tablas.respuestas).toHaveLength(1);
  });

  it('si la transcripción falla dos veces, o sale vacía: M23', async () => {
    const { deps, n1, enviados } = await preparar(enOR1());
    await procesarEntranteV3(deps, n1, audio('FALLA'));
    await procesarEntranteV3(deps, n1, audio('VACIO'));
    expect(enviados.map((e) => e.texto)).toEqual([textoDelBanco('M23', FICHA), textoDelBanco('M23', FICHA)]);
  });
});

describe('un botón de un narrador V3', () => {
  const enCA6 = (): EstadoV3 => ({ ...estadoInicial(), esperando: 'CA6', preguntaAbierta: { partes: [{ id: 'CA6', texto: '¿Hermanos?' }] }, ultimoEntranteAt: AHORA.toISOString() });

  it('"Sí" manda M30 solo y queda esperando el audio', async () => {
    const { deps, n1, enviados, fila, base } = await preparar(enCA6());
    await procesarEntranteV3(deps, n1, texto('Sí, tuve', true));
    expect(enviados).toEqual([{ a: '+5491100000000', tipo: 'texto', texto: textoDelBanco('M30', FICHA) }]);
    expect((await fila())?.estado).toMatchObject({ esperando: 'CA6', tocoSi: true });
    expect(base.tablas.respuestas[0]).toMatchObject({ texto_directo: '⟦botón:Sí, tuve⟧', clave_v3: 'CA6' });
  });

  it('"No" cierra y manda la siguiente en el momento; cuenta para la tanda', async () => {
    const { deps, n1, enviados, fila } = await preparar(enCA6(), { tanda: { dia: '2026-10-08', cuenta: 1 } });
    await procesarEntranteV3(deps, n1, texto('No tuve hermanos', true));
    const f = await fila();
    expect(f?.estado.respuestas).toEqual([['CA6', '⟦botón:No tuve hermanos⟧']]);
    expect(f?.estado.esperando).not.toBe('CA6');
    expect(f?.tanda_cuenta).toBe(2);
    expect(enviados.length).toBeGreaterThan(0);
  });

  it('"No" con la tanda en el tope: cierra y no manda nada hasta mañana', async () => {
    const { deps, n1, enviados, fila } = await preparar(enCA6(), { tanda: { dia: '2026-10-08', cuenta: 4 } });
    await procesarEntranteV3(deps, n1, texto('No tuve hermanos', true));
    expect(enviados).toEqual([]);
    const f = await fila();
    expect(f?.estado.esperando).toBeUndefined();
    expect(f?.estado.acuse?.familia).toBe('M25');
  });
});

describe('un texto escrito', () => {
  it('M22 una vez por pregunta; no entra a la respuesta', async () => {
    const { deps, n1, enviados, fila, base } = await preparar(enOR1());
    await procesarEntranteV3(deps, n1, texto('Hola, ¿cómo es esto?'));
    await procesarEntranteV3(deps, n1, texto('¿Hola?'));
    expect(enviados.map((e) => e.texto)).toEqual([textoDelBanco('M22', FICHA)]);
    expect((await fila())?.estado.borrador).toBeUndefined();
    expect(base.tablas.respuestas.map((r) => r.texto_directo)).toEqual(['Hola, ¿cómo es esto?', '¿Hola?']);
  });

  it('un botón que no es de la abierta es un texto escrito', async () => {
    const { deps, n1, enviados } = await preparar(enOR1());
    await procesarEntranteV3(deps, n1, texto('Sí, tuve', true));
    expect(enviados.map((e) => e.texto)).toEqual([textoDelBanco('M22', FICHA)]);
  });

  it('pausado: el texto lo reactiva y se le reenvía la pregunta abierta (sin M22)', async () => {
    const { deps, n1, enviados, base } = await preparar(enOR1(), { narrador: { estado: 'pausado' } });
    await procesarEntranteV3(deps, n1, texto('Hola, volví'));
    expect(base.tablas.narradores[0].estado).toBe('activo');
    expect(enviados).toHaveLength(1);
    expect(enviados[0].texto?.startsWith(avanzar(estadoInicial(), FICHA).estado.salientes[0].texto)).toBe(true);
  });

  it('completado: no se procesa nada', async () => {
    const { deps, n1, enviados, base } = await preparar(enOR1(), { narrador: { estado: 'completado' } });
    await procesarEntranteV3(deps, { ...n1, estado: 'completado' }, audio('Algo más.'));
    expect(enviados).toEqual([]);
    expect(base.tablas.respuestas ?? []).toHaveLength(0);
  });
});

describe('una imagen', () => {
  it('con FO1 abierta: la foto la contesta y corre el reloj de silencio', async () => {
    const { deps, n1, fila, base, enviados } = await preparar({ ...estadoInicial(), esperando: 'FO1', ultimoEntranteAt: AHORA.toISOString() });
    await procesarEntranteV3(deps, n1, { telefono: '+5491100000000', tipo: 'imagen', mediaId: 'img-1', mimeType: 'image/jpeg', waMessageId: 'wamid.foto' });
    const f = await fila();
    expect(f?.estado.borrador).toBe(MARCA_FOTO);
    expect(f?.ultimo_audio_at).toBe(AHORA.toISOString());
    expect(base.tablas.fotos).toHaveLength(1);
    expect(base.tablas.respuestas[0]).toMatchObject({ texto_directo: MARCA_FOTO, clave_v3: 'FO1', wa_message_id: 'wamid.foto' });
    expect(enviados).toEqual([]);
  });

  it('foto suelta en es-AR: se guarda y se acusa con el texto aprobado', async () => {
    const { deps, n1, base, enviados } = await preparar(enOR1());
    await procesarEntranteV3(deps, n1, { telefono: '+5491100000000', tipo: 'imagen', mediaId: 'img-2', waMessageId: 'wamid.suelta' });
    expect(base.tablas.fotos).toHaveLength(1);
    expect(enviados.map((e) => e.texto)).toEqual(['📷 Guardada. Si querés, contame qué pasaba ahí.']);
  });

  it('foto suelta en catalán: se guarda y no se manda nada (falta el texto aprobado)', async () => {
    const { deps, n1, base, enviados } = await preparar({ ...enOR1() }, { idioma: 'ca' });
    await procesarEntranteV3(deps, n1, { telefono: '+5491100000000', tipo: 'imagen', mediaId: 'img-3', waMessageId: 'wamid.ca' });
    expect(base.tablas.fotos).toHaveLength(1);
    expect(enviados).toEqual([]);
  });
});
```

(En "No con la tanda en el tope", el acuse de un "No" con botón en una pregunta de historia es `M25`: `interpretar` da `'no'` y `mensajesDespues` devuelve `['M25']`.)

`entrevistador/test/v3/bifurcacion.test.ts` (que `procesar.ts` mande a la V3 solo a quien tiene fila, y que sin fila —o sin la migración— todo siga igual):

```ts
import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { MensajeEntrante } from '../../src/whatsapp/webhook.js';

vi.stubEnv('SUPABASE_URL', 'https://x.supabase.co');
vi.stubEnv('SUPABASE_SERVICE_ROLE_KEY', 'clave');
vi.stubEnv('ANTHROPIC_API_KEY', 'clave');
vi.stubEnv('OPENAI_API_KEY', 'clave');
vi.stubEnv('WA_TOKEN', 'token');
vi.stubEnv('WA_PHONE_NUMBER_ID', '999');
vi.stubEnv('WA_VERIFY_TOKEN', 'v');

const h = vi.hoisted(() => ({ base: null as any, procesarEntranteV3: vi.fn(), enviarTexto: vi.fn(async () => 'wamid.t') }));

vi.mock('../../src/db/cliente.js', async () => {
  const { crearBaseFalsa } = await import('./base-falsa.js');
  h.base = crearBaseFalsa();
  return { db: h.base.cliente };
});
vi.mock('../../src/v3/entrante.js', () => ({ procesarEntranteV3: h.procesarEntranteV3 }));
vi.mock('../../src/v3/deps-reales.js', () => ({ depsReales: () => ({ falsas: true }) }));
vi.mock('../../src/whatsapp/enviar.js', () => ({ enviarTexto: h.enviarTexto, enviarPlantilla: vi.fn(), enviarBotones: vi.fn(), enviarAudioPorLink: vi.fn(), enviarImagenPorLink: vi.fn() }));

const { procesarEntrante } = await import('../../src/flujo/procesar.js');

const NARRADOR = { id: 'n1', familia_id: 'f1', como_le_dicen: 'Prueba', telefono_whatsapp: '+5491100000000', hora_preferida: '10:00:00', zona_horaria: 'America/Argentina/Buenos_Aires', contexto: { trato: 'vos' }, dia_actual: 3, ultima_respuesta_at: null, alerta_silencio: false };
const m = (tipo: MensajeEntrante['tipo']): MensajeEntrante => ({ telefono: '+5491100000000', tipo, waMessageId: 'wamid.1', ...(tipo === 'texto' ? { texto: 'hola' } : { mediaId: 'media' }) });

beforeEach(() => {
  h.base.tablas = { narradores: [], entrevistas_v3: [] };
  h.base.ausentes.clear();
  h.procesarEntranteV3.mockReset();
  h.enviarTexto.mockClear();
});

describe('la bifurcación V3 en procesar.ts', () => {
  it('un narrador activo con fila V3 va a la V3 (antes de las fotos, del texto y de la evaluación)', async () => {
    h.base.tablas.narradores = [{ ...NARRADOR, estado: 'activo' }];
    h.base.tablas.entrevistas_v3 = [{ narrador_id: 'n1', version: 0 }];
    await procesarEntrante(m('audio'));
    await procesarEntrante(m('imagen'));
    expect(h.procesarEntranteV3).toHaveBeenCalledTimes(2);
    expect(h.procesarEntranteV3.mock.calls[0][1]).toMatchObject({ id: 'n1' });
  });

  it('sin fila V3, el pausado sigue por el flujo viejo (reactivar)', async () => {
    h.base.tablas.narradores = [{ ...NARRADOR, estado: 'pausado' }];
    await procesarEntrante(m('texto'));
    expect(h.procesarEntranteV3).not.toHaveBeenCalled();
    expect(h.enviarTexto).toHaveBeenCalledTimes(1);
    expect(h.base.tablas.narradores[0].estado).toBe('activo');
  });

  it('sin la migración aplicada, igual: flujo viejo', async () => {
    h.base.ausentes.add('entrevistas_v3');
    h.base.tablas.narradores = [{ ...NARRADOR, estado: 'pausado' }];
    await procesarEntrante(m('texto'));
    expect(h.procesarEntranteV3).not.toHaveBeenCalled();
    expect(h.enviarTexto).toHaveBeenCalledTimes(1);
  });

  it('un invitado con fila V3 (no debería pasar) sigue por el consentimiento viejo', async () => {
    h.base.tablas.narradores = [{ ...NARRADOR, estado: 'invitado' }];
    h.base.tablas.entrevistas_v3 = [{ narrador_id: 'n1', version: 0 }];
    await procesarEntrante({ ...m('texto'), texto: 'nada que ver' });
    expect(h.procesarEntranteV3).not.toHaveBeenCalled();
  });
});
```

- [ ] **Step 2: Correr y ver que fallan**

Run: `cd entrevistador && npx vitest run test/v3/entrante.test.ts test/v3/bifurcacion.test.ts`
Expected: FAIL (`Failed to load url ../../src/v3/entrante.js`; en la bifurcación, `procesarEntranteV3` no se llama).

- [ ] **Step 3: Implementar `entrante.ts`**

`entrevistador/src/v3/entrante.ts`:

```ts
// Lo que llega de un narrador V3 (spec 2026-10-07, "Al llegar un mensaje de un
// narrador V3"). Se entra desde procesar.ts, antes de las fotos de la familia,
// de manejarTexto (que llama a un modelo) y de la evaluación con Opus: la V3
// no usa modelos durante la entrevista (salvo el cazador, en segundo plano).

import { ritmoDe } from '../flujo/ritmo.js';
import { fechaLocal } from '../flujo/tiempo.js';
import type { MensajeEntrante } from '../whatsapp/webhook.js';
import { lanzarCazador } from './cazador.js';
import type { DepsV3, Transcripcion } from './deps.js';
import { drenar } from './enviar.js';
import { conReintento, leerFila } from './estado.js';
import { anotarTranscripcion, guardarAudioV3, guardarFotoV3, guardarTextoV3, marcarRespondido, numeroDeLlegada, ponerClave, yaLlego } from './filas.js';
import { respuestaDeBoton } from './nucleo/entrevista/respuesta.js';
import { aplicarTanda, hitosDe, puedeAbrirHoy } from './tanda.js';
import { textoFijo } from './textos-fijos.js';
import { fichaTexto, MARCA_FOTO, type NarradorV3 } from './tipos.js';
import { cerrarYSeguir, encolar, marcarFoto, recibirAudio, reenviarAbierta, textoDelBanco, tocarBoton } from './turno.js';

export async function procesarEntranteV3(deps: DepsV3, n: NarradorV3, m: MensajeEntrante): Promise<void> {
  if (n.estado !== 'activo' && n.estado !== 'pausado') {
    console.warn(`V3: entrante de ${n.id} en estado '${n.estado}': se ignora`);
    return;
  }
  if (await yaLlego(deps.db, m.waMessageId)) return; // el reintento de Meta
  const ahora = deps.ahora();
  if (n.estado === 'pausado') {
    await deps.db.from('narradores').update({ estado: 'activo' }).eq('id', n.id).eq('estado', 'pausado');
    if (m.tipo === 'texto' && !m.esBoton) {
      await conReintento(deps.db, n.id, (f) => ({ cambio: { estado: { ...reenviarAbierta(f.estado), ultimoEntranteAt: ahora.toISOString() } }, resultado: true }));
      await marcarRespondido(deps.db, n.id, ahora);
      await drenar(deps, n.id);
      return;
    }
  }
  if (m.tipo === 'imagen') return recibirImagen(deps, n, m, ahora);
  if (m.tipo === 'audio') return recibirAudioV3(deps, n, m, ahora);
  if (m.esBoton && (await recibirBoton(deps, n, m, ahora))) return;
  return recibirTexto(deps, n, m, ahora);
}

async function recibirAudioV3(deps: DepsV3, n: NarradorV3, m: MensajeEntrante, ahora: Date): Promise<void> {
  const fila = await leerFila(deps.db, n.id);
  if (!fila || !m.mediaId) return;
  const audio = await deps.wa.descargar(m.mediaId);
  const guardada = await guardarAudioV3(deps.db, n.id, await numeroDeLlegada(deps.db, n.id), audio, m.waMessageId);
  if (!guardada) return; // duplicado
  let t: Transcripcion | null = null;
  for (let intento = 0; intento < 2 && !t; intento++) {
    try {
      t = await deps.transcribir(audio, { nombre: fila.ficha.nombre, idioma: fila.idioma, narradorId: n.id });
    } catch (err) {
      console.error(`V3: falló la transcripción de ${n.id} (intento ${intento + 1}):`, err instanceof Error ? err.message : err);
    }
  }
  const iso = ahora.toISOString();
  if (!t || !t.texto.trim()) {
    // Audio cortado, vacío o que no se pudo transcribir: M23 (se lo pide de nuevo).
    await conReintento(deps.db, n.id, (f) => ({
      cambio: { estado: { ...encolar(f.estado, { texto: textoDelBanco('M23', fichaTexto(f)), tipo: 'suelto' }), ultimoEntranteAt: iso } },
      resultado: true,
    }));
    await drenar(deps, n.id);
    return;
  }
  await anotarTranscripcion(deps.db, guardada.id, t);
  const texto = t.texto;
  const r = await conReintento(deps.db, n.id, (f) => {
    const a = recibirAudio(f.estado, texto);
    return {
      cambio: { estado: { ...a.estado, ultimoEntranteAt: iso }, ...(a.abierta ? { ultimo_audio_at: deps.ahora().toISOString() } : {}) },
      resultado: a.clave,
    };
  });
  await ponerClave(deps.db, guardada.id, r?.resultado ?? null);
  await marcarRespondido(deps.db, n.id, ahora);
}

/** True si era un botón de la abierta (y se procesó); false si hay que tratarlo como texto. */
async function recibirBoton(deps: DepsV3, n: NarradorV3, m: MensajeEntrante, ahora: Date): Promise<boolean> {
  const fila = await leerFila(deps.db, n.id);
  const boton = m.texto ?? '';
  if (!fila || !tocarBoton(fila.estado, fichaTexto(fila), boton)) return false;
  const guardada = await guardarTextoV3(deps.db, n.id, await numeroDeLlegada(deps.db, n.id), respuestaDeBoton(boton), { waMessageId: m.waMessageId, clave: fila.estado.esperando ?? null, esBoton: true });
  if (!guardada) return true; // duplicado
  const hoy = fechaLocal(ahora, n.zona_horaria);
  const ritmo = ritmoDe(n.contexto);
  const iso = ahora.toISOString();
  const r = await conReintento(deps.db, n.id, (f) => {
    const ficha = fichaTexto(f);
    const t = tocarBoton(f.estado, ficha, boton);
    if (!t) return null;
    const conEntrante = { ...t.estado, ultimoEntranteAt: iso };
    if (!t.cerrar) return { cambio: { estado: conEntrante }, resultado: { bloqueCerrado: undefined as number | undefined, cerro: false } };
    const s = cerrarYSeguir(conEntrante, ficha, puedeAbrirHoy(f, ritmo, hoy));
    const tanda = aplicarTanda(f, s.estado, hoy, s.abrio, ahora);
    return {
      cambio: { estado: tanda.estado, ultimo_audio_at: null, tanda_dia: tanda.tanda_dia, tanda_cuenta: tanda.tanda_cuenta },
      resultado: { bloqueCerrado: s.bloqueCerrado, cerro: true },
    };
  });
  await marcarRespondido(deps.db, n.id, ahora);
  await drenar(deps, n.id);
  if (r?.resultado.bloqueCerrado !== undefined) lanzarCazador(deps, n.id, r.resultado.bloqueCerrado);
  if (r?.resultado.cerro) for (const hito of hitosDe(r.fila.estado)) await deps.hito(n.id, hito);
  return true;
}

/** Texto escrito: M22 (una vez por pregunta). No avanza ni entra a la respuesta (spec: "Texto suelto → M22"). */
async function recibirTexto(deps: DepsV3, n: NarradorV3, m: MensajeEntrante, ahora: Date): Promise<void> {
  const fila = await leerFila(deps.db, n.id);
  if (!fila) return;
  const guardada = await guardarTextoV3(deps.db, n.id, await numeroDeLlegada(deps.db, n.id), m.texto ?? '', { waMessageId: m.waMessageId, clave: fila.estado.esperando ?? null, esBoton: false });
  if (!guardada) return;
  const iso = ahora.toISOString();
  await conReintento(deps.db, n.id, (f) => {
    const donde = f.estado.esperando ?? '';
    const conEntrante = { ...f.estado, ultimoEntranteAt: iso };
    if (f.estado.m22En === donde) return { cambio: { estado: conEntrante }, resultado: false };
    const conM22 = encolar(conEntrante, { texto: textoDelBanco('M22', fichaTexto(f)), tipo: 'suelto' });
    return { cambio: { estado: { ...conM22, m22En: donde } }, resultado: true };
  });
  await marcarRespondido(deps.db, n.id, ahora);
  await drenar(deps, n.id);
}

async function recibirImagen(deps: DepsV3, n: NarradorV3, m: MensajeEntrante, ahora: Date): Promise<void> {
  const fila = await leerFila(deps.db, n.id);
  if (!fila || !m.mediaId) return;
  const llegada = await numeroDeLlegada(deps.db, n.id);
  await guardarFotoV3(deps, n.id, m.mediaId, m.mimeType, m.texto, llegada);
  const iso = ahora.toISOString();
  if (marcarFoto(fila.estado)) {
    // FO1: la foto la contesta; el audio que la describe se suma (corre el reloj de silencio).
    const guardada = await guardarTextoV3(deps.db, n.id, llegada, MARCA_FOTO, { waMessageId: m.waMessageId, clave: fila.estado.esperando ?? null, esBoton: false });
    if (!guardada) return;
    await conReintento(deps.db, n.id, (f) => {
      const r = marcarFoto(f.estado);
      return r ? { cambio: { estado: { ...r.estado, ultimoEntranteAt: iso }, ultimo_audio_at: deps.ahora().toISOString() }, resultado: true } : null;
    });
  } else {
    // Foto suelta: se guarda como foto de la familia, igual que hoy; el acuse solo si hay texto aprobado en su idioma.
    const acuse = textoFijo('fotoSuelta', fila.idioma);
    await conReintento(deps.db, n.id, (f) => {
      const e = { ...f.estado, ultimoEntranteAt: iso };
      return { cambio: { estado: acuse ? encolar(e, { texto: acuse, tipo: 'suelto' }) : e }, resultado: true };
    });
    await drenar(deps, n.id);
  }
  await marcarRespondido(deps.db, n.id, ahora);
}
```

- [ ] **Step 4: Las dependencias de verdad**

`entrevistador/src/v3/deps-reales.ts`:

```ts
// Las dependencias de verdad de la V3: la base, WhatsApp de Meta, la
// transcripción de OpenAI en el idioma del narrador, los avisos por mail, los
// mails de hito y el cazador (si está prendido). Importa db/cliente.ts: solo
// se carga cuando hay un narrador V3 (import dinámico desde procesar.ts y
// scheduler.ts), así el flujo viejo no cambia.

import { cargarConfig } from '../config.js';
import { db } from '../db/cliente.js';
import { transcribir } from '../ia/transcribir.js';
import { mandarHito } from '../mail/hitos.js';
import { enviarBotones, enviarPlantilla, enviarTexto } from '../whatsapp/enviar.js';
import { descargarAudio } from '../whatsapp/media.js';
import { avisarSocios } from './avisos.js';
import { cazadorPrendido, clienteCazador } from './cazador.js';
import type { DepsV3 } from './deps.js';
import { IDIOMA_OPENAI, promptDeTranscripcion } from './nucleo/entrevista/transcribir.js';

export function depsReales(): DepsV3 {
  return {
    db,
    wa: {
      texto: enviarTexto,
      botones: enviarBotones,
      plantilla: (telefono, nombre, idiomaMeta, variables) => enviarPlantilla(telefono, nombre, variables, idiomaMeta),
      descargar: descargarAudio,
    },
    transcribir: (audio, o) => transcribir(audio, promptDeTranscripcion(o.nombre, o.idioma), o.narradorId, IDIOMA_OPENAI[o.idioma]),
    avisar: async (clave, asunto, detalle) => { await avisarSocios(clave, asunto, detalle); },
    hito: async (narradorId, hito) => {
      const { data } = await db.from('narradores').select('id,nombre,como_le_dicen,familia_id,contexto').eq('id', narradorId).maybeSingle();
      if (data) await mandarHito(data as { id: string; nombre?: string; como_le_dicen: string; familia_id: string; contexto: Record<string, any> }, hito);
    },
    cazador: cazadorPrendido() ? clienteCazador(cargarConfig().anthropicKey) : null,
    ahora: () => new Date(),
  };
}
```

- [ ] **Step 5: La bifurcación en `procesar.ts`**

En `entrevistador/src/flujo/procesar.ts`, agregar a los imports (líneas 1-25):

```ts
import { esNarradorV3 } from '../v3/estado.js';
```

y en `procesarEntrante`, inmediatamente después del bloque `if (!narrador) { … return; }` (línea 121) y **antes** del bloque de la imagen:

```ts
  // Entrevista V3 (spec 2026-10-07): un narrador con fila en entrevistas_v3 va
  // entero por la V3, antes de las fotos de la familia, de manejarTexto (que
  // llama a un modelo) y de la evaluación con Opus. Sin fila —o sin la
  // migración aplicada— sigue exactamente como hoy. Los imports son dinámicos
  // para no cargar nada de la V3 si nadie la usa.
  if ((narrador.estado === 'activo' || narrador.estado === 'pausado') && (await esNarradorV3(db, narrador.id))) {
    const { procesarEntranteV3 } = await import('../v3/entrante.js');
    const { depsReales } = await import('../v3/deps-reales.js');
    await procesarEntranteV3(depsReales(), narrador, m);
    return;
  }
```

- [ ] **Step 6: Correr y ver que pasan; todo el entrevistador; tipos**

Run: `cd entrevistador && npx vitest run test/v3/entrante.test.ts test/v3/bifurcacion.test.ts && npx vitest run && npx tsc --noEmit -p tsconfig.check.json`
Expected: PASS (incluido `test/procesar.test.ts`: su base falsa devuelve `data: null` para `entrevistas_v3`, o sea "sin fila") y sin errores.

- [ ] **Step 7: Commit**

```bash
git add entrevistador/src/v3/entrante.ts entrevistador/src/v3/deps-reales.ts entrevistador/src/flujo/procesar.ts entrevistador/test/v3/entrante.test.ts entrevistador/test/v3/bifurcacion.test.ts
git commit -m "entrevistador V3: audio, botón, texto e imagen de un narrador V3, y la bifurcación en procesar.ts

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 10: El reloj de 1 minuto (`reloj.ts`) y el scheduler

**Files:**
- Create: `entrevistador/src/v3/reloj.ts`
- Modify: `entrevistador/src/flujo/scheduler.ts:1-8` (imports), `:166-182` (`enviarPreguntasDelDia`), `:185-203` (`enviarRecordatorios`), `:245-259` (`iniciarScheduler`)
- Test: `entrevistador/test/v3/reloj.test.ts`; `entrevistador/test/scheduler.test.ts` (base falsa: `entrevistas_v3`; un caso nuevo)

**Interfaces:**
- Consumes: `listarFilas`, `conReintento`, `tomaVigente`, `narradoresV3` (Task 3); `avanzar`, `cerrarYSeguir`, `reenviarAbierta`, `encolar`, `textoDelBanco` (Task 4); `puedeAbrirHoy`, `aplicarTanda`, `yaEsLaHora`, `hitosDe` (Task 5); `lanzarCazador` (Task 6); `drenar` (Task 7); `depsReales` (Task 9); `ritmoDe`, `fechaLocal`.
- Produces:
  - `const SILENCIO_MS = 180_000`, `const HORAS_M8 = 6`
  - `function silencioCumplido(f: FilaV3, ahora: Date): boolean`
  - `function tocaTanda(f: FilaV3, n: NarradorV3, ahora: Date, hoy: string): boolean`
  - `function tocaM8(f: FilaV3, ahora: Date, hoy: string): boolean`
  - `type Trabajo = 'nada' | 'drenar' | 'cierre' | 'tanda' | 'm8'`
  - `function trabajarNarrador(deps: DepsV3, fila: FilaV3, n: NarradorV3): Promise<Trabajo>`
  - `function tickV3(deps: DepsV3): Promise<void>`
  - `scheduler.ts`: `function iniciarRelojV3(): ScheduledTask` (cron `* * * * *`), llamado desde `iniciarScheduler`.

Reglas (spec, "El reloj"), en este orden por narrador `activo` y sin toma vigente:
1. Si hay cola pendiente, se drena (y nada más ese minuto).
2. **Cierre por silencio:** hay borrador y `ultimo_audio_at` tiene 3' o más → `cerrarYSeguir` con `puedeAbrir = puedeAbrirHoy(…)`; si cerró un CIn, cazador; hitos de mail.
3. **Tanda diaria:** no terminó, la tanda no es de hoy, ya es su `hora_preferida` en su zona, y no está mandando audios (sin borrador) → si hay pregunta abierta sin contestar, se reenvía esa; si no, `avanzar` (con el acuse pendiente pegado arriba). `tanda_cuenta = 1`, `tandaInicioAt = ahora`. Fuera de las 24 h, la cola sale con la plantilla del idioma (`drenar`).
4. **M8:** la tanda es de hoy, salió una sola pregunta, sigue abierta sin nada contado, pasaron 6 h desde `tandaInicioAt` y hoy no salió M8 → M8 (tipo `recordatorio`).
La alerta de silencio a la familia (3 días) sigue en la fase vieja, sin cambios: usa `ultima_respuesta_at`, que la V3 también actualiza.

- [ ] **Step 1: Escribir los tests que fallan**

`entrevistador/test/v3/reloj.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { crearBaseFalsa } from './base-falsa.js';
import { depsDePrueba } from './deps-prueba.js';
import { crearFila, leerFila } from '../../src/v3/estado.js';
import { tickV3, trabajarNarrador } from '../../src/v3/reloj.js';
import { avanzar, cerrarYSeguir, encolar, recibirAudio, textoDelBanco } from '../../src/v3/turno.js';
import { estadoInicial, type EstadoV3, type FilaV3, type NarradorV3 } from '../../src/v3/tipos.js';

const FICHA = { nombre: 'Prueba', genero: 'mujer' as const };
const AHORA = new Date('2026-10-08T13:05:00Z'); // 10:05 en Buenos Aires
const HOY = '2026-10-08';
const AYER = '2026-10-07';
const hace = (ms: number) => new Date(AHORA.getTime() - ms).toISOString();
const MIN = 60_000;
const HORA = 3600_000;

const narrador = (extra: Partial<NarradorV3> = {}): NarradorV3 => ({
  id: 'n1', familia_id: 'f1', como_le_dicen: 'Prueba', telefono_whatsapp: '+5491100000000', hora_preferida: '10:00:00',
  zona_horaria: 'America/Argentina/Buenos_Aires', contexto: { ritmo: 'diario' }, estado: 'activo', dia_actual: 0, ultima_respuesta_at: null, ...extra,
});
/** OR1 mandada, cola vacía, ventana abierta. */
const enOR1 = (): EstadoV3 => ({ ...avanzar(estadoInicial(), FICHA).estado, salientes: [], ultimoEntranteAt: hace(HORA) });

async function preparar(estado: EstadoV3, fila: Partial<FilaV3> = {}, n: Partial<NarradorV3> = {}) {
  const n1 = narrador(n);
  const base = crearBaseFalsa({ narradores: [{ ...n1 }] });
  await crearFila(base.cliente, { narrador_id: 'n1', idioma: 'es-AR', ficha: FICHA, estado, ultimo_audio_at: null, tanda_dia: HOY, tanda_cuenta: 1, migrada_de: null });
  Object.assign(base.tablas.entrevistas_v3[0], fila);
  const p = depsDePrueba(base, { ahora: AHORA });
  const leer = async () => (await leerFila(base.cliente, 'n1'))!;
  return { base, n1, ...p, leer, trabajar: async () => trabajarNarrador(p.deps, await leer(), n1) };
}

describe('cierre por silencio', () => {
  it('a los 3 minutos de la última transcripción cierra y manda la siguiente', async () => {
    const r = await preparar({ ...enOR1(), borrador: 'Nací en un pueblo chico.' }, { ultimo_audio_at: hace(4 * MIN) });
    expect(await r.trabajar()).toBe('cierre');
    expect(r.enviados[0].texto?.startsWith(`${textoDelBanco('M3.1', FICHA)}\n`)).toBe(true);
    const f = await r.leer();
    expect(f).toMatchObject({ tanda_cuenta: 2, ultimo_audio_at: null });
    expect(f.estado.respuestas).toEqual([['OR1', 'Nací en un pueblo chico.']]);
    expect(r.hitos).toContain('n1:primera');
  });

  it('a los 2 minutos todavía no', async () => {
    const r = await preparar({ ...enOR1(), borrador: 'Nací en un pueblo chico.' }, { ultimo_audio_at: hace(2 * MIN) });
    expect(await r.trabajar()).toBe('nada');
    expect(r.enviados).toEqual([]);
  });

  it('con la tanda diaria en el tope (4): cierra, guarda el acuse y no manda nada', async () => {
    const r = await preparar({ ...enOR1(), borrador: 'Nací en un pueblo chico.' }, { ultimo_audio_at: hace(4 * MIN), tanda_cuenta: 4 });
    expect(await r.trabajar()).toBe('cierre');
    expect(r.enviados).toEqual([]);
    const f = await r.leer();
    expect(f.estado.esperando).toBeUndefined();
    expect(f.estado.acuse).toEqual({ familia: 'M3', n: 0 });
  });

  it('con otro proceso mandando (toma vigente) no toca nada', async () => {
    const r = await preparar({ ...enOR1(), borrador: 'Algo.' }, { ultimo_audio_at: hace(4 * MIN), enviando_hasta: new Date(AHORA.getTime() + MIN).toISOString() });
    expect(await r.trabajar()).toBe('nada');
  });
});

describe('la tanda diaria', () => {
  const conAcusePendiente = (): EstadoV3 => ({ ...cerrarYSeguir(recibirAudio(enOR1(), 'Nací en un pueblo chico.').estado, FICHA, false).estado, salientes: [] });

  it('a su hora, con el acuse de ayer pegado arriba; fuera de las 24 h, con la plantilla', async () => {
    const r = await preparar({ ...conAcusePendiente(), ultimoEntranteAt: hace(25 * HORA) }, { tanda_dia: AYER, tanda_cuenta: 4 });
    expect(await r.trabajar()).toBe('tanda');
    expect(r.enviados).toHaveLength(1);
    expect(r.enviados[0]).toMatchObject({ tipo: 'plantilla', plantilla: 'pregunta_diaria_vos' });
    expect(r.enviados[0].variables![0].startsWith(textoDelBanco('M3.1', FICHA))).toBe(true);
    const f = await r.leer();
    expect(f).toMatchObject({ tanda_dia: HOY, tanda_cuenta: 1 });
    expect(f.estado.esperando).toBe('OR2');
    expect(f.estado.tandaInicioAt).toBe(AHORA.toISOString());
  });

  it('si la de ayer quedó sin contestar, se reenvía esa misma', async () => {
    const r = await preparar(enOR1(), { tanda_dia: AYER, tanda_cuenta: 1 });
    expect(await r.trabajar()).toBe('tanda');
    expect(r.enviados.map((e) => e.texto)).toEqual([avanzar(estadoInicial(), FICHA).estado.salientes[0].texto]);
    expect((await r.leer()).estado.esperando).toBe('OR1');
  });

  it('antes de su hora no arranca', async () => {
    const r = await preparar(enOR1(), { tanda_dia: AYER });
    r.fijar(new Date('2026-10-08T12:30:00Z')); // 09:30
    expect(await r.trabajar()).toBe('nada');
  });

  it('si está mandando audios, no la pisa: primero se cierra lo suyo', async () => {
    const r = await preparar({ ...enOR1(), borrador: 'Algo.' }, { tanda_dia: AYER, ultimo_audio_at: hace(MIN) });
    expect(await r.trabajar()).toBe('nada');
  });
});

describe('M8', () => {
  it('a las 6 h de la primera del día, si no contó nada; una sola vez por día', async () => {
    const r = await preparar({ ...enOR1(), tandaInicioAt: hace(6 * HORA + MIN) }, { tanda_dia: HOY, tanda_cuenta: 1 });
    expect(await r.trabajar()).toBe('m8');
    expect(r.enviados.map((e) => e.texto)).toEqual([textoDelBanco('M8', FICHA)]);
    expect(await r.trabajar()).toBe('nada');
    expect(r.enviados).toHaveLength(1);
  });

  it('a las 5 h, no', async () => {
    const r = await preparar({ ...enOR1(), tandaInicioAt: hace(5 * HORA) }, { tanda_dia: HOY, tanda_cuenta: 1 });
    expect(await r.trabajar()).toBe('nada');
  });
});

describe('el tick', () => {
  it('primero vacía la cola que quedó (un envío que había fallado)', async () => {
    const r = await preparar(encolar(enOR1(), { texto: 'Pendiente', tipo: 'turno' }));
    expect(await r.trabajar()).toBe('drenar');
    expect(r.enviados.map((e) => e.texto)).toEqual(['Pendiente']);
  });

  it('un narrador pausado no recibe nada', async () => {
    const r = await preparar(enOR1(), { tanda_dia: AYER }, { estado: 'pausado' });
    expect(await r.trabajar()).toBe('nada');
  });

  it('tickV3 recorre las filas y un narrador que falla no frena a los demás', async () => {
    const r = await preparar({ ...enOR1(), borrador: 'Algo.' }, { ultimo_audio_at: hace(4 * MIN) });
    await crearFila(r.base.cliente, { narrador_id: 'n-sin-narrador', idioma: 'es-AR', ficha: FICHA, estado: estadoInicial(), ultimo_audio_at: null, tanda_dia: null, tanda_cuenta: 0, migrada_de: null });
    await tickV3(r.deps);
    expect((await r.leer()).estado.respuestas).toHaveLength(1);
  });
});
```

En `entrevistador/test/scheduler.test.ts`:
- en `mocks.filas` (dentro de `vi.hoisted`), agregar `v3: [] as any[],`;
- en el `resolver` de la base falsa, después de la línea `if (b._op !== 'select') return { data: null, error: null };`, agregar `if (tabla === 'entrevistas_v3') return { data: mocks.filas.v3 };`;
- en el `beforeEach`, agregar `mocks.filas.v3 = [];`;
- y al final del archivo:

```ts
describe('narradores V3 (spec 2026-10-07)', () => {
  it('un narrador con fila en entrevistas_v3 no recibe la pregunta ni el recordatorio viejos', async () => {
    mocks.filas.narradores = [narrador({ estado: 'activo', dia_actual: 0 })];
    mocks.filas.v3 = [{ narrador_id: 'n1' }];
    await tick(A_LAS_10_05);
    expect(mocks.enviarPlantilla).not.toHaveBeenCalled();
    expect(mocks.enviarTexto).not.toHaveBeenCalled();
  });

  it('sin fila V3, el mismo narrador recibe su pregunta como siempre', async () => {
    mocks.filas.narradores = [narrador({ estado: 'activo', dia_actual: 0 })];
    await tick(A_LAS_10_05);
    expect(mocks.enviarPlantilla.mock.calls.length + mocks.enviarTexto.mock.calls.length).toBeGreaterThan(0);
  });
});
```

- [ ] **Step 2: Correr y ver que fallan**

Run: `cd entrevistador && npx vitest run test/v3/reloj.test.ts test/scheduler.test.ts`
Expected: FAIL (`Failed to load url ../../src/v3/reloj.js`; en el scheduler, el narrador V3 recibe la plantilla vieja).

- [ ] **Step 3: Implementar `reloj.ts`**

`entrevistador/src/v3/reloj.ts`:

```ts
// El reloj de la entrevista V3 (spec 2026-10-07, "El reloj"): un tick por
// minuto. Todo sale de la base (ningún setTimeout en memoria): si Railway se
// cae, el tick siguiente retoma. Por narrador activo, en orden: la cola que
// quedó, el cierre por 3' de silencio, la tanda del día a su hora y M8.

import { ritmoDe } from '../flujo/ritmo.js';
import { fechaLocal } from '../flujo/tiempo.js';
import { lanzarCazador } from './cazador.js';
import type { DepsV3 } from './deps.js';
import { drenar } from './enviar.js';
import { conReintento, listarFilas, tomaVigente } from './estado.js';
import { aplicarTanda, hitosDe, puedeAbrirHoy, yaEsLaHora } from './tanda.js';
import { fichaTexto, type FilaV3, type NarradorV3 } from './tipos.js';
import { avanzar, cerrarYSeguir, encolar, reenviarAbierta, textoDelBanco } from './turno.js';

export const SILENCIO_MS = 3 * 60_000;
export const HORAS_M8 = 6;

const hayBorrador = (f: FilaV3) => !!f.estado.borrador?.trim();

export function silencioCumplido(f: FilaV3, ahora: Date): boolean {
  return hayBorrador(f) && !!f.ultimo_audio_at && ahora.getTime() - Date.parse(f.ultimo_audio_at) >= SILENCIO_MS;
}

export function tocaTanda(f: FilaV3, n: NarradorV3, ahora: Date, hoy: string): boolean {
  return !f.estado.terminada && f.tanda_dia !== hoy && yaEsLaHora(n.hora_preferida, n.zona_horaria, ahora) && !hayBorrador(f);
}

export function tocaM8(f: FilaV3, ahora: Date, hoy: string): boolean {
  const e = f.estado;
  return f.tanda_dia === hoy && f.tanda_cuenta === 1 && !!e.esperando && !e.tocoSi && !hayBorrador(f) && e.m8Dia !== hoy
    && !!e.tandaInicioAt && ahora.getTime() - Date.parse(e.tandaInicioAt) >= HORAS_M8 * 3600_000;
}

export type Trabajo = 'nada' | 'drenar' | 'cierre' | 'tanda' | 'm8';

export async function trabajarNarrador(deps: DepsV3, fila: FilaV3, n: NarradorV3): Promise<Trabajo> {
  if (n.estado !== 'activo') return 'nada';
  const ahora = deps.ahora();
  if (tomaVigente(fila, ahora)) return 'nada';
  if (fila.estado.salientes.length > 0) {
    await drenar(deps, n.id);
    return 'drenar';
  }
  if (fila.estado.terminada) return 'nada';
  const hoy = fechaLocal(ahora, n.zona_horaria);
  const ritmo = ritmoDe(n.contexto);

  if (silencioCumplido(fila, ahora)) {
    const r = await conReintento(deps.db, n.id, (f) => {
      if (!silencioCumplido(f, ahora) || tomaVigente(f, ahora)) return null;
      const s = cerrarYSeguir(f.estado, fichaTexto(f), puedeAbrirHoy(f, ritmo, hoy));
      const t = aplicarTanda(f, s.estado, hoy, s.abrio, ahora);
      return { cambio: { estado: t.estado, ultimo_audio_at: null, tanda_dia: t.tanda_dia, tanda_cuenta: t.tanda_cuenta }, resultado: s.bloqueCerrado };
    });
    if (!r) return 'nada';
    await drenar(deps, n.id);
    if (r.resultado !== undefined) lanzarCazador(deps, n.id, r.resultado);
    for (const hito of hitosDe(r.fila.estado)) await deps.hito(n.id, hito);
    return 'cierre';
  }

  if (tocaTanda(fila, n, ahora, hoy)) {
    const r = await conReintento(deps.db, n.id, (f) => {
      if (!tocaTanda(f, n, ahora, hoy)) return null;
      // La de ayer sin contestar se reenvía tal cual; si no, sigue (con el acuse pendiente pegado arriba).
      const sigue = f.estado.esperando ? { estado: reenviarAbierta(f.estado), abrio: true } : avanzar(f.estado, fichaTexto(f));
      return {
        cambio: { estado: { ...sigue.estado, tandaInicioAt: ahora.toISOString() }, tanda_dia: hoy, tanda_cuenta: sigue.abrio ? 1 : 0 },
        resultado: true,
      };
    });
    if (!r) return 'nada';
    await drenar(deps, n.id);
    return 'tanda';
  }

  if (tocaM8(fila, ahora, hoy)) {
    const r = await conReintento(deps.db, n.id, (f) => {
      if (!tocaM8(f, ahora, hoy)) return null;
      const conM8 = encolar(f.estado, { texto: textoDelBanco('M8', fichaTexto(f)), tipo: 'recordatorio' });
      return { cambio: { estado: { ...conM8, m8Dia: hoy } }, resultado: true };
    });
    if (!r) return 'nada';
    await drenar(deps, n.id);
    return 'm8';
  }
  return 'nada';
}

export async function tickV3(deps: DepsV3): Promise<void> {
  const filas = await listarFilas(deps.db);
  if (filas.length === 0) return;
  const { data, error } = await deps.db.from('narradores').select('*').in('id', filas.map((f) => f.narrador_id));
  if (error) throw new Error(`reloj V3: no pude leer los narradores: ${error.message}`);
  const porId = new Map(((data as NarradorV3[] | null) ?? []).map((n) => [n.id, n]));
  for (const fila of filas) {
    const n = porId.get(fila.narrador_id);
    if (!n) continue;
    try {
      await trabajarNarrador(deps, fila, n);
    } catch (err) {
      // Un narrador que falla no frena a los demás (como `aislado` del scheduler viejo).
      console.error(`reloj V3: falló el narrador ${fila.narrador_id}:`, err);
    }
  }
}
```

- [ ] **Step 4: El scheduler: saltear a los V3 en lo viejo y el cron de 1 minuto**

En `entrevistador/src/flujo/scheduler.ts`:

Agregar a los imports:

```ts
import { narradoresV3 } from '../v3/estado.js';
```

En `enviarPreguntasDelDia` (líneas 166-182), antes del `for`:

```ts
  // Los narradores V3 tienen su propio reloj (v3/reloj.ts): la pregunta vieja no les sale.
  const v3 = await narradoresV3(db);
```

y como primera línea del `for`:

```ts
    if (v3.has(n.id)) continue;
```

Lo mismo en `enviarRecordatorios` (líneas 185-203): `const v3 = await narradoresV3(db);` antes del `for` y `if (v3.has(n.id)) continue;` como primera línea. (`narradoresV3` tira si la base contesta un error que no sea "la tabla no existe": la fase falla entera y queda en el log, que es mejor que mandarle la pregunta vieja a un narrador V3.)

Reemplazar `iniciarScheduler` (líneas 245-259) por:

```ts
let corriendo = false;
let corriendoV3 = false;

/**
 * El reloj de la entrevista V3 (spec 2026-10-07): cada 1 minuto, aparte del
 * tick viejo de 15. Los imports son dinámicos: si nadie tiene fila V3, no se
 * carga nada de la V3.
 */
export function iniciarRelojV3() {
  return cron.schedule('* * * * *', async () => {
    if (corriendoV3) return; // que dos ticks no se pisen
    corriendoV3 = true;
    try {
      const { tickV3 } = await import('../v3/reloj.js');
      const { depsReales } = await import('../v3/deps-reales.js');
      await tickV3(depsReales());
    } catch (err) {
      console.error('Falló el tick del reloj V3:', err);
    } finally {
      corriendoV3 = false;
    }
  });
}

export function iniciarScheduler() {
  iniciarRelojV3();
  return cron.schedule('*/15 * * * *', async () => {
    if (corriendo) return; // que dos ticks no se pisen
    corriendo = true;
    try {
      await tick(new Date());
    } catch (err) {
      console.error('Falló el tick del scheduler:', err);
    } finally {
      corriendo = false;
    }
  });
}
```

- [ ] **Step 5: Correr y ver que pasan; todo el entrevistador; tipos**

Run: `cd entrevistador && npx vitest run test/v3/reloj.test.ts test/scheduler.test.ts && npx vitest run && npx tsc --noEmit -p tsconfig.check.json`
Expected: PASS y sin errores.

- [ ] **Step 6: Commit**

```bash
git add entrevistador/src/v3/reloj.ts entrevistador/src/flujo/scheduler.ts entrevistador/test/v3/reloj.test.ts entrevistador/test/scheduler.test.ts
git commit -m "entrevistador V3: el reloj de 1 minuto (silencio, tanda del día, M8) y el scheduler viejo saltea a los V3

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 11: El alta — pase de los narradores en curso (`npm run v3-pasar`) y alta de los nuevos (`V3_PARA_NUEVOS`)

**Files:**
- Create: `entrevistador/src/v3/pasar.ts`
- Create: `entrevistador/src/v3/equivalencias.json`
- Create: `entrevistador/scripts/cargar-entorno.ts`, `entrevistador/scripts/v3-pasar.ts`
- Modify: `entrevistador/src/config.ts` (al final), `entrevistador/src/flujo/preguntar.ts` (principio de `enviarPregunta`, línea ~145), `entrevistador/package.json` (scripts)
- Test: `entrevistador/test/v3/pasar.test.ts`, `entrevistador/test/v3/alta-hook.test.ts`

**Interfaces:**
- Consumes: `crearFila`, `conReintento`, `esNarradorV3` (Task 3); `avanzar` (Task 4); `drenar` (Task 7); `estadoInicial`, `esGenero`, `fichaTexto`, `FichaFila`, `Genero`, `MigradaDe`, `NarradorV3` (Task 2); `fechaLocal`; núcleo `preguntaPorId`, `sumarAudio`, `idiomaDe`, `esIdioma`, `Idioma`, `PreguntaFamilia`.
- Produces:
  - `type Equivalencias = { version: 1; porTexto: Record<string, string> }`
  - `function normalizarPregunta(texto: string): string`
  - `function leerEquivalencias(crudo?: unknown): Equivalencias` (por defecto, `equivalencias.json`)
  - `type FilaGuion = { id: string; orden: number; texto: string; tipo: string }`
  - `type RespuestaVieja = { id: string; pregunta_orden: number; transcripcion: string | null; texto_directo: string | null; recibido_at: string }`
  - `type Cargada = { clave: string; ordenes: number[]; respuestaIds: string[]; texto: string; palabras: number }`
  - `type PlanDePase = { narradorId: string; estadoNarrador: string; idioma: Idioma; ficha: FichaFila; migradaDe: MigradaDe; familia: PreguntaFamilia[]; ultimoEntranteAt: string | null; cargadas: Cargada[]; sinEquivalencia: { orden: number; pregunta: string; respuestas: number }[]; sinTexto: number[] }`
  - `function armarPase(e: { narradorId: string; estadoNarrador: string; diaActual: number; ultimaRespuestaAt: string | null; idioma: Idioma; ficha: FichaFila; guion: FilaGuion[]; respuestas: RespuestaVieja[]; equivalencias: Equivalencias }): PlanDePase` (puro)
  - `function planDePase(db: SupabaseClient, narradorId: string, o: { genero: Genero; idioma?: Idioma; equivalencias: Equivalencias }): Promise<PlanDePase>`
  - `function aplicarPase(db: SupabaseClient, plan: PlanDePase): Promise<void>`
  - `function describirPase(plan: PlanDePase): string`
  - `type ArgsPase = { narradorId: string; genero: Genero; idioma?: Idioma; aplicar: boolean; equivalencias?: string }`; `function argumentosDePase(args: string[]): ArgsPase`
  - `function arrancarV3(deps: DepsV3, n: NarradorV3, idioma: Idioma, ficha: FichaFila, o: { ventanaAbierta: boolean }): Promise<void>`
  - `function altaNuevo(deps: DepsV3, n: NarradorV3, o: { ventanaAbierta: boolean }): Promise<'mandada' | 'frenada'>`
  - `config.ts`: `function v3ParaNuevos(): boolean`

**La tabla de equivalencias.** Va **por texto de la pregunta vieja, normalizado** (minúsculas, sin acentos ni signos), no por orden: cada familia puede reordenar, sacar o agregar preguntas a su guion (el orden de una pregunta cambia de narrador a narrador), pero el texto de una fija se copia tal cual de la plantilla; una pregunta que la familia reescribió no matchea y aparece en el dry-run como "sin equivalencia" en vez de cargarse en la pregunta V3 equivocada. Formato:

```json
{
  "version": 1,
  "porTexto": {
    "<texto exacto de la pregunta de la plantilla vieja>": "<clave V3, p. ej. CA1>"
  }
}
```

Una sola clave V3 por pregunta vieja ("la pregunta V3 que cubre", spec): si una respuesta vieja se cargara en dos claves, el escritor la recibiría dos veces. Varias preguntas viejas sí pueden ir a la misma clave (se suman en orden). Las preguntas de la familia (`preguntas.tipo = 'familia'`) no necesitan tabla: van a `F:<id de la pregunta>`, que es como el motor V3 las conoce. **El implementador deja `porTexto` vacío: la tabla la arma la sesión principal y la aprueba Naza** antes de cualquier `--aplicar` (con la tabla vacía el script lo dice y no aplica nada).

- [ ] **Step 1: Escribir los tests que fallan**

`entrevistador/test/v3/pasar.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { crearBaseFalsa } from './base-falsa.js';
import { depsDePrueba } from './deps-prueba.js';
import { leerFila } from '../../src/v3/estado.js';
import { altaNuevo, aplicarPase, argumentosDePase, describirPase, leerEquivalencias, normalizarPregunta, planDePase } from '../../src/v3/pasar.js';
import { renderizar } from '../../src/v3/nucleo/entrevista/texto.js';
import { preguntaPorId } from '../../src/v3/nucleo/entrevista/banco.js';
import type { NarradorV3 } from '../../src/v3/tipos.js';

const EQUIVALENCIAS = leerEquivalencias({
  version: 1,
  porTexto: { 'Contame dónde naciste.': 'OR1', '¿Cómo era tu casa?': 'CA1', '¿Y tu barrio?': 'CA1' },
});

function baseConNarrador(narrador: Record<string, unknown> = {}) {
  return crearBaseFalsa({
    familias: [{ id: 'f1', nombre: 'Laura' }],
    narradores: [{ id: 'n1', familia_id: 'f1', como_le_dicen: 'Prueba', telefono_whatsapp: '+5491100000000', estado: 'activo', dia_actual: 6, contexto: { trato: 'usted' }, ultima_respuesta_at: '2026-10-07T20:00:00Z', ...narrador }],
    preguntas: [
      { id: 'g1', narrador_id: null, orden: 1, texto: 'Contame dónde naciste.', tipo: 'fija' },
      { id: 'g2', narrador_id: null, orden: 2, texto: '¿Cómo era tu casa?', tipo: 'fija' },
      { id: 'g3', narrador_id: null, orden: 3, texto: '¿A qué jugabas?', tipo: 'fija' },
      { id: 'g4', narrador_id: null, orden: 4, texto: '¿Quién te enseñó a leer?', tipo: 'fija' },
      { id: 'g5', narrador_id: null, orden: 5, texto: '¿Y tu barrio?', tipo: 'fija' },
      { id: 'pf1', narrador_id: 'n1', orden: 6, texto: '¿Qué te acordás de la abuela?', tipo: 'familia' },
    ],
    respuestas: [
      { id: 'r1', narrador_id: 'n1', pregunta_orden: 1, transcripcion: 'Nací en un pueblo.', texto_directo: null, recibido_at: '2026-10-01T10:00:00Z' },
      { id: 'r2', narrador_id: 'n1', pregunta_orden: 1, transcripcion: 'Había un río.', texto_directo: null, recibido_at: '2026-10-01T10:05:00Z' },
      { id: 'r3', narrador_id: 'n1', pregunta_orden: 2, transcripcion: 'Una casa chorizo.', texto_directo: null, recibido_at: '2026-10-02T10:00:00Z' },
      { id: 'r4', narrador_id: 'n1', pregunta_orden: 3, transcripcion: 'A la bolita.', texto_directo: null, recibido_at: '2026-10-03T10:00:00Z' },
      { id: 'r5', narrador_id: 'n1', pregunta_orden: 4, transcripcion: null, texto_directo: null, recibido_at: '2026-10-04T10:00:00Z' },
      { id: 'r6', narrador_id: 'n1', pregunta_orden: 5, transcripcion: 'Empedrado.', texto_directo: null, recibido_at: '2026-10-05T10:00:00Z' },
      { id: 'r7', narrador_id: 'n1', pregunta_orden: 6, transcripcion: 'Hacía pan.', texto_directo: null, recibido_at: '2026-10-06T10:00:00Z' },
    ],
  });
}

describe('la tabla de equivalencias', () => {
  it('va por texto normalizado', () => {
    expect(normalizarPregunta('¿Cómo era tu  casa?')).toBe('como era tu casa');
    expect(EQUIVALENCIAS.porTexto['como era tu casa']).toBe('CA1');
  });

  it('rechaza una clave que no es del banco V3 y un formato roto', () => {
    expect(() => leerEquivalencias({ version: 1, porTexto: { 'Algo': 'ZZ9' } })).toThrow(/ZZ9/);
    expect(() => leerEquivalencias({ porTexto: {} })).toThrow(/formato/);
  });

  it('la del repo arranca vacía (la arma la sesión principal y la aprueba Naza)', () => {
    expect(leerEquivalencias()).toEqual({ version: 1, porTexto: {} });
  });
});

describe('el pase de un narrador en curso', () => {
  it('arma el plan: cada respuesta vieja en su clave V3; lo que no tiene tabla queda afuera', async () => {
    const base = baseConNarrador();
    const plan = await planDePase(base.cliente, 'n1', { genero: 'mujer', equivalencias: EQUIVALENCIAS });
    expect(plan.cargadas.map((c) => [c.clave, c.ordenes, c.texto])).toEqual([
      ['OR1', [1], 'Nací en un pueblo. Había un río.'],
      ['CA1', [2, 5], 'Una casa chorizo. Empedrado.'],
      ['F:pf1', [6], 'Hacía pan.'],
    ]);
    expect(plan.sinEquivalencia).toEqual([{ orden: 3, pregunta: '¿A qué jugabas?', respuestas: 1 }]);
    expect(plan.sinTexto).toEqual([4]);
    expect(plan.familia).toEqual([{ id: 'F:pf1', texto: '¿Qué te acordás de la abuela?' }]);
    expect(plan).toMatchObject({ idioma: 'es-AR', ficha: { nombre: 'Prueba', genero: 'mujer', quienRegala: 'Laura' }, migradaDe: { de: 'v-vieja', dia_actual: 6 } });
    const texto = describirPase(plan);
    expect(texto).toContain('OR1 ← orden 1');
    expect(texto).toContain('¿A qué jugabas?');
    expect(texto).not.toContain('Nací en un pueblo'); // el dry-run no imprime lo que contó
  });

  it('aplicar: crea la fila con las respuestas cargadas, pone clave_v3 y no manda nada', async () => {
    const base = baseConNarrador();
    const plan = await planDePase(base.cliente, 'n1', { genero: 'mujer', equivalencias: EQUIVALENCIAS });
    await aplicarPase(base.cliente, plan);
    const fila = await leerFila(base.cliente, 'n1');
    expect(fila?.estado.respuestas).toEqual([['OR1', 'Nací en un pueblo. Había un río.'], ['CA1', 'Una casa chorizo. Empedrado.'], ['F:pf1', 'Hacía pan.']]);
    expect(fila?.estado.salientes).toEqual([]);
    expect(fila?.estado.ultimoEntranteAt).toBe('2026-10-07T20:00:00Z');
    expect(fila).toMatchObject({ tanda_dia: null, migrada_de: { de: 'v-vieja', dia_actual: 6 } });
    expect(Object.fromEntries(base.tablas.respuestas.map((r) => [r.id, r.clave_v3 ?? null]))).toEqual({ r1: 'OR1', r2: 'OR1', r3: 'CA1', r4: null, r5: null, r6: 'CA1', r7: 'F:pf1' });
    await expect(aplicarPase(base.cliente, plan)).rejects.toThrow(/ya tiene/);
  });

  it('en catalán con --idioma ca; un acepto pasa a activo', async () => {
    const base = baseConNarrador({ estado: 'acepto', dia_actual: 0 });
    const plan = await planDePase(base.cliente, 'n1', { genero: 'mujer', idioma: 'ca', equivalencias: EQUIVALENCIAS });
    await aplicarPase(base.cliente, plan);
    expect((await leerFila(base.cliente, 'n1'))?.idioma).toBe('ca');
    expect(base.tablas.narradores[0].estado).toBe('activo');
  });

  it('no pasa un viaje, un invitado ni a quien ya es V3', async () => {
    await expect(planDePase(baseConNarrador({ contexto: { modo: 'viaje' } }).cliente, 'n1', { genero: 'mujer', equivalencias: EQUIVALENCIAS })).rejects.toThrow(/viaje/i);
    await expect(planDePase(baseConNarrador({ estado: 'invitado' }).cliente, 'n1', { genero: 'mujer', equivalencias: EQUIVALENCIAS })).rejects.toThrow(/invitado/);
    const base = baseConNarrador();
    await aplicarPase(base.cliente, await planDePase(base.cliente, 'n1', { genero: 'mujer', equivalencias: EQUIVALENCIAS }));
    await expect(planDePase(base.cliente, 'n1', { genero: 'mujer', equivalencias: EQUIVALENCIAS })).rejects.toThrow(/ya tiene/);
  });

  it('los argumentos del script', () => {
    expect(argumentosDePase(['n1', '--genero', 'mujer'])).toEqual({ narradorId: 'n1', genero: 'mujer', aplicar: false });
    expect(argumentosDePase(['n1', '--idioma', 'ca', '--genero', 'varon', '--aplicar', '--equivalencias', 'otra.json'])).toEqual({ narradorId: 'n1', genero: 'varon', idioma: 'ca', aplicar: true, equivalencias: 'otra.json' });
    expect(() => argumentosDePase(['n1'])).toThrow(/--genero/);
    expect(() => argumentosDePase(['n1', '--genero', 'mujer', '--idioma', 'fr'])).toThrow(/idioma/);
  });
});

describe('el alta de un narrador nuevo', () => {
  const nuevo = (contexto: Record<string, unknown>): NarradorV3 => ({
    id: 'n1', familia_id: 'f1', como_le_dicen: 'Prueba', telefono_whatsapp: '+5491100000000', hora_preferida: '10:00:00',
    zona_horaria: 'America/Argentina/Buenos_Aires', contexto, estado: 'acepto', dia_actual: 0, ultima_respuesta_at: null,
  });
  const preparar = (contexto: Record<string, unknown>) => {
    const base = crearBaseFalsa({ familias: [{ id: 'f1', nombre: 'Laura' }], narradores: [{ ...nuevo(contexto) }] });
    return { base, ...depsDePrueba(base) };
  };

  it('sin género: se frena, no sale nada y se avisa a los socios', async () => {
    const { deps, base, enviados, avisos } = preparar({});
    expect(await altaNuevo(deps, nuevo({}), { ventanaAbierta: true })).toBe('frenada');
    expect(base.tablas.entrevistas_v3 ?? []).toHaveLength(0);
    expect(enviados).toEqual([]);
    expect(avisos[0].clave).toBe('alta-sin-genero-n1');
  });

  it('con género: crea la fila, sale OR1 con M1 y pasa a activo', async () => {
    const { deps, base, enviados } = preparar({ genero: 'varon' });
    expect(await altaNuevo(deps, nuevo({ genero: 'varon' }), { ventanaAbierta: true })).toBe('mandada');
    expect(enviados).toHaveLength(1);
    expect(enviados[0].texto?.startsWith(renderizar(preguntaPorId('OR1')!.texto, { nombre: 'Prueba', genero: 'varon' }))).toBe(true);
    expect(base.tablas.narradores[0].estado).toBe('activo');
    expect(await leerFila(base.cliente, 'n1')).toMatchObject({ idioma: 'es-AR', tanda_cuenta: 1, ficha: { nombre: 'Prueba', genero: 'varon', quienRegala: 'Laura' } });
  });

  it('en catalán si la web mandó contexto.idioma = ca', async () => {
    const ctx = { genero: 'mujer', idioma: 'ca' };
    const { deps, enviados } = preparar(ctx);
    await altaNuevo(deps, nuevo(ctx), { ventanaAbierta: true });
    expect(enviados[0].texto?.startsWith(renderizar(preguntaPorId('OR1', 'ca')!.texto, { nombre: 'Prueba', genero: 'mujer', idioma: 'ca' }))).toBe(true);
  });

  it('un idioma que no se conoce frena y avisa (mejor que entrevistar en otro)', async () => {
    const ctx = { genero: 'mujer', idioma: 'fr' };
    const { deps, avisos } = preparar(ctx);
    expect(await altaNuevo(deps, nuevo(ctx), { ventanaAbierta: true })).toBe('frenada');
    expect(avisos[0].clave).toBe('alta-idioma-n1');
  });
});
```

`entrevistador/test/v3/alta-hook.test.ts` (el enganche en `enviarPregunta`: apagado no cambia nada; prendido, la pregunta 1 de un `acepto` la manda la V3):

```ts
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

vi.stubEnv('SUPABASE_URL', 'https://x.supabase.co');
vi.stubEnv('SUPABASE_SERVICE_ROLE_KEY', 'clave');
vi.stubEnv('ANTHROPIC_API_KEY', 'clave');
vi.stubEnv('OPENAI_API_KEY', 'clave');
vi.stubEnv('WA_TOKEN', 'token');
vi.stubEnv('WA_PHONE_NUMBER_ID', '999');
vi.stubEnv('WA_VERIFY_TOKEN', 'v');

const h = vi.hoisted(() => ({ altaNuevo: vi.fn(async () => 'mandada' as const), preguntaDeOrden: vi.fn(async () => null) }));
vi.mock('../../src/db/cliente.js', () => ({ db: {} }));
vi.mock('../../src/db/guion.js', () => ({ preguntaDeOrden: h.preguntaDeOrden, capitulosDe: vi.fn(), tieneAdaptativas: vi.fn(async () => true), ultimoOrden: vi.fn(async () => 30) }));
vi.mock('../../src/whatsapp/enviar.js', () => ({ enviarPlantilla: vi.fn(), enviarTexto: vi.fn(), enviarImagenPorLink: vi.fn() }));
vi.mock('../../src/v3/pasar.js', () => ({ altaNuevo: h.altaNuevo }));
vi.mock('../../src/v3/deps-reales.js', () => ({ depsReales: () => ({ falsas: true }) }));

const { enviarPregunta } = await import('../../src/flujo/preguntar.js');
const N = { id: 'n1', familia_id: 'f1', como_le_dicen: 'Prueba', telefono_whatsapp: '+5491100000000', hora_preferida: '10:00:00', zona_horaria: 'America/Argentina/Buenos_Aires', contexto: { genero: 'mujer' }, estado: 'acepto', dia_actual: 0, ultima_respuesta_at: null, alerta_silencio: false };

beforeEach(() => { h.altaNuevo.mockClear(); h.preguntaDeOrden.mockClear(); });
afterEach(() => { vi.stubEnv('V3_PARA_NUEVOS', ''); });

describe('alta V3 de los nuevos en enviarPregunta', () => {
  it('apagado (por defecto): la pregunta 1 sigue por el flujo viejo', async () => {
    vi.stubEnv('V3_PARA_NUEVOS', '');
    await enviarPregunta(N, 1, { plantilla: true });
    expect(h.altaNuevo).not.toHaveBeenCalled();
    expect(h.preguntaDeOrden).toHaveBeenCalled();
  });

  it('prendido: la pregunta 1 de un acepto la manda la V3 (con la ventana según la plantilla)', async () => {
    vi.stubEnv('V3_PARA_NUEVOS', '1');
    expect(await enviarPregunta(N, 1, { plantilla: true })).toBe(true);
    expect(h.altaNuevo).toHaveBeenCalledWith({ falsas: true }, N, { ventanaAbierta: false });
    expect(h.preguntaDeOrden).not.toHaveBeenCalled();
  });

  it('prendido, pero un viaje sigue por su flujo', async () => {
    vi.stubEnv('V3_PARA_NUEVOS', '1');
    await enviarPregunta({ ...N, contexto: { modo: 'viaje', genero: 'mujer' } }, 1, { plantilla: true });
    expect(h.altaNuevo).not.toHaveBeenCalled();
  });

  it('prendido pero no es la 1 de un acepto: flujo viejo', async () => {
    vi.stubEnv('V3_PARA_NUEVOS', '1');
    await enviarPregunta({ ...N, estado: 'activo', dia_actual: 4 }, 5, { plantilla: false });
    expect(h.altaNuevo).not.toHaveBeenCalled();
  });
});
```

- [ ] **Step 2: Correr y ver que fallan**

Run: `cd entrevistador && npx vitest run test/v3/pasar.test.ts test/v3/alta-hook.test.ts`
Expected: FAIL (`Failed to load url ../../src/v3/pasar.js`; en el enganche, `altaNuevo` no se llama).

- [ ] **Step 3: La tabla vacía, el switch y el enganche**

`entrevistador/src/v3/equivalencias.json`:

```json
{
  "version": 1,
  "porTexto": {}
}
```

Al final de `entrevistador/src/config.ts`:

```ts
/**
 * ¿Los narradores NUEVOS entran a la entrevista V3? (spec 2026-10-07). Se
 * prende en Railway con V3_PARA_NUEVOS=1 cuando Naza lo diga; apagado, el alta
 * es la de siempre. Se lee en el momento (no al arrancar), como bienvenidaPideVoz.
 */
export function v3ParaNuevos(): boolean {
  return process.env.V3_PARA_NUEVOS === '1';
}
```

En `entrevistador/src/flujo/preguntar.ts`, agregar `v3ParaNuevos` al import de `../config.js` (si no hay import de config, agregar `import { v3ParaNuevos } from '../config.js';`) y, como primeras líneas de `enviarPregunta` (antes de `let pregunta = await preguntaDeOrden(n.id, orden);`):

```ts
  // Entrevista V3 para los nuevos (spec 2026-10-07): apagada salvo
  // V3_PARA_NUEVOS=1. Es el paso acepto → activo: en vez de la pregunta 1 vieja,
  // se crea su fila V3 y sale OR1 con M1. Sin género, se frena y se avisa.
  // La Vitácora de Viaje (contexto.modo = 'viaje') sigue por su flujo.
  if (n.estado === 'acepto' && orden === 1 && n.contexto?.modo !== 'viaje' && v3ParaNuevos()) {
    const { altaNuevo } = await import('../v3/pasar.js');
    const { depsReales } = await import('../v3/deps-reales.js');
    return (await altaNuevo(depsReales(), n, { ventanaAbierta: !plantilla })) === 'mandada';
  }
```

- [ ] **Step 4: Implementar `pasar.ts`**

`entrevistador/src/v3/pasar.ts`:

```ts
// El alta V3 (spec 2026-10-07, "El alta"):
//   - narradores EN CURSO: `npm run v3-pasar` arma el plan (dry-run) y, con
//     --aplicar, crea la fila con las respuestas viejas cargadas en sus claves
//     V3 (equivalencias.json, aprobada por Naza). No le manda nada: la próxima
//     sale en su tanda.
//   - narradores NUEVOS: al pasar acepto → activo con V3_PARA_NUEVOS=1. Sin
//     género, se frena y se avisa a los socios.

import type { SupabaseClient } from '@supabase/supabase-js';
import { fechaLocal } from '../flujo/tiempo.js';
import type { DepsV3 } from './deps.js';
import { drenar } from './enviar.js';
import equivalenciasJson from './equivalencias.json' with { type: 'json' };
import { conReintento, crearFila, esNarradorV3 } from './estado.js';
import { preguntaPorId } from './nucleo/entrevista/banco.js';
import type { PreguntaFamilia } from './nucleo/entrevista/flujo.js';
import { esIdioma, idiomaDe, type Idioma } from './nucleo/entrevista/idioma.js';
import { sumarAudio } from './nucleo/entrevista/respuesta.js';
import { esGenero, estadoInicial, fichaTexto, type EstadoV3, type FichaFila, type Genero, type MigradaDe, type NarradorV3 } from './tipos.js';
import { avanzar } from './turno.js';

// ---------------------------------------------------------------- equivalencias

export type Equivalencias = { version: 1; porTexto: Record<string, string> };

/** Minúsculas, sin acentos ni signos, espacios simples: "¿Cómo era tu casa?" → "como era tu casa". */
export function normalizarPregunta(texto: string): string {
  return texto.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, ' ').trim();
}

export function leerEquivalencias(crudo: unknown = equivalenciasJson): Equivalencias {
  const e = crudo as Partial<Equivalencias> | null;
  if (!e || e.version !== 1 || typeof e.porTexto !== 'object' || e.porTexto === null) {
    throw new Error('equivalencias: formato inválido (se espera { "version": 1, "porTexto": { "<texto de la pregunta vieja>": "<clave V3>" } }).');
  }
  const porTexto: Record<string, string> = {};
  for (const [texto, clave] of Object.entries(e.porTexto)) {
    if (typeof clave !== 'string' || !preguntaPorId(clave)) throw new Error(`equivalencias: «${String(clave)}» no es una pregunta del banco V3 (para «${texto}»).`);
    porTexto[normalizarPregunta(texto)] = clave;
  }
  return { version: 1, porTexto };
}

// ---------------------------------------------------------------- el plan (puro)

export type FilaGuion = { id: string; orden: number; texto: string; tipo: string };
export type RespuestaVieja = { id: string; pregunta_orden: number; transcripcion: string | null; texto_directo: string | null; recibido_at: string };
export type Cargada = { clave: string; ordenes: number[]; respuestaIds: string[]; texto: string; palabras: number };
export type PlanDePase = {
  narradorId: string;
  estadoNarrador: string;
  idioma: Idioma;
  ficha: FichaFila;
  migradaDe: MigradaDe;
  familia: PreguntaFamilia[];
  ultimoEntranteAt: string | null;
  cargadas: Cargada[];
  sinEquivalencia: { orden: number; pregunta: string; respuestas: number }[];
  sinTexto: number[];
};

const palabras = (s: string) => s.split(/\s+/).filter(Boolean).length;

export function armarPase(e: {
  narradorId: string; estadoNarrador: string; diaActual: number; ultimaRespuestaAt: string | null;
  idioma: Idioma; ficha: FichaFila; guion: FilaGuion[]; respuestas: RespuestaVieja[]; equivalencias: Equivalencias;
}): PlanDePase {
  const porOrden = new Map<number, RespuestaVieja[]>();
  for (const r of [...e.respuestas].sort((a, b) => a.recibido_at.localeCompare(b.recibido_at))) {
    porOrden.set(r.pregunta_orden, [...(porOrden.get(r.pregunta_orden) ?? []), r]);
  }
  const guion = new Map(e.guion.map((p) => [p.orden, p]));
  const cargadas: Cargada[] = [];
  const sinEquivalencia: PlanDePase['sinEquivalencia'] = [];
  const sinTexto: number[] = [];
  for (const orden of [...porOrden.keys()].sort((a, b) => a - b)) {
    const filas = porOrden.get(orden)!;
    const texto = filas.reduce((acc, r) => sumarAudio(acc, (r.transcripcion ?? r.texto_directo ?? '').trim()), '');
    if (!texto) {
      sinTexto.push(orden);
      continue;
    }
    const pregunta = guion.get(orden);
    const clave = pregunta?.tipo === 'familia' ? `F:${pregunta.id}` : pregunta ? e.equivalencias.porTexto[normalizarPregunta(pregunta.texto)] : undefined;
    if (!clave) {
      sinEquivalencia.push({ orden, pregunta: pregunta?.texto ?? '(sin pregunta en el guion)', respuestas: filas.length });
      continue;
    }
    const ya = cargadas.find((c) => c.clave === clave);
    if (ya) {
      ya.texto = sumarAudio(ya.texto, texto);
      ya.ordenes.push(orden);
      ya.respuestaIds.push(...filas.map((r) => r.id));
    } else {
      cargadas.push({ clave, ordenes: [orden], respuestaIds: filas.map((r) => r.id), texto, palabras: 0 });
    }
  }
  for (const c of cargadas) c.palabras = palabras(c.texto);
  return {
    narradorId: e.narradorId,
    estadoNarrador: e.estadoNarrador,
    idioma: e.idioma,
    ficha: e.ficha,
    migradaDe: { de: 'v-vieja', dia_actual: e.diaActual },
    familia: e.guion.filter((p) => p.tipo === 'familia').map((p) => ({ id: `F:${p.id}`, texto: p.texto })),
    ultimoEntranteAt: e.ultimaRespuestaAt,
    cargadas,
    sinEquivalencia,
    sinTexto,
  };
}

// ---------------------------------------------------------------- base

/** El guion del narrador como lo resuelve db/guion.ts: si tiene fijas propias, solo lo propio; si no, la plantilla con lo propio encima. */
async function guionDe(db: SupabaseClient, narradorId: string): Promise<FilaGuion[]> {
  const { data: propias, error } = await db.from('preguntas').select('id,orden,texto,tipo').eq('narrador_id', narradorId).order('orden');
  if (error) throw new Error(`No pude leer el guion de ${narradorId}: ${error.message}`);
  const lista = (propias as FilaGuion[] | null) ?? [];
  if (lista.some((p) => p.tipo === 'fija')) return lista;
  const { data: globales, error: errorGlobales } = await db.from('preguntas').select('id,orden,texto,tipo').is('narrador_id', null).order('orden');
  if (errorGlobales) throw new Error(`No pude leer la plantilla de preguntas: ${errorGlobales.message}`);
  const porOrden = new Map<number, FilaGuion>();
  for (const p of (globales as FilaGuion[] | null) ?? []) porOrden.set(p.orden, p);
  for (const p of lista) porOrden.set(p.orden, p);
  return [...porOrden.values()].sort((a, b) => a.orden - b.orden);
}

async function quienRegala(db: SupabaseClient, familiaId: string): Promise<string | undefined> {
  const { data } = await db.from('familias').select('nombre').eq('id', familiaId).maybeSingle();
  return (data as { nombre?: string } | null)?.nombre || undefined;
}

export async function planDePase(db: SupabaseClient, narradorId: string, o: { genero: Genero; idioma?: Idioma; equivalencias: Equivalencias }): Promise<PlanDePase> {
  const { data, error } = await db.from('narradores').select('*').eq('id', narradorId).maybeSingle();
  if (error) throw new Error(`No pude leer el narrador ${narradorId}: ${error.message}`);
  if (!data) throw new Error(`No existe el narrador ${narradorId}.`);
  const n = data as NarradorV3;
  if (n.contexto?.modo === 'viaje') throw new Error(`${narradorId} es de la Vitácora de Viaje: sigue por su flujo.`);
  if (!['acepto', 'activo', 'pausado'].includes(n.estado)) throw new Error(`${narradorId} está '${n.estado}': solo se pasan acepto, activo o pausado.`);
  if (await esNarradorV3(db, narradorId)) throw new Error(`${narradorId} ya tiene entrevista V3.`);
  const { data: respuestas, error: errorRespuestas } = await db.from('respuestas').select('id,pregunta_orden,transcripcion,texto_directo,recibido_at').eq('narrador_id', narradorId);
  if (errorRespuestas) throw new Error(`No pude leer las respuestas de ${narradorId}: ${errorRespuestas.message}`);
  const regala = await quienRegala(db, n.familia_id);
  return armarPase({
    narradorId,
    estadoNarrador: n.estado,
    diaActual: n.dia_actual,
    ultimaRespuestaAt: n.ultima_respuesta_at,
    idioma: o.idioma ?? idiomaDe(n.contexto),
    ficha: { nombre: n.como_le_dicen, genero: o.genero, ...(regala ? { quienRegala: regala } : {}) },
    guion: await guionDe(db, narradorId),
    respuestas: (respuestas as RespuestaVieja[] | null) ?? [],
    equivalencias: o.equivalencias,
  });
}

export async function aplicarPase(db: SupabaseClient, plan: PlanDePase): Promise<void> {
  const estado: EstadoV3 = {
    ...estadoInicial(plan.familia),
    respuestas: plan.cargadas.map((c) => [c.clave, c.texto] as [string, string]),
    ...(plan.ultimoEntranteAt ? { ultimoEntranteAt: plan.ultimoEntranteAt } : {}),
  };
  const creada = await crearFila(db, {
    narrador_id: plan.narradorId, idioma: plan.idioma, ficha: plan.ficha, estado,
    ultimo_audio_at: null, tanda_dia: null, tanda_cuenta: 0, migrada_de: plan.migradaDe,
  });
  if (creada === 'ya-existia') throw new Error(`${plan.narradorId} ya tiene entrevista V3: no se toca.`);
  for (const c of plan.cargadas) {
    const { error } = await db.from('respuestas').update({ clave_v3: c.clave }).in('id', c.respuestaIds);
    if (error) throw new Error(`No pude poner clave_v3 = ${c.clave}: ${error.message}`);
  }
  if (plan.estadoNarrador === 'acepto') {
    await db.from('narradores').update({ estado: 'activo' }).eq('id', plan.narradorId).eq('estado', 'acepto');
  }
}

/** Lo que muestra el dry-run: preguntas y cantidades, nunca lo que contó (no se copian vidas a la consola ni a los docs). */
export function describirPase(plan: PlanDePase): string {
  const l = [
    `Pase a la V3 de ${plan.narradorId} (${plan.estadoNarrador}, dia_actual ${plan.migradaDe.dia_actual}) — idioma ${plan.idioma}, género ${plan.ficha.genero}.`,
    `Se cargan ${plan.cargadas.length} respuestas viejas:`,
    ...plan.cargadas.map((c) => `  ${c.clave} ← orden${c.ordenes.length > 1 ? 'es' : ''} ${c.ordenes.join(', ')} (${c.palabras} palabras)`),
  ];
  if (plan.sinEquivalencia.length > 0) {
    l.push('Sin equivalencia (NO se cargan; quedan en respuestas sin clave_v3):');
    for (const s of plan.sinEquivalencia) l.push(`  orden ${s.orden}: «${s.pregunta}» (${s.respuestas} respuesta${s.respuestas > 1 ? 's' : ''})`);
  }
  if (plan.sinTexto.length > 0) l.push(`Sin texto (audio sin transcripción): órdenes ${plan.sinTexto.join(', ')}.`);
  l.push('No se le manda nada en el momento: la próxima pregunta sale en su tanda.');
  return l.join('\n');
}

export type ArgsPase = { narradorId: string; genero: Genero; idioma?: Idioma; aplicar: boolean; equivalencias?: string };

export function argumentosDePase(args: string[]): ArgsPase {
  const opcion = (nombre: string) => {
    const i = args.indexOf(nombre);
    return i >= 0 ? args[i + 1] : undefined;
  };
  const narradorId = args[0];
  if (!narradorId || narradorId.startsWith('--')) throw new Error('Uso: npm run v3-pasar -- <narrador> --genero varon|mujer|otro [--idioma es-AR|es-ES|ca] [--aplicar] [--equivalencias <ruta>]');
  const genero = opcion('--genero');
  if (!esGenero(genero)) throw new Error('Falta --genero varon|mujer|otro.');
  const idioma = opcion('--idioma');
  if (idioma !== undefined && !esIdioma(idioma)) throw new Error(`--idioma desconocido: ${idioma} (es-AR, es-ES o ca).`);
  const equivalencias = opcion('--equivalencias');
  return { narradorId, genero, ...(idioma ? { idioma } : {}), aplicar: args.includes('--aplicar'), ...(equivalencias ? { equivalencias } : {}) };
}

// ---------------------------------------------------------------- nuevos

async function familiaDe(db: SupabaseClient, narradorId: string): Promise<PreguntaFamilia[]> {
  const { data } = await db.from('preguntas').select('id,orden,texto,tipo').eq('narrador_id', narradorId).eq('tipo', 'familia').order('orden');
  return ((data as FilaGuion[] | null) ?? []).map((p) => ({ id: `F:${p.id}`, texto: p.texto }));
}

/** Crea la fila (si no está) y manda la primera tanda: OR1 con M1. Sin BIEN: ya recibió la bienvenida. */
export async function arrancarV3(deps: DepsV3, n: NarradorV3, idioma: Idioma, ficha: FichaFila, o: { ventanaAbierta: boolean }): Promise<void> {
  const ahora = deps.ahora();
  const hoy = fechaLocal(ahora, n.zona_horaria);
  const inicial: EstadoV3 = { ...estadoInicial(await familiaDe(deps.db, n.id)), ...(o.ventanaAbierta ? { ultimoEntranteAt: ahora.toISOString() } : {}) };
  await crearFila(deps.db, { narrador_id: n.id, idioma, ficha, estado: inicial, ultimo_audio_at: null, tanda_dia: null, tanda_cuenta: 0, migrada_de: null });
  await conReintento(deps.db, n.id, (f) => {
    if (f.tanda_dia !== null || f.estado.esperando || f.estado.respuestas.length > 0) return null; // ya arrancó
    const a = avanzar(f.estado, fichaTexto(f));
    return { cambio: { estado: { ...a.estado, tandaInicioAt: ahora.toISOString() }, tanda_dia: hoy, tanda_cuenta: a.abrio ? 1 : 0 }, resultado: true };
  });
  await deps.db.from('narradores').update({ estado: 'activo' }).eq('id', n.id).eq('estado', 'acepto');
  await drenar(deps, n.id);
}

export async function altaNuevo(deps: DepsV3, n: NarradorV3, o: { ventanaAbierta: boolean }): Promise<'mandada' | 'frenada'> {
  const genero = n.contexto?.genero;
  if (!esGenero(genero)) {
    await deps.avisar(`alta-sin-genero-${n.id}`, `Alta V3 frenada: ${n.como_le_dicen} no tiene género`,
      `${n.id} aceptó, pero contexto.genero no vino (varon | mujer | otro). No le sale nada hasta cargarlo: npm run v3-pasar -- ${n.id} --genero <varon|mujer|otro> --aplicar`);
    return 'frenada';
  }
  let idioma: Idioma;
  try {
    idioma = idiomaDe(n.contexto);
  } catch (err) {
    await deps.avisar(`alta-idioma-${n.id}`, `Alta V3 frenada: idioma desconocido para ${n.como_le_dicen}`, err instanceof Error ? err.message : String(err));
    return 'frenada';
  }
  const regala = await quienRegala(deps.db, n.familia_id);
  await arrancarV3(deps, n, idioma, { nombre: n.como_le_dicen, genero, ...(regala ? { quienRegala: regala } : {}) }, o);
  return 'mandada';
}
```

- [ ] **Step 5: El script `npm run v3-pasar`**

`entrevistador/scripts/cargar-entorno.ts`:

```ts
// Para los scripts: lee entrevistador/.env antes de importar nada que use la
// config (config.ts exige las variables al importarse). Nunca imprime valores.
// Las WA_* que falten se completan con un valor de relleno: estos scripts no
// mandan WhatsApp de verdad.

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

export function cargarEntorno(): void {
  try {
    for (const linea of readFileSync(fileURLToPath(new URL('../.env', import.meta.url)), 'utf8').split('\n')) {
      const m = linea.match(/^\s*([A-Z_][A-Z0-9_]*)\s*=\s*(.*)$/);
      if (m && !process.env[m[1]]) process.env[m[1]] = m[2].trim().replace(/^["']|["']$/g, '');
    }
  } catch {
    // Sin .env propio se usan las variables que ya estén en el entorno.
  }
  for (const v of ['WA_TOKEN', 'WA_PHONE_NUMBER_ID', 'WA_VERIFY_TOKEN']) if (!process.env[v]) process.env[v] = 'sin-whatsapp';
}
```

`entrevistador/scripts/v3-pasar.ts`:

```ts
// Pasa un narrador en curso a la entrevista V3 (spec 2026-10-07).
//
//   npm run v3-pasar -- <narrador> --genero varon|mujer|otro [--idioma es-AR|es-ES|ca] [--equivalencias <ruta>]
//       muestra lo que haría (no cambia nada)
//   npm run v3-pasar -- <narrador> --genero … --aplicar
//       crea la fila, carga las respuestas viejas en sus claves V3 y les pone clave_v3. No manda nada.
//
// La tabla de equivalencias (src/v3/equivalencias.json) la aprueba Naza ANTES de cualquier --aplicar.

import { readFileSync } from 'node:fs';
import { cargarEntorno } from './cargar-entorno.js';

cargarEntorno();
const { aplicarPase, argumentosDePase, describirPase, leerEquivalencias, planDePase } = await import('../src/v3/pasar.js');
const { db } = await import('../src/db/cliente.js');

try {
  const args = argumentosDePase(process.argv.slice(2));
  const equivalencias = leerEquivalencias(args.equivalencias ? JSON.parse(readFileSync(args.equivalencias, 'utf8')) : undefined);
  const plan = await planDePase(db, args.narradorId, { genero: args.genero, ...(args.idioma ? { idioma: args.idioma } : {}), equivalencias });
  console.log(describirPase(plan));
  if (!args.aplicar) {
    console.log('\nDry-run: no se cambió nada. Para aplicarlo, lo mismo con --aplicar.');
  } else if (Object.keys(equivalencias.porTexto).length === 0 && plan.sinEquivalencia.length > 0) {
    // Con la tabla vacía solo se puede pasar a quien no contestó nada todavía (o solo preguntas de la familia).
    throw new Error('La tabla de equivalencias está vacía y hay respuestas viejas: la arma la sesión principal y la aprueba Naza antes de aplicar.');
  } else {
    await aplicarPase(db, plan);
    console.log('\nAplicado: la próxima pregunta le sale en su tanda (a su hora preferida).');
  }
} catch (err) {
  console.error(`ERROR: ${err instanceof Error ? err.message : String(err)}`);
  process.exit(1);
}
```

En `entrevistador/package.json`, en `"scripts"`:

```json
    "v3-copiar-nucleo": "tsx scripts/v3-copiar-nucleo.ts",
    "v3-pasar": "tsx scripts/v3-pasar.ts"
```

- [ ] **Step 6: Correr y ver que pasan; todo; tipos**

Run: `cd entrevistador && npx vitest run test/v3/pasar.test.ts test/v3/alta-hook.test.ts && npx vitest run && npx tsc --noEmit -p tsconfig.check.json`
Expected: PASS y sin errores.

- [ ] **Step 7: Commit**

```bash
git add entrevistador/src/v3/pasar.ts entrevistador/src/v3/equivalencias.json entrevistador/scripts/cargar-entorno.ts entrevistador/scripts/v3-pasar.ts entrevistador/src/config.ts entrevistador/src/flujo/preguntar.ts entrevistador/package.json entrevistador/test/v3/pasar.test.ts entrevistador/test/v3/alta-hook.test.ts
git commit -m "entrevistador V3: el pase de los narradores en curso (con dry-run) y el alta de los nuevos detrás de V3_PARA_NUEVOS

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 12: Fábrica — el candado del libro viejo y el lector `de-base.ts`

**Files:**
- Create: `fabrica/src/v3/candado.ts`
- Create: `fabrica/src/escritor/material/de-base.ts`
- Modify: `fabrica/src/worker.ts:1-21` (imports), `:147-187` (`generarAnticiposFaltantes`), `:244-266` (`generarEstructurasFaltantes`), `:275-302` (`generarPrevisualizacionesFaltantes`), `:649-780` (`procesarPedidosPagados`, el `for` de la línea 739)
- Modify: `fabrica/src/libro/generar-paquete.ts:78`, `fabrica/src/libro/anticipo.ts:110`, `fabrica/src/libro/previsualizar.ts:95`
- Modify (mock del candado): `fabrica/test/worker.test.ts`, `fabrica/test/anticipo-worker.test.ts`, `fabrica/test/anticipo.test.ts`, `fabrica/test/generar-paquete.test.ts`, `fabrica/test/previsualizar.test.ts`
- Test: `fabrica/test/v3-candado.test.ts`, `fabrica/test/v3-de-base.test.ts`, y un `describe` nuevo en `fabrica/test/anticipo-worker.test.ts`

**Interfaces:**
- Consumes: `descargarTextoOpcional`, `subirTexto` (`fabrica/src/libro/comun.ts`); `cargarConfig` (`fabrica/src/config.ts`); `aMaterial`, `EstadoEntrevista` (`fabrica/src/escritor/material/de-entrevista.ts`); `idiomaDe` (`fabrica/src/v3/entrevista/idioma.ts`); `sumarAudio` (`fabrica/src/v3/entrevista/respuesta.ts`).
- Produces:
  - `candado.ts`: `const CANDADO_AVISO_V3 = 'v3_candado_avisado.txt'`, `function narradoresConV3(db: SupabaseClient): Promise<Set<string>>` (tabla ausente → vacío; otro error → tira), `class NarradorV3Error extends Error`, `function exigirSinV3(db: SupabaseClient, narradorId: string, donde: string): Promise<void>`, `function avisarCandadoV3(db: SupabaseClient, narradorId: string, donde: string, o?: { fetch?: typeof fetch }): Promise<void>` (una vez por narrador; nunca tira).
  - `de-base.ts`: `const MARCA_FOTO = '⟦foto⟧'`, `type FilaEntrevistaV3`, `type AudioV3 = { clave: string; audioPath: string | null; transcripcion: string | null; recibidoAt: string }`, `type EntrevistaDeBase = EstadoEntrevista & { audios: AudioV3[] }`, `function entrevistaDeFila(fila: FilaEntrevistaV3): EstadoEntrevista`, `function leerEntrevistaV3(db: SupabaseClient, narradorId: string): Promise<EntrevistaDeBase | null>`.

Reglas:
- El worker lee `narradoresConV3` **antes** de cada rama que arma algo del libro viejo (anticipo, estructura, previsualización, pedidos pagados) y saltea a esos narradores avisando una vez a los socios. Si no puede leer la tabla (error que no sea "no existe"), **esa rama no corre ese tick** (mejor no armar nada que pagarle al modelo un libro viejo de un narrador V3).
- `generarPaquete`, `generarAnticipo` y `generarPrevisualizacion` también se niegan solas (`exigirSinV3`), por si alguien las llama a mano: `generarPaquete` cae en su `catch` y deja el pedido `fallido` con el motivo a la vista.
- Los mails de cierre (`avisarHitosDeCierre`, "terminado") **siguen**: son el "mail de hito que ya existe" del spec para cuando el narrador termina.
- Enchufar el escritor nuevo al worker **no** es de este trabajo (lo hace el chat del escritor, `docs/v5/escritor-fabrica/`). `de-base.ts` queda listo y probado para eso.

- [ ] **Step 1: Escribir los tests que fallan**

`fabrica/test/v3-candado.test.ts`:

```ts
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

vi.mock('../src/config.js', () => ({ cargarConfig: () => ({ resendApiKey: 'clave-prueba', urlBase: 'https://www.vitacorafamiliar.com' }) }));

import { avisarCandadoV3, exigirSinV3, narradoresConV3, NarradorV3Error } from '../src/v3/candado.js';

function dbFalsa(o: { filas?: { narrador_id: string }[]; error?: { code: string; message: string }; archivos?: Set<string> } = {}) {
  const archivos = o.archivos ?? new Set<string>();
  const subidos: string[] = [];
  const db = {
    from: () => {
      const filtros: [string, unknown][] = [];
      const resultado = () => (o.error ? { data: null, error: o.error } : { data: (o.filas ?? []).filter((f: any) => filtros.every(([c, v]) => f[c] === v)), error: null });
      const q: any = {
        select: () => q,
        eq: (c: string, v: unknown) => { filtros.push([c, v]); return q; },
        maybeSingle: async () => { const r = resultado(); return r.error ? r : { data: r.data![0] ?? null, error: null }; },
        then: (ok: any, ko: any) => Promise.resolve(resultado()).then(ok, ko),
      };
      return q;
    },
    storage: {
      from: () => ({
        download: async (ruta: string) => (archivos.has(ruta) ? { data: new Blob(['ya']), error: null } : { data: null, error: { message: 'Object not found' } }),
        upload: async (ruta: string) => { archivos.add(ruta); subidos.push(ruta); return { error: null }; },
      }),
    },
  };
  return { db: db as any, subidos };
}

beforeEach(() => {
  vi.spyOn(console, 'warn').mockImplementation(() => {});
  vi.spyOn(console, 'error').mockImplementation(() => {});
});
afterEach(() => {
  vi.unstubAllEnvs();
  vi.restoreAllMocks();
});

describe('el candado V3 de la fábrica', () => {
  it('narradoresConV3: los de la tabla; sin la migración, ninguno; con otro error, tira', async () => {
    expect(await narradoresConV3(dbFalsa({ filas: [{ narrador_id: 'n1' }] }).db)).toEqual(new Set(['n1']));
    expect(await narradoresConV3(dbFalsa({ error: { code: '42P01', message: 'relation "entrevistas_v3" does not exist' } }).db)).toEqual(new Set());
    await expect(narradoresConV3(dbFalsa({ error: { code: '500', message: 'caída' } }).db)).rejects.toThrow(/entrevistas_v3/);
  });

  it('exigirSinV3 se niega con un narrador V3 y deja pasar a los demás', async () => {
    const { db } = dbFalsa({ filas: [{ narrador_id: 'n1' }] });
    await expect(exigirSinV3(db, 'n1', 'generarPaquete')).rejects.toBeInstanceOf(NarradorV3Error);
    await expect(exigirSinV3(db, 'n2', 'generarPaquete')).resolves.toBeUndefined();
    await expect(exigirSinV3(dbFalsa({ error: { code: '42P01', message: 'does not exist' } }).db, 'n1', 'x')).resolves.toBeUndefined();
  });

  it('avisa a los socios una sola vez por narrador (candado en el paquete)', async () => {
    vi.stubEnv('MAIL_SOCIOS', 'uno@ejemplo.com');
    const fetch = vi.fn(async () => new Response('{}', { status: 200 }));
    const falsa = dbFalsa();
    await avisarCandadoV3(falsa.db, 'n1', 'anticipo', { fetch });
    await avisarCandadoV3(falsa.db, 'n1', 'estructura', { fetch });
    expect(fetch).toHaveBeenCalledTimes(1);
    expect(falsa.subidos).toEqual(['n1/paquete/v3_candado_avisado.txt']);
  });

  it('si Resend rechaza, no deja el candado (reintenta el próximo tick) y no tira', async () => {
    vi.stubEnv('MAIL_SOCIOS', 'uno@ejemplo.com');
    const falsa = dbFalsa();
    await avisarCandadoV3(falsa.db, 'n1', 'anticipo', { fetch: vi.fn(async () => new Response('no', { status: 500 })) });
    expect(falsa.subidos).toEqual([]);
  });
});
```

`fabrica/test/v3-de-base.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { entrevistaDeFila, leerEntrevistaV3, MARCA_FOTO, type FilaEntrevistaV3 } from '../src/escritor/material/de-base.js';
import { aMaterial } from '../src/escritor/material/de-entrevista.js';

const fila = (extra: Partial<FilaEntrevistaV3['estado']> = {}, idioma = 'es-AR'): FilaEntrevistaV3 => ({
  narrador_id: 'n1',
  idioma,
  ficha: { nombre: 'Prueba', genero: 'mujer', quienRegala: 'Laura' },
  estado: {
    respuestas: [['OR1', 'Nací en un pueblo chico y mi mamá cosía para afuera.'], ['FO1', `${MARCA_FOTO} Es el día de mi casamiento, con mis hermanas.`]],
    familia: [{ id: 'F:pf1', texto: '¿Qué te acordás de la abuela?' }],
    charla: [],
    ...extra,
  },
});

function dbFalsa(tablas: Record<string, any[]>) {
  return {
    from: (tabla: string) => {
      const filtros: ((f: any) => boolean)[] = [];
      const lista = () => (tablas[tabla] ?? []).filter((f) => filtros.every((p) => p(f)));
      const q: any = {
        select: () => q,
        eq: (c: string, v: unknown) => { filtros.push((f) => f[c] === v); return q; },
        not: (c: string) => { filtros.push((f) => f[c] != null); return q; },
        order: () => q,
        maybeSingle: async () => ({ data: lista()[0] ?? null, error: null }),
        then: (ok: any, ko: any) => Promise.resolve({ data: lista(), error: null }).then(ok, ko),
      };
      return q;
    },
  } as any;
}

describe('el lector de la entrevista V3 desde la base', () => {
  it('devuelve el formato de de-entrevista.ts, sin la marca de la foto', () => {
    const e = entrevistaDeFila(fila());
    expect(e.ficha).toEqual({ nombre: 'Prueba', genero: 'mujer', quienRegala: 'Laura' });
    expect(e.respuestas[1]).toEqual(['FO1', 'Es el día de mi casamiento, con mis hermanas.']);
    expect(e.familia).toEqual([{ id: 'F:pf1', texto: '¿Qué te acordás de la abuela?' }]);
    const filas = aMaterial(e);
    expect(filas.map((f) => [f.preguntaId, f.paso])).toEqual([['OR1', false], ['FO1', false]]);
  });

  it('en catalán la ficha lleva el idioma', () => {
    expect(entrevistaDeFila(fila({}, 'ca')).ficha).toMatchObject({ idioma: 'ca' });
  });

  it('lo que estaba contando y no se cerró (cierre anticipado) también entra', () => {
    const abierta = entrevistaDeFila(fila({ esperando: 'OR2', borrador: 'La historia del abuelo que llegó en barco.' }));
    expect(abierta.respuestas.at(-1)).toEqual(['OR2', 'La historia del abuelo que llegó en barco.']);
    const conSi = entrevistaDeFila(fila({ respuestas: [['CA6', '⟦botón:Sí, tuve⟧']], esperando: 'CA6', tocoSi: true, borrador: 'Éramos cuatro.' }));
    expect(conSi.respuestas).toEqual([['CA6', '⟦botón:Sí, tuve⟧ Éramos cuatro.']]);
  });

  it('una foto sin nada contado queda como paso (la imagen no está en el material)', () => {
    const e = entrevistaDeFila(fila({ respuestas: [['FO1', MARCA_FOTO]] }));
    expect(aMaterial(e)[0]).toMatchObject({ preguntaId: 'FO1', paso: true });
  });

  it('lee la fila y los audios con clave V3; sin fila, null', async () => {
    const db = dbFalsa({
      entrevistas_v3: [fila()],
      respuestas: [
        { narrador_id: 'n1', clave_v3: 'OR1', audio_path: 'n1/dia_01.ogg', transcripcion: 'Nací…', recibido_at: '2026-10-08T13:00:00Z' },
        { narrador_id: 'n1', clave_v3: null, audio_path: 'n1/dia_02.ogg', transcripcion: 'vieja', recibido_at: '2026-10-01T13:00:00Z' },
      ],
    });
    const e = await leerEntrevistaV3(db, 'n1');
    expect(e?.audios).toEqual([{ clave: 'OR1', audioPath: 'n1/dia_01.ogg', transcripcion: 'Nací…', recibidoAt: '2026-10-08T13:00:00Z' }]);
    expect(await leerEntrevistaV3(db, 'n2')).toBeNull();
  });
});
```

En `fabrica/test/anticipo-worker.test.ts`: agregar a `vi.hoisted` `narradoresConV3Mock: vi.fn()` y `avisarCandadoV3Mock: vi.fn()`; agregar

```ts
vi.mock('../src/v3/candado.js', () => ({ narradoresConV3: narradoresConV3Mock, avisarCandadoV3: avisarCandadoV3Mock, exigirSinV3: vi.fn(async () => undefined) }));
```

en el `beforeEach`, `narradoresConV3Mock.mockResolvedValue(new Set());` y `avisarCandadoV3Mock.mockResolvedValue(undefined);`, y al final:

```ts
describe('candado V3 (spec 2026-10-07)', () => {
  it('a un narrador con entrevista V3 no se le arma el anticipo viejo; se avisa a los socios', async () => {
    narradoresConV3Mock.mockResolvedValue(new Set(['n1']));
    obtenerClienteDbMock.mockReturnValue(construirDb({ archivos: [], respuestas: 12 }));
    await tick();
    expect(generarAnticipoMock).not.toHaveBeenCalled();
    expect(enviarMailAnticipoMock).not.toHaveBeenCalled();
    expect(avisarCandadoV3Mock).toHaveBeenCalledWith(expect.anything(), 'n1', 'anticipo');
  });

  it('si no se puede leer entrevistas_v3, ese tick no arma nada (no le paga al modelo a ciegas)', async () => {
    narradoresConV3Mock.mockRejectedValue(new Error('No pude leer entrevistas_v3: caída'));
    obtenerClienteDbMock.mockReturnValue(construirDb({ archivos: [], respuestas: 12 }));
    await tick();
    expect(generarAnticipoMock).not.toHaveBeenCalled();
  });
});
```

En `fabrica/test/worker.test.ts`, `fabrica/test/anticipo.test.ts`, `fabrica/test/generar-paquete.test.ts` y `fabrica/test/previsualizar.test.ts`, agregar junto a los otros `vi.mock` (los fakes de base de esos archivos no conocen la tabla nueva; sin V3 todo sigue igual):

```ts
vi.mock('../src/v3/candado.js', () => ({
  narradoresConV3: vi.fn(async () => new Set<string>()),
  avisarCandadoV3: vi.fn(async () => undefined),
  exigirSinV3: vi.fn(async () => undefined),
}));
```

- [ ] **Step 2: Correr y ver que fallan**

Run: `cd fabrica && npx vitest run test/v3-candado.test.ts test/v3-de-base.test.ts test/anticipo-worker.test.ts`
Expected: FAIL (`Failed to load url ../src/v3/candado.js`, `../src/escritor/material/de-base.js`).

- [ ] **Step 3: Implementar `candado.ts`**

`fabrica/src/v3/candado.ts`:

```ts
// El candado de la entrevista V3 (spec 2026-10-07, "Fábrica"): un narrador
// con fila en `entrevistas_v3` contestó el banco nuevo, que el libro viejo no
// sabe leer (sus `respuestas.pregunta_orden` son números de llegada). La
// fábrica no le arma nada viejo —anticipo, estructura, previsualización ni
// paquete— y avisa a los socios una vez. El escritor V3 lo enchufa el chat del
// escritor (docs/v5/escritor-fabrica/).

import type { SupabaseClient } from '@supabase/supabase-js';
import { cargarConfig } from '../config.js';
import { descargarTextoOpcional, subirTexto } from '../libro/comun.js';

export const CANDADO_AVISO_V3 = 'v3_candado_avisado.txt';
const REMITENTE = process.env.MAIL_FROM ?? 'Vitácora Familiar <hola@vitacorafamiliar.com>';

function esTablaAusente(error: { code?: string; message?: string } | null): boolean {
  if (!error) return false;
  return error.code === '42P01' || error.code === 'PGRST205' || /does not exist|could not find the table/i.test(error.message ?? '');
}

/** Los narradores con entrevista V3. Sin la tabla (migración sin aplicar), ninguno; con otro error, tira. */
export async function narradoresConV3(db: SupabaseClient): Promise<Set<string>> {
  const { data, error } = await db.from('entrevistas_v3').select('narrador_id');
  if (error) {
    if (esTablaAusente(error)) return new Set();
    throw new Error(`No pude leer entrevistas_v3: ${error.message}`);
  }
  return new Set(((data as { narrador_id: string }[] | null) ?? []).map((f) => f.narrador_id));
}

export class NarradorV3Error extends Error {
  constructor(readonly narradorId: string, donde: string) {
    super(`${donde}: ${narradorId} tiene entrevista V3; el libro viejo no se arma (spec 2026-10-07).`);
    this.name = 'NarradorV3Error';
  }
}

export async function exigirSinV3(db: SupabaseClient, narradorId: string, donde: string): Promise<void> {
  const { data, error } = await db.from('entrevistas_v3').select('narrador_id').eq('narrador_id', narradorId).maybeSingle();
  if (error) {
    if (esTablaAusente(error)) return;
    throw new Error(`${donde}: no pude saber si ${narradorId} tiene entrevista V3: ${error.message}`);
  }
  if (data) throw new NarradorV3Error(narradorId, donde);
}

/** Avisa a los socios (MAIL_SOCIOS) una vez por narrador; el candado queda solo si el mail salió (o si no hay a quién mandarlo). Nunca tira. */
export async function avisarCandadoV3(db: SupabaseClient, narradorId: string, donde: string, o: { fetch?: typeof fetch } = {}): Promise<void> {
  try {
    const ruta = `${narradorId}/paquete/${CANDADO_AVISO_V3}`;
    if ((await descargarTextoOpcional(db, ruta)) !== null) return;
    const detalle = `${narradorId} tiene entrevista V3. La fábrica saltea ${donde} y todo lo del libro viejo; el libro V3 lo enchufa el chat del escritor (docs/v5/escritor-fabrica/).`;
    console.warn(`candado V3: ${detalle}`);
    const { resendApiKey } = cargarConfig();
    const para = (process.env.MAIL_SOCIOS ?? '').split(',').map((s) => s.trim()).filter(Boolean);
    if (resendApiKey && para.length > 0) {
      const r = await (o.fetch ?? fetch)('https://api.resend.com/emails', {
        method: 'POST',
        headers: { Authorization: `Bearer ${resendApiKey}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ from: REMITENTE, to: para, subject: `[Vitácora V3] La fábrica no arma el libro viejo de ${narradorId}`, text: detalle }),
      });
      if (!r.ok) {
        console.error(`candado V3: Resend rechazó el aviso de ${narradorId} (${r.status}); se reintenta el próximo tick.`);
        return;
      }
    }
    await subirTexto(db, ruta, new Date().toISOString(), 'text/plain');
  } catch (err) {
    console.error(`candado V3: no pude avisar por ${narradorId}:`, err instanceof Error ? err.message : err);
  }
}
```

- [ ] **Step 4: Implementar `de-base.ts`**

`fabrica/src/escritor/material/de-base.ts`:

```ts
// Lee una entrevista V3 de WhatsApp desde la base (entrevistas_v3 + respuestas)
// y la devuelve con el formato que espera de-entrevista.ts ({ficha, familia,
// respuestas, charla}), el mismo del estado.json de la página web y de las
// simulaciones. Spec 2026-10-07, "Fábrica". Genérico: no tiene datos de nadie.
//
// Además del formato: saca la marca de la foto de FO1 (⟦foto⟧, la imagen no
// está en el material), suma lo que estaba contando y no se cerró (si la
// familia cerró antes) y devuelve los audios con su clave V3 (para «Su voz»).

import type { SupabaseClient } from '@supabase/supabase-js';
import { idiomaDe } from '../../v3/entrevista/idioma.js';
import { sumarAudio } from '../../v3/entrevista/respuesta.js';
import type { EstadoEntrevista } from './de-entrevista.js';

/** La misma marca que entrevistador/src/v3/tipos.ts. */
export const MARCA_FOTO = '⟦foto⟧';

export type FilaEntrevistaV3 = {
  narrador_id: string;
  idioma: string;
  ficha: { nombre: string; genero: 'varon' | 'mujer' | 'otro'; formaTrato?: 'masculino' | 'femenino'; quienRegala?: string };
  estado: {
    respuestas: [string, string][];
    familia?: { id: string; texto: string }[];
    charla?: unknown[];
    esperando?: string;
    tocoSi?: boolean;
    borrador?: string;
  };
};

export type AudioV3 = { clave: string; audioPath: string | null; transcripcion: string | null; recibidoAt: string };
export type EntrevistaDeBase = EstadoEntrevista & { audios: AudioV3[] };

const sinMarcaFoto = (r: string) => r.replace(MARCA_FOTO, '').trim();

export function entrevistaDeFila(fila: FilaEntrevistaV3): EstadoEntrevista {
  const idioma = idiomaDe({ idioma: fila.idioma });
  const f = fila.ficha;
  const ficha = {
    nombre: f.nombre,
    genero: f.genero,
    ...(f.formaTrato ? { formaTrato: f.formaTrato } : {}),
    ...(f.quienRegala ? { quienRegala: f.quienRegala } : {}),
    ...(idioma !== 'es-AR' ? { idioma } : {}),
  };
  const respuestas: [string, string][] = fila.estado.respuestas.map(([k, r]) => [k, sinMarcaFoto(r)]);
  const abierta = sinMarcaFoto(fila.estado.borrador ?? '');
  if (fila.estado.esperando && abierta) {
    const ultima = respuestas.at(-1);
    if (fila.estado.tocoSi && ultima && ultima[0] === fila.estado.esperando) ultima[1] = sumarAudio(ultima[1], abierta);
    else respuestas.push([fila.estado.esperando, abierta]);
  }
  return {
    ficha,
    familia: fila.estado.familia ?? [],
    respuestas,
    charla: (fila.estado.charla ?? []) as NonNullable<EstadoEntrevista['charla']>,
  };
}

export async function leerEntrevistaV3(db: SupabaseClient, narradorId: string): Promise<EntrevistaDeBase | null> {
  const { data, error } = await db.from('entrevistas_v3').select('narrador_id,idioma,ficha,estado').eq('narrador_id', narradorId).maybeSingle();
  if (error) throw new Error(`No pude leer la entrevista V3 de ${narradorId}: ${error.message}`);
  if (!data) return null;
  const { data: filas, error: errorRespuestas } = await db.from('respuestas')
    .select('clave_v3,audio_path,transcripcion,recibido_at')
    .eq('narrador_id', narradorId)
    .not('clave_v3', 'is', null)
    .order('recibido_at', { ascending: true });
  if (errorRespuestas) throw new Error(`No pude leer las respuestas de ${narradorId}: ${errorRespuestas.message}`);
  const audios = ((filas as { clave_v3: string; audio_path: string | null; transcripcion: string | null; recibido_at: string }[] | null) ?? [])
    .map((r) => ({ clave: r.clave_v3, audioPath: r.audio_path, transcripcion: r.transcripcion, recibidoAt: r.recibido_at }));
  return { ...entrevistaDeFila(data as FilaEntrevistaV3), audios };
}
```

- [ ] **Step 5: El candado en el worker y en las tres funciones**

En `fabrica/src/worker.ts`, agregar a los imports:

```ts
import { avisarCandadoV3, narradoresConV3 } from './v3/candado.js';
```

y un helper (después de los imports, junto a las constantes):

```ts
/**
 * Los narradores con entrevista V3 (spec 2026-10-07): la fábrica no les arma
 * nada viejo. Null si no se pudo leer: la rama que llama no corre este tick.
 */
async function conV3OFrenar(db: Db, rama: string): Promise<Set<string> | null> {
  try {
    return await narradoresConV3(db);
  } catch (err) {
    console.error(`tick: no pude leer entrevistas_v3; la rama '${rama}' no corre este tick:`, err);
    return null;
  }
}
```

En `generarAnticiposFaltantes` (147-187), después del bloque que lee los narradores (`if (error) { … return; }`):

```ts
  const v3 = await conV3OFrenar(db, 'anticipo');
  if (!v3) return;
```

y como primera línea dentro del `try` del `for`:

```ts
      if (v3.has(narrador.id)) {
        await avisarCandadoV3(db, narrador.id, 'anticipo');
        continue;
      }
```

Igual en `generarEstructurasFaltantes` (244-266, rama `'estructura'`) y en `generarPrevisualizacionesFaltantes` (275-302, rama `'previsualizacion'`). En `procesarPedidosPagados`, antes del `for (const pedido of pedidosPagados)` (línea 739):

```ts
  const v3 = await conV3OFrenar(db, 'pedidos');
  if (!v3) return;
```

y como primera línea del `for`:

```ts
    if (v3.has(pedido.narrador_id)) {
      await avisarCandadoV3(db, pedido.narrador_id, 'paquete');
      continue;
    }
```

En `fabrica/src/libro/generar-paquete.ts`, después de `const narradorId = pedido.narrador_id;` (línea 78, dentro del `try`):

```ts
    await exigirSinV3(db, narradorId, 'generarPaquete');
```

En `fabrica/src/libro/anticipo.ts`, después de `const db = obtenerClienteDb();` (línea 110):

```ts
  await exigirSinV3(db, narradorId, 'generarAnticipo');
```

En `fabrica/src/libro/previsualizar.ts`, después de `const db = obtenerClienteDb();` (línea 95):

```ts
  await exigirSinV3(db, narradorId, 'generarPrevisualizacion');
```

con `import { exigirSinV3 } from '../v3/candado.js';` en los tres.

- [ ] **Step 6: Correr y ver que pasan; toda la fábrica; tipos**

Run: `cd fabrica && npx vitest run test/v3-candado.test.ts test/v3-de-base.test.ts test/anticipo-worker.test.ts && npx vitest run && npx tsc --noEmit -p .`
Expected: PASS y sin errores.

- [ ] **Step 7: Commit**

```bash
git add fabrica/src/v3/candado.ts fabrica/src/escritor/material/de-base.ts fabrica/src/worker.ts fabrica/src/libro/generar-paquete.ts fabrica/src/libro/anticipo.ts fabrica/src/libro/previsualizar.ts fabrica/test/v3-candado.test.ts fabrica/test/v3-de-base.test.ts fabrica/test/anticipo-worker.test.ts fabrica/test/worker.test.ts fabrica/test/anticipo.test.ts fabrica/test/generar-paquete.test.ts fabrica/test/previsualizar.test.ts
git commit -m "fábrica: candado para no armar el libro viejo de un narrador V3, y el lector de la entrevista V3 desde la base

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 13: La simulación de punta a punta (`npm run v3-simular`)

**Files:**
- Create: `entrevistador/scripts/v3-simular.ts`
- Modify: `entrevistador/package.json` (scripts)
- Test: `entrevistador/test/v3/simulacion.test.ts`

**Interfaces:**
- Consumes: `arrancarV3` (Task 11); `procesarEntranteV3` (Task 9); `trabajarNarrador` (Task 10); `esperarCazas`, `clienteCazador` (Task 6); `leerFila` (Task 3); `DepsV3` (Task 3); `cargarEntorno` (Task 11); núcleo `botonesDeClave`, `preguntaPorId`, `leerBoton`, `VIDAS_EJEMPLO`, `IDIOMAS`, `Idioma`.
- Produces:
  - `const GENERICA: Readonly<Record<Idioma, string>>` (respuestas inventadas del narrador simulado, por idioma)
  - `type RespuestaSimulada = { boton: string } | { audio: string }`; `function respuestaSimulada(id: string, idioma: Idioma, tocoSi: boolean): RespuestaSimulada`
  - `type ResultadoSimulacion = { idioma: Idioma; terminada: boolean; completado: boolean; pasos: number; mensajes: number; botones: number; audios: number; repreguntas: number; gastoCazadorUsd: number }`
  - `function simularEntrevista(deps: DepsV3, n: NarradorV3, o: { idioma: Idioma; pasar: (ms: number) => void; maxPasos?: number }): Promise<ResultadoSimulacion>`
  - `function charlaMd(fila: FilaV3): string`
  - Script: `npm run v3-simular -- [--idioma es-AR|es-ES|ca|todos] [--cazador] [--dejar]`.

Qué hace (spec, "Pruebas" 2): corre la entrevista entera por el código de verdad (`arrancarV3` → `procesarEntranteV3` → `trabajarNarrador` → `drenar`), con WhatsApp falso (anota lo que saldría) y "audios" que son texto (el `mediaId` es el texto; no se gasta transcripción). El reloj es simulado: después de cada respuesta pasan 4 minutos y corre el tick. El narrador es inventado ("Prueba V3", ritmo `seguido` para no esperar días) y contesta con la vida inventada de `vidas-ejemplo.ts` en es-AR (tocando los botones de verdad) y con una respuesta genérica en es-ES y ca. **Contra la base real** con `main` (crea la familia y el narrador "Prueba V3" y los borra al final salvo `--dejar`); **contra la base falsa** en el test. El cazador está apagado salvo `--cazador`, que corre solo en es-AR y avisa el costo antes (Opus 5.5, hasta USD 3).

**Antes de correrla contra la base real** (no lo hace el implementador: lo decide la sesión principal con Naza): la migración aplicada y la fábrica con el candado (Task 12) ya desplegada, para que el worker de Railway no le arme un anticipo viejo a "Prueba V3" mientras corre.

- [ ] **Step 1: Escribir el test que falla**

`entrevistador/test/v3/simulacion.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { crearBaseFalsa } from './base-falsa.js';
import { depsDePrueba } from './deps-prueba.js';
import { charlaMd, respuestaSimulada, simularEntrevista } from '../../scripts/v3-simular.js';
import { leerFila } from '../../src/v3/estado.js';
import type { NarradorV3 } from '../../src/v3/tipos.js';

const narrador = (idioma: string): NarradorV3 => ({
  id: `sim-${idioma}`, familia_id: 'f-sim', como_le_dicen: 'Prueba V3', telefono_whatsapp: `+000${idioma.length}`, hora_preferida: '22:00:00',
  zona_horaria: 'America/Argentina/Buenos_Aires', contexto: { ritmo: 'seguido', genero: 'varon', ...(idioma === 'es-AR' ? {} : { idioma }) },
  estado: 'acepto', dia_actual: 0, ultima_respuesta_at: null,
});

describe('la simulación de punta a punta (base y WhatsApp falsos)', () => {
  it.each(['es-AR', 'es-ES', 'ca'] as const)('una entrevista entera en %s termina y deja al narrador completado', async (idioma) => {
    const n = narrador(idioma);
    const base = crearBaseFalsa({ familias: [{ id: 'f-sim', nombre: 'Prueba' }], narradores: [{ ...n }] });
    const p = depsDePrueba(base);
    const r = await simularEntrevista(p.deps, n, { idioma, pasar: p.pasar, maxPasos: 600 });
    expect(r).toMatchObject({ idioma, terminada: true, completado: true });
    expect(r.audios).toBeGreaterThan(50);
    expect(p.enviados.length).toBeGreaterThan(50);
    expect(p.enviados.every((e) => e.tipo !== 'plantilla')).toBe(true); // contesta siempre dentro de las 24 h
    expect(p.avisos).toEqual([]);
    const fila = await leerFila(base.cliente, n.id);
    expect(fila?.estado.salientes).toEqual([]);
    expect(charlaMd(fila!)).toContain('**Narrador**');
    expect(base.tablas.respuestas.every((x) => x.clave_v3 !== null)).toBe(true);
  });

  it('en es-AR toca botones de verdad (la vida inventada tiene botones)', async () => {
    const n = narrador('es-AR');
    const base = crearBaseFalsa({ familias: [{ id: 'f-sim', nombre: 'Prueba' }], narradores: [{ ...n }] });
    const p = depsDePrueba(base);
    const r = await simularEntrevista(p.deps, n, { idioma: 'es-AR', pasar: p.pasar });
    expect(r.botones).toBeGreaterThan(0);
    expect(p.enviados.some((e) => e.tipo === 'botones')).toBe(true);
  });

  it('respuestaSimulada: FO1 se contesta con el botón de "no tengo foto"; después de "Sí", audio', () => {
    expect(respuestaSimulada('FO1', 'ca', false)).toEqual({ boton: 'No tinc cap foto' });
    expect(respuestaSimulada('CA6', 'es-AR', true)).toHaveProperty('audio');
  });
});
```

- [ ] **Step 2: Correr y ver que falla**

Run: `cd entrevistador && npx vitest run test/v3/simulacion.test.ts`
Expected: FAIL (`Failed to load url ../../scripts/v3-simular.js`).

- [ ] **Step 3: Implementar el script**

`entrevistador/scripts/v3-simular.ts`:

```ts
// Simulación de punta a punta de la entrevista V3 por WhatsApp (spec
// 2026-10-07, "Pruebas" 2). Corre el código de verdad con WhatsApp falso y
// "audios" que son texto: no gasta transcripción. Narrador INVENTADO
// ("Prueba V3"); nunca la vida de un narrador real.
//
//   npm run v3-simular -- [--idioma es-AR|es-ES|ca|todos] [--cazador] [--dejar]
//
// Va contra la BASE REAL: crea una familia y un narrador "Prueba V3" por
// idioma y los borra al terminar (salvo --dejar). --cazador GASTA PLATA
// (Opus 5.5, tope USD 3) y corre solo en es-AR. La charla de cada idioma
// queda en audios-crudos/v3-simulacion/<idioma>.md (fuera de git).

import { mkdirSync, writeFileSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import type { SupabaseClient } from '@supabase/supabase-js';
import { esperarCazas, clienteCazador } from '../src/v3/cazador.js';
import type { DepsV3 } from '../src/v3/deps.js';
import { procesarEntranteV3 } from '../src/v3/entrante.js';
import { leerFila } from '../src/v3/estado.js';
import { preguntaPorId } from '../src/v3/nucleo/entrevista/banco.js';
import { botonesDeClave } from '../src/v3/nucleo/entrevista/flujo.js';
import { IDIOMAS, esIdioma, type Idioma } from '../src/v3/nucleo/entrevista/idioma.js';
import { leerBoton } from '../src/v3/nucleo/entrevista/respuesta.js';
import { VIDAS_EJEMPLO } from '../src/v3/nucleo/entrevista/vidas-ejemplo.js';
import { arrancarV3 } from '../src/v3/pasar.js';
import { trabajarNarrador } from '../src/v3/reloj.js';
import type { FilaV3, NarradorV3 } from '../src/v3/tipos.js';
import { cargarEntorno } from './cargar-entorno.js';

/** Lo que "dice" el narrador simulado cuando la vida inventada no trae nada para esa pregunta. */
export const GENERICA: Readonly<Record<Idioma, string>> = {
  'es-AR': 'Sí, fue una historia larga que te cuento con todos los detalles que me acuerdo.',
  'es-ES': 'Sí, fue una historia larga que te cuento con todos los detalles que recuerdo.',
  ca: 'Sí, va ser una història llarga que t’explico amb tots els detalls que recordo.',
};

export type RespuestaSimulada = { boton: string } | { audio: string };

export function respuestaSimulada(id: string, idioma: Idioma, tocoSi: boolean): RespuestaSimulada {
  if (tocoSi) return { audio: GENERICA[idioma] };
  const botones = botonesDeClave(id, idioma) ?? [];
  const deLaVida = idioma === 'es-AR' ? VIDAS_EJEMPLO[0].respuestas[id] : undefined;
  if (deLaVida !== undefined) {
    const { boton, resto } = leerBoton(deLaVida);
    if (boton !== undefined && !resto && botones.some((b) => b.texto === boton)) return { boton };
    return { audio: deLaVida };
  }
  const no = botones.find((b) => b.vale === 'no');
  if (preguntaPorId(id, idioma)?.clase === 'foto' && no) return { boton: no.texto };
  return { audio: GENERICA[idioma] };
}

export type ResultadoSimulacion = {
  idioma: Idioma; terminada: boolean; completado: boolean; pasos: number;
  mensajes: number; botones: number; audios: number; repreguntas: number; gastoCazadorUsd: number;
};

async function leerNarrador(db: SupabaseClient, id: string): Promise<NarradorV3> {
  const { data, error } = await db.from('narradores').select('*').eq('id', id).maybeSingle();
  if (error || !data) throw new Error(`simulación: no pude leer el narrador ${id}: ${error?.message ?? 'no existe'}`);
  return data as NarradorV3;
}

export async function simularEntrevista(deps: DepsV3, n: NarradorV3, o: { idioma: Idioma; pasar: (ms: number) => void; maxPasos?: number }): Promise<ResultadoSimulacion> {
  await arrancarV3(deps, n, o.idioma, { nombre: 'Prueba V3', genero: 'varon' }, { ventanaAbierta: true });
  let k = 0;
  let botones = 0;
  let audios = 0;
  let pasos = 0;
  for (; pasos < (o.maxPasos ?? 600); pasos++) {
    const fila = await leerFila(deps.db, n.id);
    if (!fila) throw new Error('simulación: no hay fila V3');
    if (fila.estado.terminada && fila.estado.salientes.length === 0) break;
    const id = fila.estado.esperando;
    if (id) {
      const r = respuestaSimulada(id, o.idioma, fila.estado.tocoSi === true);
      const waMessageId = `sim-${n.id}-${++k}`;
      const narrador = await leerNarrador(deps.db, n.id);
      if ('boton' in r) {
        botones++;
        await procesarEntranteV3(deps, narrador, { telefono: n.telefono_whatsapp, tipo: 'texto', texto: r.boton, esBoton: true, waMessageId });
      } else {
        audios++;
        await procesarEntranteV3(deps, narrador, { telefono: n.telefono_whatsapp, tipo: 'audio', mediaId: r.audio, waMessageId });
      }
    }
    o.pasar(4 * 60_000);
    await esperarCazas();
    await trabajarNarrador(deps, (await leerFila(deps.db, n.id))!, await leerNarrador(deps.db, n.id));
    await esperarCazas();
  }
  const final = (await leerFila(deps.db, n.id))!;
  return {
    idioma: o.idioma,
    terminada: final.estado.terminada,
    completado: (await leerNarrador(deps.db, n.id)).estado === 'completado',
    pasos,
    mensajes: final.estado.charla.filter((g) => g.de === 'bio').length,
    botones,
    audios,
    repreguntas: final.estado.repreguntas?.length ?? 0,
    gastoCazadorUsd: final.estado.cazador?.gastoUsd ?? 0,
  };
}

/** La charla para leerla: mensajes del biógrafo con sus IDs y lo que contestó. */
export function charlaMd(fila: FilaV3): string {
  const l = [`# Simulación V3 por WhatsApp: ${fila.ficha.nombre} (${fila.idioma})`, ''];
  for (const g of fila.estado.charla) {
    if (g.de === 'bloque') l.push(`## Bloque ${g.bloque} · ${g.nombre}`, '');
    else if (g.de === 'persona') l.push(`**Narrador** \`[${g.pregunta}]\`: ${g.texto}`, '');
    else l.push(`**Biógrafo** \`[${[...new Set(g.partes.map((p) => p.id))].join(' + ')}]\`:`, ...g.partes.map((p) => `> ${p.texto}`), ...(g.botones ? [`> [botones: ${g.botones.map((b) => `(${b})`).join(' ')}]`] : []), '');
  }
  return l.join('\n');
}

// ---------------------------------------------------------------- contra la base real

async function limpiar(db: SupabaseClient, narradorId: string, familiaId: string): Promise<void> {
  for (const carpeta of [narradorId, `${narradorId}/fotos`]) {
    const { data } = await db.storage.from('audios').list(carpeta);
    const rutas = ((data as { name: string }[] | null) ?? []).filter((a) => a.name.includes('.')).map((a) => `${carpeta}/${a.name}`);
    if (rutas.length > 0) await db.storage.from('audios').remove(rutas);
  }
  for (const tabla of ['respuestas', 'envios', 'fotos', 'entrevistas_v3']) await db.from(tabla).delete().eq('narrador_id', narradorId);
  await db.from('narradores').delete().eq('id', narradorId);
  await db.from('familias').delete().eq('id', familiaId);
}

async function main(args: string[]): Promise<void> {
  cargarEntorno();
  const { db } = await import('../src/db/cliente.js');
  const { cargarConfig } = await import('../src/config.js');
  const pedido = args.includes('--idioma') ? args[args.indexOf('--idioma') + 1] : 'todos';
  if (pedido !== 'todos' && !esIdioma(pedido)) throw new Error(`--idioma desconocido: ${pedido}`);
  const idiomas: readonly Idioma[] = pedido === 'todos' ? IDIOMAS : [pedido as Idioma];
  const conCazador = args.includes('--cazador');
  if (conCazador) console.log('OJO: --cazador GASTA PLATA (Opus 5.5, hasta USD 3 por entrevista). Corre solo en es-AR.');
  const salida = fileURLToPath(new URL('../../audios-crudos/v3-simulacion/', import.meta.url));
  mkdirSync(salida, { recursive: true });

  for (const idioma of idiomas) {
    let reloj = new Date();
    const deps: DepsV3 = {
      db,
      wa: {
        texto: async () => `sim.${Date.now()}`,
        botones: async () => `sim.${Date.now()}`,
        plantilla: async () => `sim.${Date.now()}`,
        descargar: async (mediaId) => Buffer.from(mediaId, 'utf8'),
      },
      transcribir: async (audio) => ({ texto: audio.toString('utf8'), duracionSegundos: 30 }),
      avisar: async (clave, asunto) => { console.log(`[aviso que saldría a los socios] ${clave}: ${asunto}`); },
      hito: async () => {},
      cazador: conCazador && idioma === 'es-AR' ? clienteCazador(cargarConfig().anthropicKey) : null,
      ahora: () => reloj,
    };
    const { data: familia, error: errorFamilia } = await db.from('familias')
      .insert({ email: `prueba-v3-${Date.now()}@vitacora.invalid`, nombre: 'Prueba V3', region: 'AR' }).select('id').single();
    if (errorFamilia) throw new Error(`No pude crear la familia de prueba: ${errorFamilia.message}`);
    const familiaId = (familia as { id: string }).id;
    const { data: creado, error: errorNarrador } = await db.from('narradores').insert({
      familia_id: familiaId, nombre: 'Prueba V3', como_le_dicen: 'Prueba V3', telefono_whatsapp: `+0${Date.now()}`,
      hora_preferida: '03:00', zona_horaria: 'America/Argentina/Buenos_Aires', estado: 'acepto',
      contexto: { ritmo: 'seguido', genero: 'varon', prueba: 'v3-simulacion', ...(idioma === 'es-AR' ? {} : { idioma }) },
    }).select('*').single();
    if (errorNarrador) {
      await db.from('familias').delete().eq('id', familiaId);
      throw new Error(`No pude crear el narrador de prueba: ${errorNarrador.message}`);
    }
    const n = creado as NarradorV3;
    try {
      const r = await simularEntrevista(deps, n, { idioma, pasar: (ms) => { reloj = new Date(reloj.getTime() + ms); } });
      console.log(JSON.stringify(r));
      const fila = await leerFila(db, n.id);
      if (fila) writeFileSync(`${salida}${idioma}.md`, charlaMd(fila), 'utf8');
    } finally {
      if (args.includes('--dejar')) console.log(`Quedó en la base: narrador ${n.id}, familia ${familiaId}.`);
      else await limpiar(db, n.id, familiaId);
    }
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main(process.argv.slice(2)).catch((err) => {
    console.error(`ERROR: ${err instanceof Error ? err.message : String(err)}`);
    process.exit(1);
  });
}
```

En `entrevistador/package.json`, en `"scripts"`:

```json
    "v3-pasar": "tsx scripts/v3-pasar.ts",
    "v3-simular": "tsx scripts/v3-simular.ts"
```

- [ ] **Step 4: Correr y ver que pasa; tipos (NO correr `npm run v3-simular`)**

Run: `cd entrevistador && npx vitest run test/v3/simulacion.test.ts && npx tsc --noEmit -p tsconfig.check.json`
Expected: PASS y sin errores. Si una simulación no termina en 600 pasos, el test dice en qué quedó (`terminada: false`): se mira `charlaMd` de la fila para ver dónde se trabó y se corrige el código (no el test).

- [ ] **Step 5: Commit**

```bash
git add entrevistador/scripts/v3-simular.ts entrevistador/package.json entrevistador/test/v3/simulacion.test.ts
git commit -m "entrevistador V3: simulación de punta a punta con WhatsApp falso, en los tres idiomas

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 14: Revisión final (verificación, sin código nuevo)

**Files:** ninguno nuevo. Si algo falla, se arregla en el archivo de la tarea que corresponde, con su test.

- [ ] **Step 1: Todo el entrevistador, tipos y build**

Run: `cd entrevistador && npm test && npm run build`
Expected: `tsc` limpio y todos los tests en verde (los 380 de antes + los de `test/v3/`). `dist/v3/nucleo/entrevista/*.json` existen.

- [ ] **Step 2: Toda la fábrica y tipos**

Run: `cd fabrica && npx vitest run && npx tsc --noEmit -p .`
Expected: todo verde y sin errores.

- [ ] **Step 3: La copia del núcleo sigue igual a la fábrica**

Run: `cd entrevistador && npx vitest run test/v3/copia-nucleo.test.ts test/v3/turno-igual-al-script.test.ts`
Expected: PASS (si alguien tocó la fábrica mientras tanto: `npm run v3-copiar-nucleo` y de nuevo).

- [ ] **Step 4: Nada viejo cambió para quien no tiene fila**

Run: `git diff main --stat -- entrevistador/src/flujo entrevistador/src/whatsapp entrevistador/src/ia`
Expected: solo los cambios de este plan (`procesar.ts`: la bifurcación; `scheduler.ts`: saltear V3, `tiempo.ts`, reloj V3; `preguntar.ts`: re-export de `ritmo.ts` y el enganche detrás de `V3_PARA_NUEVOS`; `fotos.ts`: re-export; `webhook.ts`: `esBoton`; `enviar.ts`: `enviarBotones` e idioma con default `'es'`; `transcribir.ts`: idioma con default `'es'`).

- [ ] **Step 5: Sin textos inventados para el narrador**

Run: `cd entrevistador && grep -rn "enviarTexto\|wa.texto\|wa.botones\|texto:" src/v3 --include=*.ts | grep -v nucleo`
Expected: todo texto que sale viene de `textoDelBanco(...)`, de la cola (`salientes`, que llena `turno.ts` desde el banco) o de `textoFijo(...)`. Ningún string literal dirigido al narrador.

- [ ] **Step 6: Commit (si hubo arreglos)**

```bash
git add -A entrevistador fabrica
git commit -m "entrevista V3 en WhatsApp: revisión final, todo verde

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

## Lo que queda fuera de este plan (para la sesión principal)

- **Llenar `entrevistador/src/v3/equivalencias.json`** con la tabla (texto de cada pregunta de la plantilla vieja → clave V3) y traérsela a Naza para aprobar. Sin eso, `npm run v3-pasar -- … --aplicar` no pasa a nadie con respuestas viejas.
- Aplicar la migración (Naza), revisar la rama con otro agente y con Joaquín, merge apagado, y la prueba real con el número de Naza (`docs/v3/entrevista/prueba-whatsapp.md`), en el orden del spec.
- Correr `npm run v3-simular` contra la base real (con el candado de la fábrica ya desplegado) y, si Naza lo aprueba con el costo, una vez con `--cazador`.
- Joaquín: cargar en Meta las plantillas de la tabla de abajo y marcar las aprobadas en `WA_PLANTILLAS_V3_LISTAS`; que la web mande `contexto.idioma` y `contexto.genero`; `MAIL_SOCIOS` en Railway (entrevistador y fábrica).

## Textos para aprobar por Naza

Todos se leen de un solo lugar; el código no tiene ninguno escrito.

| # | Texto | Dónde vive | Estado |
|---|---|---|---|
| 1 | Acuse de la **foto suelta** (no es FO1) en `ca` y en `es-ES`. En `es-AR` se usa el que ya manda hoy el flujo viejo: "📷 Guardada. Si querés, contame qué pasaba ahí." (estaba marcado "a revisar por Naza"). | `entrevistador/src/v3/textos-fijos.json` (`fotoSuelta`) | Sin texto en `ca`/`es-ES`: la foto se guarda y no se contesta nada. |
| 2 | **M8 a las 6 h**: el spec lo manda a las 6 h de la primera pregunta del día, pero el texto del banco dice "Pasaron unos días y quería saber cómo andás…" (y su "cuando" dice "a los pocos días sin respuesta"). O un texto nuevo para el recordatorio del mismo día, o M8 a los días. | `fabrica/src/v3/entrevista/banco*.json` (M8) — se cambia en el banco de la fábrica y se copia | Sale tal cual está hasta que Naza decida. |
| 3 | **M22** dice "…Y si te resulta más cómodo escribir, escribí nomás", pero el spec dice que un texto escrito no avanza y el plan no lo suma a la respuesta (no llega al libro). O el texto escrito cuenta como respuesta, o M22 deja de prometerlo. | banco (M22) | Sale tal cual; el texto queda en `respuestas.texto_directo` sin entrar a la entrevista. |
| 4 | Plantillas de Meta nuevas (las carga Joaquín, el cuerpo lo aprueba Naza): `pregunta_diaria_es_es` (es_ES) y `pregunta_diaria_ca` (ca), una variable con la pregunta; `recordatorio_es_es`, `recordatorio_ca` y **`recordatorio_vos`** (es), una variable con el nombre. `recordatorio_vos` hace falta porque la `recordatorio` aprobada está en usted ("Cuando tenga un ratito, me la manda") y la V3 no trata de usted a nadie. | Meta + `PLANTILLAS_V3` en `entrevistador/src/v3/enviar.ts` + `WA_PLANTILLAS_V3_LISTAS` | Sin aprobar: fuera de las 24 h no sale nada en ese idioma y se avisa a los socios. |
| 5 | La **bienvenida y la aceptación** de un narrador nuevo siguen siendo las viejas (plantilla `bienvenida` y `bienvenidaAceptacion`, en usted o vos según `tratoDe`, y solo en castellano). La V3 no manda BIEN porque el narrador ya está saludado. Para `ca`/`es-ES` y para no tratar de usted, hace falta decidir qué bienvenida reciben antes de OR1. | `entrevistador/src/manual/puro.ts` y la plantilla `bienvenida` | Fuera de este plan. |

## Cobertura del spec

| Spec | Tarea |
|---|---|
| Núcleo copiado + test de copia idéntica + `resolveJsonModule` | 1 |
| `entrevistas_v3`, `respuestas.clave_v3`, `respuestas.wa_message_id` único, CONTRATO | 2 |
| Compare-and-swap con `version`, toma `enviando_hasta` | 3 |
| Motor de turno (responder, tocarBoton, cerrarRespuesta, avanzar, cazarAlCerrar) | 4 |
| Ritmo por tandas (4 / 8 / sin tope), retoma al día siguiente | 5, 10 |
| Cazador en segundo plano, Opus 5.5, tope USD 3, costo registrado, nunca tira | 6 |
| Botones al último; ventana de 24 h; plantilla por idioma; sin plantilla → aviso y no se manda en otro idioma | 7 |
| Falla de envío: no se da por mandado, reintento, aviso a los 3 | 7 |
| AV11 y FIN sin esperar; `completado`; mail de hito existente | 4, 7 (el "terminado" lo manda la fábrica) |
| Duplicados por `wa_message_id`; audio → transcripción en su idioma (`ca` con su vocabulario); M23 | 8, 9 |
| Botón Sí → M30; No/Paso → cierra y avanza en el momento | 4, 9 |
| Texto → M22 (no avanza); pausado → reactiva y reenvía la abierta | 9 |
| Imagen: FO1 contestada / foto suelta como hoy | 8, 9 |
| Bifurcación antes de fotos, `manejarTexto` y Opus; sin fila, todo igual | 9, 10 |
| Reloj de 1 minuto: cierre por 3' de silencio, tanda a su hora, M8 a las 6 h, alerta de 3 días sin cambios | 10 |
| Pase con equivalencias aprobadas, dry-run, `--aplicar`, no manda nada | 11 |
| Alta de nuevos con `V3_PARA_NUEVOS` (apagado), idioma de `contexto.idioma`, sin género → frenar y avisar | 11 |
| Fábrica: candado (generar-paquete, anticipo, previsualizar, worker) + `de-base.ts` | 12 |
| Simulación de punta a punta en 3 idiomas, cazador con flag y aviso de costo | 13 |
| Todo verde, tipos limpios | 14 |
