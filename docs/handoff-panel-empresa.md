# Mensaje para Joaquín — panel de la empresa, parte A (instrumentación)

> Listo para pegar. Está escrito para que lo lea él o su Claude Code.

---

Hola Joaquín. Antes que nada: **no tenés que escribir nada para esto**. La parte A del panel de la
empresa está hecha y commiteada en la rama **`panel-de-la-empresa`** (todavía sin pushear; el push y el
merge los decide Naza). Son tres tablas nuevas y el código que las llena. El panel en sí (`/admin`, en
`web/`) es la parte B y va después.

## Qué cambió, archivo por archivo

- **`supabase/migrations/20260921000100_panel_empresa.sql`** (nueva): `consumo_ia`, `latidos` y
  `gastos_manuales`. Las tres de **sólo agregar** (nadie hace update ni delete, salvo el upsert del
  latido, que pisa su propia fila). RLS prendido y **sin políticas**: sólo la service role las toca.
  **La aplica Naza en el SQL Editor** — vos no tenés que correr nada.
- **`supabase/CONTRATO.md`**: sección nueva con la propiedad de escritura de las tres.
- **`entrevistador/src/costos.ts`** (nuevo): el anotador de llamadas al modelo. Gemelo del de la fábrica,
  pero escribe en `consumo_ia` en vez de un JSON en Storage.
- **`entrevistador/src/ia/*.ts` y `entrevistador/src/flujo/*.ts`**: trece llamadas al modelo ahora anotan.
  **Las firmas sólo cambiaron sumando un parámetro OPCIONAL al final** (`narradorId?`) o un campo más en
  un objeto de opciones, así que cualquier llamada posicional tuya sigue compilando igual.
  `generarReconocimiento` no se tocó: no tiene llamadores desde que se sacó el saludo diario.
- **`entrevistador/src/latido.ts`** y **`fabrica/src/latido.ts`** (nuevos): `anotarLatido(...)`. El
  entrevistador late al final de `tick()` y la fábrica al final del try de su `tick()`.

## Lo único que te toca a vos (una variable)

En el servicio **entrevistador de Railway** y también en **la fábrica**, sumá:

```
CUENTA_IA=joaquin
```

Es para que la columna `cuenta` de `consumo_ia` diga con qué key se pagó esa llamada (hoy el
entrevistador usa la tuya y la fábrica la de Naza). Si no la ponés, la columna queda nula y el panel
muestra el gasto sin dueño: no rompe nada.

## Cómo se verifica que la migración quedó aplicada

Sin acceso a SQL, pidiendo las columnas por PostgREST (con la service key, **sin imprimir el valor**):

```bash
curl -s -o /dev/null -w "%{http_code}\n" "$SUPABASE_URL/rest/v1/consumo_ia?select=id,usd,cantidad,unidad&limit=1" \
  -H "apikey: $KEY" -H "Authorization: Bearer $KEY"
```

`404` con `"code":"PGRST205"` = todavía no está aplicada (no es un error de la consulta: es la
respuesta). `200` = aplicada. Lo mismo para `latidos` y `gastos_manuales`.

## Números de esta corrida (los míos, no los repitas de memoria)

- `entrevistador/`: `npx vitest run` → 283/283 y `npx tsc --noEmit -p tsconfig.json` limpio.
- `fabrica/`: `npx vitest run` → **359/359** y typecheck limpio.
- `voz/`: `./.venv/Scripts/python -m pytest -q` → **151/151** (tarda ~55 s: levanta modelos de audio).
- Los tests nuevos se vieron **fallar primero** (rojo → verde); el detalle está en
  `.superpowers/sdd/2026-09-21-panel-empresa-a-instrumentacion/progress.md` (git-ignored).

## Qué NO hace falta que toques

- `consumo_ia` / `latidos` / `gastos_manuales`: son de sólo agregar. La fábrica y el entrevistador son
  los únicos que insertan; `/admin` es el único que escribe `gastos_manuales`.
- El worker de la PC de música ya tiene su directiva en el buzón
  (`central/2026-09-21-07-panel-latido-voz.md`): lo lleva Naza.
- Nada de esto cambia lo que ve el cliente: su panel (`/tablero`) queda igual.

## Sin commitear a propósito

`.agents/` y `skills-lock.json` (config local de herramientas, no van al repo).

## Lo que sigue

La **parte B**: el panel `/admin` en la web, con las cinco pantallas del mockup
(`docs/panel-interno.html`) y el spec en `docs/superpowers/specs/2026-09-21-panel-de-la-empresa-design.md`.
Cuando esté, se te pasa igual que esto: la rama y lo que tengas que adaptar, que en principio es sólo
subirla.

---

## La parte B: el panel de la empresa en la web (21/09)

**Qué es.** Las cinco pantallas de `/admin` (Estado, Familias, Plata, Gastos, Cerebros), hechas.
No hay un link a `/admin` en ningún lado del sitio: se entra escribiendo la dirección.

**Para que funcione en producción hacen falta cuatro variables nuevas en Vercel** (todas de tiempo de
ejecución, ninguna secreta):

- `ADMIN_EMAILS` — los dos mails separados por coma (Naza y Joaquín). **Sin esto no entra nadie.**
- `CAMBIO_EUR_ARS` — cuántos pesos vale 1 euro (ej. `1250`).
- `CAMBIO_USD_EUR` — cuántos dólares vale 1 euro (ej. `1.08`).
- `CAMBIO_FECHA` — de cuándo es ese cambio (ej. `2026-09-21`).

El tipo de cambio se actualiza a mano (una vez por semana alcanza) y **queda a la vista en la pantalla de
Plata**: si se mueve, las cuentas se mueven con él. Si no está cargado, el panel muestra los números sin
convertir y lo avisa, en vez de convertir con un número inventado.

**Lo que NO hace, a propósito:** no manda mails ni avisos, no pausa ni reintenta nada, y la única cosa que
escribe en la base es cargar un gasto a mano (Railway, el dominio, la imprenta).

**Cómo se comprueba que está bien:** entrando con el mail de la lista deberían verse las cinco pantallas
con los datos reales. Si un mail que no está en la lista entra, tiene que ver una pantalla que dice que
no (y nunca el panel).

### El mensaje para pegarle a Joaquín

> Joaquín, ya está el panel de la empresa, en la parte B de la rama `panel-de-la-empresa`. Son cinco
> pantallas: **Estado** (qué se frenó y qué hay que hacer hoy), **Familias** (cómo va cada historia, con lo
> que el biógrafo le preguntó y lo que contestó), **Plata** (entró − se gastó = ganancia limpia, con las
> comisiones y el cambio a la vista), **Gastos** (día por día y paso por paso) y **Cerebros** (los 14
> robots en tres carriles, con el que se pasó de tiempo en rojo: ahí se ve dónde se cortó la cadena).
>
> Para que ande hay que cargar **cuatro variables** en Vercel, ninguna secreta: `ADMIN_EMAILS` (los dos
> mails separados por coma — sin esto no entra nadie), `CAMBIO_EUR_ARS` (cuántos pesos vale 1 euro),
> `CAMBIO_USD_EUR` (cuántos dólares vale 1 euro) y `CAMBIO_FECHA`. El cambio se actualiza a mano, una vez
> por semana: queda a la vista en la pantalla y si no está cargado el panel avisa en vez de convertir con
> un número inventado.
>
> El panel es **de sólo mirar**: lo único que escribe es cargar un gasto a mano (Railway, el dominio, la
> imprenta). No manda mails ni avisos, y no hay ningún link a `/admin` en el sitio: se entra escribiendo
> la dirección.
>
> Verificado: los **333** tests de la web en verde (incluye renderizar las cinco pantallas de verdad, con
> datos y sin datos), typecheck limpio y `npm run build` con las cinco rutas compiladas. Además lo corrí
> contra la base real: las diez consultas leen sin un error y ya apareció lo primero que hay que mirar
> —**hay 8 pagos pendientes de hasta 7 días, en pesos**—.
