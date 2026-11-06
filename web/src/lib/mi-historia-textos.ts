// Los textos de la pantalla de dudas de quien contó (/mi-historia/<token>, Naza 06/11). Los de es-AR son los del plan;
// es-ES y ca, y `errorGuardar` en los tres, esperan el OK de Naza.
//
// Puro: lo usan el servidor y la pantalla del navegador.

export type IdiomaMiHistoria = "es-AR" | "es-ES" | "ca";

/**
 * Lo que queda en `correcciones.json` cuando toca «No me acuerdo». Cuenta como contestada y le dice al escritor que deje
 * lo que contó. Va igual en todos los idiomas: no lo lee quien contó, lo lee la Etapa B.
 */
export const NO_ME_ACUERDO = "No se acuerda. Queda como lo contó.";

export type TextosMiHistoria = {
  titulo: string;
  intro: string;
  pregunta: (n: number, total: number) => string;
  loQueDijiste: string;
  campo: string;
  noMeAcuerdo: string;
  seguir: string;
  gracias: string;
  botonLibro: string;
  libroEscrito: string;
  errorGuardar: string;
};

const TEXTOS: Record<"ar" | "es" | "ca", TextosMiHistoria> = {
  ar: {
    titulo: "Unas últimas preguntas",
    intro: "Son cosas que no entendimos bien. Lo que nos digas entra al libro.",
    pregunta: (n, total) => `Pregunta ${n} de ${total}`,
    loQueDijiste: "Lo que dijiste",
    campo: "Escribí acá, o tocá el micrófono del teclado y dictalo.",
    noMeAcuerdo: "No me acuerdo",
    seguir: "Seguir",
    gracias: "Eso es todo. Gracias. Te avisamos cuando el libro esté listo.",
    botonLibro: "Elegir la tapa y encargar el libro",
    libroEscrito: "Tu libro ya está escrito.",
    errorGuardar: "No pudimos guardar. Probá de nuevo.",
  },
  es: {
    titulo: "Unas últimas preguntas",
    intro: "Son cosas que no entendimos bien. Lo que nos digas entra al libro.",
    pregunta: (n, total) => `Pregunta ${n} de ${total}`,
    loQueDijiste: "Lo que dijiste",
    campo: "Escribe aquí, o toca el micrófono del teclado y díctalo.",
    noMeAcuerdo: "No me acuerdo",
    seguir: "Seguir",
    gracias: "Eso es todo. Gracias. Te avisamos cuando el libro esté listo.",
    botonLibro: "Elegir la tapa y encargar el libro",
    libroEscrito: "Tu libro ya está escrito.",
    errorGuardar: "No pudimos guardar. Prueba de nuevo.",
  },
  ca: {
    titulo: "Unes últimes preguntes",
    intro: "Són coses que no vam entendre bé. El que ens diguis entra al llibre.",
    pregunta: (n, total) => `Pregunta ${n} de ${total}`,
    loQueDijiste: "El que vas dir",
    campo: "Escriu aquí, o toca el micròfon del teclat i dicta-ho.",
    noMeAcuerdo: "No me'n recordo",
    seguir: "Continuar",
    gracias: "Això és tot. Gràcies. T'avisarem quan el llibre estigui a punt.",
    botonLibro: "Triar la tapa i encarregar el llibre",
    libroEscrito: "El teu llibre ja està escrit.",
    errorGuardar: "No ho hem pogut desar. Torna-ho a provar.",
  },
};

const CLAVE: Record<IdiomaMiHistoria, keyof typeof TEXTOS> = { "es-AR": "ar", "es-ES": "es", ca: "ca" };

export const textosMiHistoria = (idioma: IdiomaMiHistoria): TextosMiHistoria => TEXTOS[CLAVE[idioma]];
