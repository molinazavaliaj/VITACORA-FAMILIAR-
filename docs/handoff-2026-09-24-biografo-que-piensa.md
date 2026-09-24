# Pase de manos — el biógrafo que piensa, plan completo (24/09/2026)

> Sigue a `docs/handoff-2026-09-23-biografo-v2.md`. Ese pase de manos era del arranque; este es
> el cierre de las 14 tareas del plan `docs/superpowers/plans/2026-09-23-biografo-que-piensa.md`
> (ledger completo en `.superpowers/sdd/2026-09-23-biografo-que-piensa/progress.md`). Todo en la
> rama `biografo-v2-fabrica`, worktree `C:\Users\Naza\Desktop\VITACORA FAMILIAR-biografo`.
> **No conectado todavía**: es un cerebro nuevo que Naza prueba a mano, en paralelo, sin tocar
> producción.

## Qué quedó hecho, tarea por tarea

| Tarea | Qué | Commits |
|---|---|---|
| 1 | El perfil nace de la ficha de la compra; aprende `cubiertos`, `puertaAbierta`, `hoyFueFuerte` | `4a1f422..9f22a55` |
| 2 | Las variables salen de la vida (una cada 6 años + bisagras), piso 8 / techo 19 / tope 40 | `9f22a55..7bfb4c1` |
| 3 | El núcleo de 21 temas, la presentación, la historia grande en variables, el objeto como tema | `7bfb4c1..8c53c8d` |
| 4 | La secuencia viva: el biógrafo elige la próxima, un tema cubierto se cae, objetos por cambio de tramo | `8c53c8d..aaca356` |
| 5 | El encargo reescrito: su castellano, tacto después de algo fuerte, "puente" en vez de "enganche" | `aaca356..d0d5944` |
| 6 | Controles de lugar/época y de supuestos sobre la salida, tres intentos y la marca | `d0d5944..7f3ba79` |
| 7 | La evaluación valida lo que devuelve, entiende "hoy no" / "no quiero seguir", sabe del cansancio | `7f3ba79..3e1f841` |
| 8 | La puerta manual v2 (`empezar`/`cargar`/`siguiente`/`estado`) — Naza se entrevista con el cerebro nuevo | `3e1f841..bf80192` |
| 9 | Las etapas se arman con edades por respuesta y la línea de tiempo del perfil | `bf80192..b593444` |
| 10 | El lector final: Opus lee el libro entero contra los audios y avisa lo que ningún control ve | `b593444..ad221ce` |
| 11 | La revisión: con avisos el libro espera y los dueños reciben el detalle por mail | `ad221ce..4bb5b21` |
| 12 | El orquestador del libro v2 de punta a punta (etapas → reparto → capítulos → páginas → control → lector); script delgado | `4bb5b21..a8aa61a` |
| 13 | La prueba integral queda con C1, C4 y una reserva inventada; las preguntas en vivo las mide el piloto de Naza | `a8aa61a..6d75c89` |
| 14 | Esta tarea: migración de `revision` (sin aplicar), CONTRATO, este handoff, el comentario que mentía en `etapas.ts` | (este commit) |

Cada tarea pasó por revisión con al menos una ronda de arreglos donde hizo falta (ver el ledger
completo para los detalles y los "minor" que quedaron deferred a propósito).

## Cómo corre Naza su piloto — los cuatro comandos

Desde `C:\Users\Naza\Desktop\VITACORA FAMILIAR-biografo\entrevistador` (el worktree, **nunca** la
carpeta principal), con `.env` cargado (`SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`,
`ANTHROPIC_API_KEY`, `OPENAI_API_KEY`):

```
npm run manual-v2 -- empezar naza
npm run manual-v2 -- siguiente naza
npm run manual-v2 -- cargar naza "C:/ruta/al/audio.ogg"
npm run manual-v2 -- estado naza
```

Variantes que vas a necesitar en el camino (todas documentadas en `task-8-report.md`):
- `cargar naza --orden 0 "audio.ogg"` — tu respuesta a la presentación, si llega después de la casa.
- `cargar naza --texto "lo que escribí"` — si contestás escribiendo en vez de grabar.
- `cargar naza "audio.ogg" --repregunta` — la respuesta a la repregunta (el archivo va **antes** del flag).
- `cargar naza a.ogg b.ogg …` — varias notas de voz para la misma respuesta.
- `cargar naza "audio.ogg" --orden 101` — la foto/respuesta de un objeto (la orden exacta la imprime `siguiente`).
- `cargar naza --reprocesar --orden N [--repregunta]` — si una carga se corta a mitad.
- `siguiente naza --saltar` — fuerza si algo frena y sabés que está bien avanzar igual.
- `siguiente naza --reanudar` — saca la pausa de "no quiero seguir".

Requisitos antes de arrancar: fila en `familias` con `nazamateos@gmail.com` (o `--familia`), que
no exista ya un narrador `+manual-naza`, y crédito en las keys de Anthropic y OpenAI.

**El libro**, después de tener respuestas cargadas (desde `fabrica`, cada corrida paga entre
~USD 3 y ~USD 6 según el largo — avisar antes de correr):

```
npx tsx --env-file=.env scripts/prueba-reparto.ts <id-de-naza> --salida prueba-libro-naza
```

(el id sale de `cd ../entrevistador && npm run manual -- estado naza`; detalle completo en
`task-12-report.md`).

**La prueba integral** (compara evaluación v1 vs v2 sobre a Ciro; no toca a Naza):

```
cd entrevistador
npx tsx scripts/prueba-integral.ts
```

(`--salida <carpeta>` y `--reusar-perfil` disponibles; detalle en `task-13-report.md`.)

## Qué aprueba Naza antes de correr nada

`docs/biografo-v2-textos-para-aprobar.md` — **ya existe** (lo generó la revisión del 24/09 desde el
código): los 22 temas de `NUCLEO`, el encargo de la entrevista (ficha vacía y una mujer de 76 con
vos), los prompts de la pregunta, la evaluación y la ficha, los textos fijos (hoy no, no quiero
seguir, la despedida, el mail cuando pide parar), y del lado del libro el encargo, el capítulo, las
etapas, el reparto, las páginas, el anticipo, el lector y el mail de revisión. Se aprueba ANTES del
piloto: lo que cambie se cambia en el código con su test.

## Costo

**~USD 10 en total** para correr todo el piloto de punta a punta (diseño §4.3): la entrevista de
Naza con la puerta manual v2 (perfil + pregunta + evaluación por cada respuesta, más objetos), el
armado del libro (~USD 3-6, según el largo) y la prueba integral (~USD 0,70). No se corre nada de
esto solo: se ordena y se prueba todo junto, avisando el costo antes (ver "Probar todo junto" en
la memoria del proyecto).

## Decisiones que tomó el controlador del plan — para que Naza las conozca

- **`tramoDe` sin dato: `'adulto joven'` por defecto** (Task 4, plan-mandated). Si el perfil
  todavía no ubica un tema "donde lo vivió" en ningún tramo, cae ahí (diseño §2.3). El perfil no
  trae ese dato hoy; queda para una tarea futura.
- **El objeto final** (Task 4/12): se marca con `final: true` en vez de compararse contra
  `ultimoTramo`, porque si no el objeto de "hoy" se lo comía (revisión de ronda 1).
- **El narrador v2 nace en `estado: 'pausado'`** (Task 8, decisión explícita, documentada también
  en el CONTRATO): el scheduler de producción solo toma `acepto`/`activo`; en `pausado` nunca lo
  toca, así que no hay riesgo de que sobrescriba `contexto.v2` con un snapshot viejo mientras Naza
  prueba. Efecto secundario: **el panel de la empresa va a mostrar al narrador v2 como "pausado"**
  aunque esté activo en el piloto — es esperado, no un bug.
- **Los epochs de la fábrica van por el tramo que declara el NUCLEO** (Task 12, arreglo de ronda
  1), no por `hecha.tramo` (que la secuencia rellena con `'adulto joven'` por defecto): con
  `hecha.tramo` los temas que cruzan la vida (amor, con quién hizo su vida, oficio, por gusto,
  amigos, un lugar) quedaban anclados siempre a 23-35 años; ahora, sin `objetivo.tramo`, quedan
  sin época y los ubica el modelo al repartir.
- **Control "la ciudad no está en ninguna etapa" (§2.7), parked** (Task 6): sin una lista de
  ciudades no se puede detectar de forma confiable. Queda pendiente de una decisión de Naza:
  sacarlo del diseño, o conseguir una fuente de datos de geografía.

## Avisos del piloto (para no sorprenderse)

- **El worker de la fábrica (anticipo)** dispara para narradores `activo`/`pausado` con ≥3
  respuestas: una llamada paga + un mail a la familia. Resuelto en la revisión (24/09): `empezar`
  deja puesto el candado `{narrador}/paquete/anticipo_enviado.txt` desde el día 0, así la fábrica
  de producción no le manda el anticipo v1 al narrador de prueba. Si Storage falla al ponerlo, el
  comando lo avisa y sigue.
- El panel de la empresa muestra al narrador v2 como "pausado" (ver arriba): no es un narrador
  colgado, es el mismo truco a propósito.
- Las fotos de objetos se suben desde el panel de la web (tabla `fotos`); no hay comando CLI en
  la puerta manual v2 para cargarlas.
- El scheduler de producción, si corre contra la misma base mientras Naza usa la puerta manual
  entre las 10:00 y las 10:15 de la zona del narrador, puede intentar mandarle la pregunta v1 de
  plantilla (falla por el teléfono falso, pero antes gasta ~USD 0,03 y puede pisar `contexto.v2`
  si coincide con un `cargar`/`siguiente` en el mismo instante). Mejor evitar la ventana, o correr
  el piloto con el scheduler apagado.

## Revisión de la rama (segunda pasada, 24/09)

Hecha en otro chat, con ojos de revisor, sobre los 20 commits (`4a1f422..05129f7`). Tests al
revisar: entrevistador 550 → **552** (39 archivos), fábrica **537** (49), tipos limpios en las dos
piezas y en los scripts. Tres arreglos, con test:

| Qué | Dónde | Por qué importaba |
|---|---|---|
| Terminar ya no pone `completado` en la base: queda `pausado` y `contexto.v2.terminada` | `manual-v2.ts`, `estado-v2.ts` | `fabrica/src/worker.ts:37` arma la estructura v1 (llamada paga con el guion viejo) y manda el mail "terminó" a la familia apenas ve un `completado` |
| La conversación que ve el modelo va por `recibido_at`, no por número de pregunta | `estado-v2.ts` (`conversacionDe`) | los objetos van en 101+: ordenados por número, después de tres objetos "lo último que hablaron" eran siempre las fotos y nunca la pregunta de ayer |
| Una etapa a medio llenar de la ficha (el oficio) no ensucia el prompt | `encargo-entrevista.ts` (`etapaEnTexto`) | el prompt decía "- : ; con no se sabe; costurera" |

Y `docs/biografo-v2-textos-para-aprobar.md` ya existe (14 secciones: temas, encargos, los seis
prompts, los textos fijos, los dos mails), generado desde el código.

**Lo que queda anotado, sin tocar (decide Naza):**
- ~~El anticipo de producción se va a disparar~~ **Resuelto**: `empezar` deja el candado
  `anticipo_enviado.txt` en el paquete del narrador de prueba (es el candado que mira
  `worker.ts:173`); no hizo falta tocar el worker.
- **El control "la ciudad no está en ninguna etapa"** (§2.7) quedó afuera: sin lista de ciudades no
  se detecta. Hoy se controla solo la ciudad equivocada entre las que el perfil conoce.
- **`tramoDe` da `adulto joven` por defecto** a los temas que cruzan la vida (amor, oficio, amigos…):
  para el reparto de objetos y el `ultimoTramo`. Un amor a los 50 cuenta como "adulto joven" hasta
  que el perfil lo ubique (tarea futura). La fábrica ya no usa ese default (`epocaV2` mira el tramo
  que declara el tema).
- Menores del ledger del plan (`.superpowers/sdd/…/progress.md`): la clasificación del rechazo por
  el texto del motivo es frágil; el lector recibe el libro entero más todas las transcripciones en
  un solo prompt (en libros largos puede pasarse); `edadV2` y `RANGO_TRAMO` están copiados del
  entrevistador a la fábrica (mantener a mano).

## Qué NO hacer

- **No conectar** el biógrafo v2 al flujo real de WhatsApp: sigue siendo la puerta manual v2,
  sola, hasta que Naza lo decida.
- **No aplicar la migración `20260924000000_pedidos_revision.sql`** sin acordarlo con Joaquín
  primero (toca `pedidos_estado_check`, que también usa la fábrica).
- **No correr nada contra el modelo real** (la puerta manual v2, el armado del libro, la prueba
  integral) sin el OK explícito de Naza — son todas llamadas pagas.
- **No hacer checkout en la carpeta principal** (`C:\Users\Naza\Desktop\VITACORA FAMILIAR`): la
  comparten varios chats; el trabajo vive en el worktree `VITACORA FAMILIAR-biografo`.
- **No pushear a `main`**. La rama de trabajo es `biografo-v2-fabrica`; se pushea a `origin` esa
  rama cuando corresponda, nunca se mergea sola a `main`.
