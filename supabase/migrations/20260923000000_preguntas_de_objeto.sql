-- «Sus objetos preciados» (3t.30, decisión de Joaquín 22/09). Spec: docs/objetos-preciados.md
--
-- El guion pregunta por historias y la persona contesta en audio. Esto suma una
-- segunda vía: antes de cerrar cada capítulo, el biógrafo le pide UN objeto
-- concreto —el primer reloj, la camisa que no tiró, el amuleto, la mascota— con
-- la foto y de dónde salió. Ocho en todo el libro, uno por capítulo.
--
-- La foto no abre una sección nueva: cierra su capítulo, entera y sin recortar,
-- como las fotos de cierre que la fábrica ya sabe poner (CONTRATO, 18/09).
--
-- ⚠️ Toca supabase/CONTRATO.md → la escribe Joaquín, la aplica Naza.
-- Es idempotente y no toca ni un dato existente.

-- 1. Un tipo más de pregunta. Es una fila del guion como cualquier otra: se ve
--    en el panel, se edita, se arrastra y se borra con lo que ya existe.
alter table preguntas drop constraint if exists preguntas_tipo_check;
alter table preguntas add constraint preguntas_tipo_check
  check (tipo in ('fija', 'adaptativa', 'familia', 'sugerida', 'objeto'));
  -- fija: copiada del guion · adaptativa: la generó el cerebro al final
  -- familia: la escribió la dueña o un invitado · sugerida: la propuso el cerebro
  -- objeto: el pedido de un objeto preciado, al cierre de un capítulo

-- 2. Qué pregunta contesta esta foto.
--    WhatsApp no dice a qué mensaje responde una imagen, así que la foto se ata
--    al último pedido abierto (mandado hace menos de 48 hs y todavía sin foto).
--    Null = la mandó suelta, sin que se la pidiéramos: eso también vale.
alter table fotos add column if not exists pregunta_orden int;

comment on column fotos.pregunta_orden is
  'La pregunta de objeto que esta foto contesta (preguntas.orden del guion propio). '
  'Null = la foto llegó suelta o la subió la familia desde el panel.';

create index if not exists fotos_narrador_pregunta_idx on fotos (narrador_id, pregunta_orden);

-- 3. El envío del pedido. `envios.tipo` tiene un check cerrado y 'objeto' no
--    estaba: sin esto el pedido SE MANDA pero no se puede anotar, y entonces
--    la foto que vuelve no encuentra a qué pedido atarse. La regla de "se pide
--    una sola vez" también depende de esta fila.
alter table envios drop constraint if exists envios_tipo_check;
alter table envios add constraint envios_tipo_check
  check (tipo in ('bienvenida','pregunta','repregunta','recordatorio','alerta_pausa',
                  'despedida','saludo_final','oferta_siguiente','objeto'));
