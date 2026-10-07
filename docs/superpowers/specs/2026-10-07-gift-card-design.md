# Gift card de Vitácora — diseño

> **Estado: diseño aprobado por Naza el 2026-10-07** (chat de brainstorming).
> Falta: maqueta aprobada, número de WhatsApp fijo por país (Joaquín + Naza),
> plan de implementación.

## La idea en una línea

Al narrador le llega un regalo como si fuera una carta. Abre el sobre, lee el
mensaje de quien se lo regala, escanea el QR y empieza su entrevista.

## Por qué cambia el arranque (y para bien)

Hoy quien compra carga el teléfono del narrador y el bot le escribe primero con
una plantilla de Meta. Con la tarjeta **el narrador le escribe primero al bot**:

- ya sabe de qué se trata, porque tiene la carta en la mano
- la conversación queda abierta sin depender de que Meta apruebe una plantilla
- quien regala no necesita saber ni cargar el teléfono del narrador

## 1. Qué es la tarjeta

No es un saldo en plata. **Es el libro entero, ya pagado**, esperando que el
narrador escanee.

Se compra una sola cosa y llega de dos formas:

- **Digital, siempre y al instante.** Un PDF para imprimir en A4 y doblar, y una
  imagen vertical para mandar por WhatsApp. Sirve para el que compra el 24 a la
  noche.
- **Física, opcional y paga aparte.** Sobre por correo.

## 2. El objeto

- **Sobre negro** (`#14140F`) con el toroide en blanco a modo de sello. Afuera
  dice *Para [nombre]* en Playfair Display.
- **Tarjeta doble blanca, tamaño A6**, que se abre como una carta. Tinta negra.
- Tipografías y colores de `docs/identidad-de-marca.md`. Sin crema ni dorado
  (quedaron fuera de la marca). El violeta no se usa en la pieza impresa.

## 3. El texto (Argentina, vos) — APROBADO

Para España sale con tú, y en catalán si el narrador es catalán. Esas dos
versiones **todavía no están escritas ni aprobadas**.

**Tapa**

> Vitácora Familiar
> En cada familia hay un libro sin escribir.

**Adentro, a la izquierda**

> [Nombre del narrador],
> [el mensaje de quien regala]
> [Nombre de quien regala]

**Adentro, a la derecha**

> Esto es un regalo.
> Un biógrafo te va a hacer preguntas sobre tu vida por WhatsApp.
> Vos le contestás con audios, cuando puedas.
> Con lo que le cuentes se escribe el libro de tu vida.
>
> Apuntá la cámara del celular acá para empezar.
> [QR]
>
> Si la cámara no te anda, mandá un WhatsApp al [número] con este código.
> [VF-XXXX]

Reglas que respeta:

- «el libro de tu vida» va porque le habla al narrador. La regla de nunca decir
  «tu vida» es para lo que lee quien compra.
- El código para escribir a mano va siempre: mucha gente de 70 no sabe escanear.
- No dice cantidad de preguntas ni tiempo (igual que la web).

## 4. La compra

En la web, una opción nueva: **Regalar**. Quien regala completa:

- nombre del narrador y cómo le dice (abuelo, papá, el nombre)
- país, que define vos, tú o catalán
- su mensaje (texto) y, si quiere, un audio
- si quiere el sobre físico, la dirección de envío
- la fecha en que piensa darlo (para el recordatorio, ver §7)

**No pide el teléfono del narrador.** Al pagar recibe el PDF y la imagen al
instante, y la tarjeta queda en su panel.

## 5. Al escanear

El QR abre una página corta, `vitacorafamiliar.com/regalo/VF-XXXX`:

1. *[Narrador], [quien regala] te hizo un regalo.*
2. El audio de quien regala, si grabó uno, con un botón grande de play.
3. Las mismas líneas de la tarjeta, que explican qué va a pasar.
4. Un solo botón, **Empezar**, que abre WhatsApp con el mensaje ya escrito:
   *Hola, quiero empezar mi libro. VF-XXXX*

## 6. El bot

Cuando le llega un mensaje con un código válido:

1. Engancha ese teléfono con el narrador que armó quien regala.
2. Marca la tarjeta como usada.
3. Arranca la bienvenida ahí mismo (no hace falta plantilla: escribió primero el
   narrador).
4. Le avisa a quien regaló en su panel: *[Narrador] empezó.*

Desde ahí todo sigue igual que hoy.

## 7. Si algo sale mal

| Caso | Qué pasa |
|---|---|
| Escribe el código mal | El bot no lo encuentra y le pide que lo mire de nuevo en la tarjeta. Si tampoco anda, le dice que le avise a quien se lo regaló |
| El código ya lo usó otro número | El bot no lo engancha y le avisa a quien regaló, que lo resuelve desde el panel |
| Nunca escanea | No hay plazo. A los 15 días de la fecha que puso quien regala, si sigue sin usar, un recordatorio suave **a quien regala**, nunca al narrador |
| Se pierde la tarjeta | Quien regala la vuelve a descargar desde su panel, con el mismo código |

## 8. Abierto

- **Número de WhatsApp impreso, fijo por país** (Joaquín + Naza). El QR lo
  resuelve solo, pero el número escrito a mano tiene que durar meses en un cajón.
- Textos de España (tú) y catalán, de la página de escaneo y de los mensajes del
  bot: se escriben y los aprueba Naza, de a 10.
- Precio del sobre físico y quién lo imprime y envía.
