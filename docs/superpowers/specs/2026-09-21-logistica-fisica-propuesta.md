# Logística de lo físico (3t.26) — propuesta para decidir entre los dos (21/09, Joaquín)

**Estado: decidido en lo básico (Joaquín, 21/09 noche) — falta la etiqueta.** Nada construido.
Decisiones tomadas: **(1)** tabla `entregas` · **(2) la dirección es obligatoria para encargar** ·
**(3)** Naza mueve los estados desde `/admin` (pantalla Envíos) · **(4)** el portón de impresión de
Su voz = paso a `en_produccion` · **(5)** marcos sin impreso, mismo circuito · **(6)** el comprador
marca "ya me llegó" y se lo lleva a dejar la reseña en **Trustpilot** · **(7)** se llama `entregas`.
Queda abierto **cómo se genera la etiqueta de envío** (sección nueva, abajo).

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

## La etiqueta: del sistema al centro de distribución de cada país

**Lo que pidió Joaquín (21/09):** que el sistema genere la etiqueta de envío para que el centro de
distribución de cada país (la imprenta) empaque el libro y lo despache listo, sin cargar nada a
mano. Pensó en **Mercado Envíos**.

**Lo verificado** (docs públicas de Mercado Libre/Mercado Pago, 21/09):
- Mercado Envíos 2 es logística de **Mercado Libre**; la etiqueta se imprime con
  `GET https://api.mercadolibre.com/shipment_labels?shipment_ids=…&response_type=pdf` con el token
  de la cuenta vendedora (misma cuenta que Mercado Pago, pero hay que crear una app en
  developers.mercadolibre y autorizarla por OAuth). Países: AR, BR, MX, CL, CO, UY, PE, EC — **no España**.
- En Checkout Pro la preferencia acepta `shipments: { mode: "me2", dimensions, … }`: el comprador
  **elige y paga el envío al pagar** y el envío nace atado a esa orden. **Choca con la decisión (2)**:
  nosotros pedimos la dirección al encargar, semanas después del pago.
- **No confirmado** (403 en las docs): si MP sigue habilitando `me2` para tiendas propias fuera del
  marketplace. Se sabe con una preferencia real de prueba.

**Dos caminos:**

| | A · Mercado Envíos en el checkout | B · Agregador de correos por API (recomendado) |
|---|---|---|
| Cuándo se pide la dirección | al **pagar** (MP la pide) | al **encargar** (decisión 2) |
| Quién paga el envío | el comprador, en el checkout de MP | va incluido en el precio (o se cotiza y se suma al encargar) |
| España | no existe | sí (Sendcloud / Packlink PRO: Correos, SEUR, GLS) |
| Argentina | Correo Argentino / Andreani vía ML | Enviopack / Zippin / Shipnow (Andreani, OCA, Correo) |
| Etiqueta | PDF desde ML, por orden | PDF desde el agregador, cuando pasa a `en_produccion` |
| Integración | app ML + OAuth + cambiar la preferencia + merchant_order | una API key por país, un `POST` por entrega |
| Riesgo | que MP ya no lo ofrezca a tiendas propias; España afuera | costo por etiqueta del agregador |

**Recomendación: B.** Un agregador por país con API (ES: **Sendcloud**; AR: **Enviopack** o
**Zippin** — elegir por precio y por si tienen retiro en la imprenta), y un solo flujo: al pasar a
`en_produccion`, el sistema crea el envío en el agregador con la dirección de `entregas` y el
origen del país (la imprenta), guarda `etiqueta_url` + `seguimiento`, y la imprenta imprime la
etiqueta junto con el libro. Si Mercado Envíos importa por costo en AR, se prueba como **spike**
(una preferencia con `me2`) sin comprometer el diseño: el agregador puede ser el respaldo.

**Lo que suma a `entregas`:** `origen` (AR|ES: el centro que despacha), `peso_g`, `dimensiones`
(por producto: libro, marco, caja), `etiqueta_proveedor` (sendcloud|enviopack|me2|manual),
`etiqueta_url`, `envio_externo_id`. **Datos del formulario de dirección** (los mismos que exige
cualquier agregador): nombre y apellido, teléfono, email, calle y número, piso/depto, ciudad,
provincia/comunidad, código postal, país. Se validan al encargar (obligatorios menos piso/depto).

**Datos fijos por país (config, no base):** dirección de origen de cada centro, peso y medidas
de libro/marco/caja, API key del agregador.

**"Ya me llegó" → reseña:** al marcar `entregado` desde el panel, mensaje de gracias y botón a
la página de Vitácora en Trustpilot (`TRUSTPILOT_URL` en Vercel). Solo la dueña o el comprador
de ese pedido.

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

## Decisiones tomadas (21/09) y lo que falta

1. ✅ Tabla `entregas`.
2. ✅ **Dirección obligatoria para encargar** (el botón Encargar no se habilita sin ella si hay
   algo físico).
3. ✅ Naza mueve estados desde `/admin` (pantalla Envíos).
4. ✅ Portón de impresión de Su voz = paso a `en_produccion`.
5. ✅ Marcos sin impreso: mismo circuito.
6. ✅ "Ya me llegó" → gracias + Trustpilot.
7. ✅ Nombre `entregas`.
8. ☐ **La etiqueta:** ¿camino B (agregador por país) o probar Mercado Envíos primero (spike)?
   Y cuál agregador por país (cotizar: Sendcloud/Packlink en ES; Enviopack/Zippin/Shipnow en AR).
9. ☐ **Quién paga el envío:** incluido en el precio del impreso/marco, o cotizado y sumado al
   encargar. (Con B se puede cotizar en vivo; con A lo cobra MP.)
10. ☐ ¿La imprenta de cada país acepta que el envío lo retire el correo del agregador, o hace
    drop-off? Define el flujo físico.
