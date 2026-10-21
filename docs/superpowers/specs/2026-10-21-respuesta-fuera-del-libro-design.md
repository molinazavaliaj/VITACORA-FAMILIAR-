# «Que esto no vaya al libro» por respuesta (V3) — diseño

Aprobado por Naza el 21/10. Origen: el 21/10 el padre de Naza contestó desde el celular de Amelia
(narradora V3) una pregunta que era para ella. Desde el panel no había cómo sacar esa respuesta del
libro y se arregló a mano en la base. Esto es para que la familia lo resuelva sola.

## Qué hace la dueña

En la página de la historia V3 (`web/src/app/tablero/[narradorId]/v3.tsx`), cada respuesta tiene un
link «Que esto no vaya al libro». Abre una confirmación en el lugar:

1. «¿Sacamos esta respuesta del libro?» con la explicación (la contestó otra persona, se equivocó o no
   quiere que esté; lo demás de esa pregunta sigue en el libro).
2. Si la entrevista no llegó a la foto del final (FO1) y hay lugar entre las 10 preguntas de la
   familia: «¿Querés que se la volvamos a hacer?», con «No hace falta» marcado por defecto.
3. «Sacarla del libro» / «Dejarla».

La respuesta sacada sigue a la vista, en gris, con «No va al libro» y «Volver a ponerla». Solo la dueña
(como «Qué dejar afuera» al cerrar), hasta que el libro se cierra (`libro_aprobado_at`). Lo que el
narrador reservó por WhatsApp no cambia (sigue oculto).

Volver a hacerla = una pregunta de la familia (`preguntas`, `tipo = 'familia'`) con el texto con que le
llegó (lo arma el servidor desde `estado.charla`, no viene del navegador). El bot ya la hace al final,
antes de FO1, con M15. Ocupa uno de los 10 lugares. Deshacer la marca no borra esa pregunta.

## Dónde se guarda

Tabla nueva `respuestas_fuera` (migración `20261021000100_respuestas_fuera.sql`, la aplica Naza):
`respuesta_id` (pk, → `respuestas`), `narrador_id`, `marcada_por` (→ `auth.users`), `created_at`.
Marcar = insertar; deshacer = borrar. La escribe solo la web; la leen la fábrica y el entrevistador.
Nadie toca `entrevistas_v3.estado` ni `respuestas`. Sin la tabla (42P01 / PGRST205), todos toman
que no hay nada sacado.

## La regla para sacar una respuesta sola

El texto de una clave en `estado.respuestas` es la suma de lo que se contó (`sumarAudio`, con
espacios). El texto de una fila es `transcripcion` o, si no hay, `texto_directo`, sin marcas ⟦…⟧.
Para cada clave con filas sacadas:

1. Se borra del texto (con los espacios normalizados) el texto de cada fila sacada.
2. Si alguna no aparece tal cual, el texto de la clave se rearma con las filas que quedan, en orden.
3. Si no queda nada, la clave sale.

Va por clave exacta (`RP~X` y `X` son claves distintas): sacar una fila de X no saca la repregunta.

## Quién respeta la marca

- **Fábrica** (`fabrica/src/escritor/material/de-base.ts`): aplica la regla sobre `estado.respuestas`
  (y el borrador). La fila sacada no va a «Su voz» (`audioPath` y `transcripcion` null). Si la Etapa A
  ya estaba hecha, se rehace sola porque cambió el material.
- **Entrevistador** (bot):
  - El cazador recibe las respuestas ya sin lo sacado.
  - Una repregunta en cola (`estado.repreguntas`) cuyo origen tiene filas sacadas se descarta si su
    `cita` está en una fila sacada o no está en ninguna de las que quedan. Se hace en `avanzar` /
    `cerrarYSeguir`, con la lista leída antes del compare-and-swap. Lo que ya salió, ya salió.
- **Web**: la historia marca la fila; «Qué dejar afuera» arma el fragmento sin lo sacado y no muestra
  la pregunta si se sacó todo.

## Textos

Aprobados por Naza el 21/10 (tandas 1 y 2, 12 textos), en `docs/panel/fuera-del-libro-textos.md` y
`web/src/lib/fuera-del-libro-textos.ts`, en vos, tú y catalán.

## Fuera de alcance

Que el bot vuelva a hacer la pregunta enseguida como suya, y borrar la pregunta de la familia al
deshacer.
