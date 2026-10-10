# Revisión nativa del banco en catalán (banco-ca.md)

Hecha a ciegas: sin mirar banco.md ni otro texto en castellano. Gravedad: **A** = error o cambio de sentido · **B** = calco o frase que suena a traducción · **C** = pulido.

## Errores y frases

| ID | Problema | Propuesta en catalán |
|---|---|---|
| PR-P | **A · Sentido cambiado.** "una que et vas deixar tu" en catalán es "una que te olvidaste". La persona entiende que se olvidó de algo. | Avui toca una pregunta que vas deixar escrita tu abans de marxar, {{nombre}}: «{{pregunta}}». A veure què hi dius ara. Si tens una foto, envia-la. |
| BIEN-1R, PR-R, PR-R2, PR-R3, ATR-PR | **A · Técnico.** {{quien_regala}} pegado sin artículo ni contracción. En Cataluña un nombre propio va con artículo ("la Marta", "en Jordi", "l'Anna"); "de {{quien_regala}}" da "de Anna" (debe ser "d'Anna") o "de el teu pare" (debe ser "del teu pare"); "a el teu pare" (debe ser "al"). | Guardar {{quien_regala}} ya con artículo ("la Marta", "en Jordi", "l'Anna", "el teu pare") y que el código resuelva "de + el → del", "a + el → al", "de + vocal → d'". Si no, reescribir para que el nombre vaya siempre al principio: "{{quien_regala}} t'ha deixat una pregunta". |
| BIEN-2 | **A · Normativa.** "et arriba": el pronombre se apostrofa ante vocal. | si canvies de país i t'arriba a deshora |
| VA1~viaje | **A · Normativa.** "te l'has emportat" refiere a "una cosa" (femenino); con "l'" el participio concuerda. | Què és i per què te l'has emportada. |
| UC1 | **A · Tiempo.** "com va ser l'última estona" es pretérito perifrástico para algo de hoy mismo; contradice la regla del propio banco (hoy = perfecto). | explica'm com ha estat l'última estona abans de tancar la porta |
| BIEN-2 | **B · Calco.** "unes poques preguntes" = "unas pocas preguntas". | t'enviaré quatre preguntes / unes quantes preguntes |
| BIEN-2 | **C · Normativa (recomendado).** "quan les hagis contestat": con "les" el participio concuerda en registro cuidado. | quan les hagis contestades |
| MD6 | **B · Calco rioplatense.** "Regala'm una foto" en catalán es pedir un regalo literal; suena raro. | Envia'm una foto d'alguna cosa escrita que tinguis a prop, un cartell o el que sigui, tal com està. |
| VU1 | **B · Calco.** "La tornada es fa diferent de l'anada" = "se hace distinta". Además "fos el que fos el que te'n va fer adonar" es pesadísimo. | La tornada no és com l'anada. Explica'm el moment en què vas sentir que ja tornaves i què t'ho va fer notar. Què hi havia al voltant i en què pensaves. |
| REC1 | **B · Calco.** "T'ha quedat una pregunta esperant" = "te quedó una pregunta esperando". Y "o "passo"" queda sin verbo. | Hola, {{nombre}}. Tens una pregunta pendent, sense pressa. Quan tinguis una estona, contesta-la en àudio, o escriu "passo" i seguim amb la següent. |
| REC1-U | **A · Ambiguo.** "i fins al dia que marxis" se puede leer como "y (seguí) hasta el día que te vayas", no como despedida. Mismo calco y falta de verbo que REC1. | Hola, {{nombre}}. Tens una pregunta pendent, sense pressa. Quan tinguis una estona, contesta-la en àudio, o escriu "passo". Després, ja no et diré res fins al dia que marxis. |
| ATR2 | **B · Calco y falta sujeto.** "es va quedar sense explicar, i està bé": no dice qué quedó sin contar; "i està bé" = "y está bien". | Ahir a la nit no m'ho vas explicar, i no passa res. Avui explica'm els dos dies, si et ve de gust. |
| ATR3 | **B · Calco.** "mereix quedar-se" = "merece quedarse". | No et preocupis per ahir. Si hi ha alguna cosa d'aquell dia que valgui la pena guardar, afegeix-la avui. |
| ATR-V | **B.** "que no m'expliques" sin objeto queda cojo. | Fa uns dies que no m'expliques res, i no passa res. ... |
| ATR-V | **C · Repetición.** "no m'expliques res, i no passa res" (si se aplica lo anterior). | Fa uns dies que no em dius res, i no passa res. Si vols, avui explica'm el que t'hagi quedat d'aquests dies. Si no, amb el d'avui ja està bé. |
| TXT | **B · Calco.** "escriu sense problema" = "escribí sin problema". | I si t'és més còmode escriure, escriu, que també serveix. |
| DES | **B · Calco.** "Ha estat bonic acompanyar-te" = "fue lindo". En catalán "bonic" no se usa así para una experiencia. | M'ha agradat molt acompanyar-te. |
| DES | **C · Ambiguo.** "abans que es tanqui": no se sabe qué se cierra. | el podràs llegir al teu panell abans que el tanquem, i allà canvies el que calgui. |
| F1 | **B.** "que hi quedin": el "hi" no tiene antecedente (¿quedar dónde?). Y "vulguis" dos veces. | , i a partir d'aquí continua per on vulguis. Envia'm les fotos que vulguis guardar. |
| F4 | **B · Suena a formulario.** "Les fotos d'avui, totes les que vulguis, aquí." es una etiqueta, no una frase. | , i després explica'm la resta, el que et vagi venint al cap. Envia'm aquí totes les fotos d'avui que vulguis. |
| NO6 | **B · Calco.** "que no entrava en els plans" = "no entraba en los planes". | Comença per alguna cosa que no estava prevista |
| MD7 | **B · Calco + ambiguo.** "Mira a menys d'un metre de tu" suena traducido; "i continua" no dice con qué. | Mira què tens a menys d'un metre. Fes una foto a alguna cosa petita, la que sigui, i continua amb el que feies. |
| MD12 | **B · Sentido borroso.** "recolzada on sigui ara" no se entiende bien. | Fes una foto de la teva mà, allà on la tinguis recolzada ara, amb el que hi hagi. |
| MD8 | **B.** "una foto de per on vas" es raro; "Després continua" ambiguo. | Explica'm en una frase què et toca fer ara, {{nombre}}, i envia'm una foto d'on ets. Després, continua amb el teu dia. |
| AL1, AL1-P | **A · Sentido.** "Quan les tinguis totes" se lee como "cuando las tengas juntas", no "cuando las hayas mandado": alguien puede escribir "ja està" antes de mandarlas. | Quan me les hagis enviat totes, escriu-me "ja està"; si te n'oblides, d'aquí a una estona t'ho pregunto jo. |
| AL3 | **B · Calco.** "en unes hores" = "en unas horas"; en catalán es plazo futuro con "d'aquí a". "les que vols" mejor en subjuntivo. | reenvia'm les que vulguis que tregui. Si d'aquí a unes hores no em dius res, em quedo amb les primeres {{fotos_album}}. |
| AS1, AS1~viaje | **C · Repetición.** "va passar a ser una cosa que passaria" (passar / passaria). | ...en què va deixar de ser una idea i es va convertir en una cosa que passaria de debò. |
| AS2 | **C · Calco suave.** "Com portes aquest viatge?" = "¿cómo llevás?"; se entiende, pero lo natural es con pronombre. | Com el portes, aquest viatge? |
| MD2 | **C.** En Cataluña se dice "mòbil", no "telèfon". | ...a part del mòbil? |
| MD4 | **C · Pedido de la nota 10.** "Com és el cel avui" se entiende, pero para el tiempo lo natural es otra cosa. | Aixeca el cap un segon. Quin cel fa avui, allà? Fes-li una foto, amb el que surti per sota. |
| C3 | **C · Pedido de la nota 10.** "com ho explicaràs a taula" suena natural. "amb el que valgui la pena" queda colgado. | Explica-m'ho com ho explicaràs a taula quan tornis, només el que valgui la pena. |
| C5 | **C.** "se n'adona si li fas un resum" se entiende, un poco duro. | ...a algú que et coneix bé i que nota de seguida quan li fas un resum. |
| PR-R2 | **C.** "com si fóssiu cara a cara": lo natural es "estar". | Contesta com si estiguéssiu cara a cara. |
| PR-R2 | **C · Sentido.** "t'escriu una altra persona, no jo" y el mensaje llega igual del mismo número: puede confundir. | Aquesta nit la pregunta no és meva. {{quien_regala}} t'ha deixat aquesta: «{{pregunta}}». |
| ACN1 | **C.** "que demà continua": falta el sujeto; suena a medias. | Gràcies, {{nombre}}. A dormir, que demà continuem. |
| PAS-A, PAS-A2 | **C.** "Perfecte" para un salteo suena a formulario. | D'acord, {{nombre}}, cap problema. Passem a la següent. |
| PLANTILLA-mensaje | **C · Marca.** "Vitácora de Viaje" en castellano dentro de un texto catalán; además "T'escric per" puede leerse como "a causa de". | T'escric per la teva Vitácora de Viatge. (si se decide traducir la marca) |
| Todo el banco | **B · Estilo.** Muchísimos dos puntos ("Funciona així:", "Contesta'm SÍ:", "No el carregador...: alguna cosa teva", "Ja està:"). En catalán de WhatsApp suena a texto armado. | Cambiar los que se pueda por punto o coma. Ej. BIEN-1: "Comencem? Contesta'm SÍ i així em dones permís per guardar el que m'enviïs." |

## Género

Ninguna palabra marca el género de la persona. Revisado: "ets de viatge", "eres lluny", "com vas avui", "un àudio i ja està", "cara a cara". Cuidado con las propuestas: no usar "tu mateix/a", "cansat", "llest", "sol/a".

## Puertas y cierres: 5 combinaciones C + NO + F

| Combinación | Texto resultante | Problema | Propuesta |
|---|---|---|---|
| C4 + NO1 + F4 | Deixa'm veure-ho com ho has vist tu, {{nombre}}: explica'm el dia d'avui com si m'ensenyessis les fotos, una per una. Comença per alguna cosa que has menjat, i després explica'm la resta, el que et vagi venint al cap. Les fotos d'avui, totes les que vulguis, aquí. | "fotos" dos veces y "explica'm" dos veces; el cierre-etiqueta choca con C4. | Evitar C4 con F4 (o usar F4 corregida). C4 + NO1 + F3 se lee bien. |
| C5 + NO8 + F2 | Una altra nit allà. Explica'm com ha anat avui, però com ho explicaries a algú que et coneix bé i se n'adona si li fas un resum. Comença pel moment en què el cos t'ha avisat d'alguna cosa, cansament o gana, el que sigui, i després continua amb el que vingui. | Amontonamiento de comas y "el que sigui... el que vingui". | NO8: "Comença pel moment en què el cos t'ha avisat d'alguna cosa, de cansament o de gana" (sin "el que sigui"). |
| C3 + NO3 + F5 | Com ha anat avui, {{nombre}}? Explica-m'ho com ho explicaràs a taula quan tornis, amb el que valgui la pena. Comença per alguna cosa que has vist avui i que allà on vius seria estranya, i des d'aquí continua fins on arribis. Si hi ha fotos que vulguis guardar, envia-les. | "avui" tres veces; "allà on vius" + "des d'aquí" mezcla lugares. | NO3 sin "avui": "Comença per alguna cosa que has vist i que allà on vius seria estranya". |
| C1 + NO7 + F1 | Explica'm com ha anat avui, {{nombre}}, com ho explicaries a algú que t'estima i no hi era. Comença per una estona en què no feies res, i a partir d'aquí continua per on vulguis. Envia les fotos que vulguis que hi quedin. | Pega bien hasta F1; el final "que hi quedin" queda colgado. | Con F1 corregida ("Envia'm les fotos que vulguis guardar") funciona. |
| C2 + NO2 + F3 | El dia ja s'ha acabat. Explica-me'l com si algú de casa et truqués ara mateix per preguntar-te com t'ha anat. Comença per un lloc on t'has quedat una estona, i a partir d'aquí ves per on et porti el dia. Les fotos que vulguis guardar, envia-me-les. | La mejor de las cinco: se lee natural. Solo "a partir d'aquí" tras un lugar se lee como "desde ese lugar", que acá suma. | Ninguna. |
