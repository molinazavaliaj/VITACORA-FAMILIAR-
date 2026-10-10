-- El regalo llega solo el día elegido (docs/superpowers/specs/2026-10-10-regalo-dia-de-entrega-design.md), 10/10.
--
-- Quien compra puede pedir que el día de `fecha_entrega`, a una hora en punto de
-- 8 a 22 en la zona de quien recibe, le llegue el regalo por mail o por WhatsApp.
-- La web escribe canal, contacto, hora y zona; el entrevistador escribe
-- `entrega_enviada_at` (la traba) y `entrega_fallo`.
--
-- ⚠️ Toca supabase/CONTRATO.md («Gift card» → «El regalo llega solo el día elegido»).
-- La aplica Naza en el SQL Editor, después del OK de Joaquín. Idempotente: se puede
-- correr dos veces. El código anda sin ella: sin las columnas no hay envíos.

alter table regalos add column if not exists entrega_canal      text;
alter table regalos add column if not exists entrega_contacto   text;
alter table regalos add column if not exists entrega_hora       smallint;
alter table regalos add column if not exists entrega_zona       text;
alter table regalos add column if not exists entrega_enviada_at timestamptz;
alter table regalos add column if not exists entrega_fallo      text;

alter table regalos drop constraint if exists regalos_entrega_canal_check;
alter table regalos add constraint regalos_entrega_canal_check
  check (entrega_canal is null or entrega_canal in ('mail', 'whatsapp'));

alter table regalos drop constraint if exists regalos_entrega_hora_check;
alter table regalos add constraint regalos_entrega_hora_check
  check (entrega_hora is null or entrega_hora between 8 and 22);

alter table regalos drop constraint if exists regalos_entrega_zona_check;
alter table regalos add constraint regalos_entrega_zona_check
  check (entrega_zona is null or entrega_zona in ('America/Argentina/Buenos_Aires', 'Europe/Madrid'));

-- Con canal, todo lo demás tiene que estar.
alter table regalos drop constraint if exists regalos_entrega_completa_check;
alter table regalos add constraint regalos_entrega_completa_check
  check (entrega_canal is null or (
    fecha_entrega is not null and entrega_contacto is not null
    and entrega_hora is not null and entrega_zona is not null
  ));

-- El tick busca solo los pendientes de mandar: pocos, siempre.
create index if not exists regalos_entrega_pendiente on regalos (fecha_entrega)
  where entrega_canal is not null and entrega_enviada_at is null and usado_at is null;

-- El canje sin código busca por el celular al que se mandó la plantilla.
create index if not exists regalos_entrega_whatsapp on regalos (entrega_contacto)
  where entrega_canal = 'whatsapp' and usado_at is null;

-- La plantilla a quien recibe se anota en envios para saber si Meta la entregó.
alter table envios drop constraint if exists envios_tipo_check;
alter table envios add constraint envios_tipo_check
  check (tipo in ('bienvenida','pregunta','repregunta','recordatorio','alerta_pausa',
                  'despedida','saludo_final','oferta_siguiente','objeto','v3','regalo_entrega'));
