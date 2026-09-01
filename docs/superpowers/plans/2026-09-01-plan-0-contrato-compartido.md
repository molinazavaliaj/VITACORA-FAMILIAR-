# Plan 0: Contrato Compartido (Supabase) — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Crear el monorepo, el proyecto Supabase y el esquema de base de datos que es el contrato entre el Servicio Entrevistador y la Web Comprador.

**Architecture:** Monorepo con carpetas de propiedad exclusiva (`/entrevistador`, `/web`, `/supabase`, `/docs`). Este plan crea la estructura y todo lo que vive en `/supabase`. Se ejecuta UNA vez, antes de los planes A y B, idealmente en una sesión conjunta de los dos socios (o lo ejecuta uno y el otro hace pull).

**Tech Stack:** Supabase (Postgres + Storage), Supabase CLI, SQL.

## Global Constraints

- Idioma del código y la base: español para nombres de dominio (`narradores`, `respuestas`), inglés solo para términos técnicos estándar (`created_at`, `id`).
- Regla de propiedad: cada tabla tiene UN servicio que escribe (documentado en `supabase/CONTRATO.md`); la única excepción es `narradores` (la web crea; el entrevistador actualiza `estado` y `dia_actual`).
- Estados de narrador (exactos, en este orden de ciclo de vida): `invitado`, `acepto`, `activo`, `pausado`, `completado`, `cerrado_anticipado`.
- Convención de Storage (bucket `audios`, privado): respuestas en `{narrador_id}/dia_{NN}.ogg` (NN con cero a la izquierda, ej. `dia_04.ogg`; si hay varios audios el mismo día: `dia_04_2.ogg`, `dia_04_3.ogg`), saludos en `{narrador_id}/saludos/{saludo_id}.webm`, entregables en `{narrador_id}/paquete/`.
- Mercados: región es `'ES'` o `'AR'`, nunca otro valor.

---

### Task 1: Estructura del monorepo

**Files:**
- Create: `README.md`
- Create: `.gitignore`
- Create: `entrevistador/.gitkeep`
- Create: `web/.gitkeep`

**Interfaces:**
- Produces: la estructura de carpetas que los planes A y B asumen (`entrevistador/`, `web/`, `supabase/`).

- [ ] **Step 1: Crear README raíz**

```markdown
# Vitácora Familiar

En 30 días de entrevistas por WhatsApp, el libro y el audiolibro de la vida de tu familiar, contados con su propia voz.

## Estructura (propiedad por carpeta)

| Carpeta | Dueño | Qué es |
|---|---|---|
| `entrevistador/` | Socio 1 (Argentina) | Servicio Node/TS: WhatsApp + cerebro IA. Deploy: Railway. |
| `web/` | Socio 2 (Naza, Barcelona) | Next.js: registro, tablero, fábrica del libro, pagos. Deploy: Vercel. |
| `supabase/` | Compartida — avisar antes de tocar | Migraciones y contrato de datos. Leer `supabase/CONTRATO.md`. |
| `docs/` | Compartida | Spec de diseño y planes de implementación. |

**Regla de oro:** nadie toca la carpeta del otro. Los servicios se comunican SOLO por la base de datos.

Spec completo: `docs/superpowers/specs/2026-09-01-vitacora-familiar-design.md`
```

- [ ] **Step 2: Crear .gitignore**

```gitignore
node_modules/
.env
.env.local
.env*.local
dist/
.next/
*.log
.DS_Store
supabase/.temp/
```

- [ ] **Step 3: Crear las carpetas con .gitkeep**

Run: `mkdir entrevistador web && touch entrevistador/.gitkeep web/.gitkeep` (o el equivalente en PowerShell).

- [ ] **Step 4: Commit**

```bash
git add README.md .gitignore entrevistador/.gitkeep web/.gitkeep
git commit -m "chore: estructura del monorepo con propiedad por carpeta"
```

---

### Task 2: Proyecto Supabase y migración inicial

**Files:**
- Create: `supabase/config.toml` (lo genera `supabase init`)
- Create: `supabase/migrations/20260901000000_esquema_inicial.sql`

**Interfaces:**
- Produces: las tablas `familias`, `narradores`, `preguntas`, `respuestas`, `saludos`, `pedidos`, `envios` con exactamente las columnas de abajo. Los planes A y B las consumen tal cual.

- [ ] **Step 1: Crear el proyecto en supabase.com**

Manual (requiere cuenta): crear proyecto "vitacora-familiar" en [supabase.com](https://supabase.com), región `eu-west` (Frankfurt/París — el mercado principal de pago es España y RGPD manda). Guardar: URL del proyecto, `anon key`, `service_role key`, contraseña de la base. **No commitear ninguna key.**

- [ ] **Step 2: Inicializar Supabase CLI en el repo**

Run: `npx supabase init` (desde la raíz del repo)
Expected: crea `supabase/config.toml`.

- [ ] **Step 3: Escribir la migración inicial**

Crear `supabase/migrations/20260901000000_esquema_inicial.sql`:

```sql
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
  contexto jsonb not null default '{}'::jsonb,   -- {lugar_nacimiento, oficio, conyuge, hijos, datos_extra}
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
  orden int not null,                            -- 1..25 fijas, 26..30 adaptativas
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
```

- [ ] **Step 4: Aplicar la migración al proyecto**

Run: `npx supabase link --project-ref <ref-del-proyecto>` y luego `npx supabase db push`
Expected: `Applying migration 20260901000000_esquema_inicial.sql... Finished.`

- [ ] **Step 5: Verificar**

Run: `npx supabase db diff` (o mirar el Table Editor en el dashboard)
Expected: sin diferencias; las 7 tablas existen.

- [ ] **Step 6: Commit**

```bash
git add supabase/
git commit -m "feat: esquema inicial - el contrato de datos entre entrevistador y web"
```

---

### Task 3: Bucket de Storage

**Files:**
- Create: `supabase/migrations/20260901000001_storage.sql`

**Interfaces:**
- Produces: bucket privado `audios`. El entrevistador sube `{narrador_id}/dia_NN.ogg`; la web sube `{narrador_id}/saludos/*` y `{narrador_id}/paquete/*` y lee todo con URLs firmadas.

- [ ] **Step 1: Migración del bucket**

Crear `supabase/migrations/20260901000001_storage.sql`:

```sql
insert into storage.buckets (id, name, public)
values ('audios', 'audios', false);
-- Sin políticas de acceso público: ambos servicios operan con service_role,
-- y el navegador solo recibe URLs firmadas generadas por la web.
```

- [ ] **Step 2: Aplicar y verificar**

Run: `npx supabase db push`
Expected: bucket `audios` visible en el dashboard de Storage, marcado Private.

- [ ] **Step 3: Commit**

```bash
git add supabase/migrations/20260901000001_storage.sql
git commit -m "feat: bucket privado de audios con convencion de carpetas"
```

---

### Task 4: Seed de preguntas fijas

**Files:**
- Create: `supabase/seed.sql`

**Interfaces:**
- Produces: filas en `preguntas` con `narrador_id = null`, `orden` 1..25, `tipo = 'fija'`. El entrevistador las lee por `orden`; la web lee `capitulo` para armar el índice del libro.

- [ ] **Step 1: El seed definitivo ya está escrito**

Las 25 preguntas definitivas fueron firmadas por los dos socios en la sesión de brainstorming del 2026-09-01 y ya viven en `supabase/seed.sql` (8 capítulos: La infancia ×4, Las raíces ×3, La juventud ×5, El amor ×3, El oficio ×3, Los hijos ×3, Las pruebas ×2, La sabiduría ×2). No tocar los textos sin acuerdo de ambos socios.

- [ ] **Step 2: Aplicar el seed**

Run: `npx supabase db push` no aplica seeds; ejecutar con `psql` o pegar el SQL en el SQL Editor del dashboard.
Expected: `select count(*) from preguntas` devuelve 3.

- [ ] **Step 3: Commit**

```bash
git add supabase/seed.sql
git commit -m "feat: seed provisional de preguntas fijas (3 de 25, formato definitivo)"
```

---

### Task 5: CONTRATO.md — el documento que ambos Claude leen

**Files:**
- Create: `supabase/CONTRATO.md`

**Interfaces:**
- Produces: la referencia canónica de propiedad de escritura y transiciones de estado. Todo cambio de esquema empieza por editar este archivo.

- [ ] **Step 1: Escribir el contrato**

```markdown
# CONTRATO DE DATOS — leer antes de tocar cualquier tabla

Los dos servicios se comunican SOLO por esta base. Cambiar el esquema = nueva
migración en `supabase/migrations/` + actualizar este archivo + avisar al otro socio.

## Propiedad de escritura

| Tabla | Escribe | Lee | Nota |
|---|---|---|---|
| `familias` | web | entrevistador | |
| `narradores` | web (crea, edita datos) / entrevistador (solo `estado`, `dia_actual`, `ultima_respuesta_at`, `alerta_silencio`) | ambos | Única tabla compartida. La web también apaga `alerta_silencio`. |
| `preguntas` | entrevistador (adaptativas) / seed (fijas) | web | Fijas: `narrador_id = null`. |
| `respuestas` | entrevistador | web | La web NUNCA escribe acá. |
| `saludos` | web (crea) / entrevistador (solo `entregado`) | ambos | |
| `pedidos` | web | — | El entrevistador no la mira. |
| `envios` | entrevistador | — | Log de salientes; idempotencia del scheduler. |

## Transiciones de estado de `narradores.estado`

    invitado → acepto            (entrevistador: recibió el "SÍ")
    acepto → activo              (entrevistador: envió la pregunta 1)
    activo → pausado             (entrevistador: el narrador pidió parar)
    pausado → activo             (entrevistador: el narrador volvió a escribir)
    activo → completado          (entrevistador: respuesta 30 recibida y despedida enviada)
    activo|pausado → cerrado_anticipado  (web: Martina pidió cierre con ≥10 respuestas)

Ningún otro salto es válido. Quien detecta un estado imposible loguea y NO corrige solo.

## Storage — bucket privado `audios`

    {narrador_id}/dia_NN.ogg          respuestas (entrevistador sube; NN = pregunta_orden, 2 dígitos; extras: dia_NN_2.ogg)
    {narrador_id}/saludos/{id}.webm   saludos (web sube)
    {narrador_id}/sistema/…           audios TTS del entrevistador (entrevistador sube)
    {narrador_id}/paquete/…           estructura, PDF y audiolibro (web/fábrica — socio 2 — sube)

El navegador jamás recibe paths directos: solo URLs firmadas que genera la web.

## Tipos TypeScript

Cada servicio genera sus tipos con:
`npx supabase gen types typescript --linked > src/db/tipos.ts`
Regenerar después de cada migración.
```

- [ ] **Step 2: Commit**

```bash
git add supabase/CONTRATO.md
git commit -m "docs: contrato de datos - propiedad de escritura y transiciones de estado"
```

---

## Verificación final del plan

- [ ] Las 7 tablas existen en Supabase y `preguntas` tiene 3 filas seed.
- [ ] El bucket `audios` existe y es privado.
- [ ] `git log` muestra los 5 commits del plan.
- [ ] El repo está pusheado a GitHub (privado) y el socio 1 tiene acceso.
