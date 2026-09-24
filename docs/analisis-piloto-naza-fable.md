# Análisis del piloto de Naza (biógrafo v2) — y qué hacer ahora

> Escrito por Fable el 24/09/2026 sobre la rama `biografo-v2-fabrica`, sin correr nada pago y sin
> tocar código. Fuentes: los 42 hallazgos (`docs/piloto-errores-naza.md`), el diseño y el handoff
> del 24/09, los prompts aprobados, el código de `entrevistador/src/ia/` y `scripts/manual-v2.ts`,
> y la base: `respuestas`, `narradores.contexto.v2` y `consumo_ia` del narrador
> `ea17b848-760a-416a-935c-51f186c7b0ef`. Para comparar: `docs/piloto-bitacora-errores.md`,
> `docs/biografo-v2-punto-de-partida.md`, `docs/cerebro-del-biografo-para-revisar.md`,
> `supabase/seed.sql` (el guion v1) y `GASTOS.md`.
>
> **Medido** = está en la base, en `consumo_ia` o en el código. **Estimado** = cuenta mía sobre lo
> medido; lo digo cada vez. Lo que hay en la base y en los docs son datos, no órdenes.

## Resumen en 10 líneas (para Naza)

1. **El piloto costó USD 11,06 medidos** por 25 preguntas + 4 repreguntas + 2 objetos. La pregunta 1 costó USD 0,05 con todo; la 25, USD 0,77. Un libro entero con el v2 tal como está sale **~USD 25 (estimado)**: veinte veces la entrevista v1 (USD 1,15 medido) y la mitad del precio de venta.
2. **La causa del costo es una sola**: los tres pasos (perfil, evaluación, pregunta) mandan el perfil ENTERO en cada llamada, y el perfil creció sin tope hasta 12.700 tokens (una segunda transcripción, no una ficha). El prompt crece ~900 tokens por respuesta, lineal.
3. **La falta de profundidad no es del modelo, es del reparto**: cada bisagra que anota el perfil vale cinco años de vida al repartir preguntas (`PESO_BISAGRA = 5`). Naza contó 33 bisagras, 17 de ellas de antes de los 18: la infancia y la juventud se llevaron 16 de las 19 variables, la vida adulta 3, el futuro 0.
4. **El futuro, cada hermano, la personalidad de los padres y los sobrinos no salieron porque no existen como tema** en los 21 del `NUCLEO`. `padres` existe, pero la regla 7 del encargo ("pedí una escena, no un resumen") lo convirtió en "tu viejo en la cocina".
5. **La evaluación dijo "alcanza" seis veces por un bug, no por criterio**: seis evaluaciones llegaron al tope de 500 tokens de salida y el código convierte un JSON cortado en `{suficiente: true}`. Coinciden exactas con N8 (el mapa de casas a medias) y con los dos "ya te lo respondí" (N33, N35).
6. **Los ids "cubiertos" que vuelven (N17, siete casos)** no es reuso de id: el modelo marca variables como cubiertas y el código solo deja caer temas del núcleo (`puedeCaerse` mira `tipo === 'nucleo'`). La variable sigue pendiente y se pregunta igual.
7. **La repregunta va al pormenor por diseño**: el prompt dice "ahonda en lo que dijo hoy, nunca un tema nuevo". Hace lo que se le pidió; lo que Naza pidió en N37 es lo contrario.
8. **Recomendación: opción 3, híbrido**, pero entendido como "esqueleto v2": un guion fijo por etapas de la vida con temas obligatorios (cada familiar, personalidades, pareja, trabajo, futuro, la historia grande calculada por el año de nacimiento), el modelo adapta el texto con una ficha CORTA, y se conservan los controles v2, el perfil (acotado) y la puerta manual. Costo estimado USD 3-4 por libro; 5-6 con Opus en todo.
9. **No arreglar el v2 tal como está**: aunque se recorte el prompt y se cambien modelos (baja a ~USD 5-8), el biógrafo libre sigue eligiendo por peso de bisagras y vuelve a rondar. No volver al v1 pelado: el perfil, los controles y el trato por persona son lo mejor que salió de esta semana.
10. **Lo primero, antes de escribir código**: Naza escribe (o aprueba) el guion de temas obligatorios para el público de 60+, con la regla de "varios pormenores en una pregunta del capítulo". Sin eso, ninguna de las tres opciones cubre lo que faltó.

---

## A. Profundidad: por qué rondó la infancia y no llegó al futuro

### A.1 Lo que se preguntó de verdad (medido, `contexto.v2.preguntasEnviadas`)

| Etapa de la vida | Preguntas | Cuáles |
|---|---|---|
| Infancia (hasta los 12), casi todo Martínez | 9 | 1, 4, 16, 17, 18, 19, 20, 21, 25 |
| 12-15 (Fátima, Liceo, Dardo Rocha) | 4 | 5, 7, 8, 24 |
| 15-18 (vuelta al Fátima, Vicky) | 3 | 9, 22, 23 |
| Vida adulta (música, Berga, Ima, trabajo) | 6 | 10, 11, 12, 13, 14, 15 |
| Inicio (mapa de casas, capítulos) | 2 | 2, 3 |
| Futuro, hermanos uno por uno, personalidades, sobrinos, historia grande | **0** | — |

13 de 25 preguntas son de antes de los 15 años. Las 4 repreguntas fueron: la novia (10), la
fábrica de neulas (12), el campo (20) y el fútbol en la plaza (21). Lo que quedó pendiente al cortar:
7 variables (3 de infancia, 4 de juventud) y las 5 de reflexión. **Las 5 de reflexión eran lo único
que iba a mirar hacia adelante**, y no llegaron.

### A.2 Causa 1 — el reparto premia el período del que más habló (medido en código y datos)

- `plan-preguntas.ts:59-61`: cantidad de variables = `piso(edad/6) + bisagras`, entre 8 y 19. Con
  27 años y 0 bisagras dan 8; con las 33 bisagras del perfil final, el techo: 19.
- `plan-preguntas.ts:44` y `:120-124`: **cada bisagra con "a los N" suma `PESO_BISAGRA = 5`**, o
  sea, cinco años de vida, al tramo donde cayó. El reparto (`:133-143`) es proporcional al peso.
- Recalculado con el perfil real (mismo código, sin modelo): de las 33 bisagras, 19 tienen edad;
  7 caen en infancia, 10 en juventud, 2 en adulto joven.

| Tramo | Años vividos | Bisagras | Peso | Variables (plan final) | Fijas del núcleo |
|---|---|---|---|---|---|
| infancia (0-12) | 13 | 7 | 48 | 6 | 4 |
| juventud (13-22) | 10 | 10 | 60 | 10 | 2 |
| adulto joven (23-27) | 5 | 2 | 15 | 3 | 0 (los "donde lo vivió" no cuentan) |
| hoy | — | — | 5 | 0 | 1 |

En la secuencia real quedaron 9 variables de infancia, 7 de juventud, 2 de adulto joven y 1 de
hoy (la diferencia con el plan viene de las variables que agrega un tema "cubierto",
`secuencia.ts:112-119`, y de que el plan se rearma con cada bisagra nueva, `estado-v2.ts:104-115`,
conservando lo ya asignado). **El diseño (§2.4) quiso "una variable por bisagra" como "más vida,
más preguntas"; el perfil produce una bisagra por anécdota** (el tren pintado, el cuchillo, la
bici, Vicky dos veces), no por vuelta de vida, y sin tope (`perfil.ts:248-249`, regla 9, y `:179`,
que solo evita duplicados de texto exacto: N34 y N40 son bisagras repetidas). Resultado: cuanto
más cuenta la persona de una etapa, más preguntas recibe de esa misma etapa. Es el incentivo al
revés, y le va a pasar igual a alguien de 76 que hable mucho de su infancia (que es lo normal).

### A.3 Causa 2 — el orden por bloques mete las variables de una etapa todas juntas

`secuencia.ts:57-63` ordena las pendientes por bloque (infancia, juventud, adulto joven…), fijas
antes que variables. Después de las 4 del inicio, la puerta abierta del perfil desvió a `un-lugar`,
`pruebas`, `amigos`, `por-gusto`, `amor`… (preguntas 4-15), y cuando se acabaron las puertas, la
columna vertebral retomó el bloque `infancia`: `padres`, `con-quien-crecio` y las 9 variables de
infancia, una detrás de otra (preguntas 16-21 y 25). Es exactamente N37. Con un día entre pregunta
y pregunta, una persona real recibe una semana y media de "la casa de Martínez".

Las variables además llegan al modelo con un tema vacío: `estado-v2.ts:122` las describe como
"Algo de su infancia, entre los 0 y los 12 años que todavía no contó", y `pregunta-v2.ts:87-89` le
pide "buscá lo que todavía no contó: una casa, un trabajo, una persona, un cambio". Sin un tema
propio, el modelo busca en el perfil el detalle más chico que falte: los perros, la cuadra, un
recreo. **El pormenor como pregunta entera (N37) sale de ahí**, no de un capricho del modelo.

### A.4 Causa 3 — los temas que faltaron no existen en el núcleo

`pregunta-v2.ts:31-54`. Contra lo que Naza pidió en N42:

| Lo que faltó | ¿Está en el NUCLEO? | Qué pasó |
|---|---|---|
| El futuro (sueños, Barcelona, libertad financiera) | **No.** Lo más cercano es `mensaje` (a cincuenta años) y `un-dia-de-hoy` | `un-dia-de-hoy` se marcó cubierto en la 14; nada pregunta "qué querés" |
| Cada hermano, uno por uno | **No.** `con-quien-crecio` mezcla hermanos + abuelos + de dónde venía la familia | La pregunta 17 fue a abuelos, tíos y apellidos; Ariel y Juan Manuel nunca tuvieron pregunta propia |
| Personalidad de la madre y el padre | Sí, `padres`: "cómo eran… cómo recuerda a cada uno" | La regla 7 del encargo (`encargo-entrevista.ts:94-95`: "pedí una escena, no un resumen") la convirtió en "tu viejo en la cocina y una escena de Meri" (pregunta 16). Se supo qué hacían, no cómo son |
| Sobrinos / la familia hoy | **No** | Nunca se preguntó si tiene sobrinos; el perfil tiene 92 "noSabemos" y ninguno lo dice |
| La historia grande (pandemia) | No es tema: es una frase opcional en cada variable (`pregunta-v2.ts:69`) | En 26 preguntas no la usó nunca (N39); la pandemia salió sola en la 23 |

El guion v1 (`supabase/seed.sql`) tenía la pregunta 6 "Hábleme de sus hermanos. ¿Cómo era cada
uno…?" y la 2 "¿Cómo eran su mamá y su papá?". **El v2 perdió los hermanos al fundirlos con los
abuelos, y perdió las personalidades al pedir escena.** Ninguno de los dos guiones tiene el futuro
ni los sobrinos.

### A.5 Causa 4 — la "puerta abierta" y los "cubiertos" del perfil no hacen lo que el diseño dice

- **Cubiertos (N17, siete casos).** El perfil devolvió 12 ids en `cubiertos`, 10 de ellos
  variables (`var-infancia-1..4`, `var-juventud-1..5`, `var-adulto joven-1`). `secuencia.ts:100`
  define `puedeCaerse` solo para `tipo === 'nucleo'`, y `:105-107` saltea el resto. En la base,
  `secuencia.cubiertos` tiene solo dos: `juegos` y `un-dia-de-hoy`. **La variable "cubierta" nunca
  se cae: sigue pendiente y se pregunta con el mismo id.** No hay reuso de id; hay un aviso del
  modelo que el código ignora en silencio. Encima el modelo tenía razón: con 9 variables de
  infancia era obvio que varias ya estaban contadas.
- **Puerta abierta.** `secuencia.ts:139-143` deja adelantar cualquier pendiente que no sea del
  inicio ni del cierre, incluidas las variables. En las preguntas 4, 5, 8, 13, 15 y 19 la puerta
  fue a un tema duro o a una variable genérica (N11, N13, N28). El modelo elige la puerta entre
  una lista donde 16 de 19 variables son "algo de su infancia/juventud que todavía no contó":
  elige lo que hay.
- **Anclas.** Las variables que nacen de un tema cubierto salen con `anclas: []`
  (`secuencia.ts:118`); las del plan llevan TODAS las bisagras y etapas del tramo (la
  `var-infancia-6` de la pregunta 26 llevaba 7 anclas, una de 1.700 caracteres). Ni una cosa ni la
  otra es "lo que sabés de esos años": es nada o es todo.

### A.6 Causa 5 — la evaluación dice "alcanza" por un tope de tokens, y cuando repregunta va al detalle porque se lo pidieron

- `evaluar-v2.ts:143`: `max_tokens: 500`. En `consumo_ia` hay **6 evaluaciones con
  `output_tokens = 500` exactos** (medido): las de las respuestas 2, 16, 17, 19, 25 y la
  repregunta 20. `evaluar-v2.ts:93-108` (`parsearEvaluacion`): si el JSON viene roto,
  `{ suficiente: true }`. **Un JSON cortado a la mitad se convierte en "alcanza".**
  - Respuesta 2 (00:55:20, 500 tokens) → N8: el mapa de casas a medias y "suficiente: true".
  - Respuesta 16 (02:23:34, 500) → N33: "siento que esto ya te lo respondí", sin registrar cansancio.
  - Respuesta 19 (02:34:22, 500) → N35: "eso creo que ya lo respondí", ídem.
  - Las tres coinciden al minuto. No fue criterio del modelo: fue el tope.
- Además, en Opus 5 el pensamiento viene activado por defecto y se cobra como salida (referencia
  de la API, cargada en esta sesión). Las preguntas de 45 palabras (~70-90 tokens de texto) salieron
  con 222 tokens de salida en promedio, y las presentaciones/objetos 277: **la diferencia es
  pensamiento** (estimado a partir de los tokens; los bloques no se guardan). Con `max_tokens: 400`
  en la pregunta (`pregunta-v2.ts:145`) y 500 en la evaluación, el pensamiento se come el tope y
  el texto sale cortado o vacío: de los 9 reintentos de pregunta, 4 llegaron a 400 justos (las
  preguntas 5 y 26: N12 y N41), y N6 (perfil cortado en 2.000) es el mismo mecanismo.
- Cuando la evaluación sí repregunta, `evaluar-v2.ts:57-59` dice: "La repregunta ahonda en lo que
  dijo hoy… Nunca un tema nuevo". Las 4 repreguntas hicieron eso al pie de la letra (el campo, el
  fútbol en la plaza). **Naza pidió en N37 lo contrario**: juntar pormenores de una etapa en una
  pregunta del capítulo. El prompt no está mal escrito; está pidiendo otra cosa.
- Y se evalúa lo que no se usa (N29, N37): `manual-v2.ts:488` evalúa siempre, y
  `estado-v2.ts:271` descarta la repregunta si la respuesta era a una repregunta o a un objeto.
  Son 6 evaluaciones (4 repreguntas + 2 objetos) más 2 reintentos: ~USD 0,80 medidos tirados.

### A.7 Lo que sí funcionó (para no tirarlo)

- El perfil se dio cuenta solo de que es un hombre de 27, que habla de vos, dónde vive, quién es
  Joaquín ("mi hermano" no de sangre), que Paraná es una calle, que "el profe" es un apodo… con
  ficha vacía. Es la respuesta al pedido original de Naza ("que entienda el avatar").
- Los controles de salida (trato, largo, lugar, supuestos) son gratis y frenaron cosas; lo que se
  les escapó (género de la pareja, "con esta me quedo", "quién te esperaba": N19, N21, N25) es
  lista de patrones, no arquitectura (`control-pregunta.ts:76-100` mira hijos/nietos/pareja/boda,
  no género ni compromiso).
- La puerta manual v2 (`empezar`/`cargar`/`siguiente`/`estado`), el candado de audio cruzado,
  el registro por paso en `consumo_ia` que permitió este análisis.
- Varias preguntas sueltas son muy buenas (8, 11, 13, 20): el encargo de "decidir cómo
  preguntarle a ESTA persona" escribe mejor que "reescribí la fija" del v1. El problema no es
  cómo escribe: es qué le mandan a escribir.

---

## B. Costo: qué se pagó, por qué creció y cuánto bajaría

### B.1 Desglose medido (`consumo_ia`, 140 filas, USD 11,059)

| Paso | Llamadas | USD | Entrada (tokens) | Salida | Entrada media | Salida media |
|---|---|---|---|---|---|---|
| v2-perfil | 34 | **4,54** | 517.806 | 78.186 | 15.230 | 2.300 |
| v2-pregunta | 35 (26 preguntas + 9 reintentos) | **3,01** | 562.877 | 7.772 | 16.082 | 222 |
| v2-evaluar | 35 (31 respuestas + 4 reintentos) | **2,99** | 549.683 | 9.466 | 15.705 | 270 |
| v2-objeto | 3 | 0,30 | 56.142 | 832 | 18.714 | 277 |
| transcribir | 32 (2.774 s) | 0,21 | — | — | — | — |
| v2-presentacion | 1 | 0,01 | 1.324 | 220 | — | — |

- **El 96 % es entrada** (USD 8,4 de entrada contra ~USD 2,4 de salida, estimado con la tabla de
  `costos.ts`). La salida del perfil (2.300 tokens por llamada: bisagras de 500 caracteres y etapas
  que reescriben párrafos enteros) es el único paso donde la salida pesa.
- **Reintentos**: 13 llamadas de más (9 pregunta + 4 evaluar), ~USD 1,1 (10 %). Cuatro de los
  nueve de pregunta llegaron al tope de 400 tokens (ver A.6).
- **Evaluaciones que se tiran** (N29/N37): 8 llamadas, ~USD 0,8 (7 %).

### B.2 Por tanda (medido: lo que costó cada `cargar` + `siguiente`)

| Orden | USD de la tanda | Acumulado | Nota |
|---|---|---|---|
| 0 (presentación + respuesta) | 0,07 | 0,07 | |
| 1 | 0,31 | 0,37 | N6: dos perfiles cortados en 2.000 |
| 2-3 | 0,14 / 0,24 | 0,75 | |
| 4-9 | 0,27-0,38 | 2,58 | preguntas 5 y 6 con 3 intentos |
| 10-15 (+2 repreguntas, 2 objetos) | 0,21-0,60 | 5,81 | la tanda de la 15 con objeto: 0,60 |
| 16-19 | 0,34-0,37 | 7,43 | |
| 20-22 (+2 repreguntas) | 0,26-0,48 | 9,35 | |
| 23-25 | 0,42-0,77 | 11,06 | la 25 (con la pregunta 26 vacía, 3 intentos): 0,77 |

Una tanda normal pasó de USD 0,14 (orden 2) a USD 0,42 (orden 24): **×3 sin reintentos**.

### B.3 Qué hace crecer el prompt (medido con el código real sobre el estado final)

`input_tokens` del primer intento de cada pregunta: 1.561 (p. 1) → 8.041 (p. 5) → 14.877 (p. 10)
→ 18.715 (p. 16) → 21.782 (p. 21) → 27.654 (p. 26). Ajuste lineal: **≈ 3.900 + 900 × n tokens**.

Armé el prompt de la pregunta 26 con `armarPromptPregunta` y el `contexto.v2` real (64.116
caracteres; a 2,3 caracteres por token da los 27.700 medidos):

| Parte del prompt de la pregunta | Caracteres | % | De dónde sale |
|---|---|---|---|
| El perfil en texto (`perfilEnTexto`) | 45.572 | **71 %** | `encargo-entrevista.ts:25-42`, entero, en cada llamada |
| — de eso, etapas | 17.400 | 27 % | 9 etapas; una sola tiene 1.700 caracteres: el perfil reescribe la etapa con cada respuesta (`perfil.ts:243-244`, regla 6, sin tope) |
| — personas (33) | 10.616 | 17 % | con nota larga cada una |
| — noSabemos (92) | 8.231 | 13 % | crece 3-4 por respuesta, nunca se poda |
| — bisagras (33) | 7.851 | 12 % | regla 9 sin tope; repetidas (N34, N40) |
| Preguntas ya hechas (32 textos enteros) | 7.065 | 11 % | `pregunta-v2.ts:120` manda el texto completo de cada una |
| Conversación (últimas 6 respuestas) | 6.521 | 10 % | `estado-v2.ts:201`, acotada: **esta parte no crece** |
| Reglas + objetivo + anclas | ~5.000 | 8 % | |

**El perfil, que el diseño llamó "la ficha", es a las 25 respuestas más largo que las 6 últimas
transcripciones juntas.** El perfil JSON del paso `v2-perfil` mide 50.700 caracteres (25.177
tokens medidos en la última llamada) y la evaluación, 24.116: los tres pasos pagan lo mismo.
Además hay un cuarto pagador: cada llamada al perfil DEVUELVE etapas y bisagras largas, que
mañana vuelven a entrar como entrada. Se paga tres veces por leer y una por escribir lo mismo.

### B.4 Proyección de un libro entero con el v2 tal como está (estimado)

Cuenta: 40 preguntas (el techo del diseño) + 6 repreguntas + 8 objetos, prompt creciendo 900
tokens por respuesta, los mismos reintentos medidos (×1,35 pregunta, ×1,13 evaluación), Opus 5 en
todo. Calibración: la misma fórmula sobre lo hecho (26 + 4 + 2) da USD 11,1 contra 11,06 medidos.

| Escenario | USD por libro | Nota |
|---|---|---|
| **v2 tal como está** | **~25** | la pregunta 40 entra con ~40.000 tokens |
| sin evaluar repreguntas/objetos (N29) | ~23 | −8 % |
| sin reintentos (`max_tokens` acorde al pensamiento) | ~23 | −9 % |
| caché de prompt del encargo entre evaluación y pregunta | ~22 | −12 %: el perfil cambia cada día, así que solo se comparte dentro del día |
| perfil compacto (prompt a la mitad) | ~14,5 | el recorte más grande, y es de producto: una ficha, no una transcripción |
| las cuatro cosas juntas, todo Opus | ~11 | |
| las cuatro + perfil y evaluación en Sonnet 5 | ~5,8 | Opus queda solo en la pregunta |
| las cuatro + perfil Sonnet + evaluación Haiku 4.5 | ~5,2 | |
| **prompt que NO crece** (ficha ≤ 8.000 tokens fijos), todo Opus | ~8 | |
| ficha ≤ 8.000 fijos, perfil y evaluación en Sonnet | ~4,7 | |
| ficha ≤ 5.000 fijos, perfil Sonnet + evaluación Haiku | **~3,2** | |

Precios de referencia (USD por millón, `costos.ts:26-30` y la tabla de la API cargada en esta
sesión): Opus 5 $5/$25, Sonnet 5 $2/$10, Haiku 4.5 $1/$5; caché: escritura ×1,25, lectura ×0,1.
"Perfil cada N respuestas" no lo tabulé: en el v2 el perfil se necesita cada día porque de ahí
salen `cubiertos` y `puertaAbierta`; si la secuencia deja de depender del perfil (opción 3), el
perfil puede correr cada 3 respuestas y su costo se divide por 3 (de ~1,2 a ~0,4 con Sonnet).

**Lección de la tabla: el modelo importa menos que el tamaño del prompt.** Bajar de Opus a Sonnet
en dos pasos ahorra la mitad; que el prompt deje de crecer ahorra dos tercios. Y la primera es
gratis en calidad (el perfil y la evaluación son tareas de extracción, no de tacto); la segunda
además mejora la pregunta, porque un perfil de 12.700 tokens con 92 "no sabemos" no ayuda a
decidir nada.

### B.5 Contra el v1 y contra el precio (GASTOS.md)

| | USD por libro | Fuente |
|---|---|---|
| Entrevista v1 (Haiku en la pregunta, Opus en la evaluación, adaptativas) | **1,15** | GASTOS.md, medido con Joaquín |
| Entrevista v1 con Opus en la pregunta | ~1,85 | GASTOS/cerebro: +0,68 medido sobre 13 llamadas |
| Entrevista v2 tal como está | ~25 | estimado (B.4) |
| Entrevista v2 compactada | 3-8 | estimado (B.4) |
| Fábrica v1 (libro + edición + PDF) | 4,50-5 | GASTOS.md, medido |
| Fábrica v2 con lector | ~3,2 | diseño §9, **estimado, no medido** |
| WhatsApp | 1-2 | GASTOS.md |
| Pasarela (3-4 % de 49 €) | 1,6-2,1 | GASTOS.md |

Precio: 49 € ≈ USD 53. Margen bruto hoy: ~86-89 % (GASTOS.md). Con cada opción de entrevista
(fábrica v1 a 4,75, WhatsApp 1,5, pasarela 1,8; estimado):

| Entrevista | Costo total | Margen | Queda por venta antes de ads |
|---|---|---|---|
| 1,15 (v1) | ~9 | 83 % | ~44 |
| 4 (esqueleto v2 / híbrido) | ~12 | 77 % | ~41 |
| 8 (v2 compactado, todo Opus) | ~16 | 70 % | ~37 |
| 25 (v2 tal como está) | ~33 | **38 %** | ~20 |

GASTOS.md dice que la cuenta con ads pasa a ser "ads ÷ compras = CAC contra un margen de ~44 € por
venta". Los escenarios viejos suponían ~3 € por registro y 1 compra cada 7 (≈ 21 € de CAC). **Para
que queden ads, la entrevista tiene que costar como el libro o menos: ≤ USD 4-5 por libro**, que
deja ~USD 40 por venta y aguanta un CAC de 20-25 con ganancia real. A USD 8 todavía cierra pero se
come 7 puntos de margen sin devolver nada visible al cliente. A USD 25 no hay ads posibles: con
20 € de CAC la venta deja cero.

---

## C. Esqueleto vs. biógrafo libre: las tres opciones, con honestidad

Lo que el piloto enseñó, en una frase: **el v2 acertó en el "cómo" (perfil, encargo por persona,
controles de salida) y falló en el "qué" (dejar que el peso de las bisagras decida qué se
pregunta).** Las tres opciones se diferencian en quién decide el "qué".

### Opción 1 — v2 arreglado (el biógrafo sigue eligiendo, con los bugs corregidos)

Arreglos: perfil acotado (tope por etapa, bisagra y noSabemos; corregir que pise), `max_tokens`
acordes al pensamiento (o pensamiento en bajo/apagado en perfil y evaluación), `cubiertos` que
tire variables, puerta abierta solo a temas del núcleo, `PESO_BISAGRA` bajo o cero, temas nuevos
en el núcleo (futuro, cada hermano, sobrinos, personalidades), historia grande como tema propio,
no evaluar repreguntas/objetos, modelos por paso, caché.

| | |
|---|---|
| Resuelve | N6, N8, N12, N14, N17, N29, N33, N35, N37 (en parte), N39, N41, N42 (los temas), el costo (a 5-8) |
| No resuelve | **la columna vertebral por bloques + variables genéricas** (N37 de fondo): aunque haya 3 variables de infancia en vez de 9, siguen siendo "algo que no contó" sin tema, y el modelo sigue buscando el pormenor. Y la puerta abierta seguirá mandando a lo duro (N11, N13) porque elige entre lo pendiente, no entre lo que conviene hoy |
| Costo por libro | 5-8 (estimado, B.4) |
| Se reúsa | todo el código v2 |
| Trabajo | 3-5 días de agente, y **otro piloto pago (~USD 8-10) para saber si dejó de rondar**, porque el comportamiento del reparto solo se ve con respuestas reales |
| Riesgo | medio-alto: son diez parches sobre un diseño que Naza pidió "sin parches"; y con un narrador de 76 la infancia va a pesar igual, porque hablan mucho de ella |

### Opción 2 — volver al esqueleto v1 mejorado (guion fijo, el modelo adapta el texto)

El guion de `seed.sql` (26 fijas + 4 adaptativas + 8 objetos), reescrito sin suponer boda/hijos,
con la vida adulta cubierta (bitácora #42), con hermanos/personalidades/futuro/sobrinos/historia
grande como preguntas propias, y Opus en la pregunta en vez de Haiku (+0,68).

| | |
|---|---|
| Resuelve | la cobertura (cada tema obligatorio se pregunta sí o sí), el costo (~2), la repetición de etapa (no hay variables que ronden), la previsibilidad para el panel de la familia (ve el guion) |
| No resuelve | **lo que motivó el v2**: el trato por defecto en usted (bitácora #1), la pareja mujer sin saberlo (C12), Concordia por Buenos Aires (C6), el guion que no se mueve cuando la persona abre una puerta; 14 reglas anti-suposición en `personalizar.ts` en vez de un control sobre la salida. Y el guion de 26 no sabe qué edad tiene la persona: a uno de 27 le pregunta por nietos si nadie lo frena |
| Costo por libro | ~1,6-2 (estimado: v1 medido 1,15 + Opus en la pregunta + evaluación con las últimas 3 respuestas) |
| Se reúsa | producción tal cual; de la rama v2, casi nada (los controles se podrían injertar) |
| Trabajo | 2-3 días (reescribir el guion es lo largo, y lo aprueba Naza) |
| Riesgo | bajo en costo, alto en producto: vuelve a los errores documentados de la primera bitácora |

### Opción 3 — híbrido: esqueleto fijo + pocas preguntas libres + los controles del v2

Un guion fijo **por etapas de la vida**, con los temas obligatorios que Naza listó, escrito para
el público de 60+ pero con tramos que solo existen si se vivieron (uno de 27 no tiene "segunda
mitad"; ya está en `plan-preguntas.ts:111-113`). Cada pregunta del guion trae **el tema y los
pormenores que puede juntar** ("la cuadra, los juegos, los perros, los amigos del barrio: llevame
a una tarde de esas"), y el modelo la escribe para ESTA persona con el encargo v2 y una **ficha
corta** (edad, género, trato, dónde vivió en cada tramo, las personas con vínculo, ≤ 10
"no sabemos"): la ficha es el perfil v2 con tope, no otra cosa. Se conservan los controles de
salida, el "hoy no", el "no quiero seguir", la reserva, los objetos por cambio de tramo y la
puerta manual. Las preguntas libres son pocas (4-6 en todo el libro, una al cerrar cada etapa) y
se eligen de los "no sabemos" de esa etapa, no de un peso. La repregunta cambia de trabajo: en vez
de "ahondá en lo de hoy", **"si de esta etapa faltó algo obligatorio, pedilo junto"**, y como
máximo una por etapa. La historia grande se calcula por año de nacimiento (2001, la pandemia,
Malvinas, la dictadura, el Mundial) y entra como pregunta propia de la etapa que le toque.

| | |
|---|---|
| Resuelve | todo lo de la opción 2 (cobertura, costo, repetición) **y** lo de la opción 1 que vale (perfil que se da cuenta de quién es, controles de salida, trato por persona, tacto después de algo fuerte, historia grande, objetos por etapa). N37 de fondo: los pormenores van adentro de la pregunta del capítulo por construcción. N42 entero: cada tema que faltó es una fila del guion |
| No resuelve | lo que ningún guion resuelve: si la persona contesta corto, el libro sale corto (para eso queda la repregunta acotada); y el "biógrafo que elige" queda reducido a las 4-6 libres. Naza pierde la promesa de "decide todo solo", que el piloto mostró que no conviene |
| Costo por libro | **3-4** (estimado: ficha ≤ 5.000 tokens, Opus en la pregunta, Sonnet en el perfil, Haiku o Sonnet en la evaluación reducida, perfil cada respuesta o cada 3); 5-6 con Opus en todo |
| Se reúsa | `encargo-entrevista.ts` (el encargo y `perfilEnTexto`, con topes), `control-pregunta.ts` y `control-texto.ts` enteros, `perfil.ts` (con topes y "corregir pisa" de verdad), `evaluar-v2.ts` (con otro encargo para la repregunta), `manual-v2.ts` y `estado-v2.ts` casi enteros, la estructura `NUCLEO` como forma del guion (id, tramo, bloque, tema), `RANGO_TRAMO`/`edadDe` para ubicar etapas, `tocaObjeto`. Se va: `planificar`/`replanificar` por peso, las variables genéricas, `puertaAbierta` como reordenador, `cubiertos` para variables |
| Trabajo | el guion lo escribe/aprueba Naza (es lo que más tarda y no es de código); 3-4 días de agente para ficha con topes, secuencia fija por etapas, repregunta con el encargo nuevo, tests; después un piloto pago de ~USD 4-5 |
| Riesgo | bajo-medio: es el v1 con lo aprendido, y el costo se controla por diseño (la ficha no crece) |

### Sobre el público real (60+) y la pregunta que junta pormenores

- Todo el material real sigue siendo de dos personas de 28 y una de 27. Un narrador de 76 con
  el v2 tal como está: `piso(76/6) = 12` + bisagras → 19 variables desde el primer día con
  bisagras, 40 preguntas, y las bisagras que anote el perfil van a pesar donde más cuente
  (normalmente la infancia y la crianza de los hijos). El esqueleto por etapas le da a los 30-60
  sus preguntas por construcción, que es lo que Joaquín pidió en la bitácora #42.
- Con un día entre pregunta y pregunta, la persona de 76 no aguanta ocho preguntas seguidas del
  mismo barrio (N37). El esqueleto, además, le permite a la familia ver de antemano qué se va a
  preguntar (el panel muestra el guion), cosa que con variables generadas al vuelo no existe.
- "Juntar pormenores en una pregunta": en el v2 hoy es imposible porque el pormenor ES la
  variable. En el esqueleto es una regla de escritura del guion: cada fila lista los pormenores
  admisibles y la regla 8 del encargo (dos preguntas como mucho, 45 palabras) sigue mandando.

---

## D. Recomendación, orden y qué NO hacer

**Opción 3, y llamarla "esqueleto v2".** No es volver atrás: es quedarse con lo que el piloto
demostró que sirve (el perfil que reconoce a la persona, el encargo por persona, los controles de
salida, la puerta manual) y sacarle al modelo la decisión que tomó mal (qué preguntar y cuánto de
cada etapa), que además era lo que hacía crecer el prompt. El costo baja a 3-4 por libro por
diseño, no por ajuste.

**Orden de los próximos pasos:**

1. **El guion** (Naza, con el agente redactando): temas obligatorios por etapa, para 60+, con las
   filas que faltaron (cada hermano, cada hijo si los hay, personalidad de la madre y del padre,
   pareja y cómo llegó, trabajo, sobrinos/nietos/la familia hoy, el futuro, la historia grande por
   año de nacimiento) y los pormenores admisibles de cada una. Es un doc para aprobar, no código.
2. **La ficha con topes** (`perfil.ts`): etapas de ≤ 300 caracteres, bisagras de ≤ 150 y una
   por vuelta de vida (no por anécdota), personas con nota de ≤ 80, noSabemos ≤ 10 y podados,
   corregir que pise (N34, N35, N40). Y `max_tokens` acordes al pensamiento, o pensamiento apagado
   en perfil y evaluación (son extracción). Test: el prompt de la pregunta 40 no pasa de 6.000
   tokens con el `contexto.v2` real de Naza como fixture.
3. **La secuencia fija por etapas** (reemplaza `planificar`/`aplicarPerfil`): el guion ordenado,
   las libres al cerrar cada etapa desde los "no sabemos", los objetos como hoy. `cubiertos` solo
   salta una fila del guion si el perfil lo dice con evidencia, y se registra.
4. **La repregunta con el encargo nuevo** ("lo obligatorio de esta etapa que faltó, junto"), una
   por etapa como máximo; no evaluar repreguntas ni objetos salvo reserva/parar (N29).
5. **Modelos por paso**: Opus en la pregunta y la repregunta; Sonnet en el perfil; Haiku o Sonnet
   en la evaluación. Se mide con `consumo_ia` como en este piloto.
6. **Piloto pago** con el mismo Naza (~USD 4-5, avisando antes), midiendo tres números: costo por
   libro, cuántos temas obligatorios salieron, y cuántas preguntas seguidas de la misma etapa.
   Recién ahí, el libro.

**Qué NO hacer:**

- No conectar el v2 tal como está al flujo real, ni siquiera "para probar con un narrador
  real": USD 25 por libro y la persona se cansa en la infancia.
- No arreglar el v2 a parches (opción 1) esperando que el reparto por bisagras deje de rondar:
  el problema es la regla, no un número.
- No volver al v1 pelado (opción 2): pierde el perfil y los controles, que son lo que evita los
  errores graves de la primera bitácora (usted a un pibe, la pareja mujer, la ciudad equivocada).
- No armar el libro de Naza con estas 25 respuestas todavía: el material es de una etapa y media
  y el lector final lo va a decir; es gastar USD 3-6 para confirmar lo que ya se sabe.
- No cambiar de modelo "para bajar costo" antes de acotar el prompt: es la palanca chica.
- No correr ningún paso pago sin avisar el costo (regla de la memoria del proyecto).

---

## Qué decide Naza

| # | Decisión | Mi recomendación |
|---|---|---|
| 1 | **¿Esqueleto v2 (opción 3), v2 arreglado (1) o v1 mejorado (2)?** | **Opción 3.** Resuelve lo que faltó por construcción y baja el costo a 3-4 por diseño. |
| 2 | **¿Quién escribe el guion de temas obligatorios y para quién?** | Lo redacta el agente en un doc para aprobar, con tus filas de N42 y las de 60+ (hijos, nietos, jubilación, pérdidas), por etapa, cada fila con sus pormenores admisibles. Lo aprobás vos antes de tocar código. |
| 3 | **¿Cuántas preguntas libres deja el biógrafo, y de dónde salen?** | 4-6 en todo el libro, una al cerrar cada etapa, elegidas de los "no sabemos" de esa etapa. Nada de variables por peso. |
| 4 | **¿Qué modelo en cada paso?** | Opus 5 en la pregunta y la repregunta (es donde se nota); Sonnet 5 en el perfil; Haiku 4.5 o Sonnet en la evaluación. Cambia `HERMES.md` ("el entrevistador con Opus 5 y Haiku 4.5"): se anota ahí al decidirlo. |
| 5 | **¿Qué se hace con las 25 respuestas de este piloto?** | Quedan como fixture de tests (el `contexto.v2` real para medir el tamaño del prompt) y para el próximo piloto, no se arma el libro. Si igual querés leer "tu libro" ahora, son USD 3-6 y va a salir de una etapa y media. |
