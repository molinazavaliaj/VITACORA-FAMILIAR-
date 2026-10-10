# Pase de manos V3 — 01/10/2026 (la entrevista probada y el primer libro con el flujo nuevo)

Sigue a [`handoff-2026-09-30-simulaciones.md`](handoff-2026-09-30-simulaciones.md). Rama `v3`, worktree `C:\Users\Naza\Desktop\VITACORA FAMILIAR-v3`, todo pusheado a `origin v3` (1266 tests verdes).

## Qué pasó desde el pase anterior
1. **Naza hizo la entrevista V3 entera** como narrador, con su vida real, en una página local que hace de WhatsApp (`fabrica/scripts/v3-entrevista-web.ts`; guía en [`entrevista/prueba-web.md`](entrevista/prueba-web.md)). 95 respuestas, ~80 min de audio, ~USD 0,50 de transcripción. Sus marcas y las de Fable se aplicaron (registro en [`entrevista/simulaciones/hallazgos.md`](entrevista/simulaciones/hallazgos.md), secciones "Prueba de Naza" y siguientes; textos en `simulaciones/textos-prueba-naza.md` y `textos-fable-extras.md`): cierres "Hasta acá lo de…", bienvenida, botón [Prefiero no contarla], bloque del amor nuevo (AMH "¿Hoy estás en pareja?", el detalle va a la pareja de hoy o la última, AM21 para las de antes), 13 preguntas de la extra al núcleo, HO11 (marcas en el cuerpo), música y hermanos de grandes al núcleo. Vida completa: 103 preguntas.
2. **Se escribió su libro V3** con la receta v6 (`docs/v3/prompts-escritor-v3.md`), USD 0 (agentes en la sesión), dos versiones: sin dudas y con las 32 dudas contestadas por él en el chat. Script genérico nuevo: `fabrica/scripts/v3-entrevista-a-material.ts` (entrevista V3 → material del escritor). **El libro, la charla y los audios son su vida real: están en `audios-crudos/v3-web/nazareno/` (fuera de git). No copiarlos a docs ni a commits.**
3. **Veredicto de Fable** (notas: libro que le gustó a Naza, el de la entrevista vieja con repreguntas, 7,5 · V5 7 · V3 sin dudas 6 · V3 con dudas 6,5). De la distancia que queda: ~50 % faltan escenas (la entrevista no repregunta), ~35 % la receta del escritor, ~15 % datos confirmados que el escritor no usó.
4. **Error grave encontrado por Naza:** el prólogo pasó a presente algo que ya había terminado (un proyecto que fracasó), y abría nombrando cuatro personas y datos de ficha en tres oraciones. Una revisión de hechos de todo el libro (contra el material) encontró solo ese grave. Naza: **"no me sirve reescribir el mismo libro 30 veces, necesito que aprenda a escribir biografías interesantes"**.

## Decisión de Naza (01/10): dos chats nuevos, en paralelo
### Chat A — El escritor de cero (no parchar)
- Primero: **qué es una biografía interesante** — Fable arma una guía con criterios concretos (cómo se abre un libro, cómo se arma un capítulo, escena vs. resumen, cuándo nombrar a alguien, cómo cerrar, qué nunca hacer). Naza la aprueba.
- Con esa guía, **la receta se reescribe de punta a punta** (no parches sobre la v6). Problemas de la v6 que no pueden repetirse:
  - **Prólogo:** sale de "una escena del presente" elegida casi al azar → abrió con nombres, lugares y datos de ficha; pasó a presente algo terminado.
  - **Último capítulo = bolsa** de lo que sobra (listas de nombres, reflexiones apiladas).
  - **Títulos y puentes con molde** ("Fue una gran etapa de mi vida").
  - **El retoque arregla nombres y orden, no forma**; marcó como "falsa alarma" repeticiones reales.
  - **Datos confirmados por el narrador que el escritor no usó** (una persona contada como tres; un lugar de nacimiento).
  - **Falta un control obligatorio de hechos** antes de entregar: todo lo que el libro dice de "hoy" contra el material (tiempo verbal, estado actual). La revisión que lo encontró está como modelo en la carpeta del libro (`revision-hechos.md`).
- **Probar con material que ya existe, sin pedirle a nadie que cuente de nuevo:** Naza (V3, en audios-crudos), Joaquín (`fabrica/prueba-v3-joaquin/`, con su permiso), la entrevista vieja de Naza (`fabrica/prueba-v3-naza/`). Juicio a ciegas contra el libro que le gustó (`fabrica/prueba-v3-naza/libro-anterior/`). **Si una versión pierde, se corrige la receta, nunca el libro a mano.** Lectura de Fable sobre los tres libros: `audios-crudos/v3-web/nazareno/libro-v3/lectura-fable-libros.md`.
### Chat B — La entrevista trae escenas
- **Cazador** (repregunta por una escena concreta cuando la respuesta fue un resumen): Fable recomienda **uno por bloque** (~10 por entrevista), citando la frase del narrador y pidiendo ese día. Diseño, texto y costo medido **antes** de programar; lo aprueba Naza. Dónde rinde más: ver la sección "Versión con dudas (01/10)" de la lectura de Fable (IDs de las respuestas que eran resumen con escena adentro).
- **Salida "si no te vuelve el día, contame cómo era en general"** (en las 8 preguntas de un momento concreto): hizo que Naza resumiera; propuesta: mostrarla solo después de un "no me acuerdo", no siempre.
- **Pedir nombres:** la regla vieja "sin nombres" era un malentendido (era que la pregunta no nombre a la persona, no que no se le pida el nombre). Fable redactó 11 agregados (OR2, CA2, CA3, CA6, ES2, ES5, AD6, AM1, HI8, AS1, TR3); **falta el OK de Naza**. La propuesta está en [`entrevista/simulaciones/propuesta-nombres.md`](entrevista/simulaciones/propuesta-nombres.md).

## Qué NO hacer
- No reescribir libros a mano: se corrige la receta.
- No copiar la vida de Naza (ni la de Joaquín) a docs, commits o prompts de ejemplo.
- Naza **no hace más pruebas** contando su vida: trabajar con el material que hay.
- No checkout en la carpeta principal ni push a `main`; no tocar `entrevistador/` (Joaquín; Naza le habla él).
- Nada pago sin avisar el costo.
