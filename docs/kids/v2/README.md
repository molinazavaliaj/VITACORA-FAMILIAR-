# Vitácora Kids V2 · «Mi Primer Capítulo»

Carpeta del rediseño de Kids (30/09 al 05/10/2026), hecho con el método del banco de V3. Rama `vitacora-kids`, worktree `VITACORA KIDS`. **Main no se tocó.**

## Empezar por acá
| Archivo | Qué es |
|---|---|
| [`flujo-vigente.md`](flujo-vigente.md) | El proceso de punta a punta (compra, arranque, un día típico, capítulos, la seria, el padre, la cápsula, el final). |
| [`banco.md`](banco.md) | **Fuente de verdad** de las 47 preguntas, otras puertas, fotos, extras, entradas, cierres y mensajes del banco. El código se genera desde acá. |
| [`mensajes.md`](mensajes.md) | **Fuente de verdad** de los demás mensajes fijos (bienvenidas, acuses, recordatorios, final, compra, panel). También se genera código desde acá. |
| [`paso-4-huecos-decisiones.md`](paso-4-huecos-decisiones.md) | Lo que decidió Naza el 05/10 y los defaults técnicos (pisan a lo anterior). |
| [`plantillas-meta-kids.md`](plantillas-meta-kids.md) | Las 13 plantillas para cargar en Meta (1 a 10, con 5b, 6b y 10b). |
| [`lectura-corrida.md`](lectura-corrida.md) | Una chica inventada, mensaje por mensaje: 376 globos del 6/10 al 5/11 (se genera, no editar a mano). |
| [`simulaciones/resumen.md`](simulaciones/resumen.md) | 800 chicos inventados (9 conductas) contra 23 controles: 800 terminan, cero violaciones, mediana 30 días, máximo 152 (se genera). También se corrieron las semillas 1 a 2000: cero violaciones. |
| [`banco-descartadas.md`](banco-descartadas.md) | Lo que salió y por qué. |

## Cómo se llegó
`paso-1-*` (método) → `paso-2-*` (el banco, capítulo por capítulo, con Fable) → `paso-3-*` (mensajes fijos) → `paso-4-*` (revisión de Fable leída como el chico y huecos decididos) → el motor (plan en `docs/superpowers/plans/2026-10-05-kids-v2-motor.md`, con las decisiones que el diseño no definía).

## Código
`fabrica/src/kids-v2/` (puro: sin I/O, sin red, sin modelos de IA; los textos salen de `banco.json`):
- `banco-md.ts` → `banco.json` (generado) → `banco.ts`: el banco tipado. Si falta un ID que el motor usa, el parseo falla.
- `texto.ts` (género, variables, plural), `horas.ts` (nada entre las 22 y las 9), `reglas.ts` (los números del flujo), `acuses.ts` (rotación).
- `compra.ts` (la ficha y el guion efectivo: temas sacados, fotos que se mudan, preguntas del padre), `extras.ts`.
- `motor.ts`: `paso(estado, evento, ahora) → { estado, salidas }`, partido en `motor/` (`flujo`, `rafaga`, `botones`, `reloj`, `sobrio`, `mensajes`, `estado`, `tipos`). `preocupante.ts`: la lista de palabras (borrador para Naza).
- `corrida.ts`, `lectura.ts`, `conductas.ts`, `controles.ts`, `simulacion.ts`: la lectura corrida y la simulación.

Tests en `fabrica/test/kids-v2-*.test.ts`: 283 en 15 archivos, todos en verde (incluye una simulación de 240 chicos).

```bash
cd fabrica
npx tsx scripts/kids-v2-json.ts       # regenera src/kids-v2/banco.json desde banco.md y mensajes.md
npx vitest run test/kids-v2           # tests
npx tsc --noEmit -p .                 # tipos
npx tsx scripts/kids-v2-lectura.ts    # regenera docs/kids/v2/lectura-corrida.md
npx tsx scripts/kids-v2-simular.ts    # 800 chicos + docs/kids/v2/simulaciones/resumen.md
npx tsx scripts/kids-v2-simular.ts 20 # una tanda chica (no escribe nada)
npx tsx scripts/kids-v2-simular.ts --semilla 7   # un chico, mensaje por mensaje
```

## Cómo se conecta (para Joaquín)
- Por chico se guarda el `Estado` (JSON). Se arranca con `nuevoEstado(ficha)` y el evento `inicio` cuando paga.
- Cada cosa que llega del número de las preguntas es un evento: `respuesta` (audio con sus segundos y la transcripción; texto; foto) o `boton` (el texto del botón, tal cual). `paso()` devuelve el estado nuevo y las salidas.
- **Solo el número de las preguntas.** En canal A, solo lo que manda el número del chico entra como `respuesta` o `boton` (el evento no dice quién lo mandó). Lo que escriba el padre a su número **no** se pasa: se acusaría como si fuera del chico y cortaría los recordatorios. En canal B, el número de las preguntas es el del padre.
- **Botones viejos (decisión 22).** Cada `mensaje` que sale trae `envio`, un ID único por chico ("1", "2", "3"…). Al mandarlo, guardar `envio` ↔ el ID que devuelve WhatsApp (wamid). Cuando tocan un botón, WhatsApp manda el `context.id` del mensaje tocado: pasarlo traducido como `aMensaje` en el evento `{ tipo: 'boton', boton, aMensaje }`. Así, un botón de un mensaje que ya quedó atrás (el [Paso] de la pregunta de ayer, el mismo botón tocado dos veces, un [Estamos listos] viejo) no hace nada. Siguen valiendo los botones de lo que se espera ahora, aunque haya llegado un recordatorio o un reenvío después. Sin `aMensaje`, el botón actúa sobre lo que se espera ahora (como antes).
- **Un "no" escrito en una foto** (o un audio corto, sin foto) vale como tocar [No tengo] solo si dice no, nada, ninguno/a, tampoco o nunca: sale su respuesta (B-FOTO-NOTENGO, o B-FOTO-PLATA en K29) y espera el audio, sin acuse. En la foto de K24 vale como [Hoy no la como] (espera el audio, sin decir nada). Algo corto que no dice que no ("ya te la mando", "ahí va"): sin acuse, sigue esperando la foto. Para los audios hace falta la transcripción. A la otra puerta contestada corta tampoco le va acuse.
- **Preguntas del padre**: cada una puede llevar `quien` (cómo le dice el chico a quien la escribió: "tu mamá"). El panel pregunta "¿Quién se la manda?" con quién se lo regala de entrada; sin `quien`, la línea dice quién se lo regala.
- **La foto que se mudó** (por ejemplo, la de K10 en K16 si se sacó "mamá") sale en el día con el ID de la original (`K10-FOTO`); si vence y vuelve al final, sale con el ID del item (`K16-FOTO`), que es también la clave en `fotosVencidas` y en `e.extra`.
- Salidas: `mensaje` (a `chico` o `padre`; si trae `plantilla`, va como plantilla de Meta con esas variables; si no, texto libre, que el motor solo manda dentro de la ventana de 24 h de ese número (la simulación lo controla); los botones son respuestas rápidas) y `marca` (al panel de Naza: `preocupante`, `silencio-8-dias`, `escribio-despues-del-final`, `cerro-sin-respuesta`).
- El tiempo: llamar `paso(estado, { tipo: 'reloj' }, ahora)` en `proximoDespertar(estado, ahora)` (o cada minuto). Sin eso, no se acusa la ráfaga (90 s), no sale la pregunta del día ni los recordatorios.
- Cambios del panel: evento `ficha` (hora, temas, preguntas del padre). **Tira error si los datos no son válidos**, y el panel tiene que mandar la lista completa de `temasSacados`.
- **Audios y "algo preocupante"**: la transcripción tiene que ir en el evento de contenido; sin ella la lista de palabras no ve los audios.

## Cosas del motor que decidimos al implementar
- **Plantillas del final**: `kids_final` y `kids_final_plural` (10 y 10b de `plantillas-meta-kids.md`).
- **Fotos vencidas**: las fotos pegadas que vencieron vuelven primero entre los extras del final (`Estado.fotosVencidas`).
- **Cierre en extras con PREG-NUEVA sin contestar**: a los 2 días sale TERMINO-PADRE y una marca `cerro-sin-respuesta` a Naza; FINAL-CHICO se suelta cuando el chico vuelve. En canal B, TERMINO-PADRE va al día siguiente de que el final le llegó; si el final sigue retenido 2 días después del cierre (el padre nunca tocó el botón), sale igual, a la hora, una vez.
- **La espera del audio después de [No tengo]** (10 minutos) no vence con algo contado sin acusar (primero el acuse) ni con la ventana de 24 h cerrada (lo retoma la hora con PREG-NUEVA o, en las extras, el cierre a los 2 días). Si en el día de algo preocupante cambian la hora en el panel, el día sobrio termina a la hora nueva.
- **Lo que espera vence a la hora del día siguiente al que salió.** Una principal soltada a las 9:00 cuenta para ese día. Un chico que contesta de noche avanza un paso por día; la corrida simulada más larga tardó 152 días.

## Qué falta (no está hecho)
1. **Conectarlo al entrevistador de WhatsApp** (Joaquín): guardar el estado, mandar las salidas, el reloj, la transcripción de los audios y el payload de los botones.
2. **La compra** (`/comprar/kids`): las tres pantallas de `mensajes.md` §8 (COMPRA-1 a COMPRA-3), con la hora entre 09:00 y 21:59 y la zona del país del número.
3. **El panel**: ver todo (también la cápsula), corregir nombres, escribir hasta 3 preguntas con la casilla "sin decir que es mía" y "¿Quién se la manda?" (de entrada, quién se lo regala) hasta que empieza la cuarta parte, cambiar la hora y los temas; en el de Naza, las marcas.
4. **Meta**: cargar las 13 plantillas de `plantillas-meta-kids.md`.
5. **El libro**: el escritor arma los capítulos desde los audios (las preguntas del padre al final del cap. 4), la cápsula en un sobre pegado al impreso y en un PDF aparte, la revisión de algo preocupante antes de armar, y Naza mira el álbum (fotos con otros chicos) antes de imprimir.
6. `pendientes.md`: sacar "tres semanas" de la landing.

## Para Naza
Resueltos el 05/10 (lo que pidió Naza; detalle en `docs/superpowers/plans/2026-10-05-kids-v2-arreglos-report.md`):
1. **Lista de palabras de "algo preocupante"** (`preocupante.ts`): sigue siendo un borrador para vos y el abogado (`paso-3-algo-preocupante.md`). Los falsos avisos conocidos ya no saltan: una lista de exclusiones al lado ("me corto el pelo", "las uñas", "el flequillo", "matar de la risa", "me muero de risa", "abuso de confianza"); "me corto" solo y "me quiero matar" siguen saltando.
2. **K18**: si se sacó "papá", dice "como la pareja de tu mamá, o alguien…"; si se sacó "mamá", "como la pareja de tu papá, o alguien…"; si los dos, "como alguien que vino a vivir con ustedes". Solo se borran palabras del texto aprobado. Ninguna otra pregunta nombra a mamá o papá sin que su tema la saque.
3. **La línea de la pregunta del padre** dice quién la manda: el panel pregunta "¿Quién se la manda?" (de entrada, quién se lo regala).
4. **Las decisiones que tomó el plan** sin que el diseño las definiera siguen para que las mires (`docs/superpowers/plans/2026-10-05-kids-v2-motor.md`).
5. **Un "no" en la foto de K24** vale como [Hoy no la como]: sin acuse, espera el audio.
6. **Un "no" corto en una foto** vale como [No tengo] solo si dice que no (no, nada, ninguno/a, tampoco, nunca); "ya te la mando" o "ahí va" esperan la foto, sin acuse.
7. **Canal "lo hago yo"**: si el final quedó retenido y el padre nunca toca el botón, TERMINO-PADRE le llega igual a los 2 días del cierre, a la hora.
