# De qué anuncio vino la compra: ya no se guarda nada en el navegador (19/10)

Para el abogado y Naza. Contexto en `para-el-abogado.md` §4 y §6.3. Rama `rediseno-web-origen`.

## Qué cambió

| | Antes (14/10) | Ahora (19/10) |
|---|---|---|
| Dónde se guarda | `localStorage`, clave `vitacora-origen` | En ningún almacenamiento del navegador. Solo en la memoria de la página (una variable del código) |
| Cuánto dura | 30 días desde la primera visita con anuncio | Lo que dura la visita. Navegar por la web con los enlaces internos lo conserva; recargar, abrir otra pestaña o cerrar lo borra |
| Visitas en días distintos | Primer toque y último toque entre visitas | Solo dentro de la misma visita |
| Llegar directo al checkout desde un anuncio | Se tomaba | Se toma (el checkout lee también la URL actual) |
| Qué viaja con la compra | `pedidos.extras.origen` = `{ primero, ultimo? }` | Igual, mismo formato. No cambió la API ni la base |
| Quien ya tenía la clave vieja | — | Al entrar a la web se borra `vitacora-origen` de su `localStorage`, sin leerla |
| Cookies, sessionStorage, IndexedDB | No se usaban para esto | Siguen sin usarse para esto (hay una prueba que lo controla) |

Código: `web/src/lib/origen.ts`, `web/src/app/origen-visita.tsx`. Pruebas: `web/test/origen.test.ts`.

## Texto de la política de privacidad, §12 (Cookies / Galetes)

Se agregó una frase después de la del formulario de compra. El resto del párrafo queda igual.

**es (tú)**

- Antes: «… Mientras compras, el navegador guarda en esa pestaña lo que vas rellenando, para no perderlo si vuelves atrás; se borra al cerrarla. No usamos cookies de publicidad ni de analítica, …»
- Después: «… Mientras compras, el navegador guarda en esa pestaña lo que vas rellenando, para no perderlo si vuelves atrás; se borra al cerrarla. **Si llegas a la web desde un anuncio, recordamos de cuál solo mientras dura esa visita, sin guardar nada en tu navegador. Si compras en esa misma visita, lo anotamos con tu pedido para saber qué anuncios funcionan.** No usamos cookies de publicidad ni de analítica, …»

**ar (vos)**

- Antes: «… Mientras comprás, el navegador guarda en esa pestaña lo que vas completando, para no perderlo si volvés atrás; se borra al cerrarla. No usamos cookies de publicidad ni de analítica, …»
- Después: «… se borra al cerrarla. **Si llegás a la web desde un anuncio, recordamos de cuál solo mientras dura esa visita, sin guardar nada en tu navegador. Si comprás en esa misma visita, lo anotamos con tu pedido para saber qué anuncios funcionan.** No usamos cookies de publicidad ni de analítica, …»

**ca** (PENDIENTE REVISIÓN NATIVA, como el resto del catalán)

- Antes: «… Mentre compres, el navegador guarda en aquella pestanya el que vas omplint, per no perdre-ho si tornes enrere; s'esborra en tancar-la. No fem servir galetes de publicitat ni d'analítica, …»
- Después: «… s'esborra en tancar-la. **Si arribes a la web des d'un anunci, recordem de quin només mentre dura aquella visita, sense guardar res al teu navegador. Si compres en aquella mateixa visita, ho anotem amb la teva compra per saber quins anuncis funcionen.** No fem servir galetes de publicitat ni d'analítica, …»

Nota: la versión del 14/10 no nombraba el origen en la §12. Ahora sí, porque si compra queda guardado con su pedido.

## Qué se pierde respecto de antes

- Quien ve el anuncio, se va y compra otro día (o recarga la página antes de pagar) queda sin origen: la compra cuenta como «sin anuncio».
- Quien abre el enlace del anuncio en una pestaña y compra en otra, también.
- El «último toque» solo se ve si dentro de la misma visita entra por otro enlace con parámetros distintos, cosa rara.

## Pregunta para el abogado

¿Con esto alcanza para no necesitar banner? No se escribe ni se lee nada en el equipo del usuario
para este fin; el dato solo existe en la página abierta y, si compra, se guarda con el pedido como
parte de la compra. `fbclid` y `gclid` siguen viajando con el pedido si venían en el enlace.
