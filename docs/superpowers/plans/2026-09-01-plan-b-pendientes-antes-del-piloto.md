# Plan B — Pendientes antes del piloto (triage de la revisión final)

La revisión final de la rama `plan-b-web` (2026-09-01) aprobó el merge con 6 fixes que ya se aplicaron. Estos quedaron como **"arreglar antes de usuarios reales"** — ninguno bloquea el merge, todos importan antes del primer piloto con una familia de verdad:

## Antes del piloto (orden sugerido)

0. **SMTP propio para los mails de login** (descubierto en el primer deploy, 2026-09-01): el emisor gratuito de Supabase permite solo 2-4 emails/hora — inviable con usuarios reales. Conectar Resend (gratis hasta 3.000/mes) en Supabase → Authentication → SMTP Settings, con un dominio propio verificado. Nota: los magic links exigen abrir el link en el mismo navegador donde se pidió; considerar cambiar a OTP de 6 dígitos (mismo `signInWithOtp`, template de email con `{{ .Token }}`) que no tiene esa fricción.

1. **Middleware de supabase-ssr** (`web/src/middleware.ts`): sin él, el refresh del token puede fallar durante el render para usuarios que vuelven días después — y este producto vive 30 días. Patrón estándar de la doc de `@supabase/ssr`.
2. **ffmpeg: forzar parámetros de stream en `normalizarAMp3`** (`fabrica/src/audio/ffmpeg.ts`): agregar `-ar 44100 -ac 1` y bitrate fijo — el concat con `-c copy` puede romper el audiolibro si TTS (24kHz mono) y audios de teléfono (48kHz) difieren. Solo se detecta escuchando el audiolibro real.
3. **Prueba de punta a punta con el set dorado en los deploys reales** (paso 4 de la Task 10, nunca corrido): cargar a Osvaldo → estructura → nombres → previsualización → pago de prueba → leer el libro entero y escuchar el audiolibro completo. Varios riesgos solo aparecen acá (límite de body de Vercel ~4.5MB en saludos, nixpacks/devDeps en Railway, calidad del PDF).
4. **Unique constraint en `familias.auth_user_id`** + manejo de la carrera de doble registro (hoy → 500). Requiere migración: coordinar con el socio (CONTRATO).
5. **Carrera de doble checkout** (2 pedidos pendientes) y **Stripe `payment_status`** (un guard de una línea si algún día se habilitan métodos de pago asíncronos).
6. **Copy del banner de silencio**: usa "tu papá" literal — cambiarlo a `como_le_dicen` para abuelas/madres.
7. **Validación de formato de `zonaHoraria`/`horaPreferida`** en el registro: un string basura rompe el scheduler del socio (cruza servicios).
8. **MediaRecorder en iOS Safari**: probar la grabación de saludos en iPhone tras el deploy (`isTypeSupported` + fallback ya existe, pero sin probar).
9. **Teléfonos AR con 0/15** (`normalizarTelefono`): "011..." queda mal normalizado — agregar limpieza o hint en el form.
10. **Avisarle al socio**: (a) el CONTRATO ahora dice que la web también borra saludos antes de la entrega; (b) `agruparCapitulos` asume que las preguntas de reemplazo van con el MISMO `orden` que la fija que pisan.

## Backlog (después del piloto)

- Factorizar el boilerplate de sesión/ownership (~14 copias) en un helper.
- Rate limit en `POST /api/saludos` (link público).
- Audiolibro secuencial → paralelizar si tarda mucho.
- Oráculo 403-vs-404 en rutas de audio; tests 403 faltantes en 2 rutas.
- Worker: cursor/flag para no listar Storage de todos los narradores completados en cada tick, y no repetir la detección de entidades (llamada paga) cada minuto si el upload falla.
- `/comprar` muestra player de muestra aunque no exista `muestra_audiolibro.mp3` (narradores solo-texto).
- Techo de 400 palabras y validación de capítulo en el test de forma del set dorado; cartel "BENITEZ" vs corrección de nombres.
