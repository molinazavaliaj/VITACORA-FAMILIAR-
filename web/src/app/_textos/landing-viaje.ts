import type { Textos } from "@/lib/idioma-web";
import type { TextosLandingBase } from "./landings";

// Landing de anuncio de Viaje: /el-libro-del-viaje y sus versiones /ca y /ar.
// Una sola, sobria: «lo que no sale en las fotos». 16/10: dice lo que hace la
// Vitácora de Viaje V2 (WhatsApp antes, durante y después; el álbum; el libro
// con su voz), no el viaje viejo («se lee en la web», etapas). Sin «cada
// noche», sin cantidades ni plazos.
//
// es = España, de tú; ar = de vos; ca = de tu.
// TEXTO PARA NAZA: lo nuevo está en docs/rediseno-2026-10/viaje-v2/textos.md
// (tanda 7). El titular, la bajada, los pasos y el cierre siguen igual en ar;
// en es pasan de vosotros a tú.
// ca: PENDIENTE DE IMMA (revisión nativa).

export type TextosLandingViaje = TextosLandingBase & {
  queda: { titulo: string; items: [string, string, string] };
  pasosTitulo: string;
  pasos: [{ titulo: string; texto: string }, { titulo: string; texto: string }, { titulo: string; texto: string }];
};

export const TEXTOS_LANDING_VIAJE: Textos<TextosLandingViaje> = {
  es: {
    meta: {
      titulo: "El libro del viaje · Vitácora de Viaje",
      // TEXTO PARA NAZA: de vosotros a tú.
      descripcion: "El sitio donde cenaste, lo que te hizo reír, lo que dijo el camarero. Lo cuentas con un audio al final del día y queda en tu libro.",
    },
    etiqueta: "Vitácora de Viaje",
    titulo: "Las fotos se quedan. Lo que pasó, se olvida.",
    bajada: "El sitio donde cenaste, lo que te hizo reír, lo que dijo el camarero. Lo cuentas con un audio al final del día y queda en tu libro.",
    cta: "Empezar el libro del viaje",
    queda: {
      titulo: "Más que un álbum.",
      // TEXTO PARA NAZA
      items: ["Te pregunta por el día", "El álbum con tus fotos favoritas", "Tu voz dentro del libro"],
    },
    pasosTitulo: "Un audio y una foto. El resto, nosotros.",
    // TEXTO PARA NAZA: de vosotros a tú, y «antes y durante el viaje».
    pasos: [
      { titulo: "Te llega un mensaje", texto: "Por WhatsApp, antes y durante el viaje." },
      { titulo: "Contestas con un audio", texto: "Cuando te venga bien, sin escribir nada." },
      { titulo: "Al volver, el libro", texto: "Con tus palabras, tus fotos y tu voz." },
    ],
    faqTitulo: "Antes de comprarlo.",
    cierre: "Que este viaje no se olvide.",
  },
  ar: {
    meta: {
      titulo: "El libro del viaje · Vitácora de Viaje",
      descripcion: "El lugar donde cenaste, lo que te hizo reír, lo que dijo el mozo. Lo contás con un audio al final del día y queda en tu libro.",
    },
    etiqueta: "Vitácora de Viaje",
    titulo: "Las fotos quedan. Lo que pasó, se olvida.",
    bajada: "El lugar donde cenaste, lo que te hizo reír, lo que dijo el mozo. Lo contás con un audio al final del día y queda en tu libro.",
    cta: "Empezar mi Vitácora de viaje",
    queda: {
      titulo: "Más que un álbum.",
      items: ["Te pregunta por el día", "El álbum con tus fotos favoritas", "Tu voz dentro del libro"],
    },
    pasosTitulo: "Un audio y una foto. El resto, nosotros.",
    pasos: [
      { titulo: "Te llega un mensaje", texto: "Por WhatsApp, antes y durante el viaje." },
      { titulo: "Contestás con un audio", texto: "Cuando te venga bien, sin escribir nada." },
      { titulo: "Al volver, el libro", texto: "Con tus palabras, tus fotos y tu voz." },
    ],
    faqTitulo: "Antes de comprarlo.",
    cierre: "Que este viaje no se olvide.",
  },
  ca: {
    meta: {
      titulo: "El llibre del viatge · Vitácora de Viatge",
      descripcion: "El lloc on vas sopar, el que et va fer riure, el que va dir el cambrer. Ho expliques amb un àudio al final del dia i queda al teu llibre.",
    },
    etiqueta: "Vitácora de Viatge",
    titulo: "Les fotos queden. El que va passar, s'oblida.",
    bajada: "El lloc on vas sopar, el que et va fer riure, el que va dir el cambrer. Ho expliques amb un àudio al final del dia i queda al teu llibre.",
    cta: "Començar el llibre del viatge",
    queda: {
      titulo: "Més que un àlbum.",
      items: ["Et pregunta pel dia", "L'àlbum amb les teves fotos preferides", "La teva veu dins del llibre"],
    },
    pasosTitulo: "Un àudio i una foto. La resta, nosaltres.",
    pasos: [
      { titulo: "T'arriba un missatge", texto: "Per WhatsApp, abans i durant el viatge." },
      { titulo: "Respons amb un àudio", texto: "Quan et vagi bé, sense escriure res." },
      { titulo: "En tornar, el llibre", texto: "Amb les teves paraules, les teves fotos i la teva veu." },
    ],
    faqTitulo: "Abans de comprar-lo.",
    cierre: "Que aquest viatge no s'oblidi.",
  },
};
