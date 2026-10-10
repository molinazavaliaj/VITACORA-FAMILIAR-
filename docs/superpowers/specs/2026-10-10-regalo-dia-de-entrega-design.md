# Gift card: el regalo llega solo el día elegido — diseño (10/10/2026)

Pedido de Naza: que quien compra una gift card pueda elegir un día y que ese día
le llegue el regalo a quien lo recibe. Hoy la fecha (`regalos.fecha_entrega`) solo
sirve para el recordatorio de 15 días a quien regaló, y la tarjeta le llega por
mail únicamente a quien compra.

Sale de main después de que entre el PR #5 (`regalo-antes-de-vender`), porque toca
el mismo formulario. Spec madre: `2026-10-07-gift-card-design.md`.

## Decisiones de Naza (10/10)

| Tema | Decisión |
|---|---|
| A quién le llega | A quien recibe (el narrador). |
| Canal | Lo elige quien compra: WhatsApp o mail. La opción WhatsApp no se muestra hasta que estén las plantillas de Meta. |
| Aviso a quien compra | Sí. «Hoy le llegó» cuando sale el envío y «dásela vos» si falla. |
| Hora | La elige quien compra: una hora en punto de 8 a 22, en la hora del país de quien recibe. |

## 1. Qué ve cada persona

**/regalar, paso «Tu mensaje».** «¿Cuándo se lo vas a dar? (opcional)» sigue igual.
Si hay fecha, aparece «¿Querés que se lo mandemos ese día?», con tres opciones:
*No, se la doy yo* (la que viene marcada), *Por WhatsApp* y *Por mail*. Con WhatsApp
o mail se piden la hora (lista de 8 a 22) y el celular o el correo de quien recibe.
En el último paso se repite el dato («Le llega a … el … a las …») para que un error
de tipeo se vea antes de pagar.

**Quien compra.**
- Recibe la tarjeta apenas paga, igual que hoy.
- El día elegido recibe «Hoy le llegó tu regalo», que dice a dónde se mandó.
- Si el envío falla, recibe «no pudimos mandárselo, dásela vos», con el link a la tarjeta.

**Quien recibe, a la hora elegida, en el idioma del regalo.**
- **Mail.** El mensaje de quien regala, el link a `/regalo/<codigo>` (audio y botón
  Empezar) y el código.
- **WhatsApp.** Una plantilla corta con el link a su página. Si contesta, el bot lo
  reconoce por el número y lo canjea sin pedirle el código.
- Si ya canjeó antes (se la dieron en mano), no se manda nada.

**Fuera de esta versión.** Cambiar la fecha, la hora o el dato después de pagar. Un
error se corrige a mano en la base.

## 2. Cómo funciona

**Quién manda.** El entrevistador (Railway), con una fase nueva en su reloj,
«entregas de regalos», al lado de `recordarRegalos` (`entrevistador/src/flujo/regalo.ts`).
Ya tiene Resend, plantillas de WhatsApp y el patrón de traba. Descartados:
- Un cron en Vercel, porque el plan solo deja correr uno por día.
- `scheduled_at` de Resend, porque no cubre WhatsApp y obliga a cancelar si el regalo se canjea antes.

**Datos.** Columnas nuevas en `regalos`. Primero se escriben en `supabase/CONTRATO.md`.
La migración es idempotente y la aplica Naza, con OK de Joaquín.

| Columna | Tipo | Qué es |
|---|---|---|
| `entrega_canal` | text, check in (`mail`,`whatsapp`), null | null = «se la doy yo» |
| `entrega_contacto` | text, null | correo, o celular en E.164 |
| `entrega_hora` | smallint, check 8–22, null | hora local en punto |
| `entrega_zona` | text, null | `America/Argentina/Buenos_Aires` (es-AR) o `Europe/Madrid` (es-ES, ca) |
| `entrega_enviada_at` | timestamptz, null | cuándo se tomó o salió. Es también la traba |
| `entrega_fallo` | text, null | motivo corto si no salió |

Check de conjunto: si hay canal, tiene que haber `fecha_entrega`, contacto, hora y zona.

**El ciclo** (cada tick del reloj V3, de un minuto):
1. Busca los regalos con `entrega_canal` no nulo, `usado_at` nulo y `entrega_enviada_at`
   nulo. Calcula si la fecha y la hora ya llegaron en `entrega_zona`. La cuenta es una
   función pura, con el cambio de horario incluido.
2. Si el narrador ya no está en `regalo_pendiente`, no hace nada.
3. Toma el regalo con compare-and-swap sobre `entrega_enviada_at`.
4. Manda el mail (Resend) o la plantilla (WhatsApp).
   - Si sale bien, manda «Hoy le llegó» a quien compra (`mandarMailFamilia`).
   - Si falla, anota `entrega_fallo` y manda «dásela vos». La marca **no** se devuelve,
     porque un envío fallido no se reintenta solo.
5. Si un WhatsApp salió pero Meta avisa después que no se entregó (`whatsapp/entregas.ts`),
   anota el fallo y manda «dásela vos».
6. Si se pasó la hora porque el bot estuvo caído, lo manda igual mientras siga siendo el
   mismo día local. Si el día ya pasó, se trata como fallo y va «dásela vos».

El mail o la plantilla a quien recibe y el aviso a quien compra son pasos aparte. Si el
segundo falla, se loguea y no deshace el primero.

**Canje sin código.** Cuando escribe un número desconocido, el bot se fija antes de pedir
el código si hay un regalo con `entrega_canal = 'whatsapp'`, `entrega_contacto` igual a ese
número (normalizado como hoy, con y sin el 9), `entrega_enviada_at` no nulo, sin `entrega_fallo`
y con `usado_at` nulo. Si lo hay, canjea por el mismo camino que con el código.

**El interruptor de WhatsApp.**
- Web: una variable en Vercel (`REGALO_ENTREGA_WHATSAPP=1`). Si está apagada, la opción no
  aparece y la API rechaza el canal.
- Bot: las plantillas se anotan en `WA_PLANTILLAS_V3_LISTAS` como `<idioma>:regalo_entrega`.
  Si falta la del idioma, el regalo se trata como fallo (la compra pasó con el interruptor
  prendido y después algo se apagó).

## 3. Errores y privacidad

- **Validación en la compra.** La API contesta 400 en cualquiera de estos casos:
  - canal sin fecha;
  - hora fuera de 8–22;
  - correo o celular mal formados;
  - fecha y hora ya pasadas en la zona de quien recibe;
  - canal WhatsApp con el interruptor apagado.
- **El código viaja en el envío**, igual que en la tarjeta. Contra un dato mal escrito:
  - el dato se repite antes de pagar;
  - «Hoy le llegó» dice a dónde fue;
  - si canjea otro número, sigue valiendo el aviso de «usado por otro».
- El contacto de quien recibe se usa solo para este envío. No pasa a `narradores`. En los
  logs va enmascarado (`ab***@gmail.com`, `+54***1234`).

## 4. Textos (los aprueba Naza, tandas de 10, sin dos puntos, nunca usted)

Quien compra los lee de vos o de tú según su región. Quien recibe, en el idioma del regalo.

1. «¿Querés que se lo mandemos ese día?» y las tres opciones.
2. La hora, el celular, el correo y sus errores.
3. La confirmación del último paso.
4. El mail a quien recibe (asunto, cuerpo y botón).
5. La plantilla de WhatsApp a quien recibe (la carga Joaquín en Meta).
6. «Hoy le llegó tu regalo».
7. «No pudimos mandárselo, dásela vos».

Las horas se escriben «a las 10», sin «:00».

## 5. Pruebas (tests primero)

- **Web.**
  - validación de los campos nuevos;
  - la opción WhatsApp aparece o no según la variable;
  - la compra guarda las columnas;
  - la confirmación del último paso.
- **Bot.**
  - la cuenta de la hora por zona, incluido el cambio de horario en Madrid;
  - no sale antes de hora;
  - dos ticks no lo mandan dos veces;
  - no sale si ya canjeó;
  - fallo de mail, fallo de plantilla, plantilla ausente, día vencido;
  - fallo de Meta después de enviado;
  - canje sin código, y que un número ajeno no canjee.
- Revisión con un segundo agente antes de mergear.

## 6. Orden

1. CONTRATO.md y la migración (Naza la aplica, con OK de Joaquín).
2. Textos aprobados.
3. Web y bot en la rama `regalo-dia-de-entrega`, desde main con el PR #5 adentro.
4. Prueba real por mail. WhatsApp cuando estén las plantillas.
