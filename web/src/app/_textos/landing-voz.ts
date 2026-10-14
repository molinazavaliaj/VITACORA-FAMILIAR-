import type { Textos } from "@/lib/idioma-web";
import type { TextosLandingBase } from "./landings";

// Landing de anuncio «Su voz» (maqueta LandingVoz): /su-voz y sus versiones
// /ca y /ar. La idea: el libro guarda su voz, no solo sus palabras. La prueba
// es la cita del limonero (aprobada, la de la portada) con la onda QUIETA: no
// hay un audio de muestra con permiso (PENDIENTES P1), así que no se ofrece
// escuchar nada. El marco con su voz va solo si se vende el impreso (C3).
//
// Respecto de la maqueta: fuera «13 × 18 cm» (P2), «se puede pedir con el
// libro digital» (D4: el marco va con el impreso), «+20 €» escrito a mano, el
// audio de Osvaldo que sonaba y «Cada libro lleva un código» (el PDF no lleva
// código: lleva sus audios a un toque; el código va en el impreso).
// Nuevo, para aprobar: fase-4/textos.md.
// ca: PENDIENTE REVISIÓN NATIVA

export type TextosLandingVoz = TextosLandingBase & {
  vozTitulo: string;
  ilustracion: string;
  pasosTitulo: string;
};

export const TEXTOS_LANDING_VOZ: Textos<TextosLandingVoz> = {
  es: {
    meta: {
      titulo: "Su voz, guardada · Vitácora Familiar",
      descripcion: "Su libro lleva sus mejores frases con su voz real. Para ti, para tus hijos y para cuando quieras volver a oírle.",
    },
    etiqueta: "Su voz, guardada",
    titulo: "Su historia, contada con su voz.",
    bajada: "Su libro lleva sus mejores frases con su voz real. Para ti, para tus hijos y para cuando quieras volver a oírle.",
    cta: "Guardar su voz",
    vozTitulo: "No es un libro mudo.",
    ilustracion: "Una frase de ejemplo, de una historia inventada. En su libro, suena su voz.",
    pasosTitulo: "Tres pasos y su voz queda guardada.",
    faqTitulo: "Sobre su voz.",
    cierre: "Que su voz se quede en casa.",
  },
  ar: {
    meta: {
      titulo: "Su voz, guardada · Vitácora Familiar",
      descripcion: "Su libro lleva sus mejores frases con su voz real. Para vos, para tus hijos y para cuando quieras volver a escucharlo.",
    },
    etiqueta: "Su voz, guardada",
    titulo: "Su historia, contada con su voz.",
    bajada: "Su libro lleva sus mejores frases con su voz real. Para vos, para tus hijos y para cuando quieras volver a escucharlo.",
    cta: "Guardar su voz",
    vozTitulo: "No es un libro mudo.",
    ilustracion: "Una frase de ejemplo, de una historia inventada. En su libro, suena su voz.",
    pasosTitulo: "Tres pasos y su voz queda guardada.",
    faqTitulo: "Sobre su voz.",
    cierre: "Que su voz se quede en casa.",
  },
  // ca: PENDIENTE REVISIÓN NATIVA
  ca: {
    meta: {
      titulo: "La seva veu, guardada · Vitácora Familiar",
      descripcion: "El seu llibre porta les seves millors frases amb la seva veu real. Per a tu, per als teus fills i per quan vulguis tornar a sentir-lo.",
    },
    etiqueta: "La seva veu, guardada",
    titulo: "La seva història, explicada amb la seva veu.",
    bajada: "El seu llibre porta les seves millors frases amb la seva veu real. Per a tu, per als teus fills i per quan vulguis tornar a sentir-lo.",
    cta: "Guardar la seva veu",
    vozTitulo: "No és un llibre mut.",
    ilustracion: "Una frase d'exemple, d'una història inventada. Al seu llibre, hi sona la seva veu.",
    pasosTitulo: "Tres passos i la seva veu queda guardada.",
    faqTitulo: "Sobre la seva veu.",
    cierre: "Que la seva veu es quedi a casa.",
  },
};
