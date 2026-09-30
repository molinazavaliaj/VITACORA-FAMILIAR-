# El flujo de la entrevista, hoy (30/09/2026)

> **Actualización 30/09, después de la lectura corrida:** los cierres de todos los bloques van siempre (CI1 a CI14, con M24 o M10 después), M1 va solo en las 3 primeras preguntas, en las 6 que abren tema y en el bloque 11, y después de LE9 va directo FIN. Una vida completa: 89 preguntas, 105 turnos. Donde este documento diga otra cosa, manda [`correcciones-lectura.md`](correcciones-lectura.md).

Cómo funciona la entrevista de punta a punta, con todo lo que decidió Naza el 29 y 30/09. Los textos exactos están en [`banco.md`](banco.md); el porqué de cada decisión, en [`../metodo-entrevista.md`](../metodo-entrevista.md). Lo que ya está programado vive en `fabrica/src/v3/entrevista/` (736 tests verdes); lo que falta conectar está al final.

## 1. Antes de empezar
- **Compra.** Quien regala carga una ficha corta: nombre, cómo le dicen, género (para "chico/chica", "padre/madre"), si habla de vos o de tú, y su propio contacto (para el aviso M9). Si quiere, sube un **álbum de fotos**, que se puede completar hasta que se escribe el libro.
- La ficha **no decide qué preguntas llegan**. Queda para el escritor y para comparar con lo que la persona cuenta.

## 2. El arranque
1. **Bienvenida (BIEN):** "Hola, {{nombre}}. Juntos vamos a escribir la historia de tu vida…"
2. **Cómo va (M6):** "Ahora te explico cómo va la entrevista, {{nombre}}. Te mando una pregunta y vos me la contás en audio…"
3. La primera pregunta.

## 3. Cada pregunta
- Llega **una por vez**. Debajo, en otra línea y en cursiva: _Si no va con vos, decí paso y vamos a otra._ (M1; no va debajo de los cierres).
- La persona contesta con **uno o varios audios**; se suman a esa pregunta. Cuando pasan unos minutos sin audios nuevos, llega el agradecimiento y la siguiente.
- **Agradecimiento** después de cada respuesta:
  - una de las 8 frases que rotan (M3: "Gracias, {{nombre}}. Ya lo guardé.");
  - después de una pregunta difícil (bloque 11 y "¿esa historia tuvo un final?"), una de las 4 sobrias (M4);
  - si dijo **"paso"**: "Dale, la salteamos. Vamos con otra." (M21);
  - si mandó **texto** en vez de audio: M22; si el audio llegó **cortado**: M23.
- **"No" corto:** menos de 15 palabras que empiezan con no / nunca / jamás / ninguno / nada / tampoco (entiende "Eh, no", "Nooo"; no cuenta "Nunca lo pensé, pero…"). **"Paso":** la primera palabra es "paso" y la respuesta es corta ("Paso, no quiero hablar").

## 4. Preguntas que abren un tema
Algunas preguntas abren un tema y otras dependen de ellas:

| Abre | Si contesta un "no" corto | Si contesta "paso" |
|---|---|---|
| Hermanos (CA6) | no va "tus otros hermanos" | igual, y al final del bloque llega su cierre |
| Irse a vivir a otro lado (JU8) | no van "quién te dio una mano" ni "sentirte de ahí" | ídem |
| El amor: el repaso (AM0) | no van las de pareja; va "las personas con las que compartís la vida" (AM15) | no van las de pareja; llega el cierre del bloque |
| "¿Esa historia tuvo un final?" (AM9) | siguen juntos: va "la pelea que da risa" (AM13) | no van las que siguen |
| Hijos (HI0) | no van las de hijos; va "chicos importantes en tu vida" (HI10) | llega el cierre del bloque |
| Nietos (HI8) | no van las de nietos | llega el cierre del bloque |

**El amor, según la vida** (probado con 6 vidas inventadas): sigue con su primera pareja → conocerse, juntarse, casamiento, un momento para guardar, "¿tuvo un final?" (no) → la pelea que da risa → otro amor que te marcó. Se separó o enviudó → … "¿tuvo un final?" (sí) → el tiempo por tu cuenta → otro amor después (si lo hubo, también la pelea que da risa) → otro amor que te marcó. Nunca tuvo pareja → otro amor que te marcó → las personas con las que compartís la vida.

## 5. Los bloques, en orden (núcleo)

| Bloque | Preguntas del núcleo | Cierre |
|---|---|---|
| 1 Origen | la época en que llegaste, la historia de los de antes, cómo se conocieron tus padres | — |
| 2 La casa de chico | primer recuerdo de la casa, mamá, papá, hermanos, un día esperado, momento difícil | CI2 + "Terminamos esta etapa" |
| 3 Escuela | primer día, maestra, mejor amigo, travesura, qué querías ser, la religión en tu casa | CI3 + fin de etapa |
| 4 Adolescencia | dónde pasabas los días, la barra, primera salida, primer amor, ya no eras chico, momento duro | CI4 + fin de etapa |
| 5 Juventud | irse de casa, después del colegio, aprender lo tuyo, lo militar, irse a vivir a otro lado, primer lugar propio, amigos, momento duro | CI5 + fin de etapa |
| 6 Amor | el repaso y lo que corresponda según la vida (sección 4) | solo si dijo "paso" |
| 7 Trabajo | primer trabajo, el repaso de trabajos, un día común, quien te dio una mano, día de orgullo, sin trabajo o plata ajustada, negocio propio, lo que hacés bien y nadie te paga, el campo, el último día | — |
| 8 Hijos y nietos | tus viejos de grande, ¿tuviste hijos?, el primero, los otros, cómo era cada uno, la crianza, orgullo, nietos, algo con los nietos | solo si dijo "paso" |
| 9 Lugares | el viaje, la pasión | — |
| 10 Amistades | el amigo de grande, alguien te ayudó, la cena | — |
| 11 Momentos difíciles | aviso → pérdidas, salud, época dura de grande (acuses sobrios) | — |
| 12 Historia grande | algo grande que te tocó, un día de la pandemia, lo que no se podía | — |
| 13 Giros y filosóficas | el día que volverías a vivir, el día que cambió algo, lo que no se dio, chiquito frente a algo enorme, la soledad, el tiempo, lo heredado, lo que piensan los demás, el mundo en cien años, la política | — |
| 14 Hoy | un día de ahora, qué te hace reír, lo que más te gusta de tu vida, tu plato, lo que todavía querés hacer, el lugar donde vivís | — |
| 15 Legado | orgullo, el consejo, el título, hablale a tu familia, **preguntas de la familia** (con "Esta pregunta te la hace tu familia"), la foto, lo que no te pregunté, mensaje final | — |

Después del cierre de un bloque que no es etapa va una de las 4 frases M24 ("Gracias, {{nombre}}. Con eso cerramos acá. Pasamos a otra cosa."). Una vida completa recibe **89 preguntas** (95 mensajes contando cierres, aviso y final); sin pareja ni hijos, 79.

La **ronda extra** (89 preguntas más) está en el banco pero **por ahora no se ofrece** (`ofrecerExtra` en el código).

## 6. Si deja de contestar
- A los pocos días: recordatorio suave a la persona (M8).
- A la semana: aviso a quien regaló, sugiriendo llamarla o visitarla (M9).
- No hay pausa.

## 7. Después de la entrevista: el dashboard
La persona revisa sus respuestas con el audio al lado, corrige nombres y fechas, contesta las dudas y decide qué va y qué se cuenta más suave. Ahí aparecen:
- **Nombres** pendientes, dudosos o que nunca dijo (mamá, papá, pareja, hijos).
- **Dudas ficha contra entrevista** (DD1: la ficha dice que sí y contestó que no; DD2: la ficha dice que no y contó algo), con sus botones. Nunca por WhatsApp.
Recién después se escribe el libro, una sola vez.

## 8. Qué está hecho y qué falta
**Hecho (código puro, sin I/O):** el banco (`banco.json` desde `banco.md`), qué pregunta sigue (`siguientePregunta`), "no" corto y "paso", qué mensaje va después (`mensajesDespues`, `acuseRotado`), las dudas para el dashboard (`contradiccionesConFicha`), los textos según el género (`renderizar`), el recorrido de vidas de ejemplo (`scripts/v3-entrevista-recorrido.ts`).

**Falta:**
1. Conectar el flujo al **entrevistador** de WhatsApp (Joaquín): guardar las respuestas, llamar a `siguientePregunta`, mandar M1 en cursiva, esperar unos minutos sin audios, los recordatorios M8/M9.
2. Mostrar en el **dashboard** las dudas DD1/DD2 y los nombres pendientes.
3. Durante la entrevista no se usa ningún modelo salvo la transcripción. El cazador de escenas está en pausa.
