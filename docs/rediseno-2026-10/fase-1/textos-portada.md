# Textos a aprobar — portada, /ejemplo, cabecera y pie (fase 1)

Naza: acá está todo texto que **no** es copia literal de `aprobados.md`, del `POR_TRATO` del 13/10
ni de la lista «se pueden usar tal cual» (TEXTOS-Y-REGLAS §5). Los textos viven en
`web/src/app/_textos/portada.ts`, `ejemplo.ts` y `publico.ts`. El catalán de esos tres archivos
está marcado `// ca: PENDIENTE REVISIÓN NATIVA` y no se lista acá frase por frase.

## Aprobado por Naza

- **14/10, tanda 1** (todos OK): bajada del hero de la maqueta en lugar de la aprobada; sale la
  segunda conversación; «Mientras responde…» en la banda; tarjeta de Viaje en lugar de Kids;
  «Mi papá no se lleva bien con el celular.»; «Así le llega una pregunta por WhatsApp.»; «Lleva
  también el PDF con «Su voz».»; cita del limonero con «el olor de los limones»; bajada de
  /ejemplo; explicación de «Su voz» en /ejemplo.

- **14/10, tanda 4** (todos OK): «Desde {precio} · pago único»; la banda de confianza; «La voz, lo
  que vivió y cómo lo cuenta, no la guarda nadie.»; «Lo que recibe él» y «Lo que recibes tú»; la
  bajada de «Para quién es» y sus dos tarjetas; la conversación «a la hora que prefiere»; el precio
  «Un solo pago. Sin sorpresas después.»; el marco sin dos puntos.

- **14/10, tanda 5** (todos OK): sin dos puntos en la portada (duda del celular, Su voz, marco,
  diciembre, para cada uno, regalo, lo que se hereda) y también en tres aprobados viejos («No hay que
  esperar a ciegas. Lo has ido…», «Siempre va la entrevista entera…», «Funciona igual. Las
  preguntas…»). Igual en catalán.

## 0. Textos aprobados que el diseño nuevo ya NO usa

| Texto aprobado | Por qué sale | Test |
|---|---|---|
| «Un biógrafo entrevista y escribe el libro de una vida. La de tu padre/papá, la de tu abuela, la tuya.» (bajada del hero) | El hero de la maqueta usa «Tu padre lo cuenta con audios de WhatsApp. Nosotros lo convertimos en el libro de su vida.» (§5, se puede usar tal cual). | Quitada la aserción de `portada-trato.test.tsx` |
| «En todas las familias hay una historia de los de antes… ¿Cuál sabes/sabés de tu familia?» (segunda conversación de WhatsApp) | El diseño nuevo tiene una sola conversación (la del primer recuerdo y el limonero, que sí se conserva). | Quitada la aserción |
| Los demás títulos del diseño viejo que no estaban aprobados uno a uno («No tiene nada que aprender.», «Ochenta años de aprender…», «Para la casa / Para cada uno» de antes, los formatos con «en la repisa») | Cambia la estructura; los títulos de sección son los de la maqueta. | — |

Se conservan, con el diseño nuevo: los tres pasos (Lo anotas / Solo manda audios / El biógrafo
escribe), «Mientras responde, tú vas escuchando…» (en la banda de confianza, en el sitio de la
garantía), «Tienes el teléfono lleno de fotos…», la conversación del limonero, el mail «Roberto ya
empezó a contar», «No hace falta imaginarlo. Lo vas escuchando.», «Desde la primera respuesta…»,
«Con esto vas a tener la historia de su vida completa.», Viaje, «¿Y si el libro es el tuyo?», las
seis preguntas frecuentes y «Siempre: la entrevista entera del biógrafo…».

## 1. Portada

| Dónde | es (tú) | ar (vos) | De dónde sale |
|---|---|---|---|
| Hero, bajo los botones | Desde {precio} · pago único | igual | Maqueta Main, **sin** «si él no quiere hacerlo, te devolvemos el dinero» (D1) |
| Banda de confianza 1 | Hojea un libro de ejemplo antes de comprar | Hojeá un libro… | Maqueta |
| Banda 2 | Pago único, sin suscripciones | igual | Maqueta |
| Banda 3 | Mientras responde, tú vas escuchando su historia desde tu panel. | …vos vas escuchando… | **Aprobado**, en el lugar de la garantía (D1) |
| Banda 4 | Sus audios son privados | igual | Maqueta |
| Las fotos quedan, párrafo | …La cara la guarda el móvil. **La voz, lo que vivió y cómo lo cuenta, no la guarda nadie.** | …el celular. … | Aprobado + segunda frase del diseño viejo |
| 01 Cómo funciona, bajada | Él solo tiene que hablar. Del resto nos ocupamos nosotros. | igual | §5 |
| Tarjetas de pasos | «Paso 1/2/3» + los tres pasos aprobados | igual | Diseño de la maqueta, textos aprobados (la maqueta decía «Tú vas leyendo cada capítulo a medida que se escribe»: fuera, D4) |
| 02 Qué recibe cada uno | Un regalo para él. Y otro para ti. / Él tiene a alguien que le pregunta por su vida. Tú te quedas con lo que contó. | …Y otro para vos. / Vos te quedás con lo que contó. | Maqueta (§5) |
| Lo que recibe él | Alguien que le pregunta por su vida y le escucha. · Preguntas por WhatsApp, de su infancia a hoy · Contesta con audios, a su ritmo y cuando quiere · Su historia escrita con sus palabras, no con las nuestras · Un libro suyo para enseñárselo a quien quiera | …y **lo** escucha. · …para **mostrárselo**… | Maqueta |
| Lo que recibes tú | Lo que nunca te contó. Y su voz, guardada. · Escuchas sus audios mientras cuenta, desde tu panel · El libro en PDF, con su voz dentro · Si quieres, impreso en tapa dura (y su foto en un marco) | Lo que recibís vos · Escuchás… · …con su voz adentro · Si querés… | Maqueta; «Escuchas sus audios…» es la sustitución de §5; **quitado** «Todos sus audios, guardados con su libro» (no está claro que el libro los guarde). El impreso y el marco solo salen si tienen precio. |
| 03 Para quién es | La de tu padre, la de tu abuelo, la de tu abuela. | La de tu papá… | §5 sin Kids |
| Bajada | Cada vida tiene su libro. **Vitácora Familiar**, para padres y abuelos. Y **Vitácora de Viaje**, para que cada viaje termine siendo un libro. | igual | Maqueta **sin la frase de Kids** |
| Tarjeta 1 | Vitácora Familiar · Para tu padre — Lo que nunca le preguntaste, por fin en un libro. | …Para tu papá | Maqueta |
| Tarjeta 2 | Vitácora Familiar · Para tu abuelo — Este año, algo que no se puede comprar hecho. | igual | Maqueta |
| Tarjeta 3 (en lugar de Kids) | **Vitácora de Viaje · Para tu viaje — En cada viaje hay un libro sin escribir.** | igual | **Nuevo** (lema de Viaje de TEXTOS-Y-REGLAS); foto de la pareja en Lisboa |
| 04 Antes de decidir | Lo que nos preguntan antes de regalarlo. | igual | Maqueta |
| Duda 1 | «Mi padre no se aclara con el móvil.» — Si manda audios por WhatsApp, ya sabe. No instala nada ni escribe una línea: aprieta el micrófono y habla. | «Mi papá no se lleva bien con el celular.» | Maqueta (§5); la versión ar es **nueva** |
| Duda 2 | «No le gusta hablar de sí mismo.» — No le pedimos que se describa… · Su primera casa · Su primer sueldo · Un domingo de niño | …Un domingo de chico | Maqueta |
| Duda 3 | «¿Y si lo deja a medias?» — Si un día no contesta, la pregunta le espera, y cuando retoma, la entrevista sigue donde quedó. | «¿Y si lo deja por la mitad?» — …la pregunta lo espera… | §5 (sin devolución ni «diez respuestas») + final del aprobado |
| Enlace | Ver todas las preguntas → | igual | **Nuevo** (la maqueta decía «Ver algunas preguntas →» sin destino; lleva a la FAQ) |
| La conversación | Solo tiene que mandar un audio. / Le escribimos por WhatsApp **a la hora que prefiere**, y contesta hablando, apretando el micrófono como cuando les manda un audio a sus hijos. Si un día no puede, la pregunta le espera. / Las preguntas van de la infancia a lo que aprendió en la vida, etapa por etapa… | …la pregunta lo espera. | Maqueta Resto; «a la hora a la que suele contestar» → «a la hora que prefiere» (es lo que elige quien compra) |
| Teléfono | Vitácora · cuenta de empresa · Hoy · 9:30 · grabando… · «Así le llega una pregunta por WhatsApp.» | igual | Maqueta (contacto «Vitácora») + mensajes aprobados; el pie es **nuevo** (la maqueta: «Así le llega el primer mensaje el día del regalo», con fecha de ejemplo) |
| Mientras cuenta | …No hay que esperar a ciegas: **lo has ido escuchando** todo el camino. | …lo fuiste escuchando… | Aprobado; en es se pasó a castellano de España |
| Panel de muestra | Tu panel · La historia de Roberto · 11 respuestas · 34 min de su voz · La juventud · el camión de leche / el primer sueldo · Las raíces · la casa del pueblo | igual | Maqueta (con Roberto, el del chat aprobado) |
| El libro | Una vida corriente tratada como una vida extraordinaria… | Una vida común… | Maqueta / diseño viejo |
| Formato PDF | En la nube · va siempre — El libro en PDF + Su voz — Escrito con sus palabras. Se lee en la web, capítulo a capítulo, con sus fotos y sus mejores frases en su voz real. — {precio} | igual | Maqueta |
| Formato impreso | En la estantería — El libro impreso — Tapa dura, con su foto en la portada y un código QR para escuchar su voz. **Lleva también el PDF con «Su voz».** — {base + impreso} | En la biblioteca · …en la tapa… | Maqueta + frase **nueva** (el precio es la suma, por eso lo aclara) |
| Formato marco | Para cada uno — Marcos con su voz — Un marco con su foto y un chip: acercas el móvil y suena su voz. **Van con el libro impreso.** — + {marco} | acercás el celular | Maqueta, cambiado «se pueden pedir con el digital o con el impreso» (C3, D4) |
| Su voz, texto | El libro viene con sus mejores frases en su voz real: sus dichos, su manera de empezar las frases, la risa cuando se acuerda de algo. Se escuchan en la web, se reenvían por WhatsApp, y el libro impreso lleva un código QR que las hace sonar. | …arrancar las frases… | Maqueta / diseño viejo |
| Su voz, cita | «…mi padre plantó **el limonero del patio** el año que nací. En verano comíamos debajo, y todavía me acuerdo **del olor de los limones** y de mi madre gritando que nos laváramos las manos.» | «…mi papá … comíamos abajo … mi mamá…» | Maqueta con la parra → limonero (regla 06/10); «olor a uva caliente» → «olor de los limones»: **nuevo** |
| Su foto, en casa | Su libro en la estantería. *Su foto, a la vista.* / Un marco negro pequeño, con la foto suya que elijas… / Acerca el móvil al marco y se abre su libro. / Por dentro lleva un chip… / Lo añades al comprar o después, desde tu panel. **Va con el libro impreso.** / Acercas el móvil al marco · Se abre su libro · Escuchas su voz | …en la biblioteca · marco negro chico · Acercá el celular… · Lo sumás… | Maqueta **sin «de 13 × 18 cm»** (no está en el código, PENDIENTES P2) + aviso del impreso (D4) |
| En diciembre | Este año, regala algo que no está en ninguna tienda. / Todos los años el mismo problema… un trozo de esa historia para cada uno. | regalá · un pedazo | Maqueta **sin la cita de IFEMA** |
| Para la casa / Para cada uno | Un libro — Impreso, en tapa dura, con su voz en la contraportada. El que queda en la estantería de la familia. / Un marco — Para cada primo y cada tío: acercas el móvil y suena su voz. | contratapa · biblioteca / se acerca el teléfono (aprobado viejo) | Maqueta |
| Regalo | Es un regalo: tú eliges cuándo le llega. / **Eliges el día en que empieza y te damos una tarjeta para entregárselo.** + «Regálalo con una tarjeta →» | vos elegís · Elegís el día… para dárselo · Regalalo… | Título de la maqueta; el texto es el de §5 (el de la maqueta, «le enviamos un mensaje precioso…», no es seguro para el regalo sin teléfono). **Sin** las fechas de ejemplo (Hoy / 24 / 25 de diciembre). |
| Lo que se hereda | Todo lo que aprendió en una vida, guardado para los que vienen. / …y a los que todavía no han nacido. / Hay preguntas que un día ya no se pueden hacer. | …no nacieron. | Maqueta |
| El precio | Un solo pago. Sin sorpresas después. · desde {precio} · Lo que cuesta hoy un libro de preguntas que él tendría que rellenar a mano. Aquí lo cuenta hablando, y le queda su voz grabada. | completar a mano · Acá | Maqueta **sin la garantía** (bajo el botón y en la lista) **ni el anticipo** |
| Lista del precio | Siempre: la entrevista entera del biógrafo… (aprobado) · El libro en PDF con «Su voz», para leer y escuchar siempre · Los marcos con su voz se suman al libro impreso. (aprobado) | igual | Aprobados + maqueta |
| Viaje | Vitácora de Viaje · También hay un libro en cada viaje. + texto y tres puntos aprobados + «Conocer la Vitácora de viaje · desde {precio}» | igual | Aprobados; sin «Cada ciudad, un capítulo» (Naza lo cambió el 06/10) |
| ¿Y si el libro es el tuyo? | aprobado + enlace **«Empezar mi propio libro»** | igual | Maqueta |
| FAQ, caja de dudas | ¿Te queda alguna duda? / Escríbenos y te contesta una persona, no un robot. / Escribir por WhatsApp | Escribinos… | Maqueta; solo con `NEXT_PUBLIC_WHATSAPP_DUDAS` |
| FAQ, garantía | **¿Y si no quiere hacerlo?** — Si no quiere hacerlo, te devolvemos el dinero. | igual | DECISIONES D1 (único sitio de la portada con la garantía) |
| Cierre | En cada familia hay un libro sin escribir. · Comprar el libro · Pago único · desde {precio}. | igual | Maqueta **sin la garantía** |
| Barra fija del teléfono | desde {precio} · Pago único · Libro impreso + PDF con «Su voz» · Comprar el libro | igual | Ya existía |
| Botón flotante | Escríbenos por WhatsApp (nombre accesible) | Escribinos… | Nuevo; solo con la variable |
| Alt de las fotos | «Un padre y su hijo se ríen en el sofá…», «Un abuelo abre una tarjeta de regalo…», «Una pareja hace fotos desde un mirador…», «Un marco negro pequeño con una foto…» | sillón · arbolito · saca fotos · techos · chico · prendida | Nuevos (describen sin nombrar a nadie: son fotos generadas, B10) |

## 2. Cabecera y pie (todas las pantallas públicas)

| Dónde | es | ar | De dónde sale |
|---|---|---|---|
| Solapas | Familiar · De viaje | igual | Maqueta (sin Kids) |
| Selector | ES · CA (solo en España) | — (en Argentina no se ofrece el catalán) | Nuevo |
| Sugerencia de catalán | «Aquesta web també està en català. Llegeix-la en català» (sale si el navegador pide catalán) | — | Nuevo |
| Pie, lema | Para las vidas que merecen su propio libro | igual | Aprobado (pie actual) |
| Pie, legales | Términos · Privacidad · **Desistimiento** | Términos · Privacidad · **Botón de arrepentimiento** | TEXTOS-Y-REGLAS §3 |
| Pie, contacto | Contacto · hola@vitacorafamiliar.com · Escríbenos por WhatsApp (con variable) | Escribinos… | Nuevo |
| Pie, país | ¿Estás en Argentina? | ¿Estás en España? | Nuevo (cambia de versión y deja la cookie) |

## 3. /ejemplo

| Dónde | es | ar | De dónde sale |
|---|---|---|---|
| Etiqueta | Ejemplo · El libro de Osvaldo | igual | Maqueta: «Ejemplo · **El anticipo** de Osvaldo» → fuera el anticipo (D4) |
| Aviso | **Historia inventada** | igual | Nuevo (la página lo tiene que decir) |
| Título | Así es su libro por dentro. | igual | Maqueta |
| Bajada | Un libro de ejemplo, con una historia inventada, para que veas cómo queda. Pasa las páginas. | Pasá | Nuevo (la maqueta: «Tras su tercera respuesta te llega el anticipo…», fuera) |
| Navegación | Página anterior / siguiente · «1 de 5 · Portada» (escritorio) / «1 de 8 · Portada» (teléfono) · Portada, Dedicatoria e índice, Capítulo 1, Su foto y su voz, Contraportada | Tapa / Contratapa | Maqueta |
| Botón | Empezar el libro de tu padre · {precio} | …de tu papá… | Maqueta, precio del catálogo |
| Nota | Libro de ejemplo con una historia inventada. El de tu familia se escribe con sus palabras. | igual | Maqueta (**sin** «Si él no quiere hacerlo, te devolvemos el dinero» de la versión móvil, D1) |
| Volver | ← Volver a la web | igual | Maqueta |

### El texto del libro de ejemplo (revisado contra las reglas)

Capítulos: La infancia, Las raíces, La juventud, Salir al mundo, El oficio, Los hijos, Las pruebas, La
sabiduría — **sin amor**. Nada promete anticipo ni capítulos «escribiéndose».

| Página | es | ar | Cambio respecto de la maqueta |
|---|---|---|---|
| Dedicatoria | Para mis nietos, que todavía no saben todo esto. — Osvaldo | igual | — |
| Índice | los ocho capítulos, «Sus frases de siempre · 95» | igual | — |
| Capítulo 1 | La infancia — «En casa no sobraba nada, pero nunca faltó la risa.» | igual | — |
| Texto | «Mi madre se levantaba antes que el sol…» (dos párrafos: el corral, la estufa de leña, la higuera, el abuelo que contaba la guerra sin contarla) | igual | — |
| Foto | Con la guitarra en la calle de abajo, **un verano de juventud**. «Tocaba fatal, pero tocaba fuerte.» | «Tocaba pésimo…» | «el verano de 1985» → sin fecha fija |
| Su voz | Así lo contó él. / **Sus mejores frases quedan en su voz real. Se escuchan con el código QR del libro o desde la web.** / «El primer sueldo se lo di entero a mi madre. Me devolvió veinte duros y me dijo: “Para que aprendas a gastarlos”.» | …Me devolvió **unas monedas**… gastarlas | Texto de explicación **nuevo** («Las frases que más se repiten…» no es como funciona «Su voz»); **sin** el código QR dibujado ni «Escanéalo con el móvil y escúchalo» (era un QR falso); la onda queda quieta (no hay voz grabada de Osvaldo) |
