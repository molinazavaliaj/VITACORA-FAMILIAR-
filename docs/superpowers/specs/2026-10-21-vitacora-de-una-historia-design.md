# Vitácora de una historia · Diseño (21/10/2026)

Aprobado por Naza en el brainstorming del 21/10/2026, parte por parte. Todavía no hay código. Rama `vitacora-historia`.

## 1. Qué es

Un libro corto y personalizado, de 40 a 60 páginas en tapa dura, sobre **un capítulo de la vida que ya pasó**. Por ejemplo «cuando me mudé a España», «el año que abrí mi negocio», «cómo superé una enfermedad» o «cómo nos conocimos».

| Producto | Qué cuenta | Cuándo se cuenta |
|---|---|---|
| Familiar | La vida entera | Mirando para atrás |
| De viaje | Un viaje | Mientras pasa, una pregunta por noche |
| Kids | El primer capítulo de un chico de 11 | Mirando para atrás |
| **Historia** | **Un solo capítulo, a fondo** | **Mirando para atrás** |

Decisiones de Naza:
- La historia **ya pasó**. La versión en vivo (algo que está pasando) queda afuera.
- Lo cuenta **uno mismo o se regala**, las dos cosas, como en Familiar y Viaje.
- **Precio igual que Familiar**. Naza: «todos los servicios tienen lo mismo». Son 99 € impreso más digital y el marco a +20 €. Argentina con la misma lógica que Familiar.
- Se imprime **igual que los otros**: Bookmundo, tapa dura 168×240, automático.

## 2. La compra

Es la compra de Familiar con un paso nuevo, **el tema**.

- **Lista de temas con salida libre.** Hay 6 sugeridos y «Otra historia», con un campo de una línea. El borrador de la lista (la redacción final la hace Fable y la aprueba Naza) es este:
  1. Cuando me fui a vivir a otro país
  2. El negocio propio
  3. Una enfermedad que superé
  4. Cómo nos conocimos
  5. Cuando fui padre o madre
  6. Un trabajo que me marcó
  7. Otra historia (campo libre)
- **Para mí / es un regalo.** Si es regalo:
  - el que regala elige el tema o marca «que lo elija quien lo cuenta»;
  - puede sumar **hasta 3 preguntas propias**, que pasan sin revisión, como en Viaje V2.
- Se piden los mismos datos que en Familiar: nombre, cómo le dicen, WhatsApp, mail y país. El país define el trato: vos en Argentina, tú en España, catalán. Nunca usted.
- Datos nuevos del pedido: `tema` (uno de la lista u `otra`) y `tema_libre` (texto, solo con `otra` o cuando lo elige el narrador).

## 3. El arranque por WhatsApp

1. **Bienvenida.** Es una plantilla de Meta nueva que carga Joaquín. Tiene dos versiones, para uno mismo y para regalo (con el nombre de quien regala), y nombra el tema. Pide el SÍ.
2. **Tema abierto.** Si el que regala dejó el tema a elección, el primer mensaje después del SÍ le pregunta de qué historia quiere hacer su libro. Se contesta con audio o texto y, si duda, se le muestra la lista. Lo que conteste se guarda como `tema` / `tema_libre`.
3. **Cómo funciona.** Explica que son unas 15 preguntas de a una, que contesta cuando quiere y con audio, y que siempre puede decir «paso». Enseguida llega la primera pregunta.

## 4. La entrevista

### 4.1 El orden (unas 15 preguntas, es el tope)

| Tramo | Qué cuenta | Cuántas |
|---|---|---|
| El antes | Quién era y cómo era su vida antes de que empezara | 2 |
| El comienzo | Cómo empezó, la decisión o el día en que pasó | 2 |
| Lo propio del tema | Preguntas a medida de cada tema (ej. mudanza: la valija, la llegada, la primera casa) | 4 o 5 |
| Lo más difícil | El peor momento y quién estuvo | 2 |
| El giro | Cuándo empezó a cambiar | 1 |
| El después | Cómo terminó y qué le dejó | 2 |
| El cierre | Qué le diría hoy a quien era entonces | 1 |

- La parte común (todo menos «lo propio del tema») es la misma para todos los temas.
- **«Otra historia»** reemplaza la parte del tema por preguntas generales que sirven para cualquier capítulo.
- Las **preguntas del que regala** van al final, antes del cierre. Se suman a las 15.
- Si dice «paso» o no tiene más para contar, se sigue. No se rellena.

### 4.2 Lo que viene de V3 (igual que en Familiar)

- Va una pregunta por vez, y la siguiente sale cuando contesta, en horario razonable.
- El acuse va pegado a la siguiente pregunta. «Paso» siempre vale.
- Texto en vez de audio y audio cortado, con los mismos mensajes que V3.
- Recordatorio si se cuelga, con las reglas de V3.
- **Cazador de escenas.** Si la respuesta es general, pide una vez un momento concreto. Nunca más de una vez por pregunta.
- No se recorta por cansancio. Lo que no va es una pregunta repetida o sin sentido (memoria «el narrador no se cansa»).

### 4.3 Fotos, lo delicado, idiomas, cierre

- **Fotos.** A mitad de la entrevista va un mensaje pidiendo de 3 a 10 fotos de esa época. Las fotos sueltas se guardan siempre.
- **Lo delicado.** Las preguntas sensibles van marcadas en el banco, como en V3 (por ejemplo en enfermedad o duelo). Lo que cuenta va al libro como lo dijo.
- **Idiomas.** es-AR (vos), es-ES (tú) y catalán, con el proceso de idiomas de V3 y Viaje V2 (retro-traducción a ciegas y Softcatalà para el catalán).
- **Hombre o mujer.** Las preguntas tienen que servir a los dos sin forzar nada, nunca un «de chica» o «de chico» fijo. Donde haga falta, la variante de género del render de V3.
- **Cierre.** Una despedida que cuenta que ahora se escribe el libro.

### 4.4 Quién escribe las preguntas

Las redacta Fable con voz cálida y Claude controla las reglas. Naza las aprueba de a 10 en el chat, con una versión recomendada, sin dos puntos, sin oraciones que empiecen con «Y» después de un punto y con frases simples. Se sigue el método de `docs/v3/entrevista/como-lo-hicimos.md`. El banco no usa la vida de un narrador real como ejemplo.

## 5. El libro

- Lo hace la **misma máquina del escritor** de la fábrica, con una **receta corta nueva**, como se hizo con Kids:
  - un solo hilo de punta a punta, 4 a 6 capítulos y el golpe preparado (memoria «un hilo por capítulo»);
  - relato, no transcripción, sin inventar hechos, con lo delicado como lo dijo («libro sin maquillaje»);
  - el título sale del tema y de sus palabras.
- Fotos y QR con los audios, como en Familiar.
- Bookmundo tapa dura 168×240, automático, interior en grises salvo las fotos.
- **Mínimo de 88 páginas** (agregado el 21/10, al armar el plan). La tapa dura de Bookmundo no se imprime con menos de 88 páginas, y sus reglas prohíben los libros que sean mayormente hojas en blanco. Naza decidió que va tapa dura igual. En este producto la plantilla **no rellena con hojas de «Notas»**. Si un libro sale con menos de 88 páginas, la fábrica no lo manda a Bookmundo y avisa a los socios (`MAIL_SOCIOS`). Los socios se comunican con el cliente y le ofrecen tapa blanda (170×240, mínimo 44 páginas), que se arma con un script a mano.
- Riesgo a medir en el piloto. Con unas 15 preguntas es probable que muchos libros salgan con menos de 88 páginas. Si pasa seguido, se revisa el largo con Naza.
- La primera corrida paga es con un narrador real del piloto, nunca con uno inventado.
- Se usa Opus para escribir y juzgar.

## 6. La web

- **Cuarta solapa**: Familiar · Kids · De viaje · **Historia** («Història» en catalán), en `web/src/app/_publico/cabecera.tsx` (`Solapas`, que pasa de 3 a 4 columnas, y el tipo `Producto` suma `"historia"`).
  - Se prueba en 360 px en es, ca y ar antes de cerrar. Si «De viaje» no entra al lado de las otras tres, pasa a «Viaje».
- Página `/historia` (con `/ca/historia` y `/ar/historia`) y compra `/comprar/historia` con el paso del tema.
- Precio: usa las mismas variables que Familiar (`PRECIO_EUR` / `PRECIO_ARS`, el impreso y el marco). No hay variable propia, así el precio no se puede desincronizar.
- Se prende con una variable (`HISTORIA_VENTA`, como `KIDS_VENTA`): puede estar lista en la web sin venderse hasta que Naza diga.
- Los textos de la web los redacta Fable y los aprueba Naza de a 10. No se promete lo que no pasa.

## 7. Cómo se construye (enfoque A, elegido por Naza)

**Carpeta nueva `historia` en el bot**, armada a partir de V3, con el mismo patrón que `kids-v2` y `viaje-v2`:

| Pieza | De dónde sale |
|---|---|
| `entrevistador/src/historia/nucleo/` | Copia del núcleo de V3 (turno, acuses, «paso», texto/audio, recordatorios, idiomas, cazador), con su propio banco |
| `docs/historia/banco.md` | Banco nuevo, fuente de verdad: parte común, una tanda por tema y la tanda general de «Otra historia» |
| Compra y panel | Los de Familiar con el campo «tema» (`tema`, `tema_libre`) |
| Preguntas del que regala | El mecanismo de Viaje V2 (PR-R), hasta 3, sin revisión |
| Escritor | La máquina de la fábrica con una receta nueva `historia` |
| Impresión | Bookmundo automático sin hojas de «Notas»; con menos de 88 páginas, aviso a socios y tapa blanda a mano |

- **V3 no se toca.** Los narradores que hoy están en Familiar no corren ningún riesgo.
- Descartados:
  - **B, meterlo adentro del motor de V3.** Toca lo que anda con narradores reales.
  - **C, banco fijo sin cazador como Viaje.** En un solo capítulo la profundidad lo es todo.
- Pruebas: tests del núcleo como en V3 y Kids, simulación con narradores inventados en los 3 idiomas, lectura corrida para Naza y revisor de código antes del merge.

## 8. Lo que queda afuera

- La versión en vivo (una historia que está pasando).
- Más temas que los 6 de la lista.
- Una historia para Kids.

## 9. Lo que falta antes de vender

1. Lista de temas y banco aprobados por Naza (Fable redacta, tandas de 10).
2. Receta del escritor y un libro de prueba con un narrador real del piloto.
3. Plantillas de Meta de la bienvenida en los 3 idiomas (Joaquín).
4. Textos de la web aprobados.
5. Prueba de la solapa en 360 px.
6. `HISTORIA_VENTA=1` en Vercel con el OK de Naza.
7. Revisar que los textos de la web que dicen «tres productos» o nombran solo Familiar, Kids y Viaje no queden mintiendo (memoria «textos que quedan mintiendo»).
