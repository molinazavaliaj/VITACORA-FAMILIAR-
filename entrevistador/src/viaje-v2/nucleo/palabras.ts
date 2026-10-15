// Las palabras que entiende el sistema, por idioma: el SÍ (BIEN-1 y el sí a
// AL2), "paso", "listo" (cierra el álbum) y el "no" a AL2.
//
// Las reglas son las mismas para todos los idiomas:
//   · Sin mayúsculas, sin tildes, sin signos alrededor ("¡Ja està!" = "ja esta";
//     el apóstrofo tipográfico ’ vale como ').
//   · Vale el mensaje que ES la palabra ("paso"), o la palabra seguida SOLO de
//     colas cortas de la lista de su idioma ("paso, gracias", "listo, son
//     esas", "passo, avui no"). Cualquier otra cosa después es relato y no
//     dispara nada: las respuestas llegan transcriptas de audios, y "Paso por
//     Roma mañana…" es un relato, no un "paso" (revisor, 05/10).
//   · Si dos frases calzan, gana la más larga ("todavía no" es "no", no nada).
//
// En catalán se entienden también las de castellano: quien habla catalán mezcla.

import { IDIOMA_POR_DEFECTO, type Idioma } from './idioma.js';

export type Entendido = 'si' | 'paso' | 'listo' | 'no';

export type Palabras = Readonly<Record<Entendido, readonly string[]>>;

const unir = (a: Palabras, b: Palabras): Palabras => ({
  si: [...new Set([...a.si, ...b.si])],
  paso: [...new Set([...a.paso, ...b.paso])],
  listo: [...new Set([...a.listo, ...b.listo])],
  no: [...new Set([...a.no, ...b.no])],
});

const ES_AR: Palabras = {
  si: ['sí', 'si', 'dale', 'ok', 'okey', 'vale', 'de una'],
  paso: ['paso'],
  listo: ['listo', 'ya está'],
  no: ['no', 'todavía no', 'me faltan'],
};

const ES_ES: Palabras = {
  si: ['sí', 'si', 'vale', 'venga', 'ok', 'okey', 'dale'],
  paso: ['paso', 'paso de esta', 'me la salto', 'siguiente'],
  listo: ['ya está', 'listo', 'hecho', 'terminado', 'eso es todo'],
  no: ['no', 'todavía no', 'aún no', 'me faltan'],
};

const CA: Palabras = unir(
  {
    si: ['sí', 'si', "d'acord", 'vale', 'ok', 'endavant', 'som-hi'],
    paso: ['passo', 'la següent', 'aquesta no'],
    listo: ['ja està', 'fet', 'ja les tens', 'ja hi són'],
    no: ['no', 'encara no', "me'n falten", 'en falten'],
  },
  ES_ES,
);

export const PALABRAS: Readonly<Record<Idioma, Palabras>> = { 'es-AR': ES_AR, 'es-ES': ES_ES, ca: CA };

/**
 * Lo único que puede venir después de la palabra (una o varias de estas,
 * seguidas: "paso, hoy no, perdón"). Lo demás es relato.
 */
const COLAS_ES_AR: Palabras = {
  paso: ['esta', 'esa', 'hoy', 'hoy no', 'por hoy', 'gracias', 'no', 'no quiero', 'no tengo ganas', 'perdón', 'de esta', 'esta vez'],
  si: ['gracias', 'claro', 'dale', 'vamos', 'arrancamos', 'están todas', 'ya están', 'son todas', 'todas', 'ya'],
  listo: ['son esas', 'son estas', 'son todas', 'ya están', 'están todas', 'gracias', 'eso es todo', 'nada más', 'ya'],
  no: ['me faltan', 'faltan', 'me falta', 'todavía', 'todavía no', 'aún', 'esperá', 'espera', 'gracias'],
};

const COLAS_ES_ES: Palabras = {
  paso: ['esta', 'esa', 'hoy', 'hoy no', 'por hoy', 'gracias', 'no', 'no quiero', 'no me apetece', 'perdón', 'lo siento', 'de esta', 'esta no', 'esta vez'],
  si: ['gracias', 'claro', 'venga', 'vale', 'están todas', 'ya están', 'ya están todas', 'son todas', 'todas', 'ya'],
  listo: ['son esas', 'son estas', 'son todas', 'ya están', 'están todas', 'gracias', 'eso es todo', 'nada más', 'ya'],
  no: ['me faltan', 'faltan', 'me falta', 'todavía', 'todavía no', 'aún', 'aún no', 'espera', 'gracias'],
};

const COLAS_CA: Palabras = unir(
  {
    paso: ['aquesta', 'avui', 'avui no', 'per avui', 'gràcies', 'no', 'no vull', 'no em ve de gust', 'perdona', 'ho sento', 'aquesta no'],
    si: ['gràcies', 'és clar', 'clar', 'som-hi', "d'acord", 'ja hi són', 'hi són totes', 'ja hi són totes', 'són totes', 'totes'],
    listo: ['són aquestes', 'són totes', 'ja hi són', 'hi són totes', 'gràcies', 'res més', 'això és tot'],
    no: ["me'n falten", 'en falten', "me'n falta", 'encara', 'encara no', 'espera', 'gràcies'],
  },
  COLAS_ES_ES,
);

export const COLAS: Readonly<Record<Idioma, Palabras>> = { 'es-AR': COLAS_ES_AR, 'es-ES': COLAS_ES_ES, ca: COLAS_CA };

/** Minúsculas, sin tildes ni cedilla (ç → c, como en las frases, que pasan por lo mismo), ’ → ', sin signos ni espacios de más. La l·l queda. */
export function normalizar(texto: string): string {
  return texto
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .normalize('NFC')
    .toLowerCase()
    .replace(/[’`´]/g, "'")
    .replace(/[^\p{L}\p{N}'·\s-]+/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/** ¿`resto` (ya normalizado) es una o varias colas permitidas, una detrás de otra? */
function soloColas(resto: string, colas: readonly string[]): boolean {
  if (resto === '') return true;
  return colas.some((c) => {
    const n = normalizar(c);
    return resto === n || (resto.startsWith(`${n} `) && soloColas(resto.slice(n.length + 1), colas));
  });
}

/** Qué quiso decir con un mensaje de texto, o null si no es una palabra del sistema. */
export function entender(texto: string, idioma: Idioma = IDIOMA_POR_DEFECTO): Entendido | null {
  const t = normalizar(texto);
  if (!t) return null;
  let mejor: { que: Entendido; largo: number } | null = null;
  for (const [que, frases] of Object.entries(PALABRAS[idioma]) as [Entendido, readonly string[]][]) {
    for (const frase of frases) {
      const f = normalizar(frase);
      const calza = t === f || (t.startsWith(`${f} `) && soloColas(t.slice(f.length + 1), COLAS[idioma][que]));
      if (calza && (!mejor || f.length > mejor.largo)) mejor = { que, largo: f.length };
    }
  }
  return mejor?.que ?? null;
}
