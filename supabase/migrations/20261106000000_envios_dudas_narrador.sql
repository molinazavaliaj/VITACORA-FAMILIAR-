-- Los mensajes a quien contó (plan docs/superpowers/plans/2026-11-06-dudas-narrador-sobre-212.md): el link al terminar
-- con la plantilla y el aviso de dudas se anotan en `envios` para saber si Meta los entregó. Idempotente y no toca datos.
--
-- Sin ella el mensaje sale igual y la marca se escribe; solo falla la fila de `envios`, queda en el log y no llega el
-- aviso de «no entregado».
--
-- Toca supabase/CONTRATO.md ("Lo contado es privado"). La aplica Naza.
-- La lista de `envios.tipo` se reescribe entera (como en 20261023000000_historias, la última que la tocó).

alter table envios drop constraint if exists envios_tipo_check;
alter table envios add constraint envios_tipo_check
  check (tipo in ('bienvenida','pregunta','repregunta','recordatorio','alerta_pausa',
                  'despedida','saludo_final','oferta_siguiente','objeto','v3','regalo_entrega','viaje_v2','kids',
                  'historia','revision','dudas_narrador'));
