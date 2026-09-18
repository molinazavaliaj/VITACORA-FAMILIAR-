-- Dónde va y cómo se encuadra la foto (CONTRATO.md, "Dónde va y cómo se encuadra
-- la foto del capítulo"). Propuesta de Joaquín, 18/09, sale del piloto.
--
-- ⚠️ Toca supabase/CONTRATO.md → lo acuerdan los dos socios antes de aplicarla.

-- Solo importa en la foto principal del capítulo: antes del título (como hoy) o
-- debajo del título, antes del texto.
alter table fotos add column if not exists posicion text not null default 'arriba'
  check (posicion in ('arriba', 'abajo'));

-- El punto de la foto que tiene que quedar centrado al recortarla al marco
-- (0..1 en cada eje; 0.5/0.5 = el centro, lo de siempre).
alter table fotos add column if not exists foco jsonb not null default '{"x": 0.5, "y": 0.5}'::jsonb;
