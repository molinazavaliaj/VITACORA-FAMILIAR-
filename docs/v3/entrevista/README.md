# Entrevista V3

Carpeta del banco nuevo de la entrevista (30/09/2026).

## Qué hay acá

Regla de nombres: lo que dice **vigente** es lo actual y no cambia de nombre; cuando algo se reemplaza, la versión vieja va a `historial/` con la fecha y el motivo en el nombre.


- [`flujo-vigente.md`](flujo-vigente.md): **cómo funciona la entrevista, de punta a punta** (empezar por acá). Vigente desde el 30/09, después de la lectura corrida.
- [`lectura-corrida.md`](lectura-corrida.md): la entrevista completa de una vida inventada, mensaje por mensaje, como llega por WhatsApp (se genera con `scripts/v3-entrevista-lectura.ts`).
- [`correcciones-lectura.md`](correcciones-lectura.md): lo que Naza marcó al leerla, qué se decidió y los textos aprobados.
- [`banco.md`](banco.md): **el banco vigente**, fuente de verdad. Arranque, mensajes fijos, los 15 bloques en orden de envío (con "Depende de", Parte, Clase y Sensible), las reglas del flujo, las dudas abiertas y la tabla de equivalencias de IDs.

## Docs relacionados

- [`../metodo-entrevista.md`](../metodo-entrevista.md): el registro de decisiones (por qué cada pregunta es como es; lo que aprobó Naza, vuelta por vuelta).
- [`../banco-final-borrador.md`](../banco-final-borrador.md): el compilado de trabajo del que salió `banco.md` (con las filas "sale" para rastreo).
- [`../banco-descartadas.md`](../banco-descartadas.md): lo que salió del banco y por qué.
- [`historial/`](historial/): versiones viejas de los documentos de esta carpeta, con la fecha en el nombre. Hoy: [`flujo-2026-09-30-antes-de-la-lectura.md`](historial/flujo-2026-09-30-antes-de-la-lectura.md), [`flujo-2026-09-30-antes-de-la-ronda-2.md`](historial/flujo-2026-09-30-antes-de-la-ronda-2.md) y [`flujo-2026-09-30-antes-de-la-ronda-3.md`](historial/flujo-2026-09-30-antes-de-la-ronda-3.md).
- [`../banco-v3.md`](../banco-v3.md) y [`../diseno-v3.md`](../diseno-v3.md): historial anterior. **No están vigentes para la entrevista** (tamaños, gates por ficha, pausa, preguntas de datos); quedan como estaban y su código (`fabrica/src/v3/*.ts`) sigue andando.

## Código

En `fabrica/src/v3/entrevista/`:

- `banco-md.ts`: lee `banco.md` y devuelve las filas tipadas y los mensajes.
- `banco.json` (generado) y `banco.ts`: el banco tipado (`BANCO`, `MENSAJES`, `preguntaPorId`).
- `texto.ts`: `renderizar` (género, nombre, etapa, quien regala y la variante `«sino:X: a ‖ b»`).
- `flujo.ts`: "no" corto, condiciones, la próxima pregunta (con su frase de entrada y si lleva M1), los acuses y las dudas ficha contra respuesta.
- `mensajes.ts`: `armarTurno`, cómo se arma cada mensaje de WhatsApp (el acuse pegado a lo que sigue o solo).
- `seleccion.ts`: las preguntas que podrían llegar (núcleo y completo) para una ficha, para el recuento.

## Cómo se regenera y se prueba

Cada vez que cambia `banco.md`, desde `fabrica/`:

```bash
npx tsx scripts/v3-entrevista-json.ts   # regenera src/v3/entrevista/banco.json
npx vitest run                          # toda la suite (la vieja también)
npx tsc --noEmit -p .                   # tipos
npx tsx scripts/v3-entrevista-recorrido.ts   # opcional: recorrido de 6 vidas de ejemplo
npx tsx scripts/v3-entrevista-lectura.ts ../docs/v3/entrevista/lectura-corrida.md   # regenera la lectura corrida
```

Los tests de la entrevista son `fabrica/test/v3-entrevista-*.test.ts`; uno avisa si el json quedó viejo respecto del md.
