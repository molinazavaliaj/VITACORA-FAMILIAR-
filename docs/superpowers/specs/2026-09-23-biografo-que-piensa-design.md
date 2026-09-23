# El biógrafo que piensa — diseño del biógrafo v2 antes de la prueba (23/09/2026, noche)

> Brainstorming Naza + agente, después de la revisión (`docs/revision-2026-09-23-biografo-v2.md`).
> Todo lo de acá lo decidió Naza; el agente propuso y verificó. Se implementa en la rama
> `biografo-v2-fabrica` (worktree `VITACORA FAMILIAR-biografo`), con tests, sin gastar, y se prueba
> con Naza de narrador por una puerta manual v2. Producción no se toca hasta que la prueba dé bien.

## 0. Objetivo y principio

Un libro que la persona reconozca como suyo y que emocione. El público es 60+, pero **es el libro de
la vida de quien lo haga**: alguien de 27, de 40 o de 76. Por eso el biógrafo tiene que **pensar
desde la persona que tiene enfrente**, no seguir un guion: saber quién es aunque la familia no cargue
nada, cubrir su vida entera (no la de un abuelo genérico), elegir qué preguntar según lo que la
persona le abre, y nunca suponer.

Regla de Naza que gobierna todo: **se escribe bien de una vez, sin parches ni redes a lo viejo**. Si
algo falla, falla el encargo nuevo y se corrige el encargo nuevo. Al conectar, los prompts viejos se
borran.

## 1. Las decisiones (resumen)

| Tema | Decisión |
|---|---|
| Edad | De la ficha si vino; si no, la pide la presentación; el mapa de casas la retoma; a la tercera se deduce y la entrevista nunca frena |
| Día 1 | Dos mensajes el mismo día: la presentación (bienvenida + cómo hablarle + edad si falta + cómo le dicen) y la casa de la infancia |
| Objetos | Entran al v2 como un tema más, escritos por el mismo cerebro; hasta 8, uno por cambio de tramo y uno al final; nunca se insiste |
| Núcleo | 21 temas fijos (los 15 de hoy + 6 nuevos) |
| Cantidad | Variables según la vida: una cada 6 años + una por bisagra, piso 8, techo 19; total 29 a 40; **siempre termina** |
| Orden | Columna vertebral cronológica; el biógrafo elige la próxima entre las pendientes si la persona abrió una puerta; un fijo cubierto se cae |
| Control rechaza | Tercer intento con el mismo cerebro; si falla, se manda igual, **marcada** (anotada para el panel y los logs). Nunca sin pregunta |
| Controles nuevos | Lugar y época; supuestos (hijos, nietos, pareja, boda) sin respaldo en el perfil |
| Evaluación | Mismas entradas que la pregunta; salida validada; cansancio; "hoy no"; "no quiero seguir" |
| Libro | Etapas desde el perfil; **lector final** (Opus) que lee el libro contra los audios; con avisos el libro **espera** y llega mail a los dueños |
| Prueba | Piloto manual v2 con Naza de narrador (entrevista entera + su libro) + el libro de Joaquín por etapas para medir. ~USD 10 |
| Modelo | Todo el entrevistador v2 en Opus 5; la fábrica escribe con Fable 5 y el lector es Opus 5 |

## 2. La entrevista

### 2.1 El perfil (la ficha del biógrafo)

`entrevistador/src/ia/perfil.ts`. Es lo que el biógrafo sabe de la persona, y todo lo que le
escribe sale de ahí.

- **Nace de la ficha de la compra el día 0** (`perfilDesdeFicha(contexto, zonaHoraria)`): año de
  nacimiento, estado civil, `arbol` (hijos "no tuvo", padres, hermanos), dónde vive, oficio, lugar
  de nacimiento, y mujer/hombre cuando la web lo pregunte. Cada dato con `fuente: 'ficha'`. La
  ficha deja de viajar en cada llamada al modelo: viaja el perfil.
- **Castellano**: `rioplatense | españa | latinoamerica`, de la zona horaria y del trato de la ficha
  (el vos manda: un argentino en Madrid es rioplatense). Entra al perfil y al encargo. Decide qué
  se ofrece en la presentación (vos/usted o tú/usted) y cómo se transcribe.
- **Se actualiza después de cada respuesta** con lo que cambió (como hoy), y además devuelve:
  - `cubiertos`: temas fijos que la persona ya contó con detalle aunque nadie los preguntara
    (ids del núcleo). Un tema cubierto no se pregunta: su día lo usa una variable.
  - `puertaAbierta`: si la respuesta de hoy abrió algo que conviene cruzar mañana, el id del tema
    pendiente que lo cubre (o null). Es lo que hace que el biógrafo elija la próxima.
  - `hoyFueFuerte`: true si contó una pérdida, un quiebre, algo que le costó. Mañana la pregunta lo
    reconoce antes de preguntar.
- **Corregir pisa, no agrega** (hallazgo 16): el prompt pide que cuando la persona corrija algo
  ("está viva", "no fue en Concordia") se corrija la fila existente por su número. Un dato
  `fuente: 'dicho'` no lo cambia una deducción posterior; solo otro `dicho`.
- **La edad siempre en cifras** ("70", "entre 65 y 75"), nunca en letras: `plan-preguntas` la lee.
- **Las bisagras empiezan con la edad** ("A los 12 se fue a Buenos Aires"), ya pedido.

### 2.2 El primer día: presentación y casa

Dos mensajes el mismo día, el segundo a los pocos minutos del primero (o apenas contesta el
primero, lo que pase antes).

1. **La presentación.** Es la bienvenida que ya existe (quién es el biógrafo, cómo va a ser esto:
   una pregunta por día, se contesta con un audio cuando pueda) y cierra con lo que necesita saber
   para escribirle bien: cómo prefiere que le hablen (vos/usted, o tú/usted en España), cuántos
   años tiene **solo si la ficha no lo trajo**, y cómo le dicen en casa. Entre 70 y 90 palabras,
   cálido, contestable con una línea o un audio corto. **Va fuera del tope de 45 palabras**: no es
   una pregunta del día. La escribe el modelo con el encargo, porque tiene que salir en el
   castellano de la persona y sin género; el prompt que la genera y la versión que salga en la
   prueba los aprueba Naza.
2. **La casa de la infancia**, como escena: la primera pregunta de verdad, escrita con lo que la
   presentación ya sacó (el trato, el apodo).

Si la persona no dijo la edad, el **mapa de las casas** (tema 2) la retoma natural ("hasta qué edad,
más o menos, en cada una"). Si después de eso sigue sin saberse, el perfil la deduce en rango de lo
contado y el plan se arma con el medio del rango; `noSabemos` la conserva para volver a preguntarla
cuando encaje. **La entrevista nunca frena por la edad.**

### 2.3 El núcleo: 21 temas fijos

`NUCLEO` en `pregunta-v2.ts`. Cada tema tiene `id`, `tramo` (al que apunta; null = donde lo vivió
según el perfil), `bloque` (dónde va en la secuencia) y `tema` (para el biógrafo, no es el texto que
se manda). Escritos sin suponer nada.

| # | id | Tema (para el biógrafo) | Tramo / bloque |
|---|---|---|---|
| 1 | presentacion | La bienvenida: cómo le hablo, edad si falta, cómo le dicen | inicio |
| 2 | casa-infancia | La casa donde pasó la infancia, como escena | infancia / inicio |
| 3 | mapa-casas | Las casas de su vida, una tras otra: ciudad, con quién, hasta qué edad | inicio |
| 4 | mapa-capitulos | Si su vida fuera un libro, cuáles serían los capítulos | inicio |
| 5 | padres | Cómo eran su mamá y su papá (o quienes le criaron) | infancia |
| 6 | con-quien-crecio | Las personas con las que creció (hermanos, abuelos, quien haya estado) **y de dónde venía la familia** | infancia |
| 7 | juegos | A qué jugaba y con quién; si la infancia fue dura, qué había y quién estaba | infancia |
| 8 | a-los-quince | Qué hacía a los quince cuando no estaba en la escuela ni trabajando, en la ciudad de entonces | juventud |
| 9 | primer-trabajo | El primer trabajo y el primer sueldo | juventud |
| 10 | amor | Si se enamoró, de quién, cómo fue; sin dar por hecho pareja, boda ni género | donde lo vivió |
| 11 | con-quien-hizo-su-vida | Las personas con las que hizo su vida (pareja, hijos, o quienes fueron su familia): quiénes, no cómo fue la boda | donde lo vivió |
| 12 | oficio | A qué le dedicó la vida y cómo llegó ahí | donde lo vivió |
| 13 | por-gusto | Lo que hacía por gusto: deporte, club, música, baile, lo que nombró; si no nombró nada, abierto | donde lo vivió |
| 14 | amigos | Los amigos de siempre: de la cuadra, del trabajo, quiénes quedaron | donde lo vivió |
| 15 | un-lugar | Un lugar que le cambió algo: un viaje, una mudanza, un barrio; sin suponer que viajó | donde lo vivió |
| 16 | un-dia-de-hoy | Cómo es un día suyo hoy | hoy |
| 17 | pruebas | Las pruebas que le puso la vida | reflexión |
| 18 | fuerza | De dónde sacó fuerza y qué aprendió | reflexión |
| 19 | alegrias | Sus alegrías y orgullos; los dichos que repite | reflexión |
| 20 | lo-que-falta | Qué no le pregunté que tiene que estar en el libro | reflexión (antes del mensaje) |
| 21 | mensaje | Qué les quiere decir a los que escuchen esto en cincuenta años; sin dar por hecho hijos ni nietos | reflexión |
| 22 | cinco-minutos | Su vida en cinco minutos | reflexión (último) |

(Son 22 filas porque la presentación cuenta como mensaje pero no como pregunta: **21 preguntas fijas**.)

Los temas "donde lo vivió" se ubican en el tramo que el perfil indica (el amor a los 20 o a los 50,
según la persona); si no se sabe, en `adulto joven`.

### 2.4 Las variables: cuántas y cómo

`plan-preguntas.ts`. Una variable es "algo de su vida entre los X y los Y años que todavía no
contó", con anclas del perfil (dónde vivía, qué hacía, qué le pasó).

- **Cantidad** = `piso(añosVividos / 6) + bisagras`, acotado a **[8, 19]**. Total con las 21 fijas:
  entre 29 y **40**, y 40 es techo duro: la entrevista siempre termina.
- Se calcula cuando se sabe la edad y **se recalcula** cuando aparecen bisagras nuevas, nunca
  por encima del techo ni por debajo de lo ya preguntado.
- Reparto entre tramos por peso (años + bisagras), descontando las fijas que ya apuntan al tramo,
  como hoy. Los tramos que no vivió no existen (a uno de 27 no se le pregunta por la jubilación).
- **La historia grande que le tocó** (regla de las variables, no un tema): "si en esos años pasó
  algo grande en su país o su ciudad (una dictadura, una guerra, una crisis, una inundación),
  preguntá cómo lo vivió esta persona, en su casa, sin dar por hecho de qué lado estuvo". El modelo
  sabe la época por los años de las etapas del perfil.

### 2.5 La secuencia viva

`secuencia.ts` (nuevo; hoy `secuencia()` en `pregunta-v2.ts`). Estado por narrador:
`pendientes` (fijas + variables con su bloque), `hechas`, `cubiertos`.

- **Columna vertebral**: presentación, casa, mapa de casas, capítulos; después los bloques en
  orden de vida (fijas del tramo antes que sus variables); "un día de hoy"; la reflexión, con
  `lo-que-falta` antes de `mensaje` y `cinco-minutos` último. Los cuatro primeros y la reflexión
  no se mueven.
- **El biógrafo elige la próxima**: si el perfil de hoy trajo `puertaAbierta` con un tema
  pendiente, mañana va ese tema (se saca de su lugar y va primero), aunque por calendario tocara
  otro. Sin puerta abierta, sigue el orden. No hay llamada extra: sale de la actualización del
  perfil.
- **Un fijo cubierto se cae**: si `cubiertos` trae un id pendiente, se marca cubierto y no se
  pregunta; su día lo ocupa una variable más del tramo de ese tema (dentro del techo).
- **Los objetos** (`objeto`): hasta 8, no consumen día (salen como segundo mensaje, como hoy). Uno
  cuando la secuencia cambia de tramo de vida (infancia → juventud → …) y uno al final: "un objeto
  de esa época, con foto y de dónde salió", escrito por el mismo cerebro con el encargo y el
  perfil. Nunca se insiste; `contexto.sinFotos` los apaga. Los 8 textos fijos de la plantilla
  (órdenes 101-108) dejan de mandarse en el v2.
- **Lo que se guarda**: `contexto.secuencia` (pendientes, hechas, cubiertos, marcas), cambio de
  CONTRATO (sección propia, la acuerdan los dos socios). La familia sigue viendo **respuestas**,
  no capítulos, hasta que el libro se arma.

### 2.6 El encargo: cómo le habla

`encargo-entrevista.ts`, reescrito de una vez con lo de esta noche. Lo comparten la presentación,
la pregunta del día, la repregunta y los objetos.

- Quién es (el perfil en castellano, con "no se sabe" explícito).
- Cómo le habla: el trato (vos/usted/tú), el género (o "sirva para los dos"), **su castellano**.
- **Tacto después de algo fuerte**: si `hoyFueFuerte`, la pregunta de mañana arranca reconociéndolo
  en una frase y ese día no se le tira encima otro tema pesado.
- Lo que se respeta siempre (las 8 reglas de hoy) con dos cambios: la frase "enganchá con algo que
  contó" se reemplaza por *"si algo que contó sirve de puente, usalo en una frase; la pregunta va a
  lo que todavía no contó"*; y la regla de lugar y época pasa a decir la ciudad concreta que el
  perfil tiene para esos años.
- Una pregunta clara (dos como mucho), hasta 45 palabras; la presentación, hasta 90.

Los textos que hablan con la persona (presentación, y los prompts que la generan) **los aprueba
Naza antes de la prueba**.

### 2.7 Los controles: lo que se revisa antes de mandar

`control-texto.ts` + `control-pregunta.ts` (nuevo). Sobre la pregunta del día, la repregunta y el
objeto. Sin modelo, gratis.

| Control | Rechaza si | Motivo que recibe el modelo |
|---|---|---|
| Trato | trae marcas del trato ajeno (imperativos, pronombres) | "le habla de usted y prefiere vos: cuénteme, lléveme" |
| Largo | más de 50 palabras (90 la presentación) | "tiene 58 palabras" |
| Pregunta | ningún signo de pregunta (salvo la presentación) | "no pregunta nada" |
| **Lugar y época** | nombra una ciudad y el perfil tiene otra para ese tramo; o la ciudad no está en ninguna etapa | "en esos años vivía en Buenos Aires, no en Concordia" |
| **Supuestos** | nombra hijos, nietos, esposa/marido/pareja, boda, novio/a y el perfil no los tiene (ni dicho, ni ficha) | "supone hijos y no se sabe si tiene" |

- **Tres intentos** con el mismo cerebro: el segundo y el tercero llevan el motivo. Si el tercero
  falla, **se manda igual, marcada**: la pregunta sale con `marca: { control, motivo, intentos }`
  guardada en `contexto.preguntasEnviadas[orden]` para que el panel la señale y los logs la cuenten.
  La persona nunca se queda sin pregunta del día.
- El control de lugar usa las ciudades de las etapas del perfil (normalizadas, sin acentos); si el
  perfil no tiene lugares todavía, no controla.

### 2.8 La evaluación y la repregunta

`evaluar-v2.ts`, como está, con:

- **Entradas**: el encargo (perfil + castellano + evitar), las últimas 6 respuestas con su
  pregunta, la pregunta y la respuesta de hoy con la duración.
- **Salida validada campo por campo** (`suficiente` boolean, `repregunta` string, `dejarTema`
  string, `reservado` boolean, `reservadoTramo` string, `hoyNo` boolean, `quiereParar` boolean);
  lo que no cumple se ignora, y si no hay JSON, alcanza (el día no se corta).
- **La repregunta pasa por los mismos controles** y los mismos tres intentos; si falla, marcada.
- **Cansancio**: si las dos últimas repreguntas quedaron sin responder, no se repregunta durante
  3 días (cuenta en código sobre `respuestas`, no regla para el modelo).
- **"Hoy no"** (`hoyNo`): "hoy no puedo, mañana": ese día no cuenta, sin repregunta, se retoma
  mañana con la misma pregunta.
- **"No quiero seguir"** (`quiereParar`): el biógrafo responde con cariño y sin preguntar, no manda
  más preguntas (`estado = pausado`), y avisa a los dueños por mail para que lo hablen con la
  familia. No decide solo.
- **Reserva** (hallazgo 19): como hoy; y la prueba suma una respuesta inventada con "esto que no
  vaya al libro" para medirla.

## 3. El libro

### 3.1 Etapas desde el perfil

`fabrica/src/libro/etapas.ts`. Al armar las etapas, el modelo recibe la línea de tiempo del perfil
(etapas con edades y lugares, bisagras) además de la historia; y cada respuesta arranca en la etapa
de su época usando el `tramo` y los años de su pregunta (guardados en `contexto.secuencia`). El
mapeo a mano de los capítulos del guion viejo ("la infancia" → 0-12) **se va del código de la
fábrica y queda solo en el script de prueba**, para el material de Joaquín.

### 3.2 El lector final

`fabrica/src/libro/lector.ts` (nuevo). Después de escribir capítulos, apertura, cierre y frases:

- **Opus 5, esfuerzo alto**, distinto del modelo que escribió. Recibe el encargo del libro, el
  libro entero, todas las transcripciones, la lista de nombres corregidos y lo reservado.
- Devuelve JSON: lista de `{ capitulo, frase, problema, evidencia }`, donde `problema` es uno de
  `inventado | epoca-o-lugar | fundido | reservado | genero | nombre | otro` y `evidencia` es la
  cita del audio o "no está en ningún audio". Vacía si el libro está bien.
- Los tres controles mecánicos (`controlarLibro`) suman sus avisos al mismo informe.
- Costo ~USD 0,50 por libro.

### 3.3 Con avisos, el libro espera

- Sin avisos: sigue solo (PDF, entrega).
- Con avisos: el pedido pasa a **`revision`** (estado nuevo, CONTRATO) con el informe guardado en
  `{narrador}/paquete/revision.json`, y sale **un mail a los dueños** (`MAIL_SOCIOS`, hola@) con el
  informe entero. Nada le llega a la familia. Desde el panel de la empresa un socio decide:
  corregir a mano, rehacer el capítulo señalado (una llamada), o entregar igual. Eso último es de
  Joaquín (panel), y hasta que exista se resuelve a mano con `npm run` en la fábrica.

### 3.4 Fotos y panel

- Las fotos de los objetos van al capítulo de la etapa de su época (el tramo del objeto), no al
  "capítulo del guion". Una línea en el reparto de fotos.
- La familia ve respuestas y fotos día a día; los capítulos existen recién cuando el libro se
  arma, y ahí los renombra y ordena. (Joaquín, panel.)

## 4. La prueba: Naza de narrador

### 4.1 La puerta manual v2

`entrevistador/scripts/manual-v2.ts`, tres comandos, sobre la base real, con un narrador nuevo
(`Naza`, sin ficha a propósito):

- `empezar naza`: crea el narrador si no existe, arma el perfil vacío (más castellano de la zona),
  escribe la presentación y la imprime para pegar.
- `cargar naza <audio.ogg|--texto "...">`: sube el audio, transcribe (con el castellano y el
  candado de audio cruzado como hoy), actualiza el perfil, evalúa, imprime la repregunta si hay, y
  guarda todo (respuesta, perfil, secuencia). Sin esperar un día.
- `siguiente naza`: elige la próxima (2.5), la escribe con los controles, imprime cuántos intentos
  y si quedó marcada, y la deja como enviada. Pide el objeto si toca.
- `estado naza`: el perfil en castellano, pendientes, cubiertos, marcas, gasto acumulado.

Corre el cerebro v2 completo: perfil, plan, secuencia, encargo, controles, evaluación. No toca el
flujo automático ni la puerta manual vieja.

### 4.2 Qué se mide

- Con Naza: si el biógrafo se da cuenta solo de que es un hombre de 27 y cómo habla; si las
  preguntas suenan a alguien que lo escuchó o a formulario; cuántas rechazó cada control y por
  qué; si eligió bien la próxima cuando él abrió una puerta; si la cantidad y el reparto por tramos
  tienen sentido para 27 años; y al final **su libro** por etapas con el lector: lo lee él.
- Con Joaquín (material real de 35 respuestas): el libro por etapas con reparto, medido contra los
  borradores de hoy (repetición, respaldo) y leído por el lector final.
- Los casos C1, C4 y la reserva inventada, contra la evaluación de hoy (`prueba-integral.ts`,
  reducido a eso).

### 4.3 Costo

| Parte | Costo |
|---|---|
| Entrevista de Naza, 29-40 preguntas (transcripción + perfil + evaluación + pregunta, Opus) | ~USD 4 |
| Libro de Naza por etapas + lector | ~USD 3 |
| Libro de Joaquín por etapas + lector, medido | ~USD 3 |
| C1, C4 y reserva | ~USD 0,2 |
| **Total** | **~USD 10** |

Se corre cuando Naza diga. La key igual en los dos `.env`, crédito cargado.

## 5. Lo que se borra al conectar (después de la prueba)

`personalizar.ts` (la pregunta del día con 14 reglas, Haiku), `trato.ts` (decidir vos/usted una
vez), `resumenes.ts` (la memoria por capítulos), `adaptativas.ts` (las 4 del final) y
`evaluarRespuesta` de `cerebro.ts` (19 parches). Los reemplazan el perfil, la secuencia, la
pregunta v2 y la evaluación v2. **No quedan como red.** Es el paso "conectar", de Joaquín con el
agente, y no entra en este diseño más que como destino.

## 6. Para Joaquín (código suyo, panel, contrato)

1. `Trato` gana `tú`; los mensajes fijos de `puro.ts` (despedida, bienvenida, recordatorios) lo
   contemplan.
2. La compra pregunta mujer/hombre y castellano (o país); van a la ficha y al perfil.
3. CONTRATO: `contexto.secuencia`, `contexto.perfil`, el estado `revision` del pedido, la marca de
   control en `preguntasEnviadas`.
4. Panel: mostrar respuestas (no capítulos) durante la entrevista; capítulos al final; la marca de
   control en la pregunta; el estado `revision` con sus tres botones.
5. Conectar el v2 al flujo automático y borrar lo de la sección 5.
6. `fabrica-tipos` mergeado; migración de descartadas aplicada (Naza).

## 7. Fuera de alcance

NotebookLM; el audiolibro; la voz; la logística; Kids; cambiar modelos.

## 8. Módulos y tests

| Módulo | Qué hace | Tests |
|---|---|---|
| `perfil.ts` | + `perfilDesdeFicha`, `castellano`, `cubiertos`, `puertaAbierta`, `hoyFueFuerte`, corregir pisa, edad en cifras | ficha → perfil; corrección por número; dicho no lo pisa deducido; salida validada |
| `plan-preguntas.ts` | cantidad por vida [8,19], techo 40, recálculo con bisagras, historia grande en el texto de la variable | 27 → 29 preguntas; 76 → ~36; 40 nunca se pasa; recálculo no baja de lo hecho |
| `secuencia.ts` (nuevo) | pendientes/hechas/cubiertos; próxima; puerta abierta; fijo cubierto → variable; objetos por cambio de tramo | orden base; puerta abierta adelanta; cubierto se cae; los 4 primeros y la reflexión no se mueven; 8 objetos máximo |
| `pregunta-v2.ts` | NUCLEO de 21 + presentación; prompt reescrito; 3 intentos; marcada | cada tema sin "él/ella" ni supuestos; presentación hasta 90; marcada con motivo |
| `encargo-entrevista.ts` | encargo reescrito: castellano, tacto, puente | contiene lo decidido; sin "enganchá" |
| `control-pregunta.ts` (nuevo) | lugar y época; supuestos | Concordia con perfil BA → rechaza; hijos sin perfil → rechaza; con perfil → pasa |
| `evaluar-v2.ts` | salida validada; hoyNo; quiereParar; cansancio | JSON sucio → alcanza; dos repreguntas sin responder → 3 días sin repregunta |
| `manual-v2.ts` (script) | empezar / cargar / siguiente / estado | tipos limpios (`npm run tipos` los mira) |
| `fabrica/libro/etapas.ts` | etapas desde el perfil; sin el mapeo a mano | etapa por tramo de la pregunta |
| `fabrica/libro/lector.ts` (nuevo) | el lector final | parse de la lista; vacía = sin avisos |
| `fabrica/libro/revision.ts` (nuevo) | estado `revision`, `revision.json`, mail a dueños | con avisos espera; sin avisos sigue |
| scripts de prueba | `prueba-reparto.ts` con lector; `prueba-integral.ts` reducido a C1/C4/reserva | tipos limpios |

## 9. Costo por libro, después

Entrevistador v2: ~USD 2,6 (30-40 llamadas a Opus por respuesta para perfil, evaluación y
pregunta; con caché de prompt sobre el encargo y el perfil, ~1,5). Fábrica v2 con lector: ~USD 3,2.
Total ~USD 6 por libro contra ~7 hoy, con un libro mejor. Se escribe en `GASTOS.md` al conectar.
