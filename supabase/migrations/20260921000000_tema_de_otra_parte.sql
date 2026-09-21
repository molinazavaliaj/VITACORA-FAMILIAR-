-- "Esto es de otra parte" (PROPUESTA del 21/09, decisión de Naza y Joaquín).
--
-- El narrador responde la pregunta 9 y ahí recuerda algo que pertenece a la
-- historia de la pregunta 2. Hoy esa respuesta queda atada a su pregunta y en
-- el libro la historia aparece en el capítulo equivocado: no se pierde, queda
-- mal ubicada. Esto es una MARCA, no una bifurcación de la conversación: el
-- bot nunca reencuadra en el momento.
--
-- Lo escribe el ENTREVISTADOR al evaluar la respuesta principal: la evaluación
-- devuelve `temaDeOrden` / `temaMotivo` (`entrevistador/src/ia/cerebro.ts`,
-- `evaluarRespuesta` y `temaDe`, que solo acepta una orden que esté entre las
-- preguntas ya hechas y sea anterior a la de hoy), y el flujo lo guarda acá.
-- La FÁBRICA solo lee: al armar el material de cada capítulo suma la respuesta
-- al capítulo del tema que marca, y en el capítulo donde la contó la deja
-- anotada como "recuerdo de otro tema: ya va en el capítulo N" para que el
-- escritor no la repita. No se mueve nada de lugar: se copia.
--
-- ⚠️ La aplica Naza en el SQL Editor de Supabase, acordada entre los dos: toca
-- una tabla del entrevistador. Es idempotente y no toca datos — las filas que
-- ya existen quedan con las dos columnas en null. El código funciona SIN las
-- columnas (`guardarTemaDeOtraParte` avisa por consola y no anota; la fábrica
-- las lee como ausentes = sin marca), así que aplicarla no puede romper nada.

alter table respuestas add column if not exists tema_de_orden integer;
alter table respuestas add column if not exists tema_motivo text;

comment on column respuestas.tema_de_orden is
  'La orden de la pregunta cuyo tema trata de verdad esta respuesta, si el narrador recordó algo de una pregunta anterior (21/09). Null = contestó la suya. La fábrica copia la respuesta a ese capítulo.';
comment on column respuestas.tema_motivo is
  'Una línea de por qué la evaluación marcó tema_de_orden. Para leerla en el panel y en la revisión.';
