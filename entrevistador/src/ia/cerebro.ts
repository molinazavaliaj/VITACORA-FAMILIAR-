import Anthropic from '@anthropic-ai/sdk';
import { cargarConfig } from '../config.js';
import type { Trato } from './trato.js';

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

/**
 * El estilo con el que el cerebro le escribe al narrador.
 *
 * Era una constante con "usted" clavado (2026-09-15): ahora el trato lo decide
 * `trato.ts` mirando la ficha. Cuando le habla de vos, el estilo tampoco puede
 * decir que está escribiendo la vida de "un señor o señora mayor" — sería
 * pelearle a su propia instrucción.
 */
export function estiloCerebro(trato: Trato = 'usted'): string {
  return `Sos el biógrafo de la familia: una persona cálida que está escribiendo el libro
de la vida de ${trato === 'vos' ? 'una persona' : 'un señor o señora mayor'} a partir de sus relatos por WhatsApp.
Le hablás de ${trato}, con respeto y afecto genuino, en español neutro (nada de modismos regionales).
Sos breve. Jamás sonás a robot ni a formulario.`;
}

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
    model: MODELO, max_tokens: 400, system: estiloCerebro(),
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
export const PROMPT_EVALUAR = (pregunta: string, transcripcion: string, duracionSegundos: number, evitar = '', trato: Trato = 'usted') =>
  `Pregunta de hoy: "${pregunta}"
Respuesta (duró ${duracionSegundos} segundos): "${transcripcion}"
${evitar}
¿Con esta respuesta se puede escribir la página del libro de hoy? Juzgá por SUSTANCIA y contá los detalles concretos que hay: nombres, lugares, fechas, oficios, escenas, cosas que alguien dijo. El largo es una pista, no la regla.

ALCANZA si hay con qué escribir: dos o tres detalles concretos, con al menos una escena o un nombre propio. Un relato largo y con hechos alcanza, aunque siempre se pueda profundizar más.

NO ALCANZA sólo en estos dos casos:
1. Hay poco material: generalidades sin una sola escena, sin un nombre, sin un hecho ("sí, éramos pobres pero se vivía bien").
2. Contó algo fuerte y lo dejó en una sola frase — una muerte, una desgracia, un quiebre, algo que le costó decir: eso pide una repregunta que vaya EXACTAMENTE ahí.
Si la pregunta tenía varias partes y respondió sólo algunas, alcanza con lo que dio, salvo que haya quedado afuera la parte más valiosa emocionalmente.

El largo no decide nada: hay respuestas de diez segundos que valen un capítulo y respuestas de cuatro minutos que no dicen nada.

Si alcanza, respondé {"suficiente": true} y nada más: no pidas más detalles por costumbre. La repregunta es para cuando falta material o cuando dejó algo importante a medio decir, no para alargar una buena respuesta.

La repregunta la pensás SIEMPRE vos, para esta respuesta y este narrador: no existe un texto fijo. Una sola pregunta, cálida, con curiosidad genuina, que invite a profundizar en lo que ya dijo (o en la parte valiosa que quedó afuera). Nunca un tema nuevo, nunca decir que es una repregunta, nunca pedirle que resuma lo que ya contó.

SI PIDE CAMBIAR DE TEMA, SE LO ESCUCHA (vale más que cualquier material). Si en la respuesta hay un pedido explícito de dejar ese tema —"vamos por otro lado", "prefiero no hablar de eso", "dejemos eso", "eso no lo pongas"— la respuesta se da por SUFICIENTE ({"suficiente": true}) y NO hay repregunta sobre ese tema: ni para insistir, ni para retomarlo "de otra manera", ni una sola vez más. Tampoco se insiste en lo que esquivó: si en vez de contestar contó otra cosa, no vuelvas con la pregunta que no contestó — una sola invitación alcanza, y ya se hizo. El silencio también es una respuesta. Cuando hubo ese pedido explícito, agregá "dejarTema" con EL TEMA que pidió dejar, en pocas palabras y en tercera persona ("su tío y las drogas", "la muerte de su hermano"): queda anotado y el biógrafo no vuelve ahí en el resto de la entrevista. Solo con pedido explícito: esquivar no es pedir.

LA REPREGUNTA VA EN ${trato}, SIN EXCEPCIÓN, con sus conjugaciones: ${trato === 'vos'
    ? 'tuteando de punta a punta ("¿cómo era tu casa?", "¿te acordás?", "¿qué sentiste?"), nunca "cuénteme", "usted", "su" ni "sus", aunque la pregunta del día haya venido escrita de usted.'
    : 'de usted de punta a punta ("¿cómo era su casa?", "¿se acuerda?", "¿qué sintió?"), nunca "contame", "vos", "tu" ni "tus".'} Si el narrador viene hablando de vos y la repregunta sale de usted, se rompe el vínculo justo en el momento más íntimo.

SI PIDE QUE ALGO NO VAYA AL LIBRO, SE ANOTA ACÁ. Si dice que algo quede afuera —"esto prefiero que no vaya al libro", "estas historias prefiero que queden en mi mente", "no lo pongas", "que mi familia no lo sepa"— agregá "reservado": true. Si el pedido es sólo por una parte, agregá también "reservadoTramo" con ese tramo de su respuesta COPIADO TEXTUAL (una frase o dos, tal como las dijo, sin corregirle nada). Reservar es sagrado: si dudás de si está pidiendo que algo no se publique, marcá "reservado": true — publicar lo que pidió guardar es la peor falla posible, y volver a agregar algo después es fácil.

Respondé SOLO con JSON: {"suficiente": true} o {"suficiente": false, "repregunta": "..."}, y sumá "reservado": true (y "reservadoTramo": "..." si es sólo una parte) y "dejarTema": "..." cuando corresponda.`;

/**
 * Cuánto se espera antes del único reintento de una llamada al modelo que
 * volvió vacía.
 *
 * 4 de 30 evaluaciones volvieron sin texto en el piloto (bitácora 14) y eso
 * cortaba el día entero: sin repregunta y, si era la última, sin despedida
 * (bitácora 31). Casi siempre es un hipo de la API y con dos segundos alcanza.
 * No se reintenta más de una vez: el narrador está esperando del otro lado.
 */
export const PAUSA_REINTENTO_MS = 2000;

/** Los tests la apagan con `pausaMs: 0`; en producción son 2 s de verdad. */
const esperar = (ms: number) => (ms > 0 ? new Promise<void>((r) => setTimeout(r, ms)) : Promise.resolve());

export type OpcionesDeReintento = { pausaMs?: number };

/** Lo que la evaluación puede decir: si alcanza, si hay repregunta, y si algo se reserva. */
export type Evaluacion = {
  suficiente: boolean;
  repregunta?: string;
  /** El narrador pidió que esto no vaya al libro (hallazgo 19). */
  reservado?: boolean;
  /** Cuando el pedido es por una parte: el tramo textual que no se publica. */
  reservadoTramo?: string;
  /** El narrador pidió dejar un tema ("vamos por otro lado"): cuál (bitácora 34). */
  dejarTema?: string;
};

/**
 * La reserva tal como se va a guardar, a partir de lo que devolvió el modelo.
 *
 * `reservadoTramo` solo vale si el tramo está TEXTUALMENTE en la transcripción:
 * si el modelo lo parafraseó o lo inventó, sacar ese texto no sacaría nada y lo
 * reservado terminaría publicado igual — el peor error posible. En ese caso se
 * reserva la respuesta entera. Ante la duda siempre se reserva de más: agregar
 * algo después es fácil, desdecir algo que la familia ya leyó, no.
 */
export function reservaDe(
  evaluacion: Pick<Evaluacion, 'reservado' | 'reservadoTramo'>, transcripcion: string,
): { reservada: boolean; tramo: string | null } {
  if (evaluacion.reservado !== true) return { reservada: false, tramo: null };
  const tramo = typeof evaluacion.reservadoTramo === 'string' ? evaluacion.reservadoTramo.trim() : '';
  if (!tramo) return { reservada: true, tramo: null };
  if (!transcripcion.includes(tramo)) {
    console.warn('evaluar: el modelo marcó un tramo reservado que no está textual en la transcripción; se reserva la respuesta entera.');
    return { reservada: true, tramo: null };
  }
  return { reservada: true, tramo };
}

export async function evaluarRespuesta(
  pregunta: string, transcripcion: string, duracionSegundos: number, evitar = '', trato: Trato = 'usted',
  opciones: OpcionesDeReintento = {},
): Promise<Evaluacion> {
  const pausaMs = opciones.pausaMs ?? PAUSA_REINTENTO_MS;

  const pedirleAlModelo = async () => {
    const respuesta = await cliente.messages.create({
      model: MODELO_EVALUACION, max_tokens: 500, system: estiloCerebro(trato),
      messages: [{ role: 'user', content: PROMPT_EVALUAR(pregunta, transcripcion, duracionSegundos, evitar, trato) }],
    });
    // Si el JSON no se puede leer, seguimos: hoy no hay repregunta.
    return extraerJson<Evaluacion>(textoDe(respuesta), { suficiente: true })!;
  };

  try {
    return await pedirleAlModelo();
  } catch (err) {
    console.warn(`evaluar: el modelo no devolvió la evaluación (se reintenta en ${pausaMs} ms):`, err);
  }

  await esperar(pausaMs);
  try {
    return await pedirleAlModelo();
  } catch (err) {
    // El modelo no puede tumbar la entrevista: se sigue como si la respuesta
    // alcanzara. Es exactamente lo que el código ya hacía cuando el JSON
    // venía ilegible, y es la regla de oro: una repregunta perdida es mucho
    // menos grave que un narrador que se queda sin su día (o sin despedida).
    console.warn('evaluar: el modelo volvió a fallar; se sigue sin repregunta (la respuesta vale como suficiente):', err);
    return { suficiente: true };
  }
}

/**
 * Reemplaza una pregunta fija cuyo capítulo no aplica a esta vida
 * (ej. "Los hijos" si no tuvo hijos): pregunta por lo más rico que ya contó.
 */
export async function generarPreguntaReemplazo(
  comoLeDicen: string, historiaCompleta: string, capitulos: string[], capituloQueNoAplica: string, evitar = '', trato: Trato = 'usted',
): Promise<{ texto: string; capitulo: string }> {
  const respuesta = await cliente.messages.create({
    model: MODELO, max_tokens: 500, system: estiloCerebro(trato),
    messages: [{
      role: 'user',
      content: `Sos el biógrafo de ${comoLeDicen}. Esto es lo que contó hasta ahora:\n\n${historiaCompleta}\n${evitar}\nLa pregunta que tocaba hoy era del capítulo «${capituloQueNoAplica}», que NO aplica a su vida. Necesitás reemplazarla por una pregunta que aproveche mejor este día.\n\nBuscá en lo que ya contó: una persona que nombró y no exploró, una época con huecos, algo que claramente disfrutó contar y da para más. La pregunta debe sonar a que LO ESCUCHASTE (referí lo que él contó), tratarlo de ${trato}, y ser una sola pregunta clara. Jamás menciones el tema que no aplica ni que estás reemplazando nada.\n\nCapítulos disponibles del libro: ${capitulos.join(', ')}.\n\nRespondé SOLO con JSON: {"texto": "...", "capitulo": "..."}`,
    }],
  });
  const reemplazo = extraerJson<{ texto: string; capitulo: string }>(textoDe(respuesta), null);
  if (!reemplazo) throw new Error('Claude no devolvió el reemplazo en JSON');
  return reemplazo;
}

/**
 * Bitácora 35: Joaquín contestó "no tengo hijos" en la 19 y el biógrafo le
 * preguntó igual "hábleme de cada uno de sus hijos". Cuando la respuesta de una
 * pregunta de «Los hijos» o «El amor» dice que ese capítulo no existe en su
 * vida, se anota en el árbol y las que siguen del capítulo se reemplazan (la
 * misma regla que cuando la familia lo cargó al comprar). Ante la duda, 'normal':
 * es peor saltear un capítulo que existe que hacer una pregunta de más.
 */
export async function detectarQueNoTuvo(
  capitulo: string, pregunta: string, transcripcion: string,
): Promise<'no_tuvo' | 'normal'> {
  const que = capitulo === 'Los hijos' ? 'hijos' : 'pareja (novia, novio, esposa, esposo, matrimonio)';
  const respuesta = await cliente.messages.create({
    model: MODELO, max_tokens: 20,
    messages: [{
      role: 'user',
      content: `Un narrador mayor responde por audio a la pregunta "${pregunta}" (capítulo «${capitulo}» de su biografía). Transcripción: "${transcripcion}".\n¿Dice CLARAMENTE que NUNCA tuvo ${que}? Respondé SOLO "no_tuvo" o "normal". Si tuvo y los perdió, si habla de otros, o ante cualquier duda: "normal".`,
    }],
  });
  return textoDe(respuesta).trim() === 'no_tuvo' ? 'no_tuvo' : 'normal';
}

export type VeredictoCierre =
  | { tipo: 'nada' }
  | { tipo: 'conto'; pregunta: string; capitulo: string }
  | { tipo: 'tema'; tema: string; pregunta: string; capitulo: string };

/**
 * La respuesta a "¿hay algo que no le pregunté?" (cierre, 18/09). Tres salidas:
 * contó la historia (queda como respuesta, con un pie de pregunta coherente),
 * nombró un tema (se le arma UNA pregunta sobre eso), o dijo que no.
 */
export async function clasificarCierre(
  comoLeDicen: string, transcripcion: string, capitulos: string[], historiaCompleta: string, evitar = '', trato: Trato = 'usted',
): Promise<VeredictoCierre> {
  const respuesta = await cliente.messages.create({
    model: MODELO, max_tokens: 400, system: estiloCerebro(trato),
    messages: [{
      role: 'user',
      content: `Sos el biógrafo de ${comoLeDicen}. Al final de la entrevista le preguntaste si había algo que no le preguntaste y que quiera en el libro. Respondió: "${transcripcion}"
${evitar}
Decidí UNA de tres:
- "nada": dijo que no, que está todo, o no aportó nada.
- "conto": contó directamente la historia o el recuerdo (hay material para el libro). Escribí "pregunta": una pregunta corta, en ${trato}, que suene a que vos se la hiciste y a la que esa respuesta contesta (es el pie que va en el libro); y "capitulo": en cuál va.
- "tema": nombró un tema, una persona o una época pero NO la contó ("preguntame por…", "me faltó hablar de…"). Escribí "tema" (dos o tres palabras), "pregunta": una sola pregunta cálida, en ${trato}, sobre eso, que muestre que lo escuchaste (podés referir lo que ya contó), y "capitulo".

Capítulos del libro: ${capitulos.join(', ')}.
Lo que ya contó (para no repetir y para el capítulo): ${historiaCompleta.slice(0, 6000)}

Respondé SOLO con JSON: {"tipo": "nada"} | {"tipo": "conto", "pregunta": "...", "capitulo": "..."} | {"tipo": "tema", "tema": "...", "pregunta": "...", "capitulo": "..."}`,
    }],
  });
  const v = extraerJson<VeredictoCierre>(textoDe(respuesta), { tipo: 'nada' })!;
  const capituloOk = (c: unknown) => (typeof c === 'string' && capitulos.includes(c) ? c : capitulos[capitulos.length - 1] ?? 'Otros');
  if (v.tipo === 'conto' && typeof v.pregunta === 'string' && v.pregunta.trim()) return { tipo: 'conto', pregunta: v.pregunta.trim(), capitulo: capituloOk(v.capitulo) };
  if (v.tipo === 'tema' && typeof v.pregunta === 'string' && v.pregunta.trim()) return { tipo: 'tema', tema: String(v.tema ?? '').trim(), pregunta: v.pregunta.trim(), capitulo: capituloOk(v.capitulo) };
  return { tipo: 'nada' };
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
