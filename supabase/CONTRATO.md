# CONTRATO DE DATOS — leer antes de tocar cualquier tabla

Los dos servicios se comunican SOLO por esta base. Cambiar el esquema = nueva
migración en `supabase/migrations/` + actualizar este archivo + avisar al otro socio.

## Propiedad de escritura

| Tabla | Escribe | Lee | Nota |
|---|---|---|---|
| `familias` | web | entrevistador | |
| `narradores` | web (crea, edita datos) / entrevistador (solo `estado`, `dia_actual`, `ultima_respuesta_at`, `alerta_silencio`) | ambos | Única tabla compartida. La web también apaga `alerta_silencio`. |
| `preguntas` | entrevistador (adaptativas y reemplazos) / seed (fijas) | web | Fijas: `narrador_id = null`. |
| `respuestas` | entrevistador | web | La web NUNCA escribe acá. |
| `saludos` | web (crea y borra antes de la entrega) / entrevistador (solo `entregado`) | ambos | |
| `pedidos` | web y fábrica | — | El entrevistador no la mira. |
| `envios` | entrevistador | — | Log de salientes; idempotencia del scheduler. |

## Transiciones de estado de `narradores.estado`

    pendiente_pago → invitado    (web: el pago se confirmó — migración 20260911, pago por adelantado)
    invitado → acepto            (entrevistador: recibió el "SÍ")
    acepto → activo              (entrevistador: envió la pregunta 1)
    activo → pausado             (entrevistador: el narrador pidió parar)
    pausado → activo             (entrevistador: el narrador volvió a escribir)
    activo → completado          (entrevistador: última respuesta recibida y despedida enviada)
    activo|pausado → cerrado_anticipado  (web: la familia pidió cierre con ≥10 respuestas)

Ningún otro salto es válido. Quien detecta un estado imposible loguea y NO corrige solo.

`pendiente_pago` existe porque la compra crea al narrador ANTES de que el cobro esté
confirmado (modelo del 11/09). **El entrevistador no lo mira nunca**: no está en ninguna
de sus listas, así que un narrador sin pagar no recibe WhatsApp. Si el pago no llega, el
narrador queda ahí y la web lo limpia; no es un estado del que el entrevistador tenga que
salir.

`pedidos.extras` (jsonb, misma migración): qué se compró además de la base.
`{"impreso": "bn" | "color" | null, "marcos": 0..N}`. Lo escribe la web al crear el
pedido; la fábrica lo lee cuando produce. El entrevistador sigue sin mirar `pedidos`.

## Storage — bucket privado `audios`

    {narrador_id}/dia_NN.ogg          respuestas (entrevistador sube; NN = pregunta_orden, 2 dígitos; extras: dia_NN_2.ogg)
    {narrador_id}/saludos/{id}.webm   saludos (web sube)
    {narrador_id}/sistema/…           audios TTS del entrevistador (entrevistador sube)
    {narrador_id}/paquete/…           estructura, PDF y audiolibro (web/fábrica — socio 2 — sube)

El navegador jamás recibe paths directos: solo URLs firmadas que genera la web.

## Tipos TypeScript

Cada servicio genera sus tipos con:
`npx supabase gen types typescript --linked > src/db/tipos.ts`
Regenerar después de cada migración.
