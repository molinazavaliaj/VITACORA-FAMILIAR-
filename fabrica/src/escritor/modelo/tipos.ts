import type { UsoApi } from '../costos.js';

export type Esfuerzo = 'low' | 'medium' | 'high' | 'xhigh' | 'max';
/** Un pedido al modelo: `bloques` = los documentos de la llamada y, al final, las instrucciones. */
export type PedidoModelo = { clave: string; modelo: string; bloques: string[]; cacheEn: number[]; maxTokens: number; esfuerzo: Esfuerzo };
export type RespuestaModelo = { texto: string; uso: UsoApi; motivoFin: string };

export class ErrorDelModelo extends Error {
  constructor(mensaje: string, readonly reintentable: boolean) {
    super(mensaje);
    this.name = 'ErrorDelModelo';
  }
}

export interface Modelo {
  llamar(p: PedidoModelo): Promise<RespuestaModelo>;
}

export type ResultadoLote = { clave: string; ok: true; respuesta: RespuestaModelo } | { clave: string; ok: false; error: string };
export interface Lote {
  enviar(grupo: string, pedidos: PedidoModelo[]): Promise<ResultadoLote[]>;
}
