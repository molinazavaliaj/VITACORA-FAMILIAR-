import type { TratoComprador } from "./regalo-textos";

// «Que esto no vaya al libro» en cada respuesta de la historia V3 (Naza, 21/10). Textos aprobados por Naza el
// 21/10 (tandas 1 y 2), en docs/panel/fuera-del-libro-textos.md. En es (tú), ar (vos) y ca. Hoy la página de
// su historia solo distingue vos y tú; el catalán queda listo para cuando la página se vea en catalán.
// `propia`: la historia es de quien mira (le habla a él).

export type IdiomaFueraDelLibro = "es" | "ar" | "ca";

export type TextosFueraDelLibro = {
  sacar: string;
  pregunta: string;
  explicacion: (propia: boolean) => string;
  confirmar: string;
  cancelar: string;
  marca: string;
  deshacer: string;
  error: string;
  volverPregunta: (propia: boolean) => string;
  volverExplicacion: (propia: boolean) => string;
  volverSi: (propia: boolean) => string;
  volverNo: string;
};

export function idiomaFueraDelLibro(trato: TratoComprador): IdiomaFueraDelLibro {
  return trato === "tu" ? "es" : "ar";
}

const TEXTOS: Record<IdiomaFueraDelLibro, TextosFueraDelLibro> = {
  ar: {
    sacar: "Que esto no vaya al libro",
    pregunta: "¿Sacamos esta respuesta del libro?",
    explicacion: (propia) => propia
      ? "Sirve si la contestó otra persona, si te equivocaste o si no querés que esté. Lo demás que contaste en esta pregunta sigue en tu libro."
      : "Sirve si la contestó otra persona, si se equivocó o si no quiere que esté. Lo demás que contó en esta pregunta sigue en el libro.",
    confirmar: "Sacarla del libro",
    cancelar: "Dejarla",
    marca: "No va al libro",
    deshacer: "Volver a ponerla",
    error: "No pudimos guardar. Probá de nuevo.",
    volverPregunta: (propia) => (propia ? "¿Querés que te la volvamos a hacer?" : "¿Querés que se la volvamos a hacer?"),
    volverExplicacion: (propia) => (propia ? "Te llega al final de la entrevista, con las preguntas de la familia." : "Le llega al final de la entrevista, con las preguntas de la familia."),
    volverSi: (propia) => (propia ? "Sí, volver a hacérmela" : "Sí, volver a hacérsela"),
    volverNo: "No hace falta",
  },
  es: {
    sacar: "Que esto no vaya al libro",
    pregunta: "¿Quitamos esta respuesta del libro?",
    explicacion: (propia) => propia
      ? "Sirve si la ha contestado otra persona, si te has equivocado o si no quieres que esté. Lo demás que has contado en esta pregunta sigue en tu libro."
      : "Sirve si la ha contestado otra persona, si se ha equivocado o si no quiere que esté. Lo demás que ha contado en esta pregunta sigue en el libro.",
    confirmar: "Quitarla del libro",
    cancelar: "Dejarla",
    marca: "No va al libro",
    deshacer: "Volver a ponerla",
    error: "No hemos podido guardar. Inténtalo de nuevo.",
    volverPregunta: (propia) => (propia ? "¿Quieres que te la volvamos a hacer?" : "¿Quieres que se la volvamos a hacer?"),
    volverExplicacion: (propia) => (propia ? "Te llega al final de la entrevista, con las preguntas de la familia." : "Le llega al final de la entrevista, con las preguntas de la familia."),
    volverSi: (propia) => (propia ? "Sí, volver a hacérmela" : "Sí, volver a hacérsela"),
    volverNo: "No hace falta",
  },
  ca: {
    sacar: "Que això no vagi al llibre",
    pregunta: "Traiem aquesta resposta del llibre?",
    explicacion: (propia) => propia
      ? "Serveix si l'ha contestada una altra persona, si t'has equivocat o si no vols que hi sigui. La resta del que has explicat en aquesta pregunta continua al teu llibre."
      : "Serveix si l'ha contestada una altra persona, si s'ha equivocat o si no vol que hi sigui. La resta del que ha explicat en aquesta pregunta continua al llibre.",
    confirmar: "Treure-la del llibre",
    cancelar: "Deixar-la",
    marca: "No va al llibre",
    deshacer: "Tornar-la a posar",
    error: "No l'hem pogut desar. Torna-ho a provar.",
    volverPregunta: (propia) => (propia ? "Vols que te la tornem a fer?" : "Vols que l'hi tornem a fer?"),
    volverExplicacion: (propia) => (propia ? "T'arriba al final de l'entrevista, amb les preguntes de la família." : "Li arriba al final de l'entrevista, amb les preguntes de la família."),
    volverSi: (propia) => (propia ? "Sí, tornar-me-la a fer" : "Sí, tornar-l'hi a fer"),
    volverNo: "No cal",
  },
};

export function textosFueraDelLibro(idioma: IdiomaFueraDelLibro): TextosFueraDelLibro {
  return TEXTOS[idioma];
}
