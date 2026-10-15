import type { Textos } from "@/lib/idioma-web";
import type { ANGULOS, COMPANIAS, PROPOSITOS } from "@/lib/viaje";

// Los textos de la compra de la Vitácora de viaje (/comprar/viaje, /ca/comprar/viaje,
// /ar/comprar/viaje), con el mismo cascarón que la del libro de una vida
// (maquetas CheckoutViaje y CheckoutViajeMovil).
//
// es = castellano de España; a los que viajan, de vosotros («os escribimos»,
// TEXTOS-Y-REGLAS §1), y a quien paga, de tú. ar = de vos, como hoy (el viajero
// se compra a sí mismo): lo de vos que ya existía va igual, salvo «cada noche»
// y «una pregunta por noche», que salen hasta que Naza decida B24. ca = de
// vosaltres a los que viajan, de tú a quien paga.
// ca: PENDIENTE REVISIÓN NATIVA (el bloque ca).

type Compania = (typeof COMPANIAS)[number];
type Proposito = (typeof PROPOSITOS)[number];
type Angulo = (typeof ANGULOS)[number];

export type HorasViaje = Record<"20:30" | "21:30" | "22:30" | "08:30", string>;

export type TextosViaje = {
  tituloPagina: string;
  descripcion: string;
  pasos: [string, string, string];
  pasoDe: (n: number, total: number) => string;
  continuar: string;
  atras: string;
  marca: string;
  noDisponible: string;

  // 1 · Vuestro libro
  libroTitulo: string;
  libroBajada: string;
  digitalTitulo: string;
  digitalDetalle: string;
  impresoTitulo: string;
  impresoDetalle: string;
  marcoEtiqueta: string;
  marcoTitulo: string;
  marcoDetalle: string;
  marcoFotoAlt: string;
  marcoSoloImpreso: string;
  /** La opción del libro completo (impreso + digital + el marco), la primera del paso 1. Aprobada por Naza el 14/10 (es y ar). */
  marcoOpcionTitulo: string;
  marcoOpcionDetalle: string;
  /** El contador de marcos para regalar (14/10), con la voz de viaje. Aprobado por Naza el 14/10 (es y ar). */
  marcoRegaloDetalle: string;
  /** La fila del primer marco (impreso sin marco), en la voz del viaje. Aprobado por Naza el 14/10. */
  marcoPrimeroTitulo: string;

  // 2 · El viaje
  viajeTitulo: string;
  viajeBajada: string;
  tuNombre: string;
  tuNombrePista: string;
  comoTeDicen: string;
  comoTeDicenPista: string;
  whatsapp: string;
  whatsappAyuda: string;
  salida: string;
  vuelta: string;
  dias: (n: number) => string;
  etapas: string;
  etapasAyuda: string;
  etapa: (n: number) => string;
  etapaPrimera: string;
  etapaOtra: string;
  desde: string;
  hasta: string;
  sacarEtapa: string;
  agregarEtapa: string;
  conQuien: string;
  companias: Record<Compania, string>;
  paraQue: string;
  propositos: Record<Proposito, { titulo: string; detalle: string }>;
  queSiempre: string;
  queSiempreAyuda: string;
  angulos: Record<Angulo, string>;
  hora: string;
  horas: HorasViaje;
  zona: string;
  evitar: string;
  evitarPista: string;

  // 3 · Pago
  pagoTitulo: string;
  pagoBajada: string;
  email: string;
  emailPista: string;
  despues: string;
  despuesTexto: string;
  legalAntes: string;
  legalDespues: string;
  garantia: string;
  incluye: string[];
  libroDelViaje: string;

  // Errores
  faltaNombre: string;
  faltaWhatsapp: string;
  faltaFechas: string;
  vueltaAntes: string;
  correoMal: string;
};

export const CHECKOUT_VIAJE: Textos<TextosViaje> = {
  es: {
    tituloPagina: "Vitácora de viaje",
    descripcion: "Un biógrafo os acompaña por WhatsApp durante el viaje, guarda vuestras fotos y, al volver, el viaje es un libro.",
    pasos: ["Vuestro libro", "El viaje", "Pago"],
    pasoDe: (n, t) => `Paso ${n} de ${t}`,
    continuar: "Continuar",
    atras: "Atrás",
    marca: "Vitácora de viaje",
    noDisponible: "La Vitácora de viaje todavía no está disponible en tu región.",

    libroTitulo: "¿Cómo queréis vuestro libro?",
    libroBajada: "Todas las opciones incluyen el viaje entero y el libro en PDF con vuestra voz.",
    digitalTitulo: "Libro digital",
    digitalDetalle: "PDF para leer en cualquier pantalla, con vuestros audios a un toque.",
    impresoTitulo: "Libro impreso en tapa dura + digital",
    impresoDetalle: "El mismo libro, impreso y encuadernado, y también en PDF. El envío está incluido. Te avisamos cuando salga de imprenta y te mandamos el seguimiento.",
    marcoEtiqueta: "Añade un detalle",
    marcoTitulo: "Vuestra foto del viaje, enmarcada.",
    marcoDetalle: "Un marco con la foto que elijáis. Lleva un chip escondido. Acercáis el móvil y se abre el libro del viaje, con vuestra voz.",
    marcoFotoAlt: "Un marco con la foto de un viaje junto a su libro",
    marcoSoloImpreso: "El marco va con el libro impreso. Elige el impreso para añadirlo.",
    // APROBADO por Naza el 14/10 (la opción del libro completo).
    marcoOpcionTitulo: "Impreso + digital + vuestra foto enmarcada",
    marcoOpcionDetalle: "El libro impreso y en PDF, y un marco con vuestra foto del viaje. Acercáis el móvil al marco y se abre el libro del viaje, con vuestra voz.",
    // APROBADO por Naza el 14/10.
    marcoPrimeroTitulo: "Marco con vuestra foto",
    marcoRegaloDetalle: "Para regalar a vuestra familia. Al acercar el móvil se abre el libro del viaje, con vuestra voz.",

    viajeTitulo: "El viaje",
    viajeBajada: "Lo que sepáis hoy. Las etapas que no tengan fecha se completan después desde la página de vuestro viaje, y si aparece una ciudad nueva, se añade ahí.",
    tuNombre: "Tu nombre",
    tuNombrePista: "Nombre y apellidos",
    comoTeDicen: "Cómo te dicen",
    comoTeDicenPista: "Así te va a saludar",
    whatsapp: "Tu WhatsApp",
    whatsappAyuda: "Ahí os escribe el biógrafo durante el viaje.",
    salida: "Salida",
    vuelta: "Vuelta",
    dias: (n) => `${n} ${n === 1 ? "día" : "días"}`,
    etapas: "Las etapas",
    etapasAyuda: "Ciudad o tramo, y las fechas si las tenéis.",
    etapa: (n) => `Etapa ${n}`,
    etapaPrimera: "Lisboa",
    etapaOtra: "Otra ciudad o tramo",
    desde: "Desde",
    hasta: "Hasta",
    sacarEtapa: "Quitar etapa",
    agregarEtapa: "+ Añadir etapa",
    conQuien: "¿Con quién viajáis?",
    companias: { solo: "Solo", pareja: "En pareja", amigos: "Con amigos", familia: "En familia" },
    paraQue: "¿Para qué es el libro?",
    propositos: {
      recuerdo: { titulo: "Para nosotros, como recuerdo", detalle: "Íntimo. Lo que queráis contar, sin filtro." },
      compartir: { titulo: "Para compartir con nuestra gente", detalle: "Para leerlo con quienes os quieren." },
      publico: { titulo: "Para nuestro público", detalle: "Publicable, con lo que os gustaría que otros lean." },
    },
    queSiempre: "¿Qué queréis que os pregunte siempre?",
    queSiempreAyuda: "Elegid dos o tres. El resto lo va cambiando el biógrafo.",
    angulos: { mejor: "Lo mejor del día", persona: "La gente que conocemos", comida: "Lo que comemos", plan: "Lo que sale distinto del plan", lugar: "Los lugares inesperados", vos: "Lo que pensamos de nosotros" },
    hora: "¿A qué hora os escribe?",
    horas: { "20:30": "Después de cenar (20:30)", "21:30": "Por la noche (21:30)", "22:30": "Más tarde por la noche (22:30)", "08:30": "A la mañana siguiente (8:30)" },
    zona: "Hora de dónde",
    evitar: "Temas que no se preguntan (opcional)",
    evitarPista: "Por ejemplo, no preguntar por el trabajo.",

    pagoTitulo: "Tus datos y el pago",
    pagoBajada: "Te mandamos todo a tu correo. Con ese mismo correo entras a la página de tu viaje.",
    email: "Tu correo",
    emailPista: "nombre@ejemplo.com",
    despues: "Qué pasa después de pagar.",
    despuesTexto: "te llega un correo para entrar a la página de tu viaje, y el biógrafo os escribe por WhatsApp para presentarse. Respondéis SÍ y empieza.",
    legalAntes: "Pago único y seguro con Stripe. Al pagar aceptas los ",
    legalDespues: ".",
    garantia: "Si el viaje se cancela, te devolvemos el dinero.",
    incluye: ["El biógrafo por WhatsApp durante todo el viaje", "Vuestras fotos, con su historia, guardadas por día", "Lo leéis y lo compartís desde la web"],
    libroDelViaje: "El libro del viaje",

    faltaNombre: "Dinos tu nombre.",
    faltaWhatsapp: "Falta tu WhatsApp. Ahí os escribe el biógrafo.",
    faltaFechas: "Necesitamos la fecha de salida y la de vuelta.",
    vueltaAntes: "La vuelta no puede ser antes de la salida.",
    correoMal: "Necesitamos un correo válido. Con ese entras a la página de tu viaje.",
  },
  ar: {
    tituloPagina: "Vitácora de viaje",
    descripcion: "Tu biógrafo te acompaña por WhatsApp durante el viaje, guarda tus fotos y, al volver, tu viaje es un libro.",
    pasos: ["Tu libro", "El viaje", "Pago"],
    pasoDe: (n, t) => `Paso ${n} de ${t}`,
    continuar: "Continuar",
    atras: "Atrás",
    marca: "Vitácora de viaje",
    noDisponible: "La Vitácora de viaje todavía no está disponible en tu región.",

    libroTitulo: "¿Cómo querés tu libro?",
    libroBajada: "Todas las opciones incluyen el viaje entero y el libro en PDF con tu voz.",
    digitalTitulo: "Libro digital",
    digitalDetalle: "PDF para leer en cualquier pantalla, con tus audios a un toque.",
    impresoTitulo: "Libro impreso en tapa dura + digital",
    impresoDetalle: "El mismo libro, impreso y encuadernado, y también en PDF. El envío está incluido. Te avisamos cuando salga de imprenta y te mandamos el seguimiento.",
    marcoEtiqueta: "Sumá un detalle",
    marcoTitulo: "Tu foto del viaje, enmarcada.",
    marcoDetalle: "Un marco con la foto que elijas. Lleva un chip escondido. Acercás el celular y se abre el libro del viaje, con tu voz.",
    marcoFotoAlt: "Un marco con la foto de un viaje junto a su libro",
    marcoSoloImpreso: "El marco va con el libro impreso. Elegí el impreso para sumarlo.",
    // APROBADO por Naza el 14/10 (la opción del libro completo).
    marcoOpcionTitulo: "Impreso + digital + tu foto enmarcada",
    marcoOpcionDetalle: "El libro impreso y en PDF, y un marco con tu foto del viaje. Acercás el celular al marco y se abre el libro del viaje, con tu voz.",
    // APROBADO por Naza el 14/10.
    marcoPrimeroTitulo: "Marco con tu foto",
    marcoRegaloDetalle: "Para regalar a tu familia. Al acercar el celular se abre el libro del viaje, con tu voz.",

    viajeTitulo: "El viaje",
    viajeBajada: "Lo que sepas hoy. Las etapas que no tengan fecha se completan después desde la página de tu viaje, y si aparece una ciudad nueva, la agregás ahí.",
    tuNombre: "Tu nombre",
    tuNombrePista: "Nombre y apellido",
    comoTeDicen: "Cómo te dicen",
    comoTeDicenPista: "Así te va a saludar",
    whatsapp: "Tu WhatsApp",
    whatsappAyuda: "Ahí te escribe el biógrafo durante el viaje.",
    salida: "Salís el",
    vuelta: "Volvés el",
    dias: (n) => `${n} ${n === 1 ? "día" : "días"}`,
    etapas: "Las etapas",
    etapasAyuda: "Ciudad o tramo, y las fechas si las tenés.",
    etapa: (n) => `Etapa ${n}`,
    etapaPrimera: "Lisboa",
    etapaOtra: "Otra ciudad o tramo",
    desde: "Desde",
    hasta: "Hasta",
    sacarEtapa: "Sacar etapa",
    agregarEtapa: "+ Agregar etapa",
    conQuien: "¿Con quién viajás?",
    companias: { solo: "Solo", pareja: "En pareja", amigos: "Con amigos", familia: "En familia" },
    paraQue: "¿Para qué es el libro?",
    propositos: {
      recuerdo: { titulo: "Para mí, como recuerdo", detalle: "Íntimo. Lo que quieras contar, sin filtro." },
      compartir: { titulo: "Para compartir con mi gente", detalle: "Contable, para leerlo con quienes te quieren." },
      publico: { titulo: "Para mi público", detalle: "Publicable, con lo que te gustaría que otros lean." },
    },
    queSiempre: "¿Qué querés que te pregunte siempre?",
    queSiempreAyuda: "Elegí dos o tres. El resto lo va rotando el biógrafo.",
    angulos: { mejor: "Lo mejor del día", persona: "La gente que conozco", comida: "Lo que como", plan: "Lo que sale distinto del plan", lugar: "Los lugares inesperados", vos: "Lo que pienso de mí" },
    hora: "¿A qué hora te escribe?",
    horas: { "20:30": "Después de cenar (20:30)", "21:30": "A la noche (21:30)", "22:30": "Tarde en la noche (22:30)", "08:30": "A la mañana siguiente (8:30)" },
    zona: "Hora de dónde",
    evitar: "Temas que no se preguntan (opcional)",
    evitarPista: "Por ejemplo, no preguntar por el trabajo.",

    pagoTitulo: "Tus datos y el pago",
    pagoBajada: "Te mandamos todo a tu correo. Con ese mismo correo entrás a la página de tu viaje.",
    email: "Tu correo",
    emailPista: "vos@ejemplo.com",
    despues: "Qué pasa después de pagar.",
    despuesTexto: "te llega un correo para entrar a la página de tu viaje, y el biógrafo te escribe por WhatsApp para presentarse. Respondés SÍ y arranca la primera noche.",
    legalAntes: "Pago único y seguro con Mercado Pago. Al pagar aceptás los ",
    legalDespues: ".",
    garantia: "Si el viaje se cancela, te devolvemos el dinero.",
    incluye: ["El biógrafo por WhatsApp durante todo el viaje", "Tus fotos, con su historia, guardadas por día", "Lo leés y lo compartís desde la web"],
    libroDelViaje: "El libro de tu viaje",

    faltaNombre: "Decinos tu nombre.",
    faltaWhatsapp: "Falta tu WhatsApp. Ahí te escribe el biógrafo.",
    faltaFechas: "Necesitamos la fecha de salida y la de vuelta.",
    vueltaAntes: "La vuelta no puede ser antes de la salida.",
    correoMal: "Necesitamos un correo válido. Con ese entrás a la página de tu viaje.",
  },
  ca: {
    tituloPagina: "Vitácora de viatge",
    descripcion: "Un biògraf us acompanya per WhatsApp durant el viatge, guarda les vostres fotos i, en tornar, el viatge és un llibre.",
    pasos: ["El vostre llibre", "El viatge", "Pagament"],
    pasoDe: (n, t) => `Pas ${n} de ${t}`,
    continuar: "Continuar",
    atras: "Enrere",
    marca: "Vitácora de viatge",
    noDisponible: "La Vitácora de viatge encara no està disponible a la teva regió.",

    libroTitulo: "Com voleu el vostre llibre?",
    libroBajada: "Totes les opcions inclouen el viatge sencer i el llibre en PDF amb la vostra veu.",
    digitalTitulo: "Llibre digital",
    digitalDetalle: "PDF per llegir a qualsevol pantalla, amb els vostres àudios a un toc.",
    impresoTitulo: "Llibre imprès en tapa dura + digital",
    impresoDetalle: "El mateix llibre, imprès i enquadernat, i també en PDF. L'enviament està inclòs. T'avisem quan surti d'impremta i t'enviem el seguiment.",
    marcoEtiqueta: "Afegeix un detall",
    marcoTitulo: "La vostra foto del viatge, emmarcada.",
    marcoDetalle: "Un marc amb la foto que trieu. Porta un xip amagat. Hi acosteu el mòbil i s'obre el llibre del viatge, amb la vostra veu.",
    marcoFotoAlt: "Un marc amb la foto d'un viatge al costat del seu llibre",
    marcoSoloImpreso: "El marc va amb el llibre imprès. Tria l'imprès per afegir-lo.",
    // PENDIENTE REVISIÓN NATIVA (es/ar aprobados por Naza el 14/10): l'opció del llibre complet.
    marcoOpcionTitulo: "Imprès + digital + la vostra foto emmarcada",
    marcoOpcionDetalle: "El llibre imprès i en PDF, i un marc amb la vostra foto del viatge. Hi acosteu el mòbil i s'obre el llibre del viatge, amb la vostra veu.",
    // PENDIENTE REVISIÓN NATIVA (es/ar aprobados por Naza el 14/10).
    marcoPrimeroTitulo: "Marc amb la vostra foto", // ca: PENDIENTE REVISIÓN NATIVA
    marcoRegaloDetalle: "Per regalar a la vostra família. Quan hi acosteu el mòbil s'obre el llibre del viatge, amb la vostra veu.",

    viajeTitulo: "El viatge",
    viajeBajada: "El que sapigueu avui. Les etapes sense data es completen després des de la pàgina del vostre viatge, i si apareix una ciutat nova, s'hi afegeix.",
    tuNombre: "El teu nom",
    tuNombrePista: "Nom i cognoms",
    comoTeDicen: "Com et diuen",
    comoTeDicenPista: "Així et saludarà",
    whatsapp: "El teu WhatsApp",
    whatsappAyuda: "Allà us escriu el biògraf durant el viatge.",
    salida: "Sortida",
    vuelta: "Tornada",
    dias: (n) => `${n} ${n === 1 ? "dia" : "dies"}`,
    etapas: "Les etapes",
    etapasAyuda: "Ciutat o tram, i les dates si les teniu.",
    etapa: (n) => `Etapa ${n}`,
    etapaPrimera: "Lisboa",
    etapaOtra: "Una altra ciutat o tram",
    desde: "Des de",
    hasta: "Fins a",
    sacarEtapa: "Treure l'etapa",
    agregarEtapa: "+ Afegir una etapa",
    conQuien: "Amb qui viatgeu?",
    companias: { solo: "Sol", pareja: "En parella", amigos: "Amb amics", familia: "En família" },
    paraQue: "Per a què és el llibre?",
    propositos: {
      recuerdo: { titulo: "Per a nosaltres, com a record", detalle: "Íntim. El que vulgueu explicar, sense filtre." },
      compartir: { titulo: "Per compartir amb la nostra gent", detalle: "Per llegir-lo amb els qui us estimen." },
      publico: { titulo: "Per al nostre públic", detalle: "Publicable, amb el que us agradaria que altres llegissin." },
    },
    queSiempre: "Què voleu que us pregunti sempre?",
    queSiempreAyuda: "Trieu-ne dos o tres. La resta l'anirà canviant el biògraf.",
    angulos: { mejor: "El millor del dia", persona: "La gent que coneixem", comida: "El que mengem", plan: "El que surt diferent del pla", lugar: "Els llocs inesperats", vos: "El que pensem de nosaltres" },
    hora: "A quina hora us escriu?",
    horas: { "20:30": "Després de sopar (20:30)", "21:30": "Al vespre (21:30)", "22:30": "Més tard al vespre (22:30)", "08:30": "L'endemà al matí (8:30)" },
    zona: "Hora d'on",
    evitar: "Temes que no es pregunten (opcional)",
    evitarPista: "Per exemple, no preguntar per la feina.",

    pagoTitulo: "Les teves dades i el pagament",
    pagoBajada: "T'ho enviem tot al teu correu. Amb aquest mateix correu entres a la pàgina del teu viatge.",
    email: "El teu correu",
    emailPista: "nom@exemple.com",
    despues: "Què passa després de pagar.",
    despuesTexto: "t'arriba un correu per entrar a la pàgina del teu viatge, i el biògraf us escriu per WhatsApp per presentar-se. Responeu SÍ i comença.",
    legalAntes: "Pagament únic i segur amb Stripe. En pagar acceptes les ",
    legalDespues: ".",
    garantia: "Si el viatge es cancel·la, et retornem els diners.",
    incluye: ["El biògraf per WhatsApp durant tot el viatge", "Les vostres fotos, amb la seva història, guardades per dia", "El llegiu i el compartiu des del web"],
    libroDelViaje: "El llibre del viatge",

    faltaNombre: "Digues-nos el teu nom.",
    faltaWhatsapp: "Falta el teu WhatsApp. Allà us escriu el biògraf.",
    faltaFechas: "Necessitem la data de sortida i la de tornada.",
    vueltaAntes: "La tornada no pot ser abans de la sortida.",
    correoMal: "Necessitem un correu vàlid. Amb aquest entres a la pàgina del teu viatge.",
  },
};
