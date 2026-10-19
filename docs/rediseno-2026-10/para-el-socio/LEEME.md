# Para el socio: mails y WhatsApp del recorrido (rediseño 2026-10, fase 3)

**Todo lo de esta carpeta es PROPUESTA PENDIENTE DE NAZA.** Ningún texto está aprobado y nada está
implementado. Es la referencia visual y de textos para lo que mandan el **entrevistador** y la
**fábrica**, no la web (`PASO-DE-MANOS.md` §4, fila `Emails`, y C11). La web ya manda con este
diseño sus tres mails: acceso tras el pago, tarjeta del regalo e invitación (`web/src/lib/mail.ts`).

Abrir `index.html` en el navegador. Lo que va entre llaves (`{nombre}`, `{fecha}`, `{enlace}`) lo
rellena quien manda el mensaje.

## Qué hay

| Archivo | Qué es | Lo manda |
|---|---|---|
| `mails/01-falta-su-whatsapp-{es,ar}.html` | Regalo con día de inicio elegido y sin el número del narrador | entrevistador |
| `mails/02-primera-respuesta-{es,ar}.html` | Primera respuesta del narrador (texto aprobado el 06/10 para el mail de ejemplo: «ya empezó a contar») | entrevistador |
| — (el 3 de la maqueta) | **El anticipo: NO va** (DECISIONES D4, el libro se escribe cuando termina de contar) | — |
| `mails/04-revisar-nombres-{es,ar}.html` | Nombres por confirmar al terminar | fábrica |
| `mails/05-falta-su-foto-{es,ar}.html` | Falta la foto de portada (solo con impreso o marco) | fábrica |
| `mails/06-enviado-{es,ar}.html` | El impreso salió, con el seguimiento real | fábrica |
| `mails/07-pedir-opinion-{es,ar}.html` | Pedir su opinión 7 días después | fábrica |
| `whatsapp.html` | Primer WhatsApp el día del regalo (con los tres botones y sus respuestas), recordatorio a los 3 días y aviso a quien regala, en tú y en vos | entrevistador |

Diseño: el mismo de los mails de la web (tablas, estilos en línea, 600 px, texto sobre fondo
declarado, botón como tabla con fondo). Colores: tinta `#0d0d0c`, papel `#f4f0e7`, dorado de la
etiqueta `#7a6440`, texto `#45413a`. Sin violeta. Cada mail tiene que salir también en texto plano.
El catalán no está: hace falta la traducción y la revisión nativa (B27).

## Reglas que se aplicaron (y que tienen que seguir valiendo al programarlo)

- **Sin anticipo** en ningún mail ni WhatsApp (D4). Se quitó el mail 3 y la línea «Tras su tercera
  respuesta te llega el anticipo» del aviso a quien regala.
- **Sin plazo del impreso** («9 días», «llega en unos días») hasta que lo confirme la imprenta (B9).
- **Sin reseñas inventadas.** El mail 7 pide una opinión real; no se regala nada a cambio y no se
  publica nada sin permiso por escrito. La sección de reseñas de la web sigue apagada hasta tener
  cinco reales.
- **Sin dos puntos** en los textos (la maqueta tenía «Funciona así:», «Para empezar, una fácil:»,
  «Ya está:», «esperándote:»).
- **Nunca «una pregunta por día» ni plazos**: la siguiente pregunta llega cuando termina de contar
  (la maqueta decía «En unos días te mandamos otra pregunta»: cambiado a «Cuando quieras, seguimos
  con la siguiente»).
- **Tú en España, vos en Argentina** («Vale, empiezo» / «Dale, empiezo», «¿Quién eres?» / «¿Quién sos?»).
- **La garantía no va** en mensajes (D1). Si el narrador escribe NO, se avisa a quien regala; la
  devolución la gestiona una persona.
- «¿Quién eres?» dice que el libro se escribe con ayuda de inteligencia artificial: es coherente con
  lo que dice el bot hoy, pero la web todavía no lo dice (B15). Que Naza decida las dos cosas juntas.

## Lo que el entrevistador o la fábrica tendrían que hacer (C11 y PENDIENTES §3)

1. **Primer WhatsApp el día elegido** con la tarjeta del regalo, el nombre de quien regala y los tres
   botones («Vale, empiezo» / «Mejor otro día» / «¿Quién eres?»). Es una plantilla que tiene que
   aprobar Meta (hoy: `regalo_entrega` y la bienvenida `BIEN` del banco V3).
2. **Recordatorio a los 3 días** con la misma pregunta, una sola vez; **aviso a quien regala a los
   10** (hoy: `alerta_silencio`, que la web ya muestra en el panel); a los 30, elegir cerrar o esperar.
3. **«Mandárselo yo con mi nombre»** desde el panel: plantilla nueva (la web solo pondría una marca).
4. **«Cambiar la primera pregunta» / «Cambiarla»** en V3 (hoy V3 no tiene guion editable).
5. **«Él dice que no»** antes de contestar: no volver a escribirle y avisar a quien regala.
6. **Número sin WhatsApp**: detectar la entrega fallida, avisar a quien regala, mover la fecha.
7. **Viaje**: 22:00 hora local del destino, «¿Ya estáis en casa?», cierre a los 3 días de la vuelta.
8. **Al final**: mensaje de cierre al narrador, repaso de su historia y aviso del día que llega su libro.
9. **Los mails 1, 2, 4, 5, 6 y 7** de esta carpeta, cada uno en su momento y una sola vez.

Lo que falta en la web o en la base para algunos de ellos (no es del socio, pero condiciona):

- Mail 1: la web no tiene dónde cargar el número del narrador de un regalo (PENDIENTES F2-3). Hasta
  que exista, el botón puede abrir el WhatsApp de dudas o contestar el mail.
- Aviso por WhatsApp a quien regala (WhatsApp 3 y la copia del mail 2): la base no guarda el
  teléfono de quien compra (PENDIENTES F1-C1). Hoy solo por mail.
- Mail 7: hace falta una página o formulario donde caigan la nota y el texto (no existe).
- Los mails en catalán: dependen de saber en qué idioma compró cada familia (PENDIENTES, «Mails en
  catalán»).
