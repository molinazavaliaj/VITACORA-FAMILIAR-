# El flujo de la entrevista (vigente)

Cómo funciona la entrevista de punta a punta. **Este es el documento vigente** (última actualización: 30/09/2026, ronda 4 de la lectura corrida). Las versiones anteriores están en [`historial/`](historial/).

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
- **La frase del "paso" (M1)**, en otra línea y en cursiva (_Si no va con vos, decí paso y vamos a otra._), va **solo** en:
  - las 3 primeras preguntas que se mandan en la entrevista;
  - las 6 que abren un tema: CA6 (hermanos), JU8 (irse a vivir a otro lado), AM0 (el amor), AM9 ("¿esa historia tuvo un final?"), HI0 (hijos), HI8 (nietos);
  - las preguntas del bloque 11 (momentos difíciles).
  
  Nunca debajo de cierres, aviso, foto ni final. En una vida completa son 12.
- La persona contesta con **uno o varios audios**; se suman a esa pregunta. Cuando pasan unos minutos sin audios nuevos, llega el agradecimiento y la siguiente.
- **Agradecimiento** después de cada respuesta. Va como **primera línea del mensaje que sigue** (el de la pregunta o el de la frase de entrada), no como mensaje aparte; solo el sobrio (M4) va **solo**:
  - una de las 8 frases que rotan (M3: "Gracias, {{nombre}}. Ya lo guardé."); si lo que sigue es un cierre o LE9, en su lugar va "Gracias, {{nombre}}." (M26), para no anunciar "otra pregunta" arriba de "Con esto cerramos…";
  - después de una pregunta difícil (el momento difícil de cada época CA17, AD15, JU17; la plata ajustada TR11; AM9; todo el bloque 11), una de las 4 sobrias (M4), sola; si la contestó con un "no" corto o "paso", el neutro (M25) en su lugar;
  - después de un cierre: M24 (sección 3), o uno neutro si lo contestó con un "no" corto o "paso" (M25: "Bien, seguimos." o "Bien, entonces."; delante de algo que arranca con "Seguimos" o "Pasamos" va "Bien, entonces.");
  - si dijo **"paso"** en una pregunta que no es cierre: "Dale, la salteamos. Vamos con otra." (M21);
  - si mandó **texto** en vez de audio: M22; si el audio llegó **cortado**: M23;
  - después de **LE9** ("¿algo que no te pregunté?"): **nada**, LE8 arranca sola;
  - después de **LE8** ("hablale a tu familia"), la última pregunta: **nada**, va directo el mensaje final.
- **"No" corto:** menos de 15 palabras que empiezan con no / nunca / jamás / ninguno / nada / tampoco (entiende "Eh, no", "Nooo"; no cuenta "Nunca lo pensé, pero…"). **"Paso":** la primera palabra es "paso" y la respuesta es corta ("Paso, no quiero hablar").

## 5. Preguntas que abren un tema

| Abre | Si contesta un "no" corto | Si contesta "paso" |
|---|---|---|
| Hermanos (CA6) | no va "tus otros hermanos" | igual |
| Irse a vivir a otro lado (JU8) | no van "quién te dio una mano" ni "sentirte de ahí" | ídem |
| El amor: el repaso (AM0) | no van las de pareja; va "las personas con las que compartís la vida" (AM15) | no van las de pareja |
| "¿Esa historia tuvo un final?" (AM9) | siguen juntos: va "la pelea que da risa" (AM13) | no van las que siguen |
| Hijos (HI0) | no van las de hijos; va "chicos importantes en tu vida" (HI10) | no van las de hijos |
| Nietos (HI8) | no van las de nietos | ídem |

En todos los casos el cierre del bloque llega igual (sección 3), así que siempre tiene dónde contar lo que sí le pasó de ese tema.

**El amor, según la vida** (probado con 6 vidas inventadas): sigue con su primera pareja → conocerse, juntarse, casamiento, un momento para guardar, "¿tuvo un final?" (no) → la pelea que da risa → otro amor que te marcó. Se separó o enviudó → … "¿tuvo un final?" (sí) → el tiempo por tu cuenta → otro amor después (si lo hubo, también la pelea que da risa) → otro amor que te marcó. Nunca tuvo pareja → otro amor que te marcó → las personas con las que compartís la vida.

## 6. Los bloques, en orden (núcleo)

| Bloque | Entrada | Preguntas del núcleo | Al final |
|---|---|---|---|
| 1 Origen | — (OR1) | la época en que llegaste, la historia de los de antes, cómo se conocieron tus padres | CI1 + M24 |
| 2 La casa de chico | EN2 | primer recuerdo de la casa, mamá, papá, hermanos, un día esperado, momento difícil | CI2 + M24 |
| 3 Escuela | EN3 | primer día, maestra, mejor amigo, travesura, qué querías ser, la religión en tu casa | CI3 + M24 |
| 4 Adolescencia | EN4 | dónde pasabas los días, la barra, primera salida, primer amor, ya no eras chico, momento duro | CI4 + M24 |
| 5 Juventud | EN5 | irse de casa, después del colegio, aprender lo tuyo, lo militar, irse a vivir a otro lado, primer lugar propio, amigos, momento duro | CI5 + M24 |
| 6 Amor | — (AM0) | el repaso y lo que corresponda según la vida (sección 5) | CI6 + M24 |
| 7 Trabajo | EN7 | primer trabajo, el repaso de trabajos, un día común, quien te dio una mano, día de orgullo, sin trabajo o plata ajustada, negocio propio, lo que hacés bien y nadie te paga, el campo, el último día | CI7 + M24 |
| 8 Hijos y nietos | EN8 | tus viejos de grande, ¿tuviste hijos?, el primero, los otros, cómo era cada uno, la crianza, orgullo, nietos, algo con los nietos | CI8 + M24 |
| 9 Lugares | EN9 | el viaje, la pasión | CI9 + M24 |
| 10 Amistades | EN10 | el amigo de grande, alguien te ayudó, la cena | CI10 + M24 |
| 11 Momentos difíciles | — (AV11) | aviso → pérdidas, salud, época dura de grande (acuses sobrios, todas con M1) | CI11 + M24 |
| 12 Historia grande | EN12 | algo grande que te tocó, un día de la pandemia, lo que no se podía, la política | CI12 + M24 |
| 13 Giros y filosóficas | EN13 | el día que volverías a vivir, el día que cambió algo, lo que no se dio, chiquito frente a algo enorme, la soledad, el tiempo, lo heredado, lo que piensan los demás, el mundo en cien años | CI13 + M24 |
| 14 Hoy | EN14 | un día de ahora, qué te hace reír, lo que más te gusta de tu vida, tu plato, el lugar donde vivís | CI14 + M24 |
| 15 Legado | EN15 | orgullo, el consejo, lo que todavía querés hacer, el título, **preguntas de la familia** (cada una con M15, "Esta pregunta te la hace tu familia"), la foto, lo que no te pregunté, hablale a tu familia | FIN, sin acuse antes |

**Cuánto es:**

| Vida | Preguntas de historia (con la foto) | Turnos (preguntas, cierres, aviso y final) | Mensajes de WhatsApp del biógrafo |
|---|---|---|---|
| Completa (pareja, hijos, nietos, hermanos, se mudó) | 89 | 105 | 127 (incluye una pregunta de la familia de ejemplo; antes de la ronda 2 eran 224) |
| Sin pareja ni hijos (sin hermanos, no se mudó) | 79 | 95 | — |

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
| Qué va después: pregunta, frase de entrada (`entrada`), si lleva M1 (`conM1`), si espera respuesta | `siguientePregunta` en `flujo.ts` |
| "No" corto y "paso" | `esNoCorto`, `esPaso` en `flujo.ts` |
| Qué agradecimiento va después (M3, M4, M21, M24, M25, M26 o nada) y cuál de la rotación | `mensajesDespues`, `acuseRotado` en `flujo.ts` |
| Las dudas para el dashboard | `contradiccionesConFicha` en `flujo.ts` |
| Los textos según género y nombre | `renderizar` en `texto.ts` |
| Recorrido de vidas inventadas y la lectura corrida | `scripts/v3-entrevista-recorrido.ts`, `scripts/v3-entrevista-lectura.ts` |

**Cómo se arma cada mensaje de WhatsApp** (acuse pegado o solo, entrada, pregunta con M1): `armarTurno` en `mensajes.ts`; qué acuse va según lo que sigue: `acuseAntesDe` y `acuseNeutro`; la entrada sin el nombre si el acuse ya lo dice: `entradaSegunAcuse`.

**Plan B** (anotado en [`correcciones-lectura.md`](correcciones-lectura.md), sin programar): si en la prueba real el código pregunta cosas que no encajan o entiende mal un "no", un modelo chico (Haiku) lee solo las respuestas que abren tema. Menos de 1 centavo por entrevista.

**Para mirar en la prueba real:** si molesta que los agradecimientos roten siempre en el mismo orden, y si el bloque 13 (nueve preguntas para pensar) se hace largo.

**Falta:**
1. Conectar el flujo al **entrevistador** de WhatsApp (Joaquín): guardar las respuestas, llamar a `siguientePregunta` y `mensajesDespues`, armar los mensajes con `armarTurno`, esperar unos minutos sin audios, los agradecimientos y los recordatorios M8/M9. El plan es el paso 3 del chat del 30/09 (a hacer).
2. Mostrar en el **dashboard** las dudas DD1/DD2 y los nombres pendientes.
3. Durante la entrevista no se usa ningún modelo salvo la transcripción. El cazador de escenas está en pausa.
