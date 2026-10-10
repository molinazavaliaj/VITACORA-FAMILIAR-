# Pase de manos: Viaje V2 al bot, segunda parte (10/10/2026)

Rama **`viaje-v2-envio`** (sale de `origin/viaje-v2-bot` + main del 10/10; subida, **sin mergear**). Worktree:
`Desktop/VITACORA FAMILIAR-viaje-bot`. Plan: [`plan-conexion-bot.md`](plan-conexion-bot.md). Ñako no pasa.

## Hecho y verificado

Verificación: fábrica `test/viaje-v2` 342/343 (el rojo es el de siempre, CRLF de Windows en `viaje-v2-idiomas`);
2400 simulaciones de la fábrica sin invariantes rotas; entrevistador **917/917**; `tsc` limpio (salvo 2 errores
viejos de `test/v3/reloj.test.ts`, que ya están en main). Tres viajes enteros en memoria (es-AR, es-ES, ca), de la
bienvenida a la despedida, con cero preguntas vencidas y toda respuesta con su `clave_viaje`.

| Paso | Qué | Dónde |
|---|---|---|
| Revisión del planificador | Segundo agente. 3 bugs confirmados y arreglados con test: CA1 atrasado vencía y el viaje quedaba colgado sin álbum ni despedida; una caída corta a la hora de la noche perdía la pregunta (ahora las horas de 23 a 8 no cuentan como atraso); el webhook repetido sumaba la foto dos veces | `fabrica/src/viaje-v2/planificador.ts` (copiado al núcleo) |
| 5 Envío | Ventana abierta → texto y ❤️ (reacción de Meta); cerrada → una plantilla (`mensaje_viaje_v2`, `recordatorio_viaje_v2`, `recordatorio_viaje_ultima_v2`), las ❤️ se descartan; sin plantilla aprobada → queda en cola y aviso | `entrevistador/src/viaje-v2/enviar.ts`, `whatsapp/enviar.ts` (`enviarReaccion`), `config.ts` (`PLANTILLAS_VIAJE_V2`, `WA_PLANTILLAS_VIAJE_V2_LISTAS`) |
| 6 Entrante | Gancho en `procesar.ts` antes de la V3. Audio a Storage + transcripción (2 intentos), foto a `fotos`, texto y botón; fila en `respuestas` con `clave_viaje`. De a un mensaje por viajero (12 fotos juntas no se pisan). AL3: reenvío por cita o mismo archivo (sha256) | `viaje-v2/entrante.ts`, `whatsapp/webhook.ts` |
| 7 Reloj | Cada minuto: bienvenida, reconciliar filas sin clave, lo que toca (`queToca`), la cola; avisos a los socios por mail. Scripts `viaje-v2-cerrar-album` y `viaje-v2-cambiar-pais` | `viaje-v2/reloj.ts`, `flujo/scheduler.ts`, `entrevistador/scripts/` |
| 8 Alta | `npm run viaje-v2-alta -- <id> --compra compra.json [--aplicar]`. Bienvenida BIEN-1 / BIEN-1R por plantilla; si escribe antes, como texto. `VIAJE_V2_PARA_NUEVOS=1`: a un viajero nuevo no le sale el viaje viejo y se avisa para crearle la fila. El scheduler viejo excluye a todo el que tiene fila V2 | `scripts/viaje-v2-alta.ts`, `flujo/scheduler.ts` |
| 10 Simulación | `npm run viaje-v2-simular -- --real` (WhatsApp de mentira, no gasta). En memoria corre en los tests | `scripts/viaje-v2-simular.ts`, `test/viaje-v2/simulacion.test.ts` |
| Revisión del bot | Segundo agente. Arreglado: ráfaga de fotos que se perdía, filas sin clave sin reconciliar, mensaje que podía salir dos veces, viajero que quedaba en `invitado`, reintento de transcripción, idioma de una sola fuente | commit `3834a9b` |

## Falta

1. **Naza aplica la migración** `supabase/migrations/20261011000000_viaje_v2.sql` (verificado hoy: la tabla no existe).
   Sin ella el bot sigue igual que hoy (nadie es V2).
2. Después: `npm run viaje-v2-simular -- --real` contra la base real (crea y borra un narrador inventado).
3. Joaquín carga las plantillas de viaje en Meta (`plantillas-meta.md`) y las marca en `WA_PLANTILLAS_VIAJE_V2_LISTAS`.
4. Mergear `viaje-v2-envio` a main (con el OK de Naza; deploy automático en Railway). Sin migración ni plantillas no
   cambia nada para nadie.
5. Prender `VIAJE_V2_PARA_NUEVOS` solo con el OK de Naza y las bienvenidas aprobadas.
6. Pendiente chico: el mail de hito «dijo que sí» a la familia no sale en la V2 (en un regalo puede importar).

## Decisiones para confirmar con Naza
1. Antes del SÍ, si escribe otra cosa: se le repite la bienvenida **una vez**; después, silencio y aviso a los socios.
2. Antes del SÍ no se guarda nada de lo que mande (la bienvenida dice que el SÍ es el permiso para guardar).
3. La despedida (DES) con la ventana cerrada sale dentro de `mensaje_viaje_v2`, que termina con «Cuando puedas, me
   contestás con un audio. Sin apuro.» — raro para un cierre. Pasa solo si el álbum se cierra solo a los 7 días.
4. Bot caído: lo atrasado no sale de 23 a 8; sale si el atraso, sin contar esas horas, no pasa de 2 h. CA1 sale siempre.

## Qué NO hacer
- No editar `entrevistador/src/viaje-v2/nucleo/` a mano: se cambia la fábrica y `npm run viaje-v2-copiar-nucleo`.
- No prender `VIAJE_V2_PARA_NUEVOS` sin el OK de Naza. No pasar a Ñako.
