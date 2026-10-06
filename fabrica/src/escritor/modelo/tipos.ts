import type { UsoApi } from '../costos.js';

export type Esfuerzo = 'low' | 'medium' | 'high' | 'xhigh' | 'max';
/** Un pedido al modelo: `bloques` = los documentos de la llamada y, al final, las instrucciones. */
export type PedidoModelo = { clave: string; modelo: string; bloques: string[]; cacheEn: number[]; maxTokens: number; esfuerzo: Esfuerzo };
export type RespuestaModelo = { texto: string; uso: UsoApi; motivoFin: string };

export class ErrorDelModelo extends Error {
  /** Lo que la API cobró aunque la llamada no sirva (rechazo, corte por max_tokens): el ejecutor lo suma al gasto. */
  readonly uso?: UsoApi;
  /** La respuesta se cortó por max_tokens: el ejecutor la repite una sola vez. */
  readonly porMaxTokens: boolean;
  constructor(mensaje: string, readonly reintentable: boolean, o: { uso?: UsoApi; porMaxTokens?: boolean } = {}) {
    super(mensaje);
    this.name = 'ErrorDelModelo';
    if (o.uso) this.uso = o.uso;
    this.porMaxTokens = o.porMaxTokens ?? false;
  }
}

export interface Modelo {
  llamar(p: PedidoModelo): Promise<RespuestaModelo>;
}

export type ResultadoLote = { clave: string; ok: true; respuesta: RespuestaModelo } | { clave: string; ok: false; error: string; uso?: UsoApi };
export interface Lote {
  enviar(grupo: string, pedidos: PedidoModelo[]): Promise<ResultadoLote[]>;
}
