// Lo fijo de la tapa del libro, por idioma (Naza, 13/10). Copia de TEXTOS_TAPA de
// fabrica/src/libro/plantilla-html.ts: la vista previa del panel y el libro impreso
// dicen lo mismo.

export type IdiomaLibro = "es" | "ca";

export const TEXTOS_TAPA: Record<IdiomaLibro, { eyebrow: string; siempre: string }> = {
  es: { eyebrow: "EL LIBRO DE SU VIDA", siempre: "para siempre" },
  ca: { eyebrow: "EL LLIBRE DE LA SEVA VIDA", siempre: "per sempre" },
};

/** Como `idiomaDelLibro` de la fábrica: entrevista en catalán → libro en catalán; si no, castellano. */
export const idiomaDelLibro = (idiomaEntrevista: string | null | undefined): IdiomaLibro => (idiomaEntrevista === "ca" ? "ca" : "es");
