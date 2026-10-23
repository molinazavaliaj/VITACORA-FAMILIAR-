// El reloj de «Vitácora de una historia» (copia de src/v3/reloj.ts): un tick por minuto. Todo sale de la base (ningún
// setTimeout en memoria): si Railway se cae, el tick siguiente retoma. Por narrador activo, en orden: las filas de
// respuestas que quedaron sin sumar (reconciliar), la cola que quedó, el cierre por 3' de silencio (también de lo que
// contestó en TEMA-ABIERTO), la tanda del día a su hora y M8 a los 2 días sin respuesta.
//
// Sin lo de V3: la familia (no hay preguntas de la familia) y la búsqueda junta de respuestas sin clave de a 100
// narradores (conSinClave): historia arranca con pocos narradores y cada uno busca las suyas.

import { fechaLocal } from '../flujo/tiempo.js';
import type { DepsHistoria } from './deps.js';
import { despuesDeCerrar, pasoDeCierre, reconciliar } from './entrante.js';
import { drenar } from './enviar.js';
import { conReintento, listarFilas, tomaVigente } from './estado.js';
import { leerSacadas } from './fuera.js';
import { cuentaDeHoy, yaEsLaHora } from './tanda.js';
import { fichaTexto, type FilaHistoria, type NarradorHistoria } from './tipos.js';
import { avanzar, encolar, textoDelBanco } from './turno.js';

/** Una respuesta se cierra a los 3' de silencio desde que se guardó su última transcripción. */
export const SILENCIO_MS = 180_000;
/** M8 sale a los 2 días sin respuesta a lo abierto. */
export const DIAS_M8 = 2;

const hayBorrador = (f: FilaHistoria) => !!f.estado.borrador?.trim();

/** 3' sin audio nuevo desde que se guardó la última transcripción. Sin borrador no hay nada que cerrar. */
export function silencioCumplido(f: FilaHistoria, ahora: Date): boolean {
  return !!f.estado.esperando && hayBorrador(f) && !!f.ultimo_audio_at && ahora.getTime() - Date.parse(f.ultimo_audio_at) >= SILENCIO_MS;
}

/** La tanda del día arranca solo si la entrevista empezó, no hay nada abierto y ya es su hora (lo pendiente no se reenvía). */
export function tocaTanda(f: FilaHistoria, n: NarradorHistoria, ahora: Date, hoy: string): boolean {
  return f.estado.fase === 'entrevista' && !f.estado.terminada && !f.estado.esperando && f.tanda_dia !== hoy && yaEsLaHora(n.hora_preferida, n.zona_horaria, ahora) && !hayBorrador(f);
}

/** Hoy se cerró una respuesta sin abrir la siguiente: queda el acuse guardado y nada abierto. Sale la siguiente ya. */
export function quedoCortada(f: FilaHistoria, hoy: string): boolean {
  return f.estado.fase === 'entrevista' && !f.estado.terminada && !f.estado.esperando && !hayBorrador(f) && !!f.estado.acuse && f.tanda_dia === hoy;
}

/** M8: 2 días sin respuesta a lo abierto, una sola vez por pregunta (también en TEMA-ABIERTO). */
export function tocaM8(f: FilaHistoria, ahora: Date): boolean {
  const e = f.estado;
  return !!e.esperando && !hayBorrador(f) && e.m8En !== e.esperando
    && !!e.abiertaDesde && ahora.getTime() - Date.parse(e.abiertaDesde) >= DIAS_M8 * 86_400_000;
}

export type Trabajo = 'nada' | 'reconciliar' | 'drenar' | 'cierre' | 'tanda' | 'm8';

export async function trabajarNarrador(deps: DepsHistoria, fila: FilaHistoria, n: NarradorHistoria): Promise<Trabajo> {
  if (n.estado !== 'activo') return 'nada';
  const ahora = deps.ahora();
  if (tomaVigente(fila, ahora)) return 'nada';
  if ((await reconciliar(deps, fila, n)) > 0) {
    await drenar(deps, n.id);
    return 'reconciliar';
  }
  if (fila.estado.salientes.length > 0) {
    await drenar(deps, n.id);
    return 'drenar';
  }
  if (fila.estado.terminada) return 'nada';
  const hoy = fechaLocal(ahora, n.zona_horaria);

  if (silencioCumplido(fila, ahora)) {
    const sacadas = await leerSacadas(deps.db, n.id);
    const r = await conReintento(deps.db, n.id, (f) => {
      if (!silencioCumplido(f, ahora) || tomaVigente(f, ahora)) return null;
      return pasoDeCierre(f, hoy, ahora, sacadas);
    });
    if (!r) return 'nada';
    await despuesDeCerrar(deps, n, r.fila, r.resultado);
    return 'cierre';
  }

  if (tocaTanda(fila, n, ahora, hoy) || quedoCortada(fila, hoy)) {
    const sacadas = await leerSacadas(deps.db, n.id);
    const r = await conReintento(deps.db, n.id, (f) => {
      const cortada = quedoCortada(f, hoy);
      if ((!tocaTanda(f, n, ahora, hoy) && !cortada) || tomaVigente(f, ahora)) return null;
      const sigue = avanzar(f.estado, fichaTexto(f), sacadas);
      return {
        cambio: {
          estado: sigue.abrio ? { ...sigue.estado, abiertaDesde: ahora.toISOString() } : sigue.estado,
          tanda_dia: hoy,
          tanda_cuenta: (cortada ? cuentaDeHoy(f, hoy) : 0) + (sigue.abrio ? 1 : 0),
        },
        resultado: true,
      };
    });
    if (!r) return 'nada';
    await drenar(deps, n.id);
    return 'tanda';
  }

  if (tocaM8(fila, ahora)) {
    const r = await conReintento(deps.db, n.id, (f) => {
      if (!tocaM8(f, ahora) || tomaVigente(f, ahora)) return null;
      const conM8 = encolar(f.estado, { texto: textoDelBanco('M8', fichaTexto(f)), tipo: 'recordatorio' });
      return { cambio: { estado: { ...conM8, m8En: f.estado.esperando } }, resultado: true };
    });
    if (!r) return 'nada';
    await drenar(deps, n.id);
    return 'm8';
  }
  return 'nada';
}

export async function tickHistoria(deps: DepsHistoria): Promise<void> {
  // Primero los narradores activos y después solo SUS filas (el estado completo pesa), como en V3.
  const { data, error } = await deps.db.from('narradores').select('*').eq('estado', 'activo');
  if (error) throw new Error(`reloj historia: no pude leer los narradores: ${error.message}`);
  const porId = new Map(((data as NarradorHistoria[] | null) ?? []).map((n) => [n.id, n]));
  const filas = await listarFilas(deps.db, [...porId.keys()]);
  // Los narradores de una simulación los maneja el script, no el reloj de producción.
  const deProduccion = filas.filter((f) => porId.has(f.narrador_id) && porId.get(f.narrador_id)!.contexto?.simulacion !== true);
  for (const fila of deProduccion) {
    try {
      await trabajarNarrador(deps, fila, porId.get(fila.narrador_id)!);
    } catch (err) {
      // Un narrador que falla no frena a los demás.
      console.error(`reloj historia: falló el narrador ${fila.narrador_id}:`, err);
    }
  }
}
