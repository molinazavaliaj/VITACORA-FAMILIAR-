# CONTRATO DE DATOS — leer antes de tocar cualquier tabla

Los dos servicios se comunican SOLO por esta base. Cambiar el esquema = nueva
migración en `supabase/migrations/` + actualizar este archivo + avisar al otro socio.

## Propiedad de escritura

| Tabla | Escribe | Lee | Nota |
|---|---|---|---|
| `familias` | web | entrevistador | |
| `narradores` | web (crea, edita datos, `edicion`, `libro_aprobado_at`) / entrevistador (solo `estado`, `dia_actual`, `ultima_respuesta_at`, `alerta_silencio`) | ambos | Única tabla compartida. La web también apaga `alerta_silencio`. La fábrica lee `edicion` y **no produce nada sin `libro_aprobado_at`** (ni digital ni impreso). |
| `preguntas` | **web** (copia las fijas al comprar; la familia edita, salta, reordena, agrega) / **entrevistador** (adaptativas y reemplazos) / seed (plantilla global) | ambos | Desde el 12/09 **cada narrador tiene su guion propio**. Las globales (`narrador_id = null`) son solo plantilla. Regla: `orden ≤ dia_actual` está **congelado**, nadie lo toca. |
| `respuestas` | entrevistador | web | La web NUNCA escribe acá. |
| `saludos` | ~~web / entrevistador~~ | — | **Fuera de la fase 1 (10/09).** Nadie la escribe ni la lee. Se deja por si la fase 2 la revive. |
| `fotos` | web (sube y ordena) | fábrica | Nueva 12/09. Por capítulo; `principal` abre, el resto cierra. |
| `invitados` | web | web | Nueva 12/09. Hasta 3 por narrador (lo cuida la web). |
| `pedidos` | web y fábrica | — | El entrevistador no la mira. Un pedido por comprador: los invitados y visitantes que compran su copia tienen su propia `familia` y su propio pedido sobre el mismo `narrador_id`. |
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

## El guion por narrador (migración 20260912)

- Al confirmar la compra, **la web copia las 26 fijas globales** a filas del narrador
  (`tipo = 'fija'`). Los narradores anteriores ya fueron copiados por el backfill.
- La familia puede, sobre las preguntas con `orden > dia_actual`: editar `texto`, borrar
  (y renumerar las siguientes para que queden contiguas), reordenar, agregar al final con
  `tipo = 'familia'` o `'sugerida'`, y ligar una foto con `foto_id` (pregunta-foto).
- **Piso 15, tope 40** incluidas las 4 adaptativas (lo cuida la web).
- **El entrevistador** recorre `orden` de a uno con `preguntaDeOrden`, que prefiere la fila
  del narrador. Cuando responde la última que existe y no hay adaptativas, genera 4 en
  `N+1..N+4`. Ya no existe "la 26" como número mágico.
- `respuestas.pregunta_orden` sigue uniendo por `(narrador_id, orden)`. Como lo enviado está
  congelado, renumerar las futuras no rompe la unión.

`contexto` suma dos claves que **lee el entrevistador** y escribe la web:
`ritmo` (`'diario'` default · `'dos_por_dia'` · `'seguido'`) y `evitar` (texto libre).
`modoRapido: true` de los pilotos equivale a `ritmo: 'seguido'`.

## Cerrar el libro (migración 20260912)

`narradores.edicion` (jsonb, escribe la web, lee la fábrica):
`{ordenCapitulos: text[], excluidas: uuid[], titulo, subtitulo, portadaFotoId, correcciones}`.

`narradores.libro_aprobado_at`: lo escribe la web cuando la dueña aprieta **Cerrar libro**.
**Es el punto de aprobación del cliente: la fábrica no produce nada sin esto**, ni el PDF
ni el impreso. Si pasan 30 días desde `completado` sin cierre, la web lo cierra con la
propuesta por defecto y avisa (está en los términos).

## Storage — bucket privado `audios`

    {narrador_id}/dia_NN.ogg          respuestas (entrevistador sube; NN = pregunta_orden, 2 dígitos; extras: dia_NN_2.ogg)
    {narrador_id}/fotos/{id}.{ext}    fotos por capítulo, ORIGINAL sin recomprimir (web sube)
    {narrador_id}/sistema/…           audios TTS del entrevistador (entrevistador sube)
    {narrador_id}/paquete/…           estructura, PDF y audiolibro (web/fábrica — socio 2 — sube)

El navegador jamás recibe paths directos: solo URLs firmadas que genera la web.

## Tipos TypeScript

Cada servicio genera sus tipos con:
`npx supabase gen types typescript --linked > src/db/tipos.ts`
Regenerar después de cada migración.
