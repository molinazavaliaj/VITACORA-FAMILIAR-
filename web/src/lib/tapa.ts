// Lo fijo de la tapa del libro, por idioma (Naza, 13/10). Copia de TEXTOS_TAPA de
// fabrica/src/libro/plantilla-html.ts: la vista previa del panel y el libro impreso
// dicen lo mismo.

export type IdiomaLibro = "es" | "ca";

export const TEXTOS_TAPA: Record<IdiomaLibro, { eyebrow: string; siempre: string }> = {
  es: { eyebrow: "EL LIBRO DE SU VIDA", siempre: "para siempre" },
  ca: { eyebrow: "EL LLIBRE DE LA SEVA VIDA", siempre: "per sempre" },
};

/**
 * La contratapa impresa (sin foto: texto, QR de su voz y lema). Copia de TEXTOS_CUBIERTA de
 * fabrica/src/libro/bookmundo/cubierta.ts, para que la vista previa del panel muestre lo que se imprime.
 */
export const TEXTOS_CONTRATAPA: Record<IdiomaLibro, { contra: (nombre: string) => string; escucha: (tu: boolean) => string; lema: string }> = {
  es: {
    contra: (n) => `Estas páginas guardan la vida de ${n}, contada con sus propias palabras: sus mejores historias, tal como las vivió. En este QR, sus mejores frases.`,
    escucha: (tu) => (tu ? "Escucha su voz" : "Escuchá su voz"),
    lema: "Todas las vidas merecen su propio libro",
  },
  ca: {
    contra: (n) => `Aquestes pàgines guarden la vida ${deCatalan(n)}, explicada amb les seves pròpies paraules: les seves millors històries, tal com les va viure. En aquest QR, les seves millors frases.`,
    escucha: () => "Escolta la seva veu",
    lema: "Totes les vides mereixen el seu propi llibre",
  },
};

/** «de» en catalán se apostrofa ante vocal o hache: «d’Imma», «de Joan». */
export function deCatalan(nombre: string): string {
  return /^[aeiouàáèéíïòóúüh]/i.test(nombre.trim()) ? `d’${nombre}` : `de ${nombre}`;
}

/**
 * La línea de arriba del nombre en la tapa de un libro de «Vitácora de una historia» (aprobada por Naza el 24/10).
 * Copia de TEXTOS_TAPA_HISTORIA de fabrica/src/escritor-historia/produccion/textos-tapa.ts (el eyebrow).
 */
export const EYEBROW_HISTORIA: Record<IdiomaLibro, string> = {
  es: "UNA HISTORIA DE SU VIDA",
  ca: "UNA HISTÒRIA DE LA SEVA VIDA",
};

/** El producto del libro, para la tapa: Familiar (lo de siempre) o una historia. */
export type ProductoTapa = "familiar" | "historia";

/** Las palabras que van con lo que sigue: un renglón nunca termina en ellas. */
const PARTICULAS = new Set(["DE", "DEL", "LA", "LAS", "LOS", "Y", "I", "E", "DA", "DAS", "DO", "DOS", "VAN", "VON", "D'", "D’"]);

/**
 * El nombre de la tapa en sus renglones (Naza, 01/11): siempre en mayúsculas y en dos renglones lo más
 * parejos posible, sin cortar una palabra («JUAN DOMINGO / MATEOS»). Copia de `renglonesNombreTapa` de
 * fabrica/src/libro/plantilla-html.ts: la vista previa, el libro online y la tapa impresa lo cortan igual.
 */
export function renglonesNombreTapa(nombre: string): string[] {
  const palabras = nombre.trim().toLocaleUpperCase("es").split(/\s+/).filter(Boolean);
  if (palabras.length <= 1) return palabras;
  let corte = 1;
  let masLargo = Infinity;
  for (let i = 1; i < palabras.length; i++) {
    if (PARTICULAS.has(palabras[i - 1])) continue; // «MARÍA / DEL CARMEN», nunca «MARÍA DEL / CARMEN»
    const largo = Math.max(palabras.slice(0, i).join(" ").length, palabras.slice(i).join(" ").length);
    if (largo < masLargo) [corte, masLargo] = [i, largo];
  }
  return [palabras.slice(0, corte).join(" "), palabras.slice(corte).join(" ")];
}

/**
 * El tamaño del nombre en la tapa, en cqw: la misma cuenta que `cuerpoNombreTapa` de la fábrica, que usan
 * la tapa impresa y el libro online (01/11: la vista previa copia la impresa). 11,4 % del ancho, salvo que el
 * renglón más largo no entre en el 84 %: ahí se achica. Una palabra nunca se corta. Ancho aproximado de la
 * Source Serif: 0,72 em una mayúscula, 0,5 em el resto.
 */
export function tamanoNombreTapa(texto: string): number {
  const ancho = (renglon: string) => [...renglon].reduce((a, c) => a + (c !== c.toLowerCase() ? 0.72 : 0.5), 0);
  const mayor = Math.max(0, ...renglonesNombreTapa(texto).map(ancho));
  return mayor > 0 ? Math.min(11.4, Math.floor(((84 * 0.95) / mayor) * 10) / 10) : 11.4;
}

/** Como `idiomaDelLibro` de la fábrica: entrevista en catalán → libro en catalán; si no, castellano. */
export const idiomaDelLibro = (idiomaEntrevista: string | null | undefined): IdiomaLibro => (idiomaEntrevista === "ca" ? "ca" : "es");
