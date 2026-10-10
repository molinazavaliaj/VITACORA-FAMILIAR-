// Vacía la cola de WhatsApp de un narrador V3 (spec 2026-10-07, "Ventana de
// 24 h y plantillas" y "Errores"). Un solo proceso por vez (la toma); cada
// mensaje que sale se saca de la cola con compare-and-swap; uno que falla
// queda y el tick siguiente reintenta. Ningún texto se arma acá: salen de la
// cola, que llenó turno.ts con textos del banco.

import { PLANTILLAS_V3 } from '../config.js';
import type { DepsV3 } from './deps.js';
import { conReintento, soltarTurno, tomarTurno, TOMA_MS } from './estado.js';
import type { Idioma } from './nucleo/entrevista/idioma.js';
import type { EstadoV3, FilaV3 } from './tipos.js';
import { quitarSalientes } from './turno.js';

/** La ventana de Meta es de 24 h desde el último mensaje del narrador; se deja media hora de margen. */
export const VENTANA_MS = 24 * 3600_000 - 30 * 60_000;
/** El cuerpo de un mensaje interactivo de Meta admite hasta 1024 caracteres. */
export const LARGO_MAXIMO_BOTONES = 1024;
export const FALLOS_PARA_AVISAR = 3;
/**
 * La toma no tiene fencing: quien manda tiene que terminar bien antes de que
 * venza. Pasado este tiempo desde que se tomó, no se manda nada más; lo que
 * queda en la cola sale en el tick siguiente.
 */
export const TIEMPO_MAXIMO_DRENAR_MS = TOMA_MS / 2;

export { PLANTILLAS_V3, type PlantillaV3 } from '../config.js';

export function plantillaLista(idioma: Idioma, cual: 'pregunta' | 'recordatorio' | 'bienvenida', env: NodeJS.ProcessEnv = process.env): boolean {
  if (idioma === 'es-AR' && cual === 'pregunta') return true;
  return (env.WA_PLANTILLAS_V3_LISTAS ?? '').split(',').map((s) => s.trim()).includes(`${idioma}:${cual}`);
}

export function ventanaAbierta(e: Pick<EstadoV3, 'ultimoEntranteAt'>, ahora: Date): boolean {
  return !!e.ultimoEntranteAt && ahora.getTime() - Date.parse(e.ultimoEntranteAt) < VENTANA_MS;
}

/** Meta no acepta saltos de línea ni más de 4 espacios seguidos en una variable. */
export function enLineaParaPlantilla(textos: string[]): string {
  return textos.join(' ').replace(/\s+/g, ' ').trim();
}

/**
 * Largo seguro de la variable de la plantilla: Meta rechaza un cuerpo largo
 * y un envío rechazado frenaría la cola para siempre.
 */
export const LARGO_MAXIMO_PLANTILLA = 900;

/** En una línea y, si se pasa de LARGO_MAXIMO_PLANTILLA, cortado en el final de una oración (o, si no hay, de una palabra). */
export function paraPlantilla(textos: string[]): string {
  const linea = enLineaParaPlantilla(textos);
  if (linea.length <= LARGO_MAXIMO_PLANTILLA) return linea;
  const corte = linea.slice(0, LARGO_MAXIMO_PLANTILLA);
  const finOracion = Math.max(...['. ', '? ', '! ', '… '].map((f) => corte.lastIndexOf(f)));
  if (finOracion > 0) return corte.slice(0, finOracion + 1);
  const palabra = corte.slice(0, LARGO_MAXIMO_PLANTILLA - 1).lastIndexOf(' ');
  return `${corte.slice(0, palabra > 0 ? palabra : LARGO_MAXIMO_PLANTILLA - 1)}…`;
}

export type Envio =
  | { tipo: 'texto'; texto: string; ids: number[] }
  | { tipo: 'botones'; texto: string; botones: string[]; ids: number[] }
  /** `abierta`: llevó la pregunta abierta (sin botones: al volver a escribir, se le reenvía con ellos). */
  | { tipo: 'plantilla'; nombre: string; idiomaMeta: string; variables: string[]; ids: number[]; abierta: boolean }
  | { tipo: 'sin-plantilla'; cual: 'pregunta' | 'recordatorio'; nombre: string };

/** Qué sale ahora de la cola (no vacía). Puro, salvo que lee WA_PLANTILLAS_V3_LISTAS. */
export function elegirEnvio(fila: FilaV3, ahora: Date): Envio {
  const pendientes = fila.estado.salientes;
  if (ventanaAbierta(fila.estado, ahora)) {
    const s = pendientes[0];
    if (s.botones && s.botones.length > 0 && s.texto.length <= LARGO_MAXIMO_BOTONES) return { tipo: 'botones', texto: s.texto, botones: s.botones, ids: [s.id] };
    return { tipo: 'texto', texto: s.texto, ids: [s.id] };
  }
  const soloRecordatorio = pendientes.every((s) => s.tipo === 'recordatorio');
  const cual = soloRecordatorio ? 'recordatorio' : 'pregunta';
  const p = PLANTILLAS_V3[fila.idioma][cual];
  if (!plantillaLista(fila.idioma, cual)) return { tipo: 'sin-plantilla', cual, nombre: p.nombre };
  const ids = pendientes.map((s) => s.id); // lo que no va en la plantilla se descarta: no sale después
  if (soloRecordatorio) return { tipo: 'plantilla', nombre: p.nombre, idiomaMeta: p.idiomaMeta, variables: [fila.ficha.nombre], ids, abierta: false };
  // Con una pregunta abierta, la plantilla lleva SOLO esa pregunta: sin acuse, entrada, M1 ni M31
  // (armarTurno la pone primera en preguntaAbierta.partes).
  const abierta = fila.estado.esperando ? fila.estado.preguntaAbierta?.partes[0]?.texto : undefined;
  const variable = abierta !== undefined
    ? paraPlantilla([abierta])
    : paraPlantilla(pendientes.filter((s) => s.tipo !== 'recordatorio').map((s) => s.texto));
  return { tipo: 'plantilla', nombre: p.nombre, idiomaMeta: p.idiomaMeta, variables: [variable], ids, abierta: abierta !== undefined };
}

export type ResultadoDrenar = 'vacio' | 'enviado' | 'ocupado' | 'fallo' | 'sin-plantilla';

export async function drenar(deps: DepsV3, narradorId: string): Promise<ResultadoDrenar> {
  const inicio = deps.ahora();
  const tomada = await tomarTurno(deps.db, narradorId, inicio);
  if (!tomada) return 'ocupado';
  try {
    const { data, error } = await deps.db.from('narradores').select('id,telefono_whatsapp').eq('id', narradorId).maybeSingle();
    if (error || !data) throw new Error(`drenar: no pude leer el narrador ${narradorId}: ${error?.message ?? 'no existe'}`);
    const telefono = (data as { telefono_whatsapp: string }).telefono_whatsapp;
    let fila = tomada;
    let resultado: ResultadoDrenar = 'vacio';
    while (fila.estado.salientes.length > 0) {
      if (deps.ahora().getTime() - inicio.getTime() >= TIEMPO_MAXIMO_DRENAR_MS) return resultado;
      const envio = elegirEnvio(fila, deps.ahora());
      if (envio.tipo === 'sin-plantilla') {
        await deps.avisar(
          `plantilla-${fila.idioma}-${envio.cual}`,
          `Falta la plantilla «${envio.nombre}» (${fila.idioma})`,
          `La entrevista V3 de ${narradorId} está fuera de la ventana de 24 h y la plantilla «${envio.nombre}» no figura como aprobada en WA_PLANTILLAS_V3_LISTAS. No se manda en otro idioma: el mensaje queda en la cola hasta que el narrador escriba o se apruebe la plantilla.`,
        );
        return 'sin-plantilla';
      }
      let waId: string;
      try {
        waId = envio.tipo === 'botones' ? await deps.wa.botones(telefono, envio.texto, envio.botones)
          : envio.tipo === 'texto' ? await deps.wa.texto(telefono, envio.texto)
          : await deps.wa.plantilla(telefono, envio.nombre, envio.idiomaMeta, envio.variables);
      } catch (err) {
        await anotarFallo(deps, narradorId, err);
        return 'fallo';
      }
      const { error: errorEnvio } = await deps.db.from('envios').insert({ narrador_id: narradorId, tipo: 'v3', pregunta_orden: null, wa_message_id: waId });
      if (errorEnvio) console.warn(`V3: no pude anotar el envío ${waId} de ${narradorId} en envios: ${errorEnvio.message}`);
      const porPlantilla = envio.tipo === 'plantilla' && envio.abierta;
      const r = await conReintento(deps.db, narradorId, (f) => ({
        cambio: {
          estado: {
            ...quitarSalientes(f.estado, envio.ids), fallosEnvio: 0, avisoFallos: false,
            ...(porPlantilla && f.estado.esperando ? { abiertaPorPlantilla: true } : {}),
          },
        },
        resultado: true,
      }));
      if (!r) return 'enviado';
      fila = r.fila;
      resultado = 'enviado';
    }
    if (fila.estado.terminada) await completar(deps, narradorId);
    return resultado;
  } finally {
    await soltarTurno(deps.db, narradorId, tomada);
  }
}

async function anotarFallo(deps: DepsV3, narradorId: string, err: unknown): Promise<void> {
  const detalle = err instanceof Error ? err.message : String(err);
  console.error(`V3: no salió un mensaje a ${narradorId}: ${detalle}`);
  const r = await conReintento(deps.db, narradorId, (f) => {
    const fallos = f.estado.fallosEnvio + 1;
    const avisar = fallos >= FALLOS_PARA_AVISAR && !f.estado.avisoFallos;
    return { cambio: { estado: { ...f.estado, fallosEnvio: fallos, avisoFallos: f.estado.avisoFallos === true || avisar } }, resultado: { fallos, avisar } };
  });
  if (r?.resultado.avisar) {
    await deps.avisar(`envios-${narradorId}`, 'WhatsApp no le llega a un narrador V3',
      `${r.resultado.fallos} envíos seguidos fallaron para ${narradorId}. Último error: ${detalle}. Se sigue reintentando cada minuto.`);
  }
}

/** FIN salió: `activo → completado` (la misma transición de siempre). */
async function completar(deps: DepsV3, narradorId: string): Promise<void> {
  const { error } = await deps.db.from('narradores').update({ estado: 'completado' }).eq('id', narradorId).eq('estado', 'activo');
  if (error) console.error(`V3: no pude dejar completado a ${narradorId}: ${error.message}`);
}
