import type { Textos } from "@/lib/idioma-web";
import type { IdiomaRegalo } from "@/lib/regalo-textos";
import type { LineaId } from "@/lib/productos";
import type { Direccion } from "@/lib/entregas";
import { MENSAJE_PALABRA_DE_FAMILIA, MENSAJE_PALABRA_DE_FAMILIA_TU } from "@/lib/como-le-dicen";

// Los textos del checkout del libro de una vida (/comprar, /ca/comprar,
// /ar/comprar) y de las piezas que comparte con la compra de viaje y con
// /regalar: la cabecera, el aviso del pago fallido y el resumen.
//
// es = castellano de España, de tú · ar = Argentina, de vos (lo aprobado del
// 06/10 y del 13/10, docs/web-textos-v3/aprobados.md) · ca = catalán, de tú.
// Los textos nuevos están listados en docs/rediseno-2026-10/fase-1/textos-checkout.md
// para que los apruebe Naza.
// ca: PENDIENTE REVISIÓN NATIVA (todo el bloque ca de este archivo).

export type Para = "padre" | "madre" | "abuelo" | "abuela" | "otra" | "yo";

/** La cabecera mínima del checkout (maqueta Checkout): logo, pago seguro y entrar. */
export type TextosCabecera = {
  inicio: string;
  pagoSeguro: string;
  yaCompre: string;
  dudas: string;
};

export const CABECERA: Textos<TextosCabecera> = {
  es: { inicio: "Vitácora, inicio", pagoSeguro: "Pago seguro y cifrado", yaCompre: "Ya he comprado · Entrar", dudas: "¿Dudas? Escríbenos" },
  ar: { inicio: "Vitácora, inicio", pagoSeguro: "Pago seguro y cifrado", yaCompre: "Ya compré · Entrar", dudas: "¿Dudas? Escribinos" },
  ca: { inicio: "Vitácora, inici", pagoSeguro: "Pagament segur i xifrat", yaCompre: "Ja he comprat · Entrar", dudas: "Dubtes? Escriu-nos" },
};

/** Casos 2: la pasarela volvió sin cobrar. */
export type TextosFallo = { titulo: string; otraVez: string; porQue: string; guardado: string };

export const FALLO: Textos<TextosFallo> = {
  es: {
    titulo: "Tu banco no ha aceptado el pago. No se te ha cobrado nada.",
    otraVez: "Probemos otra vez.",
    porQue: "Suele ser por un límite de la tarjeta o porque el banco pide confirmarlo en su app.",
    guardado: "Lo que elegiste sigue guardado.",
  },
  ar: {
    titulo: "Tu banco no aceptó el pago. No se te cobró nada.",
    otraVez: "Probemos otra vez.",
    porQue: "Suele ser por un límite de la tarjeta o porque el banco pide confirmarlo en su app.",
    guardado: "Lo que elegiste sigue guardado.",
  },
  ca: {
    titulo: "El teu banc no ha acceptat el pagament. No se t'ha cobrat res.",
    otraVez: "Tornem-ho a provar.",
    porQue: "Sol ser per un límit de la targeta o perquè el banc demana confirmar-ho a la seva app.",
    guardado: "El que vas triar continua guardat.",
  },
};

/** El resumen de la derecha: los nombres de las líneas del ticket y lo que trae. */
export type TextosResumen = {
  etiqueta: string;
  marca: string;
  libroDe: (nombre: string) => string;
  tuLibro: string;
  suLibro: string;
  para: Record<Para, string>;
  lineas: Record<LineaId, string>;
  total: string;
  pagoUnico: string;
  incluye: (propia: boolean) => string[];
};

export const RESUMEN: Textos<TextosResumen> = {
  es: {
    etiqueta: "Resumen del pedido",
    marca: "Vitácora Familiar",
    libroDe: (n) => `El libro de ${n}`,
    tuLibro: "Tu libro",
    suLibro: "Su libro",
    para: { padre: "Para tu padre", madre: "Para tu madre", abuelo: "Para tu abuelo", abuela: "Para tu abuela", otra: "Para alguien especial", yo: "Para ti" },
    lineas: {
      pdf: "Entrevista + libro digital",
      viaje: "Vitácora de viaje",
      impreso: "Libro impreso, tapa dura",
      copia: "Copia extra del libro impreso",
      marco: "Su foto enmarcada",
      marco_adicional: "Marco adicional",
    },
    total: "Total",
    pagoUnico: "IVA incluido. Un solo pago, sin suscripciones.",
    incluye: (propia) =>
      propia
        ? ["La entrevista por WhatsApp, a tu ritmo y con audios", "El libro en PDF con «Tu voz»", "Escuchas tus audios desde tu panel"]
        : ["La entrevista por WhatsApp, a su ritmo y con audios", "El libro en PDF con «Su voz»", "Escuchas sus audios mientras cuenta, desde tu panel"],
  },
  ar: {
    etiqueta: "Resumen del pedido",
    marca: "Vitácora Familiar",
    libroDe: (n) => `El libro de ${n}`,
    tuLibro: "Tu libro",
    suLibro: "Su libro",
    para: { padre: "Para tu papá", madre: "Para tu mamá", abuelo: "Para tu abuelo", abuela: "Para tu abuela", otra: "Para alguien especial", yo: "Para vos" },
    lineas: {
      pdf: "Entrevista + libro digital",
      viaje: "Vitácora de viaje",
      impreso: "Libro impreso, tapa dura",
      copia: "Copia extra del libro impreso",
      marco: "Su foto enmarcada",
      marco_adicional: "Marco adicional",
    },
    total: "Total",
    // «IVA incluido» en Argentina: POR COMPROBAR con el socio (TEXTOS-Y-REGLAS §2).
    pagoUnico: "Un solo pago, sin suscripciones.",
    incluye: (propia) =>
      propia
        ? ["La entrevista por WhatsApp, a tu ritmo y con audios", "El libro en PDF con «Tu voz»", "Escuchás tus audios desde tu panel"]
        : ["La entrevista por WhatsApp, a su ritmo y con audios", "El libro en PDF con «Su voz»", "Escuchás sus audios mientras cuenta, desde tu panel"],
  },
  ca: {
    etiqueta: "Resum de la comanda",
    marca: "Vitácora Familiar",
    libroDe: (n) => `El llibre de ${n}`,
    tuLibro: "El teu llibre",
    suLibro: "El seu llibre",
    para: { padre: "Per al teu pare", madre: "Per a la teva mare", abuelo: "Per al teu avi", abuela: "Per a la teva àvia", otra: "Per a algú especial", yo: "Per a tu" },
    lineas: {
      pdf: "Entrevista + llibre digital",
      viaje: "Vitácora de viatge",
      impreso: "Llibre imprès, tapa dura",
      copia: "Còpia extra del llibre imprès",
      marco: "La seva foto emmarcada",
      marco_adicional: "Marc addicional",
    },
    total: "Total",
    pagoUnico: "IVA inclòs. Un sol pagament, sense subscripcions.",
    incluye: (propia) =>
      propia
        ? ["L'entrevista per WhatsApp, al teu ritme i amb àudios", "El llibre en PDF amb «La teva veu»", "Escoltes els teus àudios des del teu panell"]
        : ["L'entrevista per WhatsApp, al seu ritme i amb àudios", "El llibre en PDF amb «La seva veu»", "Escoltes els seus àudios mentre explica, des del teu panell"],
  },
};

/** Las horas en que le escribe el biógrafo (los valores son los de lib/horario.ts). */
export type NombresHoras = Record<"09:00" | "11:00" | "16:00" | "19:00", string>;

export type TextosCheckout = {
  tituloPagina: string;
  descripcion: string;
  pasos: [string, string, string];
  pasosEtiqueta: string;
  pasoDe: (n: number, total: number) => string;
  continuar: string;
  atras: string;

  // Paso 1 · Su libro
  libroTitulo: string;
  libroBajada: string;
  digitalTitulo: string;
  digitalDetalle: string;
  impresoEtiqueta: string;
  impresoTitulo: string;
  impresoDetalle: string;
  marcoEtiqueta: string;
  marcoTitulo: string;
  marcoDetalle: string;
  marcoFotoAlt: string;
  marcoAnadir: (precio: string) => string;
  marcoAnadido: (precio: string) => string;
  marcoSoloImpreso: string;
  copiasTitulo: string;
  marcosExtraTitulo: string;
  cadaUno: (precio: string) => string;
  unoMenos: (que: string) => string;
  unoMas: (que: string) => string;

  // Paso 2 · Para quién
  paraTitulo: string;
  esPara: string;
  opciones: Record<Para, string>;
  introOtro: string;
  introYo: string;
  generoOtra: string;
  generoYo: string;
  generos: { varon: string; mujer: string; otro: string };
  generosOtra: { varon: string; mujer: string; otro: string };
  nombreOtro: string;
  nombreYo: string;
  nombreAyuda: string;
  nombrePista: string;
  comoOtro: string;
  comoYo: string;
  comoAyudaOtro: (ella: boolean) => string;
  comoAyudaYo: string;
  comoPista: string;
  esRegalo: string;
  regaloSi: string;
  regaloSiDetalle: string;
  regaloNo: string;
  regaloNoDetalle: string;
  tarjetaTitulo: string;
  tarjetaDetalle: string;
  navidad: string;
  otraFecha: string;
  whatsappOtro: string;
  whatsappYo: string;
  whatsappAyudaOtro: string;
  whatsappAyudaYo: string;
  whatsappPista: string;
  horaOtro: string;
  horaYo: string;
  horaAyudaOtro: string;
  horaAyudaYo: string;
  horas: NombresHoras;
  tratoOtro: string;
  tratoYo: string;
  tratoEtiqueta: string;
  tratos: Record<IdiomaRegalo, string>;
  masTitulo: (propia: boolean) => string;
  anio: string;
  estadoCivil: string;
  estadosCiviles: { "": string; casado: string; en_pareja: string; viudo: string; separado: string; soltero: string };
  hijosOtro: string;
  hijosYo: string;
  hijos: { "": string; si: string; no: string };
  dondeOtro: string;
  dondeYo: string;
  dondeAyuda: string;
  dondePista: string;
  masNota: string;
  fotosTituloOtro: string;
  fotosTituloYo: string;
  fotosBajada: string;
  album: string;
  albumDetalle: string;
  agregarFotos: string;
  agregarMas: (n: number, maximo: number) => string;
  fotoSubida: string;
  sacarFoto: (nombre: string) => string;
  pesaMucho: (nombre: string) => string;

  // Paso 3 · Pago
  pagoTitulo: string;
  pagoBajada: (yo: boolean, regalo: boolean) => string;
  email: string;
  emailPista: string;
  tuNombre: string;
  tuNombreRegalo: string;
  tuNombrePista: string;
  vinculo: string;
  vinculoPista: string;
  direccionTitulo: string;
  direccionAyuda: string;
  recibe: string;
  recibePista: string;
  telefonoRecibe: string;
  telefonoRecibePista: string;
  siHaceFalta: string;
  camposDireccion: Record<keyof Direccion, { nombre: string; ejemplo: string }>;
  metodos: string;
  pagar: (total: string) => string;
  procesando: string;
  subiendoFoto: (i: number, n: number) => string;
  terminos: string;
  /** La letra pequeña junto a pagar: lo legal de hoy (`antes` + enlace + `despues`). */
  legalAntes: string;
  legalDespues: string;
  garantiaFamiliar: string;
  garantiaPropia: string;

  // Errores
  faltaPara: string;
  faltaRegalo: string;
  faltaMensaje: string;
  faltaNombreYo: string;
  faltaNombreOtro: string;
  faltaComo: string;
  palabraDeFamilia: string;
  faltaGeneroYo: string;
  faltaGeneroOtro: string;
  anioMal: string;
  faltaWhatsapp: string;
  faltaTuNombre: string;
  faltaVinculo: string;
  correoMal: string;
  faltaRecibe: string;
  faltaTelefonoRecibe: string;
  errorPago: string;
  errorConexion: string;
  sacalaOIntenta: string;
  noSubio: (nombre: string) => string;
};

const HORAS_ES: NombresHoras = { "09:00": "Por la mañana (9:00)", "11:00": "A media mañana (11:00)", "16:00": "Por la tarde (16:00)", "19:00": "Al final del día (19:00)" };
// Las de Argentina son las de lib/horario.ts, tal cual.
const HORAS_AR: NombresHoras = { "09:00": "A la mañana (9:00)", "11:00": "Media mañana (11:00)", "16:00": "A la tarde (16:00)", "19:00": "Al final del día (19:00)" };

const TRATOS: Record<IdiomaRegalo, string> = { "es-AR": "De vos", "es-ES": "De tú", ca: "En catalán" };

export const CHECKOUT: Textos<TextosCheckout> = {
  es: {
    tituloPagina: "Comprar el libro",
    descripcion: "Un biógrafo entrevista por WhatsApp y escribe el libro de una vida. Pago único.",
    pasos: ["Su libro", "Para quién", "Pago"],
    pasosEtiqueta: "Pasos de la compra",
    pasoDe: (n, t) => `Paso ${n} de ${t}`,
    continuar: "Continuar",
    atras: "Atrás",

    libroTitulo: "¿Cómo quieres su libro?",
    libroBajada: "Todas las opciones incluyen la entrevista completa y el libro en PDF con su voz.",
    digitalTitulo: "Libro digital",
    digitalDetalle: "PDF para leer en cualquier pantalla, con «Su voz»: sus audios a un toque.",
    impresoEtiqueta: "Para regalar",
    impresoTitulo: "Libro impreso en tapa dura + digital",
    impresoDetalle: "El mismo libro, impreso y encuadernado, y también en PDF con su voz. El envío está incluido. Te avisamos cuando salga de imprenta y te mandamos el seguimiento.",
    marcoEtiqueta: "Añade un detalle",
    marcoTitulo: "Su foto enmarcada, junto a su libro.",
    marcoDetalle: "Un marco con la foto que elijas. Por dentro lleva un chip que no se ve: acercas el móvil al marco y se abre su libro, con su voz.",
    marcoFotoAlt: "Un marco con una foto junto a un libro, sobre un aparador",
    marcoAnadir: (p) => `Añadir el marco · +${p}`,
    marcoAnadido: (p) => `Añadido · +${p}`,
    marcoSoloImpreso: "El marco va con el libro impreso. Elige el impreso para añadirlo.",
    copiasTitulo: "Copias extra del libro impreso",
    marcosExtraTitulo: "Marcos adicionales",
    cadaUno: (p) => `+${p} cada uno`,
    unoMenos: (q) => `Uno menos: ${q}`,
    unoMas: (q) => `Uno más: ${q}`,

    paraTitulo: "¿Para quién es el libro?",
    esPara: "Es para…",
    opciones: { padre: "Mi padre", madre: "Mi madre", abuelo: "Mi abuelo", abuela: "Mi abuela", otra: "Otra persona", yo: "Para mí" },
    introOtro: "Lo justo para presentarnos bien. El resto lo va a contar en la entrevista.",
    introYo: "Tu propio libro, sin sorpresa ni tarjeta. Las preguntas te llegan a ti.",
    generoOtra: "¿Cómo nos referimos a esa persona en los textos?",
    generoYo: "¿Eres hombre o mujer? Lo necesita el biógrafo para hablarte bien.",
    generos: { varon: "Hombre", mujer: "Mujer", otro: "Prefiero no decirlo" },
    generosOtra: { varon: "Él", mujer: "Ella", otro: "Prefiero no decirlo" },
    nombreOtro: "Su nombre completo",
    nombreYo: "Tu nombre completo",
    nombreAyuda: "Va en la portada del libro.",
    nombrePista: "Roberto Fernández",
    comoOtro: "¿Cómo le escribimos?",
    comoYo: "Cómo te dicen",
    comoAyudaOtro: (ella) => `Así ${ella ? "la" : "lo"} va a saludar el biógrafo por WhatsApp. Si tiene un apodo, ponlo. Nada de "papá" ni "abuela".`,
    comoAyudaYo: "Así te vamos a saludar.",
    comoPista: "Roberto, Beto, Don Roberto",
    esRegalo: "¿Es un regalo?",
    regaloSi: "Sí, es un regalo",
    regaloSiDetalle: "Eliges el día en que empieza y te damos una tarjeta para entregárselo.",
    regaloNo: "No es regalo: que empiece ya",
    regaloNoDetalle: "En un rato le llega un mensaje nuestro por WhatsApp, contándole de qué se trata.",
    tarjetaTitulo: "Tarjeta de regalo para imprimir",
    tarjetaDetalle: "Te la mandamos por correo nada más pagar. La imprimes o la mandas por WhatsApp, y se la das ese día.",
    navidad: "Navidad · 24 dic",
    otraFecha: "Otra fecha",
    whatsappOtro: "Su WhatsApp",
    whatsappYo: "Tu WhatsApp",
    whatsappAyudaOtro: "Su número, no el tuyo. Ahí le van a llegar las preguntas.",
    whatsappAyudaYo: "Ahí te van a llegar las preguntas.",
    whatsappPista: "+34 612 345 678",
    horaOtro: "A qué hora le escribimos",
    horaYo: "A qué hora te escribimos",
    horaAyudaOtro: "A esa hora le llega el primer mensaje. Después, la siguiente le llega cuando termina de responder la anterior.",
    horaAyudaYo: "A esa hora te llega el primer mensaje. Después, la siguiente te llega cuando terminas de responder la anterior.",
    horas: HORAS_ES,
    tratoOtro: "¿Cómo le hablamos?",
    tratoYo: "¿Cómo te hablamos?",
    tratoEtiqueta: "Idioma y trato",
    tratos: TRATOS,
    masTitulo: (propia) => (propia ? "Un poco más sobre ti (opcional)" : "Un poco más sobre su vida (opcional)"),
    anio: "Año de nacimiento",
    estadoCivil: "Estado civil",
    estadosCiviles: { "": "Prefiero no decir", casado: "Casado/a", en_pareja: "En pareja", viudo: "Viudo/a", separado: "Separado/a o divorciado/a", soltero: "Soltero/a" },
    hijosOtro: "¿Tiene hijos?",
    hijosYo: "¿Tienes hijos?",
    hijos: { "": "Prefiero no decir", si: "Sí", no: "No" },
    dondeOtro: "¿Dónde vive?",
    dondeYo: "¿Dónde vives?",
    dondeAyuda: "Ciudad y país. Ayuda a entender su forma de hablar.",
    dondePista: "Valencia, España",
    masNota: "Opcional. Con esto el biógrafo no pregunta por una boda que no hubo ni por hijos que no tiene, y sabe de qué época hablan.",
    fotosTituloOtro: "Sus fotos",
    fotosTituloYo: "Tus fotos",
    fotosBajada: "Si tienes fotos suyas, súbelas aquí. También puedes hacerlo después, desde tu panel.",
    album: "El álbum del libro",
    albumDetalle: "Las fotos que quieras que estén en su libro, de cualquier momento de su vida. Después, desde tu panel, eliges cuál va en la tapa y cuáles en los marcos. Cuantos más píxeles, mejor se imprimen.",
    agregarFotos: "+ Añadir fotos",
    agregarMas: (n, m) => `+ Añadir más (${n} de ${m})`,
    fotoSubida: "Subida",
    sacarFoto: (n) => `Quitar ${n}`,
    pesaMucho: (n) => `${n} pesa más de 25 MB.`,

    pagoTitulo: "Tus datos y el pago",
    pagoBajada: (yo, regalo) =>
      regalo
        ? "Ahí te llega la tarjeta. Con ese mismo correo entras a tu panel."
        : `Ahí te avisamos ${yo ? "cuando el libro esté listo" : "cuando acepte y cuando el libro esté listo"}. Con ese mismo correo entras a tu panel.`,
    email: "Tu correo",
    emailPista: "martina@ejemplo.com",
    tuNombre: "Tu nombre",
    tuNombreRegalo: "Tu nombre, como va a aparecer en la tarjeta",
    tuNombrePista: "Martina",
    vinculo: "Tu vínculo",
    vinculoPista: "hija, nieto, sobrina...",
    direccionTitulo: "Dirección de envío del libro impreso",
    direccionAyuda: "El envío está incluido. Te avisamos cuando salga de imprenta y te mandamos el seguimiento.",
    recibe: "Quién lo recibe",
    recibePista: "Martina Fernández",
    telefonoRecibe: "Teléfono",
    telefonoRecibePista: "612 345 678",
    siHaceFalta: " (si hace falta)",
    camposDireccion: {
      linea1: { nombre: "Calle y número", ejemplo: "Calle Mayor 12" },
      linea2: { nombre: "Piso y puerta", ejemplo: "3º B" },
      ciudad: { nombre: "Ciudad", ejemplo: "Valladolid" },
      provincia: { nombre: "Provincia o comunidad", ejemplo: "Valladolid" },
      cp: { nombre: "Código postal", ejemplo: "47001" },
      pais: { nombre: "País", ejemplo: "España" },
    },
    metodos: "Pagas con tarjeta en la página segura de Stripe.",
    pagar: (t) => `Pagar ${t}`,
    procesando: "Procesando…",
    subiendoFoto: (i, n) => `Subiendo foto ${i} de ${n}…`,
    terminos: "términos",
    legalAntes: "Pago único y seguro con Stripe. Al pagar aceptas los ",
    legalDespues: " y nos pides que la entrevista empiece en cuanto el narrador acepte, sin esperar los 14 días de desistimiento. Si te arrepientes con la entrevista en marcha, se descuenta la parte ya hecha.",
    garantiaFamiliar: "Si no quiere hacerlo, te devolvemos el dinero.",
    garantiaPropia: "Si cambias de idea antes de contestar la primera pregunta, te devolvemos el dinero.",

    faltaPara: "Elige para quién es.",
    faltaRegalo: "Elige si es un regalo.",
    faltaMensaje: "Falta tu mensaje para la tarjeta.",
    faltaNombreYo: "Dinos tu nombre.",
    faltaNombreOtro: "Falta el nombre del narrador.",
    faltaComo: "¿Cómo le escribimos? Pon su nombre o su apodo.",
    palabraDeFamilia: MENSAJE_PALABRA_DE_FAMILIA_TU,
    faltaGeneroYo: "¿Eres hombre o mujer? Lo necesita el biógrafo para hablarte bien.",
    faltaGeneroOtro: "¿Es hombre o mujer? Lo necesita el biógrafo para hablarle bien.",
    anioMal: "El año de nacimiento no parece bien (entre 1900 y 2015).",
    faltaWhatsapp: "Falta el WhatsApp.",
    faltaTuNombre: "Dinos tu nombre. Es lo que va a leer cuando le escribamos.",
    faltaVinculo: "Cuéntanos qué eres de esa persona (hija, nieto...).",
    correoMal: "Necesitamos un correo válido. Ahí te avisamos de todo.",
    faltaRecibe: "Falta el nombre de quien recibe.",
    faltaTelefonoRecibe: "Falta un teléfono. El correo lo pide para entregar el libro.",
    errorPago: "No pudimos iniciar el pago. Intenta de nuevo.",
    errorConexion: "No pudimos iniciar el pago. Revisa tu conexión e intenta de nuevo.",
    sacalaOIntenta: "Sácala o intenta de nuevo.",
    noSubio: (n) => `No pudimos subir ${n}.`,
  },

  ar: {
    tituloPagina: "Comprar el libro",
    descripcion: "Un biógrafo entrevista por WhatsApp y escribe el libro de una vida. Pago único.",
    pasos: ["Su libro", "Para quién", "Pago"],
    pasosEtiqueta: "Pasos de la compra",
    pasoDe: (n, t) => `Paso ${n} de ${t}`,
    continuar: "Continuar",
    atras: "Atrás",

    libroTitulo: "¿Cómo querés su libro?",
    libroBajada: "Todas las opciones incluyen la entrevista completa y el libro en PDF con su voz.",
    digitalTitulo: "Libro digital",
    digitalDetalle: "PDF para leer en cualquier pantalla, con «Su voz»: sus audios a un toque.",
    impresoEtiqueta: "Para regalar",
    impresoTitulo: "Libro impreso en tapa dura + digital",
    impresoDetalle: "El mismo libro, impreso y encuadernado, y también en PDF con su voz. El envío está incluido. Te avisamos cuando salga de imprenta y te mandamos el seguimiento.",
    marcoEtiqueta: "Sumá un detalle",
    marcoTitulo: "Su foto enmarcada, junto a su libro.",
    marcoDetalle: "Un marco con la foto que elijas. Por dentro lleva un chip que no se ve: acercás el celular al marco y se abre su libro, con su voz.",
    marcoFotoAlt: "Un marco con una foto junto a un libro, sobre un aparador",
    marcoAnadir: (p) => `Sumar el marco · +${p}`,
    marcoAnadido: (p) => `Sumado · +${p}`,
    marcoSoloImpreso: "El marco va con el libro impreso. Elegí el impreso para sumarlo.",
    copiasTitulo: "Copias extra del libro impreso",
    marcosExtraTitulo: "Marcos adicionales",
    cadaUno: (p) => `+${p} cada uno`,
    unoMenos: (q) => `Uno menos: ${q}`,
    unoMas: (q) => `Uno más: ${q}`,

    paraTitulo: "¿Para quién es el libro?",
    esPara: "Es para…",
    opciones: { padre: "Mi papá", madre: "Mi mamá", abuelo: "Mi abuelo", abuela: "Mi abuela", otra: "Otra persona", yo: "Para mí" },
    introOtro: "Lo justo para presentarnos bien. El resto lo va a contar en la entrevista.",
    introYo: "Tu propio libro, sin sorpresa ni tarjeta. Las preguntas te llegan a vos.",
    generoOtra: "¿Cómo nos referimos a esa persona en los textos?",
    generoYo: "¿Sos hombre o mujer? Lo necesita el biógrafo para hablarte bien.",
    generos: { varon: "Hombre", mujer: "Mujer", otro: "Prefiero no decirlo" },
    generosOtra: { varon: "Él", mujer: "Ella", otro: "Prefiero no decirlo" },
    nombreOtro: "Su nombre completo",
    nombreYo: "Tu nombre completo",
    nombreAyuda: "Va en la portada del libro.",
    nombrePista: "Roberto Fernández",
    comoOtro: "¿Cómo le escribimos?",
    comoYo: "Cómo te dicen",
    comoAyudaOtro: (ella) => `Así ${ella ? "la" : "lo"} va a saludar el biógrafo por WhatsApp. Si tiene un apodo, ponelo. Nada de "papá" ni "abuela".`,
    comoAyudaYo: "Así te vamos a saludar.",
    comoPista: "Roberto, Beto, Don Roberto",
    esRegalo: "¿Es un regalo?",
    regaloSi: "Sí, es un regalo",
    regaloSiDetalle: "Elegís el día en que empieza y te damos una tarjeta para dársela.",
    regaloNo: "No es regalo: que empiece ya",
    regaloNoDetalle: "En un rato le llega un mensaje nuestro por WhatsApp, contándole de qué se trata.",
    tarjetaTitulo: "Tarjeta de regalo para imprimir",
    tarjetaDetalle: "Te la mandamos por mail apenas pagás. La imprimís o la mandás por WhatsApp, y se la das ese día.",
    navidad: "Navidad · 24 dic",
    otraFecha: "Otra fecha",
    whatsappOtro: "Su WhatsApp",
    whatsappYo: "Tu WhatsApp",
    whatsappAyudaOtro: "Su número, no el tuyo. Ahí le van a llegar las preguntas.",
    whatsappAyudaYo: "Ahí te van a llegar las preguntas.",
    whatsappPista: "11 5555 1234",
    horaOtro: "A qué hora le escribimos",
    horaYo: "A qué hora te escribimos",
    horaAyudaOtro: "A esa hora le llega el primer mensaje. Después, la siguiente le llega cuando termina de responder la anterior.",
    horaAyudaYo: "A esa hora te llega el primer mensaje. Después, la siguiente te llega cuando terminás de responder la anterior.",
    horas: HORAS_AR,
    tratoOtro: "¿Cómo le hablamos?",
    tratoYo: "¿Cómo te hablamos?",
    tratoEtiqueta: "Idioma y trato",
    tratos: TRATOS,
    masTitulo: (propia) => (propia ? "Un poco más sobre vos (opcional)" : "Un poco más sobre su vida (opcional)"),
    anio: "Año de nacimiento",
    estadoCivil: "Estado civil",
    estadosCiviles: { "": "Prefiero no decir", casado: "Casado/a", en_pareja: "En pareja", viudo: "Viudo/a", separado: "Separado/a o divorciado/a", soltero: "Soltero/a" },
    hijosOtro: "¿Tiene hijos?",
    hijosYo: "¿Tenés hijos?",
    hijos: { "": "Prefiero no decir", si: "Sí", no: "No" },
    dondeOtro: "¿Dónde vive?",
    dondeYo: "¿Dónde vivís?",
    dondeAyuda: "Ciudad y país. Ayuda a entender su forma de hablar.",
    dondePista: "Rosario, Argentina",
    masNota: "Opcional. Con esto el biógrafo no pregunta por una boda que no hubo ni por hijos que no tiene, y sabe de qué época hablan.",
    fotosTituloOtro: "Sus fotos",
    fotosTituloYo: "Tus fotos",
    fotosBajada: "Si tenés fotos suyas, subilas acá. También podés hacerlo después, desde tu panel.",
    album: "El álbum del libro",
    albumDetalle: "Las fotos que quieras que estén en su libro, de cualquier momento de su vida. Después, desde tu panel, elegís cuál va en la tapa y cuáles en los marcos. Cuantos más píxeles, mejor se imprimen.",
    agregarFotos: "+ Agregar fotos",
    agregarMas: (n, m) => `+ Agregar más (${n} de ${m})`,
    fotoSubida: "Subida",
    sacarFoto: (n) => `Sacar ${n}`,
    pesaMucho: (n) => `${n} pesa más de 25 MB.`,

    pagoTitulo: "Tus datos y el pago",
    pagoBajada: (yo, regalo) =>
      regalo
        ? "Ahí te llega la tarjeta. Con ese mismo correo entrás a tu panel."
        : `Ahí te avisamos ${yo ? "cuando el libro esté listo" : "cuando acepte y cuando el libro esté listo"}. Con ese mismo correo entrás a tu panel.`,
    email: "Tu correo",
    emailPista: "martina@ejemplo.com",
    tuNombre: "Tu nombre",
    tuNombreRegalo: "Tu nombre, como va a aparecer en la tarjeta",
    tuNombrePista: "Martina",
    vinculo: "Tu vínculo",
    vinculoPista: "hija, nieto, sobrina...",
    direccionTitulo: "Dirección de envío del libro impreso",
    direccionAyuda: "El envío está incluido. Te avisamos cuando salga de imprenta y te mandamos el seguimiento.",
    recibe: "Quién lo recibe",
    recibePista: "Martina Fernández",
    telefonoRecibe: "Teléfono",
    telefonoRecibePista: "11 5555 1234",
    siHaceFalta: " (si hace falta)",
    camposDireccion: {
      linea1: { nombre: "Calle y número", ejemplo: "Pelliza 1234" },
      linea2: { nombre: "Piso, departamento", ejemplo: "3º B" },
      ciudad: { nombre: "Ciudad", ejemplo: "Vicente López" },
      provincia: { nombre: "Provincia o comunidad", ejemplo: "Buenos Aires" },
      cp: { nombre: "Código postal", ejemplo: "1638" },
      pais: { nombre: "País", ejemplo: "Argentina" },
    },
    metodos: "Pagás en la página segura de Mercado Pago.",
    pagar: (t) => `Pagar ${t}`,
    procesando: "Procesando…",
    subiendoFoto: (i, n) => `Subiendo foto ${i} de ${n}…`,
    terminos: "términos",
    legalAntes: "Pago único y seguro con Mercado Pago. Al pagar aceptás los ",
    legalDespues: ".",
    garantiaFamiliar: "Si no quiere hacerlo, te devolvemos el dinero.",
    garantiaPropia: "Si cambiás de idea antes de contestar la primera pregunta, te devolvemos el dinero.",

    faltaPara: "Elegí para quién es.",
    faltaRegalo: "Elegí si es un regalo.",
    faltaMensaje: "Falta tu mensaje para la tarjeta.",
    faltaNombreYo: "Decinos tu nombre.",
    faltaNombreOtro: "Falta el nombre del narrador.",
    faltaComo: "¿Cómo le escribimos? Poné su nombre o su apodo.",
    palabraDeFamilia: MENSAJE_PALABRA_DE_FAMILIA,
    faltaGeneroYo: "¿Sos hombre o mujer? Lo necesita el biógrafo para hablarte bien.",
    faltaGeneroOtro: "¿Es hombre o mujer? Lo necesita el biógrafo para hablarle bien.",
    anioMal: "El año de nacimiento no parece bien (entre 1900 y 2015).",
    faltaWhatsapp: "Falta el WhatsApp.",
    faltaTuNombre: "Decinos tu nombre. Es lo que va a leer cuando le escribamos.",
    faltaVinculo: "Contanos qué sos de esa persona (hija, nieto...).",
    correoMal: "Necesitamos un correo válido. Ahí te avisamos de todo.",
    faltaRecibe: "Falta el nombre de quien recibe.",
    faltaTelefonoRecibe: "Falta un teléfono. El correo lo pide para entregar el libro.",
    errorPago: "No pudimos iniciar el pago. Intentá de nuevo.",
    errorConexion: "No pudimos iniciar el pago. Revisá tu conexión e intentá de nuevo.",
    sacalaOIntenta: "Sacala o intentá de nuevo.",
    noSubio: (n) => `No pudimos subir ${n}.`,
  },

  // ca: PENDIENTE REVISIÓN NATIVA
  ca: {
    tituloPagina: "Comprar el llibre",
    descripcion: "Un biògraf entrevista per WhatsApp i escriu el llibre d'una vida. Pagament únic.",
    pasos: ["El seu llibre", "Per a qui", "Pagament"],
    pasosEtiqueta: "Passos de la compra",
    pasoDe: (n, t) => `Pas ${n} de ${t}`,
    continuar: "Continuar",
    atras: "Enrere",

    libroTitulo: "Com vols el seu llibre?",
    libroBajada: "Totes les opcions inclouen l'entrevista completa i el llibre en PDF amb la seva veu.",
    digitalTitulo: "Llibre digital",
    digitalDetalle: "PDF per llegir a qualsevol pantalla, amb «La seva veu»: els seus àudios a un toc.",
    impresoEtiqueta: "Per regalar",
    impresoTitulo: "Llibre imprès en tapa dura + digital",
    impresoDetalle: "El mateix llibre, imprès i enquadernat, i també en PDF amb la seva veu. L'enviament està inclòs. T'avisem quan surti d'impremta i t'enviem el seguiment.",
    marcoEtiqueta: "Afegeix un detall",
    marcoTitulo: "La seva foto emmarcada, al costat del seu llibre.",
    marcoDetalle: "Un marc amb la foto que triïs. Per dins porta un xip que no es veu: acostes el mòbil al marc i s'obre el seu llibre, amb la seva veu.",
    marcoFotoAlt: "Un marc amb una foto al costat d'un llibre, sobre un moble",
    marcoAnadir: (p) => `Afegir el marc · +${p}`,
    marcoAnadido: (p) => `Afegit · +${p}`,
    marcoSoloImpreso: "El marc va amb el llibre imprès. Tria l'imprès per afegir-lo.",
    copiasTitulo: "Còpies extra del llibre imprès",
    marcosExtraTitulo: "Marcs addicionals",
    cadaUno: (p) => `+${p} cadascun`,
    unoMenos: (q) => `Un menys: ${q}`,
    unoMas: (q) => `Un més: ${q}`,

    paraTitulo: "Per a qui és el llibre?",
    esPara: "És per a…",
    opciones: { padre: "El meu pare", madre: "La meva mare", abuelo: "El meu avi", abuela: "La meva àvia", otra: "Una altra persona", yo: "Per a mi" },
    introOtro: "El just per presentar-nos bé. La resta ho explicarà a l'entrevista.",
    introYo: "El teu propi llibre, sense sorpresa ni targeta. Les preguntes t'arriben a tu.",
    generoOtra: "Com ens hi referim, a aquesta persona, en els textos?",
    generoYo: "Ets home o dona? El biògraf ho necessita per parlar-te bé.",
    generos: { varon: "Home", mujer: "Dona", otro: "Prefereixo no dir-ho" },
    generosOtra: { varon: "Ell", mujer: "Ella", otro: "Prefereixo no dir-ho" },
    nombreOtro: "El seu nom complet",
    nombreYo: "El teu nom complet",
    nombreAyuda: "Va a la portada del llibre.",
    nombrePista: "Roberto Fernández",
    comoOtro: "Com li escrivim?",
    comoYo: "Com et diuen",
    comoAyudaOtro: (ella) => `Així ${ella ? "la" : "el"} saludarà el biògraf per WhatsApp. Si té un sobrenom, posa'l. Res de "papa" ni "àvia".`,
    comoAyudaYo: "Així et saludarem.",
    comoPista: "Roberto, Beto, el senyor Roberto",
    esRegalo: "És un regal?",
    regaloSi: "Sí, és un regal",
    regaloSiDetalle: "Tries el dia que comença i et donem una targeta per donar-li.",
    regaloNo: "No és un regal: que comenci ja",
    regaloNoDetalle: "D'aquí a una estona li arriba un missatge nostre per WhatsApp, explicant-li de què es tracta.",
    tarjetaTitulo: "Targeta de regal per imprimir",
    tarjetaDetalle: "Te l'enviem per correu tan bon punt pagues. La imprimeixes o l'envies per WhatsApp, i li dones aquell dia.",
    navidad: "Nadal · 24 des.",
    otraFecha: "Una altra data",
    whatsappOtro: "El seu WhatsApp",
    whatsappYo: "El teu WhatsApp",
    whatsappAyudaOtro: "El seu número, no el teu. Allà li arribaran les preguntes.",
    whatsappAyudaYo: "Allà t'arribaran les preguntes.",
    whatsappPista: "+34 612 345 678",
    horaOtro: "A quina hora li escrivim",
    horaYo: "A quina hora t'escrivim",
    horaAyudaOtro: "A aquesta hora li arriba el primer missatge. Després, la següent li arriba quan acaba de respondre l'anterior.",
    horaAyudaYo: "A aquesta hora t'arriba el primer missatge. Després, la següent t'arriba quan acabes de respondre l'anterior.",
    horas: { "09:00": "Al matí (9:00)", "11:00": "A mig matí (11:00)", "16:00": "A la tarda (16:00)", "19:00": "Al final del dia (19:00)" },
    tratoOtro: "Com li parlem?",
    tratoYo: "Com et parlem?",
    tratoEtiqueta: "Idioma i tracte",
    tratos: { "es-AR": "De vos (castellà d'Argentina)", "es-ES": "De tu (castellà)", ca: "En català" },
    masTitulo: (propia) => (propia ? "Una mica més sobre tu (opcional)" : "Una mica més sobre la seva vida (opcional)"),
    anio: "Any de naixement",
    estadoCivil: "Estat civil",
    estadosCiviles: { "": "Prefereixo no dir-ho", casado: "Casat/da", en_pareja: "En parella", viudo: "Vidu/vídua", separado: "Separat/da o divorciat/da", soltero: "Solter/a" },
    hijosOtro: "Té fills?",
    hijosYo: "Tens fills?",
    hijos: { "": "Prefereixo no dir-ho", si: "Sí", no: "No" },
    dondeOtro: "On viu?",
    dondeYo: "On vius?",
    dondeAyuda: "Ciutat i país. Ajuda a entendre la seva manera de parlar.",
    dondePista: "Girona, Espanya",
    masNota: "Opcional. Així el biògraf no pregunta per un casament que no va existir ni per fills que no té, i sap de quina època parlen.",
    fotosTituloOtro: "Les seves fotos",
    fotosTituloYo: "Les teves fotos",
    fotosBajada: "Si tens fotos seves, puja-les aquí. També ho pots fer després, des del teu panell.",
    album: "L'àlbum del llibre",
    albumDetalle: "Les fotos que vulguis que surtin al seu llibre, de qualsevol moment de la seva vida. Després, des del teu panell, tries quina va a la tapa i quines als marcs. Com més píxels, millor s'imprimeixen.",
    agregarFotos: "+ Afegir fotos",
    agregarMas: (n, m) => `+ Afegir-ne més (${n} de ${m})`,
    fotoSubida: "Pujada",
    sacarFoto: (n) => `Treure ${n}`,
    pesaMucho: (n) => `${n} pesa més de 25 MB.`,

    pagoTitulo: "Les teves dades i el pagament",
    pagoBajada: (yo, regalo) =>
      regalo
        ? "Allà t'arriba la targeta. Amb aquest mateix correu entres al teu panell."
        : `Allà t'avisem ${yo ? "quan el llibre estigui llest" : "quan accepti i quan el llibre estigui llest"}. Amb aquest mateix correu entres al teu panell.`,
    email: "El teu correu",
    emailPista: "martina@exemple.com",
    tuNombre: "El teu nom",
    tuNombreRegalo: "El teu nom, tal com sortirà a la targeta",
    tuNombrePista: "Martina",
    vinculo: "Què ets d'aquesta persona",
    vinculoPista: "filla, nét, neboda...",
    direccionTitulo: "Adreça d'enviament del llibre imprès",
    direccionAyuda: "L'enviament està inclòs. T'avisem quan surti d'impremta i t'enviem el seguiment.",
    recibe: "Qui el rep",
    recibePista: "Martina Fernández",
    telefonoRecibe: "Telèfon",
    telefonoRecibePista: "612 345 678",
    siHaceFalta: " (si cal)",
    camposDireccion: {
      linea1: { nombre: "Carrer i número", ejemplo: "Carrer Major, 12" },
      linea2: { nombre: "Pis i porta", ejemplo: "3r B" },
      ciudad: { nombre: "Ciutat", ejemplo: "Girona" },
      provincia: { nombre: "Província", ejemplo: "Girona" },
      cp: { nombre: "Codi postal", ejemplo: "17001" },
      pais: { nombre: "País", ejemplo: "Espanya" },
    },
    metodos: "Pagues amb targeta a la pàgina segura de Stripe.",
    pagar: (t) => `Pagar ${t}`,
    procesando: "Processant…",
    subiendoFoto: (i, n) => `Pujant la foto ${i} de ${n}…`,
    terminos: "condicions",
    legalAntes: "Pagament únic i segur amb Stripe. En pagar acceptes les ",
    legalDespues: " i ens demanes que l'entrevista comenci tan bon punt el narrador accepti, sense esperar els 14 dies de desistiment. Si te'n desdius amb l'entrevista en marxa, es descompta la part ja feta.",
    garantiaFamiliar: "Si no ho vol fer, et retornem els diners.",
    garantiaPropia: "Si canvies d'idea abans de contestar la primera pregunta, et retornem els diners.",

    faltaPara: "Tria per a qui és.",
    faltaRegalo: "Tria si és un regal.",
    faltaMensaje: "Falta el teu missatge per a la targeta.",
    faltaNombreYo: "Digues-nos el teu nom.",
    faltaNombreOtro: "Falta el nom del narrador.",
    faltaComo: "Com li escrivim? Posa el seu nom o el seu sobrenom.",
    palabraDeFamilia: "Posa el seu nom o el seu sobrenom. Res de \"papa\" ni \"àvia\".",
    faltaGeneroYo: "Ets home o dona? El biògraf ho necessita per parlar-te bé.",
    faltaGeneroOtro: "És home o dona? El biògraf ho necessita per parlar-li bé.",
    anioMal: "L'any de naixement no sembla correcte (entre 1900 i 2015).",
    faltaWhatsapp: "Falta el WhatsApp.",
    faltaTuNombre: "Digues-nos el teu nom. És el que llegirà quan li escrivim.",
    faltaVinculo: "Explica'ns què ets d'aquesta persona (filla, nét...).",
    correoMal: "Necessitem un correu vàlid. Allà t'avisem de tot.",
    faltaRecibe: "Falta el nom de qui el rep.",
    faltaTelefonoRecibe: "Falta un telèfon. El transportista el demana per entregar el llibre.",
    errorPago: "No hem pogut iniciar el pagament. Torna-ho a provar.",
    errorConexion: "No hem pogut iniciar el pagament. Revisa la connexió i torna-ho a provar.",
    sacalaOIntenta: "Treu-la o torna-ho a provar.",
    noSubio: (n) => `No hem pogut pujar ${n}.`,
  },
};
