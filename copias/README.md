# Copias de seguridad

Dos copias, en dos empresas distintas:

| Qué | Dónde | Cada cuánto | Quién la hace |
|---|---|---|---|
| La base (fichas, transcripciones, pedidos) | Supabase Pro, organización Vitácora | Todos los días, ~07:05 UTC, guarda 7 días | Supabase solo |
| Los archivos (audios, fotos, PDF) | Cloudflare R2, balde `vitacora-copia-audios` (cuenta del negocio) | Todos los días, 08:30 UTC | `copiar.py` en GitHub Actions |

La copia de Supabase **no incluye los archivos**. Por eso existe la segunda.

## La copia de los archivos
- Copia cada archivo de cada bucket a R2 con la misma ruta: `<bucket>/<ruta>`.
- **Lo que se borra en Supabase, se borra de la copia 30 días después.** Esos 30 días
  sirven para recuperar un borrado por error; después la copia no guarda lo que los
  términos prometen borrar (los audios a los 3 meses, todo si la familia lo pide).
  Lo pendiente está en `_control/borrados.json` dentro de R2. Si un día faltan 20
  archivos o más, mail a los socios.
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
- **Se borró un audio o foto:** está en R2 con la misma ruta (`audios/<narrador>/…`)
  durante 30 días.
