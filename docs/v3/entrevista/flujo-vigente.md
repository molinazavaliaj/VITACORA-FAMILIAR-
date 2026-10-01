# El flujo de la entrevista (vigente)

Cómo funciona la entrevista de punta a punta. **Este es el documento vigente** (última actualización: 30/09/2026, después de que Naza hizo la entrevista como narrador en la página de prueba: cierres con "Hasta acá lo de…", el botón [Prefiero no contarla], el bloque 6 nuevo con AMH y AM21, G1, HE2 y HO11 al núcleo, FI6 a extra, acuses; los textos en [`simulaciones/textos-prueba-naza.md`](simulaciones/textos-prueba-naza.md); y después, las propuestas de Fable que faltaban y dos decisiones de Naza: AMH "¿Hoy estás en pareja?" y la salida "Si ya me lo contaste, decímelo, y si querés reforzar algo, es el momento.", en [`simulaciones/textos-fable-extras.md`](simulaciones/textos-fable-extras.md)). Las versiones anteriores están en [`historial/`](historial/) (la de justo antes: [`flujo-2026-09-30-antes-de-la-prueba-de-naza.md`](historial/flujo-2026-09-30-antes-de-la-prueba-de-naza.md)).

- Los textos exactos: [`banco.md`](banco.md) (fuente de verdad; el código se genera desde ahí).
- La entrevista completa de una vida inventada, mensaje por mensaje: [`lectura-corrida.md`](lectura-corrida.md).
- Qué cambió al leerla y por qué: [`correcciones-lectura.md`](correcciones-lectura.md). El porqué de las decisiones anteriores: [`../metodo-entrevista.md`](../metodo-entrevista.md).
- El código: `fabrica/src/v3/entrevista/` (tests verdes: `cd fabrica; npx vitest run`). Lo que falta conectar está al final.

## 1. Antes de empezar
- **Compra.** Quien regala carga una ficha corta: nombre, cómo le dicen, género (para "chico/chica", "padre/madre"), si habla de vos o de tú (**todavía no programado**: hoy todos los textos están en vos; Naza decidió hacerlo cuando esté todo cerrado; ver "Pendiente grande" en correcciones-lectura.md), y su propio contacto (para el aviso M9). Si quiere, sube un **álbum de fotos**, que se puede completar hasta que se escribe el libro.
- La ficha **no decide qué preguntas llegan**. Queda para el escritor y para comparar con lo que la persona cuenta (dudas del dashboard, sección 8).

## 2. El arranque
1. **Bienvenida (BIEN), un solo mensaje:** "Hola, {{nombre}}, ¿cómo estás? Una persona que te quiere mucho te regaló un libro con la historia de tu vida, y yo soy quien te va a entrevistar para armarlo…", con cómo funciona (audios, que no tiene que avisar nada, que puede decir que no, sin apuro). M6 ya no se manda.
2. La primera pregunta (OR1, que ya arranca con "Empecemos por…", por eso el bloque 1 no lleva frase de entrada).

## 3. Cada bloque
1. **Frase de entrada** (EN2 a EN15): antes de la primera pregunta que se manda del bloque, una frase que anuncia el tema y no pide respuesta ("Hablemos de los amigos, {{nombre}}, y de la gente que te dio una mano en la vida."). No llevan: el bloque 1 (OR1 ya arranca así), el 6 (AM0: "Ahora vamos al amor…") y el 11 (el aviso AV11 cumple ese papel).
2. Las **preguntas** del bloque, una por vez (sección 4).
3. El **cierre** del bloque (CI1 a CI14): "Hasta acá lo de… ¿Quedó algo de eso que no te pregunté?" (desde la prueba de Naza: "Con esto cerramos el trabajo" se leía como "terminamos la entrevista"). Llega **siempre**, en todos los bloques del 1 al 14, y espera respuesta. El bloque 15 no tiene cierre: termina con el mensaje final.
4. Después del cierre, en todos los bloques: una de las 4 frases M24, que rotan y solo agradecen, sin sonar a que terminó la entrevista ("Gracias, {{nombre}}. Eso también va al libro."). Va como primera línea del mensaje de la frase de entrada. Ya no va "Terminamos esta etapa" (M10): la entrada hace de pasaje.

Así se lee el paso de un bloque a otro, en mensajes de WhatsApp: [cierre] → respuesta → [M24 + frase de entrada] → [primera pregunta].

## 4. Cada pregunta
- Llega **una por vez**.
- **Botones de WhatsApp** (Naza, 30/09, simulaciones) debajo de 31 mensajes: las 8 que abren tema ([Sí…] [No…]: CA6, JU8, AM0, AMH, AM3, AM21, HI0, HI8), las 8 sensibles con [Prefiero no contarla] (CA17, AD15, JU17, TR11, PE1, PE5, PE4 y AM9; hasta la prueba de Naza se llamaba [Paso esta], que se leía como "esto me pasó"), los 14 cierres ([No, está todo]) y la foto ([No tengo foto]). La lista exacta está en [`banco.md`](banco.md), sección "Botones". La pregunta va entera, así se puede contestar tocando o en audio: **Ronda 2 (Naza, 30/09):** CA17, AD15, JU17, TR11 y PE4 suman un segundo botón, [No, nada así] (vale "no": M25); PE1, PE5 y AM9 van solo con [Prefiero no contarla].
  - **toca "Sí"**: le llega "Contame, te escucho." (M30), solo, y la pregunta sigue esperando el audio; cuenta como "sí" para las que dependen, con audio o sin él. En AMH no: [Sí, estoy en pareja] cierra la respuesta y sigue AM1 (es una pregunta de ubicación);
  - **toca "No…"**: vale como un "no" corto (no llegan las de ese tema);
  - **toca [Prefiero no contarla]**: vale como paso;
  - si toca un botón y además manda audio, el audio se guarda con esa pregunta, pero **manda el botón**;
  - la primera vez que un mensaje lleva botones (CI1 en una vida completa), debajo va una línea de ayuda, una sola vez: _Podés tocar el botón de abajo, o contestarme en audio como siempre._ (M31).
- **La frase del "paso" (M1)**, en otra línea y en cursiva (_Si no va con vos, decí paso y vamos a otra._), va **solo** en:
  - las 3 primeras preguntas que se mandan en la entrevista;
  - CA6 (hermanos), JU8 (irse a vivir a otro lado), AM0 (el amor), AM9 (cómo fue el final, si esa persona ya no está), HI0 (hijos), HI8 (nietos); AMH y AM21 no llevan M1;
  - las preguntas del bloque 11 (momentos difíciles).
  
  Nunca debajo de cierres, aviso, foto ni final. En una vida completa son 11 (12 si esa persona ya no está: se suma AM9).
- La persona contesta con **uno o varios audios**; se suman a esa pregunta. Cuando pasan unos minutos sin audios nuevos, llega el agradecimiento y la siguiente.
- **Agradecimiento** después de cada respuesta. Va como **primera línea del mensaje que sigue** (el de la pregunta o el de la frase de entrada), no como mensaje aparte; solo el sobrio (M4) va **solo**:
  - una de las 8 frases que rotan (M3: "Gracias, {{nombre}}. Ya lo guardé."); si lo que sigue es un cierre, LE9 o una pregunta difícil, en su lugar va "Gracias, {{nombre}}." (M26), para no anunciar "otra pregunta" arriba de "Hasta acá lo de…" ni sonar liviano antes de algo pesado; también delante de AM21 ("Ahora las de antes"); después de PG1 (tus viejos de grande) y de AMH ("¿sigue hoy a tu lado?") va siempre M26;
  - después de una pregunta difícil (el momento difícil de cada época CA17, AD15, JU17; la plata ajustada TR11; AM9; todo el bloque 11), una de las 4 sobrias (M4), sola;
  - después de un cierre: M24 (sección 3);
  - si contestó con un **"no" corto** o tocó un botón de "No", en **cualquier** pregunta: el neutro (M25: "Bien, seguimos." o "Bien, entonces."; delante de algo que arranca con "Seguimos" o "Pasamos" va "Bien, entonces."). Lo mismo con un "ya te lo conté" corto;
  - si dijo **"paso"** (o tocó [Prefiero no contarla]): en una común, "Dale, la salteamos. Vamos con otra." (M21); en una difícil, una de las 3 de M27 ("Está bien, {{nombre}}. Lo dejamos ahí."…); en un cierre, M25;
  - si **no se acordó** ("no me acuerdo", "no sé"…): "No pasa nada, {{nombre}}. Vamos con otra." (M28.1); al tercer olvido seguido, una sola vez en toda la entrevista, en su lugar va M29 ("Una cosa, {{nombre}}: no te hagas problema si algo no te acordás…");
  - después de M30 no va acuse (es un mensaje solo); el audio que llega después lleva el acuse normal de esa pregunta;
  - si arrancó con "no me acuerdo" y siguió contando (olvido a medias): "Con ese pedacito me alcanza, {{nombre}}. Gracias." (M28.4) y "Con eso me alcanza, gracias. Vamos con otra." (M28.5), que rotan: nunca dos iguales seguidos (prueba de Naza);
  - si el agradecimiento ya dice el nombre, la foto (FO1) va sin el nombre: "Otra cosa. ¿Hay alguna foto…" (prueba de Naza: "…me alcanza, nazareno. Gracias. / Otra cosa, nazareno.");
  - si mandó **texto** en vez de audio: M22; si el audio llegó **cortado**: M23;
  - después de **LE9** ("¿algo que no te pregunté?"): **nada**, LE8 arranca sola;
  - después de **LE8** ("hablale a tu familia"), la última pregunta: **nada**, va directo el mensaje final.
- **Si contesta en audio en vez de tocar** (reglas de respaldo, Naza, 30/09, simulaciones), sobre la transcripción:
  - **"Paso":** "paso" como primera palabra, sin importar el largo (salvo que siga "a / por / de / que / el / la / los / las / un / una / mucho / tiempo / todo", que es el verbo: "Paso el río en bote"); "paso" como última palabra de una respuesta de hasta 12; o una respuesta de hasta 12 palabras con una frase de la lista **sola**, seguida de un signo o del final (siguiente, otra, salteala, esa no, eso no, de eso no, prefiero no, mejor no: "Siguiente.", "De eso no. Hay cosas que prefiero guardarme.", pero no "Otra vez fuimos al río" ni "Esa no era mi casa"), o con una negativa completa aunque siga algo (no quiero hablar de eso, prefiero no hablar de eso, prefiero no contarlo, eso me lo guardo, me lo guardo, dejémoslo ahí, mejor otra). Se admite "eso", "esa", "de eso", "ahí" o "mejor" adelante. "Pasó", con tilde, no es "paso". (Revisión del 30/09 (Naza, decisión A en las frases).)
  - **AMH ("¿Hoy estás en pareja?", prueba de Naza):** un "no" corto (hasta 40 palabras) o una respuesta que arranca con "ya no" o con una palabra de final (falleció, murió, enviudé, nos separamos, me separé, nos divorciamos, me divorcié, terminamos, cortamos) vale "no": ya no está. También "no estoy en pareja", "no estoy con nadie", "no tengo pareja", "estoy sola/solo", "quedé sola/solo", "sin pareja" o "soltera/soltero" en las primeras 5 palabras. "Sí…" vale sí, y "estoy en pareja", "tengo pareja" o "estoy con…" también, aunque arranque con "no" ("No, estoy con Hugo").
  - **"Ya te lo conté":** hasta 15 palabras con "ya te lo conté", "ya te conté", "ya lo conté" o "ya te lo dije", si no arranca con un "no": "No tuve hijos, ya te lo conté" es un "no" (Revisión del 30/09 (Naza, decisión A en las frases)).
  - **Olvido:** hasta 20 palabras, sin "pero" ni "aunque", que arrancan con "no me acuerdo", "no recuerdo", "no sé", "ni idea" o "no tengo idea" (también "No, no me acuerdo"; "no sé" no puede seguir con "si", "por", "cómo", "qué", "cuál", "dónde" ni "cuándo": "No sé por dónde empezar…" cuenta algo), o con "se me borró" en las primeras 8 palabras, o con "la memoria"/"la cabeza" junto a "me falla", "me está fallando", "se me borró" o "no me da". No es un "no": para las que dependen cuenta como "sí" (Revisión del 30/09 (Naza, decisión A en las frases); antes: hasta 40 palabras y "la memoria"/"la cabeza" sueltas).
  - **"No" corto:** empieza con no / nunca / jamás / ninguno / nada / tampoco (entiende "Eh, no", "Nooo") y tiene **hasta 15 palabras**; **hasta 40** en los 14 cierres, en LE9, en las difíciles y en las 9 que abren tema. "Pero" o "aunque" en las primeras 5 palabras lo dan vuelta ("Nunca lo pensé, pero…"); más lejos no, y en los cierres nunca. No son "no" los arranques que cuentan algo: "nada que ver", "nunca me voy a olvidar", "no sabés", "no te imaginás", "no me lo vas a creer", "no sé…". En HI0, si dice "propios/propias", "crié/criamos/crió…" o "como un hijo / como mi hijo / como una hija", cuenta como "sí" (la pregunta pide a los criados). (Revisión del 30/09 (Naza, decisión A en las frases).)
  - **Ronda 2 (Naza, 30/09):** en los cierres y en LE9, "está todo", "es todo", "ya está" o "nada más" en las primeras 6 palabras es un "no" aunque no empiece con "no" ("Sí, está todo. Fue una vida plena"), sin tope de largo, salvo "pero/aunque" en las primeras 5. **Olvido a medias:** arranca con una frase de olvido y sigue contando (más de 20 palabras o con "pero/aunque"): contó algo, lleva "Con ese pedacito me alcanza, {{nombre}}. Gracias." (M28.4) en lugar de M3 o M4, y no suma ni corta la cuenta de M29 (decisión del programador: ni suma ni corta). **Se negó pero siguió:** arranca con una frase de la lista del paso que es una negativa (completa, sola con un signo, o "mejor no hablemos"/"prefiero no hablar de eso") y sigue larga: contó algo, y en lugar de M3 o M4 va M32 ("Con lo que me dijiste alcanza, {{nombre}}. Lo demás queda tuyo. Vamos con otra." / "Está bien. Lo que me contaste queda, y lo que no, no hace falta. Seguimos."). Delante de un cierre o de LE9, M32 y M28.4 dejan lugar a M26; en un cierre sigue M24. M26 va también delante de AM21 (antes, de AM20). M27.3 ahora dice "Entiendo, {{nombre}}. No hace falta entrar ahí. Vamos con la que viene." **Revisión de la ronda 2 (30/09):** la fórmula de cierre tiene que empezar en las primeras 4 palabras y cerrar la frase; si no arranca con "no", después quedan como mucho 6 palabras (o "lo que…" hasta 12 en total); con una señal de que agrega algo (agregar, sumar, me acordé, me acuerdo de, quiero contar, "ah, y") no es "no". El olvido es olvido si después de la frase quedan como mucho 6 palabras que no estén en la pregunta (prueba de Naza: "No recuerdo, la verdad, algún maestro o maestra que me haya marcado en la primaria" solo repite la pregunta: es olvido, M28.1, no "Con ese pedacito…"); si sigue contando, es olvido a medias (M28.4/M28.5). Para M32 la frase tiene que ser una negativa completa o ir seguida de un signo fuerte (punto, punto y coma, dos puntos, exclamación; no una coma), y nunca de "dijo / decía / me dijo" ("Otra, dijo mi mamá…" cuenta). M32.2 termina en "Seguimos.": delante de "Seguimos…" o "Pasamos…" va M32.1.
  - **Queda así, a propósito (el revisor lo marcó):** el olvido a medias no corta la cuenta de M29 (ni la suma): contó un pedacito, pero le sigue costando acordarse.
  - **Lo que el revisor marcó y queda así, a propósito:** el olvido habilita las que dependen en todas las preguntas, no solo en las que abren tema (mejor una pregunta de más). M21, M25 y M28 siguen igual delante de una sensible (M26 solo reemplaza al común M3). Las marcas "no quiso" / "pidió no ahondar" / "no se acuerda" son S13 (dashboard).

## 5. Preguntas que abren un tema

Las 8 llevan botones de "Sí" y "No" (sección 4). Un "no" es tocar el botón de "No" o un "no" corto en audio; un olvido cuenta como "sí".

| Abre | Botones | Si contesta que no | Si contesta "paso" |
|---|---|---|---|
| Hermanos (CA6) | [Sí, tuve] [No tuve hermanos] | no va "tus otros hermanos" (extra) | igual |
| Irse a vivir a otro lado (JU8) | [Sí, me mudé] [No, nunca me mudé] | no van "quién te dio una mano" ni "sentirte de ahí" (extra) | ídem |
| El amor: ¿hubo alguien en serio? (AM0) | [Sí, hubo] [No hubo] | no van las de pareja; va "las personas con las que compartís la vida" (AM15) | no van las de pareja |
| ¿Hoy estás en pareja? (AMH, nueva) | [Sí, estoy en pareja] [No estoy en pareja] | ya no está: van "cómo fue el final" (AM9) y, si armaron la vida juntos, "por tu cuenta" (AM19: `sino:AMH y si:AM3`); AM7 dice "repetía" | sigue: no van AM9 ni AM19 |
| ¿Llegaron a armar la vida juntos? (AM3) | [Sí] [No llegamos a eso] | no van "el día del casamiento" (AM4), "la pelea que da risa" (AM13) ni "por tu cuenta" (AM19) | ídem |
| Las de antes (AM21, nueva; reemplaza a AM16 y AM20) | [Sí, hubo otras] [Fue la única] | nada depende de ella (M25) | — |
| Hijos (HI0) | [Sí, tuve] [No tuve hijos] | no van las de hijos ni las de nietos; va "chicos importantes en tu vida" (HI10) | no van las de hijos ni las de nietos |
| Nietos (HI8) | [Sí, llegaron] [No hay nietos] | no van las de nietos | ídem |

"Cómo fue el final" (AM9) ya no abre tema: llega solo si AMH fue "ya no está", lleva [Prefiero no contarla] y nada depende de ella. AM16 y AM20 salieron del banco (a `banco-descartadas.md`). "Hermanos de grandes" (HE2, núcleo desde la prueba de Naza) depende de CA6.

Además, "el día que llegó tu primer hijo" (HI2) cierra el tema: con un "no" corto o "paso" no van "cómo era cada uno" (HI3), "la crianza" (HS1) ni "el orgullo" (HI6). "¿Tuviste más hijos?" (HI2b) ya no está: HI0 pide presentarlos a todos.

En todos los casos el cierre del bloque llega igual (sección 3), así que siempre tiene dónde contar lo que sí le pasó de ese tema.

**El amor, según la vida** (prueba de Naza, 30/09: el detalle va a la pareja de ahora, o a la última si hoy no hay nadie; las de antes, una sola pregunta con un momento de cada una; probado con 9 vidas inventadas): sigue en pareja (con la primera o con otra) → repaso, "¿Hoy estás en pareja?" (sí), conocerse, juntarse, casamiento, la pelea que da risa, un momento para guardar → las de antes. Ya no está (separación o viudez) → … un momento para guardar → cómo fue el final (con la palabra "despedida", nunca "terminó" a secas) → los primeros tiempos por tu cuenta (si convivieron) → las de antes. Nunca convivió → conocerse, "¿llegaron a armar la vida juntos?" (no) → un momento para guardar → (si ya no está) el final → las de antes. Nunca tuvo pareja → un amor que te marcó → las personas con las que compartís la vida.

## 6. Los bloques, en orden (núcleo)

| Bloque | Entrada | Preguntas del núcleo | Al final |
|---|---|---|---|
| 1 Origen | — (OR1) | la época en que llegaste, la historia de los de antes, cómo se conocieron tus padres | CI1 + M24 |
| 2 La casa de chico | EN2 | primer recuerdo de la casa, mamá, papá, hermanos, un día esperado, momento difícil | CI2 + M24 |
| 3 Escuela | EN3 | primer día, maestra, mejor amigo, travesura, qué querías ser, la religión en tu casa | CI3 + M24 |
| 4 Adolescencia | EN4 | dónde pasabas los días, la barra, primera salida, primer amor, ya no eras chico, momento duro | CI4 + M24 |
| 5 Juventud | EN5 | irse de casa, después del colegio, aprender lo tuyo, lo militar, irse a vivir a otro lado, primer lugar propio, las mudanzas (JU20, al núcleo el 01/10 por Naza), amigos, momento duro | CI5 + M24 |
| 6 Amor | — (AM0) | ¿hubo alguien en serio?, y lo que corresponda según la vida (sección 5) | CI6 + M24 |
| 7 Trabajo | EN7 | primer trabajo, el repaso de trabajos, un día común, quien te dio una mano, día de orgullo, sin trabajo o plata ajustada, negocio propio, lo que hacés bien y nadie te paga, el campo, el último día | CI7 + M24 |
| 8 Hijos y nietos | EN8 | tus viejos de grande (y si te tocó cuidarlos), ¿tuviste hijos?, el primero, cómo era cada uno, la crianza, orgullo, nietos (si tuvo hijos), algo con los nietos | CI8 + M24 |
| 9 Lugares | EN9 | el viaje, la pasión | CI9 + M24 |
| 10 Amistades | EN10 | el amigo de grande, los hermanos ya de grandes (si tuvo hermanos), alguien te ayudó, la cena | CI10 + M24 |
| 11 Momentos difíciles | — (AV11) | aviso → pérdidas, salud, época dura de grande (acuses sobrios, todas con M1) | CI11 + M24 |
| 12 Historia grande | EN12 | algo grande que te tocó, un día de la pandemia, lo que no se podía, la política | CI12 + M24 |
| 13 Giros y filosóficas | EN13 | el día que volverías a vivir, el día que cambió algo, lo que no se dio, chiquito frente a algo enorme, la soledad, el tiempo, lo heredado, lo que piensan los demás (el mundo en cien años pasó a extra) | CI13 + M24 |
| 14 Hoy | EN14 | un día de ahora, qué te hace reír, lo que más te gusta de tu vida, una marca en el cuerpo con historia (HO11, nueva), tu plato, la música de hoy, el lugar donde vivís | CI14 + M24 |
| 15 Legado | EN15 | orgullo, el consejo, lo que todavía querés hacer, el título, **preguntas de la familia** (cada una con M15, "Esta pregunta te la hace tu familia"), la foto (se espera la foto o un audio, sin reloj de minutos; ver abajo), lo que no te pregunté, hablale a tu familia | FIN, sin acuse antes |

**La foto (FO1, Naza, 30/09, simulaciones):** después de FO1 no corre el reloj de minutos: se espera una foto o un audio, hasta 24 horas (si pasa, llega LE9 igual). El botón [No tengo foto] vale como "no": M25 y sigue LE9. Una foto que llega en cualquier momento después de FO1 (aunque ya haya llegado LE9, LE8 o FIN) se guarda con FO1; los audios que llegan mientras FO1 está abierta son su descripción. Esto lo hace el entrevistador; el flujo avisa con `esperaFoto`. **Ronda 2 (Naza, 30/09):** si contestó [No tengo foto] (o un "no" corto), el mensaje final va sin la frase "Y si te quedó alguna foto por mandar…" (variante «sino:FO1» en FIN).

**Cuánto es:**

| Vida | Preguntas de historia (con la foto) | Turnos (preguntas, cierres, aviso y final) | Mensajes de WhatsApp del biógrafo |
|---|---|---|---|
| Completa (pareja, hijos, nietos, hermanos, se mudó) | 103 | 119 | 141 (incluye una pregunta de la familia de ejemplo; antes de pasar las 13 ⭐ al núcleo, 90 · 106 · 128; antes de la prueba de Naza, 88 · 104 · 126) |
| Completa, pero esa persona ya no está (separación o viudez, convivieron) | 92 | 108 | — |
| Sin pareja ni hijos (sin hermanos, no se mudó) | 90 | 106 | — (antes 79 · 95, y antes 78 · 94) |

Naza (30/09, después de su prueba) pasó al núcleo 13 de la extra: OR6, OR6.2, CA10, CA14, ES8, JU13, HI7, HI12, PA3, AS7, HO4, HO10 y G3 (la primera tele, HG7, no). La **ronda extra** (75 preguntas más) está en el banco pero **por ahora no se ofrece** (`ofrecerExtra` en el código). Si algún día se activa, hay que decidir dónde van los cierres: hoy llegarían antes de las preguntas extra de su bloque.

## 7. Si deja de contestar
- A los pocos días: recordatorio suave a la persona (M8).
- A la semana: aviso a quien regaló, sugiriendo llamarla o visitarla (M9).
- No hay pausa.

## 8. Después de la entrevista: el dashboard
La persona revisa sus respuestas con el audio al lado, corrige nombres y fechas, contesta las dudas y decide qué va y qué se cuenta más suave. Ahí aparecen:
- **Nombres** pendientes, dudosos o que nunca dijo (mamá, papá, pareja, hijos).
- **Dudas ficha contra entrevista** (DD1: la ficha dice que sí y contestó que no; DD2: la ficha dice que no y contó algo), con sus botones. Nunca por WhatsApp.

Recién después se escribe el libro, una sola vez.

## 9. Qué está hecho y qué falta
**Hecho (código puro, sin I/O, en `fabrica/src/v3/entrevista/`):**

| Qué | Dónde |
|---|---|
| El banco (`banco.json` generado desde `banco.md`) | `banco-md.ts`, `banco.ts` |
| Los botones de cada pregunta (sección "Botones" del banco, validados: hasta 3, hasta 20 letras) | `banco-md.ts` |
| Qué va después: pregunta, frase de entrada (`entrada`), si lleva M1 (`conM1`), si espera respuesta, sus `botones`, si va la ayuda M31 (`ayudaBotones`, una vez) y si espera la foto (`esperaFoto`, FO1) | `siguientePregunta` en `flujo.ts` |
| Qué dijo la persona: `no`, `paso`, `olvido`, `ya-conto`, `conto` o `vacio`, con el botón primero y las reglas de respaldo para el audio | `interpretar` en `respuesta.ts` (y `esNoCorto`, `esPaso`, `respondioNo`, `contoAlgo`, `cumple` en `flujo.ts`, que pasan por ahí) |
| Cómo se guarda un toque (`⟦botón:No tuve hijos⟧`, y el audio de después se suma atrás) y qué hacer al tocar: "Sí" → M30 y seguir esperando; "No"/"Paso" → seguir | `respuestaDeBoton`, `leerBoton`, `sumarAudio` en `respuesta.ts`; `alTocarBoton` en `flujo.ts` |
| Qué agradecimiento va después (M3, M4, M21, M24, M25, M26, M27, M28, M29 o nada), con las respuestas anteriores en orden para M29 | `mensajesDespues`, `acuseRotado` en `flujo.ts` |
| Las dudas para el dashboard | `contradiccionesConFicha` en `flujo.ts` |
| Los textos según género y nombre | `renderizar` en `texto.ts` |
| Recorrido de vidas inventadas y la lectura corrida | `scripts/v3-entrevista-recorrido.ts`, `scripts/v3-entrevista-lectura.ts` |

**Cómo se arma cada mensaje de WhatsApp** (acuse pegado o solo, entrada, pregunta con M1 y M31): `armarTurno` en `mensajes.ts`; qué acuse va según la familia, la vuelta y lo que sigue: `acuseDeTurno` (que usa `acuseAntesDe`, `acuseNeutro` y `acuseNegado`); la entrada sin el nombre si el acuse ya lo dice: `entradaSegunAcuse`. La simulación por turnos (`scripts/v3-entrevista-turno.ts`) muestra los botones y acepta `--boton`.

**Plan B** (anotado en [`correcciones-lectura.md`](correcciones-lectura.md), sin programar): si en la prueba real el código pregunta cosas que no encajan o entiende mal un "no", un modelo chico (Haiku) lee solo las respuestas que abren tema. Menos de 1 centavo por entrevista. Desde las simulaciones, los botones cubren ese riesgo en las que abren tema (Naza, 30/09: "reemplazaría al plan B en esos temas").

**Para mirar en la prueba real:** si molesta que los agradecimientos roten siempre en el mismo orden, y si el bloque 13 (ocho preguntas para pensar desde que FI6 pasó a extra) se hace largo. Para después (Naza, 30/09): palabras locales (barra, changa, colimba, "tus viejos") con la versión para España.

**La página de prueba** (`fabrica/scripts/v3-entrevista-web.ts`, guía en [`prueba-web.md`](prueba-web.md)): desde la prueba de Naza, varios audios por pregunta con "Listo, siguiente pregunta", aviso si una transcripción parece cortada, la grabación sigue 1 segundo después de Enviar, el nombre con mayúscula y reintentos solos si se cae la red (2, 5 y 10 s). Nada de eso es de WhatsApp: ahí la siguiente llega sola a los pocos minutos sin audios.

**Falta:**
1. Conectar el flujo al **entrevistador** de WhatsApp (Joaquín): guardar las respuestas, llamar a `siguientePregunta` y `mensajesDespues`, armar los mensajes con `armarTurno`, esperar unos minutos sin audios, los agradecimientos y los recordatorios M8/M9. Desde las simulaciones, además: mandar los botones de respuesta de WhatsApp, guardar un toque con `respuestaDeBoton` (y con "Sí", mandar M30 y seguir esperando), y la foto de FO1 (sin reloj de minutos, tope de 24 horas, la foto siempre con FO1). El plan es el paso 3 del chat del 30/09 (a hacer).
2. Mostrar en el **dashboard** las dudas DD1/DD2 y los nombres pendientes.
3. Durante la entrevista no se usa ningún modelo salvo la transcripción. El cazador de escenas está en pausa.
4. La marca "no quiso" / "pidió no ahondar" / "no se acuerda" para el escritor y el dashboard (S13): para cuando se haga el dashboard.
