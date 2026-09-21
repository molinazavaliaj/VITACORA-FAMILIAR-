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

En el servicio **entrevistador de Railway**, sumá:

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

- `entrevistador/`: `npx vitest run` → **279/279** y `npx tsc --noEmit -p tsconfig.json` limpio.
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
