import type { Textos } from "@/lib/idioma-web";
import type { TextosLandingBase } from "./landings";

// Landing de anuncio «Lo que nunca le preguntaste» (maqueta LandingPreguntas):
// /lo-que-nunca-le-preguntaste y sus versiones /ca y /ar. La idea: hay cosas
// de tu padre que no sabes. La prueba son preguntas DE VERDAD de la entrevista.
//
// Las preguntas de la maqueta eran inventadas. Estas salen del banco vigente
// de la entrevista V3 (solo lectura), una de raíces, dos de infancia y una de
// oficio, ninguna de amor:
//   es → docs/v3/entrevista/banco-es-ES.md (aprobado por Naza el 06/10)
//   ar → docs/v3/entrevista/banco.md (rioplatense, el original)
//   ca → docs/v3/entrevista/banco-ca.md
// IDs: OR2 (Las raíces), CA1 (La infancia), ES7 (La infancia), TR1 (El oficio).
// Se muestra el comienzo de cada pregunta (hasta el primer signo de cierre que
// no corta el sentido) y los dos puntos pasan a punto, como en las preguntas
// de la portada que Naza aprobó el 11/10 (OR2 y CA1 en es y ar son ese texto
// aprobado, palabra por palabra).
// ca: revisado con el corrector de Softcatalà (18/10)

export type PreguntaDelBanco = { id: string; capitulo: string; texto: string };

export type TextosLandingPreguntas = TextosLandingBase & {
  preguntasTitulo: string;
  preguntas: [PreguntaDelBanco, PreguntaDelBanco, PreguntaDelBanco, PreguntaDelBanco];
  preguntasPie: string;
  pasosTitulo: string;
  altFoto: string;
};

export const TEXTOS_LANDING_PREGUNTAS: Textos<TextosLandingPreguntas> = {
  es: {
    meta: {
      titulo: "Lo que nunca le preguntaste · Vitácora Familiar",
      descripcion: "Dónde jugaba de pequeño, su primer trabajo, cómo era su pueblo. Nosotros le preguntamos, él lo cuenta con audios y tú lo lees en su libro.",
    },
    etiqueta: "Lo que nunca le preguntaste",
    titulo: "¿Qué sabes de tu padre antes de que fuera tu padre?",
    bajada: "Dónde jugaba de pequeño, su primer trabajo, cómo era su pueblo. Nosotros le preguntamos, él lo cuenta con audios y tú lo lees en su libro.",
    cta: "Empezar su libro",
    preguntasTitulo: "Preguntas que nunca le hiciste.",
    preguntas: [
      {
        id: "OR2",
        capitulo: "Las raíces",
        texto:
          "En todas las familias hay una historia de los de antes que se contaba en las sobremesas. Un viaje, una llegada, alguna hazaña. ¿Cuál sabes de tu familia?",
      },
      {
        id: "CA1",
        capitulo: "La infancia",
        texto: "Cuéntame el primer recuerdo que tengas de la casa donde creciste. Un día, qué estabas haciendo, quién andaba por ahí.",
      },
      { id: "ES7", capitulo: "La infancia", texto: "¿Qué querías ser de mayor? ¿De dónde te vino esa idea?" },
      {
        id: "TR1",
        capitulo: "El oficio",
        texto: "¿Te acuerdas de la primera vez que ganaste algo de dinero, o que trabajaste sin cobrar? ¿Qué hacías, qué edad tenías?",
      },
    ],
    preguntasPie: "Son preguntas de la entrevista de verdad. Le llegan por WhatsApp, de una en una, y él contesta con audios cuando quiere.",
    pasosTitulo: "Él habla. Nosotros escribimos.",
    altFoto: "Un padre y su hijo se ríen en el sofá mientras miran juntos un libro",
    faqTitulo: "Antes de regalarlo.",
    cierre: "Pregúntale ahora. Léelo siempre.",
  },
  ar: {
    meta: {
      titulo: "Lo que nunca le preguntaste · Vitácora Familiar",
      descripcion: "Dónde jugaba de chico, su primer trabajo, cómo era su barrio. Nosotros le preguntamos, él lo cuenta con audios y vos lo leés en su libro.",
    },
    etiqueta: "Lo que nunca le preguntaste",
    titulo: "¿Qué sabés de tu papá antes de que fuera tu papá?",
    bajada: "Dónde jugaba de chico, su primer trabajo, cómo era su barrio. Nosotros le preguntamos, él lo cuenta con audios y vos lo leés en su libro.",
    cta: "Empezar su libro",
    preguntasTitulo: "Preguntas que nunca le hiciste.",
    preguntas: [
      {
        id: "OR2",
        capitulo: "Las raíces",
        texto:
          "En todas las familias hay una historia de los de antes que se contaba en las sobremesas. Un viaje, una llegada, alguna hazaña. ¿Cuál sabés de tu familia?",
      },
      {
        id: "CA1",
        capitulo: "La infancia",
        texto: "Contame el primer recuerdo que tengas de la casa donde creciste. Un día, qué estabas haciendo, quién andaba por ahí.",
      },
      { id: "ES7", capitulo: "La infancia", texto: "¿Qué querías ser cuando fueras grande? ¿De dónde te vino esa idea?" },
      {
        id: "TR1",
        capitulo: "El oficio",
        texto: "¿Te acordás de la primera vez que te ganaste algo, o que trabajaste sin cobrar? ¿Qué hacías, qué edad tenías?",
      },
    ],
    preguntasPie: "Son preguntas de la entrevista de verdad. Le llegan por WhatsApp, de a una, y él contesta con audios cuando quiere.",
    pasosTitulo: "Él habla. Nosotros escribimos.",
    altFoto: "Un padre y su hijo se ríen en el sillón mientras miran juntos un libro",
    faqTitulo: "Antes de regalarlo.",
    cierre: "Preguntale ahora. Leelo siempre.",
  },
  // ca: revisado con el corrector de Softcatalà (18/10)
  ca: {
    meta: {
      titulo: "El que mai li has preguntat · Vitácora Familiar",
      descripcion: "On jugava de petit, la seva primera feina, com era el seu poble. Nosaltres li preguntem, ell ho explica amb àudios i tu ho llegeixes al seu llibre.",
    },
    etiqueta: "El que mai li has preguntat",
    titulo: "Què saps del teu pare d'abans que fos el teu pare?",
    bajada: "On jugava de petit, la seva primera feina, com era el seu poble. Nosaltres li preguntem, ell ho explica amb àudios i tu ho llegeixes al seu llibre.",
    cta: "Començar el seu llibre",
    preguntasTitulo: "Preguntes que mai li has fet.",
    preguntas: [
      {
        id: "OR2",
        capitulo: "Les arrels",
        texto:
          "A totes les famílies hi ha una història d'abans que s'explicava a les sobretaules. Un viatge, una arribada, alguna proesa. Quina en saps, de la teva família?",
      },
      {
        id: "CA1",
        capitulo: "La infància",
        texto: "Explica'm el primer record que tinguis de la casa on vas créixer. Un dia, què feies, qui hi havia per allà.",
      },
      { id: "ES7", capitulo: "La infància", texto: "Què volies ser de gran? D'on et va venir aquella idea?" },
      {
        id: "TR1",
        capitulo: "L'ofici",
        texto: "Recordes la primera vegada que vas guanyar uns diners, o que vas treballar sense cobrar? Què feies, quants anys tenies?",
      },
    ],
    preguntasPie: "Són preguntes de l'entrevista de veritat. Li arriben per WhatsApp, d'una en una, i ell respon amb àudios quan vol.",
    pasosTitulo: "Ell parla. Nosaltres escrivim.",
    altFoto: "Un pare i el seu fill riuen al sofà mentre miren junts un llibre",
    faqTitulo: "Abans de regalar-lo.",
    cierre: "Pregunta-li ara. Llegeix-ho sempre.",
  },
};
