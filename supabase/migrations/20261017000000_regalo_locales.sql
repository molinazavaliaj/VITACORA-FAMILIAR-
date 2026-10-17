-- Regalo en locales (docs/superpowers/specs/2026-10-17-regalo-en-locales-design.md), 17/10.
--
-- Una copistería tiene una caja con sobres. Cada carta trae un código impreso
-- (VF-XXXXXX) que pertenece a un lote, y el lote a un local. Quien paga la
-- carta en la web la convierte en su regalo; el local gana el 20 % del libro.
--
-- ⚠️ Toca supabase/CONTRATO.md: tablas `locales`, `lotes_impresos`,
-- `codigos_impresos`, columnas `pedidos.local_id` y `pedidos.comision_local`,
-- y un trigger que impide que un código de regalo y uno impreso coincidan.
-- La aplica Naza en el SQL Editor, después del OK de Joaquín. La web anda sin
-- ella: sin las tablas, ninguna carta existe.

create table if not exists locales (
  id            uuid primary key default gen_random_uuid(),
  nombre        text not null,
  pais          text not null check (pais in ('ES', 'AR')),
  idioma        text not null check (idioma in ('es-AR', 'es-ES', 'ca')),
  contacto      text,
  comision_pct  numeric(5,2) not null default 20 check (comision_pct >= 0 and comision_pct <= 100),
  token_panel   text not null unique,                 -- el link privado del panel
  activo        boolean not null default true,
  created_at    timestamptz not null default now()
);

create table if not exists lotes_impresos (
  id          uuid primary key default gen_random_uuid(),
  local_id    uuid not null references locales(id) on delete restrict,
  idioma      text not null check (idioma in ('es-AR', 'es-ES', 'ca')),
  cantidad    integer not null check (cantidad > 0),
  nota        text,
  created_at  timestamptz not null default now()
);

create table if not exists codigos_impresos (
  codigo      text primary key,                       -- 'VF-7K3M2Q'
  lote_id     uuid not null references lotes_impresos(id) on delete cascade,
  pedido_id   uuid references pedidos(id) on delete set null,  -- null = sin pagar
  created_at  timestamptz not null default now()
);

create index if not exists codigos_impresos_por_lote on codigos_impresos (lote_id);

alter table pedidos add column if not exists local_id uuid references locales(id) on delete set null;
alter table pedidos add column if not exists comision_local numeric(10,2);
create index if not exists pedidos_por_local on pedidos (local_id) where local_id is not null;

-- Un código vive en un solo lugar. Un regalo puede tomar un código impreso
-- solo si esa carta ya es de su pedido (confirmarPago la toma primero). El
-- error usa 23505 para que /api/compra, que ya reintenta con otro código ante
-- un unique_violation, siga andando igual.
create or replace function codigo_regalo_libre() returns trigger
language plpgsql as $$
begin
  if tg_table_name = 'regalos' then
    if exists (select 1 from codigos_impresos c
               where c.codigo = new.codigo
                 and c.pedido_id is distinct from new.pedido_id) then
      raise exception 'el código % es de una carta impresa', new.codigo using errcode = '23505';
    end if;
  else
    if exists (select 1 from regalos r where r.codigo = new.codigo) then
      raise exception 'el código % ya es de un regalo', new.codigo using errcode = '23505';
    end if;
  end if;
  return new;
end $$;

drop trigger if exists regalos_codigo_libre on regalos;
create trigger regalos_codigo_libre before insert or update of codigo on regalos
  for each row execute function codigo_regalo_libre();

drop trigger if exists codigos_impresos_libre on codigos_impresos;
create trigger codigos_impresos_libre before insert on codigos_impresos
  for each row execute function codigo_regalo_libre();

alter table locales enable row level security;
alter table lotes_impresos enable row level security;
alter table codigos_impresos enable row level security;

-- La cuenta del mes, para pagarle a cada local. security_invoker: la vista no
-- se saltea RLS (sin esto, PostgREST la expondría a cualquiera).
create or replace view comisiones_locales_mes with (security_invoker = true) as
select
  l.id as local_id,
  l.nombre,
  -- El mes es el de created_at del pedido, no el del pago (se paga casi enseguida).
  date_trunc('month', p.created_at at time zone
    case when l.pais = 'ES' then 'Europe/Madrid' else 'America/Argentina/Buenos_Aires' end)::date as mes,
  p.moneda,
  count(*)               as cartas,
  sum(p.monto)           as cobrado,
  sum(p.comision_local)  as comision
from pedidos p
join locales l on l.id = p.local_id
where p.estado <> 'pendiente'
group by l.id, l.nombre, mes, p.moneda;
