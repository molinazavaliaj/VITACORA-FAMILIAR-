import type Anthropic from '@anthropic-ai/sdk';
import type { Perfil } from './perfil.js';
import { encargoDelBiografo } from './encargo-entrevista.js';
import type { Objetivo } from './pregunta-v2.js';
import { MODELO_EVALUACION, MODELO_PEDIDOS, textoDelModelo, SIN_PENSAR } from './modelos-v2.js';

// La evaluación del esqueleto v2 (24/09). Decide si con la respuesta hay con qué escribir la página
// del día y, si no, QUÉ FALTÓ de la fila (sus pormenores): la repregunta la escribe Opus después
// (`escribirPregunta` con un objetivo `repregunta`), junta y en una sola pregunta. Ya no "ahonda en
// el pormenor" (N37). Sonnet: es un juicio con la ficha, no un texto para la persona.
//
// Para las respuestas a repreguntas y a objetos no se evalúa si alcanza (no se vuelve a repreguntar):
// `evaluarPedidos` (Haiku, prompt corto) solo busca reserva, tema a dejar, "hoy no" y "no quiero seguir" (N29).

export type EvaluacionV2 = {
  suficiente: boolean;
  /** Los pormenores de la fila que quedaron afuera, en pocas palabras (hasta 4). */
  falto: string[];
  reservado?: boolean;
  reservadoTramo?: string;
  dejarTema?: string;
  hoyNo?: boolean;
  quiereParar?: boolean;
};
export type Pedidos = Pick<EvaluacionV2, 'reservado' | 'reservadoTramo' | 'dejarTema' | 'hoyNo' | 'quiereParar'>;

const PEDIDOS = `- Si pidió cambiar de tema ("vamos por otro lado", "prefiero no hablar de eso"): "dejarTema" con el
  tema en pocas palabras. Esquivar no es pedir.
- Si dice que HOY no puede ("hoy no", "mañana te contesto", "estoy cansado hoy"): "hoyNo": true.
- Si dice que no quiere seguir con la entrevista ("no quiero seguir", "dejemos esto", "no me
  manden más"): "quiereParar": true. No lo convenzas.
- Si pidió que algo no vaya al libro ("esto no lo pongas", "que quede para mí"): "reservado": true,
  y si es una parte, "reservadoTramo" con ese tramo COPIADO TEXTUAL. Ante la duda, reservá.`;

/** El tema de la fila en pocas líneas (también lo usa la búsqueda del piloto que reusa, `reusar-v2.ts`). */
export const objetivoEnLinea = (o: Objetivo): string =>
  o.tipo === 'nucleo' ? `${o.tema}${o.pormenores.length ? `\nPormenores de la fila: ${o.pormenores.join('; ')}.` : ''}`
    : o.tipo === 'variable' ? `Algo que nombró y no contó: ${o.anclas.join('; ')}.`
      : o.tipo === 'objeto' ? (o.final ? 'La cosa que guardaría de toda su vida, con foto.' : 'Un objeto de esa época, con foto.')
        : `Repregunta: ${o.falto.join('; ')}.`;

const DATOS_EVALUAR = (fila: string, pregunta: string, respuesta: string, segundos: number, conversacion: string, proxima: string | null) => `LO ÚLTIMO QUE HABLARON (cada respuesta con la pregunta que la originó):
${conversacion || '(es la primera respuesta)'}

EL TEMA DE HOY (lo que el guion quería que saliera):
${fila}
${proxima ? `
LA PRÓXIMA PREGUNTA (otro día) VA A TRATAR:
${proxima}
` : ''}
LA PREGUNTA DE HOY:
${pregunta}

LO QUE CONTESTÓ (duró ${segundos} segundos):
${respuesta}`;

const TAREA_EVALUAR = `Tu trabajo: decidir si con esta respuesta hay con qué escribir la página de hoy del libro y, si no,
decir QUÉ FALTÓ del tema.

- ALCANZA si hay con qué escribir: dos o tres detalles concretos, con al menos una escena o un
  nombre. El largo no decide: diez segundos pueden valer un capítulo. Si alcanza, no pidas más por
  costumbre, y "falto" queda vacío.
- NO ALCANZA solo si hay poco material (generalidades sin una escena, sin un nombre, sin un hecho),
  o si contó algo fuerte y lo dejó en una frase. Entonces "falto": los pormenores del tema que
  quedaron afuera, tal como están en la fila, hasta 4. Nunca un tema nuevo. Nunca un detalle de un
  detalle: lo que faltó del TEMA, no más precisión sobre lo que ya contó.
- Los pormenores son lo que conviene juntar, no una lista para tachar: si no nombró algo que el
  tema daba de ejemplo, no falta.
- Si dijo "esto ya te lo conté" o parecido: alcanza, "falto" vacío.
- Si se fue a otro tema, está bien: no se lo reencuadra.
${PEDIDOS}`;

/** E17 (25/09): la regla que se suma a la tarea solo cuando hay próxima fila. */
const REGLA_PROXIMA = '- Lo que va a tratar LA PRÓXIMA PREGUNTA no falta acá: no lo pongas en "falto", se pregunta ahí.';

const FORMATO_EVALUAR = `Respondé SOLO con JSON: {"suficiente": true, "falto": []} o {"suficiente": false, "falto": ["..."]},
y sumá "reservado", "hoyNo", "quiereParar", "dejarTema" y "reservadoTramo" cuando corresponda.`;

export const PROMPT_EVALUAR_V2 = (encargo: string, fila: string, pregunta: string, respuesta: string, segundos: number, conversacion: string, proxima: string | null = null) => `
${encargo}

${DATOS_EVALUAR(fila, pregunta, respuesta, segundos, conversacion, proxima)}

${TAREA_EVALUAR}${proxima ? `
${REGLA_PROXIMA}` : ''}

${FORMATO_EVALUAR}`;

const enTexto = (c: { pregunta: string; respuesta: string }[]) => c.map((x) => `P: ${x.pregunta}\nR: ${x.respuesta}`).join('\n\n');

/** El prompt en el orden de lectura (el que aprobó Naza; `render-textos-v2.ts` y los tests lo miran). */
export function armarPromptEvaluar(
  perfil: Perfil,
  objetivo: Objetivo,
  pregunta: string,
  respuesta: string,
  segundos: number,
  conversacion: { pregunta: string; respuesta: string }[],
  evitar: string[],
  proxima: Objetivo | null = null,
): string {
  return PROMPT_EVALUAR_V2(encargoDelBiografo(perfil, evitar), objetivoEnLinea(objetivo), pregunta, respuesta, segundos, enTexto(conversacion), temaDeProxima(proxima));
}

/** E17: el tema de la próxima fila para la evaluación (solo del guion: una libre u objeto no pisa una repregunta). */
function temaDeProxima(proxima: Objetivo | null): string | null {
  return proxima?.tipo === 'nucleo' ? objetivoEnLinea(proxima) : null;
}

const PALABRAS_VACIAS = new Set(['como', 'cuando', 'donde', 'quien', 'quienes', 'cual', 'cuales', 'porque', 'para', 'pero', 'esto', 'esta', 'este', 'estos', 'estas', 'esos', 'esas', 'algo', 'cada', 'todo', 'toda', 'todos', 'todas', 'sobre', 'entre', 'desde', 'hasta', 'tiene', 'tenia', 'hacia', 'eran', 'fueron', 'sino', 'tambien', 'mucho', 'muchos', 'otro', 'otra', 'otros', 'otras', 'suyo', 'suya', 'suyos', 'suyas']);
/** Las palabras que dicen algo (4 letras o más, sin tildes, sin las vacías), por su raíz corta (5 letras): "aprendió" = "aprendio". */
function raices(texto: string): Set<string> {
  const palabras = texto.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').match(/[a-zñ]+/g) ?? [];
  return new Set(palabras.filter((p) => p.length >= 4 && !PALABRAS_VACIAS.has(p)).map((p) => p.slice(0, 5)));
}

/**
 * E17 (piloto esqueleto v2, 25/09): lo que faltó que en realidad va a pedir la próxima fila no se
 * repregunta ("quién te bancó" en `pruebas`, cuando `fuerza` venía después). Determinista: se saca
 * un "faltó" solo si comparte con el tema o los pormenores de la próxima fila del guion al menos
 * MIN_RAICES_EN_COMUN palabras con sentido Y la mitad o más de las suyas. Peca de sacar de menos: una
 * sola palabra en común ("qué aprendió de esa etapa") puede ser casualidad y nunca la saca el código;
 * eso lo decide la regla del prompt, que ve el sentido (el caso real no compartía ninguna palabra).
 */
const MIN_RAICES_EN_COMUN = 2;
export function sinLoDeLaProxima(falto: string[], proxima: Objetivo | null): string[] {
  if (proxima?.tipo !== 'nucleo') return falto;
  const deLaProxima = raices(`${proxima.tema} ${proxima.pormenores.join(' ')}`);
  return falto.filter((f) => {
    const propias = [...raices(f)];
    const enComun = propias.filter((r) => deLaProxima.has(r)).length;
    return !(enComun >= MIN_RAICES_EN_COMUN && enComun / propias.length >= 0.5);
  });
}

const MAX_FALTO = 4;

function leerJson(salida: string): Record<string, unknown> | null {
  try {
    const limpio = salida.trim();
    const c = JSON.parse(limpio.slice(limpio.indexOf('{'), limpio.lastIndexOf('}') + 1));
    return typeof c === 'object' && c !== null ? (c as Record<string, unknown>) : null;
  } catch {
    return null;
  }
}

function leerPedidos(c: Record<string, unknown>): Pedidos {
  const p: Pedidos = {};
  if (c.reservado === true) p.reservado = true;
  if (typeof c.reservadoTramo === 'string' && c.reservadoTramo.trim()) p.reservadoTramo = c.reservadoTramo.trim();
  if (typeof c.dejarTema === 'string' && c.dejarTema.trim()) p.dejarTema = c.dejarTema.trim();
  if (c.hoyNo === true) p.hoyNo = true;
  if (c.quiereParar === true) p.quiereParar = true;
  return p;
}

/**
 * Cuando el JSON viene cortado (`leerJson` devuelve `null`: un `max_tokens` corto puede cortar un
 * "reservadoTramo" largo a mitad de camino y tirar todo el JSON), los pedidos booleanos igual se
 * recuperan por regex en vez de perderse todos — el texto libre (reservadoTramo/dejarTema) no,
 * porque cortado no sirve.
 */
function leerPedidosPorRegex(salida: string): Pedidos {
  const p: Pedidos = {};
  if (/"reservado"\s*:\s*true/.test(salida)) p.reservado = true;
  if (/"hoyNo"\s*:\s*true/.test(salida)) p.hoyNo = true;
  if (/"quiereParar"\s*:\s*true/.test(salida)) p.quiereParar = true;
  return p;
}

/** Campo por campo. Si viene roto, alcanza (el día no se corta) pero los pedidos booleanos se
 * recuperan igual (por regex si el JSON está cortado). */
export function parsearEvaluacion(salida: string): EvaluacionV2 {
  const c = leerJson(salida);
  if (!c) return { suficiente: true, falto: [], ...leerPedidosPorRegex(salida) };
  if (typeof c.suficiente !== 'boolean') return { suficiente: true, falto: [], ...leerPedidos(c) };
  const falto = Array.isArray(c.falto) ? c.falto.filter((x): x is string => typeof x === 'string' && x.trim() !== '').map((x) => x.trim()).slice(0, MAX_FALTO) : [];
  return { suficiente: c.suficiente, falto: c.suficiente ? [] : falto, ...leerPedidos(c) };
}

export const DIAS_SIN_REPREGUNTAR = 3;

/** Cansancio: si las dos últimas repreguntas quedaron sin contestar, no se repregunta por unos días. */
export function hayCansancio(ultimasRepreguntas: { contestada: boolean }[]): boolean {
  const dos = ultimasRepreguntas.slice(-2);
  return dos.length === 2 && dos.every((r) => !r.contestada);
}

/**
 * Una llamada. Sin reintentos: no hay texto para la persona que controlar. `max_tokens` 4000 (el que
 * no se usa no se cobra); si igual se corta o viene sin texto, tira (`textoDelModelo`): una evaluación
 * vacía se leía como "alcanza" y se perdía un "no quiero seguir" (arreglo final I2).
 * `proxima` (E17, 25/09): la próxima fila pendiente del guion; lo que va a pedir ella no falta acá.
 */
export async function evaluarV2(
  cliente: Anthropic,
  perfil: Perfil,
  objetivo: Objetivo,
  pregunta: string,
  respuesta: string,
  segundos: number,
  conversacion: { pregunta: string; respuesta: string }[],
  evitar: string[],
  proxima: Objetivo | null = null,
): Promise<{ evaluacion: EvaluacionV2; usos: Anthropic.Usage[] }> {
  const r = await cliente.messages.create({
    model: MODELO_EVALUACION, max_tokens: 4000, thinking: SIN_PENSAR,
    // Sin caché (ajuste B): lo fijo (~2.900 caracteres) no llega al mínimo cacheable de Sonnet 5
    // (1024 tokens), así que se manda entero y en su orden de siempre.
    messages: [{ role: 'user', content: armarPromptEvaluar(perfil, objetivo, pregunta, respuesta, segundos, conversacion, evitar, proxima) }],
  });
  const evaluacion = parsearEvaluacion(textoDelModelo(r, 'la evaluación'));
  // E17: si todo lo que faltó es de la próxima fila, queda vacío y no hay repregunta (`decidirTrasEvaluar`).
  return { evaluacion: { ...evaluacion, falto: sinLoDeLaProxima(evaluacion.falto, proxima) }, usos: [r.usage] };
}

export const PROMPT_PEDIDOS = (respuesta: string) => `
Sos el biógrafo que entrevista a una persona por WhatsApp para el libro de su vida. Esta es su
respuesta a una repregunta o a un pedido de foto. No tenés que juzgar si alcanza: solo fijate si
PIDE algo.

LO QUE CONTESTÓ:
${respuesta}

${PEDIDOS}

Respondé SOLO con JSON con las claves que correspondan ({} si no pide nada): {"reservado": true,
"hoyNo": true, "quiereParar": true, "reservadoTramo": "...", "dejarTema": "..."}.`;

export function armarPromptPedidos(respuesta: string): string {
  return PROMPT_PEDIDOS(respuesta);
}

export async function evaluarPedidos(cliente: Anthropic, respuesta: string): Promise<{ pedidos: Pedidos; usos: Anthropic.Usage[] }> {
  // Sin caché (ajuste B): el prompt entero (~350 tokens) no llega al mínimo cacheable de Haiku 4.5
  // (4096), así que partirlo no ahorraría nada y cambiaría el orden por nada.
  const r = await cliente.messages.create({ model: MODELO_PEDIDOS, max_tokens: 2000, thinking: SIN_PENSAR, messages: [{ role: 'user', content: armarPromptPedidos(respuesta) }] });
  const texto = textoDelModelo(r, 'la evaluación de pedidos');
  const c = leerJson(texto);
  return { pedidos: c ? leerPedidos(c) : leerPedidosPorRegex(texto), usos: [r.usage] };
}
