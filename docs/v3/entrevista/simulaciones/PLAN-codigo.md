# Plan: pasar lo aprobado en las simulaciones al banco y al código

**Qué es:** el plan para aplicar lo que Naza aprobó el 30/09 después de las 6 simulaciones ([`hallazgos.md`](hallazgos.md), sección "Decisiones de Naza sobre las simulaciones") con los textos de [`textos-finales.md`](textos-finales.md). Naza dijo "dale con el código" el 30/09.

## Reglas de trabajo
- Solo en el worktree `C:\Users\Naza\Desktop\VITACORA FAMILIAR-v3` (rama `v3`). Push solo a `origin v3`. Nunca `main`, nunca checkout en la carpeta principal.
- No tocar `entrevistador/` (Joaquín). A Joaquín se le cuenta al final (Naza).
- **No pisar:** antes de cambiar `banco.md` y `flujo-vigente.md`, copiarlos tal cual a `docs/v3/entrevista/historial/banco-2026-09-30-antes-de-las-simulaciones.md` y `historial/flujo-2026-09-30-antes-de-las-simulaciones.md`. `lectura-corrida.md` no se regenera encima (queda como historia).
- Lo que se saca (HI2b) va a `banco-descartadas.md` con el motivo; no se borra sin rastro.
- Sin modelos ni API: todo es código puro. `cd fabrica; npx vitest run` y `npx tsc --noEmit -p .` verdes.
- Commits en castellano rioplatense con `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`.

## Los textos (fuente: `textos-finales.md`, con estos cambios aprobados después)
- **CA6:** "¿Tuviste hermanos? Si ya salieron en la charla no importa, quiero saber más: contame con cuál eras más cercan{{o/a}} de chic{{o/a}} y alguna aventura que hayan hecho juntos; seguro tienen varias."
- **JU8:** "¿Alguna vez te fuiste a vivir a otra ciudad o a otro país? Capaz ya me contaste algo de esa mudanza; ahora contame la llegada: el primer día, dónde dormiste esa noche, quién te esperaba y qué fue lo que más te costó."
- **HI0:** "Ahora vamos a los hijos. ¿Tuviste hijos, o criaste a alguno como si lo fuera? Presentámelos de a uno, incluso si alguno ya apareció en lo que me venís contando: cómo se llama cada uno y cuándo llegó. Y si no tuviste, seguimos por otro lado."
- **HI8:** "Ahora, los nietos. ¿Llegaron nietos a tu vida? Puede que ya los hayas mencionado; contame el día que conociste al primero, como si lo estuvieras viendo. Si no hay nietos, pasamos a otra cosa."
- **FIN:** sin "y es bien tuyo" ("…que va a quedar en tu familia para siempre. Antes de escribirlo…") y con la frase de la foto de `textos-finales.md`.
- **FO1:** el texto de `textos-finales.md` y un botón **[No tengo foto]** (vale como "no": M25 y sigue LE9).
- **AM20:** botón "Nadie en el medio".
- M28: solo **M28.1** en uso ("No pasa nada, {{nombre}}. Vamos con otra."); M28.2 y M28.3 van al banco marcados "reserva, sin uso".
- Todo lo demás, tal cual `textos-finales.md` (secciones 1 a 3).

## El banco (`docs/v3/entrevista/banco.md`)
1. Cambiar los textos de las preguntas y los mensajes (M3.3, M3.6, M3.7, M3.8) y sumar M27.1-3, M28.1-3, M29, M30, M31 en "Mensajes fijos", con su "Cuándo".
2. Dependencias y orden (reglas 19 a 25 de `textos-finales.md`): AM4 y AM5 `si:AM3`; AM13 `si:AM3` y se mueve después de AM6 y antes de AM8; AM20 nueva (núcleo, `si:AM16`, después de AM16); HI8 `si:HI0`; HI3, HS1 y HI6 `si:HI2`; HI2b afuera.
3. **Sección nueva `## Botones`** (antes de "Reglas del flujo"), una fila por botón: `| ID | Botón | Vale como |` con "Vale como" = `sí`, `no` o `paso`. Las 31 preguntas: CA6, JU8, AM0, AM3, AM9, AM16, AM20, HI0, HI8 (sí/no; AM9 además `paso`), CA17, AD15, JU17, TR11, PE1, PE5, PE4 ([Paso esta] = paso), CI1 a CI14 ([No, está todo] = no), FO1 ([No tengo foto] = no). Máximo 3 botones por pregunta y 20 letras por botón (el parser lo valida).
4. Actualizar "Notación" (el "no" corto: hasta 15 palabras; 40 en cierres, LE9, sensibles y las que abren tema), "Reglas del flujo" (todas las reglas de la sección 4 de `textos-finales.md`) y sumar al final "## Cambios del 30/09, después de las simulaciones (Naza)".
5. Regenerar `fabrica/src/v3/entrevista/banco.json` con `npx tsx scripts/v3-entrevista-json.ts` (el test de sincronía tiene que pasar).

## El código (`fabrica/src/v3/entrevista/`)
- **Parser** (`banco-md.ts`): lee `## Botones` y agrega `botones?: { texto: string; vale: 'si' | 'no' | 'paso' }[]` a cada `PreguntaEntrevista`.
- **Botones en la respuesta:** la respuesta sigue siendo un string. Un toque se guarda con una marca al principio: `respuestaDeBoton(texto)` → `"⟦botón:No tuve hijos⟧"`; si después manda audio, se suma atrás (`"⟦botón:Sí, tuve⟧ Mi hija mayor nació en…"`). `leerBoton(respuesta)` devuelve el botón y el resto. **Si hay botón, manda el botón** (regla 6).
- **Una sola función que interpreta** (`interpretar(pregunta, respuesta)` o nombre equivalente): devuelve `'no' | 'paso' | 'olvido' | 'ya-conto' | 'conto' | 'vacio'` con las reglas 10 a 18 (tope 15 o 40 según la pregunta; "pero/aunque" solo en las primeras 5 palabras y nunca en cierres; "paso" como primera palabra sin tope salvo "paso a/por/de/que"; "paso" como última palabra en hasta 12; la lista de frases de "paso" en hasta 12; olvido; "ya te lo conté"). En las que abren tema, un olvido cuenta como "sí".
- `esNoCorto`, `esPaso`, `respondioNo`, `contoAlgo`, `cumple` pasan a usar esa interpretación (con la pregunta, para saber el tope). Mantener las firmas que usan otros módulos o adaptar sus llamadas; que `renderizar` («sino:X») siga andando.
- **Acuses** (reglas 26 a 31): M26 antes de una sensible y después de PG1; M25 después de un "no" corto en todas; M21 (común) o M27 (sensible) después de un paso; M28.1 después de un olvido; M29 una sola vez al tercer olvido seguido (necesita las respuestas anteriores en orden: el Map conserva el orden de inserción); "ya te lo conté" → M25; M27.1 no va delante de algo que arranca con "Seguimos" o "Pasamos" (va M27.2). M27 y M28 van pegados como M25; M4 sigue solo.
- **Botón de "Sí":** función pura que diga qué hacer al tocar un botón: "sí" → mandar M30 solo y seguir esperando audio en la misma pregunta; "no" / "paso" → la respuesta queda cerrada y sigue el flujo.
- `siguientePregunta` devuelve también `botones` (los de la pregunta) y `ayudaBotones: true` solo en el primer mensaje con botones de la entrevista (va M31 debajo, en línea aparte, como M1). FO1 devuelve `esperaFoto: true` (sin reloj de minutos; el tope de 24 h y pegar la foto a FO1 lo hace el entrevistador).
- `armarTurno` suma M31 al mensaje de la pregunta cuando corresponde.
- Tests nuevos para cada regla (con respuestas reales de las simulaciones como casos: "No, nunca tuve hijos. No se me dio, qué sé yo. Tengo sobrinos…" → no; "Paso, mejor no. Ya lo conté, viste…" → paso; "De eso no. Hay cosas que prefiero guardarme." → paso; "No me acuerdo bien cuándo nació el primero" en HI8 → olvido = sí; "No, seguimos juntos… No fue fácil siempre, pero no nos separamos" en AM9 → no; "No, creo que está todo. La verdad es que…" (45 palabras) en un cierre → no). Los tests viejos que chocan con lo aprobado (HI2b, orden de AM13, "menos de 15", textos de M3) se actualizan diciendo en el test por qué.

## Los scripts
- `scripts/v3-entrevista-turno.ts` (simulación): mostrar los botones debajo del mensaje (`[botones: (Sí, tuve) (No tuve hijos)]`) y aceptar `responder <estado> --boton "<texto>"`; con "sí" manda M30 y sigue esperando la misma pregunta; el texto siguiente se suma a esa respuesta. El md de la charla muestra los botones y el toque.
- `scripts/v3-entrevista-lectura.ts` y `v3-entrevista-recorrido.ts`: que sigan andando con el flujo nuevo (el test que compara turno con lectura tiene que seguir verde).

## Docs
- `flujo-vigente.md` al día (secciones 4, 5, 6 y 9), con la versión anterior en `historial/`.
- `hallazgos.md`: cada S# aprobado pasa a **aplicado**.

## Después
1. Revisión por un segundo agente (bugs con archivo:línea y cómo reproducir).
2. Volver a correr los 6 narradores con el flujo nuevo (pueden tocar botones) y que Fable diga qué se arregló y qué no.
3. Recién ahí: el mensaje para Joaquín.
