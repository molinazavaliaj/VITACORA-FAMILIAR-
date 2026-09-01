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

function esEntidadValida(valor: unknown): valor is Estructura['entidades'][number] {
  if (typeof valor !== 'object' || valor === null) return false;
  const candidato = valor as Record<string, unknown>;
  return (
    typeof candidato.texto === 'string' &&
    candidato.texto.trim() !== '' &&
    (candidato.tipo === 'persona' || candidato.tipo === 'lugar') &&
    typeof candidato.contexto === 'string'
  );
}

/**
 * Parsea el JSON de entidades que devuelve el modelo y descarta cualquier
 * entrada que no tenga la forma esperada. `estructura.json` es un contrato
 * tipado que consumen tareas posteriores y la UI de corrección de nombres —
 * una entrada mal formada ahí puede romper ese consumidor, así que se filtra
 * en vez de dejarla pasar con un cast sin validar.
 */
export function parsearJsonEntidades(texto: string): Estructura['entidades'] {
  // El prompt pide JSON puro, pero por las dudas sacamos fences de markdown.
  const limpio = texto
    .trim()
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/```\s*$/, '')
    .trim();

  let parseado: unknown;
  try {
    parseado = JSON.parse(limpio);
  } catch {
    return [];
  }
  if (!Array.isArray(parseado)) return [];

  const validas = parseado.filter(esEntidadValida);
  const descartadas = parseado.length - validas.length;
  if (descartadas > 0) {
    console.warn(`parsearJsonEntidades: se descartaron ${descartadas} entidad(es) mal formada(s) del modelo`);
  }
  return validas;
}

async function detectarEntidades(
  cliente: Anthropic,
  narrador: Narrador,
  transcripciones: string[]
): Promise<Estructura['entidades']> {
  if (transcripciones.length === 0) return [];

  const arbol = narrador.contexto?.arbol ?? {};
  // Cada vínculo viene como una frase escrita por la familia ("Ramón y
  // Haydée"), no como una lista: se usa el valor tal cual. Si se spreadeara,
  // un string se desarmaría en letras sueltas y la pista quedaría en "R, a, m".
  // 'no tuvo' es la marca que pone el formulario cuando no hubo pareja o
  // hijos: no es un nombre y no tiene que entrar como si lo fuera.
  const nombresConocidos = [arbol.padres, arbol.hermanos, arbol.conyuge, arbol.hijos]
    .filter((vinculo): vinculo is string => typeof vinculo === 'string' && vinculo.trim() !== '')
    .map((vinculo) => vinculo.trim())
    .filter((vinculo) => vinculo.toLowerCase() !== 'no tuvo');

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
    .map((r) => r.transcripcion?.trim() || r.texto_directo)
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
