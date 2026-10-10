# Plantillas de WhatsApp (Meta) para Vitácora de Viaje V2 — 05/10/2026

Para cargar en **WhatsApp Manager → Plantillas de mensajes**, en la WABA "Vitácora" (`1997432587590526`), idioma **Spanish (Argentina) `es_AR`** (o "Español" si no aparece). Reglas que ya nos frenaron (`entrevistador/PLANTILLAS.md`): variables posicionales `{{1}}`, nunca al principio ni al final del cuerpo, cada variable con un ejemplo, y **el valor de una variable no puede tener saltos de línea**.

**Nombres nuevos con `_v2`.** No editar `bienvenida_viaje`: la usa la entrevista vieja (main), con el viajero que está de viaje ahora.

Los textos son los aprobados en [`banco.md`](banco.md), con `{{nombre}}` → `{{1}}`. La única frase nueva es la de la plantilla 3 (aprobada por Naza el 05/10). Ejemplos inventados.

## Cuándo se usa cada una
Dentro de las 24 h desde el último mensaje de la persona, todo va como texto libre (incluida la reacción ❤️). Las plantillas son solo para **abrir** la charla cuando la ventana está cerrada:

| # | Nombre | Cuándo | Categoría probable |
|---|---|---|---|
| 1 | `bienvenida_viaje_v2` | Primer mensaje, si lo compró para sí (BIEN-1). Botón [SÍ] | Marketing |
| 2 | `bienvenida_viaje_regalo_v2` | Primer mensaje, si es un regalo (BIEN-1R). Botón [SÍ] | Marketing |
| 3 | `mensaje_viaje_v2` | Cualquier pregunta que tenga que salir con la ventana cerrada. Casos típicos: el último rato en casa el día que sale (después del silencio de antes de salir), la noche después de dos días sin contestar, el pedido del álbum si no contestó "llegar a casa" | Marketing o Utility |
| 4 | `recordatorio_viaje_v2` | REC1: una pregunta de antes de salir colgada 3 días | Utility |
| 5 | `recordatorio_viaje_ultima_v2` | REC1-U: lo mismo, cuando la colgada es la última (la valija) | Utility |

## 1. `bienvenida_viaje_v2` — {{1}} cómo le dicen, {{2}} el formato · botón de respuesta rápida [SÍ]

```
Hola, {{1}}. Soy quien va a escribir el libro de tu viaje. Funciona así: yo te pregunto por acá, vos me contás en audio cuando puedas, y al volver tenés {{2}} con tu viaje contado con tu voz, tus fotos y un código QR para escuchar algunos de tus audios. ¿Arrancamos? Contestame SÍ: con eso me das permiso para guardar lo que me mandes.
```
Botón: `SÍ` · Ejemplos: {{1}} `Lucía` · {{2}} `un libro impreso` (el otro valor posible es `un libro en PDF`)

## 2. `bienvenida_viaje_regalo_v2` — {{1}} cómo le dicen, {{2}} quién regala, {{3}} el formato · botón [SÍ]

```
Hola, {{1}}. Te escribo porque {{2}} te hizo un regalo: {{3}} con tu viaje, contado por vos. Funciona así: yo te pregunto por acá, vos me contás en audio cuando puedas, y al volver lo tenés escrito con tu voz, con tus fotos y con un código QR para escuchar algunos de tus audios. ¿Arrancamos? Contestame SÍ: con eso me das permiso para guardar lo que me mandes.
```
Botón: `SÍ` · Ejemplos: {{1}} `Lucía` · {{2}} `Tomás` · {{3}} `un libro impreso`

## 3. `mensaje_viaje_v2` — {{1}} cómo le dicen, {{2}} el mensaje del banco (en una sola línea) · texto nuevo, **aprobado por Naza el 05/10**

```
Hola, {{1}}. Te escribo por tu Vitácora de Viaje.

{{2}}

Cuando puedas, me contestás con un audio. Sin apuro.
```
Ejemplos: {{1}} `Lucía` · {{2}} `Hoy es el día, Lucía. Estés todavía en casa o ya en camino, contame cómo fue el último rato antes de cerrar la puerta: qué hacías, qué quedó dando vueltas.`

Para el código: si el mensaje tiene dos partes (por ejemplo ATR + la noche), se juntan con un espacio, sin salto de línea.

## 4. `recordatorio_viaje_v2` — {{1}} cómo le dicen

```
Hola, {{1}}. Te quedó una pregunta esperando, sin apuro. Cuando tengas un rato, contestámela en audio, o "paso" y seguimos con la que viene.
```
Ejemplo: {{1}} `Lucía`

## 5. `recordatorio_viaje_ultima_v2` — {{1}} cómo le dicen

```
Hola, {{1}}. Te quedó una pregunta esperando, sin apuro. Cuando tengas un rato, contestámela en audio, o "paso", y nos vemos el día que salís.
```
Ejemplo: {{1}} `Lucía`

## Para Joaquín
- Con el botón [SÍ], tocarlo vale como contestar SÍ (abre la ventana y dispara BIEN-2 y AS1).
- Si alguna queda en revisión, la persona puede escribir primero y todo va como texto libre.
- Catalán (`ca`) y castellano de España con tú (`es_ES`): más abajo, del banco traducido y revisado (05/10). Se cargan con el sufijo `_ca` / `_es_es` en el nombre (o con el mismo nombre y otro idioma, si Joaquín prefiere: Meta permite varias traducciones por plantilla).

---

# Plantillas en Catalan (`ca`)

Mismo uso, variables y botón que las de castellano rioplatense. Textos del banco revisado (`idiomas/banco-ca.md`). Idioma en WhatsApp Manager: **Catalan (`ca`)**. Ejemplos inventados: {{1}} `Laia`, quien regala `Jordi`, formato `un llibre imprès` (el otro valor: `un llibre en PDF`).

## 1. `bienvenida_viaje_v2_ca` — {{1}} cómo le dicen, {{2}} el formato · botón [SÍ]
```
Hola, {{1}}. Soc qui escriurà el llibre del teu viatge. Jo et pregunto per aquí, tu m'ho expliques en àudio quan puguis, i quan tornis tindràs {{2}} amb el teu viatge explicat amb la teva veu, les teves fotos i un codi QR per escoltar alguns dels teus àudios. Comencem? Contesta'm SÍ i així em dones permís per guardar el que m'enviïs.
```

## 2. `bienvenida_viaje_regalo_v2_ca` — {{1}} cómo le dicen, {{2}} quién regala, {{3}} el formato · botón [SÍ]
```
Hola, {{1}}. {{2}} t'ha regalat {{3}} amb el teu viatge, explicat per tu, i jo soc qui l'escriurà. Et pregunto per aquí, tu m'ho expliques en àudio quan puguis, i quan tornis el tindràs escrit amb la teva veu, amb les teves fotos i amb un codi QR per escoltar alguns dels teus àudios. Comencem? Contesta'm SÍ i així em dones permís per guardar el que m'enviïs.
```

## 3. `mensaje_viaje_v2_ca` — {{1}} cómo le dicen, {{2}} el mensaje (una sola línea)
```
Hola, {{1}}. T'escric per la teva Vitácora de Viaje.

{{2}}

Quan puguis, em contestes amb un àudio. Sense pressa.
```

## 4. `recordatorio_viaje_v2_ca` — {{1}} cómo le dicen
```
Hola, {{1}}. Tens una pregunta pendent, sense pressa. Quan tinguis una estona, contesta-me-la en àudio, o escriu "passo" i seguim amb la següent.
```

## 5. `recordatorio_viaje_ultima_v2_ca` — {{1}} cómo le dicen
```
Hola, {{1}}. Tens una pregunta pendent, sense pressa. Quan tinguis una estona, contesta-me-la en àudio, o escriu "passo". I ens retrobem el dia que marxis.
```

---

# Plantillas en Spanish (Spain) `es_ES`

Mismo uso, variables y botón que las de castellano rioplatense. Textos del banco revisado (`idiomas/banco-es-ES.md`). Idioma en WhatsApp Manager: **Spanish (Spain) `es_ES`**. Ejemplos inventados: {{1}} `Marta`, quien regala `Pablo`, formato `un libro impreso` (el otro valor: `un libro en PDF`).

## 1. `bienvenida_viaje_v2_es_es` — {{1}} cómo le dicen, {{2}} el formato · botón [SÍ]
```
Hola, {{1}}. Soy quien va a escribir el libro de tu viaje. Funciona así: yo te pregunto por aquí, tú me cuentas en audio cuando puedas, y al volver tienes {{2}} con tu viaje contado con tu voz, tus fotos y un código QR para escuchar algunos de tus audios. ¿Empezamos? Contéstame SÍ: con eso me das permiso para guardar lo que me mandes.
```

## 2. `bienvenida_viaje_regalo_v2_es_es` — {{1}} cómo le dicen, {{2}} quién regala, {{3}} el formato · botón [SÍ]
```
Hola, {{1}}. Te escribo porque {{2}} te ha hecho un regalo: {{3}} con tu viaje, contado por ti. Funciona así: yo te pregunto por aquí, tú me cuentas en audio cuando puedas, y al volver lo tienes escrito con tu voz, con tus fotos y con un código QR para escuchar algunos de tus audios. ¿Empezamos? Contéstame SÍ: con eso me das permiso para guardar lo que me mandes.
```

## 3. `mensaje_viaje_v2_es_es` — {{1}} cómo le dicen, {{2}} el mensaje (una sola línea)
```
Hola, {{1}}. Te escribo por tu Vitácora de Viaje.\n\n{{2}}\n\nCuando puedas, me contestas con un audio. Sin prisa.
```

## 4. `recordatorio_viaje_v2_es_es` — {{1}} cómo le dicen
```
Hola, {{1}}. Se te ha quedado una pregunta esperando, sin prisa. Cuando tengas un rato, contéstamela en audio, o "paso" y seguimos con la siguiente.
```

## 5. `recordatorio_viaje_ultima_v2_es_es` — {{1}} cómo le dicen
```
Hola, {{1}}. Se te ha quedado una pregunta esperando, sin prisa. Cuando tengas un rato, contéstamela en audio, o "paso", y hablamos el día que te vayas.
```
