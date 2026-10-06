# El escritor v5.5 en la fábrica — diseño (06/10/2026, aprobado por Naza en el chat)

Rama `escritor-fabrica` (worktree `VITACORA FAMILIAR-escritor-fabrica`): sale de `origin/v3` (entrevista V3 con catalán, escenas y castellano de España) con `origin/v3-escritor` (escritor v5.5) mergeado; no se pisaban archivos.

## Qué se quiere
Que un pedido escriba el libro con el **escritor v5.5** (el que Naza aprobó), solo para entrevistas **V3**, de punta a punta y sin una sesión de Claude Code abierta. Hoy el v5.5 es un Workflow que corre dentro de una sesión (USD 0 de API, rutas fijas, agentes que leen y escriben archivos) y producción escribe con el escritor viejo.

**Decisiones de Naza (06/10):**
1. Solo V3. La entrevista vieja no se usa más ("va a quedar la última entrevista con el último escritor").
2. Antes de escribir, la familia revisa **en el dashboard** (el de `docs/v3/entrevista/flujo-vigente.md` §8, diseñado, sin programar): nombres, dudas ficha contra entrevista (DD1/DD2) **y las dudas de datos que encuentra el escritor** (nombres, fechas, parentescos, lugares), en lenguaje de familia. Lo obligatorio son las dudas; ver las respuestas con audio es opcional.
3. Plazo de **7 días** con un recordatorio; si no revisó, el libro se escribe igual con lo que hay.
4. Las correcciones de la familia se aplican al registro con un **modelo barato** (tarea mecánica); el control C14 lo verifica y, si falla, lo rehace Opus. Sin correcciones, no se llama a ningún modelo. Además las correcciones llegan a todos los pasos como `<confirmado_por_la_familia>` (manda sobre la entrevista).
5. Ahorros sin cambiar pasos ni modelo (Opus en todo lo que escribe): **(1) caché de prompts**, con lo fijo primero (guía, ficha, respuestas); **(3) Batch** (mitad de precio) en las fases paralelas (estilo, títulos, arreglos, disputas, fichas si se puede); **(4) sin la lectura final** (solo armaba el informe). El ahorro (2) "pensar menos en los pasos mecánicos" queda **afuera** por ahora.
6. Las dudas narrativas ("esta historia quedó por la mitad") van al **informe interno**, no a la familia. Si los primeros libros muestran muchas dudas de datos, se suman al dashboard.
7. El costo importa ("un dólar es un dólar"): se registra el gasto de cada llamada y se mide con una prueba paga de **un capítulo** (~USD 1, avisada) antes de seguir.

## El camino de un libro
1. Termina la entrevista V3 (la guarda el entrevistador en la base: Joaquín).
2. **Etapa A — registro y plan** (2 llamadas Opus, ~USD 1): igual que v5.5 + un paso nuevo que saca las **dudas de datos para la familia** del registro (texto para la familia: lo aprueba Naza).
3. **Dashboard** (Joaquín): la familia contesta; plazo 7 días con recordatorio.
4. **Etapa B — corrección del registro**: si hubo correcciones, modelo barato aplica → C14 → si falla, Opus rehace registro y plan. Las correcciones van como `confirmado`.
5. **Etapa C — el libro** (v5.5 desde 2h: armador, capítulo, ficha, piezas, frases, hechos, veedor, arreglos, disputas, repaso, estilo ×2, títulos). Sin lectura final.
6. **Salida**: `libro.md` → la plantilla y el PDF de producción (fotos de la familia, «Su voz» con QR), también en catalán y castellano de España; `informe.md` interno.
7. La familia lee y cierra (o se cierra sola a los 30 días); imprenta (ya arreglada el 06/10: no se borra el borrador del libro).

## Las piezas (cada una con una sola tarea, testeable sola)
| Pieza | Qué hace | Depende de |
|---|---|---|
| `escritor/prompts` | Compila los prompts de la receta v5.5 (`docs/v5/escritor-v55/receta.md`) y la guía (`docs/v5/escritor/guia.md`) a un JSON versionado; un test falla si el JSON no está al día con los md. Los prompts no se reescriben. | — |
| `escritor/material` | Arma `respuestas`, `ficha` y `confirmado` (estructuras en memoria, mismas etiquetas que hoy) desde el estado V3 (`v3-entrevista-a-material.ts`) + correcciones de la familia. | banco V3 |
| `escritor/roles` | Una función por rol: arma el pedido (lo fijo primero, para la caché), llama a la API (`claude-opus-5-5`; el barato solo en la corrección del registro), devuelve texto/JSON validado, registra el uso. | prompts, cliente API |
| `escritor/controles` | Los controles, arreglos, estilo, afuera y estado de v5.5 (`controles.mjs`, `arreglos.mjs`, `estilo.mjs`, `afuera.mjs`, `estado.mjs`, `lib.mjs`) como funciones TS sin disco. Misma lógica, mismos topes. | — |
| `escritor/orquestador` | El recorrido de `workflow-libro.js` (reintentos, barreras exit 2/3 como valores, paralelo y Batch), con **checkpoint por paso** en Storage: si se corta, retoma sin repagar. Etapas A, B y C separadas. | roles, controles, almacén |
| `escritor/dudas` | Del registro → dudas de datos para la familia (estructura + texto). | roles |
| `escritor/salida` | `libro.md` → lo que pide `plantilla-html.ts` (primera página sin encabezado, "I · Título", Sus frases, Antes de cerrar, Para los míos; títulos fijos por idioma); «Su voz» desde `sus_frases.json` (R.. → respuesta → audio). | plantilla de producción |
| `escritor/costos` | Precio de `claude-opus-5-5` (USD 4/20; hoy `costos.ts` lo cobraría como opus-5) y del modelo barato; Batch a mitad; caché. | — |

Todo en `fabrica/src/escritor/` (nuevo; no se pisa `fabrica/src/libro/`). El worker de producción **no se toca** en esta rama: el enchufe (cola propia para que un libro de horas no frene el tick, disparo desde el dashboard) va cuando Joaquín conecte la V3.

## Cuando algo falla
- Registro o plan sin pasar los controles después de 2 reintentos → **corta** y avisa (como hoy).
- Cualquier otra pieza: una ronda de arreglo, lo abierto va al informe (como hoy).
- Error de API (red, 529, límite): reintento con espera; el checkpoint evita repagar lo hecho.
- Batch que vuelve con errores: esas llamadas se repiten sin Batch.
- Un "antes" de un cambio que no aparece tal cual → no se aplica y queda anotado (como hoy).
- Tope de gasto por libro (USD 15 por defecto): si se pasa, corta y avisa.

## Cómo se prueba
- Tests sin modelo: cada control y cada pieza con datos fijos (la entrevista de Joaquín guardada en `fabrica/prueba-v3-joaquin/`), el orquestador con un modelo falso que devuelve las salidas guardadas de la corrida v5.5 (debe llegar al mismo `libro.md` paso por paso), el checkpoint (cortar a mitad y retomar sin llamar de nuevo), los prompts compilados contra los md.
- **Prueba paga de un capítulo** (~USD 1, avisada antes): registro y plan guardados + un capítulo entero por API, con caché y Batch donde aplique. Mide costo real y Naza compara el capítulo con el de la sesión. Si la calidad baja, se ajusta antes de seguir.
- Recién después, un libro entero (costo avisado).

## Qué NO entra en esta rama
- El dashboard, guardar la V3 en la base, la cola del worker (Joaquín).
- Kids y Viaje (otro escritor, otro proyecto).
- El ahorro (2) de pensar menos.
- Cambiar textos aprobados del escritor (receta y guía quedan como están).
