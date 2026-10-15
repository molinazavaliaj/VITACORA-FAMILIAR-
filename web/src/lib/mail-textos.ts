// Los textos de los mails que manda la web con el diseño del rediseño (maqueta
// `Email`, fase 1): el de acceso tras el pago y el de la tarjeta del regalo, y
// desde la fase 3 la invitación a una historia.
// Un diccionario por idioma de la web (`Textos<T>`: es / ca / ar).
//
// Hoy el idioma sale de `familias.region` (ES → es, AR o sin región → ar), como
// siempre. El catalán queda listo pero no se manda todavía: la base no guarda en
// qué idioma compró cada uno (docs/rediseno-2026-10/PENDIENTES.md, «Apuntado en
// fase 1»).
//
// Lo que ya estaba aprobado (acceso 06/10, regalo 07/10 y 09/10) se copia tal
// cual; los del regalo en es/ar se leen de regalo-textos.ts, que sigue siendo el
// lugar único de esos textos. Lo nuevo está en docs/rediseno-2026-10/fase-1/textos-mails.md.

import type { IdiomaWeb, Textos } from "./idioma-web";
import { textosComprador } from "./regalo-textos";

/** Lo que comparten los dos mails: la etiqueta, la línea de tiempo, las dudas y el pie. */
export type TextosMailComun = {
  /** La etiqueta de arriba del título, en mayúsculas como en la maqueta. */
  etiqueta: string;
  quePasaAhora: string;
  mientrasCuenta: string;
  alTerminar: string;
  /** La fila «Al terminar»: el libro se escribe cuando termina de contar (escritor V5.5). */
  alTerminarTexto: string;
  botonTablero: string;
  codigo: string;
  dudas: string;
  pie: string;
  porQue: string;
};

export type TextosMailAcceso = {
  asunto: (como: string) => string;
  vistaPrevia: (como: string) => string;
  titulo: string;
  enUnRato: (como: string) => string;
  arranca: string;
  cuandoEmpiece: string;
  paraEscuchar: string;
};

export type TextosMailRegalo = {
  asunto: (como: string) => string;
  vistaPrevia: string;
  cuerpo: (como: string) => string;
  boton: string;
  /** La fila «Mientras cuenta» (aprobado 06/10, #18). */
  mientrasCuentaTexto: string;
};

/**
 * La invitación a una historia (fase 3). Dos variantes: seguir la historia o,
 * cuando terminó de contar, ayudar con las dudas del escritor (13/10). Los
 * párrafos de quien invita son los aprobados (06/10 y 13/10); lo demás está en
 * docs/rediseno-2026-10/fase-3/textos.md.
 */
export type TextosMailInvitacion = {
  etiqueta: string;
  asunto: (quien: string, narrador: string) => string;
  asuntoDudas: (quien: string, narrador: string) => string;
  /** La primera línea: está contando, y el libro se escribe cuando termina (DECISIONES D4). */
  contando: (narrador: string) => string;
  cuerpo: (quien: string) => string;
  tituloDudas: (narrador: string) => string;
  cuerpoDudas: (quien: string) => string;
  entra: string;
  boton: (narrador: string) => string;
  botonDudas: string;
  porQue: string;
};

export type TextosMail = { comun: TextosMailComun; acceso: TextosMailAcceso; regalo: TextosMailRegalo; invitacion: TextosMailInvitacion };

const VOS = textosComprador("vos");
const TU = textosComprador("tu");

// Aprobado 06/10 (#18 y #19), igual en vos y en tú.
const DESDE_LA_PRIMERA = "Desde la primera respuesta, en tu panel aparecen sus audios, uno por uno, con su voz y sus modos de decir.";
const AL_TERMINAR = "Cuando termina de contar, el biógrafo escribe su libro.";
// Aprobado 06/10 (mail de acceso y de invitación).
const CODIGO = "Te pedimos un código de 6 números que llega a este correo. Sin contraseñas.";
const PIE = "Vitácora Familiar · En cada familia hay un libro sin escribir.";

export const TEXTOS_MAIL: Textos<TextosMail> = {
  es: {
    comun: {
      etiqueta: "PEDIDO CONFIRMADO",
      quePasaAhora: "QUÉ PASA AHORA",
      mientrasCuenta: "Mientras cuenta",
      alTerminar: "Al terminar",
      alTerminarTexto: AL_TERMINAR,
      botonTablero: "Entrar a mi tablero",
      codigo: CODIGO,
      dudas: "¿Dudas? Contesta a este email.",
      pie: PIE,
      porQue: "Recibes este email porque has hecho un pedido.",
    },
    acceso: {
      asunto: (como) => `Listo. Hoy le escribimos a tu ${como}.`,
      vistaPrevia: (como) => `En un rato le llega un mensaje nuestro por WhatsApp a tu ${como}.`,
      titulo: "Gracias por confiar. Ya está en marcha.",
      enUnRato: (como) => `En un rato le llega un mensaje nuestro por WhatsApp a tu ${como}, contándole de qué se trata.`,
      arranca: "Arranca cuando quiera.",
      cuandoEmpiece: "Cuando empiece a contar su historia te avisamos por aquí, y vas a poder escuchar su voz desde tu panel.",
      paraEscuchar: "Para ir escuchando lo que cuenta, entra a la página con este mismo correo:",
    },
    regalo: {
      asunto: TU.mailAsunto,
      vistaPrevia: "Ya puedes descargar la tarjeta.",
      cuerpo: TU.mailCuerpo,
      boton: TU.mailBoton,
      mientrasCuentaTexto: DESDE_LA_PRIMERA,
    },

    invitacion: {
      etiqueta: "INVITACIÓN",
      asunto: (quien, n) => `${quien} te invita a la historia de ${n}`,
      asuntoDudas: (quien, n) => `${quien} te pide ayuda con la historia de ${n}`,
      contando: (n) => `${n} está contando su vida con audios de WhatsApp. Cuando termine, un biógrafo escribirá su libro.`,
      cuerpo: (quien) =>
        `${quien} te ha invitado a seguir su historia. Podrás escuchar lo que va contando, sumar preguntas que te gustaría que le hagan y añadir fotos de cada época.`,
      tituloDudas: (n) => `${n} ha terminado de contar su vida y estamos a punto de escribir su libro.`,
      cuerpoDudas: (quien) =>
        `${quien} te ha invitado porque han quedado algunas dudas sobre lo que contó, como un nombre o un año. Si sabes la respuesta, puedes escribirla antes de que se escriba el libro. También podrás escuchar lo que contó.`,
      entra: "Entra con este mismo correo:",
      boton: (n) => `Ver la historia de ${n}`,
      botonDudas: "Ver las dudas",
      porQue: "Recibes este email porque te han invitado a una historia.",
    },
  },

  ar: {
    comun: {
      etiqueta: "PEDIDO CONFIRMADO",
      quePasaAhora: "QUÉ PASA AHORA",
      mientrasCuenta: "Mientras cuenta",
      alTerminar: "Al terminar",
      alTerminarTexto: AL_TERMINAR,
      botonTablero: "Entrar a mi tablero",
      codigo: CODIGO,
      dudas: "¿Dudas? Contestá este mail.",
      pie: PIE,
      porQue: "Recibís este mail porque hiciste un pedido.",
    },
    acceso: {
      asunto: (como) => `Listo. Hoy le escribimos a tu ${como}.`,
      vistaPrevia: (como) => `En un rato le llega un mensaje nuestro por WhatsApp a tu ${como}.`,
      titulo: "Gracias por confiar. Ya está en marcha.",
      enUnRato: (como) => `En un rato le llega un mensaje nuestro por WhatsApp a tu ${como}, contándole de qué se trata.`,
      arranca: "Arranca cuando quiera.",
      cuandoEmpiece: "Cuando empiece a contar su historia te avisamos por acá, y vas a poder escuchar su voz desde tu panel.",
      paraEscuchar: "Para ir escuchando lo que cuenta, entrá a la página con este mismo correo:",
    },
    regalo: {
      asunto: VOS.mailAsunto,
      vistaPrevia: "Ya podés descargar la tarjeta.",
      cuerpo: VOS.mailCuerpo,
      boton: VOS.mailBoton,
      mientrasCuentaTexto: DESDE_LA_PRIMERA,
    },

    invitacion: {
      etiqueta: "INVITACIÓN",
      asunto: (quien, n) => `${quien} te invita a la historia de ${n}`,
      asuntoDudas: (quien, n) => `${quien} te pide ayuda con la historia de ${n}`,
      contando: (n) => `${n} está contando su vida con audios de WhatsApp. Cuando termine, un biógrafo va a escribir su libro.`,
      // Aprobado 06/10.
      cuerpo: (quien) =>
        `${quien} te invitó a seguir su historia. Vas a poder escuchar lo que va contando, sumar preguntas que te gustaría que le hagan y agregar fotos de cada época.`,
      // Aprobados 13/10.
      tituloDudas: (n) => `${n} terminó de contar su vida y estamos por escribir su libro.`,
      cuerpoDudas: (quien) =>
        `${quien} te invitó porque quedaron algunas dudas sobre lo que contó, como un nombre o un año. Si sabés la respuesta, podés escribirla antes de que se escriba el libro. También vas a poder escuchar lo que contó.`,
      entra: "Entrá con este mismo correo:",
      boton: (n) => `Ver la historia de ${n}`,
      botonDudas: "Ver las dudas",
      porQue: "Recibís este mail porque te invitaron a una historia.",
    },
  },

  // ca: PENDIENTE REVISIÓN NATIVA (todo el bloque). Sin «el teu / la teva» delante
  // de cómo le dicen: en catalán depende del género y el mail no lo sabe.
  ca: {
    comun: {
      etiqueta: "COMANDA CONFIRMADA",
      quePasaAhora: "QUÈ PASSA ARA",
      mientrasCuenta: "Mentre explica",
      alTerminar: "En acabar",
      alTerminarTexto: "Quan acaba d'explicar, el biògraf escriu el seu llibre.",
      botonTablero: "Entrar al meu tauler",
      codigo: "Et demanem un codi de 6 números que arriba a aquest correu. Sense contrasenyes.",
      dudas: "Dubtes? Respon aquest correu.",
      pie: "Vitácora Familiar · A cada família hi ha un llibre per escriure.",
      porQue: "Reps aquest correu perquè has fet una comanda.",
    },
    acceso: {
      asunto: (como) => `Llest. Avui li escrivim a ${como}.`,
      vistaPrevia: (como) => `D'aquí a una estona li arriba un missatge nostre per WhatsApp a ${como}.`,
      titulo: "Gràcies per confiar en nosaltres. Ja està en marxa.",
      enUnRato: (como) => `D'aquí a una estona li arriba un missatge nostre per WhatsApp a ${como}, explicant-li de què es tracta.`,
      arranca: "Que comenci quan vulgui.",
      cuandoEmpiece: "Quan comenci a explicar la seva història t'avisarem per aquí, i podràs escoltar la seva veu des del teu tauler.",
      paraEscuchar: "Per anar escoltant el que explica, entra a la pàgina amb aquest mateix correu:",
    },
    regalo: {
      asunto: (como) => `El teu regal per a ${como} ja està llest`,
      vistaPrevia: "Ja pots descarregar la targeta.",
      cuerpo: (como) =>
        `Ja pots descarregar la targeta. Imprimeix-la o envia-la per WhatsApp. Quan ${como} l'escanegi, començarà la seva entrevista i ho veuràs al teu tauler.`,
      boton: "Veure la targeta",
      mientrasCuentaTexto: "Des de la primera resposta, al teu tauler apareixen els seus àudios, un per un, amb la seva veu i la seva manera de dir les coses.",
    },

    invitacion: {
      etiqueta: "INVITACIÓ",
      asunto: (quien, n) => `${quien} et convida a la història de ${n}`,
      asuntoDudas: (quien, n) => `${quien} et demana ajuda amb la història de ${n}`,
      contando: (n) => `${n} està explicant la seva vida amb àudios de WhatsApp. Quan acabi, un biògraf escriurà el seu llibre.`,
      cuerpo: (quien) =>
        `${quien} t'ha convidat a seguir la seva història. Podràs escoltar el que va explicant, proposar preguntes que t'agradaria que li fessin i afegir fotos de cada època.`,
      tituloDudas: (n) => `${n} ha acabat d'explicar la seva vida i estem a punt d'escriure el seu llibre.`,
      cuerpoDudas: (quien) =>
        `${quien} t'ha convidat perquè han quedat alguns dubtes sobre el que va explicar, com un nom o un any. Si saps la resposta, pots escriure-la abans que s'escrigui el llibre. També podràs escoltar el que va explicar.`,
      entra: "Entra amb aquest mateix correu:",
      boton: (n) => `Veure la història de ${n}`,
      botonDudas: "Veure els dubtes",
      porQue: "Reps aquest correu perquè t'han convidat a una història.",
    },
  },
};

/**
 * Vitácora Kids (15/10): el mail de acceso cuando el pedido es de Kids
 * (`extras.tipo = "kids"`). Solo es-AR, de vos: Kids no se vende en España.
 * Cambia el asunto, la vista previa y la primera línea (según el canal: A = su
 * WhatsApp, B = «Lo hago yo») y la fila «Mientras cuenta». Lo demás (título,
 * botón, código, «Al terminar», dudas y pie) es el del mail de siempre en vos.
 * Aprobados por Naza el 15/10 (docs/rediseno-2026-10/kids/textos-aprobados-2026-10-15.md).
 */
export type CanalMailKids = "A" | "B";

export type TextosMailKids = {
  asunto: (apodo: string) => string;
  /** La vista previa y la primera línea del cuerpo, por canal. */
  primeraLinea: Record<CanalMailKids, (apodo: string) => string>;
  /** La fila «Mientras cuenta». */
  enTuPanel: string;
};

export const TEXTOS_MAIL_KIDS: TextosMailKids = {
  asunto: (apodo) => `Listo, ya está en marcha el libro de ${apodo}`,
  primeraLinea: {
    A: (apodo) => `Le vamos a escribir a ${apodo} a la hora que elegiste. A vos te avisamos por WhatsApp.`,
    B: () => "El primer mensaje te llega a tu WhatsApp. La primera pregunta sale cuando estén juntos.",
  },
  enTuPanel: "En tu panel vas a ver todo lo que cuenta. Ahí también podés escribir hasta tres preguntas tuyas para el libro.",
};

export function textosMail(idioma: IdiomaWeb): TextosMail {
  return TEXTOS_MAIL[idioma];
}
