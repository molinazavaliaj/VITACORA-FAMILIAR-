# Cambios de texto fuera de la portada (16/10)

Para que Naza los vea. Son arreglos mínimos por las reglas de `textos.md` (sin «Y» al
principio de oración, el lema nuevo, «la página de su historia», «Iniciar Vitácora»),
no textos nuevos. ca = traducción pendiente de Imma.

## 1. Oraciones que empezaban con «Y» (o «I» en catalán)

| Dónde | Antes | Después |
|---|---|---|
| Legal, privacidad (es y ar), «Del narrador» | «…quién es quién en su familia). Y lo importante: los audios…» | «…quién es quién en su familia), y lo importante: los audios…» |
| Legal, privacidad (ca) | «…qui és qui a la seva família). I el més important…» | «…qui és qui a la seva família), i el més important…» |
| Kids, página /ar/kids («Vos ves todo») | «Y una sola cosa te pedimos. Leé todo…» | «Una sola cosa te pedimos. Leé todo…» (igual que la de España) |
| Página del anticipo (/anticipo/…) | «Y sigue contando.» | «Sigue contando.» |
| Portada (9 casos: «Un día vas a querer preguntarle algo. Y ya no…», «Un regalo para él. Y otro para ti/vos.», «Lo que nunca te contó. Y su voz, guardada.», en es, ar y ca) | — | Se fueron con las secciones viejas; la frase de la carta ahora es la aprobada (16) sin «Y». |

**No lo toqué:** el texto base de la pregunta diaria de Viaje (`web/src/lib/viaje.ts`,
«…contame X. Y mandame la foto de hoy…»). Tiene que ser idéntico al del bot
(`entrevistador/src/flujo/viaje.ts`, un test lo compara) y el bot lo reescribe antes de mandarlo.
Si se cambia, va en los dos a la vez (Joaquín).

Las preguntas que empiezan con «¿Y si…?» (y «I si…?» en catalán) quedan: son preguntas
aprobadas, no oraciones que siguen a un punto.

## 2. El lema

«Para las vidas que merecen su propio libro» → **«Todas las vidas merecen su propio libro»**
(ca: «Totes les vides mereixen el seu propi llibre»): pie de toda la web, 404 y enlace
caducado, contratapa del libro 3D, página del anticipo, cierre de la portada.

**Falta (no es de la web):** las fotos de la contratapa de Osvaldo
(`public/rediseno/libro-osvaldo-contraportada.jpg`) tienen el lema viejo impreso en la imagen;
el mail de hitos del bot (`entrevistador/src/mail/hitos.ts`) y la contratapa real del libro
(fábrica) también lo dicen.

## 3. «tu panel» → «la página de su historia»

Solo en lo que lee quien compra. El panel por dentro no cambió.

| Dónde | Antes | Después |
|---|---|---|
| Checkout, lo que incluye (otra persona, es/ar/ca) | «Escuchas sus audios mientras cuenta, desde tu panel» | «…desde la página de su historia» |
| Checkout, lo que incluye (libro propio) | «Escuchas tus audios desde tu panel» | «…desde la página de tu historia» |
| Checkout, fotos | «También puedes hacerlo después, desde tu panel.» | «…desde la página de su historia.» |
| Checkout, álbum | «Después, desde tu panel, eliges cuál va en la tapa…» | «Después, desde la página de su historia, eliges…» |
| Checkout, pago (regalo) | «Con ese mismo correo entras a tu panel.» | «…entras a la página de su historia.» |
| Checkout, pago (otra persona / propio) | «Con ese mismo correo entras a tu panel.» | «…a la página de su historia.» / «…de tu historia.» |
| Pedido confirmado, bajada | «…cómo entrar a tu panel, donde vas a ir escuchando…» | «…cómo entrar a la página de su historia, donde…» |
| Pedido confirmado, «Mientras cuenta» | «Desde la primera respuesta, en tu panel aparecen sus audios…» | «…en la página de su historia aparecen sus audios…» |
| Pedido confirmado, libro propio | «Desde tu primera respuesta, en tu panel aparecen tus audios.» | «…en la página de tu historia aparecen tus audios.» |
| Pedido confirmado, botón | «Ir a mi panel» | «Ir a la página de su historia» (propio: «…de tu historia») |
| Pedido confirmado, sin dirección | «Ponla desde tu panel» / «Cargala desde tu panel» | «Ponla / Cargala desde la página de su historia» (propio: «tu») |
| Mails de acceso y regalo | «…vas a poder escuchar su voz desde tu panel.» | «…desde la página de su historia.» |
| Mails de acceso y regalo, botón | «Entrar a mi tablero» | «Entrar a la página de su historia» |
| Mail del regalo | «…empieza su entrevista y lo vas a ver en tu tablero.» | «…en la página de su historia.» |
| Mail del regalo, «Mientras cuenta» | «…en tu panel aparecen sus audios…» | «…en la página de su historia aparecen sus audios…» |
| Landings (Cómo funciona, paso 3) | «Mientras tanto, desde tu panel vas escuchando lo que cuenta.» | «…desde la página de su historia vas escuchando…» |
| Landing «Su voz», marco | «Lo añades al comprar o después, desde tu panel.» | «…desde la página de su historia.» |
| Preguntas (portada y landings), «¿Se puede tener el libro impreso?» | «Se suma al comprar o después, desde tu panel, …» | «…desde la página de su historia, …» |
| Kids, página y checkout | «Todo lo que cuente lo ves en tu panel.», «Tú ves todo lo que cuenta desde tu panel.», «Con este entras a tu panel…», «…un correo para entrar a tu panel.», «Tú, desde tu panel, y el equipo…» | lo mismo con «la página de su historia» |

En catalán, igual: «el teu panell» / «el teu tauler» → «la pàgina de la seva història» (o «de
la teva història» cuando el libro es propio).

**No lo toqué (para decidir):**
- **Viaje** (checkout de viaje, /viaje): «Las etapas sin fecha se completan después desde tu
  panel», «Con ese mismo correo entras a tu panel», etc. El libro es del viajero: ¿«la página de
  tu viaje»? No lo inventé.
- El botón «Entrar a mi panel» de pedido confirmado cuando no sabemos de quién es la compra
  (también sale tras comprar un viaje).
- La página del anticipo («Desde tu panel vas a ver el libro crecer…»).
- Legales fuera de «En corto» (la tabla de proveedores dice «Aloja la web que estás leyendo y tu
  panel»; las cookies hablan del panel claro u oscuro).
- La cabecera de toda la web sigue diciendo «Comprar el libro» (también en la portada, en
  pantalla grande).

## 4. Checkout

- Botón del paso 1: «Quiero su libro» / «Quiero mi libro» → **«Iniciar Vitácora»** en los dos
  casos (ca también, pendiente de Imma).
- Marco: con `PRECIO_MARCO` y `PRECIO_MARCO_ADICIONAL` iguales (19 y 19), la fila dice solo
  «+19 €», sin «el primero, los demás». Lo que se cobra no cambió.

## 16/10 — pendientes

Los que quedaron arriba en «No lo toqué» / «Falta», aprobados por Naza. Cambios mínimos.

### 1. «tu panel» que quedó

| Dónde (archivo) | Antes | Después |
|---|---|---|
| Checkout de viaje, etapas (`web/src/app/_textos/checkout-viaje.ts`, es) | «…se completan después desde tu panel, y si aparece…» | «…desde la página de vuestro viaje, y si aparece…» (la frase va de vosotros) |
| Checkout de viaje, pago (es) | «Con ese mismo correo entras a tu panel.» | «…entras a la página de tu viaje.» |
| Checkout de viaje, después de pagar (es) | «te llega un correo para entrar a tu panel, …» | «…para entrar a la página de tu viaje, …» |
| Checkout de viaje, correo mal (es) | «Con ese entras a tu panel.» | «Con ese entras a la página de tu viaje.» |
| Checkout de viaje, etapas / pago / después / correo mal (ar) | «…desde tu panel…», «…entrás a tu panel.», «…para entrar a tu panel, …», «Con ese entrás a tu panel.» | lo mismo con «la página de tu viaje» |
| Checkout de viaje (ca, pendiente de Imma) | «des del teu panell», «entres al teu panell», «per entrar al teu panell» | «des de la pàgina del vostre viatge» (etapas, de vosaltres), «entres a la pàgina del teu viatge», «per entrar a la pàgina del teu viatge» |
| /viaje, pregunta de las fechas (`web/src/app/_textos/viaje.ts`) | es «…desde tu panel…» · ar «…desde tu panel…» · ca «…des del teu panell…» | es «…desde la página de vuestro viaje…» · ar «…desde la página de tu viaje…» · ca «…des de la pàgina del vostre viatge…» |
| Pedido confirmado, botón sin sesión (`web/src/app/_textos/pedido-confirmado.ts` y `comprar/gracias/page.tsx`) | «Entrar a mi panel» / ca «Entrar al meu panell» | si la compra es de viaje «Entrar a la página de tu viaje» (ca «…a la pàgina del teu viatge»); si no, «Entrar a la página de la historia» (ca «…a la pàgina de la història»). Ahí no sabemos de quién es la compra. |
| Página del anticipo (`web/src/app/anticipo/[token]/page.tsx`) | «Desde tu panel vas a ver el libro crecer…» · «…desde tu panel: el libro en PDF…» | «Desde la página de su historia vas a ver…» · «…desde la página de su historia: el libro en PDF…» |
| Legal, proveedores (`web/src/app/_textos/legal.ts`, es/ar/ca) | «Aloja la web que estás leyendo y tu panel.» · ca «…i el teu panell.» | «…y la página de la historia.» · ca «…i la pàgina de la història.» |
| Legal, cookies (es/ar/ca) | «…si prefieres (preferís) el panel en claro o en oscuro…» · ca «…el panell clar o fosc…» | «…la página de la historia en claro o en oscuro…» · ca «…la pàgina de la història clara o fosca…» |

La landing del libro del viaje (`/el-libro-del-viaje`) no decía «panel» en ningún lado. El texto
de muestra `MailAnticipo` de `web/src/app/maquetas.tsx` («Sus primeros audios ya están en tu
panel») no se usa en ninguna página y quedó igual.

### 2. Pregunta diaria de Viaje

| Dónde | Antes | Después |
|---|---|---|
| `web/src/lib/viaje.ts` y `entrevistador/src/flujo/viaje.ts` (idénticas) | «Día N, en X: contame Y. Y mandame la foto de hoy con lo que estaba pasando.» | «Día N, en X: contame Y, y mandame la foto de hoy con lo que estaba pasando.» |

Queda una igual en el banco de Viaje V2 (`F4` de `banco-es-ES.json`, «…lo que se te vaya
ocurriendo. Y mándame todas las fotos…», en `entrevistador/src/viaje-v2/nucleo/` y
`fabrica/src/viaje-v2/`). No era parte del pedido, no la toqué.

### 3. El lema

| Dónde | Antes | Después |
|---|---|---|
| Mail de hitos del bot, pie (`entrevistador/src/mail/hitos.ts`) | «Para las vidas que merecen su propio libro.» | «Todas las vidas merecen su propio libro.» |

La contratapa que arma la fábrica (`fabrica/src/libro/plantilla-html.ts`, `TEXTOS_CONTRATAPA`) no
lleva el lema (dice «Vitácora Familiar · Una colección de vidas contadas» y la descripción), así
que no hubo nada que cambiar. Fuera de `docs/` no queda ninguna otra aparición del lema viejo
(salvo la lista de frases prohibidas de `web/test/portada-trato.test.tsx`, que es a propósito).

### 4. Foto de la contratapa

`web/public/rediseno/libro-osvaldo-contraportada.jpg` ahora dice «Todas las vidas merecen su
propio libro», en la misma línea, centro, tamaño y color (Source Serif 4 itálica bold, la que
mejor calzaba con la letra impresa). El original quedó en
`docs/rediseno-2026-10/amigo/fotos/libro-osvaldo-contraportada-original.jpg` y el recorte antes y
después en `docs/rediseno-2026-10/amigo/fotos/contraportada-antes-despues.png`.
