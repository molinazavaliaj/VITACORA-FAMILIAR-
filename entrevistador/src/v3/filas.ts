// Las filas de `respuestas` y `fotos` de un narrador V3 (spec 2026-10-07,
// "Reglas para la fila de respuestas"): `pregunta_orden` = número de llegada,
// `wa_message_id` único (el reintento de Meta no suma dos veces), `clave_v3`
// la pregunta V3. La verdad de la entrevista está en entrevistas_v3.estado:
// estas filas son el registro (audio, transcripción) para el panel y la fábrica.

import { randomUUID } from 'node:crypto';
import type { SupabaseClient } from '@supabase/supabase-js';
import { epigrafeDe, extensionDe } from '../flujo/fotos-texto.js';
import { pathDeAudio } from '../whatsapp/media.js';
import type { DepsV3, Transcripcion } from './deps.js';
import type { PreguntaFamilia } from './nucleo/entrevista/flujo.js';
import { claveMadre } from './turno.js';

/**
 * Las preguntas que cargó la familia para este narrador (tabla `preguntas`,
 * tipo 'familia'), con el id V3 `F:<id>`. El mismo criterio del alta y del
 * pase. Null si la base falla (quien llama sigue sin sumar nada).
 */
export async function leerFamilia(db: SupabaseClient, narradorId: string): Promise<PreguntaFamilia[] | null> {
  const { data, error } = await db.from('preguntas').select('id,orden,texto,tipo').eq('narrador_id', narradorId).eq('tipo', 'familia').order('orden');
  if (error) {
    console.warn(`V3: no pude leer las preguntas de la familia de ${narradorId}: ${error.message}`);
    return null;
  }
  return ((data as { id: string; texto: string }[] | null) ?? []).map((p) => ({ id: `F:${p.id}`, texto: p.texto }));
}

/** Las preguntas de la familia que llegaron después de FO1 (sumarFamilia): un aviso a los socios, sin textos del narrador. */
export async function avisarFamiliaTarde(deps: DepsV3, n: { id: string; como_le_dicen: string }, tarde: readonly PreguntaFamilia[]): Promise<void> {
  if (tarde.length === 0) return;
  await deps.avisar(`familia-tarde-${n.id}`, `Preguntas de la familia que ya no le llegan a ${n.como_le_dicen}`,
    `La familia de ${n.id} cargó ${tarde.length} pregunta(s) (${tarde.map((p) => p.id).join(', ')}) cuando la entrevista V3 ya había llegado a FO1 `
    + '(las de la familia van antes de la foto). No se suman: si hay que hacerlas, hay que verlo a mano.');
}

export async function yaLlego(db: SupabaseClient, waMessageId: string): Promise<boolean> {
  const { data, error } = await db.from('respuestas').select('id').eq('wa_message_id', waMessageId).limit(1);
  if (error) throw new Error(`No pude buscar el mensaje ${waMessageId}: ${error.message}`);
  return ((data as unknown[] | null) ?? []).length > 0;
}

export async function numeroDeLlegada(db: SupabaseClient, narradorId: string): Promise<number> {
  const { count, error } = await db.from('respuestas').select('id', { count: 'exact', head: true }).eq('narrador_id', narradorId);
  if (error) throw new Error(`No pude contar las respuestas de ${narradorId}: ${error.message}`);
  return (count ?? 0) + 1;
}

/** Cuántas veces se prueba otro nombre si otro audio ganó el mismo en el medio. */
export const INTENTOS_PATH_AUDIO = 5;

/** Los audios `dia_NN…` que ya están. Con `search`: la lista de Storage corta en 100 y una entrevista V3 pasa de 100 mensajes. */
async function audiosDelDia(db: SupabaseClient, narradorId: string, llegada: number): Promise<string[]> {
  const { data } = await db.storage.from('audios').list(narradorId, { limit: 1000, search: `dia_${String(llegada).padStart(2, '0')}` });
  return ((data as { name: string }[] | null) ?? []).map((a) => `${narradorId}/${a.name}`);
}

/**
 * Sube el audio con el nombre canónico (`dia_NN.ogg`, `dia_NN_2.ogg`…, el que
 * leen la puerta manual y el audiolibro). Dos audios casi juntos pueden sacar
 * el mismo número de llegada y el mismo nombre: el segundo choca al subir, se
 * relista y toma el sufijo siguiente. Si el error no es ese choque, tira.
 */
async function subirAudio(db: SupabaseClient, narradorId: string, llegada: number, audio: Buffer): Promise<string> {
  for (let intento = 0; intento < INTENTOS_PATH_AUDIO; intento++) {
    const audioPath = pathDeAudio(narradorId, llegada, await audiosDelDia(db, narradorId, llegada));
    const subida = await db.storage.from('audios').upload(audioPath, audio, { contentType: 'audio/ogg' });
    if (!subida.error) return audioPath;
    const choco = (await audiosDelDia(db, narradorId, llegada)).includes(audioPath);
    if (!choco) throw new Error(`Storage rechazó ${audioPath}: ${subida.error.message}`);
  }
  throw new Error(`Storage: ${INTENTOS_PATH_AUDIO} nombres seguidos para el audio ${llegada} de ${narradorId} ya estaban tomados.`);
}

/** Sube el audio y anota la fila. Null si ese wa_message_id ya estaba (y se borra el archivo recién subido). */
export async function guardarAudioV3(db: SupabaseClient, narradorId: string, llegada: number, audio: Buffer, waMessageId: string): Promise<{ id: string } | null> {
  const audioPath = await subirAudio(db, narradorId, llegada, audio);
  const { data, error } = await db.from('respuestas')
    .insert({ narrador_id: narradorId, pregunta_orden: llegada, audio_path: audioPath, es_repregunta: false, wa_message_id: waMessageId })
    .select('id').single();
  if (error?.code === '23505') {
    await db.storage.from('audios').remove([audioPath]);
    return null;
  }
  if (error) throw new Error(`No pude anotar el audio de ${narradorId}: ${error.message}`);
  return { id: (data as { id: string }).id };
}

/** Un botón (la marca), un texto escrito o la foto de FO1. Null si ese wa_message_id ya estaba. */
export async function guardarTextoV3(
  db: SupabaseClient, narradorId: string, llegada: number, texto: string,
  o: { waMessageId: string; clave: string | null; esBoton: boolean },
): Promise<{ id: string } | null> {
  const { data, error } = await db.from('respuestas')
    .insert({
      narrador_id: narradorId, pregunta_orden: llegada, texto_directo: texto,
      transcripcion: o.esBoton ? null : texto, es_repregunta: false, wa_message_id: o.waMessageId, clave_v3: o.clave,
    })
    .select('id').single();
  if (error?.code === '23505') return null;
  if (error) throw new Error(`No pude anotar el mensaje de ${narradorId}: ${error.message}`);
  return { id: (data as { id: string }).id };
}

export async function anotarTranscripcion(db: SupabaseClient, respuestaId: string, t: Transcripcion): Promise<void> {
  const { error } = await db.from('respuestas').update({ transcripcion: t.texto, duracion_segundos: t.duracionSegundos }).eq('id', respuestaId);
  if (error) throw new Error(`No pude guardar la transcripción de ${respuestaId}: ${error.message}`);
}

/**
 * La clave V3 de la fila: se pone DESPUÉS de guardar el estado (la fila sin
 * clave es la que el reloj reconcilia). SIN_CLAVE_V3 = se guardó y queda
 * afuera a propósito.
 */
export async function ponerClave(db: SupabaseClient, respuestaId: string, clave: string): Promise<void> {
  const { error } = await db.from('respuestas').update({ clave_v3: clave }).eq('id', respuestaId);
  if (error) console.warn(`V3: no pude anotar la clave ${clave} en la respuesta ${respuestaId}: ${error.message}`);
}

/**
 * «Esto que no vaya al libro»: todas las filas de esa clave y de sus
 * derivadas (RP~X, X~2, que comparten la reserva de X) quedan reservadas (la
 * fábrica saca la respuesta entera). Devuelve el error de la base, sin tirar:
 * sin la migración de reservas la columna no existe (42703) y el estado
 * (`reservadas`) igual alcanza.
 */
export async function marcarReservada(db: SupabaseClient, narradorId: string, clave: string): Promise<{ code?: string; message: string } | null> {
  const { data, error: errorLeer } = await db.from('respuestas').select('id,clave_v3').eq('narrador_id', narradorId).not('clave_v3', 'is', null);
  if (errorLeer) return { code: errorLeer.code, message: errorLeer.message };
  const ids = ((data as { id: string; clave_v3: string }[] | null) ?? []).filter((r) => r.clave_v3 === clave || claveMadre(r.clave_v3) === clave).map((r) => r.id);
  if (ids.length === 0) return null;
  const { error } = await db.from('respuestas').update({ reservada: true }).in('id', ids);
  return error ? { code: error.code, message: error.message } : null;
}

/** Como ponerClave, pero solo si la fila sigue sin clave (no pisa la que puso el camino que la aplicó). */
export async function ponerClaveSiFalta(db: SupabaseClient, respuestaId: string, clave: string): Promise<void> {
  const { error } = await db.from('respuestas').update({ clave_v3: clave }).eq('id', respuestaId).is('clave_v3', null);
  if (error) console.warn(`V3: no pude anotar la clave ${clave} en la respuesta ${respuestaId}: ${error.message}`);
}

/** Un audio que ya está en Storage (la reconciliación lo transcribe de nuevo). */
export async function bajarAudioGuardado(db: SupabaseClient, path: string): Promise<Buffer> {
  const { data, error } = await db.storage.from('audios').download(path);
  if (error || !data) throw new Error(`No pude bajar ${path} de Storage: ${error?.message ?? 'vacío'}`);
  return Buffer.from(await data.arrayBuffer());
}

/** Lo mismo que hace el flujo viejo al recibir algo: la alerta de silencio se apaga. */
export async function marcarRespondido(db: SupabaseClient, narradorId: string, ahora: Date): Promise<void> {
  await db.from('narradores').update({ ultima_respuesta_at: ahora.toISOString(), alerta_silencio: false }).eq('id', narradorId);
}

/** Como guardarFoto de flujo/fotos.ts, con las dependencias de la V3: capítulo null (la acomoda la familia). */
export async function guardarFotoV3(
  deps: Pick<DepsV3, 'db'> & { wa: Pick<DepsV3['wa'], 'descargar'> }, narradorId: string, mediaId: string, mimeType: string | undefined, caption: string | undefined, llegada: number,
): Promise<string> {
  const bytes = await deps.wa.descargar(mediaId);
  const id = randomUUID();
  const path = `${narradorId}/fotos/${id}.${extensionDe(mimeType)}`;
  const { error: errorSubida } = await deps.db.storage.from('audios').upload(path, bytes, { contentType: mimeType ?? 'image/jpeg', upsert: false });
  if (errorSubida) throw new Error(`No pude subir la foto de ${narradorId}: ${errorSubida.message}`);
  const { error } = await deps.db.from('fotos').insert({
    id, narrador_id: narradorId, capitulo: null, storage_path: path, pregunta_orden: llegada,
    epigrafe: epigrafeDe(caption), principal: false, subida_por: null,
  });
  if (error) {
    await deps.db.storage.from('audios').remove([path]);
    throw new Error(`No pude anotar la foto de ${narradorId}: ${error.message}`);
  }
  return id;
}
