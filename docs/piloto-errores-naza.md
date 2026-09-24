# Piloto del biógrafo v2 — errores y cosas raras (narrador: Naza)

> Naza se entrevista a sí mismo con la puerta manual v2 (`entrevistador/scripts/manual-v2.ts`).
> Regla: en el piloto se **anota**, la revisión va después. Solo se arregla en caliente lo que no
> deja seguir, y se anota igual.
>
> Narrador del piloto: `ea17b848-760a-416a-935c-51f186c7b0ef` (nombre "Naza", teléfono falso
> `+manual-naza-piloto`, estado `pausado` a propósito). Los comandos se corren con ese id.

## N1 · 24/09 · `empezar naza` choca con el narrador real de Naza
- **Qué pasó:** `npm run manual-v2 -- empezar naza` cortó con «Tricky ya tiene 1 respuestas del
  flujo viejo… Usá otro nombre (--nombre)». "naza" coincide con el narrador **real** de Naza
  (`dd3242de…`, nombre "Naza", le dicen "Tricky", `activo`, teléfono real) por el campo `nombre`.
  Si ese narrador no hubiera tenido respuestas, `empezar` lo tomaba y lo pasaba a `pausado`: se
  apropiaba de un narrador de producción.
- **Dónde:** `entrevistador/scripts/manual-v2.ts` — `buscarNarrador` (busca por id, después por
  `como_le_dicen`, después por `nombre`, sin mirar el teléfono `+manual-`) y `empezar` (reusa la
  fila que encuentre). Además el mensaje del error miente: `--nombre` no alcanza, porque la
  búsqueda va por la referencia (`naza`), no por el nombre.
- **Qué se hizo a mano:** `empezar naza-piloto --nombre "Naza"` → narrador nuevo `ea17b848…`. Todo
  el piloto se corre con el id, porque `naza` sigue siendo ambiguo (hoy resuelve al del piloto por
  `como_le_dicen`, pero depende del orden de búsqueda). El comando sigue imprimiendo
  `cargar naza …` como instrucción.
- **Para la revisión:** `empezar` (y `buscarNarrador` en general) solo debería reusar filas con
  teléfono `+manual-…`.

## N2 · 24/09 · La presentación dice «la/lo trate»
- **Qué pasó:** sin ficha, la presentación pregunta «¿prefiere que la/lo trate de usted o de
  vos?». Con una barra en el medio suena a formulario, no a una persona.
- **Dónde:** el texto de la presentación (orden 0), `docs/biografo-v2-textos-para-aprobar.md`.
- **Qué se hizo a mano:** nada; se mandó así.

## N3 · 24/09 · La presentación no dice quién le regaló el libro ni lo nombra
- **Qué pasó:** la presentación arranca «Buen día. Me presento: soy quien va a escribir el libro
  de su vida». No usa el nombre del narrador (que está cargado) y no dice quién le hace el regalo.
  Naza quiere la estructura de antes, justo en la apertura: «Buen día, <nombre>. Soy su biógrafo;
  <quien regala> le regaló este libro. Cada mañana, o cuando me responda, le voy a ir preguntando…»
  y recién después el resto (cómo contestar, las tres preguntas).
- **Dónde:** el encargo/prompt de la presentación (orden 0) en el entrevistador v2
  (`docs/biografo-v2-textos-para-aprobar.md`, sección de la presentación). Comparar con la
  presentación del flujo v1, que sí nombraba a quien regala.
- **Qué se hizo a mano:** nada; se mandó así.

## N4 · 24/09 · El perfil calcula mal el año de nacimiento
- **Qué pasó:** con «tengo 27 años» (entrevista en 2026) el perfil guardó `anioNacimiento: 1997 o
  1998 (deducido)`. La cuenta da 1998 o 1999. Queda corrido un año, y de ese dato salen las
  edades de las etapas y la línea de tiempo.
- **Dónde:** la ficha/perfil que se actualiza en `cargar` (orden 0), lo imprime el bloque «Perfil».
  El modelo hace la cuenta: no se le pasa el año actual, o no se calcula en código.
- **Qué se hizo a mano:** nada.

## N5 · 24/09 · La pregunta 1 lo llama «Triki» y juega con el nombre
- **Qué pasó:** en la presentación Naza dijo que la familia le dice Naza y los amigos Triki (su
  nombre de artista). La pregunta 1 (casa de la infancia) arranca «Dale, Triki…» y agrega «esa
  donde eras Naza». Elige el nombre de los amigos para un libro familiar y hace un juego de
  palabras con los dos nombres. Es una suposición y suena armado.
- **Dónde:** pregunta 1 (`casa-infancia`), el encargo de la pregunta v2 (cómo elige el nombre
  cuando `comoLeDicen` trae más de uno).
- **Qué se hizo a mano:** nada; se mandó así.

## N6 · 24/09 · El perfil no aprende de una respuesta larga: el JSON se corta (ARREGLADO EN CALIENTE)
- **Qué pasó:** con la respuesta 1 (casa de la infancia, 106 s: Martínez, padres, dos hermanos,
  dos perros) `cargar` dijo «⚠ El perfil no se entendió (salida ilegible): queda como estaba».
  Con `--reprocesar` pasó lo mismo. En `consumo_ia` las dos llamadas `v2-perfil` salieron con
  `output_tokens: 2000` justos: el modelo llegó al tope y el JSON quedó cortado. El comando sigue,
  pero el perfil se queda sin nada de lo contado y el piloto no mide lo que tiene que medir. Es el
  mismo bug que ya se había arreglado en las adaptativas v1 («con 2000 el JSON no entraba»).
- **Dónde:** `entrevistador/src/ia/perfil.ts` (`actualizarPerfil`, `max_tokens: 2000`).
- **Qué se hizo:** con el OK de Naza, `max_tokens` pasa a 8000 (solo se paga lo que se escribe),
  con test en `test/perfil.test.ts` (falla con 2000, pasa con 8000; suite 553/553, tsc limpio).
  Después, `cargar … --reprocesar --orden 1`. Las dos corridas fallidas costaron ~USD 0,15.
- **Para la revisión:** que `cargar` diga *por qué* no se entendió (tope alcanzado vs. JSON
  roto), y revisar los otros `max_tokens` del v2 con respuestas largas.

## N7 · 24/09 · La pregunta 2 suena a formulario («la habitaste»)
- **Qué pasó:** «¿hasta qué edad la habitaste? Contame el recorrido de casas que vino después: en
  qué barrio o ciudad cada una, con quién viviste y hasta cuándo.» Dice «habitaste», que nadie usa
  en rioplatense, y pide cuatro datos por casa, como un formulario. Sigue diciéndole «Tricky»
  (N5), aunque ahora con la ortografía corregida.
- **Dónde:** pregunta 2 (`mapa-casas`), encargo de la pregunta v2 / tema del NUCLEO.
- **Qué se hizo a mano:** nada; se mandó así.

## N8 · 24/09 · El mapa de casas quedó a medias y la evaluación dijo «alcanza»
- **Qué pasó:** la pregunta 2 pedía el recorrido de casas. Naza contó una sola mudanza (Martínez →
  calle Paraná, a los 10-11, con la madre y el hermano mayor; el padre y el hermano del medio
  ausentes por problemas legales). No dijo hasta cuándo vivió ahí ni qué casas vinieron después.
  La evaluación dio `suficiente: true` y la secuencia pasó a otro tema. Puede estar bien (la
  respuesta fue fuerte, `hoyFueFuerte`), pero el mapa de casas es la columna de la línea de tiempo
  y quedó incompleto. Hay que ver si el perfil lo anota en `noSabemos` y si vuelve más adelante.
- **Lo bueno:** entendió que «Paraná» es una calle de Martínez y no la ciudad.
- **Dónde:** evaluación v2 (`src/ia/evaluar-v2.ts`) sobre `mapa-casas`.
- **Qué se hizo a mano:** nada.

## N9 · 24/09 · «Gracias por contarme lo de ayer» cuando fue hace minutos
- **Qué pasó:** la pregunta 3 abre con «lo de ayer». En el piloto rápido no pasa un día entre
  preguntas, así que es un efecto del piloto. Igual conviene que el texto no suponga el tiempo que
  pasó: en producción alguien puede contestar dos preguntas el mismo día.
- **Dónde:** pregunta 3 (`mapa-capitulos`), el tacto después de `hoyFueFuerte` en el encargo de
  la pregunta v2.
- **Qué se hizo a mano:** nada.

## N10 · 24/09 · Errores de transcripción en la respuesta 3
- **Qué pasó:** la transcripción de la respuesta 3 (239 s) trae «Gardo Rocha» (casi seguro el
  colegio *Dardo Rocha*), «Viví a sol» (*solo*) y «tuvimos que llamarnos a menos» (*venirnos a
  menos*). El perfil ya copió «llamarse a menos» en una bisagra. Si nadie lo corrige, llega así al
  libro, y el lector final solo lo agarra si escucha el audio.
- **Dónde:** transcripción (OpenAI) → perfil (bisagra de los 8 años).
- **Qué se hizo a mano:** nada. Queda para la revisión: ¿le pasamos al transcriptor una lista de
  nombres propios del perfil (colegios, barrios) como pista?

## N11 · 24/09 · La pregunta 4 vuelve a la mudanza dura en vez de a lo que abrió la 3
- **Qué pasó:** la respuesta 3 abrió capítulos grandes (Saint John's → Fátima, el Liceo Naval,
  la facultad y la música, España). La pregunta 4 (`un-lugar`) vuelve a «el primer día en la casa
  de Paraná», que es el momento en que el padre y el hermano faltaban por problemas legales
  (`hoyFueFuerte` de la respuesta 2), y pide detalle de ese día. No es un error, pero se puede
  discutir el tacto: la pregunta 3 había prometido «algo más liviano».
- **Dónde:** secuencia/pregunta v2 (`un-lugar`, puerta abierta que eligió el perfil).
- **Qué se hizo a mano:** nada; se mandó así.

## N12 · 24/09 · La pregunta 5 necesitó 3 intentos y no dice qué control la frenó
- **Qué pasó:** `siguiente` imprimió «Intentos: 3 · pasó los controles», sin decir qué rechazó los
  dos primeros (trato, largo, lugar, supuestos). Esa pregunta sola costó ~USD 0,15, contra ~0,02 de
  una normal. Para revisar el piloto hace falta ver los rechazos.
- **Dónde:** `scripts/manual-v2.ts` (`siguiente`, la línea de intentos) y los controles de
  `src/ia/control-pregunta.ts`.
- **Qué se hizo a mano:** nada.

## N13 · 24/09 · Tres preguntas duras seguidas
- **Qué pasó:** la respuesta 4 volvió a salir `hoyFueFuerte` (el padre «se había ido a Brasil»).
  La pregunta 5 (`pruebas`) agradece y va directo a otro momento duro: el día que pidió salir del
  Liceo Naval porque sufría. Van la 2 (mudanza por problemas legales), la 4 (el primer día en
  Paraná) y la 5 (el Liceo), todas en lo difícil. El «si te copa» ayuda, pero el tacto de §5 dice
  «algo más liviano después de algo fuerte», y la 3 lo prometió.
- **Dónde:** secuencia v2 + la `puertaAbierta` = `pruebas` que eligió el perfil; el encargo de la
  pregunta (tacto después de algo fuerte).
- **Qué se hizo a mano:** nada; se mandó así.

## N14 · 24/09 · La pregunta 6 otra vez con 3 intentos, «ayer», y «esos amigos» sin decir cuáles
- **Qué pasó:** «Tricky, gracias por bancar el relato de ayer, no era poca cosa. Hoy algo más
  tranqui: de todos esos amigos, ¿quiénes quedaron hasta hoy?…».
  - De nuevo «Intentos: 3» sin motivo (N12 se repite: ~USD 0,18 esta pregunta).
  - De nuevo «ayer» (N9).
  - «bancar el relato» suena raro: el que lo bancó fue él al contarlo.
  - «esos amigos» no dice cuáles: podrían ser los del Fátima, los del Liceo o Joaquín. Queda
    colgado.
- **Lo que dice Naza:** está rara de redacción. Tendría que nombrar la etapa y preguntar
  simple, por ejemplo: «De los amigos de la etapa escolar, ¿te quedó alguno? ¿Quiénes?», y
  recién después pedir el día concreto.
- **Lo bueno:** el perfil entendió que Joaquín es un amigo del Liceo al que Naza llama «mi
  hermano», no un hermano de sangre. También notó la contradicción de quién estaba cuando lo
  sacaron del Liceo, sin inventar.
- **Dónde:** pregunta 6 (`amigos`), encargo de la pregunta v2.
- **Qué se hizo a mano:** nada; se mandó así.

## N15 · 24/09 · El perfil decide quién fue echado del Fátima con él
- **Qué pasó:** en la respuesta 6 Naza cierra con «nos tuvimos que ir del colegio, el Isho,
  Cianito y yo». No se entiende quién es «el Isho» (¿otro amigo? ¿«Tincho» mal transcripto?). El
  perfil escribió en la bisagra que los echaron a él, a Ciano **y a Juan Arbizu**, pero Arbizu era
  el compañero al que le quería mostrar el cuchillo, y Naza no dijo que lo echaran. Además la
  transcripción trae el mismo amigo como «Martín Ricci», «Tincho Richie» y «Ciano/Cianito»: el
  perfil pasó de 7 a 13 personas y puede tener duplicados.
- **Dónde:** transcripción + perfil (bisagra de los 12-13, lista de personas).
- **Qué se hizo a mano:** nada. Para la revisión: cuando un dato es ambiguo, que el perfil lo deje
  en `noSabemos` en vez de elegir.

## N16 · 24/09 · Con un narrador joven, los amigos merecen más que una pregunta
- **Qué pasó:** en la respuesta 6 Naza nombró a muchos amigos (Saint John's, Fátima, Liceo) y dijo
  que con Joaquín en el Liceo «habremos pasado mil quinientas anécdotas… ahora no se me viene».
  La evaluación dio `suficiente: true`, sin repregunta, y la secuencia siguió a otro tema
  (`por-gusto`). Naza dice que el biógrafo tendría que darse cuenta de que con alguien de 27 años
  los amigos son una parte central de la vida y conviene pedir más anécdotas: una repregunta
  («¿alguna con Joaquín en el Liceo que te acuerdes ahora?») o que el tema vuelva más adelante
  con otro amigo.
- **Dónde:** evaluación v2 (`src/ia/evaluar-v2.ts`: ¿sabe la edad y le da peso?) y la secuencia /
  variables (¿cuánto espacio le da a «amigos» según el tramo de vida?).
- **Qué se hizo a mano:** nada.

## N17 · 24/09 · Pregunta un tema que había dado por cubierto (`var-juventud-1`)
- **Qué pasó:** después de la respuesta 3 el perfil marcó `cubiertos: var-infancia-1,
  var-juventud-1`. En la respuesta 7 eligió `puertaAbierta: var-juventud-1`, y la pregunta 8 salió
  con ese id (el primer día de vuelta en el Fátima). Puede ser que el plan de variables se rearmara
  (8 → 11 → 13 → 14 → 15) y el id se reusara para otro tema, o que un tema cubierto vuelva a la
  lista. Sea cual sea, un id no debería significar dos cosas distintas.
- **Lo bueno:** la pregunta en sí está bien: engancha con algo que él contó y no lo repite.
- **Se repite:** la pregunta 18 sale con `var-infancia-1` (el primer día en el Fátima), el otro id
  que se había dado por cubierto después de la respuesta 3. Ya son tres casos (N17, N28 y este).
  Los ids de variables se reusan cuando el plan se rearma.
  Cuarto caso: la pregunta 19 sale con `var-infancia-2`, cubierto después de la respuesta 4.
  Encima pide «una tarde con los perros», cuando de Corcho Naza había dicho «era muy bebé».
  Ya van 3 preguntas seguidas (16, 17, 19) sobre la casa de Martínez y la familia de la
  infancia.
  Quinto caso: la pregunta 20 sale con `var-infancia-3`, cubierto después de la respuesta 7. Esta
  vez el tema es nuevo (el campo de los fines de semana), así que el id cubierto no se repite en
  contenido. Confirma que el id se reusa para otro tema.
- **Dónde:** `planSiHaceFalta` / `aplicarPerfil` (secuencia v2) y los ids de las variables.
- **Qué se hizo a mano:** nada.

## N18 · 24/09 · La entrevista no se achica: van 9 preguntas y siguen quedando 28
- **Qué pasó:** «Quedan N pendientes» fue 28 → 27 → 26 → 28 → 28 → 27 → 27 → 27 → 28, con 9
  preguntas hechas. Cada respuesta rica agrega variables (0 → 8 → 11 → 13 → 14 → 15 → 16) más
  rápido de lo que se cubren. A este ritmo la entrevista pasa las 37 preguntas. Hay que ver si el
  techo de 19 variables frena, o si el tope de 40 va a ser el que corte. También para costos: van
  ~USD 2,3 en 9 preguntas.
- **Dónde:** plan de variables (`planSiHaceFalta`) y la secuencia v2.
- **Qué se hizo a mano:** nada.
- **Además:** la pregunta 9 vuelve a decir «ayer» (N9) y «de pasada», cuando Naza contó que fueron
  dos años de novios.

## N19 · 24/09 · La pregunta 10 supone que la pareja actual es mujer y que es «para quedarse»
- **Qué pasó:** «¿Cómo **la** conociste… y qué fue lo que te hizo decir "con **esta** me quedo"?».
  Naza dijo solamente «ahora mismo estoy de novio», sin nombre ni género. La regla 4 del perfil
  dice que de la pareja, si no lo dijo, no se sabe. Las novias anteriores eran mujeres, pero el
  género de la pareja actual es una suposición, y «con esta me quedo» supone además un compromiso
  que él no mencionó. El control de supuestos no lo agarró. Otra vez dice «ayer» (N9).
- **Dónde:** pregunta 10 (`con-quien-hizo-su-vida`), encargo de la pregunta v2 + control de
  supuestos (`src/ia/control-pregunta.ts`, que mira hijos/pareja/nietos pero no el género ni el
  compromiso).
- **Qué se hizo a mano:** nada; se mandó así.

## N20 · 24/09 · El perfil no anotó a Sima, la pareja actual
- **Qué pasó:** en la respuesta 10 (dos audios unidos, 83 s) Naza dijo que su novia se llama Sima,
  que es catalana de Avià, que tiene 42 años y que quiere hijos, y que él la ama pero se guía por
  sus metas. El perfil solo actualizó `dondeViveHoy` (Berga). No agregó a Sima a las personas (el
  bloque no imprimió «personas: 22 → 23») ni el dato de la diferencia de edad o de los hijos. Si no
  está en el perfil, el libro y las preguntas que vienen no la conocen.
- **Dónde:** perfil (`actualizarPerfil`), respuesta de la orden 10. Hay que ver en `estado` si
  quedó algo.
- **Después, con la repregunta:** se llama **Ima**. «que es Sima» era «que es Ima», un error de
  transcripción. La bisagra nueva ya dice Ima (club cannábico, la inmobiliaria, la fiesta del
  pueblo, un año y medio en Berga, lo que desmiente el «recién llegado» de N21), pero la lista de
  personas sigue sin moverse: Ima no está como persona.
- **Qué se hizo a mano:** nada.

## N21 · 24/09 · La repregunta supone que él llegó hace poco a Berga
- **Qué pasó:** «Sima, catalana de Avià, y vos **recién llegado** de Argentina a Berga». Naza no
  dijo cuándo llegó ni si la conoció apenas llegó. Además la repregunta está bien pedida (la
  pregunta 10 era «cómo la conociste» y no lo contó), pero la arma sobre una suposición.
- **Dónde:** evaluación v2 (la repregunta no pasa por el control de supuestos, o el control no lo
  ve).
- **Qué se hizo a mano:** nada; se mandó así.

## N22 · 24/09 · La pregunta 11 abre con «Ima, anotado.» y pide tres cosas
- **Qué pasó:** «Ima, anotado. Tricky, contaste que…». Arrancar con el nombre de la novia suena a
  que le habla a ella. Además pide tres cosas (cómo arrancó con Ciano, cuándo dijo «a esto le
  dedico la vida», un día concreto de laburo). Salió al segundo intento, sin decir qué control la
  frenó (N12).
- **Dónde:** pregunta 11 (`oficio`), encargo de la pregunta v2 (el acuse de lo que corrigió el
  narrador).
- **Qué se hizo a mano:** nada; se mandó así.

## N23 · 24/09 · Nombres artísticos mal transcriptos (respuesta 11)
- **Qué pasó:** «Seven Kane» (seguramente *Seven Kayne*), «Kea» (*KHEA*), «Midel», «Denk Studio»:
  son nombres de artistas y lugares que el transcriptor no conoce. El perfil los copió tal cual.
  Es el mismo problema que N10: para el libro, una lista de nombres propios que Naza confirme.
- **Lo bueno:** Naza dijo que dejó la facultad cuando tuvo «una salida económica… de otra cosa».
  El perfil no inventó qué era, y la pregunta 12 (primer trabajo) no lo presiona sobre eso.
- **Dónde:** transcripción → perfil (bisagras de la música).
- **Qué se hizo a mano:** nada.

## N24 · 24/09 · Un id de variable con espacio: `var-adulto joven-1`
- **Qué pasó:** después de la respuesta 12 el perfil marcó `cubiertos: var-adulto joven-1`. El id
  se arma con el nombre del tramo («adulto joven»), que tiene un espacio. Por ahora no rompe nada,
  pero un id con espacio se puede partir en cualquier lado donde se tome como palabra (comandos,
  logs, `split`).
- **Lo bueno:** la respuesta 12 habló de «ciertos negocios que estaban un poco mal» antes de
  España. El perfil no lo puso en la bisagra y la repregunta fue a la fábrica de neulas, que es la
  escena concreta. Buen tacto.
- **Dónde:** armado de ids de variables en la secuencia v2.
- **Qué se hizo a mano:** nada.

## N25 · 24/09 · La pregunta 13 supone que alguien lo esperaba en Berga
- **Qué pasó:** «¿con qué llegaste encima, **quién te esperaba ahí** y dónde dormiste esa primera
  noche?». Naza nunca dijo que alguien lo esperara. Es un supuesto chico, pero de la misma familia
  que N19 y N21. Además la pregunta va al día de llegada sin haber preguntado nunca **por qué** se
  fue a España, que es la bisagra más grande de su vida adulta.
- **Dónde:** pregunta 13 (`var-adulto joven-2`), control de supuestos.
- **Qué se hizo a mano:** nada; se mandó así.
- **Después:** esta vez el supuesto salió bien (a Naza lo esperó Iñaki, «Babyface», en el
  aeropuerto), y la respuesta contó igual el porqué de España sin que se lo preguntaran. La
  observación de N25 sigue valiendo: acertar de casualidad no es lo mismo que preguntar.

## N26 · 24/09 · El tramo «hoy» se imprime como «27-27 años»
- **Qué pasó:** la pregunta 14 salió como `var-hoy-1 (hoy, 27-27 años)`. Es un detalle de
  impresión (el tramo «hoy» de alguien de 27 arranca y termina en 27), pero en un narrador joven el
  tramo «adulto joven» (23-27) y «hoy» (27) se pisan. Hay que ver si eso duplica variables del
  mismo período.
- **Dónde:** `RANGO_TRAMO` / armado de tramos por edad en la secuencia v2.
- **Qué se hizo a mano:** nada.

## N27 · 24/09 · El perfil inventa que Ciro le enseña a programar
- **Qué pasó:** Naza dijo «acá en la casa ahora mismo está el profe, que es Ciro, un amigo
  argentino». El perfil escribió la bisagra «se puso a programar, **aprendiendo con Ciro**, un amigo
  argentino que le hace de profe». «El profe» puede ser un apodo. Que le enseñe a programar es una
  deducción que se guardó como hecho.
- **Dónde:** perfil (bisagra de los 27).
- **Qué se hizo a mano:** nada.

## N28 · 24/09 · La pregunta 15 vuelve a «los primeros días en Berga» y otra vez un id cubierto
- **Qué pasó:** la pregunta 13 ya fue «el día que pisaste Berga». La 15 es «los primeros días ahí:
  cómo consiguieron esa casa, cómo se repartieron el laburo y la guita, qué hacían un domingo». Es
  el mismo período, y otra vez con tres preguntas en una. La `puertaAbierta` fue
  `var-adulto joven-1`, que el perfil había dado por cubierto después de la respuesta 12 (N17 de
  nuevo: el mismo id vuelve). Con esta pregunta llegó también el primer objeto (orden 101, tramo
  «hoy»), en un segundo mensaje.
- **Dónde:** secuencia v2 (ids de variables, N17/N26), pregunta 15.
- **Qué se hizo a mano:** nada; se mandaron las dos.
- **Aviso del handoff:** la foto del objeto no entra por la puerta manual v2. Se sube desde el
  panel de la web (tabla `fotos`). Por CLI solo entra el audio con `--orden 101`.

## N29 · 24/09 · En el objeto, la evaluación escribe una repregunta y después la tira
- **Qué pasó:** la respuesta al objeto 101 fue «de esa época acá en Berga no tengo nada». La
  evaluación devolvió `suficiente: false` con una buena repregunta (la valija, qué dejó en
  Argentina, una caja en lo de sus viejos). Enseguida el comando dijo «es la respuesta a una
  repregunta o a un objeto: no se repregunta» y la descartó. Se pagó una repregunta que no se usa.
  O el objeto no se evalúa, o esa repregunta vale y se manda.
- **Dónde:** `scripts/manual-v2.ts` (`procesar`, la evaluación corre antes de mirar si es objeto).
- **Qué se hizo a mano:** nada.

## N30 · 24/09 · «Te mando una foto» en una respuesta normal
- **Qué pasó:** en la respuesta 15 Naza dice «te mando una foto» (de la casa vacía de Berga). En
  WhatsApp de verdad esa foto llegaría y hoy no hay dónde ponerla, fuera del objeto. En el piloto
  no hay comando para fotos (se suben desde el panel).
- **Dónde:** puerta manual v2 / flujo de fotos.
- **Qué se hizo a mano:** nada.

## N31 · 24/09 · El objeto 102 cita mal lo que dijo y llega pegado al anterior
- **Qué pasó:** «ya me dijiste que **de la infancia** no guardaste nada». Naza dijo que de la época
  de **Berga** no tiene nada, y el objeto 101 tampoco era de la infancia (era del tramo «hoy»).
  Además llegó un segundo objeto (102, adulto joven) en la pregunta siguiente, justo después de
  que dijo que no tenía nada: dos pedidos de objeto seguidos. La pregunta 16 y el objeto 102
  salieron al segundo intento, sin decir por qué (N12). Esa tanda costó ~USD 0,40.
- **Dónde:** secuencia v2 (reparto de objetos por cambio de tramo) + texto del objeto.
- **Qué se hizo a mano:** nada; se mandaron las dos.

## N32 · 24/09 · Objeto 102: la corrección del nombre no entra y las fotos quedan afuera
- **Qué pasó:** en el audio del objeto 102 (19 s) Naza corrige: el estudio se escribe **con G**
  (la transcripción puso «Leng Studio»; antes «Denk Studio»), y los shows «con Bear» eran los shows
  con Baby. La transcripción además puso «verde» por *Bear*. El perfil quedó «sin cambios»: no tomó
  la corrección del nombre. Después mandó **6 fotos** (WhatsApp Image 04.15.48/49), que no entran
  por la puerta manual v2. La evaluación armó otra repregunta buena («elegime una sola: dónde fue,
  quién estaba…») y la descartó (N29 otra vez).
- **Dónde:** perfil sobre respuestas de objeto; flujo de fotos (N30); `procesar` (N29).
- **Qué se hizo a mano:** nada. Las fotos siguen en Downloads. Si Naza quiere que cuenten para el
  libro, se suben desde el panel de la web.

## N33 · 24/09 · «Siento que esto ya te lo respondí»
- **Qué pasó:** la respuesta 16 (padres, 38 s) es corta y cierra con «No, siento que esto ya te lo
  respondí». La casa de tres pisos, el padre cocinando y la madre ya estaban en la respuesta 1. La
  pregunta volvió sobre lo mismo y el narrador lo notó. La evaluación dio `suficiente: true`, sin
  registrar la queja ni el cansancio (la evaluación v2 dice que «sabe del cansancio»), y la puerta
  abierta que quedó es `con-quien-crecio`, otra vez sobre la misma casa y la misma gente. Además
  «estuve mucho ausente» se refiere seguro al padre (la transcripción o el habla lo cambió de
  persona).
- **Dónde:** secuencia v2 (el tema `padres` después de que la respuesta 1 ya lo cubrió: el perfil
  no marcó `padres` en `cubiertos`), evaluación v2 (el cansancio y el «ya te lo dije»).
- **Qué se hizo a mano:** nada.

## N34 · 24/09 · Bisagra repetida: el cambio de colegio a los 8 queda dos veces
- **Qué pasó:** con la respuesta 18 el perfil agregó una bisagra nueva «A los 8 aproximadamente
  pasó del Saint John's al Fátima…». Ya existía una de la respuesta 3 («A los 8 aproximadamente
  tuvo que dejar el Saint John's…»). No corrigió la vieja (la que decía «no sabía por qué»): puso
  otra al lado, contra la regla 11 del prompt. Además escribió «de grande sabe que también pesaron
  los problemas de la familia». Naza dijo «era una de las razones», sin nombrar la familia: eso es
  deducción guardada como dicho.
- **Dónde:** perfil (`agregarBisagras` no tiene «corregir», solo `sinRepetir` por texto exacto).
- **Qué se hizo a mano:** nada.

## N35 · 24/09 · «Se llamaba Homero», y el perfil sigue diciendo Romero
- **Qué pasó:** en la respuesta 19 Naza corrige: el mastín se llamaba **Homero**, «como Homero
  Simpson» (la transcripción de la respuesta 1 había puesto «Romero»). El perfil: «sin cambios». Es
  la segunda corrección de nombre que no entra (N32, el estudio con G) y la regla 11 del prompt
  pide justamente eso. Además dice por segunda vez «eso creo que ya lo respondí» (N33), respuesta
  corta (34 s), y la evaluación no lo registra como cansancio.
- **Dónde:** perfil (`corregirPersonas`), evaluación v2 (cansancio / repetición).
- **Qué se hizo a mano:** nada.

## N36 · 24/09 · La repregunta del campo vuelve a los años sin el padre
- **Qué pasó:** Naza contó el campo en 43 s («cuando todo estaba normal íbamos todos; muchos años
  fuimos solamente Ariel y mi mamá»). La repregunta eligió justo los años en que el padre y Juan
  Manuel no estaban («llevame a uno de esos días con ellos dos… qué sentías vos ahí»), otra vez el
  período duro (N11, N13), y con «ellos dos» deja afuera que él también iba. La evaluación y la
  repregunta necesitaron 2 intentos cada una (~USD 0,39 esta carga). No dice qué falló.
- **Dónde:** evaluación v2 (repregunta), controles (N12).
- **Qué se hizo a mano:** nada; se mandó así.
