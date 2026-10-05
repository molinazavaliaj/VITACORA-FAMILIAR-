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
- Catalán (`ca`) y castellano de España con tú (`es_ES`): estas mismas cinco salen del banco de Viaje traducido (`banco-ca.md`, `banco-es-ES.md`), con el proceso de V3 catalán. En curso desde el 05/10.
