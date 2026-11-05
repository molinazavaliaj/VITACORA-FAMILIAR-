# Revisión y dudas para quien contó (05/11/2026)

Estado: para aprobar por Naza. Rama `dudas-narrador`.

## Por qué

Con la opción A, quien regala no lee ni escucha lo que cuenta el narrador hasta que el libro esté listo. Las dudas rompen eso: las contesta la familia y traen citas textuales. Además, el botón «Que no vaya al libro» está en el panel de quien compra, así que el narrador se queda sin forma de sacar algo que contó hace tiempo.

La privacidad del panel y de los mails la hace Joaquín con otro pedido. Esto cubre solo las dudas y sacar respuestas.

## Qué cambia para cada uno

Vale para V3 y «Vitácora de una historia», con regalo o «Para mí». Kids y Viaje no cambian.

### Momento 1: termina la entrevista

1. Sale la despedida del bot y, enseguida, un WhatsApp con un link: terminamos la entrevista, si hay alguna respuesta que no querés que vaya al libro, acá podés quitarla.
2. El link abre su página, sin contraseña, con todo lo que contó: cada respuesta bajo su pregunta, en texto, con «Que no vaya al libro» (se puede deshacer).
3. Toca «Listo, no quiero sacar nada más», o pasan 2 días.
4. Recién ahí la fábrica lee el material (Etapa A). Así, sacar algo no paga una lectura de más.

Pasado ese momento, la parte de sacar respuestas se cierra en esa página.

### Momento 2: aparecen las dudas

Solo si la Etapa A dejó dudas reales. Sin dudas, no sale este mensaje.

1. WhatsApp con el mismo link: quedan unas últimas preguntas.
2. La página muestra una duda por vez, con botones si hay opciones, un campo para escribir y «No me acuerdo». Se puede dejar y seguir otro día. Muestra sus propias frases.
3. Si no contestó todo, a las 48 horas sale un recordatorio. A los 3 días del primer aviso el libro sigue igual.
4. «No me acuerdo» cuenta como contestada: el libro queda con lo que dijo.

### Quien regala

- Ve cuántas preguntas faltan, nunca cuáles.
- Sigue eligiendo la tapa y encargando, porque la compra está en su mail.
- Si encarga antes de que termine el narrador, el libro espera hasta que termine o venza el plazo.
- Deja de recibir el mail `dudas` con link. Deja de poder entrar a `/tablero/{id}/dudas` y de invitar familiares para contestar.
- `dudas_listas` sale cuando el narrador terminó **o** venció el plazo. Sin esto, un narrador que nunca contesta dejaría el libro trabado hasta los 30 días. Su texto cambia, porque hoy dice «Ya tenemos todas las respuestas».

### «Para mí»

Recibe los mismos dos mensajes. Al terminar las dudas ve un botón para elegir la tapa y encargar, que lo lleva a su panel y pide entrar a su cuenta.

## Solo dudas reales

Las 25 de Juan Domingo muestran el problema: algunas pedían contar más, y en otras el escritor ya sabía qué hacer («no agregar más», «no usar como nombre»).

**La regla.** Una duda es solo una de estas cuatro:
- un nombre o palabra que no se entiende;
- una fecha que no cierra;
- dos versiones distintas de lo mismo;
- dos personas que pueden ser la misma.

Si algo no lo contó, no se pregunta. Si dijo «creo que fue con Cámpora», el libro lo cuenta con su «creo» y no se pregunta.

**Dónde va.** En el paso que redacta las preguntas (`### Dudas para la familia` y `### Dudas para quien narra`), que también descarta las que no cumplen. No se toca el paso 1 del lector, para no cambiar el resto de la lectura. La frase «El libro lo pidió para sí» se cambia, porque ya no siempre es cierta. Siempre se usa la versión que le habla al narrador.

**Vara de prueba** (las 25 de Juan Domingo, una corrida):

| Resultado esperado | Dudas |
|---|---|
| Quedan | D01, D02, D03, D04, D06, D07, D08, D09, D11, D16, D18, D19, D20, D23 |
| Salen | D05, D10, D12, D13, D14, D15, D17, D21, D22, D24, D25 |

D15, D17 y D20 las ubiqué yo: Naza puede moverlas.

## Cómo se arma

**Link.** `/mi-historia/{token}`, con el token firmado por `FIRMA_TOKENS` (propósito `narrador`, sujeto el id del narrador, 90 días), como los demás links firmados. Cada POST lo verifica de nuevo. Sin índice de buscadores y sin referrer. Abrirlo no cambia nada, porque WhatsApp lo abre solo para armar la vista previa. Deja de servir cuando el libro está escrito.

**Sacar respuestas.** Reutiliza `aplicarFueraDelLibro` y `respuestas_fuera`, con un rol nuevo para el narrador. `marcada_por` ya admite null, así que no hace falta migración.

**Marcas en Storage**, en la carpeta del escritor (`escritor/` o `escritor-historia/`):

| Archivo | Lo escribe | Qué dice |
|---|---|---|
| `revision-avisada.txt` | entrevistador | cuándo salió el mensaje del momento 1 |
| `revision-lista.txt` | web | tocó «Listo» |
| `dudas-narrador-avisadas.txt` | entrevistador | cuándo salió el aviso de dudas |
| `dudas-recordadas.txt` | entrevistador | cuándo salió el recordatorio |

**Fábrica.**
- `revisarEtapaAV3` y `revisarEtapaA` de historia no lanzan la Etapa A hasta tener `revision-lista.txt`, o 2 días desde `revision-avisada.txt`.
- `escribirLibroV3` y su par de historia respetan la misma espera si encargan antes.
- `esperaPorDudas` cuenta 3 días desde `dudas-narrador-avisadas.txt`.
- Si el aviso nunca sale (sin plantilla, número bloqueado), se avisa a los socios y el plazo corre igual desde que la fábrica vio el caso. Un libro nunca queda trabado.

**Entrevistador.** El tick del scheduler manda los mensajes y escribe las marcas. Dentro de las 24 horas sale como texto normal; fuera, como plantilla con botón de URL. Respeta el horario del narrador.

**Interruptor.** `DUDAS_AL_NARRADOR=1` en Railway (fábrica y entrevistador) y en Vercel. Apagado, todo sigue como hoy. Los libros que ya tienen Etapa A al prender no pasan por el momento 1.

**Aviso en el chat.** Un mensaje del bot le avisa que si algo no quiere que vaya, lo diga en el momento. Se suma a uno que no sea plantilla, para no volver a aprobar la bienvenida en Meta. Hay que confirmar en cuál entra.

## Plantillas para Joaquín

Dos, en tres idiomas (6 en total), con botón de URL `https://www.vitacorafamiliar.com/mi-historia/{{1}}`. Los nombres son propuestos y los textos salen de la aprobación de Naza.

| Para qué | es-AR | es-ES | ca |
|---|---|---|---|
| Quitar respuestas, si la ventana de 24 horas ya se cerró | `revision_vos` | `revision_es_es` | `revision_ca` |
| Dudas y recordatorio | `dudas_narrador_vos` | `dudas_narrador_es_es` | `dudas_narrador_ca` |

Hasta que estén aprobadas, el momento 1 sale igual en casi todos los casos, porque el narrador acaba de escribir. El aviso de dudas suele caer fuera de la ventana: sin plantilla, no le llega y los socios reciben el aviso.

## Textos

Se aprueban en tandas de 10 y se anotan en `docs/web-textos-v3/aprobados.md`: mensajes de WhatsApp, página del narrador, cuenta de preguntas para quien regala y `dudas_listas`. Después, buscar lo viejo en todos los textos que ve una persona (`textoDudas`, `textoTodasContestadas`, `compartir.tsx`, `mail-textos.ts`, `avisarDudas`, invitaciones y términos).

## Riesgos aceptados

- Quien tenga el link lee todo lo que contó. Sale solo por su WhatsApp y deja de servir al escribirse el libro.
- Si el narrador no contesta, un nombre mal oído queda mal. Quien regala solo tiene la caja de «Correcciones» al encargar.
- El libro puede tardar hasta 5 días más, sin contar lo que tarda en escribirse: 2 de revisión y 3 de dudas.
- En «Para mí», sacar algo desde el panel después de la Etapa A sigue rehaciendo la lectura y puede renumerar las dudas, como hoy. No se toca acá.

## Pruebas

- **Token:** vencido, de otro narrador, de otro propósito, y libro ya escrito.
- **Espera de la Etapa A:** con «Listo», a los 2 días, sin aviso, y encargado antes.
- **Plazo de dudas:** recordatorio una sola vez, y sin recordatorio si ya contestó todo.
- **Quien regala:** no puede leer dudas ni por pantalla ni por API, ni invitar para contestarlas. «Para mí» sigue pudiendo.
- **Interruptor apagado:** todo igual que hoy.
- **Filtro:** corrida real contra la vara de arriba, con el costo avisado antes.

## Antes de publicar

Contar cuántos libros en curso ya tienen preguntas escritas para la familia y decidir si se rehacen.
