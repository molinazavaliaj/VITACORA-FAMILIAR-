import type { Perfil } from './perfil.js';

// El reparto de preguntas por etapas (biógrafo v2, problema 3 — EXPERIMENTO, todavía no lo usa
// el flujo).
//
// Hoy las 26 fijas le dan 12 preguntas a los primeros 22 años y ninguna propia a los 35-75: a
// una persona de 75 no se le pregunta por la mitad de su vida. Decidido por Naza y Joaquín
// (23/09): un núcleo fijo que se pregunta siempre, y las preguntas variables repartidas según la
// vida de ESTA persona, que sale del perfil (edad, etapas, bisagras).
//
// Es una cuenta, sin modelo: cada tramo pesa lo que duró (en años) más un extra por cada
// bisagra que cayó ahí; se le descuentan las del núcleo que ya apuntan a ese tramo; y las
// variables van donde falta. El modelo escribe después la pregunta, con las anclas del tramo
// (dónde vivía, qué hacía, qué le pasó) para que suene a que lo escuchamos.

export type Tramo = 'infancia' | 'juventud' | 'adulto joven' | 'adultez media' | 'segunda mitad' | 'hoy';

/** Los tramos de una vida, por edad. "hoy" no es un rango: es el presente, y pesa fijo. */
const TRAMOS: { tramo: Exclude<Tramo, 'hoy'>; desde: number; hasta: number }[] = [
  { tramo: 'infancia', desde: 0, hasta: 12 },
  { tramo: 'juventud', desde: 13, hasta: 22 },
  { tramo: 'adulto joven', desde: 23, hasta: 35 },
  { tramo: 'adultez media', desde: 36, hasta: 55 },
  { tramo: 'segunda mitad', desde: 56, hasta: 200 },
];
/** Cuánto pesa el presente, en "años equivalentes": cómo es su vida hoy siempre se pregunta. */
const PESO_HOY = 5;
/** Una bisagra (algo que partió su vida en un antes y un después) pesa como cinco años. */
const PESO_BISAGRA = 5;

export type Variable = { tramo: Tramo; desde: number; hasta: number; anclas: string[] };
export type Plan = { ok: true; variables: Variable[] } | { ok: false; falta: 'edad' };

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

/** "A los 60 murió Rubén" → 60. Sin "a los N", la bisagra no se puede ubicar y no suma a ningún tramo. */
function edadDeBisagra(bisagra: string): number | null {
  const m = /a los (\d+)/i.exec(bisagra);
  return m ? Number(m[1]) : null;
}

/**
 * Reparte `cuantas` preguntas variables entre los tramos que esta persona vivió. `nucleo` son
 * las preguntas que se hacen siempre, con el tramo al que apunta cada una (las que no apuntan a
 * un tramo —el amor, las pruebas— no se cuentan: pueden caer en cualquiera).
 */
export function planificar(
  perfil: Perfil,
  nucleo: { tramo: Tramo | null }[],
  cuantas: number,
  anioActual = new Date().getFullYear(),
): Plan {
  const edad = edadDe(perfil, anioActual);
  if (edad === null) return { ok: false, falta: 'edad' };

  const vividos = TRAMOS
    .filter((t) => t.desde <= edad)
    .map((t) => ({ ...t, hasta: Math.min(t.hasta, edad) }));
  const tramos: { tramo: Tramo; desde: number; hasta: number; peso: number; anclas: string[] }[] = [
    ...vividos.map((t) => ({ ...t, peso: t.hasta - t.desde + 1, anclas: [] as string[] })),
    { tramo: 'hoy' as const, desde: edad, hasta: edad, peso: PESO_HOY, anclas: [] as string[] },
  ];
  const tramoDeEdad = (e: number) => vividos.find((t) => e >= t.desde && e <= t.hasta)?.tramo;

  for (const b of perfil.bisagras) {
    const e = edadDeBisagra(b);
    const t = e === null ? undefined : tramos.find((x) => x.tramo === tramoDeEdad(e));
    if (t) { t.peso += PESO_BISAGRA; t.anclas.push(b); }
  }
  for (const et of perfil.etapas) {
    const r = rangoDeEtapa(et.edades, edad);
    if (!r) continue;
    const ancla = [et.lugar, et.queHacia].filter(Boolean).join(' — ') + ` (${et.edades})`;
    for (const t of tramos) if (t.tramo !== 'hoy' && r[0] <= t.hasta && r[1] >= t.desde) t.anclas.push(ancla);
  }

  // Cuántas le tocarían a cada tramo por su peso, menos las que el núcleo ya le da.
  const total = cuantas + nucleo.filter((q) => q.tramo && tramos.some((t) => t.tramo === q.tramo)).length;
  const pesoTotal = tramos.reduce((s, t) => s + t.peso, 0);
  const falta = tramos.map((t) => Math.max(0, (total * t.peso) / pesoTotal - nucleo.filter((q) => q.tramo === t.tramo).length));
  const base = falta.some((f) => f > 0) ? falta : tramos.map((t) => t.peso);
  const suma = base.reduce((s, x) => s + x, 0);

  // Mayor resto: los enteros primero, y lo que sobra a los que quedaron más cerca del siguiente.
  const ideal = base.map((x) => (cuantas * x) / suma);
  const asignadas = ideal.map(Math.floor);
  const restos = ideal.map((x, i) => ({ i, resto: x - asignadas[i] })).sort((a, b) => b.resto - a.resto);
  for (let k = 0; asignadas.reduce((s, x) => s + x, 0) < cuantas; k++) asignadas[restos[k % restos.length].i]++;

  const variables = tramos.flatMap((t, i) =>
    Array.from({ length: asignadas[i] }, () => ({ tramo: t.tramo, desde: t.desde, hasta: t.hasta, anclas: t.anclas })));
  return { ok: true, variables };
}
