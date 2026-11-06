# Publicar la web con la conexión directa de Vercel y GitHub

**Estado: plan, sin ejecutar. Se hace antes de los anuncios del 9/11, después de los merges pendientes (decisión de Joaquín, 06/11).** Revisado contra la
documentación de Vercel y el estado real del proyecto el 06/11/2026.

## Qué cambia y por qué

Hoy GitHub hace de mensajero: corre los tests y, si pasan, le lleva el código a Vercel con una llave
(`VERCEL_TOKEN`). Existe porque el proyecto estaba en el plan gratuito de Naza. Desde el 06/11 está en el
equipo Pro de Joaquín, así que Vercel puede mirar el repo directamente.

| | Hoy | Después |
|---|---|---|
| Quién publica | GitHub Actions, con una llave | Vercel, solo |
| Freno de tests | Tests primero, después se arma | Se arma y se corren los tests a la vez; sale solo con tests en verde |
| Versiones de prueba | A mano, una dirección fija compartida | Una por rama, con enlace en el PR |
| Llaves que cuidar | Tres secretos en GitHub | Ninguna |

## Cómo está hoy (verificado el 06/11)

- Equipo Vercel en plan Pro. Dueño: Joaquín. Miembros: TrickyNoise (Naza) y `theomiguel`.
- **Root Directory vacío** (no `web`), porque hoy la CLI sube desde adentro de `web/`.
- Sin conexión con Git, con los dominios `www.vitacorafamiliar.com`, `vitacorafamiliar.com` y
  `vitacora-familiar.vercel.app`, y asignación automática a producción prendida.
- **Sin protección en las versiones de prueba: cualquiera con el enlace entra.** En Preview están
  `SUPABASE_SERVICE_ROLE_KEY` y `RESEND_API_KEY`, y `PASO-DE-MANOS.md` dice que la base es la misma que producción.
- `main` sin reglas de protección en GitHub. Los últimos 40 cambios entraron por PR.
- El repo es **público**. Por eso no aplica la regla de Vercel que exige que cada autor de un commit sea
  miembro del equipo, que vale para repos privados. Si algún día pasa a privado, hay que revisarlo.
- Los secretos `VERCEL_*` solo los usan los dos workflows que se borran.

## Las cinco preguntas

### 1. Que nada salga a producción si fallan los tests

**Deployment Checks de Vercel, con el check `web` de GitHub.** Es el equivalente a un control de calidad
antes de abrir las puertas: Vercel arma la versión, pero no le da el dominio hasta que `web` esté en verde.
Si queda en rojo, la web sigue como estaba.

- `tests.yml` ya corre en cada push a `main`, sin filtro de carpetas, y su job ya se llama `web`.
- **Plan:** Vercel dice que está disponible para todo proyecto conectado a GitHub y no nombra planes.
  Se confirma viendo la opción en pantalla (paso A1).
- Los chequeos nativos de Vercel no sirven: solo corren lint y typecheck, no los tests.
- Queda una salida de emergencia, **Force Promote**, que publica salteando el freno. Solo para un incendio.

Una regla en GitHub que exija tests en el PR es una segunda capa y no alcanza sola: prueba la rama, no el
resultado de juntarla con `main`. Decisión pendiente, ver paso 11.

### 2. No publicar dos veces

El orden lo resuelve: primero se apagan los workflows y recién después se conecta Vercel, con los merges
frenados en esa ventana. Durante esos minutos no publica nadie, que es el error seguro. El PR después borra
los archivos.

### 3. Reemplazar `vitacora-rediseno.vercel.app`

**Se elimina, sin reemplazo fijo.** Cada rama tiene su dirección permanente y Vercel la deja en el PR. Hoy esa
dirección fija la pisa la última rama que se probó. Desde el 06/11, `vercel alias set` falla con el token nuevo; el PR #217 lo
resuelve mientras tanto asignando el alias por la API de Vercel.

Había una dependencia escondida: en Preview, `URL_BASE` arma las vueltas del pago y los enlaces de los mails.
Si siguiera apuntando al alias, una prueba de compra en una rama volvería a otra. Por eso `next.config.ts`
ahora usa la dirección de la rama en Preview. En producción no cambia nada.

Con esto suben dos riesgos, y hay que cubrirlos el mismo día:

- **Más versiones de prueba sobre la base real.** Se prende Standard Protection (gratis): solo entra quien
  tiene acceso al equipo de Vercel. La web pública no se toca. Para mostrarle una prueba a otra persona se
  saca un enlace para compartir. Los webhooks de pago no entran a las versiones de prueba, pero la compra se
  confirma igual con la vuelta del navegador.
- **Ramas automáticas.** `web/vercel.json` apaga las ramas de `dependabot`, que hoy son la mayoría de los PR
  abiertos.

### 4. Borrar los secretos

Al final, y recién después de un período de prueba, porque son la marcha atrás. Hay que **revocar el token en
Vercel**, además de borrarlo de GitHub: si no, la llave sigue sirviendo.

### 5. Volver atrás

Ver la sección «Cómo volver atrás».

## Paso a paso

**Objetivo: domingo 8/11**, unos 45 minutos con Naza disponible. Antes tienen que estar:

- Portada y privacidad fusionadas y publicadas con el sistema de hoy.
- La compra de prueba real hecha.

**Si el domingo a la noche falta algo, no se hace con apuro:** pasa a después de la primera semana de anuncios. Lo
mismo si el cambio no quedó bien cerrado antes del lunes: se vuelve atrás y se reintenta después.

### Antes (cualquier día, sin riesgo)

- **A1. Joaquín:** confirmar que Vercel → Settings → Build and Deployment muestra **Deployment Checks**.
- **A2. Joaquín:** confirmar que `MP_ACCESS_TOKEN` de Preview es de prueba. Claude no ve ese valor.
- **A3. Claude:** confirmar que `vercel deploy --prod` ya anduvo con el token nuevo, en el primer merge a `main` que
  toque `web/`. Todavía no se probó, y es lo que sostiene la marcha atrás. Si falla, se arregla antes de seguir.
- **A4. Claude:** poner esta rama al día con `main`. Si el PR #217 ya se fusionó, va a chocar en `preview-web.yml`, y la
  resolución es dejarlo borrado.
- **A5. Joaquín:** avisar a Naza de la ventana: nadie fusiona nada a `main` hasta el final del paso 8.

### El día

1. **Claude:** confirmar que no hay publicaciones en curso y anotar la versión actual de producción. Es el
   punto de regreso.
2. **Claude:** apagar los dos workflows. Desde acá, nada publica.
   ```bash
   gh workflow disable deploy-web.yml -R molinazavaliaj/VITACORA-FAMILIAR-
   ```
   ```bash
   gh workflow disable preview-web.yml -R molinazavaliaj/VITACORA-FAMILIAR-
   ```
3. **Joaquín, en Vercel → Settings:**
   - Root Directory: `web`. Apagar **Include files outside the root directory**, para que el armado vea lo mismo
     que hoy.
   - Ignored Build Step → Custom: `git diff --quiet HEAD^ HEAD -- .` Es lo que hace hoy el filtro de carpetas: si
     el cambio no toca `web/`, no publica. La opción automática de Vercel pide workspaces, que el repo no usa.
   - Prender **Prioritize production builds**, para que las pruebas no le hagan cola a producción.
   - Deployment Protection: **Standard Protection** con Vercel Authentication.
4. **Joaquín:** Settings → Git → conectar `molinazavaliaj/VITACORA-FAMILIAR-`. Dar acceso solo a ese repo.
   Confirmar en Settings → Environments → Production que la rama es `main` y la asignación automática sigue prendida.
5. **Joaquín:** Deployment Checks → Add Checks → GitHub → elegir `web`.
6. **Claude:** subir un commit a esta rama y revisar su versión de prueba: arma bien, muestra precios en
   `/comprar`, entra al panel, y sin sesión de Vercel pide acceso.
7. **Joaquín:** dar el OK. **Claude:** fusiona el PR. Es la primera publicación real. Se comprueba que quedó
   retenida hasta el verde, que en `www` está el commit nuevo, que `/comprar` tiene precios, que Cron Jobs sigue
   con 2 tareas y que en Actions no corrió «Deploy web».
8. **Claude:** probar el freno con un PR que agrega solo un test que falla. La versión queda retenida y `www`
   no cambia. Después se revierte y se comprueba que el revert sí publica. Es seguro: si el freno no anduviera, lo
   publicado sería la web igual, porque el cambio es solo un archivo de test.
9. **Claude:** al fusionar el primer PR que no toque `web/`, comprobar que Vercel lo cancela.
10. **Claude:** borrar el alias viejo.
    ```bash
    vercel alias rm vitacora-rediseno.vercel.app --scope molinazavaliaj-2041s-projects
    ```
11. **Joaquín decide:** regla en `main` que exija `web` en verde para fusionar. Recomendación: sí, solo `web` para
    no frenar a Naza por otro servicio.

### Cierre (a las dos semanas y con al menos 5 publicaciones bien)

12. **Joaquín:** revocar el token en Vercel → Account Settings → Tokens.
13. **Claude:** borrar los secretos.
    ```bash
    gh secret delete VERCEL_TOKEN -R molinazavaliaj/VITACORA-FAMILIAR-
    ```
    ```bash
    gh secret delete VERCEL_ORG_ID -R molinazavaliaj/VITACORA-FAMILIAR-
    ```
    ```bash
    gh secret delete VERCEL_PROJECT_ID -R molinazavaliaj/VITACORA-FAMILIAR-
    ```
14. **Joaquín:** mirar en Vercel → Usage el consumo de armados de esa primera semana. Si las pruebas consumen de
    más, se limitan a menos ramas.

## Cómo volver atrás

**La web salió mal, pero el sistema anda (1-2 minutos):** Instant Rollback, como en `docs/rollback.md`. Las versiones
de antes del cambio siguen disponibles. **Trampa:** después de un rollback, Vercel deja de publicar solo hasta tocar
Undo Rollback.

**Falla el paso 3 o 4, antes de fusionar:** deshacer los ajustes del paso 3, desconectar Git y volver a prender los
workflows con `gh workflow enable`. No hay nada más que deshacer.

**El sistema nuevo no sirve, con el PR ya fusionado (unos 10 minutos, en este orden):**

1. Frenar los merges.
2. Vercel → Settings → Git → **Disconnect**.
3. Quitar el Deployment Check y el Ignored Build Step.
4. Root Directory de vuelta a **vacío**, y prender de nuevo «Include files outside the root directory». **No saltear
   esto:** con `web` puesto, la CLI que corre desde `web/` buscaría `web/web` y fallaría.
5. Revertir el PR en GitHub, lo que devuelve los workflows.
6. Prenderlos y publicar a mano:
   ```bash
   gh workflow enable deploy-web.yml -R molinazavaliaj/VITACORA-FAMILIAR-
   ```
   ```bash
   gh workflow enable preview-web.yml -R molinazavaliaj/VITACORA-FAMILIAR-
   ```
   ```bash
   gh workflow run deploy-web.yml -R molinazavaliaj/VITACORA-FAMILIAR-
   ```

Standard Protection puede quedar prendida: no afecta a la web pública. Si los secretos ya se borraron, hace falta
primero un token nuevo: por eso se borran al final.

## Qué no está comprobado todavía

Se confirma en los pasos indicados, no se da por hecho:

| Duda | Dónde se ve |
|---|---|
| Que Deployment Checks aparezca en este equipo Pro | A1 |
| Que `git.deploymentEnabled` en `web/vercel.json` se respete con Root Directory `web` | Primer push de dependabot. Si no, solo gasta armados |
| Que volver a correr un test fallado libere la versión retenida | Primera vez que pase. La salida es otro commit |
| Que `web/web` sea el error exacto de la CLI: viene de reportes de usuarios, no de la documentación | Por eso el orden del paso 3 y de la marcha atrás |

## Fuera de este cambio

- Los tests corren con Node 22 y Vercel arma con Node 24. Ya es así hoy. Conviene igualarlos.
- `rediseno-web` lleva sin cambios desde el 26/10, con 10 commits fuera de `main`. Si se empuja ahí, su copia de
  `preview-web.yml` podría correr hasta que se borren los secretos. Solo armaría una versión de prueba.
- El repo es público, incluida la carpeta `docs/`. Conviene que los socios lo tengan presente.
- `theomiguel` figura como miembro del equipo de Vercel, y cada asiento de más se paga.

## Fuentes

- [Deployment Checks](https://vercel.com/docs/deployment-checks) y [anuncio](https://vercel.com/changelog/block-vercel-deployment-promotions-with-github-actions)
- [Vercel for GitHub](https://vercel.com/docs/git/vercel-for-github)
- [Project settings: Ignored Build Step](https://vercel.com/docs/project-configuration/project-settings) y [Monorepos](https://vercel.com/docs/monorepos)
- [Git configuration](https://vercel.com/docs/project-configuration/git-configuration)
- [Instant Rollback](https://vercel.com/docs/instant-rollback)
- [Deployment Protection](https://vercel.com/docs/deployment-protection)
- [System environment variables](https://vercel.com/docs/environment-variables/system-environment-variables)
- [Commits sin publicar: autores en repos privados](https://vercel.com/kb/guide/why-aren-t-commits-triggering-deployments-on-vercel)
