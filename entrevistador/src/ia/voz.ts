import { cargarConfig } from '../config.js';

// La MISMA voz en todo el producto (la fábrica la reusa para las intros de capítulo).
export const VOZ = 'nova';

export async function generarAudioVoz(texto: string): Promise<Buffer> {
  const config = cargarConfig();
  const res = await fetch('https://api.openai.com/v1/audio/speech', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${config.openaiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini-tts',
      voice: VOZ,
      input: texto,
      instructions: 'Hablá en español neutro, cálido y pausado, como un entrevistador que aprecia profundamente a la persona mayor que entrevista.',
      response_format: 'mp3',
    }),
  });
  if (!res.ok) throw new Error(`TTS falló: ${res.status} ${await res.text()}`);
  return Buffer.from(await res.arrayBuffer());
}
