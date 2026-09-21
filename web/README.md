# Vitácora Familiar — web

App Next.js del comprador: registro de la familia, tablero de seguimiento, revisión de
nombres, previsualización y compra del libro/audiolibro, y la descarga final.

- Desarrollo: `npm run dev` (abre http://localhost:3000)
- Tests: `npm test`
- Deploy: Vercel, con esta carpeta (`web/`) como raíz del proyecto. **Cómo se despliega de verdad** (verificado 21/09):

## Deploy (leer antes de tocar producción)

- **Automático, por GitHub Actions** (`.github/workflows/deploy-web.yml`): cada push a `main` que toque
  `web/` corre los tests y, si pasan, `vercel pull` (variables de producción) + `vercel build --prod` +
  `vercel deploy --prebuilt --prod`. Se mira en GitHub → Actions → "Deploy web" (o `gh run list --workflow deploy-web.yml`).
- Por eso en Vercel los deployments **no traen commit ni branch** y no hay previews: los sube el
  runner con la CLI, no la integración de git de Vercel (que no se puede usar: plan Hobby + repo ajeno, 2.8).
- **No reusa caché**: cada build es en un runner limpio. La trampa de `vercel --prod` que recicla el
  build es solo de los deploys a mano desde una máquina; si hay que deployar a mano, `vercel --prod --force`.
- **Cambiar una variable en Vercel no basta**: el build la lee al construir. Después de cambiarla,
  volver a correr el último workflow (GitHub → Actions → Deploy web → "Re-run all jobs") o pushear.
- Desde el 21/09 (2.12) la home y los checkouts se renderizan **por request** (leen el país del
  visitante), así que los precios ya no quedan horneados en el HTML: con el re-run alcanza, no hace
  falta forzar nada.
