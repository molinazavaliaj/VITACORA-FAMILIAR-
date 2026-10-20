import type { Textos } from "@/lib/idioma-web";

// Los textos de la compra de la Vitácora de Viaje V2 (/comprar/viaje,
// /ca/comprar/viaje, /ar/comprar/viaje), 16/10: solo lo que pide la V2
// (fechas, país, para mí o regalo, preguntas propias, PDF o impreso, álbum de
// 20 o 40, idioma). Nada de ciudades, etapas, «con quién viajás» ni ángulos.
//
// es = España, de tú (a quien compra y a quien viaja: es UNA persona que
// viaja). ar = de vos. ca = de tu.
//
// TEXTO PARA NAZA: todo lo nuevo está en docs/rediseno-2026-10/viaje-v2/textos.md
// (tandas 1 a 4). Lo que ya estaba aprobado y sigue igual lo dice al lado.
// ca: revisado con el corrector de Softcatalà (19/10).

/** Un texto que cambia si el viaje es de quien compra o un regalo. */
type Doble = { yo: string; regalo: string };

export type TextosViaje = {
  tituloPagina: string;
  descripcion: string;
  pasos: [string, string, string];
  pasoDe: (n: number, total: number) => string;
  continuar: string;
  atras: string;
  marca: string;
  noDisponible: string;

  // 1 · El libro
  libroTitulo: string;
  libroBajada: string;
  impresoTitulo: string;
  impresoDetalle: string;
  pdfTitulo: string;
  pdfDetalle: string;
  albumTitulo: string;
  albumBajada: string;
  album: (n: 20 | 40) => string;
  /** «+ 10 €» al lado del álbum de 40. */
  mas: (precio: string) => string;

  // 2 · El viaje
  viajeTitulo: string;
  viajeBajada: string;
  paraQuien: string;
  paraMi: string;
  esRegalo: string;
  tuNombre: string;
  tuNombrePista: string;
  quienRegala: string;
  quienRegalaAyuda: string;
  nombre: Doble;
  nombrePista: string;
  comoLeDicen: Doble;
  comoLeDicenAyuda: Doble;
  whatsapp: Doble;
  whatsappAyuda: Doble;
  salida: string;
  vuelta: string;
  dias: (n: number) => string;
  paisViaje: string;
  paisViajeAyuda: string;
  paisCasa: Doble;
  elegir: string;
  hora: Doble;
  idioma: string;
  idiomas: Record<"es-ES" | "es-AR" | "ca", string>;
  preguntas: string;
  preguntasAyuda: Doble;
  preguntaPista: string;
  otraPregunta: string;
  sacarPregunta: string;

  // 3 · Pago
  pagoTitulo: string;
  pagoBajada: string;
  email: string;
  emailPista: string;
  despues: string;
  despuesTexto: Doble;
  legalAntes: string;
  legalDespues: string;
  garantia: string;
  incluye: string[];
  libroDelViaje: string;

  // Errores
  faltaNombre: string;
  faltaNombreViajero: string;
  faltaWhatsapp: string;
  faltaWhatsappViajero: string;
  faltaTuNombre: string;
  faltaQuienRegala: string;
  faltaFechas: string;
  /** Los otros errores de las fechas (los mismos que valida el servidor, lib/viaje.ts). */
  fechas: { vueltaAntes: string; salidaPasada: string; muyCorto: string; muyLargo: string };
  faltaPais: string;
  faltaCasa: string;
  muchasPreguntas: string;
  preguntaLarga: string;
  correoMal: string;
};

export const CHECKOUT_VIAJE: Textos<TextosViaje> = {
  /* ─────────────────────────── España, de tú ─────────────────────────── */
  es: {
    tituloPagina: "Vitácora de viaje",
    // TEXTO PARA NAZA
    descripcion: "Un biógrafo te pregunta por WhatsApp antes, durante y después del viaje. Al volver, tu viaje es un libro con tus fotos y tu voz.",
    pasos: ["El libro", "El viaje", "Pago"],
    pasoDe: (n, t) => `Paso ${n} de ${t}`,
    continuar: "Continuar",
    atras: "Atrás",
    marca: "Vitácora de viaje",
    noDisponible: "La Vitácora de viaje todavía no está disponible en tu región.",

    // TEXTO PARA NAZA
    libroTitulo: "¿Cómo quieres el libro del viaje?",
    libroBajada: "Los dos llevan el viaje contado, el álbum de fotos y un código QR para escuchar los audios.",
    impresoTitulo: "Libro impreso en tapa dura + PDF",
    impresoDetalle: "El libro impreso y encuadernado, y también en PDF. El envío está incluido. Te avisamos cuando salga de imprenta y te mandamos el seguimiento.",
    pdfTitulo: "Libro en PDF",
    pdfDetalle: "Para leerlo en cualquier pantalla y guardarlo para siempre.",
    albumTitulo: "El álbum del final",
    albumBajada: "Al volver, quien viaja elige sus fotos favoritas y van al final del libro.",
    album: (n) => `${n} fotos`,
    mas: (p) => `+ ${p}`,

    // TEXTO PARA NAZA
    viajeTitulo: "El viaje",
    viajeBajada: "Solo las fechas y el país. Las ciudades salen de lo que se cuenta en el viaje.",
    paraQuien: "¿Para quién es?",
    paraMi: "Para mí",
    esRegalo: "Es un regalo",
    tuNombre: "Tu nombre",
    tuNombrePista: "Nombre y apellidos",
    quienRegala: "Cómo te llama",
    quienRegalaAyuda: "Así le cuenta el biógrafo quién le hace el regalo. Por ejemplo, mamá o Lucía.",
    nombre: { yo: "Tu nombre", regalo: "Nombre de quien viaja" },
    nombrePista: "Nombre y apellidos",
    comoLeDicen: { yo: "Cómo te llaman", regalo: "Cómo le llaman" },
    comoLeDicenAyuda: { yo: "Con este nombre te escribe el biógrafo.", regalo: "Con este nombre le escribe el biógrafo." },
    whatsapp: { yo: "Tu WhatsApp", regalo: "Su WhatsApp" },
    whatsappAyuda: { yo: "Ahí te escribe el biógrafo.", regalo: "Ahí le escribe el biógrafo para contarle que es tu regalo." },
    salida: "Día de salida",
    vuelta: "Día de vuelta",
    dias: (n) => `${n} días de viaje`,
    // TEXTO PARA NAZA
    paisViaje: "País principal del viaje",
    paisViajeAyuda: "Los mensajes llegan con la hora de ese país. Si son varios, elige el de más días.",
    paisCasa: { yo: "País donde vives", regalo: "País donde vive" },
    elegir: "Elige uno",
    hora: { yo: "A qué hora de la noche te escribe", regalo: "A qué hora de la noche le escribe" },
    idioma: "Idioma del biógrafo",
    idiomas: { "es-ES": "Castellano de España", "es-AR": "Castellano de Argentina", ca: "Català" },
    preguntas: "Preguntas propias (opcional)",
    preguntasAyuda: {
      yo: "¿Quieres que te preguntemos por algo en especial de tu viaje? Escríbelo aquí, hasta cinco. Si no, quedan las del biógrafo.",
      regalo: "¿Quieres preguntarle algo en especial de su viaje? Escríbelo aquí, hasta cinco. Le llega tal cual, de tu parte.",
    },
    preguntaPista: "Por ejemplo, ¿qué fue lo que más te sorprendió de la comida?",
    otraPregunta: "+ Otra pregunta",
    sacarPregunta: "Quitar pregunta",

    // TEXTO PARA NAZA
    pagoTitulo: "Tus datos y el pago",
    pagoBajada: "Te mandamos todo a tu correo. Con ese mismo correo entras a la página del viaje.",
    email: "Tu correo",
    emailPista: "nombre@ejemplo.com",
    despues: "Qué pasa después de pagar.",
    despuesTexto: {
      yo: "te llega un correo para entrar a la página del viaje, y el biógrafo te escribe por WhatsApp para presentarse. Respondes SÍ y empieza.",
      regalo: "te llega un correo para entrar a la página del viaje, y el biógrafo le escribe por WhatsApp para contarle que es tu regalo. Responde SÍ y empieza.",
    },
    legalAntes: "Pago único y seguro con Stripe. Al pagar aceptas los ",
    // APROBADO por Naza el 19/10 · tanda 6, texto 6 (garantía de las diez preguntas; solo en la letra pequeña del pago)
    legalDespues: " y nos pides que la entrevista empiece enseguida, sin esperar los 14 días de desistimiento.",
    garantia: "Si el viaje no se hace y nos avisas antes de que acepte la entrevista, te devolvemos todo. Si ya aceptó y contesta menos de diez preguntas, también te devolvemos todo.",
    incluye: ["Las preguntas por WhatsApp, antes, durante y después del viaje", "El álbum con las fotos favoritas", "Un código QR para escuchar los audios"],
    libroDelViaje: "El libro del viaje",

    faltaNombre: "Dinos tu nombre.",
    faltaNombreViajero: "Falta el nombre de quien viaja.",
    faltaWhatsapp: "Falta tu WhatsApp. Ahí te escribe el biógrafo.",
    faltaWhatsappViajero: "Falta el WhatsApp de quien viaja. Ahí le escribe el biógrafo.",
    faltaTuNombre: "Dinos tu nombre.",
    faltaQuienRegala: "Falta cómo te llama quien viaja.",
    faltaFechas: "Necesitamos la fecha de salida y la de vuelta.",
    fechas: {
      vueltaAntes: "La vuelta no puede ser antes de la salida.",
      salidaPasada: "La salida no puede ser un día que ya pasó.",
      muyCorto: "El viaje tiene que durar al menos 3 días, contando la salida y la vuelta.",
      muyLargo: "Para un viaje de más de 120 días, escríbenos y lo armamos aparte.",
    },
    faltaPais: "Elige el país principal del viaje.",
    faltaCasa: "Elige el país donde vive quien viaja.",
    muchasPreguntas: "Van hasta cinco preguntas propias.",
    preguntaLarga: "Una de las preguntas es muy larga. Acórtala un poco.",
    correoMal: "Necesitamos un correo válido. Con ese entras a la página del viaje.",
  },

  /* ─────────────────────────── Argentina, de vos ─────────────────────────── */
  ar: {
    tituloPagina: "Vitácora de viaje",
    descripcion: "Un biógrafo te pregunta por WhatsApp antes, durante y después del viaje. Al volver, tu viaje es un libro con tus fotos y tu voz.",
    pasos: ["El libro", "El viaje", "Pago"],
    pasoDe: (n, t) => `Paso ${n} de ${t}`,
    continuar: "Continuar",
    atras: "Atrás",
    marca: "Vitácora de viaje",
    noDisponible: "La Vitácora de viaje todavía no está disponible en tu región.",

    libroTitulo: "¿Cómo querés el libro del viaje?",
    libroBajada: "Los dos llevan el viaje contado, el álbum de fotos y un código QR para escuchar los audios.",
    impresoTitulo: "Libro impreso en tapa dura + PDF",
    impresoDetalle: "El libro impreso y encuadernado, y también en PDF. El envío está incluido. Te avisamos cuando salga de imprenta y te mandamos el seguimiento.",
    pdfTitulo: "Libro en PDF",
    pdfDetalle: "Para leerlo en cualquier pantalla y guardarlo para siempre.",
    albumTitulo: "El álbum del final",
    albumBajada: "Al volver, quien viaja elige sus fotos favoritas y van al final del libro.",
    album: (n) => `${n} fotos`,
    mas: (p) => `+ ${p}`,

    viajeTitulo: "El viaje",
    viajeBajada: "Solo las fechas y el país. Las ciudades salen de lo que se cuenta en el viaje.",
    paraQuien: "¿Para quién es?",
    paraMi: "Para mí",
    esRegalo: "Es un regalo",
    tuNombre: "Tu nombre",
    tuNombrePista: "Nombre y apellido",
    quienRegala: "Cómo te llama",
    quienRegalaAyuda: "Así le cuenta el biógrafo quién le hace el regalo. Por ejemplo, mamá o Lucía.",
    nombre: { yo: "Tu nombre", regalo: "Nombre de quien viaja" },
    nombrePista: "Nombre y apellido",
    comoLeDicen: { yo: "Cómo te dicen", regalo: "Cómo le dicen" },
    comoLeDicenAyuda: { yo: "Con este nombre te escribe el biógrafo.", regalo: "Con este nombre le escribe el biógrafo." },
    whatsapp: { yo: "Tu WhatsApp", regalo: "Su WhatsApp" },
    whatsappAyuda: { yo: "Ahí te escribe el biógrafo.", regalo: "Ahí le escribe el biógrafo para contarle que es tu regalo." },
    salida: "Día de salida",
    vuelta: "Día de vuelta",
    dias: (n) => `${n} días de viaje`,
    paisViaje: "País principal del viaje",
    paisViajeAyuda: "Los mensajes llegan con la hora de ese país. Si son varios, elegí el de más días.",
    paisCasa: { yo: "País donde vivís", regalo: "País donde vive" },
    elegir: "Elegí uno",
    hora: { yo: "A qué hora de la noche te escribe", regalo: "A qué hora de la noche le escribe" },
    idioma: "Idioma del biógrafo",
    idiomas: { "es-ES": "Castellano de España", "es-AR": "Castellano de Argentina", ca: "Català" },
    preguntas: "Preguntas propias (opcional)",
    preguntasAyuda: {
      yo: "¿Querés que te preguntemos por algo en especial de tu viaje? Escribilo acá, hasta cinco. Si no, quedan las del biógrafo.",
      regalo: "¿Querés preguntarle algo en especial de su viaje? Escribilo acá, hasta cinco. Le llega tal cual, de tu parte.",
    },
    preguntaPista: "Por ejemplo, ¿qué fue lo que más te sorprendió de la comida?",
    otraPregunta: "+ Otra pregunta",
    sacarPregunta: "Sacar pregunta",

    pagoTitulo: "Tus datos y el pago",
    pagoBajada: "Te mandamos todo a tu correo. Con ese mismo correo entrás a la página del viaje.",
    email: "Tu correo",
    emailPista: "vos@ejemplo.com",
    despues: "Qué pasa después de pagar.",
    despuesTexto: {
      yo: "te llega un correo para entrar a la página del viaje, y el biógrafo te escribe por WhatsApp para presentarse. Respondés SÍ y empieza.",
      regalo: "te llega un correo para entrar a la página del viaje, y el biógrafo le escribe por WhatsApp para contarle que es tu regalo. Responde SÍ y empieza.",
    },
    legalAntes: "Pago único y seguro con Mercado Pago. Al pagar aceptás los ",
    legalDespues: ".",
    // APROBADO por Naza el 19/10 · tanda 6, texto 7
    garantia: "Si el viaje no se hace y nos avisás antes de que acepte la entrevista, te devolvemos todo. Si ya aceptó y contesta menos de diez preguntas, también te devolvemos todo.",
    incluye: ["Las preguntas por WhatsApp, antes, durante y después del viaje", "El álbum con las fotos favoritas", "Un código QR para escuchar los audios"],
    libroDelViaje: "El libro del viaje",

    faltaNombre: "Decinos tu nombre.",
    faltaNombreViajero: "Falta el nombre de quien viaja.",
    faltaWhatsapp: "Falta tu WhatsApp. Ahí te escribe el biógrafo.",
    faltaWhatsappViajero: "Falta el WhatsApp de quien viaja. Ahí le escribe el biógrafo.",
    faltaTuNombre: "Decinos tu nombre.",
    faltaQuienRegala: "Falta cómo te llama quien viaja.",
    faltaFechas: "Necesitamos la fecha de salida y la de vuelta.",
    fechas: {
      vueltaAntes: "La vuelta no puede ser antes de la salida.",
      salidaPasada: "La salida no puede ser un día que ya pasó.",
      muyCorto: "El viaje tiene que durar al menos 3 días, contando la salida y la vuelta.",
      muyLargo: "Para un viaje de más de 120 días, escribinos y lo armamos aparte.",
    },
    faltaPais: "Elegí el país principal del viaje.",
    faltaCasa: "Elegí el país donde vive quien viaja.",
    muchasPreguntas: "Van hasta cinco preguntas propias.",
    preguntaLarga: "Una de las preguntas es muy larga. Acortala un poco.",
    correoMal: "Necesitamos un correo válido. Con ese entrás a la página del viaje.",
  },

  /* ─────────────────────── Catalán, de tu (revisado con Softcatalà, 19/10) ─────────────────────── */
  ca: {
    tituloPagina: "Vitácora de viatge",
    descripcion: "Un biògraf et pregunta per WhatsApp abans, durant i després del viatge. En tornar, el teu viatge és un llibre amb les teves fotos i la teva veu.",
    pasos: ["El llibre", "El viatge", "Pagament"],
    pasoDe: (n, t) => `Pas ${n} de ${t}`,
    continuar: "Continuar",
    atras: "Enrere",
    marca: "Vitácora de viatge",
    noDisponible: "La Vitácora de viatge encara no està disponible a la teva regió.",

    libroTitulo: "Com vols el llibre del viatge?",
    libroBajada: "Tots dos porten el viatge explicat, l'àlbum de fotos i un codi QR per escoltar els àudios.",
    impresoTitulo: "Llibre imprès en tapa dura + PDF",
    impresoDetalle: "El llibre imprès i enquadernat, i també en PDF. L'enviament està inclòs. T'avisem quan surti d'impremta i t'enviem el seguiment.",
    pdfTitulo: "Llibre en PDF",
    pdfDetalle: "Per llegir-lo a qualsevol pantalla i guardar-lo per sempre.",
    albumTitulo: "L'àlbum del final",
    albumBajada: "En tornar, qui viatja tria les seves fotos preferides i van al final del llibre.",
    album: (n) => `${n} fotos`,
    mas: (p) => `+ ${p}`,

    viajeTitulo: "El viatge",
    viajeBajada: "Només les dates i el país. Les ciutats surten del que s'explica durant el viatge.",
    paraQuien: "Per a qui és?",
    paraMi: "Per a mi",
    esRegalo: "És un regal",
    tuNombre: "El teu nom",
    tuNombrePista: "Nom i cognoms",
    quienRegala: "Com et diu",
    quienRegalaAyuda: "Així li explica el biògraf qui li fa el regal. Per exemple, mama o Lucía.",
    nombre: { yo: "El teu nom", regalo: "Nom de qui viatja" },
    nombrePista: "Nom i cognoms",
    comoLeDicen: { yo: "Com et diuen", regalo: "Com li diuen" },
    comoLeDicenAyuda: { yo: "Amb aquest nom t'escriu el biògraf.", regalo: "Amb aquest nom li escriu el biògraf." },
    whatsapp: { yo: "El teu WhatsApp", regalo: "El seu WhatsApp" },
    whatsappAyuda: { yo: "Allà t'escriu el biògraf.", regalo: "Allà li escriu el biògraf per explicar-li que és el teu regal." },
    salida: "Dia de sortida",
    vuelta: "Dia de tornada",
    dias: (n) => `${n} dies de viatge`,
    paisViaje: "País principal del viatge",
    paisViajeAyuda: "Els missatges arriben amb l'hora d'aquest país. Si en són diversos, tria el de més dies.",
    paisCasa: { yo: "País on vius", regalo: "País on viu" },
    elegir: "Tria'n un",
    hora: { yo: "A quina hora del vespre t'escriu", regalo: "A quina hora del vespre li escriu" },
    idioma: "Idioma del biògraf",
    idiomas: { "es-ES": "Castellà d'Espanya", "es-AR": "Castellà d'Argentina", ca: "Català" },
    preguntas: "Preguntes pròpies (opcional)",
    preguntasAyuda: {
      yo: "Vols que et preguntem per alguna cosa especial del teu viatge? Escriu-ho aquí, fins a cinc. Si no, queden les del biògraf.",
      regalo: "Li vols preguntar alguna cosa especial del seu viatge? Escriu-ho aquí, fins a cinc. Li arriba tal qual, de part teva.",
    },
    preguntaPista: "Per exemple, què és el que més et va sorprendre del menjar?",
    otraPregunta: "+ Una altra pregunta",
    sacarPregunta: "Treure la pregunta",

    pagoTitulo: "Les teves dades i el pagament",
    pagoBajada: "T'ho enviem tot al teu correu. Amb aquest mateix correu entres a la pàgina del viatge.",
    email: "El teu correu",
    emailPista: "nom@exemple.com",
    despues: "Què passa després de pagar.",
    despuesTexto: {
      yo: "t'arriba un correu per entrar a la pàgina del viatge, i el biògraf t'escriu per WhatsApp per presentar-se. Respons SÍ i comença.",
      regalo: "t'arriba un correu per entrar a la pàgina del viatge, i el biògraf li escriu per WhatsApp per explicar-li que és el teu regal. Respon SÍ i comença.",
    },
    legalAntes: "Pagament únic i segur amb Stripe. En pagar acceptes les ",
    // PENDIENTE REVISIÓN NATIVA (Imma) · traducción de la tanda 6, texto 6
    legalDespues: " i ens demanes que l'entrevista comenci de seguida, sense esperar els 14 dies de desistiment.",
    garantia: "Si el viatge no es fa i ens avises abans que accepti l'entrevista, t'ho retornem tot. Si ja ha acceptat i contesta menys de deu preguntes, també t'ho retornem tot.",
    incluye: ["Les preguntes per WhatsApp, abans, durant i després del viatge", "L'àlbum amb les fotos preferides", "Un codi QR per escoltar els àudios"],
    libroDelViaje: "El llibre del viatge",

    faltaNombre: "Digues-nos el teu nom.",
    faltaNombreViajero: "Falta el nom de qui viatja.",
    faltaWhatsapp: "Falta el teu WhatsApp. Allà t'escriu el biògraf.",
    faltaWhatsappViajero: "Falta el WhatsApp de qui viatja. Allà li escriu el biògraf.",
    faltaTuNombre: "Digues-nos el teu nom.",
    faltaQuienRegala: "Falta com et diu qui viatja.",
    faltaFechas: "Necessitem la data de sortida i la de tornada.",
    fechas: {
      vueltaAntes: "La tornada no pot ser abans de la sortida.",
      salidaPasada: "La sortida no pot ser un dia que ja ha passat.",
      muyCorto: "El viatge ha de durar com a mínim 3 dies, comptant la sortida i la tornada.",
      muyLargo: "Per a un viatge de més de 120 dies, escriu-nos i ho organitzem a part.",
    },
    faltaPais: "Tria el país principal del viatge.",
    faltaCasa: "Tria el país on viu qui viatja.",
    muchasPreguntas: "Hi caben fins a cinc preguntes pròpies.",
    preguntaLarga: "Una de les preguntes és massa llarga. Escurça-la una mica.",
    correoMal: "Necessitem un correu vàlid. Amb aquest entres a la pàgina del viatge.",
  },
};
