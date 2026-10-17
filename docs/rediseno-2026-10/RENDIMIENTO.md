# Rendimiento — diagnóstico, arreglos, objetivos y medición

Todo verificado leyendo el código de `web/` el 13/10/2026 (commit `4d6c712`). Lo que no se puede
ver en el código (paneles de Vercel y Supabase) está marcado **POR COMPROBAR**.

## 1. Resumen

El panel se siente «colgado» al hacer clic por tres cosas que se suman:

1. **Entre 12 y 20 viajes de red en serie** por cada página del panel (sesión leída tres veces,
   historias del usuario leídas dos veces, cadenas de consultas una detrás de otra).
2. **Ningún `loading.tsx` en toda la app**: hasta que el servidor termina todos esos viajes, el
   navegador no pinta nada nuevo. El clic parece no haber hecho nada.
3. **Posible distancia entre Vercel y Supabase** (si las funciones corren en `iad1`, Washington, y
   la base está en Europa o en Sudamérica, cada viaje son 100–200 ms de ida y vuelta × 15 viajes).

La portada tiene otro problema distinto: se renderiza **por request** (lee la cabecera del país) y
no se cachea en el CDN. Y el rediseño añade un vídeo de 5,5 MB que, sin cuidado, se comería solo
todo el presupuesto.

## 2. Diagnóstico con referencias

### 2.1 La cadena de `/tablero/[narradorId]` (la pantalla más usada)

| Paso | Archivo:línea | Qué hace | Viajes (en serie) |
|---|---|---|---|
| 1 | `web/src/middleware.ts:42-44` | `supabase.auth.getUser()` en el proxy. `getUser()` siempre consulta al servidor de auth (no valida localmente). | 1 |
| 2 | `web/src/app/tablero/layout.tsx:41-46` | **Otra vez** `getUser()` | 1 |
| 3 | `web/src/app/tablero/layout.tsx:49` → `web/src/lib/panel.ts:94-128` `historiasDelUsuario` | `familiaDelUsuario` (`lib/familia.ts:20-35`: 1–2 consultas en serie) → `narradores` (`panel.ts:106-110`) → `narradoresInvitados` (`panel.ts:59-91`: 1–2 consultas, más un `update` por invitación pendiente) → `narradores` de invitados (`panel.ts:117-123`) | 3–6 |
| 4 | `web/src/app/tablero/[narradorId]/page.tsx:69-72` | **Tercera vez** `getUser()` | 1 |
| 5 | `page.tsx:76` → `panel.ts:134-158` `historiaAccesible` | `narradores` → `familiaDelUsuario` (otra vez) → `narradoresInvitados` (otra vez) | 3–5 |
| 6 | `page.tsx:111-138` | `Promise.all` de 8 (bien), **pero** uno de ellos es `historiasDelUsuario(admin, user)` (`page.tsx:135`), que vuelve a hacer el paso 3 entero (3–6 en serie dentro del `all`), y otro `tratoDeLaFamilia` (`lib/trato.ts:8-21`, 1 consulta) | 3–6 |
| 7 | `page.tsx:156` | `hayDudasPendientes` (`lib/dudas-archivos.ts:69-75`: `storage.list` + 2 descargas) solo si está cerrado | 0–2 |
| 8 | `page.tsx:212` y `218-222` | `entrevistaV3` y luego `respuestas` V3, en serie | 2 |

**Total: 15–24 viajes en serie** en una historia V3 en marcha. A 30 ms por viaje (misma región)
son 0,5–0,7 s; a 150 ms (regiones distintas) son 2,5–3,5 s. **Encaja con lo que nota el usuario.**

`/tablero` (Inicio, `tablero/page.tsx`) repite los pasos 1–3 y luego hace un `Promise.all` por
historia (`:103`) seguido de **otro** `Promise.all` para las regiones (`:106-110`): dos rondas más.

### 2.2 Sin `loading.tsx` ni `not-found.tsx`

`find web/src/app -name "loading.tsx"` → ninguno. `not-found.tsx` tampoco. Next.js no puede
enviar un esqueleto mientras el servidor trabaja, así que la respuesta visible al clic es la
duración completa de la cadena de 2.1.

### 2.3 Portada dinámica, sin caché CDN

`web/src/app/page.tsx:267` `regionDelRequest(await headers())` convierte `/` en render dinámico en
cada visita (decisión 2.12 del 21/09 para que los precios no queden horneados). Lo mismo en
`comprar/page.tsx:46`, `entrar/page.tsx:9`, `regalar/page.tsx` y `viaje`. Consecuencia: cada visita
de Instagram paga el arranque de la función + el render, en vez de un HTML servido por el CDN.
`next.config.ts` está vacío (sin `images`, sin cabeceras de caché).

### 2.4 Región de funciones y de la base — POR COMPROBAR

- No hay `vercel.json` ni `export const preferredRegion` en ningún archivo (`grep -rn preferredRegion web/src` → nada). Vercel usa su defecto (`iad1`, EE. UU. este) para las funciones.
- La región del proyecto de Supabase no está en el repo (`supabase/config.toml` es local). Mirar en
  supabase.com → Project Settings → General → Region.
- Si no coinciden (p. ej. funciones en `iad1` y base en `eu-west-1` o `sa-east-1`), **cada viaje de
  2.1 cruza el océano**. Arreglo: fijar las funciones en la región de la base (`vercel.json`:
  `{"regions": ["fra1"]}` o la que toque; en Hobby se permite **una** región). Mover la base no:
  es compartida con el entrevistador y la fábrica (Railway: su región también cuenta) → hablar con el socio.
- Los visitantes están en España y Argentina. Si la base está en Europa, `fra1`/`cdg1`; si está en
  Sudamérica, `gru1`. La portada estática (2.3 → 3.3) no depende de esto: la sirve el CDN cerca del visitante.

### 2.5 Tipografías cargadas en cada página

`next/font/google` se instancia en `page.tsx:20-39`, `comprar/page.tsx:20-22`,
`tablero/layout.tsx:19-38`, `viaje/page.tsx`, `regalar/page.tsx`, con subconjuntos y pesos
idénticos. Next deduplica el archivo, pero cada página declara sus variables CSS por separado y el
`layout.tsx` raíz no las tiene (comentario en `layout.tsx:4-7`: a propósito, para no tocar el
tablero). Con el rediseño ya no hay motivo: van al raíz una vez. Pesos: Playfair 500/600 + itálica,
Archivo 400/500, Source Serif 300/400 + itálica = 8 archivos woff2. La maqueta usa Playfair 500,
Archivo 400/500/600 y Source Serif 400 (+ itálicas): revisar qué pesos se usan de verdad y quitar el resto.

### 2.6 Imágenes y JS de cliente

- 17 `<img>` y **ningún `next/image`** (`grep -rn "next/image" web/src` → nada). Hoy casi no hay
  imágenes pesadas (las maquetas de la home son SVG/CSS). El rediseño añade ~20 fotos jpg de
  100–420 kB cada una (`maquetas/html/assets/`, p. ej. `b41429dd….jpg` 420 kB, 1000×1339).
- 32 componentes `"use client"`. Los de la portada (`cta-sticky.tsx`, `selector-producto.tsx`,
  `link-regalar.tsx`, `maquetas.tsx` parcial) son pequeños. El checkout entero es cliente
  (`comprar/formulario.tsx`, 559 líneas, más `productos-ui.tsx`): normal, es un formulario.
- Audio: `reproductor.tsx:90` y `maquetas.tsx:271` ya usan `preload="none"`. Bien.

### 2.7 Archivos pesados en `public/`

`web/public/demo/libro-dora.pdf` = **10,5 MB**. Solo lo usa `/demo/dora` (maqueta del vídeo del
marco), pero cualquiera con la URL lo descarga y está en el repo. No enlazarlo desde la web pública;
valorar moverlo a Storage o fuera del repo (no bloquea).

### 2.8 El vídeo de portada del rediseño

`maquetas/html/assets/2472041aecb46064cad1dfe93675e7d8.mp4`: H.264 1344×768, 5,2 s, **8,3 Mbps,
5,5 MB, con pista de audio AAC** (que nunca sonará: va en `muted`). Viaje: 5,3 Mbps, 4,9 MB. Kids:
5,4 Mbps, 3,5 MB. Tal cual, el vídeo solo ya rompe el presupuesto de la portada en 4G.

### 2.9 Otros

- `middleware.ts:61` incluye `/comprar` y `/entrar` en el `matcher`: en esas páginas públicas se
  llama a `getUser()` aunque no haga falta sesión (`pideSesion` solo exige `/tablero` y `/admin`).
  Con cookies de sesión presentes, es un viaje de red extra en el checkout.
- Next 16 avisa que `middleware.ts` pasa a `proxy.ts` (`ROADMAP-AGENTE.md` T3.10): hacerlo en la
  fase 0 ya que se toca.
- `tablero/layout.tsx:58` lee la cookie del tema en el servidor: bien (sin parpadeo).

## 3. Arreglos, priorizados

### P0 — Fase 0 (ganancia grande, riesgo bajo, sin cambiar pantallas)

| # | Arreglo | Dónde | Efecto esperado |
|---|---|---|---|
| 3.1 | **`loading.tsx`** en `web/src/app/tablero/` y `web/src/app/tablero/[narradorId]/` con un esqueleto del cascarón (cabecera, tres tarjetas grises, lista). También en `comprar/` y `entrar/`. | nuevo | Respuesta visible al clic < 200 ms aunque la cadena siga tardando. Es el arreglo que más se nota. |
| 3.2 | **Leer la sesión una vez por request**: envolver `crearClienteSesion().auth.getUser()` en `React.cache()` (`lib/supabase/sesion.ts`) y usar esa función en layout y page. Mismo con `historiasDelUsuario` y `familiaDelUsuario` (clave: `user.id`). | `lib/supabase/sesion.ts`, `lib/panel.ts`, `lib/familia.ts`, `tablero/layout.tsx`, `[narradorId]/page.tsx:69,135` | Quita 1 `getUser` y 3–6 consultas por página. |
| 3.3 | **`historiaAccesible` sin repetir**: recibir el `Panel` ya cargado (o usar el `cache` de 3.2) y buscar el narrador en `panel.historias` antes de ir a la base; solo si no está (link directo de visitante) hacer la consulta. | `lib/panel.ts:134-158`, `[narradorId]/page.tsx:76` | 3–5 viajes menos. |
| 3.4 | **Paralelizar lo que queda**: en `panel.ts:100-115` lanzar `familiaDelUsuario` y `narradoresInvitados` juntos (`Promise.all`) y después las dos consultas de `narradores` juntas (`.or()` por `familia_id` e `in(id)` en una sola). En `[narradorId]/page.tsx:212-222` pedir `entrevistaV3` y las `respuestas` V3 dentro del `Promise.all` de `:120` (la consulta V3 no depende de nada) y `hayDudasPendientes` también. En `tablero/page.tsx:103-110` juntar los dos `Promise.all`. | `lib/panel.ts`, `[narradorId]/page.tsx`, `tablero/page.tsx` | De 15–24 viajes en serie a **4–6**. |
| 3.5 | **Región**: tras comprobar 2.4, `web/vercel.json` con `{"regions": ["<la de Supabase>"]}`. Confirmar con Naza; avisar al socio (no cambia la base, solo dónde corre la web). | nuevo | Si hoy cruzan el océano, ×3–5 más rápido todo el panel. |
| 3.6 | **Vídeo de portada**: re-codificar desde el mp4 de la maqueta a dos versiones **sin audio**: escritorio 1280×731 H.264 CRF 28 (~1,2–1,5 MB) y móvil 720×411 (~450 kB); más una versión AV1/WebM opcional. `<video poster="…" muted playsinline autoplay loop preload="none">` con `<source media="(min-width: 768px)">` y el `src` real puesto por JS solo cuando el póster ya pintó (`requestIdleCallback` o `IntersectionObserver`). Póster = jpg 1344×768 (`08d1f517….jpg`, 75 kB) servido con `next/image` como LCP (`priority`). Respetar `prefers-reduced-motion` (no cargar el vídeo) y `Save-Data`. Comando: `ffmpeg -i in.mp4 -an -vf scale=1280:-2 -c:v libx264 -crf 28 -preset slow -movflags +faststart out-1280.mp4`. | `web/public/video/` + componente `VideoPortada` | El vídeo no cuenta en el LCP ni bloquea nada. |
| 3.7 | **`next/image`** para todas las fotos del rediseño (`sizes` correctos, `quality` 70, formato automático AVIF/WebP), `priority` solo en la que sea LCP. `images.formats = ['image/avif','image/webp']` en `next.config.ts`. | `next.config.ts`, componentes | 420 kB → ~60 kB por foto. |
| 3.8 | **Tipografías al layout raíz**, pesos mínimos (Playfair 500 + itálica; Source Serif 400 + itálica, 300 solo si se usa; Archivo 400/500/600), `display: "swap"`, `preload`. Comprobar `adjustFontFallback` para CLS. | `app/layout.tsx`, quitar de las 5 páginas | Menos CLS, un solo set de archivos. |
| 3.9 | `middleware.ts` → `proxy.ts` (Next 16) y `matcher` **solo** `/tablero/:path*` y `/admin/:path*`. `/comprar` y `/entrar` no refrescan sesión (si hiciera falta en `/entrar` para redirigir a quien ya entró, hacerlo en la página con `getUser` cacheado). | `web/src/middleware.ts:60-62` | Un viaje menos en el checkout. |

### P1 — Fase 1 (portada)

| # | Arreglo | Efecto |
|---|---|---|
| 3.10 | **Portada estática + región en el cliente**: generar `/` estático (sin `headers()`) con los precios de **las dos regiones** embebidos (`catalogo("ES")` y `catalogo("AR")`, como ya hace `comprar/page.tsx:30`) y elegir cuál mostrar con un componente cliente mínimo que lea `x-vercel-ip-country`… que en estático no existe. Dos opciones: (a) mantener dinámico pero con `Cache-Control: s-maxage=300, stale-while-revalidate` por región usando `Vary`… Vercel no varía por país en la caché de funciones. (b) **Recomendada**: página estática con los textos en tú (defecto) y un `<script>` inline de 300 bytes que lee una cookie `region` puesta por el proxy (el proxy sí ve `x-vercel-ip-country`, cuesta 0 viajes) y cambia precios/trato con `data-region` en CSS (`[data-region="AR"] .solo-es{display:none}`) antes del primer pintado. Alternativa (c): segmentar por ruta (`/` y `/ar`) con redirección en el proxy por país; es la más simple para el caché y para los tests. **Elegir (c) si Naza acepta la URL `/ar`; si no, (b).** Hay que mantener los tests de `portada-trato.test.tsx` (que simulan `x-vercel-ip-country`). | LCP de la portada deja de depender del arranque de la función: HTML del CDN en < 100 ms. |
| 3.11 | Presupuesto por página (ver §4). Comprobar con `ANALYZE=true` (`@next/bundle-analyzer`, solo dev) que ninguna librería grande entra en la portada (hoy no hay ninguna: `package.json` solo trae supabase, stripe, mercadopago, qrcode, que son de servidor). | |
| 3.12 | Fotos de las secciones con `loading="lazy"` (defecto de `next/image`) y `sizes`; las tres de «Para quién es» en 4:5 a 480 px de ancho máx. en móvil. | |
| 3.13 | `aparece`/`revealUp` con `animation-timeline: view()` ya existe (`globals.css:88-98`); se mantiene en CSS. Nada de IntersectionObserver en JS para aparecer (solo para el vídeo y el CTA sticky, que ya lo usa). | 0 kB de JS para el motion. |

### P2 — Fase 2 (panel)

| # | Arreglo | Efecto |
|---|---|---|
| 3.14 | Streaming con `Suspense` dentro de la página: cabecera y «Tu pedido» primero; «Lo último que contó» y «Sus fotos» en `Suspense` propios, cada uno con su consulta. Next envía el HTML por trozos. | El usuario ve la cabecera en ~300 ms; el resto llega después. |
| 3.15 | Prefetch de los enlaces del riel/navegación (`<Link prefetch>` es el defecto en producción para rutas estáticas; para dinámicas, `prefetch={true}` carga el loading). Navegación con `useTransition` en los botones que cambian de historia para marcar «cargando» al instante. | Navegación < 1 s. |
| 3.16 | Reproductor: un solo `<audio>` compartido (hoy uno por respuesta, `reproductor.tsx:90`, con `preload="none"` → fino); onda animada en CSS (`MOTION.md` 9), nunca Web Audio API para dibujar la onda (coste de CPU en móviles viejos). | INP estable. |
| 3.17 | Fotos del panel por `/api/fotos/[id]`: asegurar `Cache-Control: private, max-age=86400` en la respuesta y tamaño reducido (miniaturas) para las galerías (POR COMPROBAR qué devuelve hoy `api/fotos/[fotoId]/route.ts`). | |

### P3 — después

- `web/public/demo/libro-dora.pdf` fuera del repo o a Storage (2.7).
- Vercel Speed Insights y Analytics (`@vercel/speed-insights`, `@vercel/analytics`): ~2 kB cada
  uno; añadir en fase 1 para medir en producción (necesita activarlo en el panel de Vercel: POR
  COMPROBAR disponibilidad en Hobby; Speed Insights sí está en Hobby con límite de datos).

## 4. Objetivos numéricos

Medidos en **móvil, Lighthouse «Mobile» (Moto G Power simulado, 4G lenta)**, en la preview y luego
en producción. Cada fase los anota en el PR (antes/después).

| Página | LCP | INP | CLS | TTFB | JS inicial (gz) | Peso total primer pintado |
|---|---|---|---|---|---|---|
| `/` (portada) | **< 2,0 s** | < 200 ms | **< 0,05** | < 300 ms (CDN) | **< 150 kB** | < 600 kB sin el vídeo; vídeo móvil ≤ 500 kB diferido |
| `/comprar` | < 2,5 s | < 200 ms | < 0,05 | < 500 ms | < 200 kB | < 500 kB |
| `/tablero` y `/tablero/[id]` | < 2,5 s (esqueleto visible < 200 ms) | < 200 ms | < 0,05 | < 600 ms hasta el esqueleto | < 200 kB | — |
| Navegación dentro del panel | — | — | — | contenido completo < 1 s en la misma región | | |
| Landings de anuncio | igual que `/` | | | | | |

Presupuesto de peso por tipo (portada, móvil): HTML < 60 kB, CSS < 40 kB, fuentes ≤ 5 archivos
woff2 (< 180 kB), imágenes sobre el pliegue < 150 kB, vídeo diferido ≤ 500 kB (móvil) / ≤ 1,5 MB
(escritorio), JS < 150 kB gz. Si una sección no cabe, se recorta la sección, no el presupuesto.

Lighthouse: Performance ≥ 90 en `/` y en las landings; ≥ 80 en `/comprar` y el panel.

## 5. Cómo medir

1. **Lighthouse** en Chrome (DevTools → Lighthouse → Mobile, «Clear storage», modo navegación) sobre la
   URL de la preview, 3 veces, se apunta la mediana. O desde consola:
   `npx lighthouse https://vitacora-rediseno.vercel.app --preset=perf --form-factor=mobile --screenEmulation.mobile --throttling-method=simulate --output=json --output-path=./lh-home.json`.
2. **Panel (con sesión)**: Lighthouse no entra. Medir con DevTools → Network (Disable cache, Slow 4G) el
   tiempo hasta el primer pintado del esqueleto y hasta `DOMContentLoaded`, y en DevTools →
   Performance la interacción (INP) al cambiar de historia. Apuntar también el **número de requests
   a Supabase por página** desde los logs de Vercel (Runtime Logs) o con un `console.time` temporal
   alrededor de las consultas: objetivo ≤ 6 en `/tablero/[id]`.
3. **Vercel Speed Insights** en producción tras el switch: p75 de LCP/INP/CLS reales por ruta.
4. **Antes/después en fase 0**: medir `main` (producción actual) con el mismo método y guardar en
   `docs/rediseno-2026-10/mediciones.md` (tabla: fecha, página, LCP, INP, CLS, requests, región).

## 6. Reglas de rendimiento que no se negocian

- Nada de librerías de animación, carruseles, ni UI kits. Tailwind + CSS.
- Ningún `fetch` de cliente para datos que el servidor ya tiene.
- Todo `<img>` nuevo pasa por `next/image` con `sizes`.
- El vídeo nunca es LCP: siempre póster primero.
- Cada `await` nuevo en una página de servidor se justifica en el commit («depende de X»); si no
  depende de nada, va dentro de un `Promise.all`.
- `loading.tsx` en cada segmento con datos.
