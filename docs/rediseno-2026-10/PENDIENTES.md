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

### Checkout (`/comprar`, `/comprar/viaje`, `/regalar`, «Pedido confirmado»)

| # | Qué | Por qué no se hizo / cómo quedó | Quién |
|---|---|---|---|
| F1-C1 | **«Tu WhatsApp (opcional)» de quien paga** (maqueta, paso Pago: «Te avisamos por aquí cuando conteste»). | `familias` no tiene columna de teléfono y nadie avisa por WhatsApp a quien compra (sería una promesa sin respaldo, D4). No se muestra. Haría falta columna + plantilla del entrevistador. | Socio + Naza |
| F1-C2 | **La dirección del impreso se pide en el checkout pero se guarda después de pagar.** | Sin migración no hay dónde guardarla antes del pago (la fila de `entregas` nace en `confirmarPago`). Se guarda en `sessionStorage` y «Pedido confirmado» la escribe con `PATCH /api/entrega` usando la sesión que abre la vuelta del pago. Si la vuelta cae en la pantalla de respaldo (sin sesión) o se cierra la pestaña, se pierde y el panel la vuelve a pedir («Falta la dirección de envío»), como hoy. Para hacerlo firme: guardar la dirección con el pedido (columna o clave en `pedidos.extras` + copia en `confirmarPago`) → CONTRATO. | Naza (+ Socio por CONTRATO) |
| F1-C3 | **Métodos de pago a la vista** (Apple Pay, Google Pay, PayPal, Bizum de la maqueta). | Se paga en la página de Stripe/Mercado Pago; los botones de la maqueta no harían nada. Se dice «Pagas con tarjeta en la página segura de Stripe» / «Pagás en la página segura de Mercado Pago». POR COMPROBAR en el panel de Stripe qué billeteras están activas (Bizum, Apple/Google Pay) antes de nombrarlas. | Naza |
| F1-C4 | **El aviso de pago fallido sale también al cancelar en Stripe.** | `cancel_url` no distingue «el banco rechazó» de «la persona volvió atrás»: el texto aprobado de `Casos` 2 («Tu banco no ha aceptado el pago») se muestra en los dos casos. «No se te ha cobrado nada» es cierto siempre. Si Naza prefiere, un texto neutro para la cancelación. | Naza |
| F1-C5 | **Cuándo empieza un regalo.** La maqueta dice «El libro de Osvaldo empieza el 24 de diciembre». | Hoy el regalo empieza cuando el narrador escanea la tarjeta (o le llega el día elegido si se eligió mandárselo). «Pedido confirmado» dice «Ya está. El libro de X está en marcha» y «Cuando X la escanee, empieza su entrevista». Quick picks de la maqueta «Día del Padre / de la Madre / Su cumpleaños»: no se hicieron (fechas distintas por país); queda «Navidad · 24 dic» y «Otra fecha». | Naza |
| F1-C6 | **«Para mí»: «¿Cuándo empezamos? Hoy / Mañana / Elegir fecha».** | No existe fecha de inicio para un narrador que no es regalo (empieza al confirmar el pago). No se muestra. | Socio (si se quiere) |
| F1-C7 | **Precios del impreso en `.env.local`.** | El `.env.local` de la máquina de Naza tiene `PRECIO_IMPRESO_COLOR_*`/`_BN_*` (nombres viejos) y no `PRECIO_IMPRESO_EUR/ARS`: en local el impreso no aparece. Las capturas se sacaron con `PRECIO_IMPRESO_EUR=50`, `PRECIO_IMPRESO_ARS=90000`, `PRECIO_VIAJE_*` puestos solo para el build local. POR COMPROBAR que Vercel tenga los nombres nuevos. | Naza |
| F1-C8 | **/regalar tras pago fallido no restaura los campos** (sí avisa y sí retoma el mismo regalo con `vitacora-regalo-pendiente`). | El audio grabado no se puede guardar en `sessionStorage`; los demás campos se podrían. Pendiente menor. | — |
| F1-C9 | **Compra de extras desde el panel (Encargar libro)**: si se cancela en la pasarela, sigue volviendo a `/comprar` (como antes). | No es de esta tarea; con `crearCheckout(…, origen)` se puede hacer volver al panel. | — |
| F1-C10 | **Zonas horarias del viaje** (`lib/horario.ts` `ZONAS`) están en castellano también en `/ca/comprar/viaje`. | Viven en `lib/`; traducirlas = mover a un diccionario. | — |

### Portada y /ejemplo (tarea `portada`)

Ninguna necesita migración. Son decisiones o datos que faltan:

| # | Qué | Mientras tanto | Quién |
|---|---|---|---|
| P1 | **Audio de muestra de «Su voz»** en la portada: no hay ningún audio de demo legítimo en el repo. | La onda se muestra quieta, sin botón de play. Si se carga `NEXT_PUBLIC_URL_FRAGMENTO_AUDIO` (un mp3 con permiso), sale el reproductor de verdad. En `/ejemplo` la onda queda quieta siempre (es Osvaldo, inventado). | Naza |
| P2 | **Tamaño del marco** («13 × 18 cm» en la maqueta): no está en `productos.ts` ni en ningún sitio del código. | Se quitó la medida: «Un marco negro pequeño…». | Naza / imprenta |
| P3 | **Quiénes somos**: la sección no se renderiza (huecos lilas). Hace falta texto de los socios, foto real, ciudad y contacto. | Fuera de la portada. | Naza y socio |
| P4 | **Vídeo de Viaje** (`16cc5b84…mp4`): no se usa todavía (la portada solo enlaza a `/viaje`, que es de la fase 4). | Sin vídeo de Viaje. | — |
| P5 | **Rendimiento de la portada**: el objetivo LCP < 2,0 s (Lighthouse móvil simulado) no se cumple en local (≈ 3,5–4,1 s; CLS 0). Lo que pesa en el camino crítico: 5 woff2 (~211 kB, las itálicas de Playfair y Source Serif cuentan ~88 kB), ~150 kB de JS de Next y el HTML de 180 kB sin comprimir (27 kB gz). Además, en esta máquina Lighthouse ve el primer pintado a ~1,3 s en las páginas largas con letras de marca (también en `/viaje` y a veces en `/ejemplo`), sin CPU ni red ocupadas: medir en la preview de Vercel antes de decidir. Opciones: quitar las itálicas de la portada (diseño), subir el presupuesto, o cargar Archivo solo donde se usa. | Medido y anotado; no se recortó diseño. | Naza |
| P5b | **Rendimiento de la portada, segunda vuelta (velocidad)**: hecho `prefetch={false}` en los enlaces públicos (JS 221 → 147 kB), cursiva de Playfair y de Source Serif fuera de la primera maquetación, vídeo tras el `load` y el segundo 3, `fetchPriority` alto en el póster. Local (Lighthouse móvil simulado, mediana de 3): `/` LCP 4,2 → 3,3 s, FCP 2,4 → 1,8 s. **No llega a < 2,0 s sin tocar el diseño**: (a) el piso de la simulación es LCP ≈ FCP + 1,3 s en cualquier página de Next (`/legal/terminos`, sin letras de marca ni imágenes: FCP 0,9 s, LCP 2,2 s; el JS es todo el de Next, ~138 kB); (b) las 3 letras que de verdad se ven arriba (Playfair, Archivo, Source Serif: 125 kB) cuestan ~0,75 s de FCP y de LCP (sin ellas, `/` da FCP 1,07 s / LCP 2,5 s); precargarlas (`preload: true`) baja el FCP a 0,96 s pero SUBE el LCP (compiten con el póster). Lo único que lo baja es **no pedir las letras de marca hasta después del `load`** (la página pinta primero con la letra de reserva, ya ajustada de tamaño, y cambia a la de marca ~0,3–0,6 s después): estimado LCP ≈ 2,5 s, no 2,0. Es un cambio que se ve (un cambio de letra al cargar), por eso queda para Naza. Otras opciones: letra de sistema en el cuerpo (cambia el diseño) o subir el presupuesto a LCP < 2,5 s. CLS: `/ca` a veces 0,03 por el titular al cambiar de letra (bajo el 0,05). | Hecho lo que no cambia el diseño; medir en la preview de Vercel (el piso allí incluye la latencia de red). | Naza |
| P6 | Las rutas `/ca/comprar`, `/ar/comprar`, `/ca/regalar`, `/ar/regalar` las hacen otras tareas: hasta que existan, esos enlaces de la portada y `/ejemplo` dan 404. `/viaje` existe en una sola versión (la solapa «De viaje» lleva ahí desde las tres). `/entrar` y `/legal/*` también son una sola versión. | — | fase 1 (checkout, regalar), fase 4–5 |
| P7 | **Fotos generadas** (B10) usadas en la preview: padre e hijo en el sofá, abuelo con la tarjeta, pareja en Lisboa, marco en el aparador, Osvaldo (portada, contraportada, guitarra). Ninguna se presenta como familia real; la foto de Kids no se usa. | Ilustración en la preview. | Naza |

## Apuntado en fase 2 (panel)

Ninguna se hizo: o necesitan base, o son decisiones. El panel funciona sin ellas.

| # | Qué | Mientras tanto | Quién |
|---|---|---|---|
| F2-1 | **Panel en catalán.** La base no guarda en qué idioma compró cada familia (lo mismo que los mails de fase 1: `familias.idioma` o `pedidos.extras.idioma_web`). Hoy el panel habla por `familias.region`: ES de tú, AR de vos. Los textos nuevos ya van en un diccionario (`_textos/panel.ts`) con `es`/`ar`; sumar `ca` es una entrada más, pero las ~40 pantallas viejas del panel siguen con el texto escrito en el componente. | es / ar. | Naza (+ socio si es columna) |
| F2-2 | **El viaje sigue en vos en España** («estás acá», «Elegí dos o tres», «Corré la salida», «Salís el…»): `viaje.tsx`, `angulos.tsx`, `etapas.tsx` no reciben el trato. Ya pasaba antes del rediseño (`tu-espana-panel` lo deja afuera a propósito). | Sin tocar. | — |
| F2-3 | **«Su WhatsApp: pedirlo si falta».** En un regalo sin abrir no hay teléfono hasta que el narrador escribe con su código (CONTRATO, Gift card: lo pone el entrevistador). La web no tiene dónde guardarlo ni endpoint. | La hoja explica por qué no está y lleva a la tarjeta. | Socio |
| F2-4 | **Precios en «Tu pedido»** (49 € / +50 €, maqueta). `pedidos` no guarda los importes por línea en un formato que el panel lea hoy (el ticket está en Stripe/MP). Se podrían recalcular con `catalogo(region)` pero podrían no coincidir con lo cobrado (promo, cambios de precio). | Las líneas, sin cifras. | Naza |
| F2-5 | **Lo que la maqueta tiene y no existe**: cambiar la fecha de inicio de un regalo (hace falta un endpoint sobre `regalos.fecha_entrega`, sin migración), «Su pregunta pendiente» con «Cambiarla» (V3 no tiene guion editable), «Así le va a llegar» y «Cambiar la primera pregunta», «Mandárselo yo con mi nombre» (plantilla de WhatsApp). | No se muestran. | Socio / Naza |
| F2-6 | **Pausar y cancelar** siguen siendo a mano (B8, B19): las hojas abren WhatsApp (`NEXT_PUBLIC_WHATSAPP_DUDAS`) o un correo a hola@. Si se quiere que la web lo haga, cambia el CONTRATO. | Contacto. | Los dos |
| F2-7 | **Miniaturas de verdad para las fotos** (RENDIMIENTO 3.17): `/api/fotos/[id]` redirige a la foto original firmada; las miniaturas de 80 px del lateral bajan la foto entera (100–300 kB cada una). Supabase tiene transformación de imágenes (plan Pro) o se puede guardar una miniatura al subir. Hecho: la redirección se guarda un día en el navegador (`private, max-age=86400`) y la firma dura dos. | Fotos enteras, cacheadas. | Naza (plan de Supabase) |
| F2-8 | **Muestra del panel** (`/panel-muestra/...`): existe para mirar el diseño sin sesión; da 404 con `VERCEL_ENV=production`. Ojo: el `.env.local` bajado de Vercel trae `VERCEL_ENV=production`, así que en local hay que arrancar con `VERCEL_ENV=development`. Borrarla antes del switch si Naza prefiere. | — | Naza |
| F2-9 | **LCP de la muestra** (Lighthouse móvil simulado, local): 3,9–4,3 s, CLS 0, TBT 100–330 ms. El LCP es el titular: el mismo piso de las letras de marca que en la portada (P5b). Medir en la preview con una cuenta real. | — | — |

## Apuntado en fase 5 (legales)

- **Garantía en legales PENDIENTE DE REVISIÓN DEL ABOGADO** (D1): sección «La garantía de cada libro» en términos §7 y en desistimiento, con el texto exacto del checkout. Choca con «menos de diez respuestas → devolución» (términos §8) y con el desistimiento proporcional de España: lo decide el abogado con Naza. Detalle en `fase-5/para-el-abogado.md` §1.
- **Cookies sin banner** (B26 sigue abierto): revisado el 14/10, la web solo usa `sb-…` (sesión de Supabase, solo en /entrar, /tablero, /admin), `tema` (panel), `idioma` (selector, 1 año) y `sessionStorage` del checkout. Ninguna de publicidad ni analítica: técnicas o de personalización pedida por el usuario (art. 22.2 LSSI-CE), sin banner. Que lo confirme el abogado (¿`idioma` de 1 año exenta?, ¿tabla de cookies en privacidad §12?). Si entra el píxel de Meta: banner, página de cookies y consentimiento previo.
- **Catalán de los legales**: traducción PENDIENTE REVISIÓN NATIVA Y ABOGADO; confirmar qué textos legales deben ir en catalán obligatoriamente (D2).
- **Términos sin Viaje ni «Para mí»**: la §2 solo describe el libro de otra persona. Lo redacta el abogado.
- **Enlace «términos» del checkout y de /regalar** siempre a `/legal/terminos` aunque se compre en /ca o /ar: pasar a `ruta(idioma, "/legal/terminos")` en la fase del checkout.
- **Catalán, FAQ vs checkout**: «et tornem» / «et retornem» els diners; elegir uno.
- **Fecha de los legales** (`_textos/legal.ts` `fecha`): 14/10/2026 provisoria; poner la de publicación.
- `web/src/app/legal/ui.tsx` (piezas de la maqueta vieja) queda sin uso: no se borró por la regla de no borrar funciones exportadas; se puede quitar cuando Naza diga.

## Apuntado en fase 3 (mails, 404, enlaces caducados)

| # | Qué | Por qué no se hizo / cómo quedó | Quién |
|---|---|---|---|
| F3-1 | **«Tu pedido sigue guardado» tras un pago fallido** (`Casos` 2: un único mail a la hora si abandona). | **No se implementó: hoy no hay un disparador limpio sin infraestructura nueva.** Lo que existe: (a) el webhook de Stripe solo escucha `checkout.session.completed`; (b) el de Mercado Pago solo confirma pagos aprobados (un rechazo se registra y se ignora) y MP no avisa de un abandono; (c) la vuelta `?pago=fallido` llega con la persona en la página, que ya ve el aviso y lo que eligió (no tiene sentido mandarle un mail en ese momento). Lo que haría falta: **Stripe**: activar el evento `checkout.session.expired` en el endpoint del panel de Stripe, crear la sesión con `expires_at` a 1 hora (hoy dura 24 h: cambia cuánto tiempo tiene para pagar) y, en el webhook, mandar el mail solo si el pedido sigue `pendiente`, si ese narrador sigue en `pendiente_pago` y si la familia no pagó otro pedido después (si no, le llega a quien ya pagó por un reintento). Para que el mail «retome» de verdad hace falta un enlace: lo elegido vive en el `sessionStorage` del navegador, no sirve desde el correo de otro dispositivo; o se guarda el carrito en el pedido (ya está en `pedidos.extras`, sin migración) y una ruta `/comprar/retomar/<token>` lo vuelve a armar, o se usa la recuperación de Stripe (`after_expiration.recovery`, que exige consentimiento de comunicaciones comerciales en el checkout). Para no mandar dos veces: marcar `extras.aviso_guardado_at` (CONTRATO). **Mercado Pago**: no hay evento de abandono; haría falta un cron (p. ej. cada 15 min: pedidos `pendiente` de más de 1 h sin aviso) → infraestructura nueva. **Legal**: un mail de carrito abandonado a quien no aceptó comunicaciones puede contar como comercial (LSSI en España): consultarlo con el abogado. | Naza (+ socio por CONTRATO, abogado) |
| F3-2 | **El 404 de la raíz va en castellano neutro.** | La ruta que no existe no trae idioma; leer cookie o cabecera la haría dinámica. Los textos no tienen tú ni vos, y «/» y «/comprar» ya mandan a `/ar` a quien llega de fuera de Europa. Lo que cae bajo `/ca/...` o `/ar/...` tiene su 404 en su idioma (`app/{ca,ar}/[...resto]` + `not-found.tsx`; esas dos rutas salen ƒ en el build porque se resuelven al pedirlas). | — |
| F3-3 | **Qué enlaces «caducan» de verdad.** | Los tokens de `/libro/[token]`, `/voz/[token]` y `/anticipo/[token]` **no vencen** (JWT sin expiración): solo fallan si están mal copiados o firmados con otra clave; `/regalo/[codigo]` falla si el código no existe o el pago no entró. Ahora muestran «Este enlace ya no sirve» / «No encontramos este regalo» (siguen siendo 404, salvo el anticipo que ya respondía 200), con salida a escribirnos (WhatsApp de dudas o `hola@`) y a entrar. Los que sí vencen: el **código de 6 dígitos** de `/entrar` (Supabase; «Pedir otro código» ahora lo reenvía al mismo correo sin volver a escribirlo), el token de **vuelta del pago** (1 h; si falla cae en «Pedido confirmado» de respaldo, como antes) y el de **fotos / retomar** (1 h; la API contesta 403 o nace un regalo nuevo: no lo ve nadie como enlace). La validación no cambió. | — |
| F3-4 | **/entrar sigue con el diseño viejo** (zinc, blanco). | Solo se cambió el reenvío del código. Re-vestirlo es de otra tarea (B6, maqueta `Entrar`). | Naza |
| F3-5 | **La invitación ya no dice «Un biógrafo está escribiendo el libro…»**. | Era el texto del 06/10, pero promete que se escribe mientras cuenta (D4). Ahora: «{N} está contando su vida con audios de WhatsApp. Cuando termine, un biógrafo va a escribir su libro.» Para aprobar en `fase-3/textos.md`. | Naza |
| F3-6 | **Gmail móvil real** de los tres mails de la web. | Las capturas son de Chrome. Sigue pendiente mandar uno de prueba con Resend a una casilla propia antes del switch (no se mandó ningún mail real). | Naza |
| F3-7 | **La invitación en catalán** no sale todavía: igual que acceso y regalo, el idioma sale de `familias.region` (ES → es, resto → ar). Está lista en el diccionario. | Ver «Mails en catalán» de la fase 1. | Naza (+ socio) |
