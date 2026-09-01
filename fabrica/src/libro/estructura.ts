import Anthropic from '@anthropic-ai/sdk';
import { cargarConfig } from '../config.js';
import { obtenerClienteDb, type Narrador, type Pregunta, type Respuesta } from '../db.js';

export type Estructura = {
  titulo: string; // "Roberto — La historia de una vida"
  capitulos: { nombre: string; ordenes: number[] }[]; // qué preguntas alimentan cada capítulo, en orden de libro
  entidades: { texto: string; tipo: 'persona' | 'lugar'; contexto: string }[]; // para la corrección de nombres
};

/**
 * Agrupa los `orden` respondidos por `capitulo`, en el orden de la primera
 * aparición del capítulo entre las preguntas. Los órdenes sin respuesta no
 * aparecen — así soporta el cierre anticipado (narrador que no llegó a las 25).
 */
export function agruparCapitulos(
  preguntas: Pick<Pregunta, 'orden' | 'capitulo'>[],
  ordenesRespondidos: number[]
): { nombre: string; ordenes: number[] }[] {
  const respondidos = new Set(ordenesRespondidos);

  const resultado: { nombre: string; ordenes: number[] }[] = [];
  const indicePorCapitulo = new Map<string, number>();

  for (const pregunta of preguntas) {
    if (!respondidos.has(pregunta.orden)) continue;

    let indice = indicePorCapitulo.get(pregunta.capitulo);
    if (indice === undefined) {
      indice = resultado.length;
      indicePorCapitulo.set(pregunta.capitulo, indice);
      resultado.push({ nombre: pregunta.capitulo, ordenes: [] });
    }
    resultado[indice].ordenes.push(pregunta.orden);
  }

  return resultado;
}

function extraerTexto(bloques: Array<{ type: string; text?: string }>): string {
  return bloques
    .filter((bloque): bloque is { type: 'text'; text: string } => bloque.type === 'text' && typeof bloque.text === 'string')
    .map((bloque) => bloque.text)
    .join('\n');
}

function parsearJsonEntidades(texto: string): Estructura['entidades'] {
  // El prompt pide JSON puro, pero por las dudas sacamos fences de markdown.
  const limpio = texto
    .trim()
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/```\s*$/, '')
    .trim();
  try {
    const parseado = JSON.parse(limpio);
    if (Array.isArray(parseado)) return parseado as Estructura['entidades'];
    return [];
  } catch {
    return [];
  }
}

async function detectarEntidades(
  cliente: Anthropic,
  narrador: Narrador,
  transcripciones: string[]
): Promise<Estructura['entidades']> {
  if (transcripciones.length === 0) return [];

  const arbol = narrador.contexto?.arbol ?? {};
  const nombresConocidos = [
    ...(arbol.padres ?? []),
    ...(arbol.hermanos ?? []),
    ...(arbol.conyuge ?? []),
    ...(arbol.hijos ?? []),
  ];

  const pistaNombres =
    nombresConocidos.length > 0
      ? `\n\nNombres ya confirmados por la familia (ortografía correcta, usalos como referencia si aparecen mencionados): ${nombresConocidos.join(', ')}.`
      : '';

  const prompt = `Listá todas las personas y lugares mencionados en estas entrevistas, con una frase de contexto cada uno. Es para que la familia corrija la escritura de los nombres que la transcripción automática pudo oír mal. Respondé SOLO con JSON: [{"texto": "...", "tipo": "persona"|"lugar", "contexto": "..."}]${pistaNombres}

Entrevistas:
${transcripciones.join('\n\n---\n\n')}`;

  const stream = cliente.messages.stream({
    model: 'claude-fable-5',
    max_tokens: 20000,
    messages: [{ role: 'user', content: prompt }],
  });

  const mensajeFinal = await stream.finalMessage();
  const texto = extraerTexto(mensajeFinal.content as Array<{ type: string; text?: string }>);
  return parsearJsonEntidades(texto);
}

/**
 * Lee preguntas + respuestas del narrador, arma la estructura del libro
 * (capítulos y entidades detectadas) y la sube a
 * `{narrador_id}/paquete/estructura.json` en el bucket `audios`.
 */
export async function generarEstructura(narradorId: string): Promise<Estructura> {
  const db = obtenerClienteDb();
  const config = cargarConfig();
  const cliente = new Anthropic({ apiKey: config.anthropicApiKey });

  const { data: narrador, error: errorNarrador } = await db
    .from('narradores')
    .select('*')
    .eq('id', narradorId)
    .single();
  if (errorNarrador || !narrador) {
    throw new Error(`No se pudo leer el narrador ${narradorId}: ${errorNarrador?.message ?? 'sin datos'}`);
  }

  const { data: preguntasFijas, error: errorFijas } = await db
    .from('preguntas')
    .select('*')
    .is('narrador_id', null)
    .order('orden', { ascending: true });
  if (errorFijas) throw new Error(`No se pudieron leer las preguntas fijas: ${errorFijas.message}`);

  const { data: preguntasNarrador, error: errorNarradorPreguntas } = await db
    .from('preguntas')
    .select('*')
    .eq('narrador_id', narradorId)
    .order('orden', { ascending: true });
  if (errorNarradorPreguntas) {
    throw new Error(`No se pudieron leer las preguntas del narrador: ${errorNarradorPreguntas.message}`);
  }

  const preguntas: Pregunta[] = [...(preguntasFijas ?? []), ...(preguntasNarrador ?? [])].sort(
    (a, b) => a.orden - b.orden
  );

  const { data: respuestas, error: errorRespuestas } = await db
    .from('respuestas')
    .select('*')
    .eq('narrador_id', narradorId);
  if (errorRespuestas) throw new Error(`No se pudieron leer las respuestas: ${errorRespuestas.message}`);

  const respuestasList = (respuestas ?? []) as Respuesta[];
  const ordenesRespondidos = respuestasList.map((r) => r.pregunta_orden);

  const capitulos = agruparCapitulos(preguntas, ordenesRespondidos);

  const transcripciones = respuestasList
    .map((r) => r.transcripcion ?? r.texto_directo)
    .filter((texto): texto is string => Boolean(texto));

  const entidades = await detectarEntidades(cliente, narrador as Narrador, transcripciones);

  const estructura: Estructura = {
    titulo: `${(narrador as Narrador).nombre} — La historia de una vida`,
    capitulos,
    entidades,
  };

  const { error: errorSubida } = await db.storage
    .from('audios')
    .upload(`${narradorId}/paquete/estructura.json`, JSON.stringify(estructura), {
      contentType: 'application/json',
      upsert: true,
    });
  if (errorSubida) throw new Error(`No se pudo subir estructura.json: ${errorSubida.message}`);

  return estructura;
}
