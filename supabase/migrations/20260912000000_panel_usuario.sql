-- El panel del usuario (decisión de los socios, 2026-09-12). Spec: docs/panel-usuario.md
--
-- Cuatro cosas cambian en la base:
--   1. El guion pasa a ser POR NARRADOR: cada uno tiene copia propia de las 26 fijas y
--      puede editarlas, saltarlas, reordenarlas o sumar hasta 40 (con las 4 adaptativas).
--   2. Fotos por capítulo (tabla nueva), incluida la "pregunta-foto".
--   3. Invitados: hasta 3 personas más por historia, con permisos acotados.
--   4. La edición final del libro y su aprobación antes de imprimir.
--
-- ⚠️ Toca supabase/CONTRATO.md → escrita por Joaquín, la confirma Naza cuando vuelva.

-- ── 2. Fotos ──────────────────────────────────────────────────────────────
-- Antes que preguntas, porque preguntas la referencia.
create table fotos (
  id uuid primary key default gen_random_uuid(),
  narrador_id uuid not null references narradores (id) on delete cascade,
  capitulo text not null,                        -- mismo texto que preguntas.capitulo
  storage_path text not null,                    -- {narrador_id}/fotos/{id}.{ext} en bucket 'audios'
  epigrafe text,
  principal boolean not null default false,      -- una por capítulo: abre el capítulo
  orden int not null default 0,                  -- las adicionales, al cierre del capítulo
  ancho_px int,                                  -- para validar calidad de impresión
  alto_px int,
  subida_por uuid references auth.users (id),    -- dueña o invitado
  created_at timestamptz not null default now()
);
create index fotos_narrador_capitulo_idx on fotos (narrador_id, capitulo);
alter table fotos enable row level security;

-- ── 1. El guion por narrador ──────────────────────────────────────────────
alter table preguntas drop constraint if exists preguntas_tipo_check;
alter table preguntas add constraint preguntas_tipo_check
  check (tipo in ('fija', 'adaptativa', 'familia', 'sugerida'));
  -- fija: copiada del guion · adaptativa: la generó el cerebro al final
  -- familia: la escribió la dueña o un invitado · sugerida: la propuso el cerebro y la eligió la dueña

alter table preguntas
  add column foto_id uuid references fotos (id),          -- pregunta-foto: "¿qué estaba pasando ese día?"
  add column agregada_por uuid references auth.users (id); -- null = del guion o del cerebro

-- Backfill: cada narrador existente recibe su copia de las fijas globales.
-- Las globales (narrador_id null) quedan como plantilla para las compras nuevas.
insert into preguntas (narrador_id, orden, texto, capitulo, tipo)
select n.id, p.orden, p.texto, p.capitulo, 'fija'
from narradores n
cross join preguntas p
where p.narrador_id is null
  and not exists (
    select 1 from preguntas q where q.narrador_id = n.id and q.orden = p.orden
  );

-- ── 3. Invitados ──────────────────────────────────────────────────────────
create table invitados (
  id uuid primary key default gen_random_uuid(),
  narrador_id uuid not null references narradores (id) on delete cascade,
  email text not null,
  auth_user_id uuid references auth.users (id),  -- null hasta que entra por primera vez
  invitado_por uuid not null references familias (id),
  created_at timestamptz not null default now(),
  aceptado_at timestamptz
);
create unique index invitados_unico on invitados (narrador_id, lower(email));
alter table invitados enable row level security;

-- ── 4. Edición final y aprobación ─────────────────────────────────────────
alter table narradores
  add column edicion jsonb not null default '{}'::jsonb,
  -- {ordenCapitulos: text[], excluidas: uuid[] (respuestas.id), titulo, subtitulo,
  --  portadaFotoId: uuid, correcciones: text}
  add column libro_aprobado_at timestamptz;      -- "Cerrar libro": sin esto NO se produce nada, ni digital ni impreso.
                                                 -- Es el punto de aprobación del cliente (sin vuelta atrás después).

-- ── envios: el biógrafo ofrece la siguiente pregunta ──────────────────────
alter table envios drop constraint if exists envios_tipo_check;
alter table envios add constraint envios_tipo_check
  check (tipo in ('bienvenida','pregunta','repregunta','recordatorio','alerta_pausa',
                  'despedida','saludo_final','oferta_siguiente'));

-- contexto (jsonb, sin cambio de esquema) suma dos claves que lee el entrevistador:
--   ritmo:  'diario' (default) | 'dos_por_dia' | 'seguido'
--   evitar: texto libre con temas que no se preguntan
