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
 * El estado civil, en las palabras del biógrafo. Lo carga la familia en el
 * alta (21/09, `contexto.estadoCivil`, lista cerrada de la web) o Naza con
 * `ficha --estado-civil`. Sin eso el modelo supone la boda del guion.
 */
const ESTADO_CIVIL: Record<string, string> = {
  soltero: 'Es soltero: nunca se casó.',
  en_pareja: 'Está en pareja (sin casarse).',
  casado: 'Está casado.',
  separado: 'Está separado o divorciado.',
  viudo: 'Es viudo: su pareja ya no vive.',
};

export function estadoCivilEnTexto(contexto: Record<string, any> = {}): string {
  const valor = typeof contexto?.estadoCivil === 'string' ? contexto.estadoCivil.trim() : '';
  return ESTADO_CIVIL[valor] ?? '';
}

/**
 * La ficha completa: quién es, quiénes son los suyos, dónde nació, qué hacía.
 * Es lo que la familia cargó al comprar (o lo que se completa a mano en los
 * pilotos) — nada que inventar acá.
 */
/**
 * Los temas que eligió quien compró (22/09), en las mismas palabras que vio en
 * la pantalla. Espejo de `web/src/lib/temas.ts`: si cambia allá, cambia acá.
 */
const NOMBRE_TEMA: Record<string, string> = {
  familia: 'su familia',
  oficio: 'su trabajo y lo que construyó',
  origen: 'de dónde vino su familia',
  fe: 'su fe y sus creencias',
  viajes: 'los viajes y los lugares',
  musica: 'la música y las fiestas',
  dificiles: 'los años difíciles',
  amor: 'el amor y la pareja',
};

function temasEnTexto(contexto: Record<string, any> = {}): string {
  const elegidos = Array.isArray(contexto?.temas)
    ? (contexto.temas as unknown[]).filter((t): t is string => typeof t === 'string' && t in NOMBRE_TEMA).map((t) => NOMBRE_TEMA[t])
    : [];
  if (elegidos.length === 0) return '';
  const lista = elegidos.length === 1 ? elegidos[0] : `${elegidos.slice(0, -1).join(', ')} y ${elegidos[elegidos.length - 1]}`;
  return `Le interesa hablar de ${lista}.`;
}

export function fichaEnTexto(contexto: Record<string, any> = {}, comoLeDicen = ''): string {
  const arbol = arbolEtiquetado(contexto);
  return [
    comoLeDicen ? `El narrador es ${comoLeDicen}.` : '',
    arbol ? `${arbol}.` : '',
    estadoCivilEnTexto(contexto),
    contexto?.lugarNacimiento ? `Nació en ${contexto.lugarNacimiento}.` : '',
    // Dónde vive hoy (la compra lo pregunta desde el 21/09, 3t.22): época y forma de hablar.
    typeof contexto?.dondeVive === 'string' && contexto.dondeVive.trim() ? `Vive en ${contexto.dondeVive.trim()}.` : '',
    contexto?.oficio ? `Su oficio: ${contexto.oficio}.` : '',
    contexto?.anioNacimiento ? `Año de nacimiento: ${contexto.anioNacimiento}.` : '',
    // 22/09: hacia dónde llevar las preguntas, y lo que la familia pidió que no falte.
    temasEnTexto(contexto),
    typeof contexto?.imprescindible === 'string' && contexto.imprescindible.trim() ? `No puede faltar: ${contexto.imprescindible.trim()}.` : '',
  ].filter(Boolean).join(' ');
}
