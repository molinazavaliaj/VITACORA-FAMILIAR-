// Los textos de los mails que manda la web con el diseño del rediseño (maqueta
// `Email`, fase 1): el de acceso tras el pago y el de la tarjeta del regalo.
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

export type TextosMail = { comun: TextosMailComun; acceso: TextosMailAcceso; regalo: TextosMailRegalo };

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
  },
};

export function textosMail(idioma: IdiomaWeb): TextosMail {
  return TEXTOS_MAIL[idioma];
}
