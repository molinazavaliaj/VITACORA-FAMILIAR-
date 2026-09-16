// Qué compró un pedido, leído de `pedidos.extras` (CONTRATO.md). Copia fiel
// de web/src/lib/productos.ts:168-201 — misma regla que
// web/src/lib/productos.ts; si cambia una, cambia la otra.

/** Con qué voz se narra el audiolibro. "real" = pedidos anteriores al 13/09 (sus audios, tal cual). */
export type Voz = 'clonada' | 'narrador' | 'real';

export type ProductosDelPedido = {
  pdf: boolean;
  audiolibro: Voz | null;
  impreso: 'bn' | 'color' | null;
  copias: number;
  marcos: number;
};

/**
 * Lee `pedidos.extras` de cualquier época. Antes del 13/09 la base era "PDF +
 * audiolibro con sus audios" y `extras` solo traía impreso y marcos: sin la
 * clave `pdf`, se interpreta así.
 */
export function productosDelPedido(extras: unknown): ProductosDelPedido {
  const e = (extras && typeof extras === 'object' ? extras : {}) as Record<string, unknown>;
  const impreso = e.impreso === 'bn' || e.impreso === 'color' ? e.impreso : null;
  const marcos = typeof e.marcos === 'number' ? Math.max(0, Math.floor(e.marcos)) : 0;
  const copias = typeof e.copias === 'number' ? Math.max(0, Math.floor(e.copias)) : impreso ? 1 : 0;
  if (!('pdf' in e)) return { pdf: true, audiolibro: 'real', impreso, copias, marcos };
  const voz = e.audiolibro === 'clonada' || e.audiolibro === 'narrador' || e.audiolibro === 'real' ? e.audiolibro : null;
  return { pdf: e.pdf === true, audiolibro: voz, impreso, copias, marcos };
}
