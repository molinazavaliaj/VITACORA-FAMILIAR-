# Estado del proyecto — actualizado 2026-09-20

## 🎉 ÚLTIMA HORA: el primer libro completo ya existe

La prueba de punta a punta con el set dorado (Osvaldo) se corrió ENTERA en producción:
carga → estructura → corrección de nombres → previsualización → pago simulado → **libro
completo de 8 capítulos en PDF + audiolibro ensamblado → página de descarga funcionando**.
La calidad del texto es genuinamente buena (voz oral real, cero perfume a IA). Costo de
producción medido: ~USD 5 de API por libro, contra 49€ de precio.

Bugs de producción cazados y arreglados en vivo durante la prueba (ya en main):
- Middleware de sesión de Supabase que faltaba (las páginas crasheaban al renovar el token) → helper único `web/src/lib/supabase/sesion.ts` + `web/src/middleware.ts`.
- **Railway usa Railpack y IGNORA `nixpacks.toml`** → la fábrica ahora tiene `fabrica/Dockerfile` explícito (node 22 + ffmpeg + Chromium adentro de node_modules). Dato clave para el deploy del entrevistador: **usar Dockerfile también**, no confiar en nixpacks.toml.
- Los reintentos re-pagaban al modelo por capítulos ya escritos → "memoria de borradores" en Storage (`borrador_cap_NN.md`): cada texto caro se guarda apenas se genera y los reintentos lo reutilizan gratis.

## Lo que ya está VIVO en producción (lado Naza)

- **Web compradora**: https://vitacora-familiar.vercel.app — desplegada en Vercel y probada de punta a punta con un narrador real: login por email ✓, registro ✓, tablero ✓, saludos grabados desde el celular ✓.
- **Fábrica del libro**: corriendo en Railway (worker cada 60 s, con ffmpeg y Chromium). Espera narradores `completado` para generar estructura → previsualización → libro+audiolibro tras el pago.
- **Emails**: Supabase usa SMTP propio vía Resend (el gratuito de Supabase permite 2-4 mails/hora — inviable). Hasta tener dominio propio, Resend solo entrega a nazamateos@gmail.com.
- **Pagos**: env vars con placeholders — Stripe/Mercado Pago quedan para una sesión propia (cuentas + webhooks). Todo lo demás funciona.

## 🚦 DECISIÓN NUEVA (2026-09-03): arrancan 3 pilotos REALES — tu deploy es el camino crítico

Naza tiene 3 personas reales listas para probar el producto entero (narradores de verdad,
audios de verdad, Whisper de verdad). **Nada de eso puede arrancar sin tu mitad**, así que
la prioridad número 1 del proyecto es:

1. **Deploy de `entrevistador/` en Railway HOY** — ⚠️ usá un **Dockerfile** como el de
   `fabrica/Dockerfile` (adaptado: sin Chromium ni ffmpeg, solo node+build): Railway usa
   Railpack e **ignora `nixpacks.toml`** — lo aprendimos a los golpes con la fábrica.
   Agregá el servicio DENTRO del proyecto Railway `vitacora-familiar` existente.
2. **Meta/WhatsApp**: verificación + las 3 plantillas de `entrevistador/PLANTILLAS.md`.
   Es EL trámite lento — cada día que no está iniciado es un día que los pilotos no arrancan.
3. **Pedido de Naza — "modo rápido" para pilotos** (cambio chico en tu scheduler): un flag
   por narrador (p. ej. `contexto.modoRapido = true`) para que la SIGUIENTE pregunta salga
   apenas responde la anterior, en vez de esperar al día siguiente. Un piloto con ganas
   termina las 30 en pocos días y tenemos el primer libro REAL la semana que viene.
   (Respetar igual la ventana de 24 hs de WhatsApp: si respondió hace minutos, se puede
   mandar la siguiente como mensaje libre, sin plantilla.)

Los compradores de los 3 pilotos van a ser la cuenta de Naza (sin dominio propio los mails
de login solo le llegan a él) — los narradores solo necesitan WhatsApp.

4. ✅ **APROBADA POR AMBOS Y YA APLICADA: "la vida en 5 minutos" es la pregunta fija del
   día 26** (está en `supabase/seed.sql` y en la base viva — 26 fijas globales ahora).
   **Te queda un ajuste en tu módulo:** el generador de adaptativas debe crear **4**
   preguntas (órdenes 27-30) en vez de 5 (26-30), y dispararse al completarse la
   respuesta 26 (no la 25). Texto aplicado:
   > «Ya me contó su vida entera, capítulo por capítulo. Hoy le pido algo distinto:
   > imagínese que tiene cinco minutos con alguien que no lo conoce, y quiere que sepa
   > quién es usted. Cuénteme su vida en cinco minutos. Lo que no puede faltar.»
   Razón: después de revivir todo, el resumen revela cómo el narrador estructura su propia
   vida (material de prólogo para el editor) y produce LA pieza compartible del producto:
   "su vida en 5 minutos con su voz" — candidata a muestra de la previsualización.
   Implementación si estás de acuerdo: se agrega al seed como fija orden 26 (avisamos y lo
   hace Naza en `supabase/seed.sql` + migración) y tus adaptativas pasan a generar 4
   (órdenes 27-30) en vez de 5. Decínos y lo aplicamos coordinados.

## Lo que falta para que el sistema COMPLETO respire (lado Socio 1)

El código del entrevistador está terminado y mergeado (¡enorme!). Faltan sus dos pasos finales:

1. **Deploy de `entrevistador/` en Railway** (Task 11 del plan A). Ojo: Naza ya creó el proyecto Railway `vitacora-familiar` — conviene agregar el servicio `entrevistador` DENTRO del mismo proyecto (Railway → proyecto vitacora-familiar → New Service), no crear otro proyecto.
2. **Meta/WhatsApp**: app de WhatsApp Business + verificación + aprobar las 3 plantillas de `entrevistador/PLANTILLAS.md`. Es EL trámite lento.

Cuando eso esté: en la base ya hay un narrador de prueba en estado `invitado` ("Pequeña Imma", el WhatsApp de Naza) — el scheduler lo va a encontrar solo y mandar la bienvenida. Esa es la señal de que todo el circuito quedó cerrado.

## Avisos técnicos entre socios

- `supabase/CONTRATO.md` cambió una línea: la web también **borra** saludos (antes de la entrega), además de crearlos.
- La fábrica asume que las **preguntas de reemplazo** (narrador sin hijos/pareja) van con el **mismo `orden`** que la fija que pisan — tal como ya lo hace el tablero.
- Pendientes priorizados antes del piloto real: `docs/superpowers/plans/2026-09-01-plan-b-pendientes-antes-del-piloto.md`.

### 2026-09-14 — puerta manual para los pilotos (Naza)

Mientras Meta no habilite la API, el entrevistador tiene una **puerta manual**
(`entrevistador/scripts/manual.ts` + `src/manual/puro.ts`, comando
`npm run manual -- ...`): hace con un archivo de audio lo mismo que el webhook
hace con un `mediaId` (Storage → `respuestas` → transcripción → evaluación →
repregunta → avance de `dia_actual` → adaptativas al 26 → cierre al 30). No
manda nada por WhatsApp: lo que habría salido se imprime para pegarlo a mano.
Es una herramienta de piloto, no un segundo camino de producción.

**Toca un archivo de Joaquín, aditivo y sin cambio de comportamiento:**
`src/ia/transcribir.ts` ahora acepta un `prompt` opcional (si no se pasa, se
comporta igual que antes) y pasó de `whisper-1` a **`gpt-transcribe`** — 25% más
barato (USD 0.0045/min vs 0.006), mejor precisión, y **la duración viene en
`usage.seconds`**, no en `duration` (si algún día se cambia el modelo otra vez,
es lo primero que hay que revisar; el test de contrato ya está actualizado).
Cuando quieras el mismo beneficio en la vía automática son 2 líneas en
`procesar.ts`, pasándole `promptDeTranscripcion(n.contexto, n.como_le_dicen)`.

### 2026-09-14 — la ficha del narrador: la pantalla que falta (Naza)

`docs/ficha-del-narrador.md`. El hallazgo: `registro.ts` **ya valida y guarda**
`lugarNacimiento`, `anioNacimiento`, `oficio`, `datosExtra` y el árbol familiar,
los cuatro consumidores del sistema ya los leen… y **el checkout no los pide**.
Un cliente real compra hoy y arranca con la ficha vacía. Medido: con la ficha
vacía el modelo oye "mi viejo llegando de **la URA**"; con la ficha, "llegando
**de laburar**". Propuesta de campos y dónde pedirlos, en el doc.

### 2026-09-14 — se sacó el saludo diario (decisión de producto, Naza)

Los socios decidieron que **el narrador reciba la pregunta sola**, sin el saludo
generado por el modelo. Motivo de producto: el narrador no necesita que le
resuman lo que contó; la familia lee las transcripciones en el panel y agrega
preguntas si quiere. El efecto de costo fue enorme y de yapa: el saludo era **la
llamada más cara del sistema** (~USD 3,36 por narrador, el 70% del costo de la
entrevista) porque cada día le pegaba TODA la historia al prompt para decidir si
agregar una frase opcional.

**⚠️ Antes de cargar las plantillas en Meta:** `pregunta_diaria` pasa de DOS
variables a UNA (`{{1}}` = la pregunta). `PLANTILLAS.md` ya está actualizado. Si
ya la cargaste en Meta con dos variables, hay que re-aprobarla — avisá.

**Código:** `preguntar.ts` (manda la pregunta sola y el audio es sólo la pregunta),
`src/manual/puro.ts` + `scripts/manual.ts` (mismo texto en la puerta manual),
`PLANTILLAS.md`, y los tests de contrato del scheduler. `generarReconocimiento`
queda viva en `cerebro.ts` con un aviso: no la usa el flujo, la usa
`prueba-cerebro.ts` para juzgar la voz del biógrafo.

**Queda pendiente la otra palanca:** la evaluación de cada respuesta
(~USD 0,20-0,28 por narrador, medido: Opus leyendo pregunta + transcripción, 30
veces) puede bajar a ~0,03 con Haiku — **pero se midió y no conviene** (abajo).

### 2026-09-14 — la evaluación de cada respuesta: la duración no decide (Naza)

**Lo que cambió** (pedido de Naza): antes el prompt le decía al modelo "si duró
menos de 40 segundos o es superficial, NO es suficiente" — o sea que la duración
era el criterio. Ahora el prompt dice explícitamente que **el largo no decide
nada**: se juzga por sustancia (dos o tres detalles concretos con una escena o un
nombre alcanzan), y se repregunta sólo en dos casos: cuando hay poco material, o
cuando contó algo fuerte y lo dejó en una sola frase. **La repregunta la piensa
siempre el modelo** para ese narrador y esa respuesta: no existe ningún texto
fijo.

**Medido con el prompt real** (`npm run prueba-evaluacion`, 5 casos del set
dorado, respuestas reales):

| Caso | Veredicto | Repregunta |
|---|---|---|
| Rica y larga (185 s, la real de Osvaldo) | suficiente | — (protege el ritmo de 1 pregunta/día) |
| Pobre y corta (14 s, sin una escena) | NO suficiente | "¿hubo alguna comida o algún momento del día en esa casa…?" |
| 9 segundos pero de oro (la muerte del hermano) | NO suficiente | "esa mañana en el taller, a las siete, ¿qué hizo cuando abrió la puerta?" |
| Larga pero vacía (240 s de relleno) | NO suficiente | "¿cómo se llamaban esos amigos del barrio…?" |
| Rica pero deja afuera el cierre emocional | suficiente | — (se aceptó: alcanza para escribir el capítulo) |

La fila 3 es la que justifica el cambio: con la regla vieja, una respuesta de 9
segundos se rechazaba por reloj; ahora se rechaza por sustancia **y la repregunta
va a lo que él acaba de decir**.

**Por qué NO se cambió el modelo a Haiku** (era la palanca barata, ~17 centavos):
medido con el mismo prompt, Haiku envolvió el JSON en un bloque de código **5 de
5 veces** (el parser tiraba y la corrida se caía) y en los dos casos delicados
preguntó peor — a alguien que acaba de contar que su hermano murió le preguntó
"¿qué pasó con Rubén?". No vale 17 centavos arriesgar la única pregunta que
recibe un señor de 80 años. **Decidido: la evaluación se queda en Opus.**

**Dos arreglos que salieron de esa medición** (valen más que el ahorro):
- `extraerJson()` en `cerebro.ts`: lee el JSON aunque venga dentro de un bloque
  de código, y si viene cortado **no revienta** — sigue sin repregunta. Antes,
  un bloque de código tiraba la corrida entera.
- `max_tokens` de la evaluación 300 → 500: con 300 la repregunta se cortaba a
  mitad de frase.
- ⚠️ En `scripts/` las variables de WhatsApp del `.env` están **vacías** (Meta
  sin habilitar): hay que rellenarlas con `||=`, nunca con `??=`.

### 2026-09-14 — dónde cae una repregunta en el panel (verificado a pedido de Naza)

**Respuesta corta: cae DENTRO de la misma pregunta.** La consulta de respuestas del
panel trae `es_repregunta`, y la vista separa `principales` de `ampliaciones`
(`web/src/app/tablero/[narradorId]/page.tsx`, ~línea 209): la ampliación se
muestra indentada bajo la misma pregunta con la etiqueta **"y agregó"**, con su
audio y su transcripción. **No se le agrega ninguna pregunta a la sección de la
familia**: la repregunta no crea filas en `preguntas` (el alta de preguntas
propias sólo permite órdenes sin responder) ni infla la barra de progreso (que
cuenta órdenes, no filas). La fábrica también las incluye: `armarMaterial`
recorre todas las respuestas de cada orden.

**Bug encontrado y arreglado en el camino** (lo escribí hoy): la memoria del
biógrafo (`personalizar.ts`, `resumenes.ts`) filtraba `es_repregunta = false`, o
sea que **la memoria ignoraba lo que el narrador contó al ampliar** — justo
donde suele estar la mejor escena (contesta corto y con la repregunta suelta
todo). El libro sí las usaba. Ahora van incluidas y agrupadas con su pregunta,
marcadas: "Pregunta 1 (lo amplió después):" / "(le repregunté y amplió):".

**✅ HECHO el 2026-09-14 (misma noche): el panel ahora muestra las dos preguntas.**
Naza pidió que las preguntas salgan en el dashboard del cliente, donde están las
preguntas y las respuestas. Se implementó la **opción 2** (sin migración):

- **Entrevistador**: `src/db/envios.ts` (nuevo) → `guardarRepreguntaEnviada()`
  guarda el texto de la repregunta en `narradores.contexto.repreguntasEnviadas[orden]`.
  Enchufado en el camino automático (`procesar.ts`) y en la puerta manual
  (`manual.ts`). Es provisorio, igual que `contexto.preguntasEnviadas`.
- **Panel**: `CAMPOS_NARRADOR` ahora trae `contexto`, y la vista de la historia
  muestra, bajo cada pregunta, **"Se lo preguntamos así: «…»"** (lo que él leyó
  de verdad, cuando difiere del guion) y, arriba de cada ampliación,
  **"Le repreguntamos: «…»"**. Si no hay nada guardado, no se muestra nada.
- Tests: 109 en el entrevistador (3 nuevos para el guardado) + 188 en la web,
  typecheck de los dos proyectos limpio. El `.cmd`/CLI no cambió.

**Sigue pendiente la opción 1** (la ordenada): agregar `texto` a `envios` y mudar
ahí los dos textos. Es una migración chica + `supabase/CONTRATO.md`, y cuando se
haga se copian los datos del jsonb a la columna sin perder nada. El panel no
cambia ni una línea cuando eso pase (lee de donde se le diga).

### 2026-09-14 — el biógrafo que escucha: preguntas personalizadas (Naza)

**Construido:** las preguntas del guion ya no salen genéricas. Antes de
mandarlas, el biógrafo las reescribe con lo que el narrador ya contó y con la
ficha que cargó la familia (`src/ia/personalizar.ts` + `src/ia/ficha.ts`):

- guion: `¿A qué jugaba de chico, y con quién?`
- biógrafo: `Con el Rubén y la Marta en Villa Domínico, ¿a qué jugaban en ese
  patio con la bomba y el limonero? ¿Alguna travesura que todavía lo haga reír?`

**Costo medido: USD 0,04 por narrador** (una llamada a `claude-haiku-4-5` por
día, con la ficha + las 2 últimas respuestas). Es el mismo objetivo que tenía el
saludo que se sacó arriba, 28 veces más barato — y el narrador lo siente en la
pregunta, no en el saludo. **Actualizado el 2026-09-14: ahora son 6 respuestas +
la memoria por capítulo → USD 0,12** (ver la sección de abajo).

**Tres reglas de seguridad, todas nacidas de errores reales del prototipo:**

1. La ficha va con el ROL de cada persona ("Sus padres: Ramón y Haydée. Su
   esposa / el amor de su vida: Élida"): sin eso el modelo preguntó "¿cómo
   conoció a Haydée?" como si fuera su mujer. Era su madre.
2. Si la versión personalizada pierde alguna de las preguntas del original, se
   manda el ORIGINAL. Medido: el conteo de signos de pregunta detecta esos casos
   (4 de 26 en el prototipo) y deja pasar los otros 22. El guion firmado gana.
3. El año de nacimiento es para anclar la época, nunca un lugar (a una narradora
   le salió "su infancia en 1939" — el año era 1939).

**Sólo se personalizan las preguntas del guion** (`tipo = 'fija'`). Las que
escribe la familia y las que genera el cerebro (reemplazos, adaptativas) se
mandan tal cual: ya vienen con contexto.

**⚠️ Guardado provisorio:** la pregunta enviada se guarda en
`narradores.contexto.preguntasEnviadas[orden]` (jsonb, sin migración). Sirve para
dos cosas: que el panel pueda mostrar lo que él leyó, y que un reintento del
scheduler reúse el texto en vez de pagarlo de nuevo. **El lugar definitivo es una
columna propia en `envios` o `preguntas` → toca `supabase/CONTRATO.md`**, o sea
decisión de los dos. Ojo: el panel todavía NO muestra esa pregunta (es un cambio
en la web, ~20 líneas).

**Medición reproducible:** `npm run prueba-personalizar [modelo]` corre las 26
preguntas del set dorado y muestra original vs personalizada + tokens + costo.
Archivos nuevos: `src/ia/ficha.ts`, `src/ia/personalizar.ts`,
`test/personalizar.test.ts` (16 tests). 86 tests en verde.

### 2026-09-14 — la memoria del biógrafo: un resumen por capítulo (Naza)

**El problema que cierra.** Con 2 respuestas el biógrafo se acuerda de lo que el
narrador contó *ayer* (que es el sentimiento del día a día), pero en la pregunta
25 ya se olvidó de lo del día 1. Pasarle la historia completa no sirve: medido,
**se va por las ramas** (con la orden 26 —"cuénteme su vida en cinco minutos"—
las versiones de 2 y de 6 respuestas pierden el pedido, y la de historia
completa mete cinco referencias seguidas). Más texto no es más memoria: es más
de dónde elegir.

**La solución (decisión de los socios):** una capa de **memoria destilada**.
Cuando el narrador cierra un capítulo, se genera **un resumen de ese capítulo**
(qué contó, con los nombres propios tal como aparecen y una línea final
`Pendiente:` con lo que quedó sin contar). A partir de ahí, cada pregunta se
personaliza con **ficha + resúmenes de los capítulos ya cerrados + las últimas 6
respuestas** (`src/ia/resumenes.ts`). El historial completo nunca entra al prompt.

- Los resúmenes se generan **una sola vez** y **sólo cuando hacen falta**
  (perezoso: el primero se crea cuando el narrador pasa al capítulo 2) y quedan
  guardados en `narradores.contexto.resumenesCapitulos` (jsonb, mismo criterio
  provisorio que `preguntasEnviadas`).
- **Costo medido:** 8 capítulos ≈ USD 0,03 + 26 preguntas ≈ USD 0,09 → **USD 0,12
  por narrador**, y es **plano**: en la pregunta 25 no lee 24 respuestas, lee 7
  resúmenes. Contra USD 0,30 de la historia completa (que además crece al
  cuadrado). Para los 4 pilotos: menos de medio dólar.
- **La prueba de que mejora la experiencia:** con memoria, la orden 25 nombró a
  los **cuatro nietos por su nombre** (dato que apareció en el capítulo "Los
  hijos", cinco capítulos antes) y la orden 26 arregló exactamente el caso que se
  rompía sin memoria.
- **Tope duro en código:** el modelo no cuenta palabras (le pedís 150 y escribe
  190) y agrega títulos en negrita que nadie pidió → `limpiarResumen()` saca el
  formato, corta en el último punto antes de 1.200 letras y **rescata la línea
  `Pendiente:` antes de recortar**. Verificado contra la base real con Osvaldo:
  los 8 capítulos quedaron en **8.267 letras ≈ 2.070 tokens** en total — la vida
  entera de un narrador de 30 respuestas entra en 2.000 tokens.

**⚠️ Los resúmenes son para el ENTREVISTADOR, no para el libro.** El generador
del libro y la revisión final siguen leyendo **las respuestas completas** con su
modelo grande: el libro no se escribe con resúmenes (decisión explícita de
Naza). Nada de `fabrica/` se tocó.

**Ver también la línea `Pendiente:` como insumo del panel:** dice qué falta contar
de cada capítulo. Con eso Martina puede agregar preguntas propias con criterio
(candidato a mostrar en el tablero, cambio chico en la web).

**Código:** `src/ia/resumenes.ts` (nuevo), `personalizar.ts` (6 respuestas + la
memoria), `scripts/manual.ts` → comando nuevo `resumenes <narrador>
[--regenerar]` para ver y rehacer la memoria. **100 tests en verde.**

**Medición reproducible:** `npx tsx scripts/prueba-resumenes.ts` genera los 8
resúmenes del set dorado, mide el costo y compara las preguntas 23/25/26 con
memoria vs las versiones sin memoria.

### 2026-09-14 — el entrevistador lee el guion de la familia (3t.10, Joaquín)

Lo que el panel edita ahora le llega al narrador. Cambios en `entrevistador/`, todos
aditivos, 124 tests:

- **El guion propio manda** (`src/db/guion.ts`): si el narrador tiene sus filas en
  `preguntas`, la plantilla global no cuenta. Antes se mezclaban con un `.or()` y, si
  la familia sacaba la 26, "la última" seguía siendo la 26 global y nunca terminaba.
- **Las 4 adaptativas van al final real**: al responder la última que exista (la 23 o
  la 36, según lo que sacó o sumó la familia) se generan en N+1..N+4. `PRIMERA_ADAPTATIVA`
  / `ULTIMA_ADAPTATIVA` quedan solo para `scripts/manual.ts` (Naza), que sigue asumiendo
  26 — ⚠️ cuando quieras, cambiá ahí a `ultimoOrden()` y listo.
- **Pregunta-foto**: si la pregunta tiene `foto_id`, la imagen sale por WhatsApp (link
  firmado, con el epígrafe) después del texto. `enviarImagenPorLink` en `enviar.ts`.
- **Ritmo** (`contexto.ritmo`): `seguido` = la siguiente sale ya (el modo rápido de los
  pilotos, `modoRapido` sigue valiendo); `dos_por_dia` = tras una respuesta suficiente
  se le OFRECE otra ("¿tiene ganas de seguir con otra ahora?"), queda en `envios` como
  `oferta_siguiente`, y un "sí" corto la manda (máximo dos por día); `diario` = nada.
- **`contexto.evitar`** entra en todos los prompts (evaluar, personalizar, reemplazo,
  adaptativas, sugeridas): "temas que la familia pidió no tocar".
- **Mails de hitos** (`src/mail/hitos.ts`, Resend por HTTP como la web): `acepto`,
  `primera`, `mitad`, `silencio`. Una vez por narrador, anotado en
  `contexto.mailsEnviados`. Sin `RESEND_API_KEY` avisa y sigue. Los del libro
  (terminó, recordatorios, listo) siguen siendo de la fábrica.
- **Sugeridas a pedido**: `POST /sugeridas` `{narradorId}` con header `x-clave` =
  `SUGERIDAS_CLAVE` → 5 preguntas (no se guardan; la web las ofrece y la familia elige).
  Sin la variable, la ruta responde 404. La web todavía no lo llama (3t.12).

**Variables nuevas en Railway (entrevistador):** `RESEND_API_KEY` (la misma de Vercel),
`MAIL_FROM` (opcional, default `Vitácora Familiar <hola@vitacorafamiliar.com>`),
`URL_BASE` (`https://www.vitacorafamiliar.com`), `SUGERIDAS_CLAVE` (un secreto cualquiera,
el mismo que después va en Vercel para que la web lo llame).

### 2026-09-18 — un solo proyecto de Railway: `fearless-kindness` (cuenta de Joaquín)

**Regla: hay UN proyecto de Railway y es `fearless-kindness`**, en la cuenta de
Joaquín, con deploy automático desde GitHub. Dos servicios: `dazzling-friendship`
= fábrica, `VITACORA-FAMILIAR-` = entrevistador. El proyecto viejo
(`vitacora-familiar`, cuenta de Naza) siguió vivo sin que nadie lo dejara escrito
y **el 18/09 escribió el libro de Joaquín sin aprobación, con voz real y con la
key de Naza** (código del 10/09, sin la puerta de `libro_aprobado_at` ni voz
clonada; ~USD 4,5 en la key de Naza — bitácora #32 y #37, `GASTOS.md`). Se apagó
ese día con `railway down` y el plan Hobby de Naza quedó sin proyectos:
**cancelarlo antes del 1/10**. Queda por rotar la key de Anthropic de Naza que
estuvo cargada ahí.

**Logs sin el CLI:** Windows bloquea el CLI de Railway en la PC de Naza desde el
18/09. `fabrica/scripts/railway-logs.py` lee deploys y logs por la API con el
token de PROYECTO (`RAILWAY_API_TOKEN` en `fabrica/.env`; solo ve ese proyecto):
`python scripts/railway-logs.py [--lineas 200] [--servicio VITACORA-FAMILIAR-]
[--buscar texto]`.

**Gasto (leído de la consola el 18/09, `GASTOS.md`):** 1–18/09 USD 46,07 en la
key de Naza; casi la mitad (USD 21,89 del 12/09) fue un Claude Code cobrando a la
API porque `ANTHROPIC_API_KEY` estaba como variable global de Windows (borrada el
18/09; la key `tricky-noise-api-key` se revoca). Lección: **una key por uso**.
El libro de Joaquín costó ~USD 8 entre las dos cuentas.

### 2026-09-18 — bitácora del piloto, hallazgos 32–37 (`docs/piloto-bitacora-errores.md`)

- **#34 arreglado**: cerrar libro y la muestra armaban los capítulos solo con las
  4 adaptativas del narrador (libro de 4 capítulos) → helper `armarGuion` en
  `web/src/lib/guion.ts`, compartido con el panel.
- **#35 arreglado (Joaquín)**: "Los hijos" se preguntaba igual a quien dijo que no
  tiene → `detectarQueNoTuvo`; el capítulo se reemplaza como con el árbol cargado
  al comprar.
- **#36 arreglado**: la fábrica ignoraba `edicion.titulosCapitulos` →
  `aplicarTitulosCapitulos` en `fabrica/src/libro/edicion.ts`, aplicado en
  `generar-paquete.ts` (título en PDF/HTML, índice, intro y `narracion.json`).
  Pendiente menor: la muestra pública (`web/src/lib/muestra.ts`) no lo aplica.
- **#31 pendiente**: al recibir la 30 el entrevistador tiene que despedirse, poner
  `completado` y disparar "terminó" sin depender de que la evaluación salga bien.
- **#33 pendiente**: el cierre automático a los 30 días manda el mail aunque exista
  `cierre_automatico_enviado.txt` (`mandarHito` no mira el candado).
- **#32**: falta un healthcheck de la fábrica.

**Foto del capítulo (acordado 18/09, `supabase/CONTRATO.md`):** `fotos.posicion`
(`arriba` = página propia tras la portadilla, `abajo` = dentro de la portadilla) y
`fotos.foco` (`{x, y}` en 0..1 → `object-position`). La principal y la tapa se
recortan con `foco`; las de cierre van enteras. La web escribe, la fábrica lee.

### 2026-09-19 — el primer audiolibro con voz clonada (Joaquín)

**Salió el 19/09 del worker de la PC de música** (`MOTOR=qwen3tts`, elegido con
Joaquín en la prueba de oído del 16/09; ~2,4× tiempo real en la 4060 Ti). Dos
cosas que se escucharon y se corrigieron (`voz/README.md`): la **referencia manda
más que el motor** — con la del día 23 sonó peor que con la del **día 02**; ahora
`muestras.py` elige la referencia por riqueza fonética del arranque — y los ruidos
al final de cada frase (ahora `motores/comun.py` limpia cada frase antes de pegar).

**Regla de voz única (Naza, 19/09, `supabase/CONTRATO.md`):** en el audiolibro
clonado **no suena ninguna voz que no sea la del narrador**: ni intro TTS ni
conectores con otra voz. El anuncio del capítulo ("Capítulo uno. La infancia.")
lo narra el worker con la voz clonada a partir de `nombre` en `narracion.json`.
La intro TTS de OpenAI queda solo para el audiolibro con audios reales.

**El mp3 completo es opcional (tope 50 MB por archivo de Storage):** desde el
19/09, si `audiolibro_completo.mp3` pasa el tope, la fábrica entrega por
capítulos con aviso y `pedidos.audiolibro_paths` viene sin `completo`. El panel
reproduce por capítulos y muestra "el audiolibro completo" solo si existe (el tipo
`AudiolibroPaths.completo` es opcional en la web desde el 20/09).

**Buzón con la PC de música (`voz/README.md`):** no se copian mensajes a mano. En
el bucket `audios`: `central/<fecha>-<nn>-<tema>.md` son las directivas de la
central (la PC sube `<mismo-nombre>.leido.txt` como acuse) y `pruebas/<fecha>/…`
es lo que la PC entrega (parches `git format-patch`, mp3, `notas.txt`). Naza le
dice al Claude de esa PC "leé el buzón" y alcanza. Tope 50 MB por archivo.

**Masterizado, restauración y ritmo en el worker (directivas 01 y 02, 19/09):**
- **Pausas por puntuación** (`voz/pausas.py`, se pisan desde `.env`): coma 250 ms,
  punto 500, suspensivos 700, párrafo 1 s, `* * *` entre historias 1,2 s. Modo
  `TRAMOS=oracion` (default; `coma` sigue disponible).
- **Restaurar** (`voz/restaurar.py`): cada original de WhatsApp pasa por
  resemble-enhance en su venv, graduado con `RESTAURACION_NIVEL` (default 0,7).
- **Ritmo** (`voz/ritmo.py`): con marcas por palabra de Whisper corta el arranque
  que responde a la pregunta (< 2,5 s) y lleva los silencios internos de > 1,5 s
  a 0,7 s. Nunca corta voz.
- **Masterizar** (`voz/masterizar.py`): igual para clonado, real e híbrido — EQ al
  sonido real del narrador, loudnorm en dos pasadas a −19 LUFS, `master.json` al
  lado de los mp3. **La fábrica ya no normaliza: sube el capítulo tal cual.**

### 2026-09-20 — decisión: el audiolibro clonado pasa a ser híbrido

**Voz real restaurada + conectores clonados:** las respuestas originales del
narrador (restauradas y con el ritmo arreglado) con conectores narrados por la
voz clonada entre ellas. El worker ya está preparado: `masterizar.py` recibe
piezas `real` y `conector`, iguala los conectores a los originales restaurados y
toma como objetivo las piezas reales, nunca el promedio con lo sintético. **En implementación** en la
rama `fabrica-narracion-v2` (`fabrica/src/libro/generar-paquete.ts`,
`fabrica/src/voz/narracion-json.ts`, `fabrica/src/voz/conectores.ts`) — no tocar
esos archivos desde otra rama. El mapa historia → respuesta original del libro de
Joaquín, para probarlo, está en `docs/mapa-historias-joaquin.md`.

### 2026-09-20 — el híbrido de Joaquín se encola y no se entrena ningún modelo

**Encolado (23:18):** el libro de Joaquín se vuelve a narrar híbrido. `narracion.json` v2 en
Storage (8 capítulos, todos híbridos: 5, 4, 5, 5, 4, 2, 6 y 3 historias con audio real), el v1
copiado a `narracion_v1.json`, la narración todo-clonada del 18/09 marcada `reemplazada` y la
nueva `pendiente`, el pedido en `esperando_voz`. Los conectores son **los revisados por Naza**:
se congelaron en `paquete/conectores_cap_NN.json` antes de correr, así que la corrida hizo
**0 llamadas al modelo** (el caché no existía: sin ese paso se re-pagaban 8 llamadas, ~USD 0,5-1).

**Decisión — no se entrena ningún modelo (Naza, 20/09):** el LoRA de Qwen3-TTS queda **sin
mergear**. El A/B del capítulo 6 (mismo texto y post-proceso) midió WER 2,2 % → 1,0 % sobre 402
palabras; en el híbrido el clonado cubre ~20 s por capítulo, o sea **~0,2 s de diferencia por
capítulo**: no se escucha. Costaba 38 MB y ~8 min de GPU por narrador, 7,69 de 8,19 GB de VRAM
(no entra junto al worker) y un parche comunitario no oficial; la pérdida bajó poco (13,07 →
12,22). La apuesta es la **limpieza y el masterizado de los audios reales** — inferencia con
modelos preentrenados, nunca entrenar con la voz del cliente —, que es donde está el 95 % del
audiolibro. El parche queda guardado en el buzón por si el clonado alguna vez tiene que narrar
minutos por capítulo.

**Próxima palanca, sin entrenar:** la **referencia** del clonado (hoy `dia_02` fijo): elegir los
15-30 s más limpios y expresivos del narrador y generar los conectores en pocos tramos largos.
Prueba A/B propuesta a la PC de música (directiva 07).

## Próximos hitos

1. Audiolibro híbrido: **encolado el 20/09** para el libro de Joaquín; queda escuchar el resultado y decidir si el híbrido pasa a ser el default.
2. Bitácora: #31 (cierre solo al recibir la 30), #33 (candado del cierre automático), #32 (healthcheck de la fábrica); la muestra pública con `titulosCapitulos`.
3. Plata: rotar la key de Anthropic de Naza (#37), cancelar el plan Hobby de Railway de Naza antes del 1/10, recargar crédito Anthropic antes del próximo libro y unificar las keys en una organización del proyecto (`GASTOS.md`).
