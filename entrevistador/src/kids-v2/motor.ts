// Entre el motor de Kids (puro, nucleo/motor.ts) y la base (plan-conexion-bot.md, T3: «una función que guarda un
// paso»). Lo que devuelve `paso()` se suma a la fila en UNA escritura con compare-and-swap: el motor nuevo, la cola
// con los mensajes nuevos (sin repetir `envio`), `avance`, `despertar_at`, `termino_at` (la primera vez que
// termino() da true), las marcas nuevas, y el cambio del panel si había uno (se aplica primero, como evento
// `ficha`). Recién cuando la escritura ganó salen los efectos de afuera (despuesDelPaso): `respuestas.clave_kids`
// de cada `recibido`, los avisos de las marcas a los socios, `alerta_silencio` con `silencio-8-dias` y
// `activo → completado` cuando terminó de contar.

import type { DepsKids } from './deps.js';
import { conReintento, type CambioFila, type Paso } from './filas.js';
import { validarFicha } from './nucleo/compra.js';
import { avance, nuevoEstado, paso, proximoDespertar, termino, type Estado, type Evento, type Salida } from './nucleo/motor.js';
import {
  anotarVisto, estadoBotInicial, MAX_RECIBIDOS, sumarMensajes, yaVisto,
  type CambiosPanel, type EstadoBotKids, type FilaKids, type MarcaKids,
} from './tipos.js';

/**
 * `cambios_error` cuando el motor descartó las preguntas del padre porque ya empezó el capítulo 4 (el motor las
 * ignora sin error). Es un código, no un texto: el panel elige qué mostrar.
 */
export const ERROR_PREGUNTAS_CERRADAS = 'preguntas-cerradas';

/** Cómo terminó el cambio del panel que se aplicó en este paso. `tiro`: el motor lo rechazó (datos inválidos). */
export type ResultadoPanel = { cambios: CambiosPanel; error: string | null; tiro: boolean };

export type ResultadoPaso = {
  salidas: Salida[];
  panel: ResultadoPanel | null;
  /** Las marcas que se sumaron en esta escritura y su número (1, 2, 3…, el de `marcas`) para la clave del aviso. */
  marcas: { marca: MarcaKids; n: number }[];
  /** termino() dio true por primera vez (se puso `termino_at`). */
  termino: boolean;
  /** Es el arranque (nuevoEstado + inicio). */
  arranque: boolean;
};

/** Cuándo tiene que pasar el reloj: ya, si quedó algo en la cola; si no, lo que diga el motor. */
export function despertarDe(e: EstadoBotKids, ahora: Date): string | null {
  if (e.salida.length > 0) return ahora.toISOString();
  return proximoDespertar(e.motor, ahora)?.toISOString() ?? null;
}

/**
 * El cambio del panel como evento `ficha` (CONTRATO, «Cambios del panel»). Si el motor tira (datos inválidos), el
 * motor queda como estaba y el error va a `cambios_error`. Si traía preguntas del padre distintas de las que ya
 * tiene y ya no se aceptan (empezó el capítulo 4), se aplica el resto (el motor las ignora) y el error es
 * ERROR_PREGUNTAS_CERRADAS. Puro.
 */
export function aplicarPanel(motor: Estado, cambios: CambiosPanel, ahora: Date): { motor: Estado; salidas: Salida[]; panel: ResultadoPanel } {
  const { pedido_at: _pedido, ...resto } = cambios;
  const evento: Evento = { tipo: 'ficha', cambios: resto };
  const abiertas = avance(motor).preguntasPadreAbiertas;
  let p: ReturnType<typeof paso>;
  try {
    p = paso(motor, evento, ahora.toISOString());
  } catch (err) {
    return { motor, salidas: [], panel: { cambios, error: err instanceof Error ? err.message : String(err), tiro: true } };
  }
  let error: string | null = null;
  if (resto.preguntasPadre !== undefined && !abiertas) {
    // El panel manda la lista completa: si es la misma que ya tenía (cambió solo la hora), no se rechazó nada.
    const pedidas = validarFicha({ ...motor.ficha, preguntasPadre: resto.preguntasPadre }).preguntasPadre;
    if (JSON.stringify(pedidas) !== JSON.stringify(motor.ficha.preguntasPadre)) error = ERROR_PREGUNTAS_CERRADAS;
  }
  return { motor: p.estado, salidas: p.salidas, panel: { cambios, error, tiro: false } };
}

/**
 * Arma la escritura de un paso. Parte de `bot` (el estado guardado, o el inicial del arranque), aplica primero el
 * cambio del panel si la fila tiene uno y después los eventos en orden. Null si no cambió nada (el reloj con una
 * cola trabada, por ejemplo: así no escribe cada minuto).
 */
function armar(fila: FilaKids, bot: EstadoBotKids, eventos: readonly Evento[], ahora: Date, o: { visto?: string; arranque: boolean }): Paso<FilaKids, ResultadoPaso> {
  const iso = ahora.toISOString();
  let motor = bot.motor;
  const salidas: Salida[] = [];
  const cambio: CambioFila<FilaKids> = {};
  let panel: ResultadoPanel | null = null;
  if (fila.cambios_panel !== null && fila.cambios_panel !== undefined) {
    const r = aplicarPanel(motor, fila.cambios_panel, ahora);
    motor = r.motor;
    salidas.push(...r.salidas);
    panel = r.panel;
    cambio.cambios_panel = null; // guardarSiNoCambio le suma la condición: que siga siendo el que se leyó
    cambio.cambios_error = r.panel.error;
  }
  for (const ev of eventos) {
    const p = paso(motor, ev, iso);
    motor = p.estado;
    salidas.push(...p.salidas);
  }
  let nuevo = sumarMensajes({ ...bot, motor }, salidas);
  const recibidos = salidas.flatMap((s) => (s.tipo === 'recibido' ? [{ id: s.id, clave: s.clave }] : []));
  if (recibidos.length) nuevo = { ...nuevo, recibidos: [...nuevo.recibidos, ...recibidos].slice(-MAX_RECIBIDOS) };
  if (o.visto) nuevo = anotarVisto(nuevo, o.visto);
  const despertar = despertarDe(nuevo, ahora);
  const vencido = (x: string | null) => x !== null && Date.parse(x) <= ahora.getTime();
  const igual = !o.arranque && !panel && salidas.length === 0 && !o.visto
    && JSON.stringify(motor) === JSON.stringify(bot.motor)
    && (despertar === fila.despertar_at || (vencido(despertar) && vencido(fila.despertar_at)));
  if (igual) return null;
  const marcas = salidas.flatMap((s, i) => (s.tipo === 'marca' ? [{ motivo: s.motivo, detalle: s.detalle, at: iso, i }] : []))
    .map(({ i: _i, ...marca }, k) => ({ marca, n: (fila.marcas?.length ?? 0) + k + 1 }));
  const fin = termino(motor) && !fila.termino_at;
  cambio.estado = nuevo;
  cambio.avance = avance(motor);
  cambio.despertar_at = despertar;
  if (marcas.length) cambio.marcas = [...(fila.marcas ?? []), ...marcas.map((m) => m.marca)];
  if (fin) cambio.termino_at = iso;
  if (o.arranque) cambio.empezo_at = iso;
  return { cambio, resultado: { salidas, panel, marcas, termino: fin, arranque: o.arranque } };
}

/**
 * Un paso sobre un chico que ya arrancó: los eventos que da `eventos(fila)` (se arman con la fila leída en cada
 * intento del compare-and-swap: el `aMensaje` de un botón sale de sus `enviados`). `visto`: el id de WhatsApp que
 * se procesa (si ya estaba, no hace nada). Puro.
 */
export function pasoKids(fila: FilaKids, eventos: readonly Evento[], ahora: Date, o: { visto?: string } = {}): Paso<FilaKids, ResultadoPaso> {
  if (!fila.estado) return null;
  if (o.visto && yaVisto(fila.estado, o.visto)) return null;
  return armar(fila, fila.estado, eventos, ahora, { visto: o.visto, arranque: false });
}

/** El arranque: nuevoEstado(ficha) (con el cambio del panel aplicado, si había) y el evento `inicio`. Puro; tira si la ficha no es válida. */
export function arranqueKids(fila: FilaKids, ahora: Date): Paso<FilaKids, ResultadoPaso> {
  if (fila.estado) return null;
  return armar(fila, estadoBotInicial(nuevoEstado(fila.ficha)), [{ tipo: 'inicio' }], ahora, { arranque: true });
}

/** Lee, aplica `pasoKids` con compare-and-swap y, si la escritura ganó, saca los efectos de afuera. */
export async function alMotor(
  deps: DepsKids, narradorId: string, eventos: (f: FilaKids) => Evento[], o: { visto?: string } = {},
): Promise<{ fila: FilaKids; resultado: ResultadoPaso } | null> {
  const ahora = deps.ahora();
  const r = await conReintento<FilaKids, ResultadoPaso>(deps.db, narradorId, (f) => pasoKids(f, eventos(f), ahora, o));
  if (r) await despuesDelPaso(deps, r.fila, r.resultado);
  return r;
}

const MOTIVOS: Record<MarcaKids['motivo'], string> = {
  preocupante: 'algo preocupante',
  'silencio-8-dias': 'ocho días sin respuesta',
  'escribio-despues-del-final': 'escribió después del final',
  'cerro-sin-respuesta': 'se cerró solo sin respuesta',
};

/** Lo que va afuera de la fila, después de que la escritura ganó. Nada de esto tira: se loguea. */
export async function despuesDelPaso(deps: DepsKids, fila: FilaKids, r: ResultadoPaso): Promise<void> {
  const id = fila.narrador_id;
  const quien = `${fila.ficha.apodo} (${id})`;
  for (const s of r.salidas) {
    if (s.tipo === 'recibido') await ponerClaveKids(deps, id, s.id, s.clave);
  }
  for (const { marca, n } of r.marcas) {
    await deps.avisar(`kids-${id}-${marca.motivo}-${n}`, `Kids: ${MOTIVOS[marca.motivo]} de ${fila.ficha.apodo}`,
      `El motor de Kids marcó «${marca.motivo}» para ${quien}: ${marca.detalle}. Queda en kids_v2.marcas para el panel de Naza.`);
    if (marca.motivo === 'silencio-8-dias') {
      const { error } = await deps.db.from('narradores').update({ alerta_silencio: true }).eq('id', id);
      if (error) console.error(`kids: no pude prender la alerta de silencio de ${id}: ${error.message}`);
    }
  }
  if (r.panel?.tiro) {
    await deps.avisar(`kids-panel-${id}-${r.panel.cambios.pedido_at ?? 'sin-fecha'}`, `Kids: el motor rechazó un cambio del panel de ${fila.ficha.apodo}`,
      `El cambio del panel de ${quien} (${JSON.stringify(r.panel.cambios)}) no se tomó: ${r.panel.error}. Quedó en kids_v2.cambios_error; el panel tendría que haberlo validado antes.`);
  }
  if (r.termino) await completar(deps, id);
}

/** `activo → completado` (CONTRATO: terminó de contar). Solo desde activo: si ya estaba, no hace nada. */
export async function completar(deps: DepsKids, narradorId: string): Promise<void> {
  const { error } = await deps.db.from('narradores').update({ estado: 'completado' }).eq('id', narradorId).eq('estado', 'activo');
  if (error) console.error(`kids: no pude dejar completado a ${narradorId}: ${error.message}`);
}

/** `respuestas.clave_kids` de la fila de ese mensaje (la decide el motor al aplicarlo: el `recibido`). */
export async function ponerClaveKids(deps: Pick<DepsKids, 'db'>, narradorId: string, waMessageId: string, clave: string): Promise<void> {
  const { error } = await deps.db.from('respuestas').update({ clave_kids: clave }).eq('narrador_id', narradorId).eq('wa_message_id', waMessageId);
  if (error) console.warn(`kids: no pude anotar la clave ${clave} en la respuesta ${waMessageId} de ${narradorId}: ${error.message}`);
}
