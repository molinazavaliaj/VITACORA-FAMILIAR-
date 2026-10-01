# Pase de manos V3 — 01/10/2026 (Chat B: la entrevista trae escenas)

Sigue a [`handoff-2026-10-01-libro.md`](handoff-2026-10-01-libro.md). Rama **`v3-escenas`** (worktree `C:\Users\Naza\Desktop\VITACORA FAMILIAR-v3-escenas`, sale de `v3`), pusheada a `origin`. **Sin mergear a `v3`** (espera el OK de Naza). 1380 tests verdes, `tsc` limpio. `entrevistador/` sin tocar.

## Qué quedó hecho (verificado)
| Tema | Estado | Dónde |
|---|---|---|
| Pedir nombres en 11 preguntas | Aprobado por Naza y aplicado | `banco.md`, test `v3-entrevista-nombres.test.ts` |
| JU20 (las mudanzas) al núcleo | Aprobado y aplicado | `banco.md`, conteos en `v3-entrevista-flujo.test.ts` |
| Salida "contame en general" solo después de un "no me acuerdo" (8 preguntas, M33.1–M33.8) | Aprobado y programado | `flujo.ts` (`segunda-oportunidad`, clave `X~2`) |
| Cazador de escenas v3.1: al cerrar cada bloque, hasta 2 repreguntas, mensaje mitad fijo / mitad escrito, botón [Ya lo conté todo], Opus 5, tope USD 3 por entrevista | Aprobado y programado | prompt [`entrevista/cazador/prompt-v3-1.md`](entrevista/cazador/prompt-v3-1.md), `cazador.ts`, cola en `flujo.ts` (clave `RP~X`), plan [`entrevista/cazador/plan-codigo.md`](entrevista/cazador/plan-codigo.md) |
| Página de prueba con `--cazador` (apagado por defecto) | Programado | `v3-entrevista-web.ts`, `v3-entrevista-turno.ts` |
| Material del escritor: X~2 y RP~X pegadas a X | Programado | `v3-entrevista-a-material.ts` |
| Revisión de otro agente | 2 hallazgos confirmados, arreglados con test (`ac97fdc`) | — |

## Decisiones de Naza de hoy (no re-discutir)
- **El narrador no se cansa de contar**: lo que rompe es una pregunta sin sentido con lo que contó o repetida. 21–26 repreguntas por entrevista están bien.
- **Repetido = el mismo momento o la misma historia**, no la misma persona (la pareja, un hermano o la facultad en momentos distintos está bien).
- **Lo delicado que el narrador contó sí se repregunta**, con cuidado; lo que dijo "paso" o frenó, no.
- **Costumbre y dato suelto sí**, con criterio (nunca el porqué de un gusto). En "Hoy", algo de ahora y con peso.
- **Sin listas de palabras para la cita**: el código solo controla que sea textual. La cita no toma pedazos mal transcriptos.
- **Sin "si dudás, no preguntes"**: lo contado a medias se pide solo si el momento pesa.
- Dos repreguntas seguidas solo al llegar a Legado, si quedan pendientes.

## Pruebas y plata
- Corridas reales con Opus 5: v2 sobre Naza USD 0,91; v3 sobre Naza USD 1,29; v3 sobre Joaquín USD 0,63; v3.1 en 3 bloques USD 0,29. **Total USD 3,12**, en `GASTOS.md`. Costo en uso real: **~USD 1,30 por entrevista**.
- Resultados (vida real, fuera de git): `audios-crudos/v3-web/nazareno/cazador-prueba/` y `fabrica/prueba-v3-joaquin/cazador-prueba/` (en el worktree `VITACORA FAMILIAR-v3`).

## Pendiente
- **Naza:** OK para mergear `v3-escenas` a `v3`. Pasarle a Joaquín su archivo de repreguntas para que las marque.
- **Joaquín:** conectar al entrevistador de WhatsApp la segunda oportunidad, la cola de repreguntas (`siguientePregunta` devuelve `segunda-oportunidad` y `repregunta`), el botón [Ya lo conté todo] y la llamada al cazador al cerrar cada bloque (`cazarBloque`, cliente inyectado, tope USD 3).
- Dudosos de la revisión, anotados: la repregunta del bloque 14 llega entre las preguntas de Legado (la llamada es asíncrona); el tope de USD 3 se puede pasar por una llamada si dos bloques se cazan a la vez (máx. ~USD 0,40); "No pasa nada. Vamos con otra." seguido de una repregunta suena raro.
- Variantes tú/usted de M33 y del mensaje de la repregunta (con el resto del banco).

## Qué NO hacer
- No reescribir libros a mano. No copiar vidas reales a docs, commits ni prompts.
- No tocar `entrevistador/`. No push a `main`. Nada pago sin avisar el costo.
- No volver a poner límites al cazador "para no cansar".
