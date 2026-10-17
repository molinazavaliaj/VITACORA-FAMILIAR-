# Kids · «Mi Primer Capítulo» · textos en catalán (de tu)

**Qué es:** todos los textos de Kids que tienen ID en [`banco.md`](../banco.md) y [`mensajes.md`](../mensajes.md), en catalán de Catalunya (normativa IEC) tratando de tu, para nens i nenes de 11 años de Catalunya y sus padres (al padre también de tu; a varios, vosaltres). **Solo textos por ID**: el orden, las ramas, qué vale cada botón, qué foto va pegada a qué pregunta, qué es sensible o sacable y todas las reglas del flujo salen siempre de `banco.md` y `mensajes.md`, que no se tocan. El rioplatense y la versión de España **no cambiaron**: si algo no sonaba en Catalunya, se adaptó solo acá.

**Cómo se hizo:** adaptó Opus el 16/10/2026 a partir de la versión de España ya aprobada por Naza ([`banco-es-ES.md`](banco-es-ES.md)), siguiendo el método del catalán de la entrevista Familiar ([`docs/v3/entrevista/banco-ca.md`](../../../v3/entrevista/banco-ca.md)) y de Viaje ([`docs/viajes-v2/idiomas/banco-ca.md`](../../../viajes-v2/idiomas/banco-ca.md)): adaptación, no traducción literal. Mismo contenido, misma intención, mismo largo, una cosa por mensaje, frases cortas, sin dos puntos, sin «vostè». Las decisiones de referencia de España valen también acá (madre/padre y no mamá/papá, cenar, cole, profe, trastada, ir a por el pan, nueva familia). El bot sigue sin decir que le gusta ni que le alegra nada ni guarda nada «amb afecte» (el «amb molta estima» de la bienvenida es de quien regala, como en el original). Todo lo que cambia una referencia, una costumbre o el sentido respecto de España está en la tabla de abajo; lo que no está ahí se adaptó frase por frase. La revisó otro agente con el método de Familiar (vuelta a ciegas al castellano y corrector, [`revision-ca-2026-10-16.md`](revision-ca-2026-10-16.md)) y la leyó a ciegas Montse, madre de Sabadell con una hija de 11 ([`lectura-catalunya-2026-10-16.md`](lectura-catalunya-2026-10-16.md)). Naza aprobó los arreglos el 16/10 (tanda 10, al final de este archivo).

**Lo que cambia en todo el archivo, sin anotarlo fila por fila:** la lengua entera, claro, y con ella estas decisiones de vocabulario de un nen de 11 en Catalunya. **La escuela es «l'escola»** (es lo que dice cualquier chico en catalán; «el cole» es castellanismo y suena a hablar en castellano). **Quien da clase es «un profe o una profe»** (es lo que dicen a los 11; «mestre/mestra» se entiende pero suena a adulto, igual que «maestro» en España; `profe` está en el DIEC como coloquial). **La trastada es «una trapelleria»** (coloquial, de niño, lo que diría él; «entremaliadura» es más de libro y «malifeta», que usa Familiar para un narrador de 70, suena a falta grave). **Cenar es «sopar»**, el pan se va «a buscar», las zapatillas son «vambes», el móvil es «el mòbil», el dinero son «els diners», la mascota «la mascota», la mochila «la motxilla», el cuaderno «la llibreta», la asignatura «l'assignatura», el tío «el tiet / la tieta», regañar «renyar», enfadado «enfadat», hacer las paces «fer les paus», dar rabia «fer ràbia», pantallazo «una captura de pantalla», pequeño «petit» (de petit, quan eres més petit), mayor (de edad) «gran» (quan siguis gran, de gran), un adulto «un adult», vale «d'acord» cuando habla el bot y «vinga» en los botones del chico (tanda 10), y el acuse de que no pasa nada «no passa res». Los tiempos van como se habla en Catalunya central: lo de hoy o lo que llega hasta hoy en pretérito perfecto («t'ha passat», «has explicat», «t'han explicat»), lo de un día concreto del pasado en perifrástico («va ser», «vas fer», «et vas perdre»).

**Marcas que cambian de forma:** el catalán marca el género con la palabra entera, no con una terminación, así que donde España tiene `pequeñ{{o/a}}` acá va `{{petit/petita}}`, `{{sol/sola}}`, `{{malalt/malalta}}`, `{{amic/amiga}}`, `{{preparat/preparada}}`, `{{vermell/vermella}}`, `{{injust/injusta}}`, `{{trist/trista}}`, `{{enfadat/enfadada}}`, `{{nerviós/nerviosa}}` (misma notación que el catalán de Familiar, `{{nen/nena}}`). Van exactamente en los IDs donde España tiene `{{o/a}}`, salvo K40, que en catalán necesita dos (trist y enfadat). El código tiene que llenar la palabra entera según el género de la compra, como ya hace Familiar V3 en catalán. **Marcas que se mantienen igual:** `{{1}}`, `{{2}}`, `{{3}}` (variables posicionales de las plantillas y mensajes fijos, con el mismo número y el mismo dato que en `mensajes.md`), `{{nombre}}` en los textos del panel. Las plantillas de Meta se cargan aparte, con el mismo nombre y el sufijo `_ca` ([`plantillas-meta-kids-ca.md`](plantillas-meta-kids-ca.md)).

## Notación

Una línea por texto, `ID | text`, como en España y en Viaje. Lo que está debajo de la línea `---` son notas y no se parsea. Los saltos de párrafo de los mensajes largos van escritos como `\n\n`. Los IDs son exactamente los 271 de `banco-es-ES.md` (misma notación: `K12`, `K12-OP`, `K10-FOTO`, `K29-FOTO-NOTENGO`, `K12-R1`, `K12-B1`, `K10-BPASO`, `BOTON-PASO`, `K1-FOTO-B1`, `X1-1`, `B-SEGUIR-B1`, `CAP-1`…).

**Ojo para el código:** igual que en España, el motor hoy compara los botones por su texto literal rioplatense (`motor/botones.ts`, `motor/rafaga.ts`). Acá cambian todos los botones; hay que comparar por posición (B1, B2) o por el texto del idioma activo. `boton.startsWith('Tengo')` en K12 acá sería `startsWith('Tinc')`. Todos los botones tienen 20 caracteres o menos (los más largos son «No hi ha ningú així» y «Sí, una tranquil·la», 19).

## Textos

CAP-1 | Els primers anys
CAP-2 | La meva gent
CAP-3 | El meu món ara
CAP-4 | El que m'ha passat
CAP-5 | Per a quan siguis gran (el sobre tancat)
BOTON-PASO | Passo
ENTRADA-1 | Comencem per quan eres més {{petit/petita}}. Tu explica-ho com et surti.
K1 | Quin és el primer record de la teva vida? El més antic que tinguis, encara que sigui borrós.
K1-OP | I alguna cosa que t'han explicat de quan eres un nadó, encara que tu no te'n recordis?
K1-FOTO | Ensenya'm la teva joguina preferida. Si ja no tens joguines, la cosa que t'estimes més. Per què aquesta?
K1-FOTO-B1 | No en tinc
K2 | Ara una trapelleria, una d'aquelles coses que no havies de fer. Una que vas fer tu i que encara et fa riure quan te'n recordes.
K2-OP | I una trapelleria que va fer un altre i tu la vas veure, d'aquelles coses que no s'havien de fer? Explica'm aquesta.
K2-FOTO | Fes una foto del que hi ha dins de la teva motxilla, tal com està. Què és el més estrany que hi ha?
K2-FOTO-B1 | No en tinc
K3 | Explica'm la millor festa que recordis de quan eres més {{petit/petita}}. Un aniversari, o la que sigui.
K3-OP | I un dia normal que va acabar sent boníssim sense que ningú ho planegés? Explica'm aquest.
K3-FOTO | Ensenya'm el regal més estrany que t'han fet. Qui te'l va fer?
K3-FOTO-B1 | No en tinc
K4 | Pensa en el joc que t'agradava més, el que jugaves sempre. Explica'm l'última vegada que hi vas jugar.
K4-OP | Alguna vegada t'has avorrit tant que t'has inventat un joc? Explica'm aquest.
K4-FOTO | Tens alguna cosa trencada que tot i així no llences? Envia'm una foto i explica'm com es va trencar.
K4-FOTO-B1 | No en tinc
K5 | Quin va ser el pitjor cop que et vas fer de {{petit/petita}}? Explica'm aquell dia.
K5-OP | T'ha quedat alguna marca o cicatriu d'alguna cosa que et va passar? Explica'm d'on va sortir.
K6 | T'has perdut alguna vegada, encara que fos una estoneta? Explica'm què va passar.
K6-OP | I una vegada que vas perdre alguna cosa que t'estimaves molt? Explica-m'ho.
K7 | Quina va ser la primera cosa que et van deixar fer {{sol/sola}}, anar a buscar el pa, per exemple? Explica'm com va anar.
K7-OP | I la primera vegada que et vas quedar {{sol/sola}} a casa, encara que fos una estona? Explica-m'ho.
K8 | Pensa en el lloc de casa teva on passes més temps. Explica'm l'última vegada que t'hi vas quedar una bona estona.
K8-OP | I fora de casa teva, un lloc on vas sempre? Explica'm l'última vegada que hi vas anar.
K8-FOTO | Fes una foto d'aquest lloc, tal com està ara, sense endreçar.
K8-FOTO-B1 | No en tinc
K9 | De què tenies por de {{petit/petita}}? Explica'm una nit que no podies dormir per això.
K9-OP | I una nit que et vas quedar amb el llum encès o amb algú al costat per poder dormir? Explica'm aquesta.
CIERRE-1 | Fins aquí el de quan eres {{petit/petita}}. Ha quedat alguna cosa d'aquella època que no t'he preguntat i vols que surti al llibre?
CIERRE-1-B1 | No, ja està tot
CIERRE-1-B2 | Sí, alguna cosa
ENTRADA-2 | Ara parlem de la gent de la teva vida. La teva família, els teus amics i la gent que t'estimes.
K10 | La teva mare. Explica'm com és, i una vegada que et va cuidar quan estaves {{malalt/malalta}}.
K10-BPASO | Aquesta la passo
K10-OP | I alguna cosa que la teva mare fa sempre i que ningú fa igual?
K10-FOTO | Si tens algun animal a casa, fes-li una foto i envia-me-la. Com va arribar a casa teva? I digues-me com es diu.
K10-FOTO-B1 | No en tinc
K11 | Ara el teu pare. Explica'm com és, i l'última vegada que vau fer alguna cosa tots dos sols.
K11-BPASO | Aquesta la passo
K11-OP | I alguna cosa que el teu pare diu sempre i que tu ja saps de memòria?
K11-FOTO | Fas algun esport? Fes una foto de la roba o del que fas servir per jugar.
K11-FOTO-B1 | No en faig cap
K11-FOTO-B2 | No en tinc
K12 | Ara, els germans.
K12-B1 | Tinc germans
K12-R1 | Explica'm l'última vegada que vas riure molt amb un germà o una germana. I digues-me com es diuen els teus germans, encara que només en tinguis un.
K12-B2 | No tinc germans
K12-R2 | T'hauria agradat tenir un germà o una germana?
K12-R2-2 | I algú que sigui gairebé com un germà o una germana per a tu? Explica'm una vegada junts, i digues-me com es diu.
K12-OP | I alguna cosa teva que un germà o germana t'agafa sense demanar permís? Explica'm l'última vegada.
K12-FOTO | La roba o les vambes que et poses sempre, les que a casa ja volen llençar. Ensenya-me-les.
K12-FOTO-B1 | No en tinc
K13 | Els avis. En veus algun sovint?
K13-B1 | Sí
K13-R1 | Explica'm l'última vegada que vas estar amb algun dels teus avis o de les teves àvies, i digues-me com es diuen.
K13-B2 | No gaire
K13-R2 | Explica'm una vegada amb una persona gran que sigui com un avi o una àvia per a tu, i digues-me com es diu.
K13-OP | I alguna cosa que un avi o una àvia et va ensenyar a fer? Explica'm aquell dia.
K13-FOTO | Busca la foto o la cosa més antiga que hi hagi a casa teva i fes-li una foto. Què en saps?
K13-FOTO-B1 | No en tinc
K14 | Alguna vegada t'han explicat com era la vida quan els teus avis eren petits? Explica'm la història que recordes més.
K14-OP | I un lloc on et van portar i et van dir "aquí hi venia jo quan tenia la teva edat"? Explica'm aquell dia.
K14-FOTO | Ets d'algun equip? Fes una foto d'alguna cosa que tinguis d'aquest equip i explica'm com vas començar a ser d'aquest equip.
K14-FOTO-B1 | De cap
K14-FOTO-B2 | No en tinc
K15 | Explica'm una tarda amb un amic o una amiga en què no te'n volies anar a casa, i digues-me com es diu.
K15-OP | I com et vas fer {{amic/amiga}} del teu millor amic o de la teva millor amiga? Explica'm aquell dia, i digues-me com es diu.
K15-FOTO | Tens un ídol, o uns quants, de l'esport o del que sigui? Envia'm una foto i explica'm què tenen d'especial.
K15-FOTO-B1 | No en tinc
K16 | Tens cosins o cosines?
K16-B1 | Tinc cosins
K16-R1 | Explica'm l'última vegada que us vau trobar, i digues-me com es diuen. Si gairebé no els veus, també val.
K16-B2 | No en tinc
K16-OP | I què feu quan us trobeu? Explica'm l'última.
K17 | Hi ha un tiet o una tieta amb qui tinguis més confiança, si és que en tens? Explica'm alguna cosa que fa aquest tiet o aquesta tieta que ningú més de la família fa, i digues-me com es diu.
K17-OP | I què et diu sempre quan et veu? Explica'm l'última vegada.
K18 | Hi ha algú que ara és de la teva família, però abans no, com la parella de la teva mare o del teu pare, o algú que ha vingut a viure amb vosaltres? Explica'm el dia que us vau conèixer.
K18-B1 | No hi ha ningú així
K18-OP | I el primer dinar o sopar amb algú que ara viu amb tu i abans no?
K19 | Pensa en un adult que no és de la teva família ni de l'escola, però és important per a tu. Explica'm una vegada junts, i digues-me com es diu.
K19-OP | I algú que et cau bé i a casa teva gairebé no el coneixen? Parla'm d'aquesta persona.
K20 | Alguna vegada has necessitat alguna cosa i te l'ha donat algú del barri o algun veí?
K20-B1 | Sí, una vegada
K20-R1 | Explica'm aquella vegada. I si saps com es diu aquesta persona, digues-m'ho.
K20-B2 | No m'ha passat
K20-OP | I algú del barri que et saluda sempre? Explica'm l'última vegada.
CIERRE-2 | Fins aquí la teva família i els teus amics. Ha quedat algú que t'estimes i no t'he preguntat? Parla'm d'aquesta persona.
CIERRE-2-B1 | No, ja està tot
CIERRE-2-B2 | Sí, alguna cosa
ENTRADA-3 | Tercera part. La teva vida avui, tal com és aquest any. L'escola, les teves coses, el que et surt bé.
K21 | Explica'm l'última vegada que alguna cosa et va sortir perfecta, d'aquelles coses que saps fer bé.
K21-OP | I alguna cosa que fa poc t'ha sortit per primera vegada? Explica'm aquell dia.
K21-FOTO | Mires algun youtuber o streamer? Envia'm una captura de pantalla i explica'm per què t'agrada.
K21-FOTO-B1 | No en miro cap
K21-FOTO-B2 | No en tinc
K22 | Ara una del futur. Què vols ser quan siguis gran?
K22-OP | I a quin dels adults que coneixes t'agradaria assemblar-te? Explica'm per què.
K22-FOTO | Quina és la pel·li o la sèrie que has vist més vegades? Posa-la un segon i fes una foto de la pantalla.
K22-FOTO-B1 | No en tinc
K23 | Hi ha un profe o una profe que et caigui bé? Explica'm una vegada que va fer alguna cosa per tu, i digues-me com es diu.
K23-OP | I alguna cosa que un profe o una profe diu sempre i tota la classe ja sap de memòria?
K23-FOTO | Fes una foto de la llibreta de l'assignatura que més t'agrada. Què t'agrada d'aquesta assignatura?
K23-FOTO-B1 | No en tinc
K24 | Què ha estat el millor que t'ha passat aquesta setmana? Explica-m'ho.
K24-OP | I alguna cosa d'aquesta setmana que no t'esperaves? Explica'm què va passar.
K24-FOTO | Quin és el teu menjar preferit? Si avui el menges, fes-li una foto. I si no, explica'm l'última vegada que el vas menjar.
K24-FOTO-B1 | Avui no en menjo
K25 | Ja tens mòbil?
K25-B1 | Sí
K25-R1 | Explica'm el dia que vas tenir mòbil per primera vegada.
K25-B2 | Encara no
K25-R2 | Explica'm l'última vegada que el vas demanar.
K25-OP | I el que més fas en un mòbil, teu o d'una altra persona? Explica'm l'última vegada.
K26 | Quan va ser l'última vegada que et van cridar a sopar i no hi vas anar perquè no podies deixar el que estaves fent?
K26-OP | I a què jugues quan arribes a casa? Explica'm l'última vegada.
K27 | Quina música t'agrada? Quina és la teva cançó preferida del moment?
K27-OP | I una cançó que has escoltat tant que ja te la saps tota?
K28 | A què et fa ràbia perdre de debò? Explica'm l'última vegada que vas perdre en això.
K28-OP | I una vegada que vas guanyar i no t'ho esperaves? Explica'm aquell dia.
K29 | Què és l'últim que et vas comprar amb els teus diners? Explica'm aquell dia.
K29-OP | I alguna cosa que t'agradaria comprar-te i encara no pots? Explica-m'ho.
K29-FOTO | Ensenya'm on guardes els teus diners, encara que sigui un calaix. Des de quan?
K29-FOTO-B1 | No en tinc
K29-FOTO-NOTENGO | D'acord, no passa res. Si alguna vegada has estalviat diners per a alguna cosa, explica-m'ho en un àudio.
K30 | Digues-me alguna cosa que encara no et deixen fer {{sol/sola}} i tu ja et sents {{preparat/preparada}}.
K30-OP | I què va passar l'última vegada que ho vas demanar?
CIERRE-3 | Fins aquí la teva vida d'ara. Ha quedat alguna cosa del teu dia a dia que no t'he preguntat i vols que surti al llibre?
CIERRE-3-B1 | No, ja està tot
CIERRE-3-B2 | Sí, alguna cosa
ENTRADA-4 | Quarta part. Coses que t'han passat. Aquí no hi ha fotos, només expliques tu. I sempre pots passar.
K31 | Ara vull aquella història, la que ja has explicat mil vegades i encara fa riure tothom. Tots en tenim una. Quina és la teva?
K31-OP | I una història teva que expliques diferent cada vegada? Explica'm la versió d'avui.
K32 | Quan va ser l'última vegada que et vas posar {{vermell/vermella}} davant dels altres? Explica'm què va passar.
K32-OP | I alguna cosa que et feia vergonya l'any passat i ara ja no?
K33 | Explica'm una vegada que vas fer alguna cosa bé i ningú se'n va assabentar. Només ho saps tu.
K33-OP | I alguna cosa que et va costar molt i al final et va sortir bé? Explica-m'ho.
K34 | Explica'm una vegada que vas tenir por i ho vas fer igualment.
K34-OP | I una vegada que vas dir que no quan tots deien que sí?
K35 | Pensa en algú que vas ajudar sense que t'ho demanés. Explica'm què va passar.
K35-OP | I una vegada que algú et va ajudar sense que li ho demanessis?
K36 | Alguna vegada t'has barallat de debò amb un amic o una amiga? Explica'm el dia que us vau barallar.
K36-OP | I una vegada que et vas enfadar amb algú i et va passar de seguida? Explica-m'ho.
K37 | T'han donat la culpa alguna vegada d'alguna cosa que no vas fer? Explica'm aquell dia.
K37-OP | I una vegada que vas ser {{injust/injusta}} amb algú? Explica-m'ho.
K38 | Explica'm el dia que alguna cosa va canviar a la teva vida, una mudança per exemple.
K38-B1 | No se m'acut res
K38-OP | I alguna cosa que feies cada dia i de sobte vas deixar de fer? Explica'm l'últim dia.
K39 | A tots ens toca algun dia dolent. Quin va ser el teu? Explica el que vulguis, i el que no, no.
K39-BPASO | Aquesta la passo
K40 | Pensa en l'última vegada que estaves {{trist/trista}} o {{enfadat/enfadada}} i algú et va fer sentir millor. Explica-m'ho, i digues-me qui.
K40-OP | I què fas tu {{sol/sola}} quan estàs malament, perquè et passi? Explica'm l'última vegada.
CIERRE-4 | Fins aquí el que t'ha passat. Ha quedat alguna història teva que no t'he preguntat i vols que surti al llibre?
CIERRE-4-B1 | No, ja està tot
CIERRE-4-B2 | Sí, alguna cosa
ENTRADA-5 | Última part, i és diferent. Aquestes últimes van en un sobre tancat, enganxat al llibre, perquè l'obris quan siguis gran.
K41 | Ja t'ha agradat algú? Sense dir-me qui, explica'm com te'n vas adonar. I si encara no, com t'ho imagines.
K41-BPASO | Aquesta no, gràcies
K41-OP | I què és el que et posa {{nerviós/nerviosa}} d'una altra persona, encara que no sàpigues per què?
K42 | Si algun dia tens un fill o una filla, què faràs igual que t'han criat a tu, i què canviaries?
K42-OP | I quina cosa de casa teva t'agradaria que continués existint quan siguis gran?
K43 | Fes una pregunta a la persona que seràs quan obris el sobre. La que vulguis.
K43-OP | I què li preguntaries que avui no t'atreveixes a preguntar a ningú?
K44 | Què és el que no vols oblidar mai de la teva vida d'ara?
K44-OP | I un lloc d'ara que vulguis recordar quan ho llegeixis?
K45 | Tanca els ulls un segon. Un dia qualsevol de la teva vida de gran. Explica-me'l tal com te l'imagines.
K45-OP | I què és el primer que fas al matí en aquesta vida?
K46 | Aquesta no és una pregunta, és un missatge. El dia que obris el sobre, què vols que el tu de gran llegeixi del tu d'ara? Pren-te el temps que vulguis.
K46-OP | I què creus que pensarà quan llegeixi això?
K47 | L'última. Imagina't que algú no et coneix de res i tens dos minuts perquè sàpiga qui ets. Explica-m'ho.
K47-OP | I què diria de tu un amic o una amiga si li pregunten com ets?
CIERRE-FINAL | Aquestes eren totes les preguntes. Has explicat un munt de coses, i amb tot això es fa el teu llibre. Ha quedat alguna cosa que vulguis dir, del que sigui?
CIERRE-FINAL-B1 | No, ja està tot
CIERRE-FINAL-B2 | Sí, alguna cosa
X1-1 | I alguna cosa que t'han explicat de quan eres un nadó, encara que tu no te'n recordis?
X1-2 | I una trapelleria que va fer un altre i tu la vas veure, d'aquelles coses que no s'havien de fer? Explica'm aquesta.
X1-3 | I un dia normal que va acabar sent boníssim sense que ningú ho planegés? Explica'm aquest.
X1-4 | Alguna vegada t'has avorrit tant que t'has inventat un joc? Explica'm aquest.
X1-5 | I fora de casa teva, un lloc on vas sempre? Explica'm l'última vegada que hi vas anar.
X1-6 | I un lloc on vas anar una sola vegada i vols tornar-hi? Explica'm què hi havia.
X1-7 | Ensenya'm alguna cosa que guardes des de fa anys encara que ningú entengui per què. D'on va sortir?
X2-1 | Explica'm l'última vegada que vas demanar alguna cosa a la teva mare i et va costar demanar-li-ho.
X2-2 | Explica'm l'última vegada que la teva mare et va sorprendre amb alguna cosa.
X2-3 | Explica'm una vegada que vas veure la teva mare enfadada de debò.
X2-4 | Com li dius tu a la teva mare? Explica'm d'on va sortir això.
X2-5 | Explica'm una vegada que el teu pare et va ensenyar alguna cosa que avui fas {{sol/sola}}.
X2-6 | Explica'm l'última vegada que vas fer riure el teu pare de debò, que es va petar de riure.
X2-7 | Explica'm una vegada que vas veure el teu pare enfadat de debò.
X2-8 | Com li dius tu al teu pare? Explica'm d'on va sortir això.
X2-9 | Explica'm una vegada que un germà o germana et va tapar perquè no et renyessin.
X2-10 | Explica'm l'última vegada que vas haver de compartir alguna cosa amb un germà o germana i no volies.
X2-11 | Explica'm una vegada que un amic o una amiga et va defensar davant dels altres.
X3-1 | Explica'm una vegada amb un company o companya d'aquest any que no oblidaràs.
X3-2 | Explica'm una vegada que algú a l'escola et va fer passar un mal moment. Explica el que vulguis, i el que no, no.
X3-3 | Explica'm com va anar dissabte passat, des que et vas llevar fins que te'n vas anar a dormir.
X3-4 | Explica'm com va anar ahir, des que et vas llevar.
X3-5 | Explica'm la primera vegada que vas guanyar diners per alguna cosa que vas fer.
X3-6 | Explica'm una vegada que et vas gastar diners en alguna cosa i després te'n vas penedir.
X4-1 | Explica'm una vegada que et va passar una cosa tan estranya que ningú et va creure.
X4-2 | Explica'm el dia més llarg que has tingut, aquell que semblava que no s'acabava mai.
X4-3 | Explica'm com vau fer les paus després d'aquella baralla, si les vau fer.
X4-4 | Explica'm una vegada que vas demanar perdó i et va costar.
X4-5 | Digues-me una frase que algú et va dir una vegada i que recordes quan estàs malament.
X5-1 | Explica'm com t'imagines la persona amb qui estaràs quan siguis gran, si és que hi ha algú.
X5-2 | Quin nom li posaries a un fill o una filla, avui?
X5-3 | Què és el que més t'agrada de tu, avui?
B-SEGUIR | Aquesta ja està. Seguim amb una altra ara o la deixem per a demà?
B-SEGUIR-B1 | Vinga, una altra
B-SEGUIR-B2 | Demà segueixo
B-MAÑANA | Per avui ja està, demà n'hi ha més.
B-AVISO-SERIA | N'hi ha una altra, però és de les que es pensen amb calma. La fem ara o demà?
B-AVISO-SERIA-B1 | Ara
B-AVISO-SERIA-B2 | Millor demà
B-UNA-MAS | Abans de tancar aquesta part, en vols una més d'aquestes?
B-UNA-MAS-B1 | Vinga, una altra
B-UNA-MAS-B2 | No, tanquem
B-FOTO-NOTENGO | D'acord. Si hi ha alguna cosa així, però no la tens a mà, explica-m'ho en un àudio i també val.
B-FOTO-PLATA | D'acord, no passa res. Si alguna vegada has estalviat diners per a alguna cosa, explica-m'ho en un àudio.
B-PASO | D'acord, aquesta la saltem.
B-NO-PASA-NADA | D'acord, no passa res.
B-DIAFEO-ACUSE-1 | Gràcies per explicar-m'ho. Ho guardem amb cura.
B-DIAFEO-ACUSE-2 | Gràcies per confiar-m'ho. Ja està, ja ho has explicat.
B-TRANQUILA | Si vols, n'hi ha una de més tranquil·la per no acabar el dia així. Tu tries.
B-TRANQUILA-B1 | Sí, una tranquil·la
B-TRANQUILA-B2 | Demà segueixo
BIEN-CHICO | Hola, {{1}}. T'escric perquè {{2}} t'ha fet un regal amb molta estima. Faràs el llibre de la teva vida, i el millor és que no cal escriure res, ho vas explicant amb àudios. Jo soc qui t'anirà fent les preguntes per aquí.\n\nÉs fàcil. T'envio una pregunta i tu em contestes com si ho expliquessis a un amic. No hi ha respostes bones ni dolentes, expliques com et surti.\n\nA vegades et demanaré una foto d'alguna cosa teva, i a vegades veuràs botons per triar. Si una pregunta no t'agrada o no se t'acut res, la passes i seguim.\n\nQuan acabem, tot el que has explicat es converteix en un llibre de debò, amb les teves paraules i les teves fotos. I l'última part va en un sobre tancat, perquè l'obris quan siguis gran.\n\nComencem amb la primera?
BIEN-CHICO-B1 | Vinga, som-hi
BIEN-CHICO-PL | Hola, {{1}}. T'escric perquè {{2}} t'han fet un regal amb molta estima. Faràs el llibre de la teva vida, i el millor és que no cal escriure res, ho vas explicant amb àudios. Jo soc qui t'anirà fent les preguntes per aquí.\n\nÉs fàcil. T'envio una pregunta i tu em contestes com si ho expliquessis a un amic. No hi ha respostes bones ni dolentes, expliques com et surti.\n\nA vegades et demanaré una foto d'alguna cosa teva, i a vegades veuràs botons per triar. Si una pregunta no t'agrada o no se t'acut res, la passes i seguim.\n\nQuan acabem, tot el que has explicat es converteix en un llibre de debò, amb les teves paraules i les teves fotos. I l'última part va en un sobre tancat, perquè l'obris quan siguis gran.\n\nComencem amb la primera?
BIEN-CHICO-PL-B1 | Vinga, som-hi
BIEN-PADRE | Hola, {{1}}. Quin regal més bonic que fas a {{2}}, el seu propi llibre, amb tu al costat mentre l'explica. Les preguntes arribaran a aquest número. T'explico com va perquè tot surti bé.\n\nQuan n'arribi una, busca una estona tranquil·la i asseu-te amb {{2}} al costat. Llegeix-li la pregunta, o passa-li el mòbil perquè la llegeixi.\n\nLa resposta és un àudio, i el grava {{2}} amb les seves paraules. No contestis tu ni li corregeixis res. Si se'n va per les branques o diu alguna cosa que no és com tu ho recordes, això també va al llibre, i és el que el fa seu.\n\nEls botons també els toca {{2}}, per passar una pregunta, dir que no té alguna cosa o demanar-ne una altra. Són part del que explica.\n\nI només et demanem una cosa. Llegeix-ho tot, però no li diguis res fins al llibre. Ni què t'ha semblat ni què t'hauria agradat que digués. Tot queda guardat al teu panell, també el del sobre tancat.\n\nQuan estigueu junts, toca el botó i arriba la primera.
BIEN-PADRE-B1 | Estem a punt
AVISO-PADRE | Hola, {{1}}. Ja hem escrit a {{2}}. Li hem explicat de part de qui és el regal, i quan toqui "Vinga, som-hi" li arribarà la primera pregunta. A partir d'aquí va al seu ritme, almenys una al dia, i més si en té ganes.\n\nTot el que expliqui ho pots veure al teu panell, a {{3}} (àudios, fotos i respostes, també les del sobre tancat).\n\nMentrestant, només t'escrivim si passen quatre dies sense que contesti, perquè li facis una empenteta a casa. A {{2}} no li diem res per tardar. No hi ha renyades ni presses per part nostra.\n\nI només et demanem una cosa. Llegeix-ho tot, però no li diguis res fins al llibre.
ACUSE-1 | L'he escoltat tot, de principi a fi.
ACUSE-2 | Ja ha quedat guardat amb tota la resta, gràcies per enviar-lo.
ACUSE-3 | Això va al llibre, amb les teves paraules.
ACUSE-4 | Ja l'he escoltat, el tinc.
ACUSE-5 | Ja ha quedat guardat, tal com ho has explicat.
ACUSE-6 | T'he escoltat, i ja està ben guardat per al llibre.
ACUSE-7 | Fet, el tinc.
ACUSE-FOTO-1 | Ha arribat la foto, ja està guardada.
ACUSE-FOTO-2 | Aquesta foto la guardo per al llibre.
ACUSE-FOTO-3 | Ja la tinc, gràcies per enviar-la.
PREG-NUEVA-CHICO | Hola, {{1}}, hi ha una pregunta que t'espera. Toca el botó i te l'envio.
PREG-NUEVA-CHICO-B1 | Vinga, envia-me-la
PREG-NUEVA-PADRE | Hola, {{1}}, hi ha una pregunta nova per a {{2}}. Quan estigueu junts i amb una estona tranquil·la, toca el botó i arriba.
PREG-NUEVA-PADRE-B1 | Estem a punt
RECORD-A-4 | Hola, {{1}}. Han passat quatre dies sense resposta de {{2}}, així que t'avisem com havíem quedat. Si pots, fes-li una empenteta a casa, sense pressa. Nosaltres no li diem res per tardar.
RECORD-A-8 | Hola, {{1}}. Han passat vuit dies sense resposta de {{2}}, així que t'avisem com havíem quedat. Si pots, fes-li una empenteta a casa, sense pressa. Nosaltres no li diem res per tardar.
RECORD-B | Hola, {{1}}. Han passat quatre dies sense que contesteu la pregunta pendent, no hi ha cap problema. És només un recordatori, sense pressa. Quan tingueu un moment, asseu-te amb {{2}} al costat i toca el botó per continuar.
RECORD-B-B1 | Estem a punt
RECORD-B-8 | Hola, {{1}}. Han passat vuit dies sense que contesteu la pregunta pendent, no hi ha cap problema. És només un recordatori, sense pressa. Quan tingueu un moment, asseu-te amb {{2}} al costat i toca el botó per continuar.
RECORD-B-8-B1 | Estem a punt
PADRE-PREG-LINEA | Aquesta pregunta te l'envia {{1}}, amb les seves paraules.
PADRE-PREG-LINEA-PL | Aquesta pregunta te l'envien {{1}}, amb les seves paraules.
EXTRAS-OFERTA | M'han quedat algunes preguntes més de tot el que hem anat parlant. Si tens ganes les fem, i si no, ja està, el llibre es fa igual amb tot el que has explicat.
EXTRAS-OFERTA-B1 | Vinga, una altra
EXTRAS-OFERTA-B2 | No, ja està
EXTRAS-SI | Vinga, aquí va la primera.
EXTRAS-OTRA | En vols una altra o ho deixem aquí?
EXTRAS-OTRA-B1 | Vinga, una altra
EXTRAS-OTRA-B2 | Ho deixem aquí
EXTRAS-FIN | Aquesta era l'última que em quedava.
FINAL-CHICO | Bé, {{1}}, ja hem acabat. Ja tinc tot el que has explicat amb els teus àudios i les teves fotos, i ara amb això es fa el llibre, amb les teves paraules. Quan estigui llest te'l donarà {{2}}, que és qui t'ha fet aquest regal. L'última part, la del sobre tancat, va a part, enganxada al llibre, perquè l'obris quan siguis gran. Gràcies per explicar-me tot això. Fins aviat.
FINAL-CHICO-PL | Bé, {{1}}, ja hem acabat. Ja tinc tot el que has explicat amb els teus àudios i les teves fotos, i ara amb això es fa el llibre, amb les teves paraules. Quan estigui llest te'l donaran {{2}}, que són els qui t'han fet aquest regal. L'última part, la del sobre tancat, va a part, enganxada al llibre, perquè l'obris quan siguis gran. Gràcies per explicar-me tot això. Fins aviat.
TERMINO-PADRE | Hola, {{1}}. {{2}} ha acabat d'explicar. Ja tens totes les seves respostes al teu panell, també les del sobre tancat. Ara comencem a preparar el llibre, i t'avisem quan estigui llest. I el mateix que al principi, no li diguis res fins al llibre.
---

## Canvis que no són només de llengua

Solo las filas donde, respecto de la versión de España (`banco-es-ES.md`), cambió algo más que pasar al catalán (una referencia, una costumbre, una palabra que en catalán se dice de otra forma o un giro reformulado). La columna «por qué» va en castellano para que Naza, que no habla catalán, pueda decidir. Lo que no está acá se adaptó frase por frase.

| ID | España (aprobado) | Català | por qué (en castellano) |
|---|---|---|---|
| CAP-1 | De pequeño | Els primers anys | El título del capítulo va al libro y no lleva marca de género en España. En catalán «De petit» sería incorrecto para una nena («De petita»), así que el título se reformula sin género. Si se prefiere mantener «De petit/petita», habría que meter la marca `{{petit/petita}}` en un título de capítulo, cosa que hoy no hace ningún idioma. |
| ENTRADA-1, K3, K5, K7, K7-OP, K9, K10, K14-OP, K15-OP, K30, K32, K37-OP, K40, K40-OP, K41-OP, X2-5, CIERRE-1 | `{{o/a}}` como terminación (pequeñ{{o/a}}, sol{{o/a}}, enferm{{o/a}}…) | `{{petit/petita}}`, `{{sol/sola}}`, `{{malalt/malalta}}`, `{{amic/amiga}}`, `{{preparat/preparada}}`, `{{vermell/vermella}}`, `{{injust/injusta}}`, `{{trist/trista}}`, `{{enfadat/enfadada}}`, `{{nerviós/nerviosa}}` | El catalán cambia la palabra entera según el género (petit/petita, trist/trista), no solo una vocal. Es la misma notación que ya usa Familiar en catalán. K40 lleva dos marcas donde España lleva una («triste» no marca género en castellano, «trist/trista» sí). |
| K1-FOTO, K6-OP, ENTRADA-2, CIERRE-2 | la cosa tuya que más quieres / algo que querías mucho / los que quieres / alguien que quieres | la cosa teva que més t'estimes / alguna cosa que t'estimaves molt / la gent que t'estimes / algú que t'estimes | En catalán «voler» una persona o una cosa es querer tenerla; el cariño es «estimar», también para objetos («m'estimo molt aquest llibre»). |
| K2, K2-OP, X1-2 | una trastada | una trapelleria | Es la palabra coloquial de un chico de 11 en Catalunya; «entremaliadura» es de cuento y «malifeta» (la de Familiar) suena a falta grave para un narrador adulto. Decisión de vocabulario, ver Dudas. |
| K7 | ir a por el pan | anar a buscar el pa | Es la expresión catalana exacta (no existe «anar a per»). |
| K8-FOTO | sin recoger | sense endreçar | «Recollir» en catalán es recoger del suelo; una habitación se «endreça». |
| K12-FOTO | las zapatillas | les vambes | Es como los chicos de Catalunya llaman al calzado deportivo (DIEC: vamba); «sabatilles» son las de estar por casa. |
| K13-R2 | alguien mayor | una persona gran | «Gran» es lo que se dice en catalán para una persona mayor hablándole a un niño; «algú major» no se usa así. Igual que «de gran» para «de mayor». «Una persona gran» y no «algú gran», que una nena puede leer como «alguien alto» (tanda 10). |
| K15-OP, K17 | con la que mejor te llevas / con quien te llevas mejor | el teu millor amic o la teva millor amiga / amb qui tinguis més confiança | «Avenir-se» es correcto pero una nena de 11 no lo dice (lectura de Montse). Cambia un poco la referencia; lo aprobó Naza (tanda 10). |
| K17 | un tío o una tía | un tiet o una tieta | Es la palabra de niño (y de familia) en Catalunya; «oncle» es formal y ningún chico de 11 lo dice. |
| K18-OP | la primera comida | el primer dinar o sopar | «Àpat» es palabra de menú y una nena de 11 no la dice; los niños dicen «dinar» o «sopar» (tanda 10). |
| K21-FOTO, K21-FOTO-B1 | ¿Ves a algún youtuber…? [No veo a ninguno] · un pantallazo · qué tiene que te gusta | Mires algun youtuber…? [No en miro cap] · una captura de pantalla · per què t'agrada | En catalán «mirar» es lo normal para ver vídeos o la tele («mirar la tele»); «veure» suena a toparse con él. El botón pasa de 16 a 14 letras. «Pantallazo» no tiene equivalente catalán; «una captura de pantalla» es lo que se dice (los chicos dicen «captura» o el castellanismo «pantallazo»). |
| K19 | del cole | de l'escola | En catalán se dice «l'escola» a cualquier edad; «el cole» es castellanismo. También en ENTRADA-3, X3-2 y la web. |
| K23, K23-OP | un profe o una profe | un profe o una profe | Igual que en España. Se anota solo porque se descartó «mestre/mestra», que en catalán suena a adulto hablando de la escuela. |
| K23-FOTO | el cuaderno | la llibreta | En Catalunya el cuaderno de clase es «la llibreta»; «quadern» se entiende pero es menos de niño. |
| K26 | te llamaron a cenar | et van cridar a sopar | Igual que en España, la cena (sopar, a las nueve) es el momento en que el chico está enganchado a algo. |
| K28 | te da rabia perder | et fa ràbia perdre | Es la misma expresión en catalán. |
| K34 | lo hiciste de todas formas | ho vas fer igualment | «Igualment» en catalán sí quiere decir «a pesar de eso», sin el doble sentido que tiene «igual» en España. |
| K38-B1 | No se me ocurre | No se m'acut res | En catalán «no se m'acut» a secas queda cojo; con «res» es la frase entera (14 letras). |
| K39 | algún día malo | algun dia dolent | «Mal» como adjetivo pospuesto no existe en catalán; es «dolent». |
| X2-4, X2-8 | ¿Cómo le llamas tú a tu madre? | Com li dius tu a la teva mare? | En catalán el nombre que le pones a alguien es «com li dius» (no «com l'anomenes», que es de diccionario). |
| X2-6 | hiciste reír a tu padre, en serio, a carcajadas | vas fer riure el teu pare de debò, que es va petar de riure | «A riallades» existe pero es de libro; un chico dice «petar-se de riure». Mismo sentido. |
| X2-9 | para que no te regañaran | perquè no et renyessin | «Renyar» es el verbo catalán de la bronca de los padres. |
| X3-3 | hasta que te acostaste | fins que te'n vas anar a dormir | En catalán «ficar-se al llit» o «anar-se'n a dormir» es lo que se dice; «acotxar-se» o «allitar-se» no las dice ningún niño. |
| X4-3 | hicisteis las paces | vau fer les paus | Misma expresión en catalán. |
| CIERRE-1…4, CIERRE-FINAL (botón 2) | Sí, hay algo | Sí, alguna cosa | «Sí, hi ha alguna cosa» tiene 21 letras y no entra en el botón; «Sí, alguna cosa» (15) dice lo mismo. |
| B-SEGUIR-B1, B-UNA-MAS-B1, EXTRAS-OFERTA-B1, EXTRAS-OTRA-B1 | Vale, otra | Vinga, una altra | «D'acord» es de adulto; un niño de 11 pulsa «Vinga» (lectura de Montse, tanda 10). 16 letras. |
| BIEN-CHICO-B1, BIEN-CHICO-PL-B1, AVISO-PADRE (cita) | Vale, vamos | Vinga, som-hi | «Som-hi» es el «vamos» catalán, con «Vinga» de niño (tanda 10). AVISO-PADRE cita el botón en catalán, igual que el panel (KP-ESTADO-ESPERA-A). |
| PREG-NUEVA-CHICO-B1 | Vale, mándamela | Vinga, envia-me-la | 18 letras (tanda 10). |
| B-TRANQUILA-B1 | Vale, una tranquila | Sí, una tranquil·la | «D'acord, una tranquil·la» tiene 24 letras; con «Sí» entra (19). Mismo valor. |
| BIEN-PADRE-B1, PREG-NUEVA-PADRE-B1, RECORD-B-B1, RECORD-B-8-B1 | Estamos listos | Estem a punt | «Estem llestos» marca género y «llest» en catalán es sobre todo «listo de inteligente»; «estar a punt» es «estar listos para empezar». 12 letras. |
| K1-FOTO-B1 y todos los [No tengo] de foto, K16-B2 | No tengo | No en tinc | En catalán hace falta el pronombre «en»; «No tinc» a secas suena a frase cortada. 10 letras. |
| K11-FOTO-B1, K14-FOTO-B1 | No hago ninguno / De ninguno | No en faig cap / De cap | Mismo motivo del pronombre «en». 14 y 6 letras. |
| K24-FOTO-B1 | Hoy no la como | Avui no en menjo | Mismo motivo. 16 letras. |
| K13-B2 | No mucho | No gaire | Es la forma catalana («no gaire», no «no molt»). |
| BIEN-CHICO, BIEN-CHICO-PL | con mucho cariño | amb molta estima | «Carinyo» es castellanismo (no está en el DIEC); «estima» es la palabra. Sigue siendo de quien regala, no del bot. |
| BIEN-CHICO, BIEN-CHICO-PL | Vas a hacer el libro de tu vida | Faràs el llibre de la teva vida | «Vas a fer» es calco del castellano; en catalán el futuro va con futuro simple. |
| BIEN-PADRE | Qué bonito regalo le estás haciendo a {{2}} | Quin regal més bonic que fas a {{2}} | Sin el «li» pleonástico (en catalán normativo no se duplica «li … a {{2}}»); presente porque el regalo se está haciendo ahora. |
| AVISO-PADRE | No hay regañinas ni prisas por nuestra parte. | No hi ha renyades ni presses per part nostra. | «Renyada» es la regañina en catalán. |
| AVISO-PADRE, RECORD-A-4, RECORD-A-8 | un empujoncito | una empenteta | Diminutivo catalán de «empenta». |
| ACUSE-6 | ya está a salvo para el libro | ja està ben guardat per al llibre | «Estar fora de perill» (a salvo) suena a accidente; «ben guardat» es el sentido. |
| ACUSE-7 | Hecho, lo tengo. | Fet, el tinc. | «Fet» es el «hecho / listo» catalán (como en Viaje). |
| EXTRAS-SI | Vale, va la primera. | Vinga, aquí va la primera. | «Va la primera» a secas es calco; con «aquí» se lee natural. «Vinga», como el botón que acaba de pulsar (tanda 10). |
| FINAL-CHICO, FINAL-CHICO-PL | Bueno, {{1}}, hasta aquí hemos llegado. · Nos vemos pronto. | Bé, {{1}}, ja hem acabat. · Fins aviat. | «Fins aquí hem arribat» es calco incorrecto en catalán (tanda 10). «Ens veiem aviat» es calco; la despedida catalana es «fins aviat». Sigue siendo la frase del original (ver Dudas, no promete un plazo). |
| TERMINO-PADRE | Ya están todas sus respuestas en tu panel | Ja tens totes les seves respostes al teu panell | «Ja hi són totes les seves respostes» es forzado; con «tens» se lee natural y dice lo mismo. |
| K46 | ¿qué quieres que lea de ti de ahora? | què vols que el tu de gran llegeixi del tu d'ara? | Una nena de 11 no sabe quién lee; con «el tu de gran» queda dicho. España y rioplatense siguen igual (tanda 10). |

## Textos de la web (compra y panel) con ID en `mensajes.md`

No entran en `banco.json` (el parser solo toma las líneas `ID | text` de arriba), por eso van acá abajo, en una tabla, para cuando se haga la compra y el panel en catalán. Mismas marcas (`{{nombre}}`, `{precio}`). Son los de la tabla de España pasados al catalán; «Su nueva familia» → «La seva nova família», y en el ejemplo del panel «poma» (manzana), como la web (tanda 10). Desde la tanda 10 esta tabla copia los textos de la web (`textos-ca-2026-10-16.md`, columna Català) con los arreglos de los dos informes, salvo «portada» (no «tapa») y «Nom i cognoms», que Naza aprobó acá.

| ID | Elemento | Català |
|---|---|---|
| COMPRA (pasos) | Arriba | 1. Tu · 2. Qui ho explica · 3. Temes i pagament |
| COMPRA-1-TITULO | Título | El llibre de la seva vida, explicat amb àudios. |
| COMPRA-1-BAJADA | Bajada | Li fem preguntes per WhatsApp, respon amb àudios i amb fotos, i tot això es converteix en un llibre de debò. Aquí van les teves dades. |
| COMPRA-1-NOMBRE | Tu nombre | placeholder "Nom i cognoms" |
| COMPRA-1-WA | Tu WhatsApp | placeholder "600 123 456" · ayuda "Aquí t'avisem si cal i quan el llibre estigui llest." |
| COMPRA-1-CORREO | Tu correo | placeholder "tu@exemple.com" · ayuda "Amb aquest entres al teu panell, on veus tot el que explica." |
| COMPRA-2-TITULO | Título | Qui ho explica. |
| COMPRA-2-BAJADA | Bajada | El que necessitem perquè les preguntes li parlin bé i la portada sigui seva. |
| COMPRA-2-NOMBRE | Su nombre | placeholder "Nom i cognoms" · ayuda "Així va a la portada." |
| COMPRA-2-APODO | Cómo le llamáis | placeholder "Com li dieu a casa" · ayuda "Així li diem als missatges." |
| COMPRA-2-GENERO | Chico o chica | Nen · Nena · ayuda "Només perquè les preguntes li parlin bé." |
| COMPRA-2-EDAD | Edad | placeholder "11" · ayuda "Va a la portada, al costat del nom." |
| COMPRA-2-REGALA | Quién se lo regala | La teva mare · El teu pare · Els teus pares · La teva àvia · El teu avi · Els teus avis · Una altra persona (libre, placeholder "La teva tieta, el teu padrí, la teva padrina") · ayuda "Així ho diu el primer missatge. Escriu-ho com ho diries a qui ho rep." |
| COMPRA-2-CANAL-A | Por dónde llegan las preguntas · **Al seu WhatsApp** | "Li escrivim directament i respon quan li vingui de gust. Tu veus tot el que explica des del teu panell." · campo "El seu WhatsApp" · "En triar això, ets tu, com a adult responsable, qui autoritza que escriguem a aquest número." |
| COMPRA-2-CANAL-B | **Ho faig jo** | "Les preguntes arriben al teu WhatsApp. T'asseus al seu costat, les hi llegeixes i respon amb les seves paraules." |
| COMPRA-2-HORA | A qué hora le escribimos | 18:00 por defecto · ayuda "Millor quan torni de l'escola, o quan us pugueu asseure junts." |
| COMPRA-3-TITULO | Título | Temes i pagament. |
| COMPRA-3-BAJADA | Bajada | Hi ha coses que només tu saps si convé tocar. El que marquis aquí no es pregunta, i el llibre es fa igual amb la resta. |
| COMPRA-3-TEMAS | No preguntar sobre | La seva mare · El seu pare · Un avi o una àvia que va morir · La seva nova família (la parella de la mare o del pare, els seus fills) · Una mudança o un canvi gran · Un mal moment a l'escola |
| COMPRA-3-DEBAJO | Debajo de los temas | Tota la resta té un botó per passar. Si una pregunta no li agrada, se la salta i seguim. |
| COMPRA-3-FOTOS | Casilla (apagada) | Hi poden anar fotos amb altres nens · ayuda "Si no la marques, les fotos on surten altres nens queden fora del llibre." |
| COMPRA-3-BOTON | Botón | Pagar {precio} |
| COMPRA-3-DESPUES | Qué pasa después | Després de pagar t'arriba un correu per entrar al teu panell. Si has triat el seu WhatsApp, li escrivim per presentar-nos i a tu t'avisem. Si ho fas tu, el primer missatge arriba al teu WhatsApp i la primera pregunta surt quan estigueu junts. |
| PANEL-GUIA-TITULO | Título | Les teves preguntes per al llibre |
| PANEL-GUIA-1 | Párrafo | Pots afegir fins a tres preguntes teves. Li arriben a {{nombre}} cap al final, entre la quarta part i el sobre tancat. Abans de cadascuna li diem que ve de tu, tret que prefereixis que li arribi com una pregunta més. |
| PANEL-GUIA-2 | Párrafo | Que cada pregunta demani una sola cosa. Si vols saber dues coses, escriu dues preguntes. |
| PANEL-GUIA-3 | Párrafo | Funciona millor demanar-li una vegada concreta que una opinió. "Explica'm la vegada que…" dona molt més que "Què sents?" o "Què penses de…?". |
| PANEL-GUIA-4 | Párrafo | Com totes les altres, {{nombre}} la pot passar si no vol contestar-la. |
| PANEL-GUIA-EJ | Ejemplos | Explica'm el dia que vas aprendre a anar en bici sense rodetes. · Explica'm el dia que et va caure la primera dent, que va ser menjant una poma. · Explica'm la primera nit que vas dormir a casa d'un amic i ens vas trucar a les dues de la matinada. |
| PANEL-GUIA-5 | Párrafo final | Les pots escriure o canviar fins que comenci la quarta part. Després ja no se n'afegeixen. |
| PANEL-CASILLA | Casilla al lado de cada pregunta | Que li arribi com una pregunta més, sense dir que és meva |

Ojo con COMPRA-2-REGALA: los valores de quien regala en catalán empiezan por «La teva / El teu / Els teus», así que `esPlural` (que hoy mira `/^tus\s/`) tiene que mirar también `/^els teus\s/` (o decidir el plural por posición, no por texto). Y en BIEN-CHICO y FINAL-CHICO `{{2}}` cae en medio de la frase en minúscula («perquè la teva mare t'ha fet…»), igual que en España.

## Dudas

1. **Marca de género por palabra entera.** El motor de Kids llena `{{o/a}}` como terminación; el catalán necesita la palabra entera (`{{petit/petita}}`), como ya resuelve Familiar V3 para `banco-ca.json`. Hay que traer ese mecanismo a Kids antes de prender el catalán. En K40 hay dos marcas donde España tiene una.
2. (Resuelta el 16/10: «trapelleria», con la aclaración «una d'aquelles coses que no havies de fer», tanda 10.) **«trapelleria» vs «entremaliadura».** Elegí «trapelleria» (K2, K2-OP, X1-2) porque es lo que diría un nen de 11; «entremaliadura» es más normativo-clásico y lo entiende cualquiera. Que lo confirme la lectura de alguien de Catalunya.
3. **«profe» vs «mestre/mestra».** Elegí «profe» (K23, K23-OP) por coherencia con España y porque es lo que dicen a los 11. A una escuela de Primaria catalana le puede sonar mejor «la mestra»; decisión de Naza con la lectura.
4. **«l'escola» y no «el cole».** Decidido así (ENTRADA-3, K19, X3-2, web). Si la lectura dice que los chicos de 11 en Catalunya dicen «el cole» incluso hablando en catalán, se cambia solo acá.
5. **CAP-1 «Els primers anys».** Reformulado para no marcar género en un título de capítulo (ver tabla). Alternativa: «De {{petit/petita}}» si el código llena marcas en títulos.
6. **Botones por texto literal.** Igual que la duda 1 de España: el motor compara `'Dale, otra'` etc.; acá cambian todos. Comparar por posición o por el texto del idioma activo.
7. **«amb molta estima» en BIEN-CHICO.** Es de quien regala, no del bot (como «con mucho cariño» en el original aprobado). Lo señalo por la regla «el bot no muestra afecto».
8. **«Fins aviat» (FINAL-CHICO).** Es la despedida del original («Nos vemos pronto») en catalán natural; no promete plazo. Si Naza prefiere sacarla, el mensaje termina en «Gràcies per explicar-me tot això.».
9. (Resuelta el 16/10: revisión y lectura de Montse hechas, arreglos aprobados en la tanda 10.) **Falta la revisión del método de Familiar.** Vuelta a ciegas al castellano por otro agente (para cazar calcos), corrector de Softcatalà (LanguageTool, IEC) y lectura de una madre o un padre de Catalunya con un hijo de 11, como se hizo con Marta para España. Hasta eso, estos textos no se prenden.
10. **`esPlural` en catalán.** Ver nota bajo la tabla de la web: los valores de quien regala empiezan por «Els teus», no por «Tus».

## Aprobado por Naza el 16/10/2026 (tanda 10)

Leyó la revisión del método de Familiar ([`revision-ca-2026-10-16.md`](revision-ca-2026-10-16.md)) y la lectura a ciegas de Montse ([`lectura-catalunya-2026-10-16.md`](lectura-catalunya-2026-10-16.md)) y aprobó esto, que ya está aplicado arriba (y en [`plantillas-meta-kids-ca.md`](plantillas-meta-kids-ca.md), cuyos cuerpos siguen siendo idénticos a los del banco):

1. **Todas las propuestas «A» (lengua) de los dos informes que tocan el bot.** De la revisión: A1 «No hi ha respostes bones ni dolentes» (resuelve B5), A4 K31 «i encara fa riure tothom» (B6), A5 X4-5 «Digues-me» (B7), A6 y A7 «et va passar de seguida» / «perquè et passi», A8 FINAL-CHICO «Bé, {{1}}, ja hem acabat.» (B9, «Fins aviat» se queda), A9 «Comencem amb la primera?», «Ara parlem de la gent…», «Ara, els germans.», A11 «Hola, {{1}}» en todos, A12 B-FOTO-NOTENGO «i també val», A13, A16 a A20, A23 a A27, A32 (coma antes de «però»), A33 «Per a quan siguis gran», A34 «per a demà», A35, A36 «li ho» / «demanar-li-ho», y en la tabla de la web A3 «que escriguem» y A28 «dona molt més». De Montse: K18-OP «dinar o sopar», CIERRE-1…4 con «Fins aquí…» y «vols que surti al llibre», K13, K41, K28, K24, K5-OP, K13-R2, K14, K35-OP, X2-1, BIEN-PADRE, K10-FOTO, K4, K1-FOTO, K12-FOTO, y en la tabla de la web COMPRA-2-HORA y COMPRA-2-CANAL-A. La tabla de la web copia ahora la de `textos-ca-2026-10-16.md` donde las dos no coincidían.
2. **Choques entre los dos informes** (se eligió lo que suena natural a un niño de 11, sin dos puntos):
   - BIEN-PADRE: la revisión proponía «Llegeix-la-hi» (normativo) y Montse «Llegeix-li la pregunta». Va la de Montse: nadie dice «la hi» en un WhatsApp, y queda claro qué se lee.
   - CIERRE-1: la revisión, «Això era el de quan eres {{petit/petita}}»; Montse, «Fins aquí el de quan eres {{petit/petita}}». Va la de Montse, que incluye el arreglo de la revisión.
   - CIERRE-3 y CIERRE-4: la revisión, «i vols que vagi al llibre» / «i vols que surti al llibre»; Montse, «i vols que surti al llibre» en los tres. Va «surti» en los tres (CIERRE-1, 3 y 4 dicen lo mismo).
   - K8: la revisión, «on passes més estona»; Montse, «on passes més temps». Va «més temps» porque la frase siguiente ya dice «una bona estona».
   - K35-OP y X2-1: los dos proponían lo mismo («li ho», «demanar-li-ho»).
3. **Botones del niño: «D'acord» → «Vinga».** «Vinga, som-hi» (BIEN-CHICO-B1, BIEN-CHICO-PL-B1), «Vinga, una altra» (B-SEGUIR-B1, B-UNA-MAS-B1, EXTRAS-OFERTA-B1, EXTRAS-OTRA-B1), «Vinga, envia-me-la» (PREG-NUEVA-CHICO-B1), y EXTRAS-SI «Vinga, aquí va la primera.». AVISO-PADRE (y `kids_aviso_padre_ca`) cita «Vinga, som-hi», igual que el panel. «D'acord» queda donde habla el bot (B-NO-PASA-NADA, B-PASO, B-FOTO-NOTENGO, B-FOTO-PLATA, K29-FOTO-NOTENGO).
4. **K14-OP** «aquí hi venia jo quan tenia la teva edat» (la frase la dice el adulto: ya no marca el género del chico). También en rioplatense y en España.
5. **K44-OP** «I un lloc d'ara que vulguis recordar quan ho llegeixis?». También en rioplatense y en España.
6. **CAP-5** «Per a quan siguis gran (el sobre tancat)». También en rioplatense y en España («(el sobre cerrado)»).
7. **K46** «què vols que el tu de gran llegeixi del tu d'ara?». Rioplatense y España, igual que antes.
8. **Más del catalán:** «poma» en el ejemplo del panel, «el teu padrí» en el ejemplo de quien regala, «portada» y no «tapa», K15-OP «del teu millor amic o de la teva millor amiga», K17 «amb qui tinguis més confiança», K2 «Ara una trapelleria, una d'aquelles coses que no havies de fer.», y K2-OP / X1-2 adaptadas «I una trapelleria que va fer un altre i tu la vas veure, d'aquelles coses que no s'havien de fer?» (la hizo otro: va impersonal).

Lo que no entró (no era «A» o era solo de la web, sin tocar): los opcionales de la revisión («Segueixes algun youtuber», K47-OP «si li preguntessin»), «a casa teva» en K8-FOTO, K19-OP y K42-OP (Montse lo marcó con menos peso, sin propuesta), y los textos del panel y del checkout (A10, A29 a A31, KP-LIBRO-CONFIRMAR), que van en la rama de la web.
