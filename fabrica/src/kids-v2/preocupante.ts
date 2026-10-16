// "Algo preocupante" en el momento (paso-4-huecos-decisiones.md, Naza 05/10):
// una lista de palabras en el código, sin modelo. Si salta, ese día solo un
// acuse sobrio (los del día feo), sin foto ni "seguir", y marca a Naza. Nada
// automático hacia los padres. Al final el escritor marca igual.
//
// BORRADOR: LA LISTA ES UN PUNTO DE PARTIDA, todavía NO aprobada. La aprueban
// Naza y el abogado (decisiones 16 y 17). Se dejó afuera "me toca" (en chicos
// es "me toca a mí"). Se compara sin mayúsculas ni tildes y por palabras
// enteras ("me pegó" = "me pego"; "me pegué" no salta).
//
// En catalán (ca) se busca en las dos listas, la catalana y la castellana: quien
// habla catalán mezcla (como el detector de la V3 del Familiar).

import { IDIOMA_POR_DEFECTO, type IdiomaKids } from './idioma.js';

export const FRASES_PREOCUPANTES: readonly string[] = [
  'me pega', 'me pegan', 'me pegó', 'me pegaron', 'me pegaba', 'me pegaban',
  'me lastima', 'me lastiman', 'me lastimó', 'me lastimaron',
  'me manosea', 'me manosean', 'me toca ahí', 'me tocó ahí',
  'abuso', 'abusaron',
  'me amenaza', 'me amenazan', 'me amenazaron',
  'me encierra', 'me encierran',
  'me quiero morir', 'quiero morirme', 'no quiero vivir', 'me quiero matar', 'matarme',
  'suicidarme', 'suicidio', 'me corto', 'cortarme',
  'tengo miedo de volver a casa', 'no quiero volver a mi casa',
  'nadie me quiere',
];

// BORRADOR (igual que la lista de arriba, para Naza y el abogado): frases que
// contienen una de la lista pero no preocupan. Se borran del texto normalizado
// antes de buscar: "me corto el pelo" no salta, "me corto" solo sí.
export const FRASES_EXCLUIDAS: readonly string[] = [
  'me corto el pelo', 'me corto las uñas', 'me corto el flequillo',
  'matar de la risa', 'me muero de risa',
  'abuso de confianza',
];

// BORRADOR EN CATALÁN (16/10), igual que el castellano: para Naza y el abogado, y para la lectura de alguien de
// Catalunya. Escrito a partir de la lista castellana, no traducido palabra por palabra. Quedaron afuera, a
// propósito: «em fa mal» (es «me duele la panza»), «em toca» (es «me toca a mí») y «em tanca» a secas («em tanca
// la porta»). Al normalizar, el apóstrofo y el guion son un espacio: «m'amenaça» es «m amenaca», «matar-me» es
// «matar me».
export const FRASES_PREOCUPANTES_CA: readonly string[] = [
  'em pega', 'em peguen', 'em va pegar', 'em van pegar', 'em pegava', 'em pegaven', "m'ha pegat", "m'han pegat",
  'em maltracta', 'em maltracten', "m'ha fet mal expres", 'em fa mal expres',
  'em grapeja', 'em grapegen', 'em magreja', 'em magregen', 'em toca allà', 'em va tocar allà', 'em van tocar allà', 'em toquen allà',
  'abús', 'abusos', 'van abusar', 'ha abusat', 'han abusat', 'abusa de mi', 'abusen de mi',
  "m'amenaça", "m'amenacen", "em va amenaçar", "em van amenaçar", "m'han amenaçat",
  'em tanca a', 'em tanquen a', 'em deixen tancat', 'em deixen tancada',
  'em vull morir', 'vull morir-me', 'no vull viure', 'em vull matar', 'matar-me', 'suïcidar-me', 'suïcidi',
  'em tallo', 'tallar-me', 'em faig mal a mi mateix', 'em faig mal a mi mateixa', 'em faig mal expres',
  'tinc por de tornar a casa', 'no vull tornar a casa', 'no vull tornar a casa meva',
  "ningú m'estima", "ningú no m'estima",
];

// BORRADOR EN CATALÁN (como FRASES_EXCLUIDAS): lo que un chico dice sin que preocupe y contiene una de la lista.
export const FRASES_EXCLUIDAS_CA: readonly string[] = [
  'em tallo els cabells', 'em tallo el cabell', 'em tallo les ungles', 'em tallo el serrell', 'em tallo les puntes',
  'tallar-me els cabells', 'tallar-me el cabell', 'tallar-me les ungles', 'tallar-me el serrell',
  'morir de riure', 'em moro de riure', 'matar de riure', 'matar-me de riure',
  'abús de confiança',
];

export function normalizar(s: string): string {
  const t = s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
  return ` ${t} `;
}

/** Por palabras enteras (también dos seguidas: "me corto el pelo me corto el pelo"). Normalizadas solo quedan letras, números y espacios. */
const exclusion = (x: string) => new RegExp(`(?<= )${normalizar(x).trim()}(?= )`, 'g');

type Lista = { frases: readonly string[]; normalizadas: readonly string[]; excluidas: readonly RegExp[] };
const lista = (frases: readonly string[], excluidas: readonly string[]): Lista => ({ frases, normalizadas: frases.map(normalizar), excluidas: excluidas.map(exclusion) });

const CASTELLANO = lista(FRASES_PREOCUPANTES, FRASES_EXCLUIDAS);
/** En catalán, primero la catalana y después la castellana (la frase que salta es la del idioma en que lo dijo). */
const LISTAS: Readonly<Record<IdiomaKids, Lista>> = {
  'es-AR': CASTELLANO,
  'es-ES': CASTELLANO,
  ca: lista([...FRASES_PREOCUPANTES_CA, ...FRASES_PREOCUPANTES], [...FRASES_EXCLUIDAS_CA, ...FRASES_EXCLUIDAS]),
};

/** La primera frase de la lista del idioma que aparece en el texto (sin las excluidas), o null. */
export function fraseQueSalta(texto: string, idioma: IdiomaKids = IDIOMA_POR_DEFECTO): string | null {
  const l = LISTAS[idioma];
  // Cada exclusión se cambia por un espacio: las palabras de alrededor siguen enteras.
  const t = l.excluidas.reduce((acc, x) => acc.replace(x, ' '), normalizar(texto));
  const i = l.normalizadas.findIndex((f) => t.includes(f));
  return i < 0 ? null : l.frases[i];
}
