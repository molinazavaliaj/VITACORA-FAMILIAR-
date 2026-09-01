import Anthropic from '@anthropic-ai/sdk';
import { cargarConfig } from '../config.js';
import { db } from '../db/cliente.js';
import { armarHistoria } from '../db/historia.js';

const MODELO = 'claude-opus-5';
const PRIMERA_ADAPTATIVA = 26;
const CANTIDAD = 5;

const cliente = new Anthropic({ apiKey: cargarConfig().anthropicKey });

const PROMPT_ADAPTATIVAS = (nombre: string, historiaCompleta: string, capitulos: string[]) => `
Leíste la historia de vida completa que ${nombre} contó en 25 entrevistas:

${historiaCompleta}

Sos su biógrafo y te quedan exactamente 5 preguntas para completar el libro. Buscá:
- Personas que nombró varias veces pero nunca exploró (un hermano, un amigo, un maestro).
- Épocas o momentos con huecos evidentes.
- Temas emocionales que tocó de pasada y merecen profundidad.
- Algo que claramente disfrutó contar y da para más.

Generá las 5 preguntas en el orden en que se las harías. Cada una debe sonar a que LO ESCUCHASTE
(referí lo que él contó), tratarlo de usted, y ser una sola pregunta clara.
Capítulos disponibles del libro: ${capitulos.join(', ')}.

Respondé SOLO con JSON: [{"texto": "...", "capitulo": "..."}, ...] (exactamente 5).`;

/**
 * Genera las 5 preguntas finales personalizadas (órdenes 26-30).
 * Idempotente: si ya existen, no hace nada.
 */
export async function generarPreguntasAdaptativas(narradorId: string): Promise<void> {
  const { data: existentes } = await db.from('preguntas').select('id')
    .eq('narrador_id', narradorId).gte('orden', PRIMERA_ADAPTATIVA).limit(1);
  if ((existentes?.length ?? 0) > 0) return;

  const { data: narrador } = await db.from('narradores')
    .select('como_le_dicen').eq('id', narradorId).maybeSingle();
  const comoLeDicen = (narrador as { como_le_dicen?: string } | null)?.como_le_dicen ?? 'el narrador';

  const { data: caps } = await db.from('preguntas').select('capitulo').is('narrador_id', null);
  const capitulos = [...new Set(((caps as { capitulo: string }[] | null) ?? []).map((c) => c.capitulo))];

  const historia = await armarHistoria(narradorId);

  const respuesta = await cliente.messages.create({
    model: MODELO, max_tokens: 2000,
    messages: [{ role: 'user', content: PROMPT_ADAPTATIVAS(comoLeDicen, historia, capitulos) }],
  });
  const bloque = respuesta.content.find((b) => b.type === 'text');
  if (!bloque || bloque.type !== 'text') throw new Error('Claude no devolvió texto');
  const preguntas = JSON.parse(bloque.text.trim()) as { texto: string; capitulo: string }[];

  const filas = preguntas.slice(0, CANTIDAD).map((p, i) => ({
    narrador_id: narradorId,
    orden: PRIMERA_ADAPTATIVA + i,
    texto: p.texto,
    capitulo: p.capitulo,
    tipo: 'adaptativa',
  }));
  const { error } = await db.from('preguntas').insert(filas);
  if (error) throw new Error(`No pude guardar las preguntas adaptativas: ${error.message}`);
}
