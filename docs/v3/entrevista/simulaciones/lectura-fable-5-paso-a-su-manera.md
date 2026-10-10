# Lectura de Fable: simulación 5 (Manuel, 70, el que dice paso a su manera, inventado)

**Qué es:** la lectura completa de [`5-paso-a-su-manera.md`](5-paso-a-su-manera.md), hecha dos veces: como la viviría Manuel (gallego, emigró solo a los 19, casado con Rosa desde 1982, dos hijos, un nieto, tuvo un almacén, reservado) y como un biógrafo con oficio. Este narrador estaba pensado para una sola cosa: ver qué hace el código cuando alguien no dice "paso" sino "Siguiente.", "De eso no.", "Mejor otra.", "Eso me lo guardo.". Lo que ya apareció en la simulación 1 (S1 a S6, en [`hallazgos.md`](hallazgos.md)) no se vuelve a explicar: se anota "otra vez" con los IDs y cuántas veces. Nada de esto está decidido: decide Naza.

**Cómo le fue a Manuel, en dos líneas.** Contó una vida entera y linda (la abuela que volvió de Cuba, el ternero en la casa del cura, el beso en el piso de cemento del almacén, la escobita de Tomás). Dijo que no a su manera nueve veces; el código entendió una sola ("Paso." en PE1, justo después de que AV11 le dijo la palabra). Las otras ocho pasaron como si hubiera contado algo, y tres veces el biógrafo le agradeció por confiarle lo que acababa de negarse a contar.

---

## 1. Fallas nuevas (de la más grave a la más leve)

### N1 (grave): el "paso" dicho con otras palabras no existe para el código

Manuel no usa la palabra "paso" salvo cuando se la acaban de decir. El código busca solo esa palabra al principio; "Eso no.", "De eso no.", "Mejor otra.", "Eso me lo guardo." arrancan con "eso" o "de" y no entran ni en "paso" ni en "no" corto. Consecuencia doble: el acuse que sigue agradece lo que no contó, **y la respuesta queda guardada como si fuera contenido** (`contoAlgo` da verdadero): para el escritor y el dashboard, la respuesta de Manuel a "tus viejos de grande" es "Eso no. Mejor otra.".

| ID | Lo que dijo Manuel | Mensaje exacto del biógrafo después | Veces |
|---|---|---|---|
| PG1 | "Eso no. Mejor otra." | "Gracias por contármelo. Seguimos." (M3.4) | 1 |
| AD15 | "De eso no. La adolescencia fue normal, trabajar, amigos. Lo difícil llegó cuando crecí más." | "Te escuché. Gracias por confiármelo." (M4.2) | 1 |
| JU17 | "De eso no. Hay cosas que prefiero guardarme." | "Lo guardo tal como lo contaste. Gracias." (M4.3) | 1 |
| FI7 | "Eso me lo guardo. Viví tiempos difíciles de política acá en Argentina, pero no quiero hablar de eso…" | "Gracias, Manuel." (M26, porque seguía el cierre CI12) | 1: salió bien de casualidad |

Lo peor es JU17: él dice "prefiero guardarme" y el biógrafo contesta "lo guardo tal como lo contaste": suena a que se lo quedó igual. Y PG1: "Gracias por contármelo" a un hombre que acaba de cerrar la puerta sobre sus padres (después, en LU4, cuenta solo la última vez que vio bien a su padre: el tema le pesa).

**Un dato que ayuda a decidir.** La única vez que Manuel dijo "paso" fue en PE1, con AV11 recién leído ("con un *paso* alcanza") y M1 debajo. En PG1, AD15, JU17 y FI7 no había M1 (desde la corrección 2 va en 12 preguntas nomás) y él inventó sus propias palabras. Es decir: sacar M1 de casi todas las preguntas, que fue una buena decisión, obliga a que el código entienda el "paso" de cada uno.

**Propuesta A (regla de código, en una línea):** además de "paso", contar como paso toda respuesta de **hasta 12 palabras** (sin muletillas) que **arranca con una de estas frases** (se admiten "eso", "esa", "de eso", "de esa", "ahí" adelante):

- paso · paso de esa · la paso · esa la paso
- siguiente · la siguiente · la que sigue · otra · la otra · mejor otra · otra pregunta · vamos a otra · pasemos a otra · dale con otra · seguí · seguí con otra · seguimos con otra
- salteala · saltala · salteá esa · esa salteala
- esa no · eso no · de eso no · ahí no · esa no va · eso no va · no va
- no quiero hablar de eso · prefiero no hablar de eso · prefiero no · mejor no · ni hablar · no, gracias
- eso me lo guardo · me lo guardo · eso queda para mí · eso es mío · eso no lo cuento · eso no lo toco · no entro ahí · dejémoslo ahí · dejalo ahí · lo dejamos ahí

Con el tope de 12 palabras no hay riesgo con "Eso no me lo olvido más, fue el día que…" (largo: es una historia) ni con "Otra cosa que me acuerdo…" ("otra cosa" queda afuera de la lista). Si la frase de la lista está y la respuesta es **más larga** (AD15, FI7), no es paso, pero tampoco "contó algo": va el acuse neutro (M25) y no cuenta para las que dependen. Con esa regla, en esta charla los cuatro casos de arriba salen bien.

**Propuesta B (texto):** un acuse propio para cuando se niega en una pregunta sensible (hoy iría M25 "Bien, seguimos.", que después de "hay cosas que prefiero guardarme" queda seco). Tres que rotan, con la voz del biógrafo:
- M27.1: Está bien, {{nombre}}. Eso queda tuyo. Seguimos por otro lado.
- M27.2: Claro. Lo dejamos ahí, sin problema.
- M27.3: Perfecto, {{nombre}}. Hay cosas que son de uno. Vamos con otra.

En una pregunta común (PG1) alcanza con M21 ("Dale, la salteamos. Vamos con otra."), que ya existe.

**Y los botones de Naza:** este narrador es el argumento más fuerte a favor. Un reservado no escribe "paso": toca un botón. Si las preguntas sensibles y las que abren tema llevan un botón "Prefiero no" al lado de la opción de mandar audio, la lista de arriba pasa a ser un respaldo, no la única defensa.

### N2 (media): un "no" con "pero" adentro deja de ser "no", y a un hombre casado 44 años le llegan "seguiste por tu cuenta" y "otro amor"

La regla dice que si aparece "pero" o "aunque" el "no" viene con algo para contar ("Nunca lo pensé, pero…"). En AM9 el "pero" aparece cuando el no ya está dicho y redicho:

| ID | Lo que dijo Manuel | Mensaje exacto del biógrafo después | Qué entendió el código |
|---|---|---|---|
| AM9 | "No, seguimos juntos. Cuarenta y tantos años. No fue fácil siempre, pero no nos separamos. Ella está ahí todavía." (19 palabras, con "pero") | "Gracias por animarte a contarlo. Cuando quieras, seguimos." (M4.4), y después AM19 "¿hubo un tiempo en que seguiste por tu cuenta?" y AM16 "Si después de esa historia hubo otro amor…" | Que la historia tuvo un final. AM13 (la pelea que da risa), la única que le correspondía, no llegó nunca. |

Es medio S2 otra vez (el largo) y medio nuevo (el "pero"). Manuel lo llevó con paciencia ("No, de ahí en adelante fue con Rosa. Eso es todo." / "No, nada de eso. Solo Rosa."), pero un narrador menos manso pensaría que el biógrafo no escuchó "seguimos juntos".

**Propuesta (código, una línea):** "pero"/"aunque" solo anulan el "no" si aparecen **dentro de las primeras 5 palabras** ("Nunca lo pensé, pero…" sigue afuera; "No fue fácil siempre, pero no nos separamos" sigue siendo no). Y en AM9, como en los cierres (S2), tope de 40 palabras para el "no". Con las dos cosas, AM9 se lee como no, van AM13 y no van AM19 ni AM16. (AM9 sigue en el plan B, ya se sabe; esto es lo mínimo que lo arregla sin modelo.)

### N3 (media): la migración es la columna de esta vida y el núcleo no tiene ninguna pregunta sobre la llegada

Manuel contó la partida cinco veces (AD12 la decisión, JU1 la despedida en el puerto, JU8 a quién se lo dijo primero, GI1 bajar del barco en La Boca, FAM1 la valija) y el título de su libro es "El que se fue sin saber si volvía". Nadie le preguntó por el primer día en Buenos Aires, la casa del tío, entender cómo hablaban, las cartas a Galicia, cuándo dejó de sentirse de paso. Las dos preguntas que lo hacen existen y dependen de JU8 (`si:JU8`): JU10 ("¿hubo alguien que te dio una mano al llegar?") y JU11 ("un día uno se da cuenta de que ya es de ahí"), pero son **extra**, y la extra no se ofrece. La dependencia está escrita y no se cumple nunca.

Ya está anotado que JU1 y JU8 se pisan (plan B), pero esto es otra cosa: no es que pregunta de más, es que **falta** la mitad del tema para el único tipo de narrador al que el tema le importa.

**Propuesta (banco, una línea):** JU10 pasa al núcleo (sigue con `si:JU8`; a quien no se mudó no le llega). Si el núcleo no admite una más, JU8 podría cambiar de pregunta y pedir la llegada en vez de la decisión, que ya sale en JU1: "Si alguna vez te fuiste a vivir a otra ciudad o a otro país, contame la llegada: el primer día, dónde dormiste esa noche, quién te esperaba y qué fue lo que más te costó al principio. Si nunca te mudaste, decime no y seguimos."

### N4 (media, para el escritor más que para la entrevista): los silencios caen en el lugar equivocado

Manuel se negó en PG1 (los padres de grande) y en PE1 (pérdidas), y sin embargo contó la enfermedad del padre y la última vez que lo vio bien (LU4), la muerte del tío (TR3), la de Carmelo (AS1) y la silla vacía para su padre en la cena (AS9). Es lo normal en un reservado: no entra por la puerta grande, entra por el costado. La entrevista lo aguantó bien porque los cierres y las otras preguntas le dieron por dónde. Lo que hay que cuidar es después: con el código de hoy, el escritor recibe para PG1 el texto "Eso no. Mejor otra." y para PE1 "Paso." (esto sí), y tiene que armar el capítulo de las pérdidas con lo que apareció en Lugares y en Amistades. Con N1 arreglado, PG1 queda como paso y no ensucia. Lo del hermano José ("con mi hermano José hubo… bueno, eso me lo guardo", PE4) quedó protegido porque HE2 (hermanos de grandes) es extra y no llegó; si algún día HE2 entra al núcleo, convendría que lea PE4.

### N5 (leve): HS1 le pregunta a un hombre casado si crió solo

| ID | Mensaje exacto del biógrafo | Lo que ya había dicho | Veces |
|---|---|---|---|
| HS1 | "¿Cómo viviste la crianza de tus hijos? ¿La llevaste solo, o tuviste alguna ayuda cerca?" | HI0: "Los dos con Rosa." | 1 |

Manuel lo resolvió con elegancia ("Rosa fue quien más se dedicó a los hijos, eso hay que decirlo claro"), pero la pregunta está escrita pensando en quien crió sin pareja. **Propuesta de texto:** "¿Cómo fue criar a tus hijos? Quién estaba cerca, cómo se repartían las cosas, o si te tocó llevarla solo. Contame un día de esa época que te acuerdes bien."

### N6 (leve): "Ya lo guardé" arriba de un "no" que sí se entendió

| ID | Lo que dijo Manuel | Mensaje exacto del biógrafo después | Veces |
|---|---|---|---|
| AM16 | "No, nada de eso. Solo Rosa." | "Gracias, Manuel. Ya lo guardé." (M3.1) | 1 |
| AM19 | "No, de ahí en adelante fue con Rosa. Eso es todo." | "Escuchado. Vamos por la siguiente." (M3.8) | 1, esta zafa |

Hoy un "no" corto en una pregunta común lleva M3 (que rota) y a veces le toca uno que dice "guardé" o "gracias por contármelo". **Propuesta (código, una línea):** después de un "no" corto en cualquier pregunta, acuse neutro (M25), como ya pasa en cierres y sensibles.

### N7 (leve, para la prueba real): "Te la mando ahora, espera" y el biógrafo ya estaba en la pregunta siguiente

| ID | Lo que dijo Manuel | Mensaje exacto del biógrafo después |
|---|---|---|
| FO1 | "…Te la mando ahora, espera." | "Gracias, Manuel. / Llegamos al final. ¿Hay algo que en todo este tiempo no te pregunté…" (M26 + LE9) |

En la simulación no hay fotos, así que no es una falla de acá. Pero en la vida real, si buscar la foto en el cajón le lleva media hora, LE9 ya llegó y él manda la foto arriba de la última pregunta. Para mirar cuando Joaquín conecte el flujo: que una foto llegue en cualquier momento después de FO1 y se pegue a FO1, no a lo que esté abierto. FO1 ya dice "si la tenés a mano"; podría sumar "y si la encontrás después, mandámela igual, aunque sea mañana".

---

## 2. Tabla de todas las negativas de Manuel

Qué entendió el código se deduce del acuse que siguió y de lo que llegó después. "Palabras" es el conteo sin muletillas, que es lo que mira el código.

| ID | Lo que dijo | Palabras | Qué entendió | Acuse que siguió | ¿Estuvo bien? |
|---|---|---|---|---|---|
| CI1 | "No, creo que está todo. De eso no hay mucho más que contar, vos. La vida en la aldea era tranquila, siempre igual." | 22 | contó algo | M24.1 "Gracias, Manuel. Eso también va al libro." | No (S2) |
| CA17 | "De la infancia, no mucho. Pasaba hambre a veces, como todos, pero no era drama. Lo difícil vino después…" | 22 | contó algo | M4.1 "Gracias por contarme esto, Manuel. Queda guardado con cuidado." | Sí: contó algo de verdad |
| CI2 | "No, creo que ya contamos todo de eso. La infancia fue la aldea, la familia, el trabajo en el campo. Nada más que contar." | 23 | contó algo | M24.2 "Anotado, gracias. Quedó guardado junto con el resto." | No (S2) |
| CI3 | "No, creo que dijimos todo. La escuela, los maestros, los amigos. Eso es." | 13 | no corto | M25.1 "Bien, seguimos." | Sí |
| AD15 | "De eso no. La adolescencia fue normal, trabajar, amigos. Lo difícil llegó cuando crecí más." | 15 | contó algo | M4.2 "Te escuché. Gracias por confiármelo." | No (N1) |
| CI4 | "No, nada especial. Eso es todo." | 6 | no corto | M25.3 "Bien, entonces." | Sí |
| JU17 | "De eso no. Hay cosas que prefiero guardarme." | 8 | contó algo | M4.3 "Lo guardo tal como lo contaste. Gracias." | No (N1), el peor |
| CI5 | "No, creo que está todo. Esos años fueron de trabajo y aprendizaje, y después llegó lo demás." | 16 | contó algo | M24.3 "Bien, Manuel. Lo sumo a lo que ya me contaste de eso." | No (S2) |
| AM9 | "No, seguimos juntos. Cuarenta y tantos años. No fue fácil siempre, pero no nos separamos. Ella está ahí todavía." | 19, con "pero" | contó algo: hubo un final | M4.4 "Gracias por animarte a contarlo. Cuando quieras, seguimos." → AM19, AM16; sin AM13 | No (N2 / S2) |
| AM19 | "No, de ahí en adelante fue con Rosa. Eso es todo." | 11 | no corto | M3.8 "Escuchado. Vamos por la siguiente." | Sí |
| AM16 | "No, nada de eso. Solo Rosa." | 6 | no corto | M3.1 "Gracias, Manuel. Ya lo guardé." | A medias (N6) |
| CI6 | "No, está todo. Rosa es la historia. El resto son recuerdos que pasan." | 13 | no corto | M25.3 "Bien, entonces." | Sí |
| CI7 | "No, creo que está todo. El almacén fue mi vida, y lo conté. El resto es tiempo." | 17 | contó algo | M24.4 "Gracias por eso. Cada detalle que agregás suma." | No (S2) |
| PG1 | "Eso no. Mejor otra." | 4 | contó algo | M3.4 "Gracias por contármelo. Seguimos." | No (N1) |
| CI8 | "No, está todo. Los hijos, el nieto. La familia es lo importante, y ya conté." | 15 (el tope es "menos de 15") | contó algo | M24.1 "Gracias, Manuel. Eso también va al libro." | No (S2), por una palabra |
| CI9 | "No, creo que está todo. La música, el almacén, los lugares. Fue una vida simple." | 15 | contó algo | M24.2 "Anotado, gracias. Quedó guardado junto con el resto." | No (S2), por una palabra |
| CI10 | "No, creo que están los principales. Algunas personas vienen y van, pero esos son los que quedaron." | 18, con "pero" | contó algo | M24.3 "Bien, Manuel. Lo sumo a lo que ya me contaste de eso." | No (S2) |
| PE1 | "Paso. De eso no hablo." | 5 | paso | M25.1 "Bien, seguimos." | Sí, la única de "su manera" que entró (venía de leer AV11) |
| PE4 | "2001 ya lo conté. Eso fue lo más duro del negocio. Pero hay otras cosas. Asuntos de familia que prefiero no tocar. Con mi hermano José hubo… bueno, eso me lo guardo…" | 40 | contó algo | M4.3 "Lo guardo tal como lo contaste. Gracias." | Sí: contó algo y se guardó otra cosa; el acuse respeta las dos |
| CI11 | "No, creo que dijimos lo importante. La vida tiene sus momentos duros y uno los pasa. Punto." | 17 | contó algo | M24.4 "Gracias por eso. Cada detalle que agregás suma." | No (S2) |
| FI7 | "Eso me lo guardo. Viví tiempos difíciles de política acá en Argentina, pero no quiero hablar de eso. Prefiero pensar en mi trabajo…" | 30 | contó algo | M26 "Gracias, Manuel." (seguía CI12) | Salió bien de casualidad (N1) |
| CI12 | "No, están los principales. El mundial, la pandemia. Lo demás es vivirlo y ya." | 14 | no corto | M25.2 "Bien, seguimos." | Sí |
| CI13 | "No, creo que conté bastante. La infancia, la emigración, la familia, el trabajo. Está todo." | 15 | contó algo | M24.1 "Gracias, Manuel. Eso también va al libro." | No (S2), por una palabra |
| CI14 | "No, creo que la mayoría está. Los días tranquilos, la familia, Rosa. Es poco pero es mío." | 17, con "pero" | contó algo | M24.2 "Anotado, gracias. Quedó guardado junto con el resto." | No (S2) |

Empiezan con "no" y son respuestas de verdad, y el código las trató bien: JU5 ("No pasé por eso. Me fui de Galicia…"), FI1 ("No me gusta la soledad…"), FI4 ("No, no me importa mucho…"), FI6 ("No sé. Espero que sea mejor…"), PE5 ("Nada grave. Presión alta…").

**Cuenta:** 24 negativas o medias negativas. Entendidas: 8 (CI3, CI4, AM19, AM16, CI6, PE1, CI12, y CA17/PE4/PE5 que contaron algo). Mal entendidas: 14, de las cuales 10 son cierres (S2 otra vez, y tres por una sola palabra de más) y 4 son las de "su manera" (N1, N2).

---

## 3. Lo que se repite de S1 a S6

| # | ¿Se repite? | Dónde, y cuántas veces |
|---|---|---|
| S1 (amor para quien no convivió) | No como tal (Manuel convivió y se casó). Su espejo es N2: al que sigue casado le llegan AM19 y AM16. | AM19, AM16 (2) |
| S2 ("no"/"paso" con explicación) | **Otra vez, y fuerte.** 10 de los 14 cierres no se entendieron, con los mismos acuses que en S1: "Eso también va al libro" (CI1, CI8, CI13), "Cada detalle que agregás suma" (CI7, CI11), "Lo sumo a lo que ya me contaste de eso" (CI5, CI10), "Quedó guardado junto con el resto" (CI2, CI9, CI14). Más AM9 con M4.4 "Gracias por animarte a contarlo". La propuesta de S2 (40 palabras en cierres) arregla los 10; tres (CI8, CI9, CI13) tienen exactamente 15 palabras. | 11 |
| S3 (las que abren tema suenan sordas) | Otra vez. AM0 "cuántas veces te enamoraste" después de que contó a Consuelo en AD6; JU8 "¿alguna vez te fuiste a vivir a otro país?" a la pregunta siguiente de haber contado la despedida en el puerto (JU1); HI0 "¿Tuviste hijos?" después de "los hijos siempre me lo decían" (CS1); HI2b "¿Tuviste más hijos?" después de "tengo dos". | 4 |
| S4 (acuses M3 fríos después de algo pesado) | Otra vez. "Guardado, Manuel. Te mando la próxima." después de la última vez que vio bien a su padre (LU4); "Escuchado. Vamos por la siguiente." después de la valija que "pesaba como una montaña" (FAM1, la pregunta de la hija); "Lo tengo. Vamos con otra." después del beso en el piso del almacén (AM8) y después de la noche en que supo que iba a ser padre (GI2); "Listo, quedó guardado. Sigo." después del título de su libro (LE7). | 5 |
| S5 (misma historia varias veces) | Otra vez. La partida 5 veces (AD12, JU1, JU8, GI1, FAM1) más el título (LE7); la compra del almacén 5 (JU4, AM8, TR5, TR8, FO1); la crisis de 2001 4 (TR11, AY1, PE4, HJ1); vivir juntos antes de casarse 3 (AM3, DE1, FI4); Consuelo 2 (AD6, AM14). | 19 |
| S6 (detalles) | Otra vez. M1 debajo de preguntas que ya traen su salida: AM0, AM9 ("con decir paso alcanza" + M1), HI0, HI8 (4); bloque 11 con AV11 + tres M1 seguidos (4 "paso" en 4 mensajes); M15 y la firma pegada ("…bajaste del barco? Lucía"); CI1 "de antes, la de antes"; CI8 "este tema". | 11 |

---

## 4. Errores del modelo que hizo de Manuel (no son fallas de la entrevista)

- **Una hermana que no existe.** La ficha y OR1/CA6 dicen un solo hermano, José; en HI2b "fui al hospital con mi hermana" y en FO1 "una foto que mi hermana me sacó".
- **Fechas cruzadas con Rosa.** En AM0 la conoce en 1980 y se casa en 1982; en HG1 está "recién casado con Rosa" en el Mundial 78.
- **El almacén cerrado y abierto a la vez.** TR9 lo cierra "hace algunos años"; HI8 "ahora cuando viene al almacén lo dejo que gatee por el mostrador" (Tomás nació en 2020) y FI2 "hace poco, un cliente del almacén… viene".
- **Geografía.** GI9: "fuimos a la zona norte, a Bariloche".
- **Género.** AD12: "tomé la decisión en serio, sola en mi cama".
- **La voz.** El "vos" como muletilla en casi todas las respuestas ("Eso es todo, pero está ahí todavía, vos") y la madre gallega diciendo "Manuel, vos que tonto"; un gallego de 70 en Buenos Aires mezcla, pero no así. Respuestas casi todas del mismo largo (120 a 160 palabras), salvo las negativas.
- **FO1:** "Te la mando ahora, espera" sin foto posible; es un límite de la simulación, no un error del personaje.

Para el PASO 2: darle al narrador su ficha con nombres de hermanos y fechas fijas, y pedirle que varíe el largo.

---

## 5. Veredicto

Manuel salió del otro lado con una historia entera y sin sentirse maltratado, porque los cierres y las preguntas de al lado le dieron por dónde meter lo que se negaba a contar de frente. Pero el código no entendió **ninguna** de sus negativas dichas a su manera (0 de 4; la única que entró fue "Paso." recién leída en AV11), y tres veces le agradeció por confiarle lo que acababa de guardarse: eso, a un reservado de verdad, le cierra la boca para el resto de la charla. La lista de frases de N1 (o los botones de Naza) más las dos correcciones de una línea de N2 y S2 arreglan todo lo grave de esta simulación sin ningún modelo en el medio.
