import Anthropic from '@anthropic-ai/sdk';
import { cargarConfig } from '../config.js';

const MODELO = 'claude-opus-5';
/**
 * La evaluación de cada respuesta va con el MISMO modelo caro, y no por
 * capricho: medido con el prompt real (`scripts/prueba-evaluacion.ts`, 5 casos
 * del set dorado, 2026-09-14).
 *
 * - Haiku 4.5 envolvió el JSON en un bloque de código **5 de 5 veces** (el
 *   parser tiraba) y en los dos casos delicados preguntó peor: a alguien que
 *   acaba de contar que su hermano murió le preguntó "¿qué pasó con Rubén?", y
 *   en el capítulo 15 se fue a los años siguientes en vez de al consejo que
 *   faltaba.
 * - Opus acierta los 5, con repreguntas que ahondan en lo que el narrador dijo.
 *
 * La diferencia son ~17 centavos por narrador (USD 0,28 vs 0,04 a respuestas
 * largas). No vale la pena arriesgar la única pregunta que recibe un señor de
 * 80 años. Si algún día el costo importa, hay que endurecer el prompt de Haiku
 * y volver a medir — no cambiar el modelo a ciegas.
 */
const MODELO_EVALUACION = 'claude-opus-5';
const cliente = new Anthropic({ apiKey: cargarConfig().anthropicKey });

export const ESTILO_CEREBRO = `Sos el biógrafo de la familia: una persona cálida que está escribiendo el libro
de la vida de un señor o señora mayor a partir de sus relatos por WhatsApp.
Le hablás de usted, con respeto y afecto genuino, en español neutro (nada de modismos regionales).
Sos breve. Jamás sonás a robot ni a formulario.`;

function textoDe(respuesta: Anthropic.Message): string {
  const bloque = respuesta.content.find((b) => b.type === 'text');
  if (!bloque || bloque.type !== 'text') throw new Error('Claude no devolvió texto');
  return bloque.text.trim();
}

/**
 * El JSON que devuelve el modelo, tolerante a lo que hace de verdad.
 *
 * Nace de una medición, no de una precaución: con el prompt de la evaluación,
 * Haiku envolvió el JSON en un bloque de código 5 de 5 veces y Opus lo hace de
 * vez en cuando. Antes eso tiraba abajo la corrida entera.
 *
 * `respaldo` es lo que se devuelve si no hay forma de sacar un JSON válido:
 * la entrevista no se puede caer por un bloque de código. Para la evaluación el
 * respaldo es "suficiente" — una repregunta perdida es mucho menos grave que un
 * narrador que se queda sin su pregunta del día.
 */
export function extraerJson<T>(crudo: string, respaldo: T | null): T | null {
  const limpio = crudo.replace(/```[a-z]*/gi, '').trim();
  const desde = limpio.indexOf('{');
  const hasta = limpio.lastIndexOf('}');
  if (desde === -1 || hasta <= desde) return respaldo;
  try { return JSON.parse(limpio.slice(desde, hasta + 1)) as T; } catch { return respaldo; }
}

/**
 * El saludo del día: una o dos frases con un detalle concreto de lo que contó ayer.
 *
 * ⚠️ **El flujo ya no lo usa** (2026-09-14): `preguntar.ts` manda la pregunta
 * sola. Se sacó por decisión de producto de los socios, y de paso por costo:
 * esta era la llamada más cara del sistema (~USD 3,36 por narrador, el 70% de la
 * entrevista) porque recibe TODA la historia en cada llamada.
 *
 * Se deja viva porque `scripts/prueba-cerebro.ts` la usa para juzgar la voz del
 * biógrafo, y porque es la pieza que habría que enchufar de nuevo si algún día
 * se quiere recuperar un saludo barato (`historiaHastaAhora` vacío + Haiku).
 */
export async function generarReconocimiento(
  comoLeDicen: string, transcripcionAyer: string, preguntaDeHoy: string, historiaHastaAhora: string,
  arbol: Record<string, string> = {}, anioNacimiento?: number,
): Promise<string> {
  const respuesta = await cliente.messages.create({
    model: MODELO, max_tokens: 400, system: ESTILO_CEREBRO,
    messages: [{
      role: 'user',
      content: `Ayer ${comoLeDicen} contó esto en la entrevista:\n\n"${transcripcionAyer}"\n\nLa pregunta que le vas a hacer HOY es: "${preguntaDeHoy}"\n\nTodo lo que contó hasta ahora en las entrevistas anteriores:\n${historiaHastaAhora}\n\nLas personas de su vida según su familia (usá los nombres con naturalidad cuando vengan al caso, y SIEMPRE con esta escritura): ${JSON.stringify(arbol)}\nSi conocés su año de nacimiento (${anioNacimiento ?? 'desconocido'}), podés anclar la época cuando la pregunta mira a una edad concreta ("allá por 1968...").\n\nEscribí la apertura del mensaje de hoy (1 o 2 frases, máximo 50 palabras, sin saludo ni comillas):\n1. Un reconocimiento cálido y ESPECÍFICO de algo que contó ayer (un detalle concreto, no una generalidad).\n2. SOLO si en alguna respuesta anterior ya adelantó el tema de la pregunta de hoy: sumá una frase que lo referencie ("usted ya me adelantó algo de esto cuando me contó de...") para que hoy lo cuente con calma y desde el principio. Si no lo adelantó, no agregues nada.`,
    }],
  });
  return textoDe(respuesta);
}

/**
 * El prompt de la evaluación, exportado para poder comparar modelos con el
 * prompt REAL de producción (`scripts/prueba-evaluacion.ts`).
 *
 * Regla de oro (decisión de Naza, 2026-09-14): **la duración orienta, no
 * decide**, y la repregunta la piensa SIEMPRE el modelo — nunca hay un texto
 * fijo. Una respuesta de diez segundos puede ser oro ("mi mamá murió cuando yo
 * tenía ocho años"): eso es insuficiente, pero la repregunta va a AHONDAR en
 * eso, no a repetir una frase armada.
 */
export const PROMPT_EVALUAR = (pregunta: string, transcripcion: string, duracionSegundos: number) =>
  `Pregunta de hoy: "${pregunta}"
Respuesta (duró ${duracionSegundos} segundos): "${transcripcion}"

¿Con esta respuesta se puede escribir la página del libro de hoy? Juzgá por SUSTANCIA y contá los detalles concretos que hay: nombres, lugares, fechas, oficios, escenas, cosas que alguien dijo. El largo es una pista, no la regla.

ALCANZA si hay con qué escribir: dos o tres detalles concretos, con al menos una escena o un nombre propio. Un relato largo y con hechos alcanza, aunque siempre se pueda profundizar más.

NO ALCANZA sólo en estos dos casos:
1. Hay poco material: generalidades sin una sola escena, sin un nombre, sin un hecho ("sí, éramos pobres pero se vivía bien").
2. Contó algo fuerte y lo dejó en una sola frase — una muerte, una desgracia, un quiebre, algo que le costó decir: eso pide una repregunta que vaya EXACTAMENTE ahí.
Si la pregunta tenía varias partes y respondió sólo algunas, alcanza con lo que dio, salvo que haya quedado afuera la parte más valiosa emocionalmente.

El largo no decide nada: hay respuestas de diez segundos que valen un capítulo y respuestas de cuatro minutos que no dicen nada.

Si alcanza, respondé {"suficiente": true} y nada más: no pidas más detalles por costumbre. La repregunta es para cuando falta material o cuando dejó algo importante a medio decir, no para alargar una buena respuesta.

La repregunta la pensás SIEMPRE vos, para esta respuesta y este narrador: no existe un texto fijo. Una sola pregunta, cálida, con curiosidad genuina, que invite a profundizar en lo que ya dijo (o en la parte valiosa que quedó afuera). Nunca un tema nuevo, nunca decir que es una repregunta, nunca pedirle que resuma lo que ya contó.

Respondé SOLO con JSON: {"suficiente": true} o {"suficiente": false, "repregunta": "..."}`;

export async function evaluarRespuesta(
  pregunta: string, transcripcion: string, duracionSegundos: number,
): Promise<{ suficiente: boolean; repregunta?: string }> {
  const respuesta = await cliente.messages.create({
    model: MODELO_EVALUACION, max_tokens: 500, system: ESTILO_CEREBRO,
    messages: [{ role: 'user', content: PROMPT_EVALUAR(pregunta, transcripcion, duracionSegundos) }],
  });
  // Si el JSON no se puede leer, seguimos: hoy no hay repregunta.
  return extraerJson<{ suficiente: boolean; repregunta?: string }>(textoDe(respuesta), { suficiente: true })!;
}

/**
 * Reemplaza una pregunta fija cuyo capítulo no aplica a esta vida
 * (ej. "Los hijos" si no tuvo hijos): pregunta por lo más rico que ya contó.
 */
export async function generarPreguntaReemplazo(
  comoLeDicen: string, historiaCompleta: string, capitulos: string[], capituloQueNoAplica: string,
): Promise<{ texto: string; capitulo: string }> {
  const respuesta = await cliente.messages.create({
    model: MODELO, max_tokens: 500, system: ESTILO_CEREBRO,
    messages: [{
      role: 'user',
      content: `Sos el biógrafo de ${comoLeDicen}. Esto es lo que contó hasta ahora:\n\n${historiaCompleta}\n\nLa pregunta que tocaba hoy era del capítulo «${capituloQueNoAplica}», que NO aplica a su vida. Necesitás reemplazarla por una pregunta que aproveche mejor este día.\n\nBuscá en lo que ya contó: una persona que nombró y no exploró, una época con huecos, algo que claramente disfrutó contar y da para más. La pregunta debe sonar a que LO ESCUCHASTE (referí lo que él contó), tratarlo de usted, y ser una sola pregunta clara. Jamás menciones el tema que no aplica ni que estás reemplazando nada.\n\nCapítulos disponibles del libro: ${capitulos.join(', ')}.\n\nRespondé SOLO con JSON: {"texto": "...", "capitulo": "..."}`,
    }],
  });
  const reemplazo = extraerJson<{ texto: string; capitulo: string }>(textoDe(respuesta), null);
  if (!reemplazo) throw new Error('Claude no devolvió el reemplazo en JSON');
  return reemplazo;
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
