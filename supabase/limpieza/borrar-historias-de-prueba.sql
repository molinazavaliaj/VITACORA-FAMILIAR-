-- Borrar historias de prueba (02/11, Joaquín: «las de Se frenó son todas pruebas y nos marean»).
--
-- Se corre A MANO en el SQL Editor de Supabase (proyecto VITACORA FAMILIAR), en dos pasos.
-- No es una migración: no va en supabase/migrations y nadie lo corre solo.
--
-- PASO 1 — Mirar. Corré solo esta consulta y anotá los `id` de las que son pruebas.
-- PASO 2 — Borrar. Pegá esos ids en la lista de abajo y corré el bloque `do`.
--           Es todo o nada: si algo falla, no se borra ninguna fila.
--
-- Qué se borra de cada narrador: sus pedidos (y lo que cuelga de ellos: entregas, regalos,
-- comisiones, narraciones), sus respuestas, preguntas, envíos, saludos, fotos, invitados y
-- su fila de V3 / Viaje / Kids / Historia. El gasto de IA queda, sin narrador (la base lo
-- deja en null sola), porque esa plata sí se gastó. La familia (el comprador) NO se borra:
-- puede tener otras historias y su cuenta para entrar.
-- Los archivos (audios y fotos en Storage, carpeta {id}/) tampoco se borran desde acá.


-- ═══ PASO 1 · Mirar ══════════════════════════════════════════════════════════════════
select
  n.id,
  n.nombre,
  n.estado,
  f.email                       as familia,
  to_char(n.created_at, 'DD/MM/YYYY') as creado,
  to_char(n.ultima_respuesta_at, 'DD/MM HH24:MI') as ultima_respuesta,
  (select count(*) from respuestas r where r.narrador_id = n.id) as respuestas,
  (select string_agg(p.estado || ' ' || coalesce(p.monto::text, '') || ' ' || coalesce(p.moneda, ''), ', ')
     from pedidos p where p.narrador_id = n.id) as pedidos
from narradores n
left join familias f on f.id = n.familia_id
order by n.created_at desc;


-- ═══ PASO 2 · Borrar ═════════════════════════════════════════════════════════════════
-- Reemplazá los ids de ejemplo por los de las pruebas (entre comillas simples, separados por coma).
do $$
declare
  ids uuid[] := array[
    '00000000-0000-0000-0000-000000000000'
  ]::uuid[];
  pedidos_ids uuid[];
  borrados int;
begin
  select coalesce(array_agg(id), '{}') into pedidos_ids from pedidos where narrador_id = any(ids);

  -- Lo que cuelga de los pedidos.
  if to_regclass('public.comisiones_creadores') is not null then
    delete from comisiones_creadores where pedido_id = any(pedidos_ids);
  end if;
  delete from narraciones where narrador_id = any(ids) or pedido_id = any(pedidos_ids);
  if to_regclass('public.regalos') is not null then
    delete from regalos where narrador_id = any(ids) or pedido_id = any(pedidos_ids);
  end if;
  if to_regclass('public.entregas') is not null then
    delete from entregas where narrador_id = any(ids) or pedido_id = any(pedidos_ids);
  end if;
  delete from pedidos where id = any(pedidos_ids);

  -- Lo que cuelga del narrador.
  if to_regclass('public.respuestas_fuera') is not null then
    delete from respuestas_fuera where narrador_id = any(ids);
  end if;
  delete from respuestas where narrador_id = any(ids);
  delete from preguntas where narrador_id = any(ids); -- las globales (narrador_id null) no se tocan
  delete from envios where narrador_id = any(ids);
  delete from saludos where narrador_id = any(ids);
  delete from fotos where narrador_id = any(ids);
  delete from invitados where narrador_id = any(ids);
  if to_regclass('public.entrevistas_v3') is not null then
    delete from entrevistas_v3 where narrador_id = any(ids);
  end if;
  if to_regclass('public.viajes_v2') is not null then
    delete from viajes_v2 where narrador_id = any(ids);
  end if;
  if to_regclass('public.kids_v2') is not null then
    delete from kids_v2 where narrador_id = any(ids);
  end if;
  if to_regclass('public.historias') is not null then
    delete from historias where narrador_id = any(ids);
  end if;

  delete from narradores where id = any(ids);
  get diagnostics borrados = row_count;
  raise notice 'Listo: % historias y % pedidos borrados.', borrados, coalesce(array_length(pedidos_ids, 1), 0);
end $$;
