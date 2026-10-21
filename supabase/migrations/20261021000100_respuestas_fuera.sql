-- «Que esto no vaya al libro» por respuesta, desde el panel (docs/superpowers/specs/
-- 2026-10-21-respuesta-fuera-del-libro-design.md), 21/10.
--
-- La dueña saca del libro UNA respuesta (una fila de `respuestas`) de un narrador V3:
-- la contestó otra persona, se equivocó o no quiere que esté. Lo demás que contó en esa
-- pregunta sigue en el libro. Marcar = insertar; deshacer = borrar.
--
-- La escribe solo la web. La leen la fábrica (el escritor saca ese texto y su audio) y
-- el entrevistador (el cazador no la ve y una repregunta en cola sobre eso no sale).
-- Nadie toca entrevistas_v3.estado ni respuestas.
--
-- ⚠️ Toca supabase/CONTRATO.md («Respuestas sacadas por la familia»). La aplica Naza en
-- el SQL Editor. Idempotente. Sin esta tabla, todos toman que no hay nada sacado.

create table if not exists respuestas_fuera (
  respuesta_id  uuid primary key references respuestas (id) on delete cascade,
  narrador_id   uuid not null references narradores (id) on delete cascade,
  -- Quién la sacó (la dueña). null si se borró el usuario.
  marcada_por   uuid references auth.users (id) on delete set null,
  created_at    timestamptz not null default now()
);

create index if not exists respuestas_fuera_narrador on respuestas_fuera (narrador_id);

alter table respuestas_fuera enable row level security;  -- sin policies: solo la service role
