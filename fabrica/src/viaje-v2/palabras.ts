// Las palabras que entiende el sistema, por idioma: el SÍ (BIEN-1 y el sí a
// AL2), "paso", "listo" (cierra el álbum) y el "no" a AL2.
//
// Las reglas son las mismas para todos los idiomas:
//   · Sin mayúsculas, sin tildes, sin signos alrededor ("¡Ja està!" = "ja esta";
//     el apóstrofo tipográfico ’ vale como ').
//   · Vale el mensaje que ES la palabra ("paso"), o que empieza con ella y
//     sigue con poco ("listo, son esas"): hasta MAX_COLA palabras más. Una
//     frase larga que empieza igual ("paso por la plaza todos los días…") no
//     es una palabra del sistema.
//   · Si dos frases calzan, gana la más larga ("todavía no" es "no", no nada).
//
// En catalán se entienden también las de castellano: quien habla catalán mezcla.

import { IDIOMA_POR_DEFECTO, type Idioma } from './idioma.js';

export type Entendido = 'si' | 'paso' | 'listo' | 'no';

export type Palabras = Readonly<Record<Entendido, readonly string[]>>;

/** Cuántas palabras más puede traer el mensaje después de la frase. */
export const MAX_COLA = 3;

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

const unir = (a: Palabras, b: Palabras): Palabras => ({
  si: [...new Set([...a.si, ...b.si])],
  paso: [...new Set([...a.paso, ...b.paso])],
  listo: [...new Set([...a.listo, ...b.listo])],
  no: [...new Set([...a.no, ...b.no])],
});

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

/** Minúsculas, sin tildes (la ç y la l·l quedan), ’ → ', sin signos alrededor ni espacios de más. */
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

/** Qué quiso decir con un mensaje de texto, o null si no es una palabra del sistema. */
export function entender(texto: string, idioma: Idioma = IDIOMA_POR_DEFECTO): Entendido | null {
  const t = normalizar(texto);
  if (!t) return null;
  let mejor: { que: Entendido; largo: number } | null = null;
  for (const [que, frases] of Object.entries(PALABRAS[idioma]) as [Entendido, readonly string[]][]) {
    for (const frase of frases) {
      const f = normalizar(frase);
      const calza = t === f || (t.startsWith(`${f} `) && t.slice(f.length + 1).split(' ').length <= MAX_COLA);
      if (calza && (!mejor || f.length > mejor.largo)) mejor = { que, largo: f.length };
    }
  }
  return mejor?.que ?? null;
}
