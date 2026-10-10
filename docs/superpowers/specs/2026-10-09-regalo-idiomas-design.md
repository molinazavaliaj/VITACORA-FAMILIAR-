# Gift card en España y en catalán — diseño

> **Estado: diseño aprobado por Naza el 2026-10-09** (chat de brainstorming).
> Sigue a la gift card (`2026-10-07-gift-card-design.md`, rama `regalo`, PR #2).
> Rama de trabajo: `regalo-idiomas` (sale de `regalo`).

## En una línea

La gift card, que hoy habla solo castellano de Argentina, pasa a funcionar también
en castellano de España (de tú) y en catalán. Además, los tres idiomas arrancan con la
misma bienvenida.

## Decisiones de Naza (09/10)

1. **Quien compra lee en el castellano de su país**: de vos en Argentina y de tú en
   España. El catalán es solo para el abuelo. La web no se traduce al catalán.
2. **El idioma de la entrevista se elige en la compra**, en el paso 1 de `/regalar`, con
   la pregunta «¿En qué idioma le hablamos?» y tres opciones: Castellano de Argentina,
   Castellano de España y Català. Viene marcada la del país de quien compra y se puede
   cambiar (la nieta en Madrid le regala al abuelo de Córdoba).
3. **El arranque es la bienvenida del banco V3 más un pedido de SÍ**, en los tres
   idiomas. La bienvenida es el mensaje `BIEN` de cada banco, que ya está aprobado.
   Abajo va una línea nueva que pide el SÍ con el permiso de guardar los audios.
   **Argentina también se pasa a esta bienvenida**, así un regalo arranca igual en
   cualquier país. La bienvenida vieja («Soy tu biógrafo… Respondé SÍ y arrancamos
   mañana») deja de usarse en los regalos.

## Qué lee cada uno

| Quién | Qué | Idioma |
|---|---|---|
| Quien compra | `/regalar`, los mails de la tarjeta y del recordatorio, el próximo paso del panel | vos (AR) o tú (ES), según el país de quien compra |
| El abuelo | tarjeta, imagen, página del QR, mensaje de WhatsApp ya escrito | el idioma elegido |
| El abuelo | bienvenida, pedido de SÍ, confirmación, «no te entendí», «todavía no» | el idioma elegido |
| El abuelo | «no encuentro ese código» | según el prefijo del teléfono: +34 en tú, cualquier otro de vos (todavía no se sabe qué regalo es) |
| El abuelo | «ese código ya se usó» | el idioma del regalo |

El resto del panel (lo que no es del regalo) queda como está. Pasarlo entero a tú es otro tema.

## Por qué los regalos van siempre por la V3

La bienvenida del banco describe cómo funciona la V3 («si pasan unos minutos sin
audios nuevos, te mando la pregunta que sigue»), y solo la V3 habla catalán y tú. Hoy
la V3 para narradores nuevos depende de `V3_PARA_NUEVOS=1`, que sigue apagado. **Un
narrador de regalo arranca en la V3 aunque ese interruptor esté apagado.**

## Cuándo sale la primera pregunta

Con el SÍ. El abuelo acaba de escanear su regalo y está con el teléfono en la mano; la
ventana de 24 horas está abierta. La confirmación dice exactamente eso, sin prometer
«mañana».

## El arranque, paso a paso

1. El abuelo manda el código y el canje funciona como hoy.
2. Recibe un solo mensaje: el `BIEN` de su idioma, renderizado con su nombre, y abajo el
   pedido de SÍ.
3. **Contesta SÍ.** El SÍ se reconoce en cada idioma. En catalán también valen «d'acord»,
   «som-hi», «endavant», «vinga» y «va». En castellano de España, «vale» y «venga».
   - Queda en `acepto` con `consentimiento_voz_at`.
   - Recibe la confirmación en su idioma.
   - Arranca la V3 con la primera pregunta enseguida.
   - Quien regaló recibe el mail de «dijo que sí», como hoy.
4. **Contesta otra cosa.** Recibe una vez «no te entendí» o «todavía no» (si dijo que no),
   en su idioma. Es la misma regla de hoy: se le pide de nuevo una sola vez.

## Datos

- La web escribe `contexto.idioma`: `"es-ES"` o `"ca"`. Para Argentina no se escribe nada,
  y la ausencia quiere decir es-AR. Ya está en CONTRATO («`contexto.idioma`») y la V3 lo
  lee con `idiomaDe`.
- `contexto.trato = 'vos'` solo para es-AR. Para es-ES y ca no se escribe trato, porque
  ese campo es del entrevistador viejo y los regalos no lo usan.
- Sin migración nueva.

## Textos nuevos (los aprueba Naza, de a 10)

- **Arranque del bot**: pedido de SÍ, confirmación, «no te entendí» y «todavía no».
  Son 4 textos en 3 idiomas (12). Los redacta Fable con voz de biógrafo y Naza aprueba.
- **Avisos del bot** en tú y en catalán: «no encuentro ese código» y «ya se usó» (4).
- **Lo que lee el abuelo** en tú y en catalán: las frases de la tarjeta, la página y el
  mensaje de WhatsApp (unos 18).
- **Lo que lee quien compra en tú**: los textos ya aprobados de `/regalar`, los mails y el
  próximo paso, pasados de vos a tú (unos 45, en general cambio de conjugación).
- **La pregunta nueva del idioma** y sus tres opciones, de vos y de tú.

## Fuera de este diseño

Sobre físico, dos libros para la misma persona, el resto del panel en tú, y las
plantillas de Meta para narradores que no son de regalo.
