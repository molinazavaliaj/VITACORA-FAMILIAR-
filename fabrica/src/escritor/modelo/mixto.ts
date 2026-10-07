// fabrica/src/escritor/modelo/mixto.ts
// PRUEBA (07/10/2026): cada pedido va al proveedor de su modelo (Anthropic, DeepSeek o Google). DeepSeek y
// Gemini no van por el Batch de Anthropic: `LoteMixto` los manda directo (en paralelo) y el resto al lote real.
import { ErrorDelModelo, type Lote, type Modelo, type PedidoModelo, type RespuestaModelo, type ResultadoLote } from './tipos.js';

export type Proveedor = 'anthropic' | 'deepseek' | 'google';
export const proveedorDe = (modelo: string): Proveedor => (modelo.startsWith('deepseek') ? 'deepseek' : modelo.startsWith('gemini') ? 'google' : 'anthropic');

export class ModeloMixto implements Modelo {
  constructor(private readonly modelos: Record<Proveedor, Modelo | undefined>) {}
  llamar(p: PedidoModelo): Promise<RespuestaModelo> {
    const prov = proveedorDe(p.modelo);
    const m = this.modelos[prov];
    if (!m) throw new ErrorDelModelo(`no hay cliente para ${prov} (${p.modelo})`, false);
    return m.llamar(p);
  }
}

export class LoteMixto implements Lote {
  constructor(private readonly lote: Lote | undefined, private readonly modelo: Modelo) {}
  async enviar(grupo: string, pedidos: PedidoModelo[]): Promise<ResultadoLote[]> {
    const fuera = pedidos.filter((p) => proveedorDe(p.modelo) !== 'anthropic');
    const an = pedidos.filter((p) => proveedorDe(p.modelo) === 'anthropic');
    const directo = async (p: PedidoModelo): Promise<ResultadoLote> => {
      try {
        return { clave: p.clave, ok: true, respuesta: await this.modelo.llamar(p) };
      } catch (err) {
        const e = err instanceof ErrorDelModelo ? err : null;
        return { clave: p.clave, ok: false, error: (err as Error).message, ...(e?.uso ? { uso: e.uso } : {}), ...(e?.porMaxTokens ? { porMaxTokens: true } : {}) };
      }
    };
    const [rf, ra] = await Promise.all([
      Promise.all(fuera.map(directo)),
      an.length ? (this.lote ? this.lote.enviar(grupo, an) : Promise.all(an.map(directo))) : Promise.resolve([] as ResultadoLote[]),
    ]);
    const por = new Map([...rf, ...ra].map((r) => [r.clave, r]));
    return pedidos.map((p) => por.get(p.clave) ?? { clave: p.clave, ok: false, error: 'sin resultado' });
  }
}
