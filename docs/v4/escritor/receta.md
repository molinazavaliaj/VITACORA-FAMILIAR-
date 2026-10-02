# Receta del escritor (v4, de cero)

**Estado: v4, escrita de cero el 02/10/2026** desde las 15 respuestas de Naza ([diseño](../../superpowers/specs/2026-10-02-escritor-v4-design.md)). La v3.2 ([`docs/v3/escritor/receta.md`](../../v3/escritor/receta.md)) queda como historial: sacaba más nota con el juez, pero Naza leyó su libro contra el anterior y prefirió el anterior. Quedaba casi transcripto, "escrito raro", con el mismo nombre cuatro veces seguidas, porque la receta confundió **no inventar hechos** con **no narrar**.

**El objetivo, en una oración (va en cada prompt de escritura):** una novela en primera persona, con el tono de quien narra, que atrape y que la familia diga "es él" (o "es ella"), sin un solo hecho agregado.

**Qué cambia respecto de la v3.2.**
- "No inventar" quiere decir **hechos**: quién, qué, cuándo, dónde, cuánto, qué se dijo (y motivos y sentimientos con nombre). El relato es obligación del escritor: ordenar, conectar, ritmo, limpiar repeticiones y muletillas, redactar bien lo que se contó mal, darle peso a lo importante, cerrar bien.
- **Voz mezcla**: narra el escritor con el tono del narrador; solo lo que va entre rayas, comillas o destacado tiene que ser textual (C6).
- **Capítulo = etapa de la vida**, en orden; adentro, cronológico. Se va el "hecho fuerte" como eje del capítulo.
- **Peso por importancia, no por largo**: cada pieza del plan lleva `peso` (clave, normal, línea); un momento clave nunca va en una línea (C13).
- **Lo de hoy al último capítulo**; en un capítulo viejo, una sola línea de consecuencia al final de su historia (C28).
- **Recursos con medida**: frase corta de cierre, frase suya destacada, diálogo con raya; el código marca solo a partir del tercer golpe por capítulo (C1).
- **El mismo nombre tres veces en tres oraciones** va al arreglo (C29, nuevo).
- Se mantiene todo lo que cuida los hechos y que todo entre: registro, marcas `[[R..]]` por párrafo, verificador con `<presentes>` y `<pasados>`, lector con `<referencias>`, cotejo, una sola ronda de arreglo por reemplazos, informe.

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

**Marcas de rastreo.** En 3a, 3b, 3c, 3d y en el arreglo, cada párrafo termina con `[[R12,R15]]`: las respuestas que usó (o `[[FICHA]]` si sale de la ficha). Con ellas el código controla que todo entró (C18), el verificador sabe contra qué mirar y el cotejador sabe adónde va lo que falta. El código las borra antes de la lectura y de imprimir.

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

Bordes:
1. Un capítulo es una etapa de su vida, y los capítulos van en el orden en que los vivió. La etapa se corta donde la vida cambia (mudanza, casamiento, hijo, muerte, trabajo que empieza o termina). Cada capítulo tiene un "hilo": lo que cambia en esa etapa, en una oración con palabras del registro, con sus "hilo_ids". Cada capítulo tiene por lo menos una pieza con forma escena; una etapa sin ninguna escena se junta con la vecina.
2. Adentro del capítulo, "piezas" va en orden cronológico: el escritor las escribe en ese orden. "apertura.episodio" es la primera pieza escena del capítulo; lo que pasó antes y no tiene escena va antes de ella como pieza corta (peso "linea"), para que el escritor lo ponga como ubicación en el primer párrafo.
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

Mal (por tema): capítulos "Mi familia", "El trabajo", "Los viajes". → Bien (por etapa, en orden): la casa de calle Pellegrini (infancia), los bailes del club (noviazgo), la mercería (1978–2002), la viudez, hoy en Funes.
Mal (peso): el robo con revólver (E19, momento clave, dos renglones) como media_linea, peso "linea", entre la vidriera nueva y la secundaria de Marcela. → Bien: E19 resumen, peso "clave", cierre del capítulo de la mercería; la vidriera y la secundaria, peso "linea"; faltante "momento clave sin escena: el robo (E19): qué hora era, cuánto duró, cómo siguió Raúl".
Mal (orden): piezas E19 (el robo, 1991), E07 (la calculadora, 1984), E03 (la apertura, 1978). → Bien: E03, E07, E19.
Mal (hoy): "tengo cinco nietos" (E52, dato, sigue_hoy) en el capítulo de la mercería. → Bien: al último capítulo. En cambio "la Negra me prestó la plata del primer alquiler; hasta hoy dice que se la debo" (E24) queda en la mercería, con por_que_aca "consecuencia que cierra la historia del alquiler (E24)".
Mal (título): "Años de lucha". → Bien: "Los carreteles al sol" (R27, la inundación), o vacío si no hay nada con imagen.

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

Valores cerrados: `apertura.tipo` y `cierre.tipo` ∈ escena | objeto | persona_entra | dia_comun | fecha | frase_suya | gesto. `forma` ∈ escena | resumen | media_linea | remate (`escena` solo si el episodio tiene `es_escena: true`). `peso` ∈ clave | normal | linea (un episodio con `momento_clave` nunca va con `linea`; `linea` va con forma `media_linea` o `remate`). `piezas` va en orden cronológico y el escritor no lo cambia; `apertura.episodio` es la primera pieza `escena`. `por_que_aca`: solo en una pieza de un episodio `dato`, `gusto` o `reflexion` con estado `sigue_hoy` puesta en un capítulo que no es el último; en las demás, vacío. `columna` e `imagen_final`: solo en el último capítulo (en los demás, vacíos); `imagen_final.episodio` está en sus piezas, es de hoy y es el `cierre.episodio`. `antes_de_cerrar.ids`: los ids R de todos los episodios `balance`, en el orden en que se leen. `carta.titulo`: frase suya (con `titulo_id`) o "Para los míos"; nunca "Antes de cerrar". `contexto` de Sus frases: hasta 20 palabras, solo lo que dice el material.

| Borde | Quién controla |
|---|---|
| 1 etapas en orden; hilo; ≥1 escena | C13 (≥1 pieza `escena`; `hilo_ids` no vacío); lector (sin_hilo, salto_confuso) |
| 2 piezas cronológicas; apertura en la primera escena | C13 (apertura en una escena); lector (salto_confuso) |
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

### Paso 2b · Lo que arma el código después del plan

- **Título impreso de cada capítulo:** `titulo.texto`, o, si está vacío, la etapa con los años si `anios.seguros` ("La mercería, 1978–2002"). Lo imprime el código; el escritor no lo escribe y el arreglo no lo cambia. Un `titulo_generico` del lector va al informe.
- **Sin máximo ni mínimo de palabras:** el largo lo da la entrevista. Lo único que se mira es que no se estire (el lector marca `relleno`).
- **"Sus frases"**, el título de la carta y el de "Antes de cerrar", como en la v3.
- **Tabla R → pieza** para C18 y para el cotejo.

### Paso 3a · La primera página

Mandan: secciones 1, 2, 3, 12 y 13; anexos A2, A3 y A6.

```
Sos el escritor. Escribís la primera página de una novela en primera persona: {{NOMBRE}} presentándose con su propia voz, con TODO lo que el plan puso en "primera_pagina". Es la página que decide si la familia sigue leyendo: al terminarla, el lector sabe qué hace, de dónde es y cómo es, y quiere saber más. Narrás vos, con su tono; no agregás ningún hecho. Leé entera la ficha <voz> antes de escribir. Mandan las secciones 1, 2, 3, 12 y 13 de la guía y los anexos A2, A3 y A6.

Bordes:
1. La primera oración no es "Me llamo…" ni un dato de ficha suelto, y ninguna oración junta tres datos de ficha (nombre, año, hijos, ciudad).
2. En el primer párrafo hay una cosa concreta suya del plan (objeto, lugar, gesto o frase textual); el resto de lo que dijo de sí entra después, contado como algo que hace o dice, nunca como lista.
3. Hechos: cada cosa que afirma está en los ids del plan o en la ficha. Lo que terminó, en pasado; lo que sigue hoy, en presente.
4. Relato: ordenás, conectás y redactás bien lo que dijo en varias respuestas; sacás muletillas y repeticiones. No es una transcripción: es la voz de {{NOMBRE}} en su mejor día.
5. Solo se presenta quien narra; si nombra a alguien, nombre y relación, nada más.
6. Sin hablar del libro ni del lector, sin valorar la vida, sin adelantar lo que viene.
7. Lo que va entre rayas, comillas o destacado es textual suyo. Como mucho un golpe (frase corta suelta o frase destacada), y solo si sostiene la página.
8. Cada párrafo termina con la marca [[R..]] de las respuestas que usó. Ningún id del plan queda sin usar.

Mal (ficha): "Me llamo Nélida Ferraro, nací en Rosario en 1954, tengo tres hijos y vivo en Funes."
Mal (transcripta): "Y bueno, yo soy Nélida, la de la mercería, eh, que me conocen así, viste, todavía me conocen así."
Bien: "Soy Nélida, la de la mercería de Echesortu. Así me conocen todavía, aunque cerré hace años. Veinte años subí esa persiana de madera con una manija que trababa siempre en el mismo lugar. [[R01,R03]]" (vale solo si dijo cada cosa).

Devolvé solo el texto en markdown, sin título.
```

| Borde | Quién controla |
|---|---|
| 1 primera oración; datos de ficha | C3; lector (primera_pagina) |
| 2 cosa concreta; sin lista | lector (primera_pagina, lista) |
| 3 hechos y tiempo verbal | verificador; C4, C5 |
| 4 relato, no transcripción | lector (transcripto, no_suena) |
| 5 una sola persona presentada | C17; lector |
| 6 sin hablar del libro | C1 (molde "este libro"); lector |
| 7 textual entre rayas, comillas o destacado; un golpe | C6; C1 |
| 8 marcas; todo el plan usado | C18 |

### Paso 3b · Un capítulo

Mandan: secciones 1, 2, 3, 5, 6, 7, 8, 9, 11, 12 y 14; anexos A2, A3, A6, A7 y A8.

```
Sos el escritor. Escribís el capítulo {{N}} de la vida de {{NOMBRE}}: un capítulo de novela, en primera persona, con su tono, que se lea de corrido y que la familia, al terminarlo, diga "es él" o "es ella". Su título es "{{TITULO}}": lo imprime el código, vos no lo escribís. Los hechos son de quien narra; el relato es tu trabajo. Antes de escribir leé <libro_hasta_aca> (para no repetir nada ni volver a presentar a nadie) y la ficha <voz> entera. Mandan las secciones 1, 2, 3, 5, 6, 7, 8, 9, 11, 12 y 14 de la guía y los anexos A2, A3, A6, A7 y A8.

Bordes:
1. Hechos: nada que no esté en los ids de las piezas del capítulo o en la ficha. Ni quién, ni qué, ni cuándo, ni dónde, ni cuánto, ni qué se dijo; tampoco un motivo ("porque") ni un sentimiento con nombre que no dijo. Lo dudoso, vago; lo que no dijo, no se calcula ni se completa: lo que falta queda como está.
2. Relato, obligatorio: no copies las respuestas. Ordená, conectá cada párrafo con el siguiente, sacá muletillas, falsos arranques y repeticiones, redactá en oraciones enteras lo que contó a los tumbos, juntá en un tramo lo que contó en varias respuestas. Variá el largo de oraciones y párrafos: lo importante, más despacio; lo menor, rápido.
3. Voz: narrás vos con su tono: sus palabras (si dijo "plata", es plata), su trato (vos o tú, el de la ficha), su manera de nombrar a la gente, sus dichos. Sin adjetivos de catálogo, metáforas ni sentimientos que no dijo, sin las palabras ni los moldes del anexo A2, sin gerundio de posterioridad. Solo lo que va entre rayas, entre comillas o destacado tiene que ser textual suyo; en cada momento clave entra una frase suya textual, si la hay.
4. Orden: las piezas en el orden del plan, que es el del tiempo. Abrís en la primera escena (apertura del plan); lo que el plan pone antes de ella va como ubicación en el primer párrafo. Como mucho un salto atrás, anunciado y corto. Cerrás como dice el plan: con lo último que pasa, un gesto o una frase suya; nunca explicando lo que significó ni anunciando lo que viene.
5. Peso: una pieza "clave" va con su propio tramo, sin nada menor pegado, con oraciones más cortas que las de alrededor y una pausa después (corte de párrafo), aunque en el material sean dos líneas. Dos líneas siguen siendo dos líneas: el peso lo dan el lugar y el ritmo, no detalles agregados. Una pieza "linea" va en una oración, adentro de la historia a la que pertenece.
6. Formas: la escena entera y de una vez, con todos (o casi todos) los "detalles" de su episodio, ninguno más; el resumen con los detalles que dio; la media línea pegada a su historia; el remate al final de su escena. Cada episodio en un solo tramo: lo que ya se contó, después solo se nombra.
7. Personas: las que el plan presenta acá entran haciendo algo, de a una, con su relación y un detalle que dio; las ya presentadas, por el nombre; nadie se cae (los que no tienen historia van en media línea, con sus nombres). El mismo nombre no va tres veces en tres oraciones seguidas: usá "él", "ella", la relación, o juntá las oraciones.
8. Tiempo: lo que terminó, en pasado; lo que el registro tiene en "hoy" o "rasgos_hoy", en presente. Lo de hoy no va en este capítulo (va al último), salvo una sola línea de consecuencia al final del párrafo de esa historia, si el plan la trae con por_que_aca, sin atarla a un momento en que no pasó. En el último capítulo, la "columna" une los párrafos y el último párrafo es la "imagen_final".
9. Reflexiones: solo las que dijo, donde pesan (al final de la escena de la que hablan). Nunca una conclusión tuya.
10. Recursos con medida: frase corta de cierre, frase suya destacada (sola en su línea, con ">"), diálogo con raya con lo que ella citó. Como mucho dos golpes en el capítulo (frase corta suelta en su párrafo o destacada), y ninguno que repita lo que el párrafo ya dijo.
11. Lo delicado, como lo contó, con el detalle que dio y con el peso que tiene; sin suavizar ni agregar. Lo de no_poner no está. Ninguna frase cortada del audio.
12. Todo entra: cada párrafo termina con la marca [[R..]] de las respuestas que usó, y ningún id de las piezas del capítulo queda sin marca. El largo lo da el material: nunca estirar ni repetir con otras palabras.
13. El título no lo escribís. Empezá directo en el primer párrafo.

Mal (transcripto): "Y bueno, la mercería la abrimos en el 78 con Raúl. Era en la calle Mendoza. Antes era una zapatería. La plata la sacamos del Renault. Lo vendimos." → Bien: "Vendimos el Renault 4 para abrirla. Raúl decía que era una locura, una mercería, y yo le daba la razón: era una locura, pero la abríamos igual. [[R22]]"
Mal (inventa): "Con los ahorros de toda una vida y el corazón en la mano, abrimos nuestra querida mercería." → Bien: lo de arriba; ni ahorros, ni corazón, ni querida.
Mal (nombre): "Raúl llegó tarde. Raúl traía la calculadora. Raúl la puso en la mesa." → Bien: "Raúl llegó tarde, con la calculadora abajo del brazo, y la puso en la mesa de la cocina. [[R19]]"
Mal (peso enterrado): "Ese año cambiamos la vidriera, entraron a robar y a Raúl lo tuvieron en el piso, y Marcela empezó la secundaria." → Bien: la vidriera y la secundaria en una línea donde corresponden; el robo en su párrafo, al cierre: "Una vez entraron a robar. Tenían un revólver. A Raúl lo tuvieron en el piso, y yo atrás del mostrador. [[R35]]"
Mal (hoy): "Hoy la Negra vive en Funes y nos vemos los jueves." en el capítulo de 1978. → Bien: eso va al último capítulo; acá, si el plan lo trae: "La Negra me prestó la plata del primer alquiler. Hasta hoy dice que se la debo. [[R24]]"
Mal (truco): "No daba." / "Nunca más." / "Así era Raúl." cada una sola en su párrafo. → Bien: un solo golpe, donde sostiene: "Sumé. No daba. [[R19]]"
Mal (cierre): "Y así fue como entendí que la familia es lo más importante." → Bien: "Raúl guardó la calculadora en el cajón y nunca más la sacó. [[R19]]"

Devolvé solo el capítulo en markdown, sin título: empezá en el primer párrafo.
```

| Borde | Quién controla |
|---|---|
| 1 hechos | verificador (inventado, nombre, fecha, lugar, cita, motivo, sentimiento); C4, C5 |
| 2 relato, no transcripción | lector (transcripto, se_cae, relleno) |
| 3 voz; textual solo entre rayas, comillas o destacado | C1 (A2), C6, C10; lector (no_suena, ia, deriva) |
| 4 orden cronológico; apertura y cierre | lector (salto_confuso, apertura_repetida, cierre_explica, molde); C1 (moldes) |
| 5 peso | lector (peso_enterrado); C13 en el plan |
| 6 formas, detalles, un solo tramo | lector (sin_escena, repetido); C7 |
| 7 personas; nombre repetido | C17, C21, C29; lector (persona_dos_veces, lista, sin_presentar, nombre_repetido) |
| 8 tiempo; lo de hoy; último capítulo | verificador (presente, pasado); C28; C15, C20 en el último |
| 9 reflexiones | verificador (inventado); lector (reflexion_ajena, bolsa) |
| 10 recursos con medida | C1 (desde el tercer golpe); lector (recurso_de_mas) |
| 11 delicado; no_poner; cortadas | verificador (delicado); C2 |
| 12 marcas; todo entra; no estirar | C18; lector (relleno) |
| 13 sin título | el código lo imprime; C9 (un `antes` o `despues` con `# ` no se aplica) |

### Paso 3c · La carta

Mandan: secciones 2, 3, 11 y 14; anexo A6.

```
Sos el escritor. Armás la carta final: las palabras de {{NOMBRE}} para los suyos, con los ids que el plan manda a "carta", en ese orden. Es primera persona y es su voz más directa: casi textual, pero escrita como una carta que se lee de un tirón, no como una transcripción. No agregás nada. Leé la ficha <voz>. Mandan las secciones 2, 3, 11 y 14 de la guía y el anexo A6.

Bordes:
1. Entra todo lo que les dice a ellos (todos los ids del plan) y solo eso. Un gusto, un dato o una historia que ya está en <libro_hasta_aca> queda afuera; si una respuesta mezcla, queda lo que les dice a ellos, con otras palabras que las del capítulo.
2. Cuando le habla a alguien, el párrafo arranca con el nombre; lo que le dijo a la misma persona en dos respuestas va junto.
3. Limpiás muletillas, falsos arranques, repeticiones y lo que le habla al entrevistador; ordenás y redactás en oraciones enteras. No agregás ideas, consuelos ni conclusiones.
4. Ninguna frase cortada por el audio: se cierra con lo que dijo en otra respuesta (con ese id) o se corta antes, en una oración entera.
5. Encabezado: "Para" y a quiénes está dedicado el libro (ficha). Cierra con la frase del plan. El título lo pone el código: no lo escribas.
6. Cada párrafo termina con la marca [[R..]] de las respuestas que usó. Ningún id del plan queda sin marca.

Mal: "Valoro mucho tu paciencia, y todo lo… por la familia." → Bien: "Valoro mucho tu paciencia. [[R55]]" (o entera, si la dijo entera en otra respuesta).
Mal: "Marcela, eh, vos sabés, vos sabés que yo siempre, que siempre te voy a agradecer." → Bien: "Marcela: vos sabés que siempre te voy a agradecer. [[R56]]"

Devolvé solo el texto en markdown, sin título.
```

| Borde | Quién controla |
|---|---|
| 1 todo lo de "familia" y solo eso | C19; lector (carta_ajena); C7 |
| 2 nombre al frente | lector |
| 3 limpio, sin agregar | verificador (inventado, sentimiento); lector (transcripto) |
| 4 frases cortadas | C2 |
| 5 encabezado y cierre | C6 (la frase de cierre es textual) |
| 6 marcas; todo entra | C18, C19 |

### Paso 3d · Antes de cerrar

Solo si `plan.antes_de_cerrar.ids` no está vacío. Recibe lo mismo que la carta. Mandan: secciones 2, 3, 11 y 14; anexo A6.

```
Sos el escritor. Armás "Antes de cerrar": lo que {{NOMBRE}} dice de su vida entera mirando para atrás, con los ids que el plan manda a "antes_de_cerrar", en ese orden. Primera persona, con sus palabras y su tono, ordenado y limpio para que se lea de corrido; nada agregado. Leé la ficha <voz>. Mandan las secciones 2, 3, 11 y 14 de la guía y el anexo A6.

Bordes:
1. Entran todos los ids del plan y solo eso. Nada que ya esté contado en un capítulo de <libro_hasta_aca>.
2. No le habla a la familia (eso es la carta). Ninguna idea, consuelo ni conclusión agregada; ningún "aprendí que" que no dijo.
3. Limpiás muletillas, falsos arranques y repeticiones; ordenás y redactás en oraciones enteras.
4. Ninguna frase cortada por el audio.
5. Corto: lo que dijo, bien dicho. El título lo pone el código: no lo escribas.
6. Cada párrafo termina con la marca [[R..]] de las respuestas que usó. Ningún id del plan queda sin marca.
7. Como mucho un golpe (frase corta suelta o frase destacada), y solo si es una frase suya que lo sostiene.

Mal: "Si tuviera que resumir mi vida, diría que fue una lucha constante que me hizo más fuerte." (no lo dijo) → Bien: "Lo más duro fue quedarme sola con el negocio. Me apoyé en Chiche y en el bastidor; con eso fui tirando. [[R62]]"

Devolvé solo el texto en markdown, sin título.
```

| Borde | Quién controla |
|---|---|
| 1 todo lo de "balance" y solo eso | C23; C7; lector (repetido) |
| 2 nada agregado | verificador; lector (carta_ajena) |
| 3 limpio | lector (transcripto) |
| 4 frases cortadas | C2 |
| 5 corto; sin título | lector (relleno) |
| 6 marcas | C18, C23 |
| 7 un golpe | C1 |

### Paso 4 · Control de hechos (otro rol)

Recibe: guía (secciones 2, 9, 14 y 15), ficha, respuestas, registro, libro con marcas, `<presentes>` (C16) y `<pasados>` (C27). No recibe el plan ni los prompts de escritura.

```
Sos el verificador. No escribiste el libro y no lo vas a arreglar: lo comparás con el material y listás los hechos que no cierran. Manda la sección 15, parte 1, de la guía; para juzgar, las secciones 2, 9 y 14. El libro es una novela en primera persona: el escritor tiene que narrar, ordenar y redactar con otras palabras que las de la entrevista. Eso no es un problema. Tu trabajo son los hechos: quién, qué, cuándo, dónde, cuánto, qué se dijo, por qué y qué sintió. Cada párrafo del libro termina con [[R..]]: las respuestas que el escritor dice haber usado; empezá por ahí, pero el libro no puede decir nada que no esté en alguna respuesta o en la ficha.

Para cada pieza del libro (primera_pagina, cap_N, antes_de_cerrar, sus_frases, carta), con lista, no de memoria:
1. Tiempo verbal: lo manda el registro. Lo que está en "hoy", en "rasgos_hoy" o con estado "sigue_hoy" va en presente; lo que tiene estado "termino", en pasado. Toda oración en presente se busca: si terminó, o nada dice que siga, es "presente". <presentes> trae las que encontró el código: mirá cada una, más las que encuentres vos. <pasados> trae las oraciones en pasado que nombran a una persona con estado "sigue_hoy": si lo que dice sigue siendo así hoy, es "pasado"; si terminó de verdad, no es problema. Es el control más importante.
2. Nombres: cada nombre está en el material o en la ficha; cada persona tiene un solo nombre (o nombre y apodo juntados una vez).
3. Fechas, edades, plazos y cantidades: cada número está en el material como número.
4. Lugares: con ese nombre en el material.
5. Citas: lo que va entre rayas, entre comillas o destacado (">") es textual de una respuesta (se pueden sacar muletillas). La narración no tiene que ser textual.
6. Motivos ("porque", "por eso") y sentimientos con nombre: tienen su frase en el material.
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

Recibe: la guía entera, el libro sin marcas y `<referencias>` (C25). No recibe el material ni el plan.

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
Sos el cotejador. No escribiste el libro: comparás cada respuesta con lo que el libro hizo con ella y listás lo suyo que se cayó. Todo entra, aunque sea en una línea: lo que buscás es lo que la familia va a extrañar. Cada párrafo del libro termina con [[R..]]: las respuestas que usó; empezá por ahí, pero una cosa cuenta como entrada si está en cualquier parte del libro, dicha igual o narrada con otras palabras.

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

`frase` es textual de la respuesta (C6 lo comprueba; si no, se descarta). Va al arreglo de la pieza que le toca como "falta frase de R..: «…»"; C24 comprueba que entró.

### Paso 6 · Arreglo (una llamada por pieza con problemas)

Una sola ronda. La llamada es la misma de escritura de esa pieza (3a, 3b, 3c o 3d), con `<pieza_actual>` (con marcas, sin la línea del título) y `<problemas>` (código, verificador, lector y cotejo juntos, numerados; un `titulo_generico` no entra), y este agregado al final. Devuelve solo los cambios; el código los aplica.

```
Esta pieza volvió del control con problemas (<problemas>). No la reescribas: está en <pieza_actual> y queda como está, letra por letra, salvo los tramos que cambies. Cada cambio tiene que dejar el tramo mejor contado, no más cerca de la transcripción: novela en primera persona, con el tono de quien narra, sin hechos agregados. Devolvé solo la lista de cambios, con las mismas reglas de arriba (marcas [[R..]] incluidas) y, además:
1. Cada problema cambia el texto marcado. Un problema de forma (transcripto, se cae, peso enterrado, nombre repetido, recurso de más, hoy fuera de lugar, reflexión ajena, primera página, cierre que explica, lista, repetido, frase cortada, molde, botón, no suena, ia, bolsa, carta ajena, referencia colgada, control del código) no se discute: se cambia. Un "transcripto" se arregla narrando ese tramo (ordenar, juntar, limpiar), con los mismos hechos. Un "peso enterrado" se arregla sacando el hecho de la enumeración y dándole su párrafo, sin agregarle nada. Un "nombre repetido", con "él", "ella", la relación o juntando oraciones. Un "hoy fuera de lugar" se saca (lo cuenta el último capítulo), salvo una línea de consecuencia al final de su historia.
2. Un problema de hecho (presente, pasado, nombre, fecha, lugar, cita, motivo, sentimiento, inventado, confirmado, delicado) se cambia con la corrección mínima, sin desarmar la narración; o, solo si tenés una respuesta que lo respalda tal cual, lo marcás "disputa" con el id y la frase textual de esa respuesta, y "antes" y "despues" vacíos. No decidís vos: lo decide el verificador.
3. Arreglar nunca saca a nadie ni nada: una lista se arregla contando a uno y nombrando al resto en media línea. "Falta R..": ese contenido entra, con su marca, aunque sea en una línea. "Falta frase de R..: «…»": esa frase entra con sus palabras, donde habla de eso.
4. Cada cambio: "problema" es la lista de números que resuelve; "antes" es un tramo COPIADO EXACTO de <pieza_actual> (con sus marcas [[R..]]: una oración, o uno o más párrafos enteros, lo mínimo que haga falta); "despues" es cómo queda ese tramo, con la marca al final de cada párrafo. Para agregar algo, "antes" es el párrafo donde entra y "despues" ese párrafo con lo agregado. Un "antes" que no está tal cual no se aplica y el problema queda abierto.
5. Todo lo que no está en un "antes" queda igual. No se suma nada del material que no estuviera en el plan para esta pieza. El título no se toca: no va en ningún "antes" ni "despues". Un arreglo no suma un tercer golpe al capítulo.

Mal (lista arreglada sacando gente): antes "Mis amigas del barrio eran la Negra, Susana, Tere y la Beba. [[R21]]", despues "La Negra venía a la siesta a tomar mate. [[R21]]" → Bien: despues "La Negra venía a la siesta a tomar mate; las otras del barrio, Susana, Tere y la Beba, venían a comprar. [[R21]]"
Mal (arreglo que vuelve a transcribir): problema "inventado: 'una tarde de invierno'", despues "Y bueno, una vez entraron a robar, viste. [[R35]]" → Bien: despues "Una vez entraron a robar. [[R35]]"
Mal (deriva): un problema en el párrafo 3 y "antes" con los párrafos 1 a 6. → Bien: antes el párrafo 3 solo.

Devolvé solo el JSON del esquema de cambios.
```

Esquema de cambios:

```json
{"cambios": [{"problema": [1], "resultado": "cambiado", "antes": "", "despues": "", "disputa_id": "", "disputa_frase": ""}]}
```

`resultado` ∈ cambiado | disputa. En una disputa, `antes` y `despues` van vacíos. No existe "falsa alarma".

**Qué hace el código con el arreglo (C9):** aplica cada `antes` → `despues` por reemplazo exacto; un `antes` que no está no se aplica y sus problemas quedan abiertos; un `antes` o `despues` que empiece con `# ` no se aplica; cada frase marcada "cambiado" ya no tiene que estar; "disputa" solo vale en problemas de hecho; después corre otra vez los controles y el repaso del paso 4. Cada disputa va a una llamada corta al verificador (mismos documentos del paso 4) con esta instrucción:

```
El escritor dice que esta frase del libro está respaldada por una respuesta. Frase del libro: "{{FRASE}}". Respuesta {{ID}}, frase que cita: "{{CITA}}". ¿La respuesta respalda los hechos de la frase tal como está en el libro (quién, qué, cuándo, dónde, cuánto, qué se dijo, y el tiempo verbal)? Que esté narrada con otras palabras no importa. Contestá solo {"respalda": true} o {"respalda": false, "por_que": ""}.
```

Si respalda, el problema se cierra; si no, va al informe. Una disputa por problema. C26 (el verificador que oscila) resuelve con esta misma llamada.

| Borde | Quién controla |
|---|---|
| 1–3 cada problema cambia; disputa solo en hechos; nadie se cae | C9; verificador (disputa); C21 |
| 4 `antes` exacto; `despues` con marcas | C9; C18 |
| 5 lo demás igual; título intacto; sin tercer golpe | C9; C1 otra vez; aviso de deriva si quedan idénticos menos del 70 % de los párrafos sin problema |

---

## 4. Controles por código

Normalización: minúsculas, sin tildes, espacios colapsados. Las marcas `[[R..]]` se quitan antes de todo control de texto salvo C9, C18 y C19. Las citas que C6 ya verificó se excluyen de C1, C10 y C15.

| # | Qué mira | Si falla |
|---|---|---|
| C1 | **Recursos con medida:** lista cerrada del anexo A2 (palabras, muletillas, moldes); negritas, viñetas o subtítulos en una pieza; más de dos rayas por párrafo fuera de diálogo. Los golpes (párrafo de una sola oración de menos de 12 palabras que no es diálogo, y línea destacada con ">") se cuentan por pieza y se marcan **solo a partir del tercero** | `ia` → arreglo |
| C2 | "…" o "..." en el texto | `cortada` → arreglo |
| C4 | Nombres propios que no están en respuestas, ficha ni registro | `nombre` → arreglo |
| C5 | Años de cuatro cifras que no están en respuestas ni ficha | `fecha` → arreglo |
| C6 | **Textual solo donde se cita:** cada tramo entre rayas de diálogo, entre comillas o destacado (">"), cada frase de "Sus frases" y el cierre de la carta es subsecuencia de una respuesta (sin muletillas). La narración no tiene que ser textual | `cita` → arreglo; en Sus frases, la frase sale y va al informe |
| C9 | Arreglo por reemplazos exactos; título intacto; frase marcada "cambiado" ya no está; disputa solo en hechos; % de párrafos idénticos | ver paso 6 |
| C10 | Anexo A6: gerundio al inicio, pasiva con "por", diálogo con comillas, trato mezclado, diagnósticos que no dijo | `ia` / `inventado` → arreglo |
| C12 | **Títulos sin hecho fuerte:** cada palabra del título está en su id (textual) o en el material (armado); puede salir de cualquier episodio del capítulo; sin valoraciones (etapa, linda, hermosa, gran, sueños, luchas, difícil, feliz, importante, especial, inolvidable…); no es solo un nombre; no hay dos iguales | reintento del paso 2 |
| C13 | **Plan por etapas:** cada episodio una sola vez; los `balance` en Antes de cerrar; escena solo con `es_escena`; momento clave con escena como escena; ≥1 escena por capítulo y apertura en una escena; **momento clave con peso "clave", nunca "linea"**; tipos de apertura y cierre distintos del capítulo anterior; una presentación por persona; último capítulo con hilo de hoy, columna e imagen final (que es su cierre); **un `dato`, `gusto` o `reflexion` `sigue_hoy` fuera del último capítulo solo con `por_que_aca`**; primera página con lo suyo; carta con título | reintento del paso 2 |
| C14 | Registro (mismo esquema y mismas reglas que la v3) | reintento del paso 1 |
| C18 | **Todo entra:** cada párrafo con marca; cada respuesta (no "paso", no `no_poner`) en alguna marca o en Sus frases | `sin_marca` / "falta R.." → arreglo |
| C19 | **A quién le habla:** episodios `familia` en la carta; dedicados sin mensaje, con faltante | plan: reintento; carta: arreglo |
| C21 | **Nadie se cae:** cada persona con hechos aparece por nombre o apodo | `lista` → arreglo ("falta <nombre>") |
| C23 | **El balance entra** en Antes de cerrar | arreglo |
| C24 | **Lo del cotejo entró** después del arreglo | al informe |
| C25 | **Referencias colgadas** ("ese día", "ahí", "esa casa"…), con pieza y párrafo | no bloquea: `<referencias>` del paso 5 |
| C26 | **El verificador oscila** en el repaso (presente ↔ pasado, un nombre por otro) | disputa automática; si respalda, al informe |
| C27 | **Pasado sobre una persona viva:** oraciones en pasado que nombran a alguien `sigue_hoy` | no bloquea: `<pasados>` del paso 4 |
| C28 | **Lo de hoy, una línea al final de su historia:** en un capítulo que no es el último, una oración fuera de diálogo con "hoy", "actualmente", "al día de hoy", "en la actualidad", "hasta hoy" pasa solo si es la última de su párrafo y la única con "hoy" en ese párrafo | `hoy_en_pasado` → arreglo |
| C29 | **Nombre repetido (nuevo):** el mismo nombre o apodo de `registro.personas` tres veces o más en tres oraciones seguidas | `repetido` → arreglo ("usá él/ella, la relación, o juntá las oraciones") |

Siguen como en la v3, sin cambios: C3 (primera oración), C7 (seis palabras iguales en dos piezas), C8 (palabras de la pregunta), C15 (bolsa en el último capítulo), C16 (`<presentes>`), C17 (presentaciones repetidas), C20 (último capítulo: máx. 2 reflexion/gusto e imagen final). Se van como control: C11 (máximo de palabras) y C22 (70 % de detalles: pasa al prompt del 3b, borde 6).

Falsas alarmas: si un rol no repite un problema que marcó el código, igual va al arreglo. Lo que el código marca mal de forma repetida se anota en el informe para ajustar el control, nunca para saltearlo.

---

## 5. Reintentos y topes

| Dónde | Cuántas veces | Después |
|---|---|---|
| Paso 1 (C14) | 2 reintentos con el error | se detiene y avisa |
| Paso 2 (C12, C13, C19, C20) | 2 reintentos con el error | se detiene y avisa |
| Paso 3 (controles sobre la pieza recién escrita) | entra en la ronda única del paso 6 | lo abierto, al informe |
| Paso 6 | **1 ronda** por pieza | repaso del paso 4 y controles; lo abierto, al informe |
| Disputa | una por problema | decide el verificador |
| Pasos 4, 5 y 5b | 1 reintento si el JSON no cumple el esquema | se sigue sin esa lista y se avisa |

Lo que llega al informe no se arregla a mano en el libro: se arregla la receta, o se le pregunta al narrador.

---

## 6. Qué entrega el circuito

- `libro.md`: título, primera página, capítulos, Antes de cerrar, Sus frases, carta. Sin marcas (quedan en `libro-con-marcas.md`).
- `informe.md`: `faltantes` del plan (momentos clave sin escena, etapas sin escena, mensajes que no están: lo que tiene que repreguntar la entrevista), problemas abiertos por pieza, títulos que el lector marcó, lo que el cotejo encontró y no entró, oscilaciones del verificador, disputas, avisos de deriva, falsas alarmas del código, costo por paso.

**Quién decide.** El juez (con [`vara.md`](vara.md)) filtra lo que empeora. Ninguna versión se declara mejor sin que Naza la lea contra la anterior.
