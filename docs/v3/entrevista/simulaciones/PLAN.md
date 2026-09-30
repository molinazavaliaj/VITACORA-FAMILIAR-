# Simular la entrevista con narradores inventados

**Qué es:** el plan para correr la entrevista entera con agentes de IA que hacen de narradores **inventados** (nunca la vida de un narrador real), contestan cada pregunta como lo harían en audio, y ver qué falla. Pedido por Naza el 30/09/2026, antes del paso 3 (probarla él por WhatsApp). Se hace en un chat aparte.

## Por qué
El código decide solo con reglas (el "no" corto, el "paso", qué pregunta depende de cuál). Una lectura con "[responde]" no muestra qué pasa cuando alguien contesta de verdad: un "no me acuerdo", un "prefiero no", una respuesta que ya contesta la pregunta siguiente. Esto lo encuentra antes de la prueba real y sin gastar en transcripción.

## Cómo
1. **Script nuevo `fabrica/scripts/v3-entrevista-turno.ts`** (no tocar el código existente): hace de WhatsApp. Recibe un archivo de estado y la respuesta del narrador; con el código real de `fabrica/src/v3/entrevista/` (`siguientePregunta`, `mensajesDespues`, `acuseRotado`, `acuseAntesDe`, `acuseNeutro`, `entradaSegunAcuse`, `armarTurno`, `renderizar`) devuelve los mensajes de WhatsApp que siguen, exactamente como llegarían, y guarda el estado. Primera llamada: la bienvenida y la primera pregunta. Tests del script primero.
2. **Un agente por narrador** (Agent tool, dentro del plan de Claude: sin API paga). Recibe su ficha y su forma de ser, lee cada mensaje, contesta en personaje (como si hablara en un audio, en primera persona, con su manera de hablar) y llama al script con la respuesta, hasta el mensaje final. No ve el código ni el banco: solo lo que le llega por "WhatsApp".
3. **Cada charla se guarda** en `docs/v3/entrevista/simulaciones/<narrador>.md` (mensajes del biógrafo y respuestas, con los IDs para el equipo).
4. **Fable lee cada charla como biógrafo** y marca fallas con el mensaje exacto: preguntas que no encajan con lo ya contado, un "no" o un "paso" mal entendido, temas salteados que no había que saltear, agradecimientos que suenan mal, partes que cansan, repeticiones, tono.
5. **Página para Naza** con las fallas agrupadas y una propuesta de arreglo por cada una. Naza decide; nada se cambia en el banco sin su ok. Registro en `hallazgos.md` (nuevo) en esta carpeta.

Arrancar con **un narrador de prueba** para validar el método (que el script y el agente funcionen de punta a punta) y después correr el resto.

## Los narradores (todos inventados)

Pedidos por Naza: madre soltera, viuda, solterón de toda la vida, una mujer con muchas parejas. Sumados para cubrir las formas de contestar que más pueden romper el código.

| # | Narrador | Vida (inventada) | Forma de contestar | Qué pone a prueba |
|---|---|---|---|---|
| 1 | **Madre soltera** | 68, crió sola a dos hijos, trabajó toda la vida, un amor corto de joven | Cálida, cuenta mucho de los hijos; a lo de pareja contesta con evasivas ("eso no fue nada") | AM0 con una respuesta ambigua; "¿tuviste más hijos?" si ya dijo cuántos; la crianza sola |
| 2 | **Viuda** | 74, 45 años casada, enviudó hace dos años, nietos | Se emociona, a veces corta ("prefiero no hablar de eso") | Sensibles y acuses sobrios; "¿esa historia tuvo un final?"; un "paso" dicho sin la palabra "paso" |
| 3 | **Solterón de toda la vida** | 77, nunca se casó, sin hijos, vivió con la madre hasta que ella murió, muy del barrio y del club | Parco, respuestas cortas, muchos "no" | Si el código saltea bien pareja e hijos y si la entrevista se siente fría o repetitiva para él |
| 4 | **Mujer con muchas parejas** | 71, tres matrimonios y varias parejas, hijos de dos de ellos | Charlatana, se va por las ramas, mezcla épocas | AM0 → "la primera que fue en serio"; AM9 con varias historias; respuestas que ya contestan la siguiente |
| 5 | **El que dice "paso" a su manera** | 70, migró de joven, carácter reservado | "Siguiente", "de eso no", "mejor otra", "no quiero" | Hoy el código solo entiende la palabra "paso": ¿qué pasa con las demás? |
| 6 | **La que no se acuerda** | 80, memoria floja, muy amable | "No sé", "no me acuerdo", "creo que no", "ay, ni idea" | Si un "no me acuerdo" se toma como "no me pasó" y se saltea un tema entero |

## Reglas
- Trabajar solo en el worktree `C:\Users\Naza\Desktop\VITACORA FAMILIAR-v3` (rama `v3`); push solo a `origin v3`.
- Nada pago sin avisar el costo a Naza. Esto corre dentro del plan de Claude (sin API); si en algún momento hiciera falta API o transcripción, frenar y avisar.
- No tocar el banco (`banco.md`) ni el código de la entrevista para "arreglar" lo que aparezca: se anota como hallazgo y decide Naza. Tampoco el código de Joaquín (`entrevistador/`).
- Vidas inventadas, nunca la de un narrador real (ni la de Naza ni la de Joaquín).
- Método de HERMES.md: agente por tarea, revisión por un segundo agente, commits en castellano rioplatense con Co-Authored-By.

## Lo que ya se sabe (no hace falta redescubrirlo)
- El plan B (Haiku para las respuestas que abren tema) está anotado en `correcciones-lectura.md`: si la simulación confirma que el código entiende mal seguido, es el candidato.
- El "vos/tú" (España) queda para cuando esté todo cerrado (Naza).
- Para mirar: si molesta el orden fijo de los agradecimientos y si el bloque 13 se hace largo.
