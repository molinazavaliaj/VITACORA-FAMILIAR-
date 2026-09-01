import Anthropic from '@anthropic-ai/sdk';
import { cargarConfig } from '../config.js';

const MODELO = 'claude-opus-5';
const cliente = new Anthropic({ apiKey: cargarConfig().anthropicKey });

const ESTILO = `Sos el biógrafo de la familia: una persona cálida que está escribiendo el libro
de la vida de un señor o señora mayor a partir de sus relatos por WhatsApp.
Le hablás de usted, con respeto y afecto genuino, en español neutro (nada de modismos regionales).
Sos breve. Jamás sonás a robot ni a formulario.`;

function textoDe(respuesta: Anthropic.Message): string {
  const bloque = respuesta.content.find((b) => b.type === 'text');
  if (!bloque || bloque.type !== 'text') throw new Error('Claude no devolvió texto');
  return bloque.text.trim();
}

export async function generarReconocimiento(
  comoLeDicen: string, transcripcionAyer: string, preguntaDeHoy: string, historiaHastaAhora: string,
  arbol: Record<string, string> = {}, anioNacimiento?: number,
): Promise<string> {
  const respuesta = await cliente.messages.create({
    model: MODELO, max_tokens: 400, system: ESTILO,
    messages: [{
      role: 'user',
      content: `Ayer ${comoLeDicen} contó esto en la entrevista:\n\n"${transcripcionAyer}"\n\nLa pregunta que le vas a hacer HOY es: "${preguntaDeHoy}"\n\nTodo lo que contó hasta ahora en las entrevistas anteriores:\n${historiaHastaAhora}\n\nLas personas de su vida según su familia (usá los nombres con naturalidad cuando vengan al caso, y SIEMPRE con esta escritura): ${JSON.stringify(arbol)}\nSi conocés su año de nacimiento (${anioNacimiento ?? 'desconocido'}), podés anclar la época cuando la pregunta mira a una edad concreta ("allá por 1968...").\n\nEscribí la apertura del mensaje de hoy (1 o 2 frases, máximo 50 palabras, sin saludo ni comillas):\n1. Un reconocimiento cálido y ESPECÍFICO de algo que contó ayer (un detalle concreto, no una generalidad).\n2. SOLO si en alguna respuesta anterior ya adelantó el tema de la pregunta de hoy: sumá una frase que lo referencie ("usted ya me adelantó algo de esto cuando me contó de...") para que hoy lo cuente con calma y desde el principio. Si no lo adelantó, no agregues nada.`,
    }],
  });
  return textoDe(respuesta);
}

export async function evaluarRespuesta(
  pregunta: string, transcripcion: string, duracionSegundos: number,
): Promise<{ suficiente: boolean; repregunta?: string }> {
  const respuesta = await cliente.messages.create({
    model: MODELO, max_tokens: 300, system: ESTILO,
    messages: [{
      role: 'user',
      content: `Pregunta de hoy: "${pregunta}"\nRespuesta (duró ${duracionSegundos} segundos): "${transcripcion}"\n\n¿La respuesta tiene sustancia para un capítulo del libro (detalles, personas, emociones, escenas)? Si duró menos de 40 segundos o es superficial, NO es suficiente. Si la pregunta tenía varias partes y respondió solo algunas, es suficiente IGUAL salvo que haya quedado sin tocar la parte más valiosa emocionalmente — en ese caso la repregunta apunta exactamente a esa parte.\nRespondé SOLO con JSON: {"suficiente": true} o {"suficiente": false, "repregunta": "..."}.\nLa repregunta: una sola, cálida, que invite a profundizar en lo que ya dijo o en la parte valiosa que faltó (nunca un tema nuevo), tono de curiosidad genuina.`,
    }],
  });
  return JSON.parse(textoDe(respuesta));
}

/**
 * Reemplaza una pregunta fija cuyo capítulo no aplica a esta vida
 * (ej. "Los hijos" si no tuvo hijos): pregunta por lo más rico que ya contó.
 */
export async function generarPreguntaReemplazo(
  comoLeDicen: string, historiaCompleta: string, capitulos: string[], capituloQueNoAplica: string,
): Promise<{ texto: string; capitulo: string }> {
  const respuesta = await cliente.messages.create({
    model: MODELO, max_tokens: 500, system: ESTILO,
    messages: [{
      role: 'user',
      content: `Sos el biógrafo de ${comoLeDicen}. Esto es lo que contó hasta ahora:\n\n${historiaCompleta}\n\nLa pregunta que tocaba hoy era del capítulo «${capituloQueNoAplica}», que NO aplica a su vida. Necesitás reemplazarla por una pregunta que aproveche mejor este día.\n\nBuscá en lo que ya contó: una persona que nombró y no exploró, una época con huecos, algo que claramente disfrutó contar y da para más. La pregunta debe sonar a que LO ESCUCHASTE (referí lo que él contó), tratarlo de usted, y ser una sola pregunta clara. Jamás menciones el tema que no aplica ni que estás reemplazando nada.\n\nCapítulos disponibles del libro: ${capitulos.join(', ')}.\n\nRespondé SOLO con JSON: {"texto": "...", "capitulo": "..."}`,
    }],
  });
  return JSON.parse(textoDe(respuesta));
}

export async function detectarIntencion(texto: string): Promise<'quiere_parar' | 'normal'> {
  const respuesta = await cliente.messages.create({
    model: MODELO, max_tokens: 50,
    messages: [{
      role: 'user',
      content: `Un señor mayor que participa de entrevistas diarias por WhatsApp escribió: "${texto}".\n¿Está pidiendo PARAR o dejar las entrevistas (cansancio, molestia, "no quiero más", "basta")? Respondé SOLO "quiere_parar" o "normal". Ante la duda: "normal".`,
    }],
  });
  const veredicto = textoDe(respuesta);
  return veredicto === 'quiere_parar' ? 'quiere_parar' : 'normal';
}
