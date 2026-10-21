import type { TratoComprador } from "./regalo-textos";
import type { EstadoPreguntaFamiliaV3 } from "./v3";

// «Las preguntas de la familia» en la página de su historia (Naza, 20/10). Textos aprobados por Naza el 20/10 (las tres tandas), en
// docs/panel/preguntas-de-la-familia-textos.md. En es (tú), ar (vos) y ca. Hoy la página de su historia
// solo distingue vos y tú; el catalán queda listo para cuando la página se vea en catalán.

export type IdiomaPreguntasFamilia = "es" | "ar" | "ca";

export type TextosPreguntasFamilia = {
  titulo: string;
  bajada: string;
  /** El estado de cada pregunta. `propia`: la historia es de quien mira (le habla a él). */
  estado: (e: EstadoPreguntaFamiliaV3, propia: boolean) => string;
};

export function idiomaPreguntasFamilia(trato: TratoComprador): IdiomaPreguntasFamilia {
  return trato === "tu" ? "es" : "ar";
}

const ES_AR: Record<"es" | "ar", TextosPreguntasFamilia> = {
  ar: {
    titulo: "Las preguntas de la familia",
    bajada: "Las que sumó la familia, con las mismas palabras.",
    estado: (e, propia) => ({
      contestada: propia ? "Ya la contestaste. Tu respuesta está más abajo." : "Ya la contestó. Su respuesta está más abajo.",
      esperando: propia ? "Ya te la hicimos. Falta que contestes." : "Ya se la hicimos. Falta que conteste.",
      "sin respuesta": propia ? "Te la hicimos y la dejaste pasar." : "Se la hicimos y la dejó pasar.",
      "por hacer": propia ? "Todavía no te la hicimos. Te llega antes de terminar la entrevista." : "Todavía no se la hicimos. Le llega antes de terminar la entrevista.",
      tarde: propia ? "Llegó tarde y ya no te la hacemos." : "Llegó tarde y ya no se la hacemos.",
    })[e],
  },
  es: {
    titulo: "Las preguntas de la familia",
    bajada: "Las que ha sumado la familia, con las mismas palabras.",
    estado: (e, propia) => ({
      contestada: propia ? "Ya la has contestado. Tu respuesta está más abajo." : "Ya la ha contestado. Su respuesta está más abajo.",
      esperando: propia ? "Ya te la hemos hecho. Falta que contestes." : "Ya se la hemos hecho. Falta que conteste.",
      "sin respuesta": propia ? "Te la hemos hecho y la has dejado pasar." : "Se la hemos hecho y la ha dejado pasar.",
      "por hacer": propia ? "Todavía no te la hemos hecho. Te llega antes de terminar la entrevista." : "Todavía no se la hemos hecho. Le llega antes de terminar la entrevista.",
      tarde: propia ? "Ha llegado tarde y ya no te la hacemos." : "Ha llegado tarde y ya no se la hacemos.",
    })[e],
  },
};

const CA: TextosPreguntasFamilia = {
  titulo: "Les preguntes de la família",
  bajada: "Les que ha afegit la família, amb les mateixes paraules.",
  estado: (e, propia) => ({
    contestada: propia ? "Ja l'has contestada. La teva resposta és més avall." : "Ja l'ha contestada. La seva resposta és més avall.",
    esperando: propia ? "Ja te l'hem feta. Falta que contestis." : "Ja l'hi hem fet. Falta que contesti.",
    "sin respuesta": propia ? "Te l'hem feta i l'has deixat passar." : "L'hi hem fet i l'ha deixat passar.",
    "por hacer": propia ? "Encara no te l'hem feta. T'arriba abans d'acabar l'entrevista." : "Encara no l'hi hem fet. Li arriba abans d'acabar l'entrevista.",
    tarde: propia ? "Ha arribat tard i ja no te la farem." : "Ha arribat tard i ja no l'hi farem.",
  })[e],
};

export function textosPreguntasFamilia(idioma: IdiomaPreguntasFamilia): TextosPreguntasFamilia {
  return idioma === "ca" ? CA : ES_AR[idioma];
}
