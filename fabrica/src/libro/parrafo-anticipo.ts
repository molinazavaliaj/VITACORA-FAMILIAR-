import Anthropic from '@anthropic-ai/sdk';
import { cargarConfig } from '../config.js';
import { extraerTexto } from './comun.js';

// El párrafo del anticipo. No es un capítulo: son tres respuestas sueltas y
// la familia todavía no corrigió los nombres, así que se pide poco y seguro.
// Su trabajo no es contar la vida — es probar que el libro va a sonar a él.
const PROMPT_ANTICIPO = (nombre: string, material: string) => `
Estas son las primeras respuestas que ${nombre} grabó para el libro de su vida.

${material}

Escribí UN SOLO párrafo, de 60 a 100 palabras, en primera persona, que sirva
como primera página del libro.

REGLAS:
1. El narrador es él. Usá SUS palabras, SUS giros, SUS muletillas.
2. No inventes NADA: ni un detalle, ni un adjetivo que él no haya dado.
   Con tres respuestas hay poco material — cortito y verdadero gana siempre.
3. Evitá los nombres propios de otras personas y de lugares: la transcripción
   automática todavía puede haberlos oído mal y la familia no los corrigió.
   Si necesitás nombrar a alguien, usá el vínculo ("mi vieja", "mi hermano").
4. Prohibido el perfume a IA: nada de «una época llena de desafíos», «sin duda»,
   «cabe destacar». Si una frase la podría haber escrito un robot, sacala.

Devolvé SOLO el párrafo, sin título y sin comillas.`;

/**
 * Escribe el párrafo del anticipo que ve la familia antes de decidir la
 * compra. Una sola llamada, corta y barata: con tres respuestas el material
 * es chico y lo caro (el libro entero) recién se paga después del pago.
 */
export async function escribirParrafoAnticipo(
  narrador: { nombre: string },
  material: string
): Promise<string> {
  const config = cargarConfig();
  const cliente = new Anthropic({ apiKey: config.anthropicApiKey });

  const mensaje = await cliente.messages.create({
    model: 'claude-fable-5',
    max_tokens: 1000,
    messages: [{ role: 'user', content: PROMPT_ANTICIPO(narrador.nombre, material) }],
  });

  return extraerTexto(mensaje.content as Array<{ type: string; text?: string }>).trim();
}
