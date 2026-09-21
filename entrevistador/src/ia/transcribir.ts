import { cargarConfig } from '../config.js';
import { db } from '../db/cliente.js';
import { registrarUso, cuentaDeEsteServicio } from '../costos.js';

/**
 * Transcribe el audio del narrador.
 *
 * MODELO: `gpt-transcribe` (cambio del 2026-09-14, medido contra el anterior
 * `whisper-1` con audios reales). Da mejor resultado y sale más barato:
 *   - Precisión: en el índice AA-WER v2 tiene 3.3% de error contra 4.1% de
 *     whisper-1, y OpenAI ya no recomienda los gpt-4o-transcribe para builds
 *     nuevos.
 *   - Precio: USD 0.0045 por minuto contra USD 0.006 (25% menos).
 *   - Ojo con la respuesta: este modelo NO devuelve `duration` en la raíz, la
 *     devuelve en `usage.seconds` (verificado: 191 para un audio de 191s). Si
 *     algún día se cambia el modelo, esto es lo primero que hay que revisar:
 *     los `gpt-4o-*` facturan por tokens y no traen la duración.
 *
 * `prompt` es opcional y NO cambia nada si no se pasa (el camino del webhook
 * sigue igual). Cuando sí se pasa, el modelo lo usa como sesgo de vocabulario:
 * probado con un audio real de un narrador porteño, sin contexto se oyó "mi
 * viejo llegando de la URA a las 8 de la noche"; con el prompt de contexto
 * —vocabulario rioplatense + los nombres y lugares del narrador, que arma
 * `src/manual/puro.ts:promptDeTranscripcion`— se oyó "llegando de laburar".
 * El prompt se corta ~224 tokens, así que tiene que venir corto (por eso
 * `promptDeTranscripcion` recorta).
 */
export async function transcribir(
  audio: Buffer, prompt?: string, narradorId?: string,
): Promise<{ texto: string; duracionSegundos: number }> {
  const config = cargarConfig();
  const form = new FormData();
  form.append('file', new Blob([new Uint8Array(audio)], { type: 'audio/ogg' }), 'audio.ogg');
  form.append('model', 'gpt-transcribe');
  form.append('language', 'es');
  form.append('response_format', 'json');
  if (prompt) form.append('prompt', prompt);

  const res = await fetch('https://api.openai.com/v1/audio/transcriptions', {
    method: 'POST',
    headers: { Authorization: `Bearer ${config.openaiKey}` },
    body: form,
  });
  if (!res.ok) throw new Error(`La transcripción falló: ${res.status} ${await res.text()}`);
  const json = await res.json() as { text: string; usage?: { seconds?: number } };
  const duracion = json.usage?.seconds;
  // Falla fuerte y con las claves a la vista: la duración es lo que usa el
  // cerebro para saber si una respuesta fue pobre, y un 0 silencioso le haría
  // pedir repreguntas a respuestas que estaban bien.
  if (duracion === undefined) {
    throw new Error(`La transcripción no devolvió duración (claves: ${Object.keys(json).join(', ')})`);
  }
  await registrarUso(db, {
    servicio: 'entrevistador', paso: 'transcribir', modelo: 'gpt-transcribe', proveedor: 'openai',
    cuenta: cuentaDeEsteServicio(), narradorId: narradorId ?? null,
    cantidad: duracion, unidad: 'segundos',
  });
  return { texto: json.text, duracionSegundos: Math.round(duracion) };
}

export async function transcribirYActualizar(respuestaId: string, audio: Buffer, prompt?: string, narradorId?: string) {
  const resultado = await transcribir(audio, prompt, narradorId);
  const { error } = await db.from('respuestas')
    .update({ transcripcion: resultado.texto, duracion_segundos: resultado.duracionSegundos })
    .eq('id', respuestaId);
  if (error) throw new Error(`No pude guardar la transcripción: ${error.message}`);
  return resultado;
}
