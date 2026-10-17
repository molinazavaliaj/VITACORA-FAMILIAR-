// Las opiniones de clientes que se muestran en /opiniones, /ca/opiniones y
// /ar/opiniones (rediseño 2026-10, docs/rediseno-2026-10/opiniones/).
//
// ARRANCA VACÍO. Nunca cargar acá opiniones inventadas ni de ejemplo (las de la
// maqueta no se publican, ni con etiqueta): solo opiniones REALES, de alguien
// que compró, con permiso por escrito para publicarla. Mientras haya menos de
// MINIMO_OPINIONES, la página devuelve 404, no entra al sitemap y el pie no la
// enlaza (test/opiniones.test.tsx).
//
// Cómo se agrega una: un objeto más en OPINIONES, con la frase tal como la dio
// (sin corregirla ni traducirla) y el pedido con el que se comprobó. Ejemplo
// del FORMATO (no es una opinión, no copiar):
//
//   {
//     id: "2026-11-nombre",           // único
//     frase: "Lo que dijo, con sus palabras.",
//     nombre: "Nombre de pila",
//     relacion: "hija de Carmen",       // o «narrador», «narradora», «viajera»…
//     ciudad: "Zaragoza",
//     fecha: "2026-11-03",              // cuándo la dio; se muestra mes y año
//     producto: "familiar",             // o "viaje"
//     lang: "es-ES",                    // el idioma en que la escribió: es-ES, es-AR o ca-ES
//     fragmento: "Un párrafo corto del libro, si dio permiso.", // opcional
//     pedido: "id del pedido",          // interno, no se muestra
//     permiso: "WhatsApp 03/11/2026",   // interno: dónde consta el permiso por escrito
//   },
//
// No se usan datos estructurados de reseñas (schema.org Review /
// AggregateRating): Google no los muestra para reseñas de la propia empresa y
// puede penalizarlos.

export type ProductoOpinion = "familiar" | "viaje";

export type Opinion = {
  /** Único: la key de la lista. */
  id: string;
  /** Lo que dijo, tal cual, en su idioma. Sin comillas (las pone la página). */
  frase: string;
  /** Solo el nombre de pila. */
  nombre: string;
  /** «hija de Carmen», «narradora», «viajero»… en el idioma de la frase. */
  relacion: string;
  ciudad: string;
  /** AAAA-MM-DD. Se muestra el mes y el año. */
  fecha: string;
  producto: ProductoOpinion;
  /** El idioma original de la frase: no se traduce. */
  lang: "es-ES" | "es-AR" | "ca-ES";
  /** Opcional, con permiso: un trozo corto de su libro, que se muestra como una página. */
  fragmento?: string;
  /** Interno, no se muestra: el pedido con el que se comprobó que compró. */
  pedido: string;
  /** Interno, no se muestra: dónde consta el permiso por escrito para publicarla. */
  permiso: string;
};

/** Las opiniones publicadas. Vacío hasta que haya reales con permiso. */
export const OPINIONES: readonly Opinion[] = [];

/** Con menos de estas, la página no existe. */
export const MINIMO_OPINIONES = 3;

/**
 * La ficha de Google de Vitácora (todas las opiniones). Se completa cuando
 * Google verifique el perfil. Vacía, el botón no se muestra.
 */
export const URL_OPINIONES_GOOGLE = "";

/** Si la página de opiniones se publica (y se enlaza y entra al sitemap). */
export function hayOpiniones(opiniones: readonly Opinion[] = OPINIONES): boolean {
  return opiniones.length >= MINIMO_OPINIONES;
}

/** Las más nuevas primero. */
export function ordenarOpiniones(opiniones: readonly Opinion[]): Opinion[] {
  return [...opiniones].sort((a, b) => b.fecha.localeCompare(a.fecha));
}
