-- Voz clonada (spec 2026-09-16-voz-clonada-design.md): el buzón entre la
-- fábrica (Railway) y el worker de voz (PC de Naza). Un escritor por columna:
-- la fábrica crea la fila; el worker escribe estado/motor/muestras/paths/error.
--
-- ⚠️ Toca supabase/CONTRATO.md → lo acuerdan los dos socios antes de aplicarla.

create table if not exists narraciones (
  id uuid primary key default gen_random_uuid(),
  narrador_id uuid not null references narradores (id),
  pedido_id uuid not null references pedidos (id),
  estado text not null default 'pendiente'
    check (estado in ('pendiente', 'procesando', 'lista', 'fallida')),
  motor text,                           -- el worker anota cuál usó ('chatterbox', 'qwen3tts', 'f5tts', 'omnivoice')
  muestras jsonb,                       -- qué respuestas usó y cuántos segundos limpios juntó
  capitulos_paths jsonb,                -- ["{narrador}/voz/cap_01.mp3", ...] en el orden de narracion.json
  error text,                           -- 'sin_consentimiento_voz' | 'faltan_minutos_de_voz: NNN s' | traceback resumido
  tomada_at timestamptz,                -- cuándo pasó a procesando (registro; los cuelgues se miden por actualizada_at)
  created_at timestamptz not null default now(),
  actualizada_at timestamptz not null default now()
);
create index if not exists narraciones_estado on narraciones (estado, created_at);
-- RLS: cerrada como el resto, sin políticas. La fábrica y el worker de voz usan service_role.
alter table narraciones enable row level security;

-- El narrador dijo que sí a que su voz se clone (va en el primer SÍ de la
-- bienvenida; lo escribe el entrevistador). Sin fecha, el worker no clona.
alter table narradores add column if not exists consentimiento_voz_at timestamptz;

-- Un pedido con audiolibro clonado espera a la PC: 'esperando_voz'.
alter table pedidos drop constraint if exists pedidos_estado_check;
alter table pedidos add constraint pedidos_estado_check
  check (estado in ('pendiente', 'pagado', 'generando', 'esperando_voz', 'entregado', 'fallido'));
