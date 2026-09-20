import { db } from './cliente.js';
import { pathDeAudio } from '../whatsapp/media.js';

export async function guardarRespuestaAudio(
  narradorId: string, preguntaOrden: number, audio: Buffer, esRepregunta: boolean,
): Promise<{ id: string; audioPath: string }> {
  const { data: archivos } = await db.storage.from('audios').list(narradorId);
  const existentes = (archivos ?? []).map((a) => `${narradorId}/${a.name}`);
  const audioPath = pathDeAudio(narradorId, preguntaOrden, existentes);

  const subida = await db.storage.from('audios').upload(audioPath, audio, { contentType: 'audio/ogg' });
  if (subida.error) throw new Error(`Storage rechazó ${audioPath}: ${subida.error.message}`);

  const { data, error } = await db.from('respuestas')
    .insert({ narrador_id: narradorId, pregunta_orden: preguntaOrden, audio_path: audioPath, es_repregunta: esRepregunta })
    .select('id').single();
  if (error) throw new Error(`No pude insertar la respuesta: ${error.message}`);
  return { id: data.id, audioPath };
}

/**
 * "Esto que no vaya al libro" (bitácora 19): guarda en la fila de la respuesta
 * lo que la evaluación detectó — `reservada` (nada de esta respuesta se publica)
 * y, si el pedido fue por una parte, `reservado_tramo` (ese texto se quita).
 * La fábrica lee estas dos columnas al armar el material del libro.
 *
 * Nunca lanza: las columnas llegan con la migración
 * `20260920000100_respuestas_reservadas.sql`, que la aplica Naza en el SQL
 * Editor. Si el flujo corre antes, PostgREST contesta "column does not exist"
 * y eso NO puede tumbar el día del narrador — se avisa por consola y la
 * reserva queda para anotar a mano (`update respuestas set reservada = true`).
 * Con la respuesta sin reserva no toca la base: la columna ya nace en false.
 */
export async function guardarReserva(
  respuestaId: string, reserva: { reservada: boolean; tramo: string | null },
): Promise<boolean> {
  if (!reserva.reservada) return false;
  const { error } = await db.from('respuestas')
    .update({ reservada: true, reservado_tramo: reserva.tramo })
    .eq('id', respuestaId);
  if (error) {
    console.warn(
      `respuestas: no pude marcar como reservada la respuesta ${respuestaId} (${error.message}). ` +
      '¿Está aplicada la migración 20260920000100_respuestas_reservadas.sql? Anotala a mano.',
    );
    return false;
  }
  return true;
}
