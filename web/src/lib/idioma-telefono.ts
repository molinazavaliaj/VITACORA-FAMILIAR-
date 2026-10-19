import type { IdiomaRegalo } from "./regalo-textos";

// «¿Cómo le hablamos?» arranca según el número del narrador (PASO-DE-MANOS C16,
// TEXTOS-Y-REGLAS §1): un +54 o un +598 es de vos; un +34, de tú. Es solo el
// valor inicial: quien compra lo puede cambiar, y el catalán sigue siendo una
// opción. Un número sin prefijo (formato local) no dice nada: queda lo que
// estaba, que es lo de la versión de la web desde donde compra.

/** El idioma de la entrevista que sugiere el prefijo del número; null si no se sabe. */
export function idiomaDePrefijo(telefono: string): IdiomaRegalo | null {
  const limpio = telefono.trim().replace(/[\s().-]/g, "");
  const internacional = limpio.startsWith("00") ? `+${limpio.slice(2)}` : limpio;
  if (!internacional.startsWith("+")) return null;
  if (internacional.startsWith("+54") || internacional.startsWith("+598")) return "es-AR";
  if (internacional.startsWith("+34")) return "es-ES";
  return null;
}

/**
 * El idioma que corresponde al número, partiendo del de la versión de la web
 * (`porDefecto`). Lo usa el checkout mientras la persona no eligió a mano.
 * Desde la versión en catalán, un número de España deja el catalán: también es
 * de España, y la web lo eligió por algo. Sin prefijo, vuelve al de la web.
 */
export function idiomaTrasElNumero(porDefecto: IdiomaRegalo, telefono: string): IdiomaRegalo {
  const sugerido = idiomaDePrefijo(telefono);
  if (!sugerido) return porDefecto;
  if (sugerido === "es-ES" && porDefecto === "ca") return "ca";
  return sugerido;
}
