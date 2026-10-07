// El reloj de la entrevista V3 (spec 2026-10-07, "El reloj"): un tick por
// minuto. Todo sale de la base (ningún setTimeout en memoria): si Railway se
// cae, el tick siguiente retoma. Por narrador activo, en orden: la cola que
// quedó, el cierre por 3' de silencio, la tanda del día a su hora (sin reenviar
// la pendiente) y M8 a los 2 días sin respuesta.

import { ritmoDe } from '../flujo/ritmo.js';
import { fechaLocal } from '../flujo/tiempo.js';
import { lanzarCazador } from './cazador.js';
import type { DepsV3 } from './deps.js';
import { drenar } from './enviar.js';
import { conReintento, listarFilas, tomaVigente } from './estado.js';
import { aplicarTanda, hitosDe, puedeAbrirHoy, yaEsLaHora } from './tanda.js';
import { fichaTexto, type FilaV3, type NarradorV3 } from './tipos.js';
import { avanzar, cerrarYSeguir, encolar, textoDelBanco } from './turno.js';

/** Una respuesta se cierra a los 3' de silencio desde que se guardó su última transcripción. */
export const SILENCIO_MS = 180_000;
/** M8 sale a los 2 días sin respuesta a la pregunta abierta (Naza, 07/10). */
export const DIAS_M8 = 2;

const hayBorrador = (f: FilaV3) => !!f.estado.borrador?.trim();

/**
 * 3' sin audio nuevo desde que se guardó la última transcripción. Sin borrador
 * no hay nada que cerrar: si tocó "Sí" y todavía no mandó audio, se espera
 * (cerrarRespuesta tiraría en ese estado).
 */
export function silencioCumplido(f: FilaV3, ahora: Date): boolean {
  return !!f.estado.esperando && hayBorrador(f) && !!f.ultimo_audio_at && ahora.getTime() - Date.parse(f.ultimo_audio_at) >= SILENCIO_MS;
}

/** La tanda del día arranca solo si no hay pregunta abierta: la pendiente no se reenvía (Naza, 07/10). */
export function tocaTanda(f: FilaV3, n: NarradorV3, ahora: Date, hoy: string): boolean {
  return !f.estado.terminada && !f.estado.esperando && f.tanda_dia !== hoy && yaEsLaHora(n.hora_preferida, n.zona_horaria, ahora) && !hayBorrador(f);
}

/**
 * M8: 2 días sin respuesta a la abierta, una sola vez por pregunta. Un "Sí"
 * tocado sin audio no es respuesta (cerrarRespuesta no lo cierra): también le sale.
 */
export function tocaM8(f: FilaV3, ahora: Date): boolean {
  const e = f.estado;
  return !!e.esperando && !hayBorrador(f) && e.m8En !== e.esperando
    && !!e.abiertaDesde && ahora.getTime() - Date.parse(e.abiertaDesde) >= DIAS_M8 * 86_400_000;
}

export type Trabajo = 'nada' | 'drenar' | 'cierre' | 'tanda' | 'm8';

export async function trabajarNarrador(deps: DepsV3, fila: FilaV3, n: NarradorV3): Promise<Trabajo> {
  if (n.estado !== 'activo') return 'nada';
  const ahora = deps.ahora();
  if (tomaVigente(fila, ahora)) return 'nada';
  if (fila.estado.salientes.length > 0) {
    await drenar(deps, n.id);
    return 'drenar';
  }
  if (fila.estado.terminada) return 'nada';
  const hoy = fechaLocal(ahora, n.zona_horaria);
  const ritmo = ritmoDe(n.contexto);

  if (silencioCumplido(fila, ahora)) {
    const r = await conReintento(deps.db, n.id, (f) => {
      if (!silencioCumplido(f, ahora) || tomaVigente(f, ahora)) return null;
      const s = cerrarYSeguir(f.estado, fichaTexto(f), puedeAbrirHoy(f, ritmo, hoy));
      const t = aplicarTanda(f, s.estado, hoy, s.abrio, ahora);
      return { cambio: { estado: t.estado, ultimo_audio_at: null, tanda_dia: t.tanda_dia, tanda_cuenta: t.tanda_cuenta }, resultado: s.bloqueCerrado };
    });
    if (!r) return 'nada';
    await drenar(deps, n.id);
    if (r.resultado !== undefined) lanzarCazador(deps, n.id, r.resultado);
    for (const hito of hitosDe(r.fila.estado)) await deps.hito(n.id, hito);
    return 'cierre';
  }

  if (tocaTanda(fila, n, ahora, hoy)) {
    const r = await conReintento(deps.db, n.id, (f) => {
      if (!tocaTanda(f, n, ahora, hoy) || tomaVigente(f, ahora)) return null;
      // Sigue con la próxima (con el acuse pendiente pegado arriba).
      const sigue = avanzar(f.estado, fichaTexto(f));
      return {
        cambio: {
          estado: sigue.abrio ? { ...sigue.estado, abiertaDesde: ahora.toISOString() } : sigue.estado,
          tanda_dia: hoy,
          tanda_cuenta: sigue.abrio ? 1 : 0,
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

export async function tickV3(deps: DepsV3): Promise<void> {
  const filas = await listarFilas(deps.db);
  if (filas.length === 0) return;
  const { data, error } = await deps.db.from('narradores').select('*').in('id', filas.map((f) => f.narrador_id));
  if (error) throw new Error(`reloj V3: no pude leer los narradores: ${error.message}`);
  const porId = new Map(((data as NarradorV3[] | null) ?? []).map((n) => [n.id, n]));
  for (const fila of filas) {
    const n = porId.get(fila.narrador_id);
    if (!n) continue;
    try {
      await trabajarNarrador(deps, fila, n);
    } catch (err) {
      // Un narrador que falla no frena a los demás (como `aislado` del scheduler viejo).
      console.error(`reloj V3: falló el narrador ${fila.narrador_id}:`, err);
    }
  }
}
