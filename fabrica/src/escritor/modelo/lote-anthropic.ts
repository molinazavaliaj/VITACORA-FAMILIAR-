// fabrica/src/escritor/modelo/lote-anthropic.ts
// Ahorro (3) del spec: las fases paralelas van por Message Batches (mitad de precio). El id del lote
// queda en el almacén apenas se crea: si el proceso se corta, al retomar se esperan los resultados de
// ese mismo lote en vez de pagar otro, pero solo si cada pedido es el mismo (mismo hash, no solo la misma
// clave): si algo cambió, el lote viejo tiene respuestas a otra cosa y se manda uno nuevo (el id viejo queda
// anotado en `anteriores`). Lo que vuelve con error lo repite el ejecutor sin lote.
import type { Almacen } from '../almacen/tipos.js';
import { aRespuesta, type MensajeApi } from './anthropic.js';
import { armarParams, hashDePedido } from './pedido.js';
import { ErrorDelModelo, type Lote, type PedidoModelo, type ResultadoLote } from './tipos.js';

export type ResultadoApi = { custom_id: string; result: { type: string; message?: MensajeApi; error?: { error?: { message?: string } } } };
export type ClienteLotes = {
  messages: {
    batches: {
      create(b: { requests: { custom_id: string; params: Record<string, unknown> }[] }): Promise<{ id: string }>;
      retrieve(id: string): Promise<{ processing_status: string }>;
      results(id: string): Promise<AsyncIterable<ResultadoApi>>;
    };
  };
};
type EstadoLote = { id: string; claves: string[]; hashes: string[]; anteriores?: string[] };

export class LoteAnthropic implements Lote {
  constructor(
    private readonly cliente: ClienteLotes,
    private readonly almacen: Almacen,
    private readonly o: { esperar?: (ms: number) => Promise<void>; cadaMs?: number; log?: (s: string) => void } = {},
  ) {}

  async enviar(grupo: string, pedidos: PedidoModelo[]): Promise<ResultadoLote[]> {
    const ruta = `lotes/${grupo}.json`;
    const claves = pedidos.map((p) => p.clave);
    const hashes = pedidos.map(hashDePedido);
    const previo = await this.almacen.leer(ruta);
    let estado = previo ? (JSON.parse(previo) as EstadoLote) : null;
    const mismo = estado !== null && estado.claves.join('\n') === claves.join('\n') && (estado.hashes ?? []).join('\n') === hashes.join('\n');
    if (!estado || !mismo) {
      if (estado) this.o.log?.(`lote ${grupo}: los pedidos cambiaron desde el lote ${estado.id}; se manda uno nuevo`);
      const b = await this.cliente.messages.batches.create({ requests: pedidos.map((p, i) => ({ custom_id: `p${i}`, params: armarParams(p) })) });
      const anteriores = estado ? [...(estado.anteriores ?? []), estado.id] : [];
      estado = { id: b.id, claves, hashes, ...(anteriores.length ? { anteriores } : {}) };
      await this.almacen.escribir(ruta, JSON.stringify(estado));
    }
    const esperar = this.o.esperar ?? ((ms: number) => new Promise<void>((r) => setTimeout(r, ms)));
    while ((await this.cliente.messages.batches.retrieve(estado.id)).processing_status !== 'ended') await esperar(this.o.cadaMs ?? 30_000);
    const porClave = new Map<string, ResultadoLote>();
    for await (const r of await this.cliente.messages.batches.results(estado.id)) {
      const clave = estado.claves[Number(r.custom_id.slice(1))];
      if (clave === undefined) continue;
      if (r.result.type === 'succeeded' && r.result.message) {
        try {
          porClave.set(clave, { clave, ok: true, respuesta: aRespuesta(r.result.message) });
        } catch (err) {
          // Un rechazo o un corte dentro del lote también se cobran: el uso va con la falla.
          const uso = err instanceof ErrorDelModelo ? err.uso : undefined;
          const corte = err instanceof ErrorDelModelo && err.porMaxTokens;
          porClave.set(clave, { clave, ok: false, error: (err as Error).message, ...(uso ? { uso } : {}), ...(corte ? { porMaxTokens: true } : {}) });
        }
      } else porClave.set(clave, { clave, ok: false, error: r.result.error?.error?.message ?? r.result.type });
    }
    return claves.map((clave) => porClave.get(clave) ?? { clave, ok: false, error: 'sin resultado en el lote' });
  }
}
