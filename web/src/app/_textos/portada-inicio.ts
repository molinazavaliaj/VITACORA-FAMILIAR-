import type { Textos } from "@/lib/idioma-web";

// Lo que se sumó a la portada al acercarla al esquema de tienda (05/11): la
// franja de confianza, el WhatsApp de ejemplo del inicio y dos tapas de
// ejemplo. Son propuestas: Naza los aprueba antes del merge. El catalán falta
// revisarlo con Imma. La franja no dice «garantía»: vive solo en las preguntas
// frecuentes (DECISIONES D1) y la mira el abogado.

export type TapaEjemplo = { etiqueta: string; nombre: [string, string]; firma: string };

export type TextosPortadaInicio = {
  confianza: [string, string, string, string];
  telefono: { nombre: string; estado: string; pregunta: string; acuse: string };
  tapaTi: TapaEjemplo;
  tapaEvento: TapaEjemplo;
};

export const TEXTOS_PORTADA_INICIO: Textos<TextosPortadaInicio> = {
  es: {
    confianza: ["Todo por WhatsApp", "Pago seguro y cifrado", "Un solo pago, sin suscripciones", "Te contesta una persona"],
    telefono: { nombre: "Vitácora", estado: "en línea", pregunta: "¿Qué recuerdas de la casa donde creciste?", acuse: "Te he escuchado. Vamos con la siguiente." },
    tapaTi: { etiqueta: "El libro de mi vida", nombre: ["Carmen", "Ruiz"], firma: "para siempre" },
    tapaEvento: { etiqueta: "El libro de la boda", nombre: ["Lucía", "y Tomás"], firma: "para siempre" },
  },
  ar: {
    confianza: ["Todo por WhatsApp", "Pago seguro y cifrado", "Un solo pago, sin suscripciones", "Te contesta una persona"],
    telefono: { nombre: "Vitácora", estado: "en línea", pregunta: "¿Qué recordás de la casa donde creciste?", acuse: "Te escuché. Vamos con la que sigue." },
    tapaTi: { etiqueta: "El libro de mi vida", nombre: ["Carmen", "Ruiz"], firma: "para siempre" },
    tapaEvento: { etiqueta: "El libro del casamiento", nombre: ["Lucía", "y Tomás"], firma: "para siempre" },
  },
  ca: {
    confianza: ["Tot per WhatsApp", "Pagament segur i xifrat", "Un sol pagament, sense subscripcions", "Et respon una persona"],
    telefono: { nombre: "Vitácora", estado: "en línia", pregunta: "Què recordes de la casa on vas créixer?", acuse: "T'he escoltat. Anem per la següent." },
    tapaTi: { etiqueta: "El llibre de la meva vida", nombre: ["Carmen", "Ruiz"], firma: "per sempre" },
    tapaEvento: { etiqueta: "El llibre del casament", nombre: ["Lucía", "i Tomás"], firma: "per sempre" },
  },
};
