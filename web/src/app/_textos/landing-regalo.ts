import type { Textos } from "@/lib/idioma-web";
import type { TextosLandingBase } from "./landings";

// Landing de anuncio «Un regalo para tu padre» (maqueta LandingRegalo):
// /regalo-para-tu-padre, /ca/regalo-para-tu-padre, /ar/regalo-para-tu-papa.
// La idea: es un regalo que no se compra hecho; tú eliges el día y le das una
// tarjeta. La prueba es la tarjeta de verdad (los textos aprobados de
// lib/regalo-textos.ts, con nombres de ejemplo) y el libro de Osvaldo.
// Los pasos y las preguntas frecuentes son los aprobados de la portada.
// Nuevo, para aprobar: fase-4/textos.md.
// ca: PENDIENTE REVISIÓN NATIVA

export type TextosLandingRegalo = TextosLandingBase & {
  pasosTitulo: string;
  /** El título del primer paso; su texto y los otros dos pasos son los aprobados de la portada. */
  pasoDia: string;
  tarjeta: { titulo: string; texto: string; pie: string; narrador: string; quien: string };
  altFoto: string;
};

export const TEXTOS_LANDING_REGALO: Textos<TextosLandingRegalo> = {
  es: {
    meta: {
      titulo: "Un regalo para tu padre · Vitácora Familiar",
      descripcion: "Le preguntamos por su vida por WhatsApp, él contesta con audios y tú recibes el libro de su vida, con su voz dentro.",
    },
    etiqueta: "Un regalo para tu padre",
    titulo: "El regalo que no va a acabar en un cajón.",
    bajada: "Le preguntamos por su vida por WhatsApp, él contesta con audios y tú recibes el libro de su vida, con su voz dentro.",
    cta: "Regalarle su libro",
    pasosTitulo: "Tú eliges el día. Él cuenta su vida.",
    pasoDia: "Eliges el día",
    tarjeta: {
      titulo: "Una tarjeta para dárselo en mano.",
      texto: "Al comprar te llega una tarjeta lista para imprimir o mandar por WhatsApp. Así tiene algo que abrir ese mismo día.",
      pie: "Así es la tarjeta. Los nombres son de ejemplo.",
      narrador: "Osvaldo",
      quien: "Laura",
    },
    altFoto: "Un abuelo abre una tarjeta de regalo junto al árbol de Navidad",
    faqTitulo: "Lo que suele preguntar quien regala.",
    cierre: "Este año, regálale su historia.",
  },
  ar: {
    meta: {
      titulo: "Un regalo para tu papá · Vitácora Familiar",
      descripcion: "Le preguntamos por su vida por WhatsApp, él contesta con audios y vos recibís el libro de su vida, con su voz adentro.",
    },
    etiqueta: "Un regalo para tu papá",
    titulo: "El regalo que no va a terminar en un cajón.",
    bajada: "Le preguntamos por su vida por WhatsApp, él contesta con audios y vos recibís el libro de su vida, con su voz adentro.",
    cta: "Regalarle su libro",
    pasosTitulo: "Vos elegís el día. Él cuenta su vida.",
    pasoDia: "Elegís el día",
    tarjeta: {
      titulo: "Una tarjeta para dársela en mano.",
      texto: "Al comprar te llega una tarjeta lista para imprimir o mandar por WhatsApp. Así tiene algo que abrir ese mismo día.",
      pie: "Así es la tarjeta. Los nombres son de ejemplo.",
      narrador: "Osvaldo",
      quien: "Laura",
    },
    altFoto: "Un abuelo abre una tarjeta de regalo junto al árbol de Navidad",
    faqTitulo: "Lo que suele preguntar quien regala.",
    cierre: "Este año, regalale su historia.",
  },
  // ca: PENDIENTE REVISIÓN NATIVA
  ca: {
    meta: {
      titulo: "Un regal per al teu pare · Vitácora Familiar",
      descripcion: "Li preguntem per la seva vida per WhatsApp, ell respon amb àudios i tu reps el llibre de la seva vida, amb la seva veu a dins.",
    },
    etiqueta: "Un regal per al teu pare",
    titulo: "El regal que no acabarà en un calaix.",
    bajada: "Li preguntem per la seva vida per WhatsApp, ell respon amb àudios i tu reps el llibre de la seva vida, amb la seva veu a dins.",
    cta: "Regalar-li el seu llibre",
    pasosTitulo: "Tu tries el dia. Ell explica la seva vida.",
    pasoDia: "Tries el dia",
    tarjeta: {
      titulo: "Una targeta per donar-li en mà.",
      texto: "En comprar et sortirà una targeta a punt per imprimir o enviar per WhatsApp. Així té alguna cosa per obrir aquell mateix dia.",
      pie: "Així és la targeta. Els noms són d'exemple.",
      narrador: "Osvaldo",
      quien: "Laura",
    },
    altFoto: "Un avi obre una targeta de regal al costat de l'arbre de Nadal",
    faqTitulo: "El que sol preguntar qui regala.",
    cierre: "Aquest any, regala-li la seva història.",
  },
};
