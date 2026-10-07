# El cerebro del biógrafo — material para la revisión entre los tres

> Pedido de Naza (23/09): *"el biógrafo merece un brainstorming con Joaco y yo en conjunto
> para dejarle los prompts correctos, entender el objetivo y mejorarlo"*.
>
> Esto **no propone soluciones**: pone sobre la mesa qué le estamos pidiendo hoy al modelo,
> en castellano y sin código, para que los tres discutan **el encargo** y no la redacción.
> Todo lo de acá está verificado contra el código y contra la base al 23/09.

---

## Lo primero, porque cambia la conversación

**La pregunta que el narrador recibe cada día no la escribe Opus. La escribe Haiku**, el
modelo más chico. Y la decisión de tratarlo de vos o de usted, y la memoria de lo que ya
contó, también.

| Qué hace | Modelo | Cuántas veces por libro |
|---|---|---|
| **Escribir la pregunta del día** | **Haiku 4.5** | ~30 |
| **Decidir vos o usted** | **Haiku 4.5** | 1 |
| **Resumir cada capítulo** (la memoria) | **Haiku 4.5** | ~8 |
| Evaluar la respuesta y decidir la repregunta | Opus 5 | ~30 |
| Escribir las 4 preguntas finales a medida | Opus 5 | 1 |
| Sugerir preguntas a la familia | Opus 5 | pocas |

El juicio más delicado —mirar quién es esta persona y decidir cómo preguntarle— lo hace el
modelo más chico. El más mecánico —¿esta respuesta alcanza?— el más caro.

### Qué costaría dar vuelta eso

Medido sobre **13 llamadas reales** de `consumo_ia` (no estimado): una pregunta del día usa
~4.100 tokens de entrada y ~83 de salida.

| | Hoy (Haiku) | Con Opus | Diferencia |
|---|---|---|---|
| Las ~30 preguntas de un libro | USD 0,14 | USD 0,68 | **+0,54** |
| Sumando trato y los 8 resúmenes | USD 0,18 | USD 0,86 | **+0,68** |

**Pasar todo el cerebro del entrevistador a Opus: +68 centavos por libro.** Un libro cuesta
entre USD 6 y 10 y se vende a 49 €. Es el **1 %** del precio.

⚠️ **Pero el modelo no es el problema de fondo** (observación de Naza, y es la correcta): con
las instrucciones de hoy, un modelo mejor falla menos, no deja de fallar. Las instrucciones
hay que arreglarlas igual. La buena noticia es que esto **no hay que discutirlo por opinión**:
`npm run prueba-cerebro` corre el cerebro contra respuestas reales, y se puede medir Haiku vs
Opus y prompt viejo vs nuevo, por unos pocos dólares.

---

## Los cinco prompts que tocan al narrador

### 1. La pregunta del día (`personalizar.ts` · Haiku · 14 reglas · parcheado 9 veces)

**Qué recibe:** lo que el narrador viene contando estos días, la memoria de los capítulos que
ya cerró, la ficha que cargó la familia (casi siempre vacía), la pregunta del guion y el trato.

**Qué le pedimos, textual:**

> *"Reescribila para que se note que lo escuchaste."*

Y cierra con:

> *"Si no hay nada concreto para enganchar, devolvé la pregunta original sin cambiarle nada."*

**El problema del encargo.** Le pedimos que **decore**, no que **juzgue**. La pregunta le llega
como un hecho dado y su trabajo es agregarle color. En ningún lado tiene permiso para decir
"esta pregunta no aplica a esta persona". Al contrario: ante la duda, la regla lo manda a
devolver el original **con el supuesto adentro**.

Las 14 reglas ("no supongas boda, hijos ni nietos", "no des por sentado que la infancia fue
linda", "respetá el parentesco"…) se fueron agregando **una por cada error encontrado**. Son 14
parches peleando contra la instrucción principal, que sigue diciendo *"agregá detalles"*.

**El caso que lo muestra mejor** es C6 (la ciudad equivocada). Ahí el biógrafo **tenía todo el
material** —sabía que Ciro se fue a Buenos Aires a los 12— y aun así preguntó por las salidas
"en Concordia", 3 de 3 veces. No falló por falta de contexto: le pedimos que sea concreto y
nombre lugares, y **nadie le dijo que un recuerdo puede pasar en otro lugar que el habitual de
esa persona**. Pedimos concreción y dio concreción equivocada.

**Dato que sorprende:** el biógrafo reescribe el **100 %** de las preguntas (14 de 14 con Ciro,
21 de 21 con Joaquín). No es que se saltee el paso. Es que el paso está mal definido.

### 2. Vos o usted (`trato.ts` · Haiku · sin reglas · 4 parches)

Se decide **una sola vez**, al principio, con la ficha. Si la ficha está vacía —que es lo
normal— sale `usted` por defecto. Eso es el hallazgo #1 de la bitácora y sigue vivo: pasó con
Joaquín (28 años) y pasó con la narradora de Naza esta semana.

**La pregunta para la reunión:** ¿por qué se decide una vez y para siempre, si después de tres
respuestas el narrador ya mostró cómo habla?

### 3. La evaluación de cada respuesta (`cerebro.ts` · Opus · parcheado 19 veces)

**Qué recibe:** la pregunta de hoy, la transcripción, cuánto duró el audio, y las preguntas ya
hechas. **Qué NO recibe: la historia.** Por eso la repregunta le pidió a Ciro algo que ya había
contado en la respuesta 1 (C1) — la evaluación no puede saber lo que él ya dijo.

Es el prompt más parcheado de todos: **19 commits**.

### 4. Las cuatro preguntas del final (`adaptativas.ts` · Opus · 7 reglas · 9 parches)

Lee la historia completa y escribe las últimas 4 a medida. Es el único paso que recibe todo y
que puede preguntar de verdad lo que falta.

### 5. Las ocho preguntas de objeto (sin modelo — salen literales)

Las de «Sus objetos preciados» llevan `tipo = 'objeto'`, y el código solo reescribe las de tipo
`fija`. **Salen tal como están escritas en la migración, sin pasar por ningún modelo.** Por eso
la de «El amor» ("esos primeros años juntos") importaba: le iba a llegar así a alguien que quizá
nunca tuvo pareja.

**La pregunta para la reunión:** ¿queremos que haya preguntas que no pasan por el biógrafo?
Si sí, cada una tiene que estar escrita para servirle a cualquiera, que es justo lo difícil.

---

## Y hay seis prompts más que nadie revisó

En la fábrica, y tocan el producto final tanto como los de arriba:

| Qué hace | Dónde |
|---|---|
| **Escribe cada capítulo del libro** | `fabrica/src/libro/escribir-capitulo.ts` |
| Arma la estructura del libro | `libro/estructura.ts` |
| Pasada de editor: apertura, cierre y «Sus frases» | `libro/generar-paquete.ts` |
| **Elige las frases que se imprimen con su QR** | `libro/frases.ts` |
| Escribe el párrafo del anticipo | `libro/parrafo-anticipo.ts` |
| ~~Los conectores del audiolibro híbrido~~ | ~~`voz/conectores.ts`~~ — borrado el 23/09 con el audiolibro |

---

## Las tres preguntas con las que empezaría la reunión

1. **¿Cuál es el trabajo del biógrafo?** Hoy: *"agregá detalles a esta pregunta"*. ¿Debería ser
   *"mirá quién es esta persona y decidí cómo preguntarle esto"*? Eso no es una regla más: es
   otro encargo, y hace innecesarias la mitad de las 14 reglas actuales.
2. **¿Dónde ponemos el dinero?** 68 centavos por libro es el 1 % del precio. ¿El ahorro está en
   el lugar correcto?
3. **¿Qué es un error grave y qué es un detalle?** Poner un recuerdo en la ciudad equivocada
   termina impreso. Tratar de usted a alguien de 28 rompe el vínculo. Preguntar por las fiestas
   a quien tuvo una infancia dura hace daño. No todos pesan igual, y hoy los 14 renglones del
   prompt pesan lo mismo.

## Cómo se mide si mejoró

`entrevistador/scripts/prueba-cerebro.ts` corre el cerebro contra las 30 respuestas reales del
set dorado, por secciones (A/B/C/D) para gastar menos. Costó ~USD 1 la última vez. Sirve para
comparar, con números y no con impresiones: **prompt viejo vs nuevo**, y **Haiku vs Opus**.
