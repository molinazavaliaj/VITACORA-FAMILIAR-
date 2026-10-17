# Kids V2 · Plan de la receta del libro (15/10/2026)

Rama `kids-libro` (sale de `kids-conexion`, PR #47). Worktree `C:\Users\Naza\Desktop\VITACORA FAMILIAR-kids-libro`.
Decisiones de Naza: [`../libro-decisiones-2026-10-15.md`](../libro-decisiones-2026-10-15.md) (mandan sobre este plan).

**Idea:** la misma máquina del escritor de Familiar (`fabrica/src/escritor/`: `Carpeta`, `Almacen*`, `Ejecutor` con
checkpoints, tope de gasto y Batch, `modelo/*` con `ModeloFalso`, `costos.ts`, el compilador de prompts desde md,
`htmlAPdf`, `qr.ts`, `Cola`, `avisos`) con una receta de Kids escrita de cero en carpetas nuevas. **No se toca nada
de la receta de Familiar** (ni sus prompts, ni sus controles, ni su orquestador): si algo genérico necesita un
parámetro (p. ej. `rolDe` o el `version` de los prompts), se agrega sin cambiar lo que hace hoy, con sus tests en verde.

Código nuevo en `fabrica/src/escritor-kids/`. Receta (prompts) en `docs/kids/v2/escritor/receta.md`, compilada a
`fabrica/src/escritor-kids/prompts/prompts-kids.json` con un script y un test de «JSON al día» (como v5.5).

## Lo que entra

`material/de-kids.ts`: lee `kids_v2` (ficha con nombre, apodo, género, edad, quién se lo regala, preguntas del padre
con `quien`/`conLinea`; `correcciones`) y `respuestas` con `clave_kids` (sin null ni `∅`), con su audio y sus fotos
(`fotos` por `pregunta_orden`). Agrupa por **item del banco** (`banco.json`): la principal `K12` con sus ramas
(`K12-R1`…), su otra puerta (`K12-OP`), su foto (`K12-FOTO`, y la mudada con el id de la original), las «una más» y
extras de esa parte (`X2-3`), el «¿quedó algo?» (`CIERRE-2`), y `PADRE-n`. Cada respuesta lleva un id corto
(`R01`…) y su clave. Las correcciones de nombres se aplican **antes** de que lo lea el modelo (en una copia: lo
guardado no cambia). Sale una `Carpeta` con `entradas/material.json` (estructurado) y `entradas/ficha.json`.

Para probar sin la base: `fabrica/test/fijos/escritor-kids/` con un chico **inventado** (no la vida de nadie real),
escrito a mano como transcripción oral de un chico de 11 (con muletillas, repeticiones, respuestas cortas y alguna
larga, una foto por cada pregunta con foto, preguntas del padre con y sin línea, una parte con «Paso», el sobre).

## Las etapas

**A · Leer todo (Opus, una llamada).** Lee todo el material y devuelve JSON: `preocupante` (lo que hace falta que
mire Naza, con ids y cita textual; vacío si nada), `dudas` (nombres que suenan mal transcriptos, con ids y cita),
`suVoz` (los ids de 5 a 8 respuestas con audio que mejor lo pintan, para el QR) y `fotosConOtros` (no se puede
saber por la foto: queda vacío; Naza las mira). Si `preocupante` no está vacío: se escribe `frenado.json`, se avisa a
los socios y **no se sigue** hasta que exista `liberado.json` (lo pone Naza). Decisión 8.

**B · Escribir las cuatro partes (Opus, una llamada por parte, en lote).** Por parte 1 a 4: las respuestas de esa
parte → JSON `{ piezas: [{ titulo, texto, ids }] }`, una pieza por pregunta principal contestada, en orden del
banco, con sus ramas, otra puerta, extras y «quedó algo» metidos en la pieza que corresponda. Primera persona, sus
palabras, se limpia lo oral sin embellecer, nada que un chico de 11 no diría, corto si contestó corto, sin dos
puntos ni giros armados, nada inventado, lo delicado como lo dijo (decisiones 1 a 3). Una pregunta que pasó
(«Paso») no tiene pieza. La parte 4 cierra con las preguntas del padre: su pregunta tal cual, la línea «Esta
pregunta te la manda {quien}» si `conLinea` (decisión 5), y la respuesta limpia.

**B · El sobre (Opus medio, una llamada).** Parte 5 y sus extras: cada pregunta tal cual y la respuesta **solo
limpia** (sin reescribir, decisión 6).

**B · El álbum (Opus medio, una llamada).** Cada foto con lo que dijo de ella, en una o dos líneas suyas
(decisión 4). Título «Mis cosas a los {edad}».

**C · Revisar (Opus, una llamada) y arreglar.** Un veedor compara cada pieza con sus ids: ¿hay algo que no dijo?
¿falta algo que dijo? ¿suena a grande? ¿dos puntos? Devuelve problemas por pieza. Si hay, se reescribe **solo esa
parte** una vez con los problemas. Controles sin modelo (en código): cada respuesta con texto está en alguna pieza,
el sobre o el álbum; ninguna pieza sin ids; sin «:» en los textos; largo de cada pieza no mayor que ~1,5 veces lo
que dijo (no se estira).

**Armado (sin modelo).** `libro.md` (tapa con nombre y «Capítulo Uno: {edad} años», las cuatro partes con sus
títulos del banco, el álbum, «Su voz» con QR al audio real, como en la casa), `sobre.md` aparte, y `informe.md`
para los socios. HTML y PDF A5 con una plantilla de Kids nueva (`escritor-kids/salida/`), reusando `htmlAPdf` y
`qr.ts`: `libro.pdf` y `sobre.pdf`.

## Cómo se corre

`fabrica/scripts/escritor-kids-correr.ts --carpeta <dir> [--si] [--sin-lote] [--tope USD]`: sin `--si` solo
**estima** el costo (como `escritor-correr.ts`); con `--si` llama al modelo de verdad. Con la carpeta del chico
inventado deja `libro.pdf`, `sobre.pdf` e `informe.md` para leer.

El worker (`termino_at` → A; pedido pagado → B, C y armado; el padre aprueba en el panel antes de imprimir; aviso a
Naza a los 14 días, decisión 9) va **después** de la prueba paga y de que Naza lea el libro.
**16/10:** enchufado en la rama `kids-libro` (`fabrica/src/escritor-kids/produccion/`, probado solo con el modelo
falso; CONTRATO, «El libro de Kids en la fábrica»). Tiene un interruptor, `ESCRITOR_KIDS`, **apagado por defecto**:
sin él no se gasta nada y solo se avisa a los socios que un chico terminó. `ESCRITOR_KIDS=solo:<narrador_id>` lo
prende solo para ese chico (el piloto real de Naza); `ESCRITOR_KIDS=1`, para todos.

## Pruebas

Todo con `ModeloFalso` y `AlmacenMemoria` en `fabrica/test/escritor-kids/`: el material desde filas falsas, cada
etapa, el freno por algo preocupante, los controles, el armado y el PDF. `npm test` de la fábrica entero en verde
(lo de Familiar no cambia). Costo de las pruebas: cero.

**La prueba paga** se corre recién con el OK de Naza, avisándole antes el costo estimado (`--si` una sola vez, con
Batch, todas las etapas juntas sobre el chico inventado).
