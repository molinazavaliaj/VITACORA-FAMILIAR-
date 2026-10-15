# Pase de manos: Viaje V2 al bot (10/10/2026)

Rama **`viaje-v2-bot`** (subida, sin mergear; base = main del 10/10). Worktree del chat anterior:
`Desktop/VITACORA FAMILIAR-revision` (en el chat nuevo, hacé un worktree propio desde `origin/viaje-v2-bot`).
Plan y decisiones: [`plan-conexion-bot.md`](plan-conexion-bot.md). **Ñako no pasa a la V2** (Naza: ya fue).

## Hecho (verificado: tsc limpio, fábrica `test/viaje-v2` 339/340 — el rojo es CRLF de Windows —, entrevistador 844/844, 4000 simulaciones con cero fallas)

| Paso | Qué | Dónde |
|---|---|---|
| 2 y 3 | **Planificador puro** `iniciar`, `alEntrar`, `queToca` (idempotente), `proximaAccion`, `cerrarAlbum`, `reubicar`; estado JSON puro; el simulador corre encima | `fabrica/src/viaje-v2/planificador.ts`, `fabrica/scripts/viaje-v2-simular.ts`, `fabrica/test/viaje-v2-planificador.test.ts` |
| 1 | Núcleo copiado al bot + test de copia exacta | `npm run viaje-v2-copiar-nucleo` → `entrevistador/src/viaje-v2/nucleo/` |
| 4 | Migración `viajes_v2` + `respuestas.clave_viaje` + `envios.tipo 'viaje_v2'` (incluye `'regalo_entrega'`) y CONTRATO | `supabase/migrations/20261011000000_viaje_v2.sql` — **la aplica Naza** (después de la de `regalo-dia-de-entrega` o antes: da igual) |
| 5 (parte) | La fila en la base: CAS, toma del turno, listar | `entrevistador/src/viaje-v2/filas.ts` + test (base falsa sabe de `viajes_v2`) |

## Falta (en orden)

5. **Enviar**: copiar `v3/enviar.ts` (`elegirEnvio`/`drenar`) para los `salientes` del planificador. Ventana abierta → texto
   (y `reaccion` ❤️: falta `wa.reaccion(telefono, wamid, '❤️')`, ni `DepsV3.wa` ni el webhook la tienen); cerrada →
   `mensaje_viaje_v2` / `recordatorio_viaje_v2` / `recordatorio_viaje_ultima_v2` (`PLANTILLAS_VIAJE_V2` en config,
   `WA_PLANTILLAS_VIAJE_V2_LISTAS`); con la plantilla sin aprobar, aviso a socios y queda en cola.
6. **Entrante**: gancho en `flujo/procesar.ts` antes del viaje V1 (`esViajeroV2`). Audio → Storage + transcripción →
   `Entrada` audio (`transcripcion` null o `descargaFallo` si falla); texto; foto (llenar `reenviaA` si es reenvío, para
   AL3); botón. Fila en `respuestas` con `clave_viaje` = la `clave` que devuelve `alEntrar`.
7. **Reloj** `tickViajeV2` junto a `tickV3` (solo activos con fila), `queToca` + `drenar`, avisos por `v3/avisos.ts`;
   script `viaje-v2-cerrar-album` (usa `cerrarAlbum`) y script de cambio de país (usa `reubicar`).
8. **Alta**: bienvenidas `bienvenida_viaje_v2` / `bienvenida_viaje_regalo_v2` (plantillas, Joaquín las carga en Meta);
   SÍ → `iniciar`. Interruptor `VIAJE_V2_PARA_NUEVOS`. El scheduler y `preguntar.ts` saltean a quien tiene fila V2.
   Hasta que exista `/comprar/viaje` V2, la fila se crea con un script (completar la `Compra` a mano, `validarCompra`).
10. **Simulación real** con un viajero inventado contra la base real (como `v3-simular --real`), sin gastar.
- **Revisión con un segundo agente** del planificador (no se hizo todavía) y de cada paso antes de mergear.

## Para contarle a Naza (decisiones que tomó el planificador; confirmar)

1. Una foto sola con la pregunta abierta es la respuesta; es «suelta» (❤️) solo si la última pregunta ya está contestada.
2. El SÍ tardío el día de salida cuenta para la última enviada (UC1), por la regla de respuesta tardía.
3. Las reacciones salen al cerrarse el grupo (3' de silencio), no en el mismo minuto.
4. Audio + fotos + texto seguidos = una sola reacción; «paso» a destiempo no hace nada; solo audios malos → COR y la
   pregunta sigue abierta. Audio malo = no se bajó, o transcripción vacía o null.
5. Álbum con cero fotos: aviso, otro a las 48 h (una vez), cierre solo a los 7 días (si cae de noche, a las 10:00); si
   manda fotos, se cancelan.
6. **Inventado, a confirmar:** si el bot estuvo caído, lo programado atrasado más de 2 h no sale (queda vencido) y lo
   atrasado no sale de 23 a 8 en su zona.
7. Reubicar (cambio de país) no cambia qué pregunta va cada día; solo la hora.

## Qué NO hacer
- No editar `entrevistador/src/viaje-v2/nucleo/` a mano: se cambia la fábrica y se copia.
- No cambiar textos del banco (`docs/viajes-v2/banco.md`): los aprueba Naza.
- No prender `VIAJE_V2_PARA_NUEVOS` sin el OK de Naza y sin las bienvenidas aprobadas en Meta.
- No pasar a Ñako.
