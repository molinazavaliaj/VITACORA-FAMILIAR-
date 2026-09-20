-- Audiolibro híbrido (decisión de los socios, 20/09): una narración ya entregada
-- se puede rehacer, y la vieja queda `reemplazada`. Es el estado nuevo para el
-- caso del libro que ya salió todo-clonado y se vuelve a narrar híbrido: la
-- fábrica convierte el `narracion.json` v1 en v2 (`fabrica/scripts/narracion-v2.ts`).
--
-- Lo escribe la FÁBRICA (`reemplazarNarracion` en `fabrica/src/voz/narraciones.ts`)
-- y es la única excepción a "el estado lo escribe el worker de voz": al pedir la
-- voz de nuevo para un pedido ya entregado, marca `reemplazada` la `lista` (o
-- `fallida`) vieja —con `error = 'reemplazada por <id nueva>'`— y crea la nueva
-- `pendiente`, en ese orden. Una `reemplazada` no se narra, no se ensambla
-- (`narracionesListas` solo mira `lista`) ni se reclama como atascada
-- (`narracionesAtascadas` solo mira `pendiente`/`procesando`/`fallida`).
--
-- ⚠️ La aplica Naza en el SQL Editor de Supabase. Es idempotente y no toca
-- datos: los estados que ya existen siguen siendo válidos, así que solo cambia
-- la lista del check. (El nombre del check es el que le puso Postgres al
-- crearlo en `20260917000000_narraciones.sql`; `\d narraciones` lo muestra.)

alter table narraciones drop constraint if exists narraciones_estado_check;
alter table narraciones add constraint narraciones_estado_check
  check (estado in ('pendiente', 'procesando', 'lista', 'fallida', 'reemplazada'));
