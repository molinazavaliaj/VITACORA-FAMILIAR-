# El trato del entrevistador: que lo decida el modelo (usted o vos)

> **Estado: aprobado por Naza (2026-09-15).** Manda sobre: los cinco prompts vivos
> del cerebro y los tres textos fijos que lee el narrador.
>
> **Módulo de Joaquín.** Va en rama y lo aprueba él. No toca `supabase/CONTRATO.md`
> ni necesita migración: el dato vive dentro de `narradores.contexto` (jsonb).

---

## 1. Por qué

Hoy el entrevistador trata de usted a todo el mundo porque está escrito así en el
prompt: `personalizar.ts:80` dice literalmente *"Tratalo de usted"*.

Eso se decidió cuando el narrador era siempre un abuelo. Dejó de ser cierto el
mismo día que se dio de alta al primer narrador de 28 años (Ciro / Angel
Fernandez, 2026-09-15): la pregunta 1 le salió *"Cuénteme de la casa donde pasó
su infancia... si cierra los ojos"*, que a un pibe le suena a formulario.

Palabras de Naza: **"ahora que el modelo piensa siempre de los datos de las
historias hay que dejarlo decidir si lo trata de usted o no"**. El modelo ya
recibe la ficha del narrador en cada llamada; lo único que le falta es permiso
para usarla también para esto.

## 2. Qué se construye

Un dato nuevo por narrador —`contexto.trato`, con dos valores: `'usted'` o
`'vos'`— que lo decide el modelo una sola vez, mirando la ficha, y que después
leen todos los textos que el narrador va a ver.

### 2.1 Las tres decisiones que lo definen (tomadas por Naza)

| Decisión | Qué se eligió | Qué se descartó y por qué |
|---|---|---|
| **Cuándo decide** | Una vez por narrador, y queda guardado | Decidir en cada llamada: el mismo narrador podía recibir "vos" el lunes y "usted" el martes, y los textos fijos quedaban en usted igual |
| **Con qué decide** | Solo con la ficha, antes del primer mensaje | Esperar a escucharlo en su primer audio: acierta más, pero el primer mensaje sale a ciegas y es el que da la primera impresión |
| **Cuántos tratos** | Dos: `usted` o `vos` | Sumar `tú` para España: son tres versiones de cada texto para aprobar y hoy los pilotos son argentinos |

**Consecuencia asumida:** hoy el checkout no pide un solo dato de la ficha
(`docs/ficha-del-narrador.md` §4), así que un cliente real llega con la ficha
vacía y **le va a tocar `usted`**. Esto recién rinde de verdad cuando exista la
pantalla de la ficha. Es un motivo más para construirla, no un problema de este
diseño.

## 3. Cómo funciona

### 3.1 La decisión (`src/ia/trato.ts`, módulo nuevo)

```
tratoDe(narrador) -> 'usted' | 'vos'
```

1. Si `contexto.trato` ya tiene un valor válido, lo devuelve. **No vuelve a
   pensarlo nunca.**
2. Si la ficha no tiene ni un dato aprovechable (ni año de nacimiento, ni árbol,
   ni lugar, ni oficio, ni datos extra, ni vínculo del comprador), devuelve
   `'usted'` **sin llamar al modelo**: no se paga una llamada para que adivine
   sin datos.
3. Si hay ficha, una llamada a Haiku con la ficha y una sola pregunta. Respuesta
   de una palabra. Cualquier cosa que no sea exactamente `usted` o `vos` cae a
   `'usted'`.
4. Guarda el resultado en `contexto.trato` **y lo escribe también en el objeto
   que tiene en memoria** (ver §3.2).

Costo: una llamada a Haiku por narrador, una vez en la vida. Despreciable contra
los ~USD 0,10 que ya cuesta personalizar las preguntas de una entrevista entera.

El prompt:

```
Sos el biógrafo que le va a escribir todos los días por WhatsApp a esta persona,
durante un mes, para escribir el libro de su vida.

QUIÉN ES:
{ficha}

¿Le hablás de usted o de vos? Pensalo como lo pensaría alguien con calle: la
edad que tiene, de dónde es, quién lo mandó a entrevistar. Ante la duda, usted:
con un desconocido el usted nunca ofende, el vos sí puede.

Respondé SOLO con una palabra: usted o vos.
```

### 3.2 El detalle que puede borrar el dato (y hay que testear)

`personalizar.ts:recordarEnviada()` guarda las preguntas ya enviadas haciendo
`update({ contexto: { ...n.contexto, preguntasEnviadas } })` — o sea: **pisa el
`contexto` entero con la copia que tenía en memoria.** Si `tratoDe` guardó
`trato` en la base después de que ese objeto se leyó, el update lo borra y el
narrador vuelve a no tener trato decidido (y se paga la llamada de nuevo).

Por eso `tratoDe` muta también `n.contexto.trato` en memoria, y por eso hay un
test dedicado a esta secuencia exacta.

### 3.3 Quién lee el trato

**Los cinco prompts vivos** — cada uno recibe el trato y arma su línea con él:

| Dónde | Qué escribe | Línea de hoy |
|---|---|---|
| `personalizar.ts:80` | La pregunta del día | *"Tratalo de usted, cálido, en castellano rioplatense"* |
| `personalizar.ts:79` | (ejemplo dentro del mismo prompt) | *"cuando usted tenía seis años"* → gemelo en vos |
| `cerebro.ts:27` (`ESTILO_CEREBRO`) | La repregunta | *"Le hablás de usted, con respeto y afecto genuino"* |
| `cerebro.ts:135` | La pregunta de reemplazo | *"tratarlo de usted"* |
| `adaptativas.ts:36` | Las preguntas 27-30 | *"tratarlo de usted"* |
| `sugeridas.ts:32` | Las sugeridas del panel | *"tratarlo de usted"* |

`cerebro.ts:76` (`generarReconocimiento`) **no se toca**: quedó sin usar en
producción desde que se sacó el saludo diario el 2026-09-14 — sólo lo llaman un
script de prueba y un test.

`evaluarRespuesta()` no recibe hoy ningún dato del narrador
(`cerebro.ts:113`): hay que pasarle el trato y actualizar sus dos llamadores
(`flujo/procesar.ts` y `scripts/manual.ts`).

**Los tres textos fijos** (§4), que no los escribe ningún modelo.

### 3.4 Los duplicados se unifican de paso

Dos textos que lee el narrador viven hoy escritos a mano en dos lugares cada uno:

| Texto | Copia A | Copia B |
|---|---|---|
| La cola de cada pregunta | `manual/puro.ts:111` (`mensajeDePregunta`) | `flujo/preguntar.ts:135`, inline |
| La despedida | `manual/puro.ts:116` (`despedida`) | `flujo/cierre.ts:4`, otra vez |

Hoy dicen lo mismo por suerte, no por diseño. Con dos tratos serían **ocho
frases sueltas** que divergen el día que se cambie una — exactamente la trampa
que ya mordió dos veces en el Hub (cambiar el texto de un aviso deja los tests
del texto viejo verdes y vacíos).

`manual/puro.ts` no depende de nada (ni base, ni red, ni WhatsApp), así que es el
lugar donde viven: `preguntar.ts` y `cierre.ts` pasan a importarlas.

### 3.5 El escape a mano

`npm run manual -- crear ... --trato vos` fuerza el valor sin preguntarle al
modelo. Para los pilotos, donde Naza conoce al narrador mejor que cualquier ficha.

## 4. Los textos (aprobados por Naza el 2026-09-15)

Se escriben **verbatim**, y los tests los asertan verbatim — no con "no contiene
la frase vieja", que es un test que no puede fallar nunca más.

**Bienvenida** (`flujo/procesar.ts:121`)

- usted: `¡Qué alegría, {como_le_dicen}! Mañana a la mañana le llega la primera pregunta. No hay apuro ni respuestas incorrectas: esto es una charla entre usted y yo, a su ritmo. 📖`
- vos: `¡Qué alegría, {como_le_dicen}! Mañana a la mañana te llega la primera pregunta. No hay apuro ni respuestas incorrectas: esto es una charla entre vos y yo, a tu ritmo. 📖`

**Cola de cada pregunta** (`manual/puro.ts:mensajeDePregunta`)

- usted: `La pregunta de hoy: {texto}` + `Cuando quiera, me responde con un audio. Sin apuro. 🎙️`
- vos: `La pregunta de hoy: {texto}` + `Cuando quieras, me respondés con un audio. Sin apuro. 🎙️`

**Despedida** (`manual/puro.ts:despedida`)

- usted: `{como_le_dicen}... llegamos al final del viaje. Treinta charlas, una vida entera. Fue un honor enorme escucharlo. Su historia ya está siendo convertida en su libro.`
- vos: `{como_le_dicen}... llegamos al final del viaje. Treinta charlas, una vida entera. Fue un honor enorme escucharte. Tu historia ya está siendo convertida en tu libro.`

## 5. Lo que este diseño NO arregla

- **Las 26 preguntas firmadas están escritas en usted.** El biógrafo las reescribe
  y salen en vos, pero cuando la reescritura vuelve inválida el sistema manda la
  original (`personalizar.ts:206`, regla de seguridad n.º 2: el guion firmado
  nunca se pierde). Un narrador de "vos" va a recibir, cada tanto, una pregunta
  en usted. Se prefiere eso a tocar el guion que firmaron los dos socios.
- **Los mails de hitos** (`mail/hitos.ts`) los lee la familia compradora, no el
  narrador: quedan como están.
- **La ficha vacía del checkout** (§2.1): fuera de alcance, es la pantalla que
  propone `docs/ficha-del-narrador.md` §7.
- **El trato no se puede cambiar desde el panel.** Si la familia quiere corregirlo
  hace falta la mano de Naza (§3.5) o una pantalla nueva, que es de Joaquín.

## 6. Cómo se prueba

Regla de la casa: **cada test nuevo tiene que fallar en rojo contra el código
viejo**, y eso se verifica corriéndolo, no razonándolo.

| Qué se prueba | Por qué existe ese test |
|---|---|
| Ficha vacía → `'usted'` y **cero llamadas al modelo** | Es la plata: hoy todos los clientes reales llegan así |
| Ficha con datos → se llama al modelo una vez y se guarda | El corazón de la función |
| Segunda llamada → devuelve lo guardado **sin llamar al modelo** | "Una vez, y queda" |
| El modelo contesta cualquier otra cosa → `'usted'` | La red de seguridad |
| `tratoDe` + después `recordarEnviada` → el trato **sobrevive** | §3.2, el borrado silencioso |
| Cada uno de los cinco prompts con trato `vos` → dice vos y no dice usted | Que ninguno quede olvidado |
| Los seis textos fijos, verbatim | §4 |
| `preguntar.ts` y `cierre.ts` usan la función de `puro.ts` | Que la unificación no se deshaga |

Al terminar: `npm test` en `entrevistador/` en verde, con la salida pegada en el
reporte. Nada se declara verificado sin haber corrido el comando.

## 7. Después de construirlo

Regenerar la pregunta 1 de Ciro en vos: borrar `contexto.preguntasEnviadas["1"]`
y volver a correr `npm run manual -- siguiente ciro`. La pregunta vieja (en
usted) todavía no se le mandó a nadie.

## 8. Para conversar con Joaquín

- `contexto.trato` es convención nueva dentro de un jsonb que escriben los dos
  lados. No rompe el contrato, pero si el panel alguna vez quiere mostrarlo o
  dejar que la familia lo cambie, el campo ya está.
- `ESTILO_CEREBRO` (`cerebro.ts:27`) dice *"en español neutro (nada de modismos
  regionales)"* mientras `personalizar.ts:80` dice *"castellano rioplatense"*.
  Los dos escriben mensajes para el mismo narrador. No se resuelve acá, pero
  alguien debería elegir.
