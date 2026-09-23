# Biógrafo v2 — el punto de partida

> Para el brainstorming entre Naza, Joaquín y el agente (23/09). **Esto no propone
> soluciones**: deja sobre la mesa lo que sabemos, cómo lo sabemos y qué falta decidir.
> Todo está verificado contra el código, la base y las transcripciones reales.
>
> Se lee junto con `docs/cerebro-del-biografo-para-revisar.md`, que tiene el inventario
> de los doce prompts y cuánto cuesta cada modelo.

---

## Lo que cambió el diagnóstico: el narrador leyó su libro

Veníamos investigando **el entrevistador** —por qué el biógrafo pregunta mal—. Entonces
Joaquín leyó su propio libro terminado y dijo tres cosas. **Ninguna de las tres está en el
entrevistador.** Dos son de la fábrica y una del guion.

Y lo primero que dijo fue que el libro le gustó: *"está bien contado, tiene estructura"*.

Eso no anula lo del entrevistador —los errores de Ciro son reales y duelen en la
entrevista— pero ordena la prioridad: **el libro salió bien con esos errores adentro**.

## Los tres, con su causa

### 1. "Un párrafo se lo inventó" — y tenía razón: no era suyo

**Lo encontró Naza yendo al audio.** El párrafo señalado (los muñecos, el balcón, el
perrito) **no lo dijo Joaquín: la voz es de Ciro**.

Verificado en la base: `Ciro/dia_03.ogg` (38 s, su orden 3, cargado el 17/09 a las
**17:06**) y `Joaquin/dia_27.ogg` (38 s, orden 27, cargado a las **17:08**) tienen la
transcripción idéntica palabra por palabra. Ese día se cargaban los dos pilotos en
paralelo por la puerta manual. A las 17:16 se cargó en esa misma orden el audio correcto
—el padre que se fue a Chile—: **quien cargaba se dio cuenta, pero el malo quedó en la
base** y su material entró al libro, capítulo «La infancia».

- **Alcance medido**: uno solo en 83 respuestas (3.403 comparaciones, cero cruces más).
- **Hecho**: candado en la puerta manual (`src/db/duplicados.ts`), validado contra las 83
  respuestas reales con cero falsos positivos.
- **El libro de Joaquín no se corrige**: es el socio probando (Naza, 23/09).

**Y esto es lo que tiene que cambiar el orden de la reconstrucción.** El modelo hizo bien
su trabajo: escribió fielmente el material que le dimos. El material estaba mal. **El mejor
prompt del mundo, con el audio de otra persona, escribe el libro de otra persona.** Antes
de rediseñar el cerebro hay que poder afirmar que lo que le damos de comer es correcto — y
hoy no teníamos forma de saberlo.

**Las dos lecciones de método, que valen más que el arreglo:**

1. **Este error no lo detecta nadie.** Ni el modelo, ni la familia (no estuvo en la
   entrevista), ni ninguna revisión de código. Solo el narrador, leyendo el libro
   terminado, cuando ya está impreso.
2. **Cuando alguien que estuvo ahí dice "esto no lo dije yo", se va AL AUDIO, no a la
   transcripción.** Acá se verificó contra la base —que estaba mal— y se le contestó al
   narrador que se equivocaba. Verificar contra la base solo prueba que el libro es fiel a
   lo que la base dice; si el dato entró mal, la verificación **confirma la mentira con más
   autoridad**.

### 2. El libro repite

Si en el audio lo dice dos veces, el libro lo pone dos veces, con las mismas frases.

**Causa estructural, no de redacción**: el escritor recibe el material **dos veces** —el
material principal del capítulo *y* la historia completa, con la instrucción de traer de
ahí lo que pertenezca al capítulo— y **ninguna regla dice qué hacer cuando algo viene
repetido**. La regla 2 lo empuja a conservar: *"tu trabajo es ordenar y pulir apenas, no
redactar bonito"*.

En un audio de gente mayor, repetir es lo normal: se repite para enfatizar o al retomar el
hilo. Le pedimos fidelidad y nadie le dijo que **fidelidad no es transcripción**.

### 3. El guion no cubre la vida adulta

| Capítulo | Preguntas |
|---|---|
| La juventud | 5 |
| La infancia | 4 |
| Las raíces · El amor · El oficio · Los hijos · La sabiduría | 3 c/u |
| Las pruebas | 2 |

**Infancia y juventud se llevan 9 de 26.** Todo lo que pasa entre los 30 y los 60 —trabajo,
hijos creciendo, mudanzas, pérdidas— entra en "El oficio" y "Los hijos": seis preguntas.

Lo dijo Joaquín, que tiene 28 y no lo sufrió: *"a una persona de 60 le falta preguntarle
por sus 30/40… ahonda mucho en temas en vez de ocuparse de más etapas de la vida"*. **El
target del Familiar es 60+.**

---

## Lo que ya sabíamos del entrevistador (del otro documento)

- La pregunta del día la escribe **Haiku**, no Opus. Pasarlo a Opus: **+USD 0,68 por libro**,
  el 1 % del precio.
- Le pedimos que **decore** la pregunta, no que la **juzgue**; ante la duda, la regla lo
  manda a devolver el original con el supuesto adentro. Las 14 reglas anti-suposición son
  parches contra esa instrucción.
- Reescribe el **100 %** de las preguntas: el paso corre, está mal definido.
- Las 8 preguntas de objeto no pasan por ningún modelo.
- La evaluación no recibe la historia; el trato se decide una vez con la ficha vacía.

---

## Lo que tenemos para trabajar, que es más de lo que parece

| Material | Qué es | Dónde |
|---|---|---|
| **1 libro real terminado** | 89 páginas, el de Joaquín (él leyó el PDF del 18/09). El de Osvaldo es del set dorado: una prueba, no una persona | Storage, `{narrador}/paquete/libro.pdf` |
| **35 + 18 respuestas reales** | Joaquín y Ciro, **los dos de 28 años**: no hay ninguna respuesta real de alguien de 60+ | tabla `respuestas` |
| **Los borradores por capítulo** | lo que escribió el modelo ANTES de la pasada de editor | `borrador_cap_NN.md` |
| **43 hallazgos + 14 de Ciro** | dos años de errores documentados en dos semanas | `docs/piloto-*.md` |
| **El set dorado** | 30 respuestas para correr el cerebro sin gastar en gente | `npm run prueba-cerebro` |

**Nadie procesó nunca este material en conjunto.** Es lo primero que debería entrar a
NotebookLM — antes que cualquier libro sobre cómo entrevistar.

## Lo que se puede medir solo, sin opinar

Con las transcripciones como fuente de verdad se pueden construir **pruebas automáticas de
fidelidad** que hoy no existen:

- **Invento**: ¿hay frases del libro que no tengan respaldo en el material? (así se
  verificó el párrafo de los muñecos, a mano, en dos minutos).
- **Repetición**: ¿hay dos oraciones del mismo capítulo que digan lo mismo?
- **Cobertura**: ¿qué franjas de la vida quedaron sin una sola pregunta?
- **Trato**: ¿hay vos y usted en el mismo texto?

Eso convierte "el libro mejoró" en un número, y permite comparar dos versiones del mismo
libro sin depender de que alguien lo lea entero.

---

## Cómo probar sin romper lo que anda

Se puede, y es barato:

1. **Rama nueva** (`biografo-v2`). Producción sigue con los prompts de hoy.
2. **Regenerar el libro de Joaquín con los prompts nuevos**, sin tocar la base ni Storage:
   el material ya está guardado (las 35 respuestas y los borradores), así que rehacer un
   capítulo cuesta centavos y el libro entero ~USD 6-8.
3. **Comparar los dos libros** con las pruebas de fidelidad de arriba, y leerlos.
4. Y para el entrevistador, lo mismo con `prueba-cerebro` contra el set dorado (~USD 1):
   prompt viejo vs nuevo, Haiku vs Opus.

**Nada de esto toca a un narrador real.** Los dos libros ya están entregados; rehacerlos en
paralelo no los cambia.

---

## Las preguntas que hay que decidir, y las decide el equipo

0. **¿Cómo sabemos que el material es el correcto?** Es previa a todas las demás y hasta hoy
   nadie la había hecho. Un audio mal cargado convierte al mejor prompt en un generador de
   libros ajenos, y el único que lo puede detectar es el narrador con el libro impreso en la
   mano. El candado de la puerta manual tapa el caso conocido; la pregunta de fondo sigue
   abierta: **¿qué otras formas hay de que entre material que no es de esta persona?**
1. **¿Qué es fidelidad?** Hoy le pedimos al escritor las palabras del narrador, y el
   resultado repite como repite el habla. ¿Fidelidad es copiar lo que dijo, o contar lo que
   quiso decir con sus palabras? No es lo mismo, y todo el estilo del libro depende de eso.
2. **¿Cuál es el trabajo del biógrafo al preguntar?** ¿Decorar la pregunta del guion, o
   decidir cómo preguntarle a esta persona?
3. **¿El guion cubre una vida o cubre una infancia?** Si el target es 60+, ¿cómo se reparten
   26 preguntas en 80 años?
4. **¿Dónde ponemos el dinero?** El 1 % del precio compra el modelo grande en la pregunta
   del día.
5. **¿Qué le decimos al narrador cuando lee su libro?** Joaquín no reconoció sus propias
   palabras. Eso va a pasar siempre.

---

## Pregunta 0, medida (23/09, rama `biografo-v2-material`)

**La prueba existe:** `cd entrevistador && npm run auditar-material -- <como le dicen>` (o
`--todos`, y `--bajar <carpeta>` para descargar los audios a escuchar). No toca la base. Sale
con código 1 si hay algo grave, así puede usarse de freno antes de escribir un libro.

**Lo que dio sobre el material real:**

| | Grave | Revisar | Info |
|---|---|---|---|
| Joaquín (35) | 1 — la orden 27 es de Ciro | 6 cargas intercaladas | 5 órdenes con dos respuestas, 1 sin audio |
| Ciro (18) | 1 — su orden 3 está también en Joaquín | 7 cargas intercaladas | 5 órdenes con dos respuestas |

- **El candado separa limpio**: el cruce da 1,00 de parecido; el par ajeno más parecido que
  le sigue, 0,50. No hay zona gris.
- **El riesgo fue sistemático, no un minuto de mala suerte**: el 16 y el 17/09 hubo 9 cargas
  de Joaquín y Ciro intercaladas a menos de 10 minutos. Se cruzó una.

**Lo que la medición enseñó sobre la causa:**

1. **La base no sabe descartar.** Las 12 órdenes con dos respuestas tienen todas la misma
   forma (respuesta + repregunta), y la orden 27 de Joaquín también: el audio de Ciro quedó
   igual que cualquier par normal. Quien cargaba se dio cuenta, pero la única salida era
   borrar la fila — el propio candado de hoy dice "hay que borrar esa fila". Propuesta B:
   columna `descartada` (cambio de CONTRATO, lo acuerdan los dos; migración la aplica Naza).
2. **El candado vive solo en la puerta manual.** Por WhatsApp el narrador se identifica por
   su teléfono (único en la base), así que el cruce entre narradores no pasa por ahí. Pero
   `parsearEntrante` (`src/whatsapp/webhook.ts`) tira dos datos que Meta manda según su
   documentación: si el mensaje fue **reenviado** y si el audio es **nota de voz grabada** o
   archivo adjunto. Es el caso "le reenvió el audio de otra persona". Propuesta C, a
   confirmar con un mensaje real (código de Joaquín).
3. **Lo que ninguna prueba sobre texto ve**: otra persona hablando en el teléfono correcto
   (la esposa que contesta por él). Solo lo detecta el audio: escuchándolo, o con una huella
   de voz. Queda anotado para más adelante.

**Correcciones de datos que salieron de revisar:**

- **Osvaldo es una prueba** (set dorado, texto sin audio), no un narrador. **Todo el material
  real es de dos personas de 28 años**; el público es 60+. Cualquier cosa que midamos sobre
  estilo o cobertura con este material hay que leerla sabiendo eso.
- **Joaquín leyó el PDF del 18/09**, no el guardado hoy (reescrito el 21/09). Las
  mediciones de "repite" se hacen contra ese.
- El hallazgo 40 decía lo contrario de lo que sabemos; se le puso el aviso arriba.
