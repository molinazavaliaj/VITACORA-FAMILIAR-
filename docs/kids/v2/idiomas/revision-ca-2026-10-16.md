# Kids en catalán · revisión del método de Familiar (16/10/2026)

**Qué es:** la revisión que faltaba del catalán de Kids, con el mismo método que el catalán de la entrevista Familiar (`docs/v3/entrevista/banco-ca.md`, cabecera, y `docs/v3/entrevista/catala/revision/`). Un agente distinto del que tradujo volvió el catalán al castellano sin mirar el castellano, marcó lo que fallaba, recién después comparó con la versión de España aprobada, y pasó todo por el corrector. **No se tocó ningún texto**: esto es solo el informe.

**Qué se revisó:**
- [`banco-ca.md`](banco-ca.md): las 271 líneas `ID | text` y la tabla de la web de abajo (lo que recibe el chico y el padre por WhatsApp).
- [`plantillas-meta-kids-ca.md`](plantillas-meta-kids-ca.md): las 13 plantillas. Comprobado por script que los cuerpos son **idénticos** a BIEN-CHICO, BIEN-CHICO-PL, BIEN-PADRE, AVISO-PADRE, RECORD-A-4/8, RECORD-B/B-8, PREG-NUEVA-CHICO/PADRE, TERMINO-PADRE y FINAL-CHICO/PL del banco, así que **todo lo que se diga de esos IDs vale también para la plantilla `_ca` correspondiente**.
- `VITACORA FAMILIAR-kids-panel/docs/rediseno-2026-10/kids/textos-ca-2026-10-16.md`: solo la columna «Català» (panel, voz, mails, confirmación, compra, mails del libro, textos del libro, `padre.ts`).

**Cómo:**
1. **Vuelta a ciegas.** Se leyó solo el catalán (de la web se extrajo por script solo la última columna) y se volvió al castellano tal como lo entiende un lector. Aviso honesto: `banco-ca.md` trae dentro su propia tabla «Canvis que no són només de llengua» con la columna de España; al leer el archivo entero quedó a la vista. La vuelta se hizo sobre las líneas de texto, y la comparación con `banco-es-ES.md` y con la columna España de la web se hizo después. Lo que no está en A ni en B se volvió al castellano con el mismo sentido que es-ES.
2. **Corrector.** LanguageTool en catalán (`api.languagetool.org/v2/check`, `language=ca-ES`), 7 tandas de unos 5.000 caracteres con pausas, 440 textos únicos (los repetidos se mandaron una sola vez). Antes de mandar, las marcas se cambiaron por algo que el corrector entiende: `{{petit/petita}}` → la forma masculina, `{{1}}`, `${apodo}`, `{precio}` → «Pau», `\n\n` → salto de línea. 59 avisos: 21 aceptados (van en A, con la regla) y 38 descartados (C). No hizo falta Softcatalà.

**Resumen:** A = 36 arreglos de lengua para aplicar directo (algunos son de muchos IDs a la vez). B = 10 cambios de sentido para que decida Naza. C = 38 avisos del corrector descartados, agrupados en 13 filas. Lo más grave está arriba en A (A1 a A8).

---

## A. Errores de lengua para aplicar directo

Orden: primero lo que un catalán leería como error o con otro sentido, después lo que suena a traducción, al final lo de normativa fina. «Regla» es la del corrector cuando la marcó; si no, la razón.

| # | ID | Dice | Debería | Por qué / regla |
|---|---|---|---|---|
| A1 | BIEN-CHICO, BIEN-CHICO-PL (y plantillas 1 y 2) | No s'ha de contestar bé ni malament, expliques com et surti. | No hi ha respostes bones ni dolentes, expliques com et surti. | «No s'ha de» en catalán es prohibición («no se debe»); el sentido de es-ES es «no hace falta». Ver B5. |
| A2 | BIEN-PADRE (y plantilla 3) | Llegeix-l'hi | Llegeix-la-hi | Es «la pregunta» + «li». La combinación de «la» + «li» es «la hi»; «l'hi» es «el/ho» + «li» (GIEC, combinaciones de pronombres débiles). |
| A3 | web `canalAutoriza` (y en `banco-ca.md`, tabla web, COMPRA-2-CANAL-A) | …qui autoritza que escrivim a aquest número. / …que li escrivim… | …qui autoritza que escriguem a aquest número. | «Autoritzar que» pide subjuntivo; «escrivim» es indicativo. |
| A4 | K31 | …la que ja has explicat mil vegades i tothom riu igual. | …la que ja has explicat mil vegades i encara fa riure tothom. | «Igual» con el sentido de «aun así» es castellanismo; en catalán se lee «todos ríen de la misma manera». Ver B6. |
| A5 | X4-5 | Explica'm una frase que algú et va dir… | Digues-me una frase que algú et va dir… | «Explicar una frase» es explicar qué quiere decir. Para pedir que la repita, «digues-me». Ver B7. |
| A6 | K36-OP | …i se't va passar de pressa? | …i et va passar de seguida? | PASSAR_SE: «passar-se-li» (el enfado) es pronominal incorrecto; es «passar» a secas. «De seguida» es el «rápido» de este caso. |
| A7 | K40-OP | …perquè se't passi? | …perquè et passi? | PASSAR_SE, igual que A6. |
| A8 | FINAL-CHICO, FINAL-CHICO-PL (y plantillas 10 y 10b) | Bé {{1}}, fins aquí hem arribat. | Bé, {{1}}, ja hem acabat. | FINS_AQUI_PODIEM_ARRIBAR: «fins aquí hem arribat» es expresión incorrecta en catalán (calco). Coma de vocativo antes y después del nombre. Ver B9. |
| A9 | BIEN-CHICO, BIEN-CHICO-PL, ENTRADA-2, K12 | Anem amb la primera? · Ara anem amb la gent de la teva vida. · Anem amb els germans. | Comencem amb la primera? · Ara parlem de la gent de la teva vida. · Ara, els germans. | Calco de «vamos con». En catalán «anar amb algú» es ir acompañado. Es el mismo caso que «anem per una altra» de la guía del catalán de Familiar. |
| A10 | KP-ESTADO-ESPERA-A (web) | …quan premi «Vinga, som-hi». | …quan premi «D'acord, som-hi». | El botón real del banco catalán (BIEN-CHICO-B1) es «D'acord, som-hi», y AVISO-PADRE ya lo cita así. La web dice que «no hay banco de Kids en catalán», pero ahora sí hay. Ver B8. |
| A11 | Todos los «Hola {{1}}.»: BIEN-CHICO, BIEN-CHICO-PL, BIEN-PADRE, AVISO-PADRE, PREG-NUEVA-CHICO, PREG-NUEVA-PADRE, RECORD-A-4, RECORD-A-8, RECORD-B, RECORD-B-8, TERMINO-PADRE (y sus plantillas) | Hola {{1}}. | Hola, {{1}}. | COMMA_IJ: el vocativo va entre comas. Para Meta no cambia nada, porque `{{1}}` sigue sin ir ni al principio ni al final. |
| A12 | B-FOTO-NOTENGO | …explica-m'ho en un àudio i serveix igual. | …explica-m'ho en un àudio i també val. | «Servir igual» es castellanismo, por el mismo motivo que A4. |
| A13 | K33-OP | …i al final va sortir? | …i al final et va sortir bé? | Sin el «et» y sin «bé», «va sortir» se lee «salió (de algún lugar)». |
| A14 | CIERRE-3 | …que no t'he preguntat i va al llibre? | …que no t'he preguntat i vols que vagi al llibre? | Así como está se lee «y que va (de todos modos) al libro». Falta el verbo de querer, como en CIERRE-1. |
| A15 | CIERRE-4 | …que no t'he preguntat i vols al llibre? | …que no t'he preguntat i vols que surti al llibre? | En catalán «voler una cosa al llibre» queda cojo. |
| A16 | K14-FOTO | …i explica'm com et vas fer d'aquest equip. | …i explica'm com vas començar a ser d'aquest equip. | «Fer-se d'un equip» es calco de «hacerse de un equipo». Además saca el segundo «d'aquest equip» seguido. |
| A17 | K15-FOTO | …explica'm què tenen. | …explica'm què tenen d'especial. | «Què tenen» a secas es «qué poseen». Es el «qué tienen (de especial)» del castellano. |
| A18 | K21-FOTO | …explica'm què té que t'agrada. | …explica'm per què t'agrada. | Calco de «qué tiene que te gusta». «Per què t'agrada» no marca el género del youtuber. |
| A19 | K23-FOTO | Què té aquesta assignatura? | Què t'agrada d'aquesta assignatura? | Igual que A17. |
| A20 | K21 | …d'això que saps que fas bé. | …d'aquelles coses que saps fer bé. | «D'això que» es calco de «de eso que». |
| A21 | K8 | Pensa en el lloc de casa teva on estàs més. | Pensa en el lloc de casa teva on passes més estona. | «On estàs més» es calco de «donde más estás». |
| A22 | CIERRE-1 | Això era el de {{petit/petita}}. | Això era el de quan eres {{petit/petita}}. | «El de petit» a secas no se dice. Con «quan eres» queda claro y la marca sigue igual. |
| A23 | ENTRADA-4 | …només tu explicant. | …només expliques tu. | Gerundio calcado del castellano («solo tú contando»). |
| A24 | K12-OP | …t'agafa sense demanar-ho? | …t'agafa sense demanar permís? | «Demanar-ho» no se refiere a nada. Lo natural es «sense permís». |
| A25 | X2-9 | …et va cobrir perquè no et renyessin. | …et va tapar perquè no et renyessin. | «Cobrir» es tapar físicamente. Encubrir a alguien es «tapar» (DIEC, tapar 3) o «encobrir». |
| A26 | K1-OP, X1-1 | …de quan eres un bebè… | …de quan eres un nadó… | «Bebè» está en el DIEC, pero la palabra de todos los días en Catalunya es «nadó». |
| A27 | FINAL-CHICO-PL (y plantilla 10b) | …que són qui t'han fet aquest regal. | …que són els qui t'han fet aquest regal. | Con un antecedente en plural, la forma normal es «els qui». |
| A28 | PANEL-GUIA p3 (web y tabla de `banco-ca.md`) | …"Explica'm la vegada que…" treu molt més que… | …"Explica'm la vegada que…" dona molt més que… | «Treure» por «sacar (provecho)» es calco. |
| A29 | KP-CORR-DICE, KP-CORR-ES, KP-CORR-AYUDA, KP-ERR-CORR-VACIO (web) | Com diu · Com és · posa com diu i com és · Omple com diu i com és. | Què hi diu · Com ha de ser · posa què hi diu i com ha de ser · Omple què hi diu i com ha de ser. | «Com diu» se lee «¿cómo dice (él)?». La etiqueta de un campo tiene que entenderse sola. |
| A30 | KP-ERR-OCUPADO (web) | Just s'estava desant un altre canvi. | En aquell moment s'estava desant un altre canvi. | «Just» por «justo (en ese momento)» es calco. |
| A31 | web `tuNombrePista`, `suNombrePista` | Nom i cognom | Nom i cognoms | En Catalunya hay dos apellidos y los formularios piden «Nom i cognoms». Es también lo que dice la tabla de `banco-ca.md`. |
| A32 | K18, K19, B-FOTO-NOTENGO | …de la teva família però abans no… · …ni de l'escola però és important… · …així però no la tens a mà… | …de la teva família, però abans no… · …ni de l'escola, però és important… · …així, però no la tens a mà… | COMMA_PERO: «però» va con coma delante en casi todos los casos. |
| A33 | CAP-5 | Per quan siguis gran (la càpsula) | Per a quan siguis gran (la càpsula) | PER_QUAN: para un momento futuro es «per a quan». Es título del libro, así que conviene que esté bien. |
| A34 | B-SEGUIR | …o la deixem per demà? | …o la deixem per a demà? | PER_PER_A: para el destino en el tiempo, la normativa pide «per a». En el habla se oye «per demà», así que es arreglo fino. |
| A35 | X3-3 | Explica'm el dissabte passat, des que… | Explica'm com va anar dissabte passat, des que… | EL_DILLUNS_DILLUNS: el día inmediato va sin artículo. Con «com va anar» la frase queda natural, igual que X3-4. |
| A36 | K35-OP, X2-1 | …sense que l'hi demanessis? · …et va costar demanar-l'hi. | …sense que li ho demanessis? · …et va costar demanar-li-ho. | «Li» + «ho» en registro escrito es «li ho». «L'hi» es oral. Es arreglo fino. |

**Opcionales (no son error, pero suenan mejor):** K18-OP «el primer àpat» → «el primer dinar o sopar» («àpat» es palabra de adulto). K21-FOTO «Mires algun youtuber» → «Segueixes algun youtuber», y el botón «No en miro cap» → «No en segueixo cap» (17 letras). K47-OP «si li pregunten» → «si li preguntessin», que concuerda con «diria». KP-LIBRO-CONFIRMAR «Quan l'aproves» → «Quan l'aprovis», porque es algo que todavía no pasó.

**Las dos versiones catalanas de la web no coinciden.** La tabla de abajo de `banco-ca.md` («Textos de la web… con ID en mensajes.md») es anterior al archivo de la web (`textos-ca-2026-10-16.md`, revisado contra el código). Donde difieren, la buena es la de la web, y la tabla de `banco-ca.md` tendría que copiarla. Las diferencias son estas:

| ID | `banco-ca.md` (tabla web) | Web (la buena) |
|---|---|---|
| COMPRA-2-APODO | Així **el** saludem als missatges. | Així li diem als missatges. («el» marca masculino para una nena) |
| COMPRA-2-CANAL-A | …qui autoritza que **li escrivim**… | …que escrivim… (y con A3, «que escriguem») |
| COMPRA-2-HORA | Millor **en tornar** de l'escola… | Millor quan torni de l'escola… |
| COMPRA-3-TEMAS | (la parella **de la seva mare o del seu pare**, …) | (la parella de la mare o del pare, …) |
| COMPRA-3-DEBAJO | Tota la resta té botó… la salta i seguim. | Tota la resta té un botó… se la salta i seguim. |
| COMPRA-2-NOMBRE, COMPRA-2-EDAD | Així va a la **portada**. · Va a la **portada**… | Així va a la tapa. · Va a la tapa… |
| COMPRA-2-REGALA | Així ho **anomena** el primer missatge. Escriu-ho com ho diries a qui **el** rep. | Així ho diu el primer missatge. Escriu-ho com ho diries a qui ho rep. |
| PANEL-GUIA-EJ | …menjant una **panotxa**. | …menjant una poma. (Naza ya eligió «manzana» en España) |
| COMPRA-1-NOMBRE | Nom i cognoms | Nom i cognom (acá la buena es la de `banco-ca.md`, ver A31) |

---

## B. Cambios de sentido respecto de es-ES (para que decida Naza)

Solo lo que un lector catalán entendería distinto de lo que dice la versión de España aprobada, o donde las dos dicen algo raro. Lo que la tabla «Canvis» de `banco-ca.md` ya explica y se lee igual (vambes, tiet, endreçar, estima, empenteta, renyades, petar-se de riure, captura, etc.) no se repite.

| # | ID | Catalán | Vuelta al castellano (a ciegas) | es-ES (aprobado) | Qué cambió y qué recomiendo |
|---|---|---|---|---|---|
| B1 | CAP-1 | Els primers anys | Los primeros años | De pequeño | El título del capítulo ya no dice «de pequeño», dice «los primeros años». Está anotado en el banco: es para no marcar género en un título. Se lee bien y dice casi lo mismo. **Recomiendo dejarlo.** |
| B2 | K14-OP | I un lloc on et van portar i et van dir "aquí hi venia jo de {{petit/petita}}"? | ¿Y un sitio al que te llevaron y te dijeron «aquí venía yo de pequeño/pequeña»? | …"aquí venía yo de pequeñ{{o/a}}"… | **Error que está también en es-ES (y seguramente en rioplatense).** La marca toma el género del chico, pero la frase la dice el adulto. Si la nena va con su abuelo, el abuelo dice «de pequeña». **Recomiendo** en catalán «aquí hi venia jo quan tenia la teva edat», y en es-ES «aquí venía yo cuando tenía tu edad». Así no marca género y dice lo mismo. Toca es-ES, por eso lo decide Naza. |
| B3 | K44-OP | I un lloc d'ara que vols que torni quan ho llegeixis? | ¿Y un sitio de ahora que quieres que vuelva (que regrese) cuando lo leas? | ¿Y un sitio de ahora que quieres que vuelva cuando lo leas? | Las dos dicen que el lugar «vuelve», y se entiende mal. Si la idea es volver a ese lugar, **recomiendo** en catalán «I un lloc d'ara on vulguis tornar quan ho llegeixis?», y en es-ES «¿Y un sitio de ahora al que quieras volver cuando lo leas?». Si la idea es otra (que el lugar siga existiendo), hay que decirlo y se reescribe. |
| B4 | K46, K46-OP | El dia que obris el sobre, què vols que llegeixi de tu d'ara? · I què creus que pensarà quan llegeixi això? | El día que abras el sobre, ¿qué quieres que lea (él o ella) de ti de ahora? · ¿Y qué crees que pensará cuando lea esto? | …¿qué quieres que lea de ti de ahora? · ¿Y qué crees que va a pensar cuando lea esto? | Igual en los dos idiomas. Quien lee no tiene sujeto: «obris» es tú, «llegeixi» es otra persona. Un chico de 11 puede no entender que esa persona es él de grande. Se entiende por K43 («la persona que seràs»). **Recomiendo dejarlo como en España**; solo lo marco. |
| B5 | BIEN-CHICO, BIEN-CHICO-PL | No s'ha de contestar bé ni malament | No se debe contestar bien ni mal | No hay que contestar bien ni mal | En catalán se lee como prohibición. Con A1 («No hi ha respostes bones ni dolentes», «no hay respuestas buenas ni malas») vuelve al sentido de España. **Aplicar A1.** |
| B6 | K31 | …i tothom riu igual | …y todos se ríen de la misma manera | …y todos se ríen igual (aun así) | El «igual» de España es «aun así»; en catalán no tiene ese sentido. Con A4 («i encara fa riure tothom», «y todavía hace reír a todos») vuelve el sentido. **Aplicar A4.** |
| B7 | X4-5 | Explica'm una frase que algú et va dir una vegada… | Explícame (qué significa) una frase que alguien te dijo una vez… | Cuéntame una frase que alguien te dijo una vez… | En catalán «explicar» es contar y también explicar. Con un objeto como «una frase» gana explicar. Con A5 («Digues-me», «Dime») vuelve el sentido. **Aplicar A5.** |
| B8 | KP-ESTADO-ESPERA-A (web) | …quan premi «Vinga, som-hi». | …cuando pulse «Venga, vamos». | …cuando pulse «Vale, vamos». | El panel le dice al padre un botón que el chico no va a ver. El botón real en catalán es «D'acord, som-hi» («Vale, vamos»). **Aplicar A10**; así coincide también con AVISO-PADRE. |
| B9 | FINAL-CHICO, FINAL-CHICO-PL | Bé {{1}}, fins aquí hem arribat. … Fins aviat. | Bueno, {{1}}, hasta aquí hemos llegado. … Hasta pronto. | Bueno {{1}}, hasta aquí llegamos. … Nos vemos pronto. | «Fins aquí hem arribat» es incorrecto en catalán, y con A8 queda «Bé, {{1}}, ja hem acabat.» («Bueno, {{1}}, ya terminamos.»), que dice lo mismo con otras palabras. «Fins aviat» es «hasta pronto», que en España es «nos vemos pronto»: no promete un encuentro, igual que el original. **Recomiendo aplicar A8 y dejar «Fins aviat».** |
| B10 | Pie de los mails de la fábrica (web) | A cada família hi ha un llibre per escriure. | En cada familia hay un libro por escribir (que espera que lo escriban). | En cada familia hay un libro sin escribir. | El matiz cambia poco: España dice que el libro todavía no existe, el catalán que está esperando que alguien lo escriba. Es el pie que ya usa la web de la casa en catalán. **Recomiendo dejarlo** para que todos los mails digan lo mismo. |

---

## C. Avisos del corrector descartados

59 avisos de LanguageTool `ca-ES`: 21 aceptados (en A: COMMA_IJ ×11, PASSAR_SE ×2, FINS_AQUI_PODIEM_ARRIBAR ×2, COMMA_PERO ×3, PER_QUAN en CAP-5, PER_PER_A, EL_DILLUNS_DILLUNS) y 38 descartados:

| # | ID | Regla | Aviso | Por qué se descarta |
|---|---|---|---|---|
| C1 | ENTRADA-1 | PER_QUAN | «Comencem per quan…» → «per a quan» | Es «començar per» (empezar por). No es «per a quan» (para cuando). Está bien. |
| C2 | K4-FOTO | TOT_I_AIXI | «tot i així» → «així i tot» | Se usan las dos y las dos se entienden igual. Lo del corrector es preferencia de estilo; «tot i així» es lo que dice un chico. |
| C3 | K27-OP | ESCOLTAR_SENTIR | «has escoltat tant» → «sentit» | «Escoltar» es escuchar a propósito, y una canción que te pones mil veces se escucha. El corrector piensa en «oír». |
| C4 | KP-GUARDADO, KP-PENDIENTE | NOMS_OPERACIONS_DESAT | «Desat» → «Desament» | Es el participio («Guardado.»), una confirmación. No es el nombre de la operación. |
| C5 | KP-LIBRO-ERR-YA-APROBADO | ESTAR_CAUSAT | «ja està aprovat» → «ja és aprovat» | «Estar» con participio para un estado que resulta de algo lo admite la GIEC. «Ja és aprovat» suena a libro. |
| C6 | web `apodoAyuda` | LI_ELS_DIGUÉ | «Així li diem» → «els» | «Li» es el chico, en singular. El corrector creyó que se refería a «els missatges». |
| C7 | web `canalA` | A_LHORA_ALHORA | «A l'hora» → «Alhora» | Es «a la hora (que elegiste)». No es «a la vez». |
| C8 | web `proximamente` | PROPER | «Properament» → «Aviat» | «Properament» está en el DIEC y es lo habitual en una web. Es preferencia de estilo. |
| C9 | KP-ERR-NO-KIDS, `canalA`, `tituloPagina`, `proximamenteTexto`, `volver` | MORFOLOGIK (×5) | «Vitàcora» desconocida | Es la marca. |
| C10 | KP-CORTO-PAGO, KV-ETIQUETA-AUDIO | UPPERCASE_SENTENCE_START (×2) | sin mayúscula al principio | Son trozos que van en medio de una frase del panel («…confirmant el pagament»). |
| C11 | web `quienes`, tabla de `banco-ca.md` COMPRA-3-TEMAS | PUNT_FINAL (×2) | falta punto final | Son listas de opciones. No son frases. |
| C12 | web `legalAntes / terminos / legalDespues` | COMMA_PARENTHESIS_WHITESPACE | espacio antes del punto | Son tres trozos que el código pega. El espacio es del archivo, no del texto. |
| C13 | tabla de `banco-ca.md` (COMPRA-1-NOMBRE, -WA, -CORREO, COMPRA-2-NOMBRE, -APODO, -GENERO, -EDAD, -REGALA, -HORA, COMPRA-3-FOTOS) | MORFOLOGIK, POR_PER (×19) | «placeholder», «ayuda», «libre», «por defecto» | Son las palabras en castellano de la tabla que explican qué es cada campo. No son texto del producto. Los textos catalanes de esas filas no tuvieron avisos. |

**Lo que el corrector no ve.** Ninguno de los errores más graves de A (A1 a A5, A9 y A13 a A21) lo marcó el corrector: son calcos y cambios de sentido que solo salen en la vuelta al castellano. Igual que en Familiar, falta la lectura de alguien de Catalunya con un hijo de 11 antes de prender el catalán.
