# Receta del escritor (v5.2: novelista con red, prosa en el punto medio)

**Estado: v5.2, 03/10/2026.** Copia de la receta v5/v5.1 ([`../escritor/receta.md`](../escritor/receta.md), que queda como historial) con los cuatro cambios que Naza diagnosticó después de leer el libro "novelista puro" y de ver la v5.1 (que arregló el concierto de puntos pero se fue al otro extremo: oraciones de 60–90 palabras e inventario):
1. **Prosa en el punto medio:** oraciones de 10 a 30 palabras, alguna corta cuando pesa, ninguna de más de 40 (Pasos 3a, 3b, 3c, 3d y 6 puros; C31 marca también las de más de 40).
2. **Los "no" de la entrevista no entran** ("de la salud, paso", "ningún maestro", "no tengo foto", "no hay mucho más que contar"): regla dura en 3a/3b/3c/3d/6 puros y el armador; una respuesta que entera es un "no" va en "afuera" como `no_entra`; control de código C32.
3. **El armador no hace listas de pasos:** "estas son las historias y por qué importan" (Paso 2h).
4. **El golpe, su preparación y la frase suya de esa etapa, en el mismo capítulo:** borde 18 del plan (`golpe`), control C33, `<golpe>` para el armador y el novelista.

**Estado: v5, 02/10/2026.** "Novelista con red." Naza leyó un capítulo escrito por un novelista (Opus con un pedido corto: elegí un hilo, entrá por una imagen, avanzá en el tiempo, dale al hecho más grave su lugar, su voz, y la regla dura de hechos) y le gustó más que todo lo demás ("muy sólido"); la v4.1, que arma el capítulo pieza por pieza desde el plan, no llegó a ese nivel. Cambian: el Paso 2 (el plan solo ATA el reparto: qué respuestas van a cada capítulo, por etapa y en orden; hilo, piezas, peso, imagen, preparación, apertura y cierre son sugerencia), el Paso 3b (el prompt del novelista: elige él el hilo y puede dejar afuera de su capítulo lo que no lo empuja, con destino), el Paso 6 (un "falta R.." entra como línea o en su tramo) y un control nuevo, C30 (Afuera). La red (verificador, cotejo, controles) sigue igual: cuida los hechos y que todo entre.

**v4.1, 02/10/2026.** Sobre la v4 cambian el Paso 2 (el hilo es una historia que cambia; las piezas son las que lo empujan; `imagen` y `preparacion` opcionales) y el Paso 3b (contar el hilo y no la etapa, entrar en un solo momento, volver a la imagen en lo más grave, preparar el golpe, limpiar restos del habla, cerrar en la imagen o un gesto). Sale de un capítulo de prueba que Naza leyó como "muy sólido": mismos hechos, un hilo, una imagen que vuelve, el golpe preparado.

**v4, escrita de cero el 02/10/2026** desde las 15 respuestas de Naza ([diseño](../../superpowers/specs/2026-10-02-escritor-v4-design.md)). La v3.2 ([`docs/v3/escritor/receta.md`](../../v3/escritor/receta.md)) queda como historial: sacaba más nota con el juez, pero Naza leyó su libro contra el anterior y prefirió el anterior. Quedaba casi transcripto, "escrito raro", con el mismo nombre cuatro veces seguidas, porque la receta confundió **no inventar hechos** con **no narrar**.

**El objetivo, en una oración (va en cada prompt de escritura):** una novela en primera persona, con el tono de quien narra, que atrape y que la familia diga "es él" (o "es ella"), sin un solo hecho agregado.

**Qué cambia respecto de la v3.2.**
- "No inventar" quiere decir **hechos**: quién, qué, cuándo, dónde, cuánto, qué se dijo, y ningún motivo que no dio. **La regla del dueño, que manda sobre cualquier texto:** el escritor usa las palabras, el orden, los conectores y el ritmo que quiera; lo único prohibido es afirmar algo que no pasó o un motivo que no dio. El relato es obligación del escritor: ordenar, conectar, ritmo, limpiar repeticiones y muletillas, redactar bien lo que se contó mal, darle peso a lo importante, cerrar bien.
- **Voz mezcla**: narra el escritor con el tono del narrador; solo lo que va entre rayas, comillas o destacado tiene que ser textual (C6).
- **Capítulo = etapa de la vida**, en orden; adentro, cronológico. Se va el "hecho fuerte" como eje del capítulo.
- **Peso por importancia, no por largo**: cada pieza del plan lleva `peso` (clave, normal, línea); un momento clave nunca va en una línea (C13).
- **Lo de hoy al último capítulo**; en un capítulo viejo, una sola línea de consecuencia al final de su historia (C28).
- **Recursos con medida**: frase corta de cierre, frase suya destacada, diálogo con raya; el código marca solo a partir del cuarto golpe por pieza (C1).
- **El mismo nombre tres veces en tres oraciones** va al arreglo (C29, nuevo).
- **Cada prompt de escritura enseña el oficio** ("Cómo se cuenta") antes de los bordes, y los bordes son pocos.
- Se mantiene todo lo que cuida los hechos y que todo entre: registro, marcas `[[R..]]` (ahora por tramo, no por párrafo), verificador con `<presentes>` y `<pasados>`, lector con `<referencias>`, cotejo, una sola ronda de arreglo por reemplazos, lectura final al informe, informe.

Esta receta hace cumplir la [guía](guia.md). Son los textos EXACTOS que recibe el modelo en cada paso, más lo que hace el código entre paso y paso.

**Principio.** El modelo elige dentro de bordes y otro controla después. Cada prompt dice qué hace el paso, sus bordes (pocos y chequeables) y ejemplos cortos; el oficio entero va en `<guia>`, con las secciones que le tocan a ese paso. El que escribe no se revisa: verificador, lector y cotejador no ven el plan ni los prompts de escritura. El arreglo dice qué tramo cambia y por cuál; el código lo aplica. Una sola ronda; lo que queda abierto va al informe.

**Regla para quien edite esta receta:** los ejemplos son de Nélida (inventada: mercera de Echesortu, Rosario; marido Raúl, hija Marcela, amiga la Negra). Nunca la vida de un narrador real.

---

## 1. El recorrido

| # | Paso | Quién | Qué deja |
|---|---|---|---|
| 0 | Prepara `<ficha>` (con `<confirmado_por_el_narrador>` si hubo tablero) y `<respuestas>` (sin las "paso") | código | entradas |
| 1 | **Registro de hechos** (lector del material) | modelo | `registro.json` |
| 1b | Valida el registro (C14); si falla, reintenta el 1 con el error (máx. 2) | código | registro válido |
| 2 | **Plan del libro** (editor) | modelo | `plan.json` |
| 2b | Valida el plan (C12, C13, C19, C20); si falla, reintenta el 2 (máx. 2). Arma los títulos impresos | código | plan válido |
| 3a | **La primera página** (escritor) | modelo | `primera_pagina.md` |
| 3b | **Capítulos, uno por uno en orden**, cada uno con lo ya escrito y la ficha de voz | modelo | `capitulo_NN.md` |
| 3c | **La carta** | modelo | `carta.md` |
| 3d | **Antes de cerrar** (si el plan trae `antes_de_cerrar.ids`) | modelo | `antes_de_cerrar.md` |
| 3e | Arma "Sus frases" (C6) y corre los controles de texto sobre cada pieza; lo que falla va al arreglo | código | libro con marcas |
| 4 | **Control de hechos** (verificador: guía, ficha, respuestas, registro, libro CON marcas, `<presentes>`, `<pasados>`; sin plan ni prompts) | modelo | `hechos.json` |
| 5 | **Lectura de corrido** (lector: guía entera, libro SIN marcas, `<referencias>`; sin material) | modelo | `lectura.json` |
| 5b | **Cotejo** (cotejador: respuestas y libro CON marcas) | modelo | `cotejo.json` |
| 6 | **Arreglo, una ronda**: por pieza con problemas, lista de reemplazos `antes → despues`; el código los aplica (C9), vuelve a correr los controles y el repaso del 4 | modelo + código | piezas corregidas |
| 6b | **Lectura final**: el paso 5 otra vez, igual, sobre el libro arreglado. Va solo al informe: no hay segunda ronda de arreglo | modelo | `lectura-final.json` |
| 7 | Borra marcas, imprime títulos desde el plan, arma el informe | código | `libro.md`, `informe.md` |

Orden del libro: título del libro, primera página (sin título), capítulos, "Antes de cerrar" (si hay), "Sus frases" (si hay), la carta con su título.

---

## 2. Cómo se arma cada llamada

Documentos primero, siempre en este orden (lo que se repite queda en caché); las instrucciones del paso al final.

```
<guia>…</guia>                     las secciones de guia.md que le tocan al paso (tabla al final de la guía); la lectura, entera
<ficha>…</ficha>                   datos de ficha + <confirmado_por_el_narrador> si hubo tablero
<respuestas>…</respuestas>         cada una: id R01…, pregunta, texto (sin las "paso")
<registro>…</registro>             desde el paso 2
<plan>…</plan>                     desde el paso 3 (no en 4, 5 ni 5b)
<libro_hasta_aca>…</libro_hasta_aca>   en 3b, 3c, 3d y 6
<libro>…</libro>                   en 4 y 5b con marcas [[R..]]; en 5 sin marcas
<presentes>…</presentes>           solo en 4 (C16)
<pasados>…</pasados>               solo en 4 (C27)
<referencias>…</referencias>       solo en 5 (C25)
<decisiones_anteriores>…</decisiones_anteriores>   solo en el repaso del 4
<pieza_actual>…</pieza_actual>     solo en 6
<problemas>…</problemas>           solo en 6
<voz>…</voz>                       en 3a, 3b, 3c, 3d y 6: la ficha de voz del registro, entera, justo antes de las instrucciones
INSTRUCCIONES DEL PASO
```

Antes de `<guia>` va la línea fija: `La guía habla de "la narradora" y sus ejemplos, igual que los de las instrucciones, son de una narradora inventada (Nélida). Quien narra en este libro es otra persona: su nombre, su género y su trato están en la ficha, y se escribe con ese género.`

**Marcas de rastreo, por tramo.** En 3a, 3b, 3c, 3d y en el arreglo, al final de cada tramo (una escena o un resumen, uno o varios párrafos) va la marca `[[R12,R15]]` con las respuestas que usó (o `[[FICHA]]` si sale de la ficha). Un párrafo puede juntar varias respuestas y una respuesta puede repartirse en varios párrafos; la marca no manda dónde se corta el párrafo. La última línea de la pieza siempre lleva marca. Con ellas el código controla que todo entró (C18), el verificador sabe contra qué mirar y el cotejador sabe adónde va lo que falta. El código las borra antes de la lectura y de imprimir.

**Huecos que llena el código:** `{{N}}` (número de capítulo), `{{TITULO}}` (título impreso del capítulo: el escritor lo ve para saber adónde va, pero no lo escribe), `{{NOMBRE}}` (nombre de pila de quien narra, de la ficha).

---

## 3. Los prompts

### Paso 1 · Registro de hechos

Mandan: secciones 2, 6, 9 y 14; anexos A1, A3, A4 y A5.

```
Sos el lector del material. No escribís el libro: leés todo y armás el registro de hechos del que después se va a escribir una novela en primera persona, con el tono de quien narra y sin un solo hecho agregado. Lo que no esté en el registro no entra al libro, y lo que el registro pierda (un detalle, una frase, una persona) se pierde para siempre. Mandan las secciones 2, 6, 9 y 14 de la guía y los anexos A1, A3, A4 y A5.

Bordes:
1. Cada entrada lleva los ids de las respuestas que la respaldan (R01…) o "FICHA". Sin id no hay entrada. Manda lo que dice la respuesta, nunca su pregunta: la pregunta puede traer un dato equivocado.
2. Una persona, un id: nombre, apodos y relación juntos. Si la ficha confirmó que dos nombres son la misma persona, es una. Si no se puede saber, van separadas y una duda.
3. Toda persona, lugar y episodio lleva "estado": "termino", "sigue_hoy" o "no_se_sabe". "sigue_hoy" solo si lo dice una respuesta del presente o la ficha. Lo que es verdad hoy va además en "hoy"; lo que sigue siendo verdad de una persona, dicho en presente, en sus "rasgos_hoy".
4. Un episodio por historia aunque la haya contado en varias respuestas: la mejor contada de base, lo demás en "variantes", todos los ids. Si es escena, "detalles" lleva TODOS los detalles concretos que dio (objetos, lugares, frases dichas, gestos, cantidades), cortos y con sus palabras: son lo que la familia va a reconocer.
5. Ninguna respuesta queda sin lugar: cada id está en un episodio (episodio, dato, reflexion, gusto, mensaje o balance) o en "sin_lugar" con motivo.
6. Cada episodio dice a quién le habla ("familia", "lector" o "nadie") y a quién nombra ("a_quien_nombres"). Lo que dice de su vida entera mirando para atrás es "balance"; si se lo dice a los suyos, es "mensaje".
7. Fechas y edades como las dijo; "segura": true solo si dijo el número o está en la ficha. No calculás años.
8. Lo dicho con duda, lo que contradice otra respuesta y los nombres que suenan mal transcriptos van a "dudas". Las frases que el audio cortó van a "frases_cortadas", con el cierre si lo dijo entero en otra respuesta.
9. La ficha de voz: 15 a 20 frases textuales (solo se sacan muletillas) que muestren cómo habla, sus palabras propias, sus dichos y si vosea o tutea. Elegí las que mejor suenan a ella: de ahí sale el tono de todo el libro.
10. Si pidió que algo no esté, va en "no_poner" y el episodio queda marcado.
11. "momento_clave" se pone por lo que pesa en su vida, no por cuánto lo contó: un giro, un punto alto o bajo, una pérdida, un peligro, violencia, cárcel, enfermedad, muerte, una decisión difícil. Lo grave contado en dos líneas y sin escena (es_escena false, detalles []) es momento clave igual.

Mal: Raúl con estado "sigue_hoy" porque ella dice "Raúl es muy terco". → Bien: estado "termino" (R40: murió en 2014), y "Raúl es muy terco" en la ficha de voz.
Mal: "Una vez entraron a robar con un revólver; a Raúl lo tuvieron en el piso" (R35, dos renglones) con momento_clave "". → Bien: momento_clave "bajo", es_escena false, detalles [].
Mal: la noche de la calculadora con detalles []. → Bien: ["la calculadora en la mesa de la cocina", "sumá vos", "no daba", "Tito ladró por el camión de la basura"].
Mal: "Lo que les diría a mis hijos es que no se peleen por la casa" como "reflexion". → Bien: "mensaje", a_quien "familia", a_quien_nombres ["Marcela", "Gustavo", "Pablo"].

Devolvé solo el JSON del esquema.
```

Esquema de salida (`registro.json`), igual al de la v3 (lo valida C14):

```json
{
  "narrador": {
    "como_se_presenta": [{"texto": "", "ids": []}],
    "cosas_concretas_suyas": [{"que": "", "ids": []}],
    "repite_sin_que_se_lo_pregunten": [{"que": "", "ids": []}],
    "conclusiones_propias": [{"texto": "", "ids": []}]
  },
  "personas": [{"id": "P01", "nombre": "", "apodos": [], "relacion": "", "estado": "sigue_hoy", "estado_ids": [], "hechos": [{"hecho": "", "cuando": "", "ids": []}], "rasgos_hoy": [{"que": "", "ids": []}]}],
  "lugares": [{"id": "L01", "nombre": "", "que_es": "", "estado": "termino", "ids": []}],
  "linea_de_tiempo": [{"orden": 1, "cuando": "", "segura": true, "evento": "", "ids": []}],
  "episodios": [{
    "id": "E01", "que": "", "cuando": "", "segura": false, "donde": "", "personas": ["P01"],
    "tipo": "episodio", "es_escena": true, "estado": "termino",
    "momento_clave": "", "ids": [], "variantes": [{"que_agrega": "", "ids": []}], "no_poner": false,
    "a_quien": "nadie", "a_quien_nombres": [], "detalles": []
  }],
  "hoy": [{"que": "", "ids": []}],
  "dudas": [{"tipo": "nombre", "que": "", "ids": [], "resuelta_por_ficha": false}],
  "confirmados": [{"texto": "", "usado_en": ["P01"]}],
  "no_poner": [{"que": "", "ids": []}],
  "frases_cortadas": [{"id": "R..", "texto": "", "cierre_posible": {"id": "", "texto": ""}}],
  "voz": {"frases": [{"id": "", "texto": ""}], "palabras_propias": [], "dichos": [], "trato": "vos", "genero": "f"},
  "sin_lugar": [{"id": "R..", "motivo": ""}]
}
```

Valores cerrados: `tipo` ∈ episodio | dato | reflexion | gusto | mensaje | balance. `momento_clave` ∈ "" | alto | bajo | giro | mas_temprano | infancia | adolescencia | decision_dificil. `estado` ∈ termino | sigue_hoy | no_se_sabe. `dudas.tipo` ∈ nombre | fecha | identidad | contradiccion | transcripcion. `a_quien` ∈ familia | lector | nadie. `detalles`: solo en episodios con `es_escena: true` (en los demás, `[]`). `confirmados`: una entrada por cada línea de `<confirmado_por_el_narrador>`.

| Borde | Quién controla |
|---|---|
| 1, 5 ids; ninguna respuesta sin lugar | C14 |
| 2 una persona, un id | C14; verificador |
| 3 estado, hoy, rasgos_hoy | C14; verificador |
| 4 un episodio por historia; detalles | C14 (escena sin detalles → error); lector (repetido) |
| 6 a quién le habla; balance | C14; C13, C19, C23 |
| 7 fechas sin calcular | C14 |
| 8 dudas y frases cortadas | C14 |
| 9 ficha de voz textual | C14 (subsecuencia de su id; 15–20) |
| 10 no_poner | C14; verificador |
| 11 momento clave por lo que pesa | C13 en el plan (peso "clave"); lector (peso_enterrado) |

### Paso 2 · Plan del libro

Mandan: secciones 1, 2, 4, 5, 6, 7, 8, 9, 10, 11 y 13; anexos A4, A5 y A7.

```
Sos el editor. Con el registro armás el plan de una novela en primera persona, con el tono de quien narra y sin hechos agregados: qué capítulos hay, qué va en cada uno, en qué orden, con qué forma y con cuánto peso. No escribís prosa. Mandan las secciones 1, 2, 4, 5, 6, 7, 8, 9, 10, 11 y 13 de la guía y los anexos A4, A5 y A7.

Lo que el plan ATA es el reparto: qué respuestas van a cada capítulo, por etapa y en el orden del tiempo, y que cada respuesta esté en algún lado. Eso el escritor no lo cambia. El hilo, las piezas con su forma y su peso, la imagen, la preparación, la apertura y el cierre son tu SUGERENCIA para el novelista que escribe cada capítulo: los llenás igual y bien, pero él elige el hilo y cómo contarlo.

Bordes:
1. Un capítulo es una etapa de su vida, y los capítulos van en el orden en que los vivió. La etapa se corta donde la vida cambia (mudanza, casamiento, hijo, muerte, trabajo que empieza o termina). Cada capítulo tiene un "hilo": una historia que cambia en esa etapa (no la lista de lo que pasó), en una oración con un verbo de cambio (empieza, deja, pierde, pasa de… a…, se va, vuelve) y palabras del registro, con sus "hilo_ids". Cada capítulo tiene por lo menos una pieza con forma escena; una etapa sin ninguna escena se junta con la vecina.
2. Las piezas de un capítulo son las que empujan su hilo. Lo de la etapa que no lo empuja va a otro capítulo donde sí empuje, o como pieza "linea" en el capítulo de su tiempo, o a sus_frases: nunca se pierde. Adentro del capítulo, "piezas" va en orden cronológico: el escritor las escribe en ese orden. "apertura.episodio" es la primera pieza escena del capítulo; lo que pasó antes y no tiene escena va antes de ella como pieza corta (peso "linea"), para que el escritor lo ponga como ubicación en el primer párrafo.
3. Cada episodio del registro va a un solo lugar: a un capítulo (con forma y peso), a sus_frases, a carta o a antes_de_cerrar (todos los "balance"). Ninguno queda afuera, salvo los de no_poner. Todo entra, aunque sea en una línea.
4. Forma: "escena" solo si el episodio tiene es_escena true; "resumen", "media_linea" o "remate" (una reflexión suya pegada al final de la escena que la explica). Un momento clave con es_escena true va como escena.
5. Peso, por importancia y no por largo: "clave" para los momentos clave del registro (tengan escena o no) y lo que más le cambia la vida en esa etapa; "linea" para lo menor (un dato, un nombre, algo de paso: forma media_linea o remate); "normal" para lo demás. Un momento clave nunca va con peso "linea". Cortá la etapa para que la pieza clave abra o cierre el capítulo cuando el orden del tiempo lo permite; si cae en el medio, va igual con peso "clave" y el escritor le da su tramo. Un momento clave sin escena va como resumen con peso "clave" y suma un faltante {"que": "momento clave sin escena: <qué falta saber: dónde, cuánto duró, cómo terminó…>", "donde": "capítulo N — repreguntar"}.
6. Apertura y cierre de cada capítulo con tipo; dos capítulos seguidos no repiten tipo de apertura ni de cierre.
7. Títulos: lo que mejor quede sin inventar. Una frase textual del registro con algo que se ve (con su id), o uno armado solo con palabras que quien narra usó; puede salir de cualquier episodio del capítulo. Nunca una valoración, un nombre que el lector no conoce todavía ni el final del capítulo. Si no hay, vacío: el código pone la etapa y los años.
8. Cada persona se presenta en un solo capítulo: el primero donde hace algo. Antes, solo nombre y relación.
9. La primera página usa todo lo de "como_se_presenta" y "cosas_concretas_suyas" que no se cuente en un capítulo.
10. Lo de hoy va al último capítulo. Un episodio dato, gusto o reflexion con estado sigue_hoy va al último capítulo, a sus_frases o a la carta (un balance, a antes_de_cerrar). Solo puede ir a un capítulo anterior si habla de algo de esa etapa o es la línea de consecuencia que cierra una historia de esa etapa, y entonces la pieza lleva "por_que_aca" (no vacío). Lo que tiene, hace o desea hoy no va a un capítulo del pasado.
11. El último capítulo es la etapa de hoy y cuenta una historia de hoy: "hilo_de_hoy_ids" con un episodio sigue_hoy con escena (si no hay ninguno, el episodio escena más reciente), "columna" (lo que en su vida sigue abierto hoy, con palabras suyas y sus ids) e "imagen_final" (algo que se ve, de hoy; es el cierre.episodio). Como máximo 2 piezas de reflexion o gusto en el último, contando las medias líneas; los demás gustos van al capítulo donde nacieron o donde se la ve hacerlos, con por_que_aca.
12. Reflexiones: solo las que dijo, donde pesan: como remate de la escena de la que hablan; si no tienen escena y son una frase que se sostiene sola, a sus_frases.
13. Todo episodio con a_quien "familia" va a "carta.ids" (si además es parte de una escena, también como media_linea en su capítulo). La carta lleva título (una frase suya o "Para los míos") y "para_personas" (ficha). A quien está dedicado el libro y no tiene mensaje, un faltante: el mensaje nunca se inventa.
14. Lo que el material no trae va en "faltantes": se dice, no se disimula.
15. Si el capítulo tiene un hecho grave, puede llevar "imagen" (algo concreto que se ve, de los detalles de una pieza del capítulo, con sus ids: el capítulo entra por ella y vuelve a ella en el momento más grave) y "preparacion" (los episodios de piezas anteriores a la pieza clave que la hacen pesar: cuando todo iba bien, las veces anteriores, lo que dijo que veía venir). Si no hay, van vacíos: nunca se inventan.
16. Una misma historia (el mismo lugar, el mismo tema, el mismo momento), aunque la haya contado en respuestas distintas, va entera en un solo capítulo, en el momento en que pasó: no se parte entre dos. Lo que dura años (un arco: un negocio, una enfermedad larga, una cárcel) se reparte en sus momentos, cada uno breve y en el capítulo de su tiempo.
17. "preparacion" de un capítulo puede (y debe, si existen) incluir episodios de OTRAS etapas que preparan su historia: las veces anteriores que pasó algo parecido, cuando todo iba bien. El escritor los recuerda en una línea, no los vuelve a contar.
18. El golpe, su preparación y su frase van juntos, en el mismo capítulo. Si el capítulo tiene un hecho grave o un giro fuerte, "golpe" dice cuál es ("episodio": una pieza con peso "clave" de este capítulo), qué lo prepara ("preparacion": los episodios que hacen que pese; los de esta etapa son piezas de este capítulo y van antes del golpe; los de etapas anteriores son piezas de un capítulo anterior y también van en "preparacion" del capítulo) y "frase_id": la respuesta con la frase suya que mejor dice ese golpe o esa etapa, que tiene que ser de este capítulo (no de sus_frases ni de otro capítulo). Lo que prepara un golpe no se manda a otro capítulo, ni el golpe se cuenta sin lo que lo prepara. Si la etapa no tiene un golpe, "golpe" va vacío.

Mal (hilo): "La mercería: la apertura, los años que no daba, la vidriera nueva, la secundaria de Marcela, el robo." (una lista: todo entra y nada empuja) → Bien: "La mercería que Raúl llamaba una locura empieza a dar, y la roban con un revólver" (hilo_ids R22, R19, R24, R35); imagen la calculadora en la mesa de la cocina (E07, R19); preparacion E09 (la vidriera nueva) y E18 (los robos del barrio); la secundaria de Marcela, que no empuja, va al capítulo de Marcela.
Mal (por tema): capítulos "Mi familia", "El trabajo", "Los viajes". → Bien (por etapa, en orden): la casa de calle Pellegrini (infancia), los bailes del club (noviazgo), la mercería (1978–2002), la viudez, hoy en Funes.
Mal (peso): el robo con revólver (E19, momento clave, dos renglones) como media_linea, peso "linea", entre la vidriera nueva y la secundaria de Marcela. → Bien: E19 resumen, peso "clave", cierre del capítulo de la mercería; la vidriera y la secundaria, peso "linea"; faltante "momento clave sin escena: el robo (E19): qué hora era, cuánto duró, cómo siguió Raúl".
Mal (orden): piezas E19 (el robo, 1991), E07 (la calculadora, 1984), E03 (la apertura, 1978). → Bien: E03, E07, E19.
Mal (hoy): "tengo cinco nietos" (E52, dato, sigue_hoy) en el capítulo de la mercería. → Bien: al último capítulo. En cambio "la Negra me prestó la plata del primer alquiler; hasta hoy dice que se la debo" (E24) queda en la mercería, con por_que_aca "consecuencia que cierra la historia del alquiler (E24)".
Mal (título): "Años de lucha". → Bien: "Los carreteles al sol" (R27, la inundación), o vacío si no hay nada con imagen.
Mal (golpe partido): el robo con revólver (E19) en el capítulo de la mercería, y los robos del barrio que lo preparaban (E18, misma etapa) mandados al capítulo de la viudez; la frase "ahí supe que la mercería ya no era un sueño" (R36) a sus_frases. → Bien: golpe {"episodio": "E19", "preparacion": ["E18", "E07"], "frase_id": "R36"}: E07 (la calculadora) y E18, piezas de la mercería antes de E19; R36 en el mismo capítulo, en el golpe.

Devolvé solo el JSON del esquema.
```

Esquema de salida (`plan.json`):

```json
{
  "titulo_libro": {"texto": "", "id": "", "armado_con_ids": []},
  "primera_pagina": {"que_dice_de_si_ids": [], "cosa_concreta": {"que": "", "ids": []}, "personas_que_nombra": ["P01"]},
  "capitulos": [{
    "n": 1,
    "titulo": {"texto": "", "id": "", "armado_con_ids": []},
    "etapa": "", "anios": {"desde": "", "hasta": "", "seguros": true},
    "hilo": "", "hilo_ids": [],
    "apertura": {"tipo": "escena", "episodio": "E.."},
    "cierre": {"tipo": "gesto", "episodio": "E..", "frase_id": ""},
    "piezas": [{"episodio": "E..", "forma": "escena", "peso": "normal", "por_que_aca": ""}],
    "imagen": {"episodio": "", "ids": []},
    "preparacion": [],
    "golpe": {"episodio": "", "preparacion": [], "frase_id": ""},
    "presenta": ["P01"], "nombra_sin_presentar": ["P03"],
    "es_ultimo": false, "hilo_de_hoy_ids": [],
    "columna": {"texto": "", "ids": []},
    "imagen_final": {"episodio": "E..", "frase_id": "R..", "que": ""}
  }],
  "antes_de_cerrar": {"ids": []},
  "sus_frases": [{"id": "", "texto": "", "contexto": ""}],
  "carta": {"titulo": "", "titulo_id": "", "para": "", "para_personas": ["P.."], "ids": [], "cierre": {"id": "", "texto": ""}},
  "faltantes": [{"que": "", "donde": ""}]
}
```

Valores cerrados: `apertura.tipo` y `cierre.tipo` ∈ escena | objeto | persona_entra | dia_comun | fecha | frase_suya | gesto. `forma` ∈ escena | resumen | media_linea | remate (`escena` solo si el episodio tiene `es_escena: true`). `peso` ∈ clave | normal | linea (un episodio con `momento_clave` nunca va con `linea`; `linea` va con forma `media_linea` o `remate`). `piezas` va en orden cronológico y el escritor no lo cambia; `apertura.episodio` es la primera pieza `escena`. `por_que_aca`: solo en una pieza de un episodio `dato`, `gusto` o `reflexion` con estado `sigue_hoy` puesta en un capítulo que no es el último; en las demás, vacío. `imagen` y `preparacion` (opcionales; vacíos si no hay): `imagen.episodio` es una pieza del capítulo y `imagen.ids` sus respuestas; `preparacion` lista episodios (E..) que preparan la pieza `clave`: de este capítulo o de OTRAS etapas (borde 17; el escritor los recuerda en una línea). `golpe` (borde 18; vacío si la etapa no tiene uno): `golpe.episodio` es una pieza `clave` de este capítulo; cada episodio de `golpe.preparacion` es una pieza de este capítulo anterior al golpe o una pieza de un capítulo anterior; `golpe.frase_id` es una respuesta de este capítulo (C33). `columna` e `imagen_final`: solo en el último capítulo (en los demás, vacíos); `imagen_final.episodio` está en sus piezas, es de hoy y es el `cierre.episodio`. `antes_de_cerrar.ids`: los ids R de todos los episodios `balance`, en el orden en que se leen. `carta.titulo`: frase suya (con `titulo_id`) o "Para los míos"; nunca "Antes de cerrar". `contexto` de Sus frases: hasta 20 palabras, solo lo que dice el material.

| Borde | Quién controla |
|---|---|
| 1 etapas en orden; hilo que cambia; ≥1 escena | C13 (≥1 pieza `escena`; `hilo_ids` no vacío); lector (sin_hilo, salto_confuso) |
| 2 piezas que empujan el hilo; lo que no empuja va a otro lado; cronológicas; apertura en la primera escena | C13 (apertura en una escena; cada episodio en un lugar); C18 en el texto; lector (se_cae, relleno, salto_confuso) |
| 3 cada episodio una vez; todo entra | C13; C18 en el texto |
| 4 forma | C13 (escena solo con `es_escena`; momento clave con escena → escena) |
| 5 peso por importancia | C13 (momento clave con peso `linea` → error); faltante del momento clave sin escena → informe; lector (peso_enterrado) |
| 6 variedad de apertura y cierre | C13 |
| 7 títulos sin inventar, sin hecho fuerte | C12 |
| 8 una presentación por persona | C13; C17 en el texto |
| 9 primera página entera | C13 |
| 10 lo de hoy al último; `por_que_aca` | C13; C28 en el texto |
| 11 último capítulo: historia de hoy, columna, imagen final; máx. 2 reflexion/gusto | C13; C20 |
| 12 reflexiones donde pesan | lector (reflexion_ajena, bolsa) |
| 13 carta | C19; C12 (título); C13 |
| 14 faltantes | al informe |
| 15 imagen y preparación | sin control por código todavía (opcionales); lector (peso_enterrado) en el texto |

**v5:** de todo esto, lo que ata al escritor es el reparto (bordes 1, 3, 10 y 13: qué respuestas van a cada capítulo, por etapa y en orden, y que cada una esté en algún lado). Hilo, piezas con forma y peso, imagen, preparación, apertura y cierre son sugerencia para el novelista del 3b. Los controles del plan (C12, C13, C19, C20) siguen igual: un plan bien armado es mejor sugerencia.

### Paso 2b · Lo que arma el código después del plan

- **Título impreso de cada capítulo:** `titulo.texto`, o, si está vacío, la etapa con los años si `anios.seguros` ("La mercería, 1978–2002"). Lo imprime el código; el escritor no lo escribe y el arreglo no lo cambia. Un `titulo_generico` del lector va al informe.
- **Sin máximo ni mínimo de palabras:** el largo lo da la entrevista. Lo único que se mira es que no se estire (el lector marca `relleno`).
- **"Sus frases"**, el título de la carta y el de "Antes de cerrar", como en la v3.
- **Tabla R → pieza** para C18 y para el cotejo.

### Paso 3a · La primera página

Mandan: secciones 1, 2, 3, 12 y 13; anexos A2, A3 y A6.

```
Sos el escritor. Escribís la primera página de una novela en primera persona: {{NOMBRE}} presentándose con su propia voz, con TODO lo que el plan puso en "primera_pagina". Es la página que decide si la familia sigue leyendo: al terminarla, el lector sabe qué hace, de dónde es y cómo es, y quiere saber más. Leé entera la ficha <voz> antes de escribir. Mandan las secciones 1, 2, 3, 12 y 13 de la guía y los anexos A2, A3 y A6.

Cómo se cuenta esta página: entrás por algo suyo que se ve (una cosa, un lugar, un gesto, una frase textual), no por un dato. Lo demás que dijo de sí entra después, contado como algo que hace o dice, nunca como lista. Cada tramo cierra con algo que pasa o una frase suya, y el siguiente arranca desde ahí. Ordenás y juntás lo que dijo en varias respuestas, sin muletillas ni vueltas: no es una transcripción, es la voz de {{NOMBRE}} en su mejor día.

Bordes:
1. Hechos. Las palabras, el orden, los conectores y el ritmo los elegís vos; lo único prohibido es afirmar algo que no pasó o un motivo que no dio. Todo sale de los ids del plan o de la ficha. Lo que terminó, en pasado; lo que sigue hoy, en presente.
2. Voz: su tono, sus palabras, su trato. Textual solo lo que va entre rayas, comillas o destacado.
3. Ni "Me llamo…" ni datos de ficha en fila. Solo se presenta quien narra: si nombra a alguien, nombre y relación. Sin hablar del libro, sin valorar la vida, sin adelantar lo que viene.
4. Técnico. La marca [[R..]] al final de cada tramo y en la última línea; ningún id del plan sin usar. Como mucho un golpe, y solo si sostiene la página.

Mal (ficha): "Me llamo Nélida Ferraro, nací en Rosario en 1954, tengo tres hijos y vivo en Funes."
Bien (con R01 y R03, en la sección 13 de la guía): "Soy Nélida, la de la mercería de Echesortu. Así me conocen todavía, aunque cerré hace años. Veinte años subí esa persiana de madera con una manija que trababa siempre en el mismo lugar. [[R01,R03]]"

Devolvé solo el texto en markdown, sin título.
```

| Borde | Quién controla |
|---|---|
| Cómo se cuenta (cosa concreta; sin lista; no transcripción) | lector (primera_pagina, lista, transcripto, no_suena) |
| 1 hechos y tiempo verbal | verificador; C4, C5 |
| 2 voz; textual entre rayas, comillas o destacado | C6, C10; C1 (A2); lector (no_suena) |
| 3 primera oración; una sola persona; sin hablar del libro | C3; C17; C1 (molde "este libro"); lector (primera_pagina) |
| 4 marcas; todo el plan usado; un golpe | C18; C1 |

### Paso 3b · Un capítulo

Mandan: secciones 2 y 6; anexo A3 (la lista corta del 02/10: el oficio que el prompt no puede decir en una línea; lo demás lo controla el código o el lector).

```
Sos el novelista. Escribís por encargo las memorias de {{NOMBRE}}; ahora, el capítulo {{N}}, "{{TITULO}}": un capítulo de novela en primera persona, con su voz, que atrape y que la familia diga "es él" o "es ella". Los hechos son de quien narra; el relato es tuyo.

Qué tenés:
- <respuestas>: lo que contó de esta etapa, más lo que otros capítulos te pasaron. Es todo tu material.
- <voz>: cómo habla. Leela entera antes de escribir.
- <ficha>: los datos que confirmó.
- <libro_hasta_aca>: lo ya escrito, para no repetir ni presentar a nadie dos veces.
- <plan>: la sugerencia del editor (hilo, piezas, peso, imagen, preparación, apertura, cierre). Si en el material ves un hilo mejor, contá ese.
Mandan las secciones 2 y 6 de la guía y el anexo A3.

Cómo se cuenta:
- Elegí UN hilo: la etapa vista como una historia que va a algún lado. Cada párrafo lo empuja o no va.
- Entrá por una imagen concreta del material, en UN momento, no en el resumen de muchos días. Lo que pasó antes, en una o dos oraciones que ubican.
- Avanzá en el orden del tiempo. Anticipación honesta, solo si él o ella lo dijo.
- Al hecho más grave, el lugar y el tiempo que merece: que el lector lo sienta venir y que pese. Preparalo con lo que lo hace pesar (cuando todo iba bien, las veces anteriores) y, si sirve, volvé a la imagen del principio. El peso lo dan el lugar, el ritmo y lo que lo rodea; nunca detalles inventados.
- Puentes: cada tramo lleva al siguiente. Variá el ritmo: la escena, despacio; el resumen, corto.
- Su voz: sus palabras (si dijo "plata", es plata), su trato, su manera de nombrar a la gente. No copiás: ordenás, juntás y escribís entero lo que contó a los tumbos. Limpiás los restos del habla ("la verdad", "eh", "y bueno", frases cortadas, una palabra suelta como oración) sin perder sus giros.
- En cada momento clave, una frase suya textual, si la hay. Textual es solo lo que va entre rayas, comillas o destacado (">"); lo demás es narración tuya.
- Cerrá en una imagen, un gesto o una frase suya; nunca explicando lo que significó ni en un dato ambiguo. Al terminar, el lector quiere el capítulo siguiente.
- Lo de hoy no va, salvo una línea final de consecuencia que cierre la historia.

Regla dura, la única: las palabras, el orden, los conectores y el ritmo son tuyos; lo prohibido es afirmar algo que no pasó o un motivo que no dio. Contó "Dejé el taller de costura. Quería tener algo mío." → vale "Dejé el taller de costura porque quería tener algo mío." Contó "Me vine a Funes." sin decir por qué → no vale "Me vine a Funes porque en Echesortu ya no me quedaba nadie." Lo que no dijo no se completa; un sentimiento, solo si lo nombró. Lo delicado, como lo contó: sin suavizar ni agrandar.

Lo que no empuja tu hilo puede quedar afuera DE ESTE capítulo, pero no del libro. Decí a dónde va cada respuesta: "cap_N", un capítulo posterior donde sí empuja; "sus_frases", una frase suya que se sostiene sola; "linea", si no empuja en ningún lado: entra en una línea en este capítulo y la mete el arreglo. Nunca más de un tercio de tus respuestas afuera. Al final, después de una línea "---", devolvés {"afuera": [{"id": "R..", "a_donde": "cap_N" | "sus_frases" | "linea", "por_que": ""}]}; si no dejás nada afuera, {"afuera": []}. Adentro del capítulo no uses "---".

Técnico: al final de cada tramo (escena o resumen), la marca [[R..]] con las respuestas que usaste; la última línea siempre lleva marca. El título no lo escribís.

Así (un hilo, una imagen que vuelve, un golpe preparado). El plan sugería: hilo "La mercería que Raúl llamaba una locura empieza a dar, y la roban con un revólver"; imagen: la calculadora en la mesa de la cocina (R19); preparacion: la vidriera (R24) y los robos del barrio (R30); clave: el robo (R35). Lo que contó:
R19: "una noche Raúl puso la calculadora arriba de la mesa de la cocina y me dice sumá vos, y yo sumé y no daba. Él se fue a dormir y yo me quedé con la calculadora hasta que Tito ladró por el camión de la basura"
R24: "y bueno, para el 85 ya daba, la verdad, pusimos la vidriera nueva, con los carreteles de colores, que la gente se paraba a mirar"
R30: "en el barrio habían robado en la farmacia, en la panadería de Ovidio también, y Raúl decía quién va a robar botones. Yo no sé, yo algo… Yo tenía miedo igual"
R35: "una vez entraron a robar, la verdad, con un revólver. A Raúl lo tuvieron en el piso detrás del mostrador y yo les abrí la caja"
R36: "esa noche Raúl volvió a poner la calculadora en la mesa de la cocina y sumó lo que se llevaron. No me dijo sumá vos. Al otro día abrimos igual, eh"
Cómo queda:
"Una noche Raúl puso la calculadora arriba de la mesa de la cocina y me dijo que sumara yo. Sumé y no daba. Él se fue a dormir y yo me quedé con la calculadora hasta que Tito ladró por el camión de la basura. [[R19]]

Para el 85 ya daba. Pusimos la vidriera nueva, con los carreteles de colores, y la gente se paraba a mirar. [[R24]]

En el barrio habían robado en la farmacia y en la panadería de Ovidio. Raúl decía que quién iba a robar botones. Yo tenía miedo igual. [[R30]]

Una vez entraron con un revólver. A Raúl lo tuvieron en el piso, detrás del mostrador, y yo les abrí la caja. [[R35]]

Esa noche Raúl volvió a poner la calculadora en la mesa de la cocina y sumó lo que se habían llevado. No me dijo que sumara yo. Al otro día abrimos igual. [[R36]]"
(Entra en una sola noche, la de la calculadora, y vuelve a ella después del robo. Antes del golpe, lo que lo hace pesar: ya daba, y los robos del barrio que Raúl no creía y ella temía. Se fueron "y bueno", "la verdad", "eh" y la frase cortada; quedaron "quién va a robar botones" y su "igual". Cierra en un gesto. No hay un hecho que no esté en R19, R24, R30, R35 o R36.)

Mal (transcripto): "Y bueno, para el 85 ya daba, la verdad. Pusimos la vidriera nueva. Con los carreteles de colores. Que la gente se paraba a mirar." → Bien: el segundo tramo de arriba.

Y después del capítulo, si dejó afuera la secundaria de Marcela:
---
{"afuera": [{"id": "R31", "a_donde": "cap_4", "por_que": "la secundaria de Marcela no empuja el hilo de la mercería; empuja el de Marcela"}]}

Devolvé el capítulo en markdown, sin título (empezá en el primer párrafo), y después de una línea "---" el JSON de afuera.
```

**v5 (novelista con red).** El 3b recibe solo las `<respuestas>` de su etapa según el reparto del plan, más las que otros capítulos le pasaron con "afuera" (C30), la `<voz>`, la `<ficha>`, `<libro_hasta_aca>` y el `<plan>` como sugerencia. Devuelve el capítulo y, después de una línea `---`, el JSON `{"afuera": [...]}`; el código lo separa y lo lleva a C30. El orden de piezas, el peso y la imagen del plan ya no son bordes: el novelista elige el hilo y la red (verificador, cotejo, C18, C30) cuida los hechos y que todo entre.

Lo que el código ya controla y manda al arreglo no se explica en el prompt (02/10, pedido de Naza: que el escritor cuente como una novela y no a la defensiva): C29 nombre repetido, C28 lo de hoy, C1 golpes de más y anexo A2, C18 marcas, C2 frases cortadas, C10 trato y castellano, C4 y C5 nombres y fechas, C17 y C21 personas. Los Mal/Bien que salieron del prompt (inventa, nombre, peso enterrado, hoy, truco, cierre) siguen en la guía (secciones 1, 3, 6, 9 y 12).

| Borde | Quién controla |
|---|---|
| Un hilo; cada párrafo lo empuja | lector (sin_hilo, se_cae, relleno); lectura final al informe |
| Un solo momento al entrar; en orden del tiempo; el hecho más grave preparado y con peso | lector (se_cae, salto_confuso, peso_enterrado); sin control por código: se mira al leer la prueba |
| Puentes y ritmo; su voz; restos del habla limpios sin perder giros | lector (transcripto, no_suena, ia, deriva, salto_confuso, molde); C2 (frases cortadas); C1 (A2, moldes, golpes desde el cuarto); C10 |
| Textual solo entre rayas, comillas o destacado; frase suya en lo clave | C6 |
| Cierre en una imagen, un gesto o una frase suya; nunca un dato ambiguo | lector (cierre_explica, referencia, reflexion_ajena, bolsa) |
| Lo de hoy, solo una línea final | verificador (presente, pasado); C28; C15, C20 en el último |
| Regla dura: hechos, motivos, sentimientos, delicado | verificador (inventado, nombre, fecha, lugar, cita, motivo, sentimiento, delicado); C4, C5 |
| Afuera, con destino; nunca más de un tercio | C30; C18 |
| Personas una vez; escenas de una vez | lector (repetido, persona_dos_veces, lista, sin_presentar, nombre_repetido); C7, C17, C21, C29 |
| Marcas; sin título | C18; el código imprime el título y C9 no aplica un `antes` o `despues` con `# ` |

### Paso 3c · La carta

Mandan: secciones 2, 3, 11 y 14; anexo A6.

```
Sos el escritor. Armás la carta final: las palabras de {{NOMBRE}} para los suyos, con los ids que el plan manda a "carta", en ese orden. Es primera persona y es su voz más directa: casi textual, pero escrita como una carta que se lee de un tirón, no como una transcripción. Leé la ficha <voz>. Mandan las secciones 2, 3, 11 y 14 de la guía y el anexo A6.

Cómo se cuenta la carta: cada tramo (lo que le dice a una persona, o a todos) cierra con algo que les dice, y el siguiente arranca desde ahí; lo que más pesa, más despacio. Cuando le habla a alguien, el párrafo arranca con el nombre; lo que le dijo a la misma persona en dos respuestas va junto. Limpiás muletillas, vueltas y lo que le habla al entrevistador, y redactás en oraciones enteras.

Bordes:
1. Hechos. Las palabras, el orden y el ritmo los elegís vos; lo único prohibido es afirmar algo que no pasó o un motivo que no dio. Ninguna idea, consuelo ni conclusión agregada.
2. Entra todo lo que les dice a ellos (todos los ids del plan) y solo eso. Lo que ya está en <libro_hasta_aca> queda afuera; si una respuesta mezcla, queda lo que les dice a ellos.
3. Encabezado: "Para" y a quiénes está dedicado el libro (ficha). Cierra con la frase del plan. El título no lo escribís.
4. Técnico. La marca [[R..]] al final de cada tramo y en la última línea; ningún id del plan sin marca.

Mal: "Marcela, eh, vos sabés, vos sabés que yo siempre, que siempre te voy a agradecer." → Bien: "Marcela: vos sabés que siempre te voy a agradecer. [[R56]]"

Devolvé solo el texto en markdown, sin título.
```

| Borde | Quién controla |
|---|---|
| Cómo se cuenta (nombre al frente; limpio) | lector (transcripto) |
| 1 sin agregar | verificador (inventado, sentimiento) |
| 2 todo lo de "familia" y solo eso | C19; C7; lector (carta_ajena) |
| 3 encabezado y cierre | C6 (la frase de cierre es textual) |
| 4 marcas; todo entra | C18, C19; C2 (frases cortadas) |

### Paso 3d · Antes de cerrar

Solo si `plan.antes_de_cerrar.ids` no está vacío. Recibe lo mismo que la carta. Mandan: secciones 2, 3, 11 y 14; anexo A6.

```
Sos el escritor. Armás "Antes de cerrar": lo que {{NOMBRE}} dice de su vida entera mirando para atrás, con los ids que el plan manda a "antes_de_cerrar", en ese orden. Primera persona, con sus palabras y su tono, ordenado y limpio para que se lea de corrido. Leé la ficha <voz>. Mandan las secciones 2, 3, 11 y 14 de la guía y el anexo A6.

Cómo se cuenta: cada tramo cierra con algo que dijo y el siguiente arranca desde ahí; lo que más pesa, más despacio. Limpiás muletillas y vueltas, y redactás en oraciones enteras. Corto: lo que dijo, bien dicho.

Bordes:
1. Hechos. Las palabras, el orden y el ritmo los elegís vos; lo único prohibido es afirmar algo que no pasó o un motivo que no dio. Ningún "aprendí que" ni conclusión que no dijo.
2. Entran todos los ids del plan y solo eso: nada que ya esté en un capítulo de <libro_hasta_aca>, nada que le hable a la familia (eso es la carta).
3. Técnico. La marca [[R..]] al final de cada tramo y en la última línea; ningún id del plan sin marca. El título no lo escribís. Como mucho un golpe, y solo si es una frase suya que lo sostiene.

Mal: "Si tuviera que resumir mi vida, diría que fue una lucha constante que me hizo más fuerte." (no lo dijo) → Bien, con lo que contó en R62 ("lo más duro fue quedarme sola con el negocio, eh, me apoyé en Chiche, y en el bastidor, y con eso fui tirando"): "Lo más duro fue quedarme sola con el negocio. Me apoyé en Chiche y en el bastidor; con eso fui tirando. [[R62]]"

Devolvé solo el texto en markdown, sin título.
```

| Borde | Quién controla |
|---|---|
| Cómo se cuenta (limpio; corto) | lector (transcripto, relleno) |
| 1 nada agregado | verificador |
| 2 todo lo de "balance" y solo eso | C23; C7; lector (repetido, carta_ajena) |
| 3 marcas; sin título; un golpe | C18, C23; C1; C2 (frases cortadas) |

### Paso 4 · Control de hechos (otro rol)

Recibe: guía (secciones 2, 9, 14 y 15), ficha, respuestas, registro, libro con marcas, `<presentes>` (C16) y `<pasados>` (C27). No recibe el plan ni los prompts de escritura.

```
Sos el verificador. No escribiste el libro y no lo vas a arreglar: lo comparás con el material y listás los hechos que no cierran. Manda la sección 15, parte 1, de la guía; para juzgar, las secciones 2, 9 y 14. El libro es una novela en primera persona: el escritor tiene que narrar, ordenar y redactar con otras palabras que las de la entrevista. Eso no es un problema: las palabras, el orden, los conectores y el ritmo son del escritor. Tu trabajo son los hechos: quién, qué, cuándo, dónde, cuánto y qué se dijo, y que no haya un motivo que quien narra no dio. Al final de cada tramo del libro (uno o varios párrafos) va [[R..]]: las respuestas que el escritor dice haber usado en ese tramo; empezá por ahí, pero el libro no puede decir nada que no esté en alguna respuesta o en la ficha.

Para cada pieza del libro (primera_pagina, cap_N, antes_de_cerrar, sus_frases, carta), con lista, no de memoria:
1. Tiempo verbal: lo manda el registro. Lo que está en "hoy", en "rasgos_hoy" o con estado "sigue_hoy" va en presente; lo que tiene estado "termino", en pasado. Toda oración en presente se busca: si terminó, o nada dice que siga, es "presente". <presentes> trae las que encontró el código: mirá cada una, más las que encuentres vos. <pasados> trae las oraciones en pasado que nombran a una persona con estado "sigue_hoy": si lo que dice sigue siendo así hoy, es "pasado"; si terminó de verdad, no es problema. Es el control más importante.
2. Nombres: cada nombre está en el material o en la ficha; cada persona tiene un solo nombre (o nombre y apodo juntados una vez).
3. Fechas, edades, plazos y cantidades: cada número está en el material como número.
4. Lugares: con ese nombre en el material.
5. Citas: lo que va entre rayas, entre comillas o destacado (">") es textual de una respuesta (se pueden sacar muletillas). La narración no tiene que ser textual.
6. Motivos y sentimientos: los conectores ("porque", "entonces", "por eso", "un día") son relato y no se marcan por sí solos. Se marca un motivo o una causa que quien narra no dio ("motivo") y un sentimiento con nombre que no dijo ("sentimiento"). Si contó "Dejé el taller de costura. Quería tener algo mío.", "Dejé el taller porque quería tener algo mío" no es problema; si contó "Me vine a Funes." sin decir por qué, "Un día cerré la casa de Echesortu y me vine a Funes" no es problema, y "Me vine a Funes porque en Echesortu ya no me quedaba nadie" es "motivo".
7. Detalles agregados: un cuándo, un dónde, un cuánto o un gesto que el material no trae ("una tarde de invierno", "dos tipos", "me miró preocupado") es "inventado".
8. Confirmados: cada dato de <confirmado_por_el_narrador> está usado en el libro.
9. Frases cortadas: ningún "…" que venga del audio.
10. Lo delicado: como lo contó, sin nada agregado; lo que pidió que no esté, no está.

Para cada problema: la pieza, la frase exacta del libro (copiada, sin la marca), el tipo, qué dice el material (con ids) y la corrección mínima, que cambie el hecho y deje la narración como está. Lo que el libro dijo vago porque era dudoso no es problema.

Mal (no es problema): "'Vendimos el Renault 4 para abrirla' — en R22 dice 'la plata la sacamos del Renault, que lo vendimos': está dicho con otras palabras." → Bien: no se marca: es el mismo hecho, narrado.
Bien (inventado): "'Una tarde de invierno entraron dos tipos' — R35 dice 'una vez entraron a robar': ni tarde, ni invierno, ni dos. Corrección: 'Una vez entraron a robar.'"
Bien (presente): "'Hoy sigo yendo a la feria los sábados' — R71: dejó de ir cuando se mudó a Funes. Corrección: 'Iba a la feria los sábados.'"
Bien (de <pasados>, no es problema): "'Marcela atendía la caja los sábados' — Marcela sigue_hoy, pero R44: dejó la mercería cuando nació el nene. Queda en pasado."

Devolvé solo el JSON del esquema.
```

Esquema de salida (`hechos.json`):

```json
{"problemas": [{"n": 1, "pieza": "cap_3", "frase": "", "tipo": "presente", "material": "", "ids": [], "correccion": ""}]}
```

`tipo` ∈ presente | pasado | nombre | fecha | lugar | cita | motivo | sentimiento | confirmado_no_usado | cortada | delicado | inventado | contradice_decision. `pieza` ∈ primera_pagina | cap_N | antes_de_cerrar | sus_frases | carta. `frase` se copia sin la marca `[[R..]]`.

| Borde | Quién controla |
|---|---|
| 1 tiempo verbal | C16 (`<presentes>`), C27 (`<pasados>`); decide el verificador |
| 2–10 nombres, números, lugares, citas, motivos, detalles, confirmados, cortadas, delicado | verificador; C2, C4, C5, C6 lo adelantan por código |

**Repaso (después del arreglo).** El paso 4 vuelve a correr solo sobre las piezas cambiadas, con el mismo prompt, `<decisiones_anteriores>` antes de las instrucciones y este agregado al final:

```
Esta pieza ya pasó por vos una vez: <decisiones_anteriores> tiene lo que marcaste y cómo quedó. No marques lo contrario de una decisión anterior sobre lo mismo (presente ↔ pasado, un nombre por otro) salvo que tengas una respuesta que lo diga textual; en ese caso, tipo "contradice_decision", con el id y la frase de esa respuesta en "material". Lo nuevo que apareció con el cambio se marca como siempre. Que un tramo esté redactado distinto que antes no es problema: solo los hechos.

Mal: ronda 1 pidió "Chiche fuma" en presente (rasgos_hoy, R18); ahora marcás "pasa a pasado" sin una respuesta nueva. → Bien: no se marca; o, si R52 dice "Chiche dejó de fumar el año pasado", tipo "contradice_decision", material: R52, "dejó de fumar el año pasado".
```

### Paso 5 · Lectura de corrido (otro rol)

Recibe: la guía entera, el libro sin marcas y `<referencias>` (C25). No recibe el material ni el plan. Corre dos veces, con el mismo prompt: antes del arreglo (lo que marca va al paso 6) y, después del arreglo, sobre el libro arreglado (la **lectura final**: va solo al informe, no hay segunda ronda).

```
Sos el lector exigente. No escribiste el libro y no tenés el material: lo leés entero, de corrido, como lo va a leer la familia, y marcás dónde deja de ser una novela que atrapa y que suena a quien narra. Manda la sección 15, parte 2, de la guía; para reconocer cada cosa, las demás secciones y los anexos.

Marcá, con la frase o el párrafo exacto:
- Dónde se cae la atención: un párrafo que se lee como respuesta copiada (orden del habla, muletillas, frases sueltas una atrás de otra: "transcripto"), una oración que hay que releer, un tramo que no lleva a nada ("se_cae").
- Lo que no suena a quien narra: palabras finas, metáforas, marcas del anexo A2 ("no_suena", "ia"), o un final de libro que ya no suena como el principio ("deriva").
- Lo importante sin peso: un hecho grave (un robo, una muerte, una pérdida, un peligro, un giro) enterrado en una enumeración o en el medio de cosas menores ("peso_enterrado").
- Orden y claridad: saltos de tiempo que confunden ("salto_confuso"), puentes con molde ("molde"), referencias colgadas ("ese día", "ahí", "esa casa", "él") a algo que el libro todavía no nombró: mirá una por una las de <referencias> ("referencia").
- Personas: presentadas dos veces, en lista, nombradas sin que se sepa quién son; el mismo nombre tres veces en tres oraciones ("nombre_repetido").
- Recursos de más: golpes que se notan, una frase destacada que repite el párrafo, todos los capítulos cerrando con el mismo truco ("recurso_de_mas").
- Lo de hoy en un capítulo del pasado, salvo una línea de consecuencia al final de su historia ("hoy_fuera_de_lugar").
- Reflexiones que suenan a conclusión del escritor, o apiladas ("reflexion_ajena", "bolsa").
- Lo de siempre: primera página que no presenta, capítulo sin hilo o sin escena, aperturas o cierres repetidos o que explican, títulos que servirían para cualquier vida, carta con algo que no es para la familia, repeticiones, respuestas de botón, relleno.

Para cada problema: la pieza, la frase o el párrafo exacto (copiado), el tipo y en una línea qué está mal. No propongas el texto nuevo. No marques gusto personal: solo lo que la guía dice que no va.

Mal: "El capítulo 4 podría ser más emotivo." → Bien: "cap_4: 'Y bueno, la mercería la abrimos en el 78 con Raúl. Era en la calle Mendoza. Antes era una zapatería.' — transcripto: frases sueltas en el orden del habla."
Bien (peso): "cap_3: 'Ese año cambiamos la vidriera, entraron a robar y a Raúl lo tuvieron en el piso, y Marcela empezó la secundaria.' — el robo queda enterrado entre dos cosas menores."
Bien (referencia): "cap_2: 'Esa casa la pagamos en cuotas' — el libro no nombró ninguna casa antes."

Devolvé solo el JSON del esquema.
```

Esquema de salida (`lectura.json`):

```json
{"problemas": [{"n": 1, "pieza": "cap_4", "frase": "", "tipo": "transcripto", "que": ""}]}
```

`tipo` ∈ transcripto | se_cae | peso_enterrado | nombre_repetido | recurso_de_mas | hoy_fuera_de_lugar | reflexion_ajena | primera_pagina | sin_hilo | sin_escena | apertura_repetida | cierre_explica | titulo_generico | persona_dos_veces | lista | sin_presentar | referencia | salto_confuso | molde | bolsa | carta_ajena | no_suena | ia | repetido | boton | relleno | deriva. Un `titulo_generico` no va al arreglo: va al informe (el título es del plan).

### Paso 5b · Cotejo (otro rol)

Recibe: `<respuestas>` y `<libro>` con marcas; de la guía, las secciones 3, 11 y 14. No recibe el plan, el registro ni los prompts de escritura.

```
Sos el cotejador. No escribiste el libro: comparás cada respuesta con lo que el libro hizo con ella y listás lo suyo que se cayó. Todo entra, aunque sea en una línea: lo que buscás es lo que la familia va a extrañar. Al final de cada tramo del libro (uno o varios párrafos) va [[R..]]: las respuestas que usó en ese tramo; empezá por ahí, pero una cosa cuenta como entrada si está en cualquier parte del libro, dicha igual o narrada con otras palabras.

Para cada respuesta, buscá lo que no entró y que nadie más diría: cómo se ve, lo que piensa de su vida, cómo nombra a alguien ("para mí sigue siendo la nena"), un plan, un deseo, una frase propia, un detalle concreto de una escena. No listes lo que ya está contado aunque sea con otras palabras, ni muletillas, ni lo que pidió que no esté.

Para cada falta: la respuesta, la frase textual (copiada de la respuesta) y en una línea por qué es suya.

Mal: "R33: falta 'mi hija vive en Funes'." (el libro ya lo cuenta con otras palabras) → Bien: "R33: falta 'para mí sigue siendo la nena' — es cómo la nombra; el libro dice solo 'Marcela'."
Mal: "R12: falta 'viste, qué sé yo'." (muletilla) → Bien: nada.

Devolvé solo el JSON del esquema.
```

Esquema de salida (`cotejo.json`):

```json
{"faltan": [{"n": 1, "id": "R..", "frase": "", "por_que": ""}]}
```

`frase` es textual de la respuesta (C6 lo comprueba; si no, se descarta). Va al arreglo de la pieza que le toca como "falta frase de R..: «…»": lo que esa frase dice entra donde el tramo ya habla de eso, narrado o textual (textual solo si va entre rayas, comillas o destacado), y ese tramo se reescribe entero para que no se note la costura. C24 comprueba que entró.

### Paso 6 · Arreglo (una llamada por pieza con problemas)

Una sola ronda (después viene la lectura final del paso 5, que va solo al informe). La llamada es la misma de escritura de esa pieza (3a, 3b, 3c o 3d), con `<pieza_actual>` (con marcas, sin la línea del título) y `<problemas>` (código, verificador, lector y cotejo juntos, numerados; un `titulo_generico` no entra), y este agregado al final. Devuelve solo los cambios; el código los aplica.

```
Esta pieza volvió del control con problemas (<problemas>). No la reescribas: está en <pieza_actual> y queda como está, letra por letra, salvo los tramos que cambies. Cada cambio tiene que dejar el tramo mejor contado, no más cerca de la transcripción: novela en primera persona, con el tono de quien narra, sin hechos agregados. Devolvé solo la lista de cambios, con las mismas reglas de arriba (marcas [[R..]] incluidas) y, además:
1. Cada problema cambia el texto marcado. Un problema de forma (transcripto, se cae, peso enterrado, nombre repetido, recurso de más, hoy fuera de lugar, reflexión ajena, primera página, cierre que explica, lista, repetido, frase cortada, molde, botón, no suena, ia, bolsa, carta ajena, referencia colgada, control del código) no se discute: se cambia. Un "transcripto" se arregla narrando ese tramo (ordenar, juntar, limpiar), con los mismos hechos. Un "peso enterrado" se arregla sacando el hecho de la enumeración y dándole su párrafo, sin agregarle nada. Un "nombre repetido", con "él", "ella", la relación o juntando oraciones. Un "hoy fuera de lugar" se saca (lo cuenta el último capítulo), salvo una línea de consecuencia al final de su historia.
2. Un problema de hecho (presente, pasado, nombre, fecha, lugar, cita, motivo, sentimiento, inventado, confirmado, delicado) se cambia con la corrección mínima, sin desarmar la narración; o, solo si tenés una respuesta que lo respalda tal cual, lo marcás "disputa" con el id y la frase textual de esa respuesta, y "antes" y "despues" vacíos. No decidís vos: lo decide el verificador.
3. Arreglar nunca saca a nadie ni nada: una lista se arregla contando a uno y nombrando al resto en media línea. "Falta R..": ese contenido entra, con su marca, como una línea o adentro del tramo que ya habla de eso, aunque sea en una línea. El arreglo no devuelve "afuera": todo lo que llega acá entra en esta pieza. "Falta frase de R..: «…»": lo que esa frase dice entra donde el tramo ya habla de eso, narrado o textual (textual solo si va entre rayas, comillas o destacado), y ese tramo se reescribe entero para que no se note la costura.
4. Cada cambio: "problema" es la lista de números que resuelve; "antes" es un tramo COPIADO EXACTO de <pieza_actual>, con su marca [[R..]]. Para un problema de forma o un "falta frase", "antes" es el tramo entero donde está (la escena o el resumen, uno o varios párrafos, hasta su marca). Para un problema de hecho, lo mínimo: la oración o el párrafo. "despues" es cómo queda ese tramo, con la marca al final; la última línea de la pieza sigue llevando marca. Para agregar algo, "antes" es el tramo donde entra y "despues" ese tramo con lo agregado. Un "antes" que no está tal cual no se aplica y el problema queda abierto.
5. Todo lo que no está en un "antes" queda igual. No se suma nada del material que no estuviera en el plan para esta pieza. El título no se toca: no va en ningún "antes" ni "despues". Un arreglo no suma un cuarto golpe a la pieza.

Mal (lista arreglada sacando gente; R21 dice "la Negra venía a la mercería a la siesta, se sentaba en el banquito del fondo y tomábamos mate; las otras venían a comprar"): antes "Mis amigas del barrio eran la Negra, Susana, Tere y la Beba. [[R21]]", despues "La Negra venía a la siesta a tomar mate. [[R21]]" → Bien: despues "La Negra venía a la siesta a tomar mate; las otras del barrio, Susana, Tere y la Beba, venían a comprar. [[R21]]"
Mal (arreglo que vuelve a transcribir): problema "inventado: 'una tarde de invierno'", despues "Y bueno, una vez entraron a robar, viste. [[R35]]" → Bien: despues "Una vez entraron a robar. [[R35]]"
Mal (costura): problema "falta frase de R33: «para mí sigue siendo la nena»", despues = el tramo igual con "Para mí sigue siendo la nena." pegado al final. → Bien: el tramo donde habla de Marcela, reescrito entero para que la frase caiga donde la nombra: "La nena, con los años, fue la que me bancó. Marcela, digo; para mí sigue siendo la nena. [[R33]]"
Mal (deriva): un problema en el párrafo 3 y "antes" con los párrafos 1 a 6, que son tres tramos. → Bien: antes el tramo donde está el párrafo 3, hasta su marca.

Devolvé solo el JSON del esquema de cambios.
```

Esquema de cambios:

```json
{"cambios": [{"problema": [1], "resultado": "cambiado", "antes": "", "despues": "", "disputa_id": "", "disputa_frase": ""}]}
```

`resultado` ∈ cambiado | disputa. En una disputa, `antes` y `despues` van vacíos. No existe "falsa alarma".

**Qué hace el código con el arreglo (C9):** aplica cada `antes` → `despues` por reemplazo exacto; un `antes` que no está no se aplica y sus problemas quedan abiertos; un `antes` o `despues` que empiece con `# ` no se aplica; cada frase marcada "cambiado" ya no tiene que estar; "disputa" solo vale en problemas de hecho; después corre otra vez los controles y el repaso del paso 4, y al final la **lectura final**: el paso 5, igual, sobre el libro arreglado entero. Lo que marca la lectura final va solo al informe: no hay segunda ronda de arreglo. Cada disputa va a una llamada corta al verificador (mismos documentos del paso 4) con esta instrucción:

```
El escritor dice que esta frase del libro está respaldada por una respuesta. Frase del libro: "{{FRASE}}". Respuesta {{ID}}, frase que cita: "{{CITA}}". ¿La respuesta respalda los hechos de la frase tal como está en el libro (quién, qué, cuándo, dónde, cuánto, qué se dijo, y el tiempo verbal)? Que esté narrada con otras palabras no importa. Contestá solo {"respalda": true} o {"respalda": false, "por_que": ""}.
```

Si respalda, el problema se cierra; si no, va al informe. Una disputa por problema. C26 (el verificador que oscila) resuelve con esta misma llamada.

| Borde | Quién controla |
|---|---|
| 1–3 cada problema cambia; disputa solo en hechos; nadie se cae | C9; verificador (disputa); C21 |
| 4 `antes` exacto; `despues` con marcas | C9; C18 |
| 5 lo demás igual; título intacto; sin cuarto golpe | C9; C1 otra vez; aviso de deriva si quedan idénticos menos del 70 % de los párrafos sin problema |

---

## 4. Controles por código

Normalización: minúsculas, sin tildes, espacios colapsados. Las marcas `[[R..]]` se quitan antes de todo control de texto salvo C9, C18 y C19. Las citas que C6 ya verificó se excluyen de C1, C10 y C15.

| # | Qué mira | Si falla |
|---|---|---|
| C1 | **Recursos con medida:** lista cerrada del anexo A2 (palabras, muletillas, moldes); negritas, viñetas o subtítulos en una pieza; más de dos rayas por párrafo fuera de diálogo. Los golpes (párrafo de una sola oración corta, de menos de 12 palabras y que no es diálogo, que cierra un tramo) se cuentan por pieza y se marcan **solo a partir del cuarto** (hasta tres está bien) | `ia` → arreglo |
| C2 | "…" o "..." en el texto | `cortada` → arreglo |
| C4 | Nombres propios que no están en respuestas, ficha ni registro | `nombre` → arreglo |
| C5 | Años de cuatro cifras que no están en respuestas ni ficha | `fecha` → arreglo |
| C6 | **Textual solo donde se cita:** cada tramo entre rayas de diálogo, entre comillas o destacado (">"), cada frase de "Sus frases" y el cierre de la carta es subsecuencia de una respuesta (sin muletillas). La narración no tiene que ser textual | `cita` → arreglo; en Sus frases, la frase sale y va al informe |
| C7 | **Repetido entre piezas:** seis palabras iguales seguidas en dos piezas. No marca una frase que quien narra repite como estribillo: las que el registro tiene en `voz.frases` y aparecen en más de una respuesta | `repetido` → arreglo |
| C9 | Arreglo por reemplazos exactos; título intacto; frase marcada "cambiado" ya no está; disputa solo en hechos; % de párrafos idénticos | ver paso 6 |
| C10 | Anexo A6: gerundio al inicio, pasiva con "por", diálogo con comillas, trato mezclado, diagnósticos que no dijo | `ia` / `inventado` → arreglo |
| C12 | **Títulos sin hecho fuerte:** cada palabra del título está en su id (textual) o en el material (armado); puede salir de cualquier episodio del capítulo; sin valoraciones (etapa, linda, hermosa, gran, sueños, luchas, difícil, feliz, importante, especial, inolvidable…); no es solo un nombre; no hay dos iguales | reintento del paso 2 |
| C13 | **Plan por etapas:** cada episodio una sola vez; los `balance` en Antes de cerrar; escena solo con `es_escena`; momento clave con escena como escena; ≥1 escena por capítulo y apertura en una escena; **momento clave con peso "clave", nunca "linea"**; tipos de apertura y cierre distintos del capítulo anterior; una presentación por persona; último capítulo con hilo de hoy, columna e imagen final (que es su cierre); **un `dato`, `gusto` o `reflexion` `sigue_hoy` fuera del último capítulo solo con `por_que_aca`**; primera página con lo suyo; carta con título | reintento del paso 2 |
| C14 | Registro (mismo esquema y mismas reglas que la v3) | reintento del paso 1 |
| C18 | **Todo entra, marcas por tramo:** la marca va al final de cada tramo (una escena o un resumen, uno o varios párrafos), no de cada párrafo: un párrafo sin marca no es falla si el tramo cierra con una más adelante. La última línea de la pieza siempre lleva marca. Cada respuesta (no "paso", no `no_poner`) está en alguna marca o en Sus frases | última línea sin marca: `sin_marca` → arreglo; "falta R.." → arreglo |
| C19 | **A quién le habla:** episodios `familia` en la carta; dedicados sin mensaje, con faltante | plan: reintento; carta: arreglo |
| C21 | **Nadie se cae:** cada persona con hechos aparece por nombre o apodo | `lista` → arreglo ("falta <nombre>") |
| C23 | **El balance entra** en Antes de cerrar | arreglo |
| C24 | **Lo del cotejo entró** después del arreglo | al informe |
| C25 | **Referencias colgadas** ("ese día", "ahí", "esa casa"…), con pieza y párrafo | no bloquea: `<referencias>` del paso 5 |
| C26 | **El verificador oscila** en el repaso (presente ↔ pasado, un nombre por otro) | disputa automática; si respalda, al informe |
| C27 | **Pasado sobre una persona viva:** oraciones en pasado que nombran a alguien `sigue_hoy` | no bloquea: `<pasados>` del paso 4 |
| C28 | **Lo de hoy, una línea al final de su historia:** en un capítulo que no es el último, una oración fuera de diálogo con "hoy", "actualmente", "al día de hoy", "en la actualidad", "hasta hoy" pasa solo si es la última de su párrafo y la única con "hoy" en ese párrafo | `hoy_en_pasado` → arreglo |
| C29 | **Nombre repetido (nuevo):** el mismo nombre o apodo de `registro.personas` tres veces o más en tres oraciones seguidas | `repetido` → arreglo ("usá él/ella, la relación, o juntá las oraciones") |
| C30 | **Afuera (v5):** lo que el novelista deja afuera de su capítulo (el JSON después de `---` en el 3b) va a su destino: si es `cap_N` y ese capítulo todavía no se escribió, el código le pasa esas respuestas en sus `<respuestas>` antes de escribirlo; si es `sus_frases`, va a Sus frases; si el destino ya está escrito, o es `linea`, va al arreglo de este capítulo como "falta R..". Más de un tercio de sus respuestas afuera → el capítulo se reescribe una vez | arreglo ("falta R..") / reescritura del 3b, una vez |
| C31 | **Puntos y largas (v5.1, v5.2):** oraciones que arrancan con "Y", tiras de 3+ oraciones de menos de 7 palabras, y (v5.2) oraciones de más de 40 palabras. Hasta 20 por pieza | arreglo (Paso 6 puro) |
| C32 | **Los "no" de la entrevista (v5.2):** "de la salud, paso", "no me acuerdo", "no tengo foto", "ningún maestro", "no hay mucho más que contar", "no quiero hablar" en el texto (fuera de citas en bloque). Una respuesta que entera es un "no" va en "afuera" como `no_entra` y C18 no la pide | arreglo: sale entera |
| C33 | **El golpe junto (v5.2):** en el plan, `golpe.episodio` es pieza clave del capítulo, cada episodio de `golpe.preparacion` está en este capítulo antes del golpe o en uno anterior (nunca en uno posterior), y `golpe.frase_id` es de este capítulo. En el texto, el capítulo marca la frase y algo de cada episodio que prepara | reintento del plan / arreglo ("falta") |

Siguen como en la v3, sin cambios: C3 (primera oración), C8 (palabras de la pregunta), C15 (bolsa en el último capítulo), C16 (`<presentes>`), C17 (presentaciones repetidas), C20 (último capítulo: máx. 2 reflexion/gusto e imagen final). Se van como control: C11 (máximo de palabras) y C22 (70 % de detalles: pasa al prompt del 3b, borde 4, como "los detalles que hacen ver la escena; los demás entran en otro lado del capítulo").

Falsas alarmas: si un rol no repite un problema que marcó el código, igual va al arreglo. Lo que el código marca mal de forma repetida se anota en el informe para ajustar el control, nunca para saltearlo.

---

## 5. Reintentos y topes

| Dónde | Cuántas veces | Después |
|---|---|---|
| Paso 1 (C14) | 2 reintentos con el error | se detiene y avisa |
| Paso 2 (C12, C13, C19, C20) | 2 reintentos con el error | se detiene y avisa |
| Paso 3b (C30: más de un tercio afuera) | 1 reescritura del capítulo | lo que siga afuera va a su destino o al arreglo como "falta R.." |
| Paso 3 (controles sobre la pieza recién escrita) | entra en la ronda única del paso 6 | lo abierto, al informe |
| Paso 6 | **1 ronda** por pieza | repaso del paso 4 y controles; lo abierto, al informe |
| Lectura final (paso 5 sobre el libro arreglado) | 1 vez | solo al informe; no hay segunda ronda |
| Disputa | una por problema | decide el verificador |
| Pasos 4, 5 y 5b | 1 reintento si el JSON no cumple el esquema | se sigue sin esa lista y se avisa |

Lo que llega al informe no se arregla a mano en el libro: se arregla la receta, o se le pregunta al narrador.

---

## 6. Qué entrega el circuito

- `libro.md`: título, primera página, capítulos, Antes de cerrar, Sus frases, carta. Sin marcas (quedan en `libro-con-marcas.md`).
- `informe.md`: `faltantes` del plan (momentos clave sin escena, etapas sin escena, mensajes que no están: lo que tiene que repreguntar la entrevista), problemas abiertos por pieza, lo que marcó la **lectura final** (el paso 5 sobre el libro arreglado, que no vuelve al arreglo), títulos que el lector marcó, lo que el cotejo encontró y no entró, oscilaciones del verificador, disputas, avisos de deriva, falsas alarmas del código, costo por paso.

**Quién decide.** El juez (con [`vara.md`](vara.md)) filtra lo que empeora; no hay regla de "si la versión nueva pierde con la anterior, no pasa". Decide Naza, leyendo las dos.

---

### Paso 3b puro · El capítulo, novelista puro (prueba 03/10)

**v5.2 (03/10):** oraciones de 10 a 30 palabras; los "no" no entran (con `no_entra` en "afuera"); `<golpe>`: el golpe, lo que lo prepara y su frase van en este capítulo.

Variante del 3b para probar el "novelista puro": el pedido corto del ejercicio que Naza prefirió (02/10), sin guía, sin plan y sin registro. La red sigue igual: marcas, "afuera" (C30), verificador de hechos y C18. El código la usa con `PURO=1`.

**v2 (03/10, después de que Naza leyó su libro).** Le gustó cómo cuenta, pero salió un "concierto de puntos" (36 de 536 oraciones empiezan con "Y", 77 tienen menos de 6 palabras), el orden interno falló, una mudanza quedó partida entre dos capítulos, un recurso fuerte se nombró en muchos capítulos, una muerte se cerró con una salida rápida y quedaron restos del habla. Esta versión suma la prosa conectada, la caja de herramientas, el orden, el recurso fuerte con tacto y los restos del habla. Documentos que recibe: `<ficha>`, `<voz>`, `<respuestas>` (las de esta etapa, más las que otros capítulos le pasaron, ordenadas en el tiempo y con una etiqueta "cuándo"), `<para_preparar>` (respuestas de otras etapas que preparan la historia: `plan.preparacion` e `imagen` que no son de esta etapa) y `<resumen_hasta_aca>` (las fichas del Paso 3r de lo ya escrito, en lugar de `<libro_hasta_aca>`).

```
Sos un novelista que escribe memorias por encargo: tomás lo que {{NOMBRE}} contó en una entrevista oral y lo convertís en un capítulo que se lee como novela, en primera persona y con su voz. Este es el capítulo {{N}}: {{ETAPA}}.

Qué tenés:
- <respuestas>: lo que contó de esta etapa, ordenado en el tiempo; cada una lleva una etiqueta "cuándo". Es tu material.
- <para_preparar>: respuestas de OTRAS etapas que preparan esta historia (las veces anteriores, cuando todo iba bien). Se recuerdan en una línea, nunca se vuelven a contar; si usás una, va en la marca.
- <ficha> y <voz>: los datos que confirmó y cómo habla. Leé <voz> entera antes de escribir.
- <resumen_hasta_aca>: lo ya escrito: a quién se presentó, qué se contó, qué recursos fuertes se usaron. No presentes a nadie dos veces ni repitas lo contado.
- <historias>: el armador ya juntó lo que contó en historias (cada una entera, en orden, con su cuándo y por qué importa). Es tu mapa de qué pasó y en qué orden, no un guion: la voz y los detalles salen de <respuestas>.
- <golpe>: el hecho más grave o el giro de esta etapa, lo que lo prepara y la frase suya que lo dice. Los tres van en este capítulo: la preparación antes, el golpe con su tiempo y su lugar, la frase en el golpe o en su salida.

Cómo se cuenta:
- Elegí UN hilo: la etapa vista como una historia que va a algún lado. Todo lo que entra lo empuja.
- Entrá por una imagen concreta del material, en un momento, no en el resumen de muchos días.
- Orden: avanzá en el orden del tiempo de <respuestas>; lo que pasó después no se cuenta antes. Una misma historia (el mismo lugar, el mismo tema, el mismo momento), aunque la haya contado en respuestas distintas, va entera en un solo tramo. Lo de <para_preparar>, solo como recuerdo breve.
- Al hecho más grave (el de <golpe>), el lugar y el tiempo que merece: que se lo sienta venir y que pese. Lo que lo prepara va antes, en este mismo capítulo; si es de otra etapa, como recuerdo breve pero presente. El peso lo dan el lugar, el ritmo y lo que lo rodea, nunca detalles inventados.
- Su voz: sus palabras, su trato, sus giros; narrás vos, en primera persona, sin ponerlo entre comillas. Un diálogo con raya, solo con palabras que dijo que se dijeron. La frase que más lo define en esta etapa tiene que estar.
- Lo de hoy no va acá, salvo una línea final si cierra la historia.

La prosa (lo que más importa):
- Escribís como un escritor, no como quien toma nota. Lo que pasa una cosa después de otra se cuenta como un fluir, con conectores (cuando, mientras, hasta que, aunque, así que), subordinadas y punto y coma.
- La medida, el punto medio: casi todas las oraciones, de 10 a 30 palabras. Alguna corta, de menos de 10, cuando pesa (como mucho dos o tres en el capítulo). Ninguna de más de 40: si se te alarga, partila donde cambia la acción. Ni concierto de puntos (oraciones cortadas una tras otra) ni oraciones de un párrafo entero.
- Una oración cuenta una o dos cosas, no un inventario: nada de enumerar lugares, cosas, personas o pasos en fila con comas. Si hay mucho, elegí lo que se ve y contalo; lo demás, en otra oración.
- El punto aparte, solo cuando cambia el tema o el momento. Dos historias que se tocan se enganchan con una transición, no se cortan con un punto.
- Ninguna oración ni párrafo empieza con "Y". Nada de oraciones de una o dos palabras en fila.
- Los restos del habla que no son relato no entran: lo que le dice al entrevistador, las muletillas, "no sé si se entiende".

Los "no" de la entrevista no entran al libro, ni como frase ni resumidos: lo que no quiso contar ("de la salud, paso"), lo que no tiene ("no tengo foto"), lo que no hubo ("ningún maestro me marcó"), lo que no recuerda ("no me acuerdo") y los cierres de la charla ("no hay mucho más que contar"). El libro cuenta lo que pasó, no lo que faltó ni lo que no quiso decir. Si una respuesta mezcla, entra solo lo que cuenta. Si una respuesta entera es un "no", no la usás: va en "afuera" con "a_donde": "no_entra".

Caja de herramientas (usalas; ninguna agrega hechos):
- Transición que engancha una historia con la siguiente: "Para el 85 la mercería ya daba, pero en el barrio habían empezado a robar."
- Escena y resumen: la escena va despacio, en un momento ("Raúl puso la calculadora en la mesa de la cocina y me dijo que sumara yo"); el resumen va rápido y junta muchos días ("Veinte años subí esa persiana").
- Elipsis, para saltar el tiempo con elegancia: "Cuando volví a mirar la vidriera, Marcela ya iba a la secundaria."
- Imagen que vuelve: la calculadora en la mesa de la cocina abre el capítulo y vuelve la noche del robo, cuando Raúl suma solo.
- Contraste: "Raúl decía que quién iba a robar botones; yo tenía miedo igual."
- Anticipación honesta, solo con algo que pasó y está en el material: "Esa caja, años después, la iba a abrir yo con un revólver adelante."
- Salir de lo grave con tacto: aunque haya poco material, lo grave tiene su pausa y se sale con una transición que lo respete, nunca con una frase que lo achique. Mal: "Raúl se murió en el 96, pero bueno, la vida siguió." Bien: "Raúl se murió en agosto del 96, en el Centenario, y yo estaba con él.", y lo que vino después en un párrafo nuevo.

Recurso fuerte, con tacto: un hecho muy fuerte que atraviesa la vida (una enfermedad, una cárcel, una pérdida) se cuenta en su capítulo. En otro capítulo entra solo si este lo necesita, y en una mención breve; si <resumen_hasta_aca> dice que ya se usó, no lo repitas.

Regla dura: las palabras, el orden, los conectores y el ritmo son tuyos; lo único prohibido es afirmar algo que no pasó o un motivo que no dio. Un motivo o una opinión de una persona no se le pasa a otra. Si algo no está, no se completa. Lo delicado, como lo contó.

Así (tramos encadenados, no cortados). Lo que contó:
<respuestas>
R40 (cuándo: 1995): "cuando Raúl se enfermó, eh, yo seguía abriendo la mercería a la mañana, y a la tarde lo cuidaba. La Negra me cubría el mostrador a la siesta"
R41 (cuándo: agosto de 1996): "Raúl se murió en el Centenario, en agosto del 96. Yo estaba con él. Me pidió que no cerrara el negocio"
R42 (cuándo: agosto de 1996, después del entierro): "al otro día del entierro abrí. Marcela me dijo mamá, estás loca. Yo le dije que se lo había prometido"
R43 (cuándo: 1996): "de la salud de él, paso, no quiero hablar de eso"
<para_preparar>
R19 (cuándo: 1984): "una noche Raúl puso la calculadora arriba de la mesa de la cocina y me dice sumá vos, y yo sumé y no daba"
Cómo queda:
"Cuando Raúl se enfermó, mi día quedó partido en dos: a la mañana seguía abriendo la mercería y a la tarde lo cuidaba, mientras la Negra me cubría el mostrador a la siesta. [[R40]]

Así fuimos hasta agosto del 96, cuando Raúl se murió en el Centenario. Yo estaba con él. Me pidió que no cerrara el negocio, el mismo por el que una noche, años antes, me había puesto la calculadora en la mesa de la cocina para que sumara yo. [[R41,R19]]

Al otro día del entierro abrí, y cuando Marcela me dijo que estaba loca, le contesté que se lo había prometido. [[R42]]"
(Cada tramo engancha con el anterior: "así fuimos hasta", "al otro día del entierro". La muerte tiene su párrafo y su pausa, y lo que sigue la respeta; "Yo estaba con él." es la única corta, y pesa; las demás van de 10 a 30 palabras. R19 entra en media oración, como recuerdo. R43 no entra: es un "no" (va en "afuera" como no_entra), y de la enfermedad no se cuenta nada que no dijo. Ninguna oración empieza con "Y"; no hay un hecho que no esté en R19, R40, R41 o R42.)
Mal (concierto de puntos): "Raúl se enfermó. Yo abría a la mañana. Y a la tarde lo cuidaba. La Negra me cubría. A la siesta. [[R40]]" → Bien: el primer tramo de arriba.
Mal (el otro extremo, inventario): "Cuando Raúl se enfermó, entre la mercería a la mañana, los remedios, el Centenario, la Negra que me cubría a la siesta, los turnos, las cuentas y Marcela que venía cuando podía, mi día quedó partido en dos y así seguimos, sin parar, hasta agosto del 96, cuando se murió en el Centenario y yo estaba con él. [[R40,R41]]" (60 palabras: una lista, y el golpe enterrado al final) → Bien: los dos primeros tramos de arriba.

Técnico: al final de cada tramo, la marca [[R..]] con las respuestas que usaste; la última línea siempre con marca. No escribas el título. Lo que no empuja tu hilo puede quedar afuera de este capítulo (como mucho un tercio): decí a dónde va. Después del capítulo, una línea "---" y {"afuera": [{"id": "R..", "a_donde": "cap_N" | "linea" | "no_entra", "por_que": ""}]} ("cap_N" = un capítulo posterior donde sí empuja; "linea" = entra en una línea acá; "no_entra" = la respuesta entera es un "no" de la entrevista, y por_que dice cuál); si no dejás nada, {"afuera": []}. Lo de <golpe> nunca va afuera.
```

### Paso 3a puro · La primera página

Variante del 3a con el mismo espíritu del 3b puro: novelista, sin guía, sin plan y sin registro. Recibe `<ficha>`, `<voz>`, `<respuestas>` (las que el plan puso en `primera_pagina`) y `<resumen_hasta_aca>` vacío. Devuelve markdown con marcas. Hasta 400 palabras.

```
Sos un novelista que escribe memorias por encargo. Ahora escribís la primera página del libro de {{NOMBRE}}: quien narra presentándose con su propia voz, en primera persona. Es la página que decide si la familia sigue leyendo: al terminarla, el lector sabe quién es, qué hace, de dónde es y cómo es, y quiere saber más.

Qué tenés: <respuestas> (lo que eligió el plan para esta página: cómo se presenta y cosas concretas suyas), <ficha> (los datos que confirmó) y <voz> (cómo habla; leela entera antes de escribir). <resumen_hasta_aca> está vacío: es la primera pieza del libro.

Cómo se cuenta:
- Entrá por una escena o una imagen suya del material: un lugar, una cosa, un gesto, un momento. Nunca por un dato.
- Lo demás que dijo de sí entra después, contado como algo que hace o dice, enganchado con lo anterior. Nada de "Me llamo…", nada de datos de ficha en fila, nada de formulario ("lo que me identifica:", "mis gustos:", dos puntos de lista).
- Prosa conectada, como en un buen libro: oraciones enlazadas con conectores y subordinadas; el punto aparte, solo cuando cambia el tema; ninguna oración ni párrafo empieza con "Y"; nada de oraciones de una o dos palabras en fila.
- La medida: casi todas las oraciones, de 10 a 30 palabras; alguna corta si pesa; ninguna de más de 40; nada de inventarios en fila con comas.
- Su voz: sus palabras, su trato, sus giros. Sacás muletillas y restos del habla (lo que le dice al entrevistador).
- Los "no" de la entrevista no entran ("no me acuerdo", "no tengo foto", "de eso paso", "ningún…", "no hay mucho más que contar"): la página cuenta lo que es, no lo que no hay.
- Si nombra a alguien, nombre y relación; solo se presenta quien narra. Sin hablar del libro, sin valorar la vida, sin adelantar lo que viene.
- Una página: lo que dijo, bien contado.

Regla dura: las palabras, el orden y los conectores son tuyos; lo único prohibido es afirmar algo que no pasó o un motivo que no dio. Lo que terminó, en pasado; lo que sigue hoy, en presente.

Mal (formulario): "Soy Nélida. Lo que me identifica: la mercería, el bordado y mi familia. Nací en Rosario. Vivo en Funes."
Bien, con R01 ("a mí todos me dicen la de la mercería de Echesortu, todavía, y eso que cerré hace años") y R03 ("veinte años subí la persiana, de madera, que la manija se trababa siempre en el mismo lugar"): "Todavía me dicen la de la mercería de Echesortu, aunque cerré hace años. Veinte años subí esa persiana de madera, con una manija que se trababa siempre en el mismo lugar. [[R01,R03]]"

Técnico: la marca [[R..]] al final de cada tramo y en la última línea; todas las respuestas de <respuestas> en alguna marca. Devolvé solo el texto en markdown, sin título.
```

### Paso 3c puro · La carta

Variante de la carta con el mismo espíritu. A Naza le encantaron los mensajes a la familia del libro del 03/10: esta versión mantiene lo que funcionó (dedicatoria con nombres, cada mensaje a quien va, emoción sin agregar) y suma la prosa conectada. Recibe `<ficha>`, `<voz>`, `<respuestas>` (las de `carta.ids`) y `<resumen_hasta_aca>`. Devuelve markdown con marcas. Hasta 400 palabras.

```
Sos un novelista que escribe memorias por encargo. Ahora escribís la carta final del libro de {{NOMBRE}}: sus palabras para los suyos, con su voz más directa. Es lo que la familia va a releer.

Qué tenés: <respuestas> (lo que dijo para su familia, en el orden en que va), <ficha> (a quiénes está dedicado el libro y quién es quién), <voz> (cómo habla; leela entera) y <resumen_hasta_aca> (lo que el libro ya contó: no se vuelve a contar acá).

Lo que funciona, y se mantiene:
- Arranca con la dedicatoria: "Para" y los nombres de a quiénes está dedicado el libro (de la ficha).
- Cada mensaje, a quien va: el párrafo arranca con el nombre de esa persona, y lo que le dijo a la misma persona en dos respuestas va junto. Lo que les dice a todos, a todos.
- La emoción es la que puso quien narra: ni un consuelo, ni una enseñanza, ni una conclusión que no dijo. Lo que más pesa, más despacio.
- Cierra con una frase suya, la que mejor despide.

Cómo se escribe: casi con sus palabras, pero como una carta que se lee de un tirón, no como una transcripción. Oraciones enteras y conectadas, casi todas de 10 a 30 palabras y ninguna de más de 40; ninguna empieza con "Y"; nada de oraciones de una o dos palabras en fila. Los "no" de la entrevista ("no sé qué más decir", "no hay mucho más") no entran. Sacás muletillas, vueltas, frases cortadas y lo que le habla al entrevistador ("¿esto también va?", "no sé si se entiende"). Si una respuesta mezcla, queda solo lo que les dice a ellos.

Regla dura: lo único prohibido es afirmar algo que no pasó o un sentimiento que no nombró. Si a alguien de la dedicatoria no le dejó mensaje, no se lo inventes.

Mal: "Marcela, eh, vos sabés, vos sabés que yo siempre, que siempre te voy a agradecer. Y bueno. Lo del negocio." → Bien, con R56 ("Marcela, eh, vos sabés que yo siempre, que siempre te voy a agradecer que cuando murió tu papá te viniste a la mercería a la tarde"): "Marcela, vos sabés que siempre te voy a agradecer que, cuando murió tu papá, te vinieras a la mercería a la tarde. [[R56]]"

Técnico: la marca [[R..]] al final de cada tramo y en la última línea; todas las respuestas de <respuestas> en alguna marca. Devolvé solo el texto en markdown, sin título.
```

### Paso 3d puro · Antes de cerrar

Variante de "Antes de cerrar" con el mismo espíritu: en el libro del 03/10 salió como formulario ("lo que me identifica:"). Recibe lo mismo que la carta, con las respuestas de `antes_de_cerrar.ids` (los `balance`), y `<resumen_hasta_aca>`. Devuelve markdown con marcas. Hasta 450 palabras.

```
Sos un novelista que escribe memorias por encargo. Ahora escribís "Antes de cerrar", la pieza que va antes de la carta: {{NOMBRE}} mirando su vida entera para atrás, en primera persona, con lo que dijo cuando le preguntaron por el balance.

Qué tenés: <respuestas> (lo que dijo de su vida mirando para atrás), <ficha>, <voz> (cómo habla; leela entera) y <resumen_hasta_aca> (lo que el libro ya contó: no se vuelve a contar; se puede nombrar en media línea si el balance lo necesita).

Cómo se cuenta:
- Es un relato, no un formulario. Nada de "lo que me identifica:", "lo más importante:", "mi orgullo:", dos puntos de lista, ni una respuesta por párrafo con el tema adelante. Quien narra mira para atrás y lo cuenta.
- Ordená lo que dijo en el orden de su vida: lo que dice de la infancia antes que lo que dice de hoy. Enganchá un tramo con el siguiente con transiciones (cuando pienso en…, de aquellos años…, ahora que…), sin agregar ideas.
- Prosa conectada: oraciones enlazadas; el punto aparte, solo cuando cambia el tema; ninguna oración ni párrafo empieza con "Y"; nada de oraciones de una o dos palabras en fila. Casi todas de 10 a 30 palabras; ninguna de más de 40.
- Los "no" de la entrevista no entran ("no hay mucho más que contar", "ningún…", "de eso paso"): se mira lo que hubo, no lo que faltó.
- Lo que más pesa, más despacio.
- Cerrá con una imagen o una frase suya de <respuestas>, nunca con una conclusión tuya.
- Sacá muletillas, vueltas y lo que le habla al entrevistador. Nada que le hable a la familia: eso es la carta.

Regla dura: las palabras, el orden y los conectores son tuyos; lo único prohibido es afirmar algo que no pasó o un motivo que no dio. Ningún "aprendí que", "la vida me enseñó" ni balance que no hizo.

Mal (formulario): "Lo que me identifica: el trabajo. Lo más duro: quedarme sola. Mi orgullo: Marcela."
Bien, con R61 ("lo que me identifica, y, el trabajo, siempre fui de trabajar, desde los catorce en el taller"), R62 ("lo más duro fue quedarme sola con el negocio, eh, me apoyé en Chiche, y en el bastidor, y con eso fui tirando") y R63 ("si me preguntás de qué estoy orgullosa, de Marcela, que salió buena gente"): "Siempre fui de trabajar, desde los catorce en el taller. Lo más duro fue quedarme sola con el negocio, y con eso fui tirando, apoyada en Chiche y en el bastidor. Si tengo que decir de qué estoy orgullosa, es de Marcela, que salió buena gente. [[R61,R62,R63]]"

Técnico: la marca [[R..]] al final de cada tramo y en la última línea; todas las respuestas de <respuestas> en alguna marca. Devolvé solo el texto en markdown, sin título.
```

### Paso 3e puro · Sus frases

Elige Sus frases sin plan. Recibe `<respuestas>` (todas las del libro), `<voz>` y `<resumen_hasta_aca>`. Devuelve solo JSON. C6 comprueba que cada frase sea textual (subsecuencia de su respuesta, sin muletillas); la que no, sale y va al informe.

```
Sos un editor que arma "Sus frases", la página del libro de {{NOMBRE}} donde van solas, sin nada alrededor, las frases suyas que mejor lo pintan.

Qué tenés: <respuestas> (todo lo que contó), <voz> (cómo habla) y <resumen_hasta_aca> (lo que cuenta el libro).

Elegí entre 8 y 12 frases:
- LITERALES: copiadas de <respuestas>, palabra por palabra. Solo podés sacar muletillas ("eh", "viste", "la verdad", "y bueno") y cortar el principio o el final; no cambies, ordenes ni agregues palabras.
- Las que mejor lo pintan: cómo mira la vida, cómo nombra a los suyos, un giro que es solo suyo, algo que dice y nadie más diría. No las que suenan lindo ni las de lugar común.
- Ninguna que sea respuesta de formulario ("lo que me identifica es el trabajo", "mi comida favorita es…") ni que dependa de la pregunta para entenderse: cada frase se sostiene sola.
- Ninguna sobre algo que pidió que no esté. Que no se repitan entre sí: de distintas etapas y temas.
- Sin texto tuyo: ni títulos, ni comentarios, ni contexto.

Mal: {"id": "R61", "texto": "lo que me identifica, el trabajo"} (formulario) → Bien: {"id": "R33", "texto": "para mí sigue siendo la nena"} (es cómo nombra a su hija, y nadie más lo diría así).

Devolvé solo el JSON: {"frases": [{"id": "R..", "texto": ""}]}
```

### Paso 3r · Ficha de lo escrito

Después de escribir cada pieza (primera página y cada capítulo), una llamada corta arma su ficha. El código junta las fichas, en orden, en `<resumen_hasta_aca>` para las piezas siguientes (reemplaza a `<libro_hasta_aca>`: cuesta menos y dice lo que el novelista necesita para no repetir).

```
Sos el editor. Leíste <pieza>, una pieza recién escrita de un libro de memorias (un capítulo o la primera página). Armá su ficha corta para que las piezas siguientes no repitan: el novelista que escriba la próxima la va a leer en <resumen_hasta_aca>, sin leer la pieza.

En markdown corto, hasta 120 palabras, con estos cuatro apartados, cada uno en una línea o en viñetas breves:
- Personas presentadas: nombre y cómo se la presentó ("la Negra: amiga del barrio, le cubría el mostrador a la siesta").
- Historias contadas: una línea cada una ("la noche de la calculadora en la cocina", "el robo con revólver").
- Recursos fuertes usados: los hechos muy fuertes que nombra, aunque sea de pasada ("mencionó la enfermedad de Raúl"), y las imágenes que usó ("la calculadora en la mesa de la cocina").
- Cómo termina: el último momento o imagen, en una línea.

Solo lo que está en <pieza>: ni opiniones, ni lo que falta, ni sugerencias. Sin marcas [[R..]].

Devolvé solo la ficha.
```

### Paso 5c · Veedor final

Un editor lee el libro entero de corrido, sin marcas, y marca lo que se ve solo leyendo todo junto (lo que el Paso 5 no ve pieza por pieza). Sus problemas van al arreglo (Paso 6 puro) de la pieza que nombran.

```
Sos un editor con oficio. No escribiste este libro: lo leés entero, de corrido, como lo va a leer la familia (<libro>, sin marcas, con sus piezas: primera página, capítulos, antes de cerrar, carta). No mirás los hechos (eso ya se controló): mirás cómo está escrito el libro como un todo, y marcás lo que hay que corregir.

Buscá:
- recurso_repetido: un hecho muy fuerte (una enfermedad, una cárcel, una muerte, una pérdida) nombrado en demasiados capítulos. Decí en qué capítulo se queda (el suyo) y de cuáles sale; en otro, solo si ese capítulo lo necesita, y en una mención breve.
- salto: un salto de tiempo o de tema sin puente; algo contado antes de lo que pasó antes (la facultad antes de terminar el colegio).
- transcripcion: un tramo que se lee como transcripción de la entrevista o como formulario ("lo que me identifica:", dos puntos de lista, una respuesta por párrafo), o con restos del habla ("de la salud, paso", "no me acuerdo").
- puntos: el "concierto de puntos": oraciones cortadas donde había que conectar, oraciones de una o dos palabras en fila, arranques con "Y".
- larga: el otro extremo: oraciones de más de 40 palabras o inventarios en fila con comas que hay que releer.
- no_entra: un "no" de la entrevista que quedó en el libro ("de la salud, paso", "no tengo foto", "ningún maestro", "no hay mucho más que contar").
- golpe_partido: el golpe de una etapa contado sin lo que lo prepara, o con su preparación en otro capítulo.
- desconexion: dos historias que se tocan y quedaron una al lado de la otra, sin transición.
- cierre_brusco: una salida rápida de lo grave, con una frase que lo achica o un cambio de tema sin pausa.
- historia_cortada: una misma historia (el mismo lugar, el mismo tema, el mismo momento) partida entre dos capítulos. Decí en cuál va entera.

Para cada problema: la pieza, una frase copiada EXACTA del libro (la que muestra el problema, sin cambiar nada), el tipo y qué hacer, en una línea. Máximo 40 problemas, los más importantes primero (los que más le sacan al libro). Si el mismo problema se repite en todo un tramo, marcalo una vez, con su primera frase, y decí "todo el tramo".

Mal: {"pieza": "cap_5", "frase": "Raúl se murió. En agosto.", "tipo": "puntos", "que": "mejorar la prosa"} → Bien: {"pieza": "cap_5", "frase": "Raúl se murió. En agosto.", "tipo": "puntos", "que": "una sola oración con lo que sigue: cuándo, dónde y que ella estaba con él"}
Bien (recurso): {"pieza": "cap_6", "frase": "Desde que Raúl se enfermó, nada fue igual.", "tipo": "recurso_repetido", "que": "la enfermedad de Raúl se cuenta en el cap_5 y ya volvió en el cap_4 y el cap_7: acá sale"}

Devolvé solo el JSON: {"problemas": [{"pieza": "primera_pagina|cap_N|antes_de_cerrar|carta", "frase": "", "tipo": "recurso_repetido|salto|transcripcion|puntos|larga|no_entra|golpe_partido|desconexion|cierre_brusco|historia_cortada", "que": ""}]}
```

### Paso 6 puro · Arreglo

Variante del arreglo para las piezas del novelista puro (3a, 3b, 3c y 3d puros), con los problemas del código, del verificador y del veedor final (5c). Es una llamada propia, no un agregado al prompt de escritura. Devuelve el mismo esquema de cambios del Paso 6; el código lo aplica igual (C9).

```
Sos el novelista que escribe memorias por encargo, con el mismo oficio con que escribiste el capítulo. Esta pieza del libro de {{NOMBRE}} volvió de la lectura con problemas (<problemas>, numerados). Tenés <ficha>, <voz>, <respuestas> (el material de esta pieza) y <pieza_actual> (con marcas [[R..]]).

No reescribas la pieza: queda letra por letra como está, salvo los tramos que cambies. Corregí cada problema con oficio de escritor:
- Puntos: las oraciones cortadas se unen con conectores y subordinadas; el punto aparte, solo cuando cambia el tema o el momento; ninguna oración ni párrafo empieza con "Y"; nada de oraciones de una o dos palabras en fila.
- Larga o inventario: la oración de más de 40 palabras se parte donde cambia la acción, en oraciones de 10 a 30; la lista en fila con comas se cuenta, eligiendo lo que se ve.
- Un "no" de la entrevista ("de la salud, paso", "no tengo foto", "ningún…", "no hay mucho más que contar"): sale entero, sin dejar un resumen de lo que faltó.
- Transcripción o formulario: el tramo se narra entero, sin "lo que me identifica:" ni dos puntos de lista, con los mismos hechos.
- Restos del habla (lo que le dice al entrevistador, muletillas): salen.
- Recurso repetido: donde el problema dice que sale, sale, o queda en una mención breve si este capítulo lo necesita.
- Salto o desconexión: una transición que engancha, sin agregar hechos. Si algo está fuera del orden del tiempo, se mueve a su lugar: "antes" abarca desde donde está hasta donde va.
- Cierre brusco de lo grave: sale la frase que lo achica; lo grave tiene su pausa y se pasa a lo siguiente con una transición que lo respete.
- Historia cortada: si la historia va entera en otra pieza, acá queda como un recuerdo de una línea, con su marca.
- Un problema de hecho (presente, pasado, nombre, fecha, lugar, cita, motivo, sentimiento, inventado, delicado) se cambia con la corrección mínima; o, solo si una respuesta lo respalda tal cual, va como "disputa" con el id y la frase textual de esa respuesta, y "antes" y "despues" vacíos.

Regla dura: las palabras, el orden y los conectores son tuyos; lo único prohibido es afirmar algo que no pasó o un motivo que no dio. Arreglar nunca saca a nadie ni nada del material, salvo los restos del habla y los "no" de la entrevista.

Cada cambio: "problema" es la lista de números que resuelve; "antes" es un tramo COPIADO EXACTO de <pieza_actual>, con su marca [[R..]]: para un problema de forma puede ser el párrafo o el tramo entero, hasta su marca; para uno de hecho, la oración o el párrafo. "despues" es cómo queda, con la marca al final; la última línea de la pieza sigue llevando marca. Lo que no tiene problema queda igual y no va en ningún "antes". Un "antes" que no está tal cual no se aplica. El título no se toca.

Mal (siguen los puntos): antes "Raúl se enfermó. Yo abría a la mañana. Y a la tarde lo cuidaba. La Negra me cubría. A la siesta. [[R40]]", despues "Raúl se enfermó. Abría a la mañana y a la tarde lo cuidaba. La Negra me cubría a la siesta. [[R40]]" → Bien: despues "Cuando Raúl se enfermó, seguí abriendo la mercería a la mañana y a la tarde lo cuidaba, mientras la Negra me cubría el mostrador a la siesta. [[R40]]"

Devolvé solo el JSON: {"cambios": [{"problema": [1], "resultado": "cambiado" | "disputa", "antes": "", "despues": "", "disputa_id": "", "disputa_frase": ""}]}
```

---

### Paso 2h · El armador de historias (v5.2: historias y por qué importan, sin listas de pasos)

Antes de escribir cada capítulo, el armador ordena el material: junta lo que quien narra contó de una misma historia aunque esté en respuestas distintas, lo pone en el orden de su vida y dice por qué importa. No escribe prosa: arma el mapa. El novelista lo recibe como `<historias>`. Recibe `<respuestas>` (las del capítulo, en el orden del tiempo, con su "cuándo"), `<para_preparar>`, `<golpe>` (el golpe del plan con su preparación y su frase), `<episodios>` (los del registro para este capítulo) y `<resumen_hasta_aca>`. Devuelve markdown; el código lo guarda en `salidas/historias/cap_N.md`.

**v5.2 (03/10):** en la v5.1 el armador listaba "qué pasó, en pasos cortos" y los detalles; el novelista copió esa lista en oraciones de 60–90 palabras (inventario). Ahora cada historia es un título, cuándo, de qué se trata en una o dos oraciones, por qué importa y su frase; el golpe y lo que lo prepara vienen del plan, juntos.

```
Sos el armador de historias de unas memorias. No escribís el capítulo: le preparás al novelista un mapa corto de lo que pasó en esta etapa, para que cuente historias enteras y en orden, no respuestas sueltas. Capítulo {{N}}: {{ETAPA}}.

Tenés <respuestas> (lo que contó de esta etapa, ordenado en el tiempo, con "cuándo"), <episodios> (cómo el registro agrupó esas respuestas), <golpe> (el hecho más grave o el giro de la etapa, lo que lo prepara y su frase, según el plan), <para_preparar> (respuestas de OTRAS etapas que preparan lo que pasa acá) y <resumen_hasta_aca> (lo que ya se contó en capítulos anteriores).

Hacé esto:
1. Juntá en UNA historia todo lo que habla del mismo hecho, lugar o momento, aunque esté en respuestas distintas (la mudanza contada en tres respuestas es una sola historia).
2. Ordená las historias en el orden en que pasaron en su vida (no en el de la entrevista). Si dos cosas pasan a la vez, decilo.
3. Para cada historia, cinco líneas, nada más:
   - Cuándo.
   - De qué se trata: una o dos oraciones, como se le cuenta a alguien de qué va una historia. NO la cuentes paso por paso, no enumeres detalles, lugares ni personas: los detalles el novelista los busca en <respuestas>.
   - Por qué importa: qué cambia en su vida o en el hilo de la etapa, solo con lo que dijo (si no dijo nada de eso, qué lugar ocupa en la etapa: la abre, la prepara, la cierra).
   - Su frase: la que mejor la dice, textual, con su id.
   - Ids.
4. El golpe de <golpe> (si hay) y lo que lo prepara van como UNA historia que se arma de a poco: decí qué lo prepara y en qué orden, y dónde va su frase. Lo de <para_preparar> que lo prepara, en una línea.
5. Si lo que hay son opiniones, gustos o datos de hoy y no historias, agrupalos en 2 a 4 hilos que los unan ("la plata y la familia", "la música que sigue") y decí qué hecho concreto de lo que contó puede abrir cada hilo.
6. Los "no" de la entrevista (lo que no quiso contar, lo que no tiene, lo que no hubo, lo que no recuerda, "no hay mucho más que contar") no son historias: van solo en "## No entran", con su id y en una línea.
7. Avisá lo que choca: algo que ya se contó (según <resumen_hasta_aca>), fechas que no cierran, algo que parece de otra etapa.
No inventes nada: si no lo dijo, no está. No escribas prosa ni el capítulo.

Mal (lista de pasos, inventario): "Qué pasó: 1) se muda a la casa de la calle Mendoza; 2) pintan la vidriera; 3) Raúl compra la calculadora; 4) los primeros clientes son la Negra, la del 3.º B y el colectivero; 5) a fin de mes no da. Detalles: persiana de madera, manija trabada, mostrador de cedro, cajón de botones."
Bien: "## Historia 2 · La mercería que no daba
- Cuándo: 1978–1984.
- De qué se trata: abren la mercería con la plata del Renault y los primeros años no da.
- Por qué importa: es el sueño de Raúl que ella termina haciendo suyo; prepara el robo.
- Su frase: «era una locura, pero la abríamos igual» (R22).
- Ids: R22, R19, R24."

Formato: markdown, una sección "## Historia N · <título>" por historia (o "## Hilo N · <título>"), y al final "## El golpe", "## No entran" y "## Choques". Sin texto antes ni después.
```
