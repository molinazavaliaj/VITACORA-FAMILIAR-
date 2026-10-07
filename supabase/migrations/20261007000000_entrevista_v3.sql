-- La entrevista V3 en el WhatsApp de verdad (spec docs/superpowers/specs/2026-10-07-entrevista-v3-whatsapp-design.md).
--
-- Una fila en `entrevistas_v3` prende la V3 para ese narrador. Sin fila, el
-- entrevistador sigue exactamente como hoy. El estado de la entrevista (lo que
-- contestó, lo que se le mandó, la cola de mensajes) vive en `estado` (jsonb)
-- y cada escritura es compare-and-swap sobre `version`: dos procesos no pueden
-- pisarse. Es idempotente y no toca datos.
--
-- ⚠️ Toca supabase/CONTRATO.md ("Entrevista V3 por WhatsApp"). La aplica Naza.

create table if not exists entrevistas_v3 (
  narrador_id     uuid primary key references narradores (id),
  idioma          text not null default 'es-AR' check (idioma in ('es-AR', 'es-ES', 'ca')),
  ficha           jsonb not null,                 -- {nombre, genero, formaTrato?, quienRegala?}
  estado          jsonb not null,                 -- el motor de entrevistador/src/v3/turno.ts
  version         int not null default 0,         -- compare-and-swap: UPDATE … WHERE version = n
  ultimo_audio_at timestamptz,                    -- cuando se GUARDÓ la última transcripción de la abierta
  tanda_dia       date,                           -- el día (en la zona del narrador) de la tanda en curso
  tanda_cuenta    int not null default 0,         -- cuántas preguntas salieron en esa tanda
  enviando_hasta  timestamptz,                    -- toma corta del turno (~2 min)
  creada_at       timestamptz not null default now(),
  migrada_de      jsonb                           -- null, o {"de": "v-vieja", "dia_actual": n}
);

alter table entrevistas_v3 enable row level security;  -- sin policies: solo la service role

alter table respuestas add column if not exists clave_v3 text;
alter table respuestas add column if not exists wa_message_id text;
create unique index if not exists respuestas_wa_message_id_unico
  on respuestas (wa_message_id) where wa_message_id is not null;

comment on column respuestas.clave_v3 is
  'Entrevista V3: la pregunta de esta fila (CA1, RP~AM9, CA4~2, F:<id>). ∅ = se guardó y quedó afuera a propósito. Null en las filas de la entrevista vieja (y, en una V3, la que todavía no se sumó: la retoma el reloj).';
comment on column respuestas.wa_message_id is
  'El id del mensaje de Meta que trajo esta respuesta. Único: el reintento del webhook no la suma dos veces.';

alter table envios drop constraint if exists envios_tipo_check;
alter table envios add constraint envios_tipo_check
  check (tipo in ('bienvenida','pregunta','repregunta','recordatorio','alerta_pausa',
                  'despedida','saludo_final','oferta_siguiente','objeto','v3'));
