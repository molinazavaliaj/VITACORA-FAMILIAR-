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
| 34 | Cerrar libro y la muestra arman los capítulos solo con las 4 adaptativas del narrador, no con el guion entero (8) | El libro de Joaquín arrancaba por "Las pruebas" y tenía 4 capítulos; quedó guardado así en `edicion.ordenCapitulos`. **Arreglado el 18/09** (helper `armarGuion`); falta limpiar el dato a mano |
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

## Producción / infra (no es del entrevistador, pero salió en el camino)

8. **15/09 · producción corría un build de 8 días** mientras `main` tenía todo el
   panel nuevo; Joaquín lo daba por deployado. Vercel no está conectado a git —
   cada deploy es manual (`vercel --prod` desde una worktree limpia). *Para repasar*:
   conectar Vercel a GitHub (`vercel git connect`) para que `main` deploye solo.

9. **15/09 · el webhook de MP no verifica la firma** (`MP_WEBHOOK_SECRET` cargado
   en Vercel pero el código no lo lee; Stripe sí verifica). **Arreglado el 16/09** (`web/src/lib/firma-mp.ts`): HMAC del manifiesto `id;request-id;ts`, 401 si no coincide. Requiere que `MP_WEBHOOK_SECRET` en Vercel sea la clave del webhook de **producción** (la que muestra el panel de MP al crear la notificación), no la de prueba.
