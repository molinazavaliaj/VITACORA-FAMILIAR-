// Cuánto cuesta cada llamada del escritor (decisión 7 del spec: "un dólar es un dólar").
// USD por millón de tokens (skill claude-api, 25/09/2026). Escritura de caché: 1,25× la entrada
// (5 minutos) o 2× (1 hora). Lectura de caché: el precio de la tabla. Batch: la mitad de todo.
// Un modelo sin precio tira: con 0 el tope de gasto no frenaría nada.

export type UsoApi = {
  input_tokens?: number | null;
  output_tokens?: number | null;
  cache_creation_input_tokens?: number | null;
  cache_read_input_tokens?: number | null;
  cache_creation?: { ephemeral_5m_input_tokens?: number | null; ephemeral_1h_input_tokens?: number | null } | null;
};

/** `sinLote`: el proveedor no tiene el Batch de Anthropic (va directo): no lleva el descuento aunque la fila diga lote. */
export const PRECIOS_ESCRITOR: Record<string, { input: number; output: number; cacheRead: number; sinLote?: boolean }> = {
  'claude-opus-5-5': { input: 4, output: 20, cacheRead: 0.2 },
  'claude-sonnet-5-5': { input: 2, output: 10, cacheRead: 0.2 },
  // 07/10/2026: lo mecánico de la configuración económica.
  'claude-haiku-4-5': { input: 1, output: 5, cacheRead: 0.1 },
  // PRUEBA del 07/10 con otros proveedores (precios publicados; la key de Google de Naza es gratis, pero se cuenta
  // lo que costaría pagando). DeepSeek: hora pico (fuera de pico, la mitad). Gemini Flash: el precio desde el 01/01/2027.
  'deepseek-v4-pro': { input: 1.32, output: 3.96, cacheRead: 0.044, sinLote: true },
  'gemini-3.1-pro-preview': { input: 2, output: 12, cacheRead: 0.2, sinLote: true },
  'gemini-3.8-flash': { input: 1.5, output: 7.5, cacheRead: 0.15, sinLote: true },
};

const t = (v: number | null | undefined): number => (typeof v === 'number' && Number.isFinite(v) ? v : 0);

export function usdDeLlamada(modelo: string, uso: UsoApi, o: { lote: boolean }): number {
  const p = PRECIOS_ESCRITOR[modelo];
  if (!p) throw new Error(`costos del escritor: no hay precio para ${modelo}`);
  const unaHora = t(uso.cache_creation?.ephemeral_1h_input_tokens);
  // Sin el desglose de 5 minutos (cache_creation ausente, vacío o con null), lo escrito que no es de 1 hora es de 5 minutos.
  const cinco = uso.cache_creation?.ephemeral_5m_input_tokens;
  const cincoMin = typeof cinco === 'number' ? t(cinco) : Math.max(0, t(uso.cache_creation_input_tokens) - unaHora);
  const porMillon = t(uso.input_tokens) * p.input + t(uso.output_tokens) * p.output + cincoMin * p.input * 1.25 + unaHora * p.input * 2 + t(uso.cache_read_input_tokens) * p.cacheRead;
  return Math.round((porMillon / 1_000_000) * (o.lote && !p.sinLote ? 0.5 : 1) * 1e6) / 1e6;
}
