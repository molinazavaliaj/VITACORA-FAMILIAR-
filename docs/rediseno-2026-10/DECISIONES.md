# Decisiones de Naza (13/10/2026) — mandan sobre todo lo demás

Si algo de `PASO-DE-MANOS.md`, `PENDIENTES.md`, `TEXTOS-Y-REGLAS.md` o de las maquetas contradice
este archivo, **gana este archivo**.

## D1. Devoluciones: se dicen, pero no como gancho de venta
- La garantía **sí aparece**, en tres sitios: las preguntas frecuentes («¿Y si no quiere hacerlo?»),
  la letra pequeña del checkout junto al botón de pagar, y los textos legales / política de devoluciones.
- **No aparece** en titulares, botones, anuncios ni banners (eso sustituye a la regla de las maquetas
  «garantía junto a cada botón»; la regla del 06/10 de `docs/web-textos-v3/aprobados.md` queda
  matizada así).
- Texto por línea: Familiar «Si no quiere hacerlo, te devolvemos el dinero» · Viaje «Si el viaje se
  cancela, te devolvemos el dinero» · «Para mí» «Si cambias de idea antes de contestar la primera
  pregunta, te devolvemos el dinero». Si ya ha empezado a contestar, el libro se cierra con lo que
  haya, sin devolución (`maquetas/fuente-dc/Casos.dc.html`).
- Legales y política de devoluciones tienen que decir exactamente lo mismo (revisar con el abogado).

## D2. Idioma y región: según quién visita
- **España, castellano** (tú, €, Stripe): es el diseño de las maquetas.
- **España, catalán** (NUEVO): toda la web pública, el checkout, el panel, los emails y los legales
  también en catalán. Selector de idioma visible (ES · CA) y `hreflang`. Rutas con el idioma en la
  URL (p. ej. `/ca/...`) para que cada versión se pueda servir estática y cacheada (ver
  `RENDIMIENTO.md`). Por defecto castellano; si el navegador pide catalán, se sugiere CA, sin
  redirigir a la fuerza.
- **Argentina** (vos, pesos, Mercado Pago): se mantiene con el diseño nuevo y la variante «vos» de
  cada texto, como hace hoy el código (`lib/region.ts`, `lib/trato.ts`). Ruta propia (p. ej. `/ar`)
  para poder cachear.
- Todos los textos salen de diccionarios por idioma/región (nada escrito a mano en los componentes).
- La traducción al catalán la puede preparar Claude Code, pero **la revisa una persona nativa antes
  del switch**. Confirmar con el abogado qué textos (legales, información al consumidor) tienen que
  estar en catalán obligatoriamente.

## D3. Checkout: datos primero, pago al final (como hoy)
- Se mantiene el orden actual del código: eliges el libro → rellenas para quién es y cuándo → pagas.
  Cero cambios de base de datos.
- De las maquetas se usa el **diseño y el contenido de cada paso**, no su orden:
  1. **Su libro** (formato, marco) — paso 1 de la maqueta.
  2. **Para quién** («Para mí», él/ella, «Otra persona», nombre, regalo, fecha, WhatsApp) — paso 3 de
     la maqueta.
  3. **Pago** (email, tu WhatsApp opcional, métodos de pago, dirección si es impreso) — paso 2 de la
     maqueta.
- Se quitan «Pago recibido» al principio del paso de datos y «Lo completo más tarde».

## D4. Promesas que el sistema hoy no cumple: fuera
No se publica nada que el producto no haga hoy. En concreto:
- **Anticipo tras la tercera respuesta**: fuera de todas las pantallas (checkout, panel, emails,
  ejemplo), salvo que se compruebe en `fabrica/` que existe con el escritor actual.
- **«Lo lees mientras se escribe» / capítulos «escribiéndose»**: fuera. El libro se escribe al terminar.
- **«El impreso llega unos 9 días después»**: se quita la cifra hasta que la imprenta la confirme.
  Mientras: «Te avisamos cuando salga de imprenta y te mandamos el seguimiento».
- **Marco con solo el libro digital**: fuera. El marco va con el impreso, como en `productos.ts`.
- **Kids**: no se muestra (ni solapa, ni página, ni checkout) hasta que exista de verdad.
- **Pausar el libro desde el panel**: el botón abre contacto con el equipo; no cambia el estado en la base.
- Cupón VITACORA10 y rasca-rasca: no hasta que exista el cupón real.
- Cualquier otra promesa que Claude Code detecte sin respaldo en el código: se quita y se apunta en
  `PENDIENTES.md`.
