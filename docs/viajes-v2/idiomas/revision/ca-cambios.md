# Cambios en banco-ca.md después de la revisión nativa (05/10/2026)

Fuentes: `ca-problemas.md` (37 problemas de un nativo que leyó a ciegas) y `ca-softcatala.md` (un aviso real). Se comparó cada fila con `banco.md` para no cambiar el sentido. La versión anterior quedó en `../historial/banco-ca-2026-10-05-antes-de-la-revision.md`.

Se cambiaron **49 filas**. En todas siguen las mismas marcas {{…}} y la misma cantidad de «». Las puertas siguen sin punto final y los cierres empiezan con ", i…". Ninguna palabra nueva marca el género de la persona. "Vitácora de Viaje" y la plantilla de Meta no se tocaron.

## Quién regala

En catalán un nombre de persona pide artículo ("en Jordi", "la Marta", "l'Anna"), y "de" o "a" delante se contraen ("del teu pare", "al teu pare"). No sabemos el género ni la forma del valor, así que {{quien_regala}} quedó siempre como **sujeto del verbo**, sin nada delante. Nunca "de {{quien_regala}}", "a {{quien_regala}}" ni "per a {{quien_regala}}". Sin artículo es la forma del registro escrito y vale para cualquier valor. Hubo manera en las cinco filas.

Queda una cosa para el código. Si el valor empieza en minúscula ("el teu pare") y cae a principio de frase (BIEN-1R, PR-R2, PR-R3), hay que ponerle mayúscula. Pasa lo mismo en castellano.

## Tabla

| ID | Qué cambió | Por qué |
|---|---|---|
| BIEN-1 | Sale "Funciona així:". "Contesta'm SÍ: així em dones permís" → "Contesta'm SÍ i així em dones permís". | Dos puntos que no hacían falta. |
| BIEN-1R | "T'escric perquè {{quien_regala}} t'ha fet un regal: {{formato}}…" → "{{quien_regala}} t'ha regalat {{formato}} amb el teu viatge, explicat per tu, i jo soc qui l'escriurà." Sale "Funciona així:". "SÍ i així". | {{quien_regala}} pasa a ser el sujeto al principio de la frase. Sin dos puntos. |
| BIEN-2 | "unes poques" → "unes quantes"; "contestat" → "contestades"; "et arriba" → "t'arriba"; "dues al dia:" → "dues al dia,". | Calco, concordancia del participio, apóstrofo (el aviso de Softcatalà) y dos puntos. |
| AS1, AS1~viaje | "va passar a ser una cosa que passaria" → "es va convertir en una cosa que passaria". | Repetía "passar". |
| AS2 | "Com portes aquest viatge?" → "Com el portes, aquest viatge?". El ": què feies" pasa a otra frase. | Lo natural lleva el pronombre. Sin dos puntos. |
| AS2~viaje | "Com el portaves, aquest viatge, els últims dies?". Sale el ": què feies". | Igual que AS2. |
| IM1, IM1~viaje | "No el que has llegit…: la que et surt sola" → "No el que has llegit…, sinó la que et surt sola". | Sin dos puntos, con "sinó". |
| VA1 | "No el carregador ni els documents: alguna cosa teva" → "…, sinó alguna cosa teva". | Sin dos puntos. |
| VA1~viaje | Lo mismo que VA1, y "te l'has emportat" → "te l'has emportada". | Dos puntos. Concordancia con "una cosa". |
| UC1 | "com va ser l'última estona" → "com ha estat l'última estona". El ": què feies" pasa a otra frase, con "què t'ha quedat rondant pel cap". | Es de hoy y lleva perfecto, como dice la regla del banco. Sin dos puntos. |
| ID1 | "No m'expliquis horaris: explica'm" → "No m'expliquis horaris. Explica'm". | Sin dos puntos. |
| C3 | "amb el que valgui la pena" → "només el que valgui la pena". | Quedaba colgado. "Como en la mesa, lo que valga la pena" se mantiene. |
| C4 | Los dos puntos pasan a punto. | Sin dos puntos. |
| C5 | "i se n'adona si li fas un resum" → "i que nota de seguida quan li fas un resum". | Sonaba duro. |
| NO3 | Sale "avui". | Con C3 quedaba "avui" tres veces. |
| NO6 | "que no entrava en els plans" → "que no estava prevista". | Calco. |
| NO8 | "cansament o gana, el que sigui" → "de cansament o de gana". | Se amontonaban las comas al pegarla con F2. |
| F1 | "Envia les fotos que vulguis que hi quedin" → "Envia'm les fotos que t'agradaria guardar". | "Hi" sin antecedente, y "vulguis" dos veces. |
| F4 | "explica'm la resta" → "continua amb la resta". "Les fotos d'avui, totes les que vulguis, aquí" → "Envia'm aquí totes les fotos d'avui que vulguis". | Sonaba a formulario, y con C4 repetía "explica'm". |
| MD5 | "com vas avui: de cos sencer" → "com vas avui, de cos sencer". | Sin dos puntos. |
| MD4 | "Com és el cel avui, allà?" → "Com està el cel allà, avui?". | Para el estado del cielo se dice "com està". Descarté "Quin cel fa", que propuso el revisor, porque no es la expresión hecha ("quin temps fa"). |
| MD2 | "telèfon" → "mòbil". | En Cataluña se dice "mòbil". |
| MD6 | "Regala'm una foto" → "Envia'm una foto". | "Regala'm" se entiende como pedir un regalo de verdad. |
| MD7 | "Mira a menys d'un metre de tu… i continua" → "Mira què tens a menys d'un metre… i continua amb el que feies". | Calco. Además no se sabía con qué seguir. |
| MD12 | "recolzada on sigui ara" → "allà on la tinguis recolzada ara". | No se entendía. |
| MD8 | "què et toca ara" → "què et toca fer ara". "de per on vas" → "del lloc on ets". "Després continua" → "Després, continua amb el teu dia". | Era raro y ambiguo. |
| MD11 | "En una frase, tal com estàs ara: com et va avui?" → "En una frase i tal com estàs ara, com et va avui?". | Sin dos puntos. |
| VU1 | Reescrita: "La tornada no és com l'anada. Explica'm el moment en què vas sentir que ja tornaves i què t'ho va fer notar." | "Es fa diferent" es calco, y "fos el que fos el que te'n va fer adonar" pesaba. |
| CA1 | El ": què et va cridar l'atenció" pasa a otra frase. | Sin dos puntos. |
| AL1 | "I una última cosa: l'àlbum" → "Queda una última cosa, l'àlbum". "Quan les tinguis totes" → "Quan me les hagis enviades totes". | Ahora se lee que "ja està" va después de mandarlas todas. Sin dos puntos. |
| AL1-P | Igual que AL1 ("Queda una última cosa, {{nombre}}, l'àlbum"). | Igual que AL1. |
| AL3 | ": reenvia'm les que vols" → "i reenvia'm les que vulguis". "en unes hores" → "d'aquí a unes hores". | Sin dos puntos, subjuntivo, y el plazo futuro lleva "d'aquí a". |
| ACN1 | "que demà continua" → "que demà continuem". | Le faltaba el sujeto. |
| PAS-A | "Perfecte" → "D'acord". | "Perfecte" para un salteo sonaba a formulario. |
| PAS-A2 | "D'acord… Ja està, i ara no et diré res fins al dia que marxis". | El mismo "Perfecte", y dos puntos. |
| TXT | ": la teva veu" → ", perquè la teva veu". "escriu sense problema" → "escriu, que també serveix". | Dos puntos y calco ("escribí nomás"). |
| REC1 | "T'ha quedat una pregunta esperant" → "Tens una pregunta pendent". "o "passo"" → "o escriu "passo"". | Calco, y "passo" no tenía verbo. |
| REC1-U | Lo mismo que REC1, y "i fins al dia que marxis" → "I ens retrobem el dia que marxis". | Ahora se lee como despedida hasta el día que sale, que es lo que dice el original ("nos vemos el día que salís"). Descarté la propuesta del revisor ("ja no et diré res") porque sonaba a reto. |
| ATR2 | "es va quedar sense explicar, i està bé" → "no em vas explicar el dia, i no passa res". | Faltaba qué quedó sin contar. "I està bé" es calco. |
| ATR3 | "mereix quedar-se" → "Si hi ha alguna cosa d'aquell dia que valgui la pena guardar". "pel d'ahir" → "per ahir". | Calco. |
| ATR-V | "que no m'expliques" → "que no m'expliques com et va". Se simplificó la segunda frase. | Sin objeto quedaba cojo. Así se evita también el "res… res". |
| ATR-PR | "la pregunta de {{quien_regala}}" → "Ahir no vas contestar la pregunta que t'havia deixat {{quien_regala}}, i no passa res. Si vols, contesta-la avui, juntament amb el d'avui". | {{quien_regala}} pasa a ser sujeto, sin "de". |
| PR-R | "és de {{quien_regala}}" → "L'ha escrita {{quien_regala}}". "Explica-ho a {{quien_regala}}" → "Explica-ho com si {{quien_regala}} t'escoltés, encara que m'ho enviïs a mi". | Las dos marcas quedan como sujeto, sin "de" ni "a". Se mantiene la idea: "contale a quien regala aunque me lo mandes a mí". |
| PR-R2 | "t'escriu una altra persona, no jo" → "la pregunta ve d'una altra persona". "fóssiu" → "estiguéssiu". | El mensaje llega del mismo número y confundía. "Estar cara a cara" es lo natural. |
| PR-R3 | "És per a {{quien_regala}}" → "La resposta l'espera {{quien_regala}}, així que parla-li…". | Las dos marcas quedan como sujeto. "Per a" se contrae ("per al teu pare"). |
| PR-P | "una que et vas deixar tu" → "una pregunta que vas deixar escrita tu abans de marxar". | Se leía como "una que te olvidaste". |
| DES | "Ja està, {{nombre}}: el viatge" → "Ja està, {{nombre}}. El viatge". "abans que es tanqui" → "abans que el tanquem". "Ha estat bonic acompanyar-te" → "M'ha agradat molt acompanyar-te". | Dos puntos. No se sabía qué se cerraba. "Bonic" no se usa así. |

También se actualizaron las notas 1, 3, 6, 7 y 10 al pie de banco-ca.md, que citaban textos viejos, y se agregó la nota 12.

**Propuestas del revisor que no se aplicaron:** "Vitácora de Viatge" y "T'escric per" en PLANTILLA-mensaje (la marca queda igual y la plantilla no se tocó). El revisor dio por buena la combinación C2 + NO2 + F3, que no necesitaba cambios.

## Softcatalà

Se pasaron por el corrector las 49 filas cambiadas, una por llamada, con 2,5 s entre llamadas (`language=ca`). Las marcas se reemplazaron por ejemplos: {{nombre}} → Laia, {{quien_regala}} → Jordi, {{formato}} → un llibre imprès, {{fotos_album}} → 20, {{fotos_mandadas}} → 23, {{pregunta}} → Què vas menjar?

Hubo **2 avisos, los dos falsos positivos**. Son los mismos que ya había en la primera pasada.

| ID | Aviso | Fragmento | ¿Real? |
|---|---|---|---|
| MD2 | Probablement no s'ha d'accentuar (què). | explica'm en un àudio **què** és | No. Es interrogativa indirecta ("quina cosa és") y lleva acento. |
| DES | Reviseu la construcció de relatiu. | fer el llibre amb **el que** m'has donat | No. "El que" neutro (= "allò que") lo admite la gramática del IEC. |

El aviso real de antes ("et arriba" → "t'arriba", BIEN-2) quedó corregido. NO8 ya no da aviso de punto final.

## Segunda lectura

Fuente: `ca-segunda-lectura.md`, una segunda lectura a ciegas que encontró 17 cosas. Se cambiaron **16 filas**. Siguen las mismas reglas: las mismas marcas y «», nada que marque género y ningún dos puntos nuevo.

| ID | Qué cambió | Por qué |
|---|---|---|
| IM1, IM1~viaje | "No el que has llegit ni el que s'ha de veure, sinó la que…" → "No la de les guies ni la dels llocs que s'han de veure, sinó la que…". "un carrer" → "un carrer qualsevol". | Mezclaba neutro y femenino. "Un carrer" solo no decía "cualquier calle". Se mantienen las dos ideas del original: lo leído y lo que hay que ver. |
| AS1, AS1~viaje | "abans de qualsevol maleta" → "molt abans de fer la maleta". | Calco. |
| BIEN-2 | Se reescribió en frases cortas: "no et diré res fins al dia que marxis", "Al migdia, una de curteta… A la nit, una perquè m'expliquis el dia", "Te les envio a l'hora del país on vas. Si canvies de país i els missatges t'arriben a deshora, pots canviar l'hora des del teu panell". | Era telegráfico. "L'hora la prenc" sonaba forzado y no se sabía qué llegaba a deshora. |
| AS2, AS2~viaje | "Com el portes, aquest viatge?" → "Com ho portes, això del viatge?". "va de debò" → "anava de debò". | La frase anterior quedaba forzada, y había que concordar los tiempos. AS2~viaje se cambió para que siga igual que AS2. |
| UC1 | "Tant si encara ets a casa com si ja ets de camí" → "Quan ja siguis de camí". | Si todavía está en casa, la puerta no se cerró. Ahora contesta cuando ya salió. |
| ID1 | Sale la coma antes de "i et vas adonar". | Cortaba la subordinada. |
| MD1 | "una foto d'això" → "una foto del lloc". | "Això" no tenía a qué referirse. |
| MD3 | "Vull sentir on ets… sense que parlis tu" → "Vull sentir com sona el lloc on ets… del que se sent, sense parlar". | Calco, y la frase pesaba. |
| MD4 | "Com està el cel allà, avui?" → "Quin cel fa allà, avui?". | Los dos lectores nativos dicen que es lo natural en Barcelona. Se revierte lo que hice en la primera revisión. |
| MD12 | "de la teva mà" → "de la mà". | Con partes del cuerpo va el artículo. |
| ATR1 | "afegeix-ho avui amb el d'avui" → "avui explica'm també el dia d'ahir". | Repetía "avui" y "el d'avui" no se entendía. No usé "els dos dies" para no repetir ATR2, que rota con ATR1. |
| ATR-PR | "contesta-la avui, juntament amb el d'avui" → "contesta-la avui i després explica'm el dia". | La repetición, y "juntament amb" sonaba a formulario. |
| DES | "Gràcies per deixar-me entrar al teu viatge" → "Gràcies per explicar-me el teu viatge". | Sonaba a frase hecha. Siguen dos oraciones después de donde se mete DES+, porque el código parte DES por las dos últimas oraciones (`mensajes.ts`). |

**Lo que no se tocó, por indicación del coordinador:**
- PAS-V. El código lo manda solo cuando ese día no queda otra pregunta.
- F4 junto con C3. El código no los va a juntar.

**Lo que tampoco se tocó:** C4 con F3, que repite "fotos". La lectura lo da por aceptable.

**Softcatalà** (las 16 filas, una por llamada, con 2,5 s entre llamadas y los mismos valores de ejemplo): hubo 1 aviso. Es el falso positivo de siempre en DES, "el que" neutro ("amb el que m'has donat"), que el IEC admite. Las otras 15 filas salieron sin avisos.
