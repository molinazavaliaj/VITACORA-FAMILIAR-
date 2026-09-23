# Pase de manos — biógrafo v2 (23/09/2026, noche)

> Sesión larga con Naza (y Joaquín en llamada). Se reconstruyó el biógrafo por partes, **todo en
> ramas, producción sin tocar**. Falta: aprobar 3 textos, correr UNA prueba paga con todo junto,
> y recién ahí conectar al flujo real. Leer junto con `docs/biografo-v2-punto-de-partida.md`
> (qué sabemos, las decisiones de Naza y lo medido) y `docs/cerebro-del-biografo-para-revisar.md`.

## Dónde está el trabajo

Carpeta aparte: `C:\Users\Naza\Desktop\VITACORA FAMILIAR-biografo` (worktree). **No hacer
checkout en la carpeta principal**: la comparten varios chats (el 23/09 un checkout mío hizo que
otro chat mergeara `entregas-fase-1` encima de mi rama).

| Rama | Qué tiene | Pusheada |
|---|---|---|
| `biografo-v2-material` | auditoría de material, descartar sin borrar, candado que frena, reparto del libro | sí |
| `biografo-v2-perfil` | la anterior + origin/main mergeado + perfil, plan de preguntas, pregunta v2 | sí |
| `biografo-v2-fabrica` | la anterior + reescritura de la fábrica, etapas, evaluación v2, encargo compartido, transcripción | **pushear de nuevo** (hay commits después del último push) |
| `fabrica-tipos` (otro worktree) | `tsc` de la fábrica mira `scripts/` (igual que cb620fb en el entrevistador) | sí |

Verificado al cerrar: entrevistador 445 tests / 35 archivos + `npm run tipos` limpio; fábrica 508
tests / 45 archivos + `tsc` limpio. **Ojo:** en la fábrica, mirar la línea "Test Files" además de
"Tests": el 23/09 5 archivos no cargaban y el total igual decía "passed".

## Lo que se construyó (todo con tests, nada conectado al flujo real salvo lo marcado)

**Pregunta 0 — el material es de esta persona**
- `entrevistador/src/db/auditar-material.ts` + `npm run auditar-material -- <narrador>|--todos [--bajar]`.
- `respuestas_descartadas` (migración `20260923000300`, **NO aplicada**): descartar mueve la fila y el
  audio a `{narrador}/descartadas/`. Manual: `descartar`, `restaurar`, `cargar --reemplazar`, `--es-suyo`.
  El candado frena antes de evaluar. CONTRATO actualizado.

**El libro (fábrica)**
- `reparto.ts`: cada oración en UN capítulo. Medido en Joaquín: copia entre capítulos 17,3 % → 1,1 %.
- `encargo.ts`: encargo único del libro — hechos sagrados, la voz que decidió Naza ("sus historias
  escritas por un escritor de primera"), en el castellano de cada uno, citas `>` textuales (QR),
  mujer u hombre dicho (y `generoDelMaterial` lo deduce de cómo se nombra).
- `paginas.ts`: el editor ya no reescribe el libro (USD 2,08 → ~0,40): solo apertura, cierre y
  «Sus frases» (las no textuales se caen), títulos fijos, y `controlarLibro` (repetición, sin
  respaldo, género) antes de imprimir.
- `etapas.ts`: el libro por las etapas de SU vida (decisión de Naza) + reparto en etapas.
- `medir-repeticion.ts`: la prueba de repetición.
- **Arreglo que ya sirve en producción** (`frases.ts`): el lector de «Sus frases» perdía las
  heredadas y las muletillas cuando el editor inventaba subtítulos (Joaquín: 0 → 5 y 29).
- `scripts/prueba-reparto.ts [--etapas]`: la cadena entera, sin escribir en Supabase.

**La entrevista (entrevistador)**
- `perfil.ts`: la ficha de la persona (edad, cómo habla, mujer/hombre, etapas con lugares, quién
  vive, bisagras, tono, qué no se sabe) sin depender de la familia; devuelve solo lo que cambió.
- `plan-preguntas.ts`: reparte 11 preguntas variables por tramos de SU vida (cuenta, sin modelo).
- `encargo-entrevista.ts`: el encargo compartido (quién es, cómo hablarle, lo que se respeta).
- `pregunta-v2.ts`: la pregunta del día decide cómo preguntar; núcleo de 15 temas; primer mensaje
  con edad y vos/usted (decide la persona).
- `evaluar-v2.ts`: la evaluación escrita desde cero sobre el encargo (ve lo ya contado: C1).
- `cerebro.ts`: `loQueYaConto` opcional en la evaluación de producción (sin él, idéntica).
- `control-texto.ts`: los controles puros sacados de personalizar.ts.
- **Transcripción** (`manual/puro.ts`, esto SÍ cambia producción al mergear): castellano según la
  zona horaria, sin el texto libre de la familia, "Quien habla es X".
- `scripts/prueba-integral.ts`: la prueba única de la entrevista (Ciro, Joaquín, Osvaldo sin
  ficha + C1 y C4 comparados), sin escribir en la base.

## Decisiones de Naza (todas en el punto de partida)

Fidelidad = sus historias con la mejor redacción · la edad en el primer mensaje · vos/usted lo
elige la persona · nunca tratar de hombre a una mujer; la compra pregunta mujer/hombre (web) ·
sin "nada de otra persona" en el encargo · el libro por etapas · Opus para la entrevista · nada
de pruebas pagas sueltas: **una prueba única al final, avisando el costo** · al terminar, los
prompts se reescriben desde cero, no parches (esta sesión ya hizo buena parte de eso).

## Pendiente

1. **Naza aprueba 3 textos de objetos** (101 infancia, 106 "los chicos de su vida", 107 "le hizo
   compañía"; ver el último mensaje de la sesión) → SQL `update preguntas` de la plantilla.
2. **La prueba única** (~USD 9): `cd entrevistador && npx tsx scripts/prueba-integral.ts` (~3,5) y
   `cd fabrica && npx tsx --env-file=.env scripts/prueba-reparto.ts <id> --etapas --excluir
   b3bd57db-a5f9-47e2-b638-8615bcb23566` para Joaquín (3691baf4-…) y Osvaldo (d55d75b8-…) (~5,5).
   Solo con el OK de Naza. La cuenta de Anthropic se quedó sin crédito el 23/09 (Naza cargó 24).
3. **Conectar al flujo real** (después de la prueba): ver "Al conectar el v2" en el punto de
   partida. Toca código de Joaquín (entrevistador) y el panel web (fotos y títulos por capítulo
   con etapas; pregunta mujer/hombre en la compra).
4. **Para Joaquín**: aplicar/acordar la migración de descartadas; confirmar `context.forwarded` y
   `audio.voice` en el webhook; el pedido de Joaquín figura `fallido`; su audiolibro tiene la voz
   de Ciro (cap. 7). Tarea aparte en curso: sacar el audiolibro y los conectores de la fábrica.
5. Sin tocar todavía: NotebookLM (qué patrones buscar en nuestro material, qué material de afuera
   y "el paso del medio" de libro a prompt) — era "la parte que más le interesa" a Naza.

## Qué NO hacer

- No correr pruebas contra el modelo sin el OK de Naza (gasta de la cuenta de producción).
- No checkout en la carpeta principal; no push a main.
- No regenerar nada de Ciro (decisión de Naza).
- En Bash, `\b` dentro de comandos se convierte en un carácter de control: para regex con `\b`
  usar la herramienta de escribir/editar archivos, no heredocs/sed/python por consola.
