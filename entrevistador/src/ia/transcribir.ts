import { cargarConfig } from '../config.js';
import { db } from '../db/cliente.js';

export async function transcribir(audio: Buffer): Promise<{ texto: string; duracionSegundos: number }> {
  const config = cargarConfig();
  const form = new FormData();
  form.append('file', new Blob([new Uint8Array(audio)], { type: 'audio/ogg' }), 'audio.ogg');
  form.append('model', 'whisper-1');
  form.append('language', 'es');
  form.append('response_format', 'verbose_json');

  const res = await fetch('https://api.openai.com/v1/audio/transcriptions', {
    method: 'POST',
    headers: { Authorization: `Bearer ${config.openaiKey}` },
    body: form,
  });
  if (!res.ok) throw new Error(`Whisper falló: ${res.status} ${await res.text()}`);
  const json = await res.json() as { text: string; duration: number };
  return { texto: json.text, duracionSegundos: Math.round(json.duration) };
}

export async function transcribirYActualizar(respuestaId: string, audio: Buffer) {
  const resultado = await transcribir(audio);
  const { error } = await db.from('respuestas')
    .update({ transcripcion: resultado.texto, duracion_segundos: resultado.duracionSegundos })
    .eq('id', respuestaId);
  if (error) throw new Error(`No pude guardar la transcripción: ${error.message}`);
  return resultado;
}
