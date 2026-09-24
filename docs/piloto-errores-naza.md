# Piloto del biógrafo v2 — errores y cosas raras (narrador: Naza)

> Naza se entrevista a sí mismo con la puerta manual v2 (`entrevistador/scripts/manual-v2.ts`).
> Regla: en el piloto se **anota**, la revisión va después. Solo se arregla en caliente lo que no
> deja seguir, y se anota igual.
>
> Narrador del piloto: `ea17b848-760a-416a-935c-51f186c7b0ef` (nombre "Naza", teléfono falso
> `+manual-naza-piloto`, estado `pausado` a propósito). Los comandos se corren con ese id.

## N1 · 24/09 · `empezar naza` choca con el narrador real de Naza
- **Qué pasó:** `npm run manual-v2 -- empezar naza` cortó con «Tricky ya tiene 1 respuestas del
  flujo viejo… Usá otro nombre (--nombre)». "naza" coincide con el narrador **real** de Naza
  (`dd3242de…`, nombre "Naza", le dicen "Tricky", `activo`, teléfono real) por el campo `nombre`.
  Si ese narrador no hubiera tenido respuestas, `empezar` lo tomaba y lo pasaba a `pausado`: se
  apropiaba de un narrador de producción.
- **Dónde:** `entrevistador/scripts/manual-v2.ts` — `buscarNarrador` (busca por id, después por
  `como_le_dicen`, después por `nombre`, sin mirar el teléfono `+manual-`) y `empezar` (reusa la
  fila que encuentre). Además el mensaje del error miente: `--nombre` no alcanza, porque la
  búsqueda va por la referencia (`naza`), no por el nombre.
- **Qué se hizo a mano:** `empezar naza-piloto --nombre "Naza"` → narrador nuevo `ea17b848…`. Todo
  el piloto se corre con el id, porque `naza` sigue siendo ambiguo (hoy resuelve al del piloto por
  `como_le_dicen`, pero depende del orden de búsqueda). El comando sigue imprimiendo
  `cargar naza …` como instrucción.
- **Para la revisión:** `empezar` (y `buscarNarrador` en general) solo debería reusar filas con
  teléfono `+manual-…`.

## N2 · 24/09 · La presentación dice «la/lo trate»
- **Qué pasó:** sin ficha, la presentación pregunta «¿prefiere que la/lo trate de usted o de
  vos?». Con una barra en el medio suena a formulario, no a una persona.
- **Dónde:** el texto de la presentación (orden 0), `docs/biografo-v2-textos-para-aprobar.md`.
- **Qué se hizo a mano:** nada; se mandó así.
