-- El número de pedido (Naza, 05/11): VF-1001, VF-1002… El corto, el que se dicta y va en
-- la etiqueta del paquete como referencia. Lo generamos nosotros; el de seguimiento lo da
-- el correo y vive en `entregas.seguimiento`: son dos cosas distintas.
--
-- En la base se guarda el número solo (1001); el «VF-» lo pone quien lo muestra.
--
-- Lo pone un trigger, no la web: un pedido pasa a cobrado por varios caminos (webhook de
-- Stripe, /api/pago/vuelta, un piloto pasado a mano en el SQL Editor) y así ninguno se
-- puede olvidar. Un pedido sin pagar no consume número.
--
-- `fallido` es un libro que falló al escribirse: de acá en adelante ya pasó por `pagado`, tiene
-- su número y lo conserva. En el relleno, los fallidos viejos reciben número solo si tienen
-- referencia del proveedor de pago: es lo que prueba que se cobraron.
--
-- Idempotente: se puede correr de nuevo sin cambiarle el número a nadie.
-- ⚠️ Toca supabase/CONTRATO.md («Número de pedido»). La aplica Naza en el SQL Editor.

alter table pedidos add column if not exists numero int;

create sequence if not exists pedidos_numero_seq start with 1001 minvalue 1001 owned by pedidos.numero;

create or replace function pedidos_poner_numero() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if new.numero is null and new.estado in ('pagado', 'generando', 'esperando_voz', 'entregado') then
    new.numero = nextval('public.pedidos_numero_seq');
  end if;
  return new;
end $$;

drop trigger if exists pedidos_poner_numero on pedidos;
create trigger pedidos_poner_numero before insert or update of estado on pedidos
  for each row execute function pedidos_poner_numero();

-- Los que ya se cobraron, del más viejo al más nuevo. Un bucle y no un UPDATE con
-- nextval, que no garantiza el orden.
do $$
declare
  fila record;
begin
  for fila in
    select id from pedidos
    where numero is null
      and (estado in ('pagado', 'generando', 'esperando_voz', 'entregado')
           or (estado = 'fallido' and referencia_externa is not null))
    order by created_at, id
  loop
    update pedidos set numero = nextval('public.pedidos_numero_seq') where id = fila.id;
  end loop;
end $$;

create unique index if not exists pedidos_numero_key on pedidos (numero);
