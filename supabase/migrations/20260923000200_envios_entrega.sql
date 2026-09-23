-- Saber si el mensaje LLEGÓ (23/09, pedido de Joaquín tras dos días a ciegas).
--
-- Hoy `envios` solo guarda que Meta ACEPTÓ el mensaje (`wa_message_id`). Eso no
-- es lo mismo que entregarlo: el 21/09 salieron tres bienvenidas, las tres con
-- id de Meta, y las tres personas dicen que no les llegó nada. Sin este dato no
-- podemos distinguir tres problemas completamente distintos:
--   · falló       → el número o la cuenta tienen un problema
--   · entregado   → le llegó y no lo abrió: hay que avisarle por otro lado
--   · leído       → lo abrió y no contestó: el problema es el texto
--
-- Meta nos manda esos avisos por el mismo webhook; hasta hoy los tirábamos.
-- El código funciona sin estas columnas (avisa por consola y sigue), así que
-- aplicarla no puede romper nada. Es idempotente y no toca datos.
--
-- ⚠️ Toca supabase/CONTRATO.md → la escribe Joaquín, la aplica Naza.

alter table envios add column if not exists entrega text
  check (entrega is null or entrega in ('enviado', 'entregado', 'leido', 'fallido'));
alter table envios add column if not exists entrega_at timestamptz;
alter table envios add column if not exists error_codigo int;
alter table envios add column if not exists error_detalle text;

comment on column envios.entrega is
  'Lo último que dijo Meta de este mensaje: enviado → entregado → leido, o fallido. '
  'Null = todavía no llegó ningún aviso (o el envío es anterior al 23/09).';
comment on column envios.error_detalle is
  'Cuando entrega = fallido: qué dijo Meta. Es lo que hay que leer para saber por qué no llegó.';

create index if not exists envios_wa_message_idx on envios (wa_message_id);
