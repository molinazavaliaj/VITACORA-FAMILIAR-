# Simulación en catalán: Roser (inventada)

**Qué es:** la entrevista de un narrador **inventado** (Roser), contestada por un agente de IA en personaje, con el código de `fabrica/src/v3/entrevista/` haciendo de WhatsApp (`fabrica/scripts/v3-entrevista-turno.ts`). Diseño: [`../../catala/diseno.md`](../../catala/diseno.md). Narradora inventada; la simulación la contestó un agente en catalán (04/10).

**Cuenta:** 106 preguntas del banco contestadas + 0 de la familia · **145 mensajes de WhatsApp del biógrafo** · terminó con el mensaje final.

Cómo leerlo: cada **Biógrafo** es un mensaje de WhatsApp (las líneas citadas van juntas en ese mensaje); **Narrador** es lo que contestó. Los títulos de bloque y los IDs (entre corchetes) son para el equipo: el narrador no los ve.

**Biógrafo** `[BIEN]`:
> Hola, Roser, com estàs? Una persona que t'estima molt t'ha regalat un llibre amb la història de la teva vida, i jo soc qui t'entrevistarà per fer-lo. Ho farem aquí, per WhatsApp, amb calma.
>
> Funciona així: t'envio una pregunta i tu em respons amb un àudio, com si parléssim en persona. Envia'm tots els àudios que vulguis. Quan acabis no cal que m'avisis: si passen uns minuts sense àudios nous, t'envio la pregunta següent.
>
> Si alguna pregunta no té res a veure amb la teva vida, m'ho dius, o m'expliques el que sí que et va passar a tu. I sense pressa: ho anirem fent al teu ritme.

## Bloque 1 · Origen i arrels

**Biógrafo** `[OR1 + M1]`:
> Comencem per quan vas arribar al món, segons t'han explicat. No el dia en si, sinó l'època: on vivien, a què es dedicaven la teva mare i el teu pare, com t'esperaven. Què saps de com era la seva vida aleshores? Explica-m'ho.
>
> _Si no va amb tu, digues «passo» i en fem una altra._

**Narrador** `[OR1]`: Doncs mira, jo vaig néixer l'any quaranta-vuit a Manresa, al carrer del Born, en un pis petitó que tenia el taller del meu pare just a baix. El meu pare era fuster, el Pere, i treballava de sol a sol fent armaris i portes per a mig barri. La meva mare, la Montserrat, cosia per a fora, tenia la màquina Singer al costat de la finestra i jo me'n recordo del soroll aquell, tac-tac-tac, tot el dia. Eren temps difícils, home, després de la guerra, no sobrava res. Ja tenien el Ramon, el meu germà gran, que em portava cinc anys, i diu que la meva mare volia una nena i va resar molt a la Mare de Déu de Montserrat.

**Biógrafo** `[M3.1 + OR2 + M1]`:
> Gràcies, Roser. Ja ho tinc guardat.
>
> A totes les famílies hi ha una història dels d'abans, dels avis o de més enrere, que s'explicava a les sobretaules: un viatge, una arribada, alguna proesa. Quina en saps, de la teva família? Explica-me-la tal com la vas sentir, amb el nom de qui la va viure.
>
> _Si no va amb tu, digues «passo» i en fem una altra._

**Narrador** `[OR2]`: Home, la que més s'explicava era la de l'avi Isidre, el pare del meu pare. Diu que de jove va baixar a peu des de Berga fins a Manresa amb una caixa d'eines a l'esquena, perquè a casa seva no hi havia feina i eren set germans. Va dormir dues nits en un paller, a Navarcles, i quan va arribar va entrar d'aprenent a una fusteria del carrer de Sobrerroca. I d'allà ve tot, eh, el taller del meu pare, tot. La meva àvia sempre deia que l'avi havia arribat amb les sabates foradades i un pa sec a la butxaca, i nosaltres ens fèiem uns tips de riure perquè cada vegada el pa era més petit.

**Biógrafo** `[M3.2 + OR5 + M1]`:
> Gràcies. Passem a la següent.
>
> Com es van conèixer la teva mare i el teu pare? Segur que a casa ho van contar més d'una vegada: un ball, una casualitat, algú que els va presentar. Explica'm aquell dia tal com te'l van contar.
>
> _Si no va amb tu, digues «passo» i en fem una altra._

**Narrador** `[OR5]`: No me'n recordo.

**Biógrafo** `[M28.1 + OR6]`:
> No passa res, Roser. Passem a una altra.
>
> Per què et van posar Roser? A les cases sempre hi ha una història darrere d'un nom: una discussió, un sant, algú que estimaven molt. Explica'm la que et van contar a tu, encara que sigui curteta.

**Narrador** `[OR6]`: Ai, doncs mira, em van posar Roser per la meva padrina, la tia Roser, que era la germana de la meva mare. Ella no va poder tenir fills i li feia molta il·lusió, i la meva mare li va dir que sí sense preguntar-li ni al meu pare, eh. El meu pare volia que em diguéssim Mercè, per la seva mare, i diu que va estar enfadat tres dies. Però després em deia Roseta i ja està, se li va passar.

**Biógrafo** `[M3.3 + OR6.2]`:
> Ho he apuntat, gràcies. Vinga, una altra.
>
> Tens o has tingut algun sobrenom? Si és així, explica'm com va néixer: qui te'l va posar, per què justament aquest, i si t'agrada. Gairebé sempre hi ha una anècdota al darrere.

**Narrador** `[OR6.2]`: Roseta, el que t'he dit, a casa. I a la fàbrica em deien la Fusteta, perquè era la filla del fuster, i les noies del tint em cridaven així: ei, Fusteta, vine! A mi no m'agradava gens al principi, però després ja m'hi vaig acostumar i fins i tot em feia gràcia. Encara ara alguna de la coral que és de Manresa m'ho diu.

**Biógrafo** `[M26 + CI1 + M31]`:
> Gràcies, Roser.
>
> Fins aquí, la teva família d'abans que arribessis tu. I em pregunto si se m'ha escapat alguna cosa: una història dels teus avis, dels teus pares de joves, d'aquella casa. Si n'hi ha alguna que et ronda pel cap, explica-me-la ara. I si més tard te'n ve alguna, a qualsevol hora, envia-me-la quan vulguis: també anirà al llibre.
>
> _Pots tocar el botó d'aquí sota, o contestar-me amb un àudio com sempre._
>
> [botones: (No, ja està tot)]

**Narrador** `[CI1]`: No, ja està tot.

## Bloque 2 · La casa i la família de la infància

**Biógrafo** `[M25.1 + EN2]`:
> Bé, seguim.
>
> Ara anem a la teva infantesa, Roser: la casa on vas créixer i la gent que hi vivia amb tu.

**Biógrafo** `[CA1]`:
> Explica'm el primer record que tinguis de la casa on vas créixer: un dia, què feies, qui hi havia per allà.

**Narrador** `[CA1]`: No me'n recordo gaire, però tinc una imatge molt clara: jo asseguda a terra al taller del meu pare, amb les encenalls, que feien unes arracades rosses així enrotllades, i jo me les penjava a les orelles. Devia tenir tres o quatre anys. Feia olor de cola i de serradures, aquella olor encara la porto aquí. El meu pare cantava sarsueles mentre serrava i de tant en tant em deia, Roseta, aparta't que et faràs mal. I el Ramon baixava de l'escola i em pispava les arracades.

**Biógrafo** `[M28.4 + CA2]`:
> Amb aquest trosset ja en tinc prou, Roser. Gràcies.
>
> Viatgem una estona a quan eres petita. Presenta'm la teva mare amb el seu nom: com era amb tu en aquella època? Si et ve al cap alguna anècdota amb ella, explica-me-la: on éreu, què va passar.

**Narrador** `[CA2]`: La meva mare es deia Montserrat, Montserrat Vilaró, i era una dona molt seriosa però molt tendra quan no la veia ningú, saps? Treballava tant amb la màquina de cosir que de vegades li sagnaven els dits. Me'n recordo d'un dia, jo tindria set anys, que em va fer un vestit de primera comunió amb la roba d'un vestit de núvia d'una clienta que li havia sobrat, i em va fer provar-lo a les dotze de la nit, damunt d'una cadira, amb agulles per tot arreu. I em deia, quieta, nena, quieta, i plorava una mica, i jo no entenia per què. Ara sí que ho entenc, home.

**Biógrafo** `[M3.5 + CA3]`:
> Ho guardo, Roser. T'envio la següent.
>
> I el teu pare? Digues-me el seu nom i a què es dedicava quan eres petita. Explica'm alguna vegada que el vas acompanyar o el vas veure treballar. I si el teu pare no hi va ser, o prefereixes no entrar-hi, explica'm el que vulguis d'ell.

**Narrador** `[CA3]`: Ja t'ho he explicat abans.

**Biógrafo** `[M25.2 + CA6 + M1]`:
> D'acord, seguim.
>
> Vas tenir germans? Si ja han sortit a la conversa no passa res, en vull saber més: digues-me com es diuen, explica'm amb qui estaves més unida de petita i alguna aventura que féssiu junts; segur que en teniu unes quantes.
>
> _Si no va amb tu, digues «passo» i en fem una altra._
>
> [botones: (Sí, en vaig tenir) (No tinc germans)]

**Narrador** `[CA6]`: [toca: Sí, en vaig tenir]

**Biógrafo** `[M30]`:
> Explica-m'ho, t'escolto.

**Narrador** `[CA6]`: Només el Ramon, que em portava cinc anys. Era un bandarra però em defensava de tothom. Un estiu, jo tindria nou anys, em va portar d'amagat a banyar-nos al Cardener, a sota del Pont Vell, i jo no sabia nedar, i em va agafar per les aixelles tota l'estona. Quan vam tornar xops la mare ens va clavar una bronca que encara la sento. El Ramon va dir que havia estat idea seva i es va quedar sense postres una setmana, i a mi no em van dir res. Es va morir el 2010, d'un infart, i encara el trobo a faltar, mira.

**Biógrafo** `[M3.6 + CA10]`:
> D'acord, gràcies. Fem-ne una altra.
>
> Pensa en les festes i els àpats en família de quan eres petita: un Nadal, un aniversari, un diumenge. Com eren a casa teva? I si en recordes alguna de diferent de les altres, explica-me-la.

**Narrador** `[CA10]`: Per Nadal veníem tots a casa dels avis, a Sant Vicenç de Castellet, i l'àvia Mercè feia escudella i carn d'olla en una olla així de grossa. Fèiem cagar el tió amb el Ramon i els cosins, i el tió només cagava torrons i alguna mandarina, home, que no hi havia per a més. Un Nadal, el del cinquanta-sis crec, va nevar molt i no vam poder tornar a Manresa, i vam dormir tots a la cuina, a terra, amb flassades, i va ser el millor Nadal de la meva vida, ja ho veus.

**Biógrafo** `[M3.7 + CA14]`:
> Queda guardat, Roser. Anem a la següent.
>
> Et va acompanyar algun animal de petita? Una mascota de casa o el gos d'algun veí. Explica'm un record bonic que tinguis amb ell.

**Narrador** `[CA14]`: Passo.

**Biógrafo** `[M21 + CA16]`:
> D'acord, la saltem. Passem a una altra.
>
> Explica'm un dia de petita que esperaves amb moltes ganes: què era, qui hi havia, què va passar.

**Narrador** `[CA16]`: No me'n recordo.

**Biógrafo** `[M33.1]`:
> Està bé, Roser, no cal que sigui un dia concret. Explica'm quines coses esperaves amb ganes en aquella època, encara que només en siguin una o dues. I si no, m'ho dius i passem a una altra.

**Narrador** `[CA16~2]`: Doncs la Festa Major de Manresa, a l'agost, i sobretot la fira de la Llum, al febrer. La meva mare em comprava una bossa de cacauets i anàvem a veure els gegants a la plaça Major. I el dia de Sant Josep, que era el sant del meu pare per la fusteria, que tots els fusters feien festa, i a casa hi havia crema catalana. Això, i quan venia la tia Roser de Barcelona, que sempre portava alguna cosa amagada al bolso.

**Biógrafo** `[M28.5 + CA17]`:
> Amb això ja en tinc prou, gràcies. Passem a una altra.
>
> Hi va haver algun moment difícil de la teva infància que creguis que no pot quedar fora de la teva història? Alguna cosa que et va marcar? Si vols, explica'm què va passar i com ho vas viure.
>
> [botones: (Prefereixo no dir-ho) (No, res d'això)]

**Narrador** `[CA17]`: D'això millor no en parlem. Només et diré que el cinquanta-nou el meu pare va estar molt malalt dels pulmons, per la pols de la fusta, i el taller va estar tancat gairebé un any. La meva mare cosia fins a les tantes i jo, amb onze anys, ja l'ajudava a fer vores.

**Biógrafo** `[M26 + CI2]`:
> Gràcies, Roser.
>
> Abans de deixar enrere la teva infància, em pregunto si m'he deixat alguna cosa. Hi ha alguna història que t'ha vingut al cap mentre m'explicaves i que no ha tingut on encaixar? Explica-me-la ara, tranquil·la, que tenim temps.
>
> [botones: (No, ja està tot)]

**Narrador** `[CI2]`: Bé, una cosa sí: les monges. Vaig anar a les Josefines, a l'escola de monges del carrer Nou, i la germana Assumpta ens feia posar de genolls si parlàvem en català a classe, eh, que era castellà obligatori. Jo una vegada vaig dir 'ai, mare meva' i em va tenir mitja hora de genolls damunt de cigrons. Però em va ensenyar a fer punt de creu, i això encara ho faig.

## Bloque 3 · L'escola i els jocs

**Biógrafo** `[M24.1 + EN3]`:
> Gràcies, Roser. Això també va al llibre.
>
> Seguim amb l'escola: els mestres i els jocs d'aquella edat.

**Biógrafo** `[ES1]`:
> Com va ser el teu primer dia d'escola? Qui et va acompanyar fins a la porta, i què vas sentir quan se'n va anar? Si aquell dia no el recordes, explica'm el primer que recordis de l'escola.

**Narrador** `[ES1]`: No me acuerdo, la verdad.

**Biógrafo** `[M28.1 + ES2]`:
> No passa res, Roser. Passem a una altra.
>
> Vas tenir una mestra o un mestre que et va marcar a l'escola? Com es deia? Com era amb vosaltres? Explica'm una vegada amb aquella persona que no oblides: què va passar a classe aquell dia.

**Narrador** `[ES2]`: Home, la germana Assumpta, la dels cigrons, ja t'he dit, però la que em va marcar de veritat va ser la senyoreta Dolors, que venia els dissabtes a fer-nos música. Era jove, portava pantalons, que les monges es posaven malaltes, i ens va ensenyar a cantar a veus. Un dia em va fer cantar sola el Rossinyol davant de tota la classe i jo tremolava, i quan vaig acabar em va dir: Roser, tu tens veu de contralt, no la perdis mai. I mira, encara canto a la coral.

**Biógrafo** `[M3.8 + ES5]`:
> T'he escoltat amb atenció. Continuem.
>
> De petita, tenies un millor amic o una millor amiga, de l'escola o del barri? Digues-me qui era, amb el seu nom, i què fèieu quan anàveu junts. I explica'm una tarda amb aquella persona que encara et fa somriure.

**Narrador** `[ES5]`: La Pilar Comas, la del forn de la cantonada. Érem com germanes, mira. Anàvem a jugar a la Seu, a les escales de la Seu, i fèiem saltar a corda i a fet i amagar. Una tarda vam pujar d'amagat fins al campanar perquè el sagristà s'havia deixat la porta oberta, i quan vam ser a dalt van tocar les campanes de les sis, i ens vam quedar sordes una hora, i ens vam pixar de riure, la veritat. La Pilar va morir fa dos anys, a Igualada.

**Biógrafo** `[M3.1 + ES6]`:
> Gràcies, Roser. Ja ho tinc guardat.
>
> Quina va ser la malifeta més grossa que vas fer de petita, a l'escola o al barri? Aquella que encara et fa riure, o una mica de vergonya. Explica'm com va ser i si et van enxampar. I si te'n venen més, explica-les també.

**Narrador** `[ES6]`: Ai, la del campanar que t'acabo d'explicar, aquesta va ser grossa, però n'hi ha una altra. Una vegada vaig agafar un pot de vernís del taller del meu pare i li vaig pintar les sabates de diumenge a la germana Assumpta, que les deixava a l'entrada per posar-se les espardenyes. Es van quedar enganxades a terra, home. No em van enxampar mai, mai, i això no ho sabia ni la meva mare. Ara ja ho saps tu.

**Biógrafo** `[M3.2 + ES7]`:
> Gràcies. Passem a la següent.
>
> Què volies ser de gran? D'on et va venir aquella idea: algú que veies, alguna cosa que va passar? Si recordes el moment en què ho vas decidir, o qui t'ho va ficar al cap, explica-m'ho.

**Narrador** `[ES7]`: Jo volia ser cantant, de les de ràdio, com la Gelu o la Lola Flores, fixa't. Ho vaig decidir després del que em va dir la senyoreta Dolors. Però és clar, a casa no hi havia diners i a catorze anys ja em van posar a treballar a la fàbrica, i allò de cantar es va quedar per a les festes i per a la cuina. La meva mare deia: nena, cantar no dóna pa.

**Biógrafo** `[M3.3 + ES8]`:
> Ho he apuntat, gràcies. Vinga, una altra.
>
> Com eren els teus estius de petita? La calor, els dies llargs, el que es feia a casa teva aquells mesos. Explica-m'ho.

**Narrador** `[ES8]`: Els estius, doncs, molta calor a Manresa, que allà fa una calor que t'ofegues. Les finestres obertes, els veïns a la fresca al carrer amb les cadires de boga fins a les dotze. Al juliol anàvem quinze dies a casa dels avis a Sant Vicenç, i allà hi havia hort i figueres, i jo i el Ramon menjàvem figues fins que ens feia mal la panxa. L'avi ens feia regar amb la regadora i ens donava una pesseta. D'allà em ve, això de l'hort, segur.

**Biógrafo** `[M3.4 + ES9]`:
> Gràcies per explicar-m'ho. Seguim.
>
> La religió era present a casa teva quan eres petita? Si va ser així, hi va haver alguna cerimònia o alguna festa que et toqués de prop? Explica'm aquell dia: on va ser, amb qui eres.

**Narrador** `[ES9]`: Home, i tant, amb les monges i la meva mare que anava a missa cada diumenge. La primera comunió, amb el vestit aquell que t'he dit que em va cosir la mare. Va ser a la Seu, el maig del cinquanta-sis, i després vam fer xocolata amb melindros a casa, amb els avis i la tia Roser. El meu pare, que no era gaire de capellans, es va posar corbata i tot, i va fer una foto amb una màquina que li havien deixat. Aquella foto encara la tinc a la tauleta de nit.

**Biógrafo** `[M26 + CI3]`:
> Gràcies, Roser.
>
> Fins aquí, l'escola. T'ha quedat alguna història d'aquells anys que no t'he preguntat? Pot ser de l'escola o dels estudis que vas fer després. Si n'hi ha alguna, explica-me-la ara, amb calma. Si no, toca el botó.
>
> [botones: (No, ja està tot)]

**Narrador** `[CI3]`: [toca: No, ja està tot]

## Bloque 4 · Adolescència

**Biógrafo** `[M25.3 + EN4]`:
> Bé, doncs.
>
> Ara anem a la teva adolescència: aquells anys en què deixes de ser nena, però encara no ets gran.

**Biógrafo** `[AD2]`:
> Després de l'escola primària, on passaves els dies als tretze o catorze anys? Com hi vas arribar? Explica'm una vegada d'aquells anys que se t'hagi quedat gravada.

**Narrador** `[AD2]`: Als catorze ja era a la fàbrica de la Bauma, a Castellbell, la de teixits de cotó. M'hi va col·locar una veïna, la senyora Rita, que era encarregada a les bobines. Agafàvem el tren a les cinc del matí a l'estació del Nord de Manresa amb una carmanyola, i el primer dia vaig plorar perquè el soroll dels telers era tan fort que no em sentia ni jo. Les noies grans em van posar cotó a les orelles i em van dir, això és així, nena, t'hi acostumaràs. Cobrava setanta pessetes a la setmana i les donava totes a la mare.

**Biógrafo** `[M3.6 + AD3]`:
> D'acord, gràcies. Fem-ne una altra.
>
> Tenies una colla d'amics als quinze, setze anys? Com eren, què fèieu quan us trobàveu? Explica'm una nit o una sortida amb ells que encara recordis. És una edat que queda marcada: si te'n venen més històries, explica-les totes.

**Narrador** `[AD3]`: Sí, érem les noies de la fàbrica, la Pilar, la Teresina, la Glòria i jo, i els diumenges anàvem al ball del Casino o al cine Kursaal. Una nit de Festa Major, el seixanta-quatre, vam anar a la verbena de Sant Joan a la Bauma mateix i vam perdre l'últim tren, i vam haver de tornar caminant per la carretera fins a Manresa, de nit, amb les sabates a la mà. Vam arribar a les quatre i el meu pare era a la porta esperant-me amb una cara... no em va deixar sortir en un mes. Però va valer la pena, eh.

**Biógrafo** `[M3.7 + AD5]`:
> Queda guardat, Roser. Anem a la següent.
>
> Te'n recordes de la primera vegada que vas sortir de nit, a un ball o a una festa? Explica'm com et vas arreglar, amb qui hi vas anar i com va anar aquella nit.

**Narrador** `[AD5]`: Home, ja t'he dit la del tren, però la primera de totes va ser al Casino, als quinze. Em vaig posar un vestit blau cel que em va fer la mare, i la Teresina em va pintar els llavis d'amagat al lavabo, que si el meu pare ho veu em mata. Vaig ballar un pasdoble amb un noi de Sallent que em trepitjava, i jo tota l'estona mirant el rellotge perquè havia de ser a casa a les deu.

**Biógrafo** `[M3.8 + AD6]`:
> T'he escoltat amb atenció. Continuem.
>
> En aquells anys, quan va ser la primera vegada que algú et va agradar de veritat? Explica'm com us vau conèixer, com es deia, com era aquella persona, i un moment de tots dos que encara guardes.

**Narrador** `[AD6]`: Abans del Josep hi va haver un tal Quim, un noi de l'Ateneu que tocava la guitarra, però això va ser poca cosa, quatre passejos pel Passeig de Pere III. El de veritat va ser el Josep. El vaig conèixer el seixanta-set a Sabadell, a la boda d'una cosina, la Núria. Ell era mecànic en un taller de la Creu Alta, alt, amb un bigotet, i em va treure a ballar i em va dir que tenia la veu més bonica de la boda perquè jo estava cantant amb les tietes. Em va escriure cartes cada setmana durant dos anys, de Sabadell a Manresa. Encara les tinc totes en una capsa de galetes.

**Biógrafo** `[M3.1 + AD12]`:
> Gràcies, Roser. Ja ho tinc guardat.
>
> Quan vas sentir per primera vegada que ja no eres petita? Alguna cosa que vas haver de decidir o fer pel teu compte, una responsabilitat nova. Explica'm aquell moment.

**Narrador** `[AD12]`: Doncs quan el meu pare va estar malalt i jo portava el sobre de la paga a casa, i un dia la mare em va dir: Roser, aquest mes amb el teu sou paguem el lloguer. Tenia quinze anys. Vaig anar jo sola a casa del propietari, el senyor Casals, a pagar-li, amb els diners embolicats amb un mocador, i em va fer firmar un paper. Vaig sortir d'allà sentint-me una dona feta, mira.

**Biógrafo** `[M26 + AD15]`:
> Gràcies, Roser.
>
> Hi va haver algun moment dur a la teva adolescència que creguis que no pot quedar fora de la teva història? Alguna cosa que et va marcar? Si vols, explica'm què va passar i com ho vas viure. Si ja me l'has explicat, digues-m'ho, i si vols remarcar alguna cosa, és el moment.
>
> [botones: (Prefereixo no dir-ho) (No, res d'això)]

**Narrador** `[AD15]`: [toca: No, res d'això]

**Biógrafo** `[M25.1 + CI4]`:
> Bé, seguim.
>
> Fins aquí, la teva adolescència. Abans de passar a la teva joventut, ha quedat alguna cosa d'aquella època que no ha trobat la seva pregunta? Un record solt, una cara, una nit. Explica-m'ho ara, tranquil·la, que tenim temps.
>
> [botones: (No, ja està tot)]

**Narrador** `[CI4]`: [toca: No, ja està tot]

## Bloque 5 · Joventut

**Biógrafo** `[M25.3 + EN5]`:
> Bé, doncs.
>
> Passem a la teva joventut, Roser: quan vas començar a fer la teva pròpia vida.

**Biógrafo** `[JU1]`:
> Te'n recordes del dia que vas marxar de casa dels teus pares? On vas anar, amb qui, com va ser aquell comiat. I si t'hi vas quedar molts anys, explica'm com era aquella casa amb tu ja de gran.

**Narrador** `[JU1]`: Doncs vaig marxar quan em vaig casar, l'abril del setanta, que abans no es marxava de casa, home. Ens vam casar a la Seu de Manresa i després vam anar a viure a Sabadell, a un pis de lloguer al carrer de Sant Isidre, a la Creu Alta, a prop del taller del Josep. El comiat va ser al portal: la meva mare em va donar una capsa amb tovalloles brodades per ella i no va dir res, i el meu pare em va abraçar tan fort que em va trencar una agulla del monyo. Vaig plorar fins a Terrassa.

**Biógrafo** `[M3.3 + JU2]`:
> Ho he apuntat, gràcies. Vinga, una altra.
>
> Què vas fer quan vas deixar l'escola o l'institut? Si vas continuar estudiant, explica'm què i com van ser aquells anys; si la vida et va portar cap a un altre lloc, explica'm què feies. I explica'm un dia d'aquella època que se t'hagi quedat gravat.

**Narrador** `[JU2]`: Ja t'he dit que vaig anar a la fàbrica als catorze. Hi vaig estar fins als vint, i després vaig entrar a la botiga de teles Can Soler, a la plaça de Sant Domènec de Manresa, que era una feina més fina, eh, amb bata i tot. Me'n recordo d'un dia que va entrar la senyora del notari i va voler vint metres de setí per a unes cortines, i jo tallant amb unes estisores enormes i em tremolava el pols perquè si m'equivocava m'ho descomptaven del sou. Ho vaig tallar recte com una regla i el senyor Soler em va dir: Roser, d'avui en endavant les teles cares les talles tu.

**Biógrafo** `[M3.4 + JU4]`:
> Gràcies per explicar-m'ho. Seguim.
>
> Com vas aprendre allò que saps fer millor, el que més t'ocupa o més t'agrada, sigui la teva feina o alguna cosa que fas per gust? Explica'm com van ser els inicis: un dia dels primers temps.

**Narrador** `[JU4]`: El que més m'agrada és cantar, i això ho vaig aprendre de veritat quan ja era gran. L'any noranta-vuit, quan els nens ja eren grans, una veïna, la Carme, em va portar a la coral Can Roqueta de Sabadell. El primer assaig vaig estar tota l'estona callada a la fila de darrere, i el director, el senyor Bertran, em va fer cantar sola una frase de l'Ave Maria i va dir: aquí tenim una contralt. Igual que la senyoreta Dolors, fixa't, quaranta anys després. Vaig arribar a casa i li vaig dir al Josep i es va posar a riure, que ja t'ho deia jo, Roseta.

**Biógrafo** `[M3.5 + JU5]`:
> Ho guardo, Roser. T'envio la següent.
>
> Vas tenir alguna experiència amb el món militar: la mili, una escola militar? O alguna època de disciplina dura, a casa, en una escola, en una feina? Explica'm com era i alguna vegada que encara recordis.

**Narrador** `[JU5]`: La mili no, home, això era cosa d'homes. El Josep sí que la va fer, a Melilla, divuit mesos, i em deia que l'únic bo que en va treure va ser aprendre a arreglar camions. Disciplina dura la de les monges, que ja t'ho he explicat, i la de la fàbrica, que si arribaves tard dos minuts t'ho treien de la setmana.

**Biógrafo** `[M3.6 + JU8 + M1]`:
> D'acord, gràcies. Fem-ne una altra.
>
> Te'n vas anar mai a viure a una altra ciutat o a un altre país? Potser ja m'has explicat alguna cosa d'aquella mudança; ara explica'm l'arribada: el primer dia, on vas dormir aquella nit, qui t'esperava i què et va costar més.
>
> _Si no va amb tu, digues «passo» i en fem una altra._
>
> [botones: (Sí, em vaig mudar) (No, mai m'he mudat)]

**Narrador** `[JU8]`: [toca: No, mai m'he mudat]

**Biógrafo** `[M25.3 + JU12]`:
> Bé, doncs.
>
> Parla'm del primer lloc que va ser teu, on ja vivies pel teu compte. Potser ja me l'has anomenat; ara explica-me'l per dins: com era, amb què el vas anar arreglant, què es veia per la finestra. I aquella primera nit allà, com va ser? Si no vas marxar mai de casa dels teus pares, explica'm el dia que aquella casa va passar a ser teva, o el racó que sempre va ser teu.

**Narrador** `[JU12]`: El pis del carrer de Sant Isidre, un tercer sense ascensor, petit, amb una galeria que donava als terrats i a la xemeneia de la fàbrica Ricart. El Josep va fer els mobles de la cuina amb fusta que li va enviar el meu pare des de Manresa, i jo vaig fer les cortines amb retalls de Can Soler. La primera nit no teníem ni llum perquè no ens l'havien connectat i vam sopar pa amb tomàquet amb una espelma, asseguts a terra, i el Josep va dir: Roseta, això és un palau. Hi vam viure vint anys, en aquell pis.

**Biógrafo** `[M3.7 + JU13]`:
> Queda guardat, Roser. Anem a la següent.
>
> Vas fer alguna bogeria de jove? Un viatge en autoestop, una aposta, alguna cosa que avui no faries. Explica'm aquella vegada des del principi, amb tot el que va passar.

**Narrador** `[JU13]`: Ai, sí. L'estiu del seixanta-nou, abans de casar-nos, el Josep es va presentar a Manresa amb una Vespa que li havia deixat un client i em va dir, puja, que anem a veure el mar. I jo, sense dir res a casa, vaig pujar. Vam anar fins a Sitges, amb la faldilla lligada amb un nus perquè no se m'aixequés, i vam tornar a les onze de la nit, cremats com dues gambes. La meva mare no em va parlar en una setmana. Avui no ho faria per res del món, però va ser el dia més feliç de la meva joventut.

**Biógrafo** `[M3.8 + JU15]`:
> T'he escoltat amb atenció. Continuem.
>
> I els amics d'aquells anys, de quan començaves a fer la teva vida? Com eren, on us trobàveu, què fèieu. Explica'm una vegada amb ells que se t'hagi quedat. I si te'n venen més, explica-les també.

**Narrador** `[JU15]`: A Sabadell al principi no coneixia ningú, i els amics eren els del Josep, els del taller. Sobretot el Paco i la seva dona, l'Encarna, que eren de Jaén, i amb ells fèiem paelles els diumenges a la Salut, al bosc de Can Feu. Una vegada el Paco va voler fer la paella amb una branca d'alzina verda i vam acabar tots plens de fum, plorant, i la paella cremada, i vam acabar menjant entrepans de truita. L'Encarna em va ensenyar a fer gaspatxo i jo a ella el pa amb tomàquet com cal, home.

**Biógrafo** `[M26 + JU17]`:
> Gràcies, Roser.
>
> Hi va haver algun moment dur en aquells anys de començar la teva vida que creguis que no pot quedar fora de la teva història? Alguna cosa que et va marcar? Si vols, explica'm què va passar i com ho vas viure. Si ja me l'has explicat, digues-m'ho, i si vols remarcar alguna cosa, és el moment.
>
> [botones: (Prefereixo no dir-ho) (No, res d'això)]

**Narrador** `[JU17]`: [toca: Prefereixo no dir-ho]

**Biógrafo** `[M27.1 + JU20]`:
> Està bé, Roser. Ho deixem aquí.
>
> T'has mudat moltes vegades a la teva vida? Explica'm per quines cases o llocs has anat passant, més o menys en quins anys, i quina d'aquestes mudances se t'ha quedat més gravada.

**Narrador** `[JU20]`: Home, ja t'he dit que no gaire. De Manresa a Sabadell quan em vaig casar, el pis de Sant Isidre vint anys, i el noranta ens vam comprar un pis a la Rambla, més gran, amb ascensor, on van créixer els nens. I quan el Josep es va morir, el 2016, no, el 2015, vaig vendre aquell pis perquè era massa gran per a mi sola i em vaig posar en un pis petit al carrer de Gràcia, a dues cantonades de la Marta. La que més em va costar va ser l'última, deixar les coses del Josep.

**Biógrafo** `[M26 + CI5]`:
> Gràcies, Roser.
>
> I així arribem al final de la teva joventut, els anys en què vas començar a fer la teva vida. Abans de continuar, t'ha quedat alguna cosa d'aquella època per explicar? Un lloc, una persona, una tarda que de tant en tant et torna. Explica-m'ho ara, amb calma.
>
> [botones: (No, ja està tot)]

**Narrador** `[CI5]`: Només una cosa: les cartes del Josep. Cada dijous arribava una carta a Manresa, i el carter, el senyor Vidal, ja ho sabia i me la donava a mi en mà, no a la mare. Una vegada en lloc de carta hi havia una flor premsada, una rosella, i només posava: Roseta, d'aquí a un any. I va complir.

## Bloque 6 · Amor i parella

**Biógrafo** `[M24.2 + AM0 + M1]`:
> Apuntat, gràcies. Queda guardat amb la resta.
>
> Ara parlem de l'amor. Hi ha hagut algú amb qui hagis tingut una història de debò? Si n'hi ha hagut, fes-me un repàs curt: quantes vegades t'has enamorat, quines van arribar a ser una cosa seriosa, més o menys en quins anys, i si avui hi ha algú al teu costat. Després et preguntaré més coses de la parella d'ara, o de l'última, i també hi haurà lloc per a les d'abans. I si no n'hi ha hagut, també està bé.
>
> _Si no va amb tu, digues «passo» i en fem una altra._
>
> [botones: (Sí, n'hi ha hagut) (No n'hi ha hagut)]

**Narrador** `[AM0]`: [toca: Sí, n'hi ha hagut]

**Biógrafo** `[M30]`:
> Explica-m'ho, t'escolto.

**Narrador** `[AM0]`: Doncs mira, de debò només el Josep. El Quim de l'Ateneu, als disset, va ser una tonteria. El Josep el vaig conèixer el seixanta-set, ens vam casar el setanta i vam estar junts fins que es va morir, el 2015, quaranta-cinc anys. Ara no hi ha ningú, ni n'hi haurà, home, a la meva edat. Tinc la coral, l'hort i els nets, i ja en tinc prou.

**Biógrafo** `[M3.3 + AMH]`:
> Ho he apuntat, gràcies. Vinga, una altra.
>
> Parlem de la parella d'ara, o de l'última si avui no hi ha ningú. Ara mateix tens parella?
>
> [botones: (Sí, tinc parella) (No tinc parella)]

**Narrador** `[AMH]`: [toca: No tinc parella]

**Biógrafo** `[M26 + AM1]`:
> Gràcies, Roser.
>
> Comencem pel seu nom. I explica'm el dia que us vau conèixer: on va ser, qui us va presentar o com us vau trobar, i què va ser el primer que et va cridar l'atenció d'aquella persona. Si ja m'ho has explicat, digues-m'ho, i si vols remarcar alguna cosa, és el moment.

**Narrador** `[AM1]`: Josep, Josep Puig i Ferrer. Ja t'ho he explicat, a la boda de la cosina Núria a Sabadell. El que vull remarcar és que el primer que em va cridar l'atenció van ser les mans, unes mans negres de greix que no se li treien mai per més que es rentés, i em va fer vergonya donar-li la mà, i després aquelles mans van ser el que més vaig estimar d'ell.

**Biógrafo** `[M3.4 + AM3]`:
> Gràcies per explicar-m'ho. Seguim.
>
> I després, vau arribar a fer vida plegats: casar-vos, anar a viure junts, el que fos? Si hi vau arribar, explica'm aquell moment: qui ho va dir primer, o si va anar sortint sol, on éreu, què us vau dir. Si ja m'ho has explicat, digues-m'ho, i si vols remarcar alguna cosa, és el moment.
>
> [botones: (Sí) (No hi vam arribar)]

**Narrador** `[AM3]`: [toca: Sí]

**Biógrafo** `[M30]`:
> Explica-m'ho, t'escolto.

**Narrador** `[AM3]`: Ens vam casar, ja t'ho he dit, l'abril del setanta a la Seu. Ho va dir ell, a la tornada de Sitges amb la Vespa, parats a una benzinera de Martorell, amb la cara vermella del sol: Roseta, o ens casem o em moro. Així, de sobte. I jo li vaig dir que primer ho havia de demanar al meu pare. I va venir el diumenge següent amb americana i corbata, suant, i el meu pare el va tenir mitja hora parlant de fustes i de motors abans de dir-li que sí.

**Biógrafo** `[M3.5 + AM4]`:
> Ho guardo, Roser. T'envio la següent.
>
> Hi ha dies que queden gravats per sempre: el del casament, o el primer vivint plegats. Explica'm aquell dia com si l'estiguessis veient: el lloc, la gent, la roba, el que més se t'ha quedat gravat. Si ja m'ho has explicat, digues-m'ho, i si vols remarcar alguna cosa, és el moment.

**Narrador** `[AM4]`: El dia del casament plovia a bots i barrals, i la meva mare deia que núvia mullada, núvia afortunada. El vestit me'l va fer ella, és clar, amb setí de Can Soler que el senyor Soler em va regalar. A la Seu érem unes seixanta persones, i el dinar va ser a la fonda Sant Antoni, canelons i pollastre. El que més se m'ha quedat és que el Ramon, el meu germà, va fer un discurs i es va posar a plorar a la segona frase i no el va poder acabar, i tothom aplaudint igual. I el Josep va cantar, ell que cantava fatal, el Rossinyol, per mi.

**Biógrafo** `[M3.6 + AM13]`:
> D'acord, gràcies. Fem-ne una altra.
>
> Explica'm una baralla que vau tenir, d'aquelles que després fan riure: per què va ser, qui va cedir primer i com vau fer les paus. Si no n'hi va haver cap que avui faci riure, n'hi ha prou que m'ho diguis.

**Narrador** `[AM13]`: Ui, la del Barça. El Josep era del Sabadell, del Centre d'Esports, i jo del Barça per la família, i un diumenge del setanta-quatre que jugaven l'un contra l'altre ell va penjar una bandera arlequinada al balcó i jo la vaig despenjar i la vaig posar a rentar amb lleixiu. Va quedar rosa. Ell no em va parlar dos dies, i al tercer es va presentar amb una bandera del Barça que havia comprat a la Rambla i la va penjar ell mateix. I va dir: a veure si així em deixes en pau, i vam riure tant que la vam deixar penjada un mes.

**Biógrafo** `[M3.7 + AM8]`:
> Queda guardat, Roser. Anem a la següent.
>
> Imagina't que només pots guardar un moment amb aquella persona: quin seria? Explica-me'l sencer: el lloc, el dia, què fèieu. Si te'n venen d'altres al cap, explica'ls també.

**Narrador** `[AM8]`: Un vespre d'estiu, el 2012 potser, a l'hort que teníem a Can Deu. Ell ja estava una mica cansat del cor però encara venia. Estàvem asseguts a les cadiretes plegables, havíem collit tomàquets, i ell em va agafar la mà amb aquelles mans negres i em va dir: Roseta, si ho tornés a fer, ho tornaria a fer igual, fins i tot la bandera rosa. I vam estar callats veient pondre el sol darrere de Sant Llorenç. No vam dir res més. No calia.

**Biógrafo** `[M26 + AM9 + M1]`:
> Gràcies, Roser.
>
> Si vols, explica'm com va arribar el final d'aquella història: una separació, un comiat, el que fos. Només el que tu vulguis, i fins on vulguis. Si prefereixes no entrar-hi, n'hi ha prou amb el botó; la resta de la teva història continua igual.
>
> _Si no va amb tu, digues «passo» i en fem una altra._
>
> [botones: (Prefereixo no dir-ho)]

**Narrador** `[AM9]`: Va ser el cor. Ja feia anys que en patia. El novembre del 2015 es va trobar malament un diumenge al matí, després d'esmorzar, i el vam portar al Parc Taulí, i va estar quatre dies ingressat. L'últim vespre la Marta i el Jordi hi eren, i ell els va dir que cuidessin la mare, i a mi em va dir, fluixet, que li cantés alguna cosa. Li vaig cantar el Rossinyol, a cau d'orella, i es va adormir. Ja no es va despertar. Jo no he pogut cantar aquesta cançó mai més, a la coral quan la fan jo callo.

**Biógrafo** `[M4.1]`:
> Gràcies per explicar-me això, Roser. Ho guardo amb cura.

**Biógrafo** `[AM19]`:
> I després, quan et vas quedar pel teu compte, com van ser aquells primers temps? Què va canviar a casa i en el dia a dia, qui tenies a prop. Si aquest temps és el d'ara, explica'm igualment com ho estàs portant. I si no hi va haver un temps així, n'hi ha prou que m'ho diguis.

**Narrador** `[AM19]`: Mira, els primers mesos no sabia ni posar la rentadora, que això ho feia ell, fixa't, que era molt mañoso per a tot. La casa se'm feia enorme i em despertava a les tres i parlava amb ell. La Marta venia cada dia a dinar amb mi, i va ser ella qui em va dir que vengués el pis i em vingués a prop. I la coral, la coral em va salvar: el senyor Bertran em va venir a buscar a casa perquè feia un mes que no anava, i em va dir, Roser, sense la contralt no sonem. I hi vaig tornar.

**Biógrafo** `[M26 + AM21]`:
> Gràcies, Roser.
>
> Ara, les d'abans. Si en el repàs m'has anomenat altres històries que van anar de debò, aquest és el seu lloc, però sense tant de detall: de cadascuna, explica'm un moment que vulguis que quedi al llibre, el primer que et vingui al cap, i si vols, com va acabar. I si hi va haver algú que et va marcar encara que no arribés a res, també hi té lloc aquí. Si aquella va ser l'única, n'hi ha prou amb el botó.
>
> [botones: (Sí, n'hi va haver) (Va ser l'única)]

**Narrador** `[AM21]`: [toca: Va ser l'única]

**Biógrafo** `[M25.1 + CI6]`:
> Bé, seguim.
>
> Fins aquí la part de l'amor. Ha quedat alguna persona o alguna cosa d'això que no t'hagi preguntat? Una persona, una carta, un ball, una conversa que no ha encaixat enlloc. És el moment d'explicar-ho, sense pressa.
>
> [botones: (No, ja està tot)]

**Narrador** `[CI6]`: [toca: No, ja està tot]

## Bloque 7 · Feina i ofici

**Biógrafo** `[M25.2 + EN7]`:
> D'acord, seguim.
>
> Ara anem a la feina i al teu ofici, Roser: a què has dedicat els teus dies.

**Biógrafo** `[TR1]`:
> Recordes la primera vegada que vas guanyar uns diners, o que vas treballar sense cobrar? Què feies, quants anys tenies? Explica'm aquell primer dia, i en què et vas gastar aquells primers diners, si n'hi va haver.

**Narrador** `[TR1]`: Ja t'he dit el de la fàbrica, però abans, als dotze, ja feia vores per a la meva mare i alguna clienta em donava una pesseta de propina. La primera pesseta meva la vaig guardar en una capseta de llauna de pastilles Juanola, i quan en vaig tenir deu em vaig comprar un disc de quaranta-cinc revolucions de la Gelu, i no teníem tocadiscos, home! L'anava a escoltar a casa de la Pilar.

**Biógrafo** `[M3.2 + TR6]`:
> Gràcies. Passem a la següent.
>
> Fem un repàs: a què has dedicat els teus anys, per ordre i més o menys en quines dates? Quina d'aquestes coses se t'ha quedat més gravada, i si va ser una sola cosa tota la vida, com va ser quedar-t'hi.

**Narrador** `[TR6]`: Doncs a la fàbrica de la Bauma del seixanta-dos al seixanta-vuit, a Can Soler fins que em vaig casar, el setanta. A Sabadell, quan van néixer els nens, cosia a casa per a fora com la meva mare, per a una botiga de la Rambla. I del vuitanta-cinc fins al 2008 vaig treballar a la merceria Ca la Pepita, al carrer de Sant Pere, que vaig acabar portant jo quan la Pepita es va fer gran. La que més se m'ha quedat és Can Soler, perquè allà vaig aprendre a tractar la gent i a tocar les teles, que les teles es coneixen amb els dits.

**Biógrafo** `[M3.3 + TR2]`:
> Ho he apuntat, gràcies. Vinga, una altra.
>
> Pensa en allò a què vas dedicar més anys. Com era un dia normal? Des que començaves fins que acabaves, què feies, amb qui. I explica'm un d'aquells dies que encara tinguis fresc.

**Narrador** `[TR2]`: A la merceria, vint-i-tres anys. Obria a les nou, però jo hi era a dos quarts, a escombrar i posar els botons per colors als calaixets. Venien les senyores del barri a buscar fil, cremalleres, llana per als nets, i de pas t'explicaven tota la vida, eh, que una merceria era com un confessionari. A la una tancava, dinava a casa amb el Josep, i a les cinc tornava fins a les vuit. Me'n recordo d'una tarda de Nadal que una senyora gran, la senyora Engràcia, va venir a buscar llana vermella per fer una bufanda al seu fill que era a la presó, i no tenia diners, i li vaig donar. Va tornar al cap d'un any a pagar-me-la, amb el fill.

**Biógrafo** `[M3.4 + TR3]`:
> Gràcies per explicar-m'ho. Seguim.
>
> Algú et va donar un cop de mà en el teu camí? Algú que et va ensenyar, et va acompanyar o et va obrir una porta en allò que feies. Explica'm qui va ser, amb el seu nom, com era aquella persona, i una vegada amb ella que tinguis ben clara.

**Narrador** `[TR3]`: La Pepita, la de la merceria, Josefina Muntané. Era una dona petita, sempre amb una agulla de cap clavada a la solapa, i molt estricta amb els números. Jo no sabia fer comptes de caixa i ella cada vespre s'asseia amb mi amb una llibreta de tapes negres fins que el compte quadrava al cèntim. Un dia, el noranta-sis, em va donar les claus de la botiga i em va dir: Roser, ara la botiga és teva, jo vindré a xafardejar. I va venir cada matí fins que es va morir.

**Biógrafo** `[M3.5 + TR5]`:
> Ho guardo, Roser. T'envio la següent.
>
> Quin va ser el dia de feina del qual estàs més orgullosa? No cal que fos res de gran: alguna cosa que va sortir bé, que algú va reconèixer, o que només tu saps el que va costar. Explica-m'ho.

**Narrador** `[TR5]`: Doncs mira, el dia que vaig tancar la merceria, el 2008, amb la persiana mig abaixada i totes les clientes a dins, una vintena, que m'havien portat una coca i cava. I la caixa quadrava al cèntim, com m'havia ensenyat la Pepita. Això només ho sé jo, el que em va costar, que amb la crisi ja no venia ningú. Però no vaig deure ni una pesseta a ningú, ni un euro, vaja.

**Biógrafo** `[M26 + TR11]`:
> Gràcies, Roser.
>
> Alguna vegada et vas quedar sense feina sense haver-ho triat, o et va tocar una època de diners molt justos? Si t'ha passat, explica'm un dia d'aquell temps que tinguis ben present, i com ho vas anar portant.
>
> [botones: (Prefereixo no dir-ho) (No, res d'això)]

**Narrador** `[TR11]`: Diners justos sempre, home, però l'època dolenta va ser el setanta-nou, quan van tancar el taller on treballava el Josep i va estar vuit mesos a l'atur, amb dos nens petits. Jo cosia fins a les dues de la nit. Un dia vaig anar al mercat de la Independència amb cent pessetes per a tota la setmana, i el carnisser, el Sebastià, em va posar el doble de carn i em va dir, ja m'ho pagaràs. Ens en vam sortir perquè el Josep va obrir el seu propi taller amb un soci, al vuitanta.

**Biógrafo** `[M4.2]`:
> T'he escoltat. Gràcies per confiar-m'ho.

**Biógrafo** `[TR8]`:
> Si vas tenir un negoci o alguna cosa pròpia, encara que fos petita, aquest és el seu lloc. Si ja m'ho has explicat, digues-m'ho, i si vols remarcar alguna cosa, és el moment. Si va quedar alguna cosa fora, explica-m'ho ara: com va començar, d'on va sortir la idea, amb quins diners, un dia d'aquells.

**Narrador** `[TR8]`: La merceria, que ja t'ho he dit, que me la va passar la Pepita. I el taller del Josep, Tallers Puig, al carrer de la Concepció, que jo li portava els papers i les factures els dissabtes. El van obrir amb els diners que ens havia deixat el meu pare quan es va morir, el vuitanta, i un préstec de la Caixa de Sabadell. El primer dia no va entrar ningú, i el segon tampoc, i al tercer va entrar un taxista amb el Seat 1430 fumejant i el Josep li va arreglar en una hora, i aquell taxista li va portar tots els taxistes de Sabadell.

**Biógrafo** `[M3.7 + CS1]`:
> Queda guardat, Roser. Anem a la següent.
>
> A banda de la teva feina, hi ha coses que fas bé i que ningú et paga: cuinar per a tothom, cuidar algú, tirar endavant la casa. N'hi ha alguna que sigui teva? Explica'm una vegada que et va sortir tan bé que la gent ho va notar.

**Narrador** `[CS1]`: Cosir, és clar, i les croquetes. Però la cosa que la gent va notar va ser el vestit de núvia de la Marta, el 2001. Li vaig fer jo, tres mesos de feina a les nits, amb un setí que vaig anar a buscar a Can Soler, a Manresa, que encara existia. Quan va entrar a l'església de Sant Fèlix, una senyora del darrere va preguntar a quina botiga de Barcelona l'havíem comprat. I la Marta es va girar i va dir, ben alt: me l'ha fet la meva mare.

**Biógrafo** `[M3.8 + CP1]`:
> T'he escoltat amb atenció. Continuem.
>
> Has viscut o treballat al camp alguna vegada, encara que fos de petita o per una temporada? Si va ser així, explica'm un dia sencer allà, i una vegada que el temps ho va decidir tot: una sequera, una gelada, una tempesta.

**Narrador** `[CP1]`: Al camp de debò no, només l'hort dels avis que t'he dit, i ara el meu hort, un tros als horts municipals de Can Deu, que tinc des del 2010. Una tempesta sí: l'agost del 2018 va caure una calamarsada com ous de colom, en deu minuts, i em va destrossar totes les tomaqueres i les mongeteres. Jo plorava allà al mig, i el meu veí d'hort, el Florencio, que és de Granada, em va dir: mujer, se planta otra vez. I vam replantar junts aquell mateix setembre.

**Biógrafo** `[M3.1 + TR9]`:
> Gràcies, Roser. Ja ho tinc guardat.
>
> Ja has deixat allò a què et vas dedicar? Si encara hi continues, n'hi ha prou que m'ho diguis. Si ja ho has deixat, explica'm l'últim dia: com va ser, si ho sabies d'abans, què vas fer en sortir. I l'endemà, el primer dia sense anar-hi.

**Narrador** `[TR9]`: L'últim dia ja te l'he explicat, el de la coca i el cava. L'endemà em vaig llevar a dos quarts de nou per costum, em vaig vestir i tot, i quan era al replà em vaig adonar que no havia d'anar enlloc. Vaig tornar a entrar i em vaig asseure a la cuina i el Josep em va fer un tallat i em va dir: doncs ara, Roseta, a cantar. I aquell mateix dijous vaig anar a l'assaig de la coral.

**Biógrafo** `[M26 + CI7]`:
> Gràcies, Roser.
>
> Fins aquí la part de la feina i l'ofici. Ha quedat alguna cosa d'això que no t'hagi preguntat? Un lloc, una eina, una olor, una persona, una feina de pocs dies que ningú recorda. És el moment d'explicar-ho, sense pressa.
>
> [botones: (No, ja està tot)]

**Narrador** `[CI7]`: [toca: No, ja està tot]

## Bloque 8 · Fills i nets

**Biógrafo** `[M25.3 + EN8]`:
> Bé, doncs.
>
> Tornem a la família, Roser, però a la teva vida adulta.

**Biógrafo** `[PG1]`:
> Parla'm dels teus pares quan tu ja eres gran i tenies la teva pròpia vida. Una vegada que els vas veure més grans, un gest, una cosa petita, i què vas sentir tu. I si et va tocar cuidar-los, explica'm com era un d'aquells dies: què feies per ells, què et deien. Si no els vas tenir a prop, explica'm com va ser.

**Narrador** `[PG1]`: El meu pare es va morir el vuitanta, dels pulmons, encara jove, i la meva mare es va quedar sola a Manresa. Cada diumenge pujàvem amb el Seat 127 a veure-la, amb els nens. La vegada que la vaig veure gran de debò va ser un diumenge que la vaig trobar asseguda davant de la Singer sense cosir, amb les mans a la falda, i em va dir: Roser, ja no veig l'agulla. Aquella dona que havia cosit tota la vida. Els últims dos anys la vam portar a Sabadell, a casa, i la cuidava jo; li llegia La Vanguardia en veu alta perquè no hi veia. Es va morir el noranta-quatre.

**Biógrafo** `[M26 + HI0 + M1]`:
> Gràcies, Roser.
>
> Ara parlem dels fills. Vas tenir fills, o en vas criar algun com si ho fos? Presenta-me'ls d'un en un, encara que algun ja hagi sortit en el que m'has anat explicant: com es diu cadascun i quan va arribar. I si no en vas tenir, passem a una altra cosa.
>
> _Si no va amb tu, digues «passo» i en fem una altra._
>
> [botones: (Sí, en vaig tenir) (No vaig tenir fills)]

**Narrador** `[HI0]`: [toca: Sí, en vaig tenir]

**Biógrafo** `[M30]`:
> Explica-m'ho, t'escolto.

**Narrador** `[HI0]`: Dos. La Marta, que va néixer el març del setanta-dos, a la maternitat de Sabadell, una nena rossa i tranquil·la que no plorava mai. I el Jordi, l'octubre del setanta-cinc, un mes abans que es morís Franco, que el Josep deia que el nen havia vingut a portar la democràcia. El Jordi era tot el contrari, un bitxo, no dormia ni a tirs. La Marta és infermera al Taulí i el Jordi viu a Terrassa, és mestre d'escola.

**Biógrafo** `[M3.3 + HI2]`:
> Ho he apuntat, gràcies. Vinga, una altra.
>
> I el dia que va arribar el teu primer fill? Explica'm aquell dia com si l'estiguessis veient: on va ser, qui hi era, i el moment en què el vas tenir en braços per primera vegada.

**Narrador** `[HI2]`: La Marta va néixer un dimarts a les sis del matí, després de tota la nit. El Josep era a fora, al passadís, que llavors no deixaven entrar els homes, i fumava un cigarret darrere l'altre. Quan me la van posar al pit tenia els ulls oberts, molt oberts, i em mirava com si em conegués de tota la vida, i jo vaig pensar: ai, mare, i ara què faig. La meva mare va arribar de Manresa amb el primer tren amb una canastreta que havia cosit, tota de punt de niu d'abella.

**Biógrafo** `[M3.4 + HI3]`:
> Gràcies per explicar-m'ho. Seguim.
>
> Com era cadascun de petit? El caràcter, les manies, allò que el feia diferent dels altres. I explica'm una escena d'aquella època que encara et faci somriure.

**Narrador** `[HI3]`: La Marta era la mestra de tothom, posava els ninos en fila i els feia classe, i manava al seu germà com un sergent. El Jordi era un trasto, ho desmuntava tot, com el seu pare. Una escena: el Jordi tenia cinc anys i va desmuntar el despertador del Josep per veure on vivia el tic-tac, i quan el Josep va arribar el va trobar a terra amb trenta peces, plorant perquè no sabia tornar-lo a muntar. I el Josep es va asseure a terra amb ell i el van muntar junts, i va funcionar, i des d'aquell dia el Jordi volia ser mecànic. Després va ser mestre, mira.

**Biógrafo** `[M3.5 + HS1]`:
> Ho guardo, Roser. T'envio la següent.
>
> Com va ser criar els teus fills? Qui hi havia a prop, com us repartíeu les coses, o si et va tocar tirar-ho endavant sola. Explica'm un dia d'aquella època que recordis bé.

**Narrador** `[HS1]`: Doncs la casa era cosa meva, eh, que llavors era així. El Josep treballava de sol a sol al taller, però els diumenges eren seus: els portava a la Salut amb la bicicleta. Un dia que recordo bé: el Jordi va agafar el xarampió i la Marta l'endemà, i jo amb tots dos al llit, a les fosques, perquè deien que la llum els feia mal als ulls, i jo cosint per a la botiga amb una espelma a la cuina. Les veïnes del replà, la senyora Rosa i la Fina, em pujaven sopes i em feien els encàrrecs. Això ja no passa, això de les veïnes.

**Biógrafo** `[M3.6 + HI6]`:
> D'acord, gràcies. Fem-ne una altra.
>
> Explica'm una vegada que se't va inflar el pit d'orgull per un dels teus fills. No cal que fos res que sortís al diari: què va fer, on eres, què li vas dir. I si te'n venen diverses, explica-les totes, que hi ha lloc per a cadascun.

**Narrador** `[HI6]`: Quan el Jordi va treure les oposicions de mestre, el noranta-nou, que va estudiar dos anys de nit treballant de cambrer. Ens va trucar des d'una cabina de Barcelona cridant, i el Josep, que no plorava mai, va haver de seure. I la Marta, el dia que es va treure el títol d'infermera, que va fer el discurs de la promoció a la Universitat, a Bellaterra, i va dir el nom de l'àvia Montserrat, que cosia fins que li sagnaven els dits. Jo allà, a la quarta fila, amb el mocador.

**Biógrafo** `[M3.7 + HI7]`:
> Queda guardat, Roser. Anem a la següent.
>
> Un dia els fills marxen de casa. Recordes el dia que va marxar el primer? Com va ser el comiat, i com va quedar la casa aquella nit. Si encara no n'ha marxat cap, només cal que m'ho diguis.

**Narrador** `[HI7]`: Va marxar primer el Jordi, curiosament, el noranta-sis, a un pis compartit a Terrassa amb uns amics. Va carregar el 127 vell del Josep fins dalt, amb un matalàs lligat al sostre. Jo li vaig posar a la bossa un tupper de canelons i tres samarretes planxades. Aquella nit vaig parar taula per a quatre sense adonar-me'n, i el Josep va treure el plat del Jordi sense dir res, i em va fer un petó al cap.

**Biógrafo** `[M3.8 + HI12]`:
> T'he escoltat amb atenció. Continuem.
>
> Com vau triar el nom de cada fill? D'on va sortir, qui el va proposar, si hi va haver discussió. Explica'm la història del nom, encara que sigui curta.

**Narrador** `[HI12]`: Marta, perquè a mi m'agradava, sense més, que ja havia patit prou amb el meu nom. I el Jordi, per Sant Jordi, és clar, que el Josep era molt catalanista d'amagat, i en aquella època, el setanta-cinc, posar Jordi encara era una mica de rebel·lia. Al registre el funcionari ens va dir que posaríem Jorge, i el Josep li va dir que ni parlar-ne, i van estar mitja hora discutint. Al final va quedar Jorge al paper fins al vuitanta-dos, que el vam canviar.

**Biógrafo** `[M3.1 + HI8 + M1]`:
> Gràcies, Roser. Ja ho tinc guardat.
>
> Ara, els nets. Han arribat nets a la teva vida? Potser ja els has anomenat; digues-me'ls d'un en un, i explica'm el dia que vas conèixer el primer, com si ho estiguessis veient. Si no hi ha nets, passem a una altra cosa.
>
> _Si no va amb tu, digues «passo» i en fem una altra._
>
> [botones: (Sí, n'han arribat) (No hi ha nets)]

**Narrador** `[HI8]`: [toca: Sí, n'han arribat]

**Biógrafo** `[M30]`:
> Explica-m'ho, t'escolto.

**Narrador** `[HI8]`: Tres. La Laia, de la Marta, que va néixer el 2003; el Pol, també de la Marta, el 2006; i l'Arnau, del Jordi, el 2010, el mateix any que es va morir el meu germà Ramon, que va ser com si un se n'anés i l'altre arribés. La Laia la vaig conèixer al Taulí, mateix hospital on havia nascut la Marta. La Marta me la va donar i em va dir: mare, et presento la Laia. I jo li vaig cantar a cau d'orella, fluixet, la Dolça Maria, i va deixar de plorar. Ara té vint-i-un anys i estudia música, fixa't.

**Biógrafo** `[M3.2 + HI9]`:
> Gràcies. Passem a la següent.
>
> Hi ha alguna cosa que fas amb els teus nets que és només vostra, que no feu amb ningú més? Un joc, per exemple. Explica'm què és i una vegada que tinguis ben gravada.

**Narrador** `[HI9]`: L'hort. Els dissabtes al matí l'Arnau ve amb mi a Can Deu, que és el que més s'hi ha aficionat, i tenim un concurs de qui fa el tomàquet més gros, ell la seva tomaquera i jo la meva. L'any passat em va guanyar amb un tomàquet de cor de bou de vuit-cents grams i el vam pesar a la balança de la cuina i va fer una foto i la va enviar al grup de la família amb un trofeu. Encara me la recorda cada setmana, el bandarra.

**Biógrafo** `[M26 + CI8]`:
> Gràcies, Roser.
>
> Fins aquí la part de la família de la teva vida adulta. Ha quedat algú o alguna cosa que no t'hagi preguntat? Un aniversari, una conversa a la cuina, algú que no ha encaixat enlloc. És el moment d'explicar-ho, sense pressa.
>
> [botones: (No, ja està tot)]

**Narrador** `[CI8]`: [toca: No, ja està tot]

## Bloque 9 · Llocs i passions

**Biógrafo** `[M25.1 + EN9]`:
> Bé, seguim.
>
> Et porto als llocs que van ser teus i a les coses que t'han apassionat.

**Biógrafo** `[LU4]`:
> Ja de gran, quin va ser el viatge més important de la teva vida, o un que recordis amb molta força? Explica'm si hi vas anar amb algú, i un dia d'aquell viatge que se t'hagi quedat com una foto.

**Narrador** `[LU4]`: Roma, amb la coral, el 2017, dos anys després de quedar-me sola. No havia pujat mai a un avió, mira, als seixanta-nou anys. Vam cantar a l'església de Santa Maria in Trastevere, i quan vam acabar el Cant dels Ocells, un senyor italià gran es va aixecar i va aplaudir plorant. Aquella nit vaig sortir a la plaça sola, amb un gelat de pistatxo, i vaig parlar amb el Josep en veu alta. Li vaig dir: Josep, sóc a Roma. I juraria que va riure.

**Biógrafo** `[M3.4 + PA1]`:
> Gràcies per explicar-m'ho. Seguim.
>
> A banda de la feina i la família, hi va haver alguna cosa que t'apassionés de gran? Explica'm com va començar, i un dia sencer que hi hagis dedicat, del matí a la nit. Si ja m'ho has explicat, digues-m'ho, i si vols remarcar alguna cosa, és el moment.

**Narrador** `[PA1]`: La coral, ja t'ho he dit, i l'hort. El que vull remarcar és un dia de concert: el de Nadal de l'any passat, al Teatre Principal de Sabadell. Al matí hort, a recollir les últimes cols; a migdia dinar amb la Marta; a la tarda planxar la camisa blanca i el foulard vermell; a les set assaig general, i a les nou el concert, amb la Laia a la primera fila, que ara canta amb nosaltres a vegades. Vaig arribar a casa a la una, cansada com una mula i feliç com una nena.

**Biógrafo** `[M3.5 + PA3]`:
> Ho guardo, Roser. T'envio la següent.
>
> Ets d'algun equip? Explica'm com va començar, si algú t'hi va portar, i un partit que no oblidaràs mai.

**Narrador** `[PA3]`: Del Barça, per culpa del Ramon, que em portava a escoltar els partits per la ràdio a casa d'un veí que en tenia. Però a l'estadi només hi he anat una vegada: la final de Wembley, no, mentida, aquella la vam veure a la tele, el noranta-dos, tots a casa amb els nens, i quan va marcar el Koeman el Josep, que era del Sabadell, també va saltar del sofà. Això sí que no l'oblidaré.

**Biógrafo** `[M26 + CI9]`:
> Gràcies, Roser.
>
> Fins aquí els llocs i les passions. Ha quedat algun lloc o alguna cosa que t'agradés molt i que no hagi tingut la seva pregunta? Una cantonada, una afició que va durar poc, un racó de casa teva. Explica-ho ara, tranquil·la.
>
> [botones: (No, ja està tot)]

**Narrador** `[CI9]`: [toca: No, ja està tot]

## Bloque 10 · Amistats i ajudes

**Biógrafo** `[M25.2 + EN10]`:
> D'acord, seguim.
>
> Parlem dels amics, Roser, i de la gent que t'ha donat un cop de mà a la vida.

**Biógrafo** `[AS1]`:
> Ja de gran, vas conèixer algú que es va tornar molt important a la teva vida, un amic o una amiga? Explica'm de qui parles, amb el seu nom, com us vau conèixer, i una vegada que mostri bé com és aquesta amistat.

**Narrador** `[AS1]`: La Carme, la de la coral, Carme Rovira, la que em va portar el noranta-vuit. És vídua com jo, des del 2012, i quan es va morir el Josep va ser la que em va ensenyar a viure sola, que ella ja en sabia. Cada dimecres anem juntes al mercat de Sant Llorenç i després a fer un cafè amb llet i un xuixo, i ens expliquem les penes i ens en riem. L'any passat em vaig trencar el canell i la Carme, que té vuitanta anys, em venia a pentinar cada matí. Això és la Carme.

**Biógrafo** `[M3.7 + HE2]`:
> Queda guardat, Roser. Anem a la següent.
>
> Ja de grans, els teus germans també es van tornar amics teus? Explica'm algun moment, ja adults, en què vau estar ben a prop: un viatge, una conversa, un cop de mà que us vau donar.

**Narrador** `[HE2]`: Només el Ramon, ja t'ho he dit. Ell es va quedar a Manresa amb el taller del pare fins que el va tancar. Quan el Josep va estar ingressat la primera vegada del cor, el 2008, el Ramon va venir cada dia de Manresa amb el cotxe a fer-me companyia a l'hospital, i parlàvem de quan érem petits, del Cardener, de les arracades d'encenall. Dos anys després el que se'n va anar va ser ell, de cop. Encara tinc el seu número al telèfon, no l'he esborrat.

**Biógrafo** `[M3.8 + AY1]`:
> T'he escoltat amb atenció. Continuem.
>
> Alguna vegada vas necessitar ajuda de debò i algú te la va donar, fos qui fos? Explica'm què va fer aquella persona aquell dia, i si després li vas poder tornar el favor.

**Narrador** `[AY1]`: El Sebastià, el carnisser, el de l'època de l'atur del Josep, que ja t'he explicat. I li vaig tornar: quan es va jubilar, la seva dona es va posar malalta i jo li cosia les cortines i li planxava les camises cada setmana, durant tres anys, i no em va deixar cobrar ni un duro. Diu que era el pagament dels filets d'aquell any.

**Biógrafo** `[M3.1 + AS9]`:
> Gràcies, Roser. Ja ho tinc guardat.
>
> Imagina't que organitzes un sopar i pots convidar la teva gent més propera. Qui seu a aquesta taula? Explica'm qui hi va, i per què cadascú s'ha guanyat el seu lloc.

**Narrador** `[AS9]`: Doncs la Marta i el seu home, el Xavi, el Jordi i la Núria, els tres nets, la Laia, el Pol i l'Arnau, i la Carme. I deixaria dues cadires buides, una per al Josep i una per al Ramon, i posaria el plat igual. La Marta perquè és la meva roca, el Jordi perquè em fa riure, els nets perquè són la meva alegria, i la Carme perquè m'ha pentinat. I faria canelons, que és el que tothom em demana.

**Biógrafo** `[M3.2 + AS7]`:
> Gràcies. Passem a la següent.
>
> Avui, quan et passa alguna cosa important, a qui ho expliques primer? Explica'm una vegada que li hagis explicat una cosa així.

**Narrador** `[AS7]`: A la Marta, sempre, que la tinc a dues cantonades. Quan el metge em va dir l'any passat que tenia el canell trencat, la vaig trucar des del CAP abans que ningú, i va venir en uniforme d'infermera directament del Taulí, i es va posar a renyar el metge perquè no m'havia posat bé el guix. Aquesta nena manava ja de petita, t'ho he dit.

**Biógrafo** `[M26 + CI10]`:
> Gràcies, Roser.
>
> Fins aquí els amics i la gent que t'ha ajudat. Ha quedat algú que t'hagi acompanyat i que no hagi tingut la seva pregunta? Un veí, algú de la feina, una persona que va aparèixer una sola vegada. I si vols parlar d'altres amics importants, de qui sigui, és el moment. Explica-ho tranquil·la.
>
> [botones: (No, ja està tot)]

**Narrador** `[CI10]`: El Florencio, el de l'hort, que t'he dit. Té vuitanta-quatre anys i encara cava com un noi. Ens parlem cadascú en la seva llengua, jo en català i ell en castellà, i ens entenem perfectament. Quan jo no puc anar a regar, rega ell les meves tomaqueres, i jo li porto croquetes. Això és tot.

## Bloque 11 · Pèrdues i moments difícils

**Biógrafo** `[M24.3 + AV11]`:
> Bé, Roser. Ho afegeixo al que ja m'havies explicat d'això.
>
> Ara venen unes preguntes sobre moments difícils. Si alguna no té res a veure amb la teva vida o no hi vols entrar, amb un *passo* n'hi ha prou i seguim. Tu manes.

**Biógrafo** `[PE1 + M1]`:
> Potser ja m'has parlat d'alguna pèrdua; aquí hi ha lloc per al que no hi va cabre. Si has perdut persones importants, explica'm el que vulguis de cadascuna: què era per a tu, com van ser els dies de després i com ho has anat portant. I si hi ha un moment amb alguna d'aquestes persones que t'agradi recordar, explica-m'ho també.
>
> _Si no va amb tu, digues «passo» i en fem una altra._
>
> [botones: (Prefereixo no dir-ho)]

**Narrador** `[PE1]`: Ja t'he parlat del Josep, del Ramon i de la mare. Del meu pare no tant. Es va morir el vuitanta, amb seixanta-sis anys, dels pulmons, de tanta serradura. Jo era a Sabadell i no hi vaig arribar a temps, i això ho porto aquí clavat. Però el que m'agrada recordar és que l'última vegada que el vaig veure em va fer una capsa de fusta de noguer per guardar-hi les cartes del Josep, amb una rosa tallada a la tapa. Les cartes encara hi són, allà dins.

**Biógrafo** `[M4.3]`:
> Ho guardo tal com m'ho has explicat. Gràcies.

**Biógrafo** `[PE5 + M1]`:
> Si alguna vegada la salut t'ha aturat de debò, m'ho vols explicar? Com van ser aquells dies, qui tenies a prop i com ho vas anar portant. I si és una cosa que encara portes a sobre, també val.
>
> _Si no va amb tu, digues «passo» i en fem una altra._
>
> [botones: (Prefereixo no dir-ho)]

**Narrador** `[PE5]`: Només el canell, l'any passat, que vaig relliscar a la dutxa. Sis setmanes amb guix i no podia ni cosir ni anar a l'hort ni pentinar-me, i jo que no havia demanat res a ningú en tota la vida vaig haver d'acceptar que la Carme em pentinés i la Marta em fes el dinar. Em va costar més això que el dolor, mira. Ara ja estic bé, ja cuso.

**Biógrafo** `[M4.4]`:
> Sé que no és fàcil d'explicar. Gràcies, ho guardo amb cura.

**Biógrafo** `[PE4 + M1]`:
> Hi va haver alguna època dura en la teva vida d'adult que creguis que no pot quedar fora de la teva història? Alguna cosa que et marqués? Si vols, explica'm què va passar i com ho vas viure. Si ja m'ho has explicat, digues-m'ho, i si vols remarcar alguna cosa, és el moment.
>
> _Si no va amb tu, digues «passo» i en fem una altra._
>
> [botones: (Prefereixo no dir-ho) (No, res d'això)]

**Narrador** `[PE4]`: [toca: No, res d'això]

**Biógrafo** `[M25.3 + CI11]`:
> Bé, doncs.
>
> Si hi ha un altre moment difícil que sents que ha de ser a la teva història i no te l'he preguntat, explica-me'l aquí.
>
> [botones: (No, ja està tot)]

**Narrador** `[CI11]`: [toca: No, ja està tot]

## Bloque 12 · La història gran

**Biógrafo** `[M25.1 + EN12]`:
> Bé, seguim.
>
> Ara sortim una mica de casa teva: anem a les coses grans que van passar al país i al món mentre tu vivies la teva vida.

**Biógrafo** `[HG1]`:
> Recordes alguna cosa grossa que passés al país o al món, un Mundial, una guerra? Com la vas viure tu? Explica'm el que recordis: on eres, si ho vas viure de prop o t'ho van explicar, i què va passar aquell dia.

**Narrador** `[HG1]`: La mort del Franco, el vint de novembre del setanta-cinc, que el Jordi tenia un mes. Jo li donava el pit a les set del matí i a la ràdio van posar música clàssica i el Josep va dir: ja està, Roseta, s'ha mort. I va obrir una ampolla de xampany a les set del matí, que l'havia guardat no sé quant de temps per a això. La veïna del davant, la senyora Fina, plorava al balcó, i nosaltres brindant a la cuina amb la porta tancada perquè no ens sentís. I la Diada del setanta-set, que vam anar a Barcelona amb els nens amb el cotxet, un milió de persones.

**Biógrafo** `[M3.4 + HG4]`:
> Gràcies per explicar-m'ho. Seguim.
>
> Et vull preguntar per un dia concret de la pandèmia. No tota aquella època: un sol dia. On eres, amb qui, què vas fer, com et senties. Pensa en el que se t'hagi quedat més gravat.

**Narrador** `[HG4]`: El dia del meu aniversari, el maig del 2020, que feia setanta-dos anys i estava tancada sola a casa. A les vuit del vespre, després dels aplaudiments, la Marta, el Xavi i els nens es van posar a baix al carrer, a la vorera, amb un pastís i una pancarta, i van cantar el Per molts anys mirant cap amunt. I tots els veïns dels balcons van cantar també. Jo al balcó plorant amb la mascareta posada, que no calia perquè era a casa, però me la vaig posar per si de cas, fixa't quina ximpleria.

**Biógrafo** `[M3.5 + DE1]`:
> Ho guardo, Roser. T'envio la següent.
>
> Quan eres jove hi havia coses que no es podien fer, o que estaven mal vistes, i avui no sorprenen ningú. Vas topar amb alguna? Explica'm aquell dia: què volies fer i què et van dir.

**Narrador** `[DE1]`: I tant. Parlar català a l'escola, que ja t'he dit. I una dona sola no podia obrir un compte al banc sense el permís del marit, fixa't. El setanta-dos vaig anar a la Caixa a obrir una llibreta amb els diners de la costura, i el director em va dir que tornés amb el meu marit. Hi vaig tornar amb el Josep, que estava més enfadat que jo, i va firmar dient: firmo, però els diners són d'ella. El director es va quedar de pedra.

**Biógrafo** `[M3.6 + FI7]`:
> D'acord, gràcies. Fem-ne una altra.
>
> Què és la política per a tu? Hi va haver algun moment de la teva vida en què et va tocar de prop? Explica'm quin va ser i què en penses avui.

**Narrador** `[FI7]`: Home, la política... jo no n'he sigut mai gaire, el Josep sí. Però l'u d'octubre del 2017 vaig anar a votar a l'escola de la Marta i Jordi, i vam fer cua des de les cinc del matí sota la pluja, amb la Carme, dues velles amb paraigua. No et diré què vaig votar, que el vot és secret. El que em va tocar de prop va ser veure el jovent cuidant-nos, portant-nos cafè, i pensar que el Josep hauria estat allà el primer. Avui penso que la política l'haurien de fer les mestresses de casa, que saben quadrar els comptes.

**Biógrafo** `[M26 + CI12]`:
> Gràcies, Roser.
>
> Fins aquí la part del país i del món. Si hi ha alguna cosa que et va marcar i no ha sortit, envia-me-la ara, encara que sigui curta, i digues-me on eres quan va passar.
>
> [botones: (No, ja està tot)]

**Narrador** `[CI12]`: [toca: No, ja està tot]

## Bloque 13 · Moments alts, baixos i girs

**Biógrafo** `[M25.2 + EN13]`:
> D'acord, seguim.
>
> Arribem als dies que et van canviar alguna cosa: els bons, els que et van agafar per sorpresa, i unes quantes preguntes per pensar-hi una estona.

**Biógrafo** `[GI1]`:
> Hi ha algun dia de la teva vida que, si poguessis, tornaries a viure tal com va ser? O un moment en què de sobte tot va encaixar. Explica-me'l des del principi: on eres, amb qui, i què va passar. Si ja m'ho has explicat, digues-m'ho, i si vols remarcar alguna cosa, és el moment.

**Narrador** `[GI1]`: El de la Vespa a Sitges, que ja t'he explicat. Si el pogués tornar a viure, el tornaria a viure igual, amb la cremada i la bronca de la mare i tot. El que vull remarcar és que en arribar a la platja el Josep es va treure les sabates i els mitjons i es va posar a l'aigua amb els pantalons arremangats, i jo li vaig dir que estava boig, i ell va dir: Roseta, la vida és curta. Tenia raó, mira.

**Biógrafo** `[M3.8 + GI2]`:
> T'he escoltat amb atenció. Continuem.
>
> Pensa en un dia que va començar com qualsevol altre i va acabar canviant-te alguna cosa. Explica'm aquell dia sencer: com va començar el matí, en quin moment et vas adonar que ja no hi havia marxa enrere, i com va acabar. Si ja m'ho has explicat, digues-m'ho, i si vols remarcar alguna cosa, és el moment.

**Narrador** `[GI2]`: El diumenge que el Josep es va trobar malament, el del 2015. Va començar normal: ell va baixar a comprar el diari i ensaïmades, com cada diumenge, i vam esmorzar. Ell estava fent el mots encreuats i de sobte va deixar el bolígraf i es va posar la mà al pit. En aquell moment vaig saber que no hi havia marxa enrere, ho vaig veure a la seva cara. Vaig trucar a la Marta, a l'ambulància... El vespre jo era a l'hospital amb la seva mà a la meva. La resta ja te l'he explicada.

**Biógrafo** `[M3.1 + HJ1]`:
> Gràcies, Roser. Ja ho tinc guardat.
>
> Hi ha alguna cosa que volies fer amb la teva vida i que al final no va poder ser? Explica'm el moment en què et vas adonar que ja no passaria: on eres i què va passar aquell dia.

**Narrador** `[HJ1]`: Ser cantant, que ja t'he dit. El dia que vaig saber que no seria va ser als setze, a Ràdio Manresa, que feien un concurs de veus noves, i jo m'hi havia apuntat d'amagat. El dia abans la mare ho va descobrir i em va dir que l'endemà tenia torn a la fàbrica i que d'allà no es faltava. Em vaig quedar escoltant el concurs per la ràdio de la veïna, i va guanyar una noia de Sallent cantant la mateixa cançó que jo havia preparat. No vaig dir res. Però als setanta-sis anys canto al Teatre Principal, així que, mira, potser sí que va poder ser, a la meva manera.

**Biógrafo** `[M3.2 + GI9]`:
> Gràcies. Passem a la següent.
>
> Hi va haver algun moment de la teva vida en què et vas sentir petita davant d'una cosa immensa? Un cel de nit, per exemple. Explica'm aquell moment: on eres, amb qui, què hi havia al voltant.

**Narrador** `[GI9]`: A Montserrat, de nena, amb el meu pare. Vam pujar a peu des de Monistrol per complir una promesa de la mare, i a dalt, a Sant Jeroni, el pare em va aixecar a coll i em va dir: mira, Roseta, allò blanc són els Pirineus i allà al fons el mar. I jo, tan petita, vaig pensar que el món era tan gran que no s'acabava. El pare feia olor de serradures fins i tot allà dalt.

**Biógrafo** `[M3.3 + FI1]`:
> Ho he apuntat, gràcies. Vinga, una altra.
>
> Quin lloc té la solitud a la teva vida? Et fa bé tenir moments amb tu mateixa? Explica-me'n algun que recordis: on eres i què feies.

**Narrador** `[FI1]`: Ara la solitud la tinc tota, home, que visc sola. Al principi em feia por i ara alguns moments me'ls estimo. Els matins d'hivern a l'hort, a les vuit, quan encara no hi ha ningú i hi ha boira, i jo arrencant males herbes i cantussejant. Allà no penso en res. O sí, penso en el Josep, però sense pena, com si m'hi fes companyia.

**Biógrafo** `[M3.4 + FI2]`:
> Gràcies per explicar-m'ho. Seguim.
>
> Hi va haver un moment en què et vas adonar, de cop, que el temps havia passat? Una cosa petita, algú que et va tractar de vostè, per exemple. Explica'm on eres i què va passar.

**Narrador** `[FI2]`: Al tren, a l'estació de Sabadell Nord, fa uns deu anys. Un noi jove em va cedir el seient i em va dir: segui, àvia. Àvia! Jo, que encara em pintava els llavis i portava talons. Vaig seure, és clar, que no era qüestió de fer el ridícul, però vaig anar tot el viatge fins a Barcelona mirant-me al vidre de la finestra. I sí, mira, ja era una àvia. Amb tres nets, què volies.

**Biógrafo** `[M3.5 + FI3]`:
> Ho guardo, Roser. T'envio la següent.
>
> Què sents que has heretat de la teva família en la teva manera de ser? Un caràcter, una manera de fer les coses. Explica'm una vegada que et vas adonar que allò venia d'ells.

**Narrador** `[FI3]`: De la mare, la tossuderia i les mans per cosir; del pare, cantar mentre treballo. Me'n vaig adonar quan la Laia, de petita, em va dir: àvia, per què cantes quan rentes els plats? I em vaig sentir dir: perquè el meu pare cantava sarsueles mentre serrava. Ho vaig dir sense pensar, i em vaig quedar parada amb l'esponja a la mà. Era ell, allà a la meva cuina.

**Biógrafo** `[M3.6 + FI4]`:
> D'acord, gràcies. Fem-ne una altra.
>
> T'importa el que pensen els altres de tu? T'ha importat sempre igual? Explica'm una vegada en què es va notar.

**Narrador** `[FI4]`: De jove molt, massa, el què diran era una presó. Ara gens. Es va notar el dia que vaig anar al casament de la néta d'una amiga de la coral amb un vestit vermell, vermell de debò, als setanta anys, i una senyora em va dir que les vídues no anaven de vermell. Li vaig dir: doncs aquesta sí, que el meu home deia que el vermell em quedava bé. I vaig ballar fins a les dues.

**Biógrafo** `[M26 + CI13]`:
> Gràcies, Roser.
>
> Fins aquí aquesta part. Ha quedat algun moment important de la teva vida sense la seva pregunta? Explica-me'l ara, tranquil·la.
>
> [botones: (No, ja està tot)]

**Narrador** `[CI13]`: [toca: No, ja està tot]

## Bloque 14 · Avui

**Biógrafo** `[M25.3 + EN14]`:
> Bé, doncs.
>
> Deixem el passat una estona i tornem al present, Roser: com són els teus dies i què t'agrada ara.

**Biógrafo** `[HO1]`:
> Explica'm un dia qualsevol dels d'ara, des que obres els ulls fins que apagues el llum. Què fas, a quina hora, amb qui. Si vols, el d'ahir mateix.

**Narrador** `[HO1]`: Ahir mateix, dijous. Em llevo a les set, sense despertador, que el cos ja sap. Cafè amb llet i torrada amb oli. A les nou a l'hort, fins a les onze, que ara amb la calor ja no s'hi pot estar més. Dutxa, i a dinar a casa de la Marta, que els dijous el Pol dina amb nosaltres. A la tarda una mica de migdiada i punt de creu, que estic fent unes estovalles per a la Laia. A les set assaig de la coral, a dos quarts de deu sopo una amanida i miro el telenotícies, i a les onze al llit, i parlo una mica amb el Josep, que això no t'ho havia dit.

**Biógrafo** `[M3.8 + HO2]`:
> T'he escoltat amb atenció. Continuem.
>
> Què et fa gràcia avui, què et fa riure? Explica'm l'última vegada que vas riure de debò: on eres i què havia passat.

**Narrador** `[HO2]`: Diumenge passat, al dinar, que l'Arnau em va voler ensenyar a fer un àudio de WhatsApp, i jo vaig enviar sense voler al grup de la coral un àudio de dos minuts on només se'm sentia renyar el gat de la veïna. I tota la coral contestant amb rialles i el director dient: Roser, aquest és el teu millor solo. Vam riure tant que el Jordi va vessar el vi.

**Biógrafo** `[M3.1 + HO4]`:
> Gràcies, Roser. Ja ho tinc guardat.
>
> Hi ha alguna cosa a casa teva que no regalaries mai, valgui el que valgui? Explica'm d'on va sortir, com va arribar fins a tu, i l'última vegada que la vas tenir a les mans.

**Narrador** `[HO4]`: La capsa de noguer amb la rosa que em va fer el pare, amb les cartes del Josep a dins. I la Singer de la mare, que la tinc al menjador i encara cus, que la vaig fer arreglar a Terrassa. L'última vegada que vaig tenir la capsa a les mans va ser fa un mes, que la Laia em va demanar de llegir-ne una, i vam llegir la de la rosella, la de d'aquí a un any. La Laia va dir que el seu xicot no li escriu ni un whatsapp sencer.

**Biógrafo** `[M3.2 + HO5]`:
> Gràcies. Passem a la següent.
>
> Què és el que més t'agrada de la vida que tens ara? Pot ser una cosa enorme o una cosa petita de cada dia. Explica'm un moment d'aquesta setmana en què ho vas sentir.

**Narrador** `[HO5]`: Que encara serveixo, que la gent em ve a buscar. Dimarts la Laia va venir a casa a assajar amb mi la part de contralt d'un Rèquiem que canta amb el cor de la universitat, i vam estar dues hores al menjador, ella amb el mòbil i jo de memòria, i quan ens va sortir bé ens vam abraçar. Això és el que més m'agrada: cantar amb la meva néta.

**Biógrafo** `[M3.3 + HO11]`:
> Ho he apuntat, gràcies. Vinga, una altra.
>
> Tens alguna marca al cos que tingui història? Una cicatriu, un tatuatge, una cremada de la cuina. Explica'm com te la vas fer: on eres, quants anys tenies, qui hi havia amb tu i què va passar després. I si no en tens cap que valgui la pena, explica-me'n una d'algú de la teva família, d'aquelles que tothom pregunta d'on va sortir.

**Narrador** `[HO11]`: Una cicatriu al dit índex de la mà esquerra, de les estisores grosses de Can Soler. Tenia divuit anys, tallant una pana gruixuda, i em vaig obrir el dit fins a l'os. El senyor Soler em va embolicar el dit amb un retall de setí blanc, que va quedar tot vermell, i em va portar ell mateix a la casa de socors. I l'endemà em va regalar el retall net, rentat, i em va dir: per si algun dia et cases. I el vaig fer servir de mocador el dia del casament.

**Biógrafo** `[M3.4 + CO1]`:
> Gràcies per explicar-m'ho. Seguim.
>
> Tens un plat que sigui ben teu, el que et demanen o el que sempre et surt igual? Explica'm qui te'l va ensenyar i una vegada que el vas cuinar per a algú.

**Narrador** `[CO1]`: Els canelons, ja t'ho he dit, que me'ls demana tothom. Me'ls va ensenyar l'àvia Mercè, a Sant Vicenç, amb la carn de l'escudella de Nadal, que no es llençava res. La besamel l'he de fer jo, no deixo que ningú la toqui. L'última vegada, per Sant Esteve, en vaig fer setanta-dos, i el Jordi se'n va menjar dotze, i la Núria, la seva dona, que és de Salamanca, em va demanar la recepta per enèsima vegada, i jo li dic sempre el mateix: a ull, nena, a ull.

**Biógrafo** `[M3.5 + G1]`:
> Ho guardo, Roser. T'envio la següent.
>
> Quina música poses avui quan vas al teu aire? Quina va ser l'última cançó que vas escoltar, i què estaves fent?

**Narrador** `[G1]`: Poso Catalunya Música a la ràdio de la cuina, o la Maria del Mar Bonet, que m'agrada molt. L'última, aquest matí, Què volen aquesta gent, de la Bonet, mentre feia el llit. Aquesta cançó em posa la pell de gallina cada vegada.

**Biógrafo** `[M3.6 + HO9]`:
> D'acord, gràcies. Fem-ne una altra.
>
> Com és el lloc on vius avui, la casa, el barri? Explica'm com hi vas arribar i un moment d'aquests dies que el retrati.

**Narrador** `[HO9]`: Un pis petit, un segon, al carrer de Gràcia, a dues cantonades de la Marta, ja t'ho he explicat com hi vaig arribar. Té un balconet amb geranis i la Singer al menjador. El barri és tranquil, amb una fleca a baix, la de la Montse, que em guarda la barra de quart cada dia. Aquest matí, quan he baixat, la Montse m'ha dit: Roser, avui fas cara de cantar. I tenia raó.

**Biógrafo** `[M3.7 + HO10]`:
> Queda guardat, Roser. Anem a la següent.
>
> Hi ha alguna cosa que t'acompanyi cada dia, el cafè del matí, una cigarreta, el vi del sopar? Explica'm com va començar i algun d'aquests moments.

**Narrador** `[HO10]`: El cafè amb llet del matí, en un got de duralex, com a la fàbrica, que allà ens el donaven així. Des dels catorze anys que el prenc igual, amb dos terrossos de sucre, i la Marta em renya pel sucre. Me'l prenc al balcó, amb els geranis, mirant com obre la fleca.

**Biógrafo** `[M3.8 + G3]`:
> T'he escoltat amb atenció. Continuem.
>
> T'agrada llegir, o ets més de mirar pel·lícules o sèries? A què t'enganxes? Explica'm l'última vegada que les hores et van passar volant amb alguna cosa així.

**Narrador** `[G3]`: Llegir poc, que se'm cansen els ulls. Jo sóc de La Riera, la sèrie de TV3, que no me'n perdia ni un capítol, i ara de Com si fos ahir. L'altre dia la Marta em va posar una pel·lícula a la tele per internet, d'aquestes de plataforma, una de Sorolla, el pintor, i vaig estar tres hores sense moure'm, que es va fer fosc i no vaig ni encendre el llum.

**Biógrafo** `[M26 + CI14]`:
> Gràcies, Roser.
>
> Fins aquí la teva vida d'ara, i ja et conec una mica més. Ha quedat alguna cosa del teu dia a dia sense la seva pregunta? Un costum, algú que veus sovint, una estona del dia que és només teva. Explica-m'ho ara, tranquil·la.
>
> [botones: (No, ja està tot)]

**Narrador** `[CI14]`: [toca: No, ja està tot]

## Bloque 15 · Llegat i tancament

**Biógrafo** `[M25.1 + EN15]`:
> Bé, seguim.
>
> Ja som a l'última part, Roser: el que t'ha deixat tot això i el que vols deixar a la teva família.

**Biógrafo** `[LE1]`:
> Mirant tota la teva vida fins avui, què és el que et fa sentir més orgullosa? Pot ser una cosa grossa o una cosa que ningú més va notar. Explica'm què va ser i el moment en què te'n vas adonar.

**Narrador** `[LE1]`: Els meus fills, que són bona gent. No que siguin infermera i mestre, sinó que són bona gent. Me'n vaig adonar quan es va morir el Josep i el Jordi es va passar un mes dormint al sofà de casa sense que ningú li ho demanés, per si jo em despertava a la nit. I la Marta, que cada dia, cada dia, ve a veure'm. Això ho hem fet el Josep i jo, amb les nostres mans.

**Biógrafo** `[M3.2 + LE2]`:
> Gràcies. Passem a la següent.
>
> Què has après de la vida que t'agradaria que la teva família sabés? Digues-m'ho com un consell, una cosa que vas descobrir tu mateixa vivint.

**Narrador** `[LE2]`: Que canteu. Que canteu encara que ho feu malament, com l'avi Josep. Que cantant les penes pesen menys i les alegries es fan més grosses. I que les coses importants es fan amb les mans: un vestit, uns canelons, un despertador que es torna a muntar. I que no espereu a ser grans per dir t'estimo, que després no hi ha temps.

**Biógrafo** `[M3.3 + FU1]`:
> Ho he apuntat, gràcies. Vinga, una altra.
>
> Queda alguna cosa que encara vulguis fer? Explica-m'ho com si ja estigués passant: on ets, amb qui, què veus.

**Narrador** `[FU1]`: Sí. Cantar el Rossinyol una altra vegada. Sóc a la Seu de Manresa, on em vaig casar, amb la coral, i la Laia al meu costat, i a la primera fila la Marta, el Jordi i els nens. I quan arriba la part de contralt no callo, la canto. I la canto per al Josep. Això vull fer, abans d'anar-me'n.

**Biógrafo** `[M3.4 + LE7]`:
> Gràcies per explicar-m'ho. Seguim.
>
> Si la teva vida fos un llibre, quin títol li posaries? Digues-me'l i explica'm per què aquest.

**Narrador** `[LE7]`: La contralt de la fàbrica. Perquè vaig començar entre telers sense poder ni sentir-me la veu, i he acabat cantant en un teatre i a Roma. I perquè la meva veu, la de contralt, és la de sota, la que no es nota però aguanta les altres. Com la meva vida, mira: aguantant.

**Biógrafo** `[M3.5 + FO1]`:
> Ho guardo, Roser. T'envio la següent.
>
> Una altra cosa. Hi ha alguna foto, al mòbil o en algun calaix de casa, que vulguis que quedi per sempre en aquest llibre? Si la tens, fes-li una foto i envia-me-la, i després explica'm en un àudio què s'hi veu i qui hi surt. Pren-te el temps que necessitis per buscar-la: la pregunta següent te l'enviaré quan m'arribi la foto o em diguis alguna cosa. I si no la trobes, no passa res: el llibre tira endavant igualment, i me la pots enviar més endavant.
>
> [botones: (No tinc cap foto)]

**Narrador** `[FO1]`: La foto la buscaré, que és la de la primera comunió que t'he dit, la de la tauleta de nit. Hi surto jo amb el vestit que em va fer la mare, i darrere el pare amb corbata i el Ramon fent ganyotes. La Marta me la farà amb el mòbil i te l'enviaré.

**Biógrafo** `[M26 + LE9]`:
> Gràcies, Roser.
>
> Arribem al final. Hi ha alguna cosa que en tot aquest temps no t'he preguntat i vols que surti al llibre? Una persona, un lloc, una història que t'ha quedat rondant pel cap.

**Narrador** `[LE9]`: Només que gràcies a qui m'ha regalat això, que segur que ha estat la Marta, o la Laia. M'ha fet recordar coses que tenia guardades al fons de l'armari. I que quan llegeixin el llibre, el llegeixin en veu alta, que les coses dites sonen millor.

**Biógrafo** `[LE8]`:
> Ara sí, parla a la teva família, als qui llegiran aquest llibre. El que els diries i el que els desitges si els tinguessis asseguts al davant, sense pressa, d'un en un. Tens tot el temps que vulguis.

**Narrador** `[LE8]`: Marta, filla, ets la meva roca, però deixa't cuidar tu també de tant en tant. Jordi, no perdis mai aquesta manera de fer riure, que és la del teu pare. Laia, canta sempre, i quan arribis a la part de contralt pensa en l'àvia. Pol, ets el més callat, però jo et veig, eh, ja ho saps. Arnau, l'any que ve el tomàquet més gros serà meu, que consti. I a tots: estimeu-vos molt, mengeu canelons per Sant Esteve, i quan em trobeu a faltar, aneu a l'hort i canteu fluixet. Jo hi seré.

**Biógrafo** `[FIN]`:
> Hem arribat al final, Roser. Gràcies per cada àudio, per cada història i per la confiança d'explicar-les així. Amb tot el que m'has explicat farem un llibre que quedarà a la teva família per sempre. Abans d'escriure'l podràs repassar el que has explicat, per si vols canviar o afegir alguna cosa. I si t'ha quedat alguna foto per enviar, envia-me-la per aquí quan la trobis: hi entrarà igualment. Ha estat un plaer enorme escoltar-te.
