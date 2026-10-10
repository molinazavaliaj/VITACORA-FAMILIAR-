# Receta del escritor (V3.2, de cero)

**Estado: v3.2 (02/10): cambios de la prueba 3.1** ([`prueba-3-receta-v3.md`](prueba-3-receta-v3.md), sección "Prueba 3.1": el capítulo del hecho más fuerte perdió 5,5 a 6,5, siempre por el hilo): un capítulo lleva solo episodios de su tiempo; lo que sigue hoy (dato, gusto o reflexión `sigue_hoy`) va al último capítulo, a Antes de cerrar, a Sus frases o a la carta, y solo entra en un capítulo anterior con `por_que_aca` (paso 2, C13); el plan ordena las piezas para que el capítulo vaya hacia su hecho fuerte o salga de él, y el escritor no cambia ese orden (pasos 2 y 3b); cada episodio se cuenta en un solo tramo del capítulo (3b; el lector lo marca `repetido`); el título del capítulo es el del plan y lo imprime el código: el escritor no lo escribe y el arreglo no lo cambia; un título que el lector marca genérico va al informe, no al arreglo (pasos 2b, 3b, 6, 7; C9); prohibidos los párrafos de una sola oración puestos para dar golpe y los bloques de cita con ">" en capítulos (3a, 3b, 3d; C1). La v3.1 (cambios de la prueba 3: lo grave contado corto es momento clave, hecho fuerte sin escena en apertura o cierre, apertura en escena, columna y máximo dos reflexiones en el último, `<pasados>` para el verificador, arreglo por cambios) quedó en [`historial/receta-v3.1.md`](historial/receta-v3.1.md); la v3, en [`historial/receta-v3.md`](historial/receta-v3.md); la v2, en [`historial/receta-v2.md`](historial/receta-v2.md). Receta nueva desde el 01/10, no deriva de la v6; sin máximo de palabras por pieza (Naza).

Esta receta hace cumplir la [guía](guia-biografia.md) aprobada por Naza. Son los textos EXACTOS que recibe el modelo en cada paso, más lo que hace el código entre paso y paso. El modelo es el mismo en todos los pasos y no se fija acá.

**Principio (acordado con Naza).** La IA elige, dentro de bordes, y alguien que no es ella controla después. Por eso:
- Cada prompt es corto: qué hace el paso, sus bordes duros (pocos y chequeables) y uno o dos ejemplos. El oficio entero va como documento: la guía completa entra en cada llamada como `<guia>`, y el prompt dice qué secciones mandan en ese paso.
- Todo borde tiene quién lo controla: el código (controles C1–C27, abajo), el verificador (paso 4), el lector (paso 5) o el cotejador (paso 5b). Un borde que nadie puede controlar no es un borde: es un deseo, y no está acá.
- El que escribe no se revisa. El control de hechos y la lectura de corrido los hacen otros roles que no ven las instrucciones del escritor ni el plan. El arreglo dice problema por problema qué tramo cambia y por cuál, el código aplica esos cambios y comprueba que el texto marcado cambió de verdad.
- Si un control falla, la pieza vuelve al escritor con los problemas a la vista y se cambia solo lo marcado: lo demás queda letra por letra (v3.1: la ronda única reescribía de más). Nunca se parcha a mano. Hay una sola ronda de arreglos y, lo que queda abierto después, se entrega en la lista del informe: se dice, no se disimula.

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
| 3d | **Antes de cerrar** (el balance de vida, si el plan trae `antes_de_cerrar.ids`) | modelo | `antes_de_cerrar.md` |
| 3e | Arma "Sus frases" desde el plan (C6 sobre cada frase) y los controles de forma y de rastreo sobre cada pieza (C1–C3, C5–C8, C10, C15, C17, C18, C20–C23). Lo que falla vuelve a 3 como arreglo (paso 6) | código | libro entero (con marcas `[[R..]]`) |
| 4 | **Control de hechos** (otro rol: verificador; ve guía, ficha, respuestas, registro y libro CON marcas; no ve el plan ni los prompts del escritor) | modelo | `hechos.json` |
| 5 | **Lectura de corrido** (otro rol: lector exigente; ve guía, libro SIN marcas y `<referencias>` (C25); no ve el material) | modelo | `lectura.json` |
| 5b | **Cotejo** (otro rol: cotejador; ve respuestas y libro CON marcas; no ve el plan, el registro ni la guía entera) | modelo | `cotejo.json` |
| 6 | **Arreglo, una sola ronda**: por pieza con problemas, una llamada con el prompt de escritura de esa pieza + `<pieza_actual>` + `<problemas>` (código, verificador, lector y cotejo juntos); devuelve solo la lista de cambios (tramo `antes` copiado exacto → tramo `despues`). El código aplica los cambios, verifica (C9) y vuelve a pasar C1–C24 y el **repaso** del paso 4 (con `<decisiones_anteriores>`) sobre la pieza cambiada. Lo que queda abierto después del repaso va al informe | modelo + código | piezas corregidas |
| 7 | Borra las marcas e imprime (el título de cada capítulo lo pone el código desde el plan); informe para Naza: `faltantes` del plan, problemas abiertos, títulos que el lector marcó genéricos (no se arreglan en el libro: se arregla la receta o el plan), lo que el cotejo encontró y no entró, oscilaciones del verificador (C26), disputas resueltas en contra del escritor, falsas alarmas del código | código | `libro.md`, `informe.md` |

Orden del libro: título del libro, la primera página (sin título propio), capítulos, "Antes de cerrar" (si hay), "Sus frases" (si hay), la carta (con su título, si hay).

---

## 2. Cómo se arma cada llamada

Documentos primero, siempre en este orden (lo que se repite entre llamadas queda en caché); las instrucciones del paso al final.

```
<guia>…</guia>                     la guía entera (guia-biografia.md), en todos los pasos
<ficha>…</ficha>                   datos de ficha + <confirmado_por_el_narrador> si hubo dashboard
<respuestas>…</respuestas>         cada una: id R01…, pregunta, bloque, texto (sin las "paso")
<registro>…</registro>             desde el paso 2
<plan>…</plan>                     desde el paso 3 (no en el 4 ni en el 5)
<libro_hasta_aca>…</libro_hasta_aca>   en 3b, 3c, 3d y 6: las piezas ya escritas, en orden
<libro>…</libro>                   en 4 y 5b: el libro entero con marcas [[R..]]; en 5: sin marcas
<presentes>…</presentes>           solo en 4: las oraciones en presente que lista el código (C16), con pieza y párrafo
<pasados>…</pasados>               solo en 4: las oraciones en pasado que nombran a una persona con estado sigue_hoy, listadas por el código (C27)
<referencias>…</referencias>       solo en 5: las oraciones con "ese día", "ahí", "esa casa"… que lista el código (C25)
<decisiones_anteriores>…</decisiones_anteriores>   solo en el repaso del 4: los problemas de la ronda anterior de esa pieza, con su corrección y si se cambió
<voz>…</voz>                       en 3a, 3b, 3c, 3d y 6: la ficha de voz del registro, copiada entera
<pieza_actual>…</pieza_actual>     solo en 6: la pieza tal como está, con marcas [[R..]]
<problemas>…</problemas>           solo en 6
INSTRUCCIONES DEL PASO
```

El paso 5b (cotejo) es distinto: recibe solo `<respuestas>` y `<libro>` con marcas, y de la guía nada más que las secciones 9 y 10. El paso 3d (Antes de cerrar) recibe lo mismo que la carta.

Antes de `<guia>` va esta línea fija: `La guía habla de "la narradora" y sus ejemplos, igual que los de las instrucciones, son de una narradora inventada (Nélida). Quien narra en este libro es otra persona: su nombre, su género y su trato están en la ficha, y se escribe con ese género.`

`<voz>` es el bloque `voz` del registro, copiado tal cual, puesto justo antes de las instrucciones en cada llamada de escritura. Es la "ficha releída antes de cada capítulo" del anexo A3: el modelo la tiene al lado de lo que escribe, no enterrada en el registro.

En el paso 4, el 5 y el 5b no entra `<plan>` ni ningún prompt de escritura: el verificador, el lector y el cotejador no saben qué se le pidió al escritor; juzgan lo que hay.

**Marcas de rastreo.** En 3a, 3b, 3c, 3d y en el arreglo, el escritor cierra cada párrafo con `[[R12,R15]]`: los ids de las respuestas que usó en ese párrafo. Con ellas el código controla que todo entró (C18), el verificador sabe contra qué respuesta mirar cada párrafo y el cotejador sabe a qué pieza mandar lo que falta. El código las borra antes de la lectura de corrido (paso 5) y antes de imprimir. Una frase de "Sus frases" lleva su id en el plan, no marca.

Huecos que llena el código: `{{N}}`, `{{TITULO}}` (título impreso del capítulo: el escritor lo ve para saber adónde va el capítulo, pero no lo escribe; lo imprime el código), `{{NOMBRE}}` (nombre de pila de quien narra, de la ficha).

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
5. Ninguna respuesta queda sin lugar: cada id está en un episodio (episodio, dato, reflexión, gusto, mensaje o balance) o en "sin_lugar" con motivo.
6. Cada episodio dice a quién le habla: "familia" (deseo, consejo, agradecimiento o pedido a los suyos, aunque suene a reflexión), "lector" o "nadie"; y a quién nombra, en "a_quien_nombres". Lo que dice de su vida entera mirando para atrás (la prueba más dura, en qué o en quién se apoyó, los altibajos, cómo se ve, qué espera de lo que viene) es tipo "balance", no "reflexion"; si se lo dice a los suyos, sigue siendo "mensaje".
7. Fechas y edades como las dijo, "segura": true solo si dijo el número o está en la ficha. No calculás años.
8. Lo que dijo con duda ("creo", "no sé si"), lo que contradice otra respuesta y los nombres que suenan mal transcriptos van a "dudas", no como hecho. Las frases que el audio cortó van a "frases_cortadas", con el cierre posible si lo dijo entero en otra respuesta.
9. La ficha de voz: 15 a 20 frases textuales (copiadas; solo se sacan muletillas) que muestren cómo habla, sus palabras propias, sus dichos, si vosea o tutea.
10. Si pidió que algo no esté ("esto no lo pongas"), va en "no_poner" y el episodio queda marcado.
11. "momento_clave" se pone por lo que pesa en su vida, no por cuánto lo contó: un hecho de peligro, violencia, cárcel, enfermedad, muerte o pérdida grande lleva momento_clave (alto, bajo, giro, decisión difícil…) aunque esté dicho en pocas líneas y sin escena (es_escena false, detalles []). Lo corto no lo hace chico.

Mal: Raúl (marido, chapista) con estado "sigue_hoy" porque ella dice "Raúl es muy terco". → Bien: estado "termino" (R40: murió en 2014), y "Raúl es muy terco" en la ficha de voz como ejemplo de cómo habla de él.
Mal: "Una vez entraron a robar a la mercería con un revólver; a Raúl lo tuvieron en el piso" (R35, cuatro renglones, sin detalles) como episodio con momento_clave "". → Bien: momento_clave "bajo", es_escena false, detalles []: es el hecho más grave de esos años aunque lo contó en cuatro renglones.
Mal: "Lo que les diría a mis hijos es que no se peleen por la casa" como tipo "reflexion", a_quien "nadie". → Bien: tipo "mensaje", a_quien "familia", a_quien_nombres ["Marcela", "Gustavo", "Pablo"].
Mal: la noche de la calculadora, detalles []. → Bien: ["la calculadora en la mesa de la cocina", "que sumara yo", "no daba", "Tito ladró por el camión de la basura"].
Mal: "Lo más duro fue quedarme sola con el negocio; me apoyé en Chiche y en el bastidor" como tipo "reflexion". → Bien: tipo "balance", a_quien "nadie" (habla de su vida entera, no de una escena ni a los suyos).

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

Valores cerrados: `tipo` ∈ episodio | dato | reflexion | gusto | mensaje | balance (lo que dice de su vida entera mirando para atrás; va a la pieza "Antes de cerrar", no a "Sus frases" ni al último capítulo). `momento_clave` ∈ "" | alto | bajo | giro | mas_temprano | infancia | adolescencia | decision_dificil. `estado` ∈ termino | sigue_hoy | no_se_sabe. `dudas.tipo` ∈ nombre | fecha | identidad | contradiccion | transcripcion. `a_quien` ∈ familia | lector | nadie. `detalles`: solo en episodios con `es_escena: true` (en los demás, `[]`). `rasgos_hoy`: lo que sigue siendo verdad de esa persona, dicho en presente, con ids. `confirmados`: una entrada por cada línea de `<confirmado_por_el_narrador>`, con dónde quedó usada.

| Borde | Quién controla |
|---|---|
| 1 ids en toda entrada; ids existen | C14 |
| 2 una persona, un id | C14 (dos personas con mismo nombre y relación → error); verificador (nombres) |
| 3 estado en todo; "hoy"; rasgos_hoy | C14 (campo presente); verificador (presente y pasado contra material) |
| 4 un episodio por historia; detalles de cada escena | lector (repetido); C14 (escena con `detalles` vacío → error); C22 en el texto |
| 5 ningún id sin lugar | C14; C18 en el texto |
| 6 a quién le habla; balance | C14 (campo presente; a_quien_nombres son personas del registro); C19 en el plan y el texto; C13 y C23 (cada `balance` en "Antes de cerrar") |
| 7 fechas sin calcular | C14 (`segura` true solo si el número está en sus ids o en la ficha) |
| 8 dudas y frases cortadas | C14 (todo "…" de una respuesta usada tiene entrada en frases_cortadas) |
| 9 ficha de voz textual | C14 (cada frase es subsecuencia de su id; 15–20) |
| 10 no_poner | C14 (episodio marcado), verificador |
| 11 momento_clave también en lo grave contado corto | C13 en el plan (un `momento_clave` con `es_escena: false` va como `resumen` en apertura o cierre, nunca enterrado); lector (sin_escena); el informe (faltante "hecho fuerte sin escena") |

### Paso 2 · Plan del libro

Mandan: secciones 1, 2, 6, 7, 8; anexos A4, A5, A7.

```
Sos el editor. Con el registro armás el plan del libro: qué capítulos hay, qué va en cada uno y con qué forma. No escribís prosa. Mandan las secciones 1, 2, 6, 7 y 8 de la guía y los anexos A4, A5 y A7.

Bordes:
1. Cada capítulo tiene un hilo en una oración con un verbo de cambio, dicho con palabras del registro (de quien narra o de lo que repite), y por lo menos un episodio con es_escena true. Una etapa sin escena no es capítulo: sus episodios van al capítulo vecino.
2. Cada episodio del registro va a un solo lugar: a un capítulo con una forma (escena, resumen, media_linea o remate: una reflexión pegada a la escena que la explica), a sus_frases, a carta, o a antes_de_cerrar (todos los "balance", en el orden en que se leen mejor). Ninguno queda afuera, salvo los de no_poner.
3. Una pieza solo puede tener forma "escena" si su episodio tiene es_escena true. Los momentos clave del registro (alto, bajo, giro, más temprano, decisión difícil) con es_escena true van como escena, nunca como resumen. Cada capítulo tiene un "hecho_fuerte": su episodio más grave o el que más le cambia la vida (uno de sus momentos clave, si tiene), tenga escena o no. Si su episodio es es_escena true, va como escena. Si es es_escena false, va como resumen en un lugar fuerte: el cierre del capítulo o la apertura, nunca enterrado en el medio; el título del capítulo sale de ahí igual, y el plan suma un faltante {"que": "hecho fuerte sin escena: <qué falta saber: dónde, cuánto duró, cómo terminó…>", "donde": "capítulo N — repreguntar"}. El capítulo se corta donde cae un hecho, no donde cambia una época.
4. La primera página usa TODO lo de "como_se_presenta" y "cosas_concretas_suyas" que no se cuente en un capítulo: al terminarla, el lector sabe qué hace, de dónde es y cómo es. Nada que terminó contado como de hoy; ningún golpe para impactar.
5. Título del libro y de cada capítulo: una frase textual del registro (con id) que tenga una cosa que se pueda ver, o uno armado solo con palabras que quien narra usó. El de un capítulo sale de su hecho_fuerte, nunca de lo más chico. Si no hay, vacío: el código pone la etapa y los años. Nunca una valoración, un nombre que el lector no conoce todavía ni el final del capítulo.
6. Apertura y cierre de cada capítulo con tipo. Si el capítulo tiene algún episodio con es_escena true, "apertura.episodio" es uno de ellos: el capítulo abre adentro de una escena, y el tipo puede variar (escena, día común, objeto, lugar, o una frase suya dicha EN esa escena), nunca con una frase suelta ni un resumen de la época. Solo un capítulo sin ninguna escena abre de otra forma, y entonces va un faltante {"que": "capítulo sin escena", "donde": "capítulo N"}. Dos capítulos seguidos no repiten tipo de apertura ni de cierre.
7. Cada persona se presenta en un solo capítulo: el primero donde hace algo. Antes de ese, solo nombre y relación.
8. El último capítulo cuenta UNA sola historia: un episodio sigue_hoy con es_escena true; si no hay ninguno, el episodio escena más reciente. Lleva "columna" (una oración con palabras suyas, con sus ids: lo que en su vida sigue abierto hoy, lo que todavía no se resolvió y empuja lo que hace hoy; el día de hoy se cuenta en función de eso) e "imagen_final" (una cosa que se pueda ver, de un episodio sigue_hoy o del bloque "hoy"; el capítulo cierra ahí). En el último capítulo van como máximo 2 piezas de episodios reflexion o gusto, CONTANDO las medias líneas. Las demás reflexiones y gustos van al capítulo donde está la cosa concreta de la que hablan (una opinión sobre la música, al capítulo de la música), o a sus_frases si son una frase suya que se sostiene sola. El balance sigue yendo a antes_de_cerrar.
9. Todo episodio con a_quien "familia" va a "carta.ids"; si además es parte de una escena, también en media línea en su capítulo, con otras palabras. La carta lleva título (una frase suya o "Para los míos") y "para_personas": a quiénes está dedicado el libro (ficha). Si a alguna no la nombra ningún episodio "familia", va un faltante; el mensaje nunca se inventa.
10. Lo que el material no trae (una etapa sin escena, un hoy sin momento, una duda que deja vago un capítulo, un mensaje que falta) va en "faltantes": se dice, no se disimula.
11. Un capítulo lleva solo episodios de su tiempo. Un episodio de tipo dato, gusto o reflexion con estado sigue_hoy va al último capítulo, a antes_de_cerrar (si es balance), a sus_frases o a la carta. Solo puede ir a un capítulo anterior si habla de algo de esa época, y entonces la pieza lleva "por_que_aca": de qué cosa de esa época habla (no vacío). Lo que tiene hoy (los nietos de hoy, lo que hace hoy) y lo que desea hoy no van a un capítulo del pasado.
12. El plan ordena las piezas de cada capítulo para que el capítulo vaya hacia su hecho_fuerte, o salga de él: cada pieza o empuja hacia ese hecho o es consecuencia de él. Lo que no empuja ni es consecuencia no va en ese capítulo: va al capítulo vecino donde sí empuja, o a sus_frases.

Mal: capítulo "La mercería", doce episodios, hilo "sus años en la mercería". → Bien: hilo "cómo la mercería pasó de ser el sueño de Raúl a ser mi lugar" (lo dijo así en R14 y R22), escena ancla: la noche de la calculadora (E07).
Mal: capítulo "Los años ochenta", título "El billete viejo" (E15, media línea) cuando lo fuerte es la inundación del 86 (E12, decisión difícil). → Bien: hecho_fuerte E12, título "Los carreteles al sol" (R27, de E12).
Mal (hecho fuerte sin escena): capítulo "La mercería", hecho_fuerte E07 (la noche de la calculadora, es_escena), y el robo con revólver (E19, momento_clave bajo, es_escena false, cuatro renglones) como resumen en el medio, entre dos ventas. → Bien: hecho_fuerte E19, pieza resumen y cierre del capítulo (cierre.tipo "gesto", episodio E19), título "A Raúl lo tuvieron en el piso" (R35, de E19); la calculadora (E07) como escena y apertura; faltante {"que": "hecho fuerte sin escena: el robo (E19): qué hora era, cuánto duró, qué se llevaron, cómo siguió Raúl esa noche", "donde": "capítulo 3 — repreguntar"}.
Mal (apertura): capítulo con la calculadora (E07, es_escena) que abre con apertura.tipo "frase_suya", episodio E20 ("la mercería fue mi vida", reflexión sin escena). → Bien: apertura.episodio E07 (tipo "escena", o "objeto": la calculadora en la mesa de la cocina, o "frase_suya" con "sumá vos", que lo dijo Raúl EN esa noche).
Mal: último capítulo "Hoy", con "lo que heredé de mamá", "mis gustos", "la mesa de los míos", "la música de ahora no me gusta" en media línea y "lo más duro fue quedarme sola con el negocio". → Bien: último capítulo "Dos cuadras hasta lo de Marcela", hilo: la primera vez que fue sola a la casa nueva (E31, sigue_hoy, es_escena), columna "todavía no sé si la casa nueva es mi casa" (R70: lo que sigue abierto hoy y empuja lo que hace), imagen_final: la llave colgada al lado de la puerta (E31, R71); "lo que heredé de mamá" de remate en el capítulo de la infancia; los gustos en la tarde con el bastidor (E29); "la música de ahora no me gusta" al capítulo de la radio del taller, que es donde está la música; "lo más duro…" (E48, balance) en antes_de_cerrar.ids. En el último quedan a lo sumo dos piezas de reflexion o gusto, media línea incluida.
Mal: "Que Gustavo no se pelee más con Pablo por la casa" (E44, familia) solo como remate del capítulo de la casa. → Bien: E44 en carta.ids; en ese capítulo, media línea. Y si el libro es para los tres hijos y ningún episodio familia nombra a Pablo: faltante "la entrevista no trae un mensaje para Pablo".
Mal (época): capítulo 3 "La mercería" (1978–1995) con "tengo cinco nietos" (E52, dato, sigue_hoy) en media línea y "me gustaría volver a vivir en Echesortu" (E55, reflexion, sigue_hoy) de remate. → Bien: E52 al último capítulo (o a la carta, si se lo dice a ellos); E55 al último capítulo, que es donde está lo que sigue abierto hoy. En cambio "no tiro ni un botón, todavía" (E30, gusto, sigue_hoy) sí puede ir al capítulo 3, con "por_que_aca": "el cajón de botones sueltos de la mercería (E07)".
Mal (orden): capítulo 3, hecho_fuerte E19 (el robo, cierre), piezas en este orden: la calculadora (E07), el viaje a Mar del Plata del 83 (E21), la receta de la abuela (E09), el robo (E19). → Bien: E07 (los números que no daban), E11 (el crédito que pidieron para aguantar), E19 (el robo, cierre): cada pieza empuja hacia el robo. E21 y E09 no empujan ni son consecuencia: E21 al capítulo de los veranos, E09 al de la infancia.

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
    "hecho_fuerte": "E..",
    "apertura": {"tipo": "escena", "episodio": "E.."},
    "cierre": {"tipo": "gesto", "episodio": "E..", "frase_id": ""},
    "piezas": [{"episodio": "E..", "forma": "escena", "pegado_a": "", "por_que_aca": ""}],
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

Valores cerrados: `apertura.tipo` y `cierre.tipo` ∈ escena | objeto | persona_entra | dia_comun | fecha | frase_suya | gesto. `forma` ∈ escena | resumen | media_linea | remate; `escena` solo si el episodio tiene `es_escena: true`. Los episodios que van a "Sus frases", a la carta o a "Antes de cerrar" no están en `piezas`, salvo un episodio "familia" que además es parte de una escena: ese está en `carta.ids` y en `piezas` como `media_linea`. `hecho_fuerte`: un episodio de `piezas`; con forma `escena` si es `es_escena: true`, o con forma `resumen` y siendo el `apertura.episodio` o el `cierre.episodio` si es `es_escena: false` (y entonces hay un faltante "hecho fuerte sin escena" para ese capítulo). `apertura.episodio`: si el capítulo tiene alguna pieza `escena`, es una de ellas; si no tiene ninguna, hay un faltante "capítulo sin escena". `columna` e `imagen_final`: solo en el capítulo con `es_ultimo: true` (en los demás, `columna.texto` vacío e `imagen_final.episodio` vacío); `imagen_final.episodio` está en `piezas`, es `sigue_hoy` o tiene ids del bloque "hoy", y es el `cierre.episodio`. `antes_de_cerrar.ids`: los ids R de todos los episodios `balance`, en el orden en que se leen; si no hay ninguno, `[]` y la pieza no existe. `primera_pagina.que_dice_de_si_ids`: todos los ids de `como_se_presenta` y `cosas_concretas_suyas` que no estén en una pieza de capítulo. `carta.titulo`: frase suya (con `titulo_id`) o "Para los míos" (sin id); nunca "Antes de cerrar", que es otra pieza; el código imprime `# <titulo>`. `carta.para_personas`: ids de persona del registro que la ficha nombra en "Para quién es el libro". `contexto` de Sus frases: hasta 20 palabras, solo lo que el material dice. `por_que_aca` (opcional): solo en una pieza de un episodio `dato`, `gusto` o `reflexion` con estado `sigue_hoy` puesta en un capítulo que no es el último; dice de qué cosa de esa época habla; en las demás piezas, vacío o ausente. `piezas` va en el orden en que se escribe el capítulo: el escritor no lo cambia.

| Borde | Quién controla |
|---|---|
| 1 hilo con verbo de cambio y escena | C13 (≥1 pieza escena por capítulo; `hilo_ids` no vacío); lector (sin_hilo) |
| 2 cada episodio una vez; los balance a antes_de_cerrar | C13 (cada episodio `balance` está en `antes_de_cerrar.ids`); C23 en el texto |
| 3 escena solo si es_escena; momentos clave; hecho_fuerte con o sin escena | C13 (ninguna pieza `escena` de un episodio `es_escena: false`; cada `momento_clave` con `es_escena: true` como escena; cada capítulo tiene `hecho_fuerte` en sus piezas y, si hay momentos clave, es uno de ellos; si su episodio es `es_escena: true`, forma `escena`; si es `es_escena: false`, forma `resumen`, es el `apertura.episodio` o el `cierre.episodio`, y hay un faltante "hecho fuerte sin escena" con `donde` "capítulo N — repreguntar"); C12 (el título sale del hecho_fuerte); lector (sin_escena) |
| 4 primera página entera | C13 (cada id de `como_se_presenta` y `cosas_concretas_suyas` está en `primera_pagina` o en una pieza); verificador (presente); lector (primera_pagina: al terminarla no se sabe quién es) |
| 5 títulos textuales o con palabras suyas; sin valoración; del hecho fuerte | C12 (también el de la carta; si `titulo.id` no está vacío, es un id del `hecho_fuerte`) |
| 6 apertura en una escena si el capítulo tiene; variedad de apertura y cierre | C13 (si el capítulo tiene piezas `escena`, `apertura.episodio` es una de ellas; si no tiene ninguna, hay un faltante "capítulo sin escena"; tipos distintos del capítulo anterior); lector (apertura_repetida, molde) |
| 7 una presentación por persona | C13 (cada P en `presenta` de un solo capítulo); C17 en el texto |
| 8 último capítulo con una sola historia, columna (lo que sigue abierto hoy) e imagen final; máx. 2 reflexion/gusto contando medias líneas | C13 (`hilo_de_hoy_ids` con un episodio `sigue_hoy` y `es_escena`, o, si no existe ninguno, el episodio escena más reciente de la línea de tiempo; `columna.texto` no vacío y `columna.ids` no vacío; `imagen_final.episodio` en sus piezas, `sigue_hoy` o con ids de "hoy", y es el `cierre.episodio`); C20 (máx. 2 piezas de episodios reflexion/gusto en el último capítulo, CONTANDO las `media_linea`; en el texto, máx. 2 párrafos solo de reflexion/gusto/balance y el último párrafo con un id de `imagen_final`); C15 en el texto; que la columna sea lo que sigue abierto hoy y las otras reflexiones vayan donde está la cosa concreta lo mira el lector (bolsa) |
| 9 carta: todo lo de "familia", con título; un mensaje por persona dedicada | C19 (cada episodio `a_quien: familia` está en `carta.ids`; cada persona de `para_personas` sin episodio familia que la nombre tiene su faltante; después, cada R de esos episodios está en una marca de la carta); C12 (título); C13 (`carta.titulo` distinto de "Antes de cerrar") |
| 10 faltantes | va al informe |
| 11 un capítulo, su época; lo que sigue hoy al último (o a Antes de cerrar, Sus frases, carta); en un capítulo anterior solo con `por_que_aca` | C13 (pieza de un episodio `dato`/`gusto`/`reflexion` con estado `sigue_hoy` en un capítulo que no es el último, sin `por_que_aca` o con `por_que_aca` vacío → error); lector (salto_confuso, bolsa) |
| 12 las piezas en orden hacia el hecho fuerte, o saliendo de él | lector (sin_hilo: no se puede decir el hilo en una oración; salto_confuso); C13 (el `hecho_fuerte` está en sus piezas; el orden de `piezas` es el que recibe el escritor) |

### Paso 2b · Lo que arma el código después del plan

- **Título impreso de cada capítulo:** `titulo.texto` si no está vacío; si está vacío, `etapa` más los años solo si `anios.seguros` es true ("De chica, 1954–1966"; sin años seguros, "De chica"). El código lo imprime arriba del capítulo (`# <título>`); el escritor no lo escribe y el arreglo no lo cambia (v3.2: en la prueba 3.1 el arreglo cambió el título por uno que ya no apuntaba al hecho fuerte). Si el lector lo marca `titulo_generico`, va al informe, no al arreglo.
- **Sin máximo de palabras (Naza, 01/10):** el largo de cada pieza lo da lo que la persona contó. No hay tope ni meta; lo único que se controla es que no se estire (el lector marca `relleno`: repetir con otras palabras).
- **"Sus frases"**: lo arma el código desde `plan.sus_frases`: cada frase pasa C6 (textual); el `contexto` lo escribió el plan y lo revisa el verificador como cualquier otra oración.
- **Título de la carta:** el código imprime `# <carta.titulo>` arriba de la carta, después de "Sus frases".
- **Título de "Antes de cerrar":** el código imprime `# Antes de cerrar` arriba de esa pieza, después del último capítulo y antes de "Sus frases". Si `antes_de_cerrar.ids` está vacío, la pieza no existe y el paso 3d no corre.
- **Dónde va cada R** (para C18): el código arma, desde el plan y el registro, la tabla R → pieza (capítulo de su episodio, `sus_frases`, `carta`, `antes_de_cerrar` o `primera_pagina`); si un R está en dos piezas (episodio "familia" con media línea), vale cualquiera de las dos.
- **Referencias colgadas** (para C25): nada que armar acá; el código las lista sobre el libro sin marcas, antes del paso 5.

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
8. Ningún párrafo de una sola oración puesto para dar peso o eco: lo que se dice va dentro de su párrafo. Nada de bloques de cita con ">".

Mal: "Me llamo Nélida Ferraro, nací en Rosario en 1954, tengo tres hijos y vivo en Funes."
Mal (golpe): "...y no me tiro ni un botón. [[R03]]" y abajo, solo en su párrafo: "Así soy yo. [[R03]]" → Bien: "...y no me tiro ni un botón. Así soy yo. [[R03]]" (o sin "Así soy yo", si no lo dijo).
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
| 8 sin párrafos de golpe ni bloques ">" | C1 (párrafo de una sola oración, de menos de 12 palabras, que no es diálogo → `ia` "párrafo de golpe"; línea que empieza con ">" → `ia`); lector (ia) |

### Paso 3b · Un capítulo

Mandan: secciones 2, 3, 4, 5, 7, 8, 9, 10; anexos A2, A6.

```
Sos el escritor. Escribís el capítulo {{N}} según el plan, en primera persona, con la voz de {{NOMBRE}}. Su título es "{{TITULO}}": lo pone el código, vos no lo escribís. Antes de escribir leé <libro_hasta_aca> (para no repetir nada ni volver a presentar a nadie) y la ficha <voz> entera. Mandan las secciones 2, 3, 4, 5, 7, 8, 9 y 10 de la guía y los anexos A2 y A6.

Bordes:
1. El hilo es el del plan. Entran todos los episodios del capítulo, en el orden y con la forma del plan: la escena entera y de una vez, con TODOS los "detalles" de su episodio; el resumen con los detalles que dio, hasta tres párrafos seguidos sin algo concreto; la media línea pegada a la historia a la que pertenece; el remate al cierre de su escena. Ningún episodio de otro capítulo. El capítulo se lee como una sola historia que va hacia su hecho fuerte (o sale de él): el orden de las piezas es el del plan y no lo cambiás.
2. Nada que no esté en los ids de los episodios del capítulo o en la ficha: ni dato, ni nombre, ni fecha, ni lugar, ni diálogo, ni sentimiento, ni motivo. Lo dudoso, vago; lo que no dijo, no se calcula.
3. Lo que terminó, en pasado. Lo que el registro tiene en "hoy" o en "rasgos_hoy", en presente.
4. Abre como dice el plan, sin resumir lo que viene ni ubicar con molde; cierra como dice el plan, sin explicar lo que significó ni anunciar lo que sigue. En el último capítulo, la "columna" del plan es lo que une cada párrafo, y el último párrafo es la "imagen_final": el libro termina en algo que se ve, no en una conclusión.
5. Las personas que el plan presenta acá entran haciendo algo, de a una, con su relación y un detalle que dio; las ya presentadas, solo el nombre; las que se presentan después, nombre y relación. Ninguna lista de nombres, pero nadie se cae: los que no tienen historia van en media línea, con sus nombres.
6. Sus palabras: sin adjetivos de catálogo, metáforas ni sentimientos con nombre que no dijo; sin las palabras ni los moldes del anexo A2; diálogo con raya; sin gerundio de posterioridad; el trato (vos o tú) de la ficha de voz.
7. Lo delicado, como lo contó, con el detalle que dio y nada más. Lo de no_poner, no está.
8. Ninguna frase cortada del audio: se cierra con lo que dijo en otra respuesta o se corta antes, en una oración entera.
9. Cada párrafo termina con la marca [[R..]] de las respuestas que usó. Ningún id de los episodios del capítulo queda sin marca. Nunca estirar ni repetir con otras palabras.
10. Cada episodio se cuenta en un solo tramo del capítulo: no se presenta en un párrafo y se vuelve a presentar más adelante. Lo que ya se contó, después solo se nombra.
11. Ningún párrafo de una sola oración puesto para dar peso o eco (fuera del diálogo con raya): lo que se dice va dentro de su párrafo. Nada de bloques de cita con ">": lo que dijo alguien va con raya o integrado en el párrafo.
12. El título no lo escribís: lo imprime el código desde el plan. El capítulo empieza directo en el primer párrafo.

Mal: "Con el transcurrir de los años, mi hija Marcela se convirtió en mi principal sostén." → Bien: "La nena, con los años, fue la que me bancó. Marcela, digo; para mí sigue siendo la nena. [[R33]]"
Mal (escena con detalles afuera): "Una noche Raúl me hizo sumar y no daba." cuando el episodio tiene la calculadora, la mesa de la cocina, Tito y el camión de la basura. → Bien: la escena con los cuatro.
Mal (cierre): "Y así fue como entendí que la familia es lo más importante." → Bien: "Raúl guardó la calculadora en el cajón y nunca más la sacó."
Mal (último capítulo): termina con "Y hoy, mirando para atrás, creo que hice lo que pude." → Bien: termina con la llave de la casa nueva colgada al lado de la puerta, como dice imagen_final.
Mal (dos veces): párrafo 2: "La mercería la pusimos en el 78, en la calle Mendoza, con la plata del Renault. [[R14]]" y párrafo 6: "La mercería la abrimos con Raúl en el 78, en Mendoza al 3400. [[R14,R22]]" → Bien: se presenta una vez, en el párrafo 2; en el 6 dice solo "la mercería".
Mal (golpe): después del párrafo del robo, solo en su párrafo: "Ese día fue muy complicado, la verdad. [[R35]]" → Bien: esa oración va al final del párrafo del robo, o no va.
Mal (bloque): "> A Raúl lo tuvieron en el piso." como bloque de cita entre dos párrafos. → Bien: "—A Raúl lo tuvieron en el piso —me dijo la Negra cuando llegué. [[R35]]", o integrado: "La Negra me lo dijo así, en la vereda: a Raúl lo tuvieron en el piso. [[R35]]"
Mal (orden): el plan pone la calculadora, el crédito y el robo, y el capítulo abre con el robo "porque es lo fuerte". → Bien: el orden del plan; el robo cierra.

Devolvé solo el capítulo en markdown, sin título: empezá en el primer párrafo.
```

| Borde | Quién controla |
|---|---|
| 1 hilo, episodios, formas y detalles del plan; el orden del plan, hacia el hecho fuerte | lector (sin_escena, repetido, sin_hilo, salto_confuso); C7 (6+ palabras repetidas entre piezas); C22 (≥70 % de los detalles de cada escena en el texto) |
| 2 nada sin respaldo | verificador (inventado, nombre, fecha, lugar, cita, motivo, sentimiento); C4, C5, C6 |
| 3 pasado / presente en las dos direcciones | verificador (presente, pasado), con "hoy" y "rasgos_hoy" del registro |
| 4 apertura y cierre; columna e imagen final en el último | lector (apertura_repetida, molde, cierre_explica, bolsa); C1 (moldes de A2 y cierres "y así…"); C20 (último párrafo del último capítulo con un id de `imagen_final`; máx. 2 párrafos solo de reflexion/gusto/balance) |
| 5 personas; nadie se cae | C17; C21 (cada persona con hechos está en el libro por nombre o apodo); lector (persona_dos_veces, lista, sin_presentar) |
| 6 voz y castellano | C1 (A2), C10 (A6); lector (no_suena, ia, deriva) |
| 7 delicado y no_poner | verificador (delicado) |
| 8 frases cortadas | C2 |
| 9 marcas; todo entra; no estirar | C18 (cada R del capítulo en una marca); lector (relleno, repetido) |
| 10 un episodio, un solo tramo | lector (repetido: el mismo episodio presentado en dos tramos del capítulo); C7 solo si repite 6+ palabras |
| 11 sin párrafos de golpe ni bloques ">" | C1 (párrafo de una sola oración, de menos de 12 palabras, que no es diálogo con raya → `ia` "párrafo de golpe"; línea que empieza con ">" fuera de Sus frases → `ia`); lector (ia) |
| 12 el título no lo escribe el escritor ni lo cambia el arreglo | el código lo imprime desde el plan (2b); C9 (un `antes` que incluya la línea del título no se aplica); `titulo_generico` del lector → informe, no arreglo (paso 6) |

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

### Paso 3d · Antes de cerrar

Solo si `plan.antes_de_cerrar.ids` no está vacío. Recibe lo mismo que la carta (`<libro_hasta_aca>`, `<voz>`). Mandan: sección 9 (la voz) y 10 (nada agregado; frases cortadas).

```
Sos el escritor. Armás "Antes de cerrar": lo que {{NOMBRE}} dice de su vida entera mirando para atrás, con los ids que el plan manda a "antes_de_cerrar", en ese orden. Primera persona, con sus palabras, casi textuales. Leé la ficha <voz>. Mandan las secciones 9 y 10 de la guía.

Bordes:
1. Entran todos los ids del plan y solo eso. Nada que ya esté contado en un capítulo de <libro_hasta_aca>; si una respuesta mezcla, queda solo lo que dice de su vida entera, con otras palabras que las del capítulo.
2. No le habla a la familia: eso es la carta. Ninguna idea, consuelo ni conclusión agregada; ningún "aprendí que" que no dijo.
3. Podés sacar muletillas, falsos arranques y lo que le habla al entrevistador, y cambiar una frase que contesta una pregunta que el lector no ve por su contenido.
4. Ninguna frase cortada por el audio queda cortada: se cierra con lo que dijo en otra respuesta (con ese id) o se corta antes, en una oración entera.
5. Corto, como la carta. El título lo pone el código: no lo escribas.
6. Cada párrafo termina con la marca [[R..]] de las respuestas que usó. Ningún id del plan queda sin marca.
7. Ningún párrafo de una sola oración puesto para dar peso o eco: lo que dice va dentro de su párrafo. Nada de bloques de cita con ">".

Mal: "Si tuviera que resumir mi vida, diría que fue una lucha constante que me hizo más fuerte." (no lo dijo) → Bien: "Lo más duro fue quedarme sola con el negocio. Me apoyé en Chiche y en el bastidor; con eso fui tirando. [[R62]]"
Mal: "Marcela, gracias por bancarme todos estos años." (eso es la carta) → Bien: queda en la carta; acá solo lo que dice de su vida.
Mal (golpe): "Lo más duro fue quedarme sola con el negocio. [[R62]]" solo en su párrafo, y abajo otro párrafo con el resto. → Bien: todo en un párrafo: "Lo más duro fue quedarme sola con el negocio. Me apoyé en Chiche y en el bastidor; con eso fui tirando. [[R62]]"

Devolvé solo el texto en markdown, sin título.
```

| Borde | Quién controla |
|---|---|
| 1 todo lo de "balance" y solo eso; nada repetido | C23 (cada R de un episodio `balance` en una marca de esta pieza); C7 (repetido con capítulos); lector (repetido) |
| 2 no le habla a la familia; nada agregado | verificador (inventado, sentimiento, motivo); lector (carta_ajena, al revés: un mensaje a los suyos acá) |
| 3 limpiar sin agregar | verificador |
| 4 frases cortadas | C2 |
| 5 corto; sin título | lector (relleno); el título lo imprime el código |
| 6 marcas; todo entra | C18, C23 |
| 7 sin párrafos de golpe ni bloques ">" | C1 (párrafo de una sola oración, de menos de 12 palabras, que no es diálogo → `ia` "párrafo de golpe"; línea que empieza con ">" → `ia`); lector (ia) |

### Paso 4 · Control de hechos (otro rol)

Recibe: guía, ficha, respuestas, registro, libro, `<presentes>` (C16: las oraciones en presente que listó el código) y `<pasados>` (C27: las oraciones en pasado que nombran a una persona con estado `sigue_hoy`). No recibe el plan ni los prompts de escritura. Manda: sección 13 parte 1; para juzgar, secciones 5 y 10.

```
Sos el verificador. No escribiste el libro y no lo vas a arreglar: lo comparás con el material y listás lo que no cierra. Manda la sección 13, parte 1, de la guía; para juzgar, las secciones 5 y 10. No opinás de estilo: solo hechos, tiempo verbal y verdad. Cada párrafo del libro termina con [[R..]]: las respuestas que el escritor dice haber usado; empezá por mirar el párrafo contra esas, pero el libro no puede decir nada que no esté en alguna respuesta o en la ficha, lleve la marca que lleve.

Para cada pieza del libro (primera_pagina, cap_N, antes_de_cerrar, sus_frases, carta), con lista, no de memoria:
1. Tiempo verbal: lo manda el registro. Lo que está en "hoy", en "rasgos_hoy" o con estado "sigue_hoy" va en presente; lo que tiene estado "termino", en pasado; solo si el registro no lo dice se mira la respuesta. Toda oración en presente del libro ("hoy", "ahora", "sigue", "todavía", y los verbos en presente) se busca ahí: si terminó, o nada dice que siga, es problema "presente"; lo que sigue hoy y el libro cuenta en pasado, es problema "pasado". Es el control más importante. <presentes> trae las oraciones en presente que encontró el código: mirá cada una, más las que encuentres vos. <pasados> trae las oraciones en pasado (era, hacía, tenía, cocinaba…) que nombran a una persona viva, con estado "sigue_hoy": para cada una mirá si lo que dice sigue siendo así hoy según el material; si sigue, es problema "pasado" con la corrección al presente. Si lo que dice terminó de verdad (un trabajo que dejó, una casa de la que se fue), no es problema.
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
Bien (pasado): "'Chiche fumaba como un escuerzo' — rasgos_hoy de Chiche, R18: 'Chiche fuma como un escuerzo, todavía'. Pasa a presente."
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
| 1 tiempo verbal: presente sobre lo que terminó; pasado sobre una persona viva | C16 (`<presentes>`, lista completa del código); C27 (`<pasados>`: oraciones en pasado que nombran a una persona `sigue_hoy`, lista del código, no bloquea); el verificador decide contra el material |
| 2–9 nombres, fechas, lugares, citas, motivos, confirmados, cortadas, delicado | verificador; C4, C5, C6, C2 lo adelantan por código |

**Repaso (después del arreglo).** El paso 4 vuelve a correr solo sobre las piezas cambiadas, con el mismo prompt y, además, `<decisiones_anteriores>` antes de las instrucciones (los problemas que esa pieza tuvo en la ronda anterior: frase, tipo, corrección y si se cambió) y este agregado al final del prompt (el código lo pega solo en el repaso):

```
Esta pieza ya pasó por vos una vez: <decisiones_anteriores> tiene lo que marcaste y cómo quedó. No marques lo contrario de una decisión anterior sobre lo mismo (presente ↔ pasado, un nombre por otro) salvo que tengas una respuesta que lo diga textual; en ese caso, tipo "contradice_decision", con el id y la frase de esa respuesta en "material". Lo nuevo que apareció con el cambio se marca como siempre.

Mal: ronda 1 pidió "Chiche fuma" en presente (rasgos_hoy, R18); ahora marcás "'Chiche fuma como un escuerzo' pasa a pasado" sin una respuesta nueva. → Bien: no se marca; o, si R52 dice "Chiche dejó de fumar el año pasado", tipo "contradice_decision", material: R52, "dejó de fumar el año pasado".
```

### Paso 5 · Lectura de corrido (otro rol)

Recibe: guía, libro y `<referencias>` (C25: las oraciones con "ese día", "esa noche", "ahí", "esa casa"… que listó el código). No recibe el material ni el plan. Manda: sección 13 parte 2; para reconocer, secciones 1 a 9 y anexos A2, A3, A6.

```
Sos el lector exigente. No escribiste el libro y no tenés el material: lo leés entero, de corrido, como lo va a leer la familia, y marcás lo que no se lee como libro. Manda la sección 13, parte 2, de la guía; para reconocer cada cosa, las secciones 1 a 9 y los anexos A2, A3 y A6.

Marcá solo lo que está en la lista de la parte 2: la primera página (si al terminarla no sabés quién es: qué hace, de dónde es, cómo es; o si abre con ficha o con un golpe); cada capítulo (¿se puede decir el hilo en una oración?, ¿tiene una escena?, ¿la primera y la última oración muestran un cambio?); aperturas o cierres repetidos o que explican; títulos que servirían para cualquier vida; personas presentadas dos veces, en lista, o nombradas sin que se sepa quién es; referencias colgadas ("ese día", "esa noche", "ahí", "esa casa", "él", "ella") que apuntan a algo que el libro todavía no nombró: mirá una por una las de <referencias>, y las que encuentres vos; saltos de tiempo que confunden y puentes con molde; último capítulo con reflexiones apiladas o la mesa como lista; carta con algo que no es para la familia; párrafos que no suenan a quien narra o con marcas de IA (también un párrafo de una sola oración puesto para dar golpe); repeticiones (cita que repite el párrafo, misma anécdota dos veces, un episodio o un lugar presentado en un párrafo y vuelto a presentar más adelante en el mismo capítulo, párrafo que repite el anterior); respuestas de botón; relleno (oraciones que repiten lo mismo con otras palabras para ocupar lugar); deriva de voz entre el primer capítulo y el último.

Para cada problema: la pieza, la frase o el párrafo exacto (copiado), el tipo y en una línea qué está mal. No propongas el texto nuevo: eso lo hace otro. No marques gusto personal ni lo que harías distinto: solo lo que la guía dice que no va.

Mal: "El capítulo 4 podría ser más emotivo." → Bien: "cap_4, cierre: 'Y así entendí que la plata va y viene' — cierra explicando (sección 7)."
Bien (referencia): "cap_2: 'Esa casa la pagamos en cuotas' — el libro no nombró ninguna casa antes de esta oración."
Bien (repetido): "cap_3, párrafo 6: 'La mercería la abrimos con Raúl en el 78, en Mendoza al 3400' — la mercería ya se presentó en el párrafo 2 (el 78, la calle Mendoza); acá se vuelve a presentar."

Devolvé solo el JSON del esquema.
```

Esquema de salida (`lectura.json`):

```json
{"problemas": [{"n": 1, "pieza": "cap_4", "frase": "", "tipo": "cierre_explica", "que": ""}]}
```

`tipo` ∈ primera_pagina | sin_hilo | sin_escena | apertura_repetida | cierre_explica | titulo_generico | persona_dos_veces | lista | sin_presentar | referencia | salto_confuso | molde | bolsa | carta_ajena | no_suena | ia | repetido | boton | relleno | deriva. Un `titulo_generico` no va al arreglo: el código lo manda al informe (el título es del plan y lo imprime el código; se arregla la receta o el plan, no el libro).

### Paso 5b · Cotejo (otro rol)

Recibe: `<respuestas>` y `<libro>` CON marcas `[[R..]]`; de la guía, solo las secciones 9 y 10. No recibe el plan, el registro ni los prompts de escritura.

```
Sos el cotejador. No escribiste el libro: comparás cada respuesta con lo que el libro hizo con ella y listás las frases de identidad que se cayeron. Cada párrafo del libro termina con [[R..]]: las respuestas que usó; empezá por ahí, pero una frase cuenta como entrada si está en cualquier parte del libro, dicha igual o de otra manera.

Para cada respuesta, buscá lo que no entró y que nadie más diría: cómo se ve, lo que piensa de su vida, cómo nombra a alguien ("mi mejor amiga de ahora"), un plan, un deseo, una frase propia. No listes datos que ya están contados, muletillas, ni lo que pidió que no esté.

Para cada falta: la respuesta, la frase textual (copiada de la respuesta) y en una línea por qué es suya.

Mal: "R33: falta decir que Marcela vive en Funes." (es un dato, y el libro ya lo cuenta) → Bien: "R33: falta 'para mí sigue siendo la nena' — es cómo la nombra ella; el libro dice solo 'Marcela'."
Mal: "R12: falta 'viste, qué sé yo'." (muletilla) → Bien: nada.

Devolvé solo el JSON del esquema.
```

Esquema de salida (`cotejo.json`):

```json
{"faltan": [{"n": 1, "id": "R..", "frase": "", "por_que": ""}]}
```

`frase` es textual de la respuesta. Lo que devuelve va al arreglo (paso 6) de la pieza que le toca: la elige el código (la pieza cuya marca tiene ese id; si no hay ninguna, la de la tabla R → pieza de 2b), como "falta frase de R..: «…»". El arreglo la tiene que meter con sus palabras (C24 lo comprueba).

| Borde | Quién controla |
|---|---|
| frase textual de la respuesta | C6 (subsecuencia de su id; si no, se descarta la falta) |
| entra en el arreglo | C24 (la mitad o más de sus palabras de contenido en el texto de su pieza; si no, al informe) |

### Paso 6 · Arreglo (una llamada por pieza con problemas)

Una sola ronda (Naza, 01/10: gastar menos). La llamada es la misma de escritura de esa pieza (3a, 3b, 3c o 3d: mismos documentos, misma instrucción), con `<pieza_actual>` (la pieza tal como está, con marcas y SIN la línea del título: el título es del plan, lo imprime el código y el arreglo no lo toca) y `<problemas>` antes de las instrucciones (los del código, del verificador, del lector y del cotejo juntos, numerados; un `titulo_generico` del lector no entra: va al informe) y este agregado al final. El arreglo ya no devuelve la pieza entera (v3.1: en la prueba 3 la ronda única reescribió de más, 9 de 11 piezas con menos del 70 % de párrafos idénticos): devuelve solo los cambios, y el código los aplica.

```
Esta pieza volvió del control con problemas (<problemas>). No la reescribas: está en <pieza_actual> y queda como está, letra por letra, salvo los tramos que cambies. Devolvé solo la lista de cambios, con las mismas reglas de arriba (marcas [[R..]] incluidas) y, además:
1. Cada problema cambia el texto marcado. Un problema de forma (primera página, cierre que explica, lista, repetido, frase cortada, molde, botón, no suena, ia, bolsa, carta ajena, referencia colgada, control del código) no se discute: se cambia.
2. Un problema de hecho (presente, pasado, nombre, fecha, lugar, cita, motivo, sentimiento, inventado, confirmado, delicado) se cambia; o, solo si tenés una respuesta que lo respalda tal cual, lo marcás "disputa" con el id y la frase textual de esa respuesta, y "antes" y "despues" vacíos. No decidís vos: lo decide el verificador.
3. Arreglar una lista nunca saca a nadie: se resume en media línea con los nombres. "Falta R..": ese contenido entra, con su marca. "Falta frase de R..: «…»": esa frase entra con sus palabras (textual o casi), en el lugar donde habla de eso. "Faltan detalles": esos detalles entran en su escena.
4. Cada cambio: "problema" es la lista de números de problema que resuelve; "antes" es un tramo COPIADO EXACTO de <pieza_actual> (con sus marcas [[R..]] si las tiene: una oración, o uno o más párrafos enteros, lo mínimo que haga falta); "despues" es cómo queda ese tramo, con la marca al final de cada párrafo que toque. Para agregar algo que falta, "antes" es el párrafo donde entra y "despues" ese párrafo con lo agregado (o ese párrafo más uno nuevo). Un "antes" que no está tal cual en la pieza no se aplica y el problema queda abierto.
5. Todo lo que no está en un "antes" queda igual. No se suma nada del material que no estuviera en el plan para esta pieza. El título del capítulo no se cambia: no está en <pieza_actual> y no va en ningún "antes" ni "despues". Un arreglo no mete un párrafo de una sola oración ni un bloque ">".

Mal (lista arreglada sacando gente): antes "Mis amigas del barrio eran la Negra, Susana, Tere, Alicia y la Beba. [[R21]]", despues "La Negra venía a la siesta a tomar mate. [[R21]]" y las otras cuatro desaparecen. → Bien: despues "La Negra venía a la siesta a tomar mate; las otras del barrio, Susana, Tere, Alicia y la Beba, venían a comprar. La Negra venía a quedarse. [[R21]]"
Mal (falta frase de R33: «para mí sigue siendo la nena»): despues "Marcela, mi hija querida, fue la que me bancó. [[R33]]" → Bien: antes "La nena, con los años, fue la que me bancó. [[R33]]", despues "La nena, con los años, fue la que me bancó. Marcela, digo; para mí sigue siendo la nena. [[R33]]"
Mal (antes recortado): antes "la calculadora" (dos palabras sueltas, no es una oración ni un párrafo) o antes "Raúl guardo la calculadora en el cajón" (sin la tilde que tiene la pieza). → Bien: antes "Raúl guardó la calculadora en el cajón y nunca más la sacó. [[R19]]", copiado exacto.
Mal (deriva): un problema en el párrafo 3 y "antes" con los párrafos 1 a 6 "para que cierre mejor". → Bien: antes el párrafo 3 solo.
Mal (título): el lector marcó "título que serviría para cualquier vida" y el cambio es despues "# Los años difíciles". → Bien: no hay cambio; ese problema no llega al arreglo, va al informe.

Devolvé solo el JSON del esquema de cambios.
```

Esquema de cambios:

```json
{"cambios": [{"problema": [1], "resultado": "cambiado", "antes": "", "despues": "", "disputa_id": "", "disputa_frase": ""}]}
```

`resultado` ∈ cambiado | disputa. `problema`: lista de números de `<problemas>` que ese cambio resuelve. En una disputa, `antes` y `despues` van vacíos. No existe "falsa alarma".

**Qué hace el código con el arreglo (C9):**
- El código arma la pieza nueva aplicando los cambios sobre `<pieza_actual>`: cada `antes` se reemplaza por su `despues`, con reemplazo exacto (letra por letra, marcas incluidas). Un `antes` que no está tal cual en la pieza no se aplica, y cada problema de su lista queda abierto. Todo lo que no está en un `antes` queda igual.
- El título del capítulo no está en `<pieza_actual>` (el código lo imprime desde el plan al armar el libro): un `antes` o un `despues` que empiece con `# ` no se aplica y sus problemas quedan abiertos. Los `titulo_generico` del lector no entran en `<problemas>`: van al informe.
- Para cada problema con "cambiado": la `frase` marcada (normalizada: minúsculas, sin tildes, espacios colapsados) ya no aparece en la pieza nueva. Si aparece, el problema sigue abierto y la ronda cuenta.
- "disputa" solo vale en problemas de hecho; en uno de forma se ignora y el problema sigue abierto.
- Cada disputa va a una llamada corta al verificador (mismos documentos del paso 4) con esta instrucción:

```
El escritor dice que esta frase del libro está respaldada por una respuesta. Frase del libro: "{{FRASE}}". Respuesta {{ID}}, frase que cita: "{{CITA}}". ¿La respuesta respalda la frase tal como está en el libro, incluido el tiempo verbal? Contestá solo {"respalda": true} o {"respalda": false, "por_que": ""}.
```

  Si respalda, el problema se cierra. Si no, sigue abierto y va al informe. Una disputa por problema.
- Después del arreglo, sobre la pieza cambiada: C1–C24 otra vez (C24: cada frase del cotejo entró), y el **repaso** del paso 4 con `<decisiones_anteriores>` (la guía lo manda: el control de hechos se vuelve a pasar sobre lo que cambió). No hay segunda ronda: lo que el repaso o los controles encuentren va al informe como abierto, salvo lo que C26 resuelve solo.
- **C26, el verificador que oscila:** si el repaso marca un problema de tiempo verbal o de nombre sobre una frase que la ronda anterior ya cambió en sentido contrario (presente ↔ pasado, un nombre por otro), no va al arreglo: el código lo manda a disputa automática (la llamada corta de arriba, con la frase del libro, el id y la cita que el verificador puso en "material"). Si el verificador no respalda su propio cambio, el problema se cierra; si lo respalda, va al informe como "el verificador oscila", con las dos decisiones. Un `contradice_decision` con respuesta textual entra en la disputa igual; si respalda, también va al informe (y se anota qué respuesta lo cambió).
- Se sigue registrando, sin bloquear, qué porcentaje de los párrafos sin problema quedaron idénticos (ahora mide si los `antes` se pasaron de largo: un `antes` de seis párrafos por un problema de uno): si baja de 70 % en una pieza, va al informe como aviso de deriva.

| Borde | Quién controla |
|---|---|
| 1–3 cada problema cambia; disputa solo en hechos; nadie se cae | C9 (frase marcada ya no está; disputa solo en hechos); verificador (disputa); C21 (nadie se cae) |
| 4 `antes` copiado exacto; `despues` con marcas | C9 (reemplazo exacto: un `antes` que no está, no se aplica y el problema queda abierto); C18 (marca en cada párrafo nuevo) |
| 5 lo demás queda igual; nada fuera del plan; el título no se toca; sin párrafos de golpe | C9 (el código aplica solo los `antes`: lo demás no puede cambiar; un `antes`/`despues` que empiece con `# ` no se aplica); porcentaje de párrafos idénticos al informe si baja de 70 %; C18 y verificador (nada fuera del plan); C1 otra vez sobre la pieza arreglada (párrafo de golpe, ">"); `titulo_generico` → informe |

---

## 4. Controles por código

Normalización para todos: minúsculas, sin tildes, espacios colapsados; las citas textuales (bloques `>` de Sus frases y tramos entre rayas o comillas que C6 ya verificó como de quien narra) se excluyen de C1 (salvo el control de ">" fuera de Sus frases, que es de C1), C10 y C15. Las marcas `[[R..]]` se quitan antes de todo control de texto salvo C18, C19 y C9 (que las necesitan); un párrafo sin marca es problema C18.

| # | Qué mira | Dónde | Si falla |
|---|---|---|---|
| C1 | Lista cerrada del anexo A2: palabras, muletillas de escritor y moldes (regex: "un antes y un despues", "punto de inflexion", "marco para siempre", "no era solo .{1,40}, era", "no se trataba de", "sin saberlo", "poco imaginaba", "aquel dia que", "en ese momento comprend", "quien iba a imaginar", "y asi (fue como\|aprendi\|entendi)", "eso me enseno", "este libro"); más de dos rayas (—) por párrafo fuera de diálogo; negritas, viñetas o subtítulos dentro de una pieza; **párrafo de golpe** (v3.2): un párrafo de una sola oración, de menos de 12 palabras (sin contar la marca), que no empieza con raya de diálogo, en primera página, capítulos, Antes de cerrar y carta; **bloque de cita** (v3.2): una línea que empieza con ">" fuera de Sus frases | toda pieza | problema tipo `ia` → arreglo ("párrafo de golpe: <la oración>"; "bloque de cita: <la línea>") |
| C2 | "…" o "..." en el texto | toda pieza | problema `cortada` → arreglo |
| C3 | Primera página: la primera oración empieza con "me llamo", "mi nombre", "naci", "soy [nombre y apellido]" seguido de coma y dato; o una oración de la primera página con más de un dato de ficha (año de cuatro cifras, "naci", "tengo N hijos", "vivo en", "me llamo") | primera_pagina | problema `primera_pagina` → arreglo |
| C4 | Nombres propios (palabra con mayúscula no inicial de oración) que no están en respuestas, ficha ni registro (también comparando con las palabras pegadas o partidas: "San Telmo" / "santelmo") | toda pieza | problema `nombre` → arreglo |
| C5 | Años de cuatro cifras que no están en respuestas ni ficha (los títulos impresos no se miran: sus años los puso el código) | toda pieza | problema `fecha` → arreglo |
| C6 | Cada bloque `>`, cada tramo de diálogo con raya, cada tramo entre comillas y cada frase de "Sus frases" es subsecuencia de una respuesta (quitando muletillas y falsos arranques) | toda pieza | problema `cita` → arreglo; en Sus frases, la frase se saca y va al informe |
| C7 | Seis o más palabras seguidas iguales en dos piezas distintas (fuera de nombres propios) | libro | problema `repetido` en la pieza posterior → arreglo |
| C8 | Cinco o más palabras seguidas del texto de una pregunta que aparecen en el libro (las anclas de repregunta, que son palabras de quien narra, no cuentan) | toda pieza | problema `boton` → arreglo |
| C9 | Arreglo: el código arma la pieza nueva aplicando cada `antes` → `despues` por reemplazo exacto sobre la pieza actual (un `antes` que no está tal cual no se aplica y sus problemas quedan abiertos; lo que no está en un `antes` queda igual); el título del capítulo no está en `<pieza_actual>` y un `antes` o `despues` que empiece con `# ` no se aplica (v3.2: el título es del plan y lo imprime el código); un `titulo_generico` del lector no entra en `<problemas>`, va al informe; cada frase marcada "cambiado" ya no está; disputas solo en hechos; porcentaje de párrafos sin problema que quedaron idénticos | pieza arreglada | ver paso 6 |
| C10 | Anexo A6: gerundio al inicio de oración ("-ando"/"-iendo" como primera palabra); "fue/fueron/era + participio + por"; diálogo con comillas en vez de raya ("dijo" pegado a comillas); mezcla de trato (tú/tienes/eres/puedes contra vos/tenés/sos/podés) distinta de `voz.trato`; palabras de diagnóstico (depresion, ansiedad, trauma, alcoholico, alcoholismo, adiccion, adicto) que no están textuales en el material | toda pieza | problema `ia` (o `inventado` en diagnóstico) → arreglo |
| C11 | (sacado el 01/10: Naza no quiere máximo de palabras; el largo lo da lo que contó) | — | — |
| C12 | Títulos del plan: cada palabra de contenido del título está en sus ids (textual) o en el material (armado); si `titulo.id` no está vacío, es un id del `hecho_fuerte` de ese capítulo; ninguna de: etapa, linda, lindo, hermosa, hermoso, gran, sueños, sueño, luchas, lucha, difícil, feliz, felicidad, importante, especial, inolvidable; no es solo un nombre de persona; leídos en lista, no hay dos iguales | plan | reintento del paso 2 con el error |
| C13 | Plan: cada episodio del registro (no `no_poner`) está una sola vez (en `piezas`, `sus_frases`, `carta.ids` o `antes_de_cerrar.ids`); cada episodio `balance` está en `antes_de_cerrar.ids`; ninguna pieza tiene forma `escena` si su episodio es `es_escena: false`; cada capítulo tiene ≥1 pieza `escena`; cada `momento_clave` no vacío con `es_escena: true` está como `escena`; cada capítulo tiene `hecho_fuerte` que está en sus `piezas` y, si el capítulo tiene episodios con `momento_clave`, es uno de ellos: si su episodio es `es_escena: true`, su forma es `escena`; si es `es_escena: false`, su forma es `resumen`, es el `apertura.episodio` o el `cierre.episodio`, y `faltantes` tiene una entrada cuyo `que` empieza con "hecho fuerte sin escena" y cuyo `donde` nombra ese capítulo; si el capítulo tiene piezas `escena`, `apertura.episodio` es una de ellas (si no tiene ninguna, `faltantes` tiene "capítulo sin escena" para ese capítulo); `hilo_ids` no vacío; `apertura.tipo` y `cierre.tipo` distintos del capítulo anterior; cada P en `presenta` de un solo capítulo; el último capítulo tiene en `hilo_de_hoy_ids` un episodio con `sigue_hoy` y `es_escena: true` o, si no existe ninguno en el registro, el episodio `es_escena` más reciente de la línea de tiempo; el último capítulo tiene `columna.texto` y `columna.ids` no vacíos e `imagen_final.episodio` que está en sus piezas, es `sigue_hoy` (o tiene ids del bloque "hoy") y es el `cierre.episodio`; cada id de `como_se_presenta` y `cosas_concretas_suyas` está en `primera_pagina.que_dice_de_si_ids` o en una pieza; `carta.titulo` no vacío, distinto de "Antes de cerrar" (y `titulo_id` existe si lo tiene); `sus_frases.contexto` ≤ 20 palabras; **plan por época** (v3.2): ninguna pieza de un episodio `dato`, `gusto` o `reflexion` con estado `sigue_hoy` en un capítulo que no es el último sin `por_que_aca` no vacío (error: "C13 cap_N: E.. es <tipo> sigue_hoy y no es de esta época; va al último capítulo, a Antes de cerrar, a Sus frases o a la carta, o lleva por_que_aca"). (Lo de "familia" en la carta lo mira C19; el último capítulo sin bolsa, C20) | plan | reintento del paso 2 con el error |
| C14 | Registro: todo id citado existe; cada R (no "paso") aparece en algún episodio o en `sin_lugar`; cada frase de `voz.frases` es subsecuencia de su id y hay entre 15 y 20; `segura: true` solo si en sus ids o en la ficha hay un número; todo "…" de una respuesta usada tiene entrada en `frases_cortadas`; no hay dos personas con mismo nombre y relación; cada línea de `<confirmado_por_el_narrador>` tiene su entrada en `confirmados` con `usado_en` no vacío; `estado` presente en personas, lugares y episodios; cada episodio tiene `a_quien` válido y `a_quien_nombres` que son personas del registro; cada episodio `es_escena: true` tiene `detalles` no vacío; cada persona tiene `rasgos_hoy` (puede ser `[]`) | registro | reintento del paso 1 con el error |
| C15 | Último capítulo: más de dos párrafos seguidos que empiezan con "yo creo que", "creo que", "siento que", "pienso que", "lo que mas me gusta", "lo que herede", "para mi lo mas importante" | último capítulo | problema `bolsa` → arreglo |
| C16 | Presente sospechoso para el verificador: lista de oraciones con "hoy", "ahora", "todavia", "sigue", "siguen", "sigo" y verbos en presente, con pieza y número de párrafo | libro | no bloquea: se adjunta al paso 4 como `<presentes>` para que la lista sea completa |
| C17 | Presentaciones: patrón "mi (marido\|mujer\|hermana\|hermano\|hijo\|hija\|madre\|padre\|mama\|papa\|amiga\|amigo\|tia\|tio\|abuela\|abuelo\|nieta\|nieto) [Nombre]" o "[Nombre], (mi\|que es mi) …" para el mismo nombre en dos piezas distintas (o dos veces en la primera página) | libro | problema `persona_dos_veces` en la pieza posterior → arreglo |
| C18 | **Todo entra (rastreo):** cada párrafo de primera página, capítulos, "Antes de cerrar" y carta termina con una marca `[[R..]]` con ids que existen; toda respuesta (no "paso", no de un episodio `no_poner`) aparece en alguna marca del libro o como id en "Sus frases" | libro | párrafo sin marca → problema `sin_marca` en esa pieza; R sin marca → la pieza que le toca según la tabla R → pieza (2b, que suma `antes_de_cerrar`) vuelve al arreglo con "falta R..: <qué contaba>" (el `que` del episodio o las primeras 15 palabras de la respuesta) |
| C19 | **A quién le habla:** en el plan, cada episodio con `a_quien: familia` está en `carta.ids`, y cada persona de `carta.para_personas` sin ningún episodio `familia` que la nombre (en `a_quien_nombres`) tiene su entrada en `faltantes` ("la entrevista no trae un mensaje para <nombre>"); en el texto, cada R de esos episodios está en una marca de la carta | plan, carta | plan: reintento del paso 2 con el error; carta: arreglo con "falta R..: <qué les dice>" |
| C20 | **Último capítulo con una sola historia:** en el plan, el último capítulo tiene como máximo 2 piezas de episodios tipo `reflexion` o `gusto`, contando las de forma `media_linea` (v3.1: las medias líneas también lo volvían bolsa); en el texto, como máximo 2 párrafos cuyas marcas sean solo de respuestas de episodios `reflexion`/`gusto`/`balance`, y el último párrafo lleva una marca con un id del `imagen_final` (`frase_id` o un id de su episodio) | plan, último capítulo | plan: reintento del paso 2 con el error; texto: problema `bolsa` → arreglo (el último párrafo sin la imagen final: "el capítulo no cierra en la imagen_final: <que>") |
| C21 | **Nadie se cae:** cada persona del registro con `hechos` no vacío aparece en el libro (sin marcas) por `nombre` o por alguno de sus `apodos` | libro | problema `lista` en la pieza del capítulo donde el plan la presenta (o, si no la presenta, donde está el episodio de su primer hecho) con "falta <nombre>: <su primer hecho>" → arreglo; el arreglo la pone en media línea, nunca la deja afuera |
| C22 | **Escenas llenas:** por cada pieza `escena` de un capítulo, al menos el 70 % de los `detalles` de su episodio aparece en el texto del capítulo (cada detalle: sus palabras de contenido, normalizadas, en una ventana de 12 palabras del texto; si tiene un número, el número) | cada capítulo | problema `sin_detalles` → arreglo con "faltan detalles de E..: <lista de los que faltan>" |
| C23 | **El balance entra:** cada R de un episodio `balance` está en una marca de "Antes de cerrar" | antes_de_cerrar | arreglo de esa pieza con "falta R..: <qué decía>" |
| C24 | **Lo del cotejo entró:** después del arreglo, cada frase de `cotejo.json` está en el libro: la mitad o más de sus palabras de contenido (normalizadas) en el texto de su pieza | pieza arreglada | no hay segunda ronda: va al informe como "lo que el cotejo encontró y no entró", con la frase y su R |
| C25 | **Referencias colgadas** (no bloquea): lista de oraciones del libro sin marcas con "ese día", "esa noche", "esa vez", "ese momento", "esa casa", "ese lugar", "ahí", "allá", con pieza y número de párrafo | libro | se adjunta al paso 5 como `<referencias>` para que el lector mire cada una |
| C26 | **El verificador oscila:** en el repaso, un problema de tipo `presente`, `pasado` o `nombre` (o `contradice_decision`) sobre una frase que la ronda anterior ya cambió en sentido contrario según `<decisiones_anteriores>` | repaso del paso 4 | no va al arreglo: disputa automática (paso 6); si el verificador respalda su nuevo pedido, al informe como "el verificador oscila" con las dos decisiones; si no, se cierra |
| C27 | **Pasado sobre una persona viva** (para el verificador): lista de oraciones del libro en pasado (era, estaba, hacía, tenía, cocinaba, vivía, trabajaba… imperfecto o pretérito) que nombran, por `nombre` o `apodo`, a una persona del registro con estado `sigue_hoy`, con pieza y número de párrafo | libro | no bloquea: se adjunta al paso 4 como `<pasados>`; el verificador mira cada una contra el material y marca `pasado` solo si lo que dice sigue siendo así hoy |
| C28 | **Hoy en un capítulo del pasado** (02/10, prueba corta de la v3.2: el escritor agregó "hoy con Ariel no tengo la mejor relación" en el capítulo de 2020): oraciones fuera de diálogo con "hoy", "actualmente", "al día de hoy", "en la actualidad" en un capítulo que no es el último | capítulos menos el último | problema `hoy_en_pasado` → arreglo: lo de hoy sale de ahí (lo cuenta el último capítulo); solo si es la consecuencia directa del hecho del capítulo queda, en una oración al final (C9 lo deja abierto y va al informe) |

Falsas alarmas del código: si el verificador, el lector o el cotejador, en su JSON, no incluyen un problema que C1–C27 marcó, el problema igual va al arreglo (el código manda; no hay quien lo levante). Si el arreglo lo cambia y el cambio empeora, se verá en el repaso y va al informe. Lo que el código marca mal de forma repetida se anota en el informe para ajustar el control, nunca para saltearlo.

---

## 5. Reintentos y topes

| Dónde | Cuántas veces | Qué pasa después |
|---|---|---|
| Paso 1 (C14 falla) | 2 reintentos con el error pegado al final de las instrucciones | se detiene y avisa: el material o el prompt tienen un problema que no se arregla solo |
| Paso 2 (C12/C13 fallan) | 2 reintentos con el error | igual |
| Paso 3 (controles C1–C23 sobre la pieza recién escrita, incluidos rastreo, personas y detalles) | 1 arreglo (paso 6) con solo los problemas del código | si sigue fallando, se sigue y va al informe |
| Paso 6 (después de 4, 5 y 5b) | **1 ronda** por pieza (Naza, 01/10: gastar menos); junta lo del código, el verificador, el lector y el cotejo | repaso del paso 4 y C1–C24 sobre la pieza cambiada; lo que quede abierto, al informe (C26 resuelve solo las oscilaciones) |
| Disputa | una por problema (también la automática de C26) | la decide el verificador |
| Llamadas de 4, 5 y 5b | si el JSON no cumple el esquema, 1 reintento | si vuelve a fallar, se sigue sin esa lista y se avisa en el informe |

Lo que llega al informe nunca se arregla a mano en el libro: se arregla la receta, o se le pregunta al narrador (faltantes).

---

## 6. Qué entrega el circuito

- `libro.md`: título, primera página, capítulos, Antes de cerrar (si hay), Sus frases, carta con su título. Sin marcas `[[R..]]` (quedan en `libro-con-marcas.md`, para revisar).
- `informe.md`: `faltantes` del plan (etapas sin escena, hoy sin momento, dudas que dejaron algo vago, mensajes que la entrevista no trajo), problemas abiertos por pieza después de la única ronda, títulos que el lector marcó genéricos (con el capítulo y su `hecho_fuerte`: se arregla la receta o el plan, no el libro), lo que el cotejo encontró y no entró (C24, con la frase y su R), oscilaciones del verificador (C26, con las dos decisiones), disputas y cómo se resolvieron, avisos de deriva (C9), falsas alarmas del código, costo por paso. Es para Naza y para quien ajuste la entrevista: lo que el libro no tiene, la guía dice que lo arregla la entrevista, no el escritor.
