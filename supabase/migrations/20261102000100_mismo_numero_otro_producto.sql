-- Un mismo WhatsApp en otro producto (02/11).
--
-- Hasta hoy `narradores.telefono_whatsapp` era único: quien terminó su Familiar no podía hacer después una Historia,
-- un Viaje o canjear un regalo con su número (la compra rebotaba con «ese número ya está»). Desde esta migración el
-- número es único solo entre los narradores SIN TERMINAR: uno terminado ('completado', 'cerrado_anticipado') deja el
-- número libre para el que sigue. Nunca hay dos entrevistas en curso con el mismo número.
--
-- El entrevistador, cuando escribe ese número, contesta al que está en curso (flujo/elegir-narrador.ts). Si cambia la
-- lista de estados terminados, cambia también ESTADOS_TERMINADOS de ese archivo.
--
-- ⚠️ Toca supabase/CONTRATO.md («narradores»). La aplica Naza en el SQL Editor, ANTES de publicar el entrevistador
-- nuevo (con el código viejo, dos filas con el mismo número harían que el bot conteste a una cualquiera). Idempotente.
-- Varios NULL (regalos sin canjear) se siguen admitiendo.

-- El `unique` de la columna (se llama narradores_telefono_whatsapp_key si nadie lo renombró): se busca por la columna
-- para no depender del nombre.
do $$
declare r record;
begin
  for r in
    select c.conname from pg_constraint c
    join pg_attribute a on a.attrelid = c.conrelid and a.attnum = any (c.conkey)
    where c.conrelid = 'narradores'::regclass and c.contype = 'u' and a.attname = 'telefono_whatsapp'
      and array_length(c.conkey, 1) = 1
  loop
    execute format('alter table narradores drop constraint %I', r.conname);
  end loop;
end $$;

create unique index if not exists narradores_telefono_vigente
  on narradores (telefono_whatsapp)
  where estado not in ('completado', 'cerrado_anticipado');

-- Para buscar por número a todos los narradores, terminados incluidos.
create index if not exists narradores_telefono_idx on narradores (telefono_whatsapp);
