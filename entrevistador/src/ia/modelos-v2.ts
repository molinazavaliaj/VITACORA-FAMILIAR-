import type Anthropic from '@anthropic-ai/sdk';

// Los modelos del esqueleto v2, por paso (decisión de Naza, 24/09, `docs/esqueleto-v2-guion-para-aprobar.md` §6).
// Ajuste C (24/09, decisión de producto de Naza tras una comparación a ciegas de 10 momentos del
// piloto: Sonnet ganó 1, empataron 9, Opus 0; Sonnet con 1,2 intentos de control contra 1,4 de Opus;
// USD 0,018 contra USD 0,047 por pregunta): la pregunta (y la repregunta, la presentación y el
// objeto, que comparten modelo) pasa de Opus a Sonnet. Sonnet donde es extracción o juicio con la
// ficha; Haiku donde solo se buscan pedidos (reserva, dejar, hoy no, parar). Un solo lugar: el gasto
// se anota con el modelo que de verdad se usó (`anotarUsos` en manual-v2.ts).

export const MODELO_PREGUNTA = 'claude-sonnet-5';
export const MODELO_FICHA = 'claude-sonnet-5';
export const MODELO_EVALUACION = 'claude-sonnet-5';
export const MODELO_PEDIDOS = 'claude-haiku-4-5';

export type PasoV2 = 'v2-presentacion' | 'v2-pregunta' | 'v2-repregunta' | 'v2-objeto' | 'v2-perfil' | 'v2-evaluar' | 'v2-pedidos';

export function modeloDePaso(paso: PasoV2): string {
  switch (paso) {
    case 'v2-perfil': return MODELO_FICHA;
    case 'v2-evaluar': return MODELO_EVALUACION;
    case 'v2-pedidos': return MODELO_PEDIDOS;
    default: return MODELO_PREGUNTA;
  }
}

/**
 * El texto de la respuesta del modelo, o un Error si se cortó (arreglo final I2). Si el modelo llegó
 * al `max_tokens` (`stop_reason: 'max_tokens'`) o no devolvió texto, parsear eso se leía como "todo
 * bien": una evaluación vacía daba "alcanza" sin banderas (se perdía un "no quiero seguir") y una
 * ficha cortada se descartaba. Se tira para que la carga quede a medio procesar y la retome
 * `cargar --reprocesar` (más seguro que medio JSON). `vacioEsCorte`: para la pregunta un texto vacío
 * NO es corte (lo toma el control y lo pide de nuevo); sin bloque de texto, sí.
 */
export function textoDelModelo(
  r: { content: { type: string; text?: string }[]; stop_reason?: string | null },
  paso: string,
  vacioEsCorte = true,
): string {
  if (r.stop_reason === 'max_tokens') throw new Error(`la respuesta del modelo se cortó: ${paso} llegó al max_tokens`);
  const bloque = r.content.find((b) => b.type === 'text');
  const texto = bloque && typeof bloque.text === 'string' ? bloque.text : null;
  if (texto === null) throw new Error(`la respuesta del modelo se cortó: ${paso} no devolvió texto`);
  if (vacioEsCorte && !texto.trim()) throw new Error(`la respuesta del modelo se cortó: ${paso} devolvió un texto vacío`);
  return texto;
}

// ── Ajuste B (24/09, aprobado por Naza): caché de la parte fija y sin "pensar" donde no hace falta ──

/**
 * Un prompt partido: lo FIJO (reglas e instrucciones, igual en todas las llamadas del mismo tipo y
 * para todas las personas) y lo VARIABLE (ficha, conversación, respuesta). Son las mismas palabras
 * que el prompt de antes; lo fijo va primero porque la caché de Anthropic es por prefijo.
 */
export type PromptPartido = { fijo: string; variable: string };

/**
 * El contenido del mensaje: lo fijo en su bloque con `cache_control` (caché de 5 minutos, el
 * default: la escribe la primera llamada y la leen las que vengan detrás mientras siga viva; si lo
 * fijo es más corto que el mínimo cacheable del modelo, la API no cachea ni cobra de más) y lo
 * variable en otro bloque, sin caché. `extra` va al final de lo variable (el motivo del reintento).
 */
export function contenidoConCache(p: PromptPartido, extra = ''): Anthropic.TextBlockParam[] {
  return [
    { type: 'text', text: p.fijo, cache_control: { type: 'ephemeral' } },
    { type: 'text', text: `${p.variable}${extra}` },
  ];
}

/**
 * Sin thinking: para la ficha y la evaluación (Sonnet 5, que piensa por defecto si no se dice nada)
 * y los pedidos (Haiku 4.5, que ya no pensaba: se dice igual, explícito). Extracción y juicio con
 * JSON de salida: pensar ahí es salida que se cobra y no cambia el resultado. La pregunta (Opus) NO
 * lo usa: ahí Naza eligió calidad.
 */
export const SIN_PENSAR: Anthropic.ThinkingConfigDisabled = { type: 'disabled' };
