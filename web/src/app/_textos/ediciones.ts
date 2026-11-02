import type { Textos } from "@/lib/idioma-web";

// «Nuestras ediciones» en la portada (maqueta aprobada por Naza el 02/11):
// cuatro fichas iguales, como una tienda, con el libro cerrado en el mismo
// fondo de estudio y, al pasar el mouse, la escena. TEXTOS PARA NAZA (02/11):
// todavía sin aprobar.
//
// Las tapas son las de la web: la de Osvaldo (TEXTOS_PORTADA.direccion.libro),
// la de Viaje (LIBRO_VIAJE_EJEMPLO) y la de Historia (LIBRO_HISTORIA_EJEMPLO).
// La de Kids no existía y va acá. Reglas de la portada: sin dos puntos, sin
// «padre», ninguna oración empieza con «Y».
//
// es = España, de tú · ar = Argentina, de vos · ca = catalán, de tú.

type Edicion = { nombre: string; para: string };

export type TextosEdiciones = {
  titulo: string;
  bajada: string;
  /** El botón que aparece sobre la foto al pasar el mouse. */
  mira: string;
  proximamente: string;
  familiar: Edicion;
  viaje: Edicion;
  kids: Edicion;
  historia: Edicion;
  /** La tapa de Kids (inventada, como las otras). */
  tapaKids: { etiqueta: string; nombre: [string, string]; edad: string };
  /** Lo que tienen las cuatro, abajo. */
  pie: [string, string, string];
};

export const TEXTOS_EDICIONES: Textos<TextosEdiciones> = {
  es: {
    titulo: "Nuestras ediciones",
    bajada: "Cuatro libros para regalar",
    mira: "Ver la edición",
    proximamente: "Próximamente",
    familiar: { nombre: "Vitácora Familiar", para: "La vida de alguien de tu familia" },
    viaje: { nombre: "Vitácora de Viaje", para: "Tu viaje, contado cada noche" },
    kids: { nombre: "Mi Primer Capítulo", para: "Su primer libro, a los 11 años" },
    historia: { nombre: "Vitácora de una historia", para: "Un capítulo de su vida, a fondo" },
    tapaKids: { etiqueta: "Mi primer capítulo", nombre: ["Nico", "Rivas"], edad: "11 años" },
    pie: ["Se cuenta por WhatsApp, con audios", "Con un QR para escuchar los audios", "Envío incluido"],
  },
  ar: {
    titulo: "Nuestras ediciones",
    bajada: "Cuatro libros para regalar",
    mira: "Ver la edición",
    proximamente: "Próximamente",
    familiar: { nombre: "Vitácora Familiar", para: "La vida de alguien de tu familia" },
    viaje: { nombre: "Vitácora de Viaje", para: "Tu viaje, contado cada noche" },
    kids: { nombre: "Mi Primer Capítulo", para: "Su primer libro, a los 11 años" },
    historia: { nombre: "Vitácora de una historia", para: "Un capítulo de su vida, a fondo" },
    tapaKids: { etiqueta: "Mi primer capítulo", nombre: ["Nico", "Rivas"], edad: "11 años" },
    pie: ["Se cuenta por WhatsApp, con audios", "Con un QR para escuchar los audios", "Envío incluido"],
  },
  ca: {
    titulo: "Les nostres edicions",
    bajada: "Quatre llibres per regalar",
    mira: "Veure l'edició",
    proximamente: "Aviat",
    familiar: { nombre: "Vitácora Familiar", para: "La vida d'algú de la teva família" },
    viaje: { nombre: "Vitácora de Viatge", para: "El teu viatge, explicat cada nit" },
    kids: { nombre: "El meu primer capítol", para: "El seu primer llibre, als 11 anys" },
    historia: { nombre: "Vitácora d'una història", para: "Un capítol de la seva vida, a fons" },
    tapaKids: { etiqueta: "El meu primer capítol", nombre: ["Nico", "Rivas"], edad: "11 anys" },
    pie: ["S'explica per WhatsApp, amb àudios", "Amb un QR per escoltar els àudios", "Enviament inclòs"],
  },
};
