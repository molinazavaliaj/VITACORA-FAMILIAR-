-- Pago por adelantado (decisión de los socios, 2026-09-11).
--
-- La compra crea al narrador ANTES de que el pago esté confirmado, y el
-- entrevistador no debe escribirle por WhatsApp hasta que lo esté. Hace falta
-- un estado que el scheduler ignore: `pendiente_pago`. La web lo pasa a
-- `invitado` cuando Stripe/MercadoPago confirman el cobro; recién ahí el
-- entrevistador lo toma como siempre.
--
-- No cambia nada del código del entrevistador: su scheduler ya filtra por los
-- estados que conoce y este no está en ninguna lista.
--
-- ⚠️ Toca supabase/CONTRATO.md → lo acuerdan los dos socios antes de aplicarla.

alter table narradores drop constraint if exists narradores_estado_check;
alter table narradores add constraint narradores_estado_check
  check (estado in (
    'pendiente_pago',
    'invitado', 'acepto', 'activo', 'pausado', 'completado', 'cerrado_anticipado'
  ));

-- Qué se compró además de la base (PDF + audiolibro): libro impreso, a color,
-- marcos con NFC. Lo escribe la web al crear el pedido; la fábrica lo lee
-- cuando toque producir cada cosa. Formato:
--   {"impreso": "bn" | "color" | null, "marcos": 0..N}
alter table pedidos add column if not exists extras jsonb not null default '{}'::jsonb;

-- La familia se crea con el mail del pago y sin usuario de auth; el usuario
-- se crea al confirmar el cobro. Para encontrar a la familia de un comprador
-- que vuelve, el mail tiene que ser único.
create unique index if not exists familias_email_unico on familias (lower(email));
