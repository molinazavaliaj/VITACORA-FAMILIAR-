// Quién le regala la entrevista al narrador, para nombrarlo en la bienvenida (Naza, 20/10: «una persona que te
// quiere mucho» le dio desconfianza a Amelia). Se arma con lo que escribió el comprador en la web: su nombre y su
// vínculo («Tu vínculo», texto libre: «hijo», «Hija», «su nieta»…). Con un vínculo de familia que se reconoce,
// «Tu hijo Naza» / «El teu fill Naza»; si no se reconoce, solo el nombre («Naza»). Sin nombre, null: la
// bienvenida sigue como antes.

import type { Idioma } from '../v3/nucleo/entrevista/idioma.js';

type Vinculo = { es: string; ca: string; femenino: boolean };

const V = (es: string, ca: string, femenino = false): Vinculo => ({ es, ca, femenino });

/** Lo que puede escribir el comprador (en castellano o en catalán, sin tildes) → cómo se dice en cada idioma. */
const VINCULOS: Record<string, Vinculo> = {};
for (const [palabras, v] of [
  [['hijo', 'fill'], V('hijo', 'fill')],
  [['hija', 'filla'], V('hija', 'filla', true)],
  [['nieto', 'net'], V('nieto', 'nét')],
  [['nieta', 'neta'], V('nieta', 'néta', true)],
  [['bisnieto', 'besnet'], V('bisnieto', 'besnét')],
  [['bisnieta', 'besneta'], V('bisnieta', 'besnéta', true)],
  [['sobrino', 'nebot'], V('sobrino', 'nebot')],
  [['sobrina', 'neboda'], V('sobrina', 'neboda', true)],
  [['hermano', 'germa'], V('hermano', 'germà')],
  [['hermana', 'germana'], V('hermana', 'germana', true)],
  [['primo', 'cosi'], V('primo', 'cosí')],
  [['prima', 'cosina'], V('prima', 'cosina', true)],
  [['esposo', 'marido', 'marit'], V('marido', 'marit')],
  [['esposa', 'dona'], V('esposa', 'dona', true)],
  [['pareja', 'parella'], V('pareja', 'parella', true)],
  [['novio', 'xicot'], V('novio', 'xicot')],
  [['novia', 'xicota'], V('novia', 'xicota', true)],
  [['amigo', 'amic'], V('amigo', 'amic')],
  [['amiga'], V('amiga', 'amiga', true)],
  [['nuera', 'jove'], V('nuera', 'jove', true)],
  [['yerno', 'gendre'], V('yerno', 'gendre')],
  [['ahijado', 'fillol'], V('ahijado', 'fillol')],
  [['ahijada', 'fillola'], V('ahijada', 'fillola', true)],
  [['cunado', 'cunyat'], V('cuñado', 'cunyat')],
  [['cunada', 'cunyada'], V('cuñada', 'cunyada', true)],
  [['tio', 'oncle'], V('tío', 'oncle')],
  [['tia'], V('tía', 'tia', true)],
] as const) {
  for (const p of palabras) VINCULOS[p] = v;
}

const sinTildes = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '');

/** «hijo», «Su hija», «la nieta» → el vínculo; cualquier otra cosa (dos palabras, «amiga de la familia»), null. */
export function vinculoConocido(texto: unknown): Vinculo | null {
  if (typeof texto !== 'string') return null;
  const limpio = sinTildes(texto.trim().toLowerCase()).replace(/^(su|tu|el|la|el seu|la seva|el teu|la teva)\s+/, '');
  return Object.hasOwn(VINCULOS, limpio) ? VINCULOS[limpio] : null;
}

/** «NAZA» o «naza» → «Naza»; un nombre ya escrito con mayúsculas y minúsculas («María José») se deja como está. */
export function nombrePropio(texto: unknown): string | null {
  if (typeof texto !== 'string') return null;
  const t = texto.trim().replace(/\s+/g, ' ');
  if (!t) return null;
  if (t !== t.toUpperCase() && t !== t.toLowerCase()) return t;
  return t.toLowerCase().replace(/(^|[\s'-])(\p{L})/gu, (_, a: string, b: string) => a + b.toUpperCase());
}

/** «Tu hijo Naza», «El teu fill Naza», «Naza», o null sin nombre. Va al principio de una oración. */
export function quienLoRegala(idioma: Idioma, nombre: unknown, vinculo: unknown): string | null {
  const n = nombrePropio(nombre);
  if (!n) return null;
  const v = vinculoConocido(vinculo);
  if (!v) return n;
  if (idioma === 'ca') return `${v.femenino ? 'La teva' : 'El teu'} ${v.ca} ${n}`;
  return `Tu ${v.es} ${n}`;
}
