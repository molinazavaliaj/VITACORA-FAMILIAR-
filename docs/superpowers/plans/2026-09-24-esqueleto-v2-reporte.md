# Esqueleto v2 — reporte final (Tarea 13)

Rama `esqueleto-v2`, worktree `VITACORA FAMILIAR-biografo`. Nada pago se corrió en las 13 tareas: todo con cliente falso. No se tocó `fabrica/`, `web/`, `voz/` ni el flujo v1 del entrevistador. Sin push (lo hace el controlador).

## Resumen en 5 líneas

- El esqueleto v2 quedó completo y cableado en la puerta manual (`entrevistador/scripts/manual-v2.ts`), sin tocar el flujo v1 ni la fábrica.
- Tests: entrevistador **553 → 623** verdes (tipos limpios); fábrica se mantuvo en **537 → 537** verdes, sin tocarla, tipos limpios.
- El prompt de la pregunta 40, medido con la ficha real (sin modelo): **12.331 caracteres (~5.361 tokens)**, muy por debajo del techo de 13.800.
- Hubo una "ventana roja" planificada (Tareas 5-11: partes de `secuencia`, `estado-v2` y `manual-v2` en rojo hasta que se cableó todo) — verde de nuevo desde la Tarea 11.
- Quedan textos por aprobar antes del piloto (abajo) y una fijación menor recomendada (agrupar "pandemia" y "Mundial" en la lista de hechas).

## Tabla por tarea

| Tarea | Qué hizo | Commits | Desvíos del plan |
|---|---|---|---|
| 1 | Modelos por paso (`PasoV2`) y precio de Sonnet 5 en un solo lugar | `672ee05` | Ninguno. La "evaluación reducida" con Haiku es el paso `v2-pedidos` |
| 2 | Ficha con topes, `noTuvo`, corregir que pisa (N34/N35/N40) | `b677755`, `ba8facb` | Se borró un test que quedaba vacío al sacar la aserción de `puertaAbierta` (pedido del brief); `puertaAbierta` sale del JSON que ve el modelo |
| 3 | Presupuesto total de la ficha, no solo topes por campo | `ca775e6`, `25f70b5`, `623efff` | Los topes por campo solos daban 12.013 caracteres; se agregó poda en orden fijo (a-h) para entrar en 5.750; `etapaCampo` quedó en 220 |
| 4 | El guion en código: filas del §3, árbol, condiciones, expansión, techo, historia grande | `f4b2e43`, `59ef91d`, `a438263` | Guion gana sobre el plan (regla de Naza): pormenores/temas copiados textual de §3, variantes hijo-único / quienes-fueron-tu-familia / dejar-el-trabajo-sigue agregadas, historia grande de "adulto joven" movida a juventud (como §5) |
| 5 | `pregunta-v2.ts`: la pregunta sale del guion, repregunta como objetivo | `e4b2a51` | Ninguno de fondo (abre la ventana roja planificada) |
| 6 | `plan-preguntas.ts` se achica: solo tramos y edades | `e91b82f` | Ninguno |
| 7 | Secuencia fija: armar/rearmar, cubiertos, caídas, libres, objetos | `06c25f3`, `52c8b9e` | El código del plan encadenaba 3 libres seguidas en infancia; se corrigió a una libre por etapa, según guion §2 |
| 8 | Evaluación (Sonnet) qué faltó, pedidos de repreguntas/objetos por Haiku | `7cb893e`, `72f61b1` | Se cambió el orden del JSON que piden los prompts (banderas antes del texto libre) para no perder un "no quiero seguir" si la salida se corta |
| 9 | El encargo: pide lo concreto sin forzar escena, mira temas hechos | `4cd1aa2` | Ninguno de fondo |
| 10 | `estado-v2.ts`: firma del guion, temas hechos, conversación de 3, repregunta por etapa | `410c606`, `fc09157` | El estado del piloto viejo (24/09) no se puede retomar con el esqueleto: el piloto nuevo arranca de cero |
| 11 | Puerta manual v2 cableada al esqueleto completo | `28b1804`, `208c3c3` | Tope de 2 repreguntas por etapa; "hoy no" en repregunta/objeto reserva esa respuesta; cierra la ventana roja (607 verdes en ese momento) |
| 12 | Contrato de `contexto.v2`, modelos en HERMES, textos renderizados para aprobar | `fc43af4` | Ninguno de fondo; ajuste fue de documentación, no de código |
| Final (revisión de toda la rama) | 4 arreglos: I1 prompt de la 40, I2 salidas cortadas, I3 objeto doble, M1 censo gasta Opus de más | `79335c1`, `7877b0e`, `0013e5a`, `436f50c` | La receta original de I1 (ids + recorte a 80/100) no alcanzaba el presupuesto; se sacaron los ids de la lista de hechas |
| 13 (esta) | Suite entera, medición de la pregunta 40, este reporte | — | Sin push (lo hace el controlador) |

## Decisiones que tomé sin preguntarte (revisalas)

1. **La ficha se poda por presupuesto total, no solo por tope por campo.** Los topes de §2 solos daban 12.013 caracteres; el objetivo (2.500 tokens = 5.750 caracteres) manda. Orden de poda: (a) notas de gente que no es familia, (b) esas personas mismas (las familiares nunca se tocan), (c) `noSabemos` viejos (mínimo 6), (d) `queHacia`/`lugar`/`conQuien` de etapas viejas a 120 caracteres, (e) bisagras viejas sin edad primero, (f) notas de familiares a 40 caracteres, (h) una segunda vuelta de `queHacia`/`conQuien` a 60. `etapaCampo` quedó en 220 (el fallback del plan). Con la ficha real de Naza, la ficha queda en 5.734 caracteres (16 de margen).
2. **El guion aprobado (§3) manda, palabra por palabra.** Los pormenores y temas de cada fila se copiaron de §3, no de los resúmenes del plan. Variantes agregadas: `hijo-unico` (si `noTuvo` incluye hermanos), `quienes-fueron-tu-familia` (si no tuvo pareja, una sola versión), `dejar-el-trabajo-sigue` (si la ficha dice que sigue trabajando). "El más cercano / el que más nombró" (para elegir entre varios hermanos o hijos) se calcula como el nombre que más aparece en la ficha en texto.
3. **La historia grande de "adulto joven" va en la fila de juventud**, como marca §5 del guion (antes se perdía o caía en adultez media para alguien de 23-35 años).
4. **El máximo real del guion es 43 filas**, no 44: `recortarAlTope` nunca corre con una persona real, quedó testeada solo con una lista armada a mano.
5. **Una sola fila libre por etapa**, elegida recién después de la última pregunta de esa etapa (no se encadenan 3 juntas como hacía el código del plan en infancia).
6. **El cierre de cada etapa se mira por bloque**, no por tramo.
7. **Tope de 2 repreguntas por etapa** (1 + la de respuesta corta).
8. **Un "hoy no" en una repregunta o en el pedido de un objeto reserva esa respuesta** (no se vuelve a insistir).
9. **Una salida cortada o vacía del modelo ahora tira error y pide `--reprocesar`**, en vez de leerse como "todo bien" (antes se perdía un "no quiero seguir" si la respuesta venía cortada).
10. **En los prompts de evaluación y pedidos, las banderas del JSON van antes del texto libre**, para no perder un "no quiero seguir" si la salida se corta a la mitad.
11. **La lista de "ya hechas" que ve el modelo no lleva ids, solo la cabeza de cada tema** (la receta original con ids no entraba en el presupuesto de 13.800 caracteres).
12. **Hubo una ventana roja planificada, Tareas 5 a 11**: partes de `secuencia`, `estado-v2` y `manual-v2` quedaron en rojo a propósito mientras se armaban en tareas sucesivas — así lo pedía el plan, aunque rompe tu regla de "verde por tarea". Quedó verde de nuevo desde la Tarea 11 en adelante.
13. Se restauraron los tests del encargo (`test/encargo-entrevista.test.ts`) que se habían desactualizado.

## Textos para que apruebes antes del piloto

Están juntados en `docs/esqueleto-v2-textos-para-aprobar.md` (generado con `scripts/render-textos-v2.ts`, sin llamar al modelo). El doc sigue marcado **"Pendiente de aprobación"** — no lo aprobé yo, falta tu revisión.

Además, en el arreglo final se agregó un encargo nuevo que no estaba en ese doc (el objeto del cierre del libro, distinto del objeto de cada época). Texto completo, para que lo apruebes:

> Pedile UNA cosa que tenga en casa y que guardaría de toda su vida: un objeto, un papel, una foto vieja, lo que sea. Con una foto, y que cuente por qué esa. Si no tiene, no pasa nada: no se insiste nunca.

(El de cada época, sin cambios: "Pedile UNA cosa que tenga en casa de esa época ({tramo}): un objeto, un papel, una foto vieja, lo que haya guardado. Con una foto, y que cuente de dónde salió. Si no tiene, no pasa nada: no se insiste nunca.")

## Lo que quedó sin hacer / anotado

- **Historia grande repetida en una sola línea (recomiendo arreglarlo antes del piloto).** En la lista de "ya hechas", las dos filas de historia grande quedan con la misma cabeza ("Lo grande que le tocó al país en esa época"). A vos te tocan la pandemia y el Mundial, seguidas en juventud: cuando el biógrafo escriba la del Mundial, la lista ya le dice "no vuelvas sobre" ese mismo tema, y puede esquivarla o no saber cuál evento ya se habló. Arreglo chico: que la línea diga el evento ("… : la pandemia"), ~40 caracteres.
- **Gasto de reintentos de Opus subestimado.** Si Opus corta la respuesta en el 2º o 3er intento de una pregunta, los usos de esos intentos no quedan anotados (el error se tira antes de sumarlos). Es plata chica y un caso raro, pero el costo real del piloto puede ser un poco mayor al calculado.
- **El doc del guion aprobado quedó con números viejos.** `docs/esqueleto-v2-guion-para-aprobar.md` §2 dice "29 preguntas y ~36" y "etapa ≤300 caracteres" y "prompt ≤6.000 tokens". El código real da **30 (Naza-tipo, fixture chico) / 40 (Élida, fixture chico)** — con la ficha real del piloto son 32 —, la etapa quedó en `etapaCampo` 220 (no 300, por el presupuesto total), y el prompt medido de la pregunta 40 da ~5.361 tokens (no 6.000). No se tocó el doc para no pisar lo que ya aprobaste; se anota acá para que sepas que el texto quedó desactualizado en esos tres números.
- **El estado del piloto cortado el 24/09 no conviene retomarlo.** Los ids viejos volverían como pendientes y las hechas viejas no tienen bloque asignado. El piloto nuevo arranca de cero, con un narrador nuevo (`naza-esqueleto`), no pisando el anterior.
- La ficha con tus datos reales (`entrevistador/test/fixtures/perfil-naza-piloto.json`) está commiteada en el repo, en la rama `esqueleto-v2` (commit `ca775e6`). Confirmame que estás de acuerdo con que quede ahí.

## Medición

Prompt de la pregunta 40, con tu ficha real del piloto, sin llamar al modelo (script de la Tarea 13):

| | Valor |
|---|---|
| Caracteres | 12.331 |
| ~Tokens (÷2,3) | 5.361 |
| Techo acordado | 13.800 caracteres (~6.000 tokens) |
| Con 8 repreguntas distintas | 13.227 caracteres |
| Peor caso (32 filas + 4 libres + 8 repreguntas + 8 objetos) | 13.680 caracteres |

Todos los casos entran en el techo de 13.800.

## El piloto

Comando exacto (verificado contra `entrevistador/scripts/manual-v2.ts`):

```
cd entrevistador && npm run manual-v2 -- empezar naza-esqueleto --nombre "Naza"
```

Costo estimado: el plan calculaba ~USD 4-5; la revisión final del arreglo lo estimó en **~USD 5-6** (≈50 llamadas a Opus a ~USD 0,07 c/u + ≈70 a Sonnet a ~USD 0,03 c/u + transcripción), antes de contar reintentos. **~USD 5-6, lo disparás vos.**
