-- Rasca y gana: el cupón de bienvenida (docs/rediseno-2026-10/fase-5/respuesta-19-10.md §1,
-- textos-legales-nuevos.md tandas 1, 2 y 3), 20/10.
--
-- Cada correo que pide el cupón recibe su propio código (VITACORA10-XXXXXX), de un
-- solo uso: 10 % del libro digital (también dentro del pack), solo en la web del país
-- donde se pidió, 30 días desde que llega (el último día también vale). Doble opt-in:
-- la fila nace sin confirmar y recién al tocar el botón del mail se confirma, vence a
-- los 30 días y sale el mail con el código. Los recordatorios (hasta 4 en 14 días)
-- solo van a quien marcó la segunda casilla y confirmó; la baja es de un clic.
--
-- La web escribe todo (popup, confirmación, compra, webhook de pago, cron de
-- recordatorios). La fábrica y el entrevistador no la miran.
--
-- ⚠️ Toca supabase/CONTRATO.md («Cupón de bienvenida»). La aplica Naza en el SQL
-- Editor. Idempotente: se puede correr dos veces. Sin la tabla, la web no ofrece
-- el popup ni acepta códigos (lib/tabla-ausente.ts).

create table if not exists cupones (
  id                       uuid primary key default gen_random_uuid(),
  codigo                   text not null unique,
  -- En minúsculas. Un solo cupón por correo y por país, para siempre.
  email                    text not null,
  region                   text not null check (region in ('ES', 'AR')),
  -- La versión de la web donde se pidió: el idioma de los mails.
  idioma                   text not null check (idioma in ('es', 'ca', 'ar')),
  porcentaje               smallint not null default 10 check (porcentaje between 1 and 90),
  -- La segunda casilla (art. 6.1.a RGPD + art. 21.1 LSSI): opcional.
  acepta_recordatorios     boolean not null default false,
  -- La prueba del consentimiento (art. 7.1 RGPD): qué texto vio, cuándo y desde dónde.
  consentimiento           jsonb not null default '{}'::jsonb,
  ip                       text,
  created_at               timestamptz not null default now(),
  -- Cuántos mails de confirmación salieron y cuándo el último (freno contra el abuso).
  confirmaciones_enviadas  smallint not null default 0,
  confirmacion_enviada_at  timestamptz,
  -- Doble opt-in: null = todavía no tocó el botón del mail; no vale ni recibe nada.
  confirmado_at            timestamptz,
  -- El último día que vale (inclusive), en la fecha del país.
  vence_el                 date,
  recordatorios_enviados   smallint not null default 0 check (recordatorios_enviados between 0 and 4),
  ultimo_recordatorio_at   timestamptz,
  baja_at                  timestamptz,
  -- Se marca cuando el pago entra (webhook o vuelta del pago), nunca antes.
  usado_at                 timestamptz,
  pedido_id                uuid references pedidos(id) on delete set null
);

alter table cupones enable row level security;  -- sin policies: solo la service role

create unique index if not exists cupones_email_region on cupones (email, region);

-- El cron de recordatorios busca solo los que pueden recibir uno: pocos, siempre.
create index if not exists cupones_recordatorio_pendiente on cupones (confirmado_at)
  where acepta_recordatorios and confirmado_at is not null and baja_at is null
    and usado_at is null and recordatorios_enviados < 4;

-- El freno por IP cuenta los pedidos de la última hora.
create index if not exists cupones_ip_reciente on cupones (ip, created_at);
