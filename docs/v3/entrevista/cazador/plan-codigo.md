# Plan de código: la salida después del olvido y el cazador (01/10/2026)

Todo aprobado por Naza el 01/10 (chat "La entrevista trae escenas"). Rama `v3-escenas`. Se toca solo `fabrica/` y `docs/v3/`; **nunca `entrevistador/`** (es de Joaquín). Método HERMES: test primero, commits en castellano, revisión de otro agente antes de mergear a `v3`.

## Parte A — La salida "contame en general" solo después de un "no me acuerdo"

**A1. Banco (`docs/v3/entrevista/banco.md`)**
- Sacar la frase de salida de las 8 preguntas que piden un día. Textos nuevos (Fable, OK de Naza):
  - CA16: `Contame un día de chic{{o/a}} que esperabas con muchas ganas: qué era, quién estaba, qué pasó.`
  - AD5: `¿Te acordás de la primera vez que saliste de noche, a un baile o a una fiesta? Contame cómo te preparaste, con quién fuiste y cómo fue esa noche.`
  - JU12: igual que hoy sin `Si la noche justa no te vuelve, contame cómo eran los primeros tiempos ahí.` y con `Si nunca te fuiste…` (sin la "Y" de adelante).
  - TR5: sin `Y si no te viene un día puntual, contame de qué parte de tu trabajo estás más orgullos{{o/a}}.`
  - HG4: sin `Y si ninguno se te separa de los demás, contame cómo eran tus días entonces.`
  - GI2: sin `Y si el día justo no te vuelve, contame lo que te acuerdes de esa época.` (la salida "Si ya me lo contaste…" queda).
  - GI9: sin `Y si no te vuelve un momento puntual, contame frente a qué cosas te pasa eso.`
  - HO2: sin `Y si la última no te vuelve, contame con qué te reís seguido.`
- Mensajes nuevos **M33.1 a M33.8** (la segunda oportunidad, una por pregunta, en la tabla de mensajes fijos):
  - M33.1 (CA16): `Está bien, {{nombre}}, no hace falta un día justo. Contame qué cosas esperabas con ganas en esa época, aunque sea una o dos. Y si no, decímelo nomás y vamos con otra.`
  - M33.2 (AD5): `Está bien, {{nombre}}, la primera no hace falta. Contame cómo eran esas salidas de noche en general: adónde iban, con quiénes. Con un par de cosas me alcanza. Y si no, decímelo nomás y vamos con otra.`
  - M33.3 (JU12): `Está bien, {{nombre}}, la noche justa no hace falta. Contame cómo eran los primeros tiempos en ese lugar, lo que te venga. Con un par de cosas me alcanza. Y si no, decímelo nomás y vamos con otra.`
  - M33.4 (TR5): `Está bien, {{nombre}}, no hace falta un día puntual. Contame de qué parte de tu trabajo estás más orgullos{{o/a}}, aunque sea una sola cosa. Y si no, decímelo nomás y vamos con otra.`
  - M33.5 (HG4): `Está bien, {{nombre}}, si ningún día se te separa de los demás, contame cómo eran tus días en la pandemia, así en general. Con un par de cosas me alcanza. Y si no, decímelo nomás y vamos con otra.`
  - M33.6 (GI2): `Está bien, {{nombre}}, el día justo no hace falta. Contame nomás qué fue lo que cambió: cómo eras antes y cómo después. Con eso me alcanza. Y si no, decímelo nomás y vamos con otra.`
  - M33.7 (GI9): `Está bien, {{nombre}}, no hace falta un momento puntual. Contame frente a qué cosas te pasa eso, aunque sea una. Y si no, decímelo nomás y vamos con otra.`
  - M33.8 (HO2): `Está bien, {{nombre}}, la última vez no hace falta. Contame con qué te reís seguido, aunque sea una cosa. Y si no, decímelo nomás y vamos con otra.`

**A2. Flujo (puro, `src/v3/entrevista/flujo.ts`)**
- Solo tras un **olvido puro** (`interpretar` = `olvido`) en una de las 8. No tras olvido a medias, "paso", "no" corto ni botón.
- `siguientePregunta` devuelve un paso nuevo `{ tipo: 'segunda-oportunidad', de: 'CA16', mensaje: 'M33.1' }` antes de cualquier otra cosa si la última respuesta del banco fue ese olvido y todavía no se mandó la segunda oportunidad. Una sola vez por pregunta.
- Lo que contesta se guarda en `respuestas` con la clave `CA16~2` (no es un ID del banco).
- **Acuses:** delante de la segunda oportunidad, **ninguno** (su "Está bien, {{nombre}}…" hace de acuse). Después de lo que contesta: contó → M28.4/M28.5 (rotan; delante de un cierre o LE9, M26 como siempre); olvido o "no" corto → M28.1; "paso" → M21.
- **M29:** la pregunta entera cuenta como UN olvido: si existe `X~2`, el olvido de `X` no suma (cuenta el de `X~2`). Lo que cuenta en la segunda oportunidad (olvido a medias) ni suma ni corta, como hoy.

## Parte B — El cazador de escenas

**B1. Módulo `src/v3/entrevista/cazador.ts`**
- Prompt: `docs/v3/entrevista/cazador/prompt-v3-1.md`, sección "## Prompt" (leerlo del md en tiempo de ejecución o copiarlo a un `.json`/`.ts` generado con test que compare con el md, como `banco.json`).
- Entrada por bloque (como `scripts/v3-cazador-prueba-v3.ts`, que ya está probado contra la API): ficha, `<bloque>`, `<respuestas_del_bloque>` (cada respuesta del banco de ese bloque con su pregunta renderizada y su texto; `pedido_dia="si"` en las 8 de la parte A; `paso="si"` si fue paso; las `X~2` van pegadas a su X), `<ya_repreguntado>`, `<escenas_contadas>`, `<lo_que_viene>` (los momentos de `BLOQUES` del script de prueba, para los bloques que faltan).
- **No se caza:** el bloque 15 (legado); respuestas de botón sin texto.
- Salida: hasta 2 elegidas. **Controles de código** (`controlarElegida` del script de prueba): cita textual y contigua de esa respuesta; pregunta con un solo "?", ≤45 palabras, sin "ayer/anoche/hace un rato/recién/la otra vez/esta semana" ni "hoy" fuera del bloque Hoy; ids distintos; id no repreguntado. **La elegida que falla se descarta** (se registra el motivo).
- Mensaje: `Me quedé pensando en algo que me contaste: «{cita}». {pregunta} Y si no te vuelve, o ya me lo contaste todo, decímelo nomás y seguimos con otra.` con un botón **[Ya lo conté todo]** (vale `no`).
- Llamada: `claude-opus-5` (HERMES: el entrevistador usa Opus 5), `max_tokens` 16000, un reintento si falla la red; si vuelve a fallar, ese bloque no caza y la entrevista sigue igual.
- **Tope de gasto por entrevista: USD 3** (Naza, 01/10). Se suma el costo de cada llamada (USD 5/M entrada, 25/M salida). Con el tope alcanzado, no se llama más y la entrevista sigue sin cazador. Cada llamada registra tokens y costo.
- Función pura de armado/parseo/controles + una función async `cazarBloque({ cliente, … })` que recibe el cliente (inyectable para tests: nunca llamar a la API en un test).

**B2. La cola (puro, en `flujo.ts`)**
- `EstadoEntrevista.repreguntas`: las pendientes, cada una `{ clave: 'RP~<idOrigen>', origen, bloque, cita, pregunta }`.
- `siguientePregunta` devuelve `{ tipo: 'repregunta', … }` cuando hay una lista: **3 o más respuestas del banco después de la de origen**, y **lo último que se mandó no fue una repregunta** (nunca dos seguidas). Antes de entrar al bloque 15 se mandan todas las que queden.
- Lo que contesta se guarda con la clave `RP~<idOrigen>`. Acuses: contó → M3 (con `acuseAntesDe`); botón [Ya lo conté todo] o "no" corto → M25; olvido → M28.1 **sin sumar a M29**; "paso" → M21.

**B3. Material del escritor (`scripts/v3-entrevista-a-material.ts`)**: `X~2` y `RP~X` van pegadas a la respuesta X, con el mismo id, sin el texto de la repregunta.

**B4. Página de prueba (`scripts/v3-entrevista-web.ts` y `v3-entrevista-turno.ts`)**: flag `--cazador` (apagado por defecto). Al cerrar un bloque (respuesta a un CIn), se llama al cazador sin frenar la charla y lo que devuelve entra a la cola. Mostrar en la consola el costo acumulado. Muestra la segunda oportunidad y el botón [Ya lo conté todo] como los demás.

## Fuera de este plan
- Conectar al entrevistador de WhatsApp (Joaquín).
- Variantes tú/usted de los mensajes nuevos (pendiente grande, igual que el resto del banco).
- Reintento de una elegida que falla un control (hoy se descarta; ver si hace falta con datos).
