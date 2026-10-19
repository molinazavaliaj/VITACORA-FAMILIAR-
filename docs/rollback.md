# Volver atrás: plan de rollback

Escrito el 18/10/2026 para Naza. Si una actualización sale mal, esto es lo que
hay que hacer, en orden, pieza por pieza. No hace falta saber programar: son
botones de panel. Lo que sí hace falta es **no entrar en pánico y no tocar dos
cosas a la vez**: se arregla una pieza, se mira que esté bien, y recién después
la siguiente.

## La tabla de una hojeada

| Pieza | Dónde vive | Cómo se vuelve | Cuánto tarda |
|---|---|---|---|
| Web (vitacorafamiliar.com) | Vercel, proyecto de Naza | «Instant Rollback» a un deploy viejo, y después `git revert` para que no vuelva | 1–2 min el rollback; 5–10 min el revert con su deploy |
| Fábrica (la central) | Railway, proyecto `fearless-kindness`, servicio `dazzling-friendship` | «Redeploy» de un deploy viejo | 3–6 min |
| Entrevistador (el bot) | Railway, mismo proyecto, servicio `VITACORA-FAMILIAR-` | «Redeploy» de un deploy viejo | 3–6 min |
| Base de datos | Supabase (organización Vitácora, proyecto VITACORA FAMILIAR) | «Restore» de la copia del día anterior, o «Restore to new project» | ~15 min (medido el 19/10 con «Restore to new project») |
| Archivos (audios, fotos, PDF) | Supabase Storage + copia en Cloudflare R2 | copiar el archivo desde R2 | minutos, uno por uno |
| Migraciones | `supabase/migrations/*.sql`, las aplica Naza a mano | una migración NUEVA que deshaga | minutos de escribirla, segundos de aplicarla |

Antes de todo: **mirar qué se rompió y desde cuándo**. Si el problema empezó
hoy, el rollback es a lo de ayer. Si hace tres días que anda mal, volver un
deploy no alcanza: hay que mirar la base también.

---

## 1. Web (Vercel)

### Qué pasó cuando se rompió

La web se publica sola: cada push a `main` que toca `web/` corre el workflow
`.github/workflows/deploy-web.yml` (tests, después compila y sube a Vercel). Si
ese workflow queda en rojo, **no se publicó nada**: la web sigue con la versión
anterior y el problema es solo del repo. Se arregla el código y listo.

Si el workflow salió en verde pero la web está mal, ahí sí hay que volver atrás.

### Volver a un deploy viejo (el atajo, 1–2 minutos)

1. Entrar a [vercel.com](https://vercel.com) con la cuenta de Naza.
2. Abrir el proyecto de la web (el que tiene el dominio `vitacorafamiliar.com`).
3. Pestaña **Deployments**. Arriba de la lista está el deploy que está en
   producción, marcado **Production** / **Current**.
4. Buscar el deploy anterior bueno (por fecha y por el mensaje del commit) y
   abrir el menú **⋯** de esa fila.
5. Elegir **Instant Rollback** (en algunas pantallas aparece como **Promote to
   Production**). Confirmar.

En un minuto el dominio vuelve a servir esa versión. **No toca el código del
repo.**

> Si no aparece ninguno de esos dos botones: es un cambio de la interfaz de
> Vercel. La alternativa es por consola, desde la carpeta `web/` en la
> computadora: `vercel rollback` (lista los deploys y pregunta a cuál volver).
> Si tampoco está, escribirle a Joaquín.

### Y después: el revert, para que el próximo deploy no lo vuelva a subir (5–10 min)

El rollback de Vercel no cambia el repo: el próximo push a `main` vuelve a
publicar el código roto. Para que no pase:

1. En GitHub, abrir el Pull Request que trajo el cambio malo (o el commit).
2. Botón **Revert** (GitHub arma solo un PR que deshace el cambio). Si no está,
   se lo pide a Joaquín o a Claude Code: `git revert <commit>` en una rama y PR.
3. Aprobar y mergear ese revert. El workflow de deploy corre de nuevo y publica
   el código sin el cambio malo.
4. Cuando termine, mirar el deploy nuevo en Vercel: tiene que decir Production.

**Cuidado con el rollback sin revert:** mientras el código roto siga en `main`,
cualquier otro push lo republica. Si en esos días hay que mergear otra cosa, se
mergea el revert primero.

---

## 2. Fábrica y entrevistador (Railway)

Los dos viven en el mismo proyecto de Railway (`fearless-kindness`, cuenta de
Joaquín) y se deployan solos desde GitHub.

- **`dazzling-friendship`** = la fábrica (armar el libro, el PDF, el paquete).
- **`VITACORA-FAMILIAR-`** = el entrevistador (el bot que le habla a la familia).

(Los nombres están en `fabrica/scripts/railway-logs.py`, que es la lista que usa
el repo. No inventar otros: si en el panel aparece otro servicio con otro nombre,
avisar antes de tocarlo.)

### Volver a un deploy viejo (3–6 minutos)

1. Entrar a [railway.com](https://railway.com). Entran Naza y Joaquín.
2. Abrir el proyecto `fearless-kindness` y elegir el servicio.
3. Pestaña **Deployments** (la lista de deploys, del más nuevo al más viejo).
4. Abrir el deploy anterior bueno, menú **⋯** → **Redeploy**.

Railway vuelve a levantar esa versión. Tarda unos minutos; se sabe que terminó
cuando el deploy queda en **Active** y la salud del servicio en verde (el
entrevistador tiene `/salud` como chequeo).

### Si un libro quedó a medio hacer

Volver el deploy **no** deshace lo que ya se escribió en la base. Un libro a
medias se retoma con la central (`fabrica/`), no con un rollback. Si el pedido
quedó trabado, se lo marca a mano (ver `docs/piloto-bitacora-errores.md`).

---

## 3. Base de datos (Supabase)

### Qué hay y cuándo

- Copia automática de Supabase **todos los días**, alrededor de las 07:05 UTC,
  guarda 7 días. La hace Supabase, no nosotros.
- La copia **no incluye los archivos** (audios, fotos, PDF). Esos están en
  Cloudflare R2 (ver más abajo).
- Probar que la copia sirve: se hace una vez por mes con «Restore to new
  project» (así lo cuenta `copias/README.md`).

### Restore que pisa todo (10–40 min, y se pierde lo del día)

**Solo si se rompió la base entera.** Lo que entró después de la copia **se
pierde**: los pedidos, las entrevistas y los pagos de esas horas.

1. Supabase → proyecto de Vitácora → **Database** → **Backups**.
2. Elegir la copia del día anterior (o la última buena) → **Restore**.
3. Confirmar. Supabase avisa que se pisa todo.
4. Cuando termina, entrar a la web y a la fábrica y ver que las pantallas cargan.

### Restore a un proyecto aparte (lo recomendado si es una sola cosa)

**Si se borró o cambió una fila, un pedido o una familia**, no se pisa todo: se
restaura la copia en un proyecto nuevo, se copia a mano lo que falta y se borra
el proyecto de prueba.

1. **Backups** → **Restore to new project**. Pide un nombre (por ejemplo,
   `vitacora-prueba-18oct`) y una contraseña de base cualquiera.
2. Esperar a que termine (el 19/10 tardó unos 15 minutos).
3. Buscar ahí la fila que falta, copiarla y pegarla en el proyecto de verdad
   (Table Editor, o pedírselo a la central).
4. Borrar el proyecto de prueba: **Settings** → **General** → **Delete project**.

> Ojo: el proyecto de prueba gasta cupo del plan. No dejarlo prendido.

### Archivos borrados (audios, fotos, PDF)

Están en la copia de Cloudflare R2 con la misma ruta (`audios/<narrador>/…`)
**durante 30 días**. Pasados los 30 días ya no están: la copia borra lo que se
borró en Supabase (es lo que prometen los términos). `copias/README.md` tiene el
detalle y los nombres de los baldes.

---

## 4. Migraciones (las aplica Naza a mano)

Las migraciones viven en `supabase/migrations/*.sql` y **las aplica Naza en el
SQL Editor de Supabase**. No hay herramienta que las corra sola.

### La regla que no se rompe

**Nunca se edita una migración ya aplicada.** Si una salió mal, se escribe una
**nueva** que deshaga (o corrija) lo que hizo la anterior. Editar la vieja deja
la base y el repo contando cosas distintas, y nadie sabe después qué se aplicó.

### Si una migración salió mal

1. **No cerrar el SQL Editor.** Copiar el error completo a un archivo
   (`docs/piloto-bitacora-errores.md` o donde esté la bitácora del día).
2. Mirar si la migración alcanzó a cambiar algo. Casi todas están escritas para
   poder correrse dos veces (idempotentes), pero eso no significa que se hayan
   aplicado enteras: si el error fue en la mitad, la primera mitad sí entró.
3. Escribir una migración nueva, con fecha de hoy y un nombre que diga qué
   arregla (por ejemplo `20261019000000_deshacer_kids_v2.sql`), que deje todo
   como estaba.
4. Aplicarla. Si la migración mala dejó una columna con datos que ya no van, se
   copian antes a otro lado.

Si no hay forma de deshacerlo sin perder datos: **Restore to new project** (ver
arriba) y comparar fila por fila. Es el último recurso, no el primero.

---

## 5. Antes de publicar algo grande

Cinco chequeos, en este orden. Si alguno falla, no se publica.

1. **Los tests en verde en el PR.** En GitHub, el PR tiene que tener los checks
   de «Tests» en verde (web, fábrica, entrevistador, voz). Si la rama base es
   `rediseno-web`, ojo: esa rama **todavía no tiene** el workflow de tests, así
   que hay que pedir el resultado a mano.
2. **Un deploy de prueba a la vista.** Para la web, mergear primero a
   `rediseno-web` y mirar el preview (el alias de prueba) antes de `main`. Para
   la fábrica, correr un libro de prueba con datos inventados, nunca de una
   familia real.
3. **La copia del día está hecha.** Supabase → Backups: tiene que estar la de
   hoy (o la de ayer si es temprano). Sin copia no se toca la base.
4. **Una persona mirando.** Que haya alguien despierto y con la computadora a
   mano durante la primera hora después de publicar. No se publica a las 3 de
   la mañana ni un viernes a la tarde.
5. **Saber cómo se vuelve.** Antes de apretar el botón, tener leída esta hoja y
   saber cuál es el deploy anterior bueno (anotar la fecha y el commit).

---

## Lo que no sabemos todavía

Para no inventar botones ni tiempos:

- **El restore que pisa todo** nunca se probó (por suerte). El «Restore to new
  project» sí: el 19/10 tardó unos 15 minutos y la copia salió exacta.
- **La ruta exacta de los botones de Vercel y Railway** puede cambiar cuando
  cambian la interfaz (ya pasó con Vercel). Si un botón de esta hoja no está
  donde dice, no buscarlo a ciegas: avisar y lo corregimos acá.
- **Railway es de la cuenta de Joaquín, pero Naza también entra** (el 18/10 cargó
  variables). Cualquiera de los dos puede hacer el «Redeploy».
