-- Logística de lo físico (3t.26; diseño: docs/superpowers/specs/2026-09-21-logistica-fisica-propuesta.md).
--
-- Una tabla nueva: `entregas`. Una fila por pedido que lleva algo que viaja (libro
-- impreso y/o marcos NFC): adónde se manda, en qué estado está, y la etiqueta.
-- Qué va adentro (copias, acabado, marcos) NO se duplica: se lee de pedidos.extras.
--
-- Estados, en orden:
--   sin_direccion  la web creó la fila al confirmar el pago; falta la dirección
--   lista          la familia cargó la dirección (obligatoria para encargar)
--   en_produccion  la fábrica arrancó lo físico — es el portón de impresión de
--                  «Su voz» (congela las frases, arma el PDF de imprenta con QR)
--                  y el momento en que se crea el envío en el agregador (etiqueta)
--   impreso        salió de imprenta
--   enviado        se despachó: transportista + seguimiento; mail de hito
--   entregado      llegó (lo marca la fábrica/Naza, o el comprador con "ya me llegó")
--   con_problema   dirección inexistente, devuelto, roto: `problema` dice qué
--
-- Sin políticas de RLS a propósito: con RLS prendido y sin policy, sólo la
-- service role lee y escribe (web y fábrica del lado del servidor, /admin).
--
-- ⚠️ Toca supabase/CONTRATO.md (sección "Entregas"). La aplica Naza en el SQL Editor.

create table if not exists entregas (
  id                      uuid primary key default gen_random_uuid(),
  pedido_id               uuid not null unique references pedidos (id) on delete cascade,
  narrador_id             uuid not null references narradores (id) on delete cascade,
  familia_id              uuid not null references familias (id) on delete cascade,

  -- adónde va (lo carga la familia desde Encargar libro; editable hasta en_produccion)
  destinatario_nombre     text,
  destinatario_telefono   text,
  destinatario_email      text,
  direccion               jsonb,          -- {linea1, linea2?, ciudad, provincia?, cp, pais}
  nota                    text,           -- "timbre roto, llamar"

  -- de dónde sale y cómo viaja
  origen                  text check (origen in ('AR', 'ES')),   -- el centro que despacha
  estado                  text not null default 'sin_direccion'
                          check (estado in ('sin_direccion', 'lista', 'en_produccion', 'impreso', 'enviado', 'entregado', 'con_problema')),
  transportista           text,
  seguimiento             text,
  seguimiento_url         text,
  etiqueta_proveedor      text check (etiqueta_proveedor in ('sendcloud', 'packlink', 'enviopack', 'zippin', 'shipnow', 'manual')),
  etiqueta_url            text,           -- el PDF que imprime la imprenta
  envio_externo_id        text,           -- el id del envío en el agregador
  peso_g                  int,
  dimensiones             text,           -- "30x22x3" en cm, lo que pide el agregador
  problema                text,

  -- cuándo pasó cada cosa
  direccion_at            timestamptz,
  produccion_at           timestamptz,
  impreso_at              timestamptz,
  enviado_at              timestamptz,
  entregado_at            timestamptz,
  created_at              timestamptz not null default now(),
  updated_at              timestamptz not null default now()
);

create index if not exists entregas_estado_idx on entregas (estado);
create index if not exists entregas_narrador_idx on entregas (narrador_id);
create index if not exists entregas_familia_idx on entregas (familia_id);

alter table entregas enable row level security;

-- updated_at se mantiene solo (la web y la fábrica no tienen que acordarse).
create or replace function entregas_updated_at() returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end $$;
drop trigger if exists entregas_updated_at on entregas;
create trigger entregas_updated_at before update on entregas
  for each row execute function entregas_updated_at();
