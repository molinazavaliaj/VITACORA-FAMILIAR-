-- La Vitácora de Viaje V2 en el WhatsApp de verdad (docs/viajes-v2/plan-conexion-bot.md, 10/10).
--
-- Una fila en `viajes_v2` prende la V2 para ese viajero. Sin fila, el entrevistador sigue exactamente como hoy
-- (el viaje viejo). La compra del viaje (`compra`, la `Compra` de fabrica/src/viaje-v2/tipos.ts) y el estado del
-- planificador (`estado`, lo que se mandó, lo que contestó, la cola de salida) viven en jsonb; cada escritura es
-- compare-and-swap sobre `version`, como `entrevistas_v3`. Es idempotente y no toca datos.
--
-- ⚠️ Toca supabase/CONTRATO.md ("Viaje V2 por WhatsApp"). La aplica Naza.
-- ⚠️ La lista de `envios.tipo` incluye 'regalo_entrega' (migración 20261010000000_regalos_entrega, rama
--    regalo-dia-de-entrega): las dos la reescriben entera, así que cada una lleva los tipos de la otra y el orden en
--    que se apliquen no importa.

create table if not exists viajes_v2 (
  narrador_id     uuid primary key references narradores (id),
  idioma          text not null default 'es-AR' check (idioma in ('es-AR', 'es-ES', 'ca')),
  compra          jsonb not null,                 -- la Compra del viaje (fechas, zonas, formato, regalo, propias…)
  estado          jsonb not null,                 -- el planificador de entrevistador/src/viaje-v2 (serializable)
  version         int not null default 0,         -- compare-and-swap: UPDATE … WHERE version = n
  enviando_hasta  timestamptz,                    -- toma corta del turno (~2 min)
  creada_at       timestamptz not null default now()
);

alter table viajes_v2 enable row level security;  -- sin policies: solo la service role

alter table respuestas add column if not exists clave_viaje text;

comment on column respuestas.clave_viaje is
  'Viaje V2: a qué mensaje responde esta fila (AS1…VA1, la clave del calendario como D3-noche, o ALBUM). ∅ = se guardó y quedó afuera a propósito. Null en todo lo que no es Viaje V2.';

alter table envios drop constraint if exists envios_tipo_check;
alter table envios add constraint envios_tipo_check
  check (tipo in ('bienvenida','pregunta','repregunta','recordatorio','alerta_pausa',
                  'despedida','saludo_final','oferta_siguiente','objeto','v3','regalo_entrega','viaje_v2'));
