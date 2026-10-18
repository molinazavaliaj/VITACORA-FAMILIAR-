import type { IdiomaRegalo } from "@/lib/regalo-textos";

// La tarjeta del regalo de Kids y de Viaje (rediseño 2026-10, arreglos chicos;
// maquetas `TarjetaKids` y `TarjetaViaje`). La de Familiar sigue con sus
// textos de siempre (lib/regalo-textos, `textosAbuelo`). Lo impreso va en el
// idioma de quien recibe (es-AR de vos, es-ES de tú, ca).
//
// De las maquetas, tal cual: «¿Qué es esto?», «Unas palabras», «Vitácora
// Kids», «Vitácora de viaje», «Un regalo para el viaje», los titulares de la
// tapa y los pasos que el sistema cumple. Lo demás (los pasos sin fecha ni
// «comunión», el trato en singular del viaje, el catalán) es PROPUESTA en
// docs/rediseno-2026-10/arreglos-chicos/textos.md 5. Ninguna frase promete un
// día ni «cada noche» (B24): el regalo empieza cuando quien lo recibe escribe.

export type ProductoTarjeta = "viaje" | "kids";

export type TextosTarjetaProducto = {
  /** La marca de la tapa y de la contratapa. */
  marca: string;
  /** La etiqueta chica de la tapa: «Un regalo de Laura». */
  etiqueta: (quienRegala: string) => string;
  /** El titular de la tapa, en renglones: el primero lleva el nombre. */
  titulo: (como: string) => [string, string, string];
  bajada: string;
  queEs: string;
  queEsTitulo: string;
  pasos: [string, string, string];
  unasPalabras: string;
  pie: string;
};

const KIDS_ES: TextosTarjetaProducto = {
  marca: "Vitácora Kids",
  etiqueta: (q) => `Un regalo de ${q}`,
  titulo: (como) => [`${como},`, "vas a escribir", "tu primer libro."],
  bajada: "Solo tienes que contarlo con audios.",
  queEs: "¿Qué es esto?",
  queEsTitulo: "Queremos saber cómo es tu mundo.",
  pasos: [
    "Te hacemos preguntas por WhatsApp, una detrás de otra.",
    "Contestas con audios, cuando te venga bien y lo largo que quieras. No hay que escribir nada.",
    "Con tus respuestas escribimos tu libro, con tus palabras y tu voz dentro.",
  ],
  unasPalabras: "Unas palabras",
  pie: "En cada familia hay un libro sin escribir.",
};

const KIDS_AR: TextosTarjetaProducto = {
  ...KIDS_ES,
  bajada: "Solo tenés que contarlo con audios.",
  pasos: [
    "Te hacemos preguntas por WhatsApp, una detrás de otra.",
    "Contestás con audios, cuando te quede bien y lo largo que quieras. No hay que escribir nada.",
    "Con tus respuestas escribimos tu libro, con tus palabras y tu voz adentro.",
  ],
};

// ca: PENDIENTE REVISIÓN NATIVA
const KIDS_CA: TextosTarjetaProducto = {
  marca: "Vitácora Kids",
  etiqueta: (q) => `Un regal de ${q}`,
  titulo: (como) => [`${como},`, "escriuràs", "el teu primer llibre."],
  bajada: "Només l'has d'explicar amb àudios.",
  queEs: "Què és això?",
  queEsTitulo: "Volem saber com és el teu món.",
  pasos: [
    "Et fem preguntes per WhatsApp, una darrere l'altra.",
    "Respons amb àudios, quan et vagi bé i tan llarg com vulguis. No cal escriure res.",
    "Amb les teves respostes escrivim el teu llibre, amb les teves paraules i la teva veu a dins.",
  ],
  unasPalabras: "Unes paraules",
  pie: "A cada família hi ha un llibre per escriure.",
};

const VIAJE_ES: TextosTarjetaProducto = {
  marca: "Vitácora de viaje",
  etiqueta: () => "Un regalo para el viaje",
  titulo: (como) => [`${como},`, "este viaje", "va a ser un libro."],
  bajada: "Solo tienes que contarlo con audios.",
  queEs: "¿Qué es esto?",
  queEsTitulo: "Este viaje no se va a quedar en el móvil.",
  pasos: [
    "Durante el viaje te hacemos preguntas por WhatsApp.",
    "Contestas con audios y mandas las fotos que quieras. No hay que escribir nada.",
    "Al volver, tienes el libro del viaje con tu voz dentro.",
  ],
  unasPalabras: "Unas palabras",
  pie: "En cada viaje hay un libro sin escribir.",
};

const VIAJE_AR: TextosTarjetaProducto = {
  ...VIAJE_ES,
  bajada: "Solo tenés que contarlo con audios.",
  queEsTitulo: "Este viaje no se va a quedar en el celular.",
  pasos: [
    "Durante el viaje te hacemos preguntas por WhatsApp.",
    "Contestás con audios y mandás las fotos que quieras. No hay que escribir nada.",
    "Al volver, tenés el libro del viaje con tu voz adentro.",
  ],
};

// ca: PENDIENTE REVISIÓN NATIVA
const VIAJE_CA: TextosTarjetaProducto = {
  marca: "Vitácora de viatge",
  etiqueta: () => "Un regal per al viatge",
  titulo: (como) => [`${como},`, "aquest viatge", "serà un llibre."],
  bajada: "Només l'has d'explicar amb àudios.",
  queEs: "Què és això?",
  queEsTitulo: "Aquest viatge no es quedarà al mòbil.",
  pasos: [
    "Durant el viatge et fem preguntes per WhatsApp.",
    "Respons amb àudios i envies les fotos que vulguis. No cal escriure res.",
    "En tornar, tens el llibre del viatge amb la teva veu a dins.",
  ],
  unasPalabras: "Unes paraules",
  pie: "A cada viatge hi ha un llibre per escriure.",
};

const TEXTOS: Record<ProductoTarjeta, Record<IdiomaRegalo, TextosTarjetaProducto>> = {
  kids: { "es-ES": KIDS_ES, "es-AR": KIDS_AR, ca: KIDS_CA },
  viaje: { "es-ES": VIAJE_ES, "es-AR": VIAJE_AR, ca: VIAJE_CA },
};

export function textosTarjetaProducto(producto: ProductoTarjeta, idioma: IdiomaRegalo): TextosTarjetaProducto {
  return TEXTOS[producto][idioma];
}
