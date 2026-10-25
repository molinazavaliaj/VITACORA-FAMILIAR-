import type { Textos } from "@/lib/idioma-web";
import type { TemaHistoria } from "@/lib/historia";

// «Vitácora de una historia» en la web (plan 2026-10-21, Fase 4). Todo aprobado por Naza el 23/10: la página, el
// paso «La historia» de la compra y la solapa (docs/historia/web-textos-borrador.md, H1 a H38), y los temas con su
// ayuda (docs/historia/temas.md, 21/10). Los redactó Fable. es = castellano de España (tú), ca = catalán (tu),
// ar = Argentina (vos). El catalán queda pendiente del corrector de Softcatalà y de la revisión a ciegas, como el
// banco. La web no dice cuántas preguntas son (Naza, 23/10).

export type TextosHistoria = {
  meta: { titulo: string; descripcion: string };
  /** H13: dos líneas; la segunda va en cursiva. */
  hero: { linea1: string; linea2: string; bajada: string };
  /** H15. */
  empezar: string;
  como: { titulo: string; pasos: { titulo: string; texto: string }[] };
  paraQuien: { titulo: string; texto: string; entrada: string; ultima: string };
  recibe: { titulo: string; texto: string };
  precio: { titulo: string; texto: string; nota: string };
  faq: { titulo: string; preguntas: { p: string; r: string }[] };
  /** H35: dos líneas; la segunda en cursiva. */
  cierre: { linea1: string; linea2: string };
  /** H36: la pregunta y el nombre, que va con enlace a la portada. */
  aFamiliar: { pregunta: string; enlace: string };
  /** H37, mientras HISTORIA_VENTA está apagada. */
  proximamente: { titulo: string; texto: string; boton: string; asunto: string; cuerpo: string };
  /** H38. */
  marca: string;
  /** El paso «La historia» de la compra (H2 a H10). */
  paso: {
    barra: string;
    titulo: string;
    ayuda: string;
    otraEtiqueta: string;
    otraEjemplo: string;
    abiertaCasilla: string;
    abiertaAyuda: string;
    propiasTitulo: string;
    propiasAyuda: string;
    propiaEjemplo: string;
    errorSinTema: string;
    errorSinOtra: string;
    errorPropiaLarga: string;
  };
  /** Los temas de la compra con su línea de ayuda (temas.md), en el orden de la lista. */
  temas: Record<TemaHistoria, { nombre: string; ayuda: string }>;
};

export const TEXTOS_HISTORIA: Textos<TextosHistoria> = {
  ar: {
    meta: {
      titulo: "Vitácora de una historia · Un solo capítulo, a fondo",
      descripcion: "Un libro sobre una sola historia. Irse a vivir lejos, el negocio propio, salir de una enfermedad. Preguntas por WhatsApp, de a una, contestadas en audio, y con eso se escribe el libro.",
    },
    hero: {
      linea1: "Hay historias que se cuentan siempre",
      linea2: "y nadie escribió nunca.",
      bajada: "Un libro sobre un solo capítulo de la vida, contado al máximo detalle. Irse a vivir lejos, el negocio propio, la enfermedad que quedó atrás. Las preguntas llegan por WhatsApp, de a una, se contestan en audio, y con eso se escribe el libro.",
    },
    empezar: "Empezar el libro",
    como: {
      titulo: "Una historia, una pregunta por vez, un libro.",
      pasos: [
        { titulo: "Elegís la historia", texto: "Una de la lista o la que quieras. Puede ser tu libro o un regalo, y si es regalo podés dejar que la elija quien la cuenta." },
        { titulo: "Las preguntas llegan por WhatsApp", texto: "De a una, todas sobre esa historia. Cómo era la vida antes, cómo empezó, lo más difícil, cómo terminó. Si alguna no va, se dice paso y seguimos con otra." },
        { titulo: "Cada una se contesta con un audio", texto: "Cuando hay un rato, como si se lo contara a alguien en persona. A mitad de camino pedimos algunas fotos de esa época." },
        { titulo: "Se escribe el libro", texto: "Antes, quien contó la historia repasa lo que dijo, por si quiere cambiar o agregar algo. Después llega el libro, con sus palabras, sus fotos y un código para escuchar su voz." },
      ],
    },
    paraQuien: {
      titulo: "No hace falta una vida entera. Alcanza con una historia.",
      texto: "Vitácora Familiar cuenta una vida de punta a punta. Este libro se queda en un solo capítulo que ya pasó y lo cuenta a fondo, con los detalles que en una vida entera no entran. Es para uno mismo o para regalar.",
      entrada: "Algunas de las historias que se pueden contar.",
      ultima: "O cualquier otra. Un viaje, el club, una amistad de toda la vida.",
    },
    recibe: {
      titulo: "Esa historia, hecha libro.",
      texto: "Un relato con las palabras de quien la cuenta, no una transcripción. Lo que contó va como lo contó, sin inventar nada. Con las fotos de esa época y un código QR para escuchar los audios. Impreso en tapa dura o en PDF, lo elegís al comprar.",
    },
    precio: { titulo: "Un solo pago.", texto: "Las preguntas, los audios, las fotos y el libro de esa historia.", nota: "Sin suscripciones." },
    faq: {
      titulo: "Lo que nos suelen preguntar.",
      preguntas: [
        { p: "¿Y si la historia no está en la lista?", r: "Elegís «Otra historia» y la escribís en una línea. Las preguntas de esa parte son generales y sirven para cualquier capítulo. El resto de la entrevista es igual." },
        { p: "¿Puede elegir la historia quien la va a contar?", r: "Sí. Si es un regalo, marcás «que la elija quien la cuenta». Antes de empezar le preguntamos de qué historia quiere hacer su libro y, si duda, le mostramos la lista." },
        { p: "¿Qué se pregunta?", r: "Van del antes al después de esa historia. Cómo era la vida antes, cómo empezó, lo más difícil, cuándo empezó a cambiar y qué dejó. Llegan por WhatsApp, de a una, y cada una se contesta con un audio, cuando hay un rato." },
        { p: "¿Y si hay cosas que no quiere contar?", r: "En cualquier pregunta se puede decir paso y seguimos con otra. Lo que no cuenta no se inventa, y lo que cuenta va al libro como lo dijo." },
        { p: "¿Puedo agregar preguntas mías?", r: "Sí. Si es un regalo, al comprar podés dejar hasta tres, que le llegan de tu parte. Y desde la página de la historia, también si es para vos, se pueden sumar más hasta la última pregunta." },
        { p: "¿Se puede corregir algo antes de que se escriba el libro?", r: "Sí. Cuando termina la entrevista, antes de escribir el libro, quien la contó repasa lo que dijo y puede cambiar o agregar lo que quiera." },
        { p: "¿Hace falta mandar fotos?", r: "No, el libro sale igual. A mitad de la entrevista pedimos entre tres y diez fotos de esa época, y si aparecen más tarde se pueden mandar después." },
        // La garantía (Naza, 25/10), con lo mismo que dice la de términos §7 (GARANTIA.nuestra.historia).
        { p: "¿Y si no quiere hacerlo?", r: "Si es un regalo y no acepta la entrevista, te devolvemos todo lo que pagaste. Si acepta y contesta menos de diez preguntas, también te devolvemos todo. Si la historia es la tuya, te devolvemos todo hasta que mandes tu primera respuesta." },
      ],
    },
    cierre: { linea1: "Una historia que ya pasó,", linea2: "guardada para siempre." },
    aFamiliar: { pregunta: "¿Buscás el libro de una vida entera?", enlace: "Vitácora Familiar" },
    proximamente: {
      titulo: "Próximamente",
      texto: "Todavía no se vende. Escribinos y te avisamos cuando abra.",
      boton: "Escribinos",
      asunto: "Vitácora de una historia",
      cuerpo: "Hola. Quiero que me avisen cuando abra Vitácora de una historia.",
    },
    marca: "Vitácora de una historia",
    paso: {
      barra: "La historia",
      titulo: "¿De qué historia es el libro?",
      ayuda: "Elegí una de la lista o escribí otra. Es una historia que ya pasó, contada al máximo detalle.",
      otraEtiqueta: "¿Cuál es la historia?",
      otraEjemplo: "Por ejemplo, los veranos en la chacra de los abuelos",
      abiertaCasilla: "Que la elija quien la cuenta",
      abiertaAyuda: "Le preguntamos qué historia quiere contar antes de empezar. Si duda, le mostramos esta misma lista.",
      propiasTitulo: "Preguntas propias (opcional)",
      propiasAyuda: "¿Hay algo de esa historia que siempre quisiste saber? Dejale hasta tres preguntas. Le llegan cerca del final, tal cual las escribiste y de tu parte.",
      propiaEjemplo: "Por ejemplo, ¿qué es lo que nunca me contaste de esa época?",
      errorSinTema: "Elegí de qué historia es el libro.",
      errorSinOtra: "Contanos cuál es la historia. Con una línea alcanza.",
      errorPropiaLarga: "Una de las preguntas es muy larga. Acortala un poco.",
    },
    temas: {
      mudanza: { nombre: "Irse a vivir lejos", ayuda: "Emigrar, cambiar de ciudad, empezar de cero" },
      negocio: { nombre: "El negocio propio", ayuda: "Abrir el local, los primeros clientes, sacarlo adelante" },
      enfermedad: { nombre: "Salir de una enfermedad", ayuda: "El diagnóstico, el tratamiento, quién estuvo al lado" },
      conocimos: { nombre: "Cómo se conocieron", ayuda: "El primer encuentro, la primera cita, el casamiento" },
      padres: { nombre: "El primer hijo", ayuda: "La noticia, el nacimiento, las primeras noches sin dormir" },
      trabajo: { nombre: "El trabajo de su vida", ayuda: "El primer sueldo, el oficio, los compañeros de siempre" },
      otra: { nombre: "Otra historia", ayuda: "Un viaje, el club, una amistad de toda la vida" },
    },
  },
  es: {
    meta: {
      titulo: "Vitácora de una historia · Un solo capítulo, a fondo",
      descripcion: "Un libro sobre una sola historia. Irse a vivir fuera, el negocio propio, salir de una enfermedad. Preguntas por WhatsApp, de una en una, contestadas en audio, y con eso se escribe el libro.",
    },
    hero: {
      linea1: "Hay historias que se cuentan siempre",
      linea2: "y nadie ha escrito nunca.",
      bajada: "Un libro sobre un solo capítulo de la vida, contado con todo detalle. Irse a vivir fuera, el negocio propio, la enfermedad que quedó atrás. Las preguntas llegan por WhatsApp, de una en una, se contestan en audio, y con eso se escribe el libro.",
    },
    empezar: "Empezar el libro",
    como: {
      titulo: "Una historia, una pregunta cada vez, un libro.",
      pasos: [
        { titulo: "Eliges la historia", texto: "Una de la lista o la que quieras. Puede ser tu libro o un regalo, y si es regalo puedes dejar que la elija quien la cuenta." },
        { titulo: "Las preguntas llegan por WhatsApp", texto: "De una en una, todas sobre esa historia. Cómo era la vida antes, cómo empezó, lo más difícil, cómo terminó. Si alguna no va, se dice paso y seguimos con otra." },
        { titulo: "Cada una se contesta con un audio", texto: "Cuando hay un rato, como si se lo contara a alguien en persona. A mitad de camino pedimos algunas fotos de esa época." },
        { titulo: "Se escribe el libro", texto: "Antes, quien contó la historia repasa lo que dijo, por si quiere cambiar o añadir algo. Después llega el libro, con sus palabras, sus fotos y un código para escuchar su voz." },
      ],
    },
    paraQuien: {
      titulo: "No hace falta una vida entera. Basta con una historia.",
      texto: "Vitácora Familiar cuenta una vida de principio a fin. Este libro se queda en un solo capítulo que ya pasó y lo cuenta a fondo, con los detalles que en una vida entera no caben. Es para uno mismo o para regalar.",
      entrada: "Algunas de las historias que se pueden contar.",
      ultima: "O cualquier otra. Un viaje, el pueblo, una amistad de toda la vida.",
    },
    recibe: {
      titulo: "Esa historia, hecha libro.",
      texto: "Un relato con las palabras de quien la cuenta, no una transcripción. Lo que contó va como lo contó, sin inventar nada. Con las fotos de esa época y un código QR para escuchar los audios. Impreso en tapa dura o en PDF, lo eliges al comprar.",
    },
    precio: { titulo: "Un solo pago.", texto: "Las preguntas, los audios, las fotos y el libro de esa historia.", nota: "Sin suscripciones." },
    faq: {
      titulo: "Lo que suelen preguntarnos.",
      preguntas: [
        { p: "¿Y si la historia no está en la lista?", r: "Eliges «Otra historia» y la escribes en una línea. Las preguntas de esa parte son generales y sirven para cualquier capítulo. El resto de la entrevista es igual." },
        { p: "¿Puede elegir la historia quien la va a contar?", r: "Sí. Si es un regalo, marcas «que la elija quien la cuenta». Antes de empezar le preguntamos de qué historia quiere hacer su libro y, si duda, le enseñamos la lista." },
        { p: "¿Qué se pregunta?", r: "Van del antes al después de esa historia. Cómo era la vida antes, cómo empezó, lo más difícil, cuándo empezó a cambiar y qué dejó. Llegan por WhatsApp, de una en una, y cada una se contesta con un audio, cuando hay un rato." },
        { p: "¿Y si hay cosas que no quiere contar?", r: "En cualquier pregunta se puede decir paso y seguimos con otra. Lo que no cuenta no se inventa, y lo que cuenta va al libro como lo dijo." },
        { p: "¿Puedo añadir preguntas mías?", r: "Sí. Si es un regalo, al comprar puedes dejar hasta tres, que le llegan de tu parte. Y desde la página de la historia, también si es para ti, se pueden añadir más hasta la última pregunta." },
        { p: "¿Se puede corregir algo antes de que se escriba el libro?", r: "Sí. Cuando termina la entrevista, antes de escribir el libro, quien la contó repasa lo que dijo y puede cambiar o añadir lo que quiera." },
        { p: "¿Hace falta mandar fotos?", r: "No, el libro sale igual. A mitad de la entrevista pedimos entre tres y diez fotos de esa época, y si aparecen más tarde se pueden mandar después." },
        // La garantía (Naza, 25/10), con lo mismo que dice la de términos §7 (GARANTIA.nuestra.historia).
        { p: "¿Y si no quiere hacerlo?", r: "Si es un regalo y no acepta la entrevista, te devolvemos todo lo que pagaste. Si acepta y contesta menos de diez preguntas, también te devolvemos todo. Si la historia es la tuya, te devolvemos todo hasta que mandes tu primera respuesta." },
      ],
    },
    cierre: { linea1: "Una historia que ya pasó,", linea2: "guardada para siempre." },
    aFamiliar: { pregunta: "¿Buscas el libro de una vida entera?", enlace: "Vitácora Familiar" },
    proximamente: {
      titulo: "Próximamente",
      texto: "Todavía no se vende. Escríbenos y te avisamos cuando abra.",
      boton: "Escríbenos",
      asunto: "Vitácora de una historia",
      cuerpo: "Hola. Quiero que me aviséis cuando abra Vitácora de una historia.",
    },
    marca: "Vitácora de una historia",
    paso: {
      barra: "La historia",
      titulo: "¿De qué historia es el libro?",
      ayuda: "Elige una de la lista o escribe otra. Es una historia que ya pasó, contada con todo detalle.",
      otraEtiqueta: "¿Cuál es la historia?",
      otraEjemplo: "Por ejemplo, los veranos en el pueblo con los abuelos",
      abiertaCasilla: "Que la elija quien la cuenta",
      abiertaAyuda: "Le preguntamos qué historia quiere contar antes de empezar. Si duda, le enseñamos esta misma lista.",
      propiasTitulo: "Preguntas propias (opcional)",
      propiasAyuda: "¿Hay algo de esa historia que siempre has querido saber? Déjale hasta tres preguntas. Le llegan cerca del final, tal cual las escribes y de tu parte.",
      propiaEjemplo: "Por ejemplo, ¿qué es lo que nunca me has contado de esa época?",
      errorSinTema: "Elige de qué historia es el libro.",
      errorSinOtra: "Cuéntanos cuál es la historia. Con una línea basta.",
      errorPropiaLarga: "Una de las preguntas es muy larga. Acórtala un poco.",
    },
    temas: {
      mudanza: { nombre: "Irse a vivir fuera", ayuda: "Emigrar, cambiar de ciudad, empezar de cero" },
      negocio: { nombre: "El negocio propio", ayuda: "Abrir el local, los primeros clientes, sacarlo adelante" },
      enfermedad: { nombre: "Salir de una enfermedad", ayuda: "El diagnóstico, el tratamiento, quién estuvo al lado" },
      conocimos: { nombre: "Cómo se conocieron", ayuda: "El primer encuentro, la primera cita, la boda" },
      padres: { nombre: "El primer hijo", ayuda: "La noticia, el nacimiento, las primeras noches sin dormir" },
      trabajo: { nombre: "El trabajo de su vida", ayuda: "El primer sueldo, el oficio, los compañeros de siempre" },
      otra: { nombre: "Otra historia", ayuda: "Un viaje, el pueblo, una amistad de toda la vida" },
    },
  },
  ca: {
    meta: {
      titulo: "Vitácora d'una història · Un sol capítol, a fons",
      descripcion: "Un llibre sobre una sola història. Anar a viure lluny, el negoci propi, sortir d'una malaltia. Preguntes per WhatsApp, d'una en una, respostes amb àudios, i amb això s'escriu el llibre.",
    },
    hero: {
      linea1: "Hi ha històries que s'expliquen sempre",
      linea2: "i ningú no ha escrit mai.",
      bajada: "Un llibre sobre un sol capítol de la vida, explicat amb tot detall. Anar a viure lluny, el negoci propi, la malaltia que va quedar enrere. Les preguntes arriben per WhatsApp, d'una en una, es contesten amb àudios, i amb això s'escriu el llibre.",
    },
    empezar: "Començar el llibre",
    como: {
      titulo: "Una història, una pregunta cada vegada, un llibre.",
      pasos: [
        { titulo: "Tries la història", texto: "Una de la llista o la que vulguis. Pot ser el teu llibre o un regal, i si és un regal pots deixar que la triï qui l'explica." },
        { titulo: "Les preguntes arriben per WhatsApp", texto: "D'una en una, totes sobre aquesta història. Com era la vida abans, com va començar, el més difícil, com va acabar. Si alguna no va, es diu «passo» i en fem una altra." },
        { titulo: "Cada una es contesta amb un àudio", texto: "Quan hi ha una estona, com si ho expliqués a algú en persona. A mig camí demanem algunes fotos d'aquella època." },
        { titulo: "S'escriu el llibre", texto: "Abans, qui ha explicat la història repassa el que ha dit, per si vol canviar o afegir alguna cosa. Després arriba el llibre, amb les seves paraules, les seves fotos i un codi per escoltar la seva veu." },
      ],
    },
    paraQuien: {
      titulo: "No cal una vida sencera. N'hi ha prou amb una història.",
      texto: "Vitácora Familiar explica una vida de cap a cap. Aquest llibre es queda en un sol capítol que ja ha passat i l'explica a fons, amb els detalls que en una vida sencera no hi caben. És per a un mateix o per regalar.",
      entrada: "Algunes de les històries que es poden explicar.",
      ultima: "O qualsevol altra. Un viatge, el poble, una amistat de tota la vida.",
    },
    recibe: {
      titulo: "Aquesta història, feta llibre.",
      texto: "Un relat amb les paraules de qui l'explica, no una transcripció. El que va explicar hi va tal com ho va explicar, sense inventar res. Amb les fotos d'aquella època i un codi QR per escoltar els àudios. Imprès en tapa dura o en PDF, ho tries en comprar.",
    },
    precio: { titulo: "Un sol pagament.", texto: "Les preguntes, els àudios, les fotos i el llibre d'aquesta història.", nota: "Sense subscripcions." },
    faq: {
      titulo: "El que ens solen preguntar.",
      preguntas: [
        { p: "I si la història no és a la llista?", r: "Tries «Una altra història» i l'escrius en una línia. Les preguntes d'aquesta part són generals i serveixen per a qualsevol capítol. La resta de l'entrevista és igual." },
        { p: "Pot triar la història qui l'explicarà?", r: "Sí. Si és un regal, marques «que la triï qui l'explica». Abans de començar li preguntem de quina història vol fer el seu llibre i, si dubta, li ensenyem la llista." },
        { p: "Què es pregunta?", r: "Van de l'abans al després d'aquesta història. Com era la vida abans, com va començar, el més difícil, quan va començar a canviar i què en va quedar. Arriben per WhatsApp, d'una en una, i cada una es contesta amb un àudio, quan hi ha una estona." },
        { p: "I si hi ha coses que no vol explicar?", r: "A qualsevol pregunta es pot dir «passo» i en fem una altra. El que no explica no s'inventa, i el que explica va al llibre tal com ho va dir." },
        { p: "Puc afegir-hi preguntes meves?", r: "Sí. Si és un regal, en comprar en pots deixar fins a tres, que li arriben de part teva. I des de la pàgina de la història, també si és per a tu, se n'hi poden afegir més fins a l'última pregunta." },
        { p: "Es pot corregir alguna cosa abans que s'escrigui el llibre?", r: "Sí. Quan acaba l'entrevista, abans d'escriure el llibre, qui l'ha explicat repassa el que ha dit i pot canviar o afegir el que vulgui." },
        { p: "Cal enviar fotos?", r: "No, el llibre surt igual. A mitja entrevista demanem entre tres i deu fotos d'aquella època, i si apareixen més tard es poden enviar després." },
        // La garantía (Naza, 25/10), con lo mismo que dice la de términos §7 (GARANTIA.nuestra.historia).
        { p: "I si no ho vol fer?", r: "Si és un regal i no accepta l'entrevista, et retornem tot el que vas pagar. Si accepta i respon menys de deu preguntes, també t'ho retornem tot. Si la història és la teva, t'ho retornem tot fins que enviïs la primera resposta." },
      ],
    },
    cierre: { linea1: "Una història que ja ha passat,", linea2: "guardada per sempre." },
    aFamiliar: { pregunta: "Busques el llibre d'una vida sencera?", enlace: "Vitácora Familiar" },
    proximamente: {
      titulo: "Aviat",
      texto: "Encara no es ven. Escriu-nos i t'avisem quan obri.",
      boton: "Escriu-nos",
      asunto: "Vitácora d'una història",
      cuerpo: "Hola. Vull que m'aviseu quan obri Vitácora d'una història.",
    },
    marca: "Vitácora d'una història",
    paso: {
      barra: "La història",
      titulo: "De quina història és el llibre?",
      ayuda: "Tria'n una de la llista o escriu-ne una altra. És una història que ja ha passat, explicada amb tot detall.",
      otraEtiqueta: "Quina és la història?",
      otraEjemplo: "Per exemple, els estius al poble amb els avis",
      abiertaCasilla: "Que la triï qui l'explica",
      abiertaAyuda: "Li preguntem quina història vol explicar abans de començar. Si dubta, li ensenyem aquesta mateixa llista.",
      propiasTitulo: "Preguntes pròpies (opcional)",
      propiasAyuda: "Hi ha alguna cosa d'aquesta història que sempre has volgut saber? Deixa-li fins a tres preguntes. Li arriben cap al final, tal com les escrius i de part teva.",
      propiaEjemplo: "Per exemple, què és el que mai m'has explicat d'aquella època?",
      errorSinTema: "Tria de quina història és el llibre.",
      errorSinOtra: "Explica'ns quina és la història. Amb una línia n'hi ha prou.",
      errorPropiaLarga: "Una de les preguntes és massa llarga. Escurça-la una mica.",
    },
    temas: {
      mudanza: { nombre: "Anar a viure lluny", ayuda: "Emigrar, canviar de ciutat, començar de zero" },
      negocio: { nombre: "El negoci propi", ayuda: "Obrir la botiga, els primers clients, tirar-lo endavant" },
      enfermedad: { nombre: "Sortir d'una malaltia", ayuda: "El diagnòstic, el tractament, qui va estar a prop" },
      conocimos: { nombre: "Com es van conèixer", ayuda: "La primera trobada, la primera cita, el casament" },
      padres: { nombre: "El primer fill", ayuda: "La notícia, el naixement, les primeres nits sense dormir" },
      trabajo: { nombre: "La feina de la seva vida", ayuda: "El primer sou, l'ofici, els companys de sempre" },
      otra: { nombre: "Una altra història", ayuda: "Un viatge, el poble, una amistat de tota la vida" },
    },
  },
};
