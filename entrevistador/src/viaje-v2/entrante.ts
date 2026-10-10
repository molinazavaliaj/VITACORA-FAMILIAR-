// Lo que llega de un viajero V2 (plan-conexion-bot.md, "Entrante"). Se entra desde procesar.ts, antes de todo lo
// viejo: un narrador con fila en `viajes_v2` va entero por acá. No se llama a ningún modelo (salvo la transcripción).
//
// Antes del SÍ: SÍ → arranca (iniciar: BIEN-2 y AS1). Otra cosa → si la bienvenida no le llegó, sale ahora como
// texto (la ventana se acaba de abrir); si ya le llegó, se le repite UNA vez; después, silencio y aviso a los socios.
// Antes del SÍ no se guarda nada de lo que mande: el SÍ es el permiso para guardar.
//
// Después del SÍ: cada mensaje se guarda (audio a Storage y transcripción; foto a `fotos`; texto y botón) con su
// fila en `respuestas`, se le pasa al planificador (alEntrar) y la fila recibe `clave_viaje` = a qué pregunta fue
// ("ALBUM" con el álbum abierto). Las reacciones salen cuando el planificador cierra el grupo (3' de silencio, en el
// reloj). Lo que quedó en la cola sale ahora (la ventana está abierta).

import { MARCA_FOTO } from '../v3/tipos.js';
import { anotarTranscripcion, guardarAudioV3, guardarFotoV3, marcarRespondido, numeroDeLlegada, yaLlego } from '../v3/filas.js';
import type { MensajeEntrante } from '../whatsapp/webhook.js';
import type { DepsViaje } from './deps.js';
import { drenar } from './enviar.js';
import { conReintento, leerFila } from './filas.js';
import { anotarNotas, mandarAvisos, sumarPaso } from './motor.js';
import { arranque } from './nucleo/mensajes.js';
import { idiomaDe } from './nucleo/idioma.js';
import { entender, normalizar } from './nucleo/palabras.js';
import { alEntrar, iniciar, type Entrada, type Paso, type Saliente } from './nucleo/planificador.js';
import type { Compra } from './nucleo/tipos.js';
import { anotarVisto, yaVisto, type EstadoBotViaje, type FilaViaje } from './tipos.js';

export type ViajeroV2 = { id: string; estado: string; telefono_whatsapp: string; como_le_dicen?: string };

/** `respuestas.clave_viaje` de lo que llegó con el álbum abierto. */
export const CLAVE_ALBUM = 'ALBUM';
/** `respuestas.clave_viaje` de lo que se guardó y quedó afuera a propósito (CONTRATO). */
export const SIN_CLAVE_VIAJE = '∅';

/** ¿Dijo que sí? Las palabras del núcleo, y además «Sii», «Siii» (las más comunes que el núcleo no tiene). */
export function esSi(texto: string, compra: Compra): boolean {
  if (entender(texto, idiomaDe(compra)) === 'si') return true;
  const t = normalizar(texto);
  return /^s[ií]+$/.test(t) || /^s[ií]{2,} /.test(t);
}

/** BIEN-1 (o BIEN-1R) como texto libre, para la cola. Ids propios: no chocan con los del planificador (s1, s2…). */
export function bienvenidaComoTexto(compra: Compra, ahora: Date, id: string): Saliente {
  const m = arranque(compra);
  return { id, tipo: 'texto', desde: ahora.toISOString(), zona: compra.zonaCasa, origen: 'arranque', iniciativa: false, ids: m.ids, texto: m.texto };
}

export async function procesarEntranteViajeV2(deps: DepsViaje, n: ViajeroV2, m: MensajeEntrante): Promise<void> {
  const fila = await leerFila<Compra, EstadoBotViaje>(deps.db, n.id);
  if (!fila) {
    console.warn(`viaje V2: ${n.id} no tiene fila en viajes_v2: se ignora el mensaje`);
    return;
  }
  if (yaVisto(fila.estado, m.waMessageId) || (await yaLlego(deps.db, m.waMessageId))) return; // el reintento de Meta
  const ahora = deps.ahora();
  await marcarRespondido(deps.db, n.id, ahora);
  if (!fila.estado.plan) {
    await antesDelSi(deps, n, m, fila, ahora);
    return;
  }
  if (fila.estado.plan.terminado && fila.estado.salida.length === 0) {
    // Después de la despedida: se guarda (las fotos van al panel), sin contestar.
    await guardar(deps, n.id, m, fila, false);
    await conReintento<Compra, EstadoBotViaje, true>(deps.db, n.id, (f) =>
      yaVisto(f.estado, m.waMessageId) ? null : { cambio: { estado: anotarVisto({ ...f.estado, ultimoEntranteAt: ahora.toISOString() }, m.waMessageId) }, resultado: true });
    return;
  }
  const g = await guardar(deps, n.id, m, fila, true);
  if (g === 'duplicado') return;
  const r = await conReintento<Compra, EstadoBotViaje, Paso & { clave: string }>(deps.db, n.id, (f) => {
    if (!f.estado.plan || yaVisto(f.estado, m.waMessageId)) return null;
    const p = alEntrar(f.compra, f.estado.plan, g.entrada, ahora);
    let estado = sumarPaso(anotarVisto(f.estado, m.waMessageId), p);
    // Una foto nueva con el álbum abierto: se recuerda su archivo, para reconocerla si la reenvía (AL3).
    if (g.entrada.tipo === 'foto' && !g.entrada.reenviaA && m.sha256 && p.clave === 'album') {
      estado = { ...estado, fotosAlbum: { ...estado.fotosAlbum, [m.sha256]: m.waMessageId } };
    }
    return { cambio: { estado }, resultado: p };
  });
  if (!r) return;
  if (g.respuestaId) await ponerClaveViaje(deps, g.respuestaId, r.resultado.clave === 'album' ? CLAVE_ALBUM : r.resultado.clave);
  anotarNotas(n.id, r.resultado.notas);
  await mandarAvisos(deps, n.id, r.resultado.avisos);
  await drenar(deps, n.id);
}

async function antesDelSi(deps: DepsViaje, n: ViajeroV2, m: MensajeEntrante, fila: FilaViaje, ahora: Date): Promise<void> {
  const dijoSi = m.tipo === 'texto' && esSi(m.texto ?? '', fila.compra);
  type Que = { que: 'si'; paso: Paso } | { que: 'bienvenida' | 'repetida' | 'nada' };
  const r = await conReintento<Compra, EstadoBotViaje, Que>(deps.db, n.id, (f) => {
    if (f.estado.plan || yaVisto(f.estado, m.waMessageId)) return null;
    const e = anotarVisto({ ...f.estado, ultimoEntranteAt: ahora.toISOString() }, m.waMessageId);
    if (dijoSi) {
      const p = iniciar(f.compra, ahora);
      return { cambio: { estado: sumarPaso(e, p) }, resultado: { que: 'si', paso: p } };
    }
    if (!e.bienvenida) {
      const s = bienvenidaComoTexto(f.compra, ahora, 'bien-1');
      return { cambio: { estado: { ...e, salida: [...e.salida, s], bienvenida: { en: ahora.toISOString(), por: 'texto' } } }, resultado: { que: 'bienvenida' } };
    }
    if (!e.bienvenidaRepetida) {
      const s = bienvenidaComoTexto(f.compra, ahora, 'bien-1-otra');
      return { cambio: { estado: { ...e, salida: [...e.salida, s], bienvenidaRepetida: true } }, resultado: { que: 'repetida' } };
    }
    return { cambio: { estado: e }, resultado: { que: 'nada' } };
  });
  if (!r) return;
  const q = r.resultado;
  if (q.que === 'si') {
    // invitado → acepto → activo de una vez: con el SÍ sale la primera pregunta (AS1).
    const { error } = await deps.db.from('narradores').update({ estado: 'activo', alerta_silencio: false }).eq('id', n.id).in('estado', ['invitado', 'acepto']);
    if (error) console.error(`viaje V2: no pude dejar activo a ${n.id}: ${error.message}`);
    anotarNotas(n.id, q.paso.notas);
    await mandarAvisos(deps, n.id, q.paso.avisos);
  } else if (q.que === 'nada') {
    await deps.avisar(`viaje-sin-si-${n.id}`, `${fila.compra.nombre} escribe pero no dice SÍ (viaje V2)`,
      `${n.id} recibió la bienvenida del viaje dos veces y sigue escribiendo sin decir SÍ (lo último: ${m.tipo === 'texto' ? `«${(m.texto ?? '').slice(0, 200)}»` : m.tipo}). El bot no le contesta más: hay que verlo a mano.`);
  }
  await drenar(deps, n.id);
}

type Guardado = { entrada: Entrada; respuestaId: string | null } | 'duplicado';

/**
 * Guarda lo que llegó y arma la Entrada del planificador. `paraElPlan` = false: después de la despedida (la fila
 * queda con SIN_CLAVE_VIAJE). Un audio que no se pudo bajar no deja fila (no hay nada que guardar): es un audio
 * malo para el planificador (COR).
 */
async function guardar(deps: DepsViaje, narradorId: string, m: MensajeEntrante, fila: FilaViaje, paraElPlan: boolean): Promise<Guardado> {
  const id = m.waMessageId;
  const clave = paraElPlan ? null : SIN_CLAVE_VIAJE;
  if (m.tipo === 'audio') {
    if (!m.mediaId) return { entrada: { tipo: 'audio', idMensaje: id, transcripcion: null, descargaFallo: true }, respuestaId: null };
    let audio: Buffer;
    try {
      audio = await deps.wa.descargar(m.mediaId);
    } catch (err) {
      console.error(`viaje V2: no pude bajar el audio ${id} de ${narradorId}:`, err instanceof Error ? err.message : err);
      return { entrada: { tipo: 'audio', idMensaje: id, transcripcion: null, descargaFallo: true }, respuestaId: null };
    }
    const llegada = await numeroDeLlegada(deps.db, narradorId);
    const g = await guardarAudioV3(deps.db, narradorId, llegada, audio, id);
    if (!g) return 'duplicado';
    if (clave) await ponerClaveViaje(deps, g.id, clave);
    let transcripcion: string | null = null;
    try {
      const t = await deps.transcribir(audio, { nombre: fila.compra.nombre, idioma: idiomaDe(fila.compra), narradorId });
      if (t.texto.trim()) {
        await anotarTranscripcion(deps.db, g.id, t);
        transcripcion = t.texto.trim();
      }
    } catch (err) {
      console.error(`viaje V2: no pude transcribir el audio ${id} de ${narradorId}:`, err instanceof Error ? err.message : err);
    }
    return { entrada: { tipo: 'audio', idMensaje: id, transcripcion }, respuestaId: g.id };
  }
  if (m.tipo === 'imagen') {
    const reenviaA = paraElPlan ? reenvioDe(fila.estado, m) : undefined;
    if (reenviaA) return { entrada: { tipo: 'foto', idMensaje: id, reenviaA }, respuestaId: null }; // la que saca: no se guarda otra vez
    const llegada = await numeroDeLlegada(deps.db, narradorId);
    if (m.mediaId) {
      try {
        await guardarFotoV3(deps, narradorId, m.mediaId, m.mimeType, m.texto, llegada);
      } catch (err) {
        console.error(`viaje V2: no pude guardar la foto ${id} de ${narradorId}:`, err instanceof Error ? err.message : err);
      }
    }
    const epigrafe = m.texto?.trim();
    const r = await guardarTexto(deps, narradorId, llegada, epigrafe ? `${MARCA_FOTO} ${epigrafe}` : MARCA_FOTO, id, clave, false);
    if (r === 'duplicado') return 'duplicado';
    return { entrada: { tipo: 'foto', idMensaje: id }, respuestaId: r };
  }
  const texto = (m.texto ?? '').trim();
  const llegada = await numeroDeLlegada(deps.db, narradorId);
  const r = await guardarTexto(deps, narradorId, llegada, texto, id, clave, m.esBoton === true);
  if (r === 'duplicado') return 'duplicado';
  return { entrada: m.esBoton ? { tipo: 'boton', idMensaje: id, texto } : { tipo: 'texto', idMensaje: id, texto }, respuestaId: r };
}

/** ¿Es una foto que ya estaba en el álbum? La cita (contestó sobre ella) o el mismo archivo (sha256 de Meta). */
export function reenvioDe(e: EstadoBotViaje, m: Pick<MensajeEntrante, 'citaA' | 'sha256'>): string | undefined {
  const delAlbum = new Set(Object.values(e.fotosAlbum));
  if (m.citaA && delAlbum.has(m.citaA)) return m.citaA;
  if (m.sha256 && e.fotosAlbum[m.sha256]) return e.fotosAlbum[m.sha256];
  return undefined;
}

async function guardarTexto(deps: DepsViaje, narradorId: string, llegada: number, texto: string, waId: string, clave: string | null, esBoton: boolean): Promise<string | 'duplicado'> {
  const { data, error } = await deps.db.from('respuestas')
    .insert({
      narrador_id: narradorId, pregunta_orden: llegada, texto_directo: texto, transcripcion: esBoton ? null : texto,
      es_repregunta: false, wa_message_id: waId, clave_viaje: clave,
    })
    .select('id').single();
  if (error?.code === '23505') return 'duplicado';
  if (error) throw new Error(`No pude anotar el mensaje ${waId} de ${narradorId}: ${error.message}`);
  return (data as { id: string }).id;
}

async function ponerClaveViaje(deps: DepsViaje, respuestaId: string, clave: string): Promise<void> {
  const { error } = await deps.db.from('respuestas').update({ clave_viaje: clave }).eq('id', respuestaId);
  if (error) console.warn(`viaje V2: no pude anotar la clave ${clave} en la respuesta ${respuestaId}: ${error.message}`);
}
