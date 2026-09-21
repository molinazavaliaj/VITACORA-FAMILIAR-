# ROADMAP — Vitácora Familiar

**Proyecto:** Vitácora Familiar
**Brief:** docs/ROADMAP.md (+ ESTADO.md, HERMES.md, docs/handoff-2026-09-20.md)
**Ultima corrida:** —
**Estado:** —

> Este archivo es del agente: las tareas están en orden de dependencia y cada gate se corre
> en esta PC (Windows + git-bash + Node + Python). El roadmap humano (`docs/ROADMAP.md`) no
> se toca. Lo que decide una persona va con el criterio en texto y el motivo en `nota`.
> Método de la casa: una tarea = una rama, test primero, sin push a `main` salvo que la
> tarea diga "mergear" (`HERMES.md`).

## Lo que queda para vos (el piloto NO lo corre)

Estas tareas quedaron marcadas `[!]` a proposito: son decisiones, plata o git que mueve tu
arbol. Cuando resuelvas una, cambia `[!]` por `[ ]` y el piloto la toma.

| | Tarea | Que espera |
|---|---|---|
| T1.1 | ~~commitear «Su voz»~~ | cerrada: ya estaba en su-voz-fabrica |
| T2.1 | mergear la cadena de Su voz | merge con Joaquin |
| T2.2 | aprobar los textos | mail: ✅ aprobado (20a7ba5) · falta el copy del panel y del checkout |
| T2.3 | migracion de Supabase | la aplicas vos en el SQL Editor (falta `20260920000000_narraciones_reemplazada.sql`) |
| T2.4 | worker.ts roto en su-voz-fabrica | necesita el merge de T2.1 |
| T3.2 | healthcheck de la fabrica | tu decision (¿alcanza el panel?) |
| T3.4 | ficha del narrador | decision de los dos socios |
| T4.1 | variables en Vercel | ✅ HECHO por el agente por CLI el 21/09: las 12 PRECIO_* quedaron en Production con los valores de los docs y como Config. Falta el redeploy sin cache (el panel y el carrito quedan con el HTML viejo si no). |
| T3.6 | carrito con `$NaN` | codigo: lo puede cerrar el piloto |
| T3.9 | precios horneados en el build | codigo: lo puede cerrar el piloto |
| T3.10 | middleware.ts deprecado (Next 16) | codigo: lo puede cerrar el piloto |
| T3.11 | Redirect URLs de Supabase | decision tuya en Supabase |
| T3.7 | /admin vuelve al carrito | codigo: lo puede cerrar el piloto |
| T3.8 | sin boton Salir en el panel | codigo: lo puede cerrar el piloto |
| T5.1 - T5.4 | los pilotos con personas reales | vos y Joaquin |
| T6.1 - T6.3 | Stripe, autónoma, rotar keys | vos |

Lo que SI puede correr el piloto hoy: **T1.3, T3.1, T3.3, T3.5** (y T1.4 apenas cierre T1.3).

---

## Fase 1 — El borde de la entrega (fábrica y entrevistador)

- [x] **T1.1** — fábrica: commitear «Su voz» (frases, QR, mail de los 15 días) en su rama
  - deps: —
  - tamaño: S
  - hecho-cuando: `cd fabrica && npx vitest run && npx tsc --noEmit -p .`
  - evidencia: —
  - espera: Naza decide en que rama se commitea «Su voz» — el arbol tiene trabajo suyo sin commitear y el piloto no lo mueve solo. el trabajo está en el árbol **sin commitear**: `fabrica/src/libro/qr.ts`, `fabrica/src/mail/frases.ts`, `fabrica/src/libro/token-voz.ts` (nuevos, con sus tests) y `frases.ts`, `generar-paquete.ts`, `plantilla-html.ts`, `worker.ts` modificados. Medido hoy: 412 tests en verde. Ojo: no commitear `.agents/`, `skills-lock.json` ni los `.verif-3b6markup-*.html`.

  - evidencia: verificacion humana (2026-09-21): el trabajo de «Su voz» YA estaba commiteado en la rama `su-voz-fabrica`. 23 de los 24 archivos modificados y los 6 nuevos son IDENTICOS byte a byte a esa rama (git hash-object contra git show su-voz-fabrica:archivo), en los commits 2254fc4 (Task 4) y 1366c6e (Task 6). Lo que se veia como "sin commitear" era el contenido de su-voz-fabrica sentado en el arbol de panel-de-la-empresa: commitearlo habria metido Su voz dentro de la rama del panel. Arbol limpiado con git stash push -u -- fabrica voz docs (stash@{0}, recuperable). El unico archivo distinto de esa rama era fabrica/src/worker.ts (8 lineas).
  - cerrada: 2026-09-21
  - nota (original, hoy desmentida): el trabajo estaba "sin commitear" en el arbol; en realidad eran las versiones de su-voz-fabrica. No commitear `.agents/`, `skills-lock.json` ni los `.verif-3b6markup-*.html`.
- [ ] **T1.2** — fábrica: el tope de 50 MB de Storage se mira en toda subida
  - deps: T1.1
  - tamaño: M
  - hecho-cuando: `cd fabrica && npx vitest run`
  - evidencia: —
  - nota: bitácora #38 — el chequeo vive en `fabrica/src/audio/audiolibro.ts` (`entraEnStorage`/`enMb`/`esErrorDeTamano`) y lo miran las dos subidas de audio. Un archivo grande del paquete (frases, PDF) descubre el tope tarde y sin decir por qué.

- [ ] **T1.3** — entrevistador: cerrar sin depender de que WhatsApp responda
  - deps: —
  - tamaño: M
  - hecho-cuando: `cd entrevistador && npx vitest run && npx tsc --noEmit -p tsconfig.json`
  - evidencia: —
  - nota: `entrevistador/src/flujo/cierre.ts:21` manda la despedida y **después** pone `completado`, sin try/catch (`procesar.ts:288`). Si Meta falla, el narrador queda `activo`, la fábrica no arranca y nadie avisa (bitácora #31). El estado no puede depender del envío; el texto de la despedida ya lo aprobó Naza.

- [ ] **T1.4** — entrevistador: el trato que decide el modelo no puede tumbar el día
  - deps: T1.3
  - tamaño: S
  - hecho-cuando: `cd entrevistador && npx vitest run` y `cd entrevistador && npm run manual -- cargar` con un pedido de prueba no corta el flujo
  - evidencia: —
  - nota: `tratoDe` (`entrevistador/src/ia/trato.ts`) lo llama el camino de cada respuesta. Si el modelo falla dos veces tiene que devolver el default documentado (`usted`) y no tirar. Verificar con la puerta manual, que **no** manda nada por WhatsApp (los narradores reales están esperando la API).

## Fase 2 — Su voz: la web de Joaquín

- [!] **T2.1** — mergear la cadena de ramas de Su voz (cuatro ramas, una arriba de la otra)
  - deps: T1.1, T1.2
  - tamaño: S
  - hecho-cuando: en un worktree de la rama, `cd web && npx vitest run && npx tsc --noEmit`
  - evidencia: —
  - espera: Naza/Joaquin: mergear es historia compartida. El piloto prepara la rama y verifica, pero el merge lo decide una persona. **esta tarea dice mergear.** El orden real en `origin` es `su-voz-web-checkout` → `su-voz-web-panel` → `alta-contexto-minimo` → `su-voz-textos` (verificado: cada una es ancestro de la siguiente) y encima va `panel-viaje`. **No** mergear `su-voz-textos` sola sobre `main`: viene 60 commits atrás y reescribe cosas ya mergeadas. Ahí están `/tablero/[id]/frases`, `/voz/[token]`, el checkout sin audiolibro y el año de nacimiento en el alta. Hoy en `web/`: 338 verde.

- [!] **T2.2** — textos nuevos a Naza: el mail de los 15 días y el copy del diff
  - deps: T2.1
  - tamaño: S
  - hecho-cuando: Naza aprueba el mail de los 15 días y el copy de «Su voz» y del checkout
  - espera: Naza aprueba el mail de los 15 dias y el copy de Su voz/checkout (texto, no codigo). `fabrica/src/mail/frases.ts` lo dice en su cabecera: "TEXTO PENDIENTE DE APROBACIÓN DE NAZA". Está en rioplatense y los otros mails de la casa están en castellano neutro de "tú": hay que decidir la voz antes de publicar (regla de la casa, `HERMES.md` punto 3). El asunto y los tres párrafos están escritos; se muestran tal cual.

  - progreso: (2026-09-21) el mail de los 15 dias QUEDO APROBADO con un cambio de Naza: el parrafo 1 ahora dice "y las mejores historias con su voz ya se pueden escuchar" en vez de "las frases de «Su voz»". Commiteado en la rama su-voz-fabrica: 20a7ba5. Verificado con el gate de la casa: 8/8 del test del mail y 340/340 de los tests ejecutados de fabrica.
  - falta: el copy de «Su voz» del panel y el del checkout, que todavia no vio. Ademas queda abierta la voz del mail (este habla en rioplatense; los otros mails de la casa estan en castellano neutro de "tu").
  - evidencia: —
- [x] **T2.3** — migraciones de `supabase/migrations/`: decir cuál falta y aplicarla
  - deps: T2.2
  - tamaño: S
  - hecho-cuando: en el SQL Editor de Supabase, `\d narraciones` muestra el check narraciones_estado_check con 'reemplazada' entre los valores aceptados (criterio HUMANO: no se puede verificar desde afuera: un filtro no valida constraints)

  - hallazgo: el gate que habia escrito el planificador estaba MAL: pedia una columna `narraciones.reemplazada` que esa migracion NO crea (solo cambia la lista de valores del check de `estado`). Contra la base viva el 2026-09-21: select=reemplazada devuelve 42703 column does not exist. Un filtro estado=eq.reemplazada devuelve 200 pero NO prueba nada: los check constraints solo se evaluan al escribir, nunca al leer.
  - verificado: las otras migraciones SI estan aplicadas (respuestas.reservada/reservado_tramo/tema_de_orden/tema_motivo, consumo_ia, gastos_manuales, pedidos.extras -> HTTP 200; latidos existe y late). Falta solo esta.
  - evidencia: —

  - evidencia: aplicada y verificada el 2026-09-21. Naza corrio la migracion en el SQL Editor ("Success. No rows returned") y despues la verificacion, que devolvio textualmente: CHECK ((estado = ANY (ARRAY['pendiente'::text, 'procesando'::text, 'lista'::text, 'fallida'::text, 'reemplazada'::text]))). 'reemplazada' esta en la lista, asi que la fabrica ya puede marcar una narracion vieja como reemplazada sin que la base la rechace.
  - cerrada: 2026-09-21
- [!] **T2.4** — fábrica: arreglar el `worker.ts` que la rama de Su voz dejó roto
  - deps: T2.1
  - tamaño: S
  - espera: se resuelve con el merge de T2.1 (el arreglo necesita codigo que hoy solo vive en panel-de-la-empresa). Decision humana por eso.
  - hecho-cuando: `cd fabrica && npx vitest run` sale verde incluyendo test/worker.test.ts y test/anticipo-worker.test.ts
  - hallazgo: la rama su-voz-fabrica tiene 2 archivos de test que NO CARGAN (no fallan: no llegan a correr): test/worker.test.ts y test/anticipo-worker.test.ts, con TypeError al importar src/worker.ts. Medido el 2026-09-21: 340 tests pasan, 2 archivos rojos; el planificador habia medido 412 en verde porque lo midio sobre el arbol de trabajo, que tenia la version buena de worker.ts sin commitear.
  - causa: el worker.ts commiteado en su-voz-fabrica tiene la llamada a recordarFrasesPendientes fuera de la funcion del tick, y la version que lo arregla importa ./latido.js — pero fabrica/src/latido.ts NO existe en su-voz-fabrica (si en panel-de-la-empresa). O sea: el trabajo de Su voz depende de codigo del panel, y por eso no se puede arreglar en la rama sola.
  - ubicacion: la version buena de worker.ts quedo guardada en el stash@{0} de panel-de-la-empresa (git stash show -p stash@{0} -- fabrica/src/worker.ts).
  - evidencia: —
## Fase 3 — Lo que frena el lanzamiento del 15 de octubre

- [ ] **T3.1** — web: la muestra pública aplica `edicion.titulosCapitulos`
  - deps: —
  - tamaño: S
  - hecho-cuando: `cd web && npx vitest run`
  - evidencia: —
  - nota: bitácora #36, el pendiente que quedó abierto: `web/src/lib/muestra.ts` lista los capítulos por `ordenCapitulos` y el panel sí aplica los títulos. La dueña renombra "Los hijos" y el link público dice otra cosa. Lo consume `web/src/app/libro/[token]/page.tsx`.

- [x] **T3.2** — fábrica: healthcheck de verdad (bitácora #32)
  - deps: —
  - tamaño: M
  - hecho-cuando: `cd fabrica && npx vitest run`
  - evidencia: —
  - espera: Naza decide si los `latidos` del panel alcanzan como diagnostico o hace falta aviso automatico. la fábrica **no tiene servidor HTTP** (verificado: no hay `createServer`/`listen` en `fabrica/src`), así que el healthcheck no puede ser una ruta. `latidos` ya existe desde el panel de la empresa (parte A): la decisión es si el panel alcanza como diagnóstico o si además hace falta un aviso automático. Esa decisión es de Naza; el código del aviso, de la fábrica.

  - evidencia: decision de Naza (2026-09-21): los latidos del panel alcanzan como diagnostico, no hace falta aviso automatico. Verificado en la base viva: la tabla `latidos` existe, esta keyed por `servicio` y el entrevistador tenia ping del 2026-09-21T15:00. Cero codigo nuevo: el diagnostico ya existia.
  - cerrada: 2026-09-21
- [ ] **T3.3** — fábrica: la paleta nueva en la plantilla del libro (3.8)
  - deps: —
  - tamaño: M
  - hecho-cuando: `cd fabrica && npx vitest run`
  - evidencia: —
  - nota: los 7 cambios están especificados **línea por línea** en `docs/design.md` §7 (hoy el archivo sigue con `--papel: #faf7f1`, `--acento: #6e2618` y la frase "se lee con los ojos y se escucha con su voz" que ya se borró de la marca). El trabajo de verdad no son las 5 líneas: el vino jerarquiza en 15 lugares y hay que reponer esa jerarquía con grosor, tamaño y aire. El gate cierra el código; **la maqueta impresa la mira Naza** antes de darlo por bueno.

- [!] **T3.4** — web: el alta pide la ficha del narrador (bitácora #1, grave)
  - deps: T2.1
  - tamaño: S
  - hecho-cuando: `cd web && npx vitest run && npx tsc --noEmit`
  - evidencia: —
  - espera: Decision de los dos socios: donde se completa la ficha del narrador (docs/ficha-del-narrador.md §7). el pedido de campos está en `docs/ficha-del-narrador.md` §5 y §6; el año de nacimiento ya viene en `alta-contexto-minimo` (T2.1). Un cliente real compra hoy y arranca con la ficha vacía: sin ella el modelo oye "llegando de la URA" y el trato sale en usted. `docs/ficha-del-narrador.md` §7 deja abierto **dónde** se completa (decisión de los dos socios): si no está tomada, la tarea va a `[!]` con esa pregunta.

- [ ] **T3.5** — entrevistador: la vía automática transcribe con la ficha
  - deps: —
  - tamaño: S
  - hecho-cuando: `cd entrevistador && npx vitest run && npx tsc --noEmit -p tsconfig.json`
  - evidencia: —
  - nota: `procesar.ts:220` llama `transcribirYActualizar(id, audio, undefined, narrador.id)` — sin prompt. La puerta manual sí lo pasa (`manual.ts:475`, `promptDeTranscripcion(n.contexto, n.como_le_dicen)`): son ~2 líneas y es lo que arregla los nombres propios mal transcriptos (bitácora #17, grave). El modelo ya es `gpt-transcribe` y la duración viene en `usage.seconds`.


- [x] **T3.6** — web: el carrito muestra `$ NaN` cuando un precio del entorno viene mal
  - deps: —
  - tamaño: S
  - hecho-cuando: `cd web && npx vitest run` con un test nuevo que, con un valor invalido en `PRECIO_EUR` o `PRECIO_ARS` (ej. '"49"' entre comillas, o '49,00'), verifique que el catalogo NO ofrece el PDF o que el total nunca es NaN
  - nota: sin AUTOPILOT_RESULT (exit 0); ver 20260921-180348-T3.6.txt
  - evidencia: 
  - nota-ambiental: `extras:[]` en las dos regiones dice que ademas NO hay ningun extra cargado en produccion (impreso, color, marco) y el audiolibro no se ofrece. Eso es variable de entorno faltante en Vercel (Production), no codigo: se revisa con Naza en la pantalla de Environment Variables. Esta tarea arregla que un valor mal escrito NO rompa la tienda; no carga los precios.
  - en-disco: .agents/, .autopilot/, ROADMAP-AGENTE.md, skills-lock.json

  - evidencia: HECHA por el piloto (2026-09-21), verificada por mi. Rama `web-carrito-precio-invalido`, commit d43141a. Test primero: con '49' entre comillas, '49,00', '0', '-5' e 'Infinity' en PRECIO_EUR/PRECIO_ARS el test daba 29 fallidos / 5 pasados; despues de la validacion da 34/34. Gate completo: `cd web && npx vitest run` -> 368 verde + 1 skipped (eran 338), `npx tsc --noEmit` -> exit 0. Verifique el codigo: `precioValido()` en web/src/lib/precios.ts lo usan las CUATRO funciones de precio, y avisa por consola cuando el valor es invalido. Payload medido con env basura: ES `precio:49`, AR `precio:85.75` (antes `$NaN` en las dos regiones).
  - decision-de-diseno: un precio ilegible ahora vale el default de la casa (49 EUR / 49999 ARS) con un aviso en los logs, en vez de no ofrecer el producto. El motivo: el PDF es el unico producto obligatorio, asi que sacarlo dejaria la tienda sin nada que comprar.
  - cerrada: 2026-09-21
- [x] **T3.7** — web: entrar al panel desde /admin tiene que volver a /admin
  - deps: —
  - tamaño: S
  - hecho-cuando: `cd web && npx vitest run`
  - nota: Base: origin/main 6b1007f (despues del fetch); T3.6 sigue en su rama web-carrito-precio-invalido, no incluida. No agregue emailRedirectTo: el callback solo respeta ?volver si un link lo trae (decision humana por la lista de Redirect URLs de Supabase). Efecto lateral: una ruta inventada bajo /admin ahora da 307 -> /entrar en vez de 404 (el proxy corre antes), asi que el chequeo de deploy 307 vs 404 ya no sirve para /admin. Y src/middleware.ts esta deprecado en Next 16.3.4 (ahora es proxy.ts): conviene migrarlo en su propia tarea.
  - evidencia: cd web && npx vitest run -> 47 archivos verde | 1 skipped, 393 tests verde | 1 skipped (baseline 376) y npx tsc --noEmit exit 0; el test nuevo web/test/entrada-vuelve.test.ts (17 casos) arranco en rojo con los 4 fallos exactos (proxy sin redirigir /admin, layout 'REDIRECT /entrar' pelado, callback a /comprar) y quedo verde con el arreglo. Commit 58733ef en la rama web-admin-vuelve-a-admin. | gate `cd web && npx vitest run`: OK; exit 0
  - cerrada: 2026-09-21T18:16:01+02:00
  - commit: 58733ef

- [x] **T3.8** — web: boton "Salir" en el panel de la empresa
  - deps: —
  - tamaño: S
  - hecho-cuando: `cd web && npx vitest run`
  - nota: El enlace es un <a> a /api/auth/salir (Route Handler GET) y no un <Link>, igual que en /tablero, para que Next no lo prefetchee ni lo cuente como pantalla. Texto visible: Salir (el del titulo de la tarea); si Naza quiere el mismo que el sidebar del cliente habria que cambiarlo a Cerrar sesion. Falta la mirada a ojo en produccion: /admin con sesion abierta -> Salir -> vuelve a la landing.
  - evidencia: Test primero en web/test/admin-nav.test.tsx: rojo con 1 fallo (el nav no tenia href=/api/auth/salir) y verde con el arreglo. Gate cd web && npx vitest run -> 46 archivos verde | 1 skipped, 378 tests verde | 1 skipped (baseline 376) y npx tsc --noEmit exit 0. Commiteado en b12b3f5 sobre la rama web-admin-salir (base origin/main 6b1007f), sin push. | gate `cd web && npx vitest run`: OK; exit 0
  - cerrada: 2026-09-21T18:18:40+02:00
  - commit: b12b3f5

- [ ] **T3.9** — web: los precios tienen que leerse al momento del pedido, no quedar horneados en el build
  - deps: —
  - tamaño: S
  - hecho-cuando: `cd web && npx vitest run` y el catalogo de /comprar se arma en cada request (no prerenderizado)
  - nota: hallazgo del 2026-09-21 probando produccion. El carrito servia `"precio":"$NaN"` y lo siguio sirviendo DESPUES de cargar bien las variables en Vercel y redeployar. Verificado con `vercel env pull`: `PRECIO_EUR="49"` esta en Production, es de tipo Config (o sea legible en build), y el build corrio igual. Conclusion: el catalogo se arma en BUILD (comprar/page.tsx no usa ninguna API dinamica, asi que Next prerenderiza la pagina) y el HTML generado queda cacheado y se recicla en el proximo deploy. Consecuencia de producto: la promesa escrita en web/src/lib/productos.ts ("Prender uno es cargar su variable de entorno en Vercel - nada mas") hoy es FALSA: cargas un precio y no se ve hasta que se invalide la cache. Arreglo: leer el catalogo en cada request (`export const dynamic = "force-dynamic"` en comprar/page.tsx, o `unstable_noStore()`/`revalidate = 0`) y probarlo con un test que arme el catalogo dos veces con valores distintos. Va junto con T3.6: uno evita el NaN, este evita que el precio quede congelado.
  - evidencia: —

- [ ] **T3.10** — web: migrar `src/middleware.ts` a `proxy.ts` (deprecado en Next 16.3.4)
  - deps: —
  - tamaño: S
  - hecho-cuando: `cd web && npx vitest run && npx tsc --noEmit && npm run build` sin el aviso de deprecacion de middleware
  - nota: lo reporto el piloto cerrando T3.7 (2026-09-21): Next 16.3.4 avisa en cada arranque 'The "middleware" file convention is deprecated. Please use "proxy" instead' y sugiere `npx @next/codemod@canary middleware-to-proxy .`. No es urgente pero suma ruido en cada build y va a romper en la proxima mayor. Ojo: la app depende del matcher (`["/tablero/:path*", "/admin/:path*", "/comprar", "/entrar"]`) para proteger, asi que la migracion tiene que mantener el matcher exacto y sus tests.
  - evidencia: —

- [!] **T3.11** — decidir las Redirect URLs de Supabase para poder volver a /admin despues del login
  - deps: —
  - tamaño: S
  - espera: decision humana (Naza): hay que agregar el dominio propio a la lista de Redirect URLs de Supabase para que un link del mail pueda traer `?volver=`. El piloto cerro T3.7 sin agregar `emailRedirectTo` justamente por esto.
  - hecho-cuando: en Supabase, Authentication -> URL Configuration, la lista de Redirect URLs incluye el dominio de produccion, y un link del mail que vuelve a /admin funciona
  - nota: el flujo por codigo de 6 digitos (el que usa hoy la gente) YA funciona sin esto: `entrar/formulario.tsx` verifica el OTP en el cliente y hace `router.push(destino)`. Esto solo hace falta para el camino del link del mail. Decision de Naza porque toca configuracion de Supabase, no codigo.
  - evidencia: —

- [x] **T3.12** — web: el webhook de MercadoPago tiene que aceptar GET (hoy devuelve 405)
  - deps: —
  - tamaño: S
  - hecho-cuando: `cd web && npx vitest run test/webhook-mp.test.ts && npx tsc --noEmit` desde la raiz del repo: exit 0, con un test que pruebe que un GET a /api/webhooks/mercadopago NO devuelve 405 y que entra por el mismo camino que el POST
  - nota: Rama web-webhook-mp-get desde origin/main 6b1007f, commit ca0bd58, sin push. Limite declarado y fijado en un test: con MP_WEBHOOK_SECRET cargado, un GET sin firma da 401 en vez de 405 (ya no choca con Next, pero no procesa el pago). La doc de MP dice que las notificaciones IPN reciben x-signature pero NO se pueden validar con la clave secreta, asi que si la notificacion que importa es una IPN sin firma esto necesita decision humana: mirar los logs de Vercel de esa notificacion (si traia x-request-id o solo ?topic=payment&id=) y decidir si ese metodo salta el candado de la firma, sabiendo que la verdad del pago se sigue consultando contra MP con nuestro token. No toque la firma ni el camino de confirmacion; los 6 tests viejos de pagos.test.ts siguen verde. T3.13 (loguear cada salida) sigue siendo el complemento natural.
  - evidencia: Test primero web/test/webhook-mp.test.ts: rojo 7/8 (TypeError GET is not a function) y verde 8/8 despues del refactor. Gate cd web && npx vitest run test/webhook-mp.test.ts && npx tsc --noEmit -> exit 0. Suite completa de web: 47 archivos verde, 384 tests verde. Verificado ademas con next dev real (A/B con el archivo viejo y el nuevo): codigo viejo GET->405, codigo nuevo GET->200 y GET ?topic=payment&id=->500, POST->200 en los dos.
  - cerrada: 2026-09-21T20:24:35+02:00
  - commit: ca0bd58

- [x] **T3.13** — web: el webhook tiene que LOGUEAR todos los caminos de salida (hoy los dos casos graves son mudos)
  - deps: T3.12
  - tamaño: S
  - hecho-cuando: `cd web && npx vitest run test/webhook-mp.test.ts && npx tsc --noEmit` desde la raiz: exit 0, con tests que verifiquen que cada salida sin confirmacion deja una linea de log con el motivo
  - nota: Rama web-webhook-mp-log desde la rama actual ca0bd58 (T3.12, su dependencia), commit 9122dd6, sin push: el merge de las dos ramas va en orden (primero web-webhook-mp-get). Formato de la linea fijado por los tests: 'webhook mercadopago: <motivo> | metodo= id= origen= firma= pago=', con origen=query|cuerpo (lo que separa el Webhooks nuevo del IPN viejo) y pago= lo que contesto MP. No cambie ningun status code, ni la firma, ni el camino de confirmacion; el texto viejo 'webhook mercadopago: firma invalida, se ignora' quedo igual con los campos atras. Verifique que los tests muerden: 7 mutaciones (sacar la linea de cada salida, borrar el marcador ' | metodo=', cambiar un motivo) hacen caer tests, y el archivo restaurado queda con el mismo SHA-256. El 405 que daba Next sigue fuera del handler (no se puede loguear desde adentro): eso lo cerro T3.12. Queda la revision previa al merge que pide el metodo del repo.
  - evidencia: Test primero: los 8 tests nuevos de web/test/webhook-mp.test.ts en rojo (las 8 salidas daban 0 lineas) y verde 16/16 despues del logging. Gate cd web && npx vitest run test/webhook-mp.test.ts && npx tsc --noEmit -> exit 0; suite web completa 47 archivos verde, 392 tests verde. Ademas verificado contra un next dev real: POST sin id -> 200 con WARN 'no trae id de pago … | metodo=POST id=ninguno origen=ninguno firma=no-evaluada pago=no-consultado', GET ?topic=payment&id=999999 -> 500 con ERROR 'no se pudo consultar el pago a Mercado Pago | metodo=GET id=999999 origen=query pago=error'.
  - cerrada: 2026-09-21T20:30:43+02:00
  - commit: 9122dd6

- [ ] **T3.14** — bot: si Meta rechaza la plantilla de la pregunta de la noche, mandarla como texto dentro de las 24 h
  - deps: —
  - tamaño: M
  - hecho-cuando: `cd fabrica && npm test` desde la raiz del repo: exit 0, con un test que cubra el caso 'plantilla rechazada o PENDING' y verifique que la pregunta sale como texto libre en vez de no salir
  - nota: lo pidio Joaquin (21/09): las plantillas siguen todas en PENDING, asi que hoy la pregunta de la noche no se manda. Ventana: se puede mandar como texto si el narrador escribio en las ultimas 24 h. OJO: es una decision de producto tomada por Joaquin, no una interpretacion del agente; si hay dudas de si el texto libre afecta la calidad del numero de WhatsApp, preguntar antes de implementar.
  - evidencia: —

- [!] **T3.15** — decidir qué hacer con la firma de las notificaciones IPN de MercadoPago
  - deps: —
  - tamaño: S
  - espera: decision humana (Naza o Joaquin). La doc de MP dice que las notificaciones IPN traen `x-signature` pero NO se pueden validar con la clave secreta del webhook. Con T3.12, un GET con `?id=` sin firma valida ahora da **401** en vez de 405: el pago sigue sin procesarse, pero al menos deja rastro.
  - hecho-cuando: criterio en texto: decidido y aplicado si (a) el panel de MP se configura con **Webhooks** (POST con `?data.id=`, firma validable) — el camino preferido — o (b) las notificaciones IPN sin firma validable **saltan** el candado de la firma, confiando en el segundo candado, con su test correspondiente
  - nota: hallazgo del piloto al cerrar T3.12 (2026-09-21). El (b) es defendible porque el diseño ya tiene DOS candados y el segundo es el que manda: nunca se confia en el payload de la notificacion, se consulta el pago directo contra la API de MP con nuestro token. Lo que se pierde con (b) es el freno de entrada: cualquiera que sepa la URL podria hacernos consultar pagos a MP (abuso de rate limit), pero no puede confirmar un pedido ni cobrar nada. ANTES de decidir hace falta saber que esta mandando MP: se mira en el panel (Tus integraciones -> Webhooks vs Notificaciones IPN). Los logs de Vercel NO alcanzan para eso: el CLI expone metodo, ruta y status, pero no la query string ni los headers.
  - evidencia: —
## Fase 4 — Paneles y viaje (trabajo listo esperando variables)

- [!] **T4.1** — panel de la empresa: las cuatro variables en Vercel y la pasada de ojo
  - deps: —
  - tamaño: S
  - hecho-cuando: Naza carga `ADMIN_EMAILS` (los dos mails), `CAMBIO_EUR_ARS`, `CAMBIO_USD_EUR` y `CAMBIO_FECHA` en Vercel, entra a `/admin` con su mail y ve las cinco pantallas con datos reales (y con un mail que no está en la lista, la pantalla que dice que no)
  - evidencia: —
  - espera: Naza carga 4 variables en Vercel y mira las 5 pantallas con su mail. el código ya está en `main` (el panel de la empresa y su rama quedaron mergeados: HEAD `a378d84` es ancestro de `main`). El paso a paso está en `docs/handoff-panel-empresa.md`. Sin las variables del cambio, Plata y Gastos muestran los números sin convertir y lo avisan: es correcto, no un bug. Hallazgo cerrado por Naza el 2026-09-21: los 8 pagos pendientes de hasta 7 dias en pesos son TODOS PRUEBAS, no plata real. Ninguna accion sobre ellos.

## Fase 5 — Los pilotos (personas: nada de esto lo cierra un comando)

- [!] **T5.1** — Imma a la lista de permitidos y su bienvenida
  - deps: —
  - tamaño: S
  - hecho-cuando: Imma entra a la lista de permitidos de Meta (máx. 5) y su número en la base queda como lo tiene Meta; la bienvenida le llega y responde
  - evidencia: —
  - espera: Persona (Naza): Imma a la lista de Meta — maximo 5 numeros. persona (Naza). Es lo único que falta de la 1.4 del roadmap humano (Joaquín y Dora ya están). La bienvenida sale sola al aprobarse la plantilla: hay que avisarle **antes**, y cada destinatario confirma con un código de 6 dígitos que le llega por WhatsApp (a un abuelo hay que llamarlo para que lo dicte).

- [!] **T5.2** — las plantillas de Meta: revisión y edición de `bienvenida`
  - deps: —
  - tamaño: S
  - hecho-cuando: las plantillas de la WABA nueva están aprobadas (sin `#132001`) y `bienvenida` ya pide el permiso de voz
  - evidencia: —
  - espera: Persona (Joaquin): editar y aprobar la plantilla `bienvenida` en Meta. persona (Joaquín). El 20/09 las 5 se clonaron a la WABA "Vitácora" y quedaron **en revisión**: hasta que no salgan, cada envío de plantilla falla. Editar `bienvenida` con el cuerpo nuevo la devuelve a revisión: es la condición para prender `WA_BIENVENIDA_PIDE_VOZ` en Railway (3t.15) y sin eso `consentimiento_voz_at` queda vacío y la fábrica no clona ninguna voz.

- [!] **T5.3** — el pago real de prueba, y devolverlo
  - deps: —
  - tamaño: S
  - hecho-cuando: entre los dos hacen un pago real en producción y el pedido queda `pagado` (no `pendiente`); después se devuelve
  - evidencia: —
  - espera: Personas: un pago real de produccion y su devolucion. personas (Joaquín + Naza). Es el último paso del cobro argentino (8.3) y también la prueba de `MP_WEBHOOK_SECRET` (8.6): si el pedido queda "pendiente" con el pago aprobado, es la clave de prueba en vez de la de producción. El primer viajero que pague de verdad también cuenta.

- [!] **T5.4** — el flujo automático completo, con un narrador de verdad
  - deps: T5.1, T5.2
  - tamaño: M
  - hecho-cuando: un narrador real recibe la pregunta por el número de producción, la responde por audio y el día avanza solo (sin `npm run manual`)
  - evidencia: —
  - espera: Personas: un narrador real recorriendo el flujo completo. personas. Es la señal de que el circuito quedó cerrado — la que el `ESTADO.md` viene esperando desde el 16/09. Se corre con `contexto.modoRapido = true` (las 30 respuestas entran en 7-10 días) y respetando la ventana de 24 h de WhatsApp. No correr narraciones contra la PC de música "para probar": son horas de GPU.

## Fase 6 — Plata y decisiones abiertas

- [!] **T6.1** — Naza se da de alta como autónoma en España y abre Stripe
  - deps: —
  - tamaño: M
  - hecho-cuando: la cuenta de Stripe existe y Joaquín cargó `STRIPE_SECRET_KEY` y `STRIPE_WEBHOOK_SECRET` en Vercel con el webhook apuntado
  - evidencia: —
  - espera: Persona (Naza): alta de autonoma en Espana + cuenta de Stripe. persona (Naza). Está decidido el 20/09 (Stripe directo; Shopify descartado). El código ya existe: falta la cuenta. Si el alta se demorara, el plan B es un merchant of record (Lemon Squeezy / Paddle) y hay que confirmar si le paga a Argentina — eso es la 8.5, de Joaquín.

- [!] **T6.2** — rotar la key de Anthropic que estuvo en el Railway viejo
  - deps: —
  - tamaño: S
  - hecho-cuando: la key vieja de Anthropic está revocada y los servicios usan una nueva (comparar con `==`: nunca imprimir el valor)
  - evidencia: —
  - espera: Persona (Naza): revocar y rotar la key de Anthropic. persona (Naza). Bitácora #37 y `GASTOS.md`: esa key quedó cargada en el proyecto que escribió el libro de Joaquín sin aprobación. `GASTOS.md` pide además unificar las keys en una organización del proyecto y recargar crédito antes del próximo libro.

- [!] **T6.3** — cortar la sangría: plan Hobby de Railway y key de OpenAI
  - deps: —
  - tamaño: S
  - hecho-cuando: el plan Hobby de Railway de Naza está cancelado antes del 1/10 y la key de OpenAI que salió impresa en un chat está rotada (en Railway `VITACORA-FAMILIAR-` → `OPENAI_API_KEY`, la fábrica la sigue por referencia)
  - evidencia: —
  - espera: Personas: cancelar el plan Hobby de Railway y rotar la key de OpenAI. personas (Naza cancela, Joaquín rota). El plan quedaría cobrándose solo; la key impresa es la del 19/09 y la fábrica la resuelve por referencia, así que se rota en un solo lado.

---


- **Vitácora de viaje** (`origin/panel-viaje`, arriba de `su-voz-textos`): el código está; le faltan la plantilla `bienvenida_viaje` en Meta y `PRECIO_VIAJE_ARS=78750`, `PRECIO_VIAJE_EUR=45` y `NEXT_PUBLIC_WA_NUMERO` en Vercel, más la primera corrida real (el viajero paga de verdad). Cuando T5.4 cierre, esto es lo siguiente.
- **El archivo de la PC de música**: en `voz/` hay 4 archivos modificados y 2 nuevos (`voz/frases.py`, `voz/procesar_frases.py`, `tests/test_frases_cita13.py`, `tests/cita13_3691baf4.json`) que son un parche de ella sin commitear. Por `HERMES.md`: se aplican con `git am` en una rama, se revisan y recién ahí se mergean — no se toca `voz/` desde acá. La suite hoy: 162 verde.
- **Bitácora #36 (resto) y #17**: los nombres propios mal transcriptos siguen siendo la única red del panel de nombres; T3.5 es la mitad barata.

---
