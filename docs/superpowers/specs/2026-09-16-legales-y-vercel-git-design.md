# Legales completos + Vercel conectado a GitHub — diseño

Fecha: 2026-09-16. Aprobado por Naza sección por sección en la sesión de brainstorming.

## Por qué

- Meta revisa el sitio antes de aprobar el negocio en la API de WhatsApp y exige política de
  privacidad y términos reales (ROADMAP 2.3). Los actuales son borradores: términos con tres
  bloques `[PENDIENTE]` y una descripción del pago que ya no es cierta (decían "se paga en la
  tercera pregunta"; desde el 11/09 el pago es por adelantado); privacidad de cinco párrafos
  que no nombra a ningún proveedor real ni a la clonación de voz.
- Producción se deployaba a mano con `vercel --prod` y quedó 8 días atrás de `main`
  (bitácora #8, ROADMAP 2.8).

## Parte A — Vercel ↔ GitHub

Estado de partida: el proyecto `vitacora-familiar` (team `tn-6301`, cuenta trickynoise) no
tiene repo de git vinculado y su Root Directory es `.` (porque siempre se deployó desde `web/`).

1. `vercel git connect` desde `web/` → vincula `molinazavaliaj/VITACORA-FAMILIAR-`; rama de
   producción `main`.
2. Root Directory → `web` (PATCH `/v9/projects/{id}` con la sesión de la CLI; si falla, Naza lo
   cambia en Settings → Build & Deployment → Root Directory).
3. Desde entonces: push a `main` = deploy de producción; push a otra rama = preview.

Riesgo: el repo es de la cuenta GitHub de Joaquín. Si la GitHub App de Vercel no tiene acceso al
repo, `git connect` falla y hay que pedirle a Joaquín que la instale (le pasamos el link). La
parte B no depende de esto.

Prueba: el merge de la parte B a `main` es el primer deploy automático; se verifica el texto
nuevo en `www.vitacorafamiliar.com/legal/terminos`.

## Parte B — Términos y privacidad completos

### Decisiones de negocio (Naza, 16/09)

- **Dos titulares, uno por mercado**: España → Immaculada Collel; Argentina → Joaquín Molina.
  El contrato aplicable lo decide la región que el comprador elige en el checkout (que ya
  decide moneda y pasarela). NIF/CUIT y domicilios se completan después: son el único hueco.
- **Devolución en mínimo legal**:
  - España (RDL 1/2007): 14 días naturales desde la compra. Si el comprador pidió que la
    entrevista empiece dentro de ese plazo y desiste, paga la parte proporcional ya prestada.
    Contenido digital ya entregado (PDF, audiolibro) con su consentimiento y productos
    personalizados (impreso, marcos) no admiten desistimiento.
  - Argentina (ley 24.240 art. 34, Res. 424/2020): 10 días corridos desde la compra,
    revocación sin costo, "Botón de arrepentimiento" con esa leyenda en la home.
  - Si no hay libro porque el narrador no acepta o responde menos de diez preguntas:
    devolución total, sin plazo (no es generosidad: no se entregó el servicio).
- Tono: llano, en "tú" (las legales ya estaban en tú y sirve para los dos mercados).

### Código

- `web/src/app/legal/titulares.ts` — el único archivo a rellenar: `TITULARES.ES` y
  `TITULARES.AR` (nombre, identificación fiscal, domicilio), `CONTACTO` (hola@ y soporte@),
  `ACTUALIZADO`. Un campo vacío se pinta en amarillo en la página hasta que se complete.
- `web/src/app/legal/ui.tsx` — `Seccion`, `Parrafo`, `Tabla`, `Enlace`, `Pendiente`: la
  maqueta actual (max-w-lg, text-sm, gap-8) sin repetir clases.
- `web/src/app/legal/terminos/page.tsx` — reescrito. Secciones: quiénes somos · qué es el
  servicio · cómo se compra · el permiso del narrador · qué se entrega y cuándo · desistimiento
  y arrepentimiento · si no hay libro · la historia es de tu familia · uso aceptable · qué
  prometemos y qué no · tus datos · si algo cambia · ley y jurisdicción · contacto.
- `web/src/app/legal/privacidad/page.tsx` — reescrito. Secciones: responsables · a quién
  aplica · qué datos guardamos (comprador, narrador —la voz para clonar es biométrica y lleva
  consentimiento explícito—, invitados, visitantes) · para qué y con qué base · quién procesa
  los datos (tabla: Supabase UE, Vercel, Railway, Meta/WhatsApp, OpenAI, Anthropic, proveedor
  de clonación de voz, Stripe, Mercado Pago, Resend, imprenta) · transferencias
  internacionales · cuánto tiempo · con quién compartimos · tus derechos (AEPD / AAIP) ·
  menores · seguridad · cookies (solo técnicas hoy) · inteligencia artificial · cambios ·
  contacto.
- `web/src/app/legal/arrepentimiento/page.tsx` — página nueva: explica el plazo por país y
  tiene un botón `mailto:` con asunto prellenado. Enlazada desde el footer de la home con la
  leyenda "Botón de arrepentimiento" y desde los términos.
- `web/src/app/page.tsx` — footer: link nuevo.

### Fuera de alcance

- Banner de cookies: cuando entre el Pixel (ROADMAP 2.7). La política ya lo anticipa.
- Revisión por un gestor antes de escalar: recomendable, pero el texto sale sin `[PENDIENTE]`
  salvo NIF/CUIT/domicilio.

### Verificación

`tsc` + `next build` en `web/`; las tres páginas abiertas en el navegador (móvil y escritorio);
merge a `main`; deploy automático (parte A) o `vercel --prod` corrido por Naza si A quedó
bloqueada; comprobar el texto nuevo en producción.
