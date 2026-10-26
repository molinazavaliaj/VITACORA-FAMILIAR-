import type { Textos } from "@/lib/idioma-web";

// El aviso de cookies y el enlace «Cookies» del pie (medición de anuncios, 26/10).
// Solo se ven con un id de Meta o Google en Vercel (lib/medicion.ts).
//
// PENDIENTE DE APROBAR POR NAZA (tanda «medición», 26/10) Y DEL ABOGADO.
// Rechazar tiene que ser igual de fácil que aceptar (guía de cookies de la
// AEPD): los dos botones, del mismo tamaño, en la primera capa.

export type TextosMedicion = {
  aviso: string;
  aceptar: string;
  rechazar: string;
  masInformacion: string;
  /** El enlace del pie que vuelve a abrir el aviso. */
  cookies: string;
};

export const TEXTOS_MEDICION: Textos<TextosMedicion> = {
  es: {
    aviso: "Usamos cookies de Meta y de Google para saber qué anuncios traen a quien compra. Solo se activan si aceptas.",
    aceptar: "Aceptar",
    rechazar: "Rechazar",
    masInformacion: "Más información",
    cookies: "Cookies",
  },
  ar: {
    aviso: "Usamos cookies de Meta y de Google para saber qué anuncios traen a quien compra. Solo se activan si aceptás.",
    aceptar: "Aceptar",
    rechazar: "Rechazar",
    masInformacion: "Más información",
    cookies: "Cookies",
  },
  ca: {
    aviso: "Fem servir galetes de Meta i de Google per saber quins anuncis porten qui compra. Només s'activen si acceptes.",
    aceptar: "Acceptar",
    rechazar: "Rebutjar",
    masInformacion: "Més informació",
    cookies: "Galetes",
  },
};
