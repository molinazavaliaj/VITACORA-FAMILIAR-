# El flujo de la entrevista (vigente)

Cómo funciona la entrevista de punta a punta. **Este es el documento vigente** (última actualización: 30/09/2026, después de las 6 simulaciones: botones, reglas de respaldo, acuses nuevos y la foto; ver [`simulaciones/hallazgos.md`](simulaciones/hallazgos.md) y [`simulaciones/textos-finales.md`](simulaciones/textos-finales.md)). Las versiones anteriores están en [`historial/`](historial/) (la de justo antes: [`flujo-2026-09-30-antes-de-las-simulaciones.md`](historial/flujo-2026-09-30-antes-de-las-simulaciones.md)).

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
3. El **cierre** del bloque (CI1 a CI14): "¿Quedó algo de este tema que no tuvo su pregunta?". Llega **siempre**, en todos los bloques del 1 al 14, y espera respuesta. El bloque 15 no tiene cierre: termina con el mensaje final.
4. Después del cierre, en todos los bloques: una de las 4 frases M24, que rotan y solo agradecen, sin sonar a que terminó la entrevista ("Gracias, {{nombre}}. Eso también va al libro."). Va como primera línea del mensaje de la frase de entrada. Ya no va "Terminamos esta etapa" (M10): la entrada hace de pasaje.

Así se lee el paso de un bloque a otro, en mensajes de WhatsApp: [cierre] → respuesta → [M24 + frase de entrada] → [primera pregunta].

## 4. Cada pregunta
- Llega **una por vez**.
- **Botones de WhatsApp** (Naza, 30/09, simulaciones) debajo de 31 mensajes: las 9 que abren tema ([Sí…] [No…]; AM9 además [Paso esta]), las 7 sensibles ([Paso esta]), los 14 cierres ([No, está todo]) y la foto ([No tengo foto]). La lista exacta está en [`banco.md`](banco.md), sección "Botones". La pregunta va entera, así se puede contestar tocando o en audio:
  - **toca "Sí"**: le llega "Contame, te escucho." (M30), solo, y la pregunta sigue esperando el audio; cuenta como "sí" para las que dependen, con audio o sin él;
  - **toca "No…"**: vale como un "no" corto (no llegan las de ese tema);
  - **toca [Paso esta]**: vale como paso;
  - si toca un botón y además manda audio, el audio se guarda con esa pregunta, pero **manda el botón**;
  - la primera vez que un mensaje lleva botones (CI1 en una vida completa), debajo va una línea de ayuda, una sola vez: _Podés tocar el botón de abajo, o contestarme en audio como siempre._ (M31).
- **La frase del "paso" (M1)**, en otra línea y en cursiva (_Si no va con vos, decí paso y vamos a otra._), va **solo** en:
  - las 3 primeras preguntas que se mandan en la entrevista;
  - las 6 que abren un tema: CA6 (hermanos), JU8 (irse a vivir a otro lado), AM0 (el amor), AM9 ("¿esa historia tuvo un final?"), HI0 (hijos), HI8 (nietos);
  - las preguntas del bloque 11 (momentos difíciles).
  
  Nunca debajo de cierres, aviso, foto ni final. En una vida completa son 12.
- La persona contesta con **uno o varios audios**; se suman a esa pregunta. Cuando pasan unos minutos sin audios nuevos, llega el agradecimiento y la siguiente.
- **Agradecimiento** después de cada respuesta. Va como **primera línea del mensaje que sigue** (el de la pregunta o el de la frase de entrada), no como mensaje aparte; solo el sobrio (M4) va **solo**:
  - una de las 8 frases que rotan (M3: "Gracias, {{nombre}}. Ya lo guardé."); si lo que sigue es un cierre, LE9 o una pregunta difícil, en su lugar va "Gracias, {{nombre}}." (M26), para no anunciar "otra pregunta" arriba de "Con esto cerramos…" ni sonar liviano antes de algo pesado; después de PG1 (tus viejos de grande) va siempre M26;
  - después de una pregunta difícil (el momento difícil de cada época CA17, AD15, JU17; la plata ajustada TR11; AM9; todo el bloque 11), una de las 4 sobrias (M4), sola;
  - después de un cierre: M24 (sección 3);
  - si contestó con un **"no" corto** o tocó un botón de "No", en **cualquier** pregunta: el neutro (M25: "Bien, seguimos." o "Bien, entonces."; delante de algo que arranca con "Seguimos" o "Pasamos" va "Bien, entonces."). Lo mismo con un "ya te lo conté" corto;
  - si dijo **"paso"** (o tocó [Paso esta]): en una común, "Dale, la salteamos. Vamos con otra." (M21); en una difícil, una de las 3 de M27 ("Está bien, {{nombre}}. Lo dejamos ahí y seguimos por otro lado."…; delante de "Seguimos" o "Pasamos" no va esa sino "Claro, sin problema. Vamos con otra."); en un cierre, M25;
  - si **no se acordó** ("no me acuerdo", "no sé"…): "No pasa nada, {{nombre}}. Vamos con otra." (M28.1); al tercer olvido seguido, una sola vez en toda la entrevista, en su lugar va M29 ("Una cosa, {{nombre}}: no te hagas problema si algo no te acordás…");
  - después de M30 no va acuse (es un mensaje solo); el audio que llega después lleva el acuse normal de esa pregunta;
  - si mandó **texto** en vez de audio: M22; si el audio llegó **cortado**: M23;
  - después de **LE9** ("¿algo que no te pregunté?"): **nada**, LE8 arranca sola;
  - después de **LE8** ("hablale a tu familia"), la última pregunta: **nada**, va directo el mensaje final.
- **Si contesta en audio en vez de tocar** (reglas de respaldo, Naza, 30/09, simulaciones), sobre la transcripción:
  - **"Paso":** "paso" como primera palabra, sin importar el largo (salvo que siga "a / por / de / que / el / la / los / las / un / una / mucho / tiempo / todo", que es el verbo: "Paso el río en bote"); "paso" como última palabra de una respuesta de hasta 12; o una respuesta de hasta 12 palabras con una frase de la lista **sola**, seguida de un signo o del final (siguiente, otra, salteala, esa no, eso no, de eso no, prefiero no, mejor no: "Siguiente.", "De eso no. Hay cosas que prefiero guardarme.", pero no "Otra vez fuimos al río" ni "Esa no era mi casa"), o con una negativa completa aunque siga algo (no quiero hablar de eso, prefiero no hablar de eso, prefiero no contarlo, eso me lo guardo, me lo guardo, dejémoslo ahí, mejor otra). Se admite "eso", "esa", "de eso", "ahí" o "mejor" adelante. "Pasó", con tilde, no es "paso". (Revisión del 30/09 (Naza, decisión A en las frases).)
  - **"Ya te lo conté":** hasta 15 palabras con "ya te lo conté", "ya te conté", "ya lo conté" o "ya te lo dije", si no arranca con un "no": "No tuve hijos, ya te lo conté" es un "no" (Revisión del 30/09 (Naza, decisión A en las frases)).
  - **Olvido:** hasta 20 palabras, sin "pero" ni "aunque", que arrancan con "no me acuerdo", "no recuerdo", "no sé", "ni idea" o "no tengo idea" (también "No, no me acuerdo"; "no sé" no puede seguir con "si", "por", "cómo", "qué", "cuál", "dónde" ni "cuándo": "No sé por dónde empezar…" cuenta algo), o con "se me borró" en las primeras 8 palabras, o con "la memoria"/"la cabeza" junto a "me falla", "me está fallando", "se me borró" o "no me da". No es un "no": para las que dependen cuenta como "sí" (Revisión del 30/09 (Naza, decisión A en las frases); antes: hasta 40 palabras y "la memoria"/"la cabeza" sueltas).
  - **"No" corto:** empieza con no / nunca / jamás / ninguno / nada / tampoco (entiende "Eh, no", "Nooo") y tiene **hasta 15 palabras**; **hasta 40** en los 14 cierres, en LE9, en las difíciles y en las 9 que abren tema. "Pero" o "aunque" en las primeras 5 palabras lo dan vuelta ("Nunca lo pensé, pero…"); más lejos no, y en los cierres nunca. No son "no" los arranques que cuentan algo: "nada que ver", "nunca me voy a olvidar", "no sabés", "no te imaginás", "no me lo vas a creer", "no sé…". En HI0, si dice "propios/propias", "crié/criamos/crió…" o "como un hijo / como mi hijo / como una hija", cuenta como "sí" (la pregunta pide a los criados). (Revisión del 30/09 (Naza, decisión A en las frases).)
  - **Lo que el revisor marcó y queda así, a propósito:** el olvido habilita las que dependen en todas las preguntas, no solo en las que abren tema (mejor una pregunta de más). M21, M25 y M28 siguen igual delante de una sensible (M26 solo reemplaza al común M3). Las marcas "no quiso" / "pidió no ahondar" / "no se acuerda" son S13 (dashboard).

## 5. Preguntas que abren un tema

Las 9 llevan botones de "Sí" y "No" (sección 4). Un "no" es tocar el botón de "No" o un "no" corto en audio; un olvido cuenta como "sí".

| Abre | Botones | Si contesta que no | Si contesta "paso" |
|---|---|---|---|
| Hermanos (CA6) | [Sí, tuve] [No tuve hermanos] | no va "tus otros hermanos" (extra) | igual |
| Irse a vivir a otro lado (JU8) | [Sí, me mudé] [No, nunca me mudé] | no van "quién te dio una mano" ni "sentirte de ahí" (extra) | ídem |
| El amor: ¿hubo alguien en serio? (AM0) | [Sí, hubo] [No hubo] | no van las de pareja; va "las personas con las que compartís la vida" (AM15) | no van las de pareja |
| ¿Llegaron a armar la vida juntos? (AM3) | [Sí] [No llegamos a eso] | no van "el día del casamiento" (AM4) ni "la pelea que da risa" (AM13) | ídem |
| "¿Esa historia tuvo un final?" (AM9) | [Sí, hubo un final] [Seguimos juntos] [Paso esta] | siguen juntos: no van "por tu cuenta" (AM19), "otro amor" (AM16) ni "las del medio" (AM20) | ídem (acuse M27) |
| ¿Hubo otro amor? (AM16) | [Sí, hubo otro] [No, nadie más] | no va "las del medio" (AM20) | ídem |
| Las del medio (AM20, nueva) | [Sí, hubo] [Nadie en el medio] | nada depende de ella | — |
| Hijos (HI0) | [Sí, tuve] [No tuve hijos] | no van las de hijos ni las de nietos; va "chicos importantes en tu vida" (HI10) | no van las de hijos ni las de nietos |
| Nietos (HI8) | [Sí, llegaron] [No hay nietos] | no van las de nietos | ídem |

Además, "el día que llegó tu primer hijo" (HI2) cierra el tema: con un "no" corto o "paso" no van "cómo era cada uno" (HI3), "la crianza" (HS1) ni "el orgullo" (HI6). "¿Tuviste más hijos?" (HI2b) ya no está: HI0 pide presentarlos a todos.

En todos los casos el cierre del bloque llega igual (sección 3), así que siempre tiene dónde contar lo que sí le pasó de ese tema.

**El amor, según la vida** (probado con 7 vidas inventadas; orden nuevo del 30/09: la pelea antes de la despedida): sigue con su primera pareja → conocerse, juntarse, casamiento, la pelea que da risa, un momento para guardar, "¿tuvo un final?" (no) → otro amor que te marcó. Se separó o enviudó → … "¿tuvo un final?" (sí) → los primeros tiempos por tu cuenta → otro amor después → (si lo hubo) las historias del medio → otro amor que te marcó. Nunca convivió → conocerse, "¿llegaron a armar la vida juntos?" (no) → un momento para guardar → … Nunca tuvo pareja → otro amor que te marcó → las personas con las que compartís la vida.

## 6. Los bloques, en orden (núcleo)

| Bloque | Entrada | Preguntas del núcleo | Al final |
|---|---|---|---|
| 1 Origen | — (OR1) | la época en que llegaste, la historia de los de antes, cómo se conocieron tus padres | CI1 + M24 |
| 2 La casa de chico | EN2 | primer recuerdo de la casa, mamá, papá, hermanos, un día esperado, momento difícil | CI2 + M24 |
| 3 Escuela | EN3 | primer día, maestra, mejor amigo, travesura, qué querías ser, la religión en tu casa | CI3 + M24 |
| 4 Adolescencia | EN4 | dónde pasabas los días, la barra, primera salida, primer amor, ya no eras chico, momento duro | CI4 + M24 |
| 5 Juventud | EN5 | irse de casa, después del colegio, aprender lo tuyo, lo militar, irse a vivir a otro lado, primer lugar propio, amigos, momento duro | CI5 + M24 |
| 6 Amor | — (AM0) | ¿hubo alguien en serio?, y lo que corresponda según la vida (sección 5) | CI6 + M24 |
| 7 Trabajo | EN7 | primer trabajo, el repaso de trabajos, un día común, quien te dio una mano, día de orgullo, sin trabajo o plata ajustada, negocio propio, lo que hacés bien y nadie te paga, el campo, el último día | CI7 + M24 |
| 8 Hijos y nietos | EN8 | tus viejos de grande (y si te tocó cuidarlos), ¿tuviste hijos?, el primero, cómo era cada uno, la crianza, orgullo, nietos (si tuvo hijos), algo con los nietos | CI8 + M24 |
| 9 Lugares | EN9 | el viaje, la pasión | CI9 + M24 |
| 10 Amistades | EN10 | el amigo de grande, alguien te ayudó, la cena | CI10 + M24 |
| 11 Momentos difíciles | — (AV11) | aviso → pérdidas, salud, época dura de grande (acuses sobrios, todas con M1) | CI11 + M24 |
| 12 Historia grande | EN12 | algo grande que te tocó, un día de la pandemia, lo que no se podía, la política | CI12 + M24 |
| 13 Giros y filosóficas | EN13 | el día que volverías a vivir, el día que cambió algo, lo que no se dio, chiquito frente a algo enorme, la soledad, el tiempo, lo heredado, lo que piensan los demás, el mundo en cien años | CI13 + M24 |
| 14 Hoy | EN14 | un día de ahora, qué te hace reír, lo que más te gusta de tu vida, tu plato, el lugar donde vivís | CI14 + M24 |
| 15 Legado | EN15 | orgullo, el consejo, lo que todavía querés hacer, el título, **preguntas de la familia** (cada una con M15, "Esta pregunta te la hace tu familia"), la foto (se espera la foto o un audio, sin reloj de minutos; ver abajo), lo que no te pregunté, hablale a tu familia | FIN, sin acuse antes |

**La foto (FO1, Naza, 30/09, simulaciones):** después de FO1 no corre el reloj de minutos: se espera una foto o un audio, hasta 24 horas (si pasa, llega LE9 igual). El botón [No tengo foto] vale como "no": M25 y sigue LE9. Una foto que llega en cualquier momento después de FO1 (aunque ya haya llegado LE9, LE8 o FIN) se guarda con FO1; los audios que llegan mientras FO1 está abierta son su descripción. Esto lo hace el entrevistador; el flujo avisa con `esperaFoto`.

**Cuánto es:**

| Vida | Preguntas de historia (con la foto) | Turnos (preguntas, cierres, aviso y final) | Mensajes de WhatsApp del biógrafo |
|---|---|---|---|
| Completa (pareja, hijos, nietos, hermanos, se mudó) | 88 | 104 | 126 (incluye una pregunta de la familia de ejemplo; antes de la ronda 2 eran 224; antes de las simulaciones, 127 con HI2b) |
| Sin pareja ni hijos (sin hermanos, no se mudó) | 78 | 94 | — |

La **ronda extra** (89 preguntas más) está en el banco pero **por ahora no se ofrece** (`ofrecerExtra` en el código). Si algún día se activa, hay que decidir dónde van los cierres: hoy llegarían antes de las preguntas extra de su bloque.

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

**Para mirar en la prueba real:** si molesta que los agradecimientos roten siempre en el mismo orden, y si el bloque 13 (nueve preguntas para pensar) se hace largo.

**Falta:**
1. Conectar el flujo al **entrevistador** de WhatsApp (Joaquín): guardar las respuestas, llamar a `siguientePregunta` y `mensajesDespues`, armar los mensajes con `armarTurno`, esperar unos minutos sin audios, los agradecimientos y los recordatorios M8/M9. Desde las simulaciones, además: mandar los botones de respuesta de WhatsApp, guardar un toque con `respuestaDeBoton` (y con "Sí", mandar M30 y seguir esperando), y la foto de FO1 (sin reloj de minutos, tope de 24 horas, la foto siempre con FO1). El plan es el paso 3 del chat del 30/09 (a hacer).
2. Mostrar en el **dashboard** las dudas DD1/DD2 y los nombres pendientes.
3. Durante la entrevista no se usa ningún modelo salvo la transcripción. El cazador de escenas está en pausa.
4. La marca "no quiso" / "pidió no ahondar" / "no se acuerda" para el escritor y el dashboard (S13): para cuando se haga el dashboard.
