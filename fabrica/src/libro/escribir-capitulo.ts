import Anthropic from '@anthropic-ai/sdk';
import { cargarConfig } from '../config.js';

// El prompt del capítulo — el corazón del producto. Se usa textual, no se
// resume ni se reordena: cada palabra acá decide si el libro suena a él o
// a un robot. Ver task-7-brief.md.
const PROMPT_CAPITULO = (
  nombre: string,
  capitulo: string,
  materiales: string,
  historiaCompleta: string,
  nombresCorregidos: string
) => `
Estás escribiendo el libro de la vida de ${nombre}, a partir de lo que él mismo contó
en entrevistas grabadas. Este es el capítulo «${capitulo}».

MATERIAL PRINCIPAL (las respuestas de las preguntas de este capítulo, textuales):
${materiales}

LA HISTORIA COMPLETA (todas las entrevistas — buscá acá cualquier cosa que pertenezca
a este capítulo aunque la haya contado otro día, emocionado, en medio de otro tema;
NO traigas lo que claramente pertenece a otro capítulo):
${historiaCompleta}

CORRECCIONES DE NOMBRES (la transcripción automática oyó mal; usar SIEMPRE la forma corregida):
${nombresCorregidos}

REGLAS — este libro es SU voz, no la tuya:
1. Primera persona. El narrador es él.
2. Usá SUS palabras, SUS giros, SUS muletillas queridas. Tu trabajo es ordenar y pulir
   apenas, no "redactar bonito". Si él dice «mi vieja», el libro dice «mi vieja».
3. Las frases más potentes van TEXTUALES, marcadas así: > para destacarlas como cita.
4. No inventes NADA. Ni un detalle, ni un adjetivo emocional que él no haya dado.
   Si el material es escaso, el capítulo es corto. Cortito y verdadero gana siempre.
5. Ordená cronológica o temáticamente dentro del capítulo, uniendo con transiciones
   mínimas y naturales.
6. Prohibido el perfume a IA: nada de «fue una época llena de desafíos», «sin duda»,
   «cabe destacar». Si una frase la podría haber escrito un robot, sacala.

Devolvé SOLO el texto del capítulo en Markdown (sin el título del capítulo).`;

function extraerTexto(bloques: Array<{ type: string; text?: string }>): string {
  return bloques
    .filter((bloque): bloque is { type: 'text'; text: string } => bloque.type === 'text' && typeof bloque.text === 'string')
    .map((bloque) => bloque.text)
    .join('\n');
}

/**
 * Escribe un capítulo del libro con la voz del narrador. `materiales` son las
 * respuestas textuales de las preguntas de este capítulo; `historiaCompleta`
 * es todo lo dicho en las entrevistas, por si algo que pertenece a este
 * capítulo se contó otro día; `nombresCorregidos` son las correcciones de
 * ortografía que la familia hizo sobre lo que la transcripción oyó mal.
 */
export async function escribirCapitulo(
  narrador: { nombre: string },
  capitulo: string,
  materiales: string,
  historiaCompleta: string,
  nombresCorregidos: string
): Promise<string> {
  const config = cargarConfig();
  const cliente = new Anthropic({ apiKey: config.anthropicApiKey });

  const prompt = PROMPT_CAPITULO(narrador.nombre, capitulo, materiales, historiaCompleta, nombresCorregidos);

  const stream = cliente.messages.stream({
    model: 'claude-fable-5',
    max_tokens: 20000,
    messages: [{ role: 'user', content: prompt }],
  });

  const mensajeFinal = await stream.finalMessage();
  const texto = extraerTexto(mensajeFinal.content as Array<{ type: string; text?: string }>);
  return texto.trim();
}
