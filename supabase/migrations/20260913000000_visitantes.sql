-- El link público del libro cerrado (docs/panel-usuario.md §8, decisión 12/09).
--
-- Quien abre el link puede "guardarlo en su cuenta": entra a ver una MUESTRA
-- (portada, capítulos, primer párrafo, un minuto de audio), no la historia
-- entera como un invitado. Es la misma tabla `invitados` con un rol distinto,
-- así el panel los lista igual y los permisos los decide lib/panel.ts.
--
-- ⚠️ Toca supabase/CONTRATO.md. Aditiva; la confirma Naza con la 20260912.

alter table invitados
  add column rol text not null default 'invitado'
    check (rol in ('invitado', 'visitante'));
  -- invitado:  lo invitó la dueña con el libro abierto. Ve todo, suma preguntas y fotos.
  -- visitante: abrió el link del libro cerrado y lo guardó. Ve la muestra y compra su copia.
