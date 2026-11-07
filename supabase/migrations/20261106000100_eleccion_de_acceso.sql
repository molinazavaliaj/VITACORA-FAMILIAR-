-- La elección del narrador no se pierde (Naza, 06/11). `narradores.contexto` se escribe entero desde muchos lados:
-- quien leyó el contexto antes de que el narrador tocara el botón lo escribiría de vuelta sin su elección, y el bot
-- ya le habría confirmado. Dos piezas, en la base porque ahí pasan todas las escrituras de los tres servicios:
--   1. anotar_eleccion_acceso: guarda la elección de una sola vez, sin tocar el resto del contexto.
--   2. el trigger: fuera de esa función, nadie cambia una elección. El resto del contexto se escribe como siempre.
-- Sin elección guardada, ni nueva, el trigger no hace nada: la marca de la compra y el borrado de quien no aceptó siguen igual.
-- Para corregir una elección a mano, usar la función: un UPDATE directo vuelve al valor anterior sin dar error.

create or replace function anotar_eleccion_acceso(p_narrador uuid, p_acceso jsonb)
returns boolean
language plpgsql
set search_path = public
as $$
declare
  filas integer;
begin
  perform set_config('vitacora.eleccion_acceso', '1', true);
  update narradores
     set contexto = jsonb_set(contexto, '{acceso}', (contexto -> 'acceso') || p_acceso, true)
   where id = p_narrador
     and contexto #>> '{acceso,elige}' = 'true'
     and contexto #>> '{acceso,quien}' is distinct from p_acceso ->> 'quien';
  get diagnostics filas = row_count;
  perform set_config('vitacora.eleccion_acceso', '', true);
  return filas > 0; -- false: el mismo botón otra vez, o un narrador sin la marca
end;
$$;

revoke all on function anotar_eleccion_acceso(uuid, jsonb) from public, anon, authenticated;
grant execute on function anotar_eleccion_acceso(uuid, jsonb) to service_role;

create or replace function conservar_eleccion_acceso()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if current_setting('vitacora.eleccion_acceso', true) = '1' then
    return new;
  end if;
  if old.contexto #>> '{acceso,quien}' is null and new.contexto #>> '{acceso,quien}' is null then
    return new;
  end if;
  if old.contexto -> 'acceso' is null then
    new.contexto := new.contexto - 'acceso';
  else
    new.contexto := jsonb_set(coalesce(new.contexto, '{}'::jsonb), '{acceso}', old.contexto -> 'acceso', true);
  end if;
  return new;
end;
$$;

drop trigger if exists narradores_conservar_eleccion_acceso on narradores;
create trigger narradores_conservar_eleccion_acceso
  before update of contexto on narradores
  for each row
  when (old.contexto -> 'acceso' is distinct from new.contexto -> 'acceso')
  execute function conservar_eleccion_acceso();
