# Catálogo: base + upsells (decidido por Joaquín el 21/09 a la noche, sobre la propuesta de precios de Naza)

**Estado: diseño decidido. Falta el OK de Naza a los números y el código (rama `catalogo-base`).**
Reemplaza a "tres productos, al menos uno" (`docs/panel-usuario.md` §15.1) en la parte de estructura.

## La idea

El producto es **uno**: el libro en PDF con «Su voz». Es la **base**, siempre está en el carrito y no se
puede sacar. Ahí "ocurre la magia". Lo demás se **suma**: el libro impreso (con envío) y los marcos NFC.
Ya no se puede comprar el impreso sin la base; el PDF solo sí existe.

## Precios (envío incluido en todo lo físico; pesos = euros × 1750)

| Línea | España | Argentina | Regla |
|---|---|---|---|
| **Base**: PDF + Su voz | 49 € | ARS 85.750 | obligatoria, siempre tildada |
| **Libro impreso** (el primero) | +49 € | +85.750 | siempre a color (no hay B/N); trae el envío |
| **Copia extra** (cada impreso más) | +40 € | +70.000 | precio fijo; **se eliminan los descuentos por cantidad** (−10/−15/−20 %) |
| **Marco NFC** (el primero) | +20 € | +35.000 | solo si hay al menos un impreso en el carrito (viajan juntos) |
| **Marco adicional** (cada uno más) | +15 € | +26.250 | "el primero paga la caja; los demás viajan gratis" |
| Viaje: base | 45 € | 78.750 | mismos upsells y mismos adicionales |

Ejemplos: PDF solo 49 · PDF + impreso 98 · + 1 copia 138 · + 2 marcos (20 + 15) 173.

**Promo 8.7** (`PROMO_PORCENTAJE`): se activa después de cerrar estos precios y **solo sobre la base**
(no sobre impreso ni marcos).

## Qué ve el cliente (paso 4 del Familiar, paso 3 del viaje, y Encargar libro en el panel)

1. La **base**, tildada y sin botón de sacar: "El libro en PDF + Su voz · 49 €" con lo que incluye.
2. **"Sumá el libro impreso"** con un contador 0 / 1 / 2…: al lado, "el primero +49 €, los siguientes +40 €".
3. **"Sumá marcos"** con contador; en gris hasta que haya un impreso, con la frase "sumá el libro
   impreso para agregar marcos"; "el primero +20 €, los siguientes +15 €".
4. El **ticket** lateral lista cada línea y el **total**.
5. Sin selector B/N · color (siempre color). Sin selector de país (la moneda es por IP, 2.12).
6. **Panel post-venta (Encargar libro)**: las mismas reglas y la misma función. Quien compró solo el PDF
   ve "sumá el impreso +49"; los marcos, en gris hasta ese momento. Quien ya tiene impreso ve copias a
   +40 y marcos a 20 / 15. Muere `calcularExtras` con sus tiers y el "pasar a color".
7. **Landing**: "Desde 49 €" (la base) y una línea "+ libro impreso 49 € · + marcos".

## Variables (las carga Naza DESPUÉS del código; hasta entonces el checkout sigue como hoy)

`PRECIO_EUR/ARS` (base, sin cambios) · `PRECIO_IMPRESO_EUR/ARS` = **el adicional** (49 / 85750; hoy es el
precio suelto) · `PRECIO_COPIA_EUR/ARS` (40 / 70000, nueva) · `PRECIO_MARCO_EUR/ARS` (20 / 35000, sin
cambios) · `PRECIO_MARCO_ADICIONAL_EUR/ARS` (15 / 26250, nueva) · `PRECIO_VIAJE_*` (sin cambios).
Desaparecen `PRECIO_IMPRESO_BN_*` y `PRECIO_IMPRESO_COLOR_*`. Regla de siempre: sin precio cargado, la
línea no se vende. Orden: **código → variables → deploy**.

## El pedido (CONTRATO, sin migración)

`pedidos.extras = { pdf: true, impreso: "color" | null, copias: N, marcos: M, tipo?: "viaje", piloto?: true }`.
`pdf` siempre `true`; `impreso` ya no admite `"bn"`. Los pedidos viejos se leen igual (`productosDelPedido`).
Una línea en el CONTRATO.

## Cómo se implementa (rama `catalogo-base`, desde `origin/main`; se mergea con el OK de Naza)

- `web/src/lib/productos.ts`: una sola función de precios para checkout y panel: `calcularCompra`
  (base obligatoria + impresos con primero/siguientes + marcos con primero/siguientes, marcos solo con
  impreso); `validarProductos` deja de pedir "al menos uno"; `calcularExtras` y sus tiers se van;
  `extrasDisponibles` con las variables nuevas. Tests: `test/productos.test.ts`.
- `web/src/lib/precios.ts`: precio de la casa del impreso = el adicional.
- `web/src/app/comprar/productos-ui.tsx` + los dos checkouts: base fija, dos contadores, marcos en
  gris sin impreso, ticket.
- `web/src/app/tablero/[narradorId]/libro/extras.tsx` + `web/src/app/api/extras/route.ts`: mismas reglas.
- `web/src/app/page.tsx`: "Desde" = la base.
- `supabase/CONTRATO.md`: la línea de `extras`.
- ⚠️ Textos → Naza.

## Después

La fase 1 de logística (dirección obligatoria para encargar, sección Envío) va **arriba de esto**, en
otra rama, cuando Naza aplique la migración `entregas`.
