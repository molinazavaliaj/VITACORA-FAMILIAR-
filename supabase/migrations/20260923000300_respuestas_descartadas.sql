-- Descartar una respuesta sin borrarla (biógrafo v2, hallazgo 43 — acordado por Naza y
-- Joaquín el 23/09).
--
-- El 17/09 un audio de Ciro se cargó en la orden 27 de Joaquín. Quien cargaba se dio
-- cuenta y cargó el correcto, pero la puerta manual no tenía "reemplazar": solo podía
-- sumarlo como repregunta, y el malo quedó en la base igual que cualquier respuesta.
-- La fábrica lo usó y la historia de Ciro terminó en el libro de Joaquín. El error se
-- DETECTÓ; lo que faltó fue una forma de sacarlo sin borrar la evidencia.
--
-- Descartar = MOVER la fila de `respuestas` a `respuestas_descartadas`, con el motivo.
-- Por qué una tabla aparte y no una columna: hay 25 lugares en entrevistador, fábrica y
-- web que leen `respuestas`; con una columna, el que se olvide de filtrarla vuelve a
-- meter el audio ajeno en el libro. Lo que no está en `respuestas` no llega a ningún lado.
--
-- Se hace con dos funciones para que el movimiento sea UNO SOLO (nunca queda en las dos
-- tablas ni en ninguna). Solo las puede llamar el servidor (service_role): con la clave
-- pública de la web no se puede descartar nada.
--
-- El audio NO se borra: la puerta manual lo mueve a `{narrador}/descartadas/` en Storage
-- ANTES de llamar a la función, porque el audiolibro elige los audios por nombre
-- (`dia_NN*.ogg`) en la carpeta del narrador, no por la tabla.
--
-- ⚠️ La aplica Naza en el SQL Editor. Es idempotente y no toca datos existentes.

create table if not exists respuestas_descartadas (
  id uuid primary key,                -- el mismo id que tenía en `respuestas`
  narrador_id uuid not null references narradores(id) on delete cascade,
  pregunta_orden integer not null,
  audio_path text,                    -- dónde quedó el audio (ya en descartadas/)
  fila jsonb not null,                -- la fila entera, tal cual estaba, para poder restaurarla
  motivo text not null check (length(trim(motivo)) > 0),
  descartada_at timestamptz not null default now()
);

alter table respuestas_descartadas enable row level security;
-- Sin políticas: solo el servidor (service_role, que saltea RLS) la lee y la escribe.

comment on table respuestas_descartadas is
  'Respuestas que entraron por error (audio de otro narrador, cargado dos veces, pregunta equivocada). No van al libro ni al audiolibro; se guardan para poder escucharlas y restaurarlas.';

-- Mueve UNA respuesta (por id) a descartadas. `p_audio_path` es donde quedó el audio
-- después de moverlo en Storage (null si no tenía).
create or replace function descartar_respuesta(p_id uuid, p_motivo text, p_audio_path text)
returns respuestas_descartadas
language plpgsql
set search_path = public
as $$
declare
  movida respuestas_descartadas;
begin
  with borrada as (
    delete from respuestas where id = p_id returning *
  )
  insert into respuestas_descartadas (id, narrador_id, pregunta_orden, audio_path, fila, motivo)
  select b.id, b.narrador_id, b.pregunta_orden, p_audio_path, to_jsonb(b.*), p_motivo
  from borrada b
  returning * into movida;

  if movida.id is null then
    raise exception 'No existe la respuesta %', p_id;
  end if;
  return movida;
end;
$$;

-- La vuelve a `respuestas` tal cual estaba, con el audio donde esté ahora (la puerta
-- manual lo devuelve a su carpeta antes de llamar). Si después de descartarla se
-- agregó a `respuestas` una columna NOT NULL sin default, esto falla: se restaura a mano.
create or replace function restaurar_respuesta(p_id uuid, p_audio_path text)
returns respuestas
language plpgsql
set search_path = public
as $$
declare
  vuelta respuestas;
begin
  insert into respuestas
  select (jsonb_populate_record(null::respuestas, d.fila || jsonb_build_object('audio_path', p_audio_path))).*
  from respuestas_descartadas d
  where d.id = p_id
  returning * into vuelta;

  if vuelta.id is null then
    raise exception 'No existe la respuesta descartada %', p_id;
  end if;
  delete from respuestas_descartadas where id = p_id;
  return vuelta;
end;
$$;

revoke all on function descartar_respuesta(uuid, text, text) from public, anon, authenticated;
revoke all on function restaurar_respuesta(uuid, text) from public, anon, authenticated;
grant execute on function descartar_respuesta(uuid, text, text) to service_role;
grant execute on function restaurar_respuesta(uuid, text) to service_role;
