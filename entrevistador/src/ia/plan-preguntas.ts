import type { Perfil } from './perfil.js';

// Los tramos de una vida y las edades (esqueleto v2, 24/09). Antes acá vivía el reparto de
// preguntas variables por peso de bisagras: cada bisagra valía cinco años de vida y el período del
// que más hablaba la persona se llevaba más preguntas (análisis del piloto, A.2). Ahora el guion
// decide qué se pregunta (`guion-v2.ts`); acá queda la tabla que comparten el guion, la secuencia,
// el control de lugar y la fábrica (que la copia a mano en `fabrica/scripts/contexto-v2.ts`).

export type Tramo = 'infancia' | 'juventud' | 'adulto joven' | 'adultez media' | 'segunda mitad' | 'hoy';

/** El rango de edad de cada tramo (0-200 para "hoy": no es una edad, es el presente). */
export const RANGO_TRAMO: Record<Tramo, [number, number]> = {
  infancia: [0, 12],
  juventud: [13, 22],
  'adulto joven': [23, 35],
  'adultez media': [36, 55],
  'segunda mitad': [56, 200],
  hoy: [0, 200],
};

/** Una pregunta libre: algo que nombró y no contó, de un tramo. `anclas` es lo que nombró (de `noSabemos`). */
export type Variable = { tramo: Tramo; desde: number; hasta: number; anclas: string[] };

/** La edad del perfil: la dicha, el medio de un rango, o la que sale del año de nacimiento. */
export function edadDe(perfil: Perfil, anioActual: number): number | null {
  const numeros = (texto: string) => (texto.match(/\d+/g) ?? []).map(Number);
  const edad = perfil.persona.edad?.valor;
  if (edad) {
    const n = numeros(String(edad)).filter((x) => x < 130);
    if (n.length >= 2) return Math.round((n[0] + n[1]) / 2);
    if (n.length === 1) return n[0];
  }
  const anio = perfil.persona.anioNacimiento?.valor;
  if (anio) {
    const n = numeros(String(anio)).find((x) => x > 1900 && x <= anioActual);
    if (n) return anioActual - n;
  }
  return null;
}

/** "7 a 17", "desde los 12", "68-hoy", "hasta los 10" → [desde, hasta]; si no dice edades, null. */
export function rangoDeEtapa(edades: string, edadActual: number): [number, number] | null {
  const texto = edades.toLowerCase();
  const n = (texto.match(/\d+/g) ?? []).map(Number);
  if (n.length === 0) return null;
  if (n.length >= 2) return [n[0], n[1]];
  if (/hasta/.test(texto)) return [0, n[0]];
  return [n[0], edadActual];
}
