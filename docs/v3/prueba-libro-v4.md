# Prueba del escritor con los prompts v4 — 26/09/2026

Libro de prueba de Naza escrito con los prompts **versión 4** ([`prompts-escritor-v3.md`](prompts-escritor-v3.md); la v4 hoy está en git, `f7df750`: el archivo tiene la v5), dentro de la sesión (USD 0 de API). Cada paso con modelo lo hizo un agente de contexto limpio que leía solo su llamada (los documentos + el prompt v4 tal cual, extraído del md por código). Los pasos de código (1b, 1c, 2b, 4, 6-medido) se hicieron con scripts a mano en `fabrica/prueba-v3-naza/libro-v4/` (carpeta ignorada: tiene su vida). Este documento no repite contenido de su vida: solo lo que se aprendió.

## Cómo se corrió

| Paso | Quién | Resultado |
|---|---|---|
| 1 Biblia | agente | 54 personas, 49 anécdotas, 35 eventos, 40 citas, 30 dudas; ninguna respuesta afuera |
| 1b Índice | `armarIndice` (Estándar, migrante joven) + script | 3 capítulos (De dónde vengo… 1.840 / Hacerse grande 2.246 / El viaje, hasta hoy 1.946) + carta |
| 1c Revisión | script: `revision.xml` aplicada a biblia, respuestas y ficha | 20 dudas resueltas, 10 quedaron "sin respuesta: no afirmar" |
| 2 Plan | agente | 3 hilos; la validación 2b encontró 6 errores (5 citas no idénticas a las candidatas, 1 nombre del puente sin respaldo) → un reintento con los errores → ok |
| 3a/3b/3c | 5 agentes en paralelo | 7.020 palabras |
| 4 Controles | script | 24 marcas; filtradas a mano 19 (y 2 de ellas resultaron falsas alarmas mías, ver abajo) |
| 5 Lectura final | agente | 30 problemas (4 altos) |
| 6 Retoque | 5 agentes | 6.438 palabras; 86 de 123 párrafos quedaron idénticos |

PDF: `prueba-v3-naza/libro-v4/Libro-de-Naza-V4.pdf` (46 páginas, plantilla aprobada, tapa "Listo para pelearla": la v4 no produce título).

## Comparación con el libro anterior (a ciegas, un agente compara y otro revisa)

| | Libro anterior (prompts v1-2, 11 capítulos) | Libro v4 (3 capítulos) |
|---|---|---|
| Errores graves (dato falso que la familia notaría) | 1 | **0** |
| Errores totales (confirmados por el revisor) | **17** | 21 |
| Fuera de orden o de lugar | 2 | 5 |
| Presentado dos veces | 2 | 4 |
| Repetido dentro del capítulo | 2 | 4 |
| Vida al leer | **más vida**: va en orden, conserva los datos concretos que él dio | más tieso: introducción de inventario, vaguedades donde él dio el dato, carta que repite el libro |

**¿Menos errores?** En datos, sí: la v4 no tiene ningún dato falso y conserva los nombres y la revisión. En armado, no: tiene más errores de orden, repeticiones y presentaciones, casi todos de dos causas que no son de redacción (el índice de 3 capítulos mezcla épocas; la carta pega la respuesta "qué capítulos tendría tu vida", que resume el libro entero).

**¿Misma vida o más tieso?** Más tieso. Las causas, con ejemplos del propio libro:
1. **Plazos que él dijo, borrados.** La regla "un número o plazo solo si la línea de tiempo lo tiene seguro" más la biblia ("fecha_segura" solo con año o edad) hicieron que "dos años" dichos por él pasaran a "un tiempo" o "muy poco tiempo". La regla protegía contra plazos calculados por el escritor, no contra los suyos.
2. **Mínimos de largo.** La introducción pide 350 palabras y una escena de 150-250; la escena de hoy tenía material para ~80. Resultado: relleno y repetición ("el sillón" cinco veces). Choca con "nunca estirar".
3. **Presentaciones de 60 a 120 palabras** para personas con una o dos frases de material: o se estira, o se arma un párrafo-inventario.
4. **Sin adjetivos, sin nada agregado, oraciones cortas**, todo junto en la introducción: sale una lista ("Él está en la casa y yo estoy en el sillón").

## Hallazgos de los prompts v4 (para la v5)

1. **Paso 2 plan:** no tiene campo para el título del libro (la tapa lo necesita) ni para "la oración de cierre" de la carta (el 3c la pide, el plan solo da el orden de ids).
2. **Paso 2 plan:** puso la escena de hoy también entre los "vedados" de la introducción; la regla no lo impide.
3. **Paso 2 plan:** la apertura puede ser una escena de una anécdota que no es la primera del orden; no dice qué pasa entonces.
4. **Paso 2 / 3b:** la frase de presentación que escribe el plan trae hechos de más adelante en el mismo capítulo; el 3b dice "nada que pase después" y el escritor tuvo que mover a la persona.
5. **Paso 3b último capítulo del modo migrante:** dos cierres obligatorios (el remate del plan y volver a la escena de hoy); el escritor los pegó en un párrafo.
6. **Paso 3b:** el epígrafe no se repite en el cuerpo, pero a veces la anécdota del capítulo es justo eso; se parafrasea.
7. **Paso 3c carta:** "casi textual" + una respuesta de legado que resume la vida por etapas = la carta repite el libro. El retoque la recortó y quedó menos textual.
8. **Paso 6 retoque:** no tiene salida para "falsa alarma". Ante una marca del código que era falsa (un nombre dicho separado, "block Buster"), borró un detalle verdadero.
9. **Paso 1 biblia:** 3 grafías corregidas en la revisión quedaron viejas dentro de los textos de la biblia (hay que reemplazarlas en todo el JSON, no solo en "nombre").

## Hallazgos del código a mano (1b, 1c, 4) — para cuando se programe

1. **Anclar anécdotas "por más palabras" mezcla épocas:** una anécdota de 2018 cayó en "El viaje, hasta hoy" (2021+) y un amigo del Liceo se presentó en el capítulo anterior al Liceo. Además el índice por bloques pone en el capítulo 1 cosas de los 13 años y en el 2 cosas de los 10. Propuesta: anclar por la edad de la anécdota (la biblia la trae) y usar las palabras solo para desempatar.
2. **La carta no ancla anécdotas:** sus respuestas son largas y se llevaban historias de capítulos (arreglado en el script).
3. **"≥150 palabras" para presentar** es ambiguo: contando las respuestas enteras donde aparece, se presentaban 19 personas en un capítulo. En la prueba: ≥ 2 hechos y ≥ 150 palabras, o familia con nombre; pareja en su capítulo principal. Igual quedaron sobrinos con una frase a los que el 3b tuvo que "presentar".
4. **`contada_en` necesita dos niveles:** "toda su historia vive en otro capítulo" y "una parte vive en otro" (`partes_contadas_en_otro_capitulo`). Con uno solo, una respuesta de hoy quedaba reducida a media línea por una anécdota vieja que también tocaba.
5. **1c tiene que marcar `fecha_segura`** en la línea de tiempo cuando el narrador confirma un año en el dashboard; si no, el escritor no lo usa.
6. **Lo confirmado en el dashboard que no está en ninguna respuesta** se pasó a la ficha (`<confirmado_por_el_narrador>`, respaldo "FICHA"). Funcionó.
7. **Respuestas "paso"** quedan citadas en la biblia pero no llegan a los pasos siguientes: la biblia debería ignorarlas.
8. **Controles de nombres y comparaciones:** comparan palabra exacta; fallan con palabras separadas ("block Buster") y con otra forma del verbo ("criarme" / "me crió"). Dos falsas alarmas en esta prueba, una borró un dato verdadero.
9. **Retoque medido:** comparar párrafos idénticos sirve; emparejar el cambio con su problema por texto es flojo (3 cambios parecían "sin problema" y sí lo tenían).

## Propuesta: qué aflojar (redacción) sin tocar la verdad

Se mantienen tal cual: no inventar, no repetir entre capítulos, presentar una vez, citas y diálogos textuales, nada que pase después, dudas sin respuesta no se afirman. Se aflojan (textos a aprobar por Naza antes de pasarlos a los prompts):

| # | Regla v4 | Cambio propuesto | Por qué no toca la verdad |
|---|---|---|---|
| R1 | Plazo o número solo si la línea de tiempo lo tiene "seguro" | Lo que **él dijo con número** ("dos años", "un mes") se dice como lo dijo; lo vago es solo para lo que el escritor calcularía. En la biblia, "fecha_segura" también para plazos dichos con número. | Es su dato, no una cuenta del escritor |
| R2 | Introducción de 350 a 550; escena de hoy de 150 a 250 | "Hasta 450; la escena de hoy, lo que dé su respuesta. Si da poco, la introducción es corta." | Saca relleno, no agrega nada |
| R3 | Presentación: párrafo propio de 60 a 120 palabras | "Hasta 120; si de esa persona hay poco, una o dos oraciones dentro de la escena donde aparece." | Menos texto con el mismo material |
| R4 | "Contar historias… con sus palabras" (general) | Sumar: "Cuando él lo dijo con una frase propia que se entiende, usá su frase y no una tuya; conservá sus giros (una muletilla por escena, no más)." | Acerca el texto a lo que dijo |
| R5 | Carta: todas las respuestas de legado, casi textuales | La respuesta "qué capítulos tendría tu vida" no va a la carta (el libro ya es eso); de ella, solo lo que diga de sí mismo. | Evita repetir, no agrega |
| R6 | Retoque: arreglá cada problema de la lista | Sumar: "Si el material dice lo que el problema marca como falso, dejalo igual y decilo." | Evita borrar datos verdaderos |

Y dos cambios de estructura (no de redacción) para bajar los errores de orden: anclar anécdotas por edad (hallazgo de código 1) y agregar al plan `titulo_libro` (frase suya) y `cierre_carta` (id y frase).

## Qué se usó de tokens

Unos 3,2 millones de tokens de agentes dentro de la suscripción; USD 0 de API. Por API el mismo recorrido era ~USD 4 con caché (medido en la prueba anterior).
