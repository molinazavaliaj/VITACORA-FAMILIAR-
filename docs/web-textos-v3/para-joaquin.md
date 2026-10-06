# Textos V3 de la web: lo que queda para Joaquín

Sale de [`aprobados.md`](aprobados.md) (Naza, 06/10/2026). Los textos que eran solo texto ya están aplicados en la rama `web-textos-v3`. Acá queda lo que es código (sacar un bloque, cambiar una regla) o un texto que depende de ese código: si se pone antes, miente.

Las líneas son las de la rama `web-textos-v3` después de aplicar los textos.

## Antes de publicar: los legales pasan por el abogado

Términos, privacidad y arrepentimiento ya tienen aplicado lo que Naza aprobó (de vos, sin región que se elige, sin "treinta días", sin blanco y negro, marcos solo con el impreso, sin la frase de la voz clonada). **No se publican sin el OK del abogado.**

Cuatro puntos los redacta el abogado. Quedó el texto viejo con un comentario `TODO abogado` arriba:

| qué | dónde | lo que aprobó Naza |
|---|---|---|
| T18, desistimiento en España | `web/src/app/legal/terminos/page.tsx:152` (comentario) y el texto en 155–162 | «…menos la parte proporcional a lo ya hecho de la entrevista». Sin cantidad fija de preguntas, el abogado define cómo se mide. El texto viejo todavía dice "nos pides / te arrepientes" (tú): se pasa a vos cuando se reescriba. |
| T20, si no hay libro | `web/src/app/legal/terminos/page.tsx:179` (comentario) y el texto en 182–188 | Opción a: la devolución completa queda solo para cuando el narrador **no acepta** participar, sin número de preguntas. |
| T23, qué te prometemos | `web/src/app/legal/terminos/page.tsx:217` (comentario) y el texto en 221–224 | «Te prometemos que el libro se escribe con las palabras de tu narrador, que para quien cuenta va a ser fácil, con audios de WhatsApp a su ritmo, y que si algo sale mal lo arreglamos.» (sin "o te devolvemos el dinero"). |
| Arrepentimiento 4, sin plazo | `web/src/app/legal/arrepentimiento/page.tsx:70` (comentario) y 73 (texto) | Va con T20: devolución completa solo si el narrador no acepta. |

También para el abogado: la compra (`web/src/app/comprar/formulario.tsx:541`, solo España) ya dice «Si te arrepentís con la entrevista en marcha, se descuenta la parte ya hecha». Naza: el cálculo de "la parte ya hecha" lo define el abogado (no hay un total fijo).

## La compra (`web/src/app/comprar/formulario.tsx`)

1. **Arrancar con el libro impreso puesto.** Hoy el carrito arranca con `CARRITO_VACIO` (línea 71: solo el PDF). Naza quiere que arranque con impreso + PDF con «Su voz»; quien quiera solo el PDF, lo saca. Los marcos, después, como agregado. Con ese cambio van dos textos aprobados que **no apliqué** porque hoy mentirían:
   - `web/src/app/cta-sticky.tsx:64`: «Pago único · PDF o impreso» → **«Pago único · Libro impreso + PDF con «Su voz»»**
   - `formulario.tsx:420`: «El libro en PDF con «Su voz» va siempre: es donde ocurre la magia. El impreso y los marcos se suman si quieres.» → **«Este es el regalo completo: el libro impreso, el PDF y «Su voz». Abajo podés sumarle los marcos.»**
2. **«¿Cómo le escribimos?» (líneas 299–304).** La etiqueta, el ejemplo («Roberto, Beto, Don Roberto»), la ayuda y el error ya están. Falta:
   - que el campo venga completado con el nombre de pila (el primer nombre de «Su nombre completo»);
   - que no deje avanzar con: papá, mamá, abuelo, abuela, abu, nono, nona, tío, tía, viejo, vieja. Error si está vacío (ya está): «¿Cómo le escribimos? Poné su nombre o su apodo.» Para las palabras prohibidas Naza no aprobó un error propio; la ayuda dice: «Así lo va a saludar el biógrafo por WhatsApp. Si tiene un apodo, ponelo. Nada de "papá" ni "abuela".»
3. **«¿Cómo le hablamos?»** reemplaza al selector «De usted / De vos» (líneas 365–366): de vos / de tú / en catalán (`contexto.idioma` es-AR / es-ES / ca), marcado de entrada según el país desde donde compra, y se puede cambiar (un argentino en España). No hay texto aprobado además de las tres opciones.
4. **Paso 5 queda solo con «El álbum del libro».** Se sacan enteros:
   - el bloque «Ritmo» (líneas 452–466, con su nota «Además, al terminar cada respuesta…» que todavía dice «Tú también marcas tu ritmo» / «Él también marca su ritmo»);
   - «Temas que no se preguntan» (468–472);
   - «¿De qué quieres que le preguntemos más?» con los botones de temas (474–485; dice «Las 30 preguntas son las mismas para todos»);
   - «Algo que no puede faltar» (487 y siguientes).
   La V3 es un banco igual para todos y no los usa. El texto de arriba del paso ya está cambiado y asume que solo quedan las fotos: «Si tenés fotos suyas, subilas acá. También podés hacerlo después, desde tu panel.» El título del paso («Cómo va a ser la entrevista.», 446) y el comentario de la línea 442 quedan raros con solo fotos: Naza no aprobó otro título.
5. **El carrito habla de tú.** `formulario.tsx:435` llama a `Upsells` con `trato="tu"`, y `web/src/app/comprar/productos-ui.tsx:27` dice «Añade», «Ya tienes», «añade el libro impreso». La variante de vos ya existe (línea 28: «Sumá», «Ya tenés»). No estaba en lo aprobado; con la regla "de vos siempre" alcanza con pasar `trato="vos"`. Confirmar con Naza.

## El panel

6. **Sin total ni barra (P3).** «{respondidas} de {total} respuestas» → **«{respondidas} respuestas»** en `web/src/app/tablero/ui.tsx:90`, `web/src/app/tablero/riel.tsx:97` («{respondidas} de {total}») y `web/src/app/tablero/[narradorId]/page.tsx:322`, y sacar la barra de progreso. El total sale de `TOTAL_PREGUNTAS_BASE = 30`.
7. **Sacar el selector de ritmo en Ajustes (P4).** `web/src/app/tablero/[narradorId]/preguntas/acciones.tsx`, componente `Ajustes` (642 en adelante; la nota de la línea 703 dice «Él también marca su ritmo»). Los textos del selector están en `web/src/lib/guion.ts:32–36` (`NOMBRE_RITMO`: «Una por día», «Dos por día», «Apenas responde»).
8. **Tope de las preguntas de la familia: 300 → 500 letras (P5).** `web/src/lib/guion.ts:26` (`TEXTO_MAXIMO = 300`). El mensaje ya está con el texto aprobado y usa la constante, así que dice 300 hasta que la cambies: «Es un poco larga (máximo ${TEXTO_MAXIMO} letras). Pensá que la va a leer en el celular: cuanto más simple, mejor la contesta.» La pregunta más larga del banco tiene 441. Ojo si hay un tope igual en la base o en el entrevistador.
9. **Preguntas de la familia (P1).** El botón «Sugerime preguntas» (`preguntas/acciones.tsx:474–480`) dice «El biógrafo propone cinco, con lo que él contó hasta hoy. Vos elegís cuáles entran.» Naza aprobó en su lugar: **«Escribí las preguntas que le quieras hacer. También podés sumarle una foto a una pregunta, para que te cuente sobre ese momento.»** (las preguntas de la familia con foto sí van en la V3; llegan en el bloque Legado). No lo puse en el botón porque el botón sigue pidiendo propuestas al biógrafo: va donde la familia escribe sus preguntas, y lo de "propone cinco" se decide con Naza.

## El anticipo

10. **La página `/anticipo/[token]` muestra su primer audio, no páginas (A4).** Hoy, si no hay `anticipo.json`, muestra «Todavía se está escribiendo» / «Las primeras páginas aparecen acá en cuanto estén listas. Vuelve a abrir este enlace en un rato.» (`web/src/app/anticipo/[token]/page.tsx:272–279`), y el título de la página es «Esto es lo que lleva escrito el libro de {nombre}.» (135). Naza aprobó: **«Acá está su primera respuesta, con su voz. Lo que siga contando lo vas a ir escuchando en tu panel.»** (el libro se escribe al final). No lo apliqué: la página todavía espera páginas escritas.
11. **El mail de la fábrica** (`fabrica/src/mail/anticipo.ts`) ya dice «ya empezó a contar», «Cuando termine de contarnos su historia, el biógrafo va a empezar a escribir su libro.» y «Vos lo vas escuchando desde tu panel.». Pero todavía tiene el enlace «Ver el libro de tu ${quien}» (línea 70), que con la V3 no tiene libro que mostrar. Naza no aprobó texto para ese enlace: o se saca, o se decide con él. También cuándo sale (hoy, a la tercera respuesta; la maqueta de la portada ya dice "empezó a contar", sin número).

## La portada (maqueta)

12. **Sacar la barra de progreso** de la maqueta del panel (`web/src/app/maquetas.tsx:305–307`, `w-[37%]`). El "11 de 30" ya dice "11 respuestas".

## Mails del entrevistador (`entrevistador/src/mail/hitos.ts`)

13. **Sacar el hito «mitad» (M9)** (línea 48): sin total, no hay mitad. Hay que sacar también lo que lo dispara.
14. **Sacar el hito «tres días sin contestar» (M10)** (línea 53): la V3 ya avisa a quien regaló por WhatsApp a la semana sin audios (M9 del banco).
15. El de «aceptó» ya dice «Enseguida le llega la primera pregunta por WhatsApp.»: confirmá que en la V3 sale enseguida.

## Visto al aplicar y no tocado (para Naza, no estaba en lo aprobado)

- La respuesta de ejemplo de la maqueta (`web/src/app/maquetas.tsx:174`) ahora dice «un limonero» pero sigue con «yo me acuerdo del olor a uva caliente»: bajo un limonero no hay uva. Hace falta otra palabra (por ejemplo, azahar); la elige Naza.
- En el panel quedan textos con «él» o con ritmo diario que la propuesta no listó: «Está respondiendo, día a día» / «Estás respondiendo, día a día» (`web/src/app/tablero/ui.tsx:13` y `:24`), «…con todo lo que él haya contado» (`web/src/app/tablero/[narradorId]/page.tsx:530`), «la escribe el biógrafo con lo que él haya contado» (`web/src/app/tablero/[narradorId]/preguntas/acciones.tsx:223`).
- El WhatsApp al narrador cuando retoma dice «Mañana le llega la siguiente pregunta.» (`entrevistador/src/flujo/procesar.ts:214`). No es web; va con la V3 del entrevistador.

## Agregado al cierre (06/10)
- Hecho en la rama: el carrito pasa a `trato="vos"` (la web de Argentina va de vos en todo); "olor a uva" → "olor a azahar" (va con el limonero); el estado del panel "respondiendo, día a día" → "a su ritmo / a tu ritmo".
- **Preguntas "adaptativas" del panel** (`tablero/[narradorId]/page.tsx:530` "Las cuatro finales las escribe el biógrafo…", `preguntas/acciones.tsx:223` "la escribe el biógrafo con lo que él haya contado", y el botón "Sugerime preguntas" de `acciones.tsx:480`): son de la entrevista vieja (una IA escribía preguntas). En la V3 las preguntas son el banco aprobado + las que escribe la familia (con foto opcional). Sacar esas partes; la descripción aprobada de la sección de preguntas de la familia es: «Escribí las preguntas que le quieras hacer. También podés sumarle una foto a una pregunta, para que te cuente sobre ese momento.»
- La página del anticipo tiene que mostrar su primer audio (no páginas): texto aprobado A4 «Acá está su primera respuesta, con su voz. Lo que siga contando lo vas a ir escuchando en tu panel.»
