# Pendientes y decisiones abiertas

Quién decide: **Naza** (dueño de `web/`), **Socio** (Joaquín, `entrevistador/` y todo lo que toque
`supabase/`), **Los dos** (negocio). Las referencias Cx remiten a `PASO-DE-MANOS.md` §5.

> Resueltas el 13/10 en `DECISIONES.md`: B1 (regiones + catalán), B2 (datos → pago), B3 (marco solo con impreso), B4 (anticipo fuera), B5 (garantía en FAQ, checkout y legales), B7 (Kids oculto), B9 (sin cifra hasta confirmar), B8 (pausar = contacto). Nueva: **B27 revisión nativa del catalán y qué textos legales deben ir en catalán (abogado)**.

## 1. Bloquean el lanzamiento (hay que decidirlas antes de la fase 1 o durante ella)

| # | Decisión | Opciones | Quién | Fase que frena |
|---|---|---|---|---|
| **B1** | **Argentina en la web nueva.** Las maquetas son solo España. ¿Se mantienen las dos regiones (ES: tú/€/Stripe · AR: vos/ARS/Mercado Pago) con el diseño nuevo? | (a) Sí, cada texto nuevo con variante vos (recomendado: es lo que hace el código y lo que vende hoy). (b) AR se queda con la web/textos actuales (dos webs: no recomendado). (c) Solo España (cierra la venta en AR). | Naza + Socio | 1 |
| **B2** | **Orden del checkout** (C2). ¿Pago antes de los datos, como la maqueta («Lo completo más tarde»), o datos antes del pago como hoy, en 3 pasos con el diseño nuevo? | (a) Datos → pago en 3 pasos (recomendado para lanzar: cero cambios de base). (b) Pago → datos: exige estado nuevo de narrador (p. ej. `datos_pendientes`) o pedido sin narrador, recordatorio por email, cambio de `confirmarPago` y acuerdo en `CONTRATO.md`. | Naza (b: + Socio) | 1 |
| **B3** | **Marco sin impreso** (C3). La maqueta vende el marco también con solo el digital; el código exige impreso («viajan juntos»). | Mantener regla actual / permitir marco solo (toca `productos.ts`, tests y la logística de `entregas`). | Naza (+ Socio si cambia `entregas`) | 1 |
| **B4** | **El anticipo.** ¿Existe el anticipo a la tercera respuesta con el escritor V3? Si no, ninguna pantalla lo menciona (línea de tiempo del panel, checkout, emails, `/ejemplo`). | Sí / No. POR COMPROBAR en `fabrica/` si el worker V3 genera `anticipo.json`. | Naza | 1 |
| **B5** | **Garantía «te devolvemos el dinero» junto a cada botón** (C6). Choca con la regla de Naza del 06/10 (nada de devoluciones en textos comerciales). | Mostrarla (y entonces la política de devoluciones y los legales tienen que decirlo igual) / No mostrarla (como hoy). Afecta también a «Para mí» y a Viaje («si el viaje se cancela»). | Naza | 1 (copy) y 5 (legal) |
| **B6** | **Entrar**: ¿código de 6 dígitos (actual) con el diseño nuevo, o enlace por email con código de reserva (maqueta)? | Código (recomendado) / Enlace + código (revisar plantilla de email de Supabase y Redirect URLs, T3.11). | Naza | 2 |
| **B7** | **Kids**: ¿aparece en la web nueva? | No (ocultar solapas, página, checkout, panel, landings) / «Próximamente» con lista de espera (rama `vitacora-kids`, D27.10) / Vender (exige bot, fábrica y precio: no es de esta tarea). | Los dos | 1 (solapa) y 4 |
| **B9** | **Plazo del impreso**: «unos 9 días después de cerrar el libro» no está en ningún documento. | Confirmar con la imprenta y con la fábrica (cuándo se manda a imprimir: tras confirmar nombres y foto). | Naza | 1 (checkout), 2 (panel), 5 (legal) |
| **B11** | **Número de WhatsApp de dudas** («Vitácora», cuenta de empresa) para el botón flotante y las cajas. | Número + horario de respuesta. Variable `NEXT_PUBLIC_WHATSAPP_DUDAS`. | Los dos | 1 |
| **B13** | **Textos legales definitivos** (condiciones, privacidad, desistimiento, cookies, titulares ES/AR, hojas de reclamación, ODR). | Los redacta un abogado. Mientras, los actuales con C4 corregido. | Naza | 5 (no frena el switch si se mantiene lo actual corregido) |
| **B16** | **Regiones de Vercel y Supabase** (`RENDIMIENTO.md` 2.4): comprobar y, si no coinciden, fijar la región de la web. | Leer los paneles; decidir `vercel.json`. | Naza (avisar al Socio) | 0 |
| **B17** | **Variables del entorno Preview en Vercel** y claves de prueba de Stripe/MP para probar compras en la preview sin cobrar. | Cargarlas (`PASO-DE-MANOS.md` §3.2). | Naza | 0 |

## 2. No bloquean (se deciden cuando toque; mientras, se hace lo indicado)

| # | Decisión | Mientras tanto | Quién |
|---|---|---|---|
| B8 | **Pausar desde la web** (C10): hoy solo el entrevistador pone `pausado`. ¿La web puede escribir `pausado` (cambio de CONTRATO) o manda un aviso a los socios? | Botón «Pausar» abre contacto; «Cerrar con lo que hay» = cierre anticipado existente. | Socio + Naza |
| B10 | **Fotos generadas** (Osvaldo, Nico, Sara, Dani) en producción: ¿valen como ilustración o se sustituyen por fotos reales (familias, libro impreso de verdad)? | Se usan en la preview; para el switch, Naza elige. | Naza |
| B12 | **Cupón VITACORA10 y popup rasca-rasca**: exige cupones reales en Stripe/MP, guardar el email (dónde: Resend Audiences, tabla nueva = migración) y reglas de cuándo sale. | No se hace en fases 0–2; fase 4 detrás de variable. | Los dos (tabla: Socio) |
| B14 | **Precio de ejemplares extra** («uno para cada hermano») y **envío internacional** (países, plazo, precio, con la imprenta). | Hoy existe `PRECIO_COPIA_*`; sin variable no se ofrece. Envío solo al país de la región. | Los dos |
| B15 | FAQ «¿Quién escucha sus audios?»: ¿se dice que el equipo usa transcripción y escritura con IA (versión de la maqueta, coherente con lo que el bot le dice al narrador)? | Texto aprobado actual («Solo su familia…»). | Naza |
| B18 | **«Dos hermanos para el mismo padre»** (`Familias` 1): detectar el teléfono repetido en el checkout, pedir permiso a quien regaló, unir al segundo como invitado y devolver/convertir su pago. | No se hace. Hoy un teléfono ya en `pendiente_pago` se reutiliza (`api/compra/route.ts:166-171`); un segundo pago para el mismo narrador en otra familia crea su propio pedido. Documentar en PENDIENTES para después del lanzamiento. | Los dos (toca `pedidos`, `invitados`, reembolsos) |
| B19 | **Cancelar el pedido y devolver** desde el panel (C9) y las tres opciones cuando él dice que no (`Casos` 1). | «Cancelar» → contacto por WhatsApp/email; la devolución la hace una persona en Stripe/MP. | Los dos |
| B20 | **Página de repaso del narrador** (`Narrador`): página web pública con token, letra grande, «Está bien / Corregir con audio», si no repasa en 5 días se escribe igual. | No se hace: el contenido lo produce el escritor (fábrica) y lo dispara el entrevistador. | Los dos |
| B21 | **Tema claro/oscuro del panel** (D-11): la maqueta es solo oscura; el panel actual tiene botón de tema con cookie. | Conservar el botón; el oscuro es el tema de la maqueta, el claro reusa los tokens actuales. | Naza |
| B22 | **Fotos para dentro del libro: hasta 12** (maqueta) vs 20 (`FOTOS_MAXIMO`, `comprar/formulario.tsx:41`) y «pie escrito a partir de lo que contó» (propuesta de la guía: lo haría la fábrica). | Mantener 20; el pie automático no se promete. | Naza (pie: + fábrica) |
| B23 | **Mínimo de respuestas para «Cerrar con lo que hay»**: código 10 (`MINIMO_RESPUESTAS_CIERRE_ANTICIPADO`); maqueta no fija mínimo y `Casos` 3 dice «por debajo de 10 se avisa de que saldrá más corto». | Mantener 10. | Los dos |
| B24 | **Viaje**: ¿se puede decir «cada noche os escribimos»? (la guía lo deja sin decidir); cierre automático a los 3 días tras la vuelta; «¿Ya estáis en casa?» por WhatsApp. | Textos de viaje sin «cada noche» hasta decidirlo; lo demás es del entrevistador. | Naza (texto) · Socio (bot) |
| B25 | **URL con región** para la portada estática (`RENDIMIENTO.md` 3.10): `/` y `/ar` con redirección por país, o una sola `/` con cookie de región. | Se elige en fase 1 según lo que prefiera Naza; (c) `/ar` es lo más simple y cacheable. | Naza |
| B26 | **Píxel de Meta y eventos** (vista de landing, inicio de checkout, compra) → exige banner y página de cookies. | No se instala en fases 0–2. | Naza |
| B27 | **Recordar el dispositivo 30 días** (Entrar): es la duración de la sesión de Supabase (refresh token). | POR COMPROBAR en Supabase → Auth → Sessions. | Naza |
| B28 | **Nombre de la URL de preview** (`vitacora-rediseno.vercel.app`) y del PDF de Dora en `public/` (10,5 MB; sacarlo del repo). | Si el alias está cogido, otro; el PDF puede quedarse hasta el switch. | Naza |
| B29 | **`docs/design.md`**: añadir la paleta oscura del rediseño (C18) como variante de marketing o sustituir el principio «negro sobre blanco». | Se añade como variante tras aprobar la fase 0. | Naza (+ Socio: el doc es compartido) |

## 3. Lista para el socio (entrevistador) — lo que las maquetas piden y es suyo

Se le entrega como referencia con los HTML de `Whatsapp`, `Casos`, `MasFlujos`, `Familias`,
`Emails` y `Narrador`. Nada de esto se implementa en `web/`:

1. Primer WhatsApp el día elegido con la tarjeta del regalo, el nombre de quien regala y los tres
   botones («Vale, empiezo» / «Mejor otro día» / «¿Quién eres?»). Hoy: la plantilla `regalo_entrega`
   y la bienvenida `BIEN` del banco V3 (CONTRATO «Gift card»).
2. Recordatorio a los 3 días con la misma pregunta; aviso a quien regala a los 10 (email y WhatsApp si
   lo dio); a los 30, elegir cerrar o esperar. Hoy: `alerta_silencio` y los hitos `silencio`.
3. «Mandárselo yo con mi nombre» desde el panel (plantilla nueva; la web solo pondría una marca).
4. «Cambiar la primera pregunta» / «Cambiarla» en V3.
5. «Él dice que no» antes de contestar: no volver a escribir, avisar a quien regala.
6. Número sin WhatsApp: detectar entrega fallida, avisar, mover la fecha de inicio.
7. Viaje: 22:00 hora local del destino del día; «¿Ya estáis en casa?»; cierre automático a los 3 días.
8. Narrador al final: mensaje de cierre, repaso de su historia, aviso del día que llega su libro.
9. Los emails 1–7 del recorrido (los manda el entrevistador o la fábrica, con el diseño de `Emails`).

## 4. Migraciones a acordar con el socio (si se aprueban las opciones que las necesitan)

| Si se aprueba… | Haría falta… |
|---|---|
| B2 (b) pago antes de datos | Estado `narradores.estado = 'datos_pendientes'` (o pedido sin narrador) + transición al completar; recordatorio por email; cambio en `confirmarPago`. |
| B8 web pausa | Transición `activo → pausado` también por la web (CONTRATO). |
| B12 rasca | Tabla de emails captados (o Resend Audiences, sin migración) + cupones en Stripe/MP. |
| B18 dos hermanos | Columna/estado de «petición de unión» en `invitados`, reembolso parcial en `pedidos`. |
| B19 cancelar con devolución | `pedidos.estado = 'reembolsado'` (POR COMPROBAR si existe) + llamada a Stripe/MP. |
| Cambiar la fecha de inicio desde el panel | **No necesita migración**: `regalos.fecha_entrega` ya la escribe la web; falta un endpoint `PATCH` (solo hasta la víspera y solo si `usado_at` es null). Avisar igualmente al socio porque el entrevistador la lee cada 15 min. |
| Dirección de envío desde el panel | No necesita migración (`entregas`, `/api/entrega` existen). |

## Apuntado en fase 1

### Mails de la web (tarea `mails`)

- **Mails en catalán para quien compra (D2).** Los textos ya están en `web/src/lib/mail-textos.ts`
  (es / ca / ar) y `armarMailAcceso` / `armarMailRegalo` / `enviarMail*` aceptan `idioma`, pero hoy
  nadie se lo pasa: el idioma sale de `familias.region` (ES → es, AR o sin región → ar), y la base no
  guarda en qué idioma compró cada uno. Dos caminos (decide Naza; el primero, con el socio):
  1. **Guardarlo en la base**: columna `familias.idioma` (`es` / `ca` / `ar`) → migración a acordar
     con el socio.
  2. **Sin migración, en `pedidos.extras`** (jsonb, ya existe): el checkout (`/api/compra`, que hoy
     arma `extras` con `productosParaPedido`) agrega `idioma_web: "ca"` cuando la compra viene de
     `/ca/...`, y `confirmarPago` (`web/src/lib/confirmar-pago.ts`, que ya lee `extras` en el paso 0)
     se lo pasa a `enviarMailAcceso` / `enviarMailRegalo` como `idioma`. No toca ninguna tabla, pero
     `extras` está descrito en `supabase/CONTRATO.md`: hay que anotarlo ahí y avisar al socio. Es lo
     más simple: el mail sale en la vuelta del pago o en el webhook, los dos pasan por `confirmarPago`.
     **No lo implementé**: el checkout lo está tocando otro agente.
  - La metadata del pago **no sirve sola**: Stripe guarda `metadata` (hoy solo `pedido_id`,
    `lib/pagos.ts`) y Mercado Pago `external_reference`, pero `confirmarPago` no recibe el objeto del
    pago (lo llaman el webhook de Stripe, el de MP y `/api/pago/vuelta` solo con `pedidoId`); habría
    que pasar el idioma por tres llamadores distintos, y MP no tiene catalán (Argentina). `extras` es
    un solo lugar.
- **El mail no tiene los datos de la maqueta**: nº de pedido, nombre de quien compra («Ya está,
  Laura»), fecha de inicio del regalo y el ticket con importes (`Email`). `confirmarPago` solo le pasa
  el correo, cómo le dicen, el código del regalo y la región. Para mostrarlos habría que leer
  `pedidos` (id/importe, `extras` → `productosDelPedido`) y `regalos.fecha_entrega` en `confirmarPago`
  y pasarlos al mail. Sin migración. La fecha solo sirve si hay entrega programada (si no, empieza
  cuando escanea la tarjeta). Lo dejo para cuando se cierre el checkout.
- **«Para mí» en el mail de acceso**: el asunto «Listo. Hoy le escribimos a tu {como}.» no distingue
  `vinculoComprador = "yo mismo"`. Ya pasaba antes del rediseño; falta texto en primera persona.
- **El logo del mail** es `web/public/mail/vitacora-logo.png` (88×56, las elipses de la marca sobre
  negro). Se pide a `URL_BASE`: hasta que el rediseño esté publicado en producción, el mail lleva el
  hueco del logo (alt vacío, no se rompe nada).
- **Gmail móvil real**: las capturas son de Chrome. Antes del switch, mandar uno de prueba con Resend
  a una casilla propia y mirarlo en Gmail (Android/iOS, claro y oscuro) y en Outlook (fase 3,
  «Terminado cuando»).
