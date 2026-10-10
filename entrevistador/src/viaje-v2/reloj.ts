// El reloj de la Viaje V2 (plan-conexion-bot.md, "Reloj"): un tick por minuto, junto al de la V3. Todo sale de la
// base: si Railway se cae, el tick siguiente retoma (el planificador decide qué de lo atrasado sale y qué vence).
// Por viajero con fila: la bienvenida (si todavía no salió), lo que quedó en la cola, y lo que el planificador dice
// que toca a esta hora (cerrar el grupo de respuesta, lo programado, el álbum, los avisos a los socios).

import { PLANTILLAS_VIAJE_V2, plantillaViajeLista } from '../config.js';
import type { DepsViaje } from './deps.js';
import { drenar } from './enviar.js';
import { conReintento, listarFilas, soltarTurno, tomarTurno, tomaVigente } from './filas.js';
import { anotarNotas, mandarAvisos, sumarPaso } from './motor.js';
import { proximaAccion, queToca, type Paso } from './nucleo/planificador.js';
import { textoFormato } from './nucleo/texto.js';
import { idiomaDe } from './nucleo/idioma.js';
import type { Compra } from './nucleo/tipos.js';
import type { EstadoBotViaje, FilaViaje } from './tipos.js';

type Narrador = { id: string; estado: string; telefono_whatsapp: string; contexto?: Record<string, unknown> | null };

export type Trabajo = 'nada' | 'bienvenida' | 'drenar' | 'toca';

/** ¿El planificador tiene algo para esta hora? (proximaAccion ya pasó) */
export function tocaAhora(f: FilaViaje, ahora: Date): boolean {
  if (!f.estado.plan) return false;
  const t = proximaAccion(f.compra, f.estado.plan);
  return t !== null && Date.parse(t) <= ahora.getTime();
}

export async function trabajarViajero(deps: DepsViaje, fila: FilaViaje, n: Narrador): Promise<Trabajo> {
  const ahora = deps.ahora();
  if (tomaVigente(fila, ahora)) return 'nada';
  if (!fila.estado.plan) {
    if (n.estado === 'invitado' && !fila.estado.bienvenida) return (await mandarBienvenida(deps, fila, n)) ? 'bienvenida' : 'nada';
    // Ya escribió o ya se le mandó: lo que quedó en la cola (la bienvenida como texto).
    if (fila.estado.salida.length > 0) {
      await drenar(deps, n.id);
      return 'drenar';
    }
    return 'nada';
  }
  if (n.estado !== 'activo') return 'nada';
  if (tocaAhora(fila, ahora)) {
    const r = await conReintento<Compra, EstadoBotViaje, Paso>(deps.db, n.id, (f) => {
      if (!f.estado.plan || !tocaAhora(f, ahora) || tomaVigente(f, ahora)) return null;
      const p = queToca(f.compra, f.estado.plan, ahora);
      return { cambio: { estado: sumarPaso(f.estado, p) }, resultado: p };
    });
    if (r) {
      anotarNotas(n.id, r.resultado.notas);
      await mandarAvisos(deps, n.id, r.resultado.avisos);
      await drenar(deps, n.id);
      return 'toca';
    }
  }
  if (fila.estado.salida.length > 0) {
    await drenar(deps, n.id);
    return 'drenar';
  }
  return 'nada';
}

/**
 * BIEN-1 / BIEN-1R por plantilla (la persona todavía no escribió: la ventana está cerrada). Sin la plantilla
 * aprobada, no sale nada y se avisa: si la persona escribe primero, la bienvenida sale como texto (entrante.ts).
 * La toma evita que dos procesos la manden a la vez; se anota después de que Meta la aceptó.
 */
export async function mandarBienvenida(deps: DepsViaje, fila: FilaViaje, n: Narrador): Promise<boolean> {
  const c = fila.compra;
  const idioma = idiomaDe(c);
  const cual = c.regalo ? 'bienvenida_regalo' : 'bienvenida';
  const p = PLANTILLAS_VIAJE_V2[idioma][cual];
  if (!plantillaViajeLista(idioma, cual)) {
    await deps.avisar(`viaje-bienvenida-${idioma}-${cual}`, `No sale la bienvenida del viaje V2 en ${idioma}`,
      `${c.nombre} (${n.id}) espera la bienvenida del viaje, pero la plantilla ${p.nombre} no está marcada como aprobada (WA_PLANTILLAS_VIAJE_V2_LISTAS="${idioma}:${cual}"). Sale apenas se marque; si la persona escribe antes, le sale como texto.`);
    return false;
  }
  const ahora = deps.ahora();
  const tomada = await tomarTurno<Compra, EstadoBotViaje>(deps.db, n.id, ahora);
  if (!tomada) return false;
  try {
    if (tomada.estado.bienvenida || tomada.estado.plan) return false;
    const formato = textoFormato(c.formato, idioma);
    const variables = c.regalo ? [c.nombre, c.regalo.quienRegala, formato] : [c.nombre, formato];
    let waId: string;
    try {
      waId = await deps.wa.plantilla(n.telefono_whatsapp, p.nombre, p.idiomaMeta, variables);
    } catch (err) {
      console.error(`viaje V2: no salió la bienvenida de ${n.id}:`, err instanceof Error ? err.message : err);
      await deps.avisar(`viaje-bienvenida-fallo-${n.id}`, `No salió la bienvenida del viaje de ${c.nombre}`,
        `Meta rechazó ${p.nombre} para ${n.id}: ${err instanceof Error ? err.message : String(err)}. Se reintenta cada minuto.`);
      return false;
    }
    await deps.db.from('envios').insert({ narrador_id: n.id, tipo: 'bienvenida', pregunta_orden: null, wa_message_id: waId });
    await conReintento<Compra, EstadoBotViaje, true>(deps.db, n.id, (f) =>
      f.estado.bienvenida ? null : { cambio: { estado: { ...f.estado, bienvenida: { en: ahora.toISOString(), por: 'plantilla' } } }, resultado: true });
    return true;
  } finally {
    await soltarTurno(deps.db, n.id, tomada);
  }
}

export async function tickViajeV2(deps: DepsViaje): Promise<void> {
  // Primero los narradores que pueden tener algo (invitados esperando la bienvenida y activos) y después solo SUS filas.
  const { data, error } = await deps.db.from('narradores').select('id,estado,telefono_whatsapp,contexto').in('estado', ['invitado', 'activo']);
  if (error) throw new Error(`reloj viaje V2: no pude leer los narradores: ${error.message}`);
  const porId = new Map(((data as Narrador[] | null) ?? []).map((n) => [n.id, n]));
  const filas = await listarFilas<Compra, EstadoBotViaje>(deps.db, [...porId.keys()]);
  for (const fila of filas) {
    const n = porId.get(fila.narrador_id);
    if (!n) continue;
    // Los de la simulación (`npm run viaje-v2-simular -- --real`) los maneja el script, no el reloj de producción.
    if (n.contexto?.simulacion === true) continue;
    try {
      await trabajarViajero(deps, fila, n);
    } catch (err) {
      console.error(`reloj viaje V2: falló el viajero ${fila.narrador_id}:`, err);
    }
  }
}
