# Bitácora del piloto manual — errores y cosas raras para repasar

> Naza pidió (16/09) anotar TODO lo que salga mal o raro mientras se entrevista a
> los narradores de prueba por la puerta manual, para repasarlo junto al final.
> Una entrada por hallazgo: fecha · narrador · qué pasó · dónde está · qué se hizo.
> No se arregla nada acá; se anota. Los arreglos van a la lista de la revisión final.

## Triage: qué rompe o le saca valor al libro (pedido de Naza, 17/09)

Ordenado de más grave a más suave. El criterio es **el producto final**: ¿el
libro sale mal, sale incompleto, o el cliente se pierde antes de llegar?

### 🔴 Graves — rompen el libro o la venta

| # | Qué | Por qué es grave |
|---|---|---|
| 19 | El narrador pide "esto que no vaya al libro" y nada lo registra | Publicar algo que pidió reservar es la peor falla posible: quiebra la confianza y puede herir a la familia |
| 1 | Trato "usted" por defecto con ficha vacía (y el checkout no pide la ficha) | Un cliente real llega con ficha vacía → preguntas genéricas y trato equivocado desde el día 1; el narrador no siente que lo escuchan |
| 17 | Nombres propios mal transcriptos (NASA/Naza, Herrera/Herrero) | Van directo al texto del libro; un nombre mal escrito de un hijo o un amigo desvaloriza todo el producto. La revisión de nombres del panel es la única red |
| 14 | La evaluación vuelve vacía (2 de 13 veces) y corta el proceso | En el flujo automático es un día perdido: sin repregunta y, según cómo falle, sin avance. Frecuencia demasiado alta para ignorar |
| 34 | Cerrar libro y la muestra arman los capítulos solo con las 4 adaptativas del narrador, no con el guion entero (8) | El libro de Joaquín arrancaba por "Las pruebas" y tenía 4 capítulos; quedó guardado así en `edicion.ordenCapitulos`. **Arreglado el 18/09** (helper `armarGuion`) y el dato de Joaquín limpiado a mano esa noche |
| 35 | El entrevistador hace las tres preguntas de "Los hijos" (19-21) aunque el narrador dijo que no tiene hijos | Joaquín contestó "no tengo hijos" en la 19 y le preguntaron igual "hábleme de cada uno de sus hijos" y "¿cómo fue usted como padre?"; él lo salvó hablando de los hermanos y de cómo lo crió el padre. En un cliente real es dolor gratuito (y peor si no tuvo hijos por una pérdida). **Arreglado el 18/09 (Joaquín)**: al responder una pregunta de «Los hijos» o «El amor», `detectarQueNoTuvo` mira si dijo que nunca tuvo; si sí, no se repregunta sobre eso, se anota `arbol.hijos`/`arbol.conyuge = 'no tuvo'` y las que siguen del capítulo se reemplazan por la regla que ya existía para el árbol cargado al comprar (ahora también para filas propias del guion). Ante la duda, no toca nada. |
| 36 | La fábrica ignora `edicion.titulosCapitulos`: el título que la dueña le pone a un capítulo en el wizard no llega al libro | Joaquín puede renombrar "Los hijos" en el panel y la muestra lo refleja, pero el PDF/HTML, el índice y la intro del audiolibro ("Capítulo 6: Los hijos") salen con el nombre del guion. **Arreglado el 18/09** (`aplicarTitulosCapitulos` en `fabrica/src/libro/edicion.ts`, aplicado en `generar-paquete.ts`) |
| 32 | La fábrica cambió de proyecto Railway sin dejarlo escrito; el viejo sigue vivo-muerto y engaña | Media hora de diagnóstico falso; sin healthcheck, una caída real tampoco se vería |
| 31 | El biógrafo no se despide ni cierra solo al recibir la 30 si la evaluación falla (y en manual nunca sin `cerrar`) | El narrador queda esperando la pregunta 31; la fábrica no arranca; nadie avisa a la familia |
| 28 | Las adaptativas 27-30 no se generan si falla la repregunta de la 26 (y `siguiente` da la entrevista por terminada en 26) | El narrador se queda sin las 4 preguntas hechas a su medida; el libro sale con huecos y nadie se entera |
| 9 | Webhook de Mercado Pago sin verificar firma | Cualquiera que conozca la URL puede marcar pedidos como pagados (libro gratis) |

### 🟠 Medios — el libro sale, pero peor

| # | Qué | Efecto |
|---|---|---|
| 13 | La personalización ancla demasiado en lo ya contado ("la infancia se alarga") | Preguntas repetitivas, el narrador siente que le preguntan lo mismo; menos material nuevo por capítulo |
| 16 | Una corrección posterior no pisa el resumen viejo | El libro puede afirmar algo que el narrador corrigió después |
| 4 | Repregunta en "usted" con trato "vos" | Rompe el vínculo justo en el momento más íntimo (la repregunta va a lo emocional) |
| 18 | Si la personalización falla, la fija sale en "usted" | Mismo efecto: incoherencia de trato a mitad de entrevista |
| 2 | Pregunta 5 mal redactada ("hablemos de atrás") | Una pregunta rara baja la calidad percibida; el narrador responde peor |
| 11, 30 | ¿Las repreguntas se van por las ramas / insisten en lo que el narrador esquivó? | Cansan y pueden incomodar; en un abuelo, insistir en una herida es contraproducente |
| 12 | `crear` no copia el guion al narrador | Desde el panel la familia no puede editar preguntas de ese narrador |
| 20, 22, 23, 24, 27 | Las fijas suponen boda/nietos/hijos/"toda la vida"; el narrador es joven, sin hijos, y la relación terminó — `capituloNoAplica` no se dispara | Preguntas que no aplican incomodan y dan respuestas vacías; el capítulo "El amor" sale flojo |

### 🟡 Suaves — operativos, no tocan el libro

| # | Qué |
|---|---|
| 3 | Respuestas en varios audios: hay que unirlos a mano |
| 25 | Una pregunta reemplazada a mano no queda registrada: el panel/libro muestran la que no se mandó |
| 5 | `guardarRepreguntaEnviada is not a function` (código a medio hacer de la otra sesión) |
| 6 | `siguiente` avanza aunque haya repregunta pendiente |
| 10 | Sufijo del respaldo local desfasado (`dia_05_3` vs `dia_05_2`) |
| 15 | Descarga de WhatsApp de 0 bytes aceptada por `cargar` |
| 7 | Dos sesiones de Claude en el mismo checkout |
| 8 | Producción corría un build viejo (Vercel sin git) |


## Joaquín (narrador de prueba, 28 años, trato vos)

1. **15/09 · trato "usted" por defecto con ficha vacía.** Las preguntas 1-5 salieron
   tratándolo de usted ("cuénteme", "sus viejos... cuando usted era chico"): la
   decisión de trato (`entrevistador/src/ia/trato.ts`) se toma una vez con la ficha y
   la de Joaquín no tenía año de nacimiento → default `usted`. *Hecho*: comando
   `npm run manual -- ficha joaquin --trato vos --nacido 1998 --rehacer` (commit
   1fda4fa, rama `trato-usted-o-vos`). *Pendiente*: que el checkout pida los datos
   de la ficha (ver `docs/ficha-del-narrador.md`) — un cliente real llega vacío.

2. **15/09 · pregunta 5 mal redactada.** La personalización produjo "Joaquín,
   hablemos de atrás. Sus viejos vinieron de algún lado..." — mezcla registro y
   suena forzada. Regenerada con vos quedó bien. *Para repasar*: el prompt de
   `personalizar.ts` con trato usted tiende a frases raras; revisar con ejemplos
   reales cuando haya más narradores.

3. **14-15/09 · respuestas en varios audios.** Joaquín mandó la respuesta 2 en dos
   notas de voz; `cargar` acepta un solo archivo. *Hecho a mano*: `ffmpeg concat`
   antes de cargar. *Pendiente*: que `cargar` acepte varios archivos y los una solo
   (o que el webhook real junte notas seguidas del mismo día).

4. **16/09 · la repregunta salió en "usted" aunque el trato es "vos".** (Las 5 repreguntas del piloto salieron en usted: 5, 19, 22, 23, 25 — la última además con "sus nietos".) Al cargar la
   respuesta 5 el cerebro pidió repregunta (abuelo Roberto) y la escribió de usted:
   "Me quedé pensando en su abuelo... ¿Cómo llegó a usted esa historia...?". El
   trato no llega (o no se respeta) en `evaluarRespuesta` / el prompt de repregunta.
   *Hecho a mano*: se la pasé a vos para que Naza la pegue.

5. **16/09 · `✖ mods.guardarRepreguntaEnviada is not a function`** (8 veces: órdenes 5, 19, 22, 23, 25, 26, 27 y 28; en la 29 ya NO falló — la sesión de hermes debe haber pusheado la función y esta sesión hizo pull) al intentar
   anotar la repregunta en `envios`. `scripts/manual.ts` la llama pero
   `src/db/envios.ts` no la exporta en el checkout de ese momento (la sesión de
   hermes estaba a mitad de un cambio en la rama `trato-usted-o-vos`). Efecto: la
   repregunta NO quedó registrada en `envios` ni en `contexto`. *Para repasar*: ver
   si el commit final de esa rama la exporta; si no, agregarla.
   *Causa real y arreglo (17/09)*: la función SÍ está exportada; `scripts/manual.ts` la
   importa y la declara en `Modulos`, pero el `return` de `modulos()` no la incluía.
   `tsc` no lo ve porque `tsconfig.json` solo mira `src/`. Se arregló el 16/09 en la
   rama (ad57d23) y ese commit quedó huérfano al mover la rama; re-aplicado en `main`
   el 17/09 tras volver a chocar con Ciro (orden 5). *Para repasar*: que `tsc` mire
   `scripts/` también, así esto no puede volver a pasar en silencio.

6. **16/09 · `siguiente` avanza a la pregunta 6 aunque haya una repregunta
   pendiente.** Después del error anterior corrí `siguiente joaquin` y generó y anotó
   la 6 (dia_actual = 6) sin avisar que la repregunta de la 5 no se había mandado.
   En el flujo automático la repregunta y la pregunta del día siguiente tienen su
   orden; en la puerta manual conviene que `siguiente` avise "hay una repregunta
   de la orden N sin responder" (o un flag `--saltear-repregunta`). Decisión de Naza:
   mandar primero la repregunta del abuelo y después la 6.

7. **15/09 · dos sesiones de Claude en el mismo checkout.** La sesión de hermes
   (Joaquín) y esta trabajaron a la vez sobre `C:\...\VITACORA FAMILIAR`: mi commit
   del comando `ficha` cayó en la rama de ellos. Regla acordada con Naza: mientras
   hermes esté activo, desde acá solo puerta manual, nada de git.

10. **16/09 · nombre del respaldo local de la repregunta desfasado.** Al cargar la
    respuesta a la repregunta de la orden 5, Storage la guardó como `dia_05_2.ogg`
    (correcto) pero la copia local quedó como `audios-crudos/joaquin/dia_05_3.ogg`.
    El contador del sufijo local no coincide con el de Storage. *Para repasar*:
    `archivar`/`cargar` en `scripts/manual.ts`, cómo calculan el sufijo.

11. **16/09 · observación de producto (Naza): ¿el biógrafo se va por las ramas con
    las repreguntas?** Duda de si al pensar siempre en lo que responde, las
    repreguntas alargan la entrevista o desvían del capítulo. Cómo está hoy: una
    por día como máximo, misma orden (`dia_NN_2`), no reemplaza ninguna pregunta
    del guion, y el prompt (`src/ia/cerebro.ts`) prohíbe pedirla "por costumbre" y
    abrir temas nuevos. *Para repasar con datos*: contar cuántas repreguntas pidió
    por narrador y en qué capítulos; si son muchas, restringir a "contó algo
    fuerte en una frase" o a ciertos capítulos.

12. **16/09 · Joaquín no tiene guion propio en `preguntas`.** Lo creó `manual crear`,
    que no copia las 26 fijas ("se usan solas como plantilla"), a diferencia del
    checkout que sí las copia (CONTRATO: guion por narrador). Funciona para la
    puerta manual, pero desde el panel no podría editar/sacar preguntas (no hay
    filas suyas) y el backfill de la migración 20260912 no lo alcanzó (fue creado
    después). *Para repasar*: que `crear` copie las fijas igual que la compra.

13. **16/09 · sensación de que "la infancia se alarga".** Las preguntas 5-7 son del
    capítulo "Las raíces" (abuelos, hermanos, tradiciones), pero la personalización
    vuelve una y otra vez a los detalles de la infancia ya contados (Pelliza, las
    milanesas, el ring con el hermano). No es un error del guion; es el prompt de
    `personalizar.ts` anclando demasiado en lo previo. *Para repasar*: pedirle que
    ancle en UNA cosa, no en tres, y que nombre el tema nuevo primero.

14. **16/09 · `✖ Claude no devolvió texto` al evaluar la respuesta 7** (y otra vez el 17/09 en la 13, la 20 y la 30: 4 de 30 — no es un caso raro). La respuesta
    se subió, se insertó y se transcribió bien (34 s, corta); la llamada de
    evaluación (`evaluarRespuesta`, `src/ia/cerebro.ts`) volvió sin texto y
    `cargar` cortó ahí. `estado` la marca como "respuesta corta sin repregunta
    anotada". No se reintentó (reintentar `cargar` duplicaría la respuesta).
    *Para repasar*: (a) que un fallo del modelo en la evaluación no aborte — hoy el
    código dice que ante duda es "suficiente", pero eso aplica al JSON ilegible, no
    a la respuesta vacía; (b) un comando `evaluar <narrador> --orden N` para
    reintentar solo la evaluación.

15. **16/09 · descarga de WhatsApp de 0 bytes.** `JOAQUIN RESPUESTA 7.ogg` bajó
    vacío la primera vez (Naza lo guardó antes de que WhatsApp terminara). `cargar`
    debería rechazar archivos de 0 bytes con un mensaje claro en vez de subirlos.

16. **16/09 · la personalización depende 100% de lo dicho; una corrección posterior
    no pisa lo anterior.** Pregunta de Naza: "si hubiese dicho que a los 12 se mudó,
    ¿preguntaría distinto?" Sí — usa `resumenesCapitulos` + respuestas previas +
    ficha. Pero si el narrador corrige un dato viejo ("no, a los 12 ya estábamos
    en otro lado"), el resumen del capítulo anterior sigue diciendo lo viejo y no
    hay regla de "lo último manda". *Para repasar*: al regenerar resúmenes, pasar
    también las respuestas posteriores del mismo tema, o marcar correcciones.

17. **16/09 · nombres propios inconsistentes en la transcripción.** Respuesta 9:
    "NASA" por Naza, "Herrera" por Herrero; respuesta 16: "WADE" por UADE (la
    pregunta misma decía UADE) (en la pregunta 9 el biógrafo mismo
    había escrito "Herrero"). El prompt de transcripción lleva vocabulario
    rioplatense y la ficha, pero no los nombres que ya aparecieron en respuestas
    anteriores. *Para repasar*: sumar al `promptDeTranscripcion` los nombres
    propios detectados (amigos, lugares) de las respuestas previas; el paso de
    "revisar nombres" del panel es la red, pero mejor no ensuciar la fuente.

18. **16/09 · si la personalización falla, la pregunta original sale en "usted"
    aunque el trato sea "vos".** (Pasó de nuevo el 17/09 en las órdenes 18, 23 y 26: 4 de 26. La 26 ni siquiera se intentó personalizar: "sale tal cual está en el guion".) Orden 12: `personalizar` devolvió algo inválido
    ("no conservaba las preguntas del original") y `siguiente` mandó el texto fijo
    del guion — "cuénteme ESA historia... ¿Cuál es la suya?" — seguido del cierre
    en vos. Las 26 fijas están escritas de usted; el fallback debería pasarlas por
    el trato (o tener las dos versiones). *Hecho a mano*: la pasé a vos.

19. **17/09 · el narrador dice "esto prefiero que NO vaya al libro" y nada lo
    registra.** Respuesta 12: "estas historias prefiero que queden en mi mente, no
    en mi biografía... locuras de las contables pueden ser por amor" y cuenta una.
    La transcripción entra entera al material del libro; el escritor no tiene señal
    de qué parte pidió reservar. *Para repasar*: que la evaluación detecte
    "no lo pongas / que no salga" y marque la respuesta (o el tramo) como
    `reservada`, y que la fábrica lo respete; hoy solo la dueña podría excluirla
    desde el panel (y `excluidas` se ignora por decisión del 13/09).

20. **17/09 · la pregunta fija supone un guion de vida que no es el del narrador.**
    Orden 14 original: "¿cómo fue la propuesta de casamiento y el día de la boda?";
    orden 15 personalizada: "¿qué le dirías a un nieto sobre cómo se quiere a
    alguien toda la vida?". Joaquín tiene 28, no está casado y contó una relación
    que "terminó". Las 26 fijas están pensadas para un abuelo; la personalización
    suaviza pero arrastra la premisa (nieto, toda la vida). Con un narrador joven o
    soltero/viudo/separado hay que tener reemplazos por capítulo (`capituloNoAplica`
    existe pero no se disparó acá). *Para repasar*: criterios de "no aplica" más
    finos que capítulo entero, usando la ficha (edad, estado civil) y lo contado.

21. **17/09 · la pregunta del capítulo "El trabajo" vuelve al puesto de diarios de
    la infancia.** Orden 17 (anécdota del trabajo) se personalizó hacia "esos días
    repartiendo diarios con Iñaki" a los 15, que ya se contó en la 4 y la 11, en vez
    de la carrera real (7 años en UADE, lo que hace hoy). Mismo mecanismo que la
    #13: ancla en lo más contado, no en lo más reciente o lo del capítulo. *Para
    repasar*: en el prompt de personalización, priorizar el resumen del capítulo
    actual y penalizar temas ya usados en dos preguntas anteriores.

22. **17/09 · "¿ya tenés hijos? Porque si es así..." — la pregunta pregunta si el
    capítulo aplica en vez de saberlo.** Orden 19 (capítulo "Los hijos") con un
    narrador de 28 que nunca mencionó hijos: la personalización salió con un
    condicional torpe. Debería haber disparado `capituloNoAplica` (existe) y mandar
    la pregunta de reemplazo, o al menos preguntar directo "¿tenés hijos?" como
    puerta y decidir con la respuesta. Misma raíz que la #20 (fijas de abuelo).

23. **17/09 · "no tengo hijos" dispara una repregunta (en usted) en vez de saltar el
    capítulo.** Se registró la 19 por texto con el comando nuevo `responder-texto`
    (+ `--ficha "No tiene hijos"`). El cerebro pidió repregunta ("¿hubo chicos en su
    vida igual, sobrinos, ahijados...?") — razonable como idea, pero en usted, y
    otra vez falló `guardarRepreguntaEnviada` (#5). Después la 20 (mismo capítulo)
    salió "vos me dijiste que no tenés hijos, pero cuéntame de tus hermanos" —
    mezcla vos/tú ("cuéntame") y redirige a los hermanos, que ya se contaron dos
    veces (#13/#21). *Para repasar*: cuando la ficha dice "sin hijos", el capítulo
    "Los hijos" entero debe ir a reemplazos (sobrinos/ahijados o un tema nuevo),
    no personalizarse pregunta por pregunta.

24. **17/09 · pregunta 21 sin sentido: "¿Cómo fuiste como padre?... ¿qué quisiste
    darles a Sol e Iñaki?... ¿Qué se siente ser abuelo ahora?"** A un narrador de
    28, sin hijos (está en la ficha desde la 19), que acaba de decir "cómo es cada
    uno ya lo hablamos". Trata a sus hermanos como hijos y le pregunta por sus
    nietos. Es la peor pregunta del piloto: contradice la ficha y lo ya dicho.
    Confirma #20/#22/#23: el capítulo "Los hijos" (19-21) tiene que saltarse entero
    cuando la ficha dice sin hijos, no personalizarse. También el modelo volvió a
    no devolver la evaluación (#14, ya 3 de 20). *Hecho a mano*: NO se manda; se
    reemplaza por una pregunta escrita a mano (ver abajo) y se anota con
    `--orden 21` cuando responda.

25. **17/09 · la pregunta que se le mandó no es la que quedó en la base.** La 21 se
    reemplazó a mano (ver #24) pero en `contexto.preguntasEnviadas[21]` y en
    `envios` quedó la generada ("¿cómo fuiste como padre?"); la respuesta se cargó
    contra ese texto y el libro/panel van a mostrar una pregunta que Joaquín nunca
    recibió. *Para repasar*: `siguiente --texto "..."` (o un `corregir-pregunta`)
    que anote lo que realmente se mandó; y en general, que el panel muestre la
    pregunta enviada, no la del guion.

26. **17/09 · "regálenos" en la pregunta 24.** La personalización en vos deja un
    "regálenos" (ustedes/nosotros formal) en medio de una pregunta tuteada. Mismo
    tipo de mezcla que "cuéntame" en la 20 (#23): el modelo respeta el vos en los
    verbos principales pero se le escapan formas de la fija original.

27. **17/09 · "si tus nietos escucharan esto..." (pregunta 25) a un narrador sin
    hijos.** La fija del capítulo final se personalizó bien en el resto, pero
    conserva "tus nietos" con la ficha diciendo "no tiene hijos". Se manda igual
    (el mensaje al futuro tiene sentido) pero corregido a mano: "quienes vengan
    después de vos".

28. **17/09 · las 4 adaptativas NO se generaron al completar la 26 — el error de
    `guardarRepreguntaEnviada` (#5) cortó `trasResponderManual` ANTES del bloque
    `if (orden === ULTIMA_FIJA)`.** `estado` dijo "ya respondió todo, corré cerrar"
    y `siguiente` dijo "llegó a la orden 26, la última del guion": sin las
    adaptativas, la puerta manual daba por terminada la entrevista en 26 en vez de
    30. *Hecho a mano*: llamé a `generarPreguntasAdaptativas` con un script suelto
    (hubo que cargar el .env y poner `WA_*=manual` como hace manual.ts); después
    `siguiente` dio la 27. **Grave**: en producción automática el mismo bug haría
    que un narrador termine con 26 preguntas y sin las 4 que se adaptan a su vida.
    *Para repasar*: que `generarPreguntasAdaptativas` corra ANTES o
    independientemente de la repregunta; y que `siguiente` en la orden 27 sin
    adaptativas las genere (el código lo hace, pero solo si `ultimaOrdenDelGuion`
    devuelve ≥ 27 — y devuelve 26 porque mira `preguntas`, circular).

29. **17/09 · la respuesta 27 no contestó la pregunta 27.** La adaptativa 27
    preguntaba por la separación de los padres a los 17; Joaquín respondió sobre
    los juegos de la infancia (38 s) — parece haber contestado otra cosa (¿un
    audio viejo, o respondió la repregunta de la 3 con retraso?). El cerebro lo
    notó: la repregunta pide "lo otro que me contaste: cuando tus papás se
    separaron" — y esta vez salió EN VOS (primera repregunta bien tuteada; #4 no
    es 100% consistente). *Para repasar*: la evaluación debería detectar
    "respondió otra pregunta" y decirlo, no solo pedir más.

30. **17/09 · el biógrafo insiste con el mismo tema doloroso (observación de
    Naza).** La adaptativa 27 preguntó por la separación de los padres; ante una
    respuesta que no la contestó, la repregunta volvió exactamente ahí ("¿te
    acordás del día en que se fue, qué te dijo?"). Naza la descartó: "ya pregunta
    mucho de eso". Para un abuelo, insistir dos veces en una herida es
    contraproducente. Volvió a pasar en la 28: respondió "era muy doloroso... no podía hacer
    mucho" y la repregunta pide "una vez en particular... qué hiciste". Se saltea
    (misma regla). *Para repasar*: la repregunta no debería repetir el tema de
    la pregunta que el narrador acaba de esquivar — si no contestó, quizá no
    quiere; una sola invitación alcanza.

31. **17/09 · Ciro · la repregunta pide lo que el narrador YA contó.** Respuesta 5
    ("no sé nada de mis abuelos ni de cómo se llevaban") → repregunta: "¿de tus
    abuelos te acordás de alguno, aunque sea de verlo en una foto o de escuchar su
    nombre?". Pero en la respuesta 1 Ciro contó que **su abuela materna cocinaba en
    la casa todos los días**: se crió con ella. Causa: `evaluarRespuesta()`
    (`src/ia/cerebro.ts:124`) recibe SOLO la pregunta y la respuesta de hoy — ni la
    memoria de capítulos ni las respuestas previas, que la personalización sí
    recibe. Distinto de #30 (insistir en lo que esquivó): acá pide algo que ya dio,
    y eso le dice al narrador que no lo escuchan. Naza lo notó: "¿ya le preguntó
    sobre esto?". *Hecho a mano*: repregunta descartada; se le mandó una anclada en
    la abuela que ya nombró. *Para repasar*: pasarle a la evaluación la memoria de
    capítulos (`memoriaDeCapitulos`, barata) para que no repita ni pida lo dado.

32. **17/09 · Ciro · dar por muerta (o viva) a una persona que el narrador no dijo
    si vive (observación de Naza).** La repregunta de reemplazo para la 5, escrita a
    mano, decía "a tu abuela la tuviste cerca... ¿cómo se llamaba, cómo era?" — todo en
    pasado: la daba por muerta. Nadie sabe si vive. Y al revés también duele: hablar
    en presente de alguien que murió. Ni la ficha ni el prompt tienen ese dato.
    *Regla para el biógrafo (personalizar, repregunta, adaptativas, reemplazo)*: de
    una persona que el narrador no dijo si vive, no se asume — se pregunta anclado
    en la época ("cómo la recordás de esos años", "cómo era en esa casa") o sin verbo
    copulativo ("su nombre"), nunca "se llamaba" ni "cómo está". *Para repasar*: (a)
    sumar esa regla a los prompts, con casos de prueba; (b) que la ficha pueda decir
    quiénes ya no están (la familia lo sabe y es un dato que cambia todas las
    preguntas sobre esa persona); (c) revisar las 26 fijas con el mismo ojo (ver #27,
    "si tus nietos escucharan esto", que es la misma clase de suposición).

31. **18/09 · EL BIÓGRAFO NO SE DESPIDE SOLO (Naza lo marcó como importante).**
    Al cargar la última respuesta (30), `cargar` cortó con "Claude no devolvió
    texto" (#14) y no llegó al bloque de cierre; pero aun sin ese fallo, la
    puerta manual solo IMPRIME la despedida cuando alguien corre `cerrar`, y
    `cargar` con la 30 no pone `completado` por sí mismo. Hubo que correr `cerrar
    joaquin` a mano para tener el texto y el estado. En el flujo automático hay
    que confirmar que al recibir la respuesta 30 el entrevistador (a) manda la
    despedida por WhatsApp, (b) pone `completado`, y (c) dispara el mail
    "terminó" de la fábrica — sin depender de que la evaluación haya salido bien.
    *Para repasar*: el cierre tiene que ser el primer paso tras guardar la 30,
    no el último tras la evaluación.

32. **18/09 · falsa alarma con matices: la fábrica se MUDÓ de proyecto Railway
    (`vitacora-familiar`, cuenta de Naza → `fearless-kindness`, cuenta de Joaquín,
    con deploy automático desde GitHub) y nadie lo dejó escrito.** El proyecto
    viejo quedó vivo pero muerto (último log 14/09, 50 `Gateway Timeout`, deploy
    del 10/09) y el CLI de Naza seguía linkeado ahí: media hora creyendo que
    Joaquín no se iba a procesar. En el nuevo, la fábrica ya armó `estructura.json`
    y mandó "terminó" a los minutos. *Para repasar*: apagar/borrar el proyecto
    viejo; `ESTADO.md` con el proyecto y los dos servicios (`dazzling-friendship`
    = fábrica, `VITACORA-FAMILIAR-` = entrevistador); y un healthcheck igual.
    Ruido en logs: cada tick falla leyendo `public.narraciones` (migración de voz
    clonada sin aplicar) — no rompe, pero ensucia.

33. **18/09 · el cierre automático a los 30 días manda el mail aunque el candado
    `cierre_automatico_enviado.txt` ya exista.** Al preparar el redeploy se
    sembraron los 7 candados de Osvaldo (set dorado) para que no reciba mails;
    pero la rama ≥30 días hace el CAS y llama a `mandar('cierre_automatico')` sin
    mirar el candado (`worker.ts` ~318-337); `mandarHito` tampoco lo chequea.
    *Hecho a mano*: `libro_aprobado_at` en Osvaldo por SQL. *Para repasar*:
    `mandarHito` debe saltear si el candado ya está.

34. **18/09 · el wizard de cerrar libro y la muestra arman los capítulos solo
    con las preguntas adaptativas del narrador (4) en vez del guion entero (8).**
    A Joaquín le quedó `edicion.ordenCapitulos` = [Las pruebas, La infancia, El
    amor, El oficio] → "Las pruebas" como capítulo 1 y un libro de 4 capítulos.
    Causa: `libro/page.tsx` y `muestra.ts` leían `preguntas` solo con
    `narrador_id = n.id` y caían a la plantilla global solo si venía vacío; pero
    las 26 base son globales (`narrador_id` null) y un narrador de la puerta
    manual tiene como propias únicamente las 4 adaptativas (orden 27-30). El
    panel ya unía las dos (base + propias pisan por orden). *Hecho*: helper
    `armarGuion` + `capitulosDelGuion` en `web/src/lib/guion.ts`, compartido con
    el panel; el wizard y la muestra piden las dos consultas y las unen.
    *Datos*: limpiar `edicion.ordenCapitulos` de Joaquín a mano (o dejarlo en
    null para que vuelva a proponerse con los 8 capítulos).

35. **18/09 · Joaquín · el entrevistador hace las tres preguntas de "Los hijos"
    aunque el narrador ya dijo que no tiene.** En la 19 ("el día que nació su
    primer hijo") Joaquín contestó "No, no tengo hijos" y el biógrafo siguió con
    la 20 ("hábleme de cada uno de sus hijos") y la 21 ("¿cómo fue usted como
    padre?") tal cual. Él las salvó: en la 20 habló de sus hermanos (Sol, Iñaki),
    en la 21 de cómo lo crió el padre y qué repetiría. *Para repasar* (Joaquín,
    3t.15): si en la 19 dice que no tiene hijos, saltear la 20 y reformular la 21
    ("¿qué le gustaría darle a un hijo si lo tuviera?" / los hermanos / los
    sobrinos), y que el capítulo se llame de otra manera en `estructura.json`.
    *Mientras tanto*: la dueña renombra el capítulo en el wizard (ver 36).

36. **18/09 · la fábrica no aplica `edicion.titulosCapitulos`.** El wizard de cerrar
    libro tiene un paso para renombrar cada capítulo ("en el guion: Los hijos") y
    lo guarda en `narradores.edicion.titulosCapitulos` (13/09), pero
    `fabrica/src/libro/edicion.ts` aplica SOLO orden, título, subtítulo y tapa:
    el nombre nuevo se ve en la muestra y no llega al libro. *Para repasar*
    (fábrica): leer `titulosCapitulos` en `leerEdicion`, aplicarlo al armar
    `estructuraFinal` en `generar-paquete.ts` (título del capítulo en el HTML/PDF
    y el índice), a la intro TTS "Capítulo N: …" del audiolibro (real y clonado,
    `ensamblar.ts`) y a `narracion.json` para el worker de voz. Con test.
    **Arreglado el 18/09** (`aplicarTitulosCapitulos` en `fabrica/src/libro/edicion.ts`,
    aplicado en `generar-paquete.ts` justo después del orden): desde ahí
    `capitulo.nombre` es el título elegido para el escritor, la plantilla, la intro
    TTS (real por `estructuraFinal`, clonada por `narracion.json`) y el nombre del
    guion queda en `nombreGuion` para re-clavar las fotos, que se cargan por
    capítulo del guion. Pendiente menor: la muestra pública (`web/src/lib/muestra.ts`)
    lista los capítulos por `ordenCapitulos` sin pasar por `titulosCapitulos`; la del
    panel sí los aplica.

37. **18/09 · GRAVE · la fábrica vieja de Railway (#32) no estaba muerta: escribió
    el libro de Joaquín sin aprobación, con voz real y con la key de Naza.** A las
    12:14 UTC Joaquín marcó el pedido `pagado` con `audiolibro: "clonada"`. Dos
    minutos después, la fábrica del proyecto viejo (`trickynoise/vitacora-familiar`,
    código del 10/09: sin la puerta de `libro_aprobado_at` ni voz clonada) lo tomó y
    escribió los 8 capítulos (12:16–12:22) **antes de que Naza cerrara el libro
    (12:27)**, armó los 8 `audiolibro_cap_NN.mp3` con voz real (12:29) y se cayó a
    las 12:30:43 subiendo `audiolibro_completo.mp3` ("exceeded the maximum allowed
    size"). La nueva (`dazzling-friendship`) lo había visto "generando por otro
    proceso" a las 12:16:08, lo devolvió a `pagado`, y después del cierre reusó los
    borradores, corrió solo el editor (12:34), dejó `narracion.json` y la fila en
    `narraciones` → `esperando_voz`. Costo: ~USD 4,5–5 en la key de Naza (la vieja
    tenía la misma `ANTHROPIC_API_KEY` que `fabrica/.env`) + ~USD 1–1,5 en la key
    de Joaquín (la nueva). **Apagada el 18/09 ~15:15 (hora España) con `railway
    down` desde la cuenta de Naza**: deploy `4a3c4473` REMOVED; el proyecto y sus
    variables siguen. *Para repasar*: borrar el proyecto viejo del todo y rotar la
    key de Anthropic de Naza (estuvo cargada en un servicio que nadie miraba);
    `ESTADO.md` con la regla "un solo proyecto de Railway".

## Estado del libro de Joaquín al 18/09 ~04:00 (para retomar sin adivinar)

- Narrador `3691baf4…`: `completado`, 35 respuestas. `estructura.json` con 8
  capítulos (17/09 23:07), `preview.pdf` y `muestra_audiolibro.mp3` (18/09 01:05).
- Edición guardada (18/09 ~03:45): los 8 capítulos en el orden del guion y
  `titulosCapitulos = {"Los hijos": "La familia"}` (no tiene hijos; el capítulo
  lleva a sus hermanos y cómo lo crió el padre — ver 35). El dato malo de 34 ya
  se limpió a mano.
- **Libro NO cerrado** (`libro_aprobado_at` null): falta la confirmación final
  del wizard.
- **Un pedido `pendiente`** (`3284c93c-14dc-40ac-bd58-5b66f7422fc2`, 18/09 03:38):
  `{pdf: true, impreso: "bn", copias: 1, marcos: 1, audiolibro: null}`. Sin pago.
- La fábrica no escribe nada hasta que el pedido esté `pagado` Y el libro cerrado.
  No se gastó modelo todavía.

Para hacer la prueba punta a punta CON la voz clonada, en este orden:

1. Joaquín lee la sección "Narraciones (voz clonada)" de `supabase/CONTRATO.md`
   y da el OK (Naza ya lo dio).
2. Aplicar `supabase/migrations/20260917000000_narraciones.sql` en el SQL editor
   de Supabase (entera; es idempotente). Con eso la fábrica deja de loguear
   `PGRST205` en cada tick.
3. Permiso de voz de Joaquín (a mano, hasta que el entrevistador lo escriba):
   `update narradores set consentimiento_voz_at = now() where id = '3691baf4-ee78-4c6b-9238-4cbed1872be7';`
4. El pedido, a mano (es lo que haría Mercado Pago):
   `update pedidos set extras = extras || '{"audiolibro": "clonada"}', estado = 'pagado' where id = '3284c93c-14dc-40ac-bd58-5b66f7422fc2';`
5. Joaquín cierra el libro en el panel (confirmación final del wizard).
6. La fábrica (Railway, `fearless-kindness`, servicio `dazzling-friendship`, debe
   estar en `fe2cd46` o posterior) escribe el libro en el próximo tick: PDF/HTML,
   `narracion.json`, fila en `narraciones`, pedido → `esperando_voz`.
7. En la PC de música: registrar la tarea `VitacoraVoz` (README de `voz/`, "El
   worker") o correr `python -m voz.worker` a mano y mirar `logs\worker.log`.
   ~3,5 h de GPU por 90 min de audio.
8. La fábrica ensambla, pedido → `entregado`, mail de libro listo; el panel
   reproduce. Pegar acá el log del worker y el `audiolibro_paths`.

Si se quiere ver el libro ANTES de la migración: solo el paso 4 sin el
`audiolibro` (queda `null`) + el 5. Ojo: entregado así, la fábrica no vuelve a
escribirlo; el audiolibro clonado saldría después con otro pedido.

33. **18/09 · Ciro · el biógrafo pregunta por la infancia como si hubiera sido un lujo
    (pedido de Naza: "tiene que de alguna manera saber si la vida de la persona fue
    dura de infancia").** La pregunta 7 salió: "¿Qué tradiciones había? Las milanesas, la
    chocolatada... ¿cómo eran los domingos, las fiestas con tu abuela Estela, tu tío, tus
    primos?". Respuesta: "¿Cómo eran los domingos? Una mierda, amigo. Mi familia era un
    desastre... Hay algo que vos no estás entendiendo... totalmente desarticulada... El
    tío estaba re duro y la abuela queriendo rescatarlo... Esto no era una película de
    Disney." **Las señales ya estaban** en las respuestas 2 y 2-bis: padre ausente con
    drogas y alcohol, "todos los grandes se llevaban mal", se fue a los 12. El biógrafo
    las tenía a la vista (entran en las últimas 6 respuestas) y aun así encuadró la
    pregunta en clave nostálgica. Causas: (a) las 26 fijas están escritas para una
    infancia feliz ("tradiciones", "fiestas", "travesuras que todavía lo hagan reír"), y
    la personalización conserva ese encuadre porque su regla es enganchar detalles, no
    leer el tono; (b) el prompt pide "cálido" y nada le dice que la calidez a veces es
    no adornar; (c) ningún lugar guarda "cómo fue esta vida" — la memoria de capítulos
    resume hechos, no el clima. *Para repasar*: que la memoria del biógrafo lleve una
    línea de **tono** por capítulo ("infancia dura: padre ausente con adicciones, familia
    desarticulada, tío con drogas") y que personalizar/adaptativas/repregunta la
    reciban con una regla explícita: si la infancia fue dura, no preguntar por fiestas,
    tradiciones ni domingos como si hubieran existido — preguntar qué había, quién
    sostenía, qué se rescataba. Y revisar las 26 fijas con ese ojo.

34. **18/09 · Ciro · la repregunta insiste donde el narrador acaba de decir "vamos por
    otro lado".** En esa misma respuesta 7 dijo, literal: "mi tío se drogaba, o sea,
    vamos por otro lado porque, porque por ahí, boludo". La repregunta que generó el
    cerebro: "Me quedé con una imagen: su abuela Estela tratando de rescatar a su tío
    en medio de un domingo. ¿Cómo era verla en eso...?" — va derecho al tío y a las
    drogas, y encima en usted (la puerta manual evaluó contra la pregunta genérica, #18).
    Es la #30 en su versión más clara: el narrador pidió cambiar de tema con esas
    palabras y el biógrafo no lo escuchó. *Hecho a mano*: repregunta descartada.
    *Para repasar*: en la evaluación, si la respuesta contiene un pedido explícito de
    cambiar de tema ("vamos por otro lado", "no quiero hablar de eso", "dejemos eso"),
    NO hay repregunta sobre ese tema, y ese tema entra solo a `contexto.evitar` para el
    resto de la entrevista.

35. **18/09 · Ciro · la personalización repite lo recién contestado y lleva la pregunta
    hacia las sustancias.** Respuesta 8: salidas de miércoles a domingo, "mucho vino,
    mucha pastilla, mucho clonazepam", y que el Pelado Bausa y el Beto "no salíamos los
    tres juntos, creo que nunca". Pregunta 9 generada: "...cumbia, rock and roll,
    alcohol. ¿El Pelado Bausa y el Beto estaban en esa onda con vos? ¿Cómo era salir con
    ellos?" — pregunta lo que acaba de decir que no pasó, y encuadra a los amigos desde
    el alcohol. El hueco real ("los pibes de Chupín y Chombita", nombrados al pasar) no
    lo tomó. A diferencia de #31, acá el personalizador SÍ tenía la respuesta 8 a la
    vista: la regla "CONSERVÁ TODAS LAS PREGUNTAS del original" le pesa más que "no
    repitas lo contado". *Hecho a mano*: reescrita por Naza/Claude sobre Chupín y
    Chombita. *Para repasar*: (a) en personalizar, si una sub-pregunta del guion ya quedó
    contestada en la respuesta anterior, se reemplaza por lo que quedó abierto, no se
    repite; (b) el biógrafo no lidera con consumo de sustancias aunque el narrador las
    haya nombrado — si él las trae, se escucha; no se convierten en el gancho.

38. **18/09 · MEDIO · el ensamblado del audiolibro clonado de Joaquín se cayó DOS VECES, por
    dos motivos distintos — y ninguno era la voz, que ya estaba narrada.** (a) El mp3 completo
    no entra en Storage: el tope es 50 MB por archivo y `audiolibro_completo.mp3` lo pasaba (el
    mismo tope que a las 12:30:43 tumbó a la fábrica vieja subiendo el audiolibro real, 37:
    "exceeded the maximum allowed size"). (b) La key de OpenAI de la fábrica nueva no tenía
    crédito, y de ahí salían las intros TTS de cada capítulo (`fabrica/src/audio/tts.ts`): quedó
    resolviéndose por referencia a la key del entrevistador en Railway (pase de manos del 20/09,
    sección "Keys"; esa key se rota el 19/09 porque salió impresa en un chat).
    **Arreglado el 19/09** (`ee3d255`, con `dc7fe8d` adentro): `subirCompletoSiEntra`
    (`fabrica/src/audio/audiolibro.ts`, tope `LIMITE_BYTES_ARCHIVO_STORAGE` = 50 MB) — si el
    completo no entra, avisa por consola y se entrega por capítulos, con
    `pedidos.audiolibro_paths` sin `completo`; nunca frena una entrega cuya parte cara ya está
    hecha. La web da `completo` por opcional desde el 20/09 (`854cb93`). El lado (b) quedó sin
    efecto en el clonado: desde el 19/09 ese audiolibro no lleva intro TTS (`c80e5ce`, regla de
    voz única) y el anuncio del capítulo lo narra el worker con la voz del narrador.
    *Para repasar*: el chequeo de tamaño vive solo en `subirCompletoSiEntra` — el próximo archivo
    grande que se suba a Storage (un capítulo largo, algo nuevo del paquete) va a descubrir el
    tope igual de tarde; conviene que el tope esté en un solo lugar y lo mire cualquier subida.
    Y que la key de OpenAI de la fábrica siga siendo la del entrevistador por referencia: una
    recarga alcanza para los dos servicios.

39. **18/09 · suave, pero dejó la fábrica sin diagnóstico · en la PC de Naza el CLI de Railway
    no arranca: Control de aplicaciones de Windows lo bloquea.** Justo cuando el proyecto se
    mudaba a `fearless-kindness` (cuenta de Joaquín) y la fábrica vieja seguía viva y engañando
    (32, 37), desde esa máquina no había forma de leer deploys ni logs.
    **Resuelto el 19/09** (`3d29d66`): `fabrica/scripts/railway-logs.py` lee deploys y logs por
    la API con el token de PROYECTO (`RAILWAY_API_TOKEN` en `fabrica/.env`):
    `python scripts/railway-logs.py [--lineas 200] [--servicio VITACORA-FAMILIAR-] [--buscar texto]`
    (`ESTADO.md`, 18/09).
    *Para repasar*: el token es de proyecto y solo ve ESE proyecto — para mirar el viejo (o
    cualquier otro) hace falta otro token; y el bloqueo de Windows no tiene vuelta, así que todo
    diagnóstico de Railway desde la PC de Naza pasa por este script.

## Producción / infra (no es del entrevistador, pero salió en el camino)

8. **15/09 · producción corría un build de 8 días** mientras `main` tenía todo el
   panel nuevo; Joaquín lo daba por deployado. Vercel no está conectado a git —
   cada deploy es manual (`vercel --prod` desde una worktree limpia). *Para repasar*:
   conectar Vercel a GitHub (`vercel git connect`) para que `main` deploye solo.

9. **15/09 · el webhook de MP no verifica la firma** (`MP_WEBHOOK_SECRET` cargado
   en Vercel pero el código no lo lee; Stripe sí verifica). **Arreglado el 16/09** (`web/src/lib/firma-mp.ts`): HMAC del manifiesto `id;request-id;ts`, 401 si no coincide. Requiere que `MP_WEBHOOK_SECRET` en Vercel sea la clave del webhook de **producción** (la que muestra el panel de MP al crear la notificación), no la de prueba.
