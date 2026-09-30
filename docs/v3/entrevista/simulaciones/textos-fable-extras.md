# Las propuestas de Fable que faltaban, y dos decisiones de Naza (30/09)

**Qué es:** después de la primera tanda de la prueba de Naza ([`textos-prueba-naza.md`](textos-prueba-naza.md)), Naza dijo: "Las cosas que dijo Fable, si no estaban en mi lista, si son buenas objeciones, cambialas". Acá está cada texto del biógrafo que cambió por eso, con su ANTES y DESPUÉS y el porqué en una línea, y lo que se descartó y por qué. En la misma tanda Naza tomó dos decisiones más (sección 1). La lectura de Fable queda fuera de git (es una vida real): acá solo van textos del biógrafo y reglas.

Tests: `fabrica/test/v3-entrevista-fable-extras.test.ts`.

---

## 1. Decisiones de Naza

### 1.1 AMH: "¿Hoy estás en pareja?"

Naza: "'¿Esa persona sigue hoy a tu lado?' no se entiende de quién habla; 'Hoy estás en pareja' sí se entiende".

- ANTES: "Vamos a la pareja de ahora, o a la última si hoy no hay nadie. Antes de preguntarte por esa historia, decime desde dónde te pregunto: ¿esa persona sigue hoy a tu lado?" · botones [Sí, seguimos juntos] [Ya no está conmigo]
- DESPUÉS: "Vamos a la pareja de ahora, o a la última si hoy no hay nadie. ¿Hoy estás en pareja?" · botones [Sí, estoy en pareja] (vale sí) [No estoy en pareja] (vale no)

La primera frase queda: sin ella, después de [No estoy en pareja], AM1 ("Contame el día que se conocieron…") no diría de quién habla. La lógica no cambia: sí = el detalle va a la pareja de hoy; no = a la última, con AM9 y AM19 como hasta ahora. Revisados AM1, AM3, AM4, AM13, AM8, AM9, AM19 y AM21: ninguno dice "sigue a tu lado" ni nada que choque ("esa persona", "esa historia" encajan con la frase de arriba); no se tocaron.

**En audio** (regla nueva): además de lo que ya valía, "no estoy en pareja", "no estoy con nadie", "no tengo pareja", "estoy sola/solo", "quedé sola/solo", "sin pareja" o "soltera/soltero" en las primeras 5 palabras valen "no"; "estoy en pareja" y "tengo pareja" valen sí (como "estoy con…", aunque arranque con "no": "No, estoy con Hugo"). Ejemplos probados: "Sí, estoy en pareja" y "Sí, hace un año" → sí; "No, no estoy en pareja", "Estoy sola" y "No, hace años que no" → no.

### 1.2 La salida "si ya me lo contaste", con las palabras de Naza

Fable proponía "decime 'ya te lo conté' y seguimos"; Naza lo dejó así: **"Si ya me lo contaste, decímelo, y si querés reforzar algo, es el momento."** Va igual en las 10 salidas de ese tipo, también en las tres que ya tenían la fórmula de Fable desde la primera tanda (AD15, JU17, AM1). Decirlo corto ("ya te lo conté", "ya te lo dije") sigue llevando M25; si agrega algo, es una respuesta más.

| ID | ANTES (la salida) | DESPUÉS |
|---|---|---|
| AD15 | Y si ya me lo contaste, decime "ya te lo conté" y seguimos. | Si ya me lo contaste, decímelo, y si querés reforzar algo, es el momento. |
| JU17 | Y si ya me lo contaste, decime "ya te lo conté" y seguimos. | (igual que AD15) |
| AM1 | Si ese día ya me lo contaste antes, decime "ya te lo conté" y seguimos con lo que vino después. | (igual) |
| AM3 | Si ya me lo contaste recién, con decírmelo alcanza. | (igual) |
| AM4 | Si ya me lo contaste recién, con decírmelo alcanza. | (igual) |
| PA1 | Si sentís que ya me lo contaste, decímelo. | (igual) |
| TR8 | Si ya me lo contaste, con decírmelo alcanza. | (igual; sigue "Si quedó algo afuera, …, contámelo ahora.") |
| GI1 | Si es uno que ya me contaste, decímelo y, si querés, agregale lo que te faltó. | (igual; "reforzar algo" cubre lo de "agregale") |
| GI2 | Si ya me lo contaste, con decírmelo alcanza. | (igual; sigue "Y si el día justo no te vuelve, …") |
| PE4 | Y si ya me la contaste, con decírmelo alcanza. | (igual; "me lo contaste" en lugar de "me la contaste", para que sea la misma frase en todas) |

Porqué: "con decírmelo alcanza" no decía qué decir (en la prueba, Naza no supo si repetir o no), y la frase de Naza además deja la puerta abierta a sumar algo.

JU8 ("Capaz ya me contaste algo de esa mudanza; ahora contame la llegada…") no es una salida y no se toca.

---

## 2. Textos de Fable que entran

| ID | ANTES | DESPUÉS | Por qué |
|---|---|---|---|
| AD6 | ¿Y la primera vez que alguien te gustó en serio? Contame cómo se conocieron, … | En esos años, ¿cuándo fue la primera vez que alguien te gustó en serio? Contame cómo se conocieron, … (el resto igual) | La pregunta no decía de qué época hablaba ("¿de muy chico o ya de más grande?"). |
| JU17 | ¿Hubo algún momento duro en tu juventud que creas que no puede quedar afuera de tu historia? … | ¿Hubo algún momento duro en esos años de empezar tu vida que creas que no puede quedar afuera de tu historia? … (con la salida de 1.2) | "Juventud" no tiene bordes para quien cuenta; "empezar tu vida" es lo que ya dicen EN5 y CI5. |
| CS1 | … Contame una vez que te lució, que la gente lo notó. | … Contame una vez que te salió tan bien que la gente lo notó. | "Te lució" es de acá y no se entiende en todos lados. |
| JU12 | Contame del primer lugar que fue tuyo, donde ya vivías por tu cuenta: cómo era, … | Contame del primer lugar que fue tuyo, donde ya vivías por tu cuenta. Capaz ya me nombraste ese lugar; ahora contámelo por dentro: cómo era, … (el resto igual) | Varias preguntas tocan la misma mudanza; así pide lo que falta (el lugar por dentro) sin sonar a repetida. La frase de Fable va segunda y no primera, para que primero se sepa de qué lugar se habla. |
| HO10 | ¿Algo te acompañó muchos años, el cigarrillo, el vino, el café de la mañana? Contame cómo empezó y un momento con eso. Y si en algún momento te costó dejarlo, contame eso también. | ¿Hay algo que te acompaña todos los días, el café de la mañana, el mate, un cigarrillo, el vino de la cena? Contame cómo empezó y un momento con eso. | Sin aire de "vicio": arranca por el café y el mate, y no pregunta por dejarlo. |
| HE2 | … una mano que se dieron. Si no tuviste hermanos, decime y seguimos. | … una mano que se dieron. | Desde la primera tanda HE2 solo le llega a quien tuvo hermanos (`si:CA6`): la frase sobraba. |

## 3. Acuses

| ID | ANTES | DESPUÉS | Por qué |
|---|---|---|---|
| M24.4 | Gracias por eso. Cada detalle que agregás suma. | Gracias por eso, {{nombre}}. Queda guardado. | Va después de un cierre, y un cierre puede traer algo doloroso: "cada detalle suma" quedaba liviano. |
| M27.1 | Está bien, {{nombre}}. Lo dejamos ahí y seguimos por otro lado. | Está bien, {{nombre}}. Lo dejamos ahí. | "Por otro lado" prometía un cambio de tema y lo que sigue suele ser otra difícil. Fable lo propuso para el bloque 11; va en todas, porque el problema es el mismo en cualquier sensible. |

**Regla que se va con M27.1:** hasta hoy, delante de algo que arrancaba con "Seguimos" o "Pasamos" iba M27.2 en lugar de M27.1 (para no decir "seguimos" dos veces). Sin "seguimos" en M27.1, las tres rotan sin excepción.

---

## 4. Descartadas, y por qué

- **PE4 con otro texto si ya contó lo difícil** ("De todo lo difícil que me contaste, ¿hay algo que te quedó por decir?"): Fable la dejó como idea para pensar, no como propuesta; haría falta un texto que cambie según lo contestado en CA17/AD15/JU17, y la salida de 1.2 ya cubre el caso. Queda para que Naza decida.
- **Palabras locales** ("barra de amigos", "colimba", "tus viejos"): Naza ya las dejó para después, con la versión para España (hallazgos.md), y van con la decisión de vos/tú.
- **FI4 a la extra** ("miraría FI4 también"): sin propuesta concreta. Queda para Naza, junto con cuánto pesa el bloque 13.
- **HO10 "dejar en extra":** ya no aplica, Naza la pasó al núcleo; entra solo el texto.
- **Las señales en audio para AM9** ("seguimos", "terminó"…): ya no aplica. Con el bloque 6 nuevo, AMH decide si esa persona sigue, y AM9 ya no abre tema.
- **El acuse de M3.2 delante de AM3** ("no registra que no entendió"): Fable mismo dice que no tiene arreglo de acuse; lo arregló la pregunta (AM1 nuevo).
- **TR9, PG1, FI2, y CS1 con CO1:** Fable dice no tocar.
