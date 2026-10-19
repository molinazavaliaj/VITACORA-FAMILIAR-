import type { Textos } from "@/lib/idioma-web";

// Los textos de la cabecera y el pie públicos (rediseño 2026-10), los que
// comparten la portada, /ejemplo y el checkout. Los nuevos están listados para
// aprobar en docs/rediseno-2026-10/fase-1/textos-portada.md.
// ca: PENDIENTE REVISIÓN NATIVA

export type TextosPublico = {
  inicio: string;
  productos: string;
  familiar: string;
  /** La solapa de Vitácora Kids (15/10). */
  kids: string;
  viaje: string;
  entrar: string;
  comprar: string;
  idioma: string;
  /** Para la versión de Argentina: ir a la de España. Y al revés. */
  cambiarPais: string;
  sugerenciaCatalan: string;
  sugerenciaCatalanEnlace: string;
  cerrar: string;
  lema: string;
  legales: string;
  terminos: string;
  privacidad: string;
  /** «Botón de arrepentimiento» en Argentina (Res. 424/2020); «Desistimiento» en España. */
  arrepentimiento: string;
  /** El enlace del pie a /legal/reclamaciones (tanda 5, 19/10). */
  reclamaciones: string;
  contacto: string;
  /** El horario de atención, debajo del contacto (tanda 5, texto 39). */
  horario: string;
  escribirWhatsApp: string;
  /** El enlace discreto del pie a /opiniones (solo con 3 opiniones o más). */
  opiniones: string;
  /** El enlace del pie a /eventos (Vitácora Eventos, 17/10). */
  eventos: string;
};

export const TEXTOS_PUBLICO: Textos<TextosPublico> = {
  es: {
    inicio: "Vitácora, inicio",
    productos: "Productos",
    familiar: "Familiar",
    kids: "Kids",
    viaje: "De viaje",
    entrar: "Entrar",
    comprar: "Iniciar Vitácora",
    idioma: "Idioma",
    cambiarPais: "¿Estás en Argentina?",
    // La sugerencia sale cuando el navegador pide catalán: va en catalán.
    sugerenciaCatalan: "Aquesta web també està en català.",
    sugerenciaCatalanEnlace: "Llegeix-la en català",
    cerrar: "Cerrar",
    lema: "Todas las vidas merecen su propio libro",
    legales: "Legales",
    terminos: "Términos",
    privacidad: "Privacidad",
    arrepentimiento: "Desistimiento",
    reclamaciones: "Reclamaciones",
    contacto: "Contacto",
    horario: "Atención de lunes a viernes, de 10 a 18.",
    escribirWhatsApp: "Escríbenos por WhatsApp",
    opiniones: "Opiniones",
    eventos: "Eventos",
  },
  ca: {
    inicio: "Vitácora, inici",
    productos: "Productes",
    familiar: "Familiar",
    kids: "Kids",
    viaje: "De viatge",
    entrar: "Entrar",
    comprar: "Iniciar Vitácora",
    idioma: "Idioma",
    cambiarPais: "Ets a l'Argentina?",
    sugerenciaCatalan: "Aquesta web també està en català.",
    sugerenciaCatalanEnlace: "Llegeix-la en català",
    cerrar: "Tancar",
    lema: "Totes les vides mereixen el seu propi llibre",
    legales: "Legals",
    terminos: "Termes",
    privacidad: "Privacitat",
    arrepentimiento: "Desistiment",
    reclamaciones: "Reclamacions",
    contacto: "Contacte",
    horario: "Atenció de dilluns a divendres, de 10 a 18.",
    escribirWhatsApp: "Escriu-nos per WhatsApp",
    opiniones: "Opinions",
    eventos: "Esdeveniments",
  },
  ar: {
    inicio: "Vitácora, inicio",
    productos: "Productos",
    familiar: "Familiar",
    kids: "Kids",
    viaje: "De viaje",
    entrar: "Entrar",
    comprar: "Iniciar Vitácora",
    idioma: "Idioma",
    cambiarPais: "¿Estás en España?",
    sugerenciaCatalan: "Aquesta web també està en català.",
    sugerenciaCatalanEnlace: "Llegeix-la en català",
    cerrar: "Cerrar",
    lema: "Todas las vidas merecen su propio libro",
    legales: "Legales",
    terminos: "Términos",
    privacidad: "Privacidad",
    arrepentimiento: "Botón de arrepentimiento",
    reclamaciones: "Reclamaciones",
    contacto: "Contacto",
    horario: "Atención de lunes a viernes, de 10 a 18.",
    escribirWhatsApp: "Escribinos por WhatsApp",
    opiniones: "Opiniones",
    eventos: "Eventos",
  },
};
