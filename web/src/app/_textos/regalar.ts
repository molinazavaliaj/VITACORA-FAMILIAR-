import type { Textos } from "@/lib/idioma-web";
import { textosComprador, type TextosComprador } from "@/lib/regalo-textos";

// Los textos de quien regala en /regalar (y en el regalo de /comprar), por la
// versión de la web. es y ar son los aprobados de lib/regalo-textos.ts (de tú y
// de vos, tal cual); ca es la traducción nueva, de tú.
// ca: revisado con el corrector de Softcatalà (18/10)

const HORA_DE_CA = (pais: "AR" | "ES") => (pais === "AR" ? "És l'hora de l'Argentina." : "És l'hora d'Espanya.");

const CA: TextosComprador = {
  mailAsunto: (como) => `El teu regal per a ${como} està llest`,
  mailCuerpo: (como) =>
    `Ja pots descarregar la targeta. Imprimeix-la o envia-la per WhatsApp. Quan ${como} l'escanegi, comença la seva entrevista i ho veuràs a la pàgina de la seva història.`,
  mailBoton: "Veure la targeta",
  estadoPanel: "Esperant que obri el seu regal",
  estadoCorto: "esperant que obri el regal",
  proximoPaso: "Descarrega la targeta del regal",
  botonImprimir: "Imprimir o desar en PDF",
  avisoDobleFaz: "Imprimeix-la a doble cara i tria «girar per la vora llarga». Si la part de dins surt al revés, prova amb «vora curta».",
  botonImagen: "Descarregar la imatge per a WhatsApp",
  aQuien: "A qui li regales?",
  comoLeDecis: "Com li dius?",
  comoLeDecisPista: "avi, papa, el seu nom",
  genero: "És home o dona? El biògraf ho necessita per parlar-li bé.",
  generos: { varon: "Home", mujer: "Dona", otro: "Prefereixo no dir-ho" },
  tuMensaje: "El teu missatge per a la targeta",
  audio: "Si vols, grava-li un àudio. L'escolta quan escaneja la targeta.",
  cuando: "Quan li donaràs? (opcional)",
  tuNombre: "El teu nom, tal com sortirà a la targeta",
  queEsTuyo: "Què és teu?",
  queEsTuyoPista: "neta, fill…",
  tuCorreo: "El teu correu. Allà t'arriba la targeta.",
  botonPagar: "Pagar i descarregar la targeta",
  tituloPagina: "Regalar el llibre",
  pasos: ["A qui", "El teu missatge", "Les teves dades", "Pagar"],
  contador: (n, maximo) => `${n}/${maximo}`,
  grabar: "Gravar",
  parar: "Aturar",
  escuchar: "Escoltar",
  borrar: "Esborrar",
  elegirAudio: "Tria un àudio",
  audioNoSirve: "No hem pogut fer servir aquest àudio. Prova de gravar-lo de nou.",
  atras: "Enrere",
  seguir: "Continuar",
  unMomento: "Un moment…",
  faltaNombre: "Falta el seu nom.",
  faltaComoLeDecis: "Falta com li dius.",
  faltaGenero: "Falta triar si és home o dona.",
  faltaMensaje: "Falta el teu missatge per a la targeta.",
  faltaTuNombre: "Falta el teu nom.",
  faltaQueEsTuyo: "Falta què és teu.",
  correoMal: "Aquest correu sembla mal escrit. Revisa'l, allà t'arriba la targeta.",
  errorPago: "No hem pogut anar al pagament. Torna-ho a provar.",
  yaCompre: "Ja he comprat · Entrar",
  pagoSeguro: (pasarela) => `Pagament únic i segur amb ${pasarela}. En pagar acceptes les`,
  terminos: "condicions",
  idioma: "En quin idioma li parlem?",
  idiomas: { "es-AR": "Castellà de l'Argentina", "es-ES": "Castellà d'Espanya", ca: "Català" },
  entrega: {
    mandarloEseDia: "Vols que li enviem aquell dia?",
    canales: { nadie: "No, li dono jo", whatsapp: "Per WhatsApp", mail: "Per correu" },
    aQueHora: "A quina hora?",
    horaDe: HORA_DE_CA,
    suCelular: "El seu mòbil",
    suCelularPista: "amb el prefix del país, per exemple +34 612 34 56 78",
    suCorreo: "El seu correu",
    faltaHora: "Falta l'hora.",
    celularMal: "Aquest mòbil sembla mal escrit. Revisa'l.",
    correoMal: "Aquest correu sembla mal escrit. Revisa'l.",
    horaPasada: "Aquesta hora ja ha passat. Tria'n una altra.",
    leLlega: (contacto, fecha, hora) => `Li arriba a ${contacto} el ${fecha} a les ${hora}.`,
  },
  // TEXTO PARA NAZA (30/10): la tarjeta impresa, en un sobre per correu. Sin pasar por Softcatalà todavía.
  tarjeta: {
    casilla: "Vull també la targeta impresa, en un sobre, per correu",
    detalle: "Te l'enviem en un sobre negre, a punt per regalar. Arriba entre 3 i 5 dies.",
    aNombreDe: "A nom de qui va el sobre",
    aNombreDePista: "Tu o qui la rep",
    faltaANombreDe: "Falta a nom de qui va el sobre.",
    soloEspana: "De moment la targeta impresa només s'envia dins d'Espanya.",
    fechaCerca: "Per rebre-la impresa, la data ha de ser d'aquí a 7 dies o més.",
    campos: { linea1: "Carrer i número", linea2: "Pis i porta", ciudad: "Ciutat", provincia: "Província o comunitat", cp: "Codi postal", pais: "País" },
    pais: "Espanya",
    faltaCampo: (campo) => `Falta ${campo.toLowerCase()}.`,
  },
};

export const COMPRADOR_WEB: Textos<TextosComprador> = {
  es: textosComprador("tu"),
  ar: textosComprador("vos"),
  ca: CA,
};
