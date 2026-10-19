# Kids en castellano de España (de tú) · textos para aprobar (16/10)

**Qué es:** todos los textos de Vitácora Kids que ve una persona y hoy existen solo en rioplatense (vos), pasados al castellano de España tratando de tú. Son los que Naza ya aprobó en vos (tandas 2 a 7, 15 y 16/10): el panel de los padres, la página de los audios, el mail de acceso, «Pedido confirmado», dos avisos de la compra, los dos mails del libro, los textos fijos del libro y lo que se le contesta al padre por WhatsApp. Es un documento, no código: nada de esto está cargado todavía. Las tres pantallas de la compra y las landings ya tenían su sección de España (`checkout-kids.ts`, `landing-kids.ts`) y no se repiten aquí, salvo lo que les faltaba.

**Cómo se hizo:** adaptación, no reescritura (el mismo método del banco de la entrevista, `docs/v3/entrevista/banco-es-ES.md`, y de la compra de Kids). Mismo contenido, misma intención, mismo largo. Tú, nunca usted; frases simples; sin dos puntos ni giros armados; sin «tu hijo» ni «él» fijos; sin amor ni tiempos prometidos. Las variables (`{apodo}`, `{quien}`, `${nombre}`, `{n}`) quedan iguales. Las comillas «» que son parte del texto se mantienen. Si algo ya sonaba bien en España, queda igual y la columna de España dice «igual».

**Lo que cambia en todo el archivo, sin anotarlo fila por fila:** la conjugación (podés → puedes, escribí → escribe, leé → lee, probá → prueba, elegí → elige, revisá → revisa, poné → pon, vos → tú / ti, ustedes → vosotros donde habla al padre con otros, «cuando estén juntos» → «cuando estéis juntos»); el pasado reciente en pretérito perfecto, como se dice en España («ya le hemos escrito», «ha terminado de contar», «no has escrito preguntas», «has aprobado el libro»); y el vocabulario obvio: acá → aquí, celular → móvil, agregar → añadir, completar (un campo) → rellenar, armar → preparar, de grande → de mayor, contame → cuéntame, tocar (un botón) → pulsar, escuchala → escúchala (en España la tilde va; «escuchala» sin tilde es voseo).

**Lo que queda en rioplatense aunque la pantalla esté en España:** el motor de Kids solo habla rioplatense (`fabrica/src/kids-v2`), así que todo lo que el chico recibe por WhatsApp sigue en vos. Aquí aparece citado en dos textos del panel («Dale, vamos» y la línea PADRE-PREG-LINEA) y se deja tal cual, porque es lo que el chico ve de verdad. También quedan en vos los títulos de las cuatro partes del libro (`kids-banco.json`), que el panel muestra en «Va por la parte 2, «…»». Está anotado en las dudas.

---

## `web/src/app/_textos/panel-kids.ts` · el panel de los padres

### Aprobados que el panel toma de la rama vitacora-kids

| ID o clave | Rioplatense (aprobado) | España (tú) |
|---|---|---|
| PANEL-GUIA titulo | Tus preguntas para el libro | igual |
| PANEL-GUIA p1 | Podés agregar hasta tres preguntas tuyas. Le llegan a ${nombre} cerca del final, entre la cuarta parte y el sobre cerrado. Antes de cada una le decimos que viene de vos, salvo que prefieras que le llegue como una pregunta más. | Puedes añadir hasta tres preguntas tuyas. Le llegan a ${nombre} cerca del final, entre la cuarta parte y el sobre cerrado. Antes de cada una le decimos que viene de ti, salvo que prefieras que le llegue como una pregunta más. |
| PANEL-GUIA p2 | Que cada pregunta pida una sola cosa. Si querés saber dos cosas, escribí dos preguntas. | Que cada pregunta pida una sola cosa. Si quieres saber dos cosas, escribe dos preguntas. |
| PANEL-GUIA p3 | Funciona mejor pedirle una vez concreta que una opinión. "Contame la vez que…" saca mucho más que "¿Qué sentís?" o "¿Qué pensás de…?". | Funciona mejor pedirle una vez concreta que una opinión. "Cuéntame la vez que…" saca mucho más que "¿Qué sientes?" o "¿Qué piensas de…?". |
| PANEL-GUIA p4 | Como todas las demás, ${nombre} la puede pasar si no quiere contestarla. | igual |
| PANEL-GUIA ejemplo 1 | Contame el día que aprendiste a andar en bici sin rueditas. | Cuéntame el día que aprendiste a montar en bici sin ruedines. |
| PANEL-GUIA ejemplo 2 | Contame el día que se te cayó el primer diente, que fue comiendo un choclo. | Cuéntame el día que se te cayó el primer diente, que fue comiendo una mazorca. |
| PANEL-GUIA ejemplo 3 | Contame la primera noche que dormiste en lo de un amigo y nos llamaste a las dos de la mañana. | Cuéntame la primera noche que dormiste en casa de un amigo y nos llamaste a las dos de la mañana. |
| PANEL-GUIA p5 | Las podés escribir o cambiar hasta que empiece la cuarta parte. Después ya no se agregan. | Las puedes escribir o cambiar hasta que empiece la cuarta parte. Después ya no se añaden. |
| PANEL-CASILLA | Que le llegue como una pregunta más, sin decir que es mía | igual |
| QUIEN_LA_MANDA | ¿Quién se la manda? | igual |
| LEE_TODO (AVISO-PADRE) | Leé todo, pero no le digas nada hasta el libro. | Léelo todo, pero no le digas nada hasta el libro. |
| HORA (COMPRA-2-HORA) | A qué hora le escribimos · Mejor a la vuelta de la escuela, o cuando puedan sentarse juntos. | Ya está en `checkout-kids.ts` es, se toma de ahí. A qué hora le escribimos · Mejor a la vuelta del cole, o cuando podáis sentaros juntos. |
| TEMAS (COMPRA-3-TEMAS) | No preguntar sobre · Su mamá / Su papá / Un abuelo o abuela que murió / Su familia ensamblada (la pareja de mamá o papá, sus hijos) / Una mudanza o un cambio grande / Un mal momento en la escuela · Todo lo demás tiene botón para pasar. Si una pregunta no le gusta, la salta y seguimos. | Ya está en `checkout-kids.ts` es, se toma de ahí. No preguntar sobre · Su madre / Su padre / Un abuelo o abuela que murió / Su familia reconstituida (la pareja de su madre o de su padre, sus hijos) / Una mudanza o un cambio grande / Un mal momento en el cole · Todo lo demás tiene botón para pasar. Si una pregunta no le gusta, la salta y seguimos. |

### PANEL_KIDS

| ID o clave | Rioplatense (aprobado) | España (tú) |
|---|---|---|
| KP-ETIQUETA | Vitácora Kids | igual |
| KP-TITULO | El libro de ${apodo} | igual |
| KP-ESTADO-PAGO | Estamos confirmando el pago. | igual |
| KP-ESTADO-ANTES-A | Todavía no empezó. Le vamos a escribir a ${apodo} a la hora que elegiste. | Todavía no ha empezado. Le vamos a escribir a ${apodo} a la hora que elegiste. |
| KP-ESTADO-ANTES-B | Todavía no empezó. El primer mensaje te llega a tu WhatsApp. | Todavía no ha empezado. El primer mensaje te llega a tu WhatsApp. |
| KP-ESTADO-ESPERA-A | Ya le escribimos a ${apodo}. La primera pregunta sale cuando toque «Dale, vamos». | Ya le hemos escrito a ${apodo}. La primera pregunta sale cuando pulse «Dale, vamos». |
| KP-ESTADO-ESPERA-B | Ya te escribimos. La primera pregunta sale cuando toquen el botón, juntos. | Ya te hemos escrito. La primera pregunta sale cuando pulséis el botón, juntos. |
| KP-ESTADO-PARTE | Va por la parte ${n}, «${titulo}». | igual |
| KP-ESTADO-TERMINO | ${apodo} terminó de contar. Ahora empieza el armado del libro. | ${apodo} ha terminado de contar. Ahora empezamos a preparar el libro. |
| KP-CORTO-PAGO | confirmando el pago | igual |
| KP-CORTO-ANTES | todavía no empezó | todavía no ha empezado |
| KP-CORTO-CONTANDO | contando | igual |
| KP-CORTO-TERMINO | terminó de contar | ha terminado de contar |
| KP-LO-QUE-CUENTA | Lo que cuenta | igual |
| KP-VACIO | Cuando ${apodo} conteste la primera pregunta, lo que cuente aparece acá. | Cuando ${apodo} conteste la primera pregunta, lo que cuente aparece aquí. |
| KP-PARTE | Parte ${n} | igual |
| KP-ANTES | Antes de la primera pregunta | igual |
| KP-SOBRE | Del sobre cerrado | igual |
| KP-SOBRE-TEXTO | Estas van en un sobre cerrado, pegado al libro, para que ${apodo} lo abra cuando sea grande. | Estas van en un sobre cerrado, pegado al libro, para que ${apodo} lo abra cuando sea mayor. |
| KP-TU-PREGUNTA | Tu pregunta ${n} | igual |
| KP-TOCO | Tocó «${boton}» | Pulsó «${boton}» |
| KP-TRANSCRIBIENDO | Estamos pasando el audio a texto. | igual |
| KP-FOTO-ALT | Una foto que mandó ${apodo} | igual |
| KP-ESCUCHAR | su respuesta | igual |
| KP-CORR-BOTON | Corregir un nombre | igual |
| KP-CORR-AYUDA | Si un nombre quedó mal escrito, poné cómo dice y cómo es. Lo que contó no se toca, y en el libro sale bien. | Si un nombre ha quedado mal escrito, pon cómo dice y cómo es. Lo que contó no se toca, y en el libro sale bien. |
| KP-CORR-DICE | Cómo dice | igual |
| KP-CORR-ES | Cómo es | igual |
| KP-CORR-GUARDAR | Guardar | igual |
| KP-CORR-CANCELAR | Cancelar | igual |
| KP-CORR-LINEA | «${dice}» va como «${es}» | igual |
| KP-CORR-QUITAR | Quitar | igual |
| KP-PREG-N | Pregunta ${n} | igual |
| KP-PREG-PISTA | Contame la vez que… | Cuéntame la vez que… |
| KP-PREG-EJEMPLOS | Por ejemplo | igual |
| KP-PREG-GUARDAR | Guardar mis preguntas | igual |
| KP-PREG-CERRADAS | Ya empezó la cuarta parte, así que tus preguntas no se cambian más. | Ya ha empezado la cuarta parte, así que tus preguntas ya no se cambian. |
| KP-PREG-NINGUNA | No escribiste preguntas. | No has escrito preguntas. |
| KP-PREG-CON-LINEA | Antes le llega «Esta pregunta te la manda ${quien}, con sus palabras.» (con «mandan» si ${quien} empieza por «tus») | igual (lo de adentro es PADRE-PREG-LINEA, lo que el chico recibe del motor, y queda tal cual) |
| KP-PREG-SIN-LINEA | Le llega como una pregunta más. | igual |
| KP-AJUSTES-TITULO | La hora y los temas | igual |
| KP-TEMAS-AYUDA | Lo que marques no se pregunta. Si ya se preguntó, queda como lo contó. | Lo que marques no se pregunta. Si ya se ha preguntado, se queda como lo contó. |
| KP-AJUSTES-GUARDAR | Guardar | igual |
| KP-GUARDANDO | Guardando… | igual |
| KP-GUARDADO | Guardado. | igual |
| KP-PENDIENTE | Guardado. Se aplica antes de la próxima pregunta. | igual |
| KP-ERROR-CERRADAS | Tus preguntas no llegaron a tiempo. Ya había empezado la cuarta parte, así que no se las vamos a hacer. | Tus preguntas no han llegado a tiempo. Ya había empezado la cuarta parte, así que no se las vamos a hacer. |
| KP-ERROR-OTRO | No pudimos aplicar tu último cambio. Probá de nuevo, y si vuelve a pasar, escribinos. | No hemos podido aplicar tu último cambio. Prueba de nuevo, y si vuelve a pasar, escríbenos. |
| KP-ERR-GENERICO | No pudimos guardar. Probá de nuevo. | No hemos podido guardar. Prueba de nuevo. |
| KP-ERR-OCUPADO | Justo se estaba guardando otro cambio. Probá de nuevo. | Justo se estaba guardando otro cambio. Prueba de nuevo. |
| KP-ERR-NO-KIDS | Esta historia no es de Vitácora Kids. | igual |
| KP-ERR-HORA | Elegí una hora de la lista. | Elige una hora de la lista. |
| KP-ERR-TEMAS | Elegí los temas de la lista. | Elige los temas de la lista. |
| KP-ERR-PREGUNTAS | Revisá tus preguntas. Son hasta tres, y cada una con su texto. | Revisa tus preguntas. Son hasta tres, y cada una con su texto. |
| KP-ERR-TERMINADO | Ya terminó de contar, así que esto no se cambia más. | Ya ha terminado de contar, así que esto ya no se cambia. |
| KP-ERR-CORR-VACIO | Completá cómo dice y cómo es. | Rellena cómo dice y cómo es. |
| KP-ERR-CORR-NO-ESTA | Ese nombre no aparece en esta respuesta. Copialo como está escrito. | Ese nombre no aparece en esta respuesta. Cópialo como está escrito. |
| KP-LIBRO-TITULO | El libro ya está escrito | igual |
| KP-LIBRO-TEXTO | Acá está el libro de ${apodo}, con lo que contó. Leelo antes de aprobarlo. El sobre cerrado va aparte. | Aquí está el libro de ${apodo}, con lo que contó. Léelo antes de aprobarlo. El sobre cerrado va aparte. |
| KP-LIBRO-VER | Ver el libro | igual |
| KP-LIBRO-BAJAR | Descargar el libro | igual |
| KP-LIBRO-VER-SOBRE | Ver el sobre | igual |
| KP-LIBRO-BAJAR-SOBRE | Descargar el sobre | igual |
| KP-LIBRO-ALGO-MAL | Si algo no está bien, escribinos antes de aprobarlo. | Si algo no está bien, escríbenos antes de aprobarlo. |
| KP-LIBRO-APROBAR | Aprobar el libro | igual |
| KP-LIBRO-CONFIRMAR | Cuando lo aprobás, queda así y ya no se cambia. | Cuando lo apruebas, se queda así y ya no se cambia. |
| KP-LIBRO-SI | Sí, aprobarlo | igual |
| KP-LIBRO-NO | Todavía no | igual |
| KP-LIBRO-APROBANDO | Aprobando… | igual |
| KP-LIBRO-APROBADO (con impreso) | Aprobaste el libro. Ahora lo mandamos a imprimir. | Has aprobado el libro. Ahora lo mandamos a imprimir. |
| KP-LIBRO-APROBADO (sin impreso) | Aprobaste el libro. | Has aprobado el libro. |
| KP-LIBRO-ERR-NO-LISTO | El libro todavía no está listo para aprobar. | igual |
| KP-LIBRO-ERR-YA-APROBADO | Este libro ya está aprobado. | igual |
| KP-LIBRO-ERR-CONFIRMAR | Falta confirmar que lo querés aprobar. | Falta confirmar que quieres aprobarlo. |
| KP-LIBRO-ERR-ARCHIVO | No encontramos ese archivo. | No hemos encontrado ese archivo. |
| KP-INICIO-PREGUNTAS | Escribí tus preguntas para el libro | Escribe tus preguntas para el libro |
| KP-INICIO-VER | Mirá todo lo que cuenta | Mira todo lo que cuenta |

---

## `web/src/app/_textos/voz-kids.ts` · la página de los audios (`/voz/<token>`)

| ID o clave | Rioplatense (aprobado) | España (tú) |
|---|---|---|
| etiqueta (KP-ETIQUETA) | Vitácora Kids | igual |
| titulo (KP-TITULO) | El libro de ${apodo} | igual |
| suVoz | Su voz | igual |
| escuchala | Escuchala | Escúchala |
| KV-BAJADA | Acá están sus respuestas, tal como las dijo. Tocá una para escucharla. | Aquí están sus respuestas, tal como las dijo. Toca una para escucharla. |
| KV-SIN-AUDIOS | Sus respuestas en audio todavía se están preparando. | igual |
| KV-PESTANA-LIBRO | El libro | igual |
| KV-LIBRO-NO-ESTA | El libro todavía se está preparando. | igual |
| KV-ETIQUETA-AUDIO | la respuesta «${texto}» | igual |

---

## `web/src/lib/mail-textos.ts` · `TEXTOS_MAIL_KIDS`, el mail de acceso de Kids

Lo demás del mail (título, botón, código, «Al terminar», dudas y pie) ya existe en `TEXTOS_MAIL.es`; hoy Kids toma el bloque `ar` y en España tendría que tomar el `es`.

| ID o clave | Rioplatense (aprobado) | España (tú) |
|---|---|---|
| asunto | Listo, ya está en marcha el libro de ${apodo} | Ya está en marcha el libro de ${apodo} |
| primeraLinea.A | Le vamos a escribir a ${apodo} a la hora que elegiste. A vos te avisamos por WhatsApp. | Le vamos a escribir a ${apodo} a la hora que elegiste. A ti te avisamos por WhatsApp. |
| primeraLinea.B | El primer mensaje te llega a tu WhatsApp. La primera pregunta sale cuando estén juntos. | El primer mensaje te llega a tu WhatsApp. La primera pregunta sale cuando estéis juntos. |
| enTuPanel | En tu panel vas a ver todo lo que cuenta. Ahí también podés escribir hasta tres preguntas tuyas para el libro. | En tu panel vas a ver todo lo que cuenta. Ahí también puedes escribir hasta tres preguntas tuyas para el libro. |

---

## `web/src/app/_textos/pedido-confirmado.ts` · `CONFIRMADO_KIDS`

«Mientras cuenta» y «Al terminar» son los de la biografía y ya existen en `CONFIRMADO.es`; hoy `momentosKids` toma `CONFIRMADO.ar` y en España tendría que tomar `es`.

| ID o clave | Rioplatense (aprobado) | España (tú) |
|---|---|---|
| canalA («Antes») | A la hora que elegiste le llega a ${apodo} un mensaje nuestro por WhatsApp. Avisale que le va a escribir «Vitácora». | A la hora que elegiste le llega a ${apodo} un mensaje nuestro por WhatsApp. Avísale de que le va a escribir «Vitácora». |
| canalB («Hoy») | Te llega un mensaje nuestro a tu WhatsApp. La primera pregunta sale cuando toquen el botón, juntos. | Te llega un mensaje nuestro a tu WhatsApp. La primera pregunta sale cuando pulséis el botón, juntos. |

---

## `web/src/app/_textos/checkout-kids.ts` · lo que faltaba de España

La sección `es` de las tres pantallas (COMPRA-1 a COMPRA-3, errores, «Próximamente», resumen) está completa, con las mismas claves que `ar`. Solo faltaban estos dos, que están fuera del diccionario y solo en vos.

| ID o clave | Rioplatense (aprobado) | España (tú) |
|---|---|---|
| KIDS_MISMO_NUMERO | El WhatsApp de quien lo cuenta tiene que ser distinto del tuyo. Si las preguntas te llegan a vos, elegí «Lo hago yo». | El WhatsApp de quien lo cuenta tiene que ser distinto del tuyo. Si las preguntas te llegan a ti, elige «Lo hago yo». |
| KIDS_IMPRESO.impresoDetalle | El mismo libro, impreso y encuadernado, y también en PDF. El envío está incluido. Te avisamos cuando salga de imprenta y te mandamos el seguimiento. | igual (es la de la casa en `es` sin «con su voz») |
| KIDS_IMPRESO.digitalDetalle | PDF para leer en cualquier pantalla. | igual (es la de la casa en `es` sin «Su voz») |

---

## `fabrica/src/escritor-kids/produccion/mails.ts` · los dos mails del libro al padre (solo lectura, otro worktree)

| ID o clave | Rioplatense (aprobado) | España (tú) |
|---|---|---|
| revisar.asunto | El libro de ${apodo} está para que lo revises | igual |
| revisar.parrafos 1 | Ya escribimos el libro de ${apodo} con lo que contó. Entrá a tu panel y leelo. | Ya hemos escrito el libro de ${apodo} con lo que contó. Entra en tu panel y léelo. |
| revisar.parrafos 2 | Si está bien, aprobalo desde ahí. | Si está bien, apruébalo desde ahí. |
| revisar.boton | Ver el libro | igual |
| libro_listo.asunto | El libro de ${apodo} está listo | igual |
| libro_listo.parrafos 1 | Ya está. El libro de ${apodo}, con sus palabras y con sus audios para escuchar desde los códigos del libro. | igual |
| libro_listo.parrafos 2 | Queda en tu panel para leerlo o descargarlo cuando quieras. | Se queda en tu panel para leerlo o descargarlo cuando quieras. |
| libro_listo.boton | Ver el libro | igual |
| pie del mail | En cada familia hay un libro sin escribir. | igual |

---

## `fabrica/src/escritor-kids/salida/html.ts` · `TEXTOS_KIDS`, los textos fijos del libro (solo lectura, otro worktree)

| ID o clave | Rioplatense (aprobado) | España (tú) |
|---|---|---|
| suVoz | Su voz | igual |
| suVozBajada | Estas respuestas están también en audio, tal como las dijo. Apuntá el teléfono al código y la escuchás. | Estas respuestas están también en audio, tal como las dijo. Apunta el móvil al código y la escuchas. |
| escuchala | Escuchala | Escúchala |
| altQr | Código para escuchar esta respuesta | igual |
| marca | VITÁCORA | igual |
| apertura de parte (en el código) | Parte Uno / Dos / Tres / Cuatro | igual |

---

## `entrevistador/src/kids-v2/padre.ts` · `TEXTO_AL_PADRE` (solo lectura, otro worktree)

| ID o clave | Rioplatense (aprobado) | España (tú) |
|---|---|---|
| TEXTO_AL_PADRE | Este número es para las preguntas de {apodo}. Lo que cuenta lo ves en tu panel. | igual |

---

## Cambios que no son solo de vos a tú

Lo que cambia una referencia o el sentido, para que Naza lo mire aparte.

| Dónde | Rioplatense | España | Por qué |
|---|---|---|---|
| PANEL-GUIA ejemplo 1 | andar en bici sin rueditas | montar en bici sin ruedines | En España se dice «montar en bici» y las rueditas son «ruedines». |
| PANEL-GUIA ejemplo 2 | comiendo un choclo | comiendo una mazorca | «Choclo» no se entiende en España. |
| PANEL-GUIA ejemplo 3 | en lo de un amigo | en casa de un amigo | «Lo de» no existe en España. |
| KP-ESTADO-TERMINO | Ahora empieza el armado del libro. | Ahora empezamos a preparar el libro. | «Armado» suena rioplatense. Misma idea, sin prometer tiempos. |
| KP-TOCO, KP-ESTADO-ESPERA-A/B, canalB | tocar (un botón) | pulsar | En España los botones se pulsan. «Toca una para escucharla» (KV-BAJADA) sí queda con «tocar», porque es tocar la pantalla. |
| mail de acceso, asunto | Listo, ya está en marcha… | Ya está en marcha… | «Listo» como arranque es rioplatense; «Pedido confirmado» en `es` ya usa «Ya está». |
| canalA de «Pedido confirmado» | Avisale que le va a escribir | Avísale de que le va a escribir | Igual que el «Avisa a ${n} de que» que ya está en `CONFIRMADO.es`. |
| suVozBajada del libro | Apuntá el teléfono | Apunta el móvil | «Móvil», como en toda la web de España. |
| KP-ERR-CORR-VACIO | Completá | Rellena | En España los campos se rellenan. |
| escuchala (voz-kids y libro) | Escuchala | Escúchala | La forma sin tilde es voseo; en España lleva tilde. |

## Dudas

1. **Lo que el chico recibe sigue en vos.** El motor de Kids solo habla rioplatense. Un padre de España va a leer su panel en tú y, debajo, las preguntas y los botones que recibió el chico en vos («Dale, vamos», «Esta pregunta te la manda tu mamá…», los títulos de las partes). Aquí se citan tal cual porque son lo que el chico ve de verdad. Si Kids se vende en España, hay que decidir si el banco del motor se adapta también (como se hizo con la entrevista V3, `banco-es-ES.md`). Hasta entonces, la pantalla en tú va a mostrar algo en vos.
2. **«Quién se lo regala» se guarda en vos.** La compra de España muestra «Tu madre», «Tu padre» pero guarda «tu mamá», «tu papá» para el motor (`lib/kids.ts`). Por eso KP-PREG-CON-LINEA en España también va a decir «te la manda tu mamá». Misma decisión que la duda 1.
3. **Qué bloque toman los textos compartidos.** El mail de acceso de Kids, `momentosKids` y HORA/TEMAS del panel hoy leen el bloque `ar` a mano (`TEXTOS_MAIL.ar`, `CONFIRMADO.ar`, `CHECKOUT_KIDS.ar`). Para España tendrían que leer `es` según la región. Es código, no texto; lo anoto para quien lo cargue.
4. **`padre.ts` no sabe la región.** El entrevistador contesta al padre con un solo texto y no mira si es de España. El texto queda igual en los dos, así que hoy no hace falta, pero si algún día cambia, hay que pasarle la región.
5. **Lo que no está en estos archivos y también es rioplatense o neutro:** el subtítulo de la tapa «Capítulo Uno: {edad} años» y el álbum «Mis cosas a los {edad}» (`libro-md.ts`) suenan igual en España y no necesitan cambio. Los títulos de las piezas y de las partes vienen del escritor y del banco, en vos.
6. **«Pasar» una pregunta.** En la web de España ya conviven «la pasa» (landing) y «la salta» (compra). Aquí dejé «la puede pasar» (PANEL-GUIA p4) para no cambiar lo aprobado. Si Naza prefiere unificar, es «saltar».
