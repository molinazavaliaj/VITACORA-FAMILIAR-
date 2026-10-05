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

/** La primera frase de la lista que aparece en el texto, o null. */
export function fraseQueSalta(texto: string): string | null {
  const t = normalizar(texto);
  const i = FRASES.findIndex((f) => t.includes(f));
  return i < 0 ? null : FRASES_PREOCUPANTES[i];
}
