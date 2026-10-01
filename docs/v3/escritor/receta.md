# Receta del escritor (V3, de cero)

**Estado: borrador de Fable, 01/10/2026 (receta nueva, no deriva de la v6). Naza (01/10): sin máximo de palabras por pieza. v2 (01/10): cambios de la prueba 1** ([`prueba-1-entrevista-vieja.md`](prueba-1-entrevista-vieja.md): a quién le habla cada episodio y la carta con título; marcas `[[R..]]` de rastreo en cada párrafo; último capítulo con una sola historia; tiempo verbal en las dos direcciones; primera página entera; detalles de cada escena). Aprobados por Naza.

Esta receta hace cumplir la [guía](guia-biografia.md) aprobada por Naza. Son los textos EXACTOS que recibe el modelo en cada paso, más lo que hace el código entre paso y paso. El modelo es el mismo en todos los pasos y no se fija acá.

**Principio (acordado con Naza).** La IA elige, dentro de bordes, y alguien que no es ella controla después. Por eso:
- Cada prompt es corto: qué hace el paso, sus bordes duros (pocos y chequeables) y uno o dos ejemplos. El oficio entero va como documento: la guía completa entra en cada llamada como `<guia>`, y el prompt dice qué secciones mandan en ese paso.
- Todo borde tiene quién lo controla: el código (controles C1–C22, abajo), el verificador (paso 4) o el lector (paso 5). Un borde que nadie puede controlar no es un borde: es un deseo, y no está acá.
- El que escribe no se revisa. El control de hechos y la lectura de corrido los hacen otros roles que no ven las instrucciones del escritor ni el plan. El arreglo dice problema por problema qué cambió, y el código comprueba que el texto marcado cambió de verdad.
- Si un control falla, la pieza se reescribe entera con los problemas a la vista. Nunca se parcha a mano. Hay tope de reintentos y, si se agota, el libro se entrega con la lista de lo que quedó abierto: se dice, no se disimula.

**Regla para quien edite esta receta:** los ejemplos son inventados (Nélida, la mercera de la guía, u otro ficticio). Nunca sale nada de la vida de un narrador real.

---

## 1. El recorrido

| # | Paso | Quién | Qué deja |
|---|---|---|---|
| 0 | Prepara `<ficha>` (con `<confirmado_por_el_narrador>` si hubo dashboard) y `<respuestas>` (id, pregunta, bloque, texto; las marcadas "paso" se sacan) | código | entradas |
| 1 | **Registro de hechos** (rol: lector del material) | modelo | `registro.json` |
| 1b | Valida el registro (C14). Si falla, reintenta el paso 1 con el error (máx. 2) | código | registro válido |
| 2 | **Plan del libro** (rol: editor) | modelo | `plan.json` |
| 2b | Valida el plan (C12, C13). Si falla, reintenta el paso 2 con el error (máx. 2). Arma los títulos impresos | código | plan válido, `faltantes` |
| 3a | **La primera página** (rol: escritor) | modelo | `primera_pagina.md` |
| 3b | **Capítulos, uno por uno en orden**, cada uno con lo ya escrito y la ficha de voz releída | modelo | `capitulo_NN.md` |
| 3c | **La carta** | modelo | `carta.md` |
| 3d | Arma "Sus frases" desde el plan (C6 sobre cada frase) y los controles de forma y de rastreo sobre cada pieza (C1–C3, C5–C8, C10, C15, C17, C18, C20–C22). Lo que falla vuelve a 3 como arreglo (paso 6) | código | libro entero (con marcas `[[R..]]`) |
| 4 | **Control de hechos** (otro rol: verificador; ve guía, ficha, respuestas, registro y libro CON marcas; no ve el plan ni los prompts del escritor) | modelo | `hechos.json` |
| 5 | **Lectura de corrido** (otro rol: lector exigente; ve guía y libro SIN marcas; no ve el material) | modelo | `lectura.json` |
| 6 | **Arreglo**: por pieza con problemas, una llamada con el prompt de escritura de esa pieza + `<problemas>`; devuelve la pieza entera (con marcas) y la lista de cambios. El código verifica (C9) y vuelve a pasar C1–C22 y el paso 4 sobre la pieza cambiada. Máx. 2 rondas; 3.ª: reescritura de cero con `<evitar>`; si sigue, va al informe | modelo + código | piezas corregidas |
| 7 | Borra las marcas e imprime; informe para Naza: `faltantes` del plan, problemas abiertos, disputas resueltas en contra del escritor, falsas alarmas del código | código | `libro.md`, `informe.md` |

Orden del libro: título del libro, la primera página (sin título propio), capítulos, "Sus frases" (si hay), la carta (con su título, si hay).

---

## 2. Cómo se arma cada llamada

Documentos primero, siempre en este orden (lo que se repite entre llamadas queda en caché); las instrucciones del paso al final.

```
<guia>…</guia>                     la guía entera (guia-biografia.md), en todos los pasos
<ficha>…</ficha>                   datos de ficha + <confirmado_por_el_narrador> si hubo dashboard
<respuestas>…</respuestas>         cada una: id R01…, pregunta, bloque, texto (sin las "paso")
<registro>…</registro>             desde el paso 2
<plan>…</plan>                     desde el paso 3 (no en el 4 ni en el 5)
<libro_hasta_aca>…</libro_hasta_aca>   en 3b, 3c y 6: las piezas ya escritas, en orden
<libro>…</libro>                   en 4: el libro entero con marcas [[R..]]; en 5: sin marcas
<voz>…</voz>                       en 3a, 3b, 3c y 6: la ficha de voz del registro, copiada entera
<problemas>…</problemas>           solo en 6
INSTRUCCIONES DEL PASO
```

Antes de `<guia>` va esta línea fija: `Los ejemplos de la guía son de una narradora inventada (Nélida). Quien narra en este libro es otra persona: su nombre, su género y su trato están en la ficha.`

`<voz>` es el bloque `voz` del registro, copiado tal cual, puesto justo antes de las instrucciones en cada llamada de escritura. Es la "ficha releída antes de cada capítulo" del anexo A3: el modelo la tiene al lado de lo que escribe, no enterrada en el registro.

En el paso 4 y el 5 no entra `<plan>` ni ningún prompt de escritura: el verificador y el lector no saben qué se le pidió al escritor; juzgan lo que hay.

**Marcas de rastreo.** En 3a, 3b, 3c y en el arreglo, el escritor cierra cada párrafo con `[[R12,R15]]`: los ids de las respuestas que usó en ese párrafo. Con ellas el código controla que todo entró (C18) y el verificador sabe contra qué respuesta mirar cada párrafo. El código las borra antes de la lectura de corrido (paso 5) y antes de imprimir. Una frase de "Sus frases" lleva su id en el plan, no marca.

Huecos que llena el código: `{{N}}`, `{{TITULO}}` (título impreso del capítulo), `{{NOMBRE}}` (nombre de pila de quien narra, de la ficha).

---

## 3. Los prompts

### Paso 1 · Registro de hechos

Mandan: anexo A1 (errores de lectura), A3 (ficha de voz), A4 (el hilo sale de ella), A5 (momentos), secciones 5 (terminó / sigue) y 10 (la verdad).

```
Sos el lector del material. No escribís el libro: leés todo y armás el registro de hechos del que después se escribe. Lo que no esté en el registro no entra al libro. Mandan los anexos A1, A3, A4 y A5 de la guía, y las secciones 5 y 10.

Bordes:
1. Cada entrada lleva los ids de las respuestas que la respaldan (R01…) o "FICHA" si sale de la ficha. Sin id no hay entrada. Guiate por lo que dice la respuesta, nunca por su pregunta: la pregunta puede traer un dato equivocado.
2. Una persona, un id: nombre, apodos y relación juntos. Si la ficha confirmó que dos nombres son la misma persona, es una. Si no se puede saber, van separadas y una duda.
3. Toda persona, lugar, trabajo, pareja, proyecto y episodio lleva "estado": "termino", "sigue_hoy" o "no_se_sabe". "sigue_hoy" solo si lo dice una respuesta del presente o la ficha. Lo que es verdad hoy va además en "hoy"; lo que sigue siendo verdad de una persona, dicho en presente ("no fuma"), en sus "rasgos_hoy".
4. Un episodio por historia aunque la haya contado en varias respuestas: la mejor contada de base, lo demás en "variantes", todos los ids. Anécdotas parecidas (tres veranos) son un episodio con variantes. Si es escena, "detalles" lleva TODOS los detalles concretos que dio (objetos, lugares, frases dichas, gestos, cantidades), cortos y con sus palabras.
5. Ninguna respuesta queda sin lugar: cada id está en un episodio (episodio, dato, reflexión, gusto o mensaje) o en "sin_lugar" con motivo.
6. Cada episodio dice a quién le habla: "familia" (deseo, consejo, agradecimiento o pedido a los suyos, aunque suene a reflexión), "lector" o "nadie"; y a quién nombra, en "a_quien_nombres".
7. Fechas y edades como las dijo, "segura": true solo si dijo el número o está en la ficha. No calculás años.
8. Lo que dijo con duda ("creo", "no sé si"), lo que contradice otra respuesta y los nombres que suenan mal transcriptos van a "dudas", no como hecho. Las frases que el audio cortó van a "frases_cortadas", con el cierre posible si lo dijo entero en otra respuesta.
9. La ficha de voz: 15 a 20 frases textuales (copiadas; solo se sacan muletillas) que muestren cómo habla, sus palabras propias, sus dichos, si vosea o tutea.
10. Si pidió que algo no esté ("esto no lo pongas"), va en "no_poner" y el episodio queda marcado.

Mal: Raúl (marido, chapista) con estado "sigue_hoy" porque ella dice "Raúl es muy terco". → Bien: estado "termino" (R40: murió en 2014), y "Raúl es muy terco" en la ficha de voz como ejemplo de cómo habla de él.
Mal: "Lo que les diría a mis hijos es que no se peleen por la casa" como tipo "reflexion", a_quien "nadie". → Bien: tipo "mensaje", a_quien "familia", a_quien_nombres ["Marcela", "Gustavo", "Pablo"].
Mal: la noche de la calculadora, detalles []. → Bien: ["la calculadora en la mesa de la cocina", "que sumara yo", "no daba", "Tito ladró por el camión de la basura"].

Devolvé solo el JSON del esquema.
```

Esquema de salida (`registro.json`):

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

Valores cerrados: `tipo` ∈ episodio | dato | reflexion | gusto | mensaje. `momento_clave` ∈ "" | alto | bajo | giro | mas_temprano | infancia | adolescencia | decision_dificil. `estado` ∈ termino | sigue_hoy | no_se_sabe. `dudas.tipo` ∈ nombre | fecha | identidad | contradiccion | transcripcion. `a_quien` ∈ familia | lector | nadie. `detalles`: solo en episodios con `es_escena: true` (en los demás, `[]`). `rasgos_hoy`: lo que sigue siendo verdad de esa persona, dicho en presente, con ids. `confirmados`: una entrada por cada línea de `<confirmado_por_el_narrador>`, con dónde quedó usada.

| Borde | Quién controla |
|---|---|
| 1 ids en toda entrada; ids existen | C14 |
| 2 una persona, un id | C14 (dos personas con mismo nombre y relación → error); verificador (nombres) |
| 3 estado en todo; "hoy"; rasgos_hoy | C14 (campo presente); verificador (presente y pasado contra material) |
| 4 un episodio por historia; detalles de cada escena | lector (repetido); C14 (escena con `detalles` vacío → error); C22 en el texto |
| 5 ningún id sin lugar | C14; C18 en el texto |
| 6 a quién le habla | C14 (campo presente; a_quien_nombres son personas del registro); C19 en el plan y el texto |
| 7 fechas sin calcular | C14 (`segura` true solo si el número está en sus ids o en la ficha) |
| 8 dudas y frases cortadas | C14 (todo "…" de una respuesta usada tiene entrada en frases_cortadas) |
| 9 ficha de voz textual | C14 (cada frase es subsecuencia de su id; 15–20) |
| 10 no_poner | C14 (episodio marcado), verificador |

### Paso 2 · Plan del libro

Mandan: secciones 1, 2, 6, 7, 8; anexos A4, A5, A7.

```
Sos el editor. Con el registro armás el plan del libro: qué capítulos hay, qué va en cada uno y con qué forma. No escribís prosa. Mandan las secciones 1, 2, 6, 7 y 8 de la guía y los anexos A4, A5 y A7.

Bordes:
1. Cada capítulo tiene un hilo en una oración con un verbo de cambio, dicho con palabras del registro (de quien narra o de lo que repite), y por lo menos un episodio con es_escena true. Una etapa sin escena no es capítulo: sus episodios van al capítulo vecino.
2. Cada episodio del registro va a un solo capítulo, con una forma: escena, resumen, media_linea, remate (una reflexión pegada a la escena que la explica), sus_frases o carta. Ninguno queda afuera, salvo los de no_poner.
3. Los momentos clave del registro (alto, bajo, giro, más temprano, decisión difícil) van como escena, nunca como resumen.
4. La primera página usa TODO lo de "como_se_presenta" y "cosas_concretas_suyas" que no se cuente en un capítulo: al terminarla, el lector sabe qué hace, de dónde es y cómo es. Nada que terminó contado como de hoy; ningún golpe para impactar.
5. Título del libro y de cada capítulo: una frase textual del registro (con id) que tenga una cosa que se pueda ver, o uno armado solo con palabras que quien narra usó. Si no hay, vacío: el código pone la etapa y los años. Nunca una valoración, un nombre que el lector no conoce todavía ni el final del capítulo.
6. Apertura y cierre de cada capítulo con tipo. Dos capítulos seguidos no repiten tipo de apertura ni de cierre.
7. Cada persona se presenta en un solo capítulo: el primero donde hace algo. Antes de ese, solo nombre y relación.
8. El último capítulo cuenta UNA sola historia: un episodio sigue_hoy con es_escena true; si no hay ninguno, el episodio escena más reciente. Las reflexiones y gustos de hoy van al capítulo donde se la ve hacerlo o de remate de su escena; en el último, como máximo dos que no sean media línea.
9. Todo episodio con a_quien "familia" va a "carta.ids"; si además es parte de una escena, también en media línea en su capítulo, con otras palabras. La carta lleva título: una frase suya o "Para los míos" / "Antes de cerrar".
10. Lo que el material no trae (una etapa sin escena, un hoy sin momento, una duda que deja vago un capítulo) va en "faltantes": se dice, no se disimula.

Mal: capítulo "La mercería", doce episodios, hilo "sus años en la mercería". → Bien: hilo "cómo la mercería pasó de ser el sueño de Raúl a ser mi lugar" (lo dijo así en R14 y R22), escena ancla: la noche de la calculadora (E07).
Mal: último capítulo "Hoy", con "lo que heredé de mamá", "mis gustos", "la mesa de los míos" y "qué pienso de la soledad". → Bien: último capítulo "Dos cuadras hasta lo de Marcela", hilo: la primera vez que fue sola a la casa nueva (E31, sigue_hoy, es_escena); "lo que heredé de mamá" de remate en el capítulo de la infancia; los gustos en el tramo de la tarde con el bastidor (E29).
Mal: "Que Gustavo no se pelee más con Pablo por la casa" (E44, familia) solo como remate del capítulo de la casa. → Bien: E44 en carta.ids; en ese capítulo, media línea.

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
    "piezas": [{"episodio": "E..", "forma": "escena", "pegado_a": ""}],
    "presenta": ["P01"], "nombra_sin_presentar": ["P03"],
    "es_ultimo": false, "hilo_de_hoy_ids": []
  }],
  "sus_frases": [{"id": "", "texto": "", "contexto": ""}],
  "carta": {"titulo": "", "titulo_id": "", "para": "", "ids": [], "cierre": {"id": "", "texto": ""}},
  "faltantes": [{"que": "", "donde": ""}]
}
```

Valores cerrados: `apertura.tipo` y `cierre.tipo` ∈ escena | objeto | persona_entra | dia_comun | fecha | frase_suya | gesto. `forma` ∈ escena | resumen | media_linea | remate. Los episodios que van a "Sus frases" o a la carta no están en `piezas`, salvo un episodio "familia" que además es parte de una escena: ese está en `carta.ids` y en `piezas` como `media_linea`. `primera_pagina.que_dice_de_si_ids`: todos los ids de `como_se_presenta` y `cosas_concretas_suyas` que no estén en una pieza de capítulo. `carta.titulo`: frase suya (con `titulo_id`) o "Para los míos" / "Antes de cerrar" (sin id); el código imprime `# <titulo>`. `contexto` de Sus frases: hasta 20 palabras, solo lo que el material dice.

| Borde | Quién controla |
|---|---|
| 1 hilo con verbo de cambio y escena | C13 (≥1 pieza escena por capítulo; `hilo_ids` no vacío); lector (sin_hilo) |
| 2 cada episodio una vez | C13 |
| 3 momentos clave en escena | C13 |
| 4 primera página entera | C13 (cada id de `como_se_presenta` y `cosas_concretas_suyas` está en `primera_pagina` o en una pieza); verificador (presente); lector (primera_pagina: al terminarla no se sabe quién es) |
| 5 títulos textuales o con palabras suyas; sin valoración | C12 (también el de la carta) |
| 6 variedad de apertura y cierre | C13 |
| 7 una presentación por persona | C13 (cada P en `presenta` de un solo capítulo); C17 en el texto |
| 8 último capítulo con una sola historia | C13 (`hilo_de_hoy_ids` con un episodio `sigue_hoy` y `es_escena`, o, si no existe ninguno, el episodio escena más reciente de la línea de tiempo); C20 (máx. 2 piezas reflexion/gusto que no sean media_linea, en el plan y en el texto); C15 en el texto |
| 9 carta: todo lo de "familia", con título | C19 (cada episodio `a_quien: familia` está en `carta.ids`; después, cada R de esos episodios está en una marca de la carta); C12 (título) |
| 10 faltantes | va al informe |

### Paso 2b · Lo que arma el código después del plan

- **Título impreso de cada capítulo:** `titulo.texto` si no está vacío; si está vacío, `etapa` más los años solo si `anios.seguros` es true ("De chica, 1954–1966"; sin años seguros, "De chica").
- **Sin máximo de palabras (Naza, 01/10):** el largo de cada pieza lo da lo que la persona contó. No hay tope ni meta; lo único que se controla es que no se estire (el lector marca `relleno`: repetir con otras palabras).
- **"Sus frases"**: lo arma el código desde `plan.sus_frases`: cada frase pasa C6 (textual); el `contexto` lo escribió el plan y lo revisa el verificador como cualquier otra oración.
- **Título de la carta:** el código imprime `# <carta.titulo>` arriba de la carta, después de "Sus frases".
- **Dónde va cada R** (para C18): el código arma, desde el plan y el registro, la tabla R → pieza (capítulo de su episodio, `sus_frases`, `carta` o `primera_pagina`); si un R está en dos piezas (episodio "familia" con media línea), vale cualquiera de las dos.

### Paso 3a · La primera página

Mandan: sección 1; para la voz, sección 9 y `<voz>`.

```
Sos el escritor. Escribís la primera página del libro: {{NOMBRE}} presentándose con su propia voz, con TODO lo que el plan puso en "primera_pagina": al terminarla, el lector sabe qué hace, de dónde es y cómo es. Leé entera la ficha <voz> antes de escribir. Manda la sección 1 de la guía; para la voz, la sección 9.

Bordes:
1. La primera oración no es "Me llamo…" ni un dato de ficha suelto.
2. Ninguna oración junta tres datos de ficha seguidos (nombre, año, hijos, ciudad…).
3. En el primer párrafo hay una cosa concreta suya del plan (objeto, lugar, gesto o frase textual); el resto de lo que dijo de sí entra después, contado como algo que hace o que dice, no como lista.
4. Cada cosa que afirma está en los ids del plan o en la ficha. Nada que terminó se cuenta en presente; lo que sigue hoy, en presente.
5. No se presenta a nadie más que a quien narra; si nombra a alguien, nombre y relación, nada más.
6. Sin hablar del libro ni del lector, sin valorar la vida, sin adelantar lo que viene.
7. Cada párrafo termina con la marca [[R..]] de las respuestas que usó. Ningún id del plan queda sin usar.

Mal: "Me llamo Nélida Ferraro, nací en Rosario en 1954, tengo tres hijos y vivo en Funes."
Mal (corta): "Soy Nélida, la de la mercería. Cerré hace años." y nada más, cuando dijo también que es rosarina, que borda y que no se tira ni un botón.
Bien: "Soy Nélida, la de la mercería de Echesortu. Así me conocen todavía, aunque cerré hace años. [[R01,R03]]" y sigue con la persiana, lo de rosarina del 54, el bastidor de la tarde, el botón. (Vale solo si dijo cada cosa.)

Devolvé solo el texto en markdown, sin título.
```

| Borde | Quién controla |
|---|---|
| 1 primera oración | C3 |
| 2 tres datos de ficha | C3 (más de un dato de ficha por oración en la primera página); lector |
| 3 cosa concreta; el resto sin lista | lector (primera_pagina, lista) |
| 4 con respaldo; presente y pasado | verificador (presente, pasado, inventado) |
| 5 una sola persona presentada | C17; lector |
| 6 sin hablar del libro | C1 (molde "este libro"); lector |
| 7 marcas; todo el plan usado | C18 (cada R de `primera_pagina` en una marca); lector (primera_pagina: al terminarla no se sabe quién es) |

### Paso 3b · Un capítulo

Mandan: secciones 2, 3, 4, 5, 7, 8, 9, 10; anexos A2, A6.

```
Sos el escritor. Escribís el capítulo {{N}} según el plan, en primera persona, con la voz de {{NOMBRE}}. Antes de escribir leé <libro_hasta_aca> (para no repetir nada ni volver a presentar a nadie) y la ficha <voz> entera. Mandan las secciones 2, 3, 4, 5, 7, 8, 9 y 10 de la guía y los anexos A2 y A6.

Bordes:
1. El hilo es el del plan. Entran todos los episodios del capítulo, en el orden y con la forma del plan: la escena entera y de una vez, con TODOS los "detalles" de su episodio; el resumen con los detalles que dio, hasta tres párrafos seguidos sin algo concreto; la media línea pegada a la historia a la que pertenece; el remate al cierre de su escena. Ningún episodio de otro capítulo.
2. Nada que no esté en los ids de los episodios del capítulo o en la ficha: ni dato, ni nombre, ni fecha, ni lugar, ni diálogo, ni sentimiento, ni motivo. Lo dudoso, vago; lo que no dijo, no se calcula.
3. Lo que terminó, en pasado. Lo que el registro tiene en "hoy" o en "rasgos_hoy", en presente.
4. Abre como dice el plan, sin resumir lo que viene ni ubicar con molde; cierra como dice el plan, sin explicar lo que significó ni anunciar lo que sigue.
5. Las personas que el plan presenta acá entran haciendo algo, de a una, con su relación y un detalle que dio; las ya presentadas, solo el nombre; las que se presentan después, nombre y relación. Ninguna lista de nombres, pero nadie se cae: los que no tienen historia van en media línea, con sus nombres.
6. Sus palabras: sin adjetivos de catálogo, metáforas ni sentimientos con nombre que no dijo; sin las palabras ni los moldes del anexo A2; diálogo con raya; sin gerundio de posterioridad; el trato (vos o tú) de la ficha de voz.
7. Lo delicado, como lo contó, con el detalle que dio y nada más. Lo de no_poner, no está.
8. Ninguna frase cortada del audio: se cierra con lo que dijo en otra respuesta o se corta antes, en una oración entera.
9. Cada párrafo termina con la marca [[R..]] de las respuestas que usó. Ningún id de los episodios del capítulo queda sin marca. Nunca estirar ni repetir con otras palabras.

Mal: "Con el transcurrir de los años, mi hija Marcela se convirtió en mi principal sostén." → Bien: "La nena, con los años, fue la que me bancó. Marcela, digo; para mí sigue siendo la nena. [[R33]]"
Mal (escena con detalles afuera): "Una noche Raúl me hizo sumar y no daba." cuando el episodio tiene la calculadora, la mesa de la cocina, Tito y el camión de la basura. → Bien: la escena con los cuatro.
Mal (cierre): "Y así fue como entendí que la familia es lo más importante." → Bien: "Raúl guardó la calculadora en el cajón y nunca más la sacó."

Devolvé solo el capítulo en markdown, empezando con "# {{TITULO}}".
```

| Borde | Quién controla |
|---|---|
| 1 hilo, episodios, formas y detalles del plan | lector (sin_escena, repetido); C7 (6+ palabras repetidas entre piezas); C22 (≥70 % de los detalles de cada escena en el texto) |
| 2 nada sin respaldo | verificador (inventado, nombre, fecha, lugar, cita, motivo, sentimiento); C4, C5, C6 |
| 3 pasado / presente en las dos direcciones | verificador (presente, pasado), con "hoy" y "rasgos_hoy" del registro |
| 4 apertura y cierre | lector (apertura_repetida, molde, cierre_explica); C1 (moldes de A2 y cierres "y así…") |
| 5 personas; nadie se cae | C17; C21 (cada persona con hechos está en el libro por nombre o apodo); lector (persona_dos_veces, lista, sin_presentar) |
| 6 voz y castellano | C1 (A2), C10 (A6); lector (no_suena, ia, deriva) |
| 7 delicado y no_poner | verificador (delicado) |
| 8 frases cortadas | C2 |
| 9 marcas; todo entra; no estirar | C18 (cada R del capítulo en una marca); lector (relleno, repetido) |

### Paso 3c · La carta

Mandan: sección 8 (la carta es para la familia) y 10 (frases cortadas; nada agregado).

```
Sos el escritor. Armás la carta final con los ids que el plan manda a "carta", en ese orden. Son sus palabras para los suyos, casi textuales. Leé la ficha <voz>. Mandan la sección 8 de la guía (la carta es para la familia) y la 10.

Bordes:
1. Entra todo lo que les dice a ellos (todos los ids del plan) y solo eso. Un gusto, un dato o una historia que ya está en <libro_hasta_aca> queda afuera; si una respuesta mezcla, se deja lo que les dice a ellos sobre eso, con otras palabras que las del capítulo.
2. Cuando le habla a alguien, el párrafo arranca con el nombre; lo que dijo a la misma persona en dos respuestas va junto.
3. Podés sacar muletillas, falsos arranques y lo que le habla al entrevistador, y cambiar una frase que contesta una pregunta que el lector no ve por su contenido. No podés agregar ideas, consuelos ni conclusiones.
4. Ninguna frase cortada por el audio queda cortada: se cierra con lo que dijo en otra respuesta (con ese id) o se corta antes, en una oración entera.
5. Encabezado: "Para" y a quiénes está dedicado el libro (ficha). Cierra con la frase del plan. El título lo pone el código: no lo escribas.
6. Cada párrafo termina con la marca [[R..]] de las respuestas que usó. Ningún id del plan queda sin marca.

Mal: "Valoro mucho tu paciencia, y todo lo… por la familia." → Bien: "Valoro mucho tu paciencia. [[R55]]" (o "…y todo lo que hiciste por la familia" si lo dijo entero en otra respuesta).
Mal: dejar afuera "que Gustavo y Pablo no se peleen por la casa" porque "ya está en el capítulo de la casa". → Bien: va en la carta, con sus palabras; en el capítulo quedó la media línea.

Devolvé solo el texto en markdown, sin título.
```

| Borde | Quién controla |
|---|---|
| 1 todo lo de "familia" y solo eso | C19 (cada R de un episodio `familia` en una marca de la carta); lector (carta_ajena); C7 (repetido con capítulos) |
| 2 nombre al frente | lector |
| 3 nada agregado | verificador (inventado, sentimiento) |
| 4 frases cortadas | C2 |
| 5 encabezado y cierre | C6 (la frase de cierre es textual); el título lo imprime el código desde `carta.titulo` |
| 6 marcas; todo entra | C18, C19; lector (relleno) |

### Paso 4 · Control de hechos (otro rol)

Recibe: guía, ficha, respuestas, registro, libro. No recibe el plan ni los prompts de escritura. Manda: sección 13 parte 1; para juzgar, secciones 5 y 10.

```
Sos el verificador. No escribiste el libro y no lo vas a arreglar: lo comparás con el material y listás lo que no cierra. Manda la sección 13, parte 1, de la guía; para juzgar, las secciones 5 y 10. No opinás de estilo: solo hechos, tiempo verbal y verdad. Cada párrafo del libro termina con [[R..]]: las respuestas que el escritor dice haber usado; empezá por mirar el párrafo contra esas, pero el libro no puede decir nada que no esté en alguna respuesta o en la ficha, lleve la marca que lleve.

Para cada pieza del libro (primera_pagina, cap_N, sus_frases, carta), con lista, no de memoria:
1. Presente: toda oración en presente ("hoy", "ahora", "sigue", "todavía", y los verbos en presente) se busca en el material. Si el material dice que eso terminó, o no dice que siga, es problema. Es el control más importante.
1b. Pasado: lo que el material dice que sigue hoy (bloque "hoy" y "rasgos_hoy" del registro: "no fuma", "sigue siendo mi amiga") y el libro cuenta en pasado, es problema tipo "pasado".
2. Nombres: cada nombre está en el material o en la ficha; cada persona tiene un solo nombre (o nombre y apodo juntados una vez).
3. Fechas, edades y plazos: cada número está en el material como número.
4. Lugares: con ese nombre en el material.
5. Diálogos y citas: textuales.
6. Motivos ("porque") y sentimientos con nombre: tienen su frase en el material.
7. Confirmados: cada dato de <confirmado_por_el_narrador> aparece usado en el libro, no solo no contradicho.
8. Frases cortadas: ningún "…" que venga del audio.
9. Lo delicado: como lo contó, sin nada agregado; lo que pidió que no esté, no está.

Para cada problema: la pieza, la frase exacta del libro (copiada), el tipo, qué dice el material (con ids) y la corrección mínima. Lo que el libro dijo vago porque era dudoso no es problema.

Mal: "'Yo iba todos los días con el termo' — podría ser exagerado." → Bien: "'Hoy sigo yendo a la feria los sábados' — R71: dejó de ir cuando se mudó a Funes. Pasa a pasado: 'Iba a la feria los sábados.'"
Bien (pasado): "'Chiche fumaba como un escuerzo' — R18: 'Chiche fuma como un escuerzo, todavía'. Pasa a presente."

Devolvé solo el JSON del esquema.
```

Esquema de salida (`hechos.json`):

```json
{"problemas": [{"n": 1, "pieza": "cap_3", "frase": "", "tipo": "presente", "material": "", "ids": [], "correccion": ""}]}
```

`tipo` ∈ presente | pasado | nombre | fecha | lugar | cita | motivo | sentimiento | confirmado_no_usado | cortada | delicado | inventado. `pieza` ∈ primera_pagina | cap_N | sus_frases | carta. `frase` se copia sin la marca `[[R..]]`.

### Paso 5 · Lectura de corrido (otro rol)

Recibe: guía y libro. No recibe el material ni el plan. Manda: sección 13 parte 2; para reconocer, secciones 1 a 9 y anexos A2, A3, A6.

```
Sos el lector exigente. No escribiste el libro y no tenés el material: lo leés entero, de corrido, como lo va a leer la familia, y marcás lo que no se lee como libro. Manda la sección 13, parte 2, de la guía; para reconocer cada cosa, las secciones 1 a 9 y los anexos A2, A3 y A6.

Marcá solo lo que está en la lista de la parte 2: la primera página (si al terminarla no sabés quién es: qué hace, de dónde es, cómo es; o si abre con ficha o con un golpe); cada capítulo (¿se puede decir el hilo en una oración?, ¿tiene una escena?, ¿la primera y la última oración muestran un cambio?); aperturas o cierres repetidos o que explican; títulos que servirían para cualquier vida; personas presentadas dos veces, en lista, o nombradas sin que se sepa quién es; saltos de tiempo que confunden y puentes con molde; último capítulo con reflexiones apiladas o la mesa como lista; carta con algo que no es para la familia; párrafos que no suenan a quien narra o con marcas de IA; repeticiones (cita que repite el párrafo, misma anécdota dos veces, párrafo que repite el anterior); respuestas de botón; relleno (oraciones que repiten lo mismo con otras palabras para ocupar lugar); deriva de voz entre el primer capítulo y el último.

Para cada problema: la pieza, la frase o el párrafo exacto (copiado), el tipo y en una línea qué está mal. No propongas el texto nuevo: eso lo hace otro. No marques gusto personal ni lo que harías distinto: solo lo que la guía dice que no va.

Mal: "El capítulo 4 podría ser más emotivo." → Bien: "cap_4, cierre: 'Y así entendí que la plata va y viene' — cierra explicando (sección 7)."

Devolvé solo el JSON del esquema.
```

Esquema de salida (`lectura.json`):

```json
{"problemas": [{"n": 1, "pieza": "cap_4", "frase": "", "tipo": "cierre_explica", "que": ""}]}
```

`tipo` ∈ primera_pagina | sin_hilo | sin_escena | apertura_repetida | cierre_explica | titulo_generico | persona_dos_veces | lista | sin_presentar | salto_confuso | molde | bolsa | carta_ajena | no_suena | ia | repetido | boton | relleno | deriva.

### Paso 6 · Arreglo (una llamada por pieza con problemas)

La llamada es la misma de escritura de esa pieza (3a, 3b o 3c: mismos documentos, misma instrucción), con `<problemas>` antes de las instrucciones (los del código, del verificador y del lector juntos, numerados) y este agregado al final:

```
Esta pieza volvió del control con problemas (<problemas>). Reescribila entera con las mismas reglas de arriba (marcas [[R..]] incluidas) y, además:
1. Cada problema cambia el texto marcado. Un problema de forma (primera página, cierre que explica, lista, repetido, frase cortada, molde, botón, no suena, ia, bolsa, carta ajena, control del código) no se discute: se cambia.
2. Un problema de hecho (presente, pasado, nombre, fecha, lugar, cita, motivo, sentimiento, inventado, confirmado, delicado) se cambia; o, solo si tenés una respuesta que lo respalda tal cual, lo marcás "disputa" con el id y la frase textual de esa respuesta. No decidís vos: lo decide el verificador.
3. Arreglar una lista nunca saca a nadie: se resume en media línea con los nombres. "Falta R..": ese contenido entra, con su marca. "Faltan detalles": esos detalles entran en su escena.
4. Lo que no tenía problema queda como estaba, salvo lo que haga falta tocar para que el cambio cierre.
5. No se suma nada del material que no estuviera en el plan para esta pieza.

Mal (lista arreglada sacando gente): "Mis amigas del barrio eran la Negra, Susana, Tere, Alicia y la Beba." → "La Negra venía a la siesta a tomar mate." y las otras cuatro desaparecen. → Bien: la Negra en escena, y "las otras del barrio, Susana, Tere, Alicia y la Beba, venían a comprar; la Negra venía a quedarse."

Devolvé la pieza completa en markdown y, después de una línea "---", el JSON del esquema de cambios.
```

Esquema de cambios:

```json
{"cambios": [{"problema": 1, "resultado": "cambiado", "antes": "", "despues": "", "disputa_id": "", "disputa_frase": ""}]}
```

`resultado` ∈ cambiado | disputa. No existe "falsa alarma".

**Qué hace el código con el arreglo (C9):**
- Para cada problema con "cambiado": la `frase` marcada (normalizada: minúsculas, sin tildes, espacios colapsados) ya no aparece en la pieza. Si aparece, el problema sigue abierto y la ronda cuenta.
- "disputa" solo vale en problemas de hecho; en uno de forma se ignora y el problema sigue abierto.
- Cada disputa va a una llamada corta al verificador (mismos documentos del paso 4) con esta instrucción:

```
El escritor dice que esta frase del libro está respaldada por una respuesta. Frase del libro: "{{FRASE}}". Respuesta {{ID}}, frase que cita: "{{CITA}}". ¿La respuesta respalda la frase tal como está en el libro, incluido el tiempo verbal? Contestá solo {"respalda": true} o {"respalda": false, "por_que": ""}.
```

  Si respalda, el problema se cierra. Si no, sigue abierto y la ronda cuenta. Una disputa por problema.
- Después del arreglo, sobre la pieza cambiada: C1–C22 otra vez, y el paso 4 otra vez (la guía lo manda: el control de hechos se vuelve a pasar sobre lo que cambió). Lo que salga nuevo se suma a la ronda siguiente.
- Se registra, sin bloquear, qué porcentaje de los párrafos sin problema quedaron idénticos: si baja de 70 % en una pieza, va al informe como aviso de deriva.

---

## 4. Controles por código

Normalización para todos: minúsculas, sin tildes, espacios colapsados; las citas textuales (bloques `>` y tramos entre rayas o comillas que C6 ya verificó como de quien narra) se excluyen de C1, C10 y C15. Las marcas `[[R..]]` se quitan antes de todo control de texto salvo C18, C19 y C9 (que las necesitan); un párrafo sin marca es problema C18.

| # | Qué mira | Dónde | Si falla |
|---|---|---|---|
| C1 | Lista cerrada del anexo A2: palabras, muletillas de escritor y moldes (regex: "un antes y un despues", "punto de inflexion", "marco para siempre", "no era solo .{1,40}, era", "no se trataba de", "sin saberlo", "poco imaginaba", "aquel dia que", "en ese momento comprend", "quien iba a imaginar", "y asi (fue como\|aprendi\|entendi)", "eso me enseno", "este libro"); más de dos rayas (—) por párrafo fuera de diálogo; negritas, viñetas o subtítulos dentro de una pieza | toda pieza | problema tipo `ia` → arreglo |
| C2 | "…" o "..." en el texto | toda pieza | problema `cortada` → arreglo |
| C3 | Primera página: la primera oración empieza con "me llamo", "mi nombre", "naci", "soy [nombre y apellido]" seguido de coma y dato; o una oración de la primera página con más de un dato de ficha (año de cuatro cifras, "naci", "tengo N hijos", "vivo en", "me llamo") | primera_pagina | problema `primera_pagina` → arreglo |
| C4 | Nombres propios (palabra con mayúscula no inicial de oración) que no están en respuestas, ficha ni registro (también comparando con las palabras pegadas o partidas: "San Telmo" / "santelmo") | toda pieza | problema `nombre` → arreglo |
| C5 | Años de cuatro cifras que no están en respuestas ni ficha (los títulos impresos no se miran: sus años los puso el código) | toda pieza | problema `fecha` → arreglo |
| C6 | Cada bloque `>`, cada tramo de diálogo con raya, cada tramo entre comillas y cada frase de "Sus frases" es subsecuencia de una respuesta (quitando muletillas y falsos arranques) | toda pieza | problema `cita` → arreglo; en Sus frases, la frase se saca y va al informe |
| C7 | Seis o más palabras seguidas iguales en dos piezas distintas (fuera de nombres propios) | libro | problema `repetido` en la pieza posterior → arreglo |
| C8 | Cinco o más palabras seguidas del texto de una pregunta que aparecen en el libro (las anclas de repregunta, que son palabras de quien narra, no cuentan) | toda pieza | problema `boton` → arreglo |
| C9 | Arreglo: cada frase marcada "cambiado" ya no está; disputas solo en hechos; porcentaje de párrafos sin problema que quedaron idénticos | pieza arreglada | ver paso 6 |
| C10 | Anexo A6: gerundio al inicio de oración ("-ando"/"-iendo" como primera palabra); "fue/fueron/era + participio + por"; diálogo con comillas en vez de raya ("dijo" pegado a comillas); mezcla de trato (tú/tienes/eres/puedes contra vos/tenés/sos/podés) distinta de `voz.trato`; palabras de diagnóstico (depresion, ansiedad, trauma, alcoholico, alcoholismo, adiccion, adicto) que no están textuales en el material | toda pieza | problema `ia` (o `inventado` en diagnóstico) → arreglo |
| C11 | (sacado el 01/10: Naza no quiere máximo de palabras; el largo lo da lo que contó) | — | — |
| C12 | Títulos del plan: cada palabra de contenido del título está en sus ids (textual) o en el material (armado); ninguna de: etapa, linda, lindo, hermosa, hermoso, gran, sueños, sueño, luchas, lucha, difícil, feliz, felicidad, importante, especial, inolvidable; no es solo un nombre de persona; leídos en lista, no hay dos iguales | plan | reintento del paso 2 con el error |
| C13 | Plan: cada episodio del registro (no `no_poner`) está una sola vez (en `piezas`, `sus_frases` o `carta.ids`); cada capítulo tiene ≥1 pieza `escena`; cada `momento_clave` no vacío está como `escena`; `hilo_ids` no vacío; `apertura.tipo` y `cierre.tipo` distintos del capítulo anterior; cada P en `presenta` de un solo capítulo; el último capítulo tiene en `hilo_de_hoy_ids` un episodio con `sigue_hoy` y `es_escena: true` o, si no existe ninguno en el registro, el episodio `es_escena` más reciente de la línea de tiempo; cada id de `como_se_presenta` y `cosas_concretas_suyas` está en `primera_pagina.que_dice_de_si_ids` o en una pieza; `carta.titulo` no vacío (y `titulo_id` existe si lo tiene); `sus_frases.contexto` ≤ 20 palabras. (Lo de "familia" en la carta lo mira C19; el último capítulo sin bolsa, C20) | plan | reintento del paso 2 con el error |
| C14 | Registro: todo id citado existe; cada R (no "paso") aparece en algún episodio o en `sin_lugar`; cada frase de `voz.frases` es subsecuencia de su id y hay entre 15 y 20; `segura: true` solo si en sus ids o en la ficha hay un número; todo "…" de una respuesta usada tiene entrada en `frases_cortadas`; no hay dos personas con mismo nombre y relación; cada línea de `<confirmado_por_el_narrador>` tiene su entrada en `confirmados` con `usado_en` no vacío; `estado` presente en personas, lugares y episodios; cada episodio tiene `a_quien` válido y `a_quien_nombres` que son personas del registro; cada episodio `es_escena: true` tiene `detalles` no vacío; cada persona tiene `rasgos_hoy` (puede ser `[]`) | registro | reintento del paso 1 con el error |
| C15 | Último capítulo: más de dos párrafos seguidos que empiezan con "yo creo que", "creo que", "siento que", "pienso que", "lo que mas me gusta", "lo que herede", "para mi lo mas importante" | último capítulo | problema `bolsa` → arreglo |
| C16 | Presente sospechoso para el verificador: lista de oraciones con "hoy", "ahora", "todavia", "sigue", "siguen", "sigo" y verbos en presente, con pieza y número de párrafo | libro | no bloquea: se adjunta al paso 4 como `<presentes>` para que la lista sea completa |
| C17 | Presentaciones: patrón "mi (marido\|mujer\|hermana\|hermano\|hijo\|hija\|madre\|padre\|mama\|papa\|amiga\|amigo\|tia\|tio\|abuela\|abuelo\|nieta\|nieto) [Nombre]" o "[Nombre], (mi\|que es mi) …" para el mismo nombre en dos piezas distintas (o dos veces en la primera página) | libro | problema `persona_dos_veces` en la pieza posterior → arreglo |
| C18 | **Todo entra (rastreo):** cada párrafo de primera página, capítulos y carta termina con una marca `[[R..]]` con ids que existen; toda respuesta (no "paso", no de un episodio `no_poner`) aparece en alguna marca del libro o como id en "Sus frases" | libro | párrafo sin marca → problema `sin_marca` en esa pieza; R sin marca → la pieza que le toca según la tabla R → pieza (2b) vuelve al arreglo con "falta R..: <qué contaba>" (el `que` del episodio o las primeras 15 palabras de la respuesta) |
| C19 | **A quién le habla:** en el plan, cada episodio con `a_quien: familia` está en `carta.ids`; en el texto, cada R de esos episodios está en una marca de la carta | plan, carta | plan: reintento del paso 2 con el error; carta: arreglo con "falta R..: <qué les dice>" |
| C20 | **Último capítulo con una sola historia:** en el plan, el último capítulo tiene como máximo 2 piezas de episodios tipo `reflexion` o `gusto` con forma distinta de `media_linea`; en el texto, como máximo 2 párrafos cuyas marcas sean solo de respuestas de episodios `reflexion`/`gusto` | plan, último capítulo | plan: reintento del paso 2 con el error; texto: problema `bolsa` → arreglo |
| C21 | **Nadie se cae:** cada persona del registro con `hechos` no vacío aparece en el libro (sin marcas) por `nombre` o por alguno de sus `apodos` | libro | problema `lista` en la pieza del capítulo donde el plan la presenta (o, si no la presenta, donde está el episodio de su primer hecho) con "falta <nombre>: <su primer hecho>" → arreglo; el arreglo la pone en media línea, nunca la deja afuera |
| C22 | **Escenas llenas:** por cada pieza `escena` de un capítulo, al menos el 70 % de los `detalles` de su episodio aparece en el texto del capítulo (cada detalle: sus palabras de contenido, normalizadas, en una ventana de 12 palabras del texto; si tiene un número, el número) | cada capítulo | problema `sin_detalles` → arreglo con "faltan detalles de E..: <lista de los que faltan>" |

Falsas alarmas del código: si el verificador o el lector, en su JSON, no incluyen un problema que C1–C22 marcó, el problema igual va al arreglo (el código manda; no hay quien lo levante). Si el arreglo lo cambia y el cambio empeora, se verá en la ronda siguiente. Lo que el código marca mal de forma repetida se anota en el informe para ajustar el control, nunca para saltearlo.

---

## 5. Reintentos y topes

| Dónde | Cuántas veces | Qué pasa después |
|---|---|---|
| Paso 1 (C14 falla) | 2 reintentos con el error pegado al final de las instrucciones | se detiene y avisa: el material o el prompt tienen un problema que no se arregla solo |
| Paso 2 (C12/C13 fallan) | 2 reintentos con el error | igual |
| Paso 3 (controles C1–C22 sobre la pieza recién escrita, incluidos rastreo, personas y detalles) | hasta 2 arreglos (paso 6) con solo los problemas del código | se escribe de cero una vez más con `<evitar>` (la lista de lo que falló); si falla de nuevo, se sigue y va al informe |
| Paso 6 (después de 4 y 5) | 2 rondas por pieza; cada ronda junta lo del código, el verificador y el lector | 3.ª vez: reescritura de cero con `<evitar>` (los problemas que persisten, para no repetirlos) y vuelta a 4 y 5 sobre la pieza; si sigue, al informe |
| Disputa | una por problema | la decide el verificador |
| Llamadas de 4 y 5 | si el JSON no cumple el esquema, 1 reintento | si vuelve a fallar, se sigue sin esa lista y se avisa en el informe |

Lo que llega al informe nunca se arregla a mano en el libro: se arregla la receta, o se le pregunta al narrador (faltantes).

---

## 6. Qué entrega el circuito

- `libro.md`: título, primera página, capítulos, Sus frases, carta con su título. Sin marcas `[[R..]]` (quedan en `libro-con-marcas.md`, para revisar).
- `informe.md`: `faltantes` del plan (etapas sin escena, hoy sin momento, dudas que dejaron algo vago), problemas abiertos por pieza con sus rondas, disputas y cómo se resolvieron, avisos de deriva (C9), falsas alarmas del código, costo por paso. Es para Naza y para quien ajuste la entrevista: lo que el libro no tiene, la guía dice que lo arregla la entrevista, no el escritor.
