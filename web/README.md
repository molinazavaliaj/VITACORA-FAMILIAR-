# Vitácora Familiar — web

App Next.js del comprador: registro de la familia, tablero de seguimiento, revisión de
nombres, previsualización y compra del libro/audiolibro, y la descarga final.

- Desarrollo: `npm run dev` (abre http://localhost:3000)
- Tests: `npm test`
- Deploy: Vercel, con esta carpeta (`web/`) como raíz del proyecto. **Cómo se despliega de verdad** (verificado 21/09):

## Deploy (leer antes de tocar producción)

Paso a paso del cambio y la marcha atrás: `docs/publicar-con-vercel.md`.

- **Automático, con la conexión directa de Vercel y GitHub.** Cada push a `main` que toque `web/` arma una
  versión en Vercel, que queda **retenida** hasta que el check `web` de GitHub (`tests.yml`) da verde. Recién
  ahí pasa al dominio. Si los tests fallan, la web sigue como estaba.
- **Cada rama tiene su versión de prueba**, con enlace en el PR. Usa la misma base de Supabase que
  producción: solo la ven quienes tienen acceso al equipo de Vercel. Las ramas de dependabot no publican.
- **Cambiar una variable en Vercel no basta**: hay que volver a publicar. En Vercel → Deployments → la última
  → **Redeploy**, destildando **Use existing Build Cache** y **Use project's Ignore Build Step**. Si no se
  destilda el segundo, y el último merge no tocó `web/`, Vercel cancela la publicación.
- La home y los checkouts se renderizan **por request** (leen el país del visitante), así que los precios no
  quedan horneados en el HTML.

## Precios (variables en Vercel)

Una línea sin precio no existe para el cliente: no se muestra ni se cobra (`src/lib/productos.ts`).
Cada una va en euros (`_EUR`, España) y en pesos (`_ARS`, Argentina). Después de cargarla, re-correr el deploy.

- `PRECIO_EUR` / `PRECIO_ARS`: la base (el libro en PDF + Su voz).
- `PRECIO_IMPRESO_*`, `PRECIO_COPIA_*`, `PRECIO_MARCO_*`, `PRECIO_MARCO_ADICIONAL_*`, `PRECIO_PACK_*`: los extras del libro.
- `PRECIO_TARJETA_EUR` (30/10): la tarjeta del regalo impresa, en un sobre por correo (en `/regalar`).
  Sin la variable, la casilla no aparece. Solo se manda dentro de España, así que `PRECIO_TARJETA_ARS`
  no se carga. Para prenderla: `PRECIO_TARJETA_EUR=4` y re-correr el deploy
  (`docs/regalo/tarjeta-impresa-2026-10-30.md`).
