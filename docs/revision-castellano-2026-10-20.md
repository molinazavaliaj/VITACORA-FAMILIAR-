# Castellano de la web — pasada de corrector, 20/10

Igual que se hizo con el catalán y Softcatalà (PR #95 y #106), pero para el castellano: la versión de
España (de tú) y la de Argentina (de vos).

## Qué se revisó y cómo

- **Qué**: todos los textos `es` y `ar` de `web/src/app/_textos/*.ts` (legales incluidos), los mails
  (`lib/mail-textos.ts`, `lib/mail.ts`, `lib/mail-cupon.ts`, `lib/regalo-textos.ts`) y los textos
  sueltos de la página de la historia (`app/tablero/**`, `app/libro`, `app/comprar`, `lib/*`). Unos
  3300 textos de la web y 600 de la página de la historia. Además, los mensajes del bot
  (`entrevistador/src/*/nucleo/banco*.json` es-AR y es-ES, y `flujo/regalo-textos.ts`), unos 1360.
- **Con qué**:
  1. **LanguageTool** (`api.languagetool.org`, gratis), con `es-ES` para España y `es-AR` para
     Argentina.
  2. **Un chequeo propio con las reglas de Naza**: dos puntos, oraciones que empiezan con «Y»,
     «de que», «panel», «te devolvemos el dinero» fuera de lugar, promesas que no se cumplen
     («9 días», «una pregunta por día», «cada noche», anticipo) y tú y vos mezclados.
  3. **Dos correctores (Opus)**, uno para España y otro para Argentina, que leyeron todo buscando
     lo que LanguageTool gratis no ve: concordancia, régimen, tildes diacríticas y palabras de un
     país coladas en el otro.
- **Lo que se descartó**: nombres propios y marcas (Vitácora, Osvaldo Toroide, Stripe, Mercado
  Pago, Bookmundo…), enlaces (`/legal/terminos#garantia`), variables (`{nombre}`, `{X}`), siglas
  legales (RGPD, LOPDGDD, AEPD, AAIP), CSS de los mails, fragmentos que empiezan en minúscula
  porque van en medio de una frase, y el catalán de los selectores de idioma («Castellà»).

**Resumen.** La ortografía está limpia. LanguageTool no encontró ningún error real en la web.
Hay siete errores de gramática, que van corregidos en el PR. No hay ninguna frase que mezcle tú
y vos, ni en la web ni en el bot. Lo que más aparece son **palabras argentinas en la versión de
España** («contratapa», «a color», «le dices»…). Además están los dos puntos, «panel» en cuatro
lugares y una pregunta de ejemplo que trata de usted.

---

## A. Errores de gramática — corregidos en el PR (rama `castellano-corrector`)

| Dónde | Antes | Ahora | Por qué |
|---|---|---|---|
| Legales, privacidad (es) `legal.ts:546` | Tú, el narrador y cada invitado **pueden** pedir | … **podéis** pedir | Si el sujeto incluye «tú», en España el verbo va en vosotros |
| Legales, términos (es y ar) `legal.ts:346, 807` | nunca te van a dar menos derechos **que** los que te corresponden | … menos derechos **de** los que… | «Más/menos» seguido de «los que» lleva «de» |
| Eventos, pista del mensaje (es) `eventos.ts:122` | qué te gustaría que **tenga** el libro | … que **tuviera** el libro | «Gustaría» pide imperfecto de subjuntivo (en Argentina se deja, allá suena natural) |
| Mail de invitación (es) `mail-textos.ts:124` | preguntas que te gustaría que le **hagan** | … que le **hicieran** | Ídem |
| Pedido confirmado (es y ar) `pedido-confirmado.ts:46, 89` | seguir su historia **desde cerca** | … **de cerca** | La locución es «de cerca» |
| Portada, bajada y meta (es y ar) `portada.ts:154, 159, 364, 369` | nos encargamos de escribir su libro **y que** quede en tu familia | … **y de que** quede… | «Encargarse de algo y **de** que…» |
| Kids, foto (ar) `kids.ts:336`, `landing-kids.ts:208` | **le** saca una foto a sus juguetes | **les** saca… | Concuerda con «sus juguetes» |

Test actualizado con el texto nuevo: `test/portada-trato.test.tsx` (la bajada).

---

## B. Cambios de estilo — los aprueba Naza (no aplicados)

### Tanda 1 (las diez que más se ven)

**1. La pregunta de ejemplo con foto trata de usted** (`tablero/[narradorId]/preguntas/acciones.tsx:313` y `:393`)
Cuando alguien agrega una pregunta con foto en la página de la historia, el campo se llena solo con
«¿Qué estaba pasando ese día? Cuénteme todo lo que le venga a la cabeza al ver esta foto.» Esa
frase le llega al narrador. Trata de usted, y la regla es vos o tú, nunca usted. El ejemplo de
abajo («Cuénteme de aquel verano en la casa de la tía Rosa…») tiene el mismo problema.
- Recomendada (ar): «¿Qué estaba pasando ese día? Contame todo lo que se te venga a la cabeza al ver esta foto.» · «Contame de aquel verano en la casa de la tía Rosa…»
- Recomendada (es): «¿Qué estaba pasando ese día? Cuéntame todo lo que te venga a la cabeza al ver esta foto.» · «Cuéntame aquel verano en la casa de la tía Rosa…»
- Hay que tocar el código: el texto tiene que salir según el idioma del narrador.

**2. La descripción general del sitio promete «noche a noche»** (`app/layout.tsx:77`)
«Vitácora: un biógrafo por WhatsApp. Vitácora Familiar escribe el libro de una vida, con sus mejores frases en su propia voz; Vitácora de viaje, el libro de tu viaje, noche a noche.»
Es lo que muestra Google cuando una página no trae descripción propia. «Noche a noche» va contra la
regla B24, y la frase tiene dos puntos.
- Recomendada: «Vitácora es un biógrafo por WhatsApp. Vitácora Familiar escribe el libro de una vida, con sus mejores frases en su propia voz. Vitácora de viaje escribe el libro de tu viaje.»

**3. «Panel» de cara al público**
- Mail de Kids a los padres (`mail-textos.ts:261` ar, `:273` es): «En tu panel vas a ver todo lo que cuenta.» → «En la página de su historia vas a ver todo lo que cuenta.»
- Página del libro (`tablero/[narradorId]/libro/page.tsx:248`): «Quienes invitaste a la historia lo leen y lo escuchan desde su panel. Para el resto de la familia, el link para compartir está en la historia (botón Compartir): ven la muestra y pueden encargar su propio libro.» → «Las personas que invitaste lo leen y lo escuchan en la página de la historia. Para el resto de la familia está el botón Compartir. Con ese enlace ven la muestra y pueden encargar su propio libro.»
- Bot: Kids, mensaje final al padre (es y ar), «Ya están todas sus respuestas en tu panel» → «en la página de su historia». Viaje, despedida (es y ar), «lo vas a poder leer en tu panel» → «en la página del viaje». También en el texto de bienvenida de Viaje (BIEN-2).

**4. «Contratapa» en la versión de España** (11 lugares)
En España se dice «contraportada». La página de ejemplo ya lo dice bien. Los demás lugares son
`portada.ts:198, 211, 220, 345` y `legal.ts:295, 300, 326, 355, 539`.
- Recomendada: «contratapa» → «contraportada» en toda la versión es (la ar queda igual).

**5. Otras palabras argentinas en la versión de España**
| Dónde | Hoy | Recomendada |
|---|---|---|
| `portada.ts:345`, `legal.ts:295` | a color | en color |
| `portada.ts:246` | y recién ahí se imprime | y solo entonces se imprime |
| `portada.ts:335` | ni apuro | ni prisa |
| `portada.ts:135` | cuando sea grande | cuando sea mayor |
| `legal.ts:255` | sin letra chica | sin letra pequeña |
| `legal.ts:404` | reclamo formal | reclamación formal |
| `legal.ts:437` | un correo alcanza | un correo basta |
| `legal.ts:611` | Aprieta el botón | Pulsa el botón |
| `legal-cupon.ts:46` | se vence solo | caduca solo |
| `eventos.ts:98` | con una entrevista adentro | con una entrevista dentro |

**6. «Cómo le dices» en la versión de España**
«Decirle» con el sentido de «llamarle» es de Argentina. Aparece en `regalo-textos.ts:255` («¿Cómo
le dices?») y `:280` («Falta cómo le dices.»), `legal.ts:460` («cómo le gusta que le digan») y
`checkout-viaje.ts:140` («Cómo te dicen / Cómo le dicen»). La línea 136 del checkout de Viaje ya
dice «Cómo te llama».
- Recomendada: «¿Cómo le llamas?», «Falta cómo le llamas.», «cómo le gusta que le llamen», «Cómo te llaman / Cómo le llaman».

**7. Dos puntos en los mails** (es y ar)
- `mail-textos.ts:108/155`: «Para ir escuchando lo que cuenta, entra a la página con este mismo correo:» → «…con este mismo correo.»
- `mail-textos.ts:128/177`: «Entra con este mismo correo:» → «Entra con este mismo correo.»

**8. Dos puntos en la compra y el libro de muestra**
- `comprar/productos-ui.tsx:27-28`: «Los marcos viajan con el libro: añade el libro impreso para agregar marcos.» → es «Los marcos viajan con el libro. Para añadir marcos, añade primero el libro impreso.» · ar «Los marcos viajan con el libro. Para sumar marcos, agregá primero el libro impreso.»
- `lib/productos.ts:38`: «Incluye «Su voz»: sus mejores frases, en su voz real, para escuchar.» → «Incluye «Su voz», sus mejores frases en su voz real, para escuchar.»
- `lib/productos.ts:50`: «Un marco con su foto y un chip: se acerca el teléfono y suena su voz.» → «Un marco con su foto y un chip. Se acerca el teléfono y suena su voz.»
- Contraportada del libro de muestra (`portada.ts:143`): «…contada con sus propias palabras: sus mejores historias, tal como él las vivió.» → «…contada con sus propias palabras. Sus mejores historias, tal como él las vivió.»
- Entrar (`entrar.ts:45/67`): «Escríbelo aquí:» / «Escribilo acá:» → sin los dos puntos.

**9. Comillas y puntos suspensivos**
La web usa «» en todos lados, pero en cuatro textos quedaron comillas rectas: «Nada de "papá" ni
"abuela"» (`checkout.ts:384/555`, `lib/como-le-dicen.ts:21/23`) y los ejemplos de Kids
(`panel-kids.ts:35/57`). En cinco textos hay «...» en lugar de «…» (`checkout.ts:444, 483, 615,
654` y `entrar.ts:42, 47`).
- Recomendada: «Nada de «papá» ni «abuela».» y «…».

**10. Kids: «por lo menos una al día»** (bot, aviso al padre, es y ar)
«A partir de ahí va a su ritmo, por lo menos una al día, y más si tiene ganas.» Se parece a «una
pregunta por día», que está en la lista de promesas que no se cumplen. Hay que confirmar si el
motor de Kids manda de verdad una por día.
- Recomendada, si no lo garantiza: «A partir de ahí va a su ritmo.»

### Para las tandas siguientes

- **Dos puntos en la página de la historia** (unos 30). Por ejemplo, «Listo: le mandamos la
  invitación a…», «Vista estimada: el libro real lo escribe…», «El biógrafo eligió… las frases que
  más suenan a ti: se imprimen…», «Estamos armando el libro. Tarda unos minutos: volvé…», «Las que
  vienen, sí: edita, saca, mueve.», «Si es una foto de papel: apóyala…», «Por ejemplo: el taller
  estaba en…». La lista entera sale de la sección DOS_PUNTOS del chequeo (se puede volver a correr).
- **Más palabras argentinas en España** (dudosas, más suaves). «Link» frente a «enlace»: `voz.ts`
  dice las dos cosas. «Sumar» por «añadir», en `portada.ts`, `viaje.ts`, la invitación y el
  legal. «Anotar» por «apuntar», en `legal.ts` y «Lo anotas» de la portada. Además, «¿Cuánto
  sale?» → «¿Cuánto cuesta?», «Intenta de nuevo» → «Inténtalo de nuevo» (la web usa las dos
  formas), «ya venció» → «ha caducado», «sonido parejo» → «uniforme» y «sin costo alguno» →
  «sin coste alguno» (`legal.ts:342`). «Ya volviste» y «Terminaste de contar» (`panel.ts:110,
  119`) → «Ya has vuelto» y «Has terminado de contar».
- **Dudas menores de redacción**:
  - Checkout `checkout.ts:574-575` (ar): «Después, la siguiente le llega…». «La siguiente» no tiene
    a qué referirse, así que mejor «la siguiente pregunta».
  - `portada.ts:378` (ar): «alguien que le escucha» → «alguien que lo escucha».
  - `regalo-textos.ts:206`: «Probá grabarlo de nuevo» → «Grabalo de nuevo».
  - «Cerrar la bitácora» con b en `tablero/acciones.tsx`. Está bien escrito, pero convive con la
    marca y en otro lado se dice «cerrar la entrevista».
  - `legal.ts`: «el desistimiento ya no aplica» → «ya no se aplica».
- **Legales**: tienen unos 170 dos puntos, pero se dejan. Son listas y definiciones del formato
  legal, y los legales L1–L3 ya los aprobó Naza.

---

## C. El bot (entrevistador) — revisado, nada aplicado

- **Tú y vos**: ninguna mezcla. Los bancos de Argentina no tienen formas de tú y los de España no
  tienen voseo.
- **Gramática**: falta la coma antes de «pero» adversativo en cinco preguntas de Kids, que son
  K18, K19 y B-FOTO-NOTENGO (es) y la pregunta 19 y el mensaje 14 (ar). Por ejemplo, «no es de tu
  familia ni del cole, pero es importante para ti». En Viaje (ar, mensaje 33), «y si querés
  contame en un audio qué es» lleva coma: «y si querés, contame…». **No se aplicó** porque los
  bancos de Kids y Viaje están copiados en tres lugares (`entrevistador/`, `fabrica/`, `web/src/lib/`)
  y la fábrica tiene un test que fija los textos de Viaje. Va mejor en un PR del bot, con Joaquín.
- **Estilo**: hay 116 oraciones que empiezan con «Y» y 272 dos puntos en los bancos. Los bancos
  los redactó Fable con la voz del biógrafo y Naza los aprobó aparte. No se proponen uno por uno.
  Si Naza quiere aplicar la regla también en WhatsApp, es un trabajo propio, banco por banco.
- «Panel» y «una al día»: ver tanda 1, puntos 3 y 10.
