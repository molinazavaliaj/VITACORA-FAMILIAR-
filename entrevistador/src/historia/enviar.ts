// Vacía la cola de WhatsApp de un narrador de historia. Copia de src/v3/enviar.ts: un solo proceso por vez (la
// toma); cada mensaje que sale se saca de la cola con compare-and-swap; uno que falla queda y el tick siguiente
// reintenta. Ningún texto se arma acá: salen de la cola, que llenó turno.ts con textos del banco. Fuera de la
// ventana de 24 h van las plantillas de historia (PLANTILLAS_HISTORIA: `pregunta` y `recordatorio` son las de V3).

import { PLANTILLAS_HISTORIA, type CualPlantillaHistoria } from '../config.js';
import { plantillaLista as plantillaListaV3 } from '../v3/enviar.js';
import type { DepsHistoria } from './deps.js';
import { conReintento, soltarTurno, tomarTurno, TOMA_MS } from './estado.js';
import { claveMadre } from './filas.js';
import { preguntaPorId } from './nucleo/entrevista/banco.js';
import type { Idioma } from './nucleo/entrevista/idioma.js';
import type { EstadoHistoria, FilaHistoria } from './tipos.js';
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

export { PLANTILLAS_HISTORIA } from '../config.js';

/**
 * ¿La plantilla está aprobada en Meta? `pregunta` y `recordatorio` son las de la V3 (WA_PLANTILLAS_V3_LISTAS, y la
 * pregunta de es-AR siempre); las bienvenidas de historia, con WA_PLANTILLAS_HISTORIA_LISTAS (`es-AR:bienvenida,…`).
 */
export function plantillaListaHistoria(idioma: Idioma, cual: CualPlantillaHistoria, env: NodeJS.ProcessEnv = process.env): boolean {
  if (cual === 'pregunta' || cual === 'recordatorio') return plantillaListaV3(idioma, cual, env);
  return (env.WA_PLANTILLAS_HISTORIA_LISTAS ?? '').split(',').map((s) => s.trim()).includes(`${idioma}:${cual}`);
}

export function ventanaAbierta(e: Pick<EstadoHistoria, 'ultimoEntranteAt'>, ahora: Date): boolean {
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
  | { tipo: 'sin-plantilla'; cual: 'pregunta' | 'recordatorio'; nombre: string }
  /**
   * La bienvenida como texto ya no sale (se cerró la ventana): se saca de la cola junto con su marca, y la plantilla
   * de bienvenida la manda el tick del scheduler (historia/bienvenida.ts, atenderInvitado).
   */
  | { tipo: 'descartar'; ids: number[] };

/** Qué sale ahora de la cola (no vacía). Puro, salvo que lee las listas de plantillas aprobadas. */
export function elegirEnvio(fila: FilaHistoria, ahora: Date): Envio {
  const pendientes = fila.estado.salientes;
  if (ventanaAbierta(fila.estado, ahora)) {
    const s = pendientes[0];
    if (s.botones && s.botones.length > 0 && s.texto.length <= LARGO_MAXIMO_BOTONES) return { tipo: 'botones', texto: s.texto, botones: s.botones, ids: [s.id] };
    return { tipo: 'texto', texto: s.texto, ids: [s.id] };
  }
  const bienvenidas = pendientes.filter((s) => s.tipo === 'bienvenida').map((s) => s.id);
  if (bienvenidas.length > 0) return { tipo: 'descartar', ids: bienvenidas };
  const soloRecordatorio = pendientes.every((s) => s.tipo === 'recordatorio');
  const cual = soloRecordatorio ? 'recordatorio' : 'pregunta';
  const p = PLANTILLAS_HISTORIA[fila.idioma][cual];
  if (!plantillaListaHistoria(fila.idioma, cual)) return { tipo: 'sin-plantilla', cual, nombre: p.nombre };
  const ids = pendientes.map((s) => s.id); // lo que no va en la plantilla se descarta: no sale después
  if (soloRecordatorio) return { tipo: 'plantilla', nombre: p.nombre, idiomaMeta: p.idiomaMeta, variables: [fila.ficha.nombre], ids, abierta: false };
  // Con una pregunta abierta, la plantilla lleva SOLO esa pregunta: sin acuse, M1 ni M31
  // (armarTurno la pone primera en preguntaAbierta.partes).
  const abierta = fila.estado.esperando ? fila.estado.preguntaAbierta?.partes[0]?.texto : undefined;
  const variable = abierta !== undefined
    ? paraPlantilla([abierta])
    : paraPlantilla(pendientes.filter((s) => s.tipo !== 'recordatorio').map((s) => s.texto));
  return { tipo: 'plantilla', nombre: p.nombre, idiomaMeta: p.idiomaMeta, variables: [variable], ids, abierta: abierta !== undefined };
}

export type ResultadoDrenar = 'vacio' | 'enviado' | 'ocupado' | 'fallo' | 'sin-plantilla';

export async function drenar(deps: DepsHistoria, narradorId: string): Promise<ResultadoDrenar> {
  const inicio = deps.ahora();
  const tomada = await tomarTurno(deps.db, narradorId, inicio);
  if (!tomada) return 'ocupado';
  let mailAcepto = false;
  try {
    const { data, error } = await deps.db.from('narradores').select('id,telefono_whatsapp,contexto').eq('id', narradorId).maybeSingle();
    if (error || !data) throw new Error(`drenar: no pude leer el narrador ${narradorId}: ${error?.message ?? 'no existe'}`);
    const telefono = (data as { telefono_whatsapp: string }).telefono_whatsapp;
    const contexto = (data as { contexto?: Record<string, unknown> | null }).contexto ?? {};
    let fila = tomada;
    let resultado: ResultadoDrenar = 'vacio';
    while (fila.estado.salientes.length > 0) {
      if (deps.ahora().getTime() - inicio.getTime() >= TIEMPO_MAXIMO_DRENAR_MS) return resultado;
      const envio = elegirEnvio(fila, deps.ahora());
      if (envio.tipo === 'descartar') {
        const r = await conReintento(deps.db, narradorId, (f) => {
          const sin = quitarSalientes(f.estado, envio.ids);
          const sinMarca = sin.fase === 'bienvenida' && sin.bienvenida?.por === 'texto' ? { ...sin, bienvenida: undefined } : sin;
          return { cambio: { estado: sinMarca }, resultado: true };
        });
        if (!r) return resultado;
        fila = r.fila;
        continue;
      }
      if (envio.tipo === 'sin-plantilla') {
        await deps.avisar(
          `plantilla-${fila.idioma}-${envio.cual}`,
          `Falta la plantilla «${envio.nombre}» (${fila.idioma})`,
          `La historia de ${narradorId} está fuera de la ventana de 24 h y la plantilla «${envio.nombre}» no figura como aprobada en WA_PLANTILLAS_V3_LISTAS. No se manda en otro idioma: el mensaje queda en la cola hasta que el narrador escriba o se apruebe la plantilla.`,
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
      const { error: errorEnvio } = await deps.db.from('envios').insert({ narrador_id: narradorId, tipo: 'historia', pregunta_orden: null, wa_message_id: waId });
      if (errorEnvio) console.warn(`historia: no pude anotar el envío ${waId} de ${narradorId} en envios: ${errorEnvio.message}`);
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
    // El mail «dijo que sí» de un regalo (como en V3): sale cuando la cola se vacía después de mandar lo que siguió
    // al SÍ (TEMA-ABIERTO, o COMO y la primera pregunta). mandarHito lo manda una sola vez. Solo si todavía no
    // contestó nada.
    mailAcepto = resultado === 'enviado' && contexto.regalo === true && fila.estado.fase !== 'bienvenida' && fila.estado.respuestas.length === 0
      && !(Array.isArray(contexto.mailsEnviados) && contexto.mailsEnviados.includes('acepto'));
    if (fila.estado.terminada) await completar(deps, narradorId, fila.estado);
    return resultado;
  } finally {
    await soltarTurno(deps.db, narradorId, tomada);
    if (mailAcepto) await deps.hito(narradorId, 'acepto');
  }
}

async function anotarFallo(deps: DepsHistoria, narradorId: string, err: unknown): Promise<void> {
  const detalle = err instanceof Error ? err.message : String(err);
  console.error(`historia: no salió un mensaje a ${narradorId}: ${detalle}`);
  const r = await conReintento(deps.db, narradorId, (f) => {
    const fallos = f.estado.fallosEnvio + 1;
    const avisar = fallos >= FALLOS_PARA_AVISAR && !f.estado.avisoFallos;
    return { cambio: { estado: { ...f.estado, fallosEnvio: fallos, avisoFallos: f.estado.avisoFallos === true || avisar } }, resultado: { fallos, avisar } };
  });
  if (r?.resultado.avisar) {
    await deps.avisar(`envios-${narradorId}`, 'WhatsApp no le llega a un narrador de historia',
      `${r.resultado.fallos} envíos seguidos fallaron para ${narradorId}. Último error: ${detalle}. Se sigue reintentando cada minuto.`);
  }
}

/**
 * Las preguntas principales distintas que contestó: las del banco (las repreguntas comparten la clave madre; no
 * cuentan lo que eligió en TEMA-ABIERTO, FOTO-H ni las de quien regala). Es la cuenta que define §8 de los términos.
 */
export function preguntasContestadas(e: Pick<EstadoHistoria, 'respuestas'>): number {
  const madres = e.respuestas.map(([clave]) => claveMadre(clave)).filter((k) => preguntaPorId(k) !== undefined);
  return new Set(madres).size;
}

/**
 * Con menos de esto, los términos (§8) prometen devolver todo: la entrevista
 * terminó sin material para un libro.
 */
export const RESPUESTAS_PARA_UN_LIBRO = 10;

/** FIN-H salió: `activo → completado` (la misma transición de siempre). */
async function completar(deps: DepsHistoria, narradorId: string, estado: EstadoHistoria): Promise<void> {
  const { error } = await deps.db.from('narradores').update({ estado: 'completado' }).eq('id', narradorId).eq('estado', 'activo');
  if (error) console.error(`historia: no pude dejar completado a ${narradorId}: ${error.message}`);
  // Terminó sin material para un libro: corresponde devolver todo, y los
  // términos lo prometen «sin que tengas que pedirlo» (textos aprobados por
  // Naza el 18/10). La devolución es a mano, así que este aviso es lo único
  // que la dispara. Nunca frena el cierre: el aviso va después del update y
  // un fallo suyo no deja a nadie sin completar.
  const contestadas = preguntasContestadas(estado);
  if (contestadas < RESPUESTAS_PARA_UN_LIBRO) {
    await deps.avisar(`sin-material:${narradorId}`,
      `Una entrevista terminó con ${contestadas} respuestas`,
      `${narradorId} terminó la entrevista con ${contestadas} preguntas principales contestadas, `
      + `menos de las ${RESPUESTAS_PARA_UN_LIBRO} que piden los términos (§8).\n\n`
      + 'Corresponde devolverle el dinero a quien compró, completo y sin que lo pida, dentro de los 14 días.',
    ).catch((e) => console.error(`historia: no pude avisar del material de ${narradorId}: ${String(e)}`));
  }
}
