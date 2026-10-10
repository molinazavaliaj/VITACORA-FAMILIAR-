// Un saludo solo ("Hola", "Bon dia", "Buenas tardes!") no es una respuesta (Naza, 09/10: a Imma un «Hola»
// le cerró la pregunta 1 y el bot le contestó «Gràcies, ja ho tinc guardat»). Se mira el mensaje escrito
// ENTERO: si dice algo más que el saludo ("Hola, nací en Rosario"), es una respuesta y se suma como siempre.
// Ante la duda, NO es un saludo (se suma): perder lo que contó es peor que guardar un «hola» de más.
import type { Idioma } from './nucleo/entrevista/idioma.js';

const SALUDOS: Record<Idioma | 'comun', string[]> = {
  comun: ['hola', 'holaa', 'holi', 'holis', 'hey', 'ey', 'buenas', 'hello', 'hi', 'ola'],
  'es-AR': ['buen dia', 'buenos dias', 'buenas tardes', 'buenas noches', 'que tal', 'como estas', 'como andas', 'como va'],
  'es-ES': ['buenos dias', 'buenas tardes', 'buenas noches', 'que tal', 'como estas', 'que hay'],
  ca: ['bon dia', 'bona tarda', 'bona nit', 'bon vespre', 'que tal', 'com estas', 'com va', 'ei'],
};

/** Minúsculas, sin tildes, sin signos ni emojis, espacios simples. */
const limpio = (t: string): string =>
  t.toLowerCase().normalize('NFD').replace(/\p{M}/gu, '').replace(/[^a-z\s]/g, ' ').replace(/\s+/g, ' ').trim();

/** ¿El mensaje es solo un saludo (uno o dos seguidos, con o sin el nombre de quien escribe al bot)? */
export function esSaludo(texto: string, idioma: Idioma): boolean {
  // Un número es un dato ("Buenas, 1948", "Hola, 3"): nunca es un saludo.
  if (/\d/.test(texto)) return false;
  const t = limpio(texto);
  if (!t || t.split(' ').length > 6) return false;
  const lista = [...SALUDOS.comun, ...SALUDOS[idioma]].sort((a, b) => b.length - a.length);
  let resto = ` ${t} `;
  let alguno = false;
  for (const s of lista) {
    const conEspacios = ` ${s} `;
    while (resto.includes(conEspacios)) {
      resto = resto.replace(conEspacios, ' ');
      alguno = true;
    }
  }
  // Lo que queda, si queda algo, solo puede ser relleno de saludo ("y", "a todos", "vitacora").
  const relleno = new Set(['y', 'i', 'a', 'todos', 'tots', 'vitacora', 'bitacora']);
  return alguno && resto.trim().split(' ').filter(Boolean).every((p) => relleno.has(p));
}
