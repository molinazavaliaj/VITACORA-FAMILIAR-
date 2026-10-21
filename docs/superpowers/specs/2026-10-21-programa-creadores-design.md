# Programa de creadores («Colabora con Vitácora») — diseño (21/10)

Naza, 21/10: en vez de pagarle a muchos influencers, que los creadores chicos se anoten
solos en la web y vendan con un código propio. Cada venta con su código les deja una
comisión. **El porcentaje es por creador y se puede cambiar** («a uno le damos 10 %, a
uno más grande 20 %»). Un solo influencer grande se paga aparte, fuera de esto.

Decisiones tomadas (Naza delegó lo técnico, «ocupate de lo tuyo»):

- Alta con aprobación. El creador se anota en `/colabora`; los socios lo aprueban desde el
  panel de la empresa y recién ahí recibe su código.
- Al aprobar, los socios eligen el código, la **comisión** (%) y el **descuento** para su
  comunidad (%), los dos por creador y editables después. Defaults sugeridos en el
  formulario: comisión 20, descuento 10.
- La comisión se calcula sobre lo que el cliente pagó de verdad (`compra.total`, ya con
  el descuento). Se congela en el momento de la compra: cambiar el % después no toca
  ventas viejas.
- El descuento funciona igual que el cupón del rasca y gana: % del libro digital (el PDF
  o el pack). Con descuento 0 el código igual vale y atribuye la venta.
- Vale donde hoy aparece el casillero del cupón (checkout de `/comprar`, y donde ya se
  muestre). Kids (`comprarKids`) y cualquier checkout sin casillero quedan para después.
  No se suma con la promo global (`PROMO_PORCENTAJE`) ni con otro cupón (un solo
  código por compra, el casillero es uno).
- El pago de comisiones es a mano (transferencia). No se guardan datos bancarios. Una
  vez por mes sale un mail a los socios con lo pendiente por creador, y en el panel se
  marca como pagado.
- Todo apagado hasta `CREADORES=1` en Vercel (y la migración aplicada por Naza).

## Piezas

### 1. Base (migración `supabase/migrations/20261021000000_creadores.sql`)

Idempotente, como `20261020000000_cupones.sql`: RLS prendido sin policies, `grant` explícito
a `service_role`, comentarios en castellano. La aplica Naza en el SQL Editor. Sección nueva
en `supabase/CONTRATO.md` («Programa de creadores»), con el mismo estilo que «Cupón de bienvenida».

`creadores`
- `id uuid pk`, `created_at`
- `nombre text`, `email text` (minúsculas, único), `red text` (Instagram/TikTok/YouTube/otra),
  `perfil text` (link), `seguidores text` (lo que escribió, opcional), `mensaje text` (opcional, 1000 máx.)
- `region` ('ES'|'AR'), `idioma` ('es'|'ca'|'ar') — de la web donde se anotó; manda el idioma de los mails y del panel.
- `estado` ('pendiente'|'activo'|'pausado'|'rechazado'), default 'pendiente'
- `codigo text unique` (null hasta aprobar)
- `comision smallint` (1–50, null hasta aprobar), `descuento smallint` (0–50, null hasta aprobar)
- `token_panel text unique` (aleatorio, 32 bytes en base64url, nace al aprobar): el link privado de su panel
- `consentimiento jsonb` (textos que vio, versión, fecha, user agent — como cupones), `ip text`
- `aprobado_at`, `notas text` (de los socios, nunca se muestra al creador)

`comisiones_creadores`
- `id uuid pk`, `created_at`
- `creador_id uuid references creadores(id)`, `pedido_id uuid unique references pedidos(id)` (una por pedido: el webhook reintenta)
- `codigo text`, `total numeric` (lo pagado), `moneda text`, `porcentaje smallint` (congelado), `importe numeric` (euros a céntimos, pesos al entero)
- `estado` ('pendiente'|'pagada'|'anulada'), `pagada_at`, `anulada_at`

### 2. El código y la compra (lógica pura en `web/src/lib/creadores.ts`, base en `web/src/lib/creadores-base.ts`)

- `creadoresPrendido()` → `process.env.CREADORES?.trim() === "1"`.
- Formato del código: `^[A-Z0-9]{3,20}$`, sin empezar con `VITACORA10`. Normalizar lo que
  escribe la persona: mayúsculas, sin espacios ni guiones, sin tildes (`Lucía` → `LUCIA`).
  Sugerencia al aprobar: el nombre normalizado, recortado a 15.
- `cuponParaLaCompra` (`lib/cupon-base.ts`) primero prueba el formato del rasca (solo si
  `rascaPrendido()`); si no es de ese formato y `creadoresPrendido()`, busca un creador
  **activo** con ese código. Un creador pausado/pendiente/rechazado → `no_existe`.
- Con descuento > 0 se aplica con la misma cuenta que el rasca (`importeDelCupon` /
  `aplicarCupon` con el % del creador). Si la compra no lleva libro digital, el
  descuento no aplica pero el código igual atribuye la venta (no se rechaza la compra).
- La compra lleva el creador aparte del cupón: `compra.creador = { id, codigo, comision, descuento }`.
  **`extras.cupon` NO se escribe para un código de creador** (si se escribiera,
  `marcarCuponUsado` lo marcaría y mandaría el mail de «cupón usado dos veces»).
  En `pedidos.extras` va `creador: { id, codigo, comision }` y, si hubo descuento,
  `descuento_creador: { codigo, porcentaje, importe }`. Documentarlo en CONTRATO.
- La línea en las pasarelas (`lineasParaCobrar`): para el creador, el nombre de la línea
  dice el código y el %, no «Cupón de bienvenida». La suma sigue dando exacto `compra.total`.
- `/api/cupon/validar` contesta igual para los dos tipos (importe, y la etiqueta de la
  línea del resumen). El casillero del checkout aparece si `(rascaPrendido() || creadoresPrendido()) && promo === null`.
- El link del creador es `/comprar?cupon=CODIGO` (ya existe: se aplica solo al llegar).
  En España con prefijo de idioma según su web (`/ca/comprar?...`, `/ar/comprar?...`).
- Los mensajes de rechazo ya existentes (`TEXTOS_CUPON[...].checkout.motivos`) sirven; si
  hace falta uno nuevo, va a la tanda de textos.

### 3. Cuando el pago entra (`confirmarPago`)

Después del paso 1b (cupón), si `extras.creador` tiene id: insertar en
`comisiones_creadores` (pedido_id único; si choca, nada). `importe` = `total × comision / 100`
redondeado como el resto (euros a céntimos, pesos al entero). `total` y `moneda` salen del
pedido. **Nunca tira ni cambia el resultado del pago** (como `marcarCuponUsado`): si falla,
`console.error` y mail a socios con `enviarMailSocios`.

### 4. La página `/colabora` (y `/ca/colabora`, `/ar/colabora`)

> **Cambio legal (21/10):** el alta empieza **solo en España** (`/colabora` y `/ca/colabora`).
> `/ar/colabora` da 404 y `/api/colabora` rechaza el alta de Argentina porque pagar comisiones
> allá no está resuelto. Se abre sumando `"ar"` a `IDIOMAS_CON_ALTA` (`web/src/lib/creadores.ts`).
> Los textos de Argentina quedan en su lugar y los códigos valen al comprar en cualquier país.

Seguir el patrón de `/eventos` (página + formulario + ruta que manda mail a socios), con
los textos en `web/src/app/_textos/colabora.ts` por idioma (`es` tú, `ar` vos, `ca`).
- Arriba: qué es el programa en pocas líneas (comisión por venta con tu código, descuento
  para tu comunidad, panel para ver tus ventas, lo aprueban personas). Sin cifras fijas de %
  (cambian por creador): «una comisión por cada venta» y «un descuento para tu comunidad».
- Formulario: nombre, correo, red (select), link del perfil, seguidores (opcional), algo
  que quieras contarnos (opcional), casilla obligatoria de aceptar las condiciones y la
  privacidad (link a `/legal/creadores`) y, desde el cambio legal del 21/10, otra casilla
  obligatoria «Soy mayor de 18 años» (CR-26; las dos van con su texto exacto a la prueba del
  consentimiento). Honeypot como en eventos.
- `POST /api/colabora`: valida, freno de 5 altas por IP y hora, inserta `pendiente`
  (si el correo ya existe, contesta lo mismo y no duplica — no se revela si existía),
  mail al creador («lo recibimos, te escribimos cuando lo revisemos»), mail a socios
  con los datos y el link a `/admin/creadores`. Con `CREADORES` apagado: 404.
- Sin `CREADORES=1` la página da 404. No se agrega al menú ni al sitemap todavía (decide Naza).
- `/legal/creadores` (+ ca, ar): condiciones del programa en borrador, con el patrón de
  `/legal/cupon`. **Lleva la marca de pendiente de abogado en el doc de textos**, no en la página.

### 5. Panel de la empresa: `/admin/creadores` (pestaña «07 Creadores»)

Seguir el estilo de `/admin/gastos` y `ui.tsx`. **Cada server action vuelve a chequear que
quien llama esté en `ADMIN_EMAILS`** (las server actions son endpoints sueltos; el layout no las protege).
- Pendientes: datos del alta + formulario de aprobar (código sugerido, comisión 20, descuento 10, editables) y botón rechazar.
  Aprobar: valida formato y que el código no exista (ni en creadores ni con el prefijo del rasca),
  crea `token_panel`, `estado=activo`, manda al creador el mail de bienvenida (código, link para
  compartir, link a su panel, link a las condiciones).
- Activos y pausados: código, comisión, descuento (editables), ventas, comisión pendiente,
  pagada; botones pausar/reactivar y «Marcar pagado» (pasa a `pagada` las pendientes de ese creador
  que ya pasaron los 14 días de espera, con fecha; ver §6).
- Lista de comisiones con opción de anular una (para devoluciones).

### 6. Panel del creador: `/creador/[token]`

Sin login: el token es la llave (como `/local/[token]` de la rama regalo-locales). Token
desconocido o creador no activo/pausado → 404 (pausado ve el panel con un aviso).
`noindex`. Idioma del creador. Muestra: su código, el link para compartir (botón copiar),
el descuento que da, ventas (fecha y comisión, **ningún dato del cliente**), total
en espera, total por cobrar y total cobrado.

**Espera de 14 días (cambio legal, 21/10):** cada comisión queda «en espera» 14 días desde su
`created_at` (el plazo de las devoluciones) y después pasa sola a «por cobrar». Es un estado
derivado, sin columna nueva ni migración (`estadoDeComision` en `web/src/lib/creadores.ts`):
en la base sigue siendo `pendiente`. El panel del creador, el de la empresa, «Marcar pagado» y
el resumen mensual usan el mismo corte.

### 7. Mail mensual

`/api/creadores/resumen` con el mismo cuidado que `/api/cupon/recordatorios` (`CRON_SECRET`),
cron en `web/vercel.json` el día 1 a las 9. Mail a socios: por creador, lo que ya pasó los 14
días de espera, cantidad de esas ventas, lo que sigue en espera (aparte) y el correo para
pedirle los datos. Un creador con todo en espera no sale. Si no hay nada para pagar, no manda nada.

### 8. Textos

Todos los textos que ve una persona (página, formulario, mails, panel del creador, legal)
van en borrador a `docs/creadores/textos-para-aprobar.md`, en tandas de 10, con contexto
de dónde aparece cada uno. Reglas de la casa: sin dos puntos, sin oraciones que empiecen con
«Y» después de un punto, frases simples, trato por país (tú en `es`, vos en `ar`, catalán en
`ca`, nunca usted), no prometer lo que no pasa. Los textos del panel de la empresa no
necesitan aprobación.

### 9. Tests

Vitest en `web/test/`, con el estilo de `cupon.test.ts`, `cupon-api.test.ts` y
`confirmar-pago.test.ts`: normalización y formato del código, cálculo de comisión
(EUR y ARS), que un código de creador no escriba `extras.cupon`, que la comisión se
congela, que confirmar dos veces no duplica, que un pausado no aplica, que las acciones
del admin rechazan a quien no es admin, que el alta no revela si el correo existía, y
que todo responde 404/no aplica con `CREADORES` apagado.

## Fuera de esta versión

Kids y cualquier checkout sin casillero de cupón; pagos automáticos; facturas del creador;
menú y sitemap; cookie de referido de 30 días (hoy el código va en el link y en el casillero).
