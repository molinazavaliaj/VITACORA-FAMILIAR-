# Vitácora de Viaje V2 · Banco (fuente de verdad para el código)

**Qué es:** todos los textos que manda la entrevista de Vitácora de Viaje V2, en un solo lugar, con el momento en que va cada uno. El código lee de acá. Ningún modelo escribe ni decide durante la entrevista: solo se mandan estos textos.

**Fecha:** 30/09/2026.

**Estado:** aprobado por Naza, texto por texto. Los textos están copiados tal cual de los aprobados; los únicos cambios son los dos que Naza aprobó el 30/09 para el horario (ID1 y VU1 pasan a la mañana siguiente, en pasado).

**De dónde sale cada parte:**
| Parte | Archivo aprobado |
|---|---|
| Arranque, acuses, casos, atrasos, preguntas propias, despedida | `paso-3-mensajes-aprobados.md` |
| Antes de salir, salida y día siguiente | `paso-2-parte-1-aprobada.md` (ID1 en pasado: ronda 5 y `flujo-vigente.md`) |
| La noche | `paso-2-parte-2-noches-aprobada.md` |
| El mediodía | `paso-2-parte-3-mediodia-aprobada-v2.md` (la v1, `paso-2-parte-3-mediodia-aprobada.md`, es historial) |
| El final y el álbum | `paso-2-parte-4-final-aprobada.md` (VU1 en pasado: `flujo-vigente.md`) |
| Reglas del flujo | `flujo-vigente.md` |

Lo que salió está en `banco-descartadas.md`.

## Notación

**Marcas** (el código las completa antes de mandar):
| Marca | Qué completa |
|---|---|
| `{{nombre}}` | Cómo le dicen a la persona (dato de la compra: "Nombre y cómo le dicen"). |
| `{{quien_regala}}` | Quién hace el regalo (dato de la compra, solo si es un regalo). |
| `{{formato}}` | "un libro impreso" o "un libro en PDF", según la compra. |
| `{{fotos_album}}` | 20 o 40, según el álbum que compró. |
| `{{pregunta}}` | Una de las preguntas propias (hasta 5), tal cual la escribieron, sin corregir. Va entre «». |

**Valores de la columna Momento:**
| Momento | Qué es |
|---|---|
| arranque | Bienvenida: BIEN-1 o BIEN-1R (plantilla de Meta) y, con el SÍ, BIEN-2. |
| antes | Antes de salir, encadenadas (AS1 → AS2 → IM1 → VA1). |
| salida | Día de salida, 10:00, hora de su casa. Único mensaje del día. |
| dia-siguiente-salida | Día siguiente a la salida, 10:00, hora del país del viaje, en lugar del mediodía. |
| noche-comienzo | Primera parte de la pregunta de la noche (rota). |
| noche-puerta | Segunda parte de la pregunta de la noche (rota). Sin punto final. |
| noche-cierre | Tercera parte de la pregunta de la noche (rota). Empieza con ", y". |
| mediodia | Extra del mediodía, 13:00, hora del país del viaje. |
| ultima-noche | Noche anterior al día de vuelta (reemplaza la noche común). |
| vuelta | Día de vuelta, mediodía, hora del país del viaje. Único mensaje del día. |
| dia-siguiente-vuelta | Día siguiente a la vuelta, 10:00, hora de su casa. |
| noche-casa | Día siguiente a la vuelta, a la noche, hora de su casa. |
| album | El pedido de fotos del álbum y su recordatorio. |
| acuse-noche | Acuse después de contestar la noche (rota). |
| acuse-mediodia | Acuse después del mediodía o de una foto suelta (rota). |
| acuse-antes | Acuse después de las de antes de salir; empalma con la siguiente (rota). |
| caso | Respuesta a una situación: "paso", texto en vez de audio, audio cortado, pregunta colgada antes de salir. |
| atraso | Línea pegada arriba de la pregunta de la noche cuando la anterior quedó sin contestar. |
| propia | Pregunta propia (del que regala o del viajero), en lugar de una noche común. |
| despedida | Cuando se cierra el álbum. |

**La noche se arma así:** comienzo + " " + puerta + cierre. Ejemplo (C1 + NO5 + F1): Contame cómo fue hoy, {{nombre}}, como se lo contarías a alguien que te quiere y no estuvo. Arrancá por alguien que te cruzaste y no conocías, y de ahí seguí por donde quieras. Mandá las fotos que quieras que queden.

## Arranque

BIEN-1 y BIEN-1R son alternativas (una u otra, según sea para sí o un regalo); las dos son plantilla de Meta y piden el SÍ.

| ID | Momento | Orden | Texto | Ya de viaje |
|---|---|---|---|---|
| BIEN-1 | arranque | 1 | Hola, {{nombre}}. Soy quien va a escribir el libro de tu viaje. Funciona así: yo te pregunto por acá, vos me contás en audio cuando puedas, y al volver tenés {{formato}} con tu viaje contado con tu voz, tus fotos y un código QR para escuchar algunos de tus audios. ¿Arrancamos? Contestame SÍ: con eso me das permiso para guardar lo que me mandes. | |
| BIEN-1R | arranque | 1 | Hola, {{nombre}}. Te escribo porque {{quien_regala}} te hizo un regalo: {{formato}} con tu viaje, contado por vos. Funciona así: yo te pregunto por acá, vos me contás en audio cuando puedas, y al volver lo tenés escrito con tu voz, con tus fotos y con un código QR para escuchar algunos de tus audios. ¿Arrancamos? Contestame SÍ: con eso me das permiso para guardar lo que me mandes. | |
| BIEN-2 | arranque | 2 | Vamos. Antes de salir te mando unas pocas preguntas, de a una; cuando las contestás, silencio hasta el día que te vas. En el viaje, dos por día: una cortita al mediodía, que es una foto o diez segundos de audio, y una a la noche para que me cuentes el día. Si un día no tenés ganas, "paso" y seguimos. La hora la tomo del país adonde vas; si cambiás de país y te llega a deshora, la corregís desde tu panel. Ahí va la primera. | |

## Antes de salir

| ID | Momento | Orden | Texto | Ya de viaje |
|---|---|---|---|---|
| AS1 | antes | 1 | Empecemos por el principio, antes de cualquier valija. ¿De dónde salió este viaje, {{nombre}}? Contame el momento en que dejó de ser una idea y pasó a ser algo que iba a pasar de verdad. Puede haber sido una charla o una tarde en que dijiste "lo hago". | Ya estás en camino, pero quiero empezar por antes de cualquier valija. ¿De dónde salió este viaje, {{nombre}}? Contame el momento en que dejó de ser una idea y pasó a ser algo que iba a pasar de verdad. Puede haber sido una charla o una tarde en que dijiste "lo hago". |
| AS2 | antes | 2 | Ya falta poco, {{nombre}}. ¿Cómo andás con este viaje? Ganas, nervios, cansancio, lo que haya, y qué esperás encontrar allá. Contame el momento, en estos días, en que te cayó la ficha de que se viene en serio: qué estabas haciendo y qué se te cruzó por la cabeza. | Ya saliste, así que esta te agarra en camino. ¿Cómo venías con este viaje los últimos días? Ganas, nervios, cansancio, lo que haya habido, y qué esperabas encontrar allá. Contame el momento en que te cayó la ficha de que se venía en serio: qué estabas haciendo y qué se te cruzó por la cabeza. |
| IM1 | antes | 3 | Cuando pensás en este viaje, ¿qué imagen se te aparece? No lo que leíste ni lo que hay que ver: la que se te viene sola, aunque sea una calle. Contame esa imagen y de dónde te viene. | Antes de salir, cuando pensabas en este viaje, ¿qué imagen se te aparecía? No lo que habías leído ni lo que había que ver: la que se te venía sola, aunque fuera una calle. Contame esa imagen y de dónde te venía. |
| VA1 | antes | 4 | Contame una cosa que va en la valija sí o sí, {{nombre}}. No el cargador ni los documentos: algo tuyo. Qué es y por qué va con vos. | Ya estás en camino y la valija está cerrada. Contame una cosa que metiste y que no podía faltar, {{nombre}}. No el cargador ni los documentos: algo tuyo. Qué es y por qué va con vos. |

## Salida y día siguiente

| ID | Momento | Orden | Texto | Ya de viaje |
|---|---|---|---|---|
| UC1 | salida | | Hoy es el día, {{nombre}}. Antes de cerrar la puerta, contame cómo es este último rato en casa: qué estás haciendo ahora mismo, qué queda dando vueltas. | |
| ID1 | dia-siguiente-salida | | Ayer fue el día del viaje, {{nombre}}. No me cuentes horarios: contame un rato del camino en el que no estabas haciendo nada, solo yendo, y te diste cuenta de que ya estabas lejos. Qué había del otro lado de la ventanilla y qué pensabas. | |

## La noche

### Comienzos

| ID | Momento | Orden | Texto | Ya de viaje |
|---|---|---|---|---|
| C1 | noche-comienzo | 1 | Contame cómo fue hoy, {{nombre}}, como se lo contarías a alguien que te quiere y no estuvo. | |
| C2 | noche-comienzo | 2 | Ya terminó el día. Contámelo como si alguien de casa te llamara ahora mismo a preguntarte cómo te fue. | |
| C3 | noche-comienzo | 3 | ¿Cómo fue hoy, {{nombre}}? Contámelo como se lo contarías en la mesa cuando vuelvas, con lo que valga la pena. | |

### Puertas

| ID | Momento | Orden | Texto | Ya de viaje |
|---|---|---|---|---|
| NO1 | noche-puerta | 1 | Arrancá por algo que comiste | |
| NO2 | noche-puerta | 2 | Arrancá por un lugar donde te quedaste un rato | |
| NO3 | noche-puerta | 3 | Arrancá por algo que viste hoy y que allá donde vivís sería raro | |
| NO4 | noche-puerta | 4 | Arrancá por el momento en que más sentiste que estabas de viaje | |
| NO5 | noche-puerta | 5 | Arrancá por alguien que te cruzaste y no conocías | |
| NO6 | noche-puerta | 6 | Arrancá por algo que no estaba en el plan | |
| NO7 | noche-puerta | 7 | Arrancá por un rato en que no estabas haciendo nada | |
| NO8 | noche-puerta | 8 | Arrancá por el momento en que el cuerpo te avisó algo, cansancio o hambre, lo que fuera | |
| NO9 | noche-puerta | 9 | Arrancá por algo que te hizo reír, aunque sea una tontería | |

### Cierres

| ID | Momento | Orden | Texto | Ya de viaje |
|---|---|---|---|---|
| F1 | noche-cierre | 1 | , y de ahí seguí por donde quieras. Mandá las fotos que quieras que queden. | |
| F2 | noche-cierre | 2 | , y después seguí con lo que venga. Si hay fotos, mandalas. | |
| F3 | noche-cierre | 3 | , y de ahí andá por donde te lleve el día. Las fotos que quieras guardar, mandámelas. | |

## El mediodía

Orden = orden de envío de la v2 (un viaje corto recibe las primeras; cuando se terminan, vuelve a empezar, con las reglas de repetición de abajo).

| ID | Momento | Orden | Texto | Ya de viaje |
|---|---|---|---|---|
| MD1 | mediodia | 1 | ¿Dónde andás ahora, {{nombre}}? Mandame una foto de eso, tal cual está, sin explicarme nada. | |
| MD5 | mediodia | 2 | Hoy quiero verte a vos, {{nombre}}. Una foto de cómo saliste: de cuerpo entero o solo las zapatillas, como te dé. | |
| MD3 | mediodia | 3 | Quiero escuchar dónde estás. Grabame diez segundos de lo que suena ahí, sin hablar vos, así lo guardo. | |
| MD4 | mediodia | 4 | Levantá la cabeza un segundo. ¿Cómo está el cielo ahí hoy? Sacale una foto, con lo que se cuele abajo. | |
| MD9 | mediodia | 5 | ¿Aprendiste alguna palabra de ahí, aunque sea una? Mandámela en un audio, dicha como la escuchaste. | |
| MD2 | mediodia | 6 | Te agarro en medio del día. ¿Qué tenés en la mano ahora, además del teléfono? Sacale una foto, y si querés contame en un audio qué es. | |
| MD10 | mediodia | 7 | ¿A qué huele donde estás ahora, {{nombre}}? Decímelo en un audio de una frase. | |
| MD6 | mediodia | 8 | Regalame una foto de algo escrito que tengas cerca ahora, un cartel o lo que sea, tal cual está. | |
| MD7 | mediodia | 9 | Mirá a menos de un metro tuyo. Sacale una foto a algo chiquito que haya ahí, lo que sea, y seguí. | |
| MD12 | mediodia | 10 | Sacale una foto a tu mano, apoyada donde esté ahora, con lo que tenga. | |
| MD8 | mediodia | 11 | Contame en una frase qué viene ahora, {{nombre}}, y mandame una foto de por dónde vas. Después seguí. | |
| MD11 | mediodia | 12 | En una frase, así como estás ahora: ¿cómo venís hoy? Un audio y listo. | |

## El final

| ID | Momento | Orden | Texto | Ya de viaje |
|---|---|---|---|---|
| FN1 | ultima-noche | | Mañana te volvés. Antes de armar la valija, contame una cosa de este viaje que no querés que se te olvide, una sola, y por qué esa. Si tenés una foto, que venga. | |
| VU0 | vuelta | | Hoy se vuelve, {{nombre}}. ¿Qué te traés en la valija que no estaba a la ida? Sacale una foto, donde estés. | |
| VU1 | dia-siguiente-vuelta | | La vuelta se hace distinto que la ida. Contame el momento del viaje de ayer en que sentiste que ya estabas volviendo, lo que fuera que te lo marcó. Qué había alrededor y en qué pensabas. | |
| CA1 | noche-casa | | Ya volviste, {{nombre}}. Quedate en el primer rato en casa, con la valija todavía cerrada: contame qué te llamó la atención de tu propia casa después de estar afuera, aunque sea una pavada. Si tenés una foto de eso, mandala. | |

## El álbum

| ID | Momento | Orden | Texto | Ya de viaje |
|---|---|---|---|---|
| AL1 | album | 1 | Una última cosa, {{nombre}}: el álbum. Juntá las {{fotos_album}} fotos del viaje que más quieras tener en el libro y mandámelas acá mismo, en una tanda o en varias, como te quede cómodo. Cuando estén todas, escribime "listo"; si te olvidás, en un rato te pregunto yo. | |
| AL2 | album | 2 | ¿Ya están todas, {{nombre}}? Si me decís que sí, o si no me contestás, cierro el álbum con las que mandaste. | |

## Acuses

Rotan dentro de su grupo. Van como primera línea del mensaje que sigue, o solos si no sigue nada.

| ID | Momento | Orden | Texto | Ya de viaje |
|---|---|---|---|---|
| ACN1 | acuse-noche | 1 | Gracias, {{nombre}}. A dormir, que mañana sigue. | |
| ACN2 | acuse-noche | 2 | Quedó guardado. Buenas noches. | |
| ACN3 | acuse-noche | 3 | Lo escuché. Hasta mañana, {{nombre}}. | |
| ACN4 | acuse-noche | 4 | Gracias por contármelo. Que descanses. | |
| ACM1 | acuse-mediodia | 1 | Ya está, gracias. | |
| ACM2 | acuse-mediodia | 2 | Gracias, quedó. | |
| ACM3 | acuse-mediodia | 3 | Lo tengo. Hasta la noche. | |
| ACM4 | acuse-mediodia | 4 | Llegó, {{nombre}}. Hasta la noche. | |
| ACA1 | acuse-antes | 1 | Gracias, {{nombre}}. Ahora otra cosa. | |
| ACA2 | acuse-antes | 2 | Lo escuché. Sigo con esto. | |
| ACA3 | acuse-antes | 3 | Quedó guardado. Te pregunto una más. | |
| ACA4 | acuse-antes | 4 | Gracias. Y ahora... | |

## Casos

| ID | Momento | Orden | Texto | Ya de viaje |
|---|---|---|---|---|
| PAS-V | caso | | Dale, esta la salteamos. Mañana hay otra. | |
| PAS-A | caso | | Perfecto, {{nombre}}, sin problema. Seguimos con la próxima. | |
| TXT | caso | | Lo leí, gracias. Si podés, contámelo también en audio: tu voz es lo que va al libro. Y si te queda más cómodo escribir, escribí nomás. | |
| COR | caso | | Se me cortó el audio o no llegó bien, {{nombre}}. ¿Me lo mandás de nuevo cuando puedas? Sin apuro. | |
| REC1 | caso | | Hola, {{nombre}}. Te quedó una pregunta esperando, sin apuro. Cuando tengas un rato, contestámela en audio, o "paso" y seguimos con la que viene. | |

Cuándo va cada uno: PAS-V, "paso" en el viaje · PAS-A, "paso" antes de salir (la siguiente sale enseguida) · TXT, escribe en vez de mandar audio · COR, audio cortado o que no se entiende (el ruido de la calle no cuenta) · REC1, antes de salir, una pregunta sin contestar 3 días.

## Atrasos

Van pegados arriba de la pregunta de la noche cuando la noche anterior quedó sin contestar. ATR1 a ATR3 rotan (una noche sin contestar); ATR-V es la única para dos noches o más.

| ID | Momento | Orden | Texto | Ya de viaje |
|---|---|---|---|---|
| ATR1 | atraso | 1 | Ayer no me contaste, y no pasa nada. Si querés, metelo hoy junto con lo de hoy, con esas fotos también. | |
| ATR2 | atraso | 2 | Anoche quedó sin contar, y está bien. Hoy contame los dos días si tenés ganas, y mandá las fotos que hayan quedado. | |
| ATR3 | atraso | 3 | No te preocupes por lo de ayer. Si algo de ese día merece quedar, sumalo hoy, con foto si la hay. | |
| ATR-V | atraso | | Hace unos días que no me contás, y no pasa nada. Si querés, hoy contame lo que quieras de esos días, lo que te quedó, y mandá las fotos que tengas. Si no, con lo de hoy está bien. | |

## Preguntas propias

PR-R si es un regalo; PR-P si las dejó el viajero. La pregunta va tal cual la escribieron, entre «», sin corregir.

| ID | Momento | Orden | Texto | Ya de viaje |
|---|---|---|---|---|
| PR-R | propia | | Hoy la pregunta no es mía, es de {{quien_regala}}: «{{pregunta}}». Contale a esa persona, aunque me lo mandes a mí. Si hay foto, va. | |
| PR-P | propia | | Hoy va una que te dejaste vos, {{nombre}}, antes de salir: «{{pregunta}}». A ver qué le decís ahora. Si tenés una foto, mandala. | |

## Despedida

DES+ se agrega adentro de DES, antes de "Fue lindo acompañarte", solo si mandó más fotos de las que entran. Con cero fotos, DES va sin DES+ y se avisa a Naza.

| ID | Momento | Orden | Texto | Ya de viaje |
|---|---|---|---|---|
| DES | despedida | | Ya está, {{nombre}}: el viaje quedó contado, con tu voz. Ahora me toca a mí armar el libro con lo que me diste; lo vas a poder leer en tu panel antes de que se cierre, y ahí cambiás lo que haga falta. Fue lindo acompañarte. Gracias por dejarme entrar en tu viaje. | |
| DES+ | despedida | | Del álbum me quedé con las primeras {{fotos_album}} que mandaste, que son las que entran. | |

## Reglas del flujo

Copiadas de `flujo-vigente.md` (y de los aprobados donde se indica).

**De fondo**
- Banco fijo: ningún modelo escribe ni decide durante la entrevista; solo se transcriben los audios.
- El código no sabe de ciudades (solo fechas). "Paso" siempre vale.

**Horas**
- Mañana (UC1, ID1 en pasado, VU1 en pasado): 10:00. Mediodía: 13:00. Noche: la que eligió en la compra (por defecto 21:30).
- Antes de salir y el día de salida: hora de su casa. Desde el día siguiente a la salida hasta el día de vuelta: hora del país del viaje. Desde el día después de volver: otra vez la de su casa.
- Nunca entre las 23:00 y las 8:00: si algo cae ahí, espera a las 8:00. Las encadenadas de antes de salir también respetan esa franja.

**Arranque y antes de salir**
- BIEN-1 (o BIEN-1R si es regalo) pide el SÍ. Con el SÍ: BIEN-2 y enseguida AS1.
- AS1 → AS2 → IM1 → VA1 encadenadas: cada una sale apenas contesta la anterior, a cualquier hora (fuera de la franja 23-8), con un ACA como primera línea. Después, silencio hasta el día de salida.
- Una colgada 3 días → REC1, una sola vez; no va si faltan menos de 2 días para salir.
- "Paso" antes de salir → PAS-A y la siguiente enseguida.

**Salida y día siguiente**
- Día de salida: solo UC1 (10:00, hora de su casa). Es el único mensaje de ese día.
- Día siguiente: ID1 en pasado (10:00, hora del país del viaje), en lugar del mediodía. A la noche, la noche común.
- Si la cadena de antes de salir no terminó, UC1 e ID1 salen igual.

**Cada día del viaje**
- Mediodía: una MD, en el orden de la tabla. Sin recordatorio si no contesta. Acuse ACM.
- Choque mediodía/noche: si la MD choca con la puerta de esa noche (MD2 con NO1 comida, MD8 con NO6 plan), se saltea.
- Viajes largos (segunda vuelta de la lista MD): se repiten solo MD1, MD5, MD3, MD4, MD6; MD9, MD8 y MD11 no se repiten.
- Noche: comienzo + puerta + cierre (C1-C3, NO1-NO9, F1-F3), rotan por separado. Acuse ACN.
- Rotación de puertas (Fable, aprobado con la noche): empezar por comida y lugar; alternar afuera (lugar, lo distinto, alguien) y adentro (sentir, cuerpo, rato quieto); las livianas (comida, risa) entre dos pesadas.
- Las de antes de salir que faltaron: van todas, en orden, una por noche en los primeros días, con su variante "ya de viaje", en lugar de la noche común. Nunca se saltean.
- Preguntas propias: reemplazan noches comunes, repartidas parejas. Nunca en la última noche ni en el día de vuelta.
- Noche sin contestar: la siguiente llega igual, con ATR arriba (una noche: rotan ATR1-ATR3; dos o más: ATR-V). Lo que no contó no se repregunta.
- ATR va solo arriba de una pregunta de noche del viaje: nunca arriba de CA1.
- "Paso" en el viaje → PAS-V. Texto en vez de audio → TXT, una o dos veces por viaje (no siempre: si escribe siempre, es su manera). Audio cortado → COR.
- Las fotos sueltas se guardan siempre, en cualquier momento.

**El final**
- Noche anterior a la vuelta: mediodía normal; a la noche FN1 (reemplaza la noche común).
- Día de vuelta: solo VU0, al mediodía (hora del país del viaje).
- Al otro día (hora de su casa): 10:00 VU1 en pasado; a la noche CA1; apenas contesta CA1, AL1.

**El álbum**
- Se cierra con "listo", con un sí a AL2, o si no contesta AL2.
- A las 5 horas sin fotos nuevas: AL2. Si contesta "no" o manda más fotos, otras 5 horas y AL2 una vez más como mucho; después se cierra igual.
- Si manda de más, se guardan las primeras {{fotos_album}} y va DES+.
- Con cero fotos no sale AL2: se avisa a Naza y decide él. La despedida va sin DES+.
- Entre AL1 y la despedida no hay otros recordatorios.
- Cuando se cierra el álbum: DES.

**Decisiones del compilado (Claude, 30/09; huecos que no tenían regla escrita)**
- El día siguiente a la salida no lleva MD: ID1 ocupa ese lugar (lo dice el flujo; la tabla del mediodía no lo exceptuaba).
- Viajes largos: MD2, MD10, MD7 y MD12 tampoco se repiten. En la segunda vuelta solo van MD1, MD5, MD3, MD4 y MD6, en ese orden, y siguen rotando.
- Acuses de las sueltas: UC1 → ACM1 o ACM2 (nunca los que dicen "Hasta la noche": ese día no hay noche). ID1 y VU1 → ACM (cualquiera). FN1 → ACN. CA1 → ACA como primera línea de AL1.
- Álbum con cero fotos: a las 5 horas de AL1 se avisa a Naza, y la despedida espera su decisión.
