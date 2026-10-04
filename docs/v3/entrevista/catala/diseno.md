# La entrevista V3 en catalán — diseño (04/10/2026, para el OK de Naza)

Rama `v3-catala` (worktree `VITACORA FAMILIAR-catala`, sale de `v3` en `feeda45`).
**Alcance:** solo la entrevista (preguntas, mensajes, botones, segunda oportunidad,
cazador y transcripción). El libro en catalán, no. `entrevistador/` no se toca.

## La idea en una línea
Un **paquete de idioma** por cada forma de hablar: `es-AR` (el de hoy, vos), `ca`
(catalán, ahora) y `es-ES` (tú de España, después, con el mismo molde). El código pide
"dame el paquete de este narrador" y de ahí saca textos, frases del detector,
transcripción y cazador. Nada de `if (catalan)` desparramado.

## 1. La ficha
- Campo nuevo **`idioma`**: `'es-AR' | 'es-ES' | 'ca'`, opcional; **vacío = `es-AR`** (todo
  lo que existe hoy sigue igual, sin migrar nada).
- Va en `FichaEntrevista` (`fabrica/src/v3/entrevista/texto.ts`), no en `FichaV3`: es
  de la entrevista; el libro no lo mira (por ahora).
- En la base: clave `contexto.idioma` del jsonb `narradores.contexto` (sin migración).
  Se anota en `supabase/CONTRATO.md`. **No** se mezcla con `contexto.trato`
  (usted/vos del entrevistador viejo).
- Lo elige quien regala en la compra (web, Joaquín): "¿En qué idioma hacemos la
  entrevista? Castellano / Català". `es-ES` no se ofrece hasta que tenga sus textos.

## 2. Los textos
- **`banco.md` no se toca**: sigue siendo la fuente de la estructura (IDs, orden,
  "depende de", botones y lo que vale cada uno, sensibles) y de los textos `es-AR`.
- **Archivo nuevo `docs/v3/entrevista/banco-ca.md`**: solo `ID | texto en catalán`
  (preguntas, mensajes fijos, entradas, cierres, botones, segunda oportunidad M33 y el
  mensaje fijo de la repregunta). Nada de estructura: no se puede desincronizar.
- Se genera `banco-ca.json` con el mismo script (`npx tsx scripts/v3-entrevista-json.ts`
  arma los dos).
- **Tests que lo atan** (fallan si alguien cambia `banco.md` y se olvida del catalán):
  1. cada ID de `banco.md` tiene su texto en catalán, y no sobra ninguno;
  2. las mismas marcas: `{{nombre}}`, `{{o/a}}`, `«sino:X: … ‖ …»`, `<br>`;
  3. los botones: misma cantidad, hasta 20 letras (WhatsApp);
  4. cada texto aprobado fijado **letra por letra**.
- El código: `bancoDe(idioma)` devuelve las mismas preguntas con los textos del idioma;
  `flujo.ts`, `seleccion.ts` y `mensajes.ts` reciben el banco/paquete en vez de usar el
  global (el default sigue siendo `es-AR`, así ningún test de hoy cambia).
- Lo que hoy está escrito en el código y depende del idioma pasa al paquete:
  el mensaje fijo de la repregunta y [Ya lo conté todo] (`cazador.ts`, `flujo.ts`),
  "arranca con Seguimos/Pasamos" (`mensajes.ts`: en catalán "Seguim/Passem/Continuem")
  y sacar el nombre de la entrada (", {{nombre}}, y …" → en catalán ", {{nombre}}, i …").
- `renderizar` no cambia: `{{noi/noia}}`, `{{pare/mare}}` ya funcionan con cualquier par.

## 3. Transcripción
- `language: 'ca'` y un prompt de vocabulario en catalán (sale del paquete), con el
  nombre del narrador. Quien eligió catalán contesta en catalán (Naza, 04/10).

## 4. Detector de respuestas (`respuesta.ts`)
- Las listas de frases ("no me acuerdo", "paso", "ya te lo conté", "está todo", AMH,
  HI0…) pasan al paquete. Las reglas (topes de palabras, "pero/aunque", signos) **no
  cambian**: son las mismas para todos los idiomas.
- **En catalán, el detector entiende catalán Y castellano** (quien habla catalán mezcla).
- Ejemplos de lo que entra (lista completa en el plan, la revisa alguien nativo):

| Qué | Catalán |
|---|---|
| "Paso" | passo, la següent, una altra, aquesta no, d'això no, prefereixo no parlar-ne, m'ho guardo, deixem-ho aquí |
| Olvido | no me'n recordo, no ho recordo, no me'n enrecordo, no ho sé, ni idea, no en tinc ni idea, se m'ha esborrat, la memòria em falla |
| "Ya te lo conté" | ja t'ho he explicat, ja t'ho vaig explicar, ja t'ho he dit, ja t'ho vaig dir |
| "No" corto | no, mai, cap, res, tampoc, gens (y "pero/aunque" → "però/encara que") |
| Cierre | ja està, és tot, està tot, res més |
| AMH ("¿hoy estás en pareja?") | estic en parella, tinc parella, estic amb… / estic sol·a, ja no, va morir, ens vam separar, em vaig divorciar |
| HI0 (criados) | vaig criar, el vam criar, com un fill, com una filla |

- Detalle técnico importante: hoy el apóstrofo corta la frase ("me'n" = "me" | "n") y
  el punto volado parte "col·legi". En el paquete catalán el apóstrofo (' y ’) y el `·`
  quedan dentro de la palabra. Con test.

## 5. Cazador de escenas
- El prompt original (`prompt-v3-1.md`) **no se toca**. Se arma una copia entera en
  catalán, `cazador/prompt-v3-1-ca.md` (Naza, 04/10: todo en catalán, sin tocar lo
  original), con sus ejemplos inventados también en catalán.
- La cita sigue textual (el control de "cita contigua" no depende del idioma).
- Los controles de tiempo pasan al paquete: en catalán, sin "ahir / ahir a la nit / fa
  una estona / l'altre dia / aquesta setmana", y "avui" solo en el bloque Hoy.
- El mensaje fijo ("Me quedé pensando…") sale de `banco-ca.md`.
- Mismo modelo (Opus 5), mismo tope USD 3 por entrevista.

## 6. Cómo se prueba (sin que nadie cuente su vida)
- **Gratis:** tests de todo; una vida inventada en catalán (la escribe Opus) corrida
  por la simulación por turnos y la lectura corrida (`v3-entrevista-lectura.ts`, con
  `--idioma ca`); la página de prueba con `--idioma ca` para que la veas.
- **Sin pruebas pagas** (Naza, 04/10): el cazador en catalán lo prueba Opus dentro de
  la sesión (USD 0) con el prompt nuevo sobre la vida inventada, y los controles del
  código se prueban con tests. La transcripción en catalán se prueba de verdad con Ima,
  la primera narradora en catalán.

## 7. Orden de trabajo
1. OK de este diseño.
2. Opus traduce en la sesión (USD 0; Naza, 04/10: no Fable, gasta mucho contexto) → te muestro tablas cortas por tanda (arranque y mensajes;
   botones; bloques 1–5; 6–10; 11–15; cazador) → apruebas.
3. Código con test primero (paquete, banco-ca, detector, transcripción, cazador,
   `--idioma` en simulación y página).
4. Vida inventada + lectura corrida + página para que la veas.
5. El cazador en catalán probado por Opus en la sesión (USD 0).
6. Revisión de otro agente → arreglos → merge a `v3` (con tu OK) → mensaje a Joaquín.

## Fuera de alcance (anotado)
- El libro en catalán (otro chat; Ima lo va a necesitar: lo que conteste le llega al escritor en catalán).
- La ronda extra (75 preguntas que hoy no se ofrecen): se traduce cuando se active.
- M9 (aviso a quien regaló): va en el idioma de la entrevista; si quien regala no habla
  catalán, habría que pensarlo aparte.
- El dashboard (DD1/DD2): los textos se traducen igual, pero mostrarlos es de la web.
