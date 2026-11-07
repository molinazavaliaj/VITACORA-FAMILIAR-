# Dudas para quien contó, arriba del PR 212: plan

Reemplaza a las tareas 2 a 6 de `2026-11-05-dudas-narrador.md`. La Tarea 1 (solo dudas reales, con Opus) ya está en esta rama.

**Por qué cambia.** El PR 212 de Joaquín (`privacidad-panel`) ya hace el momento 1: `/mis-respuestas/<token>` con audios y botón para sacar, 48 horas desde el último mensaje, link en el mensaje final, y `linkFinal` en el estado. Lo nuestro suma las dudas por WhatsApp. Decidido por Naza el 06/11: todas las dudas de un regalo van a quien contó, sin clasificador.

**Referencia.** La rama vieja `dudas-narrador` tiene una versión probada y revisada de casi todo (fábrica `b712d5eb`, `dda0043e`; entrevistador `01385b0f`, `18053abb`). Mirala con `git show` y reusá lo que sirva, tests incluidos.

## Reglas comunes

- No hay interruptor `DUDAS_AL_NARRADOR`. Como el 212, vale apenas se publica. «Privado» es `esPrivado(contexto)` del 212.
- Kids y Viaje no se tocan. «Para mí» recibe el WhatsApp de dudas, no el de sacar respuestas, y sigue teniendo su pantalla del panel.
- Plazos: la lectura espera 48 horas desde el último mensaje. Dudas: recordatorio a las 48 horas del aviso y plazo de 72 horas.
- Un mensaje que no salió nunca traba un libro.
- Sin el botón «Listo».
- Commits en castellano rioplatense con `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`, `git add` con rutas explícitas. No correr nada contra producción ni pagar llamadas. Nunca imprimir secretos.

## Tarea A: Fábrica

1. **Sacar el clasificador:** `asegurarDestinoDudas`, `dudasQueCuentan`, `dudasVisibles`, `clasificacionVigente`, `leerClasificacion`, `PROMPT_CLASIFICAR_DUDAS`, `avisarOcultasSinContestar`, `DESTINO_DUDAS` y sus llamadas en `libro-v3.ts`, `libro-historia.ts` y tests. Dejar `esPrivado` y lo de las 48 horas.
2. **Lectura con espera:** `revisarEtapaAV3` y `revisarEtapaA` de historia no lanzan la Etapa A mientras `esperaPorElNarrador(db, id) > 0`. El tick no paga la lectura antes de tiempo. En `escribirLibro*`, la espera del narrador ya está: comprobar que corre antes de leer el material, para que sacar todas las respuestas no deje el pedido en `fallido`.
3. **A quién le hablan:** `propia` es `esPrivado(contexto) || esLibroPropio(contexto)`, en V3 y en Historia. Las preguntas siempre usan el prompt para quien narra.
4. **Plazo de dudas:** archivo `dudas-narrador-avisadas.txt`, ISO, lo escribe el entrevistador. `esperaPorDudas` (V3 y Historia): con dudas sin contestar, plazo de 72 horas desde esa marca o, si nunca salió, desde `dudas-avisadas.txt`. Sin la marca del mail a socios, se escribe igual, para no trabar. `ESCRITOR_ESPERA_DUDAS_HORAS=0` no saltea este plazo.
5. **Las vueltas de espera:**
   - se vuelven a mirar cada 15 minutos, no al vencer toda la espera, para que la última respuesta libere el libro;
   - no gastan reintentos: borrar `erroresLibro` al volver a `pagado` por espera. Test de que alternar vueltas sanas y errores pasajeros nunca da `fallido`.
6. **Una Etapa A rehecha** deja vacía `dudas-narrador-avisadas.txt`, junto con `dudas-avisadas.txt`.
7. **Mails de quien regala** (`avisarDudasALaFamilia`):
   - nunca sale `dudas`;
   - `dudas_listas` solo si están todas contestadas o venció el plazo; `dudasParaLaFamilia` suma `plazoVencido`;
   - el texto de `dudas_listas` saca «Ya tenemos todas las respuestas. Gracias.» y empieza en «Falta un solo paso.».
8. **Mail a socios** (`avisarDudas`, V3 y Historia): «Se las mandamos por WhatsApp a quien contó. Espera hasta 3 días o hasta que estén todas contestadas.», sin la frase de la familia ni la de las 24 horas.
9. **`alertarLibrosDemorados`:** el reloj arranca después de las 48 horas y el umbral sube a 96 horas para privados (dudas más escritura). Texto corregido.

Tests: `cd fabrica && npx vitest run`, `npx tsc --noEmit -p .`. En esta máquina pueden fallar `bookmundo` y `escritor-kids/armado` por falta de Chromium, y `viaje-v2-simulacion` por tiempo.

## Tarea B: Entrevistador

**Archivos:** `entrevistador/src/flujo/revision-narrador.ts`, `revision-narrador-textos.ts`, `test/revision-narrador.test.ts`, `src/config.ts`, `src/variables.ts`, `src/flujo/control-plantillas.ts`, `src/flujo/scheduler.ts`, `src/v3/enviar.ts`, `src/historia/enviar.ts`, migración de `envios_tipo_check`, CONTRATO.

- `PLANTILLAS_REVISION` y las entradas `<idioma>:revision`, `<idioma>:dudas_narrador`, como en `18053abb`. La plantilla manda `[como_le_dicen]` y el botón usa `firmarTokenRespuestas(id, ahora)` del 212 como sufijo. El texto con link dentro de la ventana usa `{base}/mi-historia/{token}`.
- **Dudas:** `queMandar` solo devuelve `dudas` o `recordatorio`. Con todos los filtros de `18053abb`: pedidos cerrados, `fallo-A.json`, `trabajando.json` con latido reciente, `dudas-avisadas.txt` de más de 72 horas sin aviso, Historia con `ESCRITOR_HISTORIA` (anotado en CONTRATO), horario de 9 a 21 con zona por idioma si hace falta, y la toma con `upsert:false` y vencimiento de 30 minutos. Vale para privados y para «Para mí».
- **Link al terminar con la ventana cerrada:** en `mandarLinkAlTerminar` (V3) y su par en Historia, con la ventana cerrada, si la plantilla `revision` está lista, el plazo de 48 horas no venció y `esPrivado`, mandar la plantilla y marcar `linkFinal`. Sin plantilla, seguir avisando a socios como hoy. Si el plazo ya venció, no mandar.
- `FIRMA_TOKENS` se pide en `variables.ts` siempre.

Textos de dudas dentro de la ventana, como en `18053abb`. Tests: `cd entrevistador && npx vitest run`, `npx tsc --noEmit -p .` (un error en `src/sentry.ts` es previo).

## Tarea C: Web

**Archivos:** `web/src/app/mi-historia/[token]/page.tsx`, `pantalla.tsx`, `web/src/app/api/mi-historia/[token]/dudas/route.ts`, `web/src/lib/dudas-guardar.ts`, `web/src/lib/mi-historia-textos.ts`, `web/src/lib/dudas-archivos.ts`, `web/src/app/api/dudas/route.ts`, `web/src/app/api/invitados/route.ts`, y lo del panel que hoy usa `dudasQueVe`.

- **Puerta `/mi-historia/<token>`:** verifica con `verificarTokenRespuestas`. Inválido o vencido, el mismo mensaje que `/mis-respuestas`. Con dudas sin contestar y `carpeta-A.json`, muestra las dudas. Con `libro.md`, «Tu libro ya está escrito.». Terminadas, gracias. En cualquier otro caso, redirige a `/mis-respuestas/<token>`. Sin índice, sin referrer, sin caché. Un GET nunca escribe.
- **Pantalla de dudas:** una por vez, «Pregunta 2 de 8», sus frases, opciones con botones de 48 px, campo, «No me acuerdo», «Seguir». Guarda en cada paso y al volver abre en la primera sin contestar. Con `esPropia`, al final un botón a `/tablero/{id}/libro`.
- **`NO_ME_ACUERDO = "No se acuerda. Queda como lo contó."`** cuenta como contestada.
- **API:** `POST /api/mi-historia/[token]/dudas` con `{ correcciones }`, verifica el token cada vez, valida con `validarCorreccionesFamilia`, guarda con autor `{ quien: como_le_dicen }` usando `guardarRespuestasDudas`, extraído de `api/dudas`. Con libro escrito, 409.
- **Quien regala:** `dudasQueVe` y `dudasParaQuienRegala` desaparecen, junto con `dudas-destino.json` y los textos o parámetros que queden sin uso. Con `loContadoEsPrivado`, y para dueña e invitados, `/tablero/{id}/dudas` redirige a la historia, `POST /api/dudas` da 404 sin escribir, `api/invitados` con la entrevista terminada da 400. El panel y `libro/page.tsx` muestran `textoQuedanPreguntas` sin link: «A {como} le queda una pregunta por contestar.» / «A {como} le quedan {n} preguntas por contestar.». Sumar `cuantasDudasPendientes`. El contenido de las dudas nunca sale al navegador de quien regala.
- **Textos** en `mi-historia-textos.ts`, por `ar`, `es`, `ca`. es-AR:
  ```text
  Unas últimas preguntas
  Son cosas que no entendimos bien. Lo que nos digas entra al libro.
  Pregunta {n} de {total}
  Lo que dijiste
  Escribí acá, o tocá el micrófono del teclado y dictalo.
  No me acuerdo
  Seguir
  Eso es todo. Gracias. Te avisamos cuando el libro esté listo.
  Elegir la tapa y encargar el libro
  Tu libro ya está escrito.
  ```

Antes de escribir páginas, leé `web/AGENTS.md` y `web/node_modules/next/dist/docs/`. Seguí el estilo de `web/src/app/mis-respuestas/[token]/`. Tests: `cd web && npx vitest run`, `npx tsc --noEmit -p .`, `npx next build` una vez.

## Cierre

Revisión final de otro agente sobre todo el diff contra `origin/privacidad-panel`; textos a Naza en tandas de 10, anotados en `docs/web-textos-v3/aprobados.md`; PR contra `privacidad-panel` o `main`, según esté mergeado el 212.

## Ajustes al cierre

- La regla es la del PR 214: solo ventas nuevas y el narrador elige. «Mi familia» sigue el flujo de hoy.
- La alerta de libros demorados en privados quedó en 120 horas, y 48 si ya no hay dudas.
- Si quien contó escribe por WhatsApp con dudas pendientes, recibe el link y los socios un aviso.
- Si vence el plazo sin respuesta, los socios reciben un mail y el libro sigue.
