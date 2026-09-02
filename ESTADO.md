# Estado del proyecto — actualizado 2026-09-01 (noche)

## Lo que ya está VIVO en producción (lado Naza)

- **Web compradora**: https://vitacora-familiar.vercel.app — desplegada en Vercel y probada de punta a punta con un narrador real: login por email ✓, registro ✓, tablero ✓, saludos grabados desde el celular ✓.
- **Fábrica del libro**: corriendo en Railway (worker cada 60 s, con ffmpeg y Chromium). Espera narradores `completado` para generar estructura → previsualización → libro+audiolibro tras el pago.
- **Emails**: Supabase usa SMTP propio vía Resend (el gratuito de Supabase permite 2-4 mails/hora — inviable). Hasta tener dominio propio, Resend solo entrega a nazamateos@gmail.com.
- **Pagos**: env vars con placeholders — Stripe/Mercado Pago quedan para una sesión propia (cuentas + webhooks). Todo lo demás funciona.

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
