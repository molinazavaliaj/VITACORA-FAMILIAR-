-- "Esto que no vaya al libro" (PROPUESTA del 20/09, hallazgo 19 del piloto).
--
-- En la respuesta 12 del piloto el narrador dijo "estas historias prefiero que
-- queden en mi mente, no en mi biografía" y la transcripción entró entera al
-- material del libro. Publicar algo que pidió reservar quiebra la confianza de la
-- familia y puede herirla: es la peor falla posible del producto.
--
-- Lo escribe el ENTREVISTADOR cuando evalúa la respuesta: la evaluación devuelve
-- `reservado` / `reservadoTramo` (`entrevistador/src/ia/cerebro.ts`,
-- `evaluarRespuesta` y `reservaDe`), y el flujo guarda acá el resultado. La
-- FÁBRICA solo lee: una respuesta `reservada` nunca
-- entra al material que le pasa al escritor ni al audiolibro, y `reservado_tramo`
-- se quita del texto antes de armar ese material (si el tramo no aparece en la
-- transcripción, se reserva la respuesta entera — ante la duda, reservar de más).
--
-- ⚠️ La aplica Naza en el SQL Editor de Supabase, cuando Joaquín dé el OK: toca
-- una tabla del entrevistador. Es idempotente y no toca datos — las filas que ya
-- existen quedan con `reservada = false` y `reservado_tramo = null`. El código de
-- la fábrica está escrito para funcionar SIN las columnas (las lee como ausentes =
-- nada reservado), así que aplicarla no puede romper nada.

alter table respuestas add column if not exists reservada boolean not null default false;
alter table respuestas add column if not exists reservado_tramo text;

comment on column respuestas.reservada is
  'El narrador pidió que esta respuesta no vaya al libro (hallazgo 19). La fábrica la excluye del material; la web la muestra marcada.';
comment on column respuestas.reservado_tramo is
  'Si el pedido es por una parte de la respuesta: el tramo textual que no se publica, tal como lo dijo. Se quita del material del libro.';
