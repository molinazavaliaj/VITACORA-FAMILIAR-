import { cargarConfig } from '../config.js';

// Misma voz que usa el entrevistador para las repreguntas — el audiolibro
// tiene que sonar como si la misma persona presentara cada capítulo.
const VOZ = 'nova';
const INSTRUCCIONES =
  'Habla en español neutro, cálido y pausado, como un entrevistador que aprecia profundamente a la persona mayor que entrevista.';

/**
 * Genera el audio (mp3) de una intro corta del audiolibro ("Capítulo 3:
 * El amor", "Mensajes para usted") vía la API de TTS de OpenAI.
 */
export async function generarAudioTts(texto: string): Promise<Buffer> {
  const config = cargarConfig();

  const respuesta = await fetch('https://api.openai.com/v1/audio/speech', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${config.openaiApiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini-tts',
      voice: VOZ,
      input: texto,
      instructions: INSTRUCCIONES,
      response_format: 'mp3',
    }),
  });

  if (!respuesta.ok) {
    const cuerpo = await respuesta.text().catch(() => '');
    throw new Error(`TTS falló (${respuesta.status}): ${cuerpo}`);
  }

  const arrayBuffer = await respuesta.arrayBuffer();
  return Buffer.from(arrayBuffer);
}
