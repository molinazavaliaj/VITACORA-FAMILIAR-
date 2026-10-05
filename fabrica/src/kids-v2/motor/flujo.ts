// El recorrido del guion: empezar un item, terminarlo y decidir qué sigue
// (flujo-vigente.md §3 a §10). Trabaja sobre un borrador del estado (Ctx)
// que motor.ts clona al entrar: desde afuera, todo es puro.

import { ACUSES, ACUSES_DIA_FEO, ACUSES_FOTO, opcionesAcuse, siguienteDe } from '../acuses.js';
import { extra as extraDelBanco, pregunta, type IdMensaje } from '../banco.js';
import { fotoDelItem } from '../compra.js';
import { extrasDisponibles, type HistorialExtras } from '../extras.js';
import { aLocal, sumarDias } from '../horas.js';
import { VENTANA_MS } from '../reglas.js';
import { esPlural } from '../texto.js';
import type { Extra, Foto } from '../tipos.js';
import { avisoPreguntaNueva, extraMsg, fijoA, fotoMsg, padreMsgs, preguntaMsg, variables } from './mensajes.js';
import type { Estado, Fase, Mensaje, MotivoMarca, Salida } from './tipos.js';

export type Ctx = { e: Estado; ahora: Date; salidas: Salida[]; /** Procesando lo que llegó de noche, a las 9. */ replay: boolean };

export const hoy = (c: Ctx) => aLocal(c.ahora, c.e.ficha.zona).fecha;

export function emitir(c: Ctx, ...ms: Mensaje[]): void {
  for (const m of ms) c.salidas.push({ tipo: 'mensaje', ...m });
}

export function marcar(c: Ctx, motivo: MotivoMarca, detalle: string): void {
  c.salidas.push({ tipo: 'marca', motivo, detalle });
}

export function ventanaAbierta(e: Estado, ahora: Date): boolean {
  return e.ultimaEntrada !== null && ahora.getTime() - new Date(e.ultimaEntrada).getTime() < VENTANA_MS;
}

/**
 * Manda un lote. Si es "a la hora" (proactivo) y la ventana de 24 h está
 * cerrada, o es canal B ("cada pregunta llega al tocar [Estamos listos]"),
 * primero va PREG-NUEVA y el lote queda retenido hasta el botón. Si ya había
 * un PREG-NUEVA sin respuesta, no sale otro: se cambia lo retenido (no se acumulan).
 */
export function entregar(c: Ctx, mensajes: Mensaje[], luego: Fase, proactivo: boolean): void {
  const e = c.e;
  if (!proactivo || (e.ficha.canal === 'A' && ventanaAbierta(e, c.ahora))) {
    emitir(c, ...mensajes);
    e.fase = luego;
    return;
  }
  if (e.fase.tipo !== 'retenido') emitir(c, avisoPreguntaNueva(e));
  e.fase = { tipo: 'retenido', mensajes, luego };
}

export function soltarRetenido(c: Ctx): void {
  const f = c.e.fase;
  if (f.tipo !== 'retenido') return;
  emitir(c, ...f.mensajes);
  c.e.fase = f.luego;
  // Canal B: TERMINO-PADRE va al día siguiente de que le llegó FINAL-CHICO, no del cierre.
  if (f.luego.tipo === 'terminado' && c.e.terminoPadre !== null) c.e.terminoPadre = sumarDias(hoy(c), 1);
}

const historial = (e: Estado): HistorialExtras => ({ opsUsadas: e.opsUsadas, extrasUsadas: e.extrasUsadas, hermanos: e.hermanos, peleaK36: e.peleaK36 });

/** La extra de "una más de estas" del capítulo: la primera disponible; en el cap. 4 (K39 ya salió) solo las livianas. */
export function extrasDeUnaMas(e: Estado): Extra[] {
  const item = e.guion[e.cursor];
  return extrasDisponibles(e.ficha, historial(e), { cap: item.cap, soloLivianas: item.cap === 4 });
}

/**
 * Una foto pegada que venció (o se perdió por algo preocupante) y vuelve al
 * final como extra (cambio A de Naza, 05/10). `id` es el del mensaje de la
 * foto (K1-FOTO), que también queda en `e.extra` mientras está en curso.
 */
export type FotoVencida = { tipo: 'foto-vencida'; id: string; de: string; foto: Foto };

const SUFIJO_FOTO = '-FOTO';

/** La foto de una principal vencida: la que salía pegada en su item del guion (puede ser una mudada). */
function fotoVencida(e: Estado, clave: string): FotoVencida {
  const item = e.guion.find((x) => x.tipo === 'principal' && x.clave === clave);
  const foto = (item ? fotoDelItem(item) : null) ?? pregunta(clave).foto;
  if (!foto) throw new Error(`${clave} no tiene foto pegada`);
  return { tipo: 'foto-vencida', id: `${clave}${SUFIJO_FOTO}`, de: clave, foto };
}

/** Si la extra en curso es una foto vencida, cuál (con sus botones de siempre); si no, null. */
export function fotoVencidaEnCurso(e: Estado): FotoVencida | null {
  if (!e.extra?.endsWith(SUFIJO_FOTO)) return null;
  return fotoVencida(e, e.extra.slice(0, -SUFIJO_FOTO.length));
}

/** Lo del final, en orden: primero las fotos vencidas, después las extras del banco (caps. 1 a 5). */
export function extrasDelFinal(e: Estado): (FotoVencida | Extra)[] {
  return [...e.fotosVencidas.map((k) => fotoVencida(e, k)), ...extrasDisponibles(e.ficha, historial(e))];
}

export function mandarExtra(c: Ctx, x: FotoVencida | Extra): void {
  const e = c.e;
  e.extra = x.id;
  e.conto = false;
  if ('tipo' in x) {
    // La foto original, con su texto y sus botones; sale de la lista de pendientes.
    e.fotosVencidas = e.fotosVencidas.filter((k) => k !== x.de);
    emitir(c, { ...fotoMsg(e, x.foto), id: x.id });
    e.fase = { tipo: 'foto', clave: x.id };
    return;
  }
  e.extrasUsadas.push(x.id);
  emitir(c, extraMsg(e, x));
  e.fase = x.foto ? { tipo: 'foto', clave: x.id } : { tipo: 'pregunta', clave: x.id, rama: null, pasoRama: 0 };
}

/** FINAL-CHICO y FINAL-CHICO-PL como plantillas de Meta propias (cambio B de Naza, 05/10; plantillas-meta-kids.md, 10 y 10b). */
const PLANTILLA_FINAL = { 'FINAL-CHICO': 'kids_final', 'FINAL-CHICO-PL': 'kids_final_plural' } as const;

/** FINAL-CHICO (o -PL según quién se lo regala), como mensaje común; la plantilla se le pone solo si sale fuera de las 24 h. */
export function mensajeFinal(e: Estado) {
  const id = esPlural(e.ficha.quienRegala) ? 'FINAL-CHICO-PL' : 'FINAL-CHICO';
  const vars = variables.chico(e.ficha);
  return { id, vars, final: fijoA(e, id, { variables: vars }) } as const;
}

export const terminoPadre = (e: Estado): Mensaje => fijoA(e, 'TERMINO-PADRE', { variables: variables.padre(e.ficha), paraPadre: true });

/** Empieza el item i del guion: lo que va antes (entrada, aviso, línea del padre) y la pregunta. */
export function empezarItem(c: Ctx, i: number, proactivo: boolean): void {
  const e = c.e;
  const item = e.guion[i];
  if (!item) throw new Error(`No hay item ${i} en el guion`);
  e.cursor = i;
  e.extra = null;
  e.conto = false;
  switch (item.tipo) {
    case 'principal': {
      const ms: Mensaje[] = [];
      if (item.primeraDelCap) ms.push(fijoA(e, `ENTRADA-${item.cap}`));
      e.diaHecho = hoy(c);
      const p = pregunta(item.clave);
      if (p.avisoAntes) return entregar(c, [...ms, fijoA(e, 'B-AVISO-SERIA')], { tipo: 'aviso-seria' }, proactivo);
      return entregar(c, [...ms, preguntaMsg(e, p)], { tipo: 'pregunta', clave: item.clave, rama: null, pasoRama: 0 }, proactivo);
    }
    case 'una-mas':
      if (extrasDeUnaMas(e).length === 0) return empezarItem(c, i + 1, proactivo);
      return entregar(c, [fijoA(e, 'B-UNA-MAS')], { tipo: 'una-mas' }, proactivo);
    case 'cierre':
      return entregar(c, [fijoA(e, item.clave as IdMensaje)], { tipo: 'cierre' }, proactivo);
    case 'padre':
      e.diaHecho = hoy(c);
      return entregar(c, padreMsgs(e, item), { tipo: 'pregunta', clave: item.clave, rama: null, pasoRama: 0 }, proactivo);
    case 'extras':
      e.extrasDesde = c.ahora.toISOString();
      if (extrasDelFinal(e).length === 0) return empezarItem(c, i + 1, proactivo);
      return entregar(c, [fijoA(e, 'EXTRAS-OFERTA')], { tipo: 'extras-oferta' }, proactivo);
    case 'final': {
      const { id, vars, final } = mensajeFinal(e);
      if (proactivo && !ventanaAbierta(e, c.ahora)) {
        // Fuera de las 24 h (el cierre solo a los 2 días): el final sale como su
        // plantilla, sin PREG-NUEVA antes, y después TERMINO-PADRE (cambio B, 05/10).
        emitir(c, { ...final, plantilla: { nombre: PLANTILLA_FINAL[id], variables: vars } });
        if (e.ficha.canal === 'A') emitir(c, terminoPadre(e));
        else e.terminoPadre = sumarDias(hoy(c), 1);
        e.fase = { tipo: 'terminado' };
        return;
      }
      // TERMINO-PADRE: canal A, ya; canal B, al día siguiente a la hora (05/10, Fable 7).
      if (e.ficha.canal === 'A') emitir(c, terminoPadre(e));
      else e.terminoPadre = sumarDias(hoy(c), 1);
      return entregar(c, [final], { tipo: 'terminado' }, proactivo);
    }
  }
}

/** Terminó el item en curso (contestó, pasó o no aplicaba): qué sigue (banco.md, "Reglas del flujo"). */
export function terminarItem(c: Ctx): void {
  const e = c.e;
  const item = e.guion[e.cursor];
  if (e.extra) {
    e.extra = null;
    if (item.tipo === 'una-mas') return empezarItem(c, e.cursor + 1, false);
    const quedan = extrasDelFinal(e);
    if (quedan.length > 0) {
      emitir(c, fijoA(e, 'EXTRAS-OTRA'));
      e.fase = { tipo: 'extras-otra' };
      return;
    }
    emitir(c, fijoA(e, 'EXTRAS-FIN'));
    return empezarItem(c, e.cursor + 1, false);
  }
  if (item.tipo === 'principal' && pregunta(item.clave).avisoAntes) {
    // K39: si contó, la tranquila; si pasó, K40 directo (05/10, Fable 9).
    if (!e.conto) return empezarItem(c, e.cursor + 1, false);
    emitir(c, fijoA(e, 'B-TRANQUILA'));
    e.fase = { tipo: 'tranquila' };
    return;
  }
  if (item.tipo === 'principal' && item.ultimaDelCap) return empezarItem(c, e.cursor + 1, false);
  if (item.tipo === 'cierre' && item.clave === 'CIERRE-FINAL') return empezarItem(c, e.cursor + 1, false);
  emitir(c, fijoA(e, 'B-SEGUIR'));
  e.fase = { tipo: 'seguir' };
}

/** Lo que se está preguntando ahora: la principal, la extra o la del padre. */
export function enCurso(e: Estado): { capsula: boolean; sensible: boolean } {
  const fv = fotoVencidaEnCurso(e);
  if (fv) {
    const de = e.guion.find((x) => x.clave === fv.de);
    return { capsula: de?.cap === 5, sensible: false };
  }
  if (e.extra) {
    const x = extraDelBanco(e.extra);
    return { capsula: x.cap === 5, sensible: x.sensible };
  }
  const item = e.guion[e.cursor];
  return { capsula: item?.cap === 5 && item.tipo !== 'padre', sensible: item?.tipo === 'principal' && pregunta(item.clave).sensible };
}

export function acusar(c: Ctx, escrito: boolean): void {
  const e = c.e;
  const { capsula, sensible } = enCurso(e);
  if (sensible) return acuseSobrio(c);
  const id = siguienteDe(ACUSES, opcionesAcuse({ capsula, escrito }), e.rotacion.acuse);
  e.rotacion.acuse = id;
  emitir(c, fijoA(e, id as (typeof ACUSES)[number]));
}

export function acuseFoto(c: Ctx): void {
  const id = siguienteDe(ACUSES_FOTO, ACUSES_FOTO, c.e.rotacion.foto);
  c.e.rotacion.foto = id;
  emitir(c, fijoA(c.e, id as (typeof ACUSES_FOTO)[number]));
}

/** Los acuses del día feo (B-DIAFEO-ACUSE): K39, la extra sensible y algo preocupante. */
export function acuseSobrio(c: Ctx): void {
  const id = siguienteDe(ACUSES_DIA_FEO, ACUSES_DIA_FEO, c.e.rotacion.diaFeo);
  c.e.rotacion.diaFeo = id;
  emitir(c, fijoA(c.e, id as (typeof ACUSES_DIA_FEO)[number]));
}

/** Después del acuse (o del "paso"): la foto pegada, si la principal tiene; si no, lo que siga. */
export function fotoOTerminar(c: Ctx): void {
  const e = c.e;
  const item = e.guion[e.cursor];
  const foto = e.extra ? null : fotoDelItem(item);
  if (foto) {
    emitir(c, fotoMsg(e, foto));
    e.fase = { tipo: 'foto', clave: item.clave };
    return;
  }
  terminarItem(c);
}

/** "Mañana sigo" / "Mañana mejor": B-MAÑANA y el día queda hecho. De noche (se procesa a las 9) no se dice nada. */
export function manana(c: Ctx, siguiente: number): void {
  if (!c.replay) {
    emitir(c, fijoA(c.e, 'B-MAÑANA'));
    c.e.diaHecho = hoy(c);
  }
  c.e.fase = { tipo: 'libre', siguiente };
}
