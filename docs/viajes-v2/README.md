# Vitácora de Viaje V2

Carpeta del rediseño de la entrevista de Vitácora de Viaje (30/09/2026), hecho con el método del banco de V3. Rama `viajes-v2`. **Main y el viaje en curso no se tocaron.**

## Empezar por acá
- [`flujo-vigente.md`](flujo-vigente.md): el proceso de punta a punta (compra, arranque, antes de salir, cada día, el final, horas).
- [`banco.md`](banco.md): **fuente de verdad** de textos y reglas (el código se genera desde acá). Las reglas finales están en los bloques del final.
- [`lectura-corrida.md`](lectura-corrida.md): un viaje inventado, mensaje por mensaje (se genera, no editar a mano). Publicada para el celular: https://claude.ai/artifact/5TNoeiFpgsDVYMhWYsTYXh
- [`banco-descartadas.md`](banco-descartadas.md): lo que salió y por qué.

## Cómo se llegó
`paso-1*.md` (diseño) → `paso-2-*` (el banco, parte por parte, rondas y aprobadas) → `paso-3-*` (mensajes fijos) → `paso-4-revision-fable.md` (revisión del banco entero). Versiones viejas en [`historial/`](historial/). `diseno-vigente.md` quedó superado por `flujo-vigente.md`.

## Código
`fabrica/src/viaje-v2/` (puro, sin I/O): banco-md, banco (json generado), texto, horas, calendario, mensajes, estado, album, lectura. Tests en `fabrica/test/viaje-v2-*.test.ts` (237, en verde al 30/09, incluido uno que corre los 2400 viajes; se saltea con `VIAJE_V2_SIN_2400=1`).

**Simulaciones** ([`simulaciones/`](simulaciones/)): `npx tsx scripts/viaje-v2-simular.ts` corre 2400 viajes inventados contra 40 controles (cero fallas al 30/09); `resumen.md` tiene las estadísticas, y hay lecturas de 1, 2 y 30 días más la lectura de Fable "como la persona". Viaje de 30 días publicado: https://claude.ai/artifact/XpFjHLKfNAhStEhT9hcXmd

```bash
cd fabrica
npx tsx scripts/viaje-v2-json.ts      # regenera src/viaje-v2/banco.json desde banco.md
npx vitest run test/viaje-v2          # tests
npx tsx scripts/viaje-v2-lectura.ts   # regenera docs/viajes-v2/lectura-corrida.md
```

## Qué falta (no está hecho)
1. **Conectarlo al entrevistador de WhatsApp** (Joaquín): un planificador que use `armarCalendario` y los mensajes, filtre lo que ya pasó, guarde el estado y avise a Naza (`avisosNaza`, álbum con cero fotos).
2. **La compra** (`/comprar/viaje`): país principal, "el día que emprendés la vuelta", para mí o regalo (quién regala), hasta 5 preguntas propias, formato PDF o impreso (el impreso se muestra como el producto), álbum de 20 o 40. Se sacan ciudades y "con quién viajás".
3. **El panel**: corregir el país (la hora) durante el viaje; leer el libro antes de que se cierre.
4. **Meta**: plantillas nuevas para BIEN-1 y BIEN-1R (variables: nombre, formato, quien regala).
5. **El libro**: capítulos por etapa que arma el escritor desde los audios, álbum tipo folleto de moda al final y QR con audios.
6. Decidir cuándo pasa el viajero en curso (hoy en main) al V2: no antes de que termine su viaje.
