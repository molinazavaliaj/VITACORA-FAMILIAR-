-- Panel de la empresa (diseño: docs/superpowers/specs/2026-09-21-panel-de-la-empresa-design.md).
--
-- Tres tablas nuevas, todas de sólo agregar: nadie actualiza ni borra.
--   1. consumo_ia       una fila por llamada al modelo — de acá sale el gasto del día.
--   2. latidos          si cada worker está vivo (una fila por servicio, se pisa).
--   3. gastos_manuales  lo que NO pasa por una API (lo carga Naza desde /admin).
--
-- Sin políticas de RLS a propósito: con RLS prendido y sin policy, sólo la
-- service role lee y escribe. Es exactamente lo que queremos: /admin usa la
-- service role del lado del servidor y ningún navegador toca estas tablas.
--
-- ⚠️ Toca supabase/CONTRATO.md. La aplica Naza en el SQL Editor.

create table if not exists consumo_ia (
  id            uuid primary key default gen_random_uuid(),
  fecha         timestamptz not null default now(),
  servicio      text not null check (servicio in ('entrevistador', 'fabrica', 'voz')),
  paso          text not null,
  modelo        text not null,
  proveedor     text not null check (proveedor in ('anthropic', 'openai', 'local')),
  cuenta        text,                    -- quién paga la key: naza | joaquin | local
  narrador_id   uuid references narradores (id) on delete set null,
  input_tokens  int not null default 0,
  output_tokens int not null default 0,
  cache_write   int not null default 0,
  cache_read    int not null default 0,
  cantidad      numeric,                 -- lo que se cobra por unidad (segundos, caracteres)
  unidad        text check (unidad in ('segundos', 'caracteres')),
  usd           numeric(12,6) not null default 0
);
create index if not exists consumo_ia_fecha_idx on consumo_ia (fecha desc);
create index if not exists consumo_ia_narrador_idx on consumo_ia (narrador_id);
alter table consumo_ia enable row level security;

create table if not exists latidos (
  servicio     text primary key check (servicio in ('entrevistador', 'fabrica', 'voz')),
  ultimo_ping  timestamptz not null default now(),
  detalle      jsonb
);
alter table latidos enable row level security;

create table if not exists gastos_manuales (
  id         uuid primary key default gen_random_uuid(),
  fecha      date not null default current_date,
  concepto   text not null,
  monto      numeric(10,2) not null,
  moneda     text not null default 'EUR' check (moneda in ('EUR', 'USD', 'ARS')),
  categoria  text not null default 'otro' check (categoria in ('suscripcion', 'api', 'imprenta', 'otro')),
  quien      text,                       -- a quién le corresponde
  creado_at  timestamptz not null default now()
);
create index if not exists gastos_manuales_fecha_idx on gastos_manuales (fecha desc);
alter table gastos_manuales enable row level security;
