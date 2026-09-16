# Bitácora del piloto manual — errores y cosas raras para repasar

> Naza pidió (16/09) anotar TODO lo que salga mal o raro mientras se entrevista a
> los narradores de prueba por la puerta manual, para repasarlo junto al final.
> Una entrada por hallazgo: fecha · narrador · qué pasó · dónde está · qué se hizo.
> No se arregla nada acá; se anota. Los arreglos van a la lista de la revisión final.

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

4. **16/09 · la repregunta salió en "usted" aunque el trato es "vos".** Al cargar la
   respuesta 5 el cerebro pidió repregunta (abuelo Roberto) y la escribió de usted:
   "Me quedé pensando en su abuelo... ¿Cómo llegó a usted esa historia...?". El
   trato no llega (o no se respeta) en `evaluarRespuesta` / el prompt de repregunta.
   *Hecho a mano*: se la pasé a vos para que Naza la pegue.

5. **16/09 · `✖ mods.guardarRepreguntaEnviada is not a function`** al intentar
   anotar la repregunta en `envios`. `scripts/manual.ts` la llama pero
   `src/db/envios.ts` no la exporta en el checkout de ese momento (la sesión de
   hermes estaba a mitad de un cambio en la rama `trato-usted-o-vos`). Efecto: la
   repregunta NO quedó registrada en `envios` ni en `contexto`. *Para repasar*: ver
   si el commit final de esa rama la exporta; si no, agregarla.

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

14. **16/09 · `✖ Claude no devolvió texto` al evaluar la respuesta 7.** La respuesta
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
    "NASA" por Naza, "Herrera" por Herrero (en la pregunta 9 el biógrafo mismo
    había escrito "Herrero"). El prompt de transcripción lleva vocabulario
    rioplatense y la ficha, pero no los nombres que ya aparecieron en respuestas
    anteriores. *Para repasar*: sumar al `promptDeTranscripcion` los nombres
    propios detectados (amigos, lugares) de las respuestas previas; el paso de
    "revisar nombres" del panel es la red, pero mejor no ensuciar la fuente.

18. **16/09 · si la personalización falla, la pregunta original sale en "usted"
    aunque el trato sea "vos".** Orden 12: `personalizar` devolvió algo inválido
    ("no conservaba las preguntas del original") y `siguiente` mandó el texto fijo
    del guion — "cuénteme ESA historia... ¿Cuál es la suya?" — seguido del cierre
    en vos. Las 26 fijas están escritas de usted; el fallback debería pasarlas por
    el trato (o tener las dos versiones). *Hecho a mano*: la pasé a vos.

## Producción / infra (no es del entrevistador, pero salió en el camino)

8. **15/09 · producción corría un build de 8 días** mientras `main` tenía todo el
   panel nuevo; Joaquín lo daba por deployado. Vercel no está conectado a git —
   cada deploy es manual (`vercel --prod` desde una worktree limpia). *Para repasar*:
   conectar Vercel a GitHub (`vercel git connect`) para que `main` deploye solo.

9. **15/09 · el webhook de MP no verifica la firma** (`MP_WEBHOOK_SECRET` cargado
   en Vercel pero el código no lo lee; Stripe sí verifica). **Arreglado el 16/09** (`web/src/lib/firma-mp.ts`): HMAC del manifiesto `id;request-id;ts`, 401 si no coincide. Requiere que `MP_WEBHOOK_SECRET` en Vercel sea la clave del webhook de **producción** (la que muestra el panel de MP al crear la notificación), no la de prueba.
