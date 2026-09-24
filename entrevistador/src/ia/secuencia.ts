import { armarGuion, MAX_LIBRES, tope, type Caida } from './guion-v2.js';
import type { Objetivo } from './pregunta-v2.js';
import { RANGO_TRAMO, edadDe, type Tramo } from './plan-preguntas.js';
import type { Perfil } from './perfil.js';

// La secuencia del esqueleto v2 (24/09): fija, por etapas, sin puerta abierta ni variables por peso.
// El guion (`guion-v2.ts`) dice qué filas entran para esta persona; acá se guarda dónde está la
// entrevista: pendientes, hechas (la fábrica las lee para ubicar cada respuesta en su época),
// cubiertos (filas que la ficha dio por contadas), caídas (filas que no aplican, con motivo), las
// libres agregadas al cerrar cada etapa y los objetos. Todo puro: se guarda tal cual en
// `contexto.v2.secuencia`.

export type Hecha = { id: string; orden: number; tramo: Tramo | null; objetivo: Objetivo };
export type Secuencia = {
  pendientes: Objetivo[];
  hechas: Hecha[];
  cubiertos: string[];
  caidas: Caida[];
  /** `final` marca el objeto de cierre: pasa una sola vez. */
  objetos: { orden: number; tramo: Tramo; final?: boolean }[];
  ultimoTramo: Tramo | null;
  /** Cuántas libres se agregaron (hasta MAX_LIBRES). */
  libres: number;
};

export const MAX_OBJETOS = 8;
/** Las etapas cuyas filas nunca se caen por "cubierto". */
const NO_SE_CUBRE = new Set(['presentacion', 'inicio', 'hoy', 'futuro', 'reflexion']);

export function tramoDe(o: Objetivo): Tramo | null {
  if (o.tipo === 'variable' || o.tipo === 'objeto') return o.tramo;
  return o.tramo ?? null;
}
const bloqueDe = (o: Objetivo): string => (o.tipo === 'nucleo' ? o.bloque : o.tipo === 'variable' ? o.tramo : o.tipo === 'objeto' ? o.tramo : (o.tramo ?? 'inicio'));

export function armarSecuencia(perfil: Perfil, anioActual = new Date().getFullYear()): Secuencia {
  const { filas, caidas } = armarGuion(perfil, anioActual);
  return { pendientes: filas.map((f) => ({ tipo: 'nucleo' as const, ...f })), hechas: [], cubiertos: [], caidas, objetos: [], ultimoTramo: null, libres: 0 };
}

/**
 * El guion de nuevo con la ficha de hoy (cambió la edad o el árbol): las filas que ya se hicieron o
 * se cubrieron no vuelven; las libres ya agregadas se conservan en su lugar; lo que ahora aplica
 * entra en su etapa.
 */
export function rearmar(s: Secuencia, perfil: Perfil, anioActual = new Date().getFullYear()): Secuencia {
  const { filas, caidas } = armarGuion(perfil, anioActual);
  const yaNo = new Set([...s.hechas.map((h) => h.id), ...s.cubiertos]);
  const nuevas: Objetivo[] = filas.filter((f) => !yaNo.has(f.id)).map((f) => ({ tipo: 'nucleo' as const, ...f }));
  // Las libres se quedan delante de la primera fila de su tramo o después.
  const libres = s.pendientes.filter((o) => o.tipo === 'variable');
  const pendientes: Objetivo[] = [];
  for (const o of nuevas) {
    for (const l of libres) if (l.tipo === 'variable' && !pendientes.includes(l) && (tramoDe(o) === l.tramo || ordenBloque(bloqueDe(o)) > ordenBloque(l.tramo))) pendientes.push(l);
    pendientes.push(o);
  }
  for (const l of libres) if (!pendientes.includes(l)) pendientes.push(l);
  return { ...s, pendientes, caidas };
}

const BLOQUES_ORDEN = ['presentacion', 'inicio', 'infancia', 'juventud', 'adulto joven', 'adultez media', 'segunda mitad', 'hoy', 'futuro', 'reflexion'];
const ordenBloque = (b: string) => BLOQUES_ORDEN.indexOf(b);

export function proxima(s: Secuencia): Objetivo | null {
  return s.pendientes[0] ?? null;
}

export function avanzar(s: Secuencia, o: Objetivo, orden: number): Secuencia {
  const tramo = tramoDe(o);
  return {
    ...s,
    pendientes: s.pendientes.filter((p) => p.id !== o.id),
    hechas: [...s.hechas, { id: o.id, orden, tramo, objetivo: o }],
    ultimoTramo: tramo ?? s.ultimoTramo,
  };
}

/** Las filas que la ficha de hoy dio por contadas se caen (menos inicio, hoy, futuro y reflexión), con registro. */
export function aplicarCubiertos(s: Secuencia, perfil: Perfil): Secuencia {
  let pendientes = [...s.pendientes];
  const cubiertos = [...s.cubiertos];
  for (const id of perfil.cubiertos) {
    const o = pendientes.find((p) => p.id === id);
    if (!o || o.tipo !== 'nucleo' || NO_SE_CUBRE.has(o.bloque)) continue;
    pendientes = pendientes.filter((p) => p.id !== id);
    if (!cubiertos.includes(id)) cubiertos.push(id);
  }
  return { ...s, pendientes, cubiertos };
}

/** Si con `hecha` ya no queda ninguna pendiente de su tramo, ese tramo se cerró. */
export function etapaCerrada(s: Secuencia, hecha: Objetivo): Tramo | null {
  const tramo = tramoDe(hecha);
  if (!tramo || tramo === 'hoy') return null;
  if (s.pendientes.some((p) => p.id === hecha.id)) return null;
  return s.pendientes.some((p) => tramoDe(p) === tramo) ? null : tramo;
}

const totalPreguntas = (s: Secuencia) => s.pendientes.length + s.hechas.filter((h) => h.id !== 'presentacion').length;

/**
 * Una pregunta libre al cerrar una etapa: el primer "[etapa] …" de `noSabemos` que todavía no se
 * usó, hasta MAX_LIBRES y sin pasar el techo. Va primera: es lo que la persona nombró y no contó.
 */
/** El tipo real de lo que devuelve: siempre una `variable` (o nada). Más preciso que `Objetivo` a secas: así el que llama puede leer `.anclas` sin volver a discriminar. */
type Libre = Extract<Objetivo, { tipo: 'variable' }>;

export function agregarLibre(s: Secuencia, perfil: Perfil, tramo: Tramo, anioActual = new Date().getFullYear()): { secuencia: Secuencia; libre: Libre | null } {
  if (s.libres >= MAX_LIBRES || totalPreguntas(s) >= tope(edadDe(perfil, anioActual))) return { secuencia: s, libre: null };
  const usadas = new Set([...s.pendientes, ...s.hechas.map((h) => h.objetivo)].flatMap((o) => (o.tipo === 'variable' ? o.anclas : [])));
  const prefijo = `[${tramo}]`;
  const ancla = perfil.noSabemos.map((n) => n.trim()).filter((n) => n.toLowerCase().startsWith(prefijo)).map((n) => n.slice(prefijo.length).trim()).find((n) => n && !usadas.has(n));
  if (!ancla) return { secuencia: s, libre: null };
  const n = [...s.pendientes, ...s.hechas.map((h) => h.objetivo)].filter((o) => o.tipo === 'variable' && o.tramo === tramo).length + 1;
  const edad = edadDe(perfil, anioActual);
  const [desde, hasta] = tramo === 'segunda mitad' && edad !== null ? [RANGO_TRAMO[tramo][0], edad] : RANGO_TRAMO[tramo];
  const libre: Libre = { tipo: 'variable', id: `libre-${tramo}-${n}`, tramo, desde, hasta, anclas: [ancla] };
  return { secuencia: { ...s, pendientes: [libre, ...s.pendientes], libres: s.libres + 1 }, libre };
}

const enElInicio = (s: Secuencia) => s.pendientes.some((o) => o.tipo === 'nucleo' && o.bloque === 'inicio');

/**
 * El objeto de un tramo toca cuando el tramo se CERRÓ (hay una hecha con ese tramo y no queda ningún
 * pendiente que apunte ahí); nunca en el inicio; `sinFotos` los apaga; MAX_OBJETOS los corta. Al
 * terminar (`siguiente === null`) toca un objeto final, una sola vez (`final: true`).
 */
export function tocaObjeto(s: Secuencia, siguiente: Objetivo | null, sinFotos: boolean): Tramo | null {
  if (sinFotos || s.objetos.length >= MAX_OBJETOS) return null;
  if (siguiente === null) {
    if (s.objetos.some((o) => o.final)) return null;
    return s.ultimoTramo ?? 'hoy';
  }
  if (enElInicio(s) || s.ultimoTramo === null) return null;
  const tramo = s.ultimoTramo;
  if (s.pendientes.some((p) => tramoDe(p) === tramo)) return null;
  if (s.objetos.some((o) => o.tramo === tramo && !o.final)) return null;
  return tramo;
}

export function registrarObjeto(s: Secuencia, tramo: Tramo, orden: number, final = false): Secuencia {
  return { ...s, objetos: [...s.objetos, final ? { orden, tramo, final } : { orden, tramo }] };
}
