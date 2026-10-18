# Copias de seguridad

Dos copias, en dos empresas distintas:

| Qué | Dónde | Cada cuánto | Quién la hace |
|---|---|---|---|
| La base (fichas, transcripciones, pedidos) | Supabase Pro, organización Vitácora | Todos los días, ~07:05 UTC, guarda 7 días | Supabase solo |
| Los archivos (audios, fotos, PDF) | Cloudflare R2, balde `vitacora-copia-audios` (cuenta del negocio) | Todos los días, 08:30 UTC | `copiar.py` en GitHub Actions |

La copia de Supabase **no incluye los archivos**. Por eso existe la segunda.

## La copia de los archivos
- Copia cada archivo de cada bucket a R2 con la misma ruta: `<bucket>/<ruta>`.
- **Nunca borra nada en R2.** Un audio borrado en Supabase sigue en la copia.
- Si un archivo cambió, la versión nueva queda al lado: `<ruta>@<fecha>`.
- Si falla, manda mail a MAIL_SOCIOS y el workflow queda en rojo.
- Correrla a mano: GitHub → Actions → «Copia diaria de archivos» → Run workflow.

Secretos en GitHub (Settings → Secrets and variables → Actions): `SUPABASE_URL`,
`SUPABASE_SERVICE_ROLE_KEY`, `R2_ENDPOINT`, `R2_ACCESS_KEY_ID`,
`R2_SECRET_ACCESS_KEY`, `RESEND_API_KEY`, `MAIL_SOCIOS`.

## Volver atrás
- **Se borró o rompió algo de la base:** Supabase → Database → Backups → Restore
  en el día anterior. Pisa la base entera: lo que entró después se pierde. Si es
  una sola fila, mejor «Restore to new project» y copiar a mano lo que falta.
- **Se borró un audio o foto:** está en R2 con la misma ruta (`audios/<narrador>/…`).
