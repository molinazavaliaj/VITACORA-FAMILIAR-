import { NUCLEO, BLOQUES, type Objetivo, type Bloque } from './pregunta-v2.js';
import { TOPE_PREGUNTAS, type Variable, type Tramo } from './plan-preguntas.js';
import type { Perfil } from './perfil.js';

// La secuencia viva (diseño 23/09, §2.5). Hasta acá la lista de preguntas estaba fija de antemano y
// el biógrafo no podía moverse aunque la persona le abriera una puerta: Naza lo marcó como una de
// las causas principales de las preguntas que fallan. Ahora hay una columna vertebral cronológica y
// el biógrafo elige la próxima entre las pendientes. Todo puro: se guarda tal cual en
// `contexto.secuencia`.

export type Hecha = { id: string; orden: number; tramo: Tramo | null; objetivo: Objetivo };
export type Secuencia = {
  pendientes: Objetivo[];
  hechas: Hecha[];
  cubiertos: string[];
  objetos: { orden: number; tramo: Tramo }[];
  ultimoTramo: Tramo | null;
};

export const MAX_OBJETOS = 8;
/** Los que no se mueven ni se caen: el arranque. */
const FIJOS_INAMOVIBLES = new Set(['presentacion', 'casa-infancia', 'mapa-casas', 'mapa-capitulos']);
const BLOQUE_REFLEXION: Bloque = 'reflexion';
/** El cierre: nunca se adelantan (la reflexión va al final), aunque se puedan "cubrir" no se caen. */
const CIERRE = new Set(['lo-que-falta', 'mensaje', 'cinco-minutos']);

/** Los bloques del núcleo que no son un tramo de vida (no cuentan para el reparto ni los objetos). */
const NO_ES_TRAMO = new Set(['reflexion', 'inicio', 'presentacion']);

const bloqueDe = (o: Objetivo): Bloque => (o.tipo === 'nucleo' ? o.bloque : (o.tramo as Bloque));
const posicion = (o: Objetivo) => BLOQUES.indexOf(bloqueDe(o));

/**
 * El tramo de vida al que apunta un objetivo, para el reparto y los objetos: el de la variable, el
 * del núcleo si lo tiene, o (si el bloque del núcleo ya es un tramo, como "juventud" o "hoy") ese
 * bloque. La presentación, el inicio y la reflexión no son un tramo: dan null.
 */
export function tramoDe(o: Objetivo, _perfil: Perfil): Tramo | null {
  if (o.tipo === 'variable' || o.tipo === 'objeto') return o.tramo;
  if (o.tramo) return o.tramo;
  return NO_ES_TRAMO.has(o.bloque) ? null : (o.bloque as Tramo);
}

function variablesConId(vs: Variable[], desde = 0): Objetivo[] {
  const cuenta = new Map<Tramo, number>();
  return vs.map((v) => {
    const n = (cuenta.get(v.tramo) ?? 0) + 1;
    cuenta.set(v.tramo, n);
    return { tipo: 'variable' as const, id: `var-${v.tramo}-${n + desde}`, ...v };
  });
}

/** Ordena por bloque; dentro del bloque, el orden de llegada (fijas antes que variables). */
function ordenar(objetivos: Objetivo[]): Objetivo[] {
  return objetivos
    .map((o, i) => ({ o, i }))
    .sort((a, b) => posicion(a.o) - posicion(b.o) || a.i - b.i)
    .map((x) => x.o);
}

export function armarSecuencia(variables: Variable[]): Secuencia {
  const nucleo: Objetivo[] = NUCLEO.map((n) => ({ tipo: 'nucleo' as const, ...n }));
  return { pendientes: ordenar([...nucleo, ...variablesConId(variables)]), hechas: [], cubiertos: [], objetos: [], ultimoTramo: null };
}

export function proxima(s: Secuencia): Objetivo | null {
  return s.pendientes[0] ?? null;
}

export function avanzar(s: Secuencia, o: Objetivo, orden: number): Secuencia {
  const tramo = tramoDe(o, {} as Perfil);
  return {
    ...s,
    pendientes: s.pendientes.filter((p) => p.id !== o.id),
    hechas: [...s.hechas, { id: o.id, orden, tramo, objetivo: o }],
    ultimoTramo: tramo ?? s.ultimoTramo,
  };
}

const enElInicio = (s: Secuencia) => s.pendientes.some((o) => o.tipo === 'nucleo' && FIJOS_INAMOVIBLES.has(o.id));

const total = (s: Secuencia) => s.pendientes.length + s.hechas.length;

const RANGO: Record<Tramo, [number, number]> = {
  infancia: [0, 12],
  juventud: [13, 22],
  'adulto joven': [23, 35],
  'adultez media': [36, 55],
  'segunda mitad': [56, 200],
  hoy: [0, 200],
};

/**
 * Lo que el perfil de hoy le dice a la secuencia: un tema cubierto se cae (y una variable de su
 * tramo toma su día, si hay lugar bajo el tope), una puerta abierta adelanta ese tema al frente, y
 * las variables nuevas de un replanificar se suman. Nada de esto toca los cuatro primeros ni la
 * reflexión.
 */
export function aplicarPerfil(s: Secuencia, perfil: Perfil, variablesNuevas?: Variable[]): Secuencia {
  let pendientes = [...s.pendientes];
  const cubiertos = [...s.cubiertos];
  const puedeCaerse = (o: Objetivo) => o.tipo === 'nucleo' && !FIJOS_INAMOVIBLES.has(o.id) && o.bloque !== BLOQUE_REFLEXION;
  // Solo hace falta reordenar si algo estructural cambió (una fija se cayó o entraron variables
  // nuevas): reordenar sin necesidad pisaría una puerta abierta que ya había adelantado un tema.
  let cambioEstructural = false;

  for (const id of perfil.cubiertos) {
    const o = pendientes.find((p) => p.id === id);
    if (!o || !puedeCaerse(o)) continue;
    pendientes = pendientes.filter((p) => p.id !== id);
    cubiertos.push(id);
    cambioEstructural = true;
    const tramo = tramoDe(o, perfil);
    if (tramo && total(s) < TOPE_PREGUNTAS) {
      const n =
        pendientes.filter((p) => p.tipo === 'variable' && p.tramo === tramo).length +
        s.hechas.filter((h) => h.id.startsWith(`var-${tramo}-`)).length +
        1;
      const rango = RANGO[tramo];
      pendientes.push({ tipo: 'variable', id: `var-${tramo}-${n}`, tramo, desde: rango[0], hasta: rango[1], anclas: [] });
    }
  }

  if (variablesNuevas) {
    const yaHay = (t: Tramo) => {
      const enPendientes = pendientes.filter((p) => p.tipo === 'variable' && p.tramo === t).length;
      const enHechas = s.hechas.filter((h) => h.id.startsWith(`var-${t}-`)).length;
      return enPendientes + enHechas;
    };
    const porTramo = new Map<Tramo, Variable[]>();
    for (const v of variablesNuevas) porTramo.set(v.tramo, [...(porTramo.get(v.tramo) ?? []), v]);
    for (const [tramo, vs] of porTramo) {
      const ya = yaHay(tramo);
      const faltan = vs.slice(ya);
      if (faltan.length) { pendientes.push(...variablesConId(faltan, ya)); cambioEstructural = true; }
    }
  }

  if (cambioEstructural) pendientes = ordenar(pendientes);

  if (perfil.puertaAbierta && !enElInicio(s)) {
    const o = pendientes.find((p) => p.id === perfil.puertaAbierta);
    const puedeAdelantarse = o && !(o.tipo === 'nucleo' && (FIJOS_INAMOVIBLES.has(o.id) || CIERRE.has(o.id)));
    if (o && puedeAdelantarse) pendientes = [o, ...pendientes.filter((p) => p.id !== o.id)];
  }
  return { ...s, pendientes, cubiertos };
}

/**
 * Un objeto cuando la siguiente pregunta cambia de tramo (se cerró uno) —nunca en el inicio, ni
 * repetido para el mismo tramo—, o uno final cuando la secuencia terminó y quedó un tramo sin su
 * objeto. `sinFotos` los apaga a todos; MAX_OBJETOS los corta.
 */
export function tocaObjeto(s: Secuencia, siguiente: Objetivo | null, sinFotos: boolean): Tramo | null {
  if (sinFotos || s.objetos.length >= MAX_OBJETOS || s.ultimoTramo === null) return null;
  const yaHecho = s.objetos.some((o) => o.tramo === s.ultimoTramo);
  if (siguiente === null) return yaHecho ? null : s.ultimoTramo;
  if (enElInicio(s)) return null;
  const tramoSiguiente = tramoDe(siguiente, {} as Perfil);
  if (tramoSiguiente === s.ultimoTramo) return null;
  return yaHecho ? null : s.ultimoTramo;
}

export function registrarObjeto(s: Secuencia, tramo: Tramo, orden: number): Secuencia {
  return { ...s, objetos: [...s.objetos, { orden, tramo }] };
}
