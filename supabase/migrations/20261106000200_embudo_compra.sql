-- El embudo de la compra (checkout etapa 1, 06/11): cuántas visitas llegan a cada paso.
-- Es un contador por día, región y dispositivo. No guarda cookie, IP, correo ni ningún
-- identificador de persona, por eso no depende del aviso de cookies.
--
-- Pasos: entro, para_quien, pago, pagar, pagado. Compra: familiar (por ahora).
-- Idempotente: se puede correr de nuevo.
-- La aplica Naza en el SQL Editor al mergear. No tocar producción antes.

create table if not exists embudo_compra (
  dia          date not null,
  compra       text not null,
  paso         text not null,
  region       text not null,
  dispositivo  text not null,
  cuenta       int  not null default 0,
  primary key (dia, compra, paso, region, dispositivo)
);

-- Sin políticas: solo entra el servidor con la clave de servicio.
alter table embudo_compra enable row level security;

create or replace function sumar_embudo(p_compra text, p_paso text, p_region text, p_dispositivo text)
returns void
language sql security definer set search_path = public as $$
  insert into embudo_compra (dia, compra, paso, region, dispositivo, cuenta)
  values ((now() at time zone 'Europe/Madrid')::date, p_compra, p_paso, p_region, p_dispositivo, 1)
  on conflict (dia, compra, paso, region, dispositivo)
  do update set cuenta = embudo_compra.cuenta + 1;
$$;

revoke all on function sumar_embudo(text, text, text, text) from public, anon, authenticated;
grant execute on function sumar_embudo(text, text, text, text) to service_role;
