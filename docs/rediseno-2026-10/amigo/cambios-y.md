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
