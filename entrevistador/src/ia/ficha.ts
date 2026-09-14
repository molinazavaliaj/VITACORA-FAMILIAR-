/**
 * La ficha del narrador, en texto, con los roles de cada persona.
 *
 * Existe por un error concreto: al personalizar una pregunta con el árbol
 * familiar como lista suelta de nombres ("Ramón y Haydée; Élida; los chicos"),
 * el modelo preguntó "¿cómo conoció a Haydée?" como si fuera el amor de su vida
 * — Haydée es su madre. Con el rol delante ("Sus padres: Ramón y Haydée. Su
 * esposa: Élida") el mismo modelo acierta.
 *
 * Quien lea la ficha tiene que poder saber QUIÉN ES QUIÉN sin adivinar.
 */

/** Los roles del árbol, en las palabras que usa el entrevistador. */
const ETIQUETA_ARBOL: Record<string, string> = {
  padres: 'Sus padres',
  hermanos: 'Sus hermanos',
  conyuge: 'Su esposa / el amor de su vida',
  hijos: 'Sus hijos',
};

/**
 * El árbol familiar en una sola línea, con cada rol nombrado.
 * Los roles que no conocemos se dejan con su clave original (mejor eso que
 * perder el dato). Los vacíos se saltean.
 */
export function arbolEtiquetado(contexto: Record<string, any> = {}): string {
  const arbol = contexto?.arbol ?? {};
  if (typeof arbol !== 'object' || arbol === null) return '';
  return Object.entries(arbol)
    .filter(([, gente]) => typeof gente === 'string' && gente.trim() !== '')
    .map(([rol, gente]) => `${ETIQUETA_ARBOL[rol] ?? rol}: ${(gente as string).trim().replace(/[,;.]+$/, '')}`)
    .join('. ');
}

/**
 * La ficha completa: quién es, quiénes son los suyos, dónde nació, qué hacía.
 * Es lo que la familia cargó al comprar (o lo que se completa a mano en los
 * pilotos) — nada que inventar acá.
 */
export function fichaEnTexto(contexto: Record<string, any> = {}, comoLeDicen = ''): string {
  const arbol = arbolEtiquetado(contexto);
  return [
    comoLeDicen ? `El narrador es ${comoLeDicen}.` : '',
    arbol ? `${arbol}.` : '',
    contexto?.lugarNacimiento ? `Nació en ${contexto.lugarNacimiento}.` : '',
    contexto?.oficio ? `Su oficio: ${contexto.oficio}.` : '',
    contexto?.anioNacimiento ? `Año de nacimiento: ${contexto.anioNacimiento}.` : '',
  ].filter(Boolean).join(' ');
}
