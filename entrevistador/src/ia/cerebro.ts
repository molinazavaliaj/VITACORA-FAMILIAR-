import Anthropic from '@anthropic-ai/sdk';
import { cargarConfig } from '../config.js';
import { db } from '../db/cliente.js';
import { registrarUso, cuentaDeEsteServicio } from '../costos.js';
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
/** Una pregunta que el narrador ya respondió: para saber a qué tema pertenece un recuerdo que aparece tarde. */
export type PreguntaHecha = { orden: number; capitulo: string; texto: string };

/** La lista que ve el modelo para ubicar un recuerdo (solo las anteriores a la de hoy). */
export function listaDePreguntasHechas(preguntasHechas: PreguntaHecha[], ordenActual: number): string {
  const previas = preguntasHechas.filter((p) => p.orden < ordenActual).sort((a, b) => a.orden - b.orden);
  if (!previas.length) return '';
  return `
LAS PREGUNTAS QUE YA RESPONDIÓ ANTES (orden · capítulo · pregunta):
${previas.map((p) => `${p.orden} · ${p.capitulo} · ${p.texto.replace(/\s+/g, ' ').trim()}`).join('\n')}
`;
}

/*
 * Lo que ya contó otros días (biógrafo v2, 23/09). C1: contestó "no sé nada de mis abuelos" y la
 * repregunta le pidió "¿de tus abuelos te acordás de alguno?", cuando el primer día había contado
 * que su abuela le cocinaba todos los días. La evaluación no lo veía: era un problema de ENTRADA.
 * Naza: "no puede repreguntar cosas dichas jamás". Vacío = el prompt de siempre, sin cambios.
 */
function loQueYaContoEnTexto(loQueYaConto: string): string {
  if (!loQueYaConto.trim()) return '';
  return `
LO QUE YA CONTÓ OTROS DÍAS (lo que sabés de esta persona):
${loQueYaConto.trim()}

LA REPREGUNTA NUNCA PIDE LO QUE YA CONTÓ. Antes de escribirla, fijate arriba: si lo que le ibas a pedir ya lo dijo otro día (una persona, un lugar, cómo se llamaba, dónde vivía), no se lo pidas. Preguntá por lo que quedó abierto; y si no queda nada abierto, la respuesta alcanza.
`;
}

export const PROMPT_EVALUAR = (
  pregunta: string, transcripcion: string, duracionSegundos: number, evitar = '', trato: Trato = 'usted',
  preguntasHechas: PreguntaHecha[] = [], ordenActual = 0, loQueYaConto = '',
) =>
  `Pregunta de hoy: "${pregunta}"
Respuesta (duró ${duracionSegundos} segundos): "${transcripcion}"
${evitar}${listaDePreguntasHechas(preguntasHechas, ordenActual)}${loQueYaContoEnTexto(loQueYaConto)}
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

SI SE FUE A OTRO TEMA, NO SE LO REENCUADRA. Un narrador contesta sobre su primer trabajo y se va a contar la infancia: eso pasa, y está bien. La repregunta —si hace falta— NUNCA menciona el cambio de tema, NUNCA le pide que vuelva a la pregunta de hoy, NUNCA le aclara que habló de otra cosa ni "ordena" la charla. Si lo interrumpen para encarrilarlo, se calla: es la peor falla del producto. Lo que contó vale igual para juzgar si alcanza, y el libro lo ubica después en su capítulo.
${preguntasHechas.some((p) => p.orden < ordenActual) ? `Para eso, y SOLO si estás seguro, marcá a qué pregunta anterior pertenece de verdad lo que contó: "temaDeOrden" con el número de orden de esa pregunta (uno de la lista de arriba, nunca otro) y "temaMotivo" con una línea de por qué. Si contestó la pregunta de hoy, aunque haya tocado otros temas de paso, o si dudás, los dos van en null: una marca de más ensucia el libro, una de menos lo deja como está.` : ''}

SI PIDE QUE ALGO NO VAYA AL LIBRO, SE ANOTA ACÁ. Si dice que algo quede afuera —"esto prefiero que no vaya al libro", "estas historias prefiero que queden en mi mente", "no lo pongas", "que mi familia no lo sepa"— agregá "reservado": true. Si el pedido es sólo por una parte, agregá también "reservadoTramo" con ese tramo de su respuesta COPIADO TEXTUAL (una frase o dos, tal como las dijo, sin corregirle nada). Reservar es sagrado: si dudás de si está pidiendo que algo no se publique, marcá "reservado": true — publicar lo que pidió guardar es la peor falla posible, y volver a agregar algo después es fácil.

Respondé SOLO con JSON: {"suficiente": true} o {"suficiente": false, "repregunta": "..."}, y sumá "reservado": true (y "reservadoTramo": "..." si es sólo una parte), "dejarTema": "..." y "temaDeOrden": N con "temaMotivo": "..." cuando corresponda.`;

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

export type OpcionesDeReintento = { pausaMs?: number; narradorId?: string };
/** Lo que la evaluación necesita además de la respuesta: las preguntas ya hechas, para ubicar un recuerdo tardío. */
export type OpcionesDeEvaluacion = OpcionesDeReintento & {
  preguntasHechas?: PreguntaHecha[];
  ordenActual?: number;
  /** Lo que ya contó otros días (el perfil en texto): para no repreguntar lo dicho (C1). */
  loQueYaConto?: string;
};

/** Lo que la evaluación puede decir: si alcanza, si hay repregunta, y si algo se reserva. */
export type Evaluacion = {
  suficiente: boolean;
  repregunta?: string;
  /**
   * El narrador pidió que esto no vaya al libro (hallazgo 19).
   * `string` no es un capricho: el JSON del modelo no está tipado y contesta
   * `"reservado": "true"` o `"sí"` de vez en cuando.
   */
  reservado?: boolean | string;
  /** Cuando el pedido es por una parte: el tramo textual que no se publica. */
  reservadoTramo?: string;
  /** El narrador pidió dejar un tema ("vamos por otro lado"): cuál (bitácora 34). */
  dejarTema?: string;
  /** Lo que contó pertenece a una pregunta ANTERIOR: cuál (su orden), y por qué. Null = contestó la de hoy o el modelo duda. */
  temaDeOrden?: number | null;
  temaMotivo?: string | null;
};

/** La marca de "esto es de otra parte", tal como se guarda en la fila (`respuestas.tema_de_orden`, `tema_motivo`). */
export type TemaDeOtraParte = { temaDeOrden: number; temaMotivo: string | null };

/**
 * Normaliza la marca que devolvió el modelo. Es deliberadamente estricta: solo
 * vale un entero que esté en la lista de preguntas ya hechas y sea anterior a
 * la de hoy. Cualquier otra cosa (un número inventado, la misma orden, un
 * texto, null) es "no hay marca": una marca de más manda una historia al
 * capítulo equivocado, que es exactamente lo que esto viene a arreglar.
 */
export function temaDe(
  evaluacion: Pick<Evaluacion, 'temaDeOrden' | 'temaMotivo'>, preguntasHechas: PreguntaHecha[], ordenActual: number,
): TemaDeOtraParte | null {
  const orden = typeof evaluacion.temaDeOrden === 'string' ? Number(evaluacion.temaDeOrden) : evaluacion.temaDeOrden;
  if (typeof orden !== 'number' || !Number.isInteger(orden) || orden >= ordenActual) return null;
  if (!preguntasHechas.some((p) => p.orden === orden)) {
    console.warn(`evaluar: el modelo marcó temaDeOrden=${orden}, que no está entre las preguntas hechas; se ignora.`);
    return null;
  }
  const motivo = typeof evaluacion.temaMotivo === 'string' && evaluacion.temaMotivo.trim() ? evaluacion.temaMotivo.trim().slice(0, 300) : null;
  return { temaDeOrden: orden, temaMotivo: motivo };
}

/**
 * La reserva tal como se va a guardar, a partir de lo que devolvió el modelo.
 *
 * Cualquiera de las dos marcas alcanza para reservar: un `reservadoTramo` sin el
 * booleano es un pedido igual (y una versión anterior de esta función lo perdía —
 * justo el caso en que el modelo contesta a medias). También vale un `reservado`
 * que vino como texto (`"true"`, `"sí"`), que es la clase de cosa que el modelo
 * hace: acá se reserva de más, nunca de menos.
 *
 * `reservadoTramo` solo se usa si el tramo está TEXTUALMENTE en la transcripción:
 * si el modelo lo parafraseó o lo inventó, sacar ese texto no sacaría nada y lo
 * reservado terminaría publicado igual — el peor error posible. En ese caso se
 * reserva la respuesta entera.
 */
export function reservaDe(
  evaluacion: Pick<Evaluacion, 'reservado' | 'reservadoTramo'>, transcripcion: string,
): { reservada: boolean; tramo: string | null } {
  const marcado = evaluacion.reservado;
  const dijoQueSi =
    marcado === true || (typeof marcado === 'string' && /^(true|si|sí|yes)$/i.test(marcado.trim()));

  const tramo = typeof evaluacion.reservadoTramo === 'string' ? evaluacion.reservadoTramo.trim() : '';
  if (!dijoQueSi && !tramo) return { reservada: false, tramo: null };
  if (!tramo) return { reservada: true, tramo: null };
  if (!transcripcion.includes(tramo)) {
    console.warn('evaluar: el modelo marcó un tramo reservado que no está textual en la transcripción; se reserva la respuesta entera.');
    return { reservada: true, tramo: null };
  }
  return { reservada: true, tramo };
}

export async function evaluarRespuesta(
  pregunta: string, transcripcion: string, duracionSegundos: number, evitar = '', trato: Trato = 'usted',
  opciones: OpcionesDeEvaluacion = {},
): Promise<Evaluacion> {
  const pausaMs = opciones.pausaMs ?? PAUSA_REINTENTO_MS;
  const preguntasHechas = opciones.preguntasHechas ?? [];
  const ordenActual = opciones.ordenActual ?? 0;

  const pedirleAlModelo = async () => {
    const respuesta = await cliente.messages.create({
      model: MODELO_EVALUACION, max_tokens: 500, system: estiloCerebro(trato),
      messages: [{ role: 'user', content: PROMPT_EVALUAR(pregunta, transcripcion, duracionSegundos, evitar, trato, preguntasHechas, ordenActual, opciones.loQueYaConto ?? '') }],
    });
    await registrarUso(db, {
      servicio: 'entrevistador', paso: 'evaluar', modelo: MODELO_EVALUACION, proveedor: 'anthropic',
      cuenta: cuentaDeEsteServicio(), narradorId: opciones.narradorId ?? null, uso: respuesta.usage,
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

/** Lo que hay que anotar de una respuesta que NO se evalúa (ampliación, cierre). */
export type ReservaYDejarTema = {
  reserva: { reservada: boolean; tramo: string | null };
  dejarTema: string | null;
};

/**
 * La reserva y el tema a dejar, para las respuestas que NO pasan por la
 * evaluación: la ampliación de una repregunta y la pregunta de cierre.
 *
 * Existe porque ahí no interesa si la respuesta alcanza ni se repregunta (el
 * flujo se saltea la evaluación a propósito), pero un "esto no lo pongas" o un
 * "vamos por otro lado" dicho en la ampliación o en el "¿faltó algo?" vale
 * exactamente lo mismo que en la respuesta del día: si no se detecta, se
 * publica igual. Es la falla más grave del producto.
 *
 * Es una llamada corta y aparte (no reusa `evaluarRespuesta`) para que nadie
 * pueda quedarse con una repregunta de más en el cierre: devuelve solo estas dos
 * cosas. Cuesta una llamada más por ampliación (~USD 0,01) y no se le niega a
 * nada que evite publicar lo que el narrador pidió guardar.
 *
 * Nunca lanza: si el modelo falla dos veces, devuelve "sin reserva".
 */
export async function detectarReservaYDejarTema(
  transcripcion: string, trato: Trato = 'usted', opciones: OpcionesDeReintento = {},
): Promise<ReservaYDejarTema> {
  const vacio: ReservaYDejarTema = { reserva: { reservada: false, tramo: null }, dejarTema: null };
  const pausaMs = opciones.pausaMs ?? PAUSA_REINTENTO_MS;

  const pedirleAlModelo = async (): Promise<ReservaYDejarTema> => {
    const respuesta = await cliente.messages.create({
      model: MODELO_EVALUACION, max_tokens: 300, system: estiloCerebro(trato),
      messages: [{ role: 'user', content: PROMPT_MARCAS(transcripcion) }],
    });
    await registrarUso(db, {
      servicio: 'entrevistador', paso: 'reserva', modelo: MODELO_EVALUACION, proveedor: 'anthropic',
      cuenta: cuentaDeEsteServicio(), narradorId: opciones.narradorId ?? null, uso: respuesta.usage,
    });
    // Si el JSON no se puede leer, se sigue sin marcas: no hay qué anotar.
    const leido = extraerJson<Evaluacion & { dejarTema?: string }>(textoDe(respuesta), { suficiente: true })!;
    const dejarTema = typeof leido.dejarTema === 'string' && leido.dejarTema.trim() ? leido.dejarTema.trim() : null;
    return { reserva: reservaDe(leido, transcripcion), dejarTema };
  };

  try {
    return await pedirleAlModelo();
  } catch (err) {
    console.warn(`marcas: el modelo no devolvió nada (se reintenta en ${pausaMs} ms):`, err);
  }

  await esperar(pausaMs);
  try {
    return await pedirleAlModelo();
  } catch (err) {
    console.warn('marcas: el modelo volvió a fallar; la respuesta queda sin reserva ni tema anotado:', err);
    return vacio;
  }
}

/**
 * El prompt de `detectarReservaYDejarTema`: solo las dos marcas, sin juzgar la
 * respuesta. Exportado para poder mirarlo y medirlo como los otros.
 */
export const PROMPT_MARCAS = (transcripcion: string) =>
  `Esto es lo que acaba de contar una persona en la entrevista de su biografía:
"${transcripcion}"

Fijate SOLO dos cosas, en lo que dijo:
1. ¿Pidió que algo NO vaya al libro? ("esto prefiero que no vaya al libro", "no lo pongas", "que mi familia no lo sepa"). Si sí, poné "reservado": true; si el pedido es por una parte nada más, copiá ese tramo TEXTUAL en "reservadoTramo" (una frase o dos, tal como las dijo).
2. ¿Pidió dejar un tema? ("vamos por otro lado", "prefiero no hablar de eso", "dejemos eso"). Si sí, poné "dejarTema" con el tema en pocas palabras y en tercera persona ("su tío y las drogas", "la muerte de su hermano").

Si no pidió nada de eso, devolvé {}. Ante la duda de si pidió reservar, marcá "reservado": true. No opines sobre nada más y no agregues texto fuera del JSON.

Respondé SOLO con JSON: {} o {"reservado": true, "reservadoTramo": "..."} o {"dejarTema": "..."} (pueden ir juntas).`;

/**
 * Reemplaza una pregunta fija cuyo capítulo no aplica a esta vida
 * (ej. "Los hijos" si no tuvo hijos): pregunta por lo más rico que ya contó.
 */
export async function generarPreguntaReemplazo(
  comoLeDicen: string, historiaCompleta: string, capitulos: string[], capituloQueNoAplica: string, evitar = '', trato: Trato = 'usted',
  narradorId?: string,
): Promise<{ texto: string; capitulo: string }> {
  const respuesta = await cliente.messages.create({
    model: MODELO, max_tokens: 500, system: estiloCerebro(trato),
    messages: [{
      role: 'user',
      content: `Sos el biógrafo de ${comoLeDicen}. Esto es lo que contó hasta ahora:\n\n${historiaCompleta}\n${evitar}\nLa pregunta que tocaba hoy era del capítulo «${capituloQueNoAplica}», que NO aplica a su vida. Necesitás reemplazarla por una pregunta que aproveche mejor este día.\n\nBuscá en lo que ya contó: una persona que nombró y no exploró, una época con huecos, algo que claramente disfrutó contar y da para más. La pregunta debe sonar a que LO ESCUCHASTE (referí lo que él contó), tratarlo de ${trato}, y ser una sola pregunta clara. Jamás menciones el tema que no aplica ni que estás reemplazando nada.\n\nCapítulos disponibles del libro: ${capitulos.join(', ')}.\n\nRespondé SOLO con JSON: {"texto": "...", "capitulo": "..."}`,
    }],
  });
    await registrarUso(db, {
      servicio: 'entrevistador', paso: 'reemplazo', modelo: MODELO, proveedor: 'anthropic',
      cuenta: cuentaDeEsteServicio(), narradorId: narradorId ?? null, uso: respuesta.usage,
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
  capitulo: string, pregunta: string, transcripcion: string, narradorId?: string,
): Promise<'no_tuvo' | 'normal'> {
  const que = capitulo === 'Los hijos' ? 'hijos' : 'pareja (novia, novio, esposa, esposo, matrimonio)';
  const respuesta = await cliente.messages.create({
    model: MODELO, max_tokens: 20,
    messages: [{
      role: 'user',
      content: `Un narrador mayor responde por audio a la pregunta "${pregunta}" (capítulo «${capitulo}» de su biografía). Transcripción: "${transcripcion}".\n¿Dice CLARAMENTE que NUNCA tuvo ${que}? Respondé SOLO "no_tuvo" o "normal". Si tuvo y los perdió, si habla de otros, o ante cualquier duda: "normal".`,
    }],
  });
    await registrarUso(db, {
      servicio: 'entrevistador', paso: 'no_tuvo', modelo: MODELO, proveedor: 'anthropic',
      cuenta: cuentaDeEsteServicio(), narradorId: narradorId ?? null, uso: respuesta.usage,
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
  narradorId?: string,
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
    await registrarUso(db, {
      servicio: 'entrevistador', paso: 'cierre', modelo: MODELO, proveedor: 'anthropic',
      cuenta: cuentaDeEsteServicio(), narradorId: narradorId ?? null, uso: respuesta.usage,
    });
  const v = extraerJson<VeredictoCierre>(textoDe(respuesta), { tipo: 'nada' })!;
  const capituloOk = (c: unknown) => (typeof c === 'string' && capitulos.includes(c) ? c : capitulos[capitulos.length - 1] ?? 'Otros');
  if (v.tipo === 'conto' && typeof v.pregunta === 'string' && v.pregunta.trim()) return { tipo: 'conto', pregunta: v.pregunta.trim(), capitulo: capituloOk(v.capitulo) };
  if (v.tipo === 'tema' && typeof v.pregunta === 'string' && v.pregunta.trim()) return { tipo: 'tema', tema: String(v.tema ?? '').trim(), pregunta: v.pregunta.trim(), capitulo: capituloOk(v.capitulo) };
  return { tipo: 'nada' };
}

export async function detectarIntencion(texto: string, narradorId?: string): Promise<'quiere_parar' | 'normal'> {
  const respuesta = await cliente.messages.create({
    model: MODELO, max_tokens: 50,
    messages: [{
      role: 'user',
      // Sin "un señor mayor" (22/09): el narrador puede ser una mujer (Dora, Immaculada)
      // y puede tener 30 años. Quién es no cambia si está pidiendo parar.
      content: `Una persona que participa de entrevistas diarias por WhatsApp escribió: "${texto}".\n¿Está pidiendo PARAR o dejar las entrevistas (cansancio, molestia, "no quiero más", "basta")? Respondé SOLO "quiere_parar" o "normal". Ante la duda: "normal".`,
    }],
  });
    await registrarUso(db, {
      servicio: 'entrevistador', paso: 'intencion', modelo: MODELO, proveedor: 'anthropic',
      cuenta: cuentaDeEsteServicio(), narradorId: narradorId ?? null, uso: respuesta.usage,
    });
  const veredicto = textoDe(respuesta);
  return veredicto === 'quiere_parar' ? 'quiere_parar' : 'normal';
}
