# Fase 2, panel: textos nuevos para aprobar

Todos viven en `web/src/app/_textos/panel.ts` (es = España, de tú; ar = Argentina, de vos).
Lo que el panel ya decía y estaba aprobado no se tocó y no está acá. Sin dos puntos en ningún
texto nuevo. «Origen»: **maqueta** = copia literal de `Panel.dc.html` / `PanelViaje`;
**§5** = de la lista «se pueden usar tal cual» de `TEXTOS-Y-REGLAS.md`; **adaptado** = maqueta
cambiada (dice qué y por qué); **nuevo** = no estaba en ningún lado.

Para aprobar de a 10.

## Tanda 1: la cabecera de la historia

| # | Dónde | es | ar | Origen |
|---|---|---|---|---|
| 1 | Saludo, arriba del titular (solo a quien compró) | Hola, Laura. | Hola, Laura. | maqueta |
| 2 | Titular, antes de empezar | Todo listo para su primer mensaje. («para tu» si es Para mí o viaje) | igual | maqueta |
| 3 | Titular, contando | El libro de Antonio va creciendo. («Tu libro va creciendo.» si es Para mí) | igual | §5 |
| 4 | Titular, pidió pausa | El libro de Antonio está en pausa. | igual | nuevo (en pausa, «va creciendo» no es cierto) |
| 5 | Titular, terminó de contar y falta encargar | Antonio terminó de contar. / Terminaste de contar. | igual | nuevo |
| 6 | Titular, encargado y la fábrica lo está haciendo | Estamos escribiendo el libro de Antonio. | igual | nuevo (es cierto: el escritor escribe al encargar) |
| 7 | Titular, libro entregado | El libro de Antonio está listo. | igual | maqueta |
| 8 | Titulares del viaje | Tu viaje ya se está guardando. · Tu viaje está en pausa. · Ya volviste. Falta elegir la tapa. · Estamos escribiendo tu libro de viaje. · Tu libro de viaje está listo. | igual | adaptado: la maqueta iba en vosotros («Vuestro viaje…»); el resto del panel de viaje habla en singular a quien lo compró |
| 9 | Cifras al lado del titular | respuestas · min de su voz (tu voz si es Para mí o viaje) | igual | maqueta |
| 10 | Línea de tiempo | Pagado · Primer mensaje · Contándolo (De viaje) · Libro listo · Impreso en casa | igual | maqueta, sin «Anticipo» (D4). «Impreso en casa» solo si compró el impreso |

Arriba del titular va el estado de siempre (`estadoEnHumano`, ya aprobado: «Está respondiendo, a su ritmo»…).

## Tanda 2: el lateral

| # | Dónde | es | ar | Origen |
|---|---|---|---|---|
| 11 | Hoja de lo último | Lo último que contó / Lo último que contaste | igual | maqueta / nuevo |
| 12 | Enlace de esa hoja | Ver todo | igual | adaptado («Ver los 11»: sin cantidad) |
| 13 | Cuándo llegó cada audio | Hoy · Ayer · Hace 4 días | igual | maqueta |
| 14 | Audio sin título | Audio sin transcribir todavía | igual | nuevo |
| 15 | Hoja de fotos | Sus fotos / Tus fotos · 3 fotos en el álbum | igual | maqueta / nuevo |
| 16 | Sin foto de tapa | Falta su foto para la portada. | igual | maqueta |
| 17 | Con foto de tapa | Su foto de portada ya está. | igual | maqueta |
| 18 | Debajo, sin tapa | La de la portada es la que verá todo el mundo. Puedes añadirla hasta que cerremos su libro. | La de la portada es la que va a ver todo el mundo. Podés sumarla hasta que cerremos su libro. | adaptado: se quitó «y la misma va en el marco si lo pediste» (en el código el marco lleva su propia foto) |
| 19 | Enlace a Encargar libro | Elegir la foto de la tapa | igual | nuevo |
| 20 | Hoja del WhatsApp, antes de empezar | Su WhatsApp | igual | maqueta |
| 21 | Regalo sin abrir (no hay número) | Todavía no tenemos su número. Nos llega cuando abre el regalo y nos escribe con su código. | igual | nuevo (la maqueta pide el número; hoy la web no puede guardarlo, ver PENDIENTES F2-3) |
| 22 | Botón | Ver la tarjeta del regalo | igual | nuevo |
| 23 | La familia | La familia · Invita a tus hermanos para que escuchen sus audios y propongan preguntas. | Invitá a tus hermanos… | §5 |
| 24 | La familia, Para mí | Invita a tu familia para que escuche tus audios y proponga preguntas. | Invitá a tu familia… | nuevo |
| 25 | La familia, viaje | Invita a quien quieras para que siga el viaje y escuche tus audios. | Invitá a quien quieras… | adaptado de la maqueta (vosotros → singular) |
| 26 | Al pie | ¿Dudas? Escríbenos, te contesta una persona. | ¿Dudas? Escribinos, te contesta una persona. | §5. Va al WhatsApp de Vitácora si está `NEXT_PUBLIC_WHATSAPP_DUDAS`; si no, a hola@ |

## Tanda 3: tu pedido

| # | Dónde | es | ar | Origen |
|---|---|---|---|---|
| 27 | Título y líneas | Tu pedido · Entrevista + libro digital · Libro impreso, tapa dura (· 2 ejemplares) · Foto enmarcada (· 2 marcos) | igual | maqueta, sin precios (el panel no los tiene a mano; ver PENDIENTES F2-4) y sin la garantía (D1) |
| 28 | Filas | Cambiar la dirección de envío · Añadir el marco · Pausar o cerrar el libro · Cancelar el pedido | … · Sumar el marco · … | maqueta (sin «Cambiar la fecha de inicio»: no existe) |
| 29 | Hoja de pausar | Pausar por ahora | igual | maqueta |
| 30 | Texto de esa hoja | La pausa la hace una persona del equipo. Escríbenos y paramos las preguntas y los recordatorios. Lo que ya contó queda guardado. | …Escribinos y frenamos las preguntas… | adaptado: la maqueta pausaba con un botón; la web no puede (D4, C10) |
| 31 | Dentro de la misma hoja, si tiene 10 respuestas o más | Cerrar el libro con lo que ya hay | igual | maqueta. Debajo va el cierre anticipado de siempre (textos ya aprobados) |
| 32 | Hoja de cancelar (solo antes de empezar) | Cancelar el pedido · Escríbenos y lo vemos contigo. Te contesta una persona. | …Escribinos y lo vemos con vos… | adaptado: la maqueta devolvía el dinero con un botón; no existe (C9) y la garantía no va en el panel (D1) |
| 33 | Botones de esas hojas | Escribir por WhatsApp · Escribir un correo · Cerrar | igual | nuevo |
| 34 | Asunto del correo que se abre | Pausar el libro · Cancelar el pedido | igual | nuevo |

## Tanda 4: la cabecera del panel

| # | Dónde | es | ar | Origen |
|---|---|---|---|---|
| 35 | Selector de historias (lector de pantalla) | Cambiar de historia. Ahora, La historia de Antonio | igual | nuevo |
| 36 | Círculo de la cuenta (lector de pantalla) | Tu cuenta y salir | igual | nuevo |
| 37 | Tocar la tapa (lector de pantalla) | El libro de Antonio / Tu libro | igual | nuevo |
| 38 | Línea de tiempo (lector de pantalla) | Cómo va · hecho · ahora | igual | nuevo |

La cabecera del panel (Inicio, Historias, Encargar libro, Tu cuenta, Cerrar sesión, + Empezar otra
historia) y los estados cortos del selector son los de siempre.

## Femenino

Los tres textos del panel que decían «él» ahora dicen «ella» cuando `contexto.genero = "mujer"`
(madre, abuela, o «ella» en Otra persona): «Las cuatro finales las escribe el biógrafo con todo lo
que ella haya contado», «la escribe el biógrafo con lo que ella haya contado» (editor del guion) y
«El biógrafo propone cinco, con lo que ella contó hasta hoy». Ningún texto nuevo usa «él».

## Lo que NO se puso (de la maqueta)

- «Anticipo» en la línea de tiempo, «capítulos escribiéndose», «Su libro, capítulo a capítulo · 2 de 8 listos» (D4).
- «Si él no quiere hacerlo, te devolvemos el dinero» en Tu pedido (D1: solo FAQ, checkout y legales).
- «Lleva 10 días sin contestar · Mandárselo yo» (C11; queda el aviso de siempre `alerta_silencio`).
- «Cambiar la fecha de inicio», «Cambiarla» (la pregunta pendiente), «Cambiar la primera pregunta», «Así le va a llegar» (no existen; PENDIENTES F2-5).
- «Hasta 12, de cualquier época… escribimos el pie con lo que él contó» (B22: el límite es 20 y el pie no se promete).
- «Llega a casa unos 9 días después» (B9).
- «Reanudar», «Pedido cancelado», «Te devolvemos el dinero al mismo medio de pago…» (estados que la web no pone).
