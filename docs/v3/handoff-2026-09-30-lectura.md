# Pase de manos V3 — 30/09/2026 (segundo chat: la lectura corrida)

Estado verificado al cierre (rama `v3`, worktree `C:\Users\Naza\Desktop\VITACORA FAMILIAR-v3`, todo pusheado a `origin v3`). Sigue al [`handoff-2026-09-30.md`](handoff-2026-09-30.md).

**Empezar por:** [`entrevista/flujo-vigente.md`](entrevista/flujo-vigente.md) (el flujo vigente) y [`entrevista/correcciones-lectura.md`](entrevista/correcciones-lectura.md) (qué cambió hoy y por qué).

## Qué se hizo
1. **La entrevista leída de corrido.** Script nuevo `fabrica/scripts/v3-entrevista-lectura.ts`: arma con el código del flujo todo lo que le llega por WhatsApp a una vida inventada (Rogelio, 72, con pareja, hijos y nietos) y lo escribe en [`entrevista/lectura-corrida.md`](entrevista/lectura-corrida.md). Naza la leyó en una página para el celular (artifact privado "Entrevista de Rogelio", versión 3).
2. **Correcciones de Naza al leerla**, aplicadas en `entrevista/banco.md`, el código y los tests:
   - Los cierres de **todos** los bloques (CI1 a CI14) van siempre en el núcleo; después, M24 (o M10 en las etapas).
   - La frase del "paso" (M1) solo en las 3 primeras preguntas, las 6 que abren tema y el bloque 11 (`llevaM1`).
   - Después de LE9, directo FIN (sin acuse).
   - **Frases de entrada** por bloque (EN2 a EN15; el 1, el 6 y el 11 no llevan), sección nueva "Entradas de bloque" en banco.md; `siguientePregunta` devuelve `entrada` en la primera pregunta que se manda de cada bloque.
   - **M24 más cortos**, sin frases que suenen a que terminó la entrevista; **CI14 nuevo** que pregunta.
   - Todos los textos los redactó Fable (como agente, voz de biógrafo) y los aprobó Naza.
3. **Orden de la documentación:** [`entrevista/flujo-vigente.md`](entrevista/flujo-vigente.md) nuevo y vigente; el flujo viejo pasó a `entrevista/historial/flujo-2026-09-30-antes-de-la-lectura.md`; índice `entrevista/README.md` al día; notas en `metodo-entrevista.md` donde quedaban los M24 viejos.
4. Cada paso lo revisó un segundo agente. Bugs de lógica: ninguno. Se arreglaron código muerto (la regla de "paso → cierre en el núcleo", que ya no hacía falta) y textos de docs que quedaban diciendo lo viejo.

**Verificado (primer tramo):** `cd fabrica; npx vitest run` → **749 tests verdes**; `npx tsc --noEmit -p .` limpio. Vida completa: 89 preguntas, 105 turnos, 224 mensajes del biógrafo.

## Después: rondas 2 a 4 (mismo 30/09)
Fable leyó la lectura corrida como la viviría el narrador, tres veces; Naza decidió cada cambio (registro completo en [`entrevista/correcciones-lectura.md`](entrevista/correcciones-lectura.md)):
- **Menos maquinaria:** el acuse va como primera línea del mensaje que sigue (el sobrio M4 va solo); sin "Terminamos esta etapa"; antes de un cierre o de LE9 va "Gracias, {{nombre}}." (M26); después de LE9 y de LE8, nada. De 224 mensajes del biógrafo a **127 mensajes de WhatsApp**. Código nuevo: `fabrica/src/v3/entrevista/mensajes.ts` (`armarTurno`, `acuseAntesDe`, `acuseNeutro`, `entradaSegunAcuse`).
- **Acuses neutros** (M25) si un cierre o una pregunta difícil se contesta con un "no" corto o "paso".
- **Orden:** final LE7 → preguntas de la familia → FO1 ("Otra cosa") → LE9 → LE8 → FIN; la política al bloque 12; "lo que todavía querés hacer" al 15. CA17, AD15, JU17 y TR11 con acuse sobrio.
- **Bienvenida en un solo mensaje** ("Una persona que te quiere mucho te regaló un libro con la historia de tu vida…"). Naza pidió pulirla más (sin "eh", sin "mejor amigo", sin tantos "nada"): dos versiones de Fable esperan su elección.
- **Veredicto de Fable (ronda 4): lista para que la pruebe una persona real.**
- **Pendiente grande:** todo el banco está en "vos"; el "tú" y las palabras locales (España) se hacen cuando esté todo cerrado (Naza). **Plan B** (Haiku para las respuestas que abren tema) anotado, sin programar.
- Documentación: [`entrevista/flujo-vigente.md`](entrevista/flujo-vigente.md) al día; las versiones anteriores del flujo, en `entrevista/historial/`.

**Verificado:** `cd fabrica; npx vitest run` → **776 tests verdes**; `npx tsc --noEmit -p .` limpio.

## Commits (origin v3)
`665cc72` lectura corrida · `d2194f0` cierres siempre, M1 donde aplica, LE9 directo · correcciones (Fable, 2 commits) · entradas + M24 + CI14 · orden de docs y este pase de manos.

## Lo que sigue
1. **Paso 3 del chat:** plan para que Naza haga la entrevista como narrador por WhatsApp, mirando el piloto manual del entrevistador (`entrevistador/`, `scripts/manual.ts`, código de Joaquín: **no modificarlo todavía**). Página con: cómo conectar el flujo nuevo, archivos nuevos, qué hace Joaquín, costo de transcripción, y el mensaje para pegarle a Joaquín. No construir nada hasta que Naza apruebe.
2. Dashboard: dudas DD1/DD2 y nombres pendientes.
3. Pendiente para cuando se active la ronda extra: dónde van los cierres (hoy llegarían antes de las extra de su bloque).
4. Elegir la bienvenida final (A o B de Fable) y aplicarla en BIEN.
5. En la prueba real, mirar: el orden fijo de los agradecimientos y el largo del bloque 13.

## Qué NO hacer
- No pisar archivos: lo nuevo en archivos nuevos (`entrevista/historial/`, `banco-v3.md`, `diseno-v3.md` quedan como historial).
- No usar vidas de narradores reales como ejemplo.
- Nada pago sin avisarle el costo a Naza (lo dispara él).
- No hacer checkout en la carpeta principal ni pushear a `main`.
