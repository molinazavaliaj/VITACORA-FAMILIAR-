import type { Textos } from "@/lib/idioma-web";
import type { TextosLandingBase } from "./landings";

// Landing de anuncio de Viaje: /el-libro-del-viaje y sus versiones /ca y /ar.
// Una sola, sobria (fase 4): de los tres ángulos de las maquetas
// (LandingViajeLuna, LandingViajeOlvida, LandingViajeVolver) solo «lo que no
// sale en las fotos» se puede decir con el Viaje V1 que reciben hoy los
// clientes. Los otros dos se apoyan en cosas que hoy no son ciertas o no están
// decididas («contáis el viaje los dos», «cada uno con su móvil», «elegís el
// día de salida y ese día os llega el primer mensaje», «unos 9 días»): quedan
// en PENDIENTES para cuando se prenda el V2.
//
// Sin «cada noche» ni «esa misma noche» (B24). es = vosotros a los que viajan,
// tú a quien paga; ar = de vos; ca = vosaltres / tu.
// Nuevo, para aprobar: fase-4/textos.md.
// ca: PENDIENTE REVISIÓN NATIVA

export type TextosLandingViaje = TextosLandingBase & {
  queda: { titulo: string; items: [string, string, string] };
  pasosTitulo: string;
  pasos: [{ titulo: string; texto: string }, { titulo: string; texto: string }, { titulo: string; texto: string }];
};

export const TEXTOS_LANDING_VIAJE: Textos<TextosLandingViaje> = {
  es: {
    meta: {
      titulo: "El libro del viaje · Vitácora de Viaje",
      descripcion: "El sitio donde cenasteis, lo que os hizo reír, lo que dijo el camarero. Lo contáis con un audio al final del día y queda en vuestro libro.",
    },
    etiqueta: "Vitácora de Viaje",
    titulo: "Las fotos se quedan. Lo que pasó, se olvida.",
    bajada: "El sitio donde cenasteis, lo que os hizo reír, lo que dijo el camarero. Lo contáis con un audio al final del día y queda en vuestro libro.",
    cta: "Empezar el libro del viaje",
    queda: {
      titulo: "Más que un álbum.",
      items: ["Os pregunta por el día", "Vuestras fotos, junto a su historia", "Se lee y se escucha en la web"],
    },
    pasosTitulo: "Un audio y una foto. El resto, nosotros.",
    pasos: [
      { titulo: "Os llega un mensaje", texto: "Por WhatsApp, mientras estáis de viaje." },
      { titulo: "Contestáis con un audio", texto: "Cuando os venga bien, sin escribir nada." },
      { titulo: "Al volver, el libro", texto: "Con vuestras palabras, vuestras fotos y vuestra voz." },
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
      items: ["Te pregunta por el día", "Tus fotos, junto a su historia", "Se lee y se escucha en la web"],
    },
    pasosTitulo: "Un audio y una foto. El resto, nosotros.",
    pasos: [
      { titulo: "Te llega un mensaje", texto: "Por WhatsApp, mientras estás de viaje." },
      { titulo: "Contestás con un audio", texto: "Cuando te venga bien, sin escribir nada." },
      { titulo: "Al volver, el libro", texto: "Con tus palabras, tus fotos y tu voz." },
    ],
    faqTitulo: "Antes de comprarlo.",
    cierre: "Que este viaje no se olvide.",
  },
  // ca: PENDIENTE REVISIÓN NATIVA
  ca: {
    meta: {
      titulo: "El llibre del viatge · Vitácora de Viatge",
      descripcion: "El lloc on vau sopar, el que us va fer riure, el que va dir el cambrer. Ho expliqueu amb un àudio al final del dia i queda al vostre llibre.",
    },
    etiqueta: "Vitácora de Viatge",
    titulo: "Les fotos queden. El que va passar, s'oblida.",
    bajada: "El lloc on vau sopar, el que us va fer riure, el que va dir el cambrer. Ho expliqueu amb un àudio al final del dia i queda al vostre llibre.",
    cta: "Començar el llibre del viatge",
    queda: {
      titulo: "Més que un àlbum.",
      items: ["Us pregunta pel dia", "Les vostres fotos, amb la seva història", "Es llegeix i s'escolta al web"],
    },
    pasosTitulo: "Un àudio i una foto. La resta, nosaltres.",
    pasos: [
      { titulo: "Us arriba un missatge", texto: "Per WhatsApp, mentre sou de viatge." },
      { titulo: "Responeu amb un àudio", texto: "Quan us vingui bé, sense escriure res." },
      { titulo: "En tornar, el llibre", texto: "Amb les vostres paraules, les vostres fotos i la vostra veu." },
    ],
    faqTitulo: "Abans de comprar-lo.",
    cierre: "Que aquest viatge no s'oblidi.",
  },
};
