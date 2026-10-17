# Regalo en locales (copisterías y librerías) — diseño

> **Estado: diseño aprobado por Naza el 2026-10-17** (chat de brainstorming).
> Falta: las 6 decisiones de §9, textos de la carta y del cartel (tanda de 10),
> plan de implementación.
> Imagen de referencia del stand: `Desktop\PLANIFICADOR-HIGGSFIELD\gift-card\stand\stand-mostrador-sobres-1.png`.

## La idea en una línea

En el mostrador de una copistería hay una caja con sobres. La gente se lleva uno
gratis. Adentro hay una carta con un código. Si la paga en la web, **esa misma
carta queda activada y es el regalo**. El local no hace nada y se lleva el 20 %.

## Por qué así

Lo pensamos con el local cobrando en caja y activando con su celular, y lo
descartamos:

- **Al local no le pedimos trabajo.** Ni celular, ni PIN, ni cuentas. Una
  copistería chica dice que sí a una caja que se apoya y ya.
- **No hay plata en juego en el mostrador.** Una carta sin pagar no vale nada,
  así que si se llevan diez no pierde nadie.
- **Es barato.** Cada sobre cuesta unos 0,40–0,60 €. Una tarjeta rígida con
  dorado costaba unos 2 € y se regalaba a gente que capaz no compra.
- **Se regala un objeto, no un código.** Quien paga ya tiene en la mano la carta
  para darle al abuelo.

## 1. El objeto

**Sobre.** Papel simple, cerrado con un sticker redondo. Afuera dice
*El libro de su vida · Gift card*. Unos 0,15–0,25 € en la copistería.

**Carta adentro.** Papel de 250–300 g doblado al medio, tamaño A6 cerrado.
Unos 0,20–0,40 €.

- Tapa: la frase de marca y el título.
- Adentro, a la izquierda, líneas para escribir a mano: *Para ___* y *De ___*.
  Quien regala la firma con su letra.
- Adentro, a la derecha: qué es, el QR y el código impreso (VF-XXXXXX), que es
  único por carta.
- Abajo, chico: *Se activa cuando la pagás en vitacorafamiliar.com*. Va en vos,
  tú o catalán según el lote.

**Colores.** La imagen de referencia usa crema y dorado, pero
`docs/identidad-de-marca.md` los dejó fuera de la marca (spec 2026-10-07 §2).
Se decide en §9.

**Extra premium (pago).** Al comprar se ofrece *la tarjeta negra rígida en
caja*. La imprimimos y la mandamos por correo, así que el costo solo existe
cuando ya hubo venta.

## 2. El stand

- Una caja baja de mostrador, de cartón rígido forrado en negro mate, con unos
  10 sobres parados como cartas.
- En el frente de la caja: *Gift card · Llevátela* (o el equivalente aprobado
  en tú o catalán).
- Atrás, un cartel en un atril: *El libro de su vida*, la frase y la marca.
- Adelante, **la carta abierta como muestra** sobre un atril de acrílico. Tiene
  que ser lo mismo que se lleva la persona, no la tarjeta negra.
- La caja y el cartel los hace la copistería de Berga o un encuadernador, en
  1–2 semanas, por unos 8–20 € cada stand.
- El libro gigante abierto para una librería queda para después de Navidad.

## 3. El recorrido

1. La persona se lleva un sobre y en casa escanea el QR de la carta.
2. El QR abre `vitacorafamiliar.com/regalo/VF-XXXXXX`, la **misma dirección** que
   ya usa la gift card.
3. Como la carta **todavía no se pagó**, la página muestra *Esta carta es un
   regalo que todavía no se activó* y un botón *Regalarla*.
4. *Regalarla* abre la compra de regalo de hoy (`/regalar`) con el código ya
   puesto. Se completan el nombre del narrador, cómo le dice, el idioma, el
   mensaje y el audio opcional. **No se elige día de entrega** porque la carta
   se da en mano. Se puede sumar la tarjeta negra (extra).
5. Al pagar, el regalo se crea **con el código de la carta**. Desde ese momento
   el QR abre la página del regalo de hoy, con el mensaje, el audio y el botón
   *Empezar*.
6. Quien compra escribe *Para* y *De* a mano y la regala. El narrador escanea y
   sigue todo como en la gift card actual.

**Para sí mismo.** En la página del paso 3, debajo, va un link discreto:
*¿La querés para vos?*. Lleva a la compra normal con el local marcado. El 20 %
va igual.

## 4. El local y su 20 %

- Cada código impreso pertenece a un **lote**, y el lote a un **local**.
- Cuando se paga una compra que arrancó desde ese código, el pedido queda
  marcado con el local.
- La comisión es un **20 % del libro**, sin contar extras ni envíos (ver §9).
- **Le pagamos una vez por mes**, a mano, por transferencia o Bizum.
- Cada local tiene un **link privado de solo lectura**, sin login, con un token
  largo. Muestra los sobres que le dejamos, las cartas pagadas por mes y su
  comisión. Sirve para que confíe sin tener que preguntarnos.

## 5. Datos

Tablas nuevas. La migración se aplica después del OK de Joaquín y toca
`supabase/CONTRATO.md`.

**`locales`**

- `id`, `nombre`, `pais`, `idioma` (`es-AR` | `es-ES` | `ca`), `contacto`.
- `comision_pct`, por defecto 20.
- `token_panel`, único y largo.
- `activo` y `created_at`.
- **Sin datos bancarios en la base:** el pago se arregla fuera.

**`lotes_impresos`**

- `id`, `local_id`, `idioma`, `cantidad`, `created_at`, `nota`.

**`codigos_impresos`**

- `codigo` (único), `lote_id`.
- `pedido_id`: null hasta que se paga.
- `created_at`.

**Cambios en lo que ya existe**

- `pedidos.local_id`: null si la compra no viene de un local.
- **Códigos únicos entre las dos tablas.** `generarCodigo` (`web/src/lib/regalo.ts`)
  tiene que evitar los códigos de `codigos_impresos`, y al generar un lote se
  evitan los de `regalos`. Una restricción o chequeo en la base lo garantiza.
- Al pagar un regalo que vino de una carta, `regalos.codigo` = el código impreso
  y `codigos_impresos.pedido_id` = el pedido.

## 6. Lo que se construye

1. **Página `/regalo/[codigo]` con un estado nuevo.** Si el código es impreso y
   no está pagado, muestra *no activada → Regalarla* y no da 404. Un código que
   no existe sigue dando 404.
2. **`/regalar?codigo=VF-…`.**
   - Valida que el código sea impreso y esté libre.
   - Esconde el día de entrega y arrastra el código y el local hasta el pago.
   - Si el código ya se pagó mientras tanto, avisa y no cobra.
   - Un mismo código no se puede pagar dos veces: lo frena un bloqueo en el pago.
3. **Webhook de pago (Stripe y Mercado Pago).**
   - Crea el regalo con el código impreso y anota `pedido_id` y `local_id`.
   - Tiene que poder recibir el mismo aviso dos veces sin duplicar nada.
4. **Extra *tarjeta negra en caja*.**
   - Línea nueva en el carrito, con la dirección de envío.
   - Precio con variables `PRECIO_TARJETA_FISICA_EUR` y `_ARS`. Si no están
     cargadas, el extra no aparece.
   - Avisa a los socios para imprimir y mandar.
5. **Generador de lotes.** Es un script de la fábrica o un comando local, no una
   pantalla. Recibe el local, la cantidad y el idioma, crea los códigos y arma
   el PDF para la copistería: cartas en A4 imponible y una hoja de stickers de
   cierre.
6. **Panel del local** `/local/[token]`, solo lectura, en el idioma del local.
7. **Cuenta del mes.** Una vista o consulta que da, por local y por mes, cartas
   pagadas, total del libro y comisión. La usamos para pagarles.

Fuera de alcance: activación por el local, cobro en caja, pasarela para pagar
comisiones, el libro gigante y la percha con la marca de ropa (otra idea, otro
spec).

## 7. Si algo sale mal

| Caso | Qué pasa |
|---|---|
| El narrador recibe una carta que nadie pagó | Ve *todavía no se activó*. El texto le habla al que regala, no lo asusta: «Si te la regalaron, avisale a quien te la dio». |
| Dos personas intentan pagar el mismo código | Paga la primera. La segunda ve *esta carta ya fue regalada* y no se le cobra. |
| Escriben mal el código a mano | Se normaliza igual que hoy (`normalizarCodigo`). Si no existe, el mensaje es amable. |
| Un local se vacía rápido y no vende | Lo vemos en la cuenta del mes: le reponemos menos sobres o lo sacamos. |
| Se pierde la carta después de pagar | Desde su panel, quien compró baja la tarjeta digital con el mismo código, como hoy. |
| La compra empieza desde la carta pero se paga otro día | El código viaja en la compra, así que el local no se pierde. |

## 8. Pruebas

- **Tests:** estados de `/regalo/[codigo]` (no existe, impreso sin pagar, pagado
  y usado), código libre o ya pagado en `/regalar`, webhook repetido, que no se
  choquen códigos impresos con códigos normales, cálculo de comisión y textos en
  los 3 idiomas.
- **Prueba real antes del primer local:**
  1. Imprimir un lote de 5 en Berga.
  2. Pagar uno con la clave de prueba.
  3. Escanearlo como narrador.
  4. Ver la comisión en el panel del local.

## 9. Decisiones de Naza (una tanda)

1. **¿Qué compra la carta?** Puede ser el digital (49 €), el libro impreso
   (99 €) o el pack (109 €). Recomendado: **el libro impreso**, que es lo que se
   entiende como regalo de Navidad. Se puede dejar elegir en la compra.
2. **¿Va el precio impreso en la carta?** Recomendado: no. Va en el cartel del
   stand, así un cambio de precio no tira las cartas impresas.
3. **¿Sobre de qué color?** Recomendado: el **sobre negro** de la marca con el
   toroide como sello. Si no, crema como en la imagen, pero eso es salirse de
   la identidad.
4. **¿Sobre qué base va el 20 %?** Recomendado: el precio del libro, sin extras
   ni envío.
5. **Precio del extra tarjeta negra en caja.** Costo estimado de 3–5 € más el
   envío.
6. **Contrato con el local.** Una página: el 20 %, que los sobres son nuestros,
   el pago mensual y la salida. Lo revisa el gestor o el abogado, sobre todo el
   IVA de la comisión.

Textos de la carta, del cartel, de la página *no activada* y del panel del
local: los escribe Fable con voz cálida y se aprueban de a 10, en vos, tú y
catalán.
