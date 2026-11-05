# Revisión y dudas para quien contó: plan de implementación

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** que quien contó quite respuestas antes de la Etapa A y conteste las dudas por un link propio, y que quien regala solo vea cuántas faltan.

**Architecture:** tres servicios coordinados por marcas en Storage, en la carpeta del escritor. La fábrica espera antes de la Etapa A y filtra dudas; el entrevistador manda los WhatsApp; la web sirve la página con token firmado. Todo detrás de `DUDAS_AL_NARRADOR=1`.

**Tech Stack:** Node/TS con vitest en `fabrica/` y `entrevistador/`; Next.js en `web/` (leer `web/node_modules/next/dist/docs/` antes de escribir páginas); Supabase Storage.

**Spec:** `docs/superpowers/specs/2026-11-05-dudas-narrador-design.md`.

## Global Constraints

- Apagado (`DUDAS_AL_NARRADOR` distinto de `1`), todo se comporta exactamente como hoy, salvo el filtro y el modelo de las dudas, que valen siempre.
- Vale para V3 y Historia. Kids y Viaje no se tocan.
- Plazos: 2 días de revisión, recordatorio a las 48 horas del aviso de dudas, 3 días de plazo de dudas.
- Un libro nunca queda trabado por un mensaje que no salió.
- No hay migraciones: `respuestas_fuera.marcada_por` ya admite null.
- Commits en castellano rioplatense, terminados en `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`.
- Los textos para personas van como están acá y Naza los aprueba al final. Sin dos puntos ni oraciones que empiecen con «Y».
- Nunca imprimir secretos. No correr nada contra producción ni pagar llamadas: las pruebas usan dobles.
- Comandos: `cd fabrica && npx vitest run`, `cd entrevistador && npx vitest run`, `cd web && npx vitest run`, y en cada uno `npx tsc --noEmit -p .`. Si faltan `node_modules`, correr `npm ci` en esa carpeta.

## Marcas compartidas (Storage, `audios/{id}/escritor/` o `escritor-historia/`)

| Archivo | Lo escribe | Contenido |
|---|---|---|
| `revision-vista.txt` | fábrica | ISO: la primera vez que vio la entrevista terminada sin Etapa A |
| `revision-avisada.txt` | entrevistador | ISO: salió el mensaje del momento 1 |
| `revision-lista.txt` | web | ISO: tocó «Listo» |
| `dudas-narrador-avisadas.txt` | entrevistador | ISO: salió el aviso de dudas |
| `dudas-recordadas.txt` | entrevistador | ISO: salió el recordatorio |

---

### Task 1: Fábrica, solo dudas reales y con Opus

**Files:**
- Modify: `docs/v5/escritor-v55/fabrica.md` (secciones `### Dudas para la familia` y `### Dudas para quien narra`)
- Regenerate: `fabrica/src/escritor/prompts/prompts-v55.json` (buscar el script en `fabrica/scripts` que usa `compilar.ts`; el test de prompts verifica que esté al día)
- Modify: `fabrica/src/escritor/dudas.ts`, `fabrica/src/escritor/modelo/configuracion.ts`
- Modify: `docs/historia/escritor/receta.md` solo si repite el prompt
- Test: el test de dudas y el de configuración que ya existan en `fabrica/`

**Interfaces:**
- Produces: `validarDudas(dudas, respuesta)` devuelve solo las de `real !== false`.

- [ ] **Step 1: Test que falla.** `validarDudas` con una entrada `{id:'D01', real:false, motivo:'x', pregunta:'', opciones:[]}` y otra real devuelve solo la real; una con `real:true` sin pregunta sigue tirando; sin campo `real` (archivos viejos) se toma como real. `rolDe('dudas')` da modelo `claude-opus-5-5`, esfuerzo `medium`.
- [ ] **Step 2: Correrlo y ver que falla.**
- [ ] **Step 3: Implementar.** En `validarDudas`:

```ts
return dudas.flatMap((d) => {
  const r = lista.find((x) => x?.id === d.id);
  if (r?.real === false) return [];
  if (!r || typeof r.pregunta !== 'string' || !r.pregunta.trim()) throw new Error(`la duda ${d.id} vino sin pregunta para la familia`);
  const opciones = Array.isArray(r.opciones) ? (r.opciones as unknown[]).filter((o): o is string => typeof o === 'string' && o.trim() !== '').map((o) => o.trim()) : [];
  return [{ ...d, pregunta: r.pregunta.trim(), opciones }];
});
```

En `configuracion.ts`, sacar `|dudas$` de `MECANICO`.

- [ ] **Step 4: Cambiar los dos prompts.** Agregar a ambos, antes de redactar, este bloque, y sumar `"real"` y `"motivo"` al esquema (`{"dudas": [{"id": "D01", "real": true, "motivo": "", "pregunta": "", "opciones": []}]}`):

```text
Primero decidí si cada duda es real. Una duda es real solo si es una de estas cuatro cosas y el libro no se puede escribir bien sin el dato:
- un nombre o una palabra que no se entiende o que aparece escrita de formas distintas;
- una fecha o un número que no cierra con otra cosa que dijo;
- dos versiones distintas del mismo hecho;
- dos personas que pueden ser la misma, o una que no se sabe quién es.

No es real, y va con "real": false:
- lo que no contó. Si la pregunta sería quién, por qué, cómo o dónde sobre algo que no dijo, no es una duda: es pedirle que cuente más, por interesante que sea;
- lo que dijo con duda («creo», «no sé», «más o menos»). El libro lo cuenta con su duda;
- lo que ya está claro en lo que dijo o en la ficha;
- lo que quien leyó ya resolvió en su nota. Una advertencia para quien escribe («no afirmar», «no agregar más») tampoco es una duda, salvo que deje sin saber un nombre o un hecho que dijo;
- lo que parece contradicción pero se entiende al leer lo que dijo.
```

Con `"real": false`, la pregunta va vacía y `motivo` dice por qué en pocas palabras. En `### Dudas para quien narra`, cambiar «El libro lo pidió para sí, así que las preguntas las lee la misma persona que contó.» por «Las preguntas las lee la misma persona que contó.».

- [ ] **Step 5: Regenerar el JSON, correr todos los tests de `fabrica` y `tsc`.**
- [ ] **Step 6: Commit** `escritor: solo dudas reales, redactadas con Opus`.

### Task 2: Fábrica, esperas y mails

**Files:**
- Create: `fabrica/src/escritor/produccion/revision-narrador.ts` y su test
- Modify: `fabrica/src/escritor/produccion/libro-v3.ts`, `fabrica/src/escritor-historia/produccion/libro-historia.ts`, `fabrica/src/worker.ts`, `fabrica/src/mail/hitos.ts`
- Test: tests existentes de esos archivos, sumando casos

**Interfaces:**
- Consumes: interfaz `Almacen` (`leer`, `escribir`).
- Produces:

```ts
export const REVISION_VISTA = 'revision-vista.txt';
export const REVISION_AVISADA = 'revision-avisada.txt';
export const REVISION_LISTA = 'revision-lista.txt';
export const DUDAS_NARRADOR_AVISADAS = 'dudas-narrador-avisadas.txt';
export const dudasAlNarrador = (): boolean => process.env.DUDAS_AL_NARRADOR?.trim() === '1';
export const ESPERA_REVISION_MS = 48 * 3600_000;
export const PLAZO_DUDAS_NARRADOR_MS = 72 * 3600_000;
/** Cuánto falta para poder leer el material. Apagado o con «Listo», 0. Anota revision-vista.txt la primera vez. */
export async function esperaPorRevision(almacen: Almacen, ahora?: number): Promise<number>;
/** ms que faltan del plazo: desde dudas-narrador-avisadas.txt o, si nunca salió, desde `desdeRespaldo` (ISO del mail a socios). */
export async function restaPlazoDudas(almacen: Almacen, desdeRespaldo: string | null, ahora?: number): Promise<number>;
```

- [ ] **Step 1: Tests que fallan** de `esperaPorRevision`: apagado da 0 sin escribir; con `revision-lista.txt` da 0; con `revision-avisada.txt` de hace 1 hora da 47 horas; pasadas 48 da 0; sin marcas escribe `revision-vista.txt` y da 48 horas; con `revision-vista.txt` de hace 10 horas da 38. Una fecha rota cuenta como ausente. Tests de `restaPlazoDudas`: desde avisadas, desde respaldo, sin ninguna da 72 horas completas contando desde `ahora` escribiendo nada.
- [ ] **Step 2: Implementar `revision-narrador.ts`.** Base de la espera: `revision-avisada.txt` si es fecha válida, si no `revision-vista.txt`.
- [ ] **Step 3: V3.** En `revisarEtapaAV3`, después de ver que falta `CARPETA_A` y antes de `hayLugarParaEtapaA`: `if ((await esperaPorRevision(new AlmacenSupabase(db, PREFIJO_ESCRITOR(narradorId)), o.ahora)) > 0) return;`. En `escribirLibroV3`, cuando `cargarSnapshot(almacen,'A')` devuelve null **por no existir** (no por material cambiado), si la espera es mayor que 0, hacer lo mismo que `espera > 0` de abajo: `esperaLibro.set`, volver el pedido a `'pagado'` y `return`. En `carpetaDeLaBase`: `propia: dudasAlNarrador() || esLibroPropio(...)`.
- [ ] **Step 4: `esperaPorDudas` de V3 encendido.** Después de `todasContestadas`, con `dudasAlNarrador()` no mirar `hayAQuienAvisar`; asegurar `avisarDudas` a socios igual que hoy; devolver `restaPlazoDudas(almacen, avisadas, ahora)`. En `avisarDudas`, encendido, el mail a socios dice «Se las mandamos por WhatsApp a quien contó. Espera hasta 3 días o hasta que estén todas contestadas.» en vez de «A la familia le llega un mail…».
- [ ] **Step 5: Historia.** Los mismos cambios en `revisarEtapaA`, en su función de escribir el libro, en `esperaPorDudas`, en `avisarDudas` y en `carpetaHistoriaDeLaBase`.
- [ ] **Step 6: Mails de quien regala.** `dudasParaLaFamilia` suma `plazoVencido: boolean`. En `avisarDudasALaFamilia` encendido: nunca `dudas`; `dudas_listas` solo si `contestadas || plazoVencido`, y sale a un regalo aun sin `estado.cantidad` si no hubo dudas pero ya hay Etapa A (no: sin dudas sigue sin mandarse, porque ya recibió `terminado`). El candado de siempre evita repetir.
- [ ] **Step 7: `dudas_listas` encendido** usa estos párrafos, de tú y de vos: quita «Ya tenemos todas las respuestas. Gracias.» y queda «Falta un solo paso. Elige la foto y el título de la tapa, suma las fotos que quieras adentro y encarga el libro.» + «Recién ahí empezamos a escribirlo. Te avisamos cuando esté.» (vos: «Elegí… sumá… encargá…»).
- [ ] **Step 8: Tests de los casos anteriores, todos los de `fabrica` y `tsc`.**
- [ ] **Step 9: Commit** `fábrica: la lectura espera la revisión y el plazo de dudas corre desde el WhatsApp`.

### Task 3: Entrevistador, mensajes y plantillas

**Files:**
- Create: `entrevistador/src/flujo/revision-narrador.ts`, `entrevistador/src/flujo/revision-narrador-textos.ts` y test
- Modify: `entrevistador/src/config.ts`, `entrevistador/src/variables.ts`, `entrevistador/src/flujo/control-plantillas.ts`, `entrevistador/src/flujo/scheduler.ts`, CONTRATO
- Test: `entrevistador/src/flujo/revision-narrador.test.ts` y el de variables

**Interfaces:**
- Consumes: `enviarPlantilla(tel, nombre, variables, idiomaMeta, { botonUrl })`, `enviarTexto(tel, texto)`, `avisarSocios(clave, asunto, detalle)`, `plantillaLista` por `WA_PLANTILLAS_V3_LISTAS`.
- Produces:

```ts
export type Mensaje = 'revision' | 'dudas' | 'recordatorio';
export type Situacion = { hayEtapaA: boolean; libroEscrito: boolean; revisionAvisada: boolean; cantidadDudas: number; todasContestadas: boolean; dudasAvisadasAt: string | null; recordada: boolean };
export function queMandar(s: Situacion, ahora: Date): Mensaje | null;
export function firmarTokenNarrador(narradorId: string, ahora?: number): string; // `${id}.${vence}.${hex}`
export async function atenderRevisiones(deps: DepsRevision, ahora: Date): Promise<void>;
```

Firma: `createHmac('sha256', FIRMA_TOKENS || SUPABASE_SERVICE_ROLE_KEY).update(`narrador:${id}:${vence}`).digest('hex')`, vence a 90 días. Es el mismo formato que `web/src/lib/token-firmado.ts` con propósito `narrador`.

Plantillas en `config.ts`:

```ts
export const PLANTILLAS_REVISION: Readonly<Record<'es-AR' | 'es-ES' | 'ca', { revision: PlantillaV3; dudas: PlantillaV3 }>> = {
  'es-AR': { revision: { nombre: 'revision_vos', idiomaMeta: 'es' }, dudas: { nombre: 'dudas_narrador_vos', idiomaMeta: 'es' } },
  'es-ES': { revision: { nombre: 'revision_es_es', idiomaMeta: 'es_ES' }, dudas: { nombre: 'dudas_narrador_es_es', idiomaMeta: 'es_ES' } },
  ca: { revision: { nombre: 'revision_ca', idiomaMeta: 'ca' }, dudas: { nombre: 'dudas_narrador_ca', idiomaMeta: 'ca' } },
};
```

Entradas de lista: `<idioma>:revision` y `<idioma>:dudas_narrador`, válidas en `VALIDAS_V3` y `POR_NOMBRE_META_V3`. `FIRMA_TOKENS` es obligatoria en `variables.ts` si `DUDAS_AL_NARRADOR=1`.

Textos dentro de la ventana de 24 horas (`revision-narrador-textos.ts`), con `{link}` al final:

| Mensaje | es-AR | es-ES | ca |
|---|---|---|---|
| revision | Terminamos la entrevista. Si hay alguna respuesta que no querés que vaya al libro, la podés quitar desde este enlace. Si está todo bien, no tenés que hacer nada. | Hemos terminado la entrevista. Si hay alguna respuesta que no quieres que vaya al libro, puedes quitarla desde este enlace. Si está todo bien, no tienes que hacer nada. | Hem acabat l'entrevista. Si hi ha alguna resposta que no vols que vagi al llibre, la pots treure des d'aquest enllaç. Si està tot bé, no cal que facis res. |
| dudas y recordatorio | Antes de escribir tu libro nos quedaron unas últimas preguntas sobre lo que contaste. Un nombre que no se entendió, una fecha. Las podés contestar desde este enlace. | Antes de escribir tu libro nos han quedado unas últimas preguntas sobre lo que contaste. Un nombre que no se entendió, una fecha. Puedes contestarlas desde este enlace. | Abans d'escriure el teu llibre ens han quedat unes últimes preguntes sobre el que vas explicar. Un nom que no es va entendre, una data. Les pots contestar des d'aquest enllaç. |

- [ ] **Step 1: Tests que fallan de `queMandar`:**
  - sin Etapa A y sin aviso → `revision`; sin Etapa A y avisada → null;
  - con Etapa A, sin aviso de revisión, sin dudas → null (libros en curso al prender no pasan por el momento 1);
  - con Etapa A y dudas sin avisar → `dudas`;
  - avisadas hace 47 horas → null; hace 49 → `recordatorio`; ya recordada → null; todas contestadas → null;
  - libro escrito → null siempre.
- [ ] **Step 2: Implementar `queMandar` y la firma.** Test de la firma contra un vector fijo, para detectar si deja de coincidir con la web.
- [ ] **Step 3: Tests que fallan de `atenderRevisiones` con dobles:**
  - apagado no hace nada;
  - fuera de 9 a 21 en `zona_horaria` no manda;
  - ventana abierta manda texto con link y escribe la marca;
  - ventana cerrada con plantilla lista manda plantilla con `botonUrl = token` y anota en `envios` con tipo `revision` o `dudas_narrador`;
  - ventana cerrada sin plantilla avisa a los socios y no escribe marca;
  - un error de Meta no escribe marca y no frena a los demás narradores;
  - un narrador con `libro.md` no se vuelve a revisar en ese proceso.
- [ ] **Step 4: Implementar `atenderRevisiones`.** Lee narradores en `completado` o `cerrado_anticipado` que tengan fila en `entrevistas_v3` o `historias` (carpeta `escritor` o `escritor-historia`), con `idioma` y `estado.ultimoEntranteAt` de esa fila. Lista la carpeta y baja `dudas-familia.json` y `correcciones.json` solo si `carpeta-A.json` existe. Ventana con `VENTANA_MS` de `v3/enviar.ts`. Enganchar en `scheduler.ts` con su propio `try`, como `entregarRegalos`.
- [ ] **Step 5: Plantillas, `variables.ts`, `control-plantillas.ts` (solo si está encendido) y sección nueva en `supabase/CONTRATO.md` con las marcas.**
- [ ] **Step 6: Todos los tests de `entrevistador` y `tsc`.**
- [ ] **Step 7: Commit** `entrevistador: avisos por WhatsApp para quitar respuestas y contestar dudas`.

### Task 4: Web, página de quien contó

**Files:**
- Create: `web/src/lib/token-narrador.ts`, `web/src/lib/revision-narrador.ts`, `web/src/lib/revision-narrador-textos.ts`, `web/src/lib/dudas-guardar.ts`, `web/src/app/api/mi-historia/route.ts`, `web/src/app/mi-historia/[token]/page.tsx`, `web/src/app/mi-historia/[token]/pantalla.tsx`, con tests de lo puro y de la ruta
- Modify: `web/src/lib/token-firmado.ts`, `web/src/lib/fuera-del-libro.ts`, `web/src/app/api/dudas/route.ts`

**Interfaces:**
- Consumes: `verificarToken`, `leerDelEscritor`, `archivosDelEscritor`, `carpetaDelEscritor`, `leerDudas`, `validarCorreccionesFamilia`, `fusionarCorrecciones`, `historiaV3`, `historiaDeHistoria`, `respuestasFuera`, `entrevistaV3`, `entrevistaHistoria`, `tratoDeLaFamilia`.
- Produces:

```ts
export function leerTokenNarrador(token: string, ahora?: number): { narradorId: string } | null;
export const dudasAlNarrador = (): boolean => process.env.DUDAS_AL_NARRADOR?.trim() === '1';
export type Momento = 'revision' | 'espera' | 'dudas' | 'gracias' | 'cerrado';
export function momentoDeLaPagina(a: { nombres: Set<string>; avisadaAt: string | null; listaAt: string | null; hayDudas: boolean; todasContestadas: boolean }, ahora?: Date): Momento;
export async function guardarRespuestasDudas(admin, narradorId, dudas, pedidos, autor): Promise<{ ok: true } | { ok: false; status: number }>;
export const NO_ME_ACUERDO = 'No se acuerda. Queda como lo contó.';
```

`momentoDeLaPagina`: `libro.md` → `cerrado`. `carpeta-A.json` con dudas pendientes → `dudas`. `carpeta-A.json` sin pendientes → `gracias`. Sin Etapa A: con `listaAt`, o con más de 48 horas desde `avisadaAt` → `espera`; si no, `revision`.

- [ ] **Step 1: Tests que fallan** de `leerTokenNarrador` (válido, vencido, otro id, otro propósito, basura, y el mismo vector fijo de la Task 3) y de `momentoDeLaPagina` con cada fila de arriba.
- [ ] **Step 2: Implementar.** Sumar `"narrador"` a `Proposito`. El token parte por el primer `.` en id y resto, y llama `verificarToken("narrador", resto, id, ahora)`.
- [ ] **Step 3: Refactor sin cambio de comportamiento.** Mover el tramo de `api/dudas/route.ts` desde leer `correcciones.json` hasta subirlo a `guardarRespuestasDudas`. Los tests de `api/dudas` siguen verdes. En `aplicarFueraDelLibro`, `rol: Rol | 'narrador'` (acepta `duena` o `narrador`) y `usuarioId: string | null`.
- [ ] **Step 4: Tests que fallan de la ruta `POST /api/mi-historia`**, cuerpo `{ token, accion, ... }`:
  - token malo → 404, sin tocar nada;
  - `sacar` y `poner` llaman a `aplicarFueraDelLibro` solo en momento `revision` (si no, 409);
  - `listo` escribe `revision-lista.txt` solo en `revision`, una vez;
  - `responder` con `{ correcciones }` valida con `validarCorreccionesFamilia`, guarda con autor `{ quien: como_le_dicen }` y solo en momento `dudas`;
  - apagado → 404.
- [ ] **Step 5: Implementar la ruta.** Errores en el trato de la familia. Un GET nunca escribe.
- [ ] **Step 6: Página.** Server component: verifica el token (si falla, «Este enlace ya no sirve» con salida, reusar `hoja-aviso`), calcula el momento, `robots: noindex`, `referrer: no-referrer`, `Cache-Control` sin caché. Sin sesión: `/mi-historia` no está en el matcher de `proxy.ts`. Cliente `pantalla.tsx`, letra grande y botones de al menos 48 px:
  - `revision`: bloques con su pregunta y cada fila de texto, botón «Que no vaya al libro» y deshacer, botón fijo abajo «Listo, no quiero sacar nada más»;
  - `dudas`: una por vez, «Pregunta 2 de 8», citas, opciones, campo, «No me acuerdo», «Seguir», guardado en cada paso; al volver abre en la primera sin contestar; al final, en «Para mí», botón a `/tablero/{id}/libro`;
  - `espera`, `gracias`, `cerrado`: una frase.

Textos en `revision-narrador-textos.ts`, por idioma `ar`, `es`, `ca`. Tomar la cantidad de los bloques de `historiaV3` y `historiaDeHistoria`, sin las filas `reservada`.

Textos es-AR (es-ES y ca con el mismo sentido):

```text
Revisá lo que contaste
Si hay algo que no querés que vaya al libro, tocá «Que no vaya al libro». Lo que no toques queda como está.
Que no vaya al libro
Volver a ponerla
Listo, no quiero sacar nada más
Gracias. Ya estamos con tu libro. Si nos queda alguna duda, te escribimos por acá.
Unas últimas preguntas
Son cosas que no entendimos bien. Lo que nos digas entra al libro.
Pregunta {n} de {total}
Lo que dijiste
Escribí acá, o tocá el micrófono del teclado y dictalo.
No me acuerdo
Seguir
Eso es todo. Gracias. Te avisamos cuando el libro esté listo.
Elegir la tapa y encargar el libro
Tu libro ya está escrito.
```

- [ ] **Step 7: Todos los tests de `web`, `tsc` y `npx next build`.** Abrir la página con un narrador falso de prueba si hay dev server sin datos reales; si no se puede, decirlo en el informe.
- [ ] **Step 8: Commit** `web: la página de quien contó, para quitar respuestas y contestar dudas`.

### Task 5: Web, quien regala solo ve cuántas faltan

**Files:**
- Modify: `web/src/lib/panel.ts`, `web/src/lib/dudas-archivos.ts`, `web/src/app/tablero/[narradorId]/dudas/page.tsx`, `web/src/app/api/dudas/route.ts`, `web/src/app/api/invitados/route.ts`, `web/src/app/tablero/[narradorId]/page.tsx`, `web/src/app/tablero/[narradorId]/v3.tsx`, `web/src/app/tablero/[narradorId]/libro/page.tsx`, `web/src/app/tablero/page.tsx`, `web/src/app/tablero/proximo-paso.ts`
- Test: los de esos archivos

**Interfaces:**
- Consumes: `dudasAlNarrador` (Task 4), `esPropia`.
- Produces:

```ts
/** Encendido y no «Para mí»: las dudas las contesta quien contó, no la familia. */
export function dudasSonDelNarrador(narrador: { contexto?: Record<string, unknown> | null }): boolean;
export async function cuantasDudasPendientes(admin, narradorId): Promise<number>;
export function textoQuedanPreguntas(comoLeDicen: string, n: number, tu: boolean): string;
```

Texto (se compone igual en tú y en vos): `A {como} le queda una pregunta por contestar.` / `A {como} le quedan {n} preguntas por contestar.`

- [ ] **Step 1: Tests que fallan:**
  - `/tablero/{id}/dudas` con `dudasSonDelNarrador` redirige a la historia, también para invitados;
  - `POST /api/dudas` da 404 y no escribe;
  - `api/invitados` con la entrevista terminada da 400;
  - `proximoPaso` no ofrece el link de dudas;
  - «Para mí» y apagado siguen igual.
- [ ] **Step 2: Implementar.** Donde hoy se calcula `dudasPendientes` y `dudasAbiertas`, con `dudasSonDelNarrador` quedan en `false`, y `page.tsx` y `libro/page.tsx` muestran `textoQuedanPreguntas` como texto, sin link, si la cuenta es mayor que 0.
- [ ] **Step 3: Grep de lo viejo** (`textoDudas`, `invitar-dudas`, `paraDudas`, `cuerpoDudas`): confirmar que encendido ningún camino lleva a quien regala a las dudas. Anotar en el informe lo que sigue vivo para «Para mí» y apagado.
- [ ] **Step 4: Todos los tests de `web`, `tsc`.**
- [ ] **Step 5: Commit** `panel: en un regalo, quien compró solo ve cuántas preguntas faltan`.

### Task 6: Cierre

- [ ] **Step 1:** Aviso en el chat: buscar en `entrevistador/src/v3/nucleo/entrevista` y en historia el mensaje que sigue a la aceptación (no plantilla) y proponer dónde va la frase «Si hay algo que no querés que vaya al libro, decímelo en el momento. Antes de cerrarlo vas a poder revisar todo lo que contaste.». No se programa hasta que Naza apruebe el lugar.
- [ ] **Step 2:** Revisión por otro agente de todo el diff, con ojos de seguridad (repo público) y de pérdida de libros trabados.
- [ ] **Step 3:** Pasar los textos a Naza en tandas de 10 y anotarlos en `docs/web-textos-v3/aprobados.md`.
- [ ] **Step 4:** Abrir el PR contra `main`, con la lista de variables: `DUDAS_AL_NARRADOR` (Railway fábrica y entrevistador, Vercel) y `FIRMA_TOKENS` igual en los tres.
