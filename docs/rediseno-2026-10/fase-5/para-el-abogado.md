# Para el abogado: los textos legales de la web (fase 5, 14/10/2026)

Los textos legales de la web los redacta usted (B13). Hasta que lleguen los definitivos, la web
nueva publica los textos que ya había, pasados al diseño nuevo y a tres idiomas, con muy pocos
cambios. Esta lista es lo que necesitamos que revise o decida.

Dónde están los textos: `web/src/app/_textos/legal.ts` (un bloque por idioma: `es` España de tú,
`ca` catalán, `ar` Argentina de vos). Páginas: `/legal/terminos`, `/legal/privacidad`,
`/legal/arrepentimiento`, y lo mismo con `/ca` y `/ar` delante.

## 1. La garantía de cada libro (PENDIENTE DE SU REVISIÓN)

Naza decidió (DECISIONES D1) que la garantía aparezca en la FAQ, en la letra pequeña del checkout y
en los legales, y que **legales y política de devoluciones digan exactamente lo mismo**. Se añadió una
sección nueva «7. La garantía de cada libro» en los términos y la misma sección al final de la
página de desistimiento / botón de arrepentimiento, con estos textos (copiados del checkout):

- Familiar (el libro de otra persona): «Si no quiere hacerlo, te devolvemos el dinero.» Si ya ha
  empezado a contestar, el libro se cierra con lo que haya, sin devolución.
- De viaje: «Si el viaje se cancela, te devolvemos el dinero.»
- Para ti (tu propio libro): «Si cambias de idea antes de contestar la primera pregunta, te
  devolvemos el dinero.»

Necesitamos que mire:

1. **Choca con la sección «Si no hay libro»** (términos §8 y «Sin plazo» en desistimiento), que ya
   estaba: «si el narrador responde menos de diez preguntas, te devolvemos el importe completo, sin
   plazo». La garantía nueva dice «si ya ha empezado a contestar, sin devolución». Hoy la página dice
   las dos cosas. No quitamos ninguna: decidir cuál manda (o cómo se combinan) es suyo y de Naza.
2. **Choca con el desistimiento de España** (14 días, art. 108.3 RDL 1/2007): con la entrevista en
   marcha se devuelve el precio menos la parte proporcional. «Sin devolución» no puede quitar ese
   derecho legal dentro de los 14 días. ¿Cómo se redacta para que no confunda?
3. **«Si el viaje se cancela»**: no está definido qué es «cancelarse» (¿lo cancela quien compra?, ¿la
   agencia?, ¿antes de que empiece la entrevista?) ni el plazo.
4. **«Para mí»**: «antes de contestar la primera pregunta». Hay que precisar si cuenta desde la compra
   o desde que acepta.
5. **Los términos no describen las líneas Viaje ni «Para mí»** (la §2 «Qué es el servicio» solo habla
   del libro de otra persona). La garantía nombra las tres líneas; el resto del contrato no.

## 2. Lo que se cambió del texto anterior (todo lo demás es igual)

| Dónde | Antes | Ahora | Por qué |
|---|---|---|---|
| Términos §2 | «los marcos se suman a cualquiera» | «los marcos van con el libro impreso» | El marco solo se vende con el impreso (D4, `productos.ts`). |
| Términos §11 (antes §10) | «un audio de WhatsApp por día» | «un audio de WhatsApp cuando quiera» | No hay una pregunta por día (C4). |
| Términos §7 | — | Sección nueva de garantía | D1 (ver arriba). Las secciones 7 a 14 pasan a ser 8 a 15. |
| Términos §4 | «(ver la sección 7)» | «(ver la sección 8)» | Renumeración. |
| Términos §6 (España) | «usa el botón de arrepentimiento» | «usa el botón de desistimiento» | En España la página se llama «Desistimiento»; en Argentina sigue «Botón de arrepentimiento» (Disp. 954/2025, que derogó la Res. 424/2020 en septiembre de 2025). |
| Desistimiento (España) | Título «Botón de arrepentimiento», botón «Quiero arrepentirme de mi compra», asunto «Arrepentimiento de compra» | «Desistimiento», «Quiero desistir de mi compra», «Desistimiento de compra» | Ídem. Argentina mantiene los tres textos de antes. |
| Privacidad §5 (Resend) | «el código para entrar, los avisos, el anticipo» | «el código para entrar y los avisos» | No hay anticipo (D4). |
| Privacidad §7 | «si pedís borrar» (voseo en la versión de España) | «si pides borrar» | Errata. |
| Privacidad §12 Cookies | sesión y tema | + «la que recuerda el idioma que eliges en la web» y «Mientras compras, el navegador guarda en esa pestaña lo que vas rellenando […]; se borra al cerrarla» | Es lo que hace el código hoy (ver §4). |
| Fecha | 16 de septiembre de 2026 | 14 de octubre de 2026 | Hay cambios. Ponga la fecha real cuando se publique. |
| Las tres páginas | — | Recuadro «En corto» arriba | Resumen nuevo de lo que ya dice el texto, sin compromisos nuevos. A aprobar por Naza y por usted (lista en `textos-legal.md`). |

## 3. Idiomas

- **Catalán**: la traducción la preparó Claude Code y está marcada PENDIENTE REVISIÓN NATIVA Y
  ABOGADO. Lo que hemos visto hasta ahora: el Codi de consum de Catalunya (Llei 22/2010) reconoce el
  derecho de las personas consumidoras a expresarse en catalán y exige que la información y la
  documentación contractual dirigidas a consumidores en Cataluña estén también en catalán; el Decret
  121/2013 regula los fulls de reclamació, que se editan en catalán. ¿Alcanza con servir las tres
  versiones enlazadas, o en Cataluña la catalana tiene que ser la que se sirve por defecto? **Confirmar qué textos legales e información al consumidor tienen que estar en catalán
  obligatoriamente** (DECISIONES D2; p. ej. Codi de consum de Catalunya, Llei 22/2010) y si la
  versión catalana tiene el mismo valor que la castellana o hace falta una cláusula de prevalencia.
- **Argentina**: la misma versión en vos. Se mantienen el título y el enlace «Botón de
  arrepentimiento» en el pie de todas las páginas de `/ar` (Disp. 954/2025). La portada de `/ar`
  enlaza a `/ar/legal/arrepentimiento`: confirmar que cumple «de fácil acceso desde la página de
  inicio».
- Hoy las tres versiones describen los dos mercados (España y Argentina) en el mismo texto, como
  antes. ¿Conviene que `/ar` muestre solo lo de Argentina y `/` y `/ca` solo lo de España?

## 4. Cookies: por qué no hay banner (para que lo confirme)

Revisado en el código el 14/10. La web usa solo:

| Qué | Para qué | Dónde | Duración |
|---|---|---|---|
| `sb-…` (Supabase Auth) | Mantener la sesión de quien entra a su cuenta | Solo en `/entrar`, `/tablero`, `/admin` | La de la sesión de Supabase (B27) |
| `tema` | Recordar panel claro u oscuro, elegido a mano | Panel | 1 año |
| `idioma` | Recordar el idioma elegido a mano en el selector (y no redirigir por país) | Web pública | 1 año |
| `sessionStorage` (no es cookie) | Guardar el formulario de compra mientras se rellena | Checkout | Hasta cerrar la pestaña |
| `localStorage` `vitacora-origen` (no es cookie) | De qué anuncio llegó la visita, para saber qué anuncio trajo cada compra (ver abajo) | Toda la web, solo si se llega con parámetros de campaña en el enlace | 30 días desde la primera visita |

No hay analítica, ni píxel de Meta (B26), ni vídeos o mapas de terceros incrustados, ni fuentes de
Google cargadas desde el navegador (van alojadas en la web). Los pagos se hacen en la página de
Stripe o Mercado Pago (sus cookies son de su dominio). Por eso entendemos que todo es técnico o de
personalización pedida por el usuario (art. 22.2 LSSI-CE, exentas de consentimiento) y que **no hace
falta banner ni página de cookies aparte**: basta la sección 12 de privacidad. Dudas para usted:
¿la cookie `idioma` de 1 año entra en la exención? ¿Hace falta una tabla de cookies con nombre y
duración en la sección 12? Si algún día se instala el píxel de Meta (B26), sí harán falta banner,
página de cookies y consentimiento previo.

**Origen de campaña (agregado el 14/10, F4-5).** Cuando alguien llega a la web desde un anuncio
con parámetros en el enlace (`utm_source`, `utm_medium`, `utm_campaign`, `utm_content`, `utm_term`,
`fbclid`, `gclid`), el navegador guarda en `localStorage`, con la clave `vitacora-origen`, esos
valores, la página donde cayó (sin el resto de la dirección) y la fecha: la primera visita así y, si
vuelve por otro anuncio, también la última. Es de primera parte: no se manda a Meta, Google ni a
nadie, no hay píxel ni script de terceros, no se cruza con otras webs. Dura 30 días desde la primera
visita y después se borra solo. Si compra, esos valores viajan con la compra y quedan guardados en el
pedido (`pedidos.extras.origen`) para contar ventas por campaña. `fbclid` y `gclid` son
identificadores de clic que pone Meta o Google en el enlace; nosotros no los usamos para nada más que
guardarlos con el pedido. Pregunta: ¿esto entra en la exención del art. 22.2 LSSI-CE o, como es para
medir publicidad, requiere consentimiento previo (y entonces banner)? ¿Hay que nombrarlo en la
sección 12 de privacidad y en la tabla? Si requiere consentimiento, se apaga sin tocar nada más:
basta con quitar el componente `OrigenVisita` del layout (`web/src/app/layout.tsx`).

## 5. Lo que ya estaba pendiente (B13)

- NIF/CUIT y domicilio de los dos titulares (`web/src/app/legal/titulares.ts`): la web los muestra en
  amarillo «[a completar]».
- Hojas de reclamaciones, Junta Arbitral.
- **Plataforma ODR de la UE: ya no existe.** Cerró el 20 de julio de 2025 y el Reglamento (UE) 524/2013 quedó derogado por el Reglamento (UE) 2024/3228. Lo damos por cerrado: no hay que poner el enlace, y ninguna página debe prometerlo.
- Si la región de Railway pasa a Europa, cambia la tabla de privacidad §5.
- Privacidad §4 dice que avisamos «a mitad de camino»: confirmar con Naza que ese correo existe.

## 6. Rasca y gana y mails de descuento (NUEVO, 17/10/2026)

Esto todavía no está construido: se está diseñando y queremos su visto bueno antes de programarlo.

**Qué queremos hacer.** Un popup en la web pública, tipo «rasca y gana»: la persona rasca una tarjeta y
le sale un cupón del 10 % (código `VITACORA10`). Para entregárselo le pedimos el correo electrónico.
Después le mandamos **cuatro correos en unos días** recordándole el descuento. Esa persona **todavía no
compró nada**. No hay azar: a todos les sale el mismo 10 %, no es un sorteo.

**Lo que necesitamos que decida:**

1. **La base del envío.** Entendemos que el correo que entrega el cupón es la ejecución de lo que la
   persona pidió, pero los cuatro recordatorios son publicidad y necesitan consentimiento propio
   (art. 21.1 LSSI-CE y art. 6.1.a RGPD). ¿Basta una casilla **sin marcar por defecto**, separada de la
   de los términos y que diga quién manda los correos? ¿Conviene doble opt-in para poder probarlo si
   alguien se queja dentro de dos años?
2. **Qué tiene que decir el popup, palabra por palabra.** Nuestra propuesta: «Te mandamos el cupón por
   correo y, si quieres, cuatro recordatorios durante los próximos días. Puedes darte de baja cuando
   quieras.» ¿Falta algo (identidad del responsable, enlace a la privacidad, +18)?
3. **La X de cerrar.** ¿Hace falta que el «no, gracias» se vea tanto como el botón de participar? Lo
   ponemos así por defecto, pero queremos que lo confirme.
4. **Cada correo.** Entendemos que todos tienen que llevar: quién es el remitente con nombre y NIF, la
   palabra «publicidad» o una identificación equivalente, la dirección, un enlace de baja que funcione
   sin pedir contraseña, y el enlace a la privacidad. ¿Falta algo más?
5. **Las condiciones del cupón.** Vigencia (¿hasta cuándo vale el 10 %?), si se acumula con otras
   ofertas, sobre qué productos, un uso por persona, no canjeable por dinero. ¿Se publican como «bases
   de la promoción» en una página propia? ¿Tienen que estar visibles **antes** de rascar, o basta un
   enlace en el popup?
6. **¿Necesita autorización?** Como no hay azar y el premio es igual para todos, entendemos que no es un
   sorteo y que no hace falta autorización en España. En Argentina, ¿la autoridad provincial de juego o
   la Lotería pide autorización para una «raspadita» aunque no haya azar?
7. **El 10 % y el precio.** Si mostramos el precio tachado («antes 399 € / ahora 359 €»), ¿se aplica la
   regla de los 30 días del art. 20 LGDCU? ¿O con un cupón no hay que enseñar precio anterior?
8. **Privacidad.** Entendemos que hay que sumar a la política: el fin nuevo (comunicaciones
   comerciales), la base (consentimiento), el plazo de conservación (¿cuánto guardamos el correo si
   nunca compra?) y, en la tabla del §5, el proveedor que manda esos correos: ¿Resend, el mismo de los
   avisos, o una herramienta de mailing aparte?
9. **Argentina.** ¿Rige el mismo estándar? No hay un equivalente al art. 21 de la LSSI; entendemos que
   sí por la ley 25.326 y por la posibilidad de revocar el consentimiento en cualquier momento.

## 6. Propuestas para que confirme (19/10/2026)

Naza consultó estos puntos por otra vía y nos llegaron estas propuestas. **No son la opinión del
abogado**: las ponemos para que las confirme, corrija o descarte.

**6.1 Popup «rasca y gana» (cupón del 10 %, VITACORA10, todavía no publicado).**
- Dos casillas separadas, sin marcar por defecto (Planet49): una para recibir el cupón por mail
  (ejecución de lo pedido) y otra, aparte, para los 4 recordatorios (comunicación comercial, art. 21.1
  LSSI). Ninguna mezclada con la aceptación de términos. Que diga quién manda los correos.
- Cada correo comercial: remitente con nombre y NIF, la palabra «publicidad», domicilio, baja en un
  clic y enlace a la privacidad.
- Página de bases propia del cupón (vigencia, acumulación, productos, un uso por persona, no
  canjeable por dinero), enlazada desde el popup.
- Privacidad: fin nuevo, base legal, plazo de conservación y el proveedor que manda los mails en la
  tabla del §5.
- Como todos ganan lo mismo (no hay azar) no sería sorteo y en España no necesitaría autorización.
  ¿Y en Argentina? Si se muestra precio tachado, regla de los 30 días del art. 20 LGDCU.

**6.2 La garantía en una sola regla (reemplaza las contradicciones del §1).**
(a) La ley arriba y sin tocar: 14 días España / 10 días Argentina.
(b) Familiar: si no acepta, 100 %; si acepta y responde menos de diez preguntas, 100 % (gana sobre
cualquier «sin devolución»); si responde diez o más, se cierra con lo que hay.
(c) Viaje: «se cancela» = quien compra avisa antes de que la persona que viaja acepte, 100 %; si ya
aceptó, se cierra con lo que haya.
(d) Para mí: 100 % hasta la primera pregunta; después, igual que Familiar.
Y al final del §7: «Si dos reglas de este documento dicen cosas distintas, vale la que más te
favorezca.»

**6.3 Cookies.** Sesión, tema e idioma: exentas, sin banner. `vitacora-origen` (de qué anuncio vino,
30 días en localStorage) NO estaría exenta: es medición publicitaria y el art. 22.2 cubre también
localStorage. Lo cambiamos (19/10): el origen ya no se escribe en el navegador; se recuerda solo
durante la misma visita, en la memoria de la página, y viaja con la compra. Si la persona compra otro
día, no queda registrado. Nota: la propuesta original decía «capturarlo en el servidor sin perder
atribución», pero eso necesita una cookie de sesión para reconocer a la misma persona otro día, que
es justo lo que el art. 22.2 regula. Confirmar que lo que hicimos no necesita banner.

**6.4 Catalán y mercados.** En Cataluña (Llei 22/2010, Decret 121/2013) en catalán: las tres
páginas legales, checkout, confirmación de compra y formulario de desistimiento; los fulls de
reclamació en catalán. Prevalencia: «prevalece la versión en el idioma en que se celebró el
contrato». Separar mercados: «contratas con el titular de la región que eliges al pagar» (con la ley
imperativa del domicilio del consumidor siempre a salvo, Roma I art. 6.2).

**6.5 Datos.** NIF y domicilio: obligatorios antes de publicar. El enlace a la plataforma ODR de la
UE se quita (la plataforma cerró). Hojas de reclamaciones: sí en España, y decir cómo se piden.
Argentina: se mencionó una «Disp. 954/2025» que obligaría a publicar teléfono o canal alternativo
con horario; no pudimos confirmarla, que la verifique. Hoy hay WhatsApp de dudas y dos correos.
