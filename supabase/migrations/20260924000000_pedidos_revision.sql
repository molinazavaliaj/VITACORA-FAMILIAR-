-- El estado 'revision' del pedido (diseño 23/09, §3.3, decisión de Naza): con avisos del lector
-- final o de los controles, el libro ESPERA a que un socio lo mire, y los dueños reciben el detalle
-- por mail. La familia no ve nada hasta que se entrega.
--
-- Lista vigente copiada de `20260917000000_narraciones.sql:30-32` (última que tocó
-- `pedidos_estado_check`; nadie la volvió a tocar después) + 'revision'.
--
-- ⚠️ La aplica Naza en el SQL Editor. Idempotente, no toca datos.
-- No toca `narradores_estado_check` (migración 20260911): ese es otro check, en otra tabla.

alter table pedidos drop constraint if exists pedidos_estado_check;
alter table pedidos add constraint pedidos_estado_check
  check (estado in ('pendiente', 'pagado', 'generando', 'esperando_voz', 'revision', 'entregado', 'fallido'));
