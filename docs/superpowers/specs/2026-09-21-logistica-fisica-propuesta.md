# Logística de lo físico (3t.26) — propuesta para decidir entre los dos (21/09, Joaquín)

**Estado: propuesta.** Nada construido. Se decide entre Joaquín y Naza; después va a plan.

## El problema

Hoy un pedido con **libro impreso** o **marcos NFC** se cobra y la fábrica produce el PDF, pero
**nadie sabe adónde mandar lo físico**: no se pide dirección en ningún lado, no hay estado de
producción/envío que el comprador pueda mirar, y la imprenta no tiene de dónde leer. Con la
moneda por IP (2.12) además cada comprador —la dueña en Barcelona, el primo en Rosario— tiene
**su propio pedido y su propia dirección**.

## Qué ve el comprador

En **Encargar libro**, cuando el pedido (o uno de sus pedidos) lleva impreso o marcos, aparece
una sección **"Envío"** debajo del encargo:

1. **Adónde lo mandamos** — quién recibe, teléfono, dirección (calle y número, piso/depto,
   ciudad, provincia/comunidad, código postal, país), una nota opcional ("timbre roto, llamar").
   Se puede cargar y corregir **hasta que entre en producción**; después queda en gris.
2. **Cómo va** — una línea de estado, con fecha: *esperando la dirección → en producción →
   impreso → enviado (transportista + nº de seguimiento, link si hay) → entregado*. Si hay un
   problema (dirección que no existe, devuelto), *con un problema* + nota y un "escribinos".
3. Solo aparece para pedidos con algo físico. Un pedido de solo PDF no la ve.

Un pedido = un envío = una dirección. Copias para dos casas distintas = dos pedidos (el
carrito ya lo permite: cada comprador el suyo).

## Modelo de datos (a decidir)

**Opción A — tabla `entregas` (recomendada).** Una fila por pedido físico. Es lo que la
fábrica/imprenta va a leer y actualizar; merece columnas propias, índices y su `check` de
estados como `pedidos`.

```
entregas
  id uuid pk
  pedido_id uuid unique → pedidos      (1:1; solo pedidos con impreso o marcos)
  narrador_id, familia_id uuid          (desnormalizados para listar rápido)
  destinatario_nombre text, destinatario_telefono text
  direccion jsonb  {linea1, linea2?, ciudad, provincia?, cp, pais}   -- texto libre por país
  nota text?
  estado text check in (sin_direccion, lista, en_produccion, impreso, enviado, entregado, con_problema)
  transportista text?, seguimiento text?, seguimiento_url text?
  problema text?
  produccion_at, impreso_at, enviado_at, entregado_at timestamptz?
  created_at, updated_at
RLS prendido, sin políticas: solo service role (como consumo_ia, latidos).
```

**Opción B — `pedidos.envio` jsonb.** Menos migración, pero mezcla la dirección (dato personal,
cambia) con el pedido (cobro, no cambia), no se indexa por estado y la fábrica tendría que
parsear jsonb para saber qué imprimir. No la recomiendo.

**Qué NO se duplica:** el contenido del envío (cuántas copias, B/N o color, cuántos marcos) se
lee de `pedidos.extras`, como hoy.

## Quién escribe qué (CONTRATO)

| Paso | Quién | Qué |
|---|---|---|
| Al confirmar un pedido con impreso/marcos (webhook o `/api/pago/vuelta`) | **web** | crea `entregas` en `sin_direccion` |
| La familia carga/corrige la dirección (hasta `en_produccion`) | **web** | `direccion`, `destinatario_*`, `nota` → `lista` |
| El libro se cierra y el pedido tiene dirección | **fábrica** | `en_produccion` (con `produccion_at`) — **si no hay dirección, no produce lo físico** y avisa a los socios |
| Sale de imprenta | **fábrica / Naza** | `impreso` |
| Se despacha | **fábrica / Naza** | `enviado` + transportista + seguimiento → **mail de hito** al comprador |
| Llega | **fábrica / Naza** (o el comprador: botón "ya me llegó") | `entregado` → mail de hito |
| Algo falla | **fábrica / Naza** | `con_problema` + `problema` → aviso a los socios y mail al comprador |

**Cómo mueve estados Naza** (a decidir): (a) un comando `npm run entrega -- <pedido> enviado
--seguimiento X` en la fábrica; (b) una pantalla **Envíos** en `/admin` (panel de la empresa),
que ya es la herramienta de mirar. Recomiendo **(b)**: es de sólo mirar + una escritura, como
cargar un gasto, y queda a la vista de los dos.

## El portón de impresión (Su voz) — se resuelve acá

El spec de Su voz dejó abierto el "botón imprimir" que cierra la selección de frases y engancha
la sección impresa con QR. **Propuesta: el portón es el paso a `en_produccion`.** Cuando la
fábrica lo mueve (libro cerrado + dirección lista), congela la selección de frases y arma el PDF
de imprenta con la sección QR. La familia no aprieta "imprimir": encarga, pone la dirección, y
ya. El recordatorio de los 15 días (Task 6) sigue igual.

## Mails de hito

Dos nuevos en `fabrica/src/mail/hitos.ts`: **enviado** (con seguimiento) y **entregado**. Textos:
Naza. Un tercero opcional: **falta la dirección** (a los 3 días de cerrado el libro sin dirección).

## Legales y privacidad

La dirección es un dato personal nuevo: una línea en `/legal/privacidad` §7 ("guardamos la
dirección de envío solo para entregar lo físico; se borra al año de entregado"). Texto: Naza.

## Fases

1. **Base + web (J escribe la migración, N aplica; CONTRATO de acuerdo):** tabla `entregas`,
   creación al confirmar el pago, sección Envío en Encargar libro (dirección + estado), API
   `PATCH /api/entrega`. Sin fábrica todavía: la imprenta se hace a mano leyendo la tabla.
2. **Fábrica (N):** `en_produccion` con la selección de frases congelada y la sección QR;
   mails de hito enviado/entregado.
3. **Admin (N):** pantalla Envíos con los estados y el seguimiento.

## Decisiones para tomar ahora

1. ¿Tabla `entregas` (A) o jsonb en `pedidos` (B)?
2. ¿La dirección es **obligatoria para encargar** o se encarga y se completa después (con
   recordatorio)? Propuesta: después, con recordatorio; la fábrica no imprime sin ella.
3. ¿Los estados los mueve Naza desde `/admin` (b) o por comando (a)?
4. ¿El portón de impresión de Su voz = paso a `en_produccion`? (cierra lo abierto del spec)
5. Marcos sin libro impreso (solo PDF + marcos): mismo envío, misma tabla. ¿OK?
6. ¿"Ya me llegó" lo puede marcar el comprador desde el panel?
7. Nombres: `entregas` (para no chocar con `envios`, que son los mensajes de WhatsApp). ¿OK?
