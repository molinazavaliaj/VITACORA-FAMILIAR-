> **Estado al 21/09 (madrugada): las tres puntas "para Joaquín" de acá abajo ya están cerradas en `main`** y
> el piloto queda cerrado del lado del entrevistador (267 tests): el `UPDATE` de la reserva en el flujo
> (`8e7bbfe`, más la ampliación, el "no tuvo" y el cierre en `dee531d`), el criterio de "no aplica" por edad
> (`c2623fd`) y el cierre manual (`06a7de2`). Lo único que faltaba —aplicar la migración de las reservadas—
> **se aplicó y está verificada**. Las notas de más abajo que dicen "para Joaquín" son el estado del día en
> que se escribieron: léanlas con esta línea arriba.

# Bitácora del piloto manual — errores y cosas raras para repasar

> Naza pidió (16/09) anotar TODO lo que salga mal o raro mientras se entrevista a
> los narradores de prueba por la puerta manual, para repasarlo junto al final.
> Una entrada por hallazgo: fecha · narrador · qué pasó · dónde está · qué se hizo.
> No se arregla nada acá; se anota. Los arreglos van a la lista de la revisión final.

## Dónde se anota cada hallazgo, y cómo se numera (regla del 23/09)

Dos archivos, dos numeraciones que no pueden chocar:

| Archivo | Qué lleva | Numeración |
|---|---|---|
| **este** (`piloto-bitacora-errores.md`) | el piloto de **Joaquín**, la fábrica, la web y la infra | `1`, `2`, `3`… |
| `piloto-errores-ciro.md` | el piloto de **Ciro** | `C1`, `C2`, `C3`… |

**Un narrador nuevo abre su propio archivo** con su propia letra (`piloto-errores-<nombre>.md`,
entradas `D1`, `D2`…). No se agregan hallazgos de un narrador nuevo acá.

**Por qué:** el 22/09 esta bitácora vivía en tres ramas a la vez y los números `31` a `35` se
habían usado dos veces cada uno — el mismo hallazgo de Ciro era `#36` en una rama, `#41` en otra
y `C6` en su archivo. Cuando alguien decía "arreglé el 36", nadie podía saber cuál. El 23/09 se
consolidó: las cinco entradas de Ciro que estaban acá se movieron a `C1`–`C5` y dejaron un
puntero en su lugar.

**Al anotar desde una rama:** el número se toma del **último de `main`**, no del de tu rama, y si
la rama tarda en mergearse se vuelve a mirar antes del merge. Un número repetido no rompe nada al
mergear —git junta los dos textos sin quejarse—, y por eso hay que cuidarlo a mano.

## Triage: qué rompe o le saca valor al libro (pedido de Naza, 17/09)

Ordenado de más grave a más suave. El criterio es **el producto final**: ¿el
libro sale mal, sale incompleto, o el cliente se pierde antes de llegar?

### 🔴 Graves — rompen el libro o la venta

| # | Qué | Por qué es grave |
|---|---|---|
| 19 | El narrador pide "esto que no vaya al libro" y nada lo registra | Publicar algo que pidió reservar es la peor falla posible: quiebra la confianza y puede herir a la familia. **Arreglado el 20/09** (`82c77e6`): la evaluación lo detecta, la fábrica lo respeta; **Arreglado el 20/09 (J)** (`f2686b2`, `8e7bbfe`): el flujo guarda `reservada`/`reservado_tramo` en la fila (`guardarReserva`, no tumba el día si la migración no está). Falta **aplicar la migración** (los dos dieron el OK, la corre Naza). La detección cubre la respuesta principal del día: las **ampliaciones** y la **pregunta de cierre** siguen sin detectarse (la evaluación se saltea las dos) — **cerrado el 20/09 (J, `a95209d`)**: `procesar.ts` y la puerta manual llaman a `detectarReservaYDejarTema` (`5bbfcb9`) en la ampliación, el "no tuvo" y el cierre; en la respuesta normal las marcas salen de la evaluación (sin llamada extra) |
| 1 | Trato "usted" por defecto con ficha vacía (y el checkout no pide la ficha) | Un cliente real llega con ficha vacía → preguntas genéricas y trato equivocado desde el día 1; el narrador no siente que lo escuchan |
| 17 | Nombres propios mal transcriptos (NASA/Naza, Herrera/Herrero) | Van directo al texto del libro; un nombre mal escrito de un hijo o un amigo desvaloriza todo el producto. La revisión de nombres del panel es la única red |
| 14 | La evaluación vuelve vacía (2 de 13 veces) y corta el proceso | En el flujo automático es un día perdido: sin repregunta y, según cómo falle, sin avance. Frecuencia demasiado alta para ignorar. **Arreglado el 20/09** (`f76da1f`); el reintento a mano `evaluar <narrador> --orden N` **(J, `06a7de2`)** |
| 34 | Cerrar libro y la muestra arman los capítulos solo con las 4 adaptativas del narrador, no con el guion entero (8) | El libro de Joaquín arrancaba por "Las pruebas" y tenía 4 capítulos; quedó guardado así en `edicion.ordenCapitulos`. **Arreglado el 18/09** (helper `armarGuion`) y el dato de Joaquín limpiado a mano esa noche |
| 35 | El entrevistador hace las tres preguntas de "Los hijos" (19-21) aunque el narrador dijo que no tiene hijos | Joaquín contestó "no tengo hijos" en la 19 y le preguntaron igual "hábleme de cada uno de sus hijos" y "¿cómo fue usted como padre?"; él lo salvó hablando de los hermanos y de cómo lo crió el padre. En un cliente real es dolor gratuito (y peor si no tuvo hijos por una pérdida). **Arreglado el 18/09 (Joaquín)**: al responder una pregunta de «Los hijos» o «El amor», `detectarQueNoTuvo` mira si dijo que nunca tuvo; si sí, no se repregunta sobre eso, se anota `arbol.hijos`/`arbol.conyuge = 'no tuvo'` y las que siguen del capítulo se reemplazan por la regla que ya existía para el árbol cargado al comprar (ahora también para filas propias del guion). Ante la duda, no toca nada. |
| 36 | La fábrica ignora `edicion.titulosCapitulos`: el título que la dueña le pone a un capítulo en el wizard no llega al libro | Joaquín puede renombrar "Los hijos" en el panel y la muestra lo refleja, pero el PDF/HTML, el índice y la intro del audiolibro ("Capítulo 6: Los hijos") salen con el nombre del guion. **Arreglado el 18/09** (`aplicarTitulosCapitulos` en `fabrica/src/libro/edicion.ts`, aplicado en `generar-paquete.ts`) |
| 32 | La fábrica cambió de proyecto Railway sin dejarlo escrito; el viejo sigue vivo-muerto y engaña | Media hora de diagnóstico falso; sin healthcheck, una caída real tampoco se vería |
| 31 | El biógrafo no se despide ni cierra solo al recibir la 30 si la evaluación falla (y en manual nunca sin `cerrar`) | El narrador queda esperando la pregunta 31; la fábrica no arranca; nadie avisa a la familia. **Arreglado el 20/09** (`f76da1f`) el disparador: la evaluación ya no corta antes del cierre. La puerta manual **(J, `06a7de2`)**: `cargar`/`responder-texto` con la última imprimen la despedida y dejan `completado` sin correr `cerrar` |
| 28 | Las adaptativas 27-30 no se generan si falla la repregunta de la 26 (y `siguiente` da la entrevista por terminada en 26) | El narrador se queda sin las 4 preguntas hechas a su medida; el libro sale con huecos y nadie se entera. **Arreglado el 20/09** (`f76da1f`): generar las adaptativas ya no puede cortar el flujo, y `preguntar.ts` las reintenta cuando piden la orden siguiente. La puerta manual **(J, `06a7de2`)**: `ultimaOrdenDelGuion` usa el guion propio y `siguiente`/`cargar` generan las 4 al responder la última que exista |
| 9 | Webhook de Mercado Pago sin verificar firma | Cualquiera que conozca la URL puede marcar pedidos como pagados (libro gratis) |

### 🟠 Medios — el libro sale, pero peor

| # | Qué | Efecto |
|---|---|---|
| 13 | La personalización ancla demasiado en lo ya contado ("la infancia se alarga") | Preguntas repetitivas, el narrador siente que le preguntan lo mismo; menos material nuevo por capítulo. **Arreglado el 20/09** (`d230473`) |
| 16 | Una corrección posterior no pisa el resumen viejo | El libro puede afirmar algo que el narrador corrigió después |
| 16 | Una corrección posterior no pisa el resumen viejo | El libro puede afirmar algo que el narrador corrigió después. **Arreglado el 20/09** (`a251bd2`): la memoria guarda hasta qué orden entró cada resumen y lo rehace si contó más |
| 4 | Repregunta en "usted" con trato "vos" | Rompe el vínculo justo en el momento más íntimo (la repregunta va a lo emocional). **Arreglado el 20/09** (`ed513d8`) |
| 18 | Si la personalización falla, la fija sale en "usted" | Mismo efecto: incoherencia de trato a mitad de entrevista. **Arreglado el 20/09** (`ed513d8`): segundo intento más corto antes de rendirse. La orden 26 ("ni se intentó") **(J, `b3f0a31`)**: si el modelo devuelve el original textual (en usted) a un narrador de vos, también va al segundo intento |
| 2 | Pregunta 5 mal redactada ("hablemos de atrás") | Una pregunta rara baja la calidad percibida; el narrador responde peor |
| 11, 30 | ¿Las repreguntas se van por las ramas / insisten en lo que el narrador esquivó? | Cansan y pueden incomodar; en un abuelo, insistir en una herida es contraproducente. **Arreglado el 20/09** (`d230473`) en el prompt: si pidió dejar el tema, no hay repregunta y la respuesta alcanza |
| 12 | `crear` no copia el guion al narrador | Desde el panel la familia no puede editar preguntas de ese narrador. **Arreglado el 20/09 (J)** (`06a7de2`): `crear` copia las fijas como la compra; `guion <narrador>` para los viejos |
| 20, 22, 23, 24, 27 | Las fijas suponen boda/nietos/hijos/"toda la vida"; el narrador es joven, sin hijos, y la relación terminó — `capituloNoAplica` no se dispara | Preguntas que no aplican incomodan y dan respuestas vacías; el capítulo "El amor" sale flojo. **Arreglado el 20/09** (`d230473`) en los prompts de personalizar y adaptativas (no suponer boda, hijos ni nietos; no preguntar lo negado). `capituloNoAplica` con la ficha **(J, `c2623fd`)**: menor de 25 sin hijos cargados → «Los hijos» no aplica; menor de 18 sin pareja → «El amor» tampoco; y `ficha --hijos no / --pareja no` para decirlo a mano (`06a7de2`). Estado civil: la ficha no tiene el campo (ver `docs/ficha-del-narrador.md`) |

### 🟡 Suaves — operativos, no tocan el libro

| # | Qué |
|---|---|
| 3 | Respuestas en varios audios: hay que unirlos a mano. **Arreglado el 20/09 (J)** (`06a7de2`): `cargar <narrador> a.ogg b.ogg` los pega con ffmpeg |
| 25 | Una pregunta reemplazada a mano no queda registrada: el panel/libro muestran la que no se mandó. **Arreglado el 20/09 (J)** (`06a7de2`): `siguiente --texto "..."` y `corregir-pregunta`; `cargar` evalúa contra lo enviado |
| 5 | `guardarRepreguntaEnviada is not a function` (código a medio hacer de la otra sesión) |
| 6 | `siguiente` avanza aunque haya repregunta pendiente |
| 10 | Sufijo del respaldo local desfasado (`dia_05_3` vs `dia_05_2`) |
| 15 | Descarga de WhatsApp de 0 bytes aceptada por `cargar`. **Arreglado el 20/09 (J)** (`06a7de2`): se rechaza con el motivo (también < 1 KB) |
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
   **Arreglado el 20/09 (J)** (`06a7de2`): `cargar <narrador> uno.ogg dos.ogg` los
   pega con ffmpeg (demuxer concat, re-encodea a opus para que no queden saltos) en
   `audios-crudos/<narrador>/partes/` y sigue como con un solo archivo. Queda el
   lado del webhook (juntar notas seguidas del mismo día) para cuando Meta esté.

4. **16/09 · la repregunta salió en "usted" aunque el trato es "vos".** (Las 5 repreguntas del piloto salieron en usted: 5, 19, 22, 23, 25 — la última además con "sus nietos".) Al cargar la
   respuesta 5 el cerebro pidió repregunta (abuelo Roberto) y la escribió de usted:
   "Me quedé pensando en su abuelo... ¿Cómo llegó a usted esa historia...?". El
   trato no llega (o no se respeta) en `evaluarRespuesta` / el prompt de repregunta.
   *Hecho a mano*: se la pasé a vos para que Naza la pegue.
   **Arreglado el 20/09** (`ed513d8`): `PROMPT_EVALUAR` ahora recibe el trato y lo
   exige en la repregunta misma —"LA REPREGUNTA VA EN {trato}, SIN EXCEPCIÓN, con
   sus conjugaciones"— con los ejemplos en tuteo y la prohibición de "cuénteme",
   "usted", "su", "sus" cuando el narrador es de vos. Test en
   `test/cerebro.test.ts` («el trato de la repregunta que escribe la evaluación»).

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
    **Arreglado el 20/09** (`d230473`): `PROMPT_EVALUAR` ahora prohíbe insistir en
    lo que el narrador esquivó ("una sola invitación alcanza, y ya se hizo") y la
    personalización no repite lo recién contestado. Test en `test/cerebro.test.ts`.
    El conteo con datos (cuántas repreguntas por narrador y en qué capítulos)
    queda para mirarlo con el próximo piloto.

12. **16/09 · Joaquín no tiene guion propio en `preguntas`.** Lo creó `manual crear`,
    que no copia las 26 fijas ("se usan solas como plantilla"), a diferencia del
    checkout que sí las copia (CONTRATO: guion por narrador). Funciona para la
    puerta manual, pero desde el panel no podría editar/sacar preguntas (no hay
    filas suyas) y el backfill de la migración 20260912 no lo alcanzó (fue creado
    después). *Para repasar*: que `crear` copie las fijas igual que la compra.
    **Arreglado el 20/09 (J)** (`06a7de2`): `crear` copia la plantilla como guion
    propio (misma regla que `web/src/app/api/guion/route.ts`), y `guion <narrador>`
    lo hace para uno viejo. De yapa: el reemplazo de capítulo en `siguiente` solo
    funcionaba con la fila global; ahora también reescribe la fila propia (como
    `preguntar.ts`).

13. **16/09 · sensación de que "la infancia se alarga".** Las preguntas 5-7 son del
    capítulo "Las raíces" (abuelos, hermanos, tradiciones), pero la personalización
    vuelve una y otra vez a los detalles de la infancia ya contados (Pelliza, las
    milanesas, el ring con el hermano). No es un error del guion; es el prompt de
    `personalizar.ts` anclando demasiado en lo previo. *Para repasar*: pedirle que
    ancle en UNA cosa, no en tres, y que nombre el tema nuevo primero.
    **Arreglado el 20/09** (`d230473`): el prompt de personalización prohíbe preguntar
    lo que acaba de contestar y manda reemplazar esa parte por lo que quedó
    abierto, con el ejemplo real de Ciro ("no salíamos los tres juntos, creo que
    nunca"). Test con el caso literal en `test/personalizar.test.ts`.

14. **16/09 · `✖ Claude no devolvió texto` al evaluar la respuesta 7** (y otra vez el 17/09 en la 13, la 20 y la 30: 4 de 30 — no es un caso raro). La respuesta
    se subió, se insertó y se transcribió bien (34 s, corta); la llamada de
    evaluación (`evaluarRespuesta`, `src/ia/cerebro.ts`) volvió sin texto y
    `cargar` cortó ahí. `estado` la marca como "respuesta corta sin repregunta
    anotada". No se reintentó (reintentar `cargar` duplicaría la respuesta).
    *Para repasar*: (a) que un fallo del modelo en la evaluación no aborte — hoy el
    código dice que ante duda es "suficiente", pero eso aplica al JSON ilegible, no
    a la respuesta vacía; (b) un comando `evaluar <narrador> --orden N` para
    reintentar solo la evaluación.
    **(b) hecho el 20/09 (J)** (`06a7de2`): `evaluar <narrador> [--orden N] [--solo-ver]`
    reevalúa la respuesta principal ya cargada (sin subir ni transcribir) y anota lo
    mismo que `cargar`: repregunta, reserva y tema evitado.
    **Arreglado el 20/09** (`f76da1f`): `evaluarRespuesta` reintenta UNA vez con
    ~2 s de pausa y, si vuelve a fallar, devuelve `{ suficiente: true }` con un
    `console.warn`. Nunca lanza: ni con la respuesta vacía ni con un error de la
    API. Queda el punto (b): el comando `evaluar --orden N` vive en
    `scripts/manual.ts` → **para Joaquín**.

15. **16/09 · descarga de WhatsApp de 0 bytes.** `JOAQUIN RESPUESTA 7.ogg` bajó
    vacío la primera vez (Naza lo guardó antes de que WhatsApp terminara). `cargar`
    debería rechazar archivos de 0 bytes con un mensaje claro en vez de subirlos.
    **Arreglado el 20/09 (J)** (`06a7de2`): `motivoParaRechazarAudio` en
    `src/manual/puro.ts` — 0 bytes o menos de 1 KB se rechazan antes de tocar
    Storage, con el motivo.

16. **16/09 · la personalización depende 100% de lo dicho; una corrección posterior
    no pisa lo anterior.** Pregunta de Naza: "si hubiese dicho que a los 12 se mudó,
    ¿preguntaría distinto?" Sí — usa `resumenesCapitulos` + respuestas previas +
    ficha. Pero si el narrador corrige un dato viejo ("no, a los 12 ya estábamos
    en otro lado"), el resumen del capítulo anterior sigue diciendo lo viejo y no
    hay regla de "lo último manda". *Para repasar*: al regenerar resúmenes, pasar
    también las respuestas posteriores del mismo tema, o marcar correcciones.
    **Arreglado el 20/09** (`a251bd2`): la memoria de capítulos ahora guarda, por capítulo, hasta
    qué `orden` entró en el resumen (`contexto.resumenesHasta`) y lo rehace cuando el
    narrador contó ALGO MÁS de ese capítulo —lo miran `materialDeCapitulo` y
    `memoriaDeCapitulos` en `entrevistador/src/ia/resumenes.ts`—. El prompt del resumen
    suma la regla explícita: *"LO ÚLTIMO MANDA: si algo de más adelante corrige o
    contradice algo de más atrás, quedate con lo ÚLTIMO y descartá el dato viejo"*, y
    el material se pasa en orden cronológico justamente para que se vea. Los resúmenes
    que ya existían sin marca se rehacen una vez (costo: ~USD 0,01 por capítulo) y
    quedan al día. La marca es `{orden, respuestas}` y no solo el orden: una corrección
    puede llegar como AMPLIACIÓN (repregunta) de la misma orden, y ahí el número no
    cambia aunque el material sí (lo cazó la revisión del 20/09; con el orden solo, ese
    caso quedaba viejo para siempre). Tests en `test/resumenes.test.ts`.

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
   **Arreglado el 20/09** (`ed513d8`): cuando la personalización no devuelve algo
   válido y el narrador es de vos, antes de mandar el original (que está escrito
   de usted) se hace un SEGUNDO intento con un prompt más corto
   (`PROMPT_PERSONALIZAR_BREVE`): mismas preguntas, todo en vos, máximo 40
   palabras. Si tampoco sale, manda el original y lo dice el motivo. Test en
   `test/personalizar.test.ts`. Queda pendiente el caso de la orden 26 ("ni
   siquiera se intentó personalizar"): eso vive en `preguntar.ts`/`manual.ts` →
   **para Joaquín**.
   **Orden 26 arreglada el 20/09 (J)** (`b3f0a31`): no era que no se intentaba —
   el prompt dice "si no hay nada concreto para enganchar, devolvé el original", y
   para la 26 ("cuénteme su vida en cinco minutos") el modelo devolvió el original
   textual… escrito de usted. `personalizarPregunta` ahora trata ese caso, con un
   narrador de vos, igual que un fallo: va al prompt corto, que la pasa a vos. Con
   usted el original textual sigue siendo válido (no paga un segundo intento).

19. **17/09 · el narrador dice "esto prefiero que NO vaya al libro" y nada lo
    registra.** Respuesta 12: "estas historias prefiero que queden en mi mente, no
    en mi biografía... locuras de las contables pueden ser por amor" y cuenta una.
    La transcripción entra entera al material del libro; el escritor no tiene señal
    de qué parte pidió reservar. *Para repasar*: que la evaluación detecte
    "no lo pongas / que no salga" y marque la respuesta (o el tramo) como
    `reservada`, y que la fábrica lo respete; hoy solo la dueña podría excluirla
    desde el panel (y `excluidas` se ignora por decisión del 13/09).
    **Arreglado el 20/09** (`82c77e6`):
    - La evaluación puede devolver `reservado: true` y `reservadoTramo: "…"` (regla
      nueva en `PROMPT_EVALUAR`, con las frases textuales de esta respuesta:
      "esto prefiero que no vaya al libro", "estas historias prefiero que queden en
      mi mente"...), y `reservaDe()` lo normaliza: si el tramo que marcó el modelo
      no está TEXTUAL en la transcripción, se reserva la respuesta entera.
    - Si el tramo marcado no aparece textual en la transcripción, la fábrica reserva la
      respuesta ENTERA (dirección prudente: se pierde material, no se publica lo reservado)
      y el aviso por consola ahora nombra el id de la respuesta, para poder encontrarla y
      volver a publicarla a mano.
    - La fábrica lo respeta en un solo lugar, `textoRespuesta` (`fabrica/src/libro/comun.ts`):
      el escritor no ve las respuestas reservadas (ni en el capítulo ni en "la
      historia completa") y el tramo se quita del texto. También quedan afuera del
      audiolibro híbrido (`historiasDelCapitulo`), de la muestra de audio del
      anticipo y de la lista de nombres para revisar (`estructura.ts`): un tramo no
      se puede recortar de una grabación.
    - Base: **propuesta** en `supabase/CONTRATO.md` + migración
      `20260920000100_respuestas_reservadas.sql` (`respuestas.reservada`,
      `respuestas.reservado_tramo`), **sin aplicar**: la aplica Naza cuando Joaquín
      dé el OK. El código funciona igual sin las columnas (ausente = nada
      reservado), así que aplicarla no puede romper nada.
    - **Falta para Joaquín** (y es lo que hace que todo esto sirva): el `UPDATE` en el
      flujo — después de evaluar, guardar `{ reservada: true, reservado_tramo: tramo }`
      de `reservaDe(evaluacion, transcripcion)` en la fila de `respuestas`
      (`procesar.ts`). Sin eso la detección no llega a la base y el filtro de la
      fábrica es código muerto. Dos cosas más, de la revisión del 20/09: que la
      detección corra **también en las respuestas de repregunta** (hoy el bloque se
      saltea si `esRepregunta`) y **en el cierre** (el `esOrdenDeCierre` corta la
      evaluación con `{suficiente:true}` sin llamar al modelo) — el narrador que dice
      "esto no lo pongas" en la ampliación o en el "¿faltó algo?" quedaría publicado.
      Y el `UPDATE` tiene que entrar JUNTO con la migración aplicada: sin la columna,
      PostgREST contesta 42703 y `trasResponder` no tiene try/catch propio.
    - **Lo que quedó afuera de la detección** (revisión del 20/09, verificado en el código):
      `procesar.ts:232` saltea toda la evaluación cuando la respuesta es la ampliación de una
      repregunta, y `procesar.ts:243-245` corta con `{suficiente:true}` cuando el orden es la
      pregunta de cierre — en los dos casos el modelo nunca ve la transcripción, así que un
      "esto no lo pongas" o un "vamos por otro lado" ahí no se anotan y eso se publica. La
      puerta manual tiene el mismo hueco (`scripts/manual.ts`, `trasResponderManual`: si
      `esRepregunta`, no llama a `evaluarYAnotar`). **Listo para que Joaquín lo enchufe**:
      `detectarReservaYDejarTema(transcripcion, trato)` (`entrevistador/src/ia/cerebro.ts`,
      `5bbfcb9`) hace UNA llamada corta que devuelve solo `reserva` y `dejarTema`, sin juzgar
      la respuesta — así no se puede colar una repregunta de más en el cierre —, nunca lanza.
      **Enchufado el 20/09 (J, `a95209d`)**: en `trasResponder` las marcas salen de la evaluación
      cuando la hay y de `detectarReservaYDejarTema` cuando no (ampliación, "no tuvo", cierre),
      y se anotan las dos en un solo lugar al final del paso 6. La puerta manual igual
      (`anotarMarcas`, compartido por `evaluarYAnotar` y la rama `esRepregunta`). Tests
      (c5 bis/ter/quater) en `test/procesar.test.ts`: en la respuesta normal NO se paga la
      llamada extra
      (reintenta una vez y devuelve "sin marcas") y cuesta ~USD 0,01 por ampliación. Los dos
      caminos son el mismo `await` + `guardarReserva` que ya está hecho para la principal. Tests del entrevistador en
      `test/cerebro.test.ts` y de la fábrica en `test/comun.test.ts` y
      `test/conectores.test.ts`.
    - **Hecho el 20/09 (J)** (`f2686b2`, `8e7bbfe`): `guardarReserva` en
      `src/db/respuestas.ts`, llamado desde `procesar.ts` (audio y texto) y desde la
      puerta manual (`cargar`, `responder-texto`, `evaluar`). Si la migración no
      está aplicada, PostgREST contesta "column does not exist": se avisa por
      consola y el día sigue (la reserva se anota a mano). **Joaquín da el OK a la
      migración `20260920000100_respuestas_reservadas.sql`** — nada del código la
      necesita para funcionar, así que se puede aplicar cuando Naza quiera.

20. **17/09 · la pregunta fija supone un guion de vida que no es el del narrador.**
    Orden 14 original: "¿cómo fue la propuesta de casamiento y el día de la boda?";
    orden 15 personalizada: "¿qué le dirías a un nieto sobre cómo se quiere a
    alguien toda la vida?". Joaquín tiene 28, no está casado y contó una relación
    que "terminó". Las 26 fijas están pensadas para un abuelo; la personalización
    suaviza pero arrastra la premisa (nieto, toda la vida). Con un narrador joven o
    soltero/viudo/separado hay que tener reemplazos por capítulo (`capituloNoAplica`
    existe pero no se disparó acá). *Para repasar*: criterios de "no aplica" más
    finos que capítulo entero, usando la ficha (edad, estado civil) y lo contado.
    **Arreglado el 20/09** (`d230473`): en lo que se le pide al modelo, ya no se da por
    sentado boda, hijos ni nietos, y no se pregunta por lo que el narrador negó,
    ni como condicional ("¿y si hubieras tenido...?"). Tests con los casos reales
    ("¿qué se siente ser abuelo ahora?" a un narrador de 28) en
    `test/personalizar.test.ts` y `test/adaptativas.test.ts`. El criterio fino de
    "no aplica" por edad/estado civil sigue en `preguntar.ts` → **para Joaquín**.
    **Criterio estructural el 20/09 (J)** (`c2623fd`, `06a7de2`): `capituloNoAplica`
    mira la ficha además del árbol — con `anioNacimiento`, menor de 25 sin hijos
    cargados → «Los hijos» se reemplaza sin preguntar; menor de 18 sin pareja →
    «El amor» también. Los umbrales son bajos a propósito ("ante la duda, no toca
    nada": a los 28 se puede tener hijos y ficha vacía); para un piloto como Joaquín
    la forma explícita es `ficha joaquin --hijos no --pareja no`, que anota `'no
    tuvo'` igual que la compra. **Estado civil**: la ficha no tiene el campo (ni el
    checkout lo pide) — si lo queremos como criterio, es un campo nuevo en
    `docs/ficha-del-narrador.md` y en el registro de la web, decisión de los dos.

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
    **Arreglado el 20/09** (`d230473`): la regla prohíbe la pregunta-condicional sobre
    algo que no se sabe o que el narrador negó. Que `capituloNoAplica` se dispare
    con la ficha (y no pregunta por pregunta) sigue en `preguntar.ts` →
    **para Joaquín**.

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
    **Arreglado el 20/09** (`d230473`): las reglas nuevas prohíben dar por hecho
    hijos/nietos y repetir lo ya contestado ("cómo es cada uno ya lo hablamos"),
    en la personalización y en las 4 finales. Tests en `test/personalizar.test.ts`
    y `test/adaptativas.test.ts`.

25. **17/09 · la pregunta que se le mandó no es la que quedó en la base.** La 21 se
    reemplazó a mano (ver #24) pero en `contexto.preguntasEnviadas[21]` y en
    `envios` quedó la generada ("¿cómo fuiste como padre?"); la respuesta se cargó
    contra ese texto y el libro/panel van a mostrar una pregunta que Joaquín nunca
    recibió. *Para repasar*: `siguiente --texto "..."` (o un `corregir-pregunta`)
    que anote lo que realmente se mandó; y en general, que el panel muestre la
    pregunta enviada, no la del guion.
    **Arreglado el 20/09 (J)** (`06a7de2`): `siguiente <narrador> --texto "..."`
    manda ese texto y lo anota en `contexto.preguntasEnviadas[orden]`;
    `corregir-pregunta <narrador> --texto "..." [--orden N]` lo corrige después.
    `cargar`, `responder-texto` y `evaluar` evalúan contra la pregunta enviada, no
    contra el guion (era también parte del #18 en la puerta manual). El panel ya
    mostraba la enviada desde el 14/09.

26. **17/09 · "regálenos" en la pregunta 24.** La personalización en vos deja un
    "regálenos" (ustedes/nosotros formal) en medio de una pregunta tuteada. Mismo
    tipo de mezcla que "cuéntame" en la 20 (#23): el modelo respeta el vos en los
    verbos principales pero se le escapan formas de la fija original.

27. **17/09 · "si tus nietos escucharan esto..." (pregunta 25) a un narrador sin
    hijos.** La fija del capítulo final se personalizó bien en el resto, pero
    conserva "tus nietos" con la ficha diciendo "no tiene hijos". Se manda igual
    (el mensaje al futuro tiene sentido) pero corregido a mano: "quienes vengan
    después de vos".
    **Arreglado el 20/09** (`d230473`): la regla de no suponer la vida del guion
    incluye los nietos ("nada de \"tus nietos\", \"el día de la boda\", \"los domingos en
    familia\"") en la personalización y en las 4 finales, con test.

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
    **Arreglado el 20/09** (`f76da1f`): `generarPreguntasAdaptativas` reintenta con
    pausa (2 s), avisa por consola y ya NO lanza: si el modelo no devuelve las 4,
    la entrevista sigue y el cierre sale igual. `preguntar.ts` (Joaquín) ya las
    reintenta sola cuando le piden la orden siguiente. Queda el lado de
    `siguiente`/`ultimaOrdenDelGuion` en `scripts/manual.ts` → **para Joaquín**.
    **Puerta manual arreglada el 20/09 (J)** (`06a7de2`): `ultimaOrdenDelGuion` usa
    `ultimoOrden()` de `src/db/guion.ts` (el guion propio, sin el `.or()` que
    mezclaba la plantilla), y `asegurarAdaptativas` genera las 4 al responder la
    última que exista — desde `cargar` y desde `siguiente`, así un fallo del modelo
    en el primer intento no deja la entrevista terminada en 26. Se fueron
    `ULTIMA_FIJA` y `PRIMERA/ULTIMA_ADAPTATIVA` del script.

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
    **Arreglado el 20/09** (`d230473`): `PROMPT_EVALUAR` dice ahora que un pedido de
    dejar el tema vuelve la respuesta suficiente y que no hay repregunta sobre
    eso —ni para retomarlo "de otra manera"—, y que si esquivó la pregunta no se
    insiste en lo que esquivó. Test en `test/cerebro.test.ts`.

- **(Ciro, la repregunta pide lo que el narrador YA contó)** → vive en `docs/piloto-errores-ciro.md`, entrada **C1**,
  con la versión al día. Estaba acá como «31», número que en esta bitácora ya usa otro
  hallazgo: se movió el 23/09 para que «31» signifique una sola cosa.

- **(Ciro, dar por muerta (o viva) a alguien que no dijo si vive)** → vive en `docs/piloto-errores-ciro.md`, entrada **C2**,
  con la versión al día. Estaba acá como «32», número que en esta bitácora ya usa otro
  hallazgo: se movió el 23/09 para que «32» signifique una sola cosa.

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
    **Arreglado el 20/09** (`f76da1f`) el DISPARADOR: como `evaluarRespuesta` ya no
    puede lanzar, el flujo llega al bloque de cierre aunque el modelo falle — en
    automático `cerrarBitacora` manda la despedida, pone `completado` y la fábrica
    manda el mail "terminó". Queda **para Joaquín** el lado de la puerta manual
    (`scripts/manual.ts`): que `cargar` con la respuesta 30 no dependa de que
    alguien corra `cerrar` para dejar el estado y la despedida.
    **Puerta manual arreglada el 20/09 (J)** (`06a7de2`): al cargar la respuesta a la
    última pregunta que exista (`cargar` o `responder-texto`), imprime la despedida,
    pone `completado` y registra el envío `despedida` — lo mismo que `cerrar`, que
    sigue existiendo por si hace falta a mano. Si de esa última salió una
    repregunta, avisa y cierra al cargar la respuesta con `--repregunta`.

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
    **Arreglado el 20/09** (`a251bd2`): `mandarHito` devuelve `false` sin mandar nada
    si el candado del hito ya está en Storage. La rama de los 30 días sigue haciendo
    el CAS y cerrando el libro (eso lo decide `libro_aprobado_at`, no el mail), pero
    el mail no vuelve a salir. Test en `fabrica/test/worker.test.ts` («con el candado
    sembrado y el libro abierto, cierra a los 30 días pero NO manda el mail»).

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

- **(Ciro, pregunta por la infancia como si hubiera sido un lujo)** → vive en `docs/piloto-errores-ciro.md`, entrada **C3**,
  con la versión al día. Estaba acá como «33», número que en esta bitácora ya usa otro
  hallazgo: se movió el 23/09 para que «33» signifique una sola cosa.

- **(Ciro, la repregunta insiste donde pidió cambiar de tema)** → vive en `docs/piloto-errores-ciro.md`, entrada **C4**,
  con la versión al día. Estaba acá como «34», número que en esta bitácora ya usa otro
  hallazgo: se movió el 23/09 para que «34» signifique una sola cosa.

- **(Ciro, la personalización repite lo recién contestado)** → vive en `docs/piloto-errores-ciro.md`, entrada **C5**,
  con la versión al día. Estaba acá como «35», número que en esta bitácora ya usa otro
  hallazgo: se movió el 23/09 para que «35» signifique una sola cosa.

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
    **Arreglado el 20/09** (`a251bd2`): el tope de 50 MB por archivo deja de vivir solo en el
    completo. `fabrica/src/audio/audiolibro.ts` tiene `entraEnStorage`/`enMb`/
    `esErrorDeTamano` y **las dos subidas lo miran**: un capítulo que no entra tira con
    el tamaño y el tope en el mensaje ("No entra en Storage: … pesa 50.0 MB y el tope
    por archivo es 50.0 MB") en vez del texto crudo de Storage, y el completo sigue
    siendo opcional (se entrega por capítulos con aviso). El ensamblado ya no se puede
    caer por tamaño sin decir por qué. Tests en `fabrica/test/audiolibro.test.ts`.
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

## Ciro / Angel Fernandez (segundo narrador de prueba)

Sus hallazgos viven en **`docs/piloto-errores-ciro.md`** (entradas C1-C13), archivo
aparte por pedido de Naza (22/09): esta bitácora ya existía en tres versiones
distintas entre ramas, con los mismos números usados para cosas diferentes. Con
numeración propia no puede chocar al mergear.

Lo más grave de ahí, por si se lee solo esto: **C6** el biógrafo pone los recuerdos en
la ciudad equivocada (3 de 3, reproducido contra `main` al día el 22/09), **C8** la
puerta manual quedó rota entera porque `tsc` no mira `scripts/` (tercer bug de esa
misma causa) y **C3** pregunta por una infancia dura como si hubiera sido un lujo.

## El libro terminado, leído por su narrador (23/09) — los tres del producto

> Joaquín leyó su propio libro y dijo tres cosas. **Es el primer feedback del producto
> terminado por quien lo protagoniza**, y vale más que cualquier revisión nuestra. Lo
> bueno primero: *"está bien contado, tiene estructura"*, el libro le gustó.

40. > ⚠ **Esta entrada llegó a una conclusión EQUIVOCADA y la corrige la 43.** El párrafo no
    > era de Joaquín: era un audio de Ciro cargado en su orden 27. Se verificó contra la base,
    > que estaba mal, y se le dijo al narrador que se equivocaba. Se deja el texto de abajo
    > como estaba porque es la lección: verificar contra la transcripción confirma la mentira.

    **23/09 · GRAVE que resultó FALSO · "hay un párrafo que se lo inventó".** El párrafo
    señalado: *"Me acuerdo también que jugábamos mucho con unos muñecos, unas figuras de
    plástico, ahí en el balcón. A la siesta hacíamos mucho ruido y no dejábamos dormir a
    nadie, por eso nos retaban siempre. Nos gustaba tirar cosas por el balcón. Y jugábamos
    con un perrito que teníamos."* **Verificado contra las 35 transcripciones: NO es
    inventado, es casi literal de su respuesta 27**, donde dijo exactamente eso — y el
    libro encima le sacó una repetición que el audio tenía. Lo único que el modelo agregó
    es una **fusión**: él contó los muñecos por un lado y el balcón por otro, y el libro
    los unió en *"con unos muñecos… ahí en el balcón"*. Un detalle que nunca afirmó.
    *Lo que hay que arreglar*: no es la regla "no inventes NADA" (existe y se respetó),
    es una nueva — **no juntar en una sola escena dos cosas que contó por separado**.
    *Lo que no es de código*: el narrador **no reconoció sus propias palabras**. Contestó
    35 veces en días; no se acuerda de cada frase. Que sienta que le inventaron cosas es
    un problema de confianza que ningún prompt arregla, y hay que tenerlo en cuenta al
    entregar el libro.
    *Lección de método*: si creíamos el reporte y "arreglábamos" el editor, rompíamos algo
    que funciona. **Un hallazgo sobre el libro se verifica contra las transcripciones antes
    de tocar nada.**
    *Sin cerrar*: el texto que él leyó y el que está guardado hoy **no son iguales** — el
    guardado NO tiene la fusión. El libro se entregó el 19/09 y se reescribió el 21/09 11:12,
    así que probablemente esté leyendo el PDF viejo. Que lo baje de nuevo y mire ese párrafo.
    *De paso*: bajo la orden 27 hay DOS respuestas de audios distintos (`dia_27.ogg` los
    muñecos, `dia_27_2.ogg` el padre en Chile). La que contesta la 27 es la segunda; la
    primera quedó archivada donde no va — mismo problema que el C7 de Ciro. El libro igual la
    puso en «La infancia», que es donde va: el rescate por historia completa funcionó.

41. **23/09 · el libro repite: dos oraciones dicen lo mismo, con las mismas frases.** Si en
    el audio lo dice dos veces, el libro lo pone dos veces. *Causa estructural*: el escritor
    (`fabrica/src/libro/escribir-capitulo.ts`) recibe el material DOS veces —el material
    principal del capítulo Y la historia completa, con la instrucción de traer de ahí lo que
    pertenezca al capítulo— y **ninguna regla dice qué hacer cuando algo viene repetido**. La
    regla 2 lo empuja a conservar: *"tu trabajo es ordenar y pulir apenas, no redactar
    bonito"*. En un audio de gente mayor repetir es lo normal: se repite para enfatizar o al
    retomar el hilo. Le pedimos fidelidad y nadie le dijo que fidelidad no es transcripción.

42. **23/09 · el guion no cubre la vida adulta.** Reparto real de las 26 fijas: La juventud
    5, La infancia 4, Las raíces / El amor / El oficio / Los hijos / La sabiduría 3 cada
    uno, Las pruebas 2. **Infancia y juventud se llevan 9 de 26.** Todo lo que pasa entre
    los 30 y los 60 —trabajo, hijos creciendo, mudanzas, pérdidas— entra en "El oficio" y
    "Los hijos": seis preguntas. Lo dijo Joaquín, que tiene 28 y no lo sufrió: *"a una
    persona de 60 siente que le falta preguntarle por sus 30/40… ahonda mucho en temas en
    vez de ocuparse de más etapas de la vida"*. El target del Familiar es 60+.
43. **17/09 · GRAVÍSIMO · un audio de Ciro se cargó en Joaquín, y su historia entró al
    libro de otro.** Lo encontró **Naza yendo al audio**: el párrafo que Joaquín marcó como
    inventado (los muñecos, el balcón, el perrito) **no es de él — la voz es de Ciro**.
    *Verificado en la base*: `Ciro/dia_03.ogg` (38 s, orden 3, cargado 17:06) y
    `Joaquin/dia_27.ogg` (38 s, orden 27, cargado **17:08**) tienen la transcripción idéntica
    palabra por palabra. Ese día se cargaban los dos pilotos en paralelo. A las 17:16 se
    cargó en la orden 27 de Joaquín el audio correcto (el padre que se fue a Chile), marcado
    como repregunta: quien cargaba se dio cuenta, **pero el malo quedó en la base** y su
    material entró al libro, capítulo «La infancia».
    *Alcance medido*: **uno solo en 83 respuestas**. Se compararon todas contra todas (3.403
    comparaciones): ningún otro cruce, en ninguna dirección, y ningún duplicado dentro del
    mismo narrador. La otra coincidencia de duración (Ciro 4 / Joaquín 28, 49 s) es
    casualidad: los textos son distintos.
    *También está en el AUDIOLIBRO* (23/09, **confirmado escuchándolo, Naza**): la voz de Ciro
    suena en `audiolibro_cap_07.mp3` («Las pruebas»). El audiolibro elige los audios por nombre
    (`dia_27*.ogg` en la carpeta del narrador, `fabrica/src/audio/audiolibro.ts`), no por la
    tabla — así que el texto de Ciro quedó en «La infancia» y su voz en «Las pruebas». Por eso
    descartar (`respuestas_descartadas`, 23/09) también MUEVE el audio a `descartadas/`.
    *No se corrige el libro de Joaquín*: es el socio probando (decisión de Naza, 23/09).
    *Hecho*: candado en la puerta manual (`src/db/duplicados.ts`): al cargar, compara la
    transcripción con las de los OTROS narradores y avisa con todas las letras si el audio ya
    está cargado en otro. Validado contra las 83 respuestas reales: encuentra el cruce
    conocido y **cero falsos positivos**. No borra ni corrige solo — el que carga tiene los
    dos audios a la vista y el script no.
    *Lo que más vale de acá*: **este error no lo detecta nadie**. Ni el modelo, que hizo bien
    su trabajo con el material que le dimos; ni la familia, que no estuvo en la entrevista.
    Solo el narrador, leyendo el libro terminado, cuando ya está impreso. Y cuando lo dijo,
    nosotros verificamos contra la base —que estaba mal— y **le dijimos que se equivocaba**.
    La lección: cuando un narrador dice "esto no lo dije yo", **se va al audio**, no a la
    transcripción.

## Producción / infra (no es del entrevistador, pero salió en el camino)

8. **15/09 · producción corría un build de 8 días** mientras `main` tenía todo el
   panel nuevo; Joaquín lo daba por deployado. Vercel no está conectado a git —
   cada deploy es manual (`vercel --prod` desde una worktree limpia). *Para repasar*:
   conectar Vercel a GitHub (`vercel git connect`) para que `main` deploye solo.

9. **15/09 · el webhook de MP no verifica la firma** (`MP_WEBHOOK_SECRET` cargado
   en Vercel pero el código no lo lee; Stripe sí verifica). **Arreglado el 16/09** (`web/src/lib/firma-mp.ts`): HMAC del manifiesto `id;request-id;ts`, 401 si no coincide. Requiere que `MP_WEBHOOK_SECRET` en Vercel sea la clave del webhook de **producción** (la que muestra el panel de MP al crear la notificación), no la de prueba.

## Revisión independiente del 20/09 (después de los arreglos)

Un segundo agente revisó el diff completo (los 5 commits, `41ca3e8..main`) buscando bugs
reales, no estilo. Lo que encontró y qué pasó con cada cosa:

- **ALTA — la reserva no se persiste** (hallazgo 19): `reservaDe()` no tenía llamadores de
  producción, así que todo el filtrado de la fábrica era código muerto. **Ya estaba anotado
  como pendiente de Joaquín**; la revisión lo confirmó y agregó el detalle de que también
  faltan las repreguntas y el cierre (ver la entrada 19), más la advertencia de aplicar la
  migración antes del `UPDATE`. `CONTRATO.md` se corrigió: antes decía que el flujo ya lo
  guardaba.
- **MEDIA — `reservaDe` perdía el pedido si el modelo devolvía el tramo sin el booleano**:
  arreglado el 20/09 (`a440cb3`). Ahora cualquiera de las dos marcas alcanza, y un
  `"reservado": "true"` (texto, que el modelo hace) también reserva.
- **MEDIA — `esPublicable` miraba solo `reservada`**: una reserva parcial cargada a mano (la
  columna se puede escribir desde la base) dejaba pasar el AUDIO completo al audiolibro y a
  la muestra. Arreglado el 20/09 (`a440cb3`): alcanza con el tramo para dejar el audio afuera.
- **MEDIA — la corrección que llega como ampliación no rehacía el resumen**: la marca miraba
  el `pregunta_orden` máximo, y una repregunta conserva el mismo orden. Arreglado el
  20/09 (`a440cb3`): la marca es `{orden, respuestas}`.
- **BAJA — `--regenerar` podía borrar un resumen ya pagado** si el modelo fallaba con otro
  capítulo: arreglado el 20/09 (`a440cb3`) — los resúmenes existentes se conservan siempre, y
  un capítulo que falla ya no se lleva puestos a los demás.
- **BAJA — `tieneAdaptativas` quedaba fuera del try** en `generarPreguntasAdaptativas`: una
  caída de la base ahí esquivaba el guard y tumbaba el cierre. Arreglado el 20/09 (`a440cb3`).
- **BAJA/duda — el tope de 50 MB estaba clavado en el código**: si el plan de Supabase cambia,
  una subida que antes entraba pasaría a fallar. Ahora se puede ajustar con
  `LIMITE_MB_ARCHIVO_STORAGE` (default 50).
- **Sin hallazgos**: el guard del candado en `mandarHito` (no bloquea ningún mail que debía
  salir: los seis candados son distintos y `terminado`/`libro_listo`/los recordatorios ya se
  chequeaban antes) y la compatibilidad hacia atrás sin la migración aplicada (nadie nombra
  las columnas nuevas en el `select *` de la fábrica, y son opcionales en `tipos`).
- **Duda que queda anotada (pre-existente, no de este diff)**: `contexto` lo escriben varios
  módulos con leer-modificar-escribir y hay ventanas en las que un cambio puede pisar a otro
  (ej. `mandarHito` lee el contexto, hace el POST a Resend y recién ahí escribe
  `mailsEnviados`). Es la razón que ya está escrita en `CONTRATO.md` para mudar esos textos a
  columnas propias. No se toca acá.

## Integración con el trabajo de Joaquín (20/09, tarde)

Sus 7 puntos llegaron en `ef0ff92` (sobre mi `dc55dbd`): 257 tests en el entrevistador y 336 en
la fábrica, `tsc` limpio en los dos, verificado acá corriendo las suites. Revisé sus cambios
en los tres archivos míos y están bien:

- `cerebro.ts`: `dejarTema` se sumó a la regla de "si pide cambiar de tema" (no la contradice:
  la respuesta sigue valiendo como suficiente y no hay repregunta) y a `Evaluacion`. La reserva
  y el trato quedaron intactos.
- `evitar.ts`: `sumarTemaEvitado` es puro, descarta temas largos (>120) y respeta los 1000 del
  panel (`EVITAR_MAXIMO` en `web/src/lib/guion.ts`), y no duplica lo que ya estaba.
- `personalizar.ts`: el "devolvió el original textual" se trata como fallo SOLO con trato de
  vos, dentro de `personalizarPregunta` y mandando al prompt corto (que él ya existía); dejó
  `esPersonalizacionValida` como estaba, así que el guardrail del guion firmado sigue con piso.

El hueco de arriba (ampliaciones y cierre) quedó cerrado el mismo 20/09 (J, `a95209d`). Falta que Naza aplique la migración
`20260920000100_respuestas_reservadas.sql` — es el último paso para que el 19 funcione punta a
punta.
