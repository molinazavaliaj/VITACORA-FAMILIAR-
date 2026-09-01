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
