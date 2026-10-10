# Simulación en castellano de España: informe (06/10)

Rama `v3-tu`. Misma prueba que la de Roser en catalán (04/10), ahora con `--idioma es-ES`. La conversación entera está en [`pilar.md`](pilar.md).

**Narradora inventada.** Pilar, 74 años, nacida en 1952 en Torrecilla del Páramo (pueblo inventado de Palencia). Hija de labradores, dejó la escuela a los 12, se fue a Madrid a los 17 a servir, después 30 años en el taller de arreglos de unos grandes almacenes. Casada con Fernando, taxista (murió en 2019). Un hermano muerto en un accidente (Tomás, 1998), una hermana viva. Dos hijos, tres nietos. Vida inventada entera; ninguna persona real.

**Cómo se hizo.** `fabrica/scripts/v3-entrevista-turno.ts nueva … --idioma es-ES --genero mujer`, después `responder` turno por turno. Contestó un agente en personaje, en castellano de España. Sin cazador y sin API: **USD 0**. Cada respuesta se volvió a pasar por `interpretar` en es-ES y en es-AR para ver qué leyó el detector (tabla del punto 2).

**Cuenta.** 103 preguntas del banco, 118 respuestas (con los botones), 140 mensajes del biógrafo. Llegó al mensaje final.

**Aviso sobre la simulación.** En 6 turnos el agente contestó algo que no correspondía a la pregunta (ES5, JU13, AM13, TR8, HI6, HI7), porque mandó la respuesta antes de leer la pregunta. El flujo lo tomó como "contó algo", que es lo esperable. No es un error del código.

---

## 1. Textos en rioplatense, marcas sin reemplazar o en catalán: **cero**

Se buscó en los 452 renglones del biógrafo:
- marcas `{{…}}`, `«…‖…»` y `⟦…⟧`: ninguna;
- voseo (`querés`, `contame`, `decime`, `tenés`, `sos`, `vos`, `acá`, `alcanza`, `che`, `recién`, `nomás`, `plata`, `viejos`…): ninguno;
- catalán (`amb`, `també`, `explica'm`, `però`…): ninguno.

Todo sale de tú, con vosotros (`os`, `hacíais`, `os conocisteis`) y con palabras de España (`móvil`, `vale`, `pillar`, `coger`). El género anduvo bien en casi todo (`pequeña`, `orgullosa`, `tranquila`, `unida`, `contigo misma`). Excepciones en el punto 3.

## 2. Detector en es-ES

### Pruebas específicas (lo que suma España, más rioplatense "por si acaso")

| # | Pregunta | Qué dijo | Leyó | Acuse / qué pasó | |
|---|---|---|---|---|---|
| a | OR5 | "No lo recuerdo." | olvido (es-AR leería "no") | "No pasa nada, Pilar. Vamos con otra." | ✅ |
| b | CI1 | "Eso es todo, hijo." | no (fórmula de cierre) | "Bien, seguimos." | ✅ |
| c | CA3 | "Ya te lo he contado antes." | ya-conto (es-AR leería "contó") | "Bien, entonces." | ✅ |
| d | CA14 | "Paso de esta." | paso (es-AR leería "contó") | "Vale, nos la saltamos. Vamos con otra." | ✅ |
| e | CA16 | "No me acuerdo, che, la verdad." (rioplatense) | olvido | **llegó la segunda oportunidad** ("no hace falta un día exacto…") | ✅ |
| f | CA17 | "Prefiero no hablar de ello." + una frase que cuenta la enfermedad de la madre | no-ahondar | "Gracias, Pilar." (sigue un cierre) | ✅ |
| g | ES8 | "Paso muchas horas todavía acordándome de esos veranos…" | contó (el verbo, no "paso"; es-AR leería "paso") | acuse común | ✅ |
| h | AD6 | "Ya te lo conté recién, el Julián." (rioplatense) | ya-conto | "Bien, entonces." | ✅ |
| i | CI4 | "No, está todo. Bueno, espera, me acabo de acordar: …" | contó (es-AR leería "no") | "Gracias, Pilar. Eso también va al libro." | ✅ |
| j | JU20 | "Ya te lo he dicho hace nada." | ya-conto | "Bien, seguimos." | ✅ |
| k | CI5 | "Venga, no, ya está." | no | "Bien, entonces." | ✅ |
| l | TR2 | "No te lo vas a creer, pero…" + historia | contó | acuse común | ✅ |
| m | TR5 | "Vale, no me apetece." | paso (es-AR leería "contó") | "Vale, nos la saltamos." | ✅ |
| n | HS1 | "No te sabría decir." | olvido (es-AR leería "no") | "No pasa nada, Pilar." | ✅ |
| o | CI8 | "No, ya está todo, viste." (rioplatense) | no | "Bien, entonces." | ✅ |
| p | HE2 | "De eso no quiero hablar mucho, porque Tomás se fue muy pronto. Pero con Lourdes sí…" | no-ahondar | "Está bien. Lo que me has contado queda, y lo que no, no hace falta." | ✅ |
| q | CI10 | "Dejémoslo aquí." | paso (en un cierre) | "Bien, seguimos." | ✅ |
| r | PE4 | "Ya te lo había contado: el año sin el taxi, y lo de Tomás." | ya-conto | "Bien, seguimos." | ✅ |
| s | — | "Vale." solo (probado aparte con `interpretar`) | contó (es un sí) | — | ✅ |
| t | **AMH** | "**Que no, hijo, que estoy viuda, ya te lo he dicho.**" | **contó = "hoy tengo pareja"** | **se saltearon AM9 (el final de la historia) y AM19 (después, cuando te quedaste sola)** | ❌ |
| u | GI2 | "El del ictus de Fernando. Te lo he contado ya." | contó | acuse común (aceptable porque nombra algo) | ⚠️ |
| v | CA1 | "Se me ha olvidado casi todo de tan pequeña, pero me veo sentada…" | contó (no "olvido a medias") | "Gracias por contármelo." (queda mejor que "Con ese trocito me vale") | ⚠️ |

Botones: los 13 toques (Sí, No, Prefiero no contarla, No tengo foto, No, está todo) hicieron lo que tenían que hacer.

### Lo que leyó mal

1. **"Que no…" en AMH (grave).** Si la respuesta empieza con "Que", el detector no ve el "no" y tampoco busca "estoy viuda", que queda más atrás. Probado aparte: "Que no." → contó; "Que no, hijo, que estoy viuda" → contó; "No, estoy viuda." → no; "Estoy viuda." → no. **Pasa igual en es-AR**: "Que no" se dice en los dos. Consecuencia: a una viuda no se le preguntó por la muerte del marido ni por cómo siguió. Lo contó ella sola en el cierre del bloque (CI6: "que no me has preguntado cómo se murió Fernando"). Arreglo posible: que "que" al principio cuente como muletilla, o buscar las frases de "hoy no hay nadie" en toda la respuesta corta y no solo en las primeras palabras.
2. **"Te lo he contado ya" (con "ya" al final).** Sola, la lee como "contó". La lista solo tiene "ya te lo he contado". Menor. En es-AR pasa lo mismo con "te lo conté ya".
3. **"Se me ha olvidado…, pero [recuerdo]"** no entra como "olvido a medias": esas frases solo sirven para el olvido entero. Menor, y el acuse que sale queda mejor. Sería igual en es-AR con "se me olvidó, pero…".
4. Discutibles, no los cuento como error: "No, mote no. Me decían Pili y ya está." → "no" (dio un apodo). "Yo no, el del Atleti era Fernando." → contó. "Pues no lo sé, hijo." (a "¿te importa lo que piensan de ti?") → olvido. Los tres pasan igual en es-AR.

## 3. Frases que a una española le suenan raras, o preguntas que no van con su vida

**Solo de es-ES** (el original no tiene el problema o lo tiene distinto):

| ID | Qué dice | Qué pasa | Propuesta |
|---|---|---|---|
| JU12 | "Puede que ya me la hayas nombrado; ahora cuéntamela por dentro: cómo era, **con qué lo fuiste arreglando**" | Habla de *la* casa y después dice "lo". El original dice "ese lugar… lo fuiste armando" y ahí sí cierra. | "con qué la fuiste arreglando" |
| PG1 | "cuando tú **ya eras mayor**… los notaste **más mayores**" | En España "mayor" es "viejo". Repetido dos veces en la misma frase, suena a que la narradora ya era vieja. El original usa "grande" y "viejos". | "cuando ya tenías tu propia vida… los notaste más mayores" |
| CI8 | "Hasta aquí lo de **la familia de mayor**." | Se puede leer como "la familia mayor". En el original "de grande" se entiende. | "Hasta aquí lo de tu familia de adulta" (con marca) o "lo de tu familia en estos años" |
| ES5 | "una mejor amiga… qué hacíais **cuando estabais juntos**" | Masculino genérico con "amiga" justo antes. Menor. | "cuando os juntabais" |
| M3.8 | "**Te he escuchado bien.** Vamos a por la siguiente." | Suena a que el audio se oyó bien. El original "Te escuché bien" tiene lo mismo, pero acá sale muy seguido. | "Te he escuchado. Vamos a por la siguiente." o sacarla de la rueda |

**También en el original** (es-AR, y la mayoría también salió en catalán):

| ID | Qué pasa |
|---|---|
| EN4 | "esos años en que **uno** deja de ser niña": la marca cambia "niñ{{o/a}}" pero no "uno". En el original es igual ("uno deja de ser chica"). |
| HI2 | "tu primer **hijo**… **lo** tuviste en brazos", y la primera fue una nena (Marisa). Igual que en catalán. |
| AM1 / AM8 | "Empecemos por su nombre" sin puente, y "esa persona" para un marido de 44 años. Ella misma protestó: "que no es esa persona, que es mi marido". |
| AM21 | "Ahora las de antes." críptico, y llega después de que dijo "en serio, solo Fernando". |
| JU2 / CI3 | "¿Qué hiciste después del instituto?" y "del colegio o del instituto de después": no tienen sentido para una mujer de pueblo nacida en 1952 que dejó la escuela a los 12. Pasa lo mismo con "colegio" en el original. Más justo: "cuando dejaste la escuela". |
| AS1 | "y **una vez que** muestre bien cómo es esa amistad": "una vez que" se lee como "cuando". |
| M28.4 | "Con ese trocito me vale" después de una respuesta larga (CA16~2): minimiza. En España "me vale" es coloquial y algo seco. En catalán pasó lo mismo. |
| Repetidas | Le pregunta el nombre de la madre (CA2) y el del padre (CA3) cuando ya los había dicho en OR1. CO1 (el plato) repite CS1 (la tortilla). TR9 (el último día de trabajo) ya estaba en TR6. JU20 (mudanzas) llega después de que lo contó. HO9 lo mismo. |
| Acuses ante la muerte | Cuando cuenta la muerte del hermano (CA6) llega "Lo tengo, gracias. Vamos con otra.". Cuando nombra la muerte del marido (AM0) llega "Te he escuchado. Vamos con la siguiente.". Cuando la cuenta entera (CI6) llega "Apuntado, gracias. Ha quedado guardado junto con el resto.". Es el pendiente que ya está anotado: los acuses rotan sin mirar el peso de lo contado. En PE1, en cambio, quedó muy bien: "Lo guardo tal como lo has contado. Gracias." |

La mili (JU5) ya no salió: el arreglo del 04/10 funciona.

## 4. Errores del flujo

1. **AMH mal leído → AM9 y AM19 salteadas** (ver 2.1). Es el único error serio. Viene del detector y pasa en todos los idiomas.
2. **LE9 sin acuse** antes de LE8: nombró a una prima muerta ("fui yo sola al entierro") y nadie lo recogió. Ya había pasado en catalán.
3. **Acuse de olvido antes de un cierre**: después de "Pues no lo sé" (FI4) llegó "No pasa nada, Pilar. **Vamos con otra.**" y después "Hasta aquí esta parte…". La regla M26 (no anunciar "otra" antes de un cierre) vale para M3 pero no para el acuse de olvido. Menor.
4. **AMH se pregunta igual** aunque en AM0 haya dicho "Me he quedado sola" ("Si ya me lo has contado, con el botón basta" lo suaviza). Ya estaba en catalán.
5. **TR8**: la coletilla "Si ya me lo has contado…" va antes de la pregunta, igual que en catalán.
6. Por diseño, no es error: OR5 ("No lo recuerdo") no tiene segunda oportunidad porque no está entre las 8 que piden un día. La segunda oportunidad sí llegó en CA16.

## Resumen

- Ningún texto en rioplatense, en catalán ni con marcas sin reemplazar.
- El detector es-ES anduvo bien en 19 de las 22 pruebas (2 dudosas menores, 1 mal). Lee bien las frases de España, y también las rioplatenses, que donde una española diría lo mismo daban mal sin el es-ES (`Paso de esta`, `No lo recuerdo`, `Ya te lo he contado`, `No te sabría decir`, `Vale, no me apetece`, `Dejémoslo aquí`, `Paso muchas horas…`).
- Un error serio que no es de es-ES: **"Que no, … estoy viuda" en AMH se lee como "tengo pareja"**, y a una viuda no se le pregunta por el final ni por el después.
- Arreglos chicos que sí son de es-ES: JU12 ("lo" → "la"), PG1 ("mayor" dos veces), CI8 ("la familia de mayor"), ES5, M3.8.
