insert into storage.buckets (id, name, public)
values ('audios', 'audios', false);
-- Sin políticas de acceso público: ambos servicios operan con service_role,
-- y el navegador solo recibe URLs firmadas generadas por la web.
