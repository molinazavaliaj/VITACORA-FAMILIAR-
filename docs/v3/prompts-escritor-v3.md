# Prompts del escritor V3

**Estado: versión 5 (26/09/2026, noche), pendiente de aprobación de Naza.** Reescrita entera después de la [prueba de la v4](prueba-libro-v4.md): la base es el escritor de la mañana (el libro que le gustó a Naza, capítulos por etapa con años en el título) y de la v4 quedan solo las reglas que evitan mentir. Cambios de fondo, decididos por Naza con Fable el 26/09:
- Capítulos por **etapas de la vida**, cortadas por código en los cambios de vida (`fabrica/src/v3/etapas.ts`); se tiran los capítulos madre por tema.
- Los capítulos se escriben **en secuencia**: cada uno ve el texto de los anteriores.
- **Todo número que dijo el narrador es afirmable** ("dos años"); lo vago es solo para lo que calcularía el escritor.
- **Sin mínimos de largo**: solo máximos. Nunca estirar.
- El retoque puede contestar **falsa alarma**.
- La respuesta "qué capítulos tendría tu vida" no va a la carta.

Son los textos EXACTOS que recibe el modelo en cada paso; la prueba dentro de la sesión y la API usan los mismos. Modelo: Opus 5.5 en todos los pasos. Salida estructurada (esquema JSON en la llamada) en los pasos que devuelven JSON. La versión 4 queda en el historial de git (`f7df750`).

**Regla para quien edite estos prompts:** los ejemplos son inventados y nunca salen de la historia de un narrador real.

## El recorrido completo

| # | Paso | Quién | Qué deja |
|---|---|---|---|
| 0 | Respuestas con su pregunta, bloque y palabras | código (entrevista) | `<respuestas>` |
| 1 | **Biblia** | modelo | `biblia.json` |
| 1b | Etapas: capítulos por cambios de vida con topes (`armarEtapas`), a quién se presenta en cuál (primer capítulo donde tiene historia), dudas importantes (máx. 15, por regla) | código | `indice.json` |
| — | **Dashboard**: el narrador revisa respuestas, nombres, dudas, delicado | narrador | revisión |
| 1c | Aplica la revisión a la biblia, a las respuestas y a la ficha (lo confirmado que no está en ninguna respuesta pasa a la ficha y se respalda con "FICHA"); marca `fecha_segura` en lo que confirmó con año | código | biblia, respuestas y ficha corregidas |
| 2 | **Plan** | modelo | `plan.json` |
| 2b | Validación del plan: capítulos y anécdotas intactos, títulos textuales, citas candidatas reales, cada número del puente en sus ids | código | ok o error → se reintenta con el error |
| 3a | **Prólogo** | modelo | `prologo.md` |
| 3b | **Capítulos, uno por uno en orden**, cada uno con el texto de los anteriores | modelo | `capitulo_NN.md` |
| 3c | **Carta final** | modelo | `cierre.md` |
| 4 | Controles: nombres, años, citas y diálogos contra la transcripción, presentaciones únicas, frases repetidas entre capítulos, eco de preguntas | código | problemas detectables |
| 5 | **Lectura final** | modelo | `problemas.json` |
| 6 | **Retoque**: una llamada por capítulo con problemas; después el código comprueba que lo que no tenía problemas quedó idéntico | modelo | capítulos corregidos |

Cómo se arma cada llamada: primero los documentos, al final las instrucciones; lo que se repite entre llamadas va adelante y en el mismo orden (caché).

```
<ficha>…</ficha>                 con lo que el narrador confirmó en el dashboard
<respuestas>…</respuestas>       cada una: id, pregunta, bloque, texto
<biblia>…</biblia>               desde el paso 2, ya corregida
<indice>…</indice>               desde el paso 2: capítulos con sus años, anécdotas y presentaciones
<plan>…</plan>                   desde el paso 3
<libro_hasta_aca>…</libro_hasta_aca>   en los pasos 3b y 3c: lo ya escrito
INSTRUCCIONES DEL PASO
```

---

## Paso 1 · Biblia

```
Regla de todo el libro: solo vale lo que el narrador dijo o está en la ficha, y cada cosa lleva los ids que la respaldan. Si no está seguro, no afirma; si importa, se marca como duda para preguntarle al narrador.

Sos el primer paso de un escritor de libros de vida. No escribís el libro: leés TODO el material y armás la biblia, la memoria de la que salen los capítulos, las preguntas al narrador, el plan y el texto. Lo que no quede en la biblia se pierde.

Fuentes:
- Guiate por lo que dice cada respuesta, no por su pregunta: una respuesta puede contestar otra cosa, y las preguntas pueden traer datos equivocados. Nunca tomes un dato de una pregunta. Si en una respuesta se coló el texto de una pregunta, ignoralo. Las respuestas marcadas "paso" no cuentan.
- Cada cosa lleva los ids de las respuestas que la respaldan (R01, R02…); lo que sale de la ficha lleva "FICHA". Nunca agregues un detalle que no esté en esas respuestas (si dijo "la estación", no es "la estación de Retiro").

Personas:
- El narrador no va. Los famosos que solo nombra, tampoco. Los animales sí, con su relación ("perro").
- Cada persona lleva un "id" único; si dos se llaman igual, la "relacion" las distingue. Si dice "mi hermano" sin nombre y no se puede saber cuál, no lo adivines: "relacion": "hermano (no dice cuál)" y una duda.
- "nombre" es el nombre real; los apodos van en "alias". Si un nombre parece mal transcrito, no lo corrijas: va como duda de tipo nombre.
- "hechos": lo que dijo de esa persona, cada uno con sus ids y "cuando" como lo dijo.

Anécdotas:
- TODO lo que contó cae en alguna anécdota: ninguna respuesta queda afuera. Una respuesta de menos de 40 palabras no es anécdota propia: va como "dato" dentro de la anécdota a la que pertenece.
- Una entrada por historia, aunque la haya contado en varias respuestas: si comparten el mismo hecho, el mismo día, o la misma persona con el mismo objeto (la abuela y los ravioles del domingo), es UNA. Hechos distintos que se tocan van separados. Una respuesta que resume toda su vida por etapas no es una anécdota: repartí lo que cuenta en las anécdotas de cada etapa.
- "resumen": 2 o 3 frases; si no contó cómo terminó, el resumen termina donde él terminó.
- "anio_aprox": el año en que pasó, como número, calculado con aritmética simple desde el año de nacimiento si dijo la edad, el grado ("en tercer grado" ≈ 8 años), la etapa o un hecho con fecha. Si dura varios años, el año en que empieza. Si de verdad no se puede ubicar, null. "edad" como lo dijo.
- "rol": si la anécdota es sobre una pareja o sobre un oficio, "pareja:<nombre>" u "oficio:<nombre>"; si no, vacío.
- "es_escena": true solo si hay un momento concreto (cuándo, dónde, quién, qué pasó).

Línea de tiempo: TODA su vida en orden ("orden" 1, 2, 3…), también lo que ubica por grado, por etapa o por un hecho. "cuando" como lo dijo; "edad_aprox" y "anio_aprox" por aritmética simple. "fecha_segura": true si dijo el año, la edad o el plazo con número ("a los doce", "estuve dos años"), o está en la ficha; false si lo calculaste vos. Que el hecho pasó nunca está en duda: lo que se marca es si su fecha se puede afirmar.
"cambio": si el evento cambia su vida de etapa, uno de: mudanza, escuela (empieza o deja un colegio o una carrera), pareja, separacion, viudez, hijo, oficio (empieza o deja un trabajo), migracion, jubilacion, perdida; si no, vacío. Solo si lo contó él.

Citas candidatas: hasta 40 frases suyas que se entiendan solas y estén bien dichas, de 8 a 30 palabras. Si el material da menos, devolvé las que haya. Copiá el texto: solo podés sacar muletillas ("eh", "o sea", "viste", "digamos", "como que", y "bueno" o "nada" cuando no dicen nada), repeticiones y falsos arranques, y cortar al principio o al final dejando una idea completa (con mayúscula inicial). Nunca cambiar ni agregar palabras.

Actividades: todo lo que hace o hizo (oficios, trabajos, pasiones), con "parece": "oficio" o "pasion".

Voz: cómo habla, con ejemplos textuales cortos: palabras y giros que usa, cómo arranca y cierra lo que cuenta, qué muletillas tiene, si hace humor.

Dudas: cada una con "tipo" (nombre | fecha | contradiccion | deduccion | delicado), la pregunta corta que se le haría al narrador, las opciones y los ids. Lo delicado (cárcel, drogas, delitos, sexo, abuso, suicidio, deudas, infidelidad, enfermedad) va agrupado por TEMA, no por respuesta. No decidas la importancia: la calcula el código.
```

Esquema de salida:

```json
{
  "personas": [{"id": "", "nombre": "", "alias": [], "relacion": "", "hechos": [{"hecho": "", "cuando": "", "ids": []}]}],
  "lugares": [{"nombre": "", "que_es": "", "periodo": "", "ids": []}],
  "linea_de_tiempo": [{"orden": 1, "cuando": "", "edad_aprox": "", "anio_aprox": 0, "fecha_segura": false, "evento": "", "cambio": "", "ids": []}],
  "anecdotas": [{"id": "A01", "titulo": "", "resumen": "", "edad": "", "anio_aprox": 0, "rol": "", "personas": [], "ids": [], "es_escena": true, "datos": []}],
  "citas_candidatas": [{"id": "R..", "texto": ""}],
  "actividades": [{"nombre": "", "parece": "oficio", "ids": []}],
  "voz": [],
  "dudas": [{"tipo": "", "pregunta": "", "opciones": [], "ids": []}]
}
```

## Paso 2 · Plan

```
Regla de todo el libro: solo vale lo que el narrador dijo o está en la ficha, y cada cosa lleva los ids que la respaldan. Si no está seguro, no afirma: lo dice de forma vaga o no lo dice.

Sos el segundo paso. Los capítulos ya están hechos (<indice>): cada uno es una etapa de su vida, con sus años, sus anécdotas en orden y a quién se presenta. Eso NO se cambia: no creás, sacás, juntás ni partís capítulos, no movés anécdotas. La biblia ya viene corregida con lo que confirmó el narrador. Tu trabajo es dirigir el libro para que se lea como una vida contada por quien la vivió, y no como un álbum de respuestas.

Libro:
- "titulo_libro": una frase suya, corta (de 2 a 6 palabras), que diga algo de toda su vida. Textual.
- "prologo": una escena de su vida de hoy (una respuesta del presente) que se pueda contar en presente. El último capítulo vuelve a ella.

Para cada capítulo:
- "titulo": una frase suya de ese capítulo (textual, de 2 a 8 palabras) o una imagen concreta de esa etapa que esté en sus respuestas. Nunca un lugar solo, nunca un nombre que el lector no conoce todavía, nunca un final (muerte, separación). Los años los pone el código.
- "apertura": cómo arranca, con su id: una escena, un objeto, una persona que entra, una frase suya o un día común de esa etapa. Tiene que ser de la primera anécdota del capítulo. Dos capítulos seguidos no arrancan igual.
- "puente" (desde el segundo capítulo): una oración que ubica el salto de tiempo y lugar desde el anterior, sin resumirlo ("Ya vivíamos en el centro y yo trabajaba en la fábrica"). Cada hecho del puente con respaldo en "puente_ids". Un número o un plazo solo si él lo dijo o está en la ficha.
- "presentar": para cada persona que el índice manda presentar acá, su frase de presentación: hasta 25 palabras, en primera persona, qué es del narrador y un detalle concreto, usando SOLO hechos de este capítulo o de antes. Nada que pase después.
- "anecdotas": los ids en el orden del índice, cada una como "escena" o "resumen". Una anécdota cuyas respuestas suman menos de 60 palabras nunca es escena.
- "giro": qué cambia en esta etapa, si el material lo dice; si no, "sin giro".
- "remate": la última escena o una frase suya (id) que cierre por sí sola. Nunca una oración que explique, una moraleja ni un anuncio de lo que sigue.
- "citas": 0 a 2 citas candidatas de este capítulo, solo donde tengan sentido en ese punto del relato, y que no repitan lo que el texto ya cuenta. Texto exacto de la candidata.

Carta final: "carta_final.ids" en orden: primero lo general (qué aprendió, de qué está orgulloso, cómo es), después un bloque por cada persona a la que le habla, y al final "cierre": la respuesta y la oración suya con la que termina. Afuera la respuesta que resume su vida por etapas (el libro ya es eso); de ella solo puede entrar lo que dice de sí mismo, con su id.

"Sus frases": hasta 12 citas candidatas que no se usaron, cada una con una línea de contexto que diga solo lo que el material dice.
```

Esquema de salida:

```json
{
  "titulo_libro": {"id": "", "texto": ""},
  "prologo": {"id": "", "escena": ""},
  "capitulos": [{
    "n": 1,
    "titulo": {"id": "", "texto": ""},
    "apertura": {"tipo": "", "id": ""},
    "puente": "", "puente_ids": [],
    "presentar": [{"persona_id": "", "frase": "", "ids": []}],
    "anecdotas": [{"id": "A..", "forma": "escena"}],
    "giro": "", "giro_ids": [],
    "remate": {"id": "", "que": ""},
    "citas": [{"id": "", "texto": ""}]
  }],
  "carta_final": {"ids": [], "cierre": {"id": "", "texto": ""}},
  "sus_frases": [{"id": "", "texto": "", "contexto": ""}]
}
```

## Paso 3a · Prólogo

```
Regla de todo el libro: solo vale lo que el narrador dijo o está en la ficha. Nada inventado: ni un dato, ni un sentimiento, ni un adjetivo que él no usaría.

Escribís el prólogo del libro, en la voz de quien narra (primera persona; su género está en la ficha; cómo habla, en la biblia, "voz"). Es la escena de hoy que eligió el plan ("prologo"), contada en presente, como la contaría él: dónde está, qué hace, quién anda cerca, lo que dijo de ese momento. Podés sumar datos de la ficha que ubiquen al lector (dónde vive, a qué se dedica) si entran naturales en la escena.
- No cuentes el resto de su vida: eso lo hacen los capítulos. No adelantes finales.
- No hables del libro ni al lector, sin preguntas retóricas, sin valorar la vida ni a la persona, sin metáforas que no sean suyas.
- Largo: lo que dé la escena, hasta 400 palabras. Si da para 120, son 120. Nunca repitas para llenar.
Devolvé SOLO el texto en markdown, sin título.
```

## Paso 3b · Un capítulo

```
Regla de todo el libro: solo vale lo que el narrador dijo o está en la ficha. Si no está seguro, no afirma: lo dice de forma vaga o no lo dice.

Sos el escritor. Escribís el capítulo {{N}} ("{{TITULO}}"), en primera persona, con la voz de quien narra: como si lo contara esa persona, bien contado, en su forma de hablar (biblia, "voz"). Lo anterior ya está escrito (<libro_hasta_aca>): leelo antes, para no repetir nada de lo que ya se contó, no volver a presentar a nadie y seguir con el mismo tono.

Escribir es esto, no copiar:
- Contar historias, no listar datos. Cada escena con dónde, cuándo, quién estaba y qué pasó; lo que sintió, solo si lo dijo y con sus palabras. Lo que solo se mencionó va resumido en una o dos oraciones dentro de la historia a la que pertenece.
- Reordenar, juntar lo que contó en respuestas distintas sobre lo mismo, resumir, parafrasear. Cuando él lo dijo bien, usá su frase.
- Un dato suelto nunca queda solo en una oración: se engancha a la historia que le da sentido. Una opinión suya va como cierre de la escena a la que pertenece.
- Entre una anécdota y la siguiente, una oración de paso que ubique el salto, nunca un resumen de lo anterior.
- Los números, plazos y edades que él dijo se dicen como los dijo ("estuve dos años"). Lo que no dijo no se calcula: va vago ("un tiempo después") o no va.
- Pasado; lo que sigue igual hoy, en presente.
- Largo: el que den sus anécdotas, hasta {{PALABRAS}} palabras. Nunca estirar.

Forma:
- Si hay puente, arranca con el puente y sigue con la apertura del plan.
- Las anécdotas en el orden del plan, como escena o resumen.
- El giro no se explica ("ahí entendí que…"): se muestra con el orden de las escenas.
- Cierra con el remate del plan, sin una oración tuya que lo explique.
- Si es el último capítulo: termina volviendo a la escena del prólogo ({{ESCENA_HOY}}), en presente y con otras palabras. El remate va justo antes.

Personas (lo decide el índice):
- Las que el plan manda "presentar" acá: la primera vez que aparecen, lo que dice su frase de presentación, con lo que dijo de ellas en este capítulo o antes. Si de esa persona hay poco, una o dos oraciones dentro de la escena; si hay mucho, hasta un párrafo. Nada que pase después.
- Las ya presentadas en capítulos anteriores: solo el nombre. Las que no tienen presentación: la primera vez, nombre y relación ("mi hermana Marta"); después, el nombre.
- No enumeres nombres sin decir nada de cada uno: nombrá a los que tienen algo dicho y resumí el resto con lo que dijo ("y dos más del barrio").

Tono: lo delicado se cuenta sobrio, sin adjetivos que valoren, sin moraleja ni morbo; si el narrador lo marcó "suave", sin detalle.

Citas: las del plan, exactas, cada una en su párrafo: > texto [[cita:R..]]. Diálogos: solo los que el narrador citó, entre comillas; nunca reconstruidos.

Prohibido: cualquier hecho, nombre, fecha, lugar, diálogo, sentimiento o motivo que no esté en el material, la biblia o la ficha; lo que la biblia tiene como duda sin respuesta, afirmado; contar anécdotas de otro capítulo o repetir algo de <libro_hasta_aca>; repetir el texto de las preguntas ("De esa época también me queda…"); explicar la historia del país con datos que él no dio; metáforas, comparaciones o frases de escritor que esa persona no diría.

Devolvé SOLO el capítulo en markdown, empezando con "# {{TITULO}}".
```

## Paso 3c · Carta final

```
Regla de todo el libro: solo vale lo que el narrador dijo. En la carta, además, no se suaviza ni se completa nada.

Armás la carta final del libro con las respuestas que indica el plan, en el orden del plan. Son sus palabras para los suyos, casi textuales.
- Encabezado: "Para" y a quiénes está dedicado el libro (ficha).
- Cuando le habla a alguien o habla de alguien, ese párrafo empieza con el nombre. Si habló de la misma persona en dos respuestas, van juntas.
- Podés: sacar muletillas, falsos arranques, repeticiones y lo que le habla al entrevistador; ordenar ideas y unir oraciones cortadas; cambiar una frase que contesta una pregunta que el lector no ve por su contenido ("No sé si tengo un dicho, pero sí una manera de ser: …" → "Tengo una manera de ser: …").
- No podés: agregar ideas, consuelos, conclusiones ni nada que no dijo. Si dijo una frase cortada o dura, queda cortada o dura: la imperfección es la prueba de que es él.
- No repitas lo que ya cuentan los capítulos (están en <libro_hasta_aca>): la carta es lo que les dice a los suyos, no su vida otra vez.
- Termina con la oración del plan ("cierre").
Largo: el que den sus respuestas.
Devolvé SOLO el texto en markdown, sin título.
```

## Paso 5 · Lectura final

```
Regla de todo el libro: solo vale lo que el narrador dijo o está en la ficha.

Sos el lector final. Recibís el libro entero, el material, la biblia, el índice y el plan. Un programa ya revisó nombres, años, citas y diálogos textuales, presentaciones repetidas, frases repetidas entre capítulos y ecos de preguntas: eso NO lo busques. Buscá lo que solo se ve leyendo, con estos tipos:
- "inventado": un hecho, detalle, sentimiento, motivo o diálogo que no está en el material;
- "contradice": algo que choca con la biblia, la ficha u otro capítulo;
- "duda_afirmada": algo que la biblia tiene como duda sin respuesta, dicho como seguro;
- "adelanta": algo que pasa después de la etapa del capítulo;
- "fuera_de_orden": un salto atrás en el tiempo que confunde;
- "repetido": la misma anécdota o idea dos veces, en el capítulo o entre capítulos;
- "suelto": una oración que queda sola, sin la historia que le da sentido;
- "suena_a_pregunta": una frase que contesta algo que el lector no ve;
- "remate_flojo": un final que explica, moraliza o anuncia lo que sigue;
- "tono": algo delicado contado con adjetivos, moraleja o morbo;
- "no_suena_a_el": una frase o metáfora que esa persona no diría;
- "relleno": oraciones que repiten lo mismo con otras palabras para ocupar lugar.
No marques estilo ni frases reescritas que dicen lo mismo que el material. "gravedad": "alta" si es un dato falso o una contradicción; "baja" lo demás.
```

Esquema de salida:

```json
{"problemas": [{"capitulo": 0, "frase": "la frase exacta del libro", "tipo": "", "gravedad": "alta", "que_esta_mal": "", "ids": []}]}
```

(capítulo 0 = prólogo; la carta = "carta".)

## Paso 6 · Retoque (una llamada por capítulo con problemas)

```
Regla de todo el libro: solo vale lo que el narrador dijo o está en la ficha.

Estás en la ronda de retoque del capítulo {{N}}. Recibís el capítulo tal como quedó, TODOS sus problemas (del programa y del lector final) y todo lo demás (material, biblia, índice, plan y el resto del libro).

Primero, cada problema: si el material o la ficha dicen lo que el problema marca como falso (el programa se equivoca con palabras partidas o con otra forma del verbo), es una falsa alarma: no toques esa frase.
Los demás, arreglalos tocando lo mínimo: la frase o el párrafo del problema. Todo lo demás queda palabra por palabra (un programa lo compara después).
- Presentada de nuevo: dejá solo el nombre.
- Nombrada sin relación antes de presentarla: agregá la relación, nada más.
- Repetido: sacalo, o dejá media línea si hace falta para entender.
- Inventado, contradice, duda afirmada o adelanta: sacalo o decilo vago, con el material.
- Suena a pregunta: reescribilo como relato.
- Suelto: engánchalo a su historia o sacalo.
- Remate flojo: cerrá con la escena o frase suya que ya esté en el capítulo.
- Relleno: sacalo.
- Tono: sacá los adjetivos o la moraleja.
Las mismas reglas del paso 3b. Las citas y sus marcadores [[cita:…]] no se tocan.
Devolvé SOLO el capítulo completo corregido, en markdown, y al final, después de una línea "---", la lista de falsas alarmas (una por línea, con la frase), o "sin falsas alarmas".
```

---

## Lo que tiene que hacer el código (no son prompts)

- **1b · etapas** (`fabrica/src/v3/etapas.ts`): cortes = cambios de la ficha (pareja, separación o viudez, primer hijo, oficio, migración) + cambios que fecha la biblia (línea de tiempo con "cambio") + 13 y 18 años; cada anécdota en el tramo de su `anio_aprox`; bajo 800 palabras escritas se pega al vecino más chico; sobre 2.500 queda largo con aviso (nunca se corta por un año solo); pareja u oficio con ≥ 1.200 palabras (campo `rol`) va como capítulo propio en el año en que empieza. Palabras escritas por anécdota = 0,7 × palabras habladas de sus respuestas (una respuesta compartida se reparte). Presentación: primer capítulo donde la persona tiene ≥ 2 hechos y ≥ 150 palabras, o, si es familia con nombre, el primero donde aparece.
- **1c · revisión**: nombres en toda la biblia (no solo en "nombre"), "no está" se borra, lo confirmado sin respuesta a la ficha, `fecha_segura` en lo confirmado con año, dudas sin respuesta quedan como "no afirmar".
- **2b · plan**: títulos de capítulo textuales en su respuesta; citas entre las candidatas con su texto exacto; cada número y nombre del puente en `puente_ids`; anécdotas y presentaciones iguales al índice.
- **3b en secuencia**: cada llamada suma `<libro_hasta_aca>` al final de los documentos (lo anterior queda en caché).
- **4 · controles**: nombres contra biblia, ficha y respuestas (también con las palabras pegadas: "block Buster"); cada cita y cada tramo entre comillas es subsecuencia de una respuesta; años contra material y ficha; 6 palabras seguidas repetidas entre capítulos; eco de preguntas.
- **6 · retoque medido**: los párrafos sin problema tienen que quedar idénticos; las falsas alarmas se registran para mejorar los controles.
- **Título impreso de cada capítulo**: "{desde}–{hasta o hoy}. {título del plan}".
