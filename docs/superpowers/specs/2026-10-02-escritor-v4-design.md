# Escritor v4 — diseño (02/10/2026)

## Por qué
Naza leyó la v3.2 contra el libro anterior y prefirió el anterior. La v3.2 sacaba más nota (9 contra 7,5) porque la vara medía fidelidad, y la receta confundió **no inventar hechos** con **no narrar**: quedaba casi transcripto, "escrito raro", y repetía "Juan Manuel" cuatro veces seguidas. Diez de las quince respuestas de Naza piden otra cosa que la v3.2, así que se reescribe de cero (camino A), no se parcha.

## Lo que tiene que lograr (las 15 respuestas de Naza)
1. **Atrapa como una novela**: se lee de corrido. Un 10 es "no lo pueden soltar" y "es él".
2. **Primera persona**, siempre.
3. **No agrega hechos** (quién, qué, cuándo, dónde, cuánto, qué se dijo). Cuenta bien lo que se dijo: si lo contó bien pero redactado mal, lo redacta bien. Lo que falta no lo resuelve el escritor: lo repregunta la entrevista (cazador o dashboard); el escritor solo lo anota en el informe.
4. **Voz mezcla**: narra el escritor con el tono del narrador (sus palabras, su trato, su manera); en los momentos clave entra una frase suya textual.
5. **El peso va por importancia, no por largo**: un momento clave del registro (giro, punto alto o bajo, pérdida, peligro) va en un lugar fuerte, con ritmo y pausa, aunque esté contado en dos líneas. Lo menor queda en una línea en el medio.
6. **Dentro del capítulo, orden cronológico.**
7. **Capítulo = etapa de la vida**, en orden.
8. **Títulos**: lo que mejor quede, sin inventar.
9. **Reflexiones**: solo las que dijo el narrador, puestas donde pesan.
10. **Recursos de escritor con medida**: frase corta para cerrar, frase suya destacada, diálogo con raya. Sí, mientras sirvan al relato; molestan si se abusa o si se nota el truco.
11. **Largo**: lo que dé la entrevista.
12. **Todo entra**, aunque sea en una línea.
13. **Lo de hoy va al último capítulo.** Única excepción: una línea de consecuencia que cierra una historia vieja ("y hasta hoy le sigo debiendo a Ivo"), sin atarla a un momento en que no pasó.
14. **Quién decide**: Fable filtra (descarta lo que empeora) y Naza lee antes/ahora y decide. Ninguna versión se declara mejor sin su lectura.
15. Ver 1.

## Qué se hace
**Archivos nuevos, sin pisar** (lo viejo queda como historial): `docs/v4/escritor/guia.md`, `receta.md` y `vara.md`. Los redacta Fable con las 15 respuestas como objetivo y ejemplos inventados (nunca la vida de un narrador real). Los prompts los aprueba Naza antes de la prueba.

**Se mantiene del circuito** (funciona y no choca con el objetivo): registro, plan, escritura capítulo por capítulo, verificador de hechos, lector, cotejo respuesta por respuesta, una ronda de arreglo por reemplazos (sin deriva), informe, workflow del libro entero y prueba corta.

**Controles del código:**

| Se quedan (cuidan hechos y que todo entre) | Cambian | Se van |
|---|---|---|
| C2 frases cortadas, C4 nombres, C5 fechas, C9 arreglo, C10 trato, C14 registro, C18 todo entra, C19 carta, C21 nadie se cae, C23/C24 balance y cotejo, C27 pasados de vivos, `[[FICHA]]` | **C6**: textual solo en lo que va entre rayas o destacado (la narración ya no tiene que ser textual). **C13**: capítulos por etapa y en orden; los momentos clave no van enterrados en el medio; lo de hoy, al último. **C28**: una línea de hoy por historia, al final de esa historia; el resto va al arreglo. **C1**: los recursos se marcan solo si se abusa (más de dos frases-golpe o citas destacadas por capítulo) | Hecho fuerte como eje del capítulo; prohibición de párrafo corto y de cita destacada; C22 "70 % de detalles" pasa a pedido del prompt, no a control |
| | **Nuevo C29**: el mismo nombre propio tres o más veces en tres oraciones seguidas va al arreglo ("Juan Manuel" ×4) | |

**Vara nueva** (`vara.md`), armada con las 15 respuestas: atrapa (ritmo, ganas de seguir), es él (voz), peso a lo importante, orden y claridad, verdad de hechos, todo entra, recursos con medida. El capítulo anterior que le gustó a Naza sirve para calibrar al juez: se le pasa al juez en el momento, desde la carpeta de Naza, fuera de git; nunca va dentro de la vara ni de un prompt. Si la vara le da más nota a algo que Naza lee peor, la vara está mal.

## Cómo se prueba
1. **Banco fijo de 4 capítulos**: el del secuestro y el último de Naza; el de la separación y el último de Joaquín. Prueba corta, un capítulo por vez.
2. **Fable filtra a ciegas** v4 contra v3.2 y contra el libro anterior, con la vara nueva. Si v4 pierde con la v3.2 en algún capítulo, no pasa.
3. **Naza lee** antes/ahora de sus dos capítulos (archivo como el de hoy) y decide. Listo cuando Naza prefiere la v4.
4. Después, libro entero de Naza y de Joaquín.

## Fuera de alcance
La entrevista (Chat B; Naza ya la mejoró), el dashboard, la conexión a la web (Joaquín).
