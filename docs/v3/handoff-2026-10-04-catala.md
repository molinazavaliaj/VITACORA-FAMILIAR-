# Pase de manos — 04/10/2026: la entrevista V3 en catalán

Rama **`v3-catala`** (worktree `C:\Users\Naza\Desktop\VITACORA FAMILIAR-catala`, sale de `v3` en `feeda45`), pusheada a `origin`. **Mergeada a `v3` el 04/10 con el OK de Naza** (fast-forward a `6912180`). 1456 tests verdes, `tsc` limpio. `entrevistador/` sin tocar. Diseño: [`entrevista/catala/diseno.md`](entrevista/catala/diseno.md).

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

## Lo que la simulación marcó en el banco (pasa igual en castellano) — ARREGLADO el 04/10 (Naza: "errores claros, arreglalos")
| # | Qué pasaba | Arreglo (castellano y catalán) |
|---|---|---|
| 1 | El esquema JSON del cazador no estaba dentro del prompt (el modelo adivinaba la clave `elegidas`; si fallaba, el bloque quedaba sin repreguntas en silencio) | Esquema adentro de `prompt-v3-1.md`; sin `elegidas` es "salida ilegible" (`a3fe12a`) |
| 2 | La mili (JU5) se le preguntaba también a mujeres | JU5 sale del banco (a `banco-descartadas.md`); el cazador ya no la nombra |
| 3 | JU20 ("¿te mudaste muchas veces?") después de tocar [No, nunca me mudé] | Botón [No, nunca me fui]; JU20 suma "aunque sea de casa dentro del mismo lugar" |
| 4 | AMH ("¿hoy estás en pareja?") repetía lo que ya pedía AM0 | AM0 ya no pregunta "si hoy hay alguien"; AMH suma "Si ya me lo contaste, con el botón alcanza" |
| 5 | AM9 le hablaba de "una separación" a una viuda | "contame cómo fue el final de esa historia: una despedida, como haya sido" |
| 6 | HE2 daba por hecho varios hermanos | "¿con tus hermanos (o con tu hermano o hermana, si tuviste uno solo) también se hicieron amigos?" |

Quedan sin tocar (no son errores claros): los acuses rotan sin mirar el peso de lo contado; la coletilla "Si ya me lo contaste, decímelo…" en muchas seguidas.

## Pendiente
- **Joaquín:** la web escribe `contexto.idioma = "ca"` cuando quien regala elige catalán; el entrevistador lo lee y lo pasa (ver el mensaje abajo y el CONTRATO). Para Imma: poner `contexto.idioma = "ca"` en su narrador **antes** de que reciba la próxima pregunta.
- El libro en catalán (otro chat): lo que conteste Imma le llega al escritor en catalán.
- Variantes `es-ES` (tú de España): mismo molde (`banco-es-ES.md` + su entrada en cada paquete).

## Qué NO hacer
- No tocar `banco.md` ni `prompt-v3-1.md` para arreglar el catalán: se arregla en `banco-ca.md` / `prompt-v3-1-ca.md` y se actualiza el fijo de los tests.
- No copiar la vida de Imma (ni de nadie real) a docs, commits ni prompts.
- No tocar `entrevistador/`. No push a `main`.
