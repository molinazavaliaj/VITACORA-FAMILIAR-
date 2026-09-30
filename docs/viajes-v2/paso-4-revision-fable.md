# Viaje V2 · Paso 4: revisión de Fable del banco entero (30/09/2026)

Fable leyó `banco.md` y `flujo-vigente.md` como si fuera un viaje de 10 días, sin tocar archivos. Opinión general: "El banco tiene voz de verdad. Lo que falla no son los textos sino los bordes donde el código los junta." A decidir por Naza.

## A. Reglas de empalme (no cambian ningún texto aprobado)
| # | Regla | Por qué |
|---|---|---|
| A1 | Después de VU0, solo ACM1 o ACM2 (como UC1) | El día de vuelta no hay noche: "Hasta la noche" mentiría |
| A2 | ATR solo arriba de la noche común (comienzo + puerta + cierre). Arriba de FN1, preguntas propias o las de antes de salir, sin ATR | "Contame los dos días" choca con "una sola" de FN1 y con preguntas que no son del día |
| A3 | Si dice "paso" en CA1, va directo AL1, sin PAS-V | "Mañana hay otra" mentiría: AL1 llega enseguida |
| A4 | Después de PAS-A, la siguiente sin acuse | Sería "Gracias" por un paso |
| A5 | Si contestó en texto, no usar ACA2 ni ACN3 ("Lo escuché") | TXT ya dijo "Lo leí" |
| A6 | En la cadena de antes de salir, ACA1 (con {{nombre}}) nunca arriba de AS2 ni VA1, que ya lo nombran; la rotación arranca por ACA2 | "Gracias, Lucía. Ahora otra cosa. Ya falta poco, Lucía." |

## B. Textos que Fable propone cambiar (necesitan OK de Naza)
| # | ID | Hoy | Propuesta | Por qué |
|---|---|---|---|---|
| B1 | UC1 | Hoy es el día, {{nombre}}. Antes de cerrar la puerta, contame cómo es este último rato en casa: qué estás haciendo ahora mismo, qué queda dando vueltas. | Hoy es el día, {{nombre}}. Estés todavía en casa o ya en camino, contame cómo fue el último rato antes de cerrar la puerta: qué hacías, qué quedó dando vueltas. | Si sale a las 6 de la mañana, a las 10 ya no está en casa |
| B2 | VU1 | …Contame el momento del viaje de ayer en que sentiste… | …Contame el momento de la vuelta en que sentiste… | Un vuelo largo sale un día y llega al otro: "ayer" puede mentir |
| B3 | CA1 | Ya volviste, {{nombre}}. Quedate en el primer rato en casa… | Cuando entres a casa, quedate en el primer rato… | Lo mismo: puede que todavía no haya llegado |
| B3b | Compra | "Fecha de vuelta" | "El día que emprendés la vuelta" | Para que la fecha sea la de salir de allá, no la de llegar |
| B4 | AS1, AS2, VA1 ya de viaje | "Ya estás en camino…" / "…esta te agarra en camino…" / "…la valija está cerrada…" | "Ya arrancaste, pero quiero empezar por antes…" / "Ya saliste, así que esta te agarra allá…" / "Ya estás allá y la valija ya viajó…" | Llegan de noche, ya instalado, con la valija abierta |
| B5 | ATR1-3 y ATR-V | Terminan pidiendo fotos | Sacarles el pedido de fotos | El cierre de la noche ya pide fotos: dos veces en el mismo mensaje |
| B6 | PAS-A después de VA1 | Seguimos con la próxima. | Perfecto, {{nombre}}, sin problema. Ya está: silencio hasta el día que te vas. | Después de VA1 no hay próxima |
| B7 | IM1 y VA1 | IM1 "Contame esa imagen…" · VA1 "Contame una cosa que va en la valija…" | IM1 "…Decime cuál es y de dónde te viene." · VA1 "¿Qué es lo que va en la valija sí o sí, {{nombre}}? No el cargador ni los documentos: algo tuyo. Y por qué va con vos." | Cuatro "Contame" seguidos en minutos |
| B8 | AL1 | (el acuse que toque) + Una última cosa, {{nombre}}: el álbum… | Acuse fijo: "Gracias, {{nombre}}. Y una última cosa: el álbum…" | "Ahora otra cosa. Una última cosa…" repite |
| B9 | DES | …antes de que se cierre… | …antes de mandarlo a hacer… | "Que se cierre" suena a sistema |

**Nota de Claude:** B9 vuelve a sonar a imprenta y el cambio anterior fue justamente para no mentirle a quien compra en PDF. Recomiendo dejar "antes de que se cierre" o buscar otra salida.

## C. Contra decisiones de Naza (Fable recomienda respetarlas)
- **AS1 y AS2 piden casi lo mismo seguidas:** "el momento en que dejó de ser una idea" y "el momento en que te cayó la ficha". Propone: que AS2 termine en "qué esperás encontrar allá", o que AS1 pase a "¿De dónde salió este viaje, {{nombre}}? De quién fue la idea, cómo apareció." Si Naza las quiere así, no es grave.
- La noche pide el día entero, la puerta y las fotos: funciona, no tocar.
- Las de antes de salir nunca se saltean: de acuerdo (solo cambia el texto de las variantes, B4).
- MD9 ("una palabra de ahí") da por hecho otro idioma, pero aguanta: dejar.

**Sin problemas:** no encontró nada que dé por hecho el género ni con quién viaja.
