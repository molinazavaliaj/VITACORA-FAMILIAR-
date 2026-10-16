// Vacía la cola de WhatsApp de un chico de Kids (plan-conexion-bot.md, T3, «Envío»). Mismo molde que
// viaje-v2/enviar.ts: un solo proceso por vez (la toma), de a un mensaje, cada uno que sale se saca de la cola con
// compare-and-swap (insistiendo: Meta ya lo aceptó), uno que falla queda y el tick siguiente reintenta. Ningún texto
// se arma acá: todo sale del motor (banco aprobado) o de las plantillas de Meta (docs/kids/v2/plantillas-meta-kids.md).
//
// A dónde: `chico` → narradores.telefono_whatsapp (el número de las preguntas); `padre` → kids_v2.telefono_padre.
// Cómo: con `plantilla` → plantilla de Meta, en el idioma de Meta de la suya (PLANTILLAS_KIDS: 'es' o, las `_es_es`,
// 'es_ES'; si no está en WA_PLANTILLAS_KIDS_LISTAS, o no es del idioma del chico, queda y se avisa); sin
// plantilla y con botones → botones de respuesta rápida; si no, texto. El texto libre solo sale con la ventana de
// 24 h de ESE número abierta: el del número de las preguntas por `motor.ultimaEntrada`; para el padre en canal A
// siempre está cerrada (si le escribe al bot, padre.ts le contesta aparte, fuera de esta cola). El motor no debería pedirlo nunca: si pasa, queda y se avisa.
// Cuándo: nunca entre las 22 y las 9 (hora de la ficha). El motor no decide nada de noche, pero lo que decidió a las
// 21:59 y no salió (Meta falló, la plantilla se aprobó a las 23) espera a las 9 en la cola (lo encontró la simulación).

import { PLANTILLAS_KIDS, plantillaKidsLista } from '../config.js';
import type { DepsKids } from './deps.js';
import { conReintento, leerFila, soltarTurno, tomarTurno, TOMA_MS, type CambioFila } from './filas.js';
import { completar, despertarDe } from './motor.js';
import { esDeNoche } from './nucleo/horas.js';
import { idiomaDe } from './nucleo/idioma.js';
import { VENTANA_MS } from './nucleo/reglas.js';
import { anotarEnviado, type EstadoBotKids, type FilaKids, type Saliente } from './tipos.js';

export const FALLOS_PARA_AVISAR = 3;
/** La toma no tiene fencing: pasado este tiempo desde que se tomó, no se manda nada más (sale en el tick siguiente). */
export const TIEMPO_MAXIMO_DRENAR_MS = TOMA_MS / 2;

/** ¿Se le puede mandar texto libre a ese número? Solo al número de las preguntas, dentro de las 24 h de su último mensaje. */
export function ventanaAbierta(fila: Pick<FilaKids, 'canal'>, e: EstadoBotKids, s: Pick<Saliente, 'a'>, ahora: Date): boolean {
  if (fila.canal === 'A' && s.a === 'padre') return false;
  const u = e.motor.ultimaEntrada;
  return !!u && ahora.getTime() - Date.parse(u) < VENTANA_MS;
}

export type EnvioKids =
  | { tipo: 'plantilla'; nombre: string; idiomaMeta: string; variables: string[] }
  | { tipo: 'botones'; texto: string; botones: string[] }
  | { tipo: 'texto'; texto: string }
  | { tipo: 'sin-plantilla'; nombre: string }
  /** La plantilla que pidió el motor no es del idioma del chico (no debería pasar: el motor le pone el sufijo de su ficha). */
  | { tipo: 'otro-idioma'; nombre: string; idioma: string }
  | { tipo: 'ventana-cerrada' };

/** Cómo sale este mensaje ahora. Puro, salvo que lee WA_PLANTILLAS_KIDS_LISTAS. */
export function elegirEnvio(fila: Pick<FilaKids, 'canal'>, e: EstadoBotKids, s: Saliente, ahora: Date): EnvioKids {
  if (s.plantilla) {
    const p = PLANTILLAS_KIDS[s.plantilla.nombre];
    if (!p || !plantillaKidsLista(s.plantilla.nombre)) return { tipo: 'sin-plantilla', nombre: s.plantilla.nombre };
    const idioma = idiomaDe(e.motor.ficha);
    if (p.idioma !== idioma) return { tipo: 'otro-idioma', nombre: s.plantilla.nombre, idioma };
    return { tipo: 'plantilla', nombre: p.nombre, idiomaMeta: p.idiomaMeta, variables: s.plantilla.variables };
  }
  if (!ventanaAbierta(fila, e, s, ahora)) return { tipo: 'ventana-cerrada' };
  return s.botones.length > 0 ? { tipo: 'botones', texto: s.texto, botones: s.botones } : { tipo: 'texto', texto: s.texto };
}

export function telefonoDe(fila: Pick<FilaKids, 'telefono_padre'>, telefonoChico: string, s: Pick<Saliente, 'a'>): string {
  return s.a === 'padre' ? fila.telefono_padre : telefonoChico;
}

export type ResultadoDrenar = 'vacio' | 'enviado' | 'ocupado' | 'fallo' | 'sin-plantilla' | 'otro-idioma' | 'ventana-cerrada' | 'noche';

export async function drenar(deps: DepsKids, narradorId: string): Promise<ResultadoDrenar> {
  // Con la cola vacía no se toma el turno (el reloj pasa seguido); sí se arregla el `completado` que haya fallado.
  const antes = await leerFila<FilaKids>(deps.db, narradorId);
  if (!antes?.estado || antes.estado.salida.length === 0) {
    if (antes?.termino_at) await completar(deps, narradorId);
    return 'vacio';
  }
  const inicio = deps.ahora();
  const tomada = await tomarTurno<FilaKids>(deps.db, narradorId, inicio);
  if (!tomada) return 'ocupado';
  try {
    const { data, error } = await deps.db.from('narradores').select('id,telefono_whatsapp,estado').eq('id', narradorId).maybeSingle();
    if (error || !data) throw new Error(`drenar kids: no pude leer el narrador ${narradorId}: ${error?.message ?? 'no existe'}`);
    const telefonoChico = (data as { telefono_whatsapp: string }).telefono_whatsapp;
    let fila: FilaKids = tomada;
    let resultado: ResultadoDrenar = 'vacio';
    while (fila.estado && fila.estado.salida.length > 0) {
      if (deps.ahora().getTime() - inicio.getTime() >= TIEMPO_MAXIMO_DRENAR_MS) return resultado;
      if (esDeNoche(deps.ahora(), fila.ficha.zona)) return resultado === 'vacio' ? 'noche' : resultado;
      const estado: EstadoBotKids = fila.estado;
      const s = estado.salida[0];
      const envio = elegirEnvio(fila, estado, s, deps.ahora());
      if (envio.tipo === 'sin-plantilla') {
        await deps.avisar(`kids-plantilla-${envio.nombre}`, `Falta la plantilla «${envio.nombre}» (Kids)`,
          `${fila.ficha.apodo} (${narradorId}) tiene que recibir ${s.id} como plantilla «${envio.nombre}» y no figura como aprobada en WA_PLANTILLAS_KIDS_LISTAS. Queda en la cola (y lo que viene atrás, también) hasta que se apruebe.`);
        return 'sin-plantilla';
      }
      if (envio.tipo === 'otro-idioma') {
        await deps.avisar(`kids-plantilla-idioma-${narradorId}-${envio.nombre}`, `Kids: una plantilla en otro idioma (${fila.ficha.apodo})`,
          `El motor de Kids pidió mandarle ${s.id} a ${narradorId} con la plantilla «${envio.nombre}», que no es de su idioma (${envio.idioma}). No salió: queda en la cola. El motor no debería pedirlo nunca; hay que verlo.`);
        return 'otro-idioma';
      }
      if (envio.tipo === 'ventana-cerrada') {
        await deps.avisar(`kids-ventana-${narradorId}-${s.envio}`, `Kids: un texto libre con la ventana de 24 h cerrada (${fila.ficha.apodo})`,
          `El motor de Kids pidió mandarle ${s.id} (envío ${s.envio}) como texto libre al ${s.a === 'padre' ? 'padre' : 'número de las preguntas'} de ${narradorId}, y la ventana de 24 h de ese número está cerrada (canal ${fila.canal}). No salió: queda en la cola hasta que ese número escriba. El motor no debería pedirlo nunca; hay que verlo.`);
        return 'ventana-cerrada';
      }
      const telefono = telefonoDe(fila, telefonoChico, s);
      let waId: string;
      try {
        waId = envio.tipo === 'plantilla' ? await deps.wa.plantilla(telefono, envio.nombre, envio.idiomaMeta, envio.variables)
          : envio.tipo === 'botones' ? await deps.wa.botones(telefono, envio.texto, envio.botones)
          : await deps.wa.texto(telefono, envio.texto);
      } catch (err) {
        await anotarFallo(deps, narradorId, fila.ficha.apodo, err);
        return 'fallo';
      }
      const { error: errorEnvio } = await deps.db.from('envios').insert({ narrador_id: narradorId, tipo: 'kids', pregunta_orden: null, wa_message_id: waId });
      if (errorEnvio) console.warn(`kids: no pude anotar el envío ${waId} de ${narradorId} en envios: ${errorEnvio.message}`);
      resultado = 'enviado';
      const ahora = deps.ahora();
      const r = await sacarDeLaCola(deps, narradorId, (f) => {
        if (!f.estado) return {};
        const e = { ...anotarEnviado(f.estado, s.envio, waId), fallosEnvio: 0, avisoFallos: false };
        return { estado: e, despertar_at: despertarDe(e, ahora) };
      });
      if (!r) return resultado;
      fila = r.fila;
    }
    if (fila.termino_at) await completar(deps, narradorId);
    return resultado;
  } finally {
    await soltarTurno(deps.db, narradorId, tomada);
  }
}

/**
 * Saca lo que ya salió de la cola y anota su id. Meta ya lo aceptó: si la escritura pierde (llegó un audio en el
 * medio), se insiste acá en vez de soltar la toma, porque el tick siguiente lo volvería a mandar.
 */
async function sacarDeLaCola(deps: DepsKids, narradorId: string, cambio: (f: FilaKids) => CambioFila<FilaKids>): Promise<{ fila: FilaKids } | null> {
  for (let intento = 1; ; intento++) {
    try {
      return await conReintento<FilaKids, true>(deps.db, narradorId, (f) => ({ cambio: cambio(f), resultado: true }));
    } catch (err) {
      if (intento >= 4) throw err;
      console.warn(`kids: no pude sacar de la cola de ${narradorId} lo que ya salió (intento ${intento}); insisto`);
    }
  }
}

async function anotarFallo(deps: DepsKids, narradorId: string, apodo: string, err: unknown): Promise<void> {
  const detalle = err instanceof Error ? err.message : String(err);
  console.error(`kids: no salió un mensaje a ${narradorId}: ${detalle}`);
  const r = await conReintento<FilaKids, { fallos: number; avisar: boolean }>(deps.db, narradorId, (f) => {
    if (!f.estado) return null;
    const fallos = f.estado.fallosEnvio + 1;
    const avisar = fallos >= FALLOS_PARA_AVISAR && !f.estado.avisoFallos;
    return { cambio: { estado: { ...f.estado, fallosEnvio: fallos, avisoFallos: f.estado.avisoFallos || avisar } }, resultado: { fallos, avisar } };
  });
  if (r?.resultado.avisar) {
    await deps.avisar(`kids-envios-${narradorId}`, `WhatsApp no le llega a ${apodo} (Kids)`,
      `${r.resultado.fallos} envíos seguidos fallaron para ${narradorId}. Último error: ${detalle}. Se sigue reintentando cada minuto.`);
  }
}
