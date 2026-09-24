import { armarGuion, recortarAlTope, MAX_LIBRES, tope, type Caida } from './guion-v2.js';
import type { Objetivo } from './pregunta-v2.js';
import { RANGO_TRAMO, edadDe, type Tramo } from './plan-preguntas.js';
import type { Perfil } from './perfil.js';
import { slug } from '../manual/puro.js';

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
 *
 * Fix ronda 1, ítem 3: `armarGuion` recorta al techo asumiendo CERO hechas (una ficha nueva del día
 * 0). Acá ya hay hechas que cuentan (y libres pendientes, que también cuentan), y una hecha vieja
 * que ya no existe en el guion nuevo (p. ej. `hermanos-puerta`, reemplazada por los hermanos
 * expandidos) sigue sumando: si no se vuelve a recortar CON ese descuento, el total puede pasar el
 * techo. Se recorta `nuevasFilas` a `tope - hechas que cuentan - libres pendientes`.
 */
export function rearmar(s: Secuencia, perfil: Perfil, anioActual = new Date().getFullYear()): Secuencia {
  const { filas, caidas } = armarGuion(perfil, anioActual);
  const yaNo = new Set([...s.hechas.map((h) => h.id), ...s.cubiertos]);
  const nuevasFilas = filas.filter((f) => !yaNo.has(f.id));
  const libres = s.pendientes.filter((o) => o.tipo === 'variable');
  const hechasQueCuentan = s.hechas.filter((h) => h.id !== 'presentacion').length;
  const maxNuevas = Math.max(0, tope(edadDe(perfil, anioActual)) - hechasQueCuentan - libres.length);
  const nuevas: Objetivo[] = recortarAlTope(nuevasFilas, maxNuevas, caidas).map((f) => ({ tipo: 'nucleo' as const, ...f }));
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

// ── El candado de los cubiertos (piloto de Naza, 24/09) ─────────────────────
// La ficha (Sonnet) marcaba como "ya contadas" filas que solo se nombraron al pasar: la respuesta a
// mapa-capitulos cubrió a-los-quince, estudios y oficio; "con mi hermano mayor" en padres-como-eran
// cubrió hermano-ariel. La regla aprobada es "con detalle (una escena, nombres); al pasar, no", y
// estas tres no dependen del modelo:
//  a. Los repasos del inicio (mapa-casas, mapa-capitulos, los-tuyos-hoy) nombran todo y no cuentan
//     nada: no cubren ninguna fila, salvo las puertas (`*-puerta`), que son saber un dato.
//  b. La fila de una persona (`hermano-*`, `hijo-*`, `hermanos-todos`…) solo la cubre contestarla.
//  c. Inicio, hoy, futuro y reflexión nunca los cubre otra respuesta (`NO_SE_CUBRE`).

/** Los repasos del inicio: una pasada por toda la vida, que nombra todo. */
const REPASOS = new Set(['mapa-casas', 'mapa-capitulos', 'los-tuyos-hoy']);
/** Las filas del guion que se expanden por persona (`expandePor`). */
const FILAS_POR_PERSONA = new Set(['hermano', 'hijo']);

/** La fila de UNA persona: `hermano-ariel`, `hijo-lola`, `hermanos-todos` (no `hijo-unico` ni `hermanos-puerta`, que salen de la misma fila base). */
function esDeUnaPersona(o: Extract<Objetivo, { tipo: 'nucleo' }>): boolean {
  const base = o.fila ?? o.id.split('-')[0];
  return FILAS_POR_PERSONA.has(base) && (o.id.startsWith(`${base}-`) || o.id === `${base}s-todos`);
}

/** Por qué la respuesta a `desde` NO puede cubrir la fila pendiente `fila` (null: puede). */
export function motivoParaNoCubrir(desde: Objetivo, fila: Objetivo): string | null {
  if (fila.tipo !== 'nucleo' || fila.id === desde.id) return null;
  if (NO_SE_CUBRE.has(fila.bloque)) return `${fila.bloque}: nunca la cubre otra respuesta`;
  if (REPASOS.has(desde.id) && !fila.id.endsWith('-puerta')) return `${desde.id} es un repaso: nombrar no es contar`;
  if (esDeUnaPersona(fila)) return 'es la fila de una persona: solo la cubre contestarla';
  return null;
}

export type Rechazado = { id: string; motivo: string };

/**
 * Los cubiertos de UNA respuesta (la de `desde`), con el candado: de los que la ficha marcó hoy
 * (`perfil.cubiertos` que no estaban en `antes`), los que no pasan se rechazan y SALEN de la ficha
 * (si quedaran, la próxima respuesta los aplicaría sin candado); después, `aplicarCubiertos`.
 * Es el único lugar por donde pasan los cubiertos de `procesar` (respuesta en vivo o reusada).
 */
export function cubrirDesde(s: Secuencia, antes: string[], perfil: Perfil, desde: Objetivo): { secuencia: Secuencia; perfil: Perfil; rechazados: Rechazado[] } {
  const rechazados: Rechazado[] = [];
  for (const id of perfil.cubiertos) {
    if (antes.includes(id)) continue;
    const fila = s.pendientes.find((p) => p.id === id);
    const motivo = fila ? motivoParaNoCubrir(desde, fila) : null;
    if (motivo) rechazados.push({ id, motivo });
  }
  const fuera = new Set(rechazados.map((r) => r.id));
  const limpio: Perfil = fuera.size ? { ...perfil, cubiertos: perfil.cubiertos.filter((id) => !fuera.has(id)) } : perfil;
  return { secuencia: aplicarCubiertos(s, limpio), perfil: limpio, rechazados };
}

/**
 * Devuelve al guion filas cubiertas por error (`manual-v2 descubrir`): salen de `secuencia.cubiertos`
 * y de `perfil.cubiertos`, y la secuencia se rearma (`rearmar`: cada fila en su lugar del guion, sin
 * duplicar, sin volver a las hechas, con el techo). Un id que no es del guion ni está cubierto, o que
 * ya se preguntó, frena todo sin tocar nada.
 */
export function descubrir(s: Secuencia, perfil: Perfil, ids: string[], anioActual = new Date().getFullYear()): { secuencia: Secuencia; perfil: Perfil } | { error: string } {
  const hechas = new Set(s.hechas.map((h) => h.id));
  const conocidos = new Set([...armarGuion(perfil, anioActual).filas.map((f) => f.id), ...s.cubiertos, ...perfil.cubiertos, ...s.pendientes.map((o) => o.id)]);
  const yaHechas = ids.filter((id) => hechas.has(id));
  if (yaHechas.length) return { error: `${yaHechas.join(', ')}: ya se preguntó, no vuelve.` };
  const desconocidos = ids.filter((id) => !conocidos.has(id));
  if (desconocidos.length) return { error: `No conozco ${desconocidos.join(', ')}: no es una fila del guion ni un cubierto.` };
  const fuera = new Set(ids);
  const limpio: Perfil = { ...perfil, cubiertos: perfil.cubiertos.filter((id) => !fuera.has(id)) };
  const secuencia = rearmar({ ...s, cubiertos: s.cubiertos.filter((id) => !fuera.has(id)) }, limpio, anioActual);
  return { secuencia, perfil: limpio };
}

/**
 * Si en el tramo de `s.ultimoTramo` ya no queda ninguna fila abierta, ese tramo se cerró.
 *
 * Fix ronda 1: "abierta" se mide por `bloque` (para el núcleo) o `tramo` (para una variable), no
 * por el campo `tramo` del núcleo a secas (ítem 2): filas como `un-lugar-que-cambio-algo`,
 * `amigos-de-siempre` o `por-gusto` (bajo los 36) tienen `tramo: null` pero `bloque: 'adulto
 * joven'` — con el chequeo viejo (`tramoDe(p) === tramo`), "adulto joven" cerraba apenas se hacía
 * `pareja-como-llego` (la única fila de esa etapa CON tramo propio), y la libre y el objeto salían
 * antes de esas tres filas (así pasó en el piloto de Naza). Usar `s.ultimoTramo` en vez del tramo
 * propio de `hecha` además resuelve que la fila que en los hechos CIERRA la etapa (`por-gusto`)
 * tenga `tramo: null`: como no pisa `ultimoTramo` al avanzar, el tramo sigue siendo el de la
 * última fila que sí lo tenía, y recién da por cerrado cuando ya no queda nada pendiente de ese
 * bloque (a `casa-infancia`, con `tramo: 'infancia'` pero `bloque: 'inicio'`, no le cambia nada:
 * mientras el inicio siga, las filas reales de infancia siguen pendientes, así que igual da null).
 *
 * Fix ronda 1, ítem 1: solo una fila del NÚCLEO puede cerrar una etapa. Una libre ya hecha (una
 * `variable`) no vuelve a cerrar su propio tramo — si no, con varias anclas `[tramo]` sin usar, cada
 * libre hecha volvía a "cerrar" la etapa y encadenaba una libre tras otra (27 años, 3 anclas de
 * infancia → 3 libres seguidas, contra el guion: una sola libre por etapa).
 */
export function etapaCerrada(s: Secuencia, hecha: Objetivo): Tramo | null {
  if (hecha.tipo !== 'nucleo') return null;
  if (s.pendientes.some((p) => p.id === hecha.id)) return null;
  const tramo = s.ultimoTramo;
  if (!tramo || tramo === 'hoy') return null;
  return abiertoEnTramo(s, tramo) ? null : tramo;
}

/** Si queda algo pendiente de `tramo`: una fila del núcleo con ese `bloque`, o una variable con ese `tramo`. */
const abiertoEnTramo = (s: Secuencia, tramo: Tramo): boolean =>
  s.pendientes.some((p) => (p.tipo === 'nucleo' && p.bloque === tramo) || (p.tipo === 'variable' && p.tramo === tramo));

const totalPreguntas = (s: Secuencia) => s.pendientes.length + s.hechas.filter((h) => h.id !== 'presentacion').length;

/**
 * Una pregunta libre al cerrar una etapa: el primer "[etapa] …" de `noSabemos` que todavía no se
 * usó, hasta MAX_LIBRES y sin pasar el techo. Va primera: es lo que la persona nombró y no contó.
 *
 * Fix ronda 1, ítem 1: el guion pide UNA libre por etapa vivida, no una por cada ancla sin usar
 * (ver la nota de `etapaCerrada`). Si ya hay una variable de ese tramo, pendiente o hecha, se
 * rechaza (no depende solo de que `etapaCerrada` no vuelva a llamar: es la regla del guion, y así
 * `agregarLibre` no depende de que la llamen bien).
 */
type Libre = Extract<Objetivo, { tipo: 'variable' }>;

export function agregarLibre(s: Secuencia, perfil: Perfil, tramo: Tramo, anioActual = new Date().getFullYear()): { secuencia: Secuencia; libre: Libre | null } {
  if (s.libres >= MAX_LIBRES || totalPreguntas(s) >= tope(edadDe(perfil, anioActual))) return { secuencia: s, libre: null };
  const todas = [...s.pendientes, ...s.hechas.map((h) => h.objetivo)];
  if (todas.some((o) => o.tipo === 'variable' && o.tramo === tramo)) return { secuencia: s, libre: null };
  const usadas = new Set(todas.flatMap((o) => (o.tipo === 'variable' ? o.anclas : [])));
  const prefijo = `[${tramo}]`;
  const ancla = perfil.noSabemos.map((n) => n.trim()).filter((n) => n.toLowerCase().startsWith(prefijo)).map((n) => n.slice(prefijo.length).trim()).find((n) => n && !usadas.has(n));
  if (!ancla) return { secuencia: s, libre: null };
  const edad = edadDe(perfil, anioActual);
  const [desde, hasta] = tramo === 'segunda mitad' && edad !== null ? [RANGO_TRAMO[tramo][0], edad] : RANGO_TRAMO[tramo];
  // Fix ronda 1, ítem 4: el id es un slug (`libre-adulto-joven-1`), no el tramo crudo con espacio
  // (`libre-adulto joven-1`). Con una sola libre por tramo, el número siempre es 1.
  const libre: Libre = { tipo: 'variable', id: `libre-${slug(tramo)}-1`, tramo, desde, hasta, anclas: [ancla] };
  return { secuencia: { ...s, pendientes: [libre, ...s.pendientes], libres: s.libres + 1 }, libre };
}

const enElInicio = (s: Secuencia) => s.pendientes.some((o) => o.tipo === 'nucleo' && o.bloque === 'inicio');

/**
 * El objeto de un tramo toca cuando el tramo se CERRÓ (hay una hecha con ese tramo y no queda ningún
 * pendiente que apunte ahí, con el mismo criterio de `abiertoEnTramo` que usa `etapaCerrada` — fix
 * ronda 1, ítem 2: antes miraba `tramoDe(p) === tramo`, y con `un-lugar-que-cambio-algo`/
 * `amigos-de-siempre`/`por-gusto` (tramo null, bloque "adulto joven") el objeto de adulto joven
 * salía apenas se hacía `pareja-como-llego`, antes de esas tres filas); nunca en el inicio;
 * `sinFotos` los apaga; MAX_OBJETOS los corta. Al terminar (`siguiente === null`) toca un objeto
 * final, una sola vez (`final: true`). Arreglo final I3: el tramo que devuelve para el final es el
 * último vivido (casi siempre "hoy", que ya tuvo su objeto al empezar futuro) y queda solo como época
 * para la fábrica; el final se pide y se lista como final (`objetoDe`, `objetivoEnTexto`), nunca como
 * un segundo objeto "de hoy".
 */
export function tocaObjeto(s: Secuencia, siguiente: Objetivo | null, sinFotos: boolean): Tramo | null {
  if (sinFotos || s.objetos.length >= MAX_OBJETOS) return null;
  if (siguiente === null) {
    if (s.objetos.some((o) => o.final)) return null;
    return s.ultimoTramo ?? 'hoy';
  }
  if (enElInicio(s) || s.ultimoTramo === null) return null;
  const tramo = s.ultimoTramo;
  if (abiertoEnTramo(s, tramo)) return null;
  if (s.objetos.some((o) => o.tramo === tramo && !o.final)) return null;
  return tramo;
}

export function registrarObjeto(s: Secuencia, tramo: Tramo, orden: number, final = false): Secuencia {
  return { ...s, objetos: [...s.objetos, final ? { orden, tramo, final } : { orden, tramo }] };
}
