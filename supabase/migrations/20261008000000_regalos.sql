-- Gift card (docs/superpowers/specs/2026-10-07-gift-card-design.md), 08/10.
--
-- Quien regala no da el teléfono del narrador: el narrador nace sin teléfono y,
-- pagado, espera en 'regalo_pendiente' (el entrevistador no lo mira). Cuando el
-- narrador le escribe al bot con el código, el entrevistador le pone el teléfono
-- y lo pasa a 'invitado'.
--
-- ⚠️ Toca supabase/CONTRATO.md: tabla `regalos`, estado `regalo_pendiente`, y el
-- entrevistador escribe `telefono_whatsapp` UNA vez (de null al número del canje).
-- La aplica Naza en el SQL Editor, después del OK de Joaquín. El código anda sin
-- ella: sin la tabla no hay regalos.

alter table narradores alter column telefono_whatsapp drop not null;
-- El `unique` se queda: Postgres admite varios NULL.

alter table narradores drop constraint if exists narradores_estado_check;
alter table narradores add constraint narradores_estado_check
  check (estado in (
    'pendiente_pago', 'regalo_pendiente',
    'invitado', 'acepto', 'activo', 'pausado', 'completado', 'cerrado_anticipado'
  ));

create table if not exists regalos (
  id                 uuid primary key default gen_random_uuid(),
  codigo             text not null unique,              -- 'VF-7K3M2Q'
  narrador_id        uuid not null unique references narradores(id) on delete cascade,
  pedido_id          uuid not null references pedidos(id) on delete cascade,
  quien_regala       text not null,                     -- como firma la tarjeta
  mensaje            text not null,
  audio_path         text,                              -- en el bucket 'audios'
  fecha_entrega      date,                              -- cuándo piensa darlo
  usado_at           timestamptz,
  usado_por_telefono text,                              -- E.164, el del canje
  recordatorio_at    timestamptz,
  created_at         timestamptz not null default now()
);

create index if not exists regalos_sin_usar on regalos (created_at) where usado_at is null;

alter table regalos enable row level security;
