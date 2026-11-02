-- Panel de la empresa: dos pantallas nuevas (02/11).
--
--   1. avisos     cada aviso a los socios (los mismos que van por mail a MAIL_SOCIOS),
--                 para verlos también en /admin/notificaciones. Lo escriben los tres
--                 servicios que mandan avisos (web, entrevistador, fábrica) en el mismo
--                 momento en que mandan el mail. /admin sólo pone `visto_at`.
--   2. contenido  el calendario de contenido (/admin/contenido): cada archivo que se
--                 sube a la carpeta, y si tiene fecha, en qué día del calendario va.
--                 Lo escribe sólo /admin.
--
-- Sin políticas de RLS a propósito, como las del panel (20260921000100): con RLS
-- prendido y sin policy, sólo la service role lee y escribe.
--
-- El bucket `contenido` es privado: el navegador sube con una URL firmada que da
-- /admin y ve los archivos con URLs firmadas de una hora.
--
-- ⚠️ Toca supabase/CONTRATO.md. La aplica Naza en el SQL Editor.

create table if not exists avisos (
  id          uuid primary key default gen_random_uuid(),
  creado_at   timestamptz not null default now(),
  servicio    text not null check (servicio in ('web', 'entrevistador', 'fabrica')),
  asunto      text not null,
  detalle     text,
  clave       text,                 -- la clave de deduplicación del entrevistador (si la hay)
  salio_mail  boolean,              -- true salió, false falló, null no había a quién mandarlo
  visto_at    timestamptz           -- lo marca /admin; null = sin ver
);
create index if not exists avisos_creado_idx on avisos (creado_at desc);
create index if not exists avisos_sin_ver_idx on avisos (creado_at desc) where visto_at is null;
alter table avisos enable row level security;

create table if not exists contenido (
  id            uuid primary key default gen_random_uuid(),
  creado_at     timestamptz not null default now(),
  archivo_path  text not null unique,   -- en el bucket `contenido`
  nombre        text not null,          -- el nombre del archivo tal como se subió
  tipo          text not null,          -- el MIME (image/jpeg, video/mp4…)
  tamano        bigint,
  titulo        text,
  texto         text,                   -- el texto que acompaña la publicación
  red           text check (red in ('instagram', 'tiktok', 'facebook', 'youtube', 'otra')),
  fecha         date,                   -- null = está en la carpeta, sin día
  hora          time,
  orden         int not null default 0, -- el orden dentro del mismo día (o de la carpeta)
  estado        text not null default 'borrador' check (estado in ('borrador', 'listo', 'publicado')),
  subido_por    text
);
create index if not exists contenido_fecha_idx on contenido (fecha, orden);
alter table contenido enable row level security;

insert into storage.buckets (id, name, public)
values ('contenido', 'contenido', false)
on conflict (id) do nothing;
