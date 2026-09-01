-- Contrato de datos Vitácora Familiar v1.
-- Propiedad de escritura por tabla: ver supabase/CONTRATO.md

create table familias (
  id uuid primary key default gen_random_uuid(),
  auth_user_id uuid unique references auth.users (id),
  email text not null,
  nombre text not null,
  region text not null check (region in ('ES', 'AR')),
  created_at timestamptz not null default now()
);

create table narradores (
  id uuid primary key default gen_random_uuid(),
  familia_id uuid not null references familias (id),
  nombre text not null,                          -- "Roberto"
  como_le_dicen text not null,                   -- "Don Roberto" / "Abuelo" — cómo lo saluda el entrevistador
  telefono_whatsapp text not null unique,        -- E.164, ej. +5491155551234
  hora_preferida time not null default '10:00',
  zona_horaria text not null,                    -- IANA, ej. 'Europe/Madrid' / 'America/Argentina/Buenos_Aires'
  contexto jsonb not null default '{}'::jsonb,   -- {lugarNacimiento, anioNacimiento, oficio, vinculoComprador, datosExtra, arbol:{padres,hermanos,conyuge,hijos}}
  foto_url text,                                 -- portada del libro; la sube la web a Storage
  estado text not null default 'invitado'
    check (estado in ('invitado','acepto','activo','pausado','completado','cerrado_anticipado')),
  dia_actual int not null default 0,             -- última pregunta ENVIADA (0 = ninguna)
  ultima_respuesta_at timestamptz,               -- para detectar 3 días de silencio
  alerta_silencio boolean not null default false,-- entrevistador la prende; web la muestra y apaga
  created_at timestamptz not null default now()
);

create table preguntas (
  id uuid primary key default gen_random_uuid(),
  narrador_id uuid references narradores (id),   -- null = pregunta fija global (las 25)
  orden int not null,                            -- 1..25 fijas, 26..30 adaptativas (o reemplazos por no-aplica)
  texto text not null,
  capitulo text not null,                        -- capítulo del libro que alimenta
  tipo text not null default 'fija' check (tipo in ('fija','adaptativa')),
  unique nulls not distinct (narrador_id, orden)
);

create table respuestas (
  id uuid primary key default gen_random_uuid(),
  narrador_id uuid not null references narradores (id),
  pregunta_orden int not null,                   -- 1..30; se une con preguntas por (narrador_id|null, orden)
  audio_path text,                               -- path en bucket 'audios'; null si respondió por texto
  texto_directo text,                            -- solo si respondió escribiendo
  transcripcion text,                            -- la escribe el entrevistador al transcribir
  duracion_segundos int,
  es_repregunta boolean not null default false,  -- true = respuesta a la repregunta del mismo día
  recibido_at timestamptz not null default now()
);

create table saludos (
  id uuid primary key default gen_random_uuid(),
  narrador_id uuid not null references narradores (id),
  nombre text not null,                          -- quién saluda
  vinculo text not null,                         -- "hijo", "nieta", "amigo de toda la vida"
  audio_path text not null,
  entregado boolean not null default false,      -- el entrevistador la marca al entregarlo el último día
  created_at timestamptz not null default now()
);

create table pedidos (
  id uuid primary key default gen_random_uuid(),
  familia_id uuid not null references familias (id),
  narrador_id uuid not null references narradores (id),
  proveedor text check (proveedor in ('stripe','mercadopago')),
  estado text not null default 'pendiente'
    check (estado in ('pendiente','pagado','generando','entregado','fallido')),
  monto numeric(10,2),
  moneda text check (moneda in ('EUR','ARS')),
  referencia_externa text,                       -- session id de Stripe / preference id de MP
  libro_pdf_path text,                           -- path del PDF final en bucket 'audios'
  audiolibro_paths jsonb,                        -- {"capitulos": ["path1", ...], "completo": "path"}
  created_at timestamptz not null default now()
);

-- Registro de todo mensaje saliente del entrevistador (debug + idempotencia del scheduler)
create table envios (
  id uuid primary key default gen_random_uuid(),
  narrador_id uuid not null references narradores (id),
  tipo text not null check (tipo in ('bienvenida','pregunta','repregunta','recordatorio','alerta_pausa','despedida','saludo_final')),
  pregunta_orden int,                            -- para tipo 'pregunta'/'repregunta'/'recordatorio'
  wa_message_id text,
  enviado_at timestamptz not null default now()
);

create index respuestas_narrador_idx on respuestas (narrador_id, pregunta_orden);
create index envios_narrador_dia_idx on envios (narrador_id, tipo, enviado_at);
create index narradores_estado_idx on narradores (estado);

-- RLS: todo cerrado por defecto. Ambos servicios usan service_role (server-side).
-- La web expone datos al navegador únicamente a través de sus propios endpoints.
alter table familias enable row level security;
alter table narradores enable row level security;
alter table preguntas enable row level security;
alter table respuestas enable row level security;
alter table saludos enable row level security;
alter table pedidos enable row level security;
alter table envios enable row level security;
