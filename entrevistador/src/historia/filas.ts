// Las filas de `respuestas` de un narrador de historia (CONTRATO, "Vitácora de una historia"): como en V3,
// `pregunta_orden` = número de llegada, `wa_message_id` único y la clave en `clave_historia`. La verdad de la
// entrevista está en historias.estado: estas filas son el registro (audio, transcripción) para el panel y la fábrica.
// Lo que no depende de la clave (subir el audio, la foto, la transcripción, el número de llegada) es el de V3, que
// ya usa también Viaje V2: se importa de src/v3/filas.ts sin tocarlo.

import type { SupabaseClient } from '@supabase/supabase-js';

export {
  anotarTranscripcion, bajarAudioGuardado, guardarAudioV3 as guardarAudio, guardarFotoV3 as guardarFoto, marcarRespondido, numeroDeLlegada, yaLlego,
} from '../v3/filas.js';

/** La clave "madre" de una repregunta (RP~X): comparte la reserva de X. */
export const claveMadre = (k: string) => (k.startsWith('RP~') ? k.slice(3) : k);

/** Un botón (la marca), un texto escrito o la foto de FOTO-H. Null si ese wa_message_id ya estaba. */
export async function guardarTexto(
  db: SupabaseClient, narradorId: string, llegada: number, texto: string,
  o: { waMessageId: string; clave: string | null; esBoton: boolean },
): Promise<{ id: string } | null> {
  const { data, error } = await db.from('respuestas')
    .insert({
      narrador_id: narradorId, pregunta_orden: llegada, texto_directo: texto,
      transcripcion: o.esBoton ? null : texto, es_repregunta: false, wa_message_id: o.waMessageId, clave_historia: o.clave,
    })
    .select('id').single();
  if (error?.code === '23505') return null;
  if (error) throw new Error(`No pude anotar el mensaje de ${narradorId}: ${error.message}`);
  return { id: (data as { id: string }).id };
}

/**
 * La clave de la fila: se pone DESPUÉS de guardar el estado (la fila sin clave es la que el reloj reconcilia).
 * SIN_CLAVE_HISTORIA = se guardó y queda afuera a propósito.
 */
export async function ponerClave(db: SupabaseClient, respuestaId: string, clave: string): Promise<void> {
  const { error } = await db.from('respuestas').update({ clave_historia: clave }).eq('id', respuestaId);
  if (error) console.warn(`historia: no pude anotar la clave ${clave} en la respuesta ${respuestaId}: ${error.message}`);
}

/** Como ponerClave, pero solo si la fila sigue sin clave (no pisa la que puso el camino que la aplicó). */
export async function ponerClaveSiFalta(db: SupabaseClient, respuestaId: string, clave: string): Promise<void> {
  const { error } = await db.from('respuestas').update({ clave_historia: clave }).eq('id', respuestaId).is('clave_historia', null);
  if (error) console.warn(`historia: no pude anotar la clave ${clave} en la respuesta ${respuestaId}: ${error.message}`);
}

/**
 * «Esto que no vaya al libro»: todas las filas de esa clave y de sus repreguntas (RP~X) quedan reservadas. Devuelve
 * el error de la base, sin tirar: el estado (`reservadas`) igual alcanza.
 */
export async function marcarReservada(db: SupabaseClient, narradorId: string, clave: string): Promise<{ code?: string; message: string } | null> {
  const { data, error: errorLeer } = await db.from('respuestas').select('id,clave_historia').eq('narrador_id', narradorId).not('clave_historia', 'is', null);
  if (errorLeer) return { code: errorLeer.code, message: errorLeer.message };
  const ids = ((data as { id: string; clave_historia: string }[] | null) ?? []).filter((r) => r.clave_historia === clave || claveMadre(r.clave_historia) === clave).map((r) => r.id);
  if (ids.length === 0) return null;
  const { error } = await db.from('respuestas').update({ reservada: true }).in('id', ids);
  return error ? { code: error.code, message: error.message } : null;
}
