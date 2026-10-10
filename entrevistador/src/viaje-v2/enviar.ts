// Vacía la cola de WhatsApp de un viajero V2 (plan-conexion-bot.md, "Ventana de 24 h"). Mismo molde que v3/enviar.ts:
// un solo proceso por vez (la toma), cada mensaje que sale se saca de la cola con compare-and-swap, uno que falla
// queda y el tick siguiente reintenta. Ningún texto se arma acá: salen del planificador (banco aprobado) o de las
// plantillas de Meta aprobadas (docs/viajes-v2/plantillas-meta.md).
//
// Ventana abierta (la persona escribió hace menos de 24 h): todo va como texto libre, y la ❤️ como reacción.
// Ventana cerrada: lo pendiente va en UNA plantilla (`mensaje_viaje_v2` con el mensaje en una línea, o
// `recordatorio_viaje_v2` / `recordatorio_viaje_ultima_v2` si es solo el REC1); las ❤️ se descartan (Meta no las
// acepta fuera de la ventana). Sin la plantilla aprobada, no sale nada, queda en la cola y se avisa a los socios.

import { PLANTILLAS_VIAJE_V2, plantillaViajeLista, type CualPlantillaViaje } from '../config.js';
import { paraPlantilla, VENTANA_MS } from '../v3/enviar.js';
import type { DepsViaje } from './deps.js';
import { conReintento, soltarTurno, tomarTurno, TOMA_MS } from './filas.js';
import { quitarDeSalida, ultimoEntrante, type EstadoBotViaje, type FilaViaje } from './tipos.js';

export const FALLOS_PARA_AVISAR = 3;
/** La toma no tiene fencing: pasado este tiempo desde que se tomó, no se manda nada más (sale en el tick siguiente). */
export const TIEMPO_MAXIMO_DRENAR_MS = TOMA_MS / 2;

export function ventanaAbierta(e: EstadoBotViaje, ahora: Date): boolean {
  const u = ultimoEntrante(e);
  return !!u && ahora.getTime() - Date.parse(u) < VENTANA_MS;
}

export type EnvioViaje =
  | { tipo: 'texto'; texto: string; ids: string[] }
  | { tipo: 'reaccion'; aMensaje: string; emoji: string; ids: string[] }
  | { tipo: 'plantilla'; cual: CualPlantillaViaje; nombre: string; idiomaMeta: string; variables: string[]; ids: string[] }
  /** Lo que no puede salir nunca (una ❤️ sin mensaje, o con la ventana cerrada): se saca de la cola sin mandar. */
  | { tipo: 'descartar'; ids: string[]; motivo: string }
  | { tipo: 'sin-plantilla'; cual: CualPlantillaViaje; nombre: string };

/** Qué sale ahora de la cola (no vacía). Puro, salvo que lee WA_PLANTILLAS_VIAJE_V2_LISTAS. */
export function elegirEnvio(fila: FilaViaje, ahora: Date): EnvioViaje {
  const cola = fila.estado.salida;
  const s = cola[0];
  if (ventanaAbierta(fila.estado, ahora)) {
    if (s.tipo === 'reaccion') {
      return s.aMensaje ? { tipo: 'reaccion', aMensaje: s.aMensaje, emoji: s.emoji ?? '❤️', ids: [s.id] } : { tipo: 'descartar', ids: [s.id], motivo: 'una ❤️ sin mensaje al que reaccionar' };
    }
    return { tipo: 'texto', texto: s.texto, ids: [s.id] };
  }
  const conTexto = cola.filter((x) => x.tipo !== 'reaccion');
  if (conTexto.length === 0) return { tipo: 'descartar', ids: cola.map((x) => x.id), motivo: 'las ❤️ no salen con la ventana de 24 h cerrada' };
  const idioma = fila.idioma;
  const soloRecordatorio = conTexto.every((x) => x.tipo === 'recordatorio');
  const cual: CualPlantillaViaje = !soloRecordatorio ? 'mensaje' : conTexto.some((x) => x.ids.includes('REC1-U')) ? 'recordatorio_ultima' : 'recordatorio';
  const p = PLANTILLAS_VIAJE_V2[idioma][cual];
  if (!plantillaViajeLista(idioma, cual)) return { tipo: 'sin-plantilla', cual, nombre: p.nombre };
  // Todo lo pendiente va en esta plantilla (o se descarta, como las ❤️): no sale después.
  const ids = cola.map((x) => x.id);
  const nombre = fila.compra.nombre;
  if (soloRecordatorio) return { tipo: 'plantilla', cual, nombre: p.nombre, idiomaMeta: p.idiomaMeta, variables: [nombre], ids };
  const mensaje = paraPlantilla(conTexto.filter((x) => x.tipo !== 'recordatorio').map((x) => x.texto));
  return { tipo: 'plantilla', cual, nombre: p.nombre, idiomaMeta: p.idiomaMeta, variables: [nombre, mensaje], ids };
}

export type ResultadoDrenar = 'vacio' | 'enviado' | 'ocupado' | 'fallo' | 'sin-plantilla';

export async function drenar(deps: DepsViaje, narradorId: string): Promise<ResultadoDrenar> {
  const inicio = deps.ahora();
  const tomada = await tomarTurno<FilaViaje['compra'], EstadoBotViaje>(deps.db, narradorId, inicio);
  if (!tomada) return 'ocupado';
  try {
    const { data, error } = await deps.db.from('narradores').select('id,telefono_whatsapp,estado').eq('id', narradorId).maybeSingle();
    if (error || !data) throw new Error(`drenar viaje: no pude leer el narrador ${narradorId}: ${error?.message ?? 'no existe'}`);
    const telefono = (data as { telefono_whatsapp: string }).telefono_whatsapp;
    let fila: FilaViaje = tomada;
    let resultado: ResultadoDrenar = 'vacio';
    while (fila.estado.salida.length > 0) {
      if (deps.ahora().getTime() - inicio.getTime() >= TIEMPO_MAXIMO_DRENAR_MS) return resultado;
      const envio = elegirEnvio(fila, deps.ahora());
      if (envio.tipo === 'sin-plantilla') {
        await deps.avisar(
          `viaje-plantilla-${fila.idioma}-${envio.cual}`,
          `Falta la plantilla «${envio.nombre}» (${fila.idioma})`,
          `El viaje V2 de ${fila.compra.nombre} (${narradorId}) tiene un mensaje para mandar con la ventana de 24 h cerrada y la plantilla «${envio.nombre}» no figura como aprobada en WA_PLANTILLAS_VIAJE_V2_LISTAS. Queda en la cola hasta que la persona escriba o se apruebe la plantilla.`,
        );
        return 'sin-plantilla';
      }
      if (envio.tipo !== 'descartar') {
        let waId: string;
        try {
          waId = envio.tipo === 'texto' ? await deps.wa.texto(telefono, envio.texto)
            : envio.tipo === 'reaccion' ? await deps.wa.reaccion(telefono, envio.aMensaje, envio.emoji)
            : await deps.wa.plantilla(telefono, envio.nombre, envio.idiomaMeta, envio.variables);
        } catch (err) {
          // Una ❤️ que Meta rechaza no frena la cola: no es un mensaje que la persona espere.
          if (envio.tipo === 'reaccion') {
            console.warn(`viaje V2: la ❤️ a ${narradorId} no salió y se descarta: ${err instanceof Error ? err.message : err}`);
            const r = await conReintento<FilaViaje['compra'], EstadoBotViaje, true>(deps.db, narradorId, (f) => ({ cambio: { estado: quitarDeSalida(f.estado, envio.ids) }, resultado: true }));
            if (!r) return resultado;
            fila = r.fila;
            continue;
          }
          await anotarFallo(deps, narradorId, fila.compra.nombre, err);
          return 'fallo';
        }
        const { error: errorEnvio } = await deps.db.from('envios').insert({ narrador_id: narradorId, tipo: 'viaje_v2', pregunta_orden: null, wa_message_id: waId });
        if (errorEnvio) console.warn(`viaje V2: no pude anotar el envío ${waId} de ${narradorId} en envios: ${errorEnvio.message}`);
        resultado = 'enviado';
      } else console.warn(`viaje V2: se descarta de la cola de ${narradorId}: ${envio.motivo}`);
      const r = await conReintento<FilaViaje['compra'], EstadoBotViaje, true>(deps.db, narradorId, (f) => ({
        cambio: { estado: { ...quitarDeSalida(f.estado, envio.ids), ...(envio.tipo === 'descartar' ? {} : { fallosEnvio: 0, avisoFallos: false }) } },
        resultado: true,
      }));
      if (!r) return resultado;
      fila = r.fila;
    }
    if (fila.estado.plan?.terminado) await completar(deps, narradorId);
    return resultado;
  } finally {
    await soltarTurno(deps.db, narradorId, tomada);
  }
}

async function anotarFallo(deps: DepsViaje, narradorId: string, nombre: string, err: unknown): Promise<void> {
  const detalle = err instanceof Error ? err.message : String(err);
  console.error(`viaje V2: no salió un mensaje a ${narradorId}: ${detalle}`);
  const r = await conReintento<FilaViaje['compra'], EstadoBotViaje, { fallos: number; avisar: boolean }>(deps.db, narradorId, (f) => {
    const fallos = f.estado.fallosEnvio + 1;
    const avisar = fallos >= FALLOS_PARA_AVISAR && !f.estado.avisoFallos;
    return { cambio: { estado: { ...f.estado, fallosEnvio: fallos, avisoFallos: f.estado.avisoFallos || avisar } }, resultado: { fallos, avisar } };
  });
  if (r?.resultado.avisar) {
    await deps.avisar(`viaje-envios-${narradorId}`, `WhatsApp no le llega a ${nombre} (viaje V2)`,
      `${r.resultado.fallos} envíos seguidos fallaron para ${narradorId}. Último error: ${detalle}. Se sigue reintentando cada minuto.`);
  }
}

/** DES salió y no queda nada: `activo → completado` (la transición de siempre). */
async function completar(deps: DepsViaje, narradorId: string): Promise<void> {
  const { error } = await deps.db.from('narradores').update({ estado: 'completado' }).eq('id', narradorId).eq('estado', 'activo');
  if (error) console.error(`viaje V2: no pude dejar completado a ${narradorId}: ${error.message}`);
}
