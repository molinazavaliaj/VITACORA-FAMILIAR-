-- Fotos sin capítulo (docs/panel-usuario.md §15.2, decisión del 13/09).
--
-- Hasta hoy toda foto pertenecía a un capítulo. Faltaba el álbum general: las
-- fotos que no son de una época sino del libro — la tapa, la contratapa, la
-- del marco. Con capitulo NULL la foto es "del libro"; cuál va a dónde lo
-- dice narradores.edicion (portadaFotoId, contratapaFotoId, marcoFotoId).
--
-- Aditiva: nada existente cambia. La aplica Naza (npx supabase db push).

alter table fotos alter column capitulo drop not null;

comment on column fotos.capitulo is
  'Capítulo del libro (mismo texto que preguntas.capitulo). NULL = foto del libro, sin época: candidata a tapa, contratapa o marco.';
