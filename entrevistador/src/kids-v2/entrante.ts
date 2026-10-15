// Lo que llega de un chico de Kids (plan-conexion-bot.md, T3, «Entrante»). Se entra desde procesar.ts, antes de la V3
// y de la Viaje V2: un narrador con fila en `kids_v2` (y que no esté en pendiente_pago) va entero por acá. No se llama
// a ningún modelo (salvo la transcripción).
//
// Solo llega lo del número de las preguntas: en canal A el del chico (el padre no es un narrador, así que lo que él
// escriba no encuentra a nadie); en canal B, el del padre.
//
// Cada mensaje se guarda al llegar (audio a Storage y su transcripción; foto a `fotos`; texto y botón) con su fila en
// `respuestas` (`clave_kids` null), se le pasa al motor como evento con el id de WhatsApp, y el `recibido` del motor
// le pone la clave a la fila (lo de la noche, a las 9, cuando el motor lo aplica). Un botón lleva `aMensaje`: el
// `envio` del mensaje tocado, traducido desde el `context.id` de WhatsApp con `enviados` (decisión 22). Lo que quedó
// en la cola sale ahora.
//
// Antes del arranque (estado null) se guarda la fila con ∅ y se avisa a los socios: no se contesta. Un audio que no
// se pudo bajar: aviso a los socios y ninguna fila (el motor no tiene «audio malo»: no se inventa uno).

import { respuestaDeBoton } from '../v3/nucleo/entrevista/respuesta.js';
import { MARCA_FOTO } from '../v3/tipos.js';
import { anotarTranscripcion, guardarAudioV3, guardarFotoV3, numeroDeLlegada, yaLlego } from '../v3/filas.js';
import type { MensajeEntrante } from '../whatsapp/webhook.js';
import type { DepsKids } from './deps.js';
import { drenar } from './enviar.js';
import { leerFila } from './filas.js';
import { alMotor, ponerClaveKids } from './motor.js';
import { SIN_CLAVE_KIDS, type Contenido, type Evento } from './nucleo/motor.js';
import { envioDe, yaVisto, type FilaKids } from './tipos.js';

export type ChicoKids = { id: string; estado: string; telefono_whatsapp: string; como_le_dicen?: string | null };

/**
 * Un botón cuyo mensaje no reconocemos (no es nuestro, o ya se olvidó de `enviados`): va con un `aMensaje` que no
 * espera nada, así el motor lo trata como viejo (sale con ∅) en vez de hacerlo actuar sobre lo de ahora.
 */
export const A_MENSAJE_DESCONOCIDO = 'desconocido';

/** Marca de un botón en `respuestas.texto_directo` (como la V3: «⟦botón:Dale, vamos⟧»). */
const MARCA_BOTON = respuestaDeBoton('');
const esMarcaDeBoton = (t: string | null) => !!t && t.startsWith(MARCA_BOTON.slice(0, -1));

/**
 * Lo de un mismo chico se procesa de a uno (en este proceso), como en la Viaje V2: cinco fotos que llegan juntas son
 * cinco webhooks a la vez y compitiendo por el compare-and-swap alguna podía quedar afuera. Lo que igual quede sin
 * pasar al motor (el proceso se cayó) lo retoma el reloj (reconciliar).
 */
const colas = new Map<string, Promise<void>>();

function enCola<T>(narradorId: string, trabajo: () => Promise<T>): Promise<T> {
  const antes = colas.get(narradorId) ?? Promise.resolve();
  const esta = antes.catch(() => {}).then(trabajo);
  const guardada = esta.then(() => {}, () => {});
  colas.set(narradorId, guardada);
  void guardada.then(() => { if (colas.get(narradorId) === guardada) colas.delete(narradorId); });
  return esta;
}

export function procesarEntranteKids(deps: DepsKids, n: ChicoKids, m: MensajeEntrante): Promise<void> {
  return enCola(n.id, () => procesarUno(deps, n, m));
}

async function procesarUno(deps: DepsKids, n: ChicoKids, m: MensajeEntrante): Promise<void> {
  const fila = await leerFila<FilaKids>(deps.db, n.id);
  if (!fila) {
    console.warn(`kids: ${n.id} no tiene fila en kids_v2: se ignora el mensaje`);
    return;
  }
  if (yaVisto(fila.estado, m.waMessageId) || (await yaLlego(deps.db, m.waMessageId))) return; // el reintento de Meta
  const ahora = deps.ahora();
  // `ultima_respuesta_at`, como siempre. `alerta_silencio` no se toca: la prende la marca de 8 días y la apaga la web (CONTRATO).
  await deps.db.from('narradores').update({ ultima_respuesta_at: ahora.toISOString() }).eq('id', n.id);
  if (!fila.estado) {
    await guardar(deps, fila, m, SIN_CLAVE_KIDS);
    await deps.avisar(`kids-antes-${n.id}`, `Kids: ${fila.ficha.apodo} escribió antes de arrancar`,
      `Llegó un mensaje (${m.tipo}) de ${n.id} y su Kids todavía no arrancó (narrador en «${n.estado}»). Se guardó en respuestas con clave ∅ y no se le contestó.`);
    return;
  }
  const g = await guardar(deps, fila, m, null);
  if (g === 'duplicado') return;
  if (g === 'sin-audio') {
    await deps.avisar(`kids-audio-${n.id}-${m.waMessageId}`, `Kids: no pude bajar un audio de ${fila.ficha.apodo}`,
      `Meta no dio el audio ${m.waMessageId} de ${n.id}${m.mediaId ? '' : ' (vino sin media id)'}. No quedó fila y el motor no se enteró: si hace falta, hay que pedírselo de nuevo a mano.`);
    return;
  }
  await alMotor(deps, n.id, (f) => [eventoDe(f, g, m)], { visto: m.waMessageId });
  await drenar(deps, n.id);
}

/** Lo que se guardó, para armar el evento con la fila de cada intento (el `aMensaje` sale de sus `enviados`). */
type Guardado = { tipo: 'contenido'; contenido: Contenido } | { tipo: 'boton'; boton: string };

export function eventoDe(f: FilaKids, g: Guardado, m: Pick<MensajeEntrante, 'waMessageId' | 'citaA'>): Evento {
  if (g.tipo === 'contenido') return { tipo: 'respuesta', contenido: g.contenido, id: m.waMessageId };
  const aMensaje = m.citaA === undefined ? undefined : (f.estado ? envioDe(f.estado, m.citaA) : undefined) ?? A_MENSAJE_DESCONOCIDO;
  return { tipo: 'boton', boton: g.boton, id: m.waMessageId, ...(aMensaje !== undefined ? { aMensaje } : {}) };
}

/**
 * Guarda lo que llegó (`clave`: null = lo decide el motor; ∅ = antes del arranque) y dice qué evento es. Un audio
 * que no se pudo bajar no deja fila. Antes del arranque no se transcribe (no va al motor).
 */
async function guardar(deps: DepsKids, fila: FilaKids, m: MensajeEntrante, clave: string | null): Promise<Guardado | 'duplicado' | 'sin-audio'> {
  const narradorId = fila.narrador_id;
  const id = m.waMessageId;
  if (m.tipo === 'audio') {
    if (!m.mediaId) return 'sin-audio';
    let audio: Buffer;
    try {
      audio = await deps.wa.descargar(m.mediaId);
    } catch (err) {
      console.error(`kids: no pude bajar el audio ${id} de ${narradorId}:`, err instanceof Error ? err.message : err);
      return 'sin-audio';
    }
    const llegada = await numeroDeLlegada(deps.db, narradorId);
    const g = await guardarAudioV3(deps.db, narradorId, llegada, audio, id);
    if (!g) return 'duplicado';
    if (clave) {
      await ponerClaveKids(deps, narradorId, id, clave);
      return { tipo: 'contenido', contenido: { tipo: 'audio', seg: 0 } };
    }
    let t: { texto: string; duracionSegundos: number } | null = null;
    // Dos intentos: un error pasajero de OpenAI no deja al motor sin la transcripción («algo preocupante» la lee).
    for (let intento = 1; intento <= 2 && t === null; intento++) {
      try {
        t = await deps.transcribir(audio, { nombre: fila.ficha.apodo, narradorId });
        if (t.texto.trim()) await anotarTranscripcion(deps.db, g.id, t);
      } catch (err) {
        console.error(`kids: no pude transcribir el audio ${id} de ${narradorId} (intento ${intento}):`, err instanceof Error ? err.message : err);
      }
    }
    const transcripcion = t?.texto.trim();
    return { tipo: 'contenido', contenido: { tipo: 'audio', seg: t?.duracionSegundos ?? 0, ...(transcripcion ? { transcripcion } : {}) } };
  }
  if (m.tipo === 'imagen') {
    const llegada = await numeroDeLlegada(deps.db, narradorId);
    if (m.mediaId) {
      try {
        await guardarFotoV3(deps, narradorId, m.mediaId, m.mimeType, m.texto, llegada);
      } catch (err) {
        console.error(`kids: no pude guardar la foto ${id} de ${narradorId}:`, err instanceof Error ? err.message : err);
      }
    }
    const epigrafe = m.texto?.trim();
    const r = await guardarTexto(deps, narradorId, llegada, epigrafe ? `${MARCA_FOTO} ${epigrafe}` : MARCA_FOTO, id, clave, false);
    return r === 'duplicado' ? r : { tipo: 'contenido', contenido: { tipo: 'foto' } };
  }
  const texto = (m.texto ?? '').trim();
  const llegada = await numeroDeLlegada(deps.db, narradorId);
  const r = await guardarTexto(deps, narradorId, llegada, m.esBoton ? respuestaDeBoton(texto) : texto, id, clave, m.esBoton === true);
  if (r === 'duplicado') return r;
  return m.esBoton ? { tipo: 'boton', boton: texto } : { tipo: 'contenido', contenido: { tipo: 'texto', texto } };
}

async function guardarTexto(deps: DepsKids, narradorId: string, llegada: number, texto: string, waId: string, clave: string | null, esBoton: boolean): Promise<'ok' | 'duplicado'> {
  const { error } = await deps.db.from('respuestas')
    .insert({
      narrador_id: narradorId, pregunta_orden: llegada, texto_directo: texto, transcripcion: esBoton ? null : texto,
      es_repregunta: false, wa_message_id: waId, clave_kids: clave,
    })
    .select('id').single();
  if (error?.code === '23505') return 'duplicado';
  if (error) throw new Error(`No pude anotar el mensaje ${waId} de ${narradorId}: ${error.message}`);
  return 'ok';
}

/** Una fila sin clave_kids más vieja que esto la retoma el reloj (el proceso que la guardó se cayó o falló). */
export const RECONCILIAR_MS = 5 * 60_000;

export type FilaRespuesta = {
  id: string; narrador_id: string; wa_message_id: string | null; audio_path: string | null; transcripcion: string | null;
  texto_directo: string | null; duracion_segundos: number | null; recibido_at: string;
};

/** Las filas de `respuestas` sin clave_kids de más de RECONCILIAR_MS de esos chicos, por chico (una consulta para todos). */
export async function respuestasSinClave(deps: DepsKids, ids: readonly string[]): Promise<Map<string, FilaRespuesta[]>> {
  const porChico = new Map<string, FilaRespuesta[]>();
  if (ids.length === 0) return porChico;
  const limite = new Date(deps.ahora().getTime() - RECONCILIAR_MS).toISOString();
  const { data, error } = await deps.db.from('respuestas')
    .select('id,narrador_id,wa_message_id,audio_path,transcripcion,texto_directo,duracion_segundos,recibido_at')
    .in('narrador_id', [...ids]).is('clave_kids', null).lt('recibido_at', limite).order('recibido_at');
  if (error) {
    console.warn(`kids: no pude buscar respuestas sin clave: ${error.message}`);
    return porChico;
  }
  for (const r of (data as FilaRespuesta[] | null) ?? []) {
    if (!r.wa_message_id) continue;
    porChico.set(r.narrador_id, [...(porChico.get(r.narrador_id) ?? []), r]);
  }
  return porChico;
}

/**
 * Lo que se guardó en `respuestas` y no llegó al motor (la fila sin clave_kids): se le pasa ahora. Lo de la noche
 * que el motor tiene guardado (`nocturnos`) no se toca: su clave sale a las 9. Lo que el motor ya tiene (visto) toma
 * la clave de `recibidos` (se perdió la escritura de la clave) o ∅. Un botón no se retoma (∅): sin el `context.id`
 * no se sabe de qué mensaje era, y un botón viejo que actúa sobre lo de ahora es justo lo que no tiene que pasar.
 * Devuelve cuántas pasó al motor.
 */
export async function reconciliar(deps: DepsKids, narradorId: string, pendientes: readonly FilaRespuesta[]): Promise<number> {
  const fila = await leerFila<FilaKids>(deps.db, narradorId);
  if (!fila?.estado) return 0;
  const enLaNoche = new Set(fila.estado.motor.nocturnos.flatMap((ev) => (ev.tipo === 'respuesta' || ev.tipo === 'boton') && ev.id ? [ev.id] : []));
  let n = 0;
  for (const r of pendientes) {
    const id = r.wa_message_id;
    if (!id || enLaNoche.has(id)) continue;
    if (yaVisto(fila.estado, id)) {
      await ponerClaveKids(deps, narradorId, id, fila.estado.recibidos.find((x) => x.id === id)?.clave ?? SIN_CLAVE_KIDS);
      continue;
    }
    if (esMarcaDeBoton(r.texto_directo)) {
      console.warn(`kids: el botón ${id} de ${narradorId} quedó sin pasar al motor; se anota ∅`);
      await ponerClaveKids(deps, narradorId, id, SIN_CLAVE_KIDS);
      continue;
    }
    const transcripcion = r.transcripcion?.trim();
    const contenido: Contenido = r.audio_path ? { tipo: 'audio', seg: r.duracion_segundos ?? 0, ...(transcripcion ? { transcripcion } : {}) }
      : r.texto_directo?.startsWith(MARCA_FOTO) ? { tipo: 'foto' }
      : { tipo: 'texto', texto: r.texto_directo ?? '' };
    console.warn(`kids: retomo la respuesta ${r.id} de ${narradorId}, que quedó sin pasar al motor`);
    await alMotor(deps, narradorId, () => [{ tipo: 'respuesta', contenido, id }], { visto: id });
    n++;
  }
  return n;
}

/** El reloj: retoma lo pendiente de un chico en la misma cola que lo que llega. */
export function reconciliarEnCola(deps: DepsKids, narradorId: string, pendientes: readonly FilaRespuesta[]): Promise<number> {
  return enCola(narradorId, () => reconciliar(deps, narradorId, pendientes));
}
