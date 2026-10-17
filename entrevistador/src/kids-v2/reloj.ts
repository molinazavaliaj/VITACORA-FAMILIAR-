// El reloj de Kids V2 (plan-conexion-bot.md, T3, «Reloj»): un tick por minuto, junto al de la Viaje V2. Todo sale
// de la base: si Railway se cae, el tick siguiente retoma (el motor decide qué de lo atrasado sale y qué vence).
//
// No lee el jsonb de todos: solo las filas que despiertan (`despertar_at` vencido, que también marca una cola sin
// vaciar), las que tienen un cambio del panel sin tomar, las que no arrancaron y las que tienen respuestas sin
// clave de hace más de 5 minutos (reconciliar). Por chico: el arranque (si está `invitado` y sin estado), lo que
// quedó sin pasar al motor, el evento `reloj` (con el cambio del panel primero, si hay) y la cola.

import { plantillaKidsLista } from '../config.js';
import type { DepsKids } from './deps.js';
import { drenar } from './enviar.js';
import { reconciliarEnCola, respuestasSinClave, type FilaRespuesta } from './entrante.js';
import { chicosKids, conReintento, filasDelReloj, listarFilas, tomaVigente } from './filas.js';
import { alMotor, arranqueKids, despuesDelPaso, type ResultadoPaso } from './motor.js';
import { fijoEn } from './nucleo/banco.js';
import type { Ficha } from './nucleo/compra.js';
import { idiomaDe } from './nucleo/idioma.js';
import { nuevoEstado } from './nucleo/motor.js';
import { fichaParaArrancar } from './idioma.js';
import { idBienvenida } from './nucleo/motor/recibido.js';
import type { FilaKids } from './tipos.js';

type Narrador = { id: string; estado: string; telefono_whatsapp: string; contexto?: Record<string, unknown> | null };

export type Trabajo = 'nada' | 'arranque' | 'sin-plantillas' | 'reloj' | 'reconciliar' | 'drenar';

/**
 * Las plantillas que necesita el primer mensaje (siempre es plantilla): canal A, la bienvenida del chico (singular o
 * plural según quién se lo regala) y el aviso al padre; canal B, la bienvenida del padre. Los nombres salen del banco
 * del motor en el idioma de la ficha (kids_bienvenida_es_es en es-ES), no de acá.
 */
export function plantillasDelArranque(ficha: Ficha): string[] {
  const e = nuevoEstado(ficha);
  const ids = ficha.canal === 'A' ? [idBienvenida(e), 'AVISO-PADRE' as const] : ['BIEN-PADRE' as const];
  return ids.map((id) => fijoEn(id, idiomaDe(ficha)).plantilla).filter((p): p is string => !!p);
}

/**
 * El arranque (CONTRATO: `invitado → activo`): sin las plantillas del primer mensaje aprobadas no arranca y se avisa
 * a los socios (una vez por día: la clave es la misma). Con ellas: nuevoEstado(ficha, con el cambio del panel
 * aplicado), `inicio`, `empezo_at` y el narrador `activo`. Después, drenar.
 */
export async function arrancar(deps: DepsKids, fila: FilaKids, n: Narrador): Promise<Trabajo> {
  let necesarias: string[];
  try {
    necesarias = plantillasDelArranque(fichaParaArrancar(fila));
  } catch (err) {
    await deps.avisar(`kids-ficha-${n.id}`, `Kids: la ficha de ${n.id} no es válida`,
      `La fila de kids_v2 de ${n.id} tiene una ficha que el motor rechaza (${err instanceof Error ? err.message : String(err)}). No arranca hasta que se corrija.`);
    return 'nada';
  }
  const faltan = necesarias.filter((p) => !plantillaKidsLista(p));
  if (faltan.length) {
    await deps.avisar(`kids-arranque-${n.id}`, `Kids: ${fila.ficha.apodo} no arranca, faltan plantillas`,
      `${fila.ficha.apodo} (${n.id}, canal ${fila.canal}) ya pagó y espera la bienvenida, pero ${faltan.join(', ')} no figura(n) como aprobada(s) en WA_PLANTILLAS_KIDS_LISTAS. Arranca sola apenas se marquen.`);
    return 'sin-plantillas';
  }
  const ahora = deps.ahora();
  const r = await conReintento<FilaKids, ResultadoPaso>(deps.db, n.id, (f) => (tomaVigente(f, ahora) ? null : arranqueKids(f, ahora)));
  if (!r) return 'nada';
  await despuesDelPaso(deps, r.fila, r.resultado);
  const { error } = await deps.db.from('narradores').update({ estado: 'activo' }).eq('id', n.id).eq('estado', 'invitado');
  if (error) console.error(`kids: no pude dejar activo a ${n.id}: ${error.message}`);
  await drenar(deps, n.id);
  return 'arranque';
}

export async function trabajarChico(deps: DepsKids, fila: FilaKids, n: Narrador, pendientes: readonly FilaRespuesta[] = []): Promise<Trabajo> {
  const ahora = deps.ahora();
  if (tomaVigente(fila, ahora)) return 'nada';
  if (!fila.estado) return n.estado === 'invitado' ? arrancar(deps, fila, n) : 'nada';
  // Arrancó pero el narrador quedó en 'invitado' (falló esa escritura): se arregla acá.
  if (n.estado === 'invitado') {
    const { error } = await deps.db.from('narradores').update({ estado: 'activo' }).eq('id', n.id).eq('estado', 'invitado');
    if (error) throw new Error(`reloj kids: ${n.id} arrancó y no lo pude dejar activo: ${error.message}`);
    console.warn(`reloj kids: ${n.id} tenía Kids arrancado y seguía en 'invitado': queda activo`);
  }
  let trabajo: Trabajo = 'nada';
  if (pendientes.length && (await reconciliarEnCola(deps, n.id, pendientes)) > 0) trabajo = 'reconciliar';
  const despierta = fila.cambios_panel !== null || (fila.despertar_at !== null && Date.parse(fila.despertar_at) <= ahora.getTime());
  if (despierta && (await alMotor(deps, n.id, () => [{ tipo: 'reloj' }]))) trabajo = trabajo === 'nada' ? 'reloj' : trabajo;
  const d = await drenar(deps, n.id);
  return trabajo === 'nada' && d !== 'vacio' ? 'drenar' : trabajo;
}

export async function tickKids(deps: DepsKids): Promise<void> {
  const chicos = await chicosKids(deps.db);
  if (chicos.size === 0) return; // sin la migración o sin chicos: nada (y una sola consulta)
  const ahora = deps.ahora();
  const filas = new Map((await filasDelReloj<FilaKids>(deps.db, ahora)).map((f) => [f.narrador_id, f]));
  const pendientes = await respuestasSinClave(deps, [...chicos]);
  const faltan = [...pendientes.keys()].filter((id) => !filas.has(id));
  for (const f of await listarFilas<FilaKids>(deps.db, faltan)) filas.set(f.narrador_id, f);
  if (filas.size === 0) return;
  const { data, error } = await deps.db.from('narradores').select('id,estado,telefono_whatsapp,contexto').in('id', [...filas.keys()]);
  if (error) throw new Error(`reloj kids: no pude leer los narradores: ${error.message}`);
  const porId = new Map(((data as Narrador[] | null) ?? []).map((n) => [n.id, n]));
  for (const fila of filas.values()) {
    const n = porId.get(fila.narrador_id);
    // Sin pagar, el entrevistador no toca la fila (CONTRATO).
    if (!n || n.estado === 'pendiente_pago') continue;
    // Los de una simulación los maneja su script, no el reloj de producción.
    if (n.contexto?.simulacion === true) continue;
    try {
      await trabajarChico(deps, fila, n, pendientes.get(fila.narrador_id));
    } catch (err) {
      console.error(`reloj kids: falló el chico ${fila.narrador_id}:`, err);
    }
  }
}
