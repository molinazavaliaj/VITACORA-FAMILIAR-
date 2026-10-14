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
| Términos §6 (España) | «usa el botón de arrepentimiento» | «usa el botón de desistimiento» | En España la página se llama «Desistimiento»; en Argentina sigue «Botón de arrepentimiento» (Res. 424/2020). |
| Desistimiento (España) | Título «Botón de arrepentimiento», botón «Quiero arrepentirme de mi compra», asunto «Arrepentimiento de compra» | «Desistimiento», «Quiero desistir de mi compra», «Desistimiento de compra» | Ídem. Argentina mantiene los tres textos de antes. |
| Privacidad §5 (Resend) | «el código para entrar, los avisos, el anticipo» | «el código para entrar y los avisos» | No hay anticipo (D4). |
| Privacidad §7 | «si pedís borrar» (voseo en la versión de España) | «si pides borrar» | Errata. |
| Privacidad §12 Cookies | sesión y tema | + «la que recuerda el idioma que eliges en la web» y «Mientras compras, el navegador guarda en esa pestaña lo que vas rellenando […]; se borra al cerrarla» | Es lo que hace el código hoy (ver §4). |
| Fecha | 16 de septiembre de 2026 | 14 de octubre de 2026 | Hay cambios. Ponga la fecha real cuando se publique. |
| Las tres páginas | — | Recuadro «En corto» arriba | Resumen nuevo de lo que ya dice el texto, sin compromisos nuevos. A aprobar por Naza y por usted (lista en `textos-legal.md`). |

## 3. Idiomas

- **Catalán**: la traducción la preparó Claude Code y está marcada PENDIENTE REVISIÓN NATIVA Y
  ABOGADO. **Confirmar qué textos legales e información al consumidor tienen que estar en catalán
  obligatoriamente** (DECISIONES D2; p. ej. Codi de consum de Catalunya, Llei 22/2010) y si la
  versión catalana tiene el mismo valor que la castellana o hace falta una cláusula de prevalencia.
- **Argentina**: la misma versión en vos. Se mantienen el título y el enlace «Botón de
  arrepentimiento» en el pie de todas las páginas de `/ar` (Res. 424/2020). La portada de `/ar`
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
- Hojas de reclamaciones, plataforma ODR de la UE (¿obligatorio el enlace?), Junta Arbitral.
- Si la región de Railway pasa a Europa, cambia la tabla de privacidad §5.
- Privacidad §4 dice que avisamos «a mitad de camino»: confirmar con Naza que ese correo existe.
