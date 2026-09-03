# Estado del proyecto — actualizado 2026-09-01 (medianoche)

## 🎉 ÚLTIMA HORA: el primer libro completo ya existe

La prueba de punta a punta con el set dorado (Osvaldo) se corrió ENTERA en producción:
carga → estructura → corrección de nombres → previsualización → pago simulado → **libro
completo de 8 capítulos en PDF + audiolibro ensamblado → página de descarga funcionando**.
La calidad del texto es genuinamente buena (voz oral real, cero perfume a IA). Costo de
producción medido: ~USD 5 de API por libro, contra 49€ de precio.

Bugs de producción cazados y arreglados en vivo durante la prueba (ya en main):
- Middleware de sesión de Supabase que faltaba (las páginas crasheaban al renovar el token) → helper único `web/src/lib/supabase/sesion.ts` + `web/src/middleware.ts`.
- **Railway usa Railpack y IGNORA `nixpacks.toml`** → la fábrica ahora tiene `fabrica/Dockerfile` explícito (node 22 + ffmpeg + Chromium adentro de node_modules). Dato clave para el deploy del entrevistador: **usar Dockerfile también**, no confiar en nixpacks.toml.
- Los reintentos re-pagaban al modelo por capítulos ya escritos → "memoria de borradores" en Storage (`borrador_cap_NN.md`): cada texto caro se guarda apenas se genera y los reintentos lo reutilizan gratis.

## Lo que ya está VIVO en producción (lado Naza)

- **Web compradora**: https://vitacora-familiar.vercel.app — desplegada en Vercel y probada de punta a punta con un narrador real: login por email ✓, registro ✓, tablero ✓, saludos grabados desde el celular ✓.
- **Fábrica del libro**: corriendo en Railway (worker cada 60 s, con ffmpeg y Chromium). Espera narradores `completado` para generar estructura → previsualización → libro+audiolibro tras el pago.
- **Emails**: Supabase usa SMTP propio vía Resend (el gratuito de Supabase permite 2-4 mails/hora — inviable). Hasta tener dominio propio, Resend solo entrega a nazamateos@gmail.com.
- **Pagos**: env vars con placeholders — Stripe/Mercado Pago quedan para una sesión propia (cuentas + webhooks). Todo lo demás funciona.

## 🚦 DECISIÓN NUEVA (2026-09-03): arrancan 3 pilotos REALES — tu deploy es el camino crítico

Naza tiene 3 personas reales listas para probar el producto entero (narradores de verdad,
audios de verdad, Whisper de verdad). **Nada de eso puede arrancar sin tu mitad**, así que
la prioridad número 1 del proyecto es:

1. **Deploy de `entrevistador/` en Railway HOY** — ⚠️ usá un **Dockerfile** como el de
   `fabrica/Dockerfile` (adaptado: sin Chromium ni ffmpeg, solo node+build): Railway usa
   Railpack e **ignora `nixpacks.toml`** — lo aprendimos a los golpes con la fábrica.
   Agregá el servicio DENTRO del proyecto Railway `vitacora-familiar` existente.
2. **Meta/WhatsApp**: verificación + las 3 plantillas de `entrevistador/PLANTILLAS.md`.
   Es EL trámite lento — cada día que no está iniciado es un día que los pilotos no arrancan.
3. **Pedido de Naza — "modo rápido" para pilotos** (cambio chico en tu scheduler): un flag
   por narrador (p. ej. `contexto.modoRapido = true`) para que la SIGUIENTE pregunta salga
   apenas responde la anterior, en vez de esperar al día siguiente. Un piloto con ganas
   termina las 30 en pocos días y tenemos el primer libro REAL la semana que viene.
   (Respetar igual la ventana de 24 hs de WhatsApp: si respondió hace minutos, se puede
   mandar la siguiente como mensaje libre, sin plantilla.)

Los compradores de los 3 pilotos van a ser la cuenta de Naza (sin dominio propio los mails
de login solo le llegan a él) — los narradores solo necesitan WhatsApp.

4. **Propuesta de Naza al guion (a consensuar entre ambos): "la vida en 5 minutos" como
   pregunta fija del día 26.** Texto propuesto:
   > «Ya me contó su vida entera, capítulo por capítulo. Hoy le pido algo distinto:
   > imagínese que tiene cinco minutos con alguien que no lo conoce, y quiere que sepa
   > quién es usted. Cuénteme su vida en cinco minutos. Lo que no puede faltar.»
   Razón: después de revivir todo, el resumen revela cómo el narrador estructura su propia
   vida (material de prólogo para el editor) y produce LA pieza compartible del producto:
   "su vida en 5 minutos con su voz" — candidata a muestra de la previsualización.
   Implementación si estás de acuerdo: se agrega al seed como fija orden 26 (avisamos y lo
   hace Naza en `supabase/seed.sql` + migración) y tus adaptativas pasan a generar 4
   (órdenes 27-30) en vez de 5. Decínos y lo aplicamos coordinados.

## Lo que falta para que el sistema COMPLETO respire (lado Socio 1)

El código del entrevistador está terminado y mergeado (¡enorme!). Faltan sus dos pasos finales:

1. **Deploy de `entrevistador/` en Railway** (Task 11 del plan A). Ojo: Naza ya creó el proyecto Railway `vitacora-familiar` — conviene agregar el servicio `entrevistador` DENTRO del mismo proyecto (Railway → proyecto vitacora-familiar → New Service), no crear otro proyecto.
2. **Meta/WhatsApp**: app de WhatsApp Business + verificación + aprobar las 3 plantillas de `entrevistador/PLANTILLAS.md`. Es EL trámite lento.

Cuando eso esté: en la base ya hay un narrador de prueba en estado `invitado` ("Pequeña Imma", el WhatsApp de Naza) — el scheduler lo va a encontrar solo y mandar la bienvenida. Esa es la señal de que todo el circuito quedó cerrado.

## Avisos técnicos entre socios

- `supabase/CONTRATO.md` cambió una línea: la web también **borra** saludos (antes de la entrega), además de crearlos.
- La fábrica asume que las **preguntas de reemplazo** (narrador sin hijos/pareja) van con el **mismo `orden`** que la fija que pisan — tal como ya lo hace el tablero.
- Pendientes priorizados antes del piloto real: `docs/superpowers/plans/2026-09-01-plan-b-pendientes-antes-del-piloto.md`.

## Próximos hitos

1. Deploy del entrevistador + Meta (socio) → probar la entrevista real con Imma.
2. Sesión de Osvaldo (`fabrica`: `npm run set-dorado`) → el primer libro completo, la prueba de calidad.
3. Stripe + Mercado Pago + dominio propio (verificarlo en Resend).
