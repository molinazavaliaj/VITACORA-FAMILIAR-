# Pase de manos — 07/10/2026: la entrevista V3 conectada al WhatsApp

Rama **`v3-produccion`** (worktree `C:\Users\Naza\Desktop\VITACORA FAMILIAR-v3-produccion`). Sale de `v3`, que ya tiene `main` adentro (merge `01329bb`, subido a `origin/v3`). Está pusheada y **sin mergear a `main`**.

- Diseño: [`docs/superpowers/specs/2026-10-07-entrevista-v3-whatsapp-design.md`](../superpowers/specs/2026-10-07-entrevista-v3-whatsapp-design.md).
- Plan: [`docs/superpowers/plans/2026-10-07-entrevista-v3-whatsapp.md`](../superpowers/plans/2026-10-07-entrevista-v3-whatsapp.md), 15 tareas.

## Estado verificado (07/10, head `a8e1606`)
- **Entrevistador:** 620 tests verdes. `tsc` limpio y `npm run build` OK.
- **Fábrica:** 1872 tests verdes y 1 rojo. El rojo es previo y no tiene que ver con esto: `test/escritor/cli.test.ts`, por los saltos de línea CRLF de Windows. `tsc` limpio.
- **Revisión:** cada tarea pasó su revisión, y hubo una revisión final de toda la rama con una tanda de arreglos (F1–F10) re-revisada.
  - Veredicto: **lista para mergear apagada** y **lista para la prueba con el número de Naza**.
- **Merge apagado:** sin la migración aplicada, o sin filas en `entrevistas_v3`, el entrevistador y la fábrica se comportan igual que hoy.

## Decisiones de Naza del 07/10 (no re-discutir)
| Tema | Decisión |
|---|---|
| Dora, Mariano | Pasan a la V3. Lo que contaron cuenta como contestado, según la tabla de equivalencias (**pendiente de su OK**). |
| Imma | Pasa a la V3 en catalán. |
| Usted → vos | Sin aviso. |
| Ritmo | Tandas por día: diario 4, dos por día 8, seguido sin tope. Silencio de 3' para cerrar una respuesta. |
| Texto escrito | Cuenta como respuesta. M22 sale una sola vez en toda la entrevista. |
| Si deja de contestar | No se reenvía la pregunta. M8 a los 2 días, una vez por pregunta. |
| Prueba real | Merge apagado. Primero el número de Naza, después Dora, Mariano e Imma, después los nuevos (`V3_PARA_NUEVOS`). |
| «Quiero parar» y «esto que no vaya al libro» | Se detectan con frases fijas, sin modelo (`pidePausa` / `pideReserva` en el núcleo, en es-AR, es-ES y ca). La pausa solo en un mensaje de hasta 15 palabras. El mensaje no se suma a nada (`∅`). Reserva: la abierta si tiene borrador, si no la última cerrada (`estado.reservadas` + `respuestas.reservada`; la fábrica la saca entera y tampoco va al cazador). Pausa: `activo → pausado`, lo abierto queda abierto. Si dice las dos cosas, se reserva y además se pausa. |
| Mensaje sin pregunta abierta | Se guarda aparte (`∅`): no se pega a ninguna respuesta y no sale nada, tampoco M22. Después de «Sí» sí hay pregunta abierta. |
| Pausado que escribe sin pregunta abierta | Se reactiva y le sale la siguiente en el momento, contando en la tanda de hoy (aunque esté en el tope). Con abierta, se le reenvía como siempre. |
| Preguntas de la familia agregadas después | Al abrir la tanda del día se suman a `estado.familia` (solo se agregan; editar o borrar no toca lo hecho). Si la entrevista ya llegó a FO1, no se suman y se avisa a los socios una vez. |

## Decisiones técnicas que tomó la sesión (el diseño manda sobre el plan)
- **La toma del turno:** solo la suelta quien la tomó, y se comparan instantes.
- **M8:** sale también a quien tocó «Sí» y no mandó audio.
- **El pase se niega** si:
  - hay un tramo reservado;
  - hay una pregunta vieja pendiente y algo para cargar;
  - hay respuestas sin equivalencia o sin texto.

  Las reservadas enteras no se cargan.
- **El lector de la fábrica** aplica las reservas hechas después, saca los globos del narrador de la charla y suma la reserva de la pregunta madre.
- **Nada se pierde en silencio:**
  - si falla la descarga o la transcripción, sale M23;
  - una reconciliación cada minuto levanta filas sin `clave_v3`;
  - `clave_v3 = '∅'` marca lo que se deja afuera a propósito (está en el CONTRATO).
- **Fuera de las 24 hs** la plantilla lleva solo la pregunta (900 caracteres como máximo). Al reabrirse la ventana se reenvía la pregunta con sus botones.
- **Un botón viejo** que no corresponde a la pregunta abierta no entra como respuesta.
- **El precio de Opus 5.5** se corrigió en los dos `costos.ts`.

## Pendiente por persona
**Naza**
1. Aprobar la tabla de equivalencias de Dora y Mariano (mensaje del 07/10 en el chat). Con el OK, se carga en `entrevistador/src/v3/equivalencias.json`.
2. Aplicar en Supabase la migración `supabase/migrations/20261007000000_entrevista_v3.sql` (es idempotente).
3. Aprobar los textos de abajo.

**Joaquín**
1. Revisar la rama `v3-produccion` antes del merge.
2. Cargar en Meta las plantillas:
   - `pregunta_diaria_es_es` y `pregunta_diaria_ca`;
   - `m8_vos`, `m8_es_es` y `m8_ca`, con los textos aprobados.
3. Cuando Meta las apruebe, marcarlas en `WA_PLANTILLAS_V3_LISTAS` en Railway.
4. Que la web mande `contexto.idioma` y `contexto.genero`.
5. Estar el día del merge.
6. Aparte: a Iñaki (Viaje) le falla la pregunta 3 desde el 05/10.

**La sesión siguiente**, con la migración aplicada:
1. `cd entrevistador && npm run v3-simular -- --real`: corre una entrevista entera con un narrador inventado y WhatsApp falso, sin gasto. Lo borra al terminar.
2. Merge a `main` con Joaquín.
3. `npm run v3-pasar -- <número de Naza> --genero varon --aplicar` para la prueba real.
4. Después Dora, Mariano e Imma. A Imma conviene pasarla cerca de su hora, así OR1 le sale enseguida.

## Textos para aprobar (Naza)
| # | Texto | Propuesta |
|---|---|---|
| 1 | Plantilla de la pregunta del día, es-ES | «La pregunta de hoy: {{1}} / Cuando quieras, me respondes con un audio. Sin prisa. 🎙️» |
| 2 | Plantilla de la pregunta del día, ca | «La pregunta d'avui: {{1}} / Quan vulguis, em respons amb un àudio. Sense pressa. 🎙️» |
| 3 | Plantillas de M8 (es-AR, es-ES, ca) | El texto de M8 de cada banco (ya aprobado), con `{{1}}` en lugar del nombre. |
| 4 | Foto suelta (no FO1) | Hoy, en es-AR: «📷 Guardada. Si querés, contame qué pasaba ahí.» La revisión marcó que esto invita a contar algo que después se pega a la respuesta abierta. Propuesta: «📷 Guardada.» (en ca: «📷 Desada.», en es-ES: «📷 Guardada.»). |
| 5 | Bienvenida de narradores nuevos en ca/es-ES | Hoy es la vieja, en castellano y con usted o vos. Solo hace falta para prender `V3_PARA_NUEVOS`, no para el piloto. |
| 6 | Pausa («quiero parar»), es-AR | «Listo, {{nombre}}, frenamos acá. Lo que contaste queda guardado. Cuando quieras seguir, mandame un mensaje y retomamos donde quedamos.» |
| 7 | Pausa, es-ES | «Vale, {{nombre}}, paramos aquí. Lo que has contado queda guardado. Cuando quieras seguir, mándame un mensaje y seguimos donde lo dejamos.» |
| 8 | Pausa, ca | «D'acord, {{nombre}}, parem aquí. El que has explicat queda guardat. Quan vulguis continuar, envia'm un missatge i seguim on ho vam deixar.» |
| 9 | Reserva («que no vaya al libro»), es-AR / es-ES / ca | «Entendido. Eso no va a ir al libro.» / «Entendido. Eso no irá en el libro.» / «Entesos. Això no anirà al llibre.» |

Los textos 6 a 9 ya están en `entrevistador/src/v3/textos-fijos.json`: si Naza cambia algo, se edita solo ese archivo.

Las frases que disparan la pausa y la reserva están en `fabrica/src/v3/entrevista/respuesta.ts` (sección "pedidos"); se cambian ahí y se copian con `npm run v3-copiar-nucleo`.

## A vigilar en el piloto (anotado, no bloquea)
- **Audio en la pregunta equivocada.** Si Railway se reinicia entre dos audios de la misma respuesta, el segundo puede caer en la pregunta siguiente. Igual es mejor que perderlo.
- **Pregunta repetida tras una plantilla.** Si el narrador contesta con audio una pregunta que salió por plantilla, le vuelve a llegar la pregunta con botones.
- **Tráfico del reloj.** Cada minuto lee todas las filas V3 con el estado completo. Hay que achicarlo antes de prender `V3_PARA_NUEVOS`.
- **Sin aviso al narrador si falla una foto.** Si falla la subida de FO1 o de una foto suelta, el narrador no recibe nada: el banco no tiene texto para eso.
- **Aviso del candado.** El mail «no arma el libro viejo» les llega a los socios apenas hay un narrador V3 activo.

## Qué NO hacer
- **Nunca editar a mano `entrevistador/src/v3/nucleo/`.** Se copia con `npm run v3-copiar-nucleo`, y un test vigila que no se separe del de la fábrica.
- **Nunca correr `v3-pasar --aplicar` sin el OK de Naza** sobre las equivalencias. Ni prender `V3_PARA_NUEVOS` sin su OK.
- **Nunca correr `v3-simular --real --cazador` sin avisar el costo.**
- **No volver a meter la pregunta pendiente en la tanda diaria:** Naza decidió que no se reenvía.
