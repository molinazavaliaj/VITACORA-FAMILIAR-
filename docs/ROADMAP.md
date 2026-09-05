# ROADMAP — Lanzamiento 1 de octubre de 2026

> **Documento vivo.** Es la fuente de verdad de QUÉ sigue y QUIÉN lo hace.
> Acordado por los dos socios el 2026-09-04. Al completar una tarea, marcala acá.
>
> - **[J]** = Joaquín (socio 1, Argentina) — `entrevistador/`, marca, contenido, legales, cobro AR
> - **[N]** = Naza (socio 2, Barcelona) — `web/`, `fabrica/`, Meta/Facebook, infra
> - **[A]** = Ambos
>
> Fuentes relacionadas: `ESTADO.md` (estado técnico) · `GASTOS.md` (plata) ·
> `supabase/CONTRATO.md` (contrato de datos) ·
> `docs/superpowers/specs/2026-09-05-marca-y-pilares-comunicacion-design.md` (marca) ·
> `docs/identidad-del-libro-checklist.md` (libro) · Notion (contenido, decisiones).

---

## 🎯 Qué significa "lanzado el 1 de octubre"

**No** es vender a desconocidos con ads corriendo. Es tener la prueba de que el producto
existe, funciona y emociona:

- [ ] `vitacorafamiliar.com` vivo, con web y páginas legales
- [ ] Marca definida y aplicada (libro, web, redes)
- [ ] **Al menos 1 libro real terminado**, de un abuelo real — la pieza de venta
- [ ] 2 pilotos reales corriendo o terminados
- [ ] Checkout de Mercado Pago funcionando (Argentina)
- [ ] Presencia real en redes
- [ ] Solicitud de marca presentada en INPI

**Mercado de lanzamiento: Argentina.** España queda diferida hasta resolver el cobro
(Stripe no opera con empresas argentinas; hace falta entidad europea o un merchant of
record tipo Paddle/Lemon Squeezy). Decisión del 2026-09-04.

---

## 🔴 CAMINO CRÍTICO — lo único que no puede atrasarse

    WhatsApp funcionando ............ 12 de septiembre   ← fecha límite dura
    Piloto arranca .................. 13-15 de septiembre
    30 respuestas (modo rápido) ..... 7-10 días
    Libro generado y revisado ....... 25-28 de septiembre

Si WhatsApp no está vivo el 12, **no hay libro real el 1 de octubre**. Todo lo demás
tiene margen; esto no.

### El conflicto a resolver esta semana

El proceso correcto de Meta pide crear la Página y **esperar 7-14 días** antes de conectar
activos comerciales. Eso choca con la fecha límite. **Solución: dos vías en paralelo.**

| Vía | Para qué | Necesita verificación | Cuándo |
|---|---|---|---|
| **Rápida** — app + número de prueba en un portfolio que Naza YA tenga | Los 2 pilotos (5 destinatarios alcanzan) | **No** | Esta semana |
| **Limpia** — Página nueva → esperar → portfolio "Vitácora Familiar" → verificación | Producción, número propio, ads | Sí | Todo septiembre |

> **❓ PREGUNTA ABIERTA PARA NAZA:** ¿ya tenés un portfolio comercial en Meta con algo de
> antigüedad? Si sí, la vía rápida arranca ya. Si no, evaluamos crear uno desde tu cuenta
> (riesgo bajo: tu cuenta tiene historial real).

### Contexto: por qué Naza maneja Meta

La cuenta de Facebook de Joaquín fue **deshabilitada permanentemente** el 2026-09-04
(apelación rechazada, sin posibilidad de otra revisión). Causa: era una cuenta creada el
día anterior que inmediatamente creó portfolios + app de desarrollador + WhatsApp Business.
El filtro automático de integridad de Meta lo leyó como cuenta falsa.

**Regla acordada: Joaquín no toca Facebook con ninguna cuenta.** Meta vincula por
dispositivo, IP y navegador; usar su cuenta personal desde el mismo equipo arriesga
perderla también, sin ganar nada. Instagram y TikTok los sigue manejando él.

**Buena noticia:** ser monotributista **sirve** para la verificación de negocio (constancia
de AFIP + comprobante de domicilio + dominio propio). El problema nunca fue la situación
fiscal, fue la cuenta de Facebook nueva.

---

## ⚖️ A RESOLVER ENTRE LOS SOCIOS

El roadmap (Joaquín, 04/09) y el spec de marca (Naza, 05/09) se escribieron en paralelo sin
verse. Resuelto y pendiente:

### 1. Mercado de lanzamiento: LOS DOS ✅ acordado

Vamos a España **y** Argentina, como decía el spec original. Pero hay un bloqueante:
**Stripe no opera con empresas argentinas**, así que con el monotributo de Joaquín no se le
puede cobrar a un español.

> **❓ NAZA: chequeá si podés darte de alta como autónomo en España y abrir Stripe, y
> confirmalo.** Si podés, España queda destrabada a 49€. Si no, España espera a un
> merchant of record (Paddle / Lemon Squeezy) y arranca solo Argentina a ~ARS 65.000.

### 2. Los textos se definen ENTRE LOS DOS ✅ acordado

No los aprueba uno solo. **Hace falta una sesión dedicada** para definir el tono, los
ángulos y quién escribe qué. Hasta esa sesión no se publica copy.

### 3. Roles: ambos responsables por ahora ✅ acordado

No hay dueños de área definidos todavía. Se construye en conjunto y los roles se van
definiendo a medida que avanza. El Instagram lo operan los dos.

### 4. La identidad de marca: falta la pasada conjunta

El spec de marca del 05/09 es una propuesta muy avanzada de Naza: nombre, frase de la casa,
paleta, tipografías, pilares de comunicación y relevamiento de competencia. Buen material y
mucho terreno ganado.

Como todavía no hay roles definidos, cada uno avanza donde puede y después se revisa junto
— es el modo de trabajo acordado y funciona. Lo que falta acá es esa pasada conjunta.

**Acordado hoy: el nombre, Vitácora Familiar.** El resto (slogan, logo, paleta,
tipografías, pilares, buyer personas) se cierra en la sesión de branding, con el spec de
Naza como insumo principal. Dato práctico para esa sesión: la paleta y las tipografías ya
están implementadas en la plantilla del libro, así que cambiarlas tiene costo de trabajo —
se decide con eso a la vista.

---

## FRENTE 1 — WhatsApp / Meta

| # | Tarea | Quién | Estado |
|---|---|---|---|
| 1.1 | Apelar una última vez desde el perfil bloqueado, cerrar sesión, borrar cookies de facebook.com, no volver a tocarlo | **J** | ☐ |
| 1.2 | Confirmar si existe un portfolio comercial previo (define la vía rápida) | **N** | ☐ |
| 1.3 | **VÍA RÁPIDA:** crear app + WABA de prueba, pasarle a Joaquín `WA_TOKEN` y `WA_PHONE_NUMBER_ID` | **N** | ☐ |
| 1.4 | Cargar en la lista de permitidos (máx. 5): Naza, Joaquín (+541178174942), y los narradores piloto | **N** | ☐ |
| 1.5 | Crear las 3 plantillas de `entrevistador/PLANTILLAS.md`, categoría Utility | **N** | ☐ |
| 1.6 | Crear la Página "Vitácora Familiar", completarla al 100%, 5-10 posteos | **N** | ☐ |
| 1.7 | Esperar 7-14 días de historial de la Página | — | ☐ |
| 1.8 | Portfolio "Vitácora Familiar": reclamar la Página, vincular Instagram, **agregar a Joaquín como admin** | **N** | ☐ |
| 1.9 | Conseguir línea telefónica dedicada (sin WhatsApp común activo) | **J** | ☐ |
| 1.10 | Verificación del negocio con documentación de Joaquín | **A** | ☐ post 1-oct |
| 1.11 | Cuenta publicitaria — ⚠️ moneda **ARS**, no se cambia nunca más | **N** | ☐ post 1-oct |
| 1.12 | Producción: número propio, display name, token permanente (System User), webhook a Railway | **A** | ☐ post 1-oct |

### ⚠️ Trampas ya aprendidas (no volver a pisarlas)

- **Idioma de las plantillas: "Español" a secas.** NO "Español (Argentina)" ni "(España)".
  El código manda `language: 'es'`; con `es_AR` Meta responde "template not found".
- **Valores de ejemplo obligatorios** en las variables o rechazan la plantilla:
  - `bienvenida`: {{1}}="Don Osvaldo", {{2}}="su hija Martina"
  - `pregunta_diaria`: {{1}}="Qué historia la del taller de su padre.", {{2}}="¿Cómo era la casa donde pasó su infancia?"
  - `recordatorio`: {{1}}="Don Osvaldo"
- **No crear portfolios nuevos si hay límite:** borrar uno NO libera el cupo hasta 24-48hs.
  Renombrar uno existente es instantáneo.
- **Números argentinos en la lista de permitidos:** probar con y sin el 9. En la prueba del
  2026-09-04 solo tomó `+541178174942` (sin 9), aunque Meta lo normaliza internamente con 9.
- **Cada destinatario confirma con un código de 6 dígitos que le llega por WhatsApp.**
  A cada abuelo piloto hay que llamarlo para que dicte el código. Avisarlo en la introducción.
- **Texto libre fuera de la ventana de 24 hs no se entrega.** Meta acepta la llamada y
  devuelve un id, pero el mensaje nunca llega. Solo plantillas inician conversación.
- `WA_VERIFY_TOKEN` ya está fijado y no cambia: `vitacora-0f5a991473f6c297`

---

## FRENTE 2 — Web y dominio

| # | Tarea | Quién | Estado |
|---|---|---|---|
| 2.1 | Apuntar `vitacorafamiliar.com` a Vercel | **N** | ☐ |
| 2.2 | Verificar el dominio en Resend → destraba los mails de login para cualquiera | **N** | ☐ |
| 2.3 | Completar `/legal/privacidad` + términos — **requisito duro de WhatsApp API** | **N** | ☐ |
| 2.4 | Crear `hola@vitacorafamiliar.com` (un Gmail no sirve para verificar el negocio) | **J** | ☐ |
| 2.5 | Metadatos + Open Graph (que el link se vea bien al compartirlo) | **N** | ☐ |
| 2.6 | Middleware de supabase-ssr (pendiente #1 del triage) | **N** | ☐ |
| 2.7 | Pixel de Meta + Conversions API — ver nota abajo | **N** | ☐ |

### 📊 Nota sobre el pixel — hay que diseñarlo bien o no sirve

El comprador se registra gratis y **paga recién 30+ días después**. Las ventanas de
atribución de Meta son de 7 días. O sea: **la compra cae fuera de la ventana y Meta nunca
sabe que ese anuncio vendió.** El algoritmo queda ciego y el presupuesto se quema.

Tres decisiones:

1. **Optimizar hacia un evento intermedio**, no hacia la compra. El evento objetivo debe ser
   **"el narrador aceptó y empezó"** (día 0-1), que sí entra en la ventana.
2. **Mandar la compra igual por Conversions API** (server-side desde Next.js) con el click id
   original, para cerrar el círculo aunque llegue a los 35 días y ver el ROI real.
3. **Guardar el click id de Meta** (`fbclid` / `fbp` / `fbc`) en la base al registrarse.
   ⚠️ **Es un cambio de esquema → coordinar por `supabase/CONTRATO.md`.**

Sin esto no se puede medir el CAC, y con USD 5 de costo contra ~ARS 65.000 de precio, saber
el CAC es la diferencia entre un negocio y una fuga de plata.

---

## FRENTE 3 — Marca y dirección de arte

**Estado real: solo el NOMBRE está acordado.** Todo lo demás se define en la sesión, entre
los dos socios.

### Orden de la sesión (así, en este orden)

| # | Qué se define | Quién | Estado |
|---|---|---|---|
| 3.1 | **Slogan** | **A** | ☐ |
| 3.2 | **Logo / monograma V·F** | **A** | ☐ |
| 3.3 | **Paleta y tipografías** (revisando lo ya implementado en el libro: qué se conserva, qué se cambia) | **A** | ☐ |
| 3.4 | **Pilares de comunicación** → de ahí salen los ángulos a testear | **A** | ☐ |
| 3.5 | **Buyer personas** — para imaginar y guionar el contenido | **A** | ☐ |
| 3.6 | Ornamento propio, sistema de portada y los 4-5 layouts de página del libro | **A** | ☐ |
| 3.7 | Implementar la dirección ganadora en `fabrica/src/libro/plantilla-html.ts` | **N** | ☐ |
| 3.8 | Aplicar la identidad a la web y a las redes | **A** | ☐ |

**Insumos para la sesión (leer antes, no son decisiones tomadas):**
- `docs/identidad-del-libro-checklist.md` — las dos direcciones candidatas y las refs
- `docs/superpowers/specs/2026-09-05-marca-y-pilares-comunicacion-design.md` — la propuesta
  de Naza: pilares, voz de marca, competencia relevada. Es el punto de partida de la sesión.

**Bloquea:** el logo (3.2) bloquea el registro de marca en INPI. Los pilares (3.4) y las
buyer personas (3.5) bloquean todo el contenido del Frente 7.

---

## FRENTE 4 — Marca registrada (INPI)

Basado en el relevamiento del 2026-09-04 (documento en Drive).

| # | Tarea | Quién | Estado |
|---|---|---|---|
| 4.1 | Contratar Agente de la Propiedad Industrial matriculado | **J** | ☐ |
| 4.2 | Presentar **VITÁCORA FAMILIAR** como marca **mixta** (con logo), clases **41 + 9** | **J** | ☐ |
| 4.3 | ~~`.com` · `.es` · `.com.ar`~~ **ya comprados por Naza (05/09)**. Falta: `bitacorafamiliar.com` y `.com.ar` (con B, defensivos, redirigen a la V) | **J** | ☐ |
| 4.4 | Reservar handles defensivos (Facebook, TikTok, YouTube, y los de B) | **J** | ☐ |

**No intentar registrar "Vitácora" sola:** choca fonéticamente con "BITÁCORA" (clase 41,
registrada 2017) y con "VITÁCORA BY VEST." (clase 41, registrada 2026). El INPI evalúa
similitud **fonética**, y en español V y B suenan igual.

**Sí "Vitácora Familiar" mixta:** no existe ninguna marca idéntica, y el INPI viene
aceptando sistemáticamente el patrón "bitácora + palabra distintiva" (conviven BITÁCORA
SALUD, BITÁCORA CREATIVA, BITÁCORA PÚBLICA... todas en clase 41).

**Depende del logo (3.2).** Argentina es "primero en registrar", no "primero en usar":
la fecha de presentación fija la prioridad. **Presentar apenas haya logo.**

---

## FRENTE 5 — Prueba del producto (arnés)

| # | Tarea | Quién | Estado |
|---|---|---|---|
| 5.1 | Recargar USD 20 de crédito Anthropic (quedan ~USD 3) | **J** | ☐ |
| 5.2 | Construir el arnés que simula WhatsApp y correr un narrador completo | **J** | ☐ |
| 5.3 | Generar el libro de ese narrador con la fábrica | **N** | ☐ |
| 5.4 | Leerlo entre los dos y ajustar prompts si hace falta | **A** | ☐ |

**Qué prueba (nivel 1, respuestas de texto):** las 26 preguntas fijas, los reconocimientos
del cerebro, las repreguntas, las 4 adaptativas, el cierre, y el libro final.
**Qué no prueba todavía:** la transcripción con Whisper (nivel 2, necesita saldo de OpenAI).

Es la única forma de ver la calidad completa **antes** de exponerla a un abuelo real, y
antes de gastar un peso en publicidad.

---

## FRENTE 6 — Pilotos reales

| # | Tarea | Quién | Estado |
|---|---|---|---|
| 6.1 | Conseguir narrador argentino (abuela o padre de Joaquín) y pedirle permiso | **J** | ☐ |
| 6.2 | Narrador español: Pequeña Imma (ya cargada en la base, estado `invitado`) | **N** | ☐ |
| 6.3 | Activar `contexto.modoRapido = true` en ambos | **N** (los registra) | ☐ |
| 6.4 | Acompañar el piloto: llamar si se traba, anotar todo lo que falle | **A** | ☐ |

**Dos pilotos, no uno:** si alguno abandona, no nos quedamos sin la pieza de venta.
Con modo rápido, las 30 preguntas entran en 7-10 días en vez de un mes.

---

## FRENTE 7 — Contenido y redes

| # | Tarea | Quién | Estado |
|---|---|---|---|
| 7.1 | Crear la sección/cuenta **"de prueba"** en TikTok e Instagram Reels | **J** | ☐ |
| 7.2 | Producir y subir reels de prueba testeando **varios ángulos en paralelo** | **J** | ☐ |
| 7.3 | Subir al perfil principal **carruseles explicando el producto** + primer contenido | **J** | ☐ |
| 7.4 | Detectar el ángulo ganador por rendimiento orgánico | **J** | ☐ |
| 7.5 | Promocionar el ganador desde el perfil con pauta para empezar a atraer ventas | **J** | ☐ |
| 7.6 | 5-10 posteos reales para la Página de Facebook | **N** | ☐ |

**La estrategia:** la sección de prueba es el laboratorio (TikTok reparte alcance orgánico
a cuentas nuevas; Instagram casi no). El perfil principal es la vidriera: ahí van los
carruseles que explican el producto y el contenido que le da cuerpo a la página mientras
se testea. Cuando un ángulo gana, se sube al perfil **con pauta**.

⚠️ **La pauta va después del pixel (2.7).** Sin el evento correcto configurado, le enseñás
al algoritmo a buscar curiosos en vez de compradores.

---

## FRENTE 8 — Cobro

| # | Tarea | Quién | Estado |
|---|---|---|---|
| 8.1 | Cuenta de Mercado Pago + credenciales + webhook | **J** | ☐ |
| 8.2 | Configurar `PRECIO_ARS` | **N** | ☐ |
| 8.3 | Prueba de pago en sandbox de punta a punta | **A** | ☐ |
| 8.4 | **Averiguar si Naza puede darse de alta como autónomo en España y abrir Stripe** — reabre el mercado de 49€ | **N** | ☐ **urgente** |
| 8.5 | Si 8.4 es no: evaluar merchant of record (Paddle / Lemon Squeezy) y si paga a Argentina | **J** | ☐ post 1-oct |

**Precio: ~ARS 65.000.** Es lo que sale hoy en Argentina un libro de preguntas que el abuelo
tiene que **llenar a mano**. Mismo precio, producto incomparablemente mejor: responde por
audio de WhatsApp, recibe un libro de editorial, y su voz se escucha por QR/NFC.
Decisión del 2026-09-04.

---

## FRENTE 9 — Cerebro del proyecto

| # | Tarea | Quién | Estado |
|---|---|---|---|
| 9.1 | Cargar en Notion lo avanzado desde la última actualización (gastos, decisiones, estado) | **J** | ☐ |
| 9.2 | Rutina semanal de actualización del Notion | **J** | ☐ |

**Regla de división (acordada):**
- **Notion** = producto, marca, comunicación, contenido, piloto, decisiones
- **Repo** = técnico (código, `ESTADO.md`, `GASTOS.md`, `CONTRATO.md`, este roadmap)
- **Nada duplicado.**

Se descartó sumar Obsidian: partiría el cerebro en dos. La capa de agentes automáticos
queda para después del lanzamiento.

---

## 📅 Calendario

| Semana | Foco | Hitos |
|---|---|---|
| **1** · 5-11 sep | Cimientos | Dominio vivo · legales · Página creada · **arnés corrido** · sesión de marca |
| **2** · 12-18 sep | Destrabar | **WhatsApp vivo (12)** · pilotos arrancan · logo listo · INPI presentado |
| **3** · 19-25 sep | Ejecutar | Pilotos respondiendo · marca aplicada a web y libro · contenido publicándose |
| **4** · 26 sep-1 oct | Cerrar | **Libro real terminado** · checkout andando · lanzamiento suave |

---

## ⚠️ Riesgos

| Riesgo | Mitigación |
|---|---|
| **Meta vuelve a bloquear** | Naza opera con cuenta con historial · vía rápida con portfolio existente · plan C: BSP tipo 360dialog |
| **El piloto no termina las 30 respuestas** | Dos pilotos en paralelo · modo rápido · son familia, se los puede empujar por teléfono |
| **La calidad del libro no emociona** | El arnés esta semana nos lo dice antes de gastar en publicidad |
| **No poder cobrarle a España** | Argentina primero · merchant of record a evaluar después |

---

## 📌 Decisiones tomadas (2026-09-04)

1. **Los dos mercados: España y Argentina.** Pendiente confirmar si Naza puede abrir Stripe
   como autónomo español; si no, España espera a un merchant of record.
2. **Precio Argentina ~ARS 65.000** (a la par del competidor de llenar a mano) · **España 49€**.
3. **"Lanzado" = 1 libro real terminado + web + marca + pilotos**, no ventas a desconocidos.
4. **Joaquín no toca Facebook.** Naza opera todo lo de Meta.
5. **Se factura como monotributista de Joaquín** (sirve para verificar el negocio en Meta).
6. **La marca se registra como VITÁCORA FAMILIAR mixta, clases 41 + 9.**
7. **Notion es el cerebro de negocio; el repo, el técnico.** Sin Obsidian, sin duplicar.
8. **Los agentes automáticos quedan para después del lanzamiento.**
9. **De la marca está acordado el nombre.** Slogan, logo, paleta, pilares y buyer personas
   se cierran en la sesión de branding, partiendo del spec de Naza.
10. **Los textos se definen entre los dos**, en una sesión dedicada.
11. **Roles: ambos responsables.** Cada uno avanza donde puede y se revisa en conjunto; los
    roles se van definiendo a medida que el proyecto avanza.

---

## ❓ Abiertas

- ¿Naza tiene un portfolio comercial previo en Meta? (define la vía rápida — **urgente**)
- ¿Naza puede abrir Stripe como autónomo español? (**destraba España a 49€**) — confirmar
- ¿Quién es el narrador argentino del piloto?
- Sesión de textos y de branding: fecha
- ¿El merchant of record paga a Argentina? (plan B para España)
