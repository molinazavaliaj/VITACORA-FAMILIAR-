// Cómo se le manda una llamada a la API. Los documentos van en el orden de la receta (sección 2:
// "lo que se repite queda en caché") y la caché se marca al final de lo que comparten varias llamadas.
// El texto que lee el modelo es el de textoParaElModelo(llamada): cada documento seguido de "\n\n".
import type { Llamada } from '../llamadas/armar.js';
import type { PedidoModelo } from './tipos.js';

export const bloquesDeLlamada = (l: Llamada): string[] => [...l.docs, l.instr];

/**
 * Índices de `docs` donde termina un prefijo que otra llamada repite:
 * - las piezas del novelista, el arreglo y el corrector arrancan con <ficha> y <voz> (iguales en ~40 llamadas por libro);
 * - el registro y el plan: entero (lo reusan sus reintentos, que solo cambian las instrucciones);
 * - los hechos: hasta <registro> (lo reusa el repaso) y entero (lo reusan las disputas, que llevan los mismos documentos).
 * Nunca más de 2 marcas (la API acepta 4). Un prefijo de menos de 512 tokens (Opus 5.5) no se cachea, sin error.
 */
export function puntosDeCache(nombre: string, docs: string[]): number[] {
  if (/^(3a-|3b-|3c-|3d-|6-arreglo-|7-estilo-)/.test(nombre)) return docs[0]?.startsWith('<ficha>') && docs[1]?.startsWith('<voz>') ? [1] : [];
  if (nombre === '1-registro' || nombre === '2-plan') return [docs.length - 1];
  if (nombre === '4-hechos' || nombre.startsWith('disputa-')) return [4, docs.length - 1];
  if (nombre === '4-hechos-repaso') return [4];
  return [];
}

export function armarParams(p: PedidoModelo): Record<string, unknown> {
  const content = p.bloques.map((texto, i) => ({
    type: 'text',
    text: i < p.bloques.length - 1 ? `${texto}\n\n` : texto,
    ...(p.cacheEn.includes(i) ? { cache_control: { type: 'ephemeral' } } : {}),
  }));
  return { model: p.modelo, max_tokens: p.maxTokens, thinking: { type: 'adaptive' }, output_config: { effort: p.esfuerzo }, messages: [{ role: 'user', content }] };
}
