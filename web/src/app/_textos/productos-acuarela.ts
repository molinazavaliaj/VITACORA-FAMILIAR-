import type { Textos } from "@/lib/idioma-web";

// Lo que las páginas de producto necesitan con el armado de la portada nueva
// (06/11) y no tenían escrito. Todo lo demás sale de los textos ya aprobados de
// cada página. PARA NAZA: esto está sin aprobar. El catalán falta pasarlo por
// Softcatalà y por Imma.
//
// Reglas: sin dos puntos, ninguna oración empieza con «Y», sin precio ni plazos.
// Eventos no dice lo que no está decidido (_textos/eventos.ts): cuánto cuesta,
// en qué ciudades, cuántos invitados, si va una persona o se graba por WhatsApp.

export type TextosProductosAcuarela = {
  /** /eventos no tenía preguntas: solo repiten lo que la página ya dice. */
  eventos: { faq: { titulo: string; preguntas: { pregunta: string; respuesta: string }[] } };
};

export const TEXTOS_PRODUCTOS_ACUARELA: Textos<TextosProductosAcuarela> = {
  es: {
    eventos: {
      faq: {
        titulo: "Preguntas que nos hacen.",
        preguntas: [
          { pregunta: "¿Tus invitados tienen que preparar algo?", respuesta: "No. Tus invitados solo hablan. Vamos a tu evento, los entrevistamos y con lo que cuentan hacemos el libro." },
          { pregunta: "¿Cuánto cuesta?", respuesta: "Depende del evento. Cuéntanos qué celebras y lo hablamos contigo." },
          { pregunta: "¿Mi celebración no está en la lista?", respuesta: "Cuéntanosla igual. Lo preparamos a tu medida." },
        ],
      },
    },
  },
  ar: {
    eventos: {
      faq: {
        titulo: "Preguntas que nos hacen.",
        preguntas: [
          { pregunta: "¿Tus invitados tienen que preparar algo?", respuesta: "No. Tus invitados solo hablan. Vamos a tu evento, los entrevistamos y con lo que cuentan hacemos el libro." },
          { pregunta: "¿Cuánto cuesta?", respuesta: "Depende del evento. Contanos qué celebrás y lo hablamos con vos." },
          { pregunta: "¿Mi celebración no está en la lista?", respuesta: "Contanos igual. Lo preparamos a tu medida." },
        ],
      },
    },
  },
  ca: {
    eventos: {
      faq: {
        titulo: "Preguntes que ens fan.",
        preguntas: [
          { pregunta: "Els teus convidats han de preparar res?", respuesta: "No. Els teus convidats només parlen. Venim al teu esdeveniment, els entrevistem i amb el que expliquen fem el llibre." },
          { pregunta: "Quant costa?", respuesta: "Depèn de l'esdeveniment. Explica'ns què celebres i ho parlem amb tu." },
          { pregunta: "La meva celebració no és a la llista?", respuesta: "Explica-ho igualment. Ho preparem a la teva mida." },
        ],
      },
    },
  },
};
