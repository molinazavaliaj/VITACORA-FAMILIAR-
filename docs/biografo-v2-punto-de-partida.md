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

### 1. "Un párrafo se lo inventó" — y era falso

El párrafo señalado (los muñecos, el balcón, el perrito) resultó ser **casi literal** de
su respuesta 27 — el audio `dia_27.ogg`, 38 segundos. Verificado palabra por palabra contra
las 35 transcripciones. El libro incluso **le sacó una repetición** que el audio tenía
("hacíamos mucho ruido y a la siesta no nos dejaban dormir" aparece dos veces en el audio y
una sola en el libro).

Y lo ubicó en **«La infancia»**, el capítulo correcto — aunque esa respuesta está archivada
bajo la orden 27, que es del capítulo «Las pruebas». O sea: la regla que le dice al escritor
*"buscá en la historia completa cualquier cosa que pertenezca a este capítulo"* **funcionó**,
y rescató un recuerdo que estaba guardado en el lugar equivocado.

**Queda una diferencia sin cerrar, y la cierra Joaquín en dos minutos.** El texto que él leyó
dice *"jugábamos con unos muñecos, unas figuras de plástico, **ahí en el balcón**"* (fusiona
dos escenas que contó por separado). El libro guardado **hoy** dice otra cosa: *"De más chicos
jugábamos con unos muñecos, unas figuras de plástico. (…) Jugábamos ahí en el balcón"* — sin
la fusión. **No son el mismo texto.** El libro se entregó el 19/09 y se reescribió el 21/09
11:12: lo más probable es que él esté leyendo el PDF que descargó antes. **Que vuelva a
bajarlo y mire ese párrafo**: si ya está separado, el problema no existe más.

- **Lo que no es de código**: el narrador **no reconoció sus propias palabras**. Contestó 35
  veces a lo largo de días. Que sienta que le inventaron cosas es un problema de confianza
  que ningún prompt arregla — pero cambia cómo se entrega el libro.
- **Lección de método**: si creíamos el reporte y "arreglábamos" el editor, rompíamos algo
  que funciona bien. Un hallazgo sobre el libro **se verifica contra las transcripciones
  antes de tocar nada**.
- **Lo que sí apareció de paso**: bajo la orden 27 hay **dos respuestas** de dos audios
  distintos (`dia_27.ogg`, los muñecos; `dia_27_2.ogg`, el padre que se fue a Chile). La que
  contesta la pregunta 27 es la segunda; la primera quedó archivada donde no va. Es el mismo
  problema que el **C7** de Ciro.

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
| **2 libros terminados** | 89 páginas el de Joaquín; el de Osvaldo | Storage, `{narrador}/paquete/libro.pdf` |
| **35 + 17 respuestas reales** | transcripciones completas de dos narradores | tabla `respuestas` |
| **Los borradores por capítulo** | lo que escribió el modelo ANTES de la pasada de editor | `borrador_cap_NN.md` |
| **42 hallazgos + 14 de Ciro** | dos años de errores documentados en dos semanas | `docs/piloto-*.md` |
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
