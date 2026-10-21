-- Programa de creadores, «Colabora con Vitácora» (docs/superpowers/specs/
-- 2026-10-21-programa-creadores-design.md), 21/10.
--
-- Los creadores chicos se anotan solos en /colabora y quedan pendientes. Los socios
-- los aprueban desde el panel de la empresa (/admin/creadores): ahí eligen el código,
-- la comisión (%) y el descuento para su comunidad (%), los dos por creador y
-- editables después. El código se escribe en el mismo casillero del cupón del
-- checkout. Cuando el pago entra (confirmarPago) nace la fila de la comisión, con el
-- porcentaje congelado: cambiar la comisión después no toca ventas viejas. El pago
-- de las comisiones es a mano (transferencia): acá no se guardan datos bancarios.
--
-- La web escribe todo (alta, panel de la empresa, compra, webhook de pago, cron
-- del resumen mensual). La fábrica y el entrevistador no la miran.
--
-- ⚠️ Toca supabase/CONTRATO.md («Programa de creadores»). La aplica Naza en el SQL
-- Editor. Idempotente: se puede correr dos veces. Todo apagado hasta CREADORES=1.

create table if not exists creadores (
  id               uuid primary key default gen_random_uuid(),
  created_at       timestamptz not null default now(),
  nombre           text not null,
  -- En minúsculas. Un alta por correo: si se anota dos veces, no se duplica.
  email            text not null unique,
  -- Instagram, TikTok, YouTube u otra.
  red              text not null check (red in ('instagram', 'tiktok', 'youtube', 'otra')),
  -- El link de su perfil.
  perfil           text not null,
  -- Lo que escribió (opcional): no es un número, es lo que contó.
  seguidores       text,
  mensaje          text check (mensaje is null or char_length(mensaje) <= 1000),
  -- La web donde se anotó: el idioma de los mails y de su panel.
  region           text not null check (region in ('ES', 'AR')),
  idioma           text not null check (idioma in ('es', 'ca', 'ar')),
  estado           text not null default 'pendiente' check (estado in ('pendiente', 'activo', 'pausado', 'rechazado')),
  -- null hasta aprobar. Mayúsculas y números, de 3 a 20, nunca con el prefijo del rasca.
  codigo           text unique check (codigo is null or (codigo ~ '^[A-Z0-9]{3,20}$' and codigo not like 'VITACORA10%')),
  -- null hasta aprobar. La comisión sobre lo que el cliente pagó; el descuento, sobre el libro digital.
  comision         smallint check (comision is null or comision between 1 and 50),
  descuento        smallint check (descuento is null or descuento between 0 and 50),
  -- El link privado de su panel (/creador/<token>): nace al aprobar, 32 bytes al azar.
  token_panel      text unique,
  -- La prueba de que aceptó las condiciones: qué texto vio, versión, fecha y user agent.
  consentimiento   jsonb not null default '{}'::jsonb,
  ip               text,
  aprobado_at      timestamptz,
  -- De los socios. Nunca se le muestra al creador.
  notas            text,
  -- Un activo siempre tiene sus tres números y su panel.
  constraint creadores_activo_completo check (
    estado not in ('activo', 'pausado')
    or (codigo is not null and comision is not null and descuento is not null and token_panel is not null)
  )
);

alter table creadores enable row level security;  -- sin policies: solo la service role

create table if not exists comisiones_creadores (
  id           uuid primary key default gen_random_uuid(),
  created_at   timestamptz not null default now(),
  creador_id   uuid not null references creadores(id) on delete restrict,
  -- Una por pedido: el webhook reintenta y la vuelta del pago también confirma.
  pedido_id    uuid not null unique references pedidos(id) on delete restrict,
  -- El código con que se compró (el creador puede cambiarlo después).
  codigo       text not null,
  -- Lo que el cliente pagó de verdad (pedidos.monto, ya con el descuento) y su moneda.
  total        numeric not null check (total >= 0),
  moneda       text not null,
  -- Congelado en el momento de la compra.
  porcentaje   smallint not null check (porcentaje between 1 and 50),
  -- total × porcentaje / 100: euros a los céntimos, pesos al entero.
  importe      numeric not null check (importe >= 0),
  estado       text not null default 'pendiente' check (estado in ('pendiente', 'pagada', 'anulada')),
  pagada_at    timestamptz,
  anulada_at   timestamptz
);

alter table comisiones_creadores enable row level security;  -- sin policies: solo la service role

-- Desde el 30/10/2026 Supabase ya no da permisos solos a las tablas nuevas de
-- `public`: van explícitos. La web las usa solo con la service role
-- (lib/creadores-base.ts); anon y authenticated no las tocan.
grant select, insert, update, delete on table creadores to service_role;
grant select, insert, update, delete on table comisiones_creadores to service_role;

-- El freno de altas por IP cuenta las de la última hora.
create index if not exists creadores_ip_reciente on creadores (ip, created_at);
-- El panel de cada creador y el resumen mensual buscan por creador y estado.
create index if not exists comisiones_creadores_creador on comisiones_creadores (creador_id, estado);
