// "Algo preocupante" en el momento (paso-4-huecos-decisiones.md, Naza 05/10):
// una lista de palabras en el código, sin modelo. Si salta, ese día solo un
// acuse sobrio (los del día feo), sin foto ni "seguir", y marca a Naza. Nada
// automático hacia los padres. Al final el escritor marca igual.
//
// BORRADOR: LA LISTA ES UN PUNTO DE PARTIDA, todavía NO aprobada. La aprueban
// Naza y el abogado (decisiones 16 y 17). Se dejó afuera "me toca" (en chicos
// es "me toca a mí"). Se compara sin mayúsculas ni tildes y por palabras
// enteras ("me pegó" = "me pego"; "me pegué" no salta).

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

export function normalizar(s: string): string {
  const t = s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
  return ` ${t} `;
}

const FRASES = FRASES_PREOCUPANTES.map(normalizar);
/** Por palabras enteras (también dos seguidas: "me corto el pelo me corto el pelo"). Normalizadas solo quedan letras, números y espacios. */
const EXCLUIDAS = FRASES_EXCLUIDAS.map((x) => new RegExp(`(?<= )${normalizar(x).trim()}(?= )`, 'g'));

/** La primera frase de la lista que aparece en el texto (sin las excluidas), o null. */
export function fraseQueSalta(texto: string): string | null {
  // Cada exclusión se cambia por un espacio: las palabras de alrededor siguen enteras.
  const t = EXCLUIDAS.reduce((acc, x) => acc.replace(x, ' '), normalizar(texto));
  const i = FRASES.findIndex((f) => t.includes(f));
  return i < 0 ? null : FRASES_PREOCUPANTES[i];
}
