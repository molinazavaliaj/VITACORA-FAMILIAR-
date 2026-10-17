import type { Textos } from "@/lib/idioma-web";
import type { ProductoOpinion } from "@/lib/opiniones";

// Los textos de /opiniones (rediseño 2026-10). Numerados para aprobar en
// docs/rediseno-2026-10/opiniones/textos.md (tanda 1, #1 a #10). Las opiniones
// en sí no van acá: salen de lib/opiniones.ts, en su idioma original. El
// cierre (lema y «Iniciar Vitácora») es el aprobado de la portada (#30).
//
// ca: PENDIENTE REVISIÓN NATIVA

export type TextosOpiniones = {
  /** #10 */
  meta: { titulo: string; descripcion: string };
  /** #1 */
  etiqueta: string;
  /** #2 */
  titulo: string;
  /** #3 */
  bajada: string;
  /** #4 */
  producto: Record<ProductoOpinion, string>;
  /** #5 */
  pagina: string;
  /** #6 */
  comprobadasTitulo: string;
  /** #7 (obligatorio en España: cómo se comprueba que son de clientes) */
  comprobadasTexto: string;
  /** #8 */
  google: string;
};

export const TEXTOS_OPINIONES: Textos<TextosOpiniones> = {
  es: {
    meta: { titulo: "Opiniones", descripcion: "Lo que dicen las familias que ya tienen su libro de Vitácora." },
    etiqueta: "Opiniones",
    titulo: "Lo que dicen las familias.",
    bajada: "Opiniones de quienes ya tienen su libro en casa.",
    producto: { familiar: "Libro familiar", viaje: "Libro del viaje" },
    pagina: "Una página de su libro",
    comprobadasTitulo: "Cómo las comprobamos",
    comprobadasTexto:
      "Solo publicamos opiniones de personas que hicieron su libro con Vitácora. Comprobamos cada una con su pedido y la publicamos con su permiso, sin cambiar sus palabras.",
    google: "Ver todas las opiniones en Google",
  },
  ca: {
    meta: { titulo: "Opinions", descripcion: "El que diuen les famílies que ja tenen el seu llibre de Vitácora." },
    etiqueta: "Opinions",
    titulo: "El que diuen les famílies.",
    bajada: "Opinions de qui ja té el seu llibre a casa.",
    producto: { familiar: "Llibre familiar", viaje: "Llibre del viatge" },
    pagina: "Una pàgina del seu llibre",
    comprobadasTitulo: "Com les comprovem",
    comprobadasTexto:
      "Només publiquem opinions de persones que han fet el seu llibre amb Vitácora. Comprovem cadascuna amb la seva comanda i la publiquem amb el seu permís, sense canviar les seves paraules.",
    google: "Veure totes les opinions a Google",
  },
  ar: {
    meta: { titulo: "Opiniones", descripcion: "Lo que dicen las familias que ya tienen su libro de Vitácora." },
    etiqueta: "Opiniones",
    titulo: "Lo que dicen las familias.",
    bajada: "Opiniones de quienes ya tienen su libro en casa.",
    producto: { familiar: "Libro familiar", viaje: "Libro del viaje" },
    pagina: "Una página de su libro",
    comprobadasTitulo: "Cómo las comprobamos",
    comprobadasTexto:
      "Solo publicamos opiniones de personas que hicieron su libro con Vitácora. Comprobamos cada una con su pedido y la publicamos con su permiso, sin cambiar sus palabras.",
    google: "Ver todas las opiniones en Google",
  },
};
