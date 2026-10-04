# Pase de manos — 04/10/2026: la entrevista V3 en catalán

Rama **`v3-catala`** (worktree `C:\Users\Naza\Desktop\VITACORA FAMILIAR-catala`, sale de `v3` en `feeda45`), pusheada a `origin`. **Sin mergear a `v3`** (espera el OK de Naza). 1455 tests verdes, `tsc` limpio. `entrevistador/` sin tocar. Diseño: [`entrevista/catala/diseno.md`](entrevista/catala/diseno.md).

## Qué quedó hecho (verificado)
| Tema | Dónde |
|---|---|
| Campo `idioma` (`'es-AR'` / `'ca'`; vacío = es-AR) en la ficha de la entrevista; `contexto.idioma` en el CONTRATO | `idioma.ts`, `texto.ts` (`FichaEntrevista`), `supabase/CONTRATO.md` |
| Todos los textos en catalán (199 preguntas, 65 mensajes, 44 botones, bloques, la repregunta), **sin tocar `banco.md`** | `docs/v3/entrevista/banco-ca.md` → `banco-ca.json`; fijados letra por letra en `test/fijos/banco-ca-aprobado.json` |
| El flujo elige los textos por idioma (misma estructura de banco.md) | `banco.ts` (`bancoDe`, `preguntaPorId(id, idioma)`…), `flujo.ts` |
| Detector en catalán (y castellano: quien habla catalán mezcla): passo, no me'n recordo, ja t'ho he explicat, ja està tot, AMH, HI0, "encara que"… | `respuesta.ts` (`FRASES`) |
| Cazador con prompt en catalán (el original no se toca), bloques en catalán, controles de tiempo en catalán | `cazador/prompt-v3-1-ca.md`, `cazador.ts` |
| Transcripción con `language: 'ca'` y vocabulario de Cataluña | `transcribir.ts` |
| `--idioma ca` en la simulación por turnos y en la página de prueba | `v3-entrevista-turno.ts`, `v3-entrevista-web.ts` (launch `entrevista-catala`, puerto 5179) |
| El material del escritor lee la entrevista catalana con el banco y el detector en catalán (el libro en catalán, no) | `v3-entrevista-a-material.ts` |

## Cómo se verificaron los textos (Naza no habla catalán)
1. Tradujo Opus en la sesión (adaptado; colimba → la mili, barra → colla, tus viejos → els teus pares…).
2. Otro agente, **sin ver el castellano**, lo volvió al castellano y marcó problemas: ~60 arreglados (calcos, pronombres, género). Tablas en `entrevista/catala/revision/`.
3. Corrector de **Softcatalà** (LanguageTool, normativa IEC): 30 avisos, arreglados los reales (néts → nets, digue-m'ho → digues-m'ho, "Fins aquí hem arribat"…).
4. **Simulación completa** con una narradora inventada en catalán (Roser, 126 respuestas): ningún texto en castellano ni marcas sin reemplazar; las 8 pruebas del detector con el acuse correcto. Lo que marcó del catalán se ajustó (PE4, AS7, TR6, JU12, ES2, OR2, M28.4/5). `simulaciones/catala/`.
5. **Cazador** probado por Opus en la sesión sobre 3 bloques (USD 0): 2 repreguntas en buen catalán que pasan los controles. `simulaciones/catala/cazador/`.
6. **Revisión de código** de otro agente: 4 bugs confirmados, arreglados con test (`f1b4a7b`).

Plata: **USD 0** (todo con agentes en la sesión; Softcatalà es gratis).

## Lo que la simulación marcó y NO se tocó (pasa igual en castellano: es del banco, no del idioma)
- JU20 ("¿te mudaste muchas veces?") llega aunque haya tocado [No, nunca me mudé] en JU8.
- La mili (JU5) también se le pregunta a una mujer (en castellano igual: "la colimba, la mili, un colegio militar…").
- AMH ("¿hoy estás en pareja?") llega aunque ya haya dicho que el marido murió; AM9 habla de "una separación" a una viuda; HE2 en plural con un solo hermano.
- Los acuses rotan sin mirar el peso de lo contado.
- La coletilla "Si ya me lo contaste, decímelo…" en muchas seguidas.

## Hallazgo para el castellano (sin tocar)
El esquema JSON del cazador (`{"elegidas": …}`) está en la sección "Esquema de salida" de `prompt-v3-1.md`, que **no** se le manda al modelo: en castellano funciona porque el modelo deduce la clave de "Campos de cada elegida". En el catalán se puso adentro del prompt. Conviene hacer lo mismo en castellano (decisión de Naza).

## Pendiente
- **Naza:** OK para mergear `v3-catala` a `v3`.
- **Joaquín:** la web escribe `contexto.idioma = "ca"` cuando quien regala elige catalán; el entrevistador lo lee y lo pasa (ver el mensaje abajo y el CONTRATO). Para Imma: poner `contexto.idioma = "ca"` en su narrador **antes** de que reciba la próxima pregunta.
- El libro en catalán (otro chat): lo que conteste Imma le llega al escritor en catalán.
- Variantes `es-ES` (tú de España): mismo molde (`banco-es-ES.md` + su entrada en cada paquete).

## Qué NO hacer
- No tocar `banco.md` ni `prompt-v3-1.md` para arreglar el catalán: se arregla en `banco-ca.md` / `prompt-v3-1-ca.md` y se actualiza el fijo de los tests.
- No copiar la vida de Imma (ni de nadie real) a docs, commits ni prompts.
- No tocar `entrevistador/`. No push a `main`.
