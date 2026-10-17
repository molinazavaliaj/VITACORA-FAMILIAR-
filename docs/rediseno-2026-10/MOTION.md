# Motion — cómo se mueve la web

Sacado de `maquetas/fuente-dc/Motion.dc.html` (la guía con demos), de la sección «Movimiento» de
`Guia.dc.html` y de las clases CSS que repiten todas las maquetas (`.m-btn`, `.m-ghost`, `.m-card`,
`.m-dot`, `.m-step`, `.m-pill`, `.m-acc`, `.m-plus`, `.m-up`, `.m-price`, `.m-overlay`, `.m-pop`,
`.m-bar`, `.m-leaf`, `revealUp`). Lo que ya existe en el código se indica.

**Principio** (Motion.dc.html): «Movimientos cortos y suaves, como pasar una página. Nada rebota ni
gira. Cada movimiento confirma algo que hizo la persona: tocó, eligió, avanzó.»

## 1. Tokens (van en `globals.css`, en `:root`)

```css
:root {
  /* duraciones */
  --d-instante: 120ms;   /* tocar, pasar el ratón */
  --d-rapido:   200ms;   /* elegir una opción, hover de tarjeta */
  --d-base:     320ms;   /* pasos, solapas, acordeón, hojas */
  --d-lento:    480ms;   /* aparecer al bajar, popups */
  --d-libro:    700ms;   /* pasar una página; el ÚNICO movimiento lento */
  /* curvas */
  --ease-out: cubic-bezier(.2, .7, .2, 1);   /* «salida suave»: todo lo que entra o aparece */
  --ease-io:  cubic-bezier(.65, 0, .35, 1);  /* «ida y vuelta»: lo que se desplaza de un sitio a otro */
}
```

Valores auxiliares que usan las maquetas y no están en la guía (se conservan tal cual): botón al
pulsar `80ms`; precio que cambia `360ms`; fondo del popup `240ms`; onda de audio `900ms` en bucle;
escalonado de bloques `70ms` (y `150ms`/`120ms` en heros de landings); eco del botón de voz `1800ms`.

## 2. Patrones (clases globales)

Todas las clases animan **solo `transform` y `opacity`** (más `border-color`/`background-color`/
`filter`, que son baratas). Van en `globals.css` y las usan los componentes de `web/src/app/_ui/`.

| # | Clase | Qué hace | CSS exacto (de las maquetas) |
|---|---|---|---|
| 1 | `.m-btn` (botón primario, pastilla) | Hover: sube 2 px y gana sombra; pulsar: se hunde | `transition: transform 160ms var(--ease-out), box-shadow 200ms var(--ease-out), filter 200ms, background-color 200ms;` `:hover { transform: translateY(-2px); box-shadow: 0 10px 24px rgba(160,140,232,.28); filter: brightness(1.05) }` `:active { transform: translateY(0) scale(.97); box-shadow: none; transition-duration: 80ms }` |
| 1b | `.m-ghost` (botón fantasma) | Solo cambia borde/fondo; pulsar: se encoge | `transition: border-color 200ms, background-color 200ms, color 200ms, transform 160ms;` `:hover { border-color: var(--acento-oscuro); background: #1a1726 }` `:active { transform: scale(.97) }` |
| 2 | `.m-step` (paso del checkout) | El paso nuevo entra desde la derecha mientras aparece | `@keyframes stepIn { from { opacity: 0; transform: translateX(24px) } to { opacity: 1; transform: none } }` `animation: stepIn 320ms var(--ease-out) both`. En el panel y en Entrar la misma clase entra desde abajo: `translateY(10px)` / `translateX(18px)`. Usar `translateX(24px)` en checkout, `translateY(10px)` en panel y hojas. |
| 2b | barra de progreso del checkout | Se llena | `transform-origin: left; transform: scaleX(paso/3); transition: transform 320ms var(--ease-io)` (clase `.m-pill` en la demo) |
| 3 | `.m-card` + `.m-dot` (opción elegible) | Borde y fondo cambian, el punto se rellena; al tocar se encoge | `.m-card { transition: border-color 200ms var(--ease-out), background-color 200ms var(--ease-out), color 200ms, transform 200ms var(--ease-out) } .m-card:active { transform: scale(.985) }` `.m-dot { transition: border-width 200ms var(--ease-out), border-color 200ms }` elegido: `border: 6px solid var(--boton)`; no elegido: `1.5px solid #5a5850` |
| 4 | `.m-pill` (solapas Familiar · Viaje) | La pastilla de color se desliza hasta la solapa elegida | `position: absolute; transition: transform 320ms var(--ease-io), width 320ms var(--ease-io); transform: translateX(Xpx)`. **Nota de rendimiento**: `width` provoca layout; preferir medir las solapas una vez y animar solo `transform: translateX() scaleX()`. |
| 5 | `.m-acc` + `.m-plus` (FAQ) | La respuesta se despliega hacia abajo; el «+» gira a «×» | `.m-acc { overflow: hidden; transition: max-height 320ms var(--ease-io), opacity 240ms }` abierto: `max-height: <alto real>; opacity: 1`; cerrado: `0; 0`. `.m-plus { transition: transform 320ms var(--ease-io) }` abierto: `rotate(45deg)`. **Implementación**: `<details>`/`<summary>` nativos (así lo hace `Resto`/`LandingRegalo`, `summary::-webkit-details-marker{display:none}`) con la transición sobre un `div` interior; o `grid-template-rows: 0fr → 1fr` (anima sin conocer el alto; es `grid`, pero una sola propiedad en un elemento pequeño: aceptable). Nunca `max-height: 9999px`. |
| 6 | `.m-up` / `revealUp` (aparecer al bajar) | Cada bloque sube 16 px mientras aparece, uno tras otro con 70 ms; solo la primera vez | **Ya existe** en `web/src/app/globals.css:88-98` como `.aparece` (12 px, `entry 5%–45%`). Pasar a los valores de la maqueta: `@keyframes revealUp { from { opacity: 0; transform: translateY(16px) } to { opacity: 1; transform: none } }` `@supports (animation-timeline: view()) { .aparece { animation: revealUp linear both; animation-timeline: view(); animation-range: entry 0% entry 30% } }`. Escalonado dentro de un grupo: `.aparece > :nth-child(2) { animation-delay: 70ms } :nth-child(3) { 140ms }` (solo para la versión por tiempo `.m-up { animation: up 480ms var(--ease-out) both }`, que se usa cuando el bloque ya está en pantalla al cargar, p. ej. el hero). Sin soporte de `animation-timeline` → se ve quieto y completo (regla de la casa: «falla hacia visible», `globals.css:84-86`). Sin JS. |
| 7 | `.m-price` (cambia el total) | El precio nuevo baja desde arriba y se tiñe un instante del color de marca | `@keyframes flash { 0% { color: var(--acento-oscuro); transform: translateY(-6px); opacity: 0 } 100% { color: #fff; transform: none; opacity: 1 } }` `.m-price { display: inline-block; animation: flash 360ms var(--ease-out) both }`. Para que se repita en cada cambio: `key={total}` en React (remonta el `span`). |
| 8 | `.m-overlay` + `.m-pop` (popup / hoja) | El fondo se oscurece y la tarjeta aparece desde un poco más pequeña; nunca entra de golpe ni desde un lado | `@keyframes fadeIn { from { opacity: 0 } to { opacity: 1 } }` `.m-overlay { animation: fadeIn 240ms both; background: rgba(0,0,0,.6) }` `@keyframes popIn { from { opacity: 0; transform: translate(-50%,-46%) scale(.96) } to { opacity: 1; transform: translate(-50%,-50%) scale(1) } }` `.m-pop { animation: popIn 480ms var(--ease-out) both }`. **En móvil** (nota `popup` de `canvas.json` y clase `.sheet` del panel): hoja desde abajo: `from { transform: translateY(24px); opacity: 0 }`, radio 24 px arriba (`@media (min-width:700px) .sheet { border-radius: 24px }`). Cerrar: lo mismo al revés en 200 ms. Las hojas del panel («Cambiar la fecha», «Pausar o cerrar», «Cancelar») usan este patrón. |
| 9 | `.m-bar` con `[data-playing="true"]` (su voz sonando) | Mientras suena, las barras se mueven como una onda; al pausar se calman | `@keyframes bar { 0%,100% { transform: scaleY(.35) } 50% { transform: scaleY(1) } }` `.m-bar { transform-origin: center; transition: transform 200ms; opacity: .8 }` `[data-playing="true"] .m-bar { animation: bar 900ms ease-in-out infinite }` `.m-bar:nth-child(3n) { animation-delay: -300ms } .m-bar:nth-child(3n+1) { animation-delay: -600ms }`. 20 `<span>` de 3 px con alturas fijas distintas (12–38 px). **No** es la forma de onda real del audio: es decorativa (sin Web Audio). |
| 10 | `.m-leaf` / `.fwdR` `.backL` (pasar la página del libro, solo `/ejemplo`) | La hoja gira sobre el lomo con sombra; el único movimiento lento | Demo: `@keyframes turn { to { transform: rotateY(-180deg) } }` `[data-turn="true"] .m-leaf { animation: turn 700ms var(--ease-io) both }` con `perspective: 1400px` en el padre y `transform-origin: left center`. Página `Ejemplo`: `@keyframes flipR { from { transform: rotateY(-95deg); filter: brightness(.7) } to { transform: none; filter: none } }` `.fwdR { animation: flipR 700ms var(--ease-io) both }` y la página opuesta `.fwdL { animation: fade 500ms 200ms both }` (de `opacity: .2` a `1`); atrás, simétrico (`flipL`/`backR`). En móvil (`EjemploMovil`) la hoja ocupa el ancho entero: mismo flip. Con `prefers-reduced-motion`: cambio de página instantáneo. |
| 11 | hero y heros de landings | El titular, la bajada y el botón entran escalonados al cargar | `@keyframes heroIn { from { opacity: 0; transform: translateY(12px) } to { opacity: 1; transform: none } }` `.h1 { animation: heroIn 700ms var(--ease-out) both } .h2 { … 120ms } .h3 { … 240ms }` (LandingRegalo; en SuVoz `fadeUp` 14 px con 150/300 ms). Solo en el primer pintado, una vez. |
| 12 | eco del botón «Toca y escúchale» (SuVoz, puerta del primer toque) | Dos anillos que se expanden y desaparecen | `@keyframes pulse { 0% { transform: scale(1); opacity: .55 } 100% { transform: scale(1.9); opacity: 0 } }` `.ring { animation: pulse 1800ms var(--ease-out) infinite } .ring2 { animation-delay: 600ms }`. Se para al primer toque (`fadeOut` 320 ms) y entonces se reproduce el audio (el gesto del usuario es obligatorio para el autoplay en móvil). |
| 13 | demo del marco NFC (`Resto`, sección «Su foto, en casa») | Bucle de 7 s: el móvil se acerca, dos anillos, se abre «El libro de Osvaldo», y los pasos 1-2-3 se iluminan | Clases `.nfc-phone` (`nfcPhone 7s var(--ease-out) infinite`: `translate(70%,60%) rotate(8deg)` → `translate(0,0) rotate(-4deg)`), `.nfc-ring`/`.nfc-ring2` (`nfcRing 7s ease-out`, `scale(.4→1.8)`, retraso `.35s`), `.nfc-open` (`nfcOpen 7s`, `translateY(8px)` → 0), `.nfc-bar` (`nfcBar .9s`), `.nfc-s1/.nfc-s2/.nfc-s3` (opacidad `.35 ↔ 1` por turnos). Es decorativo: pausar el bucle cuando la sección no está en pantalla (`animation-play-state: paused` vía `IntersectionObserver` o `content-visibility: auto`), y no renderizarlo con `prefers-reduced-motion`. |
| 14 | vídeo de portada | Empieza cuando está cargado; antes, la imagen fija | `Main.dc.html` (`vidRef`): `muted`, `play()` al `canplay`, y al `ended` espera 3,5 s y vuelve a empezar (no es `loop` seco: hay una pausa sobre el último fotograma). Implementar igual (`onEnded → setTimeout(3500) → currentTime=0; play()`). Ver `RENDIMIENTO.md` 3.6 para la carga diferida y las dos versiones. |
| 15 | rasca-rasca | La capa gris se borra con el dedo/ratón; al 55–60 % se revela entero | Canvas 2D con `globalCompositeOperation = 'destination-out'`; el porcentaje rascado se calcula muestreando el canvas cada N eventos (no en cada `pointermove`). Revelado final con `.m-pop`-like `opacity 320ms`. Solo se carga el JS del rasca cuando el popup va a salir (dynamic import). |

## 3. Por pantalla

| Pantalla | Qué se mueve |
|---|---|
| Portada `/` (`Main`/`Movil` + `Resto`) | Hero: 11 (titular, bajada, botones) + 14 (vídeo). Cabecera: 4 (solapas). Secciones: 6 (`aparece`, por bloque, 70 ms escalonado en las tarjetas de pasos/opiniones). Botones: 1/1b. FAQ: 5. Marco NFC: 13. Reproductor de «Su voz»: 9. CTA sticky móvil: ya existe (`cta-sticky.tsx:56`: `transition-[transform,opacity] duration-300`): ajustar a `320ms var(--ease-out)`. Popup del rasca: 8 + 15 (reglas de cuándo sale en `canvas.json` nota `popup`). |
| `/ejemplo` | 10 (pasar página), 1b en flechas (`.nav:hover translateY(-2px)`, `:active scale(.95)`), 9 en el audio del capítulo. |
| `/comprar`, `/comprar/viaje`, `/regalar` | Paso nuevo: 2 (desde la derecha) **y** `scrollTo(0,0)` al cambiar de paso (la maqueta lo hace: `top()`); barra: 2b; opciones (digital/impreso, para quién, regalo sí/no, fechas): 3; marco: 3 (tarjeta con borde discontinuo → sólido); total del resumen: 7 en cada cambio; **«Pagar»**: al pulsar, `disabled` + texto «Procesando…» con un punto que late (`opacity` 0.4↔1, 900 ms) hasta que llega la URL de la pasarela; **no se puede pulsar dos veces** (regla de la guía). Error de pago (`Casos` 2): el aviso entra con 2 desde abajo. Hojas (dirección): 8. |
| «Pedido confirmado» (`Checkout` paso 4) | Lista de «qué pasa ahora» con 6 escalonado (`.m-up` 70 ms). El tick ✓ con `popIn`. |
| `/entrar` | Cambio de paso (email → enviado → código → dentro): 2 con `translateX(18px)`; el tick final `popIn`. |
| Panel `/tablero*` (`Panel*`) | Al cambiar de momento o de historia: los bloques entran con 2 (`translateY(10px)`, 320 ms, escalonado 60–70 ms por tarjeta: `nth-child`). Línea de tiempo (Pagado → … → Impreso en casa): los segmentos hechos se rellenan con `scaleX` 320 ms `--ease-out` al cargar, en orden. Reproductor «Lo último que contó»: 9. Fotos: al subir, la miniatura aparece con `popIn` 320 ms; aviso «foto pequeña» entra con 2. Hojas «Cambiar la fecha», «Cambiar la dirección», «Pausar o cerrar», «Cancelar»: 8 (hoja desde abajo en móvil, centrada en escritorio). Toast «✓ Guardado» (`hasToast` en `Panel.dc.html`): entra con `translateY(8px)→0` 240 ms, se va a los 3 s con `opacity` 200 ms. Botones: 1/1b; tarjetas pulsables («Leer →»): 3 (`scale(.97)` al tocar). Tema claro/oscuro (si se conserva): sin transición de colores global (parpadea en móviles lentos); cambio instantáneo. |
| `/voz/[token]` (`SuVoz`) | Puerta del primer toque: 12 → al tocar, `fadeOut` 320 ms de la puerta y arranca el audio; cabecera y bloques: 11 (`in1/in2/in3`, 700 ms con 150/300 ms); capítulos (acordeón): 5 (`.m-open`: `fadeUp` 320 ms); audio: 9; barra de progreso de la frase: `width` animado en la maqueta (`prog 58s linear`) → en código usar `transform: scaleX()` ligado a `timeupdate` o una transición por frase (no `width`); foto de fondo con `kb` (`scale(1.04→1.12)` 18 s): solo escritorio y solo sin `prefers-reduced-motion`. |
| Landings de anuncio | Hero: 11; secciones: 6 con `rise` (18 px, `entry 0%–35%`); burbujas del chat: `pop` (8 px + `scale(.98)`, `entry 10%–45%`); reproductor: 9 (1100 ms en estas). Sin popup. |
| `/legal/*` | Solo 5 (acordeón «En corto»/secciones) y 1b. |
| Emails | Sin animación (HTML de email). |

## 4. Reduced motion y accesibilidad

- Regla global, exactamente como en todas las maquetas:
  ```css
  @media (prefers-reduced-motion: reduce) {
    *, *::before, *::after { animation-duration: 1ms !important; animation-iteration-count: 1 !important; transition-duration: 1ms !important; }
  }
  ```
  (`1ms` y no `none`: así los `animation-fill-mode: both` siguen dejando el estado final y nada
  queda invisible). Además, con reduced motion: no cargar el vídeo de portada (póster fijo), no
  renderizar el bucle NFC ni el `kb`, cambio de página instantáneo, onda de audio quieta.
- Foco visible siempre: `:focus-visible { outline: 2px solid var(--acento-oscuro); outline-offset: 2px }`
  (todas las maquetas).
- Nada se oculta esperando una animación que puede no correr: `animation-fill-mode: both` y el
  estado por defecto es **visible** (regla ya escrita en `globals.css:84-86`).
- Las hojas/modales: `role="dialog"`, `aria-modal`, foco al abrir, `Esc` cierra, el fondo no hace scroll.

## 5. Reglas para quien programe (de `Motion.dc.html`, ampliadas)

1. Animar solo `transform` y `opacity` (y colores/borde en transiciones cortas). Nunca `width`,
   `height`, `top/left`, `box-shadow` en bucle, `filter` en bucle.
2. Nada dura más de 480 ms, salvo pasar la página (700 ms) y las entradas de hero (700 ms, una vez).
3. La aparición al bajar se hace una sola vez por bloque (`animation-timeline: view()` con
   `animation-range: entry` lo garantiza: al volver hacia arriba el bloque ya está en su estado final).
4. Todo en CSS. JS solo para: estado (`data-playing`, `data-turn`, paso actual), el vídeo, el rasca
   (import dinámico) y pausar bucles decorativos fuera de pantalla.
5. Sin librerías (`framer-motion`, `gsap`, `lottie`, etc.). Si algo no se puede hacer con CSS,
   se simplifica el movimiento.
6. En el checkout, «Pagar» muestra un indicador mientras procesa y no se puede pulsar dos veces.
7. Comprobar cada animación en un móvil Android de gama media con «Performance» de DevTools
   (CPU ×4): ningún frame > 16 ms por el motion.
