# Paso de manos — rediseño de la web de Vitácora (octubre 2026)

> **Primero lee `DECISIONES.md`**: son las decisiones finales de Naza (13/10) y mandan sobre este documento y las maquetas (devoluciones, catalán, Argentina, orden del checkout, promesas que se quitan).

Documento principal para Claude Code. Léelo entero antes de tocar nada. Los demás documentos de
esta carpeta lo completan:

| Archivo | Qué es |
|---|---|
| `RENDIMIENTO.md` | Diagnóstico de velocidad (archivo:línea), arreglos priorizados, objetivos y cómo medir |
| `MOTION.md` | Cómo se anima todo: tokens, patrones, por pantalla, reduced motion |
| `TEXTOS-Y-REGLAS.md` | Reglas de copy, precios y garantías, y lo que es «de ejemplo» y no se publica |
| `PENDIENTES.md` | Decisiones abiertas: bloquean / no bloquean, y quién decide |
| `PRIMER-MENSAJE.md` | Lo que el usuario pega en Claude Code para arrancar |
| `maquetas/` | El diseño aprobado (ver §9) |

Todo lo que no se ha podido verificar en el código está marcado **POR COMPROBAR**.

---

## 1. Contexto en dos minutos

- Monorepo. Esta tarea vive **solo en `web/`** (Next.js 16.3.4 · React 19.2 · Tailwind 4 · Supabase ·
  Stripe para España · Mercado Pago para Argentina · deploy en Vercel). Dueño: Naza (el usuario).
- `entrevistador/` (WhatsApp + IA, Railway) es del socio de Argentina. `fabrica/` (libro y audio)
  es de Naza pero **no se toca en esta tarea**. `supabase/` es compartida: **avisar antes de tocar**
  (`README.md`, regla de oro: «nadie toca la carpeta del otro; los servicios se comunican SOLO por la base»).
- La base de datos es **una sola**, compartida con producción. No hay base de staging.
- El código ya tiene en marcha cosas que las maquetas dan por hechas o no conocen: entrevista
  **V3** por WhatsApp (sin guion de 30 preguntas; `web/src/lib/v3.ts`), escritor V5.5 que escribe
  el libro **cuando el narrador termina** (no capítulo a capítulo), **gift card** con fecha de
  entrega (`/regalar`, `regalos`), región **AR** con pesos y Mercado Pago, panel con fotos, nombres,
  frases, dudas, invitados, viaje, etc.
- Los textos públicos actuales ya pasaron por una ronda de aprobación de Naza el 06/10
  (`docs/web-textos-v3/aprobados.md`). Varias frases de las maquetas **contradicen** esa ronda
  (ver §5 y `TEXTOS-Y-REGLAS.md`). Cuando choquen, **gana la decisión más reciente de Naza**, y si no
  está tomada, se pregunta (está en `PENDIENTES.md`).

## 2. Reglas de oro

1. **Rama nueva, nunca `main`** hasta el switch final (§8). Nombre propuesto: `rediseno-web`.
2. **No tocar** `entrevistador/`, `fabrica/`, `supabase/migrations/`, `supabase/CONTRATO.md`. Si una
   pantalla necesita un campo nuevo en la base, **no se inventa**: se apunta en `PENDIENTES.md`
   como «migración a acordar con el socio» y la pantalla se hace sin ese campo (o se deja el hueco).
3. **No se borra ninguna función del panel ni ninguna ruta** que exista hoy (§4). Lo que la maqueta
   no cubre se **re-viste** con el sistema visual nuevo y se enlaza desde donde toque.
4. **Precios y catálogo salen de `web/src/lib/precios.ts` y `web/src/lib/productos.ts`** (variables
   `PRECIO_*` en Vercel). Nunca un precio escrito a mano en JSX. Los 49/99/+20 € de las maquetas son
   **ejemplos del diseño**, no la fuente de verdad.
5. **Los textos no se inventan.** Se toman de la maqueta, se pasan por `TEXTOS-Y-REGLAS.md`, y lo que
   es de ejemplo (reseñas, personas, IFEMA, pedidos, QR) **no se publica tal cual**.
6. **Tests verdes antes de cada publicación** (`cd web && npm test`). El deploy a producción
   (`.github/workflows/deploy-web.yml`) corre los tests y no despliega si fallan. Los tests fijan
   textos exactos (p. ej. `web/test/portada-trato.test.tsx`): cuando cambie un texto aprobado, se
   actualiza el test con el texto nuevo, no se borra el test.
7. **Rendimiento es un requisito, no un extra**: objetivos en `RENDIMIENTO.md` §4; se mide al cerrar
   cada fase.
8. **Motion solo con `transform` y `opacity`, en CSS**; nada de librerías de animación
   (`MOTION.md`).
9. **Al final de cada fase: parar, publicar la preview y enseñársela al usuario.** No se encadenan
   fases sin su OK.
10. Español de España, de tú (en Viaje, vosotros). Pero la web **sigue vendiendo en Argentina**:
    ver conflicto C1 en §5 antes de escribir un solo texto.

## 3. La rama y cómo se prueba («tu HTML de prueba en internet»)

### 3.1 Cómo se despliega hoy (verificado en `web/README.md` y `.github/workflows/deploy-web.yml`)

- **No hay previews automáticas de Vercel.** El proyecto de Vercel es de Naza (plan Hobby) y el
  repo es del socio, así que Vercel no mira el repo. El deploy lo hace **GitHub Actions** con la CLI:
  en cada push a `main` que toque `web/` → `npm test` → `vercel pull --environment=production` →
  `vercel build --prod` → `vercel deploy --prebuilt --prod`.
- Por eso en el panel de Vercel los deployments no traen rama ni commit.

### 3.2 Qué montar en la fase 0 para tener una URL de prueba

Un segundo workflow, `.github/workflows/preview-web.yml`, que haga lo mismo **sin `--prod`** en cada
push a `rediseno-web`:

```yaml
name: Preview web (rediseño)
on:
  push:
    branches: [rediseno-web]
    paths: ["web/**", ".github/workflows/preview-web.yml"]
  workflow_dispatch:
concurrency: { group: preview-web, cancel-in-progress: true }
jobs:
  preview:
    runs-on: ubuntu-latest
    defaults: { run: { working-directory: web } }
    env:
      VERCEL_ORG_ID: ${{ secrets.VERCEL_ORG_ID }}
      VERCEL_PROJECT_ID: ${{ secrets.VERCEL_PROJECT_ID }}
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: 22, cache: npm, cache-dependency-path: web/package-lock.json }
      - run: npm ci
      - run: npm test
      - run: npm i -g vercel@latest
      - run: vercel pull --yes --environment=preview --token=${{ secrets.VERCEL_TOKEN }}
      - run: vercel build --token=${{ secrets.VERCEL_TOKEN }}
      - name: Deploy (preview) y alias fijo
        run: |
          URL=$(vercel deploy --prebuilt --token=${{ secrets.VERCEL_TOKEN }})
          echo "Preview: $URL"
          vercel alias set "$URL" vitacora-rediseno.vercel.app --token=${{ secrets.VERCEL_TOKEN }}
```

Explicación en llano para el usuario: **cada vez que Claude Code suba cambios a la rama, en unos
3 minutos la web de prueba se actualiza en `https://vitacora-rediseno.vercel.app`** (nombre a
confirmar: si ese subdominio está cogido, se elige otro). Es un sitio real en internet, pero nadie
llega a él salvo quien tenga el enlace; la web de verdad (`www.vitacorafamiliar.com`) no cambia.

Cosas que tiene que hacer **Naza en Vercel** antes (no se pueden hacer desde el código):

1. Variables de entorno del entorno **Preview** (hoy, POR COMPROBAR, puede que solo existan en
   Production): copiar `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`,
   `SUPABASE_SERVICE_ROLE_KEY`, `PRECIO_*`, `RESEND_API_KEY`, `URL_BASE` y las de pago.
   - `URL_BASE` en Preview = `https://vitacora-rediseno.vercel.app` (las vueltas del pago,
     `web/src/lib/pagos.ts:24`, se construyen con ella).
   - **Pagos en Preview con claves de prueba** (`STRIPE_SECRET_KEY` de test; Mercado Pago sandbox) y
     el webhook de Stripe de test apuntando a `https://vitacora-rediseno.vercel.app/api/webhooks/stripe`.
     Así se puede completar una compra entera sin cobrar a nadie.
   - Ojo: **la base de Supabase es la misma que producción**. Una compra de prueba crea familia,
     narrador y pedido reales. Conviene usar un correo de prueba reconocible
     (`prueba+rediseno@…`) y avisar al socio de que van a aparecer narradores de prueba
     (`pendiente_pago` → `invitado`). El entrevistador **sí mira** a los `invitado`: con un
     teléfono real recibiría WhatsApp. Usar un teléfono de los socios o un regalo (sin teléfono).
2. Comprobar en el panel de Vercel la **región de las funciones** y en Supabase la **región del
   proyecto** (ver `RENDIMIENTO.md` §2.4).

### 3.3 Comparar con las maquetas

Abrir en paralelo la preview y `maquetas/html/<Pantalla>.html` (doble clic, se abre en el
navegador; el estado por defecto) o `maquetas/capturas/<Pantalla>.jpg`. Para los estados dinámicos
(pasos del checkout, momentos del panel) leer la clase JS al final de
`maquetas/fuente-dc/<Pantalla>.dc.html` (§9).

## 4. Mapa maqueta → ruta

Leyenda: **N** = nuevo · **A** = se adapta lo que hay · **=** = se queda igual (solo re-vestir con el
sistema visual) · **✗** = no se hace en esta tarea (es del socio o es una pieza de marketing).

### 4.1 Público

| Maqueta (`fuente-dc/`) | Ruta | Tipo | Notas de datos / código |
|---|---|---|---|
| `Main`, `Movil` (portada con vídeo) + `Resto`, `RestoMovil` | `/` → `web/src/app/page.tsx` (757 líneas) + `maquetas.tsx`, `aparece.tsx`, `cta-sticky.tsx`, `link-regalar.tsx`, `selector-producto.tsx`, `marca.tsx` | **A** (reescritura de la página, se conserva la lógica) | Mantener: región por IP (`regionDelRequest`), `POR_TRATO` tú/vos, catálogo y promo (`catalogo()`, `promoPorcentaje()`), `TESTIMONIOS = []` (reseñas apagadas hasta tener reales, `page.tsx:168-171`), `CtaSticky`, sección Viaje con `obtenerPrecioViaje`. Nuevo: vídeo de portada con póster, pestañas Familiar/Kids/Viaje, «Qué recibe cada uno», «Para quién es», FAQ en acordeón, bloque «Quiénes somos» (huecos lilas: no publicar hasta rellenar), marco NFC, WhatsApp de dudas (número POR DECIDIR). Las pestañas **Kids** solo si se decide publicar Kids (C8). |
| `Ejemplo`, `EjemploMovil` (libro hojeable de Osvaldo) | **N** `/ejemplo` | **N** | Estático. Historia inventada: la página lo dice. Hoy existe `/demo/dora` (maqueta estática para el vídeo del marco, `web/src/app/demo/dora/page.tsx`) y `web/public/demo/libro-dora.pdf` (10,5 MB): no reusar ese PDF en la web pública (ver `RENDIMIENTO.md` §2.7). «Pasar página» en CSS (`MOTION.md` patrón 10). |
| `Checkout`, `CheckoutMovil` | `/comprar` → `comprar/page.tsx`, `comprar/formulario.tsx` (559 líneas), `comprar/productos-ui.tsx`, `/api/compra` | **A** | Ver C2 (orden pago/datos) y C3 (marco sin impreso). Se conservan: catálogo por región, `validarCarrito`, `/api/compra`, subida de fotos con `tokenFotos`, `Checkout` arranca con el impreso puesto (Naza 06/10, `formulario.tsx:78`), gift card y «retomar». Los 3 pasos nuevos se mapean sobre los 5 actuales (§6 fase 1). |
| `CheckoutViaje`, `CheckoutViajeMovil` | `/comprar/viaje` → `comprar/viaje/*` | **A** | Mismo cascarón que Checkout. El paso «salida, vuelta, destinos» ya existe en `lib/viaje.ts` / `api/viaje`. La hora 22:00 local y «¿Ya estáis en casa?» son del entrevistador (C11). |
| `CheckoutKids`, `CheckoutKidsMovil` | — | **✗ / N** | Kids no existe en el código (`docs/ROADMAP.md` P5, D27.10: rama `vitacora-kids` sin mergear, sin checkout ni bot). Solo se hace si Naza decide lanzarlo (C8). |
| `Rasca`, `RascaPasos` (popup VITACORA10) | componente en `/` | **N** | Reglas en `canvas.json` nota `popup` (nunca al entrar; a los 25 s o a mitad de página; nunca en landings de anuncio ni checkout; una vez por visitante; 7 días si lo cierra; hoja desde abajo en móvil; no si ya empezó a comprar). **Hoy no hay cupones**: `web/src/lib/promo.ts` solo tiene un porcentaje global `PROMO_PORCENTAJE` (lista tachada). Un código `VITACORA10` que descuente de verdad en Stripe/MP es trabajo nuevo (C6) → fase 4, detrás de una variable. Captura de email = necesita dónde guardarla (Resend Audiences o tabla nueva → migración a acordar). |
| `LandingRegalo`, `LandingPreguntas`, `LandingVoz` | **N** `/regalo-para-tu-padre`, `/lo-que-nunca-le-preguntaste`, `/su-voz` (nombres a confirmar) | **N** | Solo móvil en la maqueta: hacerlas responsive igualmente. Sin popup del rasca. Preguntas de los chats = inventadas: sustituir por las del banco real (POR COMPROBAR cuál es el banco publicable; `docs/viajes-v2/banco.md` es el de viaje; el banco V3 vive en el entrevistador). Fase 4. |
| `LandingKids*` (3), `LandingViaje*` (3) | **N** | **N / ✗** | Viaje: fase 4. Kids: C8. |
| `Kids`, `KidsMovil` | `/kids` | **✗** salvo decisión (C8) | |
| `Viaje`, `ViajeMovil` | `/viaje` → `web/src/app/viaje/page.tsx` | **A** | Hoy está en «vos» (el viajero se compra a sí mismo). Pasar a tú/vosotros por región (C1). Precio: `obtenerPrecioViaje(region)`; sin precio cargado, la página no vende. |
| `SuVoz` | `/voz/[token]` → `web/src/app/voz/[token]/page.tsx` + `api/voz/[token]/*` | **A** | Ya existe (spec 2026-09-20): página pública sin login con el libro online y las frases. Añadir el «primer toque obligatorio» (los móviles no reproducen audio sin gesto), audios por capítulo y compartir. El marco NFC y el QR de la contraportada abren esta URL. |
| `Entrar`, `EntrarMovil` | `/entrar` → `entrar/page.tsx`, `entrar/formulario.tsx` | **A** | Ver C7: hoy es **código de 6 dígitos** (`signInWithOtp` + `verifyOtp`), elegido a propósito porque el enlace exigía el mismo navegador. La maqueta pone el enlace primero y el código como alternativa. Mantener el código como camino principal con el diseño nuevo; el enlace solo si Naza lo pide (y entonces hay que revisar la plantilla de email de Supabase y las Redirect URLs, T3.11). «Recordar el dispositivo 30 días» = duración de la sesión de Supabase (POR COMPROBAR en el panel de Supabase). |
| `Legal`, `LegalMovil` | `/legal/terminos`, `/legal/privacidad`, `/legal/arrepentimiento` → `legal/*` | **A** | Tres rutas existen; «Cookies» es nueva (solo si hay cookies no esenciales: hoy solo la de tema y las de sesión; POR COMPROBAR si se añade Meta Pixel → entonces sí hace falta banner y página). Los textos en lila los redacta un abogado: **no se inventan**. Mantener la ruta `/legal/arrepentimiento` y el enlace «Botón de arrepentimiento» para AR (Res. 424/2020, `page.tsx:741-744`); en ES se puede llamar «Desistimiento». Ojo: `legal/terminos/page.tsx:53-54` dice «una pregunta por día durante unos treinta días» → corregir (C4). |
| `Tarjeta`, `TarjetaKids`, `TarjetaViaje` | `/regalo/[codigo]/tarjeta`, `/regalo/[codigo]/imagen` | **A** | Existe (gift card 08/10): tarjeta imprimible y versión imagen para WhatsApp. Re-vestir. Kids/Viaje: no. |
| `Casos` | 404, enlace caducado, pago fallido | **A / ✗** | 404: añadir `web/src/app/not-found.tsx` (no existe). Pago fallido: la vuelta `cancel_url` va a `/comprar` (`pagos.ts:44,71`): mostrar el aviso «no se te ha cobrado nada» y conservar lo elegido (hoy el carrito vive en estado React: guardarlo en `sessionStorage` como ya hace el regalo con `vitacora-regalo-pendiente`). «Él dice que no», «deja de contestar», «número sin WhatsApp» = entrevistador (C11): la web solo muestra lo que ya existe (`alerta_silencio` → `BannerAlertaSilencio`). |
| `Anuncios`, `AnunciosLineas`, `Paletas` | — | **✗** | Piezas de Meta y paletas: no son web. |

### 4.2 Panel (con sesión)

| Maqueta | Ruta | Tipo | Notas |
|---|---|---|---|
| `Panel`, `PanelMovil` (3 momentos) | `/tablero` (Inicio, `tablero/page.tsx`) y `/tablero/[narradorId]` (`[narradorId]/page.tsx`, 644 líneas) + `tablero/layout.tsx`, `nav.tsx`, `riel.tsx`, `ui.tsx`, `reproductor.tsx`, `tema.tsx` | **A** | El layout actual tiene sidebar + pestañas móvil + tema claro/oscuro (`tema.tsx`, cookie). La maqueta es **solo oscura**: conservar el botón de tema o fijar oscuro (decisión D-11, no bloquea). Los «3 momentos» se mapean sobre `narradores.estado` (`supabase/CONTRATO.md` §Transiciones): *Antes de empezar* = `pendiente_pago`/`regalo_pendiente`/`invitado`/`acepto`; *En marcha* = `activo`/`pausado`; *Libro listo* = `completado`/`cerrado_anticipado` + `libro_aprobado_at`. Hay tres vistas de historia en el código: guion clásico, `HistoriaV3` (`v3.tsx`) y `HistoriaViaje` (`viaje.tsx`): las tres se re-visten, ninguna se tira. |
| — bloque «Su pregunta pendiente» (cambiarla / proponer) | `[narradorId]/preguntas/acciones.tsx` (`AgregarPregunta`, `SugerirPreguntas`, `EditorGuion`) | **A** | En V3 no hay guion editable: la «pregunta pendiente» sale de `entrevistas_v3.estado` (POR COMPROBAR qué campo guarda la pregunta en curso; `lib/v3.ts` lee `charla` y `respuestas`). «Cambiarla» y «Cambiar la primera pregunta» no existen en V3 → C11. «Proponer una pregunta» sí existe (sugeridas). |
| — «Lleva 10 días sin contestar · Mandárselo yo» | `tablero/acciones.tsx` (`BannerAlertaSilencio`, apaga `alerta_silencio`) | **A** | El recordatorio a los 3 días y el aviso a los 10 los manda el entrevistador. «Mandárselo yo con mi nombre» = plantilla nueva de WhatsApp → C11. |
| — «Sus fotos» (portada necesaria para el impreso, foto pequeña, hasta 12 dentro) | `[narradorId]/fotos.tsx`, `libro/fotos-del-libro.tsx`, `libro/encuadrar.tsx`, `lib/medir-imagen.ts`, `/api/fotos` | **A** | Ya existe la foto de tapa/contratapa/marco y la galería por capítulo. El límite actual es `FOTOS_MAXIMO = 20` (`comprar/formulario.tsx:41`); la maqueta dice 12 → D-12. El aviso «foto pequeña para tapa dura» ya existe parcialmente (`medir-imagen.ts`): POR COMPROBAR el umbral. «Sin foto de portada no se manda a imprimir» es regla de la fábrica/entregas, no de la web. |
| — «Su libro, capítulo a capítulo · listo para leer / escribiéndose» | `[narradorId]/leer/page.tsx` | **A con cambio de texto** | **Contradice el escritor V5.5**: el libro se escribe cuando termina de contar (`docs/web-textos-v3/aprobados.md`, regla de Naza). No prometer capítulos «escribiéndose». En «En marcha» mostrar los audios por bloque (lo que ya hace `HistoriaV3`); en «Libro listo», el lector. |
| — «Lo último que contó» (reproductor con onda) | `tablero/reproductor.tsx`, `/api/audio/[respuestaId]` | **A** | Añadir la onda animada (`MOTION.md` patrón 9). |
| — «La familia · Invitar» | `[narradorId]/compartir.tsx`, `/api/invitados` | **=** | Hasta 3 invitados (`lib/panel.ts`). |
| — «Revisa cómo se escriben los nombres» | `[narradorId]/nombres/*`, `/api/nombres` | **=** | Existe para el flujo clásico. En V3 «no hay nombres que revisar» (`docs/handoff-2026-10-09.md` §3). Mostrar solo si hay datos. |
| — «Tu pedido»: ver recibo, cambiar fecha, dirección, pausar/cerrar, cancelar | `[narradorId]/libro/envio.tsx` (dirección), `/api/entrega`, `regalos.fecha_entrega` (`/api/compra`, retomar), `CierreAnticipado` (`tablero/acciones.tsx`, ≥10 respuestas) | **A / N** | **Cambiar dirección**: existe (`entregas`). **Cambiar fecha de inicio**: solo para regalos (`regalos.fecha_entrega`, hasta la víspera: hoy no hay endpoint de edición → endpoint nuevo en la web, sin migración). **Pausar**: la web **no puede** poner `pausado` (CONTRATO: solo el entrevistador) → C10. **Cerrar con lo que hay**: existe como `cerrado_anticipado` con mínimo 10 respuestas (maqueta: sin mínimo explícito) → D-13. **Cancelar y devolver**: no existe (reembolso en Stripe/MP + estado) → C9, fase 2 solo UI detrás de «escríbenos». **Ver recibo**: Stripe `receipt_url` existe en el PaymentIntent; MP no igual → POR COMPROBAR; mientras, «te lo mandamos por email». |
| — «Añadir el marco → +20 €» post-venta | `[narradorId]/libro/extras.tsx`, `/api/extras` | **=** | Existe (`calcularCompra` con `base: null`). Regla marco-solo-con-impreso: C3. |
| `PanelKids*`, `PanelViaje*` | `[narradorId]/viaje.tsx` | **A / ✗** | Viaje: re-vestir `HistoriaViaje`. Kids: C8. |
| `Narrador` (lo que ve él al final: repaso en web) | — | **✗** | Es WhatsApp + una página de repaso para el narrador. La página sería web (`/repaso/[token]`) pero su contenido sale del escritor (fábrica) y el flujo lo dispara el entrevistador. Propuesta, no decidida → `PENDIENTES.md`. No en esta tarea. |
| `Whatsapp` | — | **✗** | Plantillas de Meta: entrevistador. |
| `Email`, `EmailKids`, `EmailViaje`, `Emails` (7) | `web/src/lib/mail.ts` (`enviarMailAcceso`, `enviarMailRegalo`, `enviarMailInvitacion`), `lib/regalo-textos.ts` | **A** (solo los de la web) | De los 7 del recorrido, **la web manda hoy**: acceso tras el pago (= «confirmación»), tarjeta del regalo, invitación. Los demás (falta WhatsApp, primera respuesta, anticipo, nombres, falta foto, enviado, reseña) los mandan el entrevistador o la fábrica (`docs/handoff-2026-10-09.md` §3) → se les pasa el diseño HTML como referencia, **no se implementan aquí**. Ver C5 (anticipo). |
| `Familias`, `MasFlujos` | — | **✗ / parcial** | «Dos hermanos para el mismo padre» (unirse con permiso, devolver el pago): nuevo y toca `pedidos`/`invitados` → PENDIENTES. «Más ejemplares»: existe la compra de copias desde el panel (`extras.tsx`, `copia`) y el link público para que un primo compre la suya (`/libro/[token]`): re-vestir. Envío internacional: POR DECIDIR con la imprenta. «Para mí»: existe (`vinculoComprador === "yo mismo"`, `esPropia`). Femenino («ella»): el checkout ya pide `genero` (`GENEROS`, `regalo-reglas.ts`); los textos del panel con «él/su» hay que pasarlos por `genero` (fase 2). |

### 4.3 Rutas que existen y la maqueta no menciona (se quedan, se re-visten)

`/registro` (redirige a `/comprar`), `/comprar/gracias` (respaldo post-pago), `/anticipo/[token]`,
`/libro/[token]` y `/libro/[token]/guardar`, `/regalo/[codigo]` (+ `audio`), `/tablero/cuenta`,
`/tablero/[narradorId]/{dudas,frases,nombres,preguntas,libro,leer,regalo}`, `/admin/*` (panel de la
empresa: **no se toca**, tiene su propio `ui.tsx`), todas las `/api/*`, `/api/auth/*`.

## 5. Conflictos entre maquetas y código/reglas, y cómo resolverlos

| # | Conflicto | Dónde se ve | Resolución propuesta |
|---|---|---|---|
| **C1** | **Las maquetas son solo España (tú, euros, Stripe, Bizum). El código vende también en Argentina** (`lib/region.ts`: Europa → ES, resto → AR; pesos, Mercado Pago, «vos»; `familias.region`; `POR_TRATO` en `page.tsx:79-108`; `tratoDeRegion`). Los pilotos reales son argentinos. | Todo lo público | **No se quita AR.** Cada texto nuevo se escribe en tú (España) y, si lleva «vos» o palabras de allí (celular/móvil, lindo/bonito, papá/padre), con su variante en vos, siguiendo el patrón `POR_TRATO`. Moneda, pasarela y «Bizum/Apple Pay» salen de la región (Bizum solo si Stripe lo tiene activado en la cuenta: POR COMPROBAR). Naza decide si en AR se mantiene el copy actual aprobado («vos») tal cual o se traduce el nuevo (`PENDIENTES.md` B1). |
| **C2** | **Orden del checkout.** Maqueta: 1 Su libro → 2 Pago → 3 Para quién (datos *después* de pagar, con «Lo completo más tarde»). Código: datos primero (5 pasos) → `POST /api/compra` crea familia + narrador + pedido → pasarela. `confirmarPago` pasa el narrador a `invitado` (o `regalo_pendiente`) y **el entrevistador le escribe**. Un narrador sin nombre ni teléfono pagado no cabe en los estados del CONTRATO. | `Checkout*`, `comprar/formulario.tsx`, `api/compra/route.ts`, `lib/confirmar-pago.ts` | **Fase 1: tres pasos con el diseño nuevo pero datos antes del pago**: 1 «Su libro» (formato + marco), 2 «Para quién» (para quién, nombre, regalo sí/no y fecha, su WhatsApp opcional *solo si es regalo*, trato) y 3 «Tus datos y pago» (email, nombre, dirección si impreso → `/api/compra` → pasarela). Es el mismo flujo, con 2 pantallas menos. El «pago primero, datos después» de verdad exige un estado nuevo (p. ej. `datos_pendientes`) y un recordatorio por email → `PENDIENTES.md` B2 (migración a acordar con el socio). |
| **C3** | **Marco sin impreso.** Maqueta y guía: «Marco +20 €, también con solo el digital». Código: los marcos **solo con impreso** («viajan juntos», `productos.ts:147-159`, `validarCarrito`, spec 2026-09-22). | `Checkout`, `Resto` («se pueden pedir con el libro digital o con el impreso») | Decisión de Naza (B3). Si cambia: tocar `armarCompra`/`validarCarrito` + sus tests (`productos.test.ts`) + el envío de un marco solo (`entregas`: POR COMPROBAR si la fábrica/logística lo soporta → avisar al socio). Hasta entonces, en la UI el marco se ofrece solo con impreso. |
| **C4** | **«30 días» y «una pregunta por día».** Regla nueva: nunca en textos públicos. Quedan en `README.md:3`, `legal/terminos/page.tsx:53-54`, `admin/familias/page.tsx:73` (admin: no público, puede quedar). `TOTAL_PREGUNTAS_BASE = 30` (`tablero/ui.tsx:54`) y «11 de 30 respuestas» en el guion clásico. | Legal, README, panel clásico | Reescribir términos §2 y README. En el panel, «N respuestas» sin total cuando sea V3 (ya aprobado en `aprobados.md`, maquetas.tsx #3). El total 30 se queda para el guion clásico de narradores viejos. |
| **C5** | **Promesas que ya no son ciertas:** «el anticipo tras su tercera respuesta», «lo lees mientras se escribe / capítulos escribiéndose», «te llega un correo con un minuto de su voz» (`Resto`, `Checkout` lado derecho, `Emails` nº 3, `Panel` capítulos, `Ejemplo` intro). El escritor V5.5 escribe **al terminar**; existe `/anticipo/[token]` y `anticipo.json` de la fábrica vieja (POR COMPROBAR si la fábrica V3 lo sigue generando; `handoff-2026-10-09.md` solo menciona el trato del mail de anticipo). Naza ya cambió estos textos el 06/10 por «desde la primera respuesta, en tu panel aparecen sus audios». | Home, checkout, panel, emails | Usar las versiones aprobadas de `aprobados.md` (#5, #16-19, #22). El bloque «Qué recibes tú» pasa a «escuchas sus audios mientras cuenta; cuando termina, el biógrafo escribe el libro». Si el anticipo V3 existe de verdad, se reactiva el texto (B4). |
| **C6** | **Garantía «Si él no quiere hacerlo, te devolvemos el dinero» junto a cada botón** (guía: «Mostrar la garantía junto a cada botón de compra»). Regla de Naza del 06/10: **nada de «te devolvemos el dinero» ni «si no acepta…» en los textos comerciales**; el desistimiento, solo en legales. | Hero, precio, checkout, panel «Tu pedido», landings | **Choque frontal entre dos decisiones de Naza.** Bloquea el copy de la fase 1 → `PENDIENTES.md` B5. Mientras no decida, se deja la garantía **fuera** (es lo último aprobado) y el hueco preparado con un `GARANTIA` opcional en un solo sitio. |
| **C7** | **Entrar**: maqueta = enlace por email (15 min) con código como alternativa; código = código de 6 dígitos a propósito (`entrar/formulario.tsx:9-12`). | `Entrar*` | Diseño nuevo sobre el flujo de código. Enlace: B6. |
| **C8** | **Kids** aparece en pestañas, portada, checkout, panel, landings, anuncios. En el código no existe (rama `vitacora-kids` sin mergear, `docs/ROADMAP.md` D27.10; «no cargar `PRECIO_KIDS_*`»). | Todo | Fase 4 como mucho, y solo con decisión (B7). En fase 1 la pestaña «Kids» **no se muestra** (o lleva a «próximamente» si Naza lo prefiere). |
| **C9** | **Cancelar el pedido y devolver el dinero** desde el panel; «unirse al libro de otro hermano» con devolución; «él dice que no → devolver / cambiar de persona / probar más adelante». Nada de esto existe; exige reembolsos por API y estados nuevos. | `Panel`, `Casos`, `Familias` | Fase 2: botón «Cancelar el pedido» que abre el contacto (WhatsApp/email de Vitácora). Lo demás → PENDIENTES (migraciones y acuerdos). |
| **C10** | **Pausar desde la web.** CONTRATO: `activo → pausado` lo hace **solo el entrevistador** (el narrador pide parar). La web solo puede `cerrado_anticipado` con ≥10 respuestas. | `Panel` «Pausar o cerrar» | Fase 2: «Cerrar con lo que hay» = `CierreAnticipado` existente. «Pausar» → acordar con el socio (B8): o la web escribe `pausado` (cambio de CONTRATO) o manda un aviso a los socios. |
| **C11** | Todo lo que pasa en WhatsApp (primer mensaje el día elegido, recordatorio a los 3 días, aviso a los 10, «Mandárselo yo», «Cambiar la primera pregunta», «¿Ya estáis en casa?», hora local 22:00 del destino, «él dice que no») es del **entrevistador**. | `Whatsapp`, `Casos`, `MasFlujos`, `Panel` | La web muestra lo que la base ya tiene (`alerta_silencio`, `dia_actual`, `estado`, `regalos.fecha_entrega`). Lo demás se entrega al socio como lista (`PENDIENTES.md` §3). |
| **C12** | **Precios de las maquetas** (49 / 99 = 49+50 / +20) vs. código: `PRECIO_EUR` (casa 49), `PRECIO_IMPRESO_EUR`, `PRECIO_MARCO_EUR`, `PRECIO_COPIA_EUR`, `PRECIO_MARCO_ADICIONAL_EUR`, `PRECIO_VIAJE_EUR` (+ `_ARS`). Valores reales en Vercel: POR COMPROBAR (`ROADMAP-AGENTE.md` T4.1 dice que las 12 están cargadas). | Todo | Nunca escribir cifras. «99 €» se **calcula** (`cat.base.precio + cat.impreso.precio`). Si falta una variable, esa línea no se muestra (regla de `productos.ts`). |
| **C13** | **Impreso «unos 9 días después de cerrar el libro»**: no aparece en ningún archivo del repo (buscado «9 días», «nueve días», «Bookmundo»). | Checkout, panel, legal, emails | POR COMPROBAR con la imprenta (B9). Hasta entonces, «te avisamos cuando salga de imprenta». |
| **C14** | **Reseñas, personas y cita IFEMA** son de ejemplo (la guía lo marca). El código ya tiene la regla dura `TESTIMONIOS = []` (`page.tsx:168`). | `Main`, `Kids`, `Viaje`, `Resto` | Mantener la lista vacía; la sección se enciende con reseñas reales y permiso por escrito. IFEMA: no publicar sin la fuente. Fotos generadas: valen como ilustración si Naza lo acepta (B10), nunca como «familias reales». |
| **C15** | **Capítulo «El amor»** en `web/src/app/maquetas.tsx:21,246,297` y en el seed del guion viejo. Regla: sin preguntas ni capítulos de amor. | Home actual | Al reescribir las maquetas de la home no usar ese capítulo (usar «La juventud», «El oficio», «Las raíces»). El seed de Supabase no se toca (es del guion viejo, no público). |
| **C16** | **Trato en el checkout**: la maqueta pregunta «¿Cómo le hablamos? De tú / De vos» y propone vos por defecto si el número es +54. El código ya lo tiene: `idioma` es-ES/es-AR/ca marcado por región (`formulario.tsx:71`) y el regalo escribe `contexto.idioma`/`contexto.trato` (CONTRATO «Gift card»). | `Familias` | Reusar lo que hay; añadir la deducción por prefijo (`+54`/`+598` → es-AR) como valor inicial editable. Catalán se mantiene como opción (existe). |
| **C17** | **Contacto «Vitácora» por WhatsApp (cuenta de empresa)** en portada, checkout y panel: botón flotante y caja. No hay número en el código (`WHATSAPP_NUMERO_PUBLICO` es del entrevistador en Railway). | Todo | Variable nueva en Vercel `NEXT_PUBLIC_WHATSAPP_DUDAS` (E.164). Sin ella, el botón no se renderiza. Número: B11. |
| **C18** | **Fuente de verdad del sistema visual**: `docs/design.md` (negro `#14140F`, violeta `#5D3FD3`, grises cálidos; «el violeta toca UNA sola cosa por pantalla») vs. la guía de las maquetas (fondo `#0a0a0a`, tarjeta `#12120f`, texto `#ededed`, acento `#b9a8f5`, botón `#a08ce8`, todo oscuro). | `globals.css`, `design.md` | Añadir los tokens nuevos a `globals.css` como **tema oscuro de marketing** (`--fondo-oscuro`, `--tarjeta`, `--acento-oscuro`, `--boton`) sin borrar los existentes; actualizar `docs/design.md` §2 con una nota «rediseño 2026-10» cuando Naza apruebe la fase 0. Las tipografías coinciden (Playfair 500 / Source Serif 4 / Archivo). |
| **C19** | `README.md` raíz describe el producto como «En 30 días de entrevistas por WhatsApp…». | README | Cambiar la frase (fase 0, un commit). |

## 6. Fases, en orden de lo que da dinero

Cada fase termina con: tests verdes, preview publicada, medición de `RENDIMIENTO.md` §5 anotada en
el PR, y **parar a enseñarla**.

### Fase 0 — Base: rama, preview, rendimiento, sistema visual (sin cambiar ninguna pantalla)

1. `git checkout -b rediseno-web` desde `main` actualizado. Copiar esta carpeta a
   `docs/rediseno-2026-10/` (con `maquetas/`; los `.mp4` de `maquetas/html/assets/` pesan 14 MB:
   se suben una vez; los vídeos **para la web** se re-codifican aparte, ver `RENDIMIENTO.md` §3.6).
2. Workflow de preview (§3.2). Pedir a Naza las variables de Preview.
3. Rendimiento base (`RENDIMIENTO.md` §3, bloque P0): `loading.tsx` en `/tablero` y
   `/tablero/[narradorId]`; una sola lectura de usuario e historias por request (`React.cache` sobre
   `historiasDelUsuario` y `getUser`); `historiaAccesible` sin repetir `familiaDelUsuario`;
   `preferredRegion`/`vercel.json` según lo que diga Naza de las regiones; `next.config.ts` con
   `images` y `compress`; medir antes y después.
4. Sistema visual: tokens nuevos en `globals.css` (C18), componentes base compartidos en
   `web/src/app/_ui/` (botón primario/fantasma, tarjeta, pastilla, acordeón, hoja/modal, paso,
   reproductor con onda) con las clases de motion de `MOTION.md` §2. Tipografías al `layout.tsx`
   raíz (hoy se cargan en cada página: `page.tsx:20-39`, `comprar/page.tsx:20-22`,
   `tablero/layout.tsx:19-38`, `viaje`, `regalar`).
5. Textos: corregir C4 y C19.
6. **Terminado cuando**: la preview abre en la URL fija; Lighthouse móvil de `/` y de `/tablero`
   anotados (antes/después); `/tablero/[id]` pinta un esqueleto en <200 ms y la navegación entre
   historias baja a <1 s en la preview; `npm test` verde; nada visible cambió salvo la velocidad.

### Fase 1 — Portada + checkout + pago (lo que vende)

1. `/` según `Main`/`Movil` + `Resto`/`RestoMovil`, con las reglas de `TEXTOS-Y-REGLAS.md` y C1, C5,
   C6, C8, C14, C15. Vídeo de portada con póster y carga diferida (`RENDIMIENTO.md` §3.6).
   Pestañas Familiar/Viaje (Kids oculta). FAQ en acordeón. CTA sticky móvil (ya existe).
   `/ejemplo` estático.
2. `/comprar` en 3 pasos (C2), con marco según C3, trato según C16, pago fallido según `Casos` 2,
   dirección si hay impreso, resumen lateral con el ticket en vivo (`armarCompra`, ya existe),
   «Pagar» con indicador y sin doble clic (`MOTION.md` regla), transición entre pasos.
   `/comprar/viaje` con el mismo cascarón. `/regalar` re-vestido (hoy no está enlazado desde la
   portada en producción: `ESTADO.md` 09/10; `LinkRegalarLanding` existe en `page.tsx:332`).
3. Vuelta del pago (`/api/pago/vuelta` → panel) y `/comprar/gracias` con el diseño de la pantalla
   «Pedido confirmado» (`Checkout` paso 4): «Ir a mi panel», «Descargar la tarjeta» si es regalo.
4. Mails de la web (`lib/mail.ts`): acceso y regalo con el HTML de `Email`; en tú/vos por región
   (ya lo hace `enviarMailAcceso` con `region`).
5. **Terminado cuando**: una compra de prueba completa en la preview (Stripe test y MP sandbox)
   llega al panel; un regalo de prueba genera tarjeta; Lighthouse móvil de `/`: LCP < 2,0 s,
   CLS < 0,05, JS inicial < 150 kB gz; los tests de textos actualizados; capturas de la preview
   junto a `capturas/Main.jpg`, `Movil.jpg`, `Checkout.jpg`, `CheckoutMovil.jpg`.

### Fase 2 — Panel

1. Cascarón (`tablero/layout.tsx`, `nav.tsx`): cabecera de la maqueta, avatar, tema (D-11).
2. Inicio y vista de historia en los 3 momentos (§4.2), sobre las tres vistas existentes (clásica,
   V3, viaje). Bloques: cabecera con portada y «Hola, {nombre}», línea de tiempo (Pagado → Primer
   mensaje → Contándolo → Libro listo → Impreso en casa; «Anticipo» solo si B4), Su WhatsApp (si
   falta, pedirlo: hoy el regalo no tiene teléfono hasta el canje, CONTRATO), Sus fotos, Lo último
   que contó, La familia, Tu pedido (lo que existe: dirección, extras, cierre; lo demás → contacto).
3. Sub-páginas existentes re-vestidas (dudas, frases, nombres, preguntas, libro, leer, regalo,
   cuenta) sin quitar nada.
4. Femenino por `genero` en todos los textos del panel.
5. **Terminado cuando**: las cuentas de los pilotos reales (Naza, Dora, Imma: narradores V3) se ven
   bien en la preview en los tres momentos; INP < 200 ms; cada clic del panel muestra esqueleto
   < 200 ms; `npm test` verde con tests nuevos de los 3 momentos.

### Fase 3 — Emails y WhatsApp de cliente (solo lo que es de la web)

- Invitación (`enviarMailInvitacion`) con el HTML nuevo; página de 404 y «enlace caducado»
  (`Casos` 5); «Tu pedido sigue guardado» tras pago fallido (nuevo, 1 email, necesita guardar el
  email antes del pago: ya se pide en el paso de pago).
- Los 7 emails del recorrido y las plantillas de WhatsApp: **se exportan como HTML de referencia a
  `docs/rediseno-2026-10/para-el-socio/`** con la lista de C11. No se implementan.
- **Terminado cuando**: los tres mails de la web salen con el diseño nuevo en la preview (Resend
  de prueba) y se ven bien en Gmail móvil.

### Fase 4 — Landings de anuncio, Viaje, Kids (si procede), rasca

- `/viaje` según `Viaje*`; 3 landings Familiar + 3 Viaje; `/su-voz` etc. Kids solo con B7.
  Rasca-rasca solo con B12 (cupón real) y guardado del email.
- **Terminado cuando**: cada landing pasa Lighthouse móvil igual que la portada y lleva al checkout
  correcto con la línea preseleccionada; píxel de Meta solo si Naza lo pide (y entonces cookies, §4.1 Legal).

### Fase 5 — Legal

- `/legal/*` con el diseño de `Legal*` y resumen «En corto». Textos: los actuales corregidos
  (C4) hasta que el abogado entregue los definitivos (B13). Mantener «Botón de arrepentimiento» para AR.
- **Terminado cuando**: los enlaces del pie de todas las páginas llevan a las tres rutas; la
  política de devoluciones coincide con lo que la web promete (depende de B5).

## 7. Cómo trabajar dentro de cada fase

- Una sub-tarea = un commit con mensaje en español («portada: hero con vídeo y póster»).
- Antes de cambiar un texto fijado por un test, buscar el test (`grep -rn "texto" web/test`).
- Nada de `any` nuevo, nada de `// eslint-disable` nuevo salvo el `<img>` ya existente.
- No instalar dependencias nuevas sin apuntarlo en el PR (regla de rendimiento).
- Cuando una pantalla necesite un dato que no está en la base: hueco visible con «POR DECIDIR» en
  la preview **no**: se deja fuera de la UI y se apunta en `PENDIENTES.md`.
- Al terminar la fase: `npm test`, push, esperar el workflow, pegar en el PR la URL de la preview,
  las capturas y las métricas; **parar**.

## 8. El switch final y la vuelta atrás

### 8.1 Checklist antes del merge a `main`

- [ ] Todas las fases 0–2 aprobadas por Naza en la preview (3–5 pueden entrar después, en PRs
      pequeños sobre `main`).
- [ ] `npm test` verde; `npx tsc --noEmit -p web` sin errores; `npm run build` local sin warnings nuevos.
- [ ] Variables de **Production** en Vercel: las nuevas (`NEXT_PUBLIC_WHATSAPP_DUDAS`, y las que
      hayan nacido) cargadas **antes** del merge (el build las lee al construir, `web/README.md`).
- [ ] Comprobado en la preview con las cuentas reales de los pilotos (narradores V3) que el panel
      no rompe nada que hoy usan.
- [ ] Una compra de prueba y un regalo de prueba completados en la preview.
- [ ] Lighthouse móvil de `/`, `/comprar`, `/tablero` anotados en el PR.
- [ ] Avisado el socio: «el martes a las 10 sale la web nueva; no toca la base; si ves algo raro en
      el panel, me escribes».
- [ ] `docs/design.md` y `web/README.md` actualizados (C18, deploy de preview).

### 8.2 El switch

1. PR de `rediseno-web` → `main` en GitHub (el usuario lo aprueba; mergear con «Merge commit»,
   no squash, para conservar el historial por fases).
2. El push a `main` dispara `deploy-web.yml` (3–5 min). Seguirlo en GitHub → Actions → «Deploy web».
3. Probar en `www.vitacorafamiliar.com`: portada móvil y escritorio, `/comprar` hasta la pasarela
   (cancelar), `/entrar` con una cuenta real, `/tablero`.

### 8.3 Si algo falla: volver atrás en un minuto

- **Instant Rollback de Vercel**: vercel.com → proyecto → Deployments → el deployment anterior
  (el último de `main` antes del switch) → «Instant Rollback» (o «Promote to Production»). Vuelve
  la web anterior sin tocar git. POR COMPROBAR que el plan Hobby lo ofrece; en cualquier caso,
  «Promote to Production» sobre el deployment anterior hace lo mismo.
- Alternativa por git: `git revert -m 1 <commit del merge>` + push a `main` → el workflow vuelve a
  desplegar la web anterior en ~4 min. (Y la rama `rediseno-web` sigue intacta para arreglar.)
- Lo que **no** vuelve atrás con el rollback: variables de entorno nuevas (no estorban) y la base
  (el rediseño no la toca: por eso la regla 2).

## 9. Cómo usar las carpetas de maquetas

```
docs/rediseno-2026-10/maquetas/
├── fuente-dc/      ← la fuente de cada tablero: HTML con huecos {{x}}, bloques <sc-if value="{{cond}}">
│   │                 y una clase JS al final (class Component extends DCLogic) con TODOS los estados
│   │                 y textos dinámicos. Aquí están los estilos (en <style>) y las reglas de motion.
│   ├── Guia.dc.html    ← LÉEME: mapa de pantallas, recorrido, precios, garantías, sistema, pendientes
│   ├── Motion.dc.html  ← tokens y patrones de animación (resumidos en MOTION.md)
│   └── canvas.json     ← títulos de cada tablero + tres notas (landings, mejoras, popup del rasca)
├── html/           ← la misma pantalla en estado por defecto, abrible en el navegador; assets/ con
│                     las fotos (jpg) y los tres vídeos (mp4, 3,5–5,5 MB, 1344×768)
└── capturas/       ← captura jpg de cada tablero (la forma rápida de ver el diseño)
```

- Para el **estado por defecto**: `capturas/X.jpg` o `html/X.html`.
- Para **otros estados** (paso 2 del checkout, «Libro listo» del panel, foto pequeña…): en
  `fuente-dc/X.dc.html` buscar `<sc-if value="{{nombre}}">` y en la clase JS el `renderVals()` que
  pone `nombre: true/false` y los textos (`TX = {...}`). Las maquetas interactivas (`is_interactive`
  en `canvas.json`) tienen todos los textos en esa clase.
- Los `/_blob/<hash>` de `fuente-dc/` son `html/assets/<hash>.jpg|mp4`.
- Los estilos van **inline** en la maqueta (DC los genera así). No copiar estilos inline al código:
  traducirlos a los tokens y componentes de la fase 0.
- Las fotos de `assets/` son **personas generadas** (Osvaldo, Nico, Sara, Dani): valen para la
  preview; para producción, B10.
- Si Claude Code puede abrir el lienzo: <https://claude.ai/artifact/SepNtjthQzZCq8nHAxAhN9>.
  Si no, con esta carpeta basta.
