# Kids V2 · Los 6 arreglos del 05/10 · Informe

Rama `vitacora-kids`, worktree `VITACORA KIDS`. Sin push. Cada arreglo con TDD (primero el test en rojo). Tests nuevos en `fabrica/test/kids-v2-arreglos.test.ts`.

## Commits
| Commit | Arreglo |
|---|---|
| `544473f` | 6 · algo preocupante: exclusiones |
| `c00fa73` | 1 · K18 según los temas sacados |
| `70bd273` | 2 · la línea de la pregunta del padre dice quién la manda |
| `ef94a33` | 3 y 4 · en una foto, algo corto vale como su botón negativo solo si dice que no (K24: [Hoy no la como]) |
| `68deb45` | 5 · canal B: TERMINO-PADRE aunque el padre nunca toque el botón del final |
| (este) | README, handoff e informe |

## 1. K18 (familia ensamblada)
- **Rojo**: 5 tests fallaban (`BORRADOS_POR_TEMA is not iterable`; con papá sacado salía "…de tu mamá o de tu papá…"; `textoSegunTemas` no existía).
- **Cambio**: `compra.ts` → `BORRADOS_POR_TEMA` (datos: pregunta K18, la frase aprobada exacta `como la pareja de tu mamá o de tu papá, o alguien` y qué se borra en cada caso) y `textoSegunTemas()`. `mensajes.ts/preguntaMsg` lo aplica (también al reenvío de canal B). Si la frase ya no está en el banco y hay un tema sacado, tira error.
  - sin papá → "…como la pareja de tu mamá, o alguien que vino a vivir con ustedes…"
  - sin mamá → "…como la pareja de tu papá, o alguien…"
  - sin los dos → "…como alguien que vino a vivir con ustedes…"
- **Tests**: la frase sigue en el banco y cada borrado está dentro de la frase (avisa si cambia `banco.md`); el texto tal cual con los dos temas; las tres variantes exactas; cada variante es una subsecuencia de palabras del aprobado (ninguna palabra nueva); error si la frase cambia.
- **Resto del banco**: test que recorre preguntas, otras puertas, fotos, ramas, extras y mensajes fijos: fuera de K10, K11 y K18 (que salen con su tema) y las extras X2-1 a X2-8 (que ya salen con su tema por `temaDeExtra`), **nada más nombra a mamá o papá**. No hubo otros que arreglar.
- **Lectura corrida**: la mamá sacó papá → K18 ahora dice "como la pareja de tu mamá, o alguien que vino a vivir con ustedes".

## 2. La línea de la pregunta del padre
- **Rojo**: 3 tests (con `quien: 'Tu mamá'` y quién regala "Tus abuelos" salía `PADRE-PREG-LINEA-PL` "tus abuelos"; plural al revés; el evento `ficha` no guardaba `quien`).
- **Cambio**: `PreguntaPadre.quien?: string` (cómo le dice el chico: "tu mamá"); `validarFicha` lo normaliza como quién regala (vacío = no está); el item `padre` del guion lo lleva; `padreMsgs` usa `quien ?? quienRegala` para {{1}} y para elegir `-PL`. El panel lo manda en el evento `ficha` (preguntasPadre). Se borró `variables.quien` (ya no se usa).
- **Tests**: con `quien` singular y plural, sin `quien` o vacío (fallback), sin línea, por el evento `ficha`.
- **Lectura corrida**: la primera pregunta de la mamá ahora lleva `quien: 'Tu mamá'` → "Esta pregunta te la manda tu mamá, con sus palabras." (antes "te la mandan tus abuelos"). El encabezado de la lectura lo dice.

## 3 y 4. Algo corto en una foto
- **Rojo**: 9 tests ("ya te la mando", "ahí va", "nono", "después la busco" y un audio corto sin transcripción daban B-FOTO-NOTENGO; en K24 un "no" daba ACUSE + B-SEGUIR; "ya te la mando" en K24 igual).
- **Cambio**: `reglas.ts` → `PALABRAS_NO` (no, nada, ninguno, ninguna, tampoco, nunca). `rafaga.ts` → `diceQueNo()` (palabras enteras, con la normalización de `preocupante.ts`: sin tildes ni mayúsculas). En la fase `foto`, algo corto sin foto: si dice que no → `noTengo` (B-FOTO-NOTENGO / B-FOTO-PLATA) o, si la foto solo tiene [Hoy no la como] (K24), `hoyNoLaComo` (nuevo en `botones.ts`, lo usa también el botón: sin mensaje, espera el audio); si no dice que no → nada: sin acuse, la fase sigue en `foto` y vence como siempre. Lo largo, igual que antes (acuse y sigue).
- **Tests**: "no tengo", "nada", "No.", "NINGUNA así", "ninguno", "tampoco tengo", "nunca saqué", audio corto con "Nó, no tengo" → B-FOTO-NOTENGO; "ya te la mando", "ahí va", "nono", "después la busco" → nada y, cuando llega la foto, ACUSE-FOTO + B-SEGUIR; audio corto sin transcripción → espera; después de B-FOTO-NOTENGO (escrito o tocado) llega la foto → ACUSE-FOTO + B-SEGUIR (ya andaba; quedó con test); extra X1-7 y foto vencida K1-FOTO; K24: "no" → foto-audio sin nada, "hoy no" seguido de un audio largo da lo mismo que tocar [Hoy no la como], "ya te la mando" espera.
- **Test viejo cambiado**: `kids-v2-revision-final.test.ts`, "la foto de una extra (X1-7) y una foto vencida al final (K1-FOTO): igual": el audio de 4 s **sin transcripción** en K1-FOTO ahora espera la foto; se le puso la transcripción "no tengo" para que siga probando lo mismo (que la foto vencida acepta el "no").
- Ojo para Joaquín: sin la transcripción, un audio corto en una foto ya no cuenta como [No tengo] (el README lo dice).

## 5. Canal B: TERMINO-PADRE con el final retenido
- **Rojo**: 2 tests (cierre solo el 10, final retenido: el 12 a la hora no salía nada; el final que sale a la hora detrás de un PREG-NUEVA-PADRE, igual).
- **Cambio**: en canal B, cuando el final queda retenido (el cierre solo de `reloj.ts/cerrarConFinalRetenido`, o `flujo.ts/empezarItem` del final que queda detrás de un PREG-NUEVA-PADRE), `terminoPadre` = el día del cierre + `CIERRE_SOLO_DIAS` (2). `alaHora` ya no espera a que se suelte el final: a esa fecha, a la hora (nunca de noche), sale TERMINO-PADRE (plantilla, al padre) y `terminoPadre` queda en null. Si el final se suelta antes, `soltarRetenido` lo pasa al día siguiente de que llegó (como antes); si se suelta después, no vuelve a salir. Canal A sin cambios.
- **Tests**: cierre el 10 → nada el 11 ni el 12 a las 17:59 → TERMINO-PADRE el 12 a las 18:00 (plantilla, al padre), el final sigue retenido, nada el 13; toca [Estamos listos] el 14 → FINAL-CHICO y nunca más TERMINO-PADRE; de noche no sale; si toca el 11, TERMINO-PADRE el 12 (al día siguiente del final); el final detrás de PREG-NUEVA-PADRE; canal A igual que antes.
- **Control `termino`** (`controles.ts`): en canal B, si TERMINO-PADRE sale después del final, tiene que ser otro día (como antes); si sale antes, tiene que haber un cierre con el final retenido (la marca `cerro-sin-respuesta` o un PREG-NUEVA-PADRE) 2 días o más antes; y si el libro cerró solo y el final llegó 3 días o más después sin TERMINO-PADRE antes, es violación. Con el motor viejo este control salta en la simulación de 240 (semillas 166 y 175, `se-calla`: "el final quedó retenido desde … y TERMINO-PADRE no salió a los 2 días"); con el nuevo, cero.

## 6. Algo preocupante: falsos avisos
- **Rojo**: 7 tests (`FRASES_EXCLUIDAS` no existía; "me corto el pelo/las uñas/el flequillo", "me quiero matar de la risa", "abuso de confianza", "ME CORTÓ EL PELO" saltaban).
- **Cambio**: `preocupante.ts` → `FRASES_EXCLUIDAS` al lado de `FRASES_PREOCUPANTES`, con el mismo aviso de BORRADOR para Naza y el abogado. Antes de buscar, cada exclusión (normalizada, por palabras enteras, también repetida) se cambia por un espacio.
- **Tests**: cada exclusión no salta (también en mayúsculas/tildes y repetida dos veces seguidas); "me corto" solo y "me quiero matar" saltan; una exclusión en la misma ráfaga no tapa otra frase ("me corto el pelo y a veces me corto" salta).

## Verificación (después del último commit de código)
- `npx vitest run test/kids-v2`: **15 archivos, 283 tests, todos en verde** (eran 236 en 14; +47 nuevos en `kids-v2-arreglos.test.ts`).
- `npx tsc --noEmit -p .`: sin errores.
- `npx tsx scripts/kids-v2-json.ts`: sin cambios en `banco.json` (no se tocaron `banco.md` ni `mensajes.md`).
- `npx tsx scripts/kids-v2-lectura.ts`: 376 globos; cambian K18 (sin "o de tu papá"), la línea de la pregunta del padre ("te la manda tu mamá") y dos líneas del encabezado.
- `npx tsx scripts/kids-v2-simular.ts`: 800 de 800 terminan, mediana 30 días, máximo 152, 198 808 mensajes (antes 198 838: los "no" cortos que no dicen que no ya no sacan B-FOTO-NOTENGO), **cero violaciones**; `simulaciones/resumen.md` regenerado (cambia el texto del control `termino`).
- Semillas 1..2000: 2000 de 2000 terminan, mediana 31, máximo 156, **cero violaciones**.

## Tests existentes que cambiaron
- `kids-v2-revision-final.test.ts`: el audio corto en K1-FOTO lleva la transcripción "no tengo" (ver 3 y 4).
- `kids-v2-lectura.test.ts`: la lectura ahora tiene `PADRE-PREG-LINEA` ("te la manda tu mamá") en vez de `PADRE-PREG-LINEA-PL` ("tus abuelos").

- K24 (la foto con "contame la última vez que la comiste"): algo corto sin palabra negativa ("milanesas") es la respuesta y lleva acuse normal y sigue el día; con "no" sigue valiendo como [Hoy no la como]. Las otras fotos no cambian ("ya te la mando" espera en silencio). Reemplaza el viejo test "ya te la mando en K24".

## Para mirar
- Un "no" corto en una foto que tiene solo botones "no es lo mío" ([No hago], [De ninguno], [No miro]) sin [No tengo]: hoy ninguna foto del banco es así (solo K24 no tiene [No tengo]); si apareciera, algo corto que dice que no no hace nada (espera la foto).
- La lista `PALABRAS_NO` y las exclusiones son decisiones de código; la de exclusiones queda como borrador para Naza y el abogado.
