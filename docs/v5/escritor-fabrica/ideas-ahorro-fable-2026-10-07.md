# Ideas de ahorro del escritor, según Fable (07/10/2026)

Pedido de Naza: "qué otras cosas se te ocurren para ahorrar, preguntale a Fable". Fable 5.1 leyó el código, las dos pruebas pagas y los tamaños de la corrida eco (sin llamar a la API). Nada de esto está programado: espera la decisión de Naza.

Corrección de la proyección: registro + plan (Etapa A) medirían ~1,35 y no 0,85 → el libro está en **~12,4–12,9**.

| # | Idea | Ahorro por libro | Riesgo | ¿Toca la receta? |
|---|---|---|---|---|
| 1 | Capítulo en `high` (la primera página puede seguir en xhigh) | −2,4 | medio | no |
| 2a | Decirle al capítulo el número concreto: "tenés N respuestas, como mucho M afuera" (menos reescrituras C30) | −0,5 | bajo | sí (una oración en el Paso 3b) |
| 2b | La reescritura C30 en `high` (ya trae la lista de lo que faltó) | −0,2 a −0,5 | bajo-medio | no |
| 3 | Capítulo con max_tokens 128.000 (que no se pague dos veces un corte) | seguro | cero | no |
| 4 | Armador a Sonnet 5.5 (no escribe prosa, arma el mapa) | −0,57 | medio | no, pero Naza eligió Opus para escribir |
| 5 | Haiku con 3.000 de pensamiento en el estilo (no 8.000) | −0,30 | bajo | no |
| 6 | Sacar las marcas de caché de 5 min que nunca pegan; caché de los hechos según haya disputas | −0,2 | cero | no |
| 7 | Disputas con documentos cortos (hoy llevan 178k tokens; si la caché venció cuestan 0,36 cada una) | seguro contra +0,3 a +1,1 | bajo-medio | prompt de fabrica.md (Naza) |
| 8 | Registro recortado para el verificador de hechos (sin episodios ni dudas) | −0,15 | bajo-medio | sí (Paso 4) |
| 9 | JSON compacto (sin sangría) en lo que se le manda al modelo | −0,12 | cero | no |
| 10 | Opus `low` en veedor y arreglos | −0,25 | bajo-medio | no |
| 11 | Arreglos a Sonnet 5.5 (reserva) | −0,55 | medio | no, pero reescriben prosa |
| 12 | `task_budget` (beta) en el capítulo, en vez de `high` | −2,0 | medio | no |

Descartado por Fable: juntar resumen y título con otras llamadas, hechos por capítulo, reordenar documentos, Fable en low para el capítulo, arreglos "por diferencias" (ya lo son).

Combinación recomendada: 1 + 2a + 2b + 3 + 4 + 5 + 6 + 8 + 9 (+7 como seguro) → **libro ≈ USD 8,0–8,5**. Sin tocar la receta: ~8,4–8,9 (sin margen). Prueba sugerida antes: capítulo VI en `high` y en `medium` con armador Sonnet, a ciegas contra el xhigh (~USD 0,8); después un libro entero midiendo Etapa A, disputas y C30.
