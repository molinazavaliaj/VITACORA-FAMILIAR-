// Índice por etapas (decisión de Naza con Fable, 26/09, tras la prueba del
// escritor v4: docs/v3/prueba-libro-v4.md). Reemplaza a los capítulos madre
// por tema: los capítulos van en el orden de la vida y se cortan en los
// cambios de vida (los de la ficha y los que la biblia fecha), nunca por un
// año solo. Topes en palabras escritas (piso 600, techo 2.500): bajo el piso se pega al vecino más
// chico; sobre el techo queda largo y se avisa (no hay dónde cortar). Una
// pareja o un oficio que junta 1.200 palabras va como capítulo propio,
// intercalado en el año en que empieza.

import { lista, valor, type FichaV3 } from './ficha.js';

// Fable proponía 800; con 800 el libro de Naza daba 4-5 capítulos y el que le gustó tenía ~700 palabras
// por capítulo: 600 le da 6 (prueba v5, 26/09). A confirmar con más narradores.
export const PISO_ETAPA = 600;
export const TECHO_ETAPA = 2500;
export const PISO_ROL = 1200;
/** Cortes universales de la escuela: empieza la secundaria, termina el colegio. */
export const EDADES_DE_CORTE = [13, 18] as const;

export type TipoCambio =
  | 'pareja' | 'separacion' | 'viudez' | 'hijo' | 'oficio' | 'jubilacion' | 'migracion'
  | 'mudanza' | 'escuela' | 'perdida' | 'otro';

export type Cambio = { anio: number; tipo: TipoCambio; que: string; fuente: 'ficha' | 'biblia' | 'edad' };

/** Una anécdota de la biblia con su año (calculado) y sus palabras escritas estimadas. `rol`: 'pareja:<nombre>' u 'oficio:<nombre>'. */
export type AnecdotaEtapa = { id: string; anio: number | null; palabras: number; rol?: string };

export type CapituloEtapa = {
  desde: number;
  /** null = hasta hoy. */
  hasta: number | null;
  anecdotas: string[];
  palabras: number;
  /** El cambio que abre el capítulo (null en el primero y en los de rol). */
  abre: Cambio | null;
  rol?: string;
};

export type Etapas = { capitulos: CapituloEtapa[]; sinAnio: string[]; avisos: string[] };

export type OpcionesEtapas = { anioNacimiento: number; anioActual: number; piso?: number; techo?: number; pisoRol?: number };

const PRIORIDAD: Record<Cambio['fuente'], number> = { ficha: 0, biblia: 1, edad: 2 };

/** Los cambios de vida que trae la ficha con año: pareja (inicio, fin), primer hijo, cada oficio, migración. */
export function cambiosDeFicha(ficha: FichaV3, anioActual: number): Cambio[] {
  const nac = ficha.anioNacimiento;
  const out: Cambio[] = [];
  for (const p of lista(ficha.parejas)) {
    if (p.anioInicio !== undefined) out.push({ anio: p.anioInicio, tipo: 'pareja', que: `empieza con ${p.nombre}`, fuente: 'ficha' });
    if (p.anioFin !== undefined && p.fin) out.push({ anio: p.anioFin, tipo: p.fin === 'fallecio' ? 'viudez' : 'separacion', que: `${p.fin === 'fallecio' ? 'muere' : 'se separa de'} ${p.nombre}`, fuente: 'ficha' });
  }
  const primerHijo = lista(ficha.hijos).filter((h) => h.anio !== undefined).sort((x, y) => x.anio! - y.anio!)[0];
  if (primerHijo) out.push({ anio: primerHijo.anio!, tipo: 'hijo', que: `nace ${primerHijo.nombre}`, fuente: 'ficha' });
  for (const o of lista(ficha.oficios)) if (o.desde !== undefined) out.push({ anio: o.desde, tipo: 'oficio', que: `empieza como ${o.nombre}`, fuente: 'ficha' });
  const m = valor(ficha.migracion);
  if (m) {
    const anio = m.anio ?? (m.edad !== undefined ? nac + m.edad : undefined);
    if (anio !== undefined) out.push({ anio, tipo: 'migracion', que: `se va a ${m.a}`, fuente: 'ficha' });
  }
  return out.filter((x) => x.anio > nac && x.anio <= anioActual).sort((x, y) => x.anio - y.anio);
}

/** Los cortes de la escuela (13 y 18 años) que ya pasaron. */
export function cambiosDeEdad(anioNacimiento: number, anioActual: number): Cambio[] {
  return EDADES_DE_CORTE.map((e) => ({ anio: anioNacimiento + e, tipo: 'escuela' as const, que: e === 13 ? 'empieza la secundaria' : 'termina el colegio', fuente: 'edad' as const }))
    .filter((x) => x.anio < anioActual);
}

type Tramo = { desde: number; hasta: number | null; abre: Cambio | null; anecdotas: AnecdotaEtapa[] };
const suma = (t: Tramo) => t.anecdotas.reduce((s, x) => s + x.palabras, 0);

export function armarEtapas(anecdotas: AnecdotaEtapa[], cambios: Cambio[], opciones: OpcionesEtapas): Etapas {
  const { anioNacimiento: nac, anioActual: hoy } = opciones;
  const piso = opciones.piso ?? PISO_ETAPA;
  const techo = opciones.techo ?? TECHO_ETAPA;
  const pisoRol = opciones.pisoRol ?? PISO_ROL;
  const avisos: string[] = [];
  const sinAnio = anecdotas.filter((x) => x.anio === null).map((x) => x.id);
  const conAnio = anecdotas.filter((x) => x.anio !== null);
  const orden = new Map(anecdotas.map((x, i) => [x.id, i]));
  const porAnio = (x: AnecdotaEtapa, y: AnecdotaEtapa) => x.anio! - y.anio! || orden.get(x.id)! - orden.get(y.id)!;
  if (sinAnio.length) avisos.push(`Sin año, no se ubican: ${sinAnio.join(', ')}.`);
  const fuera = conAnio.filter((x) => x.anio! < nac || x.anio! > hoy).map((x) => x.id);
  if (fuera.length) avisos.push(`Con año fuera de la vida (van al primer o al último capítulo): ${fuera.join(', ')}.`);

  // Capítulos de rol: una pareja u oficio con muchas palabras va aparte.
  const roles = new Map<string, AnecdotaEtapa[]>();
  for (const x of conAnio) if (x.rol) roles.set(x.rol, [...(roles.get(x.rol) ?? []), x]);
  const capRol: CapituloEtapa[] = [];
  const apartadas = new Set<string>();
  for (const [rol, xs] of roles) {
    const palabras = xs.reduce((s, x) => s + x.palabras, 0);
    if (palabras < pisoRol) continue;
    const ordenadas = [...xs].sort(porAnio);
    capRol.push({ desde: ordenadas[0].anio!, hasta: ordenadas[ordenadas.length - 1].anio!, anecdotas: ordenadas.map((x) => x.id), palabras, abre: null, rol });
    for (const x of xs) apartadas.add(x.id);
  }
  const resto = conAnio.filter((x) => !apartadas.has(x.id));

  // Un corte por año (gana la ficha), dentro de la vida.
  const cortes = new Map<number, Cambio>();
  for (const x of cambios) {
    if (x.anio <= nac || x.anio > hoy) continue;
    const previo = cortes.get(x.anio);
    if (!previo || PRIORIDAD[x.fuente] < PRIORIDAD[previo.fuente]) cortes.set(x.anio, x);
  }
  const anios = [...cortes.keys()].sort((x, y) => x - y);
  let tramos: Tramo[] = [{ desde: nac, hasta: anios[0] ?? null, abre: null, anecdotas: [] }];
  anios.forEach((anio, i) => tramos.push({ desde: anio, hasta: anios[i + 1] ?? null, abre: cortes.get(anio)!, anecdotas: [] }));
  for (const x of [...resto].sort(porAnio)) {
    const t = [...tramos].reverse().find((tr) => tr.desde <= x.anio!) ?? tramos[0];
    t.anecdotas.push(x);
  }

  // Un tramo vacío no es capítulo: el anterior se estira (o el siguiente, si es el primero).
  const juntar = (a: Tramo, b: Tramo): Tramo => ({ desde: a.desde, hasta: b.hasta, abre: a.abre, anecdotas: [...a.anecdotas, ...b.anecdotas] });
  const sinVacios: Tramo[] = [];
  for (const t of tramos) {
    if (t.anecdotas.length) sinVacios.push(t);
    else if (sinVacios.length) sinVacios[sinVacios.length - 1] = { ...sinVacios[sinVacios.length - 1], hasta: t.hasta };
    else sinVacios.push(t); // el primero vacío: se junta con el siguiente abajo
  }
  tramos = [];
  for (const t of sinVacios) {
    const ultimo = tramos[tramos.length - 1];
    if (ultimo && !ultimo.anecdotas.length) tramos[tramos.length - 1] = juntar(ultimo, t);
    else tramos.push(t);
  }

  // Bajo el piso: se pega al vecino más chico, empezando por el más chico.
  for (;;) {
    if (tramos.length < 2) break;
    const bajos = tramos.map((t, i) => ({ i, p: suma(t) })).filter((x) => x.p < piso);
    if (!bajos.length) break;
    const { i } = bajos.reduce((m, x) => (x.p < m.p ? x : m));
    const prev = i > 0 ? suma(tramos[i - 1]) : Infinity;
    const next = i < tramos.length - 1 ? suma(tramos[i + 1]) : Infinity;
    if (next < prev) tramos.splice(i, 2, juntar(tramos[i], tramos[i + 1]));
    else tramos.splice(i - 1, 2, juntar(tramos[i - 1], tramos[i]));
  }

  // Un tramo sin anécdotas solo queda si todo el material con año era de un rol: no es capítulo.
  const capitulos: CapituloEtapa[] = tramos
    .filter((t) => t.anecdotas.length)
    .map((t) => ({ desde: t.desde, hasta: t.hasta, anecdotas: t.anecdotas.map((x) => x.id), palabras: suma(t), abre: t.abre }));
  for (const cap of capitulos) if (cap.palabras > techo) avisos.push(`${cap.desde}–${cap.hasta ?? 'hoy'} pasa el techo (${cap.palabras} > ${techo}) y no hay otro cambio donde cortar.`);
  // El rol va en el año en que empieza, pero nunca después del capítulo que llega a hoy (ahí termina el libro).
  const hayUltimo = capitulos.length > 0;
  for (const r of capRol.sort((x, y) => x.desde - y.desde)) {
    const i = capitulos.findIndex((cap) => !cap.rol && cap.desde > r.desde);
    const antesDelUltimo = hayUltimo ? capitulos.length - 1 : capitulos.length;
    capitulos.splice(i < 0 ? antesDelUltimo : Math.min(i, antesDelUltimo), 0, r);
  }
  return { capitulos, sinAnio, avisos };
}
