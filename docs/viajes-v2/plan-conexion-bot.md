# Viaje V2: conectar al bot (plan del 10/10/2026)

Punto 1 del «Qué falta» del [README](README.md). Decidido con Naza el 10/10: se construye completo para que funcione
con un viajero nuevo; **Ñako no pasa a la V2** (era de prueba y ya perdió continuidad; queda en el V1).

## Arquitectura (mismo molde que la entrevista Familiar V3)

- **Núcleo**: `fabrica/src/viaje-v2/` se copia byte a byte a `entrevistador/src/viaje-v2/nucleo/` con
  `npm run viaje-v2-copiar-nucleo`, y un test vigila que no se separe (como `v3-copiar-nucleo`).
- **Tabla `viajes_v2`**: una fila por viajero (prende la V2 para ese narrador). `compra` jsonb (la `Compra` de
  `tipos.ts`), `estado` jsonb, `version` (CAS), `enviando_hasta` (toma), `idioma`, `creada_at`.
- **Reloj** `tickViajeV2` cada minuto (junto a `tickV3`): cierra el grupo de respuesta tras 3' de silencio, manda lo
  vencido según el planificador y vacía la cola de salida.
- **Entrante**: gancho en `flujo/procesar.ts`, antes del V1 de viaje. Audios a Storage y transcripción; fotos al
  álbum o sueltas; sí/paso/listo con `palabras`. Cada respuesta es una fila de `respuestas` con `clave_viaje`.
- **Ventana de 24 h**: abierta → texto libre (y la ❤️); cerrada → `mensaje_viaje_v2` / `recordatorio_viaje_v2` /
  `recordatorio_viaje_ultima_v2` (`PLANTILLAS_VIAJE_V2`, `WA_PLANTILLAS_VIAJE_V2_LISTAS`).
- **Alta**: bienvenida BIEN-1 / BIEN-1R por plantilla, SÍ → BIEN-2 + AS1. Interruptor `VIAJE_V2_PARA_NUEVOS`.

## Decisiones (10/10)

- Respuesta tardía: cuenta para la **última pregunta enviada** (como el simulador); el escritor lee todo por fecha.
- Álbum con cero fotos: aviso a los socios, **se repite a las 48 h y se cierra solo a los 7 días** con DES.
- Cambio de país durante el viaje: por ahora un script para los socios (el panel no existe).
- Ñako: no se pasa.

## Pasos

| # | Paso | Estado |
|---|---|---|
| 2 | Fábrica: `planificador.ts` puro (`queToca`, `alEntrar`) + `Estado` ampliado; el simulador corre encima y los 2400 viajes siguen en verde | |
| 3 | `reubicar` (cambio de país), agrupar respuestas, `audioMal` | |
| 1 | Copia del núcleo al entrevistador + test | |
| 4 | Migración `viajes_v2` + `respuestas.clave_viaje` + CONTRATO (la aplica Naza) | |
| 5 | Estado en la base (CAS, toma) + envío con ventana y plantillas + reacción ❤️ | |
| 6 | Entrante + gancho en procesar | |
| 7 | Reloj + avisos a los socios + script para cerrar el álbum | |
| 8 | Alta de un viajero nuevo + interruptor | |
| 10 | Simulación real con un viajero inventado | |

Dependencias: Joaquín carga en Meta las bienvenidas de viaje (`bienvenida_viaje_v2`, `bienvenida_viaje_regalo_v2`)
antes de prender el interruptor. La compra `/comprar/viaje` V2 (punto 2 del README) es aparte: hasta entonces, una
fila de `viajes_v2` se crea con un script.
