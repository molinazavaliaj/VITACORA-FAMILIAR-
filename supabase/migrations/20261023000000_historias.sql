-- Vitácora de una historia en la base (spec docs/superpowers/specs/2026-10-21-vitacora-de-una-historia-design.md;
-- plan docs/superpowers/plans/2026-10-21-vitacora-de-una-historia.md, Task 2.1).
--
-- Una fila en `historias` prende la entrevista de una historia para ese narrador. La crea el entrevistador
-- (entrevistador/src/historia/alta.ts, Fase 3) a partir de `narradores.contexto.historia`. Sin fila, nada de esto
-- existe y el entrevistador sigue exactamente como hoy. Mismo molde que `entrevistas_v3`: la ficha y el estado en
-- jsonb y cada escritura del entrevistador es compare-and-swap sobre `version`. Es idempotente y no toca datos.
--
-- ⚠️ Toca supabase/CONTRATO.md ("Vitácora de una historia"). La aplica Naza.
-- ⚠️ La lista de `envios.tipo` se reescribe entera (como en 20261016000000_kids_v2, la última que la tocó): lleva
--    todos los tipos de hoy más 'historia'.

create table if not exists historias (
  narrador_id     uuid primary key references narradores (id),
  idioma          text not null default 'es-AR' check (idioma in ('es-AR', 'es-ES', 'ca')),
  ficha           jsonb not null,                 -- FichaHistoria: {nombre, genero, formaTrato?, quienRegala?, tema, temaLibre?}
  compra          jsonb not null default '{}',    -- {preguntasPropias?: string[]} (hasta 3, las de quien regala, tal cual)
  estado          jsonb not null,                 -- el motor de entrevistador/src/historia/turno.ts (con temaAbierto)
  version         int not null default 0,         -- compare-and-swap: UPDATE … WHERE version = n
  ultimo_audio_at timestamptz,                    -- cuando se GUARDÓ la última transcripción de la abierta
  tanda_dia       date,                           -- el día (en la zona del narrador) de la tanda en curso
  tanda_cuenta    int not null default 0,         -- cuántas preguntas salieron en esa tanda
  enviando_hasta  timestamptz,                    -- toma corta del turno (~2 min)
  creada_at       timestamptz not null default now(),
  -- Las claves de docs/historia/temas.md (TEMAS_HISTORIA en fabrica/src/historia/entrevista/temas.ts).
  constraint historias_tema_conocido check (
    ficha->>'tema' in ('mudanza', 'negocio', 'enfermedad', 'conocimos', 'padres', 'trabajo', 'otra')
  ),
  -- Quien regala deja hasta 3 preguntas (banco.md, regla 7).
  constraint historias_hasta_tres_propias check (
    compra->'preguntasPropias' is null
    or (jsonb_typeof(compra->'preguntasPropias') = 'array' and jsonb_array_length(compra->'preguntasPropias') <= 3)
  )
);

alter table historias enable row level security;  -- sin policies: solo la service role

alter table respuestas add column if not exists clave_historia text;

comment on column respuestas.clave_historia is
  'Vitácora de una historia: a qué responde esta fila (HC1, HC8-Q, HC1-A, FOTO-H, PR-H1, RP~HC5, TEMA). ∅ = se guardó y quedó afuera a propósito. Null en todo lo que no es una historia (y, en una historia, la que todavía no se sumó: la retoma el reloj).';

alter table envios drop constraint if exists envios_tipo_check;
alter table envios add constraint envios_tipo_check
  check (tipo in ('bienvenida','pregunta','repregunta','recordatorio','alerta_pausa',
                  'despedida','saludo_final','oferta_siguiente','objeto','v3','regalo_entrega','viaje_v2','kids',
                  'historia'));
