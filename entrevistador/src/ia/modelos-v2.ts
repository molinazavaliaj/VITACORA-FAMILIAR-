// Los modelos del esqueleto v2, por paso (decisión de Naza, 24/09, `docs/esqueleto-v2-guion-para-aprobar.md` §6).
// Opus donde se nota (lo que lee la persona); Sonnet donde es extracción o juicio con la ficha; Haiku
// donde solo se buscan pedidos (reserva, dejar, hoy no, parar). Un solo lugar: el gasto se anota con
// el modelo que de verdad se usó (`anotarUsos` en manual-v2.ts).

export const MODELO_PREGUNTA = 'claude-opus-5';
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
