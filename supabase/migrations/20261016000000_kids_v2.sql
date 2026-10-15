-- Vitácora Kids V2 («Mi Primer Capítulo») en la base (15/10, PROPUESTA para Joaquín).
--
-- Una fila en `kids_v2` es un chico de Kids. La crea la web al comprar (con la `Ficha` del motor de
-- fabrica/src/kids-v2/compra.ts) y el entrevistador la trabaja después del pago: arranca el motor, guarda su estado
-- y manda lo que el motor dice. Sin fila, nada de esto existe y el entrevistador sigue exactamente como hoy.
-- Mismo molde que `entrevistas_v3` y `viajes_v2`: `ficha` y `estado` en jsonb y las escrituras del entrevistador son
-- compare-and-swap sobre `version`. Es idempotente y no toca datos.
--
-- ⚠️ Toca supabase/CONTRATO.md ("Vitácora Kids V2"). No se aplica sin el OK de Joaquín. La aplica Naza.
-- ⚠️ La lista de `envios.tipo` se reescribe entera (como en 20261011000000_viaje_v2): lleva todos los tipos de hoy
--    más 'kids'.

create table if not exists kids_v2 (
  narrador_id      uuid primary key references narradores (id),
  idioma           text not null default 'es-AR' check (idioma in ('es-AR', 'es-ES', 'ca')),
  canal            text not null check (canal in ('A', 'B')),     -- A: su WhatsApp · B: «lo hago yo» (el del padre)
  telefono_padre   text not null check (telefono_padre ~ '^\+[1-9][0-9]{6,14}$'),  -- E.164
  ficha            jsonb not null,                                -- la Ficha del motor (validada con validarFicha)
  estado           jsonb,                                         -- null hasta que arranca; después, el motor y la cola de WhatsApp
  cambios_panel    jsonb,                                         -- lo que el padre cambió en el panel y el motor todavía no tomó
  cambios_error    text,                                          -- el motor rechazó o descartó el último cambio del panel
  avance           jsonb not null default '{}'::jsonb,            -- resumen para el panel: capítulo, si se pueden escribir preguntas, si terminó
  marcas           jsonb not null default '[]'::jsonb,            -- lo que el motor marca para Naza (preocupante, silencio de 8 días…)
  correcciones     jsonb not null default '[]'::jsonb,            -- los nombres que el padre corrige en el panel (para el libro)
  version          int not null default 0,                        -- compare-and-swap del entrevistador: UPDATE … WHERE version = n
  enviando_hasta   timestamptz,                                   -- toma corta del turno (~2 min)
  despertar_at     timestamptz,                                   -- proximoDespertar del motor: cuándo el reloj tiene que pasar por este chico
  creada_at        timestamptz not null default now(),
  empezo_at        timestamptz,                                   -- el entrevistador mandó el evento `inicio`
  termino_at       timestamptz,                                   -- terminó de contar (ver CONTRATO): la fábrica puede leer
  constraint kids_v2_canal_de_la_ficha check (ficha->>'canal' = canal)
);

create index if not exists kids_v2_despertar_idx on kids_v2 (despertar_at) where termino_at is null;

alter table kids_v2 enable row level security;  -- sin policies: solo la service role

alter table respuestas add column if not exists clave_kids text;

comment on column respuestas.clave_kids is
  'Kids V2: a qué item del motor responde esta fila (K12, K12-R1, la extra en curso, PADRE-1, CIERRE-3, K10-FOTO…). Null = el motor todavía no la procesó. ∅ = se guardó y quedó afuera a propósito. Null en todo lo que no es Kids.';

alter table envios drop constraint if exists envios_tipo_check;
alter table envios add constraint envios_tipo_check
  check (tipo in ('bienvenida','pregunta','repregunta','recordatorio','alerta_pausa',
                  'despedida','saludo_final','oferta_siguiente','objeto','v3','regalo_entrega','viaje_v2','kids'));
