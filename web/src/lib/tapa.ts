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
    lema: "Para las vidas que merecen su propio libro",
  },
  ca: {
    contra: (n) => `Aquestes pàgines guarden la vida ${deCatalan(n)}, explicada amb les seves pròpies paraules: les seves millors històries, tal com les va viure. En aquest QR, les seves millors frases.`,
    escucha: () => "Escolta la seva veu",
    lema: "Per a les vides que mereixen el seu propi llibre",
  },
};

/** «de» en catalán se apostrofa ante vocal o hache: «d’Imma», «de Joan». */
export function deCatalan(nombre: string): string {
  return /^[aeiouàáèéíïòóúüh]/i.test(nombre.trim()) ? `d’${nombre}` : `de ${nombre}`;
}

/** «Imma Colell» → «I · C», el monograma de la contratapa. */
export function inicialesContratapa(nombre: string): string {
  const p = nombre.trim().split(/\s+/).filter(Boolean);
  if (p.length === 0) return "";
  if (p.length === 1) return p[0].charAt(0).toUpperCase();
  return `${p[0].charAt(0).toUpperCase()} · ${p[p.length - 1].charAt(0).toUpperCase()}`;
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
 * El tamaño del nombre en la tapa, en cqw (13/10): la misma cuenta que
 * `tamanoNombreTapa` de la fábrica (48px de 559, salvo que el renglón más largo
 * no entre en 465px). Una palabra nunca se corta.
 */
export function tamanoNombreTapa(texto: string): number {
  const ancho = (renglon: string) => [...renglon].reduce((acc, c) => acc + (c !== c.toLowerCase() ? 0.74 : 0.52), 0);
  const mayor = Math.max(0, ...renglonesNombreTapa(texto).map(ancho));
  const px = mayor > 0 ? Math.min(48, Math.floor((465 * 0.97) / mayor)) : 48;
  return Math.round((px / 559) * 1000) / 10;
}

/** Como `idiomaDelLibro` de la fábrica: entrevista en catalán → libro en catalán; si no, castellano. */
export const idiomaDelLibro = (idiomaEntrevista: string | null | undefined): IdiomaLibro => (idiomaEntrevista === "ca" ? "ca" : "es");
